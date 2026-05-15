import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
} from 'three';

import type { ZombieWeaponId } from './createZombieMode';

export interface HeldZombieWeaponVisual {
  root: Group;
  muzzle: Object3D;
  update(elapsedSeconds: number, movementAmount: number, recoilAmount: number): void;
}

export interface ZombieBulletTracerVisual {
  root: Group;
  trail: Mesh;
  projectile: Mesh;
  duration: number;
  trailLength: number;
}

const BODY_METAL = new MeshStandardMaterial({
  color: 0x3b424d,
  emissive: 0x0e131a,
  emissiveIntensity: 0.2,
  roughness: 0.38,
  metalness: 0.84,
});

const DARK_METAL = new MeshStandardMaterial({
  color: 0x1f252d,
  emissive: 0x080b10,
  emissiveIntensity: 0.16,
  roughness: 0.52,
  metalness: 0.76,
});

const PLASTIC = new MeshStandardMaterial({
  color: 0x161718,
  roughness: 0.88,
  metalness: 0.08,
});

const WOOD = new MeshStandardMaterial({
  color: 0x7b5535,
  roughness: 0.84,
  metalness: 0.06,
});

const BRASS = new MeshStandardMaterial({
  color: 0xc79a44,
  emissive: 0x65340f,
  emissiveIntensity: 0.24,
  roughness: 0.32,
  metalness: 0.92,
});

function configureHeldMesh(mesh: Mesh): void {
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  mesh.renderOrder = 24;
}

function createPistolVisual(): HeldZombieWeaponVisual {
  const root = new Group();
  const slide = new Group();
  const muzzle = new Group();

  const frame = new Mesh(new BoxGeometry(0.14, 0.12, 0.38), BODY_METAL);
  frame.position.set(0.02, 0.02, -0.12);
  configureHeldMesh(frame);

  const slideBody = new Mesh(new BoxGeometry(0.12, 0.11, 0.34), DARK_METAL);
  slideBody.position.set(0.02, 0.08, -0.1);
  configureHeldMesh(slideBody);

  const barrel = new Mesh(new CylinderGeometry(0.022, 0.024, 0.26, 12), BODY_METAL);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0.02, 0.03, -0.26);
  configureHeldMesh(barrel);

  const frontSight = new Mesh(new BoxGeometry(0.025, 0.03, 0.025), DARK_METAL);
  frontSight.position.set(0.02, 0.135, -0.29);
  configureHeldMesh(frontSight);

  const rearSight = new Mesh(new BoxGeometry(0.05, 0.03, 0.03), DARK_METAL);
  rearSight.position.set(0.02, 0.135, 0.03);
  configureHeldMesh(rearSight);

  slide.add(slideBody, barrel, frontSight, rearSight);

  const grip = new Mesh(new BoxGeometry(0.13, 0.34, 0.16), PLASTIC);
  grip.position.set(0.01, -0.16, 0.05);
  grip.rotation.x = -0.16;
  grip.rotation.z = 0.24;
  configureHeldMesh(grip);

  const triggerGuard = new Mesh(new TorusGeometry(0.055, 0.012, 8, 18, Math.PI * 1.18), BODY_METAL);
  triggerGuard.position.set(0.02, -0.05, -0.01);
  triggerGuard.rotation.set(Math.PI * 0.52, 0, Math.PI / 2);
  configureHeldMesh(triggerGuard);

  const magazineBase = new Mesh(new BoxGeometry(0.1, 0.026, 0.12), DARK_METAL);
  magazineBase.position.set(0.01, -0.33, 0.08);
  configureHeldMesh(magazineBase);

  const accentShell = new Mesh(new CylinderGeometry(0.018, 0.018, 0.08, 10), BRASS);
  accentShell.rotation.z = Math.PI / 2;
  accentShell.position.set(-0.03, -0.02, -0.01);
  configureHeldMesh(accentShell);

  muzzle.position.set(0.02, 0.04, -0.4);
  slide.add(muzzle);
  root.add(frame, slide, grip, triggerGuard, magazineBase, accentShell);

  return {
    root,
    muzzle,
    update(elapsedSeconds, movementAmount, recoilAmount) {
      const bobX = Math.sin(elapsedSeconds * 5.3) * 0.012 * movementAmount;
      const bobY = Math.abs(Math.sin(elapsedSeconds * 10.6)) * 0.01 * movementAmount;
      root.position.set(0.03 + bobX, -0.08 + bobY, 0.02 - recoilAmount * 0.16);
      root.rotation.set(
        -0.1 - recoilAmount * 0.14 + Math.sin(elapsedSeconds * 2.8) * 0.012 * movementAmount,
        -0.18 + Math.cos(elapsedSeconds * 2.2) * 0.02 * movementAmount,
        -0.02 - recoilAmount * 0.08,
      );
      slide.position.z = recoilAmount * 0.08;
      slide.position.y = recoilAmount * 0.02;
    },
  };
}

