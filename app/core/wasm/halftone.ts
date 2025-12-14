// ================================================================
// ------------------------ WASM HALFTONE -------------------------
// ================================================================

import { getWasmInstance, getWasmMemory, ensureMemory } from "./loader";

export interface HalftoneParams {
  dotSize: number;
  spacing: number;
  dotColor: [number, number, number, number];
  bgColor: [number, number, number, number];
}

/**
 * Apply halftone effect using WASM
 */
export function wasmHalftone(
  imageData: ImageData,
  params: HalftoneParams
): ImageData {
  const instance = getWasmInstance();
  const wasmMemory = getWasmMemory();

  const { width, height, data } = imageData;
  const pixelBytes = width * height * 4;

  // Need space for input and output
  ensureMemory(pixelBytes * 2 + 1024);

  const memory = new Uint8Array(wasmMemory.buffer);
  memory.set(data, 0);

  const halftone = instance.exports.halftone as (
    pixelsPtr: number,
    outputPtr: number,
    width: number,
    height: number,
    dotSize: number,
    spacing: number,
    dotColorR: number,
    dotColorG: number,
    dotColorB: number,
    dotColorA: number,
    bgColorR: number,
    bgColorG: number,
    bgColorB: number,
    bgColorA: number
  ) => void;

  const outputOffset = pixelBytes;

  halftone(
    0,
    outputOffset,
    width,
    height,
    params.dotSize,
    params.spacing,
    params.dotColor[0],
    params.dotColor[1],
    params.dotColor[2],
    params.dotColor[3],
    params.bgColor[0],
    params.bgColor[1],
    params.bgColor[2],
    params.bgColor[3]
  );

  const outputData = new Uint8ClampedArray(pixelBytes);
  outputData.set(memory.slice(outputOffset, outputOffset + pixelBytes));

  return new ImageData(outputData, width, height);
}
