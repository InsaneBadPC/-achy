#!/usr/bin/env python3
"""
Enhance 3D visuals, materials, colors, cartoon eye textures, and water animation.
"""
import os
import re

REPO_DIR = r"c:\Users\insane\Documents\sachy\repo"

def update_procedural_textures():
    path = os.path.join(REPO_DIR, "src", "three", "proceduralTextures.ts")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update royal_wood in createBoardSquareTexture
    old_wood = r"""    case 'royal_wood': \{
      const baseColor = isLight \? '#fde68a' : '#92400e';
      ctx\.fillStyle = baseColor;
      ctx\.fillRect\(0, 0, 256, 256\);

      ctx\.strokeStyle = isLight \? '#f59e0b' : '#78350f';
      ctx\.lineWidth = 3;
      ctx\.globalAlpha = 0\.35;
      for \(let y = 0; y < 256; y \+= 12\) \{
        ctx\.beginPath\(\);
        ctx\.moveTo\(0, y\);
        ctx\.bezierCurveTo\(80, y - 6, 160, y \+ 8, 256, y\);
        ctx\.stroke\(\);
      \}
      ctx\.globalAlpha = 1\.0;
      drawComicBorder\('#451a03', 6\);
      break;
    \}"""

    new_wood = """    case 'royal_wood': {
      // High-contrast, rich vibrant oak & mahogany
      const baseColor = isLight ? '#fffbeb' : '#7c2d12';
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, 256, 256);

      // Warm vibrant grain lines
      ctx.strokeStyle = isLight ? '#f59e0b' : '#b45309';
      ctx.lineWidth = isLight ? 4 : 5;
      ctx.globalAlpha = isLight ? 0.45 : 0.6;
      for (let y = 0; y < 256; y += 14) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(70, y - 8, 170, y + 10, 256, y);
        ctx.stroke();
      }

      // 3D Bevel highlight & shadow for tactile pop
      ctx.globalAlpha = 0.65;
      ctx.strokeStyle = isLight ? '#ffffff' : '#fbbf24';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(3, 253);
      ctx.lineTo(3, 3);
      ctx.lineTo(253, 3);
      ctx.stroke();

      ctx.strokeStyle = '#000000';
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(253, 3);
      ctx.lineTo(253, 253);
      ctx.lineTo(3, 253);
      ctx.stroke();

      ctx.globalAlpha = 1.0;
      drawComicBorder('#292524', 6);
      break;
    }"""

    content = re.sub(old_wood, new_wood, content)

    # 2. Add createWaterTexture if missing
    if "export function createWaterTexture" not in content:
        water_func = """
// Procedural cartoon flowing water texture with caustics and foam ripples
export function createWaterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep crystal blue to bright turquoise cyan gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#0284c7');
  grad.addColorStop(0.5, '#0ea5e9');
  grad.addColorStop(1, '#06b6d4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Stylized cartoon water caustics & foam waves
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.55;

  for (let y = 30; y < 512; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 64) {
      const cy = y + Math.sin((x / 64) * Math.PI) * 14;
      ctx.lineTo(x, cy);
    }
    ctx.stroke();
  }

  // Soft sparkle glints
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.85;
  const glints = [
    [80, 70, 7],
    [240, 140, 6],
    [410, 80, 8],
    [140, 310, 6],
    [330, 370, 8],
    [70, 430, 5],
    [440, 410, 8],
    [230, 250, 9],
  ];
  for (const [gx, gy, gr] of glints) {
    ctx.beginPath();
    ctx.arc(gx, gy, gr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1.0;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}
"""
        content += water_func

    # 3. Enhance createEyeTexture to be super expressive with colorful iris and anime catchlights
    old_eyes_pattern = r"export function createEyeTexture\(mood: 'happy' \| 'dizzy' \| 'surprised' \| 'serious' = 'happy'\): THREE\.CanvasTexture \{[\s\S]*?return texture;\n\}"
    new_eyes = """export function createEyeTexture(
  mood: 'happy' | 'dizzy' | 'surprised' | 'serious' = 'happy',
  irisColor: string = '#0284c7'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // White sclera
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(64, 64, 56, 0, Math.PI * 2);
  ctx.fill();

  // Bold black comic outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 7;
  ctx.stroke();

  if (mood === 'dizzy') {
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 7;
    ctx.beginPath();
    let r = 4;
    let a = 0;
    ctx.moveTo(64, 64);
    for (let i = 0; i < 60; i++) {
      a += 0.3;
      r += 0.6;
      ctx.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r);
    }
    ctx.stroke();
  } else if (mood === 'surprised') {
    // Wide open shocked pupil
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(64, 64, 38, 0, Math.PI * 2);
    ctx.fill();

    // Dual highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(52, 50, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(76, 72, 7, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Large colorful anime iris
    const irisGrad = ctx.createRadialGradient(64, 64, 10, 64, 64, 38);
    irisGrad.addColorStop(0, '#38bdf8');
    irisGrad.addColorStop(0.7, irisColor);
    irisGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(64, 64, 38, 0, Math.PI * 2);
    ctx.fill();

    // Deep black pupil
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(64, 64, 22, 0, Math.PI * 2);
    ctx.fill();

    // Shiny anime reflections (main glossy spot + secondary twinkle)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(50, 48, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(76, 74, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}"""
    content = re.sub(old_eyes_pattern, new_eyes, content)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated proceduralTextures.ts")

