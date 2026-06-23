import {
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
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
  TubeGeometry,
  Vector3,
} from 'three';

import { GAME_CONFIG } from '../config/gameConfig';
import type { CollisionBox } from '../types/world';
import type { HudJumpScareVariant } from '../ui/createHud';

export type ChapterNineAnimatronicId = 'bonnie' | 'chica' | 'freddy' | 'foxy' | 'golden-freddy';
export type ChapterNineHeldItem = 'coordinate-tool' | 'camera' | 'mic-sound' | 'keycard';

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
  strengthTesterHammerView: Group;
  cameraScreenMaterial: MeshStandardMaterial;
  update(deltaSeconds: number, playerPosition: Vector3): void;
  updateRockWallHarness(deltaSeconds: number, movement: { forward: number; strafe: number }): { position: Vector3; lookTarget: Vector3 } | null;
  clickRockWallButton(): ChapterNineInteractionResult | null;
  swingStrengthTesterHammer(playerPosition: Vector3): ChapterNineInteractionResult | null;
  canPlayerOccupy(nextX: number, nextZ: number): boolean;
  interact(playerPosition: Vector3, aimOrigin?: Vector3, aimDirection?: Vector3): ChapterNineInteractionResult;
  record(playerPosition: Vector3): string;
  cycleHeldItem(step: number): void;
  setHeldItem(item: ChapterNineHeldItem): void;
  getHeldItem(): ChapterNineHeldItem;
  hasKeycard(): boolean;
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
  isOnTrampoline(position: Vector3): boolean;
  isRockWallHarnessed(): boolean;
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

interface ChapterNineSeat {
  id: string;
  label: string;
  interactPosition: Vector3;
  sitPosition: Vector3;
  lookTarget: Vector3;
}

interface ChapterNineTrampolinePad {
  centerX: number;
  centerZ: number;
  halfWidth: number;
  halfDepth: number;
}

interface ChapterNineRaisedSurface {
  centerX: number;
  centerZ: number;
  halfWidth: number;
  halfDepth: number;
  floorY: number;
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

function createVoiceTapeLabelMaterial(): MeshStandardMaterial {
  return makeCanvasMaterial((context, canvas) => {
    context.fillStyle = '#e3d3a4';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#4d3218';
    context.lineWidth = 12;
    context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
    context.fillStyle = '#24180e';
    context.font = 'bold 64px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('VOICE TAPE', canvas.width / 2, canvas.height / 2);
  });
}

function createKeycardGateLabelMaterial(label: string): MeshStandardMaterial {
  return makeCanvasMaterial((context, canvas) => {
    context.fillStyle = '#101214';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#78d7ff';
    context.lineWidth = 12;
    context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
    context.fillStyle = '#dff7ff';
    context.font = label.length > 4 ? 'bold 72px Arial' : 'bold 104px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label, canvas.width / 2, canvas.height / 2);
  });
}

function createTrampolineNetSignMaterial(): MeshStandardMaterial {
  return makeCanvasMaterial((context, canvas) => {
    context.fillStyle = '#f2f0df';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#2a67a2';
    context.lineWidth = 10;
    context.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
    context.fillStyle = '#173a5c';
    context.font = 'bold 38px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('The trampolines', canvas.width / 2, 72);
    context.font = 'bold 34px Arial';
    context.fillText('have fun and fly safe.', canvas.width / 2, 138);
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

function createPlainGrayWallMaterial(repeatX = 1, offsetX = 0): MeshStandardMaterial {
  if (typeof document === 'undefined') {
    return new MeshStandardMaterial({ color: 0x6f7376, roughness: 0.84, metalness: 0.01 });
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#6f7376';
    context.fillRect(0, 0, canvas.width, canvas.height);
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

  const spawn = new Vector3(-49.34, GAME_CONFIG.player.height, -7.67);
  const lookTarget = new Vector3(-42, 1.7, -7.67);

  const asphaltMaterial = new MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.96, metalness: 0.02 });
  const grassMaterial = new MeshStandardMaterial({ color: 0x2f7d32, roughness: 0.96, metalness: 0.0 });
  const treeTrunkMaterial = new MeshStandardMaterial({ color: 0x5b3821, roughness: 0.86 });
  const treeLeafMaterial = new MeshStandardMaterial({ color: 0x1f5f2d, roughness: 0.9 });
  const dirtyConcreteMaterial = new MeshStandardMaterial({ color: 0x6c6860, roughness: 0.94, metalness: 0.01 });
  const checkeredFloorMaterial = createCheckeredFloorMaterial();
  const carpetMaterial = new MeshStandardMaterial({ color: 0x371019, roughness: 0.9 });
  const wallCheckerBandTopY = 1.45;
  const createGrayMaterialFor = (runLength: number, height = WALL_HEIGHT, offsetX = 0): MeshStandardMaterial => (
    createGrayWallBandMaterial(Math.max(0.05, runLength / height), offsetX)
  );
  const createInteriorWallMaterialFor = (
    runLength: number,
    height = WALL_HEIGHT,
    bottomY = 0,
    offsetX = 0,
  ): MeshStandardMaterial => (
    bottomY >= wallCheckerBandTopY
      ? createPlainGrayWallMaterial(Math.max(0.05, runLength / height), offsetX)
      : createGrayMaterialFor(runLength, height, offsetX)
  );
  const ceilingMaterial = new MeshStandardMaterial({ color: 0x2a2927, roughness: 0.92, metalness: 0.04 });
  const roofMaterial = new MeshStandardMaterial({ color: 0x191715, roughness: 0.86, metalness: 0.12 });
  const woodMaterial = new MeshStandardMaterial({ color: 0x5b3b22, roughness: 0.82 });
  const darkWoodMaterial = new MeshStandardMaterial({ color: 0x3f2615, roughness: 0.86 });
  const metalMaterial = new MeshStandardMaterial({ color: 0x777b7b, roughness: 0.46, metalness: 0.36 });
  const blackMetalMaterial = new MeshStandardMaterial({ color: 0x111214, roughness: 0.5, metalness: 0.45 });
  const trampolineMatMaterial = new MeshStandardMaterial({ color: 0x111418, roughness: 0.7, metalness: 0.02 });
  const trampolinePadMaterial = new MeshStandardMaterial({ color: 0x2f68c7, roughness: 0.68, metalness: 0.03 });
  const trampolineEdgeMaterial = new MeshStandardMaterial({ color: 0xd63333, roughness: 0.7, metalness: 0.02 });
  const trampolineSpringMaterial = new MeshStandardMaterial({ color: 0xc6cbd0, roughness: 0.32, metalness: 0.62 });
  const trampolineNetMaterial = new MeshStandardMaterial({
    color: 0xc8d4dd,
    transparent: true,
    opacity: 0.34,
    roughness: 0.68,
    metalness: 0.02,
    side: DoubleSide,
  });
  const trampolineNetCordMaterial = new MeshStandardMaterial({ color: 0xd7e2e9, roughness: 0.72, metalness: 0.02 });
  const rockWallMaterial = new MeshStandardMaterial({ color: 0x5f5d58, roughness: 0.96, metalness: 0.01 });
  const rockWallDarkMaterial = new MeshStandardMaterial({ color: 0x3d3b38, roughness: 0.98, metalness: 0.01 });
  const climbingHoldMaterial = new MeshStandardMaterial({ color: 0xd08b2f, roughness: 0.62, metalness: 0.02 });
  const harnessMaterial = new MeshStandardMaterial({ color: 0x202225, roughness: 0.56, metalness: 0.18 });
  const ropeMaterial = new MeshStandardMaterial({ color: 0xd8c27a, roughness: 0.8, metalness: 0.02 });
  const topButtonMaterial = new MeshStandardMaterial({ color: 0xd92929, emissive: 0x4b0505, emissiveIntensity: 0.35, roughness: 0.4 });
  let phaseTime = 0;
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
  const strengthTesterHammerView = new Group();
  strengthTesterHammerView.visible = false;
  strengthTesterHammerView.position.set(0.48, -0.5, -0.92);
  strengthTesterHammerView.rotation.set(0.35, -0.18, -0.48);
  const hammerViewHandle = new Mesh(new BoxGeometry(0.1, 0.95, 0.1), woodMaterial);
  hammerViewHandle.position.y = -0.04;
  const hammerViewHead = new Mesh(new BoxGeometry(0.62, 0.2, 0.24), metalMaterial);
  hammerViewHead.position.y = 0.48;
  const hammerViewGrip = new Mesh(new BoxGeometry(0.14, 0.2, 0.14), blackMetalMaterial);
  hammerViewGrip.position.y = -0.58;
  strengthTesterHammerView.add(hammerViewHandle, hammerViewHead, hammerViewGrip);
  const cameraScreenMaterial = createCameraScreenMaterial();
  const redLightMaterial = new MeshBasicMaterial({ color: 0xff2733 });
  let strengthTesterTimer = 0;
  let strengthTesterHammerPickedUp = false;
  let strengthTesterRoot: Group | null = null;
  let strengthTesterHammer: Group | null = null;
  let strengthTesterRope: Mesh | null = null;
  let strengthTesterPad: Mesh | null = null;
  let strengthTesterMarker: Mesh | null = null;
  let strengthTesterBell: Mesh | null = null;
  const strengthTesterPosition = new Vector3(-63.82, 0, 25.55);
  const strengthTesterRotationY = Math.PI / 2;
  const strengthTesterInteractPosition = new Vector3(strengthTesterPosition.x, GAME_CONFIG.player.height, strengthTesterPosition.z);
  const strengthTesterTetherMaxDistance = 4.8;

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
    const wallMaterial = material ?? createInteriorWallMaterialFor(Math.max(width, depth));
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
    const wallMaterial = material ?? createInteriorWallMaterialFor(extendedLength, WALL_HEIGHT, 0, textureOffset - joinExtension / WALL_HEIGHT);
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

  const addAngledCountertop = (startX: number, startZ: number, endX: number, endZ: number): void => {
    const dx = endX - startX;
    const dz = endZ - startZ;
    const length = Math.hypot(dx, dz);
    const rotationY = Math.atan2(-dz, dx);
    const centerX = (startX + endX) / 2;
    const centerZ = (startZ + endZ) / 2;
    const counter = new Group();
    counter.position.set(centerX, 0, centerZ);
    counter.rotation.y = rotationY;

    const top = new Mesh(new BoxGeometry(length, 0.24, 0.92), woodMaterial);
    top.position.y = 1.05;
    const base = new Mesh(new BoxGeometry(length - 0.22, 0.82, 0.72), darkWoodMaterial);
    base.position.y = 0.49;
    counter.add(top, base);
    root.add(counter);

    colliders.push({
      centerX,
      centerZ,
      halfWidth: length / 2,
      halfDepth: 0.46,
      rotationY,
    });
  };

  const trampolinePads: ChapterNineTrampolinePad[] = [];
  const addTrampolinePark = (
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    columns: number,
    rows: number,
  ): void => {
    const margin = 0.9;
    const gap = 0.45;
    const width = maxX - minX;
    const depth = maxZ - minZ;
    const cellWidth = (width - margin * 2 - gap * (columns - 1)) / columns;
    const cellDepth = (depth - margin * 2 - gap * (rows - 1)) / rows;
    const parkCenterX = (minX + maxX) / 2;
    const parkCenterZ = (minZ + maxZ) / 2;
    const floor = new Mesh(new BoxGeometry(width, 0.05, depth), trampolinePadMaterial);
    floor.position.set(parkCenterX, 0.025, parkCenterZ);
    root.add(floor);

    const railHeight = 0.26;
    const railY = 0.16;
    addBox(root, width, railHeight, 0.18, parkCenterX, railY, minZ + 0.09, trampolineEdgeMaterial);
    addBox(root, width, railHeight, 0.18, parkCenterX, railY, maxZ - 0.09, trampolineEdgeMaterial);
    addBox(root, 0.18, railHeight, depth, minX + 0.09, railY, parkCenterZ, trampolineEdgeMaterial);
    addBox(root, 0.18, railHeight, depth, maxX - 0.09, railY, parkCenterZ, trampolineEdgeMaterial);

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const centerX = minX + margin + cellWidth / 2 + column * (cellWidth + gap);
        const centerZ = minZ + margin + cellDepth / 2 + row * (cellDepth + gap);
        const mat = new Mesh(new BoxGeometry(cellWidth, 0.08, cellDepth), trampolineMatMaterial);
        mat.position.set(centerX, 0.12, centerZ);
        root.add(mat);

        const padThickness = 0.16;
        addBox(root, cellWidth + padThickness * 2, 0.12, padThickness, centerX, 0.2, centerZ - cellDepth / 2 - padThickness / 2, trampolinePadMaterial);
        addBox(root, cellWidth + padThickness * 2, 0.12, padThickness, centerX, 0.2, centerZ + cellDepth / 2 + padThickness / 2, trampolinePadMaterial);
        addBox(root, padThickness, 0.12, cellDepth, centerX - cellWidth / 2 - padThickness / 2, 0.2, centerZ, trampolinePadMaterial);
        addBox(root, padThickness, 0.12, cellDepth, centerX + cellWidth / 2 + padThickness / 2, 0.2, centerZ, trampolinePadMaterial);

        for (let springIndex = 0; springIndex < 4; springIndex += 1) {
          const offsetX = -cellWidth / 2 + (springIndex + 0.5) * (cellWidth / 4);
          const frontSpring = new Mesh(new BoxGeometry(0.1, 0.06, 0.24), trampolineSpringMaterial);
          frontSpring.position.set(centerX + offsetX, 0.24, centerZ - cellDepth / 2 - 0.08);
          const backSpring = frontSpring.clone();
          backSpring.position.z = centerZ + cellDepth / 2 + 0.08;
          root.add(frontSpring, backSpring);
        }

        trampolinePads.push({
          centerX,
          centerZ,
          halfWidth: cellWidth / 2,
          halfDepth: cellDepth / 2,
        });
      }
    }
  };

  const addTrampolineSafetyNet = (startX: number, startZ: number, endX: number, endZ: number): void => {
    const dx = endX - startX;
    const dz = endZ - startZ;
    const length = Math.hypot(dx, dz);
    const centerX = (startX + endX) / 2;
    const centerZ = (startZ + endZ) / 2;
    const rotationY = Math.atan2(-dz, dx);
    const netHeight = 4.1;
    const netY = netHeight / 2;
    const group = new Group();
    group.position.set(centerX, 0, centerZ);
    group.rotation.y = rotationY;

    const netPanel = new Mesh(new PlaneGeometry(length - 0.5, netHeight - 0.62), trampolineNetMaterial);
    netPanel.position.set(0, netY, 0.012);
    group.add(netPanel);

    const addLocalBox = (
      width: number,
      height: number,
      depth: number,
      x: number,
      y: number,
      z: number,
      material: MeshStandardMaterial | MeshBasicMaterial,
    ): void => {
      const mesh = new Mesh(new BoxGeometry(width, height, depth), material);
      mesh.position.set(x, y, z);
      group.add(mesh);
    };

    addLocalBox(length + 0.28, 0.16, 0.16, 0, netHeight + 0.08, 0, metalMaterial);
    addLocalBox(length + 0.08, 0.1, 0.1, 0, 0.42, 0, trampolineNetCordMaterial);

    const postCount = 7;
    for (let index = 0; index < postCount; index += 1) {
      const t = index / (postCount - 1);
      const x = -length / 2 + t * length;
      addLocalBox(0.18, netHeight + 0.34, 0.22, x, (netHeight + 0.34) / 2, 0, metalMaterial);
      const cap = new Mesh(new SphereGeometry(0.16, 12, 8), metalMaterial);
      cap.position.set(x, netHeight + 0.28, 0);
      group.add(cap);
    }

    const verticalCordCount = 13;
    for (let index = 1; index < verticalCordCount - 1; index += 1) {
      const t = index / (verticalCordCount - 1);
      const x = -length / 2 + t * length;
      addLocalBox(0.035, netHeight - 0.8, 0.035, x, netY, 0.03, trampolineNetCordMaterial);
    }

    for (let index = 0; index < 5; index += 1) {
      const y = 0.86 + index * 0.62;
      addLocalBox(length - 0.42, 0.035, 0.035, 0, y, 0.04, trampolineNetCordMaterial);
    }

    const sign = new Mesh(new PlaneGeometry(10.2, 2.15), createTrampolineNetSignMaterial());
    sign.position.set(0, 2.34, 0.075);
    group.add(sign);

    root.add(group);
    const collider = addCollider(colliders, centerX, centerZ, length, 0.42);
    collider.rotationY = rotationY;
  };

  const isOnTrampolinePad = (position: Vector3): boolean => (
    trampolinePads.some((pad) => (
      Math.abs(position.x - pad.centerX) <= pad.halfWidth
      && Math.abs(position.z - pad.centerZ) <= pad.halfDepth
    ))
  );

  const rockWallStartX = -32.38;
  const rockWallStartZ = -47.05;
  const rockWallEndX = -32.38;
  const rockWallEndZ = -35.02;
  const rockWallHeight = 3.76;
  const rockWallThickness = 0.46;
  const rockWallDx = rockWallEndX - rockWallStartX;
  const rockWallDz = rockWallEndZ - rockWallStartZ;
  const rockWallLength = Math.hypot(rockWallDx, rockWallDz);
  const rockWallAxisX = rockWallDx / rockWallLength;
  const rockWallAxisZ = rockWallDz / rockWallLength;
  const rockWallNormalX = -rockWallAxisZ;
  const rockWallNormalZ = rockWallAxisX;
  const rockWallCenterX = (rockWallStartX + rockWallEndX) / 2;
  const rockWallCenterZ = (rockWallStartZ + rockWallEndZ) / 2;
  const rockWallRotationY = Math.atan2(-rockWallDz, rockWallDx);
  const rockWallFrontOffset = rockWallThickness / 2 + 0.78;
  const rockWallLoweringSpeed = 0.92;
  const rockWallHarnessInteractPosition = new Vector3(
    rockWallCenterX + rockWallNormalX * (rockWallFrontOffset + 0.12),
    GAME_CONFIG.player.height,
    rockWallCenterZ + rockWallNormalZ * (rockWallFrontOffset + 0.12),
  );
  let rockWallHarnessed = false;
  let rockWallLowering = false;
  let rockWallClimbX = 0;
  let rockWallClimbY = 0;
  let rockWallHarnessRoot: Group | null = null;
  let rockWallRope: Mesh | null = null;
  let rockWallTopButton: Mesh | null = null;
  let rockWallButtonPressTime = 0;
  const rockWallTopButtonLocalZ = rockWallThickness / 2 + 0.12;
  const rockWallTopButtonY = rockWallHeight - 0.42;
  const rockWallRopeAnchor = new Vector3(
    rockWallCenterX + rockWallNormalX * rockWallFrontOffset,
    rockWallHeight + 0.34,
    rockWallCenterZ + rockWallNormalZ * rockWallFrontOffset,
  );

  const getRockWallClimbPosition = (): Vector3 => new Vector3(
    rockWallCenterX + rockWallAxisX * rockWallClimbX + rockWallNormalX * rockWallFrontOffset,
    GAME_CONFIG.player.height + rockWallClimbY,
    rockWallCenterZ + rockWallAxisZ * rockWallClimbX + rockWallNormalZ * rockWallFrontOffset,
  );

  const getRockWallHarnessAttachmentPosition = (): Vector3 => {
    const climbPosition = getRockWallClimbPosition();
    climbPosition.y += 0.34;
    return climbPosition;
  };

  const getRockWallLookTarget = (): Vector3 => new Vector3(
    rockWallCenterX + rockWallAxisX * rockWallClimbX,
    GAME_CONFIG.player.height + rockWallClimbY,
    rockWallCenterZ + rockWallAxisZ * rockWallClimbX,
  );
  const updateRockWallTopButton = (deltaSeconds: number): void => {
    if (!rockWallTopButton) {
      return;
    }
    rockWallButtonPressTime = Math.max(0, rockWallButtonPressTime - deltaSeconds);
    const pressProgress = rockWallButtonPressTime > 0
      ? Math.sin((rockWallButtonPressTime / 0.42) * Math.PI)
      : 0;
    rockWallTopButton.position.z = rockWallTopButtonLocalZ - pressProgress * 0.075;
  };
  const pressRockWallTopButton = (message: string): ChapterNineInteractionResult | null => {
    if (!rockWallHarnessed) {
      return null;
    }

    if (rockWallLowering) {
      return {
        message: 'The winch is already lowering you. It will unclip you at the bottom.',
      };
    }

    if (rockWallClimbY < rockWallHeight - 1.08) {
      return null;
    }

    rockWallButtonPressTime = 0.42;
    rockWallLowering = true;
    updateRockWallTopButton(0);
    return { message };
  };

  const updateRockWallRope = (endPoint?: Vector3): void => {
    if (!rockWallRope) {
      return;
    }

    const end = endPoint ?? rockWallHarnessInteractPosition.clone().setY(1.28);
    const distance = rockWallRopeAnchor.distanceTo(end);
    const slack = Math.max(0.18, 1.05 - distance * 0.11);
    const sideSway = Math.sin(phaseTime * 1.7 + distance) * slack * 0.08;
    const middle = rockWallRopeAnchor.clone().lerp(end, 0.52);
    middle.y -= slack;
    middle.x += rockWallAxisX * sideSway;
    middle.z += rockWallAxisZ * sideSway;
    const lowerMiddle = rockWallRopeAnchor.clone().lerp(end, 0.78);
    lowerMiddle.y -= slack * 0.56;
    lowerMiddle.x -= rockWallAxisX * sideSway * 0.7;
    lowerMiddle.z -= rockWallAxisZ * sideSway * 0.7;

    const curve = new CatmullRomCurve3([
      rockWallRopeAnchor,
      middle,
      lowerMiddle,
      end,
    ]);
    const oldGeometry = rockWallRope.geometry;
    rockWallRope.geometry = new TubeGeometry(curve, 22, 0.032, 10, false);
    oldGeometry.dispose();
  };

  const addRockClimbingWall = (): void => {
    const wallRoot = new Group();
    wallRoot.position.set(rockWallCenterX, 0, rockWallCenterZ);
    wallRoot.rotation.y = rockWallRotationY;

    const wall = new Mesh(new BoxGeometry(rockWallLength, rockWallHeight, rockWallThickness), rockWallMaterial);
    wall.position.y = rockWallHeight / 2;
    wallRoot.add(wall);

    const roughSpots = [
      [-0.42, 0.92, 0.28], [-0.31, 2.08, 0.2], [-0.16, 3.02, 0.24], [0.02, 1.46, 0.22],
      [0.18, 2.54, 0.24], [0.34, 1.12, 0.2], [0.42, 3.18, 0.22],
    ];
    roughSpots.forEach(([xRatio, y, scale], index) => {
      const rock = new Mesh(new SphereGeometry(scale, 8, 6), index % 2 === 0 ? rockWallDarkMaterial : rockWallMaterial);
      rock.scale.set(1.35, 0.72, 0.34);
      rock.position.set(xRatio * rockWallLength, y, rockWallThickness / 2 + 0.025);
      wallRoot.add(rock);
    });

    const holds = [
      [-0.42, 0.72], [-0.28, 1.18], [-0.12, 0.9], [0.04, 1.42], [0.22, 1.06],
      [0.4, 1.72], [0.32, 2.28], [0.12, 2.04], [-0.08, 2.56], [-0.3, 2.32],
      [-0.42, 2.94], [-0.2, 3.28], [0.02, 3.04], [0.22, 3.42], [0.38, 3.08],
    ];
    holds.forEach(([xRatio, y], index) => {
      const hold = new Mesh(new SphereGeometry(0.18 + (index % 3) * 0.025, 10, 6), climbingHoldMaterial);
      hold.scale.set(1.25, 0.62, 0.5);
      hold.position.set(xRatio * rockWallLength, y, rockWallThickness / 2 + 0.16);
      wallRoot.add(hold);
    });

    const topButton = new Mesh(new CylinderGeometry(0.24, 0.24, 0.12, 18), topButtonMaterial);
    topButton.rotation.x = Math.PI / 2;
    topButton.position.set(0, rockWallTopButtonY, rockWallTopButtonLocalZ);
    rockWallTopButton = topButton;
    wallRoot.add(topButton);

    rockWallRope = new Mesh(new TubeGeometry(new CatmullRomCurve3([
      rockWallRopeAnchor,
      rockWallHarnessInteractPosition.clone().setY(1.28),
    ]), 8, 0.032, 10, false), ropeMaterial);
    root.add(rockWallRope);
    updateRockWallRope();

    const harness = new Group();
    harness.position.set(0, 0.86, rockWallThickness / 2 + 0.58);
    const belt = new Mesh(new TorusGeometry(0.34, 0.035, 8, 24), harnessMaterial);
    belt.rotation.x = Math.PI / 2;
    const leftLoop = new Mesh(new TorusGeometry(0.18, 0.026, 8, 18), harnessMaterial);
    leftLoop.position.set(-0.17, -0.26, 0);
    leftLoop.rotation.x = Math.PI / 2;
    const rightLoop = leftLoop.clone();
    rightLoop.position.x = 0.17;
    const clip = new Mesh(new BoxGeometry(0.16, 0.22, 0.08), metalMaterial);
    clip.position.set(0, 0.12, 0.03);
    harness.add(belt, leftLoop, rightLoop, clip);
    wallRoot.add(harness);
    rockWallHarnessRoot = harness;

    root.add(wallRoot);

    const collider = addCollider(colliders, rockWallCenterX, rockWallCenterZ, rockWallLength, rockWallThickness);
    collider.rotationY = rockWallRotationY;
  };

  const addCashRegister = (x: number, surfaceY: number, z: number, rotationY = 0): void => {
    const register = new Group();
    register.position.set(x, surfaceY, z);
    register.rotation.y = rotationY;

    const bodyMaterial = new MeshStandardMaterial({ color: 0x2b2d30, roughness: 0.5, metalness: 0.18 });
    const drawerMaterial = new MeshStandardMaterial({ color: 0x56595f, roughness: 0.42, metalness: 0.28 });
    const buttonMaterial = new MeshStandardMaterial({ color: 0xd9d2bf, roughness: 0.56 });
    const screenMaterial = new MeshBasicMaterial({ color: 0x69d66d });
    const receiptMaterial = new MeshStandardMaterial({ color: 0xf2ead7, roughness: 0.72 });

    const drawer = new Mesh(new BoxGeometry(0.86, 0.22, 0.58), bodyMaterial);
    drawer.position.y = 0.11;
    const frontPlate = new Mesh(new BoxGeometry(0.7, 0.08, 0.035), drawerMaterial);
    frontPlate.position.set(0, 0.13, -0.305);
    const topSlope = new Mesh(new BoxGeometry(0.78, 0.18, 0.42), bodyMaterial);
    topSlope.position.set(0, 0.29, -0.03);
    topSlope.rotation.x = -0.18;

    const screenPost = new Mesh(new BoxGeometry(0.12, 0.3, 0.1), bodyMaterial);
    screenPost.position.set(0, 0.46, 0.18);
    const screen = new Mesh(new BoxGeometry(0.56, 0.34, 0.06), bodyMaterial);
    screen.position.set(0, 0.7, 0.23);
    screen.rotation.x = -0.12;
    const display = new Mesh(new PlaneGeometry(0.44, 0.2), screenMaterial);
    display.position.set(0, 0.705, 0.262);
    display.rotation.x = -0.12;

    const receipt = new Mesh(new BoxGeometry(0.28, 0.035, 0.32), receiptMaterial);
    receipt.position.set(-0.24, 0.42, 0.0);
    receipt.rotation.x = -0.18;

    register.add(drawer, frontPlate, topSlope, screenPost, screen, display, receipt);
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        const button = new Mesh(new BoxGeometry(0.09, 0.035, 0.07), buttonMaterial);
        button.position.set(-0.2 + column * 0.13, 0.405, -0.15 + row * 0.09);
        button.rotation.x = -0.18;
        register.add(button);
      }
    }

