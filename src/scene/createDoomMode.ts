import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  PlaneGeometry,
  PointLight,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
} from 'three';

import type { CollisionBox } from '../types/world';
import type { DoomEnemyVariant } from '../systems/doom/DoomEnemyController';
import { isBlocked } from '../systems/collision/isBlocked';

export type DoomKeyColor = 'red' | 'yellow' | 'blue';
export type DoomWeaponId = 'pistol' | 'shotgun';
export type DoomPickupKind =
  | 'red-key'
  | 'yellow-key'
  | 'blue-key'
  | 'bullets'
  | 'shells'
  | 'medkit'
  | 'armor'
  | 'shotgun';

export interface DoomPickup {
  kind: DoomPickupKind;
  label: string;
  position: Vector3;
  root: Group;
  collected: boolean;
  amount: number;
  baseY: number;
  phase: number;
}

export interface DoomDoor {
  id: string;
  label: string;
  color: DoomKeyColor;
  position: Vector3;
  interactPosition: Vector3;
  root: Group;
  slab: Mesh;
  light: PointLight;
  collider: CollisionBox;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
  closedY: number;
  openY: number;
}

export interface DoomLootContainer {
  id: string;
  label: string;
  kind: 'key-chest' | 'ammo-crate';
  rewardKind: DoomPickupKind;
  rewardAmount: number;
  position: Vector3;
  interactPosition: Vector3;
  root: Group;
  lidHinge: Group;
  lid: Mesh;
  lootRoot: Group;
  light: PointLight;
  openAmount: number;
  targetOpenAmount: number;
  closeTimer: number;
  lootDisplayTimer: number;
  lootClaimed: boolean;
}

export interface DoomExitSwitch {
  position: Vector3;
  interactPosition: Vector3;
  root: Group;
  screen: Mesh;
  activated: boolean;
}

export interface DoomEnemySpawn {
  variant: DoomEnemyVariant;
  position: Vector3;
}

export interface DoomNavigator {
  snap(position: Vector3, radius?: number): Vector3;
  findPath(from: Vector3, to: Vector3, radius?: number): Vector3[];
}

export interface DoomModeData {
  root: Group;
  colliders: CollisionBox[];
  spawn: Vector3;
  lookTarget: Vector3;
  navigator: DoomNavigator;
  pickups: DoomPickup[];
  doors: DoomDoor[];
  containers: DoomLootContainer[];
  exitSwitch: DoomExitSwitch;
  enemySpawns: DoomEnemySpawn[];
  update(deltaSeconds: number): void;
  reset(): void;
}

interface RoomOpening {
  side: 'north' | 'south' | 'east' | 'west';
  start: number;
  end: number;
}

interface AreaRect {
  x: number;
  z: number;
  width: number;
  depth: number;
  floor: number;
  openings: RoomOpening[];
}

type DoomTexturePattern = 'wall' | 'floor' | 'ceiling' | 'door' | 'panel';
type DoomArea = AreaRect & { floor: number };

const WALL_HEIGHT = 5.8;
const WALL_THICKNESS = 0.8;
const CHEST_OPEN_SPEED = 2.8;
const DOOM_NAV_CELL_SIZE = 1.35;
const DOOM_NAV_MARGIN = 0.92;

const ENTRY_ROOM = {
  x: 620,
  z: -110,
  width: 18,
  depth: 18,
};
const STORAGE_ROOM = {
  x: 596,
  z: -110,
  width: 18,
  depth: 18,
};
const MAINTENANCE_ROOM = {
  x: 620,
  z: -136,
  width: 14,
  depth: 14,
};
const OPS_HUB = {
  x: 649,
  z: -110,
  width: 20,
  depth: 20,
};
const SECURITY_OFFICE = {
  x: 649,
  z: -83,
  width: 16,
  depth: 18,
};
const REACTOR_HALL = {
  x: 676,
  z: -110,
  width: 18,
  depth: 18,
};
const COOLING_ROOM = {
  x: 676,
  z: -82,
  width: 18,
  depth: 18,
};
const FOUNDRY_ROOM = {
  x: 676,
  z: -136,
  width: 18,
  depth: 18,
};
const EXIT_SPINE = {
  x: 704,
  z: -110,
  width: 18,
  depth: 18,
};
const SIDE_LAB = {
  x: 704,
  z: -82,
  width: 18,
  depth: 18,
};
const WEST_HALL = {
  x: 608,
  z: -110,
  width: 6,
  depth: 6,
};
const NORTH_HALL = {
  x: 620,
  z: -124,
  width: 6,
  depth: 10,
};
const RED_HALL = {
  x: 634,
  z: -110,
  width: 10,
  depth: 6,
};
const OFFICE_HALL = {
  x: 649,
  z: -96,
  width: 6,
  depth: 8,
};
const YELLOW_HALL = {
  x: 663,
  z: -110,
  width: 8,
  depth: 6,
};
const COOLING_HALL = {
  x: 676,
  z: -96,
  width: 6,
  depth: 10,
};
const FOUNDRY_HALL = {
  x: 676,
  z: -123,
  width: 6,
  depth: 8,
};
const BLUE_HALL = {
  x: 690,
  z: -110,
  width: 10,
  depth: 6,
};
const LAB_HALL = {
  x: 704,
  z: -96,
  width: 6,
  depth: 10,
};

const textureCache = new Map<string, CanvasTexture>();

