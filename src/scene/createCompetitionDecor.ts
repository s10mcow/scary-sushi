import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PointLight,
} from 'three';

import type { FlickerFixture } from '../types/world';

interface CompetitionDecorResult {
  root: Group;
  flickerFixtures: FlickerFixture[];
}

interface FixtureSpec {
  position: [number, number, number];
  baseIntensity: number;
  baseEmissiveIntensity: number;
  instability: number;
  lit?: boolean;
}

export function createCompetitionDecor(): CompetitionDecorResult {
  const root = new Group();
  const flickerFixtures: FlickerFixture[] = [];

  const fixtureFrameMaterial = new MeshStandardMaterial({
    color: 0xb8c1c6,
    roughness: 0.34,
    metalness: 0.72,
  });
  const bannerMaterials = [
    new MeshStandardMaterial({ color: 0xff7b3f, roughness: 0.64, metalness: 0.04 }),
    new MeshStandardMaterial({ color: 0x3ca0f0, roughness: 0.64, metalness: 0.04 }),
    new MeshStandardMaterial({ color: 0x74bd57, roughness: 0.64, metalness: 0.04 }),
  ];

  const fixtureSpecs: FixtureSpec[] = [
    { position: [-12, 3.72, 60], baseIntensity: 1.92, baseEmissiveIntensity: 1.28, instability: 0.08 },
    { position: [0, 3.72, 60], baseIntensity: 2.06, baseEmissiveIntensity: 1.36, instability: 0.06, lit: true },
    { position: [12, 3.72, 60], baseIntensity: 1.92, baseEmissiveIntensity: 1.28, instability: 0.08 },
    { position: [-12, 3.72, 50], baseIntensity: 1.76, baseEmissiveIntensity: 1.18, instability: 0.12 },
    { position: [0, 3.72, 50], baseIntensity: 1.86, baseEmissiveIntensity: 1.22, instability: 0.14, lit: true },
    { position: [12, 3.72, 50], baseIntensity: 1.76, baseEmissiveIntensity: 1.18, instability: 0.12 },
    { position: [-20, 3.72, 34], baseIntensity: 1.58, baseEmissiveIntensity: 1.03, instability: 0.24 },
    { position: [0, 3.72, 34], baseIntensity: 1.64, baseEmissiveIntensity: 1.08, instability: 0.28, lit: true },
    { position: [20, 3.72, 34], baseIntensity: 1.58, baseEmissiveIntensity: 1.03, instability: 0.24 },
    { position: [-20, 3.72, 18], baseIntensity: 1.48, baseEmissiveIntensity: 0.98, instability: 0.32 },
    { position: [0, 3.72, 18], baseIntensity: 1.54, baseEmissiveIntensity: 1.02, instability: 0.34, lit: true },
    { position: [20, 3.72, 18], baseIntensity: 1.48, baseEmissiveIntensity: 0.98, instability: 0.32 },
    { position: [-28, 3.72, 2], baseIntensity: 1.36, baseEmissiveIntensity: 0.92, instability: 0.42 },
    { position: [0, 3.72, 2], baseIntensity: 1.42, baseEmissiveIntensity: 0.96, instability: 0.46, lit: true },
    { position: [28, 3.72, 2], baseIntensity: 1.36, baseEmissiveIntensity: 0.92, instability: 0.42 },
    { position: [-36, 3.72, -18], baseIntensity: 1.24, baseEmissiveIntensity: 0.84, instability: 0.56 },
    { position: [0, 3.72, -18], baseIntensity: 1.3, baseEmissiveIntensity: 0.88, instability: 0.52, lit: true },
    { position: [36, 3.72, -18], baseIntensity: 1.24, baseEmissiveIntensity: 0.84, instability: 0.56 },
    { position: [-44, 3.72, -38], baseIntensity: 1.12, baseEmissiveIntensity: 0.78, instability: 0.66 },
    { position: [0, 3.72, -38], baseIntensity: 1.18, baseEmissiveIntensity: 0.82, instability: 0.6, lit: true },
    { position: [44, 3.72, -38], baseIntensity: 1.12, baseEmissiveIntensity: 0.78, instability: 0.66 },
    { position: [-44, 3.72, -54], baseIntensity: 1.06, baseEmissiveIntensity: 0.74, instability: 0.72 },
    { position: [0, 3.72, -54], baseIntensity: 1.12, baseEmissiveIntensity: 0.78, instability: 0.68, lit: true },
    { position: [44, 3.72, -54], baseIntensity: 1.06, baseEmissiveIntensity: 0.74, instability: 0.72 },
    { position: [-44, 3.72, -70], baseIntensity: 0.98, baseEmissiveIntensity: 0.7, instability: 0.8 },
    { position: [0, 3.72, -70], baseIntensity: 1.04, baseEmissiveIntensity: 0.74, instability: 0.76, lit: true },
    { position: [44, 3.72, -70], baseIntensity: 0.98, baseEmissiveIntensity: 0.7, instability: 0.8 },
  ];

  fixtureSpecs.forEach((spec, index) => {
    const frame = new Mesh(new BoxGeometry(2.8, 0.16, 1.1), fixtureFrameMaterial);
    frame.position.set(...spec.position);

    const diffuserMaterial = new MeshStandardMaterial({
      color: 0xfffbef,
      emissive: 0xfff7de,
      emissiveIntensity: spec.baseEmissiveIntensity,
      roughness: 0.28,
      metalness: 0.04,
    });
    const diffuser = new Mesh(new BoxGeometry(2.44, 0.08, 0.8), diffuserMaterial);
    diffuser.position.set(spec.position[0], spec.position[1] - 0.07, spec.position[2]);

    let light: PointLight | undefined;

    if (spec.lit) {
      light = new PointLight(0xfff3d8, spec.baseIntensity, 17, 1.7);
      light.position.set(spec.position[0], spec.position[1] - 0.25, spec.position[2]);
      root.add(frame, diffuser, light);
    } else {
      root.add(frame, diffuser);
    }

    flickerFixtures.push({
      light,
      material: diffuserMaterial,
      baseIntensity: spec.baseIntensity,
      baseEmissiveIntensity: spec.baseEmissiveIntensity,
      instability: spec.instability,
      phase: index * 0.83,
      zone: spec.position[2] <= 18 ? 'maze' : 'kitchen',
      z: spec.position[2],
    });
  });

  const bannerPositions: Array<[number, number, number]> = [
    [-8.4, 2.55, 64.8],
    [0, 2.55, 64.8],
    [8.4, 2.55, 64.8],
  ];

  bannerPositions.forEach(([x, y, z], index) => {
    const panel = new Mesh(
      new BoxGeometry(4.2, 1.5, 0.14),
      bannerMaterials[index],
    );
    panel.position.set(x, y, z);

    const insetMaterial = new MeshStandardMaterial({
      color: 0xfffbef,
      emissive: 0xfff7de,
      emissiveIntensity: 1.1,
      roughness: 0.28,
      metalness: 0.04,
    });
    const inset = new Mesh(new BoxGeometry(3.4, 1, 0.08), insetMaterial);
    inset.position.set(x, y, z - 0.05);

    root.add(panel, inset);
  });

  root.traverse((child) => {
    if (child instanceof Mesh) {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });

  return { root, flickerFixtures };
}
