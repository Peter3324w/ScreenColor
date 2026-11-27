import fs = require('node:fs');
import { object } from './validation.cjs';
import type { WindowColors } from '../shared/types';

// The native window paints its own background before the page does. These are
// the page grounds (full app = --bg, quick controls = --surface), remembered so
// a Light window does not open black and a dark one does not open white.
export const DEFAULT_WINDOW_COLORS: Readonly<WindowColors> = Object.freeze({ background: '#000000', surface: '#000000' });
const HEX = /^#[0-9a-f]{6}$/i;
export function validateWindowColors(input: unknown): WindowColors {
  if (!object(input) || Object.keys(input).length !== 2 || typeof input.background !== 'string' || typeof input.surface !== 'string' ||
    !HEX.test(input.background) || !HEX.test(input.surface)) throw new Error('Invalid window colors.');
  return { background: input.background.toLowerCase(), surface: input.surface.toLowerCase() };
}
export function loadWindowColors(file: string): WindowColors {
  try { return validateWindowColors(JSON.parse(fs.readFileSync(file, 'utf8')) as unknown); }
  catch { return { ...DEFAULT_WINDOW_COLORS }; }
}
export function saveWindowColors(file: string, colors: WindowColors): void {
  const temp = file + '.' + process.pid + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(colors), 'utf8');
  fs.renameSync(temp, file);
}
