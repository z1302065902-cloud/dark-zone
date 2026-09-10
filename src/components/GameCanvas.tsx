import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from '@react-three/postprocessing';
import { GameScene } from './GameScene';
import { useGameStore } from '../stores/gameStore';
import { t } from '../utils/i18n';
import { levelConfigs } from './environment/Level';
import { useEffect, useRef } from 'react';

export function GameCanvas() {
  const gameState = useGameStore((s) => s.gameState);
  const setGameState = useGameStore((s) => s.setGameState);
  const currentLevel = useGameStore((s) => s.currentLevel);
  const canvasRef = useRef<HTMLDivElement>(null);

  const levelConfig = levelConfigs[currentLevel] || levelConfigs.hospital;
  const fogArgs: [number, number, number] = [levelConfig.fogColor, levelConfig.fogNear, levelConfig.fogFar];

  // Handle pause on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState === 'playing') setGameState('paused');
        else if (gameState === 'paused') setGameState('playing');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, setGameState]);

  return (
    <div ref={canvasRef} className="canvas-container">
      <Canvas
        camera={{ position: [0, 1.6, 0], fov: 75, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
        shadows={true}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = 1; // PCFSoftShadowMap
          gl.toneMapping = 1; // ACESFilmicToneMapping
          gl.toneMappingExposure = 1;
        }}
      >
        <color attach="background" args={[0x000000]} />
        <fog attach="fog" args={fogArgs} />

        {/* Lighting */}
        <ambientLight intensity={0.3} color={0x1a1a2e} />
        
        {/* Post-processing */}
        <EffectComposer multisampling={4}>
          <Vignette
            darkness={1.2}
            offset={0.3}
            eskil={false}
          />
          <Noise
            opacity={0.03}
            premultiply={false}
          />
          <ChromaticAberration
            offset={[0.0005, 0.0005]}
            radialModulation={true}
            modulationOffset={0.5}
          />
          <Bloom
            intensity={0.8}
            mipmapBlur={true}
            luminanceThreshold={0.85}
            luminanceSmoothing={0.025}
          />
        </EffectComposer>

        {/* Game Scene with physics */}
        <Physics gravity={[0, -28, 0]}>
          <GameScene />
        </Physics>
      </Canvas>
      
      {gameState === 'paused' && (
        <div className="pause-overlay">
          <div className="pause-menu">
            <h2>{t('pause_title')}</h2>
            <button onClick={() => setGameState('playing')}>{t('pause_resume')}</button>
            <button onClick={() => setGameState('menu')}>{t('pause_menu')}</button>
          </div>
        </div>
      )}
    </div>
  );
}