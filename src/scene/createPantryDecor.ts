import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
} from 'three';

import { PANTRY_CHAPTER_EXIT_DOOR_POSITION, PANTRY_ROOM_CENTERS } from './levelLayout';

interface PantryDecorResult {
  root: Group;
  chapterExitDoor: Group;
}

export function createPantryDecor(): PantryDecorResult {
  const root = new Group();
  const chapterExitDoor = createSeaweedExitDoor();
  chapterExitDoor.visible = false;

  root.add(
    createSeaweedRoom(),
    createRiceRoom(),
    createFishTankRoom(),
    chapterExitDoor,
    createDirectionSigns(),
  );

  root.traverse((child) => {
    if (child instanceof Mesh) {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });

  return { root, chapterExitDoor };
}

function createSeaweedRoom(): Group {
  const root = new Group();
  const [roomX, roomZ] = PANTRY_ROOM_CENTERS.seaweed;

  const planterMaterial = new MeshStandardMaterial({
    color: 0x87684a,
    roughness: 0.84,
    metalness: 0.06,
  });
  const rackMaterial = new MeshStandardMaterial({
    color: 0xc1c9cc,
    roughness: 0.42,
    metalness: 0.58,
  });
  const seaweedMaterial = new MeshStandardMaterial({
    color: 0x1d4334,
    roughness: 0.95,
    metalness: 0.02,
  });
  const waterMaterial = new MeshPhysicalMaterial({
    color: 0x8fc4ba,
    roughness: 0.08,
    transmission: 0.78,
    transparent: true,
    opacity: 0.74,
  });

  const trough = new Mesh(new BoxGeometry(3.3, 0.7, 1.45), planterMaterial);
  trough.position.set(roomX + 0.4, 0.35, roomZ - 0.4);

  const water = new Mesh(new BoxGeometry(2.95, 0.22, 1.16), waterMaterial);
  water.position.set(roomX + 0.4, 0.6, roomZ - 0.4);

  const dryingRack = new Group();
  dryingRack.position.set(roomX + 4.4, 0, roomZ + 3.6);

  const leftPost = new Mesh(new BoxGeometry(0.1, 2.4, 0.1), rackMaterial);
  leftPost.position.set(-0.95, 1.2, 0);
  const rightPost = leftPost.clone();
  rightPost.position.x = 0.95;

  const bar = new Mesh(new BoxGeometry(2.05, 0.08, 0.08), rackMaterial);
  bar.position.set(0, 2.18, 0);

  dryingRack.add(leftPost, rightPost, bar);

  for (let index = 0; index < 4; index += 1) {
    const sheet = new Mesh(new BoxGeometry(0.42, 0.76, 0.04), seaweedMaterial);
    sheet.position.set(-0.72 + index * 0.48, 1.48 + (index % 2) * 0.06, 0);
    sheet.rotation.z = -0.08 + index * 0.06;
    dryingRack.add(sheet);
  }

  const bin = new Mesh(new BoxGeometry(1.12, 0.82, 1.02), planterMaterial);
  bin.position.set(roomX - 3.6, 0.41, roomZ + 5.2);

  root.add(trough, water, dryingRack, bin);

  return root;
}

function createRiceRoom(): Group {
  const root = new Group();
  const [roomX, roomZ] = PANTRY_ROOM_CENTERS.rice;

  const troughMaterial = new MeshStandardMaterial({
    color: 0x866f4d,
    roughness: 0.82,
    metalness: 0.04,
  });
  const waterMaterial = new MeshPhysicalMaterial({
    color: 0xa7d8c2,
    roughness: 0.06,
    transmission: 0.78,
    transparent: true,
    opacity: 0.66,
  });
  const stalkMaterial = new MeshStandardMaterial({
    color: 0xcdb25a,
    roughness: 0.72,
    metalness: 0.04,
  });
  const leafMaterial = new MeshStandardMaterial({
    color: 0x4b8b4d,
    roughness: 0.84,
    metalness: 0.02,
  });
  const sackMaterial = new MeshStandardMaterial({
    color: 0xe3ddd0,
    roughness: 0.9,
    metalness: 0.02,
  });

  const paddy = new Mesh(new BoxGeometry(4.25, 0.66, 1.88), troughMaterial);
  paddy.position.set(roomX, 0.33, roomZ - 0.2);

  const water = new Mesh(new BoxGeometry(3.86, 0.18, 1.46), waterMaterial);
  water.position.set(roomX, 0.56, roomZ - 0.2);

  root.add(paddy, water);

  for (let index = 0; index < 11; index += 1) {
    const x = -1.82 + index * 0.36;
    const depthOffset = index % 2 === 0 ? -0.28 : 0.22;

    const stalk = new Mesh(new CylinderGeometry(0.04, 0.05, 1.28, 7), stalkMaterial);
    stalk.position.set(roomX + x, 1.18, roomZ - 0.2 + depthOffset);

    const leaf = new Mesh(new BoxGeometry(0.08, 0.92, 0.12), leafMaterial);
    leaf.position.set(roomX + x, 1.6, roomZ - 0.2 + depthOffset);
    leaf.rotation.z = -0.1 + (index % 3) * 0.09;

    root.add(stalk, leaf);
  }

  const sackLeft = new Mesh(new SphereGeometry(0.45, 18, 18), sackMaterial);
  sackLeft.scale.set(1.2, 1.4, 0.92);
  sackLeft.position.set(roomX - 2.35, 0.66, roomZ + 3.4);

  const sackRight = sackLeft.clone();
  sackRight.position.set(roomX + 2.35, 0.64, roomZ + 3.35);
  sackRight.scale.set(1.02, 1.32, 0.88);

  root.add(sackLeft, sackRight);

  return root;
}

function createFishTankRoom(): Group {
  const root = new Group();
  const [roomX, roomZ] = PANTRY_ROOM_CENTERS.fish;

  const standMaterial = new MeshStandardMaterial({
    color: 0xd0d8db,
    roughness: 0.38,
    metalness: 0.56,
  });
  const glassMaterial = new MeshPhysicalMaterial({
    color: 0xd8f4ff,
    roughness: 0.04,
    transmission: 0.92,
    transparent: true,
    opacity: 0.34,
  });
  const waterMaterial = new MeshPhysicalMaterial({
    color: 0x77bfd8,
    roughness: 0.08,
    transmission: 0.8,
    transparent: true,
    opacity: 0.42,
  });

  const stand = new Mesh(new BoxGeometry(3.9, 1.2, 1.72), standMaterial);
  stand.position.set(roomX - 0.2, 0.6, roomZ - 0.4);

  const tank = new Mesh(new BoxGeometry(3.55, 2.08, 1.48), glassMaterial);
  tank.position.set(roomX - 0.2, 2.24, roomZ - 0.4);

  const water = new Mesh(new BoxGeometry(3.34, 1.62, 1.26), waterMaterial);
  water.position.set(roomX - 0.2, 2.02, roomZ - 0.4);

  root.add(stand, tank, water);

  const fishColors = [0xff8f4a, 0xc73d2d, 0xf7c061];
  fishColors.forEach((color, index) => {
    const body = new Mesh(
      new SphereGeometry(0.22, 16, 16),
      new MeshStandardMaterial({
        color,
        roughness: 0.52,
        metalness: 0.02,
      }),
    );
    body.scale.set(1.6, 0.8, 0.62);
    body.position.set(
      roomX - 1.1 + index * 0.78,
      2.12 + (index % 2) * 0.24,
      roomZ - 0.34 + index * 0.12,
    );

    const tail = new Mesh(
      new BoxGeometry(0.18, 0.22, 0.06),
      new MeshStandardMaterial({
        color,
        roughness: 0.56,
        metalness: 0.02,
      }),
    );
    tail.position.set(body.position.x + 0.34, body.position.y, body.position.z);
    tail.rotation.z = 0.62;

    root.add(body, tail);
  });

  const coolerMaterial = new MeshStandardMaterial({
    color: 0x7e98a8,
    roughness: 0.72,
    metalness: 0.12,
  });

  const cooler = new Mesh(new BoxGeometry(1.6, 1, 1.1), coolerMaterial);
  cooler.position.set(roomX + 3.8, 0.5, roomZ + 4.2);

  const tray = new Mesh(new BoxGeometry(1.82, 0.1, 1.3), standMaterial);
  tray.position.set(roomX - 3.2, 1.06, roomZ + 4.2);

  root.add(cooler, tray);

  return root;
}

function createSeaweedExitDoor(): Group {
  const root = new Group();
  const frameMaterial = new MeshStandardMaterial({
    color: 0xc3cbcf,
    emissive: 0x241108,
    emissiveIntensity: 0.18,
    roughness: 0.34,
    metalness: 0.68,
  });
  const slabMaterial = new MeshStandardMaterial({
    color: 0x738086,
    emissive: 0x1b0f08,
    emissiveIntensity: 0.12,
    roughness: 0.42,
    metalness: 0.38,
  });
  const windowMaterial = new MeshStandardMaterial({
    color: 0x8b3d1e,
    emissive: 0xffa057,
    emissiveIntensity: 2.8,
    roughness: 0.28,
    metalness: 0.14,
  });
  const signMaterial = new MeshStandardMaterial({
    color: 0x2f241c,
    roughness: 0.84,
    metalness: 0.04,
  });
  const wallInsetMaterial = new MeshStandardMaterial({
    color: 0x585958,
    roughness: 0.88,
    metalness: 0.04,
  });

  root.position.set(
    PANTRY_CHAPTER_EXIT_DOOR_POSITION[0],
    PANTRY_CHAPTER_EXIT_DOOR_POSITION[1],
    PANTRY_CHAPTER_EXIT_DOOR_POSITION[2],
  );

  const wallInset = new Mesh(new BoxGeometry(0.16, 4.32, 4.42), wallInsetMaterial);
  wallInset.position.set(-0.08, 2.16, 0);

  const frameTop = new Mesh(new BoxGeometry(0.18, 0.24, 3.34), frameMaterial);
  frameTop.position.set(0.04, 3.66, 0);

  const frameLeft = new Mesh(new BoxGeometry(0.2, 3.78, 0.22), frameMaterial);
  frameLeft.position.set(0.04, 1.89, -1.56);

  const frameRight = frameLeft.clone();
  frameRight.position.z = 1.56;

  const frameTrimTop = new Mesh(new BoxGeometry(0.1, 0.16, 3.82), frameMaterial);
  frameTrimTop.position.set(0.16, 3.94, 0);

  const frameTrimLeft = new Mesh(new BoxGeometry(0.1, 4.08, 0.14), frameMaterial);
  frameTrimLeft.position.set(0.16, 2.02, -1.84);

  const frameTrimRight = frameTrimLeft.clone();
  frameTrimRight.position.z = 1.84;

  const slab = new Mesh(new BoxGeometry(0.12, 3.42, 2.86), slabMaterial);
  slab.position.set(0.04, 1.7, 0);

  const window = new Mesh(new BoxGeometry(0.08, 0.84, 1.02), windowMaterial);
  window.position.set(0.16, 2.42, 0);

  const pushBar = new Mesh(new BoxGeometry(0.1, 0.18, 1.72), frameMaterial);
  pushBar.position.set(0.18, 1.54, 0);

  const sign = new Mesh(new BoxGeometry(0.18, 0.62, 1.94), signMaterial);
  sign.position.set(0.1, 4.5, 0);

  const signPlate = new Mesh(new BoxGeometry(0.1, 0.38, 1.52), windowMaterial);
  signPlate.position.set(0.2, 4.5, 0);

  const exitSign = createPaintSign('EXIT', 'none', '#efbe74');
  exitSign.position.set(0.28, 4.5, 0);
  exitSign.rotation.y = Math.PI / 2;
  exitSign.scale.set(0.88, 0.88, 0.88);

  root.add(
    wallInset,
    frameTop,
    frameLeft,
    frameRight,
    frameTrimTop,
    frameTrimLeft,
    frameTrimRight,
    slab,
    window,
    pushBar,
    sign,
    signPlate,
    exitSign,
  );
  return root;
}

function createDirectionSigns(): Group {
  const root = new Group();
  const [seaweedX, seaweedZ] = PANTRY_ROOM_CENTERS.seaweed;
  const [riceX, riceZ] = PANTRY_ROOM_CENTERS.rice;
  const [fishX, fishZ] = PANTRY_ROOM_CENTERS.fish;

  const signs = [
    {
      label: 'SEAWEED',
      arrow: 'none' as const,
      accent: '#6eb68b',
      position: [seaweedX, 1.94, seaweedZ - 5.9],
      rotationY: 0,
    },
    {
      label: 'RICE',
      arrow: 'none' as const,
      accent: '#f0d276',
      position: [riceX, 1.94, riceZ - 5.9],
      rotationY: 0,
    },
    {
      label: 'SALMON + FISH',
      arrow: 'none' as const,
      accent: '#ef8d71',
      position: [fishX, 1.94, fishZ - 5.9],
      rotationY: 0,
    },
  ];

  signs.forEach((definition) => {
    const sign = createPaintSign(definition.label, definition.arrow, definition.accent);
    sign.position.set(definition.position[0], definition.position[1], definition.position[2]);
    sign.rotation.y = definition.rotationY;
    root.add(sign);
  });

  return root;
}

function createPaintSign(
  label: string,
  arrow: 'left' | 'right' | 'up' | 'none',
  accent: string,
): Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 320;

  const context = canvas.getContext('2d');

  if (!context) {
    return new Mesh(
      new PlaneGeometry(3.4, 1.7),
      new MeshStandardMaterial({
        color: 0xf3f0e7,
        roughness: 0.9,
        metalness: 0.02,
      }),
    );
  }

  context.fillStyle = '#f1ecdf';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.globalAlpha = 0.22;
  context.fillStyle = accent;
  for (let index = 0; index < 18; index += 1) {
    context.fillRect(18 + index * 34, 22 + (index % 3) * 4, 22, canvas.height - 44);
  }
  context.globalAlpha = 1;

  context.strokeStyle = '#7c5d40';
  context.lineWidth = 12;
  context.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

  context.fillStyle = '#33261c';
  context.font = '700 42px Trebuchet MS, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  drawWrappedText(context, label, canvas.width / 2, canvas.height / 2 + 12, 440, 48);

  if (arrow !== 'none') {
    context.strokeStyle = accent;
    context.fillStyle = accent;
    context.lineWidth = 18;
    context.lineJoin = 'round';
    context.beginPath();

    if (arrow === 'left') {
      context.moveTo(144, 164);
      context.lineTo(262, 164);
      context.moveTo(150, 164);
      context.lineTo(198, 118);
      context.moveTo(150, 164);
      context.lineTo(198, 210);
    } else if (arrow === 'right') {
      context.moveTo(378, 164);
      context.lineTo(496, 164);
      context.moveTo(490, 164);
      context.lineTo(442, 118);
      context.moveTo(490, 164);
      context.lineTo(442, 210);
    } else {
      context.moveTo(320, 78);
      context.lineTo(320, 178);
      context.moveTo(320, 82);
      context.lineTo(272, 130);
      context.moveTo(320, 82);
      context.lineTo(368, 130);
    }

    context.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;

  return new Mesh(
    new PlaneGeometry(3.6, 1.8),
    new MeshStandardMaterial({
      map: texture,
      transparent: true,
      roughness: 0.92,
      metalness: 0.02,
      side: DoubleSide,
    }),
  );
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  label: string,
  centerX: number,
  centerY: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = label.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const nextLine = currentLine.length === 0 ? word : `${currentLine} ${word}`;

    if (context.measureText(nextLine).width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = nextLine;
  });

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  const startY = centerY - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    context.fillText(line, centerX, startY + index * lineHeight);
  });
}