function tintColor(color: number, amount: number): number {
  const r = Math.min(255, Math.max(0, Math.round(((color >> 16) & 0xff) + 255 * amount)));
  const g = Math.min(255, Math.max(0, Math.round(((color >> 8) & 0xff) + 255 * amount)));
  const b = Math.min(255, Math.max(0, Math.round((color & 0xff) + 255 * amount)));
  return (r << 16) | (g << 8) | b;
}

function createPixelTexture(
  pattern: DoomTexturePattern,
  color: number,
  emissive: number,
  repeatX: number,
  repeatY: number,
): CanvasTexture {
  const key = `${pattern}:${color}:${emissive}:${repeatX.toFixed(2)}:${repeatY.toFixed(2)}`;
  const cached = textureCache.get(key);
  if (cached) {
    return cached;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create doom texture canvas context.');
  }

  context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const dark = `#${tintColor(color, -38 / 255).toString(16).padStart(6, '0')}`;
  const darker = `#${tintColor(color, -62 / 255).toString(16).padStart(6, '0')}`;
  const light = `#${tintColor(color, 24 / 255).toString(16).padStart(6, '0')}`;
  const bright = `#${tintColor(color, 48 / 255).toString(16).padStart(6, '0')}`;
  const glow = `#${tintColor(emissive || color, 18 / 255).toString(16).padStart(6, '0')}`;

  if (pattern === 'wall') {
    context.fillStyle = dark;
    for (let x = 0; x < 32; x += 8) {
      context.fillRect(x + 1, 1, 6, 30);
    }
    context.fillStyle = darker;
    for (let x = 0; x < 32; x += 8) {
      context.fillRect(x, 0, 1, 32);
      context.fillRect(x + 7, 0, 1, 32);
    }
    context.fillStyle = bright;
    for (let y = 4; y < 32; y += 8) {
      context.fillRect(0, y, 32, 1);
    }
    context.fillStyle = glow;
    for (let x = 3; x < 32; x += 8) {
      context.fillRect(x, 2, 2, 2);
      context.fillRect(x, 28, 2, 2);
    }
  } else if (pattern === 'floor') {
    context.fillStyle = dark;
    for (let y = 0; y < 32; y += 8) {
      for (let x = 0; x < 32; x += 8) {
        if ((x + y) % 16 === 0) {
          context.fillRect(x, y, 8, 8);
        }
      }
    }
    context.fillStyle = darker;
    for (let x = 0; x < 32; x += 8) {
      context.fillRect(x, 0, 1, 32);
    }
    for (let y = 0; y < 32; y += 8) {
      context.fillRect(0, y, 32, 1);
    }
    context.fillStyle = light;
    for (let y = 2; y < 32; y += 8) {
      for (let x = (y / 2) % 8 === 0 ? 2 : 6; x < 32; x += 8) {
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (pattern === 'ceiling') {
    context.fillStyle = darker;
    for (let y = 0; y < 32; y += 8) {
      context.fillRect(0, y, 32, 1);
    }
    for (let x = 0; x < 32; x += 8) {
      context.fillRect(x, 0, 1, 32);
    }
    context.fillStyle = light;
    context.fillRect(6, 6, 4, 4);
    context.fillRect(22, 22, 4, 4);
  } else if (pattern === 'door') {
    context.fillStyle = darker;
    context.fillRect(0, 0, 4, 32);
    context.fillRect(28, 0, 4, 32);
    context.fillStyle = bright;
    context.fillRect(4, 3, 24, 3);
    context.fillRect(4, 26, 24, 3);
    context.fillStyle = dark;
    context.fillRect(11, 0, 10, 32);
    context.fillStyle = glow;
    context.fillRect(13, 7, 6, 18);
    context.fillStyle = bright;
    context.fillRect(9, 12, 14, 2);
    context.fillRect(9, 18, 14, 2);
  } else {
    context.fillStyle = darker;
    context.fillRect(0, 0, 32, 4);
    context.fillRect(0, 28, 32, 4);
    context.fillRect(0, 0, 4, 32);
    context.fillRect(28, 0, 4, 32);
    context.fillStyle = light;
    context.fillRect(6, 6, 20, 20);
    context.fillStyle = glow;
    context.fillRect(10, 10, 12, 12);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  textureCache.set(key, texture);
  return texture;
}

function createMaterial(
  color: number,
  emissive = 0x000000,
  emissiveIntensity = 0,
  pattern: DoomTexturePattern = 'wall',
  repeatX = 1,
  repeatY = 1,
): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: 0xffffff,
    map: createPixelTexture(pattern, color, emissive, repeatX, repeatY),
    emissive,
    emissiveIntensity,
    roughness: 0.88,
    metalness: 0.1,
    flatShading: true,
  });
}

function addArea(root: Group, x: number, z: number, width: number, depth: number, floorHex: number): void {
  const floorMaterial = createMaterial(
    floorHex,
    0x080b11,
    0.08,
    'floor',
    Math.max(1, width / 4),
    Math.max(1, depth / 4),
  );
  floorMaterial.side = DoubleSide;
  const floor = new Mesh(new PlaneGeometry(width, depth), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(x, 0.02, z);

  const ceilingMaterial = createMaterial(
    0x1b2129,
    0x040507,
    0.04,
    'ceiling',
    Math.max(1, width / 4),
    Math.max(1, depth / 4),
  );
  ceilingMaterial.side = DoubleSide;
  const ceiling = new Mesh(new PlaneGeometry(width, depth), ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(x, WALL_HEIGHT, z);

  root.add(floor, ceiling);
}

function addWall(root: Group, colliders: CollisionBox[], x: number, z: number, width: number, depth: number): void {
  if (width <= 0.01 || depth <= 0.01) {
    return;
  }

  const wall = new Mesh(
    new BoxGeometry(width, WALL_HEIGHT, depth),
    createMaterial(
      0x4b5460,
      0x121820,
      0.08,
      'wall',
      Math.max(1, Math.max(width, depth) / 4),
      2,
    ),
  );
  wall.position.set(x, WALL_HEIGHT * 0.5, z);
  root.add(wall);
  colliders.push({
    centerX: x,
    centerZ: z,
    halfWidth: width * 0.5,
    halfDepth: depth * 0.5,
  });
}

function subtractSegments(start: number, end: number, gaps: Array<{ start: number; end: number }>) {
  const normalized = gaps
    .map((gap) => ({
      start: Math.max(start, Math.min(end, gap.start)),
      end: Math.max(start, Math.min(end, gap.end)),
    }))
    .filter((gap) => gap.end > gap.start)
    .sort((left, right) => left.start - right.start);

  const segments: Array<{ start: number; end: number }> = [];
  let cursor = start;

  normalized.forEach((gap) => {
    if (gap.start > cursor) {
      segments.push({ start: cursor, end: gap.start });
    }
    cursor = Math.max(cursor, gap.end);
  });

  if (cursor < end) {
    segments.push({ start: cursor, end });
  }

  return segments;
}

function addRoomShell(root: Group, colliders: CollisionBox[], area: AreaRect): void {
  addArea(root, area.x, area.z, area.width, area.depth, area.floor);

  const left = area.x - area.width * 0.5;
  const right = area.x + area.width * 0.5;
  const north = area.z - area.depth * 0.5;
  const south = area.z + area.depth * 0.5;

  const northSegments = subtractSegments(
    left,
    right,
    area.openings.filter((opening) => opening.side === 'north').map((opening) => ({ start: opening.start, end: opening.end })),
  );
  northSegments.forEach((segment) => {
    addWall(root, colliders, (segment.start + segment.end) * 0.5, north, segment.end - segment.start, WALL_THICKNESS);
  });

  const southSegments = subtractSegments(
    left,
    right,
    area.openings.filter((opening) => opening.side === 'south').map((opening) => ({ start: opening.start, end: opening.end })),
  );
  southSegments.forEach((segment) => {
    addWall(root, colliders, (segment.start + segment.end) * 0.5, south, segment.end - segment.start, WALL_THICKNESS);
  });

  const westSegments = subtractSegments(
    north,
    south,
    area.openings.filter((opening) => opening.side === 'west').map((opening) => ({ start: opening.start, end: opening.end })),
  );
  westSegments.forEach((segment) => {
    addWall(root, colliders, left, (segment.start + segment.end) * 0.5, WALL_THICKNESS, segment.end - segment.start);
  });

  const eastSegments = subtractSegments(
    north,
    south,
    area.openings.filter((opening) => opening.side === 'east').map((opening) => ({ start: opening.start, end: opening.end })),
  );
  eastSegments.forEach((segment) => {
    addWall(root, colliders, right, (segment.start + segment.end) * 0.5, WALL_THICKNESS, segment.end - segment.start);
  });
}

function addCeilingLight(root: Group, x: number, z: number, color: number): PointLight {
  const light = new PointLight(color, 1.5, 20, 1.6);
  light.position.set(x, WALL_HEIGHT - 0.72, z);
  const housing = new Mesh(new BoxGeometry(1.4, 0.24, 1.4), createMaterial(0x252c34, 0, 0, 'panel'));
  housing.position.copy(light.position).setY(WALL_HEIGHT - 0.18);
  root.add(light, housing);
  return light;
}

function createDoor(
  id: string,
  label: string,
  color: DoomKeyColor,
  x: number,
  z: number,
  orientation: 'x' | 'z',
): DoomDoor {
  const root = new Group();
  root.position.set(x, 0, z);

  const colorMap: Record<DoomKeyColor, number> = {
    red: 0xc1483f,
    yellow: 0xd0a73a,
    blue: 0x3d79d4,
  };
  const glowMap: Record<DoomKeyColor, number> = {
    red: 0xff633c,
    yellow: 0xffcc47,
    blue: 0x65b1ff,
  };

  const frameMaterial = createMaterial(0x232b34, 0x10151c, 0.14, 'panel');
  const slabMaterial = createMaterial(colorMap[color], glowMap[color], 0.22, 'door', 1, 2);
  const slabWidth = orientation === 'x' ? 5.2 : 0.7;
  const slabDepth = orientation === 'x' ? 0.7 : 5.2;
  const sideOffset = orientation === 'x' ? 2.9 : 0.55;
  const topWidth = orientation === 'x' ? 6 : 1.2;
  const topDepth = orientation === 'x' ? 1.2 : 6;

  const slab = new Mesh(new BoxGeometry(slabWidth, WALL_HEIGHT - 0.35, slabDepth), slabMaterial);
  slab.position.set(0, (WALL_HEIGHT - 0.35) * 0.5, 0);

  const sideA = new Mesh(new BoxGeometry(0.52, WALL_HEIGHT, 0.52), frameMaterial);
  const sideB = sideA.clone();
  if (orientation === 'x') {
    sideA.position.set(-sideOffset, WALL_HEIGHT * 0.5, 0);
    sideB.position.set(sideOffset, WALL_HEIGHT * 0.5, 0);
  } else {
    sideA.position.set(0, WALL_HEIGHT * 0.5, -sideOffset);
    sideB.position.set(0, WALL_HEIGHT * 0.5, sideOffset);
  }
  const top = new Mesh(new BoxGeometry(topWidth, 0.5, topDepth), frameMaterial);
  top.position.set(0, WALL_HEIGHT - 0.25, 0);

  const light = new PointLight(glowMap[color], 1.2, 12, 1.7);
  light.position.set(0, WALL_HEIGHT - 0.78, 0);

  root.add(sideA, sideB, top, slab, light);

  return {
    id,
    label,
    color,
    position: new Vector3(x, 1.3, z),
    interactPosition: new Vector3(x, 1.3, z),
    root,
    slab,
    light,
    collider: {
      centerX: x,
      centerZ: z,
      halfWidth: orientation === 'x' ? 2.65 : 0.45,
      halfDepth: orientation === 'x' ? 0.45 : 2.65,
    },
    open: false,
    openAmount: 0,
    targetOpenAmount: 0,
    closedY: slab.position.y,
    openY: WALL_HEIGHT + 2.6,
  };
}

function createPickup(kind: DoomPickupKind, label: string, x: number, z: number, tint: number, amount: number): DoomPickup {
  const root = new Group();
  root.position.set(x, 0.6, z);

  const casing = createMaterial(0x262e37, 0x0a1016, 0.08, 'panel');
  const accent = createMaterial(tint, tint, 0.28, 'door');

  if (kind === 'shotgun') {
    const body = new Mesh(new BoxGeometry(0.2, 0.16, 1.12), casing);
    const stock = new Mesh(new BoxGeometry(0.22, 0.18, 0.42), createMaterial(0x6c4c30, 0, 0, 'panel'));
    stock.position.set(0, -0.04, 0.42);
    const barrel = new Mesh(new CylinderGeometry(0.04, 0.04, 0.96, 10), accent);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.24);
    root.add(body, stock, barrel);
  } else if (kind === 'medkit') {
    const box = new Mesh(new BoxGeometry(0.8, 0.38, 0.8), casing);
    const crossA = new Mesh(new BoxGeometry(0.18, 0.12, 0.54), accent);
    const crossB = new Mesh(new BoxGeometry(0.54, 0.12, 0.18), accent);
    crossA.position.y = 0.2;
    crossB.position.y = 0.2;
    root.add(box, crossA, crossB);
  } else if (kind === 'armor') {
    const shell = new Mesh(new CylinderGeometry(0.46, 0.52, 0.56, 12), accent);
    const core = new Mesh(new BoxGeometry(0.38, 0.44, 0.3), casing);
    core.position.y = 0.06;
    root.add(shell, core);
  }

  return {
    kind,
    label,
    position: new Vector3(x, 0.6, z),
    root,
    collected: false,
    amount,
    baseY: 0.6,
    phase: Math.random() * Math.PI * 2,
  };
}

function createContainerLootVisual(rewardKind: DoomPickupKind, amount: number): Group {
  const root = new Group();
  const metal = createMaterial(0x252a32, 0x080b10, 0.08, 'panel');
  const brass = createMaterial(0xc79149, 0x5d3811, 0.18, 'door');

  if (rewardKind === 'red-key' || rewardKind === 'yellow-key' || rewardKind === 'blue-key') {
    const tint = rewardKind === 'red-key' ? 0xd45948 : rewardKind === 'yellow-key' ? 0xe3bd4f : 0x5f9cff;
    const card = new Mesh(new BoxGeometry(0.78, 0.06, 1.08), createMaterial(tint, tint, 0.22, 'door'));
    const stripe = new Mesh(new BoxGeometry(0.18, 0.07, 1.08), metal);
    stripe.position.x = -0.2;
    root.add(card, stripe);
    return root;
  }

  const stackCount = Math.max(2, Math.min(4, Math.round(amount / 8)));
  for (let index = 0; index < stackCount; index += 1) {
    const shell = new Mesh(new CylinderGeometry(0.05, 0.05, 0.22, 10), brass);
    shell.rotation.z = Math.PI / 2;
    shell.position.set(-0.18 + index * 0.12, 0.02, 0);
    root.add(shell);
  }
  return root;
}

function createLootContainer(
  id: string,
  label: string,
  kind: DoomLootContainer['kind'],
  x: number,
  z: number,
  rewardKind: DoomPickupKind,
  rewardAmount: number,
): DoomLootContainer {
  const root = new Group();
  root.position.set(x, 0, z);

  const baseMaterial = createMaterial(kind === 'ammo-crate' ? 0x4b5f35 : 0x5d4332, 0x0d0906, 0.08, 'panel');
  const trimMaterial = createMaterial(kind === 'ammo-crate' ? 0x7f9b4e : 0x8a6349, 0x17110d, 0.12, 'door');
  const lidMaterial = createMaterial(kind === 'ammo-crate' ? 0x5f783c : 0x6e4f3b, 0x16110c, 0.12, 'panel');

  const base = new Mesh(new BoxGeometry(1.6, 0.82, 1.06), baseMaterial);
  base.position.set(0, 0.41, 0);
  const trim = new Mesh(new BoxGeometry(1.5, 0.12, 0.96), trimMaterial);
  trim.position.set(0, 0.78, 0);

  const lidHinge = new Group();
  lidHinge.position.set(0, 0.78, -0.42);
  const lid = new Mesh(new BoxGeometry(1.56, 0.18, 1), lidMaterial);
  lid.position.set(0, 0.09, 0.42);
  lidHinge.add(lid);

  const lootRoot = createContainerLootVisual(rewardKind, rewardAmount);
  lootRoot.position.set(0, 0.88, 0.08);
  lootRoot.visible = false;

  const light = new PointLight(
    rewardKind === 'red-key'
      ? 0xff5c48
      : rewardKind === 'yellow-key'
        ? 0xffd25d
        : rewardKind === 'blue-key'
          ? 0x69a7ff
          : 0xffc36a,
    0.8,
    8,
    1.8,
  );
  light.position.set(0, 1.28, 0);

  root.add(base, trim, lidHinge, lootRoot, light);

  return {
    id,
    label,
    kind,
    rewardKind,
    rewardAmount,
    position: new Vector3(x, 0.9, z),
    interactPosition: new Vector3(x, 1.1, z),
    root,
    lidHinge,
    lid,
    lootRoot,
    light,
    openAmount: 0,
    targetOpenAmount: 0,
    closeTimer: 0,
    lootDisplayTimer: 0,
    lootClaimed: false,
  };
}

function createExitSwitch(x: number, z: number): DoomExitSwitch {
  const root = new Group();
  root.position.set(x, 1.5, z);

  const frame = new Mesh(new BoxGeometry(0.8, 1.4, 0.24), createMaterial(0x1f252b, 0x080b10, 0.12, 'panel'));
  const screen = new Mesh(new BoxGeometry(0.52, 0.86, 0.06), createMaterial(0x8fb24b, 0x5dd23f, 0.38, 'door'));
  screen.position.set(0, 0.05, 0.16);
  const lever = new Mesh(new CylinderGeometry(0.05, 0.05, 0.5, 10), createMaterial(0xbcc6d5, 0, 0, 'panel'));
  lever.position.set(0, -0.36, 0.12);
  lever.rotation.z = Math.PI / 2;
  root.add(frame, screen, lever);

  return {
    position: new Vector3(x, 1.5, z),
    interactPosition: new Vector3(x - 0.8, 1.3, z),
    root,
    screen,
    activated: false,
  };
}

function addPropCollider(colliders: CollisionBox[], x: number, z: number, halfWidth: number, halfDepth: number): void {
  colliders.push({
    centerX: x,
    centerZ: z,
    halfWidth,
    halfDepth,
  });
}

interface DoomNavCell {
  key: number;
  row: number;
  column: number;
  x: number;
  z: number;
}

interface DoomNavGraph {
  width: number;
  height: number;
  originX: number;
  originZ: number;
  walkableByKey: Map<number, DoomNavCell>;
}

function isInsideDoomArea(x: number, z: number, area: DoomArea): boolean {
  const halfWidth = area.width * 0.5 - DOOM_NAV_MARGIN;
  const halfDepth = area.depth * 0.5 - DOOM_NAV_MARGIN;
  return (
    x >= area.x - halfWidth
    && x <= area.x + halfWidth
    && z >= area.z - halfDepth
    && z <= area.z + halfDepth
  );
}

function buildDoomNavGraph(
  areas: readonly DoomArea[],
  staticColliders: readonly CollisionBox[],
  radius: number,
): DoomNavGraph {
  const minX = Math.min(...areas.map((area) => area.x - area.width * 0.5));
  const maxX = Math.max(...areas.map((area) => area.x + area.width * 0.5));
  const minZ = Math.min(...areas.map((area) => area.z - area.depth * 0.5));
  const maxZ = Math.max(...areas.map((area) => area.z + area.depth * 0.5));

  const width = Math.max(1, Math.ceil((maxX - minX) / DOOM_NAV_CELL_SIZE) + 1);
  const height = Math.max(1, Math.ceil((maxZ - minZ) / DOOM_NAV_CELL_SIZE) + 1);
  const originX = minX;
  const originZ = minZ;
  const walkableByKey = new Map<number, DoomNavCell>();

  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const x = originX + column * DOOM_NAV_CELL_SIZE;
      const z = originZ + row * DOOM_NAV_CELL_SIZE;
      if (!areas.some((area) => isInsideDoomArea(x, z, area))) {
        continue;
      }

      if (isBlocked(x, z, staticColliders, radius)) {
        continue;
      }

      const key = row * width + column;
      walkableByKey.set(key, {
        key,
        row,
        column,
        x,
        z,
      });
    }
  }

  return {
    width,
    height,
    originX,
    originZ,
    walkableByKey,
  };
}

