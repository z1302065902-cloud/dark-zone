import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';
import { t } from '../utils/i18n';
import type { ItemType } from '../types/game';

// Interaction types
interface Interactable {
  id: string;
  type: 'door' | 'pickup' | 'switch' | 'button' | 'chest' | 'dialogue' | 'savepoint';
  position: THREE.Vector3;
  radius?: number;
  name: string;
  description: string;
  interact?: () => void;
  requiresKey?: boolean;
  opened?: boolean;
  active?: boolean;
  // Door specifics
  openRotation?: number;
  currentAngle?: number;
  targetAngle?: number;
  // Pickup specifics
  itemType?: ItemType;
  quantity?: number;
}

export function InteractionSystem() {
  const { camera, scene } = useThree();
  const gameState = useGameStore((s) => s.gameState);
  const hasItem = useGameStore((s) => s.hasItem);
  const setInteractionPrompt = useGameStore((s) => s.setInteractionPrompt);

  const interactablesRef = useRef<Interactable[]>([]);
  const canInteract = useRef(false);

  // Register interactables (would normally be in level setup)
  useEffect(() => {
    const objects = scene.children.filter((child) => (child as any).userData?.interactable);
    objects.forEach((obj) => {
      const ud = (obj as any).userData;
      interactablesRef.current.push({
        id: ud.id,
        type: ud.type,
        position: new THREE.Vector3(...ud.position || [0, 1, 0]),
        radius: ud.radius || 2,
        name: ud.name || '',
        description: ud.description || '',
        interact: ud.interact,
        requiresKey: ud.requiresKey || false,
        opened: ud.opened || false,
        active: ud.active !== undefined ? ud.active : true,
      });
    });
  }, [scene]);

  // Raycast for interaction
  useFrame(() => {
    if (gameState !== 'playing') return;

    // Cast ray from center of screen
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    raycaster.far = 5; // Interaction range

    // Check against registered interactables
    let closest: Interactable | null = null;
    let closestDist = 5;

    for (const interactable of interactablesRef.current) {
      if (!interactable.active) continue;
      
      const dir = new THREE.Vector3().subVectors(interactable.position, camera.position);
      const dist = dir.length();
      
      // Check if roughly in front of player
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const dot = dir.normalize().dot(forward);
      
      if (dist < closestDist && dot > 0.7) {
        closest = interactable;
        closestDist = dist;
      }
    }

    canInteract.current = !!closest;
    
    if (closest) {
      setInteractionPrompt({ title: closest.name || 'Interact', description: closest.description || '' });
    } else {
      setInteractionPrompt(null);
    }
  });

  // Handle interaction key (E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' || !canInteract.current) return;
      
      const closest = interactablesRef.current.find((i) => {
        const dist = i.position.distanceTo(camera.position);
        return dist < 5;
      });
      
      if (!closest?.interact) return;
      
      // Check key requirement
      if (closest.requiresKey && !hasItem('key')) {
        console.log(t('door_requires', t('item_master_key')));
        return;
      }
      
      closest.interact();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [camera.position, hasItem]);

  // Pure logic component — prompt UI is rendered in GameUI (outside Canvas)
  return null;
}

// Door component
export function Door({
  position,
  rotation,
  openRotation = Math.PI / 2,
  requiresKey = false,
  name = t('interact_open'),
  description = t('door_requires', t('item_master_key')),
  id = `door_${Math.random().toString(36).substr(2, 9)}`,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  openRotation?: number;
  requiresKey?: boolean;
  name?: string;
  description?: string;
  id?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const angleRef = useRef(0);
  const doorRef = useRef<THREE.Group>(null);
  const isInteracting = useRef(false);

  const interact = useCallback(() => {
    if (isInteracting.current) return;
    isInteracting.current = true;
    
    if (requiresKey) {
      // Would check inventory here
      console.log('Need key for door');
      return;
    }

    setIsOpen(!isOpen);
    setTimeout(() => { isInteracting.current = false; }, 500);
  }, [isOpen, requiresKey]);

  // Animation
  useFrame(() => {
    const target = isOpen ? openRotation : 0;
    angleRef.current += (target - angleRef.current) * 0.1;
    if (doorRef.current) {
      doorRef.current.rotation.y = angleRef.current;
    }
  });

  return (
    <group 
      ref={doorRef}
      position={position}
      rotation={rotation}
      userData={{
        interactable: true,
        type: 'door' as const,
        id,
        position,
        radius: 2,
        name,
        description,
        interact,
        requiresKey,
      }}
    >
      {/* Door frame */}
      <mesh position={[0, 1.5, -0.1]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 3.2, 0.15]} />
        <meshStandardMaterial color={0x1a1a1a} roughness={0.8} metalness={0.3} />
      </mesh>
      
      {/* Door panel */}
      <group position={[0, 1.5, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 3, 0.1]} />
          <meshStandardMaterial color={0x2a2a2a} roughness={0.6} metalness={0.4} />
        </mesh>
        
        {/* Handle */}
        <mesh position={[0.7, 1.5, 0.06]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.15, 8]} />
          <meshStandardMaterial color={0x444444} roughness={0.3} metalness={0.7} />
        </mesh>
        
        {/* Window */}
        <mesh position={[0, 2.2, 0.06]}>
          <boxGeometry args={[0.6, 0.4, 0.02]} />
          <meshStandardMaterial 
            color={0x111111} 
            transparent 
            opacity={0.3}
            emissive={0x111111}
            emissiveIntensity={0.1}
          />
        </mesh>
      </group>
      
      {/* Light indicator */}
      <mesh position={[0, 3, 0.06]}>
        <circleGeometry args={[0.1, 16]} />
        <meshBasicMaterial color={isOpen ? 0x00ff00 : 0xff0000} />
      </mesh>
    </group>
  );
}

