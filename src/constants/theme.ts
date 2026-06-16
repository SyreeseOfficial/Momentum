
export const SPACING = { s: 8, m: 16, l: 24, xl: 32 } as const;
export const FONT_SIZES = { s: 12, m: 16, l: 20, xl: 28 } as const;

export const DARK_COLORS = {
    background: '#121212',
    surface: '#1E1E1E',
    primary: '#F2F2F2',
    secondary: '#888888',
    accent: '#6366F1',
    success: '#10B981',
    danger: '#CF6679',
    text: '#FFFFFF',
} as const;

export const LIGHT_COLORS = {
    background: '#F0F0F0',
    surface: '#FFFFFF',
    primary: '#1A1A1A',
    secondary: '#666666',
    accent: '#6366F1',
    success: '#059669',
    danger: '#DC2626',
    text: '#000000',
} as const;

export type ThemeColors = typeof DARK_COLORS;

// Static default for non-hook contexts (e.g. StyleSheet outside components)
export const theme = {
    colors: DARK_COLORS,
    spacing: SPACING,
    fontSizes: FONT_SIZES,
} as const;

export type Theme = {
    colors: ThemeColors;
    spacing: typeof SPACING;
    fontSizes: typeof FONT_SIZES;
    isDark: boolean;
};
