import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';

// Audio context singleton (created once)
let audioContext: AudioContext | null = null;
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Synthesize sounds (no external files needed for prototype)
const synth = {
  // Footsteps
  footstep: (type: 'concrete' | 'metal' | 'wood' | 'carpet' = 'concrete') => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(type === 'metal' ? 800 : type === 'wood' ? 400 : 200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.Q.value = 1;
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  },
  
  // Door opening
  doorOpen: () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  },
  
  // Pickup sound
  pickup: () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  },
  
  // Weapon fire
  weaponFire: (weapon: string) => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    
    // Noise burst for gunshots
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    noise.buffer = buffer;
    
    switch (weapon) {
      case 'stunGun':
        // Zap sound
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        break;
      case 'pistol':
        // Sharp crack
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        break;
      case 'shotgun':
        // Loud boom
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        break;
      default:
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    }
    
    noise.connect(noiseGain);
    noiseGain.gain.setValueAtTime(0.3, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    noise.connect(ctx.destination);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    noise.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
    noise.stop(ctx.currentTime + 0.1);
  },
  
  // Enemy hit
  enemyHit: () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  },
  
  // Enemy death
  enemyDeath: () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  },
  
  // Ambient horror ambience
  ambient: () => {
    const ctx = getAudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    // Deep drone
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, ctx.currentTime);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(82.5, ctx.currentTime); // Fifth
    
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 5;
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    
    return { osc1, osc2, gain, filter };
  },
  
  // Jump scare
  jumpScare: () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  },
  
  // Heartbeat (when low health or near enemy)
  heartbeat: () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 60;
    
    // Double pulse
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.2);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  },
};

// 3D Audio listener attached to camera
class AudioEmitter {
  private position: THREE.Vector3 = new THREE.Vector3();
  private volume: number = 1;
  private minDistance: number = 1;
  private maxDistance: number = 20;
  private coneInnerAngle: number = Math.PI;
  private coneOuterAngle: number = Math.PI;
  private coneOuterGain: number = 0;
  private ctx: AudioContext;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private panner: PannerNode;
  
  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.gainNode = ctx.createGain();
    this.panner = ctx.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'inverse';
    this.panner.refDistance = 1;
    this.panner.maxDistance = this.maxDistance;
    this.panner.rolloffFactor = 1;
    this.panner.coneInnerAngle = this.coneInnerAngle;
    this.panner.coneOuterAngle = this.coneOuterAngle;
    this.panner.coneOuterGain = this.coneOuterGain;
    
    this.gainNode.connect(this.panner);
    this.panner.connect(ctx.destination);
  }
  
  setPosition(x: number, y: number, z: number) {
    this.position.set(x, y, z);
    this.panner.positionX.value = x;
    this.panner.positionY.value = y;
    this.panner.positionZ.value = z;
  }
  
  setVolume(v: number) {
    this.volume = v;
    this.gainNode.gain.value = v;
  }
  
  play(buffer: AudioBuffer) {
    if (this.source) {
      this.source.stop();
    }
    this.source = this.ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = false;
    this.source.connect(this.gainNode);
    this.source.start();
  }
  
  dispose() {
    if (this.source) {
      this.source.stop();
      this.source.disconnect();
    }
    this.gainNode.disconnect();
    this.panner.disconnect();
  }
}

export function AudioManager() {
  const { camera } = useThree();
  const gameState = useGameStore((s) => s.gameState);
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  
  const ambientNodes = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode; filter: BiquadFilterNode } | null>(null);
  const lastFootstepTime = useRef(0);
  const isMoving = useRef(false);
  const heartbeatTimer = useRef(0);
  
  // Initialize ambient sound
  useEffect(() => {
    const startAmbient = () => {
      if (ambientNodes.current) return;
      ambientNodes.current = synth.ambient();
    };
    
    // Start ambient on user interaction (browser policy)
    const onUserInteraction = () => {
      startAmbient();
      window.removeEventListener('click', onUserInteraction);
      window.removeEventListener('keydown', onUserInteraction);
    };
    
    window.addEventListener('click', onUserInteraction);
    window.addEventListener('keydown', onUserInteraction);
    
    return () => {
      if (ambientNodes.current) {
        ambientNodes.current.osc1.stop();
        ambientNodes.current.osc2.stop();
        ambientNodes.current = null;
      }
      window.removeEventListener('click', onUserInteraction);
      window.removeEventListener('keydown', onUserInteraction);
    };
  }, []);
  
  // Footstep sounds
  useFrame((_, delta) => {
    if (gameState !== 'playing') return;
    
    // Check if moving
    const pos = camera.position;
    const prevPos = (camera as any)._prevPos || pos;
    const speed = pos.distanceTo(prevPos);
    (camera as any)._prevPos = pos.clone();
    
    if (speed > 0.01) {
      isMoving.current = true;
      const now = performance.now();
      if (now - lastFootstepTime.current > 500) { // ~2 steps per second
        lastFootstepTime.current = now;
        synth.footstep('concrete');
      }
    } else {
      isMoving.current = false;
    }
    
    // Heartbeat when low health or nearby enemies
    const healthPercent = health / maxHealth;
    if (healthPercent < 0.3) {
      heartbeatTimer.current += delta;
      if (heartbeatTimer.current > 0.8) {
        heartbeatTimer.current = 0;
        synth.heartbeat();
      }
    }
    
    // Adjust ambient based on tension
    if (ambientNodes.current) {
      const t = ambientNodes.current;
      // Slowly increase drone intensity when health is low
      const targetFreq = 50 + (1 - healthPercent) * 30;
      t.osc1.frequency.setTargetAtTime(targetFreq, getAudioContext().currentTime, 0.1);
      t.filter.frequency.setTargetAtTime(150 + (1 - healthPercent) * 100, getAudioContext().currentTime, 0.1);
    }
  });
  
  // Attach listener to camera
  useEffect(() => {
    const ctx = getAudioContext();
    const listener = ctx.listener;
    
    // Update listener position/orientation
    const updateListener = () => {
      const pos = camera.position;
      const euler = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ');
      const forward = new THREE.Vector3(0, 0, -1).applyEuler(euler);
      
      // Portable API: modern browsers use AudioParams, some (incl. some Chromium builds) use setPosition/setOrientation
      if (typeof (listener as any).setPosition === 'function') {
        (listener as any).setPosition(pos.x, pos.y, pos.z);
        (listener as any).setOrientation(forward.x, forward.y, forward.z, 0, 1, 0);
      } else {
        listener.positionX.value = pos.x;
        listener.positionY.value = pos.y;
        listener.positionZ.value = pos.z;
        listener.forwardX.value = forward.x;
        listener.forwardY.value = forward.y;
        listener.forwardZ.value = forward.z;
        listener.upX.value = 0;
        listener.upY.value = 1;
        listener.upZ.value = 0;
      }
    };
    
    const interval = setInterval(updateListener, 100);
    updateListener();
    
    return () => clearInterval(interval);
  }, [camera]);
  
  return null;
}

// Hook for triggering sounds from components
export function useSound() {
  const play = (sound: keyof typeof synth) => {
    synth[sound]();
  };
  return { play };
}