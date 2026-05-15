import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';

import { GAME_CONFIG } from '../config/gameConfig';
import type {
  CollisionBox,
  IngredientId,
  MachineAnimationState,
  PlateAnimationState,
  ProcessingStationId,
  StationAnimator,
  StationInteractable,
} from '../types/world';
import type { LevelMaterials } from './materials';

interface KitchenStation {
  root: Group;
  colliders: CollisionBox[];
  stoveLight: PointLight;
  interactables: StationInteractable[];
  animator: StationAnimator;
}

export function createKitchenStation(
  position: readonly [number, number, number],
  materials: LevelMaterials,
): KitchenStation {
  const root = new Group();
  root.position.set(position[0], position[1], position[2]);

  const colliders: CollisionBox[] = [];
  const interactables: StationInteractable[] = [];

  const rearCounter = new Mesh(new BoxGeometry(8.8, 1.02, 1.38), materials.metal);
  rearCounter.position.set(0, 0.51, -0.12);

  const rearCounterTop = new Mesh(new BoxGeometry(8.9, 0.08, 1.44), materials.prop);
  rearCounterTop.position.set(0, 1.05, -0.12);

  const splashGuard = new Mesh(new BoxGeometry(8.9, 0.42, 0.12), materials.metal);
  splashGuard.position.set(0, 1.23, -0.72);

  const hood = new Mesh(new BoxGeometry(4.1, 0.28, 2), materials.metal);
  hood.position.set(0, 3.08, -0.04);

  const hoodStem = new Mesh(new BoxGeometry(0.26, 2.1, 0.26), materials.metal);
  hoodStem.position.set(0, 2.1, -0.04);

  const platingIsland = new Mesh(new BoxGeometry(3.2, 0.98, 1.08), materials.metal);
  platingIsland.position.set(0, 0.49, 2.12);

  const platingTop = new Mesh(new BoxGeometry(3.26, 0.08, 1.12), materials.prop);
  platingTop.position.set(0, 1.02, 2.12);

  const plateStand = new Mesh(new BoxGeometry(1.1, 0.94, 1.02), materials.metal);
  plateStand.position.set(-6.28, 0.47, 0.12);

  const plateStandTop = new Mesh(new BoxGeometry(1.14, 0.08, 1.06), materials.prop);
  plateStandTop.position.set(-6.28, 0.96, 0.12);

  const plateStack = createPlateStackDisplay(5);
  plateStack.position.set(-6.28, 1.03, 0.12);

  const assemblyPlateDisplay = new Group();
  assemblyPlateDisplay.position.set(0, 1.08, 2.12);

  const assemblyPlate = createServingPlate(0.38);
  const assemblyPlateContents = new Group();
  assemblyPlateContents.position.y = 0.04;
  assemblyPlateDisplay.add(assemblyPlate, assemblyPlateContents);

  const grainer = createMachineCabinet({
    x: -4.1,
    z: 0.12,
    materials,
    accentColor: 0xd9b765,
    topColor: 0xf0ead8,
    garnish: createGrainerHead(materials),
  });

  const skinner = createMachineCabinet({
    x: -2,
    z: 0.12,
    materials,
    accentColor: 0xd47064,
    topColor: 0xf3ece0,
    garnish: createSkinnerHead(materials),
  });

  const boiler = createBoiler(materials);
  boiler.position.set(0.3, 0, 0.05);

  const dryer = createMachineCabinet({
    x: 2.35,
    z: 0.12,
    materials,
    accentColor: 0x6da583,
    topColor: 0xecf1ea,
    garnish: createDryerHead(materials),
  });

  const slicer = createMachineCabinet({
    x: 4.55,
    z: 0.12,
    materials,
    accentColor: 0x5b8d74,
    topColor: 0xe7ece7,
    garnish: createSlicerHead(materials),
  });

  const conveyor = createConveyor(materials);
  conveyor.position.set(6.8, 0, 1.1);

  const labels = [
    createMachineBillboard({
      title: 'GRAINER',
      recipe: 'Rice Stalk -> Raw Rice',
      position: [-4.1, 2.68, 0.18],
      accent: '#d2aa56',
    }),
    createMachineBillboard({
      title: 'SKINNER',
      recipe: 'Fish -> Salmon or Tuna',
      position: [-2, 2.68, 0.18],
      accent: '#d36c5f',
    }),
    createMachineBillboard({
      title: 'BOILER',
      recipe: 'Raw Rice -> Cooked Rice',
      position: [0.3, 2.92, 0.18],
      accent: '#d88d48',
    }),
    createMachineBillboard({
      title: 'DRYER',
      recipe: 'Fresh Seaweed -> Dried',
      position: [2.35, 2.68, 0.18],
      accent: '#77a982',
    }),
    createMachineBillboard({
      title: 'SLICER',
      recipe: 'Dried Seaweed -> Sliced',
      position: [4.55, 2.68, 0.18],
      accent: '#4d8771',
    }),
    createMachineBillboard({
      title: 'PLATE STACK',
      recipe: 'Pick Up / Drop Plate',
      position: [-6.28, 2.5, 0.12],
      accent: '#b3bcc2',
    }),
    createMachineBillboard({
      title: 'ASSEMBLY',
      recipe: 'Plate Ingredients Here',
      position: [0, 2.62, 2.12],
      accent: '#d9804a',
    }),
    createMachineBillboard({
      title: 'JUDGES BELT',
      recipe: 'Send Finished Dish',
      position: [6.8, 2.58, 1.1],
      accent: '#efbe74',
    }),
  ];

  const machineDisplays = [
    createInputSlot({
      x: -4.1,
      y: 1.98,
      z: 0.18,
      materials,
      token: createRiceStalkToken(),
    }),
    createInputSlot({
      x: -2,
      y: 1.98,
      z: 0.18,
      materials,
      token: createFishToken(0xff8f58, 0xffc49b),
    }),
    createInputSlot({
      x: 0.3,
      y: 2.18,
      z: 0.18,
      materials,
      token: createRawRiceToken(),
    }),
    createInputSlot({
      x: 2.35,
      y: 1.98,
      z: 0.18,
      materials,
      token: createSeaweedToken(),
    }),
    createInputSlot({
      x: 4.55,
      y: 1.98,
      z: 0.18,
      materials,
      token: createDriedSeaweedToken(),
    }),
    createInputSlot({
      x: 0,
      y: 1.98,
      z: 2.12,
      materials,
      token: createPlateToken(),
    }),
  ];

  const machineAnchors = {
    grainer: createAnimationAnchors(grainer, [0, 1.7, -0.1], [0, 1.04, 0.32]),
    skinner: createAnimationAnchors(skinner, [-0.34, 1.24, -0.02], [0.34, 1.1, 0.3]),
    boiler: createAnimationAnchors(boiler, [0, 1.7, 0.02], [0, 1.42, 0.02]),
    dryer: createAnimationAnchors(dryer, [0, 1.3, -0.12], [0, 1.14, 0.26]),
    slicer: createAnimationAnchors(slicer, [-0.28, 1.18, -0.04], [0.3, 1.12, 0.26]),
  } satisfies Record<ProcessingStationId, MachineTokenAnchors>;

  const animator = new KitchenStationAnimator(machineAnchors, {
    stackRoot: plateStack,
    stackCount: 5,
    assemblyPlateRoot: assemblyPlateDisplay,
    assemblyContentsRoot: assemblyPlateContents,
  });

  const stoveLight = new PointLight(0xff9137, 1.8, 9, 2.2);
  stoveLight.position.set(0.3, 1.96, 0.04);
  stoveLight.castShadow = false;

  root.add(
    rearCounter,
    rearCounterTop,
    splashGuard,
    hood,
    hoodStem,
    platingIsland,
    platingTop,
    plateStand,
    plateStandTop,
    plateStack,
    assemblyPlateDisplay,
    grainer,
    skinner,
    boiler,
    dryer,
    slicer,
    conveyor,
    stoveLight,
    ...labels,
    ...machineDisplays,
  );
  applyShadow(root);

  colliders.push(
    {
      centerX: position[0],
      centerZ: position[2] - 0.12,
      halfWidth: 4.4,
      halfDepth: 0.69,
    },
    {
      centerX: position[0],
      centerZ: position[2] + 2.12,
      halfWidth: 1.6,
      halfDepth: 0.54,
    },
    {
      centerX: position[0] - 6.28,
      centerZ: position[2] + 0.12,
      halfWidth: 0.55,
      halfDepth: 0.51,
    },
    {
      centerX: position[0] + 6.8,
      centerZ: position[2] + 1.1,
      halfWidth: 1.25,
      halfDepth: 0.56,
    },
  );

  interactables.push(
    createInteractable(position, 'grainer', 'Grainer', -4.1, 1.26),
    createInteractable(position, 'skinner', 'Skinner', -2, 1.26),
    createInteractable(position, 'boiler', 'Boiler', 0.3, 1.34),
    createInteractable(position, 'dryer', 'Dryer', 2.35, 1.26),
    createInteractable(position, 'slicer', 'Slicer', 4.55, 1.26),
    createInteractable(position, 'plate', 'Plate Stack', -6.28, 1.18),
    createInteractable(position, 'assembly', 'Assembly Bench', 0, 3.18),
    createInteractable(position, 'submission', 'Judges Belt', 6.8, 2.4),
  );

  return {
    root,
    colliders,
    stoveLight,
    interactables,
    animator,
  };
}

