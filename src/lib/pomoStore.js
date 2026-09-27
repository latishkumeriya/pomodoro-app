import { useCallback, useState } from 'react';

const KEY = 'pomo-profile-v1';

export const SKINS = [
  { id: 'ruby', label: 'Ruby', color: '#ff4d4d' },
  { id: 'ember', label: 'Ember', color: '#ff8c42' },
  { id: 'berry', label: 'Berry', color: '#b565d8' },
  { id: 'matcha', label: 'Matcha', color: '#5fbf6b' },
  { id: 'violet', label: 'Violet', color: '#7c3aed' },
];

export const ACCESSORIES = [
  { id: 'none', label: 'None', cost: 0 },
  { id: 'glasses', label: 'Cool glasses', cost: 50 },
  { id: 'hat', label: 'Party hat', cost: 120 },
  { id: 'crown', label: 'Focus crown', cost: 300 },
];

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = { name: 'Pomo', xp: 0, coins: 0, pokes: 0, skin: 'ruby', accessory: 'none', unlocked: ['none'], mascot: 'tomato', ...JSON.parse(raw) };
      if (p.skin === 'red') p.skin = 'ruby'; // renamed skins
      if (p.skin === 'orange') p.skin = 'ember';
      return p;
    }
  } catch {
    /* ignore */
  }
  return { name: 'Pomo', xp: 0, coins: 0, pokes: 0, skin: 'ruby', accessory: 'none', unlocked: ['none'], mascot: 'tomato' };
}

export function levelOf(xp) {
  return Math.floor(xp / 100) + 1;
}

export function usePomoProfile() {
  const [profile, setProfile] = useState(load);

  const save = useCallback((next) => {
    setProfile(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const addXP = useCallback((n) => {
    setProfile((p) => {
      const next = { ...p, xp: p.xp + n, coins: p.coins + Math.max(1, Math.round(n / 10)) };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const poke = useCallback(() => {
    setProfile((p) => {
      const next = { ...p, pokes: p.pokes + 1, xp: p.xp + 2, coins: p.coins + 1 };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const setName = useCallback((name) => setProfile((p) => {
    const next = { ...p, name: name.slice(0, 16) || 'Pomo' };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    return next;
  }), []);

  const setSkin = useCallback((skin) => setProfile((p) => {
    const next = { ...p, skin };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    return next;
  }), []);

  const unlock = useCallback((id) => {
    let ok = false;
    setProfile((p) => {
      const item = ACCESSORIES.find((a) => a.id === id);
      if (!item || p.unlocked.includes(id) || p.coins < item.cost) return p;
      ok = true;
      const next = { ...p, coins: p.coins - item.cost, unlocked: [...p.unlocked, id], accessory: id };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    return ok;
  }, []);

  const wear = useCallback((id) => {
    setProfile((p) => {
      if (!p.unlocked.includes(id)) return p;
      const next = { ...p, accessory: id };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const setMascot = useCallback((mascot) => {
    setProfile((p) => {
      const next = { ...p, mascot };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { profile, save, addXP, poke, setName, setSkin, unlock, wear, setMascot, level: levelOf(profile.xp) };
}
