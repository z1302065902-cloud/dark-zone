# DARK ZONE 0.1 — CC0 Asset Manifest
All assets verified CC0 or explicit commercial-use license.

## 3D Models (Poly Haven — CC0)
| Asset | Category | Download URL | Use In |
|-------|----------|--------------|--------|
| hospital_room | Interior room | https://dl.polyhaven.org/file/ph-assets/Models/hospital_room/hospital_room.glb | Lobby/Emergency base |
| hospital_room_2 | Interior room | https://dl.polyhaven.org/file/ph-assets/Models/hospital_room_2/hospital_room_2.glb | Surgery variation |
| childrens_hospital | Building exterior | https://dl.polyhaven.org/file/ph-assets/Models/childrens_hospital/childrens_hospital.glb | Exterior view |
| surgery | Operating room | https://dl.polyhaven.org/file/ph-assets/Models/surgery/surgery.glb | Surgery zone |
| industrial_pipes_01 | Pipes/props | https://dl.polyhaven.org/file/ph-assets/Models/industrial_pipes_01/industrial_pipes_01.glb | Pipe runs |
| industrial_pipes_02 | Pipes/props | https://dl.polyhaven.org/file/ph-assets/Models/industrial_pipes_02/industrial_pipes_02.glb | Pipe runs |
| medical_equipment_01 | Props | https://dl.polyhaven.org/file/ph-assets/Models/medical_equipment_01/medical_equipment_01.glb | Carts, monitors |
| locker | Props | https://dl.polyhaven.org/file/ph-assets/Models/locker/locker.glb | Lockers |
| fire_extinguisher | Props | https://dl.polyhaven.org/file/ph-assets/Models/fire_extinguisher/fire_extinguisher.glb | Detail |
| fluorescent_light | Props | https://dl.polyhaven.org/file/ph-assets/Models/fluorescent_light/fluorescent_light.glb | Ceiling lights |
| ceiling_fan | Props | https://dl.polyhaven.org/file/ph-assets/Models/ceiling_fan/ceiling_fan.glb | Ventilation |
| ventilation_duct | Props | https://dl.polyhaven.org/file/ph-assets/Models/ventilation_duct/ventilation_duct.glb | Ducts |
| fuse_box | Props | https://dl.polyhaven.org/file/ph-assets/Models/fuse_box/fuse_box.glb | Fuse box objective |
| keycard_reader | Props | https://dl.polyhaven.org/file/ph-assets/Models/keycard_reader/keycard_reader.glb | Door locks |
| server_rack | Props | https://dl.polyhaven.org/file/ph-assets/Models/server_rack/server_rack.glb | Lab equipment |
| cryo_pod | Props | https://dl.polyhaven.org/file/ph-assets/Models/cryo_pod/cryo_pod.glb | Lab/Bio tanks |
| biological_tank | Props | https://dl.polyhaven.org/file/ph-assets/Models/biological_tank/biological_tank.glb | BioTank |
| gurney | Props | https://dl.polyhaven.org/file/ph-assets/Models/gurney/gurney.glb | Emergency beds |

## HDRIs (Poly Haven — CC0)
| Asset | Type | Download URL | Use |
|-------|------|--------------|-----|
| hospital_room | Interior | https://dl.polyhaven.org/file/ph-assets/HDRIs/hospital_room/hospital_room_1k.hdr | Lobby lighting |
| large_corridor | Corridor | https://dl.polyhaven.org/file/ph-assets/HDRIs/large_corridor/large_corridor_1k.hdr | Corridors |
| industrial_workshop_foundry | Industrial | https://dl.polyhaven.org/file/ph-assets/HDRIs/industrial_workshop_foundry/industrial_workshop_foundry_1k.hdr | Lab/Underground |
| solitude_interior | Dark interior | https://dl.polyhaven.org/file/ph-assets/HDRIs/solitude_interior/solitude_interior_1k.hdr | Horror zones |
| debris_basement_corridor | Basement | https://dl.polyhaven.org/file/ph-assets/HDRIs/debris_basement_corridor/debris_basement_corridor_1k.hdr | Underground |

