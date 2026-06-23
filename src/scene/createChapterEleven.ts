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
  update(deltaSeconds: number): void;
  reset(): void;
}

const FIELD_WIDTH = 120;
const FIELD_DEPTH = 100;
const FLOOR_Y = 0;

const grassMaterial = new MeshStandardMaterial({
  color: 0x4f963f,
  roughness: 0.94,
});

const edgeMaterial = new MeshStandardMaterial({
  color: 0x2f642b,
  roughness: 0.96,
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

  const edgeThickness = 1.2;
  const northEdge = new Mesh(new BoxGeometry(FIELD_WIDTH + edgeThickness * 2, 0.16, edgeThickness), edgeMaterial);
  northEdge.name = 'Chapter 11 far grass edge';
  northEdge.position.set(0, 0.02, -FIELD_DEPTH / 2 - edgeThickness / 2);
  const southEdge = northEdge.clone();
  southEdge.name = 'Chapter 11 near grass edge';
  southEdge.position.z = FIELD_DEPTH / 2 + edgeThickness / 2;
  const westEdge = new Mesh(new BoxGeometry(edgeThickness, 0.16, FIELD_DEPTH + edgeThickness * 2), edgeMaterial);
  westEdge.name = 'Chapter 11 left grass edge';
  westEdge.position.set(-FIELD_WIDTH / 2 - edgeThickness / 2, 0.02, 0);
  const eastEdge = westEdge.clone();
  eastEdge.name = 'Chapter 11 right grass edge';
  eastEdge.position.x = FIELD_WIDTH / 2 + edgeThickness / 2;
  root.add(northEdge, southEdge, westEdge, eastEdge);

  addCollider(colliders, 0, -FIELD_DEPTH / 2 - edgeThickness / 2, FIELD_WIDTH / 2 + edgeThickness, edgeThickness / 2);
  addCollider(colliders, 0, FIELD_DEPTH / 2 + edgeThickness / 2, FIELD_WIDTH / 2 + edgeThickness, edgeThickness / 2);
  addCollider(colliders, -FIELD_WIDTH / 2 - edgeThickness / 2, 0, edgeThickness / 2, FIELD_DEPTH / 2 + edgeThickness);
  addCollider(colliders, FIELD_WIDTH / 2 + edgeThickness / 2, 0, edgeThickness / 2, FIELD_DEPTH / 2 + edgeThickness);

  const spawn = new Vector3(0, GAME_CONFIG.player.height, FIELD_DEPTH / 2 - 12);
  const lookTarget = new Vector3(0, GAME_CONFIG.player.height * 0.9, 0);

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    getSupportedFloorY(position: Vector3): number | null {
      const insideField = Math.abs(position.x) <= FIELD_WIDTH / 2
        && Math.abs(position.z) <= FIELD_DEPTH / 2;
      return insideField ? FLOOR_Y + GAME_CONFIG.player.height : null;
    },
    update(_deltaSeconds: number): void {
      // Empty field for now.
    },
    reset(): void {
      root.visible = false;
    },
  };
}
