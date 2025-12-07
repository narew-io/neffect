// ================================================================
// ------------------------ WIZARD PRESETS ------------------------
// ================================================================

import type { ProcessorPreset } from "~/core/base-processor";

interface WizardPresetsProps {
    presets: ProcessorPreset[];
    selectedPreset: string | null;
    onSelect: (presetId: string | null) => void;
}

export function WizardPresets({ presets, selectedPreset, onSelect }: WizardPresetsProps) {
    return (
        <div className="wizard-presets">
            <h2 className="wizard-presets__title">Choose a Preset</h2>
            <p className="wizard-presets__subtitle">Select a preset or customize settings manually</p>

            <div className="wizard-presets__grid">
                {/* Custom option */}
                <button
                    type="button"
                    className={`preset-card ${selectedPreset === null ? "preset-card--active" : ""}`}
                    onClick={() => onSelect(null)}
                >
                    <div className="preset-card__icon">⚙️</div>
                    <div className="preset-card__content">
                        <h4 className="preset-card__name">Custom</h4>
                        <p className="preset-card__description">Configure all settings manually</p>
                    </div>
                </button>

                {/* Preset options */}
                {presets.map((preset) => (
                    <button
                        key={preset.id}
                        type="button"
                        className={`preset-card ${selectedPreset === preset.id ? "preset-card--active" : ""}`}
                        onClick={() => onSelect(preset.id)}
                    >
                        <div className="preset-card__content">
                            <h4 className="preset-card__name">{preset.name}</h4>
                            <p className="preset-card__description">{preset.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
