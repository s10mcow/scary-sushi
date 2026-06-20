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
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';

import { GAME_CONFIG } from '../config/gameConfig';
import type { CollisionBox } from '../types/world';
import type { HudJumpScareVariant } from '../ui/createHud';

export type ChapterNineAnimatronicId = 'bonnie' | 'chica' | 'freddy' | 'foxy' | 'golden-freddy';

export interface ChapterNineInteractionResult {
  message: string;
  teleport?: Vector3;
  lookTarget?: Vector3;
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
  update(deltaSeconds: number, playerPosition: Vector3): void;
  interact(playerPosition: Vector3): ChapterNineInteractionResult;
  record(playerPosition: Vector3): string;
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
const FOOTAGE_TARGET = 12;
const PUZZLE_TARGET = 4;
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
      ['#7a4a2c', 'B'],
      ['#5743a8', 'Bo'],
      ['#d7b230', 'C'],
      ['#a3342a', 'F'],
      ['#d0a13a', 'G'],
    ] as const;
    mascots.forEach(([color, letter], index) => {
      const x = 104 + index * 76;
      context.fillStyle = color;
      context.beginPath();
      context.roundRect(x - 31, 87, 62, 75, 18);
      context.fill();
      context.fillStyle = '#f7f0ce';
      context.beginPath();
      context.arc(x - 12, 116, 5, 0, Math.PI * 2);
      context.arc(x + 12, 116, 5, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#19120d';
      context.lineWidth = 4;
      context.beginPath();
      context.arc(x, 132, 15, 0.2, Math.PI - 0.2);
      context.stroke();
      context.fillStyle = '#fff4d0';
      context.font = 'bold 22px Arial';
      context.fillText(letter, x, 190);
    });
    context.fillStyle = '#f2ece0';
    context.font = 'bold 25px Arial';
    context.fillText('CHECK IN  -  PARTIES  -  ARCADE  -  SECURITY', canvas.width / 2, 226);
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

export function createChapterNine(): ChapterNineData {
  const root = new Group();
  root.name = 'Chapter 9: Freddy Pizza Complex';
  root.visible = false;
  const colliders: CollisionBox[] = [];

  const spawn = new Vector3(0, GAME_CONFIG.player.height, 86);
  const lookTarget = new Vector3(0, 1.7, 20);

  const asphaltMaterial = new MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.96, metalness: 0.02 });
  const dirtyConcreteMaterial = new MeshStandardMaterial({ color: 0x6c6860, roughness: 0.94, metalness: 0.01 });
  const brickMaterial = new MeshStandardMaterial({ color: 0x7b382e, roughness: 0.88, metalness: 0.01 });
  const checkWhiteMaterial = new MeshStandardMaterial({ color: 0xbdbab0, roughness: 0.84 });
  const checkBlackMaterial = new MeshStandardMaterial({ color: 0x151516, roughness: 0.86 });
  const carpetMaterial = new MeshStandardMaterial({ color: 0x371019, roughness: 0.9 });
  const wallInteriorMaterial = new MeshStandardMaterial({ color: 0x60584f, roughness: 0.9 });
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

  const addWall = (x: number, z: number, width: number, depth: number, material = wallInteriorMaterial): void => {
    addBox(root, width, WALL_HEIGHT, depth, x, WALL_HEIGHT / 2, z, material);
    addCollider(colliders, x, z, width, depth);
  };

  const addFloor = (x: number, z: number, width: number, depth: number, material: MeshStandardMaterial): void => {
    addBox(root, width, 0.12, depth, x, -0.06, z, material);
  };

  const addCheckeredFloor = (x: number, z: number, width: number, depth: number): void => {
    const tile = 4;
    const columns = Math.ceil(width / tile);
    const rows = Math.ceil(depth / tile);
    for (let col = 0; col < columns; col += 1) {
      for (let row = 0; row < rows; row += 1) {
        const tileWidth = Math.min(tile, width - col * tile);
        const tileDepth = Math.min(tile, depth - row * tile);
        const tileX = x - width / 2 + col * tile + tileWidth / 2;
        const tileZ = z - depth / 2 + row * tile + tileDepth / 2;
        addBox(root, tileWidth, 0.08, tileDepth, tileX, -0.035, tileZ, (col + row) % 2 === 0 ? checkWhiteMaterial : checkBlackMaterial);
      }
    }
  };

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

  addCheckeredFloor(0, BUILDING_CENTER_Z, BUILDING_WIDTH, BUILDING_DEPTH);
  addWall(0, BUILDING_CENTER_Z - BUILDING_DEPTH / 2, BUILDING_WIDTH, WALL_THICKNESS, brickMaterial);
  addWall(-BUILDING_WIDTH / 2, BUILDING_CENTER_Z, WALL_THICKNESS, BUILDING_DEPTH, brickMaterial);
  addWall(BUILDING_WIDTH / 2, BUILDING_CENTER_Z, WALL_THICKNESS, BUILDING_DEPTH, brickMaterial);
  addWall(-36, BUILDING_CENTER_Z + BUILDING_DEPTH / 2, 58, WALL_THICKNESS, brickMaterial);
  addWall(36, BUILDING_CENTER_Z + BUILDING_DEPTH / 2, 58, WALL_THICKNESS, brickMaterial);
  const frontDoorCollider = addCollider(colliders, 0, BUILDING_CENTER_Z + BUILDING_DEPTH / 2, 11, WALL_THICKNESS);

  addBox(root, BUILDING_WIDTH + 2.2, 0.42, BUILDING_DEPTH + 2.2, 0, WALL_HEIGHT + 0.22, BUILDING_CENTER_Z, roofMaterial);
  addBox(root, BUILDING_WIDTH - 2.2, 0.12, BUILDING_DEPTH - 2.2, 0, WALL_HEIGHT - 0.08, BUILDING_CENTER_Z, ceilingMaterial);
  [-42, -14, 14, 42].forEach((x) => {
    addBox(root, 0.36, 0.26, BUILDING_DEPTH - 5, x, WALL_HEIGHT - 0.32, BUILDING_CENTER_Z, blackMetalMaterial);
  });
  [-52, -26, 0, 26, 52].forEach((x) => {
    [25, 5, -15, -35, -55].forEach((z) => {
      addBox(root, 5.8, 0.08, 0.8, x, WALL_HEIGHT - 0.54, z, neonMaterial);
    });
  });

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
    const plaque = new Mesh(new PlaneGeometry(8, 1.6), createSignMaterial(label.toUpperCase(), '', '#c7b073'));
    plaque.position.set(roomX, 4.35, roomZ + depth / 2 - 0.32);
    root.add(plaque);
  });
  [
    [-24, 31.5, 'BOOKING'],
    [24, 31.5, 'PRIZES'],
    [-58, -8, 'PARTS'],
    [-58, -42, 'SECURITY'],
    [58, -8, 'STAFF KITCHEN'],
    [58, -42, 'RESTROOMS'],
    [0, -8, 'MAIN STAGE'],
  ].forEach(([x, z, label]) => {
    const plaque = new Mesh(new PlaneGeometry(7.2, 1.05), createSignMaterial(String(label), '', '#d8c58a'));
    plaque.position.set(Number(x), 3.35, Number(z));
    root.add(plaque);
  });

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

  addBox(root, 30, 1.1, 11, 0, 0.55, -36, new MeshStandardMaterial({ color: 0x2f1720, roughness: 0.82 }));
  addCollider(colliders, 0, -36, 31, 12);
  const curtain = addBox(root, 32, 6.4, 0.28, 0, 3.5, -41.6, new MeshStandardMaterial({ color: 0x5d111b, roughness: 0.9 }));
  curtain.name = 'Dirty stage curtain';

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
  const ventEntries = [
    { label: 'Security vent', position: new Vector3(-52, GAME_CONFIG.player.height, -52), target: new Vector3(52, GAME_CONFIG.player.height, 20) },
    { label: 'Arcade vent', position: new Vector3(52, GAME_CONFIG.player.height, 20), target: new Vector3(-52, GAME_CONFIG.player.height, -52) },
  ];

  const filmingTargets: ChapterNineFilmingTarget[] = [
    { id: 'front', label: 'closed cracked front doors', position: new Vector3(0, 1.6, 30), radius: 15, filmed: false },
    { id: 'checkin', label: 'check-in and booking counter', position: new Vector3(-23, 1.4, 27), radius: 10, filmed: false },
    { id: 'prizes', label: 'abandoned prize counter', position: new Vector3(23, 1.4, 27), radius: 10, filmed: false },
    { id: 'stage', label: 'main stage', position: new Vector3(0, 1.4, -36), radius: 13, filmed: false },
    { id: 'kitchen', label: 'abandoned restaurant kitchen', position: new Vector3(42, 1.4, -24), radius: 13, filmed: false },
    { id: 'backstage', label: 'backstage shelves', position: new Vector3(-42, 1.4, -24), radius: 12, filmed: false },
    { id: 'security', label: 'security office monitors', position: new Vector3(-42, 1.4, -56), radius: 10, filmed: false },
    { id: 'vents', label: 'ceiling vent network', position: new Vector3(-52, 3.1, -28), radius: 14, filmed: false },
    { id: 'arcade', label: 'dead arcade machines', position: new Vector3(-42, 1.4, 20), radius: 12, filmed: false },
    { id: 'pirate', label: 'Pirate Cove', position: new Vector3(42, 1.4, 10), radius: 12, filmed: false },
    { id: 'freddy', label: 'Freddy moving', position: new Vector3(0, 1.4, -35), radius: 12, filmed: false },
    { id: 'bonnie', label: 'Bonnie moving', position: new Vector3(-9, 1.4, -35), radius: 12, filmed: false },
    { id: 'chica', label: 'Chica moving', position: new Vector3(9, 1.4, -35), radius: 12, filmed: false },
    { id: 'foxy', label: 'Foxy moving', position: new Vector3(42, 1.4, 10), radius: 12, filmed: false },
    { id: 'golden', label: 'Golden Freddy sighting', position: new Vector3(0, 1.4, -58), radius: 12, filmed: false },
  ];

  const puzzleStations: ChapterNinePuzzleStation[] = [
    { id: 'breaker', label: 'rusty breaker panel', position: new Vector3(-48, GAME_CONFIG.player.height, -56), solved: false, solvedMessage: 'You flip the rusty breaker. A few emergency lights buzz on.' },
    { id: 'kitchen-valve', label: 'kitchen gas valve', position: new Vector3(33, GAME_CONFIG.player.height, -30), solved: false, solvedMessage: 'You twist the kitchen valve shut. The hiss behind the stoves stops.' },
    { id: 'office-terminal', label: 'security terminal', position: new Vector3(-36, GAME_CONFIG.player.height, -56), solved: false, solvedMessage: 'You pull old footage from the security terminal.' },
    { id: 'exit-chain', label: 'front door chain', position: new Vector3(0, GAME_CONFIG.player.height, 30), solved: false, solvedMessage: 'You loosen the heavy chain on the front doors.' },
  ];

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
    const body = new Mesh(new BoxGeometry(1.45, 1.95, 0.82), bodyMaterial);
    body.position.y = 1.55;
    const chestPlate = new Mesh(new BoxGeometry(1.12, 1.18, 0.08), bellyMaterial);
    chestPlate.position.set(0, 1.62, 0.46);
    const neck = new Mesh(new CylinderGeometry(0.26, 0.32, 0.34, 14), metalMaterial);
    neck.position.y = 2.58;
    const head = new Group();
    head.position.y = 2.95;
    const skull = new Mesh(new SphereGeometry(0.72, 28, 18), bodyMaterial);
    skull.scale.set(1.02, 0.88, 0.82);
    const muzzle = new Mesh(new BoxGeometry(0.74, 0.28, 0.32), bellyMaterial);
    muzzle.position.set(0, -0.12, 0.52);
    const jaw = new Mesh(new BoxGeometry(0.86, 0.24, 0.42), bodyMaterial);
    jaw.position.set(0, -0.39, 0.35);
    const eyeMaterial = new MeshBasicMaterial({ color: id === 'golden-freddy' ? 0xff2733 : 0xf7f1ca });
    const leftEye = new Mesh(new SphereGeometry(0.075, 10, 8), eyeMaterial);
    leftEye.position.set(-0.24, 0.12, 0.56);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.22;
    head.add(skull, muzzle, jaw, leftEye, rightEye);
    [-0.27, -0.09, 0.09, 0.27].forEach((x) => {
      const topTooth = new Mesh(new BoxGeometry(0.07, 0.16, 0.05), toothMaterial);
      topTooth.position.set(x, -0.17, 0.71);
      const bottomTooth = new Mesh(new BoxGeometry(0.07, 0.13, 0.05), toothMaterial);
      bottomTooth.position.set(x, -0.29, 0.62);
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
      const beak = new Mesh(new ConeGeometry(0.28, 0.62, 4), new MeshStandardMaterial({ color: 0xe88922, roughness: 0.62 }));
      beak.position.set(0, -0.08, 0.78);
      beak.rotation.x = Math.PI / 2;
      const bib = new Mesh(new PlaneGeometry(0.95, 0.72), createSignMaterial('LET', 'EAT', '#f6e68a'));
      bib.position.set(0, 1.54, 0.48);
      model.add(bib);
      head.add(beak);
    } else if (variant === 'fox') {
      const snout = new Mesh(new ConeGeometry(0.28, 0.62, 12), bodyMaterial);
      snout.position.set(0, -0.06, 0.72);
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
    leftArm.position.set(-0.94, 2.18, 0);
    const rightArm = new Group();
    rightArm.position.set(0.94, 2.18, 0);
    const makeLimb = (length = 1.45): Group => {
      const limb = new Group();
      const upper = new Mesh(new BoxGeometry(0.32, length * 0.48, 0.32), bodyMaterial);
      upper.position.y = -length * 0.22;
      const joint = new Mesh(new SphereGeometry(0.2, 14, 10), metalMaterial);
      joint.position.y = -length * 0.48;
      const lower = new Mesh(new BoxGeometry(0.3, length * 0.48, 0.3), bodyMaterial);
      lower.position.y = -length * 0.74;
      const hand = new Mesh(new SphereGeometry(0.18, 14, 10), bodyMaterial);
      hand.scale.set(1.1, 0.82, 1);
      hand.position.y = -length;
      limb.add(upper, joint, lower, hand);
      return limb;
    };
    leftArm.add(makeLimb(1.55));
    rightArm.add(makeLimb(1.55));
    const leftLeg = new Group();
    leftLeg.position.set(-0.38, 0.82, 0);
    const rightLeg = new Group();
    rightLeg.position.set(0.38, 0.82, 0);
    leftLeg.add(makeLimb(1.3));
    rightLeg.add(makeLimb(1.3));
    const leftFoot = new Mesh(new BoxGeometry(0.52, 0.25, 0.88), bodyMaterial);
    leftFoot.position.set(-0.38, 0.13, 0.18);
    const rightFoot = leftFoot.clone();
    rightFoot.position.x = 0.38;
    const leftShoulder = new Mesh(new SphereGeometry(0.22, 14, 10), metalMaterial);
    leftShoulder.position.set(-0.9, 2.17, 0);
    const rightShoulder = leftShoulder.clone();
    rightShoulder.position.x = 0.9;
    model.add(body, chestPlate, neck, head, leftArm, rightArm, leftLeg, rightLeg, leftFoot, rightFoot, leftShoulder, rightShoulder);
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

  const shoulderCamera = new Group();
  shoulderCamera.name = 'Chapter 9 shoulder recording camera';
  const cameraBody = new Mesh(new BoxGeometry(0.55, 0.34, 0.34), recordingMaterial);
  const cameraLens = new Mesh(new CylinderGeometry(0.13, 0.18, 0.18, 18), blackMetalMaterial);
  cameraLens.rotation.x = Math.PI / 2;
  cameraLens.position.z = -0.27;
  const redDot = new Mesh(new SphereGeometry(0.035, 8, 6), redLightMaterial);
  redDot.position.set(0.22, 0.08, -0.2);
  shoulderCamera.add(cameraBody, cameraLens, redDot);
  shoulderCamera.position.set(0.55, -0.34, -0.74);

  let phaseTime = 0;
  let night = false;
  let insideDuringNight = false;
  let escapeUnlocked = false;
  let lastJumpscareEvent: ChapterNineJumpscareEvent | null = null;
  let inVent = false;
  let ventExitCooldown = 0;

  const getFilmedCount = (): number => filmingTargets.filter((target) => target.filmed).length;
  const getPuzzleCount = (): number => puzzleStations.filter((station) => station.solved).length;

  const updateEscapeState = (): void => {
    escapeUnlocked = getFilmedCount() >= FOOTAGE_TARGET && getPuzzleCount() >= PUZZLE_TARGET;
    frontDoorCollider.enabled = night && insideDuringNight && !escapeUnlocked;
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
    const walk = phaseTime * (bot.chaseTimer > 1.1 ? 10 : 5.8) + bot.phase;
    const stride = Math.sin(walk) * (bot.chaseTimer > 1.1 ? 0.75 : 0.45);
    const sideSwing = Math.sin(walk + Math.PI / 2) * (bot.chaseTimer > 1.1 ? 0.18 : 0.1);
    bot.leftArm.rotation.x = stride;
    bot.rightArm.rotation.x = -stride;
    bot.leftArm.rotation.z = -0.18 + sideSwing;
    bot.rightArm.rotation.z = 0.18 + sideSwing;
    bot.leftLeg.rotation.x = -stride * 0.5;
    bot.rightLeg.rotation.x = stride * 0.5;
    bot.head.rotation.y = Math.sin(walk * 0.5) * 0.08;
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
    frontDoorCollider.enabled = false;
    shoulderCamera.visible = true;
  };

  reset();

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    shoulderCamera,
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
      animatronics.forEach((bot) => moveAnimatronic(bot, deltaSeconds, playerPosition));
      redDot.visible = Math.sin(phaseTime * 9) > -0.25;
      root.traverse((object) => {
        if (object.userData.dustPhase !== undefined) {
          object.position.y = object.userData.baseY + Math.sin(phaseTime * 0.7 + object.userData.dustPhase) * 0.025;
        }
      });
    },
    interact(playerPosition: Vector3): ChapterNineInteractionResult {
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
      if (playerPosition.distanceTo(new Vector3(0, GAME_CONFIG.player.height, 30)) <= GAME_CONFIG.player.interactionRange + 2.6) {
        if (!night || escapeUnlocked) {
          return {
            message: escapeUnlocked
              ? 'The front doors finally open. You can escape with the footage.'
              : 'The front doors are open during the day, but the best footage will happen after closing.',
            teleport: new Vector3(0, GAME_CONFIG.player.height, 84),
            lookTarget,
          };
        }
        return { message: 'The front doors are chained shut for the night. Film evidence and solve the building puzzles to escape.' };
      }
      return { message: 'Nothing here needs your hand, but the shoulder camera can still record evidence with left click.' };
    },
    record(playerPosition: Vector3): string {
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
