import { Suspense, useEffect, useState } from 'react';
import { GameCanvas } from './GameCanvas';
import { GameUI } from './ui/GameUI';
import { useGameStore } from '../stores/gameStore';
import { useSettingsStore } from '../stores/settingsStore';
import { t, setLang, getLang } from '../utils/i18n';
import { UnlockOverlay } from './ui/UnlockOverlay';
import '../styles/game.css';

const LoadingFallback = () => (
  <div className="loading-screen">
    <div className="loading-spinner"></div>
    <p>{t('menu_start') + '…'}</p>
  </div>
);

export function Game() {
  const gameState = useGameStore((s) => s.gameState);

  return (
    <div className="game-container">
      {gameState === 'menu' && <MainMenu />}
      {(gameState === 'playing' || gameState === 'paused') && (
        <Suspense fallback={<LoadingFallback />}>
          <GameCanvas />
        </Suspense>
      )}
      {gameState === 'gameover' && <GameOverScreen />}
      {gameState === 'levelcomplete' && <LevelCompleteScreen />}
      <GameUI />
      {/* Monetization gate (demo mode only) */}
      <UnlockOverlay />
    </div>
  );
}

function MainMenu() {
  const setGameState = useGameStore((s) => s.setGameState);
  const resetGame = useGameStore((s) => s.resetGame);
  const [lang, setLangState] = useState(getLang());
  const [hasSave, setHasSave] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const toggleLang = () => {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
    setLangState(next);
  };

  // A valid save = persisted progress (completedObjectives non-empty)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('dark-zone-save');
      if (raw) {
        const data = JSON.parse(raw);
        const objs = data?.state?.completedObjectives || [];
        setHasSave(objs.length > 0);
      }
    } catch { /* noop */ }
  }, []);

  const startGame = () => {
    resetGame();
    setGameState('playing');
  };

  const continueGame = () => {
    // Store is auto-hydrated by zustand persist → resume with saved progress
    setGameState('playing');
  };

  if (showSettings) {
    return <SettingsMenu onBack={() => setShowSettings(false)} />;
  }

  return (
    <div className="menu-overlay">
      <div className="menu-content">
        <h1 className="game-title">{t('game_title')}</h1>
        <p className="game-subtitle">{t('game_subtitle')}</p>
        <div className="menu-buttons">
          <button className="menu-btn" onClick={startGame}>{t('menu_start')}</button>
          {hasSave && <button className="menu-btn" onClick={continueGame}>{t('menu_continue')}</button>}
          <button className="menu-btn" onClick={() => setShowSettings(true)}>{t('menu_settings')}</button>
          <button className="menu-btn" onClick={toggleLang} id="langBtn">{lang === 'zh' ? 'English' : '中文'}</button>
        </div>
        <p className="game-credit">Cyber Horror FPS · Three.js · R3F · Rapier · v1.0.0</p>
        <p className="menu-links">
          <a href="privacy.html" target="_blank" rel="noreferrer">{t('menu_privacy')}</a>
        </p>
      </div>
    </div>
  );
}

function SettingsMenu({ onBack }: { onBack: () => void }) {
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const setMasterVolume = useSettingsStore((s) => s.setMasterVolume);
  const sensitivity = useSettingsStore((s) => s.sensitivity);
  const setSensitivity = useSettingsStore((s) => s.setSensitivity);
  const lang = useSettingsStore((s) => s.lang);
  const setLangStore = useSettingsStore((s) => s.setLang);
  const [, force] = useState(0);
  const toggleLang = () => {
    setLangStore(lang === 'zh' ? 'en' : 'zh');
    force((n) => n + 1);
  };
  return (
    <div className="menu-overlay">
      <div className="menu-content">
        <h1 className="game-title" style={{ fontSize: '1.6rem' }}>{t('menu_settings')}</h1>
        <p className="game-subtitle">{t('settings_desc')}</p>
        <div className="settings-group">
          <label>{t('settings_volume')} <strong>{Math.round(masterVolume * 100)}%</strong></label>
          <input type="range" min={0} max={1} step={0.05} value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))} />
        </div>
        <div className="settings-group">
          <label>{t('settings_sensitivity')} <strong>{sensitivity.toFixed(1)}×</strong></label>
          <input type="range" min={0.2} max={3} step={0.1} value={sensitivity}
            onChange={(e) => setSensitivity(parseFloat(e.target.value))} />
        </div>
        <div className="menu-buttons">
          <button className="menu-btn" onClick={toggleLang}>{t('menu_lang')}：{lang === 'zh' ? 'English' : '中文'}</button>
          <button className="menu-btn" onClick={onBack}>{t('menu_back')}</button>
        </div>
      </div>
    </div>
  );
}

function GameOverScreen() {
  const setGameState = useGameStore((s) => s.setGameState);
  const resetGame = useGameStore((s) => s.resetGame);

  return (
    <div className="menu-overlay">
      <div className="menu-content gameover">
        <h1 className="game-title">{t('gameover_title')}</h1>
        <p className="game-subtitle">{t('gameover_desc')}</p>
        <div className="menu-buttons">
          <button className="menu-btn" onClick={() => { resetGame(); setGameState('playing'); }}>{t('menu_start')}</button>
          <button className="menu-btn" onClick={() => { resetGame(); setGameState('menu'); }}>{t('menu_main')}</button>
        </div>
      </div>
    </div>
  );
}

function LevelCompleteScreen() {
  const setGameState = useGameStore((s) => s.setGameState);

  return (
    <div className="menu-overlay">
      <div className="menu-content">
        <h1 className="game-title">{t('levelcomplete_title')}</h1>
        <p className="game-subtitle">{t('levelcomplete_desc')}</p>
        <div className="menu-buttons">
          <button className="menu-btn" onClick={() => setGameState('playing')}>{t('menu_start')}</button>
          <button className="menu-btn" onClick={() => setGameState('menu')}>{t('menu_main')}</button>
        </div>
      </div>
    </div>
  );
}