def update_battlefield_renderer():
    path = os.path.join(REPO_DIR, "src", "three", "battlefieldRenderer.ts")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Import createWaterTexture
    if "createWaterTexture" not in content:
        content = content.replace(
            "import * as THREE from 'three';",
            "import * as THREE from 'three';\nimport { createWaterTexture } from './proceduralTextures';"
        )

    # Replace matRiver & add matRiverBed
    old_mat_river = r"""  const matRiver = new THREE\.MeshStandardMaterial\(\{
    color: 0x0284c7, // Vibrant blue water
    roughness: 0\.1,
    metalness: 0\.5,
    transparent: true,
    opacity: 0\.88,
  \}\);"""

    new_mat_river = """  const waterTex = createWaterTexture();
  const matRiver = new THREE.MeshStandardMaterial({
    map: waterTex,
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.15,
    transparent: true,
    opacity: 0.94,
    depthWrite: true,
  });

  const matRiverBed = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Dark stone riverbed beneath water
    roughness: 0.9,
  });"""

    content = re.sub(old_mat_river, new_mat_river, content)

    # Replace river tile generation to eliminate z-fighting
    old_river_tile = r"""      if \(terrain\.id === 'river'\) \{
        // Recessed water tile
        const waterGeom = new THREE\.BoxGeometry\(TILE_SIZE, 0\.08, TILE_SIZE\);
        tileMesh = new THREE\.Mesh\(waterGeom, matRiver\);
        tileMesh\.position\.set\(pos\.x, -0\.04, pos\.z\);
        waterGroup\.add\(tileMesh\);
      \}"""

    new_river_tile = """      if (terrain.id === 'river') {
        // 1. Dark riverbed base underneath to prevent z-fighting with foundation
        const bedGeom = new THREE.BoxGeometry(TILE_SIZE, 0.05, TILE_SIZE);
        const bedMesh = new THREE.Mesh(bedGeom, matRiverBed);
        bedMesh.position.set(pos.x, -0.01, pos.z);
        decorGroup.add(bedMesh);

        // 2. Crystal animated water surface safely elevated above riverbed (y=0.025)
        const waterGeom = new THREE.BoxGeometry(TILE_SIZE - 0.01, 0.04, TILE_SIZE - 0.01);
        tileMesh = new THREE.Mesh(waterGeom, matRiver);
        tileMesh.position.set(pos.x, 0.025, pos.z);
        waterGroup.add(tileMesh);
      }"""

    content = re.sub(old_river_tile, new_river_tile, content)

    # Ensure water tiles are not re-added to containerGroup (which removes them from waterGroup)
    content = content.replace(
        "      tileMesh.receiveShadow = true;\n      tileMesh.userData = { row: r, col: c, isSquare: true };\n      containerGroup.add(tileMesh);\n      terrainMeshes[r][c] = tileMesh;",
        """      tileMesh.receiveShadow = true;
      tileMesh.userData = { row: r, col: c, isSquare: true };
      if (terrain.id !== 'river') {
        containerGroup.add(tileMesh);
      }
      terrainMeshes[r][c] = tileMesh;"""
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated battlefieldRenderer.ts")

def update_chess_scene():
    path = os.path.join(REPO_DIR, "src", "three", "ChessScene.tsx")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update tone mapping & exposure from ACES (which desaturates) to Linear (punchy colors)
    content = content.replace(
        "renderer.toneMapping = THREE.ACESFilmicToneMapping;\n    renderer.toneMappingExposure = 1.25;",
        "renderer.toneMapping = THREE.LinearToneMapping;\n    renderer.toneMappingExposure = 1.15;"
    )

    # 2. Fix zoom fog darkening (push fog far away so board never dims when zoomed out)
    content = content.replace(
        "scene.fog = new THREE.Fog(scene.background, 35, 90);",
        "scene.fog = new THREE.Fog(scene.background, 70, 160);"
    )

    # 3. Boost ambient and directional lights for rich color clarity
    content = content.replace(
        "const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 1.4);",
        "const hemiLight = new THREE.HemisphereLight(0xffffff, 0x475569, 1.7);"
    )
    content = content.replace(
        "const dirLight = new THREE.DirectionalLight(0xfff7ed, 2.2);",
        "const dirLight = new THREE.DirectionalLight(0xfffaed, 2.4);"
    )

    # 4. Animated flowing water UV offset in animate loop
    old_water_anim = r"""      // Subtle water ripple animation on battlefield
      if \(bfCtxRef\.current\) \{
        bfCtxRef\.current\.waterGroup\.children\.forEach\(\(wMesh, i\) => \{
          wMesh\.position\.y = -0\.04 \+ Math\.sin\(elapsed \* 2 \+ i \* 0\.8\) \* 0\.015;
        \}\);
      \}"""

    new_water_anim = """      // Flowing water caustics & gentle ripples on battlefield
      if (bfCtxRef.current) {
        bfCtxRef.current.waterGroup.children.forEach((wMesh, i) => {
          const mat = (wMesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat && mat.map) {
            mat.map.offset.x = (elapsed * 0.04) % 1;
            mat.map.offset.y = (elapsed * 0.02) % 1;
          }
          wMesh.position.y = 0.025 + Math.sin(elapsed * 2.2 + i * 0.8) * 0.006;
        });
      }"""

    content = re.sub(old_water_anim, new_water_anim, content)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated ChessScene.tsx")

def update_character_factory():
    path = os.path.join(REPO_DIR, "src", "three", "characterFactory.ts")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Create eye textures for white (sapphire cyan) and black (glowing amethyst)
    old_eyes_init = """const eyeTextureHappy = createEyeTexture('happy');
const eyeTextureDizzy = createEyeTexture('dizzy');
const eyeTextureSurprised = createEyeTexture('surprised');"""

    new_eyes_init = """const eyeTextureWhiteHappy = createEyeTexture('happy', '#0284c7');
const eyeTextureBlackHappy = createEyeTexture('happy', '#a855f7');
const eyeTextureDizzy = createEyeTexture('dizzy');
const eyeTextureSurprised = createEyeTexture('surprised');"""

    content = content.replace(old_eyes_init, new_eyes_init)

    # Upgrade piece color palettes
    old_colors = r"""  const isWhite = color === 'white';

  const bodyColor = isWhite \? 0xf8fafc : 0x1e293b;
  const accentColor = isWhite \? 0x38bdf8 : 0xec4899;
  const goldColor = 0xf59e0b;
  const skinColor = isWhite \? 0xfde047 : 0xa78bfa;
  const metalColor = isWhite \? 0xe2e8f0 : 0x475569;

  const bodyMat = new THREE\.MeshStandardMaterial\(\{
    color: bodyColor,
    roughness: 0\.28,
    metalness: 0\.15,
  \}\);

  const accentMat = new THREE\.MeshStandardMaterial\(\{
    color: accentColor,
    roughness: 0\.2,
    metalness: 0\.35,
  \}\);

  const goldMat = new THREE\.MeshStandardMaterial\(\{
    color: goldColor,
    roughness: 0\.18,
    metalness: 0\.88,
  \}\);

  const skinMat = new THREE\.MeshStandardMaterial\(\{
    color: skinColor,
    roughness: 0\.45,
    metalness: 0\.05,
  \}\);

  const metalMat = new THREE\.MeshStandardMaterial\(\{
    color: metalColor,
    roughness: 0\.25,
    metalness: 0\.75,
  \}\);

  const eyeMat = new THREE\.MeshBasicMaterial\(\{
    map: eyeTextureHappy,
    transparent: true,
  \}\);"""

    new_colors = """  const isWhite = color === 'white';

  // High-saturation, vibrant, joyful cartoon color palette
  const bodyColor = isWhite ? 0xffffff : 0x18181b; // Crisp porcelain white vs Glossy midnight onyx
  const accentColor = isWhite ? 0x2563eb : 0xd946ef; // Electric royal sapphire vs Radiant neon magenta
  const secondaryColor = isWhite ? 0xef4444 : 0xf97316; // Heroic crimson red vs Fiery amber orange
  const goldColor = isWhite ? 0xfbbf24 : 0xf59e0b; // Gleaming 24K polished gold vs Antique burnished gold
  const skinColor = isWhite ? 0xffedd5 : 0xc084fc; // Warm cute peach skin vs Playful anime lilac
  const metalColor = isWhite ? 0xcfd8dc : 0x475569; // Polished chrome vs Gunmetal steel

  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.16,
    metalness: 0.12,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.18,
    metalness: 0.28,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: secondaryColor,
    roughness: 0.2,
    metalness: 0.3,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: goldColor,
    roughness: 0.12,
    metalness: 0.94,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.35,
    metalness: 0.05,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: metalColor,
    roughness: 0.2,
    metalness: 0.85,
  });

  const eyeMat = new THREE.MeshBasicMaterial({
    map: isWhite ? eyeTextureWhiteHappy : eyeTextureBlackHappy,
    transparent: true,
  });"""

    content = re.sub(old_colors, new_colors, content)

    # Add rosy cheeks in addGooglyEyes
    old_eyes_fn = r"""    const rightEye = new THREE\.Mesh\(eyeGeom, eyeMat\.clone\(\)\);
    rightEye\.position\.set\(spacing, y, z\);
    rightEye\.name = 'eyeRight';
    parent\.add\(rightEye\);
  \};"""

    new_eyes_fn = """    const rightEye = new THREE.Mesh(eyeGeom, eyeMat.clone());
    rightEye.position.set(spacing, y, z);
    rightEye.name = 'eyeRight';
    parent.add(rightEye);

    // Cute rosy blushing cartoon cheeks
    const cheekGeom = new THREE.SphereGeometry(radius * 0.65, 10, 10);
    const cheekMat = new THREE.MeshBasicMaterial({ color: isWhite ? 0xf472b6 : 0xf43f5e });
    const leftCheek = new THREE.Mesh(cheekGeom, cheekMat);
    leftCheek.position.set(-spacing * 1.35, y - radius * 1.05, z * 0.95);
    leftCheek.scale.set(1, 0.6, 0.4);
    parent.add(leftCheek);

    const rightCheek = new THREE.Mesh(cheekGeom, cheekMat);
    rightCheek.position.set(spacing * 1.35, y - radius * 1.05, z * 0.95);
    rightCheek.scale.set(1, 0.6, 0.4);
    parent.add(rightCheek);
  };"""

    content = re.sub(old_eyes_fn, new_eyes_fn, content)

    # King crown jewels & royal cape
    old_king_spikes = r"""      for \(let i = 0; i < 5; i\+\+\) \{
        const spike = new THREE\.Mesh\(new THREE\.ConeGeometry\(0\.06, 0\.16, 8\), goldMat\);
        const ang = \(i / 5\) \* Math\.PI \* 2;
        spike\.position\.set\(Math\.cos\(ang\) \* 0\.24, 0\.28, Math\.sin\(ang\) \* 0\.24\);
        headGroup\.add\(spike\);
      \}"""

    new_king_spikes = """      const jewelColors = [0xef4444, 0x10b981, 0x3b82f6, 0xa855f7, 0xf59e0b];
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 8), goldMat);
        const ang = (i / 5) * Math.PI * 2;
        spike.position.set(Math.cos(ang) * 0.24, 0.28, Math.sin(ang) * 0.24);
        headGroup.add(spike);

        // Glowing gem jewel on crown tip
        const gem = new THREE.Mesh(
          new THREE.SphereGeometry(0.045, 8, 8),
          new THREE.MeshStandardMaterial({
            color: jewelColors[i],
            roughness: 0.1,
            metalness: 0.8,
            emissive: jewelColors[i],
            emissiveIntensity: 0.35,
          })
        );
        gem.position.set(Math.cos(ang) * 0.24, 0.38, Math.sin(ang) * 0.24);
        headGroup.add(gem);
      }

      // Royal cape on King's back
      const capeGeom = new THREE.CylinderGeometry(0.36, 0.42, 0.75, 12, 1, false, 0, Math.PI);
      const capeMat = new THREE.MeshStandardMaterial({
        color: isWhite ? 0xef4444 : 0x7c3aed,
        roughness: 0.4,
        side: THREE.DoubleSide,
      });
      const cape = new THREE.Mesh(capeGeom, capeMat);
      cape.rotation.y = Math.PI / 2;
      cape.position.set(0, 0.42, -0.05);
      torsoGroup.add(cape);"""

    content = re.sub(old_king_spikes, new_king_spikes, content)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated characterFactory.ts")

if __name__ == "__main__":
    update_procedural_textures()
    update_battlefield_renderer()
    update_chess_scene()
    update_character_factory()
    print("Visual enhancement script finished successfully!")