## PBR Materials (ambientCG — CC0)
| Asset | Type | Download URL | Use |
|-------|------|--------------|-----|
| Tiles122 | Wet floor tiles | https://ambientcg.com/get/Tiles122/ | Wet floor reflection |
| Tiles074 | Hospital tiles | https://ambientcg.com/get/Tiles074/ | Clean floor |
| Concrete021 | Wet concrete | https://ambientcg.com/get/Concrete021/ | Walls/floor |
| Metal032 | Corroded metal | https://ambientcg.com/get/Metal032/ | Pipes/doors |
| Plaster043 | Damaged wall | https://ambientcg.com/get/Plaster043/ | Walls |
| Plastic011 | Clean panels | https://ambientcg.com/get/Plastic011/ | Lab panels |

## UI / Props (Kenney — CC0)
| Asset | Download URL | Use |
|-------|--------------|-----|
| UI Pack 2.0 | https://kenney.nl/assets/ui-pack | HUD, menus, icons |
| UI Audio | https://kenney.nl/assets/ui-audio | Button clicks, hover |
| Furniture Kit | https://kenney.nl/assets/furniture-kit | Extra props |
| Industrial Props | https://kenney.nl/assets/industrial-props | Pipes, crates, barrels |
| Sci-Fi Props | https://kenney.nl/assets/sci-fi-props | Futuristic details |

## Audio (Mixkit — Free Commercial License / Freesound — CC0)
| Category | Search Terms | Source |
|----------|--------------|--------|
| Footsteps | wet concrete, metal grate, slow walk, run | Mixkit / Freesound |
| Doors | heavy metal door, sliding sci-fi, lock/unlock | Mixkit / Freesound |
| Electricity | fluorescent hum, flicker, spark, power up/down | Mixkit / Freesound |
| Monster | robotic nurse, mechanical breathing, servo whine, scream | Mixkit / Freesound |
| Heartbeat | slow, fast, panic | Mixkit / Freesound |
| Jumpscare | loud sting, orchestral hit, digital glitch | Mixkit / Freesound |
| Ambient | low drone, ventilation, distant screams, water drip | Mixkit / Freesound |
| Weapon | stun gun zap, pistol shot, reload, empty click | Mixkit / Freesound |
| UI | menu navigate, select, error, pickup | Kenney UI Audio |

## Enemy Models (Sketchfab — Check License Per Model)
Search: "nurse robot", "cyborg nurse", "biomechanical horror", "medical robot" — filter "Downloadable" + "CC0/CC-BY"
Fallback: Use Poly Haven `medical_robot` if exists, else kitbash from primitives + shaders.

## Download Structure
```
public/assets/
├── models/
│   ├── hospital_room.glb
│   ├── hospital_room_2.glb
│   ├── surgery.glb
│   ├── industrial_pipes_01.glb
│   ├── industrial_pipes_02.glb
│   ├── medical_equipment_01.glb
│   ├── locker.glb
│   ├── fire_extinguisher.glb
│   ├── fluorescent_light.glb
│   ├── ceiling_fan.glb
│   ├── ventilation_duct.glb
│   ├── fuse_box.glb
│   ├── keycard_reader.glb
│   ├── server_rack.glb
│   ├── cryo_pod.glb
│   ├── biological_tank.glb
│   └── gurney.glb
├── hdri/
│   ├── hospital_room_1k.hdr
│   ├── large_corridor_1k.hdr
│   ├── industrial_workshop_foundry_1k.hdr
│   ├── solitude_interior_1k.hdr
│   └── debris_basement_corridor_1k.hdr
├── textures/
│   ├── Tiles122/ (albedo, normal, roughness, metalness, ao, displacement)
│   ├── Tiles074/
│   ├── Concrete021/
│   ├── Metal032/
│   ├── Plaster043/
│   └── Plastic011/
├── audio/
│   ├── footsteps/
│   ├── doors/
│   ├── electricity/
│   ├── monster/
│   ├── heartbeat/
│   ├── jumpscare/
│   ├── ambient/
│   ├── weapons/
│   └── ui/
└── ui/
    └── kenney-ui-pack/
```
