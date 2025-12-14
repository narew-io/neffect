// ================================================================
// ------------------------ WIZARD UPLOAD -------------------------
// ================================================================

import { useCallback, useState } from "react";

export type FileType = "image" | "video";

export interface UploadedFile {
    file: File;
    preview: string;
    type: FileType;
}

interface WizardUploadProps {
    files: UploadedFile[];
    onFilesChange: (files: UploadedFile[]) => void;
    mp4support?: boolean;
}

const VIDEO_EXTENSIONS = ["mp4", "webm", "mov", "avi", "mkv"];
const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska"];

export function WizardUpload({ files, onFilesChange, mp4support = false }: WizardUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [urlInput, setUrlInput] = useState("");
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);
    const [urlError, setUrlError] = useState<string | null>(null);

    const isVideoFile = (file: File): boolean => {
        return file.type.startsWith("video/") || VIDEO_MIME_TYPES.includes(file.type);
    };

    const isImageFile = (file: File): boolean => {
        return file.type.startsWith("image/");
    };

    const handleFiles = useCallback(
        (newFiles: FileList | null) => {
            if (!newFiles) return;
            const validFiles = Array.from(newFiles).filter((file) => {
                if (isImageFile(file)) return true;
                if (mp4support && isVideoFile(file)) return true;
                return false;
            });
            const uploadedFiles: UploadedFile[] = validFiles.map((file) => ({
                file,
                preview: URL.createObjectURL(file),
                type: isVideoFile(file) ? "video" : "image",
            }));
            onFilesChange([...files, ...uploadedFiles]);
        },
        [files, onFilesChange, mp4support]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
        },
        [handleFiles]
    );

    const removeFile = useCallback(
        (index: number) => {
            const newFiles = [...files];
            URL.revokeObjectURL(newFiles[index].preview);
            newFiles.splice(index, 1);
            onFilesChange(newFiles);
        },
        [files, onFilesChange]
    );

    const handleAddFromUrl = useCallback(async () => {
        if (!urlInput.trim()) return;

        setIsLoadingUrl(true);
        setUrlError(null);

        try {
            // Fetch the image
            const response = await fetch(urlInput);
            if (!response.ok) throw new Error("Failed to fetch image");

            const blob = await response.blob();
            if (!blob.type.startsWith("image/")) {
                throw new Error("URL does not point to an image");
            }

            // Create a File from the blob
            const filename = urlInput.split("/").pop()?.split("?")[0] || "image-from-url.jpg";
            const file = new File([blob], filename, { type: blob.type });

            const uploadedFile: UploadedFile = {
                file,
                preview: URL.createObjectURL(blob),
                type: "image",
            };

            onFilesChange([...files, uploadedFile]);
            setUrlInput("");
        } catch (error) {
            setUrlError(error instanceof Error ? error.message : "Failed to load image");
        } finally {
            setIsLoadingUrl(false);
        }
    }, [urlInput, files, onFilesChange]);

    return (
        <div className="wizard-upload">
            <h2 className="wizard-upload__title">
                {mp4support ? "Upload Images or Videos" : "Upload Images"}
            </h2>
            <p className="wizard-upload__subtitle">
                {mp4support
                    ? "Add images or videos from your computer or from a URL"
                    : "Add images from your computer or from a URL"}
            </p>

            {/* Drop Zone */}
            <label
                className={`upload-zone ${isDragging ? "upload-zone--active" : ""}`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            >
                <input
                    type="file"
                    multiple
                    accept={mp4support ? "image/*,video/*" : "image/*"}
                    className="upload-zone__input"
                    onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="upload-zone__content">
                    <span className="upload-zone__icon">📁</span>
                    <span className="upload-zone__text">
                        {mp4support
                            ? "Drop images or videos here or click to browse"
                            : "Drop images here or click to browse"}
                    </span>
                    <span className="upload-zone__hint">
                        {mp4support
                            ? "Supports: JPG, PNG, WebP, GIF, MP4, WebM"
                            : "Supports: JPG, PNG, WebP, GIF"}
                    </span>
                </div>
            </label>

            {/* URL Input */}
            <div className="upload-url">
                <div className="upload-url__divider">
                    <span>or add from URL</span>
                </div>
                <div className="upload-url__input-group">
                    <input
                        type="url"
                        className="upload-url__input"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        onKeyDown={(e) => e.key === "Enter" && handleAddFromUrl()}
                    />
                    <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={handleAddFromUrl}
                        disabled={isLoadingUrl || !urlInput.trim()}
                    >
                        {isLoadingUrl ? "Loading..." : "Add"}
                    </button>
                </div>
                {urlError && <p className="upload-url__error">{urlError}</p>}
            </div>

            {/* File Preview Grid */}
            {files.length > 0 && (
                <div className="upload-preview">
                    <div className="upload-preview__header">
                        <span>
                            {files.length} file(s) selected
                            {mp4support && (
                                <span className="upload-preview__counts">
                                    {" "}({files.filter(f => f.type === "image").length} images, {files.filter(f => f.type === "video").length} videos)
                                </span>
                            )}
                        </span>
                        <button type="button" className="btn btn--text" onClick={() => onFilesChange([])}>
                            Clear all
                        </button>
                    </div>
                    <div className="upload-preview__grid">
                        {files.map((file, index) => (
                            <div key={index} className={`upload-preview__item ${file.type === "video" ? "upload-preview__item--video" : ""}`}>
                                {file.type === "video" ? (
                                    <video src={file.preview} muted />
                                ) : (
                                    <img src={file.preview} alt={file.file.name} />
                                )}
                                {file.type === "video" && (
                                    <span className="upload-preview__video-badge">🎬</span>
                                )}
                                <button type="button" className="upload-preview__remove" onClick={() => removeFile(index)}>
                                    ×
                                </button>
                                <span className="upload-preview__name">{file.file.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
