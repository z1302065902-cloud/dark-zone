import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../stores/gameStore';
import { Enemy } from './Enemy';
import { useMemo } from 'react';

interface EnemySpawnData {
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  patrolPoints?: [number, number, number][];
  boss?: boolean;
}

// Enemy spawn data for hospital level — matches 4-zone layout:
// Lobby → Emergency → Surgery → Underground Lab (Boss: Nurse-07)
const hospitalEnemies: EnemySpawnData[] = [
  // --- LOBBY (spawn area, z: -15..15) ---
  {
    type: 'patient',
    position: [-10, 1.0, -6],
    rotation: [0, Math.PI / 2, 0],
    patrolPoints: [
      [-10, 1.6, -6],
      [10, 1.6, -6],
      [10, 1.6, 4],
      [-10, 1.6, 4],
    ],
  },
  {
    type: 'patient',
    position: [0, 1.0, -12],
    rotation: [0, 0, 0],
    patrolPoints: [
      [0, 1.6, -12],
      [6, 1.6, -12],
      [-6, 1.6, -12],
    ],
  },

  // --- EMERGENCY (z: -32..-15) ---
  {
    type: 'nurse',
    position: [-14, 1.0, -20],
    rotation: [0, Math.PI / 2, 0],
    patrolPoints: [
      [-14, 1.6, -20],
      [-14, 1.6, -28],
      [-14, 1.6, -20],
    ],
  },
  {
    type: 'patient',
    position: [14, 1.0, -24],
    rotation: [0, -Math.PI / 2, 0],
    patrolPoints: [
      [14, 1.6, -24],
      [14, 1.6, -18],
    ],
  },

  // --- SURGERY (z: 15..32) ---
  {
    type: 'nurse',
    position: [-14, 1.0, 20],
    rotation: [0, Math.PI / 2, 0],
    patrolPoints: [
      [-14, 1.6, 20],
      [-14, 1.6, 28],
      [-14, 1.6, 20],
    ],
  },

  // --- UNDERGROUND LAB (Boss arena, x: 12..32) ---
  {
    type: 'nurse07',
    position: [22, 1.0, 8],
    rotation: [0, 0, 0],
    patrolPoints: [], // idle — wakes when player enters lab
    boss: true,
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
          boss={enemyData.boss}
        />
      ))}
    </group>
  );
}
