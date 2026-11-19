import type { BrowserWindow,Rectangle } from 'electron';
import type { Popup } from './popup.cjs';
import type { Controller } from '../lib/controller.cjs';
export function runSmoke(context: {
  window: BrowserWindow;
  popup: Popup;
  controller: Controller;
  diagnosticsDir: string;
  log(message: string): void;
  showPopup(bounds?: Rectangle,reconnect?: boolean): Promise<void>;
  publish(): void;
}): Promise<void>;
