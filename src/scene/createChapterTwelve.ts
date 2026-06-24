import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
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
  getSpeedMph(): number;
  getDrivingStatus(): string;
  consumeEventCue(): ChapterTwelveEventCue | null;
  update(deltaSeconds: number, input?: MovementState): void;
  reset(): void;
}

const FIELD_HALF_SIZE = 150;
const TRUCK_INTERACT_DISTANCE = 4.4;
const TOW_CHAIN_INTERACT_DISTANCE = 4.8;
const GARAGE_BUTTON_INTERACT_DISTANCE = 5.2;

export type ChapterTwelveEventCue = 'mud-grind' | 'mud-splash' | 'tree-smash' | 'chain' | 'repair';

interface MudZone {
  x: number;
  z: number;
  width: number;
  depth: number;
  rotationY: number;
  sinkDepth: number;
}

type ChapterTwelveVehicleId = 'f250' | 'tow';

interface ChapterTwelveVehicle {
  id: ChapterTwelveVehicleId;
  label: string;
  root: Group;
  wheels: Mesh[];
  collider: CollisionBox;
  spawn: Vector3;
  spawnRotationY: number;
  speed: number;
  stuckAmount: number;
  damaged: boolean;
}

function createMudTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#55341f';
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < 620; index += 1) {
      const x = (index * 47) % canvas.width;
      const y = (index * 83) % canvas.height;
      const radius = 2 + ((index * 19) % 12);
      const shade = 28 + ((index * 31) % 42);
      context.fillStyle = `rgba(${shade + 22}, ${shade + 12}, ${shade + 4}, ${0.18 + (index % 5) * 0.035})`;
      context.beginPath();
      context.ellipse(x, y, radius * 1.8, radius, (index % 9) * 0.37, 0, Math.PI * 2);
      context.fill();
    }
    for (let index = 0; index < 80; index += 1) {
      const x = (index * 91) % canvas.width;
      const y = (index * 37) % canvas.height;
      context.strokeStyle = `rgba(23, 14, 9, ${0.22 + (index % 4) * 0.05})`;
      context.lineWidth = 1 + (index % 3);
      context.beginPath();
      context.moveTo(x, y);
      context.bezierCurveTo(x + 18, y + 8, x - 14, y + 28, x + 24, y + 38);
      context.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.repeat.set(6, 6);
  return texture;
}

const grassMaterial = new MeshStandardMaterial({ color: 0x2e642f, roughness: 0.96 });
const mudMaterial = new MeshStandardMaterial({ color: 0x654028, map: createMudTexture(), roughness: 0.9 });
const mudEdgeMaterial = new MeshStandardMaterial({ color: 0x4d2f1e, map: createMudTexture(), roughness: 0.94 });
const wetMudMaterial = new MeshStandardMaterial({ color: 0x261913, roughness: 0.38, metalness: 0.02 });
const rutMaterial = new MeshStandardMaterial({ color: 0x1d120d, roughness: 0.56, metalness: 0.03 });
const mudPuddleMaterial = new MeshStandardMaterial({ color: 0x1a120f, roughness: 0.18, metalness: 0.04, transparent: true, opacity: 0.86 });
const mudClumpMaterial = new MeshStandardMaterial({ color: 0x3f291b, roughness: 0.98 });
const rampMaterial = new MeshStandardMaterial({ color: 0x674026, map: createMudTexture(), roughness: 0.92 });
const barkMaterial = new MeshStandardMaterial({ color: 0x5c3a24, roughness: 0.92 });
const leafMaterial = new MeshStandardMaterial({ color: 0x1f512d, roughness: 0.88 });
const truckPaintMaterial = new MeshStandardMaterial({ color: 0x1b3458, roughness: 0.42, metalness: 0.22 });
const truckDarkPaintMaterial = new MeshStandardMaterial({ color: 0x10213a, roughness: 0.45, metalness: 0.18 });
const truckChromeMaterial = new MeshStandardMaterial({ color: 0xc8c4b8, roughness: 0.28, metalness: 0.7 });
const truckGlassMaterial = new MeshStandardMaterial({ color: 0x8cb9d0, roughness: 0.2, metalness: 0.05, transparent: true, opacity: 0.58 });
const blackTrimMaterial = new MeshStandardMaterial({ color: 0x080808, roughness: 0.58, metalness: 0.08 });
const interiorMaterial = new MeshStandardMaterial({ color: 0x262421, roughness: 0.82, metalness: 0.04 });
const seatMaterial = new MeshStandardMaterial({ color: 0x3a342d, roughness: 0.86 });
const chainMaterial = new MeshStandardMaterial({ color: 0x8c8d87, roughness: 0.32, metalness: 0.84 });
const garageMaterial = new MeshStandardMaterial({ color: 0x8b8a82, roughness: 0.72 });
const garageRoofMaterial = new MeshStandardMaterial({ color: 0x55585a, roughness: 0.68, metalness: 0.18 });
const redButtonMaterial = new MeshStandardMaterial({ color: 0xc91f1f, roughness: 0.38, emissive: 0x3a0505, emissiveIntensity: 0.18 });
const towPaintMaterial = new MeshStandardMaterial({ color: 0xbe6e23, roughness: 0.48, metalness: 0.18 });
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

function addFlatMudOval(
  root: Group,
  name: string,
  localX: number,
  localZ: number,
  radiusX: number,
  radiusZ: number,
  material: MeshStandardMaterial,
  y = 0.045,
): Mesh {
  const oval = new Mesh(new CylinderGeometry(1, 1, 0.035, 28), material);
  oval.name = name;
  oval.position.set(localX, y, localZ);
  oval.scale.set(radiusX, 1, radiusZ);
  oval.receiveShadow = true;
  oval.castShadow = true;
  root.add(oval);
  return oval;
}

