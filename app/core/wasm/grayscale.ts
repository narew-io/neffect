// ================================================================
// ----------------------- WASM GRAYSCALE -------------------------
// ================================================================

import { getWasmInstance, getWasmMemory, ensureMemory } from "./loader";

/**
 * Convert image to grayscale using WASM
 */
export function wasmGrayscale(imageData: ImageData): ImageData {
  const instance = getWasmInstance();
  const wasmMemory = getWasmMemory();

  const { width, height, data } = imageData;
  const pixelBytes = width * height * 4;

  ensureMemory(pixelBytes + 1024);

  const memory = new Uint8Array(wasmMemory.buffer);
  memory.set(data, 0);

  const grayscale = instance.exports.grayscale as (
    pixelsPtr: number,
    width: number,
    height: number
  ) => void;

  grayscale(0, width, height);

  const outputData = new Uint8ClampedArray(pixelBytes);
  outputData.set(memory.slice(0, pixelBytes));

  return new ImageData(outputData, width, height);
}
