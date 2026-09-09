import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../stores/gameStore';
import { Enemy } from './Enemy';
import { useMemo } from 'react';

interface EnemySpawnData {
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  patrolPoints?: [number, number, number][];
}

// Enemy spawn data for hospital level
const hospitalEnemies: EnemySpawnData[] = [
  {
    type: 'nurse',
    position: [10, 1.6, -15],
    rotation: [0, Math.PI, 0],
    patrolPoints: [
      [10, 1.6, -15],
      [15, 1.6, -10],
      [5, 1.6, -5],
      [0, 1.6, -10],
    ],
  },
  {
    type: 'nurse',
    position: [-10, 1.6, 15],
    rotation: [0, 0, 0],
    patrolPoints: [
      [-10, 1.6, 15],
      [-15, 1.6, 10],
      [-5, 1.6, 5],
      [0, 1.6, 10],
    ],
  },
  {
    type: 'patient',
    position: [0, 1.6, -20],
    rotation: [0, Math.PI / 2, 0],
    patrolPoints: [
      [0, 1.6, -20],
      [5, 1.6, -18],
      [-5, 1.6, -18],
    ],
  },
];

export function EnemyManager() {
  const currentLevel = useGameStore((s) => s.currentLevel);
  const gameState = useGameStore((s) => s.gameState);
  const playerPosition = useGameStore((s) => s.playerPosition);

  // Get enemies for current level
  const enemies = useMemo(() => {
    switch (currentLevel) {
      case 'hospital':
        return hospitalEnemies;
      default:
        return hospitalEnemies;
    }
  }, [currentLevel]);

  // Update all enemies with player position
  useFrame(() => {
    if (gameState !== 'playing') return;
    // Enemy logic runs in individual Enemy components
  });

  return (
    <group name="enemies">
      {enemies.map((enemyData, index) => (
        <Enemy
          key={index}
          enemyType={enemyData.type}
          initialPosition={enemyData.position}
          initialRotation={enemyData.rotation}
          patrolPoints={enemyData.patrolPoints}
          playerPosition={playerPosition}
        />
      ))}
    </group>
  );
}