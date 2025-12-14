// ================================================================
// ----------------------- HALFTONE WASM --------------------------
// ================================================================

import { rgbToGray } from "./utils";

/**
 * Halftone effect with circular dots
 * @param pixelsPtr - Pointer to input pixel data (RGBA)
 * @param outputPtr - Pointer to output pixel data (RGBA)
 * @param width - Image width
 * @param height - Image height
 * @param dotSize - Maximum dot diameter
 * @param spacing - Space between dot centers
 * @param dotColorR/G/B/A - Dot color components
 * @param bgColorR/G/B/A - Background color components
 */
export function halftone(
  pixelsPtr: usize,
  outputPtr: usize,
  width: i32,
  height: i32,
  dotSize: i32,
  spacing: i32,
  dotColorR: i32,
  dotColorG: i32,
  dotColorB: i32,
  dotColorA: i32,
  bgColorR: i32,
  bgColorG: i32,
  bgColorB: i32,
  bgColorA: i32
): void {
  const halfSpacing: f32 = <f32>spacing / 2.0;
  const maxRadius: f32 = <f32>dotSize / 2.0;

  // Fill background
  for (let i: i32 = 0; i < width * height; i++) {
    const offset = outputPtr + <usize>(i * 4);
    store<u8>(offset, <u8>bgColorR);
    store<u8>(offset + 1, <u8>bgColorG);
    store<u8>(offset + 2, <u8>bgColorB);
    store<u8>(offset + 3, <u8>bgColorA);
  }

  // Process grid cells
  for (let gy: i32 = 0; gy < height; gy += spacing) {
    for (let gx: i32 = 0; gx < width; gx += spacing) {
      // Calculate average brightness in cell
      let totalBrightness: i32 = 0;
      let count: i32 = 0;

      for (let py: i32 = 0; py < spacing && gy + py < height; py++) {
        for (let px: i32 = 0; px < spacing && gx + px < width; px++) {
          const idx = ((gy + py) * width + (gx + px)) * 4;
          const offset = pixelsPtr + <usize>idx;

          const r = <i32>load<u8>(offset);
          const g = <i32>load<u8>(offset + 1);
          const b = <i32>load<u8>(offset + 2);

          totalBrightness += rgbToGray(r, g, b);
          count++;
        }
      }

      if (count == 0) continue;

      const avgBrightness = <f32>totalBrightness / <f32>count;
      // Invert: darker areas = bigger dots
      const dotRadius = maxRadius * (1.0 - avgBrightness / 255.0);

      if (dotRadius < 0.5) continue;

      // Draw circular dot
      const centerX = <f32>gx + halfSpacing;
      const centerY = <f32>gy + halfSpacing;
      const radiusSq = dotRadius * dotRadius;

      const startY = max(0, <i32>(centerY - dotRadius));
      const endY = min(height - 1, <i32>(centerY + dotRadius));
      const startX = max(0, <i32>(centerX - dotRadius));
      const endX = min(width - 1, <i32>(centerX + dotRadius));

      for (let y: i32 = startY; y <= endY; y++) {
        for (let x: i32 = startX; x <= endX; x++) {
          const dx = <f32>x - centerX;
          const dy = <f32>y - centerY;
          const distSq = dx * dx + dy * dy;

          if (distSq <= radiusSq) {
            const offset = outputPtr + <usize>((y * width + x) * 4);
            store<u8>(offset, <u8>dotColorR);
            store<u8>(offset + 1, <u8>dotColorG);
            store<u8>(offset + 2, <u8>dotColorB);
            store<u8>(offset + 3, <u8>dotColorA);
          }
        }
      }
    }
  }
}
