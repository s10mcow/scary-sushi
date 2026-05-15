import {
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NearestFilter,
  PlaneGeometry,
  PointLight,
  SRGBColorSpace,
  SphereGeometry,
  Vector3,
} from 'three';

import type { CollisionBox } from '../../types/world';
import { isBlocked } from '../collision/isBlocked';

export type DoomEnemyVariant = 'imp' | 'pinky';

export interface DoomEnemyUpdateResult {
  damageToPlayer: number;
  distanceToPlayer: number;
  seesPlayer: boolean;
  alertLevel: number;
}

interface DoomFireball {
  mesh: Mesh;
  light: PointLight;
  velocity: Vector3;
  remaining: number;
  active: boolean;
  damage: number;
}

type DoomSpriteState = 'idle' | 'walk-a' | 'walk-b' | 'attack';

interface DoomNavigator {
  snap(position: Vector3, radius?: number): Vector3;
  findPath(from: Vector3, to: Vector3, radius?: number): Vector3[];
}

const spriteTextureCache = new Map<string, CanvasTexture>();

function finalizeSpriteTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

function fillRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
): void {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
}

function framedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  outline = '#120706',
): void {
  fillRect(context, x - 1, y - 1, width + 2, height + 2, outline);
  fillRect(context, x, y, width, height, fill);
}

function createImpSprite(state: DoomSpriteState): CanvasTexture {
  const key = `imp:${state}`;
  const cached = spriteTextureCache.get(key);
  if (cached) {
    return cached;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 80;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create doom imp sprite.');
  }

  const skin = '#8c4b29';
  const dark = '#38140d';
  const mid = '#5e2718';
  const wound = '#b93424';
  const eye = '#ff9d47';
  const tooth = '#f0decc';

  const armShift = state === 'walk-a' ? -2 : state === 'walk-b' ? 2 : 0;
  const legShift = state === 'walk-a' ? 2 : state === 'walk-b' ? -2 : 0;
  const attackRaise = state === 'attack' ? -6 : 0;

  framedRect(context, 21, 7, 5, 10, tooth);
  framedRect(context, 38, 7, 5, 10, tooth);
  framedRect(context, 19, 16, 26, 18, skin);
  framedRect(context, 17, 34, 30, 25, mid);
  framedRect(context, 14 + armShift, 31 + attackRaise, 7, 25, skin);
  framedRect(context, 45 + armShift, 31 + attackRaise, 7, 25, skin);
  framedRect(context, 14 + armShift, 48 + attackRaise, 4, 10, dark);
  framedRect(context, 48 + armShift, 48 + attackRaise, 4, 10, dark);
  framedRect(context, 16 + legShift, 58, 10, 18, dark);
  framedRect(context, 38 - legShift, 58, 10, 18, dark);
  framedRect(context, 21, 41, 22, 13, dark);
  fillRect(context, 20, 44, 24, 2, tooth);
  fillRect(context, 23, 48, 18, 3, wound);
  fillRect(context, 24, 22, 5, 5, eye);
  fillRect(context, 35, 21, 5, 5, eye);
  fillRect(context, 19, 28, 26, 4, dark);
  fillRect(context, 23, 36, 2, 13, tooth);
  fillRect(context, 30, 37, 2, 12, tooth);
  fillRect(context, 37, 36, 2, 13, tooth);
  fillRect(context, 12 + armShift, 53 + attackRaise, 3, 6, tooth);
  fillRect(context, 52 + armShift, 53 + attackRaise, 3, 6, tooth);
  fillRect(context, 17, 14, 4, 8, wound);
  fillRect(context, 43, 14, 4, 8, wound);

  if (state === 'attack') {
    fillRect(context, 6, 18, 10, 10, '#6dff4d');
    fillRect(context, 48, 18, 10, 10, '#6dff4d');
    fillRect(context, 8, 20, 6, 6, '#d9ff9b');
    fillRect(context, 50, 20, 6, 6, '#d9ff9b');
    fillRect(context, 24, 47, 16, 4, '#ff7d52');
  }

  const texture = finalizeSpriteTexture(canvas);
  spriteTextureCache.set(key, texture);
  return texture;
}

