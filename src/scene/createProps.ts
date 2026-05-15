import { BoxGeometry, CylinderGeometry, Group, Mesh, Object3D } from 'three';

import type { CollisionBox, StaticPropDefinition } from '../types/world';
import type { LevelMaterials } from './materials';

interface PropResult {
  root: Group;
  colliders: CollisionBox[];
}

export function createProps(
  props: StaticPropDefinition[],
  materials: LevelMaterials,
): PropResult {
  const root = new Group();
  const colliders: CollisionBox[] = [];

  for (const prop of props) {
    const object = buildProp(prop, materials);
    let halfWidth = prop.size[0] / 2;
    let halfDepth = prop.size[2] / 2;

    if (prop.kind === 'pillar') {
      halfWidth = prop.size[0] * 0.33;
      halfDepth = prop.size[2] * 0.33;
    }

    object.position.set(...prop.position);
    object.rotation.y = prop.rotationY ?? 0;
    applyShadow(object);

    root.add(object);
    colliders.push({
      centerX: prop.position[0],
      centerZ: prop.position[2],
      halfWidth,
      halfDepth,
    });
  }

  return { root, colliders };
}

function buildProp(prop: StaticPropDefinition, materials: LevelMaterials): Object3D {
  switch (prop.kind) {
    case 'pillar':
      return new Mesh(
        new CylinderGeometry(prop.size[0] * 0.5, prop.size[0] * 0.55, prop.size[1], 14),
        materials.metal,
      );
    case 'counter':
      return createCounter(prop, materials);
    case 'shelf':
      return createShelf(prop, materials);
    case 'prepTable':
      return createPrepTable(prop, materials);
    case 'crate':
    default:
      return new Mesh(new BoxGeometry(...prop.size), materials.prop);
  }
}

function createCounter(
  prop: StaticPropDefinition,
  materials: LevelMaterials,
): Group {
  const root = new Group();
  const [width, height, depth] = prop.size;
  const topHeight = height * 0.16;
  const bodyHeight = height - topHeight;

  const body = new Mesh(
    new BoxGeometry(width, bodyHeight, depth),
    materials.prop,
  );
  body.position.y = -topHeight / 2;

  const top = new Mesh(
    new BoxGeometry(width + 0.08, topHeight, depth + 0.08),
    materials.metal,
  );
  top.position.y = height / 2 - topHeight / 2;

  root.add(body, top);

  return root;
}

function createShelf(
  prop: StaticPropDefinition,
  materials: LevelMaterials,
): Group {
  const root = new Group();
  const [width, height, depth] = prop.size;
  const postWidth = Math.min(width, depth) * 0.14;
  const shelfThickness = 0.1;
  const postY = 0;
  const shelfYs = [-height * 0.28, 0, height * 0.28];

  const postOffsets: Array<[number, number]> = [
    [-width / 2 + postWidth / 2, -depth / 2 + postWidth / 2],
    [width / 2 - postWidth / 2, -depth / 2 + postWidth / 2],
    [-width / 2 + postWidth / 2, depth / 2 - postWidth / 2],
    [width / 2 - postWidth / 2, depth / 2 - postWidth / 2],
  ];

  for (const [x, z] of postOffsets) {
    const post = new Mesh(
      new BoxGeometry(postWidth, height, postWidth),
      materials.metal,
    );
    post.position.set(x, postY, z);
    root.add(post);
  }

  for (const y of shelfYs) {
    const shelf = new Mesh(
      new BoxGeometry(width, shelfThickness, depth),
      materials.prop,
    );
    shelf.position.y = y;
    root.add(shelf);
  }

  return root;
}

function createPrepTable(
  prop: StaticPropDefinition,
  materials: LevelMaterials,
): Group {
  const root = new Group();
  const [width, height, depth] = prop.size;
  const topHeight = 0.12;
  const legWidth = 0.12;
  const legHeight = height - topHeight;

  const top = new Mesh(
    new BoxGeometry(width, topHeight, depth),
    materials.metal,
  );
  top.position.y = height / 2 - topHeight / 2;
  root.add(top);

  const legOffsets: Array<[number, number]> = [
    [-width / 2 + legWidth * 1.2, -depth / 2 + legWidth * 1.2],
    [width / 2 - legWidth * 1.2, -depth / 2 + legWidth * 1.2],
    [-width / 2 + legWidth * 1.2, depth / 2 - legWidth * 1.2],
    [width / 2 - legWidth * 1.2, depth / 2 - legWidth * 1.2],
  ];

  for (const [x, z] of legOffsets) {
    const leg = new Mesh(
      new BoxGeometry(legWidth, legHeight, legWidth),
      materials.metal,
    );
    leg.position.set(x, -topHeight / 2, z);
    root.add(leg);
  }

  return root;
}

function applyShadow(object: Object3D): void {
  object.traverse((child) => {
    if (child instanceof Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}