// Pickup component
export function Pickup({
  position,
  itemType,
  quantity = 1,
  name,
  description,
  id,
}: {
  position: [number, number, number];
  itemType: ItemType;
  quantity?: number;
  name?: string;
  description?: string;
  id?: string;
}) {
  const [collected, setCollected] = useState(false);
  const pickupRef = useRef<THREE.Group>(null);
  const floatOffset = useRef(Math.random() * Math.PI * 2);
  const addItem = useGameStore((s) => s.addItem);

  const interact = useCallback(() => {
    if (collected) return;
    setCollected(true);
    
    // Add to inventory
    addItem(itemType, quantity);
    console.log(`Picked up ${itemType} x${quantity}`);
  }, [itemType, quantity, collected, addItem]);

  useFrame((_, delta) => {
    if (collected) return;
    
    floatOffset.current += delta * 2;
    if (pickupRef.current) {
      pickupRef.current.position.y = position[1] + Math.sin(floatOffset.current) * 0.1;
      pickupRef.current.rotation.y += delta * 0.5;
    }
  });

  if (collected) return null;

  return (
    <group
      ref={pickupRef}
      position={position}
      userData={{
        interactable: true,
        type: 'pickup' as const,
        id: id || `pickup_${Math.random()}`,
        position,
        radius: 2,
        name: name || `${itemType}`,
        description: description || `Pick up ${itemType}`,
        interact,
      }}
    >
      {/* Glow */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial 
          color={getItemColor(itemType)} 
          transparent 
          opacity={0.2} 
        />
      </mesh>
      
      {/* Core */}
      <mesh castShadow>
        <octahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial 
          color={getItemColor(itemType)} 
          emissive={getItemColor(itemType)} 
          emissiveIntensity={0.5} 
        />
      </mesh>
      
      {/* Point light */}
      <pointLight 
        color={getItemColor(itemType)} 
        intensity={0.5} 
        distance={3} 
        decay={2} 
      />
    </group>
  );
}

function getItemColor(type: ItemType): THREE.ColorRepresentation {
  const colors: Record<ItemType, number> = {
    flashlight: 0xffff00,
    battery: 0x00ff00,
    medkit: 0xff0000,
    master_key: 0xcc00ff,
    painkiller: 0xff00ff,
    key: 0xffaa00,
    keycard: 0x00aaff,
    fuse: 0xaaffaa,
    map: 0xaaaaaa,
    tapeRecorder: 0xaa5500,
    camera: 0x5555aa,
    ammo: 0x888888,
    explosive: 0xff4400,
    special: 0x55ff55,
  };
  return colors[type];
}

// Save point
export function SavePoint({
  position,
  name = t('interact_savepoint'),
}: {
  position: [number, number, number];
  name?: string;
}) {
  const saveGame = useGameStore((s) => s.saveGame);
  const [glowing, setGlowing] = useState(false);

  const interact = useCallback(() => {
    saveGame();
    setGlowing(true);
    setTimeout(() => setGlowing(false), 2000);
    console.log('Game saved');
  }, [saveGame]);

  return (
    <group
      position={position}
      userData={{
        interactable: true,
        type: 'savepoint' as const,
        position,
        radius: 3,
        name,
        description: t('interact_save_desc'),
        interact,
      }}
    >
      {/* Base */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.6, 1, 8]} />
        <meshStandardMaterial color={0x222222} roughness={0.5} metalness={0.5} />
      </mesh>
      
      {/* Crystal */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial 
          color={glowing ? 0x00ffff : 0x0088ff} 
          emissive={glowing ? 0x00ffff : 0x0044ff} 
          emissiveIntensity={glowing ? 1.5 : 0.8} 
          transparent 
          opacity={0.9} 
        />
      </mesh>
      
      {/* Point light */}
      <pointLight 
        color={glowing ? 0x00ffff : 0x0088ff} 
        intensity={glowing ? 2 : 0.5} 
        distance={5} 
        decay={2} 
      />
    </group>
  );
}