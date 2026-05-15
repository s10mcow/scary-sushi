import { BoxGeometry, Group, Mesh } from 'three';

import type { LevelMaterials } from './materials';

export function createKitchenDoors(
  position: readonly [number, number, number],
  materials: LevelMaterials,
): Group {
  const root = new Group();
  root.position.set(position[0], position[1], position[2]);

  const frameTop = new Mesh(new BoxGeometry(4.4, 0.22, 0.24), materials.metal);
  frameTop.position.set(0, 3.1, 0);

  const frameLeft = new Mesh(new BoxGeometry(0.22, 3.05, 0.24), materials.metal);
  frameLeft.position.set(-2.1, 1.52, 0);

  const frameRight = frameLeft.clone();
  frameRight.position.x = 2.1;

  const wallFillLeft = new Mesh(new BoxGeometry(4.2, 3.3, 0.18), materials.wall);
  wallFillLeft.position.set(-4.3, 1.65, 0.02);

  const wallFillRight = wallFillLeft.clone();
  wallFillRight.position.x = 4.3;

  const wallFillTopLeft = new Mesh(new BoxGeometry(4.2, 0.42, 0.2), materials.wall);
  wallFillTopLeft.position.set(-4.3, 3.52, 0.01);

  const wallFillTopRight = wallFillTopLeft.clone();
  wallFillTopRight.position.x = 4.3;

  const pusherLeft = new Mesh(new BoxGeometry(1.5, 2.7, 0.12), materials.wall);
  pusherLeft.position.set(-0.95, 1.35, 0.34);
  pusherLeft.rotation.y = 0.72;

  const pusherRight = pusherLeft.clone();
  pusherRight.position.x = 0.95;
  pusherRight.rotation.y = -0.72;

  const windowLeft = new Mesh(new BoxGeometry(0.6, 0.48, 0.06), materials.accent);
  windowLeft.position.set(-0.74, 1.78, 0.35);
  windowLeft.rotation.y = 0.72;

  const windowRight = windowLeft.clone();
  windowRight.position.x = 0.74;
  windowRight.rotation.y = -0.72;

  const sign = new Mesh(new BoxGeometry(2.2, 0.52, 0.16), materials.accent);
  sign.position.set(0, 3.72, 0.02);

  root.add(
    wallFillLeft,
    wallFillRight,
    wallFillTopLeft,
    wallFillTopRight,
    frameTop,
    frameLeft,
    frameRight,
    pusherLeft,
    pusherRight,
    windowLeft,
    windowRight,
    sign,
  );

  root.traverse((child) => {
    if (child instanceof Mesh) {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });

  return root;
}
