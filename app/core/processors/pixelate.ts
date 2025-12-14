// ================================================================
// ---------------------- PIXELATE PROCESSOR ----------------------
// ================================================================

import {
  BaseWasmProcessor,
  type ProcessorConfig,
  type ProcessorPreset,
  type SettingDefinition,
} from "../base-processor";
import { wasmPixelateWithColors } from "../wasm-processor";

export class PixelateProcessor extends BaseWasmProcessor {
  readonly config: ProcessorConfig = {
    id: "pixelate",
    name: "Pixelate",
    description: "Create retro pixelated look with customizable block size.",
    icon: "",
    mp4support: true,
  };

  readonly presets: ProcessorPreset[] = [
    {
      id: "retro-8bit",
      name: "Retro 8-bit",
      description: "Classic 8-bit game aesthetic",
      settings: {
        blockSize: 8,
        colorLevels: 8,
      },
    },
    {
      id: "mosaic",
      name: "Mosaic",
      description: "Large blocks, full color",
      settings: {
        blockSize: 16,
        colorLevels: 256,
      },
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "Extreme pixelation with few colors",
      settings: {
        blockSize: 24,
        colorLevels: 4,
      },
    },
  ];

  readonly settings: SettingDefinition[] = [
    {
      id: "blockSize",
      type: "range",
      label: "Block Size",
      description: "Size of each pixel block",
      default: 8,
      min: 2,
      max: 32,
      step: 1,
    },
    {
      id: "colorLevels",
      type: "range",
      label: "Color Levels",
      description: "Number of color levels per channel (2-256)",
      default: 256,
      min: 2,
      max: 256,
      step: 1,
    },
  ];

  // ================================================================
  // ------------------------- WASM PROCESSING -----------------------
  // ================================================================

  processWasm(
    imageData: ImageData,
    settings: Record<string, unknown>
  ): ImageData {
    const blockSize = Math.max(
      2,
      Math.round((settings.blockSize as number) || 8)
    );
    const colorLevels = Math.max(
      2,
      Math.min(256, Math.round((settings.colorLevels as number) || 256))
    );

    return wasmPixelateWithColors(imageData, blockSize, colorLevels);
  }

  // ================================================================
  // -------------------------- JS PROCESSING ------------------------
  // ================================================================

  async processJs(
    imageData: ImageData,
    settings: Record<string, unknown>
  ): Promise<ImageData> {
    const blockSize = Math.max(
      2,
      Math.round((settings.blockSize as number) || 8)
    );
    const colorLevels = Math.max(
      2,
      Math.min(256, Math.round((settings.colorLevels as number) || 256))
    );

    const { width, height, data } = imageData;

    // Calculate small dimensions
    const smallWidth = Math.max(1, Math.floor(width / blockSize));
    const smallHeight = Math.max(1, Math.floor(height / blockSize));

    // Downscale with averaging
    const smallData = new Uint8ClampedArray(smallWidth * smallHeight * 4);

    for (let sy = 0; sy < smallHeight; sy++) {
      for (let sx = 0; sx < smallWidth; sx++) {
        let r = 0,
          g = 0,
          b = 0,
          a = 0;
        let count = 0;

        for (let by = 0; by < blockSize; by++) {
          for (let bx = 0; bx < blockSize; bx++) {
            const x = sx * blockSize + bx;
            const y = sy * blockSize + by;
            if (x < width && y < height) {
              const idx = (y * width + x) * 4;
              r += data[idx];
              g += data[idx + 1];
              b += data[idx + 2];
              a += data[idx + 3];
              count++;
            }
          }
        }

        const smallIdx = (sy * smallWidth + sx) * 4;
        smallData[smallIdx] = this.quantize(r / count, colorLevels);
        smallData[smallIdx + 1] = this.quantize(g / count, colorLevels);
        smallData[smallIdx + 2] = this.quantize(b / count, colorLevels);
        smallData[smallIdx + 3] = Math.round(a / count);
      }
    }

    // Upscale back to original size
    const result = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sx = Math.min(Math.floor(x / blockSize), smallWidth - 1);
        const sy = Math.min(Math.floor(y / blockSize), smallHeight - 1);

        const srcIdx = (sy * smallWidth + sx) * 4;
        const dstIdx = (y * width + x) * 4;

        result[dstIdx] = smallData[srcIdx];
        result[dstIdx + 1] = smallData[srcIdx + 1];
        result[dstIdx + 2] = smallData[srcIdx + 2];
        result[dstIdx + 3] = smallData[srcIdx + 3];
      }
    }

    return new ImageData(result, width, height);
  }

  private quantize(value: number, levels: number): number {
    if (levels >= 256) return Math.round(value);
    const step = 255 / (levels - 1);
    return Math.round(Math.round(value / step) * step);
  }
}