function createMachineCabinet({
  x,
  z,
  materials,
  accentColor,
  topColor,
  garnish,
}: {
  x: number;
  z: number;
  materials: LevelMaterials;
  accentColor: number;
  topColor: number;
  garnish: Group;
}): Group {
  const root = new Group();
  root.position.set(x, 0, z);

  const base = new Mesh(new BoxGeometry(1.46, 0.96, 1.02), materials.metal);
  base.position.set(0, 0.48, 0);

  const top = new Mesh(
    new BoxGeometry(1.52, 0.08, 1.08),
    new MeshStandardMaterial({
      color: topColor,
      roughness: 0.56,
      metalness: 0.12,
    }),
  );
  top.position.set(0, 0.98, 0);

  const trim = new Mesh(
    new BoxGeometry(1.48, 0.16, 0.12),
    new MeshStandardMaterial({
      color: accentColor,
      roughness: 0.52,
      metalness: 0.18,
    }),
  );
  trim.position.set(0, 0.68, 0.48);

  garnish.position.y = 1.06;
  root.add(base, top, trim, garnish);
  return root;
}

function createGrainerHead(materials: LevelMaterials): Group {
  const root = new Group();

  const hopper = new Mesh(new BoxGeometry(0.58, 0.38, 0.48), materials.prop);
  hopper.position.set(0, 0.28, -0.08);
  hopper.scale.set(1, 1, 0.86);

  const chute = new Mesh(new BoxGeometry(0.22, 0.14, 0.48), materials.accent);
  chute.position.set(0, 0.02, 0.22);

  root.add(hopper, chute);
  return root;
}