function createDoomNavigator(
  areas: readonly DoomArea[],
  colliders: readonly CollisionBox[],
): DoomNavigator {
  const graphCache = new Map<string, DoomNavGraph>();

  const getColliderSignature = (): string =>
    colliders
      .map((collider) => (collider.enabled === false ? '0' : '1'))
      .join('');

  const getGraph = (radius: number): DoomNavGraph => {
    const key = `${radius.toFixed(2)}:${getColliderSignature()}`;
    const cached = graphCache.get(key);
    if (cached) {
      return cached;
    }

    const graph = buildDoomNavGraph(areas, colliders, radius);
    graphCache.set(key, graph);
    return graph;
  };

  const snapCell = (position: Vector3, radius: number): DoomNavCell => {
    const graph = getGraph(radius);
    let best = graph.walkableByKey.values().next().value as DoomNavCell | undefined;
    let bestDistance = Infinity;

    graph.walkableByKey.forEach((cell) => {
      const dx = cell.x - position.x;
      const dz = cell.z - position.z;
      const distance = dx * dx + dz * dz;
      if (distance >= bestDistance) {
        return;
      }

      best = cell;
      bestDistance = distance;
    });

    if (!best) {
      return {
        key: 0,
        row: 0,
        column: 0,
        x: position.x,
        z: position.z,
      };
    }

    return best;
  };

  const findPathCells = (start: DoomNavCell, goal: DoomNavCell, radius: number): DoomNavCell[] => {
    if (start.key === goal.key) {
      return [goal];
    }

    const graph = getGraph(radius);
    const queue: number[] = [start.key];
    const visited = new Set<number>([start.key]);
    const previous = new Map<number, number>();

    for (let index = 0; index < queue.length; index += 1) {
      const currentKey = queue[index];
      if (currentKey === goal.key) {
        break;
      }

      const current = graph.walkableByKey.get(currentKey);
      if (!current) {
        continue;
      }

      const neighbors = [
        [current.row - 1, current.column],
        [current.row + 1, current.column],
        [current.row, current.column - 1],
        [current.row, current.column + 1],
      ];

      neighbors.forEach(([row, column]) => {
        if (row < 0 || row >= graph.height || column < 0 || column >= graph.width) {
          return;
        }

        const neighborKey = row * graph.width + column;
        if (visited.has(neighborKey) || !graph.walkableByKey.has(neighborKey)) {
          return;
        }

        visited.add(neighborKey);
        previous.set(neighborKey, currentKey);
        queue.push(neighborKey);
      });
    }

    if (!visited.has(goal.key)) {
      return [start, goal];
    }

    const path: DoomNavCell[] = [];
    let currentKey: number | undefined = goal.key;
    while (currentKey !== undefined) {
      const cell = graph.walkableByKey.get(currentKey);
      if (!cell) {
        break;
      }
      path.push(cell);
      currentKey = previous.get(currentKey);
    }

    return path.reverse();
  };

  const compressPath = (cells: readonly DoomNavCell[]): Vector3[] => {
    if (cells.length <= 2) {
      return cells.map((cell) => new Vector3(cell.x, 0, cell.z));
    }

    const compressed = [cells[0]];
    for (let index = 1; index < cells.length - 1; index += 1) {
      const previous = compressed[compressed.length - 1];
      const current = cells[index];
      const next = cells[index + 1];
      const deltaRowA = current.row - previous.row;
      const deltaColumnA = current.column - previous.column;
      const deltaRowB = next.row - current.row;
      const deltaColumnB = next.column - current.column;

      if (deltaRowA !== deltaRowB || deltaColumnA !== deltaColumnB) {
        compressed.push(current);
      }
    }
    compressed.push(cells[cells.length - 1]);

    return compressed.map((cell) => new Vector3(cell.x, 0, cell.z));
  };

  return {
    snap(position, radius = 0.42): Vector3 {
      const cell = snapCell(position, radius);
      return new Vector3(cell.x, position.y, cell.z);
    },
    findPath(from, to, radius = 0.42): Vector3[] {
      const start = snapCell(from, radius);
      const goal = snapCell(to, radius);
      const path = findPathCells(start, goal, radius);
      return compressPath(path).map((waypoint) => waypoint.setY(from.y));
    },
  };
}

