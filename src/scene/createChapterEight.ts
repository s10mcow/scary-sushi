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
  craftingBench: ChapterEightBench;
  grindingBench: ChapterEightBench;
  firePitPosition: Vector3;
  trees: ChapterEightTree[];
  drops: ChapterEightDrop[];
  isFireLit(): boolean;
  chopTree(tree: ChapterEightTree): ChapterEightChopResult;
  collectDrop(drop: ChapterEightDrop): boolean;
  dropWood(position: Vector3): ChapterEightDrop;
  lightFire(): void;
  getSupportedFloorY(position: Vector3): number | null;
  update(deltaSeconds: number): void;
  reset(): void;
}

export interface ChapterEightBench {
  label: string;
  position: Vector3;
  collider: CollisionBox;
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
const TREE_COUNT = 96;
const GRASS_TUFT_COUNT = 280;
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

function createBenchMaterials() {
  return {
    wood: new MeshStandardMaterial({
      color: 0x6b3f24,
      roughness: 0.82,
      metalness: 0.03,
    }),
    darkWood: new MeshStandardMaterial({
      color: 0x3d2518,
      roughness: 0.88,
      metalness: 0.02,
    }),
    stone: new MeshStandardMaterial({
      color: 0x827b70,
      roughness: 0.92,
      metalness: 0.01,
    }),
    metal: new MeshStandardMaterial({
      color: 0x5c6061,
      roughness: 0.48,
      metalness: 0.36,
    }),
  };
}

function createCraftingBench(materials: ReturnType<typeof createBenchMaterials>): Group {
  const bench = new Group();
  bench.name = 'Chapter 8 Crafting Bench';

  const top = new Mesh(new BoxGeometry(3.2, 0.28, 1.45), materials.wood);
  top.position.y = 1.04;
  bench.add(top);

  const plankGeometry = new BoxGeometry(0.1, 0.035, 1.5);
  for (let index = -2; index <= 2; index += 1) {
    const line = new Mesh(plankGeometry, materials.darkWood);
    line.position.set(index * 0.62, 1.2, 0);
    bench.add(line);
  }

  const crossGeometry = new BoxGeometry(3.25, 0.035, 0.08);
  [-0.48, 0.48].forEach((z) => {
    const line = new Mesh(crossGeometry, materials.darkWood);
    line.position.set(0, 1.22, z);
    bench.add(line);
  });

  const legGeometry = new BoxGeometry(0.34, 1.0, 0.34);
  [
    [-1.35, -0.52],
    [1.35, -0.52],
    [-1.35, 0.52],
    [1.35, 0.52],
  ].forEach(([x, z]) => {
    const leg = new Mesh(legGeometry, materials.darkWood);
    leg.position.set(x, 0.52, z);
    bench.add(leg);
  });

  const lowerShelf = new Mesh(new BoxGeometry(2.8, 0.16, 1.08), materials.darkWood);
  lowerShelf.position.y = 0.42;
  bench.add(lowerShelf);

  return bench;
}

function createGrindingBench(materials: ReturnType<typeof createBenchMaterials>): Group {
  const bench = new Group();
  bench.name = 'Chapter 8 Grinding Bench';

  const slab = new Mesh(new BoxGeometry(3.0, 0.3, 1.45), materials.stone);
  slab.position.y = 0.98;
  bench.add(slab);

  const base = new Mesh(new BoxGeometry(2.6, 0.62, 1.05), materials.wood);
  base.position.y = 0.5;
  bench.add(base);

  const wheel = new Mesh(new CylinderGeometry(0.56, 0.56, 0.22, 28), materials.stone);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0.35, 1.38, 0);
  bench.add(wheel);

  const axle = new Mesh(new CylinderGeometry(0.09, 0.09, 1.45, 14), materials.metal);
  axle.rotation.x = Math.PI / 2;
  axle.position.set(0.35, 1.38, 0);
  bench.add(axle);

  const handle = new Mesh(new BoxGeometry(0.16, 0.16, 0.84), materials.darkWood);
  handle.position.set(0.35, 1.38, -0.78);
  handle.rotation.x = 0.28;
  bench.add(handle);

  return bench;
}

