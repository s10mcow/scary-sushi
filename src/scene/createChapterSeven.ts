import {
  BoxGeometry,
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  PointLight,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Vector3,
} from 'three';

import { GAME_CONFIG } from '../config/gameConfig';
import type { CollisionBox } from '../types/world';

export interface ChapterSevenData {
  root: Group;
  colliders: CollisionBox[];
  spawn: Vector3;
  lookTarget: Vector3;
  houseDoor: ChapterSevenHouseDoor;
  houseDoors: ChapterSevenHouseDoor[];
  houseDrawer: ChapterSevenDrawer;
  houseDrawers: ChapterSevenDrawerSlide[];
  houseFridge: ChapterSevenFridge;
  houseUpperCupboard: ChapterSevenCupboard;
  houseUpperCupboards: ChapterSevenCupboard[];
  houseBaseCabinets: ChapterSevenCupboard[];
  houseOven: ChapterSevenOven;
  oldWoodenCloset: ChapterSevenOldWoodenCloset;
  cardboardBox: ChapterSevenCardboardBox;
  kitchenSink: ChapterSevenKitchenSink;
  getSupportedFloorY(position: Vector3, crawling?: boolean): number | null;
  isPlayerUnderBed(position: Vector3): boolean;
  update(deltaSeconds: number, playerPosition?: Vector3): void;
  reset(): void;
}

export interface ChapterSevenHouseDoor {
  label: string;
  interactPosition: Vector3;
  doorPivot: Group;
  slidePanes?: {
    left: Group;
    right: Group;
    leftClosedZ: number;
    rightClosedZ: number;
    slideDistance: number;
  };
  collider: CollisionBox;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
  openDirection: number;
  pushRadius: number;
  interactionMode?: 'push' | 'manual';
}

export interface ChapterSevenDrawer {
  label: string;
  interactPosition: Vector3;
  drawerSlides: ChapterSevenDrawerSlide[];
}

export interface ChapterSevenDrawerSlide {
  label: string;
  interactPosition: Vector3;
  aimPosition: Vector3;
  cookieCount: number;
  root: Group;
  closedZ: number;
  openZ: number;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
}

interface ChapterSevenCounterSurface {
  centerX: number;
  centerZ: number;
  halfWidth: number;
  halfDepth: number;
  floorY: number;
  collider?: CollisionBox;
}

interface ChapterSevenBedSurface extends ChapterSevenCounterSurface {
  collider: CollisionBox;
  label: string;
}

export interface ChapterSevenFridge {
  label: string;
  interactPosition: Vector3;
  aimPosition: Vector3;
  doorPivot: Group;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
}

export interface ChapterSevenCupboard {
  label: string;
  interactPosition: Vector3;
  aimPosition: Vector3;
  doorPivots: Group[];
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
}

export interface ChapterSevenOven {
  label: string;
  interactPosition: Vector3;
  aimPosition: Vector3;
  doorPivot: Group;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
}

export interface ChapterSevenKitchenSink {
  label: string;
  interactPosition: Vector3;
  aimPosition: Vector3;
  handlePivot: Group;
  waterStream: Mesh;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
}

export interface ChapterSevenOldWoodenCloset {
  label: string;
  interactPosition: Vector3;
  aimPosition: Vector3;
  doorPivots: Group[];
  doorCollider: CollisionBox;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
}

export interface ChapterSevenCardboardBox {
  label: string;
  interactPosition: Vector3;
  aimPosition: Vector3;
  flapPivots: {
    front: Group;
    back: Group;
    left: Group;
    right: Group;
  };
  wallColliders: CollisionBox[];
  centerX: number;
  centerZ: number;
  halfWidth: number;
  halfDepth: number;
  wallHeight: number;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
}

const CENTER_X = 1210;
const CENTER_Z = 80;
const FOREST_SIZE = 500;
const HALF_SIZE = FOREST_SIZE / 2;
const CLEARING_RADIUS = 42;
const GRASS_COLOR = 0x3f6f36;
const HOUSE_WIDTH = 52;
const HOUSE_DEPTH = 38;
const HOUSE_HEIGHT = 7.2;
const HOUSE_CENTER_Z = CENTER_Z;
const HOUSE_FRONT_Z = HOUSE_CENTER_Z + HOUSE_DEPTH / 2;
const HOUSE_BACK_Z = HOUSE_CENTER_Z - HOUSE_DEPTH / 2;
const HOUSE_WALL_THICKNESS = 0.62;
const HOUSE_DOOR_WIDTH = 5.2;
const HOUSE_DOOR_HEIGHT = 4;
const HOUSE_ROOM_DOOR_WIDTH = 4.2;
const HOUSE_ROOM_DOOR_HEIGHT = 3.7;
const HOUSE_INTERIOR_WALL_THICKNESS = 0.46;
const HOUSE_LEFT_ROOM_WALL_X = -8;
const HOUSE_FRONT_ROOM_DOOR_Z = 9.6;
const HOUSE_BACK_ROOM_DOOR_Z = -9.6;
const HOUSE_FRONT_ROOM_BACK_Z = 4;
const HOUSE_BACK_ROOM_FRONT_Z = -4;
const HOUSE_MARKER_SHORT_WALL_X = 5.72;
const HOUSE_MARKER_SHORT_WALL_START_Z = -18.69;
const HOUSE_MARKER_SHORT_WALL_LENGTH = 8;
const HOUSE_FRIDGE_X = 7.94;
const HOUSE_FRIDGE_Z = -17.35;
const HOUSE_ROOF_RISE = 6.2;
const HOUSE_ROOF_OVERHANG = 2.2;
const HOUSE_ROOF_THICKNESS = 0.55;
const TREE_COUNT = 600;
const GRASS_PATCH_COUNT = 1050;
const ROCK_COUNT = 34;
const FALLEN_LOG_COUNT = 19;

function addCollider(colliders: CollisionBox[], x: number, z: number, width: number, depth: number): CollisionBox {
  const collider = {
    centerX: x,
    centerZ: z,
    halfWidth: width / 2,
    halfDepth: depth / 2,
  };
  colliders.push(collider);
  return collider;
}

function getRotatedLocalPoint(localX: number, localZ: number, rotationY: number, offsetX: number, offsetZ: number): { x: number; z: number } {
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);
  return {
    x: localX + cos * offsetX + sin * offsetZ,
    z: localZ - sin * offsetX + cos * offsetZ,
  };
}

function addRotatedCollider(
  colliders: CollisionBox[],
  localX: number,
  localZ: number,
  rotationY: number,
  offsetX: number,
  offsetZ: number,
  width: number,
  depth: number,
): CollisionBox {
  const center = getRotatedLocalPoint(localX, localZ, rotationY, offsetX, offsetZ);
  const colliderWidth = Math.abs(Math.cos(rotationY)) * width + Math.abs(Math.sin(rotationY)) * depth;
  const colliderDepth = Math.abs(Math.sin(rotationY)) * width + Math.abs(Math.cos(rotationY)) * depth;
  return addCollider(colliders, CENTER_X + center.x, HOUSE_CENTER_Z + center.z, colliderWidth, colliderDepth);
}

