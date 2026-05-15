import { Matrix4, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

import { GAME_CONFIG } from '../../config/gameConfig';
import { isBlocked } from '../collision/isBlocked';
import type { MovementState } from '../input/InputController';
import type { CollisionBox } from '../../types/world';

export class PlayerController {
  readonly controls: PointerLockControls;

  private readonly forward = new Vector3();
  private readonly right = new Vector3();
  private readonly movement = new Vector3();
  private readonly lookDirection = new Vector3();
  private readonly lookQuaternion = new Quaternion();
  private readonly lookMatrix = new Matrix4();
  private verticalVelocity = 0;
  private grounded = true;
  private supportedFloorY: number | null = null;

  constructor(
    private readonly camera: PerspectiveCamera,
    domElement: HTMLElement,
    private readonly colliders: CollisionBox[],
    spawn: Vector3,
  ) {
    this.controls = new PointerLockControls(camera, domElement);
    this.controls.object.position.copy(spawn);
  }

  mount(): void {
    this.camera.position.y = GAME_CONFIG.player.height;
    this.controls.object.position.y = GAME_CONFIG.player.height;
    this.verticalVelocity = 0;
    this.grounded = true;
  }

  lock(): void {
    this.controls.lock();
  }

  isLocked(): boolean {
    return this.controls.isLocked;
  }

  getPosition(): Vector3 {
    return this.controls.object.position;
  }

  getForwardVector(target = new Vector3()): Vector3 {
    this.camera.getWorldDirection(target);
    target.y = 0;

    if (target.lengthSq() === 0) {
      target.set(0, 0, -1);
    }

    return target.normalize();
  }

  lookToward(target: Vector3, blend = 1): void {
    this.lookDirection.copy(target).sub(this.controls.object.position);

    if (this.lookDirection.lengthSq() < 0.0001) {
      return;
    }

    this.lookMatrix.lookAt(this.controls.object.position, target, this.camera.up);
    this.lookQuaternion.setFromRotationMatrix(this.lookMatrix);

    if (blend >= 1) {
      this.camera.quaternion.copy(this.lookQuaternion);
      return;
    }

    this.camera.quaternion.slerp(this.lookQuaternion, Math.max(0, Math.min(1, blend)));
  }

  teleport(position: Vector3): void {
    this.controls.object.position.copy(position);
    this.verticalVelocity = 0;
    this.grounded = true;
  }

  setSupportedFloor(height: number | null): void {
    this.supportedFloorY = height;
  }

  update(
    deltaSeconds: number,
    input: MovementState,
    jumpRequested = false,
    collisionEnabled = true,
    speedMultiplier = 1,
  ): void {
    if (!this.controls.isLocked) {
      return;
    }

    this.camera.getWorldDirection(this.forward);
    this.forward.y = 0;

    if (this.forward.lengthSq() === 0) {
      this.forward.set(0, 0, -1);
    }

    this.forward.normalize();
    this.right.set(-this.forward.z, 0, this.forward.x).normalize();

    this.movement.set(0, 0, 0);
    this.movement.addScaledVector(this.forward, input.forward);
    this.movement.addScaledVector(this.right, input.strafe);

    const position = this.controls.object.position;
    if (this.movement.lengthSq() > 0) {
      this.movement.normalize().multiplyScalar(
        (input.sprint ? GAME_CONFIG.player.sprintSpeed : GAME_CONFIG.player.walkSpeed)
          * speedMultiplier
          * deltaSeconds,
      );

      const nextX = position.x + this.movement.x;
      const nextZ = position.z + this.movement.z;

      if (!collisionEnabled || !isBlocked(nextX, position.z, this.colliders, GAME_CONFIG.player.radius)) {
        position.x = nextX;
      }

      if (!collisionEnabled || !isBlocked(position.x, nextZ, this.colliders, GAME_CONFIG.player.radius)) {
        position.z = nextZ;
      }
    }

    if (jumpRequested && this.grounded) {
      this.verticalVelocity = GAME_CONFIG.player.jumpVelocity;
      this.grounded = false;
    }

    if (!this.grounded) {
      this.verticalVelocity -= GAME_CONFIG.player.gravity * deltaSeconds;
    }

    const floorY = this.supportedFloorY ?? GAME_CONFIG.player.height;
    const nextY = position.y + this.verticalVelocity * deltaSeconds;
    if (nextY <= floorY) {
      position.y = floorY;
      this.verticalVelocity = 0;
      this.grounded = true;
      return;
    }

    position.y = nextY;
    this.grounded = false;
  }

  destroy(): void {
    this.controls.unlock();
    this.controls.dispose();
  }
}
