import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';

import type { CollisionBox } from '../types/world';

export interface ChapterTwelveData {
  root: Group;
  colliders: CollisionBox[];
  spawn: Vector3;
  lookTarget: Vector3;
  update(deltaSeconds: number): void;
  reset(): void;
}

const grassMaterial = new MeshStandardMaterial({ color: 0x315f2f, roughness: 0.96 });
const mudMaterial = new MeshStandardMaterial({ color: 0x5b3724, roughness: 0.98 });
const wetMudMaterial = new MeshStandardMaterial({ color: 0x3b251c, roughness: 0.72, metalness: 0.02 });
const rampMaterial = new MeshStandardMaterial({ color: 0x6b4329, roughness: 0.94 });
const barkMaterial = new MeshStandardMaterial({ color: 0x5b3923, roughness: 0.9 });
const leafMaterial = new MeshStandardMaterial({ color: 0x1f4f2d, roughness: 0.88 });
const bikeFrameMaterial = new MeshStandardMaterial({ color: 0xcc2f25, roughness: 0.48, metalness: 0.18 });
const bikeTireMaterial = new MeshStandardMaterial({ color: 0x111111, roughness: 0.82 });
const bikeMetalMaterial = new MeshStandardMaterial({ color: 0xb8b8aa, roughness: 0.36, metalness: 0.55 });
const bikeSeatMaterial = new MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.72 });

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

function addCollider(colliders: CollisionBox[], centerX: number, centerZ: number, halfWidth: number, halfDepth: number): void {
  colliders.push({ centerX, centerZ, halfWidth, halfDepth });
}

function addTree(root: Group, colliders: CollisionBox[], x: number, z: number, scale = 1): void {
  const tree = new Group();
  tree.name = 'Chapter 12 semi realistic forest tree';
  tree.position.set(x, 0, z);
  const trunk = new Mesh(new CylinderGeometry(0.24 * scale, 0.34 * scale, 3.2 * scale, 10), barkMaterial);
  trunk.name = 'Chapter 12 tree rough trunk';
  trunk.position.y = 1.6 * scale;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);
  const crown = new Mesh(new SphereGeometry(1.25 * scale, 16, 12), leafMaterial);
  crown.name = 'Chapter 12 dense pine green crown';
  crown.position.y = 3.35 * scale;
  crown.scale.set(0.9, 1.24, 0.9);
  crown.castShadow = true;
  crown.receiveShadow = true;
  tree.add(crown);
  root.add(tree);
  addCollider(colliders, x, z, 0.34 * scale, 0.34 * scale);
}

function addMudTrail(root: Group, name: string, x: number, z: number, width: number, depth: number, rotationY = 0): void {
  const trail = new Mesh(new BoxGeometry(width, 0.055, depth), mudMaterial);
  trail.name = name;
  trail.position.set(x, 0.012, z);
  trail.rotation.y = rotationY;
  trail.receiveShadow = true;
  root.add(trail);

  for (let index = 0; index < 7; index += 1) {
    const rut = new Mesh(new BoxGeometry(width * 0.12, 0.028, depth * 0.14), wetMudMaterial);
    rut.name = 'Chapter 12 darker wet tire rut';
    rut.position.set(
      x + Math.sin(index * 1.7) * width * 0.22,
      0.052,
      z - depth * 0.38 + index * depth * 0.12,
    );
    rut.rotation.y = rotationY + (index % 2 === 0 ? 0.08 : -0.08);
    rut.receiveShadow = true;
    root.add(rut);
  }
}

function addJumpRamp(root: Group, x: number, z: number, rotationY: number, scale = 1): void {
  const ramp = new Group();
  ramp.name = 'Chapter 12 muddy dirt bike jump ramp';
  ramp.position.set(x, 0, z);
  ramp.rotation.y = rotationY;
  const base = addBox(ramp, 'Chapter 12 jump ramp dirt base', [3.4 * scale, 0.32 * scale, 4.1 * scale], [0, 0.16 * scale, 0], rampMaterial);
  base.rotation.x = -0.16;
  const lip = addBox(ramp, 'Chapter 12 jump ramp raised takeoff lip', [3.4 * scale, 0.42 * scale, 0.55 * scale], [0, 0.5 * scale, -1.82 * scale], wetMudMaterial);
  lip.rotation.x = -0.16;
  root.add(ramp);
}