function addMudClump(root: Group, localX: number, localZ: number, scale: number): void {
  const clump = new Mesh(new SphereGeometry(0.34, 10, 6), mudClumpMaterial);
  clump.name = 'Chapter 12 raised sloppy mud clump';
  clump.position.set(localX, 0.12 + scale * 0.035, localZ);
  clump.scale.set(1.5 * scale, 0.22 * scale, 0.86 * scale);
  clump.rotation.y = localX * 0.13 + localZ * 0.07;
  clump.castShadow = true;
  clump.receiveShadow = true;
  root.add(clump);
}

function addMudPatch(root: Group, mudZones: MudZone[], name: string, x: number, z: number, width: number, depth: number, rotationY = 0, sinkDepth = 1): void {
  const patchGroup = new Group();
  patchGroup.name = name;
  patchGroup.position.set(x, 0, z);
  patchGroup.rotation.y = rotationY;

  const patch = new Mesh(new BoxGeometry(width, 0.06, depth), mudMaterial);
  patch.name = `${name} slick uneven mud base`;
  patch.position.set(0, 0.018, 0);
  patch.receiveShadow = true;
  patchGroup.add(patch);

  const edgeCount = Math.max(12, Math.round(depth / 7));
  for (let index = 0; index < edgeCount; index += 1) {
    const t = edgeCount === 1 ? 0 : index / (edgeCount - 1);
    const localZ = -depth * 0.48 + t * depth + Math.sin(index * 1.91) * depth * 0.018;
    const wobble = Math.sin(index * 2.37) * width * 0.08;
    const blobWidth = width * (0.12 + (index % 4) * 0.018);
    const blobDepth = depth * (0.035 + (index % 3) * 0.008);
    addFlatMudOval(patchGroup, 'Chapter 12 sloppy irregular mud edge', -width * 0.5 + wobble, localZ, blobWidth, blobDepth, mudEdgeMaterial, 0.052);
    addFlatMudOval(patchGroup, 'Chapter 12 sloppy irregular mud edge', width * 0.5 - wobble * 0.7, localZ + Math.cos(index * 1.45) * depth * 0.012, blobWidth * 1.12, blobDepth, mudEdgeMaterial, 0.052);
  }

  const rutCount = Math.max(10, Math.round(depth / 8));
  for (let index = 0; index < rutCount; index += 1) {
    const localZ = -depth * 0.43 + index * (depth * 0.86 / Math.max(1, rutCount - 1));
    const bend = Math.sin(index * 1.18) * width * 0.08;
    [-0.23, 0.23].forEach((side, sideIndex) => {
      const rut = new Mesh(new BoxGeometry(width * 0.105, 0.034, depth * 0.105), sideIndex === 0 && index % 3 === 0 ? wetMudMaterial : rutMaterial);
      rut.name = 'Chapter 12 deep sloppy tire rut filled with wet mud';
      rut.position.set(width * side + bend, 0.08, localZ);
      rut.rotation.y = Math.sin(index * 0.77) * 0.08;
      rut.receiveShadow = true;
      patchGroup.add(rut);
    });
  }

  const puddleCount = Math.max(5, Math.round((width * depth) / 780));
  for (let index = 0; index < puddleCount; index += 1) {
    const localX = Math.sin(index * 2.41) * width * 0.28 + (index % 2 === 0 ? -width * 0.12 : width * 0.12);
    const localZ = -depth * 0.34 + ((index * 0.31) % 1) * depth * 0.68;
    const puddle = addFlatMudOval(
      patchGroup,
      'Chapter 12 glossy standing water puddle in mud',
      localX,
      localZ,
      width * (0.08 + (index % 3) * 0.018),
      depth * (0.025 + (index % 4) * 0.006),
      mudPuddleMaterial,
      0.094,
    );
    puddle.rotation.y = index * 0.42;
  }

  const clumpCount = Math.max(12, Math.round((width * depth) / 260));
  for (let index = 0; index < clumpCount; index += 1) {
    const localX = Math.sin(index * 1.79) * width * 0.43;
    const localZ = -depth * 0.46 + ((index * 0.173) % 1) * depth * 0.92;
    addMudClump(patchGroup, localX, localZ, 0.55 + (index % 5) * 0.16);
  }

  root.add(patchGroup);
  mudZones.push({ x, z, width, depth, rotationY, sinkDepth });
}

