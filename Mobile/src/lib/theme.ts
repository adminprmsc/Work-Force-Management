export const colors = {
  background: '#ffffff',
  surface: '#f8fafc',
  foreground: '#0f172a',
  primary: '#0d3a6b',
  primaryDark: '#0a2e55',
  primaryForeground: '#f8fafc',
  secondary: '#f1f5f9',
  secondaryForeground: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  card: '#ffffff',
  destructive: '#dc2626',
  destructiveForeground: '#ffffff',
  success: '#047857',
  successBg: '#ecfdf5',
  warning: '#b45309',
  warningBg: '#fffbeb',
  slate100: '#f1f5f9',
  slate700: '#334155',
  emerald800: '#065f46',
  amber900: '#78350f',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
} as const;

export const layoutPadding = {
  screen: 20,
  card: 16,
} as const;
