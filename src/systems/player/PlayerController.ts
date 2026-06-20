import { Euler, Matrix4, MathUtils, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

import { GAME_CONFIG } from '../../config/gameConfig';
import { isBlocked } from '../collision/isBlocked';
import type { MovementState } from '../input/InputController';
import type { CollisionBox } from '../../types/world';

const LOOK_SENSITIVITY = 0.002;
const LOOK_SMOOTHING = 42;
const LOOK_BUFFER_LIMIT = 180;
const LOOK_EPSILON = 0.001;
const HALF_PI = Math.PI / 2;

export interface PlayerMovementOptions {
  sprintMultiplier?: number;
  strafeMultiplier?: number;
}

export class PlayerController {
  readonly controls: PointerLockControls;

  private readonly forward = new Vector3();
  private readonly right = new Vector3();
  private readonly movement = new Vector3();
  private readonly lookDirection = new Vector3();
  private readonly lookQuaternion = new Quaternion();
  private readonly lookMatrix = new Matrix4();
  private readonly lookEuler = new Euler(0, 0, 0, 'YXZ');
  private pendingLookDeltaX = 0;
  private pendingLookDeltaY = 0;
  private verticalVelocity = 0;
  private grounded = true;
  private supportedFloorY: number | null = null;
  private movementConstraint: ((nextX: number, nextZ: number, currentPosition: Vector3) => boolean) | null = null;

  constructor(
    private readonly camera: PerspectiveCamera,
    private readonly domElement: HTMLElement,
    private colliders: CollisionBox[],
    spawn: Vector3,
  ) {
    this.controls = new PointerLockControls(camera, domElement);
    this.controls.disconnect();
    this.domElement.ownerDocument.addEventListener('mousemove', this.handleMouseMove);
    this.domElement.ownerDocument.addEventListener('pointerlockchange', this.handlePointerLockChange);
    this.domElement.ownerDocument.addEventListener('pointerlockerror', this.handlePointerLockError);
    this.controls.object.position.copy(spawn);
  }

  mount(): void {
    this.camera.position.y = GAME_CONFIG.player.height;
    this.controls.object.position.y = GAME_CONFIG.player.height;
    this.verticalVelocity = 0;
    this.grounded = true;
    this.clearLookBuffer();
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

  consumeLookDelta(target = { x: 0, y: 0 }): { x: number; y: number } {
    target.x = this.pendingLookDeltaX;
    target.y = this.pendingLookDeltaY;
    this.clearLookBuffer();
    return target;
  }

  lookToward(target: Vector3, blend = 1): void {
    this.lookDirection.copy(target).sub(this.controls.object.position);

    if (this.lookDirection.lengthSq() < 0.0001) {
      return;
    }

    this.lookMatrix.lookAt(this.controls.object.position, target, this.camera.up);
    this.lookQuaternion.setFromRotationMatrix(this.lookMatrix);

    if (blend >= 1) {
      this.clearLookBuffer();
      this.camera.quaternion.copy(this.lookQuaternion);
      return;
    }

    this.clearLookBuffer();
    this.camera.quaternion.slerp(this.lookQuaternion, Math.max(0, Math.min(1, blend)));
  }

  teleport(position: Vector3): void {
    this.controls.object.position.copy(position);
    this.verticalVelocity = 0;
    this.grounded = true;
    this.clearLookBuffer();
  }

  setSupportedFloor(height: number | null): void {
    this.supportedFloorY = height;
  }

  setMovementConstraint(
    constraint: ((nextX: number, nextZ: number, currentPosition: Vector3) => boolean) | null,
  ): void {
    this.movementConstraint = constraint;
  }

  setColliders(colliders: CollisionBox[]): void {
    this.colliders = colliders;
  }

  update(
    deltaSeconds: number,
    input: MovementState,
    jumpRequested = false,
    collisionEnabled = true,
    speedMultiplier = 1,
    applyLook = true,
    jumpVelocityMultiplier = 1,
    movementOptions: PlayerMovementOptions = {},
  ): void {
    if (!this.controls.isLocked) {
      return;
    }

    if (applyLook) {
      this.applySmoothedLook(deltaSeconds);
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
      const baseSpeed = (input.sprint ? GAME_CONFIG.player.sprintSpeed : GAME_CONFIG.player.walkSpeed)
        * speedMultiplier
        * (input.sprint ? movementOptions.sprintMultiplier ?? 1 : 1);
      const dodgeStrafeAmount = input.strafe
        * baseSpeed
        * Math.max(0, (movementOptions.strafeMultiplier ?? 1) - 1)
        * deltaSeconds;
      this.movement.normalize().multiplyScalar(
        baseSpeed * deltaSeconds,
      );
      if (dodgeStrafeAmount !== 0) {
        this.movement.addScaledVector(this.right, dodgeStrafeAmount);
      }

      const nextX = position.x + this.movement.x;
      const nextZ = position.z + this.movement.z;

      const canMoveX = !this.movementConstraint || this.movementConstraint(nextX, position.z, position);
      if (canMoveX && (!collisionEnabled || !isBlocked(nextX, position.z, this.colliders, GAME_CONFIG.player.radius))) {
        position.x = nextX;
      }

      const canMoveZ = !this.movementConstraint || this.movementConstraint(position.x, nextZ, position);
      if (canMoveZ && (!collisionEnabled || !isBlocked(position.x, nextZ, this.colliders, GAME_CONFIG.player.radius))) {
        position.z = nextZ;
      }
    }

    if (jumpRequested && this.grounded) {
      this.verticalVelocity = GAME_CONFIG.player.jumpVelocity * jumpVelocityMultiplier;
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
    this.domElement.ownerDocument.removeEventListener('mousemove', this.handleMouseMove);
    this.domElement.ownerDocument.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    this.domElement.ownerDocument.removeEventListener('pointerlockerror', this.handlePointerLockError);
    this.controls.unlock();
    this.controls.dispose();
  }

  private readonly handleMouseMove = (event: MouseEvent): void => {
    if (!this.controls.enabled || !this.controls.isLocked) {
      return;
    }

    this.pendingLookDeltaX = MathUtils.clamp(
      this.pendingLookDeltaX + event.movementX,
      -LOOK_BUFFER_LIMIT,
      LOOK_BUFFER_LIMIT,
    );
    this.pendingLookDeltaY = MathUtils.clamp(
      this.pendingLookDeltaY + event.movementY,
      -LOOK_BUFFER_LIMIT,
      LOOK_BUFFER_LIMIT,
    );
  };

  private readonly handlePointerLockChange = (): void => {
    const locked = this.domElement.ownerDocument.pointerLockElement === this.domElement;
    if (locked === this.controls.isLocked) {
      return;
    }

    (this.controls as unknown as { isLocked: boolean }).isLocked = locked;
    if (!locked) {
      this.clearLookBuffer();
    }

    this.controls.dispatchEvent({ type: locked ? 'lock' : 'unlock' });
  };

  private readonly handlePointerLockError = (): void => {
    console.error('Pointer lock failed.');
  };

  private applySmoothedLook(deltaSeconds: number): void {
    if (Math.abs(this.pendingLookDeltaX) < LOOK_EPSILON && Math.abs(this.pendingLookDeltaY) < LOOK_EPSILON) {
      this.clearLookBuffer();
      return;
    }

    const smoothing = 1 - Math.exp(-LOOK_SMOOTHING * deltaSeconds);
    const movementX = this.pendingLookDeltaX * smoothing;
    const movementY = this.pendingLookDeltaY * smoothing;
    this.pendingLookDeltaX -= movementX;
    this.pendingLookDeltaY -= movementY;

    this.lookEuler.setFromQuaternion(this.camera.quaternion);
    this.lookEuler.y -= movementX * LOOK_SENSITIVITY * this.controls.pointerSpeed;
    this.lookEuler.x -= movementY * LOOK_SENSITIVITY * this.controls.pointerSpeed;
    this.lookEuler.x = MathUtils.clamp(
      this.lookEuler.x,
      HALF_PI - this.controls.maxPolarAngle,
      HALF_PI - this.controls.minPolarAngle,
    );
    this.camera.quaternion.setFromEuler(this.lookEuler);
    this.controls.dispatchEvent({ type: 'change' });
  }

  private clearLookBuffer(): void {
    this.pendingLookDeltaX = 0;
    this.pendingLookDeltaY = 0;
  }
}
