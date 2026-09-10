import { useGameStore } from '../../stores/gameStore';
import { ObjectiveHUD } from '../environment/ObjectiveSystem';
import { useEffect, useRef, useState } from 'react';
import { t } from '../../utils/i18n';
import type { WeaponType } from '../../types/game';

export function GameUI() {
  const gameState = useGameStore((s) => s.gameState);
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const stamina = useGameStore((s) => s.stamina);
  const maxStamina = useGameStore((s) => s.maxStamina);
  const currentWeapon = useGameStore((s) => s.currentWeapon);
  const ammo = useGameStore((s) => s.ammo);
  const maxAmmo = useGameStore((s) => s.maxAmmo);
  const hitMarker = useGameStore((s) => s.hitMarker);
  const isAiming = useGameStore((s) => s.isAiming);
  const reloadProgress = useGameStore((s) => s.reloadProgress);
  const bossActive = useGameStore((s) => s.bossActive);
  const bossHealth = useGameStore((s) => s.bossHealth);
  const bossMaxHealth = useGameStore((s) => s.bossMaxHealth);
  const flashlightOn = useGameStore((s) => s.flashlightOn);
  const flashlightBattery = useGameStore((s) => s.flashlightBattery);
  const completedObjectives = useGameStore((s) => s.completedObjectives);
  const interactionPrompt = useGameStore((s) => s.interactionPrompt);
  const [showInventory, setShowInventory] = useState(false);

  // Tab toggles inventory
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setShowInventory((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const weaponNames: Record<string, string> = {
    stunGun: t('w_stunGun'),
    pistol: t('w_pistol'),
    shotgun: t('w_shotgun'),
    energyGun: t('w_energyGun'),
    knife: t('w_knife'),
    axe: t('w_axe'),
    baton: t('w_baton'),
    chainsaw: t('w_chainsaw'),
  };

  if (gameState === 'menu' || gameState === 'gameover' || gameState === 'levelcomplete') {
    return null;
  }

  return (
    <div className="game-hud">
      {/* Objective HUD */}
      <ObjectiveHUD />

      {/* Health Bar */}
      <div className="hud-element health-bar">
        <div className="bar-label">{t('hud_hp')}</div>
        <div className="bar-container">
          <div 
            className="bar-fill health" 
            style={{ width: `${(health / maxHealth) * 100}%` }}
          ></div>
        </div>
        <div className="bar-value">{health}/{maxHealth}</div>
      </div>

      {/* Stamina Bar */}
      <div className="hud-element stamina-bar">
        <div className="bar-label">{t('hud_sta')}</div>
        <div className="bar-container">
          <div 
            className="bar-fill stamina" 
            style={{ width: `${(stamina / maxStamina) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Weapon & Ammo */}
      <div className="hud-element weapon-info">
        <div className="weapon-name">{weaponNames[currentWeapon]}</div>
        <div className="ammo-display">
          <span className="current-ammo">{ammo[currentWeapon] || 0}</span>
          <span className="max-ammo">/ {maxAmmo[currentWeapon] || 0}</span>
        </div>
        <div className="weapon-slots">
          {(['stunGun', 'pistol', 'shotgun', 'energyGun', 'knife', 'axe', 'baton', 'chainsaw'] as WeaponType[]).map(w => (
            <div 
              key={w} 
              className={`weapon-slot ${currentWeapon === w ? 'active' : ''} ${!ammo[w] && w !== 'stunGun' ? 'locked' : ''}`}
              title={weaponNames[w]}
            >
              {w.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Flashlight */}
      <div className="hud-element flashlight-indicator">
        <div className={`flashlight-icon ${flashlightOn ? 'on' : 'off'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 12v-4" />
            <path d="M12 22v-4" />
            <path d="M22 12h-4" />
            <path d="M4 12H2" />
            <path d="M18.4 4.4l-2.8 2.8" />
            <path d="M8.4 18.4l-2.8 2.8" />
            <path d="M18.4 18.4l-2.8-2.8" />
            <path d="M8.4 4.4l-2.8-2.8" />
          </svg>
        </div>
        <div className="battery-bar">
          <div 
            className="battery-fill" 
            style={{ width: `${flashlightBattery}%` }}
          ></div>
        </div>
      </div>

      {/* Crosshair (shrinks while aiming) */}
      <div className={`crosshair ${isAiming ? 'aiming' : ''}`}>
        <div className="crosshair-line horizontal left"></div>
        <div className="crosshair-line horizontal right"></div>
        <div className="crosshair-line vertical top"></div>
        <div className="crosshair-line vertical bottom"></div>
        <div className="crosshair-center"></div>
      </div>

      {/* Boss HP bar (only while boss is active) */}
      {bossActive && bossHealth > 0 && (
        <div className="hud-element boss-bar">
          <div className="bar-label">{t('boss_name')}</div>
          <div className="bar-container boss">
            <div
              className="bar-fill boss"
              style={{ width: `${Math.max(0, (bossHealth / bossMaxHealth) * 100)}%` }}
            ></div>
          </div>
          <div className="bar-value">{Math.ceil(bossHealth)}/{bossMaxHealth}</div>
        </div>
      )}

      {/* Hit marker — flashes when a shot connects */}
      {hitMarker > 0 && Date.now() - hitMarker < 140 && (
        <div className="hit-marker">
          <div className="hit-marker-line top"></div>
          <div className="hit-marker-line bottom"></div>
          <div className="hit-marker-line left"></div>
          <div className="hit-marker-line right"></div>
        </div>
      )}

      {/* Reload progress bar */}
      {reloadProgress > 0 && (
        <div className="hud-element reload-bar">
          <div className="bar-container">
            <div className="bar-fill reload" style={{ width: `${(1 - reloadProgress) * 100}%` }}></div>
          </div>
          <div className="bar-label">{t('hud_reload')}</div>
        </div>
      )}

      {/* Interaction prompt (center of screen) */}
      {interactionPrompt && (
        <div className="interaction-prompt">
          <kbd>E</kbd>
          <span>{interactionPrompt.title}</span>
          {interactionPrompt.description && (
            <small>{interactionPrompt.description}</small>
          )}
        </div>
      )}

      {/* Inventory (Tab) */}
      {showInventory && <InventoryPanel />}

      {/* Objectives */}
      {completedObjectives.length > 0 && (
        <div className="hud-element objectives">
          <div className="objectives-title">{t('hud_objectives')}</div>
          {completedObjectives.map((obj, i) => (
            <div key={i} className="objective-item completed">
              <span className="objective-check">✓</span>
              <span>{obj}</span>
            </div>
          ))}
        </div>
      )}

      {/* Interaction prompt */}
      <InteractionPrompt />
    </div>
  );
}

function InventoryPanel() {
  const inventory = useGameStore((s) => s.inventory);
  const weapons = useGameStore((s) => s.weapons);
  const currentWeapon = useGameStore((s) => s.currentWeapon);

  const itemNames: Record<string, string> = {
    keycard: t('item_keycard'),
    fuse: t('item_fuse'),
    key: t('item_master_key'),
    master_key: t('item_master_key'),
    medkit: t('item_medkit'),
    battery: t('item_battery'),
    ammo: t('item_ammo'),
  };
  const weaponNames: Record<string, string> = {
    stunGun: t('w_stunGun'),
    pistol: t('w_pistol'),
    shotgun: t('w_shotgun'),
    energyGun: t('w_energyGun'),
    knife: t('w_knife'),
  };

  return (
    <div className="inventory-panel">
      <div className="inventory-header">
        <span>{t('hud_inventory')}</span>
        <small>{t('hud_close')}</small>
      </div>
      <div className="inventory-section">
        <div className="inventory-label">{t('hud_weapons')}</div>
        <div className="inventory-grid">
          {weapons.map((w) => (
            <div key={w} className={`inventory-item ${currentWeapon === w ? 'active' : ''}`}>
              <span className="inventory-item-name">{weaponNames[w] || w}</span>
              <span className="inventory-item-qty">{t('hud_equipped')}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="inventory-section">
        <div className="inventory-label">{t('hud_items')}</div>
        <div className="inventory-grid">
          {inventory.length === 0 && <div className="inventory-empty">{t('hud_empty')}</div>}
          {inventory.map((slot, i) => (
            <div key={i} className="inventory-item">
              <span className="inventory-item-name">{itemNames[slot.itemType] || slot.itemType}</span>
              <span className="inventory-item-qty">×{slot.quantity ?? 1}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="inventory-footer">
        {t('hud_obj_count', useGameStore.getState().completedObjectives.length)}
      </div>
    </div>
  );
}

function InteractionPrompt() {
  const [prompt] = useState<string | null>(null);  const promptRef = useRef<HTMLDivElement>(null);

  // This would be connected to the InteractionSystem
  // For now, placeholder
  useEffect(() => {
    // Listen for interaction events
  }, []);

  if (!prompt) return null;

  return (
    <div className="interaction-prompt" ref={promptRef}>
      <kbd>E</kbd> <span>{prompt}</span>
    </div>
  );
}
