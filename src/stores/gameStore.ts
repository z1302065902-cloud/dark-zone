import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, WeaponType, ItemType, InventorySlot, SaveData, Vector3 } from '../types/game';

interface GameStore {
  // Game state
  gameState: GameState;
  setGameState: (state: GameState) => void;

  // Player stats
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  useStamina: (amount: number) => boolean;
  restoreStamina: (amount: number) => void;

  // Inventory
  inventory: InventorySlot[];
  maxInventoryWeight: number;
  currentWeight: number;
  addItem: (itemType: ItemType, quantity?: number) => boolean;
  removeItem: (itemType: ItemType, quantity?: number) => boolean;
  hasItem: (itemType: ItemType, quantity?: number) => boolean;
  getItemQuantity: (itemType: ItemType) => number;

  // Weapons
  currentWeapon: WeaponType;
  weapons: WeaponType[];
  ammo: Record<WeaponType, number>;
  maxAmmo: Record<WeaponType, number>;
  setCurrentWeapon: (weapon: WeaponType) => void;
  addWeapon: (weapon: WeaponType) => void;
  useAmmo: (weapon: WeaponType, amount?: number) => boolean;
  reloadWeapon: (weapon: WeaponType) => void;

  // Flashlight
  flashlightOn: boolean;
  flashlightBattery: number;
  maxFlashlightBattery: number;
  toggleFlashlight: () => void;
  drainFlashlightBattery: (amount: number) => void;
  addBattery: (amount: number) => void;

  // Level progress
  currentLevel: string;
  completedObjectives: string[];
  completeObjective: (objectiveId: string) => void;
  setCurrentLevel: (levelId: string) => void;

  // Position/rotation for save
  playerPosition: Vector3;
  playerRotation: Vector3;
  setPlayerPosition: (pos: Vector3) => void;
  setPlayerRotation: (rot: Vector3) => void;

  // Current item (for interaction prompts)
  currentItem: ItemType | null;
  setCurrentItem: (item: ItemType | null) => void;

  // Interaction prompt (HTML shown outside canvas)
  interactionPrompt: { title: string; description: string } | null;
  setInteractionPrompt: (prompt: { title: string; description: string } | null) => void;

  // Save/Load
  saveGame: () => SaveData;
  loadGame: (data: SaveData) => void;
  resetGame: () => void;
}

const initialState = {
  gameState: 'menu' as GameState,
  health: 100,
  maxHealth: 100,
  stamina: 100,
  maxStamina: 100,
  inventory: [] as InventorySlot[],
  maxInventoryWeight: 20,
  currentWeight: 0,
  currentWeapon: 'stunGun' as WeaponType,
  weapons: ['stunGun'] as WeaponType[],
  ammo: { stunGun: 50, pistol: 0, shotgun: 0, energyGun: 0, knife: 999, axe: 999, baton: 999, chainsaw: 999 },
  maxAmmo: { stunGun: 50, pistol: 60, shotgun: 32, energyGun: 100, knife: 999, axe: 999, baton: 999, chainsaw: 999 },
  flashlightOn: true,
  flashlightBattery: 100,
  maxFlashlightBattery: 100,
  currentLevel: 'hospital',
  completedObjectives: [] as string[],
  currentItem: null as ItemType | null,
  interactionPrompt: null as { title: string; description: string } | null,
  playerPosition: { x: 0, y: 1.6, z: 0 },
  playerRotation: { x: 0, y: 0, z: 0 },
};