export function createDoomMode(): DoomModeData {
  const root = new Group();
  const colliders: CollisionBox[] = [];
  const doors: DoomDoor[] = [];
  const containers: DoomLootContainer[] = [];
  const pickups: DoomPickup[] = [];
  const enemySpawns: DoomEnemySpawn[] = [];
  const lights: PointLight[] = [];

  const areas: DoomArea[] = [
    {
      ...ENTRY_ROOM,
      floor: 0x49505a,
      openings: [
        { side: 'west', start: -113, end: -107 },
        { side: 'east', start: -113, end: -107 },
        { side: 'north', start: 617, end: 623 },
      ],
    },
    {
      ...STORAGE_ROOM,
      floor: 0x424954,
      openings: [{ side: 'east', start: -113, end: -107 }],
    },
    {
      ...MAINTENANCE_ROOM,
      floor: 0x3f444d,
      openings: [{ side: 'south', start: 617, end: 623 }],
    },
    {
      ...OPS_HUB,
      floor: 0x505862,
      openings: [
        { side: 'west', start: -113, end: -107 },
        { side: 'east', start: -113, end: -107 },
        { side: 'south', start: 646, end: 652 },
      ],
    },
    {
      ...SECURITY_OFFICE,
      floor: 0x444e58,
      openings: [{ side: 'north', start: 646, end: 652 }],
    },
    {
      ...REACTOR_HALL,
      floor: 0x4a505b,
      openings: [
        { side: 'west', start: -113, end: -107 },
        { side: 'east', start: -113, end: -107 },
        { side: 'south', start: 673, end: 679 },
        { side: 'north', start: 673, end: 679 },
      ],
    },
    {
      ...COOLING_ROOM,
      floor: 0x3c444e,
      openings: [{ side: 'north', start: 673, end: 679 }],
    },
    {
      ...FOUNDRY_ROOM,
      floor: 0x4a4139,
      openings: [{ side: 'south', start: 673, end: 679 }],
    },
    {
      ...EXIT_SPINE,
      floor: 0x50555d,
      openings: [
        { side: 'west', start: -113, end: -107 },
        { side: 'south', start: 701, end: 707 },
      ],
    },
    {
      ...SIDE_LAB,
      floor: 0x42515a,
      openings: [{ side: 'north', start: 701, end: 707 }],
    },
    {
      ...WEST_HALL,
      floor: 0x323842,
      openings: [
        { side: 'west', start: -113, end: -107 },
        { side: 'east', start: -113, end: -107 },
      ],
    },
    {
      ...NORTH_HALL,
      floor: 0x323842,
      openings: [
        { side: 'north', start: 617, end: 623 },
        { side: 'south', start: 617, end: 623 },
      ],
    },
    {
      ...RED_HALL,
      floor: 0x363c45,
      openings: [
        { side: 'west', start: -113, end: -107 },
        { side: 'east', start: -113, end: -107 },
      ],
    },
    {
      ...OFFICE_HALL,
      floor: 0x353c44,
      openings: [
        { side: 'north', start: 646, end: 652 },
        { side: 'south', start: 646, end: 652 },
      ],
    },
    {
      ...YELLOW_HALL,
      floor: 0x333942,
      openings: [
        { side: 'west', start: -113, end: -107 },
        { side: 'east', start: -113, end: -107 },
      ],
    },
    {
      ...COOLING_HALL,
      floor: 0x353c44,
      openings: [
        { side: 'north', start: 673, end: 679 },
        { side: 'south', start: 673, end: 679 },
      ],
    },
    {
      ...FOUNDRY_HALL,
      floor: 0x383d44,
      openings: [
        { side: 'north', start: 673, end: 679 },
        { side: 'south', start: 673, end: 679 },
      ],
    },
    {
      ...BLUE_HALL,
      floor: 0x363c45,
      openings: [
        { side: 'west', start: -113, end: -107 },
        { side: 'east', start: -113, end: -107 },
      ],
    },
    {
      ...LAB_HALL,
      floor: 0x363d46,
      openings: [
        { side: 'north', start: 701, end: 707 },
        { side: 'south', start: 701, end: 707 },
      ],
    },
  ];

  areas.forEach((area) => addRoomShell(root, colliders, area));

  lights.push(
    addCeilingLight(root, ENTRY_ROOM.x, ENTRY_ROOM.z, 0xbfd6ff),
    addCeilingLight(root, STORAGE_ROOM.x, STORAGE_ROOM.z, 0xb5d1ff),
    addCeilingLight(root, MAINTENANCE_ROOM.x, MAINTENANCE_ROOM.z, 0xff7b47),
    addCeilingLight(root, OPS_HUB.x, OPS_HUB.z, 0xffae58),
    addCeilingLight(root, SECURITY_OFFICE.x, SECURITY_OFFICE.z, 0x83d7ff),
    addCeilingLight(root, REACTOR_HALL.x, REACTOR_HALL.z, 0xff954b),
    addCeilingLight(root, COOLING_ROOM.x, COOLING_ROOM.z, 0x72e7ff),
    addCeilingLight(root, FOUNDRY_ROOM.x, FOUNDRY_ROOM.z, 0xff7245),
    addCeilingLight(root, EXIT_SPINE.x, EXIT_SPINE.z, 0x71a7ff),
    addCeilingLight(root, SIDE_LAB.x, SIDE_LAB.z, 0xb1f86b),
  );

  const acidLight = new PointLight(0x56ff74, 1.6, 16, 1.6);
  acidLight.position.set(COOLING_ROOM.x, 0.72, COOLING_ROOM.z - 1.4);
  const acidPool = new Mesh(new CylinderGeometry(3.1, 3.5, 0.08, 18), createMaterial(0x3d8f36, 0x60ff53, 0.36, 'floor'));
  acidPool.position.set(COOLING_ROOM.x, 0.05, COOLING_ROOM.z - 1.4);
  root.add(acidPool, acidLight);
  lights.push(acidLight);

  [
    [646.2, -110.3],
    [651.6, -110.3],
    [676.2, -110.4],
    [703.7, -110.1],
  ].forEach(([x, z]) => {
    const pillar = new Mesh(new BoxGeometry(1, WALL_HEIGHT, 1), createMaterial(0x38424d, 0, 0, 'wall'));
    pillar.position.set(x, WALL_HEIGHT * 0.5, z);
    root.add(pillar);
    addPropCollider(colliders, x, z, 0.5, 0.5);
  });

  [
    [647.2, -84.2],
    [680.1, -81.5],
    [679.3, -137.3],
    [706.8, -83.4],
  ].forEach(([x, z]) => {
    const barrel = new Mesh(new CylinderGeometry(0.56, 0.56, 1.1, 12), createMaterial(0x812e21, 0xff6e2a, 0.18, 'panel'));
    barrel.position.set(x, 0.55, z);
    root.add(barrel);
    addPropCollider(colliders, x, z, 0.58, 0.58);
  });

  doors.push(
    createDoor('red-access', 'Red Access Door', 'red', 634, -110, 'z'),
    createDoor('yellow-access', 'Yellow Access Door', 'yellow', 663, -110, 'z'),
    createDoor('blue-access', 'Blue Access Door', 'blue', 690, -110, 'z'),
  );
  doors.forEach((door) => {
    root.add(door.root);
    colliders.push(door.collider);
  });

  containers.push(
    createLootContainer('red-cache', 'Red key chest', 'key-chest', 619.8, -137.6, 'red-key', 1),
    createLootContainer('west-ammo', 'West ammo crate', 'ammo-crate', 594.3, -109.4, 'bullets', 24),
    createLootContainer('yellow-cache', 'Yellow key chest', 'key-chest', 649.1, -82.6, 'yellow-key', 1),
    createLootContainer('ops-ammo', 'Operations ammo crate', 'ammo-crate', 651.6, -113.6, 'shells', 10),
    createLootContainer('blue-cache', 'Blue key chest', 'key-chest', 675.9, -82.2, 'blue-key', 1),
    createLootContainer('reactor-ammo', 'Reactor ammo crate', 'ammo-crate', 705.7, -83.6, 'bullets', 30),
  );
  containers.forEach((container) => {
    root.add(container.root);
    addPropCollider(colliders, container.position.x, container.position.z, 0.84, 0.58);
  });

  const navigator = createDoomNavigator(areas, colliders);

  pickups.push(
    createPickup('armor', 'Armor', 623.5, -108.7, 0x79c7ff, 35),
    createPickup('medkit', 'Medkit', 594.8, -114.3, 0xff5353, 25),
    createPickup('shotgun', 'Shotgun', 676.1, -137.6, 0x8ad45e, 1),
    createPickup('medkit', 'Medkit', 680.4, -110.3, 0xff5353, 25),
    createPickup('armor', 'Armor', 707.6, -110.2, 0x79c7ff, 35),
  );
  pickups.forEach((pickup) => root.add(pickup.root));

  enemySpawns.push(
    { variant: 'imp', position: new Vector3(620.4, 0, -136.8) },
    { variant: 'imp', position: new Vector3(653.3, 0, -87.1) },
    { variant: 'imp', position: new Vector3(657.6, 0, -107.8) },
    { variant: 'pinky', position: new Vector3(682.6, 0, -107.8) },
    { variant: 'imp', position: new Vector3(672.2, 0, -85.4) },
    { variant: 'pinky', position: new Vector3(671.8, 0, -132.6) },
    { variant: 'imp', position: new Vector3(700.8, 0, -79.6) },
    { variant: 'imp', position: new Vector3(707.8, 0, -110.7) },
  );

  const exitSwitch = createExitSwitch(711.2, -110);
  root.add(exitSwitch.root);

  const spawn = new Vector3(618.3, 1.72, -109.7);
  const lookTarget = new Vector3(634, 1.72, -110);

  const update = (deltaSeconds: number): void => {
    doors.forEach((door) => {
      door.openAmount = Math.abs(door.openAmount - door.targetOpenAmount) < 0.001
        ? door.targetOpenAmount
        : door.openAmount + Math.sign(door.targetOpenAmount - door.openAmount) * Math.min(1, deltaSeconds * 1.9);
      door.slab.position.y = door.closedY + (door.openY - door.closedY) * door.openAmount;
      door.collider.enabled = door.openAmount < 0.82;
      door.light.intensity = 1 + Math.sin(performance.now() * 0.01 + door.position.x * 0.04) * 0.12 + (1 - door.openAmount) * 0.34;
    });

    containers.forEach((container, index) => {
      container.openAmount = Math.abs(container.openAmount - container.targetOpenAmount) < 0.001
        ? container.targetOpenAmount
        : container.openAmount + Math.sign(container.targetOpenAmount - container.openAmount) * Math.min(1, deltaSeconds * CHEST_OPEN_SPEED);
      container.lidHinge.rotation.x = -Math.PI * 0.82 * container.openAmount;
      container.closeTimer = Math.max(0, container.closeTimer - deltaSeconds);
      container.lootDisplayTimer = Math.max(0, container.lootDisplayTimer - deltaSeconds);
      if (container.closeTimer <= 0 && container.targetOpenAmount > 0 && container.lootClaimed) {
        container.targetOpenAmount = 0;
      }
      container.lootRoot.visible = container.lootDisplayTimer > 0 && container.openAmount > 0.55;
      if (container.lootRoot.visible) {
        container.lootRoot.rotation.y += deltaSeconds * 0.8;
        container.lootRoot.position.y = 0.88 + Math.sin(performance.now() * 0.0024 + index) * 0.05;
      } else {
        container.lootRoot.position.y = 0.88;
      }
      container.light.intensity = container.lootClaimed
        ? 0.2 + Math.sin(performance.now() * 0.008 + index) * 0.04
        : 0.9 + Math.sin(performance.now() * 0.012 + index) * 0.16;
    });

    pickups.forEach((pickup) => {
      if (pickup.collected) {
        return;
      }

      pickup.root.position.y = pickup.baseY + Math.sin(performance.now() * 0.0024 + pickup.phase) * 0.12;
      pickup.root.rotation.y += deltaSeconds * 0.9;
    });

    lights.forEach((light, index) => {
      light.intensity = Math.max(
        0.9,
        light.intensity * 0.8 + (1.12 + Math.sin(performance.now() * 0.0032 + index * 0.7) * 0.18) * 0.2,
      );
    });

    const exitMaterial = exitSwitch.screen.material;
    if (exitMaterial instanceof MeshStandardMaterial) {
      exitMaterial.emissiveIntensity = exitSwitch.activated ? 0.85 : 0.38 + Math.sin(performance.now() * 0.004) * 0.08;
      exitMaterial.color.setHex(exitSwitch.activated ? 0xb9ff79 : 0x8fb24b);
      exitMaterial.emissive.setHex(exitSwitch.activated ? 0x84ff49 : 0x5dd23f);
    }
  };

  const reset = (): void => {
    doors.forEach((door) => {
      door.open = false;
      door.openAmount = 0;
      door.targetOpenAmount = 0;
      door.slab.position.y = door.closedY;
      door.collider.enabled = true;
    });

    containers.forEach((container) => {
      container.openAmount = 0;
      container.targetOpenAmount = 0;
      container.closeTimer = 0;
      container.lootDisplayTimer = 0;
      container.lootClaimed = false;
      container.lidHinge.rotation.x = 0;
      container.lootRoot.visible = false;
    });

    pickups.forEach((pickup) => {
      pickup.collected = false;
      pickup.root.visible = true;
      pickup.root.position.y = pickup.baseY;
    });

    exitSwitch.activated = false;
  };

  reset();

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    navigator,
    pickups,
    doors,
    containers,
    exitSwitch,
    enemySpawns,
    update,
    reset,
  };
}
