# 🎨 Neffect - Bulk Image Processing

An open source bulk image processing application with effects like dithering, pixelate, halftone and more!

## ✨ Features

- **Batch Processing** - process multiple images at once
- **Live Preview** - real-time effect preview
- **Profiles** - different setting sets for different projects
- **Presets** - ready-made settings for each effect
- **URL Upload** - add images from links or from your computer

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repo
git clone <repo-url>
cd neffect

# Install dependencies
npm install
```

### 2. Run

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

## 📖 How to Use

1. **Select Effect** - on the main page click an effect (e.g., Dithering)
2. **Set Parameters** - choose a preset or adjust manually
3. **Add Images** - drag files or paste a URL
4. **Process** - click "Process Images"
5. **Download** - download individually or all at once

## 🔧 Adding Custom Effects

### Method 1: With AI (Recommended!)

Paste this prompt into your AI (e.g., Claude, ChatGPT):

```
Create a new image processor for the Neffect application.

Use this example as reference (Pixelate):
[paste content of app/core/processors/pixelate.ts]

Create a processor that: [describe what your effect should do]

Requirements:
- Class must extend BaseProcessImage
- Must have config (id, name, description, icon)
- Must have presets (ready-made settings)
- Must have settings (parameters to adjust)
- process() function processes ImageData
```

### Method 2: Manually

1. **Create file** in `app/core/processors/`:

```typescript
// app/core/processors/my-effect.ts
import { BaseProcessImage } from "../base-processor";

export class MyEffectProcessor extends BaseProcessImage {
  config = {
    id: "my-effect",
    name: "My Effect",
    description: "Effect description",
    icon: "🎨",
  };

  presets = [
    {
      id: "default",
      name: "Default",
      description: "Default settings",
      settings: { intensity: 50 },
    },
  ];

  settings = [
    {
      id: "intensity",
      label: "Intensity",
      type: "range" as const,
      min: 0,
      max: 100,
      step: 1,
      default: 50,
    },
  ];

  async process(
    imageData: ImageData,
    settings: Record<string, unknown>
  ): Promise<ImageData> {
    const intensity = settings.intensity as number;
    const data = imageData.data;

    // Your processing code
    for (let i = 0; i < data.length; i += 4) {
      // data[i] = R, data[i+1] = G, data[i+2] = B, data[i+3] = A
    }

    return imageData;
  }
}
```

2. **Register processor** in `app/core/processors/index.ts`:

```typescript
import { MyEffectProcessor } from "./my-effect";

const PROCESSORS = [
  new DitheringProcessor(),
  new PixelateProcessor(),
  new HalftoneProcessor(),
  new MyEffectProcessor(), // ← Add here
];
```

3. Done! The effect will appear on the main page.

## 📁 Project Structure

```
app/
├── components/     # React components
├── config/         # Configuration
├── core/
│   ├── base-processor.ts   # Base processor class
│   └── processors/         # ← Add effects here
├── routes/         # Application pages
└── utils/          # Helper functions

style/              # SCSS styles
```

## 🛠 Technologies

- **React Router v7** - routing and SSR
- **TypeScript** - typing
- **SCSS** - styling
- **Vite** - bundler

## 📄 License

MIT

---

Made with ❤️
