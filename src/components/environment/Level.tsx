import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import { useGameStore } from '../../stores/gameStore';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  HoloAd, SignText, SteamPlane, MonsterShadow, BioTank, PipeRun,
  NeonEdge, RedAlarmLight, DynamicLightController, ambientEvents,
} from './CyberDecor';

// Level configurations
export const levelConfigs: Record<string, {
  name: string;
  skybox: string;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  ambientColor: number;
  ambientIntensity: number;
  spawnPoint: [number, number, number];
}> = {
  hospital: {
    name: '赛博生化医院',
    skybox: '/hdri/hospital_exterior_1k.hdr',
    fogColor: 0x0a0a16,
    fogNear: 6,
    fogFar: 55,
    ambientColor: 0x10142e,
    ambientIntensity: 0.35,
    spawnPoint: [0, 1.6, 6],
  },
  laboratory: {
    name: '地下实验室',
    skybox: '/hdri/lab_interior_1k.hdr',
    fogColor: 0x05100a,
    fogNear: 1,
    fogFar: 30,
    ambientColor: 0x0a2a1a,
    ambientIntensity: 0.15,
    spawnPoint: [0, 1.6, 0],
  },
  subway: {
    name: '荒废地铁',
    skybox: '/hdri/subway_tunnel_1k.hdr',
    fogColor: 0x0a0a0a,
    fogNear: 1,
    fogFar: 50,
    ambientColor: 0x1a1a1a,
    ambientIntensity: 0.1,
    spawnPoint: [0, 1.6, 0],
  },
  forest: {
    name: '黑森林',
    skybox: '/hdri/forest_night_1k.hdr',
    fogColor: 0x0a150a,
    fogNear: 5,
    fogFar: 80,
    ambientColor: 0x1a2a1a,
    ambientIntensity: 0.25,
    spawnPoint: [0, 1.6, 0],
  },
  town: {
    name: '废弃小镇',
    skybox: '/hdru/town_ruins_1k.hdr',
    fogColor: 0x1a150a,
    fogNear: 10,
    fogFar: 100,
    ambientColor: 0x2a251a,
    ambientIntensity: 0.3,
    spawnPoint: [0, 1.6, 0],
  },
  altar: {
    name: '地下祭坛',
    skybox: '/hdri/cave_altar_1k.hdr',
    fogColor: 0x1a0a0a,
    fogNear: 1,
    fogFar: 25,
    ambientColor: 0x2a1a1a,
    ambientIntensity: 0.15,
    spawnPoint: [0, 1.6, 0],
  },
};

interface LevelProps {
  levelId: string;
}

export function Level({ levelId }: LevelProps) {
  const config = levelConfigs[levelId] || levelConfigs.hospital;
  const { setPlayerPosition } = useGameStore();

  // Set initial player position
  useMemo(() => {
    setPlayerPosition({ x: config.spawnPoint[0], y: config.spawnPoint[1], z: config.spawnPoint[2] });
  }, [levelId, setPlayerPosition]);

  return (
    <>
      {/* Ambient light — cool biopunk tint */}
      <ambientLight color={config.ambientColor} intensity={config.ambientIntensity * 1.6} />

      {/* Moonlit cyan fill (no HDRI needed) */}
      <directionalLight
        position={[10, 14, 6]}
        intensity={0.9}
        color={0x4466cc}
        castShadow
      />
      {/* Magenta accent from the opposite side (neon wash) */}
      <directionalLight
        position={[-10, 6, -8]}
        intensity={0.45}
        color={0xaa2266}
      />

      {/* Cyber Horror environment */}
      <CyberHospital />

      {/* Volumetric fog */}
      <VolumetricFog color={config.fogColor} density={0.02} />

      {/* Drifting steam / vapor */}
      <SteamPlane position={[-6, 1.4, -4]} scale={[4, 3, 1]} speed={0.4} opacity={0.14} tint={0x2bffd0} />
      <SteamPlane position={[5, 1.2, -8]} scale={[5, 3.5, 1]} speed={0.5} opacity={0.11} tint={0x66ccff} />
      <SteamPlane position={[0, 1.0, 10]} scale={[6, 3, 1]} speed={0.3} opacity={0.13} tint={0xff2d95} />

      {/* Dynamic blackout / red alarm events */}
      <DynamicLightController />
      <RedAlarmLight position={[0, 5.4, -22]} />
      <RedAlarmLight position={[0, 5.4, 22]} />
      <RedAlarmLight position={[-22, 5.4, 0]} />
      <RedAlarmLight position={[22, 5.4, 0]} />

      {/* Monster shadows on distant walls (the "shadow before the body" trick) */}
      <MonsterShadow position={[-25.05, 3, -6]} rotation={[0, Math.PI / 2, 0]} height={5.4} intervalMin={10} intervalMax={26} hold={3} />
      <MonsterShadow position={[25.05, 3, 8]} rotation={[0, -Math.PI / 2, 0]} height={5} intervalMin={6} intervalMax={34} hold={2} />
      <MonsterShadow position={[-12, 3, -25.05]} rotation={[0, 0, 0]} height={6} intervalMin={16} intervalMax={40} hold={4} />
      <MonsterShadow position={[14, 3, 25.05]} rotation={[0, Math.PI, 0]} height={5.5} intervalMin={8} intervalMax={30} hold={3} />
    </>
  );
}

