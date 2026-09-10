import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../stores/gameStore';

export function Flashlight() {
  const { camera } = useThree();
  const { maxFlashlightBattery } = useGameStore.getState();
  const drainBattery = useGameStore((s) => s.drainFlashlightBattery);
  const toggleFlashlight = useGameStore((s) => s.toggleFlashlight);

  const flashlight = useRef<THREE.SpotLight | null>(null);
  const flashlightTarget = useRef<THREE.Object3D | null>(null);
  const lastBatteryDrain = useRef(0);

  // Create flashlight on mount
  useEffect(() => {
    // Flashlight beam
    const light = new THREE.SpotLight(0xffeedd, 30, 40, Math.PI / 6, 0.5, 1.5);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 30;
    light.shadow.bias = -0.0005;
    light.shadow.normalBias = 0.02;
    
    flashlight.current = light;
    camera.add(light);

    // Target for the flashlight
    const target = new THREE.Object3D();
    target.position.set(0, 0, -1);
    flashlightTarget.current = target;
    camera.add(target);
    light.target = target;

    // Flashlight lens flare / glow
    const lensGeometry = new THREE.RingGeometry(0.02, 0.05, 32);
    const lensMaterial = new THREE.MeshBasicMaterial({
      color: 0xffeedd,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.position.set(0, -0.05, -0.3);
    lens.rotation.x = -Math.PI / 2;
    camera.add(lens);

    // Light cookie for flashlight texture effect
    // Create a procedural cookie texture
    const cookieSize = 256;
    const cookieCanvas = document.createElement('canvas');
    cookieCanvas.width = cookieSize;
    cookieCanvas.height = cookieSize;
    const ctx = cookieCanvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(
      cookieSize / 2, cookieSize / 2, 0,
      cookieSize / 2, cookieSize / 2, cookieSize / 2
    );
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cookieSize, cookieSize);
    
    const cookieTexture = new THREE.CanvasTexture(cookieCanvas);
    (light as unknown as { cookie?: THREE.Texture }).cookie = cookieTexture;

    return () => {
      camera.remove(light);
      camera.remove(target);
      camera.remove(lens);
      light.dispose();
      lensGeometry.dispose();
      lensMaterial.dispose();
      cookieTexture.dispose();
    };
  }, [camera]);

  // Handle flashlight toggle (F key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyF') {
        toggleFlashlight();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFlashlight]);

  // Update flashlight state and battery drain
  useFrame((_, delta) => {
    if (!flashlight.current) return;

    const state = useGameStore.getState();
    const isOn = state.flashlightOn;
    
    flashlight.current.intensity = isOn ? 2 : 0;
    flashlight.current.visible = isOn;

    // Battery drain
    if (isOn && state.flashlightBattery > 0) {
      lastBatteryDrain.current += delta;
      if (lastBatteryDrain.current >= 1) {
        drainBattery(1.5); // Drain 1.5% per second
        lastBatteryDrain.current = 0;
      }
      
      // Flicker when battery low
      if (state.flashlightBattery < 15) {
        const flicker = Math.sin(performance.now() * 0.01) * 0.3 + 0.7;
        flashlight.current.intensity = 2 * flicker;
      }
    } else if (state.flashlightBattery <= 0) {
      // Auto turn off when battery dead
      if (state.flashlightOn) {
        state.toggleFlashlight();
      }
    }
  });

  // Visual indicator for battery level
  useFrame(() => {
    if (!flashlight.current) return;
    
    const state = useGameStore.getState();
    const batteryPercent = state.flashlightBattery / maxFlashlightBattery;
    
    // Color temperature shifts as battery drains
    if (batteryPercent < 0.3) {
      flashlight.current.color.setHSL(0.1, 0.8, 0.5); // Yellowish
    } else if (batteryPercent < 0.1) {
      flashlight.current.color.setHSL(0.05, 0.9, 0.4); // Reddish
    } else {
      flashlight.current.color.setHSL(0.12, 0.3, 0.95); // Cool white
    }
  });

  return null; // This component doesn't render anything directly
}