// ================================================================
// ------------------------- EFFECT CARD --------------------------
// ================================================================

import { Link } from "react-router";
import type { ProcessorConfig } from "~/core/base-processor";

interface EffectCardProps {
    processor: ProcessorConfig;
}

export function EffectCard({ processor }: EffectCardProps) {
    return (
        <Link to={`/effect/${processor.id}`} className="effect-card">
            <div className="effect-card__icon">{processor.icon}</div>
            <div className="effect-card__content">
                <h3 className="effect-card__title">{processor.name}</h3>
                <p className="effect-card__description">{processor.description}</p>
                <div className="effect-card__support">
                    <span className="effect-card__badge effect-card__badge--image" title="Obsługuje zdjęcia">
                        🖼️ Zdjęcia
                    </span>
                    {processor.mp4support && (
                        <span className="effect-card__badge effect-card__badge--video" title="Obsługuje filmy">
                            🎬 Filmy
                        </span>
                    )}
                </div>
            </div>
            <div className="effect-card__arrow">→</div>
        </Link>
    );
}
