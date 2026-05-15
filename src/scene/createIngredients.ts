import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';

import type { IngredientDefinition, IngredientPickup } from '../types/world';

interface IngredientResult {
  root: Group;
  ingredients: IngredientPickup[];
}

export function createIngredients(definitions: IngredientDefinition[]): IngredientResult {
  const root = new Group();
  const ingredients: IngredientPickup[] = [];

  for (const definition of definitions) {
    const ingredientRoot = new Group();
    ingredientRoot.position.set(...definition.position);

    const ingredient = createPickupSource(definition.id);
    ingredientRoot.add(ingredient);
    applyShadow(ingredientRoot);
    root.add(ingredientRoot);

    ingredients.push({
      id: definition.id,
      label: definition.label,
      position: new Vector3(...definition.position),
      root: ingredientRoot,
      collected: false,
    });
  }

  return { root, ingredients };
}

function createPickupSource(id: IngredientPickup['id']): Group {
  switch (id) {
    case 'seaweed':
      return createSeaweedHarvest();
    case 'rice-stalk':
      return createRiceHarvest();
    case 'salmon-fish':
      return createTankFish(0xff8f58, 0xffc49b);
    case 'tuna-fish':
      return createTankFish(0xbf3d46, 0xe27b84);
    default:
      return buildIngredient(id);
  }
}

function buildIngredient(id: IngredientPickup['id']): Group {
  switch (id) {
    case 'seaweed':
      return createSeaweed();
    case 'dried-seaweed':
      return createDriedSeaweed();
    case 'sliced-seaweed':
      return createSlicedSeaweed();
    case 'rice-stalk':
      return createRiceStalk();
    case 'raw-rice':
      return createRawRice();
    case 'cooked-rice':
      return createCookedRice();
    case 'salmon-fish':
      return createWholeFish(0xff8f58, 0xffc49b);
    case 'salmon':
      return createFillet(0xff8f58, 0xffc49b);
    case 'tuna-fish':
      return createWholeFish(0xbf3d46, 0xe27b84);
    case 'tuna':
      return createFillet(0xbf3d46, 0xe27b84);
    case 'coffee':
      return createCoffeeCup();
  }
}

function createCoffeeCup(): Group {
  const root = new Group();
  const cupMaterial = new MeshStandardMaterial({
    color: 0xf2eee6,
    roughness: 0.84,
    metalness: 0.02,
  });
  const coffeeMaterial = new MeshStandardMaterial({
    color: 0x4a2a18,
    roughness: 0.72,
    metalness: 0.02,
  });

  const cup = new Mesh(new CylinderGeometry(0.11, 0.09, 0.18, 14), cupMaterial);
  cup.position.y = -0.39;

  const coffee = new Mesh(new CylinderGeometry(0.086, 0.082, 0.03, 14), coffeeMaterial);
  coffee.position.y = -0.305;

  const handle = new Mesh(new TorusGeometry(0.05, 0.012, 8, 18, Math.PI * 1.3), cupMaterial);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0.11, -0.39, 0);

  root.add(cup, coffee, handle);
  return root;
}

function createSeaweedHarvest(): Group {
  const root = new Group();
  const waterPadMaterial = new MeshStandardMaterial({
    color: 0x2e6557,
    roughness: 0.18,
    metalness: 0.04,
    transparent: true,
    opacity: 0.72,
  });
  const holdfastMaterial = new MeshStandardMaterial({
    color: 0x4d3d2c,
    roughness: 0.9,
    metalness: 0.02,
  });
  const seaweedMaterial = new MeshStandardMaterial({
    color: 0x1c4938,
    roughness: 0.96,
    metalness: 0.02,
  });

  const waterPad = new Mesh(new CylinderGeometry(0.34, 0.42, 0.03, 18), waterPadMaterial);
  waterPad.position.y = -0.48;
  root.add(waterPad);

  const offsets: Array<[number, number, number, number]> = [
    [-0.18, -0.46, -0.08, 0.96],
    [-0.08, -0.45, 0.1, 1.08],
    [0.02, -0.46, -0.02, 0.9],
    [0.14, -0.44, 0.08, 1.02],
    [0.22, -0.45, -0.1, 0.86],
  ];

  offsets.forEach(([x, y, z, height], index) => {
    const holdfast = new Mesh(new SphereGeometry(0.06, 10, 10), holdfastMaterial);
    holdfast.scale.set(1.1, 0.6, 1.2);
    holdfast.position.set(x, y, z);

    const frond = new Mesh(new BoxGeometry(0.12, height, 0.04), seaweedMaterial);
    frond.position.set(x, y + height * 0.5, z);
    frond.rotation.z = -0.18 + index * 0.08;
    frond.rotation.x = 0.04 - index * 0.02;

    root.add(holdfast, frond);
  });

  return root;
}

