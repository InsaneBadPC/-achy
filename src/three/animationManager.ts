/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { squareToWorld } from './boardRenderer';
import { soundEngine } from '../audio/soundEngine';

export interface ActiveAnimation {
  id: string;
  type:
    | 'hop'
    | 'slip'
    | 'spring'
    | 'teleport'
    | 'knockback'
    | 'hammer_smash'
    | 'rocket_jump'
    | 'bump'
    | 'lightning_strike'
    | 'smackdown'
    | 'karate_kick'
    | 'tornado_spin';
  targetGroup: THREE.Group;
  startX: number;
  startZ: number;
  targetX: number;
  targetZ: number;
  duration: number;
  elapsed: number;
  onComplete?: () => void;
  height?: number;
  rotations?: number;
}

export class AnimationManager {
  private activeAnimations: ActiveAnimation[] = [];
  public cameraShakeTime: number = 0;
  public cameraShakeIntensity: number = 0;
  public hitstopTimer: number = 0;

  public triggerHitstop(durationSec: number = 0.06) {
    this.hitstopTimer = durationSec;
  }

  public triggerCameraShake(intensity: number = 0.25, duration: number = 0.3) {
    this.cameraShakeIntensity = intensity;
    this.cameraShakeTime = duration;
  }

  // Animate a standard chess hop move
  public animateHop(
    group: THREE.Group,
    targetRow: number,
    targetCol: number,
    duration: number = 0.35,
    onComplete?: () => void
  ) {
    const target = squareToWorld(targetRow, targetCol);
    soundEngine.playStep();

    this.activeAnimations.push({
      id: `hop-${group.name}-${Date.now()}-${Math.random()}`,
      type: 'hop',
      targetGroup: group,
      startX: group.position.x,
      startZ: group.position.z,
      targetX: target.x,
      targetZ: target.z,
      duration,
      elapsed: 0,
      height: 0.65,
      onComplete,
    });
  }

  // Animate banana peel slip
  public animateBananaSlip(
    group: THREE.Group,
    finalRow: number,
    finalCol: number,
    onComplete?: () => void
  ) {
    const target = squareToWorld(finalRow, finalCol);
    this.triggerCameraShake(0.18, 0.3);

    this.activeAnimations.push({
      id: `slip-${group.name}-${Date.now()}-${Math.random()}`,
      type: 'slip',
      targetGroup: group,
      startX: group.position.x,
      startZ: group.position.z,
      targetX: target.x,
      targetZ: target.z,
      duration: 0.65,
      elapsed: 0,
      rotations: Math.PI * 4,
      onComplete,
    });
  }

  // Animate spring launch
  public animateSpringLaunch(
    group: THREE.Group,
    finalRow: number,
    finalCol: number,
    onComplete?: () => void
  ) {
    const target = squareToWorld(finalRow, finalCol);
    this.triggerCameraShake(0.22, 0.35);

    this.activeAnimations.push({
      id: `spring-${group.name}-${Date.now()}-${Math.random()}`,
      type: 'spring',
      targetGroup: group,
      startX: group.position.x,
      startZ: group.position.z,
      targetX: target.x,
      targetZ: target.z,
      duration: 0.6,
      elapsed: 0,
      height: 2.2,
      onComplete,
    });
  }

  // Animate magical teleport
  public animateTeleport(
    group: THREE.Group,
    finalRow: number,
    finalCol: number,
    onComplete?: () => void
  ) {
    const target = squareToWorld(finalRow, finalCol);
    this.activeAnimations.push({
      id: `teleport-${group.name}-${Date.now()}-${Math.random()}`,
      type: 'teleport',
      targetGroup: group,
      startX: group.position.x,
      startZ: group.position.z,
      targetX: target.x,
      targetZ: target.z,
      duration: 0.5,
      elapsed: 0,
      onComplete,
    });
  }

