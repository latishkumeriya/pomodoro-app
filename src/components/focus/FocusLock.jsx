import { useEffect, useRef, useState } from 'react';
import { PomodoroMascot } from '../mascot/PomodoroMascot';
import './focus.css';

function format(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const r = (s % 60).toString().padStart(2, '0');
  return `${m}:${r}`;
}

/**
 * Fullscreen focus lock. Timer on top, guardian character below.
 * Back button + screen-sleep guarded while mounted.
 */
export function FocusLock({
  secondsLeft,
  total,
  mode,
  running,
  mascot,
  mascotName,
  level,
  xp,
  bodyColor,
  accessory,
  theme,
  lockMood,
  onTogglePause,
  onGiveUp,
  onToast,
}) {
  const [confirm, setConfirm] = useState(false);
  const confirmTimer = useRef(null);
  const progress = 1 - secondsLeft / total;

  // keep screen awake (Web Wake Lock API — works in Android WebView)
  useEffect(() => {
    let lock = null;
    let alive = true;
    (async () => {
      try {
        if ('wakeLock' in navigator) {
          lock = await navigator.wakeLock.request('screen');
        }
      } catch {
        /* unsupported or denied — timer still runs */
      }
    })();
    const re = () => {
      if (!alive || (lock && !lock.released)) return;
      try {
        navigator.wakeLock?.request('screen').then((l) => { lock = l; }).catch(() => {});
      } catch {
        /* ignore */
      }
    };
    document.addEventListener('visibilitychange', re);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', re);
      try {
        lock?.release?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  // block hardware back button while locked (Capacitor, loaded lazily so web is untouched)
  useEffect(() => {
    let handle = null;
    let active = true;
    import('@capacitor/app')
      .then(({ App }) => {
        if (!active) return;
        App.addListener('backButton', () => {
          onToast?.('Locked in — finish your focus first!');
        }).then((h) => { handle = h; });
      })
      .catch(() => {
        /* web browser — nothing to block */
      });
    return () => {
      active = false;
      handle?.remove?.();
    };
  }, [onToast]);

  useEffect(() => () => clearTimeout(confirmTimer.current), []);

  const giveUp = () => {
    if (!confirm) {
      setConfirm(true);
      onToast?.('Tap again to give up — session fails');
      clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirm(false), 4000);
      return;
    }
    clearTimeout(confirmTimer.current);
    onGiveUp?.();
  };

  return (
    <div className="lock-screen">
      <div className="lock-stars" aria-hidden />
      <div className="lock-top">
        <span className="lock-badge">SESSION LOCKED</span>
        <div className="lock-mode">{mode === 'focus' ? 'Deep focus' : mode === 'short' ? 'Short break' : 'Long break'}</div>
        <div className="lock-ring">
          <svg viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="88" className="track" />
            <circle
              cx="100"
              cy="100"
              r="88"
              className="bar"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - progress)}
            />
          </svg>
          <div className="lock-time">
            <span>{format(secondsLeft)}</span>
            <small>{running ? 'stay with it' : 'paused'}</small>
          </div>
        </div>
      </div>

      <div className="lock-mascot">
        <PomodoroMascot
          mood={lockMood ?? (running ? 'focus' : 'idle')}
          height={300}
          name={mascotName}
          level={level}
          xp={xp}
          bodyColor={bodyColor}
          accessory={accessory}
          theme={theme}
          mascot={mascot}
        />
      </div>

      <div className="lock-actions">
        <button className="lock-pause" onClick={onTogglePause}>
          {running ? 'Pause' : 'Resume'}
        </button>
        <button className={`lock-quit ${confirm ? 'arm' : ''}`} onClick={giveUp}>
          {confirm ? 'Tap again — I give up' : 'End early'}
        </button>
      </div>
      <p className="lock-note">Phone stays here till the timer ends. Quitting fails the session.</p>
    </div>
  );
}
