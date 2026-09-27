// Resolves 'morning' | 'evening' | 'night' from hour, or manual override.
export function daypartNow(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

// Character theme derived from settings.theme ('auto' follows clock).
export function themeNow(setting = 'auto', date = new Date()) {
  if (setting && setting !== 'auto') return setting === 'afternoon' ? 'morning' : setting;
  const d = daypartNow(date);
  if (d === 'afternoon') return 'morning';
  return d;
}

export const THEME_TINT = {
  morning: { body: null, light: '#fff7ed', greeting: 'Good morning!' },
  evening: { body: '#f97362', light: '#fed7aa', greeting: 'Good evening!' },
  night: { body: '#c2413f', light: '#bfdbfe', greeting: 'Night shift!' },
};
