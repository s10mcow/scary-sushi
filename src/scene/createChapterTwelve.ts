import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from 'three';

import { GAME_CONFIG } from '../config/gameConfig';
import type { MovementState } from '../systems/input/InputController';
import type { CollisionBox } from '../types/world';

export interface ChapterTwelveData {
  root: Group;
  colliders: CollisionBox[];
  spawn: Vector3;
  lookTarget: Vector3;
  isDriving(): boolean;
  isNearTruck(playerPosition: Vector3): boolean;
  interact(playerPosition: Vector3): { message: string; cameraPosition?: Vector3; lookTarget?: Vector3 };
  getDriverCameraPosition(target?: Vector3): Vector3;
  getDriverLookTarget(target?: Vector3): Vector3;
  update(deltaSeconds: number, input?: MovementState): void;
  reset(): void;
}

const FIELD_HALF_SIZE = 94;
const TRUCK_INTERACT_DISTANCE = 4.4;

const grassMaterial = new MeshStandardMaterial({ color: 0x2e642f, roughness: 0.96 });
const mudMaterial = new MeshStandardMaterial({ color: 0x5d3823, roughness: 0.98 });
const wetMudMaterial = new MeshStandardMaterial({ color: 0x2f2019, roughness: 0.64, metalness: 0.04 });
const rutMaterial = new MeshStandardMaterial({ color: 0x231711, roughness: 0.7 });
const rampMaterial = new MeshStandardMaterial({ color: 0x6f4529, roughness: 0.95 });
const barkMaterial = new MeshStandardMaterial({ color: 0x5c3a24, roughness: 0.92 });
const leafMaterial = new MeshStandardMaterial({ color: 0x1f512d, roughness: 0.88 });
const truckPaintMaterial = new MeshStandardMaterial({ color: 0x1b3458, roughness: 0.42, metalness: 0.22 });
const truckDarkPaintMaterial = new MeshStandardMaterial({ color: 0x10213a, roughness: 0.45, metalness: 0.18 });
const truckChromeMaterial = new MeshStandardMaterial({ color: 0xc8c4b8, roughness: 0.28, metalness: 0.7 });
const truckGlassMaterial = new MeshStandardMaterial({ color: 0x8cb9d0, roughness: 0.2, metalness: 0.05, transparent: true, opacity: 0.58 });
const blackTrimMaterial = new MeshStandardMaterial({ color: 0x080808, roughness: 0.58, metalness: 0.08 });
const amberMarkerMaterial = new MeshStandardMaterial({ color: 0xffa23a, roughness: 0.32, emissive: 0xff8a16, emissiveIntensity: 0.32 });
const tireMaterial = new MeshStandardMaterial({ color: 0x101010, roughness: 0.84 });
const headlightMaterial = new MeshStandardMaterial({ color: 0xfff6d1, roughness: 0.28, emissive: 0xffe2a1, emissiveIntensity: 0.35 });
const tailLightMaterial = new MeshStandardMaterial({ color: 0x9c1010, roughness: 0.42, emissive: 0x5f0808, emissiveIntensity: 0.24 });

function createTextMaterial(text: string, width = 512, height = 128): MeshStandardMaterial {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#f1f2ed';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#151515';
    context.font = 'bold 42px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, width / 2, height / 2);
  }
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return new MeshStandardMaterial({ map: texture, roughness: 0.55 });
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

function addCollider(colliders: CollisionBox[], centerX: number, centerZ: number, halfWidth: number, halfDepth: number, rotationY = 0): void {
  colliders.push({ centerX, centerZ, halfWidth, halfDepth, rotationY });
}

function addTree(root: Group, colliders: CollisionBox[], x: number, z: number, scale = 1): void {
  const tree = new Group();
  tree.name = 'Chapter 12 forest edge tree';
  tree.position.set(x, 0, z);

  const trunk = new Mesh(new CylinderGeometry(0.22 * scale, 0.36 * scale, 3.2 * scale, 10), barkMaterial);
  trunk.name = 'Chapter 12 rough tree trunk';
  trunk.position.y = 1.6 * scale;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const crown = new Mesh(new SphereGeometry(1.38 * scale, 16, 12), leafMaterial);
  crown.name = 'Chapter 12 dense green tree crown';
  crown.position.y = 3.35 * scale;
  crown.scale.set(0.9, 1.2, 0.9);
  crown.castShadow = true;
  crown.receiveShadow = true;
  tree.add(crown);

  root.add(tree);
  addCollider(colliders, x, z, 0.38 * scale, 0.38 * scale);
}

