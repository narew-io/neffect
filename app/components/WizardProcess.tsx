// ================================================================
// ----------------------- WIZARD PROCESS -------------------------
// ================================================================

import { useState } from "react";
import type { BatchProgress } from "~/core/base-processor";

export interface ProcessedImage {
    filename: string;
    dataUrl: string;
}

interface WizardProcessProps {
    isProcessing: boolean;
    progress: BatchProgress | null;
    results: ProcessedImage[];
    onDownload: (result: ProcessedImage) => void;
    onDownloadAll: () => void;
}

export function WizardProcess({ isProcessing, progress, results, onDownload, onDownloadAll }: WizardProcessProps) {
    const [previewImage, setPreviewImage] = useState<ProcessedImage | null>(null);

    return (
        <div className="wizard-process">
            <h2 className="wizard-process__title">{isProcessing ? "Processing..." : "Complete!"}</h2>

            {/* Progress Bar */}
            {isProcessing && progress && (
                <div className="process-progress">
                    <div className="process-progress__bar">
                        <div
                            className="process-progress__fill"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                    </div>
                    <p className="process-progress__text">
                        Processing {progress.current} of {progress.total}: {progress.filename}
                    </p>
                </div>
            )}

            {/* Results */}
            {!isProcessing && results.length > 0 && (
                <div className="process-results">
                    <div className="process-results__summary">
                        <span className="process-results__success">✓ {results.length} images processed</span>
                    </div>

                    {results.length > 1 && (
                        <button type="button" className="btn btn--primary" onClick={onDownloadAll}>
                            Download All
                        </button>
                    )}

                    <div className="process-results__grid">
                        {results.map((result, index) => (
                            <div key={index} className="result-item">
                                <img
                                    src={result.dataUrl}
                                    alt={result.filename}
                                    className="result-item__preview"
                                    onClick={() => setPreviewImage(result)}
                                />
                                <div className="result-item__info">
                                    <span className="result-item__name">{result.filename}</span>
                                    <button type="button" className="btn btn--sm" onClick={() => onDownload(result)}>
                                        Download
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="image-preview-modal" onClick={() => setPreviewImage(null)}>
                    <div className="image-preview-modal__content" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="image-preview-modal__close"
                            onClick={() => setPreviewImage(null)}
                        >
                            ✕
                        </button>
                        <img
                            src={previewImage.dataUrl}
                            alt={previewImage.filename}
                            className="image-preview-modal__image"
                        />
                        <div className="image-preview-modal__footer">
                            <span className="image-preview-modal__name">{previewImage.filename}</span>
                            <button
                                type="button"
                                className="btn btn--primary btn--sm"
                                onClick={() => onDownload(previewImage)}
                            >
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
