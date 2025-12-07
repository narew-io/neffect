// ================================================================
// ------------------------- LIVE PREVIEW -------------------------
// ================================================================

import { useEffect, useState, useRef } from "react";
import { getActiveProfileSettings } from "~/utils/db";
import type { BaseProcessImage } from "~/core/base-processor";

interface LivePreviewProps {
    processor: BaseProcessImage | null;
    settings: Record<string, unknown> | null;
    showOriginal?: boolean;
    previewUrl?: string;
}

export function LivePreview({ processor, settings, showOriginal = false, previewUrl }: LivePreviewProps) {
    const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
    const [processedDataUrl, setProcessedDataUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingImage, setIsLoadingImage] = useState(true);
    const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Get the preview URL (from prop or settings)
    const getPreviewUrl = () => {
        if (previewUrl) return previewUrl;
        const profileSettings = getActiveProfileSettings();
        return profileSettings.previewImageUrl;
    };

    // Load original image on mount or when previewUrl changes
    useEffect(() => {
        const loadImage = async () => {
            setIsLoadingImage(true);
            setOriginalImage(null);
            setProcessedDataUrl(null);

            try {
                const img = new Image();
                img.crossOrigin = "anonymous";

                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;

                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    setOriginalImage(imageData);
                    setOriginalDataUrl(canvas.toDataURL("image/png"));
                    setIsLoadingImage(false);
                };

                img.onerror = () => {
                    setIsLoadingImage(false);
                };

                img.src = getPreviewUrl();
            } catch (error) {
                console.error("Failed to load preview image:", error);
                setIsLoadingImage(false);
            }
        };

        loadImage();
    }, [previewUrl]);

    // Process image when processor or settings change
    useEffect(() => {
        if (!originalImage || !processor || !settings || showOriginal) {
            if (showOriginal && originalDataUrl) {
                setProcessedDataUrl(originalDataUrl);
            }
            return;
        }

        const processImage = async () => {
            setIsProcessing(true);
            try {
                // Clone the image data to avoid modifying the original
                const clonedData = new ImageData(
                    new Uint8ClampedArray(originalImage.data),
                    originalImage.width,
                    originalImage.height
                );

                const processed = await processor.process(clonedData, settings);

                // Convert to data URL
                const canvas = document.createElement("canvas");
                canvas.width = processed.width;
                canvas.height = processed.height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.putImageData(processed, 0, 0);
                    setProcessedDataUrl(canvas.toDataURL("image/png"));
                }
            } catch (error) {
                console.error("Failed to process preview:", error);
            } finally {
                setIsProcessing(false);
            }
        };

        processImage();
    }, [originalImage, processor, settings, showOriginal, originalDataUrl]);

    // Show skeleton loader while loading or processing
    const showSkeleton = isLoadingImage || (isProcessing && !processedDataUrl);

    return (
        <div className="live-preview">
            <div className="live-preview__frame">
                {/* Skeleton Loader */}
                {showSkeleton && (
                    <div className="live-preview__skeleton">
                        <div className="live-preview__skeleton-shimmer" />
                        <div className="live-preview__skeleton-content">
                            <div className="live-preview__skeleton-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                </svg>
                            </div>
                            <span className="live-preview__skeleton-text">
                                {isLoadingImage ? "Loading image..." : "Processing..."}
                            </span>
                        </div>
                    </div>
                )}

                {/* Processing overlay on existing image */}
                {isProcessing && processedDataUrl && (
                    <div className="live-preview__processing">
                        <div className="live-preview__spinner" />
                    </div>
                )}

                {/* Processed or Original Image */}
                {!showSkeleton && processedDataUrl && (
                    <img
                        src={processedDataUrl}
                        alt="Preview"
                        className={`live-preview__image ${isProcessing ? "live-preview__image--processing" : ""}`}
                    />
                )}

                {/* Original image fallback */}
                {!showSkeleton && !processedDataUrl && originalDataUrl && (
                    <img
                        src={originalDataUrl}
                        alt="Original"
                        className="live-preview__image live-preview__image--original"
                    />
                )}
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
    );
}
