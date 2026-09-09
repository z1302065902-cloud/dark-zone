import { Suspense, useState } from 'react';
import { GameCanvas } from './GameCanvas';
import { GameUI } from './ui/GameUI';
import { useGameStore } from '../stores/gameStore';
import { t, setLang, getLang } from '../utils/i18n';
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
    </div>
  );
}

function MainMenu() {
  const setGameState = useGameStore((s) => s.setGameState);
  const resetGame = useGameStore((s) => s.resetGame);
  const [lang, setLangState] = useState(getLang());
  const toggleLang = () => {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
    setLangState(next);
  };

  const startGame = () => {
    resetGame();
    setGameState('playing');
  };

  return (
    <div className="menu-overlay">
      <div className="menu-content">
        <h1 className="game-title">黑域：诡城</h1>
        <p className="game-subtitle">DARK ZONE</p>
        <div className="menu-buttons">
          <button className="menu-btn" onClick={startGame}>{t('menu_start')}</button>
          <button className="menu-btn" onClick={() => setGameState('playing')}>{t('hud_close') === 'TAB close' ? 'Continue' : '继续游戏'}</button>
          <button className="menu-btn" onClick={toggleLang} id="langBtn">{lang === 'zh' ? 'English' : '中文'}</button>
        </div>
        <p className="game-credit">Cyber Horror FPS · Three.js · R3F · Rapier</p>
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
          <button className="menu-btn" onClick={() => setGameState('menu')}>{t('hud_inventory') === 'INVENTORY' ? 'Main Menu' : '主菜单'}</button>
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
          <button className="menu-btn" onClick={() => setGameState('menu')}>{t('hud_inventory') === 'INVENTORY' ? 'Main Menu' : '主菜单'}</button>
        </div>
      </div>
    </div>
  );
}