  // Animate Mega Hammer leap and mega smash down
  public animateHammerSmash(
    group: THREE.Group,
    targetRow: number,
    targetCol: number,
    onComplete?: () => void
  ) {
    const target = squareToWorld(targetRow, targetCol);
    soundEngine.playHammerSmash();
    this.triggerCameraShake(0.4, 0.5);

    this.activeAnimations.push({
      id: `hammer-${group.name}-${Date.now()}-${Math.random()}`,
      type: 'hammer_smash',
      targetGroup: group,
      startX: group.position.x,
      startZ: group.position.z,
      targetX: target.x,
      targetZ: target.z,
      duration: 0.55,
      elapsed: 0,
      height: 2.5,
      onComplete,
    });
  }

  // Animate Rocket Boots flight
  public animateRocketJump(
    group: THREE.Group,
    targetRow: number,
    targetCol: number,
    onComplete?: () => void
  ) {
    const target = squareToWorld(targetRow, targetCol);
    soundEngine.playRocket();
    this.triggerCameraShake(0.15, 0.3);

    this.activeAnimations.push({
      id: `rocket-${group.name}-${Date.now()}-${Math.random()}`,
      type: 'rocket_jump',
      targetGroup: group,
      startX: group.position.x,
      startZ: group.position.z,
      targetX: target.x,
      targetZ: target.z,
      duration: 0.55,
      elapsed: 0,
      height: 1.8,
      onComplete,
    });
  }

  // Animate Lightning strike beam
  public animateLightningStrike(
    group: THREE.Group,
    targetRow: number,
    targetCol: number,
    onComplete?: () => void
  ) {
    const target = squareToWorld(targetRow, targetCol);
    soundEngine.playSpeedBoost();
    this.triggerCameraShake(0.3, 0.4);

    this.activeAnimations.push({
      id: `lightning-${group.name}-${Date.now()}-${Math.random()}`,
      type: 'lightning_strike',
      targetGroup: group,
      startX: group.position.x,
      startZ: group.position.z,
      targetX: target.x,
      targetZ: target.z,
      duration: 0.35,
      elapsed: 0,
      onComplete,
    });
  }

  // Attack bounce / shield block bump
  public animateBump(
    group: THREE.Group,
    targetRow: number,
    targetCol: number,
    onComplete?: () => void
  ) {
    const target = squareToWorld(targetRow, targetCol);
    soundEngine.playShield();
    this.triggerCameraShake(0.2, 0.25);

    this.activeAnimations.push({
      id: `bump-${group.name}-${Date.now()}-${Math.random()}`,
      type: 'bump',
      targetGroup: group,
      startX: group.position.x,
      startZ: group.position.z,
      targetX: target.x,
      targetZ: target.z,
      duration: 0.4,
      elapsed: 0,
      onComplete,
    });
  }

  // Funny capture animation variants (smackdown, karate kick, tornado spin, orbit blast)
  public animateCaptureKnockback(
    capturedGroup: THREE.Group,
    attackerType: string = 'pawn',
    onComplete?: () => void
  ) {
    soundEngine.playCapture();
    this.triggerHitstop(0.08);
    this.triggerCameraShake(0.38, 0.45);

    const angle = Math.random() * Math.PI * 2;
    const flyDist = 8;
    const variants: ('knockback' | 'smackdown' | 'karate_kick' | 'tornado_spin')[] = [
      'knockback',
      'smackdown',
      'karate_kick',
      'tornado_spin',
    ];
    const animType = variants[Math.floor(Math.random() * variants.length)];

    this.activeAnimations.push({
      id: `knockback-${capturedGroup.name}-${Date.now()}-${Math.random()}`,
      type: animType,
      targetGroup: capturedGroup,
      startX: capturedGroup.position.x,
      startZ: capturedGroup.position.z,
      targetX: capturedGroup.position.x + Math.cos(angle) * flyDist,
      targetZ: capturedGroup.position.z + Math.sin(angle) * flyDist,
      duration: 0.75,
      elapsed: 0,
      height: animType === 'smackdown' ? 2.0 : 6.0,
      onComplete,
    });
  }

