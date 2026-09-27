import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Pomo — funny live tomato mascot, 100% procedural (no GLB download).
 * mood: 'idle' | 'focus' | 'break' | 'celebrate' | 'tired'
 */
export function TomatoMascot3D({ mood = 'idle', bodyColor = '#ff4d4d', accessory = 'none', pokeTick = 0, daypart = 'morning' }) {
  const group = useRef();
  const body = useRef();
  const pupilL = useRef();
  const pupilR = useRef();
  const eyeL = useRef();
  const eyeR = useRef();
  const armL = useRef();
  const armR = useRef();
  const mouthSmile = useRef();
  const [blink, setBlink] = useState(1);
  const blinkTimer = useRef(0);
  const nextBlink = useRef(2);
  const lastPoke = useRef(0);
  const excitedUntil = useRef(-1);
  // human-like life: wandering gaze + occasional wave
  const look = useRef({ x: 0, y: 0, tx: 0, ty: 0, at: 0 });
  const waveUntil = useRef(-1);
  const nextWave = useRef(5);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (!g) return;

    // --- blink logic (sometimes double-blinks, like us) ---
    blinkTimer.current += dt;
    if (blinkTimer.current > nextBlink.current) {
      blinkTimer.current = 0;
      nextBlink.current = 1.8 + Math.random() * 3;
      setBlink(0.08);
      setTimeout(() => setBlink(1), 120);
      if (Math.random() < 0.25) setTimeout(() => { setBlink(0.08); setTimeout(() => setBlink(1), 120); }, 280);
    }

    // --- wandering gaze: picks a new spot every few seconds, blends with cursor ---
    const L = look.current;
    if (t - L.at > 2 + (L.wait ?? 2)) {
      L.tx = (Math.random() - 0.5) * 0.16;
      L.ty = (Math.random() - 0.5) * 0.1 + 0.02;
      L.at = t;
      L.wait = 1.5 + Math.random() * 2.5;
    }
    const k = Math.min(1, dt * 3);
    L.x += ((L.tx + THREE.MathUtils.clamp(state.pointer.x * 0.07, -0.07, 0.07)) - L.x) * k;
    L.y += ((L.ty + THREE.MathUtils.clamp(state.pointer.y * 0.05, -0.03, 0.06)) - L.y) * k;
    // focused = darting eyes, sleepy = droopy still gaze
    const jitter = mood === 'focus' ? 0.02 : 0;
    const jx = jitter ? Math.sin(t * 13) * jitter : 0;
    const jy = jitter ? Math.cos(t * 17) * jitter : 0;
    if (pupilL.current) pupilL.current.position.set(L.x + jx, L.y + jy, 0.24);
    if (pupilR.current) pupilR.current.position.set(L.x + jx, L.y + jy, 0.24);

    // --- mood motion (+ always-on breathing so it feels alive) ---
    let y = 0;
    let squash = [1, 1, 1];
    let rotZ = Math.sin(t * 1.6) * 0.04;
    let rotX = Math.sin(t * 0.9) * 0.04; // head-tilt drift
    const breathe = Math.sin(t * 1.5) * 0.014;

    if (mood === 'idle') {
      y = Math.sin(t * 2.2) * 0.08;
      squash = [1 + Math.sin(t * 2.2) * 0.03, 1 - Math.sin(t * 2.2) * 0.03 + breathe, 1];
      // friendly wave every ~7-12s
      if (t > nextWave.current) {
        nextWave.current = t + 7 + Math.random() * 5;
        waveUntil.current = t + 1.4;
      }
    } else if (mood === 'focus') {
      y = Math.sin(t * 8) * 0.02; // tense tremble, funny
      squash = [1.04, 0.96 + breathe, 1];
      rotZ = Math.sin(t * 3.1) * 0.015;
      rotX = -0.06; // leaning into the work
    } else if (mood === 'break') {
      y = Math.sin(t * 1.2) * 0.15;
      rotZ = Math.sin(t * 1.2) * 0.12; // sleepy sway
      squash = [1.06, 0.94 + breathe, 1];
    } else if (mood === 'celebrate') {
      y = Math.abs(Math.sin(t * 5)) * 0.3; // jumping — capped to stay in frame
      rotZ = Math.sin(t * 5) * 0.15;
      squash = [0.94, 1.08, 0.94];
      if (armL.current) armL.current.rotation.z = 2.4 + Math.sin(t * 10) * 0.4;
      if (armR.current) armR.current.rotation.z = -2.4 - Math.sin(t * 10) * 0.4;
    } else if (mood === 'tired') {
      y = -0.12 + Math.sin(t * 0.9) * 0.03;
      squash = [1.12, 0.86 + breathe * 0.5, 1.05]; // melted tomato
      rotX = 0.08;
    }

    if (mood !== 'celebrate') {
      const waving = mood === 'idle' && t < waveUntil.current;
      if (armL.current) armL.current.rotation.z = 0.5 + Math.sin(t * 2) * 0.12;
      if (armR.current) {
        armR.current.rotation.z = waving
          ? -2.1 + Math.sin(t * 14) * 0.35 // waving hello!
          : -0.5 - Math.sin(t * 2) * 0.12;
      }
      if (waving) y += Math.abs(Math.sin(t * 7)) * 0.12;
    }

    g.position.y = Math.min(y, 0.3);
    // poke excitement — quick happy hop (clamped so it never leaves the frame)
    if (pokeTick !== lastPoke.current) {
      lastPoke.current = pokeTick;
      excitedUntil.current = t + 0.7;
    }
    if (t < excitedUntil.current) {
      g.position.y = Math.min(
        g.position.y + Math.abs(Math.sin((t - excitedUntil.current + 0.7) * 12)) * 0.22,
        0.35
      );
      g.rotation.z += Math.sin(t * 20) * 0.02;
    }
    g.rotation.z = rotZ;
    g.rotation.x = rotX;
    if (body.current) body.current.scale.set(...squash);

    // eyes squint when tired / break
    const eyeScaleY = mood === 'tired' ? 0.35 : mood === 'break' ? 0.6 : blink;
    if (eyeL.current) eyeL.current.scale.set(1, eyeScaleY, 0.6);
    if (eyeR.current) eyeR.current.scale.set(1, eyeScaleY, 0.6);
  });

  const isHappy = mood === 'celebrate' || mood === 'idle' || mood === 'break';
  const mouthArc = mood === 'focus' ? Math.PI * 0.5 : mood === 'tired' ? Math.PI * 0.7 : Math.PI;

  return (
    <group ref={group} position={[0, -0.35, 0]} scale={[0.95, 0.95, 0.95]}>
      {/* body — tomato */}
      <mesh ref={body} castShadow>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color={mood === 'tired' ? '#e05555' : bodyColor} roughness={0.35} metalness={0.05} />
      </mesh>
      {/* belly shine */}
      <mesh position={[-0.35, -0.15, 0.82]} scale={[0.28, 0.35, 0.1]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#ff9a9a" roughness={0.6} transparent opacity={0.7} />
      </mesh>

      {/* stem */}
      <mesh position={[0, 1.02, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 0.28, 16]} />
        <meshStandardMaterial color="#2e9e44" roughness={0.6} />
      </mesh>
      {/* leaves — 3 funny star leaves */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[Math.cos((i / 3) * Math.PI * 2) * 0.28, 1.12, Math.sin((i / 3) * Math.PI * 2) * 0.18]}
          rotation={[0.4, 0, (i / 3) * Math.PI * 2]}
          scale={[1, 0.25, 0.55]}
          castShadow
        >
          <sphereGeometry args={[0.32, 20, 20]} />
          <meshStandardMaterial color="#37c24a" roughness={0.55} />
        </mesh>
      ))}

      {/* eyes */}
      {[-0.34, 0.34].map((x, i) => (
        <group key={x} position={[x, 0.25, 0.78]}>
          <mesh ref={i === 0 ? eyeL : eyeR}>
            <sphereGeometry args={[0.24, 24, 24]} />
            <meshStandardMaterial color="white" roughness={0.15} />
          </mesh>
          <mesh ref={i === 0 ? pupilL : pupilR} position={[0, 0, 0.24]}>
            <sphereGeometry args={[0.11, 20, 20]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.1} />
          </mesh>
          {/* sparkle */}
          <mesh position={[0.04, 0.05, 0.32]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshBasicMaterial color="white" />
          </mesh>
        </group>
      ))}

      {/* angry brows when focusing — funny */}
      {mood === 'focus' && (
        <>
          <mesh position={[-0.34, 0.55, 0.85]} rotation={[0, 0, -0.35]}>
            <boxGeometry args={[0.3, 0.07, 0.05]} />
            <meshStandardMaterial color="#5c1a1a" />
          </mesh>
          <mesh position={[0.34, 0.55, 0.85]} rotation={[0, 0, 0.35]}>
            <boxGeometry args={[0.3, 0.07, 0.05]} />
            <meshStandardMaterial color="#5c1a1a" />
          </mesh>
        </>
      )}

      {/* cheeks */}
      {[-0.58, 0.58].map((x) => (
        <mesh key={x} position={[x, -0.05, 0.68]} scale={[1, 0.7, 0.4]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color="#ff8fa3" roughness={0.7} transparent opacity={0.9} />
        </mesh>
      ))}

      {/* mouth */}
      {mood === 'celebrate' ? (
        <group position={[0, -0.28, 0.82]}>
          <mesh>
            <sphereGeometry args={[0.2, 24, 24]} />
            <meshStandardMaterial color="#5c1a1a" roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.07, 0.12]} scale={[1, 0.5, 0.5]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#ff7b7b" />
          </mesh>
        </group>
      ) : (
        <mesh
          ref={mouthSmile}
          position={[0, -0.25, 0.85]}
          rotation={[0, 0, isHappy ? Math.PI : 0]}
        >
          <torusGeometry args={[0.2, 0.05, 12, 32, mouthArc]} />
          <meshStandardMaterial color="#5c1a1a" roughness={0.4} />
        </mesh>
      )}

      {/* arms */}
      <mesh ref={armL} position={[-1.05, -0.1, 0]} rotation={[0, 0, 0.5]}>
        <capsuleGeometry args={[0.09, 0.45, 8, 16]} />
        <meshStandardMaterial color="#d43d3d" roughness={0.5} />
      </mesh>
      <mesh ref={armR} position={[1.05, -0.1, 0]} rotation={[0, 0, -0.5]}>
        <capsuleGeometry args={[0.09, 0.45, 8, 16]} />
        <meshStandardMaterial color="#d43d3d" roughness={0.5} />
      </mesh>
      {/* hands */}
      <mesh position={[-1.32, 0.2, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#d43d3d" />
      </mesh>
      <mesh position={[1.32, 0.2, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#d43d3d" />
      </mesh>

      {/* feet */}
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x, -1.02, 0.15]} scale={[1, 0.6, 1.3]} castShadow>
          <sphereGeometry args={[0.2, 20, 20]} />
          <meshStandardMaterial color="#6b2d2d" roughness={0.6} />
        </mesh>
      ))}

      {/* accessories — unlockable */}
      {accessory === 'glasses' && (
        <group position={[0, 0.28, 0.95]}>
          {[-0.34, 0.34].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <torusGeometry args={[0.2, 0.045, 12, 32]} />
              <meshStandardMaterial color="#111" roughness={0.3} />
            </mesh>
          ))}
          <mesh position={[0, 0.03, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.3, 0.05, 0.05]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      )}
      {accessory === 'hat' && (
        <group position={[0.25, 1.35, 0]} rotation={[0, 0, 0.25]}>
          <mesh castShadow>
            <coneGeometry args={[0.35, 0.7, 24]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.35, 0]}>
            <torusGeometry args={[0.35, 0.07, 12, 32]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
        </group>
      )}
      {accessory === 'crown' && (
        <group position={[0, 1.28, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.32, 0.36, 0.22, 24]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.3} />
          </mesh>
          {[-0.2, 0, 0.2].map((x) => (
            <mesh key={x} position={[x, 0.2, 0]} castShadow>
              <coneGeometry args={[0.09, 0.22, 12]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
        </group>
      )}
      {/* nightcap — auto after 10pm, reference to the original tomato */}
      {daypart === 'night' && accessory === 'none' && (
        <group position={[-0.25, 1.25, 0]} rotation={[0, 0, 0.5]}>
          <mesh castShadow>
            <coneGeometry args={[0.3, 0.65, 20]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.32, 0]}>
            <torusGeometry args={[0.3, 0.08, 12, 24]} />
            <meshStandardMaterial color="#e0e7ff" roughness={0.6} />
          </mesh>
          <mesh position={[0.28, -0.28, 0]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
        </group>
      )}
    </group>
  );
}