function createPinkySprite(state: DoomSpriteState): CanvasTexture {
  const key = `pinky:${state}`;
  const cached = spriteTextureCache.get(key);
  if (cached) {
    return cached;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 88;
  canvas.height = 72;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create doom pinky sprite.');
  }

  const flesh = '#b15a6f';
  const dark = '#5a1e2c';
  const wound = '#d04242';
  const mouth = '#250507';
  const tooth = '#f2ddd0';
  const eye = '#ff784f';

  const legShift = state === 'walk-a' ? -3 : state === 'walk-b' ? 3 : 0;
  const jawOpen = state === 'attack' ? 3 : 0;

  framedRect(context, 12, 26, 62, 24, flesh);
  framedRect(context, 23, 16, 40, 22, flesh);
  framedRect(context, 21, 33 + jawOpen, 44, 11, mouth);
  framedRect(context, 15 + legShift, 47, 10, 16, dark);
  framedRect(context, 30 - legShift, 49, 10, 15, dark);
  framedRect(context, 47 + legShift, 49, 10, 15, dark);
  framedRect(context, 62 - legShift, 47, 10, 16, dark);
  fillRect(context, 27, 23, 5, 5, eye);
  fillRect(context, 55, 22, 5, 5, eye);
  fillRect(context, 22, 41 + jawOpen, 42, 4, tooth);
  fillRect(context, 17, 31, 8, 5, wound);
  fillRect(context, 60, 31, 7, 5, wound);
  fillRect(context, 28, 38 + jawOpen, 4, 10, tooth);
  fillRect(context, 39, 39 + jawOpen, 4, 9, tooth);
  fillRect(context, 50, 38 + jawOpen, 4, 10, tooth);
  fillRect(context, 18, 18, 4, 9, tooth);
  fillRect(context, 64, 18, 4, 9, tooth);
  fillRect(context, 26, 46, 8, 4, wound);
  fillRect(context, 45, 46, 9, 4, wound);

  if (state === 'attack') {
    fillRect(context, 18, 35, 50, 3, '#ff5e5e');
    fillRect(context, 14, 28, 10, 6, '#ff8e64');
    fillRect(context, 62, 28, 10, 6, '#ff8e64');
  }

  const texture = finalizeSpriteTexture(canvas);
  spriteTextureCache.set(key, texture);
  return texture;
}

function getEnemyTexture(variant: DoomEnemyVariant, state: DoomSpriteState): CanvasTexture {
  return variant === 'imp' ? createImpSprite(state) : createPinkySprite(state);
}

export class DoomEnemyController {
  readonly root = new Group();

