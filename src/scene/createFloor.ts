import { Group, Mesh, PlaneGeometry } from 'three';

import type { FloorDefinition } from '../types/world';
import type { LevelMaterials } from './materials';

export function createFloor(
  floorDefinition: FloorDefinition,
  materials: LevelMaterials,
): Group {
  const root = new Group();

  const floor = new Mesh(
    new PlaneGeometry(floorDefinition.width, floorDefinition.depth),
    materials.floor,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(floorDefinition.center[0], 0, floorDefinition.center[1]);
  floor.receiveShadow = true;

  const ceiling = new Mesh(
    new PlaneGeometry(floorDefinition.width, floorDefinition.depth),
    materials.ceiling,
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(
    floorDefinition.center[0],
    floorDefinition.ceilingHeight,
    floorDefinition.center[1],
  );

  root.add(floor, ceiling);

  return root;
}
