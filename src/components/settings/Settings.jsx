import { useEffect } from 'react';
import { blockerStatus, isNativeApp, openOverlaySettings, openUsageSettings, useBlocker } from '../../lib/blocker';
import './settings.css';

export function Settings({ settings, update, resetAll, onToast, presets = [], presetId, onPreset, durations, onCustom }) {
  const blocker = useBlocker();
  const native = isNativeApp();

  useEffect(() => {
    if (native) blocker.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native]);

  const row = (label, desc, control) => (
    <div className="set-row" key={label}>
      <div><b>{label}</b><p>{desc}</p></div>
      {control}
    </div>
  );

  const blockingRow = native ? (
    <div className="set-row">
      <div><b>Block other apps</b><p>Bounce back here if you leave mid-session</p></div>
      <button
        className={blocker.enabled ? 'on' : ''}
        onClick={async () => {
          if (!blocker.enabled) {
            // turning on: make sure the two permissions exist first
            const st = await blockerStatus();
            await blocker.refresh();
            if (!st.usage) {
              onToast?.('Step 1 of 2: allow Usage access, then come back');
              openUsageSettings();
              blocker.toggle();
              return;
            }
            if (!st.overlay) {
              onToast?.('Step 2 of 2: allow Display over apps, then come back');
              openOverlaySettings();
              blocker.toggle();
              return;
            }
            onToast?.('App blocking on — guard ready');
          }
          blocker.toggle();
        }}
      >
        {blocker.enabled ? 'On' : 'Off'}
      </button>
    </div>
  ) : null;

  const permissionRows = native ? (
    <>
      <div className="set-row">
        <div><b>Usage access</b><p>Lets the guard see app switches</p></div>
        {blocker.status.usage ? (
          <button className="on">Granted</button>
        ) : (
          <button onClick={async () => { openUsageSettings(); setTimeout(() => blocker.refresh(), 1000); }}>Grant</button>
        )}
      </div>
      <div className="set-row">
        <div><b>Display over apps</b><p>Shows the return screen</p></div>
        {blocker.status.overlay ? (
          <button className="on">Granted</button>
        ) : (
          <button onClick={async () => { openOverlaySettings(); setTimeout(() => blocker.refresh(), 1000); }}>Grant</button>
        )}
      </div>
    </>
  ) : (
    <div className="set-row">
      <div><b>Block other apps</b><p>Available in the Android app version</p></div>
      <button disabled>App only</button>
    </div>
  );

  return (
    <div className="pomo-card settings">
      <div className="rew-head"><h2>⚙️ Settings</h2></div>
      {blockingRow}
      {permissionRows}
      <div className="set-row">
        <div><b>Timer preset</b><p>Pick a rhythm — its minutes appear below</p></div>
        <select
          value={presets.some((p) => p.id === presetId) ? presetId : 'custom'}
          onChange={(e) => {
            const p = presets.find((x) => x.id === e.target.value);
            if (p) onPreset?.(p);
          }}
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </div>
      {durations && (
        <div className="custom-row">
          <label>Focus <input type="number" min={1} max={180} value={Math.round(durations.focus / 60)} onChange={(e) => onCustom?.('focus', parseInt(e.target.value, 10))} />m</label>
          <label>Short <input type="number" min={1} max={60} value={Math.round(durations.short / 60)} onChange={(e) => onCustom?.('short', parseInt(e.target.value, 10))} />m</label>
          <label>Long <input type="number" min={1} max={60} value={Math.round(durations.long / 60)} onChange={(e) => onCustom?.('long', parseInt(e.target.value, 10))} />m</label>
        </div>
      )}
      {row('Sound', 'Beep when sessions end', (
        <button className={settings.sound ? 'on' : ''} onClick={() => update({ sound: !settings.sound })}>
          {settings.sound ? 'On' : 'Off'}
        </button>
      ))}
      {row('Notifications', 'Desktop alert on switch', (
        <button
          className={settings.notifications ? 'on' : ''}
          onClick={async () => {
            const next = !settings.notifications;
            if (next && 'Notification' in window && Notification.permission === 'default') {
              try {
                await Notification.requestPermission();
              } catch {
                /* ignore */
              }
            }
            update({ notifications: next });
          }}
        >
          {settings.notifications ? 'On' : 'Off'}
        </button>
      ))}
      {row('Auto-start breaks', 'Jump into break after focus', (
        <button className={settings.autoBreaks ? 'on' : ''} onClick={() => update({ autoBreaks: !settings.autoBreaks })}>
          {settings.autoBreaks ? 'On' : 'Off'}
        </button>
      ))}
      {row('Auto-start focus', 'Jump back after break', (
        <button className={settings.autoFocus ? 'on' : ''} onClick={() => update({ autoFocus: !settings.autoFocus })}>
          {settings.autoFocus ? 'On' : 'Off'}
        </button>
      ))}
      {row('Celebration', 'Seconds of mascot party', (
        <input type="number" min={0} max={15} value={settings.celebrateSecs} onChange={(e) => update({ celebrateSecs: Math.max(0, Math.min(15, parseInt(e.target.value, 10) || 0)) })} />
      ))}
      {row('Daily goal', 'Pomodoros per day', (
        <input type="number" min={1} max={30} value={settings.dailyGoal} onChange={(e) => update({ dailyGoal: Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 8)) })} />
      ))}
      {row('Character theme', 'Auto follows time of day', (
        <select value={settings.theme} onChange={(e) => update({ theme: e.target.value })}>
          <option value="auto">Auto (time)</option>
          <option value="morning">Morning</option>
          <option value="evening">Evening</option>
          <option value="night">Night</option>
        </select>
      ))}
      {row('Reset', 'Wipe profile, stats, tasks', (
        <button
          className="danger"
          onClick={() => {
            if (window.confirm('Reset everything?')) {
              resetAll();
              onToast?.('Reset done — reload the app');
            }
          }}
        >
          Reset
        </button>
      ))}
    </div>
  );
}
