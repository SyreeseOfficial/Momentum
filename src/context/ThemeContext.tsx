import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { DARK_COLORS, LIGHT_COLORS, SPACING, FONT_SIZES, Theme, ThemeColors } from '../constants/theme';
import { useTrackers } from './TrackerContext';

const ThemeContext = createContext<Theme>({
    colors: DARK_COLORS,
    spacing: SPACING,
    fontSizes: FONT_SIZES,
    isDark: true,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useColorScheme();
    const { preferences } = useTrackers();

    const theme = useMemo((): Theme => {
        const scheme = preferences.colorScheme ?? 'dark';
        const isDark = scheme === 'system' ? systemScheme !== 'light' : scheme === 'dark';
        const base = isDark ? DARK_COLORS : LIGHT_COLORS;
        const colors: ThemeColors = { ...base, accent: preferences.accentColor ?? base.accent };
        return { colors, spacing: SPACING, fontSizes: FONT_SIZES, isDark };
    }, [preferences.colorScheme, preferences.accentColor, systemScheme]);

    return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = (): Theme => useContext(ThemeContext);
