import {
  BoxGeometry,
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';

import { GAME_CONFIG } from '../config/gameConfig';
import type { CollisionBox } from '../types/world';
import type { HudJumpScareVariant } from '../ui/createHud';

export type ChapterNineAnimatronicId = 'bonnie' | 'chica' | 'freddy' | 'foxy' | 'golden-freddy';
export type ChapterNineHeldItem = 'coordinate-tool' | 'camera' | 'mic-sound';

export interface ChapterNineInteractionResult {
  message: string;
  teleport?: Vector3;
  lookTarget?: Vector3;
  glassDoorOpened?: boolean;
}

export interface ChapterNineJumpscareEvent {
  animatronic: ChapterNineAnimatronicId;
  variant: HudJumpScareVariant;
  message: string;
}

export interface ChapterNineData {
  root: Group;
  colliders: CollisionBox[];
  spawn: Vector3;
  lookTarget: Vector3;
  shoulderCamera: Group;
  cameraScreenMaterial: MeshStandardMaterial;
  update(deltaSeconds: number, playerPosition: Vector3): void;
  interact(playerPosition: Vector3): ChapterNineInteractionResult;
  record(playerPosition: Vector3): string;
  cycleHeldItem(step: number): void;
  setHeldItem(item: ChapterNineHeldItem): void;
  getHeldItem(): ChapterNineHeldItem;
  consumeJumpscareEvent(): ChapterNineJumpscareEvent | null;
  getSupportedFloorY(position: Vector3): number | null;
  getPhaseLabel(): string;
  getPhaseRemaining(): number;
  getFootageCount(): number;
  getFootageTarget(): number;
  getPuzzleCount(): number;
  getPuzzleTarget(): number;
  isNight(): boolean;
  isEscapeUnlocked(): boolean;
  reset(): void;
}

interface ChapterNineFilmingTarget {
  id: string;
  label: string;
  position: Vector3;
  radius: number;
  filmed: boolean;
}

interface ChapterNinePuzzleStation {
  id: string;
  label: string;
  position: Vector3;
  solved: boolean;
  solvedMessage: string;
}

interface ChapterNineAnimatronic {
  id: ChapterNineAnimatronicId;
  name: string;
  root: Group;
  head: Group;
  jaw: Mesh;
  leftArm: Group;
  rightArm: Group;
  leftLeg: Group;
  rightLeg: Group;
  leftEye: Mesh;
  rightEye: Mesh;
  route: Vector3[];
  routeIndex: number;
  speed: number;
  chaseSpeed: number;
  phase: number;
  active: boolean;
  chaseTimer: number;
  scareCooldown: number;
}

const DAY_SECONDS = 5 * 60;
const NIGHT_SECONDS = 10 * 60;
const FOOTAGE_TARGET = 0;
const PUZZLE_TARGET = 0;
const BUILDING_WIDTH = 130;
const BUILDING_DEPTH = 96;
const BUILDING_CENTER_Z = -18;
const WALL_HEIGHT = 7.2;
const WALL_THICKNESS = 0.46;

function addCollider(
  colliders: CollisionBox[],
  centerX: number,
  centerZ: number,
  width: number,
  depth: number,
): CollisionBox {
  const collider = {
    centerX,
    centerZ,
    halfWidth: width / 2,
    halfDepth: depth / 2,
  };
  colliders.push(collider);
  return collider;
}

function makeCanvasMaterial(draw: (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void): MeshStandardMaterial {
  if (typeof document === 'undefined') {
    return new MeshStandardMaterial({ color: 0xdddddd, roughness: 0.75 });
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (context) {
    draw(context, canvas);
  }
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return new MeshStandardMaterial({
    map: texture,
    roughness: 0.7,
    metalness: 0.02,
  });
}

function createSignMaterial(title: string, subtitle: string, color = '#d9c382'): MeshStandardMaterial {
  return makeCanvasMaterial((context, canvas) => {
    context.fillStyle = '#17110c';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = color;
    context.lineWidth = 12;
    context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
    context.fillStyle = color;
    context.font = 'bold 52px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(title, canvas.width / 2, 104);
    context.font = 'bold 34px Arial';
    context.fillText(subtitle, canvas.width / 2, 166);
  });
}

function createComplexSignMaterial(): MeshStandardMaterial {
  return makeCanvasMaterial((context, canvas) => {
    context.fillStyle = '#0e0b09';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#f0c05a';
    context.lineWidth = 10;
    context.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
    context.fillStyle = '#f7d878';
    context.font = 'bold 46px Arial';
    context.textAlign = 'center';
    context.fillText("FREDDY'S PIZZA COMPLEX", canvas.width / 2, 58);
    const mascots = [
      ['#7a4a2c', 'FREDDY', 'bear'],
      ['#5743a8', 'BONNIE', 'rabbit'],
      ['#d7b230', 'CHICA', 'chicken'],
      ['#a3342a', 'FOXY', 'fox'],
      ['#d0a13a', 'GOLDEN', 'bear'],
    ] as const;
    mascots.forEach(([color, label, kind], index) => {
      const x = 104 + index * 76;
      context.save();
      context.translate(x, 126);
      context.fillStyle = color;
      context.beginPath();
      context.roundRect(-25, 35, 50, 42, 12);
      context.fill();
      context.fillStyle = '#d8b88c';
      context.beginPath();
      context.ellipse(0, 54, 17, 21, 0, 0, Math.PI * 2);
      context.fill();
      if (kind === 'bear') {
        context.fillStyle = '#111';
        context.beginPath();
        context.moveTo(-12, 38);
        context.lineTo(0, 48);
        context.lineTo(12, 38);
        context.lineTo(0, 42);
        context.closePath();
        context.fill();
      } else if (kind === 'chicken') {
        context.fillStyle = '#fff4d0';
        context.font = 'bold 12px Arial';
        context.fillText('EAT', 0, 60);
      } else if (kind === 'fox') {
        context.fillStyle = '#c2c5c7';
        context.fillRect(22, 45, 13, 8);
      }
      context.fillStyle = color;
      context.beginPath();
      context.roundRect(-31, -38, 62, 67, 20);
      context.fill();
      if (kind === 'rabbit') {
        [-16, 16].forEach((earX) => {
          context.fillStyle = color;
          context.beginPath();
          context.roundRect(earX - 7, -78, 14, 46, 7);
          context.fill();
          context.fillStyle = '#caa9d8';
          context.beginPath();
          context.roundRect(earX - 3, -70, 6, 31, 3);
          context.fill();
        });
      } else if (kind === 'fox') {
        [-22, 22].forEach((earX) => {
          context.fillStyle = color;
          context.beginPath();
          context.moveTo(earX, -60);
          context.lineTo(earX - 14, -32);
          context.lineTo(earX + 14, -32);
          context.closePath();
          context.fill();
        });
      } else {
        [-24, 24].forEach((earX) => {
          context.fillStyle = color;
          context.beginPath();
          context.arc(earX, -34, 13, 0, Math.PI * 2);
          context.fill();
        });
      }
      context.fillStyle = '#f7f0ce';
      context.beginPath();
      context.arc(-13, -7, 5, 0, Math.PI * 2);
      context.arc(13, -7, 5, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = kind === 'chicken' ? '#e88f26' : '#d8b88c';
      context.beginPath();
      if (kind === 'chicken') {
        context.moveTo(0, 6);
        context.lineTo(25, 18);
        context.lineTo(0, 30);
        context.lineTo(-25, 18);
        context.closePath();
      } else if (kind === 'fox') {
        context.ellipse(0, 16, 26, 15, 0, 0, Math.PI * 2);
      } else {
        context.ellipse(0, 17, 24, 16, 0, 0, Math.PI * 2);
      }
      context.fill();
      context.fillStyle = '#171717';
      context.beginPath();
      context.arc(0, 8, 4, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#f7f0ce';
      [-12, -4, 4, 12].forEach((toothX) => {
        context.fillRect(toothX - 2, 24, 4, 9);
      });
      if (kind === 'bear') {
        context.fillStyle = '#111';
        context.fillRect(-16, -59, 32, 11);
        context.fillRect(-10, -82, 20, 24);
      }
      context.restore();
      context.fillStyle = '#fff4d0';
      context.font = 'bold 17px Arial';
      context.fillText(label, x, 204);
    });
  });
}

function createPosterMaterial(name: string, slogan: string, color: string): MeshStandardMaterial {
  return makeCanvasMaterial((context, canvas) => {
    context.fillStyle = '#1d1d22';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
    context.fillStyle = 'rgba(255,255,255,0.16)';
    context.beginPath();
    context.arc(256, 95, 52, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#171717';
    context.beginPath();
    context.arc(235, 92, 7, 0, Math.PI * 2);
    context.arc(277, 92, 7, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#171717';
    context.lineWidth = 8;
    context.beginPath();
    context.arc(256, 112, 24, 0.15, Math.PI - 0.15);
    context.stroke();
    context.fillStyle = '#ffffff';
    context.font = 'bold 44px Arial';
    context.textAlign = 'center';
    context.fillText(name, 256, 176);
    context.font = 'bold 25px Arial';
    context.fillText(slogan, 256, 216);
  });
}

function createCheckeredFloorMaterial(): MeshStandardMaterial {
  if (typeof document === 'undefined') {
    return new MeshStandardMaterial({ color: 0x3a3a36, roughness: 0.72 });
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext('2d');
  if (context) {
    const tile = 64;
    for (let y = 0; y < canvas.height; y += tile) {
      for (let x = 0; x < canvas.width; x += tile) {
        const even = (Math.floor(x / tile) + Math.floor(y / tile)) % 2 === 0;
        const base = even ? 188 : 24;
        const edge = even ? 166 : 12;
        const gradient = context.createLinearGradient(x, y, x + tile, y + tile);
        gradient.addColorStop(0, `rgb(${base + 10}, ${base + 8}, ${base + 2})`);
        gradient.addColorStop(0.55, `rgb(${base}, ${base - 2}, ${Math.max(0, base - 8)})`);
        gradient.addColorStop(1, `rgb(${edge}, ${edge}, ${Math.max(0, edge - 4)})`);
        context.fillStyle = gradient;
        context.fillRect(x, y, tile, tile);
        context.fillStyle = 'rgba(255,255,255,0.06)';
        context.fillRect(x + 6, y + 5, tile - 12, 2);
        context.fillStyle = 'rgba(0,0,0,0.08)';
        context.fillRect(x + 5, y + tile - 8, tile - 10, 3);
      }
    }
    context.strokeStyle = 'rgba(0,0,0,0.34)';
    context.lineWidth = 5;
    for (let x = 0; x <= canvas.width; x += tile) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }
    for (let y = 0; y <= canvas.height; y += tile) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(12, 9);
  texture.needsUpdate = true;
  return new MeshStandardMaterial({
    map: texture,
    roughness: 0.58,
    metalness: 0.02,
  });
}

function createCameraScreenMaterial(): MeshStandardMaterial {
  return makeCanvasMaterial((context, canvas) => {
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#102534');
    gradient.addColorStop(0.55, '#1d4a56');
    gradient.addColorStop(1, '#081017');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = 'rgba(161, 229, 255, 0.55)';
    context.lineWidth = 8;
    context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
    context.strokeStyle = 'rgba(255,255,255,0.18)';
    context.lineWidth = 4;
    for (let x = 92; x < canvas.width; x += 92) {
      context.beginPath();
      context.moveTo(x, 24);
      context.lineTo(x, canvas.height - 24);
      context.stroke();
    }
    for (let y = 72; y < canvas.height; y += 72) {
      context.beginPath();
      context.moveTo(24, y);
      context.lineTo(canvas.width - 24, y);
      context.stroke();
    }
    context.fillStyle = 'rgba(255,255,255,0.78)';
    context.font = 'bold 26px Arial';
    context.textAlign = 'right';
    context.fillText('LIVE VIEW', canvas.width - 30, canvas.height - 28);
  });
}

function createBrickWallMaterial(repeatX = 4.5, repeatY = 2.8): MeshStandardMaterial {
  if (typeof document === 'undefined') {
    return new MeshStandardMaterial({ color: 0x6b4038, roughness: 0.88, metalness: 0.01 });
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#6b4038';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const brickWidth = 58;
    const brickHeight = 25;
    context.lineWidth = 3;
    for (let y = 0; y < canvas.height + brickHeight; y += brickHeight) {
      const row = Math.floor(y / brickHeight);
      const stagger = row % 2 === 0 ? 0 : brickWidth / 2;
      for (let x = -brickWidth; x < canvas.width + brickWidth; x += brickWidth) {
        const brickX = x + stagger;
        const shade = 1 + ((row + Math.floor(x / brickWidth)) % 4) * 0.04;
        context.fillStyle = `rgb(${Math.round(107 * shade)}, ${Math.round(64 * shade)}, ${Math.round(56 * shade)})`;
        context.fillRect(brickX + 2, y + 2, brickWidth - 4, brickHeight - 4);
        context.strokeStyle = '#a69a90';
        context.strokeRect(brickX + 1, y + 1, brickWidth - 2, brickHeight - 2);
      }
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.needsUpdate = true;
  return new MeshStandardMaterial({
    map: texture,
    color: 0xffffff,
    roughness: 0.88,
    metalness: 0.01,
  });
}

function createGrayWallBandMaterial(repeatX = 1, offsetX = 0): MeshStandardMaterial {
  if (typeof document === 'undefined') {
    return new MeshStandardMaterial({ color: 0x6f7376, roughness: 0.88 });
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#6f7376';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#5f6366';
    context.fillRect(0, 420, canvas.width, 92);
    context.fillStyle = '#9c1620';
    context.fillRect(0, 412, canvas.width, 10);
    context.fillRect(0, 496, canvas.width, 12);
    const checkerSize = 34;
    for (let y = 426; y < 494; y += checkerSize) {
      for (let x = 0; x < canvas.width; x += checkerSize) {
        const even = (Math.floor(x / checkerSize) + Math.floor(y / checkerSize)) % 2 === 0;
        context.fillStyle = even ? '#f1eee5' : '#1b1b1d';
        context.fillRect(x, y, checkerSize, checkerSize);
      }
    }
    context.strokeStyle = 'rgba(0,0,0,0.28)';
    context.lineWidth = 2;
    for (let x = 0; x <= canvas.width; x += checkerSize) {
      context.beginPath();
      context.moveTo(x, 426);
      context.lineTo(x, 494);
      context.stroke();
    }
    for (let y = 426; y <= 494; y += checkerSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(Math.max(0.05, repeatX), 1);
  texture.offset.set(offsetX, 0);
  texture.needsUpdate = true;
  return new MeshStandardMaterial({
    map: texture,
    roughness: 0.84,
    metalness: 0.01,
  });
}

export function createChapterNine(): ChapterNineData {
  const root = new Group();
  root.name = 'Chapter 9: Freddy Pizza Complex';
  root.visible = false;
  const colliders: CollisionBox[] = [];

  const spawn = new Vector3(0, GAME_CONFIG.player.height, BUILDING_CENTER_Z + BUILDING_DEPTH / 2 + 5);
  const lookTarget = new Vector3(0, 1.7, BUILDING_CENTER_Z + BUILDING_DEPTH / 2);

  const asphaltMaterial = new MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.96, metalness: 0.02 });
  const grassMaterial = new MeshStandardMaterial({ color: 0x2f7d32, roughness: 0.96, metalness: 0.0 });
  const treeTrunkMaterial = new MeshStandardMaterial({ color: 0x5b3821, roughness: 0.86 });
  const treeLeafMaterial = new MeshStandardMaterial({ color: 0x1f5f2d, roughness: 0.9 });
  const dirtyConcreteMaterial = new MeshStandardMaterial({ color: 0x6c6860, roughness: 0.94, metalness: 0.01 });
  const checkeredFloorMaterial = createCheckeredFloorMaterial();
  const carpetMaterial = new MeshStandardMaterial({ color: 0x371019, roughness: 0.9 });
  const createGrayMaterialFor = (runLength: number, height = WALL_HEIGHT, offsetX = 0): MeshStandardMaterial => (
    createGrayWallBandMaterial(Math.max(0.05, runLength / height), offsetX)
  );
  const ceilingMaterial = new MeshStandardMaterial({ color: 0x2a2927, roughness: 0.92, metalness: 0.04 });
  const roofMaterial = new MeshStandardMaterial({ color: 0x191715, roughness: 0.86, metalness: 0.12 });
  const woodMaterial = new MeshStandardMaterial({ color: 0x5b3b22, roughness: 0.82 });
  const metalMaterial = new MeshStandardMaterial({ color: 0x777b7b, roughness: 0.46, metalness: 0.36 });
  const blackMetalMaterial = new MeshStandardMaterial({ color: 0x111214, roughness: 0.5, metalness: 0.45 });
  const paintedLineMaterial = new MeshStandardMaterial({ color: 0xd7d0bb, roughness: 0.78 });
  const neonMaterial = new MeshBasicMaterial({ color: 0xffd45a });
  const glassMaterial = new MeshStandardMaterial({
    color: 0xa5d5e7,
    transparent: true,
    opacity: 0.32,
    roughness: 0.06,
    metalness: 0.02,
    side: DoubleSide,
  });
  const recordingMaterial = new MeshStandardMaterial({
    color: 0x0f1418,
    emissive: 0x04101a,
    emissiveIntensity: 0.2,
    roughness: 0.36,
    metalness: 0.18,
  });
  const cameraScreenMaterial = createCameraScreenMaterial();
  const redLightMaterial = new MeshBasicMaterial({ color: 0xff2733 });

  const addBox = (
    parent: Group,
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    material: MeshStandardMaterial | MeshBasicMaterial,
  ): Mesh => {
    const mesh = new Mesh(new BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  const addWall = (x: number, z: number, width: number, depth: number, material?: MeshStandardMaterial): void => {
    const wallMaterial = material ?? createGrayMaterialFor(Math.max(width, depth));
    addBox(root, width, WALL_HEIGHT, depth, x, WALL_HEIGHT / 2, z, wallMaterial);
    addCollider(colliders, x, z, width, depth);
  };

  const createBrickMaterialFor = (runLength: number, height = WALL_HEIGHT): MeshStandardMaterial => (
    createBrickWallMaterial(Math.max(1, runLength / 8.75), Math.max(1, height / 2.25))
  );

  const addBrickWall = (x: number, z: number, width: number, depth: number, runLength: number): void => {
    addWall(x, z, width, depth, createBrickMaterialFor(runLength));
  };

  const addAngledWall = (
    startX: number,
    startZ: number,
    endX: number,
    endZ: number,
    joinExtension = 0,
    textureOffset = 0,
    material?: MeshStandardMaterial,
  ): void => {
    const dx = endX - startX;
    const dz = endZ - startZ;
    const length = Math.hypot(dx, dz);
    const unitX = length > 0 ? dx / length : 1;
    const unitZ = length > 0 ? dz / length : 0;
    const extendedStartX = startX - unitX * joinExtension;
    const extendedStartZ = startZ - unitZ * joinExtension;
    const extendedEndX = endX + unitX * joinExtension;
    const extendedEndZ = endZ + unitZ * joinExtension;
    const extendedLength = length + joinExtension * 2;
    const wallMaterial = material ?? createGrayMaterialFor(extendedLength, WALL_HEIGHT, textureOffset - joinExtension / WALL_HEIGHT);
    const wall = new Mesh(new BoxGeometry(extendedLength, WALL_HEIGHT, WALL_THICKNESS), wallMaterial);
    wall.position.set((extendedStartX + extendedEndX) / 2, WALL_HEIGHT / 2, (extendedStartZ + extendedEndZ) / 2);
    wall.rotation.y = Math.atan2(-dz, dx);
    root.add(wall);
    colliders.push({
      centerX: wall.position.x,
      centerZ: wall.position.z,
      halfWidth: extendedLength / 2,
      halfDepth: WALL_THICKNESS / 2,
      rotationY: wall.rotation.y,
    });
  };

  const addCurvedWall = (
    startX: number,
    startZ: number,
    controlX: number,
    controlZ: number,
    endX: number,
    endZ: number,
    segments = 6,
    textureOffset = 0,
  ): void => {
    let previousX = startX;
    let previousZ = startZ;
    let traveled = 0;
    for (let index = 1; index <= segments; index += 1) {
      const t = index / segments;
      const inverseT = 1 - t;
      const x = inverseT * inverseT * startX + 2 * inverseT * t * controlX + t * t * endX;
      const z = inverseT * inverseT * startZ + 2 * inverseT * t * controlZ + t * t * endZ;
      const segmentLength = Math.hypot(x - previousX, z - previousZ);
      addAngledWall(previousX, previousZ, x, z, WALL_THICKNESS * 0.08, textureOffset + traveled / WALL_HEIGHT);
      traveled += segmentLength;
      previousX = x;
      previousZ = z;
    }
  };

  const addFloor = (x: number, z: number, width: number, depth: number, material: MeshStandardMaterial): void => {
    addBox(root, width, 0.12, depth, x, -0.06, z, material);
  };

  const addCheckeredFloor = (x: number, z: number, width: number, depth: number): void => {
    addBox(root, width, 0.08, depth, x, -0.035, z, checkeredFloorMaterial);
  };

  const preservedExteriorObjects: object[] = [];
  const emptyGround = addBox(root, 220, 0.12, 180, 0, -0.06, 8, grassMaterial);
  emptyGround.name = 'Chapter 9 empty ground';
  preservedExteriorObjects.push(emptyGround);
  addFloor(0, 44, 190, 112, asphaltMaterial);
  addFloor(0, 25, 146, 28, dirtyConcreteMaterial);
  addFloor(0, 82, 116, 42, asphaltMaterial);
  addBox(root, 30, 0.06, 21, 0, 0.02, 48, dirtyConcreteMaterial);
  addBox(root, 8.5, 0.08, 38, 0, 0.04, 70, dirtyConcreteMaterial);
  [-44, -22, 0, 22, 44].forEach((x) => {
    addBox(root, 0.38, 0.04, 32, x, 0.07, 82, paintedLineMaterial);
  });
  [65, 99].forEach((z) => {
    addBox(root, 100, 0.04, 0.36, 0, 0.075, z, paintedLineMaterial);
  });
  [-54, 54].forEach((x) => {
    addBox(root, 2.2, 0.55, 38, x, 0.24, 82, dirtyConcreteMaterial);
  });
  [-14, 14].forEach((x) => {
    addBox(root, 1.1, 0.9, 1.1, x, 0.45, 35, blackMetalMaterial);
    addBox(root, 0.22, 4.6, 0.22, x, 2.7, 35, blackMetalMaterial);
    addBox(root, 4.2, 0.18, 0.26, x, 5.0, 35, neonMaterial);
  });
  const addExteriorCar = (x: number, z: number, color: number, rotationY = 0): void => {
    const car = new Group();
    car.position.set(x, 0, z);
    car.rotation.y = rotationY;
    const carMaterial = new MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.18 });
    const body = new Mesh(new BoxGeometry(4.6, 0.9, 2.1), carMaterial);
    body.position.y = 0.62;
    const cabin = new Mesh(new BoxGeometry(2.2, 0.82, 1.72), glassMaterial);
    cabin.position.set(-0.25, 1.25, 0);
    const wheels = [
      [-1.55, -1.02],
      [1.55, -1.02],
      [-1.55, 1.02],
      [1.55, 1.02],
    ].map(([wheelX, wheelZ]) => {
      const wheel = new Mesh(new CylinderGeometry(0.42, 0.42, 0.32, 16), blackMetalMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wheelX, 0.38, wheelZ);
      return wheel;
    });
    car.add(body, cabin, ...wheels);
    root.add(car);
  };
  addExteriorCar(-30, 82, 0x263a5c, 0);
  addExteriorCar(12, 82, 0x5a2321, 0);
  addExteriorCar(36, 68, 0x1d4d38, Math.PI / 2);
  [-6, 6].forEach((x) => {
    addBox(root, 0.45, 1.05, 0.45, x, 0.52, 37, new MeshStandardMaterial({ color: 0xb28b24, roughness: 0.66, metalness: 0.12 }));
  });

  const addTree = (x: number, z: number, scale = 1): void => {
    const tree = new Group();
    tree.position.set(x, 0, z);
    const trunk = new Mesh(new CylinderGeometry(0.32 * scale, 0.46 * scale, 3.2 * scale, 10), treeTrunkMaterial);
    trunk.position.y = 1.6 * scale;
    const lowerLeaves = new Mesh(new ConeGeometry(1.8 * scale, 3.2 * scale, 12), treeLeafMaterial);
    lowerLeaves.position.y = 4.0 * scale;
    const upperLeaves = new Mesh(new ConeGeometry(1.35 * scale, 2.6 * scale, 12), treeLeafMaterial);
    upperLeaves.position.y = 5.5 * scale;
    tree.add(trunk, lowerLeaves, upperLeaves);
    root.add(tree);
    preservedExteriorObjects.push(tree);
  };
  [
    [-82, -76, 1.05], [-54, -84, 0.9], [-18, -86, 1.15], [24, -86, 0.95], [58, -78, 1.1],
    [-88, -46, 0.9], [-88, -12, 1.12], [-88, 24, 0.98], [-78, 58, 1.06],
    [88, -48, 1.08], [88, -14, 0.92], [88, 22, 1.0], [78, 58, 1.14],
    [-48, 68, 1.02], [-18, 72, 0.9], [22, 72, 1.1], [52, 68, 0.96],
  ].forEach(([x, z, scale]) => addTree(x, z, scale));

  const shellStartChildIndex = root.children.length;
  addCheckeredFloor(0, BUILDING_CENTER_Z, BUILDING_WIDTH, BUILDING_DEPTH);
  const wallJoinOverlap = 0;
  addBrickWall(0, BUILDING_CENTER_Z - BUILDING_DEPTH / 2, BUILDING_WIDTH + wallJoinOverlap, WALL_THICKNESS, BUILDING_WIDTH + wallJoinOverlap);
  addBrickWall(-BUILDING_WIDTH / 2, BUILDING_CENTER_Z, WALL_THICKNESS, BUILDING_DEPTH + wallJoinOverlap, BUILDING_DEPTH + wallJoinOverlap);
  addBrickWall(BUILDING_WIDTH / 2, BUILDING_CENTER_Z, WALL_THICKNESS, BUILDING_DEPTH + wallJoinOverlap, BUILDING_DEPTH + wallJoinOverlap);
  addBrickWall(-33.535, BUILDING_CENTER_Z + BUILDING_DEPTH / 2, 62.93, WALL_THICKNESS, 62.93);
  addBrickWall(33.535, BUILDING_CENTER_Z + BUILDING_DEPTH / 2, 62.93, WALL_THICKNESS, 62.93);
  addBox(root, 4.14, 3.39, WALL_THICKNESS, 0, 5.505, BUILDING_CENTER_Z + BUILDING_DEPTH / 2, createBrickMaterialFor(4.14, 3.39));
  const frontDoorCollider = addCollider(colliders, 0, BUILDING_CENTER_Z + BUILDING_DEPTH / 2, 11, WALL_THICKNESS);
  const customAngledWallLength = Math.hypot(-14.16 - -9.07, 23.96 - 29.40);
  const customUpperFillerLength = Math.hypot(-9.07 - -8.93, 29.40 - 29.65);
  addCurvedWall(-8.93, 29.65, -8.96, 29.51, -9.07, 29.40, 4, -customUpperFillerLength / WALL_HEIGHT);
  addAngledWall(-9.07, 29.40, -14.16, 23.96);
  addWall(-14.59, 20.005, WALL_THICKNESS, 6.05);
  addWall(-14.6, 16.87, WALL_THICKNESS, 0.28);
  addWall(-14.575, 13.83, WALL_THICKNESS, 5.86);
  addCurvedWall(-14.16, 23.96, -14.59, 23.5, -14.59, 23.03, 6, customAngledWallLength / WALL_HEIGHT);
  addAngledWall(4.33, 29.67, 4.39, 14.98);
  addAngledWall(-5.77, 14.95, -9.75, 6.94);
  addAngledWall(-6.16, 14.82, -9.09, 15.05);
  const shellColliders = colliders.slice();

  const shellObjects = [
    ...preservedExteriorObjects,
    ...root.children.slice(shellStartChildIndex),
  ];
  const roof = addBox(root, BUILDING_WIDTH + 2.2, 0.42, BUILDING_DEPTH + 2.2, 0, WALL_HEIGHT + 0.22, BUILDING_CENTER_Z, roofMaterial);
  const ceiling = addBox(root, BUILDING_WIDTH - 2.2, 0.12, BUILDING_DEPTH - 2.2, 0, WALL_HEIGHT - 0.08, BUILDING_CENTER_Z, ceilingMaterial);
  shellObjects.push(roof, ceiling);
  [-42, -14, 14, 42].forEach((x) => {
    shellObjects.push(addBox(root, 0.36, 0.26, BUILDING_DEPTH - 5, x, WALL_HEIGHT - 0.32, BUILDING_CENTER_Z, blackMetalMaterial));
  });
  [-52, -26, 0, 26, 52].forEach((x) => {
    [25, 5, -15, -35, -55].forEach((z) => {
      shellObjects.push(addBox(root, 5.8, 0.08, 0.8, x, WALL_HEIGHT - 0.54, z, neonMaterial));
    });
  });

  const doorFrameMaterial = new MeshStandardMaterial({ color: 0x2c211c, roughness: 0.68, metalness: 0.12 });
  const doorGlassMaterial = new MeshStandardMaterial({
    color: 0xbce8f5,
    transparent: true,
    opacity: 0.44,
    roughness: 0.05,
    metalness: 0.02,
    side: DoubleSide,
  });
  const makeEntranceDoor = (hingeX: number, side: -1 | 1): Group => {
    const door = new Group();
    door.position.set(hingeX, 0, BUILDING_CENTER_Z + BUILDING_DEPTH / 2 + 0.12);
    const panelOffsetX = side * 0.93;
    const glassPane = new Mesh(new BoxGeometry(1.52, 3.08, 0.06), doorGlassMaterial);
    glassPane.position.set(panelOffsetX, 1.84, 0);
    const topRail = new Mesh(new BoxGeometry(1.86, 0.16, 0.12), doorFrameMaterial);
    topRail.position.set(panelOffsetX, 3.45, 0);
    const bottomRail = topRail.clone();
    bottomRail.position.y = 0.17;
    const innerRail = new Mesh(new BoxGeometry(0.14, 3.38, 0.12), doorFrameMaterial);
    innerRail.position.set(panelOffsetX + side * 0.86, 1.81, 0);
    const outerRail = innerRail.clone();
    outerRail.position.x = panelOffsetX - side * 0.86;
    const handle = new Mesh(new BoxGeometry(0.1, 0.36, 0.16), metalMaterial);
    handle.position.set(panelOffsetX + side * 0.58, 1.82, 0.13);
    door.add(glassPane, topRail, bottomRail, innerRail, outerRail, handle);
    root.add(door);
    return door;
  };
  const doorwayFrameLeft = addBox(root, 0.18, 3.72, 0.18, -1.98, 1.86, BUILDING_CENTER_Z + BUILDING_DEPTH / 2 + 0.1, doorFrameMaterial);
  const doorwayFrameRight = addBox(root, 0.18, 3.72, 0.18, 1.98, 1.86, BUILDING_CENTER_Z + BUILDING_DEPTH / 2 + 0.1, doorFrameMaterial);
  const doorwayFrameTop = addBox(root, 4.14, 0.18, 0.18, 0, 3.72, BUILDING_CENTER_Z + BUILDING_DEPTH / 2 + 0.1, doorFrameMaterial);
  const leftDoor = makeEntranceDoor(-1.86, 1);
  const rightDoor = makeEntranceDoor(1.86, -1);
  shellObjects.push(doorwayFrameLeft, doorwayFrameRight, doorwayFrameTop, leftDoor, rightDoor);

  const sign = new Mesh(new PlaneGeometry(40, 10), createComplexSignMaterial());
  sign.position.set(0, 9.0, BUILDING_CENTER_Z + BUILDING_DEPTH / 2 + 0.28);
  root.add(sign);
  const closedSign = new Mesh(new PlaneGeometry(8, 3), createSignMaterial('CLOSED', 'KEEP OUT', '#cf2a2a'));
  closedSign.position.set(17, 3.7, BUILDING_CENTER_Z + BUILDING_DEPTH / 2 + 0.3);
  root.add(closedSign);

  const glassLeft = new Mesh(new PlaneGeometry(12, 5.2), glassMaterial);
  glassLeft.position.set(-12, 2.9, BUILDING_CENTER_Z + BUILDING_DEPTH / 2 + 0.32);
  const glassRight = glassLeft.clone();
  glassRight.position.x = 12;
  root.add(glassLeft, glassRight);
  const crackMaterial = new MeshBasicMaterial({ color: 0xe6f8ff, transparent: true, opacity: 0.65, side: DoubleSide });
  [-12, 12].forEach((x, paneIndex) => {
    for (let crack = 0; crack < 6; crack += 1) {
      const shard = new Mesh(new BoxGeometry(0.055, 1.4 + crack * 0.18, 0.03), crackMaterial);
      shard.position.set(x + (crack - 2.5) * 0.52, 3.1 + Math.sin(crack) * 0.6, BUILDING_CENTER_Z + BUILDING_DEPTH / 2 + 0.36);
      shard.rotation.z = (crack - 2.5) * 0.35 + paneIndex * 0.2;
      root.add(shard);
    }
  });

  const addWallPlaque = (label: string, x: number, y: number, z: number, rotationY = 0, width = 8): void => {
    const plaque = new Mesh(new PlaneGeometry(width, 1.35), createSignMaterial(label.toUpperCase(), '', '#c7b073'));
    plaque.position.set(x, y, z);
    plaque.rotation.y = rotationY;
    root.add(plaque);
  };

  const rooms = [
    [-42, 10, 28, 28, 'Arcade'],
    [0, 10, 42, 28, 'Main Dining'],
    [42, 10, 28, 28, 'Pirate Cove'],
    [-42, -22, 28, 30, 'Backstage'],
    [0, -24, 32, 34, 'Main Stage'],
    [42, -24, 28, 34, 'Kitchen'],
    [-42, -56, 28, 20, 'Security'],
    [0, -58, 32, 18, 'Storage'],
    [42, -56, 28, 20, 'Bathrooms'],
  ] as const;
  rooms.forEach(([roomX, roomZ, , depth, label]) => {
    addWallPlaque(label, roomX, 4.35, roomZ + depth / 2 - 0.3);
  });
  addWallPlaque('BOOKING', -24, 3.35, 31.72, 0, 7.2);
  addWallPlaque('PRIZES', 24, 3.35, 31.72, 0, 7.2);
  addWallPlaque('PARTS', -64.72, 3.35, -8, Math.PI / 2, 7.2);
  addWallPlaque('SECURITY', -64.72, 3.35, -42, Math.PI / 2, 7.2);
  addWallPlaque('STAFF KITCHEN', 64.72, 3.35, -8, -Math.PI / 2, 8.8);
  addWallPlaque('RESTROOMS', 64.72, 3.35, -42, -Math.PI / 2, 7.2);
  addWallPlaque('MAIN STAGE', 0, 3.35, -7.72, 0, 8.4);

  addWall(-21, -6, WALL_THICKNESS, 64);
  addWall(21, -6, WALL_THICKNESS, 64);
  addWall(-52, -6, 25, WALL_THICKNESS);
  addWall(-32, -6, 17, WALL_THICKNESS);
  addWall(-10, -6, 13, WALL_THICKNESS);
  addWall(10, -6, 13, WALL_THICKNESS);
  addWall(32, -6, 17, WALL_THICKNESS);
  addWall(52, -6, 25, WALL_THICKNESS);
  addWall(-42, -38, 28, WALL_THICKNESS);
  addWall(0, -42, 32, WALL_THICKNESS);
  addWall(42, -42, 28, WALL_THICKNESS);
  addWall(-21, -57, WALL_THICKNESS, 30);
  addWall(21, -57, WALL_THICKNESS, 30);
  addFloor(42, 10, 30, 30, carpetMaterial);

  const addDiningTable = (x: number, z: number): void => {
    addBox(root, 8.6, 0.28, 2.6, x, 0.82, z, woodMaterial);
    for (let i = -3; i <= 3; i += 2) {
      addBox(root, 0.35, 0.68, 0.35, x + i, 0.34, z - 0.92, woodMaterial);
      addBox(root, 0.35, 0.68, 0.35, x + i, 0.34, z + 0.92, woodMaterial);
      addBox(root, 0.62, 0.24, 0.62, x + i, 1.04, z - 0.38, new MeshStandardMaterial({ color: 0xd9d1bc, roughness: 0.7 }));
      addBox(root, 0.3, 0.46, 0.3, x + i + 0.38, 1.24, z + 0.32, new MeshStandardMaterial({ color: 0xaa1e2c, roughness: 0.6 }));
    }
    addCollider(colliders, x, z, 9, 3);
  };
  [-10, 10].forEach((x) => addDiningTable(x, 4));

  const addLobbyBench = (x: number, z: number, rotationY = 0): void => {
    const bench = new Group();
    bench.position.set(x, 0, z);
    bench.rotation.y = rotationY;
    const seat = new Mesh(new BoxGeometry(6.2, 0.26, 1.1), woodMaterial);
    seat.position.y = 0.82;
    const back = new Mesh(new BoxGeometry(6.2, 1.0, 0.22), woodMaterial);
    back.position.set(0, 1.28, -0.55);
    [-2.6, 2.6].forEach((legX) => {
      const leg = new Mesh(new BoxGeometry(0.28, 0.78, 0.28), blackMetalMaterial);
      leg.position.set(legX, 0.38, 0.3);
      bench.add(leg);
    });
    bench.add(seat, back);
    root.add(bench);
    addCollider(colliders, x, z, rotationY === 0 ? 6.5 : 1.4, rotationY === 0 ? 1.5 : 6.5);
  };
  addLobbyBench(-38, 30, 0);
  addLobbyBench(38, 30, 0);
  addLobbyBench(-52, 13, Math.PI / 2);
  addLobbyBench(52, 13, -Math.PI / 2);

  const addArcade = (x: number, z: number, color: number): void => {
    const machine = new Group();
    machine.position.set(x, 0, z);
    const mat = new MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 });
    const body = new Mesh(new BoxGeometry(2.2, 3.1, 1.2), mat);
    body.position.y = 1.55;
    const screen = new Mesh(new BoxGeometry(1.55, 0.95, 0.08), new MeshStandardMaterial({ color: 0x06090f, emissive: color, emissiveIntensity: 0.16 }));
    screen.position.set(0, 2.08, 0.64);
    const controls = new Mesh(new BoxGeometry(1.75, 0.16, 0.52), blackMetalMaterial);
    controls.position.set(0, 1.24, 0.73);
    machine.add(body, screen, controls);
    root.add(machine);
    addCollider(colliders, x, z, 2.5, 1.55);
  };
  [-53, -47, -41, -35, -29].forEach((x, index) => addArcade(x, 21, [0x5e2b91, 0x1961a5, 0xa02535, 0x1b7a53, 0x9b7424][index]));

  const stage = addBox(root, 30, 1.1, 11, 0, 0.55, -36, new MeshStandardMaterial({ color: 0x2f1720, roughness: 0.82 }));
  stage.name = 'Chapter 9 preserved stage';
  addCollider(colliders, 0, -36, 31, 12);
  const curtain = addBox(root, 32, 6.4, 0.28, 0, 3.5, -41.6, new MeshStandardMaterial({ color: 0x5d111b, roughness: 0.9 }));
  curtain.name = 'Chapter 9 preserved stage curtain';
  const addStageDrums = (): void => {
    const drumMaterial = new MeshStandardMaterial({ color: 0x8d1d22, roughness: 0.55, metalness: 0.12 });
    [-1.2, 1.2].forEach((x) => {
      const drum = new Mesh(new CylinderGeometry(0.52, 0.52, 0.5, 18), drumMaterial);
      drum.rotation.x = Math.PI / 2;
      drum.position.set(x, 1.28, -33.2);
      root.add(drum);
    });
    const bass = new Mesh(new CylinderGeometry(0.82, 0.82, 0.56, 22), drumMaterial);
    bass.rotation.x = Math.PI / 2;
    bass.position.set(0, 1.22, -32.2);
    root.add(bass);
    [-1.8, 1.8].forEach((x) => {
      const cymbal = new Mesh(new CylinderGeometry(0.65, 0.78, 0.05, 22), metalMaterial);
      cymbal.position.set(x, 2.02, -32.8);
      root.add(cymbal);
      addBox(root, 0.06, 0.86, 0.06, x, 1.6, -32.8, blackMetalMaterial);
    });
  };
  const addGuitarStand = (x: number, z: number): void => {
    addBox(root, 0.08, 1.65, 0.08, x, 1.76, z, blackMetalMaterial);
    const guitarBody = new Mesh(new SphereGeometry(0.36, 18, 12), new MeshStandardMaterial({ color: 0x2b4d9a, roughness: 0.45, metalness: 0.18 }));
    guitarBody.scale.set(0.75, 1.05, 0.18);
    guitarBody.position.set(x, 1.44, z + 0.1);
    const neck = new Mesh(new BoxGeometry(0.12, 1.15, 0.08), woodMaterial);
    neck.position.set(x, 2.12, z + 0.1);
    root.add(guitarBody, neck);
  };
  const addMicStand = (x: number, z: number): void => {
    addBox(root, 0.06, 1.8, 0.06, x, 1.86, z, blackMetalMaterial);
    const mic = new Mesh(new CylinderGeometry(0.09, 0.09, 0.42, 14), metalMaterial);
    mic.rotation.z = Math.PI / 2;
    mic.position.set(x, 2.76, z + 0.12);
    root.add(mic);
  };
  addStageDrums();
  addGuitarStand(-8.8, -32.2);
  addMicStand(8.8, -32.2);

  const addKitchenFixture = (x: number, z: number, width: number, depth: number, label: string): void => {
    addBox(root, width, 1.45, depth, x, 0.72, z, metalMaterial);
    addBox(root, width, 0.16, depth, x, 1.54, z, new MeshStandardMaterial({ color: 0x9da3a2, roughness: 0.42, metalness: 0.42 }));
    addCollider(colliders, x, z, width + 0.2, depth + 0.2);
    const marker = new Mesh(new PlaneGeometry(width * 0.8, 0.65), createSignMaterial(label, '', '#d3d3d3'));
    marker.position.set(x, 2.35, z + depth / 2 + 0.04);
    root.add(marker);
  };
  addKitchenFixture(33, -18, 10, 2.6, 'STOVES');
  addKitchenFixture(51, -18, 10, 2.6, 'PREP');
  addKitchenFixture(33, -31, 8, 2.8, 'SINK');
  addKitchenFixture(51, -31, 8, 2.8, 'FREEZER');
  [-3, -1, 1, 3].forEach((offset) => {
    const cleaver = new Mesh(new BoxGeometry(0.35, 1.25, 0.08), metalMaterial);
    cleaver.position.set(56 + offset, 2.8, -8.2);
    cleaver.rotation.z = offset * 0.15;
    root.add(cleaver);
  });

  const addShelf = (x: number, z: number, width: number): void => {
    addBox(root, width, 0.18, 1.2, x, 1.0, z, woodMaterial);
    addBox(root, width, 0.18, 1.2, x, 2.05, z, woodMaterial);
    addBox(root, width, 0.18, 1.2, x, 3.1, z, woodMaterial);
    for (let i = 0; i < 6; i += 1) {
      addBox(root, 0.65, 0.58, 0.55, x - width / 2 + 0.7 + i * (width - 1.4) / 5, 1.38 + (i % 3) * 1.05, z, metalMaterial);
    }
    addCollider(colliders, x, z, width + 0.2, 1.4);
  };
  addShelf(-42, -28, 16);
  addShelf(0, -58, 18);
  addKitchenFixture(-47, -56, 9, 2.2, 'DESK');
  addKitchenFixture(-36, -56, 6, 2.2, 'MONITORS');

  const addBathroomStall = (x: number, z: number): void => {
    addBox(root, 3.2, 2.9, 0.22, x, 1.45, z, blackMetalMaterial);
    addBox(root, 0.22, 2.9, 3.8, x - 1.6, 1.45, z + 1.8, blackMetalMaterial);
    addBox(root, 0.22, 2.9, 3.8, x + 1.6, 1.45, z + 1.8, blackMetalMaterial);
    addCollider(colliders, x, z, 3.5, 0.4);
  };
  [36, 42, 48].forEach((x) => addBathroomStall(x, -61));

  const addCounter = (x: number, z: number, width: number, label: string): void => {
    addBox(root, width, 1.35, 2.2, x, 0.68, z, woodMaterial);
    addBox(root, width, 0.14, 2.36, x, 1.42, z, new MeshStandardMaterial({ color: 0x8d6a42, roughness: 0.62 }));
    const counterSign = new Mesh(new PlaneGeometry(Math.min(width, 14), 1.2), createSignMaterial(label, '', '#f0c05a'));
    counterSign.position.set(x, 2.25, z + 1.15);
    root.add(counterSign);
    addCollider(colliders, x, z, width + 0.4, 2.6);
  };
  addCounter(-23, 27, 18, 'CHECK-IN');
  addCounter(23, 27, 16, 'PRIZE DESK');
  [-29, -23, -17].forEach((x) => {
    addBox(root, 0.18, 1.1, 0.18, x, 0.55, 17, blackMetalMaterial);
    addBox(root, 0.18, 1.1, 0.18, x + 3, 0.55, 17, blackMetalMaterial);
    addBox(root, 3.3, 0.12, 0.12, x + 1.5, 1.08, 17, new MeshStandardMaterial({ color: 0x8d1020, roughness: 0.7 }));
  });
  [18, 22, 26, 30].forEach((x, index) => {
    addBox(root, 1.1, 1.1, 1.1, x, 1.1 + index * 0.08, 25.2, new MeshStandardMaterial({ color: [0xc03048, 0x2458a8, 0xf0c63a, 0x35a05a][index], roughness: 0.62 }));
  });

  const posters = [
    ['Bonnie', "Let's rock!", '#6f54c9', -60, 5, Math.PI / 2],
    ['Chica', "Let's eat!", '#d9b635', 60, 4, -Math.PI / 2],
    ['Freddy', 'Showtime!', '#8d5a33', -10, 39, 0],
    ['Foxy', 'Ahoy!', '#b23a30', 36, 38, 0],
    ['Golden Freddy', 'Do not stare.', '#d5a847', -5, -48, 0],
  ] as const;
  posters.forEach(([name, slogan, color, x, z, rot]) => {
    const poster = new Mesh(new PlaneGeometry(5.5, 3.2), createPosterMaterial(name, slogan, color));
    poster.position.set(x, 2.75, z);
    poster.rotation.y = rot;
    root.add(poster);
  });

  const ventMaterial = new MeshStandardMaterial({ color: 0x32373a, roughness: 0.62, metalness: 0.32 });
  const ventPoints = [
    new Vector3(-52, 3.1, -52),
    new Vector3(-52, 3.1, -22),
    new Vector3(-20, 3.1, -22),
    new Vector3(20, 3.1, -22),
    new Vector3(52, 3.1, -22),
    new Vector3(52, 3.1, 20),
  ];
  for (let i = 0; i < ventPoints.length - 1; i += 1) {
    const a = ventPoints[i];
    const b = ventPoints[i + 1];
    const center = a.clone().lerp(b, 0.5);
    const width = Math.abs(a.x - b.x) || 2.4;
    const depth = Math.abs(a.z - b.z) || 2.4;
    addBox(root, width + 2.2, 1.25, depth + 2.2, center.x, 3.55, center.z, ventMaterial);
    addBox(root, width + 1.2, 0.08, depth + 1.2, center.x, 4.21, center.z, blackMetalMaterial);
  }
  const ventEntries: { label: string; position: Vector3; target: Vector3 }[] = [];

  const filmingTargets: ChapterNineFilmingTarget[] = [];

  const puzzleStations: ChapterNinePuzzleStation[] = [];

  const makeAnimatronic = (
    id: ChapterNineAnimatronicId,
    name: string,
    color: number,
    start: Vector3,
    route: Vector3[],
    variant: 'bear' | 'rabbit' | 'chicken' | 'fox',
  ): ChapterNineAnimatronic => {
    const model = new Group();
    model.position.copy(start);
    const bodyMaterial = new MeshStandardMaterial({ color, roughness: 0.46, metalness: id === 'golden-freddy' ? 0.42 : 0.24 });
    const bellyMaterial = new MeshStandardMaterial({ color: 0xd4b486, roughness: 0.58, metalness: 0.08 });
    const toothMaterial = new MeshStandardMaterial({ color: 0xf2ead0, roughness: 0.38 });
    const darkMaterial = new MeshStandardMaterial({ color: 0x151515, roughness: 0.58, metalness: 0.28 });
    const body = new Mesh(new SphereGeometry(0.84, 28, 18), bodyMaterial);
    body.scale.set(0.68, 1.18, 0.5);
    body.position.y = 1.53;
    const belly = new Mesh(new SphereGeometry(0.52, 22, 14), bellyMaterial);
    belly.scale.set(0.78, 1.08, 0.22);
    belly.position.set(0, 1.38, 0.48);
    const chestPlate = new Mesh(new BoxGeometry(0.78, 0.24, 0.1), darkMaterial);
    chestPlate.position.set(0, 2.06, 0.54);
    chestPlate.rotation.z = Math.PI / 4;
    const chestPlateB = chestPlate.clone();
    chestPlateB.rotation.z = -Math.PI / 4;
    const neck = new Mesh(new CylinderGeometry(0.26, 0.32, 0.34, 14), metalMaterial);
    neck.position.y = 2.58;
    const head = new Group();
    head.position.y = 2.95;
    const skull = new Mesh(new SphereGeometry(0.7, 30, 18), bodyMaterial);
    skull.scale.set(variant === 'fox' ? 0.88 : 0.98, 0.98, 0.82);
    const muzzle = new Mesh(new SphereGeometry(0.36, 18, 12), variant === 'chicken' ? bodyMaterial : bellyMaterial);
    muzzle.scale.set(variant === 'fox' ? 1.35 : 1.05, 0.58, variant === 'fox' ? 1.12 : 0.82);
    muzzle.position.set(0, -0.12, 0.58);
    const nose = new Mesh(new SphereGeometry(0.09, 12, 8), darkMaterial);
    nose.scale.set(1.25, 0.7, 0.72);
    nose.position.set(0, -0.03, variant === 'fox' ? 1.0 : 0.86);
    const jaw = new Mesh(new SphereGeometry(0.34, 18, 10), variant === 'chicken' ? new MeshStandardMaterial({ color: 0xe88922, roughness: 0.62 }) : bodyMaterial);
    jaw.scale.set(1.2, 0.38, 0.72);
    jaw.position.set(0, -0.43, 0.49);
    const eyeMaterial = new MeshBasicMaterial({ color: id === 'golden-freddy' ? 0xff2733 : 0xf7f1ca });
    const leftEye = new Mesh(new SphereGeometry(0.09, 12, 8), eyeMaterial);
    leftEye.position.set(-0.27, 0.12, 0.6);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.27;
    const leftBrow = new Mesh(new BoxGeometry(0.25, 0.06, 0.06), darkMaterial);
    leftBrow.position.set(-0.27, 0.29, 0.58);
    leftBrow.rotation.z = 0.22;
    const rightBrow = leftBrow.clone();
    rightBrow.position.x = 0.27;
    rightBrow.rotation.z = -0.22;
    head.add(skull, muzzle, nose, jaw, leftEye, rightEye, leftBrow, rightBrow);
    [-0.28, -0.14, 0, 0.14, 0.28].forEach((x) => {
      const topTooth = new Mesh(new BoxGeometry(0.055, 0.18, 0.055), toothMaterial);
      topTooth.position.set(x, -0.2, 0.79);
      const bottomTooth = new Mesh(new BoxGeometry(0.055, 0.14, 0.055), toothMaterial);
      bottomTooth.position.set(x, -0.05, 0.22);
      jaw.add(bottomTooth);
      head.add(topTooth);
    });
    if (variant === 'rabbit') {
      [-0.24, 0.24].forEach((x) => {
        const ear = new Mesh(new BoxGeometry(0.25, 1.35, 0.18), bodyMaterial);
        ear.position.set(x, 0.9, 0);
        ear.rotation.z = x * 0.45;
        const inner = new Mesh(new BoxGeometry(0.12, 0.92, 0.04), bellyMaterial);
        inner.position.set(0, 0, 0.1);
        ear.add(inner);
        head.add(ear);
      });
    } else if (variant === 'chicken') {
      const beakMaterial = new MeshStandardMaterial({ color: 0xe88922, roughness: 0.62 });
      const beak = new Mesh(new ConeGeometry(0.34, 0.72, 4), beakMaterial);
      beak.position.set(0, -0.06, 0.94);
      beak.rotation.x = Math.PI / 2;
      const bib = new Mesh(new PlaneGeometry(1.05, 0.78), createSignMaterial('LET', 'EAT', '#f6e68a'));
      bib.position.set(0, 1.44, 0.6);
      const feather = new Mesh(new ConeGeometry(0.18, 0.45, 8), bodyMaterial);
      feather.position.set(0, 0.68, 0);
      feather.rotation.z = 0.18;
      model.add(bib);
      head.add(beak, feather);
    } else if (variant === 'fox') {
      const snout = new Mesh(new ConeGeometry(0.32, 0.78, 12), bodyMaterial);
      snout.position.set(0, -0.06, 0.88);
      snout.rotation.x = Math.PI / 2;
      const eyePatch = new Mesh(new BoxGeometry(0.3, 0.18, 0.04), darkMaterial);
      eyePatch.position.set(-0.24, 0.12, 0.63);
      const hook = new Mesh(new TorusGeometry(0.18, 0.035, 8, 16, Math.PI * 1.35), metalMaterial);
      hook.position.set(0.98, 1.0, 0.12);
      hook.rotation.z = Math.PI;
      model.add(hook);
      head.add(snout, eyePatch);
    } else {
      const hat = new Mesh(new CylinderGeometry(0.32, 0.32, 0.38, 18), darkMaterial);
      hat.position.y = 0.62;
      const brim = new Mesh(new CylinderGeometry(0.48, 0.48, 0.08, 18), darkMaterial);
      brim.position.y = 0.42;
      [-0.45, 0.45].forEach((x) => {
        const ear = new Mesh(new SphereGeometry(0.2, 14, 10), bodyMaterial);
        ear.position.set(x, 0.31, -0.03);
        head.add(ear);
      });
      head.add(hat, brim);
    }
    const leftArm = new Group();
    leftArm.position.set(-0.76, 2.0, 0);
    const rightArm = new Group();
    rightArm.position.set(0.76, 2.0, 0);
    const makeLimb = (length = 1.45): Group => {
      const limb = new Group();
      const upper = new Mesh(new CylinderGeometry(0.15, 0.18, length * 0.48, 14), bodyMaterial);
      upper.position.y = -length * 0.22;
      const joint = new Mesh(new SphereGeometry(0.2, 14, 10), metalMaterial);
      joint.position.y = -length * 0.48;
      const lower = new Mesh(new CylinderGeometry(0.135, 0.165, length * 0.48, 14), bodyMaterial);
      lower.position.y = -length * 0.74;
      const hand = new Mesh(new SphereGeometry(0.2, 16, 10), bodyMaterial);
      hand.scale.set(1.18, 0.72, 1.02);
      hand.position.y = -length;
      limb.add(upper, joint, lower, hand);
      [-0.14, 0, 0.14].forEach((fingerX) => {
        const finger = new Mesh(new BoxGeometry(0.055, 0.2, 0.06), toothMaterial);
        finger.position.set(fingerX, -length - 0.12, 0.08);
        limb.add(finger);
      });
      return limb;
    };
    leftArm.add(makeLimb(1.55));
    rightArm.add(makeLimb(1.55));
    const leftLeg = new Group();
    leftLeg.position.set(-0.3, 0.82, 0);
    const rightLeg = new Group();
    rightLeg.position.set(0.3, 0.82, 0);
    leftLeg.add(makeLimb(1.3));
    rightLeg.add(makeLimb(1.3));
    const leftFoot = new Mesh(new SphereGeometry(0.3, 16, 10), bodyMaterial);
    leftFoot.scale.set(1.0, 0.38, 1.38);
    leftFoot.position.set(-0.3, 0.13, 0.24);
    const rightFoot = leftFoot.clone();
    rightFoot.position.x = 0.3;
    const leftShoulder = new Mesh(new SphereGeometry(0.22, 16, 10), metalMaterial);
    leftShoulder.position.set(-0.74, 2.06, 0);
    const rightShoulder = leftShoulder.clone();
    rightShoulder.position.x = 0.74;
    model.add(body, belly, chestPlate, chestPlateB, neck, head, leftArm, rightArm, leftLeg, rightLeg, leftFoot, rightFoot, leftShoulder, rightShoulder);
    root.add(model);
    return {
      id,
      name,
      root: model,
      head,
      jaw,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      leftEye,
      rightEye,
      route,
      routeIndex: 0,
      speed: id === 'foxy' ? 2.2 : id === 'golden-freddy' ? 1.6 : 1.25,
      chaseSpeed: id === 'foxy' ? 5.5 : id === 'golden-freddy' ? 4.7 : 4.2,
      phase: Math.random() * Math.PI * 2,
      active: false,
      chaseTimer: 0,
      scareCooldown: 0,
    };
  };

  const animatronics = [
    makeAnimatronic('bonnie', 'Bonnie', 0x5142a7, new Vector3(-9, 1.05, -36), [new Vector3(-9, 1.05, -36), new Vector3(-44, 0, -24), new Vector3(-42, 0, 18), new Vector3(-8, 0, 18)], 'rabbit'),
    makeAnimatronic('chica', 'Chica', 0xd8b13c, new Vector3(9, 1.05, -36), [new Vector3(9, 1.05, -36), new Vector3(42, 0, -24), new Vector3(42, 0, 10), new Vector3(8, 0, 22)], 'chicken'),
    makeAnimatronic('freddy', 'Freddy', 0x6f442a, new Vector3(0, 1.05, -36), [new Vector3(0, 1.05, -36), new Vector3(0, 0, 10), new Vector3(-34, 0, -56), new Vector3(32, 0, -24)], 'bear'),
    makeAnimatronic('foxy', 'Foxy', 0x9a3128, new Vector3(42, 0, 10), [new Vector3(42, 0, 10), new Vector3(24, 0, 22), new Vector3(0, 0, 28), new Vector3(42, 0, -24)], 'fox'),
    makeAnimatronic('golden-freddy', 'Golden Freddy', 0xc49a35, new Vector3(0, 0, -58), [new Vector3(0, 0, -58), new Vector3(0, 0, -24), new Vector3(-42, 0, -56), new Vector3(42, 0, -24)], 'bear'),
  ];

  const preservedChapterNineObjects = new Set<object>([
    ...shellObjects,
  ]);
  root.children.slice().forEach((child) => {
    if (!preservedChapterNineObjects.has(child)) {
      root.remove(child);
    }
  });
  animatronics.length = 0;
  colliders.length = 0;
  colliders.push(...shellColliders);

  const shoulderCamera = new Group();
  shoulderCamera.name = 'Chapter 9 shoulder recording camera';
  const cameraBody = new Mesh(new BoxGeometry(0.55, 0.34, 0.34), recordingMaterial);
  const cameraLens = new Mesh(new CylinderGeometry(0.13, 0.18, 0.18, 18), blackMetalMaterial);
  cameraLens.rotation.x = Math.PI / 2;
  cameraLens.position.z = -0.27;
  const redDot = new Mesh(new SphereGeometry(0.035, 8, 6), redLightMaterial);
  redDot.position.set(0.22, 0.08, -0.23);
  const cameraScreen = new Mesh(new PlaneGeometry(0.42, 0.24), cameraScreenMaterial);
  cameraScreen.position.set(0, 0.02, 0.176);
  const screenRecLight = new Mesh(new SphereGeometry(0.026, 8, 6), redLightMaterial);
  screenRecLight.position.set(-0.17, 0.105, 0.184);
  shoulderCamera.add(cameraBody, cameraLens, cameraScreen, redDot, screenRecLight);
  shoulderCamera.position.set(0.55, -0.34, -0.74);

  let phaseTime = 0;
  let night = false;
  let insideDuringNight = false;
  let escapeUnlocked = false;
  let lastJumpscareEvent: ChapterNineJumpscareEvent | null = null;
  let inVent = false;
  let ventExitCooldown = 0;
  let cameraRecording = false;
  let heldItem: ChapterNineHeldItem = 'coordinate-tool';
  let doorOpen = false;
  let doorMotionTime = 0;
  let doorMotionFrom = 0;
  let doorMotionTo = 0;
  let doorProgress = 0;

  const getFilmedCount = (): number => filmingTargets.filter((target) => target.filmed).length;
  const getPuzzleCount = (): number => puzzleStations.filter((station) => station.solved).length;

  const updateEscapeState = (): void => {
    escapeUnlocked = getFilmedCount() >= FOOTAGE_TARGET && getPuzzleCount() >= PUZZLE_TARGET;
    frontDoorCollider.enabled = doorProgress < 0.72;
  };

  const setDoorProgress = (progress: number): void => {
    const clamped = Math.max(0, Math.min(1, progress));
    const eased = clamped * clamped * (3 - 2 * clamped);
    const bounce = doorOpen ? Math.sin(clamped * Math.PI * 5) * (1 - clamped) * 0.08 : 0;
    const openAngle = Math.PI / 2.35;
    leftDoor.rotation.y = (eased + bounce) * openAngle;
    rightDoor.rotation.y = -(eased + bounce) * openAngle;
    doorProgress = clamped;
    updateEscapeState();
  };

  const toggleEntranceDoors = (): void => {
    doorOpen = !doorOpen;
    doorMotionFrom = doorProgress;
    doorMotionTo = doorOpen ? 1 : 0;
    doorMotionTime = 0;
  };

  const updateEntranceDoors = (deltaSeconds: number): void => {
    if (Math.abs(doorProgress - doorMotionTo) < 0.001) {
      setDoorProgress(doorMotionTo);
      return;
    }
    doorMotionTime = Math.min(0.95, doorMotionTime + deltaSeconds);
    const t = doorMotionTime / 0.95;
    setDoorProgress(doorMotionFrom + (doorMotionTo - doorMotionFrom) * t);
  };

  const moveAnimatronic = (bot: ChapterNineAnimatronic, deltaSeconds: number, playerPosition: Vector3): void => {
    bot.scareCooldown = Math.max(0, bot.scareCooldown - deltaSeconds);
    const distanceToPlayer = bot.root.position.distanceTo(playerPosition);
    const canChase = night && distanceToPlayer < (inVent ? 18 : 24);
    bot.active = night;
    if (!bot.active) {
      bot.root.position.lerp(bot.route[0], Math.min(1, deltaSeconds * 0.12));
      bot.chaseTimer = 0;
      return;
    }
    if (canChase) {
      bot.chaseTimer = Math.min(8, bot.chaseTimer + deltaSeconds);
    } else {
      bot.chaseTimer = Math.max(0, bot.chaseTimer - deltaSeconds * 0.5);
    }
    const target = bot.chaseTimer > 1.1 ? playerPosition : bot.route[bot.routeIndex];
    const flatTarget = new Vector3(target.x, bot.root.position.y, target.z);
    const direction = flatTarget.sub(bot.root.position);
    const distance = Math.max(0.001, direction.length());
    if (distance < 1.2 && bot.chaseTimer <= 1.1) {
      bot.routeIndex = (bot.routeIndex + 1) % bot.route.length;
    } else {
      direction.normalize();
      bot.root.position.addScaledVector(direction, Math.min(distance, (bot.chaseTimer > 1.1 ? bot.chaseSpeed : bot.speed) * deltaSeconds));
      bot.root.rotation.y = Math.atan2(direction.x, direction.z);
    }
    const chasing = bot.chaseTimer > 1.1;
    const walk = phaseTime * (chasing ? 13.5 : 4.2) + bot.phase;
    const stride = Math.sin(walk) * (chasing ? 0.88 : 0.32);
    const limp = Math.sin(walk * 0.5 + bot.phase) * (chasing ? 0.16 : 0.1);
    const sideSwing = Math.sin(walk + Math.PI / 2) * (chasing ? 0.24 : 0.09);
    bot.leftArm.rotation.x = chasing ? stride + limp : stride * 0.55;
    bot.rightArm.rotation.x = chasing ? -stride * 0.88 : -stride * 0.35;
    bot.leftArm.rotation.z = -0.16 + sideSwing;
    bot.rightArm.rotation.z = 0.16 + sideSwing * 0.7;
    bot.leftLeg.rotation.x = chasing ? -stride * 0.7 : -stride * 0.42;
    bot.rightLeg.rotation.x = chasing ? stride * 0.52 + limp : stride * 0.3;
    bot.head.rotation.y = Math.sin(walk * 0.42) * (chasing ? 0.12 : 0.05);
    bot.head.rotation.z = (bot.id === 'foxy' ? -0.12 : 0.12) + Math.sin(walk * 0.33) * (chasing ? 0.08 : 0.035);
    bot.jaw.rotation.x = bot.chaseTimer > 1.1 ? 0.45 + Math.abs(Math.sin(walk * 0.9)) * 0.28 : Math.abs(Math.sin(walk * 0.18)) * 0.12;
    if (bot.id === 'golden-freddy' && bot.chaseTimer > 1.1) {
      bot.leftEye.visible = Math.sin(phaseTime * 18) > -0.35;
      bot.rightEye.visible = bot.leftEye.visible;
    } else {
      bot.leftEye.visible = true;
      bot.rightEye.visible = true;
    }
    if (distanceToPlayer < 1.28 && bot.scareCooldown <= 0 && night) {
      bot.scareCooldown = 8;
      const variant: HudJumpScareVariant = bot.id === 'foxy'
        ? 'foxy'
        : bot.id === 'chica'
          ? 'quacky'
          : bot.id === 'bonnie'
            ? 'purple'
            : 'bear';
      lastJumpscareEvent = {
        animatronic: bot.id,
        variant,
        message: `${bot.name} lunges into your face, opens its jaw, and shakes its head in a jumpscare.`,
      };
    }
  };

  const reset = (): void => {
    phaseTime = 0;
    night = false;
    insideDuringNight = false;
    escapeUnlocked = false;
    inVent = false;
    ventExitCooldown = 0;
    cameraRecording = false;
    heldItem = 'coordinate-tool';
    doorOpen = false;
    doorMotionTime = 0;
    doorMotionFrom = 0;
    doorMotionTo = 0;
    setDoorProgress(0);
    lastJumpscareEvent = null;
    filmingTargets.forEach((target) => {
      target.filmed = false;
    });
    puzzleStations.forEach((station) => {
      station.solved = false;
    });
    animatronics.forEach((bot) => {
      bot.root.position.copy(bot.route[0]);
      bot.root.visible = true;
      bot.routeIndex = 0;
      bot.chaseTimer = 0;
      bot.scareCooldown = 0;
      bot.active = false;
      bot.leftEye.visible = true;
      bot.rightEye.visible = true;
    });
    shoulderCamera.visible = true;
    redDot.visible = false;
    screenRecLight.visible = false;
  };

  reset();

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    shoulderCamera,
    cameraScreenMaterial,
    update(deltaSeconds: number, playerPosition: Vector3): void {
      phaseTime += deltaSeconds;
      ventExitCooldown = Math.max(0, ventExitCooldown - deltaSeconds);
      if (!night && phaseTime >= DAY_SECONDS) {
        night = true;
        phaseTime = 0;
      } else if (night && phaseTime >= NIGHT_SECONDS && !insideDuringNight) {
        night = false;
        phaseTime = 0;
      }
      if (night && playerPosition.z < BUILDING_CENTER_Z + BUILDING_DEPTH / 2 - 4) {
        insideDuringNight = true;
      }
      updateEscapeState();
      updateEntranceDoors(deltaSeconds);
      animatronics.forEach((bot) => moveAnimatronic(bot, deltaSeconds, playerPosition));
      const recordingBlink = cameraRecording && Math.sin(phaseTime * 11) > -0.2;
      redDot.visible = recordingBlink;
      screenRecLight.visible = recordingBlink;
      root.traverse((object) => {
        if (object.userData.dustPhase !== undefined) {
          object.position.y = object.userData.baseY + Math.sin(phaseTime * 0.7 + object.userData.dustPhase) * 0.025;
        }
      });
    },
    interact(playerPosition: Vector3): ChapterNineInteractionResult {
      const doorInteractPosition = new Vector3(0, GAME_CONFIG.player.height, BUILDING_CENTER_Z + BUILDING_DEPTH / 2 + 2.3);
      if (playerPosition.distanceTo(doorInteractPosition) <= GAME_CONFIG.player.interactionRange + 2.2) {
        toggleEntranceDoors();
        return {
          message: doorOpen ? 'The glass entrance doors swing open and bounce against the side walls.' : 'The glass entrance doors swing shut.',
          glassDoorOpened: doorOpen,
        };
      }
      if (ventExitCooldown <= 0) {
        const vent = ventEntries.find((entry) => playerPosition.distanceTo(entry.position) <= GAME_CONFIG.player.interactionRange + 1.6);
        if (vent) {
          inVent = !inVent;
          ventExitCooldown = 1;
          return {
            message: inVent
              ? `You crawl into the ${vent.label}. The metal tunnel echoes around you.`
              : `You drop out of the ${vent.label}.`,
            teleport: vent.target.clone(),
            lookTarget: new Vector3(0, 1.5, -18),
          };
        }
      }
      const station = puzzleStations
        .filter((entry) => !entry.solved)
        .sort((a, b) => a.position.distanceTo(playerPosition) - b.position.distanceTo(playerPosition))[0];
      if (station && station.position.distanceTo(playerPosition) <= GAME_CONFIG.player.interactionRange + 1.2) {
        station.solved = true;
        updateEscapeState();
        return {
          message: station.solvedMessage,
        };
      }
      return { message: 'The Freddy Pizza Complex building shell is still standing, but the interior is empty.' };
    },
    record(playerPosition: Vector3): string {
      if (heldItem !== 'camera') {
        return 'You are not holding the shoulder camera. Spin the mouse wheel to select it.';
      }
      cameraRecording = !cameraRecording;
      if (FOOTAGE_TARGET === 0) {
        return cameraRecording
          ? 'The shoulder camera starts recording. The red light blinks on the camera screen.'
          : 'The shoulder camera stops recording.';
      }
      const movingAnimatronics = new Set(
        animatronics
          .filter((bot) => bot.active && playerPosition.distanceTo(bot.root.position) < 18)
          .map((bot) => bot.id),
      );
      const nearest = filmingTargets
        .filter((target) => !target.filmed)
        .filter((target) => {
          if (['freddy', 'bonnie', 'chica', 'foxy', 'golden'].includes(target.id)) {
            const targetId = target.id === 'golden' ? 'golden-freddy' : target.id;
            return movingAnimatronics.has(targetId as ChapterNineAnimatronicId);
          }
          return true;
        })
        .sort((a, b) => a.position.distanceTo(playerPosition) - b.position.distanceTo(playerPosition))[0];
      if (!nearest || nearest.position.distanceTo(playerPosition) > nearest.radius) {
        return `REC light blinks. Footage saved, but no important evidence is centered nearby. Evidence: ${getFilmedCount()}/${FOOTAGE_TARGET}.`;
      }
      nearest.filmed = true;
      updateEscapeState();
      return `Recorded ${nearest.label}. Evidence: ${getFilmedCount()}/${FOOTAGE_TARGET}.`;
    },
    cycleHeldItem(step: number): void {
      const items: ChapterNineHeldItem[] = ['coordinate-tool', 'camera', 'mic-sound'];
      const currentIndex = items.indexOf(heldItem);
      heldItem = items[(currentIndex + (step > 0 ? 1 : -1) + items.length) % items.length];
      if (step === 0) {
        heldItem = 'camera';
      }
      if (heldItem !== 'camera') {
        cameraRecording = false;
        redDot.visible = false;
        screenRecLight.visible = false;
      }
    },
    setHeldItem(item: ChapterNineHeldItem): void {
      heldItem = item;
      if (heldItem !== 'camera') {
        cameraRecording = false;
        redDot.visible = false;
        screenRecLight.visible = false;
      }
    },
    getHeldItem: () => heldItem,
    consumeJumpscareEvent(): ChapterNineJumpscareEvent | null {
      const event = lastJumpscareEvent;
      lastJumpscareEvent = null;
      return event;
    },
    getSupportedFloorY(position: Vector3): number | null {
      if (inVent && position.y > 2.2) {
        return 3.1 + GAME_CONFIG.player.height;
      }
      if (Math.abs(position.x) <= 92 && position.z >= -84 && position.z <= 126) {
        return GAME_CONFIG.player.height;
      }
      return null;
    },
    getPhaseLabel(): string {
      if (night) {
        return insideDuringNight ? 'Night: Locked In' : 'Night';
      }
      return 'Day';
    },
    getPhaseRemaining(): number {
      return Math.max(0, (night ? NIGHT_SECONDS : DAY_SECONDS) - phaseTime);
    },
    getFootageCount: getFilmedCount,
    getFootageTarget: () => FOOTAGE_TARGET,
    getPuzzleCount,
    getPuzzleTarget: () => PUZZLE_TARGET,
    isNight: () => night,
    isEscapeUnlocked: () => escapeUnlocked,
    reset,
  };
}
