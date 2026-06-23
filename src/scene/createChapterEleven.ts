import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';

import { GAME_CONFIG } from '../config/gameConfig';
import type { CollisionBox } from '../types/world';

export interface ChapterElevenData {
  root: Group;
  colliders: CollisionBox[];
  spawn: Vector3;
  lookTarget: Vector3;
  getSupportedFloorY(position: Vector3): number | null;
  update(deltaSeconds: number, playerPosition: Vector3): void;
  reset(): void;
}

const FIELD_WIDTH = 120;
const FIELD_DEPTH = 120;
const FLOOR_Y = 0;

const grassMaterial = new MeshStandardMaterial({
  color: 0x4f963f,
  roughness: 0.94,
});

const fenceMaterial = new MeshStandardMaterial({
  color: 0xd8c28d,
  roughness: 0.82,
});

function addCollider(
  colliders: CollisionBox[],
  centerX: number,
  centerZ: number,
  halfWidth: number,
  halfDepth: number,
): void {
  colliders.push({ centerX, centerZ, halfWidth, halfDepth });
}

export function createChapterEleven(): ChapterElevenData {
  const root = new Group();
  root.name = 'Chapter 11: Grow a garden';
  const colliders: CollisionBox[] = [];

  const grass = new Mesh(new BoxGeometry(FIELD_WIDTH, 0.12, FIELD_DEPTH), grassMaterial);
  grass.name = 'Chapter 11 open grass field';
  grass.position.set(0, -0.06, 0);
  grass.receiveShadow = true;
  root.add(grass);

  const fenceHeight = 1.25;
  const fenceThickness = 0.22;
  const halfWidth = FIELD_WIDTH / 2;
  const halfDepth = FIELD_DEPTH / 2;

  const northFence = new Mesh(new BoxGeometry(FIELD_WIDTH + fenceThickness * 2, fenceHeight, fenceThickness), fenceMaterial);
  northFence.name = 'Chapter 11 north border fence';
  northFence.position.set(0, fenceHeight / 2, -halfDepth);
  const southFence = northFence.clone();
  southFence.name = 'Chapter 11 south border fence';
  southFence.position.z = halfDepth;
  const westFence = new Mesh(new BoxGeometry(fenceThickness, fenceHeight, FIELD_DEPTH + fenceThickness * 2), fenceMaterial);
  westFence.name = 'Chapter 11 west border fence';
  westFence.position.set(-halfWidth, fenceHeight / 2, 0);
  const eastFence = westFence.clone();
  eastFence.name = 'Chapter 11 east border fence';
  eastFence.position.x = halfWidth;
  root.add(northFence, southFence, westFence, eastFence);

  const postGeometry = new BoxGeometry(0.32, 1.55, 0.32);
  for (let i = -halfWidth; i <= halfWidth + 0.001; i += 2.5) {
    const northPost = new Mesh(postGeometry, fenceMaterial);
    northPost.name = 'Chapter 11 fence post';
    northPost.position.set(i, 0.775, -halfDepth);
    const southPost = northPost.clone();
    southPost.position.z = halfDepth;
    root.add(northPost, southPost);
  }
  for (let i = -halfDepth + 2.5; i <= halfDepth - 2.5 + 0.001; i += 2.5) {
    const westPost = new Mesh(postGeometry, fenceMaterial);
    westPost.name = 'Chapter 11 fence side post';
    westPost.position.set(-halfWidth, 0.775, i);
    const eastPost = westPost.clone();
    eastPost.position.x = halfWidth;
    root.add(westPost, eastPost);
  }

  addCollider(colliders, 0, -halfDepth, halfWidth + fenceThickness, fenceThickness);
  addCollider(colliders, 0, halfDepth, halfWidth + fenceThickness, fenceThickness);
  addCollider(colliders, -halfWidth, 0, fenceThickness, halfDepth + fenceThickness);
  addCollider(colliders, halfWidth, 0, fenceThickness, halfDepth + fenceThickness);

  const spawn = new Vector3(0, GAME_CONFIG.player.height, 0);
  const lookTarget = new Vector3(0, GAME_CONFIG.player.height * 0.9, -4);

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    getSupportedFloorY(_position: Vector3): number | null {
      return FLOOR_Y + GAME_CONFIG.player.height;
    },
    update(_deltaSeconds: number, _playerPosition: Vector3): void {
      // Empty garden plot for now.
    },
    reset(): void {
      root.visible = false;
    },
  };
}
