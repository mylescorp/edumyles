import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const theme = {
  colors: {
    primary: '#2563eb',
    secondary: '#7c3aed',
    success: '#16a34a',
    warning: '#ea580c',
    error: '#dc2626',
    info: '#0891b2',
    
    background: '#ffffff',
    surface: '#f8fafc',
    card: '#ffffff',
    
    text: '#1e293b',
    textSecondary: '#64748b',
    textLight: '#94a3b8',
    
    white: '#ffffff',
    black: '#000000',
    
    border: '#e2e8f0',
    separator: '#f1f5f9',
    
    // Status colors
    present: '#16a34a',
    absent: '#dc2626',
    late: '#ea580c',
    excused: '#6366f1',
    
    // Grade colors
    gradeA: '#16a34a',
    gradeB: '#0891b2',
    gradeC: '#eab308',
    gradeD: '#ea580c',
    gradeF: '#dc2626',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  fonts: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  
  dimensions: {
    width,
    height,
    isSmallDevice: width < 380,
    isMediumDevice: width >= 380 && width < 768,
    isLargeDevice: width >= 768,
  },
};

export const createStyleSheet = <T extends StyleSheet.NamedStyles<T>>(styles: T): T => {
  return StyleSheet.create(styles) as T;
};
