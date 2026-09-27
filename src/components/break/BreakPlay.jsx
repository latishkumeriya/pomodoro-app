import { useEffect, useRef, useState } from 'react';
import './break.css';

const STRETCHES = [
  { t: 'Water run', d: 'Refill your bottle. Dehydrated brains focus 20% worse.' },
  { t: 'Window gaze', d: 'Stare far away 30s. Give your eyes a holiday.' },
  { t: 'Desk rescue', d: 'Clear 3 things off your desk. 60 seconds, go.' },
  { t: 'Power pose', d: 'Hands on hips, chin up, 30s. Feel ridiculous, work wonders.' },
  { t: 'Fresh air', d: 'Step out or open a window. 3 deep breaths.' },
  { t: 'Gratitude ping', d: 'Text someone one nice line. Instant mood +XP.' },
];

const PHASES = [
  { label: 'Breathe in', secs: 4 },
  { label: 'Hold', secs: 4 },
  { label: 'Breathe out', secs: 6 },
];

function useBreathing(active) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [left, setLeft] = useState(PHASES[0].secs);
  const [cycles, setCycles] = useState(0);
  useEffect(() => {
    if (!active) return;
    setPhaseIdx(0);
    setLeft(PHASES[0].secs);
    const t = setInterval(() => {
      setLeft((s) => {
        if (s > 1) return s - 1;
        setPhaseIdx((p) => {
          const n = (p + 1) % PHASES.length;
          setLeft(PHASES[n].secs);
          if (n === 0) setCycles((c) => c + 1);
          return n;
        });
        return s;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [active]);
  return { phase: PHASES[phaseIdx], left, cycles };
}

function MiniGame({ onEarn }) {
  const [playing, setPlaying] = useState(false);
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(30);
  const idRef = useRef(0);

  useEffect(() => {
    if (!playing) return;
    if (time <= 0) {
      setPlaying(false);
      if (score > 0) onEarn?.(score);
      return;
    }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [playing, time, score, onEarn]);

  useEffect(() => {
    if (!playing) return;
    const spawn = setInterval(() => {
      const id = ++idRef.current;
      setItems((arr) => [...arr.slice(-11), { id, x: 5 + Math.random() * 85, y: -8 }]);
    }, 700);
    const fall = setInterval(() => {
      setItems((arr) => arr.map((o) => ({ ...o, y: o.y + 7 })).filter((o) => o.y < 105));
    }, 120);
    return () => {
      clearInterval(spawn);
      clearInterval(fall);
    };
  }, [playing]);

  const start = () => {
    setItems([]);
    setScore(0);
    setTime(30);
    setPlaying(true);
  };

  const catchOne = (id) => {
    setItems((arr) => arr.filter((o) => o.id !== id));
    setScore((s) => s + 1);
  };

  return (
    <div className="mini">
      <div className="mini-head">
        <b>🍅 Catch!</b>
        <span>Score {score} • {time}s</span>
        {!playing ? <button onClick={start}>▶ Play 30s</button> : <button onClick={() => setPlaying(false)}>■ Stop</button>}
      </div>
      <div className="mini-arena">
        {items.map((o) => (
          <button
            key={o.id}
            className="falling"
            style={{ left: `${o.x}%`, top: `${o.y}%` }}
            onClick={() => catchOne(o.id)}
            aria-label="catch tomato"
          >
            🍅
          </button>
        ))}
        {!playing && items.length === 0 && <span className="mini-hint">Tap falling tomatoes • each = +1 XP at end</span>}
      </div>
    </div>
  );
}

export function BreakPlay({ onEarn, onToast }) {
  const [breathing, setBreathing] = useState(false);
  const { phase, left, cycles } = useBreathing(breathing);
  const [stretchIdx, setStretchIdx] = useState(0);
  const [done, setDone] = useState([]);
  const s = STRETCHES[stretchIdx];

  return (
    <div className="pomo-card breakcard">
      <div className="rew-head">
        <h2>☕ Break Play</h2>
      </div>

      <div className="break-grid">
        <div className="breath-box">
          <div className={`breath-ball ${breathing ? phase.label.replace(/\s/g, '') : ''}`}>
            <span>{breathing ? `${phase.label} ${left}` : '🫁'}</span>
          </div>
          <div>
            <button onClick={() => setBreathing((b) => !b)}>{breathing ? '■ Stop breathing' : '▶ Start 4-4-6'}</button>
            <small className="muted"> {cycles > 0 ? `${cycles} cycles done` : '4s in • 4s hold • 6s out'}</small>
          </div>
        </div>

        <div className="stretch-box">
          <b>⚡ {s.t}</b>
          <p>{s.d}</p>
          <div className="row">
            <button onClick={() => setStretchIdx((i) => (i + 1) % STRETCHES.length)}>Next →</button>
            <button
              onClick={() => {
                if (!done.includes(s.t)) {
                  setDone((d) => [...d, s.t]);
                  onEarn?.(5);
                  onToast?.('Mission complete! +5 XP');
                }
                setStretchIdx((i) => (i + 1) % STRETCHES.length);
              }}
            >
              ✓ Done +5 XP
            </button>
          </div>
          <small className="muted">{done.length}/{STRETCHES.length} missions done</small>
        </div>
      </div>

      <MiniGame
        onEarn={(score) => {
          onEarn?.(score);
          onToast?.(`Caught ${score}! +${score} XP`);
        }}
      />
    </div>
  );
}
