import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from 'three';

import type { ZombieDefenseId } from '../../scene/createZombieMode';
import type { CollisionBox } from '../../types/world';
import { isBlocked } from '../collision/isBlocked';

export interface ZombieDefenseTarget {
  id: ZombieDefenseId;
  position: Vector3;
  attackPosition: Vector3;
  health: number;
}

export interface ZombieUpdateResult {
  damageToPlayer: number;
  damageToDefense: { id: ZombieDefenseId; amount: number } | null;
  distanceToPlayer: number;
}

export class ZombieController {
  readonly root = new Group();

  private readonly torso = new Group();
  private readonly head = new Group();
  private readonly leftArm = new Group();
  private readonly rightArm = new Group();
  private readonly leftLeg = new Group();
  private readonly rightLeg = new Group();
  private readonly aimPoint = new Vector3();
  private readonly forward = new Vector3();
  private readonly movement = new Vector3();
  private readonly side = new Vector3();
  private readonly routeTargets: Vector3[] = [];
  private readonly breachPosition = new Vector3();

  private lane: ZombieDefenseId = 'north';
  private health = 0;
  private speed = 0;
  private attackDamage = 0;
  private attackCooldown = 0;
  private elapsed = 0;
  private alive = false;
  private routeIndex = 0;
  private passedBreach = false;

  constructor(private readonly colliders: readonly CollisionBox[] = []) {
    const skin = new MeshStandardMaterial({
      color: 0x7b9b76,
      emissive: 0x1a2415,
      emissiveIntensity: 0.08,
      roughness: 0.92,
      metalness: 0.02,
    });
    const skinDark = new MeshStandardMaterial({
      color: 0x546a4a,
      emissive: 0x10170d,
      emissiveIntensity: 0.04,
      roughness: 0.96,
      metalness: 0.01,
    });
    const cloth = new MeshStandardMaterial({
      color: 0x433d3d,
      roughness: 0.94,
      metalness: 0.02,
    });
    const eye = new MeshStandardMaterial({
      color: 0xe4ddd1,
      emissive: 0xc74a2b,
      emissiveIntensity: 0.26,
      roughness: 0.42,
      metalness: 0.04,
    });

    const spine = new Mesh(new CylinderGeometry(0.24, 0.32, 1.4, 8), skinDark);
    spine.position.set(0, 1.3, 0);
    const ribCage = new Mesh(new SphereGeometry(0.4, 12, 10), cloth);
    ribCage.scale.set(0.92, 1.18, 0.6);
    ribCage.position.set(0, 1.55, 0.06);
    this.torso.add(spine, ribCage);
    this.root.add(this.torso);

    const skull = new Mesh(new SphereGeometry(0.28, 12, 10), skin);
    skull.scale.set(0.96, 1.16, 0.92);
    skull.position.y = 2.12;
    const jaw = new Mesh(new BoxGeometry(0.34, 0.14, 0.2), skinDark);
    jaw.position.set(0, 1.88, 0.12);
    const leftEye = new Mesh(new SphereGeometry(0.032, 8, 8), eye);
    const rightEye = leftEye.clone();
    leftEye.position.set(-0.08, 2.12, 0.22);
    rightEye.position.set(0.08, 2.08, 0.22);
    this.head.add(skull, jaw, leftEye, rightEye);
    this.root.add(this.head);

    this.leftArm.position.set(-0.34, 1.68, 0.02);
    this.rightArm.position.set(0.34, 1.68, 0.02);
    this.leftLeg.position.set(-0.14, 0.9, 0);
    this.rightLeg.position.set(0.14, 0.9, 0);

    const makeLimb = (length: number, thickness: number, material: MeshStandardMaterial) => {
      const limb = new Mesh(new CylinderGeometry(thickness * 0.72, thickness, length, 8), material);
      limb.position.y = -length * 0.5;
      return limb;
    };

    this.leftArm.add(makeLimb(1.2, 0.12, skin));
    this.rightArm.add(makeLimb(1.2, 0.12, skin));
    this.leftLeg.add(makeLimb(1.34, 0.14, cloth));
    this.rightLeg.add(makeLimb(1.34, 0.14, cloth));
    this.root.add(this.leftArm, this.rightArm, this.leftLeg, this.rightLeg);

    this.root.visible = false;
  }