function addMudPatch(root: Group, name: string, x: number, z: number, width: number, depth: number, rotationY = 0): void {
  const patch = new Mesh(new BoxGeometry(width, 0.08, depth), mudMaterial);
  patch.name = name;
  patch.position.set(x, 0.015, z);
  patch.rotation.y = rotationY;
  patch.receiveShadow = true;
  root.add(patch);

  for (let index = 0; index < 11; index += 1) {
    const rut = new Mesh(new BoxGeometry(width * 0.06, 0.035, depth * 0.18), index % 3 === 0 ? wetMudMaterial : rutMaterial);
    rut.name = 'Chapter 12 muddy truck tire rut';
    rut.position.set(
      x + Math.sin(index * 1.25) * width * 0.28 + (index % 2 === 0 ? width * 0.2 : -width * 0.2),
      0.075,
      z - depth * 0.42 + index * depth * 0.084,
    );
    rut.rotation.y = rotationY + (index % 2 === 0 ? 0.04 : -0.04);
    rut.receiveShadow = true;
    root.add(rut);
  }
}

function addMudJump(root: Group, x: number, z: number, rotationY: number, scale = 1): void {
  const jump = new Group();
  jump.name = 'Chapter 12 broad mud truck jump';
  jump.position.set(x, 0, z);
  jump.rotation.y = rotationY;
  const ramp = addBox(jump, 'Chapter 12 sloped mud jump ramp', [8.4 * scale, 0.55 * scale, 7.2 * scale], [0, 0.36 * scale, 0], rampMaterial);
  ramp.rotation.x = -0.15;
  addBox(jump, 'Chapter 12 wet mud jump lip', [8.4 * scale, 0.38 * scale, 1.1 * scale], [0, 0.78 * scale, -3.05 * scale], wetMudMaterial).rotation.x = -0.15;
  root.add(jump);
}

function addTruckWheel(truck: Group, x: number, z: number): Mesh {
  const tire = new Mesh(new CylinderGeometry(0.62, 0.62, 0.56, 24), tireMaterial);
  tire.name = 'Chapter 12 Ford F250 chunky mud tire';
  tire.position.set(x, 0.62, z);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  truck.add(tire);

  const hub = new Mesh(new CylinderGeometry(0.24, 0.24, 0.62, 18), truckChromeMaterial);
  hub.name = 'Chapter 12 Ford F250 chrome wheel hub';
  hub.position.copy(tire.position);
  hub.rotation.z = Math.PI / 2;
  hub.castShadow = true;
  truck.add(hub);
  return tire;
}

