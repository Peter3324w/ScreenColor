import type { ColorValues, FilterDefinition, ScreenColorAPI } from '../shared/types';

declare global {
  interface Window {
    ScreenIcons: { paint(root?: ParentNode): void };
    PlaytimeDesign: {
      THEMES: readonly {id: string; label: string}[];
      ACCENT_POPULAR: readonly string[];
      applyAppearance(theme?: string|null,accent?: string|null): void;
      hexToRgb(value: unknown): [number,number,number]|null;
    };
    ImagePreview: { update(values: ColorValues,enabled: boolean,desktop: boolean): void };
    screenColor?: ScreenColorAPI;
    ScreenColorFilters: readonly FilterDefinition[];
    ColorPreview: {
      colorMatrix(values: ColorValues): number[];
      svgMatrix(values: ColorValues): string;
      shouldSimulate(desktop: boolean, enabled: boolean): boolean;
    };
  }
}
