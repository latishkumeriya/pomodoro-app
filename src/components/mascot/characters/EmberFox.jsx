import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** #3 Ember Fox — orange cub, flame tail flares on celebrate. */
export function EmberFox({ mood = 'idle', bodyColor = '#f97316', pokeTick = 0 }) {
  const group = useRef();
  const body = useRef();
  const pupilL = useRef();
  const pupilR = useRef();
  const eyeL = useRef();
  const eyeR = useRef();
  const armL = useRef();
  const armR = useRef();
  const flame = useRef();
  const [blink, setBlink] = useState(1);
  const blinkTimer = useRef(0);
  const nextBlink = useRef(2);
  const lastPoke = useRef(0);
  const excitedUntil = useRef(-1);
  const look = useRef({ x: 0, y: 0, tx: 0, ty: 0, at: 0, wait: 2 });
  const waveUntil = useRef(-1);
  const nextWave = useRef(6);

  const fur = mood === 'tired' ? '#9a4a22' : bodyColor;
  const cream = '#ffedd5';

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (!g) return;

    blinkTimer.current += dt;
    if (blinkTimer.current > nextBlink.current) {
      blinkTimer.current = 0;
      nextBlink.current = 1.8 + Math.random() * 3;
      setBlink(0.08);
      setTimeout(() => setBlink(1), 120);
    }

    const L = look.current;
    if (t - L.at > 2 + L.wait) {
      L.tx = (Math.random() - 0.5) * 0.14;
      L.ty = (Math.random() - 0.5) * 0.08 + 0.02;
      L.at = t;
      L.wait = 1.5 + Math.random() * 2.5;
    }
    const k = Math.min(1, dt * 3);
    L.x += ((L.tx + THREE.MathUtils.clamp(state.pointer.x * 0.06, -0.06, 0.06)) - L.x) * k;
    L.y += ((L.ty + THREE.MathUtils.clamp(state.pointer.y * 0.04, -0.03, 0.05)) - L.y) * k;
    if (pupilL.current) pupilL.current.position.set(L.x, L.y, 0.17);
    if (pupilR.current) pupilR.current.position.set(L.x, L.y, 0.17);

    let y = 0;
    let squash = [1, 1, 1];
    let rotZ = Math.sin(t * 1.7) * 0.035;
    let rotX = Math.sin(t * 0.85) * 0.035;
    const breathe = Math.sin(t * 1.6) * 0.013;

    if (mood === 'idle') {
      y = Math.sin(t * 2.3) * 0.07;
      squash = [1 + Math.sin(t * 2.3) * 0.025, 1 + breathe, 1];
      if (t > nextWave.current) {
        nextWave.current = t + 7 + Math.random() * 5;
        waveUntil.current = t + 1.3;
      }
    } else if (mood === 'focus') {
      y = Math.sin(t * 8.5) * 0.018;
      squash = [1.03, 0.97 + breathe, 1];
      rotX = -0.07;
      rotZ = 0;
    } else if (mood === 'break') {
      y = Math.sin(t * 1.15) * 0.13;
      rotZ = Math.sin(t * 1.15) * 0.11;
      squash = [1.05, 0.95 + breathe, 1];
    } else if (mood === 'celebrate') {
      y = Math.abs(Math.sin(t * 4.6)) * 0.3;
      rotZ = Math.sin(t * 4.6) * 0.14;
      squash = [0.95, 1.07, 0.95];
      if (armL.current) armL.current.rotation.z = 2.4 + Math.sin(t * 10) * 0.4;
      if (armR.current) armR.current.rotation.z = -2.4 - Math.sin(t * 10) * 0.4;
    } else if (mood === 'tired') {
      y = -0.13 + Math.sin(t * 0.85) * 0.025;
      squash = [1.1, 0.88 + breathe * 0.5, 1.04];
      rotX = 0.07;
    }

    if (mood !== 'celebrate') {
      const waving = mood === 'idle' && t < waveUntil.current;
      if (armL.current) armL.current.rotation.z = 0.5 + Math.sin(t * 2.1) * 0.12;
      if (armR.current) {
        armR.current.rotation.z = waving ? -2.1 + Math.sin(t * 13) * 0.35 : -0.5 - Math.sin(t * 2.1) * 0.12;
      }
      if (waving) y += Math.abs(Math.sin(t * 7)) * 0.1;
    }

    // flame tail flares on celebrate / poke
    const flare = mood === 'celebrate' || t < excitedUntil.current ? 2.2 + Math.sin(t * 12) * 0.5 : 1.1 + Math.sin(t * 3) * 0.15;
    if (flame.current) {
      flame.current.scale.setScalar(flare);
      flame.current.material.emissiveIntensity = mood === 'celebrate' ? 2.4 : 1.0;
    }

    g.position.y = Math.min(y, 0.3);
    if (pokeTick !== lastPoke.current) {
      lastPoke.current = pokeTick;
      excitedUntil.current = t + 0.7;
    }
    if (t < excitedUntil.current) {
      g.position.y = Math.min(g.position.y + Math.abs(Math.sin((t - excitedUntil.current + 0.7) * 12)) * 0.22, 0.35);
    }
    g.rotation.z = rotZ;
    g.rotation.x = rotX;
    if (body.current) body.current.scale.set(...squash);

    const eyeY = mood === 'tired' ? 0.32 : mood === 'break' ? 0.58 : mood === 'focus' ? 0.8 : blink;
    if (eyeL.current) eyeL.current.scale.set(1, eyeY, 0.65);
    if (eyeR.current) eyeR.current.scale.set(1, eyeY, 0.65);
  });

  return (
    <group position={[0, -0.35, 0]} scale={[0.95, 0.95, 0.95]}>
      <group ref={group}>
        {/* body */}
        <mesh ref={body} castShadow>
          <sphereGeometry args={[1, 48, 48]} />
          <meshStandardMaterial color={mood === 'tired' ? '#9a4a22' : fur} roughness={0.5} />
        </mesh>
        {/* chest fluff */}
        <mesh position={[0, -0.35, 0.72]} scale={[0.55, 0.6, 0.3]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color={cream} roughness={0.65} />
        </mesh>
        {/* ears */}
        {[-0.52, 0.52].map((x) => (
          <group key={x} position={[x, 0.85, 0]}>
            <mesh castShadow rotation={[0, 0, x < 0 ? 0.25 : -0.25]}>
              <coneGeometry args={[0.28, 0.6, 4]} />
              <meshStandardMaterial color={mood === 'tired' ? '#9a4a22' : fur} roughness={0.5} flatShading />
            </mesh>
            <mesh position={[0, 0.28, 0]} rotation={[0, 0, x < 0 ? 0.25 : -0.25]} scale={[0.45, 0.45, 0.3]}>
              <coneGeometry args={[0.28, 0.6, 4]} />
              <meshStandardMaterial color="#7c2d12" roughness={0.5} flatShading />
            </mesh>
          </group>
        ))}
        {/* muzzle */}
        <mesh position={[0, -0.18, 0.85]} scale={[0.62, 0.45, 0.4]}>
          <sphereGeometry args={[0.5, 24, 24]} />
          <meshStandardMaterial color={cream} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.12, 1.02]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color="#1c0f0a" roughness={0.3} />
        </mesh>
        {/* eyes */}
        {[-0.35, 0.35].map((x, i) => (
          <group key={x} position={[x, 0.28, 0.78]}>
            <mesh ref={i === 0 ? eyeL : eyeR}>
              <sphereGeometry args={[0.22, 20, 20]} />
              <meshStandardMaterial color="white" roughness={0.15} />
            </mesh>
            <mesh ref={i === 0 ? pupilL : pupilR} position={[0, 0, 0.17]}>
              <sphereGeometry args={[0.105, 16, 16]} />
              <meshStandardMaterial color="#1c0f0a" roughness={0.1} />
            </mesh>
            <mesh position={[0.04, 0.05, 0.25]}>
              <sphereGeometry args={[0.033, 10, 10]} />
              <meshBasicMaterial color="white" />
            </mesh>
          </group>
        ))}
        {/* focus brows */}
        {mood === 'focus' && (
          <>
            <mesh position={[-0.35, 0.58, 0.82]} rotation={[0, 0, -0.35]}>
              <boxGeometry args={[0.28, 0.06, 0.05]} />
              <meshStandardMaterial color="#7c2d12" />
            </mesh>
            <mesh position={[0.35, 0.58, 0.82]} rotation={[0, 0, 0.35]}>
              <boxGeometry args={[0.28, 0.06, 0.05]} />
              <meshStandardMaterial color="#7c2d12" />
            </mesh>
          </>
        )}
        {/* smile */}
        {mood === 'celebrate' ? (
          <mesh position={[0, -0.32, 0.95]}>
            <sphereGeometry args={[0.16, 18, 18]} />
            <meshStandardMaterial color="#7c2d12" roughness={0.4} />
          </mesh>
        ) : (
          <mesh position={[0, -0.3, 0.98]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.14, 0.035, 10, 24, Math.PI * (mood === 'tired' ? 0.7 : 1)]} />
            <meshStandardMaterial color="#7c2d12" roughness={0.4} />
          </mesh>
        )}
        {/* flame tail */}
        <group position={[-1.05, -0.25, -0.35]} rotation={[0, 0.5, 0.5]}>
          <mesh castShadow>
            <sphereGeometry args={[0.42, 20, 20]} />
            <meshStandardMaterial color={mood === 'tired' ? '#9a4a22' : fur} roughness={0.5} />
          </mesh>
          <mesh position={[0.3, 0.35, 0]} scale={[0.8, 1.1, 0.8]}>
            <sphereGeometry args={[0.32, 18, 18]} />
            <meshStandardMaterial color="#fdba74" roughness={0.5} />
          </mesh>
          <mesh ref={flame} position={[0.55, 0.75, 0]}>
            <coneGeometry args={[0.2, 0.5, 12]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f97316" emissiveIntensity={1.0} roughness={0.3} />
          </mesh>
        </group>
        {/* arms */}
        <mesh ref={armL} position={[-0.95, -0.2, 0.2]} rotation={[0, 0, 0.5]}>
          <capsuleGeometry args={[0.09, 0.38, 6, 12]} />
          <meshStandardMaterial color={mood === 'tired' ? '#9a4a22' : fur} roughness={0.5} />
        </mesh>
        <mesh ref={armR} position={[0.95, -0.2, 0.2]} rotation={[0, 0, -0.5]}>
          <capsuleGeometry args={[0.09, 0.38, 6, 12]} />
          <meshStandardMaterial color={mood === 'tired' ? '#9a4a22' : fur} roughness={0.5} />
        </mesh>
        {/* feet */}
        {[-0.35, 0.35].map((x) => (
          <mesh key={x} position={[x, -1.0, 0.2]} scale={[1, 0.55, 1.25]} castShadow>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#7c2d12" roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
