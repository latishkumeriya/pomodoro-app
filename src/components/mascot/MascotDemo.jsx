import { useState } from 'react';
import { PomodoroMascot } from './PomodoroMascot';
import { CHARACTERS } from './characters/registry';

const MOODS = ['idle', 'focus', 'break', 'celebrate', 'tired'];

export function MascotDemo() {
  const [mood, setMood] = useState('idle');
  const [mascot, setMascot] = useState('tomato');
  const cur = CHARACTERS.find((c) => c.id === mascot);
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <h1>Mascot Gallery — pick your fighter</h1>
      <p>{cur.emoji} {cur.name}: {cur.desc}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
        {CHARACTERS.map((c) => (
          <button
            key={c.id}
            onClick={() => setMascot(c.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: mascot === c.id ? '2px solid #ff4d4d' : '1px solid #ddd',
              background: mascot === c.id ? '#ffe3e3' : '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {c.emoji} {c.name}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '0 0 24px' }}>
        {MOODS.map((m) => (
          <button
            key={m}
            onClick={() => setMood(m)}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: mood === m ? '2px solid #111' : '1px solid #ddd',
              background: mood === m ? '#111' : '#fff',
              color: mood === m ? '#ffd166' : '#111',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {m}
          </button>
        ))}
      </div>
      <PomodoroMascot mood={mood} height={440} mascot={mascot} xp={40} level={1} />
      <pre style={{ background: '#111', color: '#8f8', padding: 12, borderRadius: 8, marginTop: 16 }}>
{`<PomodoroMascot mood="${mood}" mascot="${mascot}" />`}
      </pre>
    </div>
  );
}
