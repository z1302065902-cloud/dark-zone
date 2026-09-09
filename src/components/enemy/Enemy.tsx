import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import { useGameStore } from '../../stores/gameStore';
import { dzSound } from '../AudioManager';
import type { EnemyConfig, EnemyState, Vector3 } from '../../types/game';

interface EnemyProps {
  enemyType: string;
  initialPosition: [number, number, number];
  initialRotation: [number, number, number];
  patrolPoints?: [number, number, number][];
  playerPosition: Vector3;
  /** Boss enemies complete the defeat_boss objective on death */
  boss?: boolean;
  /** unique instance id (debug registry) */
  id?: string;
}

// Enemy configurations
export const enemyConfigs: Record<string, EnemyConfig> = {
  nurse: {
    type: 'nurse',
    name: '病房护士',
    health: 80,
    damage: 15,
    speed: 3.5,
    hearingRange: 15,
    visionRange: 20,
    visionAngle: Math.PI / 3, // 60 degrees
    attackRange: 2,
    attackCooldown: 1.5,
    modelPath: '/models/enemies/nurse.glb',
    animations: {
      idle: '/models/enemies/nurse_idle.glb',
      walk: '/models/enemies/nurse_walk.glb',
      run: '/models/enemies/nurse_run.glb',
      attack: '/models/enemies/nurse_attack.glb',
      die: '/models/enemies/nurse_die.glb',
    },
  },
  patient: {
    type: 'patient',
    name: '实验体',
    health: 50,
    damage: 10,
    speed: 4.5,
    hearingRange: 10,
    visionRange: 15,
    visionAngle: Math.PI / 2,
    attackRange: 1.8,
    attackCooldown: 1,
    modelPath: '/models/enemies/patient.glb',
    animations: {
      idle: '/models/enemies/patient_idle.glb',
      walk: '/models/enemies/patient_walk.glb',
      run: '/models/enemies/patient_run.glb',
      attack: '/models/enemies/patient_attack.glb',
      die: '/models/enemies/patient_die.glb',
    },
  },
  butcher: {
    type: 'butcher',
    name: '地铁屠夫',
    health: 200,
    damage: 30,
    speed: 5,
    hearingRange: 20,
    visionRange: 25,
    visionAngle: Math.PI / 2.5,
    attackRange: 3,
    attackCooldown: 2,
    modelPath: '/models/enemies/butcher.glb',
    animations: {
      idle: '/models/enemies/butcher_idle.glb',
      walk: '/models/enemies/butcher_walk.glb',
      run: '/models/enemies/butcher_run.glb',
      attack: '/models/enemies/butcher_attack.glb',
      die: '/models/enemies/butcher_die.glb',
    },
  },
  // 0.1 Boss: Nurse-07 — biopunk boss of the underground lab
  nurse07: {
    type: 'nurse07',
    name: '护士-07',
    health: 400,
    damage: 22,
    speed: 4.2,
    hearingRange: 30,
    visionRange: 35,
    visionAngle: Math.PI / 2.2,
    attackRange: 2.5,
    attackCooldown: 1.4,
    modelPath: '/models/enemies/nurse07.glb',
    animations: {
      idle: '/models/enemies/nurse07_idle.glb',
      walk: '/models/enemies/nurse07_walk.glb',
      run: '/models/enemies/nurse07_run.glb',
      attack: '/models/enemies/nurse07_attack.glb',
      die: '/models/enemies/nurse07_die.glb',
    },
  },
};

/* ------------------------------------------------------------------
   Debug registry — lets automated tests (and later save systems)
   inspect live enemy state. Enabled only when the page was loaded
   with ?debug=1, otherwise a tiny no-op.
   ------------------------------------------------------------------ */
type RegistryEntry = {
  id: string;
  type: string;
  boss: boolean;
  health: () => number;
  state: () => string;
  position: () => { x: number; y: number; z: number };
  takeDamage: (d: number, s?: number) => void;
};
const registryEnabled = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
const enemyRegistry: RegistryEntry[] = [];
if (registryEnabled) (window as any).__dzEnemies = enemyRegistry;
let enemyCounter = 0;