const itemWeights: Record<ItemType, number> = {
  flashlight: 0.5,
  battery: 0.2,
  medkit: 1,
  painkiller: 0.1,
  key: 0.1,
  keycard: 0.05,
  fuse: 0.3,
  map: 0.2,
  tapeRecorder: 0.3,
  camera: 0.4,
  ammo: 0.5,
  explosive: 1,
  special: 0.5,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setGameState: (gameState) => set({ gameState }),

      takeDamage: (amount) => set((state) => ({
        health: Math.max(0, state.health - amount),
        gameState: state.health - amount <= 0 ? 'gameover' : state.gameState,
      })),

      heal: (amount) => set((state) => ({
        health: Math.min(state.maxHealth, state.health + amount),
      })),

      useStamina: (amount) => {
        const state = get();
        if (state.stamina >= amount) {
          set({ stamina: state.stamina - amount });
          return true;
        }
        return false;
      },

      restoreStamina: (amount) => set((state) => ({
        stamina: Math.min(state.maxStamina, state.stamina + amount),
      })),

      addItem: (itemType, quantity = 1) => {
        const state = get();
        const weight = itemWeights[itemType] * quantity;
        if (state.currentWeight + weight > state.maxInventoryWeight) {
          return false;
        }

        const existingIndex = state.inventory.findIndex((slot) => slot.itemType === itemType);
        let newInventory: InventorySlot[];
        if (existingIndex >= 0) {
          newInventory = [...state.inventory];
          newInventory[existingIndex] = {
            ...newInventory[existingIndex],
            quantity: newInventory[existingIndex].quantity + quantity,
          };
        } else {
          newInventory = [...state.inventory, { itemType, quantity }];
        }

        set({
          inventory: newInventory,
          currentWeight: state.currentWeight + weight,
        });
        return true;
      },

      removeItem: (itemType, quantity = 1) => {
        const state = get();
        const existingIndex = state.inventory.findIndex((slot) => slot.itemType === itemType);
        if (existingIndex === -1) return false;

        const slot = state.inventory[existingIndex];
        if (slot.quantity < quantity) return false;

        const weight = itemWeights[itemType] * quantity;
        let newInventory: InventorySlot[];
        if (slot.quantity === quantity) {
          newInventory = state.inventory.filter((_, i) => i !== existingIndex);
        } else {
          newInventory = [...state.inventory];
          newInventory[existingIndex] = { ...slot, quantity: slot.quantity - quantity };
        }

        set({
          inventory: newInventory,
          currentWeight: state.currentWeight - weight,
        });
        return true;
      },

      hasItem: (itemType, quantity = 1) => {
        const state = get();
        const slot = state.inventory.find((s) => s.itemType === itemType);
        return slot !== undefined && slot.quantity >= quantity;
      },

      getItemQuantity: (itemType) => {
        const state = get();
        const slot = state.inventory.find((s) => s.itemType === itemType);
        return slot?.quantity ?? 0;
      },

      setCurrentWeapon: (weapon) => {
        const state = get();
        if (state.weapons.includes(weapon)) {
          set({ currentWeapon: weapon });
        }
      },

      addWeapon: (weapon) => set((state) => ({
        weapons: state.weapons.includes(weapon) ? state.weapons : [...state.weapons, weapon],
        currentWeapon: weapon,
      })),

      useAmmo: (weapon, amount = 1) => {
        const state = get();
        const currentAmmo = state.ammo[weapon] ?? 0;
        if (currentAmmo >= amount) {
          set({ ammo: { ...state.ammo, [weapon]: currentAmmo - amount } });
          return true;
        }
        return false;
      },

      reloadWeapon: (weapon) => {
        const state = get();
        const max = state.maxAmmo[weapon] ?? 0;
        set({ ammo: { ...state.ammo, [weapon]: max } });
      },

      toggleFlashlight: () => set((state) => ({
        flashlightOn: !state.flashlightOn,
      })),

      drainFlashlightBattery: (amount) => set((state) => ({
        flashlightBattery: Math.max(0, state.flashlightBattery - amount),
        flashlightOn: state.flashlightBattery - amount > 0 ? state.flashlightOn : false,
      })),

      addBattery: (amount) => set((state) => ({
        flashlightBattery: Math.min(state.maxFlashlightBattery, state.flashlightBattery + amount),
      })),

      completeObjective: (objectiveId) => set((state) => ({
        completedObjectives: state.completedObjectives.includes(objectiveId)
          ? state.completedObjectives
          : [...state.completedObjectives, objectiveId],
      })),

      setCurrentLevel: (levelId) => set({ currentLevel: levelId }),

      setPlayerPosition: (pos) => set({ playerPosition: pos }),
      setPlayerRotation: (rot) => set({ playerRotation: rot }),
      setCurrentItem: (item) => set({ currentItem: item }),
      setInteractionPrompt: (prompt) => set({ interactionPrompt: prompt }),

      saveGame: () => {
        const state = get();
        return {
          currentLevel: state.currentLevel,
          playerPosition: state.playerPosition,
          playerRotation: state.playerRotation,
          health: state.health,
          stamina: state.stamina,
          inventory: state.inventory,
          currentWeapon: state.currentWeapon,
          completedObjectives: state.completedObjectives,
          timestamp: Date.now(),
        };
      },

      loadGame: (data) => set({
        currentLevel: data.currentLevel,
        playerPosition: data.playerPosition,
        playerRotation: data.playerRotation,
        health: data.health,
        stamina: data.stamina,
        inventory: data.inventory,
        currentWeapon: data.currentWeapon,
        completedObjectives: data.completedObjectives,
        currentWeight: data.inventory.reduce((w, slot) => w + (itemWeights[slot.itemType] * slot.quantity), 0),
      }),

      resetGame: () => set(initialState),
    }),
    {
      name: 'dark-zone-save',
      partialize: (state) => ({
        currentLevel: state.currentLevel,
        playerPosition: state.playerPosition,
        playerRotation: state.playerRotation,
        health: state.health,
        stamina: state.stamina,
        inventory: state.inventory,
        currentWeapon: state.currentWeapon,
        completedObjectives: state.completedObjectives,
        currentWeight: state.currentWeight,
        ammo: state.ammo,
        weapons: state.weapons,
        flashlightBattery: state.flashlightBattery,
      }),
    }
  )
);