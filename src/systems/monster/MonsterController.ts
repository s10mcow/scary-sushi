import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
  Vector3,
} from 'three';

import { GAME_CONFIG } from '../../config/gameConfig';
import type { CollisionBox, MazeNavigator } from '../../types/world';
import { isBlocked } from '../collision/isBlocked';

interface MonsterAudioCtor {
  new (): AudioContext;
}

export interface MonsterUpdateState {
  distance: number;
  threat: number;
  touching: boolean;
}

export type MonsterVariant = 'seaweed' | 'spider' | 'duck';

interface MonsterControllerOptions {
  variant?: MonsterVariant;
  audioEnabled?: boolean;
}

const CHASE_MEMORY_SECONDS = 0.55;
const MONSTER_MOVE_STEP = 0.24;

export class MonsterController {
  readonly root = new Group();

  private readonly home = new Vector3();
  private readonly bodyRoot = new Group();
  private readonly bodyBaseScale = new Vector3(1, 1, 1);
  private bodyBaseOffsetY = 0;
  private readonly movement = new Vector3();
  private readonly lookTarget = new Vector3();
  private readonly forward = new Vector3(0, 0, 1);
  private readonly wanderTarget = new Vector3(Number.POSITIVE_INFINITY, 0, Number.POSITIVE_INFINITY);
  private readonly focusDirection = new Vector3(0, 0, 1);
  private readonly toPlayer = new Vector3();
  private readonly limbPivots: Group[] = [];
  private readonly limbBasePositions: Vector3[] = [];
  private readonly detailMeshes: Mesh[] = [];
  private readonly bodyPivots: Group[] = [];
  private readonly orbitPivot = new Group();
  private readonly orbitLight: PointLight;
  private readonly auraLight: PointLight;
  private readonly visionConeMaterial: MeshStandardMaterial;
  private readonly visionCoreMaterial: MeshStandardMaterial;
  private readonly visionCone: Mesh;
  private readonly visionCore: Mesh;
  private readonly audio: MonsterAudio;
  private readonly variant: MonsterVariant;
  private readonly collisionRadius: number;

  private elapsed = 0;
  private chaseMemory = 0;
  private repathCooldown = 0;
  private attackTimeRemaining = 0;
  private readonly currentPath: Vector3[] = [];
  private readonly currentPathTarget = new Vector3(Number.POSITIVE_INFINITY, 0, Number.POSITIVE_INFINITY);

  constructor(
    homePosition: Vector3,
    private readonly sightBlockers: readonly CollisionBox[],
    private readonly navigator: MazeNavigator,
    options: MonsterControllerOptions = {},
  ) {
    this.variant = options.variant ?? 'seaweed';
    this.collisionRadius = getMonsterCollisionRadius(this.variant);
    this.audio = new MonsterAudio(options.audioEnabled ?? true);
    this.home.copy(homePosition);
    this.root.position.copy(this.home);

    this.visionConeMaterial = new MeshStandardMaterial({
      color: 0x8c111b,
      emissive: 0xff2b39,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.14,
      roughness: 0.28,
      metalness: 0.04,
      side: DoubleSide,
      depthWrite: false,
    });
    this.visionCoreMaterial = new MeshStandardMaterial({
      color: 0x6e0d16,
      emissive: 0xff3040,
      emissiveIntensity: 2.4,
      transparent: true,
      opacity: 0.28,
      roughness: 0.24,
      metalness: 0.06,
      depthWrite: false,
    });

    const visionConeLength = GAME_CONFIG.monster.detectionRange - 2.2;
    const visionConeRadius = Math.tan(GAME_CONFIG.monster.visionHalfAngle) * visionConeLength * 1.18;
    const visionCoreLength = Math.max(visionConeLength - 3.2, 6);

    this.visionCone = new Mesh(
      new ConeGeometry(visionConeRadius, visionConeLength, 20, 1, true),
      this.visionConeMaterial,
    );
    this.visionCone.position.set(0, 1.02, visionConeLength * 0.5 + 0.9);
    this.visionCone.rotation.x = -Math.PI / 2;
    this.visionCone.visible = false;

    this.visionCore = new Mesh(
      new CylinderGeometry(0.08, 0.14, visionCoreLength, 10),
      this.visionCoreMaterial,
    );
    this.visionCore.position.set(0, 1.02, visionCoreLength * 0.5 + 0.8);
    this.visionCore.rotation.x = Math.PI / 2;
    this.visionCore.visible = false;

    const orbitMaterial = new MeshStandardMaterial({
      color: 0x48070d,
      emissive: 0xd61622,
      emissiveIntensity: 5.8,
      roughness: 0.34,
      metalness: 0.08,
    });

    this.orbitLight = new PointLight(0xff1f2d, 2.8, 16, 1.55);
    this.orbitLight.castShadow = false;
    this.orbitLight.position.set(0.9, 0.08, 0.22);

    const orbitOrb = new Mesh(new SphereGeometry(0.12, 12, 12), orbitMaterial);
    orbitOrb.position.copy(this.orbitLight.position);
    this.orbitPivot.position.set(0, this.variant === 'spider' ? 1.12 : 1.48, 0.18);
    this.orbitPivot.add(this.orbitLight, orbitOrb);

    this.auraLight = new PointLight(0xc10f18, 1.1, 13, 1.8);
    this.auraLight.position.set(0, this.variant === 'spider' ? 0.98 : 1.28, 0.2);

    this.buildVariantModel(orbitMaterial);
    this.bodyBaseScale.copy(this.bodyRoot.scale);

    this.root.add(
      this.visionCone,
      this.visionCore,
      this.bodyRoot,
      this.orbitPivot,
      this.auraLight,
    );

    this.root.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
  }

  resumeAudio(): void {
    this.audio.resume();
  }

  getVariant(): MonsterVariant {
    return this.variant;
  }

  getPosition(): Vector3 {
    return this.root.position;
  }

  getFocusPosition(target = new Vector3()): Vector3 {
    target.copy(this.root.position);
    target.y += this.variant === 'spider' ? 1.02 : 1.5;
    this.focusDirection.set(0, 0, 1).applyQuaternion(this.root.quaternion);
    this.focusDirection.y = 0;

    if (this.focusDirection.lengthSq() < 0.0001) {
      this.focusDirection.set(0, 0, 1);
    } else {
      this.focusDirection.normalize();
    }

    target.addScaledVector(this.focusDirection, this.variant === 'duck' ? 0.2 : 0.36);
    return target;
  }

  triggerJumpScare(): void {
    this.attackTimeRemaining = GAME_CONFIG.monster.jumpScareDuration;
  }

  reposition(position: Vector3, facingTarget?: Vector3): void {
    this.root.position.copy(position);
    this.root.position.y = this.home.y;
    this.currentPath.length = 0;
    this.currentPathTarget.set(Number.POSITIVE_INFINITY, 0, Number.POSITIVE_INFINITY);
    this.repathCooldown = 0;
    this.chaseMemory = 0;
    this.clearWanderTarget();

    if (facingTarget && facingTarget.distanceToSquared(this.root.position) > 0.0001) {
      this.lookTarget.copy(facingTarget);
      this.lookTarget.y = this.root.position.y;
      this.root.lookAt(this.lookTarget);
    }
  }

