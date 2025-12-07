// ================================================================
// -------------------------- HOME PAGE ---------------------------
// ================================================================

import { useState, useCallback, useEffect, useMemo } from "react";
import type { Route } from "./+types/_index";
import { Link } from "react-router";
import { getAllProcessors } from "~/core/processors";
import { LivePreview } from "~/components/LivePreview";
import { SettingsModal } from "~/components/SettingsModal";
import { ProfileSwitcher } from "~/components/ProfileSwitcher";
import {
    settingsDb,
    isEffectVisible,
    getActiveProfileSettings,
    type AppSettings
} from "~/utils/db";
import type { BaseProcessImage } from "~/core/base-processor";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Neffect | Bulk Image Processing" },
        { name: "description", content: "Open source bulk image processing with effects like dithering" },
    ];
}

function getRandomSettings(processor: BaseProcessImage): Record<string, unknown> {
    const settings: Record<string, unknown> = {};

    for (const setting of processor.settings) {
        if (setting.type === "range" && setting.min !== undefined && setting.max !== undefined) {
            const range = setting.max - setting.min;
            settings[setting.id] = setting.min + Math.random() * range;
        } else if (setting.type === "select" && setting.options) {
            const randomIndex = Math.floor(Math.random() * setting.options.length);
            settings[setting.id] = setting.options[randomIndex].value;
        } else {
            settings[setting.id] = setting.default;
        }
    }

    return settings;
}

export default function HomePage() {
    const allProcessors = getAllProcessors();
    const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [hoveredProcessor, setHoveredProcessor] = useState<BaseProcessImage | null>(null);
    const [previewSettings, setPreviewSettings] = useState<Record<string, unknown> | null>(null);

    // Load settings on mount
    useEffect(() => {
        setAppSettings(settingsDb.get());
    }, []);

    // Filter processors based on settings
    const visibleProcessors = useMemo(() => {
        if (!appSettings) return allProcessors;
        return allProcessors.filter((p) => isEffectVisible(p.config.id));
    }, [allProcessors, appSettings]);

    const handleMouseEnter = useCallback((processor: BaseProcessImage) => {
        setHoveredProcessor(processor);
        const preset = processor.presets[0];
        setPreviewSettings(preset ? preset.settings : getRandomSettings(processor));
    }, []);

    const handleMouseLeave = useCallback(() => {
        setHoveredProcessor(null);
        setPreviewSettings(null);
    }, []);

    const handleSettingsChange = useCallback((newSettings: AppSettings) => {
        setAppSettings(newSettings);
    }, []);

    return (
        <main className="home">
            {/* Header */}
            <header className="home__header">
                {/* Left: Profile Switcher */}
                {appSettings && (
                    <ProfileSwitcher
                        settings={appSettings}
                        onSettingsChange={handleSettingsChange}
                    />
                )}

                {/* Center: Brand */}
                <div className="home__brand">
                    <h1 className="home__logo">Neffect</h1>
                    <p className="home__tagline">Bulk Image Processing</p>
                </div>

                {/* Right: Settings */}
                <button
                    type="button"
                    className="home__settings-btn"
                    onClick={() => setIsSettingsOpen(true)}
                    title="Settings"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                    </svg>
                </button>
            </header>

            {/* Main Content - Split View */}
            <div className="home__content">
                {/* Left: Effects List */}
                <div className="home__sidebar">
                    <h2 className="home__section-title">
                        Choose Effect
                        {appSettings && getActiveProfileSettings().visibleEffects.length > 0 && (
                            <span className="home__filter-badge">
                                {visibleProcessors.length} of {allProcessors.length}
                            </span>
                        )}
                    </h2>
                    <div className="home__effects-list">
                        {visibleProcessors.length === 0 ? (
                            <div className="home__empty">
                                <p>No effects visible</p>
                                <button
                                    type="button"
                                    className="btn btn--secondary btn--sm"
                                    onClick={() => setIsSettingsOpen(true)}
                                >
                                    Open Settings
                                </button>
                            </div>
                        ) : (
                            visibleProcessors.map((processor) => (
                                <Link
                                    key={processor.config.id}
                                    to={`/effect/${processor.config.id}`}
                                    className={`effect-item ${hoveredProcessor?.config.id === processor.config.id ? "effect-item--active" : ""}`}
                                    onMouseEnter={() => handleMouseEnter(processor)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <span className="effect-item__icon">{processor.config.icon}</span>
                                    <div className="effect-item__content">
                                        <h3 className="effect-item__name">{processor.config.name}</h3>
                                        <p className="effect-item__description">{processor.config.description}</p>
                                    </div>
                                    <span className="effect-item__arrow">→</span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Live Preview */}
                <div className="home__preview">
                    <div className="home__preview-header">
                        <span className="home__preview-label">
                            {hoveredProcessor ? `Preview: ${hoveredProcessor.config.name}` : "Hover over effect to preview"}
                        </span>
                    </div>
                    <LivePreview
                        processor={hoveredProcessor}
                        settings={previewSettings}
                        showOriginal={!hoveredProcessor}
                    />
                </div>
            </div>

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onSettingsChange={handleSettingsChange}
            />
        </main>
    );
}
