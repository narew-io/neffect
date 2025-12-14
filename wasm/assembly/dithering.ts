// ================================================================
// ---------------------- DITHERING WASM --------------------------
// ================================================================

import { clamp, adjustBrightnessContrast } from "./utils";

// Bayer matrix 8x8 for ordered dithering
const BAYER_8X8: StaticArray<u8> = [
   0, 32,  8, 40,  2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44,  4, 36, 14, 46,  6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
   3, 35, 11, 43,  1, 33,  9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47,  7, 39, 13, 45,  5, 37,
  63, 31, 55, 23, 61, 29, 53, 21
];

// @ts-ignore: AssemblyScript decorator
@inline
function findClosestColor(
  r: i32, g: i32, b: i32,
  palettePtr: usize, paletteSize: i32
): i32 {
  let minDist: i32 = 0x7FFFFFFF;
  let closestIdx: i32 = 0;
  
  for (let i: i32 = 0; i < paletteSize; i++) {
    const offset = palettePtr + <usize>(i * 4);
    const pr = <i32>load<u8>(offset);
    const pg = <i32>load<u8>(offset + 1);
    const pb = <i32>load<u8>(offset + 2);
    
    const dr = r - pr;
    const dg = g - pg;
    const db = b - pb;
    const dist = dr * dr + dg * dg + db * db;
    
    if (dist < minDist) {
      minDist = dist;
      closestIdx = i;
    }
  }
  
  return closestIdx;
}

/**
 * Ordered dithering with palette colors
 * @param pixelsPtr - Pointer to pixel data (RGBA)
 * @param width - Image width
 * @param height - Image height
 * @param palettePtr - Pointer to palette data (RGBA per color)
 * @param paletteSize - Number of colors in palette
 * @param grainSize - Dither grain size
 * @param brightness - Brightness adjustment (-1 to 1)
 * @param contrast - Contrast adjustment (-1 to 1)
 */
export function orderedDither(
  pixelsPtr: usize,
  width: i32,
  height: i32,
  palettePtr: usize,
  paletteSize: i32,
  grainSize: i32,
  brightness: f32,
  contrast: f32
): void {
  const totalPixels = width * height;
  
  for (let i: i32 = 0; i < totalPixels; i++) {
    const pixelOffset = pixelsPtr + <usize>(i * 4);
    
    let r = <i32>load<u8>(pixelOffset);
    let g = <i32>load<u8>(pixelOffset + 1);
    let b = <i32>load<u8>(pixelOffset + 2);
    const a = load<u8>(pixelOffset + 3);
    
    // Skip transparent pixels
    if (a < 10) continue;
    
    // Apply brightness and contrast
    r = adjustBrightnessContrast(r, brightness, contrast);
    g = adjustBrightnessContrast(g, brightness, contrast);
    b = adjustBrightnessContrast(b, brightness, contrast);
    
    // Get pixel position
    const x = i % width;
    const y = i / width;
    
    // Get Bayer threshold
    const bx = (x / grainSize) % 8;
    const by = (y / grainSize) % 8;
    const threshold = (<i32>unchecked(BAYER_8X8[by * 8 + bx]) - 32) * 4;
    
    // Add dither noise
    r = clamp(r + threshold, 0, 255);
    g = clamp(g + threshold, 0, 255);
    b = clamp(b + threshold, 0, 255);
    
    // Find closest palette color
    const colorIdx = findClosestColor(r, g, b, palettePtr, paletteSize);
    const colorOffset = palettePtr + <usize>(colorIdx * 4);
    
    // Write output
    store<u8>(pixelOffset, load<u8>(colorOffset));
    store<u8>(pixelOffset + 1, load<u8>(colorOffset + 1));
    store<u8>(pixelOffset + 2, load<u8>(colorOffset + 2));
    store<u8>(pixelOffset + 3, load<u8>(colorOffset + 3));
  }
}