function createSkinnerHead(materials: LevelMaterials): Group {
  const root = new Group();

  const drum = new Mesh(new CylinderGeometry(0.18, 0.18, 0.72, 18), materials.accent);
  drum.rotation.z = Math.PI / 2;
  drum.position.set(0, 0.28, 0.02);

  const blade = new Mesh(new BoxGeometry(0.58, 0.08, 0.24), materials.prop);
  blade.position.set(0, 0.12, 0.18);

  root.add(drum, blade);
  return root;
}

function createDryerHead(materials: LevelMaterials): Group {
  const root = new Group();

  const chamber = new Mesh(new BoxGeometry(0.68, 0.48, 0.62), materials.prop);
  chamber.position.set(0, 0.24, -0.02);

  const vent = new Mesh(new BoxGeometry(0.44, 0.08, 0.22), materials.accent);
  vent.position.set(0, 0.18, 0.34);

  root.add(chamber, vent);
  return root;
}

function createSlicerHead(materials: LevelMaterials): Group {
  const root = new Group();

  const body = new Mesh(new BoxGeometry(0.66, 0.26, 0.58), materials.prop);
  body.position.set(0, 0.2, -0.04);

  const blade = new Mesh(new CylinderGeometry(0.16, 0.16, 0.08, 18), materials.accent);
  blade.rotation.z = Math.PI / 2;
  blade.position.set(0.18, 0.3, 0.22);

  root.add(body, blade);
  return root;
}

function createBoiler(materials: LevelMaterials): Group {
  const root = new Group();

  const range = new Mesh(new BoxGeometry(1.56, 0.96, 1.08), materials.metal);
  range.position.set(0, 0.48, 0);

  const top = new Mesh(new BoxGeometry(1.6, 0.08, 1.12), materials.prop);
  top.position.set(0, 0.98, 0);

  const pot = new Mesh(new CylinderGeometry(0.34, 0.3, 0.42, 18), materials.accent);
  pot.position.set(0, 1.2, 0.02);

  const lid = new Mesh(new CylinderGeometry(0.36, 0.36, 0.05, 18), materials.prop);
  lid.position.set(0, 1.44, 0.02);

  const handle = new Mesh(new TorusGeometry(0.08, 0.02, 8, 18), materials.metal);
  handle.rotation.x = Math.PI / 2;
  handle.position.set(0, 1.52, 0.02);

  const burnerA = new Mesh(new BoxGeometry(0.24, 0.03, 0.24), materials.accent);
  burnerA.position.set(-0.34, 1.02, -0.2);
  const burnerB = burnerA.clone();
  burnerB.position.x = 0.34;
  const burnerC = burnerA.clone();
  burnerC.position.set(0, 1.02, 0.25);

  root.add(range, top, pot, lid, handle, burnerA, burnerB, burnerC);
  return root;
}

function createConveyor(materials: LevelMaterials): Group {
  const root = new Group();

  const base = new Mesh(new BoxGeometry(2.6, 0.82, 1.04), materials.metal);
  base.position.set(0, 0.41, 0);

  const belt = new Mesh(new BoxGeometry(2.64, 0.08, 0.94), materials.accent);
  belt.position.set(0, 0.88, 0);

  const guard = new Mesh(new BoxGeometry(0.1, 0.42, 1.02), materials.metal);
  guard.position.set(1.32, 1.04, 0);

  const chuteRing = new Mesh(new CylinderGeometry(0.58, 0.66, 0.18, 24), materials.metal);
  chuteRing.rotation.x = Math.PI / 2;
  chuteRing.position.set(2.28, 0.92, 0);

  const chuteHole = new Mesh(new CylinderGeometry(0.46, 0.46, 0.22, 24), materials.wall);
  chuteHole.rotation.x = Math.PI / 2;
  chuteHole.position.set(2.28, 0.92, 0);

  const mouth = new Mesh(new BoxGeometry(0.5, 0.22, 1.18), materials.wall);
  mouth.position.set(2.55, 1.1, 0);

  root.add(base, belt, guard, chuteRing, chuteHole, mouth);
  return root;
}