function addMudJump(root: Group, x: number, z: number, rotationY: number, scale = 1): void {
  const jump = new Group();
  jump.name = 'Chapter 12 broad mud truck jump';
  jump.position.set(x, 0, z);
  jump.rotation.y = rotationY;
  const ramp = addBox(jump, 'Chapter 12 sloped mud jump ramp', [8.4 * scale, 0.55 * scale, 7.2 * scale], [0, 0.36 * scale, 0], rampMaterial);
  ramp.rotation.x = -0.15;
  addBox(jump, 'Chapter 12 wet mud jump lip', [8.4 * scale, 0.38 * scale, 1.1 * scale], [0, 0.78 * scale, -3.05 * scale], wetMudMaterial).rotation.x = -0.15;
  for (let index = 0; index < 12; index += 1) {
    const clump = new Mesh(new SphereGeometry(0.28 * scale, 8, 5), mudClumpMaterial);
    clump.name = 'Chapter 12 mud jump loose wet clump';
    clump.position.set(
      Math.sin(index * 1.73) * 3.4 * scale,
      (0.72 + (index % 4) * 0.035) * scale,
      (-2.7 + index * 0.42) * scale,
    );
    clump.scale.set(1.7, 0.24, 0.82);
    clump.rotation.y = index * 0.51;
    clump.castShadow = true;
    clump.receiveShadow = true;
    jump.add(clump);
  }
  for (let index = 0; index < 4; index += 1) {
    const puddle = addFlatMudOval(
      jump,
      'Chapter 12 shiny puddle sitting on truck jump',
      -2.9 * scale + index * 1.95 * scale,
      (index % 2 === 0 ? -1.8 : 1.05) * scale,
      0.68 * scale,
      0.34 * scale,
      mudPuddleMaterial,
      0.86 * scale,
    );
    puddle.rotation.y = index * 0.62;
  }
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

function addWindowFrame(root: Group, name: string, size: [number, number, number], position: [number, number, number], rotationY = 0): void {
  const [width, height, depth] = size;
  const top = addBox(root, `${name} top frame`, [width, 0.045, depth], [position[0], position[1] + height * 0.5, position[2]], blackTrimMaterial);
  const bottom = addBox(root, `${name} bottom frame`, [width, 0.045, depth], [position[0], position[1] - height * 0.5, position[2]], blackTrimMaterial);
  const left = addBox(root, `${name} left frame`, [0.045, height, depth], [position[0] - width * 0.5, position[1], position[2]], blackTrimMaterial);
  const right = addBox(root, `${name} right frame`, [0.045, height, depth], [position[0] + width * 0.5, position[1], position[2]], blackTrimMaterial);
  [top, bottom, left, right].forEach((part) => {
    part.rotation.y = rotationY;
  });
}

function addTruckInterior(root: Group): void {
  addBox(root, 'Ford F250 black interior floor pan', [2.5, 0.08, 1.55], [0, 1.52, -0.72], interiorMaterial);
  addBox(root, 'Ford F250 black cab ceiling liner', [2.5, 0.08, 1.72], [0, 2.86, -0.72], interiorMaterial);
  addBox(root, 'Ford F250 center console between two seats', [0.28, 0.32, 0.82], [0, 1.82, -0.52], interiorMaterial);
  [-0.58, 0.58].forEach((x, index) => {
    const seat = new Group();
    seat.name = index === 0 ? 'Ford F250 driver seat' : 'Ford F250 passenger seat';
    seat.position.set(x, 1.58, -0.44);
    addBox(seat, 'dark cloth truck seat cushion', [0.54, 0.18, 0.64], [0, 0.05, 0], seatMaterial);
    const back = addBox(seat, 'dark cloth truck seat back', [0.54, 0.68, 0.16], [0, 0.42, 0.29], seatMaterial);
    back.rotation.x = -0.18;
    addBox(seat, 'truck seat headrest', [0.36, 0.18, 0.12], [0, 0.86, 0.34], seatMaterial);
    root.add(seat);
  });
  addBox(root, 'Ford F250 dashboard', [2.22, 0.34, 0.28], [0, 1.92, -1.5], interiorMaterial);
  addBox(root, 'Ford F250 gauge cluster', [0.48, 0.18, 0.045], [-0.5, 2.0, -1.66], blackTrimMaterial);
  const steeringWheel = new Mesh(new TorusGeometry(0.24, 0.025, 8, 24), blackTrimMaterial);
  steeringWheel.name = 'Ford F250 round steering wheel';
  steeringWheel.position.set(-0.52, 2.0, -1.36);
  steeringWheel.rotation.x = Math.PI / 2.7;
  steeringWheel.castShadow = true;
  root.add(steeringWheel);
  const steeringColumn = new Mesh(new CylinderGeometry(0.035, 0.045, 0.34, 10), blackTrimMaterial);
  steeringColumn.name = 'Ford F250 steering column';
  steeringColumn.position.set(-0.52, 1.88, -1.45);
  steeringColumn.rotation.x = Math.PI / 2.6;
  root.add(steeringColumn);
}

function addTowHooks(root: Group, frontZ: number, rearZ: number): void {
  [
    ['front', frontZ, 0xffd66d],
    ['rear', rearZ, 0xcfd2d1],
  ].forEach(([label, z, color]) => {
    const material = new MeshStandardMaterial({ color: color as number, roughness: 0.38, metalness: 0.72 });
    const hook = new Mesh(new TorusGeometry(0.17, 0.027, 8, 18, Math.PI * 1.4), material);
    hook.name = `Chapter 12 ${label} bumper tow hook`;
    hook.position.set(0, 0.86, z as number);
    hook.rotation.x = Math.PI / 2;
    hook.castShadow = true;
    root.add(hook);
  });
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
  addWindowFrame(truck, 'Ford F250 windshield', [2.54, 0.82, 0.055], [0, 2.38, -1.775]);
  addWindowFrame(truck, 'Ford F250 rear cab window', [2.34, 0.68, 0.055], [0, 2.31, 0.305]);
  [-1, 1].forEach((side) => {
    addWindowFrame(truck, side < 0 ? 'Ford F250 driver side front window' : 'Ford F250 passenger side front window', [0.08, 0.7, 0.72], [side * 1.49, 2.22, -1.12], side > 0 ? 0 : 0);
    addWindowFrame(truck, side < 0 ? 'Ford F250 driver side rear window' : 'Ford F250 passenger side rear window', [0.08, 0.66, 0.66], [side * 1.49, 2.2, -0.42], side > 0 ? 0 : 0);
  });
  addBox(truck, 'Ford F250 side mirror left', [0.12, 0.28, 0.36], [-1.72, 2.02, -1.58], truckChromeMaterial);
  addBox(truck, 'Ford F250 side mirror right', [0.12, 0.28, 0.36], [1.72, 2.02, -1.58], truckChromeMaterial);
  addBox(truck, 'Ford F250 left chrome running board', [0.22, 0.14, 2.34], [-1.86, 0.88, -0.55], truckChromeMaterial);
  addBox(truck, 'Ford F250 right chrome running board', [0.22, 0.14, 2.34], [1.86, 0.88, -0.55], truckChromeMaterial);
  addBox(truck, 'Ford F250 driver front door seam', [0.04, 0.9, 0.05], [-1.69, 1.72, -1.45], blackTrimMaterial);
  addBox(truck, 'Ford F250 driver rear door seam', [0.04, 0.88, 0.05], [-1.69, 1.7, -0.16], blackTrimMaterial);
  addBox(truck, 'Ford F250 passenger front door seam', [0.04, 0.9, 0.05], [1.69, 1.72, -1.45], blackTrimMaterial);
  addBox(truck, 'Ford F250 passenger rear door seam', [0.04, 0.88, 0.05], [1.69, 1.7, -0.16], blackTrimMaterial);
  [-1, 1].forEach((side) => {
    addBox(truck, 'Ford F250 lower body crease', [0.04, 0.055, 2.95], [side * 1.72, 1.38, -0.68], truckChromeMaterial);
    addBox(truck, 'Ford F250 bed side crease', [0.04, 0.055, 1.86], [side * 1.72, 1.62, 1.72], truckChromeMaterial);
    addBox(truck, 'Ford F250 door handle', [0.06, 0.1, 0.28], [side * 1.77, 1.78, -1.03], truckChromeMaterial);
    addBox(truck, 'Ford F250 rear door handle', [0.06, 0.1, 0.25], [side * 1.77, 1.76, -0.26], truckChromeMaterial);
  });
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
  addTruckInterior(truck);
  addTowHooks(truck, -3.35, 3.18);

  return { root: truck, wheels };
}

function createTowTruck(): { root: Group; wheels: Mesh[]; chain: Group; hook: Group } {
  const truck = new Group();
  truck.name = 'Chapter 12 orange tow truck with rear crane and chain';
  truck.position.set(FIELD_HALF_SIZE - 28, 0, FIELD_HALF_SIZE - 30);
  truck.rotation.y = -2.35;

  addBox(truck, 'Tow truck heavy frame', [3.2, 0.78, 5.3], [0, 1.05, 0], towPaintMaterial);
  addBox(truck, 'Tow truck cab', [2.75, 1.42, 1.8], [0, 1.95, -1.45], towPaintMaterial);
  addBox(truck, 'Tow truck flat rear deck', [3.0, 0.24, 2.6], [0, 1.55, 1.35], blackTrimMaterial);
  addBox(truck, 'Tow truck front chrome bumper', [3.28, 0.28, 0.3], [0, 0.88, -2.85], truckChromeMaterial);
  addBox(truck, 'Tow truck rear tow bumper', [3.18, 0.28, 0.3], [0, 0.9, 2.72], truckChromeMaterial);
  addBox(truck, 'Tow truck windshield', [2.24, 0.64, 0.08], [0, 2.2, -2.05], truckGlassMaterial).rotation.x = -0.16;
  addBox(truck, 'Tow truck left side window', [0.08, 0.56, 0.58], [-1.41, 2.1, -1.38], truckGlassMaterial);
  addBox(truck, 'Tow truck right side window', [0.08, 0.56, 0.58], [1.41, 2.1, -1.38], truckGlassMaterial);
  addTruckInterior(truck);
  addTowHooks(truck, -3.02, 2.95);

  const boom = new Group();
  boom.name = 'Tow truck small rear crane boom';
  boom.position.set(0, 2.08, 1.4);
  const boomPost = new Mesh(new CylinderGeometry(0.09, 0.12, 1.28, 10), truckChromeMaterial);
  boomPost.name = 'Tow truck crane upright';
  boomPost.position.y = 0.58;
  boomPost.castShadow = true;
  const boomArm = addBox(boom, 'Tow truck angled crane arm', [0.2, 0.18, 2.15], [0, 1.16, 0.92], truckChromeMaterial);
  boomArm.rotation.x = -0.42;
  boom.add(boomPost);
  truck.add(boom);

  const chain = new Group();
  chain.name = 'Tow truck hanging realistic chain tow rope';
  for (let index = 0; index < 18; index += 1) {
    const link = new Mesh(new TorusGeometry(0.11, 0.018, 6, 14), chainMaterial);
    link.name = 'Tow chain oval metal link';
    link.position.set(0, -index * 0.09, index * 0.055);
    link.scale.set(0.62, 1, 1.28);
    link.rotation.set(index % 2 === 0 ? Math.PI / 2 : 0, 0, index % 2 === 0 ? 0 : Math.PI / 2);
    link.castShadow = true;
    chain.add(link);
  }
  chain.position.set(0, 3.08, 2.52);
  truck.add(chain);

  const hook = new Group();
  hook.name = 'Tow chain large hook';
  const hookMesh = new Mesh(new TorusGeometry(0.18, 0.028, 8, 18, Math.PI * 1.35), chainMaterial);
  hookMesh.name = 'Tow truck chain curved hook';
  hookMesh.rotation.x = Math.PI / 2;
  hookMesh.castShadow = true;
  hook.add(hookMesh);
  hook.position.set(0, 1.45, 3.1);
  truck.add(hook);

  const wheels = [
    addTruckWheel(truck, -1.54, -1.95),
    addTruckWheel(truck, 1.54, -1.95),
    addTruckWheel(truck, -1.54, 1.72),
    addTruckWheel(truck, 1.54, 1.72),
  ];

  return { root: truck, wheels, chain, hook };
}

function addGarage(root: Group, colliders: CollisionBox[]): { buttonPosition: Vector3; bayCenter: Vector3 } {
  const garage = new Group();
  garage.name = 'Chapter 12 corner repair garage';
  garage.position.set(-FIELD_HALF_SIZE + 26, 0, FIELD_HALF_SIZE - 28);
  garage.rotation.y = 0.18;
  addBox(garage, 'Garage concrete back wall', [13, 4.5, 0.32], [0, 2.25, 4.6], garageMaterial);
  addBox(garage, 'Garage left wall', [0.32, 4.5, 9.4], [-6.35, 2.25, 0], garageMaterial);
  addBox(garage, 'Garage right wall', [0.32, 4.5, 9.4], [6.35, 2.25, 0], garageMaterial);
  addBox(garage, 'Garage low roof', [13.6, 0.38, 9.8], [0, 4.72, 0], garageRoofMaterial);
  addBox(garage, 'Garage concrete floor', [12.6, 0.16, 9.1], [0, 0.02, 0], new MeshStandardMaterial({ color: 0x77716b, roughness: 0.82 }));
  addBox(garage, 'Garage red repair button post', [0.22, 1.18, 0.22], [-5.15, 0.66, -3.7], blackTrimMaterial);
  addBox(garage, 'Garage red repair button', [0.58, 0.24, 0.18], [-5.15, 1.3, -3.55], redButtonMaterial);
  const sign = new Mesh(new BoxGeometry(4.8, 0.9, 0.08), createTextMaterial('REPAIR GARAGE', 512, 128));
  sign.name = 'Repair garage sign';
  sign.position.set(0, 3.4, 4.42);
  garage.add(sign);
  root.add(garage);

  const wallPositions = [
    garage.localToWorld(new Vector3(0, 0, 4.6)),
    garage.localToWorld(new Vector3(-6.35, 0, 0)),
    garage.localToWorld(new Vector3(6.35, 0, 0)),
  ];
  addCollider(colliders, wallPositions[0].x, wallPositions[0].z, 6.7, 0.25, garage.rotation.y);
  addCollider(colliders, wallPositions[1].x, wallPositions[1].z, 0.25, 4.9, garage.rotation.y);
  addCollider(colliders, wallPositions[2].x, wallPositions[2].z, 0.25, 4.9, garage.rotation.y);
  return {
    buttonPosition: garage.localToWorld(new Vector3(-5.15, 1.3, -3.55)),
    bayCenter: garage.localToWorld(new Vector3(0, 0, -0.6)),
  };
}

export function createChapterTwelve(): ChapterTwelveData {
  const root = new Group();
  root.name = 'Chapter 12: The Truck Game';
  const colliders: CollisionBox[] = [];
  const mudZones: MudZone[] = [];
  const treeCenters: Array<{ x: number; z: number; radius: number }> = [];

  const ground = new Mesh(new BoxGeometry(FIELD_HALF_SIZE * 2, 0.12, FIELD_HALF_SIZE * 2), grassMaterial);
  ground.name = 'Chapter 12 big open grassy field';
  ground.position.set(0, -0.06, 0);
  ground.receiveShadow = true;
  root.add(ground);

  addMudPatch(root, mudZones, 'Chapter 12 main open mud pit', 0, 0, 104, 78, 0.05, 1.15);
  addMudPatch(root, mudZones, 'Chapter 12 left muddy truck trail', -58, -18, 28, 136, -0.33, 0.95);
  addMudPatch(root, mudZones, 'Chapter 12 right muddy truck trail', 58, 20, 30, 130, 0.38, 0.98);
  addMudPatch(root, mudZones, 'Chapter 12 rear muddy straightaway', 0, -76, 138, 20, 0.02, 0.72);
  addMudPatch(root, mudZones, 'Chapter 12 front muddy straightaway', 4, 82, 134, 22, -0.08, 0.76);
  addMudPatch(root, mudZones, 'Chapter 12 deep corner bog', -92, 78, 34, 42, 0.28, 1.55);
  addMudPatch(root, mudZones, 'Chapter 12 watery hydroplane mud stretch', 86, -76, 52, 28, -0.16, 0.58);

  addMudJump(root, -28, -20, 0.22, 1.05);
  addMudJump(root, 35, 22, -0.42, 1.12);
  addMudJump(root, -2, 58, 0.05, 0.92);
  addMudJump(root, 44, -60, -0.2, 0.96);
  addMudJump(root, -68, -64, 0.45, 0.94);

  const truck = createFordF250();
  root.add(truck.root);
  const towTruck = createTowTruck();
  root.add(towTruck.root);
  const garage = addGarage(root, colliders);

  const treePositions: Array<[number, number, number]> = [];
  for (let index = 0; index < 28; index += 1) {
    const t = index / 28;
    treePositions.push([-FIELD_HALF_SIZE + 4 + Math.sin(index * 1.7) * 2.4, -FIELD_HALF_SIZE + 10 + t * (FIELD_HALF_SIZE * 2 - 20), 0.8 + (index % 4) * 0.08]);
    treePositions.push([FIELD_HALF_SIZE - 4 + Math.cos(index * 1.4) * 2.4, -FIELD_HALF_SIZE + 10 + t * (FIELD_HALF_SIZE * 2 - 20), 0.84 + (index % 3) * 0.1]);
  }
  for (let index = 0; index < 20; index += 1) {
    const t = index / 20;
    treePositions.push([-FIELD_HALF_SIZE + 14 + t * (FIELD_HALF_SIZE * 2 - 28), -FIELD_HALF_SIZE + 4 + Math.cos(index * 1.9) * 2.2, 0.9]);
    treePositions.push([-FIELD_HALF_SIZE + 14 + t * (FIELD_HALF_SIZE * 2 - 28), FIELD_HALF_SIZE - 4 + Math.sin(index * 1.2) * 2.2, 0.94]);
  }
  for (let index = 0; index < 18; index += 1) {
    treePositions.push([
      -110 + Math.sin(index * 1.22) * 24,
      -98 + index * 9.5 + Math.cos(index * 0.83) * 5,
      0.76 + (index % 5) * 0.07,
    ]);
  }
  treePositions.forEach(([x, z, scale]) => {
    addTree(root, colliders, x, z, scale);
    treeCenters.push({ x, z, radius: 0.9 * scale });
  });

  addCollider(colliders, 0, -FIELD_HALF_SIZE, FIELD_HALF_SIZE, 1);
  addCollider(colliders, 0, FIELD_HALF_SIZE, FIELD_HALF_SIZE, 1);
  addCollider(colliders, -FIELD_HALF_SIZE, 0, 1, FIELD_HALF_SIZE);
  addCollider(colliders, FIELD_HALF_SIZE, 0, 1, FIELD_HALF_SIZE);
  const f250Collider: CollisionBox = { centerX: truck.root.position.x, centerZ: truck.root.position.z, halfWidth: 1.9, halfDepth: 3.2, rotationY: truck.root.rotation.y };
  const towCollider: CollisionBox = { centerX: towTruck.root.position.x, centerZ: towTruck.root.position.z, halfWidth: 1.9, halfDepth: 3.0, rotationY: towTruck.root.rotation.y };
  colliders.push(f250Collider, towCollider);

  const spawn = new Vector3(-14, GAME_CONFIG.player.height, 14);
  const lookTarget = new Vector3(-8, GAME_CONFIG.player.height * 0.9, 9);
  const velocity = new Vector3();
  let driving = false;
  let activeVehicle: ChapterTwelveVehicleId = 'f250';
  let towChainHeld = false;
  let towChainAttached = false;
  let repairTimer = 0;
  let lastEventMessage = '';
  let eventMessageTimer = 0;
  let pendingEventCue: ChapterTwelveEventCue | null = null;

  const vehicles: Record<ChapterTwelveVehicleId, ChapterTwelveVehicle> = {
    f250: {
      id: 'f250',
      label: 'Ford F250 Super Duty',
      root: truck.root,
      wheels: truck.wheels,
      collider: f250Collider,
      spawn: new Vector3(-8, 0, 9),
      spawnRotationY: -0.28,
      speed: 0,
      stuckAmount: 0,
      damaged: false,
    },
    tow: {
      id: 'tow',
      label: 'tow truck',
      root: towTruck.root,
      wheels: towTruck.wheels,
      collider: towCollider,
      spawn: new Vector3(FIELD_HALF_SIZE - 28, 0, FIELD_HALF_SIZE - 30),
      spawnRotationY: -2.35,
      speed: 0,
      stuckAmount: 0,
      damaged: false,
    },
  };

  const getActiveVehicle = (): ChapterTwelveVehicle => vehicles[activeVehicle];

  const setEventMessage = (message: string, duration = 2.8, cue: ChapterTwelveEventCue | null = null): void => {
    if (eventMessageTimer > 0 && lastEventMessage === message) {
      return;
    }
    lastEventMessage = message;
    eventMessageTimer = duration;
    if (cue) {
      pendingEventCue = cue;
    }
  };

  const updateVehicleCollider = (vehicle: ChapterTwelveVehicle): void => {
    vehicle.collider.centerX = vehicle.root.position.x;
    vehicle.collider.centerZ = vehicle.root.position.z;
    vehicle.collider.rotationY = vehicle.root.rotation.y;
    vehicle.collider.enabled = !(driving && activeVehicle === vehicle.id);
  };

  const updateAllVehicleColliders = (): void => {
    updateVehicleCollider(vehicles.f250);
    updateVehicleCollider(vehicles.tow);
  };

  const getLocalWorldPosition = (vehicle: ChapterTwelveVehicle, x: number, y: number, z: number, target = new Vector3()): Vector3 => {
    target.set(x, y, z);
    return vehicle.root.localToWorld(target);
  };

  const clampVehicleToField = (vehicle: ChapterTwelveVehicle): void => {
    vehicle.root.position.x = MathUtils.clamp(vehicle.root.position.x, -FIELD_HALF_SIZE + 7, FIELD_HALF_SIZE - 7);
    vehicle.root.position.z = MathUtils.clamp(vehicle.root.position.z, -FIELD_HALF_SIZE + 7, FIELD_HALF_SIZE - 7);
  };

  const getMudDepthAt = (x: number, z: number): number => {
    let depth = 0;
    mudZones.forEach((zone) => {
      const dx = x - zone.x;
      const dz = z - zone.z;
      const cos = Math.cos(-zone.rotationY);
      const sin = Math.sin(-zone.rotationY);
      const localX = dx * cos - dz * sin;
      const localZ = dx * sin + dz * cos;
      if (Math.abs(localX) <= zone.width * 0.5 && Math.abs(localZ) <= zone.depth * 0.5) {
        const centerFalloff = 1 - Math.max(Math.abs(localX) / (zone.width * 0.5), Math.abs(localZ) / (zone.depth * 0.5)) * 0.32;
        depth = Math.max(depth, zone.sinkDepth * MathUtils.clamp(centerFalloff, 0.38, 1));
      }
    });
    return depth;
  };

  const getDistanceToTowChain = (playerPosition: Vector3): number => playerPosition.distanceTo(towTruck.hook.getWorldPosition(new Vector3()));
  const getDistanceToGarageButton = (playerPosition: Vector3): number => playerPosition.distanceTo(garage.buttonPosition);

  const resetVehicle = (vehicle: ChapterTwelveVehicle): void => {
    vehicle.root.position.copy(vehicle.spawn);
    vehicle.root.rotation.set(0, vehicle.spawnRotationY, 0);
    vehicle.speed = 0;
    vehicle.stuckAmount = 0;
    vehicle.damaged = false;
    updateVehicleCollider(vehicle);
  };

  const applyTowPull = (deltaSeconds: number): void => {
    if (!towChainAttached || activeVehicle !== 'tow' || !driving) {
      return;
    }

    const f250 = vehicles.f250;
    const tow = vehicles.tow;
    const towRear = getLocalWorldPosition(tow, 0, 0, 3.05);
    const toTow = towRear.clone().sub(f250.root.position);
    const distance = Math.hypot(toTow.x, toTow.z);
    if (distance > 5.4) {
      const pullStep = Math.min(distance - 5.2, Math.max(0.3, Math.abs(tow.speed)) * deltaSeconds * 0.58);
      f250.root.position.x += (toTow.x / distance) * pullStep;
      f250.root.position.z += (toTow.z / distance) * pullStep;
      f250.root.rotation.y = MathUtils.lerp(f250.root.rotation.y, Math.atan2(-toTow.x, -toTow.z), 0.05);
      f250.stuckAmount = Math.max(0, f250.stuckAmount - deltaSeconds * 0.65);
      updateVehicleCollider(f250);
    }
  };

  updateAllVehicleColliders();

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    isDriving(): boolean {
      return driving;
    },
    isNearTruck(playerPosition: Vector3): boolean {
      return playerPosition.distanceTo(vehicles.f250.root.position) <= TRUCK_INTERACT_DISTANCE
        || playerPosition.distanceTo(vehicles.tow.root.position) <= TRUCK_INTERACT_DISTANCE
        || getDistanceToTowChain(playerPosition) <= TOW_CHAIN_INTERACT_DISTANCE
        || getDistanceToGarageButton(playerPosition) <= GARAGE_BUTTON_INTERACT_DISTANCE;
    },
    interact(playerPosition: Vector3): { message: string; cameraPosition?: Vector3; lookTarget?: Vector3 } {
      if (driving) {
        const vehicle = getActiveVehicle();
        driving = false;
        vehicle.speed = 0;
        updateVehicleCollider(vehicle);
        return {
          message: `You climb out of the ${vehicle.label}.`,
          cameraPosition: getLocalWorldPosition(vehicle, -3.25, GAME_CONFIG.player.height, 0.35),
          lookTarget: vehicle.root.position.clone().add(new Vector3(0, 1.4, 0)),
        };
      }

      if (getDistanceToGarageButton(playerPosition) <= GARAGE_BUTTON_INTERACT_DISTANCE) {
        const f250 = vehicles.f250;
        if (f250.root.position.distanceTo(garage.bayCenter) > 11) {
          return { message: 'Park the Ford F250 inside the garage bay, then press E on the red button.' };
        }
        repairTimer = 10;
        setEventMessage('The garage starts hammering and drilling. Repairing the F250...', 10, 'repair');
        return { message: 'Repair started. Hammers and drills work for 10 seconds.' };
      }

      if (getDistanceToTowChain(playerPosition) <= TOW_CHAIN_INTERACT_DISTANCE && !towChainHeld && !towChainAttached) {
        towChainHeld = true;
        towTruck.chain.visible = false;
        pendingEventCue = 'chain';
        return { message: 'You pick up the tow chain. Bring the hook to the stuck F250 and press E to attach it.' };
      }

      if (towChainHeld && playerPosition.distanceTo(vehicles.f250.root.position) <= TRUCK_INTERACT_DISTANCE + 1.8) {
        towChainHeld = false;
        towChainAttached = true;
        towTruck.chain.visible = true;
        pendingEventCue = 'chain';
        return { message: 'The chain hooks onto the F250 bumper. Drive the tow truck forward to pull it out.' };
      }

      const f250Distance = playerPosition.distanceTo(vehicles.f250.root.position);
      const towDistance = playerPosition.distanceTo(vehicles.tow.root.position);
      if (towDistance <= TRUCK_INTERACT_DISTANCE && towDistance < f250Distance) {
        activeVehicle = 'tow';
      } else if (f250Distance <= TRUCK_INTERACT_DISTANCE) {
        activeVehicle = 'f250';
      } else {
        return { message: 'Move closer to the F250, tow truck, tow chain, or garage repair button.' };
      }

      const vehicle = getActiveVehicle();
      driving = true;
      updateAllVehicleColliders();
      return {
        message: `You get in the ${vehicle.label}. Use W/S to drive, A/D to steer, Shift for more speed, and E to get out.`,
        cameraPosition: getLocalWorldPosition(vehicle, -0.48, 2.28, -0.78),
        lookTarget: getLocalWorldPosition(vehicle, -0.48, 2.15, -9),
      };
    },
    getDriverCameraPosition(target = new Vector3()): Vector3 {
      return getLocalWorldPosition(getActiveVehicle(), -0.48, 2.28, -0.78, target);
    },
    getDriverLookTarget(target = new Vector3()): Vector3 {
      return getLocalWorldPosition(getActiveVehicle(), -0.48, 2.1, -9, target);
    },
    getSpeedMph(): number {
      return Math.round(Math.abs(getActiveVehicle().speed) * 3.1);
    },
    getDrivingStatus(): string {
      const vehicle = getActiveVehicle();
      const parts = [`Speed: ${Math.round(Math.abs(vehicle.speed) * 3.1)} MPH`];
      if (vehicle.damaged) {
        parts.push('engine damaged');
      }
      if (vehicle.stuckAmount > 0.72) {
        parts.push('stuck in mud');
      } else if (vehicle.stuckAmount > 0.28) {
        parts.push('sinking in mud');
      }
      if (towChainHeld) {
        parts.push('holding tow chain');
      }
      if (towChainAttached) {
        parts.push('tow chain attached');
      }
      if (repairTimer > 0) {
        parts.push(`repairing ${Math.ceil(repairTimer)}s`);
      }
      if (eventMessageTimer > 0 && lastEventMessage) {
        parts.push(lastEventMessage);
      }
      return parts.join(' / ');
    },
    consumeEventCue(): ChapterTwelveEventCue | null {
      const cue = pendingEventCue;
      pendingEventCue = null;
      return cue;
    },
    update(deltaSeconds: number, input: MovementState = { forward: 0, strafe: 0, sprint: false }): void {
      eventMessageTimer = Math.max(0, eventMessageTimer - deltaSeconds);
      if (repairTimer > 0) {
        repairTimer = Math.max(0, repairTimer - deltaSeconds);
        if (repairTimer === 0) {
          vehicles.f250.damaged = false;
          vehicles.f250.stuckAmount = 0;
          setEventMessage('The garage repair is finished. The F250 engine runs normally again.', 4, 'repair');
        }
      }

      if (driving) {
        const vehicle = getActiveVehicle();
        const mudDepth = getMudDepthAt(vehicle.root.position.x, vehicle.root.position.z);
        const speedMph = Math.abs(vehicle.speed) * 3.1;
        const hydroplaning = mudDepth > 0.2 && speedMph >= 60;
        if (mudDepth > 0.2 && !hydroplaning) {
          vehicle.stuckAmount = MathUtils.clamp(vehicle.stuckAmount + deltaSeconds * mudDepth * Math.max(0.22, 1 - Math.abs(vehicle.speed) / 18), 0, 1.35);
        } else {
          vehicle.stuckAmount = Math.max(0, vehicle.stuckAmount - deltaSeconds * (hydroplaning ? 0.45 : 0.2));
        }

        const stuckDrag = MathUtils.clamp(vehicle.stuckAmount, 0, 1);
        const damageScale = vehicle.damaged ? 0.35 : 1;
        const acceleration = input.forward * (input.forward >= 0 ? 18 : 10.5) * damageScale * (1 - stuckDrag * 0.78);
        vehicle.speed += acceleration * deltaSeconds;
        vehicle.speed *= Math.pow(mudDepth > 0 ? (hydroplaning ? 0.76 : 0.22 + (1 - stuckDrag) * 0.36) : 0.46, deltaSeconds);
        vehicle.speed = MathUtils.clamp(vehicle.speed, -8, input.sprint ? 28 : 21);
        if (Math.abs(input.forward) < 0.01 && Math.abs(vehicle.speed) < 0.08) {
          vehicle.speed = 0;
        }

        if (mudDepth > 0.2 && Math.abs(input.forward) > 0.1 && vehicle.stuckAmount > 0.55) {
          setEventMessage('Tires grind and spin. Mud splatters around the truck.', 0.6, 'mud-grind');
        } else if (hydroplaning) {
          setEventMessage('The tires skim across the wet mud with a big splash.', 0.7, 'mud-splash');
        }

        const steerStrength = MathUtils.clamp(Math.abs(vehicle.speed) / 11, 0.16, 1);
        vehicle.root.rotation.y -= input.strafe * steerStrength * Math.sign(vehicle.speed || 1) * 1.18 * deltaSeconds;
        velocity.set(-Math.sin(vehicle.root.rotation.y), 0, -Math.cos(vehicle.root.rotation.y)).multiplyScalar(vehicle.speed * deltaSeconds);
        vehicle.root.position.add(velocity);
        clampVehicleToField(vehicle);

        treeCenters.forEach((tree) => {
          const distance = Math.hypot(vehicle.root.position.x - tree.x, vehicle.root.position.z - tree.z);
          if (distance < tree.radius + 1.25 && Math.abs(vehicle.speed) > 5) {
            vehicle.damaged = true;
            vehicle.speed *= -0.16;
            setEventMessage('Smash! The truck hit a tree and the engine is damaged.', 4, 'tree-smash');
          }
        });

        vehicle.wheels.forEach((wheel) => {
          wheel.rotation.x += vehicle.speed * deltaSeconds * 1.85;
        });
        updateVehicleCollider(vehicle);
        applyTowPull(deltaSeconds);
      }

      Object.values(vehicles).forEach((vehicle) => {
        const mudDepth = getMudDepthAt(vehicle.root.position.x, vehicle.root.position.z);
        const sink = Math.min(0.46, vehicle.stuckAmount * 0.32 + mudDepth * 0.08);
        const rumble = Math.sin(performance.now() * 0.004 + (vehicle.id === 'tow' ? 2 : 0)) * MathUtils.clamp(Math.abs(vehicle.speed) / 90, 0, 0.04);
        vehicle.root.position.y = 0.04 - sink + rumble;
      });
    },
    reset(): void {
      driving = false;
      activeVehicle = 'f250';
      towChainHeld = false;
      towChainAttached = false;
      towTruck.chain.visible = true;
      repairTimer = 0;
      lastEventMessage = '';
      eventMessageTimer = 0;
      pendingEventCue = null;
      resetVehicle(vehicles.f250);
      resetVehicle(vehicles.tow);
    },
  };
}
