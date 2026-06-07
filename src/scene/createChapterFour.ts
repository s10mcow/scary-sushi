import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  type Material,
  type Object3D,
  Vector3,
} from 'three';

import { GAME_CONFIG } from '../config/gameConfig';
import type { CollisionBox } from '../types/world';

export interface ChapterFourDoor {
  id: string;
  label: string;
  root: Group;
  collider: CollisionBox;
  interactPosition: Vector3;
  mode: 'interact' | 'push';
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
  closedRotationY: number;
  openRotationY: number;
  spanAxis: 'x' | 'z';
  spanLength: number;
  contactDepth: number;
  pushRadius?: number;
  closeRadius?: number;
}

export interface ChapterFourLocker {
  id: string;
  label: string;
  root: Group;
  collider: CollisionBox;
  interactPosition: Vector3;
  insidePosition: Vector3;
  exitPosition: Vector3;
  lookTarget: Vector3;
}

export interface ChapterFourPlayerState {
  position: Vector3;
  crouching: boolean;
  boxActive: boolean;
  lockerActive: boolean;
  moving?: boolean;
  sprinting?: boolean;
  noiseLevel?: number;
}

export interface ChapterFourData {
  root: Group;
  colliders: CollisionBox[];
  spawn: Vector3;
  lookTarget: Vector3;
  doors: ChapterFourDoor[];
  lockers: ChapterFourLocker[];
  getSupportedFloorY(position: Vector3): number | null;
  isMistHandsCatching(position: Vector3, playerCrouching: boolean): boolean;
  isBlueCatching(playerState: ChapterFourPlayerState): boolean;
  consumeBlueRoar(): boolean;
  consumeBlueStomp(): boolean;
  consumeGreenSense(): boolean;
  consumeGreenBoxGrab(): boolean;
  consumeGreenTouch(): boolean;
  consumeGreenSqueak(): boolean;
  setBlueVisible(visible: boolean): void;
  setGreenVisible(visible: boolean): void;
  beginBlueJumpscareView(parent: Object3D): void;
  beginGreenJumpscareView(parent: Object3D): void;
  updateBlueJumpscareView(progress: number): void;
  updateGreenJumpscareView(progress: number): void;
  endBlueJumpscareView(): void;
  endGreenJumpscareView(): void;
  update(deltaSeconds: number, playerState?: ChapterFourPlayerState): void;
  reset(): void;
}

interface ChapterFourJumpscareMaterialState {
  material: Material;
  depthTest: boolean;
  depthWrite: boolean;
}

interface ChapterFourJumpscareMeshState {
  mesh: Mesh;
  renderOrder: number;
  materials: ChapterFourJumpscareMaterialState[];
}

const CENTER_X = 420;
const CENTER_Z = 0;
const WALL_HEIGHT = 4.1;
const WALL_THICKNESS = 0.28;
const CEILING_Y = WALL_HEIGHT + 0.02;
const HALL_WIDTH = 4.2;

function addCollider(colliders: CollisionBox[], x: number, z: number, width: number, depth: number): void {
  colliders.push({
    centerX: x,
    centerZ: z,
    halfWidth: width / 2,
    halfDepth: depth / 2,
  });
}

function isBlockedByCollider(x: number, z: number, colliders: readonly CollisionBox[], radius: number): boolean {
  return colliders.some((collider) => {
    if (collider.enabled === false) {
      return false;
    }

    return Math.abs(x - collider.centerX) < collider.halfWidth + radius
      && Math.abs(z - collider.centerZ) < collider.halfDepth + radius;
  });
}

