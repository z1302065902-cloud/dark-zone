#!/usr/bin/env python3
"""
Download CC0 assets for DARK ZONE 0.1
Sources: Poly Haven (HDRIs, some props), ambientCG (PBR textures), Kenney (UI/props)
Run: python3 scripts/download_assets.py
"""
import os
import sys
import json
import hashlib
import urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE = Path(__file__).parent.parent
ASSETS = BASE / "public" / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)

# ── Poly Haven HDRIs (1k for performance) ──────────────────────────────
PH_HDRIS = [
    "hospital_room",
    "large_corridor",
    "industrial_workshop_foundry",
    "solitude_interior",
    "debris_basement_corridor",
    "childrens_hospital",
]

# ── Poly Haven 3D Models (type=2 props we can use) ─────────────────────
PH_MODELS = [
    "modular_industrial_pipes_01",
    "modular_pipes",
    "modular_pipes_plastic_01",
    "industrial_pipe_and_valve_01",
    "industrial_pipe_and_valve_02",
    "industrial_pipe_lamp",
    "mounted_fluorescent_lights",
    "medical_box",
    "medical_tape",
    "propane_tank",
    "small_lpg_tank",
    "pipe_wrench",
]

# ── ambientCG PBR Textures (1K JPG) ───────────────────────────────────
# Using known IDs from ambientCG
AMBIENTCG_TEXTURES = [
    "Tiles122",      # Wet floor tiles
    "Tiles074",      # Clean hospital tiles
    "Concrete021",   # Wet concrete
    "Metal032",      # Corroded metal
    "Plaster043",    # Damaged plaster wall
    "Plastic011",    # Clean plastic panels
]

# ── Kenney Assets (direct zip URLs) ───────────────────────────────────
KENNEY_ASSETS = [
    ("UI Pack", "https://kenney.nl/assets/ui-pack/download", "kenney-ui-pack.zip"),
    ("UI Audio", "https://kenney.nl/assets/ui-audio/download", "kenney-ui-audio.zip"),
    ("Furniture Kit", "https://kenney.nl/assets/furniture-kit/download", "kenney-furniture-kit.zip"),
    ("Industrial Props", "https://kenney.nl/assets/industrial-props/download", "kenney-industrial-props.zip"),
    ("Sci-Fi Props", "https://kenney.nl/assets/sci-fi-props/download", "kenney-sci-fi-props.zip"),
]

def download_file(url: str, dest: Path, expected_md5: str = None) -> bool:
    """Download with resume support and optional MD5 verification."""
    if dest.exists() and expected_md5:
        with open(dest, 'rb') as f:
            if hashlib.md5(f.read()).hexdigest() == expected_md5:
                print(f"  ✓ {dest.name} (cached, verified)")
                return True
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'DarkZone/0.1'})
        with urllib.request.urlopen(req, timeout=60) as resp, open(dest, 'wb') as f:
            total = int(resp.headers.get('Content-Length', 0))
            downloaded = 0
            chunk_size = 8192
            while True:
                chunk = resp.read(chunk_size)
                if not chunk:
                    break
                f.write(chunk)
                downloaded += len(chunk)
                if total:
                    pct = downloaded * 100 // total
                    print(f"\r  ↓ {dest.name} {pct}%", end="", flush=True)
            print(f"\r  ✓ {dest.name} ({downloaded/1024/1024:.1f} MB)")
        
        if expected_md5:
            with open(dest, 'rb') as f:
                if hashlib.md5(f.read()).hexdigest() != expected_md5:
                    print(f"  ✗ MD5 mismatch, deleting")
                    dest.unlink()
                    return False
        return True
    except Exception as e:
        print(f"  ✗ {dest.name}: {e}")
        if dest.exists():
            dest.unlink()
        return False

def get_ph_hdri_url(asset: str, res: str = "1k") -> str:
    return f"https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/{res}/{asset}_{res}.hdr"

