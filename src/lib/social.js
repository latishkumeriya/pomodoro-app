const BOTS = [
  { id: 'mia', name: 'Mia', color: '#ff8c42', base: 14 },
  { id: 'raj', name: 'Raj', color: '#b565d8', base: 11 },
  { id: 'leo', name: 'Leo', color: '#5fbf6b', base: 8 },
  { id: 'ana', name: 'Ana', color: '#3b82f6', base: 5 },
];

const STATUS = ['focus', 'focus', 'focus', 'break'];

export function seedWeek() {
  // deterministic-ish weekly totals so leaderboard feels alive
  const week = new Date().getWeek?.() ?? 0;
  return BOTS.map((b, i) => ({
    ...b,
    week: b.base + ((week + i * 3) % 5),
    status: STATUS[(week + i) % STATUS.length],
    progress: 0.2 + ((week * 7 + i * 13) % 70) / 100,
  }));
}

export function tickBots(members) {
  return members.map((m) => {
    if (m.you) return m;
    let { progress, status, week } = m;
    progress += 0.02 + Math.random() * 0.05;
    if (progress >= 1) {
      progress = 0;
      week += 1;
      status = status === 'focus' ? 'break' : 'focus';
      return { ...m, progress, status, week, justFinished: true };
    }
    return { ...m, progress, status, week, justFinished: false };
  });
}

export function teamGoal(members) {
  const total = members.reduce((s, m) => s + (m.week || 0), 0);
  const goal = 50;
  return { total, goal, pct: Math.min(100, Math.round((total / goal) * 100)) };
}
