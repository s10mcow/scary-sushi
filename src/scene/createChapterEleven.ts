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

const FIELD_WIDTH = 600;
const FIELD_DEPTH = 600;
const FLOOR_Y = 0;

const grassMaterial = new MeshStandardMaterial({
  color: 0x4f963f,
  roughness: 0.94,
});

const dirtMaterial = new MeshStandardMaterial({
  color: 0x8b653d,
  roughness: 0.98,
});

export function createChapterEleven(): ChapterElevenData {
  const root = new Group();
  root.name = 'Chapter 11: Grow a garden';
  const colliders: CollisionBox[] = [];

  const grass = new Mesh(new BoxGeometry(FIELD_WIDTH, 0.12, FIELD_DEPTH), grassMaterial);
  grass.name = 'Chapter 11 open grass field';
  grass.position.set(0, -0.06, 0);
  grass.receiveShadow = true;
  root.add(grass);

  const dirtPatchGeometry = new BoxGeometry(5, 0.035, 10);
  for (let z = -180; z <= 220; z += 40) {
    const leftPatch = new Mesh(dirtPatchGeometry, dirtMaterial);
    leftPatch.name = 'Chapter 11 left dirt walking landmark';
    leftPatch.position.set(-24, 0.005, z);
    leftPatch.receiveShadow = true;
    const rightPatch = leftPatch.clone();
    rightPatch.name = 'Chapter 11 right dirt walking landmark';
    rightPatch.position.x = 24;
    root.add(leftPatch, rightPatch);
  }

  const spawn = new Vector3(0, GAME_CONFIG.player.height, 12);
  const lookTarget = new Vector3(0, GAME_CONFIG.player.height * 0.9, 0);

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    getSupportedFloorY(_position: Vector3): number | null {
      return FLOOR_Y + GAME_CONFIG.player.height;
    },
    update(_deltaSeconds: number, _playerPosition: Vector3): void {
      // Chapter 11 uses one fixed oversized field so grass never visibly generates around the player.
    },
    reset(): void {
      root.visible = false;
    },
  };
}