function createMachineBillboard({
  title,
  recipe,
  position,
  accent,
}: {
  title: string;
  recipe: string;
  position: [number, number, number];
  accent: string;
}): Group {
  const root = new Group();
  root.position.set(position[0], position[1], position[2]);

  const pole = new Mesh(
    new BoxGeometry(0.08, 0.54, 0.08),
    new MeshStandardMaterial({
      color: 0xb8c3c9,
      roughness: 0.48,
      metalness: 0.42,
    }),
  );
  pole.position.y = -0.32;

  const plane = new Mesh(
    new PlaneGeometry(1.54, 0.86),
    new MeshStandardMaterial({
      map: createLabelTexture(title, recipe, accent),
      transparent: true,
      roughness: 0.92,
      metalness: 0.02,
      side: DoubleSide,
    }),
  );

  root.add(pole, plane);
  return root;
}

function createLabelTexture(title: string, recipe: string, accent: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 432;

  const context = canvas.getContext('2d');

  if (!context) {
    const fallback = new CanvasTexture(canvas);
    fallback.needsUpdate = true;
    return fallback;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(255, 252, 242, 0.9)';
  context.fillRect(36, 36, canvas.width - 72, canvas.height - 72);

  context.strokeStyle = accent;
  context.lineWidth = 14;
  context.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

  context.fillStyle = accent;
  context.fillRect(54, 54, canvas.width - 108, 64);

  context.fillStyle = '#fffaf2';
  context.font = '700 56px Trebuchet MS, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(title.toUpperCase(), canvas.width / 2, 88);

  context.fillStyle = '#2c3028';
  context.font = '700 44px Trebuchet MS, sans-serif';
  wrapText(context, recipe, canvas.width / 2, 214, 520, 52);

  context.fillStyle = '#6c7268';
  context.font = '600 28px Trebuchet MS, sans-serif';
  context.fillText('PRESS E', canvas.width / 2, 344);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createInputSlot({
  x,
  y,
  z,
  materials,
  token,
}: {
  x: number;
  y: number;
  z: number;
  materials: LevelMaterials;
  token: Group;
}): Group {
  const root = new Group();
  root.position.set(x, y, z);

  const bracket = new Mesh(new BoxGeometry(0.1, 0.62, 0.1), materials.metal);
  bracket.position.y = -0.28;

  const shelf = new Mesh(new BoxGeometry(0.62, 0.08, 0.42), materials.prop);
  shelf.position.y = -0.02;

  token.position.set(0, 0.14, 0);

  root.add(bracket, shelf, token);
  return root;
}

function createRiceStalkToken(): Group {
  const root = new Group();
  const stalkMaterial = new MeshStandardMaterial({
    color: 0xcba652,
    roughness: 0.72,
    metalness: 0.04,
  });

  for (let index = 0; index < 3; index += 1) {
    const stalk = new Mesh(new CylinderGeometry(0.02, 0.025, 0.32, 6), stalkMaterial);
    stalk.position.set(-0.07 + index * 0.07, 0.06 + index * 0.02, 0);
    stalk.rotation.z = -0.16 + index * 0.08;
    root.add(stalk);
  }

  return root;
}

function createSeaweedToken(): Group {
  const root = new Group();
  const sheetMaterial = new MeshStandardMaterial({
    color: 0x234a39,
    roughness: 0.96,
    metalness: 0.02,
  });

  for (let index = 0; index < 2; index += 1) {
    const sheet = new Mesh(new BoxGeometry(0.08, 0.28, 0.03), sheetMaterial);
    sheet.position.set(-0.03 + index * 0.06, 0.05, 0);
    sheet.rotation.z = -0.16 + index * 0.2;
    root.add(sheet);
  }

  return root;
}

function createDriedSeaweedToken(): Group {
  const root = createSeaweedToken();
  root.scale.set(0.92, 0.9, 0.92);
  root.traverse((child) => {
    if (child instanceof Mesh && child.material instanceof MeshStandardMaterial) {
      child.material = child.material.clone();
      child.material.color.setHex(0x355648);
    }
  });
  return root;
}

function createSlicedSeaweedToken(): Group {
  const root = new Group();
  const material = new MeshStandardMaterial({
    color: 0x2d493c,
    roughness: 0.94,
    metalness: 0.02,
  });

  for (let index = 0; index < 4; index += 1) {
    const strip = new Mesh(new BoxGeometry(0.05, 0.22, 0.02), material);
    strip.position.set(-0.09 + index * 0.06, 0.05 + (index % 2) * 0.02, 0);
    strip.rotation.z = -0.16 + index * 0.12;
    root.add(strip);
  }

  return root;
}

function createRawRiceToken(): Group {
  const root = new Group();
  const rice = new Mesh(
    new SphereGeometry(0.12, 12, 12),
    new MeshStandardMaterial({
      color: 0xe9dfc3,
      roughness: 0.9,
      metalness: 0.02,
    }),
  );
  rice.scale.set(1.2, 0.74, 1.2);
  rice.position.y = 0.03;
  root.add(rice);
  return root;
}

function createCookedRiceToken(): Group {
  const root = createRawRiceToken();
  const rice = root.children[0];

  if (rice instanceof Mesh && rice.material instanceof MeshStandardMaterial) {
    rice.material = rice.material.clone();
    rice.material.color.setHex(0xffffff);
  }

  return root;
}

function createServingPlate(radius: number): Group {
  const root = new Group();
  const ceramicMaterial = new MeshStandardMaterial({
    color: 0xf7f5ef,
    roughness: 0.34,
    metalness: 0.03,
  });
  const shadowMaterial = new MeshStandardMaterial({
    color: 0xe5dfd1,
    roughness: 0.42,
    metalness: 0.02,
  });

  const base = new Mesh(
    new CylinderGeometry(radius * 0.8, radius * 0.88, 0.045, 24),
    shadowMaterial,
  );
  base.position.y = 0.02;

  const dish = new Mesh(
    new CylinderGeometry(radius * 0.92, radius, 0.05, 28),
    ceramicMaterial,
  );
  dish.position.y = 0.06;

  const rim = new Mesh(
    new TorusGeometry(radius * 0.86, radius * 0.12, 10, 28),
    ceramicMaterial,
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.085;

  const center = new Mesh(
    new CylinderGeometry(radius * 0.68, radius * 0.72, 0.018, 24),
    new MeshStandardMaterial({
      color: 0xfcfbf7,
      roughness: 0.28,
      metalness: 0.02,
    }),
  );
  center.position.y = 0.082;

  root.add(base, dish, rim, center);
  return root;
}

function createPlateStackDisplay(count: number): Group {
  const root = new Group();

  for (let index = 0; index < count; index += 1) {
    const plate = createServingPlate(0.3);
    plate.position.y = index * 0.045;
    plate.rotation.y = index * 0.16;
    root.add(plate);
  }

  return root;
}

export function createCarriedPlateModel(recipeId: string): Group {
  const root = new Group();

  const plate = createServingPlate(0.24);
  const dish = createFinishedDish(recipeId);
  dish.position.y = 0.045;
  dish.scale.set(0.82, 0.82, 0.82);

  root.add(plate, dish);
  applyShadow(root);
  return root;
}

export function createCarriedCoffeeModel(): Group {
  const root = createCoffeeCupToken();
  root.scale.setScalar(1.32);
  root.rotation.set(0.08, -0.24, 0.04);
  applyShadow(root);
  return root;
}

function createPlateToken(): Group {
  const root = createServingPlate(0.18);
  root.scale.set(0.92, 0.92, 0.92);
  return root;
}

function createFinishedRollPiece(fishColor: number, stripeColor: number): Group {
  const root = new Group();

  const wrapper = new Mesh(
    new CylinderGeometry(0.09, 0.09, 0.17, 18),
    new MeshStandardMaterial({
      color: 0x1e3026,
      roughness: 0.88,
      metalness: 0.02,
    }),
  );

  const rice = new Mesh(
    new CylinderGeometry(0.068, 0.068, 0.182, 18),
    new MeshStandardMaterial({
      color: 0xfaf9f4,
      roughness: 0.76,
      metalness: 0.02,
    }),
  );
  rice.position.y = 0.006;

  const fish = new Mesh(
    new BoxGeometry(0.12, 0.05, 0.08),
    new MeshStandardMaterial({
      color: fishColor,
      roughness: 0.44,
      metalness: 0.02,
    }),
  );
  fish.position.set(0, 0.065, 0);

  const stripe = new Mesh(
    new BoxGeometry(0.04, 0.052, 0.082),
    new MeshStandardMaterial({
      color: stripeColor,
      roughness: 0.52,
      metalness: 0.02,
    }),
  );
  stripe.position.set(0.022, 0.066, 0);

  root.add(wrapper, rice, fish, stripe);
  return root;
}

function createFinishedDish(recipeId: string): Group {
  const root = new Group();
  const fishColors = recipeId === 'tuna-roll'
    ? [0xbd4250, 0xe4848f] as const
    : [0xff955e, 0xffc29b] as const;

  for (let index = 0; index < 3; index += 1) {
    const piece = createFinishedRollPiece(fishColors[0], fishColors[1]);
    piece.position.set(-0.18 + index * 0.18, 0.12, index === 1 ? 0.02 : -0.02 + index * 0.02);
    piece.rotation.y = -0.18 + index * 0.18;
    root.add(piece);
  }

  const garnish = createSlicedSeaweedToken();
  garnish.scale.set(0.8, 0.8, 0.8);
  garnish.position.set(0.2, 0.1, 0.12);
  garnish.rotation.y = 0.4;
  root.add(garnish);

  return root;
}

function createStagedPlateIngredient(id: IngredientId): Group {
  switch (id) {
    case 'cooked-rice': {
      const rice = createCookedRiceToken();
      rice.scale.set(1.3, 0.9, 1.3);
      rice.position.set(0, 0.11, 0.02);
      return rice;
    }
    case 'sliced-seaweed': {
      const seaweed = createSlicedSeaweedToken();
      seaweed.scale.set(1.1, 1, 1.1);
      seaweed.position.set(-0.14, 0.11, -0.08);
      seaweed.rotation.y = -0.36;
      return seaweed;
    }
    case 'salmon': {
      const fish = createFishToken(0xff955e, 0xffc29b);
      fish.scale.set(1.15, 1.05, 1.15);
      fish.position.set(0.15, 0.12, 0.02);
      fish.rotation.y = 0.34;
      return fish;
    }
    case 'tuna': {
      const fish = createFishToken(0xbd4250, 0xe4848f);
      fish.scale.set(1.15, 1.05, 1.15);
      fish.position.set(0.15, 0.12, 0.02);
      fish.rotation.y = 0.34;
      return fish;
    }
    default: {
      const fallback = createAnimatedIngredientToken(id);
      fallback.position.y = 0.11;
      return fallback;
    }
  }
}

function createFishToken(bodyColor: number, stripeColor: number): Group {
  const root = new Group();
  const body = new Mesh(
    new BoxGeometry(0.25, 0.08, 0.16),
    new MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.56,
      metalness: 0.02,
    }),
  );
  body.position.y = 0.02;

  const stripe = new Mesh(
    new BoxGeometry(0.06, 0.09, 0.17),
    new MeshStandardMaterial({
      color: stripeColor,
      roughness: 0.58,
      metalness: 0.02,
    }),
  );
  stripe.position.set(0.05, 0.02, 0);

  root.add(body, stripe);
  return root;
}

function createWholeFishToken(bodyColor: number, stripeColor: number): Group {
  const root = new Group();

  const body = new Mesh(
    new SphereGeometry(0.14, 12, 12),
    new MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.56,
      metalness: 0.02,
    }),
  );
  body.scale.set(1.7, 0.74, 0.62);

  const tail = new Mesh(
    new BoxGeometry(0.12, 0.14, 0.05),
    new MeshStandardMaterial({
      color: stripeColor,
      roughness: 0.58,
      metalness: 0.02,
    }),
  );
  tail.position.set(0.2, 0, 0);
  tail.rotation.z = 0.72;

  root.add(body, tail);
  return root;
}

