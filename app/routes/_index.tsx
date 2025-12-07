// ================================================================
// -------------------------- HOME PAGE ---------------------------
// ================================================================

import { useState, useCallback } from "react";
import type { Route } from "./+types/_index";
import { Link } from "react-router";
import { getAllProcessors } from "~/core/processors";
import { LivePreview } from "~/components/LivePreview";
import type { BaseProcessImage } from "~/core/base-processor";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "neffect - Bulk Image Processing" },
        { name: "description", content: "Open source bulk image processing with effects like dithering" },
    ];
}

function getRandomSettings(processor: BaseProcessImage): Record<string, unknown> {
    const settings: Record<string, unknown> = {};

    for (const setting of processor.settings) {
        if (setting.type === "range" && setting.min !== undefined && setting.max !== undefined) {
            // Random value within range
            const range = setting.max - setting.min;
            settings[setting.id] = setting.min + Math.random() * range;
        } else if (setting.type === "select" && setting.options) {
            // Random option
            const randomIndex = Math.floor(Math.random() * setting.options.length);
            settings[setting.id] = setting.options[randomIndex].value;
        } else {
            settings[setting.id] = setting.default;
        }
    }

    return settings;
}

export default function HomePage() {
    const processors = getAllProcessors();
    const [hoveredProcessor, setHoveredProcessor] = useState<BaseProcessImage | null>(null);
    const [previewSettings, setPreviewSettings] = useState<Record<string, unknown> | null>(null);

    const handleMouseEnter = useCallback((processor: BaseProcessImage) => {
        setHoveredProcessor(processor);
        // Use first preset settings or random settings
        const preset = processor.presets[0];
        setPreviewSettings(preset ? preset.settings : getRandomSettings(processor));
    }, []);

    const handleMouseLeave = useCallback(() => {
        setHoveredProcessor(null);
        setPreviewSettings(null);
    }, []);

    return (
        <main className="home">
            {/* Header */}
            <header className="home__header">
                <h1 className="home__logo">neffect</h1>
                <p className="home__tagline">Bulk Image Processing</p>
            </header>

            {/* Main Content - Split View */}
            <div className="home__content">
                {/* Left: Effects List */}
                <div className="home__sidebar">
                    <h2 className="home__section-title">Choose Effect</h2>
                    <div className="home__effects-list">
                        {processors.map((processor) => (
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
                        ))}
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
        </main>
    );
}
