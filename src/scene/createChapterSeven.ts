import {
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  PointLight,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  SpotLight,
  TubeGeometry,
  TorusGeometry,
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
  cookies: ChapterSevenCookiePickup[];
  houseFridge: ChapterSevenFridge;
  houseUpperCupboard: ChapterSevenCupboard;
  houseUpperCupboards: ChapterSevenCupboard[];
  houseBaseCabinets: ChapterSevenCupboard[];
  houseOven: ChapterSevenOven;
  oldWoodenCloset: ChapterSevenOldWoodenCloset;
  oldWoodenClosets: ChapterSevenOldWoodenCloset[];
  cardboardBox: ChapterSevenCardboardBox;
  kitchenSink: ChapterSevenKitchenSink;
  rearFixtures: ChapterSevenRearFixture[];
  remoteButtons: ChapterSevenRemoteButton[];
  swingSet: ChapterSevenSwingSet;
  refreshCookiesForDay(day: number, forceReroll?: boolean): void;
  setTelevisionPowered(powered: boolean): void;
  isTelevisionPowered(): boolean;
  getSupportedFloorY(position: Vector3, crawling?: boolean): number | null;
  isPlayerUnderBed(position: Vector3): boolean;
  isPlayerInsideOven(position: Vector3): boolean;
  isPlayerInForcedCrawlSpace(position: Vector3): boolean;
  setSwingOccupied(occupied: boolean): void;
  setSwingInput(input: number): void;
  startGrandfatherClockChime(): void;
  update(deltaSeconds: number, playerPosition?: Vector3, nightBlend?: number): void;
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
  cookies: ChapterSevenCookiePickup[];
  root: Group;
  closedZ: number;
  openZ: number;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
}

