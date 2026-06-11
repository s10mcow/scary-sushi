import {
  BoxGeometry,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
  Vector3,
} from 'three';

import { GAME_CONFIG } from '../config/gameConfig';
import type { CollisionBox } from '../types/world';

export interface ChapterEightData {
  root: Group;
  colliders: CollisionBox[];
  spawn: Vector3;
  lookTarget: Vector3;
  waterPump: ChapterEightWaterPump;
  trees: ChapterEightTree[];
  drops: ChapterEightDrop[];
  isFireLit(): boolean;
  chopTree(tree: ChapterEightTree): ChapterEightChopResult;
  collectDrop(drop: ChapterEightDrop): boolean;
  dropWood(position: Vector3): ChapterEightDrop;
  lightFire(): void;
  activateWaterPump(): void;
  getSupportedFloorY(position: Vector3): number | null;
  update(deltaSeconds: number): void;
  reset(): void;
}

export interface ChapterEightWaterPump {
  label: string;
  interactPosition: Vector3;
  handlePivot: Group;
  waterStream: Mesh;
  pumping: boolean;
}

export interface ChapterEightTree {
  root: Group;
  position: Vector3;
  collider: CollisionBox;
  trunkRadius: number;
  hits: number;
  hitsToFell: number;
  active: boolean;
  shakeTimer: number;
}

export interface ChapterEightDrop {
  kind: 'wood' | 'sapling';
  root: Group;
  position: Vector3;
  active: boolean;
}

export interface ChapterEightChopResult {
  felled: boolean;
  hitsRemaining: number;
  woodCount: number;
  saplingDropped: boolean;
}

const CENTER_X = 1540;
const CENTER_Z = 80;
const FOREST_SIZE = 210;
const HALF_FOREST_SIZE = FOREST_SIZE / 2;
const CLEARING_RADIUS = 27;
const TREE_COUNT = 174;
const GRASS_TUFT_COUNT = 390;
const MIST_PATCH_COUNT = 22;
const GROUND_Y = 0;
const TREE_HITS_TO_FELL = 7;

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

function seededRandom(index: number): number {
  const value = Math.sin(index * 129.9721 + 73.17) * 43758.5453;
  return value - Math.floor(value);
}