  isActive(): boolean {
    return this.alive;
  }

  getLane(): ZombieDefenseId {
    return this.lane;
  }

  getAimPoint(target = new Vector3()): Vector3 {
    return target.copy(this.root.position).add(this.aimPoint.set(0, 1.75, 0));
  }

  getDistanceTo(position: Vector3): number {
    return this.root.position.distanceTo(position);
  }

  spawn(
    position: Vector3,
    lane: ZombieDefenseId,
    night: number,
    route: readonly Vector3[],
    breachPosition: Vector3,
  ): void {
    this.lane = lane;
    this.root.position.copy(position);
    this.root.position.y = 0;
    this.root.rotation.y = 0;
    this.health = 48 + night * 9;
    this.speed = 1.4 + night * 0.12;
    this.attackDamage = 12 + night * 2.2;
    this.attackCooldown = 0;
    this.elapsed = 0;
    this.routeTargets.length = 0;
    route.forEach((point) => this.routeTargets.push(point.clone()));
    this.breachPosition.copy(breachPosition);
    this.routeIndex = 0;
    this.passedBreach = false;
    this.alive = true;
    this.root.visible = true;
  }

  applyDamage(amount: number): boolean {
    if (!this.alive) {
      return false;
    }

    this.health = Math.max(0, this.health - amount);
    if (this.health > 0) {
      return false;
    }

    this.alive = false;
    this.root.visible = false;
    return true;
  }

  update(
    deltaSeconds: number,
    playerPosition: Vector3,
    defenseTarget: ZombieDefenseTarget | null,
  ): ZombieUpdateResult {
    if (!this.alive) {
      return {
        damageToPlayer: 0,
        damageToDefense: null,
        distanceToPlayer: Infinity,
      };
    }

    this.elapsed += deltaSeconds;
    this.attackCooldown = Math.max(0, this.attackCooldown - deltaSeconds);

    const distanceToPlayer = this.root.position.distanceTo(playerPosition);
    const defenseDistance = defenseTarget
      ? this.root.position.distanceTo(defenseTarget.attackPosition)
      : Infinity;
    const targetPosition = this.getMovementTarget(playerPosition, defenseTarget);
    const targetX = targetPosition.x - this.root.position.x;
    const targetZ = targetPosition.z - this.root.position.z;
    const distanceToTarget = Math.hypot(targetX, targetZ);

    if (distanceToTarget > 0.001) {
      const targetYaw = Math.atan2(targetX, targetZ);
      this.root.rotation.y += (targetYaw - this.root.rotation.y)
        * (1 - Math.exp(-7.6 * deltaSeconds));
    }

    let damageToPlayer = 0;
    let damageToDefense: ZombieUpdateResult['damageToDefense'] = null;

    const attackingDefense = Boolean(defenseTarget && defenseTarget.health > 0 && defenseDistance < 1.22);
    const attackingPlayer = !attackingDefense && distanceToPlayer < 1.45;

    if (attackingDefense || attackingPlayer) {
      if (this.attackCooldown <= 0) {
        this.attackCooldown = 0.82;
        if (attackingDefense && defenseTarget) {
          damageToDefense = { id: defenseTarget.id, amount: this.attackDamage };
        } else if (attackingPlayer) {
          damageToPlayer = this.attackDamage;
        }
      }
    } else if (distanceToTarget > 0.001) {
      this.forward.set(targetX / distanceToTarget, 0, targetZ / distanceToTarget);
      this.moveTowardTarget(this.forward, Math.min(this.speed * deltaSeconds, distanceToTarget));
    }

    const gaitSpeed = attackingDefense || attackingPlayer ? 10.2 : 6.4;
    const gait = this.elapsed * gaitSpeed;
    const stride = attackingDefense || attackingPlayer ? 0.32 : 0.62;
    const armSwing = attackingDefense || attackingPlayer ? 0.58 : 0.76;
    const bob = Math.abs(Math.sin(gait)) * (attackingDefense || attackingPlayer ? 0.05 : 0.1);

    this.torso.position.y = bob;
    this.torso.rotation.set(
      0.08 + bob * 0.28,
      Math.sin(gait * 0.35) * 0.04,
      Math.sin(gait * 0.42) * 0.06,
    );
    this.head.position.y = 0;
    this.head.rotation.set(
      0.05 + bob * 0.18,
      Math.sin(gait * 0.22) * 0.05,
      Math.sin(gait * 0.18) * 0.03,
    );
    this.leftArm.rotation.set(-0.28 + Math.sin(gait) * armSwing, 0, 0.12);
    this.rightArm.rotation.set(-0.16 - Math.sin(gait) * armSwing, 0, -0.12);
    this.leftLeg.rotation.set(0.1 - Math.sin(gait) * stride, 0, -0.04);
    this.rightLeg.rotation.set(0.1 + Math.sin(gait) * stride, 0, 0.04);

    return {
      damageToPlayer,
      damageToDefense,
      distanceToPlayer,
    };
  }