/* ---------------- Cyber Hospital (placeholder geometry) ------------- */
function CyberHospital() {
  const config = levelConfigs[useGameStore.getState().currentLevel] || levelConfigs.hospital;

  return (
    <group>
      {/* WET FLOOR — reflective, neon-lit */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <MeshReflectorMaterial
          blur={[300, 90]}
          resolution={512}
          mixBlur={1}
          mixStrength={3}
          roughness={0.75}
          depthScale={1.1}
          minDepthThreshold={0.35}
          maxDepthThreshold={1.2}
          color="#0b0d16"
          metalness={0.65}
          mirror={0.55}
        />
      </mesh>

      {/* Ceiling slab */}
      <mesh position={[0, 5.6, 0]} receiveShadow>
        <boxGeometry args={[60, 0.4, 60]} />
        <meshStandardMaterial color={0x0a0a10} roughness={0.95} metalness={0.1} />
      </mesh>

      {/* Outer walls — dark indigo with neon trims */}
      <mesh name="wall-back" position={[0, 2.8, -25]} receiveShadow>
        <boxGeometry args={[50, 5.6, 0.5]} />
        <meshStandardMaterial color={0x141422} roughness={0.85} metalness={0.25} />
      </mesh>
      <mesh name="wall-front" position={[0, 2.8, 25]} receiveShadow>
        <boxGeometry args={[50, 5.6, 0.5]} />
        <meshStandardMaterial color={0x141422} roughness={0.85} metalness={0.25} />
      </mesh>
      <mesh name="wall-left" position={[-25, 2.8, 0]} receiveShadow>
        <boxGeometry args={[0.5, 5.6, 50]} />
        <meshStandardMaterial color={0x141422} roughness={0.85} metalness={0.25} />
      </mesh>
      <mesh name="wall-right" position={[25, 2.8, 0]} receiveShadow>
        <boxGeometry args={[0.5, 5.6, 50]} />
        <meshStandardMaterial color={0x141422} roughness={0.85} metalness={0.25} />
      </mesh>

      {/* Neon base trims on all walls (cyan + magenta alternating) */}
      <NeonEdge position={[-25.05, 0.12, 0]} rotation={[0, Math.PI / 2, 0]} length={50} color={0x00e5ff} intensity={1.8} />
      <NeonEdge position={[25.05, 0.12, 0]} rotation={[0, -Math.PI / 2, 0]} length={50} color={0xff2d95} intensity={1.8} />
      <NeonEdge position={[0, 0.12, -25.05]} length={50} color={0x00e5ff} intensity={1.8} />
      <NeonEdge position={[0, 0.12, 25.05]} length={50} color={0xff2d95} intensity={1.8} />
      {/* upper trims */}
      <NeonEdge position={[-25.05, 5.15, 0]} rotation={[0, Math.PI / 2, 0]} length={50} color={0xff2d95} intensity={1.2} />
      <NeonEdge position={[25.05, 5.15, 0]} rotation={[0, -Math.PI / 2, 0]} length={50} color={0x00e5ff} intensity={1.2} />
      <NeonEdge position={[0, 5.15, -25.05]} length={50} color={0xff2d95} intensity={1.2} />
      <NeonEdge position={[0, 5.15, 25.05]} length={50} color={0x00e5ff} intensity={1.2} />

      {/* Corridor sections */}
      <CorridorSegment start={[-20, 0, -20]} end={[20, 0, -20]} />
      <CorridorSegment start={[-20, 0, 20]} end={[20, 0, 20]} />
      <CorridorSegment start={[-20, 0, -20]} end={[-20, 0, 20]} />
      <CorridorSegment start={[20, 0, -20]} end={[20, 0, 20]} />

      {/* Ceiling lights */}
      {[...Array(8)].map((_, i) => (
        <CeilingLight
          key={i}
          position={[(i % 4) * 10 - 15, 5.4, Math.floor(i / 4) * 20 - 10]}
        />
      ))}

      {/* Reception / lobby furniture */}
      <ReceptionDesk position={[-3, 0, -2]} rotation={[0, Math.PI, 0]} />
      <MedicalCart position={[-5, 0.5, -15]} />
      <MedicalCart position={[5, 0.5, 15]} />
      <Locker position={[-10, 1, -20]} />
      <Locker position={[10, 1, 20]} />
      <Locker position={[-12, 1, 12]} />

      {/* Bio tanks (biopunk contamination) */}
      <BioTank position={[-14, 0, -10]} scale={1} />
      <BioTank position={[13, 0, 12]} scale={0.85} />
      <BioTank position={[-16, 0, 16]} scale={0.7} />

      {/* Pipes / cables along walls */}
      <PipeRun from={[-24.6, 0.3, -24]} to={[-24.6, 5, 24]} radius={0.13} emissive={0x00e5ff} />
      <PipeRun from={[24.6, 0.3, -24]} to={[24.6, 5, 24]} radius={0.13} emissive={0xff2d95} />
      <PipeRun from={[-24, 0.4, -24.6]} to={[24, 0.4, -24.6]} radius={0.1} emissive={0x2bff88} />
      <PipeRun from={[-24, 0.4, 24.6]} to={[24, 0.4, 24.6]} radius={0.1} emissive={0x2bff88} />

      {/* Broken ceiling wires / hanging cables */}
      <HangingWire position={[-8, 5.4, -18]} len={1.4} />
      <HangingWire position={[9, 5.4, 16]} len={2.1} />
      <HangingWire position={[0, 5.4, 4]} len={0.9} />

      {/* Holographic ads */}
      <HoloAd position={[0, 2.8, -24.85]} width={9} height={4.2} color={0x00e5ff} />
      <HoloAd position={[-24.85, 3, 6]} rotation={[0, Math.PI / 2, 0]} width={7} height={3.6} color={0xff2d95} />
      <HoloAd position={[24.85, 3, -8]} rotation={[0, -Math.PI / 2, 0]} width={7} height={3.6} color={0x2bff88} />

      {/* Zone signage — the hospital's floor progression */}
      <SignText text="赛博生化医院" position={[0, 4.2, -24.4]} width={12} height={2.2} color="#00e5ff" />
      <SignText text="急诊区 EMERGENCY" position={[-12, 4.0, -24.45]} width={7} height={1.6} color="#ff2d95" />
      <SignText text="手术区 SURGERY" position={[12, 4.0, -24.45]} width={7} height={1.6} color="#ff2d95" />
      <SignText text="实验室 LAB" position={[-24.45, 4.0, -12]} rotation={[0, Math.PI / 2, 0]} width={7} height={1.6} color="#2bff88" />
      <SignText text="地下研究所 B1" position={[-24.45, 4.0, 12]} rotation={[0, Math.PI / 2, 0]} width={7} height={1.6} color="#ff2d95" />
      <SignText text="电梯 ELEVATOR" position={[24.45, 4.0, 0]} rotation={[0, -Math.PI / 2, 0]} width={7} height={1.6} color="#00e5ff" />

      {/* Rusted / contaminated wall stains (biopunk) */}
      <BioStain position={[6, 1.4, -24.6]} scale={2} color="#1d5c33" />
      <BioStain position={[-10, 1.1, 24.6]} scale={2.6} color="#5c1d2a" />
      <BioStain position={[-24.6, 1.6, -4]} rotation={[0, Math.PI / 2, 0]} scale={2.2} color="#3a5c1d" />
    </group>
  );
}

/* Bio contamination stain — an emissive blob on a wall */
function BioStain({ position, rotation = [0, 0, 0], scale = 2, color = 0x1d5c33 }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color?: number;
}) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 128, 128);
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.4)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    // splatter blobs
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 40;
      const bx = 64 + Math.cos(a) * r;
      const by = 64 + Math.sin(a) * r;
      const br = 4 + Math.random() * 10;
      const g = ctx.createRadialGradient(bx, by, 1, bx, by, br);
      g.addColorStop(0, 'rgba(255,255,255,0.9)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
    }
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh position={position} rotation={rotation as unknown as THREE.Euler} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} color={color} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function HangingWire({ position, len }: { position: [number, number, number]; len: number }) {
  const wireRef = useRef<THREE.Mesh | null>(null);
  const sparkRef = useRef<THREE.PointLight | null>(null);
  useFrame(() => {
    const t = ambientEvents.time;
    if (wireRef.current) wireRef.current.rotation.z = Math.sin(t * 1.7 + position[0]) * 0.12;
    if (sparkRef.current) {
      // occasional spark flicker
      const r = Math.random();
      sparkRef.current.intensity = r < 0.06 ? 3 + Math.random() * 6 : 0;
    }
  });
  return (
    <group position={position}>
      <mesh ref={wireRef} position={[0, -len / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, len, 6]} />
        <meshStandardMaterial color={0x22222a} roughness={0.7} metalness={0.4} />
      </mesh>
      <mesh position={[0, -len, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={0x555555} emissive={0x886622} emissiveIntensity={1.2} />
      </mesh>
      <pointLight ref={sparkRef} position={[0, -len, 0]} color={0xffcc66} distance={4} decay={2} intensity={0} />
    </group>
  );
}

function ReceptionDesk({ position, rotation = [0, 0, 0] }: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[4, 1.1, 1.4]} />
        <meshStandardMaterial color={0x1a2030} roughness={0.35} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[4, 0.08, 1.4]} />
        <meshStandardMaterial color={0x223} emissive={0x00e5ff} emissiveIntensity={0.5} toneMapped={false} />
      </mesh>
      {/* old CRT terminal */}
      <mesh position={[0.8, 1.15, 0]} castShadow>
        <boxGeometry args={[0.7, 0.55, 0.5]} />
        <meshStandardMaterial color={0x0a0a0f} roughness={0.3} metalness={0.3} />
      </mesh>
      <mesh position={[0.8, 1.16, 0.27]}>
        <planeGeometry args={[0.55, 0.4]} />
        <meshStandardMaterial color={0x0610} emissive={0x33ffcc} emissiveIntensity={1.1} toneMapped={false} />
      </mesh>
    </group>
  );
}

