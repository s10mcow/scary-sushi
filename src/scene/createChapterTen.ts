import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  Shape,
  ShapeGeometry,
  TorusGeometry,
  Vector3,
} from 'three';

import { GAME_CONFIG } from '../config/gameConfig';
import type { CollisionBox } from '../types/world';

export interface ChapterTenData {
  root: Group;
  colliders: CollisionBox[];
  spawn: Vector3;
  lookTarget: Vector3;
  toggleLamp(position: Vector3): { message: string; on: boolean } | null;
  getLampPrompt(position: Vector3): string | null;
  getSupportedFloorY(position: Vector3): number | null;
  update(deltaSeconds: number): void;
  reset(): void;
}

const GROUND_SIZE_X = 58;
const GROUND_SIZE_Z = 50;
const HOUSE_WIDTH = 18;
const HOUSE_DEPTH = 14;
const WALL_HEIGHT = 3.35;
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
const stoneMaterial = new MeshStandardMaterial({ color: 0x69615a, roughness: 0.9 });
const fireboxMaterial = new MeshStandardMaterial({ color: 0x080706, roughness: 0.96 });
const emberMaterial = new MeshStandardMaterial({ color: 0xff7a22, emissive: 0xff4a10, emissiveIntensity: 0.8, roughness: 0.45 });
const coalMaterial = new MeshStandardMaterial({ color: 0x16100c, emissive: 0x551400, emissiveIntensity: 0.35, roughness: 0.72 });
const flameOuterMaterial = new MeshStandardMaterial({
  color: 0xff7b18,
  emissive: 0xff4f08,
  emissiveIntensity: 1.8,
  transparent: true,
  opacity: 0.72,
  side: DoubleSide,
  roughness: 0.25,
});
const flameMiddleMaterial = new MeshStandardMaterial({
  color: 0xffcf4d,
  emissive: 0xffa21a,
  emissiveIntensity: 2.1,
  transparent: true,
  opacity: 0.78,
  side: DoubleSide,
  roughness: 0.2,
});
const flameCoreMaterial = new MeshStandardMaterial({
  color: 0xfff3a7,
  emissive: 0xffd66b,
  emissiveIntensity: 2.4,
  transparent: true,
  opacity: 0.84,
  side: DoubleSide,
  roughness: 0.18,
});
const mattressMaterial = new MeshStandardMaterial({ color: 0xd8d5c8, roughness: 0.76 });
const blanketMaterial = new MeshStandardMaterial({ color: 0x526a86, roughness: 0.82 });
const pillowMaterial = new MeshStandardMaterial({ color: 0xf1eee4, roughness: 0.7 });
const tableMaterial = new MeshStandardMaterial({ color: 0x7b5130, roughness: 0.74 });
const chairMaterial = new MeshStandardMaterial({ color: 0x6d4627, roughness: 0.78 });
const drawerMaterial = new MeshStandardMaterial({ color: 0x9b6539, roughness: 0.78 });
const drawerInsideMaterial = new MeshStandardMaterial({ color: 0x3d2416, roughness: 0.86 });
const metalMaterial = new MeshStandardMaterial({ color: 0xb9bdc2, metalness: 0.45, roughness: 0.38 });
const lighterMaterial = new MeshStandardMaterial({ color: 0xcc2323, roughness: 0.42 });
const brassMaterial = new MeshStandardMaterial({ color: 0xc8952d, metalness: 0.42, roughness: 0.34 });
const porcelainMaterial = new MeshStandardMaterial({ color: 0xe8e2d7, roughness: 0.48 });
const applianceMaterial = new MeshStandardMaterial({ color: 0xd5d9dc, metalness: 0.1, roughness: 0.42 });
const darkGlassMaterial = new MeshStandardMaterial({ color: 0x1b1a18, metalness: 0.05, roughness: 0.35 });

interface ChapterTenLamp {
  interactPosition: Vector3;
  light: PointLight;
  bulbMaterial: MeshStandardMaterial;
  shadeMaterial: MeshStandardMaterial;
  on: boolean;
}

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

function addGableWall(root: Group, name: string, z: number, rotationY: number): void {
  const shape = new Shape();
  shape.moveTo(-HOUSE_WIDTH / 2, 0);
  shape.lineTo(HOUSE_WIDTH / 2, 0);
  shape.lineTo(0, 1.95);
  shape.lineTo(-HOUSE_WIDTH / 2, 0);

  const mesh = new Mesh(new ShapeGeometry(shape), wallMaterial);
  mesh.name = name;
  mesh.position.set(0, WALL_HEIGHT, z);
  mesh.rotation.y = rotationY;
  mesh.material.side = DoubleSide;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
}

