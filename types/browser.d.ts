import type { ColorValues, FilterDefinition, ScreenColorAPI } from '../shared/types';

declare global {
  interface Window {
    screenColor?: ScreenColorAPI;
    ScreenColorFilters: readonly FilterDefinition[];
    ColorPreview: {
      colorMatrix(values: ColorValues): number[];
      svgMatrix(values: ColorValues): string;
      shouldSimulate(desktop: boolean, enabled: boolean): boolean;
    };
  }
}