function createRandom(seedStart: number): () => number {
  let seed = seedStart;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function getForestFloorY(): number {
  return 0;
}

function addRock(root: Group, rockMaterial: MeshStandardMaterial, x: number, z: number, scale: number): void {
  const rock = new Mesh(new SphereGeometry(0.55 * scale, 12, 8), rockMaterial);
  rock.position.set(x, getForestFloorY() + 0.22 * scale, z);
  rock.scale.set(1.25, 0.62, 0.9);
  rock.rotation.set(0.12, x * 0.1, -0.08);
  root.add(rock);
}

export function createChapterSeven(): ChapterSevenData {
  const root = new Group();
  root.name = 'Chapter 7: The House';
  const colliders: CollisionBox[] = [];
  const counterSurfaces: ChapterSevenCounterSurface[] = [];
  const bedSurfaces: ChapterSevenBedSurface[] = [];
  let forestTime = 0;

  const random = createRandom(707);
  const groundMaterial = new MeshStandardMaterial({
    color: GRASS_COLOR,
    roughness: 1,
    metalness: 0,
  });
  const clearingMaterial = new MeshStandardMaterial({
    color: GRASS_COLOR,
    emissive: 0x10260a,
    emissiveIntensity: 0.04,
    roughness: 0.94,
    metalness: 0.01,
  });
  const barkMaterial = new MeshStandardMaterial({
    color: 0x5c4532,
    roughness: 0.94,
    metalness: 0.02,
  });
  const leafMaterial = new MeshStandardMaterial({
    color: 0x203d24,
    emissive: 0x10210f,
    emissiveIntensity: 0.04,
    roughness: 0.96,
    metalness: 0.01,
  });
  const grassMaterial = new MeshStandardMaterial({
    color: GRASS_COLOR,
    emissive: 0x101a08,
    emissiveIntensity: 0.04,
    roughness: 0.92,
    metalness: 0.01,
  });
  const rockMaterial = new MeshStandardMaterial({
    color: 0x667064,
    emissive: 0x070909,
    emissiveIntensity: 0.05,
    roughness: 0.84,
    metalness: 0.02,
  });
  const houseWallMaterial = new MeshStandardMaterial({
    color: 0x9b7a55,
    emissive: 0x211408,
    emissiveIntensity: 0.05,
    roughness: 0.88,
    metalness: 0.02,
    side: DoubleSide,
  });
  const houseTrimMaterial = new MeshStandardMaterial({
    color: 0x5f4632,
    emissive: 0x100806,
    emissiveIntensity: 0.05,
    roughness: 0.9,
    metalness: 0.02,
  });
  const whiteFenceMaterial = new MeshStandardMaterial({
    color: 0xf3f3ee,
    emissive: 0x181814,
    emissiveIntensity: 0.04,
    roughness: 0.72,
    metalness: 0.01,
  });
  const houseDoorMaterial = new MeshStandardMaterial({
    color: 0x6e4227,
    emissive: 0x140704,
    emissiveIntensity: 0.05,
    roughness: 0.86,
    metalness: 0.03,
  });
  const slidingGlassMaterial = new MeshStandardMaterial({
    color: 0xb9e2ec,
    emissive: 0x10252b,
    emissiveIntensity: 0.1,
    roughness: 0.08,
    metalness: 0.04,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });
  const houseRoofMaterial = new MeshStandardMaterial({
    color: 0x4d2d22,
    emissive: 0x120605,
    emissiveIntensity: 0.05,
    roughness: 0.9,
    metalness: 0.02,
  });
  const bedFrameMaterial = new MeshStandardMaterial({
    color: 0x5b3b2a,
    emissive: 0x120806,
    emissiveIntensity: 0.04,
    roughness: 0.88,
    metalness: 0.02,
  });
  const mattressMaterial = new MeshStandardMaterial({
    color: 0xe8dfcf,
    emissive: 0x19140f,
    emissiveIntensity: 0.03,
    roughness: 0.82,
    metalness: 0.01,
  });
  const pillowMaterial = new MeshStandardMaterial({
    color: 0xf6efe1,
    emissive: 0x1d1810,
    emissiveIntensity: 0.04,
    roughness: 0.78,
    metalness: 0.01,
  });
  const blanketMaterial = new MeshStandardMaterial({
    color: 0x7b2f2d,
    emissive: 0x180606,
    emissiveIntensity: 0.04,
    roughness: 0.82,
    metalness: 0.01,
  });
  const furnitureWoodMaterial = new MeshStandardMaterial({
    color: 0x6b4a32,
    emissive: 0x130907,
    emissiveIntensity: 0.04,
    roughness: 0.86,
    metalness: 0.02,
  });
  const closetWoodMaterial = new MeshStandardMaterial({
    color: 0x3b2116,
    emissive: 0x080302,
    emissiveIntensity: 0.05,
    roughness: 0.82,
    metalness: 0.02,
  });
  const closetTrimMaterial = new MeshStandardMaterial({
    color: 0x6a452b,
    emissive: 0x100604,
    emissiveIntensity: 0.05,
    roughness: 0.78,
    metalness: 0.03,
  });
  const closetHandleMaterial = new MeshStandardMaterial({
    color: 0xd2b04c,
    emissive: 0x2f2107,
    emissiveIntensity: 0.16,
    roughness: 0.34,
    metalness: 0.46,
  });
  const cardboardMaterial = new MeshStandardMaterial({
    color: 0xc8955c,
    emissive: 0x1a1007,
    emissiveIntensity: 0.04,
    roughness: 0.92,
    metalness: 0.01,
    side: DoubleSide,
  });
  const cardboardEdgeMaterial = new MeshStandardMaterial({
    color: 0xb9824f,
    emissive: 0x160b04,
    emissiveIntensity: 0.035,
    roughness: 0.9,
    metalness: 0.01,
  });
  const cardboardTapeMaterial = new MeshStandardMaterial({
    color: 0x10100f,
    emissive: 0x020202,
    emissiveIntensity: 0.035,
    roughness: 0.58,
    metalness: 0.01,
  });
  const createAmazonTapeLabelMaterial = (): MeshStandardMaterial => {
    if (typeof document === 'undefined') {
      return new MeshStandardMaterial({
        color: 0x0d1012,
        roughness: 0.58,
        metalness: 0.01,
      });
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#10100f';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#35a9ff';
      context.font = 'bold 38px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('Amazon', 128, 44);
      context.strokeStyle = '#35a9ff';
      context.lineWidth = 8;
      context.beginPath();
      context.moveTo(66, 86);
      context.quadraticCurveTo(128, 116, 194, 86);
      context.stroke();
      context.beginPath();
      context.moveTo(194, 86);
      context.lineTo(174, 78);
      context.lineTo(181, 100);
      context.closePath();
      context.fill();
    }
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return new MeshStandardMaterial({
      map: texture,
      roughness: 0.62,
      metalness: 0.01,
    });
  };
  const amazonTapeLabelMaterial = createAmazonTapeLabelMaterial();
  const plantPotMaterial = new MeshStandardMaterial({
    color: 0x8b4a31,
    emissive: 0x160705,
    emissiveIntensity: 0.04,
    roughness: 0.84,
    metalness: 0.02,
  });
  const plantLeafMaterial = new MeshStandardMaterial({
    color: 0x2f6f3c,
    emissive: 0x071408,
    emissiveIntensity: 0.08,
    roughness: 0.78,
    metalness: 0.01,
  });
  const chairCushionMaterial = new MeshStandardMaterial({
    color: 0x8f6b4b,
    emissive: 0x160d08,
    emissiveIntensity: 0.04,
    roughness: 0.82,
    metalness: 0.01,
  });
  const yellowCouchMaterial = new MeshStandardMaterial({
    color: 0xd4a82f,
    emissive: 0x211506,
    emissiveIntensity: 0.05,
    roughness: 0.86,
    metalness: 0.01,
  });
  const bookMaterials = [
    new MeshStandardMaterial({ color: 0x2e5f9e, roughness: 0.74, metalness: 0.02 }),
    new MeshStandardMaterial({ color: 0x8d2f2f, roughness: 0.78, metalness: 0.02 }),
    new MeshStandardMaterial({ color: 0x2e7546, roughness: 0.78, metalness: 0.02 }),
    new MeshStandardMaterial({ color: 0xc29b3d, roughness: 0.72, metalness: 0.02 }),
    new MeshStandardMaterial({ color: 0x60418e, roughness: 0.76, metalness: 0.02 }),
  ];
  const fridgeMaterial = new MeshStandardMaterial({
    color: 0xd8dedc,
    emissive: 0x101414,
    emissiveIntensity: 0.04,
    roughness: 0.62,
    metalness: 0.12,
  });
  const fridgeInteriorMaterial = new MeshStandardMaterial({
    color: 0xf4f8f7,
    emissive: 0x152020,
    emissiveIntensity: 0.06,
    roughness: 0.7,
    metalness: 0.04,
  });
  const fridgeSealMaterial = new MeshStandardMaterial({
    color: 0x4c5552,
    emissive: 0x060808,
    emissiveIntensity: 0.04,
    roughness: 0.78,
    metalness: 0.02,
  });
  const milkMaterial = new MeshStandardMaterial({ color: 0xf8fbf2, roughness: 0.65, metalness: 0.02 });
  const milkLabelMaterial = new MeshStandardMaterial({ color: 0x5186c8, roughness: 0.68, metalness: 0.02 });
  const appleMaterial = new MeshStandardMaterial({ color: 0xb3312a, roughness: 0.75, metalness: 0.01 });
  const orangeMaterial = new MeshStandardMaterial({ color: 0xd87924, roughness: 0.78, metalness: 0.01 });
  const cookieBoxMaterial = new MeshStandardMaterial({ color: 0xc7964a, roughness: 0.8, metalness: 0.02 });
  const cookieMaterial = new MeshStandardMaterial({ color: 0xb88750, roughness: 0.82, metalness: 0.01 });
  const chocolateChipMaterial = new MeshStandardMaterial({ color: 0x352018, roughness: 0.78, metalness: 0.01 });
  const counterTopMaterial = new MeshStandardMaterial({
    color: 0x6f7470,
    emissive: 0x0b0d0c,
    emissiveIntensity: 0.04,
    roughness: 0.58,
    metalness: 0.08,
  });
  const sinkBasinMaterial = new MeshStandardMaterial({
    color: 0xd3d8d5,
    emissive: 0x101414,
    emissiveIntensity: 0.05,
    roughness: 0.36,
    metalness: 0.22,
  });
  const faucetMaterial = new MeshStandardMaterial({
    color: 0xc8d1d4,
    emissive: 0x0c1112,
    emissiveIntensity: 0.06,
    roughness: 0.28,
    metalness: 0.46,
  });
  const faucetWaterMaterial = new MeshStandardMaterial({
    color: 0x89d6ff,
    emissive: 0x1c8dcc,
    emissiveIntensity: 0.3,
    roughness: 0.18,
    metalness: 0.02,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
  });
  const cabinetMaterial = new MeshStandardMaterial({
    color: 0x7a5336,
    emissive: 0x120807,
    emissiveIntensity: 0.04,
    roughness: 0.82,
    metalness: 0.02,
  });
  const stoveMaterial = new MeshStandardMaterial({
    color: 0xc7cbc8,
    emissive: 0x101414,
    emissiveIntensity: 0.04,
    roughness: 0.56,
    metalness: 0.18,
  });
  const stoveGlassMaterial = new MeshStandardMaterial({
    color: 0x182024,
    emissive: 0x070a0c,
    emissiveIntensity: 0.08,
    roughness: 0.5,
    metalness: 0.04,
  });

  const ground = new Mesh(new PlaneGeometry(FOREST_SIZE, FOREST_SIZE, 16, 16), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(CENTER_X, 0, CENTER_Z);
  root.add(ground);

  const clearing = new Mesh(new CylinderGeometry(CLEARING_RADIUS, CLEARING_RADIUS, 0.18, 56), clearingMaterial);
  clearing.position.set(CENTER_X, 0.04, CENTER_Z + 4);
  root.add(clearing);

  const house = new Group();
  house.name = 'Chapter 7 Big Clearing House';
  house.position.set(CENTER_X, 0, HOUSE_CENTER_Z);

  const floor = new Mesh(new BoxGeometry(HOUSE_WIDTH + 1.2, 0.16, HOUSE_DEPTH + 1.2), houseTrimMaterial);
  floor.position.y = 0.08;
  house.add(floor);

  const addHouseWall = (localX: number, localZ: number, width: number, depth: number, height = HOUSE_HEIGHT): void => {
    const wall = new Mesh(new BoxGeometry(width, height, depth), houseWallMaterial);
    wall.position.set(localX, height / 2, localZ);
    house.add(wall);
    addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, width, depth);
  };

  const addHouseWallVisualSegment = (
    localX: number,
    localZ: number,
    centerY: number,
    width: number,
    height: number,
    depth: number,
  ): void => {
    if (width <= 0.04 || height <= 0.04) {
      return;
    }

    const wall = new Mesh(new BoxGeometry(width, height, depth), houseWallMaterial);
    wall.position.set(localX, centerY, localZ);
    house.add(wall);
  };

  const addExteriorWallWithOpenings = (
    localZ: number,
    openings: Array<{ centerX: number; centerY: number; width: number; height: number }>,
  ): void => {
    const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
    const xMin = -HOUSE_WIDTH / 2;
    const xMax = HOUSE_WIDTH / 2;
    const yMin = 0;
    const yMax = HOUSE_HEIGHT;
    const clampedOpenings = openings.map((opening) => {
      const halfWidth = opening.width / 2;
      const halfHeight = opening.height / 2;
      return {
        xMin: clamp(opening.centerX - halfWidth, xMin, xMax),
        xMax: clamp(opening.centerX + halfWidth, xMin, xMax),
        yMin: clamp(opening.centerY - halfHeight, yMin, yMax),
        yMax: clamp(opening.centerY + halfHeight, yMin, yMax),
      };
    }).filter((opening) => opening.xMax > opening.xMin && opening.yMax > opening.yMin);
    const uniqueSorted = (values: number[]): number[] => Array.from(new Set(values.map((value) => Number(value.toFixed(4))))).sort((a, b) => a - b);
    const xBreaks = uniqueSorted([
      xMin,
      xMax,
      ...clampedOpenings.flatMap((opening) => [opening.xMin, opening.xMax]),
    ]);
    const yBreaks = uniqueSorted([
      yMin,
      yMax,
      ...clampedOpenings.flatMap((opening) => [opening.yMin, opening.yMax]),
    ]);

    for (let xIndex = 0; xIndex < xBreaks.length - 1; xIndex += 1) {
      const segmentXMin = xBreaks[xIndex];
      const segmentXMax = xBreaks[xIndex + 1];
      const centerX = (segmentXMin + segmentXMax) / 2;
      const width = segmentXMax - segmentXMin;
      for (let yIndex = 0; yIndex < yBreaks.length - 1; yIndex += 1) {
        const segmentYMin = yBreaks[yIndex];
        const segmentYMax = yBreaks[yIndex + 1];
        const centerY = (segmentYMin + segmentYMax) / 2;
        const height = segmentYMax - segmentYMin;
        const insideOpening = clampedOpenings.some((opening) => (
          centerX > opening.xMin
          && centerX < opening.xMax
          && centerY > opening.yMin
          && centerY < opening.yMax
        ));
        if (!insideOpening) {
          addHouseWallVisualSegment(centerX, localZ, centerY, width, height, HOUSE_WALL_THICKNESS);
        }
      }
    }
  };

  const addWallWindow = (
    localX: number,
    localZ: number,
    centerY: number,
    width: number,
    height: number,
  ): void => {
    const window = new Group();
    window.position.set(localX, centerY, localZ);

    const glass = new Mesh(new BoxGeometry(width, height, 0.055), slidingGlassMaterial);
    const trimTop = new Mesh(new BoxGeometry(width + 0.28, 0.16, 0.12), houseTrimMaterial);
    trimTop.position.y = height / 2 + 0.08;
    const trimBottom = trimTop.clone();
    trimBottom.position.y = -height / 2 - 0.08;
    const trimLeft = new Mesh(new BoxGeometry(0.16, height + 0.28, 0.12), houseTrimMaterial);
    trimLeft.position.x = -width / 2 - 0.08;
    const trimRight = trimLeft.clone();
    trimRight.position.x = width / 2 + 0.08;
    const centerMullion = new Mesh(new BoxGeometry(0.1, height * 0.92, 0.14), houseTrimMaterial);
    const centerRail = new Mesh(new BoxGeometry(width * 0.9, 0.1, 0.14), houseTrimMaterial);
    const sill = new Mesh(new BoxGeometry(width + 0.56, 0.18, 0.28), houseTrimMaterial);
    sill.position.y = -height / 2 - 0.24;

    window.add(glass, trimTop, trimBottom, trimLeft, trimRight, centerMullion, centerRail, sill);
    house.add(window);
  };

  const createHouseDoor = (
    label: string,
    orientation: 'front' | 'side',
    localPivotX: number,
    localPivotZ: number,
    width: number,
    height: number,
    colliderLocalX: number,
    colliderLocalZ: number,
    colliderWidth: number,
    colliderDepth: number,
    interactLocalX: number,
    interactLocalZ: number,
    openDirection: number,
  ): ChapterSevenHouseDoor => {
    const doorPivot = new Group();
    doorPivot.position.set(localPivotX, 0, localPivotZ);
    const doorPanel = orientation === 'front'
      ? new Mesh(new BoxGeometry(width, height, 0.22), houseDoorMaterial)
      : new Mesh(new BoxGeometry(0.22, height, width), houseDoorMaterial);
    doorPanel.position.set(
      orientation === 'front' ? width / 2 : 0,
      height / 2,
      orientation === 'front' ? 0 : width / 2,
    );
    const doorHandle = new Mesh(new CylinderGeometry(0.09, 0.09, 0.24, 10), houseTrimMaterial);
    doorHandle.position.set(
      orientation === 'front' ? width - 0.55 : 0.18,
      height * 0.52,
      orientation === 'front' ? 0.18 : width - 0.55,
    );
    if (orientation === 'front') {
      doorHandle.rotation.x = Math.PI / 2;
    } else {
      doorHandle.rotation.z = Math.PI / 2;
    }
    doorPivot.add(doorPanel, doorHandle);
    house.add(doorPivot);

    const collider: CollisionBox = {
      centerX: CENTER_X + colliderLocalX,
      centerZ: HOUSE_CENTER_Z + colliderLocalZ,
      halfWidth: colliderWidth / 2,
      halfDepth: colliderDepth / 2,
    };
    colliders.push(collider);

    return {
      label,
      interactPosition: new Vector3(CENTER_X + interactLocalX, GAME_CONFIG.player.height, HOUSE_CENTER_Z + interactLocalZ),
      doorPivot,
      collider,
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
      openDirection,
      pushRadius: orientation === 'front' ? 4.9 : 3.7,
      interactionMode: 'push',
    };
  };

  const createSlidingGlassDoor = (
    label: string,
    localX: number,
    localZ: number,
    width: number,
    height: number,
  ): ChapterSevenHouseDoor => {
    const doorRoot = new Group();
    doorRoot.position.set(localX, 0, localZ);

    const paneWidth = width / 2 + 0.16;
    const paneThickness = 0.12;
    const frameThickness = 0.16;
    const leftPane = new Group();
    const rightPane = new Group();
    const leftClosedZ = -width / 4;
    const rightClosedZ = width / 4;
    leftPane.position.z = leftClosedZ;
    rightPane.position.z = rightClosedZ;

    const makePane = (side: -1 | 1): Group => {
      const pane = side < 0 ? leftPane : rightPane;
      const glass = new Mesh(new BoxGeometry(paneThickness, height - 0.44, paneWidth - 0.32), slidingGlassMaterial);
      glass.position.y = height / 2;
      const leftFrame = new Mesh(new BoxGeometry(frameThickness, height, frameThickness), houseTrimMaterial);
      leftFrame.position.set(0, height / 2, -paneWidth / 2);
      const rightFrame = leftFrame.clone();
      rightFrame.position.z = paneWidth / 2;
      const topFrame = new Mesh(new BoxGeometry(frameThickness, frameThickness, paneWidth), houseTrimMaterial);
      topFrame.position.set(0, height - frameThickness / 2, 0);
      const bottomFrame = topFrame.clone();
      bottomFrame.position.y = frameThickness / 2;
      const handle = new Mesh(new BoxGeometry(0.18, 1.05, 0.12), houseDoorMaterial);
      handle.position.set(-0.12, height * 0.52, side < 0 ? paneWidth / 2 - 0.34 : -paneWidth / 2 + 0.34);
      pane.add(glass, leftFrame, rightFrame, topFrame, bottomFrame, handle);
      return pane;
    };

    makePane(-1);
    makePane(1);

    const topTrack = new Mesh(new BoxGeometry(0.22, 0.22, width + 0.72), houseTrimMaterial);
    topTrack.position.set(0, height + 0.06, 0);
    const bottomTrack = new Mesh(new BoxGeometry(0.22, 0.16, width + 0.72), houseTrimMaterial);
    bottomTrack.position.set(0, 0.08, 0);
    const leftJamb = new Mesh(new BoxGeometry(0.24, height + 0.18, 0.2), houseTrimMaterial);
    leftJamb.position.set(0, height / 2, -width / 2 - 0.16);
    const rightJamb = leftJamb.clone();
    rightJamb.position.z = width / 2 + 0.16;

    doorRoot.add(leftPane, rightPane, topTrack, bottomTrack, leftJamb, rightJamb);
    house.add(doorRoot);

    const collider: CollisionBox = {
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: HOUSE_WALL_THICKNESS / 2,
      halfDepth: width / 2,
    };
    colliders.push(collider);

    return {
      label,
      interactPosition: new Vector3(CENTER_X + localX - 2.4, GAME_CONFIG.player.height, HOUSE_CENTER_Z + localZ),
      doorPivot: doorRoot,
      slidePanes: {
        left: leftPane,
        right: rightPane,
        leftClosedZ,
        rightClosedZ,
        slideDistance: width * 0.33,
      },
      collider,
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
      openDirection: 1,
      pushRadius: 4.6,
      interactionMode: 'manual',
    };
  };

  const addBed = (localX: number, localZ: number, headDirection: 1 | -1, label: string): void => {
    const bed = new Group();
    bed.position.set(localX, 0, localZ);

    const sideRailLeft = new Mesh(new BoxGeometry(0.24, 0.32, 6.52), bedFrameMaterial);
    sideRailLeft.position.set(-1.92, 0.78, 0);
    const sideRailRight = sideRailLeft.clone();
    sideRailRight.position.x = 1.92;
    const footRail = new Mesh(new BoxGeometry(3.9, 0.3, 0.24), bedFrameMaterial);
    footRail.position.set(0, 0.78, -headDirection * 3.14);
    const headboard = new Mesh(new BoxGeometry(4.1, 1.58, 0.28), bedFrameMaterial);
    headboard.position.set(0, 0.86, headDirection * 3.24);
    const footboard = new Mesh(new BoxGeometry(4.02, 0.82, 0.24), bedFrameMaterial);
    footboard.position.set(0, 0.5, -headDirection * 3.24);
    const headboardTop = new Mesh(new BoxGeometry(4.28, 0.18, 0.36), furnitureWoodMaterial);
    headboardTop.position.set(0, 1.68, headDirection * 3.24);

    const slats = [-2.34, -1.56, -0.78, 0, 0.78, 1.56, 2.34].map((slatZ) => {
      const slat = new Mesh(new BoxGeometry(3.42, 0.08, 0.2), furnitureWoodMaterial);
      slat.position.set(0, 0.93, slatZ);
      return slat;
    });

    const mattress = new Mesh(new BoxGeometry(3.48, 0.38, 6.08), mattressMaterial);
    mattress.position.y = 1.18;
    const blanket = new Mesh(new BoxGeometry(3.52, 0.2, 3.46), blanketMaterial);
    blanket.position.set(0, 1.42, -headDirection * 0.72);
    const pillowLeft = new Mesh(new BoxGeometry(1.35, 0.28, 0.92), pillowMaterial);
    pillowLeft.position.set(-0.74, 1.56, headDirection * 2.42);
    const pillowRight = new Mesh(new BoxGeometry(1.35, 0.28, 0.92), pillowMaterial);
    pillowRight.position.set(0.74, 1.56, headDirection * 2.42);

    const legOffsets: Array<[number, number]> = [
      [-1.58, -2.84],
      [1.58, -2.84],
      [-1.58, 2.84],
      [1.58, 2.84],
    ];
    const legs = legOffsets.map(([legX, legZ]) => {
      const leg = new Mesh(new BoxGeometry(0.34, 0.86, 0.34), bedFrameMaterial);
      leg.position.set(legX, 0.43, legZ);
      return leg;
    });

    bed.add(
      sideRailLeft,
      sideRailRight,
      footRail,
      headboard,
      footboard,
      headboardTop,
      ...slats,
      mattress,
      blanket,
      pillowLeft,
      pillowRight,
      ...legs,
    );
    house.add(bed);
    const collider = {
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: 3.9 / 2,
      halfDepth: 6.7 / 2,
    };
    colliders.push(collider);
    bedSurfaces.push({
      label,
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: 3.45 / 2,
      halfDepth: 6.05 / 2,
      floorY: 1.38,
      collider,
    });
  };

  const addChair = (localX: number, localZ: number, rotationY: number): void => {
    const chair = new Group();
    chair.position.set(localX, 0, localZ);
    chair.rotation.y = rotationY;

    const seat = new Mesh(new BoxGeometry(0.78, 0.22, 0.72), chairCushionMaterial);
    seat.position.y = 0.58;
    const back = new Mesh(new BoxGeometry(0.84, 0.92, 0.16), furnitureWoodMaterial);
    back.position.set(0, 1.02, -0.34);
    const legs = [
      [-0.28, -0.24],
      [0.28, -0.24],
      [-0.28, 0.24],
      [0.28, 0.24],
    ].map(([legX, legZ]) => {
      const leg = new Mesh(new BoxGeometry(0.1, 0.56, 0.1), furnitureWoodMaterial);
      leg.position.set(legX, 0.28, legZ);
      return leg;
    });

    chair.add(seat, back, ...legs);
    house.add(chair);
    addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, 0.92, 0.92);
  };

  const addYellowCouch = (localX: number, localZ: number, rotationY = 0): void => {
    const couch = new Group();
    couch.position.set(localX, 0, localZ);
    couch.rotation.y = rotationY;

    const length = 6.8;
    const depth = 1.82;
    const base = new Mesh(new BoxGeometry(length, 0.34, depth), yellowCouchMaterial);
    base.position.y = 0.44;
    const seatOffsets = [-2.18, 0, 2.18];
    const seats = seatOffsets.map((seatX) => {
      const cushion = new Mesh(new BoxGeometry(2.04, 0.24, 1.2), yellowCouchMaterial);
      cushion.position.set(seatX, 0.72, -0.2);
      return cushion;
    });
    const back = new Mesh(new BoxGeometry(length + 0.18, 1.18, 0.32), yellowCouchMaterial);
    back.position.set(0, 1.05, 0.88);
    const backCushions = seatOffsets.map((seatX) => {
      const cushion = new Mesh(new BoxGeometry(1.98, 0.78, 0.18), yellowCouchMaterial);
      cushion.position.set(seatX, 1.08, 0.68);
      cushion.rotation.x = -0.1;
      return cushion;
    });
    const leftArm = new Mesh(new BoxGeometry(0.42, 1.06, depth + 0.08), yellowCouchMaterial);
    leftArm.position.set(-length / 2 - 0.2, 0.82, 0);
    const rightArm = leftArm.clone();
    rightArm.position.x = length / 2 + 0.2;
    const frontLip = new Mesh(new BoxGeometry(length, 0.18, 0.22), furnitureWoodMaterial);
    frontLip.position.set(0, 0.54, -depth / 2 - 0.04);
    const legs = [
      [-2.95, -0.72],
      [2.95, -0.72],
      [-2.95, 0.64],
      [2.95, 0.64],
    ].map(([legX, legZ]) => {
      const leg = new Mesh(new BoxGeometry(0.22, 0.36, 0.22), furnitureWoodMaterial);
      leg.position.set(legX, 0.18, legZ);
      return leg;
    });

    couch.add(base, ...seats, back, ...backCushions, leftArm, rightArm, frontLip, ...legs);
    house.add(couch);
    addRotatedFurnitureCollider(localX, localZ, length + 0.84, depth + 0.18, rotationY);
  };

  const addDiningTable = (localX: number, localZ: number): void => {
    const table = new Group();
    table.position.set(localX, 0, localZ);

    const top = new Mesh(new BoxGeometry(5, 0.36, 2.35), furnitureWoodMaterial);
    top.position.y = 1.35;
    const legOffsets: Array<[number, number]> = [
      [-2.12, -0.88],
      [2.12, -0.88],
      [-2.12, 0.88],
      [2.12, 0.88],
    ];
    const legs = legOffsets.map(([legX, legZ]) => {
      const leg = new Mesh(new BoxGeometry(0.28, 1.32, 0.28), furnitureWoodMaterial);
      leg.position.set(legX, 0.66, legZ);
      return leg;
    });

    table.add(top, ...legs);
    house.add(table);
    addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, 5.1, 2.45);

    addChair(localX, localZ - 2.25, 0);
    addChair(localX, localZ + 2.25, Math.PI);
    addChair(localX - 3, localZ, Math.PI / 2);
    addChair(localX + 3, localZ, -Math.PI / 2);
  };

  const addRotatedFurnitureCollider = (
    localX: number,
    localZ: number,
    width: number,
    depth: number,
    rotationY: number,
  ): void => {
    const colliderWidth = Math.abs(Math.cos(rotationY)) * width + Math.abs(Math.sin(rotationY)) * depth;
    const colliderDepth = Math.abs(Math.sin(rotationY)) * width + Math.abs(Math.cos(rotationY)) * depth;
    addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, colliderWidth, colliderDepth);
  };

  const addBookshelf = (localX: number, localZ: number, rotationY = 0, widthScale = 1, heightScale = 1): void => {
    const shelf = new Group();
    shelf.position.set(localX, 0, localZ);
    shelf.rotation.y = rotationY;
    shelf.scale.set(widthScale, heightScale, 1);

    const back = new Mesh(new BoxGeometry(4.25, 4.2, 0.18), furnitureWoodMaterial);
    back.position.set(0, 2.1, -0.38);
    const leftSide = new Mesh(new BoxGeometry(0.2, 4.28, 0.96), furnitureWoodMaterial);
    leftSide.position.set(-2.16, 2.14, 0);
    const rightSide = leftSide.clone();
    rightSide.position.x = 2.16;
    const centerSupport = new Mesh(new BoxGeometry(0.14, 4.04, 0.84), furnitureWoodMaterial);
    centerSupport.position.set(0, 2.08, 0.02);
    const top = new Mesh(new BoxGeometry(4.45, 0.22, 0.96), furnitureWoodMaterial);
    top.position.set(0, 4.22, 0);
    const bottom = top.clone();
    bottom.position.y = 0.18;
    const shelves = [1.1, 2.05, 3].map((shelfY) => {
      const board = new Mesh(new BoxGeometry(4.28, 0.14, 0.86), furnitureWoodMaterial);
      board.position.set(0, shelfY, 0);
      return board;
    });

    shelf.add(back, leftSide, rightSide, centerSupport, top, bottom, ...shelves);

    const rows = [
      { shelfY: 0.18, count: 8 },
      { shelfY: 1.1, count: 9 },
      { shelfY: 2.05, count: 8 },
      { shelfY: 3, count: 7 },
    ];
    rows.forEach((row, rowIndex) => {
      let x = -1.92;
      for (let index = 0; index < row.count; index += 1) {
        const width = 0.18 + ((index + rowIndex) % 4) * 0.06;
        const height = 0.48 + ((index * 2 + rowIndex) % 5) * 0.1;
        const depth = 0.5 + ((index + rowIndex) % 2) * 0.08;
        const book = new Mesh(
          new BoxGeometry(width, height, depth),
          bookMaterials[(index + rowIndex) % bookMaterials.length],
        );
        book.position.set(x + width / 2, row.shelfY + 0.12 + height / 2, 0.2);
        book.rotation.z = ((index % 5) - 2) * 0.018;
        const pages = new Mesh(
          new BoxGeometry(width * 0.88, height * 0.94, 0.025),
          pillowMaterial,
        );
        pages.position.set(0, 0, depth / 2 + 0.015);
        book.add(pages);
        shelf.add(book);
        x += width + 0.07;
      }
    });

    house.add(shelf);
    addRotatedFurnitureCollider(localX, localZ, 4.5 * widthScale, 1.15, rotationY);
  };

  const addOldWoodenCloset = (localX: number, localZ: number, rotationY = 0): ChapterSevenOldWoodenCloset => {
    const closet = new Group();
    closet.position.set(localX, 0, localZ);
    closet.rotation.y = rotationY;

    const width = 1.9;
    const depth = 0.94;
    const height = 3.9;
    const wallThickness = 0.12;
    const back = new Mesh(new BoxGeometry(width, height, wallThickness), closetWoodMaterial);
    back.position.set(0, height / 2, -depth / 2 + wallThickness / 2);
    const leftSide = new Mesh(new BoxGeometry(wallThickness, height, depth), closetWoodMaterial);
    leftSide.position.set(-width / 2 + wallThickness / 2, height / 2, 0);
    const rightSide = leftSide.clone();
    rightSide.position.x = width / 2 - wallThickness / 2;
    const top = new Mesh(new BoxGeometry(width + 0.22, 0.18, depth + 0.16), closetTrimMaterial);
    top.position.set(0, height + 0.02, 0);
    const base = new Mesh(new BoxGeometry(width + 0.18, 0.22, depth + 0.12), closetTrimMaterial);
    base.position.set(0, 0.11, 0);
    const crown = new Mesh(new BoxGeometry(width + 0.44, 0.26, depth + 0.28), closetTrimMaterial);
    crown.position.set(0, height + 0.26, 0.02);
    const crownLip = new Mesh(new BoxGeometry(width + 0.58, 0.12, depth + 0.4), closetHandleMaterial);
    crownLip.position.set(0, height + 0.46, 0.04);
    const frontLeftPost = new Mesh(new BoxGeometry(0.14, height - 0.38, 0.13), closetTrimMaterial);
    frontLeftPost.position.set(-width / 2 + 0.12, height / 2 + 0.02, depth / 2 + 0.08);
    const frontRightPost = frontLeftPost.clone();
    frontRightPost.position.x = width / 2 - 0.12;
    const frontTopRail = new Mesh(new BoxGeometry(width - 0.18, 0.14, 0.13), closetTrimMaterial);
    frontTopRail.position.set(0, height - 0.18, depth / 2 + 0.08);
    const frontBottomRail = frontTopRail.clone();
    frontBottomRail.position.y = 0.42;

    const leftDoorPivot = new Group();
    leftDoorPivot.position.set(-width / 2 + 0.08, 0, depth / 2 + 0.04);
    const rightDoorPivot = new Group();
    rightDoorPivot.position.set(width / 2 - 0.08, 0, depth / 2 + 0.04);
    const makeDoor = (side: -1 | 1): Group => {
      const doorRoot = side < 0 ? leftDoorPivot : rightDoorPivot;
      const panelWidth = width / 2 - 0.08;
      const door = new Mesh(new BoxGeometry(panelWidth, height - 0.58, 0.1), closetWoodMaterial);
      door.position.set(side < 0 ? panelWidth / 2 : -panelWidth / 2, height / 2, 0);
      const upperPanel = new Mesh(new BoxGeometry(panelWidth - 0.44, 1.18, 0.035), closetTrimMaterial);
      upperPanel.position.set(door.position.x, height * 0.68, 0.065);
      const lowerPanel = upperPanel.clone();
      lowerPanel.position.y = height * 0.34;
      const centerLine = new Mesh(new BoxGeometry(0.055, height - 1.02, 0.04), closetTrimMaterial);
      centerLine.position.set(door.position.x, height / 2, 0.08);
      const handlePlate = new Mesh(new BoxGeometry(0.18, 0.42, 0.035), closetHandleMaterial);
      handlePlate.position.set(side < 0 ? panelWidth - 0.34 : -(panelWidth - 0.34), height * 0.52, 0.1);
      const handle = new Mesh(new CylinderGeometry(0.055, 0.055, 0.22, 10), closetHandleMaterial);
      handle.rotation.x = Math.PI / 2;
      handle.position.set(side < 0 ? panelWidth - 0.34 : -(panelWidth - 0.34), height * 0.52, 0.12);
      const panelTopRail = new Mesh(new BoxGeometry(panelWidth - 0.28, 0.055, 0.045), closetTrimMaterial);
      panelTopRail.position.set(door.position.x, height * 0.82, 0.09);
      const panelMidRail = panelTopRail.clone();
      panelMidRail.position.y = height * 0.5;
      const panelBottomRail = panelTopRail.clone();
      panelBottomRail.position.y = height * 0.18;
      doorRoot.add(door, upperPanel, lowerPanel, centerLine, panelTopRail, panelMidRail, panelBottomRail, handlePlate, handle);
      return doorRoot;
    };
    makeDoor(-1);
    makeDoor(1);

    const insideFloor = new Mesh(new BoxGeometry(width - 0.32, 0.08, depth - 0.28), closetTrimMaterial);
    insideFloor.position.set(0, 0.16, -0.05);
    closet.add(
      back,
      leftSide,
      rightSide,
      top,
      base,
      crown,
      crownLip,
      frontLeftPost,
      frontRightPost,
      frontTopRail,
      frontBottomRail,
      insideFloor,
      leftDoorPivot,
      rightDoorPivot,
    );
    house.add(closet);

    addRotatedCollider(colliders, localX, localZ, rotationY, 0, -depth / 2 + wallThickness / 2, width, wallThickness);
    addRotatedCollider(colliders, localX, localZ, rotationY, -width / 2 + wallThickness / 2, 0, wallThickness, depth);
    addRotatedCollider(colliders, localX, localZ, rotationY, width / 2 - wallThickness / 2, 0, wallThickness, depth);
    const doorCollider = addRotatedCollider(colliders, localX, localZ, rotationY, 0, depth / 2 + 0.05, width, 0.18);
    const frontPoint = getRotatedLocalPoint(localX, localZ, rotationY, 0, depth / 2 + 0.82);
    const aimPoint = getRotatedLocalPoint(localX, localZ, rotationY, 0, depth / 2 + 0.18);
    return {
      label: 'Old wooden closet',
      interactPosition: new Vector3(CENTER_X + frontPoint.x, GAME_CONFIG.player.height, HOUSE_CENTER_Z + frontPoint.z),
      aimPosition: new Vector3(CENTER_X + aimPoint.x, 1.48, HOUSE_CENTER_Z + aimPoint.z),
      doorPivots: [leftDoorPivot, rightDoorPivot],
      doorCollider,
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
    };
  };

  const addRockingChair = (localX: number, localZ: number, rotationY = 0): void => {
    const chair = new Group();
    chair.position.set(localX, 0, localZ);
    chair.rotation.y = rotationY;

    const seat = new Mesh(new BoxGeometry(1.26, 0.16, 1.06), furnitureWoodMaterial);
    seat.position.set(0, 0.82, 0.04);
    const seatFrontLip = new Mesh(new BoxGeometry(1.34, 0.14, 0.12), houseTrimMaterial);
    seatFrontLip.position.set(0, 0.86, 0.62);
    const seatBackLip = seatFrontLip.clone();
    seatBackLip.position.z = -0.52;

    const backTopRail = new Mesh(new BoxGeometry(1.18, 0.14, 0.12), houseTrimMaterial);
    backTopRail.position.set(0, 1.94, -0.58);
    backTopRail.rotation.x = -0.22;
    const backBottomRail = backTopRail.clone();
    backBottomRail.position.set(0, 1.16, -0.48);
    const backSideLeft = new Mesh(new BoxGeometry(0.12, 1.1, 0.12), houseTrimMaterial);
    backSideLeft.position.set(-0.62, 1.48, -0.54);
    backSideLeft.rotation.x = -0.18;
    const backSideRight = backSideLeft.clone();
    backSideRight.position.x = 0.62;
    const backSlats = [-0.36, -0.18, 0, 0.18, 0.36].map((slatX) => {
      const slat = new Mesh(new BoxGeometry(0.075, 0.96, 0.08), furnitureWoodMaterial);
      slat.position.set(slatX, 1.5, -0.52);
      slat.rotation.x = -0.2;
      return slat;
    });

    const leftArm = new Mesh(new BoxGeometry(0.14, 0.12, 1.14), houseTrimMaterial);
    leftArm.position.set(-0.78, 1.17, 0.04);
    leftArm.rotation.x = -0.04;
    const rightArm = leftArm.clone();
    rightArm.position.x = 0.78;

    const legSpecs = [
      [-0.52, 0.42, 0.44, -0.12],
      [0.52, 0.42, 0.44, 0.12],
      [-0.52, 0.42, -0.36, 0.16],
      [0.52, 0.42, -0.36, -0.16],
    ] as const;
    const legs = legSpecs.map(([legX, legY, legZ, tilt]) => {
      const leg = new Mesh(new BoxGeometry(0.12, 0.86, 0.12), houseTrimMaterial);
      leg.position.set(legX, legY, legZ);
      leg.rotation.z = tilt;
      return leg;
    });

    const frontBrace = new Mesh(new CylinderGeometry(0.045, 0.045, 1.2, 10), houseTrimMaterial);
    frontBrace.rotation.z = Math.PI / 2;
    frontBrace.position.set(0, 0.48, 0.45);
    const rearBrace = frontBrace.clone();
    rearBrace.position.z = -0.36;
    const sideBraceLeft = new Mesh(new BoxGeometry(0.08, 0.08, 1.08), houseTrimMaterial);
    sideBraceLeft.position.set(-0.55, 0.5, 0.05);
    sideBraceLeft.rotation.x = -0.08;
    const sideBraceRight = sideBraceLeft.clone();
    sideBraceRight.position.x = 0.55;

    const rockerPieces: Mesh[] = [];
    [-0.56, 0.56].forEach((rockerX) => {
      for (let index = 0; index < 7; index += 1) {
        const z = -0.72 + index * 0.24;
        const arc = Math.sin(index / 6 * Math.PI);
        const rocker = new Mesh(new BoxGeometry(0.13, 0.08, 0.28), houseTrimMaterial);
        rocker.position.set(rockerX, 0.08 + arc * 0.08, z);
        rocker.rotation.x = (index - 3) * -0.075;
        rockerPieces.push(rocker);
      }
    });

    chair.add(
      seat,
      seatFrontLip,
      seatBackLip,
      backTopRail,
      backBottomRail,
      backSideLeft,
      backSideRight,
      ...backSlats,
      leftArm,
      rightArm,
      ...legs,
      frontBrace,
      rearBrace,
      sideBraceLeft,
      sideBraceRight,
      ...rockerPieces,
    );
    house.add(chair);
    addRotatedFurnitureCollider(localX, localZ, 1.58, 1.86, rotationY);
  };

  const addYardFenceRun = (startLocalX: number, localZ: number, length = 20, axis: 'x' | 'z' = 'x'): void => {
    const fence = new Group();
    fence.position.set(startLocalX, 0, localZ);

    const picketCount = 42;
    const spacing = length / (picketCount - 1);
    for (let index = 0; index < picketCount; index += 1) {
      const offset = index * spacing;
      const picket = new Mesh(new BoxGeometry(0.34, 2.72, 0.24), whiteFenceMaterial);
      picket.position.set(axis === 'x' ? offset : 0, 1.36, axis === 'z' ? offset : 0);
      const spike = new Mesh(new ConeGeometry(0.21, 0.48, 4), whiteFenceMaterial);
      spike.position.set(axis === 'x' ? offset : 0, 2.96, axis === 'z' ? offset : 0);
      spike.rotation.y = Math.PI / 4;
      fence.add(picket, spike);
    }

    const railGeometry = axis === 'x'
      ? new BoxGeometry(length + 0.42, 0.16, 0.18)
      : new BoxGeometry(0.18, 0.16, length + 0.42);
    const topRail = new Mesh(railGeometry, whiteFenceMaterial);
    topRail.position.set(axis === 'x' ? length / 2 : 0, 2.22, axis === 'z' ? length / 2 : 0);
    const middleRail = topRail.clone();
    middleRail.position.y = 1.38;
    const bottomRail = topRail.clone();
    bottomRail.position.y = 0.58;

    fence.add(topRail, middleRail, bottomRail);
    house.add(fence);
    addCollider(
      colliders,
      CENTER_X + startLocalX + (axis === 'x' ? length / 2 : 0),
      HOUSE_CENTER_Z + localZ + (axis === 'z' ? length / 2 : 0),
      axis === 'x' ? length : 0.34,
      axis === 'z' ? length : 0.34,
    );
  };

  const addCardboardBox = (localX: number, localZ: number): ChapterSevenCardboardBox => {
    const box = new Group();
    box.position.set(localX, 0.22, localZ);

    const width = 2;
    const depth = 2;
    const wallHeight = 1.05;
    const wallThickness = 0.12;
    const flapThickness = 0.055;
    const bottom = new Mesh(new BoxGeometry(width, 0.1, depth), cardboardMaterial);
    bottom.position.y = 0.05;
    const frontWall = new Mesh(new BoxGeometry(width, wallHeight, wallThickness), cardboardMaterial);
    frontWall.position.set(0, wallHeight / 2, depth / 2 - wallThickness / 2);
    const backWall = frontWall.clone();
    backWall.position.z = -depth / 2 + wallThickness / 2;
    const leftWall = new Mesh(new BoxGeometry(wallThickness, wallHeight, depth), cardboardMaterial);
    leftWall.position.set(-width / 2 + wallThickness / 2, wallHeight / 2, 0);
    const rightWall = leftWall.clone();
    rightWall.position.x = width / 2 - wallThickness / 2;

    const createFlap = (sizeX: number, sizeZ: number, offsetX: number, offsetZ: number): Group => {
      const pivot = new Group();
      pivot.position.set(offsetX, wallHeight, offsetZ);
      const flap = new Mesh(new BoxGeometry(sizeX, flapThickness, sizeZ), cardboardMaterial);
      flap.position.set(
        offsetX === 0 ? 0 : -Math.sign(offsetX) * sizeX / 2,
        0,
        offsetZ === 0 ? 0 : -Math.sign(offsetZ) * sizeZ / 2,
      );
      const crease = new Mesh(new BoxGeometry(
        offsetX === 0 ? sizeX : 0.035,
        flapThickness + 0.012,
        offsetZ === 0 ? 0.035 : sizeZ,
      ), cardboardEdgeMaterial);
      crease.position.set(
        offsetX === 0 ? 0 : -Math.sign(offsetX) * 0.02,
        0.004,
        offsetZ === 0 ? 0 : -Math.sign(offsetZ) * 0.02,
      );
      pivot.add(flap, crease);
      return pivot;
    };

    const frontFlap = createFlap(width - 0.08, depth / 2, 0, depth / 2);
    const backFlap = createFlap(width - 0.08, depth / 2, 0, -depth / 2);
    const leftFlap = new Group();
    const rightFlap = new Group();
    const frontTape = new Mesh(new BoxGeometry(0.44, wallHeight * 0.72, 0.032), cardboardTapeMaterial);
    frontTape.position.set(0, wallHeight * 0.52, depth / 2 + 0.018);
    const backTape = frontTape.clone();
    backTape.position.z = -depth / 2 - 0.018;
    const leftTape = new Mesh(new BoxGeometry(0.032, wallHeight * 0.72, 0.44), cardboardTapeMaterial);
    leftTape.position.set(-width / 2 - 0.018, wallHeight * 0.52, 0);
    const rightTape = leftTape.clone();
    rightTape.position.x = width / 2 + 0.018;
    const frontTapeLabel = new Mesh(new PlaneGeometry(0.54, 0.28), amazonTapeLabelMaterial);
    frontTapeLabel.position.set(0, wallHeight * 0.58, depth / 2 + 0.036);
    const backTapeLabel = frontTapeLabel.clone();
    backTapeLabel.position.z = -depth / 2 - 0.036;
    backTapeLabel.rotation.y = Math.PI;
    const leftTapeLabel = new Mesh(new PlaneGeometry(0.54, 0.28), amazonTapeLabelMaterial);
    leftTapeLabel.position.set(-width / 2 - 0.036, wallHeight * 0.58, 0);
    leftTapeLabel.rotation.y = -Math.PI / 2;
    const rightTapeLabel = leftTapeLabel.clone();
    rightTapeLabel.position.x = width / 2 + 0.036;
    rightTapeLabel.rotation.y = Math.PI / 2;

    box.add(
      bottom,
      frontWall,
      backWall,
      leftWall,
      rightWall,
      frontTape,
      backTape,
      leftTape,
      rightTape,
      frontTapeLabel,
      backTapeLabel,
      leftTapeLabel,
      rightTapeLabel,
      frontFlap,
      backFlap,
      leftFlap,
      rightFlap,
    );

    house.add(box);

    const centerX = CENTER_X + localX;
    const centerZ = HOUSE_CENTER_Z + localZ;
    const wallColliders: CollisionBox[] = [
      {
        centerX,
        centerZ: centerZ + depth / 2 - wallThickness / 2,
        halfWidth: width / 2,
        halfDepth: wallThickness / 2,
      },
      {
        centerX,
        centerZ: centerZ - depth / 2 + wallThickness / 2,
        halfWidth: width / 2,
        halfDepth: wallThickness / 2,
      },
      {
        centerX: centerX - width / 2 + wallThickness / 2,
        centerZ,
        halfWidth: wallThickness / 2,
        halfDepth: depth / 2,
      },
      {
        centerX: centerX + width / 2 - wallThickness / 2,
        centerZ,
        halfWidth: wallThickness / 2,
        halfDepth: depth / 2,
      },
    ];
    colliders.push(...wallColliders);

    return {
      label: 'Porch cardboard box',
      interactPosition: new Vector3(centerX, GAME_CONFIG.player.height, centerZ + depth / 2 + 0.65),
      aimPosition: new Vector3(centerX, wallHeight + 0.54, centerZ),
      flapPivots: {
        front: frontFlap,
        back: backFlap,
        left: leftFlap,
        right: rightFlap,
      },
      wallColliders,
      centerX,
      centerZ,
      halfWidth: width / 2,
      halfDepth: depth / 2,
      wallHeight,
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
    };
  };

  const addDrawer = (localX: number, localZ: number, rotationY = 0, label = 'Small Drawer'): ChapterSevenDrawer => {
    const drawer = new Group();
    drawer.position.set(localX, 0, localZ);
    drawer.rotation.y = rotationY;
    drawer.scale.set(0.88, 0.92, 0.88);

    const back = new Mesh(new BoxGeometry(2.45, 2.22, 0.16), furnitureWoodMaterial);
    back.position.set(0, 1.18, -0.48);
    const leftSide = new Mesh(new BoxGeometry(0.18, 2.26, 1.05), furnitureWoodMaterial);
    leftSide.position.set(-1.32, 1.16, 0);
    const rightSide = leftSide.clone();
    rightSide.position.x = 1.32;
    const top = new Mesh(new BoxGeometry(2.82, 0.18, 1.08), furnitureWoodMaterial);
    top.position.set(0, 2.32, 0);
    const bottom = top.clone();
    bottom.position.y = 0.12;
    const dividers = [0.82, 1.5].map((dividerY) => {
      const divider = new Mesh(new BoxGeometry(2.62, 0.12, 0.98), furnitureWoodMaterial);
      divider.position.set(0, dividerY, 0);
      return divider;
    });
    const plantPot = new Mesh(new CylinderGeometry(0.22, 0.28, 0.42, 14), plantPotMaterial);
    plantPot.position.set(-0.86, 2.63, -0.08);
    const potLip = new Mesh(new CylinderGeometry(0.31, 0.31, 0.08, 14), plantPotMaterial);
    potLip.position.set(-0.86, 2.86, -0.08);
    const plantStem = new Mesh(new CylinderGeometry(0.025, 0.03, 0.5, 8), plantLeafMaterial);
    plantStem.position.set(-0.86, 3.12, -0.08);
    const leaves = [
      [-0.12, 0.08, -0.02, 0.45],
      [0.12, 0.02, 0.04, -0.45],
      [-0.02, 0.14, 0.12, 0.08],
      [0.04, 0.22, -0.12, -0.12],
    ].map(([leafX, leafY, leafZ, rotationZ]) => {
      const leaf = new Mesh(new SphereGeometry(0.16, 10, 8), plantLeafMaterial);
      leaf.position.set(-0.86 + leafX, 3.1 + leafY, -0.08 + leafZ);
      leaf.scale.set(0.62, 0.34, 1);
      leaf.rotation.z = rotationZ;
      return leaf;
    });
    drawer.add(back, leftSide, rightSide, top, bottom, ...dividers, plantPot, potLip, plantStem, ...leaves);

    const frontDirection = new Vector3(Math.sin(rotationY), 0, Math.cos(rotationY));
    const worldX = CENTER_X + localX;
    const worldZ = HOUSE_CENTER_Z + localZ;
    const frontWorldX = worldX + frontDirection.x * 1.75;
    const frontWorldZ = worldZ + frontDirection.z * 1.75;
    const drawerSlides = [0.48, 1.16, 1.84].map((drawerY, index) => {
      const slide = new Group();
      slide.position.y = drawerY;
      const trayBottom = new Mesh(new BoxGeometry(2.18, 0.08, 0.66), houseTrimMaterial);
      trayBottom.position.set(0, -0.18, 0.08);
      const leftTraySide = new Mesh(new BoxGeometry(0.1, 0.34, 0.68), houseTrimMaterial);
      leftTraySide.position.set(-1.12, -0.02, 0.08);
      const rightTraySide = leftTraySide.clone();
      rightTraySide.position.x = 1.12;
      const trayBack = new Mesh(new BoxGeometry(2.18, 0.3, 0.08), houseTrimMaterial);
      trayBack.position.set(0, -0.02, -0.28);
      const front = new Mesh(new BoxGeometry(2.34, 0.48, 0.1), houseTrimMaterial);
      front.position.set(0, 0, 0.5);
      const knob = new Mesh(new CylinderGeometry(0.08, 0.08, 0.12, 10), houseDoorMaterial);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(0, 0, 0.6);
      slide.add(trayBottom, leftTraySide, rightTraySide, trayBack, front, knob);
      const cookieRoll = Math.sin((localX + 31.17) * 8.731 + (localZ - 11.42) * 5.913 + label.length * 1.37 + index * 2.81) * 43758.5453;
      const cookieNormalized = cookieRoll - Math.floor(cookieRoll);
      const cookieCount = cookieNormalized < 0.36 ? 0 : cookieNormalized < 0.74 ? 1 : 2;
      for (let cookieIndex = 0; cookieIndex < cookieCount; cookieIndex += 1) {
        const side = cookieCount === 1 ? 0 : cookieIndex === 0 ? -1 : 1;
        const cookie = new Mesh(new CylinderGeometry(0.15, 0.15, 0.045, 18), cookieMaterial);
        cookie.position.set(side * 0.34, -0.09, 0.05 + cookieIndex * 0.12);
        const chipOffsets = [
          [-0.045, 0.018],
          [0.04, -0.025],
          [0.015, 0.046],
        ];
        chipOffsets.forEach(([chipX, chipZ]) => {
          const chip = new Mesh(new SphereGeometry(0.018, 8, 6), chocolateChipMaterial);
          chip.position.set(cookie.position.x + chipX, -0.055, cookie.position.z + chipZ);
          chip.scale.y = 0.42;
          slide.add(chip);
        });
        slide.add(cookie);
      }
      drawer.add(slide);
      const worldY = drawerY * drawer.scale.y;
      return {
        label: `${label} ${index === 0 ? 'bottom' : index === 1 ? 'middle' : 'top'} drawer`,
        interactPosition: new Vector3(frontWorldX, GAME_CONFIG.player.height, frontWorldZ),
        aimPosition: new Vector3(
          worldX + frontDirection.x * 0.68,
          Math.max(0.52, worldY),
          worldZ + frontDirection.z * 0.68,
        ),
        cookieCount,
        root: slide,
        closedZ: 0,
        openZ: 0.72 + index * 0.06,
        open: false,
        openAmount: 0,
        targetOpenAmount: 0,
      };
    });

    house.add(drawer);
    addRotatedFurnitureCollider(localX, localZ, 2.55, 1.1, rotationY);
    return {
      label,
      interactPosition: new Vector3(frontWorldX, GAME_CONFIG.player.height, frontWorldZ),
      drawerSlides,
    };
  };

  const getCabinetCookieCount = (localX: number, label: string): number => {
    const value = Math.sin(localX * 12.9898 + label.length * 78.233) * 43758.5453;
    const normalized = value - Math.floor(value);
    if (normalized < 0.12) {
      return 0;
    }

    return normalized < 0.58 ? 1 : 2;
  };

  const getLooseCookieCount = (localX: number, label: string): number => {
    const value = Math.sin(localX * 19.919 + label.length * 31.713) * 24634.6345;
    return 1 + Math.floor((value - Math.floor(value)) * 3);
  };

  const addCookie = (root: Group, x: number, y: number, z: number, scale = 1): void => {
    const cookie = new Mesh(new CylinderGeometry(0.13 * scale, 0.13 * scale, 0.045 * scale, 18), cookieMaterial);
    cookie.position.set(x, y, z);
    const chipOffsets = [
      [-0.045, 0.015],
      [0.04, -0.02],
      [0.015, 0.045],
    ];
    chipOffsets.forEach(([chipX, chipZ]) => {
      const chip = new Mesh(new SphereGeometry(0.018 * scale, 8, 6), chocolateChipMaterial);
      chip.position.set(chipX * scale, 0.028 * scale, chipZ * scale);
      chip.scale.y = 0.42;
      cookie.add(chip);
    });
    root.add(cookie);
  };

  const addCabinetCookies = (
    root: Group,
    localX: number,
    label: string,
    shelfYValues: [number, number],
    width: number,
    depth: number,
  ): void => {
    const cookieCount = getCabinetCookieCount(localX, label);
    for (let index = 0; index < cookieCount; index += 1) {
      const side = index === 0 ? -1 : 1;
      addCookie(
        root,
        side * Math.min(width * 0.22, 0.42),
        shelfYValues[index % shelfYValues.length] + 0.06,
        depth * 0.08 + index * 0.08,
        0.92,
      );
    }
  };

  const addCountertopCookie = (root: Group, width: number, topY: number): void => {
    addCookie(root, Math.min(width * 0.18, 0.32), topY + 0.14, 0.22, 0.86);
  };

  const addFridge = (localX: number, localZ: number): ChapterSevenFridge => {
    const fridge = new Group();
    fridge.position.set(localX, 0, localZ);

    const width = 1.54;
    const height = 3.58;
    const depth = 1.06;

    const back = new Mesh(new BoxGeometry(width, height, 0.18), fridgeInteriorMaterial);
    back.position.set(0, height / 2, -depth / 2 + 0.08);
    const leftSide = new Mesh(new BoxGeometry(0.2, height, depth), fridgeMaterial);
    leftSide.position.set(-width / 2 + 0.1, height / 2, 0);
    const rightSide = leftSide.clone();
    rightSide.position.x = width / 2 - 0.1;
    const top = new Mesh(new BoxGeometry(width, 0.2, depth), fridgeMaterial);
    top.position.set(0, height - 0.1, 0);
    const bottom = top.clone();
    bottom.position.y = 0.1;
    const divider = new Mesh(new BoxGeometry(width - 0.28, 0.12, depth - 0.26), fridgeInteriorMaterial);
    divider.position.set(0, 2.42, 0);
    const shelfOne = new Mesh(new BoxGeometry(width - 0.34, 0.08, depth - 0.34), fridgeInteriorMaterial);
    shelfOne.position.set(0, 1.48, 0.04);
    const shelfTwo = shelfOne.clone();
    shelfTwo.position.y = 3.02;
    fridge.add(back, leftSide, rightSide, top, bottom, divider, shelfOne, shelfTwo);

    const freezerLabel = new Mesh(new BoxGeometry(width - 0.58, 0.08, 0.08), fridgeSealMaterial);
    freezerLabel.position.set(0, 2.45, depth / 2 + 0.01);
    fridge.add(freezerLabel);

    const milk = new Group();
    milk.position.set(-0.38, 1.74, 0.1);
    const milkCarton = new Mesh(new BoxGeometry(0.3, 0.55, 0.27), milkMaterial);
    milkCarton.position.y = 0.28;
    const milkLabel = new Mesh(new BoxGeometry(0.24, 0.16, 0.03), milkLabelMaterial);
    milkLabel.position.set(0, 0.28, 0.15);
    const milkCap = new Mesh(new CylinderGeometry(0.055, 0.055, 0.05, 12), milkLabelMaterial);
    milkCap.position.set(0.06, 0.58, 0);
    milk.add(milkCarton, milkLabel, milkCap);

    const apple = new Mesh(new SphereGeometry(0.12, 12, 8), appleMaterial);
    apple.position.set(0.03, 1.66, 0.17);
    const orange = new Mesh(new SphereGeometry(0.13, 12, 8), orangeMaterial);
    orange.position.set(0.3, 1.66, 0.12);
    const cookieBox = new Mesh(new BoxGeometry(0.44, 0.24, 0.28), cookieBoxMaterial);
    cookieBox.position.set(0.25, 3.25, 0.13);
    const cookieLabel = new Mesh(new BoxGeometry(0.28, 0.09, 0.03), milkMaterial);
    cookieLabel.position.set(0.25, 3.26, 0.29);
    const snackTray = new Mesh(new BoxGeometry(0.7, 0.1, 0.34), houseTrimMaterial);
    snackTray.position.set(0.14, 1.55, 0.08);
    const fridgeCookieCount = getLooseCookieCount(localX, 'fridge');
    for (let index = 0; index < fridgeCookieCount; index += 1) {
      addCookie(
        fridge,
        -0.28 + index * 0.24,
        index === 2 ? 3.08 : 1.56,
        0.24 - index * 0.05,
        0.74,
      );
    }
    fridge.add(snackTray, milk, apple, orange, cookieBox, cookieLabel);

    const doorPivot = new Group();
    doorPivot.position.set(-width / 2, 0, depth / 2 + 0.04);
    const doorPanel = new Mesh(new BoxGeometry(width, height, 0.16), fridgeMaterial);
    doorPanel.position.set(width / 2, height / 2, 0);
    const topSeal = new Mesh(new BoxGeometry(width - 0.26, 0.06, 0.05), fridgeSealMaterial);
    topSeal.position.set(width / 2, 2.43, 0.1);
    const handle = new Mesh(new BoxGeometry(0.1, 1.32, 0.1), fridgeSealMaterial);
    handle.position.set(width - 0.22, 1.92, 0.12);
    doorPivot.add(doorPanel, topSeal, handle);
    fridge.add(doorPivot);

    house.add(fridge);
    addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, width + 0.18, depth + 0.18);

    return {
      label: 'Fridge',
      interactPosition: new Vector3(CENTER_X + localX, GAME_CONFIG.player.height, HOUSE_CENTER_Z + localZ + depth / 2 + 1.1),
      aimPosition: new Vector3(CENTER_X + localX, 1.88, HOUSE_CENTER_Z + localZ + depth / 2 + 0.16),
      doorPivot,
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
    };
  };

  const addKitchenCounter = (localX: number, localZ: number, width = 2.28, label = 'Base cabinet'): ChapterSevenCupboard => {
    const counter = new Group();
    counter.position.set(localX, 0, localZ);

    const depth = 1.18;
    const baseHeight = 1.27;
    const back = new Mesh(new BoxGeometry(width, baseHeight, 0.12), cabinetMaterial);
    back.position.set(0, baseHeight / 2, -depth / 2 + 0.06);
    const leftSide = new Mesh(new BoxGeometry(0.12, baseHeight, depth), cabinetMaterial);
    leftSide.position.set(-width / 2 + 0.06, baseHeight / 2, 0);
    const rightSide = leftSide.clone();
    rightSide.position.x = width / 2 - 0.06;
    const bottom = new Mesh(new BoxGeometry(width, 0.12, depth), cabinetMaterial);
    bottom.position.set(0, 0.06, 0);
    const top = new Mesh(new BoxGeometry(width + 0.18, 0.22, depth + 0.18), counterTopMaterial);
    top.position.y = baseHeight + 0.12;
    const lowerShelf = new Mesh(new BoxGeometry(width - 0.18, 0.07, depth - 0.18), furnitureWoodMaterial);
    lowerShelf.position.set(0, 0.48, -0.04);
    const upperShelf = lowerShelf.clone();
    upperShelf.position.y = 0.9;
    const toeKick = new Mesh(new BoxGeometry(width - 0.26, 0.18, 0.12), houseTrimMaterial);
    toeKick.position.set(0, 0.14, depth / 2 + 0.035);

    const leftDoorPivot = new Group();
    leftDoorPivot.position.set(-width / 2, 0, depth / 2 + 0.06);
    const leftDoor = new Mesh(new BoxGeometry(width / 2, 1.0, 0.07), furnitureWoodMaterial);
    leftDoor.position.set(width / 4, 0.68, 0);
    const leftHandle = new Mesh(new BoxGeometry(0.06, 0.32, 0.07), fridgeSealMaterial);
    leftHandle.position.set(width / 2 - 0.18, 0.68, 0.07);
    leftDoorPivot.add(leftDoor, leftHandle);

    const rightDoorPivot = new Group();
    rightDoorPivot.position.set(width / 2, 0, depth / 2 + 0.06);
    const rightDoor = new Mesh(new BoxGeometry(width / 2, 1.0, 0.07), furnitureWoodMaterial);
    rightDoor.position.set(-width / 4, 0.68, 0);
    const rightHandle = new Mesh(new BoxGeometry(0.06, 0.32, 0.07), fridgeSealMaterial);
    rightHandle.position.set(-(width / 2 - 0.18), 0.68, 0.07);
    rightDoorPivot.add(rightDoor, rightHandle);

    addCabinetCookies(counter, localX, label, [0.48, 0.9], width, depth);
    if (label === 'Counter base cabinet') {
      addCountertopCookie(counter, width, baseHeight + 0.16);
    }
    counter.add(back, leftSide, rightSide, bottom, top, lowerShelf, upperShelf, leftDoorPivot, rightDoorPivot, toeKick);
    house.add(counter);
    const counterCollider = addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, width + 0.18, depth + 0.18);
    counterSurfaces.push({
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: (width + 0.18) / 2,
      halfDepth: (depth + 0.18) / 2,
      floorY: baseHeight + 0.23,
      collider: counterCollider,
    });

    return {
      label,
      interactPosition: new Vector3(CENTER_X + localX, GAME_CONFIG.player.height, HOUSE_CENTER_Z + localZ + depth / 2 + 0.9),
      aimPosition: new Vector3(CENTER_X + localX, 0.78, HOUSE_CENTER_Z + localZ + depth / 2 + 0.08),
      doorPivots: [leftDoorPivot, rightDoorPivot],
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
    };
  };

  const addKitchenSink = (localX: number, localZ: number, width = 2.05): ChapterSevenKitchenSink => {
    const sink = new Group();
    sink.position.set(localX, 0, localZ);

    const depth = 1.18;
    const baseHeight = 1.27;
    const back = new Mesh(new BoxGeometry(width, baseHeight, 0.12), cabinetMaterial);
    back.position.set(0, baseHeight / 2, -depth / 2 + 0.06);
    const leftSide = new Mesh(new BoxGeometry(0.12, baseHeight, depth), cabinetMaterial);
    leftSide.position.set(-width / 2 + 0.06, baseHeight / 2, 0);
    const rightSide = leftSide.clone();
    rightSide.position.x = width / 2 - 0.06;
    const bottom = new Mesh(new BoxGeometry(width, 0.12, depth), cabinetMaterial);
    bottom.position.set(0, 0.06, 0);
    const top = new Mesh(new BoxGeometry(width + 0.18, 0.16, depth + 0.18), counterTopMaterial);
    top.position.y = baseHeight + 0.1;
    const frontPanelLeft = new Mesh(new BoxGeometry(width / 2 - 0.08, 1.02, 0.08), furnitureWoodMaterial);
    frontPanelLeft.position.set(-width / 4 - 0.025, 0.68, depth / 2 + 0.04);
    const frontPanelRight = frontPanelLeft.clone();
    frontPanelRight.position.x = width / 4 + 0.025;
    const centerSeam = new Mesh(new BoxGeometry(0.045, 1.02, 0.095), houseTrimMaterial);
    centerSeam.position.set(0, 0.68, depth / 2 + 0.065);
    const leftHandle = new Mesh(new BoxGeometry(0.06, 0.32, 0.07), fridgeSealMaterial);
    leftHandle.position.set(-0.18, 0.72, depth / 2 + 0.105);
    const rightHandle = leftHandle.clone();
    rightHandle.position.x = 0.18;
    const underSinkKick = new Mesh(new BoxGeometry(width - 0.36, 0.16, 0.08), houseTrimMaterial);
    underSinkKick.position.set(0, 0.18, depth / 2 + 0.08);
    const toeKick = new Mesh(new BoxGeometry(width - 0.26, 0.18, 0.12), houseTrimMaterial);
    toeKick.position.set(0, 0.14, depth / 2 + 0.035);

    const basin = new Mesh(new CylinderGeometry(0.52, 0.6, 0.22, 32), sinkBasinMaterial);
    basin.scale.z = 0.66;
    basin.position.set(0, baseHeight + 0.22, 0.08);
    const basinWater = new Mesh(new CylinderGeometry(0.44, 0.5, 0.025, 32), faucetWaterMaterial);
    basinWater.scale.z = 0.62;
    basinWater.position.set(0, baseHeight + 0.34, 0.08);
    basinWater.visible = false;
    const drain = new Mesh(new CylinderGeometry(0.08, 0.08, 0.025, 16), fridgeSealMaterial);
    drain.position.set(0, baseHeight + 0.355, 0.08);

    const faucetBase = new Mesh(new CylinderGeometry(0.12, 0.12, 0.16, 16), faucetMaterial);
    faucetBase.position.set(0, baseHeight + 0.32, -0.34);
    const faucetNeck = new Mesh(new CylinderGeometry(0.07, 0.07, 0.72, 14), faucetMaterial);
    faucetNeck.position.set(0, baseHeight + 0.62, -0.34);
    const faucetSpout = new Mesh(new CylinderGeometry(0.055, 0.055, 0.58, 14), faucetMaterial);
    faucetSpout.rotation.x = Math.PI / 2;
    faucetSpout.position.set(0, baseHeight + 0.94, -0.09);
    const spoutTip = new Mesh(new CylinderGeometry(0.07, 0.07, 0.12, 14), faucetMaterial);
    spoutTip.position.set(0, baseHeight + 0.82, 0.18);

    const handlePivot = new Group();
    handlePivot.position.set(0.34, baseHeight + 0.52, -0.32);
    const handleStem = new Mesh(new CylinderGeometry(0.04, 0.04, 0.16, 12), faucetMaterial);
    handleStem.position.y = 0.08;
    const handleBar = new Mesh(new BoxGeometry(0.34, 0.055, 0.09), faucetMaterial);
    handleBar.position.y = 0.18;
    handlePivot.add(handleStem, handleBar);

    const waterStream = new Mesh(new CylinderGeometry(0.035, 0.045, 0.74, 12), faucetWaterMaterial);
    waterStream.position.set(0, baseHeight + 0.52, 0.18);
    waterStream.visible = false;
    waterStream.scale.y = 0.01;

    sink.add(
      back,
      leftSide,
      rightSide,
      bottom,
      top,
      frontPanelLeft,
      frontPanelRight,
      centerSeam,
      leftHandle,
      rightHandle,
      underSinkKick,
      toeKick,
      basin,
      basinWater,
      drain,
      faucetBase,
      faucetNeck,
      faucetSpout,
      spoutTip,
      handlePivot,
      waterStream,
    );
    house.add(sink);

    const sinkCollider = addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, width + 0.18, depth + 0.18);
    counterSurfaces.push({
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: (width + 0.18) / 2,
      halfDepth: (depth + 0.18) / 2,
      floorY: baseHeight + 0.23,
      collider: sinkCollider,
    });

    return {
      label: 'Kitchen sink faucet',
      interactPosition: new Vector3(CENTER_X + localX, GAME_CONFIG.player.height, HOUSE_CENTER_Z + localZ + depth / 2 + 0.8),
      aimPosition: new Vector3(CENTER_X + localX, baseHeight + 0.72, HOUSE_CENTER_Z + localZ + 0.06),
      handlePivot,
      waterStream,
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
    };
  };

  const addStove = (localX: number, localZ: number): ChapterSevenOven => {
    const stove = new Group();
    stove.position.set(localX, 0, localZ);

    const width = 1.62;
    const depth = 1.06;
    const height = 1.36;
    const body = new Mesh(new BoxGeometry(width, height, depth), stoveMaterial);
    body.position.y = height / 2;
    const cooktop = new Mesh(new BoxGeometry(width + 0.08, 0.12, depth + 0.08), stoveGlassMaterial);
    cooktop.position.y = height + 0.08;
    const ovenCavity = new Mesh(new BoxGeometry(width - 0.28, 0.76, depth - 0.22), stoveGlassMaterial);
    ovenCavity.position.set(0, 0.75, 0.05);
    const ovenOpening = new Mesh(new BoxGeometry(width - 0.26, 0.78, 0.05), stoveGlassMaterial);
    ovenOpening.position.set(0, 0.75, depth / 2 + 0.032);
    const ovenDoorPivot = new Group();
    ovenDoorPivot.position.set(0, 0.36, depth / 2 + 0.055);
    const ovenDoor = new Mesh(new BoxGeometry(width - 0.2, 0.78, 0.08), stoveMaterial);
    ovenDoor.position.set(0, 0.39, 0);
    const ovenWindow = new Mesh(new BoxGeometry(width - 0.52, 0.44, 0.05), stoveGlassMaterial);
    ovenWindow.position.set(0, 0.39, 0.05);
    const ovenHandle = new Mesh(new BoxGeometry(width - 0.36, 0.06, 0.07), fridgeSealMaterial);
    ovenHandle.position.set(0, 0.68, 0.09);
    const knobRow = new Mesh(new BoxGeometry(width - 0.26, 0.14, 0.07), fridgeSealMaterial);
    knobRow.position.set(0, 1.22, depth / 2 + 0.085);
    const burners = [
      [-0.46, -0.26],
      [0.46, -0.26],
      [-0.46, 0.26],
      [0.46, 0.26],
    ].map(([burnerX, burnerZ]) => {
      const burner = new Mesh(new CylinderGeometry(0.22, 0.22, 0.04, 18), fridgeSealMaterial);
      burner.position.set(burnerX, height + 0.14, burnerZ);
      return burner;
    });

    ovenDoorPivot.add(ovenDoor, ovenWindow, ovenHandle);
    stove.add(body, cooktop, ovenCavity, ovenOpening, ovenDoorPivot, knobRow, ...burners);
    house.add(stove);
    const stoveCollider = addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, width + 0.08, depth + 0.08);
    counterSurfaces.push({
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: (width + 0.08) / 2,
      halfDepth: (depth + 0.08) / 2,
      floorY: height + 0.2,
      collider: stoveCollider,
    });

    return {
      label: 'Oven',
      interactPosition: new Vector3(CENTER_X + localX, GAME_CONFIG.player.height, HOUSE_CENTER_Z + localZ + depth / 2 + 1.05),
      aimPosition: new Vector3(CENTER_X + localX, 0.94, HOUSE_CENTER_Z + localZ + depth / 2 + 0.12),
      doorPivot: ovenDoorPivot,
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
    };
  };

  const addUpperCupboard = (localX: number, localZ: number, width = 2.12, label = 'Upper Cupboards'): ChapterSevenCupboard => {
    const cupboard = new Group();
    cupboard.position.set(localX, 4.02, localZ);

    const height = 1.35;
    const depth = 0.92;
    const back = new Mesh(new BoxGeometry(width, height, 0.12), cabinetMaterial);
    back.position.set(0, height / 2, -depth / 2 + 0.06);
    const leftSide = new Mesh(new BoxGeometry(0.12, height, depth), cabinetMaterial);
    leftSide.position.set(-width / 2 + 0.06, height / 2, 0);
    const rightSide = leftSide.clone();
    rightSide.position.x = width / 2 - 0.06;
    const top = new Mesh(new BoxGeometry(width, 0.12, depth), cabinetMaterial);
    top.position.set(0, height - 0.06, 0);
    const bottom = top.clone();
    bottom.position.y = 0.06;
    const lowerShelf = new Mesh(new BoxGeometry(width - 0.18, 0.08, depth - 0.16), furnitureWoodMaterial);
    lowerShelf.position.set(0, height * 0.38, 0);
    const upperShelf = lowerShelf.clone();
    upperShelf.position.y = height * 0.68;
    addCabinetCookies(cupboard, localX, label, [height * 0.38, height * 0.68], width, depth);
    cupboard.add(back, leftSide, rightSide, top, bottom, lowerShelf, upperShelf);

    const leftDoorPivot = new Group();
    leftDoorPivot.position.set(-width / 2, 0, depth / 2 + 0.04);
    const leftDoor = new Mesh(new BoxGeometry(width / 2, height, 0.1), furnitureWoodMaterial);
    leftDoor.position.set(width / 4, height / 2, 0);
    const leftHandle = new Mesh(new BoxGeometry(0.06, 0.42, 0.06), fridgeSealMaterial);
    leftHandle.position.set(width / 2 - 0.18, height / 2, 0.08);
    leftDoorPivot.add(leftDoor, leftHandle);

    const rightDoorPivot = new Group();
    rightDoorPivot.position.set(width / 2, 0, depth / 2 + 0.04);
    const rightDoor = new Mesh(new BoxGeometry(width / 2, height, 0.1), furnitureWoodMaterial);
    rightDoor.position.set(-width / 4, height / 2, 0);
    const rightHandle = new Mesh(new BoxGeometry(0.06, 0.42, 0.06), fridgeSealMaterial);
    rightHandle.position.set(-(width / 2 - 0.18), height / 2, 0.08);
    rightDoorPivot.add(rightDoor, rightHandle);
    cupboard.add(leftDoorPivot, rightDoorPivot);

    house.add(cupboard);
    const interactPosition = new Vector3(CENTER_X + localX, GAME_CONFIG.player.height, HOUSE_CENTER_Z + localZ + depth / 2 + 0.9);
    return {
      label,
      interactPosition,
      aimPosition: new Vector3(CENTER_X + localX, 4.7, HOUSE_CENTER_Z + localZ + depth / 2 + 0.08),
      doorPivots: [leftDoorPivot, rightDoorPivot],
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
    };
  };

  const frontRightWindowX = Math.min(1226.75 - CENTER_X, HOUSE_WIDTH / 2 - 1.45);
  addExteriorWallWithOpenings(-HOUSE_DEPTH / 2, [
    {
      centerX: 1224.76 - CENTER_X,
      centerY: 2.75,
      width: 1.7,
      height: 1.25,
    },
    {
      centerX: 1193.08 - CENTER_X,
      centerY: 2.2,
      width: 2.9,
      height: 1.9,
    },
  ]);
  addCollider(colliders, CENTER_X, HOUSE_BACK_Z, HOUSE_WIDTH, HOUSE_WALL_THICKNESS);
  addHouseWall(
    HOUSE_MARKER_SHORT_WALL_X,
    HOUSE_MARKER_SHORT_WALL_START_Z + HOUSE_MARKER_SHORT_WALL_LENGTH / 2,
    HOUSE_INTERIOR_WALL_THICKNESS,
    HOUSE_MARKER_SHORT_WALL_LENGTH,
  );

  const leftWall = new Mesh(new BoxGeometry(HOUSE_WALL_THICKNESS, HOUSE_HEIGHT, HOUSE_DEPTH), houseWallMaterial);
  leftWall.position.set(-HOUSE_WIDTH / 2, HOUSE_HEIGHT / 2, 0);
  house.add(leftWall);
  addCollider(colliders, CENTER_X - HOUSE_WIDTH / 2, HOUSE_CENTER_Z, HOUSE_WALL_THICKNESS, HOUSE_DEPTH);

  const sideGlassDoorZ = 83.16 - HOUSE_CENTER_Z;
  const sideGlassDoorWidth = 6.8;
  const sideGlassDoorHeight = 4.45;
  const sideGlassDoorStartZ = sideGlassDoorZ - sideGlassDoorWidth / 2;
  const sideGlassDoorEndZ = sideGlassDoorZ + sideGlassDoorWidth / 2;
  const rightBackWallDepth = sideGlassDoorStartZ + HOUSE_DEPTH / 2;
  const rightFrontWallDepth = HOUSE_DEPTH / 2 - sideGlassDoorEndZ;
  const rightBackWall = new Mesh(new BoxGeometry(HOUSE_WALL_THICKNESS, HOUSE_HEIGHT, rightBackWallDepth), houseWallMaterial);
  rightBackWall.position.set(HOUSE_WIDTH / 2, HOUSE_HEIGHT / 2, -HOUSE_DEPTH / 2 + rightBackWallDepth / 2);
  const rightFrontWall = new Mesh(new BoxGeometry(HOUSE_WALL_THICKNESS, HOUSE_HEIGHT, rightFrontWallDepth), houseWallMaterial);
  rightFrontWall.position.set(HOUSE_WIDTH / 2, HOUSE_HEIGHT / 2, sideGlassDoorEndZ + rightFrontWallDepth / 2);
  const rightWallHeader = new Mesh(
    new BoxGeometry(HOUSE_WALL_THICKNESS, HOUSE_HEIGHT - sideGlassDoorHeight, sideGlassDoorWidth + HOUSE_WALL_THICKNESS),
    houseWallMaterial,
  );
  rightWallHeader.position.set(
    HOUSE_WIDTH / 2,
    sideGlassDoorHeight + (HOUSE_HEIGHT - sideGlassDoorHeight) / 2,
    sideGlassDoorZ,
  );
  house.add(rightBackWall, rightFrontWall, rightWallHeader);
  addCollider(
    colliders,
    CENTER_X + HOUSE_WIDTH / 2,
    HOUSE_CENTER_Z - HOUSE_DEPTH / 2 + rightBackWallDepth / 2,
    HOUSE_WALL_THICKNESS,
    rightBackWallDepth,
  );
  addCollider(
    colliders,
    CENTER_X + HOUSE_WIDTH / 2,
    HOUSE_CENTER_Z + sideGlassDoorEndZ + rightFrontWallDepth / 2,
    HOUSE_WALL_THICKNESS,
    rightFrontWallDepth,
  );

  const frontWallSegmentWidth = (HOUSE_WIDTH - HOUSE_DOOR_WIDTH) / 2;
  addExteriorWallWithOpenings(HOUSE_DEPTH / 2, [
    {
      centerX: 0,
      centerY: HOUSE_DOOR_HEIGHT / 2,
      width: HOUSE_DOOR_WIDTH,
      height: HOUSE_DOOR_HEIGHT,
    },
    {
      centerX: frontRightWindowX,
      centerY: 2.38,
      width: 2.8,
      height: 1.9,
    },
    {
      centerX: 1191.26 - CENTER_X,
      centerY: 2.1,
      width: 2.9,
      height: 1.9,
    },
  ]);
  addCollider(
    colliders,
    CENTER_X - (HOUSE_DOOR_WIDTH / 2 + frontWallSegmentWidth / 2),
    HOUSE_FRONT_Z,
    frontWallSegmentWidth,
    HOUSE_WALL_THICKNESS,
  );

  addCollider(
    colliders,
    CENTER_X + HOUSE_DOOR_WIDTH / 2 + frontWallSegmentWidth / 2,
    HOUSE_FRONT_Z,
    frontWallSegmentWidth,
    HOUSE_WALL_THICKNESS,
  );

  addHouseWall(
    1218.25 - CENTER_X,
    98.69 - HOUSE_CENTER_Z - 10,
    HOUSE_WALL_THICKNESS,
    20,
  );
  addWallWindow(
    frontRightWindowX,
    HOUSE_DEPTH / 2 - HOUSE_WALL_THICKNESS / 2 - 0.04,
    2.38,
    2.8,
    1.9,
  );
  addWallWindow(
    1191.26 - CENTER_X,
    HOUSE_DEPTH / 2 - HOUSE_WALL_THICKNESS / 2 - 0.04,
    2.1,
    2.9,
    1.9,
  );
  addWallWindow(
    1224.76 - CENTER_X,
    -HOUSE_DEPTH / 2 + HOUSE_WALL_THICKNESS / 2 + 0.04,
    2.75,
    1.7,
    1.25,
  );
  addWallWindow(
    1193.08 - CENTER_X,
    -HOUSE_DEPTH / 2 + HOUSE_WALL_THICKNESS / 2 + 0.04,
    2.2,
    2.9,
    1.9,
  );

  const roomDoors: ChapterSevenHouseDoor[] = [];
  const roomDoorHalfWidth = HOUSE_ROOM_DOOR_WIDTH / 2;
  const leftRoomWidth = HOUSE_LEFT_ROOM_WALL_X + HOUSE_WIDTH / 2;
  const leftRoomCenterX = -HOUSE_WIDTH / 2 + leftRoomWidth / 2;
  const partitionSegments: Array<[number, number]> = [
    [-HOUSE_DEPTH / 2, HOUSE_BACK_ROOM_DOOR_Z - roomDoorHalfWidth],
    [HOUSE_BACK_ROOM_DOOR_Z + roomDoorHalfWidth, HOUSE_BACK_ROOM_FRONT_Z],
    [HOUSE_FRONT_ROOM_BACK_Z, HOUSE_FRONT_ROOM_DOOR_Z - roomDoorHalfWidth],
    [HOUSE_FRONT_ROOM_DOOR_Z + roomDoorHalfWidth, HOUSE_DEPTH / 2],
  ];
  partitionSegments.forEach(([segmentStart, segmentEnd]) => {
    if (segmentEnd <= segmentStart) {
      return;
    }

    addHouseWall(
      HOUSE_LEFT_ROOM_WALL_X,
      (segmentStart + segmentEnd) / 2,
      HOUSE_INTERIOR_WALL_THICKNESS,
      segmentEnd - segmentStart,
    );
  });
  addHouseWall(
    leftRoomCenterX,
    HOUSE_BACK_ROOM_FRONT_Z,
    leftRoomWidth,
    HOUSE_INTERIOR_WALL_THICKNESS,
  );
  addHouseWall(
    leftRoomCenterX,
    HOUSE_FRONT_ROOM_BACK_Z,
    leftRoomWidth,
    HOUSE_INTERIOR_WALL_THICKNESS,
  );
  [HOUSE_FRONT_ROOM_DOOR_Z, HOUSE_BACK_ROOM_DOOR_Z].forEach((doorZ) => {
    const roomDoorHeader = new Mesh(
      new BoxGeometry(
        HOUSE_INTERIOR_WALL_THICKNESS,
        HOUSE_HEIGHT - HOUSE_ROOM_DOOR_HEIGHT,
        HOUSE_ROOM_DOOR_WIDTH,
      ),
      houseWallMaterial,
    );
    roomDoorHeader.position.set(
      HOUSE_LEFT_ROOM_WALL_X,
      HOUSE_ROOM_DOOR_HEIGHT + (HOUSE_HEIGHT - HOUSE_ROOM_DOOR_HEIGHT) / 2,
      doorZ,
    );
    house.add(roomDoorHeader);
  });

  roomDoors.push(
    createHouseDoor(
      'Front Left Bedroom Door',
      'side',
      HOUSE_LEFT_ROOM_WALL_X + HOUSE_INTERIOR_WALL_THICKNESS / 2 + 0.08,
      HOUSE_FRONT_ROOM_DOOR_Z - roomDoorHalfWidth,
      HOUSE_ROOM_DOOR_WIDTH,
      HOUSE_ROOM_DOOR_HEIGHT,
      HOUSE_LEFT_ROOM_WALL_X,
      HOUSE_FRONT_ROOM_DOOR_Z,
      HOUSE_INTERIOR_WALL_THICKNESS,
      HOUSE_ROOM_DOOR_WIDTH,
      HOUSE_LEFT_ROOM_WALL_X + 2.25,
      HOUSE_FRONT_ROOM_DOOR_Z,
      1,
    ),
    createHouseDoor(
      'Back Left Bedroom Door',
      'side',
      HOUSE_LEFT_ROOM_WALL_X + HOUSE_INTERIOR_WALL_THICKNESS / 2 + 0.08,
      HOUSE_BACK_ROOM_DOOR_Z - roomDoorHalfWidth,
      HOUSE_ROOM_DOOR_WIDTH,
      HOUSE_ROOM_DOOR_HEIGHT,
      HOUSE_LEFT_ROOM_WALL_X,
      HOUSE_BACK_ROOM_DOOR_Z,
      HOUSE_INTERIOR_WALL_THICKNESS,
      HOUSE_ROOM_DOOR_WIDTH,
      HOUSE_LEFT_ROOM_WALL_X + 2.25,
      HOUSE_BACK_ROOM_DOOR_Z,
      1,
    ),
  );
  addBed(-23.55, 10.6, 1, 'Front bedroom bed');
  addBed(-23.55, -10.6, -1, 'Back bedroom bed');
  const rockingChairX = 1200.10 - CENTER_X;
  const rockingChairZ = 63.31 - HOUSE_CENTER_Z;
  const rockingChairCornerX = HOUSE_LEFT_ROOM_WALL_X;
  const rockingChairCornerZ = -HOUSE_DEPTH / 2;
  addRockingChair(
    rockingChairX,
    rockingChairZ,
    Math.atan2(
      -(rockingChairCornerX - rockingChairX),
      -(rockingChairCornerZ - rockingChairZ),
    ),
  );
  addDiningTable(leftRoomCenterX, 0);
  addYellowCouch(
    1233.90 - CENTER_X - 3.4,
    97.63 - HOUSE_CENTER_Z,
    0,
  );
  addBookshelf(-25.05, -0.1, Math.PI / 2, 0.58, 0.84);
  const oldWoodenCloset = addOldWoodenCloset(-24.45, -2.55, Math.PI / 2);
  const houseDrawer = addDrawer(-25.05, 2.4, Math.PI / 2, 'Table Drawer');
  const backBedroomDoorFacingDrawer = addDrawer(
    1187.12 - CENTER_X,
    74.07 - HOUSE_CENTER_Z,
    Math.atan2(
      HOUSE_LEFT_ROOM_WALL_X + 2.25 - (1187.12 - CENTER_X),
      HOUSE_BACK_ROOM_DOOR_Z - (74.07 - HOUSE_CENTER_Z),
    ),
    'Back bedroom door-facing drawer',
  );
  const frontBedroomMarkerDrawer = addDrawer(
    1186.79 - CENTER_X,
    85.79 - HOUSE_CENTER_Z,
    Math.atan2(
      HOUSE_LEFT_ROOM_WALL_X + 2.25 - (1186.79 - CENTER_X),
      HOUSE_FRONT_ROOM_DOOR_Z - (85.79 - HOUSE_CENTER_Z),
    ),
    'Front bedroom marker drawer',
  );
  const houseFridge = addFridge(HOUSE_FRIDGE_X, HOUSE_FRIDGE_Z);
  const houseBaseCabinets = [
    addKitchenCounter(HOUSE_FRIDGE_X + 2.3, HOUSE_FRIDGE_Z, 2.28, 'Counter base cabinet'),
  ];
  const houseOven = addStove(HOUSE_FRIDGE_X + 4.7, HOUSE_FRIDGE_Z);
  const kitchenSink = addKitchenSink(HOUSE_FRIDGE_X + 9.1, HOUSE_FRIDGE_Z, 2.05);
  const kitchenUpperCupboards = [
    addUpperCupboard(HOUSE_FRIDGE_X, HOUSE_FRIDGE_Z, 1.62, 'Upper cupboards over the fridge'),
    addUpperCupboard(HOUSE_FRIDGE_X + 2.3, HOUSE_FRIDGE_Z, 2.1, 'Upper cupboards over the counter'),
    addUpperCupboard(HOUSE_FRIDGE_X + 4.7, HOUSE_FRIDGE_Z, 1.74, 'Upper cupboards over the oven'),
    addUpperCupboard(HOUSE_FRIDGE_X + 7.42, HOUSE_FRIDGE_Z, 2.75, 'Right upper cupboards'),
    addUpperCupboard(HOUSE_FRIDGE_X + 9.0, HOUSE_FRIDGE_Z, 1.95, 'End upper cupboards'),
  ];
  const houseUpperCupboards = [...kitchenUpperCupboards];
  const houseUpperCupboard = houseUpperCupboards[0];
  [
    { x: HOUSE_FRIDGE_X + 6.9, label: 'Right base cabinet' },
    { x: HOUSE_FRIDGE_X + 11.3, label: 'End right base cabinet' },
  ].forEach((counter) => {
    houseBaseCabinets.push(addKitchenCounter(counter.x, HOUSE_FRIDGE_Z, 2.05, counter.label));
  });
  const houseDrawers = [
    ...houseDrawer.drawerSlides,
    ...backBedroomDoorFacingDrawer.drawerSlides,
    ...frontBedroomMarkerDrawer.drawerSlides,
  ];
  const houseCabinets = [...houseUpperCupboards, ...houseBaseCabinets];

  const roofHalfWidth = HOUSE_WIDTH / 2 + HOUSE_ROOF_OVERHANG;
  const roofDepth = HOUSE_DEPTH + HOUSE_ROOF_OVERHANG * 2;
  const roofSlopeLength = Math.hypot(roofHalfWidth, HOUSE_ROOF_RISE);
  const roofAngle = Math.atan2(HOUSE_ROOF_RISE, roofHalfWidth);
  const roofEaveY = HOUSE_HEIGHT + 0.55;
  const roofRidgeY = HOUSE_HEIGHT + HOUSE_ROOF_RISE;
  const roofCenterY = (roofEaveY + roofRidgeY) / 2;

  const roofEndShape = new Shape();
  roofEndShape.moveTo(-roofHalfWidth, HOUSE_HEIGHT);
  roofEndShape.lineTo(roofHalfWidth, HOUSE_HEIGHT);
  roofEndShape.lineTo(0, roofRidgeY - 0.12);
  roofEndShape.lineTo(-roofHalfWidth, HOUSE_HEIGHT);
  const frontGable = new Mesh(new ShapeGeometry(roofEndShape), houseWallMaterial);
  frontGable.position.z = roofDepth / 2 + 0.03;
  const backGable = new Mesh(new ShapeGeometry(roofEndShape), houseWallMaterial);
  backGable.position.z = -roofDepth / 2 - 0.03;
  backGable.rotation.y = Math.PI;

  const wallGableShape = new Shape();
  wallGableShape.moveTo(-HOUSE_WIDTH / 2, HOUSE_HEIGHT);
  wallGableShape.lineTo(HOUSE_WIDTH / 2, HOUSE_HEIGHT);
  wallGableShape.lineTo(0, roofRidgeY - 0.28);
  wallGableShape.lineTo(-HOUSE_WIDTH / 2, HOUSE_HEIGHT);
  const frontWallGable = new Mesh(new ShapeGeometry(wallGableShape), houseWallMaterial);
  frontWallGable.position.z = HOUSE_DEPTH / 2 + HOUSE_WALL_THICKNESS / 2 + 0.04;
  const backWallGable = new Mesh(new ShapeGeometry(wallGableShape), houseWallMaterial);
  backWallGable.position.z = -HOUSE_DEPTH / 2 - HOUSE_WALL_THICKNESS / 2 - 0.04;
  backWallGable.rotation.y = Math.PI;

  const leftRoof = new Mesh(new BoxGeometry(roofSlopeLength, HOUSE_ROOF_THICKNESS, roofDepth), houseRoofMaterial);
  leftRoof.position.set(-roofHalfWidth / 2, roofCenterY, 0);
  leftRoof.rotation.z = roofAngle;
  const rightRoof = new Mesh(new BoxGeometry(roofSlopeLength, HOUSE_ROOF_THICKNESS, roofDepth), houseRoofMaterial);
  rightRoof.position.set(roofHalfWidth / 2, roofCenterY, 0);
  rightRoof.rotation.z = -roofAngle;
  const ridgeCap = new Mesh(new BoxGeometry(0.72, HOUSE_ROOF_THICKNESS, roofDepth + 0.3), houseTrimMaterial);
  ridgeCap.position.set(0, roofRidgeY + 0.02, 0);
  house.add(frontGable, backGable, frontWallGable, backWallGable, leftRoof, rightRoof, ridgeCap);

  const houseDoor = createHouseDoor(
    'House Front Door',
    'front',
    -HOUSE_DOOR_WIDTH / 2,
    HOUSE_DEPTH / 2 + 0.06,
    HOUSE_DOOR_WIDTH,
    HOUSE_DOOR_HEIGHT,
    0,
    HOUSE_DEPTH / 2,
    HOUSE_DOOR_WIDTH,
    HOUSE_WALL_THICKNESS,
    0,
    HOUSE_DEPTH / 2 + 2.2,
    -1,
  );
  const sideGlassDoor = createSlidingGlassDoor(
    'Right-side sliding glass door',
    HOUSE_WIDTH / 2 + 0.03,
    sideGlassDoorZ,
    sideGlassDoorWidth,
    sideGlassDoorHeight,
  );
  const porchWidth = 23.6;
  const porchDepth = 11.2;
  const porchGapWidth = 4.6;
  const porchCenterZ = HOUSE_DEPTH / 2 + porchDepth / 2 + 0.18;
  const porchFloor = new Mesh(new BoxGeometry(porchWidth, 0.18, porchDepth), furnitureWoodMaterial);
  porchFloor.position.set(0, 0.13, porchCenterZ);
  const porchPlanks = Array.from({ length: 24 }, (_, index) => -porchWidth / 2 + 1.05 + index * ((porchWidth - 2.1) / 23)).map((plankX) => {
    const plankLine = new Mesh(new BoxGeometry(0.035, 0.02, porchDepth - 0.24), houseTrimMaterial);
    plankLine.position.set(plankX, 0.24, porchCenterZ);
    return plankLine;
  });
  const porchSideRailDepth = porchDepth - 0.35;
  const porchFrontZ = HOUSE_DEPTH / 2 + porchDepth + 0.18;
  const frontRailSegmentWidth = (porchWidth - porchGapWidth) / 2;
  const createPorchRail = (
    centerX: number,
    centerZ: number,
    length: number,
    direction: 'x' | 'z',
  ): Mesh[] => {
    const alongX = direction === 'x';
    const railPieces: Mesh[] = [];
    const topRail = new Mesh(
      new BoxGeometry(alongX ? length : 0.2, 0.16, alongX ? 0.22 : length),
      houseTrimMaterial,
    );
    topRail.position.set(centerX, 1.3, centerZ);
    const bottomRail = new Mesh(
      new BoxGeometry(alongX ? length : 0.18, 0.12, alongX ? 0.18 : length),
      houseTrimMaterial,
    );
    bottomRail.position.set(centerX, 0.66, centerZ);
    railPieces.push(topRail, bottomRail);

    const slatCount = Math.max(3, Math.floor(length / 0.72));
    for (let index = 0; index <= slatCount; index += 1) {
      const offset = -length / 2 + (length / slatCount) * index;
      const slat = new Mesh(
        new BoxGeometry(alongX ? 0.12 : 0.16, 0.82, alongX ? 0.16 : 0.12),
        furnitureWoodMaterial,
      );
      slat.position.set(
        centerX + (alongX ? offset : 0),
        0.96,
        centerZ + (alongX ? 0 : offset),
      );
      railPieces.push(slat);
    }

    return railPieces;
  };
  const leftPorchRail = createPorchRail(-porchWidth / 2, porchCenterZ + 0.08, porchSideRailDepth, 'z');
  const rightPorchRail = createPorchRail(porchWidth / 2, porchCenterZ + 0.08, porchSideRailDepth, 'z');
  const frontLeftRail = createPorchRail(
    -(porchGapWidth / 2 + frontRailSegmentWidth / 2),
    porchFrontZ,
    frontRailSegmentWidth,
    'x',
  );
  const frontRightRail = createPorchRail(
    porchGapWidth / 2 + frontRailSegmentWidth / 2,
    porchFrontZ,
    frontRailSegmentWidth,
    'x',
  );
  const porchPosts = [
    [-porchWidth / 2, HOUSE_DEPTH / 2 + 0.55],
    [porchWidth / 2, HOUSE_DEPTH / 2 + 0.55],
    [-porchWidth / 2, porchCenterZ + 0.08],
    [porchWidth / 2, porchCenterZ + 0.08],
    [-porchWidth / 2, porchFrontZ],
    [porchWidth / 2, porchFrontZ],
    [-porchGapWidth / 2, porchFrontZ],
    [porchGapWidth / 2, porchFrontZ],
  ].map(([postX, postZ]) => {
    const post = new Mesh(new BoxGeometry(0.38, 1.32, 0.38), houseTrimMaterial);
    post.position.set(postX, 0.72, postZ);
    return post;
  });
  const porchRoofDepth = porchDepth + 0.9;
  const porchRoofCenterZ = HOUSE_DEPTH / 2 + porchRoofDepth / 2 - 0.05;
  const porchRoofDrop = 1.05;
  const porchRoofAngle = Math.atan2(porchRoofDrop, porchRoofDepth);
  const porchRoof = new Mesh(new BoxGeometry(porchWidth + 1.1, 0.38, porchRoofDepth), houseRoofMaterial);
  porchRoof.position.set(0, 5.84, porchRoofCenterZ);
  porchRoof.rotation.x = porchRoofAngle;
  const porchRoofFrontTrim = new Mesh(new BoxGeometry(porchWidth + 1.25, 0.34, 0.34), houseTrimMaterial);
  porchRoofFrontTrim.position.set(0, 5.28, HOUSE_DEPTH / 2 + porchRoofDepth - 0.08);
  const porchRoofSideTrims = [
    [-porchWidth / 2 - 0.52, porchRoofCenterZ],
    [porchWidth / 2 + 0.52, porchRoofCenterZ],
  ].map(([trimX, trimZ]) => {
    const trim = new Mesh(new BoxGeometry(0.32, 0.34, porchRoofDepth), houseTrimMaterial);
    trim.position.set(trimX, 5.72, trimZ);
    trim.rotation.x = porchRoofAngle;
    return trim;
  });
  const porchRoofPosts = [
    [-porchWidth / 2, HOUSE_DEPTH / 2 + 0.72, 5.72],
    [porchWidth / 2, HOUSE_DEPTH / 2 + 0.72, 5.72],
    [-porchWidth / 2, porchFrontZ, 5.08],
    [porchWidth / 2, porchFrontZ, 5.08],
  ].map(([postX, postZ, postHeight]) => {
    const post = new Mesh(new BoxGeometry(0.34, postHeight, 0.34), houseTrimMaterial);
    post.position.set(postX, postHeight / 2, postZ);
    return post;
  });
  house.add(
    porchFloor,
    ...porchPlanks,
    ...leftPorchRail,
    ...rightPorchRail,
    ...frontLeftRail,
    ...frontRightRail,
    ...porchPosts,
    porchRoof,
    porchRoofFrontTrim,
    ...porchRoofSideTrims,
    ...porchRoofPosts,
  );
  const porchCenterTarget = { x: 0, z: porchCenterZ };
  const getChairRotationTowardPorchCenter = (localX: number, localZ: number): number => (
    Math.atan2(porchCenterTarget.x - localX, porchCenterTarget.z - localZ)
  );
  const leftPorchChairX = 1201.37 - CENTER_X;
  const leftPorchChairZ = 106.23 - HOUSE_CENTER_Z;
  const rightPorchChairX = 1219.47 - CENTER_X;
  const rightPorchChairZ = 101.48 - HOUSE_CENTER_Z;
  addRockingChair(leftPorchChairX, leftPorchChairZ, getChairRotationTowardPorchCenter(leftPorchChairX, leftPorchChairZ));
  addRockingChair(rightPorchChairX, rightPorchChairZ, getChairRotationTowardPorchCenter(rightPorchChairX, rightPorchChairZ));
  const cardboardBox = addCardboardBox(1199.92 - CENTER_X, 100.53 - HOUSE_CENTER_Z);
  const yardFenceStartX = HOUSE_WIDTH / 2 + HOUSE_WALL_THICKNESS / 2;
  const yardFenceLength = 20;
  const frontYardFenceZ = 98.57 - HOUSE_CENTER_Z;
  const backYardFenceZ = 61.62 - HOUSE_CENTER_Z;
  addYardFenceRun(yardFenceStartX, frontYardFenceZ, yardFenceLength);
  addYardFenceRun(yardFenceStartX, backYardFenceZ, yardFenceLength);
  addYardFenceRun(yardFenceStartX + yardFenceLength, backYardFenceZ, frontYardFenceZ - backYardFenceZ, 'z');
  addCollider(colliders, CENTER_X - porchWidth / 2, HOUSE_CENTER_Z + porchCenterZ + 0.08, 0.34, porchSideRailDepth);
  addCollider(colliders, CENTER_X + porchWidth / 2, HOUSE_CENTER_Z + porchCenterZ + 0.08, 0.34, porchSideRailDepth);
  addCollider(colliders, CENTER_X - (porchGapWidth / 2 + frontRailSegmentWidth / 2), HOUSE_CENTER_Z + porchFrontZ, frontRailSegmentWidth, 0.34);
  addCollider(colliders, CENTER_X + porchGapWidth / 2 + frontRailSegmentWidth / 2, HOUSE_CENTER_Z + porchFrontZ, frontRailSegmentWidth, 0.34);
  const houseDoors = [houseDoor, sideGlassDoor, ...roomDoors];

  root.add(house);

  const light = new PointLight(0xfff0b8, 3.2, FOREST_SIZE * 0.72, 1.2);
  light.position.set(CENTER_X - 36, 34, CENTER_Z - 42);
  root.add(light);

  const treeTrunkGeometry = new CylinderGeometry(0.46, 0.62, 8.8, 10);
  const treeCrownBottomGeometry = new SphereGeometry(2.6, 12, 10);
  const treeCrownTopGeometry = new SphereGeometry(2.2, 12, 10);
  const trunkInstances = new InstancedMesh(treeTrunkGeometry, barkMaterial, TREE_COUNT);
  const crownBottomInstances = new InstancedMesh(treeCrownBottomGeometry, leafMaterial, TREE_COUNT);
  const crownTopInstances = new InstancedMesh(treeCrownTopGeometry, leafMaterial, TREE_COUNT);
  const dummy = new Object3D();
  let treeInstanceCount = 0;

  const addZombieStyleTree = (x: number, z: number, scale: number, yaw: number): void => {
    if (treeInstanceCount >= TREE_COUNT) {
      return;
    }

    dummy.position.set(x, 4.4 * scale, z);
    dummy.rotation.set((random() - 0.5) * 0.05, yaw, (random() - 0.5) * 0.06);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    trunkInstances.setMatrixAt(treeInstanceCount, dummy.matrix);

    dummy.position.set(x, 9.2 * scale, z);
    dummy.rotation.set(0, yaw, 0);
    dummy.scale.set(1.16 * scale, 0.82 * scale, 1.12 * scale);
    dummy.updateMatrix();
    crownBottomInstances.setMatrixAt(treeInstanceCount, dummy.matrix);

    const topOffsetX = (0.3 * Math.cos(yaw) + 0.18 * Math.sin(yaw)) * scale;
    const topOffsetZ = (0.3 * Math.sin(yaw) - 0.18 * Math.cos(yaw)) * scale;
    dummy.position.set(x + topOffsetX, 11.3 * scale, z + topOffsetZ);
    dummy.rotation.set(0, yaw, 0);
    dummy.scale.set(1.1 * scale, 0.88 * scale, 1.04 * scale);
    dummy.updateMatrix();
    crownTopInstances.setMatrixAt(treeInstanceCount, dummy.matrix);

    addCollider(colliders, x, z, 1.56 * scale, 1.56 * scale);
    treeInstanceCount += 1;
  };

  for (let attempts = 0; treeInstanceCount < TREE_COUNT && attempts < TREE_COUNT * 5; attempts += 1) {
    const x = CENTER_X + (random() - 0.5) * FOREST_SIZE * 0.94;
    const z = CENTER_Z + (random() - 0.5) * FOREST_SIZE * 0.94;
    const distanceFromSpawn = Math.hypot(x - CENTER_X, z - (CENTER_Z + 4));
    if (distanceFromSpawn < CLEARING_RADIUS + 8 + random() * 14) {
      continue;
    }

    const scale = 0.82 + random() * 0.56;
    addZombieStyleTree(x, z, scale, random() * Math.PI * 2);
  }

  trunkInstances.count = treeInstanceCount;
  crownBottomInstances.count = treeInstanceCount;
  crownTopInstances.count = treeInstanceCount;
  trunkInstances.instanceMatrix.needsUpdate = true;
  crownBottomInstances.instanceMatrix.needsUpdate = true;
  crownTopInstances.instanceMatrix.needsUpdate = true;
  trunkInstances.frustumCulled = false;
  crownBottomInstances.frustumCulled = false;
  crownTopInstances.frustumCulled = false;
  root.add(trunkInstances, crownBottomInstances, crownTopInstances);

  const grassGeometry = new ConeGeometry(0.08, 0.72, 5);
  const grassInstances = new InstancedMesh(grassGeometry, grassMaterial, GRASS_PATCH_COUNT);
  for (let index = 0; index < GRASS_PATCH_COUNT; index += 1) {
    const scale = 0.5 + random() * 0.95;
    dummy.position.set(
      CENTER_X + (random() - 0.5) * FOREST_SIZE * 0.96,
      getForestFloorY() + 0.34 * scale,
      CENTER_Z + (random() - 0.5) * FOREST_SIZE * 0.96,
    );
    dummy.rotation.set(0.12 + random() * 0.22, random() * Math.PI * 2, (random() - 0.5) * 0.28);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    grassInstances.setMatrixAt(index, dummy.matrix);
  }
  grassInstances.instanceMatrix.needsUpdate = true;
  grassInstances.frustumCulled = false;
  root.add(grassInstances);

  for (let index = 0; index < ROCK_COUNT; index += 1) {
    const x = CENTER_X + (random() - 0.5) * FOREST_SIZE * 0.88;
    const z = CENTER_Z + (random() - 0.5) * FOREST_SIZE * 0.88;
    if (Math.hypot(x - CENTER_X, z - (CENTER_Z + 4)) > CLEARING_RADIUS + 8) {
      addRock(root, rockMaterial, x, z, 0.7 + random() * 1.4);
    }
  }

  for (let index = 0; index < FALLEN_LOG_COUNT; index += 1) {
    const x = CENTER_X + (random() - 0.5) * FOREST_SIZE * 0.84;
    const z = CENTER_Z + (random() - 0.5) * FOREST_SIZE * 0.84;
    if (Math.hypot(x - CENTER_X, z - (CENTER_Z + 4)) < CLEARING_RADIUS + 6) {
      continue;
    }

    const length = 3.8 + random() * 3.2;
    const log = new Mesh(new CylinderGeometry(0.24, 0.24, length, 10), barkMaterial);
    log.position.set(x, getForestFloorY() + 0.25, z);
    log.rotation.set(Math.PI / 2, 0, random() * Math.PI);
    root.add(log);
    addCollider(colliders, x, z, length, 0.68);
  }

  addCollider(colliders, CENTER_X - HALF_SIZE - 1, CENTER_Z, 2, FOREST_SIZE + 10);
  addCollider(colliders, CENTER_X + HALF_SIZE + 1, CENTER_Z, 2, FOREST_SIZE + 10);
  addCollider(colliders, CENTER_X, CENTER_Z - HALF_SIZE - 1, FOREST_SIZE + 10, 2);
  addCollider(colliders, CENTER_X, CENTER_Z + HALF_SIZE + 1, FOREST_SIZE + 10, 2);

  const spawn = new Vector3(CENTER_X - 23.55, GAME_CONFIG.player.height + 1.38, HOUSE_CENTER_Z + 10.1);
  const lookTarget = new Vector3(CENTER_X + HOUSE_LEFT_ROOM_WALL_X, GAME_CONFIG.player.height * 0.86, HOUSE_CENTER_Z + HOUSE_FRONT_ROOM_DOOR_Z);

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    houseDoor,
    houseDoors,
    houseDrawer,
    houseDrawers,
    houseFridge,
    houseUpperCupboard,
    houseUpperCupboards,
    houseBaseCabinets,
    houseOven,
    oldWoodenCloset,
    cardboardBox,
    kitchenSink,
    getSupportedFloorY(position: Vector3, crawling = false): number | null {
      const insideForest = position.x >= CENTER_X - HALF_SIZE
        && position.x <= CENTER_X + HALF_SIZE
        && position.z >= CENTER_Z - HALF_SIZE
        && position.z <= CENTER_Z + HALF_SIZE;
      if (!insideForest) {
        counterSurfaces.forEach((surface) => {
          if (surface.collider) {
            surface.collider.enabled = true;
          }
        });
        bedSurfaces.forEach((surface) => {
          surface.collider.enabled = true;
        });
        cardboardBox.wallColliders.forEach((collider) => {
          collider.enabled = true;
        });
        return null;
      }

      const nearCardboardBox = Math.abs(position.x - cardboardBox.centerX) <= cardboardBox.halfWidth + GAME_CONFIG.player.radius + 0.34
        && Math.abs(position.z - cardboardBox.centerZ) <= cardboardBox.halfDepth + GAME_CONFIG.player.radius + 0.34;
      const highEnoughToClearCardboardBox = position.y > GAME_CONFIG.player.height + cardboardBox.wallHeight * 0.42;
      const lowEnoughToCrawlIntoCardboardBox = position.y < GAME_CONFIG.player.height - 0.25;
      const canClearCardboardBoxWalls = cardboardBox.openAmount > 0.72
        && nearCardboardBox
        && (highEnoughToClearCardboardBox || lowEnoughToCrawlIntoCardboardBox);
      cardboardBox.wallColliders.forEach((collider) => {
        collider.enabled = !canClearCardboardBoxWalls;
      });

      for (const surface of counterSurfaces) {
        if (surface.collider) {
          const nearSurface = Math.abs(position.x - surface.centerX) <= surface.halfWidth + GAME_CONFIG.player.radius + 0.28
            && Math.abs(position.z - surface.centerZ) <= surface.halfDepth + GAME_CONFIG.player.radius + 0.28;
          const highEnoughToClearSurface = position.y > GAME_CONFIG.player.height + 0.24;
          surface.collider.enabled = !(nearSurface && highEnoughToClearSurface);
        }
        const onSurface = Math.abs(position.x - surface.centerX) <= surface.halfWidth
          && Math.abs(position.z - surface.centerZ) <= surface.halfDepth;
        if (onSurface && position.y > GAME_CONFIG.player.height + 0.18) {
          return GAME_CONFIG.player.height + surface.floorY;
        }
      }

      let bedFloorY: number | null = null;
      bedSurfaces.forEach((surface) => {
        const nearSurface = Math.abs(position.x - surface.centerX) <= surface.halfWidth + GAME_CONFIG.player.radius + 0.28
          && Math.abs(position.z - surface.centerZ) <= surface.halfDepth + GAME_CONFIG.player.radius + 0.28;
        const highEnoughToClearFrame = position.y > GAME_CONFIG.player.height + 0.22;
        const lowEnoughToCrawlUnderBed = crawling || position.y < GAME_CONFIG.player.height - 0.25;
        surface.collider.enabled = !(nearSurface && (highEnoughToClearFrame || lowEnoughToCrawlUnderBed));
        const onSurface = Math.abs(position.x - surface.centerX) <= surface.halfWidth
          && Math.abs(position.z - surface.centerZ) <= surface.halfDepth;
        if (onSurface && highEnoughToClearFrame && !crawling) {
          bedFloorY = GAME_CONFIG.player.height + surface.floorY;
        }
      });

      if (bedFloorY !== null) {
        return bedFloorY;
      }

      return GAME_CONFIG.player.height + getForestFloorY();
    },
    isPlayerUnderBed(position: Vector3): boolean {
      return bedSurfaces.some((surface) => (
        Math.abs(position.x - surface.centerX) <= surface.halfWidth - 0.18
        && Math.abs(position.z - surface.centerZ) <= surface.halfDepth - 0.18
        && position.y < GAME_CONFIG.player.height - 0.15
      ));
    },
    update(deltaSeconds: number, playerPosition?: Vector3): void {
      forestTime += deltaSeconds;
      light.intensity = 2.85 + Math.sin(forestTime * 0.7) * 0.16;
      houseDoors.forEach((door) => {
        if (playerPosition && door.interactionMode !== 'manual') {
          const distanceToDoor = Math.hypot(
            playerPosition.x - door.collider.centerX,
            playerPosition.z - door.collider.centerZ,
          );
          door.targetOpenAmount = distanceToDoor <= door.pushRadius ? 1 : 0;
        }

        const doorDelta = door.targetOpenAmount - door.openAmount;
        if (Math.abs(doorDelta) > 0.001) {
          const step = Math.min(Math.abs(doorDelta), deltaSeconds * 3.8) * Math.sign(doorDelta);
          door.openAmount += step;
        } else {
          door.openAmount = door.targetOpenAmount;
        }
        if (door.slidePanes) {
          door.slidePanes.left.position.z = door.slidePanes.leftClosedZ - door.openAmount * door.slidePanes.slideDistance;
          door.slidePanes.right.position.z = door.slidePanes.rightClosedZ + door.openAmount * door.slidePanes.slideDistance;
        } else {
          door.doorPivot.rotation.y = door.openDirection * door.openAmount * Math.PI * 0.58;
        }
        door.open = door.targetOpenAmount > 0.5;
        door.collider.enabled = door.openAmount < 0.62;
      });

      houseDrawers.forEach((drawer) => {
        const drawerDelta = drawer.targetOpenAmount - drawer.openAmount;
        if (Math.abs(drawerDelta) > 0.001) {
          const step = Math.min(Math.abs(drawerDelta), deltaSeconds * 4.2) * Math.sign(drawerDelta);
          drawer.openAmount += step;
        } else {
          drawer.openAmount = drawer.targetOpenAmount;
        }
        drawer.root.position.z = drawer.closedZ + (drawer.openZ - drawer.closedZ) * drawer.openAmount;
        drawer.open = drawer.targetOpenAmount > 0.5;
      });

      const fridgeDelta = houseFridge.targetOpenAmount - houseFridge.openAmount;
      if (Math.abs(fridgeDelta) > 0.001) {
        const step = Math.min(Math.abs(fridgeDelta), deltaSeconds * 3.6) * Math.sign(fridgeDelta);
        houseFridge.openAmount += step;
      } else {
        houseFridge.openAmount = houseFridge.targetOpenAmount;
      }
      houseFridge.doorPivot.rotation.y = -houseFridge.openAmount * Math.PI * 0.55;
      houseFridge.open = houseFridge.targetOpenAmount > 0.5;

      houseCabinets.forEach((cupboard) => {
        const cupboardDelta = cupboard.targetOpenAmount - cupboard.openAmount;
        if (Math.abs(cupboardDelta) > 0.001) {
          const step = Math.min(Math.abs(cupboardDelta), deltaSeconds * 4.1) * Math.sign(cupboardDelta);
          cupboard.openAmount += step;
        } else {
          cupboard.openAmount = cupboard.targetOpenAmount;
        }
        cupboard.doorPivots[0].rotation.y = -cupboard.openAmount * Math.PI * 0.52;
        cupboard.doorPivots[1].rotation.y = cupboard.openAmount * Math.PI * 0.52;
        cupboard.open = cupboard.targetOpenAmount > 0.5;
      });

      const ovenDelta = houseOven.targetOpenAmount - houseOven.openAmount;
      if (Math.abs(ovenDelta) > 0.001) {
        const step = Math.min(Math.abs(ovenDelta), deltaSeconds * 3.6) * Math.sign(ovenDelta);
        houseOven.openAmount += step;
      } else {
        houseOven.openAmount = houseOven.targetOpenAmount;
      }
      houseOven.doorPivot.rotation.x = houseOven.openAmount * Math.PI * 0.48;
      houseOven.open = houseOven.targetOpenAmount > 0.5;

      const closetDelta = oldWoodenCloset.targetOpenAmount - oldWoodenCloset.openAmount;
      if (Math.abs(closetDelta) > 0.001) {
        const step = Math.min(Math.abs(closetDelta), deltaSeconds * 4.2) * Math.sign(closetDelta);
        oldWoodenCloset.openAmount += step;
      } else {
        oldWoodenCloset.openAmount = oldWoodenCloset.targetOpenAmount;
      }
      oldWoodenCloset.doorPivots[0].rotation.y = -oldWoodenCloset.openAmount * Math.PI * 0.62;
      oldWoodenCloset.doorPivots[1].rotation.y = oldWoodenCloset.openAmount * Math.PI * 0.62;
      oldWoodenCloset.open = oldWoodenCloset.targetOpenAmount > 0.5;
      oldWoodenCloset.doorCollider.enabled = oldWoodenCloset.openAmount < 0.58;

      const cardboardBoxDelta = cardboardBox.targetOpenAmount - cardboardBox.openAmount;
      if (Math.abs(cardboardBoxDelta) > 0.001) {
        const step = Math.min(Math.abs(cardboardBoxDelta), deltaSeconds * 4.6) * Math.sign(cardboardBoxDelta);
        cardboardBox.openAmount += step;
      } else {
        cardboardBox.openAmount = cardboardBox.targetOpenAmount;
      }
      cardboardBox.flapPivots.front.rotation.x = cardboardBox.openAmount * Math.PI * 0.72;
      cardboardBox.flapPivots.back.rotation.x = -cardboardBox.openAmount * Math.PI * 0.72;
      cardboardBox.open = cardboardBox.targetOpenAmount > 0.5;

      const sinkDelta = kitchenSink.targetOpenAmount - kitchenSink.openAmount;
      if (Math.abs(sinkDelta) > 0.001) {
        const step = Math.min(Math.abs(sinkDelta), deltaSeconds * 4.4) * Math.sign(sinkDelta);
        kitchenSink.openAmount += step;
      } else {
        kitchenSink.openAmount = kitchenSink.targetOpenAmount;
      }
      kitchenSink.handlePivot.rotation.z = -kitchenSink.openAmount * Math.PI * 0.52;
      kitchenSink.waterStream.visible = kitchenSink.openAmount > 0.03;
      kitchenSink.waterStream.scale.y = Math.max(0.01, kitchenSink.openAmount);
      kitchenSink.open = kitchenSink.targetOpenAmount > 0.5;
    },
    reset(): void {
      root.visible = false;
      houseDoors.forEach((door) => {
        door.open = false;
        door.openAmount = 0;
        door.targetOpenAmount = 0;
        door.doorPivot.rotation.y = 0;
        if (door.slidePanes) {
          door.slidePanes.left.position.z = door.slidePanes.leftClosedZ;
          door.slidePanes.right.position.z = door.slidePanes.rightClosedZ;
        }
        door.collider.enabled = true;
      });
      houseDrawers.forEach((drawer) => {
        drawer.open = false;
        drawer.openAmount = 0;
        drawer.targetOpenAmount = 0;
        drawer.root.position.z = drawer.closedZ;
      });
      bedSurfaces.forEach((surface) => {
        surface.collider.enabled = true;
      });
      counterSurfaces.forEach((surface) => {
        if (surface.collider) {
          surface.collider.enabled = true;
        }
      });
      houseFridge.open = false;
      houseFridge.openAmount = 0;
      houseFridge.targetOpenAmount = 0;
      houseFridge.doorPivot.rotation.y = 0;
      houseCabinets.forEach((cupboard) => {
        cupboard.open = false;
        cupboard.openAmount = 0;
        cupboard.targetOpenAmount = 0;
        cupboard.doorPivots.forEach((doorPivot) => {
          doorPivot.rotation.y = 0;
        });
      });
      houseOven.open = false;
      houseOven.openAmount = 0;
      houseOven.targetOpenAmount = 0;
      houseOven.doorPivot.rotation.x = 0;
      oldWoodenCloset.open = false;
      oldWoodenCloset.openAmount = 0;
      oldWoodenCloset.targetOpenAmount = 0;
      oldWoodenCloset.doorPivots.forEach((doorPivot) => {
        doorPivot.rotation.y = 0;
      });
      oldWoodenCloset.doorCollider.enabled = true;
      cardboardBox.open = false;
      cardboardBox.openAmount = 0;
      cardboardBox.targetOpenAmount = 0;
      cardboardBox.flapPivots.front.rotation.x = 0;
      cardboardBox.flapPivots.back.rotation.x = 0;
      cardboardBox.wallColliders.forEach((collider) => {
        collider.enabled = true;
      });
      kitchenSink.open = false;
      kitchenSink.openAmount = 0;
      kitchenSink.targetOpenAmount = 0;
      kitchenSink.handlePivot.rotation.z = 0;
      kitchenSink.waterStream.visible = false;
      kitchenSink.waterStream.scale.y = 0.01;
    },
  };
}