  update(deltaSeconds: number, playerPosition: Vector3, playerSafe: boolean): MonsterUpdateState {
    const startX = this.root.position.x;
    const startZ = this.root.position.z;

    this.elapsed += deltaSeconds;
    this.repathCooldown = Math.max(this.repathCooldown - deltaSeconds, 0);
    this.attackTimeRemaining = Math.max(this.attackTimeRemaining - deltaSeconds, 0);

    const playerVisible = !playerSafe && this.canSeePlayer(playerPosition);
    this.chaseMemory = playerVisible
      ? CHASE_MEMORY_SECONDS
      : Math.max(this.chaseMemory - deltaSeconds, 0);

    const shouldChase = !playerSafe && (playerVisible || this.chaseMemory > 0);

    if (playerSafe) {
      this.clearWanderTarget();
      this.followPath(this.home, GAME_CONFIG.monster.retreatSpeed, deltaSeconds, 0.8);
    } else if (shouldChase) {
      this.clearWanderTarget();
      this.followPath(
        playerPosition,
        GAME_CONFIG.monster.chaseSpeed,
        deltaSeconds,
        playerVisible ? 0.12 : 0.2,
      );
    } else {
      this.updateWander(deltaSeconds);
    }

    const distance = this.root.position.distanceTo(playerPosition);
    const maxVisionRange = Math.max(
      GAME_CONFIG.monster.detectionRange,
      GAME_CONFIG.monster.focusedSightRange,
    );
    const visibleThreat = MathUtils.clamp(
      1 - (distance - GAME_CONFIG.monster.nearRange)
        / Math.max(maxVisionRange - GAME_CONFIG.monster.nearRange, 0.0001),
      0,
      1,
    );
    const chaseThreat = this.chaseMemory > 0
      ? visibleThreat * MathUtils.clamp(this.chaseMemory / CHASE_MEMORY_SECONDS, 0, 1)
      : 0;
    const awareness = playerSafe
      ? 0
      : playerVisible
        ? 1
        : this.chaseMemory > 0
          ? 0.28 + chaseThreat * 0.34
          : 0;
    const threat = playerSafe
      ? 0
      : playerVisible
        ? visibleThreat
        : chaseThreat * 0.58;
    const touching = !playerSafe
      && (playerVisible || this.chaseMemory > 0.18)
      && distance <= GAME_CONFIG.monster.attackRange;
    const movedDistance = Math.hypot(this.root.position.x - startX, this.root.position.z - startZ);
    const locomotion = MathUtils.clamp(
      movedDistance / Math.max(deltaSeconds * GAME_CONFIG.monster.chaseSpeed, 0.0001),
      0,
      1,
    );

    this.animateVisuals(deltaSeconds, threat, awareness, locomotion);
    this.audio.update(threat, touching, this.elapsed, awareness);

    return {
      distance,
      threat,
      touching,
    };
  }

  destroy(): void {
    this.audio.destroy();
  }

  private buildVariantModel(lightMaterial: MeshStandardMaterial): void {
    switch (this.variant) {
      case 'seaweed':
        this.buildSeaweedMonster(lightMaterial);
        return;
      case 'spider':
        this.buildSpiderMonster(lightMaterial);
        return;
      case 'duck':
        this.buildDuckMonster(lightMaterial);
        return;
    }
  }

  private buildSeaweedMonster(lightMaterial: MeshStandardMaterial): void {
    const skinMaterial = new MeshStandardMaterial({
      color: 0x1d1f1a,
      roughness: 0.96,
      metalness: 0.04,
    });
    const seaweedMaterial = new MeshStandardMaterial({
      color: 0x0f291f,
      roughness: 0.98,
      metalness: 0.02,
    });
    const mouthMaterial = new MeshStandardMaterial({
      color: 0x7a1f27,
      emissive: 0x4d0609,
      emissiveIntensity: 1.36,
      roughness: 0.9,
      metalness: 0.02,
    });
    const rotMaterial = new MeshStandardMaterial({
      color: 0x591016,
      emissive: 0x64090f,
      emissiveIntensity: 1.16,
      roughness: 0.92,
      metalness: 0.02,
    });

    const head = new Mesh(new SphereGeometry(0.68, 18, 18), skinMaterial);
    head.position.set(0, 1.56, 0);

    const face = new Mesh(new SphereGeometry(0.56, 16, 16), skinMaterial);
    face.scale.set(1.04, 0.84, 0.76);
    face.position.set(0.04, 1.42, 0.3);

    const brow = new Mesh(new BoxGeometry(0.54, 0.11, 0.16), seaweedMaterial);
    brow.position.set(0.02, 1.53, 0.54);
    brow.rotation.x = -0.26;

    const mouth = new Mesh(new BoxGeometry(0.46, 0.14, 0.18), mouthMaterial);
    mouth.position.set(0.03, 1.2, 0.58);

    const jaw = new Mesh(new BoxGeometry(0.5, 0.18, 0.2), mouthMaterial);
    jaw.position.set(0.08, 1.04, 0.5);
    jaw.rotation.x = 0.3;
    jaw.rotation.z = -0.1;

    const mawSplit = new Mesh(new BoxGeometry(0.12, 0.42, 0.14), rotMaterial);
    mawSplit.position.set(0.04, 1.12, 0.6);
    mawSplit.rotation.x = 0.08;

    const eyeLeft = new Mesh(new BoxGeometry(0.1, 0.08, 0.08), lightMaterial);
    eyeLeft.position.set(-0.16, 1.42, 0.56);

    const eyeRight = eyeLeft.clone();
    eyeRight.position.set(0.2, 1.37, 0.56);
    eyeRight.scale.set(1.4, 0.9, 1.1);

    const eyeCenter = new Mesh(new SphereGeometry(0.065, 10, 10), lightMaterial);
    eyeCenter.position.set(0.02, 1.28, 0.6);

    const socketLeft = new Mesh(new SphereGeometry(0.12, 12, 12), rotMaterial);
    socketLeft.scale.set(1.2, 0.7, 0.58);
    socketLeft.position.set(-0.2, 1.32, 0.53);

    const socketRight = socketLeft.clone();
    socketRight.position.x = 0.18;

    for (let index = 0; index < 4; index += 1) {
      const eye = new Mesh(new SphereGeometry(0.038, 10, 10), lightMaterial);
      eye.position.set(-0.24 + index * 0.16, 1.18 - (index % 2) * 0.06, 0.58 + index * 0.02);
      this.bodyRoot.add(eye);
    }

    const cheekLump = new Mesh(new BoxGeometry(0.18, 0.18, 0.22), seaweedMaterial);
    cheekLump.position.set(-0.32, 1.22, 0.5);
    cheekLump.rotation.z = -0.28;

    const shoulderLeft = new Mesh(new SphereGeometry(0.18, 12, 12), seaweedMaterial);
    shoulderLeft.scale.set(1.1, 1.4, 0.92);
    shoulderLeft.position.set(-0.48, 1.22, 0.1);

    const shoulderRight = shoulderLeft.clone();
    shoulderRight.position.x = 0.48;
    shoulderRight.scale.set(0.9, 1.25, 0.88);

    for (let index = 0; index < 3; index += 1) {
      const horn = new Mesh(new CylinderGeometry(0.018, 0.06, 0.44 + index * 0.08, 6), skinMaterial);
      horn.position.set(-0.2 + index * 0.2, 1.86 + index * 0.04, -0.06 + index * 0.02);
      horn.rotation.x = -0.58 + index * 0.12;
      horn.rotation.z = -0.22 + index * 0.18;
      this.detailMeshes.push(horn);
      this.bodyRoot.add(horn);
    }

    for (let index = 0; index < 16; index += 1) {
      const strand = new Mesh(
        new CylinderGeometry(0.022, 0.052, 0.96 + (index % 4) * 0.22, 6),
        seaweedMaterial,
      );
      const angle = (index / 16) * Math.PI * 2;
      strand.position.set(
        Math.cos(angle) * 0.46,
        1.34 - (index % 2) * 0.08,
        Math.sin(angle) * 0.24 + 0.18,
      );
      strand.rotation.z = Math.cos(angle) * 0.42;
      strand.rotation.x = 0.22 + Math.sin(angle) * 0.12;
      this.detailMeshes.push(strand);
      this.bodyRoot.add(strand);
    }

    for (let index = 0; index < 8; index += 1) {
      const hangingTendon = new Mesh(
        new CylinderGeometry(0.012, 0.026, 0.74 + index * 0.08, 5),
        rotMaterial,
      );
      hangingTendon.position.set(-0.26 + index * 0.08, 0.86 - (index % 2) * 0.06, 0.46 + (index % 3) * 0.03);
      hangingTendon.rotation.x = 0.82 + index * 0.04;
      hangingTendon.rotation.z = -0.22 + index * 0.08;
      this.detailMeshes.push(hangingTendon);
      this.bodyRoot.add(hangingTendon);
    }

    for (let index = 0; index < 6; index += 1) {
      const mouthStrand = new Mesh(
        new CylinderGeometry(0.025, 0.045, 0.64 + index * 0.08, 5),
        seaweedMaterial,
      );
      mouthStrand.position.set(-0.18 + index * 0.08, 1.02, 0.5 + (index % 2) * 0.05);
      mouthStrand.rotation.x = 0.92;
      mouthStrand.rotation.z = -0.18 + index * 0.07;
      this.detailMeshes.push(mouthStrand);
      this.bodyRoot.add(mouthStrand);
    }

    for (let index = 0; index < 5; index += 1) {
      const tooth = new Mesh(new BoxGeometry(0.04, 0.16 + (index % 2) * 0.05, 0.05), rotMaterial);
      tooth.position.set(-0.16 + index * 0.08, 1, 0.68 + (index % 2) * 0.02);
      tooth.rotation.x = 0.58 + index * 0.04;
      this.bodyRoot.add(tooth);
    }

    for (let index = 0; index < 4; index += 1) {
      const ribSpike = new Mesh(new BoxGeometry(0.08, 0.08, 0.42), skinMaterial);
      ribSpike.position.set(-0.32 + index * 0.22, 0.8 - index * 0.08, 0.34);
      ribSpike.rotation.x = 0.36;
      ribSpike.rotation.z = -0.18 + index * 0.12;
      this.bodyRoot.add(ribSpike);
    }

    for (let index = 0; index < 4; index += 1) {
      const rib = new Mesh(new BoxGeometry(0.72 - index * 0.06, 0.08, 0.5), seaweedMaterial);
      rib.position.set(0, 1.06 - index * 0.16, 0.04);
      rib.rotation.x = 0.08;
      this.bodyRoot.add(rib);
    }

    const leftArm = this.createSeaweedArm(-0.74, 1.08, 0.1, seaweedMaterial);
    const rightArm = this.createSeaweedArm(0.74, 1.08, 0.1, seaweedMaterial);

    const torso = new Mesh(new BoxGeometry(0.92, 1.18, 0.58), seaweedMaterial);
    torso.position.set(0, 0.76, 0);

    const chestVoid = new Mesh(new BoxGeometry(0.28, 0.46, 0.2), rotMaterial);
    chestVoid.position.set(0.02, 0.84, 0.3);
    chestVoid.rotation.x = 0.08;

    this.bodyRoot.add(
      torso,
      chestVoid,
      head,
      face,
      brow,
      mouth,
      jaw,
      mawSplit,
      eyeLeft,
      eyeRight,
      eyeCenter,
      socketLeft,
      socketRight,
      cheekLump,
      shoulderLeft,
      shoulderRight,
      leftArm,
      rightArm,
    );
  }

