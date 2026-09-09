import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Player } from '../components/player/Player';
import { EnemyManager } from '../components/enemy/EnemyManager';
import { Level, levelConfigs } from '../components/environment/Level';
import { Flashlight } from '../components/player/Flashlight';
import { WeaponSystem } from '../components/weapon/WeaponSystem';
import { AudioManager } from '../components/AudioManager';
import { InteractionSystem } from '../components/InteractionSystem';
import { useGameStore } from '../stores/gameStore';

export function GameScene() {
  const gameState = useGameStore((s) => s.gameState);
  const currentLevel = useGameStore((s) => s.currentLevel);
  const playerPosition = useGameStore((s) => s.playerPosition);
  const playerRotation = useGameStore((s) => s.playerRotation);
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition);
  const setPlayerRotation = useGameStore((s) => s.setPlayerRotation);

  // Sync player position/rotation to store
  const camInit = useRef<string | null>(null);
  useFrame((state) => {
    if (gameState !== 'playing') return;
    const camera = state.camera;
    // On level start, place the camera at the level's spawn point
    if (camInit.current !== currentLevel) {
      const cfg = levelConfigs[currentLevel] || levelConfigs.hospital;
      camera.position.set(cfg.spawnPoint[0], cfg.spawnPoint[1], cfg.spawnPoint[2]);
      camera.rotation.set(0, 0, 0);
      camInit.current = currentLevel;
    }
    // Expose camera to debug bridge for automated testing
    if ((window as any).__dz) {
      (window as any).__dz.camera = camera;
      (window as any).__dz.scene = state.scene;
      (window as any).__dz.gl = state.gl;
    }
    setPlayerPosition({ x: camera.position.x, y: camera.position.y, z: camera.position.z });
    setPlayerRotation({ x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z });
  }, 1); // Run once per frame but low priority

  return (
    <>
      {/* Level Environment */}
      <Level levelId={currentLevel} />

      {/* Player controller */}
      <Player />

      {/* Flashlight attached to camera */}
      <Flashlight />

      {/* Enemy spawner */}
      <EnemyManager />

      {/* Weapons */}
      <WeaponSystem />

      {/* Interaction (doors, pickups, save points) */}
      <InteractionSystem />

      {/* Procedural audio */}
      <AudioManager />
    </>
  );
}