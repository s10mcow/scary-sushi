import {
  BoxGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  TubeGeometry,
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
const TREE_SPACING = 32;
const TREE_SKIP_CHANCE = 0.38;
const RAINBOW_CHANCE = 0.12;
const JACKALOPE_CHANCE = 0.36;
const MAGICAL_FOX_CHANCE = 0.12;

const grassMaterial = new MeshStandardMaterial({ color: 0xf3a1ca, roughness: 0.92 });
const grassPatchMaterial = new MeshStandardMaterial({ color: 0xf8bad7, roughness: 0.96 });
const barkMaterial = new MeshStandardMaterial({ color: 0x7a4b37, roughness: 0.82 });
const blossomMaterial = new MeshStandardMaterial({ color: 0xffb6d8, roughness: 0.84 });
const paleBlossomMaterial = new MeshStandardMaterial({ color: 0xffd9e9, roughness: 0.86 });
const darkBlossomMaterial = new MeshStandardMaterial({ color: 0xec82bd, roughness: 0.88 });
const butterflyWingGeometry = new PlaneGeometry(0.18, 0.12);
const butterflyMaterials = [
  new MeshBasicMaterial({ color: 0xfff06a, side: DoubleSide }),
  new MeshBasicMaterial({ color: 0x8ff7ff, side: DoubleSide }),
  new MeshBasicMaterial({ color: 0xd778ff, side: DoubleSide }),
  new MeshBasicMaterial({ color: 0xff8fca, side: DoubleSide }),
];
const magicalDeerBodyMaterial = new MeshStandardMaterial({ color: 0xd8a16f, roughness: 0.74 });
const magicalDeerBellyMaterial = new MeshStandardMaterial({ color: 0xffe2d2, roughness: 0.78 });
const magicalDeerEarMaterial = new MeshStandardMaterial({ color: 0xffb7d3, roughness: 0.8 });
const magicalDeerAntlerMaterial = new MeshStandardMaterial({ color: 0xfff4c8, roughness: 0.5, emissive: 0xffd38a, emissiveIntensity: 0.18 });
const magicalDeerEyeMaterial = new MeshBasicMaterial({ color: 0x25131b });
const magicalFoxFurMaterial = new MeshStandardMaterial({ color: 0xff8b38, roughness: 0.72, emissive: 0x7d2400, emissiveIntensity: 0.08 });
const magicalFoxWhiteFurMaterial = new MeshStandardMaterial({ color: 0xffefe0, roughness: 0.82 });
const magicalFoxTailTipMaterial = new MeshStandardMaterial({ color: 0xfff8d8, roughness: 0.5, emissive: 0xffd36f, emissiveIntensity: 0.18 });
const magicalFoxEyeMaterial = new MeshBasicMaterial({ color: 0x1c1111 });
const rainbowMaterials = [
  0xff4d5e,
  0xff9f1c,
  0xffef3d,
  0x4eda63,
  0x31b7ff,
  0x5b5cff,
  0xb45cff,
].map((color) => new MeshBasicMaterial({ color }));

function hash2d(x: number, z: number, salt = 0): number {
  const value = Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453123;
  return value - Math.floor(value);
}

function rotationYForPositiveX(deltaX: number, deltaZ: number): number {
  return Math.atan2(-deltaZ, deltaX);
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

function createRainbowArc(localX: number, localZ: number, rotationY: number, scale: number): Group {
  const rainbow = new Group();
  rainbow.name = "Maggie's World sky rainbow";
  rainbow.position.set(localX, 11 + scale * 2.4, localZ);
  rainbow.rotation.y = rotationY;

  rainbowMaterials.forEach((material, index) => {
    const radius = (13.8 - index * 0.45) * scale;
    const points: Vector3[] = [];
    for (let step = 0; step <= 28; step += 1) {
      const angle = Math.PI - (step / 28) * Math.PI;
      points.push(new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
    }
    const curve = new CatmullRomCurve3(points);
    const band = new Mesh(new TubeGeometry(curve, 34, 0.16 * scale, 8, false), material);
    band.name = "Maggie's World colored rainbow band";
    band.raycast = () => undefined;
    rainbow.add(band);
  });

  return rainbow;
}

function createButterfly(localX: number, localZ: number, seed: number): Group {
  const butterfly = new Group();
  butterfly.name = "Maggie's World flat butterfly";
  butterfly.userData.baseX = localX;
  butterfly.userData.baseZ = localZ;
  butterfly.userData.baseY = 1.6 + hash2d(seed, seed, 1) * 1.4;
  butterfly.userData.seed = seed;
  butterfly.position.set(localX, butterfly.userData.baseY, localZ);

  const material = butterflyMaterials[Math.floor(hash2d(seed, seed, 2) * butterflyMaterials.length) % butterflyMaterials.length];
  const leftWing = new Mesh(butterflyWingGeometry, material);
  leftWing.name = 'Flat butterfly left wing';
  leftWing.position.x = -0.075;
  leftWing.rotation.y = -0.5;
  leftWing.raycast = () => undefined;
  butterfly.add(leftWing);

  const rightWing = new Mesh(butterflyWingGeometry, material);
  rightWing.name = 'Flat butterfly right wing';
  rightWing.position.x = 0.075;
  rightWing.rotation.y = 0.5;
  rightWing.raycast = () => undefined;
  butterfly.add(rightWing);

  const body = new Mesh(new BoxGeometry(0.035, 0.13, 0.035), new MeshBasicMaterial({ color: 0x3b2536, side: DoubleSide }));
  body.name = 'Flat butterfly body';
  body.raycast = () => undefined;
  butterfly.add(body);

  return butterfly;
}

function animateButterflies(root: Group, timeSeconds: number): void {
  root.traverse((object) => {
    if (!(object instanceof Group) || object.name !== "Maggie's World flat butterfly") {
      return;
    }
    const seed = Number(object.userData.seed ?? 0);
    const baseX = Number(object.userData.baseX ?? object.position.x);
    const baseY = Number(object.userData.baseY ?? object.position.y);
    const baseZ = Number(object.userData.baseZ ?? object.position.z);
    const speed = 0.8 + hash2d(seed, seed, 4) * 0.65;
    const phase = timeSeconds * speed + seed * 0.37;
    object.position.set(
      baseX + Math.sin(phase * 0.9) * 1.2,
      baseY + Math.sin(phase * 2.4) * 0.28,
      baseZ + Math.cos(phase * 0.75) * 1.1,
    );
    object.rotation.y = Math.sin(phase * 0.6) * 0.8;

    const flap = 0.35 + Math.sin(phase * 8.5) * 0.45;
    const leftWing = object.children[0];
    const rightWing = object.children[1];
    leftWing.rotation.y = -flap;
    rightWing.rotation.y = flap;
  });
}

function addBox(root: Group, name: string, size: [number, number, number], position: [number, number, number], material: MeshStandardMaterial | MeshBasicMaterial): Mesh {
  const mesh = new Mesh(new BoxGeometry(size[0], size[1], size[2]), material);
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

function addSphere(root: Group, name: string, position: [number, number, number], scale: [number, number, number], material: MeshStandardMaterial | MeshBasicMaterial): Mesh {
  const mesh = new Mesh(new SphereGeometry(1, 16, 10), material);
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.scale.set(scale[0], scale[1], scale[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

function addTaperedEar(root: Group, name: string, position: [number, number, number], side: -1 | 1): void {
  const ear = new Mesh(new SphereGeometry(1, 12, 8), magicalDeerEarMaterial);
  ear.name = name;
  ear.position.set(position[0], position[1], position[2]);
  ear.scale.set(0.08, 0.34, 0.055);
  ear.rotation.z = 0.18;
  ear.rotation.x = side * 0.16;
  ear.castShadow = true;
  root.add(ear);

  const inner = new Mesh(new SphereGeometry(1, 10, 6), magicalDeerBellyMaterial);
  inner.name = `${name} soft inner ear`;
  inner.position.set(position[0] + 0.018, position[1] - 0.01, position[2] + side * 0.008);
  inner.scale.set(0.04, 0.22, 0.026);
  inner.rotation.copy(ear.rotation);
  root.add(inner);
}

function addCylinderBetween(root: Group, name: string, start: Vector3, end: Vector3, radius: number, material: MeshStandardMaterial): Mesh {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const mesh = new Mesh(new CylinderGeometry(radius, radius, length, 7), material);
  mesh.name = name;
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  root.add(mesh);
  return mesh;
}

function addPointedCone(root: Group, name: string, position: [number, number, number], radius: number, height: number, material: MeshStandardMaterial, rotation: [number, number, number]): Mesh {
  const cone = new Mesh(new ConeGeometry(radius, height, 10), material);
  cone.name = name;
  cone.position.set(position[0], position[1], position[2]);
  cone.rotation.set(rotation[0], rotation[1], rotation[2]);
  cone.castShadow = true;
  cone.receiveShadow = true;
  root.add(cone);
  return cone;
}

function addJackalopeAntler(root: Group, side: -1 | 1): void {
  const base = new Vector3(0.51, 1.12, side * 0.095);
  const tip = new Vector3(0.58, 1.46, side * 0.13);
  addCylinderBetween(root, 'Branching jackalope antler main stem', base, tip, 0.018, magicalDeerAntlerMaterial);
  addCylinderBetween(
    root,
    'Branching jackalope antler front tine',
    new Vector3(0.55, 1.32, side * 0.12),
    new Vector3(0.42, 1.43, side * 0.25),
    0.014,
    magicalDeerAntlerMaterial,
  );
  addCylinderBetween(
    root,
    'Branching jackalope antler rear tine',
    new Vector3(0.57, 1.37, side * 0.12),
    new Vector3(0.72, 1.48, side * 0.24),
    0.013,
    magicalDeerAntlerMaterial,
  );
}

function createJackalope(localX: number, localZ: number, seed: number): Group {
  const jackalope = new Group();
  jackalope.name = "Maggie's World wandering jackalope";
  jackalope.userData.baseX = localX;
  jackalope.userData.baseZ = localZ;
  jackalope.userData.seed = seed;
  jackalope.position.set(localX, 0, localZ);
  jackalope.rotation.y = hash2d(seed, seed, 1) * Math.PI * 2;

  addSphere(jackalope, 'Small jackalope rabbit-deer body', [0, 0.56, 0], [0.56, 0.3, 0.25], magicalDeerBodyMaterial);
  addSphere(jackalope, 'Small jackalope pale belly', [0.03, 0.52, -0.01], [0.43, 0.2, 0.2], magicalDeerBellyMaterial);
  addSphere(jackalope, 'Small jackalope head with deer muzzle', [0.55, 0.82, 0], [0.25, 0.22, 0.2], magicalDeerBodyMaterial);
  addSphere(jackalope, 'Small jackalope pale muzzle', [0.77, 0.78, 0], [0.12, 0.08, 0.09], magicalDeerBellyMaterial);
  addSphere(jackalope, 'Small jackalope left visible eye', [0.74, 0.9, -0.08], [0.058, 0.058, 0.058], magicalDeerEyeMaterial);
  addSphere(jackalope, 'Small jackalope right visible eye', [0.74, 0.9, 0.08], [0.058, 0.058, 0.058], magicalDeerEyeMaterial);
  addSphere(jackalope, 'Small jackalope left eye shine', [0.775, 0.918, -0.103], [0.018, 0.018, 0.018], magicalDeerBellyMaterial);
  addSphere(jackalope, 'Small jackalope right eye shine', [0.775, 0.918, 0.103], [0.018, 0.018, 0.018], magicalDeerBellyMaterial);
  addSphere(jackalope, 'Small jackalope bunny tail', [-0.55, 0.64, 0], [0.13, 0.13, 0.13], magicalDeerBellyMaterial);

  for (const [index, z] of [-0.15, 0.15].entries()) {
    const rearLeg = addBox(jackalope, 'Small jackalope back hopping leg', [0.08, 0.46, 0.08], [-0.28, 0.25, z], magicalDeerBodyMaterial);
    rearLeg.userData.legPhase = index === 0 ? 0 : Math.PI;
    const frontLeg = addBox(jackalope, 'Small jackalope front deer leg', [0.065, 0.42, 0.065], [0.28, 0.22, z], magicalDeerBodyMaterial);
    frontLeg.userData.legPhase = index === 0 ? Math.PI : 0;
  }

  addTaperedEar(jackalope, 'Small jackalope realistic long bunny ear', [0.45, 1.18, -0.1], -1);
  addTaperedEar(jackalope, 'Small jackalope realistic long bunny ear', [0.45, 1.18, 0.1], 1);

  addJackalopeAntler(jackalope, -1);
  addJackalopeAntler(jackalope, 1);

  return jackalope;
}

function animateJackalopes(root: Group, timeSeconds: number): void {
  root.traverse((object) => {
    if (!(object instanceof Group) || object.name !== "Maggie's World wandering jackalope") {
      return;
    }
    const seed = Number(object.userData.seed ?? 0);
    const baseX = Number(object.userData.baseX ?? object.position.x);
    const baseZ = Number(object.userData.baseZ ?? object.position.z);
    const speed = 0.22 + hash2d(seed, seed, 5) * 0.18;
    const phase = timeSeconds * speed + seed * 0.11;
    const walkX = Math.sin(phase) * 4.2;
    const walkZ = Math.cos(phase * 0.82) * 3.6;
    const nextX = baseX + Math.sin(phase + 0.08) * 4.2;
    const nextZ = baseZ + Math.cos((phase + 0.08) * 0.82) * 3.6;
    object.position.set(baseX + walkX, Math.max(0, Math.sin(timeSeconds * speed * 8 + seed) * 0.035), baseZ + walkZ);
    object.rotation.y = rotationYForPositiveX(nextX - object.position.x, nextZ - object.position.z);

    object.children.forEach((child) => {
      if (!child.name.includes('leg')) {
        return;
      }
      const legPhase = Number(child.userData.legPhase ?? 0);
      child.rotation.z = Math.sin(timeSeconds * speed * 12 + legPhase) * 0.18;
    });
  });
}

function addMagicalFoxTail(root: Group, sideOffset: number, lift: number, fan: number): void {
  const tail = new Mesh(new SphereGeometry(1, 16, 10), magicalFoxFurMaterial);
  tail.name = 'Magical fox flowing orange tail';
  tail.position.set(-0.72, 0.76 + lift, sideOffset);
  tail.scale.set(0.16, 0.18, 0.72);
  tail.rotation.y = fan;
  tail.rotation.z = -0.58;
  tail.castShadow = true;
  root.add(tail);

  const tip = new Mesh(new SphereGeometry(1, 12, 8), magicalFoxTailTipMaterial);
  tip.name = 'Magical fox glowing white tail tip';
  tip.position.set(-1.04, 1.08 + lift, sideOffset + Math.sin(fan) * 0.34);
  tip.scale.set(0.13, 0.12, 0.2);
  tip.castShadow = true;
  root.add(tip);
}

function createMagicalFox(localX: number, localZ: number, seed: number): Group {
  const fox = new Group();
  fox.name = "Maggie's World magical five-tailed fox";
  fox.userData.baseX = localX;
  fox.userData.baseZ = localZ;
  fox.userData.seed = seed;
  fox.position.set(localX, 0, localZ);
  fox.rotation.y = hash2d(seed, seed, 20) * Math.PI * 2;

  addSphere(fox, 'Magical fox slim pointed body', [0, 0.66, 0], [0.64, 0.27, 0.22], magicalFoxFurMaterial);
  addSphere(fox, 'Magical fox white chest', [0.22, 0.7, 0], [0.26, 0.22, 0.18], magicalFoxWhiteFurMaterial);
  addSphere(fox, 'Magical fox sharp head', [0.68, 0.9, 0], [0.24, 0.18, 0.17], magicalFoxFurMaterial);
  addPointedCone(fox, 'Magical fox pointy muzzle', [0.91, 0.86, 0], 0.12, 0.28, magicalFoxWhiteFurMaterial, [0, 0, -Math.PI / 2]);
  addSphere(fox, 'Magical fox left clear eye', [0.78, 0.96, -0.085], [0.045, 0.045, 0.045], magicalFoxEyeMaterial);
  addSphere(fox, 'Magical fox right clear eye', [0.78, 0.96, 0.085], [0.045, 0.045, 0.045], magicalFoxEyeMaterial);
  addSphere(fox, 'Magical fox left eye shine', [0.805, 0.976, -0.106], [0.014, 0.014, 0.014], magicalFoxWhiteFurMaterial);
  addSphere(fox, 'Magical fox right eye shine', [0.805, 0.976, 0.106], [0.014, 0.014, 0.014], magicalFoxWhiteFurMaterial);

  addPointedCone(fox, 'Magical fox tall pointed ear', [0.58, 1.16, -0.11], 0.08, 0.32, magicalFoxFurMaterial, [0.12, 0, -0.18]);
  addPointedCone(fox, 'Magical fox tall pointed ear', [0.58, 1.16, 0.11], 0.08, 0.32, magicalFoxFurMaterial, [-0.12, 0, -0.18]);

  for (const [index, z] of [-0.14, 0.14].entries()) {
    const rearLeg = addBox(fox, 'Magical fox back leg', [0.065, 0.42, 0.06], [-0.3, 0.28, z], magicalFoxFurMaterial);
    rearLeg.userData.legPhase = index === 0 ? 0 : Math.PI;
    const frontLeg = addBox(fox, 'Magical fox front leg', [0.055, 0.4, 0.055], [0.34, 0.27, z], magicalFoxFurMaterial);
    frontLeg.userData.legPhase = index === 0 ? Math.PI : 0;
  }

  [-0.48, -0.24, 0, 0.24, 0.48].forEach((offset, index) => {
    addMagicalFoxTail(fox, offset, index === 2 ? 0.1 : 0, offset * 0.7);
  });

  return fox;
}

function animateMagicalFoxes(root: Group, timeSeconds: number): void {
  root.traverse((object) => {
    if (!(object instanceof Group) || object.name !== "Maggie's World magical five-tailed fox") {
      return;
    }
    const seed = Number(object.userData.seed ?? 0);
    const baseX = Number(object.userData.baseX ?? object.position.x);
    const baseZ = Number(object.userData.baseZ ?? object.position.z);
    const speed = 0.18 + hash2d(seed, seed, 24) * 0.16;
    const phase = timeSeconds * speed + seed * 0.07;
    const walkX = Math.sin(phase * 0.9) * 5.8;
    const walkZ = Math.cos(phase * 0.7) * 5;
    const nextX = baseX + Math.sin((phase + 0.08) * 0.9) * 5.8;
    const nextZ = baseZ + Math.cos((phase + 0.08) * 0.7) * 5;
    object.position.set(baseX + walkX, Math.max(0, Math.sin(timeSeconds * speed * 8 + seed) * 0.026), baseZ + walkZ);
    object.rotation.y = rotationYForPositiveX(nextX - object.position.x, nextZ - object.position.z);

    object.children.forEach((child, index) => {
      if (child.name.includes('leg')) {
        const legPhase = Number(child.userData.legPhase ?? 0);
        child.rotation.z = Math.sin(timeSeconds * speed * 14 + legPhase) * 0.18;
      }
      if (child.name.includes('tail')) {
        child.rotation.x = Math.sin(timeSeconds * 1.3 + seed + index) * 0.08;
      }
    });
  });
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

  if (hash2d(chunkX, chunkZ, 69) < RAINBOW_CHANCE) {
    const rainbowX = 18 + hash2d(chunkX, chunkZ, 70) * (CHUNK_SIZE - 36);
    const rainbowZ = 18 + hash2d(chunkX, chunkZ, 71) * (CHUNK_SIZE - 36);
    const rainbowRotation = hash2d(chunkX, chunkZ, 72) * Math.PI * 2;
    const rainbowScale = 0.86 + hash2d(chunkX, chunkZ, 73) * 0.32;
    chunk.add(createRainbowArc(rainbowX, rainbowZ, rainbowRotation, rainbowScale));
  }

  for (let index = 0; index < 7; index += 1) {
    const seed = chunkX * 1009 + chunkZ * 917 + index * 37;
    const butterflyX = 7 + hash2d(chunkX, chunkZ, 80 + index) * (CHUNK_SIZE - 14);
    const butterflyZ = 7 + hash2d(chunkX, chunkZ, 90 + index) * (CHUNK_SIZE - 14);
    chunk.add(createButterfly(butterflyX, butterflyZ, seed));
  }

  if (hash2d(chunkX, chunkZ, 120) < JACKALOPE_CHANCE) {
    const seed = chunkX * 613 + chunkZ * 769;
    const jackalopeX = 12 + hash2d(chunkX, chunkZ, 121) * (CHUNK_SIZE - 24);
    const jackalopeZ = 12 + hash2d(chunkX, chunkZ, 131) * (CHUNK_SIZE - 24);
    chunk.add(createJackalope(jackalopeX, jackalopeZ, seed));
  }

  if (hash2d(chunkX, chunkZ, 150) < MAGICAL_FOX_CHANCE) {
    const seed = chunkX * 811 + chunkZ * 977;
    const foxX = 14 + hash2d(chunkX, chunkZ, 151) * (CHUNK_SIZE - 28);
    const foxZ = 14 + hash2d(chunkX, chunkZ, 161) * (CHUNK_SIZE - 28);
    chunk.add(createMagicalFox(foxX, foxZ, seed));
  }

  const treePositions: Array<{ x: number; z: number; scale: number }> = [];
  const cells = Math.floor(CHUNK_SIZE / TREE_SPACING);
  for (let gridX = 0; gridX < cells; gridX += 1) {
    for (let gridZ = 0; gridZ < cells; gridZ += 1) {
      if (hash2d(chunkX * 31 + gridX, chunkZ * 31 + gridZ, 1) < TREE_SKIP_CHANCE) {
        continue;
      }
      const jitterX = (hash2d(chunkX * 17 + gridX, chunkZ * 17 + gridZ, 2) - 0.5) * 12;
      const jitterZ = (hash2d(chunkX * 19 + gridX, chunkZ * 19 + gridZ, 3) - 0.5) * 12;
      const x = gridX * TREE_SPACING + TREE_SPACING / 2 + jitterX;
      const z = gridZ * TREE_SPACING + TREE_SPACING / 2 + jitterZ;
      const worldX = originX + x;
      const worldZ = originZ + z;
      if (Math.hypot(worldX, worldZ) < 18) {
        continue;
      }
      treePositions.push({
        x,
        z,
        scale: 1.18 + hash2d(chunkX * 23 + gridX, chunkZ * 23 + gridZ, 4) * 0.62,
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
      const timeSeconds = performance.now() / 1000;
      animateButterflies(chunkRoot, timeSeconds);
      animateJackalopes(chunkRoot, timeSeconds);
      animateMagicalFoxes(chunkRoot, timeSeconds);
    },
    reset(): void {
      ensureChunks(spawn);
    },
    getSupportedFloorY(): number {
      return GAME_CONFIG.player.height;
    },
  };
}