  // Per-frame tick update
  public update(dt: number, piecesMap: Map<string, THREE.Group>, particleGroup: THREE.Group, time: number) {
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    if (this.cameraShakeTime > 0) {
      this.cameraShakeTime -= dt;
      if (this.cameraShakeTime < 0) this.cameraShakeTime = 0;
    }

    for (let i = this.activeAnimations.length - 1; i >= 0; i--) {
      const anim = this.activeAnimations[i];
      anim.elapsed += dt;
      const progress = Math.min(1, anim.elapsed / anim.duration);
      const group = anim.targetGroup;

      if (anim.type === 'hop' || anim.type === 'spring' || anim.type === 'rocket_jump') {
        group.position.x = THREE.MathUtils.lerp(anim.startX, anim.targetX, progress);
        group.position.z = THREE.MathUtils.lerp(anim.startZ, anim.targetZ, progress);

        const peakHeight = anim.height || 0.65;
        const arc = Math.sin(progress * Math.PI) * peakHeight;
        group.position.y = arc;

        const lean = Math.sin(progress * Math.PI) * 0.25;
        group.rotation.x = lean;

        if (progress > 0.85) {
          const squash = 1 - Math.sin(((progress - 0.85) / 0.15) * Math.PI) * 0.2;
          group.scale.set(1 / squash, squash, 1 / squash);
        } else {
          group.scale.set(1, 1, 1);
        }
      } else if (anim.type === 'lightning_strike') {
        // High speed dash with electric jitter
        group.position.x = THREE.MathUtils.lerp(anim.startX, anim.targetX, progress) + (Math.random() - 0.5) * 0.1;
        group.position.z = THREE.MathUtils.lerp(anim.startZ, anim.targetZ, progress) + (Math.random() - 0.5) * 0.1;
        group.position.y = Math.sin(progress * Math.PI) * 0.4;
      } else if (anim.type === 'hammer_smash') {
        group.position.x = THREE.MathUtils.lerp(anim.startX, anim.targetX, progress);
        group.position.z = THREE.MathUtils.lerp(anim.startZ, anim.targetZ, progress);

        const yCurve = progress < 0.6 ? Math.sin((progress / 0.6) * (Math.PI / 2)) : Math.cos(((progress - 0.6) / 0.4) * (Math.PI / 2));
        group.position.y = yCurve * (anim.height || 2.5);
        group.rotation.x = Math.sin(progress * Math.PI) * 0.8;
      } else if (anim.type === 'bump') {
        const p = Math.sin(progress * Math.PI) * 0.5;
        group.position.x = THREE.MathUtils.lerp(anim.startX, anim.targetX, p);
        group.position.z = THREE.MathUtils.lerp(anim.startZ, anim.targetZ, p);
        group.position.y = Math.sin(progress * Math.PI) * 0.3;
        group.rotation.z = Math.sin(progress * Math.PI * 2) * 0.2;
      } else if (anim.type === 'slip') {
        group.position.x = THREE.MathUtils.lerp(anim.startX, anim.targetX, progress);
        group.position.z = THREE.MathUtils.lerp(anim.startZ, anim.targetZ, progress);
        group.position.y = Math.sin(progress * Math.PI * 4) * 0.12;

        group.rotation.y += dt * 16;
        group.rotation.z = Math.sin(progress * Math.PI * 6) * 0.25;
      } else if (anim.type === 'teleport') {
        if (progress < 0.5) {
          const s = 1 - progress * 2;
          group.scale.set(s, s, s);
          group.rotation.y += dt * 14;
        } else {
          group.position.x = anim.targetX;
          group.position.z = anim.targetZ;
          const s = (progress - 0.5) * 2;
          group.scale.set(s, s, s);
        }
      } else if (anim.type === 'tornado_spin') {
        // Spins like a cartoon Tasmanian Devil into the stratosphere
        group.position.x = THREE.MathUtils.lerp(anim.startX, anim.targetX, progress);
        group.position.z = THREE.MathUtils.lerp(anim.startZ, anim.targetZ, progress);
        group.position.y = Math.pow(progress, 1.5) * (anim.height || 6.0);
        group.rotation.y += dt * 35;
        const scale = Math.max(0.01, 1 - progress * 0.9);
        group.scale.set(scale, scale, scale);
      } else if (anim.type === 'smackdown') {
        // Squashed completely flat like a comic pancake
        group.position.x = anim.startX;
        group.position.z = anim.startZ;
        const flatScale = Math.max(0.05, 1 - progress);
        group.scale.set(1 + progress * 0.6, flatScale, 1 + progress * 0.6);
        group.position.y = -progress * 0.1;
      } else if (anim.type === 'karate_kick') {
        // Cartwheel kick flip backwards
        group.position.x = THREE.MathUtils.lerp(anim.startX, anim.targetX, progress);
        group.position.z = THREE.MathUtils.lerp(anim.startZ, anim.targetZ, progress);
        group.position.y = Math.sin(progress * Math.PI) * 4.5;
        group.rotation.x -= dt * 16;
        group.rotation.z += dt * 8;
        const scale = Math.max(0.01, 1 - progress * 0.8);
        group.scale.set(scale, scale, scale);
      } else {
        // Standard high orbit knockback
        group.position.x = THREE.MathUtils.lerp(anim.startX, anim.targetX, progress);
        group.position.z = THREE.MathUtils.lerp(anim.startZ, anim.targetZ, progress);
        group.position.y = Math.sin(progress * Math.PI * 0.5) * (anim.height || 5.5);

        group.rotation.x += dt * 10;
        group.rotation.y += dt * 12;
        const scale = Math.max(0.01, 1 - progress * 0.85);
        group.scale.set(scale, scale, scale);
      }

      if (progress >= 1) {
        if (anim.type !== 'bump') {
          group.position.x = anim.targetX;
          group.position.z = anim.targetZ;
        } else {
          group.position.x = anim.startX;
          group.position.z = anim.startZ;
        }
        group.position.y = 0;
        group.rotation.x = 0;
        group.rotation.z = 0;
        group.scale.set(1, 1, 1);

        anim.onComplete?.();
        this.activeAnimations.splice(i, 1);
      }
    }

    // Update Idle Animations for living pieces
    piecesMap.forEach((model) => {
      const isAnimating = this.activeAnimations.some((a) => a.targetGroup === model);
      if (isAnimating) return;

      const { wobbleSpeed, wobblePhase, type } = model.userData;
      const t = time * wobbleSpeed + wobblePhase;

      const breath = Math.sin(t) * 0.035;
      model.scale.set(1 - breath * 0.5, 1 + breath, 1 - breath * 0.5);

      const torso = model.getObjectByName('torsoGroup');
      if (torso) {
        torso.rotation.z = Math.sin(t * 0.8) * 0.035;
      }

      const head = model.getObjectByName('headGroup');
      if (head) {
        head.rotation.y = Math.sin(t * 0.5) * 0.08;
      }

      if (type === 'king') {
        const mustache = model.getObjectByName('mustache');
        if (mustache) {
          mustache.rotation.z = Math.sin(time * 6) * 0.12;
        }
      }

      if (type === 'bishop') {
        const staff = model.getObjectByName('weapon');
        if (staff) {
          staff.position.y = 0.45 + Math.sin(time * 3 + wobblePhase) * 0.05;
        }
      }

      if (type === 'rook') {
        const armL = model.getObjectByName('armLeft');
        const armR = model.getObjectByName('armRight');
        if (armL && armR) {
          armL.position.y = 0.3 + Math.sin(time * 2) * 0.04;
          armR.position.y = 0.3 - Math.sin(time * 2) * 0.04;
        }
      }
    });

    // Update Particles
    for (let i = particleGroup.children.length - 1; i >= 0; i--) {
      const p = particleGroup.children[i] as THREE.Mesh;
      const data = p.userData;
      if (!data) continue;

      p.position.x += data.vx * dt;
      p.position.y += data.vy * dt;
      p.position.z += data.vz * dt;

      data.vy -= 9.8 * dt * 0.6;
      p.rotation.x += data.rotX * dt;
      p.rotation.y += data.rotY * dt;

      data.life -= data.decay * dt;
      if (p.material instanceof THREE.Material) {
        p.material.opacity = Math.max(0, data.life);
      }

      if (data.life <= 0 || p.position.y < -1) {
        particleGroup.remove(p);
      }
    }
  }
}
