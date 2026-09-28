import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Float, OrbitControls } from '@react-three/drei';
import { TomatoMascot3D } from './TomatoMascot3D';
import { EmberFox } from './characters/EmberFox';
import { CosmoCat } from './characters/CosmoCat';
import { LeoKitten } from './characters/LeoKitten';

const MOOD_TEXT = {
  idle: 'Hey! Ready to focus?',
  focus: 'Focusing... shhh!',
  break: 'Break time — stretch!',
  celebrate: 'Pomodoro done! Yay!',
  tired: 'So many tomatoes...',
};

const POKE_LINES = ['Hehe!', 'Heyy!', 'Boop!', 'Wheee!', '+2 XP!', 'Again!'];

const SKIES = {
  morning: 'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 35%, #fef9c3 72%, #dcfce7 100%)',
  evening: 'linear-gradient(180deg, #7c3aed 0%, #f472b6 45%, #fdba74 75%, #ffedd5 100%)',
  night: 'linear-gradient(180deg, #020617 0%, #1e1b4b 60%, #312e81 100%)',
};

const STARS = [
  { l: '8%', t: '12%' }, { l: '22%', t: '28%' }, { l: '70%', t: '10%' },
  { l: '85%', t: '30%' }, { l: '55%', t: '18%' }, { l: '38%', t: '8%' },
  { l: '12%', t: '45%' }, { l: '90%', t: '50%' },
];

/**
 * Live 3D mascot widget for the Pomodoro app.
 * <PomodoroMascot mood="focus" name="Pomo" level={3} xp={240} theme="evening" onPoke={fn} />
 */
export function PomodoroMascot({
  mood = 'idle',
  height = 440,
  name = 'Pomo',
  level = 1,
  xp = 0,
  bodyColor = '#ff4d4d',
  accessory = 'none',
  theme = 'morning',
  mascot = 'tomato',
  onPoke,
}) {
  const [pokeTick, setPokeTick] = useState(0);
  const [pokeLine, setPokeLine] = useState(null);

  const doPoke = () => {
    setPokeTick((t) => t + 1);
    setPokeLine(POKE_LINES[Math.floor(Math.random() * POKE_LINES.length)]);
    setTimeout(() => setPokeLine(null), 1200);
    onPoke?.();
  };

  const night = theme === 'night';
  const evening = theme === 'evening';
  const tint = night ? '#c2413f' : evening ? '#f97362' : bodyColor;
  const pct = Math.max(0, Math.min(100, xp % 100));

  return (
    <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.9)',
          borderRadius: 24,
          padding: '8px 16px',
          display: 'inline-block',
          fontWeight: 700,
          marginBottom: 12,
          marginTop: 4,
          border: '2px solid #ffd1d1',
        }}
      >
        {pokeLine ?? MOOD_TEXT[mood] ?? MOOD_TEXT.idle}
      </div>

      {/* level bar — thin, themed to the app */}
      <div
        style={{
          background: night ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.92)',
          borderRadius: 999, padding: '5px 14px 6px', marginBottom: 8,
          color: night ? '#e2e8f0' : '#7c2d12', textAlign: 'left',
          border: night ? '1px solid #312e81' : '1px solid #ffd1d1',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800 }}>
          <span>{name} • Lv {level}</span>
          <span style={{ color: night ? '#ffd166' : '#ea580c' }}>{xp} XP</span>
        </div>
        <div style={{ height: 6, background: night ? '#1e1b4b' : '#ffe4e0', borderRadius: 999, overflow: 'hidden', marginTop: 4 }}>
          <div
            style={{
              height: '100%', width: `${pct}%`, borderRadius: 999,
              background: night ? 'linear-gradient(90deg, #818cf8, #f0abfc)' : 'linear-gradient(90deg, #ff4d4d, #fb923c)',
              transition: 'width 0.6s ease',
            }}
          />
        </div>
      </div>

      {/* living sky — switches with time of day */}
      <div
        onClick={doPoke}
        title="Poke me!"
        style={{
          height, width: '100%', cursor: 'pointer', borderRadius: 20, overflow: 'hidden',
          position: 'relative', background: SKIES[theme] ?? SKIES.morning,
          border: night ? '2px solid #312e81' : '2px solid #ffd1d1',
          transition: 'background 1s ease',
        }}
      >
        {/* sun / moon */}
        <div
          style={{
            position: 'absolute', top: night ? 18 : evening ? 96 : 24, right: 26,
            fontSize: night ? 34 : 44, transition: 'top 1s ease', zIndex: 1,
            filter: night ? 'drop-shadow(0 0 12px #fef9c3)' : 'drop-shadow(0 0 14px #fbbf24)',
          }}
        >
          {night ? '🌙' : evening ? '🌇' : '☀️'}
        </div>
        {/* stars at night */}
        {night && STARS.map((s, i) => (
          <span
            key={i}
            style={{
              position: 'absolute', left: s.l, top: s.t, color: '#fef9c3',
              fontSize: 10 + (i % 3) * 4, opacity: 0.9, zIndex: 1,
              animation: `twinkle ${1.5 + (i % 3) * 0.7}s ease-in-out infinite alternate`,
            }}
          >
            ✦
          </span>
        ))}
        {/* ground hill */}
        <div
          style={{
            position: 'absolute', bottom: -30, left: -20, right: -20, height: 70,
            background: night ? '#0f172a' : evening ? '#9a3412' : '#86efac',
            borderRadius: '50% 50% 0 0', opacity: 0.55, zIndex: 1,
          }}
        />
        <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
          <Canvas shadows camera={{ position: [0, 0.3, 5.8], fov: 40 }} dpr={[1, 2]} gl={{ alpha: true }}>
            <ambientLight intensity={night ? 0.55 : 0.75} color={night ? '#bfdbfe' : '#ffffff'} />
            <directionalLight position={[3, 5, 4]} intensity={night ? 0.9 : 1.4} color={evening ? '#fed7aa' : '#ffffff'} castShadow />
            <directionalLight position={[-3, 2, -2]} intensity={0.3} color="#ffd1d1" />
            <Suspense fallback={null}>
              <Float speed={2} rotationIntensity={0.1} floatIntensity={0.12}>
                {mascot === 'fox' ? (
                  <EmberFox mood={mood} bodyColor={bodyColor} pokeTick={pokeTick} daypart={theme} />
                ) : mascot === 'cat' ? (
                  <CosmoCat mood={mood} bodyColor={bodyColor} pokeTick={pokeTick} daypart={theme} />
                ) : mascot === 'leo' ? (
                  <LeoKitten mood={mood} bodyColor={bodyColor} pokeTick={pokeTick} />
                ) : (
                  <TomatoMascot3D mood={mood} bodyColor={tint} accessory={accessory} pokeTick={pokeTick} daypart={theme} />
                )}
              </Float>
              <ContactShadows position={[0, -1.25, 0]} opacity={night ? 0.6 : 0.35} scale={8} blur={2.4} />
            </Suspense>
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 1.8}
            />
          </Canvas>
        </div>
      </div>
      <style>{`@keyframes twinkle { from { opacity: 0.3; } to { opacity: 1; } }`}</style>
      <button
        onClick={doPoke}
        style={{
          marginTop: 8, borderRadius: 999, border: '1px solid #ffd1d1',
          background: '#fff', padding: '6px 16px', fontWeight: 700, cursor: 'pointer',
        }}
      >
        👋 Poke {name}
      </button>
      <p style={{ opacity: 0.55, fontSize: 13, marginTop: 4 }}>
        Click the tomato • Drag to rotate
      </p>
    </div>
  );
}
