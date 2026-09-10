import { useFrame } from '@react-three/fiber';
import { useRef, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import type { ReactNode } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useGameStore } from '../../stores/gameStore';
import { t, tObj } from '../../utils/i18n';
import { dzSound } from '../AudioManager';
import { ambientEvents } from './CyberDecor';

interface FuseBoxProps {
  boxId: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  requiredFuses?: number;
  onComplete?: (boxId: string) => void;
}

export function FuseBox({ 
  boxId, 
  position, 
  rotation = [0, 0, 0],
  requiredFuses = 1,
  onComplete 
}: FuseBoxProps) {
  const { hasItem, removeItem, completeObjective, setInteractionPrompt, completedObjectives } = useGameStore();
  
  const boxRef = useRef<THREE.Group | null>(null);
  const screenRef = useRef<THREE.Mesh | null>(null);
  const lightRef = useRef<THREE.PointLight[]>([]);
  const humRef = useRef<OscillatorNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const [insertedCount, setInsertedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [interactionCooldown, setInteractionCooldown] = useState(0);
  
  // Check if already completed via save
  useEffect(() => {
    if (completedObjectives.includes(`fusebox_${boxId}`)) {
      setIsComplete(true);
      setInsertedCount(requiredFuses);
    }
  }, [completedObjectives]);
  
  // Start electrical hum when powered
  useFrame(() => {
    if (isComplete && !humRef.current && audioCtxRef.current) {
      startHum();
    }
  });
  
  const startHum = () => {
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 55; // Low A
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      gain.gain.value = 0.02;
      
      osc.start();
      humRef.current = osc;
    } catch {}
  };
  
  const tryInsertFuse = () => {
    if (isComplete) return;
    if (interactionCooldown > 0) return;
    
    if (hasItem('fuse')) {
      removeItem('fuse');
      const newCount = insertedCount + 1;
      setInsertedCount(newCount);
      setInteractionCooldown(30); // frames
      
      playInsertSound();
      
      if (newCount >= requiredFuses) {
        setIsComplete(true);
        completeObjective(`fusebox_${boxId}`);
        // Linear objective chain: insert_fuse → restore_power
        completeObjective('insert_fuse');
        completeObjective('restore_power');
        onComplete?.(boxId);
        
        setInteractionPrompt({
          title: tObj('obj_restore_power').title,
          description: tObj('obj_door_surgery').desc,
        });
        
        // Trigger power restored event
        setTimeout(() => setInteractionPrompt(null), 4000);
      } else {
        setInteractionPrompt({
          title: tObj('obj_insert_fuse').title,
          description: t('fuse_needed', requiredFuses - insertedCount),
        });
        setTimeout(() => setInteractionPrompt(null), 2000);
      }
    } else {
      setInteractionPrompt({
        title: t('fuse_box'),
        description: tObj('obj_find_fuse').desc,
      });
      playDenySound();
      setInteractionCooldown(30);
    }
  };
  
  // Interaction prompt
  useFrame(() => {
    if (interactionCooldown > 0) setInteractionCooldown((n) => Math.max(0, n - 1));
    
    const playerPos = useGameStore.getState().playerPosition;
    const dx = playerPos.x - position[0];
    const dz = playerPos.z - position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    const near = dist < 2;
    
    const store = useGameStore.getState();
    if (near && !isComplete) {
      if (!store.interactionPrompt || store.interactionPrompt.title.includes('FUSE BOX') || store.interactionPrompt.title.includes('配电箱')) {
        setInteractionPrompt({
          title: t('fuse_box'),
          description: hasItem('fuse') ? t('interact_install') : t('item_fuse'),
        });
      }
    } else if (store.interactionPrompt?.title?.includes('FUSE BOX') || store.interactionPrompt?.title?.includes('配电箱')) {
      setInteractionPrompt(null);
    }
  });
  
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') {
        const playerPos = useGameStore.getState().playerPosition;
        const dx = playerPos.x - position[0];
        const dz = playerPos.z - position[2];
        if (Math.sqrt(dx * dx + dz * dz) < 2) {
          tryInsertFuse();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [boxId]);
  
  // Materials
  const boxMat = useMemo(() => 
    new THREE.MeshStandardMaterial({ 
      color: 0x1a1a2e, 
      metalness: 0.7, 
      roughness: 0.3,
      emissive: 0x001133,
      emissiveIntensity: 0.3,
    }), []);
  
  const screenMat = useMemo(() => 
    new THREE.MeshBasicMaterial({ 
      color: isComplete ? 0x00ff88 : 0xff2222,
      toneMapped: false,
    }), [isComplete]);
  
  const slotMat = useMemo(() => 
    new THREE.MeshStandardMaterial({ 
      color: 0x0d0d15, 
      metalness: 0.9, 
      roughness: 0.1 
    }), []);
  
  const fuseMat = useMemo(() => 
    new THREE.MeshStandardMaterial({ 
      color: 0xffcc00, 
      metalness: 0.8, 
      roughness: 0.2,
      emissive: 0x332200,
      emissiveIntensity: 0.5,
    }), []);
  
  const labelMat = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, 256, 64);
    ctx.font = 'bold 32px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'center';
    ctx.fillText(`FUSE BOX ${boxId.toUpperCase()}`, 128, 42);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false });
  }, [boxId]);
  
  return (
    <RigidBody type="fixed" position={position} rotation={rotation}>
      <group ref={boxRef}>
        {/* Main box body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.2, 1.6, 0.4]} />
          <primitive attach="material" object={boxMat} />
        </mesh>
        
        {/* Front panel */}
        <mesh position={[0, 0, 0.21]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 1.5, 0.05]} />
          <primitive attach="material" object={boxMat} />
        </mesh>
        
        {/* Label */}
        <mesh position={[0, 0.6, 0.24]} rotation={[-0.15, 0, 0]}>
          <planeGeometry args={[0.8, 0.2]} />
          <primitive attach="material" object={labelMat} />
        </mesh>
        
        {/* Status screen */}
        <mesh ref={screenRef} position={[0, 0.15, 0.24]} scale={isComplete ? 1 : 0.5}>
          <planeGeometry args={[0.5, 0.3]} />
          <primitive attach="material" object={screenMat} />
        </mesh>
        
        {/* Fuse slots */}
        {[...Array(requiredFuses)].map((_, i) => (
          <group key={i} position={[-0.3 + i * 0.3, -0.25, 0.23]}>
            {/* Slot */}
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.08, 0.08, 0.12, 12]} />
              <primitive attach="material" object={slotMat} />
            </mesh>
            {/* Fuse (appears when inserted) */}
            {insertedCount > i && (
              <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.06, 0.06, 0.08, 12]} />
                <primitive attach="material" object={fuseMat} />
              </mesh>
            )}
            {/* Slot light */}
            <pointLight 
              ref={el => { if (el) lightRef.current[i] = el; }} 
              position={[0, 0.15, 0]} 
              color={insertedCount > i ? 0x00ff88 : 0xff2222} 
              intensity={insertedCount > i ? 8 : 3} 
              distance={1.5} 
              decay={2} 
            />
          </group>
        ))}
        
        {/* Neon accent strips */}
        <mesh position={[0.65, 0, 0.1]} rotation={[0, 0, Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
          <meshBasicMaterial color={isComplete ? 0x00ff88 : 0xff2222} toneMapped={false} />
        </mesh>
        <mesh position={[-0.65, 0, 0.1]} rotation={[0, 0, Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
          <meshBasicMaterial color={isComplete ? 0x00ff88 : 0xff2222} toneMapped={false} />
        </mesh>
        
        {/* Animated screen pulse */}
        {isComplete && (
          <mesh position={[0, 0.15, 0.245]} scale={[0.52, 0.32, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial 
              color={0x00ff88} 
              transparent 
              opacity={0.3 + 0.3 * Math.sin(ambientEvents.time * 8)}
              toneMapped={false}
            />
          </mesh>
        )}
      </group>
      
      <CuboidCollider args={[0.6, 0.8, 0.2]} />
    </RigidBody>
  );
}

function playInsertSound() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain).connect(ctx.destination);
  osc.type = 'square';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.start(); osc.stop(ctx.currentTime + 0.15);
}

function playDenySound() {
  dzSound.doorDeny();
}

/* ---------- Key/Keycard/Fuse Pickup Items ---------- */

interface PickupProps {
  itemType: 'keycard' | 'fuse' | 'key' | 'master_key';
  position: [number, number, number];
  rotation?: [number, number, number];
  onPickup?: () => void;
}

export function PickupItem({ itemType, position, rotation = [0, 0, 0], onPickup }: PickupProps) {
  const { addItem, setInteractionPrompt } = useGameStore();
  const meshRef = useRef<THREE.Mesh | null>(null);
  const lightRef = useRef<THREE.PointLight | null>(null);
  const picked = useRef(false);
  
  // Check if already picked up in this session (simple approach)
  // In full game, would track per-item in save
  
  const configs: Record<string, { color: number; name: string; objId: string; model: () => ReactNode }> = {
    keycard: { 
      color: 0x00e5ff, 
      name: t('item_keycard'), 
      objId: 'find_keycard',
      model: () => (
        <group>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.08, 0.5, 0.3]} />
            <meshStandardMaterial color={0x001133} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.16]} castShadow>
            <planeGeometry args={[0.45, 0.25]} />
            <meshBasicMaterial color={0x00e5ff} toneMapped={false} />
          </mesh>
        </group>
      ),
    },
    fuse: { 
      color: 0xffcc00, 
      name: t('item_fuse'), 
      objId: 'find_fuse',
      model: () => (
        <group>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.12, 12]} />
            <meshStandardMaterial color={0x332200} metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.06, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
            <meshStandardMaterial color={0xffcc00} emissive={0x332200} emissiveIntensity={1} />
          </mesh>
          <mesh position={[0, -0.06, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
            <meshStandardMaterial color={0xffcc00} emissive={0x332200} emissiveIntensity={1} />
          </mesh>
        </group>
      ),
    },
    key: { 
      color: 0xffaa00, 
      name: t('item_master_key'), 
      objId: 'find_master_key',
      model: () => (
        <group>
          <mesh castShadow receiveShadow>
            <torusGeometry args={[0.12, 0.03, 8, 16]} />
            <meshStandardMaterial color={0x332a00} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 0, 0]} rotation={[0, Math.PI/2, 0]}>
            <boxGeometry args={[0.25, 0.04, 0.04]} />
            <meshStandardMaterial color={0x332a00} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ),
    },
    master_key: { 
      color: 0xffaa00, 
      name: t('item_master_key'), 
      objId: 'find_master_key',
      model: () => (
        <group>
          <mesh castShadow receiveShadow>
            <torusGeometry args={[0.14, 0.035, 8, 16]} />
            <meshStandardMaterial color={0x443300} metalness={0.9} roughness={0.1} emissive={0x332200} emissiveIntensity={0.3} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 0, 0]} rotation={[0, Math.PI/2, 0]}>
            <boxGeometry args={[0.3, 0.05, 0.05]} />
            <meshStandardMaterial color={0x443300} metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0.15, 0, 0]} castShadow>
            <boxGeometry args={[0.12, 0.03, 0.03]} />
            <meshStandardMaterial color={0x443300} metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ),
    },
  };
  
  const config = configs[itemType];
  
  useFrame(() => {
    if (picked.current) return;
    
    // Float and rotate animation
    const time = ambientEvents.time;
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(time * 1.5) * 0.08;
      meshRef.current.rotation.y = time * 0.4 + rotation[1];
    }
    if (lightRef.current) {
      lightRef.current.intensity = 2 + Math.sin(time * 3) * 1;
    }
    
    // Check proximity
    const playerPos = useGameStore.getState().playerPosition;
    const dx = playerPos.x - position[0];
    const dy = playerPos.y - position[1];
    const dz = playerPos.z - position[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (dist < 1.5) {
      const store = useGameStore.getState();
      if (!store.interactionPrompt || store.interactionPrompt.title.includes(config.name)) {
        setInteractionPrompt({
          title: `🔑 ${config.name}`,
          description: t('interact_pickup'),
        });
      }
    }
  });
  
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && !picked.current) {
        const playerPos = useGameStore.getState().playerPosition;
        const dx = playerPos.x - position[0];
        const dy = playerPos.y - position[1];
        const dz = playerPos.z - position[2];
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 1.5) {
          picked.current = true;
          addItem(itemType);
          completeObjective(config.objId);
          onPickup?.();
          playPickupSound(config.color);
          
          setInteractionPrompt({
            title: t('interact_obtained', config.name),
            description: t('interact_added'),
          });
          setTimeout(() => setInteractionPrompt(null), 3000);
          
          // Fade out the model's meshes (traverse children — group has no material)
          if (meshRef.current) {
            meshRef.current.traverse((obj) => {
              const mesh = obj as THREE.Mesh;
              if (!mesh.isMesh) return;
              const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
              if (!mat) return;
              mat.transparent = true;
              const fade = setInterval(() => {
                if (mat.opacity > 0.01) {
                  mat.opacity -= 0.1;
                } else {
                  clearInterval(fade);
                }
              }, 50);
            });
            meshRef.current.visible = true;
          }
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [itemType]);
  
  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      <group ref={meshRef}>
        {config.model()}
      </group>
      <pointLight 
        ref={lightRef} 
        position={[0, 0.1, 0]} 
        color={config.color} 
        intensity={4} 
        distance={3} 
        decay={2} 
      />
    </group>
  );
}

function completeObjective(id: string) {
  useGameStore.getState().completeObjective(id);
}

function playPickupSound(_color: number) {
  dzSound.pickup();
}