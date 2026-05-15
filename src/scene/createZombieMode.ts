import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  Vector3,
} from 'three';

import type { CollisionBox } from '../types/world';

export type ZombieWeaponId = 'pistol' | 'shotgun';
export type ZombieDefenseId = 'north' | 'south' | 'east' | 'west';

export interface ZombieDefensePoint {
  id: ZombieDefenseId;
  label: string;
  root: Group;
  position: Vector3;
  attackPosition: Vector3;
  breachPosition: Vector3;
  interactPosition: Vector3;
  collider: CollisionBox;
  planks: Mesh[];
  materials: MeshStandardMaterial[];
}

export interface ZombieSpawnLane {
  id: ZombieDefenseId;
  position: Vector3;
  route: Vector3[];
}

export interface ZombieModeData {
  root: Group;
  colliders: CollisionBox[];
  spawn: Vector3;
  center: Vector3;
  campfireLight: PointLight;
  defensePoints: ZombieDefensePoint[];
  zombieSpawnLanes: ZombieSpawnLane[];
  update(deltaSeconds: number, nightBlend: number): void;
  setDefenseState(id: ZombieDefenseId, level: number, healthRatio: number): void;
  reset(): void;
}

const CENTER_X = -356;
const CENTER_Z = -324;
const FOREST_SIZE = 196;
const CLEARING_RADIUS = 22;
const DEFENSE_DISTANCE = 14.5;

function createTree(x: number, z: number, scale: number): { root: Group; collider: CollisionBox } {
  const root = new Group();
  root.position.set(x, 0, z);

  const bark = new MeshStandardMaterial({
    color: 0x5c4532,
    roughness: 0.94,
    metalness: 0.02,
  });
  const leaves = new MeshStandardMaterial({
    color: 0x203d24,
    emissive: 0x10210f,
    emissiveIntensity: 0.04,
    roughness: 0.96,
    metalness: 0.01,
  });

  const trunk = new Mesh(new CylinderGeometry(0.46 * scale, 0.62 * scale, 8.8 * scale, 10), bark);
  trunk.position.y = 4.4 * scale;
  root.add(trunk);

  const crownBottom = new Mesh(new SphereGeometry(2.6 * scale, 12, 10), leaves);
  crownBottom.position.set(0, 9.2 * scale, 0);
  crownBottom.scale.set(1.16, 0.82, 1.12);
  const crownTop = new Mesh(new SphereGeometry(2.2 * scale, 12, 10), leaves);
  crownTop.position.set(0.3 * scale, 11.3 * scale, -0.18 * scale);
  crownTop.scale.set(1.1, 0.88, 1.04);
  root.add(crownBottom, crownTop);

  return {
    root,
    collider: {
      centerX: x,
      centerZ: z,
      halfWidth: 0.78 * scale,
      halfDepth: 0.78 * scale,
    },
  };
}

function createDefensePoint(
  id: ZombieDefenseId,
  x: number,
  z: number,
  rotationY: number,
  insideOffsetX: number,
  insideOffsetZ: number,
): ZombieDefensePoint {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const postMaterial = new MeshStandardMaterial({
    color: 0x7c6148,
    roughness: 0.88,
    metalness: 0.04,
  });

  const postOffsets: Array<[number, number]> = [
    [-3.2, -0.2],
    [3.2, -0.2],
  ];
  postOffsets.forEach(([postX, postZ]) => {
    const post = new Mesh(new BoxGeometry(0.34, 2.8, 0.34), postMaterial);
    post.position.set(postX, 1.4, postZ);
    root.add(post);
  });

  const materials = Array.from({ length: 3 }, () => new MeshStandardMaterial({
    color: 0x87623f,
    emissive: 0x2d190f,
    emissiveIntensity: 0.1,
    roughness: 0.92,
    metalness: 0.02,
  }));
  const planks = materials.map((material, index) => {
    const plank = new Mesh(new BoxGeometry(6.4, 0.36, 0.28), material);
    plank.position.set(0, 0.96 + index * 0.58, 0);
    plank.visible = false;
    root.add(plank);
    return plank;
  });

  const outsideNormal = new Vector3(-Math.sin(rotationY), 0, -Math.cos(rotationY));
  const insideNormal = outsideNormal.clone().multiplyScalar(-1);

  return {
    id,
    label: `${id[0].toUpperCase()}${id.slice(1)} Barricade`,
    root,
    position: new Vector3(x, 1.2, z),
    attackPosition: new Vector3(x, 1.2, z).addScaledVector(outsideNormal, 2.15),
    breachPosition: new Vector3(x, 1.2, z).addScaledVector(insideNormal, 1.95),
    interactPosition: new Vector3(x + insideOffsetX, 1.2, z + insideOffsetZ),
    collider: {
      centerX: x,
      centerZ: z,
      halfWidth: Math.abs(Math.sin(rotationY)) > 0.5 ? 0.6 : 3.4,
      halfDepth: Math.abs(Math.sin(rotationY)) > 0.5 ? 3.4 : 0.6,
      enabled: false,
    },
    planks,
    materials,
  };
}

