
export const theme = {
  colors: {
    background: '#121212', // Deep Charcoal
    surface: '#1E1E1E',    // Lighter Charcoal for cards
    primary: '#F2F2F2',    // Off-White
    secondary: '#888888',  // Slate Grey
    accent: '#6366F1',     // Electric Indigo
    success: '#10B981',    // Emerald Green
    danger: '#CF6679',     // Muted Crimson
    text: '#FFFFFF',       // White for primary text
  },
  spacing: {
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
  },
  fontSizes: {
    s: 12,
    m: 16,
    l: 20,
    xl: 28,
  },
} as const;

export type Theme = typeof theme;
