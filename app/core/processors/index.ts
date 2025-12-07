// ================================================================
// ---------------------- PROCESSOR REGISTRY ----------------------
// ================================================================

import { BaseProcessImage } from "../base-processor";
import { DitheringProcessor } from "./dithering";

/* PROCESSOR INSTANCES */
const processors: BaseProcessImage[] = [new DitheringProcessor()];

/* GET ALL PROCESSORS */
export function getAllProcessors(): BaseProcessImage[] {
  return processors;
}

/* GET PROCESSOR BY ID */
export function getProcessor(id: string): BaseProcessImage | undefined {
  return processors.find((p) => p.config.id === id);
}

export { DitheringProcessor };