export function createZombieMode(): ZombieModeData {
  const root = new Group();
  const colliders: CollisionBox[] = [];
  const center = new Vector3(CENTER_X, 0, CENTER_Z);

  const groundMaterial = new MeshStandardMaterial({
    color: 0x33452c,
    roughness: 1,
    metalness: 0,
  });
  const ground = new Mesh(new PlaneGeometry(FOREST_SIZE, FOREST_SIZE, 1, 1), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(CENTER_X, 0, CENTER_Z);
  root.add(ground);

  const ringMaterial = new MeshStandardMaterial({
    color: 0x3e4930,
    roughness: 0.96,
    metalness: 0.02,
  });
  const clearing = new Mesh(new CylinderGeometry(CLEARING_RADIUS, CLEARING_RADIUS + 2.4, 0.2, 28), ringMaterial);
  clearing.position.set(CENTER_X, 0.04, CENTER_Z);
  root.add(clearing);

  const campfireLight = new PointLight(0xffa85a, 1.8, 24, 1.8);
  campfireLight.position.set(CENTER_X, 1.8, CENTER_Z);
  root.add(campfireLight);

  const emberMaterial = new MeshStandardMaterial({
    color: 0x6a2d12,
    emissive: 0xff8c3b,
    emissiveIntensity: 1.4,
    roughness: 0.86,
    metalness: 0.02,
  });
  const ember = new Mesh(new CylinderGeometry(1.4, 1.9, 0.22, 16), emberMaterial);
  ember.position.set(CENTER_X, 0.12, CENTER_Z);
  root.add(ember);

  const crateMaterial = new MeshStandardMaterial({
    color: 0x7b5d3f,
    roughness: 0.88,
    metalness: 0.04,
  });
  const crate = new Mesh(new BoxGeometry(2.2, 1.4, 1.6), crateMaterial);
  crate.position.set(CENTER_X - 4.2, 0.72, CENTER_Z + 2.4);
  root.add(crate);
  colliders.push({
    centerX: crate.position.x,
    centerZ: crate.position.z,
    halfWidth: 1.1,
    halfDepth: 0.8,
  });

  const defensePoints: ZombieDefensePoint[] = [
    createDefensePoint('north', CENTER_X, CENTER_Z - DEFENSE_DISTANCE, 0, 0, 2.6),
    createDefensePoint('south', CENTER_X, CENTER_Z + DEFENSE_DISTANCE, Math.PI, 0, -2.6),
    createDefensePoint('east', CENTER_X + DEFENSE_DISTANCE, CENTER_Z, -Math.PI / 2, -2.6, 0),
    createDefensePoint('west', CENTER_X - DEFENSE_DISTANCE, CENTER_Z, Math.PI / 2, 2.6, 0),
  ];
  defensePoints.forEach((point) => {
    root.add(point.root);
    colliders.push(point.collider);
  });

  const zombieSpawnLanes: ZombieSpawnLane[] = [
    {
      id: 'north',
      position: new Vector3(CENTER_X, 0, CENTER_Z - 58),
      route: [
        new Vector3(CENTER_X - 8, 0, CENTER_Z - 45),
        new Vector3(CENTER_X - 4, 0, CENTER_Z - 28),
      ],
    },
    {
      id: 'south',
      position: new Vector3(CENTER_X, 0, CENTER_Z + 58),
      route: [
        new Vector3(CENTER_X + 7, 0, CENTER_Z + 45),
        new Vector3(CENTER_X + 3, 0, CENTER_Z + 28),
      ],
    },
    {
      id: 'east',
      position: new Vector3(CENTER_X + 58, 0, CENTER_Z),
      route: [
        new Vector3(CENTER_X + 44, 0, CENTER_Z + 9),
        new Vector3(CENTER_X + 28, 0, CENTER_Z + 4),
      ],
    },
    {
      id: 'west',
      position: new Vector3(CENTER_X - 58, 0, CENTER_Z),
      route: [
        new Vector3(CENTER_X - 45, 0, CENTER_Z - 8),
        new Vector3(CENTER_X - 28, 0, CENTER_Z - 3),
      ],
    },
    {
      id: 'north',
      position: new Vector3(CENTER_X + 18, 0, CENTER_Z - 56),
      route: [
        new Vector3(CENTER_X + 12, 0, CENTER_Z - 43),
        new Vector3(CENTER_X + 6, 0, CENTER_Z - 27),
      ],
    },
    {
      id: 'south',
      position: new Vector3(CENTER_X - 22, 0, CENTER_Z + 60),
      route: [
        new Vector3(CENTER_X - 14, 0, CENTER_Z + 47),
        new Vector3(CENTER_X - 6, 0, CENTER_Z + 29),
      ],
    },
  ];

  const treeAngles = Array.from({ length: 28 }, (_, index) => index / 28 * Math.PI * 2);
  treeAngles.forEach((angle, index) => {
    const distance = 34 + (index % 4) * 6 + (index % 3) * 2.5;
    const x = CENTER_X + Math.cos(angle) * distance;
    const z = CENTER_Z + Math.sin(angle) * distance;
    const scale = 0.9 + (index % 5) * 0.08;
    const tree = createTree(x, z, scale);
    root.add(tree.root);
    colliders.push(tree.collider);
  });

  const extraTreeOffsets: Array<[number, number, number]> = [
    [-48, -18, 1.1],
    [-42, 22, 0.96],
    [36, -24, 1.02],
    [44, 20, 1.12],
    [-12, -46, 0.98],
    [18, 48, 1.06],
    [52, -8, 0.94],
    [-56, 6, 1.08],
  ];
  extraTreeOffsets.forEach(([offsetX, offsetZ, scale]) => {
    const tree = createTree(CENTER_X + offsetX, CENTER_Z + offsetZ, scale);
    root.add(tree.root);
    colliders.push(tree.collider);
  });

  const spawn = new Vector3(CENTER_X, 1.72, CENTER_Z + 6.4);

  const setDefenseState = (id: ZombieDefenseId, level: number, healthRatio: number): void => {
    const point = defensePoints.find((candidate) => candidate.id === id);
    if (!point) {
      return;
    }

    const clampedLevel = Math.max(0, Math.min(3, level));
    point.planks.forEach((plank, index) => {
      plank.visible = index < clampedLevel;
    });
    point.materials.forEach((material) => {
      material.emissiveIntensity = 0.06 + Math.max(0, Math.min(1, healthRatio)) * 0.18;
      material.color.setHex(healthRatio > 0.34 ? 0x87623f : 0x5c3926);
    });
    point.collider.enabled = clampedLevel > 0 && healthRatio > 0.05;
  };

  const update = (_deltaSeconds: number, nightBlend: number): void => {
    campfireLight.intensity =
      1.2
      + nightBlend * 1.4
      + Math.sin(performance.now() * 0.014) * 0.22;
    emberMaterial.emissiveIntensity = 1.1 + nightBlend * 1.4;
    groundMaterial.color.setHex(nightBlend > 0.5 ? 0x243024 : 0x33452c);
  };

  const reset = (): void => {
    defensePoints.forEach((point) => {
      setDefenseState(point.id, 0, 0);
    });
  };

  reset();

  return {
    root,
    colliders,
    spawn,
    center,
    campfireLight,
    defensePoints,
    zombieSpawnLanes,
    update,
    setDefenseState,
    reset,
  };
}