  private buildSpiderMonster(lightMaterial: MeshStandardMaterial): void {
    const shellMaterial = new MeshStandardMaterial({
      color: 0x18120f,
      roughness: 0.92,
      metalness: 0.04,
    });
    const underbodyMaterial = new MeshStandardMaterial({
      color: 0x2d1b18,
      roughness: 0.9,
      metalness: 0.03,
    });
    const fangMaterial = new MeshStandardMaterial({
      color: 0x8a7b71,
      emissive: 0x1a0505,
      emissiveIntensity: 0.32,
      roughness: 0.8,
      metalness: 0.04,
    });
    const woundMaterial = new MeshStandardMaterial({
      color: 0x4d1115,
      emissive: 0x5d0910,
      emissiveIntensity: 0.7,
      roughness: 0.84,
      metalness: 0.02,
    });

    this.bodyRoot.scale.set(1.22, 1.22, 1.22);
    this.bodyBaseOffsetY = -0.34;

    const abdomen = new Mesh(new SphereGeometry(0.52, 18, 18), underbodyMaterial);
    abdomen.scale.set(1.48, 1.14, 1.78);
    abdomen.position.set(0, 0.94, -0.26);

    const thorax = new Mesh(new SphereGeometry(0.42, 16, 16), shellMaterial);
    thorax.scale.set(1.24, 0.92, 1.16);
    thorax.position.set(0, 0.96, 0.2);

    const head = new Mesh(new SphereGeometry(0.28, 14, 14), shellMaterial);
    head.scale.set(1.28, 0.8, 1.08);
    head.position.set(0, 1, 0.88);

    const backStripe = new Mesh(new BoxGeometry(0.2, 0.12, 1.08), fangMaterial);
    backStripe.position.set(0, 1.12, -0.18);
    backStripe.rotation.x = 0.16;

    const wound = new Mesh(new BoxGeometry(0.12, 0.08, 0.58), woundMaterial);
    wound.position.set(0, 0.9, -0.34);
    wound.rotation.x = 0.26;

    const bellySlash = new Mesh(new BoxGeometry(0.16, 0.1, 0.72), woundMaterial);
    bellySlash.position.set(0, 0.72, 0.28);
    bellySlash.rotation.x = -0.18;

    for (let index = 0; index < 5; index += 1) {
      const spine = new Mesh(new CylinderGeometry(0.015, 0.06, 0.36 + index * 0.04, 6), fangMaterial);
      spine.position.set(0, 1.22 - index * 0.03, -0.64 + index * 0.22);
      spine.rotation.x = -0.32 - index * 0.04;
      this.detailMeshes.push(spine);
      this.bodyRoot.add(spine);
    }

    for (let index = 0; index < 4; index += 1) {
      const abdomenSpike = new Mesh(new CylinderGeometry(0.02, 0.05, 0.34 + index * 0.05, 6), fangMaterial);
      abdomenSpike.position.set(-0.22 + index * 0.14, 1.14 - index * 0.04, -0.84 + index * 0.08);
      abdomenSpike.rotation.x = -0.86 + index * 0.08;
      abdomenSpike.rotation.z = -0.18 + index * 0.12;
      this.detailMeshes.push(abdomenSpike);
      this.bodyRoot.add(abdomenSpike);
    }

    const mouthCavity = new Mesh(new SphereGeometry(0.14, 10, 10), woundMaterial);
    mouthCavity.scale.set(1.2, 0.72, 0.84);
    mouthCavity.position.set(0, 0.86, 1.02);

    const fangLeft = new Mesh(new CylinderGeometry(0.025, 0.05, 0.44, 6), fangMaterial);
    fangLeft.position.set(-0.14, 0.8, 1.06);
    fangLeft.rotation.x = 0.74;
    fangLeft.rotation.z = 0.26;

    const fangRight = fangLeft.clone();
    fangRight.position.x = 0.14;
    fangRight.rotation.z = -0.26;

    const innerMandibleLeft = new Mesh(new CylinderGeometry(0.02, 0.04, 0.32, 6), fangMaterial);
    innerMandibleLeft.position.set(-0.05, 0.86, 1);
    innerMandibleLeft.rotation.x = 0.98;
    innerMandibleLeft.rotation.z = 0.14;

    const innerMandibleRight = innerMandibleLeft.clone();
    innerMandibleRight.position.x = 0.05;
    innerMandibleRight.rotation.z = -0.14;

    this.detailMeshes.push(fangLeft, fangRight, innerMandibleLeft, innerMandibleRight);

    for (const side of [-1, 1] as const) {
      const scythe = new Mesh(new CylinderGeometry(0.018, 0.035, 0.86, 6), fangMaterial);
      scythe.position.set(side * 0.34, 0.82, 0.76);
      scythe.rotation.x = 1.18;
      scythe.rotation.z = side * 0.42;
      this.bodyRoot.add(scythe);
      this.detailMeshes.push(scythe);
    }

    const eyeOffsets = [
      [-0.22, 1.1, 0.98],
      [-0.14, 1.14, 1.06],
      [-0.06, 1.16, 1.12],
      [0.04, 1.18, 1.12],
      [0.14, 1.14, 1.06],
      [0.22, 1.1, 0.98],
      [-0.11, 1.02, 0.9],
      [0, 1.04, 0.94],
      [0.11, 1.02, 0.9],
      [0, 0.98, 0.84],
    ];
    eyeOffsets.forEach(([x, y, z], index) => {
      const eye = new Mesh(
        new SphereGeometry(index < 6 ? 0.055 : 0.042, 10, 10),
        lightMaterial,
      );
      eye.position.set(x, y, z);
      this.bodyRoot.add(eye);
    });

    for (let index = 0; index < 3; index += 1) {
      const sac = new Mesh(new SphereGeometry(0.11 + index * 0.02, 12, 12), woundMaterial);
      sac.scale.set(0.9, 1.18, 0.92);
      sac.position.set(-0.18 + index * 0.2, 0.58 - index * 0.04, -0.62 - index * 0.08);
      this.bodyRoot.add(sac);
      this.detailMeshes.push(sac);
    }

    for (let index = 0; index < 6; index += 1) {
      const mouthNeedle = new Mesh(new CylinderGeometry(0.012, 0.026, 0.42 + index * 0.03, 5), fangMaterial);
      mouthNeedle.position.set(-0.18 + index * 0.07, 0.8 - (index % 2) * 0.04, 1.02 + index * 0.03);
      mouthNeedle.rotation.x = 0.92 + index * 0.04;
      mouthNeedle.rotation.z = -0.12 + index * 0.05;
      this.bodyRoot.add(mouthNeedle);
      this.detailMeshes.push(mouthNeedle);
    }

    for (const side of [-1, 1] as const) {
      for (let index = 0; index < 4; index += 1) {
        this.bodyRoot.add(this.createSpiderLeg(side, index, shellMaterial));
      }
    }

    this.bodyRoot.add(
      abdomen,
      thorax,
      head,
      backStripe,
      wound,
      bellySlash,
      mouthCavity,
      fangLeft,
      fangRight,
      innerMandibleLeft,
      innerMandibleRight,
    );
  }

