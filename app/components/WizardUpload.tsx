// ================================================================
// ------------------------ WIZARD UPLOAD -------------------------
// ================================================================

import { useCallback, useState } from "react";

export interface UploadedFile {
    file: File;
    preview: string;
}

interface WizardUploadProps {
    files: UploadedFile[];
    onFilesChange: (files: UploadedFile[]) => void;
}

export function WizardUpload({ files, onFilesChange }: WizardUploadProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleFiles = useCallback(
        (newFiles: FileList | null) => {
            if (!newFiles) return;
            const imageFiles = Array.from(newFiles).filter((file) => file.type.startsWith("image/"));
            const uploadedFiles: UploadedFile[] = imageFiles.map((file) => ({
                file,
                preview: URL.createObjectURL(file),
            }));
            onFilesChange([...files, ...uploadedFiles]);
        },
        [files, onFilesChange]
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

    return (
        <div className="wizard-upload">
            <h2 className="wizard-upload__title">Upload Images</h2>
            <p className="wizard-upload__subtitle">Drag & drop images or click to browse</p>

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
                    accept="image/*"
                    className="upload-zone__input"
                    onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="upload-zone__content">
                    <span className="upload-zone__icon">📁</span>
                    <span className="upload-zone__text">Drop images here or click to browse</span>
                    <span className="upload-zone__hint">Supports: JPG, PNG, WebP, GIF</span>
                </div>
            </label>

            {/* File Preview Grid */}
            {files.length > 0 && (
                <div className="upload-preview">
                    <div className="upload-preview__header">
                        <span>{files.length} image(s) selected</span>
                        <button type="button" className="btn btn--text" onClick={() => onFilesChange([])}>
                            Clear all
                        </button>
                    </div>
                    <div className="upload-preview__grid">
                        {files.map((file, index) => (
                            <div key={index} className="upload-preview__item">
                                <img src={file.preview} alt={file.file.name} />
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
