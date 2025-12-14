// ================================================================
// ----------------------- GRAYSCALE WASM -------------------------
// ================================================================

import { rgbToGray } from "./utils";

/**
 * Convert image to grayscale using luminosity method
 * @param pixelsPtr - Pointer to pixel data (RGBA)
 * @param width - Image width
 * @param height - Image height
 */
export function grayscale(pixelsPtr: usize, width: i32, height: i32): void {
  const totalPixels = width * height;

  for (let i: i32 = 0; i < totalPixels; i++) {
    const offset = pixelsPtr + <usize>(i * 4);

    const r = <i32>load<u8>(offset);
    const g = <i32>load<u8>(offset + 1);
    const b = <i32>load<u8>(offset + 2);

    const gray = <u8>rgbToGray(r, g, b);

    store<u8>(offset, gray);
    store<u8>(offset + 1, gray);
    store<u8>(offset + 2, gray);
  }
}
