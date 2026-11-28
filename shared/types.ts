// Internal contracts only. Disk, IPC and native inputs still require runtime validation.
export interface ColorValues {
  saturation: number;
  contrast: number;
  warmth: number;
  brightness: number;
  tint: number;
}

export type ColorControl = keyof ColorValues;
export interface Profile { id: string; name: string; values: ColorValues }
export interface FilterDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly values: Readonly<ColorValues>;
}
export interface Preferences { startup: boolean; minimizeToTray: boolean }
export interface PersistedState {
  version: 1;
  enabled: boolean;
  values: ColorValues;
  profileId: string | null;
  profiles: Profile[];
  preferences: Preferences;
}
export interface ControllerSnapshot extends PersistedState {
  ready: boolean;
  error: string | null;
  warning: string | null;
  previewUntil: number | null;
}
export type ControllerPayloads = {
  values: ColorValues;
  toggle: boolean;
  reset: undefined;
  preset: string;
  saveProfile: string;
  deleteProfile: string;
  preferences: Preferences;
  preview: undefined;
  reapply: undefined;
  retry: undefined;
};
export type ControllerArguments = {
  [K in keyof ControllerPayloads]: ControllerPayloads[K] extends undefined ?
    [type: K, payload?: undefined] : [type: K, payload: ControllerPayloads[K]]
}[keyof ControllerPayloads];
export type SupportDestination = 'help' | 'apps' | 'feedback' | 'issues' | 'guide';
export type WindowColors = { background: string; surface: string };
export type ActionPayloads = ControllerPayloads & {
  openSupport: SupportDestination;
  finishTour: undefined;
  dismissSupport: undefined;
  checkUpdates: undefined;
  downloadUpdate: undefined;
  dismissUpdate: undefined;
  quit: undefined;
  openFullApp: undefined;
  openPopup: undefined;
  hidePopup: undefined;
  pinPopup: boolean;
  windowColors: WindowColors;
};
export type Action = {
  [K in keyof ActionPayloads]: { type: K; payload: ActionPayloads[K] }
}[keyof ActionPayloads];

export type NativeCommand = { command: 'apply'; values: ColorValues } |
  { command: 'reset' | 'quit' };
export type NativeReply = { id: number; ok: true } | { id: number; ok: false; error: string };
export interface ExperienceSnapshot {
  version: 1;
  launches: number;
  tourDone: boolean;
  supportDismissed: boolean;
  notifiedVersion: string | null;
  dismissedVersion: string | null;
  supportDue: boolean;
}
export interface AvailableUpdate { version: string; url: string; releaseURL: string; size: number }
export interface UpdateSnapshot {
  current: string;
  status: 'idle' | 'checking' | 'available' | 'current' | 'error';
  available: AvailableUpdate | null;
  error: string | null;
  checkedAt: number | null;
}
export interface ScreenColorSnapshot extends Omit<ControllerSnapshot, 'version'> {
  popupPinned: boolean;
  startupActual: boolean;
  startupWarning: string | null;
  shortcutAvailable: boolean;
  development: boolean;
  version: string;
  smoke: boolean;
  workspaceVisible: boolean;
  experience: ExperienceSnapshot;
  experiencePrompts: boolean;
  updates: UpdateSnapshot;
  displays: { id: number; name: string; width: number; height: number }[];
}
export type ActionResult = { ok: true; state: ScreenColorSnapshot } |
  { ok: false; error: string; state: ScreenColorSnapshot };
export type ActionArguments = {
  [K in keyof ActionPayloads]: ActionPayloads[K] extends undefined ?
    [type: K, payload?: undefined] : [type: K, payload: ActionPayloads[K]]
}[keyof ActionPayloads];
export interface ScreenColorAPI {
  getState(): Promise<ScreenColorSnapshot>;
  action(...args: ActionArguments): Promise<ActionResult>;
  subscribe(listener: (state: ScreenColorSnapshot) => void): () => void;
}
