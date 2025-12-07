# 🎨 Neffect - Bulk Image Processing

Aplikacja do przetwarzania wielu zdjęć jednocześnie z efektami takimi jak dithering, pixelate, halftone i więcej!

## ✨ Funkcje

- **Przetwarzanie wsadowe** - przetwarzaj wiele zdjęć naraz
- **Live Preview** - podgląd efektu w czasie rzeczywistym
- **Profile** - różne zestawy ustawień dla różnych projektów
- **Presety** - gotowe ustawienia dla każdego efektu
- **Upload z URL** - dodawaj zdjęcia z linku lub z komputera

## 🚀 Szybki Start

### 1. Instalacja

```bash
# Sklonuj repo
git clone <repo-url>
cd neffect

# Zainstaluj zależności
npm install
```

### 2. Uruchomienie

```bash
npm run dev
```

Otwórz **http://localhost:5173** w przeglądarce.

## 📖 Jak używać

1. **Wybierz efekt** - na stronie głównej kliknij w efekt (np. Dithering)
2. **Ustaw parametry** - wybierz preset lub dostosuj ręcznie
3. **Dodaj zdjęcia** - przeciągnij pliki lub wklej URL
4. **Przetwórz** - kliknij "Process Images"
5. **Pobierz** - pobierz pojedynczo lub wszystkie naraz

## 🔧 Dodawanie własnych efektów

### Metoda 1: Z pomocą AI (Polecana!)

Wklej do swojego AI (np. Claude, ChatGPT) ten prompt:

```
Stwórz nowy procesor obrazów dla aplikacji Neffect.

Wzoruj się na tym przykładzie (Pixelate):
[wklej zawartość pliku app/core/processors/pixelate.ts]

Stwórz procesor który: [opisz co ma robić Twój efekt]

Wymagania:
- Klasa musi rozszerzać BaseProcessImage
- Musi mieć config (id, name, description, icon)
- Musi mieć presets (gotowe ustawienia)
- Musi mieć settings (parametry do regulacji)
- Funkcja process() przetwarza ImageData
```

### Metoda 2: Ręcznie

1. **Stwórz plik** w `app/core/processors/`:

```typescript
// app/core/processors/my-effect.ts
import { BaseProcessImage } from "../base-processor";

export class MyEffectProcessor extends BaseProcessImage {
  config = {
    id: "my-effect",
    name: "My Effect",
    description: "Opis efektu",
    icon: "🎨",
  };

  presets = [
    {
      id: "default",
      name: "Default",
      description: "Domyślne ustawienia",
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

    // Twój kod przetwarzania
    for (let i = 0; i < data.length; i += 4) {
      // data[i] = R, data[i+1] = G, data[i+2] = B, data[i+3] = A
    }

    return imageData;
  }
}
```

2. **Zarejestruj procesor** w `app/core/processors/index.ts`:

```typescript
import { MyEffectProcessor } from "./my-effect";

const PROCESSORS = [
  new DitheringProcessor(),
  new PixelateProcessor(),
  new HalftoneProcessor(),
  new MyEffectProcessor(), // ← Dodaj tutaj
];
```

3. Gotowe! Efekt pojawi się na stronie głównej.

## 📁 Struktura projektu

```
app/
├── components/     # Komponenty React
├── config/         # Konfiguracja
├── core/
│   ├── base-processor.ts   # Bazowa klasa procesora
│   └── processors/         # ← Tu dodawaj efekty
├── routes/         # Strony aplikacji
└── utils/          # Pomocnicze funkcje

style/              # Style SCSS
```

## 🛠 Technologie

- **React Router v7** - routing i SSR
- **TypeScript** - typowanie
- **SCSS** - stylowanie
- **Vite** - bundler

## 📄 Licencja

MIT

---

Made with ❤️
