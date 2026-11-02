/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { PieceColor, PieceType } from '../types/game';
import { createEyeTexture } from './proceduralTextures';

// Shared eye textures
const eyeTextureHappy = createEyeTexture('happy');
const eyeTextureDizzy = createEyeTexture('dizzy');
const eyeTextureSurprised = createEyeTexture('surprised');

export function createCharacterModel(
  type: PieceType,
  color: PieceColor,
  pieceId: string
): THREE.Group {
  const root = new THREE.Group();
  root.name = `character-${pieceId}`;
  root.userData = {
    pieceId,
    type,
    color,
    baseY: 0,
    wobbleSpeed: 2 + Math.random() * 1.5,
    wobblePhase: Math.random() * Math.PI * 2,
    blinkTimer: 2 + Math.random() * 3,
  };

  const isWhite = color === 'white';

  // Palette definitions
  const bodyColor = isWhite ? 0xf8fafc : 0x1e293b;
  const accentColor = isWhite ? 0x38bdf8 : 0xec4899;
  const goldColor = 0xf59e0b;
  const skinColor = isWhite ? 0xfde047 : 0xa78bfa;
  const metalColor = isWhite ? 0xe2e8f0 : 0x475569;

  // Modern PBR materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.3,
    metalness: 0.15,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.25,
    metalness: 0.25,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: goldColor,
    roughness: 0.2,
    metalness: 0.85,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.5,
    metalness: 0.05,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: metalColor,
    roughness: 0.3,
    metalness: 0.7,
  });

  const eyeMat = new THREE.MeshBasicMaterial({
    map: eyeTextureHappy,
    transparent: true,
  });

  // Helper to add cartoon googly eyes
  const addGooglyEyes = (
    parent: THREE.Object3D,
    y: number,
    z: number,
    radius: number = 0.14,
    spacing: number = 0.15
  ) => {
    const eyeGeom = new THREE.SphereGeometry(radius, 16, 16);
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat.clone());
    leftEye.position.set(-spacing, y, z);
    leftEye.name = 'eyeLeft';
    parent.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat.clone());
    rightEye.position.set(spacing, y, z);
    rightEye.name = 'eyeRight';
    parent.add(rightEye);
  };

  // Base pedestal
  const baseGeom = new THREE.CylinderGeometry(0.36, 0.42, 0.12, 24);
  const baseMesh = new THREE.Mesh(baseGeom, metalMat);
  baseMesh.position.y = 0.06;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  root.add(baseMesh);

  // Decorative ring on base
  const ringGeom = new THREE.TorusGeometry(0.38, 0.03, 12, 24);
  const ringMesh = new THREE.Mesh(ringGeom, goldMat);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.y = 0.12;
  root.add(ringMesh);

  // Subgroups for animations
  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'torsoGroup';
  torsoGroup.position.y = 0.12;
  root.add(torsoGroup);

  const headGroup = new THREE.Group();
  headGroup.name = 'headGroup';

  switch (type) {
    case 'pawn': {
      // --- PAWN: Cute Goblin / Minion ---
      const bellyGeom = new THREE.SphereGeometry(0.32, 20, 20);
      const belly = new THREE.Mesh(bellyGeom, bodyMat);
      belly.position.y = 0.28;
      belly.scale.set(1, 0.9, 0.95);
      belly.castShadow = true;
      torsoGroup.add(belly);

      const beltGeom = new THREE.CylinderGeometry(0.33, 0.33, 0.06, 20);
      const belt = new THREE.Mesh(beltGeom, accentMat);
      belt.position.y = 0.24;
      torsoGroup.add(belt);

      const buckleGeom = new THREE.BoxGeometry(0.08, 0.08, 0.03);
      const buckle = new THREE.Mesh(buckleGeom, goldMat);
      buckle.position.set(0, 0.24, 0.33);
      torsoGroup.add(buckle);

      headGroup.position.y = 0.58;
      const headGeom = new THREE.SphereGeometry(0.28, 20, 20);
      const head = new THREE.Mesh(headGeom, skinMat);
      head.castShadow = true;
      headGroup.add(head);

      const helmetGeom = new THREE.ConeGeometry(0.29, 0.35, 16);
      const helmet = new THREE.Mesh(helmetGeom, metalMat);
      helmet.position.y = 0.18;
      helmet.castShadow = true;
      headGroup.add(helmet);

      const pompomGeom = new THREE.SphereGeometry(0.08, 12, 12);
      const pompom = new THREE.Mesh(pompomGeom, goldMat);
      pompom.position.y = 0.36;
      headGroup.add(pompom);

      addGooglyEyes(headGroup, 0.04, 0.22, 0.1, 0.12);

      const clubGroup = new THREE.Group();
      clubGroup.name = 'weapon';
      const clubHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.35, 10), accentMat);
      const clubHead = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), metalMat);
      clubHead.position.y = 0.18;
      clubGroup.add(clubHandle);
      clubGroup.add(clubHead);
      clubGroup.position.set(0.32, 0.35, 0.1);
      clubGroup.rotation.z = -0.4;
      torsoGroup.add(clubGroup);

      torsoGroup.add(headGroup);
      break;
    }

    case 'knight': {
      // --- KNIGHT: Bouncy Unicorn / Steed ---
      const springGeom = new THREE.CylinderGeometry(0.24, 0.28, 0.3, 16);
      const spring = new THREE.Mesh(springGeom, accentMat);
      spring.position.y = 0.22;
      torsoGroup.add(spring);

      const saddleGeom = new THREE.CylinderGeometry(0.26, 0.24, 0.1, 16);
      const saddle = new THREE.Mesh(saddleGeom, bodyMat);
      saddle.position.y = 0.38;
      torsoGroup.add(saddle);

      headGroup.position.set(0, 0.55, 0);
      const neckGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.35, 16);
      const neck = new THREE.Mesh(neckGeom, bodyMat);
      neck.rotation.x = 0.3;
      neck.position.set(0, 0.1, -0.05);
      headGroup.add(neck);

      const snoutGeom = new THREE.BoxGeometry(0.26, 0.25, 0.42);
      const snout = new THREE.Mesh(snoutGeom, skinMat);
      snout.position.set(0, 0.25, 0.18);
      snout.rotation.x = 0.15;
      snout.castShadow = true;
      headGroup.add(snout);

      const nostrilGeom = new THREE.SphereGeometry(0.03, 8, 8);
      const nMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const n1 = new THREE.Mesh(nostrilGeom, nMat);
      n1.position.set(-0.08, 0.22, 0.4);
      const n2 = new THREE.Mesh(nostrilGeom, nMat);
      n2.position.set(0.08, 0.22, 0.4);
      headGroup.add(n1);
      headGroup.add(n2);

      const earGeom = new THREE.ConeGeometry(0.08, 0.22, 10);
      const leftEar = new THREE.Mesh(earGeom, accentMat);
      leftEar.position.set(-0.16, 0.46, -0.05);
      leftEar.rotation.z = 0.35;
      const rightEar = new THREE.Mesh(earGeom, accentMat);
      rightEar.position.set(0.16, 0.46, -0.05);
      rightEar.rotation.z = -0.35;
      headGroup.add(leftEar);
      headGroup.add(rightEar);

      const hornGeom = new THREE.ConeGeometry(0.06, 0.32, 12);
      const horn = new THREE.Mesh(hornGeom, goldMat);
      horn.position.set(0, 0.45, 0.18);
      horn.rotation.x = 0.3;
      headGroup.add(horn);

      addGooglyEyes(headGroup, 0.32, 0.15, 0.09, 0.15);
      torsoGroup.add(headGroup);
      break;
    }

    case 'bishop': {
      // --- BISHOP: Whimsical Wizard / Jester ---
      const robeGeom = new THREE.ConeGeometry(0.35, 0.75, 20);
      const robe = new THREE.Mesh(robeGeom, bodyMat);
      robe.position.y = 0.42;
      robe.castShadow = true;
      torsoGroup.add(robe);

      const trimGeom = new THREE.TorusGeometry(0.28, 0.03, 10, 20);
      const trim = new THREE.Mesh(trimGeom, goldMat);
      trim.rotation.x = Math.PI / 2;
      trim.position.y = 0.25;
      torsoGroup.add(trim);

      headGroup.position.y = 0.82;
      const headGeom = new THREE.SphereGeometry(0.22, 16, 16);
      const head = new THREE.Mesh(headGeom, skinMat);
      headGroup.add(head);

      const beardGeom = new THREE.ConeGeometry(0.18, 0.35, 12);
      const beard = new THREE.Mesh(beardGeom, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }));
      beard.position.set(0, -0.12, 0.14);
      beard.rotation.x = 0.2;
      headGroup.add(beard);

      const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 20), accentMat);
      hatBrim.position.y = 0.12;
      headGroup.add(hatBrim);

      const hatTop = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 16), accentMat);
      hatTop.position.set(0, 0.36, -0.05);
      hatTop.rotation.x = -0.2;
      headGroup.add(hatTop);

      const star = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), goldMat);
      star.position.set(0, 0.6, -0.1);
      headGroup.add(star);

      const staffGroup = new THREE.Group();
      staffGroup.name = 'weapon';
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 10), goldMat);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), accentMat);
      orb.position.y = 0.46;
      staffGroup.add(shaft);
      staffGroup.add(orb);
      staffGroup.position.set(0.35, 0.45, 0.15);
      torsoGroup.add(staffGroup);

      addGooglyEyes(headGroup, 0.04, 0.16, 0.09, 0.11);
      torsoGroup.add(headGroup);
      break;
    }

    case 'rook': {
      // --- ROOK: Living Castle Golem ---
      const stoneMat = new THREE.MeshStandardMaterial({
        color: isWhite ? 0x94a3b8 : 0x334155,
        roughness: 0.8,
        metalness: 0.1,
      });

      const bodyGeom = new THREE.BoxGeometry(0.55, 0.6, 0.55);
      const body = new THREE.Mesh(bodyGeom, stoneMat);
      body.position.y = 0.38;
      body.castShadow = true;
      torsoGroup.add(body);

      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.08, 0.58), goldMat);
      belt.position.y = 0.22;
      torsoGroup.add(belt);

      headGroup.position.y = 0.72;
      const rimGeom = new THREE.BoxGeometry(0.62, 0.1, 0.62);
      const rim = new THREE.Mesh(rimGeom, stoneMat);
      headGroup.add(rim);

      const towerGeom = new THREE.BoxGeometry(0.16, 0.18, 0.16);
      const corners = [
        [-0.23, -0.23],
        [-0.23, 0.23],
        [0.23, -0.23],
        [0.23, 0.23],
      ];
      corners.forEach(([cx, cz]) => {
        const tower = new THREE.Mesh(towerGeom, stoneMat);
        tower.position.set(cx, 0.1, cz);
        headGroup.add(tower);
      });

      const fistGeom = new THREE.SphereGeometry(0.16, 12, 12);
      const leftFist = new THREE.Mesh(fistGeom, stoneMat);
      leftFist.position.set(-0.38, 0.3, 0.1);
      leftFist.name = 'armLeft';
      torsoGroup.add(leftFist);

      const rightFist = new THREE.Mesh(fistGeom, stoneMat);
      rightFist.position.set(0.38, 0.3, 0.1);
      rightFist.name = 'armRight';
      torsoGroup.add(rightFist);

      addGooglyEyes(headGroup, -0.15, 0.29, 0.11, 0.15);
      torsoGroup.add(headGroup);
      break;
    }

    case 'queen': {
      // --- QUEEN: Sassy Royal Diva ---
      const dressGeom = new THREE.CylinderGeometry(0.2, 0.38, 0.75, 20);
      const dress = new THREE.Mesh(dressGeom, bodyMat);
      dress.position.y = 0.44;
      dress.castShadow = true;
      torsoGroup.add(dress);

      const corset = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.25, 20), accentMat);
      corset.position.y = 0.62;
      torsoGroup.add(corset);

      headGroup.position.y = 0.92;
      const headGeom = new THREE.SphereGeometry(0.22, 16, 16);
      const head = new THREE.Mesh(headGeom, skinMat);
      headGroup.add(head);

      const tiaraBase = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.08, 16), goldMat);
      tiaraBase.position.y = 0.15;
      headGroup.add(tiaraBase);

      const jewel = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.08),
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.1, metalness: 0.9 })
      );
      jewel.position.set(0, 0.24, 0.16);
      headGroup.add(jewel);

      const scepterGroup = new THREE.Group();
      scepterGroup.name = 'weapon';
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.6, 10), goldMat);
      const heart = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 8, 16), accentMat);
      heart.position.y = 0.32;
      scepterGroup.add(handle);
      scepterGroup.add(heart);
      scepterGroup.position.set(0.32, 0.5, 0.12);
      scepterGroup.rotation.z = -0.3;
      torsoGroup.add(scepterGroup);

      addGooglyEyes(headGroup, 0.02, 0.16, 0.09, 0.11);
      torsoGroup.add(headGroup);
      break;
    }

    case 'king': {
      // --- KING: Chubby Silly Monarch ---
      const bellyGeom = new THREE.SphereGeometry(0.38, 20, 20);
      const belly = new THREE.Mesh(bellyGeom, bodyMat);
      belly.position.y = 0.44;
      belly.scale.set(1.05, 0.95, 1.05);
      belly.castShadow = true;
      torsoGroup.add(belly);

      const collarGeom = new THREE.TorusGeometry(0.3, 0.08, 12, 20);
      const collar = new THREE.Mesh(
        collarGeom,
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
      );
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 0.72;
      torsoGroup.add(collar);

      headGroup.position.y = 0.94;
      const headGeom = new THREE.SphereGeometry(0.24, 16, 16);
      const head = new THREE.Mesh(headGeom, skinMat);
      headGroup.add(head);

      const mustacheGroup = new THREE.Group();
      mustacheGroup.name = 'mustache';
      const stacheMat = new THREE.MeshStandardMaterial({
        color: isWhite ? 0xd97706 : 0x1f2937,
        roughness: 0.7,
      });

      const m1 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 10), stacheMat);
      m1.position.set(-0.11, -0.06, 0.22);
      m1.rotation.z = 1.3;
      m1.rotation.y = 0.4;
      const m2 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 10), stacheMat);
      m2.position.set(0.11, -0.06, 0.22);
      m2.rotation.z = -1.3;
      m2.rotation.y = -0.4;
      mustacheGroup.add(m1);
      mustacheGroup.add(m2);
      headGroup.add(mustacheGroup);

      const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 0.14, 16), goldMat);
      crownBase.position.y = 0.18;
      headGroup.add(crownBase);

      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 8), goldMat);
        const ang = (i / 5) * Math.PI * 2;
        spike.position.set(Math.cos(ang) * 0.24, 0.28, Math.sin(ang) * 0.24);
        headGroup.add(spike);
      }

      const cross = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.15, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.1, metalness: 0.8 })
      );
      cross.position.y = 0.4;
      headGroup.add(cross);

      const scepterGroup = new THREE.Group();
      scepterGroup.name = 'weapon';
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.65, 10), goldMat);
      const topOrb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), goldMat);
      topOrb.position.y = 0.35;
      scepterGroup.add(shaft);
      scepterGroup.add(topOrb);
      scepterGroup.position.set(0.38, 0.48, 0.15);
      torsoGroup.add(scepterGroup);

      addGooglyEyes(headGroup, 0.05, 0.19, 0.1, 0.13);
      torsoGroup.add(headGroup);
      break;
    }
  }

  // Bubble shield mesh (with iridescent shimmer)
  const shieldGeom = new THREE.SphereGeometry(0.58, 20, 20);
  const shieldMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.55,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.9,
    ior: 1.35,
  });
  const shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
  shieldMesh.name = 'bubbleShield';
  shieldMesh.position.y = 0.55;
  shieldMesh.visible = false;
  root.add(shieldMesh);

  // Ice block mesh
  const iceGeom = new THREE.BoxGeometry(0.85, 1.15, 0.85);
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xa5f3fc,
    transparent: true,
    opacity: 0.65,
    roughness: 0.15,
    transmission: 0.75,
  });
  const iceMesh = new THREE.Mesh(iceGeom, iceMat);
  iceMesh.name = 'iceBlock';
  iceMesh.position.y = 0.6;
  iceMesh.visible = false;
  root.add(iceMesh);

  // Mega Hammer 3D attachment
  const hammerGroup = new THREE.Group();
  hammerGroup.name = 'itemHammer';
  const hammerHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.55, 12),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
  );
  hammerHandle.rotation.z = Math.PI / 4;
  hammerGroup.add(hammerHandle);
  const hammerHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.22, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 })
  );
  hammerHead.position.set(0.18, 0.18, 0);
  hammerGroup.add(hammerHead);
  hammerGroup.position.set(0.32, 0.45, 0.15);
  hammerGroup.visible = false;
  root.add(hammerGroup);

  // Rocket Boots 3D attachment
  const rocketsGroup = new THREE.Group();
  rocketsGroup.name = 'itemRockets';
  const rocketMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.4, roughness: 0.3 });
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7, roughness: 0.2 });
  [-0.2, 0.2].forEach((xOffset) => {
    const rocket = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.25, 12), rocketMat);
    rocket.position.set(xOffset, 0.12, -0.05);
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.08, 12), nozzleMat);
    nozzle.position.set(xOffset, 0.01, -0.05);
    rocketsGroup.add(rocket);
    rocketsGroup.add(nozzle);
  });
  rocketsGroup.visible = false;
  root.add(rocketsGroup);

  // Magic Mirror 3D attachment (floating glowing mirror on side)
  const mirrorGroup = new THREE.Group();
  mirrorGroup.name = 'itemMirror';
  const mirrorFrame = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.03, 12, 24),
    goldMat
  );
  const mirrorGlass = new THREE.Mesh(
    new THREE.CircleGeometry(0.15, 24),
    new THREE.MeshStandardMaterial({ color: 0xa855f7, metalness: 0.95, roughness: 0.05 })
  );
  mirrorGroup.add(mirrorFrame);
  mirrorGroup.add(mirrorGlass);
  mirrorGroup.position.set(-0.35, 0.55, 0.1);
  mirrorGroup.rotation.y = Math.PI / 4;
  mirrorGroup.visible = false;
  root.add(mirrorGroup);

  // Stun / Dizzy Stars halo
  const starsGroup = new THREE.Group();
  starsGroup.name = 'dizzyStars';
  const starGeom = new THREE.OctahedronGeometry(0.06);
  const starMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  for (let i = 0; i < 3; i++) {
    const sm = new THREE.Mesh(starGeom, starMat);
    const ang = (i / 3) * Math.PI * 2;
    sm.position.set(Math.cos(ang) * 0.28, 1.25, Math.sin(ang) * 0.28);
    starsGroup.add(sm);
  }
  starsGroup.visible = false;
  root.add(starsGroup);

  // Face rotation
  root.rotation.y = isWhite ? 0 : Math.PI;

  return root;
}

