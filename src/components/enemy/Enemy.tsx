import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import { useGameStore } from '../../stores/gameStore';
import type { EnemyConfig, EnemyState, Vector3 } from '../../types/game';

interface EnemyProps {
  enemyType: string;
  initialPosition: [number, number, number];
  initialRotation: [number, number, number];
  patrolPoints?: [number, number, number][];
  playerPosition: Vector3;
}

// Enemy configurations
const enemyConfigs: Record<string, EnemyConfig> = {
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
};

export function Enemy({ 
  enemyType, 
  initialPosition, 
  initialRotation, 
  patrolPoints, 
  playerPosition 
}: EnemyProps) {
  const { scene } = useThree();
  const config = enemyConfigs[enemyType] || enemyConfigs.nurse;
  const takeDamage = useGameStore((s) => s.takeDamage);
  
  // State
  const state = useRef<EnemyState>('patrol');
  const health = useRef(config.health);
  const currentPatrolIndex = useRef(0);
  const lastAttackTime = useRef(0);
  const lastKnownPlayerPos = useRef<THREE.Vector3 | null>(null);
  const searchTimer = useRef(0);
  const stunTimer = useRef(0);
  
  // Refs for physics
  const rigidBodyRef = useRef<any>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  
  // Velocity for movement
  const velocity = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3(...initialPosition));
  
  // Model loading is deferred until GLB assets are added — using capsule placeholder for now
  const modelScene = null;
  const animations: unknown[] = [];
  
  // Placeholder enemy body (real GLB model replaces this when assets are available)

  // Animation helper
  const playAnimation = (name: string, crossFade = 0.2) => {
    if (!mixerRef.current) return;
    
    const action = actionsRef.current[name];
    if (!action) return;
    
    // Crossfade from current action
    Object.values(actionsRef.current).forEach((a) => {
      if (a.isRunning()) {
        a.fadeOut(crossFade);
      }
    });
    
    action.reset().fadeIn(crossFade).play();
  };

  // AI State Machine
  const updateAI = (delta: number) => {
    if (health.current <= 0) {
      if (state.current !== 'die') {
        state.current = 'die';
        playAnimation('die', 0.3);
      }
      return;
    }

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
    
    // Check if player is in vision cone
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(...initialRotation));
    const dot = forward.dot(directionToPlayer);
    const inVisionCone = dot > Math.cos(config.visionAngle / 2);
    const canSeePlayer = distanceToPlayer < config.visionRange && inVisionCone;
    
    // Check if player is in hearing range (making noise)
    const playerMakingNoise = false; // TODO: implement player noise system
    const canHearPlayer = distanceToPlayer < config.hearingRange && playerMakingNoise;

    // Raycast to check line of sight
    let hasLineOfSight = false;
    if (canSeePlayer) {
      const raycaster = new THREE.Raycaster(enemyPos.clone(), directionToPlayer, 0, distanceToPlayer);
      raycaster.layers.enable(1); // Environment layer
      const intersects = raycaster.intersectObjects(scene.children, true);
      hasLineOfSight = intersects.length === 0 || intersects[0].distance > distanceToPlayer;
    }

    // State transitions
    switch (state.current) {
      case 'patrol':
        if (hasLineOfSight && canSeePlayer) {
          state.current = 'see';
          lastKnownPlayerPos.current = new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
          playAnimation('run');
        } else if (canHearPlayer) {
          state.current = 'hear';
          lastKnownPlayerPos.current = new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
          playAnimation('walk');
        } else {
          // Patrol behavior
          patrol(delta);
        }
        break;

      case 'hear':
        if (hasLineOfSight && canSeePlayer) {
          state.current = 'see';
          lastKnownPlayerPos.current = new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
          playAnimation('run');
        } else if (lastKnownPlayerPos.current) {
          // Move toward last known position
          moveTowards(lastKnownPlayerPos.current, config.speed * 0.7, delta);
          
          // Check if reached last known position
          const toLastKnown = lastKnownPlayerPos.current.clone().sub(enemyPos);
          if (toLastKnown.length() < 1) {
            state.current = 'search';
            searchTimer.current = 5; // Search for 5 seconds
            playAnimation('idle');
          }
        } else {
          state.current = 'patrol';
        }
        break;

      case 'see':
        if (hasLineOfSight && canSeePlayer) {
          // Chase player
          lastKnownPlayerPos.current = new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
          moveTowards(lastKnownPlayerPos.current, config.speed, delta);
          
          // Attack if in range
          if (distanceToPlayer < config.attackRange) {
            state.current = 'attack';
          }
        } else {
          // Lost sight of player
          state.current = 'search';
          searchTimer.current = 5;
          playAnimation('walk');
        }
        break;

      case 'chase':
        if (lastKnownPlayerPos.current) {
          moveTowards(lastKnownPlayerPos.current, config.speed, delta);
          const toTarget = lastKnownPlayerPos.current.clone().sub(enemyPos);
          if (toTarget.length() < 1) {
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
          playAnimation('attack', 0.1);
          
          // Deal damage if still in range
          if (distanceToPlayer < config.attackRange + 0.5) {
            takeDamage(config.damage);
          }
        }
        
        // Face player during attack
        const lookTarget = new THREE.Vector3(playerPosition.x, enemyPos.y, playerPosition.z);
        const quat = new THREE.Quaternion();
        const dir = lookTarget.clone().sub(enemyPos).normalize();
        quat.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
        rigidBodyRef.current?.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }, true);
        
        if (distanceToPlayer > config.attackRange) {
          state.current = 'see';
          playAnimation('run');
        }
        break;

      case 'search':
        searchTimer.current -= delta;
        // Look around
        if (modelRef.current) {
          modelRef.current.rotation.y += delta * 0.5;
        }
        
        if (searchTimer.current <= 0) {
          if (canHearPlayer) {
            state.current = 'hear';
          } else {
            state.current = 'patrol';
            currentPatrolIndex.current = 0;
          }
        }
        break;

      case 'die':
        // Disable physics and remove after delay
        if (rigidBodyRef.current) {
          rigidBodyRef.current.setEnabled(false);
        }
        break;
    }
  };

  // Patrol behavior
  const patrol = (delta: number) => {
    if (!patrolPoints || patrolPoints.length === 0) {
      playAnimation('idle');
      return;
    }

    const target = patrolPoints[currentPatrolIndex.current];
    const _t = rigidBodyRef.current?.translation();
    const enemyPos = _t ? new THREE.Vector3(_t.x, _t.y, _t.z) : new THREE.Vector3(...initialPosition);
    const toTarget = new THREE.Vector3(target[0], target[1], target[2]).sub(enemyPos);
    toTarget.y = 0;
    
    if (toTarget.length() < 1) {
      currentPatrolIndex.current = (currentPatrolIndex.current + 1) % patrolPoints.length;
      playAnimation('idle');
      // Wait a bit at patrol point
      setTimeout(() => {}, 2000);
    } else {
      moveTowards(new THREE.Vector3(target[0], target[1], target[2]), config.speed * 0.5, delta);
      playAnimation('walk');
    }
  };

  // Move towards target
  const moveTowards = (target: THREE.Vector3, speed: number, delta: number) => {
    const _t = rigidBodyRef.current?.translation();
    const enemyPos = _t ? new THREE.Vector3(_t.x, _t.y, _t.z) : new THREE.Vector3(...initialPosition);
    const direction = target.clone().sub(enemyPos);
    direction.y = 0;
    direction.normalize();
    
    velocity.current.x = direction.x * speed;
    velocity.current.z = direction.z * speed;
    
    // Apply to rigid body
    if (rigidBodyRef.current) {
      rigidBodyRef.current.setLinvel({ x: velocity.current.x, y: 0, z: velocity.current.z }, true);
      
      // Rotate to face movement direction
      const quat = new THREE.Quaternion();
      quat.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
      rigidBodyRef.current.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }, true);
    }
  };

  // Physics update
  useFrame((_, delta) => {
    if (health.current <= 0) return;
    
    updateAI(delta);
    
    // Update animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    
    // Sync model position with physics body
    if (rigidBodyRef.current && modelRef.current) {
      const pos = rigidBodyRef.current.translation();
      const rot = rigidBodyRef.current.rotation();
      modelRef.current.position.set(pos.x, pos.y, pos.z);
      modelRef.current.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    }
  });

  // Public methods for external interaction
  const takeDamageRef = useRef((amount: number, stunDuration = 0) => {
    health.current -= amount;
    if (health.current > 0) {
      stunTimer.current = stunDuration;
      playAnimation('attack', 0.1); // Hit reaction
    }
  });

  // Expose methods via ref (for weapon system)
  useEffect(() => {
    // Register enemy for targeting
    return () => {
      // Cleanup
    };
  }, []);

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicVelocityBased"
      position={initialPosition}
      rotation={initialRotation}
    >
      <CapsuleCollider args={[0.6, 0.4]} />
      <group ref={modelRef} name={enemyType}>
        {/* Body — placeholder until GLB models are added */}
        <mesh castShadow position={[0, 1, 0]}>
          <capsuleGeometry args={[0.4, 1.2, 8, 16]} />
          <meshStandardMaterial color={0x2a2030} roughness={0.7} metalness={0.1} />
        </mesh>
        {/* Head */}
        <mesh castShadow position={[0, 2.05, 0]}>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshStandardMaterial color={0x8a9a9a} roughness={0.6} metalness={0.2} />
        </mesh>
        {/* Eyes — glowing red (biohazard vibe) */}
        <mesh position={[0.12, 2.05, 0.22]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color={0xff2222} />
        </mesh>
        <mesh position={[-0.12, 2.05, 0.22]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color={0xff2222} />
        </mesh>
      </group>
    </RigidBody>
  );
}