  private buildDuckMonster(lightMaterial: MeshStandardMaterial): void {
    const featherMaterial = new MeshStandardMaterial({
      color: 0x171a15,
      roughness: 0.9,
      metalness: 0.03,
    });
    const chestMaterial = new MeshStandardMaterial({
      color: 0x2f3529,
      roughness: 0.86,
      metalness: 0.03,
    });
    const beakMaterial = new MeshStandardMaterial({
      color: 0x6d3516,
      emissive: 0x431406,
      emissiveIntensity: 0.42,
      roughness: 0.72,
      metalness: 0.04,
    });
    const rawMaterial = new MeshStandardMaterial({
      color: 0x641415,
      emissive: 0x6a1015,
      emissiveIntensity: 0.76,
      roughness: 0.88,
      metalness: 0.02,
    });

    this.bodyRoot.scale.set(1.1, 1.1, 1.1);
    this.bodyBaseOffsetY = -0.16;

    const body = new Mesh(new SphereGeometry(0.5, 18, 18), featherMaterial);
    body.scale.set(1.72, 0.94, 2.02);
    body.position.set(0, 1, 0.02);

    const chest = new Mesh(new SphereGeometry(0.34, 16, 16), chestMaterial);
    chest.scale.set(1.2, 0.94, 1.22);
    chest.position.set(0, 1.02, 0.58);

    const chestSplit = new Mesh(new BoxGeometry(0.1, 0.32, 0.24), rawMaterial);
    chestSplit.position.set(0, 0.94, 0.7);
    chestSplit.rotation.x = 0.18;

    const sternum = new Mesh(new BoxGeometry(0.12, 0.62, 0.18), rawMaterial);
    sternum.position.set(0, 0.92, 0.58);
    sternum.rotation.x = 0.08;

    const breastHooksLeft = new Mesh(new BoxGeometry(0.08, 0.22, 0.08), rawMaterial);
    breastHooksLeft.position.set(-0.18, 0.82, 0.78);
    breastHooksLeft.rotation.z = 0.28;
    breastHooksLeft.rotation.x = 0.18;

    const breastHooksRight = breastHooksLeft.clone();
    breastHooksRight.position.x = 0.18;
    breastHooksRight.rotation.z = -0.28;

    for (let side = -1; side <= 1; side += 2) {
      for (let index = 0; index < 3; index += 1) {
        const rib = new Mesh(new BoxGeometry(0.26, 0.05, 0.08), chestMaterial);
        rib.position.set(side * 0.22, 1 - index * 0.12, 0.56 + index * 0.06);
        rib.rotation.z = side * (0.28 + index * 0.08);
        rib.rotation.y = side * 0.12;
        this.bodyRoot.add(rib);
      }
    }

    const tail = new Mesh(new BoxGeometry(0.34, 0.18, 0.4), featherMaterial);
    tail.position.set(0, 1.1, -0.94);
    tail.rotation.x = -0.5;
    this.detailMeshes.push(tail);

    for (let index = 0; index < 4; index += 1) {
      const tailSpike = new Mesh(new BoxGeometry(0.08, 0.04, 0.32), featherMaterial);
      tailSpike.position.set(-0.16 + index * 0.1, 1.16 + (index % 2) * 0.04, -1.02 - index * 0.04);
      tailSpike.rotation.x = -0.78 + index * 0.08;
      tailSpike.rotation.z = -0.14 + index * 0.08;
      this.detailMeshes.push(tailSpike);
      this.bodyRoot.add(tailSpike);
    }

    const neckPivot = new Group();
    neckPivot.position.set(0, 1.14, 0.46);
    this.bodyPivots.push(neckPivot);

    const neck = new Mesh(new CylinderGeometry(0.07, 0.14, 0.98, 10), chestMaterial);
    neck.position.set(0, 0.36, 0.08);
    neck.rotation.x = -0.46;

    const throat = new Mesh(new CylinderGeometry(0.05, 0.08, 0.64, 8), rawMaterial);
    throat.position.set(0, 0.28, 0.24);
    throat.rotation.x = -0.42;

    const head = new Mesh(new SphereGeometry(0.28, 14, 14), featherMaterial);
    head.scale.set(1.06, 0.7, 1.34);
    head.position.set(0, 0.98, 0.4);

    const beakTop = new Mesh(new BoxGeometry(0.28, 0.08, 0.48), beakMaterial);
    beakTop.position.set(0, 0.82, 0.72);
    beakTop.rotation.x = 0.24;

    const beakHook = new Mesh(new BoxGeometry(0.12, 0.12, 0.18), beakMaterial);
    beakHook.position.set(0, 0.72, 0.92);
    beakHook.rotation.x = -0.62;

    const beakBottom = new Mesh(new BoxGeometry(0.24, 0.06, 0.3), beakMaterial);
    beakBottom.position.set(0, 0.72, 0.66);
    beakBottom.rotation.x = -0.38;
    this.detailMeshes.push(beakBottom);

    const innerJaw = new Mesh(new BoxGeometry(0.12, 0.07, 0.32), rawMaterial);
    innerJaw.position.set(0, 0.68, 0.82);
    innerJaw.rotation.x = -0.22;

    const splitMandibleLeft = new Mesh(new CylinderGeometry(0.014, 0.024, 0.34, 5), rawMaterial);
    splitMandibleLeft.position.set(-0.08, 0.66, 0.92);
    splitMandibleLeft.rotation.x = 0.92;
    splitMandibleLeft.rotation.z = 0.18;

    const splitMandibleRight = splitMandibleLeft.clone();
    splitMandibleRight.position.x = 0.08;
    splitMandibleRight.rotation.z = -0.18;

    const eyeLeft = new Mesh(new SphereGeometry(0.055, 10, 10), lightMaterial);
    eyeLeft.position.set(-0.15, 0.96, 0.4);

    const eyeRight = eyeLeft.clone();
    eyeRight.position.x = 0.12;

    const eyeRearLeft = new Mesh(new SphereGeometry(0.036, 10, 10), lightMaterial);
    eyeRearLeft.position.set(-0.09, 0.88, 0.24);

    const eyeRearRight = eyeRearLeft.clone();
    eyeRearRight.position.x = 0.08;

    const browLeft = new Mesh(new BoxGeometry(0.18, 0.05, 0.08), featherMaterial);
    browLeft.position.set(-0.14, 1.04, 0.38);
    browLeft.rotation.z = 0.18;
    browLeft.rotation.x = -0.34;

    const browRight = browLeft.clone();
    browRight.position.x = 0.14;
    browRight.rotation.z = -0.18;

    for (let index = 0; index < 4; index += 1) {
      const eye = new Mesh(new SphereGeometry(index < 2 ? 0.04 : 0.03, 10, 10), lightMaterial);
      eye.position.set(-0.16 + index * 0.1, 0.88 - (index % 2) * 0.08, 0.52 + index * 0.05);
      neckPivot.add(eye);
    }

    for (let index = 0; index < 4; index += 1) {
      const crest = new Mesh(new BoxGeometry(0.06, 0.22 + index * 0.04, 0.06), featherMaterial);
      crest.position.set(-0.1 + index * 0.06, 0.98 + index * 0.06, 0.18 - index * 0.02);
      crest.rotation.x = -0.58 + index * 0.08;
      crest.rotation.z = -0.18 + index * 0.12;
      this.detailMeshes.push(crest);
      neckPivot.add(crest);
    }

    for (let index = 0; index < 4; index += 1) {
      const tooth = new Mesh(new BoxGeometry(0.03, 0.12 + (index % 2) * 0.04, 0.04), rawMaterial);
      tooth.position.set(-0.11 + index * 0.07, 0.67, 0.84 + index * 0.02);
      tooth.rotation.x = 0.66;
      neckPivot.add(tooth);
    }

    for (let index = 0; index < 5; index += 1) {
      const goreRibbon = new Mesh(new BoxGeometry(0.045, 0.34 + index * 0.08, 0.045), rawMaterial);
      goreRibbon.position.set(-0.18 + index * 0.09, 0.42 - index * 0.02, 0.36 + index * 0.03);
      goreRibbon.rotation.z = -0.12 + index * 0.08;
      this.detailMeshes.push(goreRibbon);
      neckPivot.add(goreRibbon);
    }

    for (let index = 0; index < 4; index += 1) {
      const barb = new Mesh(new BoxGeometry(0.04, 0.18 + index * 0.05, 0.06), rawMaterial);
      barb.position.set(-0.16 + index * 0.1, 1.04 + index * 0.06, -0.2 - index * 0.08);
      barb.rotation.x = -0.44 + index * 0.08;
      this.bodyRoot.add(barb);
      this.detailMeshes.push(barb);
    }

    for (let index = 0; index < 3; index += 1) {
      const spine = new Mesh(new BoxGeometry(0.06, 0.14 + index * 0.06, 0.08), rawMaterial);
      spine.position.set(0, 1.08 + index * 0.1, -0.42 - index * 0.16);
      spine.rotation.x = -0.34 + index * 0.08;
      this.bodyRoot.add(spine);
      this.detailMeshes.push(spine);
    }

    neckPivot.add(
      neck,
      throat,
      head,
      beakTop,
      beakHook,
      beakBottom,
      innerJaw,
      splitMandibleLeft,
      splitMandibleRight,
      eyeLeft,
      eyeRight,
      eyeRearLeft,
      eyeRearRight,
      browLeft,
      browRight,
    );

    const leftLeg = this.createDuckLeg(-1, chestMaterial);
    const rightLeg = this.createDuckLeg(1, chestMaterial);
    const leftWing = this.createDuckWing(-1, featherMaterial);
    const rightWing = this.createDuckWing(1, featherMaterial);

    this.bodyRoot.add(
      body,
      chest,
      chestSplit,
      sternum,
      breastHooksLeft,
      breastHooksRight,
      tail,
      neckPivot,
      leftLeg,
      rightLeg,
      leftWing,
      rightWing,
    );
  }

