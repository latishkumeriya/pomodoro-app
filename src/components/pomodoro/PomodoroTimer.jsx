import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PomodoroMascot } from '../mascot/PomodoroMascot';
import { ACCESSORIES, SKINS, levelOf, usePomoProfile } from '../../lib/pomoStore';
import { CHARACTERS } from '../mascot/characters/registry';
import { recordToday } from '../../lib/rewards';
import { RewardsPanel } from '../rewards/RewardsPanel';
import { SocialRooms } from '../social/SocialRooms';
import { BreakPlay } from '../break/BreakPlay';
import { FocusLock } from '../focus/FocusLock';
import { TaskList } from '../productivity/TaskList';
import { DayReport } from '../productivity/DayReport';
import { Settings } from '../settings/Settings';
import { useSettings } from '../../lib/settings';
import { themeNow } from '../../lib/daypart';
import '../productivity/productivity.css';
import '../settings/settings.css';
import '../focus/focus.css';
import './pomodoro.css';

const PRESETS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const PRESET_LIST = [
  { id: 'classic', label: 'Classic 25/5', d: { focus: 25 * 60, short: 5 * 60, long: 15 * 60 } },
  { id: 'deep', label: 'Deep 50/10', d: { focus: 50 * 60, short: 10 * 60, long: 20 * 60 } },
  { id: 'sprint', label: 'Sprint 15/3', d: { focus: 15 * 60, short: 3 * 60, long: 10 * 60 } },
];
const ROUND_SIZE = 4;

function format(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const r = (s % 60).toString().padStart(2, '0');
  return `${m}:${r}`;
}

function beep(freq = 880, dur = 0.25) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.stop(ctx.currentTime + dur);
  } catch {
    /* audio blocked — ignore */
  }
}

