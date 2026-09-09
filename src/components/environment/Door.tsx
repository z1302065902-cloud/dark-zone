import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useGameStore } from '../../stores/gameStore';
import { dzSound } from '../AudioManager';
import { ambientEvents } from './CyberDecor';
import { colliders, type BoxCollider } from './collision';

interface DoorProps {
  /** Unique door ID for save/load */
  doorId: string;
  /** Position in world space */
  position: [number, number, number];
  /** Rotation in radians [x, y, z] */
  rotation?: [number, number, number];
  /** Door type determines unlock requirement */
  type: 'keycard' | 'fuse' | 'key' | 'boss' | 'simple';
  /** Which zone this door leads to (for objective tracking) */
  leadsTo: string;
  /** Width/height of door opening */
  size?: [number, number];
  /** Initial state override */
  initiallyLocked?: boolean;
}

interface DoorState {
  openProgress: number; // 0 = closed, 1 = fully open
  targetProgress: number;
  interactionTimer: number;
}

export function Door({ 
  doorId, 
  position, 
  rotation = [0, 0, 0],
  type, 
  leadsTo, 
  size = [2.5, 3.5],
  initiallyLocked = true 
}: DoorProps) {
  const { scene } = useThree();
  const { 
    hasItem, 
    completeObjective, 
    completedObjectives,
    currentLevel,
    setInteractionPrompt 
  } = useGameStore();
  
  const doorRef = useRef<THREE.Group | null>(null);
  const frameRef = useRef<THREE.Mesh | null>(null);
  const leftDoorRef = useRef<THREE.Mesh | null>(null);
  const rightDoorRef = useRef<THREE.Mesh | null>(null);
  const lightRef = useRef<THREE.PointLight | null>(null);
  const lockLightRef = useRef<THREE.Mesh | null>(null);
  
  const [locked, setLocked] = useState(initiallyLocked);
  const [isOpen, setIsOpen] = useState(false);
  const state = useRef<DoorState>({
    openProgress: 0,
    targetProgress: 0,
    interactionTimer: 0,
  }).current;
  
  // Requirement mapping
  const requirements: Record<string, { item: string; objectiveId: string }> = {
    keycard: { item: 'keycard', objectiveId: 'unlock_emergency' },
    fuse: { item: 'fuse', objectiveId: 'restore_power' },
    key: { item: 'key', objectiveId: 'unlock_surgery' },
    boss: { item: 'master_key', objectiveId: 'enter_lab' },
  };
  
  const req = requirements[type] || { item: 'keycard', objectiveId: doorId };
  // Fuse-type doors open when power is restored (fusebox completed), NOT by holding a fuse
  const powerRestored = completedObjectives.includes('insert_fuse');
  const isUnlocked = type === 'fuse'
    ? powerRestored
    : (completedObjectives.includes(req.objectiveId) || !initiallyLocked);
  
  // Doorway collider for player (AABB registry) — active while locked & closed
  const doorCollider = useRef<BoxCollider | null>(null);
  useEffect(() => {
    const rotated = Math.abs(Math.round(rotation[1] / (Math.PI / 2))) % 2 === 1;
    const halfW = size[0] / 2;
    const halfD = 0.35;
    doorCollider.current = {
      minX: rotated ? position[0] - halfD : position[0] - halfW,
      maxX: rotated ? position[0] + halfD : position[0] + halfW,
      minZ: rotated ? position[2] - halfW : position[2] - halfD,
      maxZ: rotated ? position[2] + halfW : position[2] + halfD,
      minY: 0,
      maxY: size[1],
      active: initiallyLocked,
    };
    colliders.push(doorCollider.current);
    return () => {
      const idx = colliders.indexOf(doorCollider.current!);
      if (idx >= 0) colliders.splice(idx, 1);
    };
  }, []);
  
  // Check if player is near door
  const checkProximity = () => {
    const playerPos = useGameStore.getState().playerPosition;
    const dx = playerPos.x - position[0];
    const dz = playerPos.z - position[2];
    return Math.sqrt(dx * dx + dz * dz) < 2.5;
  };
  
  // Try to unlock
  const tryUnlock = () => {
    if (!locked) return false;
    
    // Fuse-type door: unlock triggered by power restored at fusebox
    if (type === 'fuse') {
      if (completedObjectives.includes('insert_fuse')) {
        setLocked(false);
        state.targetProgress = 1;
        completeObjective(req.objectiveId); // 'restore_power'
        if (lockLightRef.current) {
          (lockLightRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x00ff88);
        }
        playUnlockSound();
        setInteractionPrompt(null);
        return true;
      } else {
        setInteractionPrompt({
          title: '🔒 门已锁定',
          description: '需要：恢复急诊区电力',
        });
        playDenySound();
        return false;
      }
    }
    
    if (hasItem(req.item)) {
      setLocked(false);
      state.targetProgress = 1; // Auto-open after unlock
      completeObjective(req.objectiveId);
      
      // Visual feedback
      if (lockLightRef.current) {
        (lockLightRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x00ff88);
      }
      
      // Sound feedback (procedural)
      playUnlockSound();
      
      setInteractionPrompt(null);
      return true;
    } else {
      // Show what's needed
      const itemNames: Record<string, string> = {
        keycard: '门禁卡',
        fuse: '保险丝',
        key: '主钥匙',
        master_key: '实验室主钥匙',
      };
      setInteractionPrompt({
        title: '🔒 门已锁定',
        description: `需要：${itemNames[req.item] || req.item}`,
      });
      playDenySound();
      return false;
    }
  };
  
  useFrame(() => {
    const near = checkProximity();
    const store = useGameStore.getState();
    
    if (near && locked && !isUnlocked) {
      const itemNames: Record<string, string> = {
        keycard: '门禁卡 (E)',
        fuse: '恢复电力',
        key: '主钥匙 (E)',
        master_key: '实验室主钥匙 (E)',
      };
      if (!store.interactionPrompt || store.interactionPrompt.title.includes('门已锁定')) {
        setInteractionPrompt({
          title: '🔒 门已锁定',
          description: `需要：${itemNames[req.item] || req.item}`,
        });
      }
    } else if (near && (!locked || isUnlocked)) {
      if (state.openProgress < 0.9) {
        setInteractionPrompt({
          title: '🚪 门已解锁',
          description: '正在打开...',
        });
      } else {
        setInteractionPrompt(null);
      }
    } else if (store.interactionPrompt?.title?.includes('门')) {
      setInteractionPrompt(null);
    }
    
    // Animate door
    const speed = 3; // units per second
    if (state.openProgress < state.targetProgress) {
      state.openProgress = Math.min(state.targetProgress, state.openProgress + speed * 0.016);
    } else if (state.openProgress > state.targetProgress) {
      state.openProgress = Math.max(state.targetProgress, state.openProgress - speed * 0.016);
    }
    
    // Track open state for collider toggle (re-render only on threshold change)
    const nowOpen = state.openProgress > 0.5;
    if (nowOpen !== isOpen) setIsOpen(nowOpen);
    
    // Toggle player doorway collider
    if (doorCollider.current) {
      doorCollider.current.active = locked && !nowOpen;
    }
    
    // Apply to meshes
    if (leftDoorRef.current && rightDoorRef.current) {
      const angle = state.openProgress * Math.PI * 0.5; // 90 degrees
      leftDoorRef.current.rotation.y = -angle;
      rightDoorRef.current.rotation.y = angle;
    }
    
    // Lock light pulse
    if (lockLightRef.current && locked) {
      const pulse = 0.5 + 0.5 * Math.sin(ambientEvents.time * 4);
      (lockLightRef.current.material as THREE.MeshBasicMaterial).color.setHex(pulse > 0.7 ? 0xff2222 : 0x880000);
    }
  });
  
  // Handle E key interaction
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && checkProximity()) {
        tryUnlock();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [doorId, locked, isUnlocked]);
  
  // Auto-unlock if objective already complete (load game)
  useEffect(() => {
    if (isUnlocked && locked) {
      setLocked(false);
      state.targetProgress = 1;
    }
  }, [isUnlocked, locked]);
  
  // Materials
  const doorMat = useMemo(() => 
    new THREE.MeshStandardMaterial({ 
      color: 0x1a1a2e, 
      metalness: 0.7, 
      roughness: 0.3,
      emissive: 0x001122,
      emissiveIntensity: 0.3,
    }), []);
  
  const frameMat = useMemo(() => 
    new THREE.MeshStandardMaterial({ 
      color: 0x0d0d15, 
      metalness: 0.8, 
      roughness: 0.2 
    }), []);
  
  const glassMat = useMemo(() => 
    new THREE.MeshPhysicalMaterial({ 
      color: 0x002244, 
      metalness: 0.1, 
      roughness: 0.05,
      transmission: 0.85,
      thickness: 0.02,
      ior: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    }), []);
  
  const lockMat = useMemo(() => 
    new THREE.MeshBasicMaterial({ 
      color: 0xff2222, 
      transparent: true,
      opacity: 0.9,
      toneMapped: false,
    }), []);
  
  return (
    <RigidBody 
      type="fixed" 
      position={position} 
      rotation={rotation}
      collisionGroups={1}
      colliders="cuboid"
    >
      <group ref={doorRef}>
        {/* Door frame */}
        <mesh ref={frameRef} receiveShadow castShadow>
          <boxGeometry args={[size[0] + 0.3, size[1] + 0.2, 0.3]} />
          <primitive attach="material" object={frameMat} />
        </mesh>
        
        {/* Top frame piece */}
        <mesh position={[0, size[1]/2 + 0.1, 0]} receiveShadow castShadow>
          <boxGeometry args={[size[0] + 0.5, 0.2, 0.3]} />
          <primitive attach="material" object={frameMat} />
        </mesh>
        
        {/* Left door leaf */}
        <mesh 
          ref={leftDoorRef} 
          position={[-size[0]/2 + 0.05, 0, 0.05]} 
          castShadow 
          receiveShadow
        >
          <boxGeometry args={[size[0]/2 - 0.05, size[1] - 0.1, 0.1]} />
          <primitive attach="material" object={doorMat} />
          {/* Glass panel */}
          <mesh position={[0, 0.3, 0.055]} scale={[0.8, 0.6, 1]} castShadow>
            <planeGeometry args={[1, 1]} />
            <primitive attach="material" object={glassMat} />
          </mesh>
        </mesh>
        
        {/* Right door leaf */}
        <mesh 
          ref={rightDoorRef} 
          position={[size[0]/2 - 0.05, 0, 0.05]} 
          castShadow 
          receiveShadow
        >
          <boxGeometry args={[size[0]/2 - 0.05, size[1] - 0.1, 0.1]} />
          <primitive attach="material" object={doorMat} />
          {/* Glass panel */}
          <mesh position={[0, 0.3, 0.055]} scale={[0.8, 0.6, 1]} castShadow>
            <planeGeometry args={[1, 1]} />
            <primitive attach="material" object={glassMat} />
          </mesh>
        </mesh>
        
        {/* Lock indicator */}
        <mesh 
          ref={lockLightRef} 
          position={[0, size[1]/2 - 0.3, 0.25]} 
          scale={0.15}
        >
          <octahedronGeometry args={[1, 0]} />
          <primitive attach="material" object={lockMat} />
        </mesh>
        
        {/* Lock light */}
        <pointLight 
          ref={lightRef} 
          position={[0, size[1]/2 - 0.3, 0.3]} 
          color={0xff2222} 
          intensity={locked ? 5 : 0} 
          distance={3} 
          decay={2} 
        />
        
        {/* Neon trim on frame */}
        <mesh position={[-size[0]/2 - 0.18, 0, 0.2]} rotation={[0, 0, Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, size[1], 8]} />
          <meshBasicMaterial color={locked ? 0xff2222 : 0x00ff88} toneMapped={false} />
        </mesh>
        <mesh position={[size[0]/2 + 0.18, 0, 0.2]} rotation={[0, 0, Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, size[1], 8]} />
          <meshBasicMaterial color={locked ? 0xff2222 : 0x00ff88} toneMapped={false} />
        </mesh>
      </group>
      
      {/* Collider for closed door — blocks enemies; removed when door opens */}
      {locked && !isOpen && (
        <CuboidCollider 
          args={[size[0]/2, size[1]/2, 0.15]}
        />
      )}
    </RigidBody>
  );
}

// Procedural unlock/deny sounds (via shared audio manager)
function playUnlockSound() {
  dzSound.doorOpen();
  dzSound.doorCreak();
}

function playDenySound() {
  dzSound.doorDeny();
}
