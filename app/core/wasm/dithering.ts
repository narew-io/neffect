// ================================================================
// ----------------------- WASM DITHERING -------------------------
// ================================================================

import { getWasmInstance, getWasmMemory, ensureMemory } from "./loader";

export interface DitheringParams {
  palette: number[][];
  grainSize: number;
  brightness: number;
  contrast: number;
}

/**
 * Apply ordered dithering using WASM
 */
export function wasmOrderedDither(
  imageData: ImageData,
  params: DitheringParams
): ImageData {
  const instance = getWasmInstance();
  const wasmMemory = getWasmMemory();

  const { width, height, data } = imageData;
  const pixelBytes = width * height * 4;
  const paletteBytes = params.palette.length * 4;
  const totalBytes = pixelBytes + paletteBytes + 1024;

  ensureMemory(totalBytes);

  const memory = new Uint8Array(wasmMemory.buffer);
  memory.set(data, 0);

  // Copy palette to WASM memory
  const paletteOffset = pixelBytes;
  for (let i = 0; i < params.palette.length; i++) {
    const [r, g, b, a] = params.palette[i];
    memory[paletteOffset + i * 4] = r;
    memory[paletteOffset + i * 4 + 1] = g;
    memory[paletteOffset + i * 4 + 2] = b;
    memory[paletteOffset + i * 4 + 3] = a ?? 255;
  }

  const orderedDither = instance.exports.orderedDither as (
    pixelsPtr: number,
    width: number,
    height: number,
    palettePtr: number,
    paletteSize: number,
    grainSize: number,
    brightness: number,
    contrast: number
  ) => void;

  orderedDither(
    0,
    width,
    height,
    paletteOffset,
    params.palette.length,
    params.grainSize,
    params.brightness,
    params.contrast
  );

  const outputData = new Uint8ClampedArray(pixelBytes);
  outputData.set(memory.slice(0, pixelBytes));

  return new ImageData(outputData, width, height);
}
