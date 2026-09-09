import { Suspense } from 'react';
import { GameCanvas } from './GameCanvas';
import { GameUI } from './ui/GameUI';
import { useGameStore } from '../stores/gameStore';
import '../styles/game.css';

const LoadingFallback = () => (
  <div className="loading-screen">
    <div className="loading-spinner"></div>
    <p>正在加载黑域：诡城...</p>
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
          <button className="menu-btn" onClick={startGame}>开始游戏</button>
          <button className="menu-btn" onClick={() => setGameState('playing')}>继续游戏</button>
          <button className="menu-btn" onClick={() => {}}>设置</button>
          <button className="menu-btn" onClick={() => {}}>退出</button>
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
        <h1 className="game-title">游戏结束</h1>
        <div className="menu-buttons">
          <button className="menu-btn" onClick={() => { resetGame(); setGameState('playing'); }}>重新开始</button>
          <button className="menu-btn" onClick={() => setGameState('menu')}>主菜单</button>
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
        <h1 className="game-title">关卡完成</h1>
        <div className="menu-buttons">
          <button className="menu-btn" onClick={() => setGameState('playing')}>下一关</button>
          <button className="menu-btn" onClick={() => setGameState('menu')}>主菜单</button>
        </div>
      </div>
    </div>
  );
}