function createSeaweed(): Group {
  const root = new Group();
  const material = new MeshStandardMaterial({
    color: 0x204234,
    roughness: 0.92,
    metalness: 0.02,
  });

  for (let index = 0; index < 3; index += 1) {
    const sheet = new Mesh(new BoxGeometry(0.18, 0.74, 0.04), material);
    sheet.position.set(-0.16 + index * 0.16, 0.08 + index * 0.02, 0);
    sheet.rotation.z = -0.12 + index * 0.1;
    root.add(sheet);
  }

  return root;
}

function createDriedSeaweed(): Group {
  const root = createSeaweed();
  root.scale.set(0.92, 0.86, 0.92);
  root.traverse((child) => {
    if (child instanceof Mesh && child.material instanceof MeshStandardMaterial) {
      child.material = child.material.clone();
      child.material.color.setHex(0x315546);
    }
  });
  return root;
}

function createSlicedSeaweed(): Group {
  const root = new Group();
  const material = new MeshStandardMaterial({
    color: 0x264437,
    roughness: 0.94,
    metalness: 0.02,
  });

  for (let index = 0; index < 4; index += 1) {
    const strip = new Mesh(new BoxGeometry(0.1, 0.54, 0.03), material);
    strip.position.set(-0.18 + index * 0.12, 0.08 + (index % 2) * 0.04, 0);
    strip.rotation.z = -0.1 + index * 0.07;
    root.add(strip);
  }

  return root;
}

function createRiceHarvest(): Group {
  const root = new Group();
  const mudMaterial = new MeshStandardMaterial({
    color: 0x69533b,
    roughness: 0.92,
    metalness: 0.02,
  });
  const waterMaterial = new MeshStandardMaterial({
    color: 0xa4d5bf,
    roughness: 0.2,
    metalness: 0.02,
    transparent: true,
    opacity: 0.72,
  });
  const stalkMaterial = new MeshStandardMaterial({
    color: 0xcda95b,
    roughness: 0.74,
    metalness: 0.04,
  });
  const leafMaterial = new MeshStandardMaterial({
    color: 0x5a8f47,
    roughness: 0.86,
    metalness: 0.02,
  });

  const mud = new Mesh(new CylinderGeometry(0.34, 0.4, 0.06, 16), mudMaterial);
  mud.position.y = -0.52;
  root.add(mud);

  const water = new Mesh(new CylinderGeometry(0.28, 0.32, 0.02, 16), waterMaterial);
  water.position.y = -0.47;
  root.add(water);

  const stalkOffsets: Array<[number, number, number, number]> = [
    [-0.2, -0.48, -0.06, 1.14],
    [-0.1, -0.5, 0.08, 1.02],
    [0, -0.49, -0.02, 1.18],
    [0.1, -0.48, 0.12, 1.08],
    [0.22, -0.5, -0.08, 0.98],
  ];

  stalkOffsets.forEach(([x, y, z, height], index) => {
    const stalk = new Mesh(new CylinderGeometry(0.025, 0.03, height, 6), stalkMaterial);
    stalk.position.set(x, y + height * 0.5, z);
    stalk.rotation.z = -0.12 + index * 0.06;

    const head = new Mesh(new BoxGeometry(0.08, 0.24, 0.06), stalkMaterial);
    head.position.set(x + 0.02, y + height - 0.08, z);
    head.rotation.z = 0.18;

    const leaf = new Mesh(new BoxGeometry(0.05, 0.34, 0.05), leafMaterial);
    leaf.position.set(x - 0.03, y + height * 0.62, z);
    leaf.rotation.z = 0.34 - index * 0.04;

    root.add(stalk, head, leaf);
  });

  return root;
}

function createRiceStalk(): Group {
  const root = new Group();
  const stalkMaterial = new MeshStandardMaterial({
    color: 0xcba652,
    roughness: 0.74,
    metalness: 0.04,
  });
  const leafMaterial = new MeshStandardMaterial({
    color: 0x61894a,
    roughness: 0.86,
    metalness: 0.02,
  });

  for (let index = 0; index < 5; index += 1) {
    const stalk = new Mesh(new CylinderGeometry(0.025, 0.03, 0.8, 6), stalkMaterial);
    stalk.position.set(-0.12 + index * 0.06, 0.16 + index * 0.03, 0);
    stalk.rotation.z = -0.12 + index * 0.06;
    root.add(stalk);

    const leaf = new Mesh(new BoxGeometry(0.06, 0.28, 0.06), leafMaterial);
    leaf.position.set(stalk.position.x + 0.02, 0.48 + index * 0.02, 0);
    leaf.rotation.z = 0.28;
    root.add(leaf);
  }

  return root;
}

