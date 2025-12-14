// ================================================================
// ----------------------- BASE PROCESSOR -------------------------
// ================================================================

import { initWasm, isWasmAvailable } from "./wasm-processor";

export interface ProcessorConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  mp4support: boolean;
}

export interface ProcessorPreset {
  id: string;
  name: string;
  description: string;
  settings: Record<string, unknown>;
  baseSettings?: Partial<BaseSettings>;
  thumbnail?: string;
}

export interface SettingDefinition {
  id: string;
  type: "range" | "select" | "checkbox" | "color";
  label: string;
  description?: string;
  default: unknown;
  options?: { value: string | number; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}

// ================================================================
// ------------------------ BASE SETTINGS -------------------------
// ================================================================

export interface BaseSettings {
  /** Transparency of the output image (0-100) */
  base_opacity: number;
  /** Keep original input resolution for output */
  keep_original_resolution: boolean;
  [key: string]: unknown;
}

export const BASE_SETTINGS_DEFINITIONS: SettingDefinition[] = [
  {
    id: "base_opacity",
    type: "range",
    label: "Opacity",
    description: "Transparency of the output image",
    default: 100,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    id: "keep_original_resolution",
    type: "checkbox",
    label: "Save original resolution",
    description: "Output will have the same resolution as the input file",
    default: false,
  },
];

export const DEFAULT_BASE_SETTINGS: BaseSettings = {
  base_opacity: 100,
  keep_original_resolution: false,
};

export function getDefaultBaseSettings(): BaseSettings {
  return { ...DEFAULT_BASE_SETTINGS };
}

export function applyBaseSettings(
  _original: ImageData,
  processed: ImageData,
  baseSettings: BaseSettings
): ImageData {
  const opacity = baseSettings.base_opacity / 100;

  // If opacity is 100%, return processed as-is
  if (opacity >= 1) return processed;

  // Apply opacity to alpha channel (like Figma)
  const result = new ImageData(
    new Uint8ClampedArray(processed.data),
    processed.width,
    processed.height
  );

  for (let i = 0; i < result.data.length; i += 4) {
    // Multiply alpha channel by opacity
    result.data[i + 3] = Math.round(processed.data[i + 3] * opacity);
  }

  return result;
}

export interface ProcessResult {
  success: boolean;
  filename: string;
  buffer?: Uint8Array;
  error?: string;
}

export interface BatchProgress {
  current: number;
  total: number;
  filename: string;
}

// ================================================================
// -------------------- BASE PROCESSOR CLASS ----------------------
// ================================================================

export abstract class BaseProcessImage {
  abstract readonly config: ProcessorConfig;
  abstract readonly presets: ProcessorPreset[];
  abstract readonly settings: SettingDefinition[];

  abstract process(
    imageData: ImageData,
    settings: Record<string, unknown>
  ): Promise<ImageData>;

  async processBatch(
    images: { filename: string; imageData: ImageData }[],
    settings: Record<string, unknown>,
    onProgress?: (progress: BatchProgress) => void
  ): Promise<{ filename: string; imageData: ImageData }[]> {
    const results: { filename: string; imageData: ImageData }[] = [];

    for (let i = 0; i < images.length; i++) {
      const { filename, imageData } = images[i];

      onProgress?.({
        current: i + 1,
        total: images.length,
        filename,
      });

      const processed = await this.process(imageData, settings);
      results.push({ filename, imageData: processed });
    }

    return results;
  }

  getPreset(presetId: string): ProcessorPreset | undefined {
    return this.presets.find((p) => p.id === presetId);
  }

  getDefaultSettings(): Record<string, unknown> {
    return this.settings.reduce(
      (acc, setting) => {
        acc[setting.id] = setting.default;
        return acc;
      },
      {} as Record<string, unknown>
    );
  }
}

// ================================================================
// -------------------- BASE JS PROCESSOR -------------------------
// ================================================================

export abstract class BaseJsProcessor extends BaseProcessImage {
  abstract processJs(
    imageData: ImageData,
    settings: Record<string, unknown>
  ): Promise<ImageData>;

  async process(
    imageData: ImageData,
    settings: Record<string, unknown>
  ): Promise<ImageData> {
    console.time(`JS ${this.config.id}`);
    const result = await this.processJs(imageData, settings);
    console.timeEnd(`JS ${this.config.id}`);
    return result;
  }
}

// ================================================================
// -------------------- BASE WASM PROCESSOR -----------------------
// ================================================================

let wasmInitialized = false;
let wasmInitPromise: Promise<boolean> | null = null;

async function ensureWasmLoaded(): Promise<boolean> {
  if (wasmInitialized) return isWasmAvailable();
  if (!wasmInitPromise) {
    wasmInitPromise = initWasm().then((success) => {
      wasmInitialized = true;
      return success;
    });
  }
  return wasmInitPromise;
}

export abstract class BaseWasmProcessor extends BaseProcessImage {
  /* WASM processing method - override this */
  abstract processWasm(
    imageData: ImageData,
    settings: Record<string, unknown>
  ): ImageData;

  /* JavaScript fallback - override this */
  abstract processJs(
    imageData: ImageData,
    settings: Record<string, unknown>
  ): Promise<ImageData>;

  /* Main process method - tries WASM first, falls back to JS */
  async process(
    imageData: ImageData,
    settings: Record<string, unknown>
  ): Promise<ImageData> {
    const useWasm = await ensureWasmLoaded();

    if (useWasm) {
      try {
        console.time(`WASM ${this.config.id}`);
        const result = this.processWasm(imageData, settings);
        console.timeEnd(`WASM ${this.config.id}`);
        return result;
      } catch (error) {
        console.warn(
          `WASM ${this.config.id} failed, falling back to JS:`,
          error
        );
      }
    }

    console.time(`JS ${this.config.id}`);
    const result = await this.processJs(imageData, settings);
    console.timeEnd(`JS ${this.config.id}`);
    return result;
  }

  /* Check if WASM is available */
  static async isWasmReady(): Promise<boolean> {
    return ensureWasmLoaded();
  }
}
