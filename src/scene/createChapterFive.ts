import {
  BackSide,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';

import type { CollisionBox } from '../types/world';

export type ChapterFiveCockpitControlId = 'monitor' | 'toolbox' | 'damage';
export type ChapterFiveNavigationMode = 'cruise' | 'autopilot';
export type ChapterFiveMonitorAction =
  | { type: 'select-planet'; index: number }
  | { type: 'set-light-speed'; value: number }
  | { type: 'set-mode'; mode: ChapterFiveNavigationMode }
  | { type: 'toggle-autopilot' }
  | { type: 'set-coordinates' }
  | { type: 'toggle-engine' }
  | { type: 'toggle-radar' }
  | { type: 'landing-sequence' }
  | { type: 'escape-orbit' }
  | { type: 'launch-sequence' };

export interface ChapterFiveInputState {
  forward: number;
  strafe: number;
  sprint: boolean;
  lookDeltaX: number;
  lookDeltaY: number;
  aimDirection: Vector3;
  cameraPosition: Vector3;
  repairing: boolean;
}

export interface ChapterFiveCockpitControl {
  id: ChapterFiveCockpitControlId;
  label: string;
  prompt: string;
}

export interface ChapterFivePlanetMonitorState {
  label: string;
  miles: number;
  destination: boolean;
}

export interface ChapterFiveMonitorState {
  active: boolean;
  lightSpeed: number;
  engineOn: boolean;
  autopilot: boolean;
  navigationMode: ChapterFiveNavigationMode;
  orbiting: boolean;
  landingSequence: boolean;
  landed: boolean;
  arrivalAlarmActive: boolean;
  radarActive: boolean;
  destinationActive: boolean;
  destinationSelectionActive: boolean;
  destinationLabel: string;
  planets: ChapterFivePlanetMonitorState[];
}

export interface ChapterFiveData {
  root: Group;
  screenShip: Group;
  repairWrench: Group;
  colliders: CollisionBox[];
  spawn: Vector3;
  lookTarget: Vector3;
  interiorSpawn: Vector3;
  interiorLookTarget: Vector3;
  surfaceSpawn: Vector3;
  surfaceLookTarget: Vector3;
  isInteriorMode(): boolean;
  setInteriorMode(active: boolean): void;
  isSurfaceMode(): boolean;
  setSurfaceMode(active: boolean): void;
  getSupportedFloorY(position: Vector3): number | null;
  getCompassHeadingDegrees(): number;
  getFlightLookTarget(origin: Vector3, target?: Vector3): Vector3;
  getNearestCockpitControl(position: Vector3): ChapterFiveCockpitControl | null;
  interactCockpitControl(position: Vector3): string | null;
  setLightSpeed(value: number): string;
  setMonitorActive(active: boolean): void;
  applyMonitorAction(action: ChapterFiveMonitorAction): string;
  getMonitorState(): ChapterFiveMonitorState;
  update(deltaSeconds: number, input: ChapterFiveInputState): void;
  reset(): void;
}

const CENTER_X = 760;
const CENTER_Z = 230;
const CABIN_WIDTH = 2.7;
const CABIN_DEPTH = 6.4;
const CABIN_HEIGHT = 1.95;
const WALL_THICKNESS = 0.28;
const FLOOR_Y = 0;
const CAMERA_HEIGHT = 1.65;
const CAMERA_DISTANCE = 7.4;
const CAMERA_LOOK_AHEAD = 2.65;
const SHIP_SCREEN_DISTANCE = 6.5;
const SHIP_VERTICAL_SCREEN_OFFSET = -0.24;
const SHIP_DIVE_SCREEN_DROP = 0.82;
const SHIP_MODEL_CENTER_Y = 0.78;
const STAR_FAR_Z = -860;
const STAR_SPREAD = 245;
const JUNK_FAR_DISTANCE = 760;
const JUNK_RESET_BEHIND_DISTANCE = -96;
const INTERIOR_X = CENTER_X;
const INTERIOR_Z = CENTER_Z + 52;
const INTERIOR_WALL_HEIGHT = 3.05;
const INTERIOR_WALL_THICKNESS = 0.24;
const COCKPIT_INTERACTION_RANGE = 2.05;
const REPAIR_INTERACTION_RANGE = 1.65;
const LANDING_X = CENTER_X + 260;
const LANDING_Z = CENTER_Z + 420;
const LANDING_SURFACE_RADIUS = 190;

function addCollider(colliders: CollisionBox[], x: number, z: number, width: number, depth: number): void {
  colliders.push({
    centerX: x,
    centerZ: z,
    halfWidth: width / 2,
    halfDepth: depth / 2,
  });
}

function addBox(
  root: Group,
  material: MeshBasicMaterial | MeshStandardMaterial,
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
  height = INTERIOR_WALL_HEIGHT,
): Mesh {
  const wall = addBox(root, material, width, height, depth, x, height / 2, z);
  addCollider(colliders, x, z, width, depth);
  return wall;
}

function createTextPanel(text: string, width: number, height: number, backgroundColor: string, textColor: string): Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = 'rgba(180, 240, 255, 0.72)';
    context.lineWidth = 10;
    context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    context.fillStyle = textColor;
    context.font = '900 62px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 3);
  }

  const texture = new CanvasTexture(canvas);
  const material = new MeshBasicMaterial({ map: texture, transparent: true });
  return new Mesh(new PlaneGeometry(width, height), material);
}

function addInteriorPlant(
  root: Group,
  potMaterial: MeshStandardMaterial,
  stemMaterial: MeshStandardMaterial,
  leafMaterial: MeshStandardMaterial,
  flowerMaterial: MeshStandardMaterial,
  x: number,
  z: number,
  scale = 1,
): void {
  const pot = new Mesh(new CylinderGeometry(0.18 * scale, 0.24 * scale, 0.32 * scale, 16), potMaterial);
  pot.position.set(x, 0.16 * scale, z);
  root.add(pot);

  const stem = new Mesh(new CylinderGeometry(0.035 * scale, 0.045 * scale, 0.72 * scale, 10), stemMaterial);
  stem.position.set(x, 0.66 * scale, z);
  root.add(stem);

  const leafOffsets = [
    [-0.17, 0.68, 0.02],
    [0.18, 0.78, -0.04],
    [-0.08, 0.92, -0.13],
    [0.1, 1.02, 0.12],
  ] as const;
  leafOffsets.forEach(([offsetX, offsetY, offsetZ], index) => {
    const leaf = new Mesh(new SphereGeometry(0.18 * scale, 12, 8), leafMaterial);
    leaf.scale.set(1.35, 0.42, 0.72);
    leaf.rotation.y = index % 2 === 0 ? 0.48 : -0.58;
    leaf.rotation.z = index % 2 === 0 ? -0.28 : 0.24;
    leaf.position.set(x + offsetX * scale, offsetY * scale, z + offsetZ * scale);
    root.add(leaf);
  });

  const flower = new Mesh(new SphereGeometry(0.14 * scale, 14, 10), flowerMaterial);
  flower.scale.set(1, 0.72, 1);
  flower.position.set(x, 1.13 * scale, z);
  root.add(flower);
}

function createDistantPlanet(
  x: number,
  y: number,
  z: number,
  radius: number,
  bodyColor: number,
  cloudColor: number,
  atmosphereColor: number,
): Group {
  const planet = new Group();
  planet.position.set(x, y, z);

  const body = new Mesh(new SphereGeometry(radius, 64, 36), new MeshBasicMaterial({ color: bodyColor }));
  planet.add(body);

  const shade = new Mesh(new SphereGeometry(radius * 1.006, 64, 36), new MeshBasicMaterial({
    color: 0x07101d,
    opacity: 0.22,
    transparent: true,
  }));
  shade.position.set(-radius * 0.15, -radius * 0.12, radius * 0.08);
  planet.add(shade);

  const clouds = new Mesh(new SphereGeometry(radius * 1.032, 64, 36), new MeshBasicMaterial({
    color: cloudColor,
    opacity: 0.18,
    transparent: true,
  }));
  planet.add(clouds);

  const cloudPatchMaterial = new MeshBasicMaterial({
    color: cloudColor,
    opacity: 0.36,
    transparent: true,
  });
  const patches = [
    [-0.42, 0.24, 0.88, 0.34, 0.09],
    [0.18, 0.34, 0.9, 0.42, 0.1],
    [0.46, -0.08, 0.86, 0.3, 0.08],
    [-0.2, -0.32, 0.9, 0.46, 0.1],
    [0.02, 0.03, 0.97, 0.58, 0.08],
  ] as const;
  patches.forEach(([offsetX, offsetY, offsetZ, scaleX, scaleY], index) => {
    const patch = new Mesh(new SphereGeometry(radius * 0.26, 20, 10), cloudPatchMaterial);
    patch.scale.set(scaleX, scaleY, 0.045);
    patch.rotation.z = (index - 2) * 0.38;
    patch.position.set(offsetX * radius, offsetY * radius, offsetZ * radius);
    planet.add(patch);
  });

  const atmosphere = new Mesh(new SphereGeometry(radius * 1.16, 64, 36), new MeshBasicMaterial({
    color: atmosphereColor,
    opacity: 0.16,
    transparent: true,
  }));
  planet.add(atmosphere);

  return planet;
}

function dampAngle(current: number, target: number, lambda: number, deltaSeconds: number): number {
  const difference = MathUtils.euclideanModulo(target - current + Math.PI, Math.PI * 2) - Math.PI;
  return current + difference * (1 - Math.exp(-lambda * deltaSeconds));
}

interface ApproachStarField {
  points: Points;
  positions: Float32Array;
  reset(): void;
  update(deltaSeconds: number, speed: number, center: Vector3, forward: Vector3): void;
}