  private getMovementTarget(playerPosition: Vector3, defenseTarget: ZombieDefenseTarget | null): Vector3 {
    while (this.routeIndex < this.routeTargets.length) {
      const waypoint = this.routeTargets[this.routeIndex];
      if (this.root.position.distanceToSquared(waypoint) > 1.6 * 1.6) {
        return waypoint;
      }
      this.routeIndex += 1;
    }

    if (defenseTarget && defenseTarget.health > 0) {
      return defenseTarget.attackPosition;
    }

    if (!this.passedBreach) {
      if (this.root.position.distanceToSquared(this.breachPosition) <= 1.5 * 1.5) {
        this.passedBreach = true;
      } else {
        return this.breachPosition;
      }
    }

    return playerPosition;
  }

  private moveTowardTarget(direction: Vector3, distance: number): void {
    const steps = Math.max(1, Math.ceil(distance / 0.28));
    const stepDistance = distance / steps;

    for (let step = 0; step < steps; step += 1) {
      if (this.tryMove(direction.x * stepDistance, direction.z * stepDistance)) {
        continue;
      }

      this.side.set(-direction.z, 0, direction.x);
      const steerBias = Math.sin(this.elapsed * 1.7 + this.root.position.x * 0.04 + this.root.position.z * 0.04) >= 0
        ? 1
        : -1;
      if (this.trySteerStep(stepDistance, direction, this.side, steerBias)) {
        continue;
      }
      if (this.trySteerStep(stepDistance, direction, this.side, -steerBias)) {
        continue;
      }
      if (this.tryMove(direction.x * stepDistance, 0)) {
        continue;
      }
      if (this.tryMove(0, direction.z * stepDistance)) {
        continue;
      }
      break;
    }
  }

  private trySteerStep(
    stepDistance: number,
    forward: Vector3,
    side: Vector3,
    steerSign: number,
  ): boolean {
    this.movement.copy(forward).addScaledVector(side, steerSign * 0.82);
    if (this.movement.lengthSq() < 0.0001) {
      return false;
    }
    this.movement.normalize().multiplyScalar(stepDistance * 0.94);
    return this.tryMove(this.movement.x, this.movement.z);
  }

  private tryMove(deltaX: number, deltaZ: number): boolean {
    const nextX = this.root.position.x + deltaX;
    const nextZ = this.root.position.z + deltaZ;
    if (isBlocked(nextX, nextZ, this.colliders, 0.48)) {
      return false;
    }

    this.root.position.x = nextX;
    this.root.position.z = nextZ;
    return true;
  }
}