  private createSeaweedArm(
    x: number,
    y: number,
    z: number,
    material: MeshStandardMaterial,
  ): Group {
    const pivot = new Group();
    pivot.position.set(x, y, z);
    this.limbPivots.push(pivot);
    this.limbBasePositions.push(pivot.position.clone());

    const upper = new Mesh(new CylinderGeometry(0.06, 0.09, 0.76, 6), material);
    upper.position.set(0, -0.32, 0.16);
    upper.rotation.z = Math.PI / 2.8;

    const lower = new Mesh(new CylinderGeometry(0.04, 0.06, 0.9, 6), material);
    lower.position.set(0.26, -0.52, 0.42);
    lower.rotation.z = Math.PI / 2.55;
    lower.rotation.y = 0.46;

    const palm = new Mesh(new BoxGeometry(0.2, 0.1, 0.28), material);
    palm.position.set(0.56, -0.68, 0.66);

    pivot.add(upper, lower, palm);

    for (let index = 0; index < 3; index += 1) {
      const finger = new Mesh(new BoxGeometry(0.05, 0.04, 0.38), material);
      finger.position.set(0.66, -0.68 + (index - 1) * 0.05, 0.82 + index * 0.06);
      finger.rotation.x = 0.36 + index * 0.1;
      finger.rotation.y = 0.22;
      pivot.add(finger);

      const claw = new Mesh(new BoxGeometry(0.03, 0.03, 0.18), material);
      claw.position.set(0.72, -0.7 + (index - 1) * 0.05, 1 + index * 0.06);
      claw.rotation.x = 0.74 + index * 0.08;
      claw.rotation.y = 0.18;
      pivot.add(claw);
    }

    return pivot;
  }

  private createSpiderLeg(
    side: -1 | 1,
    index: number,
    material: MeshStandardMaterial,
  ): Group {
    const pivot = new Group();
    pivot.position.set(side * 0.28, 0.92, -0.34 + index * 0.24);
    this.limbPivots.push(pivot);
    this.limbBasePositions.push(pivot.position.clone());

    const upper = new Mesh(new CylinderGeometry(0.028, 0.04, 0.7, 6), material);
    upper.position.set(side * 0.2, -0.02, 0.02);
    upper.rotation.z = side * (Math.PI / 3.4);
    upper.rotation.x = 0.24 - index * 0.12;

    const lower = new Mesh(new CylinderGeometry(0.022, 0.032, 0.76, 6), material);
    lower.position.set(side * 0.52, -0.22, 0.16);
    lower.rotation.z = side * (Math.PI / 4.05);
    lower.rotation.x = 0.48 - index * 0.1;

    const tip = new Mesh(new CylinderGeometry(0.014, 0.02, 0.36, 5), material);
    tip.position.set(side * 0.78, -0.44, 0.3);
    tip.rotation.z = side * (Math.PI / 4.25);
    tip.rotation.x = 0.82 - index * 0.08;

    const blade = new Mesh(new BoxGeometry(0.02, 0.18, 0.18), material);
    blade.position.set(side * 0.92, -0.54, 0.44);
    blade.rotation.z = side * 0.42;
    blade.rotation.x = 0.86;

    pivot.add(upper, lower, tip, blade);
    return pivot;
  }

  private createDuckLeg(side: -1 | 1, material: MeshStandardMaterial): Group {
    const pivot = new Group();
    pivot.position.set(side * 0.22, 0.66, -0.12);
    this.limbPivots.push(pivot);
    this.limbBasePositions.push(pivot.position.clone());

    const leg = new Mesh(new CylinderGeometry(0.03, 0.04, 0.58, 8), material);
    leg.position.set(0, -0.24, 0);

    const shin = new Mesh(new CylinderGeometry(0.024, 0.03, 0.32, 8), material);
    shin.position.set(0, -0.54, 0.06);
    shin.rotation.x = -0.3;

    const foot = new Mesh(new BoxGeometry(0.18, 0.04, 0.28), material);
    foot.position.set(0, -0.74, 0.22);

    pivot.add(leg, shin, foot);

    for (let index = 0; index < 3; index += 1) {
      const claw = new Mesh(new BoxGeometry(0.03, 0.02, 0.14), material);
      claw.position.set(-0.06 + index * 0.06, -0.74, 0.34 + index * 0.01);
      claw.rotation.x = 0.46 + index * 0.06;
      pivot.add(claw);
    }

    return pivot;
  }

