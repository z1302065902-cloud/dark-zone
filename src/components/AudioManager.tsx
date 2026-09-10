import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';
import { useSettingsStore } from '../stores/settingsStore';

/* ============================================================
   DARK ZONE — procedural audio system (Web Audio API).
   All sounds are synthesized at runtime (no external files), so
   the prototype ships fully self-contained. CC0 samples can be
   swapped in later.
   ============================================================ */

// Audio context singleton (created once, resumed on first gesture)
let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;

/** Apply the current master volume setting to the master gain node. */
export const applyMasterVolume = () => {
  if (!masterGain) return;
  try {
    masterGain.gain.setTargetAtTime(
      useSettingsStore.getState().masterVolume,
      masterGain.context.currentTime,
      0.05
    );
  } catch { /* noop */ }
};

export const getAudioContext = () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGain = audioContext.createGain();
      masterGain.gain.value = useSettingsStore.getState().masterVolume;
      masterGain.connect(audioContext.destination);
    } catch {
      audioContext = null;
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
};

/** Route any synth node through the master volume control. */
export const masterOutput = (): AudioNode | null => masterGain;

/** Build a short noise buffer (for gunshots, crackles, etc.) */
function noiseBuffer(seconds: number, decay = 6): AudioBuffer | null {
  const ctx = getAudioContext();
  if (!ctx) return null;
  const len = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * (1 / decay)));
  }
  return buffer;
}

