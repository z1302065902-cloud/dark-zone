import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * Cyber Horror / Biopunk / Neon Noir environment decor
 * Components: HoloAd, SignText, SteamPlane, MonsterShadow, BioTank,
 *             PipeRun, NeonEdge, RedAlarmLight, DynamicLightController
 * ------------------------------------------------------------------ */

// Shared module-level ambient event state (mutated each frame by the
// DynamicLightController; read by lights/emissives). Avoids store churn.
export const ambientEvents = {
  blackout: 0,     // 0..1 blackout intensity (ceiling lights die)
  alarm: 0,        // 0..1 red alarm lights intensity
  preFlicker: 0,   // 0..1 pre-blackout warning flicker
  time: 0,         // running clock (seconds)
};

/** Wraps a canvas drawing function into a reusable CanvasTexture. */
function useCanvasTexture(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size: number) {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;
    draw(ctx, size);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/* ----------------------- HoloAd (glitch hologram) ------------------ */
export function HoloAd({
  position, rotation = [0, 0, 0], width = 4, height = 2.6, color = 0x00e5ff,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  color?: number;
}) {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const glitchUntil = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.45) {
        glitchUntil.current = performance.now() + 80 + Math.random() * 220;
      }
    }, 1100);
    return () => clearInterval(id);
  }, []);

  useFrame(() => {
    const mat = matRef.current;
    if (!mat) return;
    const t = performance.now();
    mat.uniforms.uTime.value = t / 1000;
    const glitch = t < glitchUntil.current ? 1 : 0;
    mat.uniforms.uGlitch.value = glitch;
    mat.uniforms.uFlicker.value =
      (Math.sin(t * 0.011) * 0.06 + 0.94) *
      (glitch > 0 ? 0.55 + 0.45 * Math.sin(t * 0.18) : 1);
  });

  const shader = useMemo(() => {
    const c = new THREE.Color(color);
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uGlitch: { value: 0 },
        uFlicker: { value: 1 },
        uColA: { value: new THREE.Color(0x00e5ff) },
        uColB: { value: new THREE.Color(0xff2d95) },
        uBase: { value: c },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime, uGlitch, uFlicker;
        uniform vec3 uBase, uColA, uColB;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec2 uv = vUv;

          // --- glitch: horizontal slice displacement ---
          float sliceRow = floor(uv.y * 18.0);
          float sliceSeed = hash(vec2(sliceRow, floor(uTime * 12.0)));
          float slice = step(0.97, sliceSeed) * uGlitch;
          float jitter = (hash(vec2(sliceRow, floor(uTime * 16.0))) - 0.5) * 0.10 * uGlitch;
          uv.x += jitter;
          uv.x += slice * (hash(vec2(floor(uTime * 24.0))) - 0.5) * 0.6;

          // --- holographic bands (fake text/logo) ---
          float band = 0.0;
          band += step(0.60, sin(uv.y * 22.0 + uTime * 0.6) * 0.5 + 0.5);
          band += step(0.70, sin(uv.x * 40.0 - uTime * 1.4) * 0.5 + 0.5) * 0.5;
          float pulse = 0.5 + 0.5 * sin(uTime * 1.2 + uv.y * 3.0);

          vec3 col = mix(uBase, uColA, band * 0.5);
          col = mix(col, uColB, band * slice * 0.6);
          col += uColA * 0.12 * pulse * (1.0 - band * 0.5);

          // --- scanlines ---
          float scan = 0.82 + 0.18 * sin(uv.y * 260.0 + uTime * 30.0);
          col *= scan;

          // --- chromatic aberration on edges ---
          float edge = smoothstep(0.0, 0.06, uv.x) * smoothstep(1.0, 0.94, uv.x)
                     * smoothstep(0.0, 0.06, uv.y) * smoothstep(1.0, 0.94, uv.y);
          col += uColB * 0.06 * (1.0 - edge);

          col *= edge * uFlicker;

          gl_FragColor = vec4(col, 0.92);
        }
      `,
    });
    matRef.current = m;
    return m;
  }, [color]);

  return (
    <mesh position={position} rotation={rotation as unknown as THREE.Euler}>
      <planeGeometry args={[width, height]} />
      <primitive attach="material" object={shader} />
    </mesh>
  );
}

/* ------------------- SignText (neon zone signage) ------------------ */
export function SignText({
  text, position, rotation = [0, 0, 0], width = 6, height = 1.4, color = '#00e5ff',
}: {
  text: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  color?: string;
}) {
  const tex = useCanvasTexture((ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    // dark glass panel
    ctx.fillStyle = 'rgba(4,6,12,0.92)';
    ctx.fillRect(0, 0, s, s);
    // scanlines
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < s; i += 4) ctx.fillRect(0, i, s, 1);
    // border
    ctx.strokeStyle = color;
    ctx.lineWidth = s * 0.01;
    ctx.strokeRect(s * 0.02, s * 0.02, s * 0.96, s * 0.96);
    // text (multiple glow layers = neon)
    const font = `bold ${s * 0.13}px "PingFang SC","Microsoft YaHei",sans-serif`;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.shadowBlur = s * 0.03;
    ctx.fillStyle = color;
    ctx.fillText(text, s / 2, s / 2);
    ctx.shadowBlur = s * 0.06;
    ctx.fillText(text, s / 2, s / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(text, s / 2, s / 2);
  }, 256);

  const matRef = useRef<THREE.MeshBasicMaterial | null>(null);
  useFrame(() => {
    // subtle flicker (a failing neon sign)
    if (matRef.current) {
      const t = ambientEvents.time;
      matRef.current.opacity =
        0.82 + 0.18 * Math.sin(t * 7.0 + position[0] * 3.0) * Math.sin(t * 23.0 + position[2]);
      matRef.current.opacity = Math.max(0.25, matRef.current.opacity);
    }
  });

  return (
    <mesh position={position} rotation={rotation as unknown as THREE.Euler}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        ref={matRef}
        map={tex}
        transparent
        depthWrite={false}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* -------------------- SteamPlane (drifting vapor) ------------------ */
export function SteamPlane({
  position, scale = [3, 2, 1], speed = 0.05, opacity = 0.16, tint = 0x2bffd0,
}: {
  position: [number, number, number];
  scale?: [number, number, number];
  speed?: number;
  opacity?: number;
  tint?: number;
}) {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);

  useFrame(() => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value += speed;
    mat.uniforms.uOpacity.value = opacity;
  });

  const shader = useMemo(() => {
    const c = new THREE.Color(tint);
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: Math.random() * 10 },
        uOpacity: { value: opacity },
        uColor: { value: c },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        uniform float uTime, uOpacity;
        uniform vec3 uColor;
        varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p){
          vec2 i=floor(p), f=fract(p);
          f=f*f*(3.0-2.0*f);
          float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
          return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
        }
        void main(){
          vec2 uv = vUv * 3.0 + vec2(0.0, uTime);
          float n = noise(uv) * 0.6 + noise(uv * 2.3) * 0.4;
          // wrap vertically for infinite drift
          float alpha = smoothstep(0.35, 0.8, n) * uOpacity;
          alpha *= smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });
    matRef.current = m;
    return m;
  }, [tint, opacity]);

  return (
    <mesh position={position} scale={scale as unknown as THREE.Vector3}>
      <planeGeometry args={[1, 1]} />
      <primitive attach="material" object={shader} />
    </mesh>
  );
}

/* ------------------ MonsterShadow (wall silhouette) ----------------- */
function drawSilhouette(ctx: CanvasRenderingContext2D, s: number) {
  ctx.clearRect(0, 0, s, s);
  const w = s / 2;
  ctx.fillStyle = '#000';
  // legs
  ctx.fillRect(w - 34, s * 0.82, 22, s * 0.16);
  ctx.fillRect(w + 12, s * 0.82, 22, s * 0.16);
  // torso
  ctx.beginPath();
  ctx.moveTo(w - 38, s * 0.36);
  ctx.quadraticCurveTo(w, s * 0.30, w + 38, s * 0.36);
  ctx.lineTo(w + 32, s * 0.84);
  ctx.lineTo(w - 32, s * 0.84);
  ctx.closePath();
  ctx.fill();
  // head (elongated, biopunk)
  ctx.beginPath();
  ctx.arc(w, s * 0.20, s * 0.075, 0, Math.PI * 2);
  ctx.fill();
  // long arms
  ctx.beginPath();
  ctx.moveTo(w - 36, s * 0.40);
  ctx.quadraticCurveTo(w - 110, s * 0.55, w - 122, s * 0.78);
  ctx.quadraticCurveTo(w - 98, s * 0.82, w - 80, s * 0.74);
  ctx.lineTo(w - 34, s * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w + 36, s * 0.40);
  ctx.quadraticCurveTo(w + 110, s * 0.55, w + 122, s * 0.78);
  ctx.quadraticCurveTo(w + 98, s * 0.82, w + 80, s * 0.74);
  ctx.lineTo(w + 34, s * 0.55);
  ctx.closePath();
  ctx.fill();
}

export function MonsterShadow({
  position, rotation = [0, 0, 0], height = 5, intervalMin = 14, intervalMax = 30, hold = 3,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  height?: number;
  intervalMin?: number;
  intervalMax?: number;
  hold?: number;
}) {
  const tex = useCanvasTexture((ctx, s) => drawSilhouette(ctx, s), 256);
  const matRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const phaseRef = useRef(Math.random() * intervalMax);

  useFrame((state) => {
    const mat = matRef.current;
    if (!mat) return;
    const t = state.clock.getElapsedTime();
    const cycle = (t + phaseRef.current) % (intervalMin + intervalMax + hold * 2);
    let target = 0;
    if (cycle < intervalMin) target = 0;                          // hidden
    else if (cycle < intervalMin + hold) target = 1;              // appear
    else if (cycle < intervalMin + hold + intervalMax) target = 0; // hide
    else target = 1;
    // smooth + slight sway
    mat.opacity += (target * 0.9 - mat.opacity) * 0.03;
    if (mat.opacity > 0.02) {
      const sway = Math.sin(t * 0.8) * 0.06;
      if (matRef.current) matRef.current.map!.offset.x = sway;
    }
  });

  return (
    <mesh position={position} rotation={rotation as unknown as THREE.Euler}>
      <planeGeometry args={[height * 0.5, height]} />
      <meshBasicMaterial
        ref={matRef}
        map={tex}
        transparent
        depthWrite={false}
        opacity={0}
        color={0x05060a}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ----------------------- BioTank (biopunk) ------------------------- */
export function BioTank({ position, rotation = [0, 0, 0], scale = 1 }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  const glowRef = useRef<THREE.PointLight | null>(null);
  useFrame(() => {
    if (glowRef.current) {
      const t = ambientEvents.time;
      glowRef.current.intensity = (7 + 2.5 * Math.sin(t * 0.8 + position[0])) * (1 - ambientEvents.blackout * 0.3);
    }
  });
  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler} scale={scale}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.8, 2.4, 16]} />
        <meshStandardMaterial color={0x0d1a12} roughness={0.3} metalness={0.5} transparent opacity={0.88} />
      </mesh>
      {/* glowing liquid */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.55, 0.6, 2.1, 16]} />
        <meshStandardMaterial
          color={0x0a2a12}
          emissive={0x2bff88}
          emissiveIntensity={0.55 + 0.25 * Math.sin(ambientEvents.time * 0.9)}
          transparent
          opacity={0.75}
          roughness={0.2}
        />
      </mesh>
      {/* top ring */}
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.78, 0.78, 0.12, 16]} />
        <meshStandardMaterial color={0x1a1a1a} roughness={0.4} metalness={0.8} />
      </mesh>
      <pointLight ref={glowRef} position={[0, 0, 0]} color={0x2bff88} distance={9} decay={2} intensity={7} />
    </group>
  );
}

/* --------------------- PipeRun (wall pipes) ------------------------ */
export function PipeRun({ from, to, radius = 0.12, emissive = 0x00e5ff }: {
  from: [number, number, number];
  to: [number, number, number];
  radius?: number;
  emissive?: number;
}) {
  const len = Math.sqrt((to[0] - from[0]) ** 2 + (to[1] - from[1]) ** 2 + (to[2] - from[2]) ** 2);
  const mid: [number, number, number] = [
    (from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2,
  ];
  // orientation quaternion from +Y to direction
  const dir = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  return (
    <group position={mid} quaternion={quat}>
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius, len, 10]} />
        <meshStandardMaterial color={0x15151c} roughness={0.35} metalness={0.85} />
      </mesh>
      {/* emissive seam every segment for a cyber strip */}
      {[0.2, 0.4, 0.6, 0.8].map((f) => (
        <mesh key={f} position={[0, (f - 0.5) * len, 0]}>
          <torusGeometry args={[radius * 1.7, radius * 0.16, 6, 12]} />
          <meshStandardMaterial color={0x0a0a0a} emissive={emissive} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ----------------- NeonEdge (wall neon strip) ---------------------- */
export function NeonEdge({ position, rotation = [0, 0, 0], length = 8, color = 0xff2d95, intensity = 2 }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  length?: number;
  color?: number;
  intensity?: number;
}) {
  const matRef = useRef<THREE.MeshStandardMaterial | null>(null);
  useFrame(() => {
    if (matRef.current) {
      const t = ambientEvents.time;
      const flicker = 1 - ambientEvents.blackout * 0.85;
      matRef.current.emissiveIntensity = intensity * (0.75 + 0.25 * Math.sin(t * 3.0 + position[0])) * flicker;
    }
  });
  return (
    <mesh position={position} rotation={rotation as unknown as THREE.Euler}>
      <boxGeometry args={[length, 0.08, 0.04]} />
      <meshStandardMaterial ref={matRef} color={0x0a0a0a} emissive={color} emissiveIntensity={intensity} toneMapped={false} />
    </mesh>
  );
}

/* --------------------- RedAlarmLight (siren) ----------------------- */
export function RedAlarmLight({ position, rotation = [0, 0, 0] }: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const matRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const lightRef = useRef<THREE.PointLight | null>(null);
  useFrame(() => {
    const a = ambientEvents.alarm;
    const pulse = 0.6 + 0.4 * Math.sin(ambientEvents.time * 6.0);
    if (matRef.current) matRef.current.emissiveIntensity = a * 6 * pulse;
    if (lightRef.current) lightRef.current.intensity = a * 14 * pulse;
  });
  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      <mesh>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial ref={matRef} color={0x220000} emissive={0xff2222} emissiveIntensity={0} toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} color={0xff2222} distance={12} decay={2} intensity={0} />
    </group>
  );
}

/* --------------- DynamicLightController (events) ------------------- */
// Every N seconds: ceiling lights flicker hard, then a blackout hits and
// red alarm lights take over for a few seconds. Classic neon-noir.
export function DynamicLightController() {
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ambientEvents.time = t;
    const cycle = 34; // seconds between blackouts
    const pos = (t % cycle) / cycle;
    let blackout = 0;
    let preFlicker = 0;
    if (pos < 0.03) {
      blackout = 1 - pos / 0.03;                 // ease out of blackout
    } else if (pos < 0.88) {
      blackout = 0;                              // normal operation
    } else if (pos < 0.94) {
      blackout = (pos - 0.88) / 0.06;            // ramp in (lights die fast)
      preFlicker = 1;                            // warning flicker stage
    } else {
      blackout = 1;                              // full blackout
    }
    blackout = Math.max(0, Math.min(1, blackout));
    // alarm light rises with the blackout, then pulses
    const alarm = Math.max(0, blackout * (0.7 + 0.3 * Math.sin(t * 5)));
    ambientEvents.blackout = blackout;
    ambientEvents.alarm = alarm;
    ambientEvents.preFlicker = preFlicker;
  });
  return null;
}