function addBox(
  root: Group,
  material: MeshStandardMaterial,
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
): Mesh {
  const mesh = new Mesh(new BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  root.add(mesh);
  return mesh;
}

function addWall(
  root: Group,
  colliders: CollisionBox[],
  material: MeshStandardMaterial,
  x: number,
  z: number,
  width: number,
  depth: number,
): Mesh {
  const wall = addBox(root, material, width, WALL_HEIGHT, depth, x, WALL_HEIGHT / 2, z);
  addCollider(colliders, x, z, width, depth);
  return wall;
}

function addFloorAndCeiling(
  root: Group,
  floorMaterial: MeshStandardMaterial,
  ceilingMaterial: MeshStandardMaterial,
  x: number,
  z: number,
  width: number,
  depth: number,
): void {
  addBox(root, floorMaterial, width, 0.08, depth, x, -0.04, z);
  addBox(root, ceilingMaterial, width, 0.08, depth, x, CEILING_Y, z);
}

function addFloorAndCeilingAt(
  root: Group,
  floorMaterial: MeshStandardMaterial,
  ceilingMaterial: MeshStandardMaterial,
  x: number,
  z: number,
  width: number,
  depth: number,
  floorY: number,
): void {
  addBox(root, floorMaterial, width, 0.08, depth, x, floorY - 0.04, z);
  addBox(root, ceilingMaterial, width, 0.08, depth, x, floorY + CEILING_Y, z);
}

function addTrim(root: Group, material: MeshStandardMaterial, x: number, z: number, width: number, depth: number): void {
  addBox(root, material, width, 0.16, depth, x, 0.16, z);
  addBox(root, material, width, 0.16, depth, x, WALL_HEIGHT - 0.16, z);
}

function addWallAt(
  root: Group,
  colliders: CollisionBox[],
  material: MeshStandardMaterial,
  x: number,
  z: number,
  width: number,
  depth: number,
  floorY: number,
): Mesh {
  const wall = addBox(root, material, width, WALL_HEIGHT, depth, x, floorY + WALL_HEIGHT / 2, z);
  addCollider(colliders, x, z, width, depth);
  return wall;
}

function addHorizontalWallWithOpenings(
  root: Group,
  colliders: CollisionBox[],
  material: MeshStandardMaterial,
  z: number,
  minX: number,
  maxX: number,
  openings: Array<{ centerX: number; width: number }>,
): void {
  let cursorX = minX;
  const sortedOpenings = [...openings]
    .map((opening) => ({
      minX: Math.max(minX, opening.centerX - opening.width / 2),
      maxX: Math.min(maxX, opening.centerX + opening.width / 2),
    }))
    .filter((opening) => opening.maxX > opening.minX)
    .sort((a, b) => a.minX - b.minX);

  sortedOpenings.forEach((opening) => {
    const wallWidth = opening.minX - cursorX;
    if (wallWidth > 0.05) {
      addWall(root, colliders, material, cursorX + wallWidth / 2, z, wallWidth, WALL_THICKNESS);
    }
    cursorX = Math.max(cursorX, opening.maxX);
  });

  const remainingWidth = maxX - cursorX;
  if (remainingWidth > 0.05) {
    addWall(root, colliders, material, cursorX + remainingWidth / 2, z, remainingWidth, WALL_THICKNESS);
  }
}

function addHorizontalWallWithOpening(
  root: Group,
  colliders: CollisionBox[],
  material: MeshStandardMaterial,
  z: number,
  minX: number,
  maxX: number,
  openingCenterX: number,
  openingWidth: number,
): void {
  addHorizontalWallWithOpenings(root, colliders, material, z, minX, maxX, [{ centerX: openingCenterX, width: openingWidth }]);
}

function addVerticalWallWithOpenings(
  root: Group,
  colliders: CollisionBox[],
  material: MeshStandardMaterial,
  x: number,
  minZ: number,
  maxZ: number,
  openings: Array<{ centerZ: number; depth: number }>,
): void {
  let cursorZ = minZ;
  const sortedOpenings = [...openings]
    .map((opening) => ({
      minZ: Math.max(minZ, opening.centerZ - opening.depth / 2),
      maxZ: Math.min(maxZ, opening.centerZ + opening.depth / 2),
    }))
    .filter((opening) => opening.maxZ > opening.minZ)
    .sort((a, b) => a.minZ - b.minZ);

  sortedOpenings.forEach((opening) => {
    const wallDepth = opening.minZ - cursorZ;
    if (wallDepth > 0.05) {
      addWall(root, colliders, material, x, cursorZ + wallDepth / 2, WALL_THICKNESS, wallDepth);
    }
    cursorZ = Math.max(cursorZ, opening.maxZ);
  });

  const remainingDepth = maxZ - cursorZ;
  if (remainingDepth > 0.05) {
    addWall(root, colliders, material, x, cursorZ + remainingDepth / 2, WALL_THICKNESS, remainingDepth);
  }
}

function addVerticalWallWithOpening(
  root: Group,
  colliders: CollisionBox[],
  material: MeshStandardMaterial,
  x: number,
  minZ: number,
  maxZ: number,
  openingCenterZ: number,
  openingDepth: number,
): void {
  addVerticalWallWithOpenings(root, colliders, material, x, minZ, maxZ, [{ centerZ: openingCenterZ, depth: openingDepth }]);
}

function addPushDoor(
  id: string,
  label: string,
  root: Group,
  colliders: CollisionBox[],
  doorMaterial: MeshStandardMaterial,
  trimMaterial: MeshStandardMaterial,
  handleMaterial: MeshStandardMaterial,
  x: number,
  z: number,
  axis: 'x' | 'z',
  doorWidth: number,
  swingDirection: number,
): ChapterFourDoor {
  const doorRoot = new Group();
  doorRoot.position.set(axis === 'x' ? x - doorWidth / 2 : x, 0, axis === 'z' ? z - doorWidth / 2 : z);
  root.add(doorRoot);

  const doorHeight = 2.78;
  const doorThickness = 0.16;
  if (axis === 'z') {
    addBox(doorRoot, doorMaterial, doorThickness, doorHeight, doorWidth, 0, doorHeight / 2, doorWidth / 2);
    addBox(doorRoot, handleMaterial, 0.08, 0.12, 0.08, doorThickness / 2 + 0.045, 1.25, doorWidth * 0.72);
    addBox(doorRoot, handleMaterial, 0.08, 0.12, 0.08, -doorThickness / 2 - 0.045, 1.25, doorWidth * 0.72);
    addBox(root, trimMaterial, 0.18, 3.08, 0.26, x, 1.54, z - doorWidth / 2 - 0.06);
    addBox(root, trimMaterial, 0.18, 3.08, 0.26, x, 1.54, z + doorWidth / 2 + 0.06);
    addBox(root, trimMaterial, 0.18, 0.2, doorWidth + 0.38, x, 3.04, z);
  } else {
    addBox(doorRoot, doorMaterial, doorWidth, doorHeight, doorThickness, doorWidth / 2, doorHeight / 2, 0);
    addBox(doorRoot, handleMaterial, 0.08, 0.12, 0.08, doorWidth * 0.72, 1.25, doorThickness / 2 + 0.045);
    addBox(doorRoot, handleMaterial, 0.08, 0.12, 0.08, doorWidth * 0.72, 1.25, -doorThickness / 2 - 0.045);
    addBox(root, trimMaterial, 0.26, 3.08, 0.18, x - doorWidth / 2 - 0.06, 1.54, z);
    addBox(root, trimMaterial, 0.26, 3.08, 0.18, x + doorWidth / 2 + 0.06, 1.54, z);
    addBox(root, trimMaterial, doorWidth + 0.38, 0.2, 0.18, x, 3.04, z);
  }

  const collider: CollisionBox = {
    centerX: x,
    centerZ: z,
    halfWidth: axis === 'x' ? doorWidth / 2 : doorThickness / 2,
    halfDepth: axis === 'z' ? doorWidth / 2 : doorThickness / 2,
    enabled: true,
  };
  colliders.push(collider);

  return {
    id,
    label,
    root: doorRoot,
    collider,
    interactPosition: new Vector3(x, GAME_CONFIG.player.height, z),
    mode: 'push',
    open: false,
    openAmount: 0,
    targetOpenAmount: 0,
    closedRotationY: 0,
    openRotationY: swingDirection * Math.PI / 2,
    spanAxis: axis,
    spanLength: doorWidth,
    contactDepth: doorThickness,
    pushRadius: 0.62,
    closeRadius: 2.55,
  };
}

function addInteractDoor(
  id: string,
  label: string,
  root: Group,
  colliders: CollisionBox[],
  doorMaterial: MeshStandardMaterial,
  trimMaterial: MeshStandardMaterial,
  handleMaterial: MeshStandardMaterial,
  x: number,
  z: number,
  axis: 'x' | 'z',
  doorWidth: number,
  swingDirection: number,
): ChapterFourDoor {
  const doorRoot = new Group();
  doorRoot.position.set(axis === 'x' ? x - doorWidth / 2 : x, 0, axis === 'z' ? z - doorWidth / 2 : z);
  root.add(doorRoot);

  const doorHeight = 1.72;
  const doorThickness = 0.14;
  if (axis === 'z') {
    addBox(doorRoot, doorMaterial, doorThickness, doorHeight, doorWidth, 0, doorHeight / 2, doorWidth / 2);
    addBox(doorRoot, handleMaterial, 0.08, 0.12, 0.08, doorThickness / 2 + 0.045, 0.92, doorWidth * 0.7);
    addBox(root, trimMaterial, 0.18, 1.95, 0.12, x, 0.98, z - doorWidth / 2 - 0.04);
    addBox(root, trimMaterial, 0.18, 1.95, 0.12, x, 0.98, z + doorWidth / 2 + 0.04);
    addBox(root, trimMaterial, 0.18, 0.16, doorWidth + 0.28, x, 1.9, z);
  } else {
    addBox(doorRoot, doorMaterial, doorWidth, doorHeight, doorThickness, doorWidth / 2, doorHeight / 2, 0);
    addBox(doorRoot, handleMaterial, 0.08, 0.12, 0.08, doorWidth * 0.7, 0.92, doorThickness / 2 + 0.045);
    addBox(root, trimMaterial, 0.12, 1.95, 0.18, x - doorWidth / 2 - 0.04, 0.98, z);
    addBox(root, trimMaterial, 0.12, 1.95, 0.18, x + doorWidth / 2 + 0.04, 0.98, z);
    addBox(root, trimMaterial, doorWidth + 0.28, 0.16, 0.18, x, 1.9, z);
  }

  const collider: CollisionBox = {
    centerX: x,
    centerZ: z,
    halfWidth: axis === 'x' ? doorWidth / 2 : doorThickness / 2,
    halfDepth: axis === 'z' ? doorWidth / 2 : doorThickness / 2,
    enabled: true,
  };
  colliders.push(collider);

  return {
    id,
    label,
    root: doorRoot,
    collider,
    interactPosition: new Vector3(x, GAME_CONFIG.player.height, z),
    mode: 'interact',
    open: false,
    openAmount: 0,
    targetOpenAmount: 0,
    closedRotationY: 0,
    openRotationY: swingDirection * Math.PI / 2,
    spanAxis: axis,
    spanLength: doorWidth,
    contactDepth: doorThickness,
  };
}

function addCeilingLight(root: Group, material: MeshStandardMaterial, x: number, z: number): void {
  addBox(root, material, 1.7, 0.08, 0.42, x, CEILING_Y - 0.18, z);
}

export function createChapterFour(): ChapterFourData {
  const root = new Group();
  root.name = 'Chapter Four';
  root.visible = false;
  const colliders: CollisionBox[] = [];
  const doors: ChapterFourDoor[] = [];
  const lockers: ChapterFourLocker[] = [];

  const floorMaterial = new MeshStandardMaterial({
    color: 0x77746c,
    emissive: 0x151412,
    emissiveIntensity: 0.035,
    roughness: 0.98,
    metalness: 0.01,
  });
  const hallFloorMaterial = new MeshStandardMaterial({
    color: 0x817f78,
    emissive: 0x171613,
    emissiveIntensity: 0.03,
    roughness: 0.98,
    metalness: 0.01,
  });
  const wallMaterial = new MeshStandardMaterial({
    color: 0x586168,
    emissive: 0x11171c,
    emissiveIntensity: 0.04,
    roughness: 0.86,
    metalness: 0.02,
  });
  const lowerWallMaterial = new MeshStandardMaterial({
    color: 0x687178,
    emissive: 0x11171a,
    emissiveIntensity: 0.035,
    roughness: 0.9,
    metalness: 0.02,
  });
  const ceilingMaterial = new MeshStandardMaterial({
    color: 0xb7c1c6,
    emissive: 0x273037,
    emissiveIntensity: 0.05,
    roughness: 0.9,
    metalness: 0.02,
  });
  const trimMaterial = new MeshStandardMaterial({
    color: 0x3e4950,
    roughness: 0.72,
    metalness: 0.05,
  });
  const doorMaterial = new MeshStandardMaterial({
    color: 0x6b3f24,
    emissive: 0x180904,
    emissiveIntensity: 0.05,
    roughness: 0.74,
    metalness: 0.03,
  });
  const handleMaterial = new MeshStandardMaterial({
    color: 0xd6a84d,
    emissive: 0x352000,
    emissiveIntensity: 0.16,
    roughness: 0.32,
    metalness: 0.58,
  });
  const blueCrownMaterial = handleMaterial.clone();
  const metalFenceMaterial = new MeshStandardMaterial({
    color: 0x7c898f,
    emissive: 0x0b1114,
    emissiveIntensity: 0.05,
    roughness: 0.42,
    metalness: 0.72,
  });
  const lockerInteriorMaterial = new MeshStandardMaterial({
    color: 0x15191c,
    emissive: 0x020405,
    emissiveIntensity: 0.08,
    roughness: 0.84,
    metalness: 0.24,
  });
  const lockMaterial = new MeshStandardMaterial({
    color: 0xd0a63a,
    emissive: 0x2a1a00,
    emissiveIntensity: 0.16,
    roughness: 0.34,
    metalness: 0.62,
  });
  const fakeGrassMaterial = new MeshStandardMaterial({
    color: 0x437e38,
    emissive: 0x0b2108,
    emissiveIntensity: 0.08,
    roughness: 0.95,
    metalness: 0.01,
  });
  const fakeRiverMaterial = new MeshStandardMaterial({
    color: 0x2f8fbd,
    emissive: 0x0a3246,
    emissiveIntensity: 0.12,
    roughness: 0.4,
    metalness: 0.02,
  });
  const fakeRiverBankMaterial = new MeshStandardMaterial({
    color: 0x6c5736,
    emissive: 0x140d04,
    emissiveIntensity: 0.05,
    roughness: 0.92,
    metalness: 0.01,
  });
  const bridgeWoodMaterial = new MeshStandardMaterial({
    color: 0x6e451f,
    emissive: 0x180b03,
    emissiveIntensity: 0.06,
    roughness: 0.84,
    metalness: 0.02,
  });
  const fakeTreeBarkMaterial = new MeshStandardMaterial({
    color: 0x6b3e1c,
    emissive: 0x160804,
    emissiveIntensity: 0.05,
    roughness: 0.94,
    metalness: 0.01,
  });
  fakeTreeBarkMaterial.side = DoubleSide;
  const fakeTreeLeafMaterial = new MeshStandardMaterial({
    color: 0x2c7f36,
    emissive: 0x08230b,
    emissiveIntensity: 0.07,
    roughness: 0.9,
    metalness: 0.01,
  });
  const tinyShedWallMaterial = new MeshStandardMaterial({
    color: 0x765032,
    emissive: 0x170a03,
    emissiveIntensity: 0.06,
    roughness: 0.9,
    metalness: 0.01,
  });
  const tinyShedDoorMaterial = new MeshStandardMaterial({
    color: 0x8b5529,
    emissive: 0x1c0b03,
    emissiveIntensity: 0.08,
    roughness: 0.88,
    metalness: 0.01,
  });
  const tinyShedRoofMaterial = new MeshStandardMaterial({
    color: 0x3e2818,
    emissive: 0x0c0401,
    emissiveIntensity: 0.05,
    roughness: 0.86,
    metalness: 0.01,
  });
  const lightMaterial = new MeshStandardMaterial({
    color: 0xf2ead0,
    emissive: 0xffd98c,
    emissiveIntensity: 0.85,
    roughness: 0.62,
    metalness: 0.08,
  });
  const basementMistMaterial = new MeshStandardMaterial({
    color: 0xf3f0e8,
    emissive: 0xb8b3aa,
    emissiveIntensity: 0.42,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.54,
    depthWrite: false,
  });
  const purpleHandMaterial = new MeshStandardMaterial({
    color: 0x8e38d8,
    emissive: 0x2a0a4f,
    emissiveIntensity: 0.22,
    roughness: 0.76,
    metalness: 0.03,
  });
  const blueSkinMaterial = new MeshStandardMaterial({
    color: 0x1f62d7,
    emissive: 0x061940,
    emissiveIntensity: 0.08,
    roughness: 0.74,
    metalness: 0.01,
  });
  const blueEyeMaterial = new MeshStandardMaterial({
    color: 0xf3f6ff,
    emissive: 0x6f8cff,
    emissiveIntensity: 0.12,
    roughness: 0.38,
    metalness: 0.02,
  });
  const blueGoodEyeMaterial = blueEyeMaterial.clone();
  const blueButtonEyeMaterial = new MeshStandardMaterial({
    color: 0x111a24,
    emissive: 0x02060a,
    emissiveIntensity: 0.1,
    roughness: 0.44,
    metalness: 0.18,
  });
  const blueMouthMaterial = new MeshStandardMaterial({
    color: 0x161026,
    emissive: 0x04020a,
    emissiveIntensity: 0.14,
    roughness: 0.7,
    metalness: 0.01,
  });
  const blueDroolMaterial = new MeshStandardMaterial({
    color: 0xc7f0ff,
    emissive: 0x5eaad0,
    emissiveIntensity: 0.18,
    roughness: 0.24,
    metalness: 0.02,
    transparent: true,
    opacity: 0.84,
  });
  const greenSkinMaterial = new MeshStandardMaterial({
    color: 0x2fab36,
    emissive: 0x052a09,
    emissiveIntensity: 0.12,
    roughness: 0.82,
    metalness: 0.01,
  });
  const greenEyeMaterial = new MeshStandardMaterial({
    color: 0xf7fff0,
    emissive: 0xc7ffd0,
    emissiveIntensity: 0.14,
    roughness: 0.42,
    metalness: 0.02,
  });
  const greenPupilMaterial = new MeshStandardMaterial({
    color: 0x06120a,
    emissive: 0x000000,
    emissiveIntensity: 0.04,
    roughness: 0.5,
    metalness: 0.02,
  });
  const greenMouthMaterial = new MeshStandardMaterial({
    color: 0x050608,
    emissive: 0x010103,
    emissiveIntensity: 0.18,
    roughness: 0.62,
    metalness: 0.02,
  });
  const greenTongueMaterial = new MeshStandardMaterial({
    color: 0xc3212f,
    emissive: 0x4a050c,
    emissiveIntensity: 0.16,
    roughness: 0.7,
    metalness: 0.01,
  });
  const greenToothMaterial = new MeshStandardMaterial({
    color: 0xdff3cd,
    emissive: 0x6aa150,
    emissiveIntensity: 0.16,
    roughness: 0.44,
    metalness: 0.02,
  });

  const mainWidth = 12;
  const mainDepth = 8;
  const mainNorthZ = CENTER_Z - mainDepth / 2;
  const mainSouthZ = CENTER_Z + mainDepth / 2;
  const mainWestX = CENTER_X - mainWidth / 2;
  const mainEastX = CENTER_X + mainWidth / 2;
  const frontDoorWidth = 3.2;
  const frontHallLength = 15;
  const frontHallCenterZ = mainNorthZ - frontHallLength / 2;
  const frontHallNorthZ = mainNorthZ - frontHallLength;
  const frontHallWestX = CENTER_X - HALL_WIDTH / 2;
  const frontHallEastX = CENTER_X + HALL_WIDTH / 2;
  const junctionWidth = 13;
  const junctionDepth = 8;
  const junctionCenterZ = frontHallNorthZ - junctionDepth / 2;
  const junctionSouthZ = frontHallNorthZ;
  const junctionNorthZ = frontHallNorthZ - junctionDepth;
  const junctionWestX = CENTER_X - junctionWidth / 2;
  const junctionEastX = CENTER_X + junctionWidth / 2;
  const branchDoorWidth = 2.8;
  const leftHallWestX = junctionWestX - 24;
  const leftHallCenterX = (junctionWestX + leftHallWestX) / 2;
  const rightHallEastX = junctionEastX + 46;
  const rightHallCenterX = (junctionEastX + rightHallEastX) / 2;
  const rightHallNorthZ = junctionCenterZ - HALL_WIDTH / 2;
  const rightHallSouthZ = junctionCenterZ + HALL_WIDTH / 2;
  const sideRoomDoorWidth = 3.0;
  const leftEndRoomWidth = 15;
  const leftEndRoomDepth = 14;
  const leftEndRoomEastX = leftHallWestX;
  const leftEndRoomWestX = leftEndRoomEastX - leftEndRoomWidth;
  const leftEndRoomCenterX = (leftEndRoomEastX + leftEndRoomWestX) / 2;
  const leftEndRoomCenterZ = junctionCenterZ;
  const leftEndRoomNorthZ = leftEndRoomCenterZ - leftEndRoomDepth / 2;
  const leftEndRoomSouthZ = leftEndRoomCenterZ + leftEndRoomDepth / 2;
  const leftStairHallDoorZ = -21.18;
  const leftStairHallDoorWidth = 3.0;
  const leftStairHallLength = 18;
  const leftStairHallEastX = leftEndRoomWestX;
  const leftStairHallWestX = leftStairHallEastX - leftStairHallLength;
  const leftStairHallCenterX = (leftStairHallEastX + leftStairHallWestX) / 2;
  const leftStairHallCenterZ = leftStairHallDoorZ;
  const leftStairHallNorthZ = leftStairHallCenterZ - HALL_WIDTH / 2;
  const leftStairHallSouthZ = leftStairHallCenterZ + HALL_WIDTH / 2;
  const leftStairLandingWidth = 8.4;
  const leftStairLandingDepth = 8.2;
  const leftStairLandingEastX = leftStairHallWestX;
  const leftStairLandingWestX = leftStairLandingEastX - leftStairLandingWidth;
  const leftStairLandingCenterX = (leftStairLandingEastX + leftStairLandingWestX) / 2;
  const leftStairLandingCenterZ = leftStairHallCenterZ;
  const leftStairLandingNorthZ = leftStairLandingCenterZ - leftStairLandingDepth / 2;
  const leftStairLandingSouthZ = leftStairLandingCenterZ + leftStairLandingDepth / 2;
  const leftStairDownWidth = 3.4;
  const leftStairDownLength = 9.6;
  const leftStairDownEastX = leftStairLandingWestX;
  const leftStairDownWestX = leftStairDownEastX - leftStairDownLength;
  const leftStairDownCenterX = (leftStairDownEastX + leftStairDownWestX) / 2;
  const leftStairDownCenterZ = leftStairHallCenterZ;
  const leftStairDownNorthZ = leftStairDownCenterZ - leftStairDownWidth / 2;
  const leftStairDownSouthZ = leftStairDownCenterZ + leftStairDownWidth / 2;
  const leftStairLowerFloorOffset = -2.25;
  const leftStairStepCount = 6;
  const leftStairStepLength = leftStairDownLength / leftStairStepCount;
  const leftStairLowerRoomWidth = 9.5;
  const leftStairLowerRoomDepth = 8.6;
  const leftStairLowerRoomEastX = leftStairDownWestX;
  const leftStairLowerRoomWestX = leftStairLowerRoomEastX - leftStairLowerRoomWidth;
  const leftStairLowerRoomCenterX = (leftStairLowerRoomEastX + leftStairLowerRoomWestX) / 2;
  const leftStairLowerRoomCenterZ = leftStairHallCenterZ;
  const leftStairLowerRoomNorthZ = leftStairLowerRoomCenterZ - leftStairLowerRoomDepth / 2;
  const leftStairLowerRoomSouthZ = leftStairLowerRoomCenterZ + leftStairLowerRoomDepth / 2;
  const enableLeftStairDownstairs = false;
  const rightEndRoomWidth = 16;
  const rightEndRoomDepth = 14;
  const rightEndRoomWestX = rightHallEastX;
  const rightEndRoomEastX = rightEndRoomWestX + rightEndRoomWidth;
  const rightEndRoomCenterX = (rightEndRoomWestX + rightEndRoomEastX) / 2;
  const rightEndRoomCenterZ = junctionCenterZ;
  const rightEndRoomNorthZ = rightEndRoomCenterZ - rightEndRoomDepth / 2;
  const rightEndRoomSouthZ = rightEndRoomCenterZ + rightEndRoomDepth / 2;
  const rightEndRoomConnectorLength = 5;
  const rightEndRoomConnectorWestX = rightEndRoomEastX;
  const rightEndRoomConnectorEastX = rightEndRoomConnectorWestX + rightEndRoomConnectorLength;
  const rightEndRoomConnectorCenterX = (rightEndRoomConnectorWestX + rightEndRoomConnectorEastX) / 2;
  const rightEndRoomConnectorCenterZ = rightEndRoomCenterZ;
  const rightTurnHallLength = 20;
  const rightTurnHallCenterX = rightEndRoomConnectorEastX;
  const rightTurnHallSouthZ = rightEndRoomConnectorCenterZ;
  const rightTurnHallNorthZ = rightTurnHallSouthZ - rightTurnHallLength;
  const rightTurnHallCenterZ = (rightTurnHallNorthZ + rightTurnHallSouthZ) / 2;
  const rightFinalHallLength = 12;
  const rightFinalHallWestX = rightTurnHallCenterX;
  const rightFinalHallEastX = rightFinalHallWestX + rightFinalHallLength;
  const rightFinalHallCenterX = (rightFinalHallWestX + rightFinalHallEastX) / 2;
  const rightFinalHallCenterZ = rightTurnHallNorthZ;
  const rightFinalHallNorthZ = rightFinalHallCenterZ - HALL_WIDTH / 2;
  const rightFinalHallSouthZ = rightFinalHallCenterZ + HALL_WIDTH / 2;
  const rightSideRoomSize = 7.5;
  const rightNorthRoomCenterX = rightFinalHallWestX + 3.1;
  const rightNorthRoomCenterZ = rightFinalHallNorthZ - rightSideRoomSize / 2;
  const rightSouthRoomCenterX = rightFinalHallEastX - 3.1;
  const rightSouthRoomCenterZ = rightFinalHallSouthZ + rightSideRoomSize / 2;
  const rightNorthRoomWestX = rightNorthRoomCenterX - rightSideRoomSize / 2;
  const rightNorthRoomEastX = rightNorthRoomCenterX + rightSideRoomSize / 2;
  const rightNorthRoomNorthZ = rightNorthRoomCenterZ - rightSideRoomSize / 2;
  const rightSouthRoomWestX = rightSouthRoomCenterX - rightSideRoomSize / 2;
  const rightSouthRoomEastX = rightSouthRoomCenterX + rightSideRoomSize / 2;
  const rightSouthRoomSouthZ = rightSouthRoomCenterZ + rightSideRoomSize / 2;
  const natureDoorWidth = 3.0;
  const natureSize = 24;
  const natureCenterX = junctionEastX + 25;
  const natureSouthZ = rightHallNorthZ - WALL_THICKNESS / 2;
  const natureCenterZ = natureSouthZ - natureSize / 2;
  const natureNorthZ = natureCenterZ - natureSize / 2;
  const natureDepth = natureSize;
  const natureWestX = natureCenterX - natureSize / 2;
  const natureEastX = natureCenterX + natureSize / 2;
  const northBranchDoorX = 442.89;
  const northBranchDoorWidth = 3.0;
  const northBranchHallLength = 15;
  const northBranchHallCenterZ = natureNorthZ - northBranchHallLength / 2;
  const northBranchHallNorthZ = natureNorthZ - northBranchHallLength;
  const northBranchHallWestX = northBranchDoorX - HALL_WIDTH / 2;
  const northBranchHallEastX = northBranchDoorX + HALL_WIDTH / 2;
  const northBranchRoomSize = natureSize;
  const northBranchRoomCenterX = northBranchDoorX;
  const northBranchRoomSouthZ = northBranchHallNorthZ;
  const northBranchRoomCenterZ = northBranchRoomSouthZ - northBranchRoomSize / 2;
  const northBranchRoomNorthZ = northBranchRoomCenterZ - northBranchRoomSize / 2;
  const northBranchRoomWestX = northBranchRoomCenterX - northBranchRoomSize / 2;
  const northBranchRoomEastX = northBranchRoomCenterX + northBranchRoomSize / 2;
  const basementDoorZ = -83.68;
  const basementDoorWidth = 3.0;
  const basementHallLength = 24;
  const basementFloorOffset = -3.05;
  const basementHallEastX = northBranchRoomWestX;
  const basementHallWestX = basementHallEastX - basementHallLength;
  const basementHallCenterX = (basementHallEastX + basementHallWestX) / 2;
  const basementHallCenterZ = basementDoorZ;
  const basementHallNorthZ = basementDoorZ - HALL_WIDTH / 2;
  const basementHallSouthZ = basementDoorZ + HALL_WIDTH / 2;
  const basementLandingLength = 1.45;
  const basementBottomLandingLength = 2.25;
  const basementRampEastX = basementHallEastX - basementLandingLength;
  const basementRampWestX = basementHallWestX + basementBottomLandingLength;
  const basementRampLength = basementRampEastX - basementRampWestX;
  const basementRampCenterX = (basementRampEastX + basementRampWestX) / 2;
  const basementRoomSize = 5.5;
  const basementRoomEastX = basementHallWestX;
  const basementRoomCenterX = basementRoomEastX - basementRoomSize / 2;
  const basementRoomCenterZ = basementDoorZ;
  const basementRoomWestX = basementRoomCenterX - basementRoomSize / 2;
  const basementRoomNorthZ = basementRoomCenterZ - basementRoomSize / 2;
  const basementRoomSouthZ = basementRoomCenterZ + basementRoomSize / 2;
  const basementStairWidth = 3.2;
  const basementStairNorthZ = basementRoomCenterZ - basementStairWidth / 2;
  const basementStairSouthZ = basementRoomCenterZ + basementStairWidth / 2;
  const basementStepCount = 4;
  const basementStepLength = 0.9;
  const basementStepDrop = 0.26;
  const mistHallFloorOffset = basementFloorOffset - basementStepCount * basementStepDrop;
  const mistHallEastX = basementRoomWestX - basementStepCount * basementStepLength;
  const mistHallLength = 15;
  const mistHallWidth = 10;
  const mistHallWestX = mistHallEastX - mistHallLength;
  const mistHallCenterX = (mistHallEastX + mistHallWestX) / 2;
  const mistHallCenterZ = basementRoomCenterZ;
  const mistHallNorthZ = mistHallCenterZ - mistHallWidth / 2;
  const mistHallSouthZ = mistHallCenterZ + mistHallWidth / 2;
  const mistPlatformWidth = 3.0;
  const mistPlatformDepth = 2.6;
  const mistPlatformHeight = 0.38;
  const mistPlatformCenterX = mistHallWestX + mistPlatformWidth / 2 + 0.35;
  const mistPlatformCenterZ = mistHallSouthZ - mistPlatformDepth / 2 - 0.35;
  const mistPlatformFloorOffset = mistHallFloorOffset + mistPlatformHeight;
  const mistPlatformMinX = mistPlatformCenterX - mistPlatformWidth / 2;
  const mistPlatformMaxX = mistPlatformCenterX + mistPlatformWidth / 2;
  const mistPlatformMinZ = mistPlatformCenterZ - mistPlatformDepth / 2;
  const mistPlatformMaxZ = mistPlatformCenterZ + mistPlatformDepth / 2;
  let basementMistTime = 0;
  let mistHandsChasing = false;
  let mistHandPatrolTargetIndex = 1;
  let mistHandPatrolDirection = 1;
  const mistHandPatrolPosition = new Vector3(mistHallEastX - 1.0, 0, mistHallNorthZ + 1.0);
  const mistHandPatrolPath = [
    new Vector3(mistHallEastX - 1.0, 0, mistHallNorthZ + 1.0),
    new Vector3(mistHallWestX + 1.0, 0, mistHallNorthZ + 1.0),
    new Vector3(mistHallWestX + 1.0, 0, mistHallSouthZ - 1.0),
    new Vector3(mistHallEastX - 1.0, 0, mistHallSouthZ - 1.0),
    new Vector3(mistHallCenterX, 0, mistHallSouthZ - 0.8),
    new Vector3(mistHallCenterX, 0, mistHallNorthZ + 0.8),
  ];
  const basementMistHands: Array<{ root: Group; offsetX: number; offsetZ: number; phase: number }> = [];
  const blueHome = new Vector3(natureCenterX + 5.4, 0, natureCenterZ - 4.8);
  const bluePosition = blueHome.clone();
  const blueTarget = blueHome.clone();
  const blueDirection = new Vector3(0, 0, -1);
  const blueMoveProbe = new Vector3();
  const blueLastPosition = blueHome.clone();
  const blueNavNodes: Array<{ position: Vector3; links: number[] }> = [
    { position: blueHome.clone(), links: [1] },
    { position: new Vector3(natureCenterX - 3.8, 0, natureCenterZ + 2.8), links: [0, 2, 12] },
    { position: new Vector3(natureCenterX, 0, natureSouthZ - 1.15), links: [1, 3] },
    { position: new Vector3(natureCenterX, 0, junctionCenterZ), links: [2, 4] },
    { position: new Vector3(rightHallCenterX, 0, junctionCenterZ), links: [3, 5, 11] },
    { position: new Vector3(junctionEastX - 1.25, 0, junctionCenterZ), links: [4, 6] },
    { position: new Vector3(CENTER_X, 0, junctionCenterZ), links: [5, 7, 9] },
    { position: new Vector3(CENTER_X, 0, frontHallCenterZ), links: [6, 8] },
    { position: new Vector3(CENTER_X, 0, CENTER_Z - 0.6), links: [7] },
    { position: new Vector3(leftHallCenterX, 0, junctionCenterZ), links: [6, 10] },
    { position: new Vector3(leftHallWestX + 2.4, 0, junctionCenterZ), links: [9, 17] },
    { position: new Vector3(rightHallEastX - 2.4, 0, junctionCenterZ), links: [4, 18] },
    { position: new Vector3(northBranchDoorX, 0, natureNorthZ + 1.25), links: [1, 13] },
    { position: new Vector3(northBranchDoorX, 0, northBranchHallCenterZ), links: [12, 14] },
    { position: new Vector3(northBranchDoorX, 0, northBranchRoomSouthZ - 1.25), links: [13, 15] },
    { position: new Vector3(northBranchRoomCenterX, 0, northBranchRoomCenterZ), links: [14, 16, 24] },
    { position: new Vector3(northBranchRoomCenterX - 5.1, 0, northBranchRoomCenterZ), links: [15] },
    { position: new Vector3(leftEndRoomCenterX, 0, leftEndRoomCenterZ), links: [10] },
    { position: new Vector3(rightEndRoomCenterX, 0, rightEndRoomCenterZ), links: [11] },
    { position: new Vector3(rightEndRoomConnectorCenterX, 0, rightEndRoomConnectorCenterZ), links: [20] },
    { position: new Vector3(rightTurnHallCenterX, 0, rightTurnHallCenterZ), links: [19, 21] },
    { position: new Vector3(rightFinalHallCenterX, 0, rightFinalHallCenterZ), links: [20, 22, 23] },
    { position: new Vector3(rightNorthRoomCenterX, 0, rightNorthRoomCenterZ), links: [21] },
    { position: new Vector3(rightSouthRoomCenterX, 0, rightSouthRoomCenterZ), links: [21] },
    { position: new Vector3(northBranchRoomWestX + 1.2, 0, basementDoorZ), links: [15, 25] },
    { position: new Vector3(basementHallEastX - 1.2, 0, basementHallCenterZ), links: [24, 26] },
    { position: new Vector3(basementHallCenterX, 0, basementHallCenterZ), links: [25, 27] },
    { position: new Vector3(basementRoomCenterX, 0, basementRoomCenterZ), links: [26, 28] },
    { position: new Vector3(mistHallEastX - 1.2, 0, mistHallCenterZ), links: [27, 29] },
    { position: new Vector3(mistHallCenterX, 0, mistHallCenterZ), links: [28] },
    { position: new Vector3(leftStairHallCenterX, 0, leftStairHallCenterZ), links: [17, 31] },
    { position: new Vector3(leftStairLandingCenterX, 0, leftStairLandingCenterZ), links: [30, 32] },
    { position: new Vector3(leftStairDownCenterX, 0, leftStairDownCenterZ), links: [31, 33] },
    { position: new Vector3(leftStairLowerRoomCenterX, 0, leftStairLowerRoomCenterZ), links: [32] },
  ];
  const blueRoamNodeIndexes = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
    18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33,
  ] as const;
  let bluePatrolIndex = 1;
  let blueChasing = false;
  let blueStuckTimer = 0;
  let blueAnimationTime = 0;
  let blueStepSign = 0;
  let blueRoarQueued = false;
  let blueStompQueued = false;
  let blueFootstepsAudible = false;
  let blueDetourNodeIndex: number | null = null;
  let bluePatrolRetargetTimer = 0;
  const greenHome = new Vector3(leftEndRoomCenterX + 1.2, 0, leftEndRoomCenterZ - 2.2);
  const greenPosition = greenHome.clone();
  const greenTarget = greenHome.clone();
  const greenDirection = new Vector3(0, 0, 1);
  const greenLastPosition = greenHome.clone();
  const greenRoamNodeIndexes = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
    18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
  ] as const;
  let greenPatrolIndex = 17;
  let greenInvestigating = false;
  let greenLostNoiseTimer = 0;
  let greenStuckTimer = 0;
  let greenAnimationTime = 0;
  let greenSenseQueued = false;
  let greenBoxGrabQueued = false;
  let greenTouchQueued = false;
  let greenSqueakQueued = false;
  let greenSenseCooldown = 0;
  let greenTouchCooldown = 0;
  let greenSqueakCooldown = 0;
  let greenDetourNodeIndex: number | null = null;
  let greenPatrolRetargetTimer = 0;
  let blueGroupRetargetCooldown = 0;
  let greenGroupRetargetCooldown = 0;
  let blueJumpscareViewActive = false;
  let greenJumpscareViewActive = false;
  let blueJumpscareRenderStates: ChapterFourJumpscareMeshState[] = [];
  let greenJumpscareRenderStates: ChapterFourJumpscareMeshState[] = [];

  const getRandomNodeIndex = (nodeIndexes: readonly number[], avoidIndex = -1): number => {
    let nextIndex = nodeIndexes[Math.floor(Math.random() * nodeIndexes.length)] ?? 0;
    for (let attempt = 0; attempt < 6 && nextIndex === avoidIndex; attempt += 1) {
      nextIndex = nodeIndexes[Math.floor(Math.random() * nodeIndexes.length)] ?? 0;
    }
    return nextIndex;
  };

  const getRandomBlueRoamNodeIndex = (avoidIndex = -1): number => getRandomNodeIndex(blueRoamNodeIndexes, avoidIndex);

  const getRandomGreenRoamNodeIndex = (avoidIndex = -1): number => {
    return getRandomNodeIndex(greenRoamNodeIndexes, avoidIndex);
  };

  const addLockedMetalFenceBoundary = (): void => {
    const fenceWidth = 3.2;
    const sideWallWidth = (mainWidth - fenceWidth) / 2;
    addWall(root, colliders, wallMaterial, CENTER_X - fenceWidth / 2 - sideWallWidth / 2, mainSouthZ, sideWallWidth, WALL_THICKNESS);
    addWall(root, colliders, wallMaterial, CENTER_X + fenceWidth / 2 + sideWallWidth / 2, mainSouthZ, sideWallWidth, WALL_THICKNESS);
    addCollider(colliders, CENTER_X, mainSouthZ, mainWidth, WALL_THICKNESS);
    [0.55, 1.55, 2.65].forEach((y) => {
      addBox(root, metalFenceMaterial, fenceWidth, 0.11, 0.1, CENTER_X, y, mainSouthZ);
    });
    for (let offset = -fenceWidth / 2; offset <= fenceWidth / 2 + 0.001; offset += 0.38) {
      addBox(root, metalFenceMaterial, 0.055, 2.75, 0.08, CENTER_X + offset, 1.38, mainSouthZ);
    }
    const leftCross = addBox(root, metalFenceMaterial, fenceWidth * 1.05, 0.055, 0.075, CENTER_X, 1.55, mainSouthZ + 0.02);
    leftCross.rotation.z = 0.34;
    const rightCross = addBox(root, metalFenceMaterial, fenceWidth * 1.05, 0.055, 0.075, CENTER_X, 1.55, mainSouthZ + 0.025);
    rightCross.rotation.z = -0.34;
    addBox(root, lockMaterial, 0.36, 0.42, 0.11, CENTER_X, 1.18, mainSouthZ + 0.12);
    addBox(root, lockMaterial, 0.26, 0.08, 0.09, CENTER_X, 1.47, mainSouthZ + 0.13);
    addBox(root, lockMaterial, 0.07, 0.28, 0.08, CENTER_X - 0.13, 1.34, mainSouthZ + 0.13);
    addBox(root, lockMaterial, 0.07, 0.28, 0.08, CENTER_X + 0.13, 1.34, mainSouthZ + 0.13);
    addBox(root, wallMaterial, mainWidth + 3, WALL_HEIGHT, 0.26, CENTER_X, WALL_HEIGHT / 2, mainSouthZ + 2.35);
    Array.from({ length: 10 }, (_, index) => ({
      x: CENTER_X - 5.1 + index * 1.15,
      z: mainSouthZ + 1.25 + (index % 2) * 0.45,
      scale: index % 3 === 0 ? 0.92 : 0.76,
    })).forEach((tree) => {
      const trunk = new Mesh(new CylinderGeometry(0.12, 0.16, 1.45, 8), fakeTreeBarkMaterial);
      trunk.position.set(tree.x, 0.72, tree.z);
      root.add(trunk);
      const canopy = new Mesh(new SphereGeometry(tree.scale, 12, 8), fakeTreeLeafMaterial);
      canopy.position.set(tree.x, 1.75, tree.z);
      root.add(canopy);
    });
  };

  const addLocker = (
    id: string,
    label: string,
    x: number,
    z: number,
    facingAngle = 0,
  ): ChapterFourLocker => {
    const lockerRoot = new Group();
    lockerRoot.position.set(x, 0, z);
    lockerRoot.rotation.y = facingAngle;
    root.add(lockerRoot);

    const width = 1.34;
    const depth = 0.92;
    const height = 2.82;
    const wall = 0.08;
    const frontZ = depth / 2;
    const backZ = -depth / 2;

    addBox(lockerRoot, lockerInteriorMaterial, width, height, wall, 0, height / 2, backZ);
    addBox(lockerRoot, metalFenceMaterial, wall, height, depth, -width / 2, height / 2, 0);
    addBox(lockerRoot, metalFenceMaterial, wall, height, depth, width / 2, height / 2, 0);
    addBox(lockerRoot, metalFenceMaterial, width, wall, depth, 0, wall / 2, 0);
    addBox(lockerRoot, metalFenceMaterial, width, wall, depth, 0, height - wall / 2, 0);

    addBox(lockerRoot, metalFenceMaterial, 0.14, height - 0.28, 0.08, -width / 2 + 0.07, height / 2, frontZ);
    addBox(lockerRoot, metalFenceMaterial, 0.14, height - 0.28, 0.08, width / 2 - 0.07, height / 2, frontZ);
    addBox(lockerRoot, metalFenceMaterial, width * 0.74, 1.05, 0.08, 0, 0.78, frontZ);
    addBox(lockerRoot, metalFenceMaterial, width * 0.74, 0.18, 0.08, 0, 1.5, frontZ);
    addBox(lockerRoot, metalFenceMaterial, width * 0.74, 0.18, 0.08, 0, 1.86, frontZ);
    addBox(lockerRoot, metalFenceMaterial, width * 0.74, 0.62, 0.08, 0, 2.36, frontZ);
    addBox(lockerRoot, metalFenceMaterial, 0.12, height - 0.32, 0.08, 0, height / 2, frontZ + 0.012);

    const halfWidth = Math.abs(Math.cos(facingAngle)) * width / 2 + Math.abs(Math.sin(facingAngle)) * depth / 2;
    const halfDepth = Math.abs(Math.sin(facingAngle)) * width / 2 + Math.abs(Math.cos(facingAngle)) * depth / 2;
    const frontDirection = new Vector3(Math.sin(facingAngle), 0, Math.cos(facingAngle));
    const collider: CollisionBox = {
      centerX: x,
      centerZ: z,
      halfWidth,
      halfDepth,
    };
    colliders.push(collider);

    return {
      id,
      label,
      root: lockerRoot,
      collider,
      interactPosition: new Vector3(x, GAME_CONFIG.player.height, z).addScaledVector(frontDirection, depth / 2 + 0.45),
      insidePosition: new Vector3(x, GAME_CONFIG.player.height, z).addScaledVector(frontDirection, depth / 2 - 0.24),
      exitPosition: new Vector3(x, GAME_CONFIG.player.height, z).addScaledVector(frontDirection, depth / 2 + 0.92),
      lookTarget: new Vector3(x, GAME_CONFIG.player.height * 0.92, z).addScaledVector(frontDirection, 4),
    };
  };

  const addStorageShelf = (x: number, z: number): void => {
    const shelfRoot = new Group();
    shelfRoot.position.set(x, 0, z);
    root.add(shelfRoot);

    const width = 3.4;
    const depth = 0.92;
    const height = 2.24;
    [-width / 2 + 0.08, width / 2 - 0.08].forEach((postX) => {
      [-depth / 2 + 0.08, depth / 2 - 0.08].forEach((postZ) => {
        addBox(shelfRoot, metalFenceMaterial, 0.08, height, 0.08, postX, height / 2, postZ);
      });
    });
    [0.38, 1.08, 1.78].forEach((shelfY) => {
      addBox(shelfRoot, bridgeWoodMaterial, width, 0.1, depth, 0, shelfY, 0);
    });

    [
      [-1.05, 0.68, -0.18, 0.62, 0.5, 0.46],
      [-0.22, 0.67, 0.18, 0.56, 0.48, 0.42],
      [0.72, 0.69, -0.1, 0.72, 0.52, 0.5],
      [-0.78, 1.38, 0.12, 0.64, 0.48, 0.42],
      [0.18, 1.38, -0.16, 0.58, 0.45, 0.42],
      [1.05, 1.4, 0.12, 0.5, 0.42, 0.38],
    ].forEach(([boxX, boxY, boxZ, boxWidth, boxHeight, boxDepth]) => {
      addBox(shelfRoot, tinyShedWallMaterial, boxWidth, boxHeight, boxDepth, boxX, boxY, boxZ);
    });

    const toyBall = new Mesh(new SphereGeometry(0.18, 14, 10), fakeRiverMaterial);
    toyBall.position.set(-1.22, 1.98, 0.12);
    shelfRoot.add(toyBall);
    addBox(shelfRoot, fakeTreeLeafMaterial, 0.34, 0.34, 0.34, -0.55, 1.95, -0.12);
    addBox(shelfRoot, handleMaterial, 0.38, 0.24, 0.28, 0.1, 1.91, 0.16);
    addBox(shelfRoot, tinyShedDoorMaterial, 0.56, 0.28, 0.32, 0.82, 1.93, -0.06);

    addCollider(colliders, x, z, width, depth);
  };

  const addMistHand = (offsetX: number, offsetZ: number, phase: number): void => {
    const handRoot = new Group();
    handRoot.position.set(
      mistHandPatrolPosition.x + offsetX,
      mistHallFloorOffset + 0.52,
      mistHandPatrolPosition.z + offsetZ,
    );
    root.add(handRoot);

    const forearm = new Mesh(new CylinderGeometry(0.035, 0.045, 0.82, 8), purpleHandMaterial);
    forearm.position.set(0, -0.16, 0);
    forearm.rotation.z = 0.08;
    handRoot.add(forearm);

    const wrist = new Mesh(new CylinderGeometry(0.026, 0.032, 0.28, 8), purpleHandMaterial);
    wrist.position.set(0, 0.28, 0);
    handRoot.add(wrist);

    const palm = new Mesh(new SphereGeometry(0.2, 12, 8), purpleHandMaterial);
    palm.position.set(0, 0.47, 0);
    palm.scale.set(0.48, 0.25, 0.36);
    handRoot.add(palm);

    [-0.105, -0.035, 0.035, 0.105].forEach((fingerOffsetZ, index) => {
      const finger = new Mesh(new CylinderGeometry(0.014, 0.018, 0.42 - index * 0.025, 8), purpleHandMaterial);
      finger.position.set(0, 0.72, fingerOffsetZ);
      finger.rotation.z = -0.08 + index * 0.04;
      handRoot.add(finger);
    });

    const thumb = new Mesh(new CylinderGeometry(0.016, 0.02, 0.28, 8), purpleHandMaterial);
    thumb.position.set(-0.09, 0.52, 0.13);
    thumb.rotation.set(0.55, 0.18, 0.75);
    handRoot.add(thumb);

    basementMistHands.push({ root: handRoot, offsetX, offsetZ, phase });
  };

  const blueRoot = new Group();
  blueRoot.name = 'Blue';
  blueRoot.position.copy(blueHome);
  root.add(blueRoot);

  const blueBody = new Mesh(new SphereGeometry(0.82, 18, 12), blueSkinMaterial);
  blueBody.position.set(0, 1.17, 0);
  blueBody.scale.set(0.72, 1.22, 0.52);
  blueBody.rotation.x = -0.28;
  blueRoot.add(blueBody);

  const blueNeck = new Mesh(new CylinderGeometry(0.16, 0.2, 0.68, 12), blueSkinMaterial);
  blueNeck.position.set(0, 1.86, -0.18);
  blueNeck.rotation.x = 0.55;
  blueRoot.add(blueNeck);

  const blueHead = new Mesh(new SphereGeometry(0.48, 18, 14), blueSkinMaterial);
  blueHead.position.set(0, 2.28, -0.44);
  blueHead.scale.set(1.0, 1.08, 0.92);
  blueRoot.add(blueHead);

  const blueCrown = new Group();
  blueCrown.position.set(0, 2.84, -0.44);
  blueRoot.add(blueCrown);
  addBox(blueCrown, blueCrownMaterial, 0.72, 0.14, 0.16, 0, 0, 0);
  [-0.26, 0, 0.26].forEach((offsetX, index) => {
    const point = new Mesh(new CylinderGeometry(0.02, 0.08, 0.36 + (index === 1 ? 0.1 : 0), 4), blueCrownMaterial);
    point.position.set(offsetX, 0.18, 0);
    point.rotation.z = index === 0 ? 0.18 : index === 2 ? -0.18 : 0;
    blueCrown.add(point);
  });

  const normalEye = new Mesh(new SphereGeometry(0.095, 12, 8), blueGoodEyeMaterial);
  normalEye.position.set(-0.17, 2.34, -0.88);
  normalEye.scale.set(1.1, 1.18, 0.32);
  blueRoot.add(normalEye);

  const buttonEye = new Mesh(new CylinderGeometry(0.105, 0.105, 0.028, 18), blueButtonEyeMaterial);
  buttonEye.position.set(0.18, 2.34, -0.89);
  buttonEye.rotation.x = Math.PI / 2;
  blueRoot.add(buttonEye);
  [-0.035, 0.035].forEach((offset) => {
    addBox(blueRoot, blueEyeMaterial, 0.018, 0.018, 0.012, 0.18 + offset, 2.345, -0.91);
    addBox(blueRoot, blueEyeMaterial, 0.018, 0.018, 0.012, 0.18, 2.345 + offset, -0.91);
  });

  const blueMouth = new Group();
  blueMouth.position.set(0, 2.12, -0.91);
  blueRoot.add(blueMouth);
  const blueMouthCenter = new Mesh(new BoxGeometry(0.28, 0.032, 0.018), blueMouthMaterial);
  blueMouthCenter.position.set(0, -0.03, 0);
  blueMouth.add(blueMouthCenter);
  [-1, 1].forEach((side) => {
    const corner = new Mesh(new BoxGeometry(0.13, 0.032, 0.018), blueMouthMaterial);
    corner.position.set(side * 0.16, -0.055, 0);
    corner.rotation.z = side * 0.46;
    blueMouth.add(corner);
  });
  const blueJumpscareMaw = new Mesh(new SphereGeometry(0.26, 18, 12), blueMouthMaterial);
  blueJumpscareMaw.position.set(0, 2.08, -0.93);
  blueJumpscareMaw.scale.set(1.12, 0.08, 0.2);
  blueJumpscareMaw.visible = false;
  blueRoot.add(blueJumpscareMaw);

  const blueDrool = new Mesh(new CylinderGeometry(0.025, 0.012, 0.42, 8), blueDroolMaterial);
  blueDrool.position.set(0.1, 1.86, -0.92);
  blueDrool.rotation.z = -0.08;
  blueRoot.add(blueDrool);

  const blueLeftArm = new Group();
  blueLeftArm.position.set(-0.54, 1.48, -0.04);
  blueRoot.add(blueLeftArm);
  const blueRightArm = new Group();
  blueRightArm.position.set(0.54, 1.48, -0.04);
  blueRoot.add(blueRightArm);
  [blueLeftArm, blueRightArm].forEach((arm, index) => {
    const side = index === 0 ? -1 : 1;
    const upper = new Mesh(new CylinderGeometry(0.085, 0.105, 0.82, 12), blueSkinMaterial);
    upper.position.set(side * 0.06, -0.34, -0.08);
    upper.rotation.z = side * 0.16;
    arm.add(upper);
    const forearm = new Mesh(new CylinderGeometry(0.07, 0.085, 0.8, 12), blueSkinMaterial);
    forearm.position.set(side * 0.12, -0.98, -0.06);
    forearm.rotation.z = side * 0.08;
    arm.add(forearm);
    const hand = new Mesh(new SphereGeometry(0.14, 12, 8), blueSkinMaterial);
    hand.position.set(side * 0.16, -1.42, -0.08);
    hand.scale.set(0.78, 0.46, 0.7);
    arm.add(hand);
  });

  const blueLeftLeg = new Group();
  blueLeftLeg.position.set(-0.24, 0.75, 0.03);
  blueRoot.add(blueLeftLeg);
  const blueRightLeg = new Group();
  blueRightLeg.position.set(0.24, 0.75, 0.03);
  blueRoot.add(blueRightLeg);
  const blueLeftKnee = new Group();
  const blueRightKnee = new Group();
  [blueLeftLeg, blueRightLeg].forEach((leg, index) => {
    const side = index === 0 ? -1 : 1;
    const thigh = new Mesh(new CylinderGeometry(0.14, 0.16, 0.52, 12), blueSkinMaterial);
    thigh.position.set(0, -0.26, 0);
    thigh.rotation.z = side * 0.06;
    leg.add(thigh);
    const knee = index === 0 ? blueLeftKnee : blueRightKnee;
    knee.position.set(0, -0.52, 0);
    leg.add(knee);
    const kneeCap = new Mesh(new SphereGeometry(0.15, 12, 8), blueSkinMaterial);
    kneeCap.scale.set(1, 0.74, 0.9);
    knee.add(kneeCap);
    const shin = new Mesh(new CylinderGeometry(0.12, 0.145, 0.55, 12), blueSkinMaterial);
    shin.position.set(0, -0.3, 0);
    shin.rotation.z = side * 0.04;
    knee.add(shin);
    const foot = new Mesh(new BoxGeometry(0.34, 0.12, 0.48), blueSkinMaterial);
    foot.position.set(0, -0.6, -0.18);
    knee.add(foot);
  });

  const greenRoot = new Group();
  greenRoot.name = 'Green';
  greenRoot.position.copy(greenHome);
  root.add(greenRoot);

  const greenBody = new Group();
  greenBody.position.set(0, 1.56, 0);
  greenBody.rotation.x = -0.08;
  greenRoot.add(greenBody);

  const greenTorso = new Mesh(new CylinderGeometry(0.26, 0.34, 2.9, 18), greenSkinMaterial);
  greenTorso.scale.set(0.72, 1, 0.58);
  greenBody.add(greenTorso);

  const greenHeadCap = new Mesh(new SphereGeometry(0.4, 18, 12), greenSkinMaterial);
  greenHeadCap.position.set(0, 1.4, -0.08);
  greenHeadCap.scale.set(0.82, 0.72, 0.58);
  greenBody.add(greenHeadCap);

  const greenFaceBulge = new Mesh(new SphereGeometry(0.46, 18, 12), greenSkinMaterial);
  greenFaceBulge.position.set(0, 1.16, -0.22);
  greenFaceBulge.scale.set(0.82, 0.74, 0.54);
  greenBody.add(greenFaceBulge);

  [-0.18, 0.18].forEach((offsetX, index) => {
    const eye = new Mesh(new SphereGeometry(0.15, 16, 10), greenEyeMaterial);
    eye.position.set(offsetX, 1.5 + (index === 0 ? 0.03 : -0.01), -0.38);
    eye.scale.set(1.08, 1.2, 0.58);
    greenBody.add(eye);
    const pupil = new Mesh(new SphereGeometry(0.048, 10, 8), greenPupilMaterial);
    pupil.position.set(offsetX + (index === 0 ? 0.035 : -0.02), 1.49 + (index === 0 ? -0.015 : 0.02), -0.47);
    pupil.scale.set(1, 1, 0.45);
    greenBody.add(pupil);
  });

  const greenMouth = new Mesh(new SphereGeometry(0.26, 16, 10), greenMouthMaterial);
  greenMouth.position.set(0, 1.02, -0.55);
  greenMouth.scale.set(1.14, 0.54, 0.24);
  greenBody.add(greenMouth);

  [-0.24, -0.13, -0.03, 0.1, 0.22].forEach((offsetX, index) => {
    const upperTooth = new Mesh(new CylinderGeometry(0, 0.034, 0.28 - index * 0.012, 4), greenToothMaterial);
    upperTooth.position.set(offsetX, 1.14 + (index % 2) * 0.018, -0.72 - Math.abs(index - 2) * 0.01);
    upperTooth.rotation.x = Math.PI * 0.92;
    upperTooth.rotation.y = (index - 2) * 0.1;
    upperTooth.rotation.z = (index - 2) * 0.13;
    greenBody.add(upperTooth);
    const lowerTooth = new Mesh(new CylinderGeometry(0, 0.03, 0.24 + (index % 2) * 0.035, 4), greenToothMaterial);
    lowerTooth.position.set(offsetX * 0.92, 0.89 - (index % 2) * 0.012, -0.71);
    lowerTooth.rotation.x = -0.18;
    lowerTooth.rotation.y = (2 - index) * 0.08;
    lowerTooth.rotation.z = (2 - index) * 0.12;
    greenBody.add(lowerTooth);
  });

  const greenTongue = new Mesh(new CylinderGeometry(0.036, 0.052, 0.58, 10), greenTongueMaterial);
  greenTongue.position.set(0.03, 0.78, -0.72);
  greenTongue.rotation.set(0.82, 0.04, -0.12);
  greenBody.add(greenTongue);

  const greenLeftArm = new Group();
  greenLeftArm.position.set(-0.34, 2.42, -0.02);
  greenRoot.add(greenLeftArm);
  const greenRightArm = new Group();
  greenRightArm.position.set(0.34, 2.42, -0.02);
  greenRoot.add(greenRightArm);
  const greenLeftElbow = new Group();
  const greenRightElbow = new Group();
  const makeGreenArm = (arm: Group, elbow: Group, side: -1 | 1): void => {
    const upper = new Mesh(new CylinderGeometry(0.045, 0.066, 1.72, 12), greenSkinMaterial);
    upper.position.set(side * 0.16, -0.72, -0.04);
    upper.rotation.z = side * 0.2;
    arm.add(upper);
    elbow.position.set(side * 0.34, -1.5, -0.05);
    arm.add(elbow);
    const elbowCap = new Mesh(new SphereGeometry(0.09, 12, 8), greenSkinMaterial);
    elbow.add(elbowCap);
    const forearm = new Mesh(new CylinderGeometry(0.038, 0.058, 1.78, 12), greenSkinMaterial);
    forearm.position.set(side * 0.22, -0.78, -0.08);
    forearm.rotation.z = side * 0.14;
    elbow.add(forearm);
    const palm = new Mesh(new SphereGeometry(0.13, 12, 8), greenSkinMaterial);
    palm.position.set(side * 0.42, -1.68, -0.1);
    palm.scale.set(0.9, 0.46, 0.78);
    elbow.add(palm);
    [-0.12, -0.04, 0.04, 0.12].forEach((offset, index) => {
      const finger = new Mesh(new CylinderGeometry(0.011, 0.017, 0.5 - index * 0.035, 8), greenSkinMaterial);
      finger.position.set(side * (0.42 + Math.abs(offset) * 0.18), -1.88, offset);
      finger.rotation.z = side * (0.22 + index * 0.035);
      finger.rotation.x = 0.26;
      elbow.add(finger);
    });
  };
  makeGreenArm(greenLeftArm, greenLeftElbow, -1);
  makeGreenArm(greenRightArm, greenRightElbow, 1);

  const greenLeftLeg = new Group();
  greenLeftLeg.position.set(-0.18, 0.28, 0.02);
  greenRoot.add(greenLeftLeg);
  const greenRightLeg = new Group();
  greenRightLeg.position.set(0.18, 0.28, 0.02);
  greenRoot.add(greenRightLeg);
  [greenLeftLeg, greenRightLeg].forEach((leg, index) => {
    const side = index === 0 ? -1 : 1;
    const shin = new Mesh(new CylinderGeometry(0.065, 0.09, 0.62, 12), greenSkinMaterial);
    shin.position.set(0, 0.04, 0);
    shin.rotation.z = side * 0.07;
    leg.add(shin);
    const foot = new Mesh(new BoxGeometry(0.26, 0.1, 0.46), greenSkinMaterial);
    foot.position.set(0, -0.32, -0.16);
    leg.add(foot);
  });

  addFloorAndCeiling(root, floorMaterial, ceilingMaterial, CENTER_X, CENTER_Z, mainWidth, mainDepth);
  addFloorAndCeiling(root, hallFloorMaterial, ceilingMaterial, CENTER_X, frontHallCenterZ, HALL_WIDTH, frontHallLength);
  addFloorAndCeiling(root, floorMaterial, ceilingMaterial, CENTER_X, junctionCenterZ, junctionWidth, junctionDepth);
  addFloorAndCeiling(root, hallFloorMaterial, ceilingMaterial, leftHallCenterX, junctionCenterZ, junctionWestX - leftHallWestX, HALL_WIDTH);
  addFloorAndCeiling(root, hallFloorMaterial, ceilingMaterial, rightHallCenterX, junctionCenterZ, rightHallEastX - junctionEastX, HALL_WIDTH);
  addFloorAndCeiling(root, floorMaterial, ceilingMaterial, leftEndRoomCenterX, leftEndRoomCenterZ, leftEndRoomWidth, leftEndRoomDepth);
  if (enableLeftStairDownstairs) {
    addFloorAndCeiling(root, hallFloorMaterial, ceilingMaterial, leftStairHallCenterX, leftStairHallCenterZ, leftStairHallLength, HALL_WIDTH);
    addFloorAndCeiling(root, floorMaterial, ceilingMaterial, leftStairLandingCenterX, leftStairLandingCenterZ, leftStairLandingWidth, leftStairLandingDepth);
    for (let index = 0; index < leftStairStepCount; index += 1) {
      const stepProgress = (index + 1) / leftStairStepCount;
      const stepFloorY = MathUtils.lerp(0, leftStairLowerFloorOffset, stepProgress);
      const stepX = leftStairDownEastX - leftStairStepLength * (index + 0.5);
      addBox(root, hallFloorMaterial, leftStairStepLength + 0.04, 0.08, leftStairDownWidth, stepX, stepFloorY - 0.04, leftStairDownCenterZ);
      addBox(root, lowerWallMaterial, 0.08, Math.abs(leftStairLowerFloorOffset) / leftStairStepCount, leftStairDownWidth, stepX + leftStairStepLength / 2, stepFloorY + 0.16, leftStairDownCenterZ);
    }
    addFloorAndCeilingAt(root, floorMaterial, ceilingMaterial, leftStairLowerRoomCenterX, leftStairLowerRoomCenterZ, leftStairLowerRoomWidth, leftStairLowerRoomDepth, leftStairLowerFloorOffset);
  }
  addFloorAndCeiling(root, floorMaterial, ceilingMaterial, rightEndRoomCenterX, rightEndRoomCenterZ, rightEndRoomWidth, rightEndRoomDepth);
  addFloorAndCeiling(root, hallFloorMaterial, ceilingMaterial, rightEndRoomConnectorCenterX, rightEndRoomConnectorCenterZ, rightEndRoomConnectorLength, HALL_WIDTH);
  addFloorAndCeiling(root, hallFloorMaterial, ceilingMaterial, rightTurnHallCenterX, rightTurnHallCenterZ, HALL_WIDTH, rightTurnHallLength);
  addFloorAndCeiling(root, hallFloorMaterial, ceilingMaterial, rightFinalHallCenterX, rightFinalHallCenterZ, rightFinalHallLength, HALL_WIDTH);
  addFloorAndCeiling(root, floorMaterial, ceilingMaterial, rightNorthRoomCenterX, rightNorthRoomCenterZ, rightSideRoomSize, rightSideRoomSize);
  addFloorAndCeiling(root, floorMaterial, ceilingMaterial, rightSouthRoomCenterX, rightSouthRoomCenterZ, rightSideRoomSize, rightSideRoomSize);
  addFloorAndCeiling(root, fakeGrassMaterial, ceilingMaterial, natureCenterX, natureCenterZ, natureSize, natureSize);
  addFloorAndCeiling(root, fakeGrassMaterial, ceilingMaterial, natureCenterX, rightHallNorthZ - 0.85, natureDoorWidth, 1.7);
  addFloorAndCeiling(root, hallFloorMaterial, ceilingMaterial, northBranchDoorX, northBranchHallCenterZ, HALL_WIDTH, northBranchHallLength);
  addFloorAndCeiling(root, floorMaterial, ceilingMaterial, northBranchRoomCenterX, northBranchRoomCenterZ, northBranchRoomSize, northBranchRoomSize);
  addFloorAndCeiling(root, hallFloorMaterial, ceilingMaterial, basementHallEastX - basementLandingLength / 2, basementHallCenterZ, basementLandingLength + 0.04, HALL_WIDTH);
  const basementRampAngle = Math.atan2(Math.abs(basementFloorOffset), basementRampLength);
  const basementRamp = addBox(root, hallFloorMaterial, basementRampLength, 0.08, HALL_WIDTH, basementRampCenterX, basementFloorOffset / 2 - 0.04, basementHallCenterZ);
  basementRamp.rotation.z = basementRampAngle;
  const basementRampCeiling = addBox(root, ceilingMaterial, basementRampLength, 0.08, HALL_WIDTH, basementRampCenterX, basementFloorOffset / 2 + CEILING_Y, basementHallCenterZ);
  basementRampCeiling.rotation.z = basementRampAngle;
  addFloorAndCeilingAt(root, hallFloorMaterial, ceilingMaterial, basementHallWestX + basementBottomLandingLength / 2, basementHallCenterZ, basementBottomLandingLength + 0.04, HALL_WIDTH, basementFloorOffset);
  addFloorAndCeilingAt(root, floorMaterial, ceilingMaterial, basementRoomCenterX, basementRoomCenterZ, basementRoomSize, basementRoomSize, basementFloorOffset);
  for (let index = 0; index < basementStepCount; index += 1) {
    const stepFloorY = basementFloorOffset - basementStepDrop * (index + 1);
    const stepX = basementRoomWestX - basementStepLength * (index + 0.5);
    addBox(root, hallFloorMaterial, basementStepLength + 0.04, 0.08, basementStairWidth, stepX, stepFloorY - 0.04, basementRoomCenterZ);
    addBox(root, lowerWallMaterial, 0.08, basementStepDrop, basementStairWidth, stepX + basementStepLength / 2, stepFloorY + basementStepDrop / 2, basementRoomCenterZ);
  }
  addFloorAndCeilingAt(root, hallFloorMaterial, ceilingMaterial, mistHallCenterX, mistHallCenterZ, mistHallLength, mistHallWidth, mistHallFloorOffset);
  addBox(root, floorMaterial, mistPlatformWidth, mistPlatformHeight, mistPlatformDepth, mistPlatformCenterX, mistHallFloorOffset + mistPlatformHeight / 2, mistPlatformCenterZ);
  addBox(root, trimMaterial, mistPlatformWidth + 0.18, 0.1, 0.12, mistPlatformCenterX, mistPlatformFloorOffset + 0.06, mistPlatformMinZ);
  addBox(root, trimMaterial, 0.12, 0.1, mistPlatformDepth + 0.18, mistPlatformMaxX, mistPlatformFloorOffset + 0.06, mistPlatformCenterZ);
  addBox(root, basementMistMaterial, mistHallEastX - mistPlatformMaxX, 1.05, mistHallWidth, (mistHallEastX + mistPlatformMaxX) / 2, mistHallFloorOffset + 0.52, mistHallCenterZ);
  addBox(root, basementMistMaterial, mistPlatformWidth, 1.05, mistPlatformMinZ - mistHallNorthZ, mistPlatformCenterX, mistHallFloorOffset + 0.52, mistHallNorthZ + (mistPlatformMinZ - mistHallNorthZ) / 2);
  addBox(root, basementMistMaterial, mistHallLength, 0.34, mistHallWidth, mistHallCenterX, mistHallFloorOffset + 0.18, mistHallCenterZ);

  addHorizontalWallWithOpening(root, colliders, wallMaterial, mainNorthZ, mainWestX, mainEastX, CENTER_X, frontDoorWidth);
  addLockedMetalFenceBoundary();
  addWall(root, colliders, wallMaterial, mainWestX, CENTER_Z, WALL_THICKNESS, mainDepth);
  addWall(root, colliders, wallMaterial, mainEastX, CENTER_Z, WALL_THICKNESS, mainDepth);
  addTrim(root, trimMaterial, mainWestX + 0.17, CENTER_Z, 0.08, mainDepth);
  addTrim(root, trimMaterial, mainEastX - 0.17, CENTER_Z, 0.08, mainDepth);

  addWall(root, colliders, lowerWallMaterial, frontHallWestX, frontHallCenterZ, WALL_THICKNESS, frontHallLength);
  addWall(root, colliders, lowerWallMaterial, frontHallEastX, frontHallCenterZ, WALL_THICKNESS, frontHallLength);
  addHorizontalWallWithOpening(root, colliders, lowerWallMaterial, junctionSouthZ, junctionWestX, junctionEastX, CENTER_X, HALL_WIDTH);
  addWall(root, colliders, lowerWallMaterial, CENTER_X, junctionNorthZ, junctionWidth, WALL_THICKNESS);
  addVerticalWallWithOpenings(root, colliders, lowerWallMaterial, junctionWestX, junctionNorthZ, junctionSouthZ, [
    { centerZ: junctionCenterZ, depth: branchDoorWidth },
  ]);
  addVerticalWallWithOpenings(root, colliders, lowerWallMaterial, junctionEastX, junctionNorthZ, junctionSouthZ, [
    { centerZ: junctionCenterZ, depth: branchDoorWidth },
  ]);

  const leftHallNorthZ = junctionCenterZ - HALL_WIDTH / 2;
  const leftHallSouthZ = junctionCenterZ + HALL_WIDTH / 2;
  addWall(root, colliders, lowerWallMaterial, leftHallCenterX, leftHallNorthZ, junctionWestX - leftHallWestX, WALL_THICKNESS);
  addWall(root, colliders, lowerWallMaterial, leftHallCenterX, leftHallSouthZ, junctionWestX - leftHallWestX, WALL_THICKNESS);
  addVerticalWallWithOpening(root, colliders, lowerWallMaterial, leftEndRoomEastX, leftEndRoomNorthZ, leftEndRoomSouthZ, junctionCenterZ, sideRoomDoorWidth);
  addWall(root, colliders, lowerWallMaterial, leftEndRoomCenterX, leftEndRoomNorthZ, leftEndRoomWidth, WALL_THICKNESS);
  addWall(root, colliders, lowerWallMaterial, leftEndRoomCenterX, leftEndRoomSouthZ, leftEndRoomWidth, WALL_THICKNESS);
  if (enableLeftStairDownstairs) {
    addVerticalWallWithOpening(root, colliders, lowerWallMaterial, leftEndRoomWestX, leftEndRoomNorthZ, leftEndRoomSouthZ, leftStairHallDoorZ, leftStairHallDoorWidth);
    addWall(root, colliders, lowerWallMaterial, leftStairHallCenterX, leftStairHallNorthZ, leftStairHallLength, WALL_THICKNESS);
    addWall(root, colliders, lowerWallMaterial, leftStairHallCenterX, leftStairHallSouthZ, leftStairHallLength, WALL_THICKNESS);
    addVerticalWallWithOpening(root, colliders, lowerWallMaterial, leftStairLandingEastX, leftStairLandingNorthZ, leftStairLandingSouthZ, leftStairHallCenterZ, HALL_WIDTH);
    addWall(root, colliders, lowerWallMaterial, leftStairLandingCenterX, leftStairLandingNorthZ, leftStairLandingWidth, WALL_THICKNESS);
    addWall(root, colliders, lowerWallMaterial, leftStairLandingCenterX, leftStairLandingSouthZ, leftStairLandingWidth, WALL_THICKNESS);
    addVerticalWallWithOpening(root, colliders, lowerWallMaterial, leftStairLandingWestX, leftStairLandingNorthZ, leftStairLandingSouthZ, leftStairDownCenterZ, leftStairDownWidth);
    const leftStairWallHeight = WALL_HEIGHT + Math.abs(leftStairLowerFloorOffset);
    addBox(root, lowerWallMaterial, leftStairDownLength, leftStairWallHeight, WALL_THICKNESS, leftStairDownCenterX, leftStairLowerFloorOffset + leftStairWallHeight / 2, leftStairDownNorthZ);
    addCollider(colliders, leftStairDownCenterX, leftStairDownNorthZ, leftStairDownLength, WALL_THICKNESS);
    addBox(root, lowerWallMaterial, leftStairDownLength, leftStairWallHeight, WALL_THICKNESS, leftStairDownCenterX, leftStairLowerFloorOffset + leftStairWallHeight / 2, leftStairDownSouthZ);
    addCollider(colliders, leftStairDownCenterX, leftStairDownSouthZ, leftStairDownLength, WALL_THICKNESS);
    const leftStairLowerOpeningMinZ = leftStairLowerRoomCenterZ - leftStairDownWidth / 2;
    const leftStairLowerOpeningMaxZ = leftStairLowerRoomCenterZ + leftStairDownWidth / 2;
    addWallAt(root, colliders, lowerWallMaterial, leftStairLowerRoomEastX, leftStairLowerRoomNorthZ + (leftStairLowerOpeningMinZ - leftStairLowerRoomNorthZ) / 2, WALL_THICKNESS, leftStairLowerOpeningMinZ - leftStairLowerRoomNorthZ, leftStairLowerFloorOffset);
    addWallAt(root, colliders, lowerWallMaterial, leftStairLowerRoomEastX, leftStairLowerOpeningMaxZ + (leftStairLowerRoomSouthZ - leftStairLowerOpeningMaxZ) / 2, WALL_THICKNESS, leftStairLowerRoomSouthZ - leftStairLowerOpeningMaxZ, leftStairLowerFloorOffset);
    addWallAt(root, colliders, lowerWallMaterial, leftStairLowerRoomCenterX, leftStairLowerRoomNorthZ, leftStairLowerRoomWidth, WALL_THICKNESS, leftStairLowerFloorOffset);
    addWallAt(root, colliders, lowerWallMaterial, leftStairLowerRoomCenterX, leftStairLowerRoomSouthZ, leftStairLowerRoomWidth, WALL_THICKNESS, leftStairLowerFloorOffset);
    addWallAt(root, colliders, lowerWallMaterial, leftStairLowerRoomWestX, leftStairLowerRoomCenterZ, WALL_THICKNESS, leftStairLowerRoomDepth, leftStairLowerFloorOffset);
  } else {
    addWall(root, colliders, lowerWallMaterial, leftEndRoomWestX, leftEndRoomCenterZ, WALL_THICKNESS, leftEndRoomDepth);
  }

  addHorizontalWallWithOpening(root, colliders, lowerWallMaterial, rightHallNorthZ, junctionEastX, rightHallEastX, natureCenterX, natureDoorWidth);
  addWall(root, colliders, lowerWallMaterial, rightHallCenterX, rightHallSouthZ, rightHallEastX - junctionEastX, WALL_THICKNESS);
  addVerticalWallWithOpening(root, colliders, lowerWallMaterial, rightEndRoomWestX, rightEndRoomNorthZ, rightEndRoomSouthZ, junctionCenterZ, sideRoomDoorWidth);
  addWall(root, colliders, lowerWallMaterial, rightEndRoomCenterX, rightEndRoomNorthZ, rightEndRoomWidth, WALL_THICKNESS);
  addWall(root, colliders, lowerWallMaterial, rightEndRoomCenterX, rightEndRoomSouthZ, rightEndRoomWidth, WALL_THICKNESS);
  addVerticalWallWithOpening(root, colliders, lowerWallMaterial, rightEndRoomEastX, rightEndRoomNorthZ, rightEndRoomSouthZ, rightEndRoomConnectorCenterZ, HALL_WIDTH);
  addWall(root, colliders, lowerWallMaterial, 488.3, -22.73, WALL_THICKNESS, HALL_WIDTH);
  const rightConnectorNorthWallLength = rightEndRoomConnectorLength - HALL_WIDTH / 2;
  addWall(root, colliders, lowerWallMaterial, rightEndRoomConnectorWestX + rightConnectorNorthWallLength / 2, rightEndRoomConnectorCenterZ - HALL_WIDTH / 2, rightConnectorNorthWallLength, WALL_THICKNESS);
  addWall(root, colliders, lowerWallMaterial, rightEndRoomConnectorCenterX, rightEndRoomConnectorCenterZ + HALL_WIDTH / 2, rightEndRoomConnectorLength, WALL_THICKNESS);
  const rightTurnWallSouthZ = rightTurnHallSouthZ - HALL_WIDTH / 2;
  const rightTurnWestWallDepth = rightTurnWallSouthZ - rightTurnHallNorthZ;
  addWall(root, colliders, lowerWallMaterial, rightTurnHallCenterX - HALL_WIDTH / 2, rightTurnHallNorthZ + rightTurnWestWallDepth / 2, WALL_THICKNESS, rightTurnWestWallDepth);
  const rightTurnEastWallNorthZ = rightFinalHallSouthZ;
  const rightTurnEastWallDepth = rightTurnWallSouthZ - rightTurnEastWallNorthZ;
  addWall(root, colliders, lowerWallMaterial, rightTurnHallCenterX + HALL_WIDTH / 2, rightTurnEastWallNorthZ + rightTurnEastWallDepth / 2, WALL_THICKNESS, rightTurnEastWallDepth);
  addHorizontalWallWithOpening(root, colliders, lowerWallMaterial, rightFinalHallNorthZ, rightFinalHallWestX, rightFinalHallEastX, rightNorthRoomCenterX, sideRoomDoorWidth);
  addHorizontalWallWithOpening(root, colliders, lowerWallMaterial, rightFinalHallSouthZ, rightFinalHallWestX, rightFinalHallEastX, rightSouthRoomCenterX, sideRoomDoorWidth);
  addWall(root, colliders, lowerWallMaterial, rightFinalHallEastX, rightFinalHallCenterZ, WALL_THICKNESS, HALL_WIDTH);
  addWall(root, colliders, lowerWallMaterial, rightNorthRoomCenterX, rightNorthRoomNorthZ, rightSideRoomSize, WALL_THICKNESS);
  addWall(root, colliders, lowerWallMaterial, rightNorthRoomWestX, rightNorthRoomCenterZ, WALL_THICKNESS, rightSideRoomSize);
  addWall(root, colliders, lowerWallMaterial, rightNorthRoomEastX, rightNorthRoomCenterZ, WALL_THICKNESS, rightSideRoomSize);
  addWall(root, colliders, lowerWallMaterial, rightSouthRoomCenterX, rightSouthRoomSouthZ, rightSideRoomSize, WALL_THICKNESS);
  addWall(root, colliders, lowerWallMaterial, rightSouthRoomWestX, rightSouthRoomCenterZ, WALL_THICKNESS, rightSideRoomSize);
  addWall(root, colliders, lowerWallMaterial, rightSouthRoomEastX, rightSouthRoomCenterZ, WALL_THICKNESS, rightSideRoomSize);

  addHorizontalWallWithOpening(root, colliders, lowerWallMaterial, natureSouthZ, natureWestX, natureEastX, natureCenterX, natureDoorWidth);
  addHorizontalWallWithOpening(root, colliders, lowerWallMaterial, natureNorthZ, natureWestX, natureEastX, northBranchDoorX, northBranchDoorWidth);
  addWall(root, colliders, lowerWallMaterial, natureWestX, natureCenterZ, WALL_THICKNESS, natureSize);
  addWall(root, colliders, lowerWallMaterial, natureEastX, natureCenterZ, WALL_THICKNESS, natureSize);
  addWall(root, colliders, lowerWallMaterial, northBranchHallWestX, northBranchHallCenterZ, WALL_THICKNESS, northBranchHallLength);
  addWall(root, colliders, lowerWallMaterial, northBranchHallEastX, northBranchHallCenterZ, WALL_THICKNESS, northBranchHallLength);
  addHorizontalWallWithOpening(root, colliders, lowerWallMaterial, northBranchRoomSouthZ, northBranchRoomWestX, northBranchRoomEastX, northBranchDoorX, HALL_WIDTH);
  addWall(root, colliders, lowerWallMaterial, northBranchRoomCenterX, northBranchRoomNorthZ, northBranchRoomSize, WALL_THICKNESS);
  addVerticalWallWithOpenings(root, colliders, lowerWallMaterial, northBranchRoomWestX, northBranchRoomNorthZ, northBranchRoomSouthZ, [
    { centerZ: basementDoorZ, depth: basementDoorWidth },
  ]);
  addWall(root, colliders, lowerWallMaterial, northBranchRoomEastX, northBranchRoomCenterZ, WALL_THICKNESS, northBranchRoomSize);
  const basementRampWallHeight = WALL_HEIGHT + Math.abs(basementFloorOffset);
  addBox(root, lowerWallMaterial, basementHallLength, basementRampWallHeight, WALL_THICKNESS, basementHallCenterX, basementFloorOffset + basementRampWallHeight / 2, basementHallNorthZ);
  addCollider(colliders, basementHallCenterX, basementHallNorthZ, basementHallLength, WALL_THICKNESS);
  addBox(root, lowerWallMaterial, basementHallLength, basementRampWallHeight, WALL_THICKNESS, basementHallCenterX, basementFloorOffset + basementRampWallHeight / 2, basementHallSouthZ);
  addCollider(colliders, basementHallCenterX, basementHallSouthZ, basementHallLength, WALL_THICKNESS);
  addWallAt(root, colliders, lowerWallMaterial, basementRoomCenterX, basementRoomNorthZ, basementRoomSize, WALL_THICKNESS, basementFloorOffset);
  addWallAt(root, colliders, lowerWallMaterial, basementRoomCenterX, basementRoomSouthZ, basementRoomSize, WALL_THICKNESS, basementFloorOffset);
  const basementRoomWestNorthDepth = basementStairNorthZ - basementRoomNorthZ;
  const basementRoomWestSouthDepth = basementRoomSouthZ - basementStairSouthZ;
  addWallAt(root, colliders, lowerWallMaterial, basementRoomWestX, basementRoomNorthZ + basementRoomWestNorthDepth / 2, WALL_THICKNESS, basementRoomWestNorthDepth, basementFloorOffset);
  addWallAt(root, colliders, lowerWallMaterial, basementRoomWestX, basementStairSouthZ + basementRoomWestSouthDepth / 2, WALL_THICKNESS, basementRoomWestSouthDepth, basementFloorOffset);
  const basementEastNorthDepth = basementHallNorthZ - basementRoomNorthZ;
  const basementEastSouthDepth = basementRoomSouthZ - basementHallSouthZ;
  addWallAt(root, colliders, lowerWallMaterial, basementRoomEastX, basementRoomNorthZ + basementEastNorthDepth / 2, WALL_THICKNESS, basementEastNorthDepth, basementFloorOffset);
  addWallAt(root, colliders, lowerWallMaterial, basementRoomEastX, basementHallSouthZ + basementEastSouthDepth / 2, WALL_THICKNESS, basementEastSouthDepth, basementFloorOffset);
  const basementStairLength = basementRoomWestX - mistHallEastX;
  const basementStairCenterX = (basementRoomWestX + mistHallEastX) / 2;
  const basementStairWallHeight = WALL_HEIGHT + Math.abs(mistHallFloorOffset - basementFloorOffset);
  addBox(root, lowerWallMaterial, basementStairLength, basementStairWallHeight, WALL_THICKNESS, basementStairCenterX, mistHallFloorOffset + basementStairWallHeight / 2, basementStairNorthZ);
  addCollider(colliders, basementStairCenterX, basementStairNorthZ, basementStairLength, WALL_THICKNESS);
  addBox(root, lowerWallMaterial, basementStairLength, basementStairWallHeight, WALL_THICKNESS, basementStairCenterX, mistHallFloorOffset + basementStairWallHeight / 2, basementStairSouthZ);
  addCollider(colliders, basementStairCenterX, basementStairSouthZ, basementStairLength, WALL_THICKNESS);
  addWallAt(root, colliders, lowerWallMaterial, mistHallCenterX, mistHallNorthZ, mistHallLength, WALL_THICKNESS, mistHallFloorOffset);
  addWallAt(root, colliders, lowerWallMaterial, mistHallCenterX, mistHallSouthZ, mistHallLength, WALL_THICKNESS, mistHallFloorOffset);
  addWallAt(root, colliders, lowerWallMaterial, mistHallWestX, mistHallCenterZ, WALL_THICKNESS, mistHallWidth, mistHallFloorOffset);
  const mistEastNorthDepth = basementStairNorthZ - mistHallNorthZ;
  const mistEastSouthDepth = mistHallSouthZ - basementStairSouthZ;
  addWallAt(root, colliders, lowerWallMaterial, mistHallEastX, mistHallNorthZ + mistEastNorthDepth / 2, WALL_THICKNESS, mistEastNorthDepth, mistHallFloorOffset);
  addWallAt(root, colliders, lowerWallMaterial, mistHallEastX, basementStairSouthZ + mistEastSouthDepth / 2, WALL_THICKNESS, mistEastSouthDepth, mistHallFloorOffset);

  doors.push(
    addPushDoor('main-hallway-door', 'Main Hallway Door', root, colliders, doorMaterial, trimMaterial, handleMaterial, CENTER_X, mainNorthZ, 'x', frontDoorWidth, 1),
    addPushDoor('left-branch-door', 'Left Hallway Door', root, colliders, doorMaterial, trimMaterial, handleMaterial, junctionWestX, junctionCenterZ, 'z', branchDoorWidth, -1),
    addPushDoor('right-branch-door', 'Right Hallway Door', root, colliders, doorMaterial, trimMaterial, handleMaterial, junctionEastX, junctionCenterZ, 'z', branchDoorWidth, 1),
    addPushDoor('left-end-room-door', 'Left Big Room Door', root, colliders, doorMaterial, trimMaterial, handleMaterial, leftEndRoomEastX, leftEndRoomCenterZ, 'z', sideRoomDoorWidth, -1),
    addPushDoor('right-end-room-door', 'Right Big Room Door', root, colliders, doorMaterial, trimMaterial, handleMaterial, rightEndRoomWestX, rightEndRoomCenterZ, 'z', sideRoomDoorWidth, 1),
    addPushDoor('right-north-side-room-door', 'North Side Room Door', root, colliders, doorMaterial, trimMaterial, handleMaterial, rightNorthRoomCenterX, rightFinalHallNorthZ, 'x', sideRoomDoorWidth, -1),
    addPushDoor('right-south-side-room-door', 'South Side Room Door', root, colliders, doorMaterial, trimMaterial, handleMaterial, rightSouthRoomCenterX, rightFinalHallSouthZ, 'x', sideRoomDoorWidth, 1),
    addPushDoor('blues-room-door', 'Blues Room Door', root, colliders, doorMaterial, trimMaterial, handleMaterial, natureCenterX, rightHallNorthZ, 'x', natureDoorWidth, -1),
    addPushDoor('blues-north-room-door', 'North Room Door', root, colliders, doorMaterial, trimMaterial, handleMaterial, northBranchDoorX, natureNorthZ, 'x', northBranchDoorWidth, -1),
  );
  if (enableLeftStairDownstairs) {
    doors.push(addPushDoor('left-stair-hall-door', 'West Stair Hall Door', root, colliders, doorMaterial, trimMaterial, handleMaterial, leftEndRoomWestX, leftStairHallDoorZ, 'z', leftStairHallDoorWidth, 1));
  }

  const riverCenterX = natureCenterX - 3.4;
  const riverWidth = 2.0;
  const riverDepth = natureDepth + WALL_THICKNESS;
  const bridgeZ = natureCenterZ;
  const bridgeGap = 2.8;
  addBox(root, fakeRiverBankMaterial, 0.25, 0.06, riverDepth + 0.35, riverCenterX - riverWidth / 2 - 0.18, 0.055, natureCenterZ);
  addBox(root, fakeRiverBankMaterial, 0.25, 0.06, riverDepth + 0.35, riverCenterX + riverWidth / 2 + 0.18, 0.055, natureCenterZ);
  addBox(root, fakeRiverMaterial, riverWidth, 0.035, riverDepth, riverCenterX, 0.04, natureCenterZ);
  addCollider(colliders, riverCenterX, natureCenterZ - riverDepth / 2 / 2 - bridgeGap / 4, riverWidth + 0.35, riverDepth / 2 - bridgeGap / 2);
  addCollider(colliders, riverCenterX, natureCenterZ + riverDepth / 2 / 2 + bridgeGap / 4, riverWidth + 0.35, riverDepth / 2 - bridgeGap / 2);
  [-1.8, -0.95, -0.18, 0.58, 1.35, 2.1].forEach((offset) => {
    const plank = addBox(root, bridgeWoodMaterial, 0.72, 0.14, 3.0, riverCenterX + offset, 0.18 + Math.cos(offset) * 0.04, bridgeZ);
    plank.rotation.z = offset * 0.03;
  });
  [-1.65, 1.65].forEach((sideZ) => {
    [-1.9, -0.6, 0.7, 2.0].forEach((offsetX) => {
      addBox(root, bridgeWoodMaterial, 0.12, 0.72, 0.12, riverCenterX + offsetX, 0.62, bridgeZ + sideZ);
    });
    addBox(root, bridgeWoodMaterial, 4.2, 0.1, 0.12, riverCenterX + 0.05, 1.02, bridgeZ + sideZ);
  });

  const bigTreeX = natureEastX - 1.15;
  const bigTreeZ = natureCenterZ + 2.0;
  const bigTrunk = new Mesh(new CylinderGeometry(0.42, 0.5, 3.1, 14), fakeTreeBarkMaterial);
  bigTrunk.position.set(bigTreeX, 1.55, bigTreeZ);
  root.add(bigTrunk);
  addCollider(colliders, bigTreeX, bigTreeZ, 0.9, 0.9);
  [
    { x: 0, y: 3.85, z: 0, scale: 1.22 },
    { x: -0.52, y: 3.55, z: 0.16, scale: 0.85 },
    { x: 0.5, y: 3.58, z: -0.16, scale: 0.88 },
    { x: 0.02, y: 3.5, z: 0.58, scale: 0.78 },
  ].forEach((leaf) => {
    const canopy = new Mesh(new SphereGeometry(leaf.scale, 16, 10), fakeTreeLeafMaterial);
    canopy.position.set(bigTreeX + leaf.x, leaf.y, bigTreeZ + leaf.z);
    root.add(canopy);
  });

  const shedWidth = 1.82;
  const shedDepth = 2.02;
  const shedHeight = 1.92;
  const shedWall = 0.14;
  const shedBackX = natureEastX - 0.18;
  const shedX = shedBackX - shedWidth / 2;
  const shedZ = bigTreeZ - 1.95;
  const shedFrontX = shedX - shedWidth / 2;
  const shedNorthZ = shedZ - shedDepth / 2;
  const shedSouthZ = shedZ + shedDepth / 2;
  const shedDoorWidth = 0.72;
  const shedDoorZ = shedZ + 0.44;
  const shedDoorMinZ = shedDoorZ - shedDoorWidth / 2;
  const shedDoorMaxZ = shedDoorZ + shedDoorWidth / 2;
  addBox(root, tinyShedWallMaterial, shedWall, shedHeight, shedDepth, shedBackX, shedHeight / 2, shedZ);
  addCollider(colliders, shedBackX, shedZ, shedWall, shedDepth);
  addBox(root, tinyShedWallMaterial, shedWidth, shedHeight, shedWall, shedX, shedHeight / 2, shedNorthZ);
  addCollider(colliders, shedX, shedNorthZ, shedWidth, shedWall);
  addBox(root, tinyShedWallMaterial, shedWidth, shedHeight, shedWall, shedX, shedHeight / 2, shedSouthZ);
  addCollider(colliders, shedX, shedSouthZ, shedWidth, shedWall);
  addBox(root, tinyShedWallMaterial, shedWall, shedHeight, shedDoorMinZ - shedNorthZ, shedFrontX, shedHeight / 2, shedNorthZ + (shedDoorMinZ - shedNorthZ) / 2);
  addCollider(colliders, shedFrontX, shedNorthZ + (shedDoorMinZ - shedNorthZ) / 2, shedWall, shedDoorMinZ - shedNorthZ);
  addBox(root, tinyShedWallMaterial, shedWall, shedHeight, shedSouthZ - shedDoorMaxZ, shedFrontX, shedHeight / 2, shedDoorMaxZ + (shedSouthZ - shedDoorMaxZ) / 2);
  addCollider(colliders, shedFrontX, shedDoorMaxZ + (shedSouthZ - shedDoorMaxZ) / 2, shedWall, shedSouthZ - shedDoorMaxZ);
  addBox(root, tinyShedWallMaterial, shedWall + 0.08, 0.05, 0.5, shedFrontX - 0.02, 1.42, shedZ - 0.45);
  addBox(root, tinyShedWallMaterial, shedWall + 0.08, 0.05, 0.5, shedFrontX - 0.02, 1.08, shedZ - 0.45);
  addBox(root, tinyShedWallMaterial, shedWall + 0.08, 0.42, 0.05, shedFrontX - 0.02, 1.25, shedZ - 0.72);
  addBox(root, tinyShedWallMaterial, shedWall + 0.08, 0.42, 0.05, shedFrontX - 0.02, 1.25, shedZ - 0.18);
  const shedLeftRoof = addBox(root, tinyShedRoofMaterial, shedWidth * 0.68, 0.12, shedDepth + 0.26, shedX - shedWidth * 0.22, shedHeight + 0.12, shedZ);
  shedLeftRoof.rotation.z = 0.28;
  const shedRightRoof = addBox(root, tinyShedRoofMaterial, shedWidth * 0.68, 0.12, shedDepth + 0.26, shedX + shedWidth * 0.22, shedHeight + 0.12, shedZ);
  shedRightRoof.rotation.z = -0.28;
  addBox(root, tinyShedRoofMaterial, 0.12, 0.16, shedDepth + 0.28, shedX, shedHeight + 0.24, shedZ);
  doors.push(addInteractDoor('tiny-tree-shed-door', 'Tiny Shed Door', root, colliders, tinyShedDoorMaterial, tinyShedWallMaterial, handleMaterial, shedFrontX - 0.06, shedDoorZ, 'z', shedDoorWidth, 1));
  lockers.push(addLocker('blues-entry-locker', 'Blues Room Locker', natureCenterX + natureDoorWidth / 2 + 1.15, rightHallNorthZ + 0.52));
  lockers.push(addLocker('north-room-west-locker', 'North Room Locker', 431.55, -70.81, Math.PI / 2));
  addStorageShelf(451.93, -84.57);
  addMistHand(-0.22, -0.18, 0.2);
  addMistHand(0.22, 0.18, 0.45);

  [
    [CENTER_X, CENTER_Z - 0.6],
    [CENTER_X, frontHallCenterZ],
    [CENTER_X, junctionCenterZ],
    [leftHallCenterX, junctionCenterZ],
    [rightHallCenterX, junctionCenterZ],
    [leftEndRoomCenterX, leftEndRoomCenterZ],
    [rightEndRoomCenterX, rightEndRoomCenterZ],
    [rightTurnHallCenterX, rightTurnHallCenterZ],
    [rightFinalHallCenterX, rightFinalHallCenterZ],
    [rightNorthRoomCenterX, rightNorthRoomCenterZ],
    [rightSouthRoomCenterX, rightSouthRoomCenterZ],
    [natureCenterX, natureCenterZ],
    [northBranchDoorX, northBranchHallCenterZ],
    [northBranchRoomCenterX, northBranchRoomCenterZ],
  ].forEach(([x, z]) => addCeilingLight(root, lightMaterial, x, z));
  addBox(root, lightMaterial, 1.5, 0.08, 0.38, basementHallCenterX, basementFloorOffset / 2 + CEILING_Y - 0.2, basementHallCenterZ);
  addBox(root, lightMaterial, 1.8, 0.08, 0.42, basementRoomCenterX, basementFloorOffset + CEILING_Y - 0.2, basementRoomCenterZ);
  if (enableLeftStairDownstairs) {
    addBox(root, lightMaterial, 1.55, 0.08, 0.38, leftStairLowerRoomCenterX, leftStairLowerFloorOffset + CEILING_Y - 0.2, leftStairLowerRoomCenterZ);
  }

  const getSupportedFloorYAt = (position: Vector3): number | null => {
    if (enableLeftStairDownstairs) {
      const inLeftStairLowerRoom = position.x >= leftStairLowerRoomWestX - 0.15
        && position.x <= leftStairLowerRoomEastX + 0.15
        && position.z >= leftStairLowerRoomNorthZ - 0.15
        && position.z <= leftStairLowerRoomSouthZ + 0.15;
      if (inLeftStairLowerRoom) {
        return GAME_CONFIG.player.height + leftStairLowerFloorOffset;
      }

      const inLeftStairDown = position.x >= leftStairDownWestX - 0.15
        && position.x <= leftStairDownEastX + 0.15
        && position.z >= leftStairDownNorthZ - 0.15
        && position.z <= leftStairDownSouthZ + 0.15;
      if (inLeftStairDown) {
        const descentProgress = MathUtils.clamp((leftStairDownEastX - position.x) / leftStairDownLength, 0, 1);
        return GAME_CONFIG.player.height + MathUtils.lerp(0, leftStairLowerFloorOffset, descentProgress);
      }
    }

    const inMistPlatform = position.x >= mistPlatformMinX - 0.12
      && position.x <= mistPlatformMaxX + 0.12
      && position.z >= mistPlatformMinZ - 0.12
      && position.z <= mistPlatformMaxZ + 0.12;
    if (inMistPlatform) {
      return GAME_CONFIG.player.height + mistPlatformFloorOffset;
    }

    const inMistHall = position.x >= mistHallWestX - 0.15
      && position.x <= mistHallEastX + 0.15
      && position.z >= mistHallNorthZ - 0.15
      && position.z <= mistHallSouthZ + 0.15;
    if (inMistHall) {
      return GAME_CONFIG.player.height + mistHallFloorOffset;
    }

    const inBasementStairs = position.x >= mistHallEastX - 0.15
      && position.x <= basementRoomWestX + 0.15
      && position.z >= basementStairNorthZ - 0.15
      && position.z <= basementStairSouthZ + 0.15;
    if (inBasementStairs) {
      const stepIndex = MathUtils.clamp(
        Math.floor((basementRoomWestX - position.x) / basementStepLength),
        0,
        basementStepCount - 1,
      );
      return GAME_CONFIG.player.height + basementFloorOffset - basementStepDrop * (stepIndex + 1);
    }

    const inBasementRoom = position.x >= basementRoomWestX - 0.15
      && position.x <= basementRoomEastX + 0.15
      && position.z >= basementRoomNorthZ - 0.15
      && position.z <= basementRoomSouthZ + 0.15;
    if (inBasementRoom) {
      return GAME_CONFIG.player.height + basementFloorOffset;
    }

    const inBasementRamp = position.x >= basementHallWestX - 0.15
      && position.x <= basementHallEastX + 0.15
      && position.z >= basementHallNorthZ - 0.15
      && position.z <= basementHallSouthZ + 0.15;
    if (inBasementRamp) {
      if (position.x >= basementRampEastX) {
        return GAME_CONFIG.player.height;
      }

      if (position.x <= basementRampWestX) {
        return GAME_CONFIG.player.height + basementFloorOffset;
      }

      const descentProgress = MathUtils.clamp((basementRampEastX - position.x) / basementRampLength, 0, 1);
      return GAME_CONFIG.player.height + MathUtils.lerp(0, basementFloorOffset, descentProgress);
    }

    return null;
  };

  const isInsideTinyShed = (position: Vector3): boolean => (
    position.x >= shedFrontX - 0.08
    && position.x <= shedBackX + 0.08
    && position.z >= shedNorthZ - 0.08
    && position.z <= shedSouthZ + 0.08
  );

  const isInsideMistArea = (position: Vector3): boolean => (
    position.x >= mistHallWestX
    && position.x <= mistHallEastX
    && position.z >= mistHallNorthZ
    && position.z <= mistHallSouthZ
  );

  const hasLineOfSight = (from: Vector3, to: Vector3): boolean => {
    const distance = Math.hypot(to.x - from.x, to.z - from.z);
    if (distance <= 0.001) {
      return true;
    }

    const sampleCount = Math.max(2, Math.ceil(distance / 0.55));
    for (let index = 1; index < sampleCount; index += 1) {
      const t = index / sampleCount;
      const sampleX = MathUtils.lerp(from.x, to.x, t);
      const sampleZ = MathUtils.lerp(from.z, to.z, t);
      if (isBlockedByCollider(sampleX, sampleZ, colliders, 0.045)) {
        return false;
      }
    }

    return true;
  };

  const canBlueSeePlayer = (position: Vector3): boolean => {
    if (isInsideMistArea(position)) {
      return false;
    }

    const distance = Math.hypot(position.x - bluePosition.x, position.z - bluePosition.z);
    if (distance > 20) {
      return false;
    }

    if (!hasLineOfSight(bluePosition, position)) {
      return false;
    }

    if (blueChasing) {
      return true;
    }

    const toPlayer = blueMoveProbe.set(position.x - bluePosition.x, 0, position.z - bluePosition.z);
    if (toPlayer.lengthSq() < 0.001) {
      return true;
    }

    toPlayer.normalize();
    return blueDirection.dot(toPlayer) > -0.05 || distance < 4.2;
  };

  const isPlayerHiddenFromBlue = (state: ChapterFourPlayerState): boolean => {
    if (state.lockerActive || isInsideTinyShed(state.position) || isInsideMistArea(state.position)) {
      return true;
    }

    return state.boxActive;
  };

  const isPlayerProtectedFromGreen = (state: ChapterFourPlayerState): boolean => (
    state.lockerActive || isInsideTinyShed(state.position) || isInsideMistArea(state.position)
  );

  const getDistanceToSegment2D = (
    pointX: number,
    pointZ: number,
    startX: number,
    startZ: number,
    endX: number,
    endZ: number,
  ): number => {
    const segmentX = endX - startX;
    const segmentZ = endZ - startZ;
    const lengthSquared = segmentX * segmentX + segmentZ * segmentZ;
    if (lengthSquared <= 0.0001) {
      return Math.hypot(pointX - startX, pointZ - startZ);
    }

    const t = MathUtils.clamp(
      ((pointX - startX) * segmentX + (pointZ - startZ) * segmentZ) / lengthSquared,
      0,
      1,
    );
    return Math.hypot(pointX - (startX + segmentX * t), pointZ - (startZ + segmentZ * t));
  };

  const isAiPassableDoorCollider = (collider: CollisionBox): boolean => (
    doors.some((door) => door.mode === 'push'
      && door.collider === collider
      && (door.targetOpenAmount > 0.02 || door.openAmount > 0.02))
  );

  const canAgentOccupy = (x: number, z: number, radius: number): boolean => (
    !colliders.some((collider) => {
      if (collider.enabled === false || isAiPassableDoorCollider(collider)) {
        return false;
      }

      return Math.abs(x - collider.centerX) < collider.halfWidth + radius
        && Math.abs(z - collider.centerZ) < collider.halfDepth + radius;
    })
  );

  const canBlueOccupy = (x: number, z: number): boolean => canAgentOccupy(x, z, 0.5);

  const canGreenOccupy = (x: number, z: number): boolean => canAgentOccupy(x, z, 0.42);

  const isAgentNearDoor = (position: Vector3, door: ChapterFourDoor, alongPadding = 1.08, intoPadding = 1.45): boolean => {
    const alongDoor = door.spanAxis === 'x'
      ? Math.abs(position.x - door.interactPosition.x)
      : Math.abs(position.z - door.interactPosition.z);
    const intoDoor = door.spanAxis === 'x'
      ? Math.abs(position.z - door.interactPosition.z)
      : Math.abs(position.x - door.interactPosition.x);

    return alongDoor <= door.spanLength / 2 + alongPadding && intoDoor <= intoPadding;
  };

  const openPushDoorsNearPosition = (position: Vector3, alongPadding = 1.08, intoPadding = 1.45): void => {
    doors.forEach((door) => {
      if (door.mode === 'push' && isAgentNearDoor(position, door, alongPadding, intoPadding)) {
        door.targetOpenAmount = 1;
        door.open = true;
      }
    });
  };

  const openPushDoorsTowardTarget = (from: Vector3, to: Vector3): void => {
    const distance = Math.hypot(to.x - from.x, to.z - from.z);
    if (distance <= 0.001) {
      openPushDoorsNearPosition(from);
      return;
    }

    const sampleCount = Math.max(2, Math.ceil(Math.min(distance, 5.8) / 0.48));
    for (let index = 0; index <= sampleCount; index += 1) {
      const t = index / sampleCount;
      blueMoveProbe.set(
        MathUtils.lerp(from.x, to.x, t),
        0,
        MathUtils.lerp(from.z, to.z, t),
      );
      openPushDoorsNearPosition(blueMoveProbe, 0.92, 0.82);
    }
  };

  const hasClearBluePath = (from: Vector3, to: Vector3): boolean => {
    const distance = Math.hypot(to.x - from.x, to.z - from.z);
    if (distance <= 0.001) {
      return true;
    }

    const sampleCount = Math.max(2, Math.ceil(distance / 0.48));
    for (let index = 1; index <= sampleCount; index += 1) {
      const t = index / sampleCount;
      const sampleX = MathUtils.lerp(from.x, to.x, t);
      const sampleZ = MathUtils.lerp(from.z, to.z, t);
      if (!canBlueOccupy(sampleX, sampleZ)) {
        return false;
      }
    }

    return true;
  };

  const hasClearGreenPath = (from: Vector3, to: Vector3): boolean => {
    const distance = Math.hypot(to.x - from.x, to.z - from.z);
    if (distance <= 0.001) {
      return true;
    }

    const sampleCount = Math.max(2, Math.ceil(distance / 0.48));
    for (let index = 1; index <= sampleCount; index += 1) {
      const t = index / sampleCount;
      const sampleX = MathUtils.lerp(from.x, to.x, t);
      const sampleZ = MathUtils.lerp(from.z, to.z, t);
      if (!canGreenOccupy(sampleX, sampleZ)) {
        return false;
      }
    }

    return true;
  };

  const getNearestBlueNavNode = (position: Vector3, requireClearPath: boolean): number => {
    let closestIndex = 0;
    let closestDistance = Infinity;
    blueNavNodes.forEach((node, index) => {
      if (requireClearPath && !hasClearBluePath(position, node.position)) {
        return;
      }

      const distance = Math.hypot(position.x - node.position.x, position.z - node.position.z);
      if (distance < closestDistance) {
        closestIndex = index;
        closestDistance = distance;
      }
    });

    if (closestDistance < Infinity) {
      return closestIndex;
    }

    return requireClearPath ? getNearestBlueNavNode(position, false) : closestIndex;
  };

  const getNextBlueNavNode = (startIndex: number, goalIndex: number): number => {
    if (startIndex === goalIndex) {
      return goalIndex;
    }

    const queue = [startIndex];
    const visited = new Set<number>([startIndex]);
    const previous = new Map<number, number>();
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const current = queue[cursor];
      if (current === goalIndex) {
        break;
      }

      blueNavNodes[current].links.forEach((next) => {
        if (visited.has(next)) {
          return;
        }

        visited.add(next);
        previous.set(next, current);
        queue.push(next);
      });
    }

    if (!visited.has(goalIndex)) {
      return startIndex;
    }

    let step = goalIndex;
    while (previous.get(step) !== startIndex) {
      const nextStep = previous.get(step);
      if (nextStep === undefined) {
        return startIndex;
      }
      step = nextStep;
    }

    return step;
  };

  const getBlueMoveTarget = (target: Vector3): Vector3 => {
    if (hasClearBluePath(bluePosition, target)) {
      return target;
    }

    const startIndex = getNearestBlueNavNode(bluePosition, true);
    const goalIndex = getNearestBlueNavNode(target, false);
    const nextIndex = getNextBlueNavNode(startIndex, goalIndex);
    return blueNavNodes[nextIndex].position;
  };

  const getNearestGreenNavNode = (position: Vector3, requireClearPath: boolean): number => {
    let closestIndex = 0;
    let closestDistance = Infinity;
    blueNavNodes.forEach((node, index) => {
      if (requireClearPath && !hasClearGreenPath(position, node.position)) {
        return;
      }

      const distance = Math.hypot(position.x - node.position.x, position.z - node.position.z);
      if (distance < closestDistance) {
        closestIndex = index;
        closestDistance = distance;
      }
    });

    if (closestDistance < Infinity) {
      return closestIndex;
    }

    return requireClearPath ? getNearestGreenNavNode(position, false) : closestIndex;
  };

  const getGreenMoveTarget = (target: Vector3): Vector3 => {
    if (hasClearGreenPath(greenPosition, target)) {
      return target;
    }

    const startIndex = getNearestGreenNavNode(greenPosition, true);
    const goalIndex = getNearestGreenNavNode(target, false);
    const nextIndex = getNextBlueNavNode(startIndex, goalIndex);
    return blueNavNodes[nextIndex].position;
  };

  const nudgeBlueOutOfBlockedSpace = (): boolean => {
    if (canBlueOccupy(bluePosition.x, bluePosition.z)) {
      return true;
    }

    const angles = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI * 0.75, -Math.PI * 0.75, Math.PI] as const;
    for (const radius of [0.22, 0.38, 0.58, 0.82, 1.12] as const) {
      for (const angle of angles) {
        const sampleX = bluePosition.x + Math.cos(angle) * radius;
        const sampleZ = bluePosition.z + Math.sin(angle) * radius;
        if (!canBlueOccupy(sampleX, sampleZ)) {
          continue;
        }

        bluePosition.x = sampleX;
        bluePosition.z = sampleZ;
        blueStuckTimer = 0;
        return true;
      }
    }

    return false;
  };

  const assignBlueDetour = (target: Vector3): void => {
    const startIndex = getNearestBlueNavNode(bluePosition, false);
    const goalIndex = getNearestBlueNavNode(target, false);
    const nextIndex = getNextBlueNavNode(startIndex, goalIndex);
    const fallbackIndex = blueNavNodes[startIndex].links.find((link) => hasClearBluePath(bluePosition, blueNavNodes[link].position));
    if (!blueChasing) {
      bluePatrolIndex = nextIndex === startIndex
        ? fallbackIndex ?? getRandomBlueRoamNodeIndex(bluePatrolIndex)
        : nextIndex;
      blueDetourNodeIndex = null;
    } else {
      blueDetourNodeIndex = nextIndex === startIndex ? fallbackIndex ?? null : nextIndex;
    }
    blueStuckTimer = 0;
  };

  const moveBlueToward = (target: Vector3, speed: number, deltaSeconds: number): boolean => {
    if (!nudgeBlueOutOfBlockedSpace()) {
      return false;
    }

    openPushDoorsTowardTarget(bluePosition, target);
    const moveTarget = getBlueMoveTarget(target);
    openPushDoorsTowardTarget(bluePosition, moveTarget);
    const toTargetX = moveTarget.x - bluePosition.x;
    const toTargetZ = moveTarget.z - bluePosition.z;
    const distance = Math.hypot(toTargetX, toTargetZ);
    if (distance < 0.04) {
      return false;
    }

    const baseAngle = Math.atan2(toTargetZ, toTargetX);
    const moveDistance = Math.min(distance, speed * deltaSeconds);
    const angleOffsets = [0, 0.38, -0.38, 0.78, -0.78, Math.PI / 2, -Math.PI / 2, Math.PI] as const;
    for (const offset of angleOffsets) {
      const angle = baseAngle + offset;
      const nextX = bluePosition.x + Math.cos(angle) * moveDistance;
      const nextZ = bluePosition.z + Math.sin(angle) * moveDistance;
      const lookAheadX = nextX + Math.cos(angle) * 0.42;
      const lookAheadZ = nextZ + Math.sin(angle) * 0.42;
      if (!canBlueOccupy(nextX, nextZ) || !canBlueOccupy(lookAheadX, lookAheadZ)) {
        blueMoveProbe.set(lookAheadX, 0, lookAheadZ);
        openPushDoorsNearPosition(blueMoveProbe, 0.86, 0.78);
        continue;
      }

      bluePosition.x = nextX;
      bluePosition.z = nextZ;
      blueDirection.set(Math.cos(angle), 0, Math.sin(angle)).normalize();
      return true;
    }

    return false;
  };

  const isBlueNearDoor = (door: ChapterFourDoor): boolean => {
    return isAgentNearDoor(bluePosition, door);
  };

  const openDoorsNearBlue = (): void => {
    openPushDoorsNearPosition(bluePosition);
  };

  const openDoorsNearGreen = (): void => {
    openPushDoorsNearPosition(greenPosition, 1.35, 1.65);
  };

  const nudgeGreenOutOfBlockedSpace = (): boolean => {
    if (canGreenOccupy(greenPosition.x, greenPosition.z)) {
      return true;
    }

    const angles = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI * 0.75, -Math.PI * 0.75, Math.PI] as const;
    for (const radius of [0.18, 0.32, 0.52, 0.78, 1.05, 1.42, 1.88] as const) {
      for (const angle of angles) {
        const sampleX = greenPosition.x + Math.cos(angle) * radius;
        const sampleZ = greenPosition.z + Math.sin(angle) * radius;
        if (!canGreenOccupy(sampleX, sampleZ)) {
          continue;
        }

        greenPosition.x = sampleX;
        greenPosition.z = sampleZ;
        greenStuckTimer = 0;
        return true;
      }
    }

    return false;
  };

  const assignGreenDetour = (target: Vector3): void => {
    const startIndex = getNearestGreenNavNode(greenPosition, false);
    const goalIndex = getNearestGreenNavNode(target, false);
    const nextIndex = getNextBlueNavNode(startIndex, goalIndex);
    const fallbackIndex = blueNavNodes[startIndex].links.find((link) => hasClearGreenPath(greenPosition, blueNavNodes[link].position));
    if (!greenInvestigating) {
      greenPatrolIndex = nextIndex === startIndex
        ? fallbackIndex ?? getRandomGreenRoamNodeIndex(greenPatrolIndex)
        : nextIndex;
      greenDetourNodeIndex = null;
    } else {
      greenDetourNodeIndex = nextIndex === startIndex ? fallbackIndex ?? null : nextIndex;
    }
    greenStuckTimer = 0;
  };

  const steerGreenAroundImmediateObstacle = (target: Vector3): boolean => {
    const toTargetX = target.x - greenPosition.x;
    const toTargetZ = target.z - greenPosition.z;
    const targetAngle = Math.atan2(toTargetZ, toTargetX);
    for (const radius of [0.75, 1.15, 1.65, 2.25] as const) {
      for (const offset of [0.9, -0.9, 1.35, -1.35, Math.PI / 2, -Math.PI / 2] as const) {
        const sample = blueMoveProbe.set(
          greenPosition.x + Math.cos(targetAngle + offset) * radius,
          0,
          greenPosition.z + Math.sin(targetAngle + offset) * radius,
        );
        if (!canGreenOccupy(sample.x, sample.z) || !hasClearGreenPath(greenPosition, sample)) {
          continue;
        }

        greenDetourNodeIndex = null;
        greenTarget.copy(sample);
        greenInvestigating = true;
        greenStuckTimer = 0;
        return true;
      }
    }

    return false;
  };

  const moveGreenToward = (target: Vector3, speed: number, deltaSeconds: number): boolean => {
    if (!nudgeGreenOutOfBlockedSpace()) {
      return false;
    }

    openPushDoorsTowardTarget(greenPosition, target);
    const moveTarget = getGreenMoveTarget(target);
    openPushDoorsTowardTarget(greenPosition, moveTarget);
    const toTargetX = moveTarget.x - greenPosition.x;
    const toTargetZ = moveTarget.z - greenPosition.z;
    const distance = Math.hypot(toTargetX, toTargetZ);
    if (distance < 0.04) {
      return false;
    }

    const baseAngle = Math.atan2(toTargetZ, toTargetX);
    const moveDistance = Math.min(distance, speed * deltaSeconds);
    const angleOffsets = [0, 0.26, -0.26, 0.52, -0.52, 0.9, -0.9, Math.PI / 2, -Math.PI / 2, Math.PI * 0.78, -Math.PI * 0.78, Math.PI] as const;
    for (const offset of angleOffsets) {
      const angle = baseAngle + offset;
      const nextX = greenPosition.x + Math.cos(angle) * moveDistance;
      const nextZ = greenPosition.z + Math.sin(angle) * moveDistance;
      const lookAheadX = nextX + Math.cos(angle) * 0.36;
      const lookAheadZ = nextZ + Math.sin(angle) * 0.36;
      const longLookAheadX = nextX + Math.cos(angle) * 0.82;
      const longLookAheadZ = nextZ + Math.sin(angle) * 0.82;
      if (!canGreenOccupy(nextX, nextZ) || !canGreenOccupy(lookAheadX, lookAheadZ) || !canGreenOccupy(longLookAheadX, longLookAheadZ)) {
        blueMoveProbe.set(lookAheadX, 0, lookAheadZ);
        openPushDoorsNearPosition(blueMoveProbe, 0.95, 0.9);
        continue;
      }

      greenPosition.x = nextX;
      greenPosition.z = nextZ;
      greenDirection.set(Math.cos(angle), 0, Math.sin(angle)).normalize();
      return true;
    }

    return false;
  };

  const isGreenArmTouchingPlayer = (state: ChapterFourPlayerState): boolean => {
    if (isPlayerProtectedFromGreen(state)) {
      return false;
    }

    const playerX = state.position.x;
    const playerZ = state.position.z;
    const bodyDistance = Math.hypot(playerX - greenPosition.x, playerZ - greenPosition.z);
    if (bodyDistance > (state.boxActive ? 3.75 : 3.35)) {
      return false;
    }

    const forwardX = greenDirection.x;
    const forwardZ = greenDirection.z;
    const rightX = greenDirection.z;
    const rightZ = -greenDirection.x;
    const sweep = Math.sin(greenAnimationTime * 2.55);
    const reachPulse = Math.sin(greenAnimationTime * 1.35) * 0.24;
    const contactRadius = state.boxActive ? 0.72 : 0.48;
    const handRadius = state.boxActive ? 0.92 : 0.62;

    for (const side of [-1, 1] as const) {
      const shoulderX = greenPosition.x + rightX * side * 0.38 + forwardX * 0.08;
      const shoulderZ = greenPosition.z + rightZ * side * 0.38 + forwardZ * 0.08;
      const sideSweep = sweep * 0.86 + Math.sin(greenAnimationTime * 3.1 + side * 0.9) * 0.42;
      const elbowX = greenPosition.x
        + forwardX * (0.9 + reachPulse * 0.42)
        + rightX * (side * 0.7 + sideSweep * 0.42);
      const elbowZ = greenPosition.z
        + forwardZ * (0.9 + reachPulse * 0.42)
        + rightZ * (side * 0.7 + sideSweep * 0.42);
      const handX = greenPosition.x
        + forwardX * (2.08 + reachPulse)
        + rightX * (side * 1.04 + sideSweep);
      const handZ = greenPosition.z
        + forwardZ * (2.08 + reachPulse)
        + rightZ * (side * 1.04 + sideSweep);
      const fingertipX = handX + forwardX * 0.44 + rightX * side * 0.12;
      const fingertipZ = handZ + forwardZ * 0.44 + rightZ * side * 0.12;
      if (
        getDistanceToSegment2D(playerX, playerZ, shoulderX, shoulderZ, elbowX, elbowZ) <= contactRadius
        || getDistanceToSegment2D(playerX, playerZ, elbowX, elbowZ, handX, handZ) <= contactRadius
        || getDistanceToSegment2D(playerX, playerZ, handX, handZ, fingertipX, fingertipZ) <= contactRadius
        || Math.hypot(playerX - handX, playerZ - handZ) <= handRadius
      ) {
        return true;
      }
    }

    return false;
  };

  const captureJumpscareRenderState = (agentRoot: Group): ChapterFourJumpscareMeshState[] => {
    const states: ChapterFourJumpscareMeshState[] = [];

    agentRoot.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      states.push({
        mesh: object,
        renderOrder: object.renderOrder,
        materials: materials.map((material) => ({
          material,
          depthTest: material.depthTest,
          depthWrite: material.depthWrite,
        })),
      });
      materials.forEach((material) => {
        material.depthTest = false;
        material.depthWrite = false;
        material.needsUpdate = true;
      });
      object.renderOrder = 52;
    });

    return states;
  };

  const restoreJumpscareRenderState = (states: ChapterFourJumpscareMeshState[]): void => {
    states.forEach((state) => {
      state.mesh.renderOrder = state.renderOrder;
      state.materials.forEach(({ material, depthTest, depthWrite }) => {
        material.depthTest = depthTest;
        material.depthWrite = depthWrite;
        material.needsUpdate = true;
      });
    });
  };

  const restoreWorldRenderLayer = (agentRoot: Group): void => {
    agentRoot.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }

      object.renderOrder = 0;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        material.depthTest = true;
        if (!material.transparent) {
          material.depthWrite = true;
        }
        material.needsUpdate = true;
      });
    });
  };

  const beginBlueJumpscareView = (parent: Object3D): void => {
    if (!blueJumpscareViewActive) {
      blueJumpscareRenderStates = captureJumpscareRenderState(blueRoot);
    }
    blueJumpscareViewActive = true;
    blueRoot.visible = true;
    parent.add(blueRoot);
  };

  const beginGreenJumpscareView = (parent: Object3D): void => {
    if (!greenJumpscareViewActive) {
      greenJumpscareRenderStates = captureJumpscareRenderState(greenRoot);
    }
    greenJumpscareViewActive = true;
    greenRoot.visible = true;
    parent.add(greenRoot);
  };

  const updateBlueJumpscareView = (progress: number): void => {
    if (!blueJumpscareViewActive) {
      return;
    }

    const clampedProgress = MathUtils.clamp(progress, 0, 1);
    const approach = MathUtils.smoothstep(clampedProgress, 0.02, 0.34);
    const grab = MathUtils.smoothstep(clampedProgress, 0.24, 0.62);
    const scream = MathUtils.smoothstep(clampedProgress, 0.56, 0.88);
    const shake = Math.sin(clampedProgress * Math.PI * 34) * Math.pow(1 - clampedProgress, 0.48);

    blueRoot.position.set(
      shake * 0.035,
      MathUtils.lerp(-1.66, -1.74, approach) + scream * 0.03,
      MathUtils.lerp(-2.78, -1.58, Math.max(approach, scream * 0.9)),
    );
    blueRoot.rotation.set(
      -0.04 - grab * 0.04 + shake * 0.018,
      Math.PI + shake * 0.026,
      MathUtils.lerp(-0.08, 0.04, scream) + shake * 0.035,
    );
    blueRoot.scale.setScalar(1.08 + approach * 0.08 + scream * 0.24);
    blueBody.rotation.x = -0.38 - grab * 0.16 + shake * 0.018;
    blueHead.rotation.set(
      0.34 + scream * 0.32,
      shake * 0.04,
      MathUtils.lerp(-0.16, 0.08, grab) + shake * 0.04,
    );
    blueMouth.visible = false;
    blueJumpscareMaw.visible = true;
    blueJumpscareMaw.scale.set(
      1 + scream * 0.38,
      MathUtils.lerp(0.18, 1.72, scream),
      0.22,
    );
    blueLeftArm.rotation.set(
      MathUtils.lerp(-0.72, -1.55, grab) + shake * 0.03,
      MathUtils.lerp(-0.18, -0.5, grab),
      MathUtils.lerp(-0.52, -0.9, grab),
    );
    blueRightArm.rotation.set(
      MathUtils.lerp(-0.72, -1.55, grab) - shake * 0.03,
      MathUtils.lerp(0.18, 0.5, grab),
      MathUtils.lerp(0.52, 0.9, grab),
    );
    blueLeftLeg.rotation.x = -0.16 - grab * 0.1;
    blueRightLeg.rotation.x = 0.16 + grab * 0.1;
    blueLeftKnee.rotation.x = 0.24 + grab * 0.18;
    blueRightKnee.rotation.x = 0.24 + grab * 0.18;
    blueDrool.scale.y = 1.05 + scream * 0.32;
    blueGoodEyeMaterial.color.setHex(0xff2424);
    blueGoodEyeMaterial.emissive.setHex(0xff0000);
    blueGoodEyeMaterial.emissiveIntensity = 1.35 + scream * 0.3;
  };

  const updateGreenJumpscareView = (progress: number): void => {
    if (!greenJumpscareViewActive) {
      return;
    }

    const clampedProgress = MathUtils.clamp(progress, 0, 1);
    const grab = MathUtils.smoothstep(clampedProgress, 0.03, 0.42);
    const rip = MathUtils.smoothstep(clampedProgress, 0.28, 0.56);
    const scream = MathUtils.smoothstep(clampedProgress, 0.5, 0.88);
    const shake = Math.sin(clampedProgress * Math.PI * 38) * Math.pow(1 - clampedProgress, 0.46);
    const twitch = Math.sin(clampedProgress * Math.PI * 19) * Math.pow(1 - clampedProgress, 0.36);

    greenRoot.position.set(
      shake * 0.03,
      MathUtils.lerp(-2.56, -2.68, grab) + scream * 0.05,
      MathUtils.lerp(-2.22, -1.2, Math.max(grab, scream * 0.86)),
    );
    greenRoot.rotation.set(
      -0.03 - grab * 0.04 + twitch * 0.03,
      Math.PI + shake * 0.034,
      twitch * 0.055,
    );
    greenRoot.scale.setScalar(1.06 + grab * 0.12 + scream * 0.2);
    greenBody.rotation.set(
      -0.2 - rip * 0.16 + scream * 0.1,
      shake * 0.045,
      twitch * 0.05,
    );
    greenMouth.scale.set(
      1.18 + scream * 0.28,
      MathUtils.lerp(0.7, 1.96, scream),
      0.26,
    );
    greenTongue.rotation.x = 0.9 + scream * 0.18 + twitch * 0.03;
    greenLeftArm.position.set(
      MathUtils.lerp(-0.34, -0.78, grab),
      MathUtils.lerp(2.42, 2.1, grab),
      MathUtils.lerp(-0.02, -0.22, grab),
    );
    greenRightArm.position.set(
      MathUtils.lerp(0.34, 0.78, grab),
      MathUtils.lerp(2.42, 2.1, grab),
      MathUtils.lerp(-0.02, -0.22, grab),
    );
    greenLeftArm.rotation.set(
      -1.2 - grab * 0.34,
      -0.54 - grab * 0.34,
      -1.04 + rip * 0.34 + shake * 0.05,
    );
    greenRightArm.rotation.set(
      -1.2 - grab * 0.34,
      0.54 + grab * 0.34,
      1.04 - rip * 0.34 - shake * 0.05,
    );
    greenLeftElbow.rotation.x = 0.98 + grab * 0.34;
    greenRightElbow.rotation.x = 0.98 + grab * 0.34;
    greenLeftElbow.rotation.z = -0.34 + rip * 0.24;
    greenRightElbow.rotation.z = 0.34 - rip * 0.24;
    greenLeftLeg.rotation.x = -0.08 - grab * 0.08;
    greenRightLeg.rotation.x = 0.08 + grab * 0.08;
  };

  const endBlueJumpscareView = (): void => {
    const needsCleanup = blueJumpscareViewActive
      || blueJumpscareRenderStates.length > 0
      || blueRoot.parent !== root;

    if (!needsCleanup) {
      return;
    }

    blueJumpscareViewActive = false;
    restoreJumpscareRenderState(blueJumpscareRenderStates);
    blueJumpscareRenderStates = [];
    root.add(blueRoot);
    blueRoot.visible = false;
    blueRoot.scale.setScalar(1);
    blueMouth.visible = true;
    blueJumpscareMaw.visible = false;
    updateBlueAnimation(false);
    restoreWorldRenderLayer(blueRoot);
  };

  const endGreenJumpscareView = (): void => {
    const needsCleanup = greenJumpscareViewActive
      || greenJumpscareRenderStates.length > 0
      || greenRoot.parent !== root;

    if (!needsCleanup) {
      return;
    }

    greenJumpscareViewActive = false;
    restoreJumpscareRenderState(greenJumpscareRenderStates);
    greenJumpscareRenderStates = [];
    root.add(greenRoot);
    greenRoot.visible = false;
    greenRoot.scale.setScalar(1);
    updateGreenAnimation(false);
    restoreWorldRenderLayer(greenRoot);
  };

  const updateBlueAnimation = (moving: boolean): void => {
    if (blueJumpscareViewActive) {
      return;
    }

    const chaseReach = blueChasing ? 1 : 0;
    const step = Math.sin(blueAnimationTime * (blueChasing ? 9.5 : 4.5));
    const idleSag = Math.sin(blueAnimationTime * 1.8) * 0.04;
    const stride = blueChasing ? 0.48 : 0.16;
    const currentStepSign = step >= 0 ? 1 : -1;
    if (moving && blueFootstepsAudible && blueStepSign !== 0 && currentStepSign !== blueStepSign) {
      blueStompQueued = true;
    }
    blueStepSign = moving ? currentStepSign : 0;
    blueRoot.position.set(bluePosition.x, (getSupportedFloorYAt(bluePosition) ?? GAME_CONFIG.player.height) - GAME_CONFIG.player.height, bluePosition.z);
    blueRoot.rotation.y = Math.atan2(-blueDirection.x, -blueDirection.z);
    blueBody.rotation.x = -0.32 - chaseReach * 0.12 + idleSag;
    blueHead.rotation.x = 0.24 + chaseReach * 0.26;
    blueGoodEyeMaterial.color.setHex(blueChasing ? 0xff2424 : 0xf3f6ff);
    blueGoodEyeMaterial.emissive.setHex(blueChasing ? 0xff0000 : 0x6f8cff);
    blueGoodEyeMaterial.emissiveIntensity = blueChasing ? 1.35 : 0.12;
    blueLeftArm.rotation.set(MathUtils.lerp(0.16, -1.15, chaseReach) + step * 0.08, 0.08, -0.22);
    blueRightArm.rotation.set(MathUtils.lerp(0.16, -1.15, chaseReach) - step * 0.08, -0.08, 0.22);
    blueLeftLeg.rotation.x = step * stride;
    blueRightLeg.rotation.x = -step * stride;
    blueLeftKnee.rotation.x = 0.1 + Math.max(0, -step) * (blueChasing ? 0.72 : 0.28);
    blueRightKnee.rotation.x = 0.1 + Math.max(0, step) * (blueChasing ? 0.72 : 0.28);
    blueDrool.scale.y = 0.82 + Math.max(0, Math.sin(blueAnimationTime * 2.1)) * 0.22;
  };

  const updateGreenAnimation = (moving: boolean): void => {
    if (greenJumpscareViewActive) {
      return;
    }

    const searchReach = 1;
    const step = Math.sin(greenAnimationTime * (greenInvestigating ? 4.8 : 2.8));
    const feelWave = Math.sin(greenAnimationTime * 2.55);
    const sweep = Math.sin(greenAnimationTime * 3.1);
    greenRoot.position.set(greenPosition.x, (getSupportedFloorYAt(greenPosition) ?? GAME_CONFIG.player.height) - GAME_CONFIG.player.height, greenPosition.z);
    greenRoot.rotation.y = Math.atan2(-greenDirection.x, -greenDirection.z);
    greenBody.rotation.x = -0.12 - searchReach * 0.1 + Math.sin(greenAnimationTime * 1.4) * 0.035;
    greenBody.rotation.z = Math.sin(greenAnimationTime * 0.9) * 0.035;
    greenLeftArm.rotation.set(
      -0.98 + feelWave * 0.2,
      -0.42 + sweep * 0.42,
      -0.92 + step * 0.22,
    );
    greenRightArm.rotation.set(
      -0.98 - feelWave * 0.2,
      0.42 + sweep * 0.42,
      0.92 - step * 0.22,
    );
    greenLeftElbow.rotation.x = 0.72 + Math.max(0, -feelWave) * 0.34;
    greenRightElbow.rotation.x = 0.72 + Math.max(0, feelWave) * 0.34;
    greenLeftElbow.rotation.z = -0.22 + sweep * 0.24;
    greenRightElbow.rotation.z = 0.22 + sweep * 0.24;
    greenLeftLeg.rotation.x = moving ? step * 0.16 : 0;
    greenRightLeg.rotation.x = moving ? -step * 0.16 : 0;
    greenMouth.scale.y = 0.56 + searchReach * 0.16 + Math.max(0, Math.sin(greenAnimationTime * 1.9)) * 0.08;
    greenTongue.rotation.x = 0.72 + Math.sin(greenAnimationTime * 2.4) * 0.08;
  };

  const spawn = new Vector3(CENTER_X, GAME_CONFIG.player.height, CENTER_Z + 2.15);
  const lookTarget = new Vector3(CENTER_X, GAME_CONFIG.player.height * 0.82, mainNorthZ - 3);

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    doors,
    lockers,
    getSupportedFloorY(position: Vector3): number | null {
      return getSupportedFloorYAt(position);
    },
    isMistHandsCatching(position: Vector3, playerCrouching: boolean): boolean {
      if (playerCrouching) {
        return false;
      }

      const playerInMistArea = position.x >= mistHallWestX
        && position.x <= mistHallEastX
        && position.z >= mistHallNorthZ
        && position.z <= mistHallSouthZ;
      if (!playerInMistArea) {
        return false;
      }

      return basementMistHands.some((hand) => (
        Math.hypot(position.x - hand.root.position.x, position.z - hand.root.position.z) < 0.82
      ));
    },
    isBlueCatching(playerState: ChapterFourPlayerState): boolean {
      if (isPlayerHiddenFromBlue(playerState) || !blueChasing || isInsideMistArea(playerState.position)) {
        return false;
      }

      return Math.hypot(playerState.position.x - bluePosition.x, playerState.position.z - bluePosition.z) < 1.02
        && hasLineOfSight(bluePosition, playerState.position);
    },
    consumeBlueRoar(): boolean {
      const roared = blueRoarQueued;
      blueRoarQueued = false;
      return roared;
    },
    consumeBlueStomp(): boolean {
      const stomped = blueStompQueued;
      blueStompQueued = false;
      return stomped;
    },
    consumeGreenSense(): boolean {
      const sensed = greenSenseQueued;
      greenSenseQueued = false;
      return sensed;
    },
    consumeGreenBoxGrab(): boolean {
      const grabbed = greenBoxGrabQueued;
      greenBoxGrabQueued = false;
      return grabbed;
    },
    consumeGreenTouch(): boolean {
      const touched = greenTouchQueued;
      greenTouchQueued = false;
      return touched;
    },
    consumeGreenSqueak(): boolean {
      const squeaked = greenSqueakQueued;
      greenSqueakQueued = false;
      return squeaked;
    },
    setBlueVisible(visible: boolean): void {
      blueRoot.visible = visible;
    },
    setGreenVisible(visible: boolean): void {
      greenRoot.visible = visible;
    },
    beginBlueJumpscareView(parent: Object3D): void {
      beginBlueJumpscareView(parent);
    },
    beginGreenJumpscareView(parent: Object3D): void {
      beginGreenJumpscareView(parent);
    },
    updateBlueJumpscareView(progress: number): void {
      updateBlueJumpscareView(progress);
    },
    updateGreenJumpscareView(progress: number): void {
      updateGreenJumpscareView(progress);
    },
    endBlueJumpscareView(): void {
      endBlueJumpscareView();
    },
    endGreenJumpscareView(): void {
      endGreenJumpscareView();
    },
    update(deltaSeconds: number, playerState?: ChapterFourPlayerState): void {
      basementMistTime += deltaSeconds;
      blueAnimationTime += deltaSeconds;
      greenAnimationTime += deltaSeconds;
      greenSenseCooldown = Math.max(0, greenSenseCooldown - deltaSeconds);
      greenTouchCooldown = Math.max(0, greenTouchCooldown - deltaSeconds);
      greenSqueakCooldown = Math.max(0, greenSqueakCooldown - deltaSeconds);
      blueGroupRetargetCooldown = Math.max(0, blueGroupRetargetCooldown - deltaSeconds);
      greenGroupRetargetCooldown = Math.max(0, greenGroupRetargetCooldown - deltaSeconds);
      const playerPosition = playerState?.position;
      const playerCrouching = playerState?.crouching ?? false;

      if (playerPosition) {
        blueFootstepsAudible = Math.hypot(playerPosition.x - bluePosition.x, playerPosition.z - bluePosition.z) <= 13.5;
        const playerInMistArea = isInsideMistArea(playerPosition);
        const distanceToPlayer = Math.hypot(
          playerPosition.x - mistHandPatrolPosition.x,
          playerPosition.z - mistHandPatrolPosition.z,
        );
        if (playerInMistArea && playerCrouching) {
          mistHandsChasing = false;
        } else if (playerInMistArea) {
          mistHandsChasing = true;
        } else if (!playerInMistArea || distanceToPlayer > 7) {
          mistHandsChasing = false;
        }
      } else {
        blueFootstepsAudible = false;
        mistHandsChasing = false;
      }

      let blueMoving = false;
      if (playerState) {
        const playerHiddenFromBlue = isPlayerHiddenFromBlue(playerState);
        const blueSeesPlayer = !playerHiddenFromBlue && canBlueSeePlayer(playerState.position);
        if (blueSeesPlayer) {
          if (!blueChasing) {
            blueRoarQueued = true;
          }
          blueChasing = true;
          blueTarget.copy(playerState.position);
          if (hasClearBluePath(bluePosition, blueTarget)) {
            blueDetourNodeIndex = null;
          }
        } else if (blueChasing) {
          if (playerHiddenFromBlue) {
            blueChasing = false;
            blueDetourNodeIndex = null;
          } else {
            blueTarget.copy(playerState.position);
          }
        }
      } else {
        blueChasing = false;
      }

      openDoorsNearBlue();
      if (blueChasing) {
        const chaseTarget = blueDetourNodeIndex !== null
          ? blueNavNodes[blueDetourNodeIndex].position
          : blueTarget;
        blueMoving = moveBlueToward(chaseTarget, GAME_CONFIG.player.sprintSpeed * 0.86, deltaSeconds);
        openDoorsNearBlue();
        if (blueDetourNodeIndex !== null && Math.hypot(bluePosition.x - chaseTarget.x, bluePosition.z - chaseTarget.z) < 0.48) {
          blueDetourNodeIndex = null;
        }
      } else {
        blueDetourNodeIndex = null;
        bluePatrolRetargetTimer -= deltaSeconds;
        if (bluePatrolRetargetTimer <= 0) {
          if (blueGroupRetargetCooldown <= 0 && Math.random() < 0.22) {
            bluePatrolIndex = getNearestBlueNavNode(greenPosition, false);
            blueGroupRetargetCooldown = 9.5 + Math.random() * 6.5;
          } else {
            bluePatrolIndex = getRandomBlueRoamNodeIndex(bluePatrolIndex);
          }
          bluePatrolRetargetTimer = 4.2 + Math.random() * 3.4;
        }
        const patrolTarget = blueNavNodes[bluePatrolIndex].position;
        blueMoving = moveBlueToward(patrolTarget, 1.32, deltaSeconds);
        openDoorsNearBlue();
        if (Math.hypot(bluePosition.x - patrolTarget.x, bluePosition.z - patrolTarget.z) < 0.48) {
          bluePatrolIndex = getRandomBlueRoamNodeIndex(bluePatrolIndex);
          bluePatrolRetargetTimer = 3.2 + Math.random() * 2.8;
        }
      }
      const blueMoveDistance = Math.hypot(bluePosition.x - blueLastPosition.x, bluePosition.z - blueLastPosition.z);
      const blueWantedTarget = blueChasing && blueDetourNodeIndex !== null
        ? blueNavNodes[blueDetourNodeIndex].position
        : blueChasing
          ? blueTarget
          : blueNavNodes[bluePatrolIndex].position;
      const blueWantedDistance = Math.hypot(blueWantedTarget.x - bluePosition.x, blueWantedTarget.z - bluePosition.z);
      blueStuckTimer = blueWantedDistance > 0.75 && blueMoveDistance < 0.012
        ? blueStuckTimer + deltaSeconds
        : 0;
      if (blueStuckTimer > 0.75) {
        assignBlueDetour(blueWantedTarget);
        blueMoving = false;
      }
      blueLastPosition.copy(bluePosition);
      updateBlueAnimation(blueMoving);

      let greenMoving = false;
      if (playerState) {
        const distanceToGreen = Math.hypot(playerState.position.x - greenPosition.x, playerState.position.z - greenPosition.z);
        const greenSqueakRange = 22;
        if (distanceToGreen <= greenSqueakRange && greenSqueakCooldown <= 0) {
          greenSqueakQueued = true;
          greenSqueakCooldown = MathUtils.lerp(3.6, 0.95, MathUtils.clamp((greenSqueakRange - distanceToGreen) / greenSqueakRange, 0, 1));
        }

        const noiseLevel = playerState.noiseLevel ?? 0;
        const greenHearingRange = MathUtils.lerp(4.5, 14.5, MathUtils.clamp(noiseLevel, 0, 1));
        if (
          noiseLevel > 0.08
          && distanceToGreen <= greenHearingRange
          && greenSenseCooldown <= 0
          && !isPlayerProtectedFromGreen(playerState)
        ) {
          greenTarget.copy(playerState.position);
          greenInvestigating = true;
          greenLostNoiseTimer = 0;
          greenSenseQueued = true;
          greenSenseCooldown = 2.5;
        }

        const greenArmTouch = isGreenArmTouchingPlayer(playerState);
        const greenFeelsBox = playerState.boxActive && greenArmTouch;
        const greenTouchesPlayer = !playerState.boxActive && greenArmTouch;

        if (greenFeelsBox && greenTouchCooldown <= 0) {
          greenBoxGrabQueued = true;
          greenTouchCooldown = 2.4;
        } else if (greenTouchesPlayer && greenTouchCooldown <= 0) {
          greenTouchQueued = true;
          greenTouchCooldown = 2.4;
        }

        if (greenInvestigating) {
          greenLostNoiseTimer += deltaSeconds;
          if (greenLostNoiseTimer > 4.4 && Math.hypot(greenPosition.x - greenTarget.x, greenPosition.z - greenTarget.z) < 0.8) {
            greenInvestigating = false;
            greenLostNoiseTimer = 0;
          }
        }
      } else {
        greenInvestigating = false;
        greenLostNoiseTimer = 0;
      }

      openDoorsNearGreen();
      if (greenInvestigating) {
        const investigateTarget = greenDetourNodeIndex !== null
          ? blueNavNodes[greenDetourNodeIndex].position
          : greenTarget;
        greenMoving = moveGreenToward(investigateTarget, 1.28, deltaSeconds);
        openDoorsNearGreen();
        if (greenDetourNodeIndex !== null && Math.hypot(greenPosition.x - investigateTarget.x, greenPosition.z - investigateTarget.z) < 0.48) {
          greenDetourNodeIndex = null;
        }
      } else {
        greenDetourNodeIndex = null;
        greenPatrolRetargetTimer -= deltaSeconds;
        if (greenPatrolRetargetTimer <= 0) {
          if (greenGroupRetargetCooldown <= 0 && Math.random() < 0.3) {
            greenPatrolIndex = Math.random() < 0.65
              ? getNearestGreenNavNode(bluePosition, false)
              : getRandomNodeIndex([24, 25, 26, 27, 28, 29] as const, greenPatrolIndex);
            greenGroupRetargetCooldown = 8 + Math.random() * 7;
          } else {
            greenPatrolIndex = getRandomGreenRoamNodeIndex(greenPatrolIndex);
          }
          greenPatrolRetargetTimer = 3.4 + Math.random() * 3.2;
        }
        const patrolTarget = blueNavNodes[greenPatrolIndex].position;
        greenMoving = moveGreenToward(patrolTarget, 0.96, deltaSeconds);
        openDoorsNearGreen();
        if (Math.hypot(greenPosition.x - patrolTarget.x, greenPosition.z - patrolTarget.z) < 0.55) {
          greenPatrolIndex = getRandomGreenRoamNodeIndex(greenPatrolIndex);
          greenPatrolRetargetTimer = 2.8 + Math.random() * 2.8;
        }
      }

      const greenMoveDistance = Math.hypot(greenPosition.x - greenLastPosition.x, greenPosition.z - greenLastPosition.z);
      const greenWantedTarget = greenInvestigating && greenDetourNodeIndex !== null
        ? blueNavNodes[greenDetourNodeIndex].position
        : greenInvestigating
          ? greenTarget
          : blueNavNodes[greenPatrolIndex].position;
      const greenWantedDistance = Math.hypot(greenWantedTarget.x - greenPosition.x, greenWantedTarget.z - greenPosition.z);
      greenStuckTimer = greenWantedDistance > 0.8 && greenMoveDistance < 0.01
        ? greenStuckTimer + deltaSeconds
        : 0;
      if (greenStuckTimer > 0.85) {
        if (!steerGreenAroundImmediateObstacle(greenWantedTarget)) {
          assignGreenDetour(greenWantedTarget);
        }
        greenPatrolRetargetTimer = 0.2;
        greenMoving = false;
      }
      greenLastPosition.copy(greenPosition);
      updateGreenAnimation(greenMoving);

      const moveTarget = mistHandPatrolPath[mistHandPatrolTargetIndex];
      let targetX = moveTarget.x;
      let targetZ = moveTarget.z;
      let moveSpeed = 1.18;
      if (mistHandsChasing && playerPosition) {
        targetX = MathUtils.clamp(playerPosition.x, mistHallWestX + 0.75, mistHallEastX - 0.75);
        targetZ = MathUtils.clamp(playerPosition.z, mistHallNorthZ + 0.75, mistHallSouthZ - 0.75);
        if (
          targetX >= mistPlatformMinX - 0.4
          && targetX <= mistPlatformMaxX + 0.4
          && targetZ >= mistPlatformMinZ - 0.4
          && targetZ <= mistPlatformMaxZ + 0.4
        ) {
          targetZ = mistPlatformMinZ - 0.55;
        }
        moveSpeed = 2.35;
      }

      const toTargetX = targetX - mistHandPatrolPosition.x;
      const toTargetZ = targetZ - mistHandPatrolPosition.z;
      const targetDistance = Math.hypot(toTargetX, toTargetZ);
      if (targetDistance > 0.001) {
        const moveDistance = Math.min(targetDistance, moveSpeed * deltaSeconds);
        mistHandPatrolPosition.x += (toTargetX / targetDistance) * moveDistance;
        mistHandPatrolPosition.z += (toTargetZ / targetDistance) * moveDistance;
      }

      if (!mistHandsChasing && targetDistance < 0.14) {
        mistHandPatrolTargetIndex += mistHandPatrolDirection;
        if (mistHandPatrolTargetIndex >= mistHandPatrolPath.length) {
          mistHandPatrolTargetIndex = mistHandPatrolPath.length - 2;
          mistHandPatrolDirection = -1;
        } else if (mistHandPatrolTargetIndex < 0) {
          mistHandPatrolTargetIndex = 1;
          mistHandPatrolDirection = 1;
        }
      }

      basementMistHands.forEach((hand) => {
        hand.root.position.x = mistHandPatrolPosition.x + hand.offsetX + Math.sin(basementMistTime * 2.1 + hand.phase) * 0.06;
        hand.root.position.z = mistHandPatrolPosition.z + hand.offsetZ + Math.cos(basementMistTime * 1.8 + hand.phase) * 0.06;
        hand.root.rotation.z = Math.sin(basementMistTime * 1.45 + hand.phase) * 0.18;
        hand.root.rotation.y = Math.atan2(toTargetX, toTargetZ) + Math.cos(basementMistTime * 1.05 + hand.phase) * 0.1;
      });

      doors.forEach((door) => {
        const blueTouchingDoor = door.mode === 'push' && isBlueNearDoor(door);
        const greenTouchingDoor = door.mode === 'push' && isAgentNearDoor(greenPosition, door, 1.35, 1.65);
        const aiHoldingDoor = blueTouchingDoor
          || greenTouchingDoor
          || (door.mode === 'push'
            && door.targetOpenAmount > 0.5
            && (isAgentNearDoor(bluePosition, door, 2.9, 2.6) || isAgentNearDoor(greenPosition, door, 3.2, 2.8)));
        if (door.mode === 'push' && (playerPosition || aiHoldingDoor)) {
          const alongDoor = door.spanAxis === 'x'
            ? Math.abs((playerPosition?.x ?? Infinity) - door.interactPosition.x)
            : Math.abs((playerPosition?.z ?? Infinity) - door.interactPosition.z);
          const intoDoor = door.spanAxis === 'x'
            ? Math.abs((playerPosition?.z ?? Infinity) - door.interactPosition.z)
            : Math.abs((playerPosition?.x ?? Infinity) - door.interactPosition.x);
          const touchingDoor = alongDoor <= door.spanLength / 2 + GAME_CONFIG.player.radius * 0.8
            && intoDoor <= (door.pushRadius ?? 0.6);
          const distance = playerPosition
            ? Math.hypot(playerPosition.x - door.interactPosition.x, playerPosition.z - door.interactPosition.z)
            : Infinity;
          if (touchingDoor || aiHoldingDoor) {
            door.targetOpenAmount = 1;
          } else if (distance > (door.closeRadius ?? 2.35)) {
            door.targetOpenAmount = 0;
          }
        }
        door.openAmount = MathUtils.damp(door.openAmount, door.targetOpenAmount, 8.5, deltaSeconds);
        door.root.rotation.y = MathUtils.lerp(door.closedRotationY, door.openRotationY, door.openAmount);
        door.collider.enabled = door.openAmount < 0.58;
        door.open = door.targetOpenAmount > 0.5;
      });
    },
    reset(): void {
      endBlueJumpscareView();
      endGreenJumpscareView();
      basementMistTime = 0;
      mistHandsChasing = false;
      mistHandPatrolTargetIndex = 1;
      mistHandPatrolDirection = 1;
      mistHandPatrolPosition.copy(mistHandPatrolPath[0]);
      const blueSpawnIndex = 11;
      const blueSpawnPosition = blueNavNodes[blueSpawnIndex].position;
      bluePosition.copy(blueSpawnPosition);
      blueTarget.copy(blueSpawnPosition);
      blueDirection.set(0, 0, -1);
      blueLastPosition.copy(blueSpawnPosition);
      bluePatrolIndex = 4;
      blueChasing = false;
      blueStuckTimer = 0;
      blueAnimationTime = 0;
      blueStepSign = 0;
      blueRoarQueued = false;
      blueStompQueued = false;
      blueFootstepsAudible = false;
      blueDetourNodeIndex = null;
      bluePatrolRetargetTimer = 1.4;
      updateBlueAnimation(false);
      const greenSpawnIndex = 9;
      const greenSpawnPosition = blueNavNodes[greenSpawnIndex].position;
      greenPosition.copy(greenSpawnPosition);
      greenTarget.copy(greenSpawnPosition);
      greenDirection.set(0, 0, 1);
      greenLastPosition.copy(greenSpawnPosition);
      greenPatrolIndex = 10;
      greenInvestigating = false;
      greenLostNoiseTimer = 0;
      greenStuckTimer = 0;
      greenAnimationTime = 0;
      greenSenseQueued = false;
      greenBoxGrabQueued = false;
      greenTouchQueued = false;
      greenSqueakQueued = false;
      greenSenseCooldown = 0;
      greenTouchCooldown = 0;
      greenSqueakCooldown = 0;
      greenDetourNodeIndex = null;
      greenPatrolRetargetTimer = 1.2;
      blueRoot.visible = true;
      greenRoot.visible = true;
      updateGreenAnimation(false);
      doors.forEach((door) => {
        door.open = false;
        door.openAmount = 0;
        door.targetOpenAmount = 0;
        door.root.rotation.y = door.closedRotationY;
        door.collider.enabled = true;
      });
      root.visible = false;
    },
  };
}
