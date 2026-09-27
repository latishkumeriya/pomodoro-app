import { useEffect, useState } from 'react';
import { PomodoroMascot } from '../mascot/PomodoroMascot';
import './onboarding.css';

const MOODS = ['idle', 'focus', 'break', 'celebrate', 'tired'];

function DemoTimer() {
  const [s, setS] = useState(10);
  const [run, setRun] = useState(false);
  useEffect(() => {
    if (!run) return;
    if (s <= 0) {
      setRun(false);
      return;
    }
    const t = setTimeout(() => setS((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [run, s]);
  return (
    <div className="ob-demo">
      <b>0:{String(s).padStart(2, '0')}</b>
      <div className="row">
        <button onClick={() => { setS(10); setRun(true); }}>▶ Try it</button>
        <button onClick={() => setRun(false)}>⏸ Pause</button>
        {s === 0 && <span>🎉 Done! Real ones are 25 min.</span>}
      </div>
    </div>
  );
}

export function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState('idle');

  const finish = () => {
    try {
      localStorage.setItem('pomo-onboarded-v1', '1');
    } catch {
      /* ignore */
    }
    onDone?.();
  };

  const steps = [
    {
      title: 'Meet your Character',
      body: 'This is Pomo. It lives in your timer, reacts to every session, and levels up as you focus. Go ahead — poke it.',
      art: <PomodoroMascot mood="idle" height={320} name="Pomo" level={1} onPoke={() => {}} />,
    },
    {
      title: 'Focus in sprints',
      body: 'Work 25 minutes, rest 5. After 4 rounds, take a long break. Try the 10-second demo timer.',
      art: <DemoTimer />,
    },
    {
      title: 'It feels with you',
      body: 'Tap a mood — the character mirrors your timer: determined while focusing, sleepy on breaks, partying on wins.',
      art: (
        <div>
          <div className="row wrap">
            {MOODS.map((m) => (
              <button key={m} className={mood === m ? 'on' : ''} onClick={() => setMood(m)}>{m}</button>
            ))}
          </div>
          <PomodoroMascot mood={mood} height={300} name="Pomo" level={2} />
        </div>
      ),
    },
    {
      title: 'Streaks keep you hooked',
      body: 'Every session builds XP, coins, streaks and a heatmap. Unlock hats and glasses, earn achievements, share your card.',
      art: <div className="ob-demo">🔥 streak &nbsp; 🪙 coins &nbsp; 🏆 achievements &nbsp; 📥 share card</div>,
    },
    {
      title: 'Breaks are play',
      body: 'Breathe 4-4-6 and complete break missions. Friends focus with you in rooms, tasks track estimates.',
      art: <div className="ob-demo">🫁 breathe &nbsp; ⚡ missions &nbsp; 👥 rooms &nbsp; 📝 tasks</div>,
    },
  ];

  const cur = steps[step];

  return (
    <div className="ob-wrap">
      <div className="ob-card">
        <div className="ob-dots">
          {steps.map((_, i) => (
            <i key={i} className={i === step ? 'on' : i < step ? 'done' : ''} />
          ))}
        </div>
        <h1>{cur.title}</h1>
        <p>{cur.body}</p>
        <div className="ob-art">{cur.art}</div>
        <div className="ob-nav">
          <button disabled={step === 0} onClick={() => setStep((s) => s - 1)}>← Back</button>
          <span>{step + 1} / {steps.length}</span>
          {step < steps.length - 1 ? (
            <button className="primary" onClick={() => setStep((s) => s + 1)}>Next →</button>
          ) : (
            <button className="primary" onClick={finish}>Get started 🍅</button>
          )}
        </div>
        <button className="ob-skip" onClick={finish}>Skip tour</button>
      </div>
    </div>
  );
}