  private readonly fireballs: DoomFireball[] = [];
  private readonly fireballRoot = new Group();
  private readonly spritePivot = new Group();
  private readonly impCore = new Group();
  private readonly pinkyCore = new Group();
  private readonly menaceLight = new PointLight(0xff5a2a, 0, 10, 1.8);
  private readonly impSpriteMaterial = new MeshBasicMaterial({
    transparent: true,
    alphaTest: 0.24,
    depthWrite: false,
    toneMapped: false,
  });
  private readonly pinkySpriteMaterial = this.impSpriteMaterial.clone();
  private readonly impSprite = new Mesh(new PlaneGeometry(2.28, 2.86), this.impSpriteMaterial);
  private readonly pinkySprite = new Mesh(new PlaneGeometry(3.08, 2.12), this.pinkySpriteMaterial);
  private readonly shadow = new Mesh(
    new CircleGeometry(0.72, 18),
    new MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  private readonly aimPoint = new Vector3();
  private readonly movement = new Vector3();
  private readonly side = new Vector3();
  private readonly lineStep = new Vector3();
  private readonly projectileTarget = new Vector3();
  private readonly pathGoal = new Vector3();
  private readonly pathDirection = new Vector3();

  private variant: DoomEnemyVariant = 'imp';
  private alive = false;
  private health = 0;
  private speed = 0;
  private chargeSpeed = 0;
  private attackDamage = 0;
  private attackCooldown = 0;
  private elapsed = 0;
  private currentSpriteState: DoomSpriteState | null = null;
  private attackPoseRemaining = 0;
  private pathRefreshCooldown = 0;
  private alerted = false;
  private currentPath: Vector3[] = [];

  constructor(private readonly colliders: readonly CollisionBox[] = []) {
    this.impSprite.renderOrder = 12;
    this.pinkySprite.renderOrder = 12;
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.04;
    this.impSprite.position.y = 1.43;
    this.pinkySprite.position.y = 1.06;
    this.menaceLight.position.set(0, 1.24, 0.12);
    this.impSprite.visible = false;
    this.pinkySprite.visible = false;
    this.buildImpCore();
    this.buildPinkyCore();
    this.root.add(this.shadow, this.impCore, this.pinkyCore, this.spritePivot, this.fireballRoot, this.menaceLight);
    this.spritePivot.add(this.impSprite, this.pinkySprite);
    this.root.visible = false;
  }

  isActive(): boolean {
    return this.alive;
  }

  getVariant(): DoomEnemyVariant {
    return this.variant;
  }

  getAimPoint(target = new Vector3()): Vector3 {
    const height = this.variant === 'imp' ? 1.72 : 1.1;
    return target.copy(this.root.position).add(this.aimPoint.set(0, height, 0));
  }

  spawn(position: Vector3, variant: DoomEnemyVariant, tier = 1): void {
    this.variant = variant;
    this.root.position.copy(position);
    this.root.position.y = 0;
    this.root.rotation.y = 0;
    this.elapsed = 0;
    this.attackCooldown = 0;
    this.alive = true;
    this.root.visible = true;
    this.currentSpriteState = null;
    this.attackPoseRemaining = 0;
    this.pathRefreshCooldown = 0;
    this.alerted = false;
    this.currentPath.length = 0;
    this.impSprite.visible = variant === 'imp';
    this.pinkySprite.visible = variant === 'pinky';
    this.impCore.visible = false;
    this.pinkyCore.visible = false;

    if (variant === 'imp') {
      this.health = 104 + tier * 18;
      this.speed = 2.9 + tier * 0.16;
      this.chargeSpeed = 7.1 + tier * 0.3;
      this.attackDamage = 28 + tier * 6.2;
      this.menaceLight.color.setHex(0xff5f2f);
      this.menaceLight.distance = 12;
      this.shadow.scale.setScalar(1);
    } else {
      this.health = 158 + tier * 20;
      this.speed = 3.34 + tier * 0.2;
      this.chargeSpeed = 8.1 + tier * 0.34;
      this.attackDamage = 42 + tier * 6.8;
      this.menaceLight.color.setHex(0xff274a);
      this.menaceLight.distance = 14;
      this.shadow.scale.set(1.36, 1.08, 1);
    }

    this.fireballs.forEach((fireball) => this.hideFireball(fireball));
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
    this.fireballs.forEach((fireball) => this.hideFireball(fireball));
    return true;
  }

  update(deltaSeconds: number, playerPosition: Vector3, navigator?: DoomNavigator): DoomEnemyUpdateResult {
    let damageToPlayer = 0;
    damageToPlayer += this.updateFireballs(deltaSeconds, playerPosition);

    if (!this.alive) {
      return {
        damageToPlayer,
        distanceToPlayer: Infinity,
        seesPlayer: false,
        alertLevel: 0,
      };
    }

    this.elapsed += deltaSeconds;
    this.attackCooldown = Math.max(0, this.attackCooldown - deltaSeconds);
    this.attackPoseRemaining = Math.max(0, this.attackPoseRemaining - deltaSeconds);
    this.pathRefreshCooldown = Math.max(0, this.pathRefreshCooldown - deltaSeconds);

    const toPlayerX = playerPosition.x - this.root.position.x;
    const toPlayerZ = playerPosition.z - this.root.position.z;
    const distanceToPlayer = Math.hypot(toPlayerX, toPlayerZ);

    if (distanceToPlayer > 0.001) {
      const targetYaw = Math.atan2(toPlayerX, toPlayerZ);
      const wrappedDelta = Math.atan2(
        Math.sin(targetYaw - this.root.rotation.y),
        Math.cos(targetYaw - this.root.rotation.y),
      );
      this.root.rotation.y += wrappedDelta * (1 - Math.exp(-7.4 * deltaSeconds));
    }

    const detectionRange = this.variant === 'imp' ? 28 : 25;
    const canSeePlayer = distanceToPlayer <= detectionRange && this.hasLineOfSight(playerPosition);
    if (canSeePlayer || distanceToPlayer <= (this.variant === 'pinky' ? 2.2 : 1.8)) {
      this.alerted = true;
    }
    const chaseSpeed = canSeePlayer ? this.chargeSpeed : this.speed;

    const meleeRange = this.variant === 'pinky' ? 1.18 : 1.02;
    const shouldThrow = this.variant === 'imp' && canSeePlayer && distanceToPlayer >= 3.2 && this.attackCooldown <= 0;
    let moved = false;

    if (distanceToPlayer <= meleeRange && this.attackCooldown <= 0) {
      this.attackCooldown = this.variant === 'pinky' ? 1.05 : 1.2;
      this.attackPoseRemaining = 0.26;
      damageToPlayer += this.attackDamage;
    } else if (shouldThrow) {
      this.launchFireball(playerPosition);
      this.attackCooldown = 10;
      this.attackPoseRemaining = 0.22;
    }

    if (this.alerted && distanceToPlayer > 0.001) {
      moved = this.chasePlayer(playerPosition, navigator, deltaSeconds, chaseSpeed);
    }

    this.updateAnimation(distanceToPlayer, moved, canSeePlayer, playerPosition);

    return {
      damageToPlayer,
      distanceToPlayer,
      seesPlayer: canSeePlayer,
      alertLevel: canSeePlayer ? Math.max(0.2, 1 - distanceToPlayer / detectionRange) : 0,
    };
  }

  private updateAnimation(
    distanceToPlayer: number,
    moving: boolean,
    seesPlayer: boolean,
    playerPosition: Vector3,
  ): void {
    const gait = this.elapsed * (this.variant === 'imp' ? 6.1 : 7.3);
    const bob = Math.abs(Math.sin(gait)) * (this.variant === 'imp' ? 0.08 : 0.05);
    const walkState = Math.floor(this.elapsed * (this.variant === 'imp' ? 7 : 8)) % 2 === 0 ? 'walk-a' : 'walk-b';
    const spriteState: DoomSpriteState = this.attackPoseRemaining > 0
      ? 'attack'
      : moving
        ? walkState
        : 'idle';

    if (spriteState !== this.currentSpriteState) {
      const texture = getEnemyTexture(this.variant, spriteState);
      if (this.variant === 'imp') {
        this.impSpriteMaterial.map = texture;
        this.impSpriteMaterial.needsUpdate = true;
      } else {
        this.pinkySpriteMaterial.map = texture;
        this.pinkySpriteMaterial.needsUpdate = true;
      }
      this.currentSpriteState = spriteState;
    }

    if (this.variant === 'imp') {
      const impScale = spriteState === 'attack' ? 1.16 : 1.06;
      this.impSprite.scale.setScalar(impScale);
      this.impSprite.position.y = 1.43 * impScale + bob;
      this.impCore.visible = false;
      this.pinkyCore.visible = false;
      this.impSprite.visible = true;
      this.pinkySprite.visible = false;
      this.shadow.scale.setScalar(1 + Math.sin(gait) * 0.04);
      this.menaceLight.position.y = 1.48 + bob * 0.4;
    } else {
      const pinkyScaleX = spriteState === 'attack' ? 1.18 : 1.08;
      const pinkyScaleY = spriteState === 'attack' ? 1.1 : 1.05;
      this.pinkySprite.scale.set(
        pinkyScaleX,
        pinkyScaleY,
        1,
      );
      this.pinkySprite.position.y = 1.06 * pinkyScaleY + bob;
      this.impCore.visible = false;
      this.pinkyCore.visible = false;
      this.impSprite.visible = false;
      this.pinkySprite.visible = true;
      this.shadow.scale.set(1.4 + Math.sin(gait) * 0.05, 1.12 + Math.sin(gait) * 0.04, 1);
      this.menaceLight.position.y = 1.12 + bob * 0.34;
    }

    this.menaceLight.intensity = this.variant === 'imp'
      ? 1.05 + Math.sin(this.elapsed * 8.5) * 0.18 + (seesPlayer ? 0.55 : 0) + (this.attackPoseRemaining > 0 ? 0.36 : 0)
      : 1.28 + Math.sin(this.elapsed * 6.2) * 0.22 + (distanceToPlayer < 2.2 ? 0.4 : 0) + (seesPlayer ? 0.48 : 0);

    const toPlayerX = playerPosition.x - this.root.position.x;
    const toPlayerZ = playerPosition.z - this.root.position.z;
    if (toPlayerX * toPlayerX + toPlayerZ * toPlayerZ > 0.0001) {
      const targetYaw = Math.atan2(toPlayerX, toPlayerZ);
      const localYaw = Math.atan2(
        Math.sin(targetYaw - this.root.rotation.y),
        Math.cos(targetYaw - this.root.rotation.y),
      );
      this.spritePivot.rotation.set(0, localYaw, 0);
    } else {
      this.spritePivot.rotation.set(0, 0, 0);
    }
  }

  private buildImpCore(): void {
    const flesh = new MeshStandardMaterial({
      color: 0x5d2a1a,
      emissive: 0x220d08,
      emissiveIntensity: 0.18,
      roughness: 0.92,
      metalness: 0.03,
      flatShading: true,
    });
    const dark = new MeshStandardMaterial({
      color: 0x2b120d,
      emissive: 0x130604,
      emissiveIntensity: 0.08,
      roughness: 0.96,
      metalness: 0.02,
      flatShading: true,
    });
    const bone = new MeshStandardMaterial({
      color: 0xd9c7b3,
      roughness: 0.72,
      metalness: 0.02,
      flatShading: true,
    });

    const torso = new Mesh(new BoxGeometry(0.78, 1.18, 0.56), flesh);
    torso.position.set(0, 1.02, -0.18);
    const chest = new Mesh(new BoxGeometry(0.62, 0.62, 0.48), dark);
    chest.position.set(0, 1.2, -0.04);
    const head = new Mesh(new BoxGeometry(0.64, 0.54, 0.5), flesh);
    head.position.set(0, 1.88, -0.08);
    const jaw = new Mesh(new BoxGeometry(0.5, 0.18, 0.42), dark);
    jaw.position.set(0, 1.63, 0.04);
    const hornLeft = new Mesh(new BoxGeometry(0.08, 0.36, 0.08), bone);
    const hornRight = hornLeft.clone();
    hornLeft.position.set(-0.22, 2.22, -0.06);
    hornRight.position.set(0.22, 2.22, -0.06);
    hornLeft.rotation.z = -0.4;
    hornRight.rotation.z = 0.4;
    const armLeft = new Mesh(new BoxGeometry(0.16, 0.92, 0.18), flesh);
    const armRight = armLeft.clone();
    armLeft.position.set(-0.48, 1.08, -0.08);
    armRight.position.set(0.48, 1.08, -0.08);
    armLeft.rotation.z = 0.16;
    armRight.rotation.z = -0.16;
    const legLeft = new Mesh(new BoxGeometry(0.18, 0.88, 0.24), dark);
    const legRight = legLeft.clone();
    legLeft.position.set(-0.18, 0.34, -0.08);
    legRight.position.set(0.18, 0.34, -0.1);
    const clawLeft = new Mesh(new BoxGeometry(0.06, 0.18, 0.14), bone);
    const clawRight = clawLeft.clone();
    clawLeft.position.set(-0.56, 0.66, 0.02);
    clawRight.position.set(0.56, 0.66, 0.02);

    this.impCore.add(
      torso,
      chest,
      head,
      jaw,
      hornLeft,
      hornRight,
      armLeft,
      armRight,
      legLeft,
      legRight,
      clawLeft,
      clawRight,
    );
    this.impCore.visible = false;
  }

  private buildPinkyCore(): void {
    const flesh = new MeshStandardMaterial({
      color: 0x7b2d3b,
      emissive: 0x25060c,
      emissiveIntensity: 0.16,
      roughness: 0.9,
      metalness: 0.03,
      flatShading: true,
    });
    const dark = new MeshStandardMaterial({
      color: 0x3d1118,
      emissive: 0x140509,
      emissiveIntensity: 0.08,
      roughness: 0.96,
      metalness: 0.02,
      flatShading: true,
    });
    const bone = new MeshStandardMaterial({
      color: 0xe0d0c4,
      roughness: 0.72,
      metalness: 0.02,
      flatShading: true,
    });

    const body = new Mesh(new BoxGeometry(1.44, 0.9, 1.08), flesh);
    body.position.set(0, 0.94, -0.16);
    const back = new Mesh(new BoxGeometry(1.12, 0.54, 0.88), dark);
    back.position.set(0, 1.2, -0.4);
    const head = new Mesh(new BoxGeometry(0.92, 0.58, 0.78), flesh);
    head.position.set(0, 0.96, 0.54);
    const maw = new Mesh(new BoxGeometry(0.74, 0.22, 0.56), dark);
    maw.position.set(0, 0.74, 0.76);
    const fangLeft = new Mesh(new BoxGeometry(0.06, 0.22, 0.12), bone);
    const fangMid = fangLeft.clone();
    const fangRight = fangLeft.clone();
    fangLeft.position.set(-0.22, 0.66, 0.92);
    fangMid.position.set(0, 0.64, 0.95);
    fangRight.position.set(0.22, 0.66, 0.92);

    [
      [-0.56, 0.36, 0.3],
      [0.56, 0.36, 0.3],
      [-0.56, 0.34, -0.48],
      [0.56, 0.34, -0.48],
    ].forEach(([x, y, z]) => {
      const leg = new Mesh(new BoxGeometry(0.2, 0.72, 0.22), dark);
      leg.position.set(x, y, z);
      this.pinkyCore.add(leg);
    });

    this.pinkyCore.add(body, back, head, maw, fangLeft, fangMid, fangRight);
    this.pinkyCore.visible = false;
  }

  private launchFireball(playerPosition: Vector3): void {
    if (!this.hasLineOfSight(playerPosition)) {
      return;
    }

    const fireball = this.getFireball();
    const start = this.getAimPoint(this.projectileTarget);
    this.projectileTarget.copy(playerPosition);
    this.projectileTarget.y = 1.2;
    fireball.mesh.position.copy(start);
    fireball.light.position.copy(start);
    fireball.velocity.copy(this.projectileTarget).sub(start).normalize().multiplyScalar(10.1);
    fireball.remaining = 2.9;
    fireball.damage = this.attackDamage;
    fireball.active = true;
    fireball.mesh.visible = true;
    fireball.light.visible = true;
  }

  private getFireball(): DoomFireball {
    const inactive = this.fireballs.find((candidate) => !candidate.active);
    if (inactive) {
      return inactive;
    }

    const material = new MeshStandardMaterial({
      color: 0xffc17a,
      emissive: 0xff4d20,
      emissiveIntensity: 3.3,
      roughness: 0.28,
      metalness: 0.02,
      flatShading: true,
    });
    const mesh = new Mesh(new SphereGeometry(0.18, 10, 10), material);
    const light = new PointLight(0xff5a24, 2.2, 11, 1.8);
    mesh.visible = false;
    light.visible = false;
    this.fireballRoot.add(mesh, light);

    const fireball: DoomFireball = {
      mesh,
      light,
      velocity: new Vector3(),
      remaining: 0,
      active: false,
      damage: 0,
    };
    this.fireballs.push(fireball);
    return fireball;
  }

  private updateFireballs(deltaSeconds: number, playerPosition: Vector3): number {
    let damage = 0;

    this.fireballs.forEach((fireball) => {
      if (!fireball.active) {
        return;
      }

      fireball.remaining = Math.max(0, fireball.remaining - deltaSeconds);
      fireball.mesh.position.addScaledVector(fireball.velocity, deltaSeconds);
      fireball.light.position.copy(fireball.mesh.position);
      fireball.mesh.scale.setScalar(0.98 + Math.sin(this.elapsed * 14) * 0.12);
      fireball.light.intensity = 1.8 + Math.sin(this.elapsed * 18) * 0.34;

      if (isBlocked(fireball.mesh.position.x, fireball.mesh.position.z, this.colliders, 0.22)) {
        this.hideFireball(fireball);
        return;
      }

      const playerDelta = fireball.mesh.position.distanceToSquared(
        this.projectileTarget.copy(playerPosition).setY(1.2),
      );
      if (playerDelta <= 0.8 * 0.8) {
        damage += fireball.damage;
        this.hideFireball(fireball);
        return;
      }

      if (fireball.remaining <= 0) {
        this.hideFireball(fireball);
      }
    });

    return damage;
  }

  private hideFireball(fireball: DoomFireball): void {
    fireball.active = false;
    fireball.remaining = 0;
    fireball.mesh.visible = false;
    fireball.light.visible = false;
  }

  private chasePlayer(
    playerPosition: Vector3,
    navigator: DoomNavigator | undefined,
    deltaSeconds: number,
    moveSpeed: number,
  ): boolean {
    const radius = this.variant === 'imp' ? 0.46 : 0.58;
    const stepDistance = Math.max(0.001, moveSpeed * deltaSeconds);

    if (!navigator) {
      const distance = this.pathDirection.copy(playerPosition).sub(this.root.position).setY(0).length();
      if (distance < 0.001) {
        return false;
      }

      this.pathDirection.normalize();
      return this.moveTowardTarget(this.pathDirection, Math.min(stepDistance, distance)) > 0.01;
    }

    if (
      this.pathRefreshCooldown <= 0
      || this.currentPath.length === 0
      || this.pathGoal.distanceToSquared(playerPosition) > 1.75 * 1.75
    ) {
      this.pathGoal.copy(navigator.snap(playerPosition, radius));
      this.currentPath = navigator
        .findPath(this.root.position, this.pathGoal, radius)
        .map((waypoint) => waypoint.clone().setY(0));
      this.pathRefreshCooldown = 0.1;
    }

    while (this.currentPath.length > 0) {
      const waypoint = this.currentPath[0];
      if (this.root.position.distanceToSquared(waypoint) > 0.5 * 0.5) {
        break;
      }
      this.currentPath.shift();
    }

    const target = this.currentPath[0] ?? this.pathGoal;
    const distance = this.pathDirection.copy(target).sub(this.root.position).setY(0).length();
    if (distance < 0.001) {
      return false;
    }

    this.pathDirection.normalize();
    const moved = this.moveTowardTarget(this.pathDirection, Math.min(stepDistance, distance));
    if (moved <= 0.01) {
      this.pathRefreshCooldown = 0;
      if (this.currentPath.length > 1) {
        this.currentPath.shift();
      }
      return false;
    }

    return true;
  }

  private hasLineOfSight(target: Vector3): boolean {
    this.lineStep.copy(target).sub(this.root.position);
    const distance = this.lineStep.length();
    if (distance < 0.001) {
      return true;
    }

    this.lineStep.normalize();
    const steps = Math.max(1, Math.floor(distance / 0.45));

    for (let step = 1; step < steps; step += 1) {
      const probeX = this.root.position.x + this.lineStep.x * step * 0.45;
      const probeZ = this.root.position.z + this.lineStep.z * step * 0.45;
      if (isBlocked(probeX, probeZ, this.colliders, 0.18)) {
        return false;
      }
    }

    return true;
  }

  private moveTowardTarget(direction: Vector3, distance: number): number {
    let moved = 0;
    const steps = Math.max(1, Math.ceil(distance / 0.26));
    const stepDistance = distance / steps;

    for (let step = 0; step < steps; step += 1) {
      if (this.tryMove(direction.x * stepDistance, direction.z * stepDistance)) {
        moved += stepDistance;
        continue;
      }

      this.side.set(-direction.z, 0, direction.x);
      const steerBias = Math.sin(this.elapsed * 2 + this.root.position.x * 0.03 + this.root.position.z * 0.03) >= 0
        ? 1
        : -1;
      if (this.trySteerStep(stepDistance, direction, this.side, steerBias)) {
        moved += stepDistance * 0.92;
        continue;
      }
      if (this.trySteerStep(stepDistance, direction, this.side, -steerBias)) {
        moved += stepDistance * 0.92;
        continue;
      }
      if (this.tryMove(direction.x * stepDistance, 0)) {
        moved += stepDistance;
        continue;
      }
      if (this.tryMove(0, direction.z * stepDistance)) {
        moved += stepDistance;
        continue;
      }
      break;
    }

    return moved;
  }

  private trySteerStep(
    stepDistance: number,
    forward: Vector3,
    side: Vector3,
    steerSign: number,
  ): boolean {
    this.movement.copy(forward).addScaledVector(side, steerSign * 0.9);
    if (this.movement.lengthSq() < 0.0001) {
      return false;
    }

    this.movement.normalize().multiplyScalar(stepDistance * 0.92);
    return this.tryMove(this.movement.x, this.movement.z);
  }

  private tryMove(deltaX: number, deltaZ: number): boolean {
    const nextX = this.root.position.x + deltaX;
    const nextZ = this.root.position.z + deltaZ;
    if (isBlocked(nextX, nextZ, this.colliders, this.variant === 'imp' ? 0.46 : 0.58)) {
      return false;
    }

    this.root.position.x = nextX;
    this.root.position.z = nextZ;
    return true;
  }
}