function createTree(index: number, colliders: CollisionBox[]): ChapterEightTree {
  const tree = new Group();
  const angle = seededRandom(index * 4 + 1) * Math.PI * 2;
  const radius = CLEARING_RADIUS + 9 + seededRandom(index * 4 + 2) * (HALF_FOREST_SIZE - CLEARING_RADIUS - 15);
  const x = CENTER_X + Math.cos(angle) * radius + (seededRandom(index * 4 + 3) - 0.5) * 8;
  const z = CENTER_Z + Math.sin(angle) * radius + (seededRandom(index * 4 + 4) - 0.5) * 8;
  const trunkHeight = 5.2 + seededRandom(index * 4 + 5) * 2.6;
  const trunkRadius = 0.28 + seededRandom(index * 4 + 6) * 0.16;
  const canopyRadius = 1.9 + seededRandom(index * 4 + 7) * 0.8;

  const bark = new MeshStandardMaterial({
    color: 0x4b2f1d,
    roughness: 0.92,
    metalness: 0,
  });
  const leaves = new MeshStandardMaterial({
    color: seededRandom(index * 4 + 8) > 0.5 ? 0x1f4d27 : 0x2f6630,
    roughness: 0.86,
    metalness: 0,
  });

  const trunk = new Mesh(new CylinderGeometry(trunkRadius * 0.85, trunkRadius * 1.1, trunkHeight, 9), bark);
  trunk.position.y = trunkHeight / 2;
  trunk.rotation.z = (seededRandom(index * 4 + 9) - 0.5) * 0.08;
  tree.add(trunk);

  for (let branchIndex = 0; branchIndex < 3; branchIndex += 1) {
    const branch = new Mesh(new CylinderGeometry(0.08, 0.16, 1.55, 7), bark);
    branch.position.y = trunkHeight * (0.56 + branchIndex * 0.09);
    branch.rotation.z = Math.PI / 2.6;
    branch.rotation.y = branchIndex * Math.PI * 0.68 + seededRandom(index * 7 + branchIndex) * 0.4;
    tree.add(branch);
  }

  const lowerCanopy = new Mesh(new SphereGeometry(canopyRadius, 14, 10), leaves);
  lowerCanopy.position.y = trunkHeight + canopyRadius * 0.15;
  lowerCanopy.scale.set(1, 0.72, 1);
  tree.add(lowerCanopy);

  const topCanopy = new Mesh(new ConeGeometry(canopyRadius * 1.05, canopyRadius * 2.15, 14), leaves);
  topCanopy.position.y = trunkHeight + canopyRadius * 1.05;
  tree.add(topCanopy);

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

export function createChapterEight(): ChapterEightData {
  const root = new Group();
  root.name = 'Chapter 8: The Woods';
  const colliders: CollisionBox[] = [];
  const trees: ChapterEightTree[] = [];
  const drops: ChapterEightDrop[] = [];

  const grassMaterial = new MeshStandardMaterial({
    color: 0x2f5a2f,
    roughness: 0.94,
    metalness: 0,
  });
  const clearingGrassMaterial = new MeshStandardMaterial({
    color: 0x78a95b,
    roughness: 0.92,
    metalness: 0,
  });
  const stoneMaterial = new MeshStandardMaterial({
    color: 0x817d73,
    roughness: 0.96,
    metalness: 0.02,
  });
  const charredWoodMaterial = new MeshStandardMaterial({
    color: 0x25170f,
    roughness: 0.88,
    metalness: 0.01,
  });
  const flameMaterial = new MeshStandardMaterial({
    color: 0xff8a23,
    emissive: 0xff4f11,
    emissiveIntensity: 1.6,
    roughness: 0.34,
    metalness: 0,
  });
  const emberMaterial = new MeshStandardMaterial({
    color: 0xffc05a,
    emissive: 0xff5a16,
    emissiveIntensity: 0.9,
    roughness: 0.48,
    metalness: 0,
  });
  const benchMaterials = createBenchMaterials();

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
    color: 0x4f7d3f,
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

  for (let index = 0; index < TREE_COUNT; index += 1) {
    const tree = createTree(index, colliders);
    trees.push(tree);
    root.add(tree.root);
  }

  const firePit = new Group();
  firePit.name = 'Chapter 8 Fire Pit';
  firePit.position.set(CENTER_X, GROUND_Y, CENTER_Z);
  root.add(firePit);

  const ash = new Mesh(new CylinderGeometry(2.4, 2.4, 0.08, 36), new MeshStandardMaterial({
    color: 0x2c2b27,
    roughness: 0.98,
    metalness: 0,
  }));
  ash.position.y = 0.06;
  firePit.add(ash);

  const rockGeometry = new SphereGeometry(0.42, 10, 8);
  for (let index = 0; index < 18; index += 1) {
    const angle = (index / 18) * Math.PI * 2;
    const rock = new Mesh(rockGeometry, stoneMaterial);
    rock.position.set(Math.cos(angle) * 2.75, 0.22, Math.sin(angle) * 2.75);
    rock.scale.set(
      1 + seededRandom(800 + index) * 0.38,
      0.52 + seededRandom(820 + index) * 0.24,
      0.82 + seededRandom(840 + index) * 0.35,
    );
    rock.rotation.y = seededRandom(860 + index) * Math.PI;
    firePit.add(rock);
  }

  const logGeometry = new CylinderGeometry(0.16, 0.2, 2.55, 9);
  for (let index = 0; index < 4; index += 1) {
    const log = new Mesh(logGeometry, charredWoodMaterial);
    log.position.set(Math.cos(index * Math.PI / 2) * 0.42, 0.28, Math.sin(index * Math.PI / 2) * 0.42);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = index * Math.PI / 4;
    firePit.add(log);
  }

  const flame = new Group();
  flame.name = 'Chapter 8 Fire Flame';
  const flameA = new Mesh(new ConeGeometry(0.58, 1.85, 9), flameMaterial);
  flameA.position.y = 1.05;
  const flameB = new Mesh(new ConeGeometry(0.38, 1.25, 8), emberMaterial);
  flameB.position.set(0.2, 0.9, -0.12);
  flameB.rotation.z = -0.16;
  flame.add(flameA, flameB);
  flame.visible = false;
  firePit.add(flame);

  const fireLight = new PointLight(0xff9a35, 0, 34, 1.65);
  fireLight.position.set(CENTER_X, 2.4, CENTER_Z);
  fireLight.visible = false;
  root.add(fireLight);

  const craftingBenchRoot = createCraftingBench(benchMaterials);
  craftingBenchRoot.position.set(CENTER_X - 7.8, GROUND_Y, CENTER_Z - 6.5);
  craftingBenchRoot.rotation.y = Math.PI * 0.18;
  root.add(craftingBenchRoot);
  const craftingBench: ChapterEightBench = {
    label: 'Crafting Bench',
    position: new Vector3(CENTER_X - 7.8, 1.05, CENTER_Z - 6.5),
    collider: addCollider(colliders, CENTER_X - 7.8, CENTER_Z - 6.5, 3.5, 1.8),
  };

  const grindingBenchRoot = createGrindingBench(benchMaterials);
  grindingBenchRoot.position.set(CENTER_X + 7.4, GROUND_Y, CENTER_Z - 6.0);
  grindingBenchRoot.rotation.y = -Math.PI * 0.18;
  root.add(grindingBenchRoot);
  const grindingBench: ChapterEightBench = {
    label: 'Grinding Bench',
    position: new Vector3(CENTER_X + 7.4, 1.2, CENTER_Z - 6.0),
    collider: addCollider(colliders, CENTER_X + 7.4, CENTER_Z - 6.0, 3.4, 1.8),
  };

  const spawn = new Vector3(CENTER_X, GAME_CONFIG.player.height, CENTER_Z + 13);
  const lookTarget = new Vector3(CENTER_X, 1.1, CENTER_Z);
  const firePitPosition = new Vector3(CENTER_X, GROUND_Y, CENTER_Z);
  let elapsed = 0;
  let fireLit = false;

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
    craftingBench,
    grindingBench,
    firePitPosition,
    trees,
    drops,
    isFireLit() {
      return fireLit;
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
      fireLit = true;
      fireLight.visible = true;
      flame.visible = true;
    },
    getSupportedFloorY(position) {
      const insideX = position.x >= CENTER_X - HALF_FOREST_SIZE && position.x <= CENTER_X + HALF_FOREST_SIZE;
      const insideZ = position.z >= CENTER_Z - HALF_FOREST_SIZE && position.z <= CENTER_Z + HALF_FOREST_SIZE;
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
      if (!flame.visible) {
        fireLight.intensity = 0;
        return;
      }
      const flicker = 0.82 + Math.sin(elapsed * 8.8) * 0.12 + Math.sin(elapsed * 19.5) * 0.06;
      fireLight.intensity = 1.65 + flicker * 0.45;
      flame.scale.set(0.92 + flicker * 0.08, 0.92 + flicker * 0.14, 0.92 + flicker * 0.08);
      flame.rotation.y += deltaSeconds * 0.35;
      flameMaterial.emissiveIntensity = 1.35 + flicker * 0.45;
      emberMaterial.emissiveIntensity = 0.72 + flicker * 0.32;
    },
    reset() {
      elapsed = 0;
      fireLit = false;
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
      fireLight.intensity = 0;
      fireLight.visible = false;
      flame.visible = false;
      flame.scale.setScalar(1);
      flame.rotation.set(0, 0, 0);
      root.visible = false;
    },
  };
}