const synth = {
  footstep: (type: 'concrete' | 'metal' | 'wood' | 'carpet' = 'concrete') => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(type === 'metal' ? 700 : type === 'wood' ? 380 : 190, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.09);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, t);
    gain.gain.setValueAtTime(type === 'metal' ? 0.22 : 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    osc.connect(filter); filter.connect(gain); gain.connect(masterOutput()!);
    osc.start(t); osc.stop(t + 0.15);
  },

  doorOpen: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.linearRampToValueAtTime(95, t + 0.35);
    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.connect(gain); gain.connect(masterOutput()!);
    osc.start(t); osc.stop(t + 0.5);
  },

  doorCreak: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.linearRampToValueAtTime(95, t + 0.12);
    osc.frequency.linearRampToValueAtTime(140, t + 0.22);
    osc.frequency.linearRampToValueAtTime(90, t + 0.4);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 4;
    osc.connect(filter); filter.connect(gain); gain.connect(masterOutput()!);
    osc.start(t); osc.stop(t + 0.5);
  },

  doorDeny: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.linearRampToValueAtTime(120, t + 0.2);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain); gain.connect(masterOutput()!);
    osc.start(t); osc.stop(t + 0.35);
  },

  pickup: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(950, t + 0.12);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain); gain.connect(masterOutput()!);
    osc.start(t); osc.stop(t + 0.28);
  },

  weaponFire: (weapon: string) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    const noise = ctx.createBufferSource();
    const buf = noiseBuffer(weapon === 'shotgun' ? 0.35 : weapon === 'stunGun' ? 0.2 : 0.12, weapon === 'shotgun' ? 4 : 8);
    if (!buf) return;
    noise.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = weapon === 'shotgun' ? 2500 : weapon === 'pistol' ? 5000 : 9000;
    noise.connect(lp); lp.connect(gain); gain.connect(masterOutput()!);
    gain.gain.setValueAtTime(weapon === 'shotgun' ? 0.5 : weapon === 'pistol' ? 0.35 : 0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (weapon === 'shotgun' ? 0.35 : 0.12));

    // tonal body for stunGun (electric zap)
    if (weapon === 'stunGun') {
      const osc = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(500, t + 0.18);
      g2.gain.setValueAtTime(0.2, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(g2); g2.connect(masterOutput()!);
      osc.start(t); osc.stop(t + 0.22);
    }
    noise.start(t);
  },

  weaponReload: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    // two clicks (mag out / mag in)
    for (let i = 0; i < 2; i++) {
      const t2 = t + i * 0.35;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(900 - i * 300, t2);
      g.gain.setValueAtTime(0.12, t2);
      g.gain.exponentialRampToValueAtTime(0.001, t2 + 0.06);
      osc.connect(g); g.connect(masterOutput()!);
      osc.start(t2); osc.stop(t2 + 0.08);
    }
  },

  dryFire: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.05);
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.connect(g); g.connect(masterOutput()!);
    osc.start(t); osc.stop(t + 0.08);
  },

  enemyHit: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.15);
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain); gain.connect(masterOutput()!);
    osc.start(t); osc.stop(t + 0.22);
  },

  enemyDeath: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.6);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.connect(gain); gain.connect(masterOutput()!);
    osc.start(t); osc.stop(t + 0.75);
    // metallic screech layer
    const n = ctx.createBufferSource();
    const buf = noiseBuffer(0.5, 4);
    if (buf) {
      n.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 3;
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.12, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      n.connect(bp); bp.connect(g2); g2.connect(masterOutput()!);
      n.start(t);
    }
  },

  enemyGrowl: (type: 'see' | 'attack' = 'see') => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(type === 'attack' ? 130 : 90, t);
    osc.frequency.linearRampToValueAtTime(type === 'attack' ? 70 : 55, t + 0.4);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 300;
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc.connect(lp); lp.connect(gain); gain.connect(masterOutput()!);
    osc.start(t); osc.stop(t + 0.6);
  },

  electricCrackle: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const n = ctx.createBufferSource();
    const buf = noiseBuffer(0.15, 3);
    if (!buf) return;
    n.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 2500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    n.connect(hp); hp.connect(g); g.connect(masterOutput()!);
    n.start(t);
  },

  breath: (type: 'heavy' | 'hurt' = 'heavy') => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(type === 'hurt' ? 140 : 110, t);
    osc.frequency.linearRampToValueAtTime(type === 'hurt' ? 90 : 70, t + 0.35);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.1);
    g.gain.linearRampToValueAtTime(0.01, t + 0.4);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 800;
    osc.connect(lp); lp.connect(g); g.connect(masterOutput()!);
    osc.start(t); osc.stop(t + 0.5);
  },

  heartbeat: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 58;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.05);
    g.gain.linearRampToValueAtTime(0, t + 0.14);
    g.gain.linearRampToValueAtTime(0.35, t + 0.19);
    g.gain.linearRampToValueAtTime(0, t + 0.32);
    osc.connect(g); g.connect(masterOutput()!);
    osc.start(t); osc.stop(t + 0.4);
  },

  jumpScare: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.35);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc.connect(gain); gain.connect(masterOutput()!);
    osc.start(t); osc.stop(t + 0.6);
    const n = ctx.createBufferSource();
    const buf = noiseBuffer(0.4, 3);
    if (buf) {
      n.buffer = buf;
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.25, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      n.connect(g2); g2.connect(masterOutput()!);
      n.start(t);
    }
  },

  metalClang: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.25);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1500;
    g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(lp); lp.connect(g); g.connect(masterOutput()!);
    osc.start(t); osc.stop(t + 0.35);
  },

  ambience: () => {
    const ctx = getAudioContext();
    if (!ctx) return { osc1: null as unknown as OscillatorNode, osc2: null as unknown as OscillatorNode, gain: null as unknown as GainNode, filter: null as unknown as BiquadFilterNode };
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, ctx.currentTime);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(82.5, ctx.currentTime);
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 5;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    osc1.connect(filter); osc2.connect(filter);
    filter.connect(gain); gain.connect(masterOutput()!);
    osc1.start(ctx.currentTime); osc2.start(ctx.currentTime);
    return { osc1, osc2, gain, filter };
  },
};

/** Public, safe-to-call sound API (no-op before user gesture / no ctx) */
export const dzSound = {
  footstep: (t?: 'concrete' | 'metal' | 'wood' | 'carpet') => synth.footstep(t),
  doorOpen: () => synth.doorOpen(),
  doorCreak: () => synth.doorCreak(),
  doorDeny: () => synth.doorDeny(),
  pickup: () => synth.pickup(),
  fire: (w: string) => synth.weaponFire(w),
  reload: () => synth.weaponReload(),
  dry: () => synth.dryFire(),
  enemyHit: () => synth.enemyHit(),
  enemyDeath: () => synth.enemyDeath(),
  growl: (t?: 'see' | 'attack') => synth.enemyGrowl(t),
  electric: () => synth.electricCrackle(),
  breath: (t?: 'heavy' | 'hurt') => synth.breath(t),
  heartbeat: () => synth.heartbeat(),
  jumpScare: () => synth.jumpScare(),
  metal: () => synth.metalClang(),
};

/* ============================================================
   AudioManager component — runs ambient drone, footstep-by-motion,
   player breathing, low-health heartbeat, and reacts to game events.
   ============================================================ */