export function updateCharacterState(
  model: THREE.Group,
  piece: { frozenTurns?: number; shield?: boolean; isDizzy?: boolean; equippedItem?: string | null }
) {
  const shield = model.getObjectByName('bubbleShield');
  if (shield) {
    shield.visible = !!piece.shield;
  }

  const ice = model.getObjectByName('iceBlock');
  if (ice) {
    ice.visible = (piece.frozenTurns || 0) > 0;
  }

  const hammer = model.getObjectByName('itemHammer');
  if (hammer) {
    hammer.visible = piece.equippedItem === 'mega_hammer';
  }

  const rockets = model.getObjectByName('itemRockets');
  if (rockets) {
    rockets.visible = piece.equippedItem === 'rocket_boots';
  }

  const mirror = model.getObjectByName('itemMirror');
  if (mirror) {
    mirror.visible = piece.equippedItem === 'magic_mirror';
  }

  const dizzyStars = model.getObjectByName('dizzyStars');
  if (dizzyStars) {
    dizzyStars.visible = !!piece.isDizzy;
  }

  const eyeLeft = model.getObjectByName('eyeLeft') as THREE.Mesh;
  const eyeRight = model.getObjectByName('eyeRight') as THREE.Mesh;

  if (eyeLeft && eyeRight) {
    const eyeMat = (piece.isDizzy ? eyeTextureDizzy : (piece.frozenTurns ? eyeTextureSurprised : eyeTextureHappy));
    (eyeLeft.material as THREE.MeshBasicMaterial).map = eyeMat;
    (eyeRight.material as THREE.MeshBasicMaterial).map = eyeMat;
    (eyeLeft.material as THREE.MeshBasicMaterial).needsUpdate = true;
    (eyeRight.material as THREE.MeshBasicMaterial).needsUpdate = true;
  }
}
