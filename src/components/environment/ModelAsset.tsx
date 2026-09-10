import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

/**
 * CC0 Kenney furniture models — self-contained GLBs (origin at bottom, y=0 = floor).
 *
 * ModelAsset loads a GLB with a graceful procedural fallback while loading or if
 * the file fails to load, so the game never breaks and never logs console ERRORS
 * when an asset is missing (failures degrade to a `console.warn` + fallback mesh).
 */

/* BASE_URL-aware asset paths — works on GitHub Pages sub-path, Vercel, and itch.io */
const ASSET_BASE = import.meta.env.BASE_URL + 'assets/kenney/furniture/';

export const MODEL_URLS = [
  ASSET_BASE + 'bookcaseClosedWide.glb', // Locker (tall cabinet)
  ASSET_BASE + 'sideTableDrawers.glb',   // Medical supply cart
  ASSET_BASE + 'desk.glb',               // Reception desk
  ASSET_BASE + 'computerScreen.glb',     // Terminal screen
  ASSET_BASE + 'computerKeyboard.glb',
  ASSET_BASE + 'computerMouse.glb',
  ASSET_BASE + 'chairDesk.glb',
  ASSET_BASE + 'bedSingle.glb',          // Hospital ward beds
  ASSET_BASE + 'loungeSofaLong.glb',     // Lobby waiting area
  ASSET_BASE + 'plantSmall1.glb',
  ASSET_BASE + 'plantSmall2.glb',
  ASSET_BASE + 'radio.glb',
  ASSET_BASE + 'sideTable.glb',
];

/* Module-level promise cache — dedupes parallel loads, survives re-mounts */
const gltfCache = new Map<string, Promise<THREE.Group>>();
const loader = new GLTFLoader();

function loadModel(url: string): Promise<THREE.Group> {
  if (!gltfCache.has(url)) {
    gltfCache.set(
      url,
      new Promise((resolve, reject) => {
        loader.load(url, (gltf) => resolve(gltf.scene), undefined, (err) => {
          console.warn('[ModelAsset] load failed, using fallback:', url, err);
          reject(err);
        });
      })
    );
  }
  return gltfCache.get(url)!;
}

/** Preload every model in the background (called once from Level mount). */
export function preloadModels() {
  MODEL_URLS.forEach((u) => {
    loadModel(u).catch(() => {
      /* already warned; fallback handles rendering */
    });
  });
}

export interface ModelAssetProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  /** Rendered while loading or on failure (existing procedural placeholder). */
  fallback?: ReactNode;
}

/** Renders a GLB model (bottom-origin) with a placeholder while loading / on failure. */
export function ModelAsset({ url, position, rotation, scale, fallback = null }: ModelAssetProps) {
  const [scene, setScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    let alive = true;
    setScene(null);
    loadModel(url)
      .then((s) => {
        if (alive) setScene(s);
      })
      .catch(() => {
        /* keep null → fallback */
      });
    return () => {
      alive = false;
    };
  }, [url]);

  const obj = useMemo(() => {
    if (!scene) return null;
    const clone = scene.clone(true);
    clone.name = 'cc0model:' + url.split('/').pop();
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return clone;
  }, [scene, url]);

  if (!obj) return <>{fallback}</>;
  return <primitive object={obj} position={position} rotation={rotation} scale={scale} />;
}
