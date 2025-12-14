// ================================================================
// --------------------- WASM PROCESSOR WRAPPER -------------------
// ================================================================
// Re-exports all WASM functions from modular structure

export { initWasm, isWasmAvailable } from "./wasm/loader";

export { wasmOrderedDither, type DitheringParams } from "./wasm/dithering";

export { wasmPixelate, wasmPixelateWithColors } from "./wasm/pixelate";

export { wasmHalftone, type HalftoneParams } from "./wasm/halftone";

export { wasmGrayscale } from "./wasm/grayscale";
