import { useEffect } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

/* ============================================================
   Lightweight collision system for DARK ZONE 0.1 demo.
   - `colliders` registry: AABB list used by the PLAYER (manual
     camera movement, no physics collision) via resolvePlayerCollision
   - `Wall` component: renders a box AND registers its AABB AND adds
     a Rapier fixed collider so ENEMIES (physics bodies) collide.
   ============================================================ */

export interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  /** when false the collider is ignored (e.g. open door) */
  active: boolean;
}

export const colliders: BoxCollider[] = [];

/** Register an axis-aligned box collider (footprint on ground, full height) */
export function registerCollider(
  cx: number,
  cz: number,
  halfW: number,
  halfD: number,
  height: number,
  active = true
): BoxCollider {
  const box: BoxCollider = {
    minX: cx - halfW,
    maxX: cx + halfW,
    minZ: cz - halfD,
    maxZ: cz + halfD,
    minY: 0,
    maxY: height,
    active,
  };
  colliders.push(box);
  return box;
}

export function clearColliders() {
  colliders.length = 0;
}

/**
 * Resolve player capsule (approximated as a circle of `radius`)
 * against all active AABBs. Mutates `pos` (x/z) to push out.
 */
export function resolvePlayerCollision(pos: THREE.Vector3, radius = 0.4) {
  const py = pos.y;
  for (const c of colliders) {
    if (!c.active) continue;
    // Vertical overlap check (player head at ~py+0.3, feet at ~py-1.6)
    if (py + 0.3 < c.minY || py - 1.6 > c.maxY) continue;

    const cx = Math.max(c.minX, Math.min(pos.x, c.maxX));
    const cz = Math.max(c.minZ, Math.min(pos.z, c.maxZ));
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const distSq = dx * dx + dz * dz;

    if (distSq < radius * radius) {
      if (distSq < 1e-9) {
        // Player center inside the box: push out along smallest axis
        const pushX = Math.min(pos.x - c.minX, c.maxX - pos.x);
        const pushZ = Math.min(pos.z - c.minZ, c.maxZ - pos.z);
        const midX = (c.minX + c.maxX) / 2;
        const midZ = (c.minZ + c.maxZ) / 2;
        if (pushX < pushZ) {
          pos.x = pos.x < midX ? c.minX - radius : c.maxX + radius;
        } else {
          pos.z = pos.z < midZ ? c.minZ - radius : c.maxZ + radius;
        }
      } else {
        const d = Math.sqrt(distSq);
        pos.x += (dx / d) * (radius - d);
        pos.z += (dz / d) * (radius - d);
      }
    }
  }
}

interface WallProps {
  position: [number, number, number];
  size: [number, number, number];
  rotationY?: number;
  color?: number;
  /** skip registering in player registry (visual only) */
  visualOnly?: boolean;
}

/**
 * A static wall/block:
 *  - Rapier fixed collider → enemies bounce off it
 *  - AABB in registry → player collides with it
 */
export function Wall({ position, size, rotationY = 0, color = 0x141422, visualOnly = false }: WallProps) {
  useEffect(() => {
    if (visualOnly) return;
    // Footprint for axis-aligned collider. Rotation is only ever 0 or ±PI/2.
    const rotated = Math.abs(Math.round(rotationY / (Math.PI / 2))) % 2 === 1;
    const halfW = rotated ? size[2] / 2 : size[0] / 2;
    const halfD = rotated ? size[0] / 2 : size[2] / 2;
    registerCollider(position[0], position[2], halfW, halfD, size[1]);
  }, [position[0], position[1], position[2], size[0], size[1], size[2], rotationY, visualOnly]);

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={[0, rotationY, 0]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.85} metalness={0.25} />
      </mesh>
    </RigidBody>
  );
}

/** Simple static block with custom material (furniture) */
export function StaticBlock({ position, size, color = 0x2a2a3a, height }: {
  position: [number, number, number];
  size: [number, number, number];
  color?: number;
  height?: number;
}) {
  useEffect(() => {
    registerCollider(position[0], position[2], size[0] / 2, size[2] / 2, height ?? size[1]);
  }, []);
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} />
      </mesh>
    </RigidBody>
  );
}
