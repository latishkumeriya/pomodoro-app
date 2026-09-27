const DAY_KEY = 'pomo-days-v1'; // { 'YYYY-MM-DD': count }
const ACH_KEY = 'pomo-ach-v1'; // [ids]

export function todayStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadDays() {
  try {
    return JSON.parse(localStorage.getItem(DAY_KEY) || '{}');
  } catch {
    return {};
  }
}

export function recordToday() {
  const days = loadDays();
  const t = todayStr();
  days[t] = (days[t] || 0) + 1;
  try {
    localStorage.setItem(DAY_KEY, JSON.stringify(days));
  } catch {
    /* ignore */
  }
  return days;
}

export function getStreak(days = loadDays()) {
  let streak = 0;
  const d = new Date();
  // if today has 0, streak can still count from yesterday
  if (!days[todayStr(d)]) d.setDate(d.getDate() - 1);
  while (days[todayStr(d)]) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function last12Weeks(days = loadDays()) {
  const out = [];
  const d = new Date();
  d.setDate(d.getDate() - 83); // 12 weeks back, aligned to today
  for (let i = 0; i < 84; i++) {
    const key = todayStr(d);
    out.push({ date: key, count: days[key] || 0 });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export const ACHIEVEMENTS = [
  { id: 'first', label: 'First Blood', desc: 'Finish 1 pomodoro', test: (c) => c.total >= 1 },
  { id: 'triple', label: 'Triple Shot', desc: '3 in one day', test: (c) => c.today >= 3 },
  { id: 'deep', label: 'Deep Diver', desc: '4 in a row day total ≥ 4', test: (c) => c.today >= 4 },
  { id: 'ten', label: 'Deca', desc: '10 lifetime', test: (c) => c.total >= 10 },
  { id: 'fifty', label: 'Tomato Lord', desc: '50 lifetime', test: (c) => c.total >= 50 },
  { id: 'streak3', label: 'On Fire', desc: '3-day streak', test: (c) => c.streak >= 3 },
  { id: 'streak7', label: 'Unstoppable', desc: '7-day streak', test: (c) => c.streak >= 7 },
  { id: 'poker', label: 'Poke Fan', desc: 'Poke 25 times', test: (c) => c.pokes >= 25 },
  { id: 'rich', label: 'Saver', desc: 'Hold 200 coins', test: (c) => c.coins >= 200 },
];

export function loadAch() {
  try {
    return JSON.parse(localStorage.getItem(ACH_KEY) || '[]');
  } catch {
    return [];
  }
}

export function checkAch(context) {
  const owned = loadAch();
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (!owned.includes(a.id) && a.test(context)) {
      owned.push(a.id);
      fresh.push(a);
    }
  }
  if (fresh.length) {
    try {
      localStorage.setItem(ACH_KEY, JSON.stringify(owned));
    } catch {
      /* ignore */
    }
  }
  return { owned, fresh };
}

export function drawShareCard({ name, level, streak, today, total, coins }) {
  const c = document.createElement('canvas');
  c.width = 900;
  c.height = 500;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 900, 500);
  g.addColorStop(0, '#ff4d4d');
  g.addColorStop(1, '#7c2d12');
  x.fillStyle = g;
  x.fillRect(0, 0, 900, 500);
  x.fillStyle = 'rgba(255,255,255,0.12)';
  x.beginPath();
  x.arc(760, 90, 220, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#fff';
  x.font = '800 64px system-ui, sans-serif';
  x.fillText('Pomo Focus', 60, 110);
  x.font = '700 44px system-ui, sans-serif';
  x.fillText(`${name} - Lv ${level}`, 60, 180);
  x.font = '400 38px system-ui, sans-serif';
  x.fillText(`${streak}-day streak   -   ${today} today`, 60, 250);
  x.fillText(`${total} lifetime   -   ${coins} coins`, 60, 310);
  x.font = '400 30px system-ui, sans-serif';
  x.fillStyle = 'rgba(255,255,255,0.85)';
  x.fillText('Focus. Break. Repeat. — built with Pomo', 60, 420);
  // vector tomato doodle — no emoji
  x.fillStyle = '#fff';
  x.beginPath();
  x.arc(760, 330, 90, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#ff4d4d';
  x.beginPath();
  x.arc(760, 330, 72, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#2e9e44';
  x.fillRect(752, 228, 16, 36);
  x.beginPath();
  x.ellipse(715, 252, 32, 13, -0.4, 0, Math.PI * 2);
  x.ellipse(805, 252, 32, 13, 0.4, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#111';
  x.beginPath();
  x.arc(738, 320, 10, 0, Math.PI * 2);
  x.arc(782, 320, 10, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = '#5c1a1a';
  x.lineWidth = 6;
  x.beginPath();
  x.arc(760, 345, 22, 0.3, Math.PI - 0.3);
  x.stroke();
  return c.toDataURL('image/png');
}