export function AudioManager() {
  const { camera } = useThree();
  const gameState = useGameStore((s) => s.gameState);
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const masterVolume = useSettingsStore((s) => s.masterVolume);

  // React to master-volume changes in real time
  useEffect(() => {
    applyMasterVolume();
  }, [masterVolume]);

  const ambientNodes = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode; filter: BiquadFilterNode } | null>(null);
  const lastFootstepTime = useRef(0);
  const heartbeatTimer = useRef(0);
  const breathTimer = useRef(0);

  // Initialize ambient on first user gesture
  useEffect(() => {
    const startAmbient = () => {
      if (ambientNodes.current) return;
      ambientNodes.current = synth.ambience();
    };
    const onUserInteraction = () => {
      startAmbient();
      window.removeEventListener('click', onUserInteraction);
      window.removeEventListener('keydown', onUserInteraction);
    };
    window.addEventListener('click', onUserInteraction);
    window.addEventListener('keydown', onUserInteraction);
    return () => {
      if (ambientNodes.current) {
        try { ambientNodes.current.osc1.stop(); ambientNodes.current.osc2.stop(); } catch { /* noop */ }
        ambientNodes.current = null;
      }
      window.removeEventListener('click', onUserInteraction);
      window.removeEventListener('keydown', onUserInteraction);
    };
  }, []);

  // React to game events (player hit → jumpscare; enemy killed → death sound already emitted by Enemy)
  useEffect(() => {
    const onPlayerHit = () => {
      synth.jumpScare();
    };
    window.addEventListener('dz:player-hit', onPlayerHit);
    return () => window.removeEventListener('dz:player-hit', onPlayerHit);
  }, []);

  // Footsteps / breathing / heartbeat per frame
  useFrame((_, delta) => {
    if (gameState !== 'playing') return;

    const pos = camera.position;
    const prevPos = (camera as any)._prevPos || pos;
    const speed = pos.distanceTo(prevPos);
    (camera as any)._prevPos = pos.clone();

    // Footsteps when moving
    if (speed > 0.01) {
      const now = performance.now();
      const stepInterval = speed > 6 ? 340 : 500;
      if (now - lastFootstepTime.current > stepInterval) {
        lastFootstepTime.current = now;
        const surface: 'concrete' | 'metal' = Math.random() < 0.3 ? 'metal' : 'concrete';
        synth.footstep(surface);
      }
      // Heavy breathing while sprinting
      if (speed > 6) {
        breathTimer.current += delta;
        if (breathTimer.current > 1.1) {
          breathTimer.current = 0;
          synth.breath('heavy');
        }
      }
    }

    // Low health: fast breathing + heartbeat
    const healthPercent = health / maxHealth;
    if (healthPercent < 0.3) {
      breathTimer.current += delta;
      if (breathTimer.current > (healthPercent < 0.15 ? 0.9 : 1.4)) {
        breathTimer.current = 0;
        synth.breath('hurt');
      }
      heartbeatTimer.current += delta;
      if (heartbeatTimer.current > (healthPercent < 0.15 ? 0.5 : 0.8)) {
        heartbeatTimer.current = 0;
        synth.heartbeat();
      }
    }

    // Drone tension rises with low health
    if (ambientNodes.current) {
      const t = ambientNodes.current;
      const targetFreq = 50 + (1 - healthPercent) * 30;
      t.osc1.frequency.setTargetAtTime(targetFreq, getAudioContext()?.currentTime ?? 0, 0.1);
      t.filter.frequency.setTargetAtTime(150 + (1 - healthPercent) * 120, getAudioContext()?.currentTime ?? 0, 0.1);
    }
  });

  // Audio listener attached to camera
  useEffect(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const listener = ctx.listener;
    const updateListener = () => {
      const p = camera.position;
      const euler = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ');
      const forward = new THREE.Vector3(0, 0, -1).applyEuler(euler);
      if (typeof (listener as any).setPosition === 'function') {
        (listener as any).setPosition(p.x, p.y, p.z);
        (listener as any).setOrientation(forward.x, forward.y, forward.z, 0, 1, 0);
      } else {
        listener.positionX.value = p.x;
        listener.positionY.value = p.y;
        listener.positionZ.value = p.z;
        listener.forwardX.value = forward.x;
        listener.forwardY.value = forward.y;
        listener.forwardZ.value = forward.z;
        listener.upX.value = 0;
        listener.upY.value = 1;
        listener.upZ.value = 0;
      }
    };
    updateListener();
    const interval = setInterval(updateListener, 100);
    return () => clearInterval(interval);
  }, [camera]);

  return null;
}
