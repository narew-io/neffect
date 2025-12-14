// ================================================================
// ------------------------- EFFECT PAGE --------------------------
// ================================================================

import { useState, useCallback } from "react";
import { Link, redirect } from "react-router";
import type { Route } from "./+types/effect.$effectId";
import { getProcessor } from "~/core/processors";
import {
    BASE_SETTINGS_DEFINITIONS,
    getDefaultBaseSettings,
    applyBaseSettings,
    type BaseSettings,
    type BatchProgress,
    type ProcessorPreset,
    type SettingDefinition,
} from "~/core/base-processor";
import { WizardUpload, type UploadedFile, type FileType } from "~/components/WizardUpload";
import { WizardProcess, type ProcessedImage, type ProcessedFileType } from "~/components/WizardProcess";
import { LivePreview } from "~/components/LivePreview";

// ================================================================
// -------------------------- META --------------------------------
// ================================================================

export function meta({ params }: Route.MetaArgs) {
    const processor = getProcessor(params.effectId || "");
    return [{ title: `Neffect | ${processor?.config.name || "Effect"}` }];
}

// ================================================================
// ----------------------- CLIENT LOADER --------------------------
// ================================================================

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
    const processor = getProcessor(params.effectId || "");

    if (!processor) {
        // Redirect to home if processor not found
        throw redirect("/");
    }

    const firstPreset = processor.presets[0];
    return {
        effectId: params.effectId,
        processorConfig: processor.config,
        presets: processor.presets,
        settings: processor.settings,
        defaultPresetId: firstPreset?.id || null,
        defaultSettings: firstPreset?.settings || processor.getDefaultSettings(),
        defaultBaseSettings: firstPreset?.baseSettings || null,
    };
}

// HydrateFallback is shown while clientLoader runs
export function HydrateFallback() {
    return (
        <main className="effect-page">
            <div className="effect-page__loading">
                <div className="effect-page__loading-spinner" />
                <p>Loading effect...</p>
            </div>
        </main>
    );
}

// ================================================================
// ------------------------- COMPONENT ----------------------------
// ================================================================

type WizardStep = "config" | "upload" | "process";