function CorridorSegment({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[2] + end[2]) / 2;
  const length = Math.sqrt((end[0] - start[0]) ** 2 + (end[2] - start[2]) ** 2);
  const angle = Math.atan2(end[2] - start[2], end[0] - start[0]);

  return (
    <group position={[midX, 0, midZ]} rotation={[0, angle + Math.PI / 2, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[length, 3.4, 0.5]} />
        <meshStandardMaterial color={0x1a1a2c} roughness={0.8} metalness={0.3} />
      </mesh>
    </group>
  );
}

function CeilingLight({ position }: { position: [number, number, number] }) {
  const flicker = useRef(0);
  const lightRef = useRef<THREE.PointLight | null>(null);
  const panelRef = useRef<THREE.MeshStandardMaterial | null>(null);

  useFrame(() => {
    if (lightRef.current) {
      flicker.current += 0.05;
      const t = ambientEvents.time;
      // independent flicker per light (seeded by position)
      const seed = position[0] * 7 + position[2] * 13;
      const base = 0.92 + 0.08 * Math.sin(flicker.current + seed);
      // random short-circuit blips
      const blip = Math.sin(Math.floor(t * 8 + seed) * 12.9898) > 0.998 ? 0.25 : 1;
      // pre-blackout warning stutter
      const stutter = ambientEvents.preFlicker > 0 && Math.sin(t * 40 + seed) > 0 ? 0.2 : 1;
      let v = base * blip * stutter * (1 - ambientEvents.blackout * 0.93);
      v = Math.max(0, v);
      lightRef.current.intensity = 30 * v;
      if (panelRef.current) panelRef.current.emissiveIntensity = v * 1.1;
    }
  });

  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
        <meshStandardMaterial color={0x2a2a2a} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* fluorescent panel */}
      <mesh position={[0, -0.09, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.04, 16]} />
        <meshStandardMaterial ref={panelRef} color={0x0a0a0a} emissive={0xddeeff} emissiveIntensity={1} toneMapped={false} />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, -0.1, 0]}
        intensity={30}
        color={0xdfeaff}
        decay={2}
        distance={25}
      />
    </group>
  );
}

