import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
} from 'three';

import { GAME_CONFIG } from '../config/gameConfig';
import type { CollisionBox } from '../types/world';

export interface ChapterThirteenData {
  root: Group;
  colliders: CollisionBox[];
  spawn: Vector3;
  lookTarget: Vector3;
  update(playerPosition: Vector3): void;
  reset(): void;
  getSupportedFloorY(playerPosition: Vector3): number;
}

const CHUNK_SIZE = 96;
const CHUNK_VIEW_RADIUS = 2;
const TREE_SPACING = 16;
const TREE_SKIP_CHANCE = 0.18;

const grassMaterial = new MeshStandardMaterial({ color: 0xf3a1ca, roughness: 0.92 });
const grassPatchMaterial = new MeshStandardMaterial({ color: 0xf8bad7, roughness: 0.96 });
const barkMaterial = new MeshStandardMaterial({ color: 0x7a4b37, roughness: 0.82 });
const blossomMaterial = new MeshStandardMaterial({ color: 0xffb6d8, roughness: 0.84 });
const paleBlossomMaterial = new MeshStandardMaterial({ color: 0xffd9e9, roughness: 0.86 });
const darkBlossomMaterial = new MeshStandardMaterial({ color: 0xec82bd, roughness: 0.88 });

function hash2d(x: number, z: number, salt = 0): number {
  const value = Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453123;
  return value - Math.floor(value);
}

function chunkKey(chunkX: number, chunkZ: number): string {
  return `${chunkX},${chunkZ}`;
}

