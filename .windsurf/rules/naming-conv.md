---
trigger: always_on
---

# Naming Convention & Best Practices

## 1. File Naming

### React Components

**Convention:** `PascalCase`
Files inside `app/components` should always start with an uppercase letter.

**Examples:**

- `About.tsx` ✅
- `Hero.tsx` ✅
- `PageTransition.tsx` ✅
- `about.tsx` ❌

### SCSS Partials

**Convention:** `kebab-case` with underscore prefix
Files inside `app/style` should be lowercase, words separated by hyphens.

**Examples:**

- `_about-section.scss` ✅
- `_hero.scss` ✅
- `_tokens.scss` ✅
- `_About.scss` ❌

---

## 2. CSS / SCSS Methodologies

We follow a modified **BEM (Block Element Modifier)** methodology to ensure styles are modular and reusable.

### Standard BEM (Recommended)

- **Block**: `block` (e.g., `.card`, `.hero`)
- **Element**: `block__element` (e.g., `.card__title`, `.hero__image`)
- **Modifier**: `block--modifier` (e.g., `.card--featured`, `.btn--primary`)

### Current Project Style (Snake-Case Variation)

_Currently observed in the codebase, can be refactored to Standard BEM for consistency._

- **Block**: `.about_section`
- **Element**: `.about_label`
- **Modifier**: `.text-primary` (Utilities often keep kebab-case)

**Recommendation:**
Migrate to **Standard BEM** (`kebab-case` everywhere) for consistency with typical web development standards and libraries.

**Example of Recommended Structure:**

```scss
// Block
.about {
  // Element
  &__container { ... }
  &__title { ... }
  &__label { ... }

  // Modifier
  &--dark { ... }
}
```

### Utility Classes

**Convention:** `kebab-case`
Helper classes that do one thing.

**Examples:**

- `.layout-cols`
- `.section-title`

---

## 3. SCSS Variables & Tokens

**Convention:** `kebab-case`
All SASS variables should be lowercase with hyphens.

**Examples:**

- `$color-primary` ✅
- `$text-2xl` ✅
- `$ColorPrimary` ❌

---

## 4. React Component Structure

```tsx
// Imports
import { useState } from "react";
import styles from "./styles.module.scss"; // If using modules
// OR
// import Global Styles if global

// Types/Interfaces
interface HeroProps {
  title: string;
}

// Component
const Hero = ({ title }: HeroProps) => {
  return (
    <section className="hero">
      <div className="hero__container">
        <h1 className="hero__title">{title}</h1>
      </div>
    </section>
  );
};

export default Hero;
```

---

## 5. Section Structure Convention

**Convention:** `Block -> Container -> Elements`

Every page section should follow this structure to ensure consistent layout and spacing.

1.  **Section Wrapper**: The outer `<section>` element defines the block context.
    *   **Class:** Matches the component name (e.g., `.contact`, `.hero`).
    *   **ID:** Matches the component name (e.g., `#contact`).
2.  **Container**: An inner wrapper responsible for grid layout and centering.
    *   **Class:** `block__container` (e.g., `.contact__container`, `.hero__container`).
    *   **Mixin:** Should use `@include layout-cols(12);` or similar layout mixin.

**Example:**

```tsx
<section id="contact-page" className="contact-page">
  <div className="contact-page__container">
    {/* Content goes here */}
    <div className="contact-page__header">...</div>
  </div>
</section>
```

```scss
.contact-page {
  @include section-style;

  &__container {
    @include layout-cols(12);
    // ...
  }
}
```