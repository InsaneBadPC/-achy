/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { squareToWorld } from './boardRenderer';
import { soundEngine } from '../audio/soundEngine';

export interface ActiveAnimation {
  id: string;
  type: 'hop' | 'slip' | 'spring' | 'teleport' | 'knockback' | 'celebrate';
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
    duration: number = 0.38,
    onComplete?: () => void
  ) {
    const target = squareToWorld(targetRow, targetCol);
    soundEngine.playStep();

    this.activeAnimations.push({
      id: `hop-${group.name}-${Date.now()}`,
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
    this.triggerCameraShake(0.15, 0.25);

    this.activeAnimations.push({
      id: `slip-${group.name}-${Date.now()}`,
      type: 'slip',
      targetGroup: group,
      startX: group.position.x,
      startZ: group.position.z,
      targetX: target.x,
      targetZ: target.z,
      duration: 0.6,
      elapsed: 0,
      rotations: Math.PI * 4, // 2 full spins!
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
    this.triggerCameraShake(0.2, 0.3);

    this.activeAnimations.push({
      id: `spring-${group.name}-${Date.now()}`,
      type: 'spring',
      targetGroup: group,
      startX: group.position.x,
      startZ: group.position.z,
      targetX: target.x,
      targetZ: target.z,
      duration: 0.55,
      elapsed: 0,
      height: 1.8, // High comic rocket leap!
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
      id: `teleport-${group.name}-${Date.now()}`,
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

  // Animate capture knockback (loser sent flying into orbit)
  public animateCaptureKnockback(
    capturedGroup: THREE.Group,
    onComplete?: () => void
  ) {
    soundEngine.playCapture();
    this.triggerHitstop(0.06);
    this.triggerCameraShake(0.35, 0.35);

    const angle = Math.random() * Math.PI * 2;
    const flyDist = 8;
    this.activeAnimations.push({
      id: `knockback-${capturedGroup.name}-${Date.now()}`,
      type: 'knockback',
      targetGroup: capturedGroup,
      startX: capturedGroup.position.x,
      startZ: capturedGroup.position.z,
      targetX: capturedGroup.position.x + Math.cos(angle) * flyDist,
      targetZ: capturedGroup.position.z + Math.sin(angle) * flyDist,
      duration: 0.7,
      elapsed: 0,
      height: 5.0,
      onComplete,
    });
  }

  // Per-frame tick update
  public update(dt: number, piecesMap: Map<string, THREE.Group>, particleGroup: THREE.Group, time: number) {
    // If in hitstop, reduce timer and freeze active piece animations for punchy game feel!
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // Camera shake decay
    if (this.cameraShakeTime > 0) {
      this.cameraShakeTime -= dt;
      if (this.cameraShakeTime < 0) this.cameraShakeTime = 0;
    }

    // Update active animations
    for (let i = this.activeAnimations.length - 1; i >= 0; i--) {
      const anim = this.activeAnimations[i];
      anim.elapsed += dt;
      const progress = Math.min(1, anim.elapsed / anim.duration);

      const group = anim.targetGroup;

      if (anim.type === 'hop' || anim.type === 'spring') {
        // Linear horizontal motion
        group.position.x = THREE.MathUtils.lerp(anim.startX, anim.targetX, progress);
        group.position.z = THREE.MathUtils.lerp(anim.startZ, anim.targetZ, progress);

        // Parabolic vertical arc
        const peakHeight = anim.height || 0.65;
        const arc = Math.sin(progress * Math.PI) * peakHeight;
        group.position.y = arc;

        // Lean slightly forward into motion
        const lean = Math.sin(progress * Math.PI) * 0.25;
        group.rotation.x = lean;

        // Landing squash and stretch
        if (progress > 0.85) {
          const squash = 1 - Math.sin((progress - 0.85) / 0.15 * Math.PI) * 0.2;
          group.scale.set(1 / squash, squash, 1 / squash);
        } else {
          group.scale.set(1, 1, 1);
        }
      } else if (anim.type === 'slip') {
        // Fast sliding across the floor + comic spinning
        group.position.x = THREE.MathUtils.lerp(anim.startX, anim.targetX, progress);
        group.position.z = THREE.MathUtils.lerp(anim.startZ, anim.targetZ, progress);
        group.position.y = Math.sin(progress * Math.PI * 4) * 0.12;

        group.rotation.y += dt * 15;
        group.rotation.z = Math.sin(progress * Math.PI * 6) * 0.25;
      } else if (anim.type === 'teleport') {
        if (progress < 0.5) {
          // Shrink & spin out
          const s = 1 - progress * 2;
          group.scale.set(s, s, s);
          group.rotation.y += dt * 12;
        } else {
          // Pop up at target
          group.position.x = anim.targetX;
          group.position.z = anim.targetZ;
          const s = (progress - 0.5) * 2;
          group.scale.set(s, s, s);
        }
      } else if (anim.type === 'knockback') {
        group.position.x = THREE.MathUtils.lerp(anim.startX, anim.targetX, progress);
        group.position.z = THREE.MathUtils.lerp(anim.startZ, anim.targetZ, progress);
        group.position.y = Math.sin(progress * Math.PI * 0.5) * (anim.height || 4);

        group.rotation.x += dt * 10;
        group.rotation.y += dt * 12;
        const scale = 1 - progress * 0.8;
        group.scale.set(scale, scale, scale);
      }

      if (progress >= 1) {
        group.position.x = anim.targetX;
        group.position.z = anim.targetZ;
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
      // Don't override position if currently animating
      const isAnimating = this.activeAnimations.some((a) => a.targetGroup === model);
      if (isAnimating) return;

      const { wobbleSpeed, wobblePhase, type } = model.userData;
      const t = time * wobbleSpeed + wobblePhase;

      // Subtle breathing squash & stretch
      const breath = Math.sin(t) * 0.03;
      model.scale.set(1 - breath * 0.5, 1 + breath, 1 - breath * 0.5);

      const torso = model.getObjectByName('torsoGroup');
      if (torso) {
        // Gentle rhythmic sway
        torso.rotation.z = Math.sin(t * 0.8) * 0.03;
      }

      const head = model.getObjectByName('headGroup');
      if (head) {
        head.rotation.y = Math.sin(t * 0.5) * 0.08;
      }

      // King mustache wiggle
      if (type === 'king') {
        const mustache = model.getObjectByName('mustache');
        if (mustache) {
          mustache.rotation.z = Math.sin(time * 6) * 0.12;
        }
      }

      // Wizard staff float
      if (type === 'bishop') {
        const staff = model.getObjectByName('weapon');
        if (staff) {
          staff.position.y = 0.45 + Math.sin(time * 3 + wobblePhase) * 0.05;
        }
      }

      // Golem heavy fist sway
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

      data.vy -= 9.8 * dt * 0.5; // gravity
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