function MedicalCart({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.8, 0.6]} />
        <meshStandardMaterial color={0x2a2a3a} roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 0.4, 0.5]} />
        <meshStandardMaterial color={0x3a3a4a} roughness={0.5} metalness={0.5} />
      </mesh>
      {[-0.5, 0.5].map((x) => [-0.3, 0.3].map((z) => (
        <mesh key={`${x}-${z}`} castShadow position={[x, -0.3, z]}>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 12]} />
          <meshStandardMaterial color={0x111} roughness={0.8} metalness={0.2} />
        </mesh>
      )))}
    </group>
  );
}

function Locker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 2, 0.5]} />
        <meshStandardMaterial color={0x2a2a3a} roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.26]} castShadow>
        <planeGeometry args={[0.8, 1.8]} />
        <meshStandardMaterial color={0x3a3a4a} roughness={0.3} metalness={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Volumetric fog using a custom shader material
function VolumetricFog({ color, density }: { color: number; density: number }) {
  const fogMaterial = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uDensity: { value: density },
        uTime: { value: 0 },
        uCameraPos: { value: new THREE.Vector3() },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uDensity;
        uniform float uTime;
        uniform vec3 uCameraPos;
        varying vec3 vWorldPosition;

        float noise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float n = dot(i, vec3(1.0, 57.0, 113.0));
          return fract(sin(n) * 43758.5453);
        }

        float fbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 4; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }

        void main() {
          vec3 viewDir = normalize(vWorldPosition - uCameraPos);
          float dist = length(vWorldPosition - uCameraPos);

          float fogAmount = 1.0 - exp(-uDensity * dist * 0.1);
          float noiseVal = fbm(vWorldPosition * 0.05 + uTime * 0.1);
          fogAmount *= 0.5 + 0.5 * noiseVal;

          gl_FragColor = vec4(uColor, fogAmount * 0.3);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
    });
    return material;
  }, [color, density]);

  useFrame((state) => {
    if (fogMaterial) {
      fogMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
      fogMaterial.uniforms.uCameraPos.value.copy(state.camera.position);
    }
  });

  return (
    <mesh scale={[200, 200, 200]}>
      <sphereGeometry args={[1, 32, 32]} />
      <primitive attach="material" object={fogMaterial} />
    </mesh>
  );
}
