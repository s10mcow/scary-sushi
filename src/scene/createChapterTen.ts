import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';

import { GAME_CONFIG } from '../config/gameConfig';
import type { CollisionBox } from '../types/world';

export interface ChapterTenData {
  root: Group;
  colliders: CollisionBox[];
  spawn: Vector3;
  lookTarget: Vector3;
  getSupportedFloorY(position: Vector3): number | null;
  update(deltaSeconds: number): void;
  reset(): void;
}

const GROUND_SIZE_X = 58;
const GROUND_SIZE_Z = 50;
const HOUSE_WIDTH = 18;
const HOUSE_DEPTH = 14;
const WALL_HEIGHT = 4.2;
const WALL_THICKNESS = 0.42;
const DOOR_WIDTH = 3.2;
const FLOOR_Y = 0;

const grassMaterial = new MeshStandardMaterial({ color: 0x4f8d3b, roughness: 0.92 });
const groundEdgeMaterial = new MeshStandardMaterial({ color: 0x2f5f2f, roughness: 0.96 });
const floorMaterial = new MeshStandardMaterial({ color: 0x9a6a3b, roughness: 0.82 });
const wallMaterial = new MeshStandardMaterial({ color: 0xd8c8aa, roughness: 0.78 });
const trimMaterial = new MeshStandardMaterial({ color: 0x6e4a28, roughness: 0.68 });
const roofMaterial = new MeshStandardMaterial({ color: 0x4f2d25, roughness: 0.88 });
const porchMaterial = new MeshStandardMaterial({ color: 0x7a5130, roughness: 0.72 });
const studMaterial = new MeshStandardMaterial({ color: 0xb68b5d, roughness: 0.74 });

function addCollider(
  colliders: CollisionBox[],
  centerX: number,
  centerZ: number,
  halfWidth: number,
  halfDepth: number,
): CollisionBox {
  const collider = { centerX, centerZ, halfWidth, halfDepth };
  colliders.push(collider);
  return collider;
}