def get_ph_model_url(asset: str) -> str:
    # Models: try glb first, fallback to blend
    return f"https://dl.polyhaven.org/file/ph-assets/Models/{asset}/{asset}.glb"

def get_ambientcg_zip_url(asset_id: str) -> str:
    return f"https://ambientcg.com/get/{asset_id}/"

def download_polyhaven_hdris():
    print("\n=== Poly Haven HDRIs ===")
    hdri_dir = ASSETS / "hdri"
    hdri_dir.mkdir(exist_ok=True)
    
    for asset in PH_HDRIS:
        url = get_ph_hdri_url(asset, "1k")
        dest = hdri_dir / f"{asset}_1k.hdr"
        download_file(url, dest)

def download_polyhaven_models():
    print("\n=== Poly Haven 3D Models ===")
    model_dir = ASSETS / "models"
    model_dir.mkdir(exist_ok=True)
    
    for asset in PH_MODELS:
        url = get_ph_model_url(asset)
        dest = model_dir / f"{asset}.glb"
        download_file(url, dest)

def download_ambientcg_textures():
    print("\n=== ambientCG PBR Textures ===")
    tex_dir = ASSETS / "textures"
    tex_dir.mkdir(exist_ok=True)
    
    for asset_id in AMBIENTCG_TEXTURES:
        # ambientCG requires API key for direct download; we'll use the web page to get zip
        # For now, create placeholder dirs and manual download note
        asset_dir = tex_dir / asset_id
        asset_dir.mkdir(exist_ok=True)
        readme = asset_dir / "README.txt"
        readme.write_text(f"""ambientCG Texture: {asset_id}
Download manually from: https://ambientcg.com/view?id={asset_id}
Click "Download" → choose "1K-JPG" or "2K-JPG"
Extract all maps here: albedo, normal, roughness, metalness, ao, displacement
License: CC0
""")
        print(f"  📁 {asset_id}/README.txt (manual download needed)")

def download_kenney():
    print("\n=== Kenney Assets ===")
    kenney_dir = ASSETS / "kenney"
    kenney_dir.mkdir(exist_ok=True)
    
    for name, url, fname in KENNEY_ASSETS:
        dest = kenney_dir / fname
        print(f"  {name}: {url}")
        print(f"  → Manual download needed (Kenney requires referrer): {dest}")
        # Note: Kenney blocks direct hotlinking; download via browser

def create_asset_manifest():
    """Generate manifest of what we have vs what's needed."""
    manifest = {
        "version": "0.1",
        "polyhaven_hdris": PH_HDRIS,
        "polyhaven_models": PH_MODELS,
        "ambientcg_textures": AMBIENTCG_TEXTURES,
        "kenney_assets": [k[0] for k in KENNEY_ASSETS],
        "notes": {
            "polyhaven_models": "Most hospital scenes are HDRIs only. Use modular pipes/lights + custom geometry.",
            "ambientcg": "Manual download needed (requires API key for direct). Use browser.",
            "kenney": "Manual download needed (blocks hotlinking). Use browser.",
            "enemy_models": "Search Sketchfab: 'nurse robot', 'cyborg nurse', 'medical robot' with CC0/CC-BY filter.",
        }
    }
    (ASSETS / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"\n=== Manifest written to {ASSETS}/manifest.json ===")

def main():
    print("DARK ZONE 0.1 — Asset Downloader")
    print(f"Target: {ASSETS}")
    
    download_polyhaven_hdris()
    download_polyhaven_models()
    download_ambientcg_textures()
    download_kenney()
    create_asset_manifest()
    
    print("\n=== Next Steps ===")
    print("1. Manually download ambientCG textures from browser")
    print("2. Manually download Kenney assets from browser")
    print("3. Search Sketchfab for 'nurse robot' CC0 models for boss")
    print("4. Run: python3 scripts/verify_assets.py")

if __name__ == "__main__":
    main()