function createIrregularGroundGeometry(width: number, depth: number, segments: number): BufferGeometry {
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let zIndex = 0; zIndex <= segments; zIndex += 1) {
    const zRatio = zIndex / segments;
    for (let xIndex = 0; xIndex <= segments; xIndex += 1) {
      const xRatio = xIndex / segments;
      const x = (xRatio - 0.5) * width;
      const z = (zRatio - 0.5) * depth;
      const ripple = Math.sin((x + CENTER_X) * 0.13) * Math.cos((z + CENTER_Z) * 0.11) * 0.045;
      positions.push(x, ripple, z);
      normals.push(0, 1, 0);
    }
  }

  for (let zIndex = 0; zIndex < segments; zIndex += 1) {
    for (let xIndex = 0; xIndex < segments; xIndex += 1) {
      const a = zIndex * (segments + 1) + xIndex;
      const b = a + 1;
      const c = a + segments + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createTree(index: number, colliders: CollisionBox[]): ChapterEightTree {
  const tree = new Group();
  const angle = seededRandom(index * 4 + 1) * Math.PI * 2;
  const innerRing = index % 4 === 0;
  const radius = (innerRing ? CLEARING_RADIUS + 6 : CLEARING_RADIUS + 14)
    + seededRandom(index * 4 + 2) * (HALF_FOREST_SIZE - CLEARING_RADIUS - (innerRing ? 24 : 14));
  const x = CENTER_X + Math.cos(angle) * radius + (seededRandom(index * 4 + 3) - 0.5) * 10;
  const z = CENTER_Z + Math.sin(angle) * radius + (seededRandom(index * 4 + 4) - 0.5) * 10;
  const trunkHeight = 5.8 + seededRandom(index * 4 + 5) * 3.8;
  const trunkRadius = 0.24 + seededRandom(index * 4 + 6) * 0.18;
  const canopyRadius = 1.7 + seededRandom(index * 4 + 7) * 0.92;
  const deadTree = seededRandom(index * 11 + 2) > 0.82;

  const bark = new MeshStandardMaterial({
    color: deadTree ? 0x241b17 : 0x332217,
    roughness: 0.92,
    metalness: 0,
  });
  const leaves = new MeshStandardMaterial({
    color: seededRandom(index * 4 + 8) > 0.55 ? 0x0f2416 : 0x182f1b,
    roughness: 0.9,
    metalness: 0,
  });

  const trunk = new Mesh(new CylinderGeometry(trunkRadius * 0.74, trunkRadius * 1.18, trunkHeight, 9), bark);
  trunk.position.y = trunkHeight / 2;
  trunk.rotation.z = (seededRandom(index * 4 + 9) - 0.5) * 0.18;
  trunk.rotation.x = (seededRandom(index * 4 + 11) - 0.5) * 0.08;
  tree.add(trunk);

  const branchCount = deadTree ? 6 : 4;
  for (let branchIndex = 0; branchIndex < branchCount; branchIndex += 1) {
    const branchLength = deadTree ? 1.7 + seededRandom(index * 13 + branchIndex) * 1.4 : 1.35 + seededRandom(index * 13 + branchIndex) * 0.75;
    const branch = new Mesh(new CylinderGeometry(0.035, 0.14, branchLength, 7), bark);
    branch.position.y = trunkHeight * (0.42 + branchIndex * (deadTree ? 0.075 : 0.105));
    branch.rotation.z = Math.PI / (deadTree ? 2.25 : 2.6);
    branch.rotation.x = (seededRandom(index * 17 + branchIndex) - 0.5) * 0.55;
    branch.rotation.y = branchIndex * Math.PI * 0.58 + seededRandom(index * 7 + branchIndex) * 0.66;
    tree.add(branch);

    if (deadTree || branchIndex % 2 === 0) {
      const twig = new Mesh(new CylinderGeometry(0.018, 0.045, branchLength * 0.52, 6), bark);
      twig.position.y = branch.position.y + 0.16;
      twig.rotation.z = branch.rotation.z + 0.62;
      twig.rotation.x = branch.rotation.x - 0.25;
      twig.rotation.y = branch.rotation.y + 0.22;
      tree.add(twig);
    }
  }

  if (!deadTree) {
    const lowerCanopy = new Mesh(new SphereGeometry(canopyRadius, 14, 10), leaves);
    lowerCanopy.position.y = trunkHeight + canopyRadius * 0.08;
    lowerCanopy.scale.set(0.9 + seededRandom(index * 4 + 12) * 0.28, 0.62, 0.92);
    tree.add(lowerCanopy);

    const topCanopy = new Mesh(new ConeGeometry(canopyRadius * 1.02, canopyRadius * 2.25, 14), leaves);
    topCanopy.position.y = trunkHeight + canopyRadius * 1.0;
    topCanopy.rotation.z = (seededRandom(index * 4 + 13) - 0.5) * 0.1;
    tree.add(topCanopy);
  } else {
    const brokenTop = new Mesh(new ConeGeometry(trunkRadius * 1.25, 0.9, 7), bark);
    brokenTop.position.y = trunkHeight + 0.38;
    brokenTop.rotation.z = 0.28;
    tree.add(brokenTop);
  }

  tree.position.set(x, GROUND_Y, z);
  tree.rotation.y = seededRandom(index * 4 + 10) * Math.PI * 2;
  const collider = addCollider(colliders, x, z, trunkRadius * 3.2, trunkRadius * 3.2);
  return {
    root: tree,
    position: new Vector3(x, GROUND_Y + trunkHeight * 0.48, z),
    collider,
    trunkRadius,
    hits: 0,
    hitsToFell: TREE_HITS_TO_FELL,
    active: true,
    shakeTimer: 0,
  };
}

function createWoodDropModel(): Group {
  const root = new Group();
  root.name = 'Chapter 8 Wood Drop';
  const bark = new MeshStandardMaterial({ color: 0x6a4328, roughness: 0.92 });
  const ring = new MeshStandardMaterial({ color: 0xd0a06a, roughness: 0.88 });
  const log = new Mesh(new CylinderGeometry(0.18, 0.2, 0.88, 10), bark);
  log.rotation.z = Math.PI / 2;
  log.position.y = 0.24;
  const leftRing = new Mesh(new CylinderGeometry(0.19, 0.19, 0.025, 10), ring);
  leftRing.rotation.z = Math.PI / 2;
  leftRing.position.set(-0.44, 0.24, 0);
  const rightRing = leftRing.clone();
  rightRing.position.x = 0.44;
  root.add(log, leftRing, rightRing);
  return root;
}

function createSaplingDropModel(): Group {
  const root = new Group();
  root.name = 'Chapter 8 Sapling Drop';
  const stemMaterial = new MeshStandardMaterial({ color: 0x5c3a22, roughness: 0.9 });
  const leafMaterial = new MeshStandardMaterial({ color: 0x2e8a3c, roughness: 0.86 });
  const stem = new Mesh(new CylinderGeometry(0.035, 0.045, 0.74, 7), stemMaterial);
  stem.position.y = 0.38;
  const leftLeaf = new Mesh(new SphereGeometry(0.16, 8, 6), leafMaterial);
  leftLeaf.position.set(-0.14, 0.62, 0);
  leftLeaf.scale.set(1.35, 0.58, 0.82);
  const rightLeaf = leftLeaf.clone();
  rightLeaf.position.x = 0.16;
  rightLeaf.position.y = 0.72;
  root.add(stem, leftLeaf, rightLeaf);
  return root;
}

interface ChapterEightBedSurface {
  centerX: number;
  centerZ: number;
  halfWidth: number;
  halfDepth: number;
  floorY: number;
  collider: CollisionBox;
}

function createCabin(colliders: CollisionBox[]): {
  root: Group;
  bedSurface: ChapterEightBedSurface;
  fireplacePosition: Vector3;
  waterPump: ChapterEightWaterPump;
} {
  const cabin = new Group();
  cabin.name = 'Chapter 8 Woods Cabin';
  cabin.position.set(CENTER_X, GROUND_Y, CENTER_Z);

  const width = 18;
  const depth = 14;
  const height = 5;
  const wallThickness = 0.28;
  const doorWidth = 2.6;
  const roofRise = 2.1;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;

  const wallMaterial = new MeshStandardMaterial({ color: 0x4b321f, roughness: 0.9, metalness: 0.02 });
  const trimMaterial = new MeshStandardMaterial({ color: 0x261a12, roughness: 0.92, metalness: 0.02 });
  const floorMaterial = new MeshStandardMaterial({ color: 0x3a2618, roughness: 0.88, metalness: 0.02 });
  const roofMaterial = new MeshStandardMaterial({ color: 0x171411, roughness: 0.84, metalness: 0.04 });
  const doorMaterial = new MeshStandardMaterial({ color: 0x352113, roughness: 0.86, metalness: 0.02 });
  const glassMaterial = new MeshStandardMaterial({
    color: 0x8fb6c3,
    emissive: 0x071113,
    emissiveIntensity: 0.08,
    roughness: 0.16,
    metalness: 0.08,
    transparent: true,
    opacity: 0.46,
  });
  const stoneMaterial = new MeshStandardMaterial({ color: 0x706b60, roughness: 0.96, metalness: 0.02 });
  const darkStoneMaterial = new MeshStandardMaterial({ color: 0x2b2925, roughness: 0.98, metalness: 0.01 });
  const ironMaterial = new MeshStandardMaterial({ color: 0x1f2324, roughness: 0.5, metalness: 0.46 });
  const wornIronMaterial = new MeshStandardMaterial({ color: 0x3b4545, roughness: 0.58, metalness: 0.42 });
  const pumpWaterMaterial = new MeshStandardMaterial({
    color: 0x8ed4ef,
    emissive: 0x1b6a85,
    emissiveIntensity: 0.22,
    roughness: 0.2,
    metalness: 0.02,
    transparent: true,
    opacity: 0.62,
  });
  const beddingMaterial = new MeshStandardMaterial({ color: 0x5b6f5d, roughness: 0.86, metalness: 0.01 });
  const pillowMaterial = new MeshStandardMaterial({ color: 0xddd5c8, roughness: 0.78, metalness: 0.01 });

  const addCabinBox = (
    geometryWidth: number,
    geometryHeight: number,
    geometryDepth: number,
    x: number,
    y: number,
    z: number,
    material: MeshStandardMaterial,
  ): Mesh => {
    const mesh = new Mesh(new BoxGeometry(geometryWidth, geometryHeight, geometryDepth), material);
    mesh.position.set(x, y, z);
    cabin.add(mesh);
    return mesh;
  };

  const floor = addCabinBox(width + 0.7, 0.22, depth + 0.7, 0, 0.11, 0, floorMaterial);
  floor.name = 'Cabin wood plank floor';
  for (let index = 0; index < 13; index += 1) {
    const plankLine = addCabinBox(width + 0.34, 0.018, 0.035, 0, 0.235, -halfDepth + 0.95 + index * 1.02, trimMaterial);
    plankLine.name = 'Cabin floor plank seam';
  }

  const addWindow = (x: number, y: number, z: number, windowWidth: number, windowHeight: number, axis: 'x' | 'z'): void => {
    const glass = axis === 'z'
      ? addCabinBox(windowWidth, windowHeight, 0.045, x, y, z, glassMaterial)
      : addCabinBox(0.045, windowHeight, windowWidth, x, y, z, glassMaterial);
    glass.name = 'Cabin glass window';
    const horizontal = axis === 'z'
      ? new BoxGeometry(windowWidth + 0.24, 0.12, 0.12)
      : new BoxGeometry(0.12, 0.12, windowWidth + 0.24);
    const vertical = axis === 'z'
      ? new BoxGeometry(0.12, windowHeight + 0.24, 0.12)
      : new BoxGeometry(0.12, windowHeight + 0.24, 0.12);
    const top = new Mesh(horizontal, trimMaterial);
    top.position.set(x, y + windowHeight / 2 + 0.09, z);
    const bottom = top.clone();
    bottom.position.y = y - windowHeight / 2 - 0.09;
    const left = new Mesh(vertical, trimMaterial);
    const right = new Mesh(vertical, trimMaterial);
    if (axis === 'z') {
      left.position.set(x - windowWidth / 2 - 0.09, y, z);
      right.position.set(x + windowWidth / 2 + 0.09, y, z);
    } else {
      left.position.set(x, y, z - windowWidth / 2 - 0.09);
      right.position.set(x, y, z + windowWidth / 2 + 0.09);
    }
    cabin.add(top, bottom, left, right);
  };

  type ZOpening = { xMin: number; xMax: number; yMin: number; yMax: number };
  const addZWall = (z: number, openings: ZOpening[]): void => {
    const xEdges = [-halfWidth, halfWidth, ...openings.flatMap((opening) => [opening.xMin, opening.xMax])]
      .filter((value, index, array) => value >= -halfWidth && value <= halfWidth && array.indexOf(value) === index)
      .sort((a, b) => a - b);
    const yEdges = [0, height, ...openings.flatMap((opening) => [opening.yMin, opening.yMax])]
      .filter((value, index, array) => value >= 0 && value <= height && array.indexOf(value) === index)
      .sort((a, b) => a - b);
    for (let xIndex = 0; xIndex < xEdges.length - 1; xIndex += 1) {
      for (let yIndex = 0; yIndex < yEdges.length - 1; yIndex += 1) {
        const xMin = xEdges[xIndex];
        const xMax = xEdges[xIndex + 1];
        const yMin = yEdges[yIndex];
        const yMax = yEdges[yIndex + 1];
        const centerX = (xMin + xMax) / 2;
        const centerY = (yMin + yMax) / 2;
        const insideOpening = openings.some((opening) => (
          centerX > opening.xMin
          && centerX < opening.xMax
          && centerY > opening.yMin
          && centerY < opening.yMax
        ));
        if (!insideOpening && xMax - xMin > 0.05 && yMax - yMin > 0.05) {
          addCabinBox(xMax - xMin, yMax - yMin, wallThickness, centerX, centerY, z, wallMaterial);
        }
      }
    }
  };

  type XOpening = { zMin: number; zMax: number; yMin: number; yMax: number };
  const addXWall = (x: number, openings: XOpening[]): void => {
    const zEdges = [-halfDepth, halfDepth, ...openings.flatMap((opening) => [opening.zMin, opening.zMax])]
      .filter((value, index, array) => value >= -halfDepth && value <= halfDepth && array.indexOf(value) === index)
      .sort((a, b) => a - b);
    const yEdges = [0, height, ...openings.flatMap((opening) => [opening.yMin, opening.yMax])]
      .filter((value, index, array) => value >= 0 && value <= height && array.indexOf(value) === index)
      .sort((a, b) => a - b);
    for (let zIndex = 0; zIndex < zEdges.length - 1; zIndex += 1) {
      for (let yIndex = 0; yIndex < yEdges.length - 1; yIndex += 1) {
        const zMin = zEdges[zIndex];
        const zMax = zEdges[zIndex + 1];
        const yMin = yEdges[yIndex];
        const yMax = yEdges[yIndex + 1];
        const centerZ = (zMin + zMax) / 2;
        const centerY = (yMin + yMax) / 2;
        const insideOpening = openings.some((opening) => (
          centerZ > opening.zMin
          && centerZ < opening.zMax
          && centerY > opening.yMin
          && centerY < opening.yMax
        ));
        if (!insideOpening && zMax - zMin > 0.05 && yMax - yMin > 0.05) {
          addCabinBox(wallThickness, yMax - yMin, zMax - zMin, x, centerY, centerZ, wallMaterial);
        }
      }
    }
  };

  addZWall(halfDepth, [
    { xMin: -doorWidth / 2, xMax: doorWidth / 2, yMin: 0, yMax: 3.65 },
    { xMin: -6.4, xMax: -4.0, yMin: 1.65, yMax: 3.28 },
    { xMin: 4.0, xMax: 6.4, yMin: 1.65, yMax: 3.28 },
  ]);
  addZWall(-halfDepth, []);
  addXWall(-halfWidth, []);
  addXWall(halfWidth, [
    { zMin: -2.8, zMax: 2.8, yMin: 1.55, yMax: 3.62 },
  ]);

  addWindow(-5.2, 2.46, halfDepth + 0.16, 2.4, 1.62, 'z');
  addWindow(5.2, 2.46, halfDepth + 0.16, 2.4, 1.62, 'z');
  addWindow(halfWidth + 0.16, 2.58, 0, 5.6, 2.06, 'x');

  const openDoor = addCabinBox(doorWidth, 3.55, 0.16, -1.42, 1.78, halfDepth + 1.16, doorMaterial);
  openDoor.rotation.y = -1.05;
  const doorKnob = new Mesh(new SphereGeometry(0.085, 12, 8), trimMaterial);
  doorKnob.position.set(-0.52, 1.82, halfDepth + 1.64);
  cabin.add(doorKnob);

  const roofSlopeLength = Math.hypot(halfWidth + 0.9, roofRise);
  const roofAngle = Math.atan2(roofRise, halfWidth + 0.9);
  const roofY = height + roofRise / 2 - 0.18;
  const leftRoof = addCabinBox(roofSlopeLength, 0.34, depth + 1.4, -halfWidth / 2 - 0.15, roofY, 0, roofMaterial);
  leftRoof.rotation.z = roofAngle;
  const rightRoof = addCabinBox(roofSlopeLength, 0.34, depth + 1.4, halfWidth / 2 + 0.15, roofY, 0, roofMaterial);
  rightRoof.rotation.z = -roofAngle;
  addCabinBox(0.52, 0.34, depth + 1.48, 0, height + roofRise - 0.22, 0, trimMaterial);

  const fireplace = new Group();
  fireplace.position.set(0, 0, -halfDepth + 0.5);
  const hearth = new Mesh(new BoxGeometry(3.2, 0.28, 1.25), stoneMaterial);
  hearth.position.set(0, 0.14, 0.28);
  const firebox = new Mesh(new BoxGeometry(2.4, 2.3, 0.72), stoneMaterial);
  firebox.position.set(0, 1.35, -0.05);
  const darkOpening = new Mesh(new BoxGeometry(1.55, 1.18, 0.08), darkStoneMaterial);
  darkOpening.position.set(0, 1.1, 0.34);
  const mantle = new Mesh(new BoxGeometry(3.0, 0.28, 0.85), stoneMaterial);
  mantle.position.set(0, 2.6, 0.12);
  fireplace.add(hearth, firebox, darkOpening, mantle);
  cabin.add(fireplace);
  const chimney = addCabinBox(1.38, height + roofRise + 1.8, 1.05, 0, (height + roofRise + 1.8) / 2, -halfDepth - 0.38, stoneMaterial);
  chimney.name = 'Cabin stone chimney';
  addCollider(colliders, CENTER_X, CENTER_Z - halfDepth + 0.42, 3.45, 1.5);

  const bed = new Group();
  bed.position.set(halfWidth - 2.05, 0, -1.1);
  const bedFrame = new Mesh(new BoxGeometry(2.4, 0.44, 6.1), trimMaterial);
  bedFrame.position.y = 0.55;
  const mattress = new Mesh(new BoxGeometry(2.22, 0.32, 5.78), beddingMaterial);
  mattress.position.y = 0.88;
  const pillow = new Mesh(new BoxGeometry(1.72, 0.25, 0.78), pillowMaterial);
  pillow.position.set(0, 1.15, -2.32);
  const blanket = new Mesh(new BoxGeometry(2.24, 0.16, 3.15), new MeshStandardMaterial({ color: 0x3a4a3d, roughness: 0.88 }));
  blanket.position.set(0, 1.12, 0.8);
  const bedLegs = [
    [-0.92, -2.62],
    [0.92, -2.62],
    [-0.92, 2.62],
    [0.92, 2.62],
  ].map(([legX, legZ]) => {
    const leg = new Mesh(new BoxGeometry(0.18, 0.56, 0.18), trimMaterial);
    leg.position.set(legX, 0.28, legZ);
    return leg;
  });
  bed.add(bedFrame, mattress, pillow, blanket, ...bedLegs);
  cabin.add(bed);
  const bedCollider = addCollider(colliders, CENTER_X + halfWidth - 2.05, CENTER_Z - 1.1, 2.6, 6.3);

  const stove = new Group();
  stove.position.set(halfWidth - 2.45, 0, halfDepth - 3.1);
  const stoveBody = new Mesh(new SphereGeometry(0.76, 24, 16), ironMaterial);
  stoveBody.scale.set(1.15, 0.88, 0.78);
  stoveBody.position.y = 1.02;
  const stoveDoor = new Mesh(new CylinderGeometry(0.32, 0.32, 0.06, 20), darkStoneMaterial);
  stoveDoor.position.set(-0.68, 1.02, 0);
  stoveDoor.rotation.z = Math.PI / 2;
  const stoveDoorHandle = new Mesh(new BoxGeometry(0.06, 0.18, 0.08), ironMaterial);
  stoveDoorHandle.position.set(-0.73, 1.02, 0.23);
  const stoveTop = new Mesh(new CylinderGeometry(0.42, 0.48, 0.12, 22), ironMaterial);
  stoveTop.position.y = 1.72;
  const stoveLegs = [
    [-0.48, -0.36],
    [0.48, -0.36],
    [-0.48, 0.36],
    [0.48, 0.36],
  ].map(([legX, legZ]) => {
    const leg = new Mesh(new CylinderGeometry(0.045, 0.06, 0.62, 8), ironMaterial);
    leg.position.set(legX, 0.35, legZ);
    return leg;
  });
  const verticalPipe = new Mesh(new CylinderGeometry(0.13, 0.13, 3.35, 16), ironMaterial);
  verticalPipe.position.set(0, 3.14, -0.16);
  const wallPipe = new Mesh(new CylinderGeometry(0.13, 0.13, 3.02, 16), ironMaterial);
  wallPipe.rotation.x = Math.PI / 2;
  wallPipe.position.set(0, 4.7, 1.18);
  stove.add(stoveBody, stoveDoor, stoveDoorHandle, stoveTop, ...stoveLegs, verticalPipe, wallPipe);
  cabin.add(stove);
  addCabinBox(0.72, height + roofRise + 0.9, 0.72, halfWidth - 2.45, (height + roofRise + 0.9) / 2, halfDepth + 0.44, ironMaterial);
  addCollider(colliders, CENTER_X + halfWidth - 2.45, CENTER_Z + halfDepth - 3.1, 1.85, 1.7);

  const pump = new Group();
  pump.name = 'Cabin outdoor hand water pump';
  pump.position.set(-5.8, 0, halfDepth + 4.05);
  const pumpBase = new Mesh(new CylinderGeometry(0.36, 0.42, 0.18, 18), wornIronMaterial);
  pumpBase.position.y = 0.09;
  const pumpPost = new Mesh(new CylinderGeometry(0.15, 0.18, 1.72, 16), wornIronMaterial);
  pumpPost.position.y = 0.98;
  const pumpHead = new Mesh(new SphereGeometry(0.31, 18, 12), wornIronMaterial);
  pumpHead.scale.set(0.88, 0.68, 0.88);
  pumpHead.position.y = 1.82;
  const spout = new Mesh(new CylinderGeometry(0.06, 0.08, 0.86, 12), wornIronMaterial);
  spout.rotation.x = Math.PI / 2;
  spout.position.set(0, 1.72, 0.52);
  const spoutLip = new Mesh(new CylinderGeometry(0.08, 0.1, 0.18, 12), wornIronMaterial);
  spoutLip.position.set(0, 1.54, 0.94);
  const pumpHandle = new Group();
  pumpHandle.position.set(0, 2.08, -0.48);
  pumpHandle.rotation.x = -0.34;
  const handleArm = new Mesh(new BoxGeometry(0.1, 0.09, 1.14), wornIronMaterial);
  const handleGrip = new Mesh(new CylinderGeometry(0.045, 0.045, 0.48, 10), wornIronMaterial);
  handleGrip.rotation.z = Math.PI / 2;
  handleGrip.position.set(0, 0.19, -0.58);
  pumpHandle.add(handleArm, handleGrip);
  const waterStream = new Mesh(new CylinderGeometry(0.035, 0.045, 0.46, 10), pumpWaterMaterial);
  waterStream.position.set(0, 1.26, 1.02);
  waterStream.visible = false;
  pump.add(pumpBase, pumpPost, pumpHead, spout, spoutLip, pumpHandle, waterStream);
  cabin.add(pump);
  addCollider(colliders, CENTER_X - 5.8, CENTER_Z + halfDepth + 4.05, 1.1, 1.3);

  addCollider(colliders, CENTER_X - (doorWidth / 2 + (width - doorWidth) / 4), CENTER_Z + halfDepth, (width - doorWidth) / 2, wallThickness);
  addCollider(colliders, CENTER_X + doorWidth / 2 + (width - doorWidth) / 4, CENTER_Z + halfDepth, (width - doorWidth) / 2, wallThickness);
  addCollider(colliders, CENTER_X, CENTER_Z - halfDepth, width, wallThickness);
  addCollider(colliders, CENTER_X - halfWidth, CENTER_Z, wallThickness, depth);
  addCollider(colliders, CENTER_X + halfWidth, CENTER_Z, wallThickness, depth);

  return {
    root: cabin,
    bedSurface: {
      centerX: CENTER_X + halfWidth - 2.05,
      centerZ: CENTER_Z - 1.1,
      halfWidth: 1.18,
      halfDepth: 2.86,
      floorY: 1.08,
      collider: bedCollider,
    },
    fireplacePosition: new Vector3(CENTER_X, GROUND_Y, CENTER_Z - halfDepth + 0.4),
    waterPump: {
      label: 'Hand water pump',
      interactPosition: new Vector3(CENTER_X - 5.8, GAME_CONFIG.player.height, CENTER_Z + halfDepth + 4.05),
      handlePivot: pumpHandle,
      waterStream,
      pumping: false,
    },
  };
}

export function createChapterEight(): ChapterEightData {
  const root = new Group();
  root.name = 'Chapter 8: The Woods';
  const colliders: CollisionBox[] = [];
  const trees: ChapterEightTree[] = [];
  const drops: ChapterEightDrop[] = [];

  const grassMaterial = new MeshStandardMaterial({
    color: 0x162515,
    roughness: 0.94,
    metalness: 0,
  });
  const clearingGrassMaterial = new MeshStandardMaterial({
    color: 0x506f3f,
    roughness: 0.92,
    metalness: 0,
  });
  const mistMaterial = new MeshStandardMaterial({
    color: 0x8b938f,
    emissive: 0x101817,
    emissiveIntensity: 0.08,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });

  const ground = new Mesh(createIrregularGroundGeometry(FOREST_SIZE, FOREST_SIZE, 36), grassMaterial);
  ground.position.set(CENTER_X, GROUND_Y, CENTER_Z);
  root.add(ground);

  const clearing = new Mesh(new CylinderGeometry(CLEARING_RADIUS, CLEARING_RADIUS, 0.035, 64), clearingGrassMaterial);
  clearing.position.set(CENTER_X, GROUND_Y + 0.022, CENTER_Z);
  root.add(clearing);

  addCollider(colliders, CENTER_X, CENTER_Z - HALF_FOREST_SIZE - 1, FOREST_SIZE, 2);
  addCollider(colliders, CENTER_X, CENTER_Z + HALF_FOREST_SIZE + 1, FOREST_SIZE, 2);
  addCollider(colliders, CENTER_X - HALF_FOREST_SIZE - 1, CENTER_Z, 2, FOREST_SIZE);
  addCollider(colliders, CENTER_X + HALF_FOREST_SIZE + 1, CENTER_Z, 2, FOREST_SIZE);

  const grassGeometry = new ConeGeometry(0.12, 0.7, 5);
  const grassTuftMaterial = new MeshStandardMaterial({
    color: 0x243a24,
    roughness: 0.96,
    metalness: 0,
  });
  for (let index = 0; index < GRASS_TUFT_COUNT; index += 1) {
    const angle = seededRandom(500 + index * 3) * Math.PI * 2;
    const radius = CLEARING_RADIUS + seededRandom(501 + index * 3) * (HALF_FOREST_SIZE - CLEARING_RADIUS - 4);
    const tuft = new Mesh(grassGeometry, grassTuftMaterial);
    tuft.position.set(
      CENTER_X + Math.cos(angle) * radius,
      GROUND_Y + 0.35,
      CENTER_Z + Math.sin(angle) * radius,
    );
    tuft.rotation.y = seededRandom(502 + index * 3) * Math.PI * 2;
    tuft.scale.setScalar(0.65 + seededRandom(503 + index * 3) * 0.8);
    root.add(tuft);
  }

  const mistGeometry = new SphereGeometry(1, 18, 8);
  for (let index = 0; index < MIST_PATCH_COUNT; index += 1) {
    const angle = seededRandom(1700 + index * 3) * Math.PI * 2;
    const radius = CLEARING_RADIUS + 10 + seededRandom(1701 + index * 3) * (HALF_FOREST_SIZE - CLEARING_RADIUS - 18);
    const mist = new Mesh(mistGeometry, mistMaterial);
    mist.position.set(
      CENTER_X + Math.cos(angle) * radius,
      GROUND_Y + 0.38 + seededRandom(1704 + index) * 0.24,
      CENTER_Z + Math.sin(angle) * radius,
    );
    mist.scale.set(
      5.2 + seededRandom(1710 + index) * 4.8,
      0.16 + seededRandom(1711 + index) * 0.12,
      2.4 + seededRandom(1712 + index) * 2.6,
    );
    mist.rotation.y = seededRandom(1702 + index * 3) * Math.PI * 2;
    root.add(mist);
  }

  for (let index = 0; index < TREE_COUNT; index += 1) {
    const tree = createTree(index, colliders);
    trees.push(tree);
    root.add(tree.root);
  }

  const coldWoodsLight = new PointLight(0x3d5368, 0.95, FOREST_SIZE * 0.85, 2.0);
  coldWoodsLight.position.set(CENTER_X - 24, 12, CENTER_Z + 34);
  root.add(coldWoodsLight);

  const cabin = createCabin(colliders);
  root.add(cabin.root);

  const spawn = new Vector3(CENTER_X, GAME_CONFIG.player.height, CENTER_Z + 17);
  const lookTarget = new Vector3(CENTER_X, 1.8, CENTER_Z + 4.6);
  let elapsed = 0;
  let fireplaceLit = false;
  let waterPumpTimer = 0;

  const removeTreeCollider = (tree: ChapterEightTree): void => {
    tree.collider.enabled = false;
    const index = colliders.indexOf(tree.collider);
    if (index >= 0) {
      colliders.splice(index, 1);
    }
  };

  const spawnDrop = (kind: ChapterEightDrop['kind'], position: Vector3): ChapterEightDrop => {
    const dropRoot = kind === 'wood' ? createWoodDropModel() : createSaplingDropModel();
    const offsetSeed = drops.length + (kind === 'wood' ? 1200 : 2400);
    const angle = seededRandom(offsetSeed) * Math.PI * 2;
    const radius = kind === 'wood' ? 0.28 + seededRandom(offsetSeed + 1) * 0.58 : 0.35;
    dropRoot.position.set(
      position.x + Math.cos(angle) * radius,
      GROUND_Y + 0.03,
      position.z + Math.sin(angle) * radius,
    );
    dropRoot.rotation.y = seededRandom(offsetSeed + 2) * Math.PI * 2;
    root.add(dropRoot);
    const drop = {
      kind,
      root: dropRoot,
      position: dropRoot.position.clone(),
      active: true,
    };
    drops.push(drop);
    return drop;
  };

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    waterPump: cabin.waterPump,
    trees,
    drops,
    isFireLit() {
      return fireplaceLit;
    },
    chopTree(tree) {
      if (!tree.active) {
        return {
          felled: false,
          hitsRemaining: 0,
          woodCount: 0,
          saplingDropped: false,
        };
      }

      tree.hits += 1;
      tree.shakeTimer = 0.32;
      const hitsRemaining = Math.max(0, tree.hitsToFell - tree.hits);
      if (hitsRemaining > 0) {
        return {
          felled: false,
          hitsRemaining,
          woodCount: 0,
          saplingDropped: false,
        };
      }

      tree.active = false;
      tree.root.visible = false;
      removeTreeCollider(tree);
      const woodCount = 2 + Math.floor(seededRandom(3400 + tree.position.x * 0.13 + tree.position.z * 0.19) * 2);
      for (let index = 0; index < woodCount; index += 1) {
        spawnDrop('wood', tree.position);
      }
      const saplingDropped = seededRandom(4600 + tree.position.x * 0.07 + tree.position.z * 0.11) >= 0.5;
      if (saplingDropped) {
        spawnDrop('sapling', tree.position);
      }
      return {
        felled: true,
        hitsRemaining: 0,
        woodCount,
        saplingDropped,
      };
    },
    collectDrop(drop) {
      if (!drop.active) {
        return false;
      }
      drop.active = false;
      drop.root.visible = false;
      root.remove(drop.root);
      return true;
    },
    dropWood(position) {
      return spawnDrop('wood', position);
    },
    lightFire() {
      fireplaceLit = true;
    },
    activateWaterPump() {
      waterPumpTimer = 2.8;
      cabin.waterPump.pumping = true;
      cabin.waterPump.waterStream.visible = true;
    },
    getSupportedFloorY(position) {
      const insideX = position.x >= CENTER_X - HALF_FOREST_SIZE && position.x <= CENTER_X + HALF_FOREST_SIZE;
      const insideZ = position.z >= CENTER_Z - HALF_FOREST_SIZE && position.z <= CENTER_Z + HALF_FOREST_SIZE;
      const nearBed = Math.abs(position.x - cabin.bedSurface.centerX) <= cabin.bedSurface.halfWidth + GAME_CONFIG.player.radius + 0.28
        && Math.abs(position.z - cabin.bedSurface.centerZ) <= cabin.bedSurface.halfDepth + GAME_CONFIG.player.radius + 0.28;
      const highEnoughToClearBed = position.y > GAME_CONFIG.player.height + 0.22;
      cabin.bedSurface.collider.enabled = !(nearBed && highEnoughToClearBed);
      const onBed = Math.abs(position.x - cabin.bedSurface.centerX) <= cabin.bedSurface.halfWidth
        && Math.abs(position.z - cabin.bedSurface.centerZ) <= cabin.bedSurface.halfDepth;
      if (onBed && highEnoughToClearBed) {
        return GAME_CONFIG.player.height + cabin.bedSurface.floorY;
      }
      return insideX && insideZ ? GAME_CONFIG.player.height : null;
    },
    update(deltaSeconds) {
      elapsed += deltaSeconds;
      trees.forEach((tree) => {
        if (!tree.active) {
          return;
        }
        if (tree.shakeTimer <= 0) {
          tree.root.rotation.z = 0;
          return;
        }
        tree.shakeTimer = Math.max(0, tree.shakeTimer - deltaSeconds);
        const shake = Math.sin(tree.shakeTimer * 52) * tree.shakeTimer * 0.18;
        tree.root.rotation.z = shake;
      });
      if (cabin.waterPump.pumping) {
        waterPumpTimer = Math.max(0, waterPumpTimer - deltaSeconds);
        const pumpCycle = Math.sin(elapsed * 13.2);
        cabin.waterPump.handlePivot.rotation.x = -0.34 + pumpCycle * 0.46;
        cabin.waterPump.waterStream.scale.y = 0.78 + Math.max(0, pumpCycle) * 0.38;
        if (waterPumpTimer <= 0) {
          cabin.waterPump.pumping = false;
          cabin.waterPump.waterStream.visible = false;
          cabin.waterPump.waterStream.scale.setScalar(1);
        }
      } else {
        cabin.waterPump.handlePivot.rotation.x += (-0.34 - cabin.waterPump.handlePivot.rotation.x) * Math.min(1, deltaSeconds * 8);
      }
    },
    reset() {
      elapsed = 0;
      fireplaceLit = false;
      waterPumpTimer = 0;
      drops.forEach((drop) => {
        drop.active = false;
        root.remove(drop.root);
      });
      drops.length = 0;
      trees.forEach((tree) => {
        tree.active = true;
        tree.hits = 0;
        tree.shakeTimer = 0;
        tree.root.visible = true;
        tree.root.rotation.z = 0;
        tree.collider.enabled = true;
        if (!colliders.includes(tree.collider)) {
          colliders.push(tree.collider);
        }
      });
      cabin.bedSurface.collider.enabled = true;
      cabin.waterPump.pumping = false;
      cabin.waterPump.handlePivot.rotation.x = -0.34;
      cabin.waterPump.waterStream.visible = false;
      cabin.waterPump.waterStream.scale.setScalar(1);
      root.visible = false;
    },
  };
}