function addBox(
  root: Group,
  name: string,
  size: [number, number, number],
  position: [number, number, number],
  material: MeshStandardMaterial,
): Mesh {
  const mesh = new Mesh(new BoxGeometry(size[0], size[1], size[2]), material);
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

function addWallWithCollider(
  root: Group,
  colliders: CollisionBox[],
  name: string,
  size: [number, number, number],
  position: [number, number, number],
): void {
  addBox(root, name, size, position, wallMaterial);
  addCollider(colliders, position[0], position[2], size[0] / 2, size[2] / 2);
}

function addStuds(root: Group): void {
  const studHeight = WALL_HEIGHT - 0.28;
  const studY = studHeight / 2 + 0.14;
  const halfWidth = HOUSE_WIDTH / 2;
  const halfDepth = HOUSE_DEPTH / 2;

  for (let x = -7.5; x <= 7.5; x += 2.5) {
    addBox(root, 'Chapter 10 back wall exposed stud', [0.18, studHeight, 0.16], [x, studY, -halfDepth + 0.28], studMaterial);
  }

  for (let z = -5.4; z <= 5.4; z += 2.4) {
    addBox(root, 'Chapter 10 left wall exposed stud', [0.16, studHeight, 0.18], [-halfWidth + 0.28, studY, z], studMaterial);
    addBox(root, 'Chapter 10 right wall exposed stud', [0.16, studHeight, 0.18], [halfWidth - 0.28, studY, z], studMaterial);
  }

  [-7.3, -4.9, 4.9, 7.3].forEach((x) => {
    addBox(root, 'Chapter 10 front wall exposed stud', [0.18, studHeight, 0.16], [x, studY, halfDepth - 0.28], studMaterial);
  });
}

function addWindowFrame(root: Group, x: number, z: number, rotationY: number): void {
  const frame = new Group();
  frame.name = 'Chapter 10 house shell window frame';
  frame.position.set(x, 2.35, z);
  frame.rotation.y = rotationY;

  addBox(frame, 'Chapter 10 window top trim', [2.2, 0.16, 0.12], [0, 0.78, 0], trimMaterial);
  addBox(frame, 'Chapter 10 window bottom trim', [2.2, 0.16, 0.12], [0, -0.78, 0], trimMaterial);
  addBox(frame, 'Chapter 10 window left trim', [0.16, 1.72, 0.12], [-1.02, 0, 0], trimMaterial);
  addBox(frame, 'Chapter 10 window right trim', [0.16, 1.72, 0.12], [1.02, 0, 0], trimMaterial);
  addBox(frame, 'Chapter 10 window cross trim', [0.12, 1.54, 0.1], [0, 0, 0.01], trimMaterial);
  addBox(frame, 'Chapter 10 window cross trim', [1.88, 0.1, 0.1], [0, 0, 0.01], trimMaterial);

  root.add(frame);
}

export function createChapterTen(): ChapterTenData {
  const root = new Group();
  root.name = 'Chapter 10: House Shell';
  const colliders: CollisionBox[] = [];

  addBox(root, 'Chapter 10 small grass lot', [GROUND_SIZE_X, 0.12, GROUND_SIZE_Z], [0, -0.06, 0], grassMaterial);
  addBox(root, 'Chapter 10 house wood floor', [HOUSE_WIDTH - 0.3, 0.12, HOUSE_DEPTH - 0.3], [0, 0.02, 0], floorMaterial);

  const halfWidth = HOUSE_WIDTH / 2;
  const halfDepth = HOUSE_DEPTH / 2;
  const wallY = WALL_HEIGHT / 2;
  addWallWithCollider(root, colliders, 'Chapter 10 back house shell wall', [HOUSE_WIDTH, WALL_HEIGHT, WALL_THICKNESS], [0, wallY, -halfDepth]);
  addWallWithCollider(root, colliders, 'Chapter 10 left house shell wall', [WALL_THICKNESS, WALL_HEIGHT, HOUSE_DEPTH], [-halfWidth, wallY, 0]);
  addWallWithCollider(root, colliders, 'Chapter 10 right house shell wall', [WALL_THICKNESS, WALL_HEIGHT, HOUSE_DEPTH], [halfWidth, wallY, 0]);

  const frontSegmentWidth = (HOUSE_WIDTH - DOOR_WIDTH) / 2;
  addWallWithCollider(
    root,
    colliders,
    'Chapter 10 front left house shell wall',
    [frontSegmentWidth, WALL_HEIGHT, WALL_THICKNESS],
    [-(DOOR_WIDTH / 2 + frontSegmentWidth / 2), wallY, halfDepth],
  );
  addWallWithCollider(
    root,
    colliders,
    'Chapter 10 front right house shell wall',
    [frontSegmentWidth, WALL_HEIGHT, WALL_THICKNESS],
    [DOOR_WIDTH / 2 + frontSegmentWidth / 2, wallY, halfDepth],
  );
  addBox(root, 'Chapter 10 doorway header', [DOOR_WIDTH + 0.35, 0.42, WALL_THICKNESS + 0.05], [0, 3.85, halfDepth], trimMaterial);

  addStuds(root);
  addWindowFrame(root, -halfWidth - 0.02, -1.4, Math.PI / 2);
  addWindowFrame(root, halfWidth + 0.02, 1.6, -Math.PI / 2);
  addWindowFrame(root, -3.2, -halfDepth - 0.02, 0);

  const leftRoof = addBox(root, 'Chapter 10 left gable roof slab', [10.5, 0.34, HOUSE_DEPTH + 1.8], [-4.2, 4.72, 0], roofMaterial);
  leftRoof.rotation.z = 0.48;
  const rightRoof = addBox(root, 'Chapter 10 right gable roof slab', [10.5, 0.34, HOUSE_DEPTH + 1.8], [4.2, 4.72, 0], roofMaterial);
  rightRoof.rotation.z = -0.48;
  addBox(root, 'Chapter 10 roof ridge cap', [0.5, 0.38, HOUSE_DEPTH + 2], [0, 5.9, 0], roofMaterial);

  addBox(root, 'Chapter 10 front porch step', [5.6, 0.35, 2.2], [0, 0.17, halfDepth + 1.45], porchMaterial);
  addCollider(colliders, 0, halfDepth + 1.45, 2.8, 1.1);
  addBox(root, 'Chapter 10 porch left post', [0.24, 2.6, 0.24], [-2.5, 1.47, halfDepth + 2.25], trimMaterial);
  addBox(root, 'Chapter 10 porch right post', [0.24, 2.6, 0.24], [2.5, 1.47, halfDepth + 2.25], trimMaterial);
  addBox(root, 'Chapter 10 porch beam', [5.5, 0.24, 0.24], [0, 2.82, halfDepth + 2.25], trimMaterial);

  const stumpGeometry = new CylinderGeometry(0.42, 0.55, 0.55, 12);
  [-14, 14].forEach((x, index) => {
    const stump = new Mesh(stumpGeometry, groundEdgeMaterial);
    stump.name = `Chapter 10 yard stump ${index + 1}`;
    stump.position.set(x, 0.27, -15 + index * 7);
    stump.castShadow = true;
    stump.receiveShadow = true;
    root.add(stump);
    addCollider(colliders, stump.position.x, stump.position.z, 0.55, 0.55);
  });

  const boundaryThickness = 1;
  addCollider(colliders, 0, -GROUND_SIZE_Z / 2 - boundaryThickness / 2, GROUND_SIZE_X / 2, boundaryThickness / 2);
  addCollider(colliders, 0, GROUND_SIZE_Z / 2 + boundaryThickness / 2, GROUND_SIZE_X / 2, boundaryThickness / 2);
  addCollider(colliders, -GROUND_SIZE_X / 2 - boundaryThickness / 2, 0, boundaryThickness / 2, GROUND_SIZE_Z / 2);
  addCollider(colliders, GROUND_SIZE_X / 2 + boundaryThickness / 2, 0, boundaryThickness / 2, GROUND_SIZE_Z / 2);

  const spawn = new Vector3(0, GAME_CONFIG.player.height, halfDepth + 8.5);
  const lookTarget = new Vector3(0, 1.6, 0);

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    getSupportedFloorY(position: Vector3): number | null {
      if (
        position.x < -GROUND_SIZE_X / 2
        || position.x > GROUND_SIZE_X / 2
        || position.z < -GROUND_SIZE_Z / 2
        || position.z > GROUND_SIZE_Z / 2
      ) {
        return null;
      }

      return GAME_CONFIG.player.height + FLOOR_Y;
    },
    update(_deltaSeconds: number): void {
      // The first Chapter 10 pass is a static build shell for later map work.
    },
    reset(): void {
      root.visible = false;
    },
  };
}