function createFordF250(): { root: Group; wheels: Mesh[] } {
  const truck = new Group();
  truck.name = 'Chapter 12 Ford F250 Super Duty mud truck';
  truck.position.set(-8, 0, 9);
  truck.rotation.y = -0.28;

  addBox(truck, 'Ford F250 Super Duty long body', [3.32, 0.9, 5.95], [0, 1.18, 0.05], truckPaintMaterial);
  addBox(truck, 'Ford F250 front hood', [3.08, 0.5, 1.55], [0, 1.58, -2.28], truckPaintMaterial);
  addBox(truck, 'Ford F250 crew cab', [2.86, 1.48, 1.98], [0, 2.08, -0.76], truckDarkPaintMaterial);
  addBox(truck, 'Ford F250 pickup bed outer box', [3.34, 0.76, 2.42], [0, 1.72, 1.76], truckPaintMaterial);
  addBox(truck, 'Ford F250 dark open bed liner', [2.78, 0.18, 1.88], [0, 2.12, 1.76], blackTrimMaterial);
  addBox(truck, 'Ford F250 chrome grille', [2.72, 0.82, 0.18], [0, 1.45, -3.02], truckChromeMaterial);
  addBox(truck, 'Ford F250 grille black inset', [2.18, 0.58, 0.08], [0, 1.46, -3.13], blackTrimMaterial);
  addBox(truck, 'Ford F250 grille chrome bar upper', [2.46, 0.09, 0.11], [0, 1.63, -3.18], truckChromeMaterial);
  addBox(truck, 'Ford F250 grille chrome bar lower', [2.46, 0.09, 0.11], [0, 1.31, -3.18], truckChromeMaterial);
  addBox(truck, 'Ford F250 front bumper', [3.45, 0.3, 0.32], [0, 0.96, -3.18], truckChromeMaterial);
  addBox(truck, 'Ford F250 rear bumper', [3.3, 0.28, 0.3], [0, 0.96, 2.95], truckChromeMaterial);
  addBox(truck, 'Ford F250 black lower air dam', [2.65, 0.22, 0.18], [0, 0.74, -3.24], blackTrimMaterial);
  addBox(truck, 'Ford F250 windshield', [2.42, 0.72, 0.08], [0, 2.38, -1.72], truckGlassMaterial).rotation.x = -0.2;
  addBox(truck, 'Ford F250 rear window', [2.22, 0.58, 0.08], [0, 2.31, 0.25], truckGlassMaterial);
  addBox(truck, 'Ford F250 driver front side window', [0.08, 0.62, 0.62], [-1.44, 2.22, -1.12], truckGlassMaterial);
  addBox(truck, 'Ford F250 driver rear side window', [0.08, 0.58, 0.56], [-1.44, 2.2, -0.42], truckGlassMaterial);
  addBox(truck, 'Ford F250 passenger front side window', [0.08, 0.62, 0.62], [1.44, 2.22, -1.12], truckGlassMaterial);
  addBox(truck, 'Ford F250 passenger rear side window', [0.08, 0.58, 0.56], [1.44, 2.2, -0.42], truckGlassMaterial);
  addBox(truck, 'Ford F250 side mirror left', [0.12, 0.28, 0.36], [-1.72, 2.02, -1.58], truckChromeMaterial);
  addBox(truck, 'Ford F250 side mirror right', [0.12, 0.28, 0.36], [1.72, 2.02, -1.58], truckChromeMaterial);
  addBox(truck, 'Ford F250 left chrome running board', [0.22, 0.14, 2.34], [-1.86, 0.88, -0.55], truckChromeMaterial);
  addBox(truck, 'Ford F250 right chrome running board', [0.22, 0.14, 2.34], [1.86, 0.88, -0.55], truckChromeMaterial);
  addBox(truck, 'Ford F250 driver front door seam', [0.04, 0.9, 0.05], [-1.69, 1.72, -1.45], blackTrimMaterial);
  addBox(truck, 'Ford F250 driver rear door seam', [0.04, 0.88, 0.05], [-1.69, 1.7, -0.16], blackTrimMaterial);
  addBox(truck, 'Ford F250 passenger front door seam', [0.04, 0.9, 0.05], [1.69, 1.72, -1.45], blackTrimMaterial);
  addBox(truck, 'Ford F250 passenger rear door seam', [0.04, 0.88, 0.05], [1.69, 1.7, -0.16], blackTrimMaterial);
  addBox(truck, 'Ford F250 left front fender flare', [0.18, 0.34, 1.18], [-1.76, 1.08, -2.16], blackTrimMaterial);
  addBox(truck, 'Ford F250 right front fender flare', [0.18, 0.34, 1.18], [1.76, 1.08, -2.16], blackTrimMaterial);
  addBox(truck, 'Ford F250 left rear fender flare', [0.18, 0.34, 1.18], [-1.76, 1.08, 2.02], blackTrimMaterial);
  addBox(truck, 'Ford F250 right rear fender flare', [0.18, 0.34, 1.18], [1.76, 1.08, 2.02], blackTrimMaterial);
  addBox(truck, 'Ford F250 front axle', [3.2, 0.1, 0.12], [0, 0.58, -2.16], truckChromeMaterial);
  addBox(truck, 'Ford F250 rear axle', [3.2, 0.1, 0.12], [0, 0.58, 2.02], truckChromeMaterial);
  addBox(truck, 'Ford F250 left headlight', [0.62, 0.24, 0.1], [-0.86, 1.42, -3.16], headlightMaterial);
  addBox(truck, 'Ford F250 right headlight', [0.62, 0.24, 0.1], [0.86, 1.42, -3.16], headlightMaterial);
  addBox(truck, 'Ford F250 left amber running light', [0.3, 0.12, 0.08], [-1.28, 1.7, -3.16], amberMarkerMaterial);
  addBox(truck, 'Ford F250 right amber running light', [0.3, 0.12, 0.08], [1.28, 1.7, -3.16], amberMarkerMaterial);
  addBox(truck, 'Ford F250 left tail light', [0.32, 0.42, 0.1], [-1.32, 1.38, 3.1], tailLightMaterial);
  addBox(truck, 'Ford F250 right tail light', [0.32, 0.42, 0.1], [1.32, 1.38, 3.1], tailLightMaterial);
  [-0.72, -0.36, 0, 0.36, 0.72].forEach((x) => {
    addBox(truck, 'Ford F250 amber cab roof marker light', [0.18, 0.08, 0.14], [x, 2.88, -1.12], amberMarkerMaterial);
  });

  const sideBadgeMaterial = createTextMaterial('F-250 SUPER DUTY', 512, 128);
  const badgeLeft = new Mesh(new BoxGeometry(0.04, 0.42, 1.42), sideBadgeMaterial);
  badgeLeft.name = 'Ford F250 Super Duty side badge left';
  badgeLeft.position.set(-1.66, 1.7, -1.98);
  badgeLeft.rotation.y = Math.PI / 2;
  truck.add(badgeLeft);
  const badgeRight = badgeLeft.clone();
  badgeRight.name = 'Ford F250 Super Duty side badge right';
  badgeRight.position.x = 1.66;
  badgeRight.rotation.y = -Math.PI / 2;
  truck.add(badgeRight);
  const trimBadgeMaterial = createTextMaterial('LARIAT 4X4', 384, 128);
  const tailgateBadge = new Mesh(new BoxGeometry(1.35, 0.34, 0.05), trimBadgeMaterial);
  tailgateBadge.name = 'Ford F250 Lariat 4X4 tailgate badge';
  tailgateBadge.position.set(0, 1.66, 3.13);
  truck.add(tailgateBadge);

  const wheels = [
    addTruckWheel(truck, -1.62, -2.16),
    addTruckWheel(truck, 1.62, -2.16),
    addTruckWheel(truck, -1.62, 2.02),
    addTruckWheel(truck, 1.62, 2.02),
  ];

  return { root: truck, wheels };
}

