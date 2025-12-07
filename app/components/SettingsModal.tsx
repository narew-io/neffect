// ================================================================
// ----------------------- SETTINGS MODAL -------------------------
// ================================================================

import { useState, useEffect } from "react";
import { getAllProcessors } from "~/core/processors";
import {
    settingsDb,
    getActiveProfileSettings,
    updateActiveProfileSettings,
    getActiveProfile,
    type AppSettings
} from "~/utils/db";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSettingsChange: (settings: AppSettings) => void;
}

export function SettingsModal({ isOpen, onClose, onSettingsChange }: SettingsModalProps) {
    const processors = getAllProcessors();
    const [appSettings, setAppSettings] = useState<AppSettings>(settingsDb.get);
    const [enabledEffects, setEnabledEffects] = useState<Record<string, boolean>>({});
    const [previewUrl, setPreviewUrl] = useState<string>("");

    // Initialize from settings
    useEffect(() => {
        const currentSettings = settingsDb.get();
        setAppSettings(currentSettings);

        const profileSettings = getActiveProfileSettings();
        setPreviewUrl(profileSettings.previewImageUrl);

        const enabled: Record<string, boolean> = {};
        processors.forEach((p) => {
            enabled[p.config.id] =
                profileSettings.visibleEffects.length === 0 ||
                profileSettings.visibleEffects.includes(p.config.id);
        });
        setEnabledEffects(enabled);
    }, [isOpen, processors]);

    const handleToggleEffect = (effectId: string) => {
        setEnabledEffects((prev) => ({
            ...prev,
            [effectId]: !prev[effectId],
        }));
    };

    const handleSave = () => {
        // Get list of enabled effect IDs
        const visibleEffects = Object.entries(enabledEffects)
            .filter(([_, enabled]) => enabled)
            .map(([id]) => id);

        // If all are enabled, save empty array (means "show all")
        const allEnabled = processors.every((p) => enabledEffects[p.config.id]);

        const newSettings = updateActiveProfileSettings({
            visibleEffects: allEnabled ? [] : visibleEffects,
            previewImageUrl: previewUrl,
        });

        onSettingsChange(newSettings);
        onClose();
    };

    const activeProfile = getActiveProfile();

    const handleSelectAll = () => {
        const all: Record<string, boolean> = {};
        processors.forEach((p) => {
            all[p.config.id] = true;
        });
        setEnabledEffects(all);
    };

    const handleDeselectAll = () => {
        const none: Record<string, boolean> = {};
        processors.forEach((p) => {
            none[p.config.id] = false;
        });
        setEnabledEffects(none);
    };

    if (!isOpen) return null;

    const enabledCount = Object.values(enabledEffects).filter(Boolean).length;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal__header">
                    <h2 className="modal__title">
                        Settings
                        {activeProfile && (
                            <span className="modal__subtitle"> - {activeProfile.name}</span>
                        )}
                    </h2>
                    <button type="button" className="modal__close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="modal__content">
                    {/* Preview Image Section */}
                    <section className="settings-section">
                        <h3 className="settings-section__title">Preview Image</h3>
                        <p className="settings-section__description">
                            URL to the image used for effect previews
                        </p>
                        <input
                            type="url"
                            className="settings-input"
                            value={previewUrl}
                            onChange={(e) => setPreviewUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                        />
                    </section>

                    {/* Effects Filter Section */}
                    <section className="settings-section">
                        <div className="settings-section__header">
                            <h3 className="settings-section__title">Visible Effects</h3>
                            <span className="settings-section__count">
                                {enabledCount} of {processors.length} selected
                            </span>
                        </div>
                        <p className="settings-section__description">
                            Choose which effects appear on the home page
                        </p>

                        <div className="settings-section__actions">
                            <button type="button" className="btn btn--text btn--sm" onClick={handleSelectAll}>
                                Select All
                            </button>
                            <button type="button" className="btn btn--text btn--sm" onClick={handleDeselectAll}>
                                Deselect All
                            </button>
                        </div>

                        <div className="effects-filter">
                            {processors.map((processor) => (
                                <label key={processor.config.id} className="effect-toggle">
                                    <input
                                        type="checkbox"
                                        checked={enabledEffects[processor.config.id] || false}
                                        onChange={() => handleToggleEffect(processor.config.id)}
                                    />
                                    <span className="effect-toggle__checkmark" />
                                    <span className="effect-toggle__content">
                                        <span className="effect-toggle__name">{processor.config.name}</span>
                                        <span className="effect-toggle__description">{processor.config.description}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="modal__footer">
                    <button type="button" className="btn btn--secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn--primary"
                        onClick={handleSave}
                        disabled={enabledCount === 0}
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