    root.add(register);
  };

  const addWallShelf = (x: number, y: number, z: number, normalX: number): void => {
    const depth = 0.58;
    const length = 2.8;
    const thickness = 0.12;
    const shelf = new Group();
    shelf.position.set(x + normalX * depth / 2, y, z);

    const board = new Mesh(new BoxGeometry(depth, thickness, length), woodMaterial);
    const lip = new Mesh(new BoxGeometry(0.08, 0.18, length), darkWoodMaterial);
    lip.position.set(normalX * (depth / 2 - 0.04), 0.03, 0);
    shelf.add(board, lip);

    [-0.9, 0.9].forEach((offsetZ) => {
      const bracket = new Mesh(new BoxGeometry(0.08, 0.48, 0.08), metalMaterial);
      bracket.position.set(-normalX * (depth / 2 - 0.12), -0.24, offsetZ);
      const brace = new Mesh(new BoxGeometry(0.08, 0.56, 0.08), metalMaterial);
      brace.position.set(-normalX * 0.08, -0.26, offsetZ);
      brace.rotation.z = normalX > 0 ? -0.72 : 0.72;
      shelf.add(bracket, brace);
    });

    root.add(shelf);
  };

  const addCollapsedAnimatronic = (x: number, z: number, rotationY = 0): void => {
    const heap = new Group();
    heap.position.set(x, 0, z);
    heap.rotation.y = rotationY;

    const shellMaterial = new MeshStandardMaterial({ color: 0xb99334, roughness: 0.72, metalness: 0.2 });
    const wornShellMaterial = new MeshStandardMaterial({ color: 0x8f7229, roughness: 0.86, metalness: 0.12 });
    const edgeMaterial = new MeshStandardMaterial({ color: 0x5c4b24, roughness: 0.9, metalness: 0.2 });
    const innerMaterial = new MeshStandardMaterial({ color: 0x221d24, roughness: 0.8, metalness: 0.25 });
    const purpleMaterial = new MeshStandardMaterial({ color: 0x6b2b85, roughness: 0.68 });
    const stainMaterial = new MeshStandardMaterial({ color: 0x4a0809, roughness: 0.92 });
    const corpseMaterial = new MeshStandardMaterial({ color: 0x5a1513, roughness: 0.9, metalness: 0.02 });
    const eyeMaterial = new MeshBasicMaterial({ color: 0x151018 });
    const toothMaterial = new MeshStandardMaterial({ color: 0xd7d0aa, roughness: 0.7 });

    const bodyLean = -0.38;
    const torso = new Mesh(new BoxGeometry(0.9, 0.86, 0.56), shellMaterial);
    torso.position.set(0, 0.78, -0.08);
    torso.rotation.set(bodyLean, 0.02, 0);
    const pelvis = new Mesh(new BoxGeometry(0.76, 0.28, 0.48), shellMaterial);
    pelvis.position.set(0, 0.32, 0.2);
    pelvis.rotation.set(bodyLean * 0.35, 0.02, 0);
    const neckStub = new Mesh(new CylinderGeometry(0.13, 0.16, 0.2, 12), edgeMaterial);
    neckStub.position.set(0, 1.27, -0.26);
    neckStub.rotation.copy(torso.rotation);
    const backContactPlate = new Mesh(new BoxGeometry(0.76, 0.8, 0.055), edgeMaterial);
    backContactPlate.position.set(0, 0.84, 0.23);
    backContactPlate.rotation.copy(torso.rotation);

    const chestOpening = new Mesh(new BoxGeometry(0.66, 0.58, 0.08), innerMaterial);
    chestOpening.position.set(0, 0.79, -0.4);
    chestOpening.rotation.copy(torso.rotation);
    const crackedChestEdge = new Mesh(new BoxGeometry(0.74, 0.055, 0.095), edgeMaterial);
    crackedChestEdge.position.set(0, 1.1, -0.4);
    crackedChestEdge.rotation.copy(torso.rotation);
    const lowerChestEdge = new Mesh(new BoxGeometry(0.68, 0.055, 0.095), edgeMaterial);
    lowerChestEdge.position.set(0, 0.47, -0.4);
    lowerChestEdge.rotation.copy(torso.rotation);
    const leftChestEdge = new Mesh(new BoxGeometry(0.055, 0.58, 0.095), edgeMaterial);
    leftChestEdge.position.set(-0.37, 0.78, -0.4);
    leftChestEdge.rotation.copy(torso.rotation);
    const rightChestEdge = leftChestEdge.clone();
    rightChestEdge.position.x = 0.37;

    const corpse = new Group();
    corpse.position.set(0, 0.78, -0.47);
    corpse.rotation.copy(torso.rotation);
    const corpseTorso = new Mesh(new SphereGeometry(0.24, 14, 10), corpseMaterial);
    corpseTorso.scale.set(1.15, 1.55, 0.42);
    corpseTorso.position.set(0, -0.03, -0.015);
    const corpseHead = new Mesh(new SphereGeometry(0.12, 12, 8), corpseMaterial);
    corpseHead.scale.set(0.9, 1.05, 0.7);
    corpseHead.position.set(0.03, 0.31, -0.02);
    const corpseLeftArm = new Mesh(new CylinderGeometry(0.035, 0.045, 0.42, 8), corpseMaterial);
    corpseLeftArm.position.set(-0.2, -0.02, -0.01);
    corpseLeftArm.rotation.z = 0.55;
    const corpseRightArm = corpseLeftArm.clone();
    corpseRightArm.position.x = 0.2;
    corpseRightArm.rotation.z = -0.55;
    const corpseRib = new Mesh(new BoxGeometry(0.34, 0.035, 0.025), toothMaterial);
    corpseRib.position.set(0, 0.08, -0.13);
    const corpseRibTwo = corpseRib.clone();
    corpseRibTwo.position.y = -0.02;
    const cavityStain = new Mesh(new SphereGeometry(0.24, 12, 8), stainMaterial);
    cavityStain.scale.set(1.45, 1.0, 0.12);
    cavityStain.position.set(0, -0.08, -0.15);
    corpse.add(cavityStain, corpseTorso, corpseHead, corpseLeftArm, corpseRightArm, corpseRib, corpseRibTwo);

    const bowTie = new Group();
    bowTie.position.set(0, 1.14, -0.34);
    bowTie.rotation.copy(torso.rotation);
    const bowCenter = new Mesh(new BoxGeometry(0.12, 0.12, 0.045), purpleMaterial);
    const bowLeft = new Mesh(new BoxGeometry(0.22, 0.16, 0.045), purpleMaterial);
    bowLeft.position.x = -0.16;
    bowLeft.rotation.z = 0.3;
    const bowRight = new Mesh(new BoxGeometry(0.22, 0.16, 0.045), purpleMaterial);
    bowRight.position.x = 0.16;
    bowRight.rotation.z = -0.3;
    const bowStain = new Mesh(new BoxGeometry(0.18, 0.05, 0.048), stainMaterial);
    bowStain.position.set(0.02, -0.02, -0.003);
    bowTie.add(bowLeft, bowRight, bowCenter, bowStain);

    const addLimb = (px: number, py: number, pz: number, rx: number, ry: number, rz: number, length: number, radius = 0.13): Mesh => {
      const limb = new Mesh(new CylinderGeometry(radius * 0.82, radius, length, 12), wornShellMaterial);
      limb.position.set(px, py, pz);
      limb.rotation.set(rx, ry, rz);
      heap.add(limb);
      return limb;
    };
    const shoulderLeft = new Mesh(new BoxGeometry(0.22, 0.24, 0.26), shellMaterial);
    shoulderLeft.position.set(-0.56, 0.96, -0.22);
    shoulderLeft.rotation.copy(torso.rotation);
    const shoulderRight = new Mesh(new BoxGeometry(0.22, 0.24, 0.26), shellMaterial);
    shoulderRight.position.set(0.56, 0.96, -0.22);
    shoulderRight.rotation.copy(torso.rotation);
    addLimb(-0.63, 0.64, -0.1, 0.08, 0.0, -0.12, 0.58, 0.11);
    addLimb(0.63, 0.64, -0.1, 0.08, 0.0, 0.12, 0.58, 0.11);
    addLimb(-0.64, 0.3, 0.02, -0.12, 0.0, 0.1, 0.52, 0.1);
    addLimb(0.64, 0.3, 0.02, -0.12, 0.0, -0.1, 0.52, 0.1);
    const leftHand = new Mesh(new BoxGeometry(0.18, 0.12, 0.2), wornShellMaterial);
    leftHand.position.set(-0.63, 0.04, 0.09);
    leftHand.rotation.set(0.08, 0.1, -0.12);
    const rightHand = new Mesh(new BoxGeometry(0.18, 0.12, 0.2), wornShellMaterial);
    rightHand.position.set(0.63, 0.04, 0.09);
    rightHand.rotation.set(0.08, -0.1, 0.12);
    const voiceTape = new Group();
    voiceTape.position.set(-0.82, 0.065, 0.26);
    voiceTape.rotation.set(0.02, -0.24, 0.08);
    const recorderBody = new Mesh(new BoxGeometry(0.48, 0.09, 0.3), new MeshStandardMaterial({ color: 0x17191d, roughness: 0.58, metalness: 0.18 }));
    const cassetteWindow = new Mesh(new BoxGeometry(0.28, 0.018, 0.16), new MeshStandardMaterial({ color: 0x302a22, roughness: 0.62, metalness: 0.04 }));
    cassetteWindow.position.set(0, 0.055, -0.015);
    const leftReel = new Mesh(new CylinderGeometry(0.055, 0.055, 0.018, 14), metalMaterial);
    leftReel.position.set(-0.09, 0.075, -0.015);
    const rightReel = leftReel.clone();
    rightReel.position.x = 0.09;
    const redRecordButton = new Mesh(new CylinderGeometry(0.035, 0.035, 0.018, 10), stainMaterial);
    redRecordButton.position.set(0.18, 0.075, 0.105);
    const playButton = new Mesh(new BoxGeometry(0.07, 0.018, 0.045), new MeshStandardMaterial({ color: 0xb8bdc0, roughness: 0.42, metalness: 0.28 }));
    playButton.position.set(0.06, 0.075, 0.11);
    const tapeLabel = new Mesh(new PlaneGeometry(0.34, 0.105), createVoiceTapeLabelMaterial());
    tapeLabel.rotation.x = -Math.PI / 2;
    tapeLabel.position.set(-0.02, 0.093, -0.105);
    voiceTape.add(recorderBody, cassetteWindow, leftReel, rightReel, redRecordButton, playButton, tapeLabel);
    [-0.18, -0.11, -0.04].forEach((lineX) => {
      const grille = new Mesh(new BoxGeometry(0.018, 0.015, 0.12), blackMetalMaterial);
      grille.position.set(lineX, 0.078, 0.085);
      voiceTape.add(grille);
    });
    addLimb(-0.24, 0.14, 0.74, 1.57, -0.04, -0.04, 1.08, 0.14);
    addLimb(0.24, 0.14, 0.74, 1.57, 0.04, 0.04, 1.08, 0.14);
    addLimb(-0.25, 0.13, 1.34, 1.57, 0.03, 0.04, 0.74, 0.12);
    addLimb(0.25, 0.13, 1.34, 1.57, -0.03, -0.04, 0.74, 0.12);
    const leftFoot = new Mesh(new BoxGeometry(0.26, 0.14, 0.32), wornShellMaterial);
    leftFoot.position.set(-0.25, 0.09, 1.77);
    leftFoot.rotation.y = -0.08;
    const rightFoot = new Mesh(new BoxGeometry(0.26, 0.14, 0.32), wornShellMaterial);
    rightFoot.position.set(0.25, 0.09, 1.77);
    rightFoot.rotation.y = 0.08;

    const detachedHead = new Group();
    detachedHead.position.set(0.88, 0.22, 0.7);
    detachedHead.rotation.set(0.64, 2.26, 0.12);
    const head = new Mesh(new SphereGeometry(0.34, 16, 12), shellMaterial);
    head.scale.set(1.0, 0.82, 0.9);
    const snout = new Mesh(new BoxGeometry(0.34, 0.18, 0.22), wornShellMaterial);
    snout.position.set(0, -0.03, -0.28);
    const leftEye = new Mesh(new SphereGeometry(0.035, 8, 6), eyeMaterial);
    leftEye.position.set(-0.11, 0.08, -0.31);
    const rightEye = new Mesh(new SphereGeometry(0.035, 8, 6), eyeMaterial);
    rightEye.position.set(0.11, 0.08, -0.31);
    const tooth = new Mesh(new BoxGeometry(0.05, 0.08, 0.025), toothMaterial);
    tooth.position.set(0, -0.15, -0.4);
    const jawGap = new Mesh(new BoxGeometry(0.3, 0.055, 0.035), innerMaterial);
    jawGap.position.set(0, -0.12, -0.38);
    const earLeft = new Mesh(new BoxGeometry(0.14, 0.62, 0.12), shellMaterial);
    earLeft.position.set(-0.17, 0.44, 0);
    earLeft.rotation.z = -0.28;
    const earRight = new Mesh(new BoxGeometry(0.14, 0.46, 0.12), wornShellMaterial);
    earRight.position.set(0.18, 0.32, 0.02);
    earRight.rotation.z = 0.48;
    detachedHead.add(head, snout, leftEye, rightEye, tooth, jawGap, earLeft, earRight);

    const stainOne = new Mesh(new CylinderGeometry(0.18, 0.22, 0.018, 16), stainMaterial);
    stainOne.position.set(0, 0.66, -0.46);
    stainOne.rotation.x = Math.PI / 2;
    stainOne.scale.set(1.35, 0.7, 1);
    const stainTwo = new Mesh(new CylinderGeometry(0.11, 0.15, 0.014, 14), stainMaterial);
    stainTwo.position.set(0.82, 0.035, 0.02);
    stainTwo.rotation.x = Math.PI / 2;
    stainTwo.scale.set(1.5, 0.75, 1);
    const wallSmear = new Mesh(new BoxGeometry(0.5, 0.16, 0.025), stainMaterial);
    wallSmear.position.set(-0.18, 0.83, -0.44);
    wallSmear.rotation.copy(torso.rotation);
    const floorStreak = new Mesh(new BoxGeometry(0.78, 0.012, 0.12), stainMaterial);
    floorStreak.position.set(0.08, 0.012, 0.98);
    floorStreak.rotation.y = 0.08;

    heap.add(
      backContactPlate,
      torso,
      pelvis,
      neckStub,
      chestOpening,
      corpse,
      crackedChestEdge,
      lowerChestEdge,
      leftChestEdge,
      rightChestEdge,
      bowTie,
      shoulderLeft,
      shoulderRight,
      leftHand,
      rightHand,
      voiceTape,
      detachedHead,
      leftFoot,
      rightFoot,
      stainOne,
      stainTwo,
      wallSmear,
      floorStreak,
    );
    root.add(heap);
  };

  const addFloor = (x: number, z: number, width: number, depth: number, material: MeshStandardMaterial): void => {
    addBox(root, width, 0.12, depth, x, -0.06, z, material);
  };

  const addCheckeredFloor = (x: number, z: number, width: number, depth: number): void => {
    addBox(root, width, 0.08, depth, x, -0.035, z, checkeredFloorMaterial);
  };

  const raisedSurfaces: ChapterNineRaisedSurface[] = [];

  const addMarkerStage = (): void => {
    const minX = -24.11;
    const maxX = -15.08;
    const minZ = 12.96;
    const maxZ = 29.01;
    const width = maxX - minX;
    const depth = maxZ - minZ;
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const stageHeight = 0.72;
    const platform = addBox(root, width, stageHeight, depth, centerX, stageHeight / 2, centerZ, darkWoodMaterial);
    platform.name = 'Chapter 9 marker corner stage';
    const top = addBox(root, width - 0.24, 0.08, depth - 0.24, centerX, stageHeight + 0.04, centerZ, carpetMaterial);
    top.name = 'Chapter 9 marker corner stage top';
    addBox(root, width + 0.14, 0.22, 0.18, centerX, stageHeight + 0.11, minZ + 0.09, woodMaterial);
    addBox(root, width + 0.14, 0.22, 0.18, centerX, stageHeight + 0.11, maxZ - 0.09, woodMaterial);
    addBox(root, 0.18, 0.22, depth + 0.14, minX + 0.09, stageHeight + 0.11, centerZ, woodMaterial);
    addBox(root, 0.18, 0.22, depth + 0.14, maxX - 0.09, stageHeight + 0.11, centerZ, woodMaterial);
    const curtainMaterial = new MeshStandardMaterial({
      color: 0x68121d,
      emissive: 0x100104,
      emissiveIntensity: 0.08,
      roughness: 0.92,
      metalness: 0.01,
    });
    const curtainFoldMaterial = new MeshStandardMaterial({
      color: 0x3d0810,
      emissive: 0x090002,
      emissiveIntensity: 0.06,
      roughness: 0.96,
      metalness: 0.01,
    });
    const addCurtainPanel = (x: number, y: number, z: number, panelWidth: number, panelHeight: number, panelDepth: number, material: MeshStandardMaterial): void => {
      const panel = new Mesh(new BoxGeometry(panelWidth, panelHeight, panelDepth), material);
      panel.position.set(x, y, z);
      panel.name = 'Chapter 9 Foxy stage curtain';
      root.add(panel);
    };
    const curtainHeight = 4.7;
    const curtainY = stageHeight + curtainHeight / 2;
    addCurtainPanel(centerX, curtainY, minZ + 0.18, width + 0.44, curtainHeight, 0.24, curtainMaterial);
    for (let index = 0; index < 10; index += 1) {
      const foldX = minX + 0.32 + index * ((width - 0.64) / 9);
      addCurtainPanel(foldX, curtainY, minZ + 0.34, 0.18, curtainHeight, 0.18, index % 2 === 0 ? curtainFoldMaterial : curtainMaterial);
    }
    addCurtainPanel(centerX, curtainY, maxZ - 0.28, width + 0.44, curtainHeight, 0.24, curtainMaterial);
    for (let index = 0; index < 10; index += 1) {
      const foldX = minX + 0.32 + index * ((width - 0.64) / 9);
      addCurtainPanel(foldX, curtainY, maxZ - 0.44, 0.18, curtainHeight, 0.18, index % 2 === 0 ? curtainFoldMaterial : curtainMaterial);
    }
    addCurtainPanel(maxX - 0.16, curtainY, centerZ, 0.3, curtainHeight, depth - 0.34, curtainMaterial);
    for (let index = 0; index < 6; index += 1) {
      addCurtainPanel(maxX - 0.34, curtainY, minZ + 1.0 + index * ((depth - 2.0) / 5), 0.18, curtainHeight, 0.2, curtainFoldMaterial);
    }

    const staticFoxy = new Group();
    staticFoxy.name = 'Static Foxy on Chapter 9 marker stage';
    staticFoxy.position.set(centerX, stageHeight + 0.1, centerZ - 0.8);
    staticFoxy.rotation.y = -Math.PI / 2;
    const foxyMaterial = new MeshStandardMaterial({ color: 0x9a3128, roughness: 0.48, metalness: 0.22 });
    const foxyDarkMaterial = new MeshStandardMaterial({ color: 0x151313, roughness: 0.62, metalness: 0.28 });
    const foxyBellyMaterial = new MeshStandardMaterial({ color: 0xcaa578, roughness: 0.62, metalness: 0.08 });
    const foxyEyeMaterial = new MeshBasicMaterial({ color: 0xfff3ce });
    const foxyToothMaterial = new MeshStandardMaterial({ color: 0xf2ead0, roughness: 0.42 });

    const body = new Mesh(new SphereGeometry(0.74, 28, 18), foxyMaterial);
    body.scale.set(0.66, 1.18, 0.5);
    body.position.y = 1.48;
    const belly = new Mesh(new SphereGeometry(0.42, 20, 14), foxyBellyMaterial);
    belly.scale.set(0.78, 1.0, 0.22);
    belly.position.set(0, 1.34, 0.43);
    const head = new Group();
    head.position.y = 2.64;
    const skull = new Mesh(new SphereGeometry(0.62, 28, 18), foxyMaterial);
    skull.scale.set(0.82, 0.94, 0.74);
    const brow = new Mesh(new BoxGeometry(0.62, 0.12, 0.1), foxyDarkMaterial);
    brow.position.set(0, 0.22, 0.54);
    brow.rotation.x = -0.12;
    const muzzle = new Mesh(new SphereGeometry(0.28, 18, 12), foxyBellyMaterial);
    muzzle.scale.set(1.58, 0.54, 1.24);
    muzzle.position.set(0, -0.14, 0.52);
    const snout = new Mesh(new ConeGeometry(0.26, 0.62, 12), foxyMaterial);
    snout.position.set(0, -0.08, 0.78);
    snout.rotation.x = Math.PI / 2;
    const leftCheek = new Mesh(new SphereGeometry(0.15, 14, 8), foxyBellyMaterial);
    leftCheek.scale.set(1.25, 0.68, 0.45);
    leftCheek.position.set(-0.24, -0.15, 0.58);
    const rightCheek = leftCheek.clone();
    rightCheek.position.x = 0.24;
    const nose = new Mesh(new SphereGeometry(0.075, 12, 8), foxyDarkMaterial);
    nose.scale.set(1.22, 0.7, 0.72);
    nose.position.set(0, -0.04, 0.92);
    const jaw = new Mesh(new SphereGeometry(0.28, 16, 10), foxyMaterial);
    jaw.scale.set(1.28, 0.34, 0.7);
    jaw.position.set(0, -0.38, 0.42);
    const lowerJawPlate = new Mesh(new BoxGeometry(0.52, 0.08, 0.3), foxyBellyMaterial);
    lowerJawPlate.position.set(0, -0.31, 0.64);
    const leftEye = new Mesh(new SphereGeometry(0.078, 12, 8), foxyEyeMaterial);
    leftEye.position.set(-0.22, 0.1, 0.54);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.22;
    const eyePatch = new Mesh(new BoxGeometry(0.28, 0.16, 0.04), foxyDarkMaterial);
    eyePatch.position.set(-0.22, 0.1, 0.58);
    const leftEar = new Mesh(new ConeGeometry(0.18, 0.58, 8), foxyMaterial);
    leftEar.position.set(-0.34, 0.52, -0.04);
    leftEar.rotation.z = 0.22;
    const rightEar = leftEar.clone();
    rightEar.position.x = 0.34;
    rightEar.rotation.z = -0.22;
    [-0.18, -0.06, 0.06, 0.18].forEach((toothX) => {
      const tooth = new Mesh(new BoxGeometry(0.045, 0.13, 0.045), foxyToothMaterial);
      tooth.position.set(toothX, -0.22, 0.68);
      head.add(tooth);
    });
    head.add(skull, brow, muzzle, snout, leftCheek, rightCheek, nose, jaw, lowerJawPlate, leftEye, rightEye, eyePatch, leftEar, rightEar);

    const makeArm = (side: -1 | 1): Group => {
      const arm = new Group();
      arm.position.set(side * 0.64, 1.82, 0);
      arm.rotation.z = side * 0.1;
      const shoulderSocket = new Mesh(new SphereGeometry(0.19, 16, 10), metalMaterial);
      shoulderSocket.position.set(0, 0.04, 0);
      const shoulderCurve = new Mesh(new CylinderGeometry(0.11, 0.15, 0.44, 14), foxyMaterial);
      shoulderCurve.position.set(-side * 0.18, -0.02, 0);
      shoulderCurve.rotation.z = Math.PI / 2;
      const upper = new Mesh(new CylinderGeometry(0.13, 0.16, 0.62, 14), foxyMaterial);
      upper.position.y = -0.3;
      const elbow = new Mesh(new SphereGeometry(0.16, 14, 10), metalMaterial);
      elbow.position.y = -0.62;
      const lower = new Mesh(new CylinderGeometry(0.12, 0.14, 0.58, 14), foxyMaterial);
      lower.position.y = -0.94;
      const wrist = new Mesh(new SphereGeometry(0.12, 12, 8), metalMaterial);
      wrist.position.y = -1.18;
      const hand = new Group();
      hand.position.y = -1.32;
      if (side > 0) {
        const palm = new Mesh(new SphereGeometry(0.16, 14, 10), foxyMaterial);
        palm.scale.set(1.0, 0.8, 0.72);
        hand.add(palm);
        [-0.12, 0, 0.12].forEach((fingerX) => {
          const finger = new Mesh(new CylinderGeometry(0.035, 0.045, 0.24, 8), foxyMaterial);
          finger.position.set(fingerX, -0.15, 0.03);
          finger.rotation.z = fingerX * -1.8;
          hand.add(finger);
        });
      } else {
        const hook = new Mesh(new TorusGeometry(0.17, 0.035, 8, 18, Math.PI * 1.35), metalMaterial);
        hook.rotation.z = Math.PI * 1.05;
        hook.rotation.x = 0.25;
        const hookBase = new Mesh(new CylinderGeometry(0.08, 0.1, 0.22, 12), metalMaterial);
        hookBase.position.y = 0.08;
        hand.add(hookBase, hook);
      }
      arm.add(shoulderCurve, shoulderSocket, upper, elbow, lower, wrist, hand);
      return arm;
    };
    const makeLeg = (side: -1 | 1): Group => {
      const leg = new Group();
      leg.position.set(side * 0.26, 0.74, 0);
      const upper = new Mesh(new CylinderGeometry(0.14, 0.16, 0.58, 14), foxyMaterial);
      upper.position.y = -0.26;
      const knee = new Mesh(new SphereGeometry(0.16, 14, 10), metalMaterial);
      knee.position.y = -0.56;
      const lower = new Mesh(new CylinderGeometry(0.13, 0.15, 0.56, 14), foxyMaterial);
      lower.position.y = -0.86;
      const foot = new Mesh(new SphereGeometry(0.23, 14, 10), foxyMaterial);
      foot.scale.set(1.0, 0.38, 1.42);
      foot.position.set(0, -1.18, 0.16);
      [-0.12, 0, 0.12].forEach((toeX) => {
        const toe = new Mesh(new ConeGeometry(0.045, 0.18, 8), foxyToothMaterial);
        toe.position.set(toeX, -1.2, 0.48);
        toe.rotation.x = Math.PI / 2;
        leg.add(toe);
      });
      leg.add(upper, knee, lower, foot);
      return leg;
    };
    staticFoxy.add(body, belly, head, makeArm(-1), makeArm(1), makeLeg(-1), makeLeg(1));
    root.add(staticFoxy);
    raisedSurfaces.push({
      centerX,
      centerZ,
      halfWidth: width / 2,
      halfDepth: depth / 2,
      floorY: GAME_CONFIG.player.height + stageHeight + 0.08,
    });
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
  addMarkerStage();
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
  addAngledWall(-14.575, 10.9, -14.39, 10.55, WALL_THICKNESS * 0.08);
  addAngledWall(-14.39, 10.55, -12.03, 8.73);
  addCurvedWall(-14.575, 10.9, -14.71, 10.78, -14.86, 10.66, 3);
  addAngledWall(-14.86, 10.66, -28.64, 12.46, WALL_THICKNESS * 0.08);
  addAngledWall(-28.71, 12.36, -44.48, 2.60, WALL_THICKNESS * 0.08);
  addWall(-51.81, 12.205, WALL_THICKNESS, 18.59);
  addAngledWall(-44.17, 2.38, -41.37, -10.17, WALL_THICKNESS * 0.08);
  addAngledWall(-41.29, -10.33, -31.43, -18.10, WALL_THICKNESS * 0.08);
  addCurvedWall(-31.43, -18.10, -31.28, -18.2, -31.12, -18.28, 3);
  addAngledWall(-31.12, -18.28, -28.96, -18.94, WALL_THICKNESS * 0.08);
  addAngledWall(-23.55, -21.22, -19.97, -22.98, WALL_THICKNESS * 0.08);
  addAngledWall(-20.27, -23.18, -30.14, -29.56, WALL_THICKNESS * 0.08);
  addAngledWall(-30.39, -29.55, -38.91, -25.87, WALL_THICKNESS * 0.08);
  addCurvedWall(-38.91, -25.87, -39.03, -25.77, -39.16, -25.67, 3);
  addAngledWall(-39.16, -25.67, -46.42, -18.79, WALL_THICKNESS * 0.08);
  addCurvedWall(-46.42, -18.79, -46.62, -18.65, -46.85, -18.54, 3);
  addAngledWall(-46.85, -18.54, -52.60, -13.63, WALL_THICKNESS * 0.08);
  addWall(-52.545, -24.525, WALL_THICKNESS, 20.95);
  addWall(-42.31, -35.01, 20.4, WALL_THICKNESS);
  addWall(-32.15, -41.035, WALL_THICKNESS, 12.03);
  addWall(-27.33, -47.035, 9.72, WALL_THICKNESS);
  addWall(-22.445, -56.255, WALL_THICKNESS, 18.47);
  addTrampolinePark(-64.57, -22.83, -65.36, -47.47, 5, 2);
  addTrampolineSafetyNet(-32.93, -47.27, -58.62, -47.08);
  addRockClimbingWall();
  {
    const openingLeftX = -29.07;
    const openingLeftZ = -18.89;
    const openingRightX = -23.72;
    const openingRightZ = -21.15;
    const openingTopY = 4.03;
    const dx = openingRightX - openingLeftX;
    const dz = openingRightZ - openingLeftZ;
    const headerWidth = Math.hypot(dx, dz) + WALL_THICKNESS * 0.18;
    const headerHeight = Math.max(0.1, WALL_HEIGHT - openingTopY);
    const header = new Mesh(
      new BoxGeometry(headerWidth, headerHeight, WALL_THICKNESS),
      createInteriorWallMaterialFor(headerWidth, headerHeight, openingTopY),
    );
    header.position.set((openingLeftX + openingRightX) / 2, openingTopY + headerHeight / 2, (openingLeftZ + openingRightZ) / 2);
    header.rotation.y = Math.atan2(-dz, dx);
    root.add(header);

    const fillerStartX = openingRightX;
    const fillerStartZ = openingRightZ;
    const fillerEndX = -23.55;
    const fillerEndZ = -21.22;
    const fillerDx = fillerEndX - fillerStartX;
    const fillerDz = fillerEndZ - fillerStartZ;
    const fillerWidth = Math.hypot(fillerDx, fillerDz) + WALL_THICKNESS * 0.18;
    const filler = new Mesh(
      new BoxGeometry(fillerWidth, headerHeight, WALL_THICKNESS),
      createInteriorWallMaterialFor(fillerWidth, headerHeight, openingTopY, headerWidth / WALL_HEIGHT),
    );
    filler.position.set((fillerStartX + fillerEndX) / 2, openingTopY + headerHeight / 2, (fillerStartZ + fillerEndZ) / 2);
    filler.rotation.y = Math.atan2(-fillerDz, fillerDx);
    root.add(filler);
  }
  addCurvedWall(-14.16, 23.96, -14.59, 23.5, -14.59, 23.03, 6, customAngledWallLength / WALL_HEIGHT);
  addAngledWall(4.33, 29.67, 4.39, 14.98);
  addAngledWall(-5.55, 14.98, 0.27, 15.09);
  addAngledWall(-5.77, 14.95, -5.55, 14.98, WALL_THICKNESS * 0.08);
  addAngledWall(-5.77, 14.95, -9.75, 6.94);
  addAngledWall(-6.16, 14.82, -9.09, 15.05);
  addCurvedWall(-5.77, 14.95, -5.98, 14.99, -6.16, 14.82, 3);
  addCurvedWall(-9.09, 15.05, -9.04, 15.28, -8.87, 15.38, 3);
  addAngledWall(-8.87, 15.38, -8.96, 19.07);
  addAngledWall(-10.04, 7.13, -9.75, 6.94);
  addAngledCountertop(-8.96, 19.07, -14.21, 18.77);
  addCashRegister(-12.82, 1.17, 18.99, Math.atan2(-(18.77 - 19.07), -14.21 - -8.96) + Math.PI);
  addWallShelf(-14.34, 2.04, 16.02, 1);
  addWallShelf(-14.34, 3.44, 16.12, 1);

  const keycardPickup = new Group();
  keycardPickup.position.set(-10.72, 1.25, 18.98);
  keycardPickup.rotation.y = 0.08;
  const keycardBase = new Mesh(new BoxGeometry(0.46, 0.025, 0.3), new MeshStandardMaterial({ color: 0xb62632, roughness: 0.42, metalness: 0.06 }));
  const keycardStripe = new Mesh(new BoxGeometry(0.42, 0.028, 0.085), new MeshStandardMaterial({ color: 0x2352b7, roughness: 0.38, metalness: 0.08 }));
  keycardStripe.position.set(0, 0.016, -0.07);
  const keycardChip = new Mesh(new BoxGeometry(0.09, 0.03, 0.08), new MeshStandardMaterial({ color: 0xd3b356, roughness: 0.32, metalness: 0.42 }));
  keycardChip.position.set(-0.13, 0.02, 0.06);
  keycardPickup.add(keycardBase, keycardStripe, keycardChip);
  root.add(keycardPickup);
  const keycardPickupPosition = new Vector3(-10.72, GAME_CONFIG.player.height, 18.98);

  const createKeycardGate = (centerX: number, centerZ: number, rotationY: number, label: string, openDirection: 1 | -1) => {
    const gate = new Group();
    gate.position.set(centerX, 0, centerZ);
    gate.rotation.y = rotationY;

    const scannerMaterial = new MeshStandardMaterial({
      color: 0x17252b,
      emissive: 0x1acb78,
      emissiveIntensity: 0.35,
      roughness: 0.36,
      metalness: 0.18,
    });
    const scannerGlassMaterial = new MeshStandardMaterial({
      color: 0x95f0d2,
      emissive: 0x2ff0aa,
      emissiveIntensity: 0.7,
      roughness: 0.14,
      metalness: 0.02,
    });
    const postMaterial = new MeshStandardMaterial({ color: 0x414950, roughness: 0.42, metalness: 0.42 });
    const armMaterial = new MeshStandardMaterial({ color: 0xc2c7c9, roughness: 0.28, metalness: 0.56 });

    const addScannerPost = (x: number, label: string): Group => {
      const post = new Group();
      post.position.set(x, 0, 0);
      const base = new Mesh(new BoxGeometry(0.32, 0.12, 0.48), blackMetalMaterial);
      base.position.y = 0.06;
      const body = new Mesh(new BoxGeometry(0.26, 1.32, 0.36), postMaterial);
      body.position.y = 0.72;
      const scanner = new Mesh(new BoxGeometry(0.3, 0.14, 0.3), scannerMaterial);
      scanner.position.set(0, 1.48, -0.04);
      scanner.rotation.x = -0.16;
      const glass = new Mesh(new BoxGeometry(0.16, 0.018, 0.15), scannerGlassMaterial);
      glass.position.set(0, 1.555, -0.15);
      glass.rotation.x = -0.16;
      const labelMaterial = createKeycardGateLabelMaterial(label);
      const labelPlate = new Mesh(new PlaneGeometry(0.28, 0.16), labelMaterial);
      labelPlate.position.set(0, 1.14, -0.185);
      labelPlate.rotation.x = -0.1;
      const backLabelPlate = new Mesh(new PlaneGeometry(0.28, 0.16), labelMaterial);
      backLabelPlate.position.set(0, 1.14, 0.185);
      backLabelPlate.rotation.set(-0.1, Math.PI, 0);
      post.add(base, body, scanner, glass, labelPlate, backLabelPlate);
      return post;
    };

    const gateWidth = 1.98;
    const postX = 0.86;
    const armPivotX = 0.72;
    const armLength = 1.38;
    const leftPost = addScannerPost(-postX, label);
    const rightPost = addScannerPost(postX, label);
    const leftArmPivot = new Group();
    leftArmPivot.position.set(-armPivotX, 1.02, 0.03);
    const rightArmPivot = new Group();
    rightArmPivot.position.set(armPivotX, 1.02, 0.03);
    const leftArm = new Mesh(new BoxGeometry(armLength, 0.075, 0.075), armMaterial);
    leftArm.position.x = armLength / 2;
    const rightArm = new Mesh(new BoxGeometry(armLength, 0.075, 0.075), armMaterial);
    rightArm.position.x = -armLength / 2;
    leftArmPivot.add(leftArm);
    rightArmPivot.add(rightArm);
    gate.add(leftPost, rightPost, leftArmPivot, rightArmPivot);
    root.add(gate);

    const collider = addCollider(colliders, centerX, centerZ, gateWidth, 0.38);
    collider.rotationY = rotationY;
    return {
      collider,
      interactPosition: new Vector3(centerX, GAME_CONFIG.player.height, centerZ),
      leftArmPivot,
      rightArmPivot,
      scannerMaterial,
      scannerGlassMaterial,
      openDirection,
      open: false,
      timer: 0,
      progress: 0,
    };
  };
  const keycardGates = [
    createKeycardGate(1.26, 15.05, 0, 'In', 1),
    createKeycardGate(3.42, 15.05, 0, 'Out', -1),
  ];

  const sideDoor = (() => {
    const leftX = -12.03;
    const leftZ = 8.73;
    const rightX = -10.04;
    const rightZ = 7.13;
    const centerX = (leftX + rightX) / 2;
    const centerZ = (leftZ + rightZ) / 2;
    const width = Math.hypot(rightX - leftX, rightZ - leftZ) - 0.18;
    const height = 2.95;
    const thickness = 0.16;
    const rotationY = Math.atan2(-(rightZ - leftZ), rightX - leftX);
    const hingeX = centerX + Math.cos(rotationY) * width * 0.5;
    const hingeZ = centerZ - Math.sin(rotationY) * width * 0.5;
    const doorMaterial = new MeshStandardMaterial({ color: 0x4c3322, roughness: 0.78, metalness: 0.04 });
    const trimMaterial = new MeshStandardMaterial({ color: 0x251911, roughness: 0.84, metalness: 0.08 });
    const handleMaterial = new MeshStandardMaterial({ color: 0xa48a4c, roughness: 0.42, metalness: 0.36 });
    const headerBottomY = height + 0.18;
    const headerHeight = Math.max(0.1, WALL_HEIGHT - headerBottomY);
    const wallHeader = new Mesh(
      new BoxGeometry(width + 0.64, headerHeight, WALL_THICKNESS),
      createInteriorWallMaterialFor(width + 0.64, headerHeight, headerBottomY),
    );
    wallHeader.position.set(centerX, headerBottomY + headerHeight / 2, centerZ);
    wallHeader.rotation.y = rotationY;
    root.add(wallHeader);

    const frame = new Group();
    frame.position.set(centerX, 0, centerZ);
    frame.rotation.y = rotationY;
    const leftPost = new Mesh(new BoxGeometry(0.14, height + 0.26, 0.22), trimMaterial);
    leftPost.position.set(-width / 2 - 0.08, (height + 0.26) / 2, 0);
    const rightPost = leftPost.clone();
    rightPost.position.x = width / 2 + 0.08;
    const topPost = new Mesh(new BoxGeometry(width + 0.42, 0.18, 0.24), trimMaterial);
    topPost.position.set(0, height + 0.08, 0);
    frame.add(leftPost, rightPost, topPost);
    root.add(frame);

    const swing = new Group();
    swing.position.set(hingeX, 0, hingeZ);
    swing.rotation.y = rotationY;
    const slab = new Mesh(new BoxGeometry(width, height, thickness), doorMaterial);
    slab.position.set(-width / 2, height / 2, 0);
    const inset = new Mesh(new BoxGeometry(width - 0.28, height - 0.52, 0.035), new MeshStandardMaterial({ color: 0x66472f, roughness: 0.82 }));
    inset.position.set(-width / 2, height / 2, -thickness / 2 - 0.02);
    const employeesOnlySign = new Mesh(new PlaneGeometry(0.92, 0.42), createSignMaterial('EMPLOYEES', 'ONLY', '#f2d9a2'));
    employeesOnlySign.position.set(-width / 2, height * 0.68, -thickness / 2 - 0.09);
    employeesOnlySign.rotation.y = Math.PI;
    const handle = new Mesh(new SphereGeometry(0.085, 12, 8), handleMaterial);
    handle.position.set(-width * 0.78, height * 0.5, -thickness / 2 - 0.08);
    const backHandle = handle.clone();
    backHandle.position.z = thickness / 2 + 0.08;
    swing.add(slab, inset, employeesOnlySign, handle, backHandle);
    root.add(swing);

    const collider = addCollider(colliders, centerX, centerZ, width + 0.1, thickness + 0.08);
    collider.rotationY = rotationY;
    return {
      swing,
      collider,
      centerX,
      centerZ,
      interactPosition: new Vector3(centerX, GAME_CONFIG.player.height, centerZ),
      rotationY,
    };
  })();

  const collapsedAnimatronicRotation = -1.1115926535897938;
  addCollapsedAnimatronic(-7.2, 13.06, collapsedAnimatronicRotation);
  const voiceTapeInteractPosition = new Vector3(-0.82, 0, 0.26)
    .applyAxisAngle(new Vector3(0, 1, 0), collapsedAnimatronicRotation)
    .add(new Vector3(-7.2, GAME_CONFIG.player.height, 13.06));
  const collapsedAnimatronicLanding = {
    centerX: -7.5,
    centerZ: 13.2,
    rotationY: collapsedAnimatronicRotation,
    halfWidth: 0.48,
    halfDepth: 0.58,
    floorY: GAME_CONFIG.player.height + 0.42,
  };
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

  const addStrengthTester = (x: number, z: number, rotationY = 0): void => {
    const game = new Group();
    game.position.set(x, 0, z);
    game.rotation.y = rotationY;
    strengthTesterRoot = game;

    const redPaint = new MeshStandardMaterial({ color: 0xa7262b, roughness: 0.6, metalness: 0.05 });
    const markerMaterial = new MeshStandardMaterial({ color: 0xf1e85c, emissive: 0x4b4100, emissiveIntensity: 0.25, roughness: 0.38 });
    const bellMaterial = new MeshStandardMaterial({ color: 0xd5ae43, emissive: 0x443000, emissiveIntensity: 0.22, roughness: 0.32, metalness: 0.42 });

    const base = new Mesh(new BoxGeometry(2.7, 0.2, 2.05), woodMaterial);
    base.position.set(0, 0.1, 0);
    const frontTrim = new Mesh(new BoxGeometry(2.8, 0.28, 0.18), redPaint);
    frontTrim.position.set(0, 0.28, 0.98);
    const strikeButton = new Mesh(new CylinderGeometry(0.58, 0.58, 0.08, 32), topButtonMaterial);
    strikeButton.position.set(0, 0.16, 0.42);
    strikeButton.rotation.x = Math.PI / 2;
    strengthTesterPad = strikeButton;

    const towerBack = new Mesh(new BoxGeometry(0.62, 5.95, 0.2), darkWoodMaterial);
    towerBack.position.set(0, 3.14, -0.76);
    const leftRail = new Mesh(new CylinderGeometry(0.055, 0.055, 5.8, 12), metalMaterial);
    leftRail.position.set(-0.3, 3.15, -0.56);
    const rightRail = leftRail.clone();
    rightRail.position.x = 0.3;
    const tubeGlass = new Mesh(new BoxGeometry(0.42, 5.2, 0.08), glassMaterial);
    tubeGlass.position.set(0, 3.0, -0.45);

    const tickMaterial = new MeshStandardMaterial({ color: 0xf6f0d8, roughness: 0.66 });
    for (let index = 0; index < 7; index += 1) {
      const tick = new Mesh(new BoxGeometry(index % 2 === 0 ? 0.68 : 0.45, 0.045, 0.06), tickMaterial);
      tick.position.set(0, 0.75 + index * 0.72, -0.37);
      game.add(tick);
    }

    const marker = new Mesh(new SphereGeometry(0.17, 18, 12), markerMaterial);
    marker.position.set(0, 0.74, -0.28);
    strengthTesterMarker = marker;

    const bell = new Mesh(new CylinderGeometry(0.36, 0.48, 0.34, 28), bellMaterial);
    bell.position.set(0, 6.18, -0.74);
    bell.rotation.x = Math.PI;
    strengthTesterBell = bell;
    const bellClapper = new Mesh(new SphereGeometry(0.1, 14, 10), metalMaterial);
    bellClapper.position.set(0, 5.95, -0.74);

    const sign = new Mesh(new PlaneGeometry(2.1, 0.62), createSignMaterial('HIGH STRIKER', 'ring the bell', '#7a151b'));
    sign.position.set(0, 5.1, -0.33);

    const hammerPivot = new Group();
    hammerPivot.position.set(0.82, 0.29, 0.56);
    hammerPivot.rotation.y = -0.35;
    const handle = new Mesh(new BoxGeometry(0.14, 0.14, 1.18), woodMaterial);
    handle.position.set(0, 0, 0.12);
    const head = new Mesh(new BoxGeometry(0.78, 0.3, 0.3), metalMaterial);
    head.position.set(0, 0.02, -0.58);
    const grip = new Mesh(new BoxGeometry(0.18, 0.18, 0.24), blackMetalMaterial);
    grip.position.set(0, 0, 0.82);
    hammerPivot.add(handle, head, grip);
    strengthTesterHammer = hammerPivot;
    const rope = new Mesh(new CylinderGeometry(0.025, 0.025, 1, 8), ropeMaterial);
    strengthTesterRope = rope;

    game.add(
      base,
      frontTrim,
      strikeButton,
      towerBack,
      leftRail,
      rightRail,
      tubeGlass,
      marker,
      bell,
      bellClapper,
      sign,
      hammerPivot,
    );
    root.add(game);
    root.add(rope);
    colliders.push({
      centerX: x,
      centerZ: z,
      halfWidth: 1.35,
      halfDepth: 1.0,
      rotationY,
    });
  };
  const addShooterGame = (x: number, z: number, rotationY = 0): void => {
    const game = new Group();
    game.position.set(x, 0, z);
    game.rotation.y = rotationY;

    const cabinetMaterial = new MeshStandardMaterial({ color: 0x1b2634, roughness: 0.58, metalness: 0.08 });
    const redPlastic = new MeshStandardMaterial({ color: 0xa51f2d, roughness: 0.52, metalness: 0.05 });
    const bluePlastic = new MeshStandardMaterial({ color: 0x244fa5, roughness: 0.52, metalness: 0.05 });
    const targetScreenMaterial = makeCanvasMaterial((context, canvas) => {
      const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#151f33');
      gradient.addColorStop(1, '#070b12');
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#2f5e35';
      context.fillRect(0, canvas.height * 0.62, canvas.width, canvas.height * 0.38);
      context.fillStyle = '#d7c987';
      context.fillRect(0, canvas.height * 0.58, canvas.width, 22);
      context.fillStyle = '#f5f0d0';
      context.font = 'bold 28px Arial';
      context.textAlign = 'center';
      context.fillText('TARGET BLAST', canvas.width / 2, 44);
      const targets = [
        [130, 104, '#e13a43'],
        [265, 138, '#f0cf34'],
        [390, 96, '#52b8e8'],
        [190, 188, '#f1f1f1'],
        [335, 205, '#e13a43'],
      ] as const;
      targets.forEach(([targetX, targetY, color]) => {
        context.fillStyle = color;
        context.beginPath();
        context.arc(targetX, targetY, 24, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = '#111';
        context.lineWidth = 5;
        context.stroke();
        context.strokeStyle = '#fff';
        context.lineWidth = 4;
        context.beginPath();
        context.arc(targetX, targetY, 11, 0, Math.PI * 2);
        context.stroke();
      });
    });

    const tvBody = new Mesh(new BoxGeometry(4.1, 2.7, 0.42), cabinetMaterial);
    tvBody.position.set(0, 2.25, -0.48);
    const tvScreen = new Mesh(new PlaneGeometry(3.45, 1.92), targetScreenMaterial);
    tvScreen.position.set(0, 2.3, -0.25);
    const counter = new Mesh(new BoxGeometry(4.5, 0.55, 1.55), cabinetMaterial);
    counter.position.set(0, 0.72, 0.55);
    const counterTop = new Mesh(new BoxGeometry(4.65, 0.14, 1.7), blackMetalMaterial);
    counterTop.position.set(0, 1.05, 0.55);
    const coinSlot = new Mesh(new BoxGeometry(0.58, 0.32, 0.06), metalMaterial);
    coinSlot.position.set(0, 1.23, 1.42);
    const legMaterial = new MeshStandardMaterial({ color: 0x20252a, roughness: 0.5, metalness: 0.36 });
    [-1.92, 1.92].forEach((legX) => {
      [-0.08, 1.08].forEach((legZ) => {
        const leg = new Mesh(new BoxGeometry(0.16, 0.9, 0.16), legMaterial);
        leg.position.set(legX, 0.45, legZ);
        const foot = new Mesh(new BoxGeometry(0.34, 0.06, 0.34), blackMetalMaterial);
        foot.position.set(legX, 0.03, legZ);
        game.add(leg, foot);
      });
    });

    const addGun = (gunX: number, material: MeshStandardMaterial): void => {
      const gun = new Group();
      gun.position.set(gunX, 1.24, 0.56);
      gun.rotation.x = -0.22;
      const grip = new Mesh(new BoxGeometry(0.22, 0.5, 0.18), blackMetalMaterial);
      grip.position.set(0, -0.18, 0.28);
      grip.rotation.x = 0.45;
      const body = new Mesh(new BoxGeometry(0.34, 0.22, 0.58), material);
      body.position.set(0, 0.02, 0.02);
      const barrel = new Mesh(new CylinderGeometry(0.07, 0.07, 0.75, 14), metalMaterial);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.04, -0.43);
      const cord = new Mesh(new CylinderGeometry(0.025, 0.025, 0.86, 8), blackMetalMaterial);
      cord.rotation.x = Math.PI / 2;
      cord.position.set(0, -0.12, 0.58);
      gun.add(grip, body, barrel, cord);
      game.add(gun);
    };
    addGun(-0.82, redPlastic);
    addGun(0.82, bluePlastic);

    const title = new Mesh(new PlaneGeometry(3.65, 0.48), createSignMaterial('SHOOTER', '2 players', '#58bdf0'));
    title.position.set(0, 3.95, -0.23);

    game.add(tvBody, tvScreen, counter, counterTop, coinSlot, title);
    root.add(game);
    colliders.push({
      centerX: x,
      centerZ: z,
      halfWidth: 2.27,
      halfDepth: 1.02,
      rotationY,
    });
  };

  const addAirHockeyTable = (x: number, z: number, rotationY = 0): void => {
    const table = new Group();
    table.position.set(x, 0, z);
    table.rotation.y = rotationY;

    const sideMaterial = new MeshStandardMaterial({ color: 0x26313c, roughness: 0.58, metalness: 0.08 });
    const surfaceMaterial = new MeshStandardMaterial({ color: 0xe9eef2, roughness: 0.38, metalness: 0.04 });
    const redMaterial = new MeshStandardMaterial({ color: 0xc3252f, roughness: 0.48 });
    const blueMaterial = new MeshStandardMaterial({ color: 0x245fc7, roughness: 0.48 });

    const base = new Mesh(new BoxGeometry(5.4, 0.82, 2.75), sideMaterial);
    base.position.y = 0.52;
    const top = new Mesh(new BoxGeometry(5.25, 0.12, 2.6), surfaceMaterial);
    top.position.y = 1.0;
    const centerLine = new Mesh(new BoxGeometry(0.05, 0.035, 2.32), redMaterial);
    centerLine.position.y = 1.08;
    const centerCircle = new Mesh(new TorusGeometry(0.55, 0.025, 8, 32), blueMaterial);
    centerCircle.position.y = 1.1;
    centerCircle.rotation.x = Math.PI / 2;
    const leftGoal = new Mesh(new BoxGeometry(0.14, 0.14, 1.2), redMaterial);
    leftGoal.position.set(-2.58, 1.16, 0);
    const rightGoal = new Mesh(new BoxGeometry(0.14, 0.14, 1.2), blueMaterial);
    rightGoal.position.set(2.58, 1.16, 0);
    const puck = new Mesh(new CylinderGeometry(0.18, 0.18, 0.08, 22), blackMetalMaterial);
    puck.position.set(0.35, 1.15, 0.18);
    const redPaddle = new Mesh(new CylinderGeometry(0.28, 0.28, 0.16, 24), redMaterial);
    redPaddle.position.set(-1.42, 1.18, -0.48);
    const bluePaddle = new Mesh(new CylinderGeometry(0.28, 0.28, 0.16, 24), blueMaterial);
    bluePaddle.position.set(1.42, 1.18, 0.48);

    [-2.25, 2.25].forEach((legX) => {
      [-1.04, 1.04].forEach((legZ) => {
        const leg = new Mesh(new BoxGeometry(0.2, 0.88, 0.2), blackMetalMaterial);
        leg.position.set(legX, 0.36, legZ);
        table.add(leg);
      });
    });

    table.add(base, top, centerLine, centerCircle, leftGoal, rightGoal, puck, redPaddle, bluePaddle);
    root.add(table);
    colliders.push({
      centerX: x,
      centerZ: z,
      halfWidth: 2.66,
      halfDepth: 1.36,
      rotationY,
    });
  };

  const addDualSpeaker = (x: number, y: number, z: number, rotationY = 0): void => {
    const speaker = new Group();
    speaker.position.set(x, y, z);
    speaker.rotation.y = rotationY;
    const speakerMaterial = new MeshStandardMaterial({ color: 0x101114, roughness: 0.54, metalness: 0.12 });
    const coneMaterial = new MeshStandardMaterial({ color: 0x30343a, roughness: 0.5, metalness: 0.2 });
    const rimMaterial = new MeshStandardMaterial({ color: 0x050607, roughness: 0.5, metalness: 0.24 });

    const wallPlate = new Mesh(new BoxGeometry(1.7, 1.0, 0.08), metalMaterial);
    wallPlate.position.set(0, 0.12, 0.04);
    speaker.add(wallPlate);

    [-0.34, 0.34].forEach((offsetX, index) => {
      const bar = new Mesh(new CylinderGeometry(0.045, 0.045, 0.95, 10), metalMaterial);
      bar.position.set(offsetX, 0.12, 0.44);
      bar.rotation.x = Math.PI / 2;
      bar.rotation.z = index === 0 ? 0.22 : -0.22;
      speaker.add(bar);
    });

    [-0.38, 0.38].forEach((offsetX, index) => {
      const cabinet = new Group();
      cabinet.position.set(offsetX, 0, 0.84);
      cabinet.rotation.y = index === 0 ? -0.24 : 0.24;
      const body = new Mesh(new BoxGeometry(0.72, 1.34, 0.42), speakerMaterial);
      const upperCone = new Mesh(new CylinderGeometry(0.2, 0.28, 0.08, 24), coneMaterial);
      upperCone.rotation.x = Math.PI / 2;
      upperCone.position.set(0, 0.28, 0.24);
      const lowerCone = upperCone.clone();
      lowerCone.position.y = -0.28;
      const upperRim = new Mesh(new TorusGeometry(0.29, 0.035, 8, 24), rimMaterial);
      upperRim.position.set(0, 0.28, 0.285);
      const lowerRim = upperRim.clone();
      lowerRim.position.y = -0.28;
      cabinet.add(body, upperCone, lowerCone, upperRim, lowerRim);
      speaker.add(cabinet);
    });

    root.add(speaker);
  };

  const addArcadeAttractionCollider = (
    x: number,
    z: number,
    halfWidth: number,
    halfDepth: number,
    rotationY: number,
  ): void => {
    colliders.push({
      centerX: x,
      centerZ: z,
      halfWidth,
      halfDepth,
      rotationY,
    });
  };

  const addClawMachine = (x: number, z: number, rotationY = 0): void => {
    const machine = new Group();
    machine.position.set(x, 0, z);
    machine.rotation.y = rotationY;
    const redFrame = new MeshStandardMaterial({ color: 0xb82838, roughness: 0.5, metalness: 0.08 });
    const base = new Mesh(new BoxGeometry(2.25, 0.9, 1.42), redFrame);
    base.position.y = 0.45;
    const glassBox = new Mesh(new BoxGeometry(2.05, 1.9, 1.22), glassMaterial);
    glassBox.position.y = 1.84;
    const top = new Mesh(new BoxGeometry(2.25, 0.34, 1.42), redFrame);
    top.position.y = 2.95;
    const joystick = new Mesh(new CylinderGeometry(0.055, 0.055, 0.42, 10), blackMetalMaterial);
    joystick.position.set(-0.62, 1.03, 0.78);
    joystick.rotation.x = 0.35;
    const button = new Mesh(new CylinderGeometry(0.12, 0.12, 0.07, 18), topButtonMaterial);
    button.position.set(0.52, 1.0, 0.79);
    button.rotation.x = Math.PI / 2;
    [-0.58, 0, 0.58].forEach((prizeX, index) => {
      const prize = new Mesh(new SphereGeometry(0.2, 14, 10), new MeshStandardMaterial({ color: [0xf4d35e, 0x66b8e8, 0xd85b8a][index], roughness: 0.6 }));
      prize.scale.set(1.0, 0.8, 0.78);
      prize.position.set(prizeX, 1.08, 0.08 - index * 0.22);
      machine.add(prize);
    });
    const clawRail = new Mesh(new BoxGeometry(1.4, 0.05, 0.08), metalMaterial);
    clawRail.position.set(0, 2.62, 0);
    const clawCable = new Mesh(new CylinderGeometry(0.025, 0.025, 0.54, 8), metalMaterial);
    clawCable.position.set(0.35, 2.33, 0);
    const clawHub = new Mesh(new SphereGeometry(0.08, 10, 8), metalMaterial);
    clawHub.position.set(0.35, 2.05, 0);
    [-0.12, 0, 0.12].forEach((clawX) => {
      const claw = new Mesh(new BoxGeometry(0.035, 0.28, 0.035), metalMaterial);
      claw.position.set(0.35 + clawX, 1.9, 0.02);
      claw.rotation.z = clawX * 2.2;
      machine.add(claw);
    });
    const sign = new Mesh(new PlaneGeometry(1.7, 0.42), createSignMaterial('CLAW', 'PRIZES', '#f7d76b'));
    sign.position.set(0, 3.2, 0.73);
    machine.add(base, glassBox, top, joystick, button, clawRail, clawCable, clawHub, sign);
    root.add(machine);
    addArcadeAttractionCollider(x, z, 1.14, 0.72, rotationY);
  };

  const addBoxingMachine = (x: number, z: number, rotationY = 0): void => {
    const game = new Group();
    game.position.set(x, 0, z);
    game.rotation.y = rotationY;
    const cabinet = new MeshStandardMaterial({ color: 0x2a1f24, roughness: 0.62, metalness: 0.08 });
    const base = new Mesh(new BoxGeometry(1.55, 1.05, 1.2), cabinet);
    base.position.y = 0.52;
    const post = new Mesh(new CylinderGeometry(0.1, 0.13, 2.25, 14), blackMetalMaterial);
    post.position.y = 1.85;
    const bag = new Mesh(new SphereGeometry(0.35, 18, 12), new MeshStandardMaterial({ color: 0xa3242f, roughness: 0.74 }));
    bag.scale.set(0.82, 1.18, 0.82);
    bag.position.set(0, 2.86, 0.42);
    const score = new Mesh(new PlaneGeometry(1.18, 0.58), createSignMaterial('PUNCH', '000', '#ff5a5a'));
    score.position.set(0, 2.24, 0.61);
    game.add(base, post, bag, score);
    root.add(game);
    addArcadeAttractionCollider(x, z, 0.82, 0.64, rotationY);
  };

  const addBasketballShot = (x: number, z: number, rotationY = 0): void => {
    const game = new Group();
    game.position.set(x, 0, z);
    game.rotation.y = rotationY;
    const railMaterial = new MeshStandardMaterial({ color: 0x1d2730, roughness: 0.6, metalness: 0.25 });
    const ramp = new Mesh(new BoxGeometry(2.0, 0.18, 3.1), new MeshStandardMaterial({ color: 0x354458, roughness: 0.7 }));
    ramp.position.set(0, 0.55, 0.35);
    ramp.rotation.x = -0.15;
    const backboard = new Mesh(new BoxGeometry(1.7, 1.1, 0.12), new MeshStandardMaterial({ color: 0xe8edf0, roughness: 0.5 }));
    backboard.position.set(0, 2.35, -1.12);
    const rim = new Mesh(new TorusGeometry(0.28, 0.025, 8, 26), new MeshStandardMaterial({ color: 0xd85824, roughness: 0.4 }));
    rim.position.set(0, 1.86, -0.82);
    rim.rotation.x = Math.PI / 2;
    [-0.78, 0.78].forEach((railX) => {
      const rail = new Mesh(new BoxGeometry(0.08, 0.75, 3.2), railMaterial);
      rail.position.set(railX, 0.88, 0.32);
      game.add(rail);
    });
    [-0.42, 0.28].forEach((ballX, index) => {
      const ball = new Mesh(new SphereGeometry(0.18, 16, 10), new MeshStandardMaterial({ color: 0xc76a25, roughness: 0.62 }));
      ball.position.set(ballX, 0.84, 1.22 - index * 0.34);
      game.add(ball);
    });
    game.add(ramp, backboard, rim);
    root.add(game);
    addArcadeAttractionCollider(x, z, 1.04, 1.58, rotationY);
  };

  const addSkeeBallLane = (x: number, z: number, rotationY = 0): void => {
    const lane = new Group();
    lane.position.set(x, 0, z);
    lane.rotation.y = rotationY;
    const woodLane = new MeshStandardMaterial({ color: 0x8b5d35, roughness: 0.72 });
    const ramp = new Mesh(new BoxGeometry(1.55, 0.22, 3.5), woodLane);
    ramp.position.set(0, 0.48, 0.28);
    ramp.rotation.x = -0.12;
    const targetBoard = new Mesh(new BoxGeometry(1.68, 1.45, 0.22), new MeshStandardMaterial({ color: 0x26415e, roughness: 0.58 }));
    targetBoard.position.set(0, 1.28, -1.62);
    [0.18, 0.32, 0.46].forEach((radius, index) => {
      const ring = new Mesh(new TorusGeometry(radius, 0.02, 8, 28), new MeshStandardMaterial({ color: [0xf5d35f, 0xf07b3f, 0xf7f7f7][index], roughness: 0.5 }));
      ring.position.set(0, 1.46 - index * 0.34, -1.48);
      lane.add(ring);
    });
    [-0.34, 0.28].forEach((ballX) => {
      const ball = new Mesh(new SphereGeometry(0.15, 14, 10), new MeshStandardMaterial({ color: 0x222831, roughness: 0.35, metalness: 0.16 }));
      ball.position.set(ballX, 0.72, 1.42);
      lane.add(ball);
    });
    lane.add(ramp, targetBoard);
    root.add(lane);
    addArcadeAttractionCollider(x, z, 0.86, 1.78, rotationY);
  };

  const addWhackMoleTable = (x: number, z: number, rotationY = 0): void => {
    const table = new Group();
    table.position.set(x, 0, z);
    table.rotation.y = rotationY;
    const body = new Mesh(new BoxGeometry(2.4, 0.9, 1.55), new MeshStandardMaterial({ color: 0x315c45, roughness: 0.66 }));
    body.position.y = 0.48;
    const top = new Mesh(new BoxGeometry(2.5, 0.12, 1.65), new MeshStandardMaterial({ color: 0x3f7a55, roughness: 0.58 }));
    top.position.y = 0.98;
    const mallet = new Group();
    mallet.position.set(0.78, 1.16, 0.45);
    mallet.rotation.z = -0.55;
    const handle = new Mesh(new CylinderGeometry(0.035, 0.04, 0.78, 8), woodMaterial);
    const head = new Mesh(new CylinderGeometry(0.16, 0.16, 0.42, 14), new MeshStandardMaterial({ color: 0xc9b28a, roughness: 0.72 }));
    head.rotation.z = Math.PI / 2;
    head.position.y = 0.38;
    mallet.add(handle, head);
    [-0.68, 0, 0.68].forEach((holeX, row) => {
      [-0.32, 0.38].forEach((holeZ, column) => {
        const hole = new Mesh(new CylinderGeometry(0.18, 0.18, 0.045, 18), blackMetalMaterial);
        hole.position.set(holeX, 1.07, holeZ);
        const mole = new Mesh(new SphereGeometry(0.13, 12, 8), new MeshStandardMaterial({ color: 0x6d412a, roughness: 0.72 }));
        mole.position.set(holeX, 1.18 + ((row + column) % 2) * 0.08, holeZ);
        table.add(hole, mole);
      });
    });
    table.add(body, top, mallet);
    root.add(table);
    addArcadeAttractionCollider(x, z, 1.24, 0.82, rotationY);
  };

  const addRacingSimulator = (x: number, z: number, rotationY = 0): void => {
    const game = new Group();
    game.position.set(x, 0, z);
    game.rotation.y = rotationY;
    const shellMaterial = new MeshStandardMaterial({ color: 0x1f3f7f, roughness: 0.52, metalness: 0.08 });
    const seat = new Mesh(new BoxGeometry(1.25, 0.46, 1.05), shellMaterial);
    seat.position.set(0, 0.42, 0.72);
    seat.rotation.x = -0.2;
    const seatBack = new Mesh(new BoxGeometry(1.25, 1.05, 0.22), shellMaterial);
    seatBack.position.set(0, 0.94, 1.18);
    seatBack.rotation.x = -0.34;
    const dash = new Mesh(new BoxGeometry(1.55, 0.62, 0.58), blackMetalMaterial);
    dash.position.set(0, 1.0, -0.22);
    const screen = new Mesh(new PlaneGeometry(1.55, 0.9), createSignMaterial('RACE', 'READY', '#77c9ff'));
    screen.position.set(0, 1.85, -0.54);
    const wheel = new Mesh(new TorusGeometry(0.28, 0.035, 10, 28), blackMetalMaterial);
    wheel.position.set(0, 1.2, 0.18);
    wheel.rotation.x = Math.PI / 2.4;
    const pedal = new Mesh(new BoxGeometry(0.52, 0.06, 0.22), metalMaterial);
    pedal.position.set(0, 0.12, -0.08);
    game.add(seat, seatBack, dash, screen, wheel, pedal);
    root.add(game);
    addArcadeAttractionCollider(x, z, 0.9, 1.18, rotationY);
  };

  const addDancePadGame = (x: number, z: number, rotationY = 0): void => {
    const game = new Group();
    game.position.set(x, 0, z);
    game.rotation.y = rotationY;
    const screen = new Mesh(new BoxGeometry(2.1, 2.45, 0.36), new MeshStandardMaterial({ color: 0x181e2d, roughness: 0.55 }));
    screen.position.set(0, 1.6, -0.86);
    const screenFace = new Mesh(new PlaneGeometry(1.65, 1.12), createSignMaterial('DANCE', 'STEP', '#f062c0'));
    screenFace.position.set(0, 1.78, -0.66);
    const poleLeft = new Mesh(new CylinderGeometry(0.055, 0.055, 1.55, 10), metalMaterial);
    poleLeft.position.set(-0.72, 0.8, 0.5);
    const poleRight = poleLeft.clone();
    poleRight.position.x = 0.72;
    const rail = new Mesh(new BoxGeometry(1.55, 0.08, 0.08), metalMaterial);
    rail.position.set(0, 1.48, 0.5);
    [-0.42, 0.42].forEach((padX) => {
      [-0.1, 0.62].forEach((padZ, index) => {
        const pad = new Mesh(new BoxGeometry(0.58, 0.08, 0.58), new MeshStandardMaterial({ color: index === 0 ? 0x35a6d8 : 0xd8357c, roughness: 0.5, metalness: 0.08 }));
        pad.position.set(padX, 0.05, padZ);
        game.add(pad);
      });
    });
    game.add(screen, screenFace, poleLeft, poleRight, rail);
    root.add(game);
    addArcadeAttractionCollider(x, z, 1.08, 1.2, rotationY);
  };

  const addPhotoBooth = (x: number, z: number, rotationY = 0): void => {
    const booth = new Group();
    booth.position.set(x, 0, z);
    booth.rotation.y = rotationY;
    const boothMaterial = new MeshStandardMaterial({ color: 0x5b2246, roughness: 0.68 });
    const body = new Mesh(new BoxGeometry(2.0, 2.8, 1.35), boothMaterial);
    body.position.y = 1.4;
    const curtain = new Mesh(new BoxGeometry(1.28, 1.82, 0.08), new MeshStandardMaterial({ color: 0x2b1025, roughness: 0.86 }));
    curtain.position.set(0, 1.26, 0.72);
    const camera = new Mesh(new CylinderGeometry(0.14, 0.18, 0.16, 16), blackMetalMaterial);
    camera.position.set(0, 2.15, 0.78);
    camera.rotation.x = Math.PI / 2;
    const sign = new Mesh(new PlaneGeometry(1.55, 0.42), createSignMaterial('PHOTO', 'BOOTH', '#ffb8df'));
    sign.position.set(0, 2.72, 0.75);
    booth.add(body, curtain, camera, sign);
    root.add(booth);
    addArcadeAttractionCollider(x, z, 1.02, 0.7, rotationY);
  };
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
  addStrengthTester(strengthTesterPosition.x, strengthTesterPosition.z, strengthTesterRotationY);
  addShooterGame(-63.08, 16.92, Math.PI / 2);
  addAirHockeyTable(-61.19, 9, Math.PI / 2);
  addDualSpeaker(-64.77, 6.34, 8.01, Math.PI / 2);
  addDualSpeaker(-64.77, 5, -41.23, Math.PI / 2);
  addDualSpeaker(-39.73, 4.55, 29.77, Math.PI);
  addClawMachine(-52.62, 4.15, -Math.PI / 2);
  addWhackMoleTable(-52.62, 8.45, -Math.PI / 2);
  addSkeeBallLane(-52.58, 13.55, -Math.PI / 2);
  addBasketballShot(-52.58, 18.75, -Math.PI / 2);
  addBoxingMachine(-63.62, -7.6, Math.PI / 2);
  addPhotoBooth(-63.62, -2.9, Math.PI / 2);
  addRacingSimulator(-63.5, 3.0, Math.PI / 2);
  addDancePadGame(-56.55, 28.82, Math.PI);

  const seatedChairs: ChapterNineSeat[] = [];
  const addSitChair = (id: string, label: string, x: number, z: number, rotationY: number): void => {
    const chair = new Group();
    chair.position.set(x, 0, z);
    chair.rotation.y = rotationY;

    const seat = new Mesh(new BoxGeometry(0.92, 0.22, 0.86), woodMaterial);
    seat.position.y = 0.62;
    const cushion = new Mesh(new BoxGeometry(0.78, 0.08, 0.68), new MeshStandardMaterial({ color: 0x65462e, roughness: 0.82 }));
    cushion.position.y = 0.78;
    const back = new Mesh(new BoxGeometry(0.98, 1.08, 0.18), darkWoodMaterial);
    back.position.set(0, 1.13, -0.48);
    const backInset = new Mesh(new BoxGeometry(0.68, 0.72, 0.05), new MeshStandardMaterial({ color: 0x7a5636, roughness: 0.8 }));
    backInset.position.set(0, 1.18, -0.585);
    const frontRail = new Mesh(new BoxGeometry(0.9, 0.12, 0.12), darkWoodMaterial);
    frontRail.position.set(0, 0.48, 0.38);
    const sideRailLeft = new Mesh(new BoxGeometry(0.1, 0.12, 0.78), darkWoodMaterial);
    sideRailLeft.position.set(-0.43, 0.48, 0);
    const sideRailRight = sideRailLeft.clone();
    sideRailRight.position.x = 0.43;

    [
      [-0.34, 0.29],
      [0.34, 0.29],
      [-0.34, -0.34],
      [0.34, -0.34],
    ].forEach(([legX, legZ]) => {
      const leg = new Mesh(new BoxGeometry(0.14, 0.76, 0.14), darkWoodMaterial);
      leg.position.set(legX, 0.28, legZ);
      chair.add(leg);
    });

    chair.add(seat, cushion, back, backInset, frontRail, sideRailLeft, sideRailRight);
    root.add(chair);
    colliders.push({
      centerX: x,
      centerZ: z,
      halfWidth: 0.52,
      halfDepth: 0.5,
      rotationY,
    });

    const forward = new Vector3(Math.sin(rotationY), 0, Math.cos(rotationY));
    seatedChairs.push({
      id,
      label,
      interactPosition: new Vector3(x, GAME_CONFIG.player.height, z),
      sitPosition: new Vector3(x + forward.x * 0.08, GAME_CONFIG.player.height, z + forward.z * 0.08),
      lookTarget: new Vector3(x + forward.x * 4, 1.45, z + forward.z * 4),
    });
  };
  const addSitChairRow = (
    idPrefix: string,
    label: string,
    startX: number,
    startZ: number,
    endX: number,
    endZ: number,
    rotationY: number,
  ): void => {
    const length = Math.hypot(endX - startX, endZ - startZ);
    const count = Math.max(2, Math.floor(length / 1.55) + 1);
    for (let index = 0; index < count; index += 1) {
      const t = count === 1 ? 0 : index / (count - 1);
      const x = startX + (endX - startX) * t;
      const z = startZ + (endZ - startZ) * t;
      addSitChair(`${idPrefix}-${index + 1}`, label, x, z, rotationY);
    }
  };

  addSitChair('front-chair-1', 'front wall chair', -3.25, 28.8, Math.PI);
  addSitChair('front-chair-2', 'front wall chair', -5.98, 28.92, Math.PI);
  addSitChair('front-left-chair-1', 'angled wall chair', -8.81, 27.99, 2.55);
  addSitChair('front-left-chair-2', 'angled wall chair', -10.73, 25.98, 2.32);
  addSitChair('right-wall-chair-1', 'right wall chair', 3.19, 26.22, -Math.PI / 2);
  addSitChair('right-wall-chair-2', 'right wall chair', 2.96, 22.86, -Math.PI / 2);
  addSitChair('right-wall-chair-3', 'right wall chair', 2.93, 20.29, -Math.PI / 2);
  addSitChairRow('left-auditorium-row-1', 'left side chair row', -31.7, 15.73, -31.62, 26.34, Math.PI / 2);
  addSitChairRow('left-auditorium-row-2', 'left side chair row', -36.98, 14.27, -36.83, 26.32, Math.PI / 2);
  addSitChairRow('left-auditorium-row-3', 'left side chair row', -42.23, 26.35, -42.32, 10.93, Math.PI / 2);
  addSitChairRow('left-auditorium-row-4', 'left side chair row', -47.72, 8.48, -47.77, 26.31, Math.PI / 2);

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
  let sideDoorOpen = false;
  let sideDoorMotionTime = 0;
  let sideDoorMotionFrom = 0;
  let sideDoorMotionTo = 0;
  let sideDoorProgress = 0;
  let keycardCollected = false;

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

  const setSideDoorProgress = (progress: number): void => {
    const clamped = Math.max(0, Math.min(1, progress));
    const eased = clamped * clamped * (3 - 2 * clamped);
    const bounce = sideDoorOpen ? Math.sin(clamped * Math.PI * 4) * (1 - clamped) * 0.1 : 0;
    sideDoor.swing.rotation.y = sideDoor.rotationY + (eased + bounce) * Math.PI / 2.45;
    sideDoor.collider.enabled = clamped < 0.72;
    sideDoorProgress = clamped;
  };

  const toggleSideDoor = (): void => {
    sideDoorOpen = !sideDoorOpen;
    sideDoorMotionFrom = sideDoorProgress;
    sideDoorMotionTo = sideDoorOpen ? 1 : 0;
    sideDoorMotionTime = 0;
  };

  const updateSideDoor = (deltaSeconds: number): void => {
    if (Math.abs(sideDoorProgress - sideDoorMotionTo) < 0.001) {
      setSideDoorProgress(sideDoorMotionTo);
      return;
    }
    sideDoorMotionTime = Math.min(0.9, sideDoorMotionTime + deltaSeconds);
    const t = sideDoorMotionTime / 0.9;
    setSideDoorProgress(sideDoorMotionFrom + (sideDoorMotionTo - sideDoorMotionFrom) * t);
  };

  const setKeycardGateProgress = (gate: (typeof keycardGates)[number], progress: number): void => {
    const clamped = Math.max(0, Math.min(1, progress));
    const eased = clamped * clamped * (3 - 2 * clamped);
    gate.leftArmPivot.rotation.y = gate.openDirection * -eased * Math.PI / 2;
    gate.rightArmPivot.rotation.y = gate.openDirection * eased * Math.PI / 2;
    gate.collider.enabled = clamped < 0.72;
    gate.progress = clamped;
  };

  const openKeycardGate = (gate: (typeof keycardGates)[number]): void => {
    gate.open = true;
    gate.timer = 3.2;
  };

  const updateKeycardGate = (deltaSeconds: number): void => {
    keycardGates.forEach((gate) => {
      if (gate.open) {
        gate.timer = Math.max(0, gate.timer - deltaSeconds);
        setKeycardGateProgress(gate, Math.min(1, gate.progress + deltaSeconds * 2.4));
        if (gate.timer <= 0) {
          gate.open = false;
        }
      } else {
        setKeycardGateProgress(gate, Math.max(0, gate.progress - deltaSeconds * 2.1));
      }
      const active = gate.open || gate.progress > 0.05;
      gate.scannerMaterial.emissiveIntensity = active ? 1.35 : 0.35;
      gate.scannerGlassMaterial.emissiveIntensity = active ? 1.8 : 0.7;
    });
  };

  const getAimedKeycardGate = (
    playerPosition: Vector3,
    aimOrigin?: Vector3,
    aimDirection?: Vector3,
  ): (typeof keycardGates)[number] | null => {
    const candidates = keycardGates.filter((gate) => {
      return playerPosition.distanceTo(gate.interactPosition) <= GAME_CONFIG.player.interactionRange + 0.75;
    });
    if (candidates.length === 0) {
      return null;
    }
    if (!aimOrigin || !aimDirection || aimDirection.lengthSq() < 0.0001) {
      return candidates.sort((a, b) => {
        return a.interactPosition.distanceTo(playerPosition) - b.interactPosition.distanceTo(playerPosition);
      })[0];
    }

    const forward = aimDirection.clone().normalize();
    const aimed = candidates
      .map((gate) => {
        const toGate = gate.interactPosition.clone().sub(aimOrigin);
        const along = toGate.dot(forward);
        if (along <= 0.15) {
          return null;
        }
        const closestPoint = aimOrigin.clone().addScaledVector(forward, along);
        const missDistance = closestPoint.distanceTo(gate.interactPosition);
        return {
          gate,
          missDistance,
          score: missDistance + playerPosition.distanceTo(gate.interactPosition) * 0.035,
        };
      })
      .filter((entry): entry is { gate: (typeof keycardGates)[number]; missDistance: number; score: number } => Boolean(entry))
      .filter((entry) => entry.missDistance <= 0.95)
      .sort((a, b) => a.score - b.score)[0];

    return aimed?.gate ?? null;
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

  const updateStrengthTesterRope = (playerPosition?: Vector3): void => {
    if (!strengthTesterRoot || !strengthTesterHammer || !strengthTesterRope) {
      return;
    }

    const anchor = strengthTesterRoot.localToWorld(new Vector3(0.72, 0.34, 0.9));
    const hammerWorld = strengthTesterHammerPickedUp && playerPosition
      ? playerPosition.clone().add(new Vector3(0.34, -0.72, 0.16))
      : strengthTesterHammer.localToWorld(new Vector3(0, 0, 0.82));
    const midpoint = anchor.clone().lerp(hammerWorld, 0.5);
    const direction = hammerWorld.clone().sub(anchor);
    const length = Math.max(0.001, direction.length());
    strengthTesterRope.position.copy(midpoint);
    strengthTesterRope.scale.set(1, length, 1);
    strengthTesterRope.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
  };

  const updateStrengthTesterHammerVisual = (playerPosition: Vector3): void => {
    if (!strengthTesterRoot || !strengthTesterHammer) {
      return;
    }

    if (strengthTesterHammerPickedUp) {
      const localHand = strengthTesterRoot.worldToLocal(playerPosition.clone().add(new Vector3(0.45, -0.74, 0.12)));
      strengthTesterHammer.position.copy(localHand);
      strengthTesterHammer.rotation.set(0.15, -0.2, -0.38);
      return;
    }

    strengthTesterHammer.position.set(0.82, 0.29, 0.56);
    strengthTesterHammer.rotation.set(0, -0.35, 0);
  };

  const startStrengthTesterStrike = (playerPosition: Vector3): ChapterNineInteractionResult | null => {
    if (!strengthTesterHammerPickedUp) {
      return null;
    }

    if (playerPosition.distanceTo(strengthTesterInteractPosition) > GAME_CONFIG.player.interactionRange + 0.95) {
      return {
        message: 'Move closer to the flat button before swinging the hammer.',
      };
    }

    strengthTesterTimer = 1.65;
    return {
      message: 'You swing the hammer forward into the flat button. The marker shoots to the top. Ding ding ding!',
    };
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
    sideDoorOpen = false;
    sideDoorMotionTime = 0;
    sideDoorMotionFrom = 0;
    sideDoorMotionTo = 0;
    setSideDoorProgress(0);
    keycardCollected = false;
    keycardPickup.visible = true;
    keycardGates.forEach((gate) => {
      gate.open = false;
      gate.timer = 0;
      setKeycardGateProgress(gate, 0);
      gate.scannerMaterial.emissiveIntensity = 0.35;
      gate.scannerGlassMaterial.emissiveIntensity = 0.7;
    });
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
    strengthTesterHammerView.visible = false;
    redDot.visible = false;
    screenRecLight.visible = false;
    rockWallHarnessed = false;
    rockWallLowering = false;
    rockWallClimbX = 0;
    rockWallClimbY = 0;
    rockWallButtonPressTime = 0;
    updateRockWallTopButton(0);
    strengthTesterTimer = 0;
    strengthTesterHammerPickedUp = false;
    if (strengthTesterHammer) {
      strengthTesterHammer.position.set(0.82, 0.29, 0.56);
      strengthTesterHammer.rotation.set(0, -0.35, 0);
    }
    if (strengthTesterPad) {
      strengthTesterPad.position.y = 0.16;
    }
    if (strengthTesterMarker) {
      strengthTesterMarker.position.y = 0.74;
    }
    if (strengthTesterBell) {
      strengthTesterBell.rotation.z = 0;
    }
    if (rockWallHarnessRoot) {
      rockWallHarnessRoot.visible = true;
    }
    updateRockWallRope();
    updateStrengthTesterRope();
  };

  reset();

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    shoulderCamera,
    strengthTesterHammerView,
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
      updateSideDoor(deltaSeconds);
      updateKeycardGate(deltaSeconds);
      animatronics.forEach((bot) => moveAnimatronic(bot, deltaSeconds, playerPosition));
      const recordingBlink = cameraRecording && Math.sin(phaseTime * 11) > -0.2;
      redDot.visible = recordingBlink;
      screenRecLight.visible = recordingBlink;
      root.traverse((object) => {
        if (object.userData.dustPhase !== undefined) {
          object.position.y = object.userData.baseY + Math.sin(phaseTime * 0.7 + object.userData.dustPhase) * 0.025;
        }
      });
      updateRockWallTopButton(deltaSeconds);
      updateRockWallRope(rockWallHarnessed ? getRockWallHarnessAttachmentPosition() : undefined);
      updateStrengthTesterHammerVisual(playerPosition);
      updateStrengthTesterRope(playerPosition);
      strengthTesterHammerView.visible = strengthTesterHammerPickedUp;
      if (strengthTesterTimer > 0) {
        strengthTesterTimer = Math.max(0, strengthTesterTimer - deltaSeconds);
        const progress = 1 - strengthTesterTimer / 1.65;
        const strikePulse = Math.sin(Math.min(1, progress * 1.45) * Math.PI);
        const markerProgress = Math.sin(Math.min(1, progress * 1.18) * Math.PI);
        if (strengthTesterHammer) {
          strengthTesterHammer.rotation.z = -0.38 - strikePulse * 1.1;
        }
        strengthTesterHammerView.rotation.set(
          0.35 + strikePulse * 0.9,
          -0.18,
          -0.48 - strikePulse * 0.72,
        );
        if (strengthTesterPad) {
          strengthTesterPad.position.y = 0.16 - strikePulse * 0.055;
        }
        if (strengthTesterMarker) {
          strengthTesterMarker.position.y = 0.74 + markerProgress * 4.95;
        }
        if (strengthTesterBell) {
          const bellShake = progress > 0.38 ? Math.sin(phaseTime * 54) * 0.24 * (1 - Math.min(1, (progress - 0.38) / 0.62)) : 0;
          strengthTesterBell.rotation.z = bellShake;
        }
      } else {
        if (strengthTesterPad) {
          strengthTesterPad.position.y = 0.16;
        }
        if (strengthTesterMarker) {
          strengthTesterMarker.position.y = 0.74;
        }
        if (strengthTesterBell) {
          strengthTesterBell.rotation.z = 0;
        }
        strengthTesterHammerView.rotation.set(0.35, -0.18, -0.48);
      }
    },
    updateRockWallHarness(deltaSeconds: number, movement: { forward: number; strafe: number }): { position: Vector3; lookTarget: Vector3 } | null {
      if (!rockWallHarnessed) {
        return null;
      }

      if (rockWallLowering) {
        rockWallClimbY = Math.max(0, rockWallClimbY - deltaSeconds * rockWallLoweringSpeed);
      } else {
        rockWallClimbX = Math.max(
          -rockWallLength * 0.43,
          Math.min(rockWallLength * 0.43, rockWallClimbX + movement.strafe * deltaSeconds * 3.15),
        );
        rockWallClimbY = Math.max(
          0,
          Math.min(rockWallHeight - 0.28, rockWallClimbY + movement.forward * deltaSeconds * 2.35),
        );
      }

      const position = getRockWallClimbPosition();
      updateRockWallRope(getRockWallHarnessAttachmentPosition());

      if (rockWallLowering && rockWallClimbY <= 0.08) {
        rockWallHarnessed = false;
        rockWallLowering = false;
        rockWallClimbX = 0;
        rockWallClimbY = 0;
        if (rockWallHarnessRoot) {
          rockWallHarnessRoot.visible = true;
        }
        updateRockWallRope();
        return {
          position: rockWallHarnessInteractPosition.clone(),
          lookTarget: getRockWallLookTarget(),
        };
      }

      return {
        position,
        lookTarget: getRockWallLookTarget(),
      };
    },
    clickRockWallButton(): ChapterNineInteractionResult | null {
      return pressRockWallTopButton('Click. The top button pushes in and the winch slowly lowers you to the floor, then unbuckles the harness.');
    },
    swingStrengthTesterHammer(playerPosition: Vector3): ChapterNineInteractionResult | null {
      return startStrengthTesterStrike(playerPosition);
    },
    canPlayerOccupy(nextX: number, nextZ: number): boolean {
      if (!strengthTesterHammerPickedUp) {
        return true;
      }

      const dx = nextX - strengthTesterInteractPosition.x;
      const dz = nextZ - strengthTesterInteractPosition.z;
      return Math.hypot(dx, dz) <= strengthTesterTetherMaxDistance;
    },
    interact(playerPosition: Vector3, aimOrigin?: Vector3, aimDirection?: Vector3): ChapterNineInteractionResult {
      if (rockWallHarnessed) {
        const topButtonPress = pressRockWallTopButton('Click. The top button slowly pushes in and the winch lowers you to the floor, then unbuckles the harness.');
        if (topButtonPress) {
          return topButtonPress;
        }

        return {
          message: rockWallLowering
            ? 'The winch is lowering you. It will unclip you when you reach the bottom.'
            : 'Hold W to climb up, S to climb down, A to move left, and D to move right. Get close to the top button and press E.',
        };
      }

      if (playerPosition.distanceTo(rockWallHarnessInteractPosition) <= GAME_CONFIG.player.interactionRange + 0.95) {
        rockWallHarnessed = true;
        rockWallLowering = false;
        rockWallClimbX = 0;
        rockWallClimbY = 0;
        if (rockWallHarnessRoot) {
          rockWallHarnessRoot.visible = false;
        }
        updateRockWallRope(getRockWallHarnessAttachmentPosition());
        return {
          message: 'You clip into the winch harness. Hold W to climb up the rock wall, S to climb down, A left, and D right.',
          teleport: getRockWallClimbPosition(),
          lookTarget: getRockWallLookTarget(),
        };
      }

      if (playerPosition.distanceTo(voiceTapeInteractPosition) <= GAME_CONFIG.player.interactionRange + 0.55) {
        return {
          message: 'The voice tape clicks softly. It holds scratchy animatronic speech tests and old rehearsal lines.',
        };
      }
      if (
        !strengthTesterHammerPickedUp
        && playerPosition.distanceTo(strengthTesterInteractPosition) <= GAME_CONFIG.player.interactionRange + 1.1
      ) {
        strengthTesterHammerPickedUp = true;
        updateStrengthTesterHammerVisual(playerPosition);
        updateStrengthTesterRope(playerPosition);
        return {
          message: 'You pick up the hammer. The rope is tied to the back, so you can only walk a few steps away.',
        };
      }
      const chair = seatedChairs
        .filter((entry) => entry.interactPosition.distanceTo(playerPosition) <= GAME_CONFIG.player.interactionRange + 0.65)
        .sort((a, b) => a.interactPosition.distanceTo(playerPosition) - b.interactPosition.distanceTo(playerPosition))[0];
      if (chair) {
        return {
          message: `You sit in the ${chair.label}.`,
          teleport: chair.sitPosition.clone(),
          lookTarget: chair.lookTarget.clone(),
        };
      }
      if (!keycardCollected && playerPosition.distanceTo(keycardPickupPosition) <= GAME_CONFIG.player.interactionRange + 0.55) {
        keycardCollected = true;
        keycardPickup.visible = false;
        heldItem = 'keycard';
        cameraRecording = false;
        redDot.visible = false;
        screenRecLight.visible = false;
        return {
          message: 'You pick up the red and blue keycard. It appears in your inventory.',
        };
      }
      const aimedKeycardGate = getAimedKeycardGate(playerPosition, aimOrigin, aimDirection);
      if (aimedKeycardGate) {
        if (!keycardCollected) {
          return {
            message: 'The scanner flashes red. You need the red and blue keycard first.',
          };
        }
        openKeycardGate(aimedKeycardGate);
        return {
          message: 'The keycard scanner accepts the card. The gate opens so you can walk through.',
        };
      }
      if (playerPosition.distanceTo(sideDoor.interactPosition) <= GAME_CONFIG.player.interactionRange + 0.9) {
        toggleSideDoor();
        return {
          message: sideDoorOpen ? 'The side door swings open, bumps the wall, and settles.' : 'The side door closes back into place.',
        };
      }
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
      const items: ChapterNineHeldItem[] = keycardCollected
        ? ['coordinate-tool', 'camera', 'mic-sound', 'keycard']
        : ['coordinate-tool', 'camera', 'mic-sound'];
      const currentIndex = items.indexOf(heldItem);
      const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
      heldItem = items[(safeCurrentIndex + (step > 0 ? 1 : -1) + items.length) % items.length];
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
      if (item === 'keycard' && !keycardCollected) {
        return;
      }
      heldItem = item;
      if (heldItem !== 'camera') {
        cameraRecording = false;
        redDot.visible = false;
        screenRecLight.visible = false;
      }
    },
    getHeldItem: () => heldItem,
    hasKeycard: () => keycardCollected,
    consumeJumpscareEvent(): ChapterNineJumpscareEvent | null {
      const event = lastJumpscareEvent;
      lastJumpscareEvent = null;
      return event;
    },
    getSupportedFloorY(position: Vector3): number | null {
      if (inVent && position.y > 2.2) {
        return 3.1 + GAME_CONFIG.player.height;
      }
      const landingDx = position.x - collapsedAnimatronicLanding.centerX;
      const landingDz = position.z - collapsedAnimatronicLanding.centerZ;
      const landingCos = Math.cos(collapsedAnimatronicLanding.rotationY);
      const landingSin = Math.sin(collapsedAnimatronicLanding.rotationY);
      const landingLocalX = landingDx * landingCos - landingDz * landingSin;
      const landingLocalZ = landingDx * landingSin + landingDz * landingCos;
      if (
        Math.abs(landingLocalX) <= collapsedAnimatronicLanding.halfWidth
        && Math.abs(landingLocalZ) <= collapsedAnimatronicLanding.halfDepth
      ) {
        return collapsedAnimatronicLanding.floorY;
      }
      if (isOnTrampolinePad(position)) {
        return GAME_CONFIG.player.height + 0.12;
      }
      const raisedSurface = raisedSurfaces.find((surface) => (
        Math.abs(position.x - surface.centerX) <= surface.halfWidth
        && Math.abs(position.z - surface.centerZ) <= surface.halfDepth
      ));
      if (raisedSurface) {
        return raisedSurface.floorY;
      }
      if (Math.abs(position.x) <= 92 && position.z >= -84 && position.z <= 126) {
        return GAME_CONFIG.player.height;
      }
      return null;
    },
    isOnTrampoline(position: Vector3): boolean {
      return isOnTrampolinePad(position);
    },
    isRockWallHarnessed: () => rockWallHarnessed,
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
