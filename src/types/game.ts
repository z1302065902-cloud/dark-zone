export type WeaponType = 'stunGun' | 'pistol' | 'shotgun' | 'energyGun' | 'knife' | 'axe' | 'baton' | 'chainsaw';
export type ItemType = 'flashlight' | 'battery' | 'medkit' | 'painkiller' | 'key' | 'master_key' | 'keycard' | 'fuse' | 'map' | 'tapeRecorder' | 'camera' | 'ammo' | 'explosive' | 'special';
export type EnemyState = 'patrol' | 'hear' | 'see' | 'chase' | 'attack' | 'search' | 'die';
export type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'levelcomplete';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface WeaponConfig {
  type: WeaponType;
  name: string;
  damage: number;
  fireRate: number;
  range: number;
  ammo: number;
  maxAmmo: number;
  reloadTime: number;
  isMelee: boolean;
  modelPath: string;
  soundPath: string;
}

export interface ItemConfig {
  type: ItemType;
  name: string;
  description: string;
  weight: number;
  maxStack: number;
  modelPath: string;
  iconPath: string;
}

export interface EnemyConfig {
  type: string;
  name: string;
  health: number;
  damage: number;
  speed: number;
  hearingRange: number;
  visionRange: number;
  visionAngle: number;
  attackRange: number;
  attackCooldown: number;
  modelPath: string;
  animations: Record<string, string>;
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  mapPath: string;
  skyboxPath: string;
  spawnPoint: Vector3;
  objectives: Objective[];
  enemies: EnemySpawn[];
  items: ItemSpawn[];
  boss?: EnemyConfig;
}

export interface Objective {
  id: string;
  description: string;
  type: 'find' | 'activate' | 'survive' | 'kill' | 'escape';
  targetId: string;
  completed: boolean;
}

export interface EnemySpawn {
  enemyType: string;
  position: Vector3;
  rotation: Vector3;
  patrolPoints?: Vector3[];
}

export interface ItemSpawn {
  itemType: ItemType;
  position: Vector3;
  rotation: Vector3;
  quantity?: number;
}

export interface SaveData {
  currentLevel: string;
  playerPosition: Vector3;
  playerRotation: Vector3;
  health: number;
  stamina: number;
  inventory: InventorySlot[];
  currentWeapon: WeaponType;
  completedObjectives: string[];
  timestamp: number;
}

export interface InventorySlot {
  itemType: ItemType;
  quantity: number;
}