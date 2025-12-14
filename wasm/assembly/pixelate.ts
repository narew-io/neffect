// ================================================================
// ----------------------- PIXELATE WASM --------------------------
// ================================================================

/**
 * Pixelate image with color quantization
 * @param pixelsPtr - Pointer to pixel data (RGBA)
 * @param width - Image width
 * @param height - Image height
 * @param blockSize - Size of pixel blocks
 * @param colorLevels - Number of color levels per channel
 */
export function pixelateWithColors(
  pixelsPtr: usize,
  width: i32,
  height: i32,
  blockSize: i32,
  colorLevels: i32
): void {
  const levelStep: f32 = 255.0 / <f32>(colorLevels - 1);

  for (let by: i32 = 0; by < height; by += blockSize) {
    for (let bx: i32 = 0; bx < width; bx += blockSize) {
      let totalR: i32 = 0;
      let totalG: i32 = 0;
      let totalB: i32 = 0;
      let totalA: i32 = 0;
      let count: i32 = 0;

      const blockW = min(blockSize, width - bx);
      const blockH = min(blockSize, height - by);

      // Sum all pixels in block
      for (let py: i32 = 0; py < blockH; py++) {
        for (let px: i32 = 0; px < blockW; px++) {
          const idx = ((by + py) * width + (bx + px)) * 4;
          const offset = pixelsPtr + <usize>idx;

          totalR += <i32>load<u8>(offset);
          totalG += <i32>load<u8>(offset + 1);
          totalB += <i32>load<u8>(offset + 2);
          totalA += <i32>load<u8>(offset + 3);
          count++;
        }
      }

      // Calculate and quantize average
      let avgR = <f32>(totalR / count);
      let avgG = <f32>(totalG / count);
      let avgB = <f32>(totalB / count);
      const avgA = <u8>(totalA / count);

      // Quantize colors
      const qR = <u8>(NativeMathf.round(avgR / levelStep) * levelStep);
      const qG = <u8>(NativeMathf.round(avgG / levelStep) * levelStep);
      const qB = <u8>(NativeMathf.round(avgB / levelStep) * levelStep);

      // Fill block with quantized color
      for (let py: i32 = 0; py < blockH; py++) {
        for (let px: i32 = 0; px < blockW; px++) {
          const idx = ((by + py) * width + (bx + px)) * 4;
          const offset = pixelsPtr + <usize>idx;

          store<u8>(offset, qR);
          store<u8>(offset + 1, qG);
          store<u8>(offset + 2, qB);
          store<u8>(offset + 3, avgA);
        }
      }
    }
  }
}

/**
 * Simple pixelate without color quantization
 */
export function pixelate(
  pixelsPtr: usize,
  width: i32,
  height: i32,
  blockSize: i32
): void {
  for (let by: i32 = 0; by < height; by += blockSize) {
    for (let bx: i32 = 0; bx < width; bx += blockSize) {
      let totalR: i32 = 0;
      let totalG: i32 = 0;
      let totalB: i32 = 0;
      let totalA: i32 = 0;
      let count: i32 = 0;

      const blockW = min(blockSize, width - bx);
      const blockH = min(blockSize, height - by);

      for (let py: i32 = 0; py < blockH; py++) {
        for (let px: i32 = 0; px < blockW; px++) {
          const idx = ((by + py) * width + (bx + px)) * 4;
          const offset = pixelsPtr + <usize>idx;

          totalR += <i32>load<u8>(offset);
          totalG += <i32>load<u8>(offset + 1);
          totalB += <i32>load<u8>(offset + 2);
          totalA += <i32>load<u8>(offset + 3);
          count++;
        }
      }

      const avgR = <u8>(totalR / count);
      const avgG = <u8>(totalG / count);
      const avgB = <u8>(totalB / count);
      const avgA = <u8>(totalA / count);

      for (let py: i32 = 0; py < blockH; py++) {
        for (let px: i32 = 0; px < blockW; px++) {
          const idx = ((by + py) * width + (bx + px)) * 4;
          const offset = pixelsPtr + <usize>idx;

          store<u8>(offset, avgR);
          store<u8>(offset + 1, avgG);
          store<u8>(offset + 2, avgB);
          store<u8>(offset + 3, avgA);
        }
      }
    }
  }
}
