// ================================================================
// -------------------- WASM IMAGE PROCESSING --------------------
// ================================================================
// Main entry point - re-exports all processor functions

export { orderedDither } from "./dithering";
export { pixelate, pixelateWithColors } from "./pixelate";
export { halftone } from "./halftone";
export { grayscale } from "./grayscale";

// ================================================================
// ------------------------ MEMORY HELPERS -----------------------
// ================================================================

export function getMemorySize(): i32 {
  return <i32>memory.size() * 65536;
}

export function growMemory(pages: i32): i32 {
  return <i32>memory.grow(pages);
}
