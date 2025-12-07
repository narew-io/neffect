// ================================================================
// ---------------------- HALFTONE PROCESSOR ----------------------
// ================================================================

import {
  BaseProcessImage,
  type ProcessorConfig,
  type ProcessorPreset,
  type SettingDefinition,
} from "../base-processor";

/* TYPES */
type HalftoneShape = "circle" | "square" | "diamond";
type HalftoneColor = "BLACK" | "WHITE" | "BLUE" | "CUSTOM";

const COLORS: Record<HalftoneColor, [number, number, number, number]> = {
  BLACK: [0, 0, 0, 255],
  WHITE: [255, 255, 255, 255],
  BLUE: [59, 130, 245, 255],
  CUSTOM: [0, 0, 0, 255],
};

export class HalftoneProcessor extends BaseProcessImage {
  readonly config: ProcessorConfig = {
    id: "halftone",
    name: "Halftone",
    description: "Create newspaper-style dot pattern effect.",
    icon: "",
  };

  readonly presets: ProcessorPreset[] = [
    {
      id: "newspaper",
      name: "Newspaper",
      description: "Classic black newspaper print",
      settings: {
        dotSize: 6,
        spacing: 8,
        shape: "circle",
        color: "BLACK",
        background: "WHITE",
        angle: 45,
      },
    },
    {
      id: "pop-art",
      name: "Pop Art",
      description: "Bold dots, comic book style",
      settings: {
        dotSize: 10,
        spacing: 12,
        shape: "circle",
        color: "BLUE",
        background: "WHITE",
        angle: 0,
      },
    },
    {
      id: "fine-print",
      name: "Fine Print",
      description: "Small, dense dots",
      settings: {
        dotSize: 3,
        spacing: 4,
        shape: "circle",
        color: "BLACK",
        background: "WHITE",
        angle: 30,
      },
    },
  ];

  readonly settings: SettingDefinition[] = [
    {
      id: "dotSize",
      type: "range",
      label: "Dot Size",
      description: "Maximum dot size",
      default: 6,
      min: 2,
      max: 20,
      step: 1,
    },
    {
      id: "spacing",
      type: "range",
      label: "Spacing",
      description: "Space between dot centers",
      default: 8,
      min: 3,
      max: 24,
      step: 1,
    },
    {
      id: "shape",
      type: "select",
      label: "Shape",
      description: "Dot shape",
      default: "circle",
      options: [
        { value: "circle", label: "Circle" },
        { value: "square", label: "Square" },
        { value: "diamond", label: "Diamond" },
      ],
    },
    {
      id: "color",
      type: "select",
      label: "Dot Color",
      description: "Color of the dots",
      default: "BLACK",
      options: [
        { value: "BLACK", label: "Black" },
        { value: "WHITE", label: "White" },
        { value: "BLUE", label: "Blue" },
      ],
    },
    {
      id: "background",
      type: "select",
      label: "Background",
      description: "Background color",
      default: "WHITE",
      options: [
        { value: "WHITE", label: "White" },
        { value: "BLACK", label: "Black" },
        { value: "TRANSPARENT", label: "Transparent" },
      ],
    },
    {
      id: "angle",
      type: "range",
      label: "Angle",
      description: "Grid rotation angle",
      default: 45,
      min: 0,
      max: 90,
      step: 5,
    },
  ];

  async process(
    imageData: ImageData,
    settings: Record<string, unknown>
  ): Promise<ImageData> {
    const dotSize = Math.max(2, Math.round((settings.dotSize as number) || 6));
    const spacing = Math.max(3, Math.round((settings.spacing as number) || 8));
    const shape = (settings.shape as HalftoneShape) || "circle";
    const colorKey = (settings.color as HalftoneColor) || "BLACK";
    const backgroundKey = (settings.background as string) || "WHITE";
    const angle = ((settings.angle as number) || 45) * (Math.PI / 180);

    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(width * height * 4);

    // Fill background
    const bgColor =
      backgroundKey === "TRANSPARENT"
        ? [0, 0, 0, 0]
        : COLORS[backgroundKey as HalftoneColor] || COLORS.WHITE;

    for (let i = 0; i < result.length; i += 4) {
      result[i] = bgColor[0];
      result[i + 1] = bgColor[1];
      result[i + 2] = bgColor[2];
      result[i + 3] = bgColor[3];
    }

    const dotColor = COLORS[colorKey];
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Calculate grid size to cover rotated image
    const maxDim = Math.sqrt(width * width + height * height);
    const gridCols = Math.ceil(maxDim / spacing) + 2;
    const gridRows = Math.ceil(maxDim / spacing) + 2;

    // Center offset for rotation
    const cx = width / 2;
    const cy = height / 2;

    // Process each grid cell
    for (let gy = -gridRows / 2; gy < gridRows / 2; gy++) {
      for (let gx = -gridCols / 2; gx < gridCols / 2; gx++) {
        // Grid position in rotated space
        const rx = gx * spacing;
        const ry = gy * spacing;

        // Transform back to image space
        const px = cx + rx * cosA - ry * sinA;
        const py = cy + rx * sinA + ry * cosA;

        // Skip if outside image
        if (px < 0 || px >= width || py < 0 || py >= height) continue;

        // Sample brightness at this point (average of small area)
        const brightness = this.sampleBrightness(
          data,
          width,
          height,
          px,
          py,
          spacing / 2
        );

        // Calculate dot radius based on brightness (darker = bigger dot)
        const radius = ((255 - brightness) / 255) * (dotSize / 2);

        if (radius < 0.5) continue;

        // Draw the dot
        this.drawDot(result, width, height, px, py, radius, shape, dotColor);
      }
    }

    return new ImageData(result, width, height);
  }

  private sampleBrightness(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    px: number,
    py: number,
    radius: number
  ): number {
    let total = 0;
    let count = 0;

    const minX = Math.max(0, Math.floor(px - radius));
    const maxX = Math.min(width - 1, Math.ceil(px + radius));
    const minY = Math.max(0, Math.floor(py - radius));
    const maxY = Math.min(height - 1, Math.ceil(py + radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const idx = (y * width + x) * 4;
        const gray =
          0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        total += gray;
        count++;
      }
    }

    return count > 0 ? total / count : 255;
  }

  private drawDot(
    result: Uint8ClampedArray,
    width: number,
    height: number,
    cx: number,
    cy: number,
    radius: number,
    shape: HalftoneShape,
    color: [number, number, number, number]
  ): void {
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(width - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(height - 1, Math.ceil(cy + radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        let inside = false;

        switch (shape) {
          case "circle":
            inside = dx * dx + dy * dy <= radius * radius;
            break;
          case "square":
            inside = Math.abs(dx) <= radius && Math.abs(dy) <= radius;
            break;
          case "diamond":
            inside = Math.abs(dx) + Math.abs(dy) <= radius * 1.4;
            break;
        }

        if (inside) {
          const idx = (y * width + x) * 4;
          result[idx] = color[0];
          result[idx + 1] = color[1];
          result[idx + 2] = color[2];
          result[idx + 3] = color[3];
        }
      }
    }
  }
}
