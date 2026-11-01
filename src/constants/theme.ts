export const Colors = {
  light: {
    text: '#1A1F16',
    textSecondary: '#5C6657',
    background: '#FFFFFF',
    backgroundElement: '#F1F4EE',
    border: '#DDE3D8',
    primary: '#2E7D32',
    onPrimary: '#FFFFFF',
    danger: '#C62828',
  },
  dark: {
    text: '#F2F5EF',
    textSecondary: '#A9B3A3',
    background: '#10130E',
    backgroundElement: '#1E231B',
    border: '#333A2E',
    primary: '#66BB6A',
    onPrimary: '#10130E',
    danger: '#EF9A9A',
  },
} as const;

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
} as const;