function createApproachStarField(count: number, color: number, size: number, seedOffset: number, opacity = 0.86): ApproachStarField {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const fieldForward = new Vector3(0, 0, -1);
  const fieldRight = new Vector3(1, 0, 0);
  const fieldWorldUp = new Vector3(0, 1, 0);
  const fieldUp = new Vector3(0, 1, 0);
  let seed = 12345 + seedOffset;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const setBasisFromForward = (forward: Vector3): void => {
    fieldForward.copy(forward);
    if (fieldForward.lengthSq() < 0.0001) {
      fieldForward.set(0, 0, -1);
    }
    fieldForward.normalize();
    fieldRight.crossVectors(fieldForward, fieldWorldUp);
    if (fieldRight.lengthSq() < 0.0001) {
      fieldRight.set(1, 0, 0);
    }
    fieldRight.normalize();
    fieldUp.crossVectors(fieldRight, fieldForward).normalize();
  };
  const resetStar = (index: number, initial: boolean, forward = fieldForward): void => {
    const offset = index * 3;
    if (initial) {
      const azimuth = random() * Math.PI * 2;
      const elevation = Math.asin(random() * 2 - 1);
      const distance = 120 + random() * 760;
      const horizontal = Math.cos(elevation) * distance;
      positions[offset] = Math.cos(azimuth) * horizontal;
      positions[offset + 1] = Math.sin(elevation) * distance;
      positions[offset + 2] = Math.sin(azimuth) * horizontal;
    } else {
      setBasisFromForward(forward);
      const distance = Math.abs(STAR_FAR_Z) * (0.82 + random() * 0.34);
      const angle = random() * Math.PI * 2;
      const radius = STAR_SPREAD * (random() < 0.28 ? random() * 0.32 : 0.34 + random() * 0.92);
      const side = Math.cos(angle) * radius;
      const vertical = Math.sin(angle) * radius * (0.46 + random() * 0.42);
      positions[offset] = fieldForward.x * distance + fieldRight.x * side + fieldUp.x * vertical;
      positions[offset + 1] = fieldForward.y * distance + fieldRight.y * side + fieldUp.y * vertical;
      positions[offset + 2] = fieldForward.z * distance + fieldRight.z * side + fieldUp.z * vertical;
    }
    speeds[index] = 0.42 + random() * random() * 1.75;
  };

  for (let index = 0; index < count; index += 1) {
    resetStar(index, true);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  const material = new PointsMaterial({
    color,
    size,
    opacity,
    sizeAttenuation: true,
    transparent: true,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;

  return {
    points,
    positions,
    reset() {
      for (let index = 0; index < count; index += 1) {
        resetStar(index, true);
      }
      const attribute = geometry.getAttribute('position');
      attribute.needsUpdate = true;
      points.position.set(0, 0, 0);
      points.rotation.set(0, 0, 0);
    },
    update(deltaSeconds, speed, center, forward) {
      setBasisFromForward(forward);
      const approach = (7.6 + speed * 1.62) * deltaSeconds;
      for (let index = 0; index < count; index += 1) {
        const offset = index * 3;
        const travel = approach * speeds[index];
        positions[offset] -= fieldForward.x * travel;
        positions[offset + 1] -= fieldForward.y * travel;
        positions[offset + 2] -= fieldForward.z * travel;
        const aheadDistance =
          positions[offset] * fieldForward.x
          + positions[offset + 1] * fieldForward.y
          + positions[offset + 2] * fieldForward.z;
        const distanceSquared =
          positions[offset] * positions[offset]
          + positions[offset + 1] * positions[offset + 1]
          + positions[offset + 2] * positions[offset + 2];
        if (aheadDistance < -220 || distanceSquared < 42 || distanceSquared > 1180 * 1180) {
          resetStar(index, false, fieldForward);
        }
      }
      const attribute = geometry.getAttribute('position');
      attribute.needsUpdate = true;
      points.position.copy(center);
      points.rotation.set(0, 0, 0);
    },
  };
}

interface SpaceJunkField {
  root: Group;
  reset(): void;
  update(deltaSeconds: number, speed: number, center: Vector3, forward: Vector3): void;
}

function createSpaceJunkField(count: number, seedOffset: number): SpaceJunkField {
  const root = new Group();
  root.name = 'Chapter 5 Passing Space Junk Field';
  const fieldForward = new Vector3(0, 0, -1);
  const fieldRight = new Vector3(1, 0, 0);
  const fieldWorldUp = new Vector3(0, 1, 0);
  const fieldUp = new Vector3(0, 1, 0);
  const pieces: Group[] = [];
  const speeds = new Float32Array(count);
  const spinX = new Float32Array(count);
  const spinY = new Float32Array(count);
  const spinZ = new Float32Array(count);
  let seed = 78123 + seedOffset;
  const random = () => {
    seed = (seed * 48271) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const materials = [
    new MeshBasicMaterial({ color: 0x7c858e }),
    new MeshBasicMaterial({ color: 0x424b58 }),
    new MeshBasicMaterial({ color: 0x9c5f46 }),
    new MeshBasicMaterial({ color: 0x2a6084 }),
    new MeshBasicMaterial({ color: 0xb7b8aa }),
  ];
  const setBasisFromForward = (forward: Vector3): void => {
    fieldForward.copy(forward);
    if (fieldForward.lengthSq() < 0.0001) {
      fieldForward.set(0, 0, -1);
    }
    fieldForward.normalize();
    fieldRight.crossVectors(fieldForward, fieldWorldUp);
    if (fieldRight.lengthSq() < 0.0001) {
      fieldRight.set(1, 0, 0);
    }
    fieldRight.normalize();
    fieldUp.crossVectors(fieldRight, fieldForward).normalize();
  };
  const addJunkPart = (
    piece: Group,
    material: MeshBasicMaterial,
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
  ): Mesh => {
    const part = new Mesh(new BoxGeometry(width, height, depth), material);
    part.position.set(x, y, z);
    part.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
    piece.add(part);
    return part;
  };
  const createPiece = (index: number): Group => {
    const piece = new Group();
    piece.name = `Space Junk ${index + 1}`;
    const material = materials[index % materials.length];
    const coreWidth = 0.45 + random() * 2.4;
    const coreHeight = 0.06 + random() * 0.32;
    const coreDepth = 0.32 + random() * 2.8;
    addJunkPart(piece, material, coreWidth, coreHeight, coreDepth, 0, 0, 0);

    if (random() > 0.24) {
      const pipe = new Mesh(new CylinderGeometry(0.04 + random() * 0.13, 0.05 + random() * 0.14, 0.7 + random() * 3.2, 8), material);
      pipe.position.set((random() - 0.5) * 1.4, (random() - 0.5) * 0.55, (random() - 0.5) * 1.8);
      pipe.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
      piece.add(pipe);
    }

    if (random() > 0.42) {
      addJunkPart(
        piece,
        materials[(index + 2) % materials.length],
        0.14 + random() * 0.42,
        0.12 + random() * 0.5,
        0.14 + random() * 0.56,
        (random() - 0.5) * 1.9,
        (random() - 0.5) * 0.78,
        (random() - 0.5) * 2.2,
      );
    }

    if (random() > 0.54) {
      const antenna = new Mesh(new CylinderGeometry(0.012, 0.018, 1.2 + random() * 1.7, 6), materials[4]);
      antenna.position.set((random() - 0.5) * 1.1, (random() - 0.5) * 0.55, (random() - 0.5) * 1.2);
      antenna.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
      piece.add(antenna);
    }

    piece.scale.setScalar(0.82 + random() * 2.35);
    piece.traverse((object) => {
      object.frustumCulled = false;
    });
    root.add(piece);
    return piece;
  };
  const resetPiece = (index: number, initial: boolean, forward = fieldForward): void => {
    setBasisFromForward(forward);
    const piece = pieces[index];
    const clusterLane = random();
    const distance = (initial ? 95 + random() * JUNK_FAR_DISTANCE : JUNK_FAR_DISTANCE * (0.74 + random() * 0.42));
    const sideSpread = clusterLane < 0.5 ? 10 + random() * 32 : 42 + random() * 118;
    const side = (random() < 0.5 ? -1 : 1) * sideSpread;
    const vertical = (random() - 0.48) * (clusterLane < 0.5 ? 34 : 82);
    piece.position.set(
      fieldForward.x * distance + fieldRight.x * side + fieldUp.x * vertical,
      fieldForward.y * distance + fieldRight.y * side + fieldUp.y * vertical,
      fieldForward.z * distance + fieldRight.z * side + fieldUp.z * vertical,
    );
    piece.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
    speeds[index] = 0.62 + random() * 1.65;
    spinX[index] = (random() - 0.5) * 0.9;
    spinY[index] = (random() - 0.5) * 1.2;
    spinZ[index] = (random() - 0.5) * 0.95;
  };

  for (let index = 0; index < count; index += 1) {
    pieces.push(createPiece(index));
  }
  for (let index = 0; index < count; index += 1) {
    resetPiece(index, true);
  }

  return {
    root,
    reset() {
      for (let index = 0; index < count; index += 1) {
        resetPiece(index, true);
      }
      root.position.set(0, 0, 0);
    },
    update(deltaSeconds, speed, center, forward) {
      setBasisFromForward(forward);
      const travel = (16 + speed * 2.25) * deltaSeconds;
      for (let index = 0; index < count; index += 1) {
        const piece = pieces[index];
        piece.position.x -= fieldForward.x * travel * speeds[index];
        piece.position.y -= fieldForward.y * travel * speeds[index];
        piece.position.z -= fieldForward.z * travel * speeds[index];
        piece.rotation.x += spinX[index] * deltaSeconds;
        piece.rotation.y += spinY[index] * deltaSeconds;
        piece.rotation.z += spinZ[index] * deltaSeconds;
        const aheadDistance = piece.position.x * fieldForward.x
          + piece.position.y * fieldForward.y
          + piece.position.z * fieldForward.z;
        const distanceSquared = piece.position.lengthSq();
        if (aheadDistance < JUNK_RESET_BEHIND_DISTANCE || distanceSquared < 56 || distanceSquared > 980 * 980) {
          resetPiece(index, false, fieldForward);
        }
      }
      root.position.copy(center);
    },
  };
}

function createLandableJunkClump(radius: number, seedOffset: number): Group {
  const clump = new Group();
  clump.name = 'Landable Space Junk Clump';
  const materials = [
    new MeshBasicMaterial({ color: 0x7d8791 }),
    new MeshBasicMaterial({ color: 0x343d49 }),
    new MeshBasicMaterial({ color: 0xa4674d }),
    new MeshBasicMaterial({ color: 0x244e72 }),
    new MeshBasicMaterial({ color: 0xc7c2aa }),
  ];
  let seed = 91873 + seedOffset;
  const random = () => {
    seed = (seed * 48271) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const partCount = Math.max(48, Math.round(radius * 1.8));
  for (let index = 0; index < partCount; index += 1) {
    const material = materials[index % materials.length];
    const part = new Mesh(
      new BoxGeometry(
        radius * (0.06 + random() * 0.22),
        radius * (0.025 + random() * 0.09),
        radius * (0.06 + random() * 0.24),
      ),
      material,
    );
    const angle = index * 2.399 + random() * 0.4;
    const distance = radius * (0.12 + random() * 0.9);
    const height = radius * (random() - 0.5) * 0.28;
    part.position.set(Math.cos(angle) * distance, height, Math.sin(angle) * distance);
    part.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
    clump.add(part);
  }

  for (let index = 0; index < 9; index += 1) {
    const pipe = new Mesh(
      new CylinderGeometry(radius * 0.018, radius * 0.025, radius * (0.7 + random() * 0.85), 8),
      materials[(index + 1) % materials.length],
    );
    pipe.position.set(
      radius * (random() - 0.5) * 1.12,
      radius * (random() - 0.5) * 0.5,
      radius * (random() - 0.5) * 1.12,
    );
    pipe.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
    clump.add(pipe);
  }

  const brokenRing = new Mesh(new TorusGeometry(radius * 0.58, radius * 0.018, 8, 32), materials[4]);
  brokenRing.rotation.set(0.9, 0.4, -0.32);
  clump.add(brokenRing);
  clump.scale.y = 0.42;
  clump.traverse((object) => {
    object.frustumCulled = false;
  });
  return clump;
}

function addEngine(
  root: Group,
  metalMaterial: MeshStandardMaterial,
  flameMaterial: MeshBasicMaterial,
  hotCoreMaterial: MeshBasicMaterial,
  x: number,
  z: number,
): { flame: Group; light: PointLight } {
  const engine = new Mesh(new CylinderGeometry(0.36, 0.44, 1.05, 20), metalMaterial);
  engine.rotation.x = Math.PI / 2;
  engine.position.set(x, 0.82, z);
  root.add(engine);

  const ring = new Mesh(new CylinderGeometry(0.42, 0.42, 0.12, 20), metalMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, 0.82, z + 0.58);
  root.add(ring);

  const flame = new Group();
  flame.position.set(x, 0.82, z + 0.72);
  flame.rotation.x = Math.PI / 2;

  const outer = new Mesh(new ConeGeometry(0.34, 1.25, 18), flameMaterial);
  outer.position.y = 0.54;
  flame.add(outer);

  const core = new Mesh(new ConeGeometry(0.16, 0.82, 18), hotCoreMaterial);
  core.position.y = 0.42;
  flame.add(core);

  const light = new PointLight(0xff9b22, 1.2, 7.5, 2);
  light.position.set(x, 0.82, z + 1.15);
  root.add(flame, light);

  return { flame, light };
}

export function createChapterFive(): ChapterFiveData {
  const root = new Group();
  root.name = 'Chapter 5 Spaceship';
  const colliders: CollisionBox[] = [];

  const hullMaterial = new MeshStandardMaterial({
    color: 0x6d7887,
    metalness: 0.72,
    roughness: 0.32,
  });
  const darkHullMaterial = new MeshStandardMaterial({
    color: 0x232a35,
    metalness: 0.85,
    roughness: 0.38,
  });
  const floorMaterial = new MeshStandardMaterial({
    color: 0x2f3744,
    metalness: 0.5,
    roughness: 0.55,
  });
  const glassMaterial = new MeshStandardMaterial({
    color: 0x86c9ff,
    emissive: 0x0d2842,
    emissiveIntensity: 0.34,
    metalness: 0.02,
    opacity: 0.34,
    roughness: 0.08,
    transparent: true,
  });
  const panelMaterial = new MeshStandardMaterial({
    color: 0x111723,
    emissive: 0x0f6f92,
    emissiveIntensity: 0.45,
    metalness: 0.2,
    roughness: 0.35,
  });
  const flameMaterial = new MeshBasicMaterial({
    color: 0xff6a12,
    opacity: 0.78,
    transparent: true,
  });
  const hotCoreMaterial = new MeshBasicMaterial({
    color: 0xfff1a6,
    opacity: 0.88,
    transparent: true,
  });
  const monitorScreenMaterial = new MeshStandardMaterial({
    color: 0x07141e,
    emissive: 0x26b8ff,
    emissiveIntensity: 0.62,
    metalness: 0.08,
    roughness: 0.28,
  });
  const radarScreenMaterial = new MeshBasicMaterial({
    color: 0x062412,
    transparent: true,
    opacity: 0.82,
  });
  const radarSweepMaterial = new MeshBasicMaterial({
    color: 0x55ff9b,
    transparent: true,
    opacity: 0.78,
  });
  const radarBlipMaterial = new MeshBasicMaterial({ color: 0xb9ffd6 });
  const wireMaterial = new MeshStandardMaterial({
    color: 0x0b0d12,
    metalness: 0.35,
    roughness: 0.48,
  });
  const alarmLightMaterial = new MeshBasicMaterial({ color: 0xff2020 });

  const blueStars = createApproachStarField(190, 0x9fc5ff, 2.3, 0);
  const whiteStars = createApproachStarField(74, 0xffffff, 3.25, 200);
  const redNebulaDust = createApproachStarField(72, 0xff745c, 10.5, 420, 0.34);
  const cyanNebulaDust = createApproachStarField(58, 0x55bfff, 8.4, 840, 0.3);
  const spaceJunk = createSpaceJunkField(18, 1200);
  root.add(redNebulaDust.points, cyanNebulaDust.points, blueStars.points, whiteStars.points, spaceJunk.root);

  const planetSky = new Group();
  planetSky.name = 'Round Distant Planets';
  const planetDefinitions = [
    { label: 'Blue Cloud Planet', miles: 184000, x: CENTER_X - 78, y: 30, z: CENTER_Z - 335, radius: 18, body: 0x2d75af, cloud: 0xf4fbff, atmosphere: 0x66c7ff },
    { label: 'Rust Planet', miles: 116000, x: CENTER_X + 86, y: -8, z: CENTER_Z - 260, radius: 12, body: 0xb66b2e, cloud: 0xffe0b6, atmosphere: 0xff9b47 },
    { label: 'Violet Giant', miles: 392000, x: CENTER_X + 132, y: 48, z: CENTER_Z - 560, radius: 27, body: 0x6a5cbd, cloud: 0xd9d6ff, atmosphere: 0xa99dff },
    { label: 'Green Ocean Planet', miles: 248000, x: CENTER_X - 120, y: 18, z: CENTER_Z + 305, radius: 16, body: 0x278f7c, cloud: 0xe9fff9, atmosphere: 0x6af5d6 },
    { label: 'Copper Planet', miles: 510000, x: CENTER_X + 154, y: 36, z: CENTER_Z + 418, radius: 23, body: 0x8b4f2f, cloud: 0xffd9c2, atmosphere: 0xffa56f },
    { label: 'Tiny Ice Planet', miles: 76000, x: CENTER_X - 185, y: -16, z: CENTER_Z + 92, radius: 10, body: 0x466cb5, cloud: 0xedf4ff, atmosphere: 0x8db7ff },
  ];
  const distantPlanets = planetDefinitions.map((definition) => (
    createDistantPlanet(definition.x, definition.y, definition.z, definition.radius, definition.body, definition.cloud, definition.atmosphere)
  ));
  distantPlanets.forEach((planet, index) => {
    planet.rotation.y = index * 0.65;
    planet.rotation.x = -0.08 + index * 0.05;
    planetSky.add(planet);
  });
  const junkDefinitions = [
    { label: 'Scrap Field Alpha', miles: 92000, x: CENTER_X + 42, y: 12, z: CENTER_Z - 180, radius: 38 },
    { label: 'Wreckage Cluster Beta', miles: 154000, x: CENTER_X - 142, y: 26, z: CENTER_Z - 455, radius: 52 },
  ];
  const distantJunkClumps = junkDefinitions.map((definition, index) => {
    const clump = createLandableJunkClump(definition.radius, 600 + index * 140);
    clump.position.set(definition.x, definition.y, definition.z);
    clump.rotation.set(0.25 + index * 0.4, index * 0.9, -0.18);
    planetSky.add(clump);
    return clump;
  });
  root.add(planetSky);

  const nearPlanets = planetDefinitions.map((definition) => (
    createDistantPlanet(0, 0, 0, definition.radius, definition.body, definition.cloud, definition.atmosphere)
  ));
  nearPlanets.forEach((planet) => {
    planet.visible = false;
    planet.traverse((object) => {
      object.frustumCulled = false;
    });
    root.add(planet);
  });
  const nearJunkClumps = junkDefinitions.map((definition, index) => {
    const clump = createLandableJunkClump(definition.radius, 900 + index * 140);
    clump.visible = false;
    root.add(clump);
    return clump;
  });
  const destinationObjects = [...distantPlanets, ...distantJunkClumps];
  const nearDestinationObjects = [...nearPlanets, ...nearJunkClumps];

  const destinationMarkerMaterial = new MeshBasicMaterial({
    color: 0xfff07a,
    opacity: 0.92,
    transparent: true,
  });
  const destinationMarker = new Group();
  destinationMarker.visible = false;
  const destinationRing = new Mesh(new TorusGeometry(1, 0.025, 8, 48), destinationMarkerMaterial);
  const destinationBarX = new Mesh(new BoxGeometry(2.6, 0.045, 0.045), destinationMarkerMaterial);
  const destinationBarY = new Mesh(new BoxGeometry(0.045, 2.6, 0.045), destinationMarkerMaterial);
  destinationMarker.add(destinationRing, destinationBarX, destinationBarY);
  root.add(destinationMarker);

  const getLandingTerrainOffset = (localX: number, localZ: number): number => {
    const distance = Math.hypot(localX, localZ);
    const edgeFade = MathUtils.clamp(1 - distance / LANDING_SURFACE_RADIUS, 0, 1);
    const landingPadFade = MathUtils.smoothstep(Math.hypot(localX, localZ - 5), 8, 28);
    const rolling =
      Math.sin(localX * 0.026) * 0.62
      + Math.cos(localZ * 0.023) * 0.54
      + Math.sin((localX + localZ) * 0.014) * 0.46
      + Math.cos((localX - localZ) * 0.018) * 0.34;
    return MathUtils.clamp(rolling * (0.32 + edgeFade * 0.9) * landingPadFade, -1.15, 1.65);
  };

  const createLandingTerrainGeometry = (): PlaneGeometry => {
    const geometry = new PlaneGeometry(LANDING_SURFACE_RADIUS * 2, LANDING_SURFACE_RADIUS * 2, 72, 72);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.getAttribute('position');
    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const z = positions.getZ(index);
      const distance = Math.hypot(x, z);
      const edgeDrop = MathUtils.smoothstep(distance, LANDING_SURFACE_RADIUS * 0.82, LANDING_SURFACE_RADIUS) * -0.45;
      positions.setY(index, getLandingTerrainOffset(x, z) + edgeDrop);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  };

  const landingSurface = new Group();
  landingSurface.name = 'Chapter 5 Landed Planet Surface';
  landingSurface.visible = false;
  landingSurface.position.set(LANDING_X, 0, LANDING_Z);
  const landingGroundMaterial = new MeshStandardMaterial({
    color: 0x6fb7c0,
    emissive: 0x2f6570,
    emissiveIntensity: 0.38,
    roughness: 0.9,
    metalness: 0.01,
  });
  const landingRockMaterial = new MeshStandardMaterial({
    color: 0xa7b7bf,
    emissive: 0x27353b,
    emissiveIntensity: 0.22,
    roughness: 0.9,
    metalness: 0.03,
  });
  const landingStructureMaterial = new MeshStandardMaterial({
    color: 0x9aa7ad,
    emissive: 0x20262b,
    emissiveIntensity: 0.18,
    roughness: 0.78,
    metalness: 0.32,
  });
  const landingDarkStructureMaterial = new MeshStandardMaterial({
    color: 0x59616b,
    emissive: 0x15191f,
    emissiveIntensity: 0.18,
    roughness: 0.82,
    metalness: 0.42,
  });
  const landingGlassMaterial = new MeshStandardMaterial({
    color: 0x83d4ff,
    emissive: 0x093049,
    emissiveIntensity: 0.22,
    opacity: 0.3,
    roughness: 0.08,
    transparent: true,
  });
  const landingGround = new Mesh(createLandingTerrainGeometry(), landingGroundMaterial);
  landingSurface.add(landingGround);
  [
    [-38, 0.18, -24, 1.7],
    [48, 0.2, -38, 2.2],
    [-72, 0.16, 34, 1.4],
    [74, 0.2, 52, 2.0],
    [16, 0.14, 72, 1.1],
    [-112, 0.2, -78, 2.4],
    [118, 0.18, -88, 1.8],
  ].forEach(([x, y, z, scale]) => {
    const rock = new Mesh(new SphereGeometry(scale, 12, 8), landingRockMaterial);
    rock.scale.y = 0.36;
    rock.position.set(x, getLandingTerrainOffset(x, z) + y, z);
    landingSurface.add(rock);
  });
  root.add(landingSurface);

  const landingHillMaterial = new MeshStandardMaterial({
    color: 0x315d53,
    roughness: 0.98,
    metalness: 0.01,
  });
  [
    [-120, 2.2, -128, 34, 5.6],
    [-48, 1.8, -148, 24, 4.2],
    [58, 2.15, -136, 32, 5.4],
    [132, 1.9, -96, 28, 4.5],
    [-136, 1.7, 78, 28, 4.2],
    [128, 1.65, 92, 26, 4.1],
    [2, 1.35, 142, 24, 3.6],
  ].forEach(([x, y, z, radius, scaleY]) => {
    const hill = new Mesh(new SphereGeometry(radius, 24, 12), landingHillMaterial);
    hill.scale.y = scaleY / radius;
    hill.position.set(x, y, z);
    landingSurface.add(hill);
  });

  const landingShip = new Group();
  landingShip.name = 'Landed Spaceship On Planet';
  landingShip.position.set(0, 0, 5);
  landingShip.rotation.y = 0.22;
  landingShip.visible = false;
  landingSurface.add(landingShip);
  const landedBody = new Mesh(new CylinderGeometry(1.15, 1.42, 7.2, 28), hullMaterial);
  landedBody.rotation.x = Math.PI / 2;
  landedBody.position.set(0, 0.78, 0);
  landingShip.add(landedBody);
  const landedNose = new Mesh(new ConeGeometry(1.65, 2.45, 28), hullMaterial);
  landedNose.rotation.x = -Math.PI / 2;
  landedNose.position.set(0, 0.78, -4.72);
  landingShip.add(landedNose);
  const landedCanopy = new Mesh(new SphereGeometry(0.92, 24, 14), glassMaterial);
  landedCanopy.scale.set(1.05, 0.38, 1.38);
  landedCanopy.position.set(0, 1.42, -1.55);
  landingShip.add(landedCanopy);
  const landedLeftWing = addBox(landingShip, darkHullMaterial, 3.6, 0.16, 1.38, -2.7, 0.36, 1.2);
  landedLeftWing.rotation.z = -0.18;
  landedLeftWing.rotation.y = -0.12;
  const landedRightWing = addBox(landingShip, darkHullMaterial, 3.6, 0.16, 1.38, 2.7, 0.36, 1.2);
  landedRightWing.rotation.z = 0.18;
  landedRightWing.rotation.y = 0.12;
  addBox(landingShip, darkHullMaterial, 0.24, 1.35, 1.2, 0, 1.3, 3.8);
  addBox(landingShip, landingDarkStructureMaterial, 0.42, 0.42, 1.1, -1.35, 0.78, 4.08);
  addBox(landingShip, landingDarkStructureMaterial, 0.42, 0.42, 1.1, 1.35, 0.78, 4.08);
  addBox(landingShip, landingStructureMaterial, 0.16, 0.82, 0.16, -1.0, 0.38, -2.2);
  addBox(landingShip, landingStructureMaterial, 0.16, 0.82, 0.16, 1.0, 0.38, -2.2);
  addBox(landingShip, landingStructureMaterial, 0.16, 0.82, 0.16, -1.18, 0.38, 2.2);
  addBox(landingShip, landingStructureMaterial, 0.16, 0.82, 0.16, 1.18, 0.38, 2.2);
  const landedShadow = new Mesh(new CylinderGeometry(4.8, 4.8, 0.025, 48), new MeshBasicMaterial({
    color: 0x000000,
    opacity: 0.22,
    transparent: true,
  }));
  landedShadow.scale.z = 0.42;
  landedShadow.position.set(0, 0.012, 0.7);
  landingShip.add(landedShadow);
  addCollider(colliders, LANDING_X, LANDING_Z + 5.7, 4.8, 7.6);

  const addLandingBox = (
    material: MeshBasicMaterial | MeshStandardMaterial,
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    collider = true,
  ): Mesh => {
    const box = addBox(landingSurface, material, width, height, depth, x, getLandingTerrainOffset(x, z) + y, z);
    if (collider) {
      addCollider(colliders, LANDING_X + x, LANDING_Z + z, width, depth);
    }
    return box;
  };

  addLandingBox(landingStructureMaterial, 6.8, 2.1, 0.42, -58, 1.05, -54);
  addLandingBox(landingStructureMaterial, 0.44, 2.1, 5.1, -61.2, 1.05, -51.7);
  addLandingBox(landingDarkStructureMaterial, 2.4, 0.28, 3.2, -54.2, 0.14, -48.7, false);
  const brokenTower = addLandingBox(landingStructureMaterial, 1.35, 7.2, 1.35, 68, 3.6, -62);
  brokenTower.rotation.z = -0.12;
  addLandingBox(landingDarkStructureMaterial, 4.8, 0.34, 0.34, 70.4, 6.9, -62, false).rotation.z = 0.26;
  addLandingBox(landingStructureMaterial, 8.4, 0.4, 0.48, 18, 2.15, 70, false).rotation.z = 0.14;
  addLandingBox(landingStructureMaterial, 0.42, 3.8, 0.42, 14.1, 1.9, 70);
  addLandingBox(landingStructureMaterial, 0.42, 3.3, 0.42, 22.1, 1.65, 70);
  addLandingBox(landingDarkStructureMaterial, 5.6, 1.6, 3.4, -88, 0.8, 62);
  addLandingBox(landingGlassMaterial, 3.2, 0.62, 0.08, -88, 1.38, 60.25, false);
  const antenna = new Mesh(new CylinderGeometry(0.08, 0.12, 6.8, 10), landingStructureMaterial);
  antenna.position.set(102, getLandingTerrainOffset(102, 34) + 3.4, 34);
  antenna.rotation.z = 0.18;
  landingSurface.add(antenna);
  addCollider(colliders, LANDING_X + 102, LANDING_Z + 34, 0.8, 0.8);
  const antennaDish = new Mesh(new SphereGeometry(0.72, 18, 10), landingGlassMaterial);
  antennaDish.scale.set(1.2, 0.18, 0.72);
  antennaDish.position.set(102.8, getLandingTerrainOffset(102, 34) + 6.6, 34.2);
  antennaDish.rotation.z = 0.5;
  landingSurface.add(antennaDish);

  const landingAtmosphere = new Group();
  landingAtmosphere.name = 'Chapter 5 Landed Atmosphere';
  landingAtmosphere.visible = false;
  landingAtmosphere.position.set(LANDING_X, 0, LANDING_Z);
  const landingSkyMaterial = new MeshBasicMaterial({
    color: 0x7eaec0,
    side: BackSide,
    transparent: true,
    opacity: 0.96,
  });
  const landingSky = new Mesh(new SphereGeometry(520, 48, 24), landingSkyMaterial);
  landingAtmosphere.add(landingSky);
  const landingSunLight = new PointLight(0xfff4d6, 8.5, 620, 1.08);
  landingSunLight.position.set(-64, 115, -92);
  const landingBlueFillLight = new PointLight(0x9fe7ff, 4.2, 360, 1.25);
  landingBlueFillLight.position.set(116, 42, 86);
  const landingShipFillLight = new PointLight(0xffffff, 3.8, 120, 1.6);
  landingShipFillLight.position.set(-8, 8, 24);
  landingAtmosphere.add(landingSunLight, landingBlueFillLight);
  landingSurface.add(landingShipFillLight);
  const landingHazeMaterial = new MeshBasicMaterial({
    color: 0xc8e6dc,
    transparent: true,
    opacity: 0.18,
  });
  [
    [0, 2.5, -122, 0],
    [-92, 2.3, -86, 0.55],
    [104, 2.15, -78, -0.48],
    [32, 2.05, 114, 0.22],
  ].forEach(([x, y, z, rotationY]) => {
    const haze = new Mesh(new PlaneGeometry(118, 24), landingHazeMaterial);
    haze.position.set(x, y, z);
    haze.rotation.y = rotationY;
    landingAtmosphere.add(haze);
  });
  root.add(landingAtmosphere);

  const ship = new Group();
  ship.name = 'Third Person Spaceship';
  ship.visible = false;
  root.add(ship);

  const halfWidth = CABIN_WIDTH / 2;
  const halfDepth = CABIN_DEPTH / 2;
  const ceilingY = FLOOR_Y + CABIN_HEIGHT;

  const fuselage = new Mesh(new CylinderGeometry(1.1, 1.38, CABIN_DEPTH + 2.2, 32), hullMaterial);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.set(CENTER_X, 0.78, CENTER_Z + 0.28);
  ship.add(fuselage);

  const belly = new Mesh(new CylinderGeometry(0.72, 0.92, CABIN_DEPTH + 1.2, 24), darkHullMaterial);
  belly.rotation.x = Math.PI / 2;
  belly.position.set(CENTER_X, 0.34, CENTER_Z + 0.42);
  belly.scale.x = 1.28;
  ship.add(belly);

  addBox(ship, floorMaterial, CABIN_WIDTH, 0.18, CABIN_DEPTH, CENTER_X, FLOOR_Y - 0.09, CENTER_Z);
  addBox(ship, darkHullMaterial, CABIN_WIDTH, 0.16, CABIN_DEPTH, CENTER_X, ceilingY + 0.04, CENTER_Z);
  addBox(
    ship,
    hullMaterial,
    WALL_THICKNESS,
    CABIN_HEIGHT,
    CABIN_DEPTH,
    CENTER_X - halfWidth - WALL_THICKNESS / 2,
    CABIN_HEIGHT / 2,
    CENTER_Z,
  );
  addBox(
    ship,
    hullMaterial,
    WALL_THICKNESS,
    CABIN_HEIGHT,
    CABIN_DEPTH,
    CENTER_X + halfWidth + WALL_THICKNESS / 2,
    CABIN_HEIGHT / 2,
    CENTER_Z,
  );
  addBox(
    ship,
    glassMaterial,
    CABIN_WIDTH + WALL_THICKNESS * 2,
    CABIN_HEIGHT,
    WALL_THICKNESS,
    CENTER_X,
    CABIN_HEIGHT / 2,
    CENTER_Z + halfDepth + WALL_THICKNESS / 2,
  );
  addBox(ship, darkHullMaterial, CABIN_WIDTH + WALL_THICKNESS * 2, 0.24, WALL_THICKNESS + 0.03, CENTER_X, 0.26, CENTER_Z + halfDepth + WALL_THICKNESS / 2);
  addBox(ship, darkHullMaterial, CABIN_WIDTH + WALL_THICKNESS * 2, 0.18, WALL_THICKNESS + 0.03, CENTER_X, ceilingY - 0.16, CENTER_Z + halfDepth + WALL_THICKNESS / 2);
  addBox(ship, darkHullMaterial, 0.18, CABIN_HEIGHT, WALL_THICKNESS + 0.03, CENTER_X - halfWidth + 0.42, CABIN_HEIGHT / 2, CENTER_Z + halfDepth + WALL_THICKNESS / 2);
  addBox(ship, darkHullMaterial, 0.18, CABIN_HEIGHT, WALL_THICKNESS + 0.03, CENTER_X + halfWidth - 0.42, CABIN_HEIGHT / 2, CENTER_Z + halfDepth + WALL_THICKNESS / 2);
  addBox(
    ship,
    glassMaterial,
    CABIN_WIDTH + WALL_THICKNESS * 2,
    CABIN_HEIGHT,
    WALL_THICKNESS,
    CENTER_X,
    CABIN_HEIGHT / 2,
    CENTER_Z - halfDepth - WALL_THICKNESS / 2,
  );

  addCollider(colliders, CENTER_X - halfWidth - WALL_THICKNESS / 2, CENTER_Z, WALL_THICKNESS, CABIN_DEPTH + WALL_THICKNESS);
  addCollider(colliders, CENTER_X + halfWidth + WALL_THICKNESS / 2, CENTER_Z, WALL_THICKNESS, CABIN_DEPTH + WALL_THICKNESS);
  addCollider(colliders, CENTER_X, CENTER_Z + halfDepth + WALL_THICKNESS / 2, CABIN_WIDTH + WALL_THICKNESS * 2, WALL_THICKNESS);
  addCollider(colliders, CENTER_X, CENTER_Z - halfDepth - WALL_THICKNESS / 2, CABIN_WIDTH + WALL_THICKNESS * 2, WALL_THICKNESS);

  const nose = new Mesh(new ConeGeometry(1.85, 2.8, 28), hullMaterial);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(CENTER_X, 0.78, CENTER_Z - halfDepth - 1.18);
  ship.add(nose);

  const noseTip = new Mesh(new ConeGeometry(0.72, 1.45, 24), darkHullMaterial);
  noseTip.rotation.x = -Math.PI / 2;
  noseTip.position.set(CENTER_X, 0.78, CENTER_Z - halfDepth - 2.52);
  ship.add(noseTip);

  const canopy = new Mesh(new SphereGeometry(1, 24, 14), glassMaterial);
  canopy.scale.set(1.05, 0.42, 1.48);
  canopy.position.set(CENTER_X, 1.42, CENTER_Z - 1.28);
  ship.add(canopy);

  addBox(ship, darkHullMaterial, 0.14, 0.16, CABIN_DEPTH + 1.6, CENTER_X, 1.72, CENTER_Z + 0.1);
  addBox(ship, darkHullMaterial, 0.16, 0.14, CABIN_DEPTH + 0.9, CENTER_X - 1.08, 0.82, CENTER_Z + 0.34);
  addBox(ship, darkHullMaterial, 0.16, 0.14, CABIN_DEPTH + 0.9, CENTER_X + 1.08, 0.82, CENTER_Z + 0.34);

  const leftWing = addBox(ship, darkHullMaterial, 3.2, 0.16, 1.35, CENTER_X - halfWidth - 1.85, 0.32, CENTER_Z + 1.35);
  leftWing.rotation.z = -0.2;
  leftWing.rotation.y = -0.12;
  const rightWing = addBox(ship, darkHullMaterial, 3.2, 0.16, 1.35, CENTER_X + halfWidth + 1.85, 0.32, CENTER_Z + 1.35);
  rightWing.rotation.z = 0.2;
  rightWing.rotation.y = 0.12;

  const leftWingTip = addBox(ship, hullMaterial, 0.28, 0.48, 1.65, CENTER_X - halfWidth - 3.28, 0.58, CENTER_Z + 1.55);
  leftWingTip.rotation.z = -0.2;
  const rightWingTip = addBox(ship, hullMaterial, 0.28, 0.48, 1.65, CENTER_X + halfWidth + 3.28, 0.58, CENTER_Z + 1.55);
  rightWingTip.rotation.z = 0.2;

  const tailFin = addBox(ship, darkHullMaterial, 0.24, 1.35, 1.25, CENTER_X, 1.28, CENTER_Z + halfDepth + 0.24);
  tailFin.rotation.x = -0.08;

  addBox(ship, panelMaterial, 2.25, 0.86, 0.56, CENTER_X, 0.48, CENTER_Z - 2.7);
  addBox(ship, panelMaterial, 1.2, 0.12, 0.44, CENTER_X - 0.72, 1.0, CENTER_Z - 2.86);
  addBox(ship, panelMaterial, 1.2, 0.12, 0.44, CENTER_X + 0.72, 1.0, CENTER_Z - 2.86);
  addCollider(colliders, CENTER_X, CENTER_Z - 2.7, 2.35, 0.75);

  const seatBase = addBox(ship, darkHullMaterial, 0.9, 0.36, 0.86, CENTER_X, 0.18, CENTER_Z + 0.92);
  const seatBack = addBox(ship, darkHullMaterial, 0.96, 1.1, 0.18, CENTER_X, 0.78, CENTER_Z + 1.38);
  seatBase.name = 'Pilot Seat Base';
  seatBack.name = 'Pilot Seat Back';

  const leftWindow = addBox(ship, glassMaterial, 0.08, 1.15, 2.35, CENTER_X - halfWidth - 0.18, 1.62, CENTER_Z - 0.82);
  leftWindow.rotation.y = 0.02;
  const rightWindow = addBox(ship, glassMaterial, 0.08, 1.15, 2.35, CENTER_X + halfWidth + 0.18, 1.62, CENTER_Z - 0.82);
  rightWindow.rotation.y = -0.02;

  const frontGlow = new PointLight(0x77c7ff, 1.35, 9.5, 2);
  frontGlow.position.set(CENTER_X, 1.45, CENTER_Z - 2.9);
  const cabinLight = new PointLight(0xd9efff, 1.05, 7.5, 2);
  cabinLight.position.set(CENTER_X, 2.25, CENTER_Z + 0.5);
  ship.add(frontGlow, cabinLight);

  const leftEngine = addEngine(
    ship,
    darkHullMaterial,
    flameMaterial,
    hotCoreMaterial,
    CENTER_X - 1.45,
    CENTER_Z + halfDepth + 0.5,
  );
  const rightEngine = addEngine(
    ship,
    darkHullMaterial,
    flameMaterial,
    hotCoreMaterial,
    CENTER_X + 1.45,
    CENTER_Z + halfDepth + 0.5,
  );

  const warningBeaconMaterial = new MeshBasicMaterial({ color: 0xff334a });
  const beacon = new Mesh(new SphereGeometry(0.12, 14, 10), warningBeaconMaterial);
  beacon.position.set(CENTER_X, ceilingY + 0.26, CENTER_Z + 0.4);
  ship.add(beacon);

  const landedShipExactAnchor = new Group();
  landedShipExactAnchor.name = 'Exact Landed Spaceship Anchor';
  landedShipExactAnchor.position.set(0, getLandingTerrainOffset(0, 5), 5);
  landedShipExactAnchor.rotation.y = 0.22;
  const landedShipExact = ship.clone(true);
  landedShipExact.name = 'Exact Landed Spaceship';
  landedShipExact.visible = true;
  landedShipExact.position.set(-CENTER_X, 0, -CENTER_Z);
  landedShipExact.traverse((object) => {
    object.frustumCulled = false;
    if (object instanceof PointLight) {
      object.intensity = 0;
      object.distance = 0;
    }
    if (object instanceof Mesh && (object.material === flameMaterial || object.material === hotCoreMaterial)) {
      object.visible = false;
    }
  });
  landedShipExactAnchor.add(landedShipExact);
  landingSurface.add(landedShipExactAnchor);

  const screenShip = new Group();
  screenShip.name = 'Screen Center Spaceship';
  screenShip.position.set(0, -0.24, -4.55);
  screenShip.rotation.set(0.02, 0, 0);
  screenShip.scale.setScalar(1.02);
  screenShip.visible = false;

  const screenHullMaterial = new MeshStandardMaterial({
    color: 0x8793a5,
    emissive: 0x111927,
    emissiveIntensity: 0.52,
    metalness: 0.72,
    roughness: 0.28,
  });
  const screenDarkMaterial = new MeshStandardMaterial({
    color: 0x202936,
    emissive: 0x070b12,
    emissiveIntensity: 0.45,
    metalness: 0.84,
    roughness: 0.34,
  });
  const screenGlassMaterial = new MeshStandardMaterial({
    color: 0x8bd6ff,
    emissive: 0x1b74a8,
    emissiveIntensity: 0.74,
    opacity: 0.7,
    roughness: 0.08,
    transparent: true,
  });
  const screenBody = new Mesh(new CylinderGeometry(0.58, 0.74, 3.7, 32), screenHullMaterial);
  screenBody.rotation.x = Math.PI / 2;
  screenBody.position.set(0, 0, 0.05);
  screenShip.add(screenBody);

  const screenNose = new Mesh(new ConeGeometry(0.64, 1.42, 28), screenHullMaterial);
  screenNose.rotation.x = -Math.PI / 2;
  screenNose.position.set(0, 0, -2.36);
  screenShip.add(screenNose);

  const screenCanopy = new Mesh(new SphereGeometry(0.5, 24, 14), screenGlassMaterial);
  screenCanopy.scale.set(1.05, 0.42, 1.42);
  screenCanopy.position.set(0, 0.47, -0.76);
  screenShip.add(screenCanopy);

  const screenLeftWing = addBox(screenShip, screenDarkMaterial, 1.9, 0.12, 0.76, -1.18, -0.2, 0.42);
  screenLeftWing.rotation.z = -0.22;
  screenLeftWing.rotation.y = -0.12;
  const screenRightWing = addBox(screenShip, screenDarkMaterial, 1.9, 0.12, 0.76, 1.18, -0.2, 0.42);
  screenRightWing.rotation.z = 0.22;
  screenRightWing.rotation.y = 0.12;

  const screenTailFin = addBox(screenShip, screenDarkMaterial, 0.14, 0.88, 0.68, 0, 0.58, 1.72);
  screenTailFin.rotation.x = -0.08;

  const screenLeftEngine = new Mesh(new CylinderGeometry(0.2, 0.25, 0.54, 18), screenDarkMaterial);
  screenLeftEngine.rotation.x = Math.PI / 2;
  screenLeftEngine.position.set(-0.42, -0.04, 2.02);
  const screenRightEngine = new Mesh(new CylinderGeometry(0.2, 0.25, 0.54, 18), screenDarkMaterial);
  screenRightEngine.rotation.x = Math.PI / 2;
  screenRightEngine.position.set(0.42, -0.04, 2.02);
  screenShip.add(screenLeftEngine, screenRightEngine);

  const screenLeftFlame = new Group();
  screenLeftFlame.position.set(-0.42, -0.04, 2.38);
  screenLeftFlame.rotation.x = Math.PI / 2;
  const screenRightFlame = new Group();
  screenRightFlame.position.set(0.42, -0.04, 2.38);
  screenRightFlame.rotation.x = Math.PI / 2;
  const screenLeftOuterFlame = new Mesh(new ConeGeometry(0.22, 0.82, 18), flameMaterial);
  screenLeftOuterFlame.position.y = 0.36;
  const screenLeftCoreFlame = new Mesh(new ConeGeometry(0.1, 0.52, 18), hotCoreMaterial);
  screenLeftCoreFlame.position.y = 0.28;
  const screenRightOuterFlame = new Mesh(new ConeGeometry(0.22, 0.82, 18), flameMaterial);
  screenRightOuterFlame.position.y = 0.36;
  const screenRightCoreFlame = new Mesh(new ConeGeometry(0.1, 0.52, 18), hotCoreMaterial);
  screenRightCoreFlame.position.y = 0.28;
  screenLeftFlame.add(screenLeftOuterFlame, screenLeftCoreFlame);
  screenRightFlame.add(screenRightOuterFlame, screenRightCoreFlame);
  screenShip.add(screenLeftFlame, screenRightFlame);

  const screenLight = new PointLight(0x9fd8ff, 1.1, 7, 2);
  screenLight.position.set(0, 0.62, -1.4);
  const screenEngineLight = new PointLight(0xff8b22, 1.25, 5.5, 2);
  screenEngineLight.position.set(0, -0.05, 2.62);
  screenShip.add(screenLight, screenEngineLight);

  const repairWrench = new Group();
  repairWrench.name = 'Chapter 5 Repair Wrench';
  repairWrench.position.set(0.42, -0.42, -0.64);
  repairWrench.rotation.set(-0.28, -0.26, 0.3);
  repairWrench.visible = false;
  const wrenchMetalMaterial = new MeshStandardMaterial({
    color: 0xb9c2cc,
    metalness: 0.82,
    roughness: 0.26,
  });
  const wrenchHandle = new Mesh(new CylinderGeometry(0.035, 0.045, 0.66, 10), wrenchMetalMaterial);
  wrenchHandle.rotation.z = -0.2;
  wrenchHandle.position.set(0, 0, 0);
  const wrenchHead = new Mesh(new TorusGeometry(0.13, 0.027, 8, 18), wrenchMetalMaterial);
  wrenchHead.scale.x = 0.72;
  wrenchHead.position.set(0.08, 0.34, 0);
  wrenchHead.rotation.z = -0.34;
  const wrenchJawCut = new Mesh(new BoxGeometry(0.12, 0.08, 0.08), new MeshBasicMaterial({ color: 0x1b2430 }));
  wrenchJawCut.position.set(0.15, 0.42, 0);
  repairWrench.add(wrenchHandle, wrenchHead, wrenchJawCut);

  const interior = new Group();
  interior.name = 'Chapter 5 Spaceship Interior';
  interior.visible = false;
  root.add(interior);

  const interiorWallMaterial = new MeshStandardMaterial({
    color: 0x1c2634,
    emissive: 0x050b12,
    emissiveIntensity: 0.18,
    metalness: 0.62,
    roughness: 0.42,
  });
  const interiorFloorMaterial = new MeshStandardMaterial({
    color: 0x252f3d,
    metalness: 0.48,
    roughness: 0.56,
  });
  const interiorTrimMaterial = new MeshStandardMaterial({
    color: 0x536273,
    emissive: 0x071423,
    emissiveIntensity: 0.14,
    metalness: 0.72,
    roughness: 0.32,
  });
  const interiorGlassMaterial = new MeshStandardMaterial({
    color: 0x82cfff,
    emissive: 0x063153,
    emissiveIntensity: 0.42,
    opacity: 0.28,
    roughness: 0.05,
    transparent: true,
  });
  const bedMaterial = new MeshStandardMaterial({
    color: 0x384b65,
    roughness: 0.68,
  });
  const fuelMaterial = new MeshStandardMaterial({
    color: 0x3f99d1,
    emissive: 0x0a3d60,
    emissiveIntensity: 0.45,
    metalness: 0.35,
    roughness: 0.22,
  });
  const ceilingLightMaterial = new MeshBasicMaterial({
    color: 0xe9fbff,
  });
  const warmLightMaterial = new MeshBasicMaterial({
    color: 0xffe2a1,
  });
  const plantPotMaterial = new MeshStandardMaterial({
    color: 0x7d5131,
    metalness: 0.04,
    roughness: 0.82,
  });
  const plantStemMaterial = new MeshStandardMaterial({
    color: 0x315b31,
    roughness: 0.78,
  });
  const plantLeafMaterials = [
    new MeshStandardMaterial({ color: 0x35b75f, roughness: 0.68 }),
    new MeshStandardMaterial({ color: 0x2fa6d7, roughness: 0.62 }),
    new MeshStandardMaterial({ color: 0xd65ab7, roughness: 0.66 }),
    new MeshStandardMaterial({ color: 0xe8b847, roughness: 0.62 }),
  ];
  const plantFlowerMaterials = [
    new MeshStandardMaterial({ color: 0xff5f6f, emissive: 0x3b080d, emissiveIntensity: 0.15, roughness: 0.52 }),
    new MeshStandardMaterial({ color: 0x7ee3ff, emissive: 0x06323b, emissiveIntensity: 0.22, roughness: 0.48 }),
    new MeshStandardMaterial({ color: 0xf6d94c, emissive: 0x332600, emissiveIntensity: 0.18, roughness: 0.5 }),
    new MeshStandardMaterial({ color: 0xb681ff, emissive: 0x1c063b, emissiveIntensity: 0.18, roughness: 0.5 }),
  ];

  addBox(interior, interiorFloorMaterial, 6.2, 0.16, 18.2, INTERIOR_X, -0.08, INTERIOR_Z);
  addBox(interior, interiorTrimMaterial, 6.2, 0.12, 18.2, INTERIOR_X, INTERIOR_WALL_HEIGHT + 0.04, INTERIOR_Z);
  addBox(interior, ceilingLightMaterial, 1.15, 0.035, 2.15, INTERIOR_X, INTERIOR_WALL_HEIGHT - 0.04, INTERIOR_Z - 6.3);
  addBox(interior, ceilingLightMaterial, 1.0, 0.035, 2.35, INTERIOR_X, INTERIOR_WALL_HEIGHT - 0.04, INTERIOR_Z - 1.4);
  addBox(interior, ceilingLightMaterial, 1.0, 0.035, 2.35, INTERIOR_X, INTERIOR_WALL_HEIGHT - 0.04, INTERIOR_Z + 3.8);
  addBox(interior, warmLightMaterial, 0.72, 0.035, 1.1, INTERIOR_X - 2.05, INTERIOR_WALL_HEIGHT - 0.04, INTERIOR_Z + 1.35);
  addBox(interior, warmLightMaterial, 0.72, 0.035, 1.1, INTERIOR_X + 2.05, INTERIOR_WALL_HEIGHT - 0.04, INTERIOR_Z + 1.35);

  addCollider(colliders, INTERIOR_X - 3.1, INTERIOR_Z, INTERIOR_WALL_THICKNESS, 18.2);
  addCollider(colliders, INTERIOR_X + 3.1, INTERIOR_Z, INTERIOR_WALL_THICKNESS, 18.2);
  addCollider(colliders, INTERIOR_X, INTERIOR_Z - 9.1, 6.2, INTERIOR_WALL_THICKNESS);
  const sideWallSegments = [
    { z: INTERIOR_Z - 7.48, depth: 3.25 },
    { z: INTERIOR_Z - 0.34, depth: 6.08 },
    { z: INTERIOR_Z + 7.0, depth: 4.2 },
  ];
  sideWallSegments.forEach((segment) => {
    addBox(interior, interiorWallMaterial, INTERIOR_WALL_THICKNESS, INTERIOR_WALL_HEIGHT, segment.depth, INTERIOR_X - 3.1, INTERIOR_WALL_HEIGHT / 2, segment.z);
    addBox(interior, interiorWallMaterial, INTERIOR_WALL_THICKNESS, INTERIOR_WALL_HEIGHT, segment.depth, INTERIOR_X + 3.1, INTERIOR_WALL_HEIGHT / 2, segment.z);
  });
  const sideWindows = [
    { z: INTERIOR_Z - 4.6, depth: 2.45 },
    { z: INTERIOR_Z + 3.8, depth: 2.2 },
  ];
  sideWindows.forEach((window) => {
    addBox(interior, interiorTrimMaterial, INTERIOR_WALL_THICKNESS + 0.04, 0.46, window.depth, INTERIOR_X - 3.1, 0.25, window.z);
    addBox(interior, interiorTrimMaterial, INTERIOR_WALL_THICKNESS + 0.04, 0.46, window.depth, INTERIOR_X + 3.1, 0.25, window.z);
    addBox(interior, interiorTrimMaterial, INTERIOR_WALL_THICKNESS + 0.04, 0.5, window.depth, INTERIOR_X - 3.1, 2.8, window.z);
    addBox(interior, interiorTrimMaterial, INTERIOR_WALL_THICKNESS + 0.04, 0.5, window.depth, INTERIOR_X + 3.1, 2.8, window.z);
  });
  addBox(interior, interiorWallMaterial, 1.55, INTERIOR_WALL_HEIGHT, INTERIOR_WALL_THICKNESS, INTERIOR_X - 2.33, INTERIOR_WALL_HEIGHT / 2, INTERIOR_Z - 9.1);
  addBox(interior, interiorWallMaterial, 1.55, INTERIOR_WALL_HEIGHT, INTERIOR_WALL_THICKNESS, INTERIOR_X + 2.33, INTERIOR_WALL_HEIGHT / 2, INTERIOR_Z - 9.1);
  addBox(interior, interiorTrimMaterial, 3.1, 0.5, INTERIOR_WALL_THICKNESS + 0.04, INTERIOR_X, 0.25, INTERIOR_Z - 9.1);
  addBox(interior, interiorTrimMaterial, 3.1, 0.52, INTERIOR_WALL_THICKNESS + 0.04, INTERIOR_X, 2.79, INTERIOR_Z - 9.1);
  addWall(interior, colliders, interiorWallMaterial, INTERIOR_X, INTERIOR_Z + 9.1, 6.2, INTERIOR_WALL_THICKNESS);

  addBox(interior, interiorGlassMaterial, 0.08, 1.12, 2.45, INTERIOR_X - 3.23, 1.78, INTERIOR_Z - 4.6);
  addBox(interior, interiorGlassMaterial, 0.08, 1.12, 2.45, INTERIOR_X + 3.23, 1.78, INTERIOR_Z - 4.6);
  addBox(interior, interiorGlassMaterial, 0.08, 1.02, 2.2, INTERIOR_X - 3.23, 1.74, INTERIOR_Z + 3.8);
  addBox(interior, interiorGlassMaterial, 0.08, 1.02, 2.2, INTERIOR_X + 3.23, 1.74, INTERIOR_Z + 3.8);
  addBox(interior, interiorGlassMaterial, 3.1, 1.16, 0.08, INTERIOR_X, 1.84, INTERIOR_Z - 9.23);

  addWall(interior, colliders, interiorWallMaterial, INTERIOR_X - 1.95, INTERIOR_Z - 2.45, INTERIOR_WALL_THICKNESS, 2.9);
  addWall(interior, colliders, interiorWallMaterial, INTERIOR_X + 1.95, INTERIOR_Z - 2.45, INTERIOR_WALL_THICKNESS, 2.9);
  addWall(interior, colliders, interiorWallMaterial, INTERIOR_X - 1.45, INTERIOR_Z - 3.9, 1.0, INTERIOR_WALL_THICKNESS);
  addWall(interior, colliders, interiorWallMaterial, INTERIOR_X + 1.45, INTERIOR_Z - 3.9, 1.0, INTERIOR_WALL_THICKNESS);

  addBox(interior, interiorTrimMaterial, 5.4, 0.18, 0.16, INTERIOR_X, 0.72, INTERIOR_Z - 8.82);
  addBox(interior, interiorTrimMaterial, 5.4, 0.18, 0.16, INTERIOR_X, 2.62, INTERIOR_Z - 8.82);
  [-2.2, -1.1, 0, 1.1, 2.2].forEach((offsetX) => {
    addBox(interior, interiorTrimMaterial, 0.12, 1.95, 0.16, INTERIOR_X + offsetX, 1.68, INTERIOR_Z - 8.86);
  });
  [
    { x: -1.84, y: 1.58, z: -8.72, rot: 0.34, width: 1.14, height: 1.32 },
    { x: -0.62, y: 1.72, z: -8.98, rot: 0.12, width: 1.16, height: 1.46 },
    { x: 0.62, y: 1.72, z: -8.98, rot: -0.12, width: 1.16, height: 1.46 },
    { x: 1.84, y: 1.58, z: -8.72, rot: -0.34, width: 1.14, height: 1.32 },
  ].forEach((pane) => {
    const glass = addBox(
      interior,
      interiorGlassMaterial,
      pane.width,
      pane.height,
      0.06,
      INTERIOR_X + pane.x,
      pane.y,
      INTERIOR_Z + pane.z,
    );
    glass.rotation.y = pane.rot;
  });
  [
    { x: -2.46, rot: 0.44 },
    { x: -1.22, rot: 0.2 },
    { x: 0, rot: 0 },
    { x: 1.22, rot: -0.2 },
    { x: 2.46, rot: -0.44 },
  ].forEach((rib) => {
    const upperRib = addBox(interior, interiorTrimMaterial, 0.12, 1.4, 0.12, INTERIOR_X + rib.x, 2.08, INTERIOR_Z - 8.93);
    upperRib.rotation.y = rib.rot;
    upperRib.rotation.x = -0.22;
  });

  addWall(interior, colliders, interiorWallMaterial, INTERIOR_X - 1.25, INTERIOR_Z - 0.5, INTERIOR_WALL_THICKNESS, 1.05);
  addWall(interior, colliders, interiorWallMaterial, INTERIOR_X - 1.25, INTERIOR_Z + 2.78, INTERIOR_WALL_THICKNESS, 0.65);
  addWall(interior, colliders, interiorWallMaterial, INTERIOR_X + 1.25, INTERIOR_Z - 0.5, INTERIOR_WALL_THICKNESS, 1.05);
  addWall(interior, colliders, interiorWallMaterial, INTERIOR_X + 1.25, INTERIOR_Z + 2.78, INTERIOR_WALL_THICKNESS, 0.65);
  addWall(interior, colliders, interiorWallMaterial, INTERIOR_X - 2.18, INTERIOR_Z + 3.1, 1.85, INTERIOR_WALL_THICKNESS);
  addWall(interior, colliders, interiorWallMaterial, INTERIOR_X + 2.18, INTERIOR_Z + 3.1, 1.85, INTERIOR_WALL_THICKNESS);

  addBox(interior, panelMaterial, 4.8, 0.75, 0.52, INTERIOR_X, 0.42, INTERIOR_Z - 7.95);
  addBox(interior, panelMaterial, 1.4, 0.1, 0.36, INTERIOR_X - 1.3, 0.9, INTERIOR_Z - 8.15);
  addBox(interior, panelMaterial, 1.4, 0.1, 0.36, INTERIOR_X + 1.3, 0.9, INTERIOR_Z - 8.15);
  addBox(interior, interiorTrimMaterial, 0.62, 0.9, 0.62, INTERIOR_X - 1.18, 0.45, INTERIOR_Z - 6.5);
  addBox(interior, interiorTrimMaterial, 0.62, 0.9, 0.62, INTERIOR_X + 1.18, 0.45, INTERIOR_Z - 6.5);

  const cockpitMonitorBase = addBox(interior, interiorTrimMaterial, 1.18, 0.1, 0.38, INTERIOR_X - 1.42, 0.88, INTERIOR_Z - 8.36);
  cockpitMonitorBase.rotation.x = -0.12;
  const cockpitMonitorScreen = addBox(interior, monitorScreenMaterial, 1.08, 0.62, 0.08, INTERIOR_X - 1.42, 1.22, INTERIOR_Z - 8.56);
  cockpitMonitorScreen.rotation.x = -0.22;
  addBox(interior, panelMaterial, 0.12, 0.74, 0.08, INTERIOR_X - 2.02, 1.18, INTERIOR_Z - 8.53);
  addBox(interior, panelMaterial, 0.12, 0.74, 0.08, INTERIOR_X - 0.82, 1.18, INTERIOR_Z - 8.53);
  addBox(interior, panelMaterial, 1.2, 0.08, 0.08, INTERIOR_X - 1.42, 1.57, INTERIOR_Z - 8.53);

  addBox(interior, interiorTrimMaterial, 1.62, 0.12, 0.52, INTERIOR_X + 1.42, 0.92, INTERIOR_Z - 8.2);
  [-0.24, 0, 0.24].forEach((offset, index) => {
    const wire = new Mesh(new CylinderGeometry(0.025, 0.025, 0.9, 8), wireMaterial);
    wire.position.set(INTERIOR_X + 1.45 + offset, 1.07, INTERIOR_Z - 7.82 + index * 0.05);
    wire.rotation.x = Math.PI / 2;
    wire.rotation.z = 0.25 - index * 0.22;
    interior.add(wire);
  });
  addBox(interior, monitorScreenMaterial, 0.84, 0.05, 0.18, INTERIOR_X + 1.42, 1.12, INTERIOR_Z - 7.92);

  const radarRoot = new Group();
  radarRoot.position.set(INTERIOR_X + 1.42, 1.17, INTERIOR_Z - 8.05);
  interior.add(radarRoot);
  const radarDish = new Mesh(new CylinderGeometry(0.42, 0.42, 0.045, 36), radarScreenMaterial);
  radarDish.position.y = 0.01;
  radarRoot.add(radarDish);
  const radarRing = new Mesh(new CylinderGeometry(0.44, 0.44, 0.025, 36, 1, true), radarSweepMaterial);
  radarRing.position.y = 0.05;
  radarRoot.add(radarRing);
  const radarSweep = new Group();
  radarSweep.position.y = 0.08;
  radarRoot.add(radarSweep);
  const radarBeam = new Mesh(new BoxGeometry(0.035, 0.018, 0.38), radarSweepMaterial);
  radarBeam.position.z = -0.18;
  radarSweep.add(radarBeam);
  const radarBlip = new Mesh(new SphereGeometry(0.045, 10, 8), radarBlipMaterial);
  radarBlip.position.y = 0.12;
  radarBlip.visible = false;
  radarRoot.add(radarBlip);

  addBox(interior, bedMaterial, 1.65, 0.42, 2.2, INTERIOR_X - 2.12, 0.21, INTERIOR_Z + 1.28);
  addBox(interior, interiorTrimMaterial, 1.65, 0.48, 0.24, INTERIOR_X - 2.12, 0.62, INTERIOR_Z + 0.25);
  addBox(interior, bedMaterial, 0.96, 0.16, 0.52, INTERIOR_X - 2.12, 0.54, INTERIOR_Z + 0.72);
  addBox(interior, interiorTrimMaterial, 0.92, 1.0, 0.38, INTERIOR_X - 2.52, 0.5, INTERIOR_Z + 2.58);

  for (let index = 0; index < 3; index += 1) {
    const tank = new Mesh(new CylinderGeometry(0.32, 0.32, 1.75, 18), fuelMaterial);
    tank.position.set(INTERIOR_X + 2.1, 0.88, INTERIOR_Z + 0.18 + index * 1.02);
    interior.add(tank);
    addBox(interior, interiorTrimMaterial, 0.86, 0.12, 0.16, INTERIOR_X + 2.1, 1.78, INTERIOR_Z + 0.18 + index * 1.02);
  }
  addBox(interior, panelMaterial, 1.2, 0.9, 0.35, INTERIOR_X + 2.35, 0.45, INTERIOR_Z + 2.9);

  addBox(interior, interiorTrimMaterial, 4.7, 0.26, 0.72, INTERIOR_X, 1.0, INTERIOR_Z + 6.2);
  addBox(interior, interiorTrimMaterial, 0.72, 1.14, 0.62, INTERIOR_X - 2.15, 0.57, INTERIOR_Z + 7.25);
  addBox(interior, interiorTrimMaterial, 0.72, 1.14, 0.62, INTERIOR_X + 2.15, 0.57, INTERIOR_Z + 7.25);

  [
    { x: INTERIOR_X - 2.58, z: INTERIOR_Z - 7.28, leaf: 0, flower: 2, scale: 0.92 },
    { x: INTERIOR_X + 2.58, z: INTERIOR_Z - 7.28, leaf: 1, flower: 0, scale: 0.88 },
    { x: INTERIOR_X - 2.62, z: INTERIOR_Z - 3.18, leaf: 2, flower: 3, scale: 0.78 },
    { x: INTERIOR_X + 2.62, z: INTERIOR_Z - 3.18, leaf: 3, flower: 1, scale: 0.78 },
    { x: INTERIOR_X - 2.66, z: INTERIOR_Z + 5.32, leaf: 1, flower: 2, scale: 0.86 },
    { x: INTERIOR_X + 2.66, z: INTERIOR_Z + 5.32, leaf: 0, flower: 3, scale: 0.86 },
  ].forEach((plant) => {
    addInteriorPlant(
      interior,
      plantPotMaterial,
      plantStemMaterial,
      plantLeafMaterials[plant.leaf],
      plantFlowerMaterials[plant.flower],
      plant.x,
      plant.z,
      plant.scale,
    );
  });

  const cockpitLight = new PointLight(0xdff6ff, 3.7, 12.5, 1.35);
  cockpitLight.position.set(INTERIOR_X, 2.55, INTERIOR_Z - 6.1);
  const corridorLight = new PointLight(0xf2fbff, 3.1, 12, 1.45);
  corridorLight.position.set(INTERIOR_X, 2.55, INTERIOR_Z - 0.8);
  const rearLight = new PointLight(0xffe7b0, 2.7, 10.5, 1.55);
  rearLight.position.set(INTERIOR_X, 2.4, INTERIOR_Z + 5.3);
  const bedLight = new PointLight(0xffd39a, 1.6, 5.5, 1.7);
  bedLight.position.set(INTERIOR_X - 2.1, 1.75, INTERIOR_Z + 1.0);
  const fuelLight = new PointLight(0x4dbdff, 1.85, 6.8, 1.65);
  fuelLight.position.set(INTERIOR_X + 2.1, 1.9, INTERIOR_Z + 1.2);
  const alarmLeft = new PointLight(0xff1111, 0, 8, 2);
  alarmLeft.position.set(INTERIOR_X - 2.22, 2.62, INTERIOR_Z - 5.9);
  const alarmRight = new PointLight(0xff1111, 0, 8, 2);
  alarmRight.position.set(INTERIOR_X + 2.22, 2.62, INTERIOR_Z - 5.9);
  addBox(interior, alarmLightMaterial, 0.32, 0.08, 0.32, INTERIOR_X - 2.22, 2.98, INTERIOR_Z - 5.9);
  addBox(interior, alarmLightMaterial, 0.32, 0.08, 0.32, INTERIOR_X + 2.22, 2.98, INTERIOR_Z - 5.9);
  interior.add(cockpitLight, corridorLight, rearLight, bedLight, fuelLight, alarmLeft, alarmRight);

  const rearDesk = addBox(interior, interiorTrimMaterial, 2.65, 0.18, 0.82, INTERIOR_X, 0.72, INTERIOR_Z + 7.72);
  addBox(interior, interiorTrimMaterial, 0.16, 0.72, 0.16, INTERIOR_X - 1.1, 0.36, INTERIOR_Z + 7.42);
  addBox(interior, interiorTrimMaterial, 0.16, 0.72, 0.16, INTERIOR_X + 1.1, 0.36, INTERIOR_Z + 7.42);
  addBox(interior, interiorTrimMaterial, 0.16, 0.72, 0.16, INTERIOR_X - 1.1, 0.36, INTERIOR_Z + 8.02);
  addBox(interior, interiorTrimMaterial, 0.16, 0.72, 0.16, INTERIOR_X + 1.1, 0.36, INTERIOR_Z + 8.02);
  rearDesk.name = 'Rear Durability Desk';
  addCollider(colliders, INTERIOR_X, INTERIOR_Z + 7.72, 2.75, 0.92);

  const durabilityLabel = createTextPanel('DURABILITY', 1.8, 0.46, 'rgba(3, 12, 18, 0.92)', '#cfffff');
  durabilityLabel.position.set(INTERIOR_X, 2.42, INTERIOR_Z + 8.96);
  durabilityLabel.rotation.y = Math.PI;
  interior.add(durabilityLabel);
  addBox(interior, interiorTrimMaterial, 1.96, 0.23, 0.04, INTERIOR_X, 2.05, INTERIOR_Z + 8.94);
  const durabilityFillMaterial = new MeshBasicMaterial({ color: 0x38ff88 });
  const durabilityFillWidth = 1.74;
  const durabilityFill = addBox(interior, durabilityFillMaterial, durabilityFillWidth, 0.12, 0.055, INTERIOR_X, 2.05, INTERIOR_Z + 8.9);

  const toolboxMaterial = new MeshStandardMaterial({
    color: 0xb91f24,
    metalness: 0.18,
    roughness: 0.48,
  });
  const toolboxDarkMaterial = new MeshStandardMaterial({
    color: 0x1b2028,
    metalness: 0.42,
    roughness: 0.34,
  });
  addBox(interior, toolboxMaterial, 0.72, 0.28, 0.38, INTERIOR_X - 0.72, 0.96, INTERIOR_Z + 7.62);
  addBox(interior, toolboxDarkMaterial, 0.78, 0.06, 0.42, INTERIOR_X - 0.72, 1.12, INTERIOR_Z + 7.62);
  const toolboxHandle = new Mesh(new TorusGeometry(0.18, 0.025, 8, 20), toolboxDarkMaterial);
  toolboxHandle.scale.z = 0.32;
  toolboxHandle.position.set(INTERIOR_X - 0.72, 1.18, INTERIOR_Z + 7.62);
  toolboxHandle.rotation.x = Math.PI / 2;
  interior.add(toolboxHandle);

  const exteriorDamageMaterial = new MeshBasicMaterial({
    color: 0x0d1116,
    opacity: 0,
    transparent: true,
  });
  const exteriorDamage = new Mesh(new SphereGeometry(0.42, 18, 10), exteriorDamageMaterial);
  exteriorDamage.scale.set(1.45, 0.18, 0.72);
  exteriorDamage.position.set(CENTER_X + 0.78, 0.98, CENTER_Z - 1.48);
  exteriorDamage.rotation.set(0.12, -0.2, 0.35);
  exteriorDamage.visible = false;
  ship.add(exteriorDamage);

  const interiorDamageMaterial = new MeshBasicMaterial({
    color: 0x15191e,
    opacity: 0,
    transparent: true,
  });
  const interiorDamage = new Mesh(new PlaneGeometry(0.74, 0.44), interiorDamageMaterial);
  interiorDamage.position.set(INTERIOR_X + 3.0, 1.45, INTERIOR_Z - 3.85);
  interiorDamage.rotation.y = -Math.PI / 2;
  interiorDamage.visible = false;
  interior.add(interiorDamage);

  const spawn = new Vector3(CENTER_X, CAMERA_HEIGHT, CENTER_Z + CAMERA_DISTANCE);
  const lookTarget = new Vector3(CENTER_X, 1.2, CENTER_Z - CAMERA_LOOK_AHEAD);
  const interiorSpawn = new Vector3(INTERIOR_X, 1.72, INTERIOR_Z + 5.6);
  const interiorLookTarget = new Vector3(INTERIOR_X, 1.45, INTERIOR_Z - 7.8);
  const surfaceSpawnLocalX = -6.2;
  const surfaceSpawnLocalZ = 15.4;
  const surfaceSpawn = new Vector3(
    LANDING_X + surfaceSpawnLocalX,
    CAMERA_HEIGHT + getLandingTerrainOffset(surfaceSpawnLocalX, surfaceSpawnLocalZ),
    LANDING_Z + surfaceSpawnLocalZ,
  );
  const surfaceLookTarget = new Vector3(LANDING_X, 1.05, LANDING_Z + 4.8);
  const cockpitControls: Array<ChapterFiveCockpitControl & { position: Vector3 }> = [
    {
      id: 'monitor',
      label: 'cockpit monitor',
      prompt: 'Press E to use the cockpit monitor.',
      position: new Vector3(INTERIOR_X - 1.42, 1.18, INTERIOR_Z - 8.12),
    },
    {
      id: 'toolbox',
      label: 'repair toolbox',
      prompt: 'Press E to take or put away the repair wrench.',
      position: new Vector3(INTERIOR_X - 0.72, 1.0, INTERIOR_Z + 7.62),
    },
    {
      id: 'damage',
      label: 'damaged hull panel',
      prompt: 'Hold E with the wrench to repair the damaged hull.',
      position: new Vector3(INTERIOR_X + 2.92, 1.45, INTERIOR_Z - 3.85),
    },
  ];
  const planetLabels = [
    ...planetDefinitions.map((definition) => definition.label),
    ...junkDefinitions.map((definition) => definition.label),
  ];
  const basePlanetMiles = [
    ...planetDefinitions.map((definition) => definition.miles),
    ...junkDefinitions.map((definition) => definition.miles),
  ];
  const planetBaseRadii = [
    ...planetDefinitions.map((definition) => definition.radius),
    ...junkDefinitions.map((definition) => definition.radius),
  ];
  const destinationSurfaceColors = [
    ...planetDefinitions.map((definition) => definition.body),
    ...junkDefinitions.map(() => 0x575a5e),
  ];
  const planetMiles = [...basePlanetMiles];
  const flames = [leftEngine.flame, rightEngine.flame];
  const engineLights = [leftEngine.light, rightEngine.light];
  const screenFlames = [screenLeftFlame, screenRightFlame];
  const screenLights = [screenEngineLight];
  const worldUp = new Vector3(0, 1, 0);
  const flightForward = new Vector3(0, 0, -1);
  const shipCenter = new Vector3(CENTER_X, 1.05, CENTER_Z);
  const cameraCenter = new Vector3();
  const destinationPosition = new Vector3();
  const destinationDirection = new Vector3();
  const planetDirection = new Vector3();
  const autopilotAvoidance = new Vector3();
  const avoidanceProbeDirection = new Vector3();
  const avoidanceSide = new Vector3();
  const avoidanceFallbackAxis = new Vector3(1, 0, 0);
  const orbitRight = new Vector3();
  const orbitUp = new Vector3();
  const repairPanelPosition = new Vector3(INTERIOR_X + 2.92, 1.45, INTERIOR_Z - 3.85);
  let throttle = 0;
  let elapsed = 0;
  let pitch = 0;
  let targetPitch = 0;
  let yaw = 0;
  let targetYaw = 0;
  let roll = 0;
  let screenPitch = 0;
  let screenYaw = 0;
  let screenRoll = 0;
  let screenSlide = 0;
  let flightSpeed = 5.8;
  let diveVisual = 0;
  let interiorMode = false;
  let surfaceMode = false;
  let monitorActive = false;
  let lightSpeed = 1;
  let engineOn = true;
  let navigationMode: ChapterFiveNavigationMode = 'cruise';
  let orbiting = false;
  let landingSequence = false;
  let landed = false;
  let radarActive = true;
  let destinationActive = false;
  let destinationSelectionActive = false;
  let destinationIndex = 0;
  let arrivalAlarmTimer = 0;
  let hullDurability = 1;
  let hullDamageAmount = 0;
  let collisionCooldown = 0;
  let repairToolHeld = false;
  let lastDestinationClickIndex = -1;
  let lastDestinationClickTime = -10;

  const applyThrusterState = (amount: number): void => {
    flames.forEach((flame, index) => {
      const flicker = 0.08 + Math.sin(elapsed * (15 + index * 3.7)) * 0.05;
      const flameWidth = 0.78 + amount * 0.42 + flicker;
      const flameLength = 0.58 + amount * 2.1 + flicker * 1.7;
      flame.scale.set(flameWidth, flameLength, flameWidth);
      flame.visible = amount > 0.035;
    });
    screenFlames.forEach((flame, index) => {
      const flicker = 0.06 + Math.sin(elapsed * (17 + index * 4.1)) * 0.04;
      flame.scale.set(
        0.78 + amount * 0.32 + flicker,
        0.7 + amount * 1.75 + flicker * 1.4,
        0.78 + amount * 0.32 + flicker,
      );
      flame.visible = amount > 0.035;
    });
    engineLights.forEach((light, index) => {
      light.intensity = amount > 0.035
        ? 0.8 + amount * 4.2 + Math.sin(elapsed * (19 + index)) * 0.16
        : 0;
      light.distance = amount > 0.035 ? 6.2 + amount * 8.5 : 0;
    });
    screenLights.forEach((light) => {
      light.intensity = amount > 0.035 ? 0.85 + amount * 3.4 : 0;
      light.distance = amount > 0.035 ? 4.4 + amount * 5.2 : 0;
    });
  };

  const updateHullVisuals = (): void => {
    const barRatio = MathUtils.clamp(hullDurability, 0, 1);
    durabilityFill.scale.x = Math.max(0.02, barRatio);
    durabilityFill.position.x = INTERIOR_X - (durabilityFillWidth * (1 - barRatio)) / 2;
    durabilityFillMaterial.color.setHex(barRatio > 0.5 ? 0x38ff88 : barRatio > 0.18 ? 0xffa12f : 0xff3030);

    const damageVisible = hullDamageAmount > 0.015;
    exteriorDamage.visible = damageVisible;
    interiorDamage.visible = damageVisible;
    exteriorDamageMaterial.opacity = damageVisible ? MathUtils.clamp(0.18 + hullDamageAmount * 0.62, 0.18, 0.82) : 0;
    interiorDamageMaterial.opacity = damageVisible ? MathUtils.clamp(0.22 + hullDamageAmount * 0.68, 0.22, 0.9) : 0;
    exteriorDamage.scale.set(1.25 + hullDamageAmount * 0.75, 0.13 + hullDamageAmount * 0.12, 0.58 + hullDamageAmount * 0.42);
    interiorDamage.scale.set(1 + hullDamageAmount * 0.55, 1 + hullDamageAmount * 0.36, 1);
    repairWrench.visible = interiorMode && repairToolHeld && !monitorActive;
  };

  const damageHull = (amount: number): void => {
    hullDurability = MathUtils.clamp(hullDurability - amount, 0, 1);
    hullDamageAmount = MathUtils.clamp(Math.max(hullDamageAmount, amount * 3.2) + amount * 0.55, 0, 1);
    updateHullVisuals();
  };

  const repairHull = (amount: number): boolean => {
    if (hullDamageAmount <= 0.001 && hullDurability >= 0.999) {
      return false;
    }

    hullDamageAmount = Math.max(0, hullDamageAmount - amount * 1.45);
    hullDurability = MathUtils.clamp(hullDurability + amount, 0, 1);
    updateHullVisuals();
    return true;
  };

  applyThrusterState(0.08);
  updateHullVisuals();

  return {
    root,
    screenShip,
    repairWrench,
    colliders,
    spawn,
    lookTarget,
    interiorSpawn,
    interiorLookTarget,
    surfaceSpawn,
    surfaceLookTarget,
    isInteriorMode() {
      return interiorMode;
    },
    setInteriorMode(active) {
      interiorMode = active;
      if (active) {
        surfaceMode = false;
      }
      interior.visible = active;
      screenShip.visible = !active && !surfaceMode;
      if (!active) {
        monitorActive = false;
      }
    },
    isSurfaceMode() {
      return surfaceMode;
    },
    setSurfaceMode(active) {
      surfaceMode = active;
      if (active) {
        interiorMode = false;
        interior.visible = false;
        monitorActive = false;
        screenShip.visible = false;
      } else {
        screenShip.visible = !interiorMode;
      }
    },
    getSupportedFloorY(position) {
      if (!surfaceMode) {
        return null;
      }

      const localX = position.x - LANDING_X;
      const localZ = position.z - LANDING_Z;
      if (Math.hypot(localX, localZ) > LANDING_SURFACE_RADIUS - 2) {
        return CAMERA_HEIGHT - 0.45;
      }

      return CAMERA_HEIGHT + getLandingTerrainOffset(localX, localZ);
    },
    getCompassHeadingDegrees() {
      return MathUtils.euclideanModulo(-MathUtils.radToDeg(yaw), 360);
    },
    getFlightLookTarget(origin, target = new Vector3()) {
      const pitchSin = Math.sin(pitch);
      const pitchCos = Math.cos(pitch);
      flightForward.set(
        -Math.sin(yaw) * pitchCos,
        pitchSin,
        -Math.cos(yaw) * pitchCos,
      ).normalize();
      return target.copy(origin).addScaledVector(flightForward, 10);
    },
    getNearestCockpitControl(position) {
      if (!interiorMode) {
        return null;
      }

      let nearest: (ChapterFiveCockpitControl & { position: Vector3 }) | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const control of cockpitControls) {
        if (control.id === 'damage' && hullDamageAmount <= 0.015) {
          continue;
        }
        const dx = position.x - control.position.x;
        const dz = position.z - control.position.z;
        const distance = Math.hypot(dx, dz);
        const range = control.id === 'damage' ? REPAIR_INTERACTION_RANGE : COCKPIT_INTERACTION_RANGE;
        if (distance <= range && distance < nearestDistance) {
          nearest = control;
          nearestDistance = distance;
        }
      }

      return nearest ? { id: nearest.id, label: nearest.label, prompt: nearest.prompt } : null;
    },
    interactCockpitControl(position) {
      const control = this.getNearestCockpitControl(position);
      if (!control) {
        return null;
      }

      if (control.id === 'monitor') {
        monitorActive = !monitorActive;
        return monitorActive
          ? 'Cockpit computer online. Click a planet or junk row to save or cancel it, then use Autopilot, Engines, Radar, and Landing Sequence when in orbit.'
          : 'Cockpit monitor off.';
      }

      if (control.id === 'toolbox') {
        repairToolHeld = !repairToolHeld;
        updateHullVisuals();
        return repairToolHeld
          ? 'You take the repair wrench from the toolbox. Hold E on a damaged hull spot to fix it.'
          : 'You put the repair wrench back in the toolbox.';
      }

      if (control.id === 'damage') {
        if (!repairToolHeld) {
          return 'The hull is dented. Take the repair wrench from the toolbox first.';
        }

        return repairHull(0.08)
          ? 'You tighten the damaged hull panel with the wrench.'
          : 'The hull panel is already repaired.';
      }

      return null;
    },
    setLightSpeed(value) {
      lightSpeed = MathUtils.clamp(Math.round(value), 1, 10);
      monitorActive = true;
      return `Light speed set to ${lightSpeed}.`;
    },
    setMonitorActive(active) {
      monitorActive = active;
    },
    applyMonitorAction(action) {
      monitorActive = true;
      if (action.type === 'select-planet') {
        const selectedIndex = MathUtils.clamp(Math.round(action.index), 0, planetLabels.length - 1);
        if (selectedIndex === lastDestinationClickIndex && elapsed - lastDestinationClickTime < 0.35) {
          return destinationActive
            ? `Destination saved: ${planetLabels[destinationIndex]}.`
            : 'Destination selection ignored to prevent a double-click cancel.';
        }
        lastDestinationClickIndex = selectedIndex;
        lastDestinationClickTime = elapsed;

        if (destinationActive && selectedIndex === destinationIndex) {
          destinationActive = false;
          destinationSelectionActive = false;
          navigationMode = 'cruise';
          orbiting = false;
          landingSequence = false;
          landed = false;
          surfaceMode = false;
          return `Destination canceled: ${planetLabels[selectedIndex]}. Autopilot is off.`;
        }

        destinationIndex = selectedIndex;
        destinationActive = true;
        destinationSelectionActive = false;
        orbiting = false;
        landingSequence = false;
        landed = false;
        surfaceMode = false;
        return `Destination saved: ${planetLabels[destinationIndex]}. Autopilot can now be turned on or off.`;
      }

      if (action.type === 'set-light-speed') {
        lightSpeed = MathUtils.clamp(Math.round(action.value), 1, 10);
        return `Light speed set to ${lightSpeed}.`;
      }

      if (action.type === 'set-mode') {
        if (action.mode === 'autopilot' && !destinationActive) {
          navigationMode = 'cruise';
          return 'Mark a destination on the computer before turning autopilot on.';
        }
        navigationMode = action.mode;
        engineOn = true;
        destinationSelectionActive = false;
        landingSequence = false;
        landed = false;
        surfaceMode = false;
        return action.mode === 'autopilot'
          ? `Autopilot engaged for ${planetLabels[destinationIndex]}.`
          : `Cruise mode engaged. Keep the ship aimed toward ${planetLabels[destinationIndex]}.`;
      }

      if (action.type === 'toggle-autopilot') {
        destinationSelectionActive = false;
        if (navigationMode === 'autopilot') {
          navigationMode = 'cruise';
          return 'Autopilot off. The marked destination stays on screen while you fly manually.';
        }

        if (!destinationActive) {
          navigationMode = 'cruise';
          return 'Mark a destination on the computer before turning autopilot on.';
        }

        navigationMode = 'autopilot';
        engineOn = true;
        landed = false;
        surfaceMode = false;
        return `Autopilot on. Flying toward ${planetLabels[destinationIndex]}.`;
      }

      if (action.type === 'set-coordinates') {
        if (destinationActive) {
          destinationActive = false;
          destinationSelectionActive = false;
          navigationMode = 'cruise';
          orbiting = false;
          landingSequence = false;
          landed = false;
          surfaceMode = false;
          return 'Destination canceled. Autopilot is off because nothing is marked.';
        }

        if (destinationSelectionActive) {
          destinationSelectionActive = false;
          navigationMode = 'cruise';
          return 'Destination picker closed.';
        }

        destinationSelectionActive = true;
        landingSequence = false;
        return 'Destination picker open. Click a planet or junk field to save it.';
      }

      if (action.type === 'toggle-engine') {
        engineOn = !engineOn;
        return engineOn
          ? 'Engines on. Rear thrusters are firing again.'
          : 'Engines off. The ship will slowly drift to a stop and the rear fire cuts out.';
      }

      if (action.type === 'toggle-radar') {
        radarActive = !radarActive;
        return radarActive
          ? 'Radar online. The sweep will show nearby planets.'
          : 'Radar offline.';
      }

      if (action.type === 'landing-sequence') {
        if (!orbiting || !destinationActive) {
          return 'Landing sequence unavailable until orbit is established.';
        }
        landingSequence = true;
        navigationMode = 'autopilot';
        engineOn = true;
        landed = false;
        surfaceMode = false;
        return `Landing sequence started for ${planetLabels[destinationIndex]}.`;
      }

      if (action.type === 'escape-orbit') {
        if (!orbiting || landingSequence || landed) {
          return 'Escape orbit is only available while orbiting.';
        }
        orbiting = false;
        landingSequence = false;
        navigationMode = 'cruise';
        engineOn = true;
        planetMiles[destinationIndex] = Math.max(planetMiles[destinationIndex], 18000);
        return `Escaping orbit around ${planetLabels[destinationIndex]}. Manual flight restored.`;
      }

      if (action.type === 'launch-sequence') {
        if (!landed || !destinationActive) {
          return 'Launch sequence unavailable until you have landed.';
        }
        landed = false;
        surfaceMode = false;
        orbiting = true;
        landingSequence = false;
        navigationMode = 'cruise';
        engineOn = true;
        planetMiles[destinationIndex] = 1550;
        return `Launch sequence complete. You are back in orbit around ${planetLabels[destinationIndex]}.`;
      }

      return 'Cockpit computer updated.';
    },
    getMonitorState() {
      return {
        active: monitorActive,
        lightSpeed,
        engineOn,
        autopilot: navigationMode === 'autopilot',
        navigationMode,
        orbiting,
        landingSequence,
        landed,
        arrivalAlarmActive: arrivalAlarmTimer > 0,
        radarActive,
        destinationActive,
        destinationSelectionActive,
        destinationLabel: destinationActive ? planetLabels[destinationIndex] : 'None',
        planets: planetLabels.map((label, index) => ({
          label,
          miles: Math.round(planetMiles[index]),
          destination: destinationActive && index === destinationIndex,
        })),
      };
    },
    update(deltaSeconds, input) {
      elapsed += deltaSeconds;
      collisionCooldown = Math.max(0, collisionCooldown - deltaSeconds);
      if (arrivalAlarmTimer > 0) {
        arrivalAlarmTimer = Math.max(0, arrivalAlarmTimer - deltaSeconds);
        if (arrivalAlarmTimer <= 0) {
          monitorActive = true;
        }
      }
      if (
        interiorMode
        && repairToolHeld
        && input.repairing
        && !monitorActive
        && hullDamageAmount > 0.001
        && Math.hypot(input.cameraPosition.x - repairPanelPosition.x, input.cameraPosition.z - repairPanelPosition.z) <= REPAIR_INTERACTION_RANGE
      ) {
        repairHull(deltaSeconds * 0.18);
      }

      const lightSpeedScale = 0.74 + lightSpeed * 0.18;
      const targetSpeed = landed || surfaceMode || !engineOn
        ? 0
        : interiorMode
          ? 3.6
          : orbiting && !landingSequence
            ? 0
          : navigationMode === 'autopilot'
            ? landingSequence
              ? 3.2
              : orbiting
                ? 4.4
                : 7 + lightSpeed * 2.35
            : input.forward > 0.05
              ? (input.sprint ? 19 : 12.5) * lightSpeedScale
              : input.forward < -0.05
                ? 2.25
                : 6.2 * lightSpeedScale;
      flightSpeed = MathUtils.damp(flightSpeed, targetSpeed, 2.35, deltaSeconds);

      const targetThrottle = MathUtils.clamp(
        engineOn && !landed && !surfaceMode ? flightSpeed / 14 + (input.sprint && input.forward > 0.05 ? 0.38 : 0) : 0,
        engineOn && !landed && !surfaceMode ? 0.08 : 0,
        1.28,
      );
      throttle = MathUtils.damp(throttle, targetThrottle, 4.8, deltaSeconds);

      if (!interiorMode && !surfaceMode) {
        if (landed) {
          targetPitch = MathUtils.damp(targetPitch, 0, 1.2, deltaSeconds);
        } else if (orbiting && !landingSequence) {
          targetPitch = MathUtils.damp(targetPitch, 0, 1.2, deltaSeconds);
        } else if (navigationMode === 'autopilot' && engineOn && destinationActive && !landed) {
          destinationObjects[destinationIndex].getWorldPosition(destinationPosition);
          destinationDirection.copy(destinationPosition).sub(input.cameraPosition);
          if (destinationDirection.lengthSq() > 0.0001) {
            destinationDirection.normalize();
            autopilotAvoidance.set(0, 0, 0);
            for (let index = planetDefinitions.length; index < destinationObjects.length; index += 1) {
              if (index === destinationIndex) {
                continue;
              }

              destinationObjects[index].getWorldPosition(destinationPosition);
              avoidanceProbeDirection.copy(destinationPosition).sub(input.cameraPosition);
              if (avoidanceProbeDirection.lengthSq() <= 0.0001) {
                continue;
              }
              avoidanceProbeDirection.normalize();

              const alignmentWithShip = avoidanceProbeDirection.dot(flightForward);
              const alignmentWithRoute = avoidanceProbeDirection.dot(destinationDirection);
              const routeThreat = Math.max(alignmentWithShip, alignmentWithRoute);
              const distanceThreat = MathUtils.clamp(1 - planetMiles[index] / 36000, 0, 1);
              const pathThreat = MathUtils.clamp((routeThreat - 0.42) / 0.5, 0, 1);
              const threatAmount = distanceThreat * pathThreat;
              if (threatAmount <= 0.001) {
                continue;
              }

              avoidanceSide.crossVectors(avoidanceProbeDirection, worldUp);
              if (avoidanceSide.lengthSq() <= 0.0001) {
                avoidanceSide.crossVectors(avoidanceProbeDirection, avoidanceFallbackAxis);
              }
              avoidanceSide.normalize();
              const sideSign = avoidanceSide.dot(destinationDirection) >= 0 ? 1 : -1;
              const sizeThreat = MathUtils.clamp(planetBaseRadii[index] / 52, 0.7, 1.6);
              autopilotAvoidance
                .addScaledVector(avoidanceSide, sideSign * threatAmount * sizeThreat * 0.92)
                .addScaledVector(avoidanceProbeDirection, -threatAmount * sizeThreat * 0.58);
            }
            if (autopilotAvoidance.lengthSq() > 0.0001) {
              destinationDirection.add(autopilotAvoidance).normalize();
            }
            targetYaw = Math.atan2(-destinationDirection.x, -destinationDirection.z);
            targetPitch = MathUtils.clamp(Math.asin(destinationDirection.y), -0.56, 0.56);
          }
        } else {
          const destinationMiles = destinationActive ? planetMiles[destinationIndex] : Number.POSITIVE_INFINITY;
          const mouseSlow = MathUtils.lerp(
            1,
            0.38,
            MathUtils.clamp(1 - (destinationMiles - 3800) / 180000, 0, 1),
          );
          targetYaw -= input.lookDeltaX * 0.0024 * mouseSlow;
          targetPitch = MathUtils.clamp(targetPitch - input.lookDeltaY * 0.0021 * mouseSlow, -0.74, 0.74);
        }
        const yawDelta = MathUtils.euclideanModulo(targetYaw - yaw + Math.PI, Math.PI * 2) - Math.PI;
        const turnIntent = MathUtils.clamp(yawDelta * 1.65, -1, 1);
        pitch = MathUtils.damp(pitch, targetPitch, 1.18, deltaSeconds);
        const targetDiveVisual = MathUtils.clamp(-pitch, 0, 0.82);
        diveVisual = MathUtils.damp(diveVisual, targetDiveVisual, 1.55, deltaSeconds);
        yaw = dampAngle(yaw, targetYaw, 1.05, deltaSeconds);
        roll = MathUtils.damp(roll, -turnIntent * 0.38, 2.6, deltaSeconds);
        screenPitch = MathUtils.damp(
          screenPitch,
          landed ? 0.02 : MathUtils.clamp(pitch * 0.18, -0.12, 0.16),
          1.8,
          deltaSeconds,
        );
        screenYaw = MathUtils.damp(screenYaw, landed ? 0 : turnIntent * 0.1, 2.1, deltaSeconds);
        screenRoll = MathUtils.damp(screenRoll, landed ? 0 : turnIntent * 0.34, 2.4, deltaSeconds);
        screenSlide = MathUtils.damp(screenSlide, landed ? 0 : -turnIntent * 0.34, 1.65, deltaSeconds);
        ship.rotation.set(
          pitch,
          yaw,
          roll,
        );
        screenShip.rotation.set(
          screenPitch,
          screenYaw,
          screenRoll,
        );
        screenShip.position.x = screenSlide;
        screenShip.position.y = MathUtils.damp(
          screenShip.position.y,
          landed ? -0.82 : SHIP_VERTICAL_SCREEN_OFFSET - diveVisual * SHIP_DIVE_SCREEN_DROP,
          1.6,
          deltaSeconds,
        );
      } else {
        diveVisual = MathUtils.damp(diveVisual, 0, 1.55, deltaSeconds);
      }
      const flightPitchCos = Math.cos(pitch);
      flightForward.set(
        -Math.sin(yaw) * flightPitchCos,
        Math.sin(pitch),
        -Math.cos(yaw) * flightPitchCos,
      ).normalize();
      if (!interiorMode && !surfaceMode) {
        shipCenter.copy(input.cameraPosition)
          .addScaledVector(flightForward, SHIP_SCREEN_DISTANCE)
          .addScaledVector(worldUp, SHIP_VERTICAL_SCREEN_OFFSET - diveVisual * 1.55);
        ship.position.set(
          shipCenter.x - CENTER_X,
          shipCenter.y - SHIP_MODEL_CENTER_Y,
          shipCenter.z - CENTER_Z,
        );
      }
      beacon.visible = Math.sin(elapsed * 5.8) > 0.1;
      const alarmPulse = arrivalAlarmTimer > 0 && Math.sin(elapsed * 18) > -0.18
        ? 4.8
        : 0;
      alarmLeft.intensity = alarmPulse;
      alarmRight.intensity = alarmPulse;
      radarSweep.visible = radarActive;
      cameraCenter.copy(input.cameraPosition);
      radarBlip.visible = radarActive && destinationActive && !landed && planetMiles[destinationIndex] <= 120000;
      radarSweep.rotation.y -= deltaSeconds * 2.85;
      radarSweepMaterial.opacity = radarActive ? 0.78 : 0.18;
      if (radarBlip.visible) {
        const radarDistance = MathUtils.clamp(planetMiles[destinationIndex] / 120000, 0.08, 1);
        const radarAngle = elapsed * 0.18 + destinationIndex * 1.12;
        const radarRadius = MathUtils.lerp(0.08, 0.34, radarDistance);
        radarBlip.position.x = Math.cos(radarAngle) * radarRadius;
        radarBlip.position.z = Math.sin(radarAngle) * radarRadius;
      }
      applyThrusterState(throttle);
      if (engineOn && !landed) {
        const distancesLockedByOrbit = orbiting && !landingSequence;
        destinationObjects.forEach((destination, index) => {
          if (distancesLockedByOrbit) {
            return;
          }
          destination.getWorldPosition(destinationPosition);
          planetDirection.copy(destinationPosition).sub(input.cameraPosition);
          const alignment = planetDirection.lengthSq() > 0.0001
            ? planetDirection.normalize().dot(flightForward)
            : 0;
          const isDestination = destinationActive && index === destinationIndex;
          const isJunkClump = index >= planetDefinitions.length;
          const maxDistance = basePlanetMiles[index] * 1.28 + 52000;
          const minimumDistance = isDestination
            ? landingSequence
              ? 0
              : orbiting
                ? 1550
                : 3800
            : isJunkClump
              ? 1600
              : 2600;
          const forwardApproach = Math.max(0, alignment);
          const awayDrift = Math.max(0, -alignment);
          const manualApproachMiles = lightSpeed * (650 + flightSpeed * 95) * forwardApproach * deltaSeconds;
          const driftAwayMiles = lightSpeed * (65 + flightSpeed * 8) * awayDrift * deltaSeconds;
          const broadApproachMiles = lightSpeed * (180 + flightSpeed * 34) * deltaSeconds;
          let nextMiles = planetMiles[index] + driftAwayMiles;

          if (isDestination && navigationMode === 'autopilot') {
            nextMiles -= lightSpeed * (landingSequence ? 2600 : orbiting ? 180 : 920) * deltaSeconds;
          } else {
            nextMiles -= manualApproachMiles * (isDestination ? 0.92 : isJunkClump ? 1.32 : 0.88);
          }
          if (!isDestination && forwardApproach > 0.02) {
            nextMiles -= broadApproachMiles * (isJunkClump ? 0.78 : 0.48) * MathUtils.clamp(forwardApproach + 0.2, 0, 1);
          }

          planetMiles[index] = MathUtils.clamp(nextMiles, minimumDistance, maxDistance);
        });

        if (collisionCooldown <= 0 && flightSpeed > 7.5) {
          for (let index = planetDefinitions.length; index < planetMiles.length; index += 1) {
            const impactRange = destinationActive && index === destinationIndex ? 1650 : 9300;
            if (planetMiles[index] <= impactRange) {
              const relativeSize = MathUtils.clamp(planetBaseRadii[index] / 52, 0.55, 1.4);
              const impactSpeed = MathUtils.clamp((flightSpeed - 7.5) / 18, 0.12, 1.25);
              damageHull(MathUtils.clamp(0.045 + impactSpeed * relativeSize * 0.14, 0.045, 0.32));
              collisionCooldown = 2.4;
              flightSpeed *= 0.62;
              break;
            }
          }
        }

        if (destinationActive && !orbiting && planetMiles[destinationIndex] <= 3800) {
          orbiting = true;
          landingSequence = false;
          navigationMode = 'cruise';
          engineOn = false;
          monitorActive = false;
          arrivalAlarmTimer = 3;
        }
        if (destinationActive && landingSequence && planetMiles[destinationIndex] <= 40) {
          planetMiles[destinationIndex] = 0;
          landed = true;
          engineOn = false;
          navigationMode = 'cruise';
          landingSequence = false;
          orbiting = false;
          monitorActive = true;
        }
      } else if (!destinationActive) {
        orbiting = false;
        landingSequence = false;
      }
      destinationObjects.forEach((destination, index) => {
        destination.rotation.y += deltaSeconds * (0.012 + index * 0.004);
        const closeAmount = MathUtils.clamp(1 - (planetMiles[index] - 4200) / 190000, 0, 1);
        const isDestination = destinationActive && index === destinationIndex;
        const isJunkClump = index >= planetDefinitions.length;
        const scale = isDestination
          ? 1 + closeAmount * 1.9
          : 1 + closeAmount * (isJunkClump ? 1.35 : 0.95);
        destination.visible = !(isDestination && (orbiting || landingSequence || landed));
        destination.scale.setScalar(scale);
      });
      const orbitVisualActive = destinationActive && (orbiting || landingSequence);
      nearDestinationObjects.forEach((destination, index) => {
        destination.visible = orbitVisualActive && index === destinationIndex;
      });
      if (orbitVisualActive) {
        const selectedNearPlanet = nearDestinationObjects[destinationIndex];
        orbitRight.crossVectors(flightForward, worldUp);
        if (orbitRight.lengthSq() < 0.0001) {
          orbitRight.set(1, 0, 0);
        }
        orbitRight.normalize();
        orbitUp.crossVectors(orbitRight, flightForward).normalize();

        const landingProgress = landingSequence
          ? MathUtils.clamp(1 - planetMiles[destinationIndex] / 1550, 0, 1)
          : 0;
        const destinationIsJunk = destinationIndex >= planetDefinitions.length;
        const orbitAngle = elapsed * 0.36;
        const orbitRadius = landingSequence
          ? MathUtils.lerp(destinationIsJunk ? 42 : 34, 0, landingProgress)
          : destinationIsJunk ? 46 : 38;
        const orbitHeight = landingSequence
          ? MathUtils.lerp(destinationIsJunk ? 6 : 5, -7.5, landingProgress)
          : Math.sin(orbitAngle * 0.55) * 2.6;
        const nearDistance = landingSequence
          ? MathUtils.lerp(destinationIsJunk ? 38 : 42, 4.6, landingProgress)
          : 36 + Math.cos(orbitAngle) * 5;
        selectedNearPlanet.position.copy(cameraCenter)
          .addScaledVector(flightForward, nearDistance)
          .addScaledVector(orbitRight, landingSequence ? MathUtils.lerp(-orbitRadius, 0, landingProgress) : -orbitRadius)
          .addScaledVector(orbitUp, Math.sin(orbitAngle) * orbitHeight);
        selectedNearPlanet.scale.setScalar(MathUtils.lerp(destinationIsJunk ? 5.4 : 4.2, destinationIsJunk ? 7.2 : 6.4, landingProgress));
        selectedNearPlanet.lookAt(cameraCenter);
      }

      destinationMarker.visible = destinationActive && !landed;
      if (destinationMarker.visible) {
        const markerPlanet = orbitVisualActive ? nearDestinationObjects[destinationIndex] : destinationObjects[destinationIndex];
        markerPlanet.getWorldPosition(destinationPosition);
        destinationMarker.position.copy(destinationPosition);
        destinationMarker.lookAt(cameraCenter);
        destinationMarker.scale.setScalar(planetBaseRadii[destinationIndex] * markerPlanet.scale.x * 1.35);
      }

      landingSurface.visible = landed;
      if (landingSurface.visible) {
        const surfaceColor = destinationSurfaceColors[destinationIndex];
        landingGroundMaterial.color.setHex(surfaceColor);
        landingGroundMaterial.color.offsetHSL(0, -0.08, 0.28);
        landingGroundMaterial.emissive.setHex(surfaceColor);
        landingGroundMaterial.emissive.offsetHSL(0, -0.18, 0.12);
        landingHillMaterial.color.setHex(surfaceColor);
        landingHillMaterial.color.offsetHSL(0, -0.08, 0.2);
        landingSurface.position.set(LANDING_X, 0, LANDING_Z);
        landingSurface.rotation.y = 0;
      }
      landingAtmosphere.visible = landed;
      if (landingAtmosphere.visible) {
        landingAtmosphere.position.set(LANDING_X, 0, LANDING_Z);
        landingAtmosphere.rotation.y = 0;
        landingSkyMaterial.color.setHex(destinationIndex >= planetDefinitions.length ? 0xd7d2bf : 0xb9ecff);
      }
      planetSky.visible = !landed;
      redNebulaDust.points.visible = !landed;
      cyanNebulaDust.points.visible = !landed;
      blueStars.points.visible = !landed;
      whiteStars.points.visible = !landed;
      spaceJunk.root.visible = !landed;
      if (landed) {
        destinationObjects.forEach((destination) => {
          destination.visible = false;
        });
        nearDestinationObjects.forEach((destination) => {
          destination.visible = false;
        });
      }
      planetSky.position.set(0, 0, 0);
      const backgroundSpeed = landed ? 0 : flightSpeed;
      redNebulaDust.update(deltaSeconds, backgroundSpeed * 0.52, cameraCenter, flightForward);
      cyanNebulaDust.update(deltaSeconds, backgroundSpeed * 0.6, cameraCenter, flightForward);
      blueStars.update(deltaSeconds, backgroundSpeed, cameraCenter, flightForward);
      whiteStars.update(deltaSeconds, backgroundSpeed * 1.08, cameraCenter, flightForward);
      spaceJunk.update(deltaSeconds, backgroundSpeed, cameraCenter, flightForward);
      updateHullVisuals();
    },
    reset() {
      elapsed = 0;
      throttle = 0.08;
      pitch = 0;
      targetPitch = 0;
      yaw = 0;
      targetYaw = 0;
      roll = 0;
      screenPitch = 0;
      screenYaw = 0;
      screenRoll = 0;
      screenSlide = 0;
      flightSpeed = 5.8;
      diveVisual = 0;
      monitorActive = false;
      lightSpeed = 1;
      engineOn = true;
      navigationMode = 'cruise';
      orbiting = false;
      landingSequence = false;
      landed = false;
      radarActive = true;
      destinationActive = false;
      destinationSelectionActive = false;
      destinationIndex = 0;
      arrivalAlarmTimer = 0;
      hullDurability = 1;
      hullDamageAmount = 0;
      collisionCooldown = 0;
      repairToolHeld = false;
      lastDestinationClickIndex = -1;
      lastDestinationClickTime = -10;
      alarmLeft.intensity = 0;
      alarmRight.intensity = 0;
      radarSweep.visible = true;
      radarBlip.visible = false;
      planetMiles.forEach((_, index) => {
        planetMiles[index] = basePlanetMiles[index];
        destinationObjects[index].scale.setScalar(1);
        destinationObjects[index].visible = true;
        nearDestinationObjects[index].visible = false;
      });
      destinationMarker.visible = false;
      landingSurface.visible = false;
      landingAtmosphere.visible = false;
      planetSky.visible = true;
      redNebulaDust.points.visible = true;
      cyanNebulaDust.points.visible = true;
      blueStars.points.visible = true;
      whiteStars.points.visible = true;
      spaceJunk.root.visible = true;
      blueStars.reset();
      whiteStars.reset();
      redNebulaDust.reset();
      cyanNebulaDust.reset();
      spaceJunk.reset();
      planetSky.position.set(0, 0, 0);
      interiorMode = false;
      surfaceMode = false;
      interior.visible = false;
      screenShip.visible = false;
      ship.position.set(0, 0, 0);
      ship.rotation.set(0, 0, 0);
      screenShip.position.set(0, -0.24, -4.55);
      screenShip.rotation.set(0.02, 0, 0);
      applyThrusterState(throttle);
      updateHullVisuals();
    },
  };
}
