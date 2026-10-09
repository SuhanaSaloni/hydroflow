export const colors = {
  hydro: {
    DEFAULT: '#0284c7',
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  tier: {
    HIGH: '#dc2626',
    MEDIUM: '#d97706',
    REGULAR: '#0284c7',
  } as Record<string, string>,
};

export const tankHealthColor = (health: 'GOOD' | 'WATCH' | 'CRITICAL') =>
  health === 'GOOD' ? '#16a34a' : health === 'WATCH' ? '#d97706' : '#dc2626';

export const tierLabel: Record<string, string> = {
  HIGH: 'High Priority',
  MEDIUM: 'Medium',
  REGULAR: 'Regular',
};

export const tankerEmoji: Record<string, string> = {
  'T-107': '🚛',
  'T-214': '🚚',
  'T-032': '🚛',
};