// ================================================================
// ----------------------- BASE PROCESSOR -------------------------
// ================================================================

export interface ProcessorConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface ProcessorPreset {
  id: string;
  name: string;
  description: string;
  settings: Record<string, unknown>;
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
// ---------------------- BASE PROCESSOR CLASS --------------------
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
