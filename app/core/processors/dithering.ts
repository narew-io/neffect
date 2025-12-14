// ================================================================
// --------------------- DITHERING PROCESSOR ----------------------
// ================================================================

import {
  BaseWasmProcessor,
  type ProcessorConfig,
  type ProcessorPreset,
  type SettingDefinition,
} from "../base-processor";
import { wasmOrderedDither } from "../wasm-processor";

/* TYPES */
type DitherFilter = "ordered" | "none";
type PaletteName = "BLUE-ON-TRANSPARENT" | "WHITE-ON-TRANSPARENT";
type RGBA = [number, number, number, number];

/* BAYER MATRIX 4x4 */
const BAYER_MATRIX_4X4: number[][] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const BAYER_DIVISOR = 16;

/* PALETTE DEFINITIONS */
const PALETTES: Record<PaletteName, RGBA[]> = {
  "BLUE-ON-TRANSPARENT": [
    [0, 0, 0, 0],
    [59, 130, 245, 255],
  ],
  "WHITE-ON-TRANSPARENT": [
    [0, 0, 0, 0],
    [255, 255, 255, 255],
  ],
};

// ================================================================
// --------------------- DITHERING PROCESSOR ----------------------
// ================================================================

export class DitheringProcessor extends BaseWasmProcessor {
  readonly config: ProcessorConfig = {
    id: "dithering",
    name: "Dithering",
    description:
      "Apply retro ordered dithering effect with customizable grain size.",
    icon: "",
    mp4support: true,
  };

  readonly presets: ProcessorPreset[] = [
    {
      id: "blue-default",
      name: "Blue Default",
      description: "Blue on transparent, balanced settings",
      baseSettings: {
        base_opacity: 60,
      },
      settings: {
        palette: "BLUE-ON-TRANSPARENT",
        filter: "ordered",
        steps: 11,
        grainSize: 2,
        brightness: 0,
        contrast: 0,
        inputResolution: 800,
      },
    },
    {
      id: "white-default",
      name: "White Default",
      description: "White on transparent, balanced settings",
      baseSettings: {
        base_opacity: 60,
      },
      settings: {
        palette: "WHITE-ON-TRANSPARENT",
        filter: "ordered",
        steps: 11,
        grainSize: 2,
        brightness: 0,
        contrast: 0,
        inputResolution: 800,
      },
    },
  ];

  readonly settings: SettingDefinition[] = [
    {
      id: "palette",
      type: "select",
      label: "Color Palette",
      description: "Choose the output color palette",
      default: "BLUE-ON-TRANSPARENT",
      options: [
        { value: "BLUE-ON-TRANSPARENT", label: "Blue on Transparent" },
        { value: "WHITE-ON-TRANSPARENT", label: "White on Transparent" },
      ],
    },
    {
      id: "filter",
      type: "select",
      label: "Filter",
      description: "Dithering filter type",
      default: "ordered",
      options: [
        { value: "ordered", label: "Ordered (Dithering)" },
        { value: "none", label: "None (Palette only)" },
      ],
    },
    {
      id: "steps",
      type: "range",
      label: "Steps",
      description: "1 = most detail, 12 = least detail",
      default: 11,
      min: 0,
      max: 12,
      step: 1,
    },
    {
      id: "grainSize",
      type: "range",
      label: "Grain Size",
      description: "Size of dither grain in pixels",
      default: 2,
      min: 0,
      max: 8,
      step: 1,
    },
    {
      id: "brightness",
      type: "range",
      label: "Brightness",
      description: "Adjust brightness (-100 to 100)",
      default: 0,
      min: -100,
      max: 100,
      step: 5,
    },
    {
      id: "contrast",
      type: "range",
      label: "Contrast",
      description: "Adjust contrast (-100 to 100)",
      default: 0,
      min: -100,
      max: 100,
      step: 5,
    },
    {
      id: "inputResolution",
      type: "range",
      label: "Input Resolution",
      description: "Resize image height before processing",
      default: 800,
      min: 0,
      max: 2000,
      step: 100,
    },
  ];

  // ================================================================
  // ------------------------- WASM PROCESSING -----------------------
  // ================================================================

