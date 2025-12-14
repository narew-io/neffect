// ================================================================
// ------------------------ WASM PIXELATE -------------------------
// ================================================================

import { getWasmInstance, getWasmMemory, ensureMemory } from "./loader";

/**
 * Simple pixelate using WASM
 */
export function wasmPixelate(
  imageData: ImageData,
  blockSize: number
): ImageData {
  const instance = getWasmInstance();
  const wasmMemory = getWasmMemory();

  const { width, height, data } = imageData;
  const pixelBytes = width * height * 4;

  ensureMemory(pixelBytes + 1024);

  const memory = new Uint8Array(wasmMemory.buffer);
  memory.set(data, 0);

  const pixelate = instance.exports.pixelate as (
    pixelsPtr: number,
    width: number,
    height: number,
    blockSize: number
  ) => void;

  pixelate(0, width, height, blockSize);

  const outputData = new Uint8ClampedArray(pixelBytes);
  outputData.set(memory.slice(0, pixelBytes));

  return new ImageData(outputData, width, height);
}

/**
 * Pixelate with color quantization using WASM
 */
export function wasmPixelateWithColors(
  imageData: ImageData,
  blockSize: number,
  colorLevels: number
): ImageData {
  const instance = getWasmInstance();
  const wasmMemory = getWasmMemory();

  const { width, height, data } = imageData;
  const pixelBytes = width * height * 4;

  ensureMemory(pixelBytes + 1024);

  const memory = new Uint8Array(wasmMemory.buffer);
  memory.set(data, 0);

  const pixelateWithColors = instance.exports.pixelateWithColors as (
    pixelsPtr: number,
    width: number,
    height: number,
    blockSize: number,
    colorLevels: number
  ) => void;

  pixelateWithColors(0, width, height, blockSize, colorLevels);

  const outputData = new Uint8ClampedArray(pixelBytes);
  outputData.set(memory.slice(0, pixelBytes));

  return new ImageData(outputData, width, height);
}
