import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../../stores/gameStore';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import {
  HoloAd, SignText, SteamPlane, MonsterShadow, BioTank, PipeRun,
  NeonEdge, RedAlarmLight, DynamicLightController, ambientEvents,
} from './CyberDecor';
import { Door } from './Door';
import { FuseBox, PickupItem } from './FuseBox';
import { dzSound } from '../AudioManager';
import { ObjectiveSystem, ObjectiveHUD } from './ObjectiveSystem';
import { Wall, StaticBlock, registerCollider } from './collision';

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
    skybox: '/hdri/hospital_room_1k.hdr',
    fogColor: 0x0a0a16,
    fogNear: 6,
    fogFar: 55,
    ambientColor: 0x10142e,
    ambientIntensity: 0.35,
    spawnPoint: [0, 1.6, 6],
  },
  laboratory: {
    name: '地下实验室',
    skybox: '/hdri/industrial_workshop_foundry_1k.hdr',
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
    skybox: '/hdri/town_ruins_1k.hdr',
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
  const { setPlayerPosition, setCurrentLevel } = useGameStore();

  // Set initial player position
  useMemo(() => {
    setPlayerPosition({ x: config.spawnPoint[0], y: config.spawnPoint[1], z: config.spawnPoint[2] });
    setCurrentLevel(levelId);
  }, [levelId, setPlayerPosition, setCurrentLevel]);

  // Escape trigger: boss defeated + reach lab exit → escape_hospital
  const escapeDone = useRef(false);
  useFrame(() => {
    if (levelId !== 'hospital') return;
    const store = useGameStore.getState();
    if (store.gameState !== 'playing') return;
    if (escapeDone.current) return;
    if (!store.completedObjectives.includes('defeat_boss')) return;

    const p = store.playerPosition;
    // Lab exit at the north-east corner of the lab sub-room
    if (p.x > 18 && p.z > 20.8) {
      escapeDone.current = true;
      store.completeObjective('escape_hospital');
    }
  });

  return (
    <>
      {/* Ambient light — cool biopunk tint */}
      <ambientLight color={config.ambientColor} intensity={config.ambientIntensity * 1.6} />

      {/* Moonlit cyan fill */}
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

      {/* Cyber Horror Hospital with zone progression */}
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

      {/* Monster shadows on distant walls */}
      <MonsterShadow position={[-25.05, 3, -6]} rotation={[0, Math.PI / 2, 0]} height={5.4} intervalMin={10} intervalMax={26} hold={3} />
      <MonsterShadow position={[25.05, 3, 8]} rotation={[0, -Math.PI / 2, 0]} height={5} intervalMin={6} intervalMax={34} hold={2} />
      <MonsterShadow position={[-12, 3, -25.05]} rotation={[0, 0, 0]} height={6} intervalMin={16} intervalMax={40} hold={4} />
      <MonsterShadow position={[14, 3, 25.05]} rotation={[0, Math.PI, 0]} height={5.5} intervalMin={8} intervalMax={30} hold={3} />

      {/* Objective logic (no HUD — rendered in GameUI DOM overlay) */}
      <ObjectiveSystem />
    </>
  );
}

/* ============ INTERIOR WALL WITH DOOR GAP ============ */
function WallWithDoor({
  along,          // 'x' | 'z' — direction the wall runs
  at,             // coordinate of the wall plane
  from, to,       // span along the wall
  gapCenter,      // center of the doorway gap
  gapWidth,       // width of the doorway gap
  color = 0x141422,
}: {
  along: 'x' | 'z';
  at: number;
  from: number;
  to: number;
  gapCenter: number;
  gapWidth: number;
  color?: number;
}) {
  const segs: [number, number][] = [];
  const g0 = gapCenter - gapWidth / 2;
  const g1 = gapCenter + gapWidth / 2;
  if (from < g0) segs.push([from, g0]);
  if (g1 < to) segs.push([g1, to]);

  return (
    <group>
      {segs.map(([a, b], i) => {
        const len = b - a;
        const mid = (a + b) / 2;
        const pos: [number, number, number] = along === 'z'
          ? [mid, 2.8, at]
          : [at, 2.8, mid];
        const size: [number, number, number] = along === 'z'
          ? [len, 5.6, 0.3]
          : [0.3, 5.6, len];
        return <Wall key={i} position={pos} size={size} color={color} />;
      })}
    </group>
  );
}