  processWasm(
    imageData: ImageData,
    settings: Record<string, unknown>
  ): ImageData {
    const {
      workingData,
      originalWidth,
      originalHeight,
      paletteColors,
      brightness,
      contrast,
    } = this.prepareData(imageData, settings);

    const result = wasmOrderedDither(workingData, {
      palette: paletteColors,
      grainSize: 1,
      brightness,
      contrast,
    });

    return this.resizeImageNearest(result, originalWidth, originalHeight);
  }

  // ================================================================
  // -------------------------- JS PROCESSING ------------------------
  // ================================================================

  async processJs(
    imageData: ImageData,
    settings: Record<string, unknown>
  ): Promise<ImageData> {
    const filter = (settings.filter as DitherFilter) || "ordered";
    const steps = (settings.steps as number) || 11;

    const {
      workingData,
      originalWidth,
      originalHeight,
      paletteColors,
      brightness,
      contrast,
    } = this.prepareData(imageData, settings);

    // Apply brightness & contrast
    if (brightness !== 0 || contrast !== 0) {
      this.applyBrightnessContrast(workingData, brightness, contrast);
    }

    // Apply dithering or palette quantization
    if (filter === "ordered") {
      this.applyOrderedDither(workingData, steps, paletteColors);
    } else {
      this.applyPaletteQuantization(workingData, paletteColors);
    }

    return this.resizeImageNearest(workingData, originalWidth, originalHeight);
  }

  // ================================================================
  // ------------------------- PREPARE DATA --------------------------
  // ================================================================

  private prepareData(imageData: ImageData, settings: Record<string, unknown>) {
    const palette = (settings.palette as PaletteName) || "BLUE-ON-TRANSPARENT";
    const grainSize = Math.max(
      1,
      Math.round((settings.grainSize as number) || 2)
    );
    const brightness = ((settings.brightness as number) || 0) / 100;
    const contrast = ((settings.contrast as number) || 0) / 100;
    const inputResolution = (settings.inputResolution as number) || 800;

    const paletteColors = PALETTES[palette] || PALETTES["BLUE-ON-TRANSPARENT"];

    // Resize to input resolution
    let workingData = this.resizeImage(imageData, inputResolution);
    const originalWidth = workingData.width;
    const originalHeight = workingData.height;

    // Downscale by grainSize factor
    const smallWidth = Math.max(1, Math.round(originalWidth / grainSize));
    const smallHeight = Math.max(1, Math.round(originalHeight / grainSize));
    workingData = this.resizeImageNearest(workingData, smallWidth, smallHeight);

    return {
      workingData,
      originalWidth,
      originalHeight,
      paletteColors,
      brightness,
      contrast,
    };
  }

  // ================================================================
  // ------------------------ PRIVATE METHODS -----------------------
  // ================================================================

  private resizeImage(imageData: ImageData, targetHeight: number): ImageData {
    const { width, height } = imageData;
    if (height === targetHeight) return imageData;

    const scale = targetHeight / height;
    const newWidth = Math.max(1, Math.round(width * scale));
    const newHeight = targetHeight;

    return this.resizeImageBilinear(imageData, newWidth, newHeight);
  }

