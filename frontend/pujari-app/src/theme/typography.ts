import { Platform } from 'react-native';

export const typography = {
    fonts: {
        regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
        medium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
        bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
    },
    sizes: {
        h1: 28,
        h2: 24,
        body: 16,
        subtext: 14,
        caption: 12,
    },
    weights: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '800' as const,
    },
    lineHeights: {
        h1: 34,
        body: 24,
        caption: 18,
    }
};