export default function EffectPage({ loaderData }: Route.ComponentProps) {
    const { effectId, defaultPresetId, defaultSettings, defaultBaseSettings } = loaderData;
    const processor = getProcessor(effectId || "")!;

    const [step, setStep] = useState<WizardStep>("config");
    const [selectedPreset, setSelectedPreset] = useState<string | null>(defaultPresetId);
    const [settings, setSettings] = useState<Record<string, unknown>>(defaultSettings);
    const [baseSettings, setBaseSettings] = useState<BaseSettings>(
        defaultBaseSettings ? { ...getDefaultBaseSettings(), ...defaultBaseSettings } : getDefaultBaseSettings()
    );
    const [baseSettingsExpanded, setBaseSettingsExpanded] = useState(true);
    const [hoveredPreset, setHoveredPreset] = useState<ProcessorPreset | null>(null);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<BatchProgress | null>(null);
    const [results, setResults] = useState<ProcessedImage[]>([]);

    const handlePresetSelect = useCallback(
        (presetId: string) => {
            setSelectedPreset(presetId);
            const preset = processor.getPreset(presetId);
            if (preset) {
                setSettings(preset.settings);
                // Apply baseSettings from preset if defined
                if (preset.baseSettings) {
                    setBaseSettings({ ...getDefaultBaseSettings(), ...preset.baseSettings });
                }
            }
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

    const handleBaseSettingChange = useCallback((id: string, value: unknown) => {
        setBaseSettings((prev) => ({ ...prev, [id]: value }));
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

    /* SCALE IMAGE DATA TO TARGET SIZE */
    const scaleImageData = (imageData: ImageData, targetWidth: number, targetHeight: number): ImageData => {
        const sourceCanvas = document.createElement("canvas");
        sourceCanvas.width = imageData.width;
        sourceCanvas.height = imageData.height;
        const sourceCtx = sourceCanvas.getContext("2d");
        if (!sourceCtx) return imageData;
        sourceCtx.putImageData(imageData, 0, 0);

        const targetCanvas = document.createElement("canvas");
        targetCanvas.width = targetWidth;
        targetCanvas.height = targetHeight;
        const targetCtx = targetCanvas.getContext("2d");
        if (!targetCtx) return imageData;

        // Use nearest-neighbor scaling to preserve pixelated look
        targetCtx.imageSmoothingEnabled = false;
        targetCtx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

        return targetCtx.getImageData(0, 0, targetWidth, targetHeight);
    };

    /* VIDEO PROCESSING */
    const processVideo = async (
        file: File,
        onFrameProgress?: (current: number, total: number) => void
    ): Promise<{ dataUrl: string; blob: Blob }> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement("video");
            video.playsInline = true;
            video.preload = "auto";
            const videoUrl = URL.createObjectURL(file);
            video.src = videoUrl;

            video.onloadedmetadata = async () => {
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                if (!ctx) return reject(new Error("Could not get canvas context"));

                const fps = 30;
                const duration = video.duration;
                const totalFrames = Math.floor(duration * fps);
                const frameInterval = 1 / fps;

                const processedFrames: ImageData[] = [];
                const originalWidth = video.videoWidth;
                const originalHeight = video.videoHeight;

                // Phase 1: Extract and process all frames
                for (let i = 0; i < totalFrames; i++) {
                    video.currentTime = i * frameInterval;
                    await new Promise<void>((res) => {
                        const handler = () => {
                            video.removeEventListener("seeked", handler);
                            res();
                        };
                        video.addEventListener("seeked", handler);
                    });

                    ctx.drawImage(video, 0, 0);
                    const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const processed = await processor.process(frameData, settings);
                    let final = applyBaseSettings(frameData, processed, baseSettings);

                    // Scale to original resolution if requested
                    if (baseSettings.keep_original_resolution &&
                        (final.width !== originalWidth || final.height !== originalHeight)) {
                        final = scaleImageData(final, originalWidth, originalHeight);
                    }

                    processedFrames.push(final);
                    onFrameProgress?.(i + 1, totalFrames);
                }

                // Determine output size based on first processed frame
                const outputWidth = processedFrames[0]?.width || originalWidth;
                const outputHeight = processedFrames[0]?.height || originalHeight;

                // Phase 2: Create output video with audio
                const outputCanvas = document.createElement("canvas");
                outputCanvas.width = outputWidth;
                outputCanvas.height = outputHeight;
                const outputCtx = outputCanvas.getContext("2d");
                if (!outputCtx) return reject(new Error("Could not get output canvas context"));

                // Get video stream from canvas
                const videoStream = outputCanvas.captureStream(fps);

                // Try to get audio from original video
                let combinedStream: MediaStream;
                try {
                    // Create audio context and extract audio
                    const audioCtx = new AudioContext();
                    const audioSource = audioCtx.createMediaElementSource(video);
                    const audioDestination = audioCtx.createMediaStreamDestination();
                    audioSource.connect(audioDestination);
                    audioSource.connect(audioCtx.destination); // Keep audio playing

                    // Combine video and audio streams
                    const audioTrack = audioDestination.stream.getAudioTracks()[0];
                    if (audioTrack) {
                        combinedStream = new MediaStream([
                            ...videoStream.getVideoTracks(),
                            audioTrack,
                        ]);
                    } else {
                        combinedStream = videoStream;
                    }
                } catch {
                    // If audio extraction fails, just use video stream
                    combinedStream = videoStream;
                }

                // Try different codecs for better compatibility
                let mimeType = "video/webm;codecs=vp9,opus";
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = "video/webm;codecs=vp8,opus";
                }
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = "video/webm";
                }

                const mediaRecorder = new MediaRecorder(combinedStream, {
                    mimeType,
                    videoBitsPerSecond: 8000000,
                });

                const chunks: Blob[] = [];
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunks.push(e.data);
                };

                // Phase 3: Render frames in real-time with audio sync
                const renderPromise = new Promise<void>((resolveRender) => {
                    mediaRecorder.onstop = () => resolveRender();
                });

                mediaRecorder.start(100); // Collect data every 100ms for smoother output

                // Reset video for audio playback
                video.muted = false;
                video.currentTime = 0;
                video.playbackRate = 1;

                // Play video for audio while rendering processed frames
                const playPromise = video.play().catch(() => {
                    // If autoplay fails, continue without audio
                    video.muted = true;
                    return video.play();
                });

                await playPromise;

                const startTime = performance.now();
                const frameDuration = 1000 / fps;

                for (let i = 0; i < processedFrames.length; i++) {
                    const targetTime = startTime + i * frameDuration;
                    const now = performance.now();
                    const delay = Math.max(0, targetTime - now);

                    if (delay > 0) {
                        await new Promise((res) => setTimeout(res, delay));
                    }

                    outputCtx.putImageData(processedFrames[i], 0, 0);
                }

                // Wait a bit for the last frame to be captured
                await new Promise((res) => setTimeout(res, 100));

                video.pause();
                mediaRecorder.stop();

                await renderPromise;

                const blob = new Blob(chunks, { type: "video/webm" });
                const dataUrl = URL.createObjectURL(blob);
                URL.revokeObjectURL(videoUrl);

                resolve({ dataUrl, blob });
            };

            video.onerror = () => {
                URL.revokeObjectURL(videoUrl);
                reject(new Error("Failed to load video"));
            };
        });
    };

    const handleProcess = useCallback(async () => {
        if (files.length === 0) return;
        setStep("process");
        setIsProcessing(true);
        setResults([]);

        const processedResults: ProcessedImage[] = [];

        for (let i = 0; i < files.length; i++) {
            const { file, type: fileType } = files[i];
            setProgress({ current: i + 1, total: files.length, filename: file.name });

            if (fileType === "video") {
                // Process video frame by frame
                try {
                    const { dataUrl, blob } = await processVideo(file, (current, total) => {
                        setProgress({
                            current: i + 1,
                            total: files.length,
                            filename: `${file.name} (frame ${current}/${total})`,
                        });
                    });
                    processedResults.push({
                        filename: file.name.replace(/\.[^.]+$/, ".webm"),
                        dataUrl,
                        type: "video",
                        blob,
                    });
                } catch (error) {
                    console.error("Video processing error:", error);
                }
            } else {
                // Process image
                const imageData = await loadImageData(file);
                const originalWidth = imageData.width;
                const originalHeight = imageData.height;

                const processed = await processor.process(imageData, settings);
                let finalImage = applyBaseSettings(imageData, processed, baseSettings);

                // Scale to original resolution if requested
                if (baseSettings.keep_original_resolution &&
                    (finalImage.width !== originalWidth || finalImage.height !== originalHeight)) {
                    finalImage = scaleImageData(finalImage, originalWidth, originalHeight);
                }

                const dataUrl = imageDataToDataUrl(finalImage);

                processedResults.push({
                    filename: file.name.replace(/\.[^.]+$/, ".png"),
                    dataUrl,
                    type: "image",
                });
            }
        }

        setResults(processedResults);
        setIsProcessing(false);
    }, [files, processor, settings, baseSettings]);

    const handleDownload = useCallback((result: ProcessedImage) => {
        const a = document.createElement("a");
        if (result.blob) {
            // For video files, use blob URL
            a.href = URL.createObjectURL(result.blob);
        } else {
            a.href = result.dataUrl;
        }
        a.download = `processed_${result.filename}`;
        a.click();
    }, []);

    const handleDownloadAll = useCallback(() => {
        results.forEach(handleDownload);
    }, [results, handleDownload]);

    // Get preview settings (hovered preset or current settings)
    const previewSettings = hoveredPreset ? hoveredPreset.settings : settings;
    const previewBaseSettings = hoveredPreset?.baseSettings
        ? { ...getDefaultBaseSettings(), ...hoveredPreset.baseSettings }
        : baseSettings;

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

                        {/* Base Settings Section (Collapsible) */}
                        <section className={`config-section config-section--collapsible ${baseSettingsExpanded ? "config-section--expanded" : ""}`}>
                            <button
                                type="button"
                                className="config-section__header"
                                onClick={() => setBaseSettingsExpanded(!baseSettingsExpanded)}
                            >
                                <h2 className="config-section__title">Base Settings</h2>
                                <span className="config-section__toggle">
                                    {baseSettingsExpanded ? "−" : "+"}
                                </span>
                            </button>
                            {baseSettingsExpanded && (
                                <div className="settings-list">
                                    {BASE_SETTINGS_DEFINITIONS.map((setting: SettingDefinition) => (
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
                                                        value={baseSettings[setting.id] as number}
                                                        onChange={(e) => handleBaseSettingChange(setting.id, Number(e.target.value))}
                                                    />
                                                    <input
                                                        type="number"
                                                        className="setting-item__number"
                                                        min={setting.min}
                                                        max={setting.max}
                                                        step={setting.step}
                                                        value={baseSettings[setting.id] as number}
                                                        onChange={(e) => {
                                                            const val = Number(e.target.value);
                                                            const min = setting.min ?? 0;
                                                            const max = setting.max ?? 100;
                                                            const clamped = Math.min(max, Math.max(min, val));
                                                            handleBaseSettingChange(setting.id, clamped);
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {setting.type === "checkbox" && (
                                                <label className="setting-item__checkbox">
                                                    <input
                                                        type="checkbox"
                                                        id={setting.id}
                                                        checked={baseSettings[setting.id] as boolean}
                                                        onChange={(e) => handleBaseSettingChange(setting.id, e.target.checked)}
                                                    />
                                                    <span className="setting-item__checkbox-label">{setting.description}</span>
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Settings Section */}
                        <section className="config-section">
                            <h2 className="config-section__title">
                                Settings
                                {selectedPreset && <span className="config-section__badge">Preset</span>}
                            </h2>
                            <div className="settings-list">
                                {processor.settings.map((setting) => {
                                    const isDisabled = setting.id === "inputResolution" && baseSettings.keep_original_resolution;
                                    return (
                                        <div key={setting.id} className={`setting-item ${isDisabled ? "setting-item--disabled" : ""}`}>
                                            <label className="setting-item__label" htmlFor={setting.id}>
                                                {setting.label}
                                                {isDisabled && <span className="setting-item__disabled-hint">(using original)</span>}
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
                                                        disabled={isDisabled}
                                                    />
                                                    <input
                                                        type="number"
                                                        className="setting-item__number"
                                                        min={setting.min}
                                                        max={setting.max}
                                                        step={setting.step}
                                                        value={settings[setting.id] as number}
                                                        onChange={(e) => {
                                                            const val = Number(e.target.value);
                                                            const min = setting.min ?? 0;
                                                            const max = setting.max ?? 100;
                                                            const clamped = Math.min(max, Math.max(min, val));
                                                            handleSettingChange(setting.id, clamped);
                                                        }}
                                                        disabled={isDisabled}
                                                    />
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
                                    );
                                })}
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
                        <LivePreview processor={processor} settings={previewSettings} baseSettings={previewBaseSettings} />
                    </div>
                </div>
            )}

            {step === "upload" && (
                <div className="effect-page__full">
                    <div className="effect-page__upload-container">
                        <WizardUpload files={files} onFilesChange={setFiles} mp4support={processor.config.mp4support} />
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
