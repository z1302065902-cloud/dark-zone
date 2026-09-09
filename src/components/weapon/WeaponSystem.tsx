import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../stores/gameStore';
import type { WeaponType, WeaponConfig } from '../../types/game';

const weaponConfigs: Record<WeaponType, WeaponConfig> = {
  stunGun: {
    type: 'stunGun',
    name: '电击枪',
    damage: 25,
    fireRate: 0.8,
    range: 15,
    ammo: 50,
    maxAmmo: 50,
    reloadTime: 2,
    isMelee: false,
    modelPath: '/models/weapons/stun_gun.glb',
    soundPath: '/audio/weapons/stun_gun.wav',
  },
  pistol: {
    type: 'pistol',
    name: '手枪',
    damage: 35,
    fireRate: 0.4,
    range: 30,
    ammo: 12,
    maxAmmo: 60,
    reloadTime: 1.5,
    isMelee: false,
    modelPath: '/models/weapons/pistol.glb',
    soundPath: '/audio/weapons/pistol.wav',
  },
  shotgun: {
    type: 'shotgun',
    name: '霰弹枪',
    damage: 12, // per pellet
    fireRate: 1.2,
    range: 12,
    ammo: 6,
    maxAmmo: 32,
    reloadTime: 2.5,
    isMelee: false,
    modelPath: '/models/weapons/shotgun.glb',
    soundPath: '/audio/weapons/shotgun.wav',
  },
  energyGun: {
    type: 'energyGun',
    name: '能量武器',
    damage: 50,
    fireRate: 0.3,
    range: 40,
    ammo: 100,
    maxAmmo: 100,
    reloadTime: 3,
    isMelee: false,
    modelPath: '/models/weapons/energy_gun.glb',
    soundPath: '/audio/weapons/energy_gun.wav',
  },
  knife: {
    type: 'knife',
    name: '小刀',
    damage: 40,
    fireRate: 0.8,
    range: 2,
    ammo: 999,
    maxAmmo: 999,
    reloadTime: 0,
    isMelee: true,
    modelPath: '/models/weapons/knife.glb',
    soundPath: '/audio/weapons/knife.wav',
  },
  axe: {
    type: 'axe',
    name: '消防斧',
    damage: 60,
    fireRate: 1.5,
    range: 2.5,
    ammo: 999,
    maxAmmo: 999,
    reloadTime: 0,
    isMelee: true,
    modelPath: '/models/weapons/axe.glb',
    soundPath: '/audio/weapons/axe.wav',
  },
  baton: {
    type: 'baton',
    name: '铁棍',
    damage: 30,
    fireRate: 1,
    range: 2.2,
    ammo: 999,
    maxAmmo: 999,
    reloadTime: 0,
    isMelee: true,
    modelPath: '/models/weapons/baton.glb',
    soundPath: '/audio/weapons/baton.wav',
  },
  chainsaw: {
    type: 'chainsaw',
    name: '电锯',
    damage: 20, // DPS
    fireRate: 0.1,
    range: 2.5,
    ammo: 999,
    maxAmmo: 999,
    reloadTime: 0,
    isMelee: true,
    modelPath: '/models/weapons/chainsaw.glb',
    soundPath: '/audio/weapons/chainsaw.wav',
  },
};