function createCoffeeCupToken(): Group {
  const root = new Group();

  const cup = new Mesh(
    new CylinderGeometry(0.11, 0.09, 0.18, 14),
    new MeshStandardMaterial({
      color: 0xf2eee6,
      roughness: 0.84,
      metalness: 0.02,
    }),
  );
  cup.position.y = 0.1;

  const coffee = new Mesh(
    new CylinderGeometry(0.086, 0.082, 0.03, 14),
    new MeshStandardMaterial({
      color: 0x4a2a18,
      roughness: 0.72,
      metalness: 0.02,
    }),
  );
  coffee.position.y = 0.175;

  const handle = new Mesh(
    new TorusGeometry(0.05, 0.012, 8, 18, Math.PI * 1.3),
    new MeshStandardMaterial({
      color: 0xf2eee6,
      roughness: 0.82,
      metalness: 0.02,
    }),
  );
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0.11, 0.11, 0);

  root.add(cup, coffee, handle);
  return root;
}

function createInteractable(
  position: readonly [number, number, number],
  id: StationInteractable['id'],
  label: string,
  offsetX: number,
  offsetZ: number,
): StationInteractable {
  return {
    id,
    label,
    position: new Vector3(
      position[0] + offsetX,
      GAME_CONFIG.player.height,
      position[2] + offsetZ,
    ),
  };
}

