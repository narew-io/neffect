// ================================================================
// ----------------------- WIZARD SETTINGS ------------------------
// ================================================================

import type { SettingDefinition } from "~/core/base-processor";

interface WizardSettingsProps {
    settings: SettingDefinition[];
    values: Record<string, unknown>;
    onChange: (id: string, value: unknown) => void;
}

export function WizardSettings({ settings, values, onChange }: WizardSettingsProps) {
    return (
        <div className="wizard-settings">
            <h2 className="wizard-settings__title">Adjust Settings</h2>
            <p className="wizard-settings__subtitle">Fine-tune the effect parameters</p>

            <div className="wizard-settings__form">
                {settings.map((setting) => (
                    <div key={setting.id} className="form-field">
                        <label className="form-field__label" htmlFor={setting.id}>
                            {setting.label}
                            {setting.description && <span className="form-field__hint">{setting.description}</span>}
                        </label>

                        {setting.type === "range" && (
                            <div className="form-field__range">
                                <input
                                    type="range"
                                    id={setting.id}
                                    min={setting.min}
                                    max={setting.max}
                                    step={setting.step}
                                    value={values[setting.id] as number}
                                    onChange={(e) => onChange(setting.id, Number(e.target.value))}
                                />
                                <span className="form-field__value">{values[setting.id] as number}</span>
                            </div>
                        )}

                        {setting.type === "select" && (
                            <select
                                id={setting.id}
                                className="form-field__select"
                                value={values[setting.id] as string}
                                onChange={(e) => onChange(setting.id, e.target.value)}
                            >
                                {setting.options?.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        )}

                        {setting.type === "checkbox" && (
                            <input
                                type="checkbox"
                                id={setting.id}
                                className="form-field__checkbox"
                                checked={values[setting.id] as boolean}
                                onChange={(e) => onChange(setting.id, e.target.checked)}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