/* ---------------- Cyber Hospital with 4-Zone Progression ------------- */
function CyberHospital() {
  return (
    <group>
      {/* ============ WET FLOOR — reflective, neon-lit ============ */}
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

      {/* ============ CEILING ============ */}
      <mesh position={[0, 5.6, 0]} receiveShadow>
        <boxGeometry args={[60, 0.4, 60]} />
        <meshStandardMaterial color={0x0a0a10} roughness={0.95} metalness={0.1} />
      </mesh>

      {/* ============ OUTER WALLS (collidable) ============ */}
      <Wall position={[0, 2.8, -25]} size={[50, 5.6, 0.5]} />
      <Wall position={[0, 2.8, 25]} size={[50, 5.6, 0.5]} />
      <Wall position={[-25, 2.8, 0]} size={[0.5, 5.6, 50]} />
      <Wall position={[25, 2.8, 0]} size={[0.5, 5.6, 50]} />

      {/* Physics floor — gives enemies ground to stand on */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh visible={false}>
          <boxGeometry args={[52, 1, 52]} />
        </mesh>
      </RigidBody>

      {/* ============ INTERIOR ZONE WALLS ============ */}
      {/* Lobby ↔ Emergency (z=-15), door gap at x=0 */}
      <WallWithDoor along="z" at={-15} from={-25} to={25} gapCenter={0} gapWidth={4} />
      {/* Lobby ↔ Surgery (z=15), door gap at x=0 */}
      <WallWithDoor along="z" at={15} from={-25} to={25} gapCenter={0} gapWidth={4} />
      {/* Lab sub-room: west wall (x=12) with door gap at z=8 */}
      <WallWithDoor along="x" at={12} from={-7} to={23} gapCenter={8} gapWidth={4} color={0x0a1a10} />
      {/* Lab south wall */}
      <Wall position={[18.5, 2.8, -7]} size={[13, 5.6, 0.3]} color={0x0a1a10} />
      {/* Lab north wall */}
      <Wall position={[18.5, 2.8, 23]} size={[13, 5.6, 0.3]} color={0x0a1a10} />

      {/* ============ NEON TRIMS ============ */}
      <NeonEdge position={[-25.05, 0.12, 0]} rotation={[0, Math.PI / 2, 0]} length={50} color={0x00e5ff} intensity={1.8} />
      <NeonEdge position={[25.05, 0.12, 0]} rotation={[0, -Math.PI / 2, 0]} length={50} color={0xff2d95} intensity={1.8} />
      <NeonEdge position={[0, 0.12, -25.05]} length={50} color={0x00e5ff} intensity={1.8} />
      <NeonEdge position={[0, 0.12, 25.05]} length={50} color={0xff2d95} intensity={1.8} />
      <NeonEdge position={[-25.05, 5.15, 0]} rotation={[0, Math.PI / 2, 0]} length={50} color={0xff2d95} intensity={1.2} />
      <NeonEdge position={[25.05, 5.15, 0]} rotation={[0, -Math.PI / 2, 0]} length={50} color={0x00e5ff} intensity={1.2} />
      <NeonEdge position={[0, 5.15, -25.05]} length={50} color={0xff2d95} intensity={1.2} />
      <NeonEdge position={[0, 5.15, 25.05]} length={50} color={0x00e5ff} intensity={1.2} />

      {/* ============ DOORS ============ */}
      <Door
        doorId="door_emergency"
        position={[0, 0, -15]}
        rotation={[0, 0, 0]}
        type="keycard"
        leadsTo="emergency"
        size={[3, 3.5]}
      />
      <Door
        doorId="door_surgery"
        position={[0, 0, 15]}
        rotation={[0, 0, 0]}
        type="fuse"
        leadsTo="surgery"
        size={[3, 3.5]}
      />
      <Door
        doorId="door_lab"
        position={[12, 0, 8]}
        rotation={[0, -Math.PI / 2, 0]}
        type="boss"
        leadsTo="lab"
        size={[3, 3.5]}
      />

      {/* ============ ZONE DECOR ============ */}
      <ZoneLobby />
      <ZoneEmergency />
      <ZoneSurgery />
      <ZoneUndergroundLab />

      {/* ============ CEILING LIGHTS (8 total, distributed) ============ */}
      {[...Array(8)].map((_, i) => (
        <CeilingLight
          key={i}
          position={[(i % 4) * 12 - 18, 5.4, Math.floor(i / 4) * 20 - 10]}
        />
      ))}

      {/* ============ HOLOGRAPHIC ADS ============ */}
      <HoloAd position={[0, 2.8, -24.85]} width={9} height={4.2} color={0x00e5ff} />
      <HoloAd position={[-24.85, 3, 6]} rotation={[0, Math.PI / 2, 0]} width={7} height={3.6} color={0xff2d95} />
      <HoloAd position={[24.85, 3, -8]} rotation={[0, -Math.PI / 2, 0]} width={7} height={3.6} color={0x2bff88} />

      {/* ============ ZONE SIGNAGE ============ */}
      <SignText text="赛博生化医院" position={[0, 4.2, -24.4]} width={12} height={2.2} color="#00e5ff" />
      <SignText text="急诊区 EMERGENCY" position={[-12, 4.0, -24.45]} width={7} height={1.6} color="#ff2d95" />
      <SignText text="手术区 SURGERY" position={[12, 4.0, -24.45]} width={7} height={1.6} color="#ff2d95" />
      <SignText text="实验室 LAB" position={[-24.45, 4.0, -12]} rotation={[0, Math.PI / 2, 0]} width={7} height={1.6} color="#2bff88" />
      <SignText text="地下研究所 B1" position={[-24.45, 4.0, 12]} rotation={[0, Math.PI / 2, 0]} width={7} height={1.6} color="#ff2d95" />
      <SignText text="电梯 ELEVATOR" position={[24.45, 4.0, 0]} rotation={[0, -Math.PI / 2, 0]} width={7} height={1.6} color="#00e5ff" />

      {/* ============ KEY ITEMS (Pickups) ============ */}
      {/* Power junction (FuseBox) in Emergency — install fuse to restore power */}
      <FuseBox boxId="emergency" position={[-18, 0, -22]} requiredFuses={1} />

      {/* Keycard in Lobby (on reception desk) */}
      <PickupItem itemType="keycard" position={[-3, 1.8, -2]} rotation={[0, Math.PI, 0]} />
      {/* Fuse in Emergency (on medical cart) */}
      <PickupItem itemType="fuse" position={[-5, 1.3, -18]} rotation={[0, 0, 0]} />
      {/* Master Key in Surgery (on surgical tray) */}
      <PickupItem itemType="master_key" position={[5, 1.3, 18]} rotation={[0, 0, 0]} />
      {/* Pistol in Emergency (security locker near fusebox) */}
      <WeaponPickup weapon="pistol" position={[-16, 1.2, -24]} />

      {/* ============ DECOR ELEMENTS ============ */}
      <ReceptionDesk position={[-3, 0, -2]} rotation={[0, Math.PI, 0]} />
      <MedicalCart position={[-5, 0.5, -18]} />
      <MedicalCart position={[5, 0.5, 18]} />
      <MedicalCart position={[-9, 0.5, -20]} />
      <MedicalCart position={[9, 0.5, 20]} />
      <MedicalCart position={[-20, 0.5, -18]} />

      <Locker position={[-10, 1, -20]} />
      <Locker position={[10, 1, 20]} />
      <Locker position={[-18, 1, 10]} />
      <Locker position={[-21, 1, 22]} />
      <Locker position={[21, 1, -10]} />
      <Locker position={[6, 1, -23]} />

      <BioTank position={[-14, 0, -10]} scale={1} />
      <BioTank position={[13, 0, 12]} scale={0.85} />
      <BioTank position={[-16, 0, 16]} scale={0.7} />
      <BioTank position={[18, 0, 8]} scale={1.2} />

      <PipeRun from={[-24.6, 0.3, -24]} to={[-24.6, 5, 24]} radius={0.13} emissive={0x00e5ff} />
      <PipeRun from={[24.6, 0.3, -24]} to={[24.6, 5, 24]} radius={0.13} emissive={0xff2d95} />
      <PipeRun from={[-24, 0.4, -24.6]} to={[24, 0.4, -24.6]} radius={0.1} emissive={0x2bff88} />
      <PipeRun from={[-24, 0.4, 24.6]} to={[24, 0.4, 24.6]} radius={0.1} emissive={0x2bff88} />

      <HangingWire position={[-8, 5.4, -18]} len={1.4} />
      <HangingWire position={[9, 5.4, 16]} len={2.1} />
      <HangingWire position={[0, 5.4, 4]} len={0.9} />
      <HangingWire position={[18, 5.4, 8]} len={1.6} />
      <HangingWire position={[-18, 5.4, -22]} len={1.2} />

      <BioStain position={[6, 1.4, -24.6]} scale={2} color="#1d5c33" />
      <BioStain position={[-10, 1.1, 24.6]} scale={2.6} color="#5c1d2a" />
      <BioStain position={[-24.6, 1.6, -4]} rotation={[0, Math.PI / 2, 0]} scale={2.2} color="#3a5c1d" />
      <BioStain position={[24.6, 1.6, 8]} rotation={[0, -Math.PI / 2, 0]} scale={2} color="#5c331d" />

      {/* Furniture colliders (player collision) */}
      <FurnitureColliders />
    </group>
  );
}

/* Register AABB colliders for major furniture so the player can't walk through */
function FurnitureColliders() {  useEffect(() => {
    // Reception desk
    registerCollider(-3, -2, 2.2, 0.9, 1.2);
    // Medical carts
    registerCollider(-5, -18, 0.7, 0.4, 1.0);
    registerCollider(5, 18, 0.7, 0.4, 1.0);
    registerCollider(-9, -20, 0.7, 0.4, 1.0);
    registerCollider(9, 20, 0.7, 0.4, 1.0);
    registerCollider(-20, -18, 0.7, 0.4, 1.0);
    // Lockers
    registerCollider(-10, -20, 0.6, 0.35, 2.1);
    registerCollider(10, 20, 0.6, 0.35, 2.1);
    registerCollider(-18, 10, 0.6, 0.35, 2.1);
    registerCollider(-21, 22, 0.6, 0.35, 2.1);
    registerCollider(21, -10, 0.6, 0.35, 2.1);
    registerCollider(6, -23, 0.6, 0.35, 2.1);
    // Bio tanks
    registerCollider(-14, -10, 0.9, 0.9, 2.2);
    registerCollider(13, 12, 0.8, 0.8, 2.0);
    registerCollider(-16, 16, 0.7, 0.7, 1.8);
    registerCollider(18, 8, 1.1, 1.1, 2.5);
    // Lab server racks
    for (let i = 0; i < 4; i++) {
      registerCollider(14, -4 + i * 4, 0.7, 0.4, 2.5);
      registerCollider(30, -4 + i * 4, 0.7, 0.4, 2.5);
    }
    // Lab boss platform
    registerCollider(22, 8, 5, 5, 0.7);
    // Boss cryo pods
    registerCollider(22, 0, 1.0, 1.0, 2.4);
    registerCollider(22, 16, 1.0, 1.0, 2.4);
  }, []);
  return null;
}

/* Interactive weapon pickup (pistol etc.) */
function WeaponPickup({ weapon, position }: {
  weapon: 'pistol' | 'shotgun';
  position: [number, number, number];
}) {
  const { addWeapon, setCurrentWeapon, setInteractionPrompt, reloadWeapon } = useGameStore();
  const meshRef = useRef<THREE.Group | null>(null);
  const picked = useRef(false);
  const names: Record<string, string> = { pistol: '手枪', shotgun: '霰弹枪' };

  useFrame(() => {
    if (picked.current) return;
    const t = ambientEvents.time;
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(t * 1.5) * 0.06;
      meshRef.current.rotation.y = t * 0.5;
    }
    const playerPos = useGameStore.getState().playerPosition;
    const dist = Math.hypot(playerPos.x - position[0], playerPos.z - position[2]);
    if (dist < 1.5) {
      const store = useGameStore.getState();
      if (!store.interactionPrompt || !store.interactionPrompt.title.includes('拾取')) {
        setInteractionPrompt({ title: `🔫 拾取${names[weapon]}`, description: '拾取 (E)' });
      }
    }
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && !picked.current) {
        const playerPos = useGameStore.getState().playerPosition;
        if (Math.hypot(playerPos.x - position[0], playerPos.z - position[2]) < 1.5) {
          picked.current = true;
          addWeapon(weapon);
          reloadWeapon(weapon); // fill magazine
          setCurrentWeapon(weapon);
          playWeaponPickupSound();
          setInteractionPrompt({
            title: `✅ 获得：${names[weapon]}`,
            description: '按 1/2 切换武器',
          });
          setTimeout(() => setInteractionPrompt(null), 3000);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [weapon]);

  return (
    <group position={position}>
      <group ref={meshRef}>
        <mesh castShadow>
          <boxGeometry args={[0.12, 0.18, 0.34]} />
          <meshStandardMaterial color={0x1a1a2a} metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.06, 0]}> 
          <boxGeometry args={[0.08, 0.1, 0.05]} />
          <meshStandardMaterial color={0x2a2a3a} metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
      <pointLight position={[0, 0.1, 0]} color={0xffaa44} intensity={4} distance={3} decay={2} />
    </group>
  );
}

