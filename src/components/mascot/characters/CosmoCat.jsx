import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** #5 Cosmo Cat — galaxy cat with starry fur, floats and spins. */
export function CosmoCat({ mood = 'idle', bodyColor = '#7c3aed', pokeTick = 0 }) {
  const group = useRef();
  const body = useRef();
  const pupilL = useRef();
  const pupilR = useRef();
  const eyeL = useRef();
  const eyeR = useRef();
  const armL = useRef();
  const armR = useRef();
  const tail = useRef();
  const [blink, setBlink] = useState(1);
  const blinkTimer = useRef(0);
  const nextBlink = useRef(2);
  const lastPoke = useRef(0);
  const excitedUntil = useRef(-1);
  const look = useRef({ x: 0, y: 0, tx: 0, ty: 0, at: 0, wait: 2 });
  const waveUntil = useRef(-1);
  const nextWave = useRef(6);

  const fur = mood === 'tired' ? '#4c1d95' : bodyColor;
  const furDark = '#4c1d95';

  // fixed star map on the fur
  const stars = [
    [0.5, 0.45, 0.72, 0.045], [-0.55, 0.1, 0.7, 0.035], [0.15, -0.5, 0.8, 0.04],
    [-0.2, 0.6, 0.55, 0.03], [0.62, -0.3, 0.55, 0.035], [-0.62, -0.45, 0.5, 0.04],
    [0.3, 0.15, 0.9, 0.03], [-0.35, -0.15, 0.88, 0.028],
  ];

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
    let rotZ = Math.sin(t * 1.5) * 0.04;
    let rotX = Math.sin(t * 0.9) * 0.03;
    let spin = 0;
    const breathe = Math.sin(t * 1.7) * 0.013;

    if (mood === 'idle') {
      y = 0.15 + Math.sin(t * 1.8) * 0.12; // hovering!
      squash = [1, 1 + breathe, 1];
      if (t > nextWave.current) {
        nextWave.current = t + 7 + Math.random() * 5;
        waveUntil.current = t + 1.3;
      }
    } else if (mood === 'focus') {
      y = 0.1 + Math.sin(t * 7) * 0.02;
      squash = [1.02, 0.98 + breathe, 1];
      rotX = -0.07;
      rotZ = 0;
    } else if (mood === 'break') {
      y = 0.12 + Math.sin(t * 1.1) * 0.14;
      rotZ = Math.sin(t * 1.1) * 0.12;
      squash = [1.04, 0.96 + breathe, 1];
    } else if (mood === 'celebrate') {
      y = 0.2 + Math.abs(Math.sin(t * 3.5)) * 0.28;
      spin = t * 2.2; // spins like a galaxy!
      squash = [0.96, 1.06, 0.96];
      if (armL.current) armL.current.rotation.z = 2.4 + Math.sin(t * 10) * 0.4;
      if (armR.current) armR.current.rotation.z = -2.4 - Math.sin(t * 10) * 0.4;
    } else if (mood === 'tired') {
      y = -0.1 + Math.sin(t * 0.8) * 0.03; // lands, no more floating
      squash = [1.1, 0.88 + breathe * 0.5, 1.04];
      rotX = 0.07;
    }

    if (mood !== 'celebrate') {
      const waving = mood === 'idle' && t < waveUntil.current;
      if (armL.current) armL.current.rotation.z = 0.5 + Math.sin(t * 2.1) * 0.12;
      if (armR.current) {
        armR.current.rotation.z = waving ? -2.1 + Math.sin(t * 13) * 0.35 : -0.5 - Math.sin(t * 2.1) * 0.12;
      }
      if (waving) y += Math.abs(Math.sin(t * 7)) * 0.08;
    }

    // tail sway
    if (tail.current) tail.current.rotation.x = Math.sin(t * 2.2) * 0.25;

    g.position.y = Math.min(y, 0.45);
    if (pokeTick !== lastPoke.current) {
      lastPoke.current = pokeTick;
      excitedUntil.current = t + 0.7;
    }
    if (t < excitedUntil.current) {
      g.position.y = Math.min(g.position.y + Math.abs(Math.sin((t - excitedUntil.current + 0.7) * 12)) * 0.2, 0.5);
    }
    g.rotation.z = rotZ;
    g.rotation.x = rotX;
    g.rotation.y = spin;
    if (body.current) body.current.scale.set(...squash);

    const eyeY = mood === 'tired' ? 0.32 : mood === 'break' ? 0.58 : mood === 'focus' ? 0.8 : blink;
    if (eyeL.current) eyeL.current.scale.set(1, eyeY, 0.65);
    if (eyeR.current) eyeR.current.scale.set(1, eyeY, 0.65);
  });

  return (
    <group position={[0, -0.45, 0]} scale={[0.95, 0.95, 0.95]}>
      <group ref={group}>
        {/* body */}
        <mesh ref={body} castShadow>
          <sphereGeometry args={[1, 48, 48]} />
          <meshStandardMaterial color={mood === 'tired' ? '#4c1d95' : fur} roughness={0.45} />
        </mesh>
        {/* starry fur */}
        {stars.map(([x, yy, z, r], i) => (
          <mesh key={i} position={[x, yy, z]}>
            <sphereGeometry args={[r, 8, 8]} />
            <meshBasicMaterial color={i % 3 === 0 ? '#fde68a' : '#ffffff'} />
          </mesh>
        ))}
        {/* crescent moon mark */}
        <mesh position={[0, 0.62, 0.78]} rotation={[0, 0, 0.5]}>
          <torusGeometry args={[0.09, 0.032, 8, 20, Math.PI * 1.4]} />
          <meshBasicMaterial color="#fde68a" />
        </mesh>
        {/* ears */}
        {[-0.55, 0.55].map((x) => (
          <group key={x} position={[x, 0.82, 0]}>
            <mesh castShadow rotation={[0, 0, x < 0 ? 0.2 : -0.2]}>
              <coneGeometry args={[0.3, 0.62, 4]} />
              <meshStandardMaterial color={mood === 'tired' ? '#4c1d95' : fur} roughness={0.45} flatShading />
            </mesh>
            <mesh position={[0, 0.05, 0.12]} rotation={[0, 0, x < 0 ? 0.2 : -0.2]} scale={[0.5, 0.55, 0.3]}>
              <coneGeometry args={[0.3, 0.62, 4]} />
              <meshStandardMaterial color="#f9a8d4" roughness={0.5} flatShading />
            </mesh>
          </group>
        ))}
        {/* eyes */}
        {[-0.34, 0.34].map((x, i) => (
          <group key={x} position={[x, 0.25, 0.78]}>
            <mesh ref={i === 0 ? eyeL : eyeR}>
              <sphereGeometry args={[0.23, 20, 20]} />
              <meshStandardMaterial color="white" roughness={0.15} />
            </mesh>
            <mesh ref={i === 0 ? pupilL : pupilR} position={[0, 0, 0.17]}>
              <sphereGeometry args={[0.11, 16, 16]} />
              <meshStandardMaterial color="#2e1065" roughness={0.1} />
            </mesh>
            <mesh position={[0.045, 0.055, 0.26]}>
              <sphereGeometry args={[0.035, 10, 10]} />
              <meshBasicMaterial color="white" />
            </mesh>
          </group>
        ))}
        {/* nose + mouth */}
        <mesh position={[0, 0.0, 0.95]} scale={[1.3, 0.9, 0.7]}>
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshStandardMaterial color="#f9a8d4" roughness={0.4} />
        </mesh>
        {mood === 'celebrate' ? (
          <mesh position={[0, -0.22, 0.88]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#4c1d95" roughness={0.4} />
          </mesh>
        ) : (
          <mesh position={[0, -0.14, 0.92]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.12, 0.032, 8, 22, Math.PI]} />
            <meshStandardMaterial color={furDark} roughness={0.4} />
          </mesh>
        )}
        {/* cheeks */}
        {[-0.56, 0.56].map((x) => (
          <mesh key={x} position={[x, -0.05, 0.66]} scale={[1, 0.7, 0.4]}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial color="#f9a8d4" transparent opacity={0.75} roughness={0.7} />
          </mesh>
        ))}
        {/* swirly tail */}
        <group position={[1.0, -0.3, -0.3]} rotation={[0.4, 0, -0.6]}>
          <mesh ref={tail} castShadow>
            <torusGeometry args={[0.42, 0.16, 12, 24, Math.PI * 1.5]} />
            <meshStandardMaterial color={mood === 'tired' ? '#4c1d95' : fur} roughness={0.45} />
          </mesh>
          <mesh position={[0.42, 0.35, 0]}>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshBasicMaterial color="#fde68a" />
          </mesh>
        </group>
        {/* paws */}
        <mesh ref={armL} position={[-0.9, -0.5, 0.35]} rotation={[0.5, 0, 0.5]}>
          <capsuleGeometry args={[0.1, 0.32, 6, 12]} />
          <meshStandardMaterial color={mood === 'tired' ? '#4c1d95' : fur} roughness={0.5} />
        </mesh>
        <mesh ref={armR} position={[0.9, -0.5, 0.35]} rotation={[0.5, 0, -0.5]}>
          <capsuleGeometry args={[0.1, 0.32, 6, 12]} />
          <meshStandardMaterial color={mood === 'tired' ? '#4c1d95' : fur} roughness={0.5} />
        </mesh>
        {/* floating paws-down feet */}
        {[-0.32, 0.32].map((x) => (
          <mesh key={x} position={[x, -0.95, 0.15]} scale={[1, 0.6, 1.2]}>
            <sphereGeometry args={[0.18, 14, 14]} />
            <meshStandardMaterial color={furDark} roughness={0.55} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