function addOpenFrontDoor(root: Group, halfDepth: number): void {
  const door = new Group();
  door.name = 'Chapter 10 open front door';
  door.position.set(-DOOR_WIDTH / 2 + 0.08, 0, halfDepth + 0.05);
  door.rotation.y = -Math.PI / 2.8;

  addBox(door, 'Chapter 10 front door panel', [1.48, 2.72, 0.14], [0.74, 1.36, 0], trimMaterial);
  addBox(door, 'Chapter 10 front door inset panel', [1.04, 1.78, 0.05], [0.74, 1.36, -0.08], wallMaterial);
  addBox(door, 'Chapter 10 front door knob', [0.14, 0.14, 0.16], [1.25, 1.25, -0.15], roofMaterial);

  root.add(door);
}

function createFlameMesh(
  name: string,
  width: number,
  height: number,
  material: MeshStandardMaterial,
  position: [number, number, number],
  rotationY: number,
): Mesh {
  const shape = new Shape();
  shape.moveTo(-width / 2, 0);
  shape.quadraticCurveTo(-width * 0.46, height * 0.42, -width * 0.14, height * 0.7);
  shape.quadraticCurveTo(0, height, width * 0.14, height * 0.7);
  shape.quadraticCurveTo(width * 0.46, height * 0.42, width / 2, 0);
  shape.quadraticCurveTo(0, height * 0.12, -width / 2, 0);

  const mesh = new Mesh(new ShapeGeometry(shape), material);
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.y = rotationY;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

function addFireplace(root: Group, colliders: CollisionBox[], z: number): void {
  const fireplace = new Group();
  fireplace.name = 'Chapter 10 stone fireplace with recessed opening';
  fireplace.position.set(0, 0, z);

  addBox(fireplace, 'Chapter 10 fireplace left stone side', [0.46, 2.45, 0.55], [-1.34, 1.22, 0], stoneMaterial);
  addBox(fireplace, 'Chapter 10 fireplace right stone side', [0.46, 2.45, 0.55], [1.34, 1.22, 0], stoneMaterial);
  addBox(fireplace, 'Chapter 10 fireplace top stone lintel', [3.12, 0.46, 0.58], [0, 2.22, 0], stoneMaterial);
  addBox(fireplace, 'Chapter 10 fireplace raised hearth', [3.45, 0.28, 1.05], [0, 0.14, 0.28], stoneMaterial);
  addBox(fireplace, 'Chapter 10 fireplace dark recessed firebox', [1.92, 1.38, 0.12], [0, 1.02, -0.29], fireboxMaterial);
  addBox(fireplace, 'Chapter 10 fireplace back shadow wall', [1.62, 1.1, 0.18], [0, 0.92, -0.42], fireboxMaterial);
  addBox(fireplace, 'Chapter 10 fireplace log left', [0.9, 0.16, 0.22], [-0.24, 0.42, -0.02], trimMaterial).rotation.z = 0.18;
  addBox(fireplace, 'Chapter 10 fireplace log right', [0.9, 0.16, 0.22], [0.24, 0.42, -0.02], trimMaterial).rotation.z = -0.18;
  addBox(fireplace, 'Chapter 10 glowing ember bed', [1.18, 0.12, 0.46], [0, 0.42, -0.08], emberMaterial);
  addBox(fireplace, 'Chapter 10 charred coal left', [0.28, 0.16, 0.24], [-0.42, 0.53, -0.04], coalMaterial).rotation.z = -0.32;
  addBox(fireplace, 'Chapter 10 charred coal center', [0.34, 0.17, 0.25], [0.02, 0.55, -0.02], coalMaterial).rotation.z = 0.2;
  addBox(fireplace, 'Chapter 10 charred coal right', [0.24, 0.14, 0.22], [0.43, 0.51, -0.08], coalMaterial).rotation.z = 0.38;
  fireplace.add(createFlameMesh('Chapter 10 fireplace outer flame sheet', 0.82, 1.14, flameOuterMaterial, [0, 0.48, 0.04], 0));
  fireplace.add(createFlameMesh('Chapter 10 fireplace outer flame cross sheet', 0.78, 1.02, flameOuterMaterial, [0.06, 0.5, -0.02], Math.PI / 2));
  fireplace.add(createFlameMesh('Chapter 10 fireplace orange flame tongue left', 0.42, 0.86, flameMiddleMaterial, [-0.24, 0.52, 0.02], -0.38));
  fireplace.add(createFlameMesh('Chapter 10 fireplace orange flame tongue right', 0.44, 0.92, flameMiddleMaterial, [0.24, 0.5, -0.02], 0.44));
  fireplace.add(createFlameMesh('Chapter 10 fireplace bright inner flame', 0.34, 0.76, flameCoreMaterial, [0, 0.56, 0.08], 0.16));
  fireplace.add(createFlameMesh('Chapter 10 fireplace bright inner cross flame', 0.28, 0.66, flameCoreMaterial, [0.08, 0.57, -0.04], Math.PI / 2.2));
  const fireLight = new PointLight(0xff8a24, 2.6, 9.5, 1.8);
  fireLight.name = 'Chapter 10 realistic fireplace glow';
  fireLight.position.set(0, 1.1, 0.35);
  fireplace.add(fireLight);
  addBox(fireplace, 'Chapter 10 short chimney inside shell', [1.25, 1.35, 0.42], [0, 3.05, -0.06], stoneMaterial);

  root.add(fireplace);
  addCollider(colliders, 0, z + 0.12, 1.82, 0.62);
}

function addCornerDrawer(root: Group, colliders: CollisionBox[]): void {
  const drawer = new Group();
  drawer.name = 'Chapter 10 back right corner drawer with lighter car key and hoe';
  drawer.position.set(6.92, 0, -5.45);
  drawer.rotation.y = -Math.PI / 2;

  addBox(drawer, 'Chapter 10 drawer cabinet body', [2.0, 1.62, 1.1], [0, 0.81, 0], drawerMaterial);
  addBox(drawer, 'Chapter 10 drawer dark open cavity', [1.62, 0.44, 0.12], [0, 1.18, -0.57], drawerInsideMaterial);
  addBox(drawer, 'Chapter 10 drawer open box bottom', [1.62, 0.08, 0.86], [0, 0.9, -0.98], drawerInsideMaterial);
  addBox(drawer, 'Chapter 10 drawer open box front', [1.74, 0.45, 0.12], [0, 1.03, -1.4], drawerMaterial);
  addBox(drawer, 'Chapter 10 drawer brass handle', [0.52, 0.08, 0.08], [0, 1.05, -1.48], brassMaterial);
  addBox(drawer, 'Chapter 10 lower drawer seam', [1.72, 0.05, 0.05], [0, 0.58, -0.58], trimMaterial);
  addBox(drawer, 'Chapter 10 lower drawer knob', [0.16, 0.16, 0.08], [0, 0.58, -0.66], brassMaterial);

  addBox(drawer, 'Chapter 10 red lighter body in drawer', [0.18, 0.14, 0.5], [-0.52, 1.12, -1.12], lighterMaterial);
  addBox(drawer, 'Chapter 10 lighter metal top in drawer', [0.18, 0.16, 0.16], [-0.52, 1.2, -0.82], metalMaterial);

  const keyRing = new Mesh(new TorusGeometry(0.12, 0.018, 8, 18), brassMaterial);
  keyRing.name = 'Chapter 10 car key ring in drawer';
  keyRing.position.set(0.04, 1.16, -1.12);
  keyRing.rotation.x = Math.PI / 2;
  keyRing.castShadow = true;
  drawer.add(keyRing);
  addBox(drawer, 'Chapter 10 car key blade in drawer', [0.1, 0.04, 0.45], [0.2, 1.15, -1.08], metalMaterial).rotation.y = -0.32;
  addBox(drawer, 'Chapter 10 car key black fob in drawer', [0.26, 0.08, 0.22], [-0.12, 1.15, -1.02], roofMaterial).rotation.y = 0.28;

  const hoe = new Group();
  hoe.name = 'Chapter 10 small hoe in drawer';
  hoe.position.set(0.55, 1.2, -1.11);
  hoe.rotation.y = 0.82;
  const hoeHandle = new Mesh(new CylinderGeometry(0.035, 0.035, 0.98, 10), trimMaterial);
  hoeHandle.name = 'Chapter 10 hoe wooden handle in drawer';
  hoeHandle.rotation.z = Math.PI / 2;
  hoeHandle.castShadow = true;
  hoe.add(hoeHandle);
  addBox(hoe, 'Chapter 10 hoe metal neck in drawer', [0.08, 0.08, 0.18], [0.52, 0, 0], metalMaterial);
  const hoeBlade = new Mesh(new ConeGeometry(0.18, 0.34, 4), metalMaterial);
  hoeBlade.name = 'Chapter 10 hoe flat metal blade in drawer';
  hoeBlade.position.set(0.66, 0, 0);
  hoeBlade.rotation.z = Math.PI / 2;
  hoeBlade.scale.z = 0.26;
  hoeBlade.castShadow = true;
  hoe.add(hoeBlade);
  drawer.add(hoe);

  root.add(drawer);
  addCollider(colliders, 6.92, -5.45, 0.72, 1.1);
}

function addBed(root: Group, colliders: CollisionBox[]): void {
  addBox(root, 'Chapter 10 right wall bed frame', [2.7, 0.42, 5.05], [6.62, 0.36, -0.55], tableMaterial);
  addBox(root, 'Chapter 10 right wall mattress', [2.44, 0.34, 4.72], [6.62, 0.75, -0.55], mattressMaterial);
  addBox(root, 'Chapter 10 right wall folded blanket', [2.48, 0.18, 2.55], [6.62, 1.02, 0.48], blanketMaterial);
  addBox(root, 'Chapter 10 right wall pillow', [2.1, 0.24, 0.72], [6.62, 1.03, -2.58], pillowMaterial);
  addBox(root, 'Chapter 10 bed front legs', [2.66, 0.5, 0.16], [6.62, 0.25, 1.95], trimMaterial);
  addBox(root, 'Chapter 10 bed back legs', [2.66, 0.5, 0.16], [6.62, 0.25, -3.05], trimMaterial);
  addCollider(colliders, 6.62, -0.55, 1.42, 2.65);
}

function addTableAndChair(root: Group, colliders: CollisionBox[]): void {
  addBox(root, 'Chapter 10 moved left wall table top', [1.16, 0.24, 3.24], [-7.62, 1.02, -1.25], tableMaterial);
  addBox(root, 'Chapter 10 moved table front left leg', [0.16, 0.92, 0.16], [-8.05, 0.48, 0.16], tableMaterial);
  addBox(root, 'Chapter 10 moved table front right leg', [0.16, 0.92, 0.16], [-7.19, 0.48, 0.16], tableMaterial);
  addBox(root, 'Chapter 10 moved table back left leg', [0.16, 0.92, 0.16], [-8.05, 0.48, -2.66], tableMaterial);
  addBox(root, 'Chapter 10 moved table back right leg', [0.16, 0.92, 0.16], [-7.19, 0.48, -2.66], tableMaterial);
  addCollider(colliders, -7.62, -1.25, 0.68, 1.72);

  addBox(root, 'Chapter 10 left table chair seat', [1.08, 0.22, 1.08], [-6.12, 0.66, -1.25], chairMaterial);
  addBox(root, 'Chapter 10 left table chair back', [0.2, 1.42, 1.08], [-5.56, 1.24, -1.25], chairMaterial);
  addBox(root, 'Chapter 10 left table chair front left leg', [0.14, 0.68, 0.14], [-6.48, 0.34, -0.84], chairMaterial);
  addBox(root, 'Chapter 10 left table chair front right leg', [0.14, 0.68, 0.14], [-6.48, 0.34, -1.66], chairMaterial);
  addBox(root, 'Chapter 10 left table chair back left leg', [0.14, 0.68, 0.14], [-5.76, 0.34, -0.84], chairMaterial);
  addBox(root, 'Chapter 10 left table chair back right leg', [0.14, 0.68, 0.14], [-5.76, 0.34, -1.66], chairMaterial);
  addCollider(colliders, -6.12, -1.25, 0.68, 0.68);
}

function addCounterSinkOvenAndWasher(root: Group, colliders: CollisionBox[]): void {
  const sinkCounter = new Group();
  sinkCounter.name = 'Chapter 10 left wall sink countertop';
  sinkCounter.position.set(-8.18, 0, -5.41);
  addBox(sinkCounter, 'Chapter 10 sink counter base', [1.18, 1.08, 1.88], [0, 0.54, 0], drawerMaterial);
  addBox(sinkCounter, 'Chapter 10 sink counter top slab', [1.26, 0.16, 1.98], [0, 1.16, 0], tableMaterial);
  addBox(sinkCounter, 'Chapter 10 inset sink bowl', [0.72, 0.16, 0.82], [0.06, 1.27, -0.1], porcelainMaterial);
  const faucet = new Mesh(new TorusGeometry(0.22, 0.035, 8, 18), metalMaterial);
  faucet.name = 'Chapter 10 curved sink faucet';
  faucet.position.set(0.2, 1.48, -0.48);
  faucet.rotation.x = Math.PI / 2;
  faucet.rotation.z = Math.PI / 2;
  faucet.scale.y = 0.65;
  faucet.castShadow = true;
  sinkCounter.add(faucet);
  root.add(sinkCounter);
  addCollider(colliders, -8.18, -5.41, 0.7, 1.06);

  const oven = new Group();
  oven.name = 'Chapter 10 left wall oven';
  oven.position.set(-8.18, 0, -2.98);
  addBox(oven, 'Chapter 10 oven body', [1.18, 1.32, 1.5], [0, 0.66, 0], applianceMaterial);
  addBox(oven, 'Chapter 10 oven black glass door', [0.08, 0.7, 0.98], [0.62, 0.66, 0], darkGlassMaterial);
  addBox(oven, 'Chapter 10 oven handle', [0.08, 0.08, 1.1], [0.68, 1.08, 0], metalMaterial);
  addBox(oven, 'Chapter 10 oven top burners left', [0.06, 0.06, 0.42], [0, 1.36, -0.36], fireboxMaterial);
  addBox(oven, 'Chapter 10 oven top burners right', [0.06, 0.06, 0.42], [0, 1.36, 0.36], fireboxMaterial);
  root.add(oven);
  addCollider(colliders, -8.18, -2.98, 0.7, 0.85);

  const washer = new Group();
  washer.name = 'Chapter 10 front right washing machine';
  washer.position.set(6.8, 0, 5.92);
  addBox(washer, 'Chapter 10 washing machine body', [1.52, 1.42, 1.18], [0, 0.71, 0], applianceMaterial);
  const washerDoor = new Mesh(new CylinderGeometry(0.36, 0.36, 0.08, 24), darkGlassMaterial);
  washerDoor.name = 'Chapter 10 washing machine round door';
  washerDoor.position.set(0, 0.78, -0.62);
  washerDoor.rotation.x = Math.PI / 2;
  washerDoor.castShadow = true;
  washer.add(washerDoor);
  addBox(washer, 'Chapter 10 washing machine top controls', [1.18, 0.16, 0.16], [0, 1.28, -0.64], metalMaterial);
  root.add(washer);
  addCollider(colliders, 6.8, 5.92, 0.86, 0.7);
}

function setLampState(lamp: ChapterTenLamp, on: boolean): void {
  lamp.on = on;
  lamp.light.visible = on;
  lamp.bulbMaterial.emissiveIntensity = on ? 1.9 : 0.08;
  lamp.shadeMaterial.emissiveIntensity = on ? 0.35 : 0;
}

function addLampTable(root: Group, colliders: CollisionBox[]): ChapterTenLamp {
  const group = new Group();
  group.name = 'Chapter 10 bottom left lamp table';
  group.position.set(-7.28, 0, 5.15);

  addBox(group, 'Chapter 10 bottom left lamp table top', [1.48, 0.2, 1.2], [0, 0.78, 0], tableMaterial);
  addBox(group, 'Chapter 10 bottom left lamp table leg front left', [0.14, 0.72, 0.14], [-0.52, 0.36, 0.42], tableMaterial);
  addBox(group, 'Chapter 10 bottom left lamp table leg front right', [0.14, 0.72, 0.14], [0.52, 0.36, 0.42], tableMaterial);
  addBox(group, 'Chapter 10 bottom left lamp table leg back left', [0.14, 0.72, 0.14], [-0.52, 0.36, -0.42], tableMaterial);
  addBox(group, 'Chapter 10 bottom left lamp table leg back right', [0.14, 0.72, 0.14], [0.52, 0.36, -0.42], tableMaterial);

  const shadeMaterial = new MeshStandardMaterial({
    color: 0xd7c28d,
    emissive: 0xffc86b,
    emissiveIntensity: 0,
    roughness: 0.55,
  });
  const bulbMaterial = new MeshStandardMaterial({
    color: 0xfff4cf,
    emissive: 0xffd37a,
    emissiveIntensity: 0.08,
    roughness: 0.3,
  });
  addBox(group, 'Chapter 10 lamp base', [0.36, 0.12, 0.36], [0, 0.96, 0], brassMaterial);
  addBox(group, 'Chapter 10 lamp stem', [0.1, 0.62, 0.1], [0, 1.25, 0], brassMaterial);
  const bulb = new Mesh(new CylinderGeometry(0.12, 0.14, 0.2, 16), bulbMaterial);
  bulb.name = 'Chapter 10 lamp glowing bulb';
  bulb.position.set(0, 1.55, 0);
  bulb.castShadow = false;
  group.add(bulb);
  const shade = new Mesh(new ConeGeometry(0.48, 0.52, 20, 1, true), shadeMaterial);
  shade.name = 'Chapter 10 lamp shade';
  shade.position.set(0, 1.66, 0);
  shade.rotation.x = Math.PI;
  shade.castShadow = true;
  group.add(shade);
  const light = new PointLight(0xffc36b, 1.9, 9, 1.6);
  light.name = 'Chapter 10 lamp light';
  light.position.set(0, 1.56, 0);
  light.visible = false;
  group.add(light);

  root.add(group);
  addCollider(colliders, -7.28, 5.15, 0.86, 0.74);
  return {
    interactPosition: new Vector3(-7.28, 0.9, 5.15),
    light,
    bulbMaterial,
    shadeMaterial,
    on: false,
  };
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
  addBox(root, 'Chapter 10 doorway header', [DOOR_WIDTH + 0.35, 0.35, WALL_THICKNESS + 0.05], [0, 3, halfDepth], trimMaterial);
  addGableWall(root, 'Chapter 10 front triangular gable wall', halfDepth + 0.03, 0);
  addGableWall(root, 'Chapter 10 back triangular gable wall', -halfDepth - 0.03, Math.PI);
  addOpenFrontDoor(root, halfDepth);

  addStuds(root);
  addWindowFrame(root, -halfWidth - 0.02, -1.4, Math.PI / 2);
  addWindowFrame(root, halfWidth + 0.02, 1.6, -Math.PI / 2);
  addWindowFrame(root, -3.2, -halfDepth - 0.02, 0);

  const leftRoof = addBox(root, 'Chapter 10 left gable roof slab', [10.1, 0.34, HOUSE_DEPTH + 1.8], [-4.5, 4.45, 0], roofMaterial);
  leftRoof.rotation.z = 0.2;
  const rightRoof = addBox(root, 'Chapter 10 right gable roof slab', [10.1, 0.34, HOUSE_DEPTH + 1.8], [4.5, 4.45, 0], roofMaterial);
  rightRoof.rotation.z = -0.2;
  addBox(root, 'Chapter 10 roof ridge cap', [0.5, 0.38, HOUSE_DEPTH + 2], [0, 5.37, 0], roofMaterial);

  addFireplace(root, colliders, -halfDepth + 0.48);
  addBed(root, colliders);
  addTableAndChair(root, colliders);
  addCornerDrawer(root, colliders);
  addCounterSinkOvenAndWasher(root, colliders);
  const lamp = addLampTable(root, colliders);

  addBox(root, 'Chapter 10 front porch step', [5.6, 0.35, 2.2], [0, 0.17, halfDepth + 1.45], porchMaterial);
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
    toggleLamp(position: Vector3): { message: string; on: boolean } | null {
      if (position.distanceTo(lamp.interactPosition) > GAME_CONFIG.player.interactionRange + 0.7) {
        return null;
      }

      setLampState(lamp, !lamp.on);
      return {
        message: lamp.on ? 'You turn on the little table lamp.' : 'You turn off the little table lamp.',
        on: lamp.on,
      };
    },
    getLampPrompt(position: Vector3): string | null {
      if (position.distanceTo(lamp.interactPosition) > GAME_CONFIG.player.interactionRange + 0.7) {
        return null;
      }
      return lamp.on ? 'The little table lamp is on. Press E to turn it off.' : 'The little table lamp is off. Press E to turn it on.';
    },
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
      setLampState(lamp, false);
      root.visible = false;
    },
  };
}