  private createDuckWing(side: -1 | 1, material: MeshStandardMaterial): Group {
    const pivot = new Group();
    pivot.position.set(side * 0.58, 1.04, -0.06);
    this.limbPivots.push(pivot);
    this.limbBasePositions.push(pivot.position.clone());

    const wing = new Mesh(new SphereGeometry(0.24, 12, 12), material);
    wing.scale.set(0.74, 0.18, 1.72);
    wing.position.set(side * 0.12, -0.04, 0.02);

    const feather = new Mesh(new BoxGeometry(0.1, 0.04, 0.34), material);
    feather.position.set(side * 0.18, -0.08, 0.32);
    feather.rotation.x = 0.22;

    pivot.add(wing, feather);

    for (let index = 0; index < 3; index += 1) {
      const shard = new Mesh(new BoxGeometry(0.05, 0.03, 0.22 + index * 0.08), material);
      shard.position.set(side * (0.18 + index * 0.06), -0.1 - index * 0.03, 0.16 + index * 0.18);
      shard.rotation.x = 0.4 + index * 0.16;
      shard.rotation.z = side * (0.1 + index * 0.06);
      pivot.add(shard);
    }

    for (let index = 0; index < 3; index += 1) {
      const talon = new Mesh(new BoxGeometry(0.025, 0.025, 0.18 + index * 0.08), material);
      talon.position.set(side * (0.26 + index * 0.08), -0.14 - index * 0.02, 0.38 + index * 0.18);
      talon.rotation.x = 0.86 + index * 0.12;
      talon.rotation.z = side * (0.18 + index * 0.08);
      pivot.add(talon);
    }

    return pivot;
  }

  private moveTowards(target: Vector3, speed: number, deltaSeconds: number): void {
    this.movement.copy(target).sub(this.root.position);
    this.movement.y = 0;

    const distance = this.movement.length();

    if (distance > 0.0001) {
      this.movement.divideScalar(distance);
      const totalStep = Math.min(speed * deltaSeconds, distance);
      const steps = Math.max(1, Math.ceil(totalStep / MONSTER_MOVE_STEP));
      const segmentStep = totalStep / steps;

      for (let stepIndex = 0; stepIndex < steps; stepIndex += 1) {
        const stepX = this.movement.x * segmentStep;
        const stepZ = this.movement.z * segmentStep;
        const position = this.root.position;

        if (this.tryMoveTo(position.x + stepX, position.z + stepZ)) {
          continue;
        }

        const tryXFirst = Math.abs(stepX) >= Math.abs(stepZ);
        const moved = tryXFirst
          ? this.tryMoveTo(position.x + stepX, position.z)
            || this.tryMoveTo(position.x, position.z + stepZ)
          : this.tryMoveTo(position.x, position.z + stepZ)
            || this.tryMoveTo(position.x + stepX, position.z);

        if (!moved) {
          break;
        }
      }
    } else {
      this.lookTarget.copy(this.root.position);
    }

    this.root.position.y = this.home.y;
    this.lookTarget.copy(target);
    this.lookTarget.y = this.root.position.y;

    if (this.lookTarget.distanceToSquared(this.root.position) > 0.0001) {
      this.root.lookAt(this.lookTarget);
    }
  }

  private clearWanderTarget(): void {
    this.wanderTarget.set(Number.POSITIVE_INFINITY, 0, Number.POSITIVE_INFINITY);
  }

  private updateWander(deltaSeconds: number): void {
    if (
      !Number.isFinite(this.wanderTarget.x)
      || this.root.position.distanceToSquared(this.wanderTarget) < 1.2 * 1.2
    ) {
      this.chooseWanderTarget();
    }

    const target = Number.isFinite(this.wanderTarget.x)
      ? this.wanderTarget
      : this.navigator.snap(this.root.position);

    this.followPath(target, GAME_CONFIG.monster.patrolSpeed, deltaSeconds, 0.18);
  }

  private chooseWanderTarget(): void {
    const minDistance = this.root.position.distanceToSquared(this.home) < 18 * 18
      ? 20
      : 14;

    this.wanderTarget.copy(this.navigator.getRandomRoamTarget(this.root.position, minDistance));

    this.currentPath.length = 0;
    this.currentPathTarget.set(Number.POSITIVE_INFINITY, 0, Number.POSITIVE_INFINITY);
    this.repathCooldown = 0;
  }

  private tryMoveTo(x: number, z: number): boolean {
    if (isBlocked(x, z, this.sightBlockers, this.collisionRadius)) {
      return false;
    }

    this.root.position.x = x;
    this.root.position.z = z;
    return true;
  }

  private followPath(
    target: Vector3,
    speed: number,
    deltaSeconds: number,
    repathInterval: number,
  ): void {
    const targetChanged = this.currentPathTarget.distanceToSquared(target) > 4;
    if (targetChanged || this.repathCooldown === 0 || this.currentPath.length === 0) {
      this.currentPath.length = 0;
      this.navigator.findPath(this.root.position, target).forEach((waypoint) => {
        this.currentPath.push(waypoint);
      });
      this.currentPathTarget.copy(target);
      this.repathCooldown = repathInterval;
    }

    while (this.currentPath.length > 1 && this.root.position.distanceTo(this.currentPath[0]) < 0.7) {
      this.currentPath.shift();
    }

    const nextWaypoint = this.currentPath[0] ?? this.navigator.snap(target);
    this.moveTowards(nextWaypoint, speed, deltaSeconds);

    if (this.currentPath.length > 0 && this.root.position.distanceTo(nextWaypoint) < 0.55) {
      this.currentPath.shift();
    }
  }

  private canSeePlayer(playerPosition: Vector3): boolean {
    this.toPlayer.copy(playerPosition).sub(this.root.position);
    this.toPlayer.y = 0;

    const distance = this.toPlayer.length();
    const maxVisionRange = Math.max(
      GAME_CONFIG.monster.detectionRange,
      GAME_CONFIG.monster.focusedSightRange,
    );

    if (distance > maxVisionRange) {
      return false;
    }

    if (distance < 0.0001) {
      return true;
    }

    this.toPlayer.divideScalar(distance);
    this.forward.set(0, 0, 1).applyQuaternion(this.root.quaternion);
    this.forward.y = 0;

    if (this.forward.lengthSq() < 0.0001) {
      this.forward.set(0, 0, 1);
    } else {
      this.forward.normalize();
    }

    if (isSightBlocked(this.root.position, playerPosition, this.sightBlockers)) {
      return false;
    }

    if (distance <= GAME_CONFIG.monster.rearSenseRange) {
      return true;
    }

    const forwardDot = this.forward.dot(this.toPlayer);
    const focusedSightThreshold = Math.cos(GAME_CONFIG.monster.visionHalfAngle * 0.62);

    if (
      distance <= GAME_CONFIG.monster.focusedSightRange
      && forwardDot >= focusedSightThreshold
    ) {
      return true;
    }

    return (
      distance <= GAME_CONFIG.monster.detectionRange
      && forwardDot >= Math.cos(GAME_CONFIG.monster.visionHalfAngle)
    );
  }

