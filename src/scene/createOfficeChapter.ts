import {
  BoxGeometry,
  CatmullRomCurve3,
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  RepeatWrapping,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three';

import type { CollisionBox, FloorDefinition, WallDefinition } from '../types/world';
import { GAME_CONFIG } from '../config/gameConfig';
import { createFloor } from './createFloor';
import { createLevelMaterials } from './materials';
import { createWalls } from './createWalls';

const OFFICE_ZERO_VECTOR = new Vector3(0, 0, 0);
const OFFICE_VISUAL_UPDATE_INTERVAL = 1 / 12;
const OFFICE_SECURITY_CAMERA_SCAN_LIGHTS_ENABLED = false;

export interface OfficeChapterSeat {
  label: string;
  position: Vector3;
  sitPosition: Vector3;
  exitPosition: Vector3;
  lookTarget: Vector3;
}

export interface OfficeChapterCameraMonitors {
  label: string;
  interactPosition: Vector3;
}

export interface OfficeChapterDoor {
  id: 'left' | 'right';
  label: string;
  position: Vector3;
  interactPosition: Vector3;
  root: Group;
  slab: Group;
  collider: CollisionBox;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
  closedY: number;
  openY: number;
  closeBounceTimer: number;
  closeBounceDuration: number;
}

export interface OfficeChapterButton {
  id: string;
  doorId: 'left' | 'right';
  buttonType: 'door' | 'flash';
  label: string;
  position: Vector3;
  interactPosition: Vector3;
}

export interface OfficeChapterPartyPlayMachine {
  label: string;
  root: Group;
  position: Vector3;
  interactPosition: Vector3;
  button: Mesh;
  buttonRestZ: number;
  pressAmount: number;
  labelMaterial: MeshStandardMaterial;
  buttonMaterial: MeshStandardMaterial;
}

export interface OfficeChapterFoxyPlayButton {
  label: string;
  root: Group;
  position: Vector3;
  interactPosition: Vector3;
  button: Mesh;
  buttonRestZ: number;
  pressAmount: number;
  labelMaterial: MeshStandardMaterial;
  buttonMaterial: MeshStandardMaterial;
}

export interface OfficeChapterTicketPickup {
  id: string;
  label: string;
  position: Vector3;
  root: Group;
  collected: boolean;
}

export interface OfficeChapterBasketballGame {
  label: string;
  position: Vector3;
  interactPosition: Vector3;
  root: Group;
  ball: Mesh;
  ballHomePosition: Vector3;
  leftHoopTarget: Vector3;
  rightHoopTarget: Vector3;
}

export interface OfficeChapterPrizeWheel {
  label: string;
  root: Group;
  wheel: Mesh;
  pointer: Group;
  interactPosition: Vector3;
  prizes: string[];
  selectedPrize: string;
  spinning: boolean;
  spinTime: number;
  spinDuration: number;
  spinStartRotation: number;
  spinTargetRotation: number;
  tickIndex: number;
}

export interface OfficeChapterBathroomSink {
  label: string;
  root: Group;
  interactPosition: Vector3;
  waterStreams: Mesh[];
  waterOn: boolean;
  waterAmount: number;
}

export interface OfficeChapterBathroomStall {
  label: string;
  root: Group;
  interactPosition: Vector3;
  doorPivot: Group;
  doorOpen: boolean;
  doorOpenAmount: number;
  doorTargetOpenAmount: number;
  openDirection: -1 | 1;
}

export interface OfficeChapterBathroomEntranceDoor {
  label: string;
  root: Group;
  interactPosition: Vector3;
  leftDoorPivot: Group;
  rightDoorPivot: Group;
  collider: CollisionBox;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
}

export interface OfficeChapterBathroomRoomDoor {
  label: string;
  root: Group;
  interactPosition: Vector3;
  doorPivot: Group;
  collider: CollisionBox;
  openDirection: -1 | 1;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
}

export interface OfficeChapterBackstageStorageDoor {
  label: string;
  root: Group;
  interactPosition: Vector3;
  doorPivot: Group;
  collider: CollisionBox;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
}

export interface OfficeChapterStorageClosetDoor {
  label: string;
  root: Group;
  interactPosition: Vector3;
  doorPivot: Group;
  collider: CollisionBox;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
}

export interface OfficeChapterEmployeeOnlyDoor {
  label: string;
  root: Group;
  interactPosition: Vector3;
  doorPivot: Group;
  collider: CollisionBox;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
  locked: boolean;
}

export interface OfficeChapterEmployeeKeyBriefcase {
  label: string;
  root: Group;
  interactPosition: Vector3;
  lidPivot: Group;
  keyRoot: Group;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
  keyCollected: boolean;
}

export interface OfficeChapterEmployeeElevator {
  label: string;
  root: Group;
  platform: Group;
  interactPosition: Vector3;
  lowerInteractPosition: Vector3;
  topPosition: Vector3;
  lowerPosition: Vector3;
  lowerLookTarget: Vector3;
  lowerHalfWidth: number;
  lowerHalfDepth: number;
  lowerHallwayBounds: Array<{
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  }>;
  button: Mesh;
  buttonRestX: number;
  lowerButton: Mesh;
  lowerButtonRestX: number;
  cables: Mesh[];
  shaftWalls: Mesh[];
  shaftWallHeight: number;
  shaftWallTopY: number;
  cableTopY: number;
  cableBaseLength: number;
  platformHomeY: number;
}

export type OfficeChapterStorageFuseWireColor = 'green' | 'blue' | 'red';

export interface OfficeChapterStorageFuseBoxWire {
  color: OfficeChapterStorageFuseWireColor;
  loose: Mesh;
  connected: Mesh;
  outletMaterial: MeshStandardMaterial;
}

export interface OfficeChapterStorageFuseBox {
  label: string;
  root: Group;
  interactPosition: Vector3;
  doorPivot: Group;
  leverPivot: Group;
  statusLightMaterial: MeshStandardMaterial;
  wires: Record<OfficeChapterStorageFuseWireColor, OfficeChapterStorageFuseBoxWire>;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
  leverPulled: boolean;
  leverAmount: number;
  targetLeverAmount: number;
}

export interface OfficeChapterKitchenEntranceDoor {
  label: string;
  root: Group;
  interactPosition: Vector3;
  leftDoorPivot: Group;
  rightDoorPivot: Group;
  collider: CollisionBox;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
}

export interface OfficeChapterKitchenGlassShelf {
  label: string;
  position: Vector3;
}

export interface OfficeChapterUtilityCloset {
  label: string;
  position: Vector3;
  interactPosition: Vector3;
  powerBoxInteractPosition: Vector3;
  root: Group;
  doorPivot: Group;
  powerBoxDoorPivot: Group;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
  powerBoxOpen: boolean;
  powerBoxOpenAmount: number;
  powerBoxTargetOpenAmount: number;
}

export interface OfficeChapterStageFloor {
  center: Vector3;
  halfWidth: number;
  halfDepth: number;
  floorY: number;
}

export interface OfficeChapterSecurityCamera {
  id: number;
  label: string;
  root: Group;
  pivot: Group;
  viewAnchor: Group;
  scanLight: PointLight;
}

export interface OfficeChapterBallPit {
  label: string;
  root: Group;
  center: Vector3;
  halfWidth: number;
  halfDepth: number;
  surfaceY: number;
  peekEyeY: number;
  hiddenEyeY: number;
}

export interface OfficeChapterBallPitSlide {
  label: string;
  root: Group;
  interactPosition: Vector3;
  startPosition: Vector3;
  endPosition: Vector3;
  lookTarget: Vector3;
}

export interface OfficeChapterVentSegment {
  center: Vector3;
  halfWidth: number;
  halfDepth: number;
}

export interface OfficeChapterVentOpening {
  label: string;
  position: Vector3;
  exitPosition?: Vector3;
  coverPivot?: Group;
  roomCoverPivot?: Group;
  open?: boolean;
  openAmount?: number;
  targetOpenAmount?: number;
}

export interface OfficeChapterVentSystem {
  label: string;
  root: Group;
  floorY: number;
  ladderInteractPosition: Vector3;
  ladderEntryPosition: Vector3;
  ladderExitPosition: Vector3;
  segments: OfficeChapterVentSegment[];
  openings: OfficeChapterVentOpening[];
}

export interface OfficeChapterData {
  root: Group;
  colliders: CollisionBox[];
  spawn: Vector3;
  lookTarget: Vector3;
  seat: OfficeChapterSeat;
  cameraMonitors: OfficeChapterCameraMonitors;
  doors: OfficeChapterDoor[];
  buttons: OfficeChapterButton[];
  partyPlay: OfficeChapterPartyPlayMachine;
  foxyPlay: OfficeChapterFoxyPlayButton;
  ticketPickups: OfficeChapterTicketPickup[];
  basketballGame: OfficeChapterBasketballGame;
  prizeWheel: OfficeChapterPrizeWheel;
  ballPit: OfficeChapterBallPit;
  ballPitSlide: OfficeChapterBallPitSlide;
  ventSystem: OfficeChapterVentSystem;
  securityCamera: OfficeChapterSecurityCamera;
  securityCameras: OfficeChapterSecurityCamera[];
  backstageStorageDoor: OfficeChapterBackstageStorageDoor;
  storageClosetDoor: OfficeChapterStorageClosetDoor;
  employeeOnlyDoor: OfficeChapterEmployeeOnlyDoor;
  employeeKeyBriefcase: OfficeChapterEmployeeKeyBriefcase;
  employeeElevator: OfficeChapterEmployeeElevator;
  storageFuseBox: OfficeChapterStorageFuseBox;
  kitchenEntranceDoor: OfficeChapterKitchenEntranceDoor;
  kitchenGlassShelves: OfficeChapterKitchenGlassShelf[];
  bathroomEntranceDoor: OfficeChapterBathroomEntranceDoor;
  bathroomRoomDoors: OfficeChapterBathroomRoomDoor[];
  bathroomSinks: OfficeChapterBathroomSink[];
  bathroomStalls: OfficeChapterBathroomStall[];
  utilityCloset: OfficeChapterUtilityCloset;
  stageFloor: OfficeChapterStageFloor;
  stageFloors: OfficeChapterStageFloor[];
  setStageAnimatronicPresent(animatronic: 'quacky' | 'fluffle' | 'bori' | 'foxy', present: boolean): void;
  flashHallLight(doorId: 'left' | 'right'): void;
  startPartyShow(playerPosition?: Vector3): void;
  startFoxyPlay(): void;
  startBasketballThrow(scored: boolean, targetHoop: 'left' | 'right', throwStartWorldPosition?: Vector3): void;
  setBasketballHeld(held: boolean): void;
  isBasketballThrowActive(): boolean;
  isFoxyPlayActive(): boolean;
  isPartyShowActive(): boolean;
  isPartyShowMusicActive(): boolean;
  getPartyShowMusicTime(): number;
  update(deltaSeconds: number, playerPosition?: Vector3): void;
  reset(): void;
}

interface OfficeChapterOptions {
  abandonedStraightHalls?: boolean;
  sandboxQuackyDesign?: boolean;
}

const OFFICE_CENTER_X = -240;
const OFFICE_CENTER_Z = 184;
const OFFICE_WIDTH = 13;
const OFFICE_DEPTH = 11;
const WALL_HEIGHT = 4.1;
const OFFICE_VENT_FLOOR_Y = WALL_HEIGHT + 1.16;
const OFFICE_VENT_DUCT_FLOOR_Y = WALL_HEIGHT + 0.08;
const BALL_PIT_ROOM_HEIGHT = WALL_HEIGHT;
const WALL_THICKNESS = 0.45;
const DOOR_MOVE_SPEED = 8.4;
const SIDE_HALL_WIDTH = 4.6;
const SIDE_HALL_STRAIGHT_LENGTH = SIDE_HALL_WIDTH;
const ABANDONED_SIDE_HALL_WIDTH = 6.2;
const ABANDONED_SIDE_HALL_STRAIGHT_LENGTH = 28;
const SIDE_HALL_TURN_LENGTH = 10.2;
const DOOR_Z_SHIFT = 0.9;
const OFFICE_WINDOW_DEPTH = 2.2;
const OFFICE_WINDOW_SILL_HEIGHT = 0.7;
const OFFICE_WINDOW_HEIGHT = 2.08;
const OFFICE_SIDE_WINDOWS_VISIBLE = false;
const OFFICE_HALL_FLASH_FLICKER_DURATION = 2.1;
const OFFICE_HALL_FLASH_HOLD_DURATION = 1;
const OFFICE_HALL_FLASH_DURATION = OFFICE_HALL_FLASH_FLICKER_DURATION + OFFICE_HALL_FLASH_HOLD_DURATION;
const OFFICE_UTILITY_OPEN_SPEED = 6.8;
const PARTY_ROOM_WIDTH = 36;
const PARTY_ROOM_DEPTH = 21;
const PARTY_ROOM_HALL_OPENING_WIDTH = SIDE_HALL_WIDTH + 0.42;
const SECOND_PARTY_HALL_WIDTH = 5.2;
const SECOND_PARTY_HALL_LENGTH = 9.6;
const SECOND_PARTY_ROOM_WIDTH = 18;
const SECOND_PARTY_ROOM_DEPTH = 15.2;
const PARTY_STAGE_WIDTH = 16.8;
const PARTY_STAGE_DEPTH = 3.9;
const PARTY_STAGE_HEIGHT = 0.72;
const PARTY_STAGE_ANIMATRONIC_FOOT_LIFT = 0.08;
const PARTY_SHOW_MUSIC_DURATION = 10;
const PARTY_SHOW_RETURN_DURATION = 2.4;
const BASKETBALL_THROW_DURATION = 1.65;
const FOXY_PLAY_DURATION = 10;

interface StageLimbRefs {
  root: Group;
  joint: Group;
  basePosition: Vector3;
}

interface StageAnimatronicRefs {
  kind: 'duck' | 'bunny' | 'bear';
  root: Group;
  head: Group;
  leftArm: StageLimbRefs;
  rightArm: StageLimbRefs;
  leftLeg: StageLimbRefs;
  rightLeg: StageLimbRefs;
  propGroup?: Group;
  mouth?: Group;
  mouthBasePosition?: Vector3;
  drumSticks?: {
    left: StageDrumStickRefs;
    right: StageDrumStickRefs;
  };
  homePosition: Vector3;
  homeRotationY: number;
}

interface StageDrumStickRefs {
  root: Group;
  basePosition: Vector3;
  baseRotation: Vector3;
}

interface StageCollisionRefs {
  animatronic: StageAnimatronicRefs;
  body: CollisionBox;
  drumKit?: CollisionBox;
}

export interface OfficeJumpscareStageModel {
  root: Group;
  head: Group;
  jaw: Group;
  smile: Group;
  leftArm: Group;
  rightArm: Group;
  leftArmJoint: Group;
  rightArmJoint: Group;
  leftLeg: Group;
  rightLeg: Group;
  leftLegJoint: Group;
  rightLegJoint: Group;
}

function addCollider(
  colliders: CollisionBox[],
  centerX: number,
  centerZ: number,
  width: number,
  depth: number,
): void {
  colliders.push({
    centerX,
    centerZ,
    halfWidth: width / 2,
    halfDepth: depth / 2,
  });
}

function createSlidingDoor(
  id: 'left' | 'right',
  x: number,
  z: number,
  rotationY: number,
  interactOffsetX: number,
  frameMaterial: MeshStandardMaterial,
  doorMaterial: MeshStandardMaterial,
  metalMaterial: MeshStandardMaterial,
): OfficeChapterDoor {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const doorGlassMaterial = new MeshStandardMaterial({
    color: 0x0b1115,
    emissive: 0x04080a,
    emissiveIntensity: 0.08,
    roughness: 0.18,
    metalness: 0.08,
    transparent: true,
    opacity: 0.34,
  });

  const leftRail = new Mesh(new BoxGeometry(0.34, 3.92, 0.34), metalMaterial);
  leftRail.position.set(-2.28, 1.96, 0.02);
  const rightRail = new Mesh(new BoxGeometry(0.34, 3.92, 0.34), metalMaterial);
  rightRail.position.set(2.28, 1.96, 0.02);
  const headFrame = new Mesh(new BoxGeometry(4.92, 0.3, 0.36), metalMaterial);
  headFrame.position.set(0, 3.68, 0.02);
  const motorHousing = new Mesh(new BoxGeometry(4.26, 0.52, 0.52), metalMaterial);
  motorHousing.position.set(0, 3.98, 0.08);
  const leftJamb = new Mesh(new BoxGeometry(0.2, 3.44, 0.1), frameMaterial);
  leftJamb.position.set(-2.02, 1.72, -0.1);
  const rightJamb = new Mesh(new BoxGeometry(0.2, 3.44, 0.1), frameMaterial);
  rightJamb.position.set(2.02, 1.72, -0.1);
  const topJamb = new Mesh(new BoxGeometry(4.04, 0.16, 0.1), frameMaterial);
  topJamb.position.set(0, 3.36, -0.1);

  const slab = new Group();
  slab.position.y = 0;
  const upperPanel = new Mesh(new BoxGeometry(4.02, 0.76, 0.18), doorMaterial);
  upperPanel.position.set(0, 2.76, 0.05);
  const lowerPanel = new Mesh(new BoxGeometry(4.02, 0.84, 0.18), doorMaterial);
  lowerPanel.position.set(0, 0.42, 0.05);
  const leftPanel = new Mesh(new BoxGeometry(0.74, 1.62, 0.18), doorMaterial);
  leftPanel.position.set(-1.64, 1.6, 0.05);
  const rightPanel = leftPanel.clone();
  rightPanel.position.x = 1.64;
  const topCap = new Mesh(new BoxGeometry(3.8, 0.16, 0.08), metalMaterial);
  topCap.position.set(0, 3.08, 0.18);
  const bottomCap = new Mesh(new BoxGeometry(3.8, 0.16, 0.08), metalMaterial);
  bottomCap.position.set(0, 0.12, 0.18);
  const windowGlass = new Mesh(new BoxGeometry(2.62, 1.46, 0.035), doorGlassMaterial);
  windowGlass.position.set(0, 1.62, 0.17);
  const windowTopFrame = new Mesh(new BoxGeometry(2.84, 0.12, 0.1), metalMaterial);
  windowTopFrame.position.set(0, 2.41, 0.2);
  const windowBottomFrame = windowTopFrame.clone();
  windowBottomFrame.position.y = 0.83;
  const windowLeftFrame = new Mesh(new BoxGeometry(0.12, 1.58, 0.1), metalMaterial);
  windowLeftFrame.position.set(-1.42, 1.62, 0.2);
  const windowRightFrame = windowLeftFrame.clone();
  windowRightFrame.position.x = 1.42;
  const barGeometry = new BoxGeometry(0.045, 1.42, 0.095);
  const barCount = 15;
  const bars = new InstancedMesh(barGeometry, metalMaterial, barCount);
  for (let index = 0; index < barCount; index += 1) {
    const barX = -1.08 + index * 0.154;
    bars.setMatrixAt(index, new Matrix4().makeTranslation(barX, 1.62, 0.24));
  }
  bars.instanceMatrix.needsUpdate = true;

  slab.add(
    upperPanel,
    lowerPanel,
    leftPanel,
    rightPanel,
    topCap,
    bottomCap,
    windowGlass,
    windowTopFrame,
    windowBottomFrame,
    windowLeftFrame,
    windowRightFrame,
    bars,
  );

  root.add(leftRail, rightRail, headFrame, motorHousing, leftJamb, rightJamb, topJamb, slab);

  const interactPosition = new Vector3(x + interactOffsetX, 1.1, z);
  const collider: CollisionBox = {
    centerX: x,
    centerZ: z,
    halfWidth: 0.34,
    halfDepth: 2.12,
    enabled: true,
  };

  return {
    id,
    label: `${id === 'left' ? 'Left' : 'Right'} Office Door`,
    position: new Vector3(x, 1.4, z),
    interactPosition,
    root,
    slab,
    collider,
    open: false,
    openAmount: 0,
    targetOpenAmount: 0,
    closedY: 0,
    openY: 3.34,
    closeBounceTimer: 0,
    closeBounceDuration: 0.62,
  };
}

function createArcadeCabinet(
  x: number,
  z: number,
  rotationY: number,
  cabinetColor: number,
  screenColor: number,
): Group {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const cabinetMaterial = new MeshStandardMaterial({
    color: cabinetColor,
    roughness: 0.56,
    metalness: 0.08,
  });
  const trimMaterial = new MeshStandardMaterial({
    color: 0x191d24,
    roughness: 0.42,
    metalness: 0.2,
  });
  const screenMaterial = new MeshStandardMaterial({
    color: 0x10131a,
    emissive: screenColor,
    emissiveIntensity: 0.74,
    roughness: 0.28,
    metalness: 0.04,
  });
  const buttonMaterial = new MeshStandardMaterial({
    color: 0xf3d65f,
    emissive: 0x553800,
    emissiveIntensity: 0.14,
    roughness: 0.34,
    metalness: 0.08,
  });

  const base = new Mesh(new BoxGeometry(1.12, 2.55, 0.78), cabinetMaterial);
  base.position.set(0, 1.28, 0);
  const sideGlow = new Mesh(new BoxGeometry(0.86, 0.18, 0.04), buttonMaterial);
  sideGlow.position.set(0, 2.32, 0.42);
  const screen = new Mesh(new BoxGeometry(0.74, 0.62, 0.04), screenMaterial);
  screen.position.set(0, 1.72, 0.43);
  const screenBezel = new Mesh(new BoxGeometry(0.9, 0.78, 0.05), trimMaterial);
  screenBezel.position.set(0, 1.72, 0.4);
  const controlPanel = new Mesh(new BoxGeometry(0.9, 0.18, 0.36), trimMaterial);
  controlPanel.position.set(0, 1.05, 0.48);
  controlPanel.rotation.x = -0.18;
  const joystick = new Mesh(new CylinderGeometry(0.035, 0.045, 0.24, 10), buttonMaterial);
  joystick.position.set(-0.24, 1.17, 0.56);
  joystick.rotation.x = -0.22;

  [0, 1, 2].forEach((index) => {
    const button = new Mesh(new CylinderGeometry(0.045, 0.045, 0.035, 12), buttonMaterial);
    button.rotation.x = Math.PI / 2;
    button.position.set(0.12 + index * 0.14, 1.12, 0.58);
    root.add(button);
  });

  const screenDotMaterial = new MeshStandardMaterial({
    color: 0xfff2a8,
    emissive: 0xffd34a,
    emissiveIntensity: 0.5,
    roughness: 0.24,
    metalness: 0.02,
  });
  [-0.22, 0, 0.22].forEach((dotX, index) => {
    const dot = new Mesh(new BoxGeometry(0.06, 0.06, 0.02), screenDotMaterial);
    dot.position.set(dotX, 1.72 + (index % 2 === 0 ? 0.12 : -0.1), 0.465);
    root.add(dot);
  });

  root.add(base, screenBezel, screen, sideGlow, controlPanel, joystick);
  return root;
}

function createSwivelingSecurityCamera(
  id: number,
  label: string,
  position: Vector3,
  normal: Vector3,
): OfficeChapterSecurityCamera {
  const root = new Group();
  root.userData.officeSecurityCamera = true;
  root.userData.officeSecurityCameraId = id;
  const wallNormal = normal.clone().normalize();
  root.position.copy(position).addScaledVector(wallNormal, 0.06);
  root.rotation.y = Math.atan2(-wallNormal.x, -wallNormal.z);

  const bracketMaterial = new MeshStandardMaterial({
    color: 0x2b343b,
    emissive: 0x03080a,
    emissiveIntensity: 0.12,
    roughness: 0.38,
    metalness: 0.42,
  });
  const cameraMaterial = new MeshStandardMaterial({
    color: 0xc6d2d8,
    emissive: 0x101a20,
    emissiveIntensity: 0.12,
    roughness: 0.34,
    metalness: 0.34,
  });
  const lensMaterial = new MeshStandardMaterial({
    color: 0x081018,
    emissive: 0x1f6f8e,
    emissiveIntensity: 0.48,
    roughness: 0.18,
    metalness: 0.58,
  });
  const redMaterial = new MeshStandardMaterial({
    color: 0xff1f1f,
    emissive: 0xff2020,
    emissiveIntensity: 0.7,
    roughness: 0.28,
    metalness: 0.06,
  });

  const wallPlate = new Mesh(new BoxGeometry(0.52, 0.36, 0.08), bracketMaterial);
  wallPlate.position.set(0, 0, 0.04);

  const pivot = new Group();
  pivot.position.set(0, -0.03, -0.07);

  const arm = new Mesh(new CylinderGeometry(0.035, 0.045, 0.32, 12), bracketMaterial);
  arm.rotation.x = Math.PI / 2;
  arm.position.set(0, 0, -0.18);

  const neck = new Mesh(new SphereGeometry(0.085, 14, 10), bracketMaterial);
  neck.position.set(0, 0, -0.34);

  const cameraHead = new Group();
  cameraHead.position.set(0, -0.04, -0.48);
  cameraHead.rotation.x = -0.22;

  const body = new Mesh(new CylinderGeometry(0.15, 0.17, 0.42, 20), cameraMaterial);
  body.rotation.x = Math.PI / 2;

  const hood = new Mesh(new BoxGeometry(0.42, 0.12, 0.34), bracketMaterial);
  hood.position.set(0, 0.11, -0.03);

  const lens = new Mesh(new CylinderGeometry(0.095, 0.07, 0.06, 20), lensMaterial);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 0, -0.24);

  const redLed = new Mesh(new SphereGeometry(0.028, 10, 8), redMaterial);
  redLed.position.set(0.12, 0.08, -0.24);

  const scanLight = new PointLight(0xff2525, 0.35, 4.5, 1.8);
  scanLight.position.set(0, -0.02, -0.46);
  scanLight.visible = OFFICE_SECURITY_CAMERA_SCAN_LIGHTS_ENABLED;

  const viewAnchor = new Group();
  viewAnchor.position.set(0, -0.01, -0.58);

  cameraHead.add(body, hood, lens, redLed, scanLight, viewAnchor);
  pivot.add(arm, neck, cameraHead);
  root.add(wallPlate, pivot);
  return { id, label, root, pivot, viewAnchor, scanLight };
}

function createOfficeVentSystem(ladderX: number, ladderZ: number): OfficeChapterVentSystem {
  const root = new Group();
  const floorY = OFFICE_VENT_FLOOR_Y;
  const ductBottomY = OFFICE_VENT_DUCT_FLOOR_Y;
  const ductHeight = 1.62;
  const ductCenterY = ductBottomY + ductHeight / 2;
  const ladderExitPosition = new Vector3(ladderX, GAME_CONFIG.player.height, ladderZ + 1.72);
  const ladderEntryPosition = new Vector3(ladderX, floorY, ladderZ + 0.88);
  const segments: OfficeChapterVentSegment[] = [];

  const ductWallMaterial = new MeshStandardMaterial({
    color: 0x68747b,
    emissive: 0x0a1013,
    emissiveIntensity: 0.08,
    roughness: 0.38,
    metalness: 0.64,
    side: DoubleSide,
  });
  const ductFloorMaterial = new MeshStandardMaterial({
    color: 0x525d64,
    emissive: 0x070c0f,
    emissiveIntensity: 0.1,
    roughness: 0.42,
    metalness: 0.58,
    side: DoubleSide,
  });
  const frameMaterial = new MeshStandardMaterial({
    color: 0x20292f,
    emissive: 0x030607,
    emissiveIntensity: 0.18,
    roughness: 0.42,
    metalness: 0.58,
  });
  const ladderMaterial = new MeshStandardMaterial({
    color: 0xb5c1c7,
    emissive: 0x141d22,
    emissiveIntensity: 0.08,
    roughness: 0.28,
    metalness: 0.74,
  });
  const hatchMaterial = new MeshStandardMaterial({
    color: 0x151d23,
    emissive: 0x020405,
    emissiveIntensity: 0.24,
    roughness: 0.48,
    metalness: 0.42,
    side: DoubleSide,
  });
  const roomVentCoverMaterial = new MeshStandardMaterial({
    color: 0x26343d,
    emissive: 0x030809,
    emissiveIntensity: 0.16,
    roughness: 0.36,
    metalness: 0.56,
    side: DoubleSide,
  });
  const roomVentShadowMaterial = new MeshBasicMaterial({
    color: 0x020405,
    transparent: true,
    opacity: 0.18,
    side: DoubleSide,
    depthWrite: false,
  });
  const ventShaftMaterial = new MeshStandardMaterial({
    color: 0x111a20,
    emissive: 0x010304,
    emissiveIntensity: 0.12,
    roughness: 0.5,
    metalness: 0.48,
    side: DoubleSide,
  });

  type OfficeVentDuctPlan = {
    centerX: number;
    centerZ: number;
    width: number;
    depth: number;
  };

  const ventDuctPlans: OfficeVentDuctPlan[] = [
    { centerX: ladderX, centerZ: 153.95, width: 2.24, depth: 11.4 },
    { centerX: -234.4, centerZ: 159.2, width: 57.8, depth: 2.24 },
    { centerX: -239.3, centerZ: 171.6, width: 2.24, depth: 26.9 },
    { centerX: -239.3, centerZ: 184.2, width: 15.2, depth: 2.24 },
    { centerX: -260.1, centerZ: 159.2, width: 2.24, depth: 22.6 },
    { centerX: -236.5, centerZ: 148.35, width: 17.4, depth: 2.24 },
    { centerX: -212.1, centerZ: 149.2, width: 2.24, depth: 22.2 },
    { centerX: -203.8, centerZ: 159.2, width: 18.8, depth: 2.24 },
    { centerX: -203.8, centerZ: 149.2, width: 18.8, depth: 2.24 },
    { centerX: -226.4, centerZ: 141.2, width: 2.24, depth: 17.8 },
    { centerX: -218.8, centerZ: 132.3, width: 17.6, depth: 2.24 },
    { centerX: -250.2, centerZ: 171, width: 19.8, depth: 2.24 },
  ];

  const ventPeekGrates = [
    { label: 'Main animatronic room floor vent', x: -239.3, z: 166.5, width: 1.18, depth: 0.86, glow: 0xffb86b },
    { label: 'Foxy room floor vent', x: -199.8, z: 159.2, width: 1.24, depth: 0.86, glow: 0xb46cff },
    { label: 'Foxy stage floor vent', x: -203.8, z: 149.2, width: 1.24, depth: 0.86, glow: 0xff8358 },
    { label: 'Ball pit floor vent', x: -212.1, z: 141.2, width: 0.9, depth: 1.22, glow: 0x5bdcff },
    { label: 'Back room floor vent', x: -218.8, z: 132.3, width: 1.18, depth: 0.86, glow: 0x67ff9a },
    { label: 'Kitchen floor vent', x: -237.2, z: 148.35, width: 1.18, depth: 0.86, glow: 0x9dffd1 },
    { label: 'Bathroom floor vent', x: -260.1, z: 164.8, width: 0.9, depth: 1.18, glow: 0x8fd7ff },
    { label: 'Backstage suit storage floor vent', x: -255.1, z: 171, width: 1.18, depth: 0.86, glow: 0xf4ff8f },
    { label: 'Office hall floor vent', x: -234.8, z: 184.2, width: 1.18, depth: 0.86, glow: 0xff9f9f },
  ];

  const addRoomFacingVentCover = (grate: typeof ventPeekGrates[number]): Group => {
    const roomRoot = new Group();
    roomRoot.name = `${grate.label} room-side cover`;
    roomRoot.position.set(grate.x, 0, grate.z);
    const roomY = WALL_HEIGHT - 0.055;
    const frameY = roomY - 0.012;
    const frameThickness = 0.075;

    const shadow = new Mesh(
      new PlaneGeometry(grate.width * 0.9, grate.depth * 0.9),
      roomVentShadowMaterial.clone(),
    );
    shadow.rotation.x = Math.PI / 2;
    shadow.position.set(0, roomY + 0.006, 0);
    shadow.renderOrder = 2;

    const glow = new Mesh(
      new PlaneGeometry(grate.width * 0.78, grate.depth * 0.78),
      new MeshBasicMaterial({
        color: grate.glow,
        transparent: true,
        opacity: 0.06,
        side: DoubleSide,
        depthWrite: false,
      }),
    );
    glow.rotation.x = Math.PI / 2;
    glow.position.set(0, roomY - 0.003, 0);
    glow.renderOrder = 3;

    const north = new Mesh(new BoxGeometry(grate.width + frameThickness, 0.045, frameThickness), roomVentCoverMaterial);
    north.position.set(0, frameY, -grate.depth / 2);
    const south = north.clone();
    south.position.z = grate.depth / 2;
    const west = new Mesh(new BoxGeometry(frameThickness, 0.045, grate.depth + frameThickness), roomVentCoverMaterial);
    west.position.set(-grate.width / 2, frameY, 0);
    const east = west.clone();
    east.position.x = grate.width / 2;

    const coverPivot = new Group();
    coverPivot.position.set(-grate.width / 2, roomY - 0.024, 0);
    const centerBarX = new Mesh(new BoxGeometry(grate.width * 0.82, 0.035, 0.045), roomVentCoverMaterial);
    centerBarX.position.set(grate.width / 2, 0, 0);
    const slatOffsets = [-0.28, -0.1, 0.1, 0.28];
    const slats = slatOffsets.map((offset) => {
      const slat = new Mesh(new BoxGeometry(grate.width * 0.74, 0.032, 0.028), roomVentCoverMaterial);
      slat.position.set(grate.width / 2, 0.006, grate.depth * offset);
      return slat;
    });
    coverPivot.add(centerBarX, ...slats);
    coverPivot.userData.clearViewPanels = [shadow, glow];
    coverPivot.userData.clearViewBaseOpacity = [0.18, 0.06];

    const shaftHeight = Math.max(0.12, ductBottomY - WALL_HEIGHT + 0.08);
    const shaftY = WALL_HEIGHT + shaftHeight / 2 - 0.025;
    const shaftNorth = new Mesh(new BoxGeometry(grate.width, shaftHeight, 0.04), ventShaftMaterial);
    shaftNorth.position.set(0, shaftY, -grate.depth / 2);
    const shaftSouth = shaftNorth.clone();
    shaftSouth.position.z = grate.depth / 2;
    const shaftWest = new Mesh(new BoxGeometry(0.04, shaftHeight, grate.depth), ventShaftMaterial);
    shaftWest.position.set(-grate.width / 2, shaftY, 0);
    const shaftEast = shaftWest.clone();
    shaftEast.position.x = grate.width / 2;

    roomRoot.add(shadow, glow, shaftNorth, shaftSouth, shaftWest, shaftEast, north, south, west, east, coverPivot);
    root.add(roomRoot);
    return coverPivot;
  };

  const getDuctRect = ({ centerX, centerZ, width, depth }: OfficeVentDuctPlan): {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  } => ({
    minX: centerX - width / 2,
    maxX: centerX + width / 2,
    minZ: centerZ - depth / 2,
    maxZ: centerZ + depth / 2,
  });

  const getMergedIntervals = (start: number, end: number, openings: Array<[number, number]>): Array<[number, number]> => {
    const clamped = openings
      .map(([openStart, openEnd]): [number, number] => [
        MathUtils.clamp(openStart, start, end),
        MathUtils.clamp(openEnd, start, end),
      ])
      .filter(([openStart, openEnd]) => openEnd - openStart > 0.08)
      .sort(([leftStart], [rightStart]) => leftStart - rightStart);

    const merged: Array<[number, number]> = [];
    clamped.forEach(([openStart, openEnd]) => {
      const previous = merged[merged.length - 1];
      if (!previous || openStart > previous[1] + 0.02) {
        merged.push([openStart, openEnd]);
        return;
      }
      previous[1] = Math.max(previous[1], openEnd);
    });

    const wallIntervals: Array<[number, number]> = [];
    let cursor = start;
    merged.forEach(([openStart, openEnd]) => {
      if (openStart - cursor > 0.12) {
        wallIntervals.push([cursor, openStart]);
      }
      cursor = Math.max(cursor, openEnd);
    });
    if (end - cursor > 0.12) {
      wallIntervals.push([cursor, end]);
    }
    return wallIntervals;
  };

  const getSideOpenings = (
    current: OfficeVentDuctPlan,
    side: 'west' | 'east' | 'north' | 'south',
  ): Array<[number, number]> => {
    const rect = getDuctRect(current);
    const sideCoordinate = side === 'west'
      ? rect.minX
      : side === 'east'
        ? rect.maxX
        : side === 'north'
          ? rect.minZ
          : rect.maxZ;
    const connectionReach = 0.2;
    const branchOpeningSize = 1.42;
    const wallEndMargin = 0.18;
    const getBranchOpening = (center: number, start: number, end: number): Array<[number, number]> => {
      const span = end - start;
      const openingSize = Math.min(branchOpeningSize, Math.max(0, span - wallEndMargin * 2));
      if (openingSize <= 0.12) {
        return [];
      }
      const halfOpening = openingSize / 2;
      const openingCenter = MathUtils.clamp(center, start + halfOpening, end - halfOpening);
      return [[openingCenter - halfOpening, openingCenter + halfOpening]];
    };

    return ventDuctPlans.flatMap((other): Array<[number, number]> => {
      if (other === current) {
        return [];
      }

      const otherRect = getDuctRect(other);
      const otherIsHorizontal = other.width >= other.depth;
      if (side === 'west' || side === 'east') {
        if (!otherIsHorizontal) {
          return [];
        }
        const crossesSide = otherRect.minX <= sideCoordinate + connectionReach
          && otherRect.maxX >= sideCoordinate - connectionReach;
        const overlapsWall = otherRect.maxZ >= rect.minZ + 0.08
          && otherRect.minZ <= rect.maxZ - 0.08;
        return crossesSide && overlapsWall ? getBranchOpening(other.centerZ, rect.minZ, rect.maxZ) : [];
      }

      if (otherIsHorizontal) {
        return [];
      }
      const crossesSide = otherRect.minZ <= sideCoordinate + connectionReach
        && otherRect.maxZ >= sideCoordinate - connectionReach;
      const overlapsWall = otherRect.maxX >= rect.minX + 0.08
        && otherRect.minX <= rect.maxX - 0.08;
      return crossesSide && overlapsWall ? getBranchOpening(other.centerX, rect.minX, rect.maxX) : [];
    });
  };

  const addWallPiecesAlongZ = (x: number, zStart: number, zEnd: number, openings: Array<[number, number]>): void => {
    getMergedIntervals(zStart, zEnd, openings).forEach(([wallStart, wallEnd]) => {
      const wallDepth = wallEnd - wallStart;
      const wall = new Mesh(new BoxGeometry(0.08, ductHeight, wallDepth), ductWallMaterial);
      wall.position.set(x, ductCenterY, (wallStart + wallEnd) / 2);
      root.add(wall);
    });
  };

  const getFloorOpenings = (plan: OfficeVentDuctPlan): Array<{ minX: number; maxX: number; minZ: number; maxZ: number }> => {
    const rect = getDuctRect(plan);
    return ventPeekGrates
      .map((grate) => ({
        minX: Math.max(rect.minX, grate.x - grate.width / 2),
        maxX: Math.min(rect.maxX, grate.x + grate.width / 2),
        minZ: Math.max(rect.minZ, grate.z - grate.depth / 2),
        maxZ: Math.min(rect.maxZ, grate.z + grate.depth / 2),
      }))
      .filter((opening) => opening.maxX - opening.minX > 0.08 && opening.maxZ - opening.minZ > 0.08);
  };

  const addDuctFloorPieces = (plan: OfficeVentDuctPlan): void => {
    const rect = getDuctRect(plan);
    const openings = getFloorOpenings(plan);
    if (openings.length === 0) {
      const floor = new Mesh(new BoxGeometry(plan.width, 0.035, plan.depth), ductFloorMaterial);
      floor.position.set(plan.centerX, ductBottomY, plan.centerZ);
      root.add(floor);
      return;
    }

    const xCuts = [rect.minX, rect.maxX];
    const zCuts = [rect.minZ, rect.maxZ];
    openings.forEach((opening) => {
      xCuts.push(opening.minX, opening.maxX);
      zCuts.push(opening.minZ, opening.maxZ);
    });
    xCuts.sort((left, right) => left - right);
    zCuts.sort((left, right) => left - right);

    for (let xIndex = 0; xIndex < xCuts.length - 1; xIndex += 1) {
      for (let zIndex = 0; zIndex < zCuts.length - 1; zIndex += 1) {
        const minX = xCuts[xIndex];
        const maxX = xCuts[xIndex + 1];
        const minZ = zCuts[zIndex];
        const maxZ = zCuts[zIndex + 1];
        const width = maxX - minX;
        const depth = maxZ - minZ;
        if (width <= 0.08 || depth <= 0.08) {
          continue;
        }

        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;
        const insideOpening = openings.some((opening) => (
          centerX >= opening.minX
          && centerX <= opening.maxX
          && centerZ >= opening.minZ
          && centerZ <= opening.maxZ
        ));
        if (insideOpening) {
          continue;
        }

        const floor = new Mesh(new BoxGeometry(width, 0.035, depth), ductFloorMaterial);
        floor.position.set(centerX, ductBottomY, centerZ);
        root.add(floor);
      }
    }
  };

  const addWallPiecesAlongX = (xStart: number, xEnd: number, z: number, openings: Array<[number, number]>): void => {
    getMergedIntervals(xStart, xEnd, openings).forEach(([wallStart, wallEnd]) => {
      const wallWidth = wallEnd - wallStart;
      const wall = new Mesh(new BoxGeometry(wallWidth, ductHeight, 0.08), ductWallMaterial);
      wall.position.set((wallStart + wallEnd) / 2, ductCenterY, z);
      root.add(wall);
    });
  };

  const shouldSkipVentRib = (current: OfficeVentDuctPlan, ribX: number, ribZ: number): boolean => {
    return ventDuctPlans.some((other) => {
      if (other === current) {
        return false;
      }
      const rect = getDuctRect(other);
      return ribX >= rect.minX - 0.18
        && ribX <= rect.maxX + 0.18
        && ribZ >= rect.minZ - 0.18
        && ribZ <= rect.maxZ + 0.18;
    });
  };

  const addDuctSegment = (plan: OfficeVentDuctPlan): void => {
    const { centerX, centerZ, width, depth } = plan;
    const rect = getDuctRect(plan);
    segments.push({
      center: new Vector3(centerX, floorY, centerZ),
      halfWidth: width / 2,
      halfDepth: depth / 2,
    });

    const top = new Mesh(new BoxGeometry(width, 0.08, depth), ductWallMaterial);
    top.position.set(centerX, ductBottomY + ductHeight, centerZ);
    root.add(top);
    addDuctFloorPieces(plan);
    addWallPiecesAlongZ(rect.minX, rect.minZ, rect.maxZ, getSideOpenings(plan, 'west'));
    addWallPiecesAlongZ(rect.maxX, rect.minZ, rect.maxZ, getSideOpenings(plan, 'east'));
    addWallPiecesAlongX(rect.minX, rect.maxX, rect.minZ, getSideOpenings(plan, 'north'));
    addWallPiecesAlongX(rect.minX, rect.maxX, rect.maxZ, getSideOpenings(plan, 'south'));

    const ribs = Math.max(2, Math.floor(Math.max(width, depth) / 3));
    for (let index = 0; index <= ribs; index += 1) {
      const progress = ribs === 0 ? 0 : index / ribs;
      const rib = new Group();
      if (width >= depth) {
        const ribX = centerX - width / 2 + width * progress;
        if (shouldSkipVentRib(plan, ribX, centerZ)) {
          continue;
        }
        const left = new Mesh(new BoxGeometry(0.08, ductHeight + 0.16, 0.1), frameMaterial);
        left.position.set(ribX, ductCenterY, centerZ - depth / 2);
        const right = left.clone();
        right.position.z = centerZ + depth / 2;
        const cross = new Mesh(new BoxGeometry(0.1, 0.08, depth + 0.14), frameMaterial);
        cross.position.set(ribX, ductBottomY + ductHeight + 0.03, centerZ);
        rib.add(left, right, cross);
      } else {
        const ribZ = centerZ - depth / 2 + depth * progress;
        if (shouldSkipVentRib(plan, centerX, ribZ)) {
          continue;
        }
        const left = new Mesh(new BoxGeometry(0.1, ductHeight + 0.16, 0.08), frameMaterial);
        left.position.set(centerX - width / 2, ductCenterY, ribZ);
        const right = left.clone();
        right.position.x = centerX + width / 2;
        const cross = new Mesh(new BoxGeometry(width + 0.14, 0.08, 0.1), frameMaterial);
        cross.position.set(centerX, ductBottomY + ductHeight + 0.03, ribZ);
        rib.add(left, right, cross);
      }
      root.add(rib);
    }
  };

  const addVentPeekGrate = (grate: typeof ventPeekGrates[number]): OfficeChapterVentOpening => {
    const roomCoverPivot = addRoomFacingVentCover(grate);
    const grateRoot = new Group();
    grateRoot.name = grate.label;
    grateRoot.position.set(grate.x, 0, grate.z);
    const frameY = ductBottomY + 0.05;
    const glow = new Mesh(
      new PlaneGeometry(grate.width * 0.78, grate.depth * 0.78),
      new MeshBasicMaterial({
        color: grate.glow,
        transparent: true,
        opacity: 0.08,
        side: DoubleSide,
        depthWrite: false,
      }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(0, ductBottomY - 0.035, 0);

    const frameThickness = 0.07;
    const north = new Mesh(new BoxGeometry(grate.width + frameThickness, 0.055, frameThickness), frameMaterial);
    north.position.set(0, frameY, -grate.depth / 2);
    const south = north.clone();
    south.position.z = grate.depth / 2;
    const west = new Mesh(new BoxGeometry(frameThickness, 0.055, grate.depth + frameThickness), frameMaterial);
    west.position.set(-grate.width / 2, frameY, 0);
    const east = west.clone();
    east.position.x = grate.width / 2;
    const coverPivot = new Group();
    coverPivot.position.set(-grate.width / 2, frameY + 0.018, 0);
    const centerBarX = new Mesh(new BoxGeometry(grate.width * 0.78, 0.04, 0.038), frameMaterial);
    centerBarX.position.set(-coverPivot.position.x, 0.035, 0);
    const slatOffsets = [-0.28, -0.09, 0.09, 0.28];
    const slats = slatOffsets.map((offset) => {
      const slat = new Mesh(new BoxGeometry(grate.width * 0.72, 0.036, 0.026), frameMaterial);
      slat.position.set(-coverPivot.position.x, 0.042, grate.depth * offset);
      return slat;
    });

    coverPivot.add(centerBarX, ...slats);
    coverPivot.userData.clearViewPanels = [glow];
    coverPivot.userData.clearViewBaseOpacity = [0.08];
    grateRoot.add(glow, north, south, west, east, coverPivot);
    root.add(grateRoot);
    return {
      label: grate.label,
      position: new Vector3(grate.x, floorY, grate.z),
      exitPosition: new Vector3(grate.x, GAME_CONFIG.player.height, grate.z),
      coverPivot,
      roomCoverPivot,
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
    };
  };

  const addVentJunction = (x: number, z: number, label = 'Vent Junction'): void => {
    const junctionFloor = new Mesh(new BoxGeometry(2.32, 0.045, 2.32), ductFloorMaterial);
    junctionFloor.position.set(x, ductBottomY + 0.012, z);
    const junctionTop = new Mesh(new BoxGeometry(2.32, 0.08, 2.32), ductWallMaterial);
    junctionTop.position.set(x, ductBottomY + ductHeight, z);
    const labelPanel = new Mesh(new BoxGeometry(0.72, 0.04, 0.18), frameMaterial);
    labelPanel.position.set(x, ductBottomY + ductHeight - 0.14, z - 0.92);
    labelPanel.name = label;
    root.add(junctionFloor, junctionTop, labelPanel);
  };

  const addVentOpening = (label: string, x: number, z: number, exitPosition?: Vector3): OfficeChapterVentOpening => {
    const openingWidth = 1.16;
    const openingDepth = 1.16;
    const frameY = ductBottomY + 0.07;
    const north = new Mesh(new BoxGeometry(openingWidth + 0.28, 0.08, 0.08), frameMaterial);
    north.position.set(x, frameY, z - openingDepth / 2);
    const south = north.clone();
    south.position.z = z + openingDepth / 2;
    const west = new Mesh(new BoxGeometry(0.08, 0.08, openingDepth + 0.28), frameMaterial);
    west.position.set(x - openingWidth / 2, frameY, z);
    const east = west.clone();
    east.position.x = x + openingWidth / 2;
    const hatchCover = new Mesh(new BoxGeometry(openingWidth - 0.16, 0.045, openingDepth - 0.16), hatchMaterial);
    hatchCover.position.set(x, frameY + 0.018, z);
    root.add(north, south, west, east, hatchCover);

    return {
      label,
      position: new Vector3(x, floorY, z),
      exitPosition,
    };
  };

  ventDuctPlans.forEach(addDuctSegment);

  [
    [ladderX, 159.2, 'Ladder trunk junction'],
    [-239.3, 159.2, 'Main branch junction'],
    [-239.3, 184.2, 'Office branch junction'],
    [-260.1, 159.2, 'Bathroom branch junction'],
    [-236.5, 148.35, 'Kitchen branch junction'],
    [-226.4, 159.2, 'Ball pit branch junction'],
    [-226.4, 132.3, 'North room branch junction'],
    [-212.1, 159.2, 'Foxy branch junction'],
    [-212.1, 149.2, 'Pirate room branch junction'],
    [-250.2, 171.0, 'Left hall branch junction'],
  ].forEach(([x, z, label]) => {
    addVentJunction(x as number, z as number, label as string);
  });
  const ventGrateOpenings = ventPeekGrates.map(addVentPeekGrate);

  const ladderRoot = new Group();
  ladderRoot.position.set(ladderX, 0, ladderZ + 0.88);
  const ladderHeight = floorY - 0.12;
  const ladderStandoutZ = 0.28;
  const backPlate = new Mesh(new BoxGeometry(1.04, WALL_HEIGHT - 0.16, 0.06), frameMaterial);
  backPlate.position.set(0, (WALL_HEIGHT - 0.16) / 2, -0.11);
  const collarNorth = new Mesh(new BoxGeometry(1.48, 0.18, 0.14), frameMaterial);
  collarNorth.position.set(0, WALL_HEIGHT - 0.03, -0.67);
  const collarSouth = collarNorth.clone();
  collarSouth.position.z = 0.67;
  const collarWest = new Mesh(new BoxGeometry(0.14, 0.18, 1.48), frameMaterial);
  collarWest.position.set(-0.67, WALL_HEIGHT - 0.03, 0);
  const collarEast = collarWest.clone();
  collarEast.position.x = 0.67;
  const darkOpening = new Mesh(
    new PlaneGeometry(1.08, 1.08),
    new MeshBasicMaterial({
      color: 0x020405,
      transparent: true,
      opacity: 0.88,
      side: DoubleSide,
      depthWrite: false,
    }),
  );
  darkOpening.rotation.x = Math.PI / 2;
  darkOpening.position.set(0, WALL_HEIGHT + 0.004, 0);
  ladderRoot.add(backPlate, collarNorth, collarSouth, collarWest, collarEast, darkOpening);

  [-0.34, 0.34].forEach((railX) => {
    const rail = new Mesh(new CylinderGeometry(0.048, 0.048, ladderHeight, 14), ladderMaterial);
    rail.position.set(railX, ladderHeight / 2, ladderStandoutZ);
    const topHandle = new Mesh(new CylinderGeometry(0.044, 0.044, 0.74, 14), ladderMaterial);
    topHandle.position.set(railX, WALL_HEIGHT + 0.32, ladderStandoutZ);
    ladderRoot.add(rail, topHandle);
  });
  for (let rungY = 0.42; rungY < floorY - 0.2; rungY += 0.36) {
    const rung = new Mesh(new CylinderGeometry(0.038, 0.038, 0.86, 12), ladderMaterial);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(0, rungY, ladderStandoutZ);
    ladderRoot.add(rung);
  }
  [0.78, 1.72, 2.66].forEach((bracketY) => {
    const bracket = new Mesh(new CylinderGeometry(0.026, 0.026, 0.66, 8), ladderMaterial);
    bracket.rotation.x = Math.PI / 2;
    bracket.position.set(0, bracketY, ladderStandoutZ * 0.5 - 0.06);
    ladderRoot.add(bracket);
  });
  const hatch = new Mesh(new PlaneGeometry(1.45, 1.45), hatchMaterial);
  hatch.rotation.x = Math.PI / 2;
  hatch.position.set(0, WALL_HEIGHT - 0.018, 0);
  const ladderSign = createWallSign('Vent', 'Ceiling Access');
  ladderSign.scale.set(0.82, 0.82, 1);
  ladderSign.position.set(0, 2.36, -0.15);
  ladderRoot.add(hatch, ladderSign);
  root.add(ladderRoot);

  const openings = [
    addVentOpening('Ladder Hatch', ladderEntryPosition.x, ladderEntryPosition.z, ladderExitPosition),
    addVentOpening('Kitchen Vent Hatch', -236.5, 148.35),
    addVentOpening('Office Vent Hatch', -239.3, 184.2),
    addVentOpening('Foxy Room Vent Hatch', -203.8, 159.2),
    addVentOpening('Ball Pit Room Vent Hatch', -226.4, 132.3),
    ...ventGrateOpenings,
  ];

  return {
    label: 'Chapter 3 Ceiling Vents',
    root,
    floorY,
    ladderInteractPosition: new Vector3(ladderX, 1.42, ladderZ + 0.88),
    ladderEntryPosition,
    ladderExitPosition,
    segments,
    openings,
  };
}

function createKitchenPrepTable(x: number, z: number, rotationY: number): Group {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const steelMaterial = new MeshStandardMaterial({
    color: 0xa7b1b7,
    emissive: 0x151b1f,
    emissiveIntensity: 0.08,
    roughness: 0.22,
    metalness: 0.78,
  });
  const cuttingBoardMaterial = new MeshStandardMaterial({
    color: 0xd7ba7a,
    roughness: 0.58,
    metalness: 0.02,
  });
  const knifeBladeMaterial = new MeshStandardMaterial({
    color: 0xdce7ec,
    emissive: 0x1d2930,
    emissiveIntensity: 0.08,
    roughness: 0.16,
    metalness: 0.9,
  });
  const handleMaterial = new MeshStandardMaterial({
    color: 0x1c1a18,
    roughness: 0.46,
    metalness: 0.12,
  });
  const supplyMaterial = new MeshStandardMaterial({
    color: 0xf2f0e6,
    roughness: 0.42,
    metalness: 0.04,
  });

  const top = new Mesh(new BoxGeometry(3.2, 0.14, 1.18), steelMaterial);
  top.position.y = 0.92;
  const lowerRack = new Mesh(new BoxGeometry(2.84, 0.08, 0.92), steelMaterial);
  lowerRack.position.y = 0.42;
  [-1.35, 1.35].forEach((legX) => {
    [-0.46, 0.46].forEach((legZ) => {
      const leg = new Mesh(new CylinderGeometry(0.045, 0.045, 0.88, 10), steelMaterial);
      leg.position.set(legX, 0.46, legZ);
      root.add(leg);
    });
  });

  const cuttingBoard = new Mesh(new BoxGeometry(0.86, 0.045, 0.58), cuttingBoardMaterial);
  cuttingBoard.position.set(-0.82, 1.02, -0.18);
  const knifeBlade = new Mesh(new BoxGeometry(0.52, 0.022, 0.075), knifeBladeMaterial);
  knifeBlade.position.set(-0.06, 1.07, -0.18);
  knifeBlade.rotation.y = -0.32;
  const knifeHandle = new Mesh(new BoxGeometry(0.2, 0.035, 0.09), handleMaterial);
  knifeHandle.position.set(0.22, 1.075, -0.28);
  knifeHandle.rotation.y = -0.32;
  const mixingBowl = new Mesh(new SphereGeometry(0.22, 18, 10), steelMaterial);
  mixingBowl.scale.y = 0.42;
  mixingBowl.position.set(0.86, 1.03, 0.18);
  const towel = new Mesh(new BoxGeometry(0.52, 0.025, 0.32), supplyMaterial);
  towel.position.set(0.22, 1.035, 0.32);
  towel.rotation.y = 0.18;

  root.add(top, lowerRack, cuttingBoard, knifeBlade, knifeHandle, mixingBowl, towel);
  return root;
}

function createKitchenPlacedStove(x: number, z: number, rotationY: number): Group {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const stoveMaterial = new MeshStandardMaterial({
    color: 0x2f3941,
    emissive: 0x05080a,
    emissiveIntensity: 0.12,
    roughness: 0.34,
    metalness: 0.42,
  });
  const steelMaterial = new MeshStandardMaterial({
    color: 0xb9c4ca,
    emissive: 0x151d22,
    emissiveIntensity: 0.08,
    roughness: 0.2,
    metalness: 0.82,
  });
  const burnerMaterial = new MeshStandardMaterial({
    color: 0x101417,
    emissive: 0x1b546c,
    emissiveIntensity: 0.22,
    roughness: 0.42,
    metalness: 0.44,
  });
  const knobMaterial = new MeshStandardMaterial({
    color: 0x151a1d,
    emissive: 0x040709,
    emissiveIntensity: 0.1,
    roughness: 0.28,
    metalness: 0.58,
  });
  const flameMaterial = new MeshStandardMaterial({
    color: 0xff7b38,
    emissive: 0xff6326,
    emissiveIntensity: 0.75,
    roughness: 0.42,
    metalness: 0.04,
  });

  const oven = new Mesh(new BoxGeometry(1.12, 0.86, 0.92), stoveMaterial);
  oven.position.set(0, 0.46, 0);
  const ovenDoor = new Mesh(new BoxGeometry(0.76, 0.42, 0.04), steelMaterial);
  ovenDoor.position.set(0, 0.43, 0.48);
  const handle = new Mesh(new BoxGeometry(0.52, 0.045, 0.055), knobMaterial);
  handle.position.set(0, 0.58, 0.515);
  const cooktop = new Mesh(new BoxGeometry(1.18, 0.1, 0.98), steelMaterial);
  cooktop.position.set(0, 0.94, 0);
  const backGuard = new Mesh(new BoxGeometry(1.18, 0.42, 0.08), steelMaterial);
  backGuard.position.set(0, 1.14, -0.48);

  [-0.3, 0.3].forEach((burnerX) => {
    [-0.22, 0.23].forEach((burnerZ) => {
      const burner = new Mesh(new CylinderGeometry(0.15, 0.15, 0.025, 20), burnerMaterial);
      burner.position.set(burnerX, 1.015, burnerZ);
      const flame = new Mesh(new ConeGeometry(0.095, 0.16, 14), flameMaterial);
      flame.position.set(burnerX, 1.1, burnerZ);
      root.add(burner, flame);
    });
  });

  [-0.38, -0.13, 0.13, 0.38].forEach((knobX) => {
    const knob = new Mesh(new CylinderGeometry(0.045, 0.045, 0.035, 12), knobMaterial);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(knobX, 1.16, 0.535);
    root.add(knob);
  });

  root.add(oven, ovenDoor, handle, cooktop, backGuard);
  return root;
}

function createKitchenShelf(x: number, z: number, rotationY: number): Group {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const shelfMaterial = new MeshStandardMaterial({
    color: 0x51606a,
    emissive: 0x091014,
    emissiveIntensity: 0.1,
    roughness: 0.28,
    metalness: 0.68,
  });
  const cupMaterial = new MeshStandardMaterial({
    color: 0xf5f1df,
    emissive: 0x19150d,
    emissiveIntensity: 0.04,
    roughness: 0.38,
    metalness: 0.02,
  });
  const plateMaterial = new MeshStandardMaterial({
    color: 0xe4ebee,
    emissive: 0x12181b,
    emissiveIntensity: 0.06,
    roughness: 0.34,
    metalness: 0.04,
  });

  [0.86, 1.48, 2.1].forEach((shelfY) => {
    const shelf = new Mesh(new BoxGeometry(3.15, 0.08, 0.44), shelfMaterial);
    shelf.position.set(0, shelfY, 0);
    root.add(shelf);
  });

  [-1.18, -0.82, -0.46, -0.1, 0.26].forEach((cupX) => {
    const cup = new Mesh(new CylinderGeometry(0.11, 0.09, 0.24, 14), cupMaterial);
    cup.position.set(cupX, 1.07, 0.03);
    root.add(cup);
  });

  [-1.08, -0.72, -0.36, 0, 0.36, 0.72, 1.08].forEach((plateX) => {
    const plate = new Mesh(new CylinderGeometry(0.18, 0.18, 0.035, 20), plateMaterial);
    plate.rotation.x = Math.PI / 2;
    plate.position.set(plateX, 1.68, 0.02);
    root.add(plate);
  });

  [-0.72, -0.24, 0.24, 0.72].forEach((stackX) => {
    const stack = new Mesh(new CylinderGeometry(0.22, 0.22, 0.18, 20), plateMaterial);
    stack.position.set(stackX, 2.26, 0.02);
    root.add(stack);
  });

  return root;
}

function createKitchenStoveLine(x: number, z: number, rotationY: number): Group {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const stoveMaterial = new MeshStandardMaterial({
    color: 0x303941,
    emissive: 0x05080a,
    emissiveIntensity: 0.12,
    roughness: 0.34,
    metalness: 0.42,
  });
  const steelMaterial = new MeshStandardMaterial({
    color: 0xb9c4ca,
    emissive: 0x151d22,
    emissiveIntensity: 0.08,
    roughness: 0.2,
    metalness: 0.82,
  });
  const burnerMaterial = new MeshStandardMaterial({
    color: 0x111417,
    emissive: 0x1b546c,
    emissiveIntensity: 0.2,
    roughness: 0.42,
    metalness: 0.44,
  });
  const orangeMaterial = new MeshStandardMaterial({
    color: 0xff7634,
    emissive: 0xff5f24,
    emissiveIntensity: 0.72,
    roughness: 0.42,
    metalness: 0.04,
  });

  [-1.15, 0, 1.15].forEach((unitX, index) => {
    const oven = new Mesh(new BoxGeometry(1.02, 0.82, 0.82), stoveMaterial);
    oven.position.set(unitX, 0.45, 0);
    const door = new Mesh(new BoxGeometry(0.72, 0.42, 0.035), steelMaterial);
    door.position.set(unitX, 0.42, 0.43);
    const cooktop = new Mesh(new BoxGeometry(1.02, 0.1, 0.88), steelMaterial);
    cooktop.position.set(unitX, 0.92, 0);
    [-0.22, 0.22].forEach((burnerX) => {
      const burner = new Mesh(new CylinderGeometry(0.16, 0.16, 0.025, 20), burnerMaterial);
      burner.position.set(unitX + burnerX, 0.995, -0.13);
      const flame = new Mesh(new CylinderGeometry(0.09, 0.13, 0.035, 14), orangeMaterial);
      flame.position.set(unitX + burnerX, 1.035, -0.13);
      root.add(burner, flame);
    });

    if (index !== 1) {
      const pot = new Mesh(new CylinderGeometry(0.22, 0.2, 0.24, 18), steelMaterial);
      pot.position.set(unitX, 1.16, 0.18);
      const handle = new Mesh(new BoxGeometry(0.54, 0.04, 0.055), steelMaterial);
      handle.position.set(unitX, 1.17, 0.18);
      root.add(pot, handle);
    }

    root.add(oven, door, cooktop);
  });

  const hood = new Mesh(new BoxGeometry(3.72, 0.34, 0.72), steelMaterial);
  hood.position.set(0, 2.24, -0.08);
  const ventPipe = new Mesh(new CylinderGeometry(0.16, 0.16, 1.08, 16), steelMaterial);
  ventPipe.position.set(0, 2.86, -0.08);
  root.add(hood, ventPipe);
  return root;
}

function createBallPit(centerX: number, centerZ: number, width: number, depth: number): OfficeChapterBallPit {
  const root = new Group();
  const center = new Vector3(centerX, 0, centerZ);
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const surfaceY = 1.02;
  const peekEyeY = surfaceY + 0.22;
  const hiddenEyeY = surfaceY - 0.34;
  const rimMaterial = new MeshStandardMaterial({
    color: 0x14171d,
    emissive: 0x010205,
    emissiveIntensity: 0.18,
    roughness: 0.72,
    metalness: 0.12,
  });
  const padMaterial = new MeshStandardMaterial({
    color: 0x161923,
    emissive: 0x020307,
    emissiveIntensity: 0.2,
    roughness: 0.88,
    metalness: 0.02,
  });
  const innerWallMaterial = new MeshStandardMaterial({
    color: 0x233142,
    emissive: 0x050b12,
    emissiveIntensity: 0.1,
    roughness: 0.68,
    metalness: 0.08,
  });
  const ballMaterials = [
    0xef3d43,
    0xffd23c,
    0x3f8dff,
    0x38c66f,
    0xf678c8,
    0xff8a2c,
    0x8e63ff,
  ].map((color) => new MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.09,
    roughness: 0.48,
    metalness: 0.02,
  }));
  const ballGeometry = new SphereGeometry(0.22, 14, 10);

  const pitBottom = new Mesh(new BoxGeometry(width - 0.5, 0.08, depth - 0.5), padMaterial);
  pitBottom.position.set(centerX, -0.04, centerZ);
  const northInnerWall = new Mesh(new BoxGeometry(width - 0.36, 1.36, 0.16), innerWallMaterial);
  northInnerWall.position.set(centerX, 0.58, centerZ - halfDepth + 0.2);
  const southInnerWall = new Mesh(new BoxGeometry(width - 0.36, 1.36, 0.16), innerWallMaterial);
  southInnerWall.position.set(centerX, 0.58, centerZ + halfDepth - 0.2);
  const westInnerWall = new Mesh(new BoxGeometry(0.16, 1.36, depth - 0.36), innerWallMaterial);
  westInnerWall.position.set(centerX - halfWidth + 0.2, 0.58, centerZ);
  const eastInnerWall = new Mesh(new BoxGeometry(0.16, 1.36, depth - 0.36), innerWallMaterial);
  eastInnerWall.position.set(centerX + halfWidth - 0.2, 0.58, centerZ);

  const northRim = new Mesh(new BoxGeometry(width + 0.08, 0.025, 0.18), rimMaterial);
  northRim.position.set(centerX, 0.014, centerZ - halfDepth);
  const southRim = new Mesh(new BoxGeometry(width + 0.08, 0.025, 0.18), rimMaterial);
  southRim.position.set(centerX, 0.014, centerZ + halfDepth);
  const westRim = new Mesh(new BoxGeometry(0.18, 0.025, depth + 0.08), rimMaterial);
  westRim.position.set(centerX - halfWidth, 0.014, centerZ);
  const eastRim = new Mesh(new BoxGeometry(0.18, 0.025, depth + 0.08), rimMaterial);
  eastRim.position.set(centerX + halfWidth, 0.014, centerZ);
  root.add(
    pitBottom,
    northInnerWall,
    southInnerWall,
    westInnerWall,
    eastInnerWall,
    northRim,
    southRim,
    westRim,
    eastRim,
  );

  const ballBuckets = ballMaterials.map(() => [] as Matrix4[]);
  const matrix = new Matrix4();
  const usableWidth = width - 1.06;
  const usableDepth = depth - 1.06;
  const spacing = 0.34;
  const columns = Math.ceil(usableWidth / spacing);
  const rows = Math.ceil(usableDepth / spacing);
  const layers = 7;
  let ballIndex = 0;
  for (let layer = 0; layer < layers; layer += 1) {
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const seed = Math.sin((ballIndex + 1) * 19.731) * 31843.371;
        const jitter = seed - Math.floor(seed);
        const staggerX = (row % 2) * spacing * 0.5 + (layer % 2) * spacing * 0.24;
        const x = centerX - usableWidth / 2 + column * spacing + staggerX + (jitter - 0.5) * 0.045;
        if (x > centerX + usableWidth / 2) {
          ballIndex += 1;
          continue;
        }
        const z = centerZ - usableDepth / 2 + row * spacing + (layer % 2) * spacing * 0.18 + (jitter - 0.5) * 0.045;
        if (z > centerZ + usableDepth / 2) {
          ballIndex += 1;
          continue;
        }

        const scale = 0.8 + jitter * 0.32;
        const y = 0.06 + layer * 0.14 + jitter * 0.055;
        matrix.compose(
          new Vector3(x, y, z),
          root.quaternion,
          new Vector3(scale, scale, scale),
        );
        const colorSeedValue = Math.sin((ballIndex + 1) * 73.137) * 9137.521;
        const colorSeed = colorSeedValue - Math.floor(colorSeedValue);
        ballBuckets[Math.floor(colorSeed * ballBuckets.length)].push(matrix.clone());
        ballIndex += 1;
      }
    }
  }

  ballBuckets.forEach((matrices, index) => {
    const ballMesh = new InstancedMesh(ballGeometry, ballMaterials[index], matrices.length);
    matrices.forEach((ballMatrix, matrixIndex) => {
      ballMesh.setMatrixAt(matrixIndex, ballMatrix);
    });
    ballMesh.instanceMatrix.needsUpdate = true;
    root.add(ballMesh);
  });

  return {
    label: 'Side Room Ball Pit',
    root,
    center,
    halfWidth,
    halfDepth,
    surfaceY,
    peekEyeY,
    hiddenEyeY,
  };
}

function createBallPitHalfPipeSlide(
  stairBaseX: number,
  stairBaseZ: number,
  ballPit: OfficeChapterBallPit,
): OfficeChapterBallPitSlide {
  const root = new Group();
  const frameMaterial = new MeshStandardMaterial({
    color: 0xf0b33e,
    emissive: 0x3a1900,
    emissiveIntensity: 0.12,
    roughness: 0.48,
    metalness: 0.1,
  });
  const stairMaterial = new MeshStandardMaterial({
    color: 0xc94d3f,
    emissive: 0x2a0504,
    emissiveIntensity: 0.1,
    roughness: 0.54,
    metalness: 0.06,
  });
  const slideMaterial = new MeshStandardMaterial({
    color: 0xffd15c,
    emissive: 0x4d2100,
    emissiveIntensity: 0.18,
    roughness: 0.3,
    metalness: 0.12,
    side: DoubleSide,
  });
  const railMaterial = new MeshStandardMaterial({
    color: 0x5bb8ff,
    emissive: 0x052849,
    emissiveIntensity: 0.18,
    roughness: 0.36,
    metalness: 0.18,
  });

  const stairWidth = 1.42;
  for (let index = 0; index < 6; index += 1) {
    const step = new Mesh(new BoxGeometry(0.5, 0.16, stairWidth), stairMaterial);
    step.position.set(stairBaseX + index * 0.42, 0.12 + index * 0.16, stairBaseZ);
    root.add(step);
  }

  const platformX = stairBaseX + 2.72;
  const platformY = 1.08;
  const platform = new Mesh(new BoxGeometry(1.25, 0.18, stairWidth + 0.24), frameMaterial);
  platform.position.set(platformX, platformY, stairBaseZ);
  root.add(platform);

  [-0.82, 0.82].forEach((railZ) => {
    const rail = new Mesh(new CylinderGeometry(0.045, 0.045, 2.9, 12), railMaterial);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(stairBaseX + 1.14, 0.82, stairBaseZ + railZ);
    root.add(rail);
  });

  const slideStart = new Vector3(platformX + 0.55, platformY - 0.1, stairBaseZ);
  const slideEnd = new Vector3(ballPit.center.x - ballPit.halfWidth + 0.72, ballPit.surfaceY - 0.34, stairBaseZ);
  const slideLength = slideStart.distanceTo(slideEnd);
  const slideMid = slideStart.clone().lerp(slideEnd, 0.5);
  const slideAngle = Math.atan2(slideStart.y - slideEnd.y, slideEnd.x - slideStart.x);

  const slideBowl = new Mesh(
    new CylinderGeometry(0.54, 0.54, slideLength, 28, 1, true, 0, Math.PI),
    slideMaterial,
  );
  slideBowl.position.copy(slideMid);
  slideBowl.rotation.set(0, 0, Math.PI / 2 - slideAngle);
  slideBowl.scale.z = 0.72;
  root.add(slideBowl);

  [-0.5, 0.5].forEach((side) => {
    const rail = new Mesh(new CylinderGeometry(0.055, 0.055, slideLength, 14), railMaterial);
    rail.position.copy(slideMid);
    rail.position.z += side * 0.46;
    rail.rotation.set(0, 0, Math.PI / 2 - slideAngle);
    root.add(rail);
  });

  const splashPad = new Mesh(new BoxGeometry(1.05, 0.06, 1.18), slideMaterial);
  splashPad.position.set(slideEnd.x + 0.32, ballPit.surfaceY - 0.62, slideEnd.z);
  splashPad.rotation.z = -0.12;
  root.add(splashPad);

  const sign = createWallSign('Slide', 'Ball Pit');
  sign.scale.set(0.72, 0.72, 1);
  sign.rotation.y = Math.PI / 2;
  sign.position.set(stairBaseX - 0.35, 1.25, stairBaseZ - 0.92);
  root.add(sign);

  return {
    label: 'Ball Pit Half-Pipe Slide',
    root,
    interactPosition: new Vector3(stairBaseX, GAME_CONFIG.player.height, stairBaseZ),
    startPosition: new Vector3(slideStart.x, GAME_CONFIG.player.height + 0.72, slideStart.z),
    endPosition: new Vector3(slideEnd.x + 0.55, ballPit.peekEyeY, slideEnd.z),
    lookTarget: new Vector3(ballPit.center.x, ballPit.peekEyeY, stairBaseZ),
  };
}

function createPartyPlayLabelMaterial(): MeshStandardMaterial {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');

  if (context) {
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#2a0808');
    gradient.addColorStop(0.56, '#6f1212');
    gradient.addColorStop(1, '#190505');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#ffd0b0';
    context.lineWidth = 12;
    context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
    context.fillStyle = '#fff2c8';
    context.font = 'bold 64px Trebuchet MS, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText("LET'S", canvas.width / 2, 86);
    context.fillStyle = '#ffcf70';
    context.fillText('PARTY', canvas.width / 2, 160);
    context.fillStyle = '#ffffff';
    context.font = 'bold 22px Trebuchet MS, sans-serif';
    context.fillText('PRESS THE RED BUTTON', canvas.width / 2, 214);
  }

  return new MeshStandardMaterial({
    map: new CanvasTexture(canvas),
    emissive: 0xff5135,
    emissiveIntensity: 0.58,
    side: DoubleSide,
    roughness: 0.24,
    metalness: 0.04,
  });
}

function createPartyPlayMachine(x: number, z: number, rotationY: number): OfficeChapterPartyPlayMachine {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const buttonMaterial = new MeshStandardMaterial({
    color: 0xd91f1f,
    emissive: 0x8d0606,
    emissiveIntensity: 0.62,
    roughness: 0.2,
    metalness: 0.18,
  });
  const labelMaterial = createPartyPlayLabelMaterial();
  const plateMaterial = new MeshStandardMaterial({
    color: 0x1b1c20,
    emissive: 0x160304,
    emissiveIntensity: 0.14,
    roughness: 0.46,
    metalness: 0.36,
  });
  const rimMaterial = new MeshStandardMaterial({
    color: 0x4f1511,
    emissive: 0x1a0302,
    emissiveIntensity: 0.12,
    roughness: 0.34,
    metalness: 0.5,
  });

  const wallPlate = new Mesh(new BoxGeometry(0.9, 1.2, 0.08), plateMaterial);
  wallPlate.position.set(0, 1.52, 0.02);
  const labelFrame = new Mesh(new BoxGeometry(0.74, 0.34, 0.04), rimMaterial);
  labelFrame.position.set(0, 1.88, 0.075);
  const label = new Mesh(new PlaneGeometry(0.64, 0.28), labelMaterial);
  label.position.set(0, 1.88, 0.101);
  const buttonRestZ = 0.16;
  const buttonRim = new Mesh(new CylinderGeometry(0.2, 0.21, 0.06, 28), rimMaterial);
  buttonRim.rotation.x = Math.PI / 2;
  buttonRim.position.set(0, 1.32, 0.1);
  const button = new Mesh(new CylinderGeometry(0.15, 0.15, 0.11, 28), buttonMaterial);
  button.rotation.x = Math.PI / 2;
  button.position.set(0, 1.32, buttonRestZ);

  root.add(wallPlate, labelFrame, label, buttonRim, button);
  root.updateMatrixWorld(true);

  return {
    label: "Let's Party wall button",
    root,
    position: root.localToWorld(new Vector3(0, 1.32, 0.1)),
    interactPosition: root.localToWorld(new Vector3(0, 1.32, 0.96)),
    button,
    buttonRestZ,
    pressAmount: 0,
    labelMaterial,
    buttonMaterial,
  };
}

function createFoxyPlayLabelMaterial(): MeshStandardMaterial {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');

  if (context) {
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#2a0808');
    gradient.addColorStop(0.56, '#6f1212');
    gradient.addColorStop(1, '#190505');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#ffd0b0';
    context.lineWidth = 12;
    context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
    context.fillStyle = '#fff2c8';
    context.font = 'bold 64px Trebuchet MS, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText("FOXY'S", canvas.width / 2, 86);
    context.fillStyle = '#ffcf70';
    context.fillText('PLAY', canvas.width / 2, 160);
    context.fillStyle = '#ffffff';
    context.font = 'bold 22px Trebuchet MS, sans-serif';
    context.fillText('PRESS THE RED BUTTON', canvas.width / 2, 214);
  }

  return new MeshStandardMaterial({
    map: new CanvasTexture(canvas),
    emissive: 0xff5135,
    emissiveIntensity: 0.58,
    side: DoubleSide,
    roughness: 0.24,
    metalness: 0.04,
  });
}

function createFoxyPlayButton(x: number, z: number, rotationY: number): OfficeChapterFoxyPlayButton {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const buttonMaterial = new MeshStandardMaterial({
    color: 0xd91f1f,
    emissive: 0x8d0606,
    emissiveIntensity: 0.62,
    roughness: 0.2,
    metalness: 0.18,
  });
  const labelMaterial = createFoxyPlayLabelMaterial();
  const plateMaterial = new MeshStandardMaterial({
    color: 0x1b1c20,
    emissive: 0x160304,
    emissiveIntensity: 0.14,
    roughness: 0.46,
    metalness: 0.36,
  });
  const rimMaterial = new MeshStandardMaterial({
    color: 0x4f1511,
    emissive: 0x1a0302,
    emissiveIntensity: 0.12,
    roughness: 0.34,
    metalness: 0.5,
  });

  const wallPlate = new Mesh(new BoxGeometry(0.9, 1.2, 0.08), plateMaterial);
  wallPlate.position.set(0, 1.52, 0.02);
  const labelFrame = new Mesh(new BoxGeometry(0.74, 0.34, 0.04), rimMaterial);
  labelFrame.position.set(0, 1.88, 0.075);
  const label = new Mesh(new PlaneGeometry(0.64, 0.28), labelMaterial);
  label.position.set(0, 1.88, 0.101);
  const buttonRestZ = 0.16;
  const buttonRim = new Mesh(new CylinderGeometry(0.2, 0.21, 0.06, 28), rimMaterial);
  buttonRim.rotation.x = Math.PI / 2;
  buttonRim.position.set(0, 1.32, 0.1);
  const button = new Mesh(new CylinderGeometry(0.15, 0.15, 0.11, 28), buttonMaterial);
  button.rotation.x = Math.PI / 2;
  button.position.set(0, 1.32, buttonRestZ);
  root.add(wallPlate, labelFrame, label, buttonRim, button);
  root.updateMatrixWorld(true);

  return {
    label: "Foxy's Play wall button",
    root,
    position: root.localToWorld(new Vector3(0, 1.32, 0.1)),
    interactPosition: root.localToWorld(new Vector3(0, 1.32, 0.96)),
    button,
    buttonRestZ,
    pressAmount: 0,
    labelMaterial,
    buttonMaterial,
  };
}

function createPartyTable(x: number, z: number, rotationY: number): Group {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const tableMaterial = new MeshStandardMaterial({
    color: 0x7f573b,
    roughness: 0.78,
    metalness: 0.04,
  });
  const clothMaterial = new MeshStandardMaterial({
    color: 0xd7c4a6,
    roughness: 0.88,
    metalness: 0.02,
  });
  const plateMaterial = new MeshStandardMaterial({
    color: 0xeee4d6,
    roughness: 0.68,
    metalness: 0.04,
  });
  const cupMaterial = new MeshStandardMaterial({
    color: 0xc54435,
    roughness: 0.54,
    metalness: 0.04,
  });

  const top = new Mesh(new BoxGeometry(3.3, 0.18, 1.42), tableMaterial);
  top.position.set(0, 0.82, 0);
  const cloth = new Mesh(new BoxGeometry(3.42, 0.08, 1.54), clothMaterial);
  cloth.position.set(0, 0.94, 0);
  root.add(top, cloth);

  [-1.35, 1.35].forEach((legX) => {
    [-0.48, 0.48].forEach((legZ) => {
      const leg = new Mesh(new CylinderGeometry(0.055, 0.07, 0.82, 10), tableMaterial);
      leg.position.set(legX, 0.42, legZ);
      root.add(leg);
    });
  });

  [-0.96, -0.32, 0.32, 0.96].forEach((plateX, index) => {
    const plate = new Mesh(new CylinderGeometry(0.18, 0.2, 0.035, 20), plateMaterial);
    plate.position.set(plateX, 1, index % 2 === 0 ? -0.3 : 0.3);
    const cup = new Mesh(new CylinderGeometry(0.07, 0.055, 0.18, 12), cupMaterial);
    cup.position.set(plateX + 0.18, 1.1, index % 2 === 0 ? -0.28 : 0.28);
    root.add(plate, cup);
  });

  return root;
}

const PRIZE_WHEEL_PRIZES = [
  'Stuffie',
  'Glass Cup',
  'Ticket',
  'Tiny Bear',
  'Lollipop',
  'Duck Toy',
  'Try Again',
  'Bonus',
] as const;

function createPrizeWheelMaterial(prizes: readonly string[]): MeshStandardMaterial {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  const colors = ['#e84747', '#f0ba3f', '#4dbb68', '#39a1df', '#a861dd', '#f26ca7', '#f28b3a', '#58d6ce'];

  if (context) {
    const center = canvas.width / 2;
    const radius = canvas.width * 0.46;
    const segmentAngle = Math.PI * 2 / prizes.length;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.clip();

    prizes.forEach((prize, index) => {
      const start = -Math.PI / 2 + index * segmentAngle;
      const end = start + segmentAngle;
      context.beginPath();
      context.moveTo(center, center);
      context.arc(center, center, radius, start, end);
      context.closePath();
      context.fillStyle = colors[index % colors.length] ?? '#f0ba3f';
      context.fill();
      context.strokeStyle = '#2a1216';
      context.lineWidth = 6;
      context.stroke();

      context.save();
      context.translate(center, center);
      context.rotate(start + segmentAngle / 2);
      context.fillStyle = '#fff7df';
      context.font = '700 24px Trebuchet MS, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(prize.toUpperCase(), radius * 0.56, 0);
      context.restore();
    });

    context.restore();
    context.beginPath();
    context.arc(center, center, radius * 0.18, 0, Math.PI * 2);
    context.fillStyle = '#fff2bf';
    context.fill();
    context.strokeStyle = '#381619';
    context.lineWidth = 8;
    context.stroke();
    context.fillStyle = '#6b1d24';
    context.font = '800 30px Trebuchet MS, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('SPIN', center, center);
  }

  return new MeshStandardMaterial({
    map: new CanvasTexture(canvas),
    transparent: true,
    emissive: 0x25100a,
    emissiveIntensity: 0.16,
    roughness: 0.42,
    metalness: 0.08,
    side: DoubleSide,
  });
}

function createPrizeWheel(x: number, y: number, z: number): OfficeChapterPrizeWheel {
  const prizes = [...PRIZE_WHEEL_PRIZES];
  const root = new Group();
  root.position.set(x, y, z);
  root.rotation.y = Math.PI / 2;

  const mountMaterial = new MeshStandardMaterial({
    color: 0x5f3b26,
    emissive: 0x140604,
    emissiveIntensity: 0.12,
    roughness: 0.54,
    metalness: 0.08,
  });
  const rimMaterial = new MeshStandardMaterial({
    color: 0xf6c956,
    emissive: 0x5a3005,
    emissiveIntensity: 0.28,
    roughness: 0.3,
    metalness: 0.36,
  });
  const pegMaterial = new MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffd770,
    emissiveIntensity: 0.22,
    roughness: 0.36,
    metalness: 0.2,
  });
  const pointerMaterial = new MeshStandardMaterial({
    color: 0xd91f31,
    emissive: 0x5a0308,
    emissiveIntensity: 0.32,
    roughness: 0.42,
    metalness: 0.12,
    side: DoubleSide,
  });

  const back = new Mesh(new BoxGeometry(2.62, 2.9, 0.16), mountMaterial);
  back.position.z = -0.05;
  const wheel = new Mesh(new PlaneGeometry(2.16, 2.16), createPrizeWheelMaterial(prizes));
  wheel.position.z = 0.05;
  const rim = new Mesh(new TorusGeometry(1.1, 0.045, 10, 72), rimMaterial);
  rim.position.z = 0.08;
  const hub = new Mesh(new CylinderGeometry(0.16, 0.16, 0.08, 24), rimMaterial);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.13;

  prizes.forEach((_, index) => {
    const angle = index / prizes.length * Math.PI * 2;
    const peg = new Mesh(new SphereGeometry(0.035, 10, 8), pegMaterial);
    peg.position.set(Math.cos(angle) * 0.96, Math.sin(angle) * 0.96, 0.12);
    wheel.add(peg);
  });

  const pointer = new Group();
  pointer.position.set(0, 1.28, 0.18);
  const pointerBody = new Mesh(new ConeGeometry(0.16, 0.4, 3), pointerMaterial);
  pointerBody.rotation.z = Math.PI;
  pointerBody.position.y = -0.08;
  const pointerBolt = new Mesh(new SphereGeometry(0.055, 12, 8), rimMaterial);
  pointer.add(pointerBody, pointerBolt);

  const sign = createWallSign('Spin', 'For A Prize');
  sign.scale.set(0.78, 0.78, 1);
  sign.position.set(0, -1.58, 0.12);

  root.add(back, wheel, rim, hub, pointer, sign);

  return {
    label: 'Spin For A Prize wheel',
    root,
    wheel,
    pointer,
    interactPosition: new Vector3(x + 0.9, y - 0.55, z),
    prizes,
    selectedPrize: prizes[0] ?? 'Prize',
    spinning: false,
    spinTime: 0,
    spinDuration: 0,
    spinStartRotation: 0,
    spinTargetRotation: 0,
    tickIndex: 0,
  };
}

function createToyPrizeDesk(x: number, z: number, rotationY = 0): Group {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const tableMaterial = new MeshStandardMaterial({
    color: 0x785236,
    roughness: 0.76,
    metalness: 0.04,
  });
  const clothMaterial = new MeshStandardMaterial({
    color: 0xffd07a,
    emissive: 0x3f1900,
    emissiveIntensity: 0.1,
    roughness: 0.82,
    metalness: 0.02,
  });
  const candyMaterial = new MeshStandardMaterial({
    color: 0xf54b6c,
    emissive: 0x3a0610,
    emissiveIntensity: 0.16,
    roughness: 0.4,
    metalness: 0.04,
  });
  const toyBlueMaterial = new MeshStandardMaterial({
    color: 0x4d8fe8,
    emissive: 0x071a3c,
    emissiveIntensity: 0.16,
    roughness: 0.58,
    metalness: 0.03,
  });
  const toyPinkMaterial = new MeshStandardMaterial({
    color: 0xf28bb8,
    emissive: 0x3a071c,
    emissiveIntensity: 0.13,
    roughness: 0.62,
    metalness: 0.03,
  });
  const wrapperMaterial = new MeshStandardMaterial({
    color: 0xfff4c6,
    emissive: 0x302006,
    emissiveIntensity: 0.08,
    roughness: 0.48,
    metalness: 0.03,
  });

  const top = new Mesh(new BoxGeometry(2.35, 0.18, 1.26), tableMaterial);
  top.position.y = 0.86;
  const cloth = new Mesh(new BoxGeometry(2.5, 0.08, 1.42), clothMaterial);
  cloth.position.y = 0.98;
  root.add(top, cloth);

  [-0.98, 0.98].forEach((legX) => {
    [-0.48, 0.48].forEach((legZ) => {
      const leg = new Mesh(new BoxGeometry(0.1, 0.82, 0.1), tableMaterial);
      leg.position.set(legX, 0.42, legZ);
      root.add(leg);
    });
  });

  const makeStuffie = (offsetX: number, offsetZ: number, material: MeshStandardMaterial): void => {
    const body = new Mesh(new SphereGeometry(0.18, 16, 12), material);
    body.scale.set(0.95, 1.16, 0.82);
    body.position.set(offsetX, 1.18, offsetZ);
    const head = new Mesh(new SphereGeometry(0.14, 16, 12), material);
    head.position.set(offsetX, 1.43, offsetZ - 0.01);
    const earA = new Mesh(new SphereGeometry(0.055, 10, 8), material);
    earA.position.set(offsetX - 0.09, 1.53, offsetZ - 0.01);
    const earB = earA.clone();
    earB.position.x = offsetX + 0.09;
    root.add(body, head, earA, earB);
  };

  makeStuffie(-0.72, -0.28, toyBlueMaterial);
  makeStuffie(0.5, -0.22, toyPinkMaterial);

  [-0.18, 0.04, 0.26, 0.86].forEach((candyX, index) => {
    const candy = new Mesh(new CylinderGeometry(0.055, 0.055, 0.34, 12), candyMaterial);
    candy.rotation.z = Math.PI / 2;
    candy.position.set(candyX, 1.1, index % 2 === 0 ? 0.18 : 0.36);
    const wrapperA = new Mesh(new ConeGeometry(0.045, 0.08, 8), wrapperMaterial);
    wrapperA.rotation.z = -Math.PI / 2;
    wrapperA.position.set(candyX - 0.2, 1.1, candy.position.z);
    const wrapperB = wrapperA.clone();
    wrapperB.rotation.z = Math.PI / 2;
    wrapperB.position.x = candyX + 0.2;
    root.add(candy, wrapperA, wrapperB);
  });

  const prizeBox = new Mesh(new BoxGeometry(0.42, 0.22, 0.32), toyBlueMaterial);
  prizeBox.position.set(-0.08, 1.12, -0.34);
  const prizeBow = new Mesh(new TorusGeometry(0.09, 0.012, 6, 18), candyMaterial);
  prizeBow.position.set(-0.08, 1.25, -0.34);
  prizeBow.rotation.x = Math.PI / 2;
  root.add(prizeBox, prizeBow);

  return root;
}

function createTicketMaterial(): MeshStandardMaterial {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');

  if (context) {
    context.fillStyle = '#f6c94d';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#5b3408';
    context.lineWidth = 10;
    context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    context.fillStyle = '#5b2404';
    context.font = 'bold 38px Trebuchet MS, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('TICKET', canvas.width / 2, canvas.height / 2);
  }

  return new MeshStandardMaterial({
    map: new CanvasTexture(canvas),
    emissive: 0x7a4c04,
    emissiveIntensity: 0.22,
    roughness: 0.46,
    metalness: 0.02,
  });
}

function createTicketPickup(id: string, x: number, z: number, rotationY: number): OfficeChapterTicketPickup {
  const root = new Group();
  root.position.set(x, 0.08, z);
  root.rotation.y = rotationY;
  const ticket = new Mesh(new BoxGeometry(0.46, 0.025, 0.24), createTicketMaterial());
  ticket.rotation.x = -0.08;
  root.add(ticket);

  return {
    id,
    label: 'Party Ticket',
    position: new Vector3(x, 0.12, z),
    root,
    collected: false,
  };
}

function createBackstageSignMaterial(): MeshStandardMaterial {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const context = canvas.getContext('2d');

  if (context) {
    context.fillStyle = '#191316';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#d7a744';
    context.lineWidth = 10;
    context.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
    context.fillStyle = '#f4d18a';
    context.font = 'bold 52px Trebuchet MS, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('BACKSTAGE', canvas.width / 2, 58);
    context.font = 'bold 34px Trebuchet MS, sans-serif';
    context.fillText('SUIT STORAGE', canvas.width / 2, 112);
  }

  return new MeshStandardMaterial({
    map: new CanvasTexture(canvas),
    emissive: 0x6f3a05,
    emissiveIntensity: 0.22,
    roughness: 0.48,
    metalness: 0.06,
    side: DoubleSide,
  });
}

function createEmployeeOnlySignMaterial(): MeshStandardMaterial {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 224;
  const context = canvas.getContext('2d');

  if (context) {
    context.fillStyle = '#1a1715';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#f2d455';
    context.lineWidth = 10;
    context.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
    context.fillStyle = '#f5f0dc';
    context.font = 'bold 42px Trebuchet MS, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('DO NOT ENTER', canvas.width / 2, 62);
    context.font = 'bold 30px Trebuchet MS, sans-serif';
    context.fillText('EMPLOYEES ONLY', canvas.width / 2, 112);
    context.fillStyle = '#ffd94b';
    context.beginPath();
    context.moveTo(canvas.width / 2, 140);
    context.lineTo(canvas.width / 2 - 42, 196);
    context.lineTo(canvas.width / 2 + 42, 196);
    context.closePath();
    context.fill();
    context.strokeStyle = '#191919';
    context.lineWidth = 6;
    context.stroke();
    context.fillStyle = '#191919';
    context.font = 'bold 42px Trebuchet MS, sans-serif';
    context.fillText('!', canvas.width / 2, 179);
  }

  return new MeshStandardMaterial({
    map: new CanvasTexture(canvas),
    emissive: 0x553100,
    emissiveIntensity: 0.24,
    roughness: 0.42,
    metalness: 0.04,
    side: DoubleSide,
  });
}

function createBackstagePartyHat(color: number): Group {
  const root = new Group();
  const hatMaterial = new MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.06,
    roughness: 0.62,
    metalness: 0.02,
  });
  const trimMaterial = new MeshStandardMaterial({
    color: 0xf3e6c6,
    roughness: 0.54,
    metalness: 0.02,
  });
  const cone = new Mesh(new CylinderGeometry(0.015, 0.16, 0.42, 18), hatMaterial);
  cone.position.set(0, 0.21, 0);
  const brim = new Mesh(new CylinderGeometry(0.18, 0.18, 0.035, 18), trimMaterial);
  brim.position.set(0, 0.02, 0);
  root.add(cone, brim);
  return root;
}

function createBackstageTicketPile(): Group {
  const root = new Group();
  const ticketMaterial = createTicketMaterial();

  [-0.15, 0, 0.16, 0.3].forEach((ticketX, index) => {
    const ticket = new Mesh(new BoxGeometry(0.42, 0.018, 0.2), ticketMaterial);
    ticket.position.set(ticketX, 0.015 + index * 0.012, (index % 2 - 0.5) * 0.12);
    ticket.rotation.y = (index - 1.5) * 0.18;
    ticket.rotation.z = (index % 2 === 0 ? 0.08 : -0.06);
    root.add(ticket);
  });

  return root;
}

function createBackstageShelf(x: number, z: number, rotationY: number): Group {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const shelfMaterial = new MeshStandardMaterial({
    color: 0x3a2b22,
    emissive: 0x0f0703,
    emissiveIntensity: 0.08,
    roughness: 0.76,
    metalness: 0.08,
  });
  const supportMaterial = new MeshStandardMaterial({
    color: 0x242125,
    emissive: 0x060405,
    emissiveIntensity: 0.08,
    roughness: 0.48,
    metalness: 0.36,
  });
  const boxMaterial = new MeshStandardMaterial({
    color: 0x7b5940,
    roughness: 0.86,
    metalness: 0.02,
  });

  [-1.22, 1.22].forEach((postX) => {
    [-0.26, 0.26].forEach((postZ) => {
      const post = new Mesh(new BoxGeometry(0.08, 2.28, 0.08), supportMaterial);
      post.position.set(postX, 1.14, postZ);
      root.add(post);
    });
  });

  [0.38, 0.98, 1.58, 2.16].forEach((shelfY) => {
    const shelf = new Mesh(new BoxGeometry(2.7, 0.1, 0.66), shelfMaterial);
    shelf.position.set(0, shelfY, 0);
    root.add(shelf);
  });

  [
    { x: -0.78, y: 0.66, z: -0.05, rotation: 0.1 },
    { x: 0.78, y: 1.26, z: 0.02, rotation: -0.12 },
  ].forEach((box) => {
    const crate = new Mesh(new BoxGeometry(0.74, 0.42, 0.46), boxMaterial);
    crate.position.set(box.x, box.y, box.z);
    crate.rotation.y = box.rotation;
    root.add(crate);
  });

  [
    { x: -0.78, y: 1.66, z: -0.02, color: 0xda3f32, rotation: -0.2 },
    { x: -0.24, y: 1.66, z: 0.05, color: 0x2f83c6, rotation: 0.16 },
    { x: 0.34, y: 2.24, z: -0.02, color: 0xf2c34a, rotation: 0.34 },
    { x: 0.88, y: 2.24, z: 0.08, color: 0x7d4fc6, rotation: -0.22 },
  ].forEach((hat) => {
    const partyHat = createBackstagePartyHat(hat.color);
    partyHat.position.set(hat.x, hat.y, hat.z);
    partyHat.rotation.set(0, hat.rotation, 0.08);
    root.add(partyHat);
  });

  const tickets = createBackstageTicketPile();
  tickets.position.set(0.08, 1.65, -0.12);
  tickets.rotation.y = -0.16;
  root.add(tickets);

  return root;
}

function createBrokenAnimatronicSuit(
  kind: 'cat' | 'gator' | 'owl',
  x: number,
  z: number,
  rotationY: number,
): Group {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const bodyColor = kind === 'cat'
    ? 0x6a6770
    : kind === 'gator'
      ? 0x486f3f
      : 0x8a714e;
  const accentColor = kind === 'cat'
    ? 0xb8adb5
    : kind === 'gator'
      ? 0xc1b36a
      : 0xd7bd82;
  const bodyMaterial = new MeshStandardMaterial({
    color: bodyColor,
    emissive: 0x080606,
    emissiveIntensity: 0.08,
    roughness: 0.86,
    metalness: 0.06,
  });
  const accentMaterial = new MeshStandardMaterial({
    color: accentColor,
    roughness: 0.78,
    metalness: 0.04,
  });
  const jointMaterial = new MeshStandardMaterial({
    color: 0x231b18,
    emissive: 0x090403,
    emissiveIntensity: 0.16,
    roughness: 0.42,
    metalness: 0.36,
  });
  const wireMaterial = new MeshStandardMaterial({
    color: 0xd34e33,
    emissive: 0x7a1208,
    emissiveIntensity: 0.22,
    roughness: 0.28,
    metalness: 0.2,
  });
  const eyeMaterial = new MeshStandardMaterial({
    color: 0x120909,
    emissive: 0xd52924,
    emissiveIntensity: 0.42,
    roughness: 0.34,
    metalness: 0.08,
  });

  const torso = new Mesh(new SphereGeometry(0.46, 16, 14), bodyMaterial);
  torso.scale.set(0.82, 1.12, 0.62);
  torso.position.set(0, 0.92, 0);
  const exposedCavity = new Mesh(new BoxGeometry(0.22, 0.36, 0.05), jointMaterial);
  exposedCavity.position.set(kind === 'gator' ? -0.1 : 0.14, 0.94, -0.32);
  const head = new Mesh(new SphereGeometry(0.3, 14, 12), bodyMaterial);
  head.scale.set(kind === 'gator' ? 1.18 : 0.94, 0.9, 0.9);
  head.position.set(0, 1.62, -0.03);
  const muzzle = new Mesh(
    kind === 'gator'
      ? new BoxGeometry(0.58, 0.14, 0.36)
      : new SphereGeometry(0.14, 10, 8),
    accentMaterial,
  );
  muzzle.position.set(0, 1.54, -0.28);
  if (kind !== 'gator') {
    muzzle.scale.set(1.12, 0.68, 0.52);
  }

  [-0.1, 0.1].forEach((eyeX, index) => {
    const eye = new Mesh(new SphereGeometry(0.04, 8, 8), eyeMaterial);
    eye.position.set(eyeX, 1.68, -0.28);
    if (kind === 'owl') {
      eye.scale.set(1.45, 1.45, 1);
    }
    if (kind === 'cat' && index === 1) {
      eye.position.y -= 0.04;
    }
    root.add(eye);
  });

  if (kind === 'cat') {
    [-0.18, 0.18].forEach((earX) => {
      const ear = new Mesh(new CylinderGeometry(0.02, 0.12, 0.36, 3), bodyMaterial);
      ear.position.set(earX, 1.92, 0.02);
      ear.rotation.z = earX < 0 ? 0.24 : -0.24;
      root.add(ear);
    });
  } else if (kind === 'gator') {
    [-0.2, -0.07, 0.07, 0.2].forEach((toothX) => {
      const tooth = new Mesh(new CylinderGeometry(0.004, 0.026, 0.12, 6), accentMaterial);
      tooth.position.set(toothX, 1.45, -0.48);
      tooth.rotation.x = Math.PI;
      root.add(tooth);
    });
  } else {
    const beak = new Mesh(new CylinderGeometry(0.02, 0.09, 0.18, 3), accentMaterial);
    beak.position.set(0, 1.53, -0.34);
    beak.rotation.x = Math.PI / 2;
    root.add(beak);
  }

  const leftArm = createLimbSegment(new Vector3(-0.38, 1.12, -0.02), new Vector3(-0.56, 0.76, -0.18), 0.062, bodyMaterial, 10);
  const leftForearm = createLimbSegment(new Vector3(-0.56, 0.76, -0.18), new Vector3(-0.74, 0.42, -0.12), 0.052, bodyMaterial, 10);
  const rightShoulder = new Mesh(new SphereGeometry(0.085, 10, 8), jointMaterial);
  rightShoulder.position.set(0.38, 1.12, -0.02);
  const detachedArm = createLimbSegment(new Vector3(0.42, 0.16, -0.46), new Vector3(0.86, 0.12, -0.36), 0.06, bodyMaterial, 10);
  detachedArm.rotation.y = -0.34;
  const leftLeg = createLimbSegment(new Vector3(-0.16, 0.5, 0), new Vector3(-0.22, 0.1, -0.08), 0.07, bodyMaterial, 10);
  const brokenLeg = createLimbSegment(new Vector3(0.16, 0.5, 0), new Vector3(0.34, 0.28, -0.16), 0.07, bodyMaterial, 10);
  const foot = new Mesh(new SphereGeometry(0.13, 10, 8), accentMaterial);
  foot.scale.set(1.4, 0.42, 0.8);
  foot.position.set(-0.24, 0.05, -0.26);

  const wirePath = new CatmullRomCurve3([
    new Vector3(0.26, 1.03, -0.36),
    new Vector3(0.42, 0.86, -0.44),
    new Vector3(0.48, 0.68, -0.26),
    new Vector3(0.62, 0.52, -0.38),
  ]);
  const hangingWires = new Mesh(new TubeGeometry(wirePath, 18, 0.012, 6, false), wireMaterial);

  const hat = createBackstagePartyHat(kind === 'cat' ? 0xd94a3a : kind === 'gator' ? 0x3d8fc2 : 0xdec24b);
  hat.position.set(-0.04, 1.92, -0.01);
  hat.rotation.set(0.1, -0.16, kind === 'owl' ? 0.32 : -0.26);

  root.add(
    torso,
    exposedCavity,
    head,
    muzzle,
    leftArm,
    leftForearm,
    rightShoulder,
    detachedArm,
    leftLeg,
    brokenLeg,
    foot,
    hangingWires,
    hat,
  );

  return root;
}

function createBathroomSignMaterial(label: string, subtitle = ''): MeshStandardMaterial {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const context = canvas.getContext('2d');

  if (context) {
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#12202b');
    gradient.addColorStop(1, '#28445c');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#dcecff';
    context.lineWidth = 10;
    context.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
    context.fillStyle = '#f4fbff';
    context.font = subtitle ? 'bold 58px Trebuchet MS, sans-serif' : 'bold 72px Trebuchet MS, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label, canvas.width / 2, subtitle ? 72 : canvas.height / 2);
    if (subtitle) {
      context.font = 'bold 34px Trebuchet MS, sans-serif';
      context.fillText(subtitle, canvas.width / 2, 132);
    }
  }

  return new MeshStandardMaterial({
    map: new CanvasTexture(canvas),
    emissive: 0x224c77,
    emissiveIntensity: 0.32,
    roughness: 0.36,
    metalness: 0.04,
    side: DoubleSide,
  });
}

function createWallSign(label: string, subtitle = ''): Mesh {
  const sign = new Mesh(new PlaneGeometry(1.34, 0.5), createBathroomSignMaterial(label, subtitle));
  return sign;
}

function createToiletFixture(): Group {
  const root = new Group();
  const porcelainMaterial = new MeshStandardMaterial({
    color: 0xe8edf0,
    emissive: 0x182024,
    emissiveIntensity: 0.08,
    roughness: 0.36,
    metalness: 0.04,
  });
  const seatMaterial = new MeshStandardMaterial({
    color: 0xc9d0d2,
    roughness: 0.42,
    metalness: 0.05,
  });
  const waterMaterial = new MeshStandardMaterial({
    color: 0x5b8fbb,
    emissive: 0x10324d,
    emissiveIntensity: 0.18,
    roughness: 0.22,
    metalness: 0.02,
  });

  const bowl = new Mesh(new SphereGeometry(0.22, 16, 12), porcelainMaterial);
  bowl.scale.set(1, 0.48, 1.18);
  bowl.position.set(0, 0.34, 0.05);
  const seat = new Mesh(new TorusGeometry(0.19, 0.028, 8, 24), seatMaterial);
  seat.position.set(0, 0.48, 0.05);
  seat.rotation.x = Math.PI / 2;
  seat.scale.z = 1.18;
  const water = new Mesh(new CylinderGeometry(0.12, 0.12, 0.012, 18), waterMaterial);
  water.position.set(0, 0.5, 0.05);
  const tank = new Mesh(new BoxGeometry(0.46, 0.34, 0.16), porcelainMaterial);
  tank.position.set(0, 0.72, -0.28);
  const base = new Mesh(new CylinderGeometry(0.11, 0.15, 0.28, 12), porcelainMaterial);
  base.position.set(0, 0.16, 0.02);
  root.add(base, bowl, seat, water, tank);
  return root;
}

function createUrinalFixture(x: number, z: number, rotationY: number): Group {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;
  const porcelainMaterial = new MeshStandardMaterial({
    color: 0xe7edf0,
    emissive: 0x111b20,
    emissiveIntensity: 0.08,
    roughness: 0.34,
    metalness: 0.04,
  });
  const pipeMaterial = new MeshStandardMaterial({
    color: 0xb7c4cc,
    emissive: 0x10191f,
    emissiveIntensity: 0.08,
    roughness: 0.22,
    metalness: 0.62,
  });

  const backPlate = new Mesh(new BoxGeometry(0.48, 0.88, 0.09), porcelainMaterial);
  backPlate.position.set(0, 0.92, -0.06);
  const bowlBack = new Mesh(new SphereGeometry(0.22, 18, 12), porcelainMaterial);
  bowlBack.scale.set(1.05, 0.95, 0.42);
  bowlBack.position.set(0, 0.62, 0.05);
  const lip = new Mesh(new TorusGeometry(0.18, 0.024, 8, 24), porcelainMaterial);
  lip.position.set(0, 0.58, 0.2);
  lip.rotation.x = Math.PI / 2;
  lip.scale.y = 0.72;
  const lowerCup = new Mesh(new SphereGeometry(0.16, 14, 10), porcelainMaterial);
  lowerCup.scale.set(0.95, 0.5, 0.68);
  lowerCup.position.set(0, 0.42, 0.18);
  const drain = new Mesh(new CylinderGeometry(0.035, 0.035, 0.012, 12), pipeMaterial);
  drain.position.set(0, 0.5, 0.28);
  drain.rotation.x = Math.PI / 2;
  const flushPipe = new Mesh(new CylinderGeometry(0.018, 0.018, 0.38, 8), pipeMaterial);
  flushPipe.position.set(0, 1.36, -0.02);
  const handle = new Mesh(new BoxGeometry(0.12, 0.035, 0.04), pipeMaterial);
  handle.position.set(0.2, 1.28, 0.02);
  const dividerMaterial = new MeshStandardMaterial({
    color: 0xdce4e8,
    roughness: 0.38,
    metalness: 0.05,
  });
  [-0.34, 0.34].forEach((dividerX) => {
    const divider = new Mesh(new BoxGeometry(0.04, 1.12, 0.48), dividerMaterial);
    divider.position.set(dividerX, 0.78, 0.13);
    root.add(divider);
  });
  root.add(backPlate, bowlBack, lip, lowerCup, drain, flushPipe, handle);
  return root;
}

function createBathroomStall(
  label: string,
  x: number,
  z: number,
  rotationY: number,
  doorColor = 0x38556b,
  openDirection: -1 | 1 = 1,
): OfficeChapterBathroomStall {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const partitionMaterial = new MeshStandardMaterial({
    color: 0x25323a,
    emissive: 0x05090c,
    emissiveIntensity: 0.08,
    roughness: 0.58,
    metalness: 0.34,
  });
  const doorMaterial = new MeshStandardMaterial({
    color: doorColor,
    emissive: 0x07131b,
    emissiveIntensity: 0.1,
    roughness: 0.5,
    metalness: 0.26,
  });
  const hingeMaterial = new MeshStandardMaterial({
    color: 0xb4bec5,
    roughness: 0.22,
    metalness: 0.66,
  });

  const leftPanel = new Mesh(new BoxGeometry(0.065, 1.95, 1.48), partitionMaterial);
  leftPanel.position.set(-0.6, 1.06, 0);
  const rightPanel = new Mesh(new BoxGeometry(0.065, 1.95, 1.48), partitionMaterial);
  rightPanel.position.set(0.6, 1.06, 0);
  const backPanel = new Mesh(new BoxGeometry(1.26, 1.95, 0.065), partitionMaterial);
  backPanel.position.set(0, 1.06, -0.74);
  const topBrace = new Mesh(new BoxGeometry(1.28, 0.08, 0.08), hingeMaterial);
  topBrace.position.set(0, 1.98, 0.73);
  const doorPivot = new Group();
  doorPivot.position.set(openDirection < 0 ? 0.56 : -0.56, 0, 0.73);
  const door = new Mesh(new BoxGeometry(0.9, 1.58, 0.06), doorMaterial);
  door.position.set(openDirection < 0 ? -0.43 : 0.43, 1.02, 0);
  const latch = new Mesh(new BoxGeometry(0.05, 0.05, 0.04), hingeMaterial);
  latch.position.set(openDirection < 0 ? -0.76 : 0.76, 1.14, 0.055);
  const hingeTop = new Mesh(new BoxGeometry(0.04, 0.16, 0.04), hingeMaterial);
  hingeTop.position.set(0, 1.55, 0.055);
  const hingeBottom = new Mesh(new BoxGeometry(0.04, 0.16, 0.04), hingeMaterial);
  hingeBottom.position.set(0, 0.56, 0.055);
  doorPivot.add(door, latch, hingeTop, hingeBottom);
  const toilet = createToiletFixture();
  toilet.position.set(0, 0, -0.28);
  root.add(leftPanel, rightPanel, backPanel, topBrace, doorPivot, toilet);
  root.updateMatrixWorld(true);
  return {
    label,
    root,
    interactPosition: root.localToWorld(new Vector3(0, 1, 1.22)),
    doorPivot,
    doorOpen: false,
    doorOpenAmount: 0,
    doorTargetOpenAmount: 0,
    openDirection,
  };
}

function createSinkCounter(label: string, x: number, z: number, rotationY: number, sinkCount: number): OfficeChapterBathroomSink {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const counterMaterial = new MeshStandardMaterial({
    color: 0x3a4850,
    emissive: 0x071016,
    emissiveIntensity: 0.08,
    roughness: 0.5,
    metalness: 0.18,
  });
  const porcelainMaterial = new MeshStandardMaterial({
    color: 0xe4ecef,
    emissive: 0x111b20,
    emissiveIntensity: 0.08,
    roughness: 0.34,
    metalness: 0.04,
  });
  const mirrorMaterial = new MeshStandardMaterial({
    color: 0x9fc1cf,
    emissive: 0x24485a,
    emissiveIntensity: 0.24,
    roughness: 0.18,
    metalness: 0.72,
  });
  const pipeMaterial = new MeshStandardMaterial({
    color: 0xc3cbd1,
    roughness: 0.22,
    metalness: 0.7,
  });
  const waterMaterial = new MeshStandardMaterial({
    color: 0x75c9ff,
    emissive: 0x2a8bc4,
    emissiveIntensity: 0.65,
    roughness: 0.12,
    metalness: 0.02,
    transparent: true,
    opacity: 0.76,
  });

  const width = sinkCount * 0.82 + 0.42;
  const counter = new Mesh(new BoxGeometry(width, 0.18, 0.44), counterMaterial);
  counter.position.set(0, 0.78, -0.05);
  const cabinet = new Mesh(new BoxGeometry(width, 0.64, 0.34), counterMaterial);
  cabinet.position.set(0, 0.38, -0.04);
  const mirror = new Mesh(new BoxGeometry(width, 0.72, 0.035), mirrorMaterial);
  mirror.position.set(0, 1.44, -0.3);
  root.add(counter, cabinet, mirror);

  const waterStreams: Mesh[] = [];
  const startX = -((sinkCount - 1) * 0.82) / 2;
  for (let index = 0; index < sinkCount; index += 1) {
    const sinkX = startX + index * 0.82;
    const basin = new Mesh(new SphereGeometry(0.19, 16, 10), porcelainMaterial);
    basin.scale.set(1.08, 0.24, 0.74);
    basin.position.set(sinkX, 0.89, -0.03);
    const faucet = new Mesh(new TorusGeometry(0.08, 0.01, 6, 12, Math.PI), pipeMaterial);
    faucet.position.set(sinkX, 1.02, -0.21);
    faucet.rotation.x = Math.PI / 2;
    const handleLeft = new Mesh(new CylinderGeometry(0.022, 0.022, 0.05, 10), pipeMaterial);
    handleLeft.position.set(sinkX - 0.12, 0.97, -0.18);
    handleLeft.rotation.x = Math.PI / 2;
    const handleRight = handleLeft.clone();
    handleRight.position.x = sinkX + 0.12;
    const water = new Mesh(new CylinderGeometry(0.012, 0.018, 0.36, 8), waterMaterial.clone());
    water.position.set(sinkX, 0.87, -0.15);
    water.visible = false;
    waterStreams.push(water);
    root.add(basin, faucet, handleLeft, handleRight, water);
  }

  root.updateMatrixWorld(true);
  return {
    label,
    root,
    interactPosition: root.localToWorld(new Vector3(0, 1, 0.64)),
    waterStreams,
    waterOn: false,
    waterAmount: 0,
  };
}

function createFoxPirateStage(x: number, z: number): Group {
  const root = new Group();
  root.position.set(x, 0, z);

  const stageMaterial = new MeshStandardMaterial({
    color: 0x34202d,
    emissive: 0x10030a,
    emissiveIntensity: 0.16,
    roughness: 0.72,
    metalness: 0.06,
  });
  const curtainMaterial = new MeshStandardMaterial({
    color: 0x481169,
    emissive: 0x170326,
    emissiveIntensity: 0.2,
    roughness: 0.8,
    metalness: 0.02,
  });
  const starMaterial = new MeshStandardMaterial({
    color: 0xffdd6e,
    emissive: 0xffb739,
    emissiveIntensity: 0.48,
    roughness: 0.36,
    metalness: 0.08,
  });
  const foxMaterial = new MeshStandardMaterial({
    color: 0xb85524,
    emissive: 0x1a0502,
    emissiveIntensity: 0.1,
    roughness: 0.72,
    metalness: 0.05,
  });
  const bellyMaterial = new MeshStandardMaterial({
    color: 0xd8b07a,
    roughness: 0.7,
    metalness: 0.03,
  });
  const darkMaterial = new MeshStandardMaterial({
    color: 0x0b090b,
    emissive: 0x030101,
    emissiveIntensity: 0.2,
    roughness: 0.5,
    metalness: 0.18,
  });
  const hookMaterial = new MeshStandardMaterial({
    color: 0xd7dee4,
    emissive: 0x1c2429,
    emissiveIntensity: 0.12,
    roughness: 0.2,
    metalness: 0.76,
  });
  const jointMaterial = new MeshStandardMaterial({
    color: 0x4d2416,
    emissive: 0x120503,
    emissiveIntensity: 0.16,
    roughness: 0.38,
    metalness: 0.32,
  });

  const stage = new Mesh(new BoxGeometry(3.2, 0.62, 8.4), stageMaterial);
  stage.position.set(0, 0.31, 0);
  const backCurtain = new Mesh(new BoxGeometry(0.16, 3, 8.8), curtainMaterial);
  backCurtain.position.set(1.46, 2.05, 0);
  const leftCurtain = new Mesh(new BoxGeometry(0.14, 2.78, 2.7), curtainMaterial);
  leftCurtain.position.set(-1.42, 2.02, -3.05);
  const rightCurtain = new Mesh(new BoxGeometry(0.14, 2.78, 2.7), curtainMaterial);
  rightCurtain.position.set(-1.42, 2.02, 3.05);
  const topValance = new Mesh(new BoxGeometry(0.18, 0.42, 8.75), curtainMaterial);
  topValance.position.set(-1.42, 3.38, 0);
  root.add(stage, backCurtain, leftCurtain, rightCurtain, topValance);
  root.userData.leftCurtain = leftCurtain;
  root.userData.rightCurtain = rightCurtain;

  [
    [-0.12, 2.95, -3.3],
    [0.12, 2.5, -2.15],
    [-0.08, 2.85, -0.8],
    [0.1, 2.35, 0.55],
    [-0.1, 2.72, 1.85],
    [0.08, 2.48, 3.2],
  ].forEach(([offsetX, starY, starZ]) => {
    const star = new Mesh(new BoxGeometry(0.06, 0.22, 0.22), starMaterial);
    star.position.set(1.36 + offsetX, starY, starZ);
    star.rotation.x = Math.PI / 4;
    root.add(star);
  });

  const foxRoot = new Group();
  foxRoot.position.set(0.12, 0.62, 0);
  foxRoot.rotation.y = Math.PI / 2;
  foxRoot.scale.y = 1.05;
  const body = new Mesh(new SphereGeometry(0.54, 18, 16), foxMaterial);
  body.scale.set(0.86, 1.32, 0.68);
  body.position.set(0, 1.08, 0);
  const belly = new Mesh(new SphereGeometry(0.32, 14, 12), bellyMaterial);
  belly.scale.set(0.78, 1.12, 0.34);
  belly.position.set(0, 1.04, -0.42);
  const headGroup = new Group();
  headGroup.position.set(0, 2.1, -0.02);
  const head = new Mesh(new SphereGeometry(0.38, 22, 14), foxMaterial);
  head.scale.set(1.02, 0.72, 0.92);
  const jawline = new Mesh(new SphereGeometry(0.28, 18, 10), bellyMaterial);
  jawline.scale.set(1.45, 0.26, 0.48);
  jawline.position.set(0, -0.2, -0.34);
  const snout = new Mesh(new BoxGeometry(0.28, 0.16, 0.38), bellyMaterial);
  snout.position.set(0, -0.08, -0.34);
  const mouthLine = new Mesh(new BoxGeometry(0.18, 0.028, 0.026), darkMaterial);
  mouthLine.position.set(0, -0.17, -0.545);
  const toothMaterial = new MeshStandardMaterial({
    color: 0xe9dfc8,
    emissive: 0x181006,
    emissiveIntensity: 0.08,
    roughness: 0.5,
    metalness: 0.02,
  });
  [-0.15, -0.09, -0.03, 0.03, 0.09, 0.15].forEach((toothX) => {
    const tooth = new Mesh(new ConeGeometry(0.017, 0.06, 7), toothMaterial);
    tooth.position.set(toothX, -0.17, -0.568);
    tooth.rotation.x = Math.PI;
    headGroup.add(tooth);
  });
  [-0.2, 0.2].forEach((earX) => {
    const ear = new Mesh(new CylinderGeometry(0.02, 0.14, 0.44, 3), foxMaterial);
    ear.position.set(earX, 0.34, 0.05);
    ear.rotation.z = earX < 0 ? 0.28 : -0.28;
    headGroup.add(ear);
  });
  const eyeMaterial = new MeshStandardMaterial({
    color: 0x151010,
    emissive: 0xe33d2f,
    emissiveIntensity: 0.62,
    roughness: 0.32,
    metalness: 0.12,
  });
  const visibleEye = new Mesh(new SphereGeometry(0.045, 10, 10), eyeMaterial);
  visibleEye.position.set(-0.12, 0.06, -0.32);
  const eyePatch = new Mesh(new BoxGeometry(0.18, 0.12, 0.025), darkMaterial);
  eyePatch.position.set(0.13, 0.06, -0.33);
  const patchStrap = new Mesh(new BoxGeometry(0.5, 0.025, 0.02), darkMaterial);
  patchStrap.position.set(0, 0.1, -0.34);
  patchStrap.rotation.z = -0.28;
  headGroup.add(head, jawline, snout, mouthLine, visibleEye, eyePatch, patchStrap);

  const leftArm = createStageJointedArm(-1, 'relaxed', foxMaterial, jointMaterial, bellyMaterial);
  const rightArm = createStageJointedArm(1, 'relaxed', foxMaterial, jointMaterial, bellyMaterial);
  const leftLeg = createStageJointedLeg(-1, foxMaterial, jointMaterial, bellyMaterial);
  const rightLeg = createStageJointedLeg(1, foxMaterial, jointMaterial, bellyMaterial);
  const hook = new Group();
  hook.position.set(-0.03, -0.34, -0.16);
  hook.rotation.set(Math.PI / 2, 0.08, -0.45);
  const hookCuff = new Mesh(new CylinderGeometry(0.095, 0.105, 0.09, 16), hookMaterial);
  hookCuff.rotation.x = Math.PI / 2;
  const hookCurve = new Mesh(new TorusGeometry(0.13, 0.023, 8, 20, Math.PI * 1.28), hookMaterial);
  hookCurve.position.set(0.07, -0.07, -0.12);
  hookCurve.rotation.z = -0.08;
  hook.add(hookCuff, hookCurve);
  rightArm.joint.add(hook);

  const tail = new Mesh(new CylinderGeometry(0.08, 0.18, 0.72, 12), foxMaterial);
  tail.position.set(0, 0.9, 0.48);
  tail.rotation.x = -0.88;
  const tailTip = new Mesh(new CylinderGeometry(0.035, 0.085, 0.18, 12), bellyMaterial);
  tailTip.position.set(0, 1.16, 0.74);
  tailTip.rotation.x = -0.88;
  foxRoot.add(
    body,
    belly,
    headGroup,
    leftArm.root,
    rightArm.root,
    leftLeg.root,
    rightLeg.root,
    tail,
    tailTip,
  );
  root.userData.foxyParts = {
    foxRoot,
    head: headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    hook,
    base: {
      foxRootPosition: foxRoot.position.clone(),
      foxRootRotation: new Vector3(foxRoot.rotation.x, foxRoot.rotation.y, foxRoot.rotation.z),
      headPosition: headGroup.position.clone(),
      headRotation: new Vector3(headGroup.rotation.x, headGroup.rotation.y, headGroup.rotation.z),
      leftArmPosition: leftArm.root.position.clone(),
      rightArmPosition: rightArm.root.position.clone(),
      leftLegPosition: leftLeg.root.position.clone(),
      rightLegPosition: rightLeg.root.position.clone(),
      hookPosition: hook.position.clone(),
      hookRotation: new Vector3(hook.rotation.x, hook.rotation.y, hook.rotation.z),
    },
  };
  root.add(foxRoot, createAnimatronicNamePlate('Foxy', 'the Pirate Fox', '#ff9b52', 0x201016));

  return root;
}

function createBasketballGame(x: number, z: number, rotationY: number): OfficeChapterBasketballGame {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const tableMaterial = new MeshStandardMaterial({
    color: 0x7f573b,
    roughness: 0.78,
    metalness: 0.04,
  });
  const frameMaterial = new MeshStandardMaterial({
    color: 0x243b57,
    emissive: 0x05101f,
    emissiveIntensity: 0.12,
    roughness: 0.44,
    metalness: 0.28,
  });
  const backboardMaterial = new MeshStandardMaterial({
    color: 0xf0f4f7,
    emissive: 0x1a252e,
    emissiveIntensity: 0.08,
    roughness: 0.38,
    metalness: 0.1,
  });
  const rimMaterial = new MeshStandardMaterial({
    color: 0xe04622,
    emissive: 0x3c0902,
    emissiveIntensity: 0.22,
    roughness: 0.28,
    metalness: 0.26,
  });
  const netMaterial = new MeshStandardMaterial({
    color: 0xe9edf1,
    roughness: 0.42,
    metalness: 0.04,
  });
  const ballMaterial = new MeshStandardMaterial({
    color: 0xd76522,
    emissive: 0x2a0900,
    emissiveIntensity: 0.08,
    roughness: 0.54,
    metalness: 0.02,
  });

  const tableTop = new Mesh(new BoxGeometry(2.6, 0.16, 1.28), tableMaterial);
  tableTop.position.set(0, 0.82, 0.62);
  [-1.1, 1.1].forEach((legX) => {
    [-0.44, 1.54].forEach((legZ) => {
      const leg = new Mesh(new BoxGeometry(0.12, 0.78, 0.12), tableMaterial);
      leg.position.set(legX, 0.39, legZ);
      root.add(leg);
    });
  });
  const backRail = new Mesh(new BoxGeometry(3.1, 0.12, 0.12), frameMaterial);
  backRail.position.set(0, 1.48, -1.08);
  const leftNet = new Mesh(new BoxGeometry(0.06, 1.25, 2.45), netMaterial);
  leftNet.position.set(-1.5, 1.12, 0.12);
  const rightNet = leftNet.clone();
  rightNet.position.x = 1.5;
  root.add(tableTop, backRail, leftNet, rightNet);

  [-0.58, 0.58].forEach((hoopX) => {
    const backboard = new Mesh(new BoxGeometry(0.7, 0.48, 0.06), backboardMaterial);
    backboard.position.set(hoopX, 1.74, -1.16);
    const rim = new Mesh(new TorusGeometry(0.18, 0.018, 8, 28), rimMaterial);
    rim.position.set(hoopX, 1.48, -0.92);
    rim.rotation.x = Math.PI / 2;
    const net = new Mesh(new CylinderGeometry(0.17, 0.11, 0.34, 16, 1, true), netMaterial);
    net.position.set(hoopX, 1.29, -0.92);
    root.add(backboard, rim, net);
  });

  const ball = new Mesh(new SphereGeometry(0.17, 16, 12), ballMaterial);
  const ballHomePosition = new Vector3(0, 1.04, 0.95);
  ball.position.copy(ballHomePosition);
  root.add(ball);
  root.updateMatrixWorld(true);

  return {
    label: 'Ticket Basketball Game',
    position: root.localToWorld(new Vector3(0, 1, 0.4)),
    interactPosition: root.localToWorld(new Vector3(0, 1.05, 1.65)),
    root,
    ball,
    ballHomePosition,
    leftHoopTarget: new Vector3(-0.58, 1.46, -0.92),
    rightHoopTarget: new Vector3(0.58, 1.46, -0.92),
  };
}

function createBibMaterial(): MeshStandardMaterial {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const context = canvas.getContext('2d');

  if (context) {
    context.fillStyle = '#f4efe0';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#d64832';
    context.fillRect(0, 0, canvas.width, 24);
    context.fillRect(0, canvas.height - 24, canvas.width, 24);
    context.fillStyle = '#282018';
    context.font = 'bold 40px Trebuchet MS, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText("Let's", canvas.width / 2, 78);
    context.fillText('Party!', canvas.width / 2, 124);
  }

  const texture = new CanvasTexture(canvas);
  return new MeshStandardMaterial({
    map: texture,
    roughness: 0.76,
    metalness: 0.02,
    side: DoubleSide,
  });
}

function createDuckBib(): Group {
  const root = new Group();
  const bibMaterial = createBibMaterial();
  const clothMaterial = new MeshStandardMaterial({
    color: 0xf4efe0,
    roughness: 0.78,
    metalness: 0.02,
    side: DoubleSide,
  });
  const trimMaterial = new MeshStandardMaterial({
    color: 0xd64832,
    emissive: 0x3d0804,
    emissiveIntensity: 0.1,
    roughness: 0.72,
    metalness: 0.02,
  });

  const centerBib = new Mesh(new PlaneGeometry(0.46, 0.42), bibMaterial);
  centerBib.position.set(0, 1.14, -0.592);
  centerBib.rotation.set(-0.08, Math.PI, 0);

  const leftBib = new Mesh(new PlaneGeometry(0.2, 0.38), clothMaterial);
  leftBib.position.set(-0.27, 1.14, -0.55);
  leftBib.rotation.set(-0.08, Math.PI + 0.42, 0.02);

  const rightBib = new Mesh(new PlaneGeometry(0.2, 0.38), clothMaterial);
  rightBib.position.set(0.27, 1.14, -0.55);
  rightBib.rotation.set(-0.08, Math.PI - 0.42, -0.02);

  const topTrim = new Mesh(new BoxGeometry(0.5, 0.035, 0.026), trimMaterial);
  topTrim.position.set(0, 1.36, -0.605);
  topTrim.rotation.y = Math.PI;

  const bottomTrim = new Mesh(new BoxGeometry(0.42, 0.035, 0.026), trimMaterial);
  bottomTrim.position.set(0, 0.92, -0.6);
  bottomTrim.rotation.y = Math.PI;

  const neckStrapPath = new CatmullRomCurve3([
    new Vector3(-0.22, 1.36, -0.61),
    new Vector3(-0.28, 1.45, -0.57),
    new Vector3(-0.34, 1.55, -0.44),
    new Vector3(-0.38, 1.64, -0.2),
    new Vector3(-0.22, 1.71, 0.02),
    new Vector3(0, 1.73, 0.06),
    new Vector3(0.22, 1.71, 0.02),
    new Vector3(0.38, 1.64, -0.2),
    new Vector3(0.34, 1.55, -0.44),
    new Vector3(0.28, 1.45, -0.57),
    new Vector3(0.22, 1.36, -0.61),
  ]);
  const neckStrap = new Mesh(new TubeGeometry(neckStrapPath, 44, 0.028, 8, false), trimMaterial);

  root.add(leftBib, rightBib, centerBib, topTrim, bottomTrim, neckStrap);
  return root;
}

function createAnimatronicNamePlateMaterial(
  title: string,
  subtitle: string,
  borderColor: string,
): MeshStandardMaterial {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const context = canvas.getContext('2d');

  if (context) {
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#261512');
    gradient.addColorStop(1, '#5f261b');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = borderColor;
    context.lineWidth = 12;
    context.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
    context.fillStyle = '#f4efe0';
    context.font = 'bold 58px Trebuchet MS, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(title, canvas.width / 2, 76);
    context.font = 'bold 42px Trebuchet MS, sans-serif';
    context.fillText(subtitle, canvas.width / 2, 128);
  }

  return new MeshStandardMaterial({
    map: new CanvasTexture(canvas),
    roughness: 0.58,
    metalness: 0.08,
    side: DoubleSide,
  });
}

function createAnimatronicNamePlate(
  title: string,
  subtitle: string,
  borderColor: string,
  frameColor: number,
): Group {
  const root = new Group();
  const frameMaterial = new MeshStandardMaterial({
    color: frameColor,
    emissive: 0x120403,
    emissiveIntensity: 0.14,
    roughness: 0.56,
    metalness: 0.14,
  });
  const frame = new Mesh(new BoxGeometry(1.24, 0.5, 0.06), frameMaterial);
  frame.position.set(0, 0.27, -0.91);
  const sign = new Mesh(
    new PlaneGeometry(1.08, 0.4),
    createAnimatronicNamePlateMaterial(title, subtitle, borderColor),
  );
  sign.position.set(0, 0.27, -0.945);
  sign.rotation.y = Math.PI;
  root.add(frame, sign);
  return root;
}

function createLimbSegment(
  start: Vector3,
  end: Vector3,
  radius: number,
  material: MeshStandardMaterial,
  radialSegments = 12,
): Mesh {
  const direction = end.clone().sub(start);
  const segment = new Mesh(
    new CylinderGeometry(radius * 0.86, radius, direction.length(), radialSegments),
    material,
  );
  segment.position.copy(start).add(end).multiplyScalar(0.5);
  segment.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
  return segment;
}

function createBoxSegment(
  start: Vector3,
  end: Vector3,
  width: number,
  depth: number,
  material: MeshStandardMaterial,
): Mesh {
  const direction = end.clone().sub(start);
  const segment = new Mesh(new BoxGeometry(width, direction.length(), depth), material);
  segment.position.copy(start).add(end).multiplyScalar(0.5);
  segment.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
  return segment;
}

type StageArmPose = 'relaxed' | 'plate' | 'guitarNeck' | 'guitarBody' | 'drumLeft' | 'drumRight';

function createJointedFinger(points: Vector3[], radius: number, material: MeshStandardMaterial): Group {
  const root = new Group();

  for (let index = 0; index < points.length - 1; index += 1) {
    root.add(createLimbSegment(points[index], points[index + 1], radius, material, 8));
  }

  points.slice(1).forEach((point, index) => {
    const joint = new Mesh(new SphereGeometry(index === points.length - 2 ? radius * 1.35 : radius * 1.65, 8, 8), material);
    joint.position.copy(point);
    root.add(joint);
  });

  return root;
}

function createAnimatronicHand(
  side: -1 | 1,
  position: Vector3,
  pose: StageArmPose,
  handMaterial: MeshStandardMaterial,
): Group {
  const root = new Group();
  const palm = new Mesh(new SphereGeometry(0.12, 12, 10), handMaterial);
  const palmPosition = position.clone();
  if (pose === 'plate') {
    palmPosition.y += 0.015;
    palm.scale.set(1.2, 0.36, 1.02);
  } else if (pose === 'drumLeft' || pose === 'drumRight') {
    palmPosition.z -= 0.02;
    palm.scale.set(0.86, 0.72, 0.78);
  } else {
    palm.scale.set(1.1, 0.72, 0.86);
  }
  palm.position.copy(palmPosition);
  root.add(palm);

  if (pose === 'plate') {
    [-0.09, -0.03, 0.03, 0.09].forEach((fingerX) => {
      root.add(createJointedFinger([
        new Vector3(position.x + fingerX, position.y + 0.02, position.z - 0.04),
        new Vector3(position.x + fingerX * 0.9, position.y + 0.055, position.z - 0.18),
        new Vector3(position.x + fingerX * 0.72, position.y + 0.1, position.z - 0.27),
      ], 0.017, handMaterial));
    });

    root.add(createJointedFinger([
      new Vector3(position.x - side * 0.1, position.y + 0.02, position.z - 0.01),
      new Vector3(position.x - side * 0.19, position.y + 0.06, position.z - 0.11),
      new Vector3(position.x - side * 0.16, position.y + 0.105, position.z - 0.23),
    ], 0.02, handMaterial));

    return root;
  }

  [-0.065, 0, 0.065].forEach((fingerX) => {
    const start = new Vector3(position.x + fingerX, position.y - 0.01, position.z - 0.05);
    const middle = pose === 'relaxed'
      ? new Vector3(position.x + fingerX * 0.8, position.y - 0.1, position.z - 0.08)
      : pose === 'guitarNeck'
        ? new Vector3(position.x + 0.08 + fingerX * 0.24, position.y - 0.01 + fingerX * 0.55, position.z - 0.08)
        : pose === 'guitarBody'
          ? new Vector3(position.x - side * 0.06 + fingerX * 0.34, position.y - 0.07, position.z - 0.13)
          : new Vector3(position.x + fingerX * 0.58, position.y + 0.02, position.z - 0.16);
    const end = pose === 'relaxed'
      ? new Vector3(position.x + fingerX * 0.72, position.y - 0.17, position.z - 0.07)
      : pose === 'guitarNeck'
        ? new Vector3(position.x + 0.15 + fingerX * 0.16, position.y - 0.03 + fingerX * 0.62, position.z - 0.16)
        : pose === 'guitarBody'
          ? new Vector3(position.x - side * 0.1 + fingerX * 0.25, position.y - 0.11, position.z - 0.2)
          : new Vector3(position.x + fingerX * 0.38, position.y - 0.01, position.z - 0.24);
    root.add(createJointedFinger([start, middle, end], 0.018, handMaterial));
  });

  const thumbStart = new Vector3(position.x - side * 0.08, position.y + 0.01, position.z - 0.02);
  const thumbMiddle = pose === 'relaxed'
    ? new Vector3(position.x - side * 0.13, position.y - 0.04, position.z - 0.05)
    : pose === 'guitarNeck'
      ? new Vector3(position.x - side * 0.08, position.y + 0.06, position.z - 0.11)
      : new Vector3(position.x - side * 0.13, position.y + 0.02, position.z - 0.12);
  const thumbEnd = pose === 'relaxed'
    ? new Vector3(position.x - side * 0.16, position.y - 0.08, position.z - 0.06)
    : pose === 'guitarNeck'
      ? new Vector3(position.x + 0.08, position.y + 0.03, position.z - 0.17)
      : new Vector3(position.x - side * 0.16, position.y - 0.02, position.z - 0.2);
  root.add(createJointedFinger([thumbStart, thumbMiddle, thumbEnd], 0.02, handMaterial));

  return root;
}

function createStageJointedArm(
  side: -1 | 1,
  pose: StageArmPose,
  bodyMaterial: MeshStandardMaterial,
  jointMaterial: MeshStandardMaterial,
  handMaterial: MeshStandardMaterial,
): StageLimbRefs {
  const root = new Group();
  const shoulder = new Vector3(side * 0.46, 1.44, -0.08);
  const elbow = pose === 'plate'
    ? new Vector3(side * 0.6, 1.24, -0.36)
    : pose === 'guitarNeck'
      ? new Vector3(side * 0.5, 1.36, -0.34)
      : pose === 'guitarBody'
        ? new Vector3(side * 0.48, 1.14, -0.36)
        : pose === 'drumLeft' || pose === 'drumRight'
          ? new Vector3(side * 0.54, 1.28, -0.36)
          : new Vector3(side * 0.58, 1.05, -0.14);
  const wrist = pose === 'plate'
    ? new Vector3(side * 0.62, 1.08, -0.58)
    : pose === 'guitarNeck'
      ? new Vector3(side * 0.5, 1.34, -0.66)
      : pose === 'guitarBody'
        ? new Vector3(side * 0.24, 1, -0.68)
        : pose === 'drumLeft' || pose === 'drumRight'
          ? new Vector3(side * 0.28, 1.08, -0.72)
          : new Vector3(side * 0.52, 0.72, -0.28);
  const localElbow = elbow.clone().sub(shoulder);
  const localWrist = wrist.clone().sub(elbow);

  root.position.copy(shoulder);
  const forearm = new Group();
  forearm.position.copy(localElbow);

  const upperSegment = createLimbSegment(new Vector3(0, 0, 0), localElbow, 0.086, bodyMaterial);
  const shoulderJoint = new Mesh(new SphereGeometry(0.13, 12, 10), jointMaterial);
  shoulderJoint.scale.set(1.08, 0.9, 1);
  const elbowJoint = new Mesh(new SphereGeometry(0.105, 12, 10), jointMaterial);
  elbowJoint.scale.set(1.08, 0.9, 1);
  const wristJoint = new Mesh(new SphereGeometry(0.084, 12, 10), jointMaterial);
  wristJoint.scale.set(1.08, 0.9, 1);
  wristJoint.position.copy(localWrist);

  forearm.add(
    elbowJoint,
    createLimbSegment(new Vector3(0, 0, 0), localWrist, 0.074, bodyMaterial),
    wristJoint,
    createAnimatronicHand(side, localWrist, pose, handMaterial),
  );
  root.add(upperSegment, shoulderJoint, forearm);

  return {
    root,
    joint: forearm,
    basePosition: shoulder.clone(),
  };
}

function createStageJointedLeg(
  side: -1 | 1,
  bodyMaterial: MeshStandardMaterial,
  jointMaterial: MeshStandardMaterial,
  footMaterial: MeshStandardMaterial,
): StageLimbRefs {
  const root = new Group();
  const hip = new Vector3(side * 0.25, 0.88, 0.02);
  const knee = new Vector3(side * 0.31, 0.48, -0.02);
  const ankle = new Vector3(side * 0.27, 0.1, -0.09);
  const localKnee = knee.clone().sub(hip);
  const localAnkle = ankle.clone().sub(knee);
  const footPosition = new Vector3(side * 0.28, 0.035, -0.28).sub(knee);

  root.position.copy(hip);
  const lowerLeg = new Group();
  lowerLeg.position.copy(localKnee);

  const upperLeg = createLimbSegment(new Vector3(0, 0, 0), localKnee, 0.102, bodyMaterial);
  const hipJoint = new Mesh(new SphereGeometry(0.126, 12, 10), jointMaterial);
  hipJoint.scale.set(1.08, 0.9, 1);
  const kneeJoint = new Mesh(new SphereGeometry(0.112, 12, 10), jointMaterial);
  kneeJoint.scale.set(1.14, 0.94, 1.08);
  const ankleJoint = new Mesh(new SphereGeometry(0.108, 12, 10), jointMaterial);
  ankleJoint.scale.set(1.12, 0.92, 1.06);
  ankleJoint.position.copy(localAnkle);

  const foot = new Mesh(new SphereGeometry(0.17, 12, 10), footMaterial);
  foot.scale.set(1.58, 0.54, 1.02);
  foot.position.copy(footPosition);
  lowerLeg.add(
    kneeJoint,
    createLimbSegment(new Vector3(0, 0, 0), localAnkle, 0.092, bodyMaterial),
    ankleJoint,
    foot,
  );
  root.add(upperLeg, hipJoint, lowerLeg);

  return {
    root,
    joint: lowerLeg,
    basePosition: hip.clone(),
  };
}

function createBunnyEar(
  side: -1 | 1,
  dangling: boolean,
  bodyMaterial: MeshStandardMaterial,
  innerMaterial: MeshStandardMaterial,
  jointMaterial: MeshStandardMaterial,
): Group {
  const root = new Group();
  root.position.set(side * 0.18, 0.33, 0.04);

  const points = dangling
    ? [
        new Vector3(0, 0, 0),
        new Vector3(side * 0.02, 0.26, 0.02),
        new Vector3(side * 0.16, 0.42, 0.02),
        new Vector3(side * 0.34, 0.28, -0.02),
        new Vector3(side * 0.39, 0.02, -0.04),
      ]
    : [
        new Vector3(0, 0, 0),
        new Vector3(side * 0.015, 0.25, 0.02),
        new Vector3(side * 0.035, 0.5, 0.035),
        new Vector3(side * 0.02, 0.72, 0.035),
      ];

  for (let index = 0; index < points.length - 1; index += 1) {
    root.add(createLimbSegment(points[index], points[index + 1], 0.074 - index * 0.007, bodyMaterial, 12));
    root.add(createLimbSegment(
      points[index].clone().add(new Vector3(0, 0.01, -0.018)),
      points[index + 1].clone().add(new Vector3(0, -0.005, -0.02)),
      0.036 - index * 0.003,
      innerMaterial,
      10,
    ));
  }

  points.forEach((point, index) => {
    const joint = new Mesh(new SphereGeometry(index === 0 ? 0.09 : 0.07, 12, 10), jointMaterial);
    joint.scale.set(1.02, 0.9, 1.08);
    joint.position.copy(point);
    root.add(joint);
  });

  return root;
}

function createStageAnimatronic(
  kind: 'duck' | 'bunny' | 'bear',
  x: number,
  y: number,
  z: number,
  includeNamePlate = true,
  includePerformanceProps = true,
  sandboxQuackyDesign = false,
): StageAnimatronicRefs {
  const root = new Group();
  root.position.set(x, y, z);
  root.rotation.y = Math.PI;
  root.scale.y = 1.05;
  const detailedDuck = kind === 'duck' && sandboxQuackyDesign;

  const bodyColor = kind === 'duck'
    ? detailedDuck ? 0xd5a02e : 0xc28f32
    : kind === 'bunny'
      ? 0x9b8eb1
      : 0x6e4a35;
  const accentColor = kind === 'duck'
    ? detailedDuck ? 0xf1c95f : 0xe8bd56
    : kind === 'bunny'
      ? 0xc7bfd4
      : 0xb0825a;
  const muzzleColor = kind === 'duck' ? detailedDuck ? 0xf07a22 : 0xd18432 : 0xc9b493;
  const bodyMaterial = new MeshStandardMaterial({
    color: bodyColor,
    emissive: 0x100808,
    emissiveIntensity: 0.05,
    roughness: 0.9,
    metalness: 0.04,
  });
  const accentMaterial = new MeshStandardMaterial({
    color: accentColor,
    roughness: 0.86,
    metalness: 0.03,
  });
  const eyeMaterial = new MeshStandardMaterial({
    color: 0x151010,
    emissive: 0xe33d2f,
    emissiveIntensity: 0.62,
    roughness: 0.32,
    metalness: 0.12,
  });
  const muzzleMaterial = new MeshStandardMaterial({
    color: muzzleColor,
    roughness: 0.74,
    metalness: 0.04,
  });
  const jointMaterial = new MeshStandardMaterial({
    color: kind === 'duck'
      ? 0x6f4322
      : kind === 'bunny'
        ? 0x5a4d6f
        : 0x3c2f28,
    emissive: kind === 'duck'
      ? 0x170803
      : kind === 'bunny'
        ? 0x10091a
        : 0x0b0806,
    emissiveIntensity: 0.12,
    roughness: 0.42,
    metalness: 0.28,
  });

  const torso = new Mesh(new SphereGeometry(0.54, 18, 16), bodyMaterial);
  torso.scale.set(0.86, 1.32, 0.68);
  torso.position.set(0, 1.08, 0);
  const belly = new Mesh(new SphereGeometry(0.32, 14, 12), accentMaterial);
  belly.scale.set(0.78, 1.12, 0.34);
  belly.position.set(0, 1.04, -0.42);
  const headGroup = new Group();
  headGroup.position.set(0, 2.1, -0.02);
  const head = new Mesh(new SphereGeometry(0.38, 22, 14), bodyMaterial);
  head.scale.set(kind === 'duck' ? detailedDuck ? 1.24 : 1.18 : 1.08, detailedDuck ? 0.76 : 0.72, detailedDuck ? 0.86 : 0.8);
  head.position.set(0, 0, 0);
  const jawline = new Mesh(new SphereGeometry(kind === 'duck' ? 0.34 : 0.28, 18, 10), muzzleMaterial);
  jawline.scale.set(kind === 'duck' ? detailedDuck ? 1.48 : 1.36 : 1.42, detailedDuck ? 0.32 : 0.28, kind === 'duck' ? detailedDuck ? 0.52 : 0.46 : 0.38);
  jawline.position.set(0, -0.2, -0.3);
  const muzzle = new Mesh(
    kind === 'duck'
      ? new SphereGeometry(0.24, 18, 12)
      : new SphereGeometry(0.18, 12, 10),
    muzzleMaterial,
  );
  muzzle.position.set(0, -0.08, -0.32);
  if (kind === 'duck') {
    muzzle.scale.set(detailedDuck ? 1.62 : 1.42, detailedDuck ? 0.46 : 0.42, detailedDuck ? 0.92 : 0.82);
  } else {
    muzzle.scale.set(1.25, 0.78, 0.56);
  }
  headGroup.add(head, jawline, muzzle);
  if (detailedDuck) {
    const facePlateMaterial = new MeshStandardMaterial({
      color: 0xf4d36f,
      emissive: 0x201203,
      emissiveIntensity: 0.08,
      roughness: 0.68,
      metalness: 0.05,
    });
    const blushMaterial = new MeshStandardMaterial({
      color: 0xff8f5f,
      emissive: 0x2a0502,
      emissiveIntensity: 0.12,
      roughness: 0.7,
      metalness: 0.02,
    });
    const seamMaterial = new MeshStandardMaterial({
      color: 0x6f431d,
      emissive: 0x100602,
      emissiveIntensity: 0.1,
      roughness: 0.46,
      metalness: 0.42,
    });
    const nostrilMaterial = new MeshBasicMaterial({ color: 0x100402 });

    const facePlate = new Mesh(new SphereGeometry(0.31, 18, 10), facePlateMaterial);
    facePlate.scale.set(1.36, 0.5, 0.28);
    facePlate.position.set(0, -0.045, -0.365);
    const browBar = new Mesh(new BoxGeometry(0.46, 0.055, 0.035), seamMaterial);
    browBar.position.set(0, 0.15, -0.385);
    browBar.rotation.x = -0.06;
    const centerFaceSeam = new Mesh(new BoxGeometry(0.028, 0.42, 0.026), seamMaterial);
    centerFaceSeam.position.set(0, -0.03, -0.405);
    centerFaceSeam.rotation.x = -0.06;
    [-0.23, 0.23].forEach((side) => {
      const cheek = new Mesh(new SphereGeometry(0.07, 12, 8), blushMaterial);
      cheek.scale.set(1.12, 0.62, 0.28);
      cheek.position.set(side, -0.07, -0.415);
      const eyeRing = new Mesh(new TorusGeometry(0.069, 0.012, 8, 18), seamMaterial);
      eyeRing.position.set(side * 0.62, 0.062, -0.342);
      eyeRing.rotation.x = Math.PI / 2;
      const nostril = new Mesh(new SphereGeometry(0.018, 8, 6), nostrilMaterial);
      nostril.scale.set(1.32, 0.54, 0.5);
      nostril.position.set(side * 0.42, -0.105, -0.55);
      headGroup.add(cheek, eyeRing, nostril);
    });
    [-0.13, 0, 0.13].forEach((offset, index) => {
      const feather = new Mesh(new ConeGeometry(0.055 - index * 0.006, 0.34 - index * 0.035, 10), accentMaterial);
      feather.position.set(offset, 0.41 + index * 0.015, -0.005);
      feather.rotation.set(-0.4, 0, offset * -1.6);
      headGroup.add(feather);
    });
    const beakBridge = new Mesh(new BoxGeometry(0.48, 0.036, 0.035), seamMaterial);
    beakBridge.position.set(0, -0.13, -0.52);
    beakBridge.rotation.x = -0.08;
    headGroup.add(facePlate, browBar, centerFaceSeam, beakBridge);
  }
  let mouthJaw: Group | undefined;
  let mouthBasePosition: Vector3 | undefined;

  [-0.14, 0.14].forEach((eyeX) => {
    const eye = new Mesh(new SphereGeometry(0.045, 10, 10), eyeMaterial);
    eye.position.set(eyeX, 0.06, -0.32);
    headGroup.add(eye);
  });

  if (kind === 'bunny') {
    const uprightEar = createBunnyEar(-1, false, bodyMaterial, accentMaterial, jointMaterial);
    uprightEar.rotation.z = -0.12;
    const danglingEar = createBunnyEar(1, true, bodyMaterial, accentMaterial, jointMaterial);
    danglingEar.rotation.z = 0.1;
    danglingEar.rotation.x = -0.08;
    const mouthCavityMaterial = new MeshStandardMaterial({
      color: 0x050104,
      emissive: 0x120414,
      emissiveIntensity: 0.18,
      roughness: 0.58,
      metalness: 0.02,
    });
    const toothMaterial = new MeshStandardMaterial({
      color: 0xe9dfc8,
      emissive: 0x181006,
      emissiveIntensity: 0.08,
      roughness: 0.5,
      metalness: 0.02,
    });
    const mouthCavity = new Mesh(new BoxGeometry(0.32, 0.06, 0.05), mouthCavityMaterial);
    mouthCavity.position.set(0, -0.17, -0.42);
    const upperJaw = new Mesh(new BoxGeometry(0.36, 0.06, 0.11), muzzleMaterial);
    upperJaw.position.set(0, -0.13, -0.405);
    mouthJaw = new Group();
    mouthJaw.position.set(0, -0.21, -0.41);
    mouthBasePosition = mouthJaw.position.clone();
    const jawGroup = mouthJaw;
    const lowerJaw = new Mesh(new BoxGeometry(0.34, 0.055, 0.095), muzzleMaterial);
    lowerJaw.position.set(0, 0.005, -0.025);
    jawGroup.add(lowerJaw);
    [-0.15, -0.09, -0.03, 0.03, 0.09, 0.15].forEach((toothX) => {
      const upperTooth = new Mesh(new ConeGeometry(0.018, 0.06, 7), toothMaterial);
      upperTooth.position.set(toothX, -0.145, -0.455);
      upperTooth.rotation.x = Math.PI;
      const lowerTooth = new Mesh(new ConeGeometry(0.014, 0.052, 7), toothMaterial);
      lowerTooth.position.set(toothX, 0.032, -0.045);
      lowerTooth.rotation.x = 0.1;
      headGroup.add(upperTooth);
      jawGroup.add(lowerTooth);
    });
    headGroup.add(uprightEar, danglingEar, mouthCavity, upperJaw, jawGroup);
  } else if (kind === 'bear') {
    [-0.26, 0.26].forEach((earX) => {
      const ear = new Mesh(new SphereGeometry(0.14, 12, 10), bodyMaterial);
      ear.position.set(earX, 0.32, 0.04);
      headGroup.add(ear);
    });
    const mouthCavityMaterial = new MeshStandardMaterial({
      color: 0x0b0504,
      emissive: 0x130100,
      emissiveIntensity: 0.18,
      roughness: 0.5,
      metalness: 0.02,
    });
    const mouthCavity = new Mesh(new BoxGeometry(0.25, 0.055, 0.026), mouthCavityMaterial);
    mouthCavity.position.set(0, -0.17, -0.438);
    mouthCavity.rotation.x = -0.04;
    const upperJaw = new Mesh(new BoxGeometry(0.27, 0.064, 0.064), muzzleMaterial);
    upperJaw.position.set(0, -0.12, -0.405);
    upperJaw.rotation.x = -0.04;
    mouthJaw = new Group();
    mouthJaw.position.set(0, -0.205, -0.43);
    mouthBasePosition = mouthJaw.position.clone();
    const jawGroup = mouthJaw;
    const lowerJaw = new Mesh(new BoxGeometry(0.23, 0.064, 0.052), muzzleMaterial);
    lowerJaw.position.set(0, 0, 0);
    const jawShadow = new Mesh(new BoxGeometry(0.2, 0.014, 0.02), mouthCavityMaterial);
    jawShadow.position.set(0, 0.04, -0.018);
    jawGroup.add(lowerJaw, jawShadow);
    headGroup.add(mouthCavity, upperJaw, jawGroup);
  } else {
    const crest = new Mesh(new BoxGeometry(0.12, 0.34, 0.08), accentMaterial);
    crest.position.set(0, 0.36, 0.04);
    crest.rotation.x = -0.32;
    const mouthCavityMaterial = new MeshStandardMaterial({
      color: 0x050100,
      emissive: 0x170300,
      emissiveIntensity: 0.2,
      roughness: 0.58,
      metalness: 0.02,
    });
    const mouthCavity = new Mesh(new SphereGeometry(0.18, 14, 8), mouthCavityMaterial);
    mouthCavity.scale.set(1.55, 0.26, 0.54);
    mouthCavity.position.set(0, -0.155, -0.39);
    const upperBeak = new Mesh(new SphereGeometry(0.2, 18, 10), muzzleMaterial);
    upperBeak.scale.set(1.58, 0.32, 0.78);
    upperBeak.position.set(0, -0.105, -0.392);
    mouthJaw = new Group();
    mouthJaw.position.set(0, -0.19, -0.35);
    mouthBasePosition = mouthJaw.position.clone();
    const jawGroup = mouthJaw;
    const lowerBeak = new Mesh(new SphereGeometry(0.2, 18, 10), muzzleMaterial);
    lowerBeak.scale.set(1.5, 0.33, 0.76);
    lowerBeak.position.set(0, -0.015, -0.06);
    const toothMaterial = new MeshStandardMaterial({
      color: 0xe9dfc8,
      emissive: 0x221407,
      emissiveIntensity: 0.08,
      roughness: 0.48,
      metalness: 0.03,
    });
    [-0.18, -0.11, -0.04, 0.04, 0.11, 0.18].forEach((toothX) => {
      const upperTooth = new Mesh(new ConeGeometry(0.021, 0.068, 8), toothMaterial);
      upperTooth.position.set(toothX, -0.15, -0.455);
      upperTooth.rotation.x = Math.PI;
      const lowerTooth = new Mesh(new ConeGeometry(0.017, 0.056, 8), toothMaterial);
      lowerTooth.position.set(toothX, 0.028, -0.11);
      lowerTooth.rotation.x = 0.1;
      headGroup.add(upperTooth);
      jawGroup.add(lowerTooth);
    });
    jawGroup.add(lowerBeak);
    headGroup.add(crest, mouthCavity, upperBeak, jawGroup);
  }

  const leftArmPose: StageArmPose = includePerformanceProps && kind === 'bunny'
    ? 'guitarNeck'
    : includePerformanceProps && kind === 'bear'
      ? 'drumLeft'
      : 'relaxed';
  const rightArmPose: StageArmPose = includePerformanceProps && kind === 'duck'
    ? 'plate'
    : includePerformanceProps && kind === 'bunny'
      ? 'guitarBody'
      : includePerformanceProps && kind === 'bear'
        ? 'drumRight'
        : 'relaxed';
  const leftArm = createStageJointedArm(-1, leftArmPose, bodyMaterial, jointMaterial, accentMaterial);
  const rightArm = createStageJointedArm(1, rightArmPose, bodyMaterial, jointMaterial, accentMaterial);
  const leftLeg = createStageJointedLeg(-1, bodyMaterial, jointMaterial, accentMaterial);
  const rightLeg = createStageJointedLeg(1, bodyMaterial, jointMaterial, accentMaterial);
  root.add(
    leftArm.root,
    rightArm.root,
    leftLeg.root,
    rightLeg.root,
  );
  if (detailedDuck) {
    const jointTrimMaterial = new MeshStandardMaterial({
      color: 0x9e8f78,
      emissive: 0x15110d,
      emissiveIntensity: 0.12,
      roughness: 0.32,
      metalness: 0.72,
    });
    [
      [-0.47, 1.52, -0.02],
      [0.47, 1.52, -0.02],
      [-0.27, 0.88, 0.02],
      [0.27, 0.88, 0.02],
    ].forEach(([ringX, ringY, ringZ], index) => {
      const ring = new Mesh(new TorusGeometry(index < 2 ? 0.12 : 0.105, 0.012, 8, 18), jointTrimMaterial);
      ring.position.set(ringX, ringY, ringZ);
      ring.rotation.set(Math.PI / 2, 0, index % 2 === 0 ? 0.18 : -0.18);
      root.add(ring);
    });
  }

  const bow = new Mesh(new BoxGeometry(0.34, 0.1, 0.08), muzzleMaterial);
  bow.position.set(0, 1.66, -0.42);
  root.add(torso, belly, headGroup, bow);
  if (detailedDuck) {
    const panelMaterial = new MeshStandardMaterial({
      color: 0xefc45a,
      emissive: 0x1f1002,
      emissiveIntensity: 0.07,
      roughness: 0.7,
      metalness: 0.05,
    });
    const seamMaterial = new MeshStandardMaterial({
      color: 0x6f431d,
      emissive: 0x100602,
      emissiveIntensity: 0.1,
      roughness: 0.48,
      metalness: 0.38,
    });
    const metalTrimMaterial = new MeshStandardMaterial({
      color: 0xb7aea0,
      emissive: 0x15120e,
      emissiveIntensity: 0.12,
      roughness: 0.34,
      metalness: 0.68,
    });
    const chestPlate = new Mesh(new SphereGeometry(0.35, 16, 10), panelMaterial);
    chestPlate.scale.set(0.9, 1.02, 0.18);
    chestPlate.position.set(0, 1.14, -0.475);
    const bellySeam = new Mesh(new BoxGeometry(0.055, 0.72, 0.034), seamMaterial);
    bellySeam.position.set(0, 1.12, -0.565);
    [-0.34, 0.34].forEach((side) => {
      const wingPanel = new Mesh(new SphereGeometry(0.2, 14, 8), panelMaterial);
      wingPanel.scale.set(0.54, 1.35, 0.18);
      wingPanel.position.set(side, 1.08, -0.19);
      wingPanel.rotation.set(0.1, side * 0.5, side * 0.18);
      const wingSeam = new Mesh(new BoxGeometry(0.034, 0.5, 0.028), seamMaterial);
      wingSeam.position.set(side * 1.05, 1.06, -0.34);
      wingSeam.rotation.z = side * 0.08;
      root.add(wingPanel, wingSeam);
    });
    [0.72, 1.48].forEach((height) => {
      const ring = new Mesh(new TorusGeometry(0.155, 0.011, 8, 20), metalTrimMaterial);
      ring.scale.x = 1.35;
      ring.position.set(0, height, -0.475);
      ring.rotation.x = Math.PI / 2;
      root.add(ring);
    });
    root.add(chestPlate, bellySeam);
  }
  let propGroup: Group | undefined;
  let drumSticks: StageAnimatronicRefs['drumSticks'];

  if (kind === 'bunny') {
    propGroup = new Group();
    const guitarBodyMaterial = new MeshStandardMaterial({
      color: 0x2e6db0,
      emissive: 0x06162d,
      emissiveIntensity: 0.18,
      roughness: 0.42,
      metalness: 0.18,
    });
    const guitarNeckMaterial = new MeshStandardMaterial({
      color: 0x4b3325,
      roughness: 0.64,
      metalness: 0.04,
    });
    const fretboardMaterial = new MeshStandardMaterial({
      color: 0x21140f,
      roughness: 0.58,
      metalness: 0.04,
    });
    const guitarMetalMaterial = new MeshStandardMaterial({
      color: 0xd6dde6,
      emissive: 0x1d252c,
      emissiveIntensity: 0.08,
      roughness: 0.22,
      metalness: 0.68,
    });
    const guitarStringMaterial = new MeshStandardMaterial({
      color: 0xf4f8ff,
      roughness: 0.2,
      metalness: 0.82,
    });
    const guitarKnobMaterial = new MeshStandardMaterial({
      color: 0x10141c,
      roughness: 0.32,
      metalness: 0.38,
    });
    const guitarBody = new Mesh(new SphereGeometry(0.28, 16, 12), guitarBodyMaterial);
    guitarBody.scale.set(1.28, 0.86, 0.28);
    guitarBody.position.set(0.08, 1.02, -0.58);
    guitarBody.rotation.z = -0.2;
    const upperHorn = new Mesh(new SphereGeometry(0.14, 12, 10), guitarBodyMaterial);
    upperHorn.scale.set(1.1, 0.62, 0.26);
    upperHorn.position.set(-0.14, 1.2, -0.59);
    upperHorn.rotation.z = -0.7;
    const lowerHorn = new Mesh(new SphereGeometry(0.16, 12, 10), guitarBodyMaterial);
    lowerHorn.scale.set(1.18, 0.72, 0.26);
    lowerHorn.position.set(0.24, 0.9, -0.59);
    lowerHorn.rotation.z = -0.24;

    const neckStart = new Vector3(-0.06, 1.13, -0.62);
    const neckEnd = new Vector3(-1, 1.48, -0.62);
    const guitarNeck = createBoxSegment(neckStart, neckEnd, 0.13, 0.08, guitarNeckMaterial);
    const fretboard = createBoxSegment(
      new Vector3(-0.08, 1.14, -0.69),
      new Vector3(-0.96, 1.47, -0.69),
      0.086,
      0.024,
      fretboardMaterial,
    );
    const guitarHead = createBoxSegment(
      new Vector3(-0.96, 1.47, -0.62),
      new Vector3(-1.18, 1.56, -0.62),
      0.25,
      0.09,
      guitarNeckMaterial,
    );
    const neckDirection = neckEnd.clone().sub(neckStart);
    const neckAcross = new Vector3(-neckDirection.y, neckDirection.x, 0).normalize();
    [0.18, 0.3, 0.42, 0.55, 0.68, 0.8].forEach((amount) => {
      const fretCenter = neckStart.clone().lerp(neckEnd, amount);
      fretCenter.z = -0.715;
      propGroup?.add(createBoxSegment(
        fretCenter.clone().addScaledVector(neckAcross, 0.055),
        fretCenter.clone().addScaledVector(neckAcross, -0.055),
        0.01,
        0.016,
        guitarMetalMaterial,
      ));
    });

    const bridge = new Mesh(new BoxGeometry(0.34, 0.055, 0.032), guitarMetalMaterial);
    bridge.position.set(0.18, 1.01, -0.7);
    bridge.rotation.z = -0.18;
    const pickup = new Mesh(new BoxGeometry(0.3, 0.07, 0.03), guitarMetalMaterial);
    pickup.position.set(0.02, 1.08, -0.7);
    pickup.rotation.z = -0.18;
    const pickupTwo = new Mesh(new BoxGeometry(0.25, 0.06, 0.03), guitarKnobMaterial);
    pickupTwo.position.set(-0.14, 1.12, -0.7);
    pickupTwo.rotation.z = -0.18;
    [0.25, 0.35].forEach((knobX, index) => {
      const knob = new Mesh(new CylinderGeometry(0.034, 0.034, 0.026, 12), guitarKnobMaterial);
      knob.position.set(knobX, 0.93 - index * 0.07, -0.71);
      knob.rotation.x = Math.PI / 2;
      propGroup?.add(knob);
    });
    propGroup.add(createLimbSegment(
      new Vector3(0.25, 0.97, -0.72),
      new Vector3(0.43, 0.86, -0.76),
      0.009,
      guitarMetalMaterial,
      8,
    ));

    [-0.045, -0.015, 0.015, 0.045].forEach((stringOffset) => {
      const stringStart = new Vector3(0.24, 1.02 + stringOffset, -0.735);
      const stringEnd = neckEnd.clone().addScaledVector(neckAcross, stringOffset * 1.2);
      stringEnd.z = -0.735;
      propGroup?.add(createLimbSegment(stringStart, stringEnd, 0.0055, guitarStringMaterial, 6));
    });

    [-0.07, 0.07].forEach((pegOffset) => {
      const leftPeg = new Mesh(new CylinderGeometry(0.018, 0.018, 0.13, 8), guitarMetalMaterial);
      leftPeg.position.set(-1.1, 1.58 + pegOffset, -0.62);
      leftPeg.rotation.z = Math.PI / 2;
      const rightPeg = new Mesh(new CylinderGeometry(0.018, 0.018, 0.13, 8), guitarMetalMaterial);
      rightPeg.position.set(-1.03, 1.47 + pegOffset, -0.62);
      rightPeg.rotation.z = Math.PI / 2;
      propGroup?.add(leftPeg, rightPeg);
    });
    propGroup.add(
      guitarBody,
      upperHorn,
      lowerHorn,
      guitarNeck,
      fretboard,
      guitarHead,
      bridge,
      pickup,
      pickupTwo,
    );
    if (includePerformanceProps) {
      root.add(propGroup);
    }
    if (includeNamePlate) {
      root.add(createAnimatronicNamePlate('Fluffle', 'the Bunny', '#c7bfd4', 0x211a2c));
    }
  } else if (kind === 'bear') {
    const hatMaterial = new MeshStandardMaterial({
      color: 0x111216,
      roughness: 0.34,
      metalness: 0.22,
    });
    const hatBandMaterial = new MeshStandardMaterial({
      color: 0xb12d2a,
      emissive: 0x3b0505,
      emissiveIntensity: 0.12,
      roughness: 0.5,
      metalness: 0.08,
    });
    const hatBrim = new Mesh(new CylinderGeometry(0.31, 0.34, 0.08, 22), hatMaterial);
    hatBrim.position.set(0, 2.46, -0.02);
    const hatTop = new Mesh(new CylinderGeometry(0.22, 0.24, 0.38, 20), hatMaterial);
    hatTop.position.set(0, 2.67, -0.02);
    const hatBand = new Mesh(new CylinderGeometry(0.225, 0.245, 0.06, 20), hatBandMaterial);
    hatBand.position.set(0, 2.54, -0.02);
    root.add(hatBrim, hatTop, hatBand);
    if (includePerformanceProps) {
      propGroup = new Group();
      const drumShellMaterial = new MeshStandardMaterial({
        color: 0x712b21,
        emissive: 0x210503,
        emissiveIntensity: 0.1,
        roughness: 0.44,
        metalness: 0.24,
      });
      const drumHeadMaterial = new MeshStandardMaterial({
        color: 0xd9d4c5,
        emissive: 0x18130d,
        emissiveIntensity: 0.08,
        roughness: 0.62,
        metalness: 0.08,
      });
      const cymbalMaterial = new MeshStandardMaterial({
        color: 0xb99036,
        emissive: 0x2c1b04,
        emissiveIntensity: 0.16,
        roughness: 0.28,
        metalness: 0.72,
      });
      const drumStandMaterial = new MeshStandardMaterial({
        color: 0xc6ccd1,
        emissive: 0x171b1e,
        emissiveIntensity: 0.06,
        roughness: 0.22,
        metalness: 0.76,
      });
      const drumStickMaterial = new MeshStandardMaterial({
        color: 0xd7a64d,
        roughness: 0.55,
        metalness: 0.03,
      });

      const kickDrum = new Mesh(new CylinderGeometry(0.38, 0.38, 0.3, 28), drumShellMaterial);
      kickDrum.position.set(0, 0.72, -0.9);
      kickDrum.rotation.x = Math.PI / 2;
      const kickHead = new Mesh(new CylinderGeometry(0.32, 0.32, 0.026, 24), drumHeadMaterial);
      kickHead.position.set(0, 0.72, -1.06);
      kickHead.rotation.x = Math.PI / 2;
      const snare = new Mesh(new CylinderGeometry(0.2, 0.22, 0.17, 22), drumHeadMaterial);
      snare.position.set(-0.42, 0.92, -0.68);
      snare.rotation.z = -0.12;
      const leftTom = new Mesh(new CylinderGeometry(0.18, 0.2, 0.18, 22), drumShellMaterial);
      leftTom.position.set(-0.2, 1.04, -0.78);
      leftTom.rotation.z = -0.16;
      const rightTom = new Mesh(new CylinderGeometry(0.18, 0.2, 0.18, 22), drumShellMaterial);
      rightTom.position.set(0.22, 1.04, -0.78);
      rightTom.rotation.z = 0.16;
      const floorTom = new Mesh(new CylinderGeometry(0.24, 0.26, 0.28, 24), drumShellMaterial);
      floorTom.position.set(0.54, 0.84, -0.68);
      const leftCymbal = new Mesh(new CylinderGeometry(0.26, 0.28, 0.025, 28), cymbalMaterial);
      leftCymbal.position.set(-0.58, 1.22, -0.76);
      leftCymbal.rotation.set(0.18, 0, -0.18);
      const rightCymbal = new Mesh(new CylinderGeometry(0.28, 0.3, 0.025, 28), cymbalMaterial);
      rightCymbal.position.set(0.62, 1.28, -0.78);
      rightCymbal.rotation.set(0.16, 0, 0.2);
      propGroup.add(
        kickDrum,
        kickHead,
        snare,
        leftTom,
        rightTom,
        floorTom,
        leftCymbal,
        rightCymbal,
        createLimbSegment(new Vector3(-0.58, 0.72, -0.76), new Vector3(-0.58, 1.2, -0.76), 0.018, drumStandMaterial, 8),
        createLimbSegment(new Vector3(0.62, 0.72, -0.78), new Vector3(0.62, 1.26, -0.78), 0.018, drumStandMaterial, 8),
        createLimbSegment(new Vector3(-0.42, 0.72, -0.68), new Vector3(-0.42, 0.91, -0.68), 0.018, drumStandMaterial, 8),
        createLimbSegment(new Vector3(0.54, 0.56, -0.68), new Vector3(0.54, 0.82, -0.68), 0.018, drumStandMaterial, 8),
      );

      const createDrumStick = (position: Vector3, rotation: Vector3, end: Vector3): StageDrumStickRefs => {
        const stickRoot = new Group();
        stickRoot.position.copy(position);
        stickRoot.rotation.set(rotation.x, rotation.y, rotation.z);
        stickRoot.add(createLimbSegment(new Vector3(0, 0, 0), end, 0.018, drumStickMaterial, 8));
        return {
          root: stickRoot,
          basePosition: position.clone(),
          baseRotation: rotation.clone(),
        };
      };
      drumSticks = {
        left: createDrumStick(new Vector3(-0.28, 1.14, -0.54), new Vector3(-0.42, 0.04, -0.18), new Vector3(-0.08, -0.1, -0.42)),
        right: createDrumStick(new Vector3(0.28, 1.14, -0.54), new Vector3(-0.42, -0.04, 0.18), new Vector3(0.08, -0.1, -0.42)),
      };
      root.add(propGroup, drumSticks.left.root, drumSticks.right.root);
    }
    if (includeNamePlate) {
      root.add(createAnimatronicNamePlate('Bori', 'the Bear', '#b0825a', 0x231713));
    }
  } else {
    const bib = createDuckBib();
    root.add(bib);
    if (detailedDuck) {
      const bibTrimMaterial = new MeshStandardMaterial({
        color: 0x5bc0f0,
        emissive: 0x062434,
        emissiveIntensity: 0.16,
        roughness: 0.5,
        metalness: 0.06,
      });
      [-0.19, 0.19].forEach((xOffset) => {
        const bibButton = new Mesh(new SphereGeometry(0.035, 10, 8), bibTrimMaterial);
        bibButton.scale.set(1, 0.5, 1);
        bibButton.position.set(xOffset, 1.33, -0.626);
        root.add(bibButton);
      });
      const bibBottomStripe = new Mesh(new BoxGeometry(0.34, 0.026, 0.025), bibTrimMaterial);
      bibBottomStripe.position.set(0, 0.99, -0.626);
      bibBottomStripe.rotation.y = Math.PI;
      root.add(bibBottomStripe);
    }
    if (includePerformanceProps) {
      const plateMaterial = new MeshStandardMaterial({
        color: 0xf6f0df,
        roughness: 0.58,
        metalness: 0.04,
      });
      const cupcakeWrapperMaterial = new MeshStandardMaterial({
        color: 0xb9433b,
        roughness: 0.62,
        metalness: 0.04,
      });
      const frostingMaterial = new MeshStandardMaterial({
        color: 0xffd7e8,
        emissive: 0x3d0d20,
        emissiveIntensity: 0.08,
        roughness: 0.7,
        metalness: 0.02,
      });
      const plate = new Mesh(new CylinderGeometry(0.22, 0.25, 0.04, 24), plateMaterial);
      plate.position.set(0.62, 1.14, -0.62);
      const cupcake = new Mesh(new CylinderGeometry(0.1, 0.12, 0.16, 16), cupcakeWrapperMaterial);
      cupcake.position.set(0.62, 1.24, -0.62);
      const frosting = new Mesh(new SphereGeometry(0.11, 12, 10), frostingMaterial);
      frosting.scale.set(1, 0.58, 1);
      frosting.position.set(0.62, 1.34, -0.62);
      const candle = new Mesh(new CylinderGeometry(0.012, 0.012, 0.18, 8), accentMaterial);
      candle.position.set(0.62, 1.46, -0.62);
      root.add(plate, cupcake, frosting, candle);
    }
  }

  return {
    kind,
    root,
    head: headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    propGroup,
    mouth: mouthJaw,
    mouthBasePosition,
    drumSticks,
    homePosition: new Vector3(x, y, z),
    homeRotationY: Math.PI,
  };
}

export function createOfficeJumpscareStageModel(animatronic: 'quacky' | 'fluffle' | 'bori' | 'foxy'): OfficeJumpscareStageModel {
  const root = new Group();
  const modelScale = animatronic === 'foxy' ? 0.44 : 0.5;
  const modelYOffset = animatronic === 'foxy' ? -0.53 : -0.38;
  const scaledRoot = new Group();
  scaledRoot.scale.setScalar(modelScale);
  scaledRoot.position.y = modelYOffset;
  root.add(scaledRoot);

  let head: Group;
  let jaw: Group;
  let leftArm: Group;
  let rightArm: Group;
  let leftArmJoint: Group;
  let rightArmJoint: Group;
  let leftLeg: Group;
  let rightLeg: Group;
  let leftLegJoint: Group;
  let rightLegJoint: Group;

  if (animatronic === 'foxy') {
    const foxStage = createFoxPirateStage(0, 0);
    const parts = foxStage.userData.foxyParts as {
      foxRoot: Group;
      head: Group;
      leftArm: StageLimbRefs;
      rightArm: StageLimbRefs;
      leftLeg: StageLimbRefs;
      rightLeg: StageLimbRefs;
    };
    parts.foxRoot.parent?.remove(parts.foxRoot);
    parts.foxRoot.position.set(0, 0, 0);
    parts.foxRoot.rotation.set(0, Math.PI, 0);
    scaledRoot.add(parts.foxRoot);
    head = parts.head;
    jaw = new Group();
    head.add(jaw);
    jaw.position.set(0, -0.2, -0.47);
    const foxyJawMaterial = new MeshStandardMaterial({
      color: 0xd8b07a,
      emissive: 0x241004,
      emissiveIntensity: 0.08,
      roughness: 0.72,
      metalness: 0.04,
    });
    const foxyMouthMaterial = new MeshBasicMaterial({ color: 0x050000 });
    const foxyToothMaterial = new MeshStandardMaterial({
      color: 0xe9dfc8,
      emissive: 0x181006,
      emissiveIntensity: 0.08,
      roughness: 0.5,
      metalness: 0.02,
    });
    const foxyLowerJaw = new Mesh(new BoxGeometry(0.26, 0.075, 0.17), foxyJawMaterial);
    foxyLowerJaw.position.set(0, -0.02, -0.06);
    const foxyUpperJaw = new Mesh(new BoxGeometry(0.28, 0.07, 0.15), foxyJawMaterial);
    foxyUpperJaw.position.set(0, -0.13, -0.49);
    const foxyMouthDark = new Mesh(new BoxGeometry(0.22, 0.03, 0.035), foxyMouthMaterial);
    foxyMouthDark.position.set(0, 0.02, -0.15);
    [-0.13, -0.065, 0, 0.065, 0.13].forEach((toothX) => {
      const upperTooth = new Mesh(new ConeGeometry(0.015, 0.06, 7), foxyToothMaterial);
      upperTooth.position.set(toothX, -0.05, -0.18);
      upperTooth.rotation.x = Math.PI;
      const lowerTooth = new Mesh(new ConeGeometry(0.012, 0.048, 7), foxyToothMaterial);
      lowerTooth.position.set(toothX, 0.025, -0.07);
      lowerTooth.rotation.x = 0.1;
      head.add(upperTooth);
      jaw.add(lowerTooth);
    });
    head.add(foxyUpperJaw);
    jaw.add(foxyLowerJaw, foxyMouthDark);
    leftArm = parts.leftArm.root;
    rightArm = parts.rightArm.root;
    leftArmJoint = parts.leftArm.joint;
    rightArmJoint = parts.rightArm.joint;
    leftLeg = parts.leftLeg.root;
    rightLeg = parts.rightLeg.root;
    leftLegJoint = parts.leftLeg.joint;
    rightLegJoint = parts.rightLeg.joint;
  } else {
    const kind = animatronic === 'quacky'
      ? 'duck'
      : animatronic === 'fluffle'
        ? 'bunny'
        : 'bear';
    const stageModel = createStageAnimatronic(kind, 0, 0, 0, false, false);
    scaledRoot.add(stageModel.root);
    head = stageModel.head;
    jaw = stageModel.mouth ?? new Group();
    if (!stageModel.mouth) {
      head.add(jaw);
    }
    leftArm = stageModel.leftArm.root;
    rightArm = stageModel.rightArm.root;
    const leftArmJoint = stageModel.leftArm.joint;
    const rightArmJoint = stageModel.rightArm.joint;
    const leftLeg = stageModel.leftLeg.root;
    const rightLeg = stageModel.rightLeg.root;
    const leftLegJoint = stageModel.leftLeg.joint;
    const rightLegJoint = stageModel.rightLeg.joint;

    const smile = new Group();
    smile.visible = false;
    head.add(smile);
    if (animatronic === 'quacky') {
      const lowerBeakMaterial = new MeshStandardMaterial({
        color: 0xd18432,
        emissive: 0x170803,
        emissiveIntensity: 0.08,
        roughness: 0.72,
        metalness: 0.04,
      });
      const mouthDarkMaterial = new MeshBasicMaterial({ color: 0x050000 });
      const toothMaterial = new MeshStandardMaterial({
        color: 0xe9dfc8,
        emissive: 0x221407,
        emissiveIntensity: 0.08,
        roughness: 0.48,
        metalness: 0.03,
      });
      const metalJawMaterial = new MeshStandardMaterial({
        color: 0xa8a494,
        emissive: 0x151410,
        emissiveIntensity: 0.18,
        roughness: 0.38,
        metalness: 0.68,
      });
      jaw.clear();
      jaw.position.set(0, -0.15, -0.34);
      const mouthCavity = new Mesh(new SphereGeometry(0.2, 16, 10), mouthDarkMaterial);
      mouthCavity.scale.set(1.72, 0.42, 0.74);
      mouthCavity.position.set(0, -0.035, -0.18);
      head.add(mouthCavity);
      const lowerBeak = new Mesh(new SphereGeometry(0.24, 18, 12), lowerBeakMaterial);
      lowerBeak.scale.set(1.62, 0.35, 0.86);
      lowerBeak.position.set(0, -0.025, -0.13);
      jaw.add(lowerBeak);
      [-0.18, -0.11, -0.04, 0.04, 0.11, 0.18].forEach((toothX) => {
        const upperTooth = new Mesh(new ConeGeometry(0.025, 0.08, 8), toothMaterial);
        upperTooth.position.set(toothX, -0.15, -0.47);
        upperTooth.rotation.x = Math.PI;
        const lowerTooth = new Mesh(new ConeGeometry(0.022, 0.07, 8), toothMaterial);
        lowerTooth.position.set(toothX, 0.03, -0.12);
        lowerTooth.rotation.x = 0.1;
        head.add(upperTooth);
        jaw.add(lowerTooth);
      });
      const innerJaw = new Group();
      innerJaw.name = 'quacky-inner-jaw';
      innerJaw.position.set(0, -0.015, -0.26);
      const innerUpperPivot = new Group();
      innerUpperPivot.name = 'quacky-inner-upper-jaw';
      innerUpperPivot.position.set(0, 0.035, 0);
      const innerLowerPivot = new Group();
      innerLowerPivot.name = 'quacky-inner-lower-jaw';
      innerLowerPivot.position.set(0, -0.035, 0.005);
      const innerUpper = new Mesh(new BoxGeometry(0.28, 0.035, 0.09), lowerBeakMaterial);
      innerUpper.position.set(0, 0.02, 0);
      const innerLower = new Mesh(new BoxGeometry(0.26, 0.03, 0.08), lowerBeakMaterial);
      innerLower.position.set(0, -0.02, 0);
      [-0.09, -0.03, 0.03, 0.09].forEach((toothX) => {
        const upperTooth = new Mesh(new ConeGeometry(0.014, 0.048, 7), toothMaterial);
        upperTooth.position.set(toothX, -0.004, -0.045);
        upperTooth.rotation.x = Math.PI;
        const lowerTooth = new Mesh(new ConeGeometry(0.012, 0.04, 7), toothMaterial);
        lowerTooth.position.set(toothX, -0.014, -0.04);
        innerUpperPivot.add(innerUpper, upperTooth);
        innerLowerPivot.add(innerLower, lowerTooth);
      });
      innerJaw.add(innerUpperPivot, innerLowerPivot);
      const tinyMetalJaw = new Group();
      tinyMetalJaw.name = 'quacky-tiny-metal-jaw';
      tinyMetalJaw.position.set(0, -0.012, -0.34);
      const metalUpperPivot = new Group();
      metalUpperPivot.name = 'quacky-metal-upper-jaw';
      metalUpperPivot.position.set(0, 0.03, 0);
      const metalLowerPivot = new Group();
      metalLowerPivot.name = 'quacky-metal-lower-jaw';
      metalLowerPivot.position.set(0, -0.03, 0.004);
      const metalUpper = new Mesh(new BoxGeometry(0.16, 0.024, 0.06), metalJawMaterial);
      metalUpper.position.set(0, 0.012, 0);
      const metalLower = new Mesh(new BoxGeometry(0.15, 0.022, 0.055), metalJawMaterial);
      metalLower.position.set(0, -0.012, 0);
      [-0.045, 0, 0.045].forEach((toothX) => {
        const upperMetalTooth = new Mesh(new ConeGeometry(0.01, 0.038, 6), metalJawMaterial);
        upperMetalTooth.position.set(toothX, -0.004, -0.033);
        upperMetalTooth.rotation.x = Math.PI;
        const lowerMetalTooth = new Mesh(new ConeGeometry(0.009, 0.032, 6), metalJawMaterial);
        lowerMetalTooth.position.set(toothX, -0.01, -0.03);
        metalUpperPivot.add(metalUpper, upperMetalTooth);
        metalLowerPivot.add(metalLower, lowerMetalTooth);
      });
      tinyMetalJaw.add(metalUpperPivot, metalLowerPivot);
      head.add(innerJaw, tinyMetalJaw);
    }
    if (animatronic === 'fluffle') {
      const lowerJawMaterial = new MeshStandardMaterial({
        color: 0xc7bfd4,
        emissive: 0x130d1a,
        emissiveIntensity: 0.08,
        roughness: 0.74,
        metalness: 0.04,
      });
      const mouthMaterial = new MeshBasicMaterial({ color: 0x050000 });
      const toothMaterial = new MeshStandardMaterial({
        color: 0xe9dfc8,
        emissive: 0x181006,
        emissiveIntensity: 0.08,
        roughness: 0.5,
        metalness: 0.02,
      });
      jaw.clear();
      jaw.position.set(0, -0.18, -0.42);
      const upperJaw = new Mesh(new BoxGeometry(0.28, 0.064, 0.095), lowerJawMaterial);
      upperJaw.position.set(0, -0.115, -0.505);
      const lowerJaw = new Mesh(new BoxGeometry(0.26, 0.07, 0.1), lowerJawMaterial);
      lowerJaw.position.set(0, -0.01, -0.04);
      const mouthDark = new Mesh(new BoxGeometry(0.22, 0.028, 0.032), mouthMaterial);
      mouthDark.position.set(0, 0.02, -0.098);
      [-0.13, -0.065, 0, 0.065, 0.13].forEach((toothX) => {
        const upperTooth = new Mesh(new ConeGeometry(0.015, 0.06, 7), toothMaterial);
        upperTooth.position.set(toothX, -0.045, -0.18);
        upperTooth.rotation.x = Math.PI;
        const lowerTooth = new Mesh(new ConeGeometry(0.012, 0.048, 7), toothMaterial);
        lowerTooth.position.set(toothX, 0.03, -0.06);
        lowerTooth.rotation.x = 0.1;
        head.add(upperTooth);
        jaw.add(lowerTooth);
      });
      head.add(upperJaw);
      jaw.add(lowerJaw, mouthDark);
    }
    if (animatronic === 'bori') {
      const mouthMaterial = new MeshBasicMaterial({ color: 0x050000 });
      const smileCenter = new Mesh(new BoxGeometry(0.3, 0.028, 0.024), mouthMaterial);
      smileCenter.position.set(0, -0.105, -0.562);
      const smileLeft = new Mesh(new BoxGeometry(0.13, 0.026, 0.024), mouthMaterial);
      smileLeft.position.set(-0.17, -0.085, -0.562);
      smileLeft.rotation.z = 0.56;
      const smileRight = new Mesh(new BoxGeometry(0.13, 0.026, 0.024), mouthMaterial);
      smileRight.position.set(0.17, -0.085, -0.562);
      smileRight.rotation.z = -0.56;
      smile.add(smileCenter, smileLeft, smileRight);
    }

    root.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (material instanceof MeshStandardMaterial && material.emissive.getHex() === 0xe33d2f) {
          material.userData.officeCutsceneEye = true;
        }
      });
    });

    return {
      root,
      head,
      jaw,
      smile,
      leftArm,
      rightArm,
      leftArmJoint,
      rightArmJoint,
      leftLeg,
      rightLeg,
      leftLegJoint,
      rightLegJoint,
    };
  }

  const smile = new Group();
  smile.visible = false;
  head.add(smile);

  root.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material instanceof MeshStandardMaterial && material.emissive.getHex() === 0xe33d2f) {
        material.userData.officeCutsceneEye = true;
      }
    });
  });

  return {
    root,
    head,
    jaw,
    smile,
    leftArm,
    rightArm,
    leftArmJoint,
    rightArmJoint,
    leftLeg,
    rightLeg,
    leftLegJoint,
    rightLegJoint,
  };
}

export function createOfficeChapter(options: OfficeChapterOptions = {}): OfficeChapterData {
  const abandonedStraightHalls = options.abandonedStraightHalls ?? false;
  const materials = createLevelMaterials();
  materials.wall.color.setHex(0xbac1c8);
  materials.floor.color.setHex(0xcfd4d8);
  materials.ceiling.color.setHex(0xdfe5eb);
  materials.prop.color.setHex(0x73543d);
  materials.metal.color.setHex(0x8c98a4);
  materials.accent.color.setHex(0xeff5fa);
  materials.accent.emissive.setHex(0xe6f5ff);
  materials.accent.emissiveIntensity = 0.78;

  const deskMaterial = new MeshStandardMaterial({
    color: 0x7f6044,
    roughness: 0.72,
    metalness: 0.06,
  });
  const chairMaterial = new MeshStandardMaterial({
    color: 0x414b55,
    roughness: 0.8,
    metalness: 0.14,
  });
  const screenMaterial = new MeshStandardMaterial({
    color: 0x1f2833,
    emissive: 0x4a86d9,
    emissiveIntensity: 0.58,
    roughness: 0.38,
    metalness: 0.14,
  });
  const paperMaterial = new MeshStandardMaterial({
    color: 0xf3eee5,
    roughness: 0.92,
    metalness: 0,
  });
  const doorMaterial = new MeshStandardMaterial({
    color: 0xb8c1c5,
    emissive: 0x111719,
    emissiveIntensity: 0.08,
    roughness: 0.34,
    metalness: 0.58,
  });
  const panelMaterial = new MeshStandardMaterial({
    color: 0xe3e8ee,
    roughness: 0.42,
    metalness: 0.34,
  });
  const redButtonMaterial = new MeshStandardMaterial({
    color: 0xbd3027,
    emissive: 0x711711,
    emissiveIntensity: 0.46,
    roughness: 0.34,
    metalness: 0.16,
  });
  const whiteButtonMaterial = new MeshStandardMaterial({
    color: 0xf4f8fb,
    emissive: 0xa8c7d8,
    emissiveIntensity: 0.26,
    roughness: 0.24,
    metalness: 0.14,
  });

  const root = new Group();
  const colliders: CollisionBox[] = [];
  const vineMaterial = new MeshStandardMaterial({
    color: 0x2f5932,
    roughness: 0.92,
    metalness: 0,
  });
  const vineLeafMaterial = new MeshStandardMaterial({
    color: 0x466f35,
    roughness: 0.88,
    metalness: 0,
    side: DoubleSide,
  });
  const vineFlowerMaterial = new MeshStandardMaterial({
    color: 0xf0d7ff,
    emissive: 0x3a153f,
    emissiveIntensity: 0.18,
    roughness: 0.72,
    metalness: 0,
    side: DoubleSide,
  });
  const vineFlowerCenterMaterial = new MeshStandardMaterial({
    color: 0xf2d45d,
    emissive: 0x4a3604,
    emissiveIntensity: 0.2,
    roughness: 0.64,
    metalness: 0,
  });
  const addHallVine = (points: Vector3[], leafRotationY = 0): void => {
    if (points.length < 2) {
      return;
    }

    const vine = new Mesh(new TubeGeometry(new CatmullRomCurve3(points), 18, 0.035, 6, false), vineMaterial);
    root.add(vine);

    points.slice(1, -1).forEach((point, index) => {
      const leaf = new Mesh(new PlaneGeometry(0.34, 0.2), vineLeafMaterial);
      leaf.position.copy(point);
      leaf.rotation.y = leafRotationY;
      leaf.rotation.z = (index % 2 === 0 ? 0.55 : -0.48) + Math.sin(point.x + point.z) * 0.12;
      leaf.scale.setScalar(0.82 + (index % 3) * 0.12);
      root.add(leaf);

      if (index % 2 === 0) {
        const flowerRoot = new Group();
        flowerRoot.position.copy(point).add(new Vector3(0, 0.05, 0.018 * (leafRotationY === 0 ? 1 : -1)));
        flowerRoot.rotation.y = leafRotationY;
        for (let petalIndex = 0; petalIndex < 5; petalIndex += 1) {
          const petal = new Mesh(new PlaneGeometry(0.11, 0.055), vineFlowerMaterial);
          petal.position.set(Math.cos(petalIndex / 5 * Math.PI * 2) * 0.055, Math.sin(petalIndex / 5 * Math.PI * 2) * 0.055, 0);
          petal.rotation.z = petalIndex / 5 * Math.PI * 2;
          flowerRoot.add(petal);
        }
        const flowerCenter = new Mesh(new SphereGeometry(0.028, 8, 6), vineFlowerCenterMaterial);
        flowerRoot.add(flowerCenter);
        root.add(flowerRoot);
      }
    });
  };
  const floor: FloorDefinition = {
    width: OFFICE_WIDTH,
    depth: OFFICE_DEPTH,
    center: [OFFICE_CENTER_X, OFFICE_CENTER_Z],
    ceilingHeight: WALL_HEIGHT,
  };
  root.add(createFloor(floor, materials));

  const halfWidth = OFFICE_WIDTH / 2;
  const halfDepth = OFFICE_DEPTH / 2;
  const shiftedDoorZ = OFFICE_CENTER_Z + DOOR_Z_SHIFT;
  const openingMinZ = shiftedDoorZ - SIDE_HALL_WIDTH / 2;
  const openingMaxZ = shiftedDoorZ + SIDE_HALL_WIDTH / 2;
  const roomMinZ = OFFICE_CENTER_Z - halfDepth;
  const roomMaxZ = OFFICE_CENTER_Z + halfDepth;
  const upperWindowGapToDoor = 0.22;
  const upperWindowMaxZ = openingMinZ - upperWindowGapToDoor;
  const upperWindowMinZ = upperWindowMaxZ - OFFICE_WINDOW_DEPTH;
  const upperWindowCenterZ = (upperWindowMinZ + upperWindowMaxZ) / 2;
  const upperWindowLeadDepth = upperWindowMinZ - roomMinZ;
  const upperWindowGapCenterZ = upperWindowMaxZ + upperWindowGapToDoor / 2;
  const upperWindowUpperHeight = WALL_HEIGHT - OFFICE_WINDOW_SILL_HEIGHT - OFFICE_WINDOW_HEIGHT;
  const upperWindowFillY = OFFICE_WINDOW_SILL_HEIGHT + OFFICE_WINDOW_HEIGHT / 2;
  const hallWindowGapPadding = 0.06;
  const hallWindowGapMinZ = upperWindowMinZ - hallWindowGapPadding;
  const hallWindowGapMaxZ = upperWindowMaxZ + hallWindowGapPadding;
  const hallWindowGapDepth = hallWindowGapMaxZ - hallWindowGapMinZ;
  const hallWindowGapCenterZ = (hallWindowGapMinZ + hallWindowGapMaxZ) / 2;
  const lowerSideWallDepth = roomMaxZ - openingMaxZ;
  const lowerSideWallCenterZ = openingMaxZ + lowerSideWallDepth / 2;
  const buttonPanelZ = Math.min(roomMaxZ - 0.72, openingMaxZ + 0.86);
  const westWallX = OFFICE_CENTER_X - halfWidth + WALL_THICKNESS / 2;
  const eastWallX = OFFICE_CENTER_X + halfWidth - WALL_THICKNESS / 2;
  const walls: WallDefinition[] = [
    {
      position: [OFFICE_CENTER_X, WALL_HEIGHT / 2, OFFICE_CENTER_Z - halfDepth + WALL_THICKNESS / 2],
      size: [OFFICE_WIDTH, WALL_HEIGHT, WALL_THICKNESS],
    },
    {
      position: [OFFICE_CENTER_X, WALL_HEIGHT / 2, OFFICE_CENTER_Z + halfDepth - WALL_THICKNESS / 2],
      size: [OFFICE_WIDTH, WALL_HEIGHT, WALL_THICKNESS],
    },
    {
      position: [westWallX, WALL_HEIGHT / 2, roomMinZ + upperWindowLeadDepth / 2],
      size: [WALL_THICKNESS, WALL_HEIGHT, upperWindowLeadDepth],
    },
    {
      position: [westWallX, OFFICE_WINDOW_SILL_HEIGHT / 2, upperWindowCenterZ],
      size: [WALL_THICKNESS, OFFICE_WINDOW_SILL_HEIGHT, OFFICE_WINDOW_DEPTH],
    },
    {
      position: [westWallX, WALL_HEIGHT - upperWindowUpperHeight / 2, upperWindowCenterZ],
      size: [WALL_THICKNESS, upperWindowUpperHeight, OFFICE_WINDOW_DEPTH],
    },
    {
      position: [westWallX, WALL_HEIGHT / 2, upperWindowGapCenterZ],
      size: [WALL_THICKNESS, WALL_HEIGHT, upperWindowGapToDoor],
    },
    {
      position: [westWallX, WALL_HEIGHT / 2, lowerSideWallCenterZ],
      size: [WALL_THICKNESS, WALL_HEIGHT, lowerSideWallDepth],
    },
    {
      position: [eastWallX, WALL_HEIGHT / 2, roomMinZ + upperWindowLeadDepth / 2],
      size: [WALL_THICKNESS, WALL_HEIGHT, upperWindowLeadDepth],
    },
    {
      position: [eastWallX, OFFICE_WINDOW_SILL_HEIGHT / 2, upperWindowCenterZ],
      size: [WALL_THICKNESS, OFFICE_WINDOW_SILL_HEIGHT, OFFICE_WINDOW_DEPTH],
    },
    {
      position: [eastWallX, WALL_HEIGHT - upperWindowUpperHeight / 2, upperWindowCenterZ],
      size: [WALL_THICKNESS, upperWindowUpperHeight, OFFICE_WINDOW_DEPTH],
    },
    {
      position: [eastWallX, WALL_HEIGHT / 2, upperWindowGapCenterZ],
      size: [WALL_THICKNESS, WALL_HEIGHT, upperWindowGapToDoor],
    },
    {
      position: [eastWallX, WALL_HEIGHT / 2, lowerSideWallCenterZ],
      size: [WALL_THICKNESS, WALL_HEIGHT, lowerSideWallDepth],
    },
  ];
  if (!OFFICE_SIDE_WINDOWS_VISIBLE) {
    walls.push(
      {
        position: [westWallX, upperWindowFillY, upperWindowCenterZ],
        size: [WALL_THICKNESS, OFFICE_WINDOW_HEIGHT, OFFICE_WINDOW_DEPTH],
      },
      {
        position: [eastWallX, upperWindowFillY, upperWindowCenterZ],
        size: [WALL_THICKNESS, OFFICE_WINDOW_HEIGHT, OFFICE_WINDOW_DEPTH],
      },
    );
  }
  const wallResult = createWalls(walls, materials);
  root.add(wallResult.root);
  colliders.push(...wallResult.colliders);

  const sideHallStraightLength = abandonedStraightHalls
    ? ABANDONED_SIDE_HALL_STRAIGHT_LENGTH
    : SIDE_HALL_STRAIGHT_LENGTH;
  const sideHallWidth = abandonedStraightHalls ? ABANDONED_SIDE_HALL_WIDTH : SIDE_HALL_WIDTH;
  const northExtensionDepth = SIDE_HALL_TURN_LENGTH - sideHallWidth;
  const leftStraightCenterX = westWallX - sideHallStraightLength / 2 + WALL_THICKNESS / 2;
  const rightStraightCenterX = eastWallX + sideHallStraightLength / 2 - WALL_THICKNESS / 2;
  const northTurnCenterZ = shiftedDoorZ - northExtensionDepth / 2;
  const leftTurnCenterX = westWallX - sideHallStraightLength + sideHallWidth / 2;
  const rightTurnCenterX = eastWallX + sideHallStraightLength - sideHallWidth / 2;
  const northTurnMinZ = northTurnCenterZ - SIDE_HALL_TURN_LENGTH / 2;
  const turnWallSouthZ = shiftedDoorZ - sideHallWidth / 2;
  const innerHallWallNorthDepth = Math.max(0, hallWindowGapMinZ - northTurnMinZ);
  const innerHallWallNorthCenterZ = northTurnMinZ + innerHallWallNorthDepth / 2;
  const innerHallWallSouthDepth = Math.max(0, turnWallSouthZ - hallWindowGapMaxZ);
  const innerHallWallSouthCenterZ = hallWindowGapMaxZ + innerHallWallSouthDepth / 2;
  const storageClosetDepth = 5.1;
  const storageClosetWidth = 4.8;
  const storageClosetDoorWidth = 2.18;
  const originalStorageClosetDoorCenterZ = 153.15;
  const originalStorageClosetEastX = OFFICE_CENTER_X - PARTY_STAGE_WIDTH / 2 - 2.25 - 3.4 / 2;
  const storageClosetDoorCenterX = abandonedStraightHalls
    ? westWallX - Math.min(5.45, sideHallStraightLength - 3.1)
    : originalStorageClosetEastX;
  const storageClosetDoorMinX = storageClosetDoorCenterX - storageClosetDoorWidth / 2;
  const storageClosetDoorMaxX = storageClosetDoorCenterX + storageClosetDoorWidth / 2;
  const storageClosetDoorCenterZ = abandonedStraightHalls
    ? shiftedDoorZ + sideHallWidth / 2
    : originalStorageClosetDoorCenterZ;
  const storageClosetDoorMinZ = storageClosetDoorCenterZ - storageClosetDoorWidth / 2;
  const storageClosetDoorMaxZ = storageClosetDoorCenterZ + storageClosetDoorWidth / 2;
  const storageClosetNorthZ = abandonedStraightHalls
    ? storageClosetDoorCenterZ
    : originalStorageClosetDoorCenterZ - storageClosetWidth / 2;
  const storageClosetSouthZ = abandonedStraightHalls
    ? storageClosetNorthZ + storageClosetDepth
    : originalStorageClosetDoorCenterZ + storageClosetWidth / 2;
  const storageClosetCenterZ = abandonedStraightHalls
    ? (storageClosetNorthZ + storageClosetSouthZ) / 2
    : originalStorageClosetDoorCenterZ;
  const storageClosetMinZ = storageClosetNorthZ;
  const storageClosetMaxZ = storageClosetSouthZ;
  const storageClosetMinX = abandonedStraightHalls
    ? storageClosetDoorCenterX - storageClosetWidth / 2
    : originalStorageClosetEastX - storageClosetDepth;
  const storageClosetMaxX = abandonedStraightHalls
    ? storageClosetDoorCenterX + storageClosetWidth / 2
    : originalStorageClosetEastX;
  const storageClosetCenterX = (storageClosetMinX + storageClosetMaxX) / 2;
  const storageClosetWestX = storageClosetMinX;

  const hallFloors = [
    {
      width: sideHallStraightLength,
      depth: sideHallWidth,
      center: [leftStraightCenterX, shiftedDoorZ] as [number, number],
    },
    {
      width: sideHallStraightLength,
      depth: sideHallWidth,
      center: [rightStraightCenterX, shiftedDoorZ] as [number, number],
    },
  ];
  if (!abandonedStraightHalls) {
    hallFloors.push(
      {
        width: sideHallWidth,
        depth: SIDE_HALL_TURN_LENGTH,
        center: [leftTurnCenterX, northTurnCenterZ] as [number, number],
      },
      {
        width: sideHallWidth,
        depth: SIDE_HALL_TURN_LENGTH,
        center: [rightTurnCenterX, northTurnCenterZ] as [number, number],
      },
    );
  }
  hallFloors.forEach((hallFloor) => {
    root.add(createFloor({
      width: hallFloor.width,
      depth: hallFloor.depth,
      center: hallFloor.center,
      ceilingHeight: WALL_HEIGHT,
    }, materials));
  });

  const hallWalls: WallDefinition[] = abandonedStraightHalls
    ? [
      {
        position: [leftStraightCenterX, WALL_HEIGHT / 2, shiftedDoorZ - sideHallWidth / 2 + WALL_THICKNESS / 2],
        size: [sideHallStraightLength, WALL_HEIGHT, WALL_THICKNESS],
      },
      {
        position: [westWallX - sideHallStraightLength + WALL_THICKNESS / 2, WALL_HEIGHT / 2, shiftedDoorZ],
        size: [WALL_THICKNESS, WALL_HEIGHT, sideHallWidth],
      },
      {
        position: [rightStraightCenterX, WALL_HEIGHT / 2, shiftedDoorZ - sideHallWidth / 2 + WALL_THICKNESS / 2],
        size: [sideHallStraightLength, WALL_HEIGHT, WALL_THICKNESS],
      },
      {
        position: [rightStraightCenterX, WALL_HEIGHT / 2, shiftedDoorZ + sideHallWidth / 2 - WALL_THICKNESS / 2],
        size: [sideHallStraightLength, WALL_HEIGHT, WALL_THICKNESS],
      },
      {
        position: [eastWallX + sideHallStraightLength - WALL_THICKNESS / 2, WALL_HEIGHT / 2, shiftedDoorZ],
        size: [WALL_THICKNESS, WALL_HEIGHT, sideHallWidth],
      },
    ]
    : [
      {
        position: [westWallX - (sideHallStraightLength - sideHallWidth) / 2, WALL_HEIGHT / 2, shiftedDoorZ - sideHallWidth / 2 + WALL_THICKNESS / 2],
        size: [sideHallStraightLength - sideHallWidth, WALL_HEIGHT, WALL_THICKNESS],
      },
      {
        position: [leftStraightCenterX, WALL_HEIGHT / 2, shiftedDoorZ + sideHallWidth / 2 - WALL_THICKNESS / 2],
        size: [sideHallStraightLength, WALL_HEIGHT, WALL_THICKNESS],
      },
      {
        position: [leftTurnCenterX - sideHallWidth / 2 + WALL_THICKNESS / 2, WALL_HEIGHT / 2, northTurnCenterZ],
        size: [WALL_THICKNESS, WALL_HEIGHT, SIDE_HALL_TURN_LENGTH],
      },
      {
        position: [eastWallX + (sideHallStraightLength - sideHallWidth) / 2, WALL_HEIGHT / 2, shiftedDoorZ - sideHallWidth / 2 + WALL_THICKNESS / 2],
        size: [sideHallStraightLength - sideHallWidth, WALL_HEIGHT, WALL_THICKNESS],
      },
      {
        position: [rightStraightCenterX, WALL_HEIGHT / 2, shiftedDoorZ + sideHallWidth / 2 - WALL_THICKNESS / 2],
        size: [sideHallStraightLength, WALL_HEIGHT, WALL_THICKNESS],
      },
      {
        position: [rightTurnCenterX + sideHallWidth / 2 - WALL_THICKNESS / 2, WALL_HEIGHT / 2, northTurnCenterZ],
        size: [WALL_THICKNESS, WALL_HEIGHT, SIDE_HALL_TURN_LENGTH],
      },
    ];
  if (abandonedStraightHalls) {
    ([
      [westWallX - sideHallStraightLength, storageClosetDoorMinX],
      [storageClosetDoorMaxX, westWallX],
    ] as Array<[number, number]>).forEach(([startX, endX]) => {
      const width = endX - startX;
      if (width <= 0.24) {
        return;
      }

      hallWalls.push({
        position: [startX + width / 2, WALL_HEIGHT / 2, shiftedDoorZ + sideHallWidth / 2 - WALL_THICKNESS / 2],
        size: [width, WALL_HEIGHT, WALL_THICKNESS],
      });
    });
    hallWalls.push(
      {
        position: [storageClosetCenterX, WALL_HEIGHT / 2, storageClosetSouthZ - WALL_THICKNESS / 2],
        size: [storageClosetWidth, WALL_HEIGHT, WALL_THICKNESS],
      },
      {
        position: [storageClosetMinX + WALL_THICKNESS / 2, WALL_HEIGHT / 2, storageClosetCenterZ],
        size: [WALL_THICKNESS, WALL_HEIGHT, storageClosetDepth],
      },
      {
        position: [storageClosetMaxX - WALL_THICKNESS / 2, WALL_HEIGHT / 2, storageClosetCenterZ],
        size: [WALL_THICKNESS, WALL_HEIGHT, storageClosetDepth],
      },
    );
  }

  if (!abandonedStraightHalls && innerHallWallNorthDepth > 0.05) {
    hallWalls.push({
      position: [leftTurnCenterX + sideHallWidth / 2 - WALL_THICKNESS / 2, WALL_HEIGHT / 2, innerHallWallNorthCenterZ],
      size: [WALL_THICKNESS, WALL_HEIGHT, innerHallWallNorthDepth],
    });
    hallWalls.push({
      position: [rightTurnCenterX - sideHallWidth / 2 + WALL_THICKNESS / 2, WALL_HEIGHT / 2, innerHallWallNorthCenterZ],
      size: [WALL_THICKNESS, WALL_HEIGHT, innerHallWallNorthDepth],
    });
  }

  if (!abandonedStraightHalls && innerHallWallSouthDepth > 0.05) {
    hallWalls.push({
      position: [leftTurnCenterX + sideHallWidth / 2 - WALL_THICKNESS / 2, WALL_HEIGHT / 2, innerHallWallSouthCenterZ],
      size: [WALL_THICKNESS, WALL_HEIGHT, innerHallWallSouthDepth],
    });
    hallWalls.push({
      position: [rightTurnCenterX - sideHallWidth / 2 + WALL_THICKNESS / 2, WALL_HEIGHT / 2, innerHallWallSouthCenterZ],
      size: [WALL_THICKNESS, WALL_HEIGHT, innerHallWallSouthDepth],
    });
  }
  if (!abandonedStraightHalls && !OFFICE_SIDE_WINDOWS_VISIBLE) {
    hallWalls.push({
      position: [leftTurnCenterX + sideHallWidth / 2 - WALL_THICKNESS / 2, WALL_HEIGHT / 2, hallWindowGapCenterZ],
      size: [WALL_THICKNESS, WALL_HEIGHT, hallWindowGapDepth],
    });
    hallWalls.push({
      position: [rightTurnCenterX - sideHallWidth / 2 + WALL_THICKNESS / 2, WALL_HEIGHT / 2, hallWindowGapCenterZ],
      size: [WALL_THICKNESS, WALL_HEIGHT, hallWindowGapDepth],
    });
  }
  const hallWallResult = createWalls(hallWalls, materials);
  root.add(hallWallResult.root);
  colliders.push(...hallWallResult.colliders);

  if (abandonedStraightHalls) {
    const hallNorthWallZ = shiftedDoorZ - sideHallWidth / 2 + WALL_THICKNESS + 0.035;
    const hallSouthWallZ = shiftedDoorZ + sideHallWidth / 2 - WALL_THICKNESS - 0.035;
    const leftHallStartX = westWallX - 1.15;
    const leftHallEndX = westWallX - sideHallStraightLength + 0.55;
    const rightHallStartX = eastWallX + 1.15;
    const rightHallEndX = eastWallX + sideHallStraightLength - 0.55;
    addHallVine([
      new Vector3(leftHallStartX, 3.46, hallNorthWallZ),
      new Vector3(leftHallStartX - 4.8, 2.82, hallNorthWallZ),
      new Vector3(leftHallStartX - 10.6, 3.12, hallNorthWallZ),
      new Vector3(leftHallStartX - 18.4, 2.5, hallNorthWallZ),
      new Vector3(leftHallEndX, 2.18, hallNorthWallZ),
    ]);
    addHallVine([
      new Vector3(leftHallStartX - 0.45, 1.1, hallSouthWallZ),
      new Vector3(storageClosetDoorMaxX + 0.82, 1.92, hallSouthWallZ),
      new Vector3(storageClosetDoorMaxX + 0.28, 1.42, hallSouthWallZ),
    ], Math.PI);
    addHallVine([
      new Vector3(storageClosetDoorMinX - 0.32, 2.16, hallSouthWallZ),
      new Vector3(storageClosetDoorMinX - 4.6, 1.42, hallSouthWallZ),
      new Vector3(leftHallEndX + 0.2, 2.72, hallSouthWallZ),
    ], Math.PI);
    addHallVine([
      new Vector3(rightHallStartX, 3.34, hallNorthWallZ),
      new Vector3(rightHallStartX + 4.7, 2.42, hallNorthWallZ),
      new Vector3(rightHallStartX + 10.55, 2.96, hallNorthWallZ),
      new Vector3(rightHallStartX + 18.2, 2.35, hallNorthWallZ),
      new Vector3(rightHallEndX, 1.86, hallNorthWallZ),
    ]);
    addHallVine([
      new Vector3(rightHallStartX + 0.4, 1.32, hallSouthWallZ),
      new Vector3(rightHallStartX + 5.3, 2.08, hallSouthWallZ),
      new Vector3(rightHallStartX + 12.7, 1.56, hallSouthWallZ),
      new Vector3(rightHallStartX + 20.6, 2.12, hallSouthWallZ),
      new Vector3(rightHallEndX - 0.18, 2.68, hallSouthWallZ),
    ], Math.PI);
  }

  const partyRoomCenterX = OFFICE_CENTER_X;
  const partyRoomSouthZ = northTurnMinZ;
  const partyRoomCenterZ = partyRoomSouthZ - PARTY_ROOM_DEPTH / 2;
  const partyRoomNorthZ = partyRoomSouthZ - PARTY_ROOM_DEPTH;
  const partyRoomMinX = partyRoomCenterX - PARTY_ROOM_WIDTH / 2;
  const partyRoomMaxX = partyRoomCenterX + PARTY_ROOM_WIDTH / 2;
  const secondHallCenterZ = partyRoomNorthZ + 5.15;
  const secondHallOpeningMinZ = secondHallCenterZ - SECOND_PARTY_HALL_WIDTH / 2;
  const secondHallOpeningMaxZ = secondHallCenterZ + SECOND_PARTY_HALL_WIDTH / 2;
  const secondHallCenterX = partyRoomMaxX + SECOND_PARTY_HALL_LENGTH / 2;
  const secondRoomMinX = partyRoomMaxX + SECOND_PARTY_HALL_LENGTH;
  const secondRoomCenterX = secondRoomMinX + SECOND_PARTY_ROOM_WIDTH / 2;
  const secondRoomMaxX = secondRoomMinX + SECOND_PARTY_ROOM_WIDTH;
  const secondRoomCenterZ = secondHallCenterZ;
  const secondRoomMinZ = secondRoomCenterZ - SECOND_PARTY_ROOM_DEPTH / 2;
  const secondRoomMaxZ = secondRoomCenterZ + SECOND_PARTY_ROOM_DEPTH / 2;
  const backstageHallWidth = 3.4;
  const backstageHallLength = 8.1;
  const backstageStorageWidth = 12.2;
  const backstageStorageDepth = 6.2;
  const backstageHallCenterX = partyRoomCenterX - PARTY_STAGE_WIDTH / 2 - 2.25;
  const backstageHallMinX = backstageHallCenterX - backstageHallWidth / 2;
  const backstageHallMaxX = backstageHallCenterX + backstageHallWidth / 2;
  const backstageHallSouthZ = partyRoomNorthZ;
  const backstageHallNorthZ = backstageHallSouthZ - backstageHallLength;
  const backstageHallCenterZ = (backstageHallSouthZ + backstageHallNorthZ) / 2;
  const backstageHallExtensionLength = abandonedStraightHalls ? 0 : 3.6;
  const backstageHallExtensionNorthZ = backstageHallNorthZ - backstageHallExtensionLength;
  const backstageHallExtensionCenterZ = backstageHallNorthZ - backstageHallExtensionLength / 2;
  const employeeOnlyDoorCenterX = -251.9;
  const employeeOnlyDoorCenterZ = 148.45;
  const employeeOnlyDoorWidth = 2.35;
  const employeeOnlyDoorMinZ = employeeOnlyDoorCenterZ - employeeOnlyDoorWidth / 2;
  const employeeOnlyDoorMaxZ = employeeOnlyDoorCenterZ + employeeOnlyDoorWidth / 2;
  const employeeRoomMaxX = employeeOnlyDoorCenterX - WALL_THICKNESS / 2;
  const employeeRoomWidth = 7.1;
  const employeeRoomMinX = employeeRoomMaxX - employeeRoomWidth;
  const employeeRoomMinZ = 143.45;
  const employeeRoomMaxZ = 150.55;
  const employeeRoomCenterX = (employeeRoomMinX + employeeRoomMaxX) / 2;
  const employeeRoomCenterZ = (employeeRoomMinZ + employeeRoomMaxZ) / 2;
  const employeeRoomDepth = employeeRoomMaxZ - employeeRoomMinZ;
  const employeeElevatorPlatformSize = 2.55;
  const employeeElevatorCenterX = employeeRoomCenterX - 0.48;
  const employeeElevatorCenterZ = employeeRoomCenterZ;
  const employeeElevatorBasementFloorY = -7.25;
  const employeeElevatorBasementRoomWidth = employeeRoomWidth;
  const employeeElevatorBasementRoomDepth = employeeRoomDepth;
  const backstageStorageMinX = backstageHallMaxX;
  const backstageStorageMaxX = backstageStorageMinX + backstageStorageWidth;
  const backstageStorageMinZ = backstageHallNorthZ;
  const backstageStorageMaxZ = backstageHallNorthZ + backstageStorageDepth;
  const backstageStorageCenterX = (backstageStorageMinX + backstageStorageMaxX) / 2;
  const backstageStorageCenterZ = (backstageStorageMinZ + backstageStorageMaxZ) / 2;
  const backstageStorageDoorWidth = 2.45;
  const backstageStorageDoorCenterZ = backstageStorageCenterZ;
  const backstageStorageDoorMinZ = backstageStorageDoorCenterZ - backstageStorageDoorWidth / 2;
  const backstageStorageDoorMaxZ = backstageStorageDoorCenterZ + backstageStorageDoorWidth / 2;
  const bathroomHallWidth = 5.3;
  const bathroomHallLength = 5.8;
  const bathroomRoomWidth = 8.8;
  const bathroomRoomDepth = 7.1;
  const bathroomEntryCenterZ = partyRoomCenterZ - 6;
  const bathroomEntryMinZ = bathroomEntryCenterZ - bathroomHallWidth / 2;
  const bathroomEntryMaxZ = bathroomEntryCenterZ + bathroomHallWidth / 2;
  const bathroomHallMaxX = partyRoomMinX;
  const bathroomHallMinX = bathroomHallMaxX - bathroomHallLength;
  const bathroomHallCenterX = (bathroomHallMinX + bathroomHallMaxX) / 2;
  const bathroomRoomMaxX = bathroomHallMinX + 0.78;
  const bathroomRoomMinX = bathroomRoomMaxX - bathroomRoomWidth;
  const bathroomRoomCenterX = (bathroomRoomMinX + bathroomRoomMaxX) / 2;
  const menBathroomCenterZ = bathroomEntryMinZ - bathroomRoomDepth / 2;
  const womenBathroomCenterZ = bathroomEntryMaxZ + bathroomRoomDepth / 2;
  const northPartyHallCenterX = -224.95;
  const northPartyHallWidth = 5.7;
  const northPartyHallLength = 18;
  const northPartyHallOpeningMinX = northPartyHallCenterX - northPartyHallWidth / 2;
  const northPartyHallOpeningMaxX = northPartyHallCenterX + northPartyHallWidth / 2;
  const northPartyHallSouthZ = partyRoomNorthZ;
  const northPartyHallNorthZ = northPartyHallSouthZ - northPartyHallLength;
  const northPartyHallCenterZ = (northPartyHallNorthZ + northPartyHallSouthZ) / 2;
  const kitchenDoorCenterZ = 141.67;
  const kitchenDoorWidth = 4.4;
  const kitchenDoorMinZ = kitchenDoorCenterZ - kitchenDoorWidth / 2;
  const kitchenDoorMaxZ = kitchenDoorCenterZ + kitchenDoorWidth / 2;
  const kitchenDepth = 18.6;
  const kitchenWidth = 15.4;
  const kitchenEastX = northPartyHallOpeningMinX;
  const kitchenWestX = kitchenEastX - kitchenDepth;
  const kitchenCenterX = (kitchenWestX + kitchenEastX) / 2;
  const kitchenCenterZ = kitchenDoorCenterZ;
  const kitchenMinZ = kitchenCenterZ - kitchenWidth / 2;
  const kitchenMaxZ = kitchenCenterZ + kitchenWidth / 2;
  const northPartySideRoomDoorCenterZ = 141.21;
  const northPartySideRoomDoorWidth = 3.25;
  const northPartySideRoomDoorMinZ = northPartySideRoomDoorCenterZ - northPartySideRoomDoorWidth / 2;
  const northPartySideRoomDoorMaxZ = northPartySideRoomDoorCenterZ + northPartySideRoomDoorWidth / 2;
  const northPartySideRoomWidth = 22.4;
  const northPartySideRoomDepth = 16.8;
  const northPartySideRoomMinX = northPartyHallOpeningMaxX;
  const northPartySideRoomCenterX = northPartySideRoomMinX + northPartySideRoomWidth / 2;
  const northPartySideRoomMaxX = northPartySideRoomMinX + northPartySideRoomWidth;
  const northPartySideRoomCenterZ = northPartySideRoomDoorCenterZ;
  const northPartySideRoomMinZ = northPartySideRoomCenterZ - northPartySideRoomDepth / 2;
  const northPartySideRoomMaxZ = northPartySideRoomCenterZ + northPartySideRoomDepth / 2;
  root.add(createFloor({
    width: PARTY_ROOM_WIDTH,
    depth: PARTY_ROOM_DEPTH,
    center: [partyRoomCenterX, partyRoomCenterZ],
    ceilingHeight: WALL_HEIGHT,
  }, materials));

  const leftHallOpeningMinX = leftTurnCenterX - PARTY_ROOM_HALL_OPENING_WIDTH / 2;
  const leftHallOpeningMaxX = leftTurnCenterX + PARTY_ROOM_HALL_OPENING_WIDTH / 2;
  const rightHallOpeningMinX = rightTurnCenterX - PARTY_ROOM_HALL_OPENING_WIDTH / 2;
  const rightHallOpeningMaxX = rightTurnCenterX + PARTY_ROOM_HALL_OPENING_WIDTH / 2;
  const partyRoomWalls: WallDefinition[] = [];
  ([
    [partyRoomNorthZ, bathroomEntryMinZ],
    [bathroomEntryMaxZ, partyRoomSouthZ],
  ] as Array<[number, number]>).forEach(([startZ, endZ]) => {
    const depth = endZ - startZ;
    if (depth <= 0.24) {
      return;
    }

    partyRoomWalls.push({
      position: [partyRoomMinX + WALL_THICKNESS / 2, WALL_HEIGHT / 2, startZ + depth / 2],
      size: [WALL_THICKNESS, WALL_HEIGHT, depth],
    });
  });
  ([
    [partyRoomMinX, backstageHallMinX],
    [backstageHallMaxX, northPartyHallOpeningMinX],
    [northPartyHallOpeningMaxX, partyRoomMaxX],
  ] as Array<[number, number]>).forEach(([startX, endX]) => {
    const width = endX - startX;
    if (width <= 0.24) {
      return;
    }

    partyRoomWalls.push({
      position: [startX + width / 2, WALL_HEIGHT / 2, partyRoomNorthZ + WALL_THICKNESS / 2],
      size: [width, WALL_HEIGHT, WALL_THICKNESS],
    });
  });
  ([
    [partyRoomNorthZ, secondHallOpeningMinZ],
    [secondHallOpeningMaxZ, partyRoomSouthZ],
  ] as Array<[number, number]>).forEach(([startZ, endZ]) => {
    const depth = endZ - startZ;
    if (depth <= 0.24) {
      return;
    }

    partyRoomWalls.push({
      position: [partyRoomMaxX - WALL_THICKNESS / 2, WALL_HEIGHT / 2, startZ + depth / 2],
      size: [WALL_THICKNESS, WALL_HEIGHT, depth],
    });
  });
  const partySouthWallSegments: Array<[number, number]> = abandonedStraightHalls
    ? [[partyRoomMinX, partyRoomMaxX]]
    : [
      [partyRoomMinX, leftHallOpeningMinX],
      [leftHallOpeningMaxX, rightHallOpeningMinX],
      [rightHallOpeningMaxX, partyRoomMaxX],
    ];
  partySouthWallSegments.forEach(([startX, endX]) => {
    const width = endX - startX;
    if (width <= 0.24) {
      return;
    }

    partyRoomWalls.push({
      position: [startX + width / 2, WALL_HEIGHT / 2, partyRoomSouthZ - WALL_THICKNESS / 2],
      size: [width, WALL_HEIGHT, WALL_THICKNESS],
    });
  });

  const partyWallResult = createWalls(partyRoomWalls, materials);
  root.add(partyWallResult.root);
  colliders.push(...partyWallResult.colliders);

  root.add(createFloor({
    width: northPartyHallWidth,
    depth: northPartyHallLength,
    center: [northPartyHallCenterX, northPartyHallCenterZ],
    ceilingHeight: WALL_HEIGHT,
  }, materials));
  root.add(createFloor({
    width: kitchenDepth,
    depth: kitchenWidth,
    center: [kitchenCenterX, kitchenCenterZ],
    ceilingHeight: WALL_HEIGHT,
  }, materials));
  root.add(createFloor({
    width: northPartySideRoomWidth,
    depth: northPartySideRoomDepth,
    center: [northPartySideRoomCenterX, northPartySideRoomCenterZ],
    ceilingHeight: BALL_PIT_ROOM_HEIGHT,
  }, materials));

  const northPartyHallWalls: WallDefinition[] = [
    {
      position: [northPartyHallCenterX, WALL_HEIGHT / 2, northPartyHallNorthZ + WALL_THICKNESS / 2],
      size: [northPartyHallWidth, WALL_HEIGHT, WALL_THICKNESS],
    },
    {
      position: [kitchenWestX + WALL_THICKNESS / 2, WALL_HEIGHT / 2, kitchenCenterZ],
      size: [WALL_THICKNESS, WALL_HEIGHT, kitchenWidth],
    },
    {
      position: [kitchenCenterX, WALL_HEIGHT / 2, kitchenMinZ + WALL_THICKNESS / 2],
      size: [kitchenDepth, WALL_HEIGHT, WALL_THICKNESS],
    },
    {
      position: [kitchenCenterX, WALL_HEIGHT / 2, kitchenMaxZ - WALL_THICKNESS / 2],
      size: [kitchenDepth, WALL_HEIGHT, WALL_THICKNESS],
    },
    {
      position: [northPartySideRoomMaxX - WALL_THICKNESS / 2, BALL_PIT_ROOM_HEIGHT / 2, northPartySideRoomCenterZ],
      size: [WALL_THICKNESS, BALL_PIT_ROOM_HEIGHT, northPartySideRoomDepth],
    },
    {
      position: [northPartySideRoomCenterX, BALL_PIT_ROOM_HEIGHT / 2, northPartySideRoomMinZ + WALL_THICKNESS / 2],
      size: [northPartySideRoomWidth, BALL_PIT_ROOM_HEIGHT, WALL_THICKNESS],
    },
    {
      position: [northPartySideRoomCenterX, BALL_PIT_ROOM_HEIGHT / 2, northPartySideRoomMaxZ - WALL_THICKNESS / 2],
      size: [northPartySideRoomWidth, BALL_PIT_ROOM_HEIGHT, WALL_THICKNESS],
    },
    {
      position: [
        northPartySideRoomMinX + WALL_THICKNESS / 2,
        BALL_PIT_ROOM_HEIGHT / 2,
        (northPartySideRoomMinZ + northPartySideRoomDoorMinZ) / 2,
      ],
      size: [WALL_THICKNESS, BALL_PIT_ROOM_HEIGHT, northPartySideRoomDoorMinZ - northPartySideRoomMinZ],
    },
  ];
  ([
    [kitchenMinZ, northPartyHallNorthZ],
    [northPartyHallNorthZ, kitchenDoorMinZ],
    [kitchenDoorMaxZ, northPartyHallSouthZ],
  ] as Array<[number, number]>).forEach(([startZ, endZ]) => {
    const depth = endZ - startZ;
    if (depth <= 0.24) {
      return;
    }

    northPartyHallWalls.push({
      position: [northPartyHallOpeningMinX + WALL_THICKNESS / 2, WALL_HEIGHT / 2, startZ + depth / 2],
      size: [WALL_THICKNESS, WALL_HEIGHT, depth],
    });
  });
  ([
    [northPartyHallNorthZ, northPartySideRoomDoorMinZ],
    [northPartySideRoomDoorMaxZ, northPartyHallSouthZ],
  ] as Array<[number, number]>).forEach(([startZ, endZ]) => {
    const pushWestWallSegment = (segmentStartZ: number, segmentEndZ: number, height: number): void => {
      const depth = segmentEndZ - segmentStartZ;
      if (depth <= 0.24) {
        return;
      }

      northPartyHallWalls.push({
        position: [northPartyHallOpeningMaxX - WALL_THICKNESS / 2, height / 2, segmentStartZ + depth / 2],
        size: [WALL_THICKNESS, height, depth],
      });
    };

    const tallStartZ = Math.max(startZ, northPartySideRoomMinZ);
    const tallEndZ = Math.min(endZ, northPartySideRoomMaxZ);
    let cursorZ = startZ;
    if (tallEndZ > tallStartZ) {
      pushWestWallSegment(cursorZ, tallStartZ, WALL_HEIGHT);
      pushWestWallSegment(tallStartZ, tallEndZ, BALL_PIT_ROOM_HEIGHT);
      cursorZ = tallEndZ;
    }
    pushWestWallSegment(cursorZ, endZ, WALL_HEIGHT);
  });
  const northPartyHallWallResult = createWalls(northPartyHallWalls, materials);
  root.add(northPartyHallWallResult.root);
  colliders.push(...northPartyHallWallResult.colliders);

  [northPartyHallSouthZ - 4.8, northPartyHallSouthZ - 12.4].forEach((z) => {
    const fixture = new Mesh(new BoxGeometry(0.92, 0.1, 0.36), panelMaterial);
    fixture.position.set(northPartyHallCenterX, WALL_HEIGHT - 0.16, z);
    const glow = new PointLight(0xffd9ad, 0.72, 10, 1.7);
    glow.position.set(northPartyHallCenterX, WALL_HEIGHT - 0.72, z);
    root.add(fixture, glow);
  });
  const sideRoomFixture = new Mesh(new BoxGeometry(1.08, 0.1, 0.42), panelMaterial);
  sideRoomFixture.position.set(northPartySideRoomCenterX, BALL_PIT_ROOM_HEIGHT - 0.16, northPartySideRoomCenterZ);
  const sideRoomGlow = new PointLight(0xffd0a0, 1.05, 16, 1.7);
  sideRoomGlow.position.set(northPartySideRoomCenterX, BALL_PIT_ROOM_HEIGHT - 0.88, northPartySideRoomCenterZ);
  const highDoorwayCoverHeight = BALL_PIT_ROOM_HEIGHT - WALL_HEIGHT;
  root.add(sideRoomFixture, sideRoomGlow);
  if (highDoorwayCoverHeight > 0.05) {
    const highDoorwayCover = new Mesh(
      new BoxGeometry(WALL_THICKNESS, highDoorwayCoverHeight, northPartySideRoomDoorWidth),
      materials.wall,
    );
    highDoorwayCover.position.set(
      northPartySideRoomMinX + WALL_THICKNESS / 2,
      WALL_HEIGHT + highDoorwayCoverHeight / 2,
      northPartySideRoomDoorCenterZ,
    );
    root.add(highDoorwayCover);
  }
  const ballPit = createBallPit(-207.85, 141.2, 11.1, 15.7);
  root.add(ballPit.root);
  const ballPitSlide = createBallPitHalfPipeSlide(-220.31, 136.33, ballPit);

  root.add(
    createFloor({
      width: backstageHallWidth,
      depth: backstageHallLength,
      center: [backstageHallCenterX, backstageHallCenterZ],
      ceilingHeight: WALL_HEIGHT,
    }, materials),
    createFloor({
      width: backstageStorageWidth,
      depth: backstageStorageDepth,
      center: [backstageStorageCenterX, backstageStorageCenterZ],
      ceilingHeight: WALL_HEIGHT,
    }, materials),
    createFloor({
      width: abandonedStraightHalls ? storageClosetWidth : storageClosetDepth,
      depth: abandonedStraightHalls ? storageClosetDepth : storageClosetWidth,
      center: [storageClosetCenterX, storageClosetCenterZ],
      ceilingHeight: WALL_HEIGHT,
    }, materials),
    createFloor({
      width: bathroomHallLength,
      depth: bathroomHallWidth,
      center: [bathroomHallCenterX, bathroomEntryCenterZ],
      ceilingHeight: WALL_HEIGHT,
    }, materials),
    createFloor({
      width: bathroomRoomWidth,
      depth: bathroomRoomDepth,
      center: [bathroomRoomCenterX, womenBathroomCenterZ],
      ceilingHeight: WALL_HEIGHT,
    }, materials),
    createFloor({
      width: bathroomRoomWidth,
      depth: bathroomRoomDepth,
      center: [bathroomRoomCenterX, menBathroomCenterZ],
      ceilingHeight: WALL_HEIGHT,
    }, materials),
  );
  if (backstageHallExtensionLength > 0.05) {
    root.add(createFloor({
      width: backstageHallWidth,
      depth: backstageHallExtensionLength,
      center: [backstageHallCenterX, backstageHallExtensionCenterZ],
      ceilingHeight: WALL_HEIGHT,
    }, materials));
  }
  if (!abandonedStraightHalls) {
    const employeeRoomFloor = new Group();
    const elevatorOpeningSize = employeeElevatorPlatformSize + 0.62;
    const openingMinX = employeeElevatorCenterX - elevatorOpeningSize / 2;
    const openingMaxX = employeeElevatorCenterX + elevatorOpeningSize / 2;
    const openingMinZ = employeeElevatorCenterZ - elevatorOpeningSize / 2;
    const openingMaxZ = employeeElevatorCenterZ + elevatorOpeningSize / 2;
    const addEmployeeFloorSegment = (
      minX: number,
      maxX: number,
      minZ: number,
      maxZ: number,
    ): void => {
      const width = maxX - minX;
      const depth = maxZ - minZ;
      if (width <= 0.05 || depth <= 0.05) {
        return;
      }

      const floorSegment = new Mesh(new PlaneGeometry(width, depth), materials.floor);
      floorSegment.rotation.x = -Math.PI / 2;
      floorSegment.position.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
      floorSegment.receiveShadow = true;
      employeeRoomFloor.add(floorSegment);
    };

    addEmployeeFloorSegment(employeeRoomMinX, openingMinX, employeeRoomMinZ, employeeRoomMaxZ);
    addEmployeeFloorSegment(openingMaxX, employeeRoomMaxX, employeeRoomMinZ, employeeRoomMaxZ);
    addEmployeeFloorSegment(openingMinX, openingMaxX, employeeRoomMinZ, openingMinZ);
    addEmployeeFloorSegment(openingMinX, openingMaxX, openingMaxZ, employeeRoomMaxZ);

    const employeeRoomCeiling = new Mesh(new PlaneGeometry(employeeRoomWidth, employeeRoomDepth), materials.ceiling);
    employeeRoomCeiling.rotation.x = Math.PI / 2;
    employeeRoomCeiling.position.set(employeeRoomCenterX, WALL_HEIGHT, employeeRoomCenterZ);
    employeeRoomFloor.add(employeeRoomCeiling);
    root.add(employeeRoomFloor);
  }
  const backstageHallEastWallDepth = backstageHallSouthZ - backstageStorageMaxZ;
  const backstageWalls: WallDefinition[] = [
    {
      position: [backstageHallCenterX, WALL_HEIGHT / 2, backstageHallExtensionNorthZ + WALL_THICKNESS / 2],
      size: [backstageHallWidth, WALL_HEIGHT, WALL_THICKNESS],
    },
    {
      position: [backstageStorageCenterX, WALL_HEIGHT / 2, backstageStorageMinZ + WALL_THICKNESS / 2],
      size: [backstageStorageWidth, WALL_HEIGHT, WALL_THICKNESS],
    },
    {
      position: [backstageStorageMaxX - WALL_THICKNESS / 2, WALL_HEIGHT / 2, backstageStorageCenterZ],
      size: [WALL_THICKNESS, WALL_HEIGHT, backstageStorageDepth],
    },
    {
      position: [backstageStorageCenterX, WALL_HEIGHT / 2, backstageStorageMaxZ - WALL_THICKNESS / 2],
      size: [backstageStorageWidth, WALL_HEIGHT, WALL_THICKNESS],
    },
  ];
  if (abandonedStraightHalls) {
    backstageWalls.push({
      position: [backstageHallMinX + WALL_THICKNESS / 2, WALL_HEIGHT / 2, backstageHallCenterZ],
      size: [WALL_THICKNESS, WALL_HEIGHT, backstageHallLength],
    });
  } else {
    if (backstageHallExtensionLength > 0.05) {
      backstageWalls.push(
        {
          position: [backstageHallMinX + WALL_THICKNESS / 2, WALL_HEIGHT / 2, backstageHallExtensionCenterZ],
          size: [WALL_THICKNESS, WALL_HEIGHT, backstageHallExtensionLength],
        },
        {
          position: [backstageHallMaxX - WALL_THICKNESS / 2, WALL_HEIGHT / 2, backstageHallExtensionCenterZ],
          size: [WALL_THICKNESS, WALL_HEIGHT, backstageHallExtensionLength],
        },
      );
    }
    ([
      [backstageHallNorthZ, employeeOnlyDoorMinZ],
      [employeeOnlyDoorMaxZ, storageClosetDoorMinZ],
      [storageClosetDoorMaxZ, backstageHallSouthZ],
    ] as Array<[number, number]>).forEach(([startZ, endZ]) => {
      const depth = endZ - startZ;
      if (depth <= 0.24) {
        return;
      }

      backstageWalls.push({
        position: [backstageHallMinX + WALL_THICKNESS / 2, WALL_HEIGHT / 2, startZ + depth / 2],
        size: [WALL_THICKNESS, WALL_HEIGHT, depth],
      });
    });
    backstageWalls.push(
      {
        position: [employeeRoomMinX + WALL_THICKNESS / 2, WALL_HEIGHT / 2, employeeRoomCenterZ],
        size: [WALL_THICKNESS, WALL_HEIGHT, employeeRoomDepth],
      },
      {
        position: [employeeRoomCenterX, WALL_HEIGHT / 2, employeeRoomMinZ + WALL_THICKNESS / 2],
        size: [employeeRoomWidth, WALL_HEIGHT, WALL_THICKNESS],
      },
      {
        position: [employeeRoomCenterX, WALL_HEIGHT / 2, employeeRoomMaxZ - WALL_THICKNESS / 2],
        size: [employeeRoomWidth, WALL_HEIGHT, WALL_THICKNESS],
      },
    );
    backstageWalls.push(
      {
        position: [storageClosetWestX + WALL_THICKNESS / 2, WALL_HEIGHT / 2, storageClosetCenterZ],
        size: [WALL_THICKNESS, WALL_HEIGHT, storageClosetWidth],
      },
      {
        position: [storageClosetCenterX, WALL_HEIGHT / 2, storageClosetMinZ + WALL_THICKNESS / 2],
        size: [storageClosetDepth, WALL_HEIGHT, WALL_THICKNESS],
      },
      {
        position: [storageClosetCenterX, WALL_HEIGHT / 2, storageClosetMaxZ - WALL_THICKNESS / 2],
        size: [storageClosetDepth, WALL_HEIGHT, WALL_THICKNESS],
      },
    );
  }
  const backstageStorageWestWallX = backstageHallMaxX - WALL_THICKNESS / 2;
  const backstageStorageNorthDoorWallDepth = backstageStorageDoorMinZ - backstageStorageMinZ;
  const backstageStorageSouthDoorWallDepth = backstageStorageMaxZ - backstageStorageDoorMaxZ;
  if (backstageStorageNorthDoorWallDepth > 0.24) {
    backstageWalls.push({
      position: [
        backstageStorageWestWallX,
        WALL_HEIGHT / 2,
        backstageStorageMinZ + backstageStorageNorthDoorWallDepth / 2,
      ],
      size: [WALL_THICKNESS, WALL_HEIGHT, backstageStorageNorthDoorWallDepth],
    });
  }
  if (backstageStorageSouthDoorWallDepth > 0.24) {
    backstageWalls.push({
      position: [
        backstageStorageWestWallX,
        WALL_HEIGHT / 2,
        backstageStorageDoorMaxZ + backstageStorageSouthDoorWallDepth / 2,
      ],
      size: [WALL_THICKNESS, WALL_HEIGHT, backstageStorageSouthDoorWallDepth],
    });
  }
  const bathroomBranchOpeningLength = 0.62;
  const bathroomSideWallStartX = bathroomHallMinX + bathroomBranchOpeningLength;
  const bathroomSideWallWidth = bathroomHallMaxX - bathroomSideWallStartX;
  if (bathroomSideWallWidth > 0.24) {
    backstageWalls.push(
      {
        position: [
          bathroomSideWallStartX + bathroomSideWallWidth / 2,
          WALL_HEIGHT / 2,
          bathroomEntryMinZ + WALL_THICKNESS / 2,
        ],
        size: [bathroomSideWallWidth, WALL_HEIGHT, WALL_THICKNESS],
      },
      {
        position: [
          bathroomSideWallStartX + bathroomSideWallWidth / 2,
          WALL_HEIGHT / 2,
          bathroomEntryMaxZ - WALL_THICKNESS / 2,
        ],
        size: [bathroomSideWallWidth, WALL_HEIGHT, WALL_THICKNESS],
      },
    );
  }
  const bathroomNorthZ = menBathroomCenterZ - bathroomRoomDepth / 2;
  const bathroomSouthZ = womenBathroomCenterZ + bathroomRoomDepth / 2;
  const bathroomTotalDepth = bathroomSouthZ - bathroomNorthZ;
  const bathroomTotalCenterZ = (bathroomNorthZ + bathroomSouthZ) / 2;
  const bathroomMenEastDepth = bathroomEntryMinZ - bathroomNorthZ;
  const bathroomWomenEastDepth = bathroomSouthZ - bathroomEntryMaxZ;
  const bathroomRoomDoorWidth = 2.35;
  const bathroomDividerWidth = bathroomRoomWidth - bathroomRoomDoorWidth;
  backstageWalls.push(
    {
      position: [bathroomRoomMinX + WALL_THICKNESS / 2, WALL_HEIGHT / 2, bathroomTotalCenterZ],
      size: [WALL_THICKNESS, WALL_HEIGHT, bathroomTotalDepth],
    },
    {
      position: [
        bathroomRoomMaxX - WALL_THICKNESS / 2,
        WALL_HEIGHT / 2,
        bathroomNorthZ + bathroomMenEastDepth / 2,
      ],
      size: [WALL_THICKNESS, WALL_HEIGHT, bathroomMenEastDepth],
    },
    {
      position: [
        bathroomRoomMaxX - WALL_THICKNESS / 2,
        WALL_HEIGHT / 2,
        bathroomEntryMaxZ + bathroomWomenEastDepth / 2,
      ],
      size: [WALL_THICKNESS, WALL_HEIGHT, bathroomWomenEastDepth],
    },
    {
      position: [
        bathroomRoomCenterX,
        WALL_HEIGHT / 2,
        bathroomNorthZ + WALL_THICKNESS / 2,
      ],
      size: [bathroomRoomWidth, WALL_HEIGHT, WALL_THICKNESS],
    },
    {
      position: [
        bathroomRoomCenterX,
        WALL_HEIGHT / 2,
        bathroomSouthZ - WALL_THICKNESS / 2,
      ],
      size: [bathroomRoomWidth, WALL_HEIGHT, WALL_THICKNESS],
    },
    {
      position: [
        bathroomRoomMinX + bathroomDividerWidth / 2,
        WALL_HEIGHT / 2,
        bathroomEntryMinZ - WALL_THICKNESS / 2,
      ],
      size: [bathroomDividerWidth, WALL_HEIGHT, WALL_THICKNESS],
    },
    {
      position: [
        bathroomRoomMinX + bathroomDividerWidth / 2,
        WALL_HEIGHT / 2,
        bathroomEntryMaxZ + WALL_THICKNESS / 2,
      ],
      size: [bathroomDividerWidth, WALL_HEIGHT, WALL_THICKNESS],
    },
  );
  if (backstageHallEastWallDepth > 0.24) {
    backstageWalls.push({
      position: [
        backstageHallMaxX - WALL_THICKNESS / 2,
        WALL_HEIGHT / 2,
        backstageStorageMaxZ + backstageHallEastWallDepth / 2,
      ],
      size: [WALL_THICKNESS, WALL_HEIGHT, backstageHallEastWallDepth],
    });
  }
  const backstageWallResult = createWalls(backstageWalls, materials);
  root.add(backstageWallResult.root);
  colliders.push(...backstageWallResult.colliders);

  root.add(
    createFloor({
      width: SECOND_PARTY_HALL_LENGTH,
      depth: SECOND_PARTY_HALL_WIDTH,
      center: [secondHallCenterX, secondHallCenterZ],
      ceilingHeight: WALL_HEIGHT,
    }, materials),
    createFloor({
      width: SECOND_PARTY_ROOM_WIDTH,
      depth: SECOND_PARTY_ROOM_DEPTH,
      center: [secondRoomCenterX, secondRoomCenterZ],
      ceilingHeight: WALL_HEIGHT,
    }, materials),
  );
  const secondPartyWalls: WallDefinition[] = [
    {
      position: [secondHallCenterX, WALL_HEIGHT / 2, secondHallOpeningMinZ + WALL_THICKNESS / 2],
      size: [SECOND_PARTY_HALL_LENGTH, WALL_HEIGHT, WALL_THICKNESS],
    },
    {
      position: [secondHallCenterX, WALL_HEIGHT / 2, secondHallOpeningMaxZ - WALL_THICKNESS / 2],
      size: [SECOND_PARTY_HALL_LENGTH, WALL_HEIGHT, WALL_THICKNESS],
    },
    {
      position: [secondRoomCenterX, WALL_HEIGHT / 2, secondRoomMinZ + WALL_THICKNESS / 2],
      size: [SECOND_PARTY_ROOM_WIDTH, WALL_HEIGHT, WALL_THICKNESS],
    },
    {
      position: [secondRoomCenterX, WALL_HEIGHT / 2, secondRoomMaxZ - WALL_THICKNESS / 2],
      size: [SECOND_PARTY_ROOM_WIDTH, WALL_HEIGHT, WALL_THICKNESS],
    },
    {
      position: [secondRoomMaxX - WALL_THICKNESS / 2, WALL_HEIGHT / 2, secondRoomCenterZ],
      size: [WALL_THICKNESS, WALL_HEIGHT, SECOND_PARTY_ROOM_DEPTH],
    },
  ];
  ([
    [secondRoomMinZ, secondHallOpeningMinZ],
    [secondHallOpeningMaxZ, secondRoomMaxZ],
  ] as Array<[number, number]>).forEach(([startZ, endZ]) => {
    const depth = endZ - startZ;
    if (depth <= 0.24) {
      return;
    }

    secondPartyWalls.push({
      position: [secondRoomMinX + WALL_THICKNESS / 2, WALL_HEIGHT / 2, startZ + depth / 2],
      size: [WALL_THICKNESS, WALL_HEIGHT, depth],
    });
  });
  const secondPartyWallResult = createWalls(secondPartyWalls, materials);
  root.add(secondPartyWallResult.root);
  colliders.push(...secondPartyWallResult.colliders);

  const stageMaterial = new MeshStandardMaterial({
    color: 0x3d2730,
    emissive: 0x17050a,
    emissiveIntensity: 0.1,
    roughness: 0.74,
    metalness: 0.06,
  });
  const curtainMaterial = new MeshStandardMaterial({
    color: 0x4c1118,
    emissive: 0x210306,
    emissiveIntensity: 0.18,
    roughness: 0.86,
    metalness: 0.02,
  });
  const stageZ = partyRoomNorthZ + 2.82;
  const stage = new Mesh(new BoxGeometry(PARTY_STAGE_WIDTH, PARTY_STAGE_HEIGHT, PARTY_STAGE_DEPTH), stageMaterial);
  stage.position.set(partyRoomCenterX, PARTY_STAGE_HEIGHT / 2, stageZ);
  const stageLip = new Mesh(new BoxGeometry(17.4, 0.28, 0.34), materials.metal);
  stageLip.position.set(partyRoomCenterX, 0.86, stageZ + 2.08);
  const curtain = new Mesh(new BoxGeometry(17.6, 3.16, 0.12), curtainMaterial);
  curtain.position.set(partyRoomCenterX, 2.26, partyRoomNorthZ + 0.32);
  root.add(stage, stageLip, curtain);
  const stageFloor: OfficeChapterStageFloor = {
    center: new Vector3(partyRoomCenterX, GAME_CONFIG.player.height + PARTY_STAGE_HEIGHT, stageZ),
    halfWidth: PARTY_STAGE_WIDTH / 2,
    halfDepth: PARTY_STAGE_DEPTH / 2 + 0.18,
    floorY: GAME_CONFIG.player.height + PARTY_STAGE_HEIGHT,
  };

  const stageAnimatronicY = PARTY_STAGE_HEIGHT + PARTY_STAGE_ANIMATRONIC_FOOT_LIFT;
  const stageAnimatronics = [
    createStageAnimatronic(
      'duck',
      partyRoomCenterX - 4.6,
      stageAnimatronicY,
      partyRoomNorthZ + 2.78,
      true,
      true,
      options.sandboxQuackyDesign === true,
    ),
    createStageAnimatronic('bunny', partyRoomCenterX, stageAnimatronicY, partyRoomNorthZ + 2.58),
    createStageAnimatronic('bear', partyRoomCenterX + 4.6, stageAnimatronicY, partyRoomNorthZ + 2.78),
  ];
  stageAnimatronics.forEach((animatronic) => root.add(animatronic.root));
  const stageCollisionRefs: StageCollisionRefs[] = stageAnimatronics.map((animatronic) => {
    const body: CollisionBox = {
      centerX: animatronic.homePosition.x,
      centerZ: animatronic.homePosition.z,
      halfWidth: animatronic.kind === 'duck' ? 0.62 : 0.68,
      halfDepth: animatronic.kind === 'duck' ? 0.56 : 0.62,
    };
    const drumKit: CollisionBox | undefined = animatronic.kind === 'bear'
      ? {
          centerX: animatronic.homePosition.x,
          centerZ: animatronic.homePosition.z + 0.78,
          halfWidth: 1.05,
          halfDepth: 0.78,
        }
      : undefined;
    colliders.push(body);
    if (drumKit) {
      colliders.push(drumKit);
    }
    return { animatronic, body, drumKit };
  });
  const quackyNamePlate = createAnimatronicNamePlate('Quacky', 'the Duck', '#e8bd56', 0x2a1612);
  quackyNamePlate.position.copy(stageAnimatronics[0].homePosition);
  quackyNamePlate.rotation.y = Math.PI;
  root.add(quackyNamePlate);

  const stageLightMaterial = new MeshStandardMaterial({
    color: 0xffe6a8,
    emissive: 0xffc75f,
    emissiveIntensity: 0.8,
    roughness: 0.34,
    metalness: 0.14,
  });
  [-5.6, 0, 5.6].forEach((lightX, index) => {
    const fixture = new Mesh(new BoxGeometry(1.15, 0.16, 0.48), stageLightMaterial);
    fixture.position.set(partyRoomCenterX + lightX, WALL_HEIGHT - 0.18, partyRoomNorthZ + 2.6);
    const glow = new PointLight(index === 1 ? 0xffd2a1 : 0xff9d78, 1.4, 15, 1.7);
    glow.position.set(partyRoomCenterX + lightX, WALL_HEIGHT - 0.7, partyRoomNorthZ + 4.1);
    root.add(fixture, glow);
  });

  const backstageFrameMaterial = new MeshStandardMaterial({
    color: 0x261b19,
    emissive: 0x0c0503,
    emissiveIntensity: 0.14,
    roughness: 0.5,
    metalness: 0.26,
  });
  const backstageLeftPost = new Mesh(new BoxGeometry(0.18, 3.18, 0.28), backstageFrameMaterial);
  backstageLeftPost.position.set(backstageHallMinX + 0.08, 1.59, partyRoomNorthZ + 0.09);
  const backstageRightPost = new Mesh(new BoxGeometry(0.18, 3.18, 0.28), backstageFrameMaterial);
  backstageRightPost.position.set(backstageHallMaxX - 0.08, 1.59, partyRoomNorthZ + 0.09);
  const backstageHeader = new Mesh(new BoxGeometry(backstageHallWidth, 0.24, 0.3), backstageFrameMaterial);
  backstageHeader.position.set(backstageHallCenterX, 3.08, partyRoomNorthZ + 0.09);
  const backstageSign = new Mesh(new PlaneGeometry(1.92, 0.6), createBackstageSignMaterial());
  backstageSign.position.set(backstageHallCenterX, 2.64, partyRoomNorthZ + 0.25);
  root.add(backstageLeftPost, backstageRightPost, backstageHeader, backstageSign);

  const backstageDoorMaterial = new MeshStandardMaterial({
    color: 0x4b3026,
    emissive: 0x160805,
    emissiveIntensity: 0.16,
    roughness: 0.56,
    metalness: 0.18,
  });
  const kitchenDoorRoot = new Group();
  const kitchenDoorPanelWidth = kitchenDoorWidth / 2 - 0.32;
  const kitchenDoorX = northPartyHallOpeningMinX + 0.04;
  const kitchenLeftDoorPivot = new Group();
  const kitchenRightDoorPivot = new Group();
  kitchenLeftDoorPivot.position.set(kitchenDoorX, 0, kitchenDoorMinZ + 0.22);
  kitchenRightDoorPivot.position.set(kitchenDoorX, 0, kitchenDoorMaxZ - 0.22);
  const kitchenLeftDoorPanel = new Mesh(new BoxGeometry(0.1, 2.68, kitchenDoorPanelWidth), backstageDoorMaterial);
  kitchenLeftDoorPanel.position.set(0, 1.36, kitchenDoorPanelWidth / 2);
  const kitchenRightDoorPanel = new Mesh(new BoxGeometry(0.1, 2.68, kitchenDoorPanelWidth), backstageDoorMaterial);
  kitchenRightDoorPanel.position.set(0, 1.36, -kitchenDoorPanelWidth / 2);
  const kitchenLeftHandle = new Mesh(new BoxGeometry(0.08, 0.22, 0.08), backstageFrameMaterial);
  kitchenLeftHandle.position.set(0.08, 1.2, kitchenDoorPanelWidth - 0.18);
  const kitchenRightHandle = new Mesh(new BoxGeometry(0.08, 0.22, 0.08), backstageFrameMaterial);
  kitchenRightHandle.position.set(0.08, 1.2, -kitchenDoorPanelWidth + 0.18);
  const kitchenLeftSign = createWallSign('Kitchen', 'Steam');
  kitchenLeftSign.scale.set(0.68, 0.72, 1);
  kitchenLeftSign.rotation.y = Math.PI / 2;
  kitchenLeftSign.position.set(0.061, 1.88, kitchenDoorPanelWidth * 0.5);
  const kitchenRightSign = createWallSign('Kitchen', 'Steam');
  kitchenRightSign.scale.set(0.68, 0.72, 1);
  kitchenRightSign.rotation.y = Math.PI / 2;
  kitchenRightSign.position.set(0.061, 1.88, -kitchenDoorPanelWidth * 0.5);
  kitchenLeftDoorPivot.add(kitchenLeftDoorPanel, kitchenLeftHandle, kitchenLeftSign);
  kitchenRightDoorPivot.add(kitchenRightDoorPanel, kitchenRightHandle, kitchenRightSign);
  const kitchenDoorNorthPost = new Mesh(new BoxGeometry(0.24, 2.98, 0.12), backstageFrameMaterial);
  kitchenDoorNorthPost.position.set(kitchenDoorX, 1.49, kitchenDoorMinZ);
  const kitchenDoorSouthPost = new Mesh(new BoxGeometry(0.24, 2.98, 0.12), backstageFrameMaterial);
  kitchenDoorSouthPost.position.set(kitchenDoorX, 1.49, kitchenDoorMaxZ);
  const kitchenDoorHeader = new Mesh(new BoxGeometry(0.28, 0.28, kitchenDoorWidth + 0.2), backstageFrameMaterial);
  kitchenDoorHeader.position.set(kitchenDoorX, 2.9, kitchenDoorCenterZ);
  const kitchenDoorOverheadSign = createWallSign('Kitchen', 'Staff Only');
  kitchenDoorOverheadSign.scale.set(1.18, 0.9, 1);
  kitchenDoorOverheadSign.position.set(kitchenDoorX + 0.13, 3.18, kitchenDoorCenterZ);
  kitchenDoorOverheadSign.rotation.y = Math.PI / 2;
  kitchenDoorRoot.add(
    kitchenLeftDoorPivot,
    kitchenRightDoorPivot,
    kitchenDoorNorthPost,
    kitchenDoorSouthPost,
    kitchenDoorHeader,
    kitchenDoorOverheadSign,
  );
  root.add(kitchenDoorRoot);
  const kitchenDoorCollider: CollisionBox = {
    centerX: kitchenDoorX,
    centerZ: kitchenDoorCenterZ,
    halfWidth: 0.18,
    halfDepth: kitchenDoorWidth / 2 - 0.34,
    enabled: true,
  };
  colliders.push(kitchenDoorCollider);
  const kitchenEntranceDoor: OfficeChapterKitchenEntranceDoor = {
    label: 'Kitchen Double Doors',
    root: kitchenDoorRoot,
    interactPosition: new Vector3(kitchenDoorX + 0.92, 1.28, kitchenDoorCenterZ),
    leftDoorPivot: kitchenLeftDoorPivot,
    rightDoorPivot: kitchenRightDoorPivot,
    collider: kitchenDoorCollider,
    open: false,
    openAmount: 0,
    targetOpenAmount: 0,
  };

  const kitchenSteamClouds: Mesh[] = [];
  const kitchenSteamMaterial = new MeshStandardMaterial({
    color: 0xdde4e5,
    emissive: 0xb9d4d8,
    emissiveIntensity: 0.14,
    roughness: 0.96,
    metalness: 0,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  const addKitchenSteamCloud = (
    x: number,
    y: number,
    z: number,
    scaleX: number,
    scaleY: number,
    scaleZ: number,
    phase: number,
  ): void => {
    const material = kitchenSteamMaterial.clone();
    const cloud = new Mesh(new SphereGeometry(1, 14, 9), material);
    cloud.position.set(x, y, z);
    cloud.scale.set(scaleX, scaleY, scaleZ);
    cloud.userData.baseY = y;
    cloud.userData.baseScaleX = scaleX;
    cloud.userData.baseScaleY = scaleY;
    cloud.userData.baseScaleZ = scaleZ;
    cloud.userData.phase = phase;
    kitchenSteamClouds.push(cloud);
    root.add(cloud);
  };

  const kitchenDecorEnabled = false as boolean;
  if (kitchenDecorEnabled) {
    [
      { x: kitchenCenterX + 2.1, z: kitchenCenterZ - 2.35, rotationY: 0.08, colliderWidth: 3.45, colliderDepth: 1.42 },
      { x: kitchenCenterX - 3.4, z: kitchenCenterZ + 2.25, rotationY: Math.PI / 2, colliderWidth: 1.42, colliderDepth: 3.45 },
      { x: kitchenCenterX + 3.9, z: kitchenCenterZ + 2.55, rotationY: -0.06, colliderWidth: 3.45, colliderDepth: 1.42 },
    ].forEach((table) => {
      root.add(createKitchenPrepTable(table.x, table.z, table.rotationY));
      addCollider(colliders, table.x, table.z, table.colliderWidth, table.colliderDepth);
    });
  }

  [
    { x: -243.25, z: 136.02 },
    { x: -238.12, z: 135.96 },
  ].forEach((stove) => {
    root.add(createKitchenPlacedStove(stove.x, stove.z, 0));
    addCollider(colliders, stove.x, stove.z, 1.28, 1.12);
  });

  root.add(createKitchenPrepTable(-243.25, 138.45, 0));
  addCollider(colliders, -243.25, 138.45, 3.45, 1.42);

  const kitchenGlassShelfDefinitions = kitchenDecorEnabled
    ? [
        { x: kitchenWestX + 0.7, z: kitchenCenterZ + 3.4, rotationY: -Math.PI / 2, colliderWidth: 0.72, colliderDepth: 3.35 },
        { x: kitchenCenterX - 2.2, z: kitchenMinZ + 0.56, rotationY: 0, colliderWidth: 3.35, colliderDepth: 0.72 },
        { x: kitchenCenterX + 4.4, z: kitchenMaxZ - 0.56, rotationY: Math.PI, colliderWidth: 3.35, colliderDepth: 0.72 },
      ]
    : [];
  const kitchenGlassShelves: OfficeChapterKitchenGlassShelf[] = kitchenGlassShelfDefinitions.map((shelf, index) => ({
    label: `Kitchen Glass Shelf ${index + 1}`,
    position: new Vector3(shelf.x, 1.46, shelf.z),
  }));
  kitchenGlassShelfDefinitions.forEach((shelf) => {
    root.add(createKitchenShelf(shelf.x, shelf.z, shelf.rotationY));
    addCollider(colliders, shelf.x, shelf.z, shelf.colliderWidth, shelf.colliderDepth);
  });

  if (kitchenDecorEnabled) {
    [
      { x: kitchenWestX + 0.82, z: kitchenCenterZ - 3.35, rotationY: -Math.PI / 2, colliderWidth: 1.12, colliderDepth: 4.1 },
      { x: kitchenCenterX + 1.35, z: kitchenMaxZ - 0.76, rotationY: Math.PI, colliderWidth: 4.1, colliderDepth: 1.12 },
    ].forEach((stove) => {
      root.add(createKitchenStoveLine(stove.x, stove.z, stove.rotationY));
      addCollider(colliders, stove.x, stove.z, stove.colliderWidth, stove.colliderDepth);
    });

    [
      { x: kitchenWestX + 1.4, y: 1.72, z: kitchenCenterZ - 3.3, scaleX: 2.2, scaleY: 1.2, scaleZ: 1.6 },
      { x: kitchenWestX + 1.1, y: 2.35, z: kitchenCenterZ - 2.1, scaleX: 2.6, scaleY: 1.0, scaleZ: 1.8 },
      { x: kitchenCenterX + 1.3, y: 1.85, z: kitchenMaxZ - 1.2, scaleX: 2.4, scaleY: 1.15, scaleZ: 1.4 },
      { x: kitchenCenterX + 2.7, y: 2.5, z: kitchenMaxZ - 1.0, scaleX: 3.1, scaleY: 1.05, scaleZ: 1.5 },
      { x: kitchenCenterX + 0.2, y: 1.58, z: kitchenCenterZ + 0.4, scaleX: 4.1, scaleY: 0.86, scaleZ: 3.0 },
      { x: kitchenCenterX - 3.2, y: 1.82, z: kitchenCenterZ - 1.2, scaleX: 3.2, scaleY: 0.9, scaleZ: 2.5 },
      { x: kitchenCenterX + 4.1, y: 2.0, z: kitchenCenterZ + 1.0, scaleX: 3.2, scaleY: 0.82, scaleZ: 2.0 },
      { x: kitchenDoorX - 3.0, y: 1.45, z: kitchenDoorCenterZ, scaleX: 2.8, scaleY: 0.7, scaleZ: 2.6 },
    ].forEach((cloud, index) => {
      addKitchenSteamCloud(cloud.x, cloud.y, cloud.z, cloud.scaleX, cloud.scaleY, cloud.scaleZ, index * 0.71);
    });
  }

  [
    { x: kitchenCenterX - 4.4, z: kitchenCenterZ - 4.25 },
    { x: kitchenCenterX + 3.9, z: kitchenCenterZ - 2.1 },
    { x: kitchenCenterX - 0.2, z: kitchenCenterZ + 3.95 },
  ].forEach((light) => {
    const fixture = new Mesh(new BoxGeometry(1.05, 0.1, 0.42), panelMaterial);
    fixture.position.set(light.x, WALL_HEIGHT - 0.15, light.z);
    const glow = new PointLight(0xfff0d6, 0.82, 9.5, 1.7);
    glow.position.set(light.x, WALL_HEIGHT - 0.78, light.z);
    root.add(fixture, glow);
  });
  let kitchenSteamTime = 0;

  const backstageStorageDoorRoot = new Group();
  const backstageStorageDoorPanelWidth = backstageStorageDoorWidth - 0.22;
  const backstageStorageDoorPivot = new Group();
  backstageStorageDoorPivot.position.set(backstageHallMaxX - 0.03, 0, backstageStorageDoorMinZ + 0.08);
  const backstageStorageDoorPanel = new Mesh(
    new BoxGeometry(0.1, 2.58, backstageStorageDoorPanelWidth),
    backstageDoorMaterial,
  );
  backstageStorageDoorPanel.position.set(0, 1.34, backstageStorageDoorPanelWidth / 2);
  backstageStorageDoorPanel.castShadow = true;
  backstageStorageDoorPanel.receiveShadow = true;
  const backstageStorageDoorHandle = new Mesh(new BoxGeometry(0.08, 0.18, 0.08), backstageFrameMaterial);
  backstageStorageDoorHandle.position.set(-0.08, 1.2, backstageStorageDoorPanelWidth - 0.2);
  const backstageStorageDoorWindow = new Mesh(new BoxGeometry(0.03, 0.54, 0.7), backstageFrameMaterial);
  backstageStorageDoorWindow.position.set(-0.061, 1.86, backstageStorageDoorPanelWidth * 0.52);
  backstageStorageDoorPivot.add(backstageStorageDoorPanel, backstageStorageDoorHandle, backstageStorageDoorWindow);
  const backstageStorageDoorNorthPost = new Mesh(new BoxGeometry(0.22, 2.86, 0.12), backstageFrameMaterial);
  backstageStorageDoorNorthPost.position.set(backstageHallMaxX - 0.04, 1.43, backstageStorageDoorMinZ);
  const backstageStorageDoorSouthPost = new Mesh(new BoxGeometry(0.22, 2.86, 0.12), backstageFrameMaterial);
  backstageStorageDoorSouthPost.position.set(backstageHallMaxX - 0.04, 1.43, backstageStorageDoorMaxZ);
  const backstageStorageDoorHeader = new Mesh(
    new BoxGeometry(0.24, 0.22, backstageStorageDoorWidth + 0.18),
    backstageFrameMaterial,
  );
  backstageStorageDoorHeader.position.set(backstageHallMaxX - 0.04, 2.82, backstageStorageDoorCenterZ);
  const backstageStorageDoorSign = new Mesh(new PlaneGeometry(1.42, 0.42), createBackstageSignMaterial());
  backstageStorageDoorSign.position.set(backstageHallMaxX - 0.18, 2.36, backstageStorageDoorCenterZ);
  backstageStorageDoorSign.rotation.y = -Math.PI / 2;
  backstageStorageDoorRoot.add(
    backstageStorageDoorPivot,
    backstageStorageDoorNorthPost,
    backstageStorageDoorSouthPost,
    backstageStorageDoorHeader,
    backstageStorageDoorSign,
  );
  root.add(backstageStorageDoorRoot);
  const backstageStorageDoorCollider: CollisionBox = {
    centerX: backstageHallMaxX - 0.03,
    centerZ: backstageStorageDoorCenterZ,
    halfWidth: 0.16,
    halfDepth: backstageStorageDoorPanelWidth / 2,
    enabled: true,
  };
  colliders.push(backstageStorageDoorCollider);
  const backstageStorageDoor: OfficeChapterBackstageStorageDoor = {
    label: 'Backstage Suit Storage Door',
    root: backstageStorageDoorRoot,
    interactPosition: new Vector3(backstageHallMaxX - 0.32, 1.24, backstageStorageDoorCenterZ),
    doorPivot: backstageStorageDoorPivot,
    collider: backstageStorageDoorCollider,
    open: false,
    openAmount: 0,
    targetOpenAmount: 0,
  };

  const storageClosetDoorRoot = new Group();
  const storageClosetDoorPanelWidth = storageClosetDoorWidth - 0.22;
  const storageClosetDoorPivot = new Group();
  if (abandonedStraightHalls) {
    storageClosetDoorPivot.position.set(storageClosetDoorMinX + 0.08, 0, storageClosetNorthZ - 0.04);
    const storageClosetDoorPanel = new Mesh(
      new BoxGeometry(storageClosetDoorPanelWidth, 2.58, 0.1),
      backstageDoorMaterial,
    );
    storageClosetDoorPanel.position.set(storageClosetDoorPanelWidth / 2, 1.34, 0);
    storageClosetDoorPanel.castShadow = true;
    storageClosetDoorPanel.receiveShadow = true;
    const storageClosetDoorHandle = new Mesh(new BoxGeometry(0.08, 0.18, 0.08), backstageFrameMaterial);
    storageClosetDoorHandle.position.set(storageClosetDoorPanelWidth - 0.2, 1.2, -0.08);
    const storageClosetDoorSign = createWallSign('Storage', 'Cleaning');
    storageClosetDoorSign.scale.set(0.78, 0.78, 1);
    storageClosetDoorSign.rotation.y = Math.PI;
    storageClosetDoorSign.position.set(storageClosetDoorPanelWidth * 0.5, 1.86, -0.061);
    storageClosetDoorPivot.add(storageClosetDoorPanel, storageClosetDoorHandle, storageClosetDoorSign);
    const storageClosetDoorNorthPost = new Mesh(new BoxGeometry(0.12, 2.86, 0.22), backstageFrameMaterial);
    storageClosetDoorNorthPost.position.set(storageClosetDoorMinX, 1.43, storageClosetNorthZ - 0.04);
    const storageClosetDoorSouthPost = new Mesh(new BoxGeometry(0.12, 2.86, 0.22), backstageFrameMaterial);
    storageClosetDoorSouthPost.position.set(storageClosetDoorMaxX, 1.43, storageClosetNorthZ - 0.04);
    const storageClosetDoorHeader = new Mesh(
      new BoxGeometry(storageClosetDoorWidth + 0.18, 0.22, 0.24),
      backstageFrameMaterial,
    );
    storageClosetDoorHeader.position.set(storageClosetDoorCenterX, 2.82, storageClosetNorthZ - 0.04);
    storageClosetDoorRoot.add(
      storageClosetDoorPivot,
      storageClosetDoorNorthPost,
      storageClosetDoorSouthPost,
      storageClosetDoorHeader,
    );
  } else {
    storageClosetDoorPivot.position.set(storageClosetDoorCenterX + 0.04, 0, storageClosetDoorMinZ + 0.08);
    const storageClosetDoorPanel = new Mesh(
      new BoxGeometry(0.1, 2.58, storageClosetDoorPanelWidth),
      backstageDoorMaterial,
    );
    storageClosetDoorPanel.position.set(0, 1.34, storageClosetDoorPanelWidth / 2);
    storageClosetDoorPanel.castShadow = true;
    storageClosetDoorPanel.receiveShadow = true;
    const storageClosetDoorHandle = new Mesh(new BoxGeometry(0.08, 0.18, 0.08), backstageFrameMaterial);
    storageClosetDoorHandle.position.set(0.08, 1.2, storageClosetDoorPanelWidth - 0.2);
    const storageClosetDoorSign = createWallSign('Storage', 'Cleaning');
    storageClosetDoorSign.scale.set(0.78, 0.78, 1);
    storageClosetDoorSign.rotation.y = Math.PI / 2;
    storageClosetDoorSign.position.set(0.061, 1.86, storageClosetDoorPanelWidth * 0.5);
    storageClosetDoorPivot.add(storageClosetDoorPanel, storageClosetDoorHandle, storageClosetDoorSign);
    const storageClosetDoorNorthPost = new Mesh(new BoxGeometry(0.22, 2.86, 0.12), backstageFrameMaterial);
    storageClosetDoorNorthPost.position.set(storageClosetDoorCenterX + 0.04, 1.43, storageClosetDoorMinZ);
    const storageClosetDoorSouthPost = new Mesh(new BoxGeometry(0.22, 2.86, 0.12), backstageFrameMaterial);
    storageClosetDoorSouthPost.position.set(storageClosetDoorCenterX + 0.04, 1.43, storageClosetDoorMaxZ);
    const storageClosetDoorHeader = new Mesh(
      new BoxGeometry(0.24, 0.22, storageClosetDoorWidth + 0.18),
      backstageFrameMaterial,
    );
    storageClosetDoorHeader.position.set(storageClosetDoorCenterX + 0.04, 2.82, storageClosetDoorCenterZ);
    storageClosetDoorRoot.add(
      storageClosetDoorPivot,
      storageClosetDoorNorthPost,
      storageClosetDoorSouthPost,
      storageClosetDoorHeader,
    );
  }
  root.add(storageClosetDoorRoot);
  const storageClosetDoorCollider: CollisionBox = abandonedStraightHalls
    ? {
        centerX: storageClosetDoorCenterX,
        centerZ: storageClosetNorthZ - 0.04,
        halfWidth: storageClosetDoorPanelWidth / 2,
        halfDepth: 0.16,
        enabled: true,
      }
    : {
        centerX: storageClosetDoorCenterX + 0.03,
        centerZ: storageClosetDoorCenterZ,
        halfWidth: 0.16,
        halfDepth: storageClosetDoorPanelWidth / 2,
        enabled: true,
      };
  colliders.push(storageClosetDoorCollider);
  const storageClosetDoor: OfficeChapterStorageClosetDoor = {
    label: 'Cleaning Storage Closet Door',
    root: storageClosetDoorRoot,
    interactPosition: abandonedStraightHalls
      ? new Vector3(storageClosetDoorCenterX, 1.24, storageClosetNorthZ - 0.58)
      : new Vector3(storageClosetDoorCenterX + 0.58, 1.24, storageClosetDoorCenterZ),
    doorPivot: storageClosetDoorPivot,
    collider: storageClosetDoorCollider,
    open: false,
    openAmount: 0,
    targetOpenAmount: 0,
  };

  const employeeOnlyDoorRoot = new Group();
  const employeeOnlyDoorPanelWidth = employeeOnlyDoorWidth - 0.22;
  const employeeOnlyDoorPivot = new Group();
  employeeOnlyDoorPivot.position.set(employeeOnlyDoorCenterX - 0.03, 0, employeeOnlyDoorMinZ + 0.08);
  const employeeOnlyDoorPanel = new Mesh(
    new BoxGeometry(0.1, 2.58, employeeOnlyDoorPanelWidth),
    backstageDoorMaterial,
  );
  employeeOnlyDoorPanel.position.set(0, 1.34, employeeOnlyDoorPanelWidth / 2);
  employeeOnlyDoorPanel.castShadow = true;
  employeeOnlyDoorPanel.receiveShadow = true;
  const employeeOnlyDoorHandle = new Mesh(new BoxGeometry(0.08, 0.18, 0.08), backstageFrameMaterial);
  employeeOnlyDoorHandle.position.set(0.08, 1.2, employeeOnlyDoorPanelWidth - 0.2);
  const employeeOnlyDoorSign = new Mesh(new PlaneGeometry(1.02, 0.66), createEmployeeOnlySignMaterial());
  employeeOnlyDoorSign.rotation.y = Math.PI / 2;
  employeeOnlyDoorSign.position.set(0.061, 1.82, employeeOnlyDoorPanelWidth * 0.5);
  employeeOnlyDoorPivot.add(employeeOnlyDoorPanel, employeeOnlyDoorHandle, employeeOnlyDoorSign);
  const employeeOnlyDoorNorthPost = new Mesh(new BoxGeometry(0.22, 2.86, 0.12), backstageFrameMaterial);
  employeeOnlyDoorNorthPost.position.set(employeeOnlyDoorCenterX - 0.04, 1.43, employeeOnlyDoorMinZ);
  const employeeOnlyDoorSouthPost = new Mesh(new BoxGeometry(0.22, 2.86, 0.12), backstageFrameMaterial);
  employeeOnlyDoorSouthPost.position.set(employeeOnlyDoorCenterX - 0.04, 1.43, employeeOnlyDoorMaxZ);
  const employeeOnlyDoorHeader = new Mesh(
    new BoxGeometry(0.24, 0.22, employeeOnlyDoorWidth + 0.18),
    backstageFrameMaterial,
  );
  employeeOnlyDoorHeader.position.set(employeeOnlyDoorCenterX - 0.04, 2.82, employeeOnlyDoorCenterZ);
  employeeOnlyDoorRoot.add(
    employeeOnlyDoorPivot,
    employeeOnlyDoorNorthPost,
    employeeOnlyDoorSouthPost,
    employeeOnlyDoorHeader,
  );
  employeeOnlyDoorRoot.visible = !abandonedStraightHalls;
  root.add(employeeOnlyDoorRoot);
  const employeeOnlyDoorCollider: CollisionBox = {
    centerX: employeeOnlyDoorCenterX - 0.03,
    centerZ: employeeOnlyDoorCenterZ,
    halfWidth: 0.16,
    halfDepth: employeeOnlyDoorPanelWidth / 2,
    enabled: !abandonedStraightHalls,
  };
  if (!abandonedStraightHalls) {
    colliders.push(employeeOnlyDoorCollider);
  }
  const employeeOnlyDoor: OfficeChapterEmployeeOnlyDoor = {
    label: 'Employees Only Room Door',
    root: employeeOnlyDoorRoot,
    interactPosition: new Vector3(employeeOnlyDoorCenterX + 0.58, 1.24, employeeOnlyDoorCenterZ),
    doorPivot: employeeOnlyDoorPivot,
    collider: employeeOnlyDoorCollider,
    open: false,
    openAmount: 0,
    targetOpenAmount: 0,
    locked: true,
  };

  const employeeKeyBriefcaseRoot = new Group();
  employeeKeyBriefcaseRoot.position.set(-243.99, OFFICE_VENT_DUCT_FLOOR_Y + 0.005, 148.55);
  employeeKeyBriefcaseRoot.rotation.y = Math.PI / 2;
  employeeKeyBriefcaseRoot.visible = !abandonedStraightHalls;
  const briefcaseMaterial = new MeshStandardMaterial({
    color: 0x555b60,
    emissive: 0x050607,
    emissiveIntensity: 0.08,
    roughness: 0.38,
    metalness: 0.76,
  });
  const briefcaseEdgeMaterial = new MeshStandardMaterial({
    color: 0x25282b,
    emissive: 0x020303,
    emissiveIntensity: 0.08,
    roughness: 0.32,
    metalness: 0.84,
  });
  const keyMaterial = new MeshStandardMaterial({
    color: 0xd7b24a,
    emissive: 0x2e2105,
    emissiveIntensity: 0.2,
    roughness: 0.36,
    metalness: 0.78,
  });
  const briefcaseBottom = new Mesh(new BoxGeometry(1.18, 0.22, 0.74), briefcaseMaterial);
  briefcaseBottom.position.y = 0.11;
  const briefcaseInterior = new Mesh(new BoxGeometry(1.02, 0.035, 0.58), new MeshStandardMaterial({
    color: 0x151719,
    emissive: 0x010101,
    emissiveIntensity: 0.04,
    roughness: 0.82,
    metalness: 0.04,
  }));
  briefcaseInterior.position.y = 0.24;
  const briefcaseFrontLatch = new Mesh(new BoxGeometry(0.18, 0.08, 0.055), keyMaterial);
  briefcaseFrontLatch.position.set(0, 0.28, 0.4);
  const briefcaseHandle = new Mesh(new TorusGeometry(0.18, 0.018, 8, 20, Math.PI), briefcaseEdgeMaterial);
  briefcaseHandle.position.set(0, 0.3, 0.44);
  briefcaseHandle.rotation.x = Math.PI / 2;
  const briefcaseLidPivot = new Group();
  briefcaseLidPivot.position.set(0, 0.24, -0.37);
  const briefcaseLid = new Mesh(new BoxGeometry(1.18, 0.12, 0.74), briefcaseMaterial);
  briefcaseLid.position.set(0, 0.06, 0.37);
  const briefcaseLidRim = new Mesh(new BoxGeometry(1.26, 0.07, 0.06), briefcaseEdgeMaterial);
  briefcaseLidRim.position.set(0, 0.13, 0.74);
  briefcaseLidPivot.add(briefcaseLid, briefcaseLidRim);
  const briefcaseKeyRoot = new Group();
  briefcaseKeyRoot.position.set(0.04, 0.31, 0.02);
  const keyRing = new Mesh(new TorusGeometry(0.08, 0.012, 8, 18), keyMaterial);
  keyRing.rotation.x = Math.PI / 2;
  const keyStem = new Mesh(new BoxGeometry(0.32, 0.035, 0.035), keyMaterial);
  keyStem.position.x = 0.18;
  const keyToothA = new Mesh(new BoxGeometry(0.07, 0.03, 0.07), keyMaterial);
  keyToothA.position.set(0.34, -0.002, 0.04);
  const keyToothB = keyToothA.clone();
  keyToothB.position.set(0.27, -0.002, -0.04);
  briefcaseKeyRoot.add(keyRing, keyStem, keyToothA, keyToothB);
  briefcaseKeyRoot.visible = false;
  const briefcaseVentGlow = new PointLight(0xffd18a, 0.52, 4.2, 1.8);
  briefcaseVentGlow.position.set(0, 0.5, 0.08);
  employeeKeyBriefcaseRoot.add(
    briefcaseBottom,
    briefcaseInterior,
    briefcaseFrontLatch,
    briefcaseHandle,
    briefcaseLidPivot,
    briefcaseKeyRoot,
    briefcaseVentGlow,
  );
  root.add(employeeKeyBriefcaseRoot);
  const employeeKeyBriefcase: OfficeChapterEmployeeKeyBriefcase = {
    label: 'Metal Briefcase',
    root: employeeKeyBriefcaseRoot,
    interactPosition: new Vector3(-243.99, OFFICE_VENT_DUCT_FLOOR_Y + 0.52, 148.55),
    lidPivot: briefcaseLidPivot,
    keyRoot: briefcaseKeyRoot,
    open: false,
    openAmount: 0,
    targetOpenAmount: 0,
    keyCollected: false,
  };

  const employeeElevatorRoot = new Group();
  employeeElevatorRoot.visible = !abandonedStraightHalls;
  const elevatorMetalMaterial = new MeshStandardMaterial({
    color: 0x6d747c,
    emissive: 0x090d10,
    emissiveIntensity: 0.1,
    roughness: 0.48,
    metalness: 0.52,
  });
  const createElevatorBrickMaterial = (): MeshStandardMaterial => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#4a3c2f';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#5a4a39';
      for (let patch = 0; patch < 34; patch += 1) {
        const x = (patch * 53) % canvas.width;
        const y = (patch * 29) % canvas.height;
        const width = 18 + (patch * 7) % 34;
        const height = 5 + (patch * 11) % 18;
        context.globalAlpha = 0.18 + (patch % 4) * 0.035;
        context.fillRect(x, y, width, height);
      }
      context.globalAlpha = 1;
      const brickHeight = 34;
      const brickWidth = 74;
      const sparseBricks: Array<[number, number, number, number]> = [
        [12, 8, brickWidth, brickHeight],
        [136, 16, brickWidth * 0.9, brickHeight * 0.88],
        [70, 52, brickWidth * 0.92, brickHeight],
        [184, 60, brickWidth * 0.78, brickHeight * 0.92],
        [22, 94, brickWidth * 0.86, brickHeight * 0.82],
        [122, 100, brickWidth * 0.98, brickHeight * 0.76],
      ];
      sparseBricks.forEach(([x, y, width, height], index) => {
        context.fillStyle = index % 3 === 0 ? '#596166' : index % 3 === 1 ? '#4d565b' : '#687075';
        context.fillRect(x, y, width, height);
        context.fillStyle = 'rgba(19, 24, 27, 0.34)';
        context.fillRect(x, y + height - 5, width, 5);
        context.fillStyle = 'rgba(209, 214, 210, 0.08)';
        context.fillRect(x + 7, y + 5, width - 14, 3);
        context.fillStyle = 'rgba(25, 29, 30, 0.42)';
        context.fillRect(x + width * 0.22, y + 8, 3, height * 0.55);
        context.fillRect(x + width * 0.54, y + height * 0.38, width * 0.34, 3);
        context.fillStyle = 'rgba(28, 22, 17, 0.3)';
        context.fillRect(x - 4, y + height + 1, width + 8, 4);
        for (let speck = 0; speck < 12; speck += 1) {
          const speckSeed = (index * 37 + speck * 19) % 101;
          const speckX = x + 6 + (speckSeed * 11) % Math.max(8, width - 12);
          const speckY = y + 6 + (speckSeed * 7) % Math.max(8, height - 12);
          context.fillStyle = speck % 2 === 0 ? 'rgba(16, 18, 18, 0.28)' : 'rgba(123, 117, 99, 0.2)';
          context.fillRect(speckX, speckY, 2, 1);
        }
      });
      context.fillStyle = 'rgba(55, 49, 39, 0.12)';
      context.fillRect(0, canvas.height - 18, canvas.width, 18);
      context.fillStyle = 'rgba(235, 239, 232, 0.06)';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1.05, 1.25);
    return new MeshStandardMaterial({
      map: texture,
      color: 0x8f877a,
      emissive: 0x120d09,
      emissiveIntensity: 0.08,
      roughness: 0.96,
      metalness: 0.02,
    });
  };
  const elevatorBrickMaterial = createElevatorBrickMaterial();
  const createBasementCeilingMaterial = (): MeshStandardMaterial => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#343532';
      context.fillRect(0, 0, canvas.width, canvas.height);
      for (let strip = 0; strip < 8; strip += 1) {
        const x = strip * 32;
        context.fillStyle = strip % 2 === 0 ? '#4d4438' : '#3e403b';
        context.fillRect(x, 0, 30, canvas.height);
        context.fillStyle = 'rgba(20, 18, 16, 0.42)';
        context.fillRect(x + 29, 0, 3, canvas.height);
        context.fillStyle = 'rgba(226, 213, 185, 0.08)';
        context.fillRect(x + 5, 0, 4, canvas.height);
      }
      context.fillStyle = 'rgba(95, 101, 103, 0.5)';
      for (let y = 18; y < canvas.height; y += 32) {
        context.fillRect(0, y, canvas.width, 3);
      }
      context.fillStyle = 'rgba(17, 15, 12, 0.32)';
      context.fillRect(40, 34, 46, 9);
      context.fillRect(148, 78, 58, 7);
      context.fillStyle = 'rgba(12, 13, 14, 0.24)';
      context.fillRect(0, 0, canvas.width, 8);
      context.fillRect(0, canvas.height - 10, canvas.width, 10);
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1.25, 0.85);
    return new MeshStandardMaterial({
      map: texture,
      color: 0x857c70,
      emissive: 0x0f1010,
      emissiveIntensity: 0.08,
      roughness: 0.84,
      metalness: 0.18,
    });
  };
  const basementCeilingMaterial = createBasementCeilingMaterial();
  const elevatorShaftLightMaterial = new MeshStandardMaterial({
    color: 0xffe3a2,
    emissive: 0xffb64d,
    emissiveIntensity: 1.15,
    roughness: 0.28,
    metalness: 0.05,
  });
  const elevatorCableMaterial = new MeshStandardMaterial({
    color: 0x1a1d20,
    emissive: 0x050607,
    emissiveIntensity: 0.1,
    roughness: 0.34,
    metalness: 0.78,
  });
  const elevatorButtonMaterial = new MeshStandardMaterial({
    color: 0xb31318,
    emissive: 0x8f0507,
    emissiveIntensity: 0.65,
    roughness: 0.32,
    metalness: 0.18,
  });
  const employeeElevatorPlatformHomeY = 0.055;
  const employeeElevatorLowerEyeY = GAME_CONFIG.player.height + employeeElevatorBasementFloorY;
  const employeeElevatorPlatform = new Group();
  employeeElevatorPlatform.position.set(employeeElevatorCenterX, employeeElevatorPlatformHomeY, employeeElevatorCenterZ);
  const elevatorPatch = new Mesh(
    new BoxGeometry(employeeElevatorPlatformSize, 0.08, employeeElevatorPlatformSize),
    elevatorMetalMaterial,
  );
  elevatorPatch.position.set(0, 0.035, 0);
  elevatorPatch.receiveShadow = true;
  const elevatorEdgeMaterial = new MeshStandardMaterial({
    color: 0x2e3338,
    emissive: 0x030506,
    emissiveIntensity: 0.12,
    roughness: 0.52,
    metalness: 0.7,
  });
  [
    { x: employeeElevatorCenterX, z: employeeElevatorCenterZ - employeeElevatorPlatformSize / 2 - 0.14, sx: employeeElevatorPlatformSize + 0.42, sz: 0.12 },
    { x: employeeElevatorCenterX, z: employeeElevatorCenterZ + employeeElevatorPlatformSize / 2 + 0.14, sx: employeeElevatorPlatformSize + 0.42, sz: 0.12 },
    { x: employeeElevatorCenterX - employeeElevatorPlatformSize / 2 - 0.14, z: employeeElevatorCenterZ, sx: 0.12, sz: employeeElevatorPlatformSize + 0.42 },
    { x: employeeElevatorCenterX + employeeElevatorPlatformSize / 2 + 0.14, z: employeeElevatorCenterZ, sx: 0.12, sz: employeeElevatorPlatformSize + 0.42 },
  ].forEach((edge) => {
    const rim = new Mesh(new BoxGeometry(edge.sx, 0.08, edge.sz), elevatorEdgeMaterial);
    rim.position.set(edge.x, 0.075, edge.z);
    employeeElevatorRoot.add(rim);
  });
  [
    { x: 0, z: -employeeElevatorPlatformSize / 2 - 0.055, sx: employeeElevatorPlatformSize + 0.18, sz: 0.09 },
    { x: 0, z: employeeElevatorPlatformSize / 2 + 0.055, sx: employeeElevatorPlatformSize + 0.18, sz: 0.09 },
    { x: -employeeElevatorPlatformSize / 2 - 0.055, z: 0, sx: 0.09, sz: employeeElevatorPlatformSize + 0.18 },
    { x: employeeElevatorPlatformSize / 2 + 0.055, z: 0, sx: 0.09, sz: employeeElevatorPlatformSize + 0.18 },
  ].forEach((edge) => {
    const rail = new Mesh(new BoxGeometry(edge.sx, 0.12, edge.sz), elevatorEdgeMaterial);
    rail.position.set(edge.x, 0.12, edge.z);
    employeeElevatorPlatform.add(rail);
  });
  employeeElevatorPlatform.add(elevatorPatch);
  employeeElevatorRoot.add(employeeElevatorPlatform);

  const cableTopY = WALL_HEIGHT - 0.08;
  const cableBaseLength = cableTopY - 0.22;
  const employeeElevatorCables: Mesh[] = [];
  const cableOffset = employeeElevatorPlatformSize / 2 - 0.17;
  ([
    [-cableOffset, -cableOffset],
    [cableOffset, -cableOffset],
    [-cableOffset, cableOffset],
    [cableOffset, cableOffset],
  ] as Array<[number, number]>).forEach(([offsetX, offsetZ]) => {
    const cable = new Mesh(new CylinderGeometry(0.025, 0.025, 1, 8), elevatorCableMaterial);
    cable.position.set(employeeElevatorCenterX + offsetX, cableTopY - cableBaseLength / 2, employeeElevatorCenterZ + offsetZ);
    cable.scale.y = cableBaseLength;
    employeeElevatorCables.push(cable);
    employeeElevatorRoot.add(cable);
    const ceilingAnchor = new Mesh(new CylinderGeometry(0.085, 0.085, 0.055, 12), elevatorMetalMaterial);
    ceilingAnchor.position.set(employeeElevatorCenterX + offsetX, cableTopY + 0.025, employeeElevatorCenterZ + offsetZ);
    employeeElevatorRoot.add(ceilingAnchor);
  });

  const elevatorPoleX = employeeElevatorCenterX - employeeElevatorPlatformSize / 2 - 0.42;
  const elevatorPoleZ = employeeElevatorCenterZ;
  const elevatorPole = new Mesh(new CylinderGeometry(0.055, 0.07, 1.28, 12), elevatorMetalMaterial);
  elevatorPole.position.set(elevatorPoleX, 0.7, elevatorPoleZ);
  const elevatorButton = new Mesh(new CylinderGeometry(0.12, 0.12, 0.08, 18), elevatorButtonMaterial);
  elevatorButton.rotation.z = Math.PI / 2;
  elevatorButton.position.set(elevatorPoleX + 0.08, 1.18, elevatorPoleZ);
  const elevatorButtonPlate = new Mesh(new BoxGeometry(0.05, 0.42, 0.42), elevatorEdgeMaterial);
  elevatorButtonPlate.position.set(elevatorPoleX + 0.025, 1.18, elevatorPoleZ);
  employeeElevatorRoot.add(elevatorPole, elevatorButtonPlate, elevatorButton);

  const createBasementDirtFloorMaterial = (): MeshStandardMaterial => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#3e3023';
      context.fillRect(0, 0, canvas.width, canvas.height);
      for (let patch = 0; patch < 80; patch += 1) {
        const x = (patch * 47) % canvas.width;
        const y = (patch * 83) % canvas.height;
        const width = 8 + (patch * 11) % 28;
        const height = 4 + (patch * 7) % 20;
        context.fillStyle = patch % 3 === 0 ? 'rgba(91, 73, 52, 0.28)' : patch % 3 === 1 ? 'rgba(38, 29, 21, 0.32)' : 'rgba(122, 105, 77, 0.18)';
        context.fillRect(x, y, width, height);
      }
      for (let rock = 0; rock < 90; rock += 1) {
        const x = (rock * 61 + 13) % canvas.width;
        const y = (rock * 37 + 29) % canvas.height;
        const size = 1 + (rock % 4);
        context.fillStyle = rock % 2 === 0 ? 'rgba(122, 119, 105, 0.42)' : 'rgba(31, 29, 26, 0.35)';
        context.fillRect(x, y, size + 1, size);
      }
      context.fillStyle = 'rgba(10, 8, 6, 0.16)';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(2.4, 2.4);
    return new MeshStandardMaterial({
      map: texture,
      color: 0x7a6347,
      emissive: 0x080504,
      emissiveIntensity: 0.07,
      roughness: 0.98,
      metalness: 0,
    });
  };
  const basementFloorMaterial = createBasementDirtFloorMaterial();
  const basementWallMaterial = elevatorBrickMaterial;
  const basementFloor = new Mesh(
    new BoxGeometry(employeeElevatorBasementRoomWidth, 0.12, employeeElevatorBasementRoomDepth),
    basementFloorMaterial,
  );
  basementFloor.position.set(employeeElevatorCenterX, employeeElevatorBasementFloorY - 0.06, employeeElevatorCenterZ);
  basementFloor.receiveShadow = true;
  const floorPebbleMaterials = [
    new MeshStandardMaterial({ color: 0x756d5c, emissive: 0x050403, emissiveIntensity: 0.04, roughness: 0.94, metalness: 0.02 }),
    new MeshStandardMaterial({ color: 0x4e463a, emissive: 0x030302, emissiveIntensity: 0.04, roughness: 0.96, metalness: 0.01 }),
    new MeshStandardMaterial({ color: 0x87775d, emissive: 0x060403, emissiveIntensity: 0.04, roughness: 0.92, metalness: 0.01 }),
  ];
  for (let rock = 0; rock < 18; rock += 1) {
    const rockX = employeeElevatorCenterX - employeeElevatorBasementRoomWidth / 2 + 0.72 + ((rock * 1.17) % (employeeElevatorBasementRoomWidth - 1.44));
    const rockZ = employeeElevatorCenterZ - employeeElevatorBasementRoomDepth / 2 + 0.62 + ((rock * 0.91) % (employeeElevatorBasementRoomDepth - 1.24));
    if (Math.abs(rockX - employeeElevatorCenterX) < employeeElevatorPlatformSize * 0.62 && Math.abs(rockZ - employeeElevatorCenterZ) < employeeElevatorPlatformSize * 0.62) {
      continue;
    }
    const pebble = new Mesh(
      new BoxGeometry(0.08 + (rock % 3) * 0.035, 0.025 + (rock % 2) * 0.012, 0.055 + (rock % 4) * 0.02),
      floorPebbleMaterials[rock % floorPebbleMaterials.length],
    );
    pebble.position.set(rockX, employeeElevatorBasementFloorY + 0.015, rockZ);
    pebble.rotation.set(0.08 * (rock % 3), (rock * 0.73) % Math.PI, 0.04 * (rock % 5));
    employeeElevatorRoot.add(pebble);
  }
  const basementWallHeight = 3.15;
  const basementWallCenterY = employeeElevatorBasementFloorY + basementWallHeight / 2;
  const rottedBoardMaterial = new MeshStandardMaterial({
    color: 0x3f3123,
    emissive: 0x040302,
    emissiveIntensity: 0.05,
    roughness: 0.94,
    metalness: 0.02,
  });
  const splinterMaterial = new MeshStandardMaterial({
    color: 0x71583d,
    emissive: 0x060403,
    emissiveIntensity: 0.04,
    roughness: 0.9,
    metalness: 0,
  });
  const oldVineMaterial = new MeshStandardMaterial({
    color: 0x1f2f1e,
    emissive: 0x020501,
    emissiveIntensity: 0.08,
    roughness: 0.86,
    metalness: 0,
  });
  const rootStrandMaterial = new MeshStandardMaterial({
    color: 0x2c2118,
    emissive: 0x030201,
    emissiveIntensity: 0.08,
    roughness: 0.92,
    metalness: 0,
  });
  const basementWallMinX = employeeElevatorCenterX - employeeElevatorBasementRoomWidth / 2;
  const basementWallMaxX = employeeElevatorCenterX + employeeElevatorBasementRoomWidth / 2;
  const basementWallMinZ = employeeElevatorCenterZ - employeeElevatorBasementRoomDepth / 2;
  const basementWallMaxZ = employeeElevatorCenterZ + employeeElevatorBasementRoomDepth / 2;
  const basementHallwayCenterX = -256.07;
  const basementHallwayWidth = 2.48;
  const basementHallwayLength = GAME_CONFIG.player.sprintSpeed * 5;
  const basementHallwayMinX = basementHallwayCenterX - basementHallwayWidth / 2;
  const basementHallwayMaxX = basementHallwayCenterX + basementHallwayWidth / 2;
  const basementHallwayStartZ = basementWallMinZ - basementHallwayLength;
  const basementHallwayEndZ = basementWallMinZ + 0.08;
  const basementHallwayVisualStartZ = basementHallwayStartZ - 2.5;
  const basementHallwayVisualLength = basementHallwayEndZ - basementHallwayVisualStartZ;
  const basementHallwayCenterZ = (basementHallwayVisualStartZ + basementHallwayEndZ) / 2;
  const southBasementHallwayCenterX = -256.17;
  const southBasementHallwayWidth = 2.48;
  const southBasementHallwayLength = GAME_CONFIG.player.sprintSpeed * 10;
  const southBasementHallwayMinX = southBasementHallwayCenterX - southBasementHallwayWidth / 2;
  const southBasementHallwayMaxX = southBasementHallwayCenterX + southBasementHallwayWidth / 2;
  const southBasementHallwayStartZ = basementWallMaxZ - 0.08;
  const southBasementHallwayEndZ = basementWallMaxZ + southBasementHallwayLength;
  const southBasementHallwayCenterZ = (southBasementHallwayStartZ + southBasementHallwayEndZ) / 2;
  const basementHallwayBounds = [
    {
      minX: basementHallwayMinX + 0.5,
      maxX: basementHallwayMaxX - 0.5,
      minZ: basementHallwayStartZ + 1.75,
      maxZ: basementWallMinZ + 0.62,
    },
    {
      minX: southBasementHallwayMinX + 0.5,
      maxX: southBasementHallwayMaxX - 0.5,
      minZ: basementWallMaxZ - 0.62,
      maxZ: southBasementHallwayEndZ - 4.15,
    },
  ];
  let basementFlickerTime = 0;
  const basementFlickerLights: Array<{
    light: PointLight;
    material: MeshStandardMaterial;
    baseIntensity: number;
    phase: number;
    fault: number;
  }> = [];
  const basementFixtureMaterial = new MeshStandardMaterial({
    color: 0xd8d0bf,
    emissive: 0xffd8a4,
    emissiveIntensity: 0.45,
    roughness: 0.48,
    metalness: 0.18,
  });
  const addBasementFlickerFixture = (
    x: number,
    z: number,
    baseIntensity: number,
    phase: number,
    range = 15.5,
  ): void => {
    const material = basementFixtureMaterial.clone();
    const fixture = new Mesh(new BoxGeometry(0.72, 0.08, 0.34), material);
    fixture.position.set(x, employeeElevatorBasementFloorY + basementWallHeight - 0.12, z);
    const bulb = new Mesh(
      new SphereGeometry(0.12, 12, 8),
      new MeshStandardMaterial({
        color: 0xffe7bd,
        emissive: 0xffd8a4,
        emissiveIntensity: 0.8,
        roughness: 0.28,
        metalness: 0.02,
      }),
    );
    bulb.position.set(0, -0.08, 0);
    fixture.add(bulb);
    const light = new PointLight(0xffd8ac, baseIntensity, range, 1.58);
    light.position.set(x, employeeElevatorBasementFloorY + basementWallHeight - 0.62, z);
    basementFlickerLights.push({
      light,
      material,
      baseIntensity,
      phase,
      fault: 0.45 + (phase % 1.9),
    });
    employeeElevatorRoot.add(fixture, light);
  };
  const createHallwayRepeatedMaterial = (
    source: MeshStandardMaterial,
    repeatX: number,
    repeatY: number,
  ): MeshStandardMaterial => {
    const material = source.clone();
    if (material.map) {
      material.map = material.map.clone();
      material.map.repeat.set(repeatX, repeatY);
      material.map.needsUpdate = true;
    }
    return material;
  };
  const hallwayFloorMaterial = createHallwayRepeatedMaterial(
    basementFloorMaterial,
    1,
    Math.max(1, basementHallwayVisualLength / employeeElevatorBasementRoomDepth) * 1.8,
  );
  const hallwayCeilingMaterial = createHallwayRepeatedMaterial(
    basementCeilingMaterial,
    1,
    Math.max(1, basementHallwayVisualLength / employeeElevatorBasementRoomDepth) * 1.2,
  );
  const southHallwayFloorMaterial = createHallwayRepeatedMaterial(
    basementFloorMaterial,
    1,
    Math.max(1, southBasementHallwayLength / employeeElevatorBasementRoomDepth) * 1.8,
  );
  const southHallwayCeilingMaterial = createHallwayRepeatedMaterial(
    basementCeilingMaterial,
    1,
    Math.max(1, southBasementHallwayLength / employeeElevatorBasementRoomDepth) * 1.2,
  );
  const blockedBasementRoomWidth = 10.4;
  const blockedBasementRoomDepth = 8.8;
  const blockedBasementRoomHallLength = 5.4;
  const blockedBasementRoomMinX = southBasementHallwayCenterX - blockedBasementRoomWidth / 2;
  const blockedBasementRoomMaxX = southBasementHallwayCenterX + blockedBasementRoomWidth / 2;
  const blockedBasementRoomMinZ = southBasementHallwayEndZ + blockedBasementRoomHallLength;
  const blockedBasementRoomMaxZ = blockedBasementRoomMinZ + blockedBasementRoomDepth;
  const blockedBasementRoomCenterZ = (blockedBasementRoomMinZ + blockedBasementRoomMaxZ) / 2;
  const blockedHallwayCenterZ = southBasementHallwayEndZ + blockedBasementRoomHallLength / 2;
  const blockedHallwayFloorMaterial = createHallwayRepeatedMaterial(
    basementFloorMaterial,
    1,
    1.4,
  );
  const blockedHallwayCeilingMaterial = createHallwayRepeatedMaterial(
    basementCeilingMaterial,
    1,
    1.2,
  );
  const blockedRoomFloorMaterial = createHallwayRepeatedMaterial(
    basementFloorMaterial,
    2.6,
    2.2,
  );
  const blockedRoomCeilingMaterial = createHallwayRepeatedMaterial(
    basementCeilingMaterial,
    2.2,
    1.8,
  );
  const addSegmentedHallwayWall = (x: number, startZ: number, endZ: number): void => {
    const segmentLength = employeeElevatorBasementRoomDepth;
    let cursorZ = startZ;
    while (cursorZ < endZ - 0.02) {
      const nextZ = Math.min(cursorZ + segmentLength, endZ);
      const length = nextZ - cursorZ;
      const segment = new Mesh(new BoxGeometry(0.14, basementWallHeight, length), basementWallMaterial);
      segment.position.set(x, basementWallCenterY, cursorZ + length / 2);
      employeeElevatorRoot.add(segment);
      cursorZ = nextZ;
    }
  };
  const addBasementWallSegment = (wall: { x: number; z: number; sx: number; sz: number }): void => {
    const basementWall = new Mesh(new BoxGeometry(wall.sx, basementWallHeight, wall.sz), basementWallMaterial);
    basementWall.position.set(wall.x, basementWallCenterY, wall.z);
    employeeElevatorRoot.add(basementWall);
  };
  const addBasementWallSeamPost = (x: number, z: number, width = 0.34): void => {
    const seam = new Mesh(new BoxGeometry(width, basementWallHeight, width), basementWallMaterial);
    seam.position.set(x, basementWallCenterY, z);
    employeeElevatorRoot.add(seam);
  };
  [
    { x: basementWallMinX, z: employeeElevatorCenterZ, sx: 0.14, sz: employeeElevatorBasementRoomDepth },
    { x: basementWallMaxX, z: employeeElevatorCenterZ, sx: 0.14, sz: employeeElevatorBasementRoomDepth },
  ].forEach(addBasementWallSegment);
  const northLeftWidth = Math.max(0, basementHallwayMinX - basementWallMinX);
  const northRightWidth = Math.max(0, basementWallMaxX - basementHallwayMaxX);
  if (northLeftWidth > 0.08) {
    addBasementWallSegment({
      x: basementWallMinX + northLeftWidth / 2,
      z: basementWallMinZ,
      sx: northLeftWidth,
      sz: 0.14,
    });
  }
  if (northRightWidth > 0.08) {
    addBasementWallSegment({
      x: basementHallwayMaxX + northRightWidth / 2,
      z: basementWallMinZ,
      sx: northRightWidth,
      sz: 0.14,
    });
  }
  const southLeftWidth = Math.max(0, southBasementHallwayMinX - basementWallMinX);
  const southRightWidth = Math.max(0, basementWallMaxX - southBasementHallwayMaxX);
  if (southLeftWidth > 0.08) {
    addBasementWallSegment({
      x: basementWallMinX + southLeftWidth / 2,
      z: basementWallMaxZ,
      sx: southLeftWidth,
      sz: 0.14,
    });
  }
  if (southRightWidth > 0.08) {
    addBasementWallSegment({
      x: southBasementHallwayMaxX + southRightWidth / 2,
      z: basementWallMaxZ,
      sx: southRightWidth,
      sz: 0.14,
    });
  }
  [
    [basementWallMinX, basementWallMinZ],
    [basementWallMaxX, basementWallMinZ],
    [basementWallMinX, basementWallMaxZ],
    [basementWallMaxX, basementWallMaxZ],
    [basementHallwayMinX, basementHallwayVisualStartZ],
    [basementHallwayMaxX, basementHallwayVisualStartZ],
    [basementHallwayMinX, basementWallMinZ],
    [basementHallwayMaxX, basementWallMinZ],
    [southBasementHallwayMinX, basementWallMaxZ],
    [southBasementHallwayMaxX, basementWallMaxZ],
  ].forEach(([x, z]) => {
    addBasementWallSeamPost(x, z);
  });
  const hallwayHeader = new Mesh(new BoxGeometry(basementHallwayWidth, 0.46, 0.14), basementWallMaterial);
  hallwayHeader.position.set(basementHallwayCenterX, employeeElevatorBasementFloorY + basementWallHeight - 0.23, basementWallMinZ);
  const southHallwayHeader = new Mesh(new BoxGeometry(southBasementHallwayWidth, 0.46, 0.14), basementWallMaterial);
  southHallwayHeader.position.set(southBasementHallwayCenterX, employeeElevatorBasementFloorY + basementWallHeight - 0.23, basementWallMaxZ);
  employeeElevatorRoot.add(hallwayHeader);
  const hallwayFloor = new Mesh(
    new BoxGeometry(basementHallwayWidth, 0.1, basementHallwayVisualLength),
    hallwayFloorMaterial,
  );
  hallwayFloor.position.set(basementHallwayCenterX, employeeElevatorBasementFloorY - 0.055, basementHallwayCenterZ);
  hallwayFloor.receiveShadow = true;
  const hallwayCeiling = new Mesh(new BoxGeometry(basementHallwayWidth, 0.08, basementHallwayVisualLength), hallwayCeilingMaterial);
  hallwayCeiling.position.set(basementHallwayCenterX, employeeElevatorBasementFloorY + basementWallHeight, basementHallwayCenterZ);
  const southHallwayFloor = new Mesh(
    new BoxGeometry(southBasementHallwayWidth, 0.1, southBasementHallwayLength),
    southHallwayFloorMaterial,
  );
  southHallwayFloor.position.set(southBasementHallwayCenterX, employeeElevatorBasementFloorY - 0.055, southBasementHallwayCenterZ);
  southHallwayFloor.receiveShadow = true;
  const southHallwayCeiling = new Mesh(
    new BoxGeometry(southBasementHallwayWidth, 0.08, southBasementHallwayLength),
    southHallwayCeilingMaterial,
  );
  southHallwayCeiling.position.set(southBasementHallwayCenterX, employeeElevatorBasementFloorY + basementWallHeight, southBasementHallwayCenterZ);
  const blockedHallwayFloor = new Mesh(
    new BoxGeometry(southBasementHallwayWidth, 0.1, blockedBasementRoomHallLength),
    blockedHallwayFloorMaterial,
  );
  blockedHallwayFloor.position.set(southBasementHallwayCenterX, employeeElevatorBasementFloorY - 0.055, blockedHallwayCenterZ);
  blockedHallwayFloor.receiveShadow = true;
  const blockedHallwayCeiling = new Mesh(
    new BoxGeometry(southBasementHallwayWidth, 0.08, blockedBasementRoomHallLength),
    blockedHallwayCeilingMaterial,
  );
  blockedHallwayCeiling.position.set(southBasementHallwayCenterX, employeeElevatorBasementFloorY + basementWallHeight, blockedHallwayCenterZ);
  const blockedRoomFloor = new Mesh(
    new BoxGeometry(blockedBasementRoomWidth, 0.1, blockedBasementRoomDepth),
    blockedRoomFloorMaterial,
  );
  blockedRoomFloor.position.set(southBasementHallwayCenterX, employeeElevatorBasementFloorY - 0.055, blockedBasementRoomCenterZ);
  blockedRoomFloor.receiveShadow = true;
  const blockedRoomCeiling = new Mesh(
    new BoxGeometry(blockedBasementRoomWidth, 0.08, blockedBasementRoomDepth),
    blockedRoomCeilingMaterial,
  );
  blockedRoomCeiling.position.set(southBasementHallwayCenterX, employeeElevatorBasementFloorY + basementWallHeight, blockedBasementRoomCenterZ);
  employeeElevatorRoot.add(
    hallwayFloor,
    hallwayCeiling,
    southHallwayHeader,
    southHallwayFloor,
    southHallwayCeiling,
    blockedHallwayFloor,
    blockedHallwayCeiling,
    blockedRoomFloor,
    blockedRoomCeiling,
  );
  const northHallwayFarEndWall = new Mesh(new BoxGeometry(basementHallwayWidth, basementWallHeight, 0.16), basementWallMaterial);
  northHallwayFarEndWall.position.set(basementHallwayCenterX, basementWallCenterY, basementHallwayVisualStartZ);
  employeeElevatorRoot.add(northHallwayFarEndWall);
  addSegmentedHallwayWall(basementHallwayMinX, basementHallwayVisualStartZ, basementHallwayEndZ);
  addSegmentedHallwayWall(basementHallwayMaxX, basementHallwayVisualStartZ, basementHallwayEndZ);
  addSegmentedHallwayWall(southBasementHallwayMinX, southBasementHallwayStartZ, southBasementHallwayEndZ);
  addSegmentedHallwayWall(southBasementHallwayMaxX, southBasementHallwayStartZ, southBasementHallwayEndZ);
  addSegmentedHallwayWall(southBasementHallwayMinX, southBasementHallwayEndZ, blockedBasementRoomMinZ);
  addSegmentedHallwayWall(southBasementHallwayMaxX, southBasementHallwayEndZ, blockedBasementRoomMinZ);
  const blockedRoomSideWallDepth = blockedBasementRoomDepth;
  [
    { x: blockedBasementRoomMinX, z: blockedBasementRoomCenterZ, sx: 0.14, sz: blockedRoomSideWallDepth },
    { x: blockedBasementRoomMaxX, z: blockedBasementRoomCenterZ, sx: 0.14, sz: blockedRoomSideWallDepth },
    { x: southBasementHallwayCenterX, z: blockedBasementRoomMaxZ, sx: blockedBasementRoomWidth, sz: 0.14 },
    {
      x: blockedBasementRoomMinX + (southBasementHallwayMinX - blockedBasementRoomMinX) / 2,
      z: blockedBasementRoomMinZ,
      sx: southBasementHallwayMinX - blockedBasementRoomMinX,
      sz: 0.14,
    },
    {
      x: southBasementHallwayMaxX + (blockedBasementRoomMaxX - southBasementHallwayMaxX) / 2,
      z: blockedBasementRoomMinZ,
      sx: blockedBasementRoomMaxX - southBasementHallwayMaxX,
      sz: 0.14,
    },
  ].forEach(addBasementWallSegment);
  [
    [southBasementHallwayMinX, southBasementHallwayEndZ],
    [southBasementHallwayMaxX, southBasementHallwayEndZ],
    [southBasementHallwayMinX, blockedBasementRoomMinZ],
    [southBasementHallwayMaxX, blockedBasementRoomMinZ],
    [blockedBasementRoomMinX, blockedBasementRoomMinZ],
    [blockedBasementRoomMaxX, blockedBasementRoomMinZ],
    [blockedBasementRoomMinX, blockedBasementRoomMaxZ],
    [blockedBasementRoomMaxX, blockedBasementRoomMaxZ],
  ].forEach(([x, z]) => {
    addBasementWallSeamPost(x, z);
  });
  addBasementFlickerFixture(employeeElevatorCenterX + 1.3, employeeElevatorCenterZ - 1.7, 1.85, 0.2, 15.5);
  [
    basementWallMinZ - 5.5,
    basementWallMinZ - 17.5,
    basementWallMinZ - 31.5,
    basementWallMinZ - 45.5,
  ].filter((z) => z > basementHallwayStartZ + 3).forEach((z, index) => {
    addBasementFlickerFixture(
      basementHallwayCenterX,
      z,
      1.45 + (index % 2) * 0.28,
      0.75 + index * 0.63,
      14.5,
    );
  });
  [
    basementWallMaxZ + 7.5,
    basementWallMaxZ + 21.5,
    basementWallMaxZ + 37.5,
    basementWallMaxZ + 55.5,
    basementWallMaxZ + 74.5,
    basementWallMaxZ + 94.5,
  ].filter((z) => z < southBasementHallwayEndZ - 3).forEach((z, index) => {
    addBasementFlickerFixture(
      southBasementHallwayCenterX,
      z,
      1.5 + (index % 2) * 0.3,
      1.15 + index * 0.58,
      15.2,
    );
  });
  addBasementFlickerFixture(southBasementHallwayCenterX, blockedBasementRoomCenterZ, 1.1, 4.85, 13.5);
  const rubbleMaterial = new MeshStandardMaterial({
    color: 0x55514a,
    emissive: 0x060504,
    emissiveIntensity: 0.06,
    roughness: 0.96,
    metalness: 0.04,
  });
  const rubbleDirtMaterial = new MeshStandardMaterial({
    color: 0x3b2e22,
    emissive: 0x050302,
    emissiveIntensity: 0.05,
    roughness: 1,
    metalness: 0,
  });
  const caveInBack = new Mesh(new BoxGeometry(southBasementHallwayWidth + 1.55, 3.45, 1.48), rubbleDirtMaterial);
  caveInBack.position.set(southBasementHallwayCenterX, employeeElevatorBasementFloorY + 1.7, southBasementHallwayEndZ - 0.5);
  employeeElevatorRoot.add(caveInBack);
  for (let rock = 0; rock < 76; rock += 1) {
    const rockWidth = 0.38 + (rock % 5) * 0.17;
    const rockHeight = 0.24 + (rock % 5) * 0.15;
    const rockDepth = 0.34 + (rock % 6) * 0.15;
    const row = Math.floor(rock / 11);
    const rubble = new Mesh(new BoxGeometry(rockWidth, rockHeight, rockDepth), rock % 3 === 0 ? rubbleDirtMaterial : rubbleMaterial);
    rubble.position.set(
      southBasementHallwayMinX - 0.32 + ((rock * 0.57) % (southBasementHallwayWidth + 0.64)),
      employeeElevatorBasementFloorY + 0.16 + row * 0.31 + (rock % 2) * 0.08,
      southBasementHallwayEndZ - 3.15 + ((rock * 0.43) % 2.9),
    );
    rubble.rotation.set((rock % 4) * 0.18, (rock * 0.49) % Math.PI, (rock % 5) * 0.12);
    employeeElevatorRoot.add(rubble);
  }
  const getBasementWallPoint = (
    side: 'north' | 'south' | 'west' | 'east',
    along: number,
    y: number,
    offset = 0.24,
  ): Vector3 => {
    if (side === 'north') {
      return new Vector3(along, y, basementWallMinZ + offset);
    }
    if (side === 'south') {
      return new Vector3(along, y, basementWallMaxZ - offset);
    }
    if (side === 'west') {
      return new Vector3(basementWallMinX + offset, y, along);
    }
    return new Vector3(basementWallMaxX - offset, y, along);
  };
  const addBasementVine = (
    side: 'north' | 'south' | 'west' | 'east',
    points: Array<[number, number]>,
    radius: number,
    material: MeshStandardMaterial,
  ): void => {
    const curve = new CatmullRomCurve3(points.map(([along, y]) => getBasementWallPoint(side, along, y)));
    const vine = new Mesh(new TubeGeometry(curve, 24, radius, 7, false), material);
    employeeElevatorRoot.add(vine);
  };
  addBasementVine('north', [
    [employeeElevatorCenterX - 2.58, employeeElevatorBasementFloorY + 2.8],
    [employeeElevatorCenterX - 2.2, employeeElevatorBasementFloorY + 2.16],
    [employeeElevatorCenterX - 1.58, employeeElevatorBasementFloorY + 1.6],
    [employeeElevatorCenterX - 0.84, employeeElevatorBasementFloorY + 1.02],
  ], 0.035, oldVineMaterial);
  addBasementVine('south', [
    [employeeElevatorCenterX + 2.55, employeeElevatorBasementFloorY + 2.72],
    [employeeElevatorCenterX + 1.92, employeeElevatorBasementFloorY + 2.2],
    [employeeElevatorCenterX + 1.52, employeeElevatorBasementFloorY + 1.46],
    [employeeElevatorCenterX + 0.74, employeeElevatorBasementFloorY + 0.94],
  ], 0.04, oldVineMaterial);
  addBasementVine('east', [
    [employeeElevatorCenterZ - 2.18, employeeElevatorBasementFloorY + 2.78],
    [employeeElevatorCenterZ - 1.68, employeeElevatorBasementFloorY + 2.08],
    [employeeElevatorCenterZ - 2.08, employeeElevatorBasementFloorY + 1.44],
    [employeeElevatorCenterZ - 1.36, employeeElevatorBasementFloorY + 0.88],
  ], 0.024, rootStrandMaterial);
  [
    ['north', employeeElevatorCenterX - 1.36, employeeElevatorBasementFloorY + 1.36],
    ['south', employeeElevatorCenterX + 1.72, employeeElevatorBasementFloorY + 1.86],
  ].forEach(([side, along, y]) => {
    const leaf = new Mesh(new SphereGeometry(0.055, 8, 6), oldVineMaterial);
    leaf.scale.set(1.35, 0.48, 0.72);
    leaf.position.copy(getBasementWallPoint(side as 'north' | 'south', along as number, y as number, 0.3));
    employeeElevatorRoot.add(leaf);
  });
  const basementPad = new Mesh(
    new BoxGeometry(employeeElevatorPlatformSize + 0.18, 0.08, employeeElevatorPlatformSize + 0.18),
    elevatorMetalMaterial,
  );
  basementPad.position.set(employeeElevatorCenterX, employeeElevatorBasementFloorY + 0.045, employeeElevatorCenterZ);
  const basementCeilingY = employeeElevatorBasementFloorY + basementWallHeight;
  const shaftWallTopY = 0.02;
  const shaftInnerSize = employeeElevatorPlatformSize + 0.5;
  const basementShaftOpeningSize = shaftInnerSize + 0.26;
  const basementOpeningMinX = employeeElevatorCenterX - basementShaftOpeningSize / 2;
  const basementOpeningMaxX = employeeElevatorCenterX + basementShaftOpeningSize / 2;
  const basementOpeningMinZ = employeeElevatorCenterZ - basementShaftOpeningSize / 2;
  const basementOpeningMaxZ = employeeElevatorCenterZ + basementShaftOpeningSize / 2;
  const addBasementCeilingSegment = (minX: number, maxX: number, minZ: number, maxZ: number): void => {
    const width = maxX - minX;
    const depth = maxZ - minZ;
    if (width <= 0.05 || depth <= 0.05) {
      return;
    }

    const ceilingSegment = new Mesh(new BoxGeometry(width, 0.08, depth), basementCeilingMaterial);
    ceilingSegment.position.set((minX + maxX) / 2, basementCeilingY, (minZ + maxZ) / 2);
    employeeElevatorRoot.add(ceilingSegment);
  };
  addBasementCeilingSegment(
    employeeElevatorCenterX - employeeElevatorBasementRoomWidth / 2,
    basementOpeningMinX,
    employeeElevatorCenterZ - employeeElevatorBasementRoomDepth / 2,
    employeeElevatorCenterZ + employeeElevatorBasementRoomDepth / 2,
  );
  addBasementCeilingSegment(
    basementOpeningMaxX,
    employeeElevatorCenterX + employeeElevatorBasementRoomWidth / 2,
    employeeElevatorCenterZ - employeeElevatorBasementRoomDepth / 2,
    employeeElevatorCenterZ + employeeElevatorBasementRoomDepth / 2,
  );
  addBasementCeilingSegment(
    basementOpeningMinX,
    basementOpeningMaxX,
    employeeElevatorCenterZ - employeeElevatorBasementRoomDepth / 2,
    basementOpeningMinZ,
  );
  addBasementCeilingSegment(
    basementOpeningMinX,
    basementOpeningMaxX,
    basementOpeningMaxZ,
    employeeElevatorCenterZ + employeeElevatorBasementRoomDepth / 2,
  );
  const addRottenCeilingBoard = (
    x: number,
    z: number,
    length: number,
    width: number,
    rotationY: number,
    sag: number,
  ): void => {
    const board = new Mesh(new BoxGeometry(length, 0.045, width), rottedBoardMaterial);
    board.position.set(x, basementCeilingY - 0.09 - sag * 0.5, z);
    board.rotation.set(sag, rotationY, sag * 0.35);
    const splinter = new Mesh(new BoxGeometry(length * 0.34, 0.03, width * 0.34), splinterMaterial);
    splinter.position.set(length * 0.22, -0.035, width * 0.28);
    splinter.rotation.y = 0.18;
    board.add(splinter);
    employeeElevatorRoot.add(board);
  };
  [
    [employeeElevatorCenterX - 2.45, employeeElevatorCenterZ - 1.72, 1.45, 0.24, 0.05, 0.18],
    [employeeElevatorCenterX + 2.1, employeeElevatorCenterZ - 1.9, 1.1, 0.22, -0.12, 0.28],
    [employeeElevatorCenterX - 1.82, employeeElevatorCenterZ + 2.05, 1.25, 0.2, Math.PI / 2 + 0.08, 0.22],
    [employeeElevatorCenterX + 1.55, employeeElevatorCenterZ + 1.72, 1.38, 0.22, Math.PI / 2 - 0.1, 0.14],
  ].forEach(([x, z, length, width, rotationY, sag]) => {
    addRottenCeilingBoard(x, z, length, width, rotationY, sag);
  });
  [
    [employeeElevatorCenterX - 2.3, employeeElevatorCenterZ + 0.92, 1.08, 0.18, 0.42],
    [employeeElevatorCenterX + 2.0, employeeElevatorCenterZ - 0.62, 0.82, 0.16, -0.36],
    [employeeElevatorCenterX + 0.85, employeeElevatorCenterZ + 2.16, 0.7, 0.14, 0.12],
  ].forEach(([x, z, length, width, rotationY]) => {
    const debris = new Mesh(new BoxGeometry(length, 0.055, width), rottedBoardMaterial);
    debris.position.set(x, employeeElevatorBasementFloorY + 0.035, z);
    debris.rotation.y = rotationY;
    employeeElevatorRoot.add(debris);
  });
  const shaftWallBottomY = basementCeilingY;
  const shaftWallHeight = shaftWallTopY - shaftWallBottomY;
  const shaftWallCenterY = shaftWallBottomY + shaftWallHeight / 2;
  const shaftWallThickness = 0.18;
  const employeeElevatorShaftWalls: Mesh[] = [];
  [
    { x: employeeElevatorCenterX, z: employeeElevatorCenterZ - shaftInnerSize / 2, sx: shaftInnerSize + shaftWallThickness * 2, sz: shaftWallThickness },
    { x: employeeElevatorCenterX, z: employeeElevatorCenterZ + shaftInnerSize / 2, sx: shaftInnerSize + shaftWallThickness * 2, sz: shaftWallThickness },
    { x: employeeElevatorCenterX - shaftInnerSize / 2, z: employeeElevatorCenterZ, sx: shaftWallThickness, sz: shaftInnerSize },
    { x: employeeElevatorCenterX + shaftInnerSize / 2, z: employeeElevatorCenterZ, sx: shaftWallThickness, sz: shaftInnerSize },
  ].forEach((wall) => {
    const shaftWall = new Mesh(new BoxGeometry(wall.sx, shaftWallHeight, wall.sz), elevatorBrickMaterial);
    shaftWall.position.set(wall.x, shaftWallCenterY, wall.z);
    employeeElevatorShaftWalls.push(shaftWall);
    employeeElevatorRoot.add(shaftWall);
  });
  const shaftLightStrips = [
    { x: employeeElevatorCenterX - shaftInnerSize / 2 + 0.04, z: employeeElevatorCenterZ - shaftInnerSize / 2 + 0.06, sx: 0.035, sz: 0.045 },
    { x: employeeElevatorCenterX + shaftInnerSize / 2 - 0.04, z: employeeElevatorCenterZ + shaftInnerSize / 2 - 0.06, sx: 0.035, sz: 0.045 },
  ].map((strip) => {
    const lightStrip = new Mesh(new BoxGeometry(strip.sx, shaftWallHeight - 0.72, strip.sz), elevatorShaftLightMaterial);
    lightStrip.position.set(strip.x, shaftWallBottomY + shaftWallHeight / 2 + 0.12, strip.z);
    return lightStrip;
  });
  const shaftGlowTop = new PointLight(0xffd8a4, 0.72, 7.8, 1.7);
  shaftGlowTop.position.set(employeeElevatorCenterX, -1.45, employeeElevatorCenterZ);
  const shaftGlowLower = new PointLight(0xffd8a4, 0.62, 7.2, 1.8);
  shaftGlowLower.position.set(employeeElevatorCenterX, shaftWallBottomY + 0.72, employeeElevatorCenterZ);
  const basementFixture = new Mesh(new BoxGeometry(0.78, 0.08, 0.36), panelMaterial);
  basementFixture.position.set(employeeElevatorCenterX + 2.2, employeeElevatorBasementFloorY + 2.7, employeeElevatorCenterZ - 2.3);
  const basementGlow = new PointLight(0xffd8ac, 1.75, 12.5, 1.7);
  basementGlow.position.set(employeeElevatorCenterX + 1.8, employeeElevatorBasementFloorY + 2.22, employeeElevatorCenterZ - 1.9);
  const basementElevatorPole = new Mesh(new CylinderGeometry(0.055, 0.07, 1.28, 12), elevatorMetalMaterial);
  basementElevatorPole.position.set(elevatorPoleX, employeeElevatorBasementFloorY + 0.7, elevatorPoleZ);
  const basementElevatorButton = new Mesh(new CylinderGeometry(0.12, 0.12, 0.08, 18), elevatorButtonMaterial);
  basementElevatorButton.rotation.z = Math.PI / 2;
  basementElevatorButton.position.set(elevatorPoleX + 0.08, employeeElevatorBasementFloorY + 1.18, elevatorPoleZ);
  const basementElevatorButtonPlate = new Mesh(new BoxGeometry(0.05, 0.42, 0.42), elevatorEdgeMaterial);
  basementElevatorButtonPlate.position.set(elevatorPoleX + 0.025, employeeElevatorBasementFloorY + 1.18, elevatorPoleZ);
  employeeElevatorRoot.add(
    basementFloor,
    basementPad,
    ...shaftLightStrips,
    shaftGlowTop,
    shaftGlowLower,
    basementFixture,
    basementGlow,
    basementElevatorPole,
    basementElevatorButtonPlate,
    basementElevatorButton,
  );
  root.add(employeeElevatorRoot);
  const employeeElevator: OfficeChapterEmployeeElevator = {
    label: 'Employees Only Elevator',
    root: employeeElevatorRoot,
    platform: employeeElevatorPlatform,
    interactPosition: new Vector3(elevatorPoleX + 0.48, 1.18, elevatorPoleZ),
    lowerInteractPosition: new Vector3(elevatorPoleX + 0.48, employeeElevatorBasementFloorY + 1.18, elevatorPoleZ),
    topPosition: new Vector3(employeeElevatorCenterX, GAME_CONFIG.player.height, employeeElevatorCenterZ),
    lowerPosition: new Vector3(employeeElevatorCenterX, employeeElevatorLowerEyeY, employeeElevatorCenterZ),
    lowerLookTarget: new Vector3(employeeElevatorCenterX, employeeElevatorLowerEyeY, employeeElevatorCenterZ + 4),
    lowerHalfWidth: employeeElevatorBasementRoomWidth / 2 - 0.72,
    lowerHalfDepth: employeeElevatorBasementRoomDepth / 2 - 0.72,
    lowerHallwayBounds: basementHallwayBounds,
    button: elevatorButton,
    buttonRestX: elevatorButton.position.x,
    lowerButton: basementElevatorButton,
    lowerButtonRestX: basementElevatorButton.position.x,
    cables: employeeElevatorCables,
    shaftWalls: employeeElevatorShaftWalls,
    shaftWallHeight,
    shaftWallTopY,
    cableTopY,
    cableBaseLength,
    platformHomeY: employeeElevatorPlatformHomeY,
  };

  const storageClosetShelfMaterial = new MeshStandardMaterial({
    color: 0x3a2f27,
    emissive: 0x0c0705,
    emissiveIntensity: 0.1,
    roughness: 0.68,
    metalness: 0.08,
  });
  const storageClosetSupplyMaterial = new MeshStandardMaterial({
    color: 0xf3df76,
    emissive: 0x3c2e07,
    emissiveIntensity: 0.12,
    roughness: 0.44,
    metalness: 0.02,
  });
  const storageClosetBottleMaterial = new MeshStandardMaterial({
    color: 0x48a6d5,
    emissive: 0x0a3852,
    emissiveIntensity: 0.16,
    roughness: 0.32,
    metalness: 0.04,
  });
  const storageClosetPipeMaterial = new MeshStandardMaterial({
    color: 0x9aa7ad,
    emissive: 0x10191c,
    emissiveIntensity: 0.1,
    roughness: 0.24,
    metalness: 0.74,
  });
  const storageClosetWaterMaterial = new MeshStandardMaterial({
    color: 0x67c7ff,
    emissive: 0x278bd1,
    emissiveIntensity: 0.44,
    roughness: 0.14,
    metalness: 0.02,
    transparent: true,
    opacity: 0.66,
  });
  const storageClosetShelfRoot = new Group();
  const storageShelfX = storageClosetWestX + 0.7;
  [0.72, 1.42, 2.12].forEach((shelfY) => {
    const shelf = new Mesh(new BoxGeometry(0.55, 0.08, storageClosetDepth - 1.0), storageClosetShelfMaterial);
    shelf.position.set(storageShelfX, shelfY, storageClosetCenterZ);
    storageClosetShelfRoot.add(shelf);
  });
  [storageClosetMinZ + 0.72, storageClosetCenterZ, storageClosetMaxZ - 0.72].forEach((supportZ) => {
    const support = new Mesh(new BoxGeometry(0.08, 1.72, 0.08), storageClosetPipeMaterial);
    support.position.set(storageShelfX - 0.22, 1.42, supportZ);
    storageClosetShelfRoot.add(support);
  });
  [-1.45, -0.82, -0.18, 0.55, 1.24].forEach((offsetZ, index) => {
    const bottle = new Mesh(new CylinderGeometry(0.11, 0.13, 0.44, 12), index % 2 === 0 ? storageClosetBottleMaterial : storageClosetSupplyMaterial);
    bottle.position.set(storageShelfX + 0.06, 2.39, storageClosetCenterZ + offsetZ);
    const cap = new Mesh(new CylinderGeometry(0.055, 0.055, 0.08, 10), storageClosetPipeMaterial);
    cap.position.set(storageShelfX + 0.06, 2.65, storageClosetCenterZ + offsetZ);
    storageClosetShelfRoot.add(bottle, cap);
  });
  root.add(storageClosetShelfRoot);
  addCollider(colliders, storageShelfX, storageClosetCenterZ, 0.84, storageClosetDepth - 0.74);

  const storageBucket = new Group();
  storageBucket.position.set(storageClosetCenterX + 0.82, 0, storageClosetMinZ + 0.92);
  const bucketBody = new Mesh(new CylinderGeometry(0.38, 0.3, 0.42, 18), storageClosetSupplyMaterial);
  bucketBody.position.y = 0.24;
  const bucketRim = new Mesh(new TorusGeometry(0.35, 0.025, 8, 20), storageClosetPipeMaterial);
  bucketRim.position.y = 0.46;
  const mopHandle = new Mesh(new CylinderGeometry(0.025, 0.025, 1.92, 8), storageClosetPipeMaterial);
  mopHandle.position.set(-0.34, 1.1, 0.12);
  mopHandle.rotation.z = -0.28;
  const broomHandle = new Mesh(new CylinderGeometry(0.024, 0.024, 1.78, 8), storageClosetPipeMaterial);
  broomHandle.position.set(0.32, 1.02, -0.08);
  broomHandle.rotation.z = 0.22;
  const broomHead = new Mesh(new BoxGeometry(0.34, 0.14, 0.08), storageClosetSupplyMaterial);
  broomHead.position.set(0.52, 0.16, -0.18);
  storageBucket.add(bucketBody, bucketRim, mopHandle, broomHandle, broomHead);
  root.add(storageBucket);
  addCollider(colliders, storageBucket.position.x, storageBucket.position.z, 0.82, 0.82);

  const storagePipeNorth = new Mesh(new CylinderGeometry(0.07, 0.07, storageClosetWidth - 0.82, 14), storageClosetPipeMaterial);
  storagePipeNorth.position.set(storageClosetCenterX, 2.9, storageClosetMinZ + 0.38);
  storagePipeNorth.rotation.z = Math.PI / 2;
  const storagePipeBack = new Mesh(new CylinderGeometry(0.06, 0.06, storageClosetDepth - 0.7, 14), storageClosetPipeMaterial);
  storagePipeBack.position.set(storageClosetWestX + 0.36, 2.42, storageClosetCenterZ);
  storagePipeBack.rotation.x = Math.PI / 2;
  const storagePipeVertical = new Mesh(new CylinderGeometry(0.065, 0.065, 2.25, 14), storageClosetPipeMaterial);
  storagePipeVertical.position.set(storageClosetWestX + 0.36, 1.48, storageClosetMaxZ - 0.62);
  const storageLeakyPipe = new Mesh(new CylinderGeometry(0.055, 0.055, 2.72, 14), storageClosetPipeMaterial);
  storageLeakyPipe.position.set(storageClosetCenterX + 0.25, 2.56, storageClosetCenterZ + 0.6);
  storageLeakyPipe.rotation.x = Math.PI / 2;
  const storageLeakStream = new Mesh(new CylinderGeometry(0.018, 0.025, 1.86, 8), storageClosetWaterMaterial);
  storageLeakStream.position.set(storageClosetCenterX + 0.25, 1.52, storageClosetCenterZ + 0.6);
  const storageLeakPuddle = new Mesh(new CylinderGeometry(0.54, 0.5, 0.018, 24), storageClosetWaterMaterial);
  storageLeakPuddle.position.set(storageClosetCenterX + 0.25, 0.018, storageClosetCenterZ + 0.6);
  storageLeakPuddle.scale.z = 0.58;
  const storageLeakDroplets = [0, 1, 2].map((index) => {
    const droplet = new Mesh(new SphereGeometry(0.055, 10, 8), storageClosetWaterMaterial);
    droplet.position.set(storageClosetCenterX + 0.25, 2.28 - index * 0.48, storageClosetCenterZ + 0.6);
    root.add(droplet);
    return droplet;
  });
  root.add(
    storagePipeNorth,
    storagePipeBack,
    storagePipeVertical,
    storageLeakyPipe,
    storageLeakStream,
    storageLeakPuddle,
  );

  const fuseBoxFrameMaterial = new MeshStandardMaterial({
    color: 0x3f4648,
    emissive: 0x070b0c,
    emissiveIntensity: 0.14,
    roughness: 0.38,
    metalness: 0.56,
  });
  const fuseBoxDoorMaterial = new MeshStandardMaterial({
    color: 0x6f777a,
    emissive: 0x101416,
    emissiveIntensity: 0.18,
    roughness: 0.34,
    metalness: 0.68,
  });
  const fuseBoxInsideMaterial = new MeshStandardMaterial({
    color: 0x171b1d,
    emissive: 0x050707,
    emissiveIntensity: 0.22,
    roughness: 0.52,
    metalness: 0.24,
  });
  const fuseBoxLeverMaterial = new MeshStandardMaterial({
    color: 0xc0c8ca,
    emissive: 0x171f20,
    emissiveIntensity: 0.18,
    roughness: 0.28,
    metalness: 0.74,
  });
  const fuseBoxLeverGripMaterial = new MeshStandardMaterial({
    color: 0xffd44a,
    emissive: 0x7a4c00,
    emissiveIntensity: 0.44,
    roughness: 0.34,
    metalness: 0.08,
  });
  const fuseBoxLeverPlateMaterial = new MeshStandardMaterial({
    color: 0x101315,
    emissive: 0x030405,
    emissiveIntensity: 0.2,
    roughness: 0.5,
    metalness: 0.18,
  });
  const fuseBoxStatusLightMaterial = new MeshStandardMaterial({
    color: 0xff3a2e,
    emissive: 0xff2a1f,
    emissiveIntensity: 0.72,
    roughness: 0.28,
    metalness: 0.02,
  });
  const storageFuseBoxRoot = new Group();
  storageFuseBoxRoot.position.set(northPartySideRoomMinX + 0.09, 1.54, 136.33);
  storageFuseBoxRoot.rotation.y = -Math.PI / 2;
  const fuseBack = new Mesh(new BoxGeometry(1.32, 1.06, 0.08), fuseBoxInsideMaterial);
  const fuseFrameTop = new Mesh(new BoxGeometry(1.44, 0.08, 0.12), fuseBoxFrameMaterial);
  fuseFrameTop.position.set(0, 0.57, -0.01);
  const fuseFrameBottom = fuseFrameTop.clone();
  fuseFrameBottom.position.y = -0.57;
  const fuseFrameLeft = new Mesh(new BoxGeometry(0.08, 1.16, 0.12), fuseBoxFrameMaterial);
  fuseFrameLeft.position.set(-0.72, 0, -0.01);
  const fuseFrameRight = fuseFrameLeft.clone();
  fuseFrameRight.position.x = 0.72;
  const fuseStatusLight = new Mesh(new SphereGeometry(0.075, 14, 10), fuseBoxStatusLightMaterial);
  fuseStatusLight.position.set(0.52, 0.42, -0.1);
  const storageFuseBoxDoorPivot = new Group();
  storageFuseBoxDoorPivot.position.set(-0.69, 0, -0.1);
  const storageFuseBoxDoor = new Mesh(new BoxGeometry(1.34, 1.08, 0.055), fuseBoxDoorMaterial);
  storageFuseBoxDoor.position.set(0.67, 0, -0.02);
  const storageFuseBoxDoorHandle = new Mesh(new BoxGeometry(0.055, 0.28, 0.08), fuseBoxFrameMaterial);
  storageFuseBoxDoorHandle.position.set(1.21, 0, -0.08);
  storageFuseBoxDoorPivot.add(storageFuseBoxDoor, storageFuseBoxDoorHandle);
  const fuseBoxLeverPlate = new Mesh(new BoxGeometry(0.38, 0.62, 0.045), fuseBoxLeverPlateMaterial);
  fuseBoxLeverPlate.position.set(1.06, -0.16, -0.135);
  const storageFuseBoxLeverPivot = new Group();
  storageFuseBoxLeverPivot.position.set(1.06, 0.08, -0.18);
  const leverStem = new Mesh(new BoxGeometry(0.085, 0.56, 0.085), fuseBoxLeverMaterial);
  leverStem.position.y = -0.28;
  const leverGrip = new Mesh(new SphereGeometry(0.18, 18, 12), fuseBoxLeverGripMaterial);
  leverGrip.position.y = -0.58;
  storageFuseBoxLeverPivot.add(leverStem, leverGrip);
  const fuseWireMaterials: Record<OfficeChapterStorageFuseWireColor, MeshStandardMaterial> = {
    green: new MeshStandardMaterial({ color: 0x35c46d, emissive: 0x0b4d22, emissiveIntensity: 0.24, roughness: 0.36, metalness: 0.02 }),
    blue: new MeshStandardMaterial({ color: 0x3396ff, emissive: 0x083b7a, emissiveIntensity: 0.26, roughness: 0.34, metalness: 0.02 }),
    red: new MeshStandardMaterial({ color: 0xff4638, emissive: 0x7a100b, emissiveIntensity: 0.28, roughness: 0.36, metalness: 0.02 }),
  };
  const fuseOutletOffMaterials: Record<OfficeChapterStorageFuseWireColor, MeshStandardMaterial> = {
    green: new MeshStandardMaterial({ color: 0x17462b, emissive: 0x06160c, emissiveIntensity: 0.12, roughness: 0.44, metalness: 0.08 }),
    blue: new MeshStandardMaterial({ color: 0x183d6d, emissive: 0x061327, emissiveIntensity: 0.12, roughness: 0.44, metalness: 0.08 }),
    red: new MeshStandardMaterial({ color: 0x61221d, emissive: 0x230807, emissiveIntensity: 0.12, roughness: 0.44, metalness: 0.08 }),
  };
  const fuseWireRows: Array<{ color: OfficeChapterStorageFuseWireColor; y: number }> = [
    { color: 'green', y: 0.24 },
    { color: 'blue', y: 0 },
    { color: 'red', y: -0.24 },
  ];
  const fuseWires = fuseWireRows.reduce((wires, row) => {
    const leftPost = new Mesh(new CylinderGeometry(0.055, 0.055, 0.06, 12), fuseWireMaterials[row.color]);
    leftPost.position.set(-0.44, row.y, -0.12);
    leftPost.rotation.x = Math.PI / 2;
    const outlet = new Mesh(new CylinderGeometry(0.072, 0.072, 0.075, 14), fuseOutletOffMaterials[row.color]);
    outlet.position.set(0.34, row.y, -0.13);
    outlet.rotation.x = Math.PI / 2;
    const loose = new Mesh(new CylinderGeometry(0.025, 0.025, 0.64, 10), fuseWireMaterials[row.color]);
    loose.position.set(-0.19, row.y - 0.14, -0.14);
    loose.rotation.z = Math.PI / 2.65;
    const connected = new Mesh(new CylinderGeometry(0.025, 0.025, 0.78, 10), fuseWireMaterials[row.color]);
    connected.position.set(-0.05, row.y, -0.15);
    connected.rotation.z = Math.PI / 2;
    connected.visible = false;
    storageFuseBoxRoot.add(leftPost, outlet, loose, connected);
    wires[row.color] = {
      color: row.color,
      loose,
      connected,
      outletMaterial: fuseOutletOffMaterials[row.color],
    };
    return wires;
  }, {} as Record<OfficeChapterStorageFuseWireColor, OfficeChapterStorageFuseBoxWire>);
  storageFuseBoxRoot.add(
    fuseBack,
    fuseFrameTop,
    fuseFrameBottom,
    fuseFrameLeft,
    fuseFrameRight,
    fuseStatusLight,
    fuseBoxLeverPlate,
    storageFuseBoxDoorPivot,
    storageFuseBoxLeverPivot,
  );
  storageFuseBoxRoot.visible = false;
  const storageFuseBox: OfficeChapterStorageFuseBox = {
    label: 'Ball Pit Fuse Box',
    root: storageFuseBoxRoot,
    interactPosition: new Vector3(northPartySideRoomMinX + 0.86, 1.52, 136.33),
    doorPivot: storageFuseBoxDoorPivot,
    leverPivot: storageFuseBoxLeverPivot,
    statusLightMaterial: fuseBoxStatusLightMaterial,
    wires: fuseWires,
    open: false,
    openAmount: 0,
    targetOpenAmount: 0,
    leverPulled: false,
    leverAmount: 0,
    targetLeverAmount: 0,
  };

  const storageClosetLight = new PointLight(0xa8d7ff, 0.58, 7.5, 1.7);
  storageClosetLight.position.set(storageClosetCenterX, 3.05, storageClosetCenterZ);
  const storageClosetLightFixture = new Mesh(new BoxGeometry(0.74, 0.1, 0.32), panelMaterial);
  storageClosetLightFixture.position.set(storageClosetCenterX, WALL_HEIGHT - 0.16, storageClosetCenterZ);
  root.add(storageClosetLight, storageClosetLightFixture);
  let storageClosetLeakTime = 0;

  const ventSystem = createOfficeVentSystem(-239.29, 148.35);
  root.add(ventSystem.root);

  [
    { x: backstageHallCenterX, z: backstageHallCenterZ + 1.25, intensity: 0.9 },
    { x: backstageStorageCenterX - 2.2, z: backstageStorageCenterZ - 0.9, intensity: 1.05 },
    { x: backstageStorageCenterX + 3.4, z: backstageStorageCenterZ + 1.2, intensity: 0.86 },
  ].forEach((light) => {
    const fixture = new Mesh(new BoxGeometry(0.9, 0.12, 0.42), stageLightMaterial);
    fixture.position.set(light.x, WALL_HEIGHT - 0.16, light.z);
    const glow = new PointLight(0xffc781, light.intensity, 11, 1.6);
    glow.position.set(light.x, WALL_HEIGHT - 0.78, light.z);
    root.add(fixture, glow);
  });

  const securityCameras = [
    createSwivelingSecurityCamera(
      12,
      'Camera 1 Office',
      new Vector3(-239.79, 3.72, 178.95),
      new Vector3(0, 0, 1),
    ),
    createSwivelingSecurityCamera(
      4,
      'Camera 2 Left Hall',
      new Vector3(-229.57, 3.42, 186.75),
      new Vector3(0, 0, -1),
    ),
    createSwivelingSecurityCamera(
      1,
      'Camera 3 Right Hall',
      new Vector3(-250.22, 3.25, 186.75),
      new Vector3(0, 0, -1),
    ),
    createSwivelingSecurityCamera(
      6,
      'Camera 4 Main Party Room Stage',
      new Vector3(-237.90, 3.57, 153.65),
      new Vector3(0, 0, -1),
    ),
    createSwivelingSecurityCamera(
      2,
      'Camera 5 Bathroom',
      new Vector3(-271.37, 3.29, 160.38),
      new Vector3(1, 0, 0),
    ),
    createSwivelingSecurityCamera(
      3,
      'Camera 6 Main Party Room Wide',
      new Vector3(-242.18, 3.26, 156.45),
      new Vector3(0, 0, 1),
    ),
    createSwivelingSecurityCamera(
      5,
      "Camera 7 Foxy's Area",
      new Vector3(-194.85, 3.25, 154.36),
      new Vector3(-1, 0, 0),
    ),
    createSwivelingSecurityCamera(
      7,
      'Camera 8 Ball Pit Room',
      new Vector3(-224.30, 3.20, 143.80),
      new Vector3(1, 0, 0),
    ),
    createSwivelingSecurityCamera(
      11,
      'Camera 9 Kitchen',
      new Vector3(-227.80, 3.46, 135.39),
      new Vector3(-1, 0, 0),
    ),
    createSwivelingSecurityCamera(
      14,
      abandonedStraightHalls ? 'Camera 10 Storage Closet' : 'Camera 10 Storage Hall',
      abandonedStraightHalls
        ? new Vector3(storageClosetCenterX, 2.72, storageClosetSouthZ - 0.08)
        : new Vector3(-255.42, 2.58, 151.20),
      abandonedStraightHalls ? new Vector3(0, 0, -1) : new Vector3(0, 0, 1),
    ),
    createSwivelingSecurityCamera(
      9,
      "Camera 11 Foxy's Stage Wall",
      new Vector3(-194.91, 3.00, 155.15),
      new Vector3(-1, 0, 0),
    ),
    createSwivelingSecurityCamera(
      10,
      'Camera 12 Ball Pit Entry',
      new Vector3(-222.10, 3.59, 143.62),
      new Vector3(1, 0, 0),
    ),
    createSwivelingSecurityCamera(
      13,
      'Camera 13 Suit Storage',
      new Vector3(backstageStorageCenterX, 3.45, backstageStorageMaxZ - 0.08),
      new Vector3(0, 0, -1),
    ),
    ...(abandonedStraightHalls
      ? [
        createSwivelingSecurityCamera(
          15,
          'Camera 14 Abandoned Hall End',
          new Vector3(-143.92, 3.42, 182.25),
          new Vector3(0, 0, 1),
        ),
      ]
      : []),
  ];
  securityCameras.forEach((securityCamera) => root.add(securityCamera.root));
  const markerSixSecurityCamera = securityCameras.find((securityCamera) => securityCamera.id === 1) ?? securityCameras[0];

  const bathroomEntranceRoot = new Group();
  const bathroomEntranceFrameMaterial = new MeshStandardMaterial({
    color: 0x26394a,
    emissive: 0x07111a,
    emissiveIntensity: 0.18,
    roughness: 0.38,
    metalness: 0.32,
  });
  const bathroomDoorMaterial = new MeshStandardMaterial({
    color: 0x47677c,
    emissive: 0x0a1b24,
    emissiveIntensity: 0.14,
    roughness: 0.42,
    metalness: 0.24,
  });
  const bathroomDoorGlassMaterial = new MeshStandardMaterial({
    color: 0xa8cfdf,
    emissive: 0x254d60,
    emissiveIntensity: 0.22,
    roughness: 0.16,
    metalness: 0.42,
    transparent: true,
    opacity: 0.62,
  });
  const bathroomTrimMaterial = new MeshStandardMaterial({
    color: 0xd0d8df,
    emissive: 0x1c2b34,
    emissiveIntensity: 0.08,
    roughness: 0.28,
    metalness: 0.58,
  });
  const bathroomLeftPost = new Mesh(new BoxGeometry(0.24, 3.24, 0.24), bathroomEntranceFrameMaterial);
  bathroomLeftPost.position.set(partyRoomMinX + 0.04, 1.62, bathroomEntryMinZ + 0.08);
  bathroomLeftPost.rotation.y = Math.PI / 2;
  const bathroomRightPost = new Mesh(new BoxGeometry(0.24, 3.24, 0.24), bathroomEntranceFrameMaterial);
  bathroomRightPost.position.set(partyRoomMinX + 0.04, 1.62, bathroomEntryMaxZ - 0.08);
  bathroomRightPost.rotation.y = Math.PI / 2;
  const bathroomHeader = new Mesh(new BoxGeometry(bathroomHallWidth, 0.38, 0.28), bathroomEntranceFrameMaterial);
  bathroomHeader.position.set(partyRoomMinX + 0.04, 3.14, bathroomEntryCenterZ);
  bathroomHeader.rotation.y = Math.PI / 2;
  const bathroomThreshold = new Mesh(new BoxGeometry(0.72, 0.08, bathroomHallWidth - 0.18), bathroomTrimMaterial);
  bathroomThreshold.position.set(partyRoomMinX - 0.12, 0.04, bathroomEntryCenterZ);
  const bathroomSign = createWallSign('Bathrooms', 'Restrooms');
  bathroomSign.scale.set(1.45, 1.24, 1);
  bathroomSign.position.set(partyRoomMinX + 0.13, 2.48, bathroomEntryCenterZ);
  bathroomSign.rotation.y = Math.PI / 2;
  const leftDoorPivot = new Group();
  leftDoorPivot.position.set(partyRoomMinX + 0.02, 0, bathroomEntryMinZ + 0.22);
  const rightDoorPivot = new Group();
  rightDoorPivot.position.set(partyRoomMinX + 0.02, 0, bathroomEntryMaxZ - 0.22);
  const doorPanelWidth = bathroomHallWidth / 2 - 0.34;
  const leftBathroomDoorPanel = new Mesh(new BoxGeometry(0.1, 2.58, doorPanelWidth), bathroomDoorMaterial);
  leftBathroomDoorPanel.position.set(0, 1.34, doorPanelWidth / 2);
  const leftWindow = new Mesh(new BoxGeometry(0.112, 0.88, doorPanelWidth - 0.44), bathroomDoorGlassMaterial);
  leftWindow.position.set(0.012, 1.7, doorPanelWidth / 2);
  const leftHandle = new Mesh(new BoxGeometry(0.08, 0.5, 0.055), bathroomTrimMaterial);
  leftHandle.position.set(0.075, 1.26, doorPanelWidth - 0.22);
  leftDoorPivot.add(leftBathroomDoorPanel, leftWindow, leftHandle);
  const rightBathroomDoorPanel = new Mesh(new BoxGeometry(0.1, 2.58, doorPanelWidth), bathroomDoorMaterial);
  rightBathroomDoorPanel.position.set(0, 1.34, -doorPanelWidth / 2);
  const rightWindow = new Mesh(new BoxGeometry(0.112, 0.88, doorPanelWidth - 0.44), bathroomDoorGlassMaterial);
  rightWindow.position.set(0.012, 1.7, -doorPanelWidth / 2);
  const rightHandle = new Mesh(new BoxGeometry(0.08, 0.5, 0.055), bathroomTrimMaterial);
  rightHandle.position.set(0.075, 1.26, -doorPanelWidth + 0.22);
  rightDoorPivot.add(rightBathroomDoorPanel, rightWindow, rightHandle);
  bathroomEntranceRoot.add(
    bathroomLeftPost,
    bathroomRightPost,
    bathroomHeader,
    bathroomThreshold,
    bathroomSign,
    leftDoorPivot,
    rightDoorPivot,
  );
  root.add(bathroomEntranceRoot);
  const bathroomEntranceCollider: CollisionBox = {
    centerX: partyRoomMinX + 0.02,
    centerZ: bathroomEntryCenterZ,
    halfWidth: 0.22,
    halfDepth: bathroomHallWidth / 2 - 0.34,
    enabled: true,
  };
  colliders.push(bathroomEntranceCollider);
  const bathroomEntranceDoor: OfficeChapterBathroomEntranceDoor = {
    label: 'Bathroom Entrance Doors',
    root: bathroomEntranceRoot,
    interactPosition: new Vector3(partyRoomMinX + 0.86, 1.28, bathroomEntryCenterZ),
    leftDoorPivot,
    rightDoorPivot,
    collider: bathroomEntranceCollider,
    open: false,
    openAmount: 0,
    targetOpenAmount: 0,
  };

  const createRestroomBranchDoor = (
    label: string,
    posterLabel: string,
    z: number,
    openDirection: -1 | 1,
    posterSide: 1 | -1,
  ): OfficeChapterBathroomRoomDoor => {
    const doorRoot = new Group();
    const doorLeftX = bathroomRoomMaxX - bathroomRoomDoorWidth;
    const doorRightX = bathroomRoomMaxX - 0.04;
    const doorCenterX = (doorLeftX + doorRightX) / 2;
    const doorPanelWidth = bathroomRoomDoorWidth - 0.28;

    const leftJamb = new Mesh(new BoxGeometry(0.12, 2.85, 0.18), bathroomEntranceFrameMaterial);
    leftJamb.position.set(doorLeftX, 1.42, z);
    const rightJamb = new Mesh(new BoxGeometry(0.12, 2.85, 0.18), bathroomEntranceFrameMaterial);
    rightJamb.position.set(doorRightX, 1.42, z);
    const header = new Mesh(new BoxGeometry(bathroomRoomDoorWidth + 0.16, 0.22, 0.2), bathroomEntranceFrameMaterial);
    header.position.set(doorCenterX, 2.82, z);

    const pivot = new Group();
    pivot.position.set(doorLeftX + 0.08, 0, z);

    const panel = new Mesh(new BoxGeometry(doorPanelWidth, 2.58, 0.1), bathroomDoorMaterial);
    panel.position.set(doorPanelWidth / 2, 1.34, 0);
    panel.castShadow = true;
    panel.receiveShadow = true;

    const windowPanel = new Mesh(new BoxGeometry(0.72, 0.54, 0.03), bathroomDoorGlassMaterial);
    windowPanel.position.set(doorPanelWidth / 2, 1.88, posterSide * 0.064);

    const poster = createWallSign(posterLabel, 'Restroom');
    poster.scale.set(0.78, 0.82, 1);
    poster.position.set(doorPanelWidth / 2, 1.34, posterSide * 0.07);
    if (posterSide < 0) poster.rotation.y = Math.PI;

    const handle = new Mesh(new BoxGeometry(0.08, 0.2, 0.08), bathroomTrimMaterial);
    handle.position.set(doorPanelWidth - 0.18, 1.18, posterSide * 0.09);

    pivot.add(panel, windowPanel, poster, handle);
    doorRoot.add(leftJamb, rightJamb, header, pivot);
    root.add(doorRoot);

    const collider: CollisionBox = {
      centerX: pivot.position.x + doorPanelWidth / 2,
      centerZ: z,
      halfWidth: doorPanelWidth / 2,
      halfDepth: 0.15,
      enabled: true,
    };
    colliders.push(collider);

    return {
      label,
      root: doorRoot,
      interactPosition: new Vector3(doorCenterX, 1.22, z + posterSide * 0.78),
      doorPivot: pivot,
      collider,
      openDirection,
      open: false,
      openAmount: 0,
      targetOpenAmount: 0,
    };
  };

  const bathroomRoomDoors = [
    createRestroomBranchDoor("Men's Bathroom Door", 'Men', bathroomEntryMinZ - 0.07, 1, 1),
    createRestroomBranchDoor("Women's Bathroom Door", 'Women', bathroomEntryMaxZ + 0.07, -1, -1),
  ];

  [
    { x: bathroomHallCenterX, z: bathroomEntryCenterZ, intensity: 0.72 },
    { x: bathroomRoomCenterX + 0.35, z: womenBathroomCenterZ, intensity: 0.78 },
    { x: bathroomRoomCenterX + 0.35, z: menBathroomCenterZ, intensity: 0.78 },
  ].forEach((light) => {
    const fixture = new Mesh(new BoxGeometry(0.74, 0.1, 0.34), stageLightMaterial);
    fixture.position.set(light.x, WALL_HEIGHT - 0.15, light.z);
    const glow = new PointLight(0xbfe6ff, light.intensity, 8.5, 1.7);
    glow.position.set(light.x, WALL_HEIGHT - 0.84, light.z);
    root.add(fixture, glow);
  });

  const bathroomStalls = [
    createBathroomStall(
      "Women's Bathroom Stall 1",
      bathroomRoomMinX + 1.05,
      womenBathroomCenterZ - 2.25,
      Math.PI / 2,
      0x596d7d,
      1,
    ),
    createBathroomStall(
      "Women's Bathroom Stall 2",
      bathroomRoomMinX + 1.05,
      womenBathroomCenterZ - 0.45,
      Math.PI / 2,
      0x596d7d,
      1,
    ),
    createBathroomStall(
      "Women's Bathroom Stall 3",
      bathroomRoomMinX + 1.05,
      womenBathroomCenterZ + 1.35,
      Math.PI / 2,
      0x596d7d,
      1,
    ),
    createBathroomStall(
      "Men's Bathroom Stall 1",
      bathroomRoomMinX + 1.05,
      menBathroomCenterZ - 1.8,
      Math.PI / 2,
      0x40586b,
      1,
    ),
    createBathroomStall(
      "Men's Bathroom Stall 2",
      bathroomRoomMinX + 1.05,
      menBathroomCenterZ + 0.05,
      Math.PI / 2,
      0x40586b,
      1,
    ),
  ];
  bathroomStalls.forEach((stall) => {
    root.add(stall.root);
    addCollider(colliders, stall.root.position.x, stall.root.position.z, 1.42, 1.38);
  });

  [
    { x: bathroomRoomCenterX - 0.64, z: menBathroomCenterZ - bathroomRoomDepth / 2 + 0.44 },
    { x: bathroomRoomCenterX + 0.44, z: menBathroomCenterZ - bathroomRoomDepth / 2 + 0.44 },
    { x: bathroomRoomCenterX + 1.52, z: menBathroomCenterZ - bathroomRoomDepth / 2 + 0.44 },
  ].forEach((urinal) => {
    root.add(createUrinalFixture(urinal.x, urinal.z, 0));
    addCollider(colliders, urinal.x, urinal.z, 0.62, 0.58);
  });

  const menSink = createSinkCounter(
    "Men's Bathroom Sinks",
    bathroomRoomCenterX + 1.05,
    menBathroomCenterZ + bathroomRoomDepth / 2 - 0.64,
    Math.PI,
    3,
  );
  root.add(menSink.root);
  addCollider(colliders, bathroomRoomCenterX + 1.05, menBathroomCenterZ + bathroomRoomDepth / 2 - 0.64, 2.95, 0.62);

  const menSideSink = createSinkCounter(
    "Men's Bathroom Side Sinks",
    bathroomRoomMaxX - 0.72,
    menBathroomCenterZ - 1.7,
    -Math.PI / 2,
    2,
  );
  root.add(menSideSink.root);
  addCollider(colliders, bathroomRoomMaxX - 0.72, menBathroomCenterZ - 1.7, 0.62, 2.05);

  const womenSink = createSinkCounter(
    "Women's Bathroom Main Sinks",
    bathroomRoomCenterX + 1.05,
    womenBathroomCenterZ - bathroomRoomDepth / 2 + 0.64,
    0,
    3,
  );
  root.add(womenSink.root);
  addCollider(colliders, bathroomRoomCenterX + 1.05, womenBathroomCenterZ - bathroomRoomDepth / 2 + 0.64, 2.95, 0.62);

  const womenEntrySink = createSinkCounter(
    "Women's Bathroom Side Sinks",
    bathroomRoomMaxX - 0.72,
    womenBathroomCenterZ + 2.22,
    -Math.PI / 2,
    2,
  );
  root.add(womenEntrySink.root);
  addCollider(colliders, bathroomRoomMaxX - 0.72, womenBathroomCenterZ + 2.22, 0.62, 2.05);
  const bathroomSinks = [menSink, menSideSink, womenSink, womenEntrySink];

  [
    {
      x: backstageStorageCenterX - 3.7,
      z: backstageStorageMinZ + 0.62,
      rotationY: Math.PI,
      colliderWidth: 2.9,
      colliderDepth: 0.86,
    },
    {
      x: backstageStorageMaxX - 0.58,
      z: backstageStorageCenterZ,
      rotationY: -Math.PI / 2,
      colliderWidth: 0.86,
      colliderDepth: 2.9,
    },
    {
      x: backstageStorageCenterX + 3.15,
      z: backstageStorageMaxZ - 0.58,
      rotationY: 0,
      colliderWidth: 2.9,
      colliderDepth: 0.86,
    },
  ].forEach((shelf) => {
    root.add(createBackstageShelf(shelf.x, shelf.z, shelf.rotationY));
    addCollider(colliders, shelf.x, shelf.z, shelf.colliderWidth, shelf.colliderDepth);
  });

  [
    { kind: 'cat' as const, x: backstageStorageMinX + 2.15, z: backstageStorageCenterZ + 1.35, rotationY: 0.3 },
    { kind: 'gator' as const, x: backstageStorageCenterX + 0.95, z: backstageStorageCenterZ - 1.38, rotationY: -0.2 },
    { kind: 'owl' as const, x: backstageStorageMaxX - 2.15, z: backstageStorageCenterZ + 1.55, rotationY: -0.58 },
  ].forEach((suit) => {
    root.add(createBrokenAnimatronicSuit(suit.kind, suit.x, suit.z, suit.rotationY));
    addCollider(colliders, suit.x, suit.z, 0.92, 0.88);
  });

  [
    { x: partyRoomCenterX - 5.4, z: partyRoomCenterZ + 3.15, rotationY: 0.08 },
    { x: partyRoomCenterX + 5.1, z: partyRoomCenterZ + 2.55, rotationY: -0.08 },
    { x: partyRoomCenterX - 1.1, z: partyRoomCenterZ - 1.55, rotationY: Math.PI / 2 },
  ].forEach((table) => {
    root.add(createPartyTable(table.x, table.z, table.rotationY));
    addCollider(colliders, table.x, table.z, 3.45, 1.58);
  });

  const prizeWheel = createPrizeWheel(-222.02, 2, 146.89);
  root.add(prizeWheel.root);
  const toyPrizeDesk = createToyPrizeDesk(-220.42, 146.89, Math.PI / 2);
  root.add(toyPrizeDesk);
  addCollider(colliders, -220.42, 146.89, 1.48, 2.55);

  [
    { x: partyRoomMinX + 0.68, z: partyRoomCenterZ + 3.2, rotationY: Math.PI / 2, color: 0x2557a6, screen: 0x43d4ff },
    { x: partyRoomMinX + 0.68, z: partyRoomCenterZ - 0.4, rotationY: Math.PI / 2, color: 0xa63535, screen: 0xffdf5a },
    { x: partyRoomMaxX - 0.68, z: partyRoomCenterZ + 2.2, rotationY: -Math.PI / 2, color: 0x7b3c9d, screen: 0xff78d8 },
    { x: partyRoomMaxX - 0.68, z: partyRoomCenterZ - 1.4, rotationY: -Math.PI / 2, color: 0xb27722, screen: 0xffbe59 },
    { x: partyRoomCenterX + 7.3, z: partyRoomNorthZ + 0.72, rotationY: 0, color: 0x284c74, screen: 0x66e6ff },
  ].forEach((cabinet) => {
    root.add(createArcadeCabinet(
      cabinet.x,
      cabinet.z,
      cabinet.rotationY,
      cabinet.color,
      cabinet.screen,
    ));
    addCollider(colliders, cabinet.x, cabinet.z, 1.12, 0.92);
  });

  const partyPlay = createPartyPlayMachine(
    partyRoomMinX + 0.72,
    partyRoomSouthZ - 2.45,
    Math.PI / 2,
  );
  root.add(partyPlay.root);

  const foxStage = createFoxPirateStage(secondRoomMaxX - 2.1, secondRoomCenterZ);
  root.add(foxStage);
  const foxStageFloor: OfficeChapterStageFloor = {
    center: new Vector3(secondRoomMaxX - 2.1, GAME_CONFIG.player.height + 0.62, secondRoomCenterZ),
    halfWidth: 1.6,
    halfDepth: 4.2,
    floorY: GAME_CONFIG.player.height + 0.62,
  };
  addCollider(colliders, secondRoomMaxX - 2.1, secondRoomCenterZ, 0.9, 0.9);

  const setStageAnimatronicPresent = (
    animatronic: 'quacky' | 'fluffle' | 'bori' | 'foxy',
    present: boolean,
  ): void => {
    const stageKind = animatronic === 'quacky'
      ? 'duck'
      : animatronic === 'fluffle'
        ? 'bunny'
        : animatronic === 'bori'
          ? 'bear'
          : null;
    if (stageKind) {
      const stageAnimatronic = stageAnimatronics.find((entry) => entry.kind === stageKind);
      if (stageAnimatronic) {
        stageAnimatronic.root.visible = present;
      }
      stageCollisionRefs.forEach(({ animatronic: stageCollisionAnimatronic, body, drumKit }) => {
        if (stageCollisionAnimatronic.kind !== stageKind) {
          return;
        }
        body.enabled = present;
        if (drumKit) {
          drumKit.enabled = present;
        }
      });
      return;
    }

    const parts = foxStage.userData.foxyParts as { foxRoot?: Group } | undefined;
    if (parts?.foxRoot) {
      parts.foxRoot.visible = present;
    }
  };

  [
    { x: secondRoomCenterX + 3.35, z: secondRoomCenterZ + 1.35, rotationY: -0.22 },
    { x: secondRoomCenterX - 2.4, z: secondRoomCenterZ - 3.65, rotationY: -0.12 },
  ].forEach((table) => {
    root.add(createPartyTable(table.x, table.z, table.rotationY));
    addCollider(colliders, table.x, table.z, 3.45, 1.58);
  });

  [
    { x: secondRoomMinX + 1.0, z: secondRoomCenterZ - 4.9, rotationY: Math.PI / 2, color: 0x2f5178, screen: 0xff78a8 },
    { x: secondRoomCenterX + 2.4, z: secondRoomMaxZ - 0.85, rotationY: Math.PI, color: 0x5c7430, screen: 0xffdc5e },
  ].forEach((cabinet) => {
    root.add(createArcadeCabinet(
      cabinet.x,
      cabinet.z,
      cabinet.rotationY,
      cabinet.color,
      cabinet.screen,
    ));
    addCollider(colliders, cabinet.x, cabinet.z, 1.12, 0.92);
  });

  const basketballGame = createBasketballGame(
    secondRoomCenterX - 2.3,
    secondRoomMaxZ - 2.35,
    Math.PI,
  );
  root.add(basketballGame.root);
  addCollider(colliders, basketballGame.position.x, basketballGame.position.z, 3.15, 2.8);

  const foxyPlay = createFoxyPlayButton(
    secondRoomCenterX + 0.3,
    secondRoomMaxZ - WALL_THICKNESS + 0.04,
    Math.PI,
  );
  root.add(foxyPlay.root);

  const ticketPickups = [
    createTicketPickup('ticket-main-table', partyRoomCenterX - 7.25, partyRoomCenterZ + 4.8, 0.28),
    createTicketPickup('ticket-right-corner', partyRoomMaxX - 1.25, secondHallCenterZ - 1.7, -0.34),
    createTicketPickup('ticket-fox-room-arcade', secondRoomMinX + 1.8, secondRoomCenterZ - 4.05, 0.2),
    createTicketPickup('ticket-basketball-side', secondRoomCenterX - 5.2, secondRoomMaxZ - 1.25, -0.18),
    createTicketPickup('ticket-fox-stage', secondRoomMaxX - 4.2, secondRoomMinZ + 1.25, 0.48),
    createTicketPickup('ticket-backstage-shelf', backstageStorageCenterX - 1.35, backstageStorageCenterZ + 1.95, -0.26),
    createTicketPickup('ticket-backstage-broken-suit', backstageStorageMaxX - 3.15, backstageStorageCenterZ - 1.05, 0.36),
  ];
  ticketPickups.forEach((ticket) => root.add(ticket.root));

  const createWindowTrim = (x: number, facing: 1 | -1, tunnelFarFaceX: number): void => {
    const frontOffset = facing * (WALL_THICKNESS / 2 + 0.04);
    const backOffset = facing * (-WALL_THICKNESS / 2 - 0.04);
    const hallFacingWallX = x - facing * (WALL_THICKNESS / 2);
    const tunnelNearFaceX = hallFacingWallX + facing * 0.02;
    const tunnelBridgeDepth = Math.max(0.12, Math.abs(tunnelFarFaceX - tunnelNearFaceX) + 0.06);
    const tunnelCenterX = (tunnelNearFaceX + tunnelFarFaceX) / 2;

    const roomTop = new Mesh(new BoxGeometry(0.08, 0.1, OFFICE_WINDOW_DEPTH + 0.08), materials.metal);
    roomTop.position.set(x + frontOffset, OFFICE_WINDOW_SILL_HEIGHT + OFFICE_WINDOW_HEIGHT + 0.05, upperWindowCenterZ);
    const roomBottom = new Mesh(new BoxGeometry(0.08, 0.1, OFFICE_WINDOW_DEPTH + 0.08), materials.metal);
    roomBottom.position.set(x + frontOffset, OFFICE_WINDOW_SILL_HEIGHT - 0.05, upperWindowCenterZ);
    const roomNorth = new Mesh(new BoxGeometry(0.08, OFFICE_WINDOW_HEIGHT, 0.08), materials.metal);
    roomNorth.position.set(x + frontOffset, OFFICE_WINDOW_SILL_HEIGHT + OFFICE_WINDOW_HEIGHT / 2, upperWindowCenterZ - OFFICE_WINDOW_DEPTH / 2 - 0.04);
    const roomSouth = new Mesh(new BoxGeometry(0.08, OFFICE_WINDOW_HEIGHT, 0.08), materials.metal);
    roomSouth.position.set(x + frontOffset, OFFICE_WINDOW_SILL_HEIGHT + OFFICE_WINDOW_HEIGHT / 2, upperWindowCenterZ + OFFICE_WINDOW_DEPTH / 2 + 0.04);

    const hallTop = roomTop.clone();
    hallTop.position.set(x + backOffset, OFFICE_WINDOW_SILL_HEIGHT + OFFICE_WINDOW_HEIGHT + 0.05, upperWindowCenterZ);
    const hallBottom = roomBottom.clone();
    hallBottom.position.set(x + backOffset, OFFICE_WINDOW_SILL_HEIGHT - 0.05, upperWindowCenterZ);
    const hallNorth = roomNorth.clone();
    hallNorth.position.set(x + backOffset, OFFICE_WINDOW_SILL_HEIGHT + OFFICE_WINDOW_HEIGHT / 2, upperWindowCenterZ - OFFICE_WINDOW_DEPTH / 2 - 0.04);
    const hallSouth = roomSouth.clone();
    hallSouth.position.set(x + backOffset, OFFICE_WINDOW_SILL_HEIGHT + OFFICE_WINDOW_HEIGHT / 2, upperWindowCenterZ + OFFICE_WINDOW_DEPTH / 2 + 0.04);

    const tunnelTop = new Mesh(new BoxGeometry(tunnelBridgeDepth, 0.08, OFFICE_WINDOW_DEPTH + 0.08), materials.metal);
    tunnelTop.position.set(tunnelCenterX, OFFICE_WINDOW_SILL_HEIGHT + OFFICE_WINDOW_HEIGHT + 0.05, upperWindowCenterZ);
    const tunnelBottom = new Mesh(new BoxGeometry(tunnelBridgeDepth, 0.08, OFFICE_WINDOW_DEPTH + 0.08), materials.metal);
    tunnelBottom.position.set(tunnelCenterX, OFFICE_WINDOW_SILL_HEIGHT - 0.05, upperWindowCenterZ);
    const tunnelNorth = new Mesh(new BoxGeometry(tunnelBridgeDepth, OFFICE_WINDOW_HEIGHT, 0.08), materials.metal);
    tunnelNorth.position.set(tunnelCenterX, OFFICE_WINDOW_SILL_HEIGHT + OFFICE_WINDOW_HEIGHT / 2, upperWindowCenterZ - OFFICE_WINDOW_DEPTH / 2 - 0.04);
    const tunnelSouth = new Mesh(new BoxGeometry(tunnelBridgeDepth, OFFICE_WINDOW_HEIGHT, 0.08), materials.metal);
    tunnelSouth.position.set(tunnelCenterX, OFFICE_WINDOW_SILL_HEIGHT + OFFICE_WINDOW_HEIGHT / 2, upperWindowCenterZ + OFFICE_WINDOW_DEPTH / 2 + 0.04);

    root.add(
      roomTop,
      roomBottom,
      roomNorth,
      roomSouth,
      hallTop,
      hallBottom,
      hallNorth,
      hallSouth,
      tunnelTop,
      tunnelBottom,
      tunnelNorth,
      tunnelSouth,
    );
  };

  if (OFFICE_SIDE_WINDOWS_VISIBLE) {
    createWindowTrim(westWallX, 1, leftTurnCenterX + SIDE_HALL_WIDTH / 2 - 0.02);
    createWindowTrim(eastWallX, -1, rightTurnCenterX - SIDE_HALL_WIDTH / 2 + 0.02);
  }

  const spawnTile = new Mesh(new PlaneGeometry(5.4, 5.4), materials.accent);
  spawnTile.rotation.x = -Math.PI / 2;
  spawnTile.position.set(OFFICE_CENTER_X, 0.02, OFFICE_CENTER_Z + 1.2);
  root.add(spawnTile);

  const ceilingLight = new Mesh(new PlaneGeometry(4.8, 1.2), materials.accent);
  ceilingLight.rotation.x = Math.PI / 2;
  ceilingLight.position.set(OFFICE_CENTER_X, WALL_HEIGHT - 0.04, OFFICE_CENTER_Z - 0.9);
  root.add(ceilingLight);

  const leftDoor = createSlidingDoor(
    'left',
    OFFICE_CENTER_X - halfWidth + 0.28,
    shiftedDoorZ,
    Math.PI / 2,
    1.52,
    materials.wall,
    doorMaterial,
    materials.metal,
  );
  const rightDoor = createSlidingDoor(
    'right',
    OFFICE_CENTER_X + halfWidth - 0.28,
    shiftedDoorZ,
    -Math.PI / 2,
    -1.52,
    materials.wall,
    doorMaterial,
    materials.metal,
  );
  root.add(leftDoor.root, rightDoor.root);
  colliders.push(leftDoor.collider, rightDoor.collider);

  const buttons: OfficeChapterButton[] = [];
  const hallFlashStates: Array<{
    doorId: 'left' | 'right';
    light: PointLight;
    lensMaterial: MeshStandardMaterial;
    phase: number;
    timer: number;
  }> = [];

  const createDoorControlPanel = (
    doorId: 'left' | 'right',
    panelX: number,
    panelZ: number,
    hallLightX: number,
  ): void => {
    const panel = new Mesh(new BoxGeometry(0.14, 1.42, 0.88), panelMaterial);
    panel.position.set(panelX, 1.38, panelZ);

    const redButton = new Mesh(new CylinderGeometry(0.11, 0.11, 0.12, 16), redButtonMaterial);
    redButton.rotation.z = Math.PI / 2;
    redButton.position.set(panelX + (doorId === 'left' ? 0.14 : -0.14), 1.78, panelZ);
    const whiteButton = new Mesh(new CylinderGeometry(0.11, 0.11, 0.12, 16), whiteButtonMaterial);
    whiteButton.rotation.z = Math.PI / 2;
    whiteButton.position.set(panelX + (doorId === 'left' ? 0.14 : -0.14), 0.96, panelZ);
    root.add(panel, redButton, whiteButton);

    buttons.push(
      {
        id: `${doorId}-red`,
        doorId,
        buttonType: 'door',
        label: `${doorId === 'left' ? 'Left' : 'Right'} red button`,
        position: redButton.position.clone(),
        interactPosition: redButton.position.clone(),
      },
      {
        id: `${doorId}-white`,
        doorId,
        buttonType: 'flash',
        label: `${doorId === 'left' ? 'Left' : 'Right'} white button`,
        position: whiteButton.position.clone(),
        interactPosition: whiteButton.position.clone(),
      },
    );

    const fixtureHousing = new Mesh(new BoxGeometry(1.34, 0.18, 0.8), materials.metal);
    fixtureHousing.position.set(hallLightX, WALL_HEIGHT - 0.08, upperWindowCenterZ);
    const fixtureLensMaterial = new MeshStandardMaterial({
      color: 0xf3fbff,
      emissive: 0xdaf5ff,
      emissiveIntensity: 0.06,
      roughness: 0.12,
      metalness: 0.08,
    });
    const fixtureLens = new Mesh(new BoxGeometry(1.12, 0.05, 0.62), fixtureLensMaterial);
    fixtureLens.position.set(hallLightX, WALL_HEIGHT - 0.22, upperWindowCenterZ);
    const hallLight = new PointLight(0xf5fbff, 0, 20, 1.45);
    hallLight.position.set(hallLightX, WALL_HEIGHT - 0.84, upperWindowCenterZ);
    root.add(fixtureHousing, fixtureLens, hallLight);
    hallFlashStates.push({
      doorId,
      light: hallLight,
      lensMaterial: fixtureLensMaterial,
      phase: 0,
      timer: 0,
    });
  };

  createDoorControlPanel('left', westWallX + WALL_THICKNESS / 2 + 0.12, buttonPanelZ, westWallX - 1.02);
  createDoorControlPanel('right', eastWallX - WALL_THICKNESS / 2 - 0.12, buttonPanelZ, eastWallX + 1.02);

  const utilityClosetRoot = new Group();
  const closetDoorPivot = new Group();
  const powerBoxDoorPivot = new Group();

  const utilityCloset: OfficeChapterUtilityCloset = {
    label: '',
    position: new Vector3(OFFICE_CENTER_X, 1.58, OFFICE_CENTER_Z),
    interactPosition: new Vector3(OFFICE_CENTER_X, 1.56, OFFICE_CENTER_Z),
    powerBoxInteractPosition: new Vector3(OFFICE_CENTER_X, 1.62, OFFICE_CENTER_Z),
    root: utilityClosetRoot,
    doorPivot: closetDoorPivot,
    powerBoxDoorPivot,
    open: false,
    openAmount: 0,
    targetOpenAmount: 0,
    powerBoxOpen: false,
    powerBoxOpenAmount: 0,
    powerBoxTargetOpenAmount: 0,
  };

  const deskX = OFFICE_CENTER_X;
  const deskZ = OFFICE_CENTER_Z - 2.55;
  const deskTop = new Mesh(new BoxGeometry(4.8, 0.28, 1.88), deskMaterial);
  deskTop.position.set(deskX, 1.24, deskZ);
  const deskDrawerLeft = new Mesh(new BoxGeometry(0.94, 1.98, 1.72), deskMaterial);
  deskDrawerLeft.position.set(deskX - 1.94, 0.99, deskZ);
  const deskDrawerRight = new Mesh(new BoxGeometry(0.94, 1.98, 1.72), deskMaterial);
  deskDrawerRight.position.set(deskX + 1.94, 0.99, deskZ);
  const deskModesty = new Mesh(new BoxGeometry(3.1, 0.72, 0.12), deskMaterial);
  deskModesty.position.set(deskX, 0.56, deskZ + 0.88);
  root.add(deskTop, deskDrawerLeft, deskDrawerRight, deskModesty);
  addCollider(colliders, deskX, deskZ, 4.9, 1.92);

  const leftMonitorStand = new Mesh(new BoxGeometry(0.16, 0.58, 0.16), materials.metal);
  leftMonitorStand.position.set(deskX - 0.86, 1.72, deskZ - 0.38);
  const leftMonitor = new Mesh(new BoxGeometry(1.1, 0.72, 0.08), screenMaterial);
  leftMonitor.position.set(deskX - 0.86, 2.08, deskZ - 0.38);
  const rightMonitorStand = new Mesh(new BoxGeometry(0.16, 0.58, 0.16), materials.metal);
  rightMonitorStand.position.set(deskX + 0.9, 1.72, deskZ - 0.28);
  const rightMonitor = new Mesh(new BoxGeometry(1.1, 0.72, 0.08), screenMaterial);
  rightMonitor.position.set(deskX + 0.9, 2.08, deskZ - 0.28);
  const keyboard = new Mesh(new BoxGeometry(1.18, 0.06, 0.42), materials.metal);
  keyboard.position.set(deskX + 0.04, 1.41, deskZ + 0.4);
  const mousePad = new Mesh(new BoxGeometry(0.42, 0.03, 0.32), chairMaterial);
  mousePad.position.set(deskX + 1.48, 1.39, deskZ + 0.42);
  const cameraTabletFrameMaterial = new MeshStandardMaterial({
    color: 0x0d1118,
    emissive: 0x02050a,
    emissiveIntensity: 0.16,
    roughness: 0.42,
    metalness: 0.2,
  });
  const cameraTabletScreenMaterial = new MeshStandardMaterial({
    color: 0x13283a,
    emissive: 0x18a6ff,
    emissiveIntensity: 0.42,
    roughness: 0.24,
    metalness: 0.06,
  });
  const cameraTablet = new Group();
  cameraTablet.position.set(deskX - 0.72, 1.42, deskZ + 0.42);
  cameraTablet.rotation.y = -0.14;
  const cameraTabletFrame = new Mesh(new BoxGeometry(0.92, 0.055, 0.58), cameraTabletFrameMaterial);
  const cameraTabletScreen = new Mesh(new BoxGeometry(0.78, 0.062, 0.44), cameraTabletScreenMaterial);
  cameraTabletScreen.position.y = 0.01;
  const cameraTabletHome = new Mesh(new CylinderGeometry(0.025, 0.025, 0.012, 16), materials.metal);
  cameraTabletHome.position.set(0.39, 0.045, 0);
  cameraTabletHome.rotation.z = Math.PI / 2;
  cameraTablet.add(cameraTabletFrame, cameraTabletScreen, cameraTabletHome);
  const papers = new Mesh(new BoxGeometry(0.96, 0.04, 0.72), paperMaterial);
  papers.position.set(deskX - 1.42, 1.4, deskZ + 0.36);
  papers.rotation.y = -0.22;
  root.add(
    leftMonitorStand,
    leftMonitor,
    rightMonitorStand,
    rightMonitor,
    keyboard,
    mousePad,
    cameraTablet,
    papers,
  );

  const sideCabinet = new Mesh(new BoxGeometry(1.04, 1.48, 2.18), deskMaterial);
  sideCabinet.position.set(OFFICE_CENTER_X + 4.34, 0.74, OFFICE_CENTER_Z - 2.78);
  const printer = new Mesh(new BoxGeometry(0.84, 0.36, 0.72), materials.metal);
  printer.position.set(OFFICE_CENTER_X + 4.34, 1.68, OFFICE_CENTER_Z - 2.86);
  root.add(sideCabinet, printer);
  addCollider(colliders, OFFICE_CENTER_X + 4.34, OFFICE_CENTER_Z - 2.78, 1.08, 2.18);

  const chairX = OFFICE_CENTER_X + 0.06;
  const chairZ = OFFICE_CENTER_Z + 0.28;
  const chairSeat = new Mesh(new BoxGeometry(1.16, 0.18, 1.08), chairMaterial);
  chairSeat.position.set(chairX, 0.82, chairZ);
  const chairBack = new Mesh(new BoxGeometry(1.04, 1.12, 0.16), chairMaterial);
  chairBack.position.set(chairX, 1.42, chairZ + 0.48);
  const chairStem = new Mesh(new CylinderGeometry(0.08, 0.1, 0.64, 12), materials.metal);
  chairStem.position.set(chairX, 0.42, chairZ);
  const chairBase = new Mesh(new CylinderGeometry(0.48, 0.26, 0.08, 14), materials.metal);
  chairBase.position.set(chairX, 0.08, chairZ);
  root.add(chairSeat, chairBack, chairStem, chairBase);

  const seat: OfficeChapterSeat = {
    label: 'Office Chair',
    position: new Vector3(chairX, 0.9, chairZ),
    sitPosition: new Vector3(chairX, 1.72, chairZ + 0.02),
    exitPosition: new Vector3(chairX, 1.72, chairZ + 1.26),
    lookTarget: new Vector3(deskX, 1.72, deskZ - 0.16),
  };
  const cameraMonitors: OfficeChapterCameraMonitors = {
    label: 'Desk Camera iPad',
    interactPosition: new Vector3(deskX, GAME_CONFIG.player.height, deskZ + 0.18),
  };

  const spawn = new Vector3(OFFICE_CENTER_X, 1.72, OFFICE_CENTER_Z + 2.2);
  const lookTarget = new Vector3(deskX, 1.72, deskZ);
  const doors = [leftDoor, rightDoor];
  const flashHallLight = (doorId: 'left' | 'right'): void => {
    const flash = hallFlashStates.find((entry) => entry.doorId === doorId);
    if (!flash) {
      return;
    }

    flash.timer = OFFICE_HALL_FLASH_DURATION;
    flash.phase = 0;
  };

  let partyShowActive = false;
  let partyShowTime = 0;
  let partyShowReturning = false;
  let partyShowReturnTime = 0;
  let securityCameraTime = 0;
  let visualUpdateTimer = 0;
  let partyHeadTarget: Vector3 | null = null;
  const partyHeadDefaultTarget = new Vector3(partyRoomCenterX, 1.72, partyRoomCenterZ);
  const partyLocalTarget = new Vector3();
  const partyShowReturnStartPosition = new Vector3();
  let partyShowReturnStartRotationY = Math.PI;
  let basketballThrowActive = false;
  let basketballThrowTime = 0;
  let basketballThrowScored = false;
  let basketballThrowStart = basketballGame.ballHomePosition.clone();
  let basketballThrowTarget = basketballGame.leftHoopTarget.clone();
  let basketballThrowDropTarget = basketballGame.leftHoopTarget.clone();
  let foxCurtainTime = 0;
  let foxyPlayActive = false;
  let foxyPlayTime = 0;

  const startFoxyPlay = (): void => {
    foxyPlayActive = true;
    foxyPlayTime = 0;
  };

  const isFoxyPlayActive = (): boolean => foxyPlayActive;

  const setBasketballHeld = (held: boolean): void => {
    basketballGame.ball.visible = !held;
    if (!held && !basketballThrowActive) {
      basketballGame.ball.position.copy(basketballGame.ballHomePosition);
    }
  };

  const startBasketballThrow = (scored: boolean, targetHoop: 'left' | 'right', throwStartWorldPosition?: Vector3): void => {
    if (basketballThrowActive) {
      return;
    }

    const targetPosition = targetHoop === 'left'
      ? basketballGame.leftHoopTarget
      : basketballGame.rightHoopTarget;
    basketballThrowStart = throwStartWorldPosition
      ? basketballGame.root.worldToLocal(throwStartWorldPosition.clone())
      : basketballGame.ballHomePosition.clone();
    basketballThrowTarget = targetPosition.clone();
    basketballThrowDropTarget = targetPosition.clone();
    basketballThrowDropTarget.y -= 0.62;
    basketballThrowScored = scored;
    if (!scored) {
      basketballThrowTarget.x += basketballThrowTarget.x < 0 ? -0.28 : 0.28;
      basketballThrowTarget.y += 0.34;
      basketballThrowTarget.z -= 0.18;
      basketballThrowDropTarget = basketballThrowTarget.clone();
    }
    basketballThrowActive = true;
    basketballThrowTime = 0;
    basketballGame.ball.visible = true;
    basketballGame.ball.position.copy(basketballThrowStart);
  };

  const isBasketballThrowActive = (): boolean => basketballThrowActive;

  const updateBasketballThrow = (deltaSeconds: number): void => {
    if (!basketballThrowActive) {
      return;
    }

    basketballThrowTime += deltaSeconds;
    const progress = Math.min(basketballThrowTime / BASKETBALL_THROW_DURATION, 1);

    if (basketballThrowScored) {
      if (progress < 0.46) {
        const shotProgress = MathUtils.smoothstep(progress / 0.46, 0, 1);
        basketballGame.ball.position.lerpVectors(basketballThrowStart, basketballThrowTarget, shotProgress);
        basketballGame.ball.position.y += Math.sin(shotProgress * Math.PI) * 0.55;
      } else if (progress < 0.64) {
        const dropProgress = MathUtils.smoothstep((progress - 0.46) / 0.18, 0, 1);
        basketballGame.ball.position.lerpVectors(basketballThrowTarget, basketballThrowDropTarget, dropProgress);
      } else {
        const returnProgress = MathUtils.smoothstep((progress - 0.64) / 0.36, 0, 1);
        basketballGame.ball.position.lerpVectors(basketballThrowDropTarget, basketballGame.ballHomePosition, returnProgress);
        basketballGame.ball.position.y += Math.sin(returnProgress * Math.PI) * 0.18;
      }
    } else {
      const outbound = progress < 0.48;
      const segmentProgress = outbound
        ? MathUtils.smoothstep(progress / 0.48, 0, 1)
        : MathUtils.smoothstep((progress - 0.48) / 0.52, 0, 1);
      const start = outbound ? basketballThrowStart : basketballThrowTarget;
      const end = outbound ? basketballThrowTarget : basketballGame.ballHomePosition;
      basketballGame.ball.position.lerpVectors(start, end, segmentProgress);
      basketballGame.ball.position.y += Math.sin(segmentProgress * Math.PI) * (outbound ? 0.55 : 0.24);
    }

    basketballGame.ball.rotation.x += deltaSeconds * 12;
    basketballGame.ball.rotation.z += deltaSeconds * 7;

    if (progress >= 1) {
      basketballThrowActive = false;
      basketballThrowTime = 0;
      basketballThrowScored = false;
      basketballGame.ball.position.copy(basketballGame.ballHomePosition);
    }
  };

  const updateFoxCurtains = (deltaSeconds: number): void => {
    foxCurtainTime += deltaSeconds;
    const curtainOpen = foxyPlayActive
      ? 0.78 + Math.sin(foxyPlayTime * 2.1) * 0.2
      : 0.16 + Math.sin(foxCurtainTime * 0.72) * 0.08;
    const leftCurtain = foxStage.userData.leftCurtain as Mesh | undefined;
    const rightCurtain = foxStage.userData.rightCurtain as Mesh | undefined;

    if (leftCurtain) {
      leftCurtain.position.z = -3.05 - curtainOpen * 0.68;
      leftCurtain.scale.z = 1 - curtainOpen * 0.34;
    }
    if (rightCurtain) {
      rightCurtain.position.z = 3.05 + curtainOpen * 0.68;
      rightCurtain.scale.z = 1 - curtainOpen * 0.34;
    }
  };

  const updateFoxyPlay = (deltaSeconds: number): void => {
    const buttonBlend = 1 - Math.exp(-12 * deltaSeconds);
    foxyPlay.pressAmount += ((foxyPlayActive ? 1 : 0) - foxyPlay.pressAmount) * buttonBlend;
    foxyPlay.button.position.z = foxyPlay.buttonRestZ - foxyPlay.pressAmount * 0.055;
    foxyPlay.buttonMaterial.emissiveIntensity = 0.62 + foxyPlay.pressAmount * 0.55;
    foxyPlay.labelMaterial.emissiveIntensity = foxyPlayActive
      ? 0.9 + Math.abs(Math.sin(foxyPlayTime * 5.4)) * 0.32
      : 0.58;

    const parts = foxStage.userData.foxyParts as {
      foxRoot: Group;
      head: Group;
      leftArm: StageLimbRefs;
      rightArm: StageLimbRefs;
      leftLeg: StageLimbRefs;
      rightLeg: StageLimbRefs;
      hook: Group;
      base: Record<string, Vector3>;
    } | undefined;
    if (!parts) {
      return;
    }

    const setBase = (): void => {
      const resetLimb = (limb: StageLimbRefs, basePosition: Vector3): void => {
        limb.root.position.copy(basePosition);
        limb.root.rotation.set(0, 0, 0);
        limb.joint.rotation.set(0, 0, 0);
      };

      parts.foxRoot.position.copy(parts.base.foxRootPosition);
      parts.foxRoot.rotation.set(parts.base.foxRootRotation.x, parts.base.foxRootRotation.y, parts.base.foxRootRotation.z);
      parts.head.position.copy(parts.base.headPosition);
      parts.head.rotation.set(parts.base.headRotation.x, parts.base.headRotation.y, parts.base.headRotation.z);
      resetLimb(parts.leftArm, parts.base.leftArmPosition);
      resetLimb(parts.rightArm, parts.base.rightArmPosition);
      resetLimb(parts.leftLeg, parts.base.leftLegPosition);
      resetLimb(parts.rightLeg, parts.base.rightLegPosition);
      parts.hook.position.copy(parts.base.hookPosition);
      parts.hook.rotation.set(parts.base.hookRotation.x, parts.base.hookRotation.y, parts.base.hookRotation.z);
    };

    if (!foxyPlayActive) {
      setBase();
      return;
    }

    foxyPlayTime += deltaSeconds;
    const fadeIn = MathUtils.smoothstep(foxyPlayTime, 0, 0.45);
    const fadeOut = 1 - MathUtils.smoothstep(foxyPlayTime, FOXY_PLAY_DURATION - 0.55, FOXY_PLAY_DURATION);
    const strength = fadeIn * fadeOut;
    const beat = foxyPlayTime * 9.2;
    const cheer = Math.sin(beat);
    const pump = Math.max(0, cheer);
    setBase();
    parts.foxRoot.position.y += Math.abs(Math.sin(beat)) * 0.035 * strength;
    parts.head.rotation.y += Math.sin(foxyPlayTime * 2.8) * 0.18 * strength;
    parts.head.rotation.x += Math.sin(foxyPlayTime * 4.1) * 0.055 * strength;

    if (foxyPlayTime < 2.15) {
      const step = Math.sin(foxyPlayTime * 10.4);
      parts.foxRoot.position.z += Math.sin(foxyPlayTime * 3.2) * 0.12 * strength;
      parts.foxRoot.rotation.z += Math.sin(foxyPlayTime * 6.2) * 0.12 * strength;
      parts.leftArm.root.rotation.x = (-0.42 - pump * 0.36) * strength;
      parts.leftArm.root.rotation.z = (0.42 + cheer * 0.18) * strength;
      parts.leftArm.joint.rotation.x = (-0.28 - pump * 0.32) * strength;
      parts.rightArm.root.rotation.x = (-0.5 - Math.max(0, -cheer) * 0.42) * strength;
      parts.rightArm.root.rotation.z = (-0.44 + cheer * 0.18) * strength;
      parts.rightArm.joint.rotation.x = (-0.3 - Math.max(0, -cheer) * 0.38) * strength;
      parts.leftLeg.root.rotation.x = step * 0.22 * strength;
      parts.rightLeg.root.rotation.x = -step * 0.22 * strength;
      parts.leftLeg.joint.rotation.x = Math.max(0, -step) * 0.4 * strength;
      parts.rightLeg.joint.rotation.x = Math.max(0, step) * 0.4 * strength;
    } else if (foxyPlayTime < 4.05) {
      const segmentTime = foxyPlayTime - 2.15;
      const spinProgress = MathUtils.smoothstep(segmentTime, 0, 1.9);
      parts.foxRoot.rotation.y += spinProgress * Math.PI * 2 * strength;
      parts.foxRoot.rotation.z += Math.sin(segmentTime * 8.8) * 0.18 * strength;
      parts.leftArm.root.rotation.x = -0.24 * strength;
      parts.leftArm.root.rotation.z = (0.92 + Math.sin(segmentTime * 5.4) * 0.12) * strength;
      parts.leftArm.joint.rotation.x = -0.18 * strength;
      parts.rightArm.root.rotation.x = -0.28 * strength;
      parts.rightArm.root.rotation.z = (-0.92 + Math.cos(segmentTime * 5.4) * 0.12) * strength;
      parts.rightArm.joint.rotation.x = -0.22 * strength;
      parts.leftLeg.root.rotation.x = Math.sin(segmentTime * 8.2) * 0.18 * strength;
      parts.rightLeg.root.rotation.x = Math.sin(segmentTime * 8.2 + Math.PI) * 0.18 * strength;
      parts.leftLeg.joint.rotation.x = (0.16 + Math.max(0, -Math.sin(segmentTime * 8.2)) * 0.36) * strength;
      parts.rightLeg.joint.rotation.x = (0.16 + Math.max(0, Math.sin(segmentTime * 8.2)) * 0.36) * strength;
    } else if (foxyPlayTime < 6.3) {
      const segmentTime = foxyPlayTime - 4.05;
      const spinProgress = MathUtils.smoothstep(segmentTime, 0, 2.25);
      parts.foxRoot.position.y -= 0.36 * strength;
      parts.foxRoot.position.x += Math.sin(segmentTime * 8.4) * 0.08 * strength;
      parts.foxRoot.rotation.y += spinProgress * Math.PI * 4.6 * strength;
      parts.foxRoot.rotation.z += (1.05 + Math.sin(segmentTime * 13.5) * 0.08) * strength;
      parts.head.rotation.x += 0.18 * strength;
      parts.leftArm.root.rotation.x = (-0.9 + Math.sin(segmentTime * 10.2) * 0.1) * strength;
      parts.leftArm.root.rotation.z = 0.75 * strength;
      parts.leftArm.joint.rotation.x = -0.5 * strength;
      parts.rightArm.root.rotation.x = (-0.88 + Math.cos(segmentTime * 10.2) * 0.1) * strength;
      parts.rightArm.root.rotation.z = -0.72 * strength;
      parts.rightArm.joint.rotation.x = -0.48 * strength;
      parts.leftLeg.root.rotation.x = 0.62 * strength;
      parts.leftLeg.root.rotation.z = (0.62 + Math.sin(segmentTime * 9.6) * 0.22) * strength;
      parts.leftLeg.joint.rotation.x = -0.35 * strength;
      parts.rightLeg.root.rotation.x = -0.45 * strength;
      parts.rightLeg.root.rotation.z = (-0.62 + Math.cos(segmentTime * 9.6) * 0.22) * strength;
      parts.rightLeg.joint.rotation.x = 0.52 * strength;
    } else if (foxyPlayTime < 8.15) {
      const segmentTime = foxyPlayTime - 6.3;
      const slide = Math.sin(segmentTime * 4.6);
      const pop = Math.max(0, Math.sin(segmentTime * 12.5));
      parts.foxRoot.position.x += slide * 0.22 * strength;
      parts.foxRoot.rotation.z += -slide * 0.16 * strength;
      parts.leftArm.root.rotation.x = (-0.14 - pop * 0.5) * strength;
      parts.leftArm.root.rotation.z = (0.22 + slide * 0.32) * strength;
      parts.leftArm.joint.rotation.x = (-0.16 - pop * 0.46) * strength;
      parts.rightArm.root.rotation.x = (-0.2 - (1 - pop) * 0.36) * strength;
      parts.rightArm.root.rotation.z = (-0.22 + slide * 0.32) * strength;
      parts.rightArm.joint.rotation.x = (-0.2 - pop * 0.4) * strength;
      parts.leftLeg.root.rotation.x = -slide * 0.26 * strength;
      parts.rightLeg.root.rotation.x = slide * 0.26 * strength;
      parts.leftLeg.joint.rotation.x = Math.max(0, slide) * 0.42 * strength;
      parts.rightLeg.joint.rotation.x = Math.max(0, -slide) * 0.42 * strength;
    } else {
      const segmentTime = foxyPlayTime - 8.15;
      const finaleSpin = MathUtils.smoothstep(segmentTime, 0.15, 1.45);
      parts.foxRoot.position.y += Math.abs(Math.sin(segmentTime * 11.5)) * 0.08 * strength;
      parts.foxRoot.rotation.y += finaleSpin * Math.PI * 1.5 * strength;
      parts.foxRoot.rotation.z += Math.sin(segmentTime * 6.2) * 0.1 * strength;
      parts.leftArm.root.rotation.x = (-1.08 + Math.sin(segmentTime * 8.2) * 0.12) * strength;
      parts.leftArm.root.rotation.z = 0.68 * strength;
      parts.leftArm.joint.rotation.x = (-0.32 - pump * 0.32) * strength;
      parts.rightArm.root.rotation.x = (-1.12 + Math.cos(segmentTime * 8.2) * 0.12) * strength;
      parts.rightArm.root.rotation.z = -0.68 * strength;
      parts.rightArm.joint.rotation.x = (-0.34 - pump * 0.34) * strength;
      parts.leftLeg.root.rotation.x = Math.sin(segmentTime * 8.8) * 0.18 * strength;
      parts.rightLeg.root.rotation.x = Math.sin(segmentTime * 8.8 + Math.PI) * 0.18 * strength;
      parts.leftLeg.joint.rotation.x = (0.14 + Math.max(0, -Math.sin(segmentTime * 8.8)) * 0.34) * strength;
      parts.rightLeg.joint.rotation.x = (0.14 + Math.max(0, Math.sin(segmentTime * 8.8)) * 0.34) * strength;
    }

    parts.hook.rotation.set(
      parts.base.hookRotation.x + pump * 0.28 * strength,
      parts.base.hookRotation.y + cheer * 0.14 * strength,
      parts.base.hookRotation.z + Math.sin(foxyPlayTime * 5.8) * 0.08 * strength,
    );

    if (foxyPlayTime >= FOXY_PLAY_DURATION) {
      foxyPlayActive = false;
      foxyPlayTime = 0;
      setBase();
    }
  };

  const updateStageCollisionBoxes = (): void => {
    stageCollisionRefs.forEach(({ animatronic, body, drumKit }) => {
      body.centerX = animatronic.root.position.x;
      body.centerZ = animatronic.root.position.z;

      if (!drumKit) {
        return;
      }

      animatronic.root.updateMatrixWorld(true);
      const drumCenter = animatronic.root.localToWorld(new Vector3(0, 0, -0.78));
      drumKit.centerX = drumCenter.x;
      drumKit.centerZ = drumCenter.z;
    });
  };

  const resetStageShowPose = (): void => {
    stageAnimatronics.forEach((animatronic) => {
      animatronic.root.position.copy(animatronic.homePosition);
      animatronic.root.rotation.set(0, animatronic.homeRotationY, 0);
      animatronic.head.rotation.set(0, 0, 0);
      animatronic.leftArm.root.position.copy(animatronic.leftArm.basePosition);
      animatronic.leftArm.root.rotation.set(0, 0, 0);
      animatronic.leftArm.joint.rotation.set(0, 0, 0);
      animatronic.rightArm.root.position.copy(animatronic.rightArm.basePosition);
      animatronic.rightArm.root.rotation.set(0, 0, 0);
      animatronic.rightArm.joint.rotation.set(0, 0, 0);
      animatronic.leftLeg.root.position.copy(animatronic.leftLeg.basePosition);
      animatronic.leftLeg.root.rotation.set(0, 0, 0);
      animatronic.leftLeg.joint.rotation.set(0, 0, 0);
      animatronic.rightLeg.root.position.copy(animatronic.rightLeg.basePosition);
      animatronic.rightLeg.root.rotation.set(0, 0, 0);
      animatronic.rightLeg.joint.rotation.set(0, 0, 0);
      if (animatronic.propGroup) {
        animatronic.propGroup.position.set(0, 0, 0);
        animatronic.propGroup.rotation.set(0, 0, 0);
      }
      if (animatronic.mouth && animatronic.mouthBasePosition) {
        animatronic.mouth.position.copy(animatronic.mouthBasePosition);
        animatronic.mouth.rotation.set(0, 0, 0);
        animatronic.mouth.scale.set(1, 1, 1);
      }
      if (animatronic.drumSticks) {
        [animatronic.drumSticks.left, animatronic.drumSticks.right].forEach((stick) => {
          stick.root.position.copy(stick.basePosition);
          stick.root.rotation.set(stick.baseRotation.x, stick.baseRotation.y, stick.baseRotation.z);
        });
      }
    });
    updateStageCollisionBoxes();
  };

  const startPartyShow = (playerPosition?: Vector3): void => {
    if (!partyShowActive) {
      resetStageShowPose();
      partyShowTime = 0;
      partyShowReturning = false;
      partyShowReturnTime = 0;
    }
    partyShowActive = true;
    partyHeadTarget = playerPosition?.clone() ?? null;
  };

  const isPartyShowActive = (): boolean => partyShowActive;
  const isPartyShowMusicActive = (): boolean => partyShowActive && !partyShowReturning && partyShowTime <= PARTY_SHOW_MUSIC_DURATION;
  const getPartyShowMusicTime = (): number => isPartyShowMusicActive() ? partyShowTime : 0;

  const resetAnimatronicPartsTowardHome = (animatronic: StageAnimatronicRefs, blend: number): void => {
    animatronic.head.rotation.x = MathUtils.lerp(animatronic.head.rotation.x, 0, blend);
    animatronic.head.rotation.y = MathUtils.lerp(animatronic.head.rotation.y, 0, blend);
    animatronic.head.rotation.z = MathUtils.lerp(animatronic.head.rotation.z, 0, blend);
    [
      animatronic.leftArm,
      animatronic.rightArm,
      animatronic.leftLeg,
      animatronic.rightLeg,
    ].forEach((limb) => {
      limb.root.position.lerp(limb.basePosition, blend);
      limb.root.rotation.x = MathUtils.lerp(limb.root.rotation.x, 0, blend);
      limb.root.rotation.y = MathUtils.lerp(limb.root.rotation.y, 0, blend);
      limb.root.rotation.z = MathUtils.lerp(limb.root.rotation.z, 0, blend);
      limb.joint.rotation.x = MathUtils.lerp(limb.joint.rotation.x, 0, blend);
      limb.joint.rotation.y = MathUtils.lerp(limb.joint.rotation.y, 0, blend);
      limb.joint.rotation.z = MathUtils.lerp(limb.joint.rotation.z, 0, blend);
    });
    if (animatronic.propGroup) {
      animatronic.propGroup.position.lerp(OFFICE_ZERO_VECTOR, blend);
      animatronic.propGroup.rotation.x = MathUtils.lerp(animatronic.propGroup.rotation.x, 0, blend);
      animatronic.propGroup.rotation.y = MathUtils.lerp(animatronic.propGroup.rotation.y, 0, blend);
      animatronic.propGroup.rotation.z = MathUtils.lerp(animatronic.propGroup.rotation.z, 0, blend);
    }
    if (animatronic.mouth && animatronic.mouthBasePosition) {
      animatronic.mouth.position.lerp(animatronic.mouthBasePosition, blend);
      animatronic.mouth.rotation.x = MathUtils.lerp(animatronic.mouth.rotation.x, 0, blend);
      animatronic.mouth.rotation.y = MathUtils.lerp(animatronic.mouth.rotation.y, 0, blend);
      animatronic.mouth.rotation.z = MathUtils.lerp(animatronic.mouth.rotation.z, 0, blend);
      animatronic.mouth.scale.y = MathUtils.lerp(animatronic.mouth.scale.y, 1, blend);
    }
    if (animatronic.drumSticks) {
      [animatronic.drumSticks.left, animatronic.drumSticks.right].forEach((stick) => {
        stick.root.position.lerp(stick.basePosition, blend);
        stick.root.rotation.x = MathUtils.lerp(stick.root.rotation.x, stick.baseRotation.x, blend);
        stick.root.rotation.y = MathUtils.lerp(stick.root.rotation.y, stick.baseRotation.y, blend);
        stick.root.rotation.z = MathUtils.lerp(stick.root.rotation.z, stick.baseRotation.z, blend);
      });
    }
  };

  const animateLegWalkCycle = (animatronic: StageAnimatronicRefs, walkTime: number, strength: number): void => {
    const applyStep = (limb: StageLimbRefs, phase: number, side: -1 | 1): void => {
      const stride = Math.sin(phase);
      const forwardSwing = Math.max(0, stride);
      const backStride = Math.max(0, -stride);
      const lift = Math.max(0, Math.sin(phase + Math.PI * 0.18));
      const heelPlant = Math.max(0, Math.sin(phase - Math.PI * 0.34));

      limb.root.position.copy(limb.basePosition);
      limb.root.position.y += lift * 0.055 * strength;
      limb.root.position.z += stride * 0.035 * strength;
      limb.root.rotation.x = (-stride * 0.38 - forwardSwing * 0.16 + heelPlant * 0.08) * strength;
      limb.root.rotation.z = side * (0.035 + lift * 0.055) * strength;
      limb.root.rotation.y = side * backStride * 0.035 * strength;

      const kneeBend = 0.08 + lift * 0.62 + forwardSwing * 0.24 + backStride * 0.08;
      limb.joint.rotation.x = kneeBend * strength;
      limb.joint.rotation.y = side * lift * 0.05 * strength;
      limb.joint.rotation.z = -side * lift * 0.075 * strength;
    };

    applyStep(animatronic.leftLeg, walkTime, -1);
    applyStep(animatronic.rightLeg, walkTime + Math.PI, 1);

    const bodyBob = Math.abs(Math.sin(walkTime)) * 0.035 * strength;
    animatronic.root.position.y = animatronic.homePosition.y + bodyBob;
    animatronic.root.rotation.x = Math.sin(walkTime * 2) * 0.018 * strength;
    animatronic.root.rotation.z = Math.sin(walkTime) * 0.035 * strength;
  };

  const updateBathroomFixtures = (deltaSeconds: number): void => {
    const blend = 1 - Math.exp(-9.5 * deltaSeconds);
    bathroomEntranceDoor.openAmount = MathUtils.lerp(
      bathroomEntranceDoor.openAmount,
      bathroomEntranceDoor.targetOpenAmount,
      blend,
    );
    if (Math.abs(bathroomEntranceDoor.openAmount - bathroomEntranceDoor.targetOpenAmount) < 0.001) {
      bathroomEntranceDoor.openAmount = bathroomEntranceDoor.targetOpenAmount;
    }
    bathroomEntranceDoor.leftDoorPivot.rotation.y = -bathroomEntranceDoor.openAmount * Math.PI * 0.58;
    bathroomEntranceDoor.rightDoorPivot.rotation.y = bathroomEntranceDoor.openAmount * Math.PI * 0.58;
    bathroomEntranceDoor.open = bathroomEntranceDoor.targetOpenAmount > 0.5;
    bathroomEntranceDoor.collider.enabled = bathroomEntranceDoor.openAmount < 0.62;

    bathroomRoomDoors.forEach((door) => {
      door.openAmount = MathUtils.lerp(door.openAmount, door.targetOpenAmount, blend);
      if (Math.abs(door.openAmount - door.targetOpenAmount) < 0.001) {
        door.openAmount = door.targetOpenAmount;
      }
      door.doorPivot.rotation.y = door.openDirection * door.openAmount * Math.PI * 0.58;
      door.open = door.targetOpenAmount > 0.5;
      door.collider.enabled = door.openAmount < 0.62;
    });

    bathroomSinks.forEach((sink) => {
      sink.waterAmount = MathUtils.lerp(sink.waterAmount, sink.waterOn ? 1 : 0, blend);
      if (!sink.waterOn && sink.waterAmount <= 0.025) {
        sink.waterAmount = 0;
        sink.waterStreams.forEach((stream) => {
          stream.visible = false;
        });
        return;
      }

      const waterTime = storageClosetLeakTime * 18;
      sink.waterStreams.forEach((stream, index) => {
        stream.visible = sink.waterAmount > 0.025;
        stream.scale.set(
          0.72 + Math.sin(waterTime + index) * 0.08,
          sink.waterAmount,
          0.72 + Math.cos(waterTime * 0.89 + index) * 0.08,
        );
        const material = stream.material;
        if (material instanceof MeshStandardMaterial) {
          material.opacity = 0.18 + sink.waterAmount * 0.58;
          material.emissiveIntensity = 0.2 + sink.waterAmount * 0.62;
        }
      });
    });

    bathroomStalls.forEach((stall) => {
      stall.doorOpenAmount = MathUtils.lerp(stall.doorOpenAmount, stall.doorTargetOpenAmount, blend);
      if (Math.abs(stall.doorOpenAmount - stall.doorTargetOpenAmount) < 0.001) {
        stall.doorOpenAmount = stall.doorTargetOpenAmount;
      }
      stall.doorPivot.rotation.y = stall.openDirection * stall.doorOpenAmount * Math.PI * 0.58;
      stall.doorOpen = stall.doorTargetOpenAmount > 0.5;
    });
  };

  const updatePartyShow = (deltaSeconds: number, playerPosition?: Vector3): void => {
    const buttonBlend = 1 - Math.exp(-12 * deltaSeconds);
    partyPlay.pressAmount += ((partyShowActive ? 1 : 0) - partyPlay.pressAmount) * buttonBlend;
    partyPlay.button.position.z = partyPlay.buttonRestZ - partyPlay.pressAmount * 0.055;
    partyPlay.buttonMaterial.emissiveIntensity = 0.62 + partyPlay.pressAmount * 0.55;
    partyPlay.labelMaterial.emissiveIntensity = partyShowActive
      ? 0.82 + Math.abs(Math.sin(partyShowTime * 5.5)) * 0.38
      : 0.58;

    if (!partyShowActive) {
      return;
    }

    partyShowTime += deltaSeconds;
    const duck = stageAnimatronics.find((animatronic) => animatronic.kind === 'duck');
    const bunny = stageAnimatronics.find((animatronic) => animatronic.kind === 'bunny');
    const bear = stageAnimatronics.find((animatronic) => animatronic.kind === 'bear');

    if (!partyShowReturning && partyShowTime >= PARTY_SHOW_MUSIC_DURATION) {
      partyShowReturning = true;
      partyShowReturnTime = 0;
      if (duck) {
        partyShowReturnStartPosition.copy(duck.root.position);
        partyShowReturnStartRotationY = duck.root.rotation.y;
      }
    }

    if (partyShowReturning) {
      partyShowReturnTime += deltaSeconds;
      const returnProgress = MathUtils.smoothstep(partyShowReturnTime, 0, PARTY_SHOW_RETURN_DURATION);
      const resetBlend = 1 - Math.exp(-5.2 * deltaSeconds);

      stageAnimatronics.forEach((animatronic) => {
        resetAnimatronicPartsTowardHome(animatronic, resetBlend);
      });

      if (duck) {
        duck.root.position.lerpVectors(partyShowReturnStartPosition, duck.homePosition, returnProgress);
        duck.root.rotation.y = MathUtils.lerp(partyShowReturnStartRotationY, duck.homeRotationY, returnProgress);
        animateLegWalkCycle(duck, partyShowTime * 8.4, 1 - returnProgress * 0.22);
        duck.leftArm.root.rotation.x = Math.sin(partyShowTime * 6.8) * 0.16 * (1 - returnProgress);
        duck.leftArm.joint.rotation.x = Math.sin(partyShowTime * 6.8 + 0.9) * 0.22 * (1 - returnProgress);
      }

      if (returnProgress >= 0.995) {
        partyShowActive = false;
        partyShowReturning = false;
        partyShowTime = 0;
        partyShowReturnTime = 0;
        partyHeadTarget = null;
        resetStageShowPose();
      }
      updateStageCollisionBoxes();
      return;
    }

    if (playerPosition) {
      if (partyHeadTarget) {
        partyHeadTarget.copy(playerPosition);
      } else {
        partyHeadTarget = playerPosition.clone();
      }
    }
    const target = partyHeadTarget ?? partyHeadDefaultTarget;
    const headSnap = MathUtils.smoothstep(partyShowTime, 0.02, 0.18);

    stageAnimatronics.forEach((animatronic) => {
      animatronic.root.updateMatrixWorld(true);
      const localTarget = animatronic.root.worldToLocal(partyLocalTarget.copy(target));
      const direction = localTarget.sub(animatronic.head.position);
      const yaw = MathUtils.clamp(Math.atan2(-direction.x, -direction.z), -0.78, 0.78) * headSnap;
      const pitch = MathUtils.clamp(
        Math.atan2(direction.y, Math.hypot(direction.x, direction.z)),
        -0.28,
        0.32,
      ) * headSnap;
      animatronic.head.rotation.y = yaw;
      animatronic.head.rotation.x = -pitch;
    });

    if (duck) {
      const angle = partyShowTime * 1.25;
      const radiusX = 1.05;
      const radiusZ = 0.58;
      const tangentX = -Math.sin(angle) * radiusX;
      const tangentZ = Math.cos(angle) * radiusZ;
      duck.root.position.set(
        duck.homePosition.x + Math.cos(angle) * radiusX,
        duck.homePosition.y,
        duck.homePosition.z + Math.sin(angle) * radiusZ,
      );
      duck.root.rotation.y = Math.atan2(-tangentX, -tangentZ);
      const armSwing = Math.sin(partyShowTime * 8.2);
      duck.leftArm.root.rotation.x = armSwing * 0.26;
      duck.leftArm.root.rotation.z = -0.08 + Math.sin(partyShowTime * 8.2 + 0.8) * 0.08;
      duck.leftArm.joint.rotation.x = -0.22 + Math.sin(partyShowTime * 8.2 + 1.1) * 0.5;
      duck.leftArm.joint.rotation.z = Math.sin(partyShowTime * 8.2 + 1.7) * 0.12;
      animateLegWalkCycle(duck, partyShowTime * 8.6, 1);
    }

    if (bunny) {
      bunny.leftArm.root.rotation.x = Math.sin(partyShowTime * 7.4) * 0.08;
      bunny.leftArm.root.rotation.z = Math.sin(partyShowTime * 5.2) * 0.06;
      bunny.rightArm.root.rotation.x = Math.sin(partyShowTime * 12.5) * 0.2;
      bunny.rightArm.joint.rotation.x = Math.sin(partyShowTime * 12.5 + 0.4) * 0.22;
      bunny.rightArm.root.rotation.z = 0.08 + Math.sin(partyShowTime * 12.5 + 0.4) * 0.08;
      if (bunny.propGroup) {
        bunny.propGroup.rotation.z = Math.sin(partyShowTime * 3.5) * 0.025;
      }
    }

    if (bear) {
      const drumTime = partyShowTime * 17.45;
      const leftHit = Math.max(0, Math.sin(drumTime));
      const rightHit = Math.max(0, Math.sin(drumTime + Math.PI));
      bear.leftArm.root.rotation.x = -0.28 - leftHit * 0.42;
      bear.leftArm.root.rotation.z = 0.12 + Math.sin(drumTime + 0.4) * 0.08;
      bear.leftArm.joint.rotation.x = -0.18 + leftHit * 0.55;
      bear.rightArm.root.rotation.x = -0.28 - rightHit * 0.42;
      bear.rightArm.root.rotation.z = -0.12 + Math.sin(drumTime + Math.PI + 0.4) * 0.08;
      bear.rightArm.joint.rotation.x = -0.18 + rightHit * 0.55;
      if (bear.drumSticks) {
        const animateStick = (stick: StageDrumStickRefs, hit: number, side: -1 | 1): void => {
          stick.root.position.copy(stick.basePosition);
          stick.root.position.y -= hit * 0.08;
          stick.root.rotation.x = stick.baseRotation.x - hit * 0.7;
          stick.root.rotation.y = stick.baseRotation.y + side * hit * 0.08;
          stick.root.rotation.z = stick.baseRotation.z + side * hit * 0.12;
        };
        animateStick(bear.drumSticks.left, leftHit, -1);
        animateStick(bear.drumSticks.right, rightHit, 1);
      }
    }
    updateStageCollisionBoxes();
  };

  const update = (deltaSeconds: number, playerPosition?: Vector3): void => {
    visualUpdateTimer += deltaSeconds;
    const runVisualUpdate = visualUpdateTimer >= OFFICE_VISUAL_UPDATE_INTERVAL;
    const visualDeltaSeconds = runVisualUpdate ? visualUpdateTimer : 0;
    if (runVisualUpdate) {
      visualUpdateTimer = 0;
      securityCameraTime += visualDeltaSeconds;
      securityCameras.forEach((securityCamera, index) => {
        const scanSpeed = 0.28 + index * 0.025;
        const scanWidth = 0.74;
        securityCamera.pivot.rotation.y = Math.sin(securityCameraTime * scanSpeed + index * 0.7) * scanWidth;
        if (OFFICE_SECURITY_CAMERA_SCAN_LIGHTS_ENABLED) {
          securityCamera.scanLight.intensity = 0.24 + Math.abs(Math.sin(securityCameraTime * scanSpeed * 2 + index)) * 0.34;
        }
      });
    }

    const blend = 1 - Math.exp(-DOOR_MOVE_SPEED * deltaSeconds);
    doors.forEach((door) => {
      door.openAmount += (door.targetOpenAmount - door.openAmount) * blend;
      if (Math.abs(door.targetOpenAmount - door.openAmount) < 0.001) {
        door.openAmount = door.targetOpenAmount;
      }

      let bounceOffset = 0;
      if (door.closeBounceTimer > 0 && door.targetOpenAmount <= 0.001) {
        door.closeBounceTimer = Math.max(0, door.closeBounceTimer - deltaSeconds);
        const progress = 1 - door.closeBounceTimer / door.closeBounceDuration;
        const impact = 1 - MathUtils.smoothstep(door.openAmount, 0.02, 0.22);
        const bounce = Math.abs(Math.sin(progress * Math.PI * 5.4)) * (1 - progress);
        bounceOffset = impact * bounce * 0.24;
      }

      door.slab.position.y = MathUtils.lerp(door.closedY, door.openY, door.openAmount) + bounceOffset;
      door.collider.enabled = door.openAmount < 0.08;
      door.open = door.targetOpenAmount > 0.5;
    });

    hallFlashStates.forEach((flash, index) => {
      flash.timer = Math.max(0, flash.timer - deltaSeconds);
      flash.phase += deltaSeconds * (16 + index * 2.2);
      const elapsed = OFFICE_HALL_FLASH_DURATION - flash.timer;
      const flickering = elapsed <= OFFICE_HALL_FLASH_FLICKER_DURATION;
      const pulse = flash.timer <= 0
        ? 0
        : flickering
          ? 1.8 + Math.abs(Math.sin(flash.phase)) * 6.8
          : 5.2 * MathUtils.smoothstep(flash.timer, 0, OFFICE_HALL_FLASH_HOLD_DURATION);
      flash.light.intensity = pulse;
      flash.lensMaterial.emissiveIntensity = 0.06 + pulse * 0.3;
    });

    basementFlickerTime += deltaSeconds;
    basementFlickerLights.forEach((entry, index) => {
      const buzz = Math.abs(Math.sin(basementFlickerTime * (8.2 + entry.fault) + entry.phase));
      const slowFault = Math.sin(basementFlickerTime * (1.15 + index * 0.09) + entry.phase * 1.7);
      const dropout = slowFault > 0.82;
      const intensity = dropout
        ? entry.baseIntensity * (0.38 + buzz * 0.26)
        : entry.baseIntensity * (0.92 + buzz * 0.36);
      entry.light.intensity = intensity;
      entry.material.emissiveIntensity = 0.16 + intensity * 0.42;
    });

    const utilityBlend = 1 - Math.exp(-OFFICE_UTILITY_OPEN_SPEED * deltaSeconds);
    utilityCloset.openAmount += (utilityCloset.targetOpenAmount - utilityCloset.openAmount) * utilityBlend;
    if (Math.abs(utilityCloset.targetOpenAmount - utilityCloset.openAmount) < 0.001) {
      utilityCloset.openAmount = utilityCloset.targetOpenAmount;
    }
    utilityCloset.powerBoxOpenAmount += (utilityCloset.powerBoxTargetOpenAmount - utilityCloset.powerBoxOpenAmount) * utilityBlend;
    if (Math.abs(utilityCloset.powerBoxTargetOpenAmount - utilityCloset.powerBoxOpenAmount) < 0.001) {
      utilityCloset.powerBoxOpenAmount = utilityCloset.powerBoxTargetOpenAmount;
    }
    utilityCloset.doorPivot.rotation.y = -utilityCloset.openAmount * Math.PI * 0.82;
    utilityCloset.powerBoxDoorPivot.rotation.y = -utilityCloset.powerBoxOpenAmount * Math.PI * 0.92;
    utilityCloset.open = utilityCloset.targetOpenAmount > 0.5;
    utilityCloset.powerBoxOpen = utilityCloset.powerBoxTargetOpenAmount > 0.5;

    kitchenEntranceDoor.openAmount = MathUtils.lerp(
      kitchenEntranceDoor.openAmount,
      kitchenEntranceDoor.targetOpenAmount,
      utilityBlend,
    );
    if (Math.abs(kitchenEntranceDoor.openAmount - kitchenEntranceDoor.targetOpenAmount) < 0.001) {
      kitchenEntranceDoor.openAmount = kitchenEntranceDoor.targetOpenAmount;
    }
    kitchenEntranceDoor.leftDoorPivot.rotation.y = -kitchenEntranceDoor.openAmount * Math.PI * 0.58;
    kitchenEntranceDoor.rightDoorPivot.rotation.y = kitchenEntranceDoor.openAmount * Math.PI * 0.58;
    kitchenEntranceDoor.open = kitchenEntranceDoor.targetOpenAmount > 0.5;
    kitchenEntranceDoor.collider.enabled = kitchenEntranceDoor.openAmount < 0.62;

    backstageStorageDoor.openAmount = MathUtils.lerp(
      backstageStorageDoor.openAmount,
      backstageStorageDoor.targetOpenAmount,
      utilityBlend,
    );
    if (Math.abs(backstageStorageDoor.openAmount - backstageStorageDoor.targetOpenAmount) < 0.001) {
      backstageStorageDoor.openAmount = backstageStorageDoor.targetOpenAmount;
    }
    backstageStorageDoor.doorPivot.rotation.y = backstageStorageDoor.openAmount * Math.PI * 0.58;
    backstageStorageDoor.open = backstageStorageDoor.targetOpenAmount > 0.5;
    backstageStorageDoor.collider.enabled = backstageStorageDoor.openAmount < 0.62;

    storageClosetDoor.openAmount = MathUtils.lerp(
      storageClosetDoor.openAmount,
      storageClosetDoor.targetOpenAmount,
      utilityBlend,
    );
    if (Math.abs(storageClosetDoor.openAmount - storageClosetDoor.targetOpenAmount) < 0.001) {
      storageClosetDoor.openAmount = storageClosetDoor.targetOpenAmount;
    }
    storageClosetDoor.doorPivot.rotation.y = -storageClosetDoor.openAmount * Math.PI * 0.58;
    storageClosetDoor.open = storageClosetDoor.targetOpenAmount > 0.5;
    storageClosetDoor.collider.enabled = storageClosetDoor.openAmount < 0.62;

    employeeOnlyDoor.openAmount = MathUtils.lerp(
      employeeOnlyDoor.openAmount,
      employeeOnlyDoor.targetOpenAmount,
      utilityBlend,
    );
    if (Math.abs(employeeOnlyDoor.openAmount - employeeOnlyDoor.targetOpenAmount) < 0.001) {
      employeeOnlyDoor.openAmount = employeeOnlyDoor.targetOpenAmount;
    }
    employeeOnlyDoor.doorPivot.rotation.y = employeeOnlyDoor.openAmount * Math.PI * 0.58;
    employeeOnlyDoor.open = employeeOnlyDoor.targetOpenAmount > 0.5;
    employeeOnlyDoor.collider.enabled = !abandonedStraightHalls && employeeOnlyDoor.openAmount < 0.62;

    employeeKeyBriefcase.openAmount = MathUtils.lerp(
      employeeKeyBriefcase.openAmount,
      employeeKeyBriefcase.targetOpenAmount,
      utilityBlend,
    );
    if (Math.abs(employeeKeyBriefcase.openAmount - employeeKeyBriefcase.targetOpenAmount) < 0.001) {
      employeeKeyBriefcase.openAmount = employeeKeyBriefcase.targetOpenAmount;
    }
    employeeKeyBriefcase.lidPivot.rotation.x = -employeeKeyBriefcase.openAmount * Math.PI * 0.72;
    employeeKeyBriefcase.open = employeeKeyBriefcase.targetOpenAmount > 0.5;
    employeeKeyBriefcase.keyRoot.visible = employeeKeyBriefcase.openAmount > 0.42 && !employeeKeyBriefcase.keyCollected;
    employeeKeyBriefcase.keyRoot.rotation.y += deltaSeconds * 1.4;
    employeeKeyBriefcase.keyRoot.position.y = 0.31 + Math.sin(performance.now() * 0.004) * 0.012;

    storageFuseBox.openAmount = MathUtils.lerp(
      storageFuseBox.openAmount,
      storageFuseBox.targetOpenAmount,
      utilityBlend,
    );
    if (Math.abs(storageFuseBox.openAmount - storageFuseBox.targetOpenAmount) < 0.001) {
      storageFuseBox.openAmount = storageFuseBox.targetOpenAmount;
    }
    storageFuseBox.leverAmount = MathUtils.lerp(
      storageFuseBox.leverAmount,
      storageFuseBox.targetLeverAmount,
      utilityBlend,
    );
    if (Math.abs(storageFuseBox.leverAmount - storageFuseBox.targetLeverAmount) < 0.001) {
      storageFuseBox.leverAmount = storageFuseBox.targetLeverAmount;
    }
    storageFuseBox.doorPivot.rotation.y = -storageFuseBox.openAmount * Math.PI * 0.78;
    storageFuseBox.leverPivot.rotation.z = storageFuseBox.leverAmount * Math.PI * 0.62;
    storageFuseBox.open = storageFuseBox.targetOpenAmount > 0.5;
    storageFuseBox.leverPulled = storageFuseBox.targetLeverAmount > 0.5;

    if (runVisualUpdate) {
      storageClosetLeakTime += visualDeltaSeconds;
      storageLeakStream.scale.y = 0.78 + Math.sin(storageClosetLeakTime * 5.4) * 0.08;
      storageLeakDroplets.forEach((droplet, index) => {
        const cycle = (storageClosetLeakTime * 0.72 + index * 0.33) % 1;
        droplet.position.y = MathUtils.lerp(2.28, 0.28, cycle);
        const scale = MathUtils.lerp(1.05, 0.52, cycle);
        droplet.scale.setScalar(scale);
      });
    }

    ventSystem.openings.forEach((opening) => {
      if (!opening.coverPivot) {
        return;
      }
      const targetOpenAmount = opening.targetOpenAmount ?? 0;
      const currentOpenAmount = opening.openAmount ?? 0;
      if (targetOpenAmount <= 0.001 && currentOpenAmount <= 0.001) {
        opening.openAmount = 0;
        opening.open = false;
        return;
      }

      opening.openAmount = MathUtils.lerp(currentOpenAmount, targetOpenAmount, utilityBlend);
      if (Math.abs(opening.openAmount - targetOpenAmount) < 0.001) {
        opening.openAmount = targetOpenAmount;
      }
      opening.coverPivot.rotation.z = -opening.openAmount * Math.PI * 0.62;
      if (opening.roomCoverPivot) {
        opening.roomCoverPivot.rotation.z = opening.openAmount * Math.PI * 0.62;
      }
      [opening.coverPivot, opening.roomCoverPivot].forEach((pivot) => {
        const panels = pivot?.userData.clearViewPanels as Mesh[] | undefined;
        const baseOpacity = pivot?.userData.clearViewBaseOpacity as number[] | undefined;
        panels?.forEach((panel, index) => {
          const material = panel.material;
          const opacity = (baseOpacity?.[index] ?? 0.2) * Math.max(0, 1 - (opening.openAmount ?? 0));
          if (material instanceof MeshBasicMaterial || material instanceof MeshStandardMaterial) {
            material.opacity = opacity;
            material.transparent = true;
          }
          panel.visible = opacity > 0.025;
        });
      });
      opening.open = targetOpenAmount > 0.5;
    });

    const prizeWheelSegmentAngle = Math.PI * 2 / Math.max(1, prizeWheel.prizes.length);
    if (prizeWheel.spinning) {
      prizeWheel.spinTime = Math.min(prizeWheel.spinDuration, prizeWheel.spinTime + deltaSeconds);
      const progress = MathUtils.clamp(prizeWheel.spinTime / Math.max(0.001, prizeWheel.spinDuration), 0, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      prizeWheel.wheel.rotation.z = MathUtils.lerp(
        prizeWheel.spinStartRotation,
        prizeWheel.spinTargetRotation,
        easedProgress,
      );
      prizeWheel.pointer.rotation.z = Math.sin(prizeWheel.spinTime * 58) * 0.08 * (1 - progress);
      prizeWheel.tickIndex = Math.floor(Math.abs(prizeWheel.wheel.rotation.z) / prizeWheelSegmentAngle);
      if (progress >= 1) {
        prizeWheel.spinning = false;
        prizeWheel.wheel.rotation.z = prizeWheel.spinTargetRotation;
        prizeWheel.pointer.rotation.z = 0;
      }
    } else {
      prizeWheel.pointer.rotation.z = MathUtils.lerp(prizeWheel.pointer.rotation.z, 0, utilityBlend);
    }

    if (runVisualUpdate) {
      kitchenSteamTime += visualDeltaSeconds;
      kitchenSteamClouds.forEach((cloud, index) => {
        const phase = (cloud.userData.phase as number) ?? index;
        const pulse = 1 + Math.sin(kitchenSteamTime * 0.9 + phase) * 0.08;
        const drift = Math.sin(kitchenSteamTime * 0.55 + phase) * 0.08;
        cloud.position.y = ((cloud.userData.baseY as number) ?? cloud.position.y) + drift;
        cloud.scale.set(
          ((cloud.userData.baseScaleX as number) ?? 1) * pulse,
          ((cloud.userData.baseScaleY as number) ?? 1) * (1 + Math.cos(kitchenSteamTime * 0.74 + phase) * 0.06),
          ((cloud.userData.baseScaleZ as number) ?? 1) * (1 + Math.sin(kitchenSteamTime * 0.68 + phase) * 0.06),
        );
        const material = cloud.material;
        if (material instanceof MeshStandardMaterial) {
          material.opacity = 0.1 + Math.abs(Math.sin(kitchenSteamTime * 0.62 + phase)) * 0.075;
        }
      });
    }

    updateBasketballThrow(deltaSeconds);
    updateFoxyPlay(deltaSeconds);
    updateFoxCurtains(deltaSeconds);
    updateBathroomFixtures(deltaSeconds);
    updatePartyShow(deltaSeconds, playerPosition);
  };

  const reset = (): void => {
    partyShowActive = false;
    partyShowTime = 0;
    partyShowReturning = false;
    partyShowReturnTime = 0;
    partyHeadTarget = null;
    securityCameraTime = 0;
    visualUpdateTimer = 0;
    securityCameras.forEach((securityCamera) => {
      securityCamera.pivot.rotation.y = 0;
      securityCamera.scanLight.intensity = 0.28;
      securityCamera.scanLight.visible = OFFICE_SECURITY_CAMERA_SCAN_LIGHTS_ENABLED;
    });
    foxyPlayActive = false;
    foxyPlayTime = 0;
    foxyPlay.pressAmount = 0;
    foxyPlay.button.position.z = foxyPlay.buttonRestZ;
    foxyPlay.buttonMaterial.emissiveIntensity = 0.62;
    foxyPlay.labelMaterial.emissiveIntensity = 0.58;
    (['quacky', 'fluffle', 'bori', 'foxy'] as const).forEach((animatronic) => {
      setStageAnimatronicPresent(animatronic, true);
    });
    partyPlay.pressAmount = 0;
    partyPlay.button.position.z = partyPlay.buttonRestZ;
    partyPlay.buttonMaterial.emissiveIntensity = 0.62;
    partyPlay.labelMaterial.emissiveIntensity = 0.58;
    basketballThrowActive = false;
    basketballThrowTime = 0;
    basketballThrowScored = false;
    basketballGame.ball.position.copy(basketballGame.ballHomePosition);
    basketballGame.ball.visible = true;
    prizeWheel.spinning = false;
    prizeWheel.spinTime = 0;
    prizeWheel.spinDuration = 0;
    prizeWheel.spinStartRotation = 0;
    prizeWheel.spinTargetRotation = 0;
    prizeWheel.tickIndex = 0;
    prizeWheel.wheel.rotation.z = 0;
    prizeWheel.pointer.rotation.z = 0;
    prizeWheel.selectedPrize = prizeWheel.prizes[0] ?? 'Prize';
    ticketPickups.forEach((ticket) => {
      ticket.collected = false;
      ticket.root.visible = true;
    });
    ventSystem.openings.forEach((opening) => {
      opening.position.y = ventSystem.floorY;
      opening.open = false;
      opening.openAmount = 0;
      opening.targetOpenAmount = 0;
      if (opening.coverPivot) {
        opening.coverPivot.rotation.z = 0;
      }
      if (opening.roomCoverPivot) {
        opening.roomCoverPivot.rotation.z = 0;
      }
      [opening.coverPivot, opening.roomCoverPivot].forEach((pivot) => {
        const panels = pivot?.userData.clearViewPanels as Mesh[] | undefined;
        const baseOpacity = pivot?.userData.clearViewBaseOpacity as number[] | undefined;
        panels?.forEach((panel, index) => {
          const material = panel.material;
          if (material instanceof MeshBasicMaterial || material instanceof MeshStandardMaterial) {
            material.opacity = baseOpacity?.[index] ?? material.opacity;
            material.transparent = true;
          }
          panel.visible = true;
        });
      });
    });
    bathroomSinks.forEach((sink) => {
      sink.waterOn = false;
      sink.waterAmount = 0;
      sink.waterStreams.forEach((stream) => {
        stream.visible = false;
        stream.scale.set(1, 0, 1);
      });
    });
    bathroomStalls.forEach((stall) => {
      stall.doorOpen = false;
      stall.doorOpenAmount = 0;
      stall.doorTargetOpenAmount = 0;
      stall.doorPivot.rotation.y = 0;
    });
    bathroomEntranceDoor.open = false;
    bathroomEntranceDoor.openAmount = 0;
    bathroomEntranceDoor.targetOpenAmount = 0;
    bathroomEntranceDoor.leftDoorPivot.rotation.y = 0;
    bathroomEntranceDoor.rightDoorPivot.rotation.y = 0;
    bathroomEntranceDoor.collider.enabled = true;
    bathroomRoomDoors.forEach((door) => {
      door.open = false;
      door.openAmount = 0;
      door.targetOpenAmount = 0;
      door.doorPivot.rotation.y = 0;
      door.collider.enabled = true;
    });
    resetStageShowPose();
    doors.forEach((door) => {
      door.open = false;
      door.openAmount = 0;
      door.targetOpenAmount = 0;
      door.closeBounceTimer = 0;
      door.slab.position.y = door.closedY;
      door.collider.enabled = true;
    });
    hallFlashStates.forEach((flash) => {
      flash.phase = 0;
      flash.timer = 0;
      flash.light.intensity = 0;
      flash.lensMaterial.emissiveIntensity = 0.06;
    });
    basementFlickerTime = 0;
    basementFlickerLights.forEach((entry) => {
      entry.light.intensity = entry.baseIntensity;
      entry.material.emissiveIntensity = 0.16 + entry.baseIntensity * 0.42;
    });
    utilityCloset.open = false;
    utilityCloset.openAmount = 0;
    utilityCloset.targetOpenAmount = 0;
    utilityCloset.powerBoxOpen = false;
    utilityCloset.powerBoxOpenAmount = 0;
    utilityCloset.powerBoxTargetOpenAmount = 0;
    utilityCloset.doorPivot.rotation.y = 0;
    utilityCloset.powerBoxDoorPivot.rotation.y = 0;
    kitchenEntranceDoor.open = false;
    kitchenEntranceDoor.openAmount = 0;
    kitchenEntranceDoor.targetOpenAmount = 0;
    kitchenEntranceDoor.leftDoorPivot.rotation.y = 0;
    kitchenEntranceDoor.rightDoorPivot.rotation.y = 0;
    kitchenEntranceDoor.collider.enabled = true;
    kitchenSteamTime = 0;
    backstageStorageDoor.open = false;
    backstageStorageDoor.openAmount = 0;
    backstageStorageDoor.targetOpenAmount = 0;
    backstageStorageDoor.doorPivot.rotation.y = 0;
    backstageStorageDoor.collider.enabled = true;
    storageClosetDoor.open = false;
    storageClosetDoor.openAmount = 0;
    storageClosetDoor.targetOpenAmount = 0;
    storageClosetDoor.doorPivot.rotation.y = 0;
    storageClosetDoor.collider.enabled = true;
    employeeOnlyDoor.open = false;
    employeeOnlyDoor.openAmount = 0;
    employeeOnlyDoor.targetOpenAmount = 0;
    employeeOnlyDoor.locked = true;
    employeeOnlyDoor.doorPivot.rotation.y = 0;
    employeeOnlyDoor.collider.enabled = !abandonedStraightHalls;
    employeeKeyBriefcase.open = false;
    employeeKeyBriefcase.openAmount = 0;
    employeeKeyBriefcase.targetOpenAmount = 0;
    employeeKeyBriefcase.keyCollected = false;
    employeeKeyBriefcase.lidPivot.rotation.x = 0;
    employeeKeyBriefcase.keyRoot.visible = false;
    employeeElevator.platform.position.y = employeeElevator.platformHomeY;
    employeeElevator.button.position.x = employeeElevator.buttonRestX;
    employeeElevator.cables.forEach((cable) => {
      cable.scale.y = employeeElevator.cableBaseLength;
      cable.position.y = employeeElevator.cableTopY - employeeElevator.cableBaseLength / 2;
    });
    employeeElevator.shaftWalls.forEach((wall) => {
      wall.visible = true;
      wall.scale.y = 1;
      wall.position.y = employeeElevator.shaftWallTopY - employeeElevator.shaftWallHeight / 2;
    });
    employeeElevator.lowerButton.position.x = employeeElevator.lowerButtonRestX;
    storageFuseBox.open = false;
    storageFuseBox.openAmount = 0;
    storageFuseBox.targetOpenAmount = 0;
    storageFuseBox.doorPivot.rotation.y = 0;
    storageFuseBox.leverPulled = false;
    storageFuseBox.leverAmount = 0;
    storageFuseBox.targetLeverAmount = 0;
    storageFuseBox.leverPivot.rotation.z = 0;
    (['green', 'blue', 'red'] as const).forEach((color) => {
      storageFuseBox.wires[color].loose.visible = true;
      storageFuseBox.wires[color].connected.visible = false;
      storageFuseBox.wires[color].outletMaterial.emissiveIntensity = 0.12;
    });
    storageFuseBox.statusLightMaterial.color.setHex(0xff3a2e);
    storageFuseBox.statusLightMaterial.emissive.setHex(0xff2a1f);
    storageFuseBox.statusLightMaterial.emissiveIntensity = 0.72;
    storageClosetLeakTime = 0;
  };

  reset();

  return {
    root,
    colliders,
    spawn,
    lookTarget,
    seat,
    cameraMonitors,
    doors,
    buttons,
    partyPlay,
    foxyPlay,
    ticketPickups,
    basketballGame,
    prizeWheel,
    ballPit,
    ballPitSlide,
    ventSystem,
    securityCamera: markerSixSecurityCamera,
    securityCameras,
    backstageStorageDoor,
    storageClosetDoor,
    employeeOnlyDoor,
    employeeKeyBriefcase,
    employeeElevator,
    storageFuseBox,
    kitchenEntranceDoor,
    kitchenGlassShelves,
    bathroomEntranceDoor,
    bathroomRoomDoors,
    bathroomSinks,
    bathroomStalls,
    utilityCloset,
    stageFloor,
    stageFloors: [stageFloor, foxStageFloor],
    setStageAnimatronicPresent,
    flashHallLight,
    startPartyShow,
    startFoxyPlay,
    startBasketballThrow,
    setBasketballHeld,
    isBasketballThrowActive,
    isFoxyPlayActive,
    isPartyShowActive,
    isPartyShowMusicActive,
    getPartyShowMusicTime,
    update,
    reset,
  };
}
