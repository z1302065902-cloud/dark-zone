import { useGameStore } from '../../stores/gameStore';
import { useEffect, useRef } from 'react';

export function GameUI() {
  const gameState = useGameStore((s) => s.gameState);
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const stamina = useGameStore((s) => s.stamina);
  const maxStamina = useGameStore((s) => s.maxStamina);
  const currentWeapon = useGameStore((s) => s.currentWeapon);
  const ammo = useGameStore((s) => s.ammo);
  const maxAmmo = useGameStore((s) => s.maxAmmo);
  const flashlightOn = useGameStore((s) => s.flashlightOn);
  const flashlightBattery = useGameStore((s) => s.flashlightBattery);
  const inventory = useGameStore((s) => s.inventory);
  const getItemQuantity = useGameStore((s) => s.getItemQuantity);
  const completedObjectives = useGameStore((s) => s.completedObjectives);
  const currentLevel = useGameStore((s) => s.currentLevel);
  const interactionPrompt = useGameStore((s) => s.interactionPrompt);

  const weaponNames: Record<string, string> = {
    stunGun: '电击枪',
    pistol: '手枪',
    shotgun: '霰弹枪',
    energyGun: '能量武器',
    knife: '小刀',
    axe: '消防斧',
    baton: '铁棍',
    chainsaw: '电锯',
  };

  if (gameState === 'menu' || gameState === 'gameover' || gameState === 'levelcomplete') {
    return null;
  }

  return (
    <div className="game-hud">
      {/* Health Bar */}
      <div className="hud-element health-bar">
        <div className="bar-label">HP</div>
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
        <div className="bar-label">STA</div>
        <div className="bar-container">
          <div 
            className="bar-fill stamina" 
            style={{ width: `${(stamina / maxStamina) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Weapon & Ammo */}
      <div className="hud-element weapon-info">
        <div className="weapon-name">{weaponNames[currentWeapon] || currentWeapon}</div>
        <div className="ammo-display">
          <span className="current-ammo">{ammo[currentWeapon] || 0}</span>
          <span className="max-ammo">/ {maxAmmo[currentWeapon] || 0}</span>
        </div>
        <div className="weapon-slots">
          {['stunGun', 'pistol', 'shotgun', 'energyGun', 'knife', 'axe', 'baton', 'chainsaw'].map(w => (
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

      {/* Crosshair */}
      <div className="crosshair">
        <div className="crosshair-line horizontal left"></div>
        <div className="crosshair-line horizontal right"></div>
        <div className="crosshair-line vertical top"></div>
        <div className="crosshair-line vertical bottom"></div>
        <div className="crosshair-center"></div>
      </div>

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

      {/* Objectives */}
      {completedObjectives.length > 0 && (
        <div className="hud-element objectives">
          <div className="objectives-title">任务目标</div>
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

function InteractionPrompt() {
  const [prompt, setPrompt] = useState<string | null>(null);
  const promptRef = useRef<HTMLDivElement>(null);

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

import { useState } from 'react';