// Simple placeholder enemy until models are loaded
export function EnemyPlaceholder({ 
  enemyType, 
  initialPosition, 
  initialRotation, 
  patrolPoints, 
  playerPosition 
}: EnemyProps) {
  const config = enemyConfigs[enemyType] || enemyConfigs.nurse;
  const state = useRef<EnemyState>('patrol');
  const health = useRef(config.health);
  const currentPatrolIndex = useRef(0);
  const lastAttackTime = useRef(0);
  const velocity = useRef(new THREE.Vector3());
  
  const { scene } = useThree();
  const takeDamage = useGameStore((s) => s.takeDamage);
  
  // Simple AI similar to above but without animations
  useFrame((_, delta) => {
    if (health.current <= 0) return;
    
    // ... simplified AI logic
    
    // Visual representation
  });

  return (
    <RigidBody
      type="kinematicVelocityBased"
      position={initialPosition}
      rotation={initialRotation}
    >
      <CapsuleCollider args={[0.6, 0.4]} />
      <group name={enemyType}>
        {/* Body */}
        <mesh castShadow receiveShadow position={[0, 1, 0]}>
          <capsuleGeometry args={[0.4, 1.2, 8, 16]} />
          <meshStandardMaterial 
            color={enemyType === 'nurse' ? 0xcc4444 : 0x44cc44} 
            roughness={0.8} 
            metalness={0.1}
            emissive={enemyType === 'nurse' ? 0x330000 : 0x003300}
            emissiveIntensity={0.2}
          />
        </mesh>
        {/* Head */}
        <mesh castShadow receiveShadow position={[0, 1.8, 0]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial 
            color={enemyType === 'nurse' ? 0xdd6666 : 0x66dd66} 
            roughness={0.7} 
            metalness={0.1}
            emissive={enemyType === 'nurse' ? 0x440000 : 0x004400}
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Eyes - glowing */}
        <mesh position={[-0.12, 1.85, 0.3]} castShadow>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshBasicMaterial color={0xff0000} />
        </mesh>
        <mesh position={[0.12, 1.85, 0.3]} castShadow>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshBasicMaterial color={0xff0000} />
        </mesh>
      </group>
    </RigidBody>
  );
}
