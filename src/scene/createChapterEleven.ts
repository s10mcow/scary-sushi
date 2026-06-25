import {
  BoxGeometry,
  CanvasTexture,
  ConeGeometry,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  CylinderGeometry,
  Vector3,
} from 'three';

import { GAME_CONFIG } from '../config/gameConfig';
import type { CollisionBox } from '../types/world';

export type ChapterElevenBiomePortalId =
  | 'miskel-mushroom-forest'
  | 'frozen-tundra'
  | 'volcanic-valley'
  | 'cholesterol-garden'
  | 'dragon-jungle'
  | 'rainbow-dimension';

export interface ChapterElevenBiomePortal {
  id: ChapterElevenBiomePortalId;
  label: string;
  position: Vector3;
  targetPosition: Vector3;
  range: number;
}

export interface ChapterElevenSpecialStall {
  id: string;
  label: string;
  position: Vector3;
  range: number;
}

export interface ChapterElevenData {
  root: Group;
  colliders: CollisionBox[];
  normalOnlyColliders: CollisionBox[];
  copyOnlyColliders: CollisionBox[];
  dirtPatches: ChapterElevenDirtPatch[];
  seedLifeDirtPatch: ChapterElevenDirtPatch;
  seedLifeDirtPatches: ChapterElevenDirtPatch[];
  biomePortals: ChapterElevenBiomePortal[];
  specialStalls: ChapterElevenSpecialStall[];
  equipmentStand: Group;
  equipmentStandCollider: CollisionBox;
  fieldBounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  spawn: Vector3;
  lookTarget: Vector3;
  getSupportedFloorY(position: Vector3): number | null;
  update(deltaSeconds: number, playerPosition: Vector3): void;
  setSeedLifeLayout(enabled: boolean): void;
  reset(): void;
}

export interface ChapterElevenDirtPatch {
  centerX: number;
  centerZ: number;
  halfWidth: number;
  halfDepth: number;
}

const FIELD_WIDTH = 120;
const FIELD_DEPTH = 120;
const FLOOR_Y = 0;

const grassMaterial = new MeshStandardMaterial({
  color: 0x4f963f,
  roughness: 0.94,
});

const dirtMaterial = new MeshStandardMaterial({
  color: 0x7a4f2a,
  roughness: 0.98,
});

const fenceMaterial = new MeshStandardMaterial({
  color: 0xd8c28d,
  roughness: 0.82,
});

const dirtFenceMaterial = new MeshStandardMaterial({
  color: 0x9a7746,
  roughness: 0.9,
});

const standWoodMaterial = new MeshStandardMaterial({ color: 0x8a5a2f, roughness: 0.82 });
const standDarkWoodMaterial = new MeshStandardMaterial({ color: 0x5f3a1f, roughness: 0.88 });
const canopyRedMaterial = new MeshStandardMaterial({ color: 0xc8332f, roughness: 0.72 });
const canopyWhiteMaterial = new MeshStandardMaterial({ color: 0xf2eadb, roughness: 0.66 });
const skinMaterial = new MeshStandardMaterial({ color: 0xc98f64, roughness: 0.62 });
const shirtMaterial = new MeshStandardMaterial({ color: 0x4f83c4, roughness: 0.74 });
const pantsMaterial = new MeshStandardMaterial({ color: 0x2d3558, roughness: 0.78 });
const hairMaterial = new MeshStandardMaterial({ color: 0x3d2417, roughness: 0.8 });
const gardenSuitMaterial = new MeshStandardMaterial({ color: 0x4f7a37, roughness: 0.84 });
const girlGardenSuitMaterial = new MeshStandardMaterial({ color: 0x6b8f3f, roughness: 0.82 });
const girlHairMaterial = new MeshStandardMaterial({ color: 0x070606, roughness: 0.86 });
const faceMaterial = new MeshStandardMaterial({ color: 0x1b140f, roughness: 0.55 });
const eyeWhiteMaterial = new MeshStandardMaterial({ color: 0xf2f0e8, roughness: 0.5 });
const lipMaterial = new MeshStandardMaterial({ color: 0x7d322d, roughness: 0.68 });
const pathStoneMaterial = new MeshStandardMaterial({ color: 0x8f9290, roughness: 0.96 });
const pathStoneLightMaterial = new MeshStandardMaterial({ color: 0xd8d6cd, roughness: 0.94 });
const pathDirtBaseMaterial = new MeshStandardMaterial({ color: 0xb8945f, roughness: 0.98 });
const carrotMaterial = new MeshStandardMaterial({ color: 0xe87920, roughness: 0.74 });
const carrotLeafMaterial = new MeshStandardMaterial({ color: 0x2f8b35, roughness: 0.82 });
const petEggMaterial = new MeshStandardMaterial({ color: 0xf0a3c9, roughness: 0.62 });
const petEggSpotMaterial = new MeshStandardMaterial({ color: 0x7a3ca8, roughness: 0.7 });
function createStandLabelMaterial(label: string): MeshStandardMaterial {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#d9b071');
    gradient.addColorStop(1, '#8b5a2d');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#3c2413';
    context.lineWidth = 18;
    context.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
    context.strokeStyle = '#f4d89a';
    context.lineWidth = 4;
    context.strokeRect(34, 34, canvas.width - 68, canvas.height - 68);
    context.fillStyle = '#201209';
    context.font = label.length > 5 ? 'bold 72px Arial' : 'bold 92px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label.toUpperCase(), canvas.width / 2, canvas.height / 2 + 4);
  }
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return new MeshStandardMaterial({
    map: texture,
    roughness: 0.7,
    side: DoubleSide,
  });
}

function createSeedPacketMaterial(label: string, color: string): MeshStandardMaterial {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = color;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#442716';
    context.lineWidth = 10;
    context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    context.fillStyle = '#f6edc7';
    context.fillRect(34, 36, canvas.width - 68, 58);
    context.fillStyle = '#1f2b16';
    context.font = 'bold 30px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label.toUpperCase(), canvas.width / 2, 65);
    context.font = 'bold 38px Arial';
    context.fillText('SEEDS', canvas.width / 2, 132);
  }
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return new MeshStandardMaterial({
    map: texture,
    roughness: 0.72,
  });
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