interface MachineTokenAnchors {
  root: Group;
  inputAnchor: Group;
  outputAnchor: Group;
}

interface PlateDisplayRig {
  stackRoot: Group;
  stackCount: number;
  assemblyPlateRoot: Group;
  assemblyContentsRoot: Group;
}

function createAnimationAnchors(
  parent: Group,
  inputPosition: [number, number, number],
  outputPosition: [number, number, number],
): MachineTokenAnchors {
  const inputAnchor = new Group();
  inputAnchor.position.set(inputPosition[0], inputPosition[1], inputPosition[2]);

  const outputAnchor = new Group();
  outputAnchor.position.set(outputPosition[0], outputPosition[1], outputPosition[2]);

  parent.add(inputAnchor, outputAnchor);

  return {
    root: parent,
    inputAnchor,
    outputAnchor,
  };
}

class KitchenStationAnimator implements StationAnimator {
  private readonly states = new Map<ProcessingStationId, MachineAnimationState | null>();
  private readonly inputTokens = new Map<ProcessingStationId, Group>();
  private readonly outputTokens = new Map<ProcessingStationId, Group>();
  private plateState: PlateAnimationState = {
    holdingPlate: false,
    recipeId: null,
    stagedIngredients: [],
    platedRecipeId: null,
  };
  private plateStateKey = '';
  private readonly stackPlates: Group[] = [];
  private plateDish: Group | null = null;
  private elapsed = 0;

