import { useCallback, useState } from 'react';

const KEY = 'pomo-settings-v1';

const DEFAULTS = {
  sound: true,
  notifications: true,
  autoBreaks: true, // auto-start break after focus
  autoFocus: true, // auto-start focus after break
  celebrateSecs: 4,
  dailyGoal: 8,
  theme: 'auto', // auto | morning | evening | night (3D character)
};

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(load);

  const update = useCallback((patch) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    ['pomo-profile-v1', 'pomo-days-v1', 'pomo-ach-v1', 'pomo-completed', 'pomo-tasks-v1', 'pomo-onboarded-v1'].forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    });
  }, []);

  return { settings, update, resetAll };
}