function createInstancedMesh(geometry: BoxGeometry | CylinderGeometry | SphereGeometry, material: MeshStandardMaterial, count: number): InstancedMesh {
  const mesh = new InstancedMesh(geometry, material, Math.max(1, count));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function setInstance(mesh: InstancedMesh, index: number, x: number, y: number, z: number, scaleX: number, scaleY: number, scaleZ: number): void {
  const dummy = new Object3D();
  dummy.position.set(x, y, z);
  dummy.scale.set(scaleX, scaleY, scaleZ);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
}

function createGroundPatch(localX: number, localZ: number, width: number, depth: number): Mesh {
  const patch = new Mesh(new BoxGeometry(width, 0.012, depth), grassPatchMaterial);
  patch.name = 'Chapter 13 lighter pink grass patch';
  patch.position.set(localX, 0.012, localZ);
  patch.receiveShadow = true;
  return patch;
}

function createChunk(chunkX: number, chunkZ: number): Group {
  const chunk = new Group();
  chunk.name = `Maggie's World chunk ${chunkX},${chunkZ}`;
  const originX = chunkX * CHUNK_SIZE;
  const originZ = chunkZ * CHUNK_SIZE;
  chunk.position.set(originX, 0, originZ);

  const ground = new Mesh(new BoxGeometry(CHUNK_SIZE, 0.08, CHUNK_SIZE), grassMaterial);
  ground.name = "Maggie's World endless pink grass";
  ground.position.set(CHUNK_SIZE / 2, -0.04, CHUNK_SIZE / 2);
  ground.receiveShadow = true;
  chunk.add(ground);

  for (let index = 0; index < 5; index += 1) {
    const patchX = hash2d(chunkX, chunkZ, 10 + index) * CHUNK_SIZE;
    const patchZ = hash2d(chunkX, chunkZ, 20 + index) * CHUNK_SIZE;
    const width = 10 + hash2d(chunkX, chunkZ, 30 + index) * 16;
    const depth = 7 + hash2d(chunkX, chunkZ, 40 + index) * 12;
    chunk.add(createGroundPatch(patchX, patchZ, width, depth));
  }

  const treePositions: Array<{ x: number; z: number; scale: number }> = [];
  const cells = Math.floor(CHUNK_SIZE / TREE_SPACING);
  for (let gridX = 0; gridX < cells; gridX += 1) {
    for (let gridZ = 0; gridZ < cells; gridZ += 1) {
      if (hash2d(chunkX * 31 + gridX, chunkZ * 31 + gridZ, 1) < TREE_SKIP_CHANCE) {
        continue;
      }
      const jitterX = (hash2d(chunkX * 17 + gridX, chunkZ * 17 + gridZ, 2) - 0.5) * 7.5;
      const jitterZ = (hash2d(chunkX * 19 + gridX, chunkZ * 19 + gridZ, 3) - 0.5) * 7.5;
      const x = gridX * TREE_SPACING + TREE_SPACING / 2 + jitterX;
      const z = gridZ * TREE_SPACING + TREE_SPACING / 2 + jitterZ;
      const worldX = originX + x;
      const worldZ = originZ + z;
      if (Math.hypot(worldX, worldZ) < 12) {
        continue;
      }
      treePositions.push({
        x,
        z,
        scale: 0.82 + hash2d(chunkX * 23 + gridX, chunkZ * 23 + gridZ, 4) * 0.48,
      });
    }
  }

  const trunkGeometry = new CylinderGeometry(0.16, 0.28, 3.4, 9);
  const canopyGeometry = new SphereGeometry(1, 12, 8);
  const blossomGeometry = new SphereGeometry(1, 10, 7);
  const trunkMesh = createInstancedMesh(trunkGeometry, barkMaterial, treePositions.length);
  const canopyMesh = createInstancedMesh(canopyGeometry, blossomMaterial, treePositions.length);
  const paleMesh = createInstancedMesh(blossomGeometry, paleBlossomMaterial, treePositions.length);
  const darkMesh = createInstancedMesh(blossomGeometry, darkBlossomMaterial, treePositions.length);

  treePositions.forEach((tree, index) => {
    setInstance(trunkMesh, index, tree.x, 1.7 * tree.scale, tree.z, tree.scale, tree.scale, tree.scale);
    setInstance(canopyMesh, index, tree.x, 3.8 * tree.scale, tree.z, 1.75 * tree.scale, 1.25 * tree.scale, 1.75 * tree.scale);
    setInstance(paleMesh, index, tree.x - 0.85 * tree.scale, 3.55 * tree.scale, tree.z + 0.55 * tree.scale, 0.9 * tree.scale, 0.72 * tree.scale, 0.9 * tree.scale);
    setInstance(darkMesh, index, tree.x + 0.72 * tree.scale, 3.75 * tree.scale, tree.z - 0.68 * tree.scale, 0.78 * tree.scale, 0.66 * tree.scale, 0.78 * tree.scale);
  });

  trunkMesh.instanceMatrix.needsUpdate = true;
  canopyMesh.instanceMatrix.needsUpdate = true;
  paleMesh.instanceMatrix.needsUpdate = true;
  darkMesh.instanceMatrix.needsUpdate = true;
  trunkMesh.name = 'Maggies World cherry blossom trunks';
  canopyMesh.name = 'Maggies World cherry blossom pink crowns';
  paleMesh.name = 'Maggies World pale blossom clumps';
  darkMesh.name = 'Maggies World darker blossom clumps';
  chunk.add(trunkMesh, canopyMesh, paleMesh, darkMesh);

  return chunk;
}

export function createChapterThirteen(): ChapterThirteenData {
  const root = new Group();
  root.name = "Chapter 13: Maggie's World";
  const chunkRoot = new Group();
  chunkRoot.name = "Maggie's World endless generated chunks";
  root.add(chunkRoot);

  const chunks = new Map<string, Group>();
  const colliders: CollisionBox[] = [];
  const spawn = new Vector3(0, GAME_CONFIG.player.height, 0);
  const lookTarget = new Vector3(0, GAME_CONFIG.player.height, -18);

  const ensureChunks = (playerPosition: Vector3): void => {
    const centerX = Math.floor(playerPosition.x / CHUNK_SIZE);
    const centerZ = Math.floor(playerPosition.z / CHUNK_SIZE);
    const wanted = new Set<string>();
    for (let x = centerX - CHUNK_VIEW_RADIUS; x <= centerX + CHUNK_VIEW_RADIUS; x += 1) {
      for (let z = centerZ - CHUNK_VIEW_RADIUS; z <= centerZ + CHUNK_VIEW_RADIUS; z += 1) {
        const key = chunkKey(x, z);
        wanted.add(key);
        if (!chunks.has(key)) {
          const chunk = createChunk(x, z);
          chunks.set(key, chunk);
          chunkRoot.add(chunk);
        }
      }
    }

    chunks.forEach((chunk, key) => {
      if (!wanted.has(key)) {
        chunkRoot.remove(chunk);
        chunks.delete(key);
      }
    });
  };

  ensureChunks(spawn);

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    update(playerPosition: Vector3): void {
      ensureChunks(playerPosition);
    },
    reset(): void {
      ensureChunks(spawn);
    },
    getSupportedFloorY(): number {
      return GAME_CONFIG.player.height;
    },
  };
}