function addDirtBike(root: Group): Group {
  const bike = new Group();
  bike.name = 'Chapter 12 red dirt bike parked at forest trail';
  bike.position.set(-4, 0.22, 5.2);
  bike.rotation.y = -0.35;

  [-0.95, 0.95].forEach((x) => {
    const tire = new Mesh(new TorusGeometry(0.44, 0.09, 12, 28), bikeTireMaterial);
    tire.name = 'Chapter 12 dirt bike thick tire';
    tire.position.set(x, 0.34, 0);
    tire.rotation.y = Math.PI / 2;
    tire.castShadow = true;
    bike.add(tire);

    const hub = new Mesh(new CylinderGeometry(0.09, 0.09, 0.14, 12), bikeMetalMaterial);
    hub.name = 'Chapter 12 dirt bike wheel hub';
    hub.position.copy(tire.position);
    hub.rotation.z = Math.PI / 2;
    hub.castShadow = true;
    bike.add(hub);
  });

  const frame = addBox(bike, 'Chapter 12 dirt bike red angled frame', [1.45, 0.14, 0.18], [0, 0.8, 0], bikeFrameMaterial);
  frame.rotation.z = -0.2;
  const tank = addBox(bike, 'Chapter 12 dirt bike red gas tank', [0.72, 0.34, 0.42], [-0.12, 1.02, 0], bikeFrameMaterial);
  tank.rotation.z = -0.12;
  addBox(bike, 'Chapter 12 dirt bike black seat', [0.84, 0.16, 0.42], [0.4, 1.18, 0], bikeSeatMaterial).rotation.z = 0.08;
  addBox(bike, 'Chapter 12 dirt bike front fork', [0.12, 1.18, 0.12], [-0.9, 0.85, 0], bikeMetalMaterial).rotation.z = -0.2;
  addBox(bike, 'Chapter 12 dirt bike rear swing arm', [0.95, 0.1, 0.12], [0.62, 0.64, 0], bikeMetalMaterial).rotation.z = 0.24;
  addBox(bike, 'Chapter 12 dirt bike handlebar', [0.12, 0.1, 1.05], [-1.04, 1.52, 0], bikeMetalMaterial);
  addBox(bike, 'Chapter 12 dirt bike front number plate', [0.12, 0.42, 0.48], [-1.16, 1.18, 0], bikeFrameMaterial);
  root.add(bike);
  return bike;
}

export function createChapterTwelve(): ChapterTwelveData {
  const root = new Group();
  root.name = 'Chapter 12: The Truck Game';
  const colliders: CollisionBox[] = [];

  const ground = new Mesh(new BoxGeometry(120, 0.12, 120), grassMaterial);
  ground.name = 'Chapter 12 forest clearing grass ground';
  ground.position.set(0, -0.06, 0);
  ground.receiveShadow = true;
  root.add(ground);

  addMudTrail(root, 'Chapter 12 main muddy trail straightaway', 0, 0, 7, 70, 0.18);
  addMudTrail(root, 'Chapter 12 left muddy loop trail', -22, -6, 6.2, 45, -0.62);
  addMudTrail(root, 'Chapter 12 right muddy loop trail', 22, 8, 6.2, 48, 0.7);
  addMudTrail(root, 'Chapter 12 crossing muddy trail', 0, 18, 58, 5.6, -0.15);

  addJumpRamp(root, -10, -12, 0.18, 1.05);
  addJumpRamp(root, 13, 10, -0.46, 1.22);
  addJumpRamp(root, -24, 18, 0.72, 0.92);
  addJumpRamp(root, 25, -21, -0.86, 1);

  addDirtBike(root);

  const treePositions: Array<[number, number, number]> = [
    [-50, -44, 1.1], [-38, -52, 0.9], [-24, -48, 1.2], [-8, -54, 1], [12, -50, 1.15], [34, -48, 0.95], [50, -38, 1.1],
    [-54, -18, 0.95], [-48, 4, 1.15], [-52, 26, 1], [-42, 44, 1.1], [-18, 52, 0.9], [6, 50, 1.2], [28, 48, 1], [52, 30, 1.1],
    [50, 4, 0.95], [54, -20, 1.15],
  ];
  treePositions.forEach(([x, z, scale]) => addTree(root, colliders, x, z, scale));

  addCollider(colliders, 0, -60, 60, 1);
  addCollider(colliders, 0, 60, 60, 1);
  addCollider(colliders, -60, 0, 1, 60);
  addCollider(colliders, 60, 0, 1, 60);

  const spawn = new Vector3(-7.2, 1.1, 8.4);
  const lookTarget = new Vector3(-4, 0.9, 5.2);

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    update(): void {},
    reset(): void {},
  };
}