export interface ChapterSevenCookiePickup {
  label: string;
  root: Group;
  drawer?: ChapterSevenDrawerSlide;
  interactPosition: Vector3;
  aimPosition: Vector3;
  collected: boolean;
  active: boolean;
  shuffleSeed: number;
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
  collider: CollisionBox;
  centerX: number;
  centerZ: number;
  halfWidth: number;
  halfDepth: number;
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

export interface ChapterSevenRemoteButton {
  label: string;
  action: 'tv-toggle';
  interactPosition: Vector3;
  aimPosition: Vector3;
}

export interface ChapterSevenSwingSet {
  label: string;
  interactPosition: Vector3;
  aimPosition: Vector3;
  sitPosition: Vector3;
  exitPosition: Vector3;
  lookTarget: Vector3;
  seatAnchor: Group;
  lookAnchor: Group;
  pivot: Group;
  baseX: number;
  baseZ: number;
  rotationY: number;
  occupied: boolean;
  angle: number;
  swingPhase: number;
  swingPower: number;
}

export interface ChapterSevenRearFixture {
  label: string;
  kind: 'toilet' | 'bathroom-sink' | 'washing-machine' | 'dryer' | 'bathtub' | 'trash-can' | 'hose-faucet' | 'table-lamp';
  interactPosition: Vector3;
  aimPosition: Vector3;
  doorPivots: Group[];
  collider: CollisionBox;
  animation: 'toilet-lid' | 'faucet' | 'front-door' | 'bathtub-faucet' | 'trash-lid' | 'hose-faucet' | 'table-lamp';
  waterStream?: Mesh;
  waterSurface?: Mesh;
  waterSplash?: Mesh[];
  trashContents?: Group;
  lampLight?: PointLight;
  lampGlow?: Mesh;
  waterFillAmount?: number;
  wallColliders?: CollisionBox[];
  tubBounds?: {
    centerX: number;
    centerZ: number;
    halfWidth: number;
    halfDepth: number;
  };
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
  root: Group;
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
const FOREST_SIZE = 170;
const HALF_SIZE = FOREST_SIZE / 2;
const CLEARING_RADIUS = 30;
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
const HOUSE_REAR_ROOM_DOOR_X = 1209.28 - CENTER_X;
const HOUSE_REAR_ROOM_DOOR_Z = 61.31 - HOUSE_CENTER_Z;
const HOUSE_REAR_ROOM_WIDTH = 16.2;
const HOUSE_REAR_ROOM_DEPTH = 14.0;
const HOUSE_ROOF_RISE = 6.2;
const HOUSE_ROOF_OVERHANG = 2.2;
const HOUSE_ROOF_THICKNESS = 0.55;
const KITCHEN_COUNTER_BASE_HEIGHT = 1.08;
const KITCHEN_COUNTER_SURFACE_Y = KITCHEN_COUNTER_BASE_HEIGHT + 0.23;
const COOKIE_SURFACE_OFFSET = 0.03;
const TREE_COUNT = 160;
const GRASS_PATCH_COUNT = 280;
const ROCK_COUNT = 13;
const FALLEN_LOG_COUNT = 4;

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

function getRotatedBounds(width: number, depth: number, rotationY: number): { width: number; depth: number } {
  return {
    width: Math.abs(Math.cos(rotationY)) * width + Math.abs(Math.sin(rotationY)) * depth,
    depth: Math.abs(Math.sin(rotationY)) * width + Math.abs(Math.cos(rotationY)) * depth,
  };
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
  const crawlUnderTableColliders: Array<{
    collider: CollisionBox;
    centerX: number;
    centerZ: number;
    halfWidth: number;
    halfDepth: number;
  }> = [];
  const addCrawlUnderCollider = (
    collider: CollisionBox,
    centerX: number,
    centerZ: number,
    width: number,
    depth: number,
    inset = 0,
  ): void => {
    crawlUnderTableColliders.push({
      collider,
      centerX,
      centerZ,
      halfWidth: Math.max(0.2, width / 2 - inset),
      halfDepth: Math.max(0.2, depth / 2 - inset),
    });
  };
  const fishTankFish: Array<{
    fish: Group;
    baseX: number;
    baseY: number;
    baseZ: number;
    rangeX: number;
    rangeZ: number;
    speed: number;
    phase: number;
  }> = [];
  let forestTime = 0;
  let grandfatherClockChimeTimer = 0;
  const nightSkyMaterials: MeshBasicMaterial[] = [];
  const grandfatherClockMotionParts: Array<{
    rod: Mesh;
    rodBaseRotationZ: number;
    bob: Mesh;
    bobBaseX: number;
    weights: Mesh[];
    weightBaseYs: number[];
  }> = [];

  const createNightSkyMaterial = (color: number, opacity: number): MeshBasicMaterial => {
    const material = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    nightSkyMaterials.push(material);
    return material;
  };

  const random = createRandom(707);
  const groundMaterial = new MeshStandardMaterial({
    color: GRASS_COLOR,
    roughness: 1,
    metalness: 0,
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
  const yardTrailMaterial = new MeshStandardMaterial({
    color: 0xcaa56b,
    emissive: 0x231707,
    emissiveIntensity: 0.025,
    roughness: 0.96,
    metalness: 0.01,
  });
  const yardTrailEdgeMaterial = new MeshStandardMaterial({
    color: 0xa88355,
    emissive: 0x1b1107,
    emissiveIntensity: 0.025,
    roughness: 0.96,
    metalness: 0.01,
  });
  const yardTrailBrickMaterial = new MeshStandardMaterial({
    color: 0x9c7351,
    emissive: 0x1a0f08,
    emissiveIntensity: 0.02,
    roughness: 0.9,
    metalness: 0.02,
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
  const houseFloorMaterial = new MeshStandardMaterial({
    color: 0xc49b68,
    emissive: 0x1f1509,
    emissiveIntensity: 0.045,
    roughness: 0.88,
    metalness: 0.02,
  });
  const houseFloorBoardMaterials = [
    new MeshStandardMaterial({ color: 0xc79c61, emissive: 0x1f1408, emissiveIntensity: 0.035, roughness: 0.86, metalness: 0.02 }),
    new MeshStandardMaterial({ color: 0xd0ad78, emissive: 0x21170a, emissiveIntensity: 0.035, roughness: 0.86, metalness: 0.02 }),
    new MeshStandardMaterial({ color: 0xb98b54, emissive: 0x1b1007, emissiveIntensity: 0.035, roughness: 0.89, metalness: 0.02 }),
    new MeshStandardMaterial({ color: 0xd8be8a, emissive: 0x241a0c, emissiveIntensity: 0.035, roughness: 0.85, metalness: 0.02 }),
  ];
  const houseFloorGrooveMaterial = new MeshStandardMaterial({
    color: 0x8b6843,
    emissive: 0x120b05,
    emissiveIntensity: 0.035,
    roughness: 0.94,
    metalness: 0.01,
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
  const tvFrameMaterial = new MeshStandardMaterial({
    color: 0x111318,
    emissive: 0x010204,
    emissiveIntensity: 0.08,
    roughness: 0.48,
    metalness: 0.2,
  });
  const tvScreenMaterial = new MeshStandardMaterial({
    color: 0x182330,
    emissive: 0x07131f,
    emissiveIntensity: 0.35,
    roughness: 0.18,
    metalness: 0.08,
  });
  const createTelevisionNewsScreen = (): { material: MeshStandardMaterial; update(elapsedSeconds: number, powered: boolean): void } => {
    if (typeof document === 'undefined') {
      const material = new MeshStandardMaterial({
        color: 0x254a7a,
        emissive: 0x16345f,
        emissiveIntensity: 0.55,
        roughness: 0.2,
        metalness: 0.04,
      });
      return {
        material,
        update: () => {},
      };
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 288;
    const context = canvas.getContext('2d');
    const drawNewsFrame = (elapsedSeconds: number): void => {
      if (!context) {
        return;
      }

      const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#17345a');
      gradient.addColorStop(0.55, '#2b5d91');
      gradient.addColorStop(1, '#142238');
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = '#d82027';
      context.fillRect(0, 0, canvas.width, 48);
      context.fillStyle = '#ffffff';
      context.font = 'bold 34px Arial';
      context.textAlign = 'left';
      context.textBaseline = 'middle';
      context.fillText('BREAKING NEWS', 20, 25);

      context.fillStyle = '#1d2733';
      context.fillRect(30, 70, 150, 150);
      context.fillStyle = '#d8b48d';
      context.beginPath();
      context.arc(105, 122, 36, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#2d2018';
      context.fillRect(70, 86, 70, 24);
      context.fillStyle = '#314f7d';
      context.fillRect(60, 160, 90, 60);
      context.fillStyle = '#10151c';
      context.beginPath();
      context.arc(91, 120, 4, 0, Math.PI * 2);
      context.arc(119, 120, 4, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#10151c';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(84, 111);
      context.lineTo(98, 108);
      context.moveTo(112, 108);
      context.lineTo(126, 111);
      context.stroke();
      context.fillStyle = '#3b1613';
      const mouthOpen = 0.35 + Math.abs(Math.sin(elapsedSeconds * 13.5)) * 0.65;
      context.beginPath();
      context.ellipse(105, 140, 12, 4 + mouthOpen * 15, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#f1d1c2';
      context.fillRect(98, 138 + mouthOpen * 11, 14, 3);

      context.fillStyle = '#10263d';
      context.fillRect(210, 78, 270, 120);
      const waterGradient = context.createLinearGradient(210, 78, 480, 198);
      waterGradient.addColorStop(0, '#5fd8ff');
      waterGradient.addColorStop(0.5, '#247dc5');
      waterGradient.addColorStop(1, '#07375c');
      context.fillStyle = waterGradient;
      context.fillRect(220, 90, 250, 96);
      for (let wave = 0; wave < 5; wave += 1) {
        const waveY = 108 + wave * 15;
        const wavePhase = elapsedSeconds * (1.8 + wave * 0.18) + wave * 0.9;
        context.strokeStyle = wave % 2 === 0 ? 'rgba(220, 248, 255, 0.78)' : 'rgba(137, 220, 255, 0.72)';
        context.lineWidth = wave % 2 === 0 ? 3 : 2;
        context.beginPath();
        for (let point = 0; point <= 250; point += 10) {
          const x = 220 + point;
          const y = waveY + Math.sin(point * 0.055 + wavePhase) * (4 + wave);
          if (point === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }
        context.stroke();
      }
      context.fillStyle = 'rgba(255, 255, 255, 0.32)';
      context.beginPath();
      context.ellipse(348 + Math.sin(elapsedSeconds * 1.4) * 26, 116, 46, 8, -0.12, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#9fe8ff';
      context.lineWidth = 5;
      context.strokeRect(220, 90, 250, 96);

      context.fillStyle = '#f4f4f4';
      context.fillRect(0, 232, canvas.width, 56);
      context.fillStyle = '#c01620';
      context.fillRect(0, 232, 160, 56);
      context.fillStyle = '#ffffff';
      context.font = 'bold 25px Arial';
      context.fillText('LIVE', 50, 260);
      context.fillStyle = '#172233';
      context.font = 'bold 22px Arial';
      context.fillText('Breaking news: house TV is now on', 180, 260);
    };

    drawNewsFrame(0);

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new MeshStandardMaterial({
      map: texture,
      emissive: 0x18345b,
      emissiveIntensity: 0.55,
      roughness: 0.18,
      metalness: 0.05,
    });
    return {
      material,
      update(elapsedSeconds: number, powered: boolean): void {
        if (!powered) {
          return;
        }

        drawNewsFrame(elapsedSeconds);
        texture.needsUpdate = true;
      },
    };
  };
  const tvNewsScreen = createTelevisionNewsScreen();
  const smallTableLightTanMaterial = new MeshStandardMaterial({
    color: 0xd2aa72,
    emissive: 0x1f1408,
    emissiveIntensity: 0.04,
    roughness: 0.82,
    metalness: 0.02,
  });
  const smallTableDarkTanMaterial = new MeshStandardMaterial({
    color: 0x8f6237,
    emissive: 0x120805,
    emissiveIntensity: 0.045,
    roughness: 0.88,
    metalness: 0.02,
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
  const createWelcomeMatMaterial = (): MeshStandardMaterial => {
    if (typeof document === 'undefined') {
      return new MeshStandardMaterial({
        color: 0x6a3f25,
        roughness: 0.96,
        metalness: 0.01,
        side: DoubleSide,
      });
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#6a3f25';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#7f4f30';
      for (let stripe = 0; stripe < 18; stripe += 1) {
        context.fillRect(0, stripe * 16, canvas.width, 5);
      }
      context.strokeStyle = '#2d1b12';
      context.lineWidth = 14;
      context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
      context.strokeStyle = '#b88a5d';
      context.lineWidth = 5;
      context.strokeRect(34, 34, canvas.width - 68, canvas.height - 68);
      context.fillStyle = '#f0d7a8';
      context.font = 'bold 66px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('WELCOME', canvas.width / 2, canvas.height / 2 + 4);
      context.fillStyle = 'rgba(42, 24, 14, 0.22)';
      for (let dot = 0; dot < 170; dot += 1) {
        const x = (dot * 47) % canvas.width;
        const y = (dot * 89) % canvas.height;
        context.fillRect(x, y, 2, 2);
      }
    }
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return new MeshStandardMaterial({
      map: texture,
      roughness: 0.98,
      metalness: 0.01,
      side: DoubleSide,
    });
  };
  const welcomeMatMaterial = createWelcomeMatMaterial();
  const createHomeSweetHomeSignMaterial = (): MeshStandardMaterial => {
    if (typeof document === 'undefined') {
      return new MeshStandardMaterial({
        color: 0x8a5832,
        roughness: 0.86,
        metalness: 0.01,
      });
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#a66f3f');
      gradient.addColorStop(0.52, '#8b5831');
      gradient.addColorStop(1, '#6f4328');
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = 'rgba(74, 42, 22, 0.28)';
      for (let stripe = 0; stripe < 12; stripe += 1) {
        context.fillRect(0, stripe * 24 + 8, canvas.width, 5);
      }

      context.strokeStyle = '#3f2415';
      context.lineWidth = 14;
      context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
      context.strokeStyle = '#d8b277';
      context.lineWidth = 5;
      context.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

      context.fillStyle = '#f9e5b9';
      context.font = 'bold 54px Georgia';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('Home', canvas.width / 2, 82);
      context.font = 'bold 44px Georgia';
      context.fillText('Sweet Home', canvas.width / 2, 142);

      context.strokeStyle = '#f1d799';
      context.lineWidth = 6;
      [[94, 82, 154, 58], [418, 82, 358, 58], [94, 168, 154, 192], [418, 168, 358, 192]].forEach(([x1, y1, x2, y2]) => {
        context.beginPath();
        context.moveTo(x1, y1);
        context.bezierCurveTo((x1 + x2) / 2, y1 - 24, (x1 + x2) / 2, y2 + 24, x2, y2);
        context.stroke();
      });

      context.fillStyle = '#f7d87b';
      [[78, 56], [434, 56], [78, 198], [434, 198]].forEach(([x, y]) => {
        context.beginPath();
        context.arc(x, y, 9, 0, Math.PI * 2);
        context.fill();
      });
    }

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return new MeshStandardMaterial({
      map: texture,
      roughness: 0.84,
      metalness: 0.01,
    });
  };
  const homeSweetHomeSignMaterial = createHomeSweetHomeSignMaterial();
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
  const swingFrameMaterial = new MeshStandardMaterial({
    color: 0x9ec7df,
    roughness: 0.48,
    metalness: 0.42,
  });
  const swingConnectorMaterial = new MeshStandardMaterial({
    color: 0xe1b85a,
    roughness: 0.66,
    metalness: 0.14,
  });
  const swingChainMaterial = new MeshStandardMaterial({
    color: 0xbfc8d4,
    roughness: 0.38,
    metalness: 0.52,
  });
  const swingSeatMaterial = new MeshStandardMaterial({
    color: 0xd85e58,
    roughness: 0.74,
    metalness: 0.06,
  });
  const yellowCouchMaterial = new MeshStandardMaterial({
    color: 0xd4a82f,
    emissive: 0x211506,
    emissiveIntensity: 0.05,
    roughness: 0.86,
    metalness: 0.01,
  });
  const pinkFloorCushionMaterial = new MeshStandardMaterial({
    color: 0xf1a5c8,
    emissive: 0x26101a,
    emissiveIntensity: 0.045,
    roughness: 0.9,
    metalness: 0.01,
  });
  const pinkFloorCushionDetailMaterial = new MeshStandardMaterial({
    color: 0xc96f9e,
    emissive: 0x1c0912,
    emissiveIntensity: 0.045,
    roughness: 0.92,
    metalness: 0.01,
  });
  const colorfulRugMaterial = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 160;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#b64242';
      context.fillRect(0, 0, canvas.width, canvas.height);
      ['#e4b83c', '#3f8f70', '#315fa8', '#d76fa2'].forEach((color, index) => {
        context.fillStyle = color;
        context.fillRect(18 + index * 58, 18, 34, canvas.height - 36);
      });
      context.strokeStyle = '#f0d67a';
      context.lineWidth = 10;
      context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      context.strokeStyle = '#2e405c';
      context.lineWidth = 5;
      context.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);
    }
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return new MeshStandardMaterial({
      map: texture,
      roughness: 0.78,
      metalness: 0.01,
    });
  })();
  const createPortraitMaterial = (subject: 'dog' | 'cat'): MeshStandardMaterial => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 192;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = subject === 'dog' ? '#7fb2d8' : '#a58bd2';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = subject === 'dog' ? '#d6b07a' : '#ece4d7';
      context.beginPath();
      context.ellipse(128, 104, 56, 48, 0, 0, Math.PI * 2);
      context.fill();
      if (subject === 'dog') {
        context.fillStyle = '#8a5c33';
        context.beginPath();
        context.ellipse(82, 94, 22, 38, -0.34, 0, Math.PI * 2);
        context.ellipse(174, 94, 22, 38, 0.34, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#5c3924';
        context.beginPath();
        context.ellipse(128, 124, 18, 12, 0, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = '#5c3924';
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(128, 132);
        context.quadraticCurveTo(116, 144, 102, 134);
        context.moveTo(128, 132);
        context.quadraticCurveTo(140, 144, 154, 134);
        context.stroke();
      } else {
        context.fillStyle = '#ece4d7';
        context.beginPath();
        context.moveTo(83, 76);
        context.lineTo(103, 38);
        context.lineTo(119, 78);
        context.moveTo(137, 78);
        context.lineTo(157, 38);
        context.lineTo(177, 76);
        context.fill();
        context.fillStyle = '#8c6f54';
        context.beginPath();
        context.ellipse(128, 126, 15, 10, 0, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = '#8c6f54';
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(128, 134);
        context.quadraticCurveTo(117, 143, 105, 136);
        context.moveTo(128, 134);
        context.quadraticCurveTo(139, 143, 151, 136);
        context.stroke();
      }
      context.fillStyle = '#1e1a16';
      context.beginPath();
      context.arc(108, 104, 6, 0, Math.PI * 2);
      context.arc(148, 104, 6, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = 'rgba(255,255,255,0.4)';
      context.lineWidth = 8;
      context.strokeRect(18, 16, canvas.width - 36, canvas.height - 32);
    }
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return new MeshStandardMaterial({
      map: texture,
      roughness: 0.68,
      metalness: 0.02,
      side: DoubleSide,
    });
  };
  const dogPortraitMaterial = createPortraitMaterial('dog');
  const catPortraitMaterial = createPortraitMaterial('cat');
  const createFamilyPictureMaterial = (subject: 'baby' | 'swing'): MeshStandardMaterial => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 176;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = subject === 'baby' ? '#d9ecff' : '#b7d8ef';
      context.fillRect(0, 0, canvas.width, canvas.height);
      if (subject === 'baby') {
        const skyGradient = context.createLinearGradient(0, 0, 0, 118);
        skyGradient.addColorStop(0, '#ffffff');
        skyGradient.addColorStop(0.38, '#c4e3ff');
        skyGradient.addColorStop(1, '#ffffff');
        context.fillStyle = skyGradient;
        context.fillRect(0, 0, canvas.width, 124);

        context.fillStyle = 'rgba(255, 255, 255, 0.88)';
        for (let stripeY = 12; stripeY < 112; stripeY += 22) {
          context.fillRect(0, stripeY, canvas.width, 11);
        }
        context.fillStyle = 'rgba(105, 177, 239, 0.24)';
        context.beginPath();
        context.ellipse(52, 38, 36, 12, -0.12, 0, Math.PI * 2);
        context.ellipse(190, 42, 42, 14, 0.08, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = '#f8fbff';
        context.fillRect(0, 118, canvas.width, 58);
        context.strokeStyle = '#9fbee1';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(0, 126);
        context.lineTo(256, 126);
        context.moveTo(24, 146);
        context.lineTo(232, 146);
        context.moveTo(48, 164);
        context.lineTo(208, 164);
        context.stroke();

        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = '#edbc98';
        context.lineWidth = 15;
        context.beginPath();
        context.moveTo(68, 125);
        context.lineTo(38, 151);
        context.moveTo(157, 116);
        context.lineTo(200, 139);
        context.moveTo(184, 111);
        context.lineTo(224, 92);
        context.stroke();

        context.strokeStyle = '#edbc98';
        context.lineWidth = 16;
        context.beginPath();
        context.moveTo(94, 128);
        context.quadraticCurveTo(108, 148, 126, 135);
        context.moveTo(135, 126);
        context.quadraticCurveTo(151, 151, 169, 137);
        context.stroke();
        context.fillStyle = '#f6cfae';
        context.beginPath();
        context.ellipse(126, 136, 13, 9, -0.28, 0, Math.PI * 2);
        context.ellipse(169, 137, 13, 9, -0.2, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = '#f6cfae';
        context.beginPath();
        context.ellipse(118, 109, 58, 29, -0.08, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#fff7ed';
        context.beginPath();
        context.ellipse(86, 115, 31, 19, -0.12, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = '#d9c6af';
        context.lineWidth = 2;
        context.beginPath();
        context.arc(101, 109, 3, 0, Math.PI * 2);
        context.moveTo(63, 113);
        context.quadraticCurveTo(80, 121, 104, 116);
        context.stroke();

        context.fillStyle = '#f6cfae';
        context.beginPath();
        context.ellipse(193, 80, 38, 32, -0.18, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#8a6041';
        context.beginPath();
        context.ellipse(192, 58, 23, 8, -0.18, Math.PI, Math.PI * 2);
        context.fill();
        context.strokeStyle = '#6d4b36';
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(194, 51);
        context.bezierCurveTo(207, 39, 219, 50, 210, 60);
        context.bezierCurveTo(204, 67, 194, 61, 201, 55);
        context.stroke();
        context.fillStyle = '#6d4b36';
        context.beginPath();
        context.arc(181, 79, 4.5, 0, Math.PI * 2);
        context.arc(205, 78, 4.5, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = '#6d4b36';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(183, 98);
        context.quadraticCurveTo(194, 106, 207, 96);
        context.stroke();
      } else {
        const skyGradient = context.createLinearGradient(0, 0, 0, 132);
        skyGradient.addColorStop(0, '#9fd2f3');
        skyGradient.addColorStop(1, '#d9f0ff');
        context.fillStyle = skyGradient;
        context.fillRect(0, 0, canvas.width, 132);
        context.fillStyle = '#79b65f';
        context.fillRect(0, 128, canvas.width, 48);
        context.fillStyle = 'rgba(255,255,255,0.78)';
        context.beginPath();
        context.ellipse(58, 38, 32, 10, -0.08, 0, Math.PI * 2);
        context.ellipse(198, 42, 38, 12, 0.08, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = '#6b4a2f';
        context.lineWidth = 7;
        context.beginPath();
        context.moveTo(82, 20);
        context.lineTo(82, 104);
        context.moveTo(174, 20);
        context.lineTo(174, 104);
        context.stroke();
        context.strokeStyle = '#8a6b45';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(102, 30);
        context.lineTo(112, 104);
        context.moveTo(154, 30);
        context.lineTo(144, 104);
        context.stroke();
        context.fillStyle = '#6b4a2f';
        context.fillRect(96, 101, 64, 10);
        context.strokeStyle = '#f0bc8f';
        context.lineWidth = 8;
        context.lineCap = 'round';
        context.beginPath();
        context.moveTo(110, 98);
        context.lineTo(96, 82);
        context.moveTo(146, 98);
        context.lineTo(160, 82);
        context.stroke();
        context.fillStyle = '#f0bc8f';
        context.beginPath();
        context.arc(128, 67, 20, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#5b3a24';
        context.beginPath();
        context.ellipse(128, 51, 22, 9, 0, Math.PI, Math.PI * 2);
        context.fill();
        context.fillStyle = '#3f2c26';
        context.beginPath();
        context.arc(121, 66, 2.6, 0, Math.PI * 2);
        context.arc(135, 66, 2.6, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = '#7a392f';
        context.lineWidth = 2.4;
        context.beginPath();
        context.arc(128, 72, 8, 0.18, Math.PI - 0.18);
        context.stroke();
        context.fillStyle = '#3f5fb5';
        context.beginPath();
        context.roundRect(111, 88, 34, 38, 6);
        context.fill();
        context.strokeStyle = '#3a2b25';
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(117, 124);
        context.lineTo(105, 146);
        context.moveTo(140, 124);
        context.lineTo(153, 145);
        context.stroke();
      }
      context.strokeStyle = 'rgba(255,255,255,0.45)';
      context.lineWidth = 8;
      context.strokeRect(18, 14, canvas.width - 36, canvas.height - 28);
    }
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return new MeshStandardMaterial({
      map: texture,
      roughness: 0.68,
      metalness: 0.02,
      side: DoubleSide,
    });
  };
  const babyPortraitMaterial = createFamilyPictureMaterial('baby');
  const swingPortraitMaterial = createFamilyPictureMaterial('swing');
  const createTreePictureMaterial = (): MeshStandardMaterial => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 176;
    const context = canvas.getContext('2d');
    if (context) {
      const skyGradient = context.createLinearGradient(0, 0, 0, 122);
      skyGradient.addColorStop(0, '#8fc6ef');
      skyGradient.addColorStop(1, '#e3f5ff');
      context.fillStyle = skyGradient;
      context.fillRect(0, 0, canvas.width, 124);
      context.fillStyle = '#73ad55';
      context.fillRect(0, 120, canvas.width, 56);
      context.fillStyle = 'rgba(255,255,255,0.72)';
      context.beginPath();
      context.ellipse(58, 38, 34, 10, -0.08, 0, Math.PI * 2);
      context.ellipse(188, 34, 42, 12, 0.06, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#6c4428';
      context.beginPath();
      context.moveTo(115, 142);
      context.lineTo(139, 142);
      context.lineTo(135, 86);
      context.quadraticCurveTo(128, 78, 120, 86);
      context.closePath();
      context.fill();
      context.strokeStyle = '#4f3320';
      context.lineWidth = 5;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(128, 92);
      context.lineTo(102, 68);
      context.moveTo(130, 92);
      context.lineTo(154, 64);
      context.stroke();
      context.fillStyle = '#3f7d38';
      context.beginPath();
      context.ellipse(96, 70, 32, 25, -0.18, 0, Math.PI * 2);
      context.ellipse(132, 54, 42, 30, 0.06, 0, Math.PI * 2);
      context.ellipse(166, 74, 34, 27, 0.12, 0, Math.PI * 2);
      context.ellipse(130, 88, 48, 29, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#5a9b45';
      context.beginPath();
      context.ellipse(112, 55, 16, 9, -0.2, 0, Math.PI * 2);
      context.ellipse(151, 88, 20, 10, 0.18, 0, Math.PI * 2);
      context.fill();
    }
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return new MeshStandardMaterial({
      map: texture,
      roughness: 0.68,
      metalness: 0.02,
      side: DoubleSide,
    });
  };
  const treePortraitMaterial = createTreePictureMaterial();
  const createSquirrelPictureMaterial = (): MeshStandardMaterial => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 176;
    const context = canvas.getContext('2d');
    if (context) {
      const skyGradient = context.createLinearGradient(0, 0, 0, 100);
      skyGradient.addColorStop(0, '#9fc8ef');
      skyGradient.addColorStop(1, '#e7f3ff');
      context.fillStyle = skyGradient;
      context.fillRect(0, 0, canvas.width, 108);
      context.fillStyle = '#83b35b';
      context.fillRect(0, 108, canvas.width, 68);
      context.fillStyle = '#6d4226';
      context.beginPath();
      context.ellipse(92, 112, 30, 38, -0.12, 0, Math.PI * 2);
      context.ellipse(126, 78, 24, 22, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#8a5c33';
      context.beginPath();
      context.ellipse(58, 88, 30, 54, -0.55, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#5b351f';
      context.beginPath();
      context.ellipse(116, 62, 8, 16, -0.4, 0, Math.PI * 2);
      context.ellipse(136, 62, 8, 16, 0.4, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#24140c';
      context.beginPath();
      context.arc(134, 78, 3.8, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#3e2415';
      context.lineWidth = 5;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(119, 116);
      context.lineTo(151, 114);
      context.moveTo(110, 121);
      context.lineTo(149, 124);
      context.stroke();
      context.fillStyle = '#9a6a32';
      context.beginPath();
      context.ellipse(164, 116, 15, 21, 0.2, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#5b351f';
      context.beginPath();
      context.ellipse(164, 94, 17, 8, 0, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = 'rgba(255,255,255,0.45)';
      context.lineWidth = 8;
      context.strokeRect(18, 14, canvas.width - 36, canvas.height - 28);
    }
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return new MeshStandardMaterial({
      map: texture,
      roughness: 0.68,
      metalness: 0.02,
      side: DoubleSide,
    });
  };
  const squirrelPortraitMaterial = createSquirrelPictureMaterial();
  const createOceanDolphinPictureMaterial = (): MeshStandardMaterial => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 176;
    const context = canvas.getContext('2d');
    if (context) {
      const skyGradient = context.createLinearGradient(0, 0, 0, 92);
      skyGradient.addColorStop(0, '#79b8ed');
      skyGradient.addColorStop(1, '#d9f0ff');
      context.fillStyle = skyGradient;
      context.fillRect(0, 0, canvas.width, 96);

      context.fillStyle = '#fff7c8';
      context.beginPath();
      context.arc(216, 34, 20, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = 'rgba(255,255,255,0.82)';
      context.beginPath();
      context.ellipse(58, 42, 24, 10, 0, 0, Math.PI * 2);
      context.ellipse(80, 39, 18, 8, 0, 0, Math.PI * 2);
      context.ellipse(102, 44, 26, 9, 0, 0, Math.PI * 2);
      context.fill();

      const oceanGradient = context.createLinearGradient(0, 78, 0, canvas.height);
      oceanGradient.addColorStop(0, '#2e9ad1');
      oceanGradient.addColorStop(0.5, '#147ab0');
      oceanGradient.addColorStop(1, '#075c8e');
      context.fillStyle = oceanGradient;
      context.fillRect(0, 82, canvas.width, canvas.height - 82);

      context.strokeStyle = 'rgba(255,255,255,0.65)';
      context.lineWidth = 2.5;
      for (let y = 100; y < 164; y += 16) {
        context.beginPath();
        for (let x = -12; x < canvas.width + 12; x += 24) {
          context.quadraticCurveTo(x + 8, y - 6, x + 18, y);
          context.quadraticCurveTo(x + 28, y + 6, x + 40, y);
        }
        context.stroke();
      }

      const drawDolphin = (x: number, y: number, scale: number, flip: number): void => {
        context.save();
        context.translate(x, y);
        context.scale(scale * flip, scale);
        context.rotate(-0.18);
        context.fillStyle = '#6d8493';
        context.strokeStyle = '#3d5666';
        context.lineWidth = 2.5;
        context.beginPath();
        context.moveTo(-38, 0);
        context.bezierCurveTo(-22, -20, 20, -24, 42, -6);
        context.bezierCurveTo(22, 2, -4, 12, -34, 8);
        context.bezierCurveTo(-45, 14, -52, 9, -38, 0);
        context.closePath();
        context.fill();
        context.stroke();
        context.fillStyle = '#8fa6b3';
        context.beginPath();
        context.moveTo(-4, -16);
        context.lineTo(10, -36);
        context.lineTo(17, -12);
        context.closePath();
        context.fill();
        context.fillStyle = '#5b7485';
        context.beginPath();
        context.moveTo(-34, 0);
        context.lineTo(-55, -14);
        context.lineTo(-49, 6);
        context.lineTo(-60, 22);
        context.closePath();
        context.fill();
        context.fillStyle = '#111820';
        context.beginPath();
        context.arc(29, -8, 2.8, 0, Math.PI * 2);
        context.fill();
        context.restore();
      };

      drawDolphin(94, 84, 0.72, 1);
      drawDolphin(168, 76, 0.58, -1);

      context.strokeStyle = 'rgba(255,255,255,0.75)';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(93, 104, 23, Math.PI * 0.1, Math.PI * 0.9);
      context.arc(168, 96, 19, Math.PI * 0.1, Math.PI * 0.9);
      context.stroke();
      context.strokeStyle = 'rgba(255,255,255,0.45)';
      context.lineWidth = 8;
      context.strokeRect(18, 14, canvas.width - 36, canvas.height - 28);
    }
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return new MeshStandardMaterial({
      map: texture,
      roughness: 0.66,
      metalness: 0.02,
      side: DoubleSide,
    });
  };
  const oceanDolphinPortraitMaterial = createOceanDolphinPictureMaterial();
  const createPigPenPictureMaterial = (): MeshStandardMaterial => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 176;
    const context = canvas.getContext('2d');
    if (context) {
      const skyGradient = context.createLinearGradient(0, 0, 0, 82);
      skyGradient.addColorStop(0, '#9fd1f5');
      skyGradient.addColorStop(1, '#e6f4ff');
      context.fillStyle = skyGradient;
      context.fillRect(0, 0, canvas.width, 80);

      context.fillStyle = '#e7d27d';
      context.beginPath();
      context.arc(218, 34, 18, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = '#78a95b';
      context.fillRect(0, 76, canvas.width, 100);
      context.fillStyle = '#5e8f45';
      for (let blade = 0; blade < 90; blade += 1) {
        const x = (blade * 37) % canvas.width;
        const y = 78 + ((blade * 19) % 34);
        context.fillRect(x, y, 2, 7);
      }

      context.fillStyle = '#8a5a31';
      for (let post = 0; post < 7; post += 1) {
        const x = 18 + post * 36;
        context.fillRect(x, 70, 7, 72);
      }
      context.fillRect(10, 84, canvas.width - 20, 8);
      context.fillRect(10, 118, canvas.width - 20, 8);

      const mudGradient = context.createRadialGradient(130, 132, 12, 130, 132, 96);
      mudGradient.addColorStop(0, '#7b4b2d');
      mudGradient.addColorStop(0.62, '#5f351f');
      mudGradient.addColorStop(1, '#3f2216');
      context.fillStyle = mudGradient;
      context.beginPath();
      context.ellipse(128, 134, 92, 34, -0.03, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = 'rgba(195, 126, 72, 0.45)';
      context.lineWidth = 3;
      [92, 128, 166, 202].forEach((x, index) => {
        context.beginPath();
        context.ellipse(x, 132 + (index % 2) * 8, 24, 7, 0.14, 0, Math.PI * 2);
        context.stroke();
      });

      const drawPig = (x: number, y: number, scale: number, flip = 1, muddy = false): void => {
        context.save();
        context.translate(x, y);
        context.scale(scale * flip, scale);
        context.fillStyle = '#e99aa4';
        context.strokeStyle = '#9b5660';
        context.lineWidth = 2.4;
        context.beginPath();
        context.ellipse(0, 0, 28, 16, 0, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.beginPath();
        context.ellipse(24, -3, 14, 12, 0, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.fillStyle = '#d97986';
        context.beginPath();
        context.ellipse(34, -2, 7, 5, 0, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#563428';
        context.beginPath();
        context.arc(32, -3, 1.5, 0, Math.PI * 2);
        context.arc(37, -2, 1.5, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#f3b2bb';
        [[16, -13], [29, -13]].forEach(([earX, earY]) => {
          context.beginPath();
          context.moveTo(earX, earY);
          context.lineTo(earX + 8, earY - 12);
          context.lineTo(earX + 11, earY + 1);
          context.closePath();
          context.fill();
          context.stroke();
        });
        context.fillStyle = '#241815';
        context.beginPath();
        context.arc(27, -8, 2, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = '#9b5660';
        context.lineWidth = 2;
        context.beginPath();
        context.arc(-28, -1, 7, -Math.PI * 0.2, Math.PI * 1.35);
        context.stroke();
        context.fillStyle = '#b57550';
        if (muddy) {
          [[-8, 2, 7], [10, -5, 5], [23, 5, 4]].forEach(([spotX, spotY, radius]) => {
            context.beginPath();
            context.arc(spotX, spotY, radius, 0, Math.PI * 2);
            context.fill();
          });
        }
        context.restore();
      };

      drawPig(86, 123, 0.78, 1, true);
      drawPig(148, 116, 0.62, -1, true);
      drawPig(188, 137, 0.55, 1, true);

      context.fillStyle = 'rgba(77, 45, 24, 0.32)';
      context.beginPath();
      context.ellipse(84, 147, 24, 6, 0, 0, Math.PI * 2);
      context.ellipse(148, 140, 20, 5, 0, 0, Math.PI * 2);
      context.ellipse(188, 155, 18, 5, 0, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = 'rgba(255,255,255,0.55)';
      context.lineWidth = 7;
      context.strokeRect(15, 12, canvas.width - 30, canvas.height - 24);
    }

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return new MeshStandardMaterial({
      map: texture,
      roughness: 0.68,
      metalness: 0.02,
      side: DoubleSide,
    });
  };
  const pigPenPortraitMaterial = createPigPenPictureMaterial();
  const createDogOceanPictureMaterial = (): MeshStandardMaterial => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 176;
    const context = canvas.getContext('2d');
    if (context) {
      const skyGradient = context.createLinearGradient(0, 0, 0, 86);
      skyGradient.addColorStop(0, '#78b9ed');
      skyGradient.addColorStop(1, '#dff4ff');
      context.fillStyle = skyGradient;
      context.fillRect(0, 0, canvas.width, 86);

      context.fillStyle = '#fff4b8';
      context.beginPath();
      context.arc(218, 34, 19, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = 'rgba(255,255,255,0.82)';
      [[58, 38, 28, 10], [94, 44, 34, 9], [158, 32, 30, 8]].forEach(([x, y, rx, ry]) => {
        context.beginPath();
        context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        context.fill();
      });

      const waterGradient = context.createLinearGradient(0, 74, 0, canvas.height);
      waterGradient.addColorStop(0, '#2fa7da');
      waterGradient.addColorStop(0.55, '#147db6');
      waterGradient.addColorStop(1, '#075d8f');
      context.fillStyle = waterGradient;
      context.fillRect(0, 78, canvas.width, canvas.height - 78);

      context.strokeStyle = 'rgba(255,255,255,0.62)';
      context.lineWidth = 2.5;
      for (let y = 94; y < 164; y += 15) {
        context.beginPath();
        for (let x = -18; x < canvas.width + 20; x += 28) {
          context.quadraticCurveTo(x + 10, y - 5, x + 20, y);
          context.quadraticCurveTo(x + 30, y + 5, x + 42, y);
        }
        context.stroke();
      }

      const drawDog = (x: number, y: number, scale: number): void => {
        context.save();
        context.translate(x, y);
        context.scale(scale, scale);
        context.fillStyle = '#b6783f';
        context.strokeStyle = '#5f351e';
        context.lineWidth = 2.6;

        context.beginPath();
        context.ellipse(0, 12, 35, 17, -0.08, 0, Math.PI * 2);
        context.fill();
        context.stroke();

        context.beginPath();
        context.ellipse(33, 0, 18, 16, 0.05, 0, Math.PI * 2);
        context.fill();
        context.stroke();

        context.fillStyle = '#8b562e';
        context.beginPath();
        context.moveTo(34, -12);
        context.quadraticCurveTo(23, -10, 22, 2);
        context.quadraticCurveTo(21, 15, 32, 16);
        context.quadraticCurveTo(42, 9, 39, -4);
        context.quadraticCurveTo(38, -9, 34, -12);
        context.fill();
        context.stroke();

        context.fillStyle = '#d29a62';
        context.beginPath();
        context.ellipse(43, 4, 10, 7, 0, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = '#17110d';
        context.beginPath();
        context.arc(38, -5, 2.4, 0, Math.PI * 2);
        context.arc(51, 2, 2.6, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = '#5f351e';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(-30, 9);
        context.quadraticCurveTo(-54, -2, -48, -20);
        context.stroke();

        context.strokeStyle = '#7a4525';
        context.lineWidth = 7;
        [[-12, 23], [12, 23], [-28, 19]].forEach(([legX, legY], index) => {
          context.beginPath();
          context.moveTo(legX, legY);
          context.quadraticCurveTo(legX + (index === 1 ? 10 : -10), legY + 10, legX + (index === 1 ? 22 : -18), legY + 5);
          context.stroke();
        });
        context.restore();
      };

      drawDog(126, 96, 1.02);

      context.fillStyle = 'rgba(255,255,255,0.72)';
      [[86, 130, 24, 7], [126, 128, 30, 8], [166, 133, 24, 6], [116, 112, 18, 5]].forEach(([x, y, rx, ry]) => {
        context.beginPath();
        context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        context.fill();
      });

      context.strokeStyle = 'rgba(255,255,255,0.56)';
      context.lineWidth = 7;
      context.strokeRect(15, 12, canvas.width - 30, canvas.height - 24);
    }

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return new MeshStandardMaterial({
      map: texture,
      roughness: 0.66,
      metalness: 0.02,
      side: DoubleSide,
    });
  };
  const dogOceanPortraitMaterial = createDogOceanPictureMaterial();
  const createHorsePasturePictureMaterial = (): MeshStandardMaterial => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 176;
    const context = canvas.getContext('2d');
    if (context) {
      const skyGradient = context.createLinearGradient(0, 0, 0, 84);
      skyGradient.addColorStop(0, '#75b7eb');
      skyGradient.addColorStop(1, '#e3f5ff');
      context.fillStyle = skyGradient;
      context.fillRect(0, 0, canvas.width, 86);

      context.fillStyle = '#fff0a8';
      context.beginPath();
      context.arc(214, 32, 17, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = 'rgba(255,255,255,0.82)';
      [[48, 38, 25, 9], [76, 36, 30, 8], [148, 45, 34, 10], [182, 43, 24, 8]].forEach(([x, y, rx, ry]) => {
        context.beginPath();
        context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        context.fill();
      });

      const grassGradient = context.createLinearGradient(0, 76, 0, canvas.height);
      grassGradient.addColorStop(0, '#83b957');
      grassGradient.addColorStop(0.56, '#5d963f');
      grassGradient.addColorStop(1, '#3f6d2d');
      context.fillStyle = grassGradient;
      context.fillRect(0, 76, canvas.width, canvas.height - 76);

      context.fillStyle = '#6e4828';
      for (let post = 0; post < 7; post += 1) {
        const x = 15 + post * 38;
        context.fillRect(x, 72, 6, 66);
      }
      context.fillRect(8, 88, canvas.width - 16, 7);
      context.fillRect(8, 119, canvas.width - 16, 7);

      context.strokeStyle = 'rgba(237, 251, 213, 0.55)';
      context.lineWidth = 1.6;
      for (let blade = 0; blade < 110; blade += 1) {
        const x = (blade * 31) % canvas.width;
        const y = 96 + ((blade * 17) % 72);
        context.beginPath();
        context.moveTo(x, y);
        context.quadraticCurveTo(x + 2, y - 6, x + 5, y - 10);
        context.stroke();
      }

      const drawHorse = (x: number, y: number, scale: number, coat: string, mane: string, flip = 1): void => {
        context.save();
        context.translate(x, y);
        context.scale(scale * flip, scale);
        context.fillStyle = coat;
        context.strokeStyle = '#3b2417';
        context.lineWidth = 2.5;

        context.beginPath();
        context.ellipse(0, 0, 34, 17, -0.04, 0, Math.PI * 2);
        context.fill();
        context.stroke();

        context.strokeStyle = '#4c2f1d';
        context.lineWidth = 7;
        [[-21, 12, -27, 36], [-7, 13, -8, 38], [13, 13, 11, 38], [26, 10, 29, 34]].forEach(([legX, legY, hoofX, hoofY]) => {
          context.beginPath();
          context.moveTo(legX, legY);
          context.lineTo(hoofX, hoofY);
          context.stroke();
        });

        context.strokeStyle = coat;
        context.lineWidth = 11;
        context.beginPath();
        context.moveTo(27, -4);
        context.quadraticCurveTo(44, 4, 49, 24);
        context.stroke();

        context.fillStyle = coat;
        context.strokeStyle = '#3b2417';
        context.lineWidth = 2.3;
        context.beginPath();
        context.ellipse(51, 27, 15, 10, 0.3, 0, Math.PI * 2);
        context.fill();
        context.stroke();

        context.fillStyle = mane;
        context.beginPath();
        context.moveTo(23, -13);
        context.quadraticCurveTo(39, -9, 43, 11);
        context.quadraticCurveTo(36, 4, 27, -2);
        context.closePath();
        context.fill();

        context.fillStyle = coat;
        [[42, 18], [54, 18]].forEach(([earX, earY]) => {
          context.beginPath();
          context.moveTo(earX, earY);
          context.lineTo(earX + 5, earY - 12);
          context.lineTo(earX + 9, earY);
          context.closePath();
          context.fill();
          context.stroke();
        });

        context.fillStyle = '#17110d';
        context.beginPath();
        context.arc(57, 24, 2.2, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = mane;
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(-31, -1);
        context.quadraticCurveTo(-43, 13, -41, 34);
        context.stroke();

        context.strokeStyle = '#292018';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(46, 36);
        context.quadraticCurveTo(56, 42, 68, 38);
        context.stroke();
        context.restore();
      };

      drawHorse(74, 121, 0.82, '#8d5630', '#2c1b13', 1);
      drawHorse(167, 113, 0.72, '#d7b07b', '#5c3a24', -1);

      context.strokeStyle = 'rgba(255,255,255,0.55)';
      context.lineWidth = 7;
      context.strokeRect(15, 12, canvas.width - 30, canvas.height - 24);
    }

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return new MeshStandardMaterial({
      map: texture,
      roughness: 0.68,
      metalness: 0.02,
      side: DoubleSide,
    });
  };
  const horsePasturePortraitMaterial = createHorsePasturePictureMaterial();
  const createChickenCoopPictureMaterial = (): MeshStandardMaterial => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 176;
    const context = canvas.getContext('2d');
    if (context) {
      const skyGradient = context.createLinearGradient(0, 0, 0, 82);
      skyGradient.addColorStop(0, '#86c4ef');
      skyGradient.addColorStop(1, '#e5f7ff');
      context.fillStyle = skyGradient;
      context.fillRect(0, 0, canvas.width, 82);

      context.fillStyle = '#f5d878';
      context.beginPath();
      context.arc(216, 32, 16, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = '#6da24a';
      context.fillRect(0, 80, canvas.width, canvas.height - 80);
      context.fillStyle = '#517b35';
      for (let blade = 0; blade < 85; blade += 1) {
        const x = (blade * 29) % canvas.width;
        const y = 98 + ((blade * 17) % 60);
        context.fillRect(x, y, 2, 7);
      }

      context.fillStyle = '#8b5832';
      context.fillRect(42, 58, 144, 82);
      context.fillStyle = '#6a3e25';
      context.beginPath();
      context.moveTo(34, 62);
      context.lineTo(114, 22);
      context.lineTo(196, 62);
      context.closePath();
      context.fill();
      context.strokeStyle = '#3d2418';
      context.lineWidth = 4;
      context.stroke();

      context.fillStyle = '#b87946';
      for (let board = 0; board < 6; board += 1) {
        context.fillRect(48 + board * 23, 64, 6, 74);
      }
      context.fillStyle = '#3b2418';
      context.fillRect(90, 91, 46, 49);
      context.fillStyle = '#5a3723';
      context.fillRect(95, 96, 36, 44);
      context.strokeStyle = '#d9b06a';
      context.lineWidth = 3;
      context.strokeRect(64, 76, 38, 28);
      context.beginPath();
      context.moveTo(83, 76);
      context.lineTo(83, 104);
      context.moveTo(64, 90);
      context.lineTo(102, 90);
      context.stroke();

      context.strokeStyle = '#714629';
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(24, 126);
      context.lineTo(224, 126);
      context.moveTo(24, 146);
      context.lineTo(224, 146);
      for (let post = 0; post < 8; post += 1) {
        const x = 26 + post * 28;
        context.moveTo(x, 112);
        context.lineTo(x, 158);
      }
      context.stroke();

      const drawChicken = (x: number, y: number, scale: number, body: string, wing: string, flip = 1): void => {
        context.save();
        context.translate(x, y);
        context.scale(scale * flip, scale);
        context.fillStyle = body;
        context.strokeStyle = '#4a2d1c';
        context.lineWidth = 2.1;

        context.beginPath();
        context.ellipse(0, 5, 18, 15, -0.08, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.beginPath();
        context.ellipse(17, -7, 10, 9, 0, 0, Math.PI * 2);
        context.fill();
        context.stroke();

        context.fillStyle = wing;
        context.beginPath();
        context.ellipse(-5, 6, 9, 7, -0.4, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = '#d33124';
        context.beginPath();
        context.arc(13, -17, 4, 0, Math.PI * 2);
        context.arc(18, -18, 4, 0, Math.PI * 2);
        context.arc(23, -16, 4, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.ellipse(18, -1, 4, 6, 0, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = '#e99b26';
        context.beginPath();
        context.moveTo(27, -7);
        context.lineTo(38, -3);
        context.lineTo(27, 1);
        context.closePath();
        context.fill();

        context.fillStyle = '#16120d';
        context.beginPath();
        context.arc(20, -9, 1.7, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = '#6d3a1e';
        context.lineWidth = 2.2;
        context.beginPath();
        context.moveTo(-5, 18);
        context.lineTo(-8, 30);
        context.moveTo(7, 18);
        context.lineTo(10, 30);
        context.stroke();
        context.restore();
      };

      drawChicken(76, 135, 0.82, '#f4efe1', '#d8c8a8', 1);
      drawChicken(132, 130, 0.72, '#b96f38', '#7e4326', -1);
      drawChicken(174, 142, 0.62, '#f2c85c', '#c89736', 1);

      context.strokeStyle = 'rgba(255,255,255,0.55)';
      context.lineWidth = 7;
      context.strokeRect(15, 12, canvas.width - 30, canvas.height - 24);
    }

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return new MeshStandardMaterial({
      map: texture,
      roughness: 0.68,
      metalness: 0.02,
      side: DoubleSide,
    });
  };
  const chickenCoopPortraitMaterial = createChickenCoopPictureMaterial();
  const createBirdNestPictureMaterial = (): MeshStandardMaterial => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 176;
    const context = canvas.getContext('2d');
    if (context) {
      const skyGradient = context.createLinearGradient(0, 0, 0, canvas.height);
      skyGradient.addColorStop(0, '#8bc8ef');
      skyGradient.addColorStop(0.52, '#dff4ff');
      skyGradient.addColorStop(1, '#7aa95a');
      context.fillStyle = skyGradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = 'rgba(255,255,255,0.78)';
      [[52, 35, 24, 8], [84, 39, 32, 10], [174, 30, 30, 8]].forEach(([x, y, rx, ry]) => {
        context.beginPath();
        context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        context.fill();
      });

      const barkGradient = context.createLinearGradient(22, 20, 96, 176);
      barkGradient.addColorStop(0, '#8a5a34');
      barkGradient.addColorStop(0.48, '#5e3924');
      barkGradient.addColorStop(1, '#3f2618');
      context.fillStyle = barkGradient;
      context.beginPath();
      context.moveTo(42, 0);
      context.bezierCurveTo(72, 36, 46, 78, 70, 176);
      context.lineTo(0, 176);
      context.lineTo(0, 0);
      context.closePath();
      context.fill();

      context.strokeStyle = '#2b190f';
      context.lineWidth = 3;
      [18, 36, 54].forEach((x, index) => {
        context.beginPath();
        context.moveTo(x, 8);
        context.bezierCurveTo(x + 14, 44, x - 8, 82, x + 8, 168);
        context.stroke();
        if (index === 1) {
          context.beginPath();
          context.ellipse(x + 5, 86, 9, 20, 0.28, 0, Math.PI * 2);
          context.stroke();
        }
      });

      context.fillStyle = '#6a4228';
      context.beginPath();
      context.moveTo(38, 122);
      context.bezierCurveTo(92, 102, 142, 104, 197, 123);
      context.lineTo(190, 142);
      context.bezierCurveTo(134, 128, 82, 129, 32, 148);
      context.closePath();
      context.fill();
      context.strokeStyle = '#3b2417';
      context.lineWidth = 4;
      context.stroke();

      context.strokeStyle = '#57351f';
      context.lineWidth = 3;
      for (let twig = 0; twig < 18; twig += 1) {
        const x = 76 + (twig * 17) % 98;
        const y = 128 + (twig * 11) % 18;
        context.beginPath();
        context.moveTo(x - 30, y + 6);
        context.quadraticCurveTo(x, y - 12, x + 36, y + 4);
        context.stroke();
      }

      const nestGradient = context.createRadialGradient(127, 96, 12, 127, 96, 62);
      nestGradient.addColorStop(0, '#7a4f2f');
      nestGradient.addColorStop(0.64, '#4f301e');
      nestGradient.addColorStop(1, '#2f1c12');
      context.fillStyle = nestGradient;
      context.beginPath();
      context.ellipse(127, 98, 62, 25, -0.04, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = '#8b6038';
      context.lineWidth = 3;
      for (let twig = 0; twig < 16; twig += 1) {
        const x = 80 + (twig * 19) % 92;
        const y = 90 + (twig * 13) % 18;
        context.beginPath();
        context.moveTo(x - 20, y + 4);
        context.quadraticCurveTo(x + 10, y - 11, x + 34, y + 2);
        context.stroke();
      }

      context.fillStyle = '#efe5c3';
      context.strokeStyle = '#a99c7c';
      context.lineWidth = 2;
      [[112, 88, -0.18], [130, 86, 0.12], [146, 90, 0.22]].forEach(([eggX, eggY, rotation]) => {
        context.beginPath();
        context.ellipse(eggX, eggY, 9, 13, rotation, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      });

      const drawBird = (x: number, y: number): void => {
        context.save();
        context.translate(x, y);
        context.fillStyle = '#4d7fa8';
        context.strokeStyle = '#1e3548';
        context.lineWidth = 2.5;
        context.beginPath();
        context.ellipse(0, 10, 24, 18, -0.15, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.fillStyle = '#5f9bc8';
        context.beginPath();
        context.ellipse(-7, 12, 13, 9, -0.42, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = '#4d7fa8';
        context.beginPath();
        context.ellipse(19, -4, 13, 12, 0, 0, Math.PI * 2);
        context.fill();
        context.stroke();

        context.fillStyle = '#e49c2a';
        context.beginPath();
        context.moveTo(31, -5);
        context.lineTo(45, 0);
        context.lineTo(31, 5);
        context.closePath();
        context.fill();

        context.fillStyle = '#111820';
        context.beginPath();
        context.arc(23, -8, 2.5, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = '#274b68';
        context.beginPath();
        context.moveTo(-21, 8);
        context.lineTo(-43, -2);
        context.lineTo(-34, 18);
        context.closePath();
        context.fill();

        context.strokeStyle = '#6b3d1e';
        context.lineWidth = 2.2;
        context.beginPath();
        context.moveTo(-4, 27);
        context.lineTo(-8, 39);
        context.moveTo(7, 27);
        context.lineTo(10, 39);
        context.stroke();
        context.restore();
      };

      drawBird(176, 74);

      context.strokeStyle = 'rgba(255,255,255,0.55)';
      context.lineWidth = 7;
      context.strokeRect(15, 12, canvas.width - 30, canvas.height - 24);
    }

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return new MeshStandardMaterial({
      map: texture,
      roughness: 0.68,
      metalness: 0.02,
      side: DoubleSide,
    });
  };
  const birdNestPortraitMaterial = createBirdNestPictureMaterial();
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
  const porcelainMaterial = new MeshStandardMaterial({
    color: 0xf4f3ec,
    emissive: 0x161612,
    emissiveIntensity: 0.035,
    roughness: 0.42,
    metalness: 0.02,
  });
  const applianceWhiteMaterial = new MeshStandardMaterial({
    color: 0xe9ece7,
    emissive: 0x111310,
    emissiveIntensity: 0.04,
    roughness: 0.58,
    metalness: 0.04,
  });
  const applianceGlassMaterial = new MeshStandardMaterial({
    color: 0x6d8792,
    emissive: 0x0b1518,
    emissiveIntensity: 0.08,
    roughness: 0.16,
    metalness: 0.16,
    transparent: true,
    opacity: 0.72,
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
  const bathtubWaterMaterial = new MeshStandardMaterial({
    color: 0x2aaeff,
    emissive: 0x1177c7,
    emissiveIntensity: 0.34,
    roughness: 0.14,
    metalness: 0.02,
    transparent: true,
    opacity: 0.68,
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
  const ovenDoorGlassMaterial = new MeshStandardMaterial({
    color: 0x8fb6c4,
    emissive: 0x263943,
    emissiveIntensity: 0.12,
    roughness: 0.18,
    metalness: 0.02,
    transparent: true,
    opacity: 0.32,
    side: DoubleSide,
  });
  const ovenInteriorMaterial = new MeshStandardMaterial({
    color: 0x050505,
    emissive: 0x000000,
    emissiveIntensity: 0,
    roughness: 0.94,
    metalness: 0.02,
  });
  const laundryBasketMaterial = new MeshStandardMaterial({
    color: 0xe8dfcf,
    emissive: 0x11100c,
    emissiveIntensity: 0.035,
    roughness: 0.78,
    metalness: 0.02,
  });
  const laundryBasketShadowMaterial = new MeshStandardMaterial({
    color: 0x594f43,
    emissive: 0x080706,
    emissiveIntensity: 0.04,
    roughness: 0.82,
    metalness: 0.01,
  });
  const laundryClothMaterials = [
    new MeshStandardMaterial({ color: 0xc73d3d, roughness: 0.84, metalness: 0.01 }),
    new MeshStandardMaterial({ color: 0x315dbb, roughness: 0.84, metalness: 0.01 }),
    new MeshStandardMaterial({ color: 0xf0d35b, roughness: 0.84, metalness: 0.01 }),
    new MeshStandardMaterial({ color: 0xf2f1e7, roughness: 0.84, metalness: 0.01 }),
    new MeshStandardMaterial({ color: 0x7e4aa8, roughness: 0.84, metalness: 0.01 }),
  ];

  const ground = new Mesh(new PlaneGeometry(FOREST_SIZE, FOREST_SIZE, 16, 16), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(CENTER_X, 0, CENTER_Z);
  root.add(ground);

  const house = new Group();
  house.name = 'Chapter 7 Big Clearing House';
  house.position.set(CENTER_X, 0, HOUSE_CENTER_Z);

  const createHousePlankFloor = (width: number, depth: number, centerX: number, centerZ: number): Group => {
    const floorGroup = new Group();
    const base = new Mesh(new BoxGeometry(width, 0.16, depth), houseFloorMaterial);
    base.position.set(centerX, 0.08, centerZ);
    floorGroup.add(base);

    const boardLengthPattern = [5, 3, 2.2, 7.5, 4, 10, 2.8, 6, 3.5, 4.8];
    const boardWidth = 0.86;
    const rowCount = Math.max(2, Math.floor(width / boardWidth));
    const rowWidth = width / rowCount;
    for (let row = 0; row < rowCount; row += 1) {
      const rowX = centerX - width / 2 + rowWidth / 2 + row * rowWidth;
      let cursorZ = centerZ - depth / 2;
      let boardIndex = row % boardLengthPattern.length;
      while (cursorZ < centerZ + depth / 2 - 0.05) {
        const patternLength = boardLengthPattern[boardIndex % boardLengthPattern.length];
        const boardLength = Math.min(patternLength, centerZ + depth / 2 - cursorZ);
        if (boardLength > 0.16) {
          const board = new Mesh(
            new BoxGeometry(Math.max(0.12, rowWidth - 0.045), 0.022, Math.max(0.12, boardLength - 0.045)),
            houseFloorBoardMaterials[(row + boardIndex) % houseFloorBoardMaterials.length],
          );
          board.position.set(rowX, 0.18, cursorZ + boardLength / 2);
          floorGroup.add(board);
        }
        cursorZ += boardLength;
        boardIndex += 1;
      }
    }

    for (let index = 1; index < rowCount; index += 1) {
      const localX = centerX - width / 2 + index * rowWidth;
      const groove = new Mesh(new BoxGeometry(0.026, 0.028, depth - 0.12), houseFloorGrooveMaterial);
      groove.position.set(localX, 0.198, centerZ);
      floorGroup.add(groove);
    }

    for (let row = 0; row < rowCount; row += 1) {
      const rowX = centerX - width / 2 + rowWidth / 2 + row * rowWidth;
      let cursorZ = centerZ - depth / 2;
      let boardIndex = row % boardLengthPattern.length;
      while (cursorZ < centerZ + depth / 2 - 0.08) {
        const patternLength = boardLengthPattern[boardIndex % boardLengthPattern.length];
        const boardLength = Math.min(patternLength, centerZ + depth / 2 - cursorZ);
        cursorZ += boardLength;
        if (cursorZ < centerZ + depth / 2 - 0.08) {
          const endGroove = new Mesh(new BoxGeometry(Math.max(0.12, rowWidth - 0.08), 0.03, 0.026), houseFloorGrooveMaterial);
          endGroove.position.set(rowX, 0.205, cursorZ);
          floorGroup.add(endGroove);
        }
        boardIndex += 1;
      }
    }

    return floorGroup;
  };

  const floor = createHousePlankFloor(HOUSE_WIDTH + 1.2, HOUSE_DEPTH + 1.2, 0, 0);
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

  const addSideWallWindow = (
    localX: number,
    localZ: number,
    centerY: number,
    width: number,
    height: number,
  ): void => {
    const window = new Group();
    window.position.set(localX, centerY, localZ);

    const glass = new Mesh(new BoxGeometry(0.055, height, width), slidingGlassMaterial);
    const trimTop = new Mesh(new BoxGeometry(0.12, 0.16, width + 0.28), houseTrimMaterial);
    trimTop.position.y = height / 2 + 0.08;
    const trimBottom = trimTop.clone();
    trimBottom.position.y = -height / 2 - 0.08;
    const trimLeft = new Mesh(new BoxGeometry(0.12, height + 0.28, 0.16), houseTrimMaterial);
    trimLeft.position.z = -width / 2 - 0.08;
    const trimRight = trimLeft.clone();
    trimRight.position.z = width / 2 + 0.08;
    const centerMullion = new Mesh(new BoxGeometry(0.14, height * 0.92, 0.1), houseTrimMaterial);
    const centerRail = new Mesh(new BoxGeometry(0.14, 0.1, width * 0.9), houseTrimMaterial);
    const sill = new Mesh(new BoxGeometry(0.28, 0.18, width + 0.56), houseTrimMaterial);
    sill.position.y = -height / 2 - 0.24;

    window.add(glass, trimTop, trimBottom, trimLeft, trimRight, centerMullion, centerRail, sill);
    house.add(window);
  };

  const addPictureFrame = (
    localX: number,
    localY: number,
    localZ: number,
    normalZ: 1 | -1,
    portraitMaterial: MeshStandardMaterial,
  ): void => {
    const frame = new Group();
    frame.position.set(localX, localY, localZ + normalZ * 0.12);
    if (normalZ < 0) {
      frame.rotation.y = Math.PI;
    }

    const backing = new Mesh(new BoxGeometry(2.06, 1.42, 0.06), houseTrimMaterial);
    const portrait = new Mesh(new PlaneGeometry(1.62, 1.04), portraitMaterial);
    portrait.position.z = 0.038;
    const top = new Mesh(new BoxGeometry(2.2, 0.12, 0.1), houseTrimMaterial);
    top.position.y = 0.74;
    const bottom = top.clone();
    bottom.position.y = -0.74;
    const left = new Mesh(new BoxGeometry(0.12, 1.44, 0.1), houseTrimMaterial);
    left.position.x = -1.07;
    const right = left.clone();
    right.position.x = 1.07;
    const innerTop = new Mesh(new BoxGeometry(1.66, 0.055, 0.12), closetHandleMaterial);
    innerTop.position.y = 0.56;
    innerTop.position.z = 0.06;
    const innerBottom = innerTop.clone();
    innerBottom.position.y = -0.56;
    const innerLeft = new Mesh(new BoxGeometry(0.055, 1.08, 0.12), closetHandleMaterial);
    innerLeft.position.set(-0.84, 0, 0.06);
    const innerRight = innerLeft.clone();
    innerRight.position.x = 0.84;

    frame.add(backing, portrait, top, bottom, left, right, innerTop, innerBottom, innerLeft, innerRight);
    house.add(frame);
  };

  const addSidePictureFrame = (
    localX: number,
    localY: number,
    localZ: number,
    normalX: 1 | -1,
    portraitMaterial: MeshStandardMaterial,
  ): void => {
    const frame = new Group();
    frame.position.set(localX + normalX * 0.12, localY, localZ);
    frame.rotation.y = normalX > 0 ? Math.PI / 2 : -Math.PI / 2;

    const backing = new Mesh(new BoxGeometry(2.06, 1.42, 0.06), houseTrimMaterial);
    const portrait = new Mesh(new PlaneGeometry(1.62, 1.04), portraitMaterial);
    portrait.position.z = 0.038;
    const top = new Mesh(new BoxGeometry(2.2, 0.12, 0.1), houseTrimMaterial);
    top.position.y = 0.74;
    const bottom = top.clone();
    bottom.position.y = -0.74;
    const left = new Mesh(new BoxGeometry(0.12, 1.44, 0.1), houseTrimMaterial);
    left.position.x = -1.07;
    const right = left.clone();
    right.position.x = 1.07;
    const innerTop = new Mesh(new BoxGeometry(1.66, 0.055, 0.12), closetHandleMaterial);
    innerTop.position.set(0, 0.56, 0.06);
    const innerBottom = innerTop.clone();
    innerBottom.position.y = -0.56;
    const innerLeft = new Mesh(new BoxGeometry(0.055, 1.08, 0.12), closetHandleMaterial);
    innerLeft.position.set(-0.84, 0, 0.06);
    const innerRight = innerLeft.clone();
    innerRight.position.x = 0.84;

    frame.add(backing, portrait, top, bottom, left, right, innerTop, innerBottom, innerLeft, innerRight);
    house.add(frame);
  };

  const addWallTelevision = (
    localX: number,
    localY: number,
    localZ: number,
    normalZ: 1 | -1,
  ): { setPowered(powered: boolean): void; isPowered(): boolean } => {
    const television = new Group();
    television.position.set(localX, localY, localZ + normalZ * 0.14);
    if (normalZ < 0) {
      television.rotation.y = Math.PI;
    }

    const frame = new Mesh(new BoxGeometry(3.25, 1.9, 0.16), tvFrameMaterial);
    const screen = new Mesh(new BoxGeometry(2.9, 1.52, 0.055), tvScreenMaterial);
    screen.position.z = 0.1;
    const lowerStrip = new Mesh(new BoxGeometry(2.55, 0.12, 0.08), tvFrameMaterial);
    lowerStrip.position.set(0, -0.8, 0.15);
    const powerDot = new Mesh(new SphereGeometry(0.045, 12, 8), new MeshStandardMaterial({
      color: 0x69ff8d,
      emissive: 0x1fff54,
      emissiveIntensity: 0.8,
      roughness: 0.35,
      metalness: 0.05,
    }));
    powerDot.position.set(1.18, -0.8, 0.2);

    television.add(frame, screen, lowerStrip, powerDot);
    house.add(television);

    let powered = false;
    const setPowered = (nextPowered: boolean): void => {
      powered = nextPowered;
      screen.material = powered ? tvNewsScreen.material : tvScreenMaterial;
      powerDot.visible = powered;
    };
    setPowered(false);

    return {
      setPowered,
      isPowered: () => powered,
    };
  };

  const addTableRemote = (localX: number, localY: number, localZ: number, rotationY = 0): ChapterSevenRemoteButton[] => {
    const remote = new Group();
    remote.position.set(localX, localY, localZ);
    remote.rotation.y = rotationY;

    const createRemoteLabelMaterial = (
      text: string,
      background: string,
      foreground: string,
      fallbackColor: number,
      fontSize = 34,
    ): MeshStandardMaterial => {
      if (typeof document === 'undefined') {
        return new MeshStandardMaterial({
          color: fallbackColor,
          roughness: 0.5,
          metalness: 0.04,
        });
      }

      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = background;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = foreground;
        context.font = `bold ${fontSize}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
      }
      const texture = new CanvasTexture(canvas);
      texture.needsUpdate = true;
      return new MeshStandardMaterial({
        map: texture,
        roughness: 0.48,
        metalness: 0.04,
      });
    };

    const onLabelMaterial = createRemoteLabelMaterial('ON', '#d8efe0', '#17391f', 0x8ad8a0, 46);
    const offLabelMaterial = createRemoteLabelMaterial('OFF', '#f1d8d8', '#4a1717', 0xd98a8a, 42);
    const netflixLabelMaterial = createRemoteLabelMaterial('Netflix', '#151515', '#e23434', 0x151515, 30);
    const disneyLabelMaterial = createRemoteLabelMaterial('Disney', '#1d3c88', '#e8f2ff', 0x1d3c88, 30);
    const primeLabelMaterial = createRemoteLabelMaterial('Prime', '#1b5a78', '#d8f7ff', 0x1b5a78, 32);
    const youtubeLabelMaterial = createRemoteLabelMaterial('YouTube', '#f3f3f3', '#c62020', 0xf3f3f3, 28);

    const body = new Mesh(new BoxGeometry(0.38, 0.075, 1.42), tvFrameMaterial);
    body.position.y = 0.035;
    const buttonMaterial = new MeshStandardMaterial({
      color: 0x2f343d,
      emissive: 0x020305,
      emissiveIntensity: 0.08,
      roughness: 0.42,
      metalness: 0.12,
    });
    const redButtonMaterial = new MeshStandardMaterial({
      color: 0xb92626,
      emissive: 0x240303,
      emissiveIntensity: 0.18,
      roughness: 0.38,
      metalness: 0.08,
    });
    const addLabeledRoundButton = (
      x: number,
      z: number,
      radius: number,
      material: MeshStandardMaterial,
      labelMaterial: MeshStandardMaterial,
      labelWidth: number,
      labelDepth: number,
    ): void => {
      const button = new Mesh(new CylinderGeometry(radius, radius, 0.05, 18), material);
      button.position.set(x, 0.102, z);
      const label = new Mesh(new PlaneGeometry(labelWidth, labelDepth), labelMaterial);
      label.rotation.x = -Math.PI / 2;
      label.position.set(x, 0.129, z);
      remote.add(button, label);
    };
    const addPlainButton = (x: number, z: number, radius = 0.038): void => {
      const button = new Mesh(new CylinderGeometry(radius, radius, 0.04, 14), buttonMaterial);
      button.position.set(x, 0.098, z);
      remote.add(button);
    };
    const addChannelButton = (
      z: number,
      labelMaterial: MeshStandardMaterial,
      width: number,
    ): void => {
      const button = new Mesh(new BoxGeometry(width, 0.045, 0.105), buttonMaterial);
      button.position.set(0, 0.102, z);
      const label = new Mesh(new PlaneGeometry(width * 0.84, 0.076), labelMaterial);
      label.rotation.x = -Math.PI / 2;
      label.position.set(0, 0.129, z);
      remote.add(button, label);
    };
    const onButtonMaterial = new MeshStandardMaterial({
      color: 0x1f7f35,
      emissive: 0x08280f,
      emissiveIntensity: 0.2,
      roughness: 0.34,
      metalness: 0.12,
    });
    remote.add(body);
    addLabeledRoundButton(-0.09, 0.48, 0.068, onButtonMaterial, onLabelMaterial, 0.14, 0.075);
    addLabeledRoundButton(0.1, 0.48, 0.068, redButtonMaterial, offLabelMaterial, 0.14, 0.075);
    [
      [-0.105, 0.28],
      [0, 0.28],
      [0.105, 0.28],
      [-0.105, 0.15],
      [0, 0.15],
      [0.105, 0.15],
      [-0.105, 0.02],
      [0, 0.02],
      [0.105, 0.02],
    ].forEach(([buttonX, buttonZ]) => addPlainButton(buttonX, buttonZ));
    addChannelButton(-0.18, netflixLabelMaterial, 0.27);
    addChannelButton(-0.3, disneyLabelMaterial, 0.27);
    addChannelButton(-0.42, primeLabelMaterial, 0.25);
    addChannelButton(-0.54, youtubeLabelMaterial, 0.29);
    house.add(remote);

    const makeRemoteTarget = (): ChapterSevenRemoteButton => {
      const aimPosition = new Vector3(CENTER_X + localX, localY + 0.14, HOUSE_CENTER_Z + localZ);

      return {
        label: 'TV remote',
        action: 'tv-toggle',
        interactPosition: aimPosition.clone(),
        aimPosition,
      };
    };

    return [makeRemoteTarget()];
  };

  const addHangingHomeSign = (
    localX: number,
    localY: number,
    localZ: number,
    normalZ: 1 | -1,
  ): void => {
    const sign = new Group();
    sign.position.set(localX, localY, localZ + normalZ * 0.12);
    if (normalZ < 0) {
      sign.rotation.y = Math.PI;
    }

    const board = new Mesh(new BoxGeometry(2.85, 1.16, 0.08), furnitureWoodMaterial);
    const face = new Mesh(new PlaneGeometry(2.62, 0.94), homeSweetHomeSignMaterial);
    face.position.z = 0.052;
    const topTrim = new Mesh(new BoxGeometry(2.92, 0.08, 0.1), houseTrimMaterial);
    topTrim.position.y = 0.62;
    const bottomTrim = topTrim.clone();
    bottomTrim.position.y = -0.62;
    const leftTrim = new Mesh(new BoxGeometry(0.08, 1.2, 0.1), houseTrimMaterial);
    leftTrim.position.x = -1.46;
    const rightTrim = leftTrim.clone();
    rightTrim.position.x = 1.46;

    const ropeMaterial = new MeshStandardMaterial({
      color: 0x6f4a2d,
      emissive: 0x090503,
      emissiveIntensity: 0.04,
      roughness: 0.9,
      metalness: 0.01,
    });
    const leftRope = new Mesh(new CylinderGeometry(0.035, 0.035, 0.96, 10), ropeMaterial);
    leftRope.position.set(-0.92, 0.96, 0.02);
    leftRope.rotation.z = -0.5;
    const rightRope = leftRope.clone();
    rightRope.position.x = 0.92;
    rightRope.rotation.z = 0.5;
    const topLoop = new Mesh(new TorusGeometry(0.18, 0.025, 8, 22), ropeMaterial);
    topLoop.position.set(0, 1.3, 0.03);
    topLoop.rotation.x = Math.PI / 2;
    const leftPeg = new Mesh(new CylinderGeometry(0.07, 0.07, 0.12, 12), houseTrimMaterial);
    leftPeg.rotation.x = Math.PI / 2;
    leftPeg.position.set(-0.72, 0.58, 0.09);
    const rightPeg = leftPeg.clone();
    rightPeg.position.x = 0.72;
    const wallHook = new Mesh(new CylinderGeometry(0.065, 0.065, 0.16, 12), closetHandleMaterial);
    wallHook.rotation.x = Math.PI / 2;
    wallHook.position.set(0, 1.32, 0.1);

    sign.add(board, face, topTrim, bottomTrim, leftTrim, rightTrim, leftRope, rightRope, topLoop, leftPeg, rightPeg, wallHook);
    house.add(sign);
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
    const frontHandle = new Mesh(new CylinderGeometry(0.09, 0.09, 0.24, 10), houseTrimMaterial);
    frontHandle.position.set(
      orientation === 'front' ? width - 0.55 : 0.18,
      height * 0.52,
      orientation === 'front' ? 0.18 : width - 0.55,
    );
    const backHandle = frontHandle.clone();
    if (orientation === 'front') {
      frontHandle.rotation.x = Math.PI / 2;
      backHandle.rotation.x = Math.PI / 2;
      backHandle.position.z = -0.18;
    } else {
      frontHandle.rotation.z = Math.PI / 2;
      backHandle.rotation.z = Math.PI / 2;
      backHandle.position.x = -0.18;
    }
    doorPivot.add(doorPanel, frontHandle, backHandle);
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
      pushRadius: 2,
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
    const chairCollider = addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, 0.92, 0.92);
    addCrawlUnderCollider(chairCollider, CENTER_X + localX, HOUSE_CENTER_Z + localZ, 0.92, 0.92, 0.06);
  };

  const addYellowCouch = (localX: number, localZ: number, rotationY = 0): void => {
    const couch = new Group();
    couch.position.set(localX, 0, localZ);
    couch.rotation.y = rotationY;

    const length = 6.8;
    const depth = 1.82;
    const base = new Mesh(new BoxGeometry(length, 0.34, depth), yellowCouchMaterial);
    base.position.y = 0.82;
    const seatOffsets = [-2.18, 0, 2.18];
    const seats = seatOffsets.map((seatX) => {
      const cushion = new Mesh(new BoxGeometry(2.04, 0.24, 1.2), yellowCouchMaterial);
      cushion.position.set(seatX, 1.1, -0.2);
      return cushion;
    });
    const back = new Mesh(new BoxGeometry(length + 0.18, 1.18, 0.32), yellowCouchMaterial);
    back.position.set(0, 1.43, 0.88);
    const backCushions = seatOffsets.map((seatX) => {
      const cushion = new Mesh(new BoxGeometry(1.98, 0.78, 0.18), yellowCouchMaterial);
      cushion.position.set(seatX, 1.46, 0.68);
      cushion.rotation.x = -0.1;
      return cushion;
    });
    const leftArm = new Mesh(new BoxGeometry(0.42, 1.06, depth + 0.08), yellowCouchMaterial);
    leftArm.position.set(-length / 2 - 0.2, 1.2, 0);
    const rightArm = leftArm.clone();
    rightArm.position.x = length / 2 + 0.2;
    const frontLip = new Mesh(new BoxGeometry(length, 0.18, 0.22), furnitureWoodMaterial);
    frontLip.position.set(0, 0.92, -depth / 2 - 0.04);
    const legs = [
      [-2.95, -0.72],
      [2.95, -0.72],
      [-2.95, 0.64],
      [2.95, 0.64],
    ].map(([legX, legZ]) => {
      const leg = new Mesh(new BoxGeometry(0.22, 0.72, 0.22), furnitureWoodMaterial);
      leg.position.set(legX, 0.36, legZ);
      return leg;
    });

    couch.add(base, ...seats, back, ...backCushions, leftArm, rightArm, frontLip, ...legs);
    house.add(couch);
    const couchCollider = addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, length + 0.84, depth + 0.18);
    bedSurfaces.push({
      label: 'Yellow couch',
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: (length + 0.84) / 2,
      halfDepth: (depth + 0.18) / 2,
      floorY: 1.2,
      collider: couchCollider,
    });
  };

  const addColorfulRug = (localX: number, localZ: number, rotationY = 0, width = 5.2, depth = 3.4): void => {
    const rug = new Mesh(new BoxGeometry(width, 0.055, depth), colorfulRugMaterial);
    rug.rotation.y = rotationY;
    rug.position.set(localX, 0.255, localZ);
    house.add(rug);
  };

  const addPinkFloorCushion = (localX: number, localZ: number): void => {
    const cushion = new Group();
    cushion.position.set(localX, 0, localZ);

    const base = new Mesh(new CylinderGeometry(1.54, 1.72, 0.34, 60), pinkFloorCushionMaterial);
    base.position.y = 0.26;
    const body = new Mesh(new SphereGeometry(1.82, 52, 22), pinkFloorCushionMaterial);
    body.position.y = 0.58;
    body.scale.set(1.05, 0.36, 1.05);
    const raisedRim = new Mesh(new TorusGeometry(1.08, 0.22, 16, 72), pinkFloorCushionMaterial);
    raisedRim.rotation.x = Math.PI / 2;
    raisedRim.position.y = 0.83;
    const centerDip = new Mesh(new CylinderGeometry(0.72, 0.84, 0.045, 42), pinkFloorCushionDetailMaterial);
    centerDip.position.y = 0.72;
    const centerSeat = new Mesh(new CylinderGeometry(0.64, 0.7, 0.035, 42), pinkFloorCushionMaterial);
    centerSeat.position.y = 0.745;
    const outerSeam = new Mesh(new TorusGeometry(1.46, 0.022, 8, 72), pinkFloorCushionDetailMaterial);
    outerSeam.rotation.x = Math.PI / 2;
    outerSeam.position.y = 0.6;
    const middleSeam = new Mesh(new TorusGeometry(0.78, 0.018, 8, 56), pinkFloorCushionDetailMaterial);
    middleSeam.rotation.x = Math.PI / 2;
    middleSeam.position.y = 0.785;

    const seamStrips = Array.from({ length: 8 }, (_, index) => {
      const seam = new Mesh(new BoxGeometry(0.022, 0.014, 0.54), pinkFloorCushionDetailMaterial);
      const angle = (index / 8) * Math.PI * 2;
      seam.position.set(Math.sin(angle) * 0.82, 0.82, Math.cos(angle) * 0.82);
      seam.rotation.y = angle;
      return seam;
    });

    cushion.add(base, body, raisedRim, centerDip, centerSeat, outerSeam, middleSeam, ...seamStrips);
    house.add(cushion);

    const cushionCollider = addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, 3.24, 3.24);
    bedSurfaces.push({
      label: 'Pink bean bag',
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: 1.62,
      halfDepth: 1.62,
      floorY: 0.86,
      collider: cushionCollider,
    });
  };

  const addSmallPlantTable = (localX: number, localZ: number): void => {
    const table = new Group();
    table.position.set(localX, 0, localZ);

    const top = new Mesh(new BoxGeometry(2, 0.16, 2), smallTableLightTanMaterial);
    top.position.y = 1;
    const lowerShelf = new Mesh(new BoxGeometry(1.72, 0.09, 1.72), smallTableDarkTanMaterial);
    lowerShelf.position.y = 0.46;
    const legs = [
      [-0.78, -0.78],
      [0.78, -0.78],
      [-0.78, 0.78],
      [0.78, 0.78],
    ].map(([legX, legZ]) => {
      const leg = new Mesh(new BoxGeometry(0.16, 0.92, 0.16), smallTableDarkTanMaterial);
      leg.position.set(legX, 0.5, legZ);
      return leg;
    });
    const pot = new Mesh(new CylinderGeometry(0.24, 0.32, 0.42, 14), plantPotMaterial);
    pot.position.set(0, 1.29, 0);
    const potLip = new Mesh(new CylinderGeometry(0.34, 0.34, 0.08, 14), plantPotMaterial);
    potLip.position.set(0, 1.52, 0);
    const stem = new Mesh(new CylinderGeometry(0.025, 0.035, 0.5, 8), plantLeafMaterial);
    stem.position.set(0, 1.77, 0);
    const leaves = [
      [-0.18, 1.78, 0.03],
      [0.16, 1.88, -0.02],
      [0.02, 1.96, 0.18],
      [0.22, 1.72, 0.16],
      [-0.22, 1.9, -0.14],
    ].map(([leafX, leafY, leafZ]) => {
      const leaf = new Mesh(new SphereGeometry(0.16, 10, 8), plantLeafMaterial);
      leaf.scale.set(1.35, 0.72, 1);
      leaf.position.set(leafX, leafY, leafZ);
      return leaf;
    });

    table.add(top, lowerShelf, ...legs, pot, potLip, stem, ...leaves);
    house.add(table);
    const tableCollider = addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, 2.08, 2.08);
    crawlUnderTableColliders.push({
      collider: tableCollider,
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: 2.08 / 2,
      halfDepth: 2.08 / 2,
    });
  };

  const addFishTankTable = (localX: number, localZ: number): void => {
    const table = new Group();
    table.position.set(localX, 0, localZ);

    const tableLength = 5;
    const tableDepth = 1.45;
    const top = new Mesh(new BoxGeometry(tableLength, 0.16, tableDepth), smallTableLightTanMaterial);
    top.position.y = 0.96;
    const apronFront = new Mesh(new BoxGeometry(tableLength, 0.18, 0.12), smallTableDarkTanMaterial);
    apronFront.position.set(0, 0.81, tableDepth / 2 - 0.06);
    const apronBack = apronFront.clone();
    apronBack.position.z = -tableDepth / 2 + 0.06;
    const legs = [
      [-2.2, -0.52],
      [2.2, -0.52],
      [-2.2, 0.52],
      [2.2, 0.52],
    ].map(([legX, legZ]) => {
      const leg = new Mesh(new BoxGeometry(0.18, 0.9, 0.18), smallTableDarkTanMaterial);
      leg.position.set(legX, 0.45, legZ);
      return leg;
    });

    const tank = new Group();
    tank.position.set(0, 1.12, 0);
    const glassMaterial = new MeshStandardMaterial({
      color: 0xaee7f2,
      emissive: 0x0b2630,
      emissiveIntensity: 0.08,
      roughness: 0.06,
      metalness: 0.02,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: DoubleSide,
    });
    const waterMaterial = new MeshStandardMaterial({
      color: 0x4eb0de,
      emissive: 0x0d3852,
      emissiveIntensity: 0.22,
      roughness: 0.18,
      metalness: 0.01,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    });
    const pebbleMaterials = [
      new MeshStandardMaterial({ color: 0xe66a5f, roughness: 0.72, metalness: 0.01 }),
      new MeshStandardMaterial({ color: 0xf0d256, roughness: 0.72, metalness: 0.01 }),
      new MeshStandardMaterial({ color: 0x5fb6ee, roughness: 0.72, metalness: 0.01 }),
      new MeshStandardMaterial({ color: 0x72c76a, roughness: 0.72, metalness: 0.01 }),
      new MeshStandardMaterial({ color: 0xc985e8, roughness: 0.72, metalness: 0.01 }),
    ];
    const fishMaterials = [
      new MeshStandardMaterial({ color: 0xffa62b, emissive: 0x2b1202, emissiveIntensity: 0.07, roughness: 0.5, metalness: 0.01 }),
      new MeshStandardMaterial({ color: 0x56c8ff, emissive: 0x041825, emissiveIntensity: 0.08, roughness: 0.45, metalness: 0.01 }),
      new MeshStandardMaterial({ color: 0xf05b8c, emissive: 0x260512, emissiveIntensity: 0.07, roughness: 0.45, metalness: 0.01 }),
    ];
    const seaweedMaterial = new MeshStandardMaterial({
      color: 0x247c45,
      emissive: 0x06210f,
      emissiveIntensity: 0.07,
      roughness: 0.78,
      metalness: 0.01,
    });
    const chestMaterial = new MeshStandardMaterial({
      color: 0x8a4f24,
      emissive: 0x120806,
      emissiveIntensity: 0.05,
      roughness: 0.76,
      metalness: 0.02,
    });
    const chestTrimMaterial = new MeshStandardMaterial({
      color: 0xd8b24f,
      emissive: 0x251803,
      emissiveIntensity: 0.12,
      roughness: 0.44,
      metalness: 0.22,
    });

    const tankWidth = 3.82;
    const tankHeight = 1.16;
    const tankDepth = 0.92;
    const backGlass = new Mesh(new BoxGeometry(tankWidth, tankHeight, 0.035), glassMaterial);
    backGlass.position.set(0, tankHeight / 2, -tankDepth / 2);
    const frontGlass = backGlass.clone();
    frontGlass.position.z = tankDepth / 2;
    const leftGlass = new Mesh(new BoxGeometry(0.035, tankHeight, tankDepth), glassMaterial);
    leftGlass.position.set(-tankWidth / 2, tankHeight / 2, 0);
    const rightGlass = leftGlass.clone();
    rightGlass.position.x = tankWidth / 2;
    const bottomGlass = new Mesh(new BoxGeometry(tankWidth, 0.045, tankDepth), glassMaterial);
    bottomGlass.position.y = 0.02;
    const topRim = new Mesh(new BoxGeometry(tankWidth + 0.1, 0.08, tankDepth + 0.1), tvFrameMaterial);
    topRim.position.y = tankHeight + 0.04;
    const water = new Mesh(new BoxGeometry(tankWidth - 0.16, 0.82, tankDepth - 0.12), waterMaterial);
    water.position.y = 0.48;
    const sand = new Mesh(new BoxGeometry(tankWidth - 0.22, 0.12, tankDepth - 0.14), new MeshStandardMaterial({
      color: 0xd8bc74,
      roughness: 0.92,
      metalness: 0.01,
    }));
    sand.position.y = 0.1;

    const pebbles = Array.from({ length: 18 }, (_, index) => {
      const pebble = new Mesh(new SphereGeometry(0.055 + (index % 3) * 0.01, 8, 6), pebbleMaterials[index % pebbleMaterials.length]);
      pebble.scale.set(1.15, 0.45, 0.9);
      pebble.position.set(-1.62 + (index % 9) * 0.4, 0.19, -0.3 + Math.floor(index / 9) * 0.42);
      return pebble;
    });

    const makeFish = (
      x: number,
      y: number,
      z: number,
      material: MeshStandardMaterial,
      direction: 1 | -1,
      speed: number,
      phase: number,
    ): Group => {
      const fish = new Group();
      fish.position.set(x, y, z);
      fish.rotation.y = direction > 0 ? 0 : Math.PI;
      const body = new Mesh(new SphereGeometry(0.14, 14, 8), material);
      body.scale.set(1.55, 0.72, 0.85);
      const tail = new Mesh(new ConeGeometry(0.105, 0.16, 3), material);
      tail.position.x = -0.22;
      tail.rotation.z = Math.PI / 2;
      const eye = new Mesh(new SphereGeometry(0.018, 8, 6), tvFrameMaterial);
      eye.position.set(0.16, 0.04, 0.065);
      fish.add(body, tail, eye);
      fishTankFish.push({
        fish,
        baseX: x,
        baseY: y,
        baseZ: z,
        rangeX: 0.5,
        rangeZ: 0.2,
        speed,
        phase,
      });
      return fish;
    };

    const seaweed = [-1.46, -1.12, 1.25, 1.55].map((weedX, index) => {
      const weed = new Group();
      weed.position.set(weedX, 0.2, index % 2 === 0 ? -0.28 : 0.26);
      const stalks = [0, 1, 2].map((stalkIndex) => {
        const stalk = new Mesh(new CylinderGeometry(0.018, 0.028, 0.48 + stalkIndex * 0.12, 8), seaweedMaterial);
        stalk.position.set((stalkIndex - 1) * 0.055, 0.24 + stalkIndex * 0.06, 0);
        stalk.rotation.z = (stalkIndex - 1) * 0.18;
        return stalk;
      });
      weed.add(...stalks);
      return weed;
    });

    const chest = new Group();
    chest.position.set(0.54, 0.24, 0.24);
    const chestBase = new Mesh(new BoxGeometry(0.44, 0.24, 0.28), chestMaterial);
    const chestLid = new Mesh(new CylinderGeometry(0.16, 0.16, 0.46, 16, 1, false, 0, Math.PI), chestMaterial);
    chestLid.rotation.z = Math.PI / 2;
    chestLid.position.y = 0.13;
    const chestBand = new Mesh(new BoxGeometry(0.5, 0.045, 0.32), chestTrimMaterial);
    chestBand.position.y = 0.02;
    chest.add(chestBase, chestLid, chestBand);

    tank.add(
      backGlass,
      frontGlass,
      leftGlass,
      rightGlass,
      bottomGlass,
      topRim,
      water,
      sand,
      ...pebbles,
      makeFish(-0.92, 0.72, 0.18, fishMaterials[0], 1, 0.82, 0.1),
      makeFish(0.08, 0.55, -0.18, fishMaterials[1], -1, 1.05, 1.9),
      makeFish(1.05, 0.82, 0.05, fishMaterials[2], 1, 0.72, 3.4),
      ...seaweed,
      chest,
    );

    table.add(top, apronFront, apronBack, ...legs, tank);
    house.add(table);
    const tableCollider = addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, tableLength + 0.18, tableDepth + 0.18);
    addCrawlUnderCollider(tableCollider, CENTER_X + localX, HOUSE_CENTER_Z + localZ, tableLength + 0.18, tableDepth + 0.18, 0.18);
  };

  const addRoundRoseTable = (localX: number, localZ: number): void => {
    const table = new Group();
    table.position.set(localX, 0, localZ);

    const top = new Mesh(new CylinderGeometry(0.82, 0.82, 0.16, 32), furnitureWoodMaterial);
    top.position.y = 0.82;
    const pedestal = new Mesh(new CylinderGeometry(0.13, 0.18, 0.72, 16), furnitureWoodMaterial);
    pedestal.position.y = 0.42;
    const base = new Mesh(new CylinderGeometry(0.48, 0.54, 0.08, 24), houseTrimMaterial);
    base.position.y = 0.08;
    const feet = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle) => {
      const foot = new Mesh(new BoxGeometry(0.56, 0.08, 0.16), houseTrimMaterial);
      foot.position.set(Math.sin(angle) * 0.26, 0.1, Math.cos(angle) * 0.26);
      foot.rotation.y = angle;
      return foot;
    });

    const pot = new Mesh(new CylinderGeometry(0.21, 0.3, 0.36, 18), plantPotMaterial);
    pot.position.y = 1.09;
    const potLip = new Mesh(new CylinderGeometry(0.32, 0.32, 0.07, 18), plantPotMaterial);
    potLip.position.y = 1.3;
    const potSoilMaterial = new MeshStandardMaterial({
      color: 0x2f2118,
      roughness: 0.95,
      metalness: 0.01,
    });
    const soil = new Mesh(new CylinderGeometry(0.22, 0.24, 0.035, 18), potSoilMaterial);
    soil.position.y = 1.35;

    const roseStemMaterial = new MeshStandardMaterial({
      color: 0x2e7b37,
      roughness: 0.78,
      metalness: 0.01,
    });
    const roseCenterMaterial = new MeshStandardMaterial({
      color: 0xf1c15a,
      roughness: 0.64,
      metalness: 0.03,
    });
    const redRoseMaterial = new MeshStandardMaterial({
      color: 0xc92230,
      emissive: 0x1a0205,
      emissiveIntensity: 0.05,
      roughness: 0.6,
      metalness: 0.01,
    });
    const pinkRoseMaterial = new MeshStandardMaterial({
      color: 0xf58ab5,
      emissive: 0x240512,
      emissiveIntensity: 0.05,
      roughness: 0.58,
      metalness: 0.01,
    });
    const blueRoseMaterial = new MeshStandardMaterial({
      color: 0x3f80d7,
      emissive: 0x03142a,
      emissiveIntensity: 0.05,
      roughness: 0.58,
      metalness: 0.01,
    });
    const yellowRoseMaterial = new MeshStandardMaterial({
      color: 0xffd750,
      emissive: 0x241a02,
      emissiveIntensity: 0.04,
      roughness: 0.58,
      metalness: 0.01,
    });

    const addRose = (
      x: number,
      z: number,
      height: number,
      material: MeshStandardMaterial,
      leanX: number,
      leanZ: number,
    ): void => {
      const rose = new Group();
      rose.position.set(x, 1.36, z);
      const stem = new Mesh(new CylinderGeometry(0.012, 0.017, height, 8), roseStemMaterial);
      stem.position.set(leanX / 2, height / 2, leanZ / 2);
      stem.rotation.z = -leanX * 0.28;
      stem.rotation.x = leanZ * 0.28;
      const flowerY = height + 0.02;
      const flowerX = leanX;
      const flowerZ = leanZ;
      const center = new Mesh(new SphereGeometry(0.045, 10, 8), roseCenterMaterial);
      center.position.set(flowerX, flowerY, flowerZ);
      const petals = [0, 1, 2, 3, 4].map((index) => {
        const petal = new Mesh(new SphereGeometry(0.055, 10, 8), material);
        const angle = (index / 5) * Math.PI * 2;
        petal.scale.set(1.2, 0.72, 0.82);
        petal.position.set(
          flowerX + Math.sin(angle) * 0.042,
          flowerY + Math.cos(angle) * 0.01,
          flowerZ + Math.cos(angle) * 0.042,
        );
        return petal;
      });
      const leaves = [
        [-0.055, height * 0.56, 0.005],
        [0.05, height * 0.42, -0.005],
      ].map(([leafX, leafY, leafZ]) => {
        const leaf = new Mesh(new SphereGeometry(0.055, 8, 6), plantLeafMaterial);
        leaf.scale.set(1.35, 0.44, 0.72);
        leaf.position.set(leafX, leafY, leafZ);
        return leaf;
      });
      rose.add(stem, center, ...petals, ...leaves);
      table.add(rose);
    };

    addRose(-0.08, 0.02, 0.48, redRoseMaterial, -0.06, 0.02);
    addRose(0.08, -0.03, 0.43, pinkRoseMaterial, 0.05, -0.03);
    addRose(0.0, 0.1, 0.5, pinkRoseMaterial, 0.01, 0.07);
    addRose(-0.12, -0.08, 0.4, blueRoseMaterial, -0.04, -0.05);
    addRose(0.13, 0.07, 0.46, yellowRoseMaterial, 0.06, 0.04);

    table.add(top, pedestal, base, ...feet, pot, potLip, soil);
    house.add(table);
    const tableCollider = addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, 1.72, 1.72);
    addCrawlUnderCollider(tableCollider, CENTER_X + localX, HOUSE_CENTER_Z + localZ, 1.72, 1.72, 0.14);
  };

  const addSquareBookTable = (localX: number, localZ: number): void => {
    const table = new Group();
    table.position.set(localX, 0, localZ);

    const top = new Mesh(new BoxGeometry(1.72, 0.16, 1.72), furnitureWoodMaterial);
    top.position.y = 0.92;
    const lowerShelf = new Mesh(new BoxGeometry(1.42, 0.08, 1.42), houseTrimMaterial);
    lowerShelf.position.y = 0.42;
    const legs = [
      [-0.66, -0.66],
      [0.66, -0.66],
      [-0.66, 0.66],
      [0.66, 0.66],
    ].map(([legX, legZ]) => {
      const leg = new Mesh(new BoxGeometry(0.14, 0.84, 0.14), furnitureWoodMaterial);
      leg.position.set(legX, 0.48, legZ);
      return leg;
    });

    const pageMaterial = new MeshStandardMaterial({
      color: 0xe8dfc6,
      roughness: 0.88,
      metalness: 0.01,
    });
    const bookSizes: Array<[number, number, number]> = [
      [0.9, 0.16, 0.62],
      [0.82, 0.14, 0.58],
      [0.94, 0.13, 0.54],
      [0.74, 0.12, 0.5],
    ];
    const books = bookSizes.map(([width, height, depth], index) => {
      const book = new Group();
      book.position.set((index % 2 === 0 ? -0.03 : 0.04), 1.01 + index * 0.15, (index - 1.5) * 0.025);
      book.rotation.y = (index - 1.5) * 0.07;
      const cover = new Mesh(new BoxGeometry(width, height, depth), bookMaterials[index % bookMaterials.length]);
      const pages = new Mesh(new BoxGeometry(width - 0.1, height + 0.012, 0.055), pageMaterial);
      pages.position.z = depth / 2 + 0.005;
      const spineBand = new Mesh(new BoxGeometry(0.08, height + 0.016, depth + 0.012), houseTrimMaterial);
      spineBand.position.x = -width / 2 + 0.07;
      book.add(cover, pages, spineBand);
      return book;
    });

    table.add(top, lowerShelf, ...legs, ...books);
    house.add(table);
    const tableCollider = addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, 1.86, 1.86);
    crawlUnderTableColliders.push({
      collider: tableCollider,
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: 1.86 / 2,
      halfDepth: 1.86 / 2,
    });
  };

  const addSideGrandfatherClock = (wallLocalX: number, localZ: number, normalX: 1 | -1): void => {
    const depth = 0.68;
    const clock = new Group();
    clock.position.set(wallLocalX + normalX * depth / 2, 0, localZ);
    clock.rotation.y = -normalX * Math.PI / 2;

    const clockWoodMaterial = new MeshStandardMaterial({
      color: 0x2f1b12,
      emissive: 0x070302,
      emissiveIntensity: 0.05,
      roughness: 0.76,
      metalness: 0.02,
    });
    const clockTrimMaterial = new MeshStandardMaterial({
      color: 0x5a351f,
      emissive: 0x0d0502,
      emissiveIntensity: 0.06,
      roughness: 0.7,
      metalness: 0.04,
    });
    const brassMaterial = new MeshStandardMaterial({
      color: 0xd0a13a,
      emissive: 0x241605,
      emissiveIntensity: 0.12,
      roughness: 0.34,
      metalness: 0.55,
    });
    const clockFaceMaterial = (() => {
      if (typeof document === 'undefined') {
        return new MeshStandardMaterial({
          color: 0xefe2c4,
          roughness: 0.62,
          metalness: 0.02,
          side: DoubleSide,
        });
      }

      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#efe2c4';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = '#3a2215';
        context.lineWidth = 8;
        context.beginPath();
        context.arc(128, 128, 104, 0, Math.PI * 2);
        context.stroke();
        context.strokeStyle = '#b78934';
        context.lineWidth = 5;
        context.beginPath();
        context.arc(128, 128, 92, 0, Math.PI * 2);
        context.stroke();
        context.fillStyle = '#2b1a12';
        context.font = 'bold 22px Georgia';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        const numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
        numerals.forEach((numeral, index) => {
          const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
          context.fillText(numeral, 128 + Math.cos(angle) * 70, 128 + Math.sin(angle) * 70);
        });
        for (let tick = 0; tick < 60; tick += 1) {
          const angle = (tick / 60) * Math.PI * 2 - Math.PI / 2;
          const outer = tick % 5 === 0 ? 91 : 87;
          const inner = tick % 5 === 0 ? 80 : 84;
          context.strokeStyle = tick % 5 === 0 ? '#3a2215' : '#7c6248';
          context.lineWidth = tick % 5 === 0 ? 3 : 1;
          context.beginPath();
          context.moveTo(128 + Math.cos(angle) * inner, 128 + Math.sin(angle) * inner);
          context.lineTo(128 + Math.cos(angle) * outer, 128 + Math.sin(angle) * outer);
          context.stroke();
        }
        context.strokeStyle = '#25140d';
        context.lineCap = 'round';
        context.lineWidth = 7;
        context.beginPath();
        context.moveTo(128, 128);
        context.lineTo(128, 78);
        context.stroke();
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(128, 128);
        context.lineTo(168, 142);
        context.stroke();
        context.fillStyle = '#b78934';
        context.beginPath();
        context.arc(128, 128, 8, 0, Math.PI * 2);
        context.fill();
      }
      const texture = new CanvasTexture(canvas);
      texture.needsUpdate = true;
      return new MeshStandardMaterial({
        map: texture,
        roughness: 0.58,
        metalness: 0.02,
        side: DoubleSide,
      });
    })();

    const base = new Mesh(new BoxGeometry(1.55, 0.34, depth + 0.1), clockTrimMaterial);
    base.position.y = 0.17;
    const lowerCase = new Mesh(new BoxGeometry(1.16, 2.75, depth), clockWoodMaterial);
    lowerCase.position.y = 1.62;
    const upperCase = new Mesh(new BoxGeometry(1.34, 1.26, depth + 0.05), clockWoodMaterial);
    upperCase.position.y = 3.72;
    const neck = new Mesh(new BoxGeometry(1.04, 0.46, depth * 0.92), clockWoodMaterial);
    neck.position.y = 2.98;
    const crown = new Mesh(new BoxGeometry(1.62, 0.28, depth + 0.16), clockTrimMaterial);
    crown.position.y = 4.47;
    const crownCap = new Mesh(new BoxGeometry(1.82, 0.14, depth + 0.24), brassMaterial);
    crownCap.position.y = 4.68;
    const roof = new Mesh(new ConeGeometry(0.98, 0.46, 4), clockTrimMaterial);
    roof.position.y = 4.98;
    roof.rotation.y = Math.PI / 4;

    const frontZ = -depth / 2 - 0.035;
    const rearPanel = new Mesh(new BoxGeometry(1.2, 4.25, 0.08), clockTrimMaterial);
    rearPanel.position.set(0, 2.26, depth / 2 - 0.035);
    const frontPosts = [-0.64, 0.64].map((postX) => {
      const post = new Mesh(new CylinderGeometry(0.06, 0.075, 4.12, 12), clockTrimMaterial);
      post.position.set(postX, 2.22, frontZ);
      return post;
    });
    const lowerRails = [0.52, 2.68].map((railY) => {
      const rail = new Mesh(new BoxGeometry(1.28, 0.12, 0.1), clockTrimMaterial);
      rail.position.set(0, railY, frontZ);
      return rail;
    });

    const glassPanel = new Mesh(new BoxGeometry(0.88, 1.7, 0.035), slidingGlassMaterial);
    glassPanel.position.set(0, 1.55, frontZ - 0.012);
    const pendulumRod = new Mesh(new CylinderGeometry(0.016, 0.016, 1.22, 8), brassMaterial);
    pendulumRod.position.set(0, 1.58, frontZ - 0.03);
    const pendulumBob = new Mesh(new SphereGeometry(0.2, 24, 16), brassMaterial);
    pendulumBob.scale.set(1, 1.18, 0.22);
    pendulumBob.position.set(0, 0.9, frontZ - 0.045);
    const weights = [-0.25, 0.25].map((weightX) => {
      const weight = new Mesh(new CylinderGeometry(0.075, 0.075, 0.62, 14), brassMaterial);
      weight.position.set(weightX, 1.72, frontZ - 0.045);
      return weight;
    });
    const chains = [-0.25, 0.25].map((chainX) => {
      const chain = new Mesh(new CylinderGeometry(0.008, 0.008, 1.35, 6), brassMaterial);
      chain.position.set(chainX, 2.05, frontZ - 0.05);
      return chain;
    });
    grandfatherClockMotionParts.push({
      rod: pendulumRod,
      rodBaseRotationZ: pendulumRod.rotation.z,
      bob: pendulumBob,
      bobBaseX: pendulumBob.position.x,
      weights,
      weightBaseYs: weights.map((weight) => weight.position.y),
    });

    const clockFace = new Mesh(new CylinderGeometry(0.45, 0.45, 0.035, 48), clockFaceMaterial);
    clockFace.rotation.x = Math.PI / 2;
    clockFace.position.set(0, 3.84, frontZ - 0.035);
    const clockBezel = new Mesh(new TorusGeometry(0.48, 0.035, 10, 48), brassMaterial);
    clockBezel.position.set(0, 3.84, frontZ - 0.062);
    const upperGlass = new Mesh(new BoxGeometry(1.02, 1.04, 0.035), slidingGlassMaterial);
    upperGlass.position.set(0, 3.84, frontZ - 0.08);
    const upperFrameTop = new Mesh(new BoxGeometry(1.12, 0.1, 0.1), clockTrimMaterial);
    upperFrameTop.position.set(0, 4.42, frontZ - 0.02);
    const upperFrameBottom = upperFrameTop.clone();
    upperFrameBottom.position.y = 3.22;
    const upperFrameLeft = new Mesh(new BoxGeometry(0.1, 1.18, 0.1), clockTrimMaterial);
    upperFrameLeft.position.set(-0.6, 3.82, frontZ - 0.02);
    const upperFrameRight = upperFrameLeft.clone();
    upperFrameRight.position.x = 0.6;
    const finials = [-0.62, 0, 0.62].map((finialX, index) => {
      const finial = new Group();
      finial.position.set(finialX, index === 1 ? 5.28 : 4.9, -0.01);
      const stem = new Mesh(new CylinderGeometry(0.025, 0.03, 0.22, 10), brassMaterial);
      stem.position.y = -0.08;
      const ball = new Mesh(new SphereGeometry(index === 1 ? 0.1 : 0.075, 12, 8), brassMaterial);
      ball.position.y = 0.06;
      finial.add(stem, ball);
      return finial;
    });

    clock.add(
      base,
      lowerCase,
      upperCase,
      neck,
      crown,
      crownCap,
      roof,
      rearPanel,
      ...frontPosts,
      ...lowerRails,
      glassPanel,
      pendulumRod,
      pendulumBob,
      ...weights,
      ...chains,
      clockFace,
      clockBezel,
      upperGlass,
      upperFrameTop,
      upperFrameBottom,
      upperFrameLeft,
      upperFrameRight,
      ...finials,
    );
    house.add(clock);
    addCollider(
      colliders,
      CENTER_X + wallLocalX + normalX * (depth / 2 + 0.08),
      HOUSE_CENTER_Z + localZ,
      0.72,
      1.62,
    );
  };

  const addDiningTable = (localX: number, localZ: number): void => {
    const table = new Group();
    table.position.set(localX, 0, localZ);

    const top = new Mesh(new BoxGeometry(5, 0.24, 2.35), furnitureWoodMaterial);
    top.position.y = 0.98;
    const legOffsets: Array<[number, number]> = [
      [-2.12, -0.88],
      [2.12, -0.88],
      [-2.12, 0.88],
      [2.12, 0.88],
    ];
    const legs = legOffsets.map(([legX, legZ]) => {
      const leg = new Mesh(new BoxGeometry(0.28, 0.92, 0.28), furnitureWoodMaterial);
      leg.position.set(legX, 0.46, legZ);
      return leg;
    });

    table.add(top, ...legs);
    house.add(table);
    const tableCollider = addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, 5.1, 2.45);
    crawlUnderTableColliders.push({
      collider: tableCollider,
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: 5.1 / 2,
      halfDepth: 2.45 / 2,
    });

    addChair(localX, localZ - 1.56, 0);
    addChair(localX, localZ + 1.56, Math.PI);
    addChair(localX - 2.32, localZ, Math.PI / 2);
    addChair(localX + 2.32, localZ, -Math.PI / 2);
  };

  const addOutdoorChair = (worldX: number, worldZ: number, rotationY: number): void => {
    const chair = new Group();
    chair.position.set(worldX, 0, worldZ);
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
    root.add(chair);
    const chairCollider = addCollider(colliders, worldX, worldZ, 0.92, 0.92);
    addCrawlUnderCollider(chairCollider, worldX, worldZ, 0.92, 0.92, 0.06);
  };

  const addOutdoorRoundTableSet = (worldX: number, worldZ: number): void => {
    const table = new Group();
    table.position.set(worldX, 0, worldZ);

    const top = new Mesh(new CylinderGeometry(1.35, 1.35, 0.14, 32), furnitureWoodMaterial);
    top.position.y = 1.05;
    const pedestal = new Mesh(new CylinderGeometry(0.18, 0.24, 0.98, 14), furnitureWoodMaterial);
    pedestal.position.y = 0.52;
    const foot = new Mesh(new CylinderGeometry(0.68, 0.74, 0.1, 20), furnitureWoodMaterial);
    foot.position.y = 0.05;
    table.add(top, pedestal, foot);
    root.add(table);
    const tableCollider = addCollider(colliders, worldX, worldZ, 2.78, 2.78);
    crawlUnderTableColliders.push({
      collider: tableCollider,
      centerX: worldX,
      centerZ: worldZ,
      halfWidth: 2.78 / 2,
      halfDepth: 2.78 / 2,
    });

    const chairDistance = 2.06;
    const chairAngles = [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6];
    chairAngles.forEach((angle) => {
      const chairX = worldX + Math.cos(angle) * chairDistance;
      const chairZ = worldZ + Math.sin(angle) * chairDistance;
      addOutdoorChair(chairX, chairZ, Math.atan2(worldX - chairX, worldZ - chairZ));
    });
  };

  const addOutdoorSwingSet = (
    worldX: number,
    worldZ: number,
    rotationY: number,
    scale = 1,
  ): ChapterSevenSwingSet => {
    const swingRoot = new Group();
    swingRoot.position.set(worldX, 0, worldZ);
    swingRoot.rotation.y = rotationY;
    const topBeamY = 2.86 * scale;
    const chainLength = 1.72 * scale;
    const seatY = 0.98 * scale;
    const seatWidth = 0.56 * scale;
    const seatDepth = 0.22 * scale;
    const swingSpacing = [-1.2, -0.4, 0.4, 1.2];

    const topBeam = new Mesh(new BoxGeometry(4.04 * scale, 0.13 * scale, 0.14 * scale), swingFrameMaterial);
    topBeam.position.y = topBeamY;

    const legOffsets: Array<[number, number, number, number]> = [
      [-1.74, 1.38, -0.42, 0.24],
      [-1.74, 1.38, 0.42, -0.24],
      [1.74, 1.38, -0.42, -0.24],
      [1.74, 1.38, 0.42, 0.24],
    ];
    legOffsets.forEach(([legX, legY, legZ, tiltZ]) => {
      const leg = new Mesh(new CylinderGeometry(0.065 * scale, 0.085 * scale, 2.86 * scale, 10), swingFrameMaterial);
      leg.position.set(legX * scale, legY * scale, legZ * scale);
      leg.rotation.z = tiltZ;
      swingRoot.add(leg);
    });

    const braces: Array<[number, number, number, number]> = [
      [-1.38, 1.2, -0.02, -0.72],
      [1.38, 1.2, -0.02, 0.72],
    ];
    braces.forEach(([braceX, braceY, braceZ, rotZ]) => {
      const brace = new Mesh(new BoxGeometry(0.14 * scale, 1.16 * scale, 0.08 * scale), swingConnectorMaterial);
      brace.position.set(braceX * scale, braceY * scale, braceZ * scale);
      brace.rotation.z = rotZ;
      swingRoot.add(brace);
    });

    const swingPivot = new Group();
    swingPivot.position.y = topBeamY - 0.04 * scale;
    const swingRig = new Group();
    swingPivot.add(swingRig);
    const seatAnchor = new Group();
    const lookAnchor = new Group();
    swingSpacing.forEach((swingX, index) => {
      const chainLeft = new Mesh(new CylinderGeometry(0.015 * scale, 0.015 * scale, chainLength, 8), swingChainMaterial);
      const chainRight = chainLeft.clone();
      const chainSpread = 0.2 * scale;
      chainLeft.position.set(swingX * scale - chainSpread, -chainLength * 0.5, 0);
      chainRight.position.set(swingX * scale + chainSpread, -chainLength * 0.5, 0);
      chainLeft.rotation.z = index % 2 === 0 ? 0.03 : -0.03;
      chainRight.rotation.z = index % 2 === 0 ? 0.05 : -0.05;

      const seat = new Mesh(new BoxGeometry(seatWidth, 0.07 * scale, seatDepth), swingSeatMaterial);
      seat.position.set(swingX * scale, -topBeamY + seatY, 0);
      seat.rotation.x = index % 2 === 0 ? 0.03 : -0.03;
      swingRig.add(chainLeft, chainRight, seat);
    });

    seatAnchor.position.set(-0.4 * scale, -topBeamY + seatY + 0.54 * scale, -0.02 * scale);
    lookAnchor.position.set(0, -topBeamY + seatY + 0.42 * scale, 3.8 * scale);
    swingRig.add(seatAnchor, lookAnchor);
    swingRoot.add(topBeam, swingPivot);
    root.add(swingRoot);

    const swingCollider = addRotatedCollider(colliders, worldX - CENTER_X, worldZ - HOUSE_CENTER_Z, rotationY, 0, 0, 4.45 * scale, 1.12 * scale);
    addCrawlUnderCollider(swingCollider, worldX, worldZ, 4.45 * scale, 1.12 * scale, 0.12);

    const interactPoint = getRotatedLocalPoint(worldX - CENTER_X, worldZ - HOUSE_CENTER_Z, rotationY, 0, 1.76 * scale);
    const exitPoint = getRotatedLocalPoint(worldX - CENTER_X, worldZ - HOUSE_CENTER_Z, rotationY, 0, 2.25 * scale);
    const lookPoint = getRotatedLocalPoint(worldX - CENTER_X, worldZ - HOUSE_CENTER_Z, rotationY, 0, 4.2 * scale);

    return {
      label: 'Swing Set',
      interactPosition: new Vector3(CENTER_X + interactPoint.x, 1.02, HOUSE_CENTER_Z + interactPoint.z),
      aimPosition: new Vector3(CENTER_X + interactPoint.x, 1.28, HOUSE_CENTER_Z + interactPoint.z),
      sitPosition: new Vector3(worldX, 1.38, worldZ),
      exitPosition: new Vector3(CENTER_X + exitPoint.x, GAME_CONFIG.player.height, HOUSE_CENTER_Z + exitPoint.z),
      lookTarget: new Vector3(CENTER_X + lookPoint.x, 1.46, HOUSE_CENTER_Z + lookPoint.z),
      seatAnchor,
      lookAnchor,
      pivot: swingPivot,
      baseX: worldX,
      baseZ: worldZ,
      rotationY,
      occupied: false,
      angle: 0,
      swingPhase: 0,
      swingPower: 0,
    };
  };

  const addRotatedFurnitureCollider = (
    localX: number,
    localZ: number,
    width: number,
    depth: number,
    rotationY: number,
  ): CollisionBox => {
    const colliderWidth = Math.abs(Math.cos(rotationY)) * width + Math.abs(Math.sin(rotationY)) * depth;
    const colliderDepth = Math.abs(Math.sin(rotationY)) * width + Math.abs(Math.cos(rotationY)) * depth;
    return addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, colliderWidth, colliderDepth);
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
    const chairCollider = addRotatedFurnitureCollider(localX, localZ, 1.58, 1.86, rotationY);
    const chairBounds = getRotatedBounds(1.58, 1.86, rotationY);
    addCrawlUnderCollider(chairCollider, CENTER_X + localX, HOUSE_CENTER_Z + localZ, chairBounds.width, chairBounds.depth, 0.12);
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
      root: box,
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

  const cookiePickups: ChapterSevenCookiePickup[] = [];
  let cookieReloadSeed = Math.random() * 100000;

  const addDrawer = (localX: number, localZ: number, rotationY = 0, label = 'Small Drawer'): ChapterSevenDrawer => {
    const drawer = new Group();
    drawer.position.set(localX, 0, localZ);
    drawer.rotation.y = rotationY;
    drawer.scale.set(0.88, 0.74, 0.88);

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
      const slideCookies: ChapterSevenCookiePickup[] = [];
      for (let cookieIndex = 0; cookieIndex < cookieCount; cookieIndex += 1) {
        const side = cookieCount === 1 ? 0 : cookieIndex === 0 ? -1 : 1;
        const cookieRoot = new Group();
        cookieRoot.position.set(side * 0.34, -0.115, 0.05 + cookieIndex * 0.12);
        const cookie = new Mesh(new CylinderGeometry(0.15, 0.15, 0.045, 18), cookieMaterial);
        const chipOffsets = [
          [-0.045, 0.018],
          [0.04, -0.025],
          [0.015, 0.046],
        ];
        chipOffsets.forEach(([chipX, chipZ]) => {
          const chip = new Mesh(new SphereGeometry(0.018, 8, 6), chocolateChipMaterial);
          chip.position.set(chipX, 0.035, chipZ);
          chip.scale.y = 0.42;
          cookieRoot.add(chip);
        });
        cookieRoot.add(cookie);
        slide.add(cookieRoot);
        const cookiePickup = {
          label: `${label} ${index === 0 ? 'bottom' : index === 1 ? 'middle' : 'top'} drawer cookie`,
          root: cookieRoot,
          drawer: undefined as unknown as ChapterSevenDrawerSlide,
          interactPosition: new Vector3(),
          aimPosition: new Vector3(),
          collected: false,
          active: true,
          shuffleSeed: (localX + 41.3) * 12.19 + (localZ - 18.8) * 7.73 + index * 11.9 + cookieIndex * 5.1,
        };
        slideCookies.push(cookiePickup);
        cookiePickups.push(cookiePickup);
      }
      drawer.add(slide);
      const worldY = drawerY * drawer.scale.y;
      const drawerSlide: ChapterSevenDrawerSlide = {
        label: `${label} ${index === 0 ? 'bottom' : index === 1 ? 'middle' : 'top'} drawer`,
        interactPosition: new Vector3(frontWorldX, GAME_CONFIG.player.height, frontWorldZ),
        aimPosition: new Vector3(
          worldX + frontDirection.x * 0.68,
          Math.max(0.52, worldY),
          worldZ + frontDirection.z * 0.68,
        ),
        cookieCount,
        cookies: slideCookies,
        root: slide,
        closedZ: 0,
        openZ: 0.72 + index * 0.06,
        open: false,
        openAmount: 0,
        targetOpenAmount: 0,
      };
      slideCookies.forEach((cookie) => {
        cookie.drawer = drawerSlide;
      });
      return drawerSlide;
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

  const addCookie = (root: Group, x: number, y: number, z: number, scale = 1, label = 'Cookie'): ChapterSevenCookiePickup => {
    const cookieRoot = new Group();
    cookieRoot.position.set(x, y, z);
    const cookie = new Mesh(new CylinderGeometry(0.13 * scale, 0.13 * scale, 0.045 * scale, 18), cookieMaterial);
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
    cookieRoot.add(cookie);
    root.add(cookieRoot);
    const pickup = {
      label,
      root: cookieRoot,
      interactPosition: new Vector3(),
      aimPosition: new Vector3(),
      collected: false,
      active: true,
      shuffleSeed: (x + 17.2) * 9.11 + (y + 3.4) * 5.73 + (z - 1.7) * 13.41 + label.length * 2.9,
    };
    cookiePickups.push(pickup);
    return pickup;
  };

  const addLaundryBasket = (localX: number, localZ: number, rotationY = 0): void => {
    const basket = new Group();
    basket.position.set(localX, 0.18, localZ);
    basket.rotation.y = rotationY;

    const width = 1.72;
    const depth = 1.18;
    const height = 1.0;
    const bottom = new Mesh(new BoxGeometry(width, 0.1, depth), laundryBasketMaterial);
    bottom.position.y = 0.05;
    const rimFront = new Mesh(new BoxGeometry(width + 0.16, 0.12, 0.12), laundryBasketMaterial);
    rimFront.position.set(0, height, depth / 2);
    const rimBack = rimFront.clone();
    rimBack.position.z = -depth / 2;
    const rimLeft = new Mesh(new BoxGeometry(0.12, 0.12, depth + 0.16), laundryBasketMaterial);
    rimLeft.position.set(-width / 2, height, 0);
    const rimRight = rimLeft.clone();
    rimRight.position.x = width / 2;
    basket.add(bottom, rimFront, rimBack, rimLeft, rimRight);

    const addBasketSide = (z: number): void => {
      for (let row = 0; row < 3; row += 1) {
        const rail = new Mesh(new BoxGeometry(width, 0.07, 0.08), laundryBasketMaterial);
        rail.position.set(0, 0.28 + row * 0.22, z);
        basket.add(rail);
      }
      for (let column = 0; column < 7; column += 1) {
        const x = -width / 2 + 0.18 + column * ((width - 0.36) / 6);
        const rib = new Mesh(new BoxGeometry(0.055, 0.72, 0.075), laundryBasketMaterial);
        rib.position.set(x, 0.54, z);
        basket.add(rib);
      }
      for (let column = 0; column < 6; column += 1) {
        for (let row = 0; row < 2; row += 1) {
          const hole = new Mesh(new BoxGeometry(0.12, 0.1, 0.012), laundryBasketShadowMaterial);
          hole.position.set(-0.56 + column * 0.22, 0.4 + row * 0.22, z + Math.sign(z) * 0.042);
          basket.add(hole);
        }
      }
    };

    const addBasketEnd = (x: number): void => {
      for (let column = 0; column < 5; column += 1) {
        const rib = new Mesh(new BoxGeometry(0.075, 0.68, 0.055), laundryBasketMaterial);
        rib.position.set(x, 0.54, -depth / 2 + 0.18 + column * ((depth - 0.36) / 4));
        basket.add(rib);
      }
      for (let row = 0; row < 3; row += 1) {
        const rail = new Mesh(new BoxGeometry(0.08, 0.06, depth), laundryBasketMaterial);
        rail.position.set(x, 0.3 + row * 0.22, 0);
        basket.add(rail);
      }
    };

    addBasketSide(depth / 2);
    addBasketSide(-depth / 2);
    addBasketEnd(width / 2);
    addBasketEnd(-width / 2);

    const clothPositions: Array<[number, number, number, number, number]> = [
      [-0.48, 0.2, -0.22, 0.18, -0.12],
      [0.02, 0.24, 0.18, -0.12, 0.18],
      [0.42, 0.3, -0.12, 0.2, 0.28],
      [-0.22, 0.44, 0.0, -0.24, -0.18],
      [0.28, 0.54, 0.24, 0.28, 0.12],
      [-0.42, 0.66, 0.2, -0.18, 0.26],
      [0.04, 0.78, -0.2, 0.22, -0.22],
      [0.38, 0.88, 0.04, -0.18, 0.18],
      [-0.16, 0.92, 0.22, 0.16, -0.14],
    ];
    clothPositions.forEach(([x, y, z, rotX, rotZ], index) => {
      const cloth = new Mesh(new BoxGeometry(0.52, 0.16, 0.38), laundryClothMaterials[index % laundryClothMaterials.length]);
      cloth.position.set(x, y, z);
      cloth.rotation.set(rotX, index * 0.27, rotZ);
      basket.add(cloth);
    });

    house.add(basket);
    const basketCollider = addRotatedCollider(colliders, localX, localZ, rotationY, 0, 0, width + 0.2, depth + 0.2);
    const basketBounds = getRotatedBounds(width + 0.2, depth + 0.2, rotationY);
    counterSurfaces.push({
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: basketBounds.width / 2,
      halfDepth: basketBounds.depth / 2,
      floorY: height + 0.08,
      collider: basketCollider,
    });
  };

  const addSmallBathroomTrashCan = (localX: number, localZ: number, rotationY = 0): void => {
    const trashCan = new Group();
    trashCan.position.set(localX, 0, localZ);
    trashCan.rotation.y = rotationY;

    const canMaterial = new MeshStandardMaterial({
      color: 0x8d9295,
      emissive: 0x08090a,
      emissiveIntensity: 0.035,
      roughness: 0.62,
      metalness: 0.18,
      side: DoubleSide,
    });
    const darkCanMaterial = new MeshStandardMaterial({
      color: 0x4a4f52,
      emissive: 0x030404,
      emissiveIntensity: 0.04,
      roughness: 0.78,
      metalness: 0.08,
    });

    const height = 0.78;
    const topRadius = 0.44;
    const bottomRadius = 0.28;
    const body = new Mesh(new CylinderGeometry(topRadius, bottomRadius, height, 32, 1, true), canMaterial);
    body.position.y = height / 2 + 0.04;
    const bottom = new Mesh(new CylinderGeometry(bottomRadius + 0.02, bottomRadius + 0.02, 0.08, 32), canMaterial);
    bottom.position.y = 0.04;
    const innerFloor = new Mesh(new CylinderGeometry(bottomRadius * 0.82, bottomRadius * 0.82, 0.025, 28), darkCanMaterial);
    innerFloor.position.y = 0.13;
    const rim = new Mesh(new TorusGeometry(topRadius, 0.035, 8, 36), canMaterial);
    rim.position.y = height + 0.04;
    rim.rotation.x = Math.PI / 2;
    const footRing = new Mesh(new TorusGeometry(bottomRadius + 0.04, 0.022, 8, 28), darkCanMaterial);
    footRing.position.y = 0.09;
    footRing.rotation.x = Math.PI / 2;
    const sideHighlights = [0, Math.PI * 0.62, Math.PI * 1.24].map((angle) => {
      const highlight = new Mesh(new BoxGeometry(0.035, 0.48, 0.018), darkCanMaterial);
      highlight.position.set(Math.sin(angle) * 0.35, 0.43, Math.cos(angle) * 0.35);
      highlight.rotation.y = angle;
      return highlight;
    });

    trashCan.add(body, bottom, innerFloor, rim, footRing, ...sideHighlights);
    house.add(trashCan);

    const collider = addRotatedCollider(colliders, localX, localZ, rotationY, 0, 0, topRadius * 2.2, topRadius * 2.2);
    counterSurfaces.push({
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: topRadius * 1.1,
      halfDepth: topRadius * 1.1,
      floorY: height + 0.1,
      collider,
    });
  };

  const addTrashCanFixture = (localX: number, localZ: number, rotationY = 0): ChapterSevenRearFixture => {
    const trashCan = new Group();
    trashCan.position.set(localX, 0, localZ);
    trashCan.rotation.y = rotationY;

    const width = 1.05;
    const depth = 0.92;
    const height = 1.08;
    const trashCanMaterial = new MeshStandardMaterial({
      color: 0x73777a,
      emissive: 0x080909,
      emissiveIntensity: 0.04,
      roughness: 0.58,
      metalness: 0.18,
    });
    const trashCanDarkMaterial = new MeshStandardMaterial({
      color: 0x3d4144,
      emissive: 0x030404,
      emissiveIntensity: 0.04,
      roughness: 0.72,
      metalness: 0.12,
    });
    const trashPaperMaterial = new MeshStandardMaterial({ color: 0xd7d0bd, roughness: 0.86, metalness: 0.01 });
    const chipsBagMaterial = new MeshStandardMaterial({ color: 0xe0b13f, roughness: 0.58, metalness: 0.08 });
    const appleMaterial = new MeshStandardMaterial({ color: 0x8b1f21, roughness: 0.72, metalness: 0.01 });
    const appleCoreMaterial = new MeshStandardMaterial({ color: 0xe7d9ad, roughness: 0.82, metalness: 0.01 });
    const bananaPeelMaterial = new MeshStandardMaterial({ color: 0xd4bd3a, roughness: 0.78, metalness: 0.01 });
    const rottenFishMaterial = new MeshStandardMaterial({ color: 0x627166, roughness: 0.72, metalness: 0.02 });

    const body = new Mesh(new BoxGeometry(width, height, depth), trashCanMaterial);
    body.position.y = height / 2;
    const frontSlab = new Mesh(new BoxGeometry(width * 0.56, 0.34, 0.045), trashCanMaterial);
    frontSlab.position.set(0, 0.46, depth / 2 + 0.028);
    const frontSlabInset = new Mesh(new BoxGeometry(width * 0.42, 0.2, 0.052), trashCanDarkMaterial);
    frontSlabInset.position.set(0, 0.46, depth / 2 + 0.056);
    const rim = new Mesh(new BoxGeometry(width + 0.1, 0.08, depth + 0.1), trashCanDarkMaterial);
    rim.position.y = height + 0.04;
    const inside = new Mesh(new BoxGeometry(width - 0.18, 0.12, depth - 0.18), ovenInteriorMaterial);
    inside.position.y = height + 0.02;
    const foot = new Mesh(new BoxGeometry(width * 0.8, 0.12, depth * 0.78), trashCanDarkMaterial);
    foot.position.y = 0.06;

    const lidPivot = new Group();
    lidPivot.position.set(0, height + 0.1, -depth / 2 + 0.06);
    const lid = new Mesh(new BoxGeometry(width + 0.16, 0.1, depth + 0.12), trashCanMaterial);
    lid.position.set(0, 0.02, depth / 2 - 0.06);
    const lidLip = new Mesh(new BoxGeometry(width + 0.26, 0.06, 0.08), trashCanDarkMaterial);
    lidLip.position.set(0, -0.01, depth + 0.02);
    const handle = new Mesh(new BoxGeometry(0.42, 0.08, 0.08), trashCanDarkMaterial);
    handle.position.set(0, 0.1, depth / 2 - 0.04);
    lidPivot.add(lid, lidLip, handle);

    const chipsBag = new Mesh(new BoxGeometry(0.32, 0.07, 0.24), chipsBagMaterial);
    chipsBag.position.set(-0.22, height + 0.11, 0.06);
    chipsBag.rotation.set(0.3, -0.42, 0.12);
    const chipsBagFold = new Mesh(new BoxGeometry(0.28, 0.035, 0.08), trashCanDarkMaterial);
    chipsBagFold.position.set(-0.22, height + 0.17, 0);
    chipsBagFold.rotation.set(0.3, -0.42, 0.12);
    const apple = new Mesh(new SphereGeometry(0.13, 14, 10), appleMaterial);
    apple.position.set(0.1, height + 0.1, 0.16);
    apple.scale.set(1, 0.82, 1);
    const appleBite = new Mesh(new SphereGeometry(0.07, 10, 8), appleCoreMaterial);
    appleBite.position.set(0.18, height + 0.13, 0.1);
    appleBite.scale.set(0.9, 0.7, 0.9);
    const fishBody = new Mesh(new SphereGeometry(0.17, 14, 8), rottenFishMaterial);
    fishBody.position.set(0.2, height + 0.08, -0.16);
    fishBody.scale.set(1.55, 0.38, 0.56);
    fishBody.rotation.y = 0.34;
    const fishTail = new Mesh(new ConeGeometry(0.1, 0.16, 3), rottenFishMaterial);
    fishTail.position.set(0.42, height + 0.08, -0.23);
    fishTail.rotation.set(0, 0.34, Math.PI / 2);
    const bananaPeels = [-0.16, 0, 0.16].map((peelX, index) => {
      const peel = new Mesh(new BoxGeometry(0.06, 0.035, 0.34), bananaPeelMaterial);
      peel.position.set(peelX - 0.08, height + 0.13 + index * 0.012, -0.08 + index * 0.05);
      peel.rotation.set(0.2 + index * 0.08, index * 0.46, (index - 1) * 0.45);
      return peel;
    });
    const papers = [
      [-0.36, height + 0.09, -0.16, 0.2, -0.2],
      [0, height + 0.16, -0.02, -0.14, 0.28],
      [0.34, height + 0.12, 0.12, 0.18, -0.36],
    ].map(([paperX, paperY, paperZ, rotX, rotZ]) => {
      const paper = new Mesh(new BoxGeometry(0.24, 0.035, 0.18), trashPaperMaterial);
      paper.position.set(paperX, paperY, paperZ);
      paper.rotation.set(rotX, 0.28, rotZ);
      return paper;
    });
    const trashCookie = new Group();
    addCookie(trashCookie, -0.02, height + 0.1, 0.26, 0.74);
    const trashContents = new Group();
    trashContents.visible = false;
    trashContents.add(
      chipsBag,
      chipsBagFold,
      apple,
      appleBite,
      fishBody,
      fishTail,
      ...bananaPeels,
      ...papers,
      trashCookie,
    );

    trashCan.add(
      body,
      frontSlab,
      frontSlabInset,
      rim,
      inside,
      foot,
      trashContents,
      lidPivot,
    );
    house.add(trashCan);

    const collider = addRotatedCollider(colliders, localX, localZ, rotationY, 0, 0, width + 0.16, depth + 0.16);
    const trashBounds = getRotatedBounds(width + 0.16, depth + 0.16, rotationY);
    counterSurfaces.push({
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: trashBounds.width / 2,
      halfDepth: trashBounds.depth / 2,
      floorY: height + 0.18,
      collider,
    });
    const interactPoint = getRotatedLocalPoint(localX, localZ, rotationY, 0, depth / 2 + 0.72);
    const aimPoint = getRotatedLocalPoint(localX, localZ, rotationY, 0, 0.18);
    return {
      label: 'Trash can',
      kind: 'trash-can',
      interactPosition: new Vector3(CENTER_X + interactPoint.x, GAME_CONFIG.player.height, HOUSE_CENTER_Z + interactPoint.z),
      aimPosition: new Vector3(CENTER_X + aimPoint.x, 0.82, HOUSE_CENTER_Z + aimPoint.z),
      doorPivots: [lidPivot],
      collider,
      animation: 'trash-lid',
      trashContents,
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
    };
  };

  const addWallShelf = (localX: number, localY: number, localZ: number, normalX: 1 | -1): void => {
    const shelf = new Group();
    shelf.position.set(localX + normalX * 0.16, localY, localZ);
    shelf.rotation.y = normalX > 0 ? Math.PI / 2 : -Math.PI / 2;

    const board = new Mesh(new BoxGeometry(3.0, 0.14, 0.36), houseTrimMaterial);
    const backLip = new Mesh(new BoxGeometry(3.08, 0.18, 0.08), furnitureWoodMaterial);
    backLip.position.set(0, 0.14, -0.18);
    const leftBracket = new Mesh(new BoxGeometry(0.1, 0.5, 0.12), furnitureWoodMaterial);
    leftBracket.position.set(-1.08, -0.26, -0.08);
    leftBracket.rotation.x = -0.4;
    const rightBracket = leftBracket.clone();
    rightBracket.position.x = 1.08;

    const pot = new Mesh(new CylinderGeometry(0.16, 0.22, 0.32, 14), plantPotMaterial);
    pot.position.set(-0.72, 0.28, 0.02);
    const plantStem = new Mesh(new CylinderGeometry(0.02, 0.026, 0.42, 8), plantLeafMaterial);
    plantStem.position.set(-0.72, 0.62, 0.02);
    const leafLeft = new Mesh(new SphereGeometry(0.14, 10, 8), plantLeafMaterial);
    leafLeft.scale.set(1.35, 0.32, 0.62);
    leafLeft.position.set(-0.88, 0.7, 0.02);
    leafLeft.rotation.z = -0.45;
    const leafRight = leafLeft.clone();
    leafRight.position.x = -0.56;
    leafRight.rotation.z = 0.45;

    addCookie(shelf, 0.62, 0.1, 0.02, 1.0);
    shelf.add(board, backLip, leftBracket, rightBracket, pot, plantStem, leafLeft, leafRight);
    house.add(shelf);
  };

  const addTowelDuckShelf = (localX: number, localY: number, localZ: number, normalX: 1 | -1): void => {
    const shelf = new Group();
    shelf.position.set(localX + normalX * 0.16, localY, localZ);
    shelf.rotation.y = normalX > 0 ? Math.PI / 2 : -Math.PI / 2;

    const towelMaterials = [
      new MeshStandardMaterial({ color: 0xf3f1e7, roughness: 0.88, metalness: 0.01 }),
      new MeshStandardMaterial({ color: 0xf1cf45, roughness: 0.88, metalness: 0.01 }),
      new MeshStandardMaterial({ color: 0x3f84cf, roughness: 0.87, metalness: 0.01 }),
      new MeshStandardMaterial({ color: 0xb83a32, roughness: 0.88, metalness: 0.01 }),
      new MeshStandardMaterial({ color: 0x7a4d31, roughness: 0.9, metalness: 0.01 }),
      new MeshStandardMaterial({ color: 0x4b8a42, roughness: 0.88, metalness: 0.01 }),
    ];
    const board = new Mesh(new BoxGeometry(3.15, 0.14, 0.42), houseTrimMaterial);
    const backLip = new Mesh(new BoxGeometry(3.22, 0.22, 0.09), furnitureWoodMaterial);
    backLip.position.set(0, 0.16, -0.2);
    const leftBracket = new Mesh(new BoxGeometry(0.1, 0.52, 0.12), furnitureWoodMaterial);
    leftBracket.position.set(-1.16, -0.28, -0.08);
    leftBracket.rotation.x = -0.4;
    const rightBracket = leftBracket.clone();
    rightBracket.position.x = 1.16;
    const towels = [-0.82, -0.2, 0.42].map((towelX, index) => {
      const towelStack = new Group();
      towelStack.position.set(towelX, 0.19, 0.04);
      for (let layer = 0; layer < 3; layer += 1) {
        const material = towelMaterials[(index * 2 + layer) % towelMaterials.length];
        const towel = new Mesh(new BoxGeometry(0.52, 0.08, 0.34), material);
        towel.position.set((layer % 2) * 0.025, layer * 0.085, 0);
        towel.rotation.y = (layer - 1) * 0.035;
        const fold = new Mesh(new BoxGeometry(0.045, 0.088, 0.36), material);
        fold.position.set(0.18 - layer * 0.012, layer * 0.085 + 0.004, 0);
        const seam = new Mesh(new BoxGeometry(0.5, 0.012, 0.018), material);
        seam.position.set(-0.015, layer * 0.085 + 0.044, 0.16);
        towelStack.add(towel, fold, seam);
      }
      return towelStack;
    });
    const duckBodyMaterial = new MeshStandardMaterial({
      color: 0xf5cf37,
      emissive: 0x2d2200,
      emissiveIntensity: 0.08,
      roughness: 0.5,
      metalness: 0.02,
    });
    const duckBeakMaterial = new MeshStandardMaterial({ color: 0xe77a28, roughness: 0.5, metalness: 0.02 });
    const duckBlushMaterial = new MeshStandardMaterial({ color: 0xf0a14e, roughness: 0.65, metalness: 0.01 });
    const duckBody = new Mesh(new SphereGeometry(0.22, 24, 14), duckBodyMaterial);
    duckBody.scale.set(1.35, 0.76, 0.88);
    duckBody.position.set(1.07, 0.31, 0.04);
    const duckChest = new Mesh(new SphereGeometry(0.16, 20, 12), duckBodyMaterial);
    duckChest.scale.set(1.05, 0.74, 0.84);
    duckChest.position.set(1.25, 0.34, 0.04);
    const duckHead = new Mesh(new SphereGeometry(0.135, 20, 12), duckBodyMaterial);
    duckHead.scale.set(1, 0.92, 0.96);
    duckHead.position.set(1.3, 0.49, 0.03);
    const upperBeak = new Mesh(new SphereGeometry(0.065, 16, 8), duckBeakMaterial);
    upperBeak.scale.set(1.5, 0.48, 0.68);
    upperBeak.position.set(1.42, 0.49, 0.03);
    const lowerBeak = upperBeak.clone();
    lowerBeak.scale.set(1.28, 0.34, 0.58);
    lowerBeak.position.set(1.405, 0.455, 0.03);
    const leftEye = new Mesh(new SphereGeometry(0.017, 10, 8), fridgeSealMaterial);
    leftEye.position.set(1.345, 0.525, 0.13);
    const rightEye = leftEye.clone();
    rightEye.position.z = -0.07;
    const leftCheek = new Mesh(new SphereGeometry(0.025, 10, 8), duckBlushMaterial);
    leftCheek.scale.set(1, 0.35, 0.9);
    leftCheek.position.set(1.355, 0.485, 0.125);
    const rightCheek = leftCheek.clone();
    rightCheek.position.z = -0.065;
    const leftWing = new Mesh(new SphereGeometry(0.1, 14, 8), duckBodyMaterial);
    leftWing.scale.set(1.25, 0.28, 0.64);
    leftWing.position.set(1.06, 0.33, 0.185);
    leftWing.rotation.z = -0.24;
    const rightWing = leftWing.clone();
    rightWing.position.z = -0.105;
    rightWing.rotation.z = 0.24;
    const tail = new Mesh(new ConeGeometry(0.055, 0.14, 12), duckBodyMaterial);
    tail.position.set(0.79, 0.38, 0.04);
    tail.rotation.z = Math.PI / 2.8;
    const underside = new Mesh(new SphereGeometry(0.15, 16, 8), duckBodyMaterial);
    underside.scale.set(1.4, 0.25, 0.82);
    underside.position.set(1.04, 0.22, 0.04);

    shelf.add(
      board,
      backLip,
      leftBracket,
      rightBracket,
      ...towels,
      duckBody,
      duckChest,
      duckHead,
      upperBeak,
      lowerBeak,
      leftEye,
      rightEye,
      leftCheek,
      rightCheek,
      leftWing,
      rightWing,
      tail,
      underside,
    );
    house.add(shelf);
  };

  const addToiletPaperHolder = (localX: number, localY: number, localZ: number, normalZ: 1 | -1): void => {
    const holder = new Group();
    holder.position.set(localX, localY, localZ + normalZ * 0.08);
    holder.rotation.y = normalZ > 0 ? 0 : Math.PI;

    const paperMaterial = new MeshStandardMaterial({
      color: 0xf7f5ed,
      emissive: 0x10100d,
      emissiveIntensity: 0.025,
      roughness: 0.92,
      metalness: 0.01,
    });
    const paperEdgeMaterial = new MeshStandardMaterial({
      color: 0xded9cb,
      roughness: 0.94,
      metalness: 0.01,
    });

    const wallPlate = new Mesh(new BoxGeometry(0.86, 0.42, 0.08), faucetMaterial);
    wallPlate.position.set(0, 0, 0);
    const leftArm = new Mesh(new BoxGeometry(0.08, 0.12, 0.34), faucetMaterial);
    leftArm.position.set(-0.38, -0.02, normalZ * 0.19);
    const rightArm = leftArm.clone();
    rightArm.position.x = 0.38;
    const spindle = new Mesh(new CylinderGeometry(0.035, 0.035, 0.82, 12), faucetMaterial);
    spindle.rotation.z = Math.PI / 2;
    spindle.position.set(0, -0.02, normalZ * 0.34);

    const roll = new Mesh(new CylinderGeometry(0.24, 0.24, 0.58, 28), paperMaterial);
    roll.rotation.z = Math.PI / 2;
    roll.position.set(0, -0.02, normalZ * 0.34);
    const innerTube = new Mesh(new CylinderGeometry(0.09, 0.09, 0.6, 20), paperEdgeMaterial);
    innerTube.rotation.z = Math.PI / 2;
    innerTube.position.copy(roll.position);

    const looseSheet = new Mesh(new BoxGeometry(0.42, 0.5, 0.025), paperMaterial);
    looseSheet.position.set(0.02, -0.34, normalZ * 0.39);
    const sheetEnd = new Mesh(new BoxGeometry(0.42, 0.035, 0.03), paperEdgeMaterial);
    sheetEnd.position.set(0.02, -0.61, normalZ * 0.4);

    holder.add(wallPlate, leftArm, rightArm, spindle, roll, innerTube, looseSheet, sheetEnd);
    house.add(holder);
  };

  const addCabinetCookies = (
    root: Group,
    localX: number,
    label: string,
    shelfYValues: [number, number],
    width: number,
    depth: number,
  ): void => {
    const cookieCount = label === 'Bathroom upper cupboard'
      ? Math.max(1, getCabinetCookieCount(localX, label))
      : getCabinetCookieCount(localX, label);
    for (let index = 0; index < cookieCount; index += 1) {
      const side = index === 0 ? -1 : 1;
      addCookie(
        root,
        side * Math.min(width * 0.22, 0.42),
        shelfYValues[index % shelfYValues.length] + COOKIE_SURFACE_OFFSET,
        depth * 0.08 + index * 0.08,
        0.92,
        `${label} cookie`,
      );
    }
  };

  const addCountertopCookie = (root: Group, width: number, topY: number): void => {
    addCookie(root, Math.min(width * 0.18, 0.32), topY + COOKIE_SURFACE_OFFSET, 0.22, 0.86);
  };

  const addFridge = (localX: number, localZ: number): ChapterSevenFridge => {
    const fridge = new Group();
    fridge.position.set(localX, 0, localZ);

    const width = 1.54;
    const height = 3.32;
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
        index === 2 ? 3.09 : 1.535,
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
    const fridgeCollider = addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, width + 0.18, depth + 0.18);
    counterSurfaces.push({
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: (width + 0.18) / 2,
      halfDepth: (depth + 0.18) / 2,
      floorY: height + 0.12,
      collider: fridgeCollider,
    });

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
    const baseHeight = KITCHEN_COUNTER_BASE_HEIGHT;
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
    lowerShelf.position.set(0, 0.4, -0.04);
    const upperShelf = lowerShelf.clone();
    upperShelf.position.y = 0.76;
    const toeKick = new Mesh(new BoxGeometry(width - 0.26, 0.18, 0.12), houseTrimMaterial);
    toeKick.position.set(0, 0.14, depth / 2 + 0.035);

    const leftDoorPivot = new Group();
    leftDoorPivot.position.set(-width / 2, 0, depth / 2 + 0.06);
    const leftDoor = new Mesh(new BoxGeometry(width / 2, 0.82, 0.07), furnitureWoodMaterial);
    leftDoor.position.set(width / 4, 0.56, 0);
    const leftHandle = new Mesh(new BoxGeometry(0.06, 0.32, 0.07), fridgeSealMaterial);
    leftHandle.position.set(width / 2 - 0.18, 0.56, 0.07);
    leftDoorPivot.add(leftDoor, leftHandle);

    const rightDoorPivot = new Group();
    rightDoorPivot.position.set(width / 2, 0, depth / 2 + 0.06);
    const rightDoor = new Mesh(new BoxGeometry(width / 2, 0.82, 0.07), furnitureWoodMaterial);
    rightDoor.position.set(-width / 4, 0.56, 0);
    const rightHandle = new Mesh(new BoxGeometry(0.06, 0.32, 0.07), fridgeSealMaterial);
    rightHandle.position.set(-(width / 2 - 0.18), 0.56, 0.07);
    rightDoorPivot.add(rightDoor, rightHandle);

    addCabinetCookies(counter, localX, label, [0.435, 0.795], width, depth);
    if (label === 'Counter base cabinet') {
      addCountertopCookie(counter, width, KITCHEN_COUNTER_SURFACE_Y);
    }
    counter.add(back, leftSide, rightSide, bottom, top, lowerShelf, upperShelf, leftDoorPivot, rightDoorPivot, toeKick);
    house.add(counter);
    const counterCollider = addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, width + 0.18, depth + 0.18);
    counterSurfaces.push({
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: (width + 0.18) / 2,
      halfDepth: (depth + 0.18) / 2,
      floorY: KITCHEN_COUNTER_SURFACE_Y,
      collider: counterCollider,
    });

    return {
      label,
      interactPosition: new Vector3(CENTER_X + localX, GAME_CONFIG.player.height, HOUSE_CENTER_Z + localZ + depth / 2 + 0.9),
      aimPosition: new Vector3(CENTER_X + localX, 0.68, HOUSE_CENTER_Z + localZ + depth / 2 + 0.08),
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
    const baseHeight = KITCHEN_COUNTER_BASE_HEIGHT;
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
    const frontPanelLeft = new Mesh(new BoxGeometry(width / 2 - 0.08, 0.84, 0.08), furnitureWoodMaterial);
    frontPanelLeft.position.set(-width / 4 - 0.025, 0.56, depth / 2 + 0.04);
    const frontPanelRight = frontPanelLeft.clone();
    frontPanelRight.position.x = width / 4 + 0.025;
    const centerSeam = new Mesh(new BoxGeometry(0.045, 0.84, 0.095), houseTrimMaterial);
    centerSeam.position.set(0, 0.56, depth / 2 + 0.065);
    const leftHandle = new Mesh(new BoxGeometry(0.06, 0.32, 0.07), fridgeSealMaterial);
    leftHandle.position.set(-0.18, 0.6, depth / 2 + 0.105);
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
      floorY: KITCHEN_COUNTER_SURFACE_Y,
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

  const addToilet = (localX: number, localZ: number, rotationY = 0): ChapterSevenRearFixture => {
    const toilet = new Group();
    toilet.position.set(localX, 0, localZ);
    toilet.rotation.y = rotationY;

    const tank = new Mesh(new BoxGeometry(1.42, 1.18, 0.44), porcelainMaterial);
    tank.position.set(0, 1.08, -0.54);
    const tankLid = new Mesh(new BoxGeometry(1.52, 0.12, 0.52), porcelainMaterial);
    tankLid.position.set(0, 1.72, -0.54);
    const base = new Mesh(new CylinderGeometry(0.44, 0.58, 0.5, 22), porcelainMaterial);
    base.position.set(0, 0.25, 0.18);
    base.scale.z = 0.72;
    const bowl = new Mesh(new CylinderGeometry(0.58, 0.5, 0.38, 28), porcelainMaterial);
    bowl.position.set(0, 0.72, 0.18);
    bowl.scale.z = 0.78;
    const water = new Mesh(new CylinderGeometry(0.38, 0.34, 0.035, 24), faucetWaterMaterial);
    water.position.set(0, 0.94, 0.18);
    water.scale.z = 0.7;
    const lidPivot = new Group();
    lidPivot.position.set(0, 1.02, -0.24);
    const lid = new Mesh(new CylinderGeometry(0.5, 0.42, 0.075, 32), porcelainMaterial);
    lid.position.set(0, 0.035, 0.48);
    lid.scale.set(1.08, 1, 1.34);
    const seat = new Mesh(new CylinderGeometry(0.56, 0.56, 0.055, 28), porcelainMaterial);
    seat.scale.z = 0.72;
    seat.position.set(0, 0.0, 0.48);
    lidPivot.add(lid, seat);
    toilet.add(tank, tankLid, base, bowl, water, lidPivot);
    house.add(toilet);

    const collider = addRotatedCollider(colliders, localX, localZ, rotationY, 0, 0, 1.55, 1.72);
    const toiletBounds = getRotatedBounds(1.55, 1.72, rotationY);
    counterSurfaces.push({
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: toiletBounds.width / 2,
      halfDepth: toiletBounds.depth / 2,
      floorY: 1.02,
      collider,
    });
    const interactPoint = getRotatedLocalPoint(localX, localZ, rotationY, 0, 1.22);
    const aimPoint = getRotatedLocalPoint(localX, localZ, rotationY, 0, 0.16);
    return {
      label: 'Toilet lid',
      kind: 'toilet',
      interactPosition: new Vector3(CENTER_X + interactPoint.x, GAME_CONFIG.player.height, HOUSE_CENTER_Z + interactPoint.z),
      aimPosition: new Vector3(CENTER_X + aimPoint.x, 1.05, HOUSE_CENTER_Z + aimPoint.z),
      doorPivots: [lidPivot],
      collider,
      animation: 'toilet-lid',
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
    };
  };

  const addBathroomSinkFixture = (localX: number, localZ: number, rotationY = 0): ChapterSevenRearFixture => {
    const sink = new Group();
    sink.position.set(localX, 0, localZ);
    sink.rotation.y = rotationY;

    const width = 2.16;
    const depth = 1.18;
    const baseHeight = 1.18;
    const cabinetBack = new Mesh(new BoxGeometry(width, baseHeight, 0.12), porcelainMaterial);
    cabinetBack.position.set(0, baseHeight / 2, -depth / 2 + 0.06);
    const cabinetLeft = new Mesh(new BoxGeometry(0.12, baseHeight, depth), porcelainMaterial);
    cabinetLeft.position.set(-width / 2 + 0.06, baseHeight / 2, 0);
    const cabinetRight = cabinetLeft.clone();
    cabinetRight.position.x = width / 2 - 0.06;
    const cabinetBottom = new Mesh(new BoxGeometry(width, 0.12, depth), porcelainMaterial);
    cabinetBottom.position.set(0, 0.06, 0);
    const counter = new Mesh(new BoxGeometry(width + 0.18, 0.16, depth + 0.18), counterTopMaterial);
    counter.position.y = baseHeight + 0.1;
    const basin = new Mesh(new CylinderGeometry(0.45, 0.52, 0.18, 28), sinkBasinMaterial);
    basin.scale.z = 0.66;
    basin.position.set(0, baseHeight + 0.24, 0.08);
    const drain = new Mesh(new CylinderGeometry(0.07, 0.07, 0.02, 14), fridgeSealMaterial);
    drain.position.set(0, baseHeight + 0.34, 0.08);
    const faucetBase = new Mesh(new CylinderGeometry(0.09, 0.09, 0.12, 14), faucetMaterial);
    faucetBase.position.set(0, baseHeight + 0.29, -0.28);
    const faucetNeck = new Mesh(new CylinderGeometry(0.055, 0.055, 0.44, 12), faucetMaterial);
    faucetNeck.position.set(0, baseHeight + 0.52, -0.24);
    const faucetSpout = new Mesh(new CylinderGeometry(0.045, 0.045, 0.38, 12), faucetMaterial);
    faucetSpout.rotation.x = Math.PI / 2;
    faucetSpout.position.set(0, baseHeight + 0.72, -0.04);

    const leftDoor = new Mesh(new BoxGeometry(width / 2 - 0.04, 0.96, 0.07), porcelainMaterial);
    leftDoor.position.set(-width / 4 - 0.02, 0.62, depth / 2 + 0.055);
    const rightDoor = leftDoor.clone();
    rightDoor.position.x = width / 4 + 0.02;
    const leftHandle = new Mesh(new BoxGeometry(0.055, 0.28, 0.065), faucetMaterial);
    leftHandle.position.set(-0.18, 0.64, depth / 2 + 0.105);
    const rightHandle = leftHandle.clone();
    rightHandle.position.x = 0.18;
    const handlePivot = new Group();
    handlePivot.position.set(0.3, baseHeight + 0.46, -0.24);
    const handleStem = new Mesh(new CylinderGeometry(0.035, 0.035, 0.13, 10), faucetMaterial);
    handleStem.position.y = 0.06;
    const handleBar = new Mesh(new BoxGeometry(0.26, 0.045, 0.075), faucetMaterial);
    handleBar.position.y = 0.14;
    handlePivot.add(handleStem, handleBar);
    const waterStream = new Mesh(new CylinderGeometry(0.028, 0.036, 0.52, 10), faucetWaterMaterial);
    waterStream.position.set(0, baseHeight + 0.5, 0.08);
    waterStream.visible = false;
    waterStream.scale.y = 0.01;

    sink.add(
      cabinetBack,
      cabinetLeft,
      cabinetRight,
      cabinetBottom,
      counter,
      basin,
      drain,
      faucetBase,
      faucetNeck,
      faucetSpout,
      leftDoor,
      rightDoor,
      leftHandle,
      rightHandle,
      handlePivot,
      waterStream,
    );
    house.add(sink);

    const collider = addRotatedCollider(colliders, localX, localZ, rotationY, 0, 0, width + 0.18, depth + 0.18);
    counterSurfaces.push({
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: (width + 0.18) / 2,
      halfDepth: (depth + 0.18) / 2,
      floorY: baseHeight + 0.23,
      collider,
    });
    const interactPoint = getRotatedLocalPoint(localX, localZ, rotationY, 0, depth / 2 + 0.85);
    const aimPoint = getRotatedLocalPoint(localX, localZ, rotationY, 0, -0.04);
    return {
      label: 'Bathroom sink faucet',
      kind: 'bathroom-sink',
      interactPosition: new Vector3(CENTER_X + interactPoint.x, GAME_CONFIG.player.height, HOUSE_CENTER_Z + interactPoint.z),
      aimPosition: new Vector3(CENTER_X + aimPoint.x, baseHeight + 0.66, HOUSE_CENTER_Z + aimPoint.z),
      doorPivots: [handlePivot],
      collider,
      animation: 'faucet',
      waterStream,
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
    };
  };

  const addBathtubFixture = (localX: number, localZ: number, rotationY = 0): ChapterSevenRearFixture => {
    const bathtub = new Group();
    bathtub.position.set(localX, 0, localZ);
    bathtub.rotation.y = rotationY;

    const width = 2.35;
    const depth = 4.35;
    const height = 0.92;
    const wallThickness = 0.16;
    const bottom = new Mesh(new BoxGeometry(width, 0.16, depth), porcelainMaterial);
    bottom.position.y = 0.08;
    const leftWall = new Mesh(new BoxGeometry(wallThickness, height, depth), porcelainMaterial);
    leftWall.position.set(-width / 2 + wallThickness / 2, height / 2, 0);
    const rightWall = leftWall.clone();
    rightWall.position.x = width / 2 - wallThickness / 2;
    const backWall = new Mesh(new BoxGeometry(width, height, wallThickness), porcelainMaterial);
    backWall.position.set(0, height / 2, -depth / 2 + wallThickness / 2);
    const frontWall = backWall.clone();
    frontWall.position.z = depth / 2 - wallThickness / 2;

    const innerBasin = new Mesh(new BoxGeometry(width - 0.42, 0.12, depth - 0.54), sinkBasinMaterial);
    innerBasin.position.y = 0.28;
    const waterSurface = new Mesh(new BoxGeometry(width - 0.46, 0.035, depth - 0.62), bathtubWaterMaterial);
    waterSurface.position.y = 0.25;
    waterSurface.visible = false;
    const drain = new Mesh(new CylinderGeometry(0.12, 0.12, 0.025, 18), fridgeSealMaterial);
    drain.position.set(0, 0.34, depth / 2 - 0.72);

    const faucetBase = new Mesh(new CylinderGeometry(0.12, 0.12, 0.16, 16), faucetMaterial);
    faucetBase.position.set(0, height + 0.05, -depth / 2 + 0.22);
    const faucetNeck = new Mesh(new CylinderGeometry(0.055, 0.055, 0.52, 12), faucetMaterial);
    faucetNeck.position.set(0, height + 0.28, -depth / 2 + 0.22);
    const faucetSpout = new Mesh(new CylinderGeometry(0.045, 0.045, 0.64, 12), faucetMaterial);
    faucetSpout.rotation.x = Math.PI / 2;
    faucetSpout.position.set(0, height + 0.52, -depth / 2 + 0.52);
    const spoutTip = new Mesh(new CylinderGeometry(0.055, 0.055, 0.1, 12), faucetMaterial);
    spoutTip.position.set(0, height + 0.4, -depth / 2 + 0.83);

    const handlePivot = new Group();
    handlePivot.position.set(0.32, height + 0.18, -depth / 2 + 0.24);
    const handleStem = new Mesh(new CylinderGeometry(0.035, 0.035, 0.12, 10), faucetMaterial);
    handleStem.position.y = 0.06;
    const handleBar = new Mesh(new BoxGeometry(0.28, 0.045, 0.075), faucetMaterial);
    handleBar.position.y = 0.14;
    handlePivot.add(handleStem, handleBar);

    const waterStream = new Mesh(new CylinderGeometry(0.032, 0.04, 0.62, 10), faucetWaterMaterial);
    waterStream.position.set(0, height + 0.1, -depth / 2 + 0.83);
    waterStream.visible = false;
    waterStream.scale.y = 0.01;
    const waterSplash = [
      [-0.12, height + 0.18, -depth / 2 + 1.04],
      [0.1, height + 0.08, -depth / 2 + 1.08],
      [-0.04, height - 0.02, -depth / 2 + 1.18],
      [0.16, height + 0.23, -depth / 2 + 0.98],
      [-0.18, height + 0.04, -depth / 2 + 1.2],
    ].map(([dropX, dropY, dropZ], index) => {
      const drop = new Mesh(new SphereGeometry(index === 3 ? 0.045 : 0.035, 8, 6), bathtubWaterMaterial);
      drop.position.set(dropX, dropY, dropZ);
      drop.visible = false;
      drop.userData.baseX = dropX;
      drop.userData.baseY = dropY;
      drop.userData.baseZ = dropZ;
      drop.userData.phase = index * 1.17;
      return drop;
    });

    bathtub.add(
      bottom,
      leftWall,
      rightWall,
      backWall,
      frontWall,
      innerBasin,
      waterSurface,
      drain,
      faucetBase,
      faucetNeck,
      faucetSpout,
      spoutTip,
      handlePivot,
      waterStream,
      ...waterSplash,
    );
    house.add(bathtub);

    const wallColliders = [
      addRotatedCollider(colliders, localX, localZ, rotationY, -width / 2 + wallThickness / 2, 0, wallThickness, depth),
      addRotatedCollider(colliders, localX, localZ, rotationY, width / 2 - wallThickness / 2, 0, wallThickness, depth),
      addRotatedCollider(colliders, localX, localZ, rotationY, 0, -depth / 2 + wallThickness / 2, width, wallThickness),
      addRotatedCollider(colliders, localX, localZ, rotationY, 0, depth / 2 - wallThickness / 2, width, wallThickness),
    ];
    const interactPoint = getRotatedLocalPoint(localX, localZ, rotationY, 0, depth / 2 + 0.78);
    const aimPoint = getRotatedLocalPoint(localX, localZ, rotationY, 0, -depth / 2 + 0.74);
    return {
      label: 'Bathtub faucet',
      kind: 'bathtub',
      interactPosition: new Vector3(CENTER_X + interactPoint.x, GAME_CONFIG.player.height, HOUSE_CENTER_Z + interactPoint.z),
      aimPosition: new Vector3(CENTER_X + aimPoint.x, 0.95, HOUSE_CENTER_Z + aimPoint.z),
      doorPivots: [handlePivot],
      collider: wallColliders[0],
      animation: 'bathtub-faucet',
      waterStream,
      waterSurface,
      waterSplash,
      waterFillAmount: 0,
      wallColliders,
      tubBounds: {
        centerX: CENTER_X + localX,
        centerZ: HOUSE_CENTER_Z + localZ,
        halfWidth: width / 2,
        halfDepth: depth / 2,
      },
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
    };
  };

  const addHoseFaucetFixture = (localX: number, localY: number, localZ: number): ChapterSevenRearFixture => {
    const hose = new Group();
    hose.position.set(localX, localY, localZ);

    const hoseMaterial = new MeshStandardMaterial({
      color: 0x2d6f3a,
      emissive: 0x061609,
      emissiveIntensity: 0.05,
      roughness: 0.62,
      metalness: 0.03,
    });
    const wallPlate = new Mesh(new BoxGeometry(0.12, 1.05, 1.38), faucetMaterial);
    wallPlate.position.set(0.03, 0, 0);
    const holderBack = new Mesh(new BoxGeometry(0.14, 0.64, 1.12), counterTopMaterial);
    holderBack.position.set(0.13, -0.02, 0);
    const topPeg = new Mesh(new CylinderGeometry(0.055, 0.055, 0.96, 14), faucetMaterial);
    topPeg.rotation.x = Math.PI / 2;
    topPeg.position.set(0.28, 0.24, 0);
    const bottomPeg = topPeg.clone();
    bottomPeg.position.y = -0.26;
    const centerHub = new Mesh(new CylinderGeometry(0.22, 0.22, 0.12, 24), faucetMaterial);
    centerHub.rotation.z = Math.PI / 2;
    centerHub.position.set(0.3, -0.02, 0);

    const coilPieces: Mesh[] = [];
    [0.48, 0.62, 0.76].forEach((radius, index) => {
      const coil = new Mesh(new TorusGeometry(radius, 0.035, 10, 44), hoseMaterial);
      coil.position.set(0.32 + index * 0.012, -0.02, 0);
      coil.rotation.y = Math.PI / 2;
      coil.scale.z = 0.78;
      coilPieces.push(coil);
    });

    const makeHoseTube = (points: Vector3[], radius = 0.042): Mesh => {
      const curve = new CatmullRomCurve3(points);
      return new Mesh(new TubeGeometry(curve, 54, radius, 12, false), hoseMaterial);
    };
    const wallFeedHose = makeHoseTube([
      new Vector3(0.28, -0.16, -0.54),
      new Vector3(0.24, -0.2, -0.86),
      new Vector3(0.26, -0.18, -1.18),
      new Vector3(0.35, -0.16, -1.42),
    ], 0.038);
    const floorHose = makeHoseTube([
      new Vector3(0.28, -0.26, 0.62),
      new Vector3(0.26, -0.52, 0.82),
      new Vector3(0.32, -0.88, 0.74),
      new Vector3(0.68, -1.08, 0.52),
      new Vector3(1.28, -1.1, 0.24),
      new Vector3(2.04, -1.1, 0.06),
      new Vector3(2.74, -1.08, 0),
    ], 0.046);
    const faucetPipe = new Mesh(new CylinderGeometry(0.05, 0.05, 0.5, 14), faucetMaterial);
    faucetPipe.rotation.z = Math.PI / 2;
    faucetPipe.position.set(0.31, -0.16, -1.42);
    const faucetNub = new Mesh(new CylinderGeometry(0.095, 0.095, 0.1, 18), faucetMaterial);
    faucetNub.rotation.z = Math.PI / 2;
    faucetNub.position.set(0.58, -0.16, -1.42);
    const handlePivot = new Group();
    handlePivot.position.set(0.66, -0.16, -1.42);
    const handleWheel = new Mesh(new TorusGeometry(0.18, 0.025, 8, 28), faucetMaterial);
    handleWheel.rotation.y = Math.PI / 2;
    const handleCrossA = new Mesh(new BoxGeometry(0.055, 0.36, 0.055), faucetMaterial);
    const handleCrossB = new Mesh(new BoxGeometry(0.055, 0.055, 0.36), faucetMaterial);
    const handleCap = new Mesh(new CylinderGeometry(0.055, 0.055, 0.05, 14), faucetMaterial);
    handleCap.rotation.z = Math.PI / 2;
    handlePivot.add(handleWheel, handleCrossA, handleCrossB, handleCap);

    const nozzle = new Mesh(new CylinderGeometry(0.055, 0.04, 0.32, 12), faucetMaterial);
    nozzle.rotation.z = Math.PI / 2;
    nozzle.position.set(2.92, -1.08, 0);

    const waterStream = new Mesh(new CylinderGeometry(0.018, 0.028, 0.5, 10), faucetWaterMaterial);
    waterStream.rotation.z = Math.PI / 2;
    waterStream.position.set(3.32, -1.08, 0);
    waterStream.visible = false;
    waterStream.scale.y = 0.01;
    const waterSplash = [
      [3.58, -1.03, -0.12],
      [3.72, -1.05, 0.06],
      [3.5, -1.04, 0.15],
      [3.82, -1.03, -0.06],
    ].map(([dropX, dropY, dropZ], index) => {
      const drop = new Mesh(new SphereGeometry(0.026, 8, 6), faucetWaterMaterial);
      drop.position.set(dropX, dropY, dropZ);
      drop.visible = false;
      drop.userData.baseX = dropX;
      drop.userData.baseY = dropY;
      drop.userData.baseZ = dropZ;
      drop.userData.phase = index * 0.91;
      return drop;
    });
    const waterSurface = new Mesh(new CylinderGeometry(0.34, 0.48, 0.025, 32), bathtubWaterMaterial);
    waterSurface.position.set(3.78, -1.135, 0.02);
    waterSurface.rotation.y = 0.28;
    waterSurface.scale.set(0.18, 1, 0.12);
    waterSurface.visible = false;
    waterSurface.userData.baseY = waterSurface.position.y;
    waterSurface.userData.baseScaleX = waterSurface.scale.x;
    waterSurface.userData.baseScaleZ = waterSurface.scale.z;

    hose.add(
      wallPlate,
      holderBack,
      topPeg,
      bottomPeg,
      centerHub,
      ...coilPieces,
      wallFeedHose,
      floorHose,
      faucetPipe,
      faucetNub,
      handlePivot,
      nozzle,
      waterStream,
      waterSurface,
      ...waterSplash,
    );
    house.add(hose);

    const collider = addRotatedCollider(colliders, localX, localZ, 0, 0.22, 0, 0.58, 1.52);
    return {
      label: 'Outdoor hose faucet',
      kind: 'hose-faucet',
      interactPosition: new Vector3(CENTER_X + localX + 1.05, GAME_CONFIG.player.height, HOUSE_CENTER_Z + localZ - 1.42),
      aimPosition: new Vector3(CENTER_X + localX + 0.66, localY - 0.16, HOUSE_CENTER_Z + localZ - 1.42),
      doorPivots: [handlePivot],
      collider,
      animation: 'hose-faucet',
      waterStream,
      waterSurface,
      waterSplash,
      waterFillAmount: 0,
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
    };
  };

  const addWallLamp = (localX: number, localY: number, localZ: number): void => {
    const lamp = new Group();
    lamp.position.set(localX, localY, localZ);

    const blackMetalMaterial = new MeshStandardMaterial({
      color: 0x050506,
      emissive: 0x010101,
      emissiveIntensity: 0.08,
      roughness: 0.34,
      metalness: 0.58,
      side: DoubleSide,
    });
    const bulbMaterial = new MeshStandardMaterial({
      color: 0xfff2c0,
      emissive: 0xffcf65,
      emissiveIntensity: 1.15,
      roughness: 0.18,
      metalness: 0.02,
    });
    const backPlate = new Mesh(new BoxGeometry(0.12, 0.72, 0.5), blackMetalMaterial);
    backPlate.position.set(0.02, 0, 0);
    const arm = new Mesh(new CylinderGeometry(0.045, 0.045, 0.72, 12), blackMetalMaterial);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(0.36, 0.05, 0);
    const elbow = new Mesh(new SphereGeometry(0.075, 12, 8), blackMetalMaterial);
    elbow.position.set(0.7, 0.01, 0);
    const neck = new Mesh(new CylinderGeometry(0.045, 0.055, 0.34, 12), blackMetalMaterial);
    neck.position.set(0.76, -0.18, 0);
    const shade = new Mesh(new ConeGeometry(0.34, 0.48, 28, 1, true), blackMetalMaterial);
    shade.position.set(0.76, -0.48, 0);
    const shadeRim = new Mesh(new TorusGeometry(0.34, 0.018, 8, 32), blackMetalMaterial);
    shadeRim.position.set(0.76, -0.72, 0);
    shadeRim.rotation.x = Math.PI / 2;
    const bulb = new Mesh(new SphereGeometry(0.105, 16, 10), bulbMaterial);
    bulb.position.set(0.76, -0.62, 0);

    lamp.add(backPlate, arm, elbow, neck, shade, shadeRim, bulb);
    house.add(lamp);

    const lampLight = new SpotLight(0xffe3a5, 12.5, 18, Math.PI / 3.8, 0.68, 1.25);
    lampLight.position.set(localX + 0.76, localY - 0.62, localZ);
    lampLight.target.position.set(localX + 2.25, 0.05, localZ);
    house.add(lampLight, lampLight.target);
  };

  const addMiniLampTableFixture = (localX: number, localZ: number): ChapterSevenRearFixture => {
    const table = new Group();
    table.position.set(localX, 0, localZ);

    const top = new Mesh(new CylinderGeometry(0.78, 0.78, 0.14, 32), furnitureWoodMaterial);
    top.position.y = 0.72;
    const topLip = new Mesh(new TorusGeometry(0.79, 0.035, 8, 36), houseTrimMaterial);
    topLip.position.y = 0.8;
    topLip.rotation.x = Math.PI / 2;
    const pedestal = new Mesh(new CylinderGeometry(0.16, 0.22, 0.66, 16), furnitureWoodMaterial);
    pedestal.position.y = 0.38;
    const foot = new Mesh(new CylinderGeometry(0.48, 0.54, 0.08, 24), houseTrimMaterial);
    foot.position.y = 0.08;

    const lampBaseMaterial = new MeshStandardMaterial({
      color: 0x5c3f2a,
      emissive: 0x0e0704,
      emissiveIntensity: 0.05,
      roughness: 0.64,
      metalness: 0.08,
    });
    const lampShadeMaterial = new MeshStandardMaterial({
      color: 0xe2c58d,
      emissive: 0x2d1c08,
      emissiveIntensity: 0.12,
      roughness: 0.76,
      metalness: 0.01,
      transparent: true,
      opacity: 0.88,
      side: DoubleSide,
    });
    const bulbMaterial = new MeshStandardMaterial({
      color: 0xfff2c5,
      emissive: 0xffcc67,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.02,
    });
    const glowMaterial = new MeshBasicMaterial({
      color: 0xffdc8f,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });

    const lampBase = new Mesh(new CylinderGeometry(0.24, 0.3, 0.38, 22), lampBaseMaterial);
    lampBase.position.y = 1.02;
    const baseTopRing = new Mesh(new TorusGeometry(0.24, 0.025, 8, 28), closetHandleMaterial);
    baseTopRing.position.y = 1.23;
    baseTopRing.rotation.x = Math.PI / 2;
    const baseBottomRing = baseTopRing.clone();
    baseBottomRing.position.y = 0.82;
    const decorativeBands = [-0.08, 0.08].map((xOffset) => {
      const band = new Mesh(new BoxGeometry(0.035, 0.34, 0.035), closetHandleMaterial);
      band.position.set(xOffset, 1.02, 0.27);
      return band;
    });
    const stem = new Mesh(new CylinderGeometry(0.045, 0.055, 0.48, 14), closetHandleMaterial);
    stem.position.y = 1.42;
    const bulb = new Mesh(new SphereGeometry(0.14, 18, 12), bulbMaterial);
    bulb.position.y = 1.44;
    const shade = new Mesh(new CylinderGeometry(0.24, 0.52, 0.5, 32, 1, true), lampShadeMaterial);
    shade.position.y = 1.62;
    const shadeTop = new Mesh(new TorusGeometry(0.24, 0.018, 8, 32), closetHandleMaterial);
    shadeTop.position.y = 1.87;
    shadeTop.rotation.x = Math.PI / 2;
    const shadeBottom = new Mesh(new TorusGeometry(0.52, 0.022, 8, 36), closetHandleMaterial);
    shadeBottom.position.y = 1.37;
    shadeBottom.rotation.x = Math.PI / 2;
    const glow = new Mesh(new SphereGeometry(0.44, 18, 12), glowMaterial);
    glow.position.y = 1.48;
    glow.scale.set(1, 0.72, 1);

    const switchPivot = new Group();
    switchPivot.position.set(0.48, 0.84, 0.15);

    const lampLight = new PointLight(0xffd996, 0, 3.2, 1.65);
    lampLight.position.set(0, 1.45, 0);
    glow.visible = false;
    glow.scale.setScalar(0.72);

    table.add(
      top,
      topLip,
      pedestal,
      foot,
      lampBase,
      baseTopRing,
      baseBottomRing,
      ...decorativeBands,
      stem,
      bulb,
      shade,
      shadeTop,
      shadeBottom,
      glow,
      lampLight,
    );
    house.add(table);

    const collider = addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, 1.72, 1.72);
    addCrawlUnderCollider(collider, CENTER_X + localX, HOUSE_CENTER_Z + localZ, 1.72, 1.72, 0.16);
    counterSurfaces.push({
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: 0.86,
      halfDepth: 0.86,
      floorY: 0.82,
      collider,
    });

    return {
      label: 'Mini table lamp',
      kind: 'table-lamp',
      interactPosition: new Vector3(CENTER_X + localX, GAME_CONFIG.player.height, HOUSE_CENTER_Z + localZ),
      aimPosition: new Vector3(CENTER_X + localX, 1.36, HOUSE_CENTER_Z + localZ),
      doorPivots: [switchPivot],
      collider,
      animation: 'table-lamp',
      lampLight,
      lampGlow: glow,
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
    };
  };

  const addLaundryAppliance = (
    localX: number,
    localZ: number,
    kind: 'washing-machine' | 'dryer',
    rotationY = 0,
  ): ChapterSevenRearFixture => {
    const appliance = new Group();
    appliance.position.set(localX, 0, localZ);
    appliance.rotation.y = rotationY;

    const width = 1.98;
    const depth = 1.44;
    const height = KITCHEN_COUNTER_SURFACE_Y + 0.28;
    const tubCenterY = height * 0.48;
    const doorRadius = 0.43;
    const doorWindowRadius = 0.28;
    const body = new Mesh(new BoxGeometry(width, height, depth), applianceWhiteMaterial);
    body.position.y = height / 2;
    const top = new Mesh(new BoxGeometry(width + 0.08, 0.1, depth + 0.08), porcelainMaterial);
    top.position.y = height + 0.05;
    const controlPanel = new Mesh(new BoxGeometry(width - 0.16, 0.24, 0.08), fridgeSealMaterial);
    controlPanel.position.set(0, height - 0.18, depth / 2 + 0.045);
    const knob = new Mesh(new CylinderGeometry(0.12, 0.12, 0.045, 16), faucetMaterial);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(0.52, height - 0.18, depth / 2 + 0.1);
    const display = new Mesh(new BoxGeometry(0.48, 0.11, 0.045), kind === 'dryer' ? applianceGlassMaterial : faucetWaterMaterial);
    display.position.set(-0.38, height - 0.18, depth / 2 + 0.1);
    const tub = new Mesh(new CylinderGeometry(doorRadius, doorRadius, 0.08, 28), fridgeSealMaterial);
    tub.rotation.x = Math.PI / 2;
    tub.position.set(0, tubCenterY, depth / 2 + 0.02);
    const tubShadow = new Mesh(new CylinderGeometry(doorWindowRadius, doorWindowRadius, 0.09, 24), stoveGlassMaterial);
    tubShadow.rotation.x = Math.PI / 2;
    tubShadow.position.set(0, tubCenterY, depth / 2 + 0.035);
    const washWater = new Mesh(new BoxGeometry(0.5, 0.12, 0.08), faucetWaterMaterial);
    washWater.position.set(0, tubCenterY - 0.15, depth / 2 + 0.09);
    washWater.rotation.z = -0.07;
    washWater.visible = kind === 'washing-machine';
    const clothMaterials = [
      new MeshStandardMaterial({ color: 0xc43a3a, roughness: 0.84 }),
      new MeshStandardMaterial({ color: 0x315dbb, roughness: 0.84 }),
      new MeshStandardMaterial({ color: 0xf0d35b, roughness: 0.84 }),
      new MeshStandardMaterial({ color: 0xf2f1e7, roughness: 0.84 }),
    ];
    const clothes = clothMaterials.map((material, index) => {
      const dryerPilePositions: Array<[number, number, number]> = [
        [-0.16, tubCenterY - 0.1, -0.16],
        [0.03, tubCenterY - 0.14, 0.02],
        [0.17, tubCenterY - 0.06, -0.08],
        [-0.02, tubCenterY + 0.03, 0.14],
      ];
      const washerPilePositions: Array<[number, number, number]> = [
        [-0.14, tubCenterY - 0.08, -0.06],
        [0.09, tubCenterY - 0.11, 0.08],
        [0.17, tubCenterY + 0.02, -0.08],
        [-0.03, tubCenterY + 0.05, 0.11],
      ];
      const [clothX, clothY, clothZ] = kind === 'dryer'
        ? dryerPilePositions[index]
        : washerPilePositions[index];
      const cloth = new Mesh(new BoxGeometry(
        kind === 'dryer' ? 0.26 : 0.2,
        kind === 'dryer' ? 0.12 : 0.1,
        0.06,
      ), material);
      cloth.position.set(clothX, clothY, depth / 2 + 0.1 + clothZ * 0.18);
      cloth.rotation.set(0.18 + index * 0.08, 0, (index - 1.5) * (kind === 'dryer' ? 0.42 : 0.24));
      return cloth;
    });

    const doorPivot = new Group();
    doorPivot.position.set(-doorRadius, tubCenterY, depth / 2 + 0.07);
    const doorPanel = new Mesh(new CylinderGeometry(doorRadius + 0.05, doorRadius + 0.05, 0.1, 28), applianceWhiteMaterial);
    doorPanel.rotation.x = Math.PI / 2;
    doorPanel.position.x = doorRadius;
    const doorWindow = new Mesh(new CylinderGeometry(doorWindowRadius, doorWindowRadius, 0.11, 24), applianceGlassMaterial);
    doorWindow.rotation.x = Math.PI / 2;
    doorWindow.position.set(doorRadius, 0, 0.012);
    const handle = new Mesh(new BoxGeometry(0.07, 0.26, 0.07), fridgeSealMaterial);
    handle.position.set(doorRadius * 1.76, 0, 0.08);
    doorPivot.add(doorPanel, doorWindow, handle);

    const lowerPanel = new Mesh(new BoxGeometry(width - 0.18, 0.18, 0.05), fridgeSealMaterial);
    lowerPanel.position.set(0, 0.15, depth / 2 + 0.045);
    if (kind === 'dryer') {
      const ventRows = [-0.12, 0, 0.12].map((rowY) => {
        const vent = new Mesh(new BoxGeometry(0.62, 0.03, 0.05), fridgeSealMaterial);
        vent.position.set(0, 0.32 + rowY, depth / 2 + 0.08);
        return vent;
      });
      appliance.add(...ventRows);
    }

    appliance.add(body, top, controlPanel, knob, display, tub, tubShadow, washWater, ...clothes, doorPivot, lowerPanel);
    house.add(appliance);

    const collider = addRotatedCollider(colliders, localX, localZ, rotationY, 0, 0, width + 0.12, depth + 0.12);
    const applianceBounds = getRotatedBounds(width + 0.12, depth + 0.12, rotationY);
    counterSurfaces.push({
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: applianceBounds.width / 2,
      halfDepth: applianceBounds.depth / 2,
      floorY: height + 0.1,
      collider,
    });
    const interactPoint = getRotatedLocalPoint(localX, localZ, rotationY, 0, depth / 2 + 0.82);
    const aimPoint = getRotatedLocalPoint(localX, localZ, rotationY, 0, depth / 2 + 0.08);
    return {
      label: kind === 'washing-machine' ? 'Washing machine' : 'Dryer',
      kind,
      interactPosition: new Vector3(CENTER_X + interactPoint.x, GAME_CONFIG.player.height, HOUSE_CENTER_Z + interactPoint.z),
      aimPosition: new Vector3(CENTER_X + aimPoint.x, tubCenterY + 0.08, HOUSE_CENTER_Z + aimPoint.z),
      doorPivots: [doorPivot],
      collider,
      animation: 'front-door',
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
    const height = KITCHEN_COUNTER_BASE_HEIGHT + 0.09;
    const body = new Mesh(new BoxGeometry(width, height, depth), stoveMaterial);
    body.position.y = height / 2;
    const cooktop = new Mesh(new BoxGeometry(width + 0.08, 0.12, depth + 0.08), stoveGlassMaterial);
    cooktop.position.y = height + 0.08;
    const cavityWidth = width - 0.28;
    const cavityHeight = 0.62;
    const cavityDepth = depth - 0.18;
    const cavityCenterY = 0.62;
    const cavityCenterZ = 0.08;
    const ovenBackWall = new Mesh(new BoxGeometry(cavityWidth, cavityHeight, 0.08), ovenInteriorMaterial);
    ovenBackWall.position.set(0, cavityCenterY, cavityCenterZ - cavityDepth / 2 + 0.04);
    const ovenLeftWall = new Mesh(new BoxGeometry(0.08, cavityHeight, cavityDepth), ovenInteriorMaterial);
    ovenLeftWall.position.set(-cavityWidth / 2 + 0.04, cavityCenterY, cavityCenterZ);
    const ovenRightWall = ovenLeftWall.clone();
    ovenRightWall.position.x = cavityWidth / 2 - 0.04;
    const ovenCeiling = new Mesh(new BoxGeometry(cavityWidth, 0.08, cavityDepth), ovenInteriorMaterial);
    ovenCeiling.position.set(0, cavityCenterY + cavityHeight / 2 - 0.04, cavityCenterZ);
    const ovenFloor = ovenCeiling.clone();
    ovenFloor.position.y = cavityCenterY - cavityHeight / 2 + 0.04;
    const ovenDoorPivot = new Group();
    ovenDoorPivot.position.set(0, 0.3, depth / 2 + 0.055);
    const doorWidth = width - 0.2;
    const doorHeight = 0.62;
    const doorThickness = 0.08;
    const windowWidth = width - 0.52;
    const windowHeight = 0.34;
    const sidePanelWidth = (doorWidth - windowWidth) / 2;
    const topPanelHeight = (doorHeight - windowHeight) / 2;
    const ovenDoorTop = new Mesh(new BoxGeometry(doorWidth, topPanelHeight, doorThickness), stoveMaterial);
    ovenDoorTop.position.set(0, 0.32 + windowHeight / 2 + topPanelHeight / 2, 0);
    const ovenDoorBottom = ovenDoorTop.clone();
    ovenDoorBottom.position.y = 0.32 - windowHeight / 2 - topPanelHeight / 2;
    const ovenDoorLeft = new Mesh(new BoxGeometry(sidePanelWidth, windowHeight, doorThickness), stoveMaterial);
    ovenDoorLeft.position.set(-windowWidth / 2 - sidePanelWidth / 2, 0.32, 0);
    const ovenDoorRight = ovenDoorLeft.clone();
    ovenDoorRight.position.x = windowWidth / 2 + sidePanelWidth / 2;
    const ovenWindow = new Mesh(new BoxGeometry(windowWidth, windowHeight, 0.035), ovenDoorGlassMaterial);
    ovenWindow.position.set(0, 0.32, 0.05);
    const ovenHandle = new Mesh(new BoxGeometry(width - 0.36, 0.06, 0.07), fridgeSealMaterial);
    ovenHandle.position.set(0, 0.58, 0.09);
    const knobRow = new Mesh(new BoxGeometry(width - 0.26, 0.14, 0.07), fridgeSealMaterial);
    knobRow.position.set(0, KITCHEN_COUNTER_BASE_HEIGHT - 0.08, depth / 2 + 0.085);
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

    ovenDoorPivot.add(ovenDoorTop, ovenDoorBottom, ovenDoorLeft, ovenDoorRight, ovenWindow, ovenHandle);
    stove.add(body, cooktop, ovenBackWall, ovenLeftWall, ovenRightWall, ovenCeiling, ovenFloor, ovenDoorPivot, knobRow, ...burners);
    house.add(stove);
    addCollider(
      colliders,
      CENTER_X + localX,
      HOUSE_CENTER_Z + localZ + cavityCenterZ - cavityDepth / 2 + 0.04,
      cavityWidth,
      0.1,
    );
    addCollider(
      colliders,
      CENTER_X + localX - cavityWidth / 2 + 0.04,
      HOUSE_CENTER_Z + localZ + cavityCenterZ,
      0.1,
      cavityDepth,
    );
    addCollider(
      colliders,
      CENTER_X + localX + cavityWidth / 2 - 0.04,
      HOUSE_CENTER_Z + localZ + cavityCenterZ,
      0.1,
      cavityDepth,
    );
    const stoveCollider = addCollider(colliders, CENTER_X + localX, HOUSE_CENTER_Z + localZ, width + 0.08, depth + 0.08);
    counterSurfaces.push({
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: (width + 0.08) / 2,
      halfDepth: (depth + 0.08) / 2,
      floorY: KITCHEN_COUNTER_SURFACE_Y,
      collider: stoveCollider,
    });

    return {
      label: 'Oven',
      interactPosition: new Vector3(CENTER_X + localX, GAME_CONFIG.player.height, HOUSE_CENTER_Z + localZ + depth / 2 + 1.05),
      aimPosition: new Vector3(CENTER_X + localX, 0.94, HOUSE_CENTER_Z + localZ + depth / 2 + 0.12),
      doorPivot: ovenDoorPivot,
      collider: stoveCollider,
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: (width + 0.08) / 2,
      halfDepth: (depth + 0.08) / 2,
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
    };
  };

  const addUpperCupboard = (
    localX: number,
    localZ: number,
    width = 2.12,
    label = 'Upper Cupboards',
    baseY = 4.02,
  ): ChapterSevenCupboard => {
    const cupboard = new Group();
    cupboard.position.set(localX, baseY, localZ);

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
    const isBathroomUpperCupboard = label === 'Bathroom upper cupboard';
    addCabinetCookies(
      cupboard,
      localX,
      label,
      isBathroomUpperCupboard ? [0.12, 0.12] : [height * 0.38 + 0.04, height * 0.68 + 0.04],
      width,
      depth,
    );
    cupboard.add(back, leftSide, rightSide, top, bottom);
    if (!isBathroomUpperCupboard) {
      cupboard.add(lowerShelf, upperShelf);
    }
    if (isBathroomUpperCupboard) {
      const toothbrush = new Group();
      toothbrush.position.set(-width * 0.32, 0.2, 0.18);
      const brushHandle = new Mesh(new BoxGeometry(0.08, 0.06, 0.56), faucetMaterial);
      brushHandle.rotation.y = -0.18;
      const brushHead = new Mesh(new BoxGeometry(0.16, 0.08, 0.16), applianceWhiteMaterial);
      brushHead.position.set(0.02, 0.04, 0.31);
      const bristles = new Mesh(new BoxGeometry(0.14, 0.08, 0.05), sinkBasinMaterial);
      bristles.position.set(0.02, 0.1, 0.36);
      toothbrush.add(brushHandle, brushHead, bristles);

      const toothpaste = new Mesh(new CylinderGeometry(0.1, 0.13, 0.68, 14), applianceWhiteMaterial);
      toothpaste.rotation.z = Math.PI / 2;
      toothpaste.position.set(-width * 0.16, 0.2, 0.18);
      const toothpasteCap = new Mesh(new CylinderGeometry(0.09, 0.09, 0.08, 12), faucetMaterial);
      toothpasteCap.rotation.z = Math.PI / 2;
      toothpasteCap.position.set(-width * 0.16 + 0.38, 0.2, 0.18);

      const soap = new Mesh(new BoxGeometry(0.5, 0.16, 0.32), pinkFloorCushionMaterial);
      soap.position.set(width * 0.04, 0.18, 0.18);
      soap.rotation.y = 0.12;

      const shampooBottle = new Mesh(new CylinderGeometry(0.16, 0.18, 0.74, 18), applianceGlassMaterial);
      shampooBottle.position.set(width * 0.2, 0.46, 0.14);
      const shampooCap = new Mesh(new CylinderGeometry(0.12, 0.12, 0.08, 16), faucetMaterial);
      shampooCap.position.set(width * 0.2, 0.87, 0.14);
      const shampooLabel = new Mesh(new BoxGeometry(0.23, 0.28, 0.035), applianceWhiteMaterial);
      shampooLabel.position.set(width * 0.2, 0.45, 0.31);

      const conditionerBottle = new Mesh(new CylinderGeometry(0.14, 0.16, 0.58, 18), porcelainMaterial);
      conditionerBottle.position.set(width * 0.32, 0.38, 0.14);
      const conditionerCap = new Mesh(new CylinderGeometry(0.1, 0.1, 0.07, 16), faucetMaterial);
      conditionerCap.position.set(width * 0.32, 0.7, 0.14);
      const conditionerLabel = new Mesh(new BoxGeometry(0.2, 0.22, 0.035), sinkBasinMaterial);
      conditionerLabel.position.set(width * 0.32, 0.37, 0.3);

      cupboard.add(
        toothbrush,
        toothpaste,
        toothpasteCap,
        soap,
        shampooBottle,
        shampooCap,
        shampooLabel,
        conditionerBottle,
        conditionerCap,
        conditionerLabel,
      );
    }

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
    counterSurfaces.push({
      centerX: CENTER_X + localX,
      centerZ: HOUSE_CENTER_Z + localZ,
      halfWidth: width / 2,
      halfDepth: depth / 2,
      floorY: baseY + height,
    });
    const interactPosition = new Vector3(CENTER_X + localX, GAME_CONFIG.player.height, HOUSE_CENTER_Z + localZ + depth / 2 + 0.9);
    return {
      label,
      interactPosition,
      aimPosition: new Vector3(CENTER_X + localX, baseY + 0.68, HOUSE_CENTER_Z + localZ + depth / 2 + 0.08),
      doorPivots: [leftDoorPivot, rightDoorPivot],
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
    };
  };

  const frontRightWindowX = Math.min(1226.75 - CENTER_X, HOUSE_WIDTH / 2 - 1.45);
  const rearRoomDoorWidth = HOUSE_ROOM_DOOR_WIDTH;
  const rearRoomDoorHalfWidth = rearRoomDoorWidth / 2;
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
    {
      centerX: HOUSE_REAR_ROOM_DOOR_X,
      centerY: HOUSE_ROOM_DOOR_HEIGHT / 2,
      width: rearRoomDoorWidth,
      height: HOUSE_ROOM_DOOR_HEIGHT,
    },
  ]);
  const rearDoorLeftX = HOUSE_REAR_ROOM_DOOR_X - rearRoomDoorHalfWidth;
  const rearDoorRightX = HOUSE_REAR_ROOM_DOOR_X + rearRoomDoorHalfWidth;
  const backWallLeftSegmentWidth = rearDoorLeftX + HOUSE_WIDTH / 2;
  const backWallRightSegmentWidth = HOUSE_WIDTH / 2 - rearDoorRightX;
  if (backWallLeftSegmentWidth > 0.05) {
    addCollider(
      colliders,
      CENTER_X - HOUSE_WIDTH / 2 + backWallLeftSegmentWidth / 2,
      HOUSE_BACK_Z,
      backWallLeftSegmentWidth,
      HOUSE_WALL_THICKNESS,
    );
  }
  if (backWallRightSegmentWidth > 0.05) {
    addCollider(
      colliders,
      CENTER_X + rearDoorRightX + backWallRightSegmentWidth / 2,
      HOUSE_BACK_Z,
      backWallRightSegmentWidth,
      HOUSE_WALL_THICKNESS,
    );
  }
  addHouseWall(
    HOUSE_MARKER_SHORT_WALL_X,
    HOUSE_MARKER_SHORT_WALL_START_Z + HOUSE_MARKER_SHORT_WALL_LENGTH / 2,
    HOUSE_INTERIOR_WALL_THICKNESS,
    HOUSE_MARKER_SHORT_WALL_LENGTH,
  );
  const rearRoomCenterZ = HOUSE_REAR_ROOM_DOOR_Z - HOUSE_REAR_ROOM_DEPTH / 2;
  const rearRoomBackZ = HOUSE_REAR_ROOM_DOOR_Z - HOUSE_REAR_ROOM_DEPTH;
  const rearRoomFloorFrontZ = -(HOUSE_DEPTH + 1.2) / 2;
  const rearRoomFloorBackZ = rearRoomBackZ - 0.4;
  const rearRoomFloorDepth = rearRoomFloorFrontZ - rearRoomFloorBackZ;
  const rearRoomFloorCenterZ = (rearRoomFloorFrontZ + rearRoomFloorBackZ) / 2;
  const rearRoomFloor = createHousePlankFloor(
    HOUSE_REAR_ROOM_WIDTH + 0.8,
    rearRoomFloorDepth,
    HOUSE_REAR_ROOM_DOOR_X,
    rearRoomFloorCenterZ,
  );
  house.add(rearRoomFloor);
  const rearRoomCeiling = new Mesh(
    new BoxGeometry(HOUSE_REAR_ROOM_WIDTH + HOUSE_WALL_THICKNESS, 0.22, HOUSE_REAR_ROOM_DEPTH + HOUSE_WALL_THICKNESS),
    houseTrimMaterial,
  );
  rearRoomCeiling.position.set(HOUSE_REAR_ROOM_DOOR_X, HOUSE_HEIGHT + 0.02, rearRoomCenterZ);
  house.add(rearRoomCeiling);
  addHouseWall(
    HOUSE_REAR_ROOM_DOOR_X - HOUSE_REAR_ROOM_WIDTH / 2,
    rearRoomCenterZ,
    HOUSE_WALL_THICKNESS,
    HOUSE_REAR_ROOM_DEPTH + HOUSE_WALL_THICKNESS,
  );
  addHouseWall(
    HOUSE_REAR_ROOM_DOOR_X + HOUSE_REAR_ROOM_WIDTH / 2,
    rearRoomCenterZ,
    HOUSE_WALL_THICKNESS,
    HOUSE_REAR_ROOM_DEPTH + HOUSE_WALL_THICKNESS,
  );
  addHouseWall(
    HOUSE_REAR_ROOM_DOOR_X,
    rearRoomBackZ,
    HOUSE_REAR_ROOM_WIDTH + HOUSE_WALL_THICKNESS,
    HOUSE_WALL_THICKNESS,
  );
  addLaundryBasket(1202.82 - CENTER_X, 59.07 - HOUSE_CENTER_Z, -0.12);
  addSmallBathroomTrashCan(1207.46 - CENTER_X, 48.50 - HOUSE_CENTER_Z, 0.08);
  addWallShelf(1215.95 - CENTER_X, 2.06, 65.92 - HOUSE_CENTER_Z, 1);
  addTowelDuckShelf(1217.07 - CENTER_X, 2.1, 52.16 - HOUSE_CENTER_Z, -1);
  addToiletPaperHolder(1211.82 - CENTER_X, 0.92, 47.62 - HOUSE_CENTER_Z, 1);

  const leftWall = new Mesh(new BoxGeometry(HOUSE_WALL_THICKNESS, HOUSE_HEIGHT, HOUSE_DEPTH), houseWallMaterial);
  leftWall.position.set(-HOUSE_WIDTH / 2, HOUSE_HEIGHT / 2, 0);
  house.add(leftWall);
  addCollider(colliders, CENTER_X - HOUSE_WIDTH / 2, HOUSE_CENTER_Z, HOUSE_WALL_THICKNESS, HOUSE_DEPTH);

  const sideGlassDoorZ = 87.10 - HOUSE_CENTER_Z;
  const sideGlassDoorWidth = 4.1;
  const sideGlassDoorHeight = 3.85;
  const sideGlassDoorStartZ = sideGlassDoorZ - sideGlassDoorWidth / 2;
  const sideGlassDoorEndZ = sideGlassDoorZ + sideGlassDoorWidth / 2;
  const rightBackWallDepth = sideGlassDoorStartZ + HOUSE_DEPTH / 2;
  const rightFrontWallDepth = HOUSE_DEPTH / 2 - sideGlassDoorEndZ;
  const rightWallWindowZ = 73.23 - HOUSE_CENTER_Z;
  const rightWallWindowCenterY = 2.36;
  const rightWallWindowWidth = 4.2;
  const rightWallWindowHeight = 2.35;
  const addRightWallVisualSegment = (
    centerZ: number,
    centerY: number,
    depth: number,
    height: number,
  ): void => {
    if (depth <= 0.05 || height <= 0.05) {
      return;
    }

    const wall = new Mesh(new BoxGeometry(HOUSE_WALL_THICKNESS, height, depth), houseWallMaterial);
    wall.position.set(HOUSE_WIDTH / 2, centerY, centerZ);
    house.add(wall);
  };
  const rightBackWallMinZ = -HOUSE_DEPTH / 2;
  const rightBackWallMaxZ = sideGlassDoorStartZ;
  const rightWindowMinZ = rightWallWindowZ - rightWallWindowWidth / 2;
  const rightWindowMaxZ = rightWallWindowZ + rightWallWindowWidth / 2;
  const rightWindowMinY = rightWallWindowCenterY - rightWallWindowHeight / 2;
  const rightWindowMaxY = rightWallWindowCenterY + rightWallWindowHeight / 2;
  [
    [rightBackWallMinZ, Math.max(rightBackWallMinZ, rightWindowMinZ)],
    [Math.min(rightBackWallMaxZ, rightWindowMaxZ), rightBackWallMaxZ],
  ].forEach(([startZ, endZ]) => {
    addRightWallVisualSegment((startZ + endZ) / 2, HOUSE_HEIGHT / 2, endZ - startZ, HOUSE_HEIGHT);
  });
  const windowColumnMinZ = Math.max(rightBackWallMinZ, rightWindowMinZ);
  const windowColumnMaxZ = Math.min(rightBackWallMaxZ, rightWindowMaxZ);
  if (windowColumnMaxZ > windowColumnMinZ) {
    addRightWallVisualSegment(
      (windowColumnMinZ + windowColumnMaxZ) / 2,
      rightWindowMinY / 2,
      windowColumnMaxZ - windowColumnMinZ,
      rightWindowMinY,
    );
    addRightWallVisualSegment(
      (windowColumnMinZ + windowColumnMaxZ) / 2,
      rightWindowMaxY + (HOUSE_HEIGHT - rightWindowMaxY) / 2,
      windowColumnMaxZ - windowColumnMinZ,
      HOUSE_HEIGHT - rightWindowMaxY,
    );
  }
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
  house.add(rightFrontWall, rightWallHeader);
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
  addSideWallWindow(
    HOUSE_WIDTH / 2 - HOUSE_WALL_THICKNESS / 2 - 0.04,
    rightWallWindowZ,
    rightWallWindowCenterY,
    rightWallWindowWidth,
    rightWallWindowHeight,
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
    {
      centerX: 1215.77 - CENTER_X,
      centerY: 2.17,
      width: 3.1,
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

  const bookshelfWallLength = 18;
  addHouseWall(
    1218.25 - CENTER_X,
    98.69 - HOUSE_CENTER_Z - bookshelfWallLength / 2,
    HOUSE_WALL_THICKNESS,
    bookshelfWallLength,
  );
  const bigTableDividerLength = 11;
  addHouseWall(
    1235.69 - CENTER_X - bigTableDividerLength / 2,
    79.96 - HOUSE_CENTER_Z,
    bigTableDividerLength,
    HOUSE_INTERIOR_WALL_THICKNESS,
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
    1215.77 - CENTER_X,
    HOUSE_DEPTH / 2 - HOUSE_WALL_THICKNESS / 2 - 0.04,
    2.17,
    3.1,
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
    createHouseDoor(
      'Rear Connected Room Door',
      'front',
      HOUSE_REAR_ROOM_DOOR_X - rearRoomDoorHalfWidth,
      HOUSE_REAR_ROOM_DOOR_Z - 0.06,
      rearRoomDoorWidth,
      HOUSE_ROOM_DOOR_HEIGHT,
      HOUSE_REAR_ROOM_DOOR_X,
      HOUSE_REAR_ROOM_DOOR_Z,
      rearRoomDoorWidth,
      HOUSE_WALL_THICKNESS,
      HOUSE_REAR_ROOM_DOOR_X,
      HOUSE_REAR_ROOM_DOOR_Z - 2.1,
      1,
    ),
  );
  addBed(-23.55, 10.6, 1, 'Front bedroom bed');
  addBed(-23.55, -10.6, -1, 'Back bedroom bed');
  addRockingChair(
    1213.08 - CENTER_X,
    63.85 - HOUSE_CENTER_Z,
    Math.atan2(
      -(HOUSE_MARKER_SHORT_WALL_X - (1213.08 - CENTER_X)),
      -(HOUSE_MARKER_SHORT_WALL_START_Z - (63.85 - HOUSE_CENTER_Z)),
    ),
  );
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
  addColorfulRug(1228.04 - CENTER_X, 89.57 - HOUSE_CENTER_Z, 0);
  addColorfulRug(1210.82 - CENTER_X, 89.44 - HOUSE_CENTER_Z, Math.PI / 2, 8.2, 5.4);
  addPinkFloorCushion(HOUSE_LEFT_ROOM_WALL_X - 1.72, HOUSE_DEPTH / 2 - 1.62);
  addSquareBookTable(1204.02 - CENTER_X, 96.34 - HOUSE_CENTER_Z);
  addRoundRoseTable(1216.60 - CENTER_X, 97.27 - HOUSE_CENTER_Z);
  addSmallPlantTable(1225.65 - CENTER_X, 97.78 - HOUSE_CENTER_Z);
  addFishTankTable(1199.97 - CENTER_X, 85.39 - HOUSE_CENTER_Z);
  const remoteButtons = addTableRemote(1226.18 - CENTER_X, 1.08, 97.15 - HOUSE_CENTER_Z, -0.18);
  addSideGrandfatherClock(1217.94 - CENTER_X, 87.41 - HOUSE_CENTER_Z, -1);
  addBookshelf(1220.53 - CENTER_X, 98.69 - HOUSE_CENTER_Z - 0.64, Math.PI, 0.84, 0.96);
  addBookshelf(-25.05, -0.1, Math.PI / 2, 0.58, 0.84);
  const oldWoodenCloset = addOldWoodenCloset(-24.45, -2.55, Math.PI / 2);
  const frontBedroomOldWoodenCloset = addOldWoodenCloset(
    1187.70 - CENTER_X,
    96.31 - HOUSE_CENTER_Z,
    Math.atan2(
      HOUSE_LEFT_ROOM_WALL_X + 2.25 - (1187.70 - CENTER_X),
      HOUSE_FRONT_ROOM_DOOR_Z - (96.31 - HOUSE_CENTER_Z),
    ),
  );
  const rearBedroomOldWoodenCloset = addOldWoodenCloset(
    1188.85 - CENTER_X,
    63.76 - HOUSE_CENTER_Z,
    Math.PI / 2,
  );
  const oldWoodenClosets = [oldWoodenCloset, frontBedroomOldWoodenCloset, rearBedroomOldWoodenCloset];
  addPictureFrame(1193.33 - CENTER_X, 2.4, 84.23 - HOUSE_CENTER_Z, 1, dogPortraitMaterial);
  addPictureFrame(1197.89 - CENTER_X, 2.46, 83.77 - HOUSE_CENTER_Z, -1, catPortraitMaterial);
  addPictureFrame(1196.01 - CENTER_X, 2.66, 75.77 - HOUSE_CENTER_Z, -1, treePortraitMaterial);
  addHangingHomeSign(1198.72 - CENTER_X, 2.09, 76.23 - HOUSE_CENTER_Z, 1);
  addSidePictureFrame(1217.94 - CENTER_X, 2.03, 92.24 - HOUSE_CENTER_Z, -1, babyPortraitMaterial);
  addSidePictureFrame(1218.56 - CENTER_X, 2.15, 86.42 - HOUSE_CENTER_Z, 1, squirrelPortraitMaterial);
  addSidePictureFrame(1217.94 - CENTER_X, 2.53, 83.16 - HOUSE_CENTER_Z, -1, oceanDolphinPortraitMaterial);
  addSidePictureFrame(1235.69 - CENTER_X, 2.18, 77.96 - HOUSE_CENTER_Z, -1, pigPenPortraitMaterial);
  addSidePictureFrame(1201.49 - CENTER_X, 2.19, 55.46 - HOUSE_CENTER_Z, 1, dogOceanPortraitMaterial);
  addSidePictureFrame(1217.07 - CENTER_X, 2.05, 57.28 - HOUSE_CENTER_Z, -1, horsePasturePortraitMaterial);
  addSidePictureFrame(1215.49 - CENTER_X, 2.3, 66.62 - HOUSE_CENTER_Z, -1, chickenCoopPortraitMaterial);
  addSidePictureFrame(1235.69 - CENTER_X, 1.95, 94.79 - HOUSE_CENTER_Z, -1, birdNestPortraitMaterial);
  addPictureFrame(1221.50 - CENTER_X, 2.92, 61.31 - HOUSE_CENTER_Z, 1, swingPortraitMaterial);
  const wallTelevision = addWallTelevision(1230.33 - CENTER_X, 2.11, 80.19 - HOUSE_CENTER_Z, 1);
  addWallLamp(1236.31 - CENTER_X, 3.5, 90.01 - HOUSE_CENTER_Z);
  addWallLamp(1236.31 - CENTER_X, 3.67, 66.14 - HOUSE_CENTER_Z);
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
  const rearRoomBackFixtureZ = HOUSE_REAR_ROOM_DOOR_Z - HOUSE_REAR_ROOM_DEPTH + 0.92;
  const rearRoomLeftFixtureX = HOUSE_REAR_ROOM_DOOR_X - HOUSE_REAR_ROOM_WIDTH / 2 + 0.82;
  const rearRoomLaundryRotation = Math.PI / 2;
  const rearFixtures = [
    addToilet(HOUSE_REAR_ROOM_DOOR_X + 4.2, rearRoomBackFixtureZ),
    addBathroomSinkFixture(HOUSE_REAR_ROOM_DOOR_X + 0.4, rearRoomBackFixtureZ),
    addBathtubFixture(HOUSE_REAR_ROOM_DOOR_X + HOUSE_REAR_ROOM_WIDTH / 2 - 1.48, 57.30 - HOUSE_CENTER_Z),
    addTrashCanFixture(1231.64 - CENTER_X, 62.83 - HOUSE_CENTER_Z, -Math.PI / 2),
    addHoseFaucetFixture(1236.31 - CENTER_X, 1.16, 68.92 - HOUSE_CENTER_Z),
    addMiniLampTableFixture(1203.97 - CENTER_X, 63.15 - HOUSE_CENTER_Z),
    addMiniLampTableFixture(1199.83 - CENTER_X, 73.86 - HOUSE_CENTER_Z),
    addLaundryAppliance(rearRoomLeftFixtureX, rearRoomBackFixtureZ + 0.3, 'washing-machine', rearRoomLaundryRotation),
    addLaundryAppliance(rearRoomLeftFixtureX, rearRoomBackFixtureZ + 2.35, 'dryer', rearRoomLaundryRotation),
  ];
  addCookie(house, HOUSE_FRIDGE_X + 9.1, KITCHEN_COUNTER_SURFACE_Y + COOKIE_SURFACE_OFFSET, HOUSE_FRIDGE_Z + 0.42, 0.88, 'Kitchen counter hidden cookie');
  addCookie(house, HOUSE_REAR_ROOM_DOOR_X + 4.2, 1.81, rearRoomBackFixtureZ - 0.56, 0.78, 'Toilet tank hidden cookie');
  addCookie(house, HOUSE_REAR_ROOM_DOOR_X + HOUSE_REAR_ROOM_WIDTH / 2 - 1.48, 0.36, 57.30 - HOUSE_CENTER_Z - 0.38, 0.82, 'Bathtub hidden cookie');
  addCookie(house, 1208.45 - CENTER_X, 0.25, 101.1 - HOUSE_CENTER_Z, 0.9, 'Balcony hidden cookie');
  addCookie(house, 1238.7 - CENTER_X, 0.2, 72.2 - HOUSE_CENTER_Z, 0.9, 'Backyard hidden cookie');
  addCookie(house, 1216.55 - CENTER_X, 0.93, 97.2 - HOUSE_CENTER_Z, 0.86, 'Rose table easy cookie');
  addCookie(house, 1225.35 - CENTER_X, 1.11, 97.84 - HOUSE_CENTER_Z, 0.86, 'Plant table easy cookie');
  addCookie(house, 1232.2 - CENTER_X, 1.25, 97.1 - HOUSE_CENTER_Z, 0.9, 'Couch easy cookie');
  addCookie(house, HOUSE_LEFT_ROOM_WALL_X - 1.18, 0.89, HOUSE_DEPTH / 2 - 1.5, 0.9, 'Bean bag easy cookie');
  addCookie(house, leftRoomCenterX - 0.62, 1.13, 0.26, 0.9, 'Dining table easy cookie');
  addCookie(house, 1199.25 - CENTER_X, 1.08, 85.28 - HOUSE_CENTER_Z, 0.86, 'Fish tank table easy cookie');
  addCookie(house, 1201.12 - CENTER_X, 1.08, 85.55 - HOUSE_CENTER_Z, 0.86, 'Fish tank table second easy cookie');
  addCookie(house, 1203.55 - CENTER_X, 1.02, 96.1 - HOUSE_CENTER_Z, 0.86, 'Book table easy cookie');
  addCookie(house, 1226.0 - CENTER_X, 1.11, 97.28 - HOUSE_CENTER_Z, 0.82, 'Remote table easy cookie');
  addCookie(house, 1220.35 - CENTER_X, 0.9, 89.25 - HOUSE_CENTER_Z, 0.88, 'Rug edge easy cookie');
  addCookie(house, 1213.0 - CENTER_X, 1.05, 63.85 - HOUSE_CENTER_Z, 0.82, 'Rocking chair easy cookie');
  addCookie(house, 1204.0 - CENTER_X, 1.12, 52.98 - HOUSE_CENTER_Z, 0.82, 'Dryer top easy cookie');
  addCookie(house, 1205.15 - CENTER_X, 1.12, 53.35 - HOUSE_CENTER_Z, 0.82, 'Washer top easy cookie');
  addCookie(house, 1208.9 - CENTER_X, 1.44, 53.62 - HOUSE_CENTER_Z, 0.82, 'Bathroom sink counter easy cookie');
  addCookie(house, 1214.45 - CENTER_X, 0.82, 57.2 - HOUSE_CENTER_Z, 0.82, 'Bathtub rim easy cookie');
  addCookie(house, 1239.88 - CENTER_X, 0.82, 91.35 - HOUSE_CENTER_Z, 0.86, 'Backyard round table easy cookie');
  addCookie(house, 1246.9 - CENTER_X, 0.82, 62.25 - HOUSE_CENTER_Z, 0.82, 'Backyard swing seat easy cookie');
  const kitchenUpperCupboards = [
    addUpperCupboard(HOUSE_FRIDGE_X, HOUSE_FRIDGE_Z, 1.62, 'Upper cupboards over the fridge'),
    addUpperCupboard(HOUSE_FRIDGE_X + 2.3, HOUSE_FRIDGE_Z, 2.1, 'Upper cupboards over the counter'),
    addUpperCupboard(HOUSE_FRIDGE_X + 4.7, HOUSE_FRIDGE_Z, 1.74, 'Upper cupboards over the oven'),
    addUpperCupboard(HOUSE_FRIDGE_X + 7.42, HOUSE_FRIDGE_Z, 2.75, 'Right upper cupboards'),
    addUpperCupboard(HOUSE_FRIDGE_X + 9.0, HOUSE_FRIDGE_Z, 1.95, 'End upper cupboards'),
  ];
  const bathroomUpperCupboard = addUpperCupboard(
    1205.71 - CENTER_X,
    47.62 - HOUSE_CENTER_Z + 0.46,
    7,
    'Bathroom upper cupboard',
    2.85,
  );
  const houseUpperCupboards = [...kitchenUpperCupboards, bathroomUpperCupboard];
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
  const refreshCookiesForDay = (day: number, forceReroll = false): void => {
    if (forceReroll) {
      cookieReloadSeed = Math.random() * 100000;
    }

    const cycle = Math.max(0, Math.floor((Math.max(1, Math.floor(day)) - 1) / 5));
    const cookieRolls = cookiePickups.map((cookie, index) => {
      const roll = Math.sin(cookie.shuffleSeed * 3.71 + cookieReloadSeed * 0.97 + cycle * 11.37 + index * 1.91) * 43758.5453;
      const normalized = roll - Math.floor(roll);
      return { cookie, normalized };
    });
    const minimumVisibleCookies = Math.min(cookieRolls.length, 24);
    const activeCookies = new Set<ChapterSevenCookiePickup>();
    cookieRolls.forEach(({ cookie, normalized }) => {
      if (normalized > 0.36) {
        activeCookies.add(cookie);
      }
    });
    if (activeCookies.size < minimumVisibleCookies) {
      [...cookieRolls]
        .sort((a, b) => b.normalized - a.normalized)
        .slice(0, minimumVisibleCookies)
        .forEach(({ cookie }) => activeCookies.add(cookie));
    }
    cookiePickups.forEach((cookie) => {
      cookie.active = activeCookies.has(cookie);
      cookie.collected = false;
      cookie.root.visible = cookie.active;
    });
    houseDrawers.forEach((drawer) => {
      drawer.cookieCount = drawer.cookies.filter((cookie) => cookie.active && !cookie.collected).length;
    });
  };

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
  const welcomeMat = new Mesh(new PlaneGeometry(3.25, 1.55), welcomeMatMaterial);
  welcomeMat.rotation.x = -Math.PI / 2;
  welcomeMat.position.set(1210.19 - CENTER_X, 0.285, 100.79 - HOUSE_CENTER_Z);
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
    welcomeMat,
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
  addCookie(house, leftPorchChairX + 0.05, 0.93, leftPorchChairZ + 0.02, 0.82, 'Porch rocking chair easy cookie');
  addCookie(house, rightPorchChairX - 0.02, 0.93, rightPorchChairZ + 0.02, 0.82, 'Porch rocking chair second easy cookie');
  addCookie(cardboardBox.root, 0.18, 0.42, 0.18, 0.86, 'Cardboard box easy cookie');
  addOutdoorRoundTableSet(1240.54, 91.39);
  const swingSet = addOutdoorSwingSet(1246.8, 62.24, 0, 1.05);
  let swingInput = 0;
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
  const createYardTrail = (
    startX: number,
    startZ: number,
    endX: number,
    endZ: number,
  ): { start: Vector3; end: Vector3; width: number } => {
    const dx = endX - startX;
    const dz = endZ - startZ;
    const length = Math.hypot(dx, dz);
    const width = porchGapWidth;
    const trailGroup = new Group();
    trailGroup.name = 'Tan brick-dotted backyard trail';
    trailGroup.position.set((startX + endX) / 2, 0, (startZ + endZ) / 2);
    trailGroup.rotation.y = Math.atan2(dx, dz);

    const base = new Mesh(new BoxGeometry(width, 0.055, length), yardTrailMaterial);
    base.position.set(0, 0.055, 0);
    trailGroup.add(base);

    const edgeInset = width / 2 - 0.1;
    [-edgeInset, edgeInset].forEach((edgeX) => {
      const edge = new Mesh(new BoxGeometry(0.18, 0.065, length), yardTrailEdgeMaterial);
      edge.position.set(edgeX, 0.072, 0);
      trailGroup.add(edge);
    });

    const patchOffsets = [-1.28, -0.42, 1.04, 0.32, -1.62, 1.48, -0.08, 0.84];
    const patchSpacing = 2.65;
    const patchCount = Math.max(12, Math.floor(length / patchSpacing));
    for (let index = 0; index < patchCount; index += 1) {
      const patch = new Mesh(new BoxGeometry(0.72 + (index % 3) * 0.18, 0.026, 0.42), yardTrailEdgeMaterial);
      const localZ = -length / 2 + 1.15 + index * patchSpacing;
      patch.position.set(patchOffsets[index % patchOffsets.length], 0.091, localZ);
      patch.rotation.y = ((index % 7) - 3) * 0.08;
      patch.scale.z = 0.8 + (index % 4) * 0.12;
      trailGroup.add(patch);
    }

    const edgeBumpSpacing = 2.35;
    const edgeBumpCount = Math.max(12, Math.floor(length / edgeBumpSpacing));
    for (let index = 0; index < edgeBumpCount; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      const bump = new Mesh(new BoxGeometry(0.32 + (index % 3) * 0.08, 0.045, 0.64), yardTrailEdgeMaterial);
      bump.position.set(side * (width / 2 - 0.18), 0.094, -length / 2 + 0.9 + index * edgeBumpSpacing);
      bump.rotation.y = side * (0.08 + (index % 4) * 0.025);
      trailGroup.add(bump);
    }

    const brickOffsets = [-1.45, 1.34, -0.18, -0.84, 1.62, 0.42, -1.12, 0.92];
    const brickSpacing = 3.8;
    const brickCount = Math.max(8, Math.floor(length / brickSpacing));
    for (let index = 0; index < brickCount; index += 1) {
      const brick = new Mesh(new BoxGeometry(0.72, 0.07, 0.42), yardTrailBrickMaterial);
      const localZ = -length / 2 + 1.8 + index * brickSpacing;
      brick.position.set(brickOffsets[index % brickOffsets.length], 0.105, localZ);
      brick.rotation.y = ((index % 5) - 2) * 0.045;
      trailGroup.add(brick);
    }

    house.add(trailGroup);
    return {
      start: new Vector3(startX, 0, startZ),
      end: new Vector3(endX, 0, endZ),
      width,
    };
  };
  const backyardTrail = createYardTrail(
    1201.64 - CENTER_X,
    164.29 - HOUSE_CENTER_Z,
    1210.05 - CENTER_X,
    porchFrontZ,
  );
  const houseDoors = [houseDoor, sideGlassDoor, ...roomDoors];
  const houseInteriorLights = [
    [-14, 9],
    [7, 9],
    [-13, -8],
    [9, -7],
    [HOUSE_REAR_ROOM_DOOR_X, HOUSE_REAR_ROOM_DOOR_Z - HOUSE_REAR_ROOM_DEPTH / 2],
  ].map(([localX, localZ]) => {
    const interiorLight = new PointLight(0xffddb0, 0.28, 22, 1.5);
    interiorLight.position.set(localX, 4.25, localZ);
    house.add(interiorLight);
    return interiorLight;
  });

  root.add(house);

  const light = new PointLight(0xfff0b8, 3.2, FOREST_SIZE * 0.72, 1.2);
  light.position.set(CENTER_X - 36, 34, CENTER_Z - 42);
  root.add(light);

  const nightSky = new Group();
  nightSky.name = 'Chapter 7 night moon and stars';
  nightSky.visible = true;
  const moonMaterial = createNightSkyMaterial(0xf3f0d7, 0);
  const moon = new Mesh(new SphereGeometry(4.6, 28, 18), moonMaterial);
  moon.position.set(CENTER_X + 74, 82, CENTER_Z - 132);
  nightSky.add(moon);

  const starMaterial = createNightSkyMaterial(0xffffff, 0);
  const starGeometry = new SphereGeometry(0.24, 8, 6);
  const starRandom = createRandom(717);
  for (let index = 0; index < 86; index += 1) {
    const star = new Mesh(starGeometry, starMaterial);
    const angle = starRandom() * Math.PI * 2;
    const radius = 92 + starRandom() * 210;
    star.position.set(
      CENTER_X + Math.cos(angle) * radius,
      48 + starRandom() * 54,
      CENTER_Z + Math.sin(angle) * radius,
    );
    star.scale.setScalar(0.65 + starRandom() * 1.45);
    nightSky.add(star);
  }
  root.add(nightSky);

  const treeTrunkGeometry = new CylinderGeometry(0.46, 0.62, 8.8, 10);
  const treeCrownBottomGeometry = new SphereGeometry(2.6, 12, 10);
  const treeCrownTopGeometry = new SphereGeometry(2.2, 12, 10);
  const trunkInstances = new InstancedMesh(treeTrunkGeometry, barkMaterial, TREE_COUNT);
  const crownBottomInstances = new InstancedMesh(treeCrownBottomGeometry, leafMaterial, TREE_COUNT);
  const crownTopInstances = new InstancedMesh(treeCrownTopGeometry, leafMaterial, TREE_COUNT);
  const dummy = new Object3D();
  let treeInstanceCount = 0;
  const getDistanceToBackyardTrail = (worldX: number, worldZ: number): number => {
    const localX = worldX - CENTER_X;
    const localZ = worldZ - HOUSE_CENTER_Z;
    const segmentX = backyardTrail.end.x - backyardTrail.start.x;
    const segmentZ = backyardTrail.end.z - backyardTrail.start.z;
    const segmentLengthSquared = segmentX * segmentX + segmentZ * segmentZ;
    const rawT = segmentLengthSquared > 0
      ? ((localX - backyardTrail.start.x) * segmentX + (localZ - backyardTrail.start.z) * segmentZ) / segmentLengthSquared
      : 0;
    const t = MathUtils.clamp(rawT, 0, 1);
    const closestX = backyardTrail.start.x + segmentX * t;
    const closestZ = backyardTrail.start.z + segmentZ * t;
    return Math.hypot(localX - closestX, localZ - closestZ);
  };

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
    if (getDistanceToBackyardTrail(x, z) < backyardTrail.width * 1.65) {
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

  const isInsideBuiltFootprint = (worldX: number, worldZ: number): boolean => {
    const localX = worldX - CENTER_X;
    const localZ = worldZ - HOUSE_CENTER_Z;
    const insideMainHouse = Math.abs(localX) <= HOUSE_WIDTH / 2 + 1.2
      && Math.abs(localZ) <= HOUSE_DEPTH / 2 + 1.2;
    const insideRearRoom = Math.abs(localX - HOUSE_REAR_ROOM_DOOR_X) <= HOUSE_REAR_ROOM_WIDTH / 2 + 1.0
      && Math.abs(localZ - rearRoomCenterZ) <= HOUSE_REAR_ROOM_DEPTH / 2 + 1.0;
    const insidePorch = Math.abs(localX) <= porchWidth / 2 + 1.0
      && Math.abs(localZ - porchCenterZ) <= porchDepth / 2 + 1.0;
    const insideBackyardTrail = getDistanceToBackyardTrail(worldX, worldZ) <= backyardTrail.width * 0.72;

    return insideMainHouse || insideRearRoom || insidePorch || insideBackyardTrail;
  };

  const grassGeometry = new ConeGeometry(0.08, 0.72, 5);
  const grassInstances = new InstancedMesh(grassGeometry, grassMaterial, GRASS_PATCH_COUNT);
  for (let index = 0; index < GRASS_PATCH_COUNT; index += 1) {
    const scale = 0.5 + random() * 0.95;
    let x = CENTER_X + (random() - 0.5) * FOREST_SIZE * 0.96;
    let z = CENTER_Z + (random() - 0.5) * FOREST_SIZE * 0.96;
    for (let attempt = 0; attempt < 24 && isInsideBuiltFootprint(x, z); attempt += 1) {
      x = CENTER_X + (random() - 0.5) * FOREST_SIZE * 0.96;
      z = CENTER_Z + (random() - 0.5) * FOREST_SIZE * 0.96;
    }
    dummy.position.set(x, getForestFloorY() + 0.34 * scale, z);
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
  refreshCookiesForDay(1);

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
    cookies: cookiePickups,
    houseFridge,
    houseUpperCupboard,
    houseUpperCupboards,
    houseBaseCabinets,
    houseOven,
    oldWoodenCloset,
    oldWoodenClosets,
    cardboardBox,
    kitchenSink,
    rearFixtures,
    remoteButtons,
    swingSet,
    refreshCookiesForDay,
    setTelevisionPowered: wallTelevision.setPowered,
    isTelevisionPowered: wallTelevision.isPowered,
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
        rearFixtures.forEach((fixture) => {
          fixture.wallColliders?.forEach((collider) => {
            collider.enabled = true;
          });
        });
        crawlUnderTableColliders.forEach((table) => {
          table.collider.enabled = true;
        });
        return null;
      }

      const isCrawlUnderColliderActive = (collider: CollisionBox): boolean => (
        crawling
        && crawlUnderTableColliders.some((table) => (
          table.collider === collider
          && Math.abs(position.x - table.centerX) <= table.halfWidth + GAME_CONFIG.player.radius + 0.28
          && Math.abs(position.z - table.centerZ) <= table.halfDepth + GAME_CONFIG.player.radius + 0.28
        ))
      );

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

      rearFixtures.forEach((fixture) => {
        if (fixture.kind !== 'bathtub' || !fixture.wallColliders || !fixture.tubBounds) {
          return;
        }

        const nearTub = Math.abs(position.x - fixture.tubBounds.centerX) <= fixture.tubBounds.halfWidth + GAME_CONFIG.player.radius + 0.32
          && Math.abs(position.z - fixture.tubBounds.centerZ) <= fixture.tubBounds.halfDepth + GAME_CONFIG.player.radius + 0.32;
        const insideTub = Math.abs(position.x - fixture.tubBounds.centerX) <= fixture.tubBounds.halfWidth - 0.24
          && Math.abs(position.z - fixture.tubBounds.centerZ) <= fixture.tubBounds.halfDepth - 0.24;
        const highEnoughToClearTub = position.y > GAME_CONFIG.player.height + 0.34;
        fixture.wallColliders.forEach((collider) => {
          collider.enabled = !(nearTub && (highEnoughToClearTub || insideTub));
        });
      });

      crawlUnderTableColliders.forEach((table) => {
        const nearTable = Math.abs(position.x - table.centerX) <= table.halfWidth + GAME_CONFIG.player.radius + 0.28
          && Math.abs(position.z - table.centerZ) <= table.halfDepth + GAME_CONFIG.player.radius + 0.28;
        table.collider.enabled = !(crawling && nearTable);
      });

      const insideOven = Math.abs(position.x - houseOven.centerX) <= houseOven.halfWidth - 0.1
        && Math.abs(position.z - houseOven.centerZ) <= houseOven.halfDepth + 0.02
        && position.y < GAME_CONFIG.player.height - 0.08;
      const nearOven = Math.abs(position.x - houseOven.centerX) <= houseOven.halfWidth + GAME_CONFIG.player.radius + 0.36
        && Math.abs(position.z - houseOven.centerZ) <= houseOven.halfDepth + GAME_CONFIG.player.radius + 0.46;
      const canCrawlIntoOven = insideOven || (
        houseOven.openAmount > 0.72
        && crawling
        && nearOven
      );
      const currentStandingFloorY = Math.max(0, position.y - GAME_CONFIG.player.height);
      const surfaceJumpReach = 3.0;

      for (const surface of counterSurfaces) {
        const surfaceReachable = surface.floorY <= currentStandingFloorY + surfaceJumpReach;
        if (surface.collider) {
          const nearSurface = Math.abs(position.x - surface.centerX) <= surface.halfWidth + GAME_CONFIG.player.radius + 0.28
            && Math.abs(position.z - surface.centerZ) <= surface.halfDepth + GAME_CONFIG.player.radius + 0.28;
          const highEnoughToClearSurface = surfaceReachable && position.y > GAME_CONFIG.player.height + 0.24;
          const crawlUnderActive = isCrawlUnderColliderActive(surface.collider);
          surface.collider.enabled = surface.collider === houseOven.collider
            ? !canCrawlIntoOven && !crawlUnderActive && !(nearSurface && highEnoughToClearSurface)
            : !crawlUnderActive && !(nearSurface && highEnoughToClearSurface);
        }
        const onSurface = Math.abs(position.x - surface.centerX) <= surface.halfWidth
          && Math.abs(position.z - surface.centerZ) <= surface.halfDepth;
        if (surfaceReachable && onSurface && position.y > GAME_CONFIG.player.height + 0.18) {
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
    isPlayerInsideOven(position: Vector3): boolean {
      return Math.abs(position.x - houseOven.centerX) <= houseOven.halfWidth - 0.08
        && Math.abs(position.z - houseOven.centerZ) <= houseOven.halfDepth + 0.02
        && position.y < GAME_CONFIG.player.height - 0.08;
    },
    isPlayerInForcedCrawlSpace(position: Vector3): boolean {
      if (position.y >= GAME_CONFIG.player.height - 0.06) {
        return false;
      }

      const underBed = bedSurfaces.some((surface) => (
        Math.abs(position.x - surface.centerX) <= surface.halfWidth + GAME_CONFIG.player.radius + 0.18
        && Math.abs(position.z - surface.centerZ) <= surface.halfDepth + GAME_CONFIG.player.radius + 0.18
      ));
      if (underBed) {
        return true;
      }

      const insideOven = Math.abs(position.x - houseOven.centerX) <= houseOven.halfWidth + GAME_CONFIG.player.radius + 0.16
        && Math.abs(position.z - houseOven.centerZ) <= houseOven.halfDepth + GAME_CONFIG.player.radius + 0.18;
      if (insideOven) {
        return true;
      }

      const insideClosedCardboardBox = cardboardBox.openAmount < 0.72
        && Math.abs(position.x - cardboardBox.centerX) <= cardboardBox.halfWidth + GAME_CONFIG.player.radius + 0.12
        && Math.abs(position.z - cardboardBox.centerZ) <= cardboardBox.halfDepth + GAME_CONFIG.player.radius + 0.12;
      if (insideClosedCardboardBox) {
        return true;
      }

      return crawlUnderTableColliders.some((table) => (
        Math.abs(position.x - table.centerX) <= table.halfWidth + GAME_CONFIG.player.radius + 0.2
        && Math.abs(position.z - table.centerZ) <= table.halfDepth + GAME_CONFIG.player.radius + 0.2
      ));
    },
    setSwingOccupied(occupied: boolean): void {
      swingSet.occupied = occupied;
      if (!occupied) {
        swingInput = 0;
      }
    },
    setSwingInput(input: number): void {
      swingInput = Math.max(0, Math.min(1, input));
    },
    startGrandfatherClockChime(): void {
      grandfatherClockChimeTimer = 3.0;
    },
    update(deltaSeconds: number, playerPosition?: Vector3, nightBlend = 0): void {
      forestTime += deltaSeconds;
      tvNewsScreen.update(forestTime, wallTelevision.isPowered());
      fishTankFish.forEach((fishMotion, index) => {
        const swimTime = forestTime * fishMotion.speed + fishMotion.phase;
        const x = fishMotion.baseX + Math.sin(swimTime) * fishMotion.rangeX;
        const z = fishMotion.baseZ + Math.cos(swimTime * 0.8 + index) * fishMotion.rangeZ;
        const y = fishMotion.baseY + Math.sin(swimTime * 1.7) * 0.045;
        const dx = Math.cos(swimTime) * fishMotion.rangeX;
        fishMotion.fish.position.set(x, y, z);
        fishMotion.fish.rotation.y = dx >= 0 ? 0 : Math.PI;
        fishMotion.fish.rotation.z = Math.sin(swimTime * 2.4) * 0.08;
      });
      grandfatherClockChimeTimer = Math.max(0, grandfatherClockChimeTimer - deltaSeconds);
      grandfatherClockMotionParts.forEach((part, partIndex) => {
        const chimeStrength = MathUtils.clamp(grandfatherClockChimeTimer / 2.7, 0, 1);
        const swing = Math.sin(forestTime * (chimeStrength > 0 ? 9.4 : 2.15) + partIndex * 0.5);
        const swingAmount = 0.04 + chimeStrength * 0.24;
        part.rod.rotation.z = part.rodBaseRotationZ + swing * swingAmount;
        part.bob.position.x = part.bobBaseX + swing * (0.055 + chimeStrength * 0.22);
        part.bob.rotation.z = swing * swingAmount;
        part.weights.forEach((weight, weightIndex) => {
          const hitPulse = chimeStrength * Math.max(0, Math.sin(forestTime * 18 + weightIndex * 1.3));
          weight.position.y = part.weightBaseYs[weightIndex] + hitPulse * 0.075;
        });
      });
      light.intensity = MathUtils.lerp(
        2.85 + Math.sin(forestTime * 0.7) * 0.16,
        0.34 + Math.abs(Math.sin(forestTime * 1.25)) * 0.05,
        nightBlend,
      );
      houseInteriorLights.forEach((interiorLight, index) => {
        const warmPulse = Math.sin(forestTime * 0.82 + index * 1.7) * 0.02;
        interiorLight.intensity = MathUtils.lerp(0.28, 0.48 + warmPulse, nightBlend);
        interiorLight.distance = MathUtils.lerp(20, 18, nightBlend);
      });
      nightSky.visible = nightBlend > 0.02;
      nightSkyMaterials.forEach((material) => {
        material.opacity = material === moonMaterial
          ? nightBlend * 0.92
          : nightBlend * 0.78;
      });
      const targetSwingPower = swingSet.occupied ? swingInput : 0;
      const swingPowerRate = targetSwingPower > swingSet.swingPower ? 0.78 : 0.46;
      swingSet.swingPower += (targetSwingPower - swingSet.swingPower) * (1 - Math.exp(-swingPowerRate * deltaSeconds));
      swingSet.swingPhase += (2.05 + swingSet.swingPower * 1.45) * deltaSeconds;
      const targetSwingAngle = Math.sin(swingSet.swingPhase) * 0.58 * swingSet.swingPower;
      swingSet.angle += (targetSwingAngle - swingSet.angle) * (1 - Math.exp(-4.1 * deltaSeconds));
      if (Math.abs(swingSet.angle) < 0.0015 && swingSet.swingPower < 0.0015) {
        swingSet.angle = 0;
      }
      swingSet.pivot.rotation.x = swingSet.angle;
      swingSet.sitPosition.copy(swingSet.seatAnchor.getWorldPosition(new Vector3()));
      swingSet.lookTarget.copy(swingSet.lookAnchor.getWorldPosition(new Vector3()));
      const exitPoint = getRotatedLocalPoint(swingSet.baseX - CENTER_X, swingSet.baseZ - HOUSE_CENTER_Z, swingSet.rotationY, 0, 2.25);
      swingSet.exitPosition.set(CENTER_X + exitPoint.x, GAME_CONFIG.player.height, HOUSE_CENTER_Z + exitPoint.z);
      houseDoors.forEach((door) => {
        if (playerPosition && door.interactionMode !== 'manual') {
          const distanceToDoor = Math.hypot(
            playerPosition.x - door.collider.centerX,
            playerPosition.z - door.collider.centerZ,
          );
          if (distanceToDoor <= door.pushRadius && door.openAmount < 0.08) {
            const pivotWorldX = CENTER_X + door.doorPivot.position.x;
            const pivotWorldZ = HOUSE_CENTER_Z + door.doorPivot.position.z;
            const frontFacingDoor = door.collider.halfWidth > door.collider.halfDepth;
            door.openDirection = frontFacingDoor
              ? playerPosition.z > pivotWorldZ ? 1 : -1
              : playerPosition.x > pivotWorldX ? -1 : 1;
          }
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

      oldWoodenClosets.forEach((closet) => {
        const closetDelta = closet.targetOpenAmount - closet.openAmount;
        if (Math.abs(closetDelta) > 0.001) {
          const step = Math.min(Math.abs(closetDelta), deltaSeconds * 4.2) * Math.sign(closetDelta);
          closet.openAmount += step;
        } else {
          closet.openAmount = closet.targetOpenAmount;
        }
        closet.doorPivots[0].rotation.y = -closet.openAmount * Math.PI * 0.62;
        closet.doorPivots[1].rotation.y = closet.openAmount * Math.PI * 0.62;
        closet.open = closet.targetOpenAmount > 0.5;
        closet.doorCollider.enabled = closet.openAmount < 0.58;
      });

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

      rearFixtures.forEach((fixture) => {
        const fixtureDelta = fixture.targetOpenAmount - fixture.openAmount;
        if (Math.abs(fixtureDelta) > 0.001) {
          const step = Math.min(Math.abs(fixtureDelta), deltaSeconds * 4.0) * Math.sign(fixtureDelta);
          fixture.openAmount += step;
        } else {
          fixture.openAmount = fixture.targetOpenAmount;
        }

        if (fixture.animation === 'toilet-lid') {
          fixture.doorPivots[0].rotation.x = -fixture.openAmount * Math.PI * 0.86;
        } else if (fixture.animation === 'faucet') {
          fixture.doorPivots[0].rotation.z = -fixture.openAmount * Math.PI * 0.52;
          if (fixture.waterStream) {
            fixture.waterStream.visible = fixture.openAmount > 0.03;
            fixture.waterStream.scale.y = Math.max(0.01, fixture.openAmount);
          }
        } else if (fixture.animation === 'bathtub-faucet') {
          fixture.doorPivots[0].rotation.z = -fixture.openAmount * Math.PI * 0.52;
          const faucetRunning = fixture.openAmount > 0.03;
          if (fixture.waterStream) {
            fixture.waterStream.visible = faucetRunning;
            fixture.waterStream.scale.y = Math.max(0.01, fixture.openAmount);
          }
          fixture.waterSplash?.forEach((drop, index) => {
            const pulse = Math.sin(forestTime * 16 + (drop.userData.phase as number));
            drop.visible = faucetRunning;
            drop.position.set(
              (drop.userData.baseX as number) + pulse * 0.035,
              (drop.userData.baseY as number) + Math.abs(pulse) * 0.08 - index * 0.006,
              (drop.userData.baseZ as number) + Math.cos(forestTime * 13 + index) * 0.04,
            );
            drop.scale.setScalar(0.82 + Math.abs(pulse) * 0.42);
          });
          fixture.waterFillAmount = Math.min(
            0.92,
            Math.max(
              0,
              (fixture.waterFillAmount ?? 0) + (fixture.targetOpenAmount > 0.5 ? deltaSeconds * 0.075 : -deltaSeconds * 0.035),
            ),
          );
          if (fixture.waterSurface) {
            fixture.waterSurface.visible = fixture.waterFillAmount > 0.015;
            fixture.waterSurface.position.y = 0.25 + fixture.waterFillAmount * 0.55;
          }
        } else if (fixture.animation === 'hose-faucet') {
          fixture.doorPivots[0].rotation.x = fixture.openAmount * Math.PI * 1.4;
          const faucetRunning = fixture.openAmount > 0.03;
          if (fixture.waterStream) {
            fixture.waterStream.visible = faucetRunning;
            fixture.waterStream.scale.y = Math.max(0.01, fixture.openAmount);
          }
          fixture.waterSplash?.forEach((drop, index) => {
            const pulse = Math.sin(forestTime * 17 + (drop.userData.phase as number));
            drop.visible = faucetRunning;
            drop.position.set(
              (drop.userData.baseX as number) + Math.cos(forestTime * 9 + index) * 0.035,
              (drop.userData.baseY as number) + Math.abs(pulse) * 0.045,
              (drop.userData.baseZ as number) + pulse * 0.04,
            );
            drop.scale.setScalar(0.58 + Math.abs(pulse) * 0.32);
          });
          fixture.waterFillAmount = Math.min(
            0.78,
            Math.max(
              fixture.waterFillAmount ?? 0,
              (fixture.waterFillAmount ?? 0) + (fixture.targetOpenAmount > 0.5 ? deltaSeconds * 0.045 : 0),
            ),
          );
          if (fixture.waterSurface) {
            fixture.waterSurface.visible = fixture.waterFillAmount > 0.015;
            const puddle = fixture.waterFillAmount;
            fixture.waterSurface.scale.set(0.28 + puddle * 6.05, 1, 0.18 + puddle * 3.85);
          }
        } else if (fixture.animation === 'trash-lid') {
          fixture.doorPivots[0].rotation.x = -fixture.openAmount * Math.PI * 0.56;
          if (fixture.trashContents) {
            fixture.trashContents.visible = fixture.openAmount > 0.55;
          }
        } else if (fixture.animation === 'table-lamp') {
          fixture.doorPivots[0].rotation.z = MathUtils.lerp(0.35, -0.35, fixture.openAmount);
          if (fixture.lampLight) {
            fixture.lampLight.intensity = fixture.openAmount * 2.8;
            fixture.lampLight.distance = MathUtils.lerp(3.2, 9.5, fixture.openAmount);
          }
          if (fixture.lampGlow) {
            fixture.lampGlow.visible = fixture.openAmount > 0.04;
            fixture.lampGlow.scale.setScalar(0.72 + fixture.openAmount * 0.28);
          }
        } else {
          fixture.doorPivots[0].rotation.y = -fixture.openAmount * Math.PI * 0.58;
        }
        fixture.open = fixture.targetOpenAmount > 0.5;
      });
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
      cookieReloadSeed = Math.random() * 100000;
      refreshCookiesForDay(1);
      bedSurfaces.forEach((surface) => {
        surface.collider.enabled = true;
      });
      counterSurfaces.forEach((surface) => {
        if (surface.collider) {
          surface.collider.enabled = true;
        }
      });
      crawlUnderTableColliders.forEach((table) => {
        table.collider.enabled = true;
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
      oldWoodenClosets.forEach((closet) => {
        closet.open = false;
        closet.openAmount = 0;
        closet.targetOpenAmount = 0;
        closet.doorPivots.forEach((doorPivot) => {
          doorPivot.rotation.y = 0;
        });
        closet.doorCollider.enabled = true;
      });
      cardboardBox.open = false;
      cardboardBox.openAmount = 0;
      cardboardBox.targetOpenAmount = 0;
      cardboardBox.root.visible = true;
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
      wallTelevision.setPowered(false);
      swingInput = 0;
      swingSet.occupied = false;
      swingSet.angle = 0;
      swingSet.swingPhase = 0;
      swingSet.swingPower = 0;
      swingSet.pivot.rotation.x = 0;
      grandfatherClockChimeTimer = 0;
      grandfatherClockMotionParts.forEach((part) => {
        part.rod.rotation.z = part.rodBaseRotationZ;
        part.bob.position.x = part.bobBaseX;
        part.bob.rotation.z = 0;
        part.weights.forEach((weight, weightIndex) => {
          weight.position.y = part.weightBaseYs[weightIndex];
        });
      });
      rearFixtures.forEach((fixture) => {
        const startsOn = false;
        fixture.open = startsOn;
        fixture.openAmount = startsOn ? 1 : 0;
        fixture.targetOpenAmount = startsOn ? 1 : 0;
        fixture.doorPivots.forEach((doorPivot) => {
          doorPivot.rotation.set(0, 0, 0);
        });
        if (fixture.animation === 'table-lamp') {
          fixture.doorPivots[0].rotation.z = -0.35;
        }
        if (fixture.waterStream) {
          fixture.waterStream.visible = false;
          fixture.waterStream.scale.y = 0.01;
        }
        if (fixture.trashContents) {
          fixture.trashContents.visible = false;
        }
        fixture.waterSplash?.forEach((drop) => {
          drop.visible = false;
          drop.scale.setScalar(1);
          drop.position.set(
            drop.userData.baseX as number,
            drop.userData.baseY as number,
            drop.userData.baseZ as number,
          );
        });
        fixture.waterFillAmount = 0;
        if (fixture.waterSurface) {
          fixture.waterSurface.visible = false;
          fixture.waterSurface.position.y = typeof fixture.waterSurface.userData.baseY === 'number'
            ? fixture.waterSurface.userData.baseY
            : 0.25;
          fixture.waterSurface.scale.x = typeof fixture.waterSurface.userData.baseScaleX === 'number'
            ? fixture.waterSurface.userData.baseScaleX
            : fixture.waterSurface.scale.x;
          fixture.waterSurface.scale.z = typeof fixture.waterSurface.userData.baseScaleZ === 'number'
            ? fixture.waterSurface.userData.baseScaleZ
            : fixture.waterSurface.scale.z;
        }
        fixture.wallColliders?.forEach((collider) => {
          collider.enabled = true;
        });
        if (fixture.lampLight) {
          fixture.lampLight.intensity = startsOn ? 2.8 : 0;
          fixture.lampLight.distance = startsOn ? 9.5 : 3.2;
        }
        if (fixture.lampGlow) {
          fixture.lampGlow.visible = startsOn;
          fixture.lampGlow.scale.setScalar(startsOn ? 1 : 0.72);
        }
        fixture.collider.enabled = true;
      });
    },
  };
}
