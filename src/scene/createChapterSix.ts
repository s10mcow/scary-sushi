import {
  BackSide,
  BoxGeometry,
  BufferGeometry,
  EdgesGeometry,
  CanvasTexture,
  DoubleSide,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NearestFilter,
  PointLight,
  Raycaster,
  SphereGeometry,
  Vector2,
  Vector3,
  type Camera,
} from 'three';

import { GAME_CONFIG } from '../config/gameConfig';
import type { CollisionBox } from '../types/world';

export interface ChapterSixData {
  root: Group;
  colliders: CollisionBox[];
  spawn: Vector3;
  lookTarget: Vector3;
  getSupportedFloorY(position: Vector3): number | null;
  canPlayerOccupy(currentPosition: Vector3, nextX: number, nextZ: number): boolean;
  update(deltaSeconds: number, camera: Camera, playerPosition: Vector3, active: boolean, miningActive: boolean): void;
  updateBlockHighlight(camera: Camera, active: boolean): void;
  getInventoryStacks(): ChapterSixInventoryStack[];
  getHotbarStacks(): ChapterSixInventorySlot[];
  getSelectedHotbarStack(): ChapterSixInventorySlot;
  getInventoryView(): ChapterSixInventoryView;
  setInventoryOpen(open: boolean): void;
  isInventoryOpen(): boolean;
  petLookedAtPossum(): boolean;
  pickUpLookedAtPossum(): boolean;
  isPettingPossum(): boolean;
  isHoldingPossum(): boolean;
  consumePossumSqueak(): boolean;
  selectHotbarSlot(slot: number): void;
  placeSelectedBlock(playerPosition: Vector3): boolean;
  handleInventoryAction(action: ChapterSixInventoryAction): void;
  reset(): void;
}

const WORLD_CENTER_X = 980;
const WORLD_CENTER_Z = 160;
const BLOCK_SIZE = 1.35;
const WORLD_CELLS = 59;
const HALF_CELLS = Math.floor(WORLD_CELLS / 2);
const WORLD_RADIUS = HALF_CELLS * BLOCK_SIZE;
const BLOCK_REACH = 8.5;

type PixelTextureStyle = 'grass' | 'grass-side' | 'dirt' | 'stone' | 'bark' | 'leaves';
export type ChapterSixBlockType = 'grass' | 'dirt' | 'stone' | 'wood' | 'leaves';
export type ChapterSixItemType = ChapterSixBlockType | 'planks' | 'sticks' | 'crafting-table' | 'wooden-pickaxe' | 'possum';
type ChapterSixPlaceableItemType = Exclude<ChapterSixItemType, 'sticks' | 'wooden-pickaxe' | 'possum'>;

export interface ChapterSixInventoryStack {
  type: ChapterSixItemType;
  label: string;
  count: number;
}

export interface ChapterSixInventorySlot {
  type: ChapterSixItemType | null;
  label: string;
  count: number;
  filled: boolean;
  selected?: boolean;
}

export interface ChapterSixInventoryView {
  hotbar: ChapterSixInventorySlot[];
  inventory: ChapterSixInventorySlot[];
  craft: ChapterSixInventorySlot[];
  result: ChapterSixInventorySlot;
  cursor: ChapterSixInventorySlot;
}

export type ChapterSixInventoryAction =
  | { target: 'slot'; kind: 'hotbar' | 'inventory' | 'craft'; index: number; button: 0 | 2 }
  | { target: 'result'; button: 0 | 2 };

interface ChapterSixBlockRecord {
  key: string;
  type: ChapterSixPlaceableItemType;
  mesh: InstancedMesh | Mesh;
  instanceId: number | null;
  position: Vector3;
  originalMatrix: Matrix4;
  active: boolean;
  terrainKey: string | null;
}

interface ChapterSixPickup {
  root: Mesh;
  type: ChapterSixPlaceableItemType;
  velocityY: number;
  age: number;
  grounded: boolean;
}

interface ChapterSixPossumModel {
  root: Group;
  body: Mesh;
  head: Mesh;
  belly: Mesh;
  tail: Mesh;
  tailSegments: Mesh[];
  leftEar: Group;
  rightEar: Group;
  nose: Mesh;
  leftFrontLeg: Mesh;
  rightFrontLeg: Mesh;
  leftBackLeg: Mesh;
  rightBackLeg: Mesh;
  tailCreases: Mesh[];
}

interface ChapterSixPossumState {
  model: ChapterSixPossumModel;
  spawnGridX: number;
  spawnGridZ: number;
  routeStart: Vector3;
  routeEnd: Vector3;
  targetGridX: number;
  targetGridZ: number;
  moveProgress: number;
  age: number;
  scratchTimer: number;
  petTimer: number;
  petGroundY: number;
  squeakTimer: number;
  carried: boolean;
}

const ITEM_LABELS: Record<ChapterSixItemType, string> = {
  grass: 'Grass Block',
  dirt: 'Dirt',
  stone: 'Stone',
  wood: 'Oak Log',
  leaves: 'Leaves',
  planks: 'Oak Planks',
  sticks: 'Sticks',
  'crafting-table': 'Crafting Table',
  'wooden-pickaxe': 'Wooden Pickaxe',
  possum: 'Possum',
};

const BLOCK_MINE_SECONDS: Record<ChapterSixPlaceableItemType, number> = {
  grass: 0.55,
  dirt: 0.55,
  leaves: 0.42,
  wood: 1.05,
  stone: 3.2,
  planks: 0.75,
  'crafting-table': 0.9,
};

const INVENTORY_ORDER: ChapterSixItemType[] = ['possum', 'wood', 'planks', 'sticks', 'crafting-table', 'wooden-pickaxe', 'grass', 'dirt', 'stone', 'leaves'];
const PLACEABLE_ITEMS = new Set<ChapterSixItemType>(['grass', 'dirt', 'stone', 'wood', 'leaves', 'planks', 'crafting-table']);
const CHAPTER_SIX_INVENTORY_SLOT_COUNT = 36;
const CHAPTER_SIX_HOTBAR_SLOT_COUNT = 9;
const CHAPTER_SIX_CRAFT_SLOT_COUNT = 4;
const CHAPTER_SIX_MAX_STACK = 64;
const PICKUP_SIZE = BLOCK_SIZE * 0.44;
const PICKUP_RADIUS = PICKUP_SIZE * 0.72;
const POSSUM_PET_SECONDS = 3.4;
const POSSUM_REACH = 4.6;
const POSSUM_COUNT = 6;

function addCollider(colliders: CollisionBox[], x: number, z: number, width: number, depth: number): void {
  colliders.push({
    centerX: x,
    centerZ: z,
    halfWidth: width / 2,
    halfDepth: depth / 2,
  });
}

function createPixelTexture(base: string, accents: string[], seedOffset: number, style: PixelTextureStyle): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  let seed = 1009 + seedOffset;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  if (context) {
    context.imageSmoothingEnabled = false;
    context.fillStyle = base;
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y += 2) {
      for (let x = 0; x < canvas.width; x += 2) {
        const accent = accents[Math.floor(random() * accents.length)] ?? base;
        context.fillStyle = random() > 0.42 ? accent : base;
        context.globalAlpha = 0.38 + random() * 0.48;
        context.fillRect(x, y, 2, 2);
      }
    }

    if (style === 'grass') {
      for (let blade = 0; blade < 38; blade += 1) {
        context.globalAlpha = 0.48 + random() * 0.4;
        context.fillStyle = accents[Math.floor(random() * accents.length)] ?? '#6ec45a';
        const x = Math.floor(random() * canvas.width);
        const y = Math.floor(random() * canvas.height);
        context.fillRect(x, y, 1, 2 + Math.floor(random() * 4));
      }
    } else if (style === 'grass-side') {
      context.globalAlpha = 1;
      context.fillStyle = '#7a4b2d';
      context.fillRect(0, 8, canvas.width, 24);
      context.fillStyle = '#4f9e3d';
      context.fillRect(0, 0, canvas.width, 8);

      for (let dirtSpeck = 0; dirtSpeck < 34; dirtSpeck += 1) {
        context.globalAlpha = 0.5 + random() * 0.32;
        context.fillStyle = random() > 0.45 ? '#4d2f1f' : '#b07b4e';
        const size = random() > 0.7 ? 3 : 2;
        context.fillRect(Math.floor(random() * 31), 8 + Math.floor(random() * 23), size, size);
      }

      for (let blade = 0; blade < 24; blade += 1) {
        context.globalAlpha = 0.5 + random() * 0.38;
        context.fillStyle = random() > 0.55 ? '#86d16f' : '#39772f';
        const x = Math.floor(random() * canvas.width);
        context.fillRect(x, Math.floor(random() * 7), 1, 2 + Math.floor(random() * 3));
      }
    } else if (style === 'dirt') {
      for (let pebble = 0; pebble < 34; pebble += 1) {
        context.globalAlpha = 0.5 + random() * 0.36;
        context.fillStyle = random() > 0.45 ? '#4d2f1f' : '#b07b4e';
        const size = random() > 0.65 ? 3 : 2;
        context.fillRect(Math.floor(random() * 31), Math.floor(random() * 31), size, size);
      }
    } else if (style === 'stone') {
      context.globalAlpha = 0.16;
      context.fillStyle = '#b0b6ba';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.globalAlpha = 0.2;
      context.fillStyle = '#5f666b';
      context.fillRect(0, 18, canvas.width, 7);
      context.globalAlpha = 0.18;
      context.fillStyle = '#92999e';
      context.fillRect(5, 5, 20, 5);
      context.fillRect(12, 25, 16, 4);

      context.globalAlpha = 0.32;
      context.strokeStyle = '#4d5358';
      for (let crack = 0; crack < 5; crack += 1) {
        const startX = Math.floor(random() * canvas.width);
        const startY = Math.floor(random() * canvas.height);
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(startX + (random() - 0.5) * 22, startY + (random() - 0.5) * 8);
        context.stroke();
      }
    } else if (style === 'bark') {
      for (let stripe = 0; stripe < canvas.width; stripe += 4) {
        context.globalAlpha = 0.38 + random() * 0.28;
        context.fillStyle = stripe % 8 === 0 ? '#3f281a' : '#9c6c43';
        context.fillRect(stripe + Math.floor(random() * 2), 0, 2, canvas.height);
      }
      for (let knot = 0; knot < 9; knot += 1) {
        context.globalAlpha = 0.62;
        context.fillStyle = '#2f1b11';
        context.fillRect(Math.floor(random() * 27), Math.floor(random() * 29), 4, 2);
      }
    } else {
      for (let leaf = 0; leaf < 32; leaf += 1) {
        context.globalAlpha = 0.42 + random() * 0.42;
        context.fillStyle = random() > 0.45 ? '#6abf62' : '#215b2b';
        context.fillRect(Math.floor(random() * 30), Math.floor(random() * 30), 2, 2);
      }
    }

    context.globalAlpha = 1;
  }

  const texture = new CanvasTexture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

