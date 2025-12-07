// ================================================================
// ------------------------- EFFECT PAGE --------------------------
// ================================================================

import { useState, useCallback } from "react";
import { Link, useParams } from "react-router";
import type { Route } from "./+types/effect.$effectId";
import { getProcessor } from "~/core/processors";
import type { BatchProgress, ProcessorPreset } from "~/core/base-processor";
import { WizardUpload, type UploadedFile } from "~/components/WizardUpload";
import { WizardProcess, type ProcessedImage } from "~/components/WizardProcess";
import { LivePreview } from "~/components/LivePreview";

export function meta({ params }: Route.MetaArgs) {
    const processor = getProcessor(params.effectId || "");
    return [{ title: `${processor?.config.name || "Effect"} - neffect` }];
}

type WizardStep = "config" | "upload" | "process";

export default function EffectPage() {
    const { effectId } = useParams();
    const processor = getProcessor(effectId || "");

    const [step, setStep] = useState<WizardStep>("config");
    const [selectedPreset, setSelectedPreset] = useState<string | null>(processor?.presets[0]?.id || null);
    const [settings, setSettings] = useState<Record<string, unknown>>(
        processor?.presets[0]?.settings || processor?.getDefaultSettings() || {}
    );
    const [hoveredPreset, setHoveredPreset] = useState<ProcessorPreset | null>(null);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<BatchProgress | null>(null);
    const [results, setResults] = useState<ProcessedImage[]>([]);

    if (!processor) {
        return (
            <main className="effect-page">
                <div className="effect-page__error">
                    <h1>Effect not found</h1>
                    <Link to="/" className="btn btn--secondary">Back to Home</Link>
                </div>
            </main>
        );
    }

    const handlePresetSelect = useCallback(
        (presetId: string) => {
            setSelectedPreset(presetId);
            const preset = processor.getPreset(presetId);
            if (preset) setSettings(preset.settings);
        },
        [processor]
    );

    const handlePresetHover = useCallback((preset: ProcessorPreset | null) => {
        setHoveredPreset(preset);
    }, []);

    const handleSettingChange = useCallback((id: string, value: unknown) => {
        setSettings((prev) => ({ ...prev, [id]: value }));
        setSelectedPreset(null); // Deselect preset when manually changing settings
    }, []);

    const loadImageData = async (file: File): Promise<ImageData> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) return reject(new Error("Could not get canvas context"));
                ctx.drawImage(img, 0, 0);
                resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    };

    const imageDataToDataUrl = (imageData: ImageData): string => {
        const canvas = document.createElement("canvas");
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return "";
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL("image/png");
    };

    const handleProcess = useCallback(async () => {
        if (files.length === 0) return;
        setStep("process");
        setIsProcessing(true);
        setResults([]);

        const processedResults: ProcessedImage[] = [];

        for (let i = 0; i < files.length; i++) {
            const { file } = files[i];
            setProgress({ current: i + 1, total: files.length, filename: file.name });

            const imageData = await loadImageData(file);
            const processed = await processor.process(imageData, settings);
            const dataUrl = imageDataToDataUrl(processed);

            processedResults.push({ filename: file.name.replace(/\.[^.]+$/, ".png"), dataUrl });
        }

        setResults(processedResults);
        setIsProcessing(false);
    }, [files, processor, settings]);

    const handleDownload = useCallback((result: ProcessedImage) => {
        const a = document.createElement("a");
        a.href = result.dataUrl;
        a.download = `processed_${result.filename}`;
        a.click();
    }, []);

    const handleDownloadAll = useCallback(() => {
        results.forEach(handleDownload);
    }, [results, handleDownload]);

    // Get preview settings (hovered preset or current settings)
    const previewSettings = hoveredPreset ? hoveredPreset.settings : settings;

    return (
        <main className="effect-page">
            {/* Header */}
            <header className="effect-page__header">
                <Link to="/" className="effect-page__back">← Back</Link>
                <div className="effect-page__info">
                    <span className="effect-page__icon">{processor.config.icon}</span>
                    <h1 className="effect-page__title">{processor.config.name}</h1>
                </div>
                <div className="effect-page__actions">
                    {step === "config" && (
                        <button
                            type="button"
                            className="btn btn--primary"
                            onClick={() => setStep("upload")}
                        >
                            Continue to Upload →
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            {step === "config" && (
                <div className="effect-page__split">
                    {/* Left: Config Panel */}
                    <div className="effect-page__sidebar">
                        {/* Presets Section */}
                        <section className="config-section">
                            <h2 className="config-section__title">Presets</h2>
                            <div className="presets-list">
                                {processor.presets.map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        className={`preset-item ${selectedPreset === preset.id ? "preset-item--active" : ""}`}
                                        onClick={() => handlePresetSelect(preset.id)}
                                        onMouseEnter={() => handlePresetHover(preset)}
                                        onMouseLeave={() => handlePresetHover(null)}
                                    >
                                        <span className="preset-item__name">{preset.name}</span>
                                        <span className="preset-item__description">{preset.description}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Settings Section */}
                        <section className="config-section">
                            <h2 className="config-section__title">
                                Settings
                                {selectedPreset && <span className="config-section__badge">Preset</span>}
                            </h2>
                            <div className="settings-list">
                                {processor.settings.map((setting) => (
                                    <div key={setting.id} className="setting-item">
                                        <label className="setting-item__label" htmlFor={setting.id}>
                                            {setting.label}
                                        </label>

                                        {setting.type === "range" && (
                                            <div className="setting-item__range">
                                                <input
                                                    type="range"
                                                    id={setting.id}
                                                    min={setting.min}
                                                    max={setting.max}
                                                    step={setting.step}
                                                    value={settings[setting.id] as number}
                                                    onChange={(e) => handleSettingChange(setting.id, Number(e.target.value))}
                                                />
                                                <span className="setting-item__value">{settings[setting.id] as number}</span>
                                            </div>
                                        )}

                                        {setting.type === "select" && (
                                            <select
                                                id={setting.id}
                                                className="setting-item__select"
                                                value={settings[setting.id] as string}
                                                onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                                            >
                                                {setting.options?.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right: Live Preview */}
                    <div className="effect-page__preview">
                        <div className="effect-page__preview-header">
                            <span className="effect-page__preview-label">
                                {hoveredPreset ? `Preview: ${hoveredPreset.name}` : "Live Preview"}
                            </span>
                        </div>
                        <LivePreview processor={processor} settings={previewSettings} />
                    </div>
                </div>
            )}

            {step === "upload" && (
                <div className="effect-page__full">
                    <div className="effect-page__upload-container">
                        <WizardUpload files={files} onFilesChange={setFiles} />
                        <div className="effect-page__upload-actions">
                            <button type="button" className="btn btn--secondary" onClick={() => setStep("config")}>
                                ← Back to Settings
                            </button>
                            <button
                                type="button"
                                className="btn btn--primary"
                                onClick={handleProcess}
                                disabled={files.length === 0}
                            >
                                Process {files.length} Image{files.length !== 1 ? "s" : ""}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === "process" && (
                <div className="effect-page__full">
                    <div className="effect-page__process-container">
                        <WizardProcess
                            isProcessing={isProcessing}
                            progress={progress}
                            results={results}
                            onDownload={handleDownload}
                            onDownloadAll={handleDownloadAll}
                        />
                        {!isProcessing && (
                            <div className="effect-page__process-actions">
                                <button type="button" className="btn btn--secondary" onClick={() => { setStep("upload"); setResults([]); }}>
                                    ← Upload More
                                </button>
                                <Link to="/" className="btn btn--primary">Start Over</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