function createShotgunVisual(): HeldZombieWeaponVisual {
  const root = new Group();
  const pump = new Group();
  const muzzle = new Group();

  const stock = new Mesh(new BoxGeometry(0.16, 0.2, 0.36), WOOD);
  stock.position.set(0.04, -0.1, 0.34);
  stock.rotation.x = -0.08;
  configureHeldMesh(stock);

  const buttPad = new Mesh(new BoxGeometry(0.16, 0.18, 0.06), PLASTIC);
  buttPad.position.set(0.04, -0.1, 0.5);
  configureHeldMesh(buttPad);

  const grip = new Mesh(new BoxGeometry(0.13, 0.26, 0.14), WOOD);
  grip.position.set(0.03, -0.18, 0.1);
  grip.rotation.x = -0.24;
  grip.rotation.z = 0.18;
  configureHeldMesh(grip);

  const receiver = new Mesh(new BoxGeometry(0.16, 0.15, 0.32), BODY_METAL);
  receiver.position.set(0.02, 0, -0.02);
  configureHeldMesh(receiver);

  const barrel = new Mesh(new CylinderGeometry(0.022, 0.024, 1.04, 12), DARK_METAL);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0.02, 0.05, -0.55);
  configureHeldMesh(barrel);

  const magazineTube = new Mesh(new CylinderGeometry(0.018, 0.02, 0.92, 12), BODY_METAL);
  magazineTube.rotation.x = Math.PI / 2;
  magazineTube.position.set(0.02, -0.005, -0.47);
  configureHeldMesh(magazineTube);

  const rib = new Mesh(new BoxGeometry(0.022, 0.018, 0.82), DARK_METAL);
  rib.position.set(0.02, 0.09, -0.48);
  configureHeldMesh(rib);

  const sight = new Mesh(new BoxGeometry(0.022, 0.032, 0.03), BODY_METAL);
  sight.position.set(0.02, 0.095, -0.98);
  configureHeldMesh(sight);

  const pumpBody = new Mesh(new BoxGeometry(0.15, 0.12, 0.26), WOOD);
  pumpBody.position.set(0.02, 0.01, -0.46);
  configureHeldMesh(pumpBody);

  const pumpGuardLeft = new Mesh(new BoxGeometry(0.022, 0.06, 0.26), DARK_METAL);
  pumpGuardLeft.position.set(-0.045, 0.02, -0.46);
  configureHeldMesh(pumpGuardLeft);

  const pumpGuardRight = pumpGuardLeft.clone();
  pumpGuardRight.position.x = 0.085;

  const shell = new Mesh(new CylinderGeometry(0.018, 0.018, 0.1, 12), BRASS);
  shell.rotation.z = Math.PI / 2;
  shell.position.set(-0.06, 0.03, 0.02);
  configureHeldMesh(shell);

  pump.add(pumpBody, pumpGuardLeft, pumpGuardRight);
  muzzle.position.set(0.02, 0.045, -1.08);

  root.add(stock, buttPad, grip, receiver, barrel, magazineTube, rib, sight, pump, shell, muzzle);

  return {
    root,
    muzzle,
    update(elapsedSeconds, movementAmount, recoilAmount) {
      const bobX = Math.sin(elapsedSeconds * 4.6) * 0.015 * movementAmount;
      const bobY = Math.abs(Math.sin(elapsedSeconds * 9.2)) * 0.012 * movementAmount;
      root.position.set(0.06 + bobX, -0.16 + bobY, 0.14 - recoilAmount * 0.22);
      root.rotation.set(
        -0.16 - recoilAmount * 0.18 + Math.sin(elapsedSeconds * 2.3) * 0.014 * movementAmount,
        -0.24 + Math.cos(elapsedSeconds * 1.9) * 0.018 * movementAmount,
        -0.03 - recoilAmount * 0.06,
      );
      pump.position.z = recoilAmount * 0.18;
      pump.position.y = recoilAmount * 0.025;
    },
  };
}

export function createHeldZombieWeapon(weapon: ZombieWeaponId): HeldZombieWeaponVisual {
  return weapon === 'pistol' ? createPistolVisual() : createShotgunVisual();
}

export function createZombieBulletTracer(weapon: ZombieWeaponId): ZombieBulletTracerVisual {
  const root = new Group();
  const trail = new Mesh(
    new BoxGeometry(
      weapon === 'pistol' ? 0.034 : 0.05,
      weapon === 'pistol' ? 0.034 : 0.05,
      1,
    ),
    new MeshStandardMaterial({
      color: weapon === 'pistol' ? 0xffd39a : 0xfff0c2,
      emissive: weapon === 'pistol' ? 0xff8b3a : 0xffa43b,
      emissiveIntensity: weapon === 'pistol' ? 2.4 : 3.2,
      roughness: 0.22,
      metalness: 0.06,
      transparent: true,
      opacity: 0.78,
    }),
  );
  const projectile = new Mesh(
    new SphereGeometry(weapon === 'pistol' ? 0.045 : 0.06, 10, 10),
    new MeshStandardMaterial({
      color: weapon === 'pistol' ? 0xffedca : 0xfff6dc,
      emissive: weapon === 'pistol' ? 0xffb15c : 0xffd06a,
      emissiveIntensity: weapon === 'pistol' ? 3.2 : 3.8,
      roughness: 0.18,
      metalness: 0.04,
    }),
  );
  configureHeldMesh(trail);
  configureHeldMesh(projectile);
  root.add(trail, projectile);

  return {
    root,
    trail,
    projectile,
    duration: weapon === 'pistol' ? 0.12 : 0.16,
    trailLength: weapon === 'pistol' ? 0.72 : 1.1,
  };
}