export function WeaponSystem() {
  const { camera, scene, raycaster, gl } = useThree();
  const gameState = useGameStore((s) => s.gameState);
  const currentWeapon = useGameStore((s) => s.currentWeapon);
  const weapons = useGameStore((s) => s.weapons);
  const ammo = useGameStore((s) => s.ammo);
  const useAmmo = useGameStore((s) => s.useAmmo);
  const addWeapon = useGameStore((s) => s.addWeapon);
  const setCurrentWeapon = useGameStore((s) => s.setCurrentWeapon);

  const weaponRef = useRef<THREE.Group | null>(null);
  const muzzleFlashRef = useRef<THREE.PointLight | null>(null);
  const lastFireTime = useRef(0);
  const isFiring = useRef(false);
  const isReloading = useRef(false);
  const reloadTimer = useRef(0);
  const recoilRef = useRef({ x: 0, y: 0 });
  const targetRecoilRef = useRef({ x: 0, y: 0 });

  const config = weaponConfigs[currentWeapon];
  // Model loading is deferred until GLB assets are added — using placeholder geometry
  const weaponScene = null;
  const animations: unknown[] = [];

  // Placeholder weapon body (real GLB model replaces this when assets are available)

  // Muzzle flash light
  useEffect(() => {
    const light = new THREE.PointLight(0xffee88, 0, 5, 2);
    light.visible = false;
    muzzleFlashRef.current = light;
    camera.add(light);
    return () => camera.remove(light);
  }, [camera]);

  // Input handling
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && gameState === 'playing') {
        isFiring.current = true;
      }
    };
    
    const onMouseUp = () => {
      isFiring.current = false;
    };
    
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      // Weapon switching
      if (e.code === 'Digit1') setCurrentWeapon('stunGun');
      if (e.code === 'Digit2') setCurrentWeapon('pistol');
      if (e.code === 'Digit3') setCurrentWeapon('shotgun');
      if (e.code === 'Digit4') setCurrentWeapon('energyGun');
      if (e.code === 'KeyQ') setCurrentWeapon('knife');
      
      // Reload
      if (e.code === 'KeyR') {
        reload();
      }
      
      // Melee attack
      if (e.code === 'MouseLeft' || e.code === 'Mouse0') {
        isFiring.current = true;
      }
    };
    
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'MouseLeft' || e.code === 'Mouse0') {
        isFiring.current = false;
      }
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [gameState, setCurrentWeapon, currentWeapon]);

  // Firing logic
  const fire = () => {
    const cfg = weaponConfigs[currentWeapon];
    const now = performance.now() / 1000;
    
    if (isReloading.current) return;
    if (!useAmmo(currentWeapon, 1)) return; // No ammo
    if (now - lastFireTime.current < cfg.fireRate) return;
    
    lastFireTime.current = now;
    
    // Recoil
    const recoilStrength = cfg.isMelee ? 0.02 : 0.05;
    targetRecoilRef.current.x = -recoilStrength * (Math.random() * 0.5 + 0.5);
    targetRecoilRef.current.y = (Math.random() - 0.5) * recoilStrength * 0.5;
    
    // Muzzle flash
    if (muzzleFlashRef.current && !cfg.isMelee) {
      muzzleFlashRef.current.visible = true;
      muzzleFlashRef.current.intensity = 5;
      setTimeout(() => {
        if (muzzleFlashRef.current) {
          muzzleFlashRef.current.visible = false;
        }
      }, 50);
    }
    
    // Raycast for hitscan weapons
    if (!cfg.isMelee) {
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      raycaster.far = cfg.range;
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      if (intersects.length > 0) {
        const hit = intersects[0];
        // Hit effect
        createHitEffect(hit.point, hit.normal);
        
        // Damage enemy
        const enemy = hit.object.parent?.parent?.parent;
        if (enemy && enemy.userData?.takeDamage) {
          enemy.userData.takeDamage(cfg.damage, 0.3);
        }
      }
    } else {
      // Melee attack - sphere cast
      const meleeRange = cfg.range;
      const sphere = new THREE.Sphere(new THREE.Vector3(), meleeRange);
      // TODO: Implement proper melee hit detection
    }
    
    // Play sound
    playWeaponSound(currentWeapon);
  };

  // Reload
  const reload = () => {
    const cfg = weaponConfigs[currentWeapon];
    const currentAmmo = ammo[currentWeapon];
    const maxAmmo = cfg.maxAmmo;
    
    if (currentAmmo >= maxAmmo || isReloading.current || cfg.isMelee) return;
    
    isReloading.current = true;
    reloadTimer.current = cfg.reloadTime;
    
    // Play reload animation/sound
    playReloadSound(currentWeapon);
  };

  // Update loop
  useFrame((_, delta) => {
    if (gameState !== 'playing') return;
    
    // Handle firing
    if (isFiring.current) {
      fire();
    }
    
    // Handle reload
    if (isReloading.current) {
      reloadTimer.current -= delta;
      if (reloadTimer.current <= 0) {
        isReloading.current = false;
        useGameStore.getState().reloadWeapon(currentWeapon);
      }
    }
    
    // Smooth recoil recovery
    recoilRef.current.x += (targetRecoilRef.current.x - recoilRef.current.x) * delta * 15;
    recoilRef.current.y += (targetRecoilRef.current.y - recoilRef.current.y) * delta * 15;
    targetRecoilRef.current.x *= 0.9;
    targetRecoilRef.current.y *= 0.9;
    
    // Apply recoil to camera
    if (camera) {
      camera.rotation.x += recoilRef.current.x;
      camera.rotation.y += recoilRef.current.y;
    }
    
    // Weapon sway/bob
    if (weaponRef.current) {
      const time = performance.now() * 0.003;
      weaponRef.current.rotation.z = Math.sin(time * 2) * 0.005;
      weaponRef.current.position.x = 0.3 + Math.sin(time) * 0.01;
      weaponRef.current.position.y = -0.3 + Math.cos(time * 1.5) * 0.01;
    }
    
    // Hide muzzle flash after frame
    if (muzzleFlashRef.current && muzzleFlashRef.current.visible) {
      muzzleFlashRef.current.intensity *= 0.5;
      if (muzzleFlashRef.current.intensity < 0.5) {
        muzzleFlashRef.current.visible = false;
      }
    }
  });

  // Create hit effect
  const createHitEffect = (position: THREE.Vector3, normal: THREE.Vector3) => {
    // Spark particles
    const geometry = new THREE.BufferGeometry();
    const count = 10;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      
      const dir = normal.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      )).normalize();
      
      velocities[i * 3] = dir.x * (Math.random() * 5 + 2);
      velocities[i * 3 + 1] = dir.y * (Math.random() * 5 + 2);
      velocities[i * 3 + 2] = dir.z * (Math.random() * 5 + 2);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xffee88,
      size: 0.05,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.userData = { velocities, life: 0.5 };
    scene.add(particles);
    
    // Animate particles
    const animateParticles = (dt: number) => {
      particles.userData.life -= dt;
      if (particles.userData.life <= 0) {
        scene.remove(particles);
        geometry.dispose();
        material.dispose();
        return;
      }
      
      const posAttr = geometry.getAttribute('position');
      const vel = particles.userData.velocities;
      
      for (let i = 0; i < count; i++) {
        posAttr.setX(i, posAttr.getX(i) + vel[i * 3] * dt);
        posAttr.setY(i, posAttr.getY(i) + vel[i * 3 + 1] * dt);
        posAttr.setZ(i, posAttr.getZ(i) + vel[i * 3 + 2] * dt);
        
        // Gravity
        vel[i * 3 + 1] -= 9.8 * dt;
      }
      
      posAttr.needsUpdate = true;
      material.opacity = particles.userData.life * 2;
      
      requestAnimationFrame(() => animateParticles(1/60));
    };
    
    animateParticles(1/60);
  };

  // Weapon sounds (placeholder - use Web Audio API)
  const playWeaponSound = (weapon: WeaponType) => {
    // TODO: Implement with AudioManager
    console.log(`Fire: ${weapon}`);
  };
  
  const playReloadSound = (weapon: WeaponType) => {
    console.log(`Reload: ${weapon}`);
  };

  return (
    <group ref={weaponRef} name="weapon" position={[0.3, -0.3, -0.5]} rotation={[0, Math.PI, 0]}>
      {/* Placeholder weapon body */}
      <mesh>
        {config.isMelee ? (
          <>
            <boxGeometry args={[0.05, 0.05, config.range * 0.8]} />
            <meshStandardMaterial color={0x888888} roughness={0.3} metalness={0.7} />
          </>
        ) : (
          <>
            <boxGeometry args={[0.15, 0.1, 0.4]} />
            <meshStandardMaterial color={0x333333} roughness={0.4} metalness={0.6} />
          </>
        )}
      </mesh>
      {/* Barrel indicator */}
      {!config.isMelee && (
        <mesh position={[0, 0, -0.25]}>
          <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
          <meshBasicMaterial color={0xffee88} />
        </mesh>
      )}
    </group>
  );
}

// Placeholder weapon for when models aren't loaded
export function WeaponPlaceholder() {
  const currentWeapon = useGameStore((s) => s.currentWeapon);
  const config = weaponConfigs[currentWeapon];
  
  return (
    <group name="weapon-placeholder" position={[0.3, -0.3, -0.5]} rotation={[0, Math.PI, 0]}>
      <mesh>
        {config.isMelee ? (
          <>
            <boxGeometry args={[0.05, 0.05, config.range * 0.8]} />
            <meshStandardMaterial color={0x888888} roughness={0.3} metalness={0.7} />
          </>
        ) : (
          <>
            <boxGeometry args={[0.15, 0.1, 0.4]} />
            <meshStandardMaterial color={0x333333} roughness={0.4} metalness={0.6} />
          </>
        )}
      </mesh>
      {/* Barrel indicator */}
      {!config.isMelee && (
        <mesh position={[0, 0, -0.25]}>
          <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
          <meshBasicMaterial color={0xffee88} />
        </mesh>
      )}
    </group>
  );
}