function createPixelMaterial(base: string, accents: string[], seedOffset: number, style: PixelTextureStyle): MeshStandardMaterial {
  return new MeshStandardMaterial({
    map: createPixelTexture(base, accents, seedOffset, style),
    roughness: 0.94,
    metalness: 0.01,
  });
}

function terrainLevel(gridX: number, gridZ: number): number {
  const x = gridX - HALF_CELLS;
  const z = gridZ - HALF_CELLS;
  const hillA = Math.sin(x * 0.34) * 1.15 + Math.cos(z * 0.28) * 1.05;
  const hillB = Math.sin((x + z) * 0.18) * 0.9 + Math.cos((x - z) * 0.21) * 0.7;
  const moundNorth = Math.max(0, 1 - Math.hypot(x + 7, z - 10) / 17) * 3.2;
  const moundEast = Math.max(0, 1 - Math.hypot(x - 12, z + 4) / 15) * 2.8;
  const valley = Math.max(0, 1 - Math.hypot(x - 2, z - 3) / 12) * -1.4;
  const raw = 2.2 + hillA + hillB + moundNorth + moundEast + valley;
  let level = MathUtils.clamp(Math.round(raw), 0, 7);

  if (Math.abs(x) <= 2 && Math.abs(z) <= 2) {
    level = 2;
  }

  return level;
}

function getWorldX(gridX: number): number {
  return WORLD_CENTER_X + (gridX - HALF_CELLS) * BLOCK_SIZE;
}

function getWorldZ(gridZ: number): number {
  return WORLD_CENTER_Z + (gridZ - HALF_CELLS) * BLOCK_SIZE;
}

function setInstance(matrix: Matrix4, mesh: InstancedMesh, index: number, x: number, y: number, z: number): void {
  matrix.makeTranslation(x, y, z);
  mesh.setMatrixAt(index, matrix);
}

function createPossumModel(blockSize: number): ChapterSixPossumModel {
  const root = new Group();
  root.name = 'Chapter 6 Possum';

  const bodyMaterial = new MeshStandardMaterial({ color: 0x1f1814, roughness: 0.94 });
  const headMaterial = new MeshStandardMaterial({ color: 0xf1eee6, roughness: 0.88 });
  const bellyMaterial = new MeshStandardMaterial({ color: 0xf8f2e8, roughness: 0.9 });
  const pinkMaterial = new MeshStandardMaterial({ color: 0xf0a0ad, roughness: 0.82 });
  const darkMaterial = new MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.86 });
  const earMaterial = new MeshStandardMaterial({ color: 0x17110f, roughness: 0.9 });
  const creaseMaterial = new MeshStandardMaterial({ color: 0xb96f7e, roughness: 0.86 });
  const innerEarMaterial = new MeshStandardMaterial({
    color: 0xf0a0ad,
    roughness: 0.86,
    side: DoubleSide,
  });

  const body = new Mesh(new BoxGeometry(blockSize * 0.62, blockSize * 0.4, blockSize * 0.84), bodyMaterial);
  body.position.set(0, blockSize * 0.36, 0);

  const belly = new Mesh(new BoxGeometry(blockSize * 0.48, blockSize * 0.05, blockSize * 0.56), bellyMaterial);
  belly.position.set(0, blockSize * 0.16, -blockSize * 0.02);

  const head = new Mesh(new BoxGeometry(blockSize * 0.46, blockSize * 0.38, blockSize * 0.38), headMaterial);
  head.position.set(0, blockSize * 0.45, -blockSize * 0.52);

  const nose = new Mesh(new BoxGeometry(blockSize * 0.13, blockSize * 0.1, blockSize * 0.08), pinkMaterial);
  nose.position.set(0, blockSize * 0.43, -blockSize * 0.76);

  const leftEye = new Mesh(new BoxGeometry(blockSize * 0.045, blockSize * 0.055, blockSize * 0.02), darkMaterial);
  leftEye.position.set(-blockSize * 0.12, blockSize * 0.5, -blockSize * 0.715);
  const rightEye = leftEye.clone();
  rightEye.position.x = blockSize * 0.12;

  const createEar = (side: -1 | 1): Group => {
    const ear = new Group();
    ear.position.set(side * blockSize * 0.2, blockSize * 0.68, -blockSize * 0.51);
    ear.rotation.z = side * -0.16;

    const outer = new Mesh(new BoxGeometry(blockSize * 0.16, blockSize * 0.22, blockSize * 0.08), earMaterial);
    const inner = new Mesh(new BoxGeometry(blockSize * 0.1, blockSize * 0.14, blockSize * 0.012), innerEarMaterial);
    inner.position.z = -blockSize * 0.047;
    ear.add(outer, inner);
    return ear;
  };

  const leftEar = createEar(-1);
  const rightEar = createEar(1);

  const tailSegments = Array.from({ length: 3 }, (_, index) => {
    const segment = new Mesh(new BoxGeometry(
      blockSize * (0.12 - index * 0.018),
      blockSize * (0.11 - index * 0.014),
      blockSize * 0.27,
    ), pinkMaterial);
    segment.position.set(0, blockSize * (0.31 - index * 0.018), blockSize * (0.42 + index * 0.22));
    segment.rotation.x = -0.12 - index * 0.03;
    return segment;
  });
  const tail = tailSegments[0];
  const tailCreases: Mesh[] = [];
  for (let creaseIndex = 0; creaseIndex < 4; creaseIndex += 1) {
    const crease = new Mesh(new BoxGeometry(blockSize * 0.13, blockSize * 0.018, blockSize * 0.018), creaseMaterial);
    crease.position.set(0, blockSize * 0.3, blockSize * (0.38 + creaseIndex * 0.13));
    crease.rotation.x = -0.12;
    root.add(crease);
    tailCreases.push(crease);
  }

  const createLeg = (x: number, z: number): Mesh => {
    const leg = new Mesh(new BoxGeometry(blockSize * 0.12, blockSize * 0.18, blockSize * 0.14), darkMaterial);
    leg.position.set(x, blockSize * 0.12, z);
    return leg;
  };
  const leftFrontLeg = createLeg(-blockSize * 0.2, -blockSize * 0.26);
  const rightFrontLeg = createLeg(blockSize * 0.2, -blockSize * 0.26);
  const leftBackLeg = createLeg(-blockSize * 0.2, blockSize * 0.26);
  const rightBackLeg = createLeg(blockSize * 0.2, blockSize * 0.26);

  const shoulderPatch = new Mesh(new BoxGeometry(blockSize * 0.52, blockSize * 0.025, blockSize * 0.2), new MeshStandardMaterial({ color: 0x30251e, roughness: 0.94 }));
  shoulderPatch.position.set(0, blockSize * 0.58, -blockSize * 0.14);

  root.add(body, belly, head, nose, leftEye, rightEye, leftEar, rightEar, ...tailSegments, leftFrontLeg, rightFrontLeg, leftBackLeg, rightBackLeg, shoulderPatch);

  return {
    root,
    body,
    head,
    belly,
    tail,
    tailSegments,
    leftEar,
    rightEar,
    nose,
    leftFrontLeg,
    rightFrontLeg,
    leftBackLeg,
    rightBackLeg,
    tailCreases,
  };
}