  private animateVisuals(
    deltaSeconds: number,
    threat: number,
    awareness: number,
    locomotion: number,
  ): void {
    const attackProgress = this.attackTimeRemaining > 0
      ? 1 - this.attackTimeRemaining / GAME_CONFIG.monster.jumpScareDuration
      : 0;
    const attackIntensity = this.attackTimeRemaining > 0
      ? MathUtils.clamp(0.38 + Math.sin(attackProgress * Math.PI) * 0.72, 0, 1)
      : 0;
    const attackWhip = Math.sin(attackProgress * Math.PI * 2.6) * attackIntensity;

    this.orbitPivot.rotation.y += deltaSeconds * (1.6 + awareness * 2.8 + attackIntensity * 8.6);
    this.orbitPivot.rotation.x = Math.sin(this.elapsed * (2.4 + attackIntensity * 8.2)) * (0.12 + attackIntensity * 0.16);

    this.auraLight.intensity = 1 + threat * 5.2 + awareness * 3.8 + attackIntensity * 7.6;
    this.orbitLight.intensity = 3 + threat * 7.6 + awareness * 4.4 + attackIntensity * 11.4;

    this.visionConeMaterial.opacity = 0.1 + awareness * 0.2 + attackIntensity * 0.18;
    this.visionConeMaterial.emissiveIntensity = 1.2 + awareness * 2.4 + attackIntensity * 2.6;
    this.visionCoreMaterial.opacity = 0.18 + awareness * 0.26 + attackIntensity * 0.24;
    this.visionCoreMaterial.emissiveIntensity = 2.4 + awareness * 3.8 + attackIntensity * 3.2;

    this.visionCone.scale.setScalar(0.86 + awareness * 0.24 + attackIntensity * 0.28);
    this.visionCore.scale.set(
      1 + attackIntensity * 0.12,
      1 + awareness * 0.2 + attackIntensity * 0.34,
      1 + attackIntensity * 0.12,
    );

    this.bodyRoot.position.set(0, this.bodyBaseOffsetY, 0);
    this.bodyRoot.rotation.set(0, 0, 0);

    switch (this.variant) {
      case 'seaweed':
        this.animateSeaweed(awareness);
        break;
      case 'spider':
        this.animateSpider(awareness, locomotion);
        break;
      case 'duck':
        this.animateDuck(awareness, locomotion);
        break;
    }

    this.bodyRoot.scale.copy(this.bodyBaseScale).multiplyScalar(
      1 + attackIntensity * (this.variant === 'spider' ? 0.22 : 0.18),
    );
    this.bodyRoot.position.z += attackIntensity * (this.variant === 'spider' ? 0.92 : this.variant === 'duck' ? 0.74 : 0.66) + attackWhip * 0.08;
    this.bodyRoot.position.y += attackIntensity * (this.variant === 'spider' ? 0.16 : 0.12);
    this.bodyRoot.rotation.x += attackIntensity * (this.variant === 'duck' ? 0.42 : this.variant === 'spider' ? 0.26 : 0.22);
    this.bodyRoot.rotation.z += attackWhip * (this.variant === 'spider' ? 0.18 : 0.1);
  }

  private animateSeaweed(awareness: number): void {
    this.bodyRoot.position.y = this.bodyBaseOffsetY + Math.sin(this.elapsed * 3.4) * 0.04;
    this.bodyRoot.rotation.z = Math.sin(this.elapsed * 1.8) * 0.03 + awareness * 0.04;
    this.bodyRoot.rotation.x = -0.03 + awareness * 0.05;

    this.limbPivots.forEach((pivot, index) => {
      pivot.rotation.x = -0.36 - awareness * 0.74 + Math.sin(this.elapsed * 3.8 + index) * 0.16;
      pivot.rotation.y = (index === 0 ? -1 : 1) * (0.3 + awareness * 0.44);
      pivot.rotation.z = (index === 0 ? -1 : 1) * (0.06 + awareness * 0.16);
    });

    this.detailMeshes.forEach((strand, index) => {
      strand.rotation.x = 0.22 + Math.sin(this.elapsed * 5.8 + index * 0.58) * (0.22 + awareness * 0.08);
      strand.rotation.z += 0.005 + (index % 2 === 0 ? 0.007 : -0.007);
    });
  }

  private animateSpider(awareness: number, locomotion: number): void {
    const gaitTime = this.elapsed * (1.9 + locomotion * 10.4 + awareness * 2.1);
    const creepLift = 0.012 + locomotion * 0.055;
    const bodyRoll = Math.sin(gaitTime * 0.5) * (0.02 + locomotion * 0.05);
    const bodySway = Math.cos(gaitTime) * locomotion * 0.04;

    this.bodyRoot.position.y = this.bodyBaseOffsetY + 0.01 + Math.abs(Math.sin(gaitTime)) * creepLift;
    this.bodyRoot.position.z = bodySway;
    this.bodyRoot.rotation.z = bodyRoll;
    this.bodyRoot.rotation.x = -0.14 + locomotion * 0.08 + awareness * 0.04;

    this.limbPivots.forEach((pivot, index) => {
      const basePosition = this.limbBasePositions[index];
      if (basePosition) {
        pivot.position.copy(basePosition);
      }

      const side = index < 4 ? -1 : 1;
      const legIndex = index % 4;
      const phase = gaitTime + legIndex * 0.82 + (side > 0 ? Math.PI * 0.55 : 0);
      const lift = Math.max(0, Math.sin(phase));
      const drag = Math.cos(phase);

      pivot.position.y += lift * (0.012 + locomotion * 0.08);
      pivot.rotation.z = side * (0.36 + awareness * 0.28) + drag * (0.08 + locomotion * 0.28);
      pivot.rotation.y = side * (0.16 + legIndex * 0.09) + lift * side * 0.05;
      pivot.rotation.x = -0.34 - awareness * 0.06 + drag * (0.06 + locomotion * 0.22);
    });

    this.detailMeshes.forEach((detail, index) => {
      detail.rotation.x = 0.52 + Math.sin(gaitTime * 1.24 + index * 0.6) * (0.08 + locomotion * 0.12) + awareness * 0.08;
    });
  }

  private animateDuck(awareness: number, locomotion: number): void {
    const gaitTime = this.elapsed * (1.7 + locomotion * 8.2 + awareness * 1.7);
    const leftStep = Math.sin(gaitTime);
    const rightStep = Math.sin(gaitTime + Math.PI);
    const bodyBob = Math.abs(Math.sin(gaitTime)) * (0.018 + locomotion * 0.05);
    const twitch = Math.sin(this.elapsed * (8 + awareness * 4)) * (0.01 + awareness * 0.03);

    this.bodyRoot.position.y = this.bodyBaseOffsetY + bodyBob;
    this.bodyRoot.position.z = Math.cos(gaitTime) * locomotion * 0.065;
    this.bodyRoot.rotation.z = Math.sin(gaitTime * 0.5) * (0.028 + locomotion * 0.08) + twitch;
    this.bodyRoot.rotation.x = -0.1 + Math.abs(Math.sin(gaitTime)) * locomotion * 0.12;

    const leftLeg = this.limbPivots[0];
    const rightLeg = this.limbPivots[1];
    const leftWing = this.limbPivots[2];
    const rightWing = this.limbPivots[3];

    if (leftLeg && rightLeg) {
      const leftBase = this.limbBasePositions[0];
      const rightBase = this.limbBasePositions[1];
      if (leftBase) {
        leftLeg.position.copy(leftBase);
      }
      if (rightBase) {
        rightLeg.position.copy(rightBase);
      }

      leftLeg.position.y += Math.max(0, leftStep) * (0.02 + locomotion * 0.08);
      rightLeg.position.y += Math.max(0, rightStep) * (0.02 + locomotion * 0.08);
      leftLeg.rotation.x = leftStep * (0.18 + locomotion * 0.72 + awareness * 0.2) - 0.2;
      rightLeg.rotation.x = rightStep * (0.18 + locomotion * 0.72 + awareness * 0.2) - 0.2;
      leftLeg.rotation.z = -0.04 + Math.max(0, leftStep) * 0.06;
      rightLeg.rotation.z = 0.04 - Math.max(0, rightStep) * 0.06;
    }

    if (leftWing && rightWing) {
      const leftBase = this.limbBasePositions[2];
      const rightBase = this.limbBasePositions[3];
      if (leftBase) {
        leftWing.position.copy(leftBase);
      }
      if (rightBase) {
        rightWing.position.copy(rightBase);
      }

      leftWing.rotation.z = -0.18 - awareness * 0.12 + Math.sin(gaitTime * 0.8) * (0.06 + locomotion * 0.1);
      rightWing.rotation.z = 0.18 + awareness * 0.12 - Math.sin(gaitTime * 0.8) * (0.06 + locomotion * 0.1);
      leftWing.rotation.x = -0.16 + locomotion * 0.08;
      rightWing.rotation.x = -0.16 + locomotion * 0.08;
    }

    this.bodyPivots.forEach((pivot, index) => {
      pivot.rotation.x = -0.32 + Math.sin(gaitTime + index * 0.45) * (0.06 + locomotion * 0.1) + awareness * 0.08;
      pivot.rotation.y = Math.sin(gaitTime * 0.5) * (0.08 + locomotion * 0.08) + twitch * 1.8;
      pivot.rotation.z = twitch * 1.2;
    });

    this.detailMeshes.forEach((detail, index) => {
      detail.rotation.x = (index === 0 ? -0.52 : -0.14) + Math.sin(gaitTime * 0.88 + index * 0.55) * (0.04 + locomotion * 0.08) + twitch * 0.4;
    });
  }
}

