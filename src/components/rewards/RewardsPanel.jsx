import { useMemo, useState } from 'react';
import { ACHIEVEMENTS, checkAch, drawShareCard, getStreak, last12Weeks, loadAch, loadDays, todayStr } from '../../lib/rewards';
import './rewards.css';

function heatColor(n) {
  if (!n) return '#f3e2e2';
  if (n === 1) return '#ffb3ab';
  if (n <= 3) return '#ff7b6e';
  if (n <= 5) return '#f43f3f';
  return '#b91c1c';
}

export function RewardsPanel({ total, profile, level, onToast }) {
  const [tick, setTick] = useState(0);
  const days = useMemo(() => loadDays(), [tick, total]);
  const today = days[todayStr()] || 0;
  const streak = getStreak(days);
  const weeks = last12Weeks(days);
  const ctx = { total, today, streak, pokes: profile.pokes, coins: profile.coins };
  const { owned, fresh } = checkAch(ctx);
  const [seenFresh, setSeenFresh] = useState([]);
  const newOnes = fresh.filter((a) => !seenFresh.includes(a.id));

  const share = () => {
    const url = drawShareCard({ name: profile.name, level, streak, today, total, coins: profile.coins, mascot: profile.mascot, accessory: profile.accessory });
    const a = document.createElement('a');
    a.href = url;
    a.download = `pomo-${todayStr()}.png`;
    a.click();
    onToast?.('Share card downloaded!');
  };

  const copyText = async () => {
    const t = `🍅 I focused ${today} pomodoros today (${total} lifetime) with ${profile.name} Lv${level}. ${streak}-day streak! #PomoFocus`;
    try {
      await navigator.clipboard.writeText(t);
      onToast?.('Copied to clipboard!');
    } catch {
      onToast?.(t);
    }
  };

  return (
    <div className="pomo-card rewards">
      <div className="rew-head">
        <h2>🏆 Streaks & Rewards</h2>
        <div className="rew-actions">
          <button onClick={() => setTick((t) => t + 1)}>↻ Refresh</button>
          <button onClick={share}>📥 Share card</button>
          <button onClick={copyText}>📋 Copy text</button>
        </div>
      </div>

      <div className="rew-stats">
        <div className="stat"><b>🔥 {streak}</b><span>day streak</span></div>
        <div className="stat"><b>🍅 {today}</b><span>today</span></div>
        <div className="stat"><b>✅ {total}</b><span>lifetime</span></div>
        <div className="stat"><b>🪙 {profile.coins}</b><span>coins</span></div>
      </div>

      {newOnes.length > 0 && (
        <div className="ach-fresh">
          🎉 New: {newOnes.map((a) => a.label).join(', ')}
          <button onClick={() => setSeenFresh((s) => [...s, ...newOnes.map((a) => a.id)])}>OK</button>
        </div>
      )}

      <div className="heat">
        {weeks.map((d) => (
          <i key={d.date} title={`${d.date}: ${d.count}`} style={{ background: heatColor(d.count) }} />
        ))}
      </div>
      <small className="muted">Last 12 weeks • darker = more focus</small>

      <div className="ach-grid">
        {ACHIEVEMENTS.map((a) => {
          const got = owned.includes(a.id) || loadAch().includes(a.id);
          return (
            <div key={a.id} className={`ach ${got ? 'got' : ''}`}>
              <b>{got ? '✅' : '🔒'} {a.label}</b>
              <span>{a.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