function playWeaponPickupSound() {
  dzSound.pickup();
}

/* ============ ZONE DEFINITIONS ============ */

function ZoneLobby() {
  return (
    <group>
      {/* Neon accent on lobby walls */}
      <NeonEdge position={[-14.9, 0.12, -15]} length={10} color={0x00e5ff} intensity={1.5} />
      <NeonEdge position={[14.9, 0.12, -15]} length={10} color={0xff2d95} intensity={1.5} />
      <NeonEdge position={[-14.9, 0.12, 15]} length={10} color={0x2bff88} intensity={1.5} />
      <NeonEdge position={[14.9, 0.12, 15]} length={10} color={0x2bff88} intensity={1.5} />
    </group>
  );
}

function ZoneEmergency() {
  return (
    <group>
      {/* Fuse box alcove indicator */}
      <NeonEdge position={[-19.1, 0.12, -25]} rotation={[0, Math.PI / 2, 0]} length={10} color={0xff2d95} intensity={1.5} />
      <SignText text="配电室" position={[-18.5, 3.6, -24.5]} width={4} height={1.2} color="#ff2d95" />
    </group>
  );
}

function ZoneSurgery() {
  return (
    <group>
      {/* Surgical light fixture (ceiling) */}
      <mesh position={[0, 5.3, 22]}>
        <cylinderGeometry args={[0.8, 0.8, 0.15, 16]} />
        <meshStandardMaterial color={0x2a2a2a} roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 5.15, 22]}>
        <cylinderGeometry args={[0.7, 0.7, 0.05, 16]} />
        <meshStandardMaterial color={0x0a0a0a} emissive={0xffeedd} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 5.1, 22]} intensity={40} color={0xfff5e0} decay={2} distance={20} />

      {/* Operating table */}
      <StaticBlock position={[0, 0.55, 22]} size={[2.2, 0.5, 0.8]} color={0x3a3a4a} />
      <mesh position={[0, 0.35, 22]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.15, 0.8]} />
        <meshStandardMaterial color={0x4a4a5a} roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.72, 22]} castShadow>
        <planeGeometry args={[1.8, 0.6]} />
        <meshBasicMaterial color={0x113322} toneMapped={false} />
      </mesh>

      <NeonEdge position={[-19.1, 0.12, 25]} rotation={[0, Math.PI / 2, 0]} length={10} color={0x2bff88} intensity={1.5} />
    </group>
  );
}