export function PomodoroTimer() {
  const [mode, setMode] = useState('focus'); // focus | short | long
  const [secondsLeft, setSecondsLeft] = useState(PRESETS.focus);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(() => {
    try {
      return parseInt(localStorage.getItem('pomo-completed') || '0', 10) || 0;
    } catch {
      return 0;
    }
  });
  const [celebrating, setCelebrating] = useState(false);
  const timerRef = useRef(null);
  const celebrateTimeout = useRef(null);
  const { profile, addXP, poke, setSkin, unlock, wear, setMascot, level } = usePomoProfile();
  const { settings, update, resetAll } = useSettings();
  const settingsRef = useRef(settings);
  // focus lock: fullscreen guard screen while a focus session runs
  const [lockOn, setLockOn] = useState(() => {
    try {
      return localStorage.getItem('pomo-lockon') !== '0';
    } catch {
      return true;
    }
  });
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // enter/exit the lock screen with any running session
  useEffect(() => {
    if (running && !celebrating && lockOn) setLocked(true);
    else if (!running || celebrating) setLocked(false);
  }, [mode, running, celebrating, lockOn]);

  const toggleLockOn = () => {
    setLockOn((v) => {
      try {
        localStorage.setItem('pomo-lockon', v ? '0' : '1');
      } catch {
        /* ignore */
      }
      return !v;
    });
  };

  const giveUp = () => {
    clearTimeout(celebrateTimeout.current);
    setRunning(false);
    setCelebrating(false);
    setLocked(false);
    setSecondsLeft(total);
    setToast('Session failed — guardian is sad');
  };
  const [toast, setToast] = useState(null);
  const [durations, setDurations] = useState(PRESETS);
  const [presetId, setPresetId] = useState('classic');
  const skinColor = SKINS.find((s) => s.id === profile.skin)?.color ?? '#ff4d4d';

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const total = useMemo(
    () => (mode === 'focus' ? durations.focus : mode === 'short' ? durations.short : durations.long),
    [mode, durations]
  );
  const progress = 1 - secondsLeft / total;

  const applyPreset = (p) => {
    setDurations(p.d);
    setPresetId(p.id);
    setCelebrating(false);
    setRunning(false);
    setMode('focus');
    setSecondsLeft(p.d.focus);
  };

  const setCustom = (key, mins) => {
    const v = Math.max(1, Math.min(180, mins || 1)) * 60;
    setDurations((d) => {
      const next = { ...d, [key]: v };
      if (key === mode) setSecondsLeft(v);
      return next;
    });
    setPresetId('custom');
  };

  const notify = useCallback((title, body) => {
    if (!settingsRef.current.notifications) return;
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const sound = useCallback((freq, dur) => {
    if (settingsRef.current.sound) beep(freq, dur);
  }, []);

  const switchMode = useCallback((next, autoStart = true) => {
    setMode(next);
    setSecondsLeft(next === 'focus' ? durations.focus : next === 'short' ? durations.short : durations.long);
    setRunning(autoStart);
  }, [durations]);

  const handleSessionEnd = useCallback(() => {
    if (mode === 'focus') {
      const next = completed + 1;
      setCompleted(next);
      addXP(100); // level up the mascot
      recordToday();
      setToast('Nice! +100 XP');
      try {
        localStorage.setItem('pomo-completed', String(next));
      } catch {
        /* ignore */
      }
      setCelebrating(true);
      sound(880, 0.3);
      setTimeout(() => sound(1174, 0.4), 250);
      notify('Pomodoro done!', next % ROUND_SIZE === 0 ? 'Take a long break.' : 'Take a short break.');
      clearTimeout(celebrateTimeout.current);
      // show celebrate mood, then go to break (or pause if auto-breaks off)
      celebrateTimeout.current = setTimeout(() => {
        setCelebrating(false);
        const long = next % ROUND_SIZE === 0;
        if (settingsRef.current.autoBreaks) switchMode(long ? 'long' : 'short', true);
        else switchMode(long ? 'long' : 'short', false);
      }, Math.max(0, settingsRef.current.celebrateSecs) * 1000);
    } else {
      sound(660, 0.3);
      notify('Break over', 'Back to focus!');
      if (settingsRef.current.autoFocus) switchMode('focus', true);
      else switchMode('focus', false);
    }
  }, [mode, completed, notify, sound, switchMode, addXP]);

  useEffect(() => {
    if (!running || celebrating) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          // defer so state settles before switching
          setTimeout(handleSessionEnd, 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running, celebrating, handleSessionEnd]);

  useEffect(() => {
    document.title = `${format(secondsLeft)} • ${mode === 'focus' ? 'Focus' : 'Break'} • Pomo`;
  }, [secondsLeft, mode]);

  useEffect(() => {
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch {
      /* ignore */
    }
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(celebrateTimeout.current);
    };
  }, []);

  // mood mapping for the live 3D character
  let mood = 'idle';
  if (celebrating) mood = 'celebrate';
  else if (mode === 'focus' && running) mood = 'focus';
  else if ((mode === 'short' || mode === 'long') && running) mood = 'break';
  else if (completed >= 4 && !running) mood = 'tired';

  const theme = themeNow(settings.theme);

  useEffect(() => {
    document.body.dataset.sky = theme;
    return () => {
      document.body.dataset.sky = 'morning';
    };
  }, [theme]);

  const skip = () => {
    clearTimeout(celebrateTimeout.current);
    setCelebrating(false);
    handleSessionEnd();
  };

  const reset = () => {
    setRunning(false);
    setCelebrating(false);
    setSecondsLeft(total);
  };

  return (
    <div className="pomo-wrap">
      <header className="pomo-head">
        <h1>🍅 Pomo Focus</h1>
        <p>25 focus • 5 break • 15 long break every 4</p>
      </header>

      <div className="pomo-grid">
        <div>
          <PomodoroMascot
            mood={mood}
            height={440}
            name={profile.name}
            level={levelOf(profile.xp)}
            xp={profile.xp}
            bodyColor={skinColor}
            accessory={profile.accessory}
            theme={theme}
            mascot={profile.mascot || 'tomato'}
            onPoke={poke}
          />
          <div className="pomo-card" style={{ marginTop: 12 }}>
            <div className="bond-row">
              <div className="xp">
                <div className="xp-top">
                  <span>Lv {level} • {profile.xp} XP</span>
                  <span>🪙 {profile.coins}</span>
                </div>
                <div className="xp-bar">
                  <i style={{ width: `${profile.xp % 100}%` }} />
                </div>
                <small>{100 - (profile.xp % 100)} XP to next level • {profile.pokes} pokes</small>
              </div>
            </div>
            <div className="bond-row">
              <span>Skin</span>
              <div className="swatches">
                {SKINS.map((s) => (
                  <button
                    key={s.id}
                    title={s.label}
                    onClick={() => setSkin(s.id)}
                    className={profile.skin === s.id ? 'on' : ''}
                    style={{ background: s.color }}
                  />
                ))}
              </div>
            </div>
            <div className="bond-row col">
              <span>Character (more coming — pick your fighter)</span>
              <div className="acc-list">
                {CHARACTERS.map((c) => (
                  <button
                    key={c.id}
                    className={(profile.mascot || 'tomato') === c.id ? 'on' : ''}
                    onClick={() => setMascot(c.id)}
                    title={c.desc}
                  >
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="bond-row col">
              <span>Accessories (unlock with coins)</span>
              <div className="acc-list">
                {ACCESSORIES.map((a) => {
                  const owned = profile.unlocked.includes(a.id);
                  const wearing = profile.accessory === a.id;
                  return (
                    <button
                      key={a.id}
                      className={wearing ? 'on' : ''}
                      onClick={() => (owned ? wear(a.id) : unlock(a.id))}
                    >
                      {a.label} {owned ? (wearing ? '✓' : '') : `🪙${a.cost}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="pomo-card">
          <div className="pomo-tabs">
            {['focus', 'short', 'long'].map((m) => (
              <button
                key={m}
                className={mode === m ? 'active' : ''}
                onClick={() => {
                  setCelebrating(false);
                  switchMode(m, false);
                }}
              >
                {m === 'focus' ? 'Focus' : m === 'short' ? 'Short break' : 'Long break'}
              </button>
            ))}
          </div>

          <div className="pomo-ring">
            <svg viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="88" className="track" />
              <circle
                cx="100"
                cy="100"
                r="88"
                className={`bar ${mode}`}
                strokeDasharray={2 * Math.PI * 88}
                strokeDashoffset={2 * Math.PI * 88 * (1 - progress)}
              />
            </svg>
            <div className="pomo-time">
              <span>{format(secondsLeft)}</span>
              <small>{celebrating ? 'celebrating!' : running ? mode : 'paused'}</small>
            </div>
          </div>

          <div className="pomo-controls">
            {!running ? (
              <button className="primary" onClick={() => setRunning(true)}>
                ▶ Start
              </button>
            ) : (
              <button className="primary" onClick={() => setRunning(false)}>
                ⏸ Pause
              </button>
            )}
            <button onClick={skip}>⏭ Skip</button>
            <button onClick={reset}>↺ Reset</button>
          </div>

          <div className="lock-toggle">
            <span>🔒 Lock phone on timer</span>
            <button className={lockOn ? 'on' : ''} onClick={toggleLockOn}>
              {lockOn ? 'On' : 'Off'}
            </button>
          </div>

          <div className="pomo-dots">
            {Array.from({ length: ROUND_SIZE }).map((_, i) => (
              <span key={i} className={i < completed % ROUND_SIZE || (completed > 0 && completed % ROUND_SIZE === 0) ? 'done' : ''} />
            ))}
            <small>{completed}/{settings.dailyGoal} of daily goal</small>
          </div>
        </div>
      </div>

      <TaskList onToast={setToast} />
      <DayReport completed={completed} focusMin={Math.round(durations.focus / 60)} />
      <Settings
        settings={settings}
        update={update}
        resetAll={resetAll}
        onToast={setToast}
        presets={PRESET_LIST}
        presetId={presetId}
        onPreset={applyPreset}
        durations={durations}
        onCustom={setCustom}
      />
      <RewardsPanel total={completed} profile={profile} level={level} onToast={setToast} />
      <BreakPlay onEarn={(n) => addXP(n)} onToast={setToast} />
      <SocialRooms userName={profile.name} userTotal={completed} onToast={setToast} />
      {locked && (
        <FocusLock
          secondsLeft={secondsLeft}
          total={total}
          mode={mode}
          running={running}
          mascot={profile.mascot || 'tomato'}
          mascotName={profile.name}
          level={level}
          xp={profile.xp}
          bodyColor={skinColor}
          accessory={profile.accessory}
          theme={theme}
          onTogglePause={() => setRunning((r) => !r)}
          onGiveUp={giveUp}
          onToast={setToast}
          lockMood={!running ? 'idle' : mode === 'focus' ? 'focus' : 'break'}
        />
      )}
      {toast && <div className="pomo-toast">{toast}</div>}
    </div>
  );
}
