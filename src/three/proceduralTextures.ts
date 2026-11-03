/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

// Create a checkered procedural board texture with bevels, comic style and environment themes
export function createBoardSquareTexture(isLight: boolean, theme: string = 'royal_wood'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const drawComicBorder = (borderColor: string = '#000000', lineWidth: number = 8) => {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(lineWidth / 2, lineWidth / 2, 256 - lineWidth, 256 - lineWidth);
  };

  switch (theme) {
    case 'royal_wood': {
      const baseColor = isLight ? '#fde68a' : '#92400e';
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, 256, 256);

      ctx.strokeStyle = isLight ? '#f59e0b' : '#78350f';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.35;
      for (let y = 0; y < 256; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(80, y - 6, 160, y + 8, 256, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
      drawComicBorder('#451a03', 6);
      break;
    }

    case 'volcano_dungeon': {
      ctx.fillStyle = isLight ? '#292524' : '#1c1917';
      ctx.fillRect(0, 0, 256, 256);

      ctx.strokeStyle = isLight ? '#ea580c' : '#dc2626';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(80, 90);
      ctx.lineTo(170, 150);
      ctx.lineTo(230, 256);
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(80, 90, 6, 0, Math.PI * 2);
      ctx.arc(170, 150, 8, 0, Math.PI * 2);
      ctx.fill();

      drawComicBorder('#000000', 8);
      break;
    }

    case 'magic_crystal': {
      ctx.fillStyle = isLight ? '#e0f2fe' : '#7dd3fc';
      ctx.fillRect(0, 0, 256, 256);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(128, 20);
      ctx.lineTo(236, 128);
      ctx.lineTo(128, 236);
      ctx.lineTo(20, 128);
      ctx.closePath();
      ctx.stroke();

      ctx.globalAlpha = 1.0;
      drawComicBorder('#0369a1', 6);
      break;
    }

    case 'cyber_neon': {
      ctx.fillStyle = isLight ? '#0f172a' : '#020617';
      ctx.fillRect(0, 0, 256, 256);

      ctx.strokeStyle = isLight ? '#06b6d4' : '#d946ef';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, 236, 236);

      ctx.fillStyle = isLight ? '#22d3ee' : '#e879f9';
      ctx.beginPath();
      ctx.arc(128, 128, 10, 0, Math.PI * 2);
      ctx.fill();

      drawComicBorder('#000000', 8);
      break;
    }

    case 'pirate_island': {
      ctx.fillStyle = isLight ? '#fef08a' : '#0d9488';
      ctx.fillRect(0, 0, 256, 256);

      ctx.strokeStyle = isLight ? '#eab308' : '#14b8a6';
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(128, 128, 60, 0, Math.PI);
      ctx.stroke();

      ctx.globalAlpha = 1.0;
      drawComicBorder('#115e59', 6);
      break;
    }

    case 'candy_land': {
      ctx.fillStyle = isLight ? '#fbcfe8' : '#a7f3d0';
      ctx.fillRect(0, 0, 256, 256);

      const colors = ['#f43f5e', '#3b82f6', '#eab308', '#8b5cf6'];
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = colors[i % colors.length];
        const sx = 30 + (i * 26) % 200;
        const sy = 40 + ((i * 47) % 180);
        ctx.fillRect(sx, sy, 14, 6);
      }

      drawComicBorder('#db2777', 6);
      break;
    }

    case 'space_station': {
      ctx.fillStyle = isLight ? '#334155' : '#1e293b';
      ctx.fillRect(0, 0, 256, 256);

      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(30, 128);
      ctx.lineTo(128, 128);
      ctx.lineTo(128, 226);
      ctx.stroke();

      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.arc(128, 128, 8, 0, Math.PI * 2);
      ctx.fill();

      drawComicBorder('#000000', 8);
      break;
    }

    case 'spooky_graveyard': {
      ctx.fillStyle = isLight ? '#475569' : '#3b0764';
      ctx.fillRect(0, 0, 256, 256);

      ctx.strokeStyle = isLight ? '#94a3b8' : '#c084fc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(60, 20);
      ctx.lineTo(110, 100);
      ctx.lineTo(80, 190);
      ctx.stroke();

      drawComicBorder('#000000', 8);
      break;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural cartoon eyes texture for figures
export function createEyeTexture(mood: 'happy' | 'dizzy' | 'surprised' | 'serious' = 'happy'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(64, 64, 56, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 8;
  ctx.stroke();

  if (mood === 'dizzy') {
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 8;
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
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(64, 64, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(52, 50, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(76, 72, 7, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(64, 64, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(64, 64, 28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(54, 52, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(72, 70, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural trap glyph texture (for ground decals)
export function createTrapGlyphTexture(trapType: string, revealed: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 128, 128);

  ctx.strokeStyle = revealed ? '#f59e0b' : '#a855f7';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(64, 64, 54, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = revealed ? 'rgba(245, 158, 11, 0.25)' : 'rgba(168, 85, 247, 0.3)';
  ctx.beginPath();
  ctx.arc(64, 64, 50, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 50px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (!revealed) {
    ctx.fillText('❓', 64, 68);
  } else {
    const emojis: Record<string, string> = {
      banana: '🍌',
      spring: '🦘',
      teleport: '🌀',
      freeze: '🧊',
      swap: '🔄',
      confetti_pop: '🎉',
      tnt: '💣',
      glue: '🧪',
    };
    ctx.fillText(emojis[trapType] || '💥', 64, 68);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural bonus item coin texture
export function createItemCoinTexture(itemType: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 128, 128);

  const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.7, '#eab308');
  grad.addColorStop(1, '#ca8a04');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(64, 64, 56, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.stroke();

  const icons: Record<string, string> = {
    rocket_boots: '🚀',
    mega_hammer: '🔨',
    bubble_shield: '🛡️',
    magic_mirror: '🪞',
    speed_potion: '⚡',
    lightning_rod: '⚡',
    magnet: '🧲',
  };

  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icons[itemType] || '⭐', 64, 68);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural Floating Status Badge Texture (Shown directly above a piece)
export function createStatusBadgeTexture(
  badgeType: 'item' | 'frozen' | 'shield' | 'glue' | 'dizzy',
  infoText: string,
  emoji: string,
  color: string = '#f59e0b'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 128);

  // Rounded pill background
  const x = 12, y = 14, w = 232, h = 90, r = 24;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();

  // Vibrant border
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Emoji icon
  ctx.font = '36px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 26, 58);

  // Title text & duration
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Fredoka, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(infoText.length > 12 ? infoText.slice(0, 12) + '…' : infoText, 72, 45);

  ctx.fillStyle = color;
  ctx.font = 'bold 16px Fredoka, sans-serif';
  const subtitle =
    badgeType === 'frozen'
      ? '1 kolo vynechává'
      : badgeType === 'shield'
      ? '1 zásah odrazí'
      : badgeType === 'glue'
      ? '1 krok max'
      : badgeType === 'dizzy'
      ? 'Zatočená hlava'
      : 'Aktivní zbraň';
  ctx.fillText(subtitle, 72, 72);

  // Pointer triangle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(116, 104);
  ctx.lineTo(140, 104);
  ctx.lineTo(128, 120);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