function ZoneUndergroundLab() {
  return (
    <group>
      {/* Lab walls already placed (green-tinted) in CyberHospital */}

      {/* Server racks */}
      {[...Array(4)].map((_, i) => (
        <mesh key={i} position={[14, 1.2, -4 + i * 4]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 2.4, 0.6]} />
          <meshStandardMaterial color={0x0d1a0d} roughness={0.3} metalness={0.7} />
        </mesh>
      ))}
      {[...Array(4)].map((_, i) => (
        <mesh key={i} position={[30, 1.2, -4 + i * 4]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 2.4, 0.6]} />
          <meshStandardMaterial color={0x0d1a0d} roughness={0.3} metalness={0.7} />
        </mesh>
      ))}

      {/* Cryo pods along center */}
      <BioTank position={[22, 0, 0]} scale={1.3} />
      <BioTank position={[22, 0, 16]} scale={1.3} />

      {/* Boss arena center platform */}
      <mesh position={[22, 0.3, 8]} castShadow receiveShadow>
        <cylinderGeometry args={[5, 5, 0.6, 16]} />
        <meshStandardMaterial color={0x051008} roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Neon trims for lab - green */}
      <NeonEdge position={[11.6, 0.12, 8]} length={30} color={0x2bff88} intensity={2} />
      <NeonEdge position={[18.5, 0.12, -7.6]} length={13} color={0x2bff88} intensity={2} />
      <NeonEdge position={[18.5, 0.12, 23.6]} length={13} color={0x2bff88} intensity={2} />

      {/* EXIT sign at lab north wall */}
      <SignText text="EXIT 出口" position={[18.5, 4.0, 22.6]} width={6} height={1.6} color="#2bff88" />
    </group>
  );
}

