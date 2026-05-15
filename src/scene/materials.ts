import { MeshStandardMaterial } from 'three';

export interface LevelMaterials {
  wall: MeshStandardMaterial;
  floor: MeshStandardMaterial;
  ceiling: MeshStandardMaterial;
  prop: MeshStandardMaterial;
  metal: MeshStandardMaterial;
  accent: MeshStandardMaterial;
}

export function createLevelMaterials(): LevelMaterials {
  return {
    wall: new MeshStandardMaterial({
      color: 0xe5e2da,
      roughness: 0.88,
      metalness: 0.04,
    }),
    floor: new MeshStandardMaterial({
      color: 0xc5cdc7,
      roughness: 0.78,
      metalness: 0.1,
    }),
    ceiling: new MeshStandardMaterial({
      color: 0xf7f7f1,
      roughness: 0.9,
      metalness: 0.02,
    }),
    prop: new MeshStandardMaterial({
      color: 0xc39568,
      roughness: 0.76,
      metalness: 0.1,
    }),
    metal: new MeshStandardMaterial({
      color: 0xd6dde0,
      roughness: 0.4,
      metalness: 0.56,
    }),
    accent: new MeshStandardMaterial({
      color: 0x6d3116,
      emissive: 0xff9a47,
      emissiveIntensity: 2.2,
      roughness: 0.34,
      metalness: 0.16,
    }),
  };
}
