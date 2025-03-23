/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolate between two RGB colors
 * @param colorA - Start color as [r, g, b] where each component is 0-255
 * @param colorB - End color as [r, g, b] where each component is 0-255
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated color as [r, g, b]
 */
export function interpolateRgb(
  colorA: [number, number, number], 
  colorB: [number, number, number], 
  t: number
): [number, number, number] {
  return [
    Math.round(lerp(colorA[0], colorB[0], t)),
    Math.round(lerp(colorA[1], colorB[1], t)),
    Math.round(lerp(colorA[2], colorB[2], t))
  ];
}

/**
 * Converts a stress value to an RGB color using a blue-yellow-red gradient
 * @param value - Normalized value between 0 and 1
 * @returns RGB color array [r, g, b]
 */
export function stressToColor(value: number): [number, number, number] {
  // Ensure value is in the range [0, 1]
  const t = Math.max(0, Math.min(1, value));
  
  if (t < 0.5) {
    // Interpolate from blue to yellow
    return interpolateRgb([0, 128, 255], [255, 240, 0], t * 2);
  } else {
    // Interpolate from yellow to red
    return interpolateRgb([255, 240, 0], [255, 30, 0], (t - 0.5) * 2);
  }
} 