/* ============ SHARED COMPONENTS ============ */

function BioStain({ position, rotation = [0, 0, 0], scale = 2, color = 0x1d5c33 }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color?: number | string;
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
      <meshBasicMaterial map={tex} color={color as number} transparent depthWrite={false} toneMapped={false} />
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
        <meshStandardMaterial color={0x223344} emissive={0x00e5ff} emissiveIntensity={0.5} toneMapped={false} />
      </mesh>
      <mesh position={[0.8, 1.15, 0]} castShadow>
        <boxGeometry args={[0.7, 0.55, 0.5]} />
        <meshStandardMaterial color={0x0a0a0f} roughness={0.3} metalness={0.3} />
      </mesh>
      <mesh position={[0.8, 1.16, 0.27]}>
        <planeGeometry args={[0.55, 0.4]} />
        <meshBasicMaterial color={0x00ffcc} toneMapped={false} />
      </mesh>
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
          <meshStandardMaterial color={0x111111} roughness={0.8} metalness={0.2} />
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

function CeilingLight({ position }: { position: [number, number, number] }) {
  const flicker = useRef(0);
  const lightRef = useRef<THREE.PointLight | null>(null);
  const panelRef = useRef<THREE.MeshStandardMaterial | null>(null);

  useFrame(() => {
    if (lightRef.current) {
      flicker.current += 0.05;
      const t = ambientEvents.time;
      const seed = position[0] * 7 + position[2] * 13;
      const base = 0.92 + 0.08 * Math.sin(flicker.current + seed);
      const blip = Math.sin(Math.floor(t * 8 + seed) * 12.9898) > 0.998 ? 0.25 : 1;
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
      <mesh position={[0, -0.09, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.04, 16]} />
        <meshStandardMaterial ref={panelRef} color={0x0a0a0a} emissive={0xddeeff} emissiveIntensity={1} toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} position={[0, -0.1, 0]} intensity={30} color={0xdfeaff} decay={2} distance={25} />
    </group>
  );
}

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
