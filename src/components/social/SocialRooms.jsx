import { useEffect, useMemo, useState } from 'react';
import { seedWeek, teamGoal, tickBots } from '../../lib/social';
import './social.css';

export function SocialRooms({ userName, userTotal, onToast }) {
  const [members, setMembers] = useState(() => {
    const bots = seedWeek();
    return [{ id: 'you', name: userName || 'You', color: '#ff4d4d', week: 0, status: 'focus', progress: 0, you: true }, ...bots];
  });

  // keep "you" row in sync with real totals + name
  useEffect(() => {
    setMembers((ms) => ms.map((m) => (m.you ? { ...m, name: userName || 'You', week: userTotal } : m)));
  }, [userName, userTotal]);

  // bots live-tick every 3s
  useEffect(() => {
    const t = setInterval(() => {
      setMembers((ms) => {
        const next = tickBots(ms);
        const fin = next.find((m) => m.justFinished && !m.you);
        if (fin) onToast?.(`🎉 ${fin.name} finished a pomodoro!`);
        return next.map(({ justFinished: _fin, ...m }) => m);
      });
    }, 3000);
    return () => clearInterval(t);
  }, [onToast]);

  const ranked = useMemo(() => [...members].sort((a, b) => b.week - a.week), [members]);
  const goal = teamGoal(members);
  const myRank = ranked.findIndex((m) => m.you) + 1;

  return (
    <div className="pomo-card social">
      <div className="rew-head">
        <h2>👥 Focus Room — Tomato Squad</h2>
        <span className="rank-pill">You’re #{myRank}</span>
      </div>

      <div className="goal">
        <div className="goal-top"><span>Weekly team goal</span><span>{goal.total}/{goal.goal} 🍅</span></div>
        <div className="goal-bar"><i style={{ width: `${goal.pct}%` }} /></div>
      </div>

      <div className="room-list">
        {members.map((m) => (
          <div key={m.id} className={`room-row ${m.you ? 'you' : ''}`}>
            <span className="dot" style={{ background: m.color }} />
            <b>{m.name}</b>
            <span className={`st ${m.status}`}>{m.status === 'focus' ? '🍅 focusing' : '☕ break'}</span>
            <span className="mini-bar"><i style={{ width: `${Math.round(m.progress * 100)}%` }} /></span>
            <span className="wk">{m.week}/wk</span>
          </div>
        ))}
      </div>

      <h3 className="board-title">Weekly leaderboard</h3>
      <ol className="board">
        {ranked.map((m, i) => {
          const top = ranked[0]?.week || 1;
          return (
            <li key={m.id} className={`rank-row ${m.you ? 'you' : ''} ${i === 0 ? 'first' : ''}`}>
              <span className={`medal m${i + 1}`}>{i + 1}</span>
              <span className="dot" style={{ background: m.color }} />
              <span className="rname">{m.name}{m.you ? ' (you)' : ''}</span>
              <span className="rbar"><i style={{ width: `${Math.max(4, Math.round((m.week / top) * 100))}%` }} /></span>
              <b className="rscore">{m.week}</b>
            </li>
          );
        })}
      </ol>
      <small className="muted">Simulated locally — no backend. Your row updates from real completions.</small>
    </div>
  );
}