function createRawRice(): Group {
  const root = new Group();

  const bowl = new Mesh(
    new TorusGeometry(0.24, 0.08, 12, 24),
    new MeshStandardMaterial({
      color: 0xd9d5ca,
      roughness: 0.62,
      metalness: 0.02,
    }),
  );
  bowl.rotation.x = Math.PI / 2;
  bowl.position.y = -0.02;

  const rice = new Mesh(
    new SphereGeometry(0.24, 18, 18),
    new MeshStandardMaterial({
      color: 0xe9dfc3,
      roughness: 0.9,
      metalness: 0.02,
    }),
  );
  rice.scale.set(1.1, 0.82, 1.1);
  rice.position.y = 0.12;

  root.add(bowl, rice);
  return root;
}

function createCookedRice(): Group {
  const root = createRawRice();
  const [bowl, rice] = root.children;

  if (bowl instanceof Mesh && bowl.material instanceof MeshStandardMaterial) {
    bowl.material = bowl.material.clone();
    bowl.material.color.setHex(0xf4f2e9);
  }

  if (rice instanceof Mesh && rice.material instanceof MeshStandardMaterial) {
    rice.material = rice.material.clone();
    rice.material.color.setHex(0xffffff);
  }

  return root;
}

function createWholeFish(baseColor: number, stripeColor: number): Group {
  const root = new Group();

  const body = new Mesh(
    new SphereGeometry(0.24, 18, 18),
    new MeshStandardMaterial({
      color: baseColor,
      roughness: 0.58,
      metalness: 0.02,
    }),
  );
  body.scale.set(1.9, 0.82, 0.72);
  body.position.set(0, 0.04, 0);

  const tail = new Mesh(
    new BoxGeometry(0.2, 0.24, 0.08),
    new MeshStandardMaterial({
      color: stripeColor,
      roughness: 0.6,
      metalness: 0.02,
    }),
  );
  tail.position.set(0.38, 0.04, 0);
  tail.rotation.z = 0.72;

  const fin = new Mesh(
    new BoxGeometry(0.12, 0.16, 0.05),
    new MeshStandardMaterial({
      color: stripeColor,
      roughness: 0.62,
      metalness: 0.02,
    }),
  );
  fin.position.set(-0.04, 0.22, 0);
  fin.rotation.z = -0.22;

  const eye = new Mesh(
    new SphereGeometry(0.03, 10, 10),
    new MeshStandardMaterial({
      color: 0x161616,
      roughness: 0.52,
      metalness: 0.04,
    }),
  );
  eye.position.set(-0.28, 0.08, 0.14);

  root.add(body, tail, fin, eye);
  return root;
}

function createFillet(baseColor: number, stripeColor: number): Group {
  const root = new Group();

  const body = new Mesh(
    new BoxGeometry(0.72, 0.22, 0.38),
    new MeshStandardMaterial({
      color: baseColor,
      roughness: 0.54,
      metalness: 0.02,
    }),
  );
  body.position.y = 0.02;

  const stripeMaterial = new MeshStandardMaterial({
    color: stripeColor,
    roughness: 0.58,
    metalness: 0.02,
  });

  for (let index = 0; index < 3; index += 1) {
    const stripe = new Mesh(new BoxGeometry(0.1, 0.23, 0.4), stripeMaterial);
    stripe.position.set(-0.22 + index * 0.22, 0.03, 0);
    root.add(stripe);
  }

  root.add(body);
  return root;
}

function createTankFish(baseColor: number, stripeColor: number): Group {
  const root = new Group();
  const fish = createWholeFish(baseColor, stripeColor);
  fish.rotation.y = -Math.PI / 5;
  fish.rotation.z = 0.08;
  fish.position.set(0, 0, -0.06);
  root.add(fish);

  const bubbleMaterial = new MeshStandardMaterial({
    color: 0xeefbff,
    roughness: 0.16,
    metalness: 0.02,
    transparent: true,
    opacity: 0.46,
  });

  for (let index = 0; index < 3; index += 1) {
    const bubble = new Mesh(new SphereGeometry(0.04 + index * 0.015, 10, 10), bubbleMaterial);
    bubble.position.set(0.22 + index * 0.08, 0.18 + index * 0.18, -0.04 + index * 0.02);
    root.add(bubble);
  }

  return root;
}

function applyShadow(root: Group): void {
  root.traverse((child) => {
    if (child instanceof Mesh) {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });
}
