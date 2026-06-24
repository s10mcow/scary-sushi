import {
  BoxGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
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
const girlHairMaterial = new MeshStandardMaterial({ color: 0x6b3a1f, roughness: 0.82 });
const faceMaterial = new MeshStandardMaterial({ color: 0x1b140f, roughness: 0.55 });
const eyeWhiteMaterial = new MeshStandardMaterial({ color: 0xf2f0e8, roughness: 0.5 });
const lipMaterial = new MeshStandardMaterial({ color: 0x7d322d, roughness: 0.68 });
const pathStoneMaterial = new MeshStandardMaterial({ color: 0x8f9290, roughness: 0.96 });
const pathStoneLightMaterial = new MeshStandardMaterial({ color: 0xd8d6cd, roughness: 0.94 });
const pathDirtBaseMaterial = new MeshStandardMaterial({ color: 0xb8945f, roughness: 0.98 });

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
  });
}

function addCollider(
  colliders: CollisionBox[],
  centerX: number,
  centerZ: number,
  halfWidth: number,
  halfDepth: number,
): void {
  colliders.push({ centerX, centerZ, halfWidth, halfDepth });
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

  const grass = new Mesh(new BoxGeometry(FIELD_WIDTH, 0.12, FIELD_DEPTH), grassMaterial);
  grass.name = 'Chapter 11 open grass field';
  grass.position.set(0, -0.06, 0);
  grass.receiveShadow = true;
  root.add(grass);

  const fenceHeight = 1.25;
  const fenceThickness = 0.22;
  const halfWidth = FIELD_WIDTH / 2;
  const halfDepth = FIELD_DEPTH / 2;

  const addDirtPatch = (centerX: number, centerZ: number, width: number, depth: number): void => {
    const patch = new Mesh(new BoxGeometry(width, 0.035, depth), dirtMaterial);
    patch.name = 'Chapter 11 fenced brown dirt patch';
    patch.position.set(centerX, 0.005, centerZ);
    patch.receiveShadow = true;
    root.add(patch);

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
    root.add(northRail, southRail, westRail, eastRail);

    [
      [centerX - halfPatchWidth, centerZ - halfPatchDepth],
      [centerX + halfPatchWidth, centerZ - halfPatchDepth],
      [centerX - halfPatchWidth, centerZ + halfPatchDepth],
      [centerX + halfPatchWidth, centerZ + halfPatchDepth],
    ].forEach(([postX, postZ]) => {
      const post = new Mesh(postGeometry, dirtFenceMaterial);
      post.name = 'Chapter 11 dirt patch stick fence post';
      post.position.set(postX, 0.26, postZ);
      root.add(post);
    });
  };
  addDirtPatch(-41.5, -39.85, 34, 38.7);
  addDirtPatch(-42.75, 40.45, 34, 38.7);
  addDirtPatch(42.75, -40.45, 34, 38.7);
  addDirtPatch(42.75, 40.45, 34, 38.7);

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

  const girlStand = stand.clone(true);
  girlStand.name = 'Chapter 11 second old fashioned garden stand with girl worker';
  girlStand.position.set(-52.82, 0, -2.42);
  const girlWorker = girlStand.getObjectByName('Chapter 11 garden stand person facing counter') as Group | undefined;
  if (girlWorker) {
    addGardeningSuitDetails(girlWorker, girlGardenSuitMaterial, 'Chapter 11 girl worker');
    addBox(girlWorker, 'Chapter 11 girl worker long back hair', [0.16, 0.54, 0.46], [-0.04, 1.72, 0], girlHairMaterial);
    addBox(girlWorker, 'Chapter 11 girl worker left long hair side', [0.12, 0.46, 0.1], [0.2, 1.66, -0.24], girlHairMaterial).rotation.z = -0.08;
    addBox(girlWorker, 'Chapter 11 girl worker right long hair side', [0.12, 0.46, 0.1], [0.2, 1.66, 0.24], girlHairMaterial).rotation.z = -0.08;
    addBox(girlWorker, 'Chapter 11 girl worker garden hat brim', [0.08, 0.05, 0.72], [0.31, 2.03, 0], dirtFenceMaterial);
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
  addStandLabel(stand, 'sell');
  addStandLabel(girlStand, 'buy seats');

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
