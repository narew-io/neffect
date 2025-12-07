// ================================================================
// ---------------------- PROCESSOR REGISTRY ----------------------
// ================================================================

import { BaseProcessImage } from "../base-processor";
import { DitheringProcessor } from "./dithering";
import { PixelateProcessor } from "./pixelate";
import { HalftoneProcessor } from "./halftone";

/* PROCESSOR INSTANCES */
const processors: BaseProcessImage[] = [
  new DitheringProcessor(),
  new PixelateProcessor(),
  new HalftoneProcessor(),
];

/* GET ALL PROCESSORS */
export function getAllProcessors(): BaseProcessImage[] {
  return processors;
}

/* GET PROCESSOR BY ID */
export function getProcessor(id: string): BaseProcessImage | undefined {
  return processors.find((p) => p.config.id === id);
}

export { DitheringProcessor, PixelateProcessor, HalftoneProcessor };
