import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Leo Kitten — orange tabby with blue collar + gold tag. Focus-lock guardian. */
export function LeoKitten({ mood = 'idle', bodyColor = '#f5a54a', pokeTick = 0 }) {
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

  const fur = mood === 'tired' ? '#b07a3a' : bodyColor;
  const cream = '#fff7ed';
  const stripe = '#d97b2b';

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
    if (pupilL.current) pupilL.current.position.set(L.x, L.y, 0.16);
    if (pupilR.current) pupilR.current.position.set(L.x, L.y, 0.16);

    let y = 0;
    let squash = [1, 1, 1];
    let rotZ = Math.sin(t * 1.7) * 0.035;
    let rotX = Math.sin(t * 0.9) * 0.03;
    const breathe = Math.sin(t * 1.7) * 0.013;

    if (mood === 'idle') {
      y = Math.sin(t * 2.2) * 0.07;
      squash = [1 + Math.sin(t * 2.2) * 0.025, 1 + breathe, 1];
      if (t > nextWave.current) {
        nextWave.current = t + 7 + Math.random() * 5;
        waveUntil.current = t + 1.3;
      }
    } else if (mood === 'focus') {
      // guard stance: upright, tail high, trembling watch
      y = Math.sin(t * 8) * 0.018;
      squash = [1.02, 0.98 + breathe, 1];
      rotX = -0.08;
      rotZ = 0;
    } else if (mood === 'break') {
      y = Math.sin(t * 1.2) * 0.12;
      rotZ = Math.sin(t * 1.2) * 0.1;
      squash = [1.05, 0.95 + breathe, 1];
    } else if (mood === 'celebrate') {
      y = Math.abs(Math.sin(t * 4.6)) * 0.3;
      rotZ = Math.sin(t * 4.6) * 0.13;
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
      if (waving) y += Math.abs(Math.sin(t * 7)) * 0.08;
    }

    if (tail.current) tail.current.rotation.x = Math.sin(t * (mood === 'focus' ? 5 : 2)) * 0.22;

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

    const eyeY = mood === 'tired' ? 0.32 : mood === 'break' ? 0.6 : mood === 'focus' ? 0.85 : blink;
    if (eyeL.current) eyeL.current.scale.set(1, eyeY, 0.65);
    if (eyeR.current) eyeR.current.scale.set(1, eyeY, 0.65);
  });

  return (
    <group position={[0, -0.35, 0]} scale={[0.95, 0.95, 0.95]}>
      <group ref={group}>
        {/* body */}
        <mesh ref={body} castShadow>
          <sphereGeometry args={[1, 48, 48]} />
          <meshStandardMaterial color={fur} roughness={0.6} />
        </mesh>
        {/* chest */}
        <mesh position={[0, -0.4, 0.68]} scale={[0.55, 0.55, 0.32]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color={cream} roughness={0.65} />
        </mesh>
        {/* head stripes */}
        {[-0.22, 0, 0.22].map((x) => (
          <mesh key={x} position={[x, 0.72, 0.62]} rotation={[0.4, 0, 0]} scale={[1, 1, 0.5]}>
            <boxGeometry args={[0.09, 0.22, 0.06]} />
            <meshStandardMaterial color={stripe} roughness={0.6} />
          </mesh>
        ))}
        {/* ears */}
        {[-0.55, 0.55].map((x) => (
          <group key={x} position={[x, 0.82, 0]}>
            <mesh castShadow rotation={[0, 0, x < 0 ? 0.2 : -0.2]}>
              <coneGeometry args={[0.3, 0.6, 4]} />
              <meshStandardMaterial color={fur} roughness={0.6} flatShading />
            </mesh>
            <mesh position={[0, 0.02, 0.13]} rotation={[0, 0, x < 0 ? 0.2 : -0.2]} scale={[0.5, 0.55, 0.3]}>
              <coneGeometry args={[0.3, 0.6, 4]} />
              <meshStandardMaterial color="#f9a8a8" roughness={0.6} flatShading />
            </mesh>
          </group>
        ))}
        {/* eyes — big green kitten eyes */}
        {[-0.34, 0.34].map((x, i) => (
          <group key={x} position={[x, 0.28, 0.76]}>
            <mesh ref={i === 0 ? eyeL : eyeR}>
              <sphereGeometry args={[0.22, 20, 20]} />
              <meshStandardMaterial color="white" roughness={0.12} />
            </mesh>
            <mesh ref={i === 0 ? pupilL : pupilR} position={[0, 0, 0.16]}>
              <sphereGeometry args={[0.11, 16, 16]} />
              <meshStandardMaterial color="#3f6212" roughness={0.15} />
            </mesh>
            <mesh position={[0, 0, 0.2]}>
              <boxGeometry args={[0.035, 0.12, 0.02]} />
              <meshBasicMaterial color="#111" />
            </mesh>
            <mesh position={[0.05, 0.06, 0.24]}>
              <sphereGeometry args={[0.035, 10, 10]} />
              <meshBasicMaterial color="white" />
            </mesh>
          </group>
        ))}
        {/* nose + mouth */}
        <mesh position={[0, 0.02, 0.94]} scale={[1.4, 0.9, 0.7]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial color="#f9a8a8" roughness={0.4} />
        </mesh>
        {mood === 'celebrate' || mood === 'break' ? (
          <mesh position={[0, -0.2, 0.88]}>
            <sphereGeometry args={[0.13, 14, 14]} />
            <meshStandardMaterial color="#7c3f3f" roughness={0.4} />
          </mesh>
        ) : (
          <mesh position={[0, -0.12, 0.9]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.1, 0.028, 8, 20, Math.PI]} />
            <meshStandardMaterial color="#7c3f3f" roughness={0.4} />
          </mesh>
        )}
        {/* whiskers */}
        {[-1, 1].map((s) => (
          <group key={s}>
            {[0.1, 0.0, -0.1].map((dy, i) => (
              <mesh key={i} position={[s * 0.62, dy, 0.72]} rotation={[0, s * 1.2, s * -0.12 + (i - 1) * 0.08]}>
                <cylinderGeometry args={[0.008, 0.008, 0.5, 6]} />
                <meshStandardMaterial color="#ffffff" roughness={0.4} />
              </mesh>
            ))}
          </group>
        ))}
        {/* collar + tag */}
        <mesh position={[0, -0.52, 0.62]} rotation={[Math.PI / 2 - 0.35, 0, 0]}>
          <torusGeometry args={[0.42, 0.06, 10, 32]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.78, 0.78]}>
          <cylinderGeometry args={[0.09, 0.09, 0.03, 16]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* stripes on sides */}
        {[-0.85, 0.85].map((x) => (
          <mesh key={x} position={[x, 0.05, 0.25]} rotation={[0, x < 0 ? -0.9 : 0.9, 0]} scale={[1, 1, 0.4]}>
            <boxGeometry args={[0.08, 0.3, 0.06]} />
            <meshStandardMaterial color={stripe} roughness={0.6} />
          </mesh>
        ))}
        {/* upright tail */}
        <group position={[-0.85, -0.5, -0.35]} rotation={[0, 0, 0.35]}>
          <mesh ref={tail} position={[0, 0.45, 0]} castShadow>
            <capsuleGeometry args={[0.16, 0.7, 8, 14]} />
            <meshStandardMaterial color={fur} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshStandardMaterial color={cream} roughness={0.6} />
          </mesh>
          {[0.25, 0.5].map((yy) => (
            <mesh key={yy} position={[0, yy, 0]} scale={[1.15, 1, 1.15]}>
              <torusGeometry args={[0.15, 0.035, 8, 16]} />
              <meshStandardMaterial color={stripe} roughness={0.6} />
            </mesh>
          ))}
        </group>
        {/* paws */}
        <mesh ref={armL} position={[-0.9, -0.35, 0.3]} rotation={[0.4, 0, 0.5]}>
          <capsuleGeometry args={[0.1, 0.32, 6, 12]} />
          <meshStandardMaterial color={fur} roughness={0.6} />
        </mesh>
        <mesh ref={armR} position={[0.9, -0.35, 0.3]} rotation={[0.4, 0, -0.5]}>
          <capsuleGeometry args={[0.1, 0.32, 6, 12]} />
          <meshStandardMaterial color={fur} roughness={0.6} />
        </mesh>
        {[-1.12, 1.12].map((x) => (
          <mesh key={x} position={[x, -0.05, 0.3]}>
            <sphereGeometry args={[0.11, 12, 12]} />
            <meshStandardMaterial color={cream} roughness={0.6} />
          </mesh>
        ))}
        {/* feet */}
        {[-0.35, 0.35].map((x) => (
          <mesh key={x} position={[x, -1.0, 0.2]} scale={[1, 0.55, 1.3]} castShadow>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color={cream} roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
