/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#FD7E14';
const tintColorDark = '#FD7E14';

export const Colors = {
  light: {
    primary: '#FD7E14',
    text: '#212529',
    background: '#F8F9FA',
    tint: tintColorLight,
    icon: '#6C757D',
    border: '#DEE2E6',
    card: '#FFFFFF',
    tabIconDefault: '#6C757D',
    tabIconSelected: tintColorLight,
  },
  dark: {
    primary: '#FD7E14',
    text: '#F8F9FA',
    background: '#212529',
    tint: tintColorDark,
    icon: '#ADB5BD',
    border: '#495057',
    card: '#343A40',
    tabIconDefault: '#ADB5BD',
    tabIconSelected: tintColorDark,
  },
};

export const Utility = {
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
  },
  borderRadius: {
    s: 4,
    m: 8,
    l: 12,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
