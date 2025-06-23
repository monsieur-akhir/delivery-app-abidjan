import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF6B00',
    accent: '#FF8C42',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#000000',
    onSurface: '#000000',
    placeholder: '#666666',
    disabled: '#CCCCCC',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#FF6B00',
    error: '#B00020',
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    onBackground: '#000000',
    onError: '#FFFFFF',
    outline: '#79747E',
    shadow: '#000000',
    inverseSurface: '#313033',
    inverseOnSurface: '#F4EFF4',
    inversePrimary: '#FFB77C',
    surfaceDisabled: 'rgba(28, 27, 31, 0.12)',
    onSurfaceDisabled: 'rgba(28, 27, 31, 0.38)',
    scrim: '#000000',
  },
};

// Couleurs supplémentaires pour l'application
export const colors = {
  orange: '#FF6B00',
  lightOrange: '#FFD6B0',
  darkOrange: '#C85000',
  gray: '#757575',
  lightGray: '#E0E0E0',
  darkGray: '#333333',
  white: '#FFFFFF',
  black: '#000000',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',
  surface: '#FFFFFF',
};

export default colors

// Export alternatif pour la compatibilité
export const COLORS = colors
export { colors }