class MonsterAudio {
  private readonly context?: AudioContext;
  private readonly staticGain?: GainNode;
  private readonly crackleGain?: GainNode;
  private readonly squelchGain?: GainNode;
  private readonly masterGain?: GainNode;
  private readonly staticBandpass?: BiquadFilterNode;
  private readonly staticLowpass?: BiquadFilterNode;
  private readonly crackleBandpass?: BiquadFilterNode;
  private readonly squelchBandpass?: BiquadFilterNode;
  private readonly sources: AudioBufferSourceNode[] = [];

  constructor(enabled: boolean) {
    if (!enabled) {
      return;
    }

    const AudioCtor = (
      window.AudioContext
      || (window as Window & { webkitAudioContext?: MonsterAudioCtor }).webkitAudioContext
    );

    if (!AudioCtor) {
      return;
    }

    this.context = new AudioCtor();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.context.destination);

    const noiseBuffer = createNoiseBuffer(this.context, 3);
    const crackleBuffer = createCrackleBuffer(this.context, 2.4);

    const staticSource = this.context.createBufferSource();
    staticSource.buffer = noiseBuffer;
    staticSource.loop = true;

    this.staticBandpass = this.context.createBiquadFilter();
    this.staticBandpass.type = 'bandpass';
    this.staticBandpass.frequency.value = 2100;
    this.staticBandpass.Q.value = 0.85;

    this.staticLowpass = this.context.createBiquadFilter();
    this.staticLowpass.type = 'lowpass';
    this.staticLowpass.frequency.value = 4300;

    this.staticGain = this.context.createGain();
    this.staticGain.gain.value = 0;

    staticSource.connect(this.staticBandpass);
    this.staticBandpass.connect(this.staticLowpass);
    this.staticLowpass.connect(this.staticGain);
    this.staticGain.connect(this.masterGain);
    staticSource.start();

    const crackleSource = this.context.createBufferSource();
    crackleSource.buffer = crackleBuffer;
    crackleSource.loop = true;

    this.crackleBandpass = this.context.createBiquadFilter();
    this.crackleBandpass.type = 'bandpass';
    this.crackleBandpass.frequency.value = 3100;
    this.crackleBandpass.Q.value = 1.4;

    this.crackleGain = this.context.createGain();
    this.crackleGain.gain.value = 0;

    crackleSource.connect(this.crackleBandpass);
    this.crackleBandpass.connect(this.crackleGain);
    this.crackleGain.connect(this.masterGain);
    crackleSource.start();

    const squelchSource = this.context.createBufferSource();
    squelchSource.buffer = noiseBuffer;
    squelchSource.loop = true;

    const squelchLowpass = this.context.createBiquadFilter();
    squelchLowpass.type = 'lowpass';
    squelchLowpass.frequency.value = 420;

    this.squelchBandpass = this.context.createBiquadFilter();
    this.squelchBandpass.type = 'bandpass';
    this.squelchBandpass.frequency.value = 190;
    this.squelchBandpass.Q.value = 0.9;

    this.squelchGain = this.context.createGain();
    this.squelchGain.gain.value = 0;

    squelchSource.connect(squelchLowpass);
    squelchLowpass.connect(this.squelchBandpass);
    this.squelchBandpass.connect(this.squelchGain);
    this.squelchGain.connect(this.masterGain);
    squelchSource.start();

    this.sources.push(staticSource, crackleSource, squelchSource);
  }

  resume(): void {
    void this.context?.resume();
  }

  update(threat: number, touching: boolean, elapsed: number, awareness: number): void {
    if (
      !this.context
      || !this.staticGain
      || !this.crackleGain
      || !this.squelchGain
      || !this.staticBandpass
      || !this.staticLowpass
      || !this.crackleBandpass
      || !this.squelchBandpass
    ) {
      return;
    }

    const now = this.context.currentTime;
    const staticPulse = 0.52 + 0.48 * Math.sin(elapsed * 7.9 + Math.sin(elapsed * 1.8) * 0.9);
    const cracklePulse = 0.46 + 0.54 * Math.sin(elapsed * 12.6 + Math.sin(elapsed * 2.7) * 1.4);
    const squelchPulse = 0.48 + 0.52 * Math.sin(elapsed * 4.3 + Math.sin(elapsed * 0.9) * 1.1);

    const staticLevel = threat * threat * (0.045 + staticPulse * 0.04) + awareness * 0.008;
    const crackleLevel = threat * (0.005 + cracklePulse * 0.024) + (touching ? 0.036 : 0);
    const squelchLevel = threat * (0.008 + squelchPulse * 0.03) + (touching ? 0.05 : 0);

    this.staticGain.gain.setTargetAtTime(staticLevel, now, 0.08);
    this.crackleGain.gain.setTargetAtTime(crackleLevel, now, 0.07);
    this.squelchGain.gain.setTargetAtTime(squelchLevel, now, 0.08);

    this.staticBandpass.frequency.setTargetAtTime(
      1700 + awareness * 1000 + Math.sin(elapsed * 3.1) * 120,
      now,
      0.08,
    );
    this.staticLowpass.frequency.setTargetAtTime(3900 + awareness * 1200, now, 0.08);
    this.crackleBandpass.frequency.setTargetAtTime(
      2500 + cracklePulse * 850 + threat * 700,
      now,
      0.07,
    );
    this.squelchBandpass.frequency.setTargetAtTime(
      160 + awareness * 120 + Math.sin(elapsed * 2.1) * 24,
      now,
      0.08,
    );
  }

  destroy(): void {
    this.sources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Ignore nodes that are already stopped.
      }
    });

    void this.context?.close();
  }
}

function createNoiseBuffer(context: AudioContext, durationSeconds: number): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * durationSeconds, context.sampleRate);
  const data = buffer.getChannelData(0);
  let smoothed = 0;

  for (let index = 0; index < data.length; index += 1) {
    const white = Math.random() * 2 - 1;
    smoothed = smoothed * 0.94 + white * 0.18;
    data[index] = smoothed;
  }

  return buffer;
}

function createCrackleBuffer(context: AudioContext, durationSeconds: number): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * durationSeconds, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < data.length; index += 1) {
    const hit = Math.random() < 0.024;
    data[index] = hit ? (Math.random() * 2 - 1) * 0.95 : 0;
  }

  return buffer;
}


function getMonsterCollisionRadius(variant: MonsterVariant): number {
  switch (variant) {
    case 'seaweed':
      return 0.5;
    case 'spider':
      return 0.62;
    case 'duck':
      return 0.72;
  }
}

function isSightBlocked(
  from: Vector3,
  to: Vector3,
  blockers: readonly CollisionBox[],
): boolean {
  const minX = from.x;
  const minZ = from.z;
  const maxX = to.x;
  const maxZ = to.z;

  return blockers.some((blocker) => blocker.enabled !== false && segmentIntersectsRect(
    minX,
    minZ,
    maxX,
    maxZ,
    blocker.centerX - blocker.halfWidth - 0.06,
    blocker.centerX + blocker.halfWidth + 0.06,
    blocker.centerZ - blocker.halfDepth - 0.06,
    blocker.centerZ + blocker.halfDepth + 0.06,
  ));
}

function segmentIntersectsRect(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
): boolean {
  const dx = bx - ax;
  const dz = bz - az;
  const interval = { min: 0, max: 1 };

  return clipSegmentAxis(ax, dx, minX, maxX, interval)
    && clipSegmentAxis(az, dz, minZ, maxZ, interval);
}

function clipSegmentAxis(
  origin: number,
  delta: number,
  min: number,
  max: number,
  interval: { min: number; max: number },
): boolean {
  if (Math.abs(delta) < 0.0001) {
    return origin >= min && origin <= max;
  }

  let t1 = (min - origin) / delta;
  let t2 = (max - origin) / delta;

  if (t1 > t2) {
    [t1, t2] = [t2, t1];
  }

  interval.min = Math.max(interval.min, t1);
  interval.max = Math.min(interval.max, t2);

  return interval.min <= interval.max;
}
