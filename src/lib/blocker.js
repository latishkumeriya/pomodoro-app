import { useCallback, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';

let cached = null;

function plugin() {
  if (cached) return cached;
  if (!Capacitor.isNativePlatform()) return null;
  try {
    cached = registerPlugin('Blocker');
    return cached;
  } catch {
    return null;
  }
}

export const isNativeApp = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export async function blockerStart(endAt) {
  const p = plugin();
  if (!p) return false;
  try {
    await p.startWatch({ endAt });
    return true;
  } catch {
    return false;
  }
}

export async function blockerStop() {
  const p = plugin();
  if (!p) return false;
  try {
    await p.stopWatch();
    return true;
  } catch {
    return false;
  }
}

export async function blockerStatus() {
  const p = plugin();
  if (!p) return { usage: false, overlay: false };
  try {
    const [u, o] = await Promise.all([p.hasUsageAccess(), p.hasOverlayPermission()]);
    return { usage: !!u.granted, overlay: !!o.granted };
  } catch {
    return { usage: false, overlay: false };
  }
}

export function openUsageSettings() {
  plugin()?.openUsageSettings?.().catch(() => {});
}

export function openOverlaySettings() {
  plugin()?.openOverlaySettings?.().catch(() => {});
}

const FLAG = 'pomo-blocker-on';

export function useBlocker() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(FLAG) === '1';
    } catch {
      return false;
    }
  });
  const [status, setStatus] = useState({ usage: false, overlay: false });

  const refresh = useCallback(async () => {
    setStatus(await blockerStatus());
  }, []);

  const toggle = useCallback(() => {
    setEnabled((v) => {
      try {
        localStorage.setItem(FLAG, v ? '0' : '1');
      } catch {
        /* ignore */
      }
      return !v;
    });
  }, []);

  const isOn = useCallback(() => {
    try {
      return localStorage.getItem(FLAG) === '1';
    } catch {
      return false;
    }
  }, []);

  return { enabled, toggle, status, refresh, isOn };
}
