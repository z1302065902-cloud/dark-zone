import { useFrame } from '@react-three/fiber';
import { Player } from '../components/player/Player';
import { EnemyManager } from '../components/enemy/EnemyManager';
import { Level } from '../components/environment/Level';
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
  useFrame((state) => {
    if (gameState !== 'playing') return;
    const camera = state.camera;
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