  constructor(
    private readonly rigs: Record<ProcessingStationId, MachineTokenAnchors>,
    private readonly plateRig: PlateDisplayRig,
  ) {
    this.stackPlates = this.plateRig.stackRoot.children.filter((child): child is Group => child instanceof Group);
  }

  setPlateState(state: PlateAnimationState): void {
    this.plateState = {
      holdingPlate: state.holdingPlate,
      recipeId: state.recipeId,
      stagedIngredients: [...state.stagedIngredients],
      platedRecipeId: state.platedRecipeId,
    };

    const visibleCount = this.plateRig.stackCount;
    this.stackPlates.forEach((plate, index) => {
      plate.visible = index < visibleCount;
    });
    this.plateRig.assemblyPlateRoot.visible = !this.plateState.holdingPlate;

    const nextKey = [
      this.plateState.holdingPlate ? '1' : '0',
      this.plateState.recipeId ?? '',
      this.plateState.platedRecipeId ?? '',
      [...this.plateState.stagedIngredients].sort().join('|'),
    ].join('::');

    if (nextKey !== this.plateStateKey) {
      this.plateStateKey = nextKey;
      this.rebuildPlateDish();
    }
  }

  setMachineState(id: ProcessingStationId, state: MachineAnimationState | null): void {
    const previous = this.states.get(id);
    this.states.set(id, state);

    if (!state) {
      const oldInput = this.inputTokens.get(id);
      const oldOutput = this.outputTokens.get(id);
      if (oldInput) {
        this.rigs[id].inputAnchor.remove(oldInput);
        this.inputTokens.delete(id);
      }
      if (oldOutput) {
        this.rigs[id].outputAnchor.remove(oldOutput);
        this.outputTokens.delete(id);
      }
      return;
    }

    if (!previous || previous.input !== state.input) {
      const oldInput = this.inputTokens.get(id);
      if (oldInput) {
        this.rigs[id].inputAnchor.remove(oldInput);
      }
      const inputToken = createAnimatedIngredientToken(state.input);
      applyShadow(inputToken);
      this.rigs[id].inputAnchor.add(inputToken);
      this.inputTokens.set(id, inputToken);
    }

    if (!previous || previous.output !== state.output) {
      const oldOutput = this.outputTokens.get(id);
      if (oldOutput) {
        this.rigs[id].outputAnchor.remove(oldOutput);
      }
      const outputToken = createAnimatedIngredientToken(state.output);
      applyShadow(outputToken);
      this.rigs[id].outputAnchor.add(outputToken);
      this.outputTokens.set(id, outputToken);
    }
  }

  private rebuildPlateDish(): void {
    if (this.plateDish) {
      this.plateRig.assemblyContentsRoot.remove(this.plateDish);
      this.plateDish = null;
    }

    if (this.plateState.holdingPlate) {
      return;
    }

    if (this.plateState.platedRecipeId) {
      this.plateDish = createFinishedDish(this.plateState.platedRecipeId);
    } else if (this.plateState.stagedIngredients.length > 0) {
      const stagedDish = new Group();
      this.plateState.stagedIngredients.forEach((ingredientId) => {
        stagedDish.add(createStagedPlateIngredient(ingredientId));
      });
      this.plateDish = stagedDish;
    }

    if (!this.plateDish) {
      return;
    }

    applyShadow(this.plateDish);
    this.plateRig.assemblyContentsRoot.add(this.plateDish);
  }