  private resizeImageBilinear(
    imageData: ImageData,
    newWidth: number,
    newHeight: number
  ): ImageData {
    const { width, height, data } = imageData;
    const newData = new Uint8ClampedArray(newWidth * newHeight * 4);

    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcX = (x / newWidth) * width;
        const srcY = (y / newHeight) * height;

        const x0 = Math.floor(srcX);
        const y0 = Math.floor(srcY);
        const x1 = Math.min(x0 + 1, width - 1);
        const y1 = Math.min(y0 + 1, height - 1);

        const xLerp = srcX - x0;
        const yLerp = srcY - y0;

        const idx00 = (y0 * width + x0) * 4;
        const idx10 = (y0 * width + x1) * 4;
        const idx01 = (y1 * width + x0) * 4;
        const idx11 = (y1 * width + x1) * 4;
        const dstIdx = (y * newWidth + x) * 4;

        for (let c = 0; c < 4; c++) {
          const top = data[idx00 + c] * (1 - xLerp) + data[idx10 + c] * xLerp;
          const bottom =
            data[idx01 + c] * (1 - xLerp) + data[idx11 + c] * xLerp;
          newData[dstIdx + c] = Math.round(top * (1 - yLerp) + bottom * yLerp);
        }
      }
    }

    return new ImageData(newData, newWidth, newHeight);
  }

  private resizeImageNearest(
    imageData: ImageData,
    newWidth: number,
    newHeight: number
  ): ImageData {
    const { width, height, data } = imageData;
    const newData = new Uint8ClampedArray(newWidth * newHeight * 4);

    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcX = Math.floor((x / newWidth) * width);
        const srcY = Math.floor((y / newHeight) * height);

        const srcIdx = (srcY * width + srcX) * 4;
        const dstIdx = (y * newWidth + x) * 4;

        newData[dstIdx] = data[srcIdx];
        newData[dstIdx + 1] = data[srcIdx + 1];
        newData[dstIdx + 2] = data[srcIdx + 2];
        newData[dstIdx + 3] = data[srcIdx + 3];
      }
    }

    return new ImageData(newData, newWidth, newHeight);
  }

  private applyBrightnessContrast(
    imageData: ImageData,
    brightness: number,
    contrast: number
  ): void {
    const { data } = imageData;

    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let value = data[i + c] / 255;

        // Brightness
        value += brightness;

        // Contrast
        value = (value - 0.5) * (1 + contrast) + 0.5;

        data[i + c] = Math.max(0, Math.min(255, Math.round(value * 255)));
      }
    }
  }

  private applyOrderedDither(
    imageData: ImageData,
    steps: number,
    palette: RGBA[]
  ): void {
    const { width, height, data } = imageData;

    // Inverted steps logic: lower = more detail
    // levels = 13 - steps (steps=1 -> 12 levels, steps=12 -> 1 level)
    const levels = Math.max(1, 13 - steps);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Convert to grayscale
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Get threshold from Bayer matrix
        const threshold =
          (BAYER_MATRIX_4X4[y % 4][x % 4] + 0.5) / BAYER_DIVISOR;

        // Calculate level with dithering
        const rawLevel = (gray / 255) * levels + threshold - 0.5;
        const level = this.clamp(Math.floor(rawLevel), 0, levels - 1);

        // Map level to target gray
        const targetGray = levels > 1 ? (level / (levels - 1)) * 255 : 0;

        // Interpolate between palette colors (2-color palette)
        const t = targetGray / 255;
        const darkColor = palette[0];
        const brightColor = palette[1];

        data[idx] = this.clamp(
          Math.round(darkColor[0] + (brightColor[0] - darkColor[0]) * t),
          0,
          255
        );
        data[idx + 1] = this.clamp(
          Math.round(darkColor[1] + (brightColor[1] - darkColor[1]) * t),
          0,
          255
        );
        data[idx + 2] = this.clamp(
          Math.round(darkColor[2] + (brightColor[2] - darkColor[2]) * t),
          0,
          255
        );
        data[idx + 3] = this.clamp(
          Math.round(darkColor[3] + (brightColor[3] - darkColor[3]) * t),
          0,
          255
        );
      }
    }
  }

  private applyPaletteQuantization(
    imageData: ImageData,
    palette: RGBA[]
  ): void {
    const { width, height, data } = imageData;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        // Find nearest color in palette
        const bestColor = this.findNearestColor([r, g, b, a], palette);

        data[idx] = bestColor[0];
        data[idx + 1] = bestColor[1];
        data[idx + 2] = bestColor[2];
        data[idx + 3] = bestColor[3];
      }
    }
  }

  private findNearestColor(color: RGBA, palette: RGBA[]): RGBA {
    let best = palette[0];
    let bestDist = Number.POSITIVE_INFINITY;

    for (const candidate of palette) {
      const dr = candidate[0] - color[0];
      const dg = candidate[1] - color[1];
      const db = candidate[2] - color[2];
      const da = candidate[3] - color[3];
      const dist = dr * dr + dg * dg + db * db + da * da;

      if (dist < bestDist) {
        bestDist = dist;
        best = candidate;
      }
    }

    return best;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
