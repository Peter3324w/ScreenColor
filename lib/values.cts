import type { ColorControl, ColorValues } from '../shared/types';

export const LIMITS: Readonly<Record<ColorControl, readonly [number, number]>> = Object.freeze({
  saturation: [0, 200], contrast: [80, 140], warmth: [-300, 300],
  brightness: [80, 120], tint: [-100, 100]
});
export const DEFAULT_VALUES: Readonly<ColorValues> = Object.freeze({
  saturation: 100, contrast: 100, warmth: 0, brightness: 100, tint: 0
});
export const REFERENCE: Readonly<ColorValues> = Object.freeze({
  ...DEFAULT_VALUES, saturation: 139, contrast: 115, warmth: 100
});

export function validateValues(input: unknown): ColorValues {
  if (input === null || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== 5) {
    throw new Error('Provide all five color controls.');
  }
  const values: Record<string, unknown> = input as Record<string, unknown>;
  function control(key: ColorControl): number {
    const n = values[key];
    const [min, max] = LIMITS[key];
    if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) {
      throw new Error(`${key} must be between ${min} and ${max}.`);
    }
    return Math.round(n * 100) / 100;
  }
  return { saturation: control('saturation'), contrast: control('contrast'), warmth: control('warmth'),
    brightness: control('brightness'), tint: control('tint') };
}