  update(deltaSeconds: number): void {
    this.elapsed += deltaSeconds;

    (Object.keys(this.rigs) as ProcessingStationId[]).forEach((id) => {
      const state = this.states.get(id);
      const inputToken = this.inputTokens.get(id);
      const outputToken = this.outputTokens.get(id);

      if (!state || !inputToken || !outputToken) {
        return;
      }

      const progress = MathUtils.clamp(state.progress, 0, 1);
      const oscillation = Math.sin(this.elapsed * 10.2 + progress * 8);

      switch (id) {
        case 'grainer': {
          const dropProgress = MathUtils.clamp(progress / 0.58, 0, 1);
          const outputProgress = MathUtils.clamp((progress - 0.42) / 0.58, 0, 1);

          inputToken.visible = progress < 0.76;
          inputToken.position.set(0, 0.18 - dropProgress * 0.92, -0.04);
          inputToken.rotation.z = -0.22 + dropProgress * 0.34;
          inputToken.scale.setScalar(Math.max(0.18, 1 - Math.max(0, progress - 0.48) * 1.7));

          outputToken.visible = progress > 0.32;
          outputToken.position.set(0, -0.06 + outputProgress * 0.16, 0.06 + outputProgress * 0.14);
          outputToken.scale.setScalar(0.2 + outputProgress * 0.95);
          outputToken.rotation.y = progress * Math.PI * 1.4;
          break;
        }
        case 'boiler': {
          const sink = MathUtils.clamp(progress / 0.45, 0, 1);
          const cooked = MathUtils.clamp((progress - 0.52) / 0.48, 0, 1);

          inputToken.visible = progress < 0.62;
          inputToken.position.set(0, 0.14 - sink * 0.46, 0);
          inputToken.scale.setScalar(Math.max(0.24, 1 - progress * 0.9));

          outputToken.visible = progress > 0.42;
          outputToken.position.set(0, 0.02 + cooked * 0.22 + Math.abs(oscillation) * 0.03, 0);
          outputToken.scale.setScalar(0.2 + cooked * 0.9);
          break;
        }
        case 'skinner': {
          const intake = MathUtils.clamp(progress / 0.55, 0, 1);
          const fillet = MathUtils.clamp((progress - 0.38) / 0.62, 0, 1);

          inputToken.visible = progress < 0.82;
          inputToken.position.set(-0.18 + intake * 0.38, 0.04, -0.08 + intake * 0.08);
          inputToken.rotation.y = intake * 0.46;
          inputToken.scale.setScalar(Math.max(0.24, 1 - Math.max(0, progress - 0.48) * 1.45));

          outputToken.visible = progress > 0.28;
          outputToken.position.set(-0.04 + fillet * 0.38, -0.02 + fillet * 0.1, 0.04 + fillet * 0.12);
          outputToken.rotation.z = fillet * 0.18;
          outputToken.scale.setScalar(0.25 + fillet * 0.9);
          break;
        }
        case 'dryer': {
          const dry = MathUtils.clamp(progress / 0.7, 0, 1);
          const crisp = MathUtils.clamp((progress - 0.46) / 0.54, 0, 1);

          inputToken.visible = progress < 0.88;
          inputToken.position.set(0, 0.02 + Math.sin(this.elapsed * 18) * 0.02, -0.02);
          inputToken.scale.setScalar(Math.max(0.24, 1 - dry * 0.68));

          outputToken.visible = progress > 0.28;
          outputToken.position.set(0, -0.02 + crisp * 0.12, 0.06 + crisp * 0.08);
          outputToken.scale.setScalar(0.18 + crisp * 0.92);
          break;
        }
        case 'slicer': {
          const feed = MathUtils.clamp(progress / 0.58, 0, 1);
          const slices = MathUtils.clamp((progress - 0.4) / 0.6, 0, 1);

          inputToken.visible = progress < 0.78;
          inputToken.position.set(-0.16 + feed * 0.24, 0.02, -0.06 + feed * 0.04);
          inputToken.rotation.y = feed * 0.28;
          inputToken.scale.setScalar(Math.max(0.22, 1 - Math.max(0, progress - 0.5) * 1.5));

          outputToken.visible = progress > 0.34;
          outputToken.position.set(-0.02 + slices * 0.24, 0.02 + Math.abs(oscillation) * 0.02, 0.04 + slices * 0.12);
          outputToken.rotation.z = slices * 0.24;
          outputToken.scale.setScalar(0.2 + slices * 0.94);
          break;
        }
      }
    });

    if (this.plateDish) {
      const plated = Boolean(this.plateState.platedRecipeId);
      this.plateDish.position.y = plated
        ? 0.01 + Math.abs(Math.sin(this.elapsed * 4.8)) * 0.02
        : Math.abs(Math.sin(this.elapsed * 3.4)) * 0.01;
      this.plateDish.rotation.y = plated
        ? Math.sin(this.elapsed * 1.4) * 0.08
        : Math.sin(this.elapsed * 1.1) * 0.04;
    }
  }
}

function createAnimatedIngredientToken(id: IngredientId): Group {
  switch (id) {
    case 'rice-stalk':
      return createRiceStalkToken();
    case 'raw-rice':
      return createRawRiceToken();
    case 'cooked-rice':
      return createCookedRiceToken();
    case 'seaweed':
      return createSeaweedToken();
    case 'dried-seaweed':
      return createDriedSeaweedToken();
    case 'sliced-seaweed':
      return createSlicedSeaweedToken();
    case 'salmon-fish':
      return createWholeFishToken(0xff8f58, 0xffc49b);
    case 'salmon':
      return createFishToken(0xff955e, 0xffc29b);
    case 'tuna-fish':
      return createWholeFishToken(0xbd4250, 0xe4848f);
    case 'tuna':
      return createFishToken(0xbd4250, 0xe4848f);
    case 'coffee':
      return createCoffeeCupToken();
  }
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });

  if (current) {
    lines.push(current);
  }

  lines.forEach((line, index) => {
    context.fillText(line, centerX, startY + index * lineHeight);
  });
}

function applyShadow(root: Group): void {
  root.traverse((child) => {
    if (child instanceof Mesh) {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });
}