export function createChapterTwelve(): ChapterTwelveData {
  const root = new Group();
  root.name = 'Chapter 12: The Truck Game';
  const colliders: CollisionBox[] = [];

  const ground = new Mesh(new BoxGeometry(FIELD_HALF_SIZE * 2, 0.12, FIELD_HALF_SIZE * 2), grassMaterial);
  ground.name = 'Chapter 12 big open grassy field';
  ground.position.set(0, -0.06, 0);
  ground.receiveShadow = true;
  root.add(ground);

  addMudPatch(root, 'Chapter 12 main open mud pit', 0, 0, 82, 62, 0.05);
  addMudPatch(root, 'Chapter 12 left muddy truck trail', -36, -16, 22, 92, -0.33);
  addMudPatch(root, 'Chapter 12 right muddy truck trail', 36, 15, 24, 88, 0.38);
  addMudPatch(root, 'Chapter 12 rear muddy straightaway', 0, -46, 96, 16, 0.02);
  addMudPatch(root, 'Chapter 12 front muddy straightaway', 4, 48, 92, 18, -0.08);

  addMudJump(root, -24, -18, 0.22, 1.05);
  addMudJump(root, 25, 18, -0.42, 1.12);
  addMudJump(root, -2, 42, 0.05, 0.92);
  addMudJump(root, 30, -43, -0.2, 0.96);

  const truck = createFordF250();
  root.add(truck.root);

  const treePositions: Array<[number, number, number]> = [];
  for (let index = 0; index < 18; index += 1) {
    const t = index / 18;
    treePositions.push([-FIELD_HALF_SIZE + 4 + Math.sin(index * 1.7) * 2.4, -FIELD_HALF_SIZE + 10 + t * (FIELD_HALF_SIZE * 2 - 20), 0.8 + (index % 4) * 0.08]);
    treePositions.push([FIELD_HALF_SIZE - 4 + Math.cos(index * 1.4) * 2.4, -FIELD_HALF_SIZE + 10 + t * (FIELD_HALF_SIZE * 2 - 20), 0.84 + (index % 3) * 0.1]);
  }
  for (let index = 0; index < 12; index += 1) {
    const t = index / 12;
    treePositions.push([-FIELD_HALF_SIZE + 14 + t * (FIELD_HALF_SIZE * 2 - 28), -FIELD_HALF_SIZE + 4 + Math.cos(index * 1.9) * 2.2, 0.9]);
    treePositions.push([-FIELD_HALF_SIZE + 14 + t * (FIELD_HALF_SIZE * 2 - 28), FIELD_HALF_SIZE - 4 + Math.sin(index * 1.2) * 2.2, 0.94]);
  }
  treePositions.forEach(([x, z, scale]) => addTree(root, colliders, x, z, scale));

  addCollider(colliders, 0, -FIELD_HALF_SIZE, FIELD_HALF_SIZE, 1);
  addCollider(colliders, 0, FIELD_HALF_SIZE, FIELD_HALF_SIZE, 1);
  addCollider(colliders, -FIELD_HALF_SIZE, 0, 1, FIELD_HALF_SIZE);
  addCollider(colliders, FIELD_HALF_SIZE, 0, 1, FIELD_HALF_SIZE);
  const truckCollider: CollisionBox = { centerX: truck.root.position.x, centerZ: truck.root.position.z, halfWidth: 1.9, halfDepth: 3.2, rotationY: truck.root.rotation.y };
  colliders.push(truckCollider);

  const spawn = new Vector3(-14, GAME_CONFIG.player.height, 14);
  const lookTarget = new Vector3(-8, GAME_CONFIG.player.height * 0.9, 9);
  const velocity = new Vector3();
  let driving = false;
  let speed = 0;

  const updateTruckCollider = (): void => {
    truckCollider.centerX = truck.root.position.x;
    truckCollider.centerZ = truck.root.position.z;
    truckCollider.rotationY = truck.root.rotation.y;
    truckCollider.enabled = !driving;
  };

  const getLocalWorldPosition = (x: number, y: number, z: number, target = new Vector3()): Vector3 => {
    target.set(x, y, z);
    return truck.root.localToWorld(target);
  };

  const clampTruckToField = (): void => {
    truck.root.position.x = MathUtils.clamp(truck.root.position.x, -FIELD_HALF_SIZE + 7, FIELD_HALF_SIZE - 7);
    truck.root.position.z = MathUtils.clamp(truck.root.position.z, -FIELD_HALF_SIZE + 7, FIELD_HALF_SIZE - 7);
  };

  updateTruckCollider();

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    isDriving(): boolean {
      return driving;
    },
    isNearTruck(playerPosition: Vector3): boolean {
      return playerPosition.distanceTo(truck.root.position) <= TRUCK_INTERACT_DISTANCE;
    },
    interact(playerPosition: Vector3): { message: string; cameraPosition?: Vector3; lookTarget?: Vector3 } {
      if (driving) {
        driving = false;
        speed = 0;
        updateTruckCollider();
        return {
          message: 'You climb out of the Ford F250 Super Duty.',
          cameraPosition: getLocalWorldPosition(-3.25, GAME_CONFIG.player.height, 0.35),
          lookTarget: truck.root.position.clone().add(new Vector3(0, 1.4, 0)),
        };
      }

      if (playerPosition.distanceTo(truck.root.position) > TRUCK_INTERACT_DISTANCE) {
        return { message: 'Move closer to the Ford F250 Super Duty, then press E to get in.' };
      }

      driving = true;
      updateTruckCollider();
      return {
        message: 'You get in the Ford F250 Super Duty. Use W/S to drive, A/D to steer, and E to get out.',
        cameraPosition: getLocalWorldPosition(-0.48, 2.28, -0.78),
        lookTarget: getLocalWorldPosition(-0.48, 2.15, -9),
      };
    },
    getDriverCameraPosition(target = new Vector3()): Vector3 {
      return getLocalWorldPosition(-0.48, 2.28, -0.78, target);
    },
    getDriverLookTarget(target = new Vector3()): Vector3 {
      return getLocalWorldPosition(-0.48, 2.1, -9, target);
    },
    update(deltaSeconds: number, input: MovementState = { forward: 0, strafe: 0, sprint: false }): void {
      if (driving) {
        const acceleration = input.forward * (input.forward >= 0 ? 13 : 8.5);
        speed += acceleration * deltaSeconds;
        speed *= Math.pow(0.32, deltaSeconds);
        speed = MathUtils.clamp(speed, -7.5, input.sprint ? 18 : 13);
        if (Math.abs(input.forward) < 0.01 && Math.abs(speed) < 0.08) {
          speed = 0;
        }

        const steerStrength = MathUtils.clamp(Math.abs(speed) / 9, 0.18, 1);
        truck.root.rotation.y -= input.strafe * steerStrength * Math.sign(speed || 1) * 1.25 * deltaSeconds;
        velocity.set(-Math.sin(truck.root.rotation.y), 0, -Math.cos(truck.root.rotation.y)).multiplyScalar(speed * deltaSeconds);
        truck.root.position.add(velocity);
        clampTruckToField();

        truck.wheels.forEach((wheel) => {
          wheel.rotation.x += speed * deltaSeconds * 1.85;
        });
        updateTruckCollider();
      }

      truck.root.position.y = 0.04 + Math.sin(performance.now() * 0.004) * MathUtils.clamp(Math.abs(speed) / 90, 0, 0.035);
    },
    reset(): void {
      driving = false;
      speed = 0;
      truck.root.position.set(-8, 0, 9);
      truck.root.rotation.set(0, -0.28, 0);
      updateTruckCollider();
    },
  };
}