export function createChapterEleven(): ChapterElevenData {
  const root = new Group();
  root.name = 'Chapter 11: Grow a garden';
  const colliders: CollisionBox[] = [];
  const normalOnlyColliders: CollisionBox[] = [];
  const copyOnlyColliders: CollisionBox[] = [];
  const dirtPatches: ChapterElevenDirtPatch[] = [];
  const dirtPatchGroups: Group[] = [];
  const seedLifeOnlyGroups: Object3D[] = [];
  const normalOnlyGroups: Object3D[] = [];
  const seedLifeDirtPatches: ChapterElevenDirtPatch[] = [];
  const portalDiscs: Mesh[] = [];
  const biomePortals: ChapterElevenBiomePortal[] = [];
  const specialStalls: ChapterElevenSpecialStall[] = [];
  let seedLifeDirtPatchGroup: Group | null = null;

  const grass = new Mesh(new BoxGeometry(FIELD_WIDTH, 0.12, FIELD_DEPTH), grassMaterial);
  grass.name = 'Chapter 11 open grass field';
  grass.position.set(0, -0.06, 0);
  grass.receiveShadow = true;
  root.add(grass);

  const fenceHeight = 1.25;
  const fenceThickness = 0.22;
  const halfWidth = FIELD_WIDTH / 2;
  const halfDepth = FIELD_DEPTH / 2;

  const addDirtPatch = (centerX: number, centerZ: number, width: number, depth: number, seedLifeOnly = false): ChapterElevenDirtPatch => {
    const patchData = {
      centerX,
      centerZ,
      halfWidth: width / 2,
      halfDepth: depth / 2,
    };
    if (!seedLifeOnly) {
      dirtPatches.push(patchData);
    } else {
      seedLifeDirtPatches.push(patchData);
    }

    const patchGroup = new Group();
    patchGroup.name = seedLifeOnly ? 'Seed Life single centered fenced dirt patch group' : 'Chapter 11 fenced dirt patch group';

    const patch = new Mesh(new BoxGeometry(width, 0.035, depth), dirtMaterial);
    patch.name = 'Chapter 11 fenced brown dirt patch';
    patch.position.set(centerX, 0.005, centerZ);
    patch.receiveShadow = true;
    patchGroup.add(patch);

    const railHeight = 0.28;
    const railThickness = 0.12;
    const postGeometry = new BoxGeometry(0.18, 0.52, 0.18);
    const halfPatchWidth = width / 2;
    const halfPatchDepth = depth / 2;
    const northRail = new Mesh(new BoxGeometry(width + 0.2, railHeight, railThickness), dirtFenceMaterial);
    northRail.name = 'Chapter 11 dirt patch stick fence rail';
    northRail.position.set(centerX, railHeight / 2, centerZ - halfPatchDepth);
    const southRail = northRail.clone();
    southRail.position.z = centerZ + halfPatchDepth;
    const westRail = new Mesh(new BoxGeometry(railThickness, railHeight, depth + 0.2), dirtFenceMaterial);
    westRail.name = 'Chapter 11 dirt patch stick side rail';
    westRail.position.set(centerX - halfPatchWidth, railHeight / 2, centerZ);
    const eastRail = westRail.clone();
    eastRail.position.x = centerX + halfPatchWidth;
    patchGroup.add(northRail, southRail, westRail, eastRail);

    [
      [centerX - halfPatchWidth, centerZ - halfPatchDepth],
      [centerX + halfPatchWidth, centerZ - halfPatchDepth],
      [centerX - halfPatchWidth, centerZ + halfPatchDepth],
      [centerX + halfPatchWidth, centerZ + halfPatchDepth],
    ].forEach(([postX, postZ]) => {
      const post = new Mesh(postGeometry, dirtFenceMaterial);
      post.name = 'Chapter 11 dirt patch stick fence post';
      post.position.set(postX, 0.26, postZ);
      patchGroup.add(post);
    });

    root.add(patchGroup);
    if (seedLifeOnly) {
      patchGroup.visible = false;
      seedLifeOnlyGroups.push(patchGroup);
      if (!seedLifeDirtPatchGroup) {
        seedLifeDirtPatchGroup = patchGroup;
      }
    } else {
      dirtPatchGroups.push(patchGroup);
    }
    return patchData;
  };
  addDirtPatch(-41.5, -39.85, 34, 38.7);
  addDirtPatch(-42.75, 40.45, 34, 38.7);
  addDirtPatch(42.75, -40.45, 34, 38.7);
  addDirtPatch(42.75, 40.45, 34, 38.7);
  const seedLifeDirtPatch = addDirtPatch(0, 0, 42, 42, true);

  const stand = new Group();
  stand.name = 'Chapter 11 old fashioned garden stand with worker';
  stand.position.set(-53.46, 0, 11.34);

  addBox(stand, 'Chapter 11 stand shorter wooden counter front', [0.26, 0.84, 5.4], [1.15, 0.48, 0], standWoodMaterial);
  addBox(stand, 'Chapter 11 stand shorter counter top plank', [1.75, 0.18, 5.8], [0.62, 0.94, 0], standDarkWoodMaterial);
  addBox(stand, 'Chapter 11 stand lower shelf plank', [1.42, 0.16, 4.9], [0.36, 0.28, 0], standDarkWoodMaterial);
  [-2.62, 2.62].forEach((z) => {
    addBox(stand, 'Chapter 11 stand front stick post', [0.18, 2.46, 0.18], [1.24, 1.38, z], standDarkWoodMaterial);
    addBox(stand, 'Chapter 11 stand rear stick post', [0.18, 2.46, 0.18], [-0.78, 1.38, z], standDarkWoodMaterial);
  });
  [-2.62, 2.62].forEach((z) => {
    addBox(stand, 'Chapter 11 stand side stick wall rail', [2.14, 0.14, 0.14], [0.22, 1.74, z], standWoodMaterial);
    addBox(stand, 'Chapter 11 stand low side stick wall rail', [2.14, 0.12, 0.12], [0.22, 0.7, z], standWoodMaterial);
  });
  [-1.7, -0.85, 0, 0.85, 1.7].forEach((z) => {
    addBox(stand, 'Chapter 11 stand vertical front counter board', [0.08, 0.62, 0.12], [1.31, 0.52, z], standDarkWoodMaterial);
  });
  for (let i = 0; i < 7; i += 1) {
    const z = -2.7 + i * 0.9;
    const material = i % 2 === 0 ? canopyRedMaterial : canopyWhiteMaterial;
    addBox(stand, 'Chapter 11 red white striped canopy panel', [2.42, 0.16, 0.82], [0.22, 2.74, z], material).rotation.z = -0.12;
  }
  addBox(stand, 'Chapter 11 stand canopy front lip', [0.2, 0.28, 6.0], [1.44, 2.56, 0], standDarkWoodMaterial).rotation.z = -0.12;
  addBox(stand, 'Chapter 11 stand canopy rear lip', [0.2, 0.24, 6.0], [-1.02, 2.72, 0], standDarkWoodMaterial).rotation.z = -0.12;

  const person = new Group();
  person.name = 'Chapter 11 garden stand person facing counter';
  person.position.set(-1.18, 0, 0);
  const torso = addBox(person, 'Chapter 11 stand person shirt torso', [0.62, 0.9, 0.42], [0, 1.18, 0], shirtMaterial);
  torso.rotation.z = -0.04;
  addBox(person, 'Chapter 11 stand person neck', [0.18, 0.18, 0.16], [0.03, 1.69, 0], skinMaterial);
  const head = new Mesh(new SphereGeometry(0.28, 18, 12), skinMaterial);
  head.name = 'Chapter 11 stand person head';
  head.position.set(0.02, 1.87, 0);
  head.castShadow = true;
  person.add(head);
  const hair = new Mesh(new SphereGeometry(0.3, 18, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMaterial);
  hair.name = 'Chapter 11 stand person hair cap';
  hair.position.set(0.0, 2.02, 0);
  hair.castShadow = true;
  person.add(hair);
  const leftEyeWhite = new Mesh(new SphereGeometry(0.044, 10, 8), eyeWhiteMaterial);
  leftEyeWhite.name = 'Chapter 11 stand person left eye white';
  leftEyeWhite.position.set(0.258, 1.91, -0.09);
  const rightEyeWhite = leftEyeWhite.clone();
  rightEyeWhite.name = 'Chapter 11 stand person right eye white';
  rightEyeWhite.position.z = 0.09;
  const leftPupil = new Mesh(new SphereGeometry(0.021, 8, 6), faceMaterial);
  leftPupil.name = 'Chapter 11 stand person left pupil';
  leftPupil.position.set(0.294, 1.91, -0.09);
  const rightPupil = leftPupil.clone();
  rightPupil.name = 'Chapter 11 stand person right pupil';
  rightPupil.position.z = 0.09;
  addBox(person, 'Chapter 11 stand person left eyebrow', [0.025, 0.018, 0.16], [0.285, 1.99, -0.09], hairMaterial).rotation.x = -0.08;
  addBox(person, 'Chapter 11 stand person right eyebrow', [0.025, 0.018, 0.16], [0.285, 1.99, 0.09], hairMaterial).rotation.x = 0.08;
  const nose = new Mesh(new SphereGeometry(0.045, 8, 6), skinMaterial);
  nose.name = 'Chapter 11 stand person small nose';
  nose.position.set(0.285, 1.84, 0);
  nose.scale.set(0.65, 0.9, 0.55);
  nose.castShadow = true;
  person.add(nose);
  const leftEar = new Mesh(new SphereGeometry(0.055, 8, 6), skinMaterial);
  leftEar.name = 'Chapter 11 stand person left ear';
  leftEar.position.set(0.02, 1.87, -0.27);
  leftEar.scale.set(0.55, 0.85, 0.32);
  const rightEar = leftEar.clone();
  rightEar.name = 'Chapter 11 stand person right ear';
  rightEar.position.z = 0.27;
  person.add(leftEar, rightEar);
  const mouth = addBox(person, 'Chapter 11 stand person realistic mouth', [0.035, 0.024, 0.18], [0.282, 1.76, 0], lipMaterial);
  mouth.rotation.x = 0.08;
  person.add(leftEyeWhite, rightEyeWhite, leftPupil, rightPupil);
  const addConnectedArm = (side: -1 | 1): void => {
    const shoulderZ = side * 0.29;
    const elbowZ = side * 0.43;
    const handZ = side * 0.48;
    const shoulderCap = new Mesh(new SphereGeometry(0.15, 12, 8), shirtMaterial);
    shoulderCap.name = side < 0 ? 'Chapter 11 stand person left rounded attached shoulder' : 'Chapter 11 stand person right rounded attached shoulder';
    shoulderCap.scale.set(0.8, 1.05, 0.68);
    shoulderCap.position.set(0.06, 1.42, shoulderZ);
    shoulderCap.castShadow = true;
    person.add(shoulderCap);

    const sleeve = addBox(
      person,
      side < 0 ? 'Chapter 11 stand person left connected shirt sleeve' : 'Chapter 11 stand person right connected shirt sleeve',
      [0.2, 0.5, 0.18],
      [0.18, 1.22, elbowZ],
      shirtMaterial,
    );
    sleeve.rotation.z = -0.32;
    sleeve.rotation.x = side * 0.12;

    const elbow = new Mesh(new SphereGeometry(0.095, 10, 8), skinMaterial);
    elbow.name = side < 0 ? 'Chapter 11 stand person left elbow joint' : 'Chapter 11 stand person right elbow joint';
    elbow.position.set(0.29, 1.02, elbowZ);
    elbow.castShadow = true;
    person.add(elbow);

    const forearm = addBox(
      person,
      side < 0 ? 'Chapter 11 stand person left connected forearm on counter' : 'Chapter 11 stand person right connected forearm on counter',
      [0.18, 0.52, 0.16],
      [0.43, 0.86, handZ],
      skinMaterial,
    );
    forearm.rotation.z = -0.76;
    forearm.rotation.x = side * 0.08;

    const hand = new Mesh(new SphereGeometry(0.12, 12, 8), skinMaterial);
    hand.name = side < 0 ? 'Chapter 11 stand person left rounded hand on counter' : 'Chapter 11 stand person right rounded hand on counter';
    hand.scale.set(1.2, 0.48, 0.82);
    hand.position.set(0.62, 0.76, handZ);
    hand.castShadow = true;
    person.add(hand);
  };
  addConnectedArm(-1);
  addConnectedArm(1);
  addBox(person, 'Chapter 11 stand person left leg', [0.22, 0.82, 0.18], [-0.08, 0.43, -0.15], pantsMaterial);
  addBox(person, 'Chapter 11 stand person right leg', [0.22, 0.82, 0.18], [-0.08, 0.43, 0.15], pantsMaterial);
  addBox(person, 'Chapter 11 stand person shoes', [0.28, 0.12, 0.52], [0.03, 0.08, 0], standDarkWoodMaterial);
  const addGardeningSuitDetails = (
    target: Group,
    material: MeshStandardMaterial,
    prefix: string,
  ): void => {
    addBox(target, `${prefix} gardening suit front apron`, [0.055, 0.7, 0.34], [0.325, 1.17, 0], material);
    addBox(target, `${prefix} gardening suit left strap`, [0.06, 0.55, 0.045], [0.348, 1.47, -0.12], material).rotation.z = 0.13;
    addBox(target, `${prefix} gardening suit right strap`, [0.06, 0.55, 0.045], [0.348, 1.47, 0.12], material).rotation.z = 0.13;
    addBox(target, `${prefix} gardening suit waist band`, [0.065, 0.08, 0.42], [0.34, 0.93, 0], material);
    addBox(target, `${prefix} gardening suit small pocket`, [0.07, 0.18, 0.16], [0.372, 1.14, 0], standDarkWoodMaterial);
    addBox(target, `${prefix} gardening glove left`, [0.18, 0.055, 0.16], [0.66, 0.75, -0.48], material);
    addBox(target, `${prefix} gardening glove right`, [0.18, 0.055, 0.16], [0.66, 0.75, 0.48], material);
  };
  addGardeningSuitDetails(person, gardenSuitMaterial, 'Chapter 11 boy worker');
  person.rotation.y = 0;
  stand.add(person);
  root.add(stand);
  addCollider(colliders, -53.46, 11.34, 1.55, 3.02);

  const decorateGirlWorker = (worker: Group, prefix: string): void => {
    addGardeningSuitDetails(worker, girlGardenSuitMaterial, prefix);
    [
      'Chapter 11 stand person hair cap',
      'Chapter 11 stand person left eyebrow',
      'Chapter 11 stand person right eyebrow',
    ].forEach((name) => {
      const hairPiece = worker.getObjectByName(name) as Mesh | undefined;
      if (hairPiece) {
        hairPiece.material = girlHairMaterial;
      }
    });
    const backHair = new Mesh(new SphereGeometry(0.32, 16, 10), girlHairMaterial);
    backHair.name = `${prefix} rounded black hair running down back`;
    backHair.position.set(-0.09, 1.5, 0);
    backHair.scale.set(0.5, 1.45, 0.82);
    backHair.castShadow = true;
    worker.add(backHair);
    addBox(worker, `${prefix} smooth black lower back hair`, [0.16, 0.88, 0.5], [-0.14, 1.32, 0], girlHairMaterial);
    addBox(worker, `${prefix} left black hair side strand`, [0.12, 0.76, 0.12], [0.17, 1.55, -0.26], girlHairMaterial).rotation.z = -0.06;
    addBox(worker, `${prefix} right black hair side strand`, [0.12, 0.76, 0.12], [0.17, 1.55, 0.26], girlHairMaterial).rotation.z = -0.06;
    addBox(worker, `${prefix} short black front bang`, [0.08, 0.18, 0.34], [0.24, 1.99, 0], girlHairMaterial).rotation.z = -0.16;
    addBox(worker, `${prefix} garden hat brim`, [0.08, 0.05, 0.72], [0.31, 2.03, 0], dirtFenceMaterial);
  };

  const girlStand = stand.clone(true);
  girlStand.name = 'Chapter 11 second old fashioned garden stand with girl worker';
  girlStand.position.set(-52.82, 0, -2.42);
  const girlWorker = girlStand.getObjectByName('Chapter 11 garden stand person facing counter') as Group | undefined;
  if (girlWorker) {
    decorateGirlWorker(girlWorker, 'Chapter 11 girl worker');
  }
  root.add(girlStand);
  addCollider(colliders, -52.82, -2.42, 1.55, 3.02);

  const addStandLabel = (targetStand: Group, label: string): void => {
    const sign = new Mesh(new PlaneGeometry(2.85, 1.08), createStandLabelMaterial(label));
    sign.name = `Chapter 11 ${label.toLowerCase()} stand roof sign`;
    sign.position.set(1.5, 3.38, 0);
    sign.rotation.y = Math.PI / 2;
    sign.castShadow = true;
    targetStand.add(sign);
    addBox(targetStand, `Chapter 11 ${label.toLowerCase()} sign left post`, [0.08, 0.68, 0.08], [1.46, 2.92, -1.26], standDarkWoodMaterial);
    addBox(targetStand, `Chapter 11 ${label.toLowerCase()} sign right post`, [0.08, 0.68, 0.08], [1.46, 2.92, 1.26], standDarkWoodMaterial);
  };

  const addSeedLifeStall = (label: string, x: number, z: number, rotationY: number): void => {
    const stall = stand.clone(true);
    stall.name = `Seed Life ${label} outer stall`;
    stall.children
      .filter((child) => child.name.toLowerCase().includes('sell'))
      .forEach((child) => stall.remove(child));
    stall.position.set(x, 0, z);
    stall.rotation.y = rotationY;
    addStandLabel(stall, label);
    const worker = stall.getObjectByName('Chapter 11 garden stand person facing counter') as Group | undefined;
    if (label === 'Weather' && worker) {
      worker.visible = false;
      const cloud = new Group();
      cloud.name = 'Seed Life weather stall happy cloud worker';
      cloud.position.set(0.38, 1.58, 0);
      cloud.rotation.y = Math.PI / 2;
      const cloudMaterial = new MeshStandardMaterial({ color: 0xf4f7fb, roughness: 0.62 });
      const cheekMaterial = new MeshStandardMaterial({ color: 0xf2a1b6, roughness: 0.64 });
      [
        [-0.24, 0, 0, 0.28],
        [0, 0.08, 0, 0.34],
        [0.28, 0, 0, 0.28],
        [-0.04, -0.08, 0, 0.3],
      ].forEach(([cx, cy, cz, radius]) => {
        const puff = new Mesh(new SphereGeometry(radius, 18, 12), cloudMaterial);
        puff.name = 'Seed Life weather cloud round puff';
        puff.position.set(cx, cy, cz);
        puff.scale.set(1.18, 0.78, 0.68);
        puff.castShadow = true;
        cloud.add(puff);
      });
      addBox(cloud, 'Seed Life weather cloud left eye', [0.035, 0.075, 0.025], [-0.12, 0.02, 0.22], faceMaterial);
      addBox(cloud, 'Seed Life weather cloud right eye', [0.035, 0.075, 0.025], [0.12, 0.02, 0.22], faceMaterial);
      addBox(cloud, 'Seed Life weather cloud smiling mouth', [0.14, 0.026, 0.026], [0, -0.08, 0.24], faceMaterial);
      const leftCheek = new Mesh(new SphereGeometry(0.055, 10, 6), cheekMaterial);
      leftCheek.name = 'Seed Life weather cloud rosy left cheek';
      leftCheek.position.set(-0.22, -0.06, 0.22);
      leftCheek.scale.set(1, 0.45, 0.5);
      const rightCheek = leftCheek.clone();
      rightCheek.name = 'Seed Life weather cloud rosy right cheek';
      rightCheek.position.x = 0.22;
      cloud.add(leftCheek, rightCheek);
      stall.add(cloud);
    } else if (label === 'Wizard' && worker) {
      addBox(worker, 'Seed Life wizard purple robe front', [0.08, 0.95, 0.52], [0.36, 0.9, 0], new MeshStandardMaterial({ color: 0x5c3ba2, roughness: 0.78 }));
      const hat = new Mesh(new ConeGeometry(0.34, 0.86, 18), new MeshStandardMaterial({ color: 0x4b2d87, roughness: 0.76 }));
      hat.name = 'Seed Life wizard pointy hat';
      hat.position.set(0.18, 2.48, 0);
      hat.rotation.z = -0.1;
      hat.castShadow = true;
      worker.add(hat);
      const brim = new Mesh(new CylinderGeometry(0.42, 0.36, 0.08, 18), new MeshStandardMaterial({ color: 0x3b236e, roughness: 0.78 }));
      brim.name = 'Seed Life wizard hat brim';
      brim.position.set(0.2, 2.04, 0);
      brim.rotation.z = -0.1;
      brim.castShadow = true;
      worker.add(brim);
      addBox(worker, 'Seed Life wizard gold belt', [0.075, 0.09, 0.56], [0.39, 0.92, 0], portalGoldMaterial);
    } else if (label === 'Juice/Smoothie' && worker) {
      worker.visible = false;
      const cup = new Group();
      cup.name = 'Seed Life juice stall smiling floating cup worker';
      cup.position.set(0.34, 1.42, 0);
      cup.rotation.y = Math.PI / 2;
      const cupMaterial = new MeshStandardMaterial({ color: 0xf7f0df, roughness: 0.56 });
      const juiceMaterial = new MeshStandardMaterial({ color: 0xf48b32, roughness: 0.36, transparent: true, opacity: 0.84 });
      const cupBody = new Mesh(new CylinderGeometry(0.3, 0.24, 0.72, 22), cupMaterial);
      cupBody.name = 'Seed Life smiling juice cup body';
      cupBody.castShadow = true;
      cup.add(cupBody);
      const juice = new Mesh(new CylinderGeometry(0.27, 0.27, 0.08, 22), juiceMaterial);
      juice.name = 'Seed Life orange juice surface';
      juice.position.y = 0.38;
      cup.add(juice);
      const straw = new Mesh(new CylinderGeometry(0.025, 0.025, 0.84, 10), new MeshStandardMaterial({ color: 0xf5d2d9, roughness: 0.5 }));
      straw.name = 'Seed Life smiling juice cup straw';
      straw.position.set(0.12, 0.62, -0.06);
      straw.rotation.z = -0.28;
      straw.castShadow = true;
      cup.add(straw);
      addBox(cup, 'Seed Life juice cup left eye', [0.035, 0.07, 0.025], [-0.11, 0.08, 0.29], faceMaterial);
      addBox(cup, 'Seed Life juice cup right eye', [0.035, 0.07, 0.025], [0.11, 0.08, 0.29], faceMaterial);
      addBox(cup, 'Seed Life juice cup smile', [0.16, 0.026, 0.026], [0, -0.05, 0.3], faceMaterial);
      const cheekMaterial = new MeshStandardMaterial({ color: 0xf2a1b6, roughness: 0.64 });
      const leftCheek = new Mesh(new SphereGeometry(0.052, 10, 6), cheekMaterial);
      leftCheek.name = 'Seed Life juice cup rosy left cheek';
      leftCheek.position.set(-0.2, -0.03, 0.29);
      leftCheek.scale.set(1, 0.45, 0.5);
      const rightCheek = leftCheek.clone();
      rightCheek.name = 'Seed Life juice cup rosy right cheek';
      rightCheek.position.x = 0.2;
      cup.add(leftCheek, rightCheek);
      stall.add(cup);
    } else if (label === 'Scientist' && worker) {
      const labCoatMaterial = new MeshStandardMaterial({ color: 0xf7f8f4, roughness: 0.68 });
      const gloveMaterial = new MeshStandardMaterial({ color: 0x2c8fe7, roughness: 0.48 });
      addBox(worker, 'Seed Life scientist white lab coat front', [0.08, 0.96, 0.58], [0.36, 0.9, 0], labCoatMaterial);
      addBox(worker, 'Seed Life scientist blue left glove', [0.12, 0.12, 0.14], [0.1, 0.62, -0.46], gloveMaterial);
      addBox(worker, 'Seed Life scientist blue right glove', [0.12, 0.12, 0.14], [0.1, 0.62, 0.46], gloveMaterial);
      addBox(worker, 'Seed Life scientist shirt split line', [0.088, 0.82, 0.025], [0.42, 0.92, 0], standDarkWoodMaterial);
    }
    root.add(stall);
    seedLifeOnlyGroups.push(stall);
    const sideways = Math.abs(Math.sin(rotationY)) > 0.65;
    copyOnlyColliders.push({
      centerX: x,
      centerZ: z,
      halfWidth: sideways ? 3.02 : 1.55,
      halfDepth: sideways ? 1.55 : 3.02,
    });
    specialStalls.push({
      id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      label,
      position: new Vector3(x, GAME_CONFIG.player.height, z),
      range: 5.25,
    });
  };

  const petEggsStand = stand.clone(true);
  petEggsStand.name = 'Chapter 11 pet eggs old fashioned garden stand';
  petEggsStand.position.set(-2.61, 0, 52.33);
  petEggsStand.rotation.y = Math.PI / 2;
  root.add(petEggsStand);
  addCollider(colliders, -2.61, 52.33, 3.02, 1.55);

  const equipmentStand = stand.clone(true);
  equipmentStand.name = 'Chapter 11 equipment old fashioned garden stand with girl worker';
  equipmentStand.position.set(-3.82, 0, -50.47);
  equipmentStand.rotation.y = -Math.PI / 2;
  const toolsWorker = equipmentStand.getObjectByName('Chapter 11 garden stand person facing counter') as Group | undefined;
  if (toolsWorker) {
    decorateGirlWorker(toolsWorker, 'Chapter 11 tools girl worker');
  }
  addBox(equipmentStand, 'Chapter 11 tools stand green watering can body', [0.42, 0.32, 0.26], [1.1, 1.12, -0.62], gardenSuitMaterial);
  addBox(equipmentStand, 'Chapter 11 tools stand watering can handle', [0.08, 0.42, 0.08], [0.86, 1.2, -0.62], standDarkWoodMaterial);
  addBox(equipmentStand, 'Chapter 11 tools stand watering can spout', [0.34, 0.07, 0.07], [1.38, 1.2, -0.62], standDarkWoodMaterial).rotation.z = -0.18;
  addBox(equipmentStand, 'Chapter 11 tools stand bucket of water', [0.42, 0.28, 0.42], [1.08, 1.08, -0.08], new MeshStandardMaterial({ color: 0x7f8b92, roughness: 0.5, metalness: 0.18 }));
  addBox(equipmentStand, 'Chapter 11 tools stand blue bucket water top', [0.36, 0.035, 0.36], [1.08, 1.24, -0.08], new MeshStandardMaterial({ color: 0x66b5dc, roughness: 0.24, transparent: true, opacity: 0.72 }));
  addBox(equipmentStand, 'Chapter 11 tools stand small hoe handle', [0.64, 0.055, 0.055], [1.08, 1.2, 0.44], standDarkWoodMaterial).rotation.z = 0.32;
  addBox(equipmentStand, 'Chapter 11 tools stand small hoe blade', [0.08, 0.22, 0.2], [1.34, 1.3, 0.44], dirtFenceMaterial);
  addBox(equipmentStand, 'Chapter 11 tools stand shovel handle', [0.72, 0.055, 0.055], [1.06, 1.2, 0.92], standDarkWoodMaterial).rotation.z = -0.3;
  addBox(equipmentStand, 'Chapter 11 tools stand shovel scoop', [0.18, 0.26, 0.08], [1.36, 1.1, 0.92], dirtFenceMaterial).rotation.z = -0.3;
  root.add(equipmentStand);
  const equipmentStandCollider = addCollider(colliders, -3.82, -50.47, 3.02, 1.55);

  addStandLabel(stand, 'sell');
  addStandLabel(girlStand, 'Buy Seeds');
  addStandLabel(petEggsStand, 'Pet Eggs');
  addStandLabel(equipmentStand, 'Equipment');

  const addPetEggDisplay = (x: number, y: number, z: number): void => {
    const eggGroup = new Group();
    eggGroup.name = 'Chapter 11 big pink pet egg with purple spots';
    eggGroup.position.set(x, y, z);
    const egg = new Mesh(new SphereGeometry(0.32, 24, 16), petEggMaterial);
    egg.name = 'Chapter 11 big pink pet egg';
    egg.position.y = 0.34;
    egg.scale.set(0.82, 1.22, 0.82);
    egg.castShadow = true;
    egg.receiveShadow = true;
    eggGroup.add(egg);

    const spots: Array<[number, number, number, number]> = [
      [0.02, 0.56, -0.25, 0.08],
      [0.18, 0.36, -0.19, 0.065],
      [-0.14, 0.28, -0.22, 0.055],
      [-0.2, 0.48, 0.02, 0.06],
      [0.11, 0.2, 0.22, 0.05],
      [0.0, 0.7, 0.06, 0.045],
      [0.2, 0.64, 0.16, 0.055],
      [-0.18, 0.62, 0.19, 0.048],
      [0.24, 0.48, 0.02, 0.05],
      [-0.08, 0.38, 0.25, 0.052],
      [0.0, 0.15, -0.08, 0.045],
      [-0.22, 0.22, 0.1, 0.04],
    ];
    spots.forEach(([spotX, spotY, spotZ, radius], index) => {
      const spot = new Mesh(new SphereGeometry(radius, 12, 8), petEggSpotMaterial);
      spot.name = 'Chapter 11 purple pet egg spot';
      spot.position.set(spotX, spotY, spotZ);
      spot.scale.set(1, 0.34, 0.9);
      spot.rotation.x = index % 2 === 0 ? 0.24 : -0.18;
      spot.castShadow = true;
      eggGroup.add(spot);
    });
    root.add(eggGroup);
  };
  addPetEggDisplay(-0.99, 1.03, 51.46);

  const addSeedPacketPile = (x: number, y: number, z: number): void => {
    const packetPile = new Group();
    packetPile.name = 'Chapter 11 little pile of seed packets';
    packetPile.position.set(x, y, z);
    const packetMaterials = [
      createSeedPacketMaterial('Tomato', '#d65c4d'),
      createSeedPacketMaterial('Corn', '#e0b546'),
      createSeedPacketMaterial('Pea', '#78a954'),
      createSeedPacketMaterial('Carrot', '#df8b3b'),
      createSeedPacketMaterial('Flower', '#b96bb8'),
    ];
    packetMaterials.forEach((material, index) => {
      const packet = new Mesh(new BoxGeometry(0.34, 0.018, 0.46), material);
      packet.name = 'Chapter 11 counter seed packet';
      packet.position.set((index % 3) * 0.13 - 0.13, index * 0.012, Math.floor(index / 3) * 0.16 - 0.08);
      packet.rotation.y = (index - 2) * 0.28;
      packet.rotation.z = (index % 2 === 0 ? 0.04 : -0.05);
      packet.castShadow = true;
      packet.receiveShadow = true;
      packetPile.add(packet);
    });
    root.add(packetPile);
  };

  const addCarrotPile = (x: number, y: number, z: number): void => {
    const carrotPile = new Group();
    carrotPile.name = 'Chapter 11 pile of carrots on stand';
    carrotPile.position.set(x, y, z);
    const carrotOffsets: Array<[number, number, number, number]> = [
      [-0.22, 0.02, -0.04, -0.18],
      [-0.08, 0.06, 0.08, 0.18],
      [0.1, 0.03, -0.08, -0.34],
      [0.24, 0.07, 0.05, 0.28],
      [0.02, 0.1, 0.0, 0.02],
    ];
    carrotOffsets.forEach(([offsetX, offsetY, offsetZ, angle], index) => {
      const carrot = new Mesh(new ConeGeometry(0.055, 0.46, 12), carrotMaterial);
      carrot.name = 'Chapter 11 loose carrot';
      carrot.position.set(offsetX, offsetY, offsetZ);
      carrot.rotation.z = Math.PI / 2 + angle;
      carrot.rotation.y = index * 0.48;
      carrot.castShadow = true;
      carrot.receiveShadow = true;
      carrotPile.add(carrot);

      const leaves = new Group();
      leaves.name = 'Chapter 11 carrot leafy top';
      leaves.position.set(offsetX - Math.cos(angle) * 0.23, offsetY + 0.01, offsetZ - Math.sin(angle) * 0.05);
      for (let leaf = 0; leaf < 3; leaf += 1) {
        const leafBlade = new Mesh(new BoxGeometry(0.025, 0.12, 0.035), carrotLeafMaterial);
        leafBlade.position.set(0, leaf * 0.01, (leaf - 1) * 0.035);
        leafBlade.rotation.z = -0.7 + leaf * 0.22;
        leafBlade.castShadow = true;
        leaves.add(leafBlade);
      }
      carrotPile.add(leaves);
    });
    root.add(carrotPile);
  };

  addSeedPacketPile(-51.89, 1.06, -1.36);
  addCarrotPile(-52.62, 1.08, 12.59);

  const addGroundSign = (label: string, x: number, z: number): void => {
    const signRoot = new Group();
    signRoot.name = `Chapter 11 ${label} ground sign`;
    signRoot.position.set(x, 0, z);
    addBox(signRoot, `Chapter 11 ${label} wooden sign board`, [2.62, 1.02, 0.12], [0, 1.55, 0], standWoodMaterial);
    const sign = new Mesh(new PlaneGeometry(2.45, 0.92), createStandLabelMaterial(label));
    sign.name = `Chapter 11 ${label} sign face`;
    sign.position.set(0, 1.55, 0.07);
    sign.castShadow = true;
    signRoot.add(sign);
    addBox(signRoot, `Chapter 11 ${label} sign left post`, [0.1, 1.36, 0.1], [-0.82, 0.68, 0.04], standDarkWoodMaterial);
    addBox(signRoot, `Chapter 11 ${label} sign right post`, [0.1, 1.36, 0.1], [0.82, 0.68, 0.04], standDarkWoodMaterial);
    root.add(signRoot);
  };
  addGroundSign('My Farm', -35.18, -20.16);

  const portalMaterial = new MeshStandardMaterial({
    color: 0x7bd6ff,
    emissive: 0x1f75ff,
    emissiveIntensity: 1.15,
    roughness: 0.22,
    transparent: true,
    opacity: 0.7,
    side: DoubleSide,
  });
  const portalGoldMaterial = new MeshStandardMaterial({
    color: 0xf7d46a,
    emissive: 0xa665ff,
    emissiveIntensity: 0.75,
    roughness: 0.42,
  });
  const biomeMaterials = {
    mushroom: new MeshStandardMaterial({ color: 0x28452d, roughness: 0.94 }),
    frozen: new MeshStandardMaterial({ color: 0xd8f0ff, roughness: 0.56 }),
    volcanic: new MeshStandardMaterial({ color: 0x3d241e, roughness: 0.88, emissive: 0x3a0700, emissiveIntensity: 0.18 }),
    cosmic: new MeshStandardMaterial({ color: 0x2d2148, roughness: 0.76, emissive: 0x25135f, emissiveIntensity: 0.2 }),
    jungle: new MeshStandardMaterial({ color: 0x265a2c, roughness: 0.92 }),
    rainbow: new MeshStandardMaterial({ color: 0xb7d9ff, roughness: 0.68 }),
  };
  const seedLifeGateOpenings: Array<{ side: 'south' | 'west' | 'east'; center: number; width: number }> = [];

  const getGateSide = (x: number, z: number): 'south' | 'west' | 'east' => {
    if (Math.abs(x) > Math.abs(z)) {
      return x < 0 ? 'west' : 'east';
    }
    return 'south';
  };

  const addSeedLifePortalPath = (label: string, portalX: number, portalZ: number, side: 'south' | 'west' | 'east'): void => {
    const pathWidth = 5.8;
    const pathThickness = 0.2;
    const pathFenceHeight = 1.15;
    const openingCenter = side === 'south' ? portalX : portalZ;
    seedLifeGateOpenings.push({ side, center: openingCenter, width: pathWidth + 0.8 });

    const edgeX = side === 'west' ? -halfWidth : side === 'east' ? halfWidth : portalX;
    const edgeZ = side === 'south' ? -halfDepth : portalZ;
    const pathCenterX = (edgeX + portalX) / 2;
    const pathCenterZ = (edgeZ + portalZ) / 2;
    const pathLength = Math.max(8, Math.hypot(portalX - edgeX, portalZ - edgeZ));
    const pathGroup = new Group();
    pathGroup.name = `Seed Life fenced path to ${label} portal`;

    const path = new Mesh(
      new BoxGeometry(side === 'south' ? pathWidth : pathLength, 0.035, side === 'south' ? pathLength : pathWidth),
      pathDirtBaseMaterial,
    );
    path.name = `${label} tan path beyond garden gate`;
    path.position.set(pathCenterX, 0.035, pathCenterZ);
    path.receiveShadow = true;
    pathGroup.add(path);

    if (side === 'south') {
      [-1, 1].forEach((direction) => {
        const fence = new Mesh(new BoxGeometry(pathThickness, pathFenceHeight, pathLength + 1.2), fenceMaterial);
        fence.name = `${label} portal path side fence`;
        fence.position.set(portalX + direction * pathWidth / 2, pathFenceHeight / 2, pathCenterZ);
        fence.castShadow = true;
        fence.receiveShadow = true;
        pathGroup.add(fence);
        copyOnlyColliders.push({ centerX: fence.position.x, centerZ: fence.position.z, halfWidth: pathThickness * 0.6, halfDepth: pathLength / 2 + 0.6 });
      });
    } else {
      [-1, 1].forEach((direction) => {
        const fence = new Mesh(new BoxGeometry(pathLength + 1.2, pathFenceHeight, pathThickness), fenceMaterial);
        fence.name = `${label} portal path side fence`;
        fence.position.set(pathCenterX, pathFenceHeight / 2, portalZ + direction * pathWidth / 2);
        fence.castShadow = true;
        fence.receiveShadow = true;
        pathGroup.add(fence);
        copyOnlyColliders.push({ centerX: fence.position.x, centerZ: fence.position.z, halfWidth: pathLength / 2 + 0.6, halfDepth: pathThickness * 0.6 });
      });
    }

    const gateRoot = new Group();
    gateRoot.name = `${label} garden gate opening to portal path`;
    gateRoot.position.set(edgeX, 0, edgeZ);
    const gateBarSize: [number, number, number] = side === 'south' ? [pathWidth, 0.18, 0.18] : [0.18, 0.18, pathWidth];
    const gatePostOffsetA = side === 'south'
      ? new Vector3(-pathWidth / 2, 0.78, 0)
      : new Vector3(0, 0.78, -pathWidth / 2);
    const gatePostOffsetB = side === 'south'
      ? new Vector3(pathWidth / 2, 0.78, 0)
      : new Vector3(0, 0.78, pathWidth / 2);
    [gatePostOffsetA, gatePostOffsetB].forEach((offset, index) => {
      const post = new Mesh(new BoxGeometry(0.32, 1.56, 0.32), fenceMaterial);
      post.name = `${label} portal path gate post ${index + 1}`;
      post.position.copy(offset);
      post.castShadow = true;
      post.receiveShadow = true;
      gateRoot.add(post);
    });
    const topRail = new Mesh(new BoxGeometry(gateBarSize[0], gateBarSize[1], gateBarSize[2]), fenceMaterial);
    topRail.name = `${label} open gate top rail`;
    topRail.position.y = 1.48;
    topRail.castShadow = true;
    topRail.receiveShadow = true;
    gateRoot.add(topRail);
    const openGate = new Mesh(new BoxGeometry(side === 'south' ? 2.1 : 0.18, 0.7, side === 'south' ? 0.18 : 2.1), dirtFenceMaterial);
    openGate.name = `${label} unlocked gate swung open`;
    openGate.position.set(side === 'south' ? -pathWidth / 2 - 0.55 : 0.55, 0.58, side === 'south' ? -0.55 : -pathWidth / 2 - 0.55);
    openGate.rotation.y = side === 'south' ? -0.75 : 0.75;
    openGate.castShadow = true;
    openGate.receiveShadow = true;
    gateRoot.add(openGate);
    pathGroup.add(gateRoot);

    root.add(pathGroup);
    seedLifeOnlyGroups.push(pathGroup);
  };

  const addPortalPair = (
    id: ChapterElevenBiomePortalId,
    label: string,
    gateX: number,
    gateZ: number,
    targetX: number,
    targetZ: number,
    platformMaterial: MeshStandardMaterial,
  ): void => {
    const gateSide = getGateSide(gateX, gateZ);
    addSeedLifePortalPath(label, gateX, gateZ, gateSide);
    const hiddenTrapdoor = id === 'rainbow-dimension';

    biomePortals.push({
      id,
      label,
      position: new Vector3(gateX, GAME_CONFIG.player.height, gateZ),
      targetPosition: new Vector3(targetX, GAME_CONFIG.player.height, targetZ),
      range: 5.2,
    });

    const createPortal = (x: number, z: number, nameSuffix: string): Group => {
      const portalRoot = new Group();
      portalRoot.name = `Seed Life ${label} ${nameSuffix} portal`;
      portalRoot.position.set(x, 0, z);
      if (hiddenTrapdoor && nameSuffix === 'garden gate') {
        const trapdoor = new Mesh(new BoxGeometry(3.2, 0.12, 2.3), standDarkWoodMaterial);
        trapdoor.name = 'Seed Life hidden rainbow dimension trapdoor portal';
        trapdoor.position.set(0, 0.08, 0);
        trapdoor.rotation.y = 0.12;
        trapdoor.castShadow = true;
        portalRoot.add(trapdoor);
        const ring = new Mesh(new BoxGeometry(0.52, 0.06, 0.12), portalGoldMaterial);
        ring.name = 'Seed Life trapdoor small gold pull handle';
        ring.position.set(0, 0.18, 0.52);
        portalRoot.add(ring);
        const sign = new Mesh(new PlaneGeometry(2.55, 0.52), createStandLabelMaterial('???'));
        sign.name = 'Hidden rainbow trapdoor tiny secret sign';
        sign.position.set(0, 0.62, -1.4);
        sign.rotation.x = -0.6;
        portalRoot.add(sign);
        root.add(portalRoot);
        seedLifeOnlyGroups.push(portalRoot);
        return portalRoot;
      }
      addBox(portalRoot, `${label} portal left gold post`, [0.28, 3.2, 0.28], [-1.45, 1.6, 0], portalGoldMaterial);
      addBox(portalRoot, `${label} portal right gold post`, [0.28, 3.2, 0.28], [1.45, 1.6, 0], portalGoldMaterial);
      addBox(portalRoot, `${label} portal top gold beam`, [3.15, 0.3, 0.3], [0, 3.05, 0], portalGoldMaterial);
      const disc = new Mesh(new PlaneGeometry(2.25, 2.55), portalMaterial.clone());
      disc.name = `${label} glowing portal disc`;
      disc.position.set(0, 1.58, 0.04);
      disc.castShadow = true;
      portalRoot.add(disc);
      portalDiscs.push(disc);
      const sign = new Mesh(new PlaneGeometry(3.4, 0.78), createStandLabelMaterial(label));
      sign.name = `${label} portal label`;
      sign.position.set(0, 3.64, 0.08);
      portalRoot.add(sign);
      root.add(portalRoot);
      seedLifeOnlyGroups.push(portalRoot);
      copyOnlyColliders.push({ centerX: x, centerZ: z, halfWidth: 1.75, halfDepth: 0.22 });
      return portalRoot;
    };

    createPortal(gateX, gateZ, 'garden gate');
    createPortal(targetX, targetZ, 'biome return');
    const realmSize = 82;
    const halfRealmSize = realmSize / 2;
    const platform = new Mesh(new BoxGeometry(realmSize, 0.08, realmSize), platformMaterial);
    platform.name = `Seed Life ${label} biome landing platform`;
    platform.position.set(targetX, -0.035, targetZ);
    platform.receiveShadow = true;
    root.add(platform);
    seedLifeOnlyGroups.push(platform);
    const realmFenceGroup = new Group();
    realmFenceGroup.name = `Seed Life ${label} separate biome realm boundary`;
    realmFenceGroup.position.set(targetX, 0, targetZ);
    const realmFenceMaterial = platformMaterial.clone();
    realmFenceMaterial.roughness = 0.86;
    const realmNorthFence = new Mesh(new BoxGeometry(realmSize + 0.5, 1.25, 0.28), realmFenceMaterial);
    realmNorthFence.name = `${label} realm north fence`;
    realmNorthFence.position.set(0, 0.625, -halfRealmSize);
    const realmSouthFence = realmNorthFence.clone();
    realmSouthFence.name = `${label} realm south fence`;
    realmSouthFence.position.z = halfRealmSize;
    const realmWestFence = new Mesh(new BoxGeometry(0.28, 1.25, realmSize + 0.5), realmFenceMaterial);
    realmWestFence.name = `${label} realm west fence`;
    realmWestFence.position.set(-halfRealmSize, 0.625, 0);
    const realmEastFence = realmWestFence.clone();
    realmEastFence.name = `${label} realm east fence`;
    realmEastFence.position.x = halfRealmSize;
    realmFenceGroup.add(realmNorthFence, realmSouthFence, realmWestFence, realmEastFence);
    for (let postIndex = 0; postIndex < 4; postIndex += 1) {
      const cornerX = postIndex < 2 ? -halfRealmSize : halfRealmSize;
      const cornerZ = postIndex % 2 === 0 ? -halfRealmSize : halfRealmSize;
      const post = new Mesh(new BoxGeometry(0.46, 1.7, 0.46), portalGoldMaterial);
      post.name = `${label} realm gold corner post`;
      post.position.set(cornerX, 0.85, cornerZ);
      post.castShadow = true;
      realmFenceGroup.add(post);
    }
    root.add(realmFenceGroup);
    seedLifeOnlyGroups.push(realmFenceGroup);
    copyOnlyColliders.push({ centerX: targetX, centerZ: targetZ - halfRealmSize, halfWidth: halfRealmSize + 0.1, halfDepth: 0.18 });
    copyOnlyColliders.push({ centerX: targetX, centerZ: targetZ + halfRealmSize, halfWidth: halfRealmSize + 0.1, halfDepth: 0.18 });
    copyOnlyColliders.push({ centerX: targetX - halfRealmSize, centerZ: targetZ, halfWidth: 0.18, halfDepth: halfRealmSize + 0.1 });
    copyOnlyColliders.push({ centerX: targetX + halfRealmSize, centerZ: targetZ, halfWidth: 0.18, halfDepth: halfRealmSize + 0.1 });
    addDirtPatch(targetX, targetZ + 9, 26, 22, true);
    addSeedLifeStall(`${label} Seeds`, targetX + 18, targetZ + 24, Math.PI);
    const addRealmFeature = (feature: Mesh, localX: number, localY: number, localZ: number): void => {
      feature.position.set(targetX + localX, localY, targetZ + localZ);
      feature.castShadow = true;
      feature.receiveShadow = true;
      root.add(feature);
      seedLifeOnlyGroups.push(feature);
    };
    for (let featureIndex = 0; featureIndex < 14; featureIndex += 1) {
      const angle = featureIndex * 1.71;
      const radius = 17 + (featureIndex % 5) * 3.2;
      const localX = Math.cos(angle) * radius;
      const localZ = Math.sin(angle) * radius - 7;
      if (id === 'miskel-mushroom-forest') {
        const stemHeight = 3.4 + (featureIndex % 3);
        const stem = new Mesh(new CylinderGeometry(0.52, 0.78, stemHeight, 14), new MeshStandardMaterial({ color: 0xd7c1a6, roughness: 0.8 }));
        addRealmFeature(stem, localX, stemHeight / 2, localZ);
        const cap = new Mesh(new SphereGeometry(1.35 + (featureIndex % 3) * 0.28, 18, 12), new MeshStandardMaterial({ color: featureIndex % 2 === 0 ? 0xb74442 : 0x7b4ab0, roughness: 0.66 }));
        cap.name = 'Seed Life mushroom forest giant spotted cap';
        cap.scale.y = 0.42;
        addRealmFeature(cap, localX, stemHeight + 0.8, localZ);
        for (let spotIndex = 0; spotIndex < 4; spotIndex += 1) {
          const spot = new Mesh(new SphereGeometry(0.16, 8, 6), canopyWhiteMaterial);
          spot.name = 'Seed Life mushroom cap pale spot';
          spot.scale.y = 0.18;
          addRealmFeature(spot, localX + Math.cos(spotIndex * 1.7) * 0.6, stemHeight + 1.28, localZ + Math.sin(spotIndex * 1.7) * 0.38);
        }
      } else if (id === 'frozen-tundra') {
        const ice = new Mesh(new ConeGeometry(0.32 + (featureIndex % 3) * 0.14, 2.2 + (featureIndex % 4) * 0.5, 8), new MeshStandardMaterial({ color: 0xbfefff, roughness: 0.35, metalness: 0.08, transparent: true, opacity: 0.84 }));
        ice.name = 'Seed Life frozen tundra sharp icicle crystal';
        addRealmFeature(ice, localX, 1.1, localZ);
      } else if (id === 'volcanic-valley') {
        const rock = new Mesh(new SphereGeometry(0.8 + (featureIndex % 3) * 0.28, 10, 8), new MeshStandardMaterial({ color: 0x3d2b26, roughness: 0.92, emissive: 0x4b0900, emissiveIntensity: 0.08 }));
        rock.name = 'Seed Life volcanic valley dark lava rock';
        rock.scale.set(1.2, 0.48, 0.9);
        addRealmFeature(rock, localX, 0.36, localZ);
        if (featureIndex % 4 === 0) {
          const lava = new Mesh(new CylinderGeometry(1.6 + (featureIndex % 3) * 0.5, 1.4, 0.055, 28), new MeshStandardMaterial({
            color: 0xff6b18,
            emissive: 0xff2a00,
            emissiveIntensity: 1.15,
            roughness: 0.36,
          }));
          lava.name = 'Seed Life volcanic valley glowing lava pool';
          lava.scale.set(1.5, 1, 0.72);
          addRealmFeature(lava, localX + 3.2, 0.055, localZ + 1.8);
        }
      } else if (id === 'cholesterol-garden') {
        const star = new Mesh(new SphereGeometry(0.32 + (featureIndex % 3) * 0.06, 10, 8), portalGoldMaterial);
        star.name = 'Seed Life star garden glowing star stone';
        addRealmFeature(star, localX, 0.5 + (featureIndex % 3) * 0.22, localZ);
      } else if (id === 'dragon-jungle') {
        const trunkHeight = 3.4 + (featureIndex % 4) * 0.55;
        const trunk = new Mesh(new CylinderGeometry(0.28, 0.46, trunkHeight, 10), new MeshStandardMaterial({ color: 0x5a3b24, roughness: 0.92 }));
        trunk.name = 'Seed Life dragon jungle real tree trunk';
        addRealmFeature(trunk, localX, trunkHeight / 2, localZ);
        const canopy = new Mesh(new SphereGeometry(1.35 + (featureIndex % 3) * 0.2, 18, 12), new MeshStandardMaterial({ color: featureIndex % 2 === 0 ? 0x245d2a : 0x2f7530, roughness: 0.88 }));
        canopy.name = 'Seed Life dragon jungle leafy tree canopy';
        canopy.scale.set(1.2, 0.72, 1.05);
        addRealmFeature(canopy, localX, trunkHeight + 0.42, localZ);
        for (let vineIndex = 0; vineIndex < 3; vineIndex += 1) {
          const vine = new Mesh(new CylinderGeometry(0.035, 0.045, 2.7 + vineIndex * 0.28, 7), new MeshStandardMaterial({ color: 0x1f6d29, roughness: 0.9 }));
          vine.name = 'Seed Life dragon jungle hanging vine';
          vine.rotation.z = vineIndex % 2 === 0 ? 0.16 : -0.18;
          addRealmFeature(vine, localX + (vineIndex - 1) * 0.34, trunkHeight - 0.6, localZ + 0.38);
        }
        if (featureIndex % 3 === 0) {
          const statueMaterial = new MeshStandardMaterial({ color: 0x69624e, roughness: 0.9 });
          const body = new Mesh(new BoxGeometry(0.9, 0.62, 1.45), statueMaterial);
          body.name = 'Seed Life dragon jungle stone dragon sculpture body';
          addRealmFeature(body, localX + 2.0, 0.62, localZ - 1.6);
          const head = new Mesh(new BoxGeometry(0.58, 0.46, 0.58), statueMaterial);
          head.name = 'Seed Life dragon jungle stone dragon sculpture head';
          addRealmFeature(head, localX + 2.0, 1.02, localZ - 2.42);
          const wing = new Mesh(new ConeGeometry(0.45, 1.05, 4), statueMaterial);
          wing.name = 'Seed Life dragon jungle folded stone dragon wing';
          wing.rotation.z = 0.6;
          addRealmFeature(wing, localX + 1.5, 1.12, localZ - 1.5);
        }
      } else {
        const prism = new Mesh(new ConeGeometry(0.5, 1.8, 5), new MeshStandardMaterial({ color: 0xb7d9ff, roughness: 0.46, emissive: 0x714dff, emissiveIntensity: 0.22 }));
        prism.name = 'Seed Life rainbow dimension prismatic crystal';
        addRealmFeature(prism, localX, 0.9, localZ);
      }
    }
    if (id === 'volcanic-valley') {
      const volcanoMaterial = new MeshStandardMaterial({ color: 0x4a342d, roughness: 0.94, emissive: 0x2b0500, emissiveIntensity: 0.12 });
      const volcano = new Mesh(new ConeGeometry(7.6, 12.5, 28), volcanoMaterial);
      volcano.name = 'Seed Life volcanic valley huge central volcano';
      volcano.position.set(targetX + 24, 6.25, targetZ - 24);
      volcano.castShadow = true;
      volcano.receiveShadow = true;
      root.add(volcano);
      seedLifeOnlyGroups.push(volcano);
      const crater = new Mesh(new CylinderGeometry(2.05, 2.4, 0.18, 28), new MeshStandardMaterial({
        color: 0xff7a18,
        emissive: 0xff2400,
        emissiveIntensity: 1.35,
        roughness: 0.32,
      }));
      crater.name = 'Seed Life volcanic valley glowing lava crater';
      crater.position.set(targetX + 24, 12.58, targetZ - 24);
      crater.castShadow = true;
      root.add(crater);
      seedLifeOnlyGroups.push(crater);
    }
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      const marker = new Mesh(new SphereGeometry(0.18 + (index % 3) * 0.05, 12, 8), portalGoldMaterial);
      marker.name = `${label} portal sparkle stone`;
      marker.position.set(targetX + Math.cos(angle) * 8.2, 0.18, targetZ + Math.sin(angle) * 8.2);
      marker.castShadow = true;
      root.add(marker);
      seedLifeOnlyGroups.push(marker);
    }
  };

  addPortalPair('miskel-mushroom-forest', 'Miskel Forest', -50, -72, -430, -170, biomeMaterials.mushroom);
  addPortalPair('frozen-tundra', 'Frozen Tundra', -30, -72, -430, 170, biomeMaterials.frozen);
  addPortalPair('volcanic-valley', 'Volcanic Valley', -10, -72, 430, -170, biomeMaterials.volcanic);
  addPortalPair('cholesterol-garden', 'Star Garden', 10, -72, 430, 170, biomeMaterials.cosmic);
  addPortalPair('dragon-jungle', 'Dragon Jungle', 30, -72, 0, -430, biomeMaterials.jungle);
  addPortalPair('rainbow-dimension', 'Rainbow Gate', 50, -72, 0, 430, biomeMaterials.rainbow);

  addSeedLifeStall('Portal Key Master', 0, -55.4, 0);
  addSeedLifeStall('Mutation', -47, 54.8, Math.PI / 2);
  addSeedLifeStall('Decoration', -32, 54.8, Math.PI / 2);
  addSeedLifeStall('Weather', -17, 54.8, Math.PI / 2);
  addSeedLifeStall('Juice/Smoothie', 17, 54.8, Math.PI / 2);
  addSeedLifeStall('Wizard', 47, 54.8, Math.PI / 2);
  addSeedLifeStall('Scientist', 54.8, 30, Math.PI);
  addSeedLifeStall('Event Shop', 54.8, -30, Math.PI);

  const addBrickPath = (pathStart: Vector3, pathEnd: Vector3): void => {
    const pathVector = pathEnd.clone().sub(pathStart);
    const pathLength = Math.hypot(pathVector.x, pathVector.z);
    const pathAngle = Math.atan2(pathVector.x, pathVector.z);
    const pathDirection = pathVector.clone().normalize();
    const pathSide = new Vector3(pathDirection.z, 0, -pathDirection.x);
    const pathBase = new Mesh(new BoxGeometry(3.55, 0.018, pathLength + 1.4), pathDirtBaseMaterial);
    pathBase.name = 'Chapter 11 tan dirt trail under gray white bricks';
    pathBase.position.set((pathStart.x + pathEnd.x) / 2, 0.05, (pathStart.z + pathEnd.z) / 2);
    pathBase.rotation.y = pathAngle;
    pathBase.receiveShadow = true;
    root.add(pathBase);

    const stoneCount = 13;
    for (let i = 0; i < stoneCount; i += 1) {
      const t = i / (stoneCount - 1);
      const center = pathStart.clone().lerp(pathEnd, t);
      const sideOffset = pathSide.clone().multiplyScalar(i % 2 === 0 ? -0.38 : 0.38);
      center.add(sideOffset);
      const stone = new Mesh(new BoxGeometry(2.05, 0.026, 2.45), i % 2 === 0 ? pathStoneMaterial : pathStoneLightMaterial);
      stone.name = 'Chapter 11 visible gray white brick path stone';
      stone.position.set(center.x, 0.07, center.z);
      stone.rotation.y = pathAngle + (i % 2 === 0 ? 0.04 : -0.035);
      stone.receiveShadow = true;
      root.add(stone);
    }
  };
  addBrickPath(new Vector3(-25.09, 0.065, -40.86), new Vector3(-57.21, 0.065, -42.25));
  addBrickPath(new Vector3(-26.34, 0.065, 39.44), new Vector3(-58.46, 0.065, 38.05));
  addBrickPath(new Vector3(25.09, 0.065, -40.86), new Vector3(57.21, 0.065, -42.25));
  addBrickPath(new Vector3(26.34, 0.065, 39.44), new Vector3(58.46, 0.065, 38.05));

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
  normalOnlyGroups.push(northFence, southFence, westFence, eastFence);

  const postGeometry = new BoxGeometry(0.32, 1.55, 0.32);
  for (let i = -halfWidth; i <= halfWidth + 0.001; i += 2.5) {
    const northPost = new Mesh(postGeometry, fenceMaterial);
    northPost.name = 'Chapter 11 fence post';
    northPost.position.set(i, 0.775, -halfDepth);
    const southPost = northPost.clone();
    southPost.position.z = halfDepth;
    root.add(northPost, southPost);
    normalOnlyGroups.push(northPost, southPost);
  }
  for (let i = -halfDepth + 2.5; i <= halfDepth - 2.5 + 0.001; i += 2.5) {
    const westPost = new Mesh(postGeometry, fenceMaterial);
    westPost.name = 'Chapter 11 fence side post';
    westPost.position.set(-halfWidth, 0.775, i);
    const eastPost = westPost.clone();
    eastPost.position.x = halfWidth;
    root.add(westPost, eastPost);
    normalOnlyGroups.push(westPost, eastPost);
  }

  const addSeedLifeBorderSegment = (
    name: string,
    centerX: number,
    centerZ: number,
    width: number,
    depth: number,
  ): void => {
    if (width <= 0.4 || depth <= 0.4) {
      return;
    }
    const segment = new Mesh(new BoxGeometry(width, fenceHeight, depth), fenceMaterial);
    segment.name = name;
    segment.position.set(centerX, fenceHeight / 2, centerZ);
    segment.castShadow = true;
    segment.receiveShadow = true;
    root.add(segment);
    seedLifeOnlyGroups.push(segment);
    copyOnlyColliders.push({ centerX, centerZ, halfWidth: width / 2, halfDepth: depth / 2 });
  };

  const addSeedLifeHorizontalBorder = (name: string, z: number, openings: Array<{ center: number; width: number }>): void => {
    const sorted = openings
      .map((opening) => ({
        start: MathUtils.clamp(opening.center - opening.width / 2, -halfWidth, halfWidth),
        end: MathUtils.clamp(opening.center + opening.width / 2, -halfWidth, halfWidth),
      }))
      .sort((a, b) => a.start - b.start);
    let cursor = -halfWidth;
    sorted.forEach((opening, index) => {
      if (opening.start > cursor) {
        const length = opening.start - cursor;
        addSeedLifeBorderSegment(`${name} Seed Life fence segment ${index + 1}`, cursor + length / 2, z, length, fenceThickness);
      }
      cursor = Math.max(cursor, opening.end);
    });
    if (cursor < halfWidth) {
      const length = halfWidth - cursor;
      addSeedLifeBorderSegment(`${name} Seed Life fence end segment`, cursor + length / 2, z, length, fenceThickness);
    }
  };

  const addSeedLifeVerticalBorder = (name: string, x: number, openings: Array<{ center: number; width: number }>): void => {
    const sorted = openings
      .map((opening) => ({
        start: MathUtils.clamp(opening.center - opening.width / 2, -halfDepth, halfDepth),
        end: MathUtils.clamp(opening.center + opening.width / 2, -halfDepth, halfDepth),
      }))
      .sort((a, b) => a.start - b.start);
    let cursor = -halfDepth;
    sorted.forEach((opening, index) => {
      if (opening.start > cursor) {
        const length = opening.start - cursor;
        addSeedLifeBorderSegment(`${name} Seed Life fence segment ${index + 1}`, x, cursor + length / 2, fenceThickness, length);
      }
      cursor = Math.max(cursor, opening.end);
    });
    if (cursor < halfDepth) {
      const length = halfDepth - cursor;
      addSeedLifeBorderSegment(`${name} Seed Life fence end segment`, x, cursor + length / 2, fenceThickness, length);
    }
  };

  addSeedLifeHorizontalBorder('north border', -halfDepth, seedLifeGateOpenings.filter((opening) => opening.side === 'south'));
  addSeedLifeHorizontalBorder('south border', halfDepth, []);
  addSeedLifeVerticalBorder('west border', -halfWidth, seedLifeGateOpenings.filter((opening) => opening.side === 'west'));
  addSeedLifeVerticalBorder('east border', halfWidth, seedLifeGateOpenings.filter((opening) => opening.side === 'east'));

  addCollider(normalOnlyColliders, 0, -halfDepth, halfWidth + fenceThickness, fenceThickness);
  addCollider(normalOnlyColliders, 0, halfDepth, halfWidth + fenceThickness, fenceThickness);
  addCollider(normalOnlyColliders, -halfWidth, 0, fenceThickness, halfDepth + fenceThickness);
  addCollider(normalOnlyColliders, halfWidth, 0, fenceThickness, halfDepth + fenceThickness);

  const spawn = new Vector3(0, GAME_CONFIG.player.height, 0);
  const lookTarget = new Vector3(-52.8, GAME_CONFIG.player.height * 0.9, 4.6);

  return {
    root,
    colliders,
    normalOnlyColliders,
    copyOnlyColliders,
    dirtPatches,
    seedLifeDirtPatch,
    seedLifeDirtPatches,
    biomePortals,
    specialStalls,
    equipmentStand,
    equipmentStandCollider,
    fieldBounds: {
      minX: -490,
      maxX: 490,
      minZ: -490,
      maxZ: 490,
    },
    spawn,
    lookTarget,
    getSupportedFloorY(_position: Vector3): number | null {
      return FLOOR_Y + GAME_CONFIG.player.height;
    },
    update(_deltaSeconds: number, _playerPosition: Vector3): void {
      portalDiscs.forEach((disc, index) => {
        disc.rotation.z += _deltaSeconds * (0.45 + index * 0.015);
        const material = disc.material as MeshStandardMaterial;
        material.opacity = 0.58 + Math.sin(performance.now() * 0.004 + index) * 0.12;
      });
    },
    setSeedLifeLayout(enabled: boolean): void {
      dirtPatchGroups.forEach((group) => {
        group.visible = !enabled;
      });
      if (seedLifeDirtPatchGroup) {
        seedLifeDirtPatchGroup.visible = enabled;
      }
      seedLifeOnlyGroups.forEach((group) => {
        group.visible = enabled;
      });
      normalOnlyGroups.forEach((group) => {
        group.visible = !enabled;
      });
    },
    reset(): void {
      root.visible = false;
    },
  };
}
