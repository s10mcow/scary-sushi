import {
  BoxGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NearestFilter,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
} from 'three';

import type { HeldZombieWeaponVisual, ZombieBulletTracerVisual } from './createZombieWeapons';

export type DoomWeaponId = 'pistol' | 'shotgun';

const weaponSpriteCache = new Map<DoomWeaponId, CanvasTexture>();

function finalizeTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

function drawBlock(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
): void {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
}

function drawPanel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  outline = '#09090a',
): void {
  drawBlock(context, x - 2, y - 2, width + 4, height + 4, outline);
  drawBlock(context, x, y, width, height, fill);
}

function createWeaponSprite(weapon: DoomWeaponId): CanvasTexture {
  const cached = weaponSpriteCache.get(weapon);
  if (cached) {
    return cached;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create doom weapon sprite.');
  }

  if (weapon === 'pistol') {
    drawPanel(context, 111, 58, 34, 22, '#69707b');
    drawPanel(context, 118, 36, 20, 30, '#808a95');
    drawPanel(context, 115, 18, 26, 20, '#9ea7b2');
    drawPanel(context, 116, 8, 24, 12, '#4e545d');
    drawPanel(context, 112, 79, 32, 18, '#2c2f35');
    drawPanel(context, 101, 96, 18, 38, '#5b3c2d');
    drawPanel(context, 137, 96, 18, 38, '#5b3c2d');
    drawPanel(context, 111, 116, 34, 26, '#3a241b');
    drawPanel(context, 92, 134, 72, 12, '#212124');
    drawPanel(context, 120, 24, 16, 12, '#8ee76b');
    drawPanel(context, 112, 48, 6, 10, '#1a1a1d');
    drawPanel(context, 138, 48, 6, 10, '#1a1a1d');
  } else {
    drawPanel(context, 86, 102, 84, 22, '#5d402d');
    drawPanel(context, 97, 80, 62, 24, '#8f6845');
    drawPanel(context, 106, 50, 44, 32, '#565c64');
    drawPanel(context, 114, 18, 28, 34, '#777d86');
    drawPanel(context, 118, 2, 20, 18, '#41464f');
    drawPanel(context, 74, 126, 108, 12, '#2a2b2f');
    drawPanel(context, 101, 124, 54, 24, '#452d21');
    drawPanel(context, 123, 24, 10, 12, '#8ce46a');
    drawPanel(context, 88, 90, 10, 12, '#3f291d');
    drawPanel(context, 158, 90, 10, 12, '#3f291d');
  }

  const texture = finalizeTexture(canvas);
  weaponSpriteCache.set(weapon, texture);
  return texture;
}

function configureHeldMesh(mesh: Mesh): void {
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  mesh.renderOrder = 24;
}

function createWeaponSpriteVisual(weapon: DoomWeaponId): HeldZombieWeaponVisual {
  const root = new Group();
  const muzzle = new Object3D();
  const plane = new Mesh(
    new PlaneGeometry(1.86, 1.16),
    new MeshBasicMaterial({
      map: createWeaponSprite(weapon),
      transparent: true,
      alphaTest: 0.08,
      toneMapped: false,
      depthWrite: false,
    }),
  );
  configureHeldMesh(plane);
  plane.position.set(0, -0.02, 0);
  muzzle.position.set(0, 0.22, -0.46);
  root.add(plane, muzzle);

  return {
    root,
    muzzle,
    update(elapsedSeconds, movementAmount, recoilAmount) {
      const sway = movementAmount * 0.016;
      const bobX = Math.sin(elapsedSeconds * 5.6) * sway;
      const bobY = Math.abs(Math.sin(elapsedSeconds * 11.2)) * sway * 0.88;

      if (weapon === 'pistol') {
        root.position.set(bobX * 0.55, -0.08 + bobY * 0.86, 0.03 - recoilAmount * 0.24);
        root.rotation.set(
          -0.02 - recoilAmount * 0.15 + Math.sin(elapsedSeconds * 2.4) * 0.008 * movementAmount,
          0,
          -0.008 - recoilAmount * 0.028,
        );
      } else {
        root.position.set(bobX * 0.52, -0.14 + bobY * 0.82, 0.04 - recoilAmount * 0.3);
        root.rotation.set(
          -0.038 - recoilAmount * 0.18 + Math.sin(elapsedSeconds * 2.2) * 0.01 * movementAmount,
          0,
          -0.008 - recoilAmount * 0.022,
        );
      }
    },
  };
}

export function createHeldDoomWeapon(weapon: DoomWeaponId): HeldZombieWeaponVisual {
  return createWeaponSpriteVisual(weapon);
}

export function createDoomBulletTracer(weapon: DoomWeaponId): ZombieBulletTracerVisual {
  const root = new Group();
  const trail = new Mesh(
    new BoxGeometry(
      weapon === 'pistol' ? 0.036 : 0.054,
      weapon === 'pistol' ? 0.036 : 0.054,
      1,
    ),
    new MeshStandardMaterial({
      color: weapon === 'pistol' ? 0xffddae : 0xffe7ba,
      emissive: weapon === 'pistol' ? 0xff7b2e : 0xff9c31,
      emissiveIntensity: weapon === 'pistol' ? 2.8 : 3.5,
      roughness: 0.18,
      metalness: 0.04,
      transparent: true,
      opacity: 0.8,
      flatShading: true,
    }),
  );
  const projectile = new Mesh(
    new SphereGeometry(weapon === 'pistol' ? 0.046 : 0.062, 10, 10),
    new MeshStandardMaterial({
      color: weapon === 'pistol' ? 0xfff1d1 : 0xfff4da,
      emissive: weapon === 'pistol' ? 0xffb362 : 0xffca6a,
      emissiveIntensity: weapon === 'pistol' ? 3.5 : 4.2,
      roughness: 0.14,
      metalness: 0.04,
      flatShading: true,
    }),
  );
  configureHeldMesh(trail);
  configureHeldMesh(projectile);
  root.add(trail, projectile);

  return {
    root,
    trail,
    projectile,
    duration: weapon === 'pistol' ? 0.11 : 0.16,
    trailLength: weapon === 'pistol' ? 0.78 : 1.16,
  };
}
