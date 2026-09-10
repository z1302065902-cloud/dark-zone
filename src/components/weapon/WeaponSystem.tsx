import { useFrame, useThree, createPortal } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { t } from '../../utils/i18n';
import { useGameStore } from '../../stores/gameStore';
import { emitNoise } from '../enemy/Enemy';
import { dzSound } from '../AudioManager';
import type { WeaponType, WeaponConfig } from '../../types/game';

/** Walk up the object ancestry to find a node exposing userData.takeDamage */
function findEnemyParent(obj: THREE.Object3D | null): (THREE.Object3D & { userData: { takeDamage: (d: number, s?: number) => void } }) | null {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    const ud = cur.userData as { takeDamage?: (d: number, s?: number) => void };
    if (typeof ud.takeDamage === 'function') {
      return cur as THREE.Object3D & { userData: { takeDamage: (d: number, s?: number) => void } };
    }
    cur = cur.parent;
  }
  return null;
}

export const weaponConfigs: Record<WeaponType, WeaponConfig> = {
  stunGun: {
    type: 'stunGun',
    name: t('w_stunGun'),
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
    name: t('w_pistol'),
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
    name: t('w_shotgun'),
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
    name: t('w_energyGun'),
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
    name: t('w_knife'),
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
    name: t('w_axe'),
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
    name: t('w_baton'),
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
    name: t('w_chainsaw'),
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

const HIP_SPREAD = 0.008;  // radians — hip-fire spread
const ADS_SPREAD = 0.0015; // radians — aimed spread

export function WeaponSystem() {
  const { camera, scene, raycaster, gl } = useThree();
  const gameState = useGameStore((s) => s.gameState);
  const currentWeapon = useGameStore((s) => s.currentWeapon);
  const ammo = useGameStore((s) => s.ammo);
  const useAmmo = useGameStore((s) => s.useAmmo);
  const setCurrentWeapon = useGameStore((s) => s.setCurrentWeapon);
  const setHitMarker = useGameStore((s) => s.setHitMarker);
  const setAiming = useGameStore((s) => s.setAiming);
  const setReloadProgress = useGameStore((s) => s.setReloadProgress);

  const weaponRef = useRef<THREE.Group | null>(null);
  const muzzleFlashRef = useRef<THREE.PointLight | null>(null);
  const muzzleMeshRef = useRef<THREE.Mesh | null>(null);
  const lastFireTime = useRef(0);
  const isFiring = useRef(false);
  const fireRef = useRef<() => void>(() => {});
  const isReloading = useRef(false);
  const reloadTimer = useRef(0);
  const aiming = useRef(false);
  const fov = useRef(75);
  const recoilRef = useRef({ x: 0, y: 0 });
  const targetRecoilRef = useRef({ x: 0, y: 0 });

  const config = weaponConfigs[currentWeapon];

  // Muzzle flash light + mesh
  useEffect(() => {
    const light = new THREE.PointLight(0xffee88, 0, 6, 2);
    light.visible = false;
    muzzleFlashRef.current = light;
    camera.add(light);
    return () => camera.remove(light);
  }, [camera]);

  // Input handling
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (gameState !== 'playing') return;
      if (e.button === 0) isFiring.current = true;
      if (e.button === 2) { aiming.current = true; setAiming(true); }
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) isFiring.current = false;
      if (e.button === 2) { aiming.current = false; setAiming(false); }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      if (e.code === 'Digit1') setCurrentWeapon('stunGun');
      if (e.code === 'Digit2') setCurrentWeapon('pistol');
      if (e.code === 'Digit3') setCurrentWeapon('shotgun');
      if (e.code === 'Digit4') setCurrentWeapon('energyGun');
      if (e.code === 'KeyQ') setCurrentWeapon('knife');
      if (e.code === 'KeyR') reload();
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
    const onFireWeapon = (e: Event) => {
      const detail = (e as CustomEvent).detail as { weapon?: string } | null;
      if (detail?.weapon) setCurrentWeapon(detail.weapon);
      // Fire synchronously so E2E/debug bridge calls work even when the
      // headless RAF loop isn't ticking. fireRef always holds the latest fire().
      fireRef.current();
      // Keep the isFiring flag too as a fallback for the frame loop.
      isFiring.current = true;
      setTimeout(() => { isFiring.current = false; }, 50);
    };
    window.addEventListener('dz:fire-weapon', onFireWeapon as EventListener);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('dz:fire-weapon', onFireWeapon as EventListener);
      setAiming(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, setCurrentWeapon, setAiming]);

  // Fire logic
  const fire = () => {
    const cfg = weaponConfigs[currentWeapon];
    const now = performance.now() / 1000;

    if (isReloading.current) return;
    if (now - lastFireTime.current < cfg.fireRate) return;

    // Melee doesn't consume ammo
    if (!cfg.isMelee) {
      const currentAmmo = useGameStore.getState().ammo[currentWeapon];
      if (currentAmmo <= 0) {
        dzSound.dry();
        // auto reload on empty
        if (cfg.reloadTime > 0) reload();
        return;
      }
      useAmmo(currentWeapon, 1);
    }

    lastFireTime.current = now;

    // Recoil
    const recoilStrength = cfg.isMelee ? 0.015 : aiming.current ? 0.03 : 0.05;
    targetRecoilRef.current.x = -recoilStrength * (Math.random() * 0.5 + 0.5);
    targetRecoilRef.current.y = (Math.random() - 0.5) * recoilStrength * 0.6;

    // Muzzle flash
    if (!cfg.isMelee) {
      if (muzzleFlashRef.current) {
        muzzleFlashRef.current.visible = true;
        muzzleFlashRef.current.intensity = 6;
      }
      if (muzzleMeshRef.current) {
        muzzleMeshRef.current.visible = true;
        muzzleMeshRef.current.scale.setScalar(1);
      }
    }

    // Noisy! gunfire alerts nearby enemies
    const camPos = camera.position;
    emitNoise(camPos.x, camPos.z, cfg.isMelee ? 4 : 30);

    // Hit detection
    const spread = aiming.current ? ADS_SPREAD : HIP_SPREAD;
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
    dir.x += (Math.random() - 0.5) * spread;
    dir.y += (Math.random() - 0.5) * spread;
    dir.z += (Math.random() - 0.5) * spread * 0.5;
    dir.normalize();

    raycaster.set(camera.position, dir);
    raycaster.far = cfg.range;
    raycaster.near = 0.05;
    // Exclude the weapon itself (child of camera) and spark particles from raycast
    const targets = scene.children.filter((c) => c !== camera && !(c as THREE.Points).isPoints && c.userData?.isWeaponRoot !== true);
    const intersects = raycaster.intersectObjects(targets, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      createHitEffect(hit.point, hit.normal || new THREE.Vector3(0, 1, 0));

      const enemyObj = findEnemyParent(hit.object);
      if (enemyObj) {
        // stunGun is the tactical boss weapon — long stun per hit
        const stun = cfg.type === 'stunGun' ? 1.2 : cfg.isMelee ? 0.15 : 0.25;
        enemyObj.userData.takeDamage(cfg.damage, stun);
        setHitMarker(Date.now());
        dzSound.enemyHit();
      } else {
        dzSound.metal();
      }
    }

    dzSound.fire(currentWeapon);
  };

  // Keep fireRef pointing at the latest fire() so the event handler (registered
  // once in useEffect) always invokes the current closure.
  fireRef.current = fire;

  // Reload
  const reload = () => {
    const cfg = weaponConfigs[currentWeapon];
    const currentAmmo = useGameStore.getState().ammo[currentWeapon];
    if (currentAmmo >= cfg.maxAmmo || isReloading.current || cfg.isMelee) return;
    isReloading.current = true;
    reloadTimer.current = cfg.reloadTime;
    dzSound.reload();
  };

  // Update loop
  useFrame((_, delta) => {
    if (gameState !== 'playing') return;

    if (isFiring.current) fire();

    if (isReloading.current) {
      reloadTimer.current -= delta;
      setReloadProgress(Math.max(0, Math.min(1, reloadTimer.current / config.reloadTime)));
      if (reloadTimer.current <= 0) {
        isReloading.current = false;
        setReloadProgress(0);
        useGameStore.getState().reloadWeapon(currentWeapon);
        dzSound.reload();
      }
    } else if (useGameStore.getState().reloadProgress !== 0) {
      setReloadProgress(0);
    }

    // ADS FOV lerp
    const targetFov = aiming.current ? 60 : 75;
    fov.current += (targetFov - fov.current) * delta * 10;
    if (Math.abs(fov.current - targetFov) < 0.05) fov.current = targetFov;
    (camera as unknown as THREE.PerspectiveCamera).fov = fov.current;
    (camera as unknown as THREE.PerspectiveCamera).updateProjectionMatrix();

    // Recoil recovery
    recoilRef.current.x += (targetRecoilRef.current.x - recoilRef.current.x) * delta * 15;
    recoilRef.current.y += (targetRecoilRef.current.y - recoilRef.current.y) * delta * 15;
    targetRecoilRef.current.x *= 0.9;
    targetRecoilRef.current.y *= 0.9;

    // Apply recoil to camera
    if (camera) {
      camera.rotation.x += recoilRef.current.x;
      camera.rotation.y += recoilRef.current.y;
    }

    // Weapon pose: ADS centers the gun; hip-fire holds it low-right
    if (weaponRef.current) {
      const time = performance.now() * 0.003;
      const aimK = aiming.current ? 1 : 0;
      weaponRef.current.position.set(
        0.3 - aimK * 0.3 + Math.sin(time) * 0.008 * (1 - aimK),
        -0.3 + aimK * 0.3 + Math.cos(time * 1.5) * 0.008 * (1 - aimK),
        -0.5 + aimK * 0.2
      );
      weaponRef.current.rotation.z = Math.sin(time * 2) * 0.005 * (1 - aimK);
      weaponRef.current.rotation.x = 0;
      // firing kick
      const kick = targetRecoilRef.current.x < -0.02 ? 0.03 : 0;
      weaponRef.current.position.z += kick;
    }

    // Muzzle flash decay
    if (muzzleFlashRef.current && muzzleFlashRef.current.visible) {
      muzzleFlashRef.current.intensity *= 0.5;
      if (muzzleFlashRef.current.intensity < 0.5) muzzleFlashRef.current.visible = false;
    }
    if (muzzleMeshRef.current && muzzleMeshRef.current.visible) {
      muzzleMeshRef.current.scale.multiplyScalar(0.85);
      if (muzzleMeshRef.current.scale.x < 0.2) muzzleMeshRef.current.visible = false;
    }
  });

  // Spark particle hit effect
  const createHitEffect = (position: THREE.Vector3, normal: THREE.Vector3) => {
    const geometry = new THREE.BufferGeometry();
    const count = 10;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      const dir = normal.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.6
      )).normalize();
      velocities[i * 3] = dir.x * (Math.random() * 5 + 2);
      velocities[i * 3 + 1] = dir.y * (Math.random() * 5 + 2);
      velocities[i * 3 + 2] = dir.z * (Math.random() * 5 + 2);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffee88, size: 0.05, transparent: true, opacity: 1, depthWrite: false,
    });
    const particles = new THREE.Points(geometry, material);
    particles.userData = { velocities, life: 0.5 };
    scene.add(particles);
    const animate = (dt: number) => {
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
        vel[i * 3 + 1] -= 9.8 * dt;
      }
      posAttr.needsUpdate = true;
      material.opacity = particles.userData.life * 2;
      requestAnimationFrame(() => animate(1 / 60));
    };
    animate(1 / 60);
  };

  return createPortal(
    <group ref={weaponRef} name="weapon" position={[0.3, -0.3, -0.5]} rotation={[0, Math.PI, 0]} userData={{ isWeaponRoot: true }}>
      {/* Placeholder weapon body (replaced by GLB when assets available) */}
      {config.isMelee ? (
        <>
          <mesh>
            <boxGeometry args={[0.05, 0.05, config.range * 0.8]} />
            <meshStandardMaterial color={0x8899aa} roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, config.range * 0.8, 8]} />
            <meshStandardMaterial color={0x223344} roughness={0.5} metalness={0.6} />
          </mesh>
        </>
      ) : (
        <>
          {/* Gun body */}
          <mesh>
            <boxGeometry args={[0.14, 0.11, 0.42]} />
            <meshStandardMaterial color={config.type === 'stunGun' ? 0x2255aa : 0x2a2a33} roughness={0.4} metalness={0.65} />
          </mesh>
          {/* Barrel */}
          <mesh position={[0, 0, -0.28]}>
            <cylinderGeometry args={[0.022, 0.022, 0.14, 8]} />
            <meshStandardMaterial color={0x111118} roughness={0.3} metalness={0.9} />
          </mesh>
          {/* Muzzle flash quad */}
          <mesh ref={muzzleMeshRef} position={[0, 0, -0.4]} rotation={[0, 0, 0]} visible={false}>
            <planeGeometry args={[0.35, 0.35]} />
            <meshBasicMaterial color={0xffdd66} toneMapped={false} transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
          {/* Stun gun glow */}
          {config.type === 'stunGun' && (
            <mesh position={[0, 0, -0.34]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color={0x44ddff} toneMapped={false} />
            </mesh>
          )}
        </>
      )}
    </group>,
    camera
  );
}