export function Enemy({
  enemyType,
  initialPosition,
  initialRotation,
  patrolPoints,
  playerPosition,
  boss = false,
  id = `enemy_${enemyCounter++}`,
}: EnemyProps) {
  const { scene } = useThree();
  const config = enemyConfigs[enemyType] || enemyConfigs.nurse;
  const takeDamage = useGameStore((s) => s.takeDamage);
  const setBossActive = useGameStore((s) => s.setBossActive);
  const setBossHealth = useGameStore((s) => s.setBossHealth);

  // State
  const state = useRef<EnemyState>('patrol');
  const health = useRef(config.health);
  const currentPatrolIndex = useRef(0);
  const lastAttackTime = useRef(0);
  const lastKnownPlayerPos = useRef<THREE.Vector3 | null>(null);
  const searchTimer = useRef(0);
  const stunTimer = useRef(0);
  const flashTimer = useRef(0);
  const dead = useRef(false);
  const deathT = useRef(0);
  const bossDefeated = useRef(false);
  const bossActive = useRef(false);

  // Refs for physics
  const rigidBodyRef = useRef<RapierRigidBody | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});

  // Velocity for movement
  const velocity = useRef(new THREE.Vector3());

  // Placeholder materials (real GLB model replaces these when assets are available)
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: boss ? 0x1a2b2b : enemyType === 'nurse' ? 0x2a2030 : 0x20302a,
    roughness: 0.7,
    metalness: 0.25,
    emissive: 0x330000,
    emissiveIntensity: 0.15,
  }), [boss, enemyType]);
  const headMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: boss ? 0x8a9a9a : 0x8a9a9a,
    roughness: 0.6,
    metalness: 0.2,
  }), [boss]);
  const eyeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xff2222 }), []);
  const bossPlateMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x442200, roughness: 0.5, metalness: 0.8, emissive: 0x220000, emissiveIntensity: 0.3,
  }), []);

  // Animation helper (no-op until GLB animations exist)
  const playAnimation = (_name: string, _crossFade = 0.2) => {
    if (!mixerRef.current) return;
    const action = actionsRef.current[_name];
    if (!action) return;
    Object.values(actionsRef.current).forEach((a) => {
      if (a.isRunning()) a.fadeOut(_crossFade);
    });
    action.reset().fadeIn(_crossFade).play();
  };

  // AI State Machine
  const updateAI = (delta: number) => {
    if (health.current <= 0) return;

    if (stunTimer.current > 0) {
      stunTimer.current -= delta;
      return;
    }

    const _t = rigidBodyRef.current?.translation();
    const enemyPos = _t ? new THREE.Vector3(_t.x, _t.y, _t.z) : new THREE.Vector3(...initialPosition);
    const toPlayer = new THREE.Vector3()
      .copy(new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z))
      .sub(enemyPos);

    const distanceToPlayer = toPlayer.length();
    const directionToPlayer = toPlayer.normalize();

    // Vision cone (uses current facing direction of the physics body)
    const bodyRot = rigidBodyRef.current?.rotation() || { x: 0, y: 0, z: 0, w: 1 };
    const facing = new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion(bodyRot.x, bodyRot.y, bodyRot.z, bodyRot.w));
    const dot = facing.dot(directionToPlayer);
    const inVisionCone = dot > Math.cos(config.visionAngle / 2);
    const canSeePlayer = distanceToPlayer < config.visionRange && inVisionCone;

    // Hearing — consume noise events from the bus (fired by sprint/shooting/doors)
    const hearRadius = canHearNoise(enemyPos);

    // Raycast to check line of sight
    let hasLineOfSight = false;
    if (canSeePlayer) {
      const raycaster = new THREE.Raycaster(enemyPos.clone(), directionToPlayer, 0, distanceToPlayer);
      const intersects = raycaster.intersectObjects(scene.children, true);
      hasLineOfSight = intersects.length === 0 || intersects[0].distance > distanceToPlayer;
    }

    switch (state.current) {
      case 'patrol':
        if (hasLineOfSight && canSeePlayer) {
          state.current = 'see';
          lastKnownPlayerPos.current = new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
          dzSound.growl('see');
        } else if (hearRadius > 0) {
          state.current = 'hear';
          lastKnownPlayerPos.current = new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
        } else {
          patrol(delta);
        }
        break;

      case 'hear':
        if (hasLineOfSight && canSeePlayer) {
          state.current = 'see';
          lastKnownPlayerPos.current = new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
          dzSound.growl('see');
        } else if (lastKnownPlayerPos.current) {
          moveTowards(lastKnownPlayerPos.current, config.speed * 0.7, delta);
          if (lastKnownPlayerPos.current.distanceTo(enemyPos) < 1) {
            state.current = 'search';
            searchTimer.current = 5;
          }
        } else {
          state.current = 'patrol';
        }
        break;

      case 'see':
        if (hasLineOfSight && canSeePlayer) {
          lastKnownPlayerPos.current = new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
          moveTowards(lastKnownPlayerPos.current, config.speed, delta);
          if (distanceToPlayer < config.attackRange) {
            state.current = 'attack';
            dzSound.growl('attack');
          }
        } else {
          state.current = 'search';
          searchTimer.current = 5;
        }
        break;

      case 'chase':
        if (lastKnownPlayerPos.current) {
          moveTowards(lastKnownPlayerPos.current, config.speed, delta);
          if (lastKnownPlayerPos.current.distanceTo(enemyPos) < 1) {
            state.current = 'search';
            searchTimer.current = 5;
          }
        } else {
          state.current = 'patrol';
        }
        break;

      case 'attack':
        const now = performance.now() / 1000;
        if (now - lastAttackTime.current >= config.attackCooldown) {
          lastAttackTime.current = now;
          // Damage if player still in range
          const playerDist = new THREE.Vector3(playerPosition.x, enemyPos.y, playerPosition.z).distanceTo(enemyPos);
          if (playerDist < config.attackRange + 0.7) {
            takeDamage(config.damage);
            window.dispatchEvent(new CustomEvent('dz:player-hit', { detail: config.damage }));
          }
        }
        if (distanceToPlayer > config.attackRange) {
          state.current = 'see';
        }
        break;

      case 'search':
        searchTimer.current -= delta;
        // Scan: rotate in place, occasionally move toward last known pos
        if (modelRef.current) {
          modelRef.current.rotation.y += delta * 0.5;
        }
        if (searchTimer.current <= 0) {
          if (hearRadius > 0) state.current = 'hear';
          else {
            state.current = 'patrol';
            currentPatrolIndex.current = 0;
          }
        }
        break;

      case 'die':
        break;
    }
  };

  // Patrol behavior
  const patrolWait = useRef(0);
  const patrol = (delta: number) => {
    if (!patrolPoints || patrolPoints.length === 0) {
      playAnimation('idle');
      return;
    }
    if (patrolWait.current > 0) {
      patrolWait.current -= delta;
      return;
    }

    const _t = rigidBodyRef.current?.translation();
    const enemyPos = _t ? new THREE.Vector3(_t.x, _t.y, _t.z) : new THREE.Vector3(...initialPosition);
    const target = patrolPoints[currentPatrolIndex.current];
    const toTarget = new THREE.Vector3(target[0], target[1], target[2]).sub(enemyPos);
    toTarget.y = 0;

    if (toTarget.length() < 1) {
      currentPatrolIndex.current = (currentPatrolIndex.current + 1) % patrolPoints.length;
      patrolWait.current = 2; // wait 2s at patrol point
    } else {
      moveTowards(new THREE.Vector3(target[0], target[1], target[2]), config.speed * 0.5, delta);
    }
  };

  // Move towards target (kinematic velocity)
  const moveTowards = (target: THREE.Vector3, speed: number, delta: number) => {
    const _t = rigidBodyRef.current?.translation();
    const enemyPos = _t ? new THREE.Vector3(_t.x, _t.y, _t.z) : new THREE.Vector3(...initialPosition);
    const direction = target.clone().sub(enemyPos);
    direction.y = 0;
    if (direction.lengthSq() < 0.01) {
      rigidBodyRef.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }
    direction.normalize();

    velocity.current.x = direction.x * speed;
    velocity.current.z = direction.z * speed;

    if (rigidBodyRef.current) {
      rigidBodyRef.current.setLinvel({ x: velocity.current.x, y: 0, z: velocity.current.z }, true);
      const quat = new THREE.Quaternion();
      quat.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
      rigidBodyRef.current.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }, true);
    }
  };

  // Physics update + visual feedback
  useFrame((_, delta) => {
    // Death sequence: sink + fade, then remove
    if (dead.current) {
      deathT.current += delta / 1.4;
      const t = Math.min(1, deathT.current);
      if (modelRef.current) {
        modelRef.current.position.y = -t * 1.2;
      }
      bodyMat.opacity = 1 - t;
      headMat.opacity = 1 - t;
      bossPlateMat.opacity = 1 - t;
      if (t >= 1) {
        modelRef.current?.traverse((o) => { o.visible = false; });
        rigidBodyRef.current?.setEnabled(false);
      }
      return;
    }

    // Hit flash decay
    if (flashTimer.current > 0) {
      flashTimer.current -= delta;
      const k = Math.max(0, flashTimer.current / 0.15);
      bodyMat.emissiveIntensity = 0.15 + k * 3.5;
      bodyMat.emissive.setHex(0xff2200);
      if (flashTimer.current <= 0) {
        bodyMat.emissiveIntensity = 0.15;
        bodyMat.emissive.setHex(0x330000);
      }
    }

    // Eye glow by state (alert = bright red)
    if (state.current === 'patrol') eyeMat.color.setHex(0x551111);
    else eyeMat.color.setHex(0xff2222);

    updateAI(delta);

    if (mixerRef.current) mixerRef.current.update(delta);

    // Sync model rotation with physics body (position is handled by the
    // RigidBody parent — never double-apply it as a local offset)
    if (rigidBodyRef.current && modelRef.current) {
      const rot = rigidBodyRef.current.rotation();
      modelRef.current.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    }
  });

  // Public damage method
  const takeDamageRef = useRef((amount: number, stunDuration = 0) => {
    if (health.current <= 0 || dead.current) return;
    health.current = Math.max(0, health.current - amount);
    flashTimer.current = 0.15;

    if (health.current > 0) {
      stunTimer.current = stunDuration;
    } else {
      // Died
      dead.current = true;
      state.current = 'die';
      dzSound.enemyDeath();
      window.dispatchEvent(new CustomEvent('dz:enemy-killed', { detail: { boss, type: enemyType } }));
      if (boss && !bossDefeated.current) {
        bossDefeated.current = true;
        useGameStore.getState().completeObjective('defeat_boss');
        useGameStore.getState().setBossActive(false);
      }
    }

    // Sync boss HP bar
    if (boss && bossActive.current) {
      setBossHealth(health.current);
    }
  });

  // Registry + boss activation
  useEffect(() => {
    if (boss && !bossActive.current) {
      bossActive.current = true;
      setBossActive(true, health.current, config.health);
    }
    if (registryEnabled) {
      const entry: RegistryEntry = {
        id, type: enemyType, boss,
        health: () => health.current,
        state: () => state.current,
        position: () => {
          const p = modelRef.current?.getWorldPosition(new THREE.Vector3());
          const t = rigidBodyRef.current?.translation();
          return {
            x: p ? p.x : 0, y: p ? p.y : 0, z: p ? p.z : 0,
            bodyY: t ? t.y : 0,
          };
        },
        takeDamage: (d, s) => takeDamageRef.current(d, s),
      };
      enemyRegistry.push(entry);
      return () => {
        const i = enemyRegistry.indexOf(entry);
        if (i >= 0) enemyRegistry.splice(i, 1);
      };
    }
  }, [boss, enemyType, id, config.health, setBossActive]);

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicVelocity"
      position={initialPosition}
      rotation={initialRotation}
    >
      <CapsuleCollider args={[0.6, 0.4]} />
      <group
        ref={modelRef}
        name={enemyType}
        userData={{ takeDamage: (amount: number, stun: number) => takeDamageRef.current(amount, stun) }}
      >
        {/* Body — bio-mechanical placeholder until GLB assets */}
        <mesh castShadow position={[0, 0, 0]}>
          <capsuleGeometry args={[0.38, 1.5, 8, 16]} />
          <primitive attach="material" object={bodyMat} />
        </mesh>
        {/* Head */}
        <mesh castShadow position={[0, 1.05, 0]}>
          <sphereGeometry args={[0.28, 16, 16]} />
          <primitive attach="material" object={headMat} />
        </mesh>
        {/* Eyes — glowing red (biohazard vibe) */}
        <mesh position={[0.12, 1.05, 0.22]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <primitive attach="material" object={eyeMat} />
        </mesh>
        <mesh position={[-0.12, 1.05, 0.22]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <primitive attach="material" object={eyeMat} />
        </mesh>
        {/* Boss: armored plating + syringe arm */}
        {boss && (
          <group>
            <mesh castShadow position={[0.35, 0.3, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.35, 0.12, 0.3]} />
              <primitive attach="material" object={bossPlateMat} />
            </mesh>
            <mesh castShadow position={[-0.35, 0.3, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.35, 0.12, 0.3]} />
              <primitive attach="material" object={bossPlateMat} />
            </mesh>
            <mesh position={[0, 0.1, 0.35]}>
              <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
              <meshStandardMaterial color={0x666a7a} metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.5, 0.38]}>
              <coneGeometry args={[0.04, 0.15, 8]} />
              <meshStandardMaterial color={0xddeeff} metalness={0.1} roughness={0.15} />
            </mesh>
          </group>
        )}
      </group>
    </RigidBody>
  );
}

/* ------------------------------------------------------------------
   Noise bus — lightweight global event system so enemies can "hear".
   Components emit noise (footsteps, gunfire, doors); enemies within
   radius will transition to the 'hear' state.
   ------------------------------------------------------------------ */
type NoiseEvent = { x: number; z: number; radius: number; time: number };
const noiseEvents: NoiseEvent[] = [];
const NOISE_TTL = 2.5; // seconds a noise event lingers

export function emitNoise(x: number, z: number, radius: number) {
  noiseEvents.push({ x, z, radius, time: performance.now() / 1000 });
  if (noiseEvents.length > 64) noiseEvents.shift();
}

/** Returns the largest hear-radius that covers `pos`, or 0 */
function canHearNoise(pos: THREE.Vector3): number {
  const now = performance.now() / 1000;
  let best = 0;
  for (let i = noiseEvents.length - 1; i >= 0; i--) {
    const e = noiseEvents[i];
    if (now - e.time > NOISE_TTL) {
      noiseEvents.splice(i, 1);
      continue;
    }
    const dx = pos.x - e.x;
    const dz = pos.z - e.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < e.radius) best = Math.max(best, e.radius - d);
  }
  return best;
}
