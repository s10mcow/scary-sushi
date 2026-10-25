import {
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from 'three';

import { GAME_CONFIG } from '../config/gameConfig';
import type { CollisionBox } from '../types/world';

export interface ChapterFourteenData {
  root: Group;
  colliders: CollisionBox[];
  spawn: Vector3;
  lookTarget: Vector3;
  update(deltaSeconds: number): void;
  reset(): void;
  getSupportedFloorY(position: Vector3): number | null;
}

interface IslandLobe {
  offsetX: number;
  offsetZ: number;
  radiusX: number;
  radiusZ: number;
}

interface SkyIslandDefinition {
  name: string;
  x: number;
  z: number;
  surfaceY: number;
  rotationY: number;
  depth: number;
  grassColor: number;
  lobes: IslandLobe[];
}

interface DriftCloud {
  group: Group;
  originX: number;
  originY: number;
  originZ: number;
  phase: number;
  initialPhase: number;
  speed: number;
  span: number;
}

const GRASS_THICKNESS = 2.6;
const DIRT_THICKNESS = 3.1;
const STEP_HEIGHT = 1.25;
const GRASS_TOP_SEGMENTS = 28;

const ISLANDS: readonly SkyIslandDefinition[] = [
  {
    name: 'Roost',
    x: 0,
    z: 0,
    surfaceY: 72,
    rotationY: 0.22,
    depth: 22,
    grassColor: 0x3e8f46,
    lobes: [
      { offsetX: 0, offsetZ: 0, radiusX: 40, radiusZ: 32 },
      { offsetX: 26, offsetZ: 12, radiusX: 18, radiusZ: 14 },
      { offsetX: -22, offsetZ: 16, radiusX: 16, radiusZ: 13 },
      { offsetX: 8, offsetZ: -24, radiusX: 15, radiusZ: 17 },
    ],
  },
  {
    name: 'North Gale',
    x: -138,
    z: -78,
    surfaceY: 80,
    rotationY: 0.74,
    depth: 18,
    grassColor: 0x4c9a3d,
    lobes: [
      { offsetX: 0, offsetZ: 0, radiusX: 34, radiusZ: 28 },
      { offsetX: 20, offsetZ: -10, radiusX: 15, radiusZ: 13 },
      { offsetX: -14, offsetZ: 18, radiusX: 14, radiusZ: 12 },
    ],
  },
  {
    name: 'East Mist',
    x: 152,
    z: -46,
    surfaceY: 64,
    rotationY: -0.42,
    depth: 20,
    grassColor: 0x2f7a43,
    lobes: [
      { offsetX: 0, offsetZ: 0, radiusX: 36, radiusZ: 26 },
      { offsetX: -18, offsetZ: 14, radiusX: 15, radiusZ: 13 },
      { offsetX: 16, offsetZ: -16, radiusX: 14, radiusZ: 16 },
    ],
  },
  {
    name: 'High Perch',
    x: 24,
    z: -168,
    surfaceY: 92,
    rotationY: 0.16,
    depth: 16,
    grassColor: 0x67a84a,
    lobes: [
      { offsetX: 0, offsetZ: 0, radiusX: 30, radiusZ: 38 },
      { offsetX: 18, offsetZ: 8, radiusX: 13, radiusZ: 14 },
      { offsetX: -12, offsetZ: -20, radiusX: 14, radiusZ: 12 },
    ],
  },
  {
    name: 'West Cliff',
    x: -158,
    z: 102,
    surfaceY: 58,
    rotationY: 1.08,
    depth: 24,
    grassColor: 0x3f7d52,
    lobes: [
      { offsetX: 0, offsetZ: 0, radiusX: 35, radiusZ: 27 },
      { offsetX: 16, offsetZ: 14, radiusX: 14, radiusZ: 12 },
      { offsetX: -18, offsetZ: -8, radiusX: 13, radiusZ: 15 },
    ],
  },
  {
    name: 'Bright Reach',
    x: 168,
    z: 118,
    surfaceY: 84,
    rotationY: -0.88,
    depth: 17,
    grassColor: 0x5a9e55,
    lobes: [
      { offsetX: 0, offsetZ: 0, radiusX: 28, radiusZ: 36 },
      { offsetX: 14, offsetZ: -16, radiusX: 13, radiusZ: 12 },
      { offsetX: -16, offsetZ: 12, radiusX: 12, radiusZ: 14 },
    ],
  },
  {
    name: 'South Hollow',
    x: -48,
    z: 236,
    surfaceY: 70,
    rotationY: 0.38,
    depth: 19,
    grassColor: 0x46864a,
    lobes: [
      { offsetX: 0, offsetZ: 0, radiusX: 38, radiusZ: 28 },
      { offsetX: 22, offsetZ: 6, radiusX: 15, radiusZ: 13 },
      { offsetX: -10, offsetZ: -18, radiusX: 14, radiusZ: 16 },
    ],
  },
  {
    name: 'Far Crown',
    x: 268,
    z: 246,
    surfaceY: 100,
    rotationY: -0.28,
    depth: 15,
    grassColor: 0x2e6b3c,
    lobes: [
      { offsetX: 0, offsetZ: 0, radiusX: 27, radiusZ: 34 },
      { offsetX: -14, offsetZ: 16, radiusX: 13, radiusZ: 12 },
      { offsetX: 16, offsetZ: -12, radiusX: 12, radiusZ: 14 },
    ],
  },
];

const grassGeometry = new CylinderGeometry(1, 1, GRASS_THICKNESS, GRASS_TOP_SEGMENTS);
const dirtGeometry = new CylinderGeometry(1, 0.96, DIRT_THICKNESS, 22);
const rockGeometry = new CylinderGeometry(0.88, 0.56, 1, 18);
const tipGeometry = new ConeGeometry(1, 1, 14);
const spurGeometry = new ConeGeometry(1, 1, 8);
const patchGeometry = new CylinderGeometry(1, 1, 0.08, 14);
const cloudGeometry = new SphereGeometry(1, 10, 8);
const sunGeometry = new SphereGeometry(1, 20, 14);

const dirtMaterial = new MeshStandardMaterial({ color: 0x6b4630, roughness: 0.97 });
const rockMaterial = new MeshStandardMaterial({ color: 0x6a645c, roughness: 0.94 });
const deepRockMaterial = new MeshStandardMaterial({ color: 0x3c3935, roughness: 0.98 });
const patchMaterial = new MeshStandardMaterial({ color: 0x8fbf62, roughness: 0.92 });
const cloudMaterial = new MeshStandardMaterial({ color: 0xf7fbff, roughness: 1 });
const cloudShadeMaterial = new MeshStandardMaterial({ color: 0xd5e2ee, roughness: 1 });
const sunMaterial = new MeshBasicMaterial({ color: 0xfff3c2 });

const grassMaterials = new Map<number, MeshStandardMaterial>();

function grassMaterial(color: number): MeshStandardMaterial {
  const existing = grassMaterials.get(color);
  if (existing) {
    return existing;
  }

  const material = new MeshStandardMaterial({ color, roughness: 0.94 });
  grassMaterials.set(color, material);
  return material;
}

function hash(value: number): number {
  const scrambled = Math.sin(value * 127.1 + 19.19) * 43758.5453123;
  return scrambled - Math.floor(scrambled);
}

function localToWorld(island: SkyIslandDefinition, localX: number, localZ: number): { x: number; z: number } {
  const cos = Math.cos(island.rotationY);
  const sin = Math.sin(island.rotationY);
  return {
    x: island.x + localX * cos + localZ * sin,
    z: island.z - localX * sin + localZ * cos,
  };
}

function containsPoint(island: SkyIslandDefinition, x: number, z: number): boolean {
  const dx = x - island.x;
  const dz = z - island.z;
  const cos = Math.cos(island.rotationY);
  const sin = Math.sin(island.rotationY);
  const localX = dx * cos - dz * sin;
  const localZ = dx * sin + dz * cos;

  return island.lobes.some((lobe) => {
    const nx = (localX - lobe.offsetX) / lobe.radiusX;
    const nz = (localZ - lobe.offsetZ) / lobe.radiusZ;
    return nx * nx + nz * nz <= 1;
  });
}

function createIsland(island: SkyIslandDefinition): Group {
  const root = new Group();
  root.name = `Chapter 14 island ${island.name}`;
  root.position.set(island.x, island.surfaceY, island.z);
  root.rotation.y = island.rotationY;

  const grass = grassMaterial(island.grassColor);
  island.lobes.forEach((lobe, index) => {
    const isMain = index === 0;
    const cap = new Mesh(grassGeometry, grass);
    cap.name = `Chapter 14 ${island.name} grass`;
    cap.scale.set(lobe.radiusX, 1, lobe.radiusZ);
    cap.position.set(lobe.offsetX, -GRASS_THICKNESS / 2, lobe.offsetZ);

    const dirt = new Mesh(dirtGeometry, dirtMaterial);
    dirt.name = `Chapter 14 ${island.name} dirt`;
    dirt.scale.set(lobe.radiusX * 0.985, 1, lobe.radiusZ * 0.985);
    dirt.position.set(lobe.offsetX, -GRASS_THICKNESS - DIRT_THICKNESS / 2 + 0.2, lobe.offsetZ);

    const rockHeight = island.depth * (isMain ? 1 : 0.58);
    const rock = new Mesh(rockGeometry, rockMaterial);
    rock.name = `Chapter 14 ${island.name} rock`;
    rock.scale.set(lobe.radiusX * (isMain ? 0.9 : 0.82), rockHeight, lobe.radiusZ * (isMain ? 0.9 : 0.82));
    rock.position.set(
      lobe.offsetX,
      -GRASS_THICKNESS - DIRT_THICKNESS - rockHeight / 2 + 0.55,
      lobe.offsetZ,
    );

    root.add(cap, dirt, rock);

    if (!isMain) {
      return;
    }

    const tipHeight = island.depth * 0.62;
    const tip = new Mesh(tipGeometry, deepRockMaterial);
    tip.name = `Chapter 14 ${island.name} underside`;
    tip.scale.set(lobe.radiusX * 0.46, tipHeight, lobe.radiusZ * 0.46);
    tip.position.set(lobe.offsetX, rock.position.y - rockHeight / 2 - tipHeight / 2 + 0.45, lobe.offsetZ);
    root.add(tip);

    for (let spurIndex = 0; spurIndex < 6; spurIndex += 1) {
      const angle = spurIndex * 1.07 + island.rotationY;
      const reach = lobe.radiusX * (0.72 + (spurIndex % 3) * 0.06);
      const spurLength = island.depth * (0.42 + (spurIndex % 2) * 0.1);
      const spur = new Mesh(spurGeometry, spurIndex % 2 === 0 ? rockMaterial : deepRockMaterial);
      spur.name = `Chapter 14 ${island.name} cliff spur`;
      spur.scale.set(6.4 + (spurIndex % 3) * 1.4, spurLength, 5.6);
      spur.position.set(
        Math.cos(angle) * reach,
        -GRASS_THICKNESS - DIRT_THICKNESS - spurLength * 0.2 - 2.2,
        Math.sin(angle) * reach,
      );
      spur.rotation.x = Math.PI;
      spur.rotation.z = Math.cos(angle) * 0.12;
      root.add(spur);
    }

    for (let patchIndex = 0; patchIndex < 5; patchIndex += 1) {
      const seed = island.x + island.z + patchIndex * 17;
      const patch = new Mesh(patchGeometry, patchMaterial);
      patch.name = `Chapter 14 ${island.name} grass patch`;
      patch.scale.set(4 + hash(seed) * 7, 1, 3.5 + hash(seed + 3) * 6);
      patch.position.set(
        (hash(seed + 5) - 0.5) * lobe.radiusX * 1.15,
        0.05,
        (hash(seed + 9) - 0.5) * lobe.radiusZ * 1.05,
      );
      root.add(patch);
    }
  });

  return root;
}

function createCloud(x: number, y: number, z: number, scale: number, seed: number): Group {
  const cloud = new Group();
  cloud.name = 'Chapter 14 cloud';
  cloud.position.set(x, y, z);
  const puffCount = 4 + Math.floor(hash(seed) * 3);
  for (let index = 0; index < puffCount; index += 1) {
    const puff = new Mesh(cloudGeometry, index % 2 === 0 ? cloudMaterial : cloudShadeMaterial);
    const puffScale = scale * (0.5 + hash(seed + index + 1) * 0.7);
    puff.scale.set(puffScale, puffScale * 0.38, puffScale * 0.78);
    puff.position.set(
      (hash(seed + 20 + index) - 0.5) * scale * 1.5,
      (hash(seed + 40 + index) - 0.5) * scale * 0.22,
      (hash(seed + 60 + index) - 0.5) * scale * 1.15,
    );
    cloud.add(puff);
  }
  return cloud;
}

export function createChapterFourteen(): ChapterFourteenData {
  const root = new Group();
  root.name = 'Chapter 14: Bird Sky Islands';

  ISLANDS.forEach((island) => {
    root.add(createIsland(island));
  });

  const cloudRoot = new Group();
  cloudRoot.name = 'Chapter 14 cloud sea';
  const driftingClouds: DriftCloud[] = [];
  const cloudSpots: Array<[number, number, number, number]> = [
    [-80, 2, -40, 34],
    [40, 6, 30, 42],
    [120, 0, -90, 36],
    [-150, 4, 40, 38],
    [10, 8, -120, 40],
    [180, 3, 40, 33],
    [-40, 1, 120, 44],
    [90, 5, 140, 36],
    [-180, -2, -20, 30],
    [60, 7, -180, 38],
    [200, 2, 160, 32],
    [-110, 4, 170, 35],
    [0, 46, -90, 22],
    [-70, 50, 80, 18],
    [110, 42, 20, 20],
    [-20, 38, 150, 16],
  ];
  cloudSpots.forEach(([x, y, z, scale], index) => {
    const cloud = createCloud(x, y, z, scale, index + 4);
    const drift: DriftCloud = {
      group: cloud,
      originX: x,
      originY: y,
      originZ: z,
      phase: index * 0.7,
      initialPhase: index * 0.7,
      speed: 0.08 + (index % 4) * 0.03,
      span: 6 + (index % 3) * 3,
    };
    driftingClouds.push(drift);
    cloudRoot.add(cloud);
  });
  root.add(cloudRoot);

  const sun = new Mesh(sunGeometry, sunMaterial);
  sun.name = 'Chapter 14 sun';
  sun.scale.setScalar(26);
  sun.position.set(230, 168, -190);
  root.add(sun);

  const colliders: CollisionBox[] = [];
  const roost = ISLANDS[0];
  const spawnPoint = localToWorld(roost, 0, 12);
  const lookPoint = localToWorld(roost, -8, -22);
  const spawn = new Vector3(spawnPoint.x, roost.surfaceY + GAME_CONFIG.player.height, spawnPoint.z);
  const lookTarget = new Vector3(lookPoint.x, spawn.y, lookPoint.z);

  const driftClouds = (deltaSeconds: number): void => {
    driftingClouds.forEach((cloud) => {
      cloud.phase += deltaSeconds * cloud.speed;
      cloud.group.position.x = cloud.originX + Math.sin(cloud.phase) * cloud.span;
      cloud.group.position.y = cloud.originY + Math.sin(cloud.phase * 0.65) * 0.7;
    });
  };

  const resetClouds = (): void => {
    driftingClouds.forEach((cloud) => {
      cloud.phase = cloud.initialPhase;
      cloud.group.position.set(cloud.originX, cloud.originY, cloud.originZ);
    });
  };

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    update(deltaSeconds: number): void {
      driftClouds(deltaSeconds);
    },
    reset(): void {
      resetClouds();
    },
    getSupportedFloorY(position: Vector3): number | null {
      const feetY = position.y - GAME_CONFIG.player.height;
      let supportEyeY: number | null = null;
      for (const island of ISLANDS) {
        if (!containsPoint(island, position.x, position.z)) {
          continue;
        }

        if (feetY < island.surfaceY - STEP_HEIGHT) {
          continue;
        }

        const eyeY = island.surfaceY + GAME_CONFIG.player.height;
        if (supportEyeY === null || eyeY > supportEyeY) {
          supportEyeY = eyeY;
        }
      }

      return supportEyeY;
    },
  };
}
