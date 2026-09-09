import { useEffect, useMemo, useState, ReactNode } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

/**
 * CC0 Kenney furniture models — self-contained GLBs (origin at bottom, y=0 = floor).
 *
 * ModelAsset loads a GLB with a graceful procedural fallback while loading or if
 * the file fails to load, so the game never breaks and never logs console ERRORS
 * when an asset is missing (failures degrade to a `console.warn` + fallback mesh).
 */

export const MODEL_URLS = [
  '/assets/kenney/furniture/bookcaseClosedWide.glb', // Locker (tall cabinet)
  '/assets/kenney/furniture/sideTableDrawers.glb',   // Medical supply cart
  '/assets/kenney/furniture/desk.glb',               // Reception desk
  '/assets/kenney/furniture/computerScreen.glb',     // Terminal screen
  '/assets/kenney/furniture/computerKeyboard.glb',
  '/assets/kenney/furniture/computerMouse.glb',
  '/assets/kenney/furniture/chairDesk.glb',
  '/assets/kenney/furniture/bedSingle.glb',          // Hospital ward beds
  '/assets/kenney/furniture/loungeSofaLong.glb',     // Lobby waiting area
  '/assets/kenney/furniture/plantSmall1.glb',
  '/assets/kenney/furniture/plantSmall2.glb',
  '/assets/kenney/furniture/radio.glb',
  '/assets/kenney/furniture/sideTable.glb',
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
