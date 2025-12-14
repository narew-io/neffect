// ================================================================
// ----------------------- WASM UTILITIES -------------------------
// ================================================================

// @ts-ignore: AssemblyScript decorator
@inline
export function clamp(value: i32, min: i32, max: i32): i32 {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

// @ts-ignore: AssemblyScript decorator
@inline
export function clampF32(value: f32, min: f32, max: f32): f32 {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

// @ts-ignore: AssemblyScript decorator
@inline
export function adjustBrightnessContrast(value: i32, brightness: f32, contrast: f32): i32 {
  let v = <f32>value / 255.0;
  
  // Apply brightness (-1 to 1)
  v = v + brightness;
  
  // Apply contrast (-1 to 1)
  if (contrast != 0.0) {
    v = (v - 0.5) * (1.0 + contrast) + 0.5;
  }
  
  return clamp(<i32>(v * 255.0), 0, 255);
}

// @ts-ignore: AssemblyScript decorator
@inline
export function rgbToGray(r: i32, g: i32, b: i32): i32 {
  return (r * 299 + g * 587 + b * 114) / 1000;
}