export function createChapterSix(): ChapterSixData {
  const root = new Group();
  root.name = 'Chapter 6 Minecraft';
  const colliders: CollisionBox[] = [];

  const grassTopMaterial = createPixelMaterial('#4f9e3d', ['#6ec45a', '#39772f', '#86d16f', '#2f642b'], 1, 'grass');
  const dirtMaterial = createPixelMaterial('#7a4b2d', ['#9c6b42', '#4d2f1f', '#b07b4e', '#6f472d'], 2, 'dirt');
  const grassSideMaterial = createPixelMaterial('#7a4b2d', ['#9c6b42', '#4d2f1f', '#6ec45a', '#39772f'], 6, 'grass-side');
  const stoneMaterial = createPixelMaterial('#777d82', ['#969da3', '#53585d', '#aeb5b9', '#63696e'], 3, 'stone');
  const barkMaterial = createPixelMaterial('#6a452a', ['#8a5b37', '#4a2d1c', '#9c6c43', '#3f281a'], 4, 'bark');
  const leavesMaterial = createPixelMaterial('#2f7d38', ['#4da24e', '#215b2b', '#6abf62', '#367b31'], 5, 'leaves');
  const planksMaterial = createPixelMaterial('#b9854e', ['#d09b61', '#7c4f2c', '#e0b374', '#6b3f22'], 7, 'bark');
  const craftingTableMaterial = createPixelMaterial('#9b6338', ['#d2a066', '#5a321b', '#c48245', '#322015'], 8, 'bark');
  const cloudMaterial = new MeshBasicMaterial({
    color: 0xf5fbff,
    transparent: true,
    opacity: 0.92,
  });
  const skyMaterial = new MeshBasicMaterial({
    color: 0x8ccfff,
    side: BackSide,
  });

  const heights: number[][] = [];
  const grassPositions: Vector3[] = [];
  const dirtPositions: Vector3[] = [];
  const stonePositions: Vector3[] = [];
  const trunkPositions: Vector3[] = [];
  const leavesPositions: Vector3[] = [];
  const matrix = new Matrix4();
  const highlightedBlockMatrix = new Matrix4();
  const hiddenBlockMatrix = new Matrix4().makeScale(0, 0, 0);
  hiddenBlockMatrix.setPosition(0, -9999, 0);
  const blockRaycaster = new Raycaster();
  const screenCenter = new Vector2(0, 0);
  const selectableMeshes: InstancedMesh[] = [];
  const selectablePlacedMeshes: Mesh[] = [];
  const blockRecords: ChapterSixBlockRecord[] = [];
  const blockRecordsByInstance = new Map<string, ChapterSixBlockRecord>();
  const blockRecordsByObject = new Map<string, ChapterSixBlockRecord>();
  const originalTerrainBlockKeys = new Set<string>();
  const activeTerrainBlockKeys = new Set<string>();
  const pickups: ChapterSixPickup[] = [];
  const inventorySlots: Array<{ type: ChapterSixItemType | null; count: number }> = Array.from(
    { length: CHAPTER_SIX_INVENTORY_SLOT_COUNT },
    () => ({ type: null, count: 0 }),
  );
  const craftSlots: Array<{ type: ChapterSixItemType | null; count: number }> = Array.from(
    { length: CHAPTER_SIX_CRAFT_SLOT_COUNT },
    () => ({ type: null, count: 0 }),
  );
  const cursorStack: { type: ChapterSixItemType | null; count: number } = { type: null, count: 0 };
  let selectedHotbarSlot: number | null = 0;
  let inventoryOpen = false;
  let selectedBlock: ChapterSixBlockRecord | null = null;
  let selectedPlacementPosition: Vector3 | null = null;
  let miningBlock: ChapterSixBlockRecord | null = null;
  let miningProgress = 0;
  let possumLookedAtState: ChapterSixPossumState | null = null;
  let possumSqueakQueued = false;
  const possums: ChapterSixPossumState[] = [];

  const getTerrainKey = (gridX: number, gridZ: number, level: number): string => `${gridX}:${gridZ}:${level}`;
  const getInstanceKey = (mesh: InstancedMesh, instanceId: number): string => `${mesh.uuid}:${instanceId}`;
  const getTerrainInfo = (position: Vector3): { gridX: number; gridZ: number; level: number } => ({
    gridX: Math.round((position.x - WORLD_CENTER_X) / BLOCK_SIZE) + HALF_CELLS,
    gridZ: Math.round((position.z - WORLD_CENTER_Z) / BLOCK_SIZE) + HALF_CELLS,
    level: Math.round((position.y + BLOCK_SIZE / 2) / BLOCK_SIZE),
  });

  const registerBlock = (
    mesh: InstancedMesh | Mesh,
    instanceId: number | null,
    type: ChapterSixPlaceableItemType,
    position: Vector3,
    terrainBlock: boolean,
  ): void => {
    const originalMatrix = new Matrix4().makeTranslation(position.x, position.y, position.z);
    const terrainInfo = terrainBlock ? getTerrainInfo(position) : null;
    const terrainKey = terrainInfo
      ? getTerrainKey(terrainInfo.gridX, terrainInfo.gridZ, terrainInfo.level)
      : null;
    const record: ChapterSixBlockRecord = {
      key: `${type}:${position.x.toFixed(2)}:${position.y.toFixed(2)}:${position.z.toFixed(2)}`,
      type,
      mesh,
      instanceId,
      position: position.clone(),
      originalMatrix,
      active: true,
      terrainKey,
    };

    if (terrainKey) {
      originalTerrainBlockKeys.add(terrainKey);
      activeTerrainBlockKeys.add(terrainKey);
    }

    blockRecords.push(record);
    if (mesh instanceof InstancedMesh && instanceId !== null) {
      blockRecordsByInstance.set(getInstanceKey(mesh, instanceId), record);
    } else {
      blockRecordsByObject.set(mesh.uuid, record);
    }
  };

  for (let gridX = 0; gridX < WORLD_CELLS; gridX += 1) {
    heights[gridX] = [];
    for (let gridZ = 0; gridZ < WORLD_CELLS; gridZ += 1) {
      const level = terrainLevel(gridX, gridZ);
      heights[gridX][gridZ] = level;
      const x = getWorldX(gridX);
      const z = getWorldZ(gridZ);
      grassPositions.push(new Vector3(x, level * BLOCK_SIZE - BLOCK_SIZE / 2, z));

      const bottomLevel = Math.max(-2, level - 4);
      for (let blockLevel = level - 1; blockLevel >= bottomLevel; blockLevel -= 1) {
        const position = new Vector3(x, blockLevel * BLOCK_SIZE - BLOCK_SIZE / 2, z);
        if (blockLevel >= level - 2) {
          dirtPositions.push(position);
        } else {
          stonePositions.push(position);
        }
      }

      const localX = gridX - HALF_CELLS;
      const localZ = gridZ - HALF_CELLS;
      const treeScore = Math.sin(gridX * 12.9898 + gridZ * 78.233) * 43758.5453;
      const treeRandom = treeScore - Math.floor(treeScore);
      const farFromSpawn = Math.hypot(localX, localZ) > 4.5;
      const treeAllowed = farFromSpawn && level >= 1 && treeRandom > 0.89;
      if (treeAllowed) {
        const topY = level * BLOCK_SIZE;
        const leafLowerY = topY + BLOCK_SIZE * 4.5;
        const leafUpperY = topY + BLOCK_SIZE * 5.5;
        for (let trunkLevel = 0; trunkLevel < 4; trunkLevel += 1) {
          trunkPositions.push(new Vector3(x, topY + BLOCK_SIZE / 2 + trunkLevel * BLOCK_SIZE, z));
        }

        for (let leafX = -1; leafX <= 1; leafX += 1) {
          for (let leafZ = -1; leafZ <= 1; leafZ += 1) {
            leavesPositions.push(new Vector3(
              x + leafX * BLOCK_SIZE,
              leafLowerY,
              z + leafZ * BLOCK_SIZE,
            ));
            if (Math.abs(leafX) + Math.abs(leafZ) <= 1) {
              leavesPositions.push(new Vector3(
                x + leafX * BLOCK_SIZE,
                leafUpperY,
                z + leafZ * BLOCK_SIZE,
              ));
            }
          }
        }
      }
    }
  }

  const blockGeometry = new BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  const grassBlockMaterials = [
    grassSideMaterial,
    grassSideMaterial,
    grassTopMaterial,
    dirtMaterial,
    grassSideMaterial,
    grassSideMaterial,
  ];
  const grassMesh = new InstancedMesh(blockGeometry, grassBlockMaterials, grassPositions.length);
  grassPositions.forEach((position, index) => {
    setInstance(matrix, grassMesh, index, position.x, position.y, position.z);
    registerBlock(grassMesh, index, 'grass', position, true);
  });
  grassMesh.instanceMatrix.needsUpdate = true;
  root.add(grassMesh);
  selectableMeshes.push(grassMesh);

  const dirtMesh = new InstancedMesh(blockGeometry, dirtMaterial, dirtPositions.length);
  dirtPositions.forEach((position, index) => {
    setInstance(matrix, dirtMesh, index, position.x, position.y, position.z);
    registerBlock(dirtMesh, index, 'dirt', position, true);
  });
  dirtMesh.instanceMatrix.needsUpdate = true;
  root.add(dirtMesh);
  selectableMeshes.push(dirtMesh);

  const stoneMesh = new InstancedMesh(blockGeometry, stoneMaterial, stonePositions.length);
  stonePositions.forEach((position, index) => {
    setInstance(matrix, stoneMesh, index, position.x, position.y, position.z);
    registerBlock(stoneMesh, index, 'stone', position, true);
  });
  stoneMesh.instanceMatrix.needsUpdate = true;
  root.add(stoneMesh);
  selectableMeshes.push(stoneMesh);

  const trunkMesh = new InstancedMesh(blockGeometry, barkMaterial, trunkPositions.length);
  trunkPositions.forEach((position, index) => {
    setInstance(matrix, trunkMesh, index, position.x, position.y, position.z);
    registerBlock(trunkMesh, index, 'wood', position, false);
  });
  trunkMesh.instanceMatrix.needsUpdate = true;
  root.add(trunkMesh);
  selectableMeshes.push(trunkMesh);

  const leavesMesh = new InstancedMesh(blockGeometry, leavesMaterial, leavesPositions.length);
  leavesPositions.forEach((position, index) => {
    setInstance(matrix, leavesMesh, index, position.x, position.y, position.z);
    registerBlock(leavesMesh, index, 'leaves', position, false);
  });
  leavesMesh.instanceMatrix.needsUpdate = true;
  root.add(leavesMesh);
  selectableMeshes.push(leavesMesh);

  const blockHighlight = new LineSegments(
    new EdgesGeometry(new BoxGeometry(BLOCK_SIZE * 1.018, BLOCK_SIZE * 1.018, BLOCK_SIZE * 1.018)),
    new LineBasicMaterial({
      color: 0x050505,
      transparent: true,
      opacity: 0.96,
    }),
  );
  blockHighlight.name = 'Chapter 6 selected block outline';
  blockHighlight.visible = false;
  blockHighlight.userData.placementToolIgnore = true;
  root.add(blockHighlight);

  const crackOverlay = new LineSegments(
    new BufferGeometry(),
    new LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 1,
      depthTest: false,
    }),
  );
  crackOverlay.name = 'Chapter 6 mining cracks';
  crackOverlay.visible = false;
  crackOverlay.userData.placementToolIgnore = true;
  root.add(crackOverlay);

  const pickupGeometry = new BoxGeometry(PICKUP_SIZE, PICKUP_SIZE, PICKUP_SIZE);
  const getBlockMaterial = (type: ChapterSixPlaceableItemType): MeshStandardMaterial | MeshStandardMaterial[] => {
    switch (type) {
      case 'grass':
        return grassBlockMaterials;
      case 'dirt':
        return dirtMaterial;
      case 'stone':
        return stoneMaterial;
      case 'wood':
        return barkMaterial;
      case 'leaves':
        return leavesMaterial;
      case 'planks':
        return planksMaterial;
      case 'crafting-table':
        return craftingTableMaterial;
    }
  };

  const normalizeStack = (stack: { type: ChapterSixItemType | null; count: number }): void => {
    if (stack.count <= 0 || !stack.type) {
      stack.type = null;
      stack.count = 0;
    }
  };

  const addItemToInventory = (type: ChapterSixItemType, count = 1): number => {
    let remaining = count;
    for (const slot of inventorySlots) {
      if (remaining <= 0) {
        break;
      }

      if (slot.type === type && slot.count < CHAPTER_SIX_MAX_STACK) {
        const moved = Math.min(remaining, CHAPTER_SIX_MAX_STACK - slot.count);
        slot.count += moved;
        remaining -= moved;
      }
    }

    for (const slot of inventorySlots) {
      if (remaining <= 0) {
        break;
      }

      if (!slot.type || slot.count <= 0) {
        const moved = Math.min(remaining, CHAPTER_SIX_MAX_STACK);
        slot.type = type;
        slot.count = moved;
        remaining -= moved;
      }
    }

    return remaining;
  };

  const getSlotView = (
    stack: { type: ChapterSixItemType | null; count: number },
    selected = false,
  ): ChapterSixInventorySlot => ({
    type: stack.type,
    label: stack.type ? ITEM_LABELS[stack.type] : 'Empty',
    count: stack.type ? stack.count : 0,
    filled: Boolean(stack.type && stack.count > 0),
    selected,
  });

  const getCraftRecipe = (): { type: ChapterSixItemType; count: number } | null => {
    const filled = craftSlots
      .map((slot, index) => ({ ...slot, index }))
      .filter((slot) => slot.type && slot.count > 0);
    if (filled.length === 0) {
      return null;
    }

    if (filled.length === 4 && filled.every((slot) => slot.type === 'wood')) {
      return { type: 'crafting-table', count: 1 };
    }

    if (filled.length === 1 && filled[0].type === 'wood') {
      return { type: 'planks', count: 4 };
    }

    const verticalStickRecipe =
      filled.length === 2
      && filled.every((slot) => slot.type === 'planks')
      && (
        (craftSlots[0].type === 'planks' && craftSlots[2].type === 'planks')
        || (craftSlots[1].type === 'planks' && craftSlots[3].type === 'planks')
      );
    if (verticalStickRecipe) {
      return { type: 'sticks', count: 4 };
    }

    const simplifiedPickaxeRecipe =
      filled.length === 4
      && craftSlots[0].type === 'planks'
      && craftSlots[1].type === 'planks'
      && craftSlots[2].type === 'sticks'
      && craftSlots[3].type === 'sticks';
    if (simplifiedPickaxeRecipe) {
      return { type: 'wooden-pickaxe', count: 1 };
    }

    return null;
  };

  const getInventoryActionSlot = (
    action: Extract<ChapterSixInventoryAction, { target: 'slot' }>,
  ): { type: ChapterSixItemType | null; count: number } | null => {
    if (action.kind === 'hotbar') {
      return inventorySlots[action.index] ?? null;
    }

    if (action.kind === 'inventory') {
      return inventorySlots[CHAPTER_SIX_HOTBAR_SLOT_COUNT + action.index] ?? null;
    }

    return craftSlots[action.index] ?? null;
  };

  const moveCursorWithSlot = (
    slot: { type: ChapterSixItemType | null; count: number },
    button: 0 | 2,
  ): void => {
    normalizeStack(slot);
    normalizeStack(cursorStack);

    if (!cursorStack.type) {
      if (!slot.type) {
        return;
      }

      if (button === 2) {
        cursorStack.type = slot.type;
        cursorStack.count = 1;
        slot.count -= 1;
        normalizeStack(slot);
        return;
      }

      cursorStack.type = slot.type;
      cursorStack.count = slot.count;
      slot.type = null;
      slot.count = 0;
      return;
    }

    if (!slot.type) {
      slot.type = cursorStack.type;
      const moved = button === 2 ? 1 : cursorStack.count;
      slot.count = moved;
      cursorStack.count -= moved;
      normalizeStack(cursorStack);
      return;
    }

    if (slot.type === cursorStack.type) {
      const moved = Math.min(
        button === 2 ? 1 : cursorStack.count,
        CHAPTER_SIX_MAX_STACK - slot.count,
      );
      slot.count += moved;
      cursorStack.count -= moved;
      normalizeStack(cursorStack);
      return;
    }

    if (button === 0) {
      const oldType = slot.type;
      const oldCount = slot.count;
      slot.type = cursorStack.type;
      slot.count = cursorStack.count;
      cursorStack.type = oldType;
      cursorStack.count = oldCount;
    }
  };

  const updateCrackOverlay = (record: ChapterSixBlockRecord | null, progress: number): void => {
    if (!record || progress <= 0) {
      crackOverlay.visible = false;
      return;
    }

    const half = BLOCK_SIZE * 0.532;
    const crackCount = MathUtils.clamp(Math.ceil(progress * 12), 2, 12);
    const templates: Array<[number, number, number, number]> = [
      [-0.28, 0.1, -0.04, 0.24],
      [-0.04, 0.24, 0.18, 0.08],
      [0.18, 0.08, 0.32, 0.22],
      [-0.18, -0.12, 0.04, 0.04],
      [0.04, 0.04, 0.26, -0.16],
      [-0.34, -0.28, -0.1, -0.06],
      [-0.1, -0.06, 0.12, -0.3],
      [0.02, 0.34, 0.1, 0.12],
      [0.1, 0.12, 0.36, -0.02],
      [-0.36, 0.3, -0.16, 0.06],
      [0.18, -0.34, 0.36, -0.12],
      [-0.02, -0.42, 0.18, -0.18],
    ];
    const points: Vector3[] = [];
    const addCrack = (startX: number, startY: number, endX: number, endY: number): void => {
      points.push(
        new Vector3(startX * BLOCK_SIZE, startY * BLOCK_SIZE, half),
        new Vector3(endX * BLOCK_SIZE, endY * BLOCK_SIZE, half),
        new Vector3(startX * BLOCK_SIZE, startY * BLOCK_SIZE, -half),
        new Vector3(endX * BLOCK_SIZE, endY * BLOCK_SIZE, -half),
        new Vector3(startX * BLOCK_SIZE, half, startY * BLOCK_SIZE),
        new Vector3(endX * BLOCK_SIZE, half, endY * BLOCK_SIZE),
        new Vector3(half, startY * BLOCK_SIZE, startX * BLOCK_SIZE),
        new Vector3(half, endY * BLOCK_SIZE, endX * BLOCK_SIZE),
        new Vector3(-half, startY * BLOCK_SIZE, startX * BLOCK_SIZE),
        new Vector3(-half, endY * BLOCK_SIZE, endX * BLOCK_SIZE),
      );
    };

    for (let index = 0; index < crackCount; index += 1) {
      const [startX, startY, endX, endY] = templates[index];
      addCrack(startX, startY, endX, endY);
    }

    crackOverlay.geometry.dispose();
    crackOverlay.geometry = new BufferGeometry().setFromPoints(points);
    crackOverlay.position.copy(record.position);
    crackOverlay.quaternion.identity();
    crackOverlay.visible = true;
  };

  const spawnPickup = (record: ChapterSixBlockRecord): void => {
    const pickup = new Mesh(pickupGeometry, getBlockMaterial(record.type));
    pickup.name = `Chapter 6 ${ITEM_LABELS[record.type]} pickup`;
    pickup.position.copy(record.position);
    pickup.position.y += BLOCK_SIZE * 0.16;
    pickup.userData.placementToolIgnore = true;
    root.add(pickup);
    pickups.push({
      root: pickup,
      type: record.type,
      velocityY: 0,
      age: 0,
      grounded: false,
    });
  };

  const breakBlock = (record: ChapterSixBlockRecord): void => {
    record.active = false;
    if (record.mesh instanceof InstancedMesh && record.instanceId !== null) {
      record.mesh.setMatrixAt(record.instanceId, hiddenBlockMatrix);
      record.mesh.instanceMatrix.needsUpdate = true;
    } else {
      record.mesh.visible = false;
    }
    if (record.terrainKey) {
      activeTerrainBlockKeys.delete(record.terrainKey);
    }
    spawnPickup(record);
  };

  const updateMining = (deltaSeconds: number, miningActive: boolean): void => {
    if (!miningActive || !selectedBlock?.active) {
      miningBlock = null;
      miningProgress = 0;
      updateCrackOverlay(null, 0);
      return;
    }

    if (miningBlock !== selectedBlock) {
      miningBlock = selectedBlock;
      miningProgress = 0;
    }

    miningProgress += deltaSeconds / BLOCK_MINE_SECONDS[selectedBlock.type];
    updateCrackOverlay(selectedBlock, miningProgress);

    if (miningProgress >= 1) {
      breakBlock(selectedBlock);
      selectedBlock = null;
      miningBlock = null;
      miningProgress = 0;
      updateCrackOverlay(null, 0);
    }
  };

  const getPickupSupportYBelow = (pickup: Mesh): number => {
    const pickupBottom = pickup.position.y - PICKUP_SIZE / 2;
    const halfBlock = BLOCK_SIZE / 2;
    let supportY = PICKUP_SIZE / 2 + 0.035;

    for (const record of blockRecords) {
      if (!record.active) {
        continue;
      }

      if (
        Math.abs(pickup.position.x - record.position.x) > halfBlock + PICKUP_RADIUS
        || Math.abs(pickup.position.z - record.position.z) > halfBlock + PICKUP_RADIUS
      ) {
        continue;
      }

      const blockTop = record.position.y + halfBlock;
      if (blockTop <= pickupBottom + 0.04) {
        supportY = Math.max(supportY, blockTop + PICKUP_SIZE / 2 + 0.035);
      }
    }

    return supportY;
  };

  const updatePickups = (deltaSeconds: number, playerPosition: Vector3): void => {
    for (let index = pickups.length - 1; index >= 0; index -= 1) {
      const pickup = pickups[index];
      pickup.age += deltaSeconds;
      pickup.root.rotation.y += deltaSeconds * 1.85;
      pickup.root.rotation.x = Math.sin(pickup.age * 1.7) * 0.12;
      const groundY = getPickupSupportYBelow(pickup.root);
      if (pickup.grounded && pickup.root.position.y > groundY + BLOCK_SIZE * 0.2) {
        pickup.grounded = false;
        pickup.velocityY = Math.min(pickup.velocityY, 0);
      }

      if (!pickup.grounded) {
        pickup.velocityY -= GAME_CONFIG.player.gravity * deltaSeconds;
        pickup.root.position.y += pickup.velocityY * deltaSeconds;
        if (pickup.root.position.y <= groundY) {
          pickup.root.position.y = groundY;
          pickup.velocityY = 0;
          pickup.grounded = true;
        }
      } else {
        pickup.root.position.y = groundY + Math.sin(pickup.age * 3.4) * 0.055;
      }

      const horizontalDistance = Math.hypot(
        pickup.root.position.x - playerPosition.x,
        pickup.root.position.z - playerPosition.z,
      );
      const verticalDistance = Math.abs(pickup.root.position.y - (playerPosition.y - GAME_CONFIG.player.height * 0.5));
      if (horizontalDistance < PICKUP_RADIUS + GAME_CONFIG.player.radius && verticalDistance < GAME_CONFIG.player.height) {
        addItemToInventory(pickup.type, 1);
        root.remove(pickup.root);
        pickups.splice(index, 1);
      }
    }
  };

  [
    [WORLD_CENTER_X - 28, 30, WORLD_CENTER_Z - 50],
    [WORLD_CENTER_X + 34, 34, WORLD_CENTER_Z - 24],
    [WORLD_CENTER_X - 54, 28, WORLD_CENTER_Z + 22],
  ].forEach(([x, y, z]) => {
    const cloud = new Group();
    cloud.position.set(x, y, z);
    [
      [0, 0, 0, 5.5, 1.8, 3.0],
      [4, 0.4, 0.8, 4.2, 1.6, 2.8],
      [-4.3, 0.2, 0.4, 3.8, 1.4, 2.4],
      [0.8, 1.2, -0.4, 3.4, 1.8, 2.2],
    ].forEach(([offsetX, offsetY, offsetZ, width, height, depth]) => {
      const puff = new Mesh(new BoxGeometry(width, height, depth), cloudMaterial);
      puff.position.set(offsetX, offsetY, offsetZ);
      cloud.add(puff);
    });
    root.add(cloud);
  });

  const sky = new Mesh(new SphereGeometry(260, 32, 16), skyMaterial);
  sky.position.set(WORLD_CENTER_X, 42, WORLD_CENTER_Z);
  root.add(sky);

  const sun = new PointLight(0xfff2c7, 4.8, 260, 1.1);
  sun.position.set(WORLD_CENTER_X - 74, 86, WORLD_CENTER_Z - 58);
  const fill = new PointLight(0xbde7ff, 1.8, 210, 1.4);
  fill.position.set(WORLD_CENTER_X + 70, 36, WORLD_CENTER_Z + 70);
  root.add(sun, fill);

  const boundaryPadding = 5;
  addCollider(colliders, WORLD_CENTER_X, WORLD_CENTER_Z - WORLD_RADIUS - boundaryPadding, WORLD_RADIUS * 2 + 16, 2);
  addCollider(colliders, WORLD_CENTER_X, WORLD_CENTER_Z + WORLD_RADIUS + boundaryPadding, WORLD_RADIUS * 2 + 16, 2);
  addCollider(colliders, WORLD_CENTER_X - WORLD_RADIUS - boundaryPadding, WORLD_CENTER_Z, 2, WORLD_RADIUS * 2 + 16);
  addCollider(colliders, WORLD_CENTER_X + WORLD_RADIUS + boundaryPadding, WORLD_CENTER_Z, 2, WORLD_RADIUS * 2 + 16);

  const spawnLevel = heights[HALF_CELLS][HALF_CELLS];
  const spawn = new Vector3(WORLD_CENTER_X, GAME_CONFIG.player.height + spawnLevel * BLOCK_SIZE, WORLD_CENTER_Z);
  const lookTarget = new Vector3(WORLD_CENTER_X + 16, spawn.y - 0.25, WORLD_CENTER_Z - 20);
  const getGroundYAtGrid = (gridX: number, gridZ: number): number => (heights[gridX]?.[gridZ] ?? spawnLevel) * BLOCK_SIZE;
  const createGroundPoint = (gridX: number, gridZ: number): Vector3 => new Vector3(
    getWorldX(gridX),
    getGroundYAtGrid(gridX, gridZ),
    getWorldZ(gridZ),
  );
  const getRandomPossumGrid = (): { gridX: number; gridZ: number } => {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const gridX = 5 + Math.floor(Math.random() * (WORLD_CELLS - 10));
      const gridZ = 5 + Math.floor(Math.random() * (WORLD_CELLS - 10));
      if (Math.hypot(gridX - HALF_CELLS, gridZ - HALF_CELLS) > 5) {
        return { gridX, gridZ };
      }
    }

    return {
      gridX: HALF_CELLS + Math.floor(Math.random() * 14) - 7,
      gridZ: HALF_CELLS + Math.floor(Math.random() * 14) - 7,
    };
  };
  const choosePossumTarget = (state: ChapterSixPossumState): void => {
    const wanderRadius = 10;
    let targetGridX = state.targetGridX;
    let targetGridZ = state.targetGridZ;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const candidateX = MathUtils.clamp(state.targetGridX + Math.floor(Math.random() * (wanderRadius * 2 + 1)) - wanderRadius, 3, WORLD_CELLS - 4);
      const candidateZ = MathUtils.clamp(state.targetGridZ + Math.floor(Math.random() * (wanderRadius * 2 + 1)) - wanderRadius, 3, WORLD_CELLS - 4);
      if (
        Math.hypot(candidateX - state.targetGridX, candidateZ - state.targetGridZ) >= 3
        && Math.abs(getGroundYAtGrid(candidateX, candidateZ) - state.routeEnd.y) <= BLOCK_SIZE * 1.25
      ) {
        targetGridX = candidateX;
        targetGridZ = candidateZ;
        break;
      }
    }

    state.routeStart.copy(state.routeEnd);
    state.targetGridX = targetGridX;
    state.targetGridZ = targetGridZ;
    state.routeEnd.copy(createGroundPoint(targetGridX, targetGridZ));
    state.moveProgress = 0;
  };
  const facePossumToward = (state: ChapterSixPossumState, direction: Vector3): void => {
    const flatDirection = direction.clone();
    flatDirection.y = 0;
    if (flatDirection.lengthSq() <= 0.001) {
      return;
    }

    flatDirection.normalize();
    state.model.root.rotation.set(0, Math.atan2(-flatDirection.x, -flatDirection.z), 0);
  };
  const createPossumState = (gridX: number, gridZ: number, index: number): ChapterSixPossumState => {
    const model = createPossumModel(BLOCK_SIZE);
    const position = createGroundPoint(gridX, gridZ);
    model.root.position.copy(position);
    model.root.userData.placementToolIgnore = true;
    model.belly.visible = false;
    model.root.traverse((object) => {
      object.userData.placementToolIgnore = true;
    });
    root.add(model.root);

    const state: ChapterSixPossumState = {
      model,
      spawnGridX: gridX,
      spawnGridZ: gridZ,
      routeStart: position.clone(),
      routeEnd: position.clone(),
      targetGridX: gridX,
      targetGridZ: gridZ,
      moveProgress: Math.random() * 0.6,
      age: Math.random() * 8,
      scratchTimer: 2.5 + Math.random() * 6,
      petTimer: 0,
      petGroundY: position.y,
      squeakTimer: 3.5 + index + Math.random() * 7,
      carried: false,
    };
    facePossumToward(state, new Vector3(WORLD_CENTER_X - position.x, 0, WORLD_CENTER_Z - position.z));
    choosePossumTarget(state);
    return state;
  };
  for (let possumIndex = 0; possumIndex < POSSUM_COUNT; possumIndex += 1) {
    const { gridX, gridZ } = getRandomPossumGrid();
    possums.push(createPossumState(gridX, gridZ, possumIndex));
  }

  const getGridIndex = (value: number, center: number): number => Math.round((value - center) / BLOCK_SIZE) + HALF_CELLS;
  const canPlayerOccupy = (currentPosition: Vector3, nextX: number, nextZ: number): boolean => {
    const footY = currentPosition.y - GAME_CONFIG.player.height;
    const headY = currentPosition.y;
    const playerRadius = GAME_CONFIG.player.radius;
    const halfBlock = BLOCK_SIZE / 2;

    for (const record of blockRecords) {
      if (!record.active) {
        continue;
      }

      if (
        Math.abs(nextX - record.position.x) >= halfBlock + playerRadius
        || Math.abs(nextZ - record.position.z) >= halfBlock + playerRadius
      ) {
        continue;
      }

      const blockBottom = record.position.y - halfBlock;
      const blockTop = record.position.y + halfBlock;
      if (blockTop > footY + 0.06 && blockBottom < headY - 0.08) {
        return false;
      }
    }

    return true;
  };

  const hasActiveBlockAt = (position: Vector3): boolean => blockRecords.some((record) => (
    record.active
    && Math.abs(record.position.x - position.x) < 0.03
    && Math.abs(record.position.y - position.y) < 0.03
    && Math.abs(record.position.z - position.z) < 0.03
  ));

  const isPlacementInsidePlayer = (position: Vector3, playerPosition: Vector3): boolean => {
    const halfBlock = BLOCK_SIZE / 2;
    const footY = playerPosition.y - GAME_CONFIG.player.height;
    const headY = playerPosition.y;
    return Math.abs(playerPosition.x - position.x) < halfBlock + GAME_CONFIG.player.radius
      && Math.abs(playerPosition.z - position.z) < halfBlock + GAME_CONFIG.player.radius
      && position.y + halfBlock > footY + 0.06
      && position.y - halfBlock < headY - 0.08;
  };

  const placeBlockFromSelectedSlot = (playerPosition: Vector3): boolean => {
    if (selectedHotbarSlot === null) {
      return false;
    }

    const slot = inventorySlots[selectedHotbarSlot];
    if (!slot?.type || slot.count <= 0 || !PLACEABLE_ITEMS.has(slot.type) || !selectedPlacementPosition) {
      return false;
    }

    const type = slot.type as ChapterSixPlaceableItemType;
    const position = selectedPlacementPosition.clone();
    if (hasActiveBlockAt(position) || isPlacementInsidePlayer(position, playerPosition)) {
      return false;
    }

    const block = new Mesh(blockGeometry, getBlockMaterial(type));
    block.name = `Chapter 6 placed ${ITEM_LABELS[type]}`;
    block.position.copy(position);
    block.userData.placementToolIgnore = true;
    root.add(block);
    selectablePlacedMeshes.push(block);
    registerBlock(block, null, type, position, false);
    slot.count -= 1;
    normalizeStack(slot);
    return true;
  };

  const consumeCraftRecipe = (): void => {
    craftSlots.forEach((slot) => {
      if (slot.type && slot.count > 0) {
        slot.count -= 1;
        normalizeStack(slot);
      }
    });
  };

  const takeCraftResult = (_button: 0 | 2): void => {
    const recipe = getCraftRecipe();
    normalizeStack(cursorStack);
    if (!recipe) {
      return;
    }

    const amount = recipe.count;
    if (!cursorStack.type) {
      cursorStack.type = recipe.type;
      cursorStack.count = amount;
      if (amount === recipe.count) {
        consumeCraftRecipe();
      }
      return;
    }

    if (cursorStack.type !== recipe.type || cursorStack.count + amount > CHAPTER_SIX_MAX_STACK) {
      return;
    }

    cursorStack.count += amount;
    if (amount === recipe.count) {
      consumeCraftRecipe();
    }
  };

  const clearCursorIntoInventory = (): void => {
    if (!cursorStack.type || cursorStack.count <= 0) {
      normalizeStack(cursorStack);
      return;
    }

    const remaining = addItemToInventory(cursorStack.type, cursorStack.count);
    cursorStack.count = remaining;
    normalizeStack(cursorStack);
  };

  const addPossumToInventoryAndSelect = (): boolean => {
    if (inventorySlots.some((slot) => slot.type === 'possum' && slot.count > 0)) {
      const existingIndex = inventorySlots.findIndex((slot) => slot.type === 'possum' && slot.count > 0);
      if (existingIndex >= 0 && existingIndex < CHAPTER_SIX_HOTBAR_SLOT_COUNT) {
        selectedHotbarSlot = existingIndex;
      }
      return true;
    }

    let slotIndex = inventorySlots.findIndex((slot, index) => index < CHAPTER_SIX_HOTBAR_SLOT_COUNT && (!slot.type || slot.count <= 0));
    if (slotIndex < 0) {
      slotIndex = inventorySlots.findIndex((slot) => !slot.type || slot.count <= 0);
    }

    if (slotIndex < 0) {
      return false;
    }

    inventorySlots[slotIndex].type = 'possum';
    inventorySlots[slotIndex].count = 1;
    if (slotIndex < CHAPTER_SIX_HOTBAR_SLOT_COUNT) {
      selectedHotbarSlot = slotIndex;
    }
    return true;
  };

  const updatePossumLookTarget = (camera: Camera, active: boolean, playerPosition: Vector3): void => {
    possumLookedAtState = null;
    if (!active) {
      return;
    }

    const visiblePossums = possums.filter((state) => !state.carried && state.petTimer <= 0 && playerPosition.distanceTo(state.model.root.position) <= POSSUM_REACH);
    if (visiblePossums.length === 0) {
      return;
    }

    blockRaycaster.near = 0.08;
    blockRaycaster.far = POSSUM_REACH;
    blockRaycaster.setFromCamera(screenCenter, camera);
    const hit = blockRaycaster
      .intersectObjects(visiblePossums.map((state) => state.model.root), true)
      .at(0);
    if (!hit) {
      return;
    }

    possumLookedAtState = visiblePossums.find((state) => {
      let object = hit.object;
      while (object) {
        if (object === state.model.root) {
          return true;
        }
        object = object.parent!;
      }
      return false;
    }) ?? null;
  };

  const updatePossumAnimation = (deltaSeconds: number, camera: Camera, active: boolean, playerPosition: Vector3): void => {
    updatePossumLookTarget(camera, active, playerPosition);

    possums.forEach((state) => {
      const possum = state.model;
      if (state.carried) {
        possum.root.visible = false;
        return;
      }

      possum.root.visible = true;
      state.age += deltaSeconds;

      if (active && state.petTimer <= 0) {
        state.squeakTimer -= deltaSeconds;
        if (state.squeakTimer <= 0) {
          possumSqueakQueued = true;
          state.squeakTimer = 5.5 + Math.random() * 8.5;
        }
      }

      if (state.petTimer <= 0) {
        const distance = state.routeStart.distanceTo(state.routeEnd);
        const moveDuration = MathUtils.clamp(distance / (BLOCK_SIZE * 1.35), 2.4, 6.2);
        state.moveProgress += deltaSeconds / moveDuration;
        if (state.moveProgress >= 1) {
          state.routeEnd.y = getGroundYAtGrid(state.targetGridX, state.targetGridZ);
          possum.root.position.copy(state.routeEnd);
          if (Math.random() < 0.3) {
            state.squeakTimer = Math.min(state.squeakTimer, 0.35);
          }
          choosePossumTarget(state);
        }

        const routeT = MathUtils.clamp(state.moveProgress, 0, 1);
        const smoothT = MathUtils.smoothstep(routeT, 0, 1);
        const climbing = state.routeEnd.y > state.routeStart.y + BLOCK_SIZE * 0.18;
        const descending = state.routeStart.y > state.routeEnd.y + BLOCK_SIZE * 0.18;
        const walkCycle = Math.sin(state.age * 10.5);
        const tailWag = Math.sin(state.age * 4.8);
        const scratchActive = state.scratchTimer <= 0;
        let scratchProgress = 0;

        state.scratchTimer -= deltaSeconds;
        if (scratchActive) {
          scratchProgress = Math.min(1, -state.scratchTimer / 1.2);
          if (state.scratchTimer <= -1.2) {
            state.scratchTimer = 4.5 + Math.random() * 6.5;
          }
        }

        const moveT = climbing
          ? MathUtils.smoothstep(routeT, 0.32, 1)
          : smoothT;
        possum.root.position.lerpVectors(state.routeStart, state.routeEnd, moveT);
        if (climbing) {
          const lift = MathUtils.smoothstep(routeT, 0.22, 0.62) * (1 - MathUtils.smoothstep(routeT, 0.74, 1));
          possum.root.position.y = MathUtils.lerp(state.routeStart.y, state.routeEnd.y, MathUtils.smoothstep(routeT, 0.58, 1))
            + lift * BLOCK_SIZE * 0.12;
        } else if (descending) {
          possum.root.position.y += Math.sin(routeT * Math.PI) * BLOCK_SIZE * 0.08;
        } else {
          possum.root.position.y += Math.sin(routeT * Math.PI * 2) * BLOCK_SIZE * 0.018;
        }

        const direction = state.routeEnd.clone().sub(state.routeStart);
        facePossumToward(state, direction);

        const rearLift = climbing ? MathUtils.smoothstep(routeT, 0.04, 0.28) * (1 - MathUtils.smoothstep(routeT, 0.62, 0.88)) : 0;
        const reach = climbing ? MathUtils.smoothstep(routeT, 0.12, 0.44) * (1 - MathUtils.smoothstep(routeT, 0.78, 1)) : 0;
        possum.body.rotation.set(
          climbing ? -0.46 * rearLift + Math.sin(routeT * Math.PI * 8) * 0.035 : 0,
          climbing ? Math.sin(routeT * Math.PI * 6) * 0.08 : Math.sin(state.age * 2.1) * 0.025,
          climbing ? Math.sin(routeT * Math.PI * 8) * 0.08 : 0,
        );
        possum.head.rotation.set(
          scratchActive ? -0.12 + Math.sin(scratchProgress * Math.PI * 8) * 0.12 : Math.sin(state.age * 4.2) * 0.04,
          scratchActive ? -0.18 : 0,
          scratchActive ? -0.08 : 0,
        );
        possum.tailSegments.forEach((segment, index) => {
          const bendLag = index * 0.62;
          segment.rotation.set(
            -0.12 - index * 0.04 + tailWag * (0.13 + index * 0.07) + (climbing ? Math.sin(routeT * Math.PI * 8 - bendLag) * 0.2 : 0),
            Math.sin(state.age * 3.8 - bendLag) * (0.05 + index * 0.035),
            Math.sin(state.age * 4.4 - bendLag) * (0.04 + index * 0.025),
          );
        });
        possum.tailCreases.forEach((crease, index) => {
          crease.rotation.set(possum.tailSegments[Math.min(index, possum.tailSegments.length - 1)].rotation.x, 0, Math.sin(state.age * 5.2 + index) * 0.08);
        });
        possum.leftFrontLeg.rotation.x = climbing ? -1.08 * reach : walkCycle * 0.34;
        possum.rightFrontLeg.rotation.x = climbing ? -0.94 * reach : -walkCycle * 0.34;
        possum.leftBackLeg.rotation.x = climbing ? 0.78 * rearLift + Math.sin(routeT * Math.PI * 8) * 0.12 : -walkCycle * 0.3;
        possum.rightBackLeg.rotation.x = climbing ? 0.72 * rearLift - Math.sin(routeT * Math.PI * 8) * 0.12 : walkCycle * 0.3;
        if (scratchActive) {
          possum.leftBackLeg.rotation.x = -0.9 + Math.sin(scratchProgress * Math.PI * 12) * 0.38;
        }
        possum.belly.visible = false;
        possum.root.scale.setScalar(1);
        return;
      }

      state.petTimer = Math.max(0, state.petTimer - deltaSeconds);
      const progress = 1 - state.petTimer / POSSUM_PET_SECONDS;
      const flip = MathUtils.smoothstep(progress, 0.2, 0.44) * (1 - MathUtils.smoothstep(progress, 0.78, 0.96));
      const wiggle = Math.sin(progress * Math.PI * 10) * flip;

      possum.root.position.y = state.petGroundY
        + Math.sin(Math.min(progress, 1) * Math.PI) * BLOCK_SIZE * 0.18
        + flip * BLOCK_SIZE * 0.44;
      possum.root.rotation.z = flip * Math.PI;
      possum.root.rotation.x = flip * 0.14;
      possum.root.scale.setScalar(1 + Math.sin(progress * Math.PI) * 0.04);
      possum.body.rotation.y = wiggle * 0.08;
      possum.head.rotation.x = -flip * 0.18;
      possum.tailSegments.forEach((segment, index) => {
        segment.rotation.x = -0.12 - index * 0.04 + flip * (0.6 + index * 0.14) + wiggle * 0.08;
      });
      possum.leftFrontLeg.rotation.x = -flip * 0.55 + wiggle * 0.15;
      possum.rightFrontLeg.rotation.x = -flip * 0.55 - wiggle * 0.15;
      possum.leftBackLeg.rotation.x = flip * 0.45 - wiggle * 0.16;
      possum.rightBackLeg.rotation.x = flip * 0.45 + wiggle * 0.16;
      possum.belly.visible = flip > 0.25;

      if (state.petTimer <= 0) {
        possum.root.rotation.set(0, possum.root.rotation.y, 0);
        possum.body.rotation.set(0, 0, 0);
        possum.head.rotation.set(0, 0, 0);
        possum.tailSegments.forEach((segment, index) => segment.rotation.set(-0.12 - index * 0.04, 0, 0));
        possum.leftFrontLeg.rotation.set(0, 0, 0);
        possum.rightFrontLeg.rotation.set(0, 0, 0);
        possum.leftBackLeg.rotation.set(0, 0, 0);
        possum.rightBackLeg.rotation.set(0, 0, 0);
        possum.belly.visible = false;
      }
    });
  };

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    getSupportedFloorY(position) {
      const gridX = getGridIndex(position.x, WORLD_CENTER_X);
      const gridZ = getGridIndex(position.z, WORLD_CENTER_Z);
      const halfBlock = BLOCK_SIZE / 2;
      let supportY: number | null = null;

      for (const record of blockRecords) {
        if (
          !record.active
          || Math.abs(position.x - record.position.x) >= halfBlock + GAME_CONFIG.player.radius * 0.72
          || Math.abs(position.z - record.position.z) >= halfBlock + GAME_CONFIG.player.radius * 0.72
        ) {
          continue;
        }

        const blockTop = record.position.y + halfBlock;
        if (blockTop <= position.y - GAME_CONFIG.player.height + 0.36) {
          supportY = Math.max(supportY ?? GAME_CONFIG.player.height, GAME_CONFIG.player.height + blockTop);
        }
      }

      if (supportY !== null) {
        return supportY;
      }

      if (gridX < 0 || gridX >= WORLD_CELLS || gridZ < 0 || gridZ >= WORLD_CELLS) {
        return GAME_CONFIG.player.height;
      }

      for (let level = heights[gridX][gridZ] ?? 0; level >= -2; level -= 1) {
        if (activeTerrainBlockKeys.has(getTerrainKey(gridX, gridZ, level))) {
          return GAME_CONFIG.player.height + level * BLOCK_SIZE;
        }
      }

      return GAME_CONFIG.player.height;
    },
    canPlayerOccupy(currentPosition, nextX, nextZ) {
      return canPlayerOccupy(currentPosition, nextX, nextZ);
    },
    update(deltaSeconds, camera, playerPosition, active, miningActive) {
      this.updateBlockHighlight(camera, active);
      updateMining(deltaSeconds, active && miningActive);
      updatePickups(deltaSeconds, playerPosition);
      updatePossumAnimation(deltaSeconds, camera, active, playerPosition);
    },
    updateBlockHighlight(camera, active) {
      if (!active || !root.visible) {
        blockHighlight.visible = false;
        selectedBlock = null;
        selectedPlacementPosition = null;
        return;
      }

      blockRaycaster.near = 0.08;
      blockRaycaster.far = BLOCK_REACH;
      blockRaycaster.setFromCamera(screenCenter, camera);
      const hit = blockRaycaster
        .intersectObjects([...selectableMeshes, ...selectablePlacedMeshes], false)
        .find((intersection) => {
          if (intersection.object instanceof InstancedMesh) {
            if (typeof intersection.instanceId !== 'number') {
              return false;
            }

            return blockRecordsByInstance.get(getInstanceKey(intersection.object, intersection.instanceId))?.active;
          }

          return blockRecordsByObject.get(intersection.object.uuid)?.active;
        });
      if (!hit) {
        blockHighlight.visible = false;
        selectedBlock = null;
        selectedPlacementPosition = null;
        return;
      }

      if (hit.object instanceof InstancedMesh && typeof hit.instanceId === 'number') {
        selectedBlock = blockRecordsByInstance.get(getInstanceKey(hit.object, hit.instanceId)) ?? null;
        hit.object.getMatrixAt(hit.instanceId, highlightedBlockMatrix);
      } else {
        selectedBlock = blockRecordsByObject.get(hit.object.uuid) ?? null;
        highlightedBlockMatrix.copy(hit.object.matrixWorld);
      }

      const faceNormal = hit.face?.normal.clone() ?? new Vector3(0, 1, 0);
      selectedPlacementPosition = selectedBlock
        ? selectedBlock.position.clone().add(faceNormal.multiplyScalar(BLOCK_SIZE))
        : null;
      highlightedBlockMatrix.decompose(blockHighlight.position, blockHighlight.quaternion, blockHighlight.scale);
      blockHighlight.visible = true;
    },
    getInventoryStacks() {
      return INVENTORY_ORDER
        .map((type) => ({
          type,
          label: ITEM_LABELS[type],
          count: inventorySlots.reduce((total, slot) => total + (slot.type === type ? slot.count : 0), 0),
        }))
        .filter((stack) => stack.count > 0);
    },
    getHotbarStacks() {
      return inventorySlots
        .slice(0, CHAPTER_SIX_HOTBAR_SLOT_COUNT)
        .map((slot, index) => getSlotView(slot, index === selectedHotbarSlot));
    },
    getSelectedHotbarStack() {
      if (selectedHotbarSlot === null) {
        return getSlotView({ type: null, count: 0 }, false);
      }

      return getSlotView(inventorySlots[selectedHotbarSlot] ?? { type: null, count: 0 }, true);
    },
    getInventoryView() {
      return {
        hotbar: inventorySlots
          .slice(0, CHAPTER_SIX_HOTBAR_SLOT_COUNT)
          .map((slot, index) => getSlotView(slot, index === selectedHotbarSlot)),
        inventory: inventorySlots
          .slice(CHAPTER_SIX_HOTBAR_SLOT_COUNT)
          .map((slot) => getSlotView(slot)),
        craft: craftSlots.map((slot) => getSlotView(slot)),
        result: getSlotView(getCraftRecipe() ?? { type: null, count: 0 }),
        cursor: getSlotView(cursorStack),
      };
    },
    setInventoryOpen(open) {
      inventoryOpen = open;
      if (!inventoryOpen) {
        clearCursorIntoInventory();
      }
    },
    isInventoryOpen() {
      return inventoryOpen;
    },
    petLookedAtPossum() {
      const target = possumLookedAtState;
      if (!target || target.carried || target.petTimer > 0) {
        return false;
      }

      target.petGroundY = target.model.root.position.y;
      target.petTimer = POSSUM_PET_SECONDS;
      possumSqueakQueued = true;
      return true;
    },
    pickUpLookedAtPossum() {
      const target = possumLookedAtState;
      if (!target || target.carried || target.petTimer > 0 || !addPossumToInventoryAndSelect()) {
        return false;
      }

      target.carried = true;
      possumLookedAtState = null;
      target.petTimer = 0;
      possumSqueakQueued = true;
      target.model.root.visible = false;
      return true;
    },
    isPettingPossum() {
      return possums.some((state) => state.petTimer > 0);
    },
    isHoldingPossum() {
      if (selectedHotbarSlot === null) {
        return false;
      }

      const selectedSlot = inventorySlots[selectedHotbarSlot];
      return selectedSlot?.type === 'possum' && selectedSlot.count > 0;
    },
    consumePossumSqueak() {
      const queued = possumSqueakQueued;
      possumSqueakQueued = false;
      return queued;
    },
    selectHotbarSlot(slot) {
      const nextSlot = MathUtils.clamp(Math.floor(slot) - 1, 0, CHAPTER_SIX_HOTBAR_SLOT_COUNT - 1);
      selectedHotbarSlot = selectedHotbarSlot === nextSlot ? null : nextSlot;
    },
    placeSelectedBlock(playerPosition) {
      return placeBlockFromSelectedSlot(playerPosition);
    },
    handleInventoryAction(action) {
      if (action.target === 'result') {
        takeCraftResult(action.button);
        return;
      }

      const slot = getInventoryActionSlot(action);
      if (slot) {
        moveCursorWithSlot(slot, action.button);
      }
    },
    reset() {
      blockRecords.forEach((record) => {
        record.active = true;
        if (record.mesh instanceof InstancedMesh && record.instanceId !== null) {
          record.mesh.setMatrixAt(record.instanceId, record.originalMatrix);
          record.mesh.instanceMatrix.needsUpdate = true;
        } else {
          root.remove(record.mesh);
        }
      });
      for (let index = blockRecords.length - 1; index >= 0; index -= 1) {
        if (!(blockRecords[index].mesh instanceof InstancedMesh)) {
          blockRecords.splice(index, 1);
        }
      }
      selectablePlacedMeshes.splice(0);
      blockRecordsByObject.clear();
      activeTerrainBlockKeys.clear();
      originalTerrainBlockKeys.forEach((key) => activeTerrainBlockKeys.add(key));
      pickups.splice(0).forEach((pickup) => root.remove(pickup.root));
      inventorySlots.forEach((slot) => {
        slot.type = null;
        slot.count = 0;
      });
      craftSlots.forEach((slot) => {
        slot.type = null;
        slot.count = 0;
      });
      cursorStack.type = null;
      cursorStack.count = 0;
      selectedHotbarSlot = 0;
      inventoryOpen = false;
      possumLookedAtState = null;
      possumSqueakQueued = false;
      possums.forEach((state, index) => {
        const spawnPoint = getRandomPossumGrid();
        const position = createGroundPoint(spawnPoint.gridX, spawnPoint.gridZ);
        state.spawnGridX = spawnPoint.gridX;
        state.spawnGridZ = spawnPoint.gridZ;
        state.targetGridX = spawnPoint.gridX;
        state.targetGridZ = spawnPoint.gridZ;
        state.routeStart.copy(position);
        state.routeEnd.copy(position);
        state.moveProgress = 0;
        state.age = Math.random() * 8;
        state.scratchTimer = 2.5 + Math.random() * 6;
        state.petTimer = 0;
        state.petGroundY = position.y;
        state.squeakTimer = 4 + index + Math.random() * 7;
        state.carried = false;
        state.model.root.position.copy(position);
        facePossumToward(state, new Vector3(WORLD_CENTER_X - position.x, 0, WORLD_CENTER_Z - position.z));
        state.model.root.scale.setScalar(1);
        state.model.root.visible = true;
        state.model.body.rotation.set(0, 0, 0);
        state.model.head.rotation.set(0, 0, 0);
        state.model.tailSegments.forEach((segment, segmentIndex) => segment.rotation.set(-0.12 - segmentIndex * 0.04, 0, 0));
        state.model.leftFrontLeg.rotation.set(0, 0, 0);
        state.model.rightFrontLeg.rotation.set(0, 0, 0);
        state.model.leftBackLeg.rotation.set(0, 0, 0);
        state.model.rightBackLeg.rotation.set(0, 0, 0);
        state.model.belly.visible = false;
        choosePossumTarget(state);
      });
      selectedBlock = null;
      selectedPlacementPosition = null;
      miningBlock = null;
      miningProgress = 0;
      blockHighlight.visible = false;
      updateCrackOverlay(null, 0);
      root.visible = false;
    },
  };
}
