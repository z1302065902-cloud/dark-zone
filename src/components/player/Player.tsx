import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { useGameStore } from '../../stores/gameStore';
import { resolvePlayerCollision } from '../environment/collision';
import { emitNoise } from '../enemy/Enemy';

let __noiseTimerRef = 0;

interface PlayerProps {
  children?: React.ReactNode;
}

export function Player({ children }: PlayerProps) {
  const { camera, gl, scene } = useThree();
  const gameState = useGameStore((s) => s.gameState);
  const stamina = useGameStore((s) => s.stamina);
  const restoreStamina = useGameStore((s) => s.restoreStamina);
  const useStamina = useGameStore((s) => s.useStamina);

  // Movement state
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
  });
  const isGrounded = useRef(false);
  const canJump = useRef(true);
  
  // Camera rotation
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const pointerLocked = useRef(false);
  const mouseSensitivity = 0.002;
  
  // Constants
  const WALK_SPEED = 4.5;
  const SPRINT_SPEED = 8.5;
  const JUMP_FORCE = 12;
  const GRAVITY = -28;
  const DRAG = 0.85;
  const CAMERA_HEIGHT = 1.6;

  // Pointer lock handling
  useEffect(() => {
    const canvas = gl.domElement;
    
    const onClick = () => {
      if (gameState === 'playing') {
        canvas.requestPointerLock();
      }
    };
    
    const onPointerLockChange = () => {
      pointerLocked.current = document.pointerLockElement === canvas;
    };
    
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      switch (e.code) {
        case 'KeyW': moveState.current.forward = true; break;
        case 'KeyS': moveState.current.backward = true; break;
        case 'KeyA': moveState.current.left = true; break;
        case 'KeyD': moveState.current.right = true; break;
        case 'ShiftLeft': moveState.current.sprint = true; break;
        case 'Space': moveState.current.jump = true; break;
      }
    };
    
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': moveState.current.forward = false; break;
        case 'KeyS': moveState.current.backward = false; break;
        case 'KeyA': moveState.current.left = false; break;
        case 'KeyD': moveState.current.right = false; break;
        case 'ShiftLeft': moveState.current.sprint = false; break;
        case 'Space': moveState.current.jump = false; break;
      }
    };
    
    const onMouseMove = (e: MouseEvent) => {
      if (!pointerLocked.current || gameState !== 'playing') return;
      euler.current.x -= e.movementY * mouseSensitivity;
      euler.current.y -= e.movementX * mouseSensitivity;
      euler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.current.x));
    };

    canvas.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);

    return () => {
      canvas.removeEventListener('click', onClick);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [gameState, gl.domElement]);

  // Physics-based movement using Rapier
  useFrame((_, delta) => {
    if (gameState !== 'playing') return;

    // Clamp delta to avoid tunneling through thin walls on very low FPS
    const dt = Math.min(delta, 0.05);

    // Apply camera rotation (debug bridge can override for automated tests)
    const rotOverride = (window as any).__dz?.rotationOverride;
    if (rotOverride) {
      camera.rotation.set(rotOverride.x, rotOverride.y, rotOverride.z);
      euler.current.copy(camera.rotation);
    } else {
      camera.rotation.copy(euler.current);
    }
    camera.position.y = CAMERA_HEIGHT;

    // Calculate movement direction relative to camera
    direction.current.set(0, 0, 0);
    if (moveState.current.forward) direction.current.z -= 1;
    if (moveState.current.backward) direction.current.z += 1;
    if (moveState.current.left) direction.current.x -= 1;
    if (moveState.current.right) direction.current.x += 1;
    direction.current.normalize();

    // Apply rotation to movement direction
    const moveDir = direction.current.clone().applyEuler(new THREE.Euler(0, camera.rotation.y, 0));

    // Speed based on sprint
    const isSprinting = moveState.current.sprint && stamina > 0;
    const currentSpeed = isSprinting ? SPRINT_SPEED : WALK_SPEED;

    if (isSprinting) {
      useStamina(dt * 15);
    } else {
      restoreStamina(dt * 10);
    }

    // Horizontal movement
    if (direction.current.length() > 0) {
      velocity.current.x = moveDir.x * currentSpeed;
      velocity.current.z = moveDir.z * currentSpeed;
    } else {
      velocity.current.x *= DRAG;
      velocity.current.z *= DRAG;
    }

    // Gravity
    velocity.current.y += GRAVITY * dt;

    // Jump
    if (moveState.current.jump && isGrounded.current && canJump.current) {
      velocity.current.y = JUMP_FORCE;
      isGrounded.current = false;
      canJump.current = false;
      useStamina(10);
    }

    if (!moveState.current.jump) {
      canJump.current = true;
    }

    // Apply velocity to camera position
    camera.position.x += velocity.current.x * dt;
    camera.position.y += velocity.current.y * dt;
    camera.position.z += velocity.current.z * dt;

    // Resolve player collision against walls/doors/furniture (AABB)
    resolvePlayerCollision(camera.position, 0.4);

    // Ground check (simple raycast)
    const groundCheck = new THREE.Raycaster(
      camera.position,
      new THREE.Vector3(0, -1, 0),
      0,
      CAMERA_HEIGHT + 0.2
    );
    const intersects = groundCheck.intersectObjects(scene.children, true);
    isGrounded.current = intersects.length > 0 && intersects[0].distance <= CAMERA_HEIGHT + 0.1;

    if (isGrounded.current && velocity.current.y < 0) {
      velocity.current.y = 0;
      // Snap to ground
      const groundY = camera.position.y - intersects[0].distance + CAMERA_HEIGHT;
      camera.position.y = groundY;
    }

    // Keep camera at minimum height
    if (camera.position.y < CAMERA_HEIGHT) {
      camera.position.y = CAMERA_HEIGHT;
    }
  });

  return (
    <RigidBody
      type="kinematicPosition"
      position={[0, CAMERA_HEIGHT, 0]}
    >
      <CapsuleCollider args={[0.9, 0.4]} />
      {children}
    </RigidBody>
  );
}

// Head bob effect hook
export function useHeadBob(camera: THREE.Camera, enabled: boolean = true) {
  const bobPhase = useRef(0);
  const bobIntensity = 0.02;
  const bobSpeed = 8;
  const prevPos = useRef({ x: 0, z: 0 });

  useFrame((_, delta) => {
    if (!enabled) return;

    // Estimate speed from player-position delta (GameStore has no velocity field)
    const { playerPosition } = useGameStore.getState();
    const dx = playerPosition.x - prevPos.current.x;
    const dz = playerPosition.z - prevPos.current.z;
    const speed = Math.sqrt(dx * dx + dz * dz) / Math.max(delta, 0.001);
    prevPos.current = { x: playerPosition.x, z: playerPosition.z };
    
    // Noisy movement — sprinting makes noise nearby enemies can hear
    const noiseTimer = __noiseTimerRef || 0;
    if (speed > 2.5) {
      const next = noiseTimer + delta;
      if (next > (speed > 6 ? 0.7 : 1.1)) {
        emitNoise(camera.position.x, camera.position.z, speed > 6 ? 12 : 7);
        __noiseTimerRef = 0;
      } else {
        __noiseTimerRef = next;
      }
    } else {
      __noiseTimerRef = 0;
    }
    
    if (speed > 0.1) {
      bobPhase.current += delta * bobSpeed * (speed / 5);
      camera.position.y += Math.sin(bobPhase.current) * bobIntensity * (speed / 5);
      camera.rotation.z = Math.sin(bobPhase.current * 0.5) * 0.01 * (speed / 5);
    } else {
      bobPhase.current = 0;
    }
  });
}