import { BoxGeometry, Group, InstancedMesh, Matrix4 } from 'three';

import type { CollisionBox, WallDefinition } from '../types/world';
import type { LevelMaterials } from './materials';

interface WallResult {
  root: Group;
  colliders: CollisionBox[];
}

export function createWalls(
  walls: WallDefinition[],
  materials: LevelMaterials,
): WallResult {
  const root = new Group();
  const colliders: CollisionBox[] = [];
  const matrix = new Matrix4();
  const groupedWalls = new Map<string, WallDefinition[]>();

  walls.forEach((wall) => {
    const key = wall.size.join(':');
    const existing = groupedWalls.get(key);

    if (existing) {
      existing.push(wall);
    } else {
      groupedWalls.set(key, [wall]);
    }

    colliders.push({
      centerX: wall.position[0],
      centerZ: wall.position[2],
      halfWidth: wall.size[0] / 2,
      halfDepth: wall.size[2] / 2,
    });
  });

  groupedWalls.forEach((grouped, key) => {
    const [width, height, depth] = key.split(':').map(Number);
    const geometry = new BoxGeometry(width, height, depth);
    const mesh = new InstancedMesh(geometry, materials.wall, grouped.length);
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    grouped.forEach((wall, index) => {
      matrix.makeTranslation(wall.position[0], wall.position[1], wall.position[2]);
      mesh.setMatrixAt(index, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    root.add(mesh);
  });

  return { root, colliders };
}
