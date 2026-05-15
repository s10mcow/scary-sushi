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

import type {
  CollisionBox,
  FloorDefinition,
  WallDefinition,
} from '../types/world';
import { GAME_CONFIG } from '../config/gameConfig';
import type { LevelMaterials } from './materials';
import { createFloor } from './createFloor';
import { createWalls } from './createWalls';

export type ChapterTwoKeycardColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'blue'
  | 'green'
  | 'purple'
  | 'pink'
  | 'gold';

export const CHAPTER_TWO_KEYCARD_ORDER: ChapterTwoKeycardColor[] = [
  'red',
  'yellow',
  'blue',
  'green',
  'purple',
  'pink',
  'gold',
];

export const CHAPTER_TWO_KEYCARD_LABELS: Record<ChapterTwoKeycardColor, string> = {
  red: 'Red Key Card',
  orange: 'Orange Key Card',
  yellow: 'Yellow Key Card',
  blue: 'Blue Key Card',
  green: 'Green Key Card',
  purple: 'Purple Key Card',
  pink: 'Pink Key Card',
  gold: 'Gold Key Card',
};

export interface ChapterTwoKeycardPickup {
  color: ChapterTwoKeycardColor;
  label: string;
  position: Vector3;
  root: Group;
  collected: boolean;
  startsHidden: boolean;
  baseY: number;
  phase: number;
}

export interface ChapterTwoEggPickup {
  id: number;
  label: string;
  position: Vector3;
  root: Group;
  collected: boolean;
}

export interface ChapterTwoBlueBearPickup {
  id: number;
  label: string;
  position: Vector3;
  root: Group;
  collected: boolean;
}

export interface ChapterTwoPuzzlePiece {
  id: number;
  position: Vector3;
  root: Group;
  collected: boolean;
  baseY: number;
  baseRotationY: number;
  phase: number;
}

export interface ChapterTwoPuzzleBoard {
  position: Vector3;
  interactPosition: Vector3;
  root: Group;
  assemblyRoot: Group;
  assembledPieces: Group[];
  slotPieces: Group[];
  rewardCard: Group;
  solved: boolean;
  solveProgress: number;
}

export interface ChapterTwoSeat {
  id: string;
  label: string;
  position: Vector3;
  sitPosition: Vector3;
  exitPosition: Vector3;
  lookTarget: Vector3;
  kind: 'chair' | 'rocker' | 'couch' | 'swing';
}

export interface ChapterTwoReadable {
  id: string;
  label: string;
  position: Vector3;
  text: string;
}

export interface ChapterTwoCoffeeMachine {
  position: Vector3;
  interactPosition: Vector3;
}

export interface ChapterTwoUtilityCloset {
  label: string;
  position: Vector3;
  interactPosition: Vector3;
  root: Group;
  doorPivot: Group;
  powerDrawer: Group;
  tornWireRoot: Group;
  sparkLight: PointLight;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
}

export interface ChapterTwoDodoPuzzle {
  position: Vector3;
  interactPosition: Vector3;
  root: Group;
  mouthEggs: Group[];
  leftWing: Mesh;
  rightWing: Mesh;
  headPivot: Group;
  totalEggs: number;
  depositedEggs: number;
  solved: boolean;
}

export interface ChapterTwoSlideInteractable {
  label: string;
  stairInteractPosition: Vector3;
  topInteractPosition: Vector3;
  topPosition: Vector3;
  startPosition: Vector3;
  endPosition: Vector3;
  lookTarget: Vector3;
  platformCenter: Vector3;
  platformHalfWidth: number;
  platformHalfDepth: number;
  platformFloorY: number;
  slideFloorStart: Vector3;
  slideFloorEnd: Vector3;
  slideHalfWidth: number;
}

export interface ChapterTwoSecurityDoor {
  id: string;
  color: ChapterTwoKeycardColor;
  label: string;
  position: Vector3;
  interactPosition: Vector3;
  root: Group;
  collider: CollisionBox;
  slab: Mesh;
  slabMaterial: MeshStandardMaterial;
  readerMaterial: MeshStandardMaterial;
  open: boolean;
  openAmount: number;
  targetOpenAmount: number;
  closedY: number;
  openY: number;
}

export interface ChapterTwoLevelData {
  root: Group;
  colliders: CollisionBox[];
  spawn: Vector3;
  redDoorPeekLookTarget: Vector3 | null;
  aftermathBearTalkPosition: Vector3 | null;
  keycards: ChapterTwoKeycardPickup[];
  eggPickups: ChapterTwoEggPickup[];
  blueBearPickups: ChapterTwoBlueBearPickup[];
  puzzlePieces: ChapterTwoPuzzlePiece[];
  puzzleBoard: ChapterTwoPuzzleBoard;
  dodoPuzzle: ChapterTwoDodoPuzzle;
  playgroundSlide: ChapterTwoSlideInteractable;
  seats: ChapterTwoSeat[];
  readables: ChapterTwoReadable[];
  coffeeMachine: ChapterTwoCoffeeMachine;
  utilityCloset: ChapterTwoUtilityCloset;
  securityDoors: ChapterTwoSecurityDoor[];
  setOccupiedSeat(seatId: string | null): void;
  setSwingInput(input: number): void;
  setEntryPuzzleState(collectedCount: number, solved: boolean): void;
  setDodoPuzzleState(depositedCount: number, solved: boolean): void;
  setDodoTrailState(active: boolean): void;
  startDodoPowerRipAnimation(): void;
  isDodoPowerRipAnimationComplete(): boolean;
  setDodoNightAttackState(progress: number, playerPosition: Vector3): void;
  getDodoNightAttackViewPosition(target: Vector3): Vector3 | null;
  getDodoNightAttackWakePosition(target: Vector3): Vector3 | null;
  getDodoNightAttackFocusPosition(target: Vector3): Vector3 | null;
  setAftermathBearRefusalScare(progress: number): void;
  getAftermathBearFocusPosition(target: Vector3): Vector3 | null;
  triggerRedDoorPeek(playerPosition?: Vector3): boolean;
  update(deltaSeconds: number, playerPosition: Vector3): void;
  reset(): void;
}

const CELL_SIZE = 4;
const HALF_CELL = CELL_SIZE / 2;
const WALL_HEIGHT = 4;
const WALL_THICKNESS = 0.45;
const DAYCARE_WIDTH = 43;
const DAYCARE_HEIGHT = 39;
const DAYCARE_CENTER_X = 360;
const DAYCARE_CENTER_Z = 72;
const HALLWAY_WIDTH = 1;
const DOOR_MOVE_SPEED = 5.4;
const CLOSET_OPEN_SPEED = 6.2;
const KEYCARD_BOB_SPEED = 2.2;
const KEYCARD_BOB_HEIGHT = 0.08;
const RED_DOOR_PEEK_STARE_TIME = 2.3;
const DODO_POWER_RIP_DURATION = 3.25;
export const ENTRY_PUZZLE_PIECE_TOTAL = 6;
export const CHAPTER_TWO_BLUE_EGG_TOTAL = 8;
export const CHAPTER_TWO_BLUE_BEAR_TOTAL = 8;

interface RoomRect {
  rowStart: number;
  columnStart: number;
  height: number;
  width: number;
}

interface KeycardDefinition {
  color: ChapterTwoKeycardColor;
  room: RoomRect;
  offsetX?: number;
  offsetZ?: number;
  startsHidden?: boolean;
}

interface PuzzlePieceDefinition {
  id: number;
  room: RoomRect;
  offsetX: number;
  offsetZ: number;
  y: number;
  rotationY: number;
}

interface EggDefinition {
  id: number;
  x: number;
  y: number;
  z: number;
  rotationY?: number;
}

interface BlueBearDefinition {
  id: number;
  x: number;
  y: number;
  z: number;
  rotationY?: number;
  tiltX?: number;
  tiltZ?: number;
  scale?: number;
}

interface RockingAnimator {
  root: Group;
  seatId: string;
  axis: 'x' | 'z';
  mode?: 'auto' | 'manual-swing';
  angle?: number;
  swingPhase?: number;
  swingPower?: number;
  maxAngle?: number;
  powerRiseRate?: number;
  powerDecayRate?: number;
  baseFrequency?: number;
  frequencyBoost?: number;
  response?: number;
}

interface TrainAnimator {
  root: Group;
  centerX: number;
  centerZ: number;
  radiusX: number;
  radiusZ: number;
  speed: number;
  phase: number;
}

interface AquariumAnimator {
  fishRoots: Group[];
  baseOffsets: Array<{ x: number; y: number; z: number }>;
  swimWidths: number[];
  swimDepths: number[];
  verticalAmplitudes: number[];
  phases: number[];
  speeds: number[];
  active: boolean;
}

interface LobbyFishTankResult {
  root: Group;
  crashedRoot: Group;
  animator: AquariumAnimator;
}

type StuffyAnimal = 'bear' | 'bunny' | 'cat' | 'dog' | 'elephant';

interface ShelfStuffySpec {
  shelfIndex: 0 | 1;
  side: 'left' | 'right';
  scale: number;
  furHex: number;
  accentHex: number;
  animal: StuffyAnimal;
  rotationY?: number;
}

interface EntryFurnitureResult {
  root: Group;
  colliders: CollisionBox[];
  seats: ChapterTwoSeat[];
  readables: ChapterTwoReadable[];
  coffeeMachine: ChapterTwoCoffeeMachine;
  rockingAnimators: RockingAnimator[];
  trainAnimators: TrainAnimator[];
  aquariumAnimators: AquariumAnimator[];
  lobbyTankRoot: Group;
  lobbyTankCrashedRoot: Group;
}

interface RedWingFurnitureResult {
  root: Group;
  colliders: CollisionBox[];
  seats: ChapterTwoSeat[];
  eggPickups: ChapterTwoEggPickup[];
  dodoPuzzle: ChapterTwoDodoPuzzle;
  dodoCollider: CollisionBox;
  playgroundSlide: ChapterTwoSlideInteractable;
  rockingAnimators: RockingAnimator[];
  trainAnimators: TrainAnimator[];
  swingSeat: ChapterTwoSeat;
  swingSeatAnchor: Group;
  swingLookAnchor: Group;
  swingBasePosition: { x: number; z: number; rotationY: number };
}

interface PlantDecorResult {
  root: Group;
  colliders: CollisionBox[];
}

interface AmbientRoomFurnitureResult {
  root: Group;
  colliders: CollisionBox[];
  seats: ChapterTwoSeat[];
}

type DoorOrientation = 'northSouth' | 'eastWest';

interface DoorDefinition {
  id: string;
  color: ChapterTwoKeycardColor;
  row: number;
  column: number;
  orientation: DoorOrientation;
  readerSide: -1 | 1;
  offsetX?: number;
  offsetZ?: number;
}

interface ChapterTwoPeekFigure {
  root: Group;
  rig: Group;
  head: Group;
  torso: Group;
  leftArmPivot: Group;
  rightArmPivot: Group;
  leftLegPivot: Group;
  rightLegPivot: Group;
  revealLight: PointLight;
  lipGlow: PointLight;
  smokeRoot: Group;
  smokePuffs: Array<{
    mesh: Mesh;
    material: MeshStandardMaterial;
    drift: Vector3;
    startPosition: Vector3;
    baseScale: number;
  }>;
  visibility: number;
  active: boolean;
  phase: 'watching' | 'charging' | 'vanishing';
  triggered: boolean;
  exhausted: boolean;
  stareRemaining: number;
  vanishRemaining: number;
  homePosition: Vector3;
  homeRotationY: number;
}

interface ChapterTwoGuideLight {
  root: Group;
  orb: Mesh;
  halo: Mesh;
  light: PointLight;
}

const LOBBY: RoomRect = { rowStart: 33, columnStart: 18, height: 4, width: 7 };
const CHECK_IN_ROOM: RoomRect = { rowStart: 33, columnStart: 7, height: 4, width: 6 };
const CUBBY_ROOM: RoomRect = { rowStart: 33, columnStart: 30, height: 4, width: 6 };
const READING_ROOM: RoomRect = { rowStart: 23, columnStart: 3, height: 5, width: 7 };
const QUIET_NOOK: RoomRect = { rowStart: 23, columnStart: 14, height: 5, width: 6 };
const ART_ROOM: RoomRect = { rowStart: 21, columnStart: 23, height: 9, width: 7 };
const BLOCK_ROOM: RoomRect = { rowStart: 23, columnStart: 33, height: 5, width: 7 };
const NAP_ROOM: RoomRect = { rowStart: 14, columnStart: 3, height: 5, width: 7 };
const MUSIC_ROOM: RoomRect = { rowStart: 14, columnStart: 14, height: 5, width: 6 };
const PRETEND_PLAY: RoomRect = { rowStart: 14, columnStart: 23, height: 5, width: 7 };
const CLIMB_ROOM: RoomRect = { rowStart: 14, columnStart: 33, height: 5, width: 7 };
const STORY_ROOM: RoomRect = { rowStart: 5, columnStart: 4, height: 5, width: 7 };
const BALL_PIT_ROOM: RoomRect = { rowStart: 4, columnStart: 18, height: 6, width: 8 };
const CRAFT_ROOM: RoomRect = { rowStart: 5, columnStart: 31, height: 5, width: 7 };

const KEYCARD_DEFINITIONS: KeycardDefinition[] = [
  { color: 'yellow', room: LOBBY, offsetX: -4.75, offsetZ: -6.65, startsHidden: true },
  { color: 'blue', room: ART_ROOM, offsetX: 4.6, offsetZ: 2.35, startsHidden: true },
  { color: 'green', room: BALL_PIT_ROOM, offsetZ: 0.2 },
  { color: 'purple', room: STORY_ROOM, offsetX: 0.3, offsetZ: -0.2 },
  { color: 'pink', room: CRAFT_ROOM, offsetX: -0.3, offsetZ: 0.3 },
  { color: 'gold', room: CLIMB_ROOM, offsetX: 0.2, offsetZ: 0.3 },
];

const ENTRY_PUZZLE_PIECES: PuzzlePieceDefinition[] = [
  { id: 0, room: CHECK_IN_ROOM, offsetX: -3.12, offsetZ: -5.9, y: 1.39, rotationY: 0.24 },
  { id: 1, room: CHECK_IN_ROOM, offsetX: -3.2, offsetZ: -5.1, y: 0.62, rotationY: -0.18 },
  { id: 2, room: LOBBY, offsetX: 5.02, offsetZ: -9.24, y: 0.92, rotationY: 0.34 },
  { id: 3, room: LOBBY, offsetX: -7.15, offsetZ: -8.92, y: 3.5, rotationY: -0.26 },
  { id: 4, room: LOBBY, offsetX: -11.4, offsetZ: 3.4, y: 0.52, rotationY: 0.12 },
  { id: 5, room: CUBBY_ROOM, offsetX: 3.2, offsetZ: 5.1, y: 0.62, rotationY: -0.32 },
];

const DOOR_DEFINITIONS: DoorDefinition[] = [
  { id: 'lobby-north', color: 'red', row: 32, column: 21, orientation: 'northSouth', readerSide: 1 },
  {
    id: 'quiet-entry',
    color: 'red',
    row: 27,
    column: 16,
    orientation: 'northSouth',
    readerSide: 1,
    offsetZ: HALF_CELL,
  },
  { id: 'lower-west', color: 'red', row: 29, column: 10, orientation: 'northSouth', readerSide: -1 },
  { id: 'lower-east', color: 'red', row: 29, column: 32, orientation: 'northSouth', readerSide: 1 },
  { id: 'middle-main', color: 'blue', row: 24, column: 21, orientation: 'northSouth', readerSide: -1 },
  {
    id: 'ball-pit-entry',
    color: 'blue',
    row: 9,
    column: 21,
    orientation: 'northSouth',
    readerSide: 1,
    offsetZ: HALF_CELL,
  },
  { id: 'middle-west', color: 'green', row: 19, column: 10, orientation: 'northSouth', readerSide: -1 },
  {
    id: 'story-entry',
    color: 'green',
    row: 9,
    column: 10,
    orientation: 'northSouth',
    readerSide: -1,
    offsetZ: HALF_CELL,
  },
  { id: 'middle-east', color: 'purple', row: 19, column: 32, orientation: 'northSouth', readerSide: 1 },
  {
    id: 'craft-entry',
    color: 'purple',
    row: 9,
    column: 32,
    orientation: 'northSouth',
    readerSide: 1,
    offsetZ: HALF_CELL,
  },
  {
    id: 'nap-entry',
    color: 'pink',
    row: 16,
    column: 9,
    orientation: 'eastWest',
    readerSide: 1,
    offsetX: HALF_CELL,
  },
  {
    id: 'climb-entry',
    color: 'pink',
    row: 16,
    column: 33,
    orientation: 'eastWest',
    readerSide: 1,
    offsetX: -HALF_CELL,
  },
  {
    id: 'music-entry',
    color: 'gold',
    row: 18,
    column: 16,
    orientation: 'northSouth',
    readerSide: 1,
    offsetZ: HALF_CELL,
  },
  {
    id: 'pretend-entry',
    color: 'gold',
    row: 18,
    column: 27,
    orientation: 'northSouth',
    readerSide: 1,
    offsetZ: HALF_CELL,
  },
];

const KEYCARD_COLORS: Record<ChapterTwoKeycardColor, number> = {
  red: 0xd63c3c,
  orange: 0xde7b2f,
  yellow: 0xdcc94d,
  blue: 0x4d86e8,
  green: 0x54b86a,
  purple: 0x8859d6,
  pink: 0xe27fc3,
  gold: 0xd7b54a,
};

function cellToWorld(row: number, column: number, offsetX = 0, offsetZ = 0): [number, number] {
  const x = DAYCARE_CENTER_X + (column - (DAYCARE_WIDTH - 1) / 2) * CELL_SIZE + offsetX;
  const z = DAYCARE_CENTER_Z + (row - (DAYCARE_HEIGHT - 1) / 2) * CELL_SIZE + offsetZ;
  return [x, z];
}

function getRoomCenter(rect: RoomRect, offsetX = 0, offsetZ = 0): [number, number] {
  const centerRow = rect.rowStart + Math.floor(rect.height / 2);
  const centerColumn = rect.columnStart + Math.floor(rect.width / 2);
  return cellToWorld(centerRow, centerColumn, offsetX, offsetZ);
}

function getRoomBounds(room: RoomRect): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  width: number;
  depth: number;
  centerX: number;
  centerZ: number;
} {
  const [minCenterX, minCenterZ] = cellToWorld(room.rowStart, room.columnStart);
  const [maxCenterX, maxCenterZ] = cellToWorld(
    room.rowStart + room.height - 1,
    room.columnStart + room.width - 1,
  );
  const minX = minCenterX - HALF_CELL;
  const maxX = maxCenterX + HALF_CELL;
  const minZ = minCenterZ - HALF_CELL;
  const maxZ = maxCenterZ + HALF_CELL;

  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: maxX - minX,
    depth: maxZ - minZ,
    centerX: (minX + maxX) * 0.5,
    centerZ: (minZ + maxZ) * 0.5,
  };
}

const DAYCARE_BLUEPRINT = buildDaycareBlueprint();
const [lobbyCenterX, lobbyCenterZ] = getRoomCenter(LOBBY);
const [cubbyCenterX, cubbyCenterZ] = getRoomCenter(CUBBY_ROOM);
const DAYCARE_SPAWN = new Vector3(lobbyCenterX, 1.72, lobbyCenterZ + 1.8);
const ENTRY_PUZZLE_BOARD_POSITION = new Vector3(cubbyCenterX - 6.15, 0, cubbyCenterZ + 0.35);
type PuzzlePieceEdge = 'flat' | 'tab';

interface PuzzlePieceProfile {
  top: PuzzlePieceEdge;
  right: PuzzlePieceEdge;
  bottom: PuzzlePieceEdge;
  left: PuzzlePieceEdge;
  slotX: number;
  slotZ: number;
  cardX: number;
  cardZ: number;
  looseYaw: number;
  loosePitch: number;
  accentX: number;
  accentZ: number;
  accentWidth: number;
}

interface DaycareCell {
  row: number;
  column: number;
}

const ENTRY_PUZZLE_PROFILES: PuzzlePieceProfile[] = [
  {
    top: 'flat',
    right: 'tab',
    bottom: 'tab',
    left: 'flat',
    slotX: -0.33,
    slotZ: -0.17,
    cardX: -0.315,
    cardZ: -0.165,
    looseYaw: -0.24,
    loosePitch: 0.06,
    accentX: 0.015,
    accentZ: 0.01,
    accentWidth: 0.05,
  },
  {
    top: 'flat',
    right: 'tab',
    bottom: 'tab',
    left: 'tab',
    slotX: 0.02,
    slotZ: -0.155,
    cardX: 0.005,
    cardZ: -0.165,
    looseYaw: 0.21,
    loosePitch: -0.04,
    accentX: -0.01,
    accentZ: 0.01,
    accentWidth: 0.075,
  },
  {
    top: 'flat',
    right: 'flat',
    bottom: 'tab',
    left: 'tab',
    slotX: 0.36,
    slotZ: -0.14,
    cardX: 0.325,
    cardZ: -0.165,
    looseYaw: -0.18,
    loosePitch: 0.05,
    accentX: -0.04,
    accentZ: 0.01,
    accentWidth: 0.05,
  },
  {
    top: 'tab',
    right: 'tab',
    bottom: 'flat',
    left: 'flat',
    slotX: -0.345,
    slotZ: 0.175,
    cardX: -0.315,
    cardZ: 0.165,
    looseYaw: 0.17,
    loosePitch: -0.05,
    accentX: 0.015,
    accentZ: -0.01,
    accentWidth: 0.05,
  },
  {
    top: 'tab',
    right: 'tab',
    bottom: 'flat',
    left: 'tab',
    slotX: 0.005,
    slotZ: 0.19,
    cardX: 0.005,
    cardZ: 0.165,
    looseYaw: -0.1,
    loosePitch: 0.04,
    accentX: -0.01,
    accentZ: -0.01,
    accentWidth: 0.075,
  },
  {
    top: 'tab',
    right: 'flat',
    bottom: 'flat',
    left: 'tab',
    slotX: 0.34,
    slotZ: 0.16,
    cardX: 0.325,
    cardZ: 0.165,
    looseYaw: 0.14,
    loosePitch: -0.03,
    accentX: -0.04,
    accentZ: -0.01,
    accentWidth: 0.05,
  },
];
const SIGN_IN_TEXT = [
  'SIGNED IN',
  'Robert - 9:30 AM',
  'Jacob - 9:30 AM',
  'Lucy - 9:30 AM',
  'Carl - 9:30 AM',
  'Jonathan - 9:45 AM',
  'Johnny - 10:00 AM',
].join('\n');
const SIGN_OUT_TEXT = [
  'SIGNED OUT',
  'Robert - 3:00 PM',
  'Jacob - ---',
  'Carl - 3:00 PM',
  'Jonathan - 3:20 PM',
  'Johnny - 3:00 PM',
  'Lucy - ---',
].join('\n');

function buildDaycareBlueprint(): string[] {
  const grid = Array.from({ length: DAYCARE_HEIGHT }, () => Array(DAYCARE_WIDTH).fill('#'));

  const carveRect = (rect: RoomRect): void => {
    for (let row = rect.rowStart; row < rect.rowStart + rect.height; row += 1) {
      for (let column = rect.columnStart; column < rect.columnStart + rect.width; column += 1) {
        if (row >= 0 && row < DAYCARE_HEIGHT && column >= 0 && column < DAYCARE_WIDTH) {
          grid[row][column] = '.';
        }
      }
    }
  };

  const getRectCenterCell = (rect: RoomRect): [number, number] => [
    rect.rowStart + Math.floor(rect.height / 2),
    rect.columnStart + Math.floor(rect.width / 2),
  ];

  const carveHallwayLine = (
    startRow: number,
    startColumn: number,
    endRow: number,
    endColumn: number,
    width = HALLWAY_WIDTH,
  ): void => {
    const radius = Math.floor(width / 2);
    const rowStep = Math.sign(endRow - startRow);
    const columnStep = Math.sign(endColumn - startColumn);
    let row = startRow;
    let column = startColumn;

    carveRect({
      rowStart: row - radius,
      columnStart: column - radius,
      height: width,
      width,
    });

    while (row !== endRow || column !== endColumn) {
      if (row !== endRow) {
        row += rowStep;
      } else if (column !== endColumn) {
        column += columnStep;
      }

      carveRect({
        rowStart: row - radius,
        columnStart: column - radius,
        height: width,
        width,
      });
    }
  };

  const sealCell = (row: number, column: number): void => {
    if (row >= 0 && row < DAYCARE_HEIGHT && column >= 0 && column < DAYCARE_WIDTH) {
      grid[row][column] = '#';
    }
  };

  [
    LOBBY,
    CHECK_IN_ROOM,
    CUBBY_ROOM,
    READING_ROOM,
    QUIET_NOOK,
    ART_ROOM,
    BLOCK_ROOM,
    NAP_ROOM,
    MUSIC_ROOM,
    PRETEND_PLAY,
    CLIMB_ROOM,
    STORY_ROOM,
    BALL_PIT_ROOM,
    CRAFT_ROOM,
  ].forEach(carveRect);

  const [lobbyRow, lobbyColumn] = getRectCenterCell(LOBBY);
  const [checkInRow, checkInColumn] = getRectCenterCell(CHECK_IN_ROOM);
  const [cubbyRow, cubbyColumn] = getRectCenterCell(CUBBY_ROOM);

  const mainHallColumn = lobbyColumn;
  const leftHallColumn = 10;
  const rightHallColumn = 32;
  const lowerHallRow = 30;
  const middleHallRow = 20;
  const upperHallRow = 11;

  carveHallwayLine(lobbyRow, lobbyColumn, upperHallRow, mainHallColumn);
  carveHallwayLine(lobbyRow, lobbyColumn, checkInRow, checkInColumn);
  carveHallwayLine(lobbyRow, lobbyColumn, cubbyRow, cubbyColumn);

  carveHallwayLine(lowerHallRow, 6, lowerHallRow, 36);
  carveHallwayLine(middleHallRow, 6, middleHallRow, 36);
  carveHallwayLine(upperHallRow, 8, upperHallRow, 35);

  carveHallwayLine(lowerHallRow, leftHallColumn, upperHallRow, leftHallColumn);
  carveHallwayLine(lowerHallRow, rightHallColumn, upperHallRow, rightHallColumn);

  carveHallwayLine(lowerHallRow, 16, 28, 16);
  carveHallwayLine(lowerHallRow, 27, 28, 27);

  carveHallwayLine(middleHallRow, 16, 19, 16);
  carveHallwayLine(middleHallRow, 27, 19, 27);

  carveHallwayLine(upperHallRow, leftHallColumn, 10, leftHallColumn);
  carveHallwayLine(upperHallRow, mainHallColumn, 10, mainHallColumn);
  carveHallwayLine(upperHallRow, rightHallColumn, 10, rightHallColumn);

  // Keep the enlarged dodo room feeling like a real room instead of a wide-open hall cutout:
  // fully restore the blue-door-side wall and leave only a narrow south entrance.
  for (let column = ART_ROOM.columnStart; column < ART_ROOM.columnStart + ART_ROOM.width; column += 1) {
    sealCell(ART_ROOM.rowStart, column);
    if (column !== ART_ROOM.columnStart + 3) {
      sealCell(ART_ROOM.rowStart + ART_ROOM.height - 1, column);
    }
  }
  sealCell(24, 22);

  // Keep the pink rooms sealed from the side hall except at the actual doorway row.
  [14, 15, 17, 18].forEach((row) => {
    sealCell(row, 9);
    sealCell(row, 33);
  });

  return grid.map((row) => row.join(''));
}

function isWalkable(token: string | undefined): boolean {
  return Boolean(token) && token !== '#';
}

function worldToDaycareCell(x: number, z: number): DaycareCell {
  return {
    row: Math.max(
      0,
      Math.min(
        DAYCARE_HEIGHT - 1,
        Math.round((z - DAYCARE_CENTER_Z) / CELL_SIZE + (DAYCARE_HEIGHT - 1) / 2),
      ),
    ),
    column: Math.max(
      0,
      Math.min(
        DAYCARE_WIDTH - 1,
        Math.round((x - DAYCARE_CENTER_X) / CELL_SIZE + (DAYCARE_WIDTH - 1) / 2),
      ),
    ),
  };
}

function findNearestWalkableDaycareCell(x: number, z: number): DaycareCell {
  const approximate = worldToDaycareCell(x, z);
  if (isWalkable(DAYCARE_BLUEPRINT[approximate.row]?.[approximate.column])) {
    return approximate;
  }

  let bestCell = approximate;
  let bestDistance = Infinity;

  for (let radius = 1; radius < Math.max(DAYCARE_WIDTH, DAYCARE_HEIGHT); radius += 1) {
    for (let row = Math.max(0, approximate.row - radius); row <= Math.min(DAYCARE_HEIGHT - 1, approximate.row + radius); row += 1) {
      for (
        let column = Math.max(0, approximate.column - radius);
        column <= Math.min(DAYCARE_WIDTH - 1, approximate.column + radius);
        column += 1
      ) {
        if (!isWalkable(DAYCARE_BLUEPRINT[row]?.[column])) {
          continue;
        }

        const [cellX, cellZ] = cellToWorld(row, column);
        const distance = (cellX - x) ** 2 + (cellZ - z) ** 2;
        if (distance >= bestDistance) {
          continue;
        }

        bestDistance = distance;
        bestCell = { row, column };
      }
    }

    if (bestDistance < Infinity) {
      return bestCell;
    }
  }

  return bestCell;
}

function findDaycarePath(start: DaycareCell, goal: DaycareCell): DaycareCell[] {
  if (start.row === goal.row && start.column === goal.column) {
    return [start];
  }

  const visited = Array.from({ length: DAYCARE_HEIGHT }, () => Array(DAYCARE_WIDTH).fill(false));
  const previous = Array.from({ length: DAYCARE_HEIGHT }, () =>
    Array<DaycareCell | null>(DAYCARE_WIDTH).fill(null));
  const queue: DaycareCell[] = [start];
  visited[start.row][start.column] = true;

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (current.row === goal.row && current.column === goal.column) {
      break;
    }

    const neighbors: DaycareCell[] = [
      { row: current.row - 1, column: current.column },
      { row: current.row + 1, column: current.column },
      { row: current.row, column: current.column - 1 },
      { row: current.row, column: current.column + 1 },
    ];

    neighbors.forEach((neighbor) => {
      if (
        neighbor.row < 0
        || neighbor.row >= DAYCARE_HEIGHT
        || neighbor.column < 0
        || neighbor.column >= DAYCARE_WIDTH
        || visited[neighbor.row][neighbor.column]
        || !isWalkable(DAYCARE_BLUEPRINT[neighbor.row]?.[neighbor.column])
      ) {
        return;
      }

      visited[neighbor.row][neighbor.column] = true;
      previous[neighbor.row][neighbor.column] = current;
      queue.push(neighbor);
    });
  }

  if (!visited[goal.row][goal.column]) {
    return [start];
  }

  const path: DaycareCell[] = [];
  let current: DaycareCell | null = goal;
  while (current) {
    path.push(current);
    current = previous[current.row][current.column];
  }

  return path.reverse();
}

function buildWalls(): WallDefinition[] {
  const walls: WallDefinition[] = [];

  for (let row = 0; row < DAYCARE_BLUEPRINT.length; row += 1) {
    for (let column = 0; column < DAYCARE_BLUEPRINT[row].length; column += 1) {
      if (!isWalkable(DAYCARE_BLUEPRINT[row][column])) {
        continue;
      }

      const [x, z] = cellToWorld(row, column);

      if (!isWalkable(DAYCARE_BLUEPRINT[row - 1]?.[column])) {
        walls.push({
          position: [x, WALL_HEIGHT / 2, z - HALF_CELL],
          size: [CELL_SIZE + WALL_THICKNESS, WALL_HEIGHT, WALL_THICKNESS],
        });
      }

      if (!isWalkable(DAYCARE_BLUEPRINT[row + 1]?.[column])) {
        walls.push({
          position: [x, WALL_HEIGHT / 2, z + HALF_CELL],
          size: [CELL_SIZE + WALL_THICKNESS, WALL_HEIGHT, WALL_THICKNESS],
        });
      }

      if (!isWalkable(DAYCARE_BLUEPRINT[row]?.[column - 1])) {
        walls.push({
          position: [x - HALF_CELL, WALL_HEIGHT / 2, z],
          size: [WALL_THICKNESS, WALL_HEIGHT, CELL_SIZE + WALL_THICKNESS],
        });
      }

      if (!isWalkable(DAYCARE_BLUEPRINT[row]?.[column + 1])) {
        walls.push({
          position: [x + HALF_CELL, WALL_HEIGHT / 2, z],
          size: [WALL_THICKNESS, WALL_HEIGHT, CELL_SIZE + WALL_THICKNESS],
        });
      }
    }
  }

  return walls;
}

function createMaterials(): LevelMaterials {
  return {
    wall: new MeshStandardMaterial({
      color: 0xecedf4,
      roughness: 0.86,
      metalness: 0.04,
    }),
    floor: new MeshStandardMaterial({
      color: 0xcfd6db,
      roughness: 0.76,
      metalness: 0.08,
    }),
    ceiling: new MeshStandardMaterial({
      color: 0xf8faf6,
      roughness: 0.9,
      metalness: 0.02,
    }),
    prop: new MeshStandardMaterial({
      color: 0xd8a674,
      roughness: 0.74,
      metalness: 0.08,
    }),
    metal: new MeshStandardMaterial({
      color: 0xc8d4db,
      roughness: 0.36,
      metalness: 0.58,
    }),
    accent: new MeshStandardMaterial({
      color: 0xd86b45,
      emissive: 0xffba6e,
      emissiveIntensity: 1.8,
      roughness: 0.32,
      metalness: 0.14,
    }),
  };
}

function createDodoRoomStyling(): Group {
  const root = new Group();
  const bounds = getRoomBounds(ART_ROOM);
  const wallPanelThickness = 0.16;
  const wallPanelFaceInset = WALL_THICKNESS * 0.5 + wallPanelThickness * 0.5 + 0.01;
  const wallPanelHeight = WALL_HEIGHT + 0.08;
  const wallPanelCenterY = wallPanelHeight * 0.5 - 0.04;

  const grassFloorMaterial = new MeshStandardMaterial({
    color: 0x5f9d47,
    roughness: 0.96,
    metalness: 0.02,
  });
  const blueWallMaterial = new MeshStandardMaterial({
    color: 0x69b9ff,
    emissive: 0x12365b,
    emissiveIntensity: 0.08,
    roughness: 0.88,
    metalness: 0.04,
    side: DoubleSide,
  });
  const blueCeilingMaterial = new MeshStandardMaterial({
    color: 0x89c9f7,
    roughness: 0.9,
    metalness: 0.02,
  });

  const floor = new Mesh(
    new PlaneGeometry(bounds.width + 0.08, bounds.depth + 0.08),
    grassFloorMaterial,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(bounds.centerX, 0.018, bounds.centerZ);

  const ceiling = new Mesh(
    new PlaneGeometry(bounds.width - 0.04, bounds.depth - 0.04),
    blueCeilingMaterial,
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(bounds.centerX, WALL_HEIGHT - 0.012, bounds.centerZ);

  for (let row = ART_ROOM.rowStart; row < ART_ROOM.rowStart + ART_ROOM.height; row += 1) {
    for (let column = ART_ROOM.columnStart; column < ART_ROOM.columnStart + ART_ROOM.width; column += 1) {
      if (!isWalkable(DAYCARE_BLUEPRINT[row]?.[column])) {
        continue;
      }

      const [x, z] = cellToWorld(row, column);

      if (!isWalkable(DAYCARE_BLUEPRINT[row - 1]?.[column])) {
        const northPanel = new Mesh(
          new BoxGeometry(CELL_SIZE + 0.06, wallPanelHeight, wallPanelThickness),
          blueWallMaterial,
        );
        northPanel.position.set(
          x,
          wallPanelCenterY,
          z - HALF_CELL + wallPanelFaceInset,
        );
        root.add(northPanel);
      }

      if (!isWalkable(DAYCARE_BLUEPRINT[row + 1]?.[column])) {
        const southPanel = new Mesh(
          new BoxGeometry(CELL_SIZE + 0.06, wallPanelHeight, wallPanelThickness),
          blueWallMaterial,
        );
        southPanel.position.set(
          x,
          wallPanelCenterY,
          z + HALF_CELL - wallPanelFaceInset,
        );
        root.add(southPanel);
      }

      if (!isWalkable(DAYCARE_BLUEPRINT[row]?.[column - 1])) {
        const westPanel = new Mesh(
          new BoxGeometry(wallPanelThickness, wallPanelHeight, CELL_SIZE + 0.06),
          blueWallMaterial,
        );
        westPanel.position.set(
          x - HALF_CELL + wallPanelFaceInset,
          wallPanelCenterY,
          z,
        );
        root.add(westPanel);
      }

      if (!isWalkable(DAYCARE_BLUEPRINT[row]?.[column + 1])) {
        const eastPanel = new Mesh(
          new BoxGeometry(wallPanelThickness, wallPanelHeight, CELL_SIZE + 0.06),
          blueWallMaterial,
        );
        eastPanel.position.set(
          x + HALF_CELL - wallPanelFaceInset,
          wallPanelCenterY,
          z,
        );
        root.add(eastPanel);
      }
    }
  }

  root.add(floor, ceiling);

  return root;
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

function offsetPosition(x: number, z: number, rotationY: number, localX: number, localZ: number): Vector3 {
  return new Vector3(localX, 0, localZ)
    .applyAxisAngle(new Vector3(0, 1, 0), rotationY)
    .add(new Vector3(x, 0, z));
}

function createWireSegment(
  start: Vector3,
  end: Vector3,
  material: MeshStandardMaterial,
  radius = 0.022,
): Mesh {
  const direction = end.clone().sub(start);
  const length = Math.max(direction.length(), 0.001);
  const wire = new Mesh(new CylinderGeometry(radius, radius, length, 10), material);
  wire.position.copy(start).add(end).multiplyScalar(0.5);

  if (direction.lengthSq() > 0.000001) {
    wire.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
  }

  return wire;
}

function createWaitingChair(
  id: string,
  label: string,
  x: number,
  z: number,
  rotationY: number,
): { root: Group; seat: ChapterTwoSeat } {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const frameMaterial = new MeshStandardMaterial({
    color: 0xb8c0c9,
    roughness: 0.46,
    metalness: 0.54,
  });
  const cushionMaterial = new MeshStandardMaterial({
    color: 0xa8c2d8,
    roughness: 0.84,
    metalness: 0.02,
  });

  const seatBase = new Mesh(new BoxGeometry(0.9, 0.08, 0.82), cushionMaterial);
  seatBase.position.y = 0.46;
  const back = new Mesh(new BoxGeometry(0.9, 0.82, 0.08), cushionMaterial);
  back.position.set(0, 0.84, -0.37);
  const leftArm = new Mesh(new BoxGeometry(0.08, 0.44, 0.82), frameMaterial);
  const rightArm = leftArm.clone();
  leftArm.position.set(-0.44, 0.56, 0);
  rightArm.position.set(0.44, 0.56, 0);

  const legOffsets: Array<[number, number]> = [
    [-0.34, -0.24],
    [0.34, -0.24],
    [-0.34, 0.24],
    [0.34, 0.24],
  ];
  legOffsets.forEach(([legX, legZ]) => {
    const leg = new Mesh(new BoxGeometry(0.06, 0.44, 0.06), frameMaterial);
    leg.position.set(legX, 0.22, legZ);
    root.add(leg);
  });

  root.add(seatBase, back, leftArm, rightArm);

  return {
    root,
    seat: {
      id,
      label,
      position: offsetPosition(x, z, rotationY, 0, 1.02).setY(1.02),
      sitPosition: offsetPosition(x, z, rotationY, 0, 0.16).setY(1.72),
      exitPosition: offsetPosition(x, z, rotationY, 0, 1.24).setY(1.72),
      lookTarget: offsetPosition(x, z, rotationY, 0, 4.8).setY(1.4),
      kind: 'chair',
    },
  };
}

function createLobbyRearDoubleDoors(x: number, z: number): Group {
  const root = new Group();
  root.position.set(x, 0, z);

  const frameMaterial = new MeshStandardMaterial({
    color: 0xd9e4ec,
    emissive: 0xb6d0e0,
    emissiveIntensity: 0.18,
    roughness: 0.42,
    metalness: 0.34,
  });
  const doorMaterial = new MeshStandardMaterial({
    color: 0x5c7487,
    emissive: 0x7aa6c4,
    emissiveIntensity: 0.12,
    roughness: 0.68,
    metalness: 0.1,
  });
  const windowMaterial = new MeshStandardMaterial({
    color: 0xdbe8f1,
    emissive: 0xbfd6e7,
    emissiveIntensity: 0.2,
    roughness: 0.18,
    metalness: 0.08,
  });
  const recessMaterial = new MeshStandardMaterial({
    color: 0x6d8090,
    emissive: 0x526774,
    emissiveIntensity: 0.08,
    roughness: 0.72,
    metalness: 0.08,
  });
  const trimMaterial = new MeshStandardMaterial({
    color: 0xf1f6fa,
    emissive: 0xd3e3ee,
    emissiveIntensity: 0.22,
    roughness: 0.38,
    metalness: 0.24,
  });

  const recess = new Mesh(new BoxGeometry(4.28, 3.56, 0.08), recessMaterial);
  recess.position.set(0, 1.78, 0.14);
  const frame = new Mesh(new BoxGeometry(4.08, 3.38, 0.06), frameMaterial);
  frame.position.set(0, 1.69, -0.14);
  const opening = new Mesh(new BoxGeometry(3.72, 3.02, 0.03), new MeshStandardMaterial({
    color: 0x89a6bb,
    emissive: 0x6f8ea4,
    emissiveIntensity: 0.06,
    roughness: 0.76,
    metalness: 0.06,
  }));
  opening.position.set(0, 1.56, 0.02);

  const leftDoor = new Mesh(new BoxGeometry(1.66, 2.9, 0.06), doorMaterial);
  const rightDoor = leftDoor.clone();
  leftDoor.position.set(-0.89, 1.5, -0.24);
  rightDoor.position.set(0.89, 1.5, -0.24);

  const panelMaterial = new MeshStandardMaterial({
    color: 0x9eb8c9,
    emissive: 0xbfd8e9,
    emissiveIntensity: 0.12,
    roughness: 0.48,
    metalness: 0.12,
  });

  const leftUpperPanel = new Mesh(new BoxGeometry(1.12, 1.02, 0.02), panelMaterial);
  const rightUpperPanel = leftUpperPanel.clone();
  leftUpperPanel.position.set(-0.89, 2.04, -0.28);
  rightUpperPanel.position.set(0.89, 2.04, -0.28);

  const leftLowerPanel = new Mesh(new BoxGeometry(1.12, 1.08, 0.02), panelMaterial);
  const rightLowerPanel = leftLowerPanel.clone();
  leftLowerPanel.position.set(-0.89, 0.96, -0.28);
  rightLowerPanel.position.set(0.89, 0.96, -0.28);

  const leftWindow = new Mesh(new BoxGeometry(0.62, 0.74, 0.02), windowMaterial);
  const rightWindow = leftWindow.clone();
  leftWindow.position.set(-0.89, 2.06, -0.31);
  rightWindow.position.set(0.89, 2.06, -0.31);

  const leftPushBar = new Mesh(new BoxGeometry(0.64, 0.08, 0.05), trimMaterial);
  const rightPushBar = leftPushBar.clone();
  leftPushBar.position.set(-0.89, 1.18, -0.34);
  rightPushBar.position.set(0.89, 1.18, -0.34);

  const leftKickPlate = new Mesh(new BoxGeometry(1.18, 0.3, 0.02), trimMaterial);
  const rightKickPlate = leftKickPlate.clone();
  leftKickPlate.position.set(-0.89, 0.42, -0.29);
  rightKickPlate.position.set(0.89, 0.42, -0.29);

  const centerSeam = new Mesh(new BoxGeometry(0.07, 2.94, 0.04), trimMaterial);
  centerSeam.position.set(0, 1.5, -0.32);

  const topTrim = new Mesh(new BoxGeometry(4.34, 0.18, 0.06), trimMaterial);
  topTrim.position.set(0, 3.42, -0.18);
  const leftTrim = new Mesh(new BoxGeometry(0.16, 3.48, 0.06), trimMaterial);
  const rightTrim = leftTrim.clone();
  leftTrim.position.set(-2.09, 1.74, -0.18);
  rightTrim.position.set(2.09, 1.74, -0.18);

  root.add(
    recess,
    frame,
    opening,
    leftDoor,
    rightDoor,
    leftUpperPanel,
    rightUpperPanel,
    leftLowerPanel,
    rightLowerPanel,
    leftWindow,
    rightWindow,
    leftPushBar,
    rightPushBar,
    leftKickPlate,
    rightKickPlate,
    centerSeam,
    topTrim,
    leftTrim,
    rightTrim,
  );
  return root;
}

function createRedDoorPeekFigure(
  x: number,
  z: number,
  rotationY: number,
): ChapterTwoPeekFigure {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;
  root.visible = false;

  const rig = new Group();
  root.add(rig);

  const plushBlue = new MeshStandardMaterial({
    color: 0x25508a,
    emissive: 0x163056,
    emissiveIntensity: 0.16,
    roughness: 0.9,
    metalness: 0.01,
  });
  const plushBlueDark = new MeshStandardMaterial({
    color: 0x11264a,
    emissive: 0x0a1630,
    emissiveIntensity: 0.12,
    roughness: 0.92,
    metalness: 0.02,
  });
  const patchMaterial = new MeshStandardMaterial({
    color: 0x8da4bf,
    emissive: 0x394b61,
    emissiveIntensity: 0.06,
    roughness: 0.88,
    metalness: 0.02,
  });
  const seamMaterial = new MeshStandardMaterial({
    color: 0x2a161d,
    emissive: 0x13080d,
    emissiveIntensity: 0.14,
    roughness: 0.86,
    metalness: 0.02,
  });
  const lipMaterial = new MeshStandardMaterial({
    color: 0xc14f74,
    emissive: 0x8e294b,
    emissiveIntensity: 0.36,
    roughness: 0.88,
    metalness: 0.02,
  });
  const mouthMaterial = new MeshStandardMaterial({
    color: 0x140d15,
    emissive: 0x0b0409,
    emissiveIntensity: 0.2,
    roughness: 0.82,
    metalness: 0.04,
  });
  const toothMaterial = new MeshStandardMaterial({
    color: 0xf3ede3,
    emissive: 0xf0e4d7,
    emissiveIntensity: 0.08,
    roughness: 0.58,
    metalness: 0.04,
  });
  const gumMaterial = new MeshStandardMaterial({
    color: 0x7a2440,
    emissive: 0x4f182b,
    emissiveIntensity: 0.28,
    roughness: 0.74,
    metalness: 0.02,
  });
  const eyeMaterial = new MeshStandardMaterial({
    color: 0x0d1117,
    roughness: 0.32,
    metalness: 0.16,
  });
  const noseMaterial = new MeshStandardMaterial({
    color: 0x171920,
    emissive: 0x08090d,
    emissiveIntensity: 0.06,
    roughness: 0.48,
    metalness: 0.08,
  });
  const buttonMaterial = new MeshStandardMaterial({
    color: 0x232b35,
    emissive: 0x0b1117,
    emissiveIntensity: 0.05,
    roughness: 0.62,
    metalness: 0.22,
  });
  const socketMaterial = new MeshStandardMaterial({
    color: 0x0a1019,
    emissive: 0x05080d,
    emissiveIntensity: 0.04,
    roughness: 0.74,
    metalness: 0.02,
  });
  const eyeGlowMaterial = new MeshStandardMaterial({
    color: 0xeaf3ff,
    emissive: 0xcfe0ff,
    emissiveIntensity: 0.65,
    roughness: 0.24,
    metalness: 0.06,
  });
  const clawMaterial = new MeshStandardMaterial({
    color: 0xe9e2d4,
    emissive: 0x7f6a54,
    emissiveIntensity: 0.06,
    roughness: 0.52,
    metalness: 0.05,
  });

  const torso = new Mesh(new SphereGeometry(0.46, 18, 16), plushBlue);
  torso.scale.set(0.8, 1.54, 0.66);
  torso.position.set(-0.45, 1.24, -0.18);

  const shoulder = new Mesh(new SphereGeometry(0.34, 16, 14), plushBlue);
  shoulder.scale.set(1.38, 0.74, 0.68);
  shoulder.position.set(-0.14, 1.58, -0.12);
  const hips = new Mesh(new SphereGeometry(0.31, 16, 14), plushBlueDark);
  hips.scale.set(0.98, 0.88, 0.62);
  hips.position.set(-0.24, 0.98, -0.16);
  const bellyPatch = new Mesh(new SphereGeometry(0.25, 16, 14), patchMaterial);
  bellyPatch.scale.set(0.98, 1.28, 0.28);
  bellyPatch.position.set(-0.21, 1.23, 0.31);
  const chestPatch = new Mesh(new SphereGeometry(0.16, 14, 12), patchMaterial);
  chestPatch.scale.set(0.94, 1.12, 0.22);
  chestPatch.position.set(-0.14, 1.5, 0.24);
  const chestTearLeft = new Mesh(new BoxGeometry(0.038, 0.24, 0.028), seamMaterial);
  const chestTearRight = chestTearLeft.clone();
  chestTearLeft.position.set(-0.31, 1.34, 0.29);
  chestTearRight.position.set(0.02, 1.46, 0.24);
  chestTearLeft.rotation.z = -0.36;
  chestTearRight.rotation.z = 0.28;
  const chestSpikeA = new Mesh(new CylinderGeometry(0.012, 0.042, 0.22, 8), toothMaterial);
  const chestSpikeB = chestSpikeA.clone();
  chestSpikeA.position.set(-0.02, 1.44, 0.28);
  chestSpikeB.position.set(-0.24, 1.2, 0.34);
  chestSpikeA.rotation.z = -0.44;
  chestSpikeB.rotation.z = 0.3;
  chestSpikeA.scale.setScalar(0.48);
  chestSpikeB.scale.setScalar(0.42);
  const bellySeam = new Mesh(new BoxGeometry(0.026, 0.72, 0.028), seamMaterial);
  bellySeam.position.set(-0.18, 1.28, 0.41);
  const bellyButtonTop = new Mesh(new CylinderGeometry(0.03, 0.03, 0.03, 12), buttonMaterial);
  const bellyButtonBottom = bellyButtonTop.clone();
  bellyButtonTop.rotation.x = Math.PI / 2;
  bellyButtonBottom.rotation.x = Math.PI / 2;
  bellyButtonTop.position.set(-0.18, 1.2, 0.43);
  bellyButtonBottom.position.set(-0.18, 1.38, 0.43);
  const shoulderFluffLeft = new Mesh(new SphereGeometry(0.14, 12, 12), plushBlueDark);
  const shoulderFluffRight = shoulderFluffLeft.clone();
  shoulderFluffLeft.scale.set(0.84, 1.9, 0.56);
  shoulderFluffRight.scale.set(0.84, 1.9, 0.56);
  shoulderFluffLeft.position.set(-0.48, 1.6, 0.04);
  shoulderFluffRight.position.set(0.2, 1.56, 0.06);

  const neckRuff = new Mesh(new TorusGeometry(0.29, 0.07, 10, 18), plushBlueDark);
  neckRuff.rotation.x = Math.PI / 2;
  neckRuff.position.set(-0.08, 1.72, 0);

  const head = new Group();
  head.position.set(0.11, 1.94, 0.15);

  const skull = new Mesh(new SphereGeometry(0.42, 20, 18), plushBlue);
  skull.scale.set(1.14, 1.2, 0.88);
  const cheekLeft = new Mesh(new SphereGeometry(0.12, 12, 12), plushBlue);
  const cheekRight = cheekLeft.clone();
  cheekLeft.position.set(-0.26, -0.04, 0.23);
  cheekRight.position.set(0.25, -0.06, 0.23);
  const jawHollow = new Mesh(new SphereGeometry(0.1, 12, 12), socketMaterial);
  jawHollow.scale.set(1.5, 0.8, 0.68);
  jawHollow.position.set(0, -0.19, 0.24);
  const brow = new Mesh(new BoxGeometry(0.52, 0.07, 0.1), plushBlueDark);
  brow.position.set(0, 0.09, 0.32);
  brow.rotation.x = -0.48;
  const browHornLeft = new Mesh(new CylinderGeometry(0.008, 0.028, 0.14, 8), toothMaterial);
  const browHornRight = browHornLeft.clone();
  browHornLeft.position.set(-0.18, 0.2, 0.26);
  browHornRight.position.set(0.18, 0.16, 0.25);
  browHornLeft.rotation.z = -0.42;
  browHornRight.rotation.z = 0.38;
  browHornLeft.scale.setScalar(0.55);
  browHornRight.scale.setScalar(0.55);
  const muzzle = new Mesh(new SphereGeometry(0.18, 16, 14), patchMaterial);
  muzzle.scale.set(1.42, 0.86, 0.86);
  muzzle.position.set(0, -0.128, 0.312);
  const nose = new Mesh(new SphereGeometry(0.06, 12, 12), noseMaterial);
  nose.scale.set(1.04, 0.7, 0.92);
  nose.position.set(0, 0.006, 0.414);
  const eyeSocketLeft = new Mesh(new SphereGeometry(0.09, 12, 12), socketMaterial);
  const eyeSocketRight = eyeSocketLeft.clone();
  eyeSocketLeft.scale.set(1.46, 1.02, 0.58);
  eyeSocketRight.scale.set(1.3, 0.96, 0.54);
  eyeSocketLeft.position.set(-0.128, 0.074, 0.314);
  eyeSocketRight.position.set(0.116, 0.012, 0.312);

  const upperLip = new Group();
  const upperLipCurve: Array<[number, number, number, number]> = [
    [-0.24, -0.088, 0.048, 0.22],
    [-0.18, -0.094, 0.048, 0.22],
    [-0.12, -0.1, 0.047, 0.21],
    [-0.06, -0.104, 0.046, 0.2],
    [0, -0.106, 0.045, 0.18],
    [0.06, -0.104, 0.046, 0.2],
    [0.12, -0.1, 0.047, 0.21],
    [0.18, -0.094, 0.048, 0.22],
    [0.24, -0.088, 0.048, 0.22],
  ];
  upperLipCurve.forEach(([lipX, lipY, radius, depthScale]) => {
    const bead = new Mesh(new SphereGeometry(radius, 12, 12), lipMaterial);
    bead.scale.set(1.14, 0.34, depthScale);
    bead.position.set(lipX, lipY, 0.336);
    upperLip.add(bead);
  });
  const cupidBow = new Mesh(new SphereGeometry(0.03, 12, 12), lipMaterial);
  cupidBow.scale.set(0.92, 0.22, 0.14);
  cupidBow.position.set(0, -0.102, 0.34);
  upperLip.add(cupidBow);

  const lowerLip = new Group();
  const lowerLipCurve: Array<[number, number, number, number]> = [
    [-0.24, -0.162, 0.045, 0.2],
    [-0.18, -0.17, 0.046, 0.2],
    [-0.12, -0.176, 0.046, 0.19],
    [-0.06, -0.182, 0.045, 0.18],
    [0, -0.186, 0.044, 0.16],
    [0.06, -0.182, 0.045, 0.18],
    [0.12, -0.176, 0.046, 0.19],
    [0.18, -0.17, 0.046, 0.2],
    [0.24, -0.162, 0.045, 0.2],
  ];
  lowerLipCurve.forEach(([lipX, lipY, radius, depthScale]) => {
    const bead = new Mesh(new SphereGeometry(radius, 12, 12), lipMaterial);
    bead.scale.set(1.12, 0.26, depthScale);
    bead.position.set(lipX, lipY, 0.336);
    lowerLip.add(bead);
  });

  const lipCornerLeft = new Mesh(new SphereGeometry(0.05, 12, 12), lipMaterial);
  const lipCornerRight = lipCornerLeft.clone();
  lipCornerLeft.scale.set(0.78, 0.22, 0.14);
  lipCornerRight.scale.set(0.78, 0.22, 0.14);
  lipCornerLeft.position.set(-0.278, -0.124, 0.336);
  lipCornerRight.position.set(0.278, -0.124, 0.336);
  const smileCreaseLeft = new Mesh(new BoxGeometry(0.03, 0.09, 0.038), plushBlueDark);
  const smileCreaseRight = smileCreaseLeft.clone();
  smileCreaseLeft.position.set(-0.24, -0.128, 0.286);
  smileCreaseRight.position.set(0.24, -0.128, 0.286);
  smileCreaseLeft.rotation.z = 0;
  smileCreaseRight.rotation.z = 0;
  const mouthCavity = new Mesh(new BoxGeometry(0.4, 0.16, 0.11), mouthMaterial);
  mouthCavity.position.set(0, -0.146, 0.296);
  const upperGum = new Mesh(new BoxGeometry(0.35, 0.042, 0.054), gumMaterial);
  upperGum.position.set(0, -0.09, 0.302);
  const lowerGum = new Mesh(new BoxGeometry(0.35, 0.038, 0.052), gumMaterial);
  lowerGum.position.set(0, -0.182, 0.302);
  const mouthShadow = new Mesh(new BoxGeometry(0.32, 0.072, 0.068), mouthMaterial);
  mouthShadow.position.set(0, -0.138, 0.258);

  const eyeLeft = new Mesh(new SphereGeometry(0.028, 10, 10), eyeMaterial);
  const eyeRight = eyeLeft.clone();
  eyeLeft.scale.set(0.38, 1.02, 0.38);
  eyeRight.scale.set(0.34, 0.84, 0.34);
  eyeLeft.position.set(-0.122, 0.074, 0.36);
  eyeRight.position.set(0.104, 0.016, 0.354);
  const eyeGlowLeft = new Mesh(new SphereGeometry(0.013, 10, 10), eyeGlowMaterial);
  const eyeGlowRight = eyeGlowLeft.clone();
  eyeGlowLeft.position.set(-0.121, 0.074, 0.382);
  eyeGlowRight.position.set(0.104, 0.016, 0.376);
  const eyeGlowExtraLeft = new Mesh(new SphereGeometry(0.009, 10, 10), eyeGlowMaterial);
  const eyeGlowExtraRight = eyeGlowExtraLeft.clone();
  eyeGlowExtraLeft.position.set(-0.092, 0.104, 0.37);
  eyeGlowExtraRight.position.set(0.126, 0.046, 0.364);
  const eyePatchLeft = new Mesh(new SphereGeometry(0.055, 10, 10), plushBlueDark);
  const eyePatchRight = eyePatchLeft.clone();
  eyePatchLeft.scale.set(1.1, 0.86, 0.5);
  eyePatchRight.scale.set(1.1, 0.86, 0.5);
  eyePatchLeft.position.set(-0.112, 0.088, 0.31);
  eyePatchRight.position.set(0.112, 0.038, 0.31);
  const eyeScarLeft = new Mesh(new BoxGeometry(0.026, 0.18, 0.02), seamMaterial);
  eyeScarLeft.position.set(-0.17, 0.11, 0.34);
  eyeScarLeft.rotation.z = -0.3;
  const eyeScarRight = new Mesh(new BoxGeometry(0.022, 0.14, 0.02), seamMaterial);
  eyeScarRight.position.set(0.16, 0.07, 0.33);
  eyeScarRight.rotation.z = 0.38;
  const cheekTearLeft = new Mesh(new BoxGeometry(0.034, 0.14, 0.024), seamMaterial);
  const cheekTearRight = cheekTearLeft.clone();
  cheekTearLeft.position.set(-0.24, -0.064, 0.35);
  cheekTearRight.position.set(0.242, -0.084, 0.346);
  cheekTearLeft.rotation.z = -0.44;
  cheekTearRight.rotation.z = 0.36;
  const faceSeamLeft = new Mesh(new BoxGeometry(0.022, 0.26, 0.018), seamMaterial);
  const faceSeamRight = faceSeamLeft.clone();
  faceSeamLeft.position.set(-0.31, -0.008, 0.31);
  faceSeamRight.position.set(0.29, -0.034, 0.304);
  faceSeamLeft.rotation.z = -0.24;
  faceSeamRight.rotation.z = 0.18;
  const earTearLeft = new Mesh(new BoxGeometry(0.05, 0.12, 0.028), seamMaterial);
  const earTearRight = earTearLeft.clone();
  earTearLeft.position.set(-0.36, 0.28, 0.06);
  earTearRight.position.set(0.36, 0.26, 0.06);
  earTearLeft.rotation.z = -0.66;
  earTearRight.rotation.z = 0.52;
  const mouthTearLeft = new Mesh(new BoxGeometry(0.026, 0.12, 0.03), gumMaterial);
  const mouthTearRight = mouthTearLeft.clone();
  mouthTearLeft.position.set(-0.19, -0.14, 0.35);
  mouthTearRight.position.set(0.19, -0.14, 0.35);
  mouthTearLeft.rotation.z = -0.38;
  mouthTearRight.rotation.z = 0.38;
  const chinSpike = new Mesh(new CylinderGeometry(0.008, 0.028, 0.16, 8), toothMaterial);
  chinSpike.position.set(0.02, -0.24, 0.34);
  chinSpike.rotation.x = 0.22;
  chinSpike.scale.setScalar(0.5);

  const upperToothOffsets: Array<[number, number, number]> = [
    [-0.32, -0.03, 0.07],
    [-0.26, -0.024, 0.082],
    [-0.2, -0.016, 0.096],
    [-0.125, -0.004, 0.118],
    [-0.055, 0.01, 0.132],
    [0.03, 0.012, 0.14],
    [0.115, 0.002, 0.122],
    [0.195, -0.012, 0.102],
    [0.262, -0.022, 0.084],
    [0.324, -0.03, 0.07],
  ];
  upperToothOffsets.forEach(([toothX, toothY, height]) => {
    const toothTop = new Mesh(new CylinderGeometry(0.008, 0.034, height, 8), toothMaterial);
    toothTop.rotation.x = Math.PI;
    toothTop.position.set(toothX, -0.042 + toothY, 0.332);
    head.add(toothTop);
  });
  const lowerToothOffsets: Array<[number, number, number]> = [
    [-0.31, 0.018, 0.064],
    [-0.248, 0.012, 0.074],
    [-0.19, 0.006, 0.086],
    [-0.108, -0.004, 0.104],
    [-0.032, -0.01, 0.114],
    [0.055, -0.008, 0.11],
    [0.135, 0.002, 0.098],
    [0.205, 0.01, 0.084],
    [0.252, 0.014, 0.074],
    [0.314, 0.018, 0.064],
  ];
  lowerToothOffsets.forEach(([toothX, toothY, height]) => {
    const toothBottom = new Mesh(new CylinderGeometry(0.008, 0.032, height, 8), toothMaterial);
    toothBottom.position.set(toothX, -0.167 + toothY, 0.331);
    head.add(toothBottom);
  });
  [
    [-0.22, -0.034, 0.2],
    [0.22, -0.034, 0.2],
  ].forEach(([toothX, toothY, height]) => {
    const fang = new Mesh(new CylinderGeometry(0.008, 0.04, height, 8), toothMaterial);
    fang.rotation.x = Math.PI;
    fang.position.set(toothX, toothY - 0.01, 0.336);
    head.add(fang);
  });
  [
    [-0.12, -0.158, 0.1],
    [0.12, -0.158, 0.1],
  ].forEach(([toothX, toothY, height]) => {
    const lowerFang = new Mesh(new CylinderGeometry(0.006, 0.028, height, 8), toothMaterial);
    lowerFang.position.set(toothX, toothY, 0.336);
    head.add(lowerFang);
  });

  const earLeft = new Mesh(new SphereGeometry(0.14, 12, 12), plushBlueDark);
  const earRight = earLeft.clone();
  const earInnerLeft = new Mesh(new SphereGeometry(0.085, 12, 12), patchMaterial);
  const earInnerRight = earInnerLeft.clone();
  earLeft.scale.set(1, 1.1, 0.46);
  earRight.scale.set(1, 1.1, 0.46);
  earInnerLeft.scale.set(1, 1.06, 0.32);
  earInnerRight.scale.set(1, 1.06, 0.32);
  earLeft.position.set(-0.34, 0.29, 0.02);
  earRight.position.set(0.34, 0.29, 0.02);
  earInnerLeft.position.set(-0.34, 0.28, 0.08);
  earInnerRight.position.set(0.34, 0.28, 0.08);

  head.add(
    skull,
    cheekLeft,
    cheekRight,
    jawHollow,
    brow,
    browHornLeft,
    browHornRight,
    muzzle,
    nose,
    eyeSocketLeft,
    eyeSocketRight,
    eyePatchLeft,
    eyePatchRight,
    eyeLeft,
    eyeRight,
    eyeGlowLeft,
    eyeGlowRight,
    eyeGlowExtraLeft,
    eyeGlowExtraRight,
    eyeScarLeft,
    eyeScarRight,
    cheekTearLeft,
    cheekTearRight,
    faceSeamLeft,
    faceSeamRight,
    earTearLeft,
    earTearRight,
    mouthCavity,
    mouthShadow,
    upperGum,
    lowerGum,
    upperLip,
    lowerLip,
    lipCornerLeft,
    lipCornerRight,
    mouthTearLeft,
    mouthTearRight,
    chinSpike,
    smileCreaseLeft,
    smileCreaseRight,
    earLeft,
    earRight,
    earInnerLeft,
    earInnerRight,
  );

  const leftArmPivot = new Group();
  leftArmPivot.position.set(-0.38, 1.54, 0.04);
  const leftUpperArm = new Mesh(new CylinderGeometry(0.068, 0.09, 1.08, 12), plushBlue);
  leftUpperArm.position.set(0, -0.54, 0.08);
  leftUpperArm.rotation.z = 0.22;
  const leftForearm = new Mesh(new CylinderGeometry(0.05, 0.072, 1.06, 12), plushBlueDark);
  leftForearm.position.set(0.05, -1.14, 0.22);
  leftForearm.rotation.z = 0.18;
  const leftHand = new Mesh(new SphereGeometry(0.12, 12, 12), plushBlueDark);
  leftHand.scale.set(1.42, 0.62, 0.46);
  leftHand.position.set(0.12, -1.68, 0.42);
  const leftArmFluff = new Mesh(new SphereGeometry(0.12, 10, 10), plushBlue);
  leftArmFluff.scale.set(1.06, 1.62, 0.62);
  leftArmFluff.position.set(-0.02, -0.48, 0.14);
  leftArmPivot.add(leftUpperArm, leftForearm, leftHand, leftArmFluff);

  const rightArmPivot = new Group();
  rightArmPivot.position.set(0.12, 1.5, 0.06);
  const rightUpperArm = new Mesh(new CylinderGeometry(0.062, 0.086, 1.14, 12), plushBlue);
  rightUpperArm.position.set(0, -0.58, 0.04);
  rightUpperArm.rotation.z = -0.26;
  const rightForearm = new Mesh(new CylinderGeometry(0.048, 0.07, 1.08, 12), plushBlueDark);
  rightForearm.position.set(0.05, -1.2, 0.16);
  rightForearm.rotation.z = -0.2;
  const rightHand = new Mesh(new SphereGeometry(0.11, 12, 12), plushBlueDark);
  rightHand.scale.set(1.34, 0.6, 0.46);
  rightHand.position.set(0.12, -1.8, 0.34);
  const rightArmFluff = new Mesh(new SphereGeometry(0.1, 10, 10), plushBlue);
  rightArmFluff.scale.set(0.98, 1.5, 0.62);
  rightArmFluff.position.set(-0.01, -0.5, 0.08);
  rightArmPivot.add(rightUpperArm, rightForearm, rightHand, rightArmFluff);

  const leftLegPivot = new Group();
  leftLegPivot.position.set(-0.26, 1, -0.02);
  const leftThigh = new Mesh(new CylinderGeometry(0.09, 0.12, 0.82, 12), plushBlue);
  leftThigh.position.set(0, -0.42, 0);
  const leftShin = new Mesh(new CylinderGeometry(0.068, 0.092, 0.8, 12), plushBlueDark);
  leftShin.position.set(0, -0.96, 0.1);
  leftShin.rotation.x = 0.08;
  const leftFoot = new Mesh(new SphereGeometry(0.12, 12, 12), plushBlueDark);
  leftFoot.scale.set(1.4, 0.56, 1.9);
  leftFoot.position.set(0, -1.38, 0.24);
  const leftLegFluff = new Mesh(new SphereGeometry(0.12, 10, 10), plushBlue);
  leftLegFluff.scale.set(1.08, 1.4, 0.7);
  leftLegFluff.position.set(0, -0.38, 0.08);
  leftLegPivot.add(leftThigh, leftShin, leftFoot, leftLegFluff);

  const rightLegPivot = new Group();
  rightLegPivot.position.set(-0.02, 1, -0.02);
  const rightThigh = new Mesh(new CylinderGeometry(0.088, 0.116, 0.84, 12), plushBlue);
  rightThigh.position.set(0, -0.42, 0);
  const rightShin = new Mesh(new CylinderGeometry(0.066, 0.09, 0.78, 12), plushBlueDark);
  rightShin.position.set(0, -0.95, 0.09);
  rightShin.rotation.x = 0.08;
  const rightFoot = new Mesh(new SphereGeometry(0.116, 12, 12), plushBlueDark);
  rightFoot.scale.set(1.36, 0.54, 1.84);
  rightFoot.position.set(0, -1.36, 0.23);
  const rightLegFluff = new Mesh(new SphereGeometry(0.115, 10, 10), plushBlue);
  rightLegFluff.scale.set(1.04, 1.38, 0.7);
  rightLegFluff.position.set(0, -0.38, 0.06);
  rightLegPivot.add(rightThigh, rightShin, rightFoot, rightLegFluff);

  const addClaws = (parent: Group, offsets: Array<[number, number, number]>, length: number, invert = false): void => {
    offsets.forEach(([clawX, clawY, clawZ]) => {
      const claw = new Mesh(new CylinderGeometry(0.004, 0.018, length, 8), clawMaterial);
      claw.position.set(clawX, clawY, clawZ);
      claw.rotation.set(invert ? 0.32 : -0.34, 0, invert ? Math.PI : 0);
      parent.add(claw);
    });
  };
  addClaws(leftArmPivot, [[0.0, -1.78, 0.66], [0.1, -1.77, 0.64], [0.2, -1.76, 0.6]], 0.2);
  addClaws(rightArmPivot, [[0.0, -1.9, 0.54], [0.1, -1.89, 0.52], [0.2, -1.88, 0.48]], 0.19);
  addClaws(leftLegPivot, [[-0.08, -1.42, 0.44], [0.0, -1.42, 0.46], [0.08, -1.42, 0.44]], 0.14, true);
  addClaws(rightLegPivot, [[-0.08, -1.4, 0.42], [0.0, -1.4, 0.44], [0.08, -1.4, 0.42]], 0.14, true);

  const fringeOffsets: Array<[number, number, number]> = [
    [-0.52, 1.12, 0.24],
    [-0.4, 1.58, 0.2],
    [-0.12, 1.05, 0.34],
    [0.14, 1.58, 0.18],
    [0.28, 1.28, 0.18],
    [-0.3, 0.94, 0.1],
    [-0.08, 0.88, 0.16],
    [0.08, 1.18, 0.12],
    [-0.2, 1.82, 0.08],
    [0.12, 1.76, 0.12],
    [-0.3, 1.64, 0.26],
    [-0.06, 1.52, 0.3],
    [0.18, 1.42, 0.22],
    [0.24, 1.04, 0.08],
    [-0.18, 0.74, 0.02],
    [0.04, 0.82, 0.04],
  ];
  fringeOffsets.forEach(([fringeX, fringeY, fringeZ], index) => {
    const fluff = new Mesh(
      new SphereGeometry(index % 2 === 0 ? 0.13 : 0.1, 10, 10),
      index % 2 === 0 ? plushBlue : plushBlueDark,
    );
    fluff.scale.set(1.16, 1.74, 0.64);
    fluff.position.set(fringeX, fringeY, fringeZ);
    rig.add(fluff);
  });

  const torsoGroup = new Group();
  torsoGroup.add(torso, shoulder, hips, neckRuff, head);
  torsoGroup.add(
    bellyPatch,
    chestPatch,
    chestTearLeft,
    chestTearRight,
    chestSpikeA,
    chestSpikeB,
    bellySeam,
    bellyButtonTop,
    bellyButtonBottom,
    shoulderFluffLeft,
    shoulderFluffRight,
  );
  torsoGroup.rotation.set(0.28, 0.02, -0.16);

  rig.add(torsoGroup, leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot);
  rig.scale.setScalar(2.02);

  const revealLight = new PointLight(0x6aa5ff, 10.4, 36, 1.2);
  revealLight.position.set(0.1, 2.08, 0.76);
  const lipGlow = new PointLight(0xc74467, 5.4, 20, 1.46);
  lipGlow.position.set(0.02, 1.64, 0.92);
  root.add(revealLight, lipGlow);

  const smokeRoot = new Group();
  smokeRoot.visible = false;
  root.add(smokeRoot);

  const smokePuffs = Array.from({ length: 7 }, (_, index) => {
    const material = new MeshStandardMaterial({
      color: 0xc8d8ef,
      emissive: 0x8fa7cf,
      emissiveIntensity: 0.26,
      roughness: 0.96,
      metalness: 0.02,
      transparent: true,
      opacity: 0,
    });
    const mesh = new Mesh(
      new SphereGeometry(index % 2 === 0 ? 0.22 : 0.16, 10, 10),
      material,
    );
    const startPosition = new Vector3(
      (index - 3) * 0.16,
      1.1 + (index % 3) * 0.18,
      (index % 2 === 0 ? 1 : -1) * 0.12,
    );
    mesh.position.copy(startPosition);
    const baseScale = index % 2 === 0 ? 0.8 : 0.62;
    mesh.scale.setScalar(baseScale);
    smokeRoot.add(mesh);
    return {
      mesh,
      material,
      drift: new Vector3(
        (index - 3) * 0.22,
        0.72 + (index % 3) * 0.16,
        (index % 2 === 0 ? 1 : -1) * (0.18 + index * 0.01),
      ),
      startPosition,
      baseScale,
    };
  });

  return {
    root,
    rig,
    head,
    torso: torsoGroup,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    revealLight,
    lipGlow,
    smokeRoot,
    smokePuffs,
    visibility: 0,
    active: false,
    phase: 'watching',
    triggered: false,
    exhausted: false,
    stareRemaining: RED_DOOR_PEEK_STARE_TIME,
    vanishRemaining: 0,
    homePosition: new Vector3(x, 0, z),
    homeRotationY: rotationY,
  };
}

function createCouch(
  id: string,
  x: number,
  z: number,
  rotationY: number,
  colorHex: number,
): { root: Group; seat: ChapterTwoSeat } {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const upholstery = new MeshStandardMaterial({
    color: colorHex,
    roughness: 0.88,
    metalness: 0.02,
  });
  const frame = new MeshStandardMaterial({
    color: 0xc8b08b,
    roughness: 0.76,
    metalness: 0.08,
  });

  const base = new Mesh(new BoxGeometry(2.4, 0.56, 1.02), upholstery);
  base.position.y = 0.32;
  const back = new Mesh(new BoxGeometry(2.4, 0.86, 0.18), upholstery);
  back.position.set(0, 0.84, -0.42);
  const leftArm = new Mesh(new BoxGeometry(0.18, 0.72, 1.02), upholstery);
  const rightArm = leftArm.clone();
  leftArm.position.set(-1.1, 0.5, 0);
  rightArm.position.set(1.1, 0.5, 0);
  const leftLeg = new Mesh(new BoxGeometry(0.1, 0.18, 0.1), frame);
  const rightLeg = leftLeg.clone();
  const rearLeftLeg = leftLeg.clone();
  const rearRightLeg = leftLeg.clone();
  leftLeg.position.set(-0.9, 0.09, 0.34);
  rightLeg.position.set(0.9, 0.09, 0.34);
  rearLeftLeg.position.set(-0.9, 0.09, -0.34);
  rearRightLeg.position.set(0.9, 0.09, -0.34);

  root.add(base, back, leftArm, rightArm, leftLeg, rightLeg, rearLeftLeg, rearRightLeg);

  return {
    root,
    seat: {
      id,
      label: 'Couch',
      position: offsetPosition(x, z, rotationY, 0, 1.18).setY(1.04),
      sitPosition: offsetPosition(x, z, rotationY, 0, 0.16).setY(1.7),
      exitPosition: offsetPosition(x, z, rotationY, 0, 1.4).setY(1.72),
      lookTarget: offsetPosition(x, z, rotationY, 0, 4.8).setY(1.4),
      kind: 'couch',
    },
  };
}

function createLobbyRefreshmentDesk(
  x: number,
  z: number,
  rotationY: number,
  variant: 'coffee' | 'supplies',
): Group {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const woodMaterial = new MeshStandardMaterial({
    color: 0xb88962,
    roughness: 0.76,
    metalness: 0.06,
  });
  const topMaterial = new MeshStandardMaterial({
    color: 0xd7dde3,
    roughness: 0.44,
    metalness: 0.24,
  });
  const metalMaterial = new MeshStandardMaterial({
    color: 0x8f99a3,
    roughness: 0.36,
    metalness: 0.72,
  });
  const darkMaterial = new MeshStandardMaterial({
    color: 0x2f353c,
    roughness: 0.56,
    metalness: 0.24,
  });
  const cupMaterial = new MeshStandardMaterial({
    color: 0xf4f0e8,
    roughness: 0.82,
    metalness: 0.02,
  });

  const body = new Mesh(new BoxGeometry(1.68, 0.84, 0.72), woodMaterial);
  body.position.y = 0.42;
  const top = new Mesh(new BoxGeometry(1.78, 0.06, 0.82), topMaterial);
  top.position.y = 0.87;
  const shelf = new Mesh(new BoxGeometry(1.5, 0.05, 0.56), woodMaterial);
  shelf.position.y = 0.22;
  const leftLeg = new Mesh(new BoxGeometry(0.08, 0.84, 0.08), woodMaterial);
  const rightLeg = leftLeg.clone();
  leftLeg.position.set(-0.72, 0.42, 0.28);
  rightLeg.position.set(0.72, 0.42, 0.28);
  const rearLeftLeg = leftLeg.clone();
  const rearRightLeg = rightLeg.clone();
  rearLeftLeg.position.z = -0.28;
  rearRightLeg.position.z = -0.28;
  root.add(body, top, shelf, leftLeg, rightLeg, rearLeftLeg, rearRightLeg);

  if (variant === 'coffee') {
    const machine = new Group();
    machine.position.set(0.1, 0.9, -0.02);

    const base = new Mesh(new BoxGeometry(0.52, 0.42, 0.34), darkMaterial);
    base.position.y = 0.21;
    const head = new Mesh(new BoxGeometry(0.44, 0.18, 0.28), metalMaterial);
    head.position.set(0, 0.5, -0.02);
    const drip = new Mesh(new BoxGeometry(0.24, 0.04, 0.18), metalMaterial);
    drip.position.set(0, 0.06, 0.06);
    const pot = new Mesh(new CylinderGeometry(0.11, 0.12, 0.2, 14), cupMaterial);
    pot.position.set(0, 0.17, 0.08);
    const potHandle = new Mesh(new TorusGeometry(0.05, 0.012, 8, 18, Math.PI), darkMaterial);
    potHandle.rotation.z = Math.PI / 2;
    potHandle.position.set(0.13, 0.17, 0.08);
    const indicator = new Mesh(
      new BoxGeometry(0.08, 0.04, 0.02),
      new MeshStandardMaterial({
        color: 0xd54a45,
        emissive: 0xd54a45,
        emissiveIntensity: 0.8,
        roughness: 0.4,
        metalness: 0.12,
      }),
    );
    indicator.position.set(-0.16, 0.5, 0.15);
    machine.add(base, head, drip, pot, potHandle, indicator);

    const cupStackA = new Mesh(new CylinderGeometry(0.07, 0.08, 0.2, 16), cupMaterial);
    const cupStackB = cupStackA.clone();
    cupStackA.position.set(-0.54, 0.98, 0.08);
    cupStackB.position.set(-0.34, 0.98, 0.08);
    const sleeve = new Mesh(
      new CylinderGeometry(0.085, 0.085, 0.06, 16),
      new MeshStandardMaterial({
        color: 0xb17f55,
        roughness: 0.78,
        metalness: 0.04,
      }),
    );
    sleeve.position.set(-0.34, 0.92, 0.08);

    root.add(machine, cupStackA, cupStackB, sleeve);
  } else {
    const tray = new Mesh(
      new BoxGeometry(0.74, 0.04, 0.36),
      new MeshStandardMaterial({
        color: 0x56616d,
        roughness: 0.64,
        metalness: 0.24,
      }),
    );
    tray.position.set(-0.1, 0.91, 0);
    root.add(tray);

    const packetColors = [0xf4f0e8, 0xf0ccda, 0xe9d6a2, 0xd5e8f0, 0xf5e5b6];
    packetColors.forEach((colorHex, index) => {
      const packet = new Mesh(
        new BoxGeometry(0.11, 0.025, 0.07),
        new MeshStandardMaterial({
          color: colorHex,
          roughness: 0.92,
          metalness: 0.02,
        }),
      );
      packet.position.set(-0.34 + (index % 3) * 0.18, 0.95, -0.08 + Math.floor(index / 3) * 0.12);
      packet.rotation.y = (index - 2) * 0.18;
      root.add(packet);
    });

    const stirCup = new Mesh(new CylinderGeometry(0.08, 0.1, 0.16, 16), cupMaterial);
    stirCup.position.set(0.42, 0.96, 0.06);
    const stirOffsets = [-0.028, 0, 0.028, 0.05];
    stirOffsets.forEach((offsetX, index) => {
      const stir = new Mesh(
        new BoxGeometry(0.012, 0.18, 0.012),
        new MeshStandardMaterial({
          color: 0xdfc195,
          roughness: 0.88,
          metalness: 0.02,
        }),
      );
      stir.position.set(0.42 + offsetX, 1.08 + index * 0.005, 0.06 + (index % 2 === 0 ? -0.01 : 0.01));
      stir.rotation.z = (index - 1.5) * 0.08;
      root.add(stir);
    });

    const creamerA = new Mesh(new CylinderGeometry(0.05, 0.06, 0.16, 14), cupMaterial);
    const creamerB = creamerA.clone();
    creamerA.position.set(0.24, 0.95, -0.1);
    creamerB.position.set(0.36, 0.95, -0.12);
    const capA = new Mesh(new CylinderGeometry(0.026, 0.026, 0.04, 12), darkMaterial);
    const capB = capA.clone();
    capA.position.set(0.24, 1.05, -0.1);
    capB.position.set(0.36, 1.05, -0.12);
    root.add(stirCup, creamerA, creamerB, capA, capB);
  }

  return root;
}

function createLobbyFishTank(
  x: number,
  z: number,
  rotationY: number,
): LobbyFishTankResult {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const standMaterial = new MeshStandardMaterial({
    color: 0x9d7758,
    roughness: 0.78,
    metalness: 0.06,
  });
  const trimMaterial = new MeshStandardMaterial({
    color: 0xced8e0,
    roughness: 0.36,
    metalness: 0.54,
  });
  const glassMaterial = new MeshStandardMaterial({
    color: 0xbfdbea,
    emissive: 0x88bfd3,
    emissiveIntensity: 0.12,
    roughness: 0.1,
    metalness: 0.04,
    transparent: true,
    opacity: 0.28,
  });
  const waterMaterial = new MeshStandardMaterial({
    color: 0x4e9ec0,
    emissive: 0x4ec0df,
    emissiveIntensity: 0.08,
    roughness: 0.18,
    metalness: 0.02,
    transparent: true,
    opacity: 0.5,
  });
  const gravelMaterial = new MeshStandardMaterial({
    color: 0xc5c0b4,
    roughness: 0.92,
    metalness: 0.02,
  });
  const kelpMaterial = new MeshStandardMaterial({
    color: 0x3e8058,
    roughness: 0.94,
    metalness: 0.02,
  });
  const crackedGlassMaterial = new MeshStandardMaterial({
    color: 0xd7e8f3,
    emissive: 0x8fb7ca,
    emissiveIntensity: 0.08,
    roughness: 0.18,
    metalness: 0.04,
    transparent: true,
    opacity: 0.4,
  });

  const stand = new Mesh(new BoxGeometry(4.8, 1.14, 1.12), standMaterial);
  stand.position.y = 0.57;
  const topCap = new Mesh(new BoxGeometry(4.94, 0.08, 1.24), trimMaterial);
  topCap.position.y = 1.18;
  const bottomCap = new Mesh(new BoxGeometry(4.86, 0.1, 1.16), trimMaterial);
  bottomCap.position.y = 1.24;
  const tankShell = new Mesh(new BoxGeometry(4.74, 2.18, 1.02), glassMaterial);
  tankShell.position.y = 2.34;
  const water = new Mesh(new BoxGeometry(4.52, 1.96, 0.84), waterMaterial);
  water.position.set(0, 2.3, 0);
  const gravel = new Mesh(new BoxGeometry(4.3, 0.16, 0.72), gravelMaterial);
  gravel.position.set(0, 1.38, 0);

  const leftPost = new Mesh(new BoxGeometry(0.12, 2.24, 0.14), trimMaterial);
  const rightPost = leftPost.clone();
  leftPost.position.set(-2.33, 2.3, 0);
  rightPost.position.set(2.33, 2.3, 0);
  const topTrim = new Mesh(new BoxGeometry(4.82, 0.12, 0.14), trimMaterial);
  topTrim.position.set(0, 3.42, 0);

  root.add(stand, topCap, bottomCap, tankShell, water, gravel, leftPost, rightPost, topTrim);

  const plantOffsets: Array<[number, number, number, number]> = [
    [-1.68, 1.44, -0.18, 0.82],
    [-0.86, 1.44, 0.14, 0.96],
    [0.24, 1.44, -0.12, 0.9],
    [1.36, 1.44, 0.18, 1.04],
  ];

  plantOffsets.forEach(([plantX, plantY, plantZ, height], index) => {
    const stem = new Mesh(new CylinderGeometry(0.028, 0.04, height, 8), kelpMaterial);
    stem.position.set(plantX, plantY + height * 0.5, plantZ);
    stem.rotation.z = -0.08 + index * 0.04;
    root.add(stem);

    const frond = new Mesh(new BoxGeometry(0.12, height * 0.82, 0.02), kelpMaterial);
    frond.position.set(plantX + 0.06, plantY + height * 0.48, plantZ + 0.03);
    frond.rotation.z = 0.18 - index * 0.06;
    root.add(frond);
  });

  const fishColors: Array<[number, number]> = [
    [0xff975f, 0xffd1a5],
    [0xf0c052, 0xffefb4],
    [0xc95e44, 0xf6b59b],
    [0x8a92d4, 0xd9dff8],
  ];

  const fishRoots: Group[] = [];
  const baseOffsets: Array<{ x: number; y: number; z: number }> = [];
  const swimWidths: number[] = [];
  const swimDepths: number[] = [];
  const verticalAmplitudes: number[] = [];
  const phases: number[] = [];
  const speeds: number[] = [];

  fishColors.forEach(([bodyHex, finHex], index) => {
    const fishRoot = new Group();
    const fishMaterial = new MeshStandardMaterial({
      color: bodyHex,
      roughness: 0.54,
      metalness: 0.02,
    });
    const finMaterial = new MeshStandardMaterial({
      color: finHex,
      roughness: 0.58,
      metalness: 0.02,
    });
    const eyeMaterial = new MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.42,
      metalness: 0.08,
    });

    const body = new Mesh(new SphereGeometry(0.14, 14, 12), fishMaterial);
    body.scale.set(1.72, 0.82, 0.68);
    const tail = new Mesh(new BoxGeometry(0.18, 0.16, 0.04), finMaterial);
    tail.position.set(0.22, 0, 0);
    tail.rotation.z = 0.72;
    const finTop = new Mesh(new BoxGeometry(0.08, 0.1, 0.02), finMaterial);
    finTop.position.set(-0.04, 0.09, 0);
    finTop.rotation.z = -0.28;
    const eye = new Mesh(new SphereGeometry(0.015, 8, 8), eyeMaterial);
    eye.position.set(-0.14, 0.02, -0.05);

    fishRoot.add(body, tail, finTop, eye);

    const fishX = -1.45 + index * 0.96;
    const fishY = 2 + (index % 2 === 0 ? 0.18 : -0.08);
    const fishZ = -0.18 + index * 0.12;
    fishRoot.position.set(fishX, fishY, fishZ);
    fishRoot.rotation.y = index % 2 === 0 ? Math.PI : 0;
    root.add(fishRoot);

    fishRoots.push(fishRoot);
    baseOffsets.push({ x: fishX, y: fishY, z: fishZ });
    swimWidths.push(0.54 + index * 0.08);
    swimDepths.push(0.14 + (index % 2) * 0.06);
    verticalAmplitudes.push(0.04 + index * 0.008);
    phases.push(index * 1.37);
    speeds.push(0.58 + index * 0.09);
  });

  const crashedRoot = new Group();
  crashedRoot.position.set(x, 0, z);
  crashedRoot.rotation.y = rotationY;
  crashedRoot.visible = false;

  const crashedStand = new Mesh(new BoxGeometry(4.8, 1.14, 1.12), standMaterial);
  crashedStand.position.set(0, 0.57, 0);
  const fallenTankShell = new Mesh(new BoxGeometry(4.74, 2.18, 1.02), crackedGlassMaterial);
  fallenTankShell.position.set(0.54, 1.06, 1.02);
  fallenTankShell.rotation.z = -1.18;
  fallenTankShell.rotation.y = 0.1;
  const fallenTrim = new Mesh(new BoxGeometry(4.82, 0.12, 0.14), trimMaterial);
  fallenTrim.position.set(0.12, 0.34, 1.78);
  fallenTrim.rotation.z = -0.44;
  const spilledWater = new Mesh(new CylinderGeometry(1.52, 2.16, 0.05, 24), waterMaterial);
  spilledWater.position.set(0.86, 0.03, 2.02);
  spilledWater.scale.set(1.32, 1, 0.74);
  const waterRun = new Mesh(new BoxGeometry(2.46, 0.03, 0.9), waterMaterial);
  waterRun.position.set(1.72, 0.025, 0.92);
  waterRun.rotation.y = 0.18;
  const waterFan = new Mesh(new CylinderGeometry(1.04, 1.58, 0.03, 20), waterMaterial);
  waterFan.position.set(2.42, 0.022, 0.48);
  waterFan.scale.set(1.36, 1, 0.5);
  const waterSheet = new Mesh(new BoxGeometry(1.86, 0.022, 0.56), waterMaterial);
  waterSheet.position.set(-0.12, 0.021, 1.94);
  waterSheet.rotation.y = -0.12;
  const gravelPile = new Mesh(new BoxGeometry(2.4, 0.12, 0.68), gravelMaterial);
  gravelPile.position.set(0.98, 0.07, 1.58);
  gravelPile.rotation.y = 0.26;

  crashedRoot.add(
    crashedStand,
    fallenTankShell,
    fallenTrim,
    spilledWater,
    waterRun,
    waterFan,
    waterSheet,
    gravelPile,
  );

  plantOffsets.forEach(([plantX, , plantZ, height], index) => {
    const fallenStem = new Mesh(new CylinderGeometry(0.028, 0.04, height, 8), kelpMaterial);
    fallenStem.position.set(0.3 + plantX * 0.34, 0.08, 1.4 + plantZ * 1.8);
    fallenStem.rotation.set(Math.PI / 2, index * 0.42, 0.28 - index * 0.1);
    crashedRoot.add(fallenStem);
  });

  const glassShardSpecs: Array<[number, number, number, number, number]> = [
    [1.1, 0.03, 2.46, 0.34, 0.18],
    [1.48, 0.03, 2.22, 0.28, -0.34],
    [0.62, 0.03, 2.12, 0.22, 0.62],
    [1.92, 0.03, 1.64, 0.26, -0.18],
    [0.44, 0.03, 1.54, 0.18, 0.3],
    [1.54, 0.03, 0.88, 0.24, 0.1],
    [2.16, 0.03, 2.18, 0.24, 0.42],
    [2.34, 0.03, 1.42, 0.18, -0.12],
    [2.68, 0.03, 1.92, 0.3, -0.48],
    [2.88, 0.03, 1.08, 0.22, 0.08],
    [-0.18, 0.03, 2.28, 0.22, 0.22],
    [0.16, 0.03, 1.16, 0.16, -0.26],
    [1.22, 0.03, 0.34, 0.18, 0.56],
    [2.02, 0.03, 0.46, 0.14, -0.08],
  ];
  glassShardSpecs.forEach(([shardX, shardY, shardZ, width, rotationYValue]) => {
    const shard = new Mesh(new BoxGeometry(width, 0.02, 0.12), crackedGlassMaterial);
    shard.position.set(shardX, shardY, shardZ);
    shard.rotation.set(0.2, rotationYValue, 0.12);
    crashedRoot.add(shard);
  });

  const tinyShardSpecs: Array<[number, number, number, number, number, number]> = [
    [0.42, 0.02, 2.74, 0.12, 0.08, 0.18],
    [0.78, 0.02, 2.66, 0.1, -0.12, 0.1],
    [1.32, 0.02, 2.82, 0.14, 0.2, -0.08],
    [1.84, 0.02, 2.54, 0.1, -0.28, 0.14],
    [2.26, 0.02, 2.48, 0.08, 0.34, 0.06],
    [2.74, 0.02, 2.26, 0.1, -0.2, 0.18],
    [2.92, 0.02, 1.72, 0.12, 0.22, -0.04],
    [2.58, 0.02, 0.82, 0.08, -0.18, 0.08],
    [1.96, 0.02, 0.12, 0.1, 0.42, -0.1],
    [0.96, 0.02, 0.08, 0.08, -0.24, 0.14],
    [0.22, 0.02, 0.84, 0.1, 0.16, 0.08],
    [-0.34, 0.02, 1.86, 0.14, -0.1, 0.16],
  ];
  tinyShardSpecs.forEach(([shardX, shardY, shardZ, width, rotationYValue, roll]) => {
    const shard = new Mesh(new BoxGeometry(width, 0.014, 0.06), crackedGlassMaterial);
    shard.position.set(shardX, shardY, shardZ);
    shard.rotation.set(0.16, rotationYValue, roll);
    crashedRoot.add(shard);
  });

  return {
    root,
    crashedRoot,
    animator: {
      fishRoots,
      baseOffsets,
      swimWidths,
      swimDepths,
      verticalAmplitudes,
      phases,
      speeds,
      active: true,
    },
  };
}

function createRockingHorse(
  x: number,
  z: number,
  rotationY: number,
): { root: Group; seat: ChapterTwoSeat; animator: RockingAnimator } {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const wood = new MeshStandardMaterial({
    color: 0xc98b52,
    roughness: 0.76,
    metalness: 0.06,
  });
  const woodDark = new MeshStandardMaterial({
    color: 0x9b6035,
    roughness: 0.82,
    metalness: 0.04,
  });
  const accent = new MeshStandardMaterial({
    color: 0x7fb0d8,
    roughness: 0.82,
    metalness: 0.02,
  });
  const maneMaterial = new MeshStandardMaterial({
    color: 0x70452a,
    roughness: 0.9,
    metalness: 0.02,
  });
  const eyeMaterial = new MeshStandardMaterial({
    color: 0x241814,
    roughness: 0.74,
    metalness: 0.08,
  });

  const rockerPivot = new Group();

  const body = new Mesh(new BoxGeometry(0.9, 0.34, 0.26), wood);
  body.position.set(-0.04, 0.9, 0);
  const chest = new Mesh(new CylinderGeometry(0.18, 0.2, 0.24, 14), wood);
  chest.rotation.z = Math.PI / 2;
  chest.position.set(0.34, 0.92, 0);
  const haunch = new Mesh(new CylinderGeometry(0.2, 0.17, 0.24, 14), wood);
  haunch.rotation.z = Math.PI / 2;
  haunch.position.set(-0.46, 0.88, 0);

  const neck = new Mesh(new BoxGeometry(0.18, 0.54, 0.18), wood);
  neck.position.set(0.28, 1.12, 0);
  neck.rotation.z = -0.54;

  const headRoot = new Group();
  headRoot.position.set(0.54, 1.24, 0);
  headRoot.rotation.z = -0.08;
  const head = new Mesh(new BoxGeometry(0.3, 0.24, 0.18), wood);
  head.position.set(0, 0.02, 0);
  const muzzle = new Mesh(new BoxGeometry(0.2, 0.14, 0.14), woodDark);
  muzzle.position.set(0.2, -0.02, 0);
  const nose = new Mesh(new SphereGeometry(0.06, 12, 10), woodDark);
  nose.position.set(0.31, -0.02, 0);
  const leftEar = new Mesh(new BoxGeometry(0.05, 0.12, 0.04), wood);
  const rightEar = leftEar.clone();
  leftEar.position.set(-0.05, 0.17, -0.05);
  rightEar.position.set(-0.05, 0.17, 0.05);
  leftEar.rotation.z = -0.18;
  rightEar.rotation.z = -0.18;
  const leftEye = new Mesh(new SphereGeometry(0.018, 10, 10), eyeMaterial);
  const rightEye = leftEye.clone();
  leftEye.position.set(0.08, 0.04, -0.078);
  rightEye.position.set(0.08, 0.04, 0.078);
  headRoot.add(head, muzzle, nose, leftEar, rightEar, leftEye, rightEye);

  for (let index = 0; index < 4; index += 1) {
    const mane = new Mesh(new BoxGeometry(0.08, 0.14, 0.06), maneMaterial);
    mane.position.set(0.22 - index * 0.09, 1.28 - index * 0.1, 0);
    mane.rotation.z = -0.38 - index * 0.04;
    rockerPivot.add(mane);
  }

  const tailBase = new Mesh(new BoxGeometry(0.08, 0.18, 0.08), woodDark);
  tailBase.position.set(-0.58, 0.97, 0);
  tailBase.rotation.z = 0.44;
  const tailEnd = new Mesh(new BoxGeometry(0.06, 0.18, 0.06), accent);
  tailEnd.position.set(-0.65, 1.08, 0);
  tailEnd.rotation.z = 0.68;

  const saddle = new Mesh(new BoxGeometry(0.34, 0.08, 0.22), accent);
  saddle.position.set(-0.02, 1.03, 0);
  const saddleFront = new Mesh(new BoxGeometry(0.08, 0.1, 0.22), woodDark);
  saddleFront.position.set(0.1, 1.07, 0);
  const saddleBack = new Mesh(new BoxGeometry(0.08, 0.1, 0.22), woodDark);
  saddleBack.position.set(-0.16, 1.07, 0);
  const handleLeft = new Mesh(new CylinderGeometry(0.02, 0.02, 0.22, 12), woodDark);
  const handleRight = handleLeft.clone();
  handleLeft.rotation.x = Math.PI / 2;
  handleRight.rotation.x = Math.PI / 2;
  handleLeft.position.set(0.2, 1.11, -0.08);
  handleRight.position.set(0.2, 1.11, 0.08);

  const legOffsets: Array<[number, number, number]> = [
    [0.26, 0.62, -0.08],
    [0.26, 0.62, 0.08],
    [-0.3, 0.6, -0.08],
    [-0.3, 0.6, 0.08],
  ];
  legOffsets.forEach(([legX, legY, legZ], index) => {
    const leg = new Mesh(new BoxGeometry(0.08, 0.44, 0.08), wood);
    leg.position.set(legX, legY, legZ);
    leg.rotation.z = index < 2 ? 0.08 : -0.06;
    rockerPivot.add(leg);
  });

  const supportFront = new Mesh(new BoxGeometry(0.09, 0.78, 0.09), wood);
  const supportRear = supportFront.clone();
  supportFront.position.set(0.28, 0.48, 0);
  supportRear.position.set(-0.26, 0.48, 0);
  supportFront.rotation.z = -0.08;
  supportRear.rotation.z = 0.08;

  const rockerLeft = new Mesh(new TorusGeometry(0.72, 0.035, 10, 30, Math.PI * 0.95), woodDark);
  const rockerRight = rockerLeft.clone();
  rockerLeft.rotation.set(0, Math.PI / 2, Math.PI * 0.98);
  rockerRight.rotation.set(0, Math.PI / 2, Math.PI * 0.98);
  rockerLeft.position.set(-0.02, 0.08, -0.24);
  rockerRight.position.set(-0.02, 0.08, 0.24);
  const crossBraceFront = new Mesh(new BoxGeometry(0.16, 0.08, 0.56), woodDark);
  const crossBraceMid = new Mesh(new BoxGeometry(0.16, 0.08, 0.56), woodDark);
  const crossBraceRear = new Mesh(new BoxGeometry(0.16, 0.08, 0.56), woodDark);
  crossBraceFront.position.set(0.38, 0.1, 0);
  crossBraceMid.position.set(-0.02, 0.08, 0);
  crossBraceRear.position.set(-0.42, 0.12, 0);

  rockerPivot.add(
    body,
    chest,
    haunch,
    neck,
    headRoot,
    tailBase,
    tailEnd,
    saddle,
    saddleFront,
    saddleBack,
    handleLeft,
    handleRight,
    supportFront,
    supportRear,
    rockerLeft,
    rockerRight,
    crossBraceFront,
    crossBraceMid,
    crossBraceRear,
  );
  root.add(rockerPivot);

  return {
    root,
    seat: {
      id: 'rocking-horse',
      label: 'Rocking Horse',
      position: offsetPosition(x, z, rotationY, 0, 1.08).setY(1.02),
      sitPosition: offsetPosition(x, z, rotationY, -0.02, 0.04).setY(1.72),
      exitPosition: offsetPosition(x, z, rotationY, 0, 1.32).setY(1.72),
      lookTarget: offsetPosition(x, z, rotationY, 0, 4.2).setY(1.4),
      kind: 'rocker',
    },
    animator: {
      root: rockerPivot,
      seatId: 'rocking-horse',
      axis: 'z',
      mode: 'auto',
    },
  };
}

function createSwingSet(
  x: number,
  z: number,
  rotationY: number,
  scale = 1,
): {
  root: Group;
  seat: ChapterTwoSeat;
  animator: RockingAnimator;
  seatAnchor: Group;
  lookAnchor: Group;
} {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;
  const topBeamY = 2.86 * scale;
  const chainLength = 1.72 * scale;
  const seatY = 0.98 * scale;
  const seatWidth = 0.56 * scale;
  const seatDepth = 0.22 * scale;
  const swingSpacing = [-1.2, -0.4, 0.4, 1.2];

  const frameMaterial = new MeshStandardMaterial({
    color: 0x9ec7df,
    roughness: 0.48,
    metalness: 0.42,
  });
  const connectorMaterial = new MeshStandardMaterial({
    color: 0xe1b85a,
    roughness: 0.66,
    metalness: 0.14,
  });
  const chainMaterial = new MeshStandardMaterial({
    color: 0xbfc8d4,
    roughness: 0.38,
    metalness: 0.52,
  });
  const seatMaterial = new MeshStandardMaterial({
    color: 0xd85e58,
    roughness: 0.74,
    metalness: 0.06,
  });

  const topBeam = new Mesh(
    new BoxGeometry(4.04 * scale, 0.13 * scale, 0.14 * scale),
    frameMaterial,
  );
  topBeam.position.y = topBeamY;

  const legOffsets: Array<[number, number, number, number]> = [
    [-1.74, 1.38, -0.42, 0.24],
    [-1.74, 1.38, 0.42, -0.24],
    [1.74, 1.38, -0.42, -0.24],
    [1.74, 1.38, 0.42, 0.24],
  ];
  legOffsets.forEach(([legX, legY, legZ, tiltZ]) => {
    const leg = new Mesh(
      new CylinderGeometry(0.065 * scale, 0.085 * scale, 2.86 * scale, 10),
      frameMaterial,
    );
    leg.position.set(legX * scale, legY * scale, legZ * scale);
    leg.rotation.z = tiltZ;
    root.add(leg);
  });

  const braces: Array<[number, number, number, number]> = [
    [-1.38, 1.2, -0.02, -0.72],
    [1.38, 1.2, -0.02, 0.72],
  ];
  braces.forEach(([braceX, braceY, braceZ, rotZ]) => {
    const brace = new Mesh(
      new BoxGeometry(0.14 * scale, 1.16 * scale, 0.08 * scale),
      connectorMaterial,
    );
    brace.position.set(braceX * scale, braceY * scale, braceZ * scale);
    brace.rotation.z = rotZ;
    root.add(brace);
  });

  const swingPivot = new Group();
  swingPivot.position.y = topBeamY - 0.04 * scale;
  const swingRig = new Group();
  swingPivot.add(swingRig);
  const seatAnchor = new Group();
  const lookAnchor = new Group();
  swingSpacing.forEach((swingX, index) => {
    const chainLeft = new Mesh(
      new CylinderGeometry(0.015 * scale, 0.015 * scale, chainLength, 8),
      chainMaterial,
    );
    const chainRight = chainLeft.clone();
    const chainSpread = 0.2 * scale;
    chainLeft.position.set(swingX * scale - chainSpread, -chainLength * 0.5, 0);
    chainRight.position.set(swingX * scale + chainSpread, -chainLength * 0.5, 0);
    chainLeft.rotation.z = index % 2 === 0 ? 0.03 : -0.03;
    chainRight.rotation.z = index % 2 === 0 ? 0.05 : -0.05;

    const seat = new Mesh(
      new BoxGeometry(seatWidth, 0.07 * scale, seatDepth),
      seatMaterial,
    );
    seat.position.set(swingX * scale, -topBeamY + seatY, 0);
    seat.rotation.x = index % 2 === 0 ? 0.03 : -0.03;

    swingRig.add(chainLeft, chainRight, seat);
  });

  seatAnchor.position.set(-0.4 * scale, -topBeamY + seatY + 0.54 * scale, -0.02 * scale);
  lookAnchor.position.set(0, -topBeamY + seatY + 0.42 * scale, 3.8 * scale);
  swingRig.add(seatAnchor, lookAnchor);

  root.add(topBeam, swingPivot);
  return {
    root,
    seat: {
      id: 'dodo-room-swing',
      label: 'Swing Set',
      position: offsetPosition(x, z, rotationY, 0, 1.76 * scale).setY(1.02),
      sitPosition: offsetPosition(x, z, rotationY, -0.4 * scale, 0.14).setY(1.38),
      exitPosition: offsetPosition(x, z, rotationY, 0, 1.86 * scale).setY(1.72),
      lookTarget: offsetPosition(x, z, rotationY, 0, 4.2).setY(1.46),
      kind: 'swing',
    },
    animator: {
      root: swingPivot,
      seatId: 'dodo-room-swing',
      axis: 'x',
      mode: 'manual-swing',
      angle: 0,
      swingPhase: 0,
      swingPower: 0,
      maxAngle: 0.58,
      powerRiseRate: 0.78,
      powerDecayRate: 0.46,
      baseFrequency: 2.05,
      frequencyBoost: 1.45,
      response: 4.1,
    },
    seatAnchor,
    lookAnchor,
  };
}

function createToyTrainSet(
  x: number,
  z: number,
): { root: Group; animator: TrainAnimator } {
  const root = new Group();
  root.position.set(x, 0, z);

  const trackMaterial = new MeshStandardMaterial({
    color: 0x5b616b,
    roughness: 0.82,
    metalness: 0.14,
  });
  const woodMaterial = new MeshStandardMaterial({
    color: 0xc8884b,
    roughness: 0.74,
    metalness: 0.06,
  });
  const blueMaterial = new MeshStandardMaterial({
    color: 0x5e8edb,
    roughness: 0.72,
    metalness: 0.08,
  });
  const redMaterial = new MeshStandardMaterial({
    color: 0xd96f52,
    roughness: 0.7,
    metalness: 0.08,
  });
  const wheelMaterial = new MeshStandardMaterial({
    color: 0x2d3038,
    roughness: 0.74,
    metalness: 0.18,
  });

  const track = new Mesh(new TorusGeometry(1.36, 0.05, 10, 40), trackMaterial);
  track.rotation.x = Math.PI / 2;
  track.position.y = 0.05;
  root.add(track);

  for (let index = 0; index < 14; index += 1) {
    const tie = new Mesh(new BoxGeometry(0.22, 0.04, 0.1), woodMaterial);
    const angle = (index / 14) * Math.PI * 2;
    tie.position.set(Math.cos(angle) * 1.36, 0.02, Math.sin(angle) * 1.36);
    tie.rotation.y = -angle;
    root.add(tie);
  }

  const train = new Group();
  const engineAssembly = new Group();
  engineAssembly.position.set(0.18, 0.11, 0.34);
  engineAssembly.rotation.set(0.04, -0.22, 0.58);

  const engine = new Mesh(new BoxGeometry(0.28, 0.16, 0.36), blueMaterial);
  const engineCab = new Mesh(new BoxGeometry(0.16, 0.14, 0.16), woodMaterial);
  engineCab.position.set(-0.08, 0.14, -0.01);
  const engineFront = new Mesh(new CylinderGeometry(0.09, 0.09, 0.18, 12), redMaterial);
  engineFront.rotation.x = Math.PI / 2;
  engineFront.position.set(0.12, 0.01, 0);
  const chimney = new Mesh(new CylinderGeometry(0.03, 0.04, 0.16, 10), trackMaterial);
  chimney.position.set(0.08, 0.16, 0.02);
  engineAssembly.add(engine, engineCab, engineFront, chimney);

  const car = new Group();
  car.position.set(-0.34, 0.1, 0);
  const carBody = new Mesh(new BoxGeometry(0.24, 0.14, 0.28), redMaterial);
  const carLoad = new Mesh(new BoxGeometry(0.14, 0.08, 0.16), woodMaterial);
  carLoad.position.y = 0.11;
  car.add(carBody, carLoad);

  const coupling = new Mesh(new BoxGeometry(0.16, 0.03, 0.03), wheelMaterial);
  coupling.position.set(-0.08, 0.05, 0.16);
  coupling.rotation.z = -0.12;
  train.add(coupling);

  const wheelOffsets: Array<[number, number]> = [
    [0.08, 0.12],
    [0.08, -0.12],
    [-0.08, 0.12],
    [-0.08, -0.12],
  ];

  wheelOffsets.forEach(([wheelX, wheelZ]) => {
    const engineWheel = new Mesh(new CylinderGeometry(0.04, 0.04, 0.03, 12), wheelMaterial);
    engineWheel.rotation.z = Math.PI / 2;
    engineWheel.position.set(wheelX, -0.06, wheelZ);
    engineAssembly.add(engineWheel);

    const carWheel = new Mesh(new CylinderGeometry(0.04, 0.04, 0.03, 12), wheelMaterial);
    carWheel.rotation.z = Math.PI / 2;
    carWheel.position.set(wheelX * 0.82, -0.05, wheelZ);
    car.add(carWheel);
  });

  train.add(engineAssembly, car);
  root.add(train);

  return {
    root,
    animator: {
      root: train,
      centerX: x,
      centerZ: z,
      radiusX: 1.36,
      radiusZ: 1.36,
      speed: 1.2,
      phase: Math.PI / 3,
    },
  };
}

function createBlockScatter(x: number, z: number): Group {
  const root = new Group();
  const colors = [0xf08f6d, 0x79b6da, 0x92c685, 0xe4c35a];
  const blockOffsets: Array<[number, number, number, number, number]> = [
    [-0.72, -0.24, 0.1, -0.28, 0.18],
    [-0.28, 0.18, 0.09, 0.44, -0.12],
    [0.12, -0.12, 0.08, -0.54, 0.08],
    [0.56, 0.24, 0.1, 0.22, -0.16],
    [-0.46, 0.52, 0.11, -0.4, 0.22],
    [0.02, 0.48, 0.08, 0.58, -0.08],
    [0.46, -0.46, 0.09, -0.2, 0.14],
    [0.78, 0.04, 0.08, 0.34, -0.1],
  ];

  for (let index = 0; index < 8; index += 1) {
    const block = new Mesh(
      new BoxGeometry(0.18 + (index % 3) * 0.05, 0.18, 0.18),
      new MeshStandardMaterial({
        color: colors[index % colors.length],
        roughness: 0.84,
        metalness: 0.02,
      }),
    );
    const [offsetX, offsetZ, offsetY, yaw, roll] = blockOffsets[index % blockOffsets.length];
    block.position.set(
      x + offsetX,
      offsetY,
      z + offsetZ,
    );
    block.rotation.set(0, yaw, roll);
    root.add(block);
  }

  return root;
}

function createLegoScatter(
  x: number,
  z: number,
  pieceCount: number,
  spreadX: number,
  spreadZ: number,
  compact = false,
): Group {
  const root = new Group();
  const colors = [0xe35d54, 0xf0ca57, 0x66a3dc, 0x71b780, 0xe28ac2];
  const rowCount = Math.max(1, Math.ceil(Math.sqrt(pieceCount)));
  const columnCount = Math.max(1, Math.ceil(pieceCount / rowCount));
  const xStep = columnCount > 1 ? spreadX / (columnCount - 1) : 0;
  const zStep = rowCount > 1 ? spreadZ / (rowCount - 1) : 0;

  for (let index = 0; index < pieceCount; index += 1) {
    const widthUnits = index % 3 === 0 ? 3 : 2;
    const column = index % columnCount;
    const row = Math.floor(index / columnCount);
    const jitterX = compact
      ? ((index % 2 === 0 ? 1 : -1) * 0.04 + (row % 2 === 0 ? 0.01 : -0.01))
      : (((index * 37) % 11) - 5) * 0.055;
    const jitterZ = compact
      ? ((index % 3 === 0 ? 1 : -1) * 0.025)
      : (((index * 29) % 9) - 4) * 0.05;
    const brickX = x - spreadX / 2 + column * xStep + jitterX;
    const brickZ = z - spreadZ / 2 + row * zStep + jitterZ;
    const brick = new Mesh(
      new BoxGeometry(0.08 * widthUnits, 0.06, 0.08),
      new MeshStandardMaterial({
        color: colors[index % colors.length],
        roughness: 0.74,
        metalness: 0.04,
      }),
    );
    brick.position.set(brickX, 0.03, brickZ);
    brick.rotation.y = compact ? (index * 0.53) % Math.PI : ((index * 0.71) % Math.PI) - 0.2;
    root.add(brick);

    const studMaterial = new MeshStandardMaterial({
      color: colors[index % colors.length],
      roughness: 0.68,
      metalness: 0.05,
    });
    const studCount = Math.max(2, widthUnits);
    for (let studIndex = 0; studIndex < studCount; studIndex += 1) {
      const stud = new Mesh(new CylinderGeometry(0.012, 0.012, 0.012, 10), studMaterial);
      stud.position.set(
        brickX - (0.08 * (studCount - 1)) / 2 + studIndex * 0.08,
        0.066,
        brickZ,
      );
      root.add(stud);
    }
  }

  return root;
}

function createToyTub(
  x: number,
  z: number,
  rotationY: number,
  colorHex: number,
  scale = 1,
  pieceCount = 5,
): Group {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const binMaterial = new MeshStandardMaterial({
    color: colorHex,
    roughness: 0.72,
    metalness: 0.06,
  });
  const rimMaterial = new MeshStandardMaterial({
    color: 0xece6db,
    roughness: 0.58,
    metalness: 0.04,
  });

  const base = new Mesh(new BoxGeometry(0.72 * scale, 0.3 * scale, 0.58 * scale), binMaterial);
  base.position.y = 0.15 * scale;
  const rim = new Mesh(new BoxGeometry(0.8 * scale, 0.05 * scale, 0.66 * scale), rimMaterial);
  rim.position.y = 0.33 * scale;
  root.add(base, rim);

  const contents = createLegoScatter(0, 0, pieceCount, 0.34 * scale, 0.22 * scale, true);
  contents.position.set(0, 0.29 * scale, 0);
  root.add(contents);

  return root;
}

function createToyEggMesh(shellHex: number, speckleHex: number, scale = 1): Group {
  const root = new Group();
  const shellMaterial = new MeshStandardMaterial({
    color: shellHex,
    roughness: 0.92,
    metalness: 0.02,
  });
  const speckleMaterial = new MeshStandardMaterial({
    color: speckleHex,
    roughness: 0.94,
    metalness: 0.02,
  });

  const shell = new Mesh(new SphereGeometry(0.13 * scale, 14, 12), shellMaterial);
  shell.scale.set(0.82, 1.14, 0.82);
  root.add(shell);

  const speckles: Array<[number, number, number, number]> = [
    [-0.028, 0.045, 0.08, 0.024],
    [0.048, 0.008, 0.07, 0.02],
    [-0.012, -0.028, 0.094, 0.018],
    [0.022, -0.062, 0.062, 0.016],
  ];

  speckles.forEach(([spotX, spotY, spotZ, radius]) => {
    const speckle = new Mesh(new SphereGeometry(radius * scale, 8, 8), speckleMaterial);
    speckle.scale.set(1.2, 0.65, 0.38);
    speckle.position.set(spotX * scale, spotY * scale, spotZ * scale);
    root.add(speckle);
  });

  return root;
}

function createBirdFootprint(side: 'left' | 'right'): Group {
  const root = new Group();
  const footprintMaterial = new MeshStandardMaterial({
    color: 0x70564a,
    roughness: 0.96,
    metalness: 0.02,
  });
  const mirror = side === 'left' ? -1 : 1;

  const heel = new Mesh(new SphereGeometry(0.055, 10, 8), footprintMaterial);
  heel.scale.set(0.72, 0.12, 1.02);
  heel.position.set(0, 0.012, -0.02);

  const toeCenter = new Mesh(new BoxGeometry(0.026, 0.012, 0.13), footprintMaterial);
  toeCenter.position.set(0, 0.013, 0.11);
  toeCenter.rotation.y = mirror * 0.04;

  const toeInner = new Mesh(new BoxGeometry(0.022, 0.012, 0.118), footprintMaterial);
  toeInner.position.set(-0.042 * mirror, 0.013, 0.094);
  toeInner.rotation.y = -0.42 * mirror;

  const toeOuter = new Mesh(new BoxGeometry(0.022, 0.012, 0.118), footprintMaterial);
  toeOuter.position.set(0.042 * mirror, 0.013, 0.094);
  toeOuter.rotation.y = 0.42 * mirror;

  root.add(heel, toeCenter, toeInner, toeOuter);
  return root;
}

function createEggPickup(definition: EggDefinition): ChapterTwoEggPickup {
  const root = createToyEggMesh(0xf5ead1, 0xc8a98a, 1);
  root.position.set(definition.x, definition.y, definition.z);
  root.rotation.y = definition.rotationY ?? 0;
  root.rotation.z = 0.08;

  return {
    id: definition.id,
    label: 'Egg',
    position: new Vector3(definition.x, definition.y + 0.05, definition.z),
    root,
    collected: false,
  };
}

function createBlueBearPickup(definition: BlueBearDefinition): ChapterTwoBlueBearPickup {
  const scale = definition.scale ?? 0.74;
  const root = createStuffyToy(scale, 0x4d7fd9, 0xf1ebdf, 'bear');
  root.position.set(definition.x, definition.y, definition.z);
  root.rotation.set(definition.tiltX ?? 0, definition.rotationY ?? 0, definition.tiltZ ?? 0);
  root.visible = false;

  return {
    id: definition.id,
    label: 'Blue Teddy Bear',
    position: new Vector3(definition.x, definition.y + 0.34 * scale, definition.z),
    root,
    collected: false,
  };
}

function createDodoPuzzle(
  x: number,
  z: number,
  rotationY: number,
  totalEggs: number,
): ChapterTwoDodoPuzzle {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const featherMaterial = new MeshStandardMaterial({
    color: 0x9b86a3,
    emissive: 0x1d1622,
    emissiveIntensity: 0.01,
    roughness: 0.94,
    metalness: 0.02,
  });
  const featherDarkMaterial = new MeshStandardMaterial({
    color: 0x6e5f89,
    emissive: 0x161220,
    emissiveIntensity: 0.01,
    roughness: 0.96,
    metalness: 0.02,
  });
  const bellyMaterial = new MeshStandardMaterial({
    color: 0xd8c4cf,
    roughness: 0.92,
    metalness: 0.02,
  });
  const beakMaterial = new MeshStandardMaterial({
    color: 0xc19858,
    roughness: 0.84,
    metalness: 0.04,
  });
  const mouthMaterial = new MeshStandardMaterial({
    color: 0x8d6660,
    emissive: 0x140808,
    emissiveIntensity: 0.01,
    roughness: 0.9,
    metalness: 0.02,
  });
  const eyeMaterial = new MeshStandardMaterial({
    color: 0x18161b,
    roughness: 0.44,
    metalness: 0.08,
  });
  const eyeGlowMaterial = new MeshStandardMaterial({
    color: 0xefe8dc,
    emissive: 0x000000,
    emissiveIntensity: 0,
    roughness: 0.42,
    metalness: 0.04,
  });
  const nestMaterial = new MeshStandardMaterial({
    color: 0x5b4433,
    roughness: 0.92,
    metalness: 0.02,
  });
  const clawMaterial = new MeshStandardMaterial({
    color: 0xb89463,
    roughness: 0.82,
    metalness: 0.04,
  });
  const toothMaterial = new MeshStandardMaterial({
    color: 0xd9c8ab,
    roughness: 0.78,
    metalness: 0.04,
  });
  const woundMaterial = new MeshStandardMaterial({
    color: 0xb49c88,
    emissive: 0x000000,
    emissiveIntensity: 0,
    roughness: 0.9,
    metalness: 0.02,
  });
  const tendonMaterial = new MeshStandardMaterial({
    color: 0xb08f84,
    emissive: 0x000000,
    emissiveIntensity: 0,
    roughness: 0.9,
    metalness: 0.02,
  });

  const nest = new Mesh(new TorusGeometry(0.82, 0.18, 8, 24), nestMaterial);
  nest.rotation.x = Math.PI / 2;
  nest.position.y = 0.14;
  root.add(nest);

  const body = new Mesh(new SphereGeometry(0.54, 18, 16), featherMaterial);
  body.scale.set(1.22, 1.18, 0.94);
  body.position.set(-0.06, 0.92, 0);
  body.rotation.z = -0.08;
  const belly = new Mesh(new SphereGeometry(0.28, 14, 12), bellyMaterial);
  belly.scale.set(0.92, 1.42, 0.44);
  belly.position.set(0.02, 0.8, 0.36);
  const rump = new Mesh(new SphereGeometry(0.26, 14, 12), featherDarkMaterial);
  rump.scale.set(1.26, 1.02, 0.82);
  rump.position.set(-0.1, 0.84, -0.36);
  const shoulderHump = new Mesh(new SphereGeometry(0.2, 12, 10), featherDarkMaterial);
  shoulderHump.scale.set(1.28, 0.86, 0.74);
  shoulderHump.position.set(-0.16, 1.2, -0.04);
  const chestVoid = new Mesh(new SphereGeometry(0.14, 12, 10), woundMaterial);
  chestVoid.scale.set(0.42, 0.58, 0.14);
  chestVoid.position.set(0.08, 0.86, 0.4);
  const sideWoundLeft = new Mesh(new SphereGeometry(0.08, 10, 8), woundMaterial);
  const sideWoundRight = sideWoundLeft.clone();
  sideWoundLeft.scale.set(0.46, 0.62, 0.12);
  sideWoundRight.scale.set(0.46, 0.62, 0.12);
  sideWoundLeft.position.set(-0.34, 0.9, 0.26);
  sideWoundRight.position.set(0.32, 0.88, 0.25);
  sideWoundLeft.rotation.z = -0.2;
  sideWoundRight.rotation.z = 0.18;

  const ribLeft = new Mesh(new BoxGeometry(0.02, 0.28, 0.03), clawMaterial);
  const ribRight = ribLeft.clone();
  ribLeft.scale.set(0.2, 0.2, 0.2);
  ribRight.scale.set(0.2, 0.2, 0.2);
  ribLeft.position.set(-0.06, 0.84, 0.38);
  ribRight.position.set(0.1, 0.84, 0.38);
  ribLeft.rotation.z = -0.54;
  ribRight.rotation.z = 0.54;
  const ribCenterA = new Mesh(new BoxGeometry(0.02, 0.22, 0.03), clawMaterial);
  const ribCenterB = ribCenterA.clone();
  ribCenterA.scale.set(0.18, 0.18, 0.18);
  ribCenterB.scale.set(0.18, 0.18, 0.18);
  ribCenterA.position.set(0, 0.82, 0.38);
  ribCenterB.position.set(0.06, 0.9, 0.38);
  ribCenterA.rotation.z = -0.12;
  ribCenterB.rotation.z = 0.22;

  const tailFeatherA = new Mesh(new BoxGeometry(0.22, 0.56, 0.08), featherDarkMaterial);
  const tailFeatherB = tailFeatherA.clone();
  const tailFeatherC = tailFeatherA.clone();
  const tailFeatherD = tailFeatherA.clone();
  tailFeatherA.position.set(-0.28, 1.16, -0.48);
  tailFeatherB.position.set(0.04, 1.22, -0.54);
  tailFeatherC.position.set(-0.04, 1.34, -0.46);
  tailFeatherD.position.set(0.18, 1.06, -0.46);
  tailFeatherA.rotation.z = 0.62;
  tailFeatherB.rotation.z = -0.54;
  tailFeatherC.rotation.z = 0.12;
  tailFeatherD.rotation.z = -0.18;

  const wingLeft = new Mesh(new SphereGeometry(0.2, 12, 10), featherDarkMaterial);
  const wingRight = wingLeft.clone();
  wingLeft.scale.set(1.52, 0.52, 0.56);
  wingRight.scale.set(1.52, 0.52, 0.56);
  wingLeft.position.set(-0.6, 0.94, 0.02);
  wingRight.position.set(0.62, 0.9, 0.02);
  wingLeft.rotation.z = -0.76;
  wingRight.rotation.z = 0.76;

  const wingClawLeft = new Mesh(new CylinderGeometry(0.014, 0.024, 0.22, 8), clawMaterial);
  const wingClawRight = wingClawLeft.clone();
  wingClawLeft.scale.setScalar(0.18);
  wingClawRight.scale.setScalar(0.18);
  wingClawLeft.position.set(-0.82, 0.88, 0.12);
  wingClawRight.position.set(0.84, 0.84, 0.12);
  wingClawLeft.rotation.set(0.18, 0.08, -0.44);
  wingClawRight.rotation.set(0.18, -0.08, 0.44);
  const wingSpineLeft = new Mesh(new BoxGeometry(0.06, 0.24, 0.04), featherDarkMaterial);
  const wingSpineRight = wingSpineLeft.clone();
  wingSpineLeft.scale.set(0.22, 0.28, 0.34);
  wingSpineRight.scale.set(0.22, 0.28, 0.34);
  wingSpineLeft.position.set(-0.7, 1, -0.02);
  wingSpineRight.position.set(0.72, 0.98, -0.02);
  wingSpineLeft.rotation.z = -0.28;
  wingSpineRight.rotation.z = 0.28;

  const leftLeg = new Mesh(new CylinderGeometry(0.04, 0.05, 0.82, 10), clawMaterial);
  const rightLeg = leftLeg.clone();
  leftLeg.position.set(-0.16, 0.36, 0.06);
  rightLeg.position.set(0.18, 0.34, 0.06);
  leftLeg.rotation.z = -0.14;
  rightLeg.rotation.z = 0.14;

  [-0.24, -0.14, -0.04].forEach((offsetX, index) => {
    const claw = new Mesh(new CylinderGeometry(0.01, 0.02, 0.16, 8), clawMaterial);
    claw.position.set(offsetX, 0.05, 0.18 + index * 0.015);
    claw.rotation.set(Math.PI / 2, 0.12, -0.2 + index * 0.18);
    root.add(claw);
  });
  [0.04, 0.14, 0.24].forEach((offsetX, index) => {
    const claw = new Mesh(new CylinderGeometry(0.01, 0.02, 0.16, 8), clawMaterial);
    claw.position.set(offsetX, 0.05, 0.18 + index * 0.015);
    claw.rotation.set(Math.PI / 2, -0.12, 0.2 - index * 0.18);
      root.add(claw);
  });

  const neck = new Mesh(new CylinderGeometry(0.1, 0.2, 1.28, 14), featherMaterial);
  neck.position.set(0.14, 1.72, 0.14);
  neck.rotation.z = -0.46;
  const neckSpineA = new Mesh(new BoxGeometry(0.08, 0.2, 0.04), featherDarkMaterial);
  const neckSpineB = neckSpineA.clone();
  const neckSpineC = neckSpineA.clone();
  const neckSpineD = neckSpineA.clone();
  neckSpineA.scale.set(0.18, 0.24, 0.24);
  neckSpineB.scale.set(0.18, 0.24, 0.24);
  neckSpineC.scale.set(0.18, 0.24, 0.24);
  neckSpineD.scale.set(0.18, 0.24, 0.24);
  neckSpineA.position.set(-0.02, 1.72, -0.05);
  neckSpineB.position.set(0.06, 1.98, -0.05);
  neckSpineC.position.set(0.14, 2.2, -0.04);
  neckSpineD.position.set(0.22, 2.38, -0.02);
  neckSpineA.rotation.z = 0.18;
  neckSpineB.rotation.z = 0.08;
  neckSpineC.rotation.z = -0.04;
  neckSpineD.rotation.z = -0.1;
  const throatTendonA = new Mesh(new CylinderGeometry(0.014, 0.02, 0.42, 8), tendonMaterial);
  const throatTendonB = throatTendonA.clone();
  throatTendonA.scale.set(0.2, 0.2, 0.2);
  throatTendonB.scale.set(0.2, 0.2, 0.2);
  throatTendonA.position.set(0.24, 2.02, 0.24);
  throatTendonB.position.set(0.3, 2.16, 0.22);
  throatTendonA.rotation.z = -0.16;
  throatTendonB.rotation.z = -0.2;
  const neckBridgeA = new Mesh(new SphereGeometry(0.13, 12, 10), featherMaterial);
  const neckBridgeB = neckBridgeA.clone();
  const neckBridgeC = neckBridgeA.clone();
  neckBridgeA.scale.set(0.82, 1.18, 0.72);
  neckBridgeB.scale.set(0.78, 1.12, 0.68);
  neckBridgeC.scale.set(0.72, 1.02, 0.64);
  neckBridgeA.position.set(0.38, 2.28, 0.18);
  neckBridgeB.position.set(0.5, 2.38, 0.22);
  neckBridgeC.position.set(0.6, 2.46, 0.25);
  neckBridgeA.rotation.z = -0.54;
  neckBridgeB.rotation.z = -0.46;
  neckBridgeC.rotation.z = -0.34;
  const neckRuff = new Mesh(new TorusGeometry(0.14, 0.035, 10, 16), featherDarkMaterial);
  neckRuff.rotation.x = Math.PI / 2;
  neckRuff.position.set(0.63, 2.48, 0.27);

  const headPivot = new Group();
  headPivot.position.set(0.66, 2.5, 0.29);
  headPivot.rotation.z = -0.2;

  const head = new Mesh(new SphereGeometry(0.26, 16, 14), featherMaterial);
  head.scale.set(1.2, 0.96, 1.04);
  const headBase = new Mesh(new SphereGeometry(0.11, 12, 10), featherMaterial);
  headBase.scale.set(1.24, 0.86, 0.96);
  headBase.position.set(-0.14, -0.02, -0.06);
  const brow = new Mesh(new BoxGeometry(0.34, 0.06, 0.08), featherDarkMaterial);
  brow.position.set(0.02, 0.12, 0.18);
  brow.rotation.x = -0.08;
  const browSpikeLeft = new Mesh(new BoxGeometry(0.05, 0.18, 0.04), featherDarkMaterial);
  const browSpikeRight = browSpikeLeft.clone();
  browSpikeLeft.scale.set(0.18, 0.22, 0.22);
  browSpikeRight.scale.set(0.18, 0.22, 0.22);
  browSpikeLeft.position.set(-0.08, 0.18, 0.01);
  browSpikeRight.position.set(0.08, 0.16, 0.01);
  browSpikeLeft.rotation.z = -0.1;
  browSpikeRight.rotation.z = 0.1;
  const eyeSocketLeft = new Mesh(new SphereGeometry(0.09, 10, 10), featherDarkMaterial);
  const eyeSocketRight = eyeSocketLeft.clone();
  eyeSocketLeft.scale.set(0.82, 0.62, 0.28);
  eyeSocketRight.scale.set(0.82, 0.62, 0.28);
  eyeSocketLeft.position.set(-0.1, 0.04, 0.16);
  eyeSocketRight.position.set(0.08, 0.02, 0.15);
  const eyeLeft = new Mesh(new SphereGeometry(0.024, 8, 8), eyeMaterial);
  const eyeRight = eyeLeft.clone();
  const eyeGlowLeft = new Mesh(new SphereGeometry(0.012, 8, 8), eyeGlowMaterial);
  const eyeGlowRight = eyeGlowLeft.clone();
  eyeLeft.position.set(-0.1, 0.02, 0.23);
  eyeRight.position.set(0.08, 0.01, 0.22);
  eyeGlowLeft.position.set(-0.096, 0.024, 0.242);
  eyeGlowRight.position.set(0.084, 0.014, 0.234);
  const upperEyeLeft = new Mesh(new SphereGeometry(0.014, 8, 8), eyeGlowMaterial);
  const upperEyeRight = upperEyeLeft.clone();
  upperEyeLeft.scale.setScalar(0.1);
  upperEyeRight.scale.setScalar(0.1);
  upperEyeLeft.position.set(-0.04, 0.1, 0.08);
  upperEyeRight.position.set(0.1, 0.1, 0.08);

  const topBeak = new Mesh(new BoxGeometry(0.58, 0.1, 0.18), beakMaterial);
  topBeak.position.set(0.02, -0.04, 0.36);
  topBeak.rotation.x = -0.28;
  const upperHook = new Mesh(new BoxGeometry(0.2, 0.07, 0.22), beakMaterial);
  upperHook.position.set(0.08, -0.09, 0.47);
  upperHook.rotation.x = -0.22;
  const lowerBeak = new Mesh(new BoxGeometry(0.48, 0.08, 0.16), beakMaterial);
  lowerBeak.position.set(0.04, -0.2, 0.26);
  lowerBeak.rotation.x = 0.24;
  const mouth = new Mesh(new BoxGeometry(0.36, 0.12, 0.18), mouthMaterial);
  mouth.position.set(0.02, -0.08, 0.24);
  const throat = new Mesh(new BoxGeometry(0.2, 0.12, 0.18), mouthMaterial);
  throat.position.set(0.06, -0.14, 0.16);
  const innerGum = new Mesh(new BoxGeometry(0.34, 0.08, 0.16), tendonMaterial);
  innerGum.position.set(0.04, -0.08, 0.24);

  const toothOffsets: Array<[number, number, number]> = [
    [-0.12, -0.08, 0.08],
    [-0.04, -0.1, 0.1],
    [0.04, -0.11, 0.11],
    [0.12, -0.1, 0.09],
  ];
  toothOffsets.forEach(([toothX, , length], index) => {
    const fang = new Mesh(new CylinderGeometry(0.007, 0.024, length, 8), toothMaterial);
    fang.scale.setScalar(0.08);
    fang.position.set(toothX * 0.4, -0.06, 0.18 + index * 0.01);
    fang.rotation.x = Math.PI;
    headPivot.add(fang);
  });
  const lowerToothOffsets: Array<[number, number, number]> = [
    [-0.1, -0.24, 0.07],
    [-0.02, -0.25, 0.08],
    [0.06, -0.26, 0.1],
    [0.14, -0.24, 0.08],
  ];
  lowerToothOffsets.forEach(([toothX, , length], index) => {
    const tooth = new Mesh(new CylinderGeometry(0.006, 0.022, length, 8), toothMaterial);
    tooth.scale.setScalar(0.08);
    tooth.position.set(toothX * 0.4, -0.1, 0.16 + index * 0.01);
    headPivot.add(tooth);
  });
  const jawTearLeft = new Mesh(new BoxGeometry(0.03, 0.12, 0.02), tendonMaterial);
  const jawTearRight = jawTearLeft.clone();
  jawTearLeft.scale.set(0.12, 0.12, 0.2);
  jawTearRight.scale.set(0.12, 0.12, 0.2);
  jawTearLeft.position.set(-0.1, -0.08, 0.14);
  jawTearRight.position.set(0.1, -0.08, 0.14);
  jawTearLeft.rotation.z = -0.04;
  jawTearRight.rotation.z = 0.04;

  const featherPuffLeft = new Mesh(new SphereGeometry(0.08, 10, 8), featherDarkMaterial);
  const featherPuffRight = featherPuffLeft.clone();
  featherPuffLeft.scale.set(1, 1.24, 0.58);
  featherPuffRight.scale.set(1, 1.24, 0.58);
  featherPuffLeft.position.set(-0.2, 0.2, 0.02);
  featherPuffRight.position.set(0.18, 0.16, 0.04);

  const scalpFeatherA = new Mesh(new BoxGeometry(0.08, 0.22, 0.04), featherDarkMaterial);
  const scalpFeatherB = scalpFeatherA.clone();
  const scalpFeatherC = scalpFeatherA.clone();
  scalpFeatherA.position.set(-0.04, 0.28, -0.04);
  scalpFeatherB.position.set(0.08, 0.34, -0.02);
  scalpFeatherC.position.set(0.18, 0.22, -0.02);
  scalpFeatherA.rotation.z = -0.2;
  scalpFeatherB.rotation.z = 0.14;
  scalpFeatherC.rotation.z = 0.24;

  const mouthEggs = Array.from({ length: totalEggs }, (_, index) => {
    const egg = createToyEggMesh(0xf2ead9, 0xc4a17f, 0.56);
    egg.position.set(-0.1 + index * 0.024, -0.24 + index * 0.006, 0.18 + index * 0.014);
    egg.rotation.set(0.08, index * 0.36, 0.1);
    egg.visible = false;
    headPivot.add(egg);
    return egg;
  });

  headPivot.add(
    head,
    headBase,
    brow,
    eyeSocketLeft,
    eyeSocketRight,
    eyeLeft,
    eyeRight,
    eyeGlowLeft,
    eyeGlowRight,
    upperEyeLeft,
    upperEyeRight,
    topBeak,
    upperHook,
    lowerBeak,
    mouth,
    throat,
    innerGum,
    browSpikeLeft,
    browSpikeRight,
    jawTearLeft,
    jawTearRight,
    featherPuffLeft,
    featherPuffRight,
    scalpFeatherA,
    scalpFeatherB,
    scalpFeatherC,
  );

  root.add(
    body,
    belly,
    rump,
    chestVoid,
    sideWoundLeft,
    sideWoundRight,
    ribLeft,
    ribRight,
    ribCenterA,
    ribCenterB,
    shoulderHump,
    tailFeatherA,
    tailFeatherB,
    tailFeatherC,
    tailFeatherD,
    wingLeft,
    wingRight,
    wingClawLeft,
    wingClawRight,
    wingSpineLeft,
    wingSpineRight,
    leftLeg,
    rightLeg,
    neck,
    neckSpineA,
    neckSpineB,
    neckSpineC,
    neckSpineD,
    throatTendonA,
    throatTendonB,
    neckBridgeA,
    neckBridgeB,
    neckBridgeC,
    neckRuff,
    headPivot,
  );

  return {
    position: new Vector3(x, 1.3, z),
    interactPosition: offsetPosition(x, z, rotationY, -1.08, 0.3).setY(1.08),
    root,
    mouthEggs,
    leftWing: wingLeft,
    rightWing: wingRight,
    headPivot,
    totalEggs,
    depositedEggs: 0,
    solved: false,
  };
}

function createStuffyToy(
  scale = 1,
  furHex = 0xcda0b8,
  accentHex = 0xf0e7d7,
  animal: StuffyAnimal = 'bear',
): Group {
  const root = new Group();
  const fur = new MeshStandardMaterial({
    color: furHex,
    roughness: 0.9,
    metalness: 0.02,
  });
  const accent = new MeshStandardMaterial({
    color: accentHex,
    roughness: 0.92,
    metalness: 0.02,
  });
  const eye = new MeshStandardMaterial({
    color: 0x26242a,
    roughness: 0.4,
    metalness: 0.08,
  });

  const body = new Mesh(new SphereGeometry(0.22 * scale, 16, 14), fur);
  body.position.y = 0.22 * scale;
  const head = new Mesh(new SphereGeometry(0.16 * scale, 16, 14), fur);
  head.position.set(0, 0.52 * scale, 0);
  const belly = new Mesh(new SphereGeometry(0.1 * scale, 14, 12), accent);
  belly.position.set(0, 0.2 * scale, 0.14 * scale);
  const muzzle = new Mesh(new SphereGeometry(0.07 * scale, 12, 10), accent);
  muzzle.position.set(0, 0.47 * scale, 0.12 * scale);

  const armLeft = new Mesh(new SphereGeometry(0.05 * scale, 10, 8), fur);
  const armRight = armLeft.clone();
  armLeft.position.set(-0.19 * scale, 0.26 * scale, 0.06 * scale);
  armRight.position.set(0.19 * scale, 0.26 * scale, 0.06 * scale);

  const eyeLeft = new Mesh(new SphereGeometry(0.014 * scale, 8, 8), eye);
  const eyeRight = eyeLeft.clone();
  eyeLeft.position.set(-0.04 * scale, 0.53 * scale, 0.14 * scale);
  eyeRight.position.set(0.04 * scale, 0.53 * scale, 0.14 * scale);

  root.add(body, head, belly, muzzle, armLeft, armRight, eyeLeft, eyeRight);

  switch (animal) {
    case 'bunny': {
      const earLeft = new Mesh(new BoxGeometry(0.05 * scale, 0.2 * scale, 0.04 * scale), fur);
      const earRight = earLeft.clone();
      const earInnerLeft = new Mesh(new BoxGeometry(0.022 * scale, 0.14 * scale, 0.02 * scale), accent);
      const earInnerRight = earInnerLeft.clone();
      earLeft.position.set(-0.08 * scale, 0.78 * scale, 0);
      earRight.position.set(0.08 * scale, 0.78 * scale, 0);
      earLeft.rotation.z = -0.14;
      earRight.rotation.z = 0.14;
      earInnerLeft.position.set(-0.08 * scale, 0.79 * scale, 0.02 * scale);
      earInnerRight.position.set(0.08 * scale, 0.79 * scale, 0.02 * scale);
      const tail = new Mesh(new SphereGeometry(0.045 * scale, 10, 8), accent);
      tail.position.set(0, 0.16 * scale, -0.18 * scale);
      root.add(earLeft, earRight, earInnerLeft, earInnerRight, tail);
      break;
    }
    case 'cat': {
      const earLeft = new Mesh(new BoxGeometry(0.08 * scale, 0.1 * scale, 0.04 * scale), fur);
      const earRight = earLeft.clone();
      earLeft.position.set(-0.09 * scale, 0.69 * scale, 0);
      earRight.position.set(0.09 * scale, 0.69 * scale, 0);
      earLeft.rotation.z = -0.72;
      earRight.rotation.z = 0.72;
      const whiskerLeft = new Mesh(new BoxGeometry(0.1 * scale, 0.006 * scale, 0.006 * scale), accent);
      const whiskerRight = whiskerLeft.clone();
      whiskerLeft.position.set(-0.1 * scale, 0.46 * scale, 0.15 * scale);
      whiskerRight.position.set(0.1 * scale, 0.46 * scale, 0.15 * scale);
      const tail = new Mesh(new CylinderGeometry(0.018 * scale, 0.026 * scale, 0.24 * scale, 8), fur);
      tail.position.set(0.16 * scale, 0.3 * scale, -0.16 * scale);
      tail.rotation.z = -0.78;
      root.add(earLeft, earRight, whiskerLeft, whiskerRight, tail);
      break;
    }
    case 'dog': {
      const earLeft = new Mesh(new SphereGeometry(0.055 * scale, 12, 10), fur);
      const earRight = earLeft.clone();
      earLeft.scale.set(0.8, 1.4, 0.55);
      earRight.scale.set(0.8, 1.4, 0.55);
      earLeft.position.set(-0.14 * scale, 0.58 * scale, 0);
      earRight.position.set(0.14 * scale, 0.58 * scale, 0);
      const nose = new Mesh(new SphereGeometry(0.026 * scale, 8, 8), eye);
      nose.position.set(0, 0.45 * scale, 0.19 * scale);
      const tail = new Mesh(new CylinderGeometry(0.016 * scale, 0.024 * scale, 0.2 * scale, 8), fur);
      tail.position.set(-0.16 * scale, 0.28 * scale, -0.18 * scale);
      tail.rotation.z = 0.84;
      root.add(earLeft, earRight, nose, tail);
      break;
    }
    case 'elephant': {
      const earLeft = new Mesh(new SphereGeometry(0.08 * scale, 12, 10), fur);
      const earRight = earLeft.clone();
      earLeft.scale.set(1.1, 1.35, 0.35);
      earRight.scale.set(1.1, 1.35, 0.35);
      earLeft.position.set(-0.15 * scale, 0.5 * scale, 0);
      earRight.position.set(0.15 * scale, 0.5 * scale, 0);
      const trunk = new Mesh(new CylinderGeometry(0.03 * scale, 0.045 * scale, 0.2 * scale, 10), fur);
      trunk.position.set(0, 0.38 * scale, 0.18 * scale);
      trunk.rotation.x = Math.PI / 2.2;
      const footLeft = new Mesh(new SphereGeometry(0.04 * scale, 10, 8), accent);
      const footRight = footLeft.clone();
      footLeft.position.set(-0.09 * scale, 0.02 * scale, 0.08 * scale);
      footRight.position.set(0.09 * scale, 0.02 * scale, 0.08 * scale);
      root.add(earLeft, earRight, trunk, footLeft, footRight);
      break;
    }
    case 'bear':
    default: {
      const earLeft = new Mesh(new SphereGeometry(0.06 * scale, 12, 10), fur);
      const earRight = earLeft.clone();
      earLeft.position.set(-0.11 * scale, 0.66 * scale, 0);
      earRight.position.set(0.11 * scale, 0.66 * scale, 0);
      root.add(earLeft, earRight);
      break;
    }
  }

  return root;
}

function createStuffyShelf(
  x: number,
  z: number,
  rotationY: number,
  occupants: readonly ShelfStuffySpec[],
): Group {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const shelfMaterial = new MeshStandardMaterial({
    color: 0xc49a6b,
    roughness: 0.78,
    metalness: 0.06,
  });
  const bracketMaterial = new MeshStandardMaterial({
    color: 0xaeb7c1,
    roughness: 0.52,
    metalness: 0.3,
  });
  const mountMaterial = new MeshStandardMaterial({
    color: 0xe4ddd0,
    roughness: 0.84,
    metalness: 0.02,
  });

  const backPanel = new Mesh(new BoxGeometry(1.92, 1.12, 0.04), mountMaterial);
  backPanel.position.set(0, 1.72, -0.12);
  root.add(backPanel);

  const shelfLevels = [1.35, 2.05] as const;
  shelfLevels.forEach((levelY) => {
    const shelf = new Mesh(new BoxGeometry(1.85, 0.06, 0.26), shelfMaterial);
    shelf.position.set(0, levelY, 0);
    root.add(shelf);

    const bracketLeft = new Mesh(new BoxGeometry(0.06, 0.28, 0.06), bracketMaterial);
    const bracketRight = bracketLeft.clone();
    bracketLeft.position.set(-0.72, levelY - 0.16, -0.06);
    bracketRight.position.set(0.72, levelY - 0.16, -0.06);
    root.add(bracketLeft, bracketRight);
  });

  occupants.forEach((occupant) => {
    const stuffy = createStuffyToy(
      occupant.scale,
      occupant.furHex,
      occupant.accentHex,
      occupant.animal,
    );
    stuffy.position.set(
      occupant.side === 'left' ? -0.42 : 0.38,
      shelfLevels[occupant.shelfIndex] + 0.03,
      occupant.side === 'left' ? 0 : 0.01,
    );
    stuffy.rotation.y = occupant.rotationY ?? 0;
    root.add(stuffy);
  });

  return root;
}

function createToyCarScatter(x: number, z: number): Group {
  const root = new Group();
  const bodyColors = [0xdb6259, 0x5e8fd2, 0xf0c75b];
  const wheelMaterial = new MeshStandardMaterial({
    color: 0x2f3138,
    roughness: 0.74,
    metalness: 0.14,
  });
  const carOffsets: Array<[number, number, number]> = [
    [-0.72, -0.22, -0.18],
    [0.08, 0.34, 0.64],
    [0.76, -0.06, -0.42],
  ];

  for (let index = 0; index < 3; index += 1) {
    const car = new Group();
    const [offsetX, offsetZ, rotationY] = carOffsets[index % carOffsets.length];
    car.position.set(x + offsetX, 0, z + offsetZ);
    car.rotation.y = rotationY;

    const body = new Mesh(
      new BoxGeometry(0.24, 0.08, 0.14),
      new MeshStandardMaterial({
        color: bodyColors[index % bodyColors.length],
        roughness: 0.72,
        metalness: 0.08,
      }),
    );
    body.position.y = 0.08;
    const roof = new Mesh(new BoxGeometry(0.12, 0.05, 0.12), new MeshStandardMaterial({
      color: 0xf3efe6,
      roughness: 0.76,
      metalness: 0.02,
    }));
    roof.position.set(-0.01, 0.14, 0);
    car.add(body, roof);

    const wheelOffsets: Array<[number, number]> = [
      [0.08, 0.07],
      [0.08, -0.07],
      [-0.08, 0.07],
      [-0.08, -0.07],
    ];
    wheelOffsets.forEach(([wheelX, wheelZ]) => {
      const wheel = new Mesh(new CylinderGeometry(0.035, 0.035, 0.03, 10), wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wheelX, 0.04, wheelZ);
      car.add(wheel);
    });

    root.add(car);
  }

  return root;
}

function createKidPortraitPoster(
  label: string,
  shirtHex: number,
  frameHex: number,
  variant: number,
): Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 420;
  const context = canvas.getContext('2d');

  if (!context) {
    return new Mesh(
      new PlaneGeometry(0.92, 1.18),
      new MeshStandardMaterial({ color: 0xf2e7d3, roughness: 0.92, metalness: 0.02 }),
    );
  }

  context.fillStyle = '#f5edd9';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const rainbowBands = ['#ef6b63', '#f2a54a', '#f2da57', '#7fc77a', '#6fa6e5', '#b483e0'];
  context.save();
  context.globalAlpha = 0.68;
  rainbowBands.forEach((color, index) => {
    context.strokeStyle = color;
    context.lineWidth = 16 - index * 1.3;
    context.beginPath();
    context.arc(
      156 + variant * 8,
      278 + variant * 6,
      118 - index * 13,
      Math.PI * 1.08,
      Math.PI * 1.92,
    );
    context.stroke();
  });
  context.restore();

  context.fillStyle = '#fbf7ef';
  const cloudOffsets = [
    [70, 92],
    [235, 84 + variant * 4],
  ];
  cloudOffsets.forEach(([cloudX, cloudY]) => {
    context.beginPath();
    context.arc(cloudX, cloudY, 18, 0, Math.PI * 2);
    context.arc(cloudX + 18, cloudY - 8, 22, 0, Math.PI * 2);
    context.arc(cloudX + 38, cloudY, 17, 0, Math.PI * 2);
    context.fill();
  });

  context.fillStyle = `#${frameHex.toString(16).padStart(6, '0')}`;
  context.globalAlpha = 0.22;
  context.fillRect(18, 18, canvas.width - 36, canvas.height - 36);
  context.globalAlpha = 1;
  context.strokeStyle = '#a58565';
  context.lineWidth = 8;
  context.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

  const headX = 144 + variant * 10;
  const headY = 138 + (variant === 1 ? 6 : variant === 2 ? -4 : 0);
  const headRadiusX = variant === 1 ? 50 : variant === 2 ? 60 : 54;
  const headRadiusY = variant === 2 ? 52 : variant === 1 ? 58 : 56;
  const eyeY = headY - 2 + variant;
  const eyeSpread = variant === 2 ? 24 : variant === 1 ? 18 : 20;

  context.strokeStyle = '#3c332d';
  context.lineWidth = 6;
  context.beginPath();
  context.ellipse(headX, headY, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
  context.stroke();

  if (variant === 0) {
    context.beginPath();
    context.moveTo(headX - 40, headY - 30);
    context.lineTo(headX - 52, headY - 60);
    context.lineTo(headX - 24, headY - 48);
    context.lineTo(headX - 6, headY - 66);
    context.lineTo(headX + 8, headY - 42);
    context.lineTo(headX + 30, headY - 62);
    context.lineTo(headX + 42, headY - 28);
    context.stroke();
  } else if (variant === 1) {
    for (let curl = 0; curl < 5; curl += 1) {
      context.beginPath();
      context.arc(headX - 32 + curl * 16, headY - 42 + (curl % 2 === 0 ? -4 : 4), 12, 0, Math.PI * 2);
      context.stroke();
    }
  } else {
    context.beginPath();
    context.moveTo(headX - 46, headY - 20);
    context.lineTo(headX - 58, headY - 48);
    context.moveTo(headX + 46, headY - 20);
    context.lineTo(headX + 58, headY - 48);
    context.moveTo(headX - 34, headY - 48);
    context.lineTo(headX + 36, headY - 48);
    context.stroke();
  }

  context.fillStyle = '#3c332d';
  context.beginPath();
  context.arc(headX - eyeSpread, eyeY, 5 + (variant === 2 ? 1 : 0), 0, Math.PI * 2);
  context.arc(headX + eyeSpread, eyeY - (variant === 1 ? 2 : 0), 5, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  if (variant === 0) {
    context.moveTo(headX - 18, headY + 30);
    context.quadraticCurveTo(headX + 2, headY + 50, headX + 28, headY + 20);
  } else if (variant === 1) {
    context.moveTo(headX - 18, headY + 34);
    context.quadraticCurveTo(headX + 6, headY + 18, headX + 24, headY + 36);
  } else {
    context.moveTo(headX - 14, headY + 26);
    context.lineTo(headX + 2, headY + 40);
    context.lineTo(headX + 22, headY + 28);
  }
  context.stroke();

  context.beginPath();
  context.moveTo(headX, headY + 8);
  context.lineTo(headX - 4 + variant * 3, headY + 20);
  context.lineTo(headX + 4, headY + 22);
  context.stroke();

  context.beginPath();
  context.moveTo(headX, headY + 56);
  context.lineTo(headX, 286 + variant * 2);
  context.moveTo(headX, 226 + variant * 4);
  context.lineTo(headX - 50 + variant * 4, 250 + variant * 6);
  context.moveTo(headX, 226 + variant * 4);
  context.lineTo(headX + 54 - variant * 6, 248 - variant * 4);
  context.moveTo(headX, 286 + variant * 2);
  context.lineTo(headX - 38 - variant * 2, 342);
  context.moveTo(headX, 286 + variant * 2);
  context.lineTo(headX + 40 + variant * 4, 342 - variant * 6);
  context.stroke();

  context.fillStyle = `#${shirtHex.toString(16).padStart(6, '0')}`;
  context.beginPath();
  if (variant === 0) {
    context.moveTo(headX - 42, 224);
    context.lineTo(headX + 40, 224);
    context.lineTo(headX + 62, 292);
    context.lineTo(headX - 58, 292);
  } else if (variant === 1) {
    context.moveTo(headX - 36, 228);
    context.lineTo(headX + 34, 220);
    context.lineTo(headX + 50, 292);
    context.lineTo(headX - 54, 292);
  } else {
    context.moveTo(headX - 48, 220);
    context.lineTo(headX + 46, 220);
    context.lineTo(headX + 52, 292);
    context.lineTo(headX - 46, 292);
  }
  context.closePath();
  context.fill();

  context.fillStyle = '#3c332d';
  context.font = '700 26px Trebuchet MS, sans-serif';
  context.fillText(label, 34, 388);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;

  return new Mesh(
    new PlaneGeometry(1.08, 1.42),
    new MeshStandardMaterial({
      map: texture,
      roughness: 0.92,
      metalness: 0.02,
    }),
  );
}

function createAlphabetPoster(): Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 540;
  canvas.height = 360;
  const context = canvas.getContext('2d');

  if (!context) {
    return new Mesh(
      new PlaneGeometry(1.36, 0.96),
      new MeshStandardMaterial({ color: 0xf3ecd8, roughness: 0.92, metalness: 0.02 }),
    );
  }

  context.fillStyle = '#f6efdd';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = '#f0d99b';
  context.globalAlpha = 0.18;
  context.fillRect(18, 18, canvas.width - 36, 64);
  context.globalAlpha = 1;

  context.strokeStyle = '#9d815e';
  context.lineWidth = 8;
  context.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

  context.fillStyle = '#38404a';
  context.font = '700 40px Trebuchet MS, sans-serif';
  context.fillText('YOUR ABCs', 144, 62);

  context.font = '700 128px Trebuchet MS, sans-serif';
  context.fillStyle = '#66b05e';
  context.fillText('A', 84, 228);
  context.fillStyle = '#5a8fe3';
  context.fillText('B', 220, 228);
  context.fillStyle = '#d97fb8';
  context.fillText('C', 360, 228);

  context.fillStyle = '#5f5244';
  context.font = '600 24px Trebuchet MS, sans-serif';
  context.fillText('A  B  C', 192, 304);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;

  return new Mesh(
    new PlaneGeometry(1.42, 0.98),
    new MeshStandardMaterial({
      map: texture,
      roughness: 0.92,
      metalness: 0.02,
    }),
  );
}

function createPaperPlane(header: string, body: string, accentHex: number): Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const context = canvas.getContext('2d');

  if (!context) {
    return new Mesh(
      new PlaneGeometry(0.62, 0.44),
      new MeshStandardMaterial({ color: 0xf1ebde, roughness: 0.92, metalness: 0.02, side: DoubleSide }),
    );
  }

  context.fillStyle = '#f3ecde';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = `#${accentHex.toString(16).padStart(6, '0')}`;
  context.globalAlpha = 0.14;
  context.fillRect(18, 18, canvas.width - 36, 56);
  context.globalAlpha = 1;
  context.strokeStyle = '#9e8668';
  context.lineWidth = 6;
  context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  context.fillStyle = '#3b3026';
  context.font = '700 32px Trebuchet MS, sans-serif';
  context.fillText(header, 28, 54);
  context.font = '500 20px Trebuchet MS, sans-serif';

  body.split('\n').slice(1).forEach((line, index) => {
    context.fillText(line, 28, 96 + index * 30);
  });

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;

  return new Mesh(
    new PlaneGeometry(0.72, 0.5),
    new MeshStandardMaterial({
      map: texture,
      roughness: 0.92,
      metalness: 0.02,
      side: DoubleSide,
    }),
  );
}

function createPottedPlant(
  x: number,
  z: number,
  rotationY: number,
  scale = 1,
  leafHex = 0x6f9d63,
  potHex = 0xc58e62,
): Group {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;
  const plantScale = scale * 1.12;

  const potMaterial = new MeshStandardMaterial({
    color: potHex,
    roughness: 0.84,
    metalness: 0.04,
  });
  const soilMaterial = new MeshStandardMaterial({
    color: 0x4a372a,
    roughness: 0.96,
    metalness: 0.02,
  });
  const stemMaterial = new MeshStandardMaterial({
    color: 0x6b8d4f,
    roughness: 0.88,
    metalness: 0.02,
  });
  const leafMaterial = new MeshStandardMaterial({
    color: leafHex,
    roughness: 0.82,
    metalness: 0.02,
  });

  const pot = new Mesh(
    new CylinderGeometry(0.27 * plantScale, 0.21 * plantScale, 0.4 * plantScale, 16),
    potMaterial,
  );
  pot.position.y = 0.2 * plantScale;
  const rim = new Mesh(
    new CylinderGeometry(0.32 * plantScale, 0.27 * plantScale, 0.08 * plantScale, 16),
    potMaterial,
  );
  rim.position.y = 0.39 * plantScale;
  const soil = new Mesh(
    new CylinderGeometry(0.25 * plantScale, 0.25 * plantScale, 0.035 * plantScale, 14),
    soilMaterial,
  );
  soil.position.y = 0.42 * plantScale;
  const stem = new Mesh(
    new CylinderGeometry(0.034 * plantScale, 0.046 * plantScale, 0.58 * plantScale, 10),
    stemMaterial,
  );
  stem.position.y = 0.68 * plantScale;

  root.add(pot, rim, soil, stem);

  const leafOffsets: Array<[number, number, number, number, number, number]> = [
    [0.12, 0.56, 0, 0.22, 0.08, -0.5],
    [-0.11, 0.68, 0.03, 0.2, 0.07, 0.44],
    [0.04, 0.8, 0.1, 0.16, 0.06, -0.18],
    [-0.02, 0.76, -0.1, 0.17, 0.06, 0.24],
    [0.16, 0.7, -0.08, 0.18, 0.06, -0.72],
  ];

  leafOffsets.forEach(([leafX, leafY, leafZ, width, depth, tilt], index) => {
    const leaf = new Mesh(
      new BoxGeometry(width * plantScale * 1.08, 0.034 * plantScale, depth * plantScale * 1.08),
      leafMaterial,
    );
    leaf.position.set(leafX * plantScale, leafY * plantScale * 1.04, leafZ * plantScale);
    leaf.rotation.set(0.12 + index * 0.04, tilt, 0.3 * Math.sign(tilt || 1));
    root.add(leaf);
  });

  return root;
}

function createFakeRoseTree(
  x: number,
  z: number,
  scale = 1,
): Group {
  const root = new Group();
  root.position.set(x, 0, z);

  const trunkMaterial = new MeshStandardMaterial({
    color: 0x6f4e33,
    roughness: 0.92,
    metalness: 0.02,
  });
  const branchMaterial = new MeshStandardMaterial({
    color: 0x7f5c3e,
    roughness: 0.9,
    metalness: 0.02,
  });
  const foliageMaterial = new MeshStandardMaterial({
    color: 0x6da55b,
    emissive: 0x19331a,
    emissiveIntensity: 0.04,
    roughness: 0.84,
    metalness: 0.02,
  });
  const roseMaterial = new MeshStandardMaterial({
    color: 0x8fc874,
    emissive: 0x243f1b,
    emissiveIntensity: 0.04,
    roughness: 0.8,
    metalness: 0.02,
  });

  const trunk = new Mesh(
    new CylinderGeometry(0.12 * scale, 0.18 * scale, 2.7 * scale, 10),
    trunkMaterial,
  );
  trunk.position.y = 1.35 * scale;
  trunk.rotation.z = -0.04;
  root.add(trunk);

  const branchSpecs: Array<[number, number, number, number, number, number]> = [
    [-0.3, 2.05, 0.04, 0.1, 0.42, -0.58],
    [0.28, 2.18, -0.02, -0.12, -0.36, 0.62],
    [-0.12, 2.42, 0.08, 0.04, 0.22, -0.28],
  ];
  branchSpecs.forEach(([branchX, branchY, branchZ, rotX, rotY, rotZ]) => {
    const branch = new Mesh(
      new CylinderGeometry(0.045 * scale, 0.075 * scale, 0.92 * scale, 8),
      branchMaterial,
    );
    branch.position.set(branchX * scale, branchY * scale, branchZ * scale);
    branch.rotation.set(rotX, rotY, rotZ);
    root.add(branch);
  });

  const canopySpecs: Array<[number, number, number, number, number, number, number]> = [
    [0, 3.06, 0, 1.42, 0.98, 1.18, 0],
    [-0.54, 2.76, 0.12, 0.92, 0.78, 0.84, 0.24],
    [0.56, 2.84, -0.06, 0.96, 0.8, 0.86, -0.18],
    [0.06, 3.42, 0.08, 0.84, 0.62, 0.78, 0.12],
  ];
  canopySpecs.forEach(([cx, cy, cz, sx, sy, sz, rotZ]) => {
    const puff = new Mesh(new SphereGeometry(0.48 * scale, 16, 14), foliageMaterial);
    puff.position.set(cx * scale, cy * scale, cz * scale);
    puff.scale.set(sx, sy, sz);
    puff.rotation.z = rotZ;
    root.add(puff);
  });

  const roseSpecs: Array<[number, number, number, number]> = [
    [-0.46, 3.06, 0.18, 0.12],
    [0.24, 3.18, -0.22, 0.13],
    [0.52, 2.86, 0.14, 0.1],
    [-0.08, 3.42, 0.06, 0.11],
    [-0.62, 2.72, -0.08, 0.1],
  ];
  roseSpecs.forEach(([rx, ry, rz, radius]) => {
    const bloom = new Mesh(new SphereGeometry(radius * scale, 10, 10), roseMaterial);
    bloom.position.set(rx * scale, ry * scale, rz * scale);
    root.add(bloom);
  });

  return root;
}

function createMiniPlayground(
  x: number,
  z: number,
  rotationY: number,
  scale = 1,
): {
  root: Group;
  slide: ChapterTwoSlideInteractable;
} {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const postMaterial = new MeshStandardMaterial({
    color: 0x8ec6e0,
    roughness: 0.44,
    metalness: 0.36,
  });
  const platformMaterial = new MeshStandardMaterial({
    color: 0xf2c766,
    roughness: 0.74,
    metalness: 0.08,
  });
  const railMaterial = new MeshStandardMaterial({
    color: 0xe76a76,
    roughness: 0.68,
    metalness: 0.08,
  });
  const slideMaterial = new MeshStandardMaterial({
    color: 0x79c2ea,
    roughness: 0.5,
    metalness: 0.14,
  });
  const stairMaterial = new MeshStandardMaterial({
    color: 0x79b96a,
    roughness: 0.66,
    metalness: 0.08,
  });

  const platformWidth = 2.9 * scale;
  const platformDepth = 2.3 * scale;
  const platformHeight = 1.26 * scale;
  const postHeight = 3.02 * scale;
  const roofY = 2.94 * scale;
  const slideLength = 2.46 * scale;
  const slideAngle = 0.52;
  const slideCenterY = 0.82 * scale;
  const slideCenterZ = platformDepth * 0.5 + 1.28 * scale;
  const stairBaseX = -platformWidth * 0.5 - 1.16 * scale;
  const stairFrontZ = 0.34 * scale;
  const standingPlatformY = GAME_CONFIG.player.height + platformHeight;
  const seatedSlideStartY = standingPlatformY - 0.34;
  const platformCenter = offsetPosition(x, z, rotationY, -0.02 * scale, 0.12 * scale).setY(standingPlatformY);
  const platformHalfWidth = platformWidth * 0.5 - 0.08 * scale;
  const platformHalfDepth = platformDepth * 0.5 + 0.2 * scale;
  const slideHalfWidth = 0.52 * scale;

  const postOffsets: Array<[number, number]> = [
    [-platformWidth * 0.5, -platformDepth * 0.5],
    [platformWidth * 0.5, -platformDepth * 0.5],
    [-platformWidth * 0.5, platformDepth * 0.5],
    [platformWidth * 0.5, platformDepth * 0.5],
  ];
  postOffsets.forEach(([postX, postZ]) => {
    const post = new Mesh(
      new CylinderGeometry(0.1 * scale, 0.12 * scale, postHeight, 10),
      postMaterial,
    );
    post.position.set(postX, postHeight * 0.5, postZ);
    root.add(post);
  });

  const platform = new Mesh(
    new BoxGeometry(platformWidth, 0.14 * scale, platformDepth),
    platformMaterial,
  );
  platform.position.set(0, platformHeight, 0);

  const underDeck = new Mesh(
    new BoxGeometry(platformWidth - 0.24 * scale, 0.22 * scale, platformDepth - 0.24 * scale),
    new MeshStandardMaterial({
      color: 0xe3a85f,
      roughness: 0.8,
      metalness: 0.04,
    }),
  );
  underDeck.position.set(0, platformHeight - 0.2 * scale, 0);

  const roof = new Mesh(
    new BoxGeometry(3.08 * scale, 0.12 * scale, 2.46 * scale),
    railMaterial,
  );
  roof.position.set(0, roofY, -0.08 * scale);

  const roofPanelFront = new Mesh(
    new BoxGeometry(2.86 * scale, 0.54 * scale, 0.08 * scale),
    railMaterial,
  );
  roofPanelFront.position.set(0, roofY - 0.28 * scale, -platformDepth * 0.5 + 0.08 * scale);

  const rearRail = new Mesh(
    new BoxGeometry(platformWidth - 0.16 * scale, 0.48 * scale, 0.08 * scale),
    railMaterial,
  );
  rearRail.position.set(0, platformHeight + 0.26 * scale, -platformDepth * 0.5 + 0.06 * scale);
  const leftRailRear = new Mesh(
    new BoxGeometry(0.08 * scale, 0.46 * scale, 0.86 * scale),
    railMaterial,
  );
  const leftRailFront = new Mesh(
    new BoxGeometry(0.08 * scale, 0.46 * scale, 0.74 * scale),
    railMaterial,
  );
  const railRight = new Mesh(
    new BoxGeometry(0.08 * scale, 0.46 * scale, platformDepth - 0.18 * scale),
    railMaterial,
  );
  leftRailRear.position.set(-platformWidth * 0.5 + 0.04 * scale, platformHeight + 0.24 * scale, -0.66 * scale);
  leftRailFront.position.set(-platformWidth * 0.5 + 0.04 * scale, platformHeight + 0.24 * scale, 0.76 * scale);
  railRight.position.set(platformWidth * 0.5 - 0.04 * scale, platformHeight + 0.24 * scale, 0);
  const frontGuardLeft = new Mesh(
    new BoxGeometry(0.78 * scale, 0.42 * scale, 0.08 * scale),
    railMaterial,
  );
  const frontGuardRight = frontGuardLeft.clone();
  frontGuardLeft.position.set(-0.9 * scale, platformHeight + 0.2 * scale, platformDepth * 0.5 - 0.04 * scale);
  frontGuardRight.position.set(0.9 * scale, platformHeight + 0.2 * scale, platformDepth * 0.5 - 0.04 * scale);

  const slideBed = new Mesh(
    new BoxGeometry(1.02 * scale, 0.12 * scale, slideLength),
    slideMaterial,
  );
  slideBed.position.set(0, slideCenterY, slideCenterZ);
  slideBed.rotation.x = slideAngle;
  const slideSideLeft = new Mesh(
    new BoxGeometry(0.1 * scale, 0.3 * scale, slideLength),
    slideMaterial,
  );
  const slideSideRight = slideSideLeft.clone();
  slideSideLeft.position.set(-0.5 * scale, slideCenterY + 0.14 * scale, slideCenterZ);
  slideSideRight.position.set(0.5 * scale, slideCenterY + 0.14 * scale, slideCenterZ);
  slideSideLeft.rotation.x = slideAngle;
  slideSideRight.rotation.x = slideAngle;
  const slideTopLip = new Mesh(
    new BoxGeometry(1.18 * scale, 0.08 * scale, 0.12 * scale),
    slideMaterial,
  );
  slideTopLip.position.set(0, platformHeight + 0.06 * scale, platformDepth * 0.5 + 0.1 * scale);
  const slideSupportLeft = new Mesh(
    new BoxGeometry(0.1 * scale, 1.12 * scale, 0.1 * scale),
    postMaterial,
  );
  const slideSupportRight = slideSupportLeft.clone();
  slideSupportLeft.position.set(-0.34 * scale, 0.74 * scale, platformDepth * 0.5 + 1.82 * scale);
  slideSupportRight.position.set(0.34 * scale, 0.74 * scale, platformDepth * 0.5 + 1.82 * scale);
  slideSupportLeft.rotation.z = -0.1;
  slideSupportRight.rotation.z = 0.1;
  const slideExitPad = new Mesh(
    new BoxGeometry(1.12 * scale, 0.06 * scale, 0.74 * scale),
    platformMaterial,
  );
  slideExitPad.position.set(0, 0.08 * scale, platformDepth * 0.5 + 2.7 * scale);

  const stairStringerLeft = new Mesh(
    new BoxGeometry(0.12 * scale, 1.16 * scale, 0.12 * scale),
    stairMaterial,
  );
  const stairStringerRight = stairStringerLeft.clone();
  stairStringerLeft.position.set(stairBaseX, 0.6 * scale, -0.08 * scale);
  stairStringerRight.position.set(stairBaseX + 1.18 * scale, 0.6 * scale, -0.08 * scale);
  stairStringerLeft.rotation.z = -0.58;
  stairStringerRight.rotation.z = -0.58;
  const stairRailLeft = new Mesh(
    new CylinderGeometry(0.03 * scale, 0.03 * scale, 1.74 * scale, 8),
    stairMaterial,
  );
  const stairRailRight = stairRailLeft.clone();
  stairRailLeft.position.set(stairBaseX - 0.08 * scale, 1.14 * scale, -0.16 * scale);
  stairRailRight.position.set(stairBaseX + 1.26 * scale, 1.14 * scale, -0.16 * scale);
  stairRailLeft.rotation.z = -0.46;
  stairRailRight.rotation.z = -0.46;
  for (let index = 0; index < 5; index += 1) {
    const step = new Mesh(
      new BoxGeometry(1.18 * scale, 0.1 * scale, 0.36 * scale),
      stairMaterial,
    );
    step.position.set(
      stairBaseX + 0.55 * scale + index * 0.16 * scale,
      0.18 * scale + index * 0.25 * scale,
      stairFrontZ - index * 0.24 * scale,
    );
    root.add(step);
  }

  root.add(
    platform,
    underDeck,
    roof,
    roofPanelFront,
    rearRail,
    leftRailRear,
    leftRailFront,
    railRight,
    frontGuardLeft,
    frontGuardRight,
    slideBed,
    slideSideLeft,
    slideSideRight,
    slideTopLip,
    slideSupportLeft,
    slideSupportRight,
    slideExitPad,
    stairStringerLeft,
    stairStringerRight,
    stairRailLeft,
    stairRailRight,
  );

  return {
    root,
    slide: {
      label: 'Playground Slide',
      stairInteractPosition: offsetPosition(
        x,
        z,
        rotationY,
        stairBaseX + 0.38 * scale,
        stairFrontZ + 0.08 * scale,
      ).setY(GAME_CONFIG.player.height),
      topInteractPosition: offsetPosition(
        x,
        z,
        rotationY,
        0,
        platformDepth * 0.5 - 0.18 * scale,
      ).setY(standingPlatformY),
      topPosition: platformCenter.clone(),
      startPosition: offsetPosition(
        x,
        z,
        rotationY,
        0,
        platformDepth * 0.5 + 0.24 * scale,
      ).setY(seatedSlideStartY),
      endPosition: offsetPosition(
        x,
        z,
        rotationY,
        0,
        platformDepth * 0.5 + 3.02 * scale,
      ).setY(GAME_CONFIG.player.height),
      lookTarget: offsetPosition(x, z, rotationY, 0, platformDepth * 0.5 + 5.1 * scale).setY(
        GAME_CONFIG.player.height + 0.12,
      ),
      platformCenter,
      platformHalfWidth,
      platformHalfDepth,
      platformFloorY: standingPlatformY,
      slideFloorStart: offsetPosition(
        x,
        z,
        rotationY,
        0,
        platformDepth * 0.5 + 0.12 * scale,
      ).setY(standingPlatformY - 0.08),
      slideFloorEnd: offsetPosition(
        x,
        z,
        rotationY,
        0,
        platformDepth * 0.5 + slideLength + 0.34 * scale,
      ).setY(GAME_CONFIG.player.height + 0.16),
      slideHalfWidth,
    },
  };
}

function createAmbientPlantDecor(): PlantDecorResult {
  const root = new Group();
  const colliders: CollisionBox[] = [];
  const plantWallInset = (scale: number): number => 0.78 + scale * 0.22;

  const getRoomBounds = (room: RoomRect): { minX: number; maxX: number; minZ: number; maxZ: number } => {
    const [minCenterX, minCenterZ] = cellToWorld(room.rowStart, room.columnStart);
    const [maxCenterX, maxCenterZ] = cellToWorld(
      room.rowStart + room.height - 1,
      room.columnStart + room.width - 1,
    );
    return {
      minX: minCenterX - HALF_CELL,
      maxX: maxCenterX + HALF_CELL,
      minZ: minCenterZ - HALF_CELL,
      maxZ: maxCenterZ + HALF_CELL,
    };
  };

  const addCornerPlant = (
    room: RoomRect,
    corner: 'nw' | 'ne' | 'sw' | 'se',
    rotationY: number,
    scale = 1,
    leafHex?: number,
    potHex?: number,
  ): void => {
    const bounds = getRoomBounds(room);
    const inset = plantWallInset(scale);
    const x = corner === 'nw' || corner === 'sw' ? bounds.minX + inset : bounds.maxX - inset;
    const z = corner === 'nw' || corner === 'ne' ? bounds.minZ + inset : bounds.maxZ - inset;
    const plant = createPottedPlant(x, z, rotationY, scale, leafHex, potHex);
    root.add(plant);
    addCollider(colliders, x, z, 0.68 * scale, 0.68 * scale);
  };

  addCornerPlant(READING_ROOM, 'nw', 0.28, 0.96, 0x769d69, 0xc89466);
  addCornerPlant(READING_ROOM, 'se', -0.34, 0.86, 0x6c8e57, 0xb97f56);
  addCornerPlant(CHECK_IN_ROOM, 'nw', 0.24, 0.88, 0x789f6d, 0xca9467);
  addCornerPlant(CHECK_IN_ROOM, 'se', -0.3, 0.82, 0x6a915a, 0xb98058);
  addCornerPlant(CUBBY_ROOM, 'nw', 0.22, 0.9, 0x74a078, 0xcd9a72);
  addCornerPlant(CUBBY_ROOM, 'se', -0.28, 0.84, 0x6f9a65, 0xc48a62);
  addCornerPlant(BLOCK_ROOM, 'nw', 0.18, 0.94, 0x7ca76f, 0xd19868);
  addCornerPlant(BLOCK_ROOM, 'se', -0.26, 0.84, 0x6e9860, 0xbf845b);
  addCornerPlant(NAP_ROOM, 'ne', -0.24, 0.84, 0x7a9b66, 0xc58a60);
  addCornerPlant(NAP_ROOM, 'sw', 0.26, 0.8, 0x7f9f73, 0xc99268);
  addCornerPlant(MUSIC_ROOM, 'sw', 0.4, 0.88, 0x729f76, 0xc38a65);
  addCornerPlant(MUSIC_ROOM, 'ne', -0.34, 0.82, 0x6e9361, 0xbf855c);
  addCornerPlant(PRETEND_PLAY, 'se', -0.18, 0.92, 0x79a56d, 0xcd9b72);
  addCornerPlant(PRETEND_PLAY, 'nw', 0.24, 0.86, 0x6f985d, 0xc1865f);
  addCornerPlant(QUIET_NOOK, 'nw', 0.22, 0.9, 0x789d70, 0xc48d64);
  addCornerPlant(QUIET_NOOK, 'se', -0.26, 0.84, 0x6b935d, 0xba8159);
  addCornerPlant(CLIMB_ROOM, 'sw', 0.32, 1.02, 0x6e9b63, 0xbb8258);
  addCornerPlant(CLIMB_ROOM, 'ne', -0.22, 0.88, 0x86ad76, 0xcf9a72);
  addCornerPlant(STORY_ROOM, 'nw', 0.2, 0.86, 0x739d68, 0xc58b60);
  addCornerPlant(STORY_ROOM, 'se', -0.3, 0.82, 0x6c925c, 0xbc825a);
  addCornerPlant(BALL_PIT_ROOM, 'sw', 0.34, 1.06, 0x79a964, 0xcc976b);
  addCornerPlant(BALL_PIT_ROOM, 'ne', -0.28, 0.94, 0x6f9860, 0xc88d64);
  addCornerPlant(CRAFT_ROOM, 'se', -0.3, 0.88, 0x7da36c, 0xc68d66);
  addCornerPlant(CRAFT_ROOM, 'nw', 0.26, 0.84, 0x739a63, 0xbc835c);

  return {
    root,
    colliders,
  };
}

function createAmbientRoomFurniture(): AmbientRoomFurnitureResult {
  const root = new Group();
  const colliders: CollisionBox[] = [];
  const seats: ChapterTwoSeat[] = [];
  const [lowerWestHallX, lowerWestHallZ] = cellToWorld(30, 10);
  const [lowerCenterHallX, lowerCenterHallZ] = cellToWorld(30, 21);
  const [lowerEastHallX, lowerEastHallZ] = cellToWorld(30, 32);
  const [middleWestHallX, middleWestHallZ] = cellToWorld(20, 10);
  const [middleCenterHallX, middleCenterHallZ] = cellToWorld(20, 21);
  const [middleEastHallX, middleEastHallZ] = cellToWorld(20, 32);
  const [upperCenterHallX, upperCenterHallZ] = cellToWorld(11, 21);
  const [upperWestHallX, upperWestHallZ] = cellToWorld(11, 10);
  const [upperEastHallX, upperEastHallZ] = cellToWorld(11, 32);

  const addCouch = (
    id: string,
    room: RoomRect,
    offsetX: number,
    offsetZ: number,
    rotationY: number,
    colorHex: number,
  ): void => {
    const [x, z] = getRoomCenter(room, offsetX, offsetZ);
    const couch = createCouch(id, x, z, rotationY, colorHex);
    root.add(couch.root);
    seats.push(couch.seat);
    addCollider(colliders, x, z, 2.4, 1.02);
  };

  const addTub = (
    room: RoomRect,
    offsetX: number,
    offsetZ: number,
    rotationY: number,
    colorHex: number,
    scale = 1,
    pieceCount = 5,
  ): void => {
    const [x, z] = getRoomCenter(room, offsetX, offsetZ);
    root.add(createToyTub(x, z, rotationY, colorHex, scale, pieceCount));
    addCollider(colliders, x, z, 0.82 * scale, 0.68 * scale);
  };

  const addShelf = (
    room: RoomRect,
    offsetX: number,
    offsetZ: number,
    rotationY: number,
    occupants: readonly ShelfStuffySpec[],
  ): void => {
    const [x, z] = getRoomCenter(room, offsetX, offsetZ);
    root.add(createStuffyShelf(x, z, rotationY, occupants));
    addCollider(colliders, x, z, 1.85, 0.34);
  };

  const addBlocks = (room: RoomRect, offsetX: number, offsetZ: number): void => {
    const [x, z] = getRoomCenter(room, offsetX, offsetZ);
    root.add(createBlockScatter(x, z));
  };

  const addLegos = (
    room: RoomRect,
    offsetX: number,
    offsetZ: number,
    pieceCount: number,
    spreadX: number,
    spreadZ: number,
  ): void => {
    const [x, z] = getRoomCenter(room, offsetX, offsetZ);
    root.add(createLegoScatter(x, z, pieceCount, spreadX, spreadZ));
  };

  const addCars = (room: RoomRect, offsetX: number, offsetZ: number): void => {
    const [x, z] = getRoomCenter(room, offsetX, offsetZ);
    root.add(createToyCarScatter(x, z));
  };

  const addFloorStuffy = (
    room: RoomRect,
    offsetX: number,
    offsetZ: number,
    scale: number,
    furHex: number,
    accentHex: number,
    animal: StuffyAnimal,
    rotationY: number,
    liftY = 0,
    tiltX = 0,
    tiltZ = 0,
  ): void => {
    const [x, z] = getRoomCenter(room, offsetX, offsetZ);
    const stuffy = createStuffyToy(scale, furHex, accentHex, animal);
    stuffy.position.set(x, liftY, z);
    stuffy.rotation.set(tiltX, rotationY, tiltZ);
    root.add(stuffy);
  };

  const addHallStuffy = (
    x: number,
    z: number,
    scale: number,
    furHex: number,
    accentHex: number,
    animal: StuffyAnimal,
    rotationY: number,
    liftY = 0,
    tiltX = 0,
    tiltZ = 0,
  ): void => {
    const stuffy = createStuffyToy(scale, furHex, accentHex, animal);
    stuffy.position.set(x, liftY, z);
    stuffy.rotation.set(tiltX, rotationY, tiltZ);
    root.add(stuffy);
  };

  addCouch('reading-north-couch', READING_ROOM, -4.4, -5.1, 0, 0xc7b3d7);
  addCouch('reading-south-couch', READING_ROOM, 4.4, 5.1, Math.PI, 0xb7cf9b);
  addCouch('reading-east-couch', READING_ROOM, 6.0, 0.8, -Math.PI / 2, 0xb4c7de);
  addShelf(READING_ROOM, 6.0, -8.9, 0, [
    { shelfIndex: 0, side: 'left', scale: 0.56, furHex: 0xd5aa81, accentHex: 0xf4ecdd, animal: 'bear', rotationY: 0.16 },
    { shelfIndex: 1, side: 'right', scale: 0.54, furHex: 0xaac2de, accentHex: 0xf2eadb, animal: 'cat', rotationY: -0.2 },
  ]);
  addFloorStuffy(READING_ROOM, 4.8, 4.1, 0.68, 0xcaa4d7, 0xf0e7d7, 'cat', -0.28);
  addTub(READING_ROOM, -6.0, 0.9, Math.PI / 2, 0xd595c4, 0.96, 6);
  addBlocks(READING_ROOM, 0.8, 1.4);
  addCars(READING_ROOM, -1.2, 4.0);
  addLegos(READING_ROOM, -0.8, -1.0, 6, 1.6, 0.7);

  addCouch('block-north-couch', BLOCK_ROOM, -4.2, -5.1, 0, 0xa9c4de);
  addCouch('block-south-couch', BLOCK_ROOM, 4.2, 5.1, Math.PI, 0xc4d89a);
  addCouch('block-west-couch', BLOCK_ROOM, -6.1, 0.9, Math.PI / 2, 0xd5b58f);
  addTub(BLOCK_ROOM, 6.1, -1.2, -Math.PI / 2, 0xe4a46b, 1.08, 7);
  addShelf(BLOCK_ROOM, -6.0, -8.9, 0, [
    { shelfIndex: 0, side: 'right', scale: 0.54, furHex: 0xd6a77f, accentHex: 0xf4ebdc, animal: 'dog', rotationY: -0.16 },
    { shelfIndex: 1, side: 'left', scale: 0.52, furHex: 0x9fbad8, accentHex: 0xf1e8d8, animal: 'bear', rotationY: 0.18 },
  ]);
  addFloorStuffy(BLOCK_ROOM, -2.8, -1.0, 0.7, 0xd5a47e, 0xf5eadc, 'bear', 0.36, 0.02, 0.08, 0.5);
  addBlocks(BLOCK_ROOM, -0.6, 1.8);
  addLegos(BLOCK_ROOM, 4.0, 2.2, 8, 1.8, 0.8);
  addTub(BLOCK_ROOM, 6.0, 4.0, -Math.PI / 2, 0xbf8fd9, 0.9, 5);

  addCouch('nap-south-couch', NAP_ROOM, 0, 5.1, Math.PI, 0xcdb79a);
  addCouch('nap-north-couch', NAP_ROOM, 0, -5.1, 0, 0xc4b0d2);
  addCouch('nap-east-couch', NAP_ROOM, 6.0, 0.8, -Math.PI / 2, 0xb4c6de);
  addTub(NAP_ROOM, -6.0, -1.5, Math.PI / 2, 0xc996d4, 0.94, 5);
  addShelf(NAP_ROOM, 6.0, 8.9, Math.PI, [
    { shelfIndex: 0, side: 'left', scale: 0.5, furHex: 0xe0b36e, accentHex: 0xf5ebdc, animal: 'bunny', rotationY: 0.12 },
  ]);
  addFloorStuffy(NAP_ROOM, 2.8, 3.7, 0.66, 0xb7c990, 0xf3eadb, 'bunny', -0.42);
  addCars(NAP_ROOM, -1.0, -0.4);
  addBlocks(NAP_ROOM, 2.1, 1.8);

  addCouch('music-north-couch', MUSIC_ROOM, 0, -5.1, 0, 0xb4c7df);
  addCouch('music-south-couch', MUSIC_ROOM, 0, 5.1, Math.PI, 0xc6d6a2);
  addCouch('music-east-couch', MUSIC_ROOM, 4.7, 0.6, -Math.PI / 2, 0xd2b792);
  addTub(MUSIC_ROOM, 4.5, 1.9, Math.PI, 0xf0c976, 0.92, 5);
  addFloorStuffy(MUSIC_ROOM, -2.2, 3.8, 0.68, 0xa7bfd8, 0xf5ebdc, 'dog', 0.22);
  addBlocks(MUSIC_ROOM, -1.0, 1.8);
  addCars(MUSIC_ROOM, 2.4, -0.8);
  addLegos(MUSIC_ROOM, -1.8, -1.2, 6, 1.4, 0.7);

  addCouch('pretend-north-couch', PRETEND_PLAY, -4.0, -5.1, 0, 0xd4b58f);
  addCouch('pretend-south-couch', PRETEND_PLAY, 4.0, 5.1, Math.PI, 0xb7cf9a);
  addCouch('pretend-west-couch', PRETEND_PLAY, -6.1, 0.8, Math.PI / 2, 0xb2c6df);
  addTub(PRETEND_PLAY, 6.0, -0.9, -Math.PI / 2, 0xd98db6, 0.98, 6);
  addShelf(PRETEND_PLAY, -6.0, 8.9, Math.PI, [
    { shelfIndex: 0, side: 'left', scale: 0.54, furHex: 0xc7a5d9, accentHex: 0xf3ebdb, animal: 'cat', rotationY: 0.14 },
    { shelfIndex: 1, side: 'right', scale: 0.5, furHex: 0xb9ca94, accentHex: 0xf2e9d8, animal: 'bunny', rotationY: -0.14 },
  ]);
  addFloorStuffy(PRETEND_PLAY, 3.8, 3.2, 0.72, 0xd4a785, 0xf2ead8, 'elephant', -0.34, 0.03, -0.12, -0.66);
  addLegos(PRETEND_PLAY, -0.4, 2.0, 8, 1.9, 0.9);
  addCars(PRETEND_PLAY, 1.8, -0.8);

  addCouch('climb-south-couch', CLIMB_ROOM, 0, 5.1, Math.PI, 0xc5d79f);
  addCouch('climb-north-couch', CLIMB_ROOM, 0, -5.1, 0, 0xb3c9e2);
  addCouch('climb-east-couch', CLIMB_ROOM, 6.0, 0.8, -Math.PI / 2, 0xd3ba94);
  addTub(CLIMB_ROOM, -6.0, -1.4, Math.PI / 2, 0x9fc4e8, 0.94, 5);
  addFloorStuffy(CLIMB_ROOM, -4.5, 3.9, 0.7, 0xcfa2b9, 0xf0e7d7, 'cat', 0.44);
  addBlocks(CLIMB_ROOM, 1.0, 1.7);
  addCars(CLIMB_ROOM, 4.2, -0.9);
  addLegos(CLIMB_ROOM, -1.8, -1.0, 6, 1.4, 0.7);

  addCouch('story-north-couch', STORY_ROOM, 0, -5.1, 0, 0xcab0d9);
  addCouch('story-south-couch', STORY_ROOM, 0, 5.1, Math.PI, 0xbdd39c);
  addCouch('story-east-couch', STORY_ROOM, 6.0, 0.8, -Math.PI / 2, 0xd6b893);
  addShelf(STORY_ROOM, 5.8, 8.9, Math.PI, [
    { shelfIndex: 0, side: 'right', scale: 0.56, furHex: 0xe0b16b, accentHex: 0xf5ebdc, animal: 'bunny', rotationY: 0.12 },
    { shelfIndex: 1, side: 'left', scale: 0.52, furHex: 0xb2c793, accentHex: 0xf2ead8, animal: 'dog', rotationY: -0.18 },
  ]);
  addFloorStuffy(STORY_ROOM, 2.6, 3.6, 0.69, 0xb8c994, 0xf3ebdb, 'dog', -0.3);
  addTub(STORY_ROOM, -5.8, -1.0, Math.PI / 2, 0xf0cb79, 0.94, 5);
  addBlocks(STORY_ROOM, 1.0, 1.8);
  addCars(STORY_ROOM, -1.6, -0.8);

  addCouch('ballpit-north-couch', BALL_PIT_ROOM, -5.0, -7.0, 0, 0xa8c2de);
  addCouch('ballpit-south-couch', BALL_PIT_ROOM, 5.0, 7.0, Math.PI, 0xc3d79f);
  addCouch('ballpit-west-couch', BALL_PIT_ROOM, -9.3, 0.8, Math.PI / 2, 0xd5b78f);
  addTub(BALL_PIT_ROOM, 9.2, 0.4, -Math.PI / 2, 0xf0bd72, 1.18, 8);
  addShelf(BALL_PIT_ROOM, -9.0, -11.2, 0, [
    { shelfIndex: 0, side: 'left', scale: 0.56, furHex: 0xd5a47e, accentHex: 0xf5eadc, animal: 'bear', rotationY: 0.18 },
    { shelfIndex: 1, side: 'right', scale: 0.52, furHex: 0x9db8d7, accentHex: 0xf2ead9, animal: 'cat', rotationY: -0.22 },
  ]);
  addFloorStuffy(BALL_PIT_ROOM, 7.2, -3.0, 0.78, 0xdab083, 0xf4e9dd, 'bear', 0.28);
  addLegos(BALL_PIT_ROOM, -1.4, 0.2, 10, 2.4, 1.1);
  addBlocks(BALL_PIT_ROOM, 3.2, -2.2);

  addCouch('craft-north-couch', CRAFT_ROOM, -4.2, -5.1, 0, 0xb8cfe8);
  addCouch('craft-south-couch', CRAFT_ROOM, 4.2, 5.1, Math.PI, 0xcbdc9f);
  addCouch('craft-west-couch', CRAFT_ROOM, -6.0, 0.8, Math.PI / 2, 0xd7b792);
  addTub(CRAFT_ROOM, -6.0, 0.8, Math.PI / 2, 0xdc8fb8, 1, 6);
  addShelf(CRAFT_ROOM, 6.0, -8.9, 0, [
    { shelfIndex: 0, side: 'right', scale: 0.54, furHex: 0xe0b16b, accentHex: 0xf4ebdc, animal: 'bunny', rotationY: -0.12 },
    { shelfIndex: 1, side: 'left', scale: 0.5, furHex: 0xb7c990, accentHex: 0xf2ead8, animal: 'dog', rotationY: 0.18 },
  ]);
  addFloorStuffy(CRAFT_ROOM, -2.5, 3.8, 0.68, 0x9fbad8, 0xf1e8d8, 'bear', -0.4, 0.02, 0.1, -0.5);
  addBlocks(CRAFT_ROOM, 0.8, 1.9);
  addLegos(CRAFT_ROOM, 4.4, -0.8, 7, 1.7, 0.8);
  addCars(CRAFT_ROOM, -0.8, -1.0);
  root.add(
    createBlockScatter(lowerWestHallX - 0.2, lowerWestHallZ + 0.25),
    createToyCarScatter(lowerCenterHallX + 0.1, lowerCenterHallZ - 0.55),
    createLegoScatter(lowerEastHallX - 0.15, lowerEastHallZ + 0.3, 6, 1.1, 0.44),
    createLegoScatter(middleWestHallX + 0.2, middleWestHallZ - 0.35, 5, 1.0, 0.42),
    createBlockScatter(middleCenterHallX - 0.1, middleCenterHallZ + 0.15),
    createToyCarScatter(middleEastHallX + 0.12, middleEastHallZ - 0.5),
    createBlockScatter(upperCenterHallX + 0.15, upperCenterHallZ - 0.15),
    createLegoScatter(upperWestHallX - 0.2, upperWestHallZ + 0.25, 5, 1.0, 0.38),
    createToyCarScatter(upperEastHallX + 0.15, upperEastHallZ - 0.35),
  );
  addHallStuffy(lowerWestHallX + 0.55, lowerWestHallZ - 0.2, 0.66, 0xd4a785, 0xf2ead8, 'bear', 0.52, 0.03, -0.14, 0.58);
  addHallStuffy(lowerWestHallX + 1.05, lowerWestHallZ + 0.18, 0.62, 0xa7bfd8, 0xf5ebdc, 'cat', -0.28, 0.02, 0.08, -0.46);
  addHallStuffy(middleEastHallX - 0.55, middleEastHallZ + 0.28, 0.68, 0xcfa2b9, 0xf0e7d7, 'bunny', -0.34, 0.03, -0.12, -0.62);
  addHallStuffy(upperWestHallX + 0.5, upperWestHallZ - 0.4, 0.64, 0xb8c994, 0xf3ebdb, 'dog', 0.28, 0.02, 0.1, 0.46);

  return {
    root,
    colliders,
    seats,
  };
}

function createEntryFurniture(): EntryFurnitureResult {
  const root = new Group();
  const colliders: CollisionBox[] = [];
  const seats: ChapterTwoSeat[] = [];
  const readables: ChapterTwoReadable[] = [];
  const rockingAnimators: RockingAnimator[] = [];
  const trainAnimators: TrainAnimator[] = [];
  const aquariumAnimators: AquariumAnimator[] = [];

  const [lobbyX, lobbyZ] = getRoomCenter(LOBBY);
  const [checkInX, checkInZ] = getRoomCenter(CHECK_IN_ROOM);
  const [cubbiesX, cubbiesZ] = getRoomCenter(CUBBY_ROOM);
  const [readingX, readingZ] = getRoomCenter(READING_ROOM);
  const [quietX, quietZ] = getRoomCenter(QUIET_NOOK);
  const [napX, napZ] = getRoomCenter(NAP_ROOM);
  const [musicX, musicZ] = getRoomCenter(MUSIC_ROOM);
  const [storyX, storyZ] = getRoomCenter(STORY_ROOM);
  const [craftX, craftZ] = getRoomCenter(CRAFT_ROOM);
  const westLobbyHallX = (checkInX + lobbyX) * 0.5 + 0.4;
  const eastLobbyHallX = (cubbiesX + lobbyX) * 0.5 - 0.4;

  const placeWallPoster = (poster: Mesh, x: number, y: number, z: number, rotationY: number, depth = 0.03): Mesh => {
    poster.position.set(x + Math.sin(rotationY) * depth, y, z + Math.cos(rotationY) * depth);
    poster.rotation.y = rotationY;
    return poster;
  };

  const deskWood = new MeshStandardMaterial({
    color: 0xbe8a5e,
    roughness: 0.74,
    metalness: 0.06,
  });
  const deskTop = new MeshStandardMaterial({
    color: 0xcfd7df,
    roughness: 0.46,
    metalness: 0.34,
  });

  const desk = new Group();
  const deskBody = new Mesh(new BoxGeometry(2.5, 0.9, 0.92), deskWood);
  deskBody.position.y = 0.45;
  const deskTopPanel = new Mesh(new BoxGeometry(2.58, 0.08, 1), deskTop);
  deskTopPanel.position.y = 0.94;
  desk.add(deskBody, deskTopPanel);
  desk.position.set(lobbyX - 0.85, 0, lobbyZ - 1.55);
  root.add(desk);
  addCollider(colliders, desk.position.x, desk.position.z, 2.5, 0.92);

  const signInPaper = createPaperPlane('SIGNED IN', SIGN_IN_TEXT, 0x8ab7dc);
  signInPaper.rotation.x = -Math.PI / 2;
  signInPaper.position.set(desk.position.x - 0.42, 0.985, desk.position.z - 0.02);
  const signOutPaper = createPaperPlane('SIGNED OUT', SIGN_OUT_TEXT, 0xd89f84);
  signOutPaper.rotation.x = -Math.PI / 2;
  signOutPaper.position.set(desk.position.x + 0.38, 0.985, desk.position.z + 0.04);
  root.add(signInPaper, signOutPaper);

  readables.push(
    {
      id: 'sign-in-sheet',
      label: 'Sign-In Sheet',
      position: new Vector3(signInPaper.position.x, 1.02, signInPaper.position.z + 0.34),
      text: SIGN_IN_TEXT,
    },
    {
      id: 'sign-out-sheet',
      label: 'Sign-Out Sheet',
      position: new Vector3(signOutPaper.position.x, 1.02, signOutPaper.position.z + 0.34),
      text: SIGN_OUT_TEXT,
    },
  );

  const coffeeDeskX = lobbyX + 5.5;
  const coffeeDeskZ = lobbyZ - 9.35;
  const coffeeSupplyDeskX = lobbyX + 8.15;
  const coffeeSupplyDeskZ = lobbyZ - 9.35;
  const coffeeDesk = createLobbyRefreshmentDesk(coffeeDeskX, coffeeDeskZ, 0, 'coffee');
  const coffeeSupplyDesk = createLobbyRefreshmentDesk(coffeeSupplyDeskX, coffeeSupplyDeskZ, 0, 'supplies');
  root.add(coffeeDesk, coffeeSupplyDesk);
  addCollider(colliders, coffeeDeskX, coffeeDeskZ, 1.78, 0.82);
  addCollider(colliders, coffeeSupplyDeskX, coffeeSupplyDeskZ, 1.78, 0.82);

  const lobbyTank = createLobbyFishTank(lobbyX - 7.15, lobbyZ - 9.35, 0);
  root.add(lobbyTank.root, lobbyTank.crashedRoot);
  aquariumAnimators.push(lobbyTank.animator);
  addCollider(colliders, lobbyX - 7.15, lobbyZ - 9.35, 4.94, 1.24);

  const waitingChairSpecs: Array<[string, string, number, number, number]> = [
    ['waiting-west-1', 'Waiting Chair', lobbyX - 11.4, lobbyZ + 0.9, Math.PI / 2],
    ['waiting-west-2', 'Waiting Chair', lobbyX - 11.4, lobbyZ + 3.4, Math.PI / 2],
    ['waiting-west-3', 'Waiting Chair', lobbyX - 11.4, lobbyZ + 5.0, Math.PI / 2],
    ['waiting-east-1', 'Waiting Chair', lobbyX + 11.4, lobbyZ + 0.9, -Math.PI / 2],
    ['waiting-east-2', 'Waiting Chair', lobbyX + 11.4, lobbyZ + 3.4, -Math.PI / 2],
    ['waiting-east-3', 'Waiting Chair', lobbyX + 11.4, lobbyZ + 5.0, -Math.PI / 2],
    ['waiting-south-1', 'Waiting Chair', lobbyX - 7.2, lobbyZ + 4.9, Math.PI],
    ['waiting-south-2', 'Waiting Chair', lobbyX - 4.2, lobbyZ + 4.9, Math.PI],
    ['waiting-south-3', 'Waiting Chair', lobbyX + 4.2, lobbyZ + 4.9, Math.PI],
    ['waiting-south-4', 'Waiting Chair', lobbyX + 7.2, lobbyZ + 4.9, Math.PI],
  ];

  waitingChairSpecs.forEach(([id, label, x, z, rotationY]) => {
    const chair = createWaitingChair(id, label, x, z, rotationY);
    root.add(chair.root);
    seats.push(chair.seat);
    addCollider(colliders, x, z, 0.92, 0.84);
  });

  root.add(createLobbyRearDoubleDoors(lobbyX, lobbyZ + 5.58));

  const lobbyFloorStuffyA = createStuffyToy(0.66, 0xcaa4d7, 0xf4e9dd, 'bear');
  lobbyFloorStuffyA.position.set(lobbyX - 5.7, 0.02, lobbyZ - 0.8);
  lobbyFloorStuffyA.rotation.set(0.06, 0.4, 0.58);
  const lobbyFloorStuffyB = createStuffyToy(0.7, 0xaec7df, 0xf2e9da, 'bunny');
  lobbyFloorStuffyB.position.set(lobbyX + 5.5, 0, lobbyZ + 1.6);
  lobbyFloorStuffyB.rotation.y = -0.46;
  root.add(
    lobbyFloorStuffyA,
    lobbyFloorStuffyB,
    createBlockScatter(lobbyX - 1.6, lobbyZ + 1.5),
    createBlockScatter(westLobbyHallX - 0.2, lobbyZ + 1.8),
    createBlockScatter(eastLobbyHallX + 0.15, lobbyZ + 1.7),
    createLegoScatter(lobbyX + 2.3, lobbyZ - 1.4, 7, 1.7, 0.65),
    createLegoScatter(westLobbyHallX - 0.1, lobbyZ - 0.95, 5, 1.15, 0.42),
    createToyCarScatter(lobbyX - 0.45, lobbyZ - 1.7),
    createToyCarScatter(eastLobbyHallX + 0.2, lobbyZ - 0.9),
  );

  const leftRoomNorthCouchA = createCouch('check-in-north-couch-a', checkInX - 8.0, checkInZ - 5.1, 0, 0xc4a7cf);
  const leftRoomNorthCouchB = createCouch('check-in-north-couch-b', checkInX - 3.2, checkInZ - 5.1, 0, 0xd5b18b);
  const leftRoomNorthCouchC = createCouch('check-in-north-couch-c', checkInX + 1.8, checkInZ - 5.1, 0, 0xcfb7df);
  const leftRoomSouthCouchA = createCouch('check-in-south-couch-a', checkInX - 8.0, checkInZ + 5.1, Math.PI, 0xb9c98d);
  const leftRoomSouthCouchB = createCouch('check-in-south-couch-b', checkInX - 3.2, checkInZ + 5.1, Math.PI, 0xc8d89a);
  const leftRoomSouthCouchC = createCouch('check-in-south-couch-c', checkInX + 1.8, checkInZ + 5.1, Math.PI, 0xd6dca9);
  const rightRoomNorthCouchA = createCouch('cubby-north-couch-a', cubbiesX - 1.8, cubbiesZ - 5.1, 0, 0x97b7d6);
  const rightRoomNorthCouchB = createCouch('cubby-north-couch-b', cubbiesX + 3.2, cubbiesZ - 5.1, 0, 0x9bc1e2);
  const rightRoomNorthCouchC = createCouch('cubby-north-couch-c', cubbiesX + 8.0, cubbiesZ - 5.1, 0, 0xa9c9df);
  const rightRoomSouthCouchA = createCouch('cubby-south-couch-a', cubbiesX - 1.8, cubbiesZ + 5.1, Math.PI, 0xb4c98d);
  const rightRoomSouthCouchB = createCouch('cubby-south-couch-b', cubbiesX + 3.2, cubbiesZ + 5.1, Math.PI, 0xc3d89a);
  const rightRoomSouthCouchC = createCouch('cubby-south-couch-c', cubbiesX + 8.0, cubbiesZ + 5.1, Math.PI, 0xcddf9d);
  root.add(
    leftRoomNorthCouchA.root,
    leftRoomNorthCouchB.root,
    leftRoomNorthCouchC.root,
    leftRoomSouthCouchA.root,
    leftRoomSouthCouchB.root,
    leftRoomSouthCouchC.root,
    rightRoomNorthCouchA.root,
    rightRoomNorthCouchB.root,
    rightRoomNorthCouchC.root,
    rightRoomSouthCouchA.root,
    rightRoomSouthCouchB.root,
    rightRoomSouthCouchC.root,
  );
  seats.push(
    leftRoomNorthCouchA.seat,
    leftRoomNorthCouchB.seat,
    leftRoomNorthCouchC.seat,
    leftRoomSouthCouchA.seat,
    leftRoomSouthCouchB.seat,
    leftRoomSouthCouchC.seat,
    rightRoomNorthCouchA.seat,
    rightRoomNorthCouchB.seat,
    rightRoomNorthCouchC.seat,
    rightRoomSouthCouchA.seat,
    rightRoomSouthCouchB.seat,
    rightRoomSouthCouchC.seat,
  );
  addCollider(colliders, checkInX - 8.0, checkInZ - 5.1, 2.4, 1.02);
  addCollider(colliders, checkInX - 3.2, checkInZ - 5.1, 2.4, 1.02);
  addCollider(colliders, checkInX + 1.8, checkInZ - 5.1, 2.4, 1.02);
  addCollider(colliders, checkInX - 8.0, checkInZ + 5.1, 2.4, 1.02);
  addCollider(colliders, checkInX - 3.2, checkInZ + 5.1, 2.4, 1.02);
  addCollider(colliders, checkInX + 1.8, checkInZ + 5.1, 2.4, 1.02);
  addCollider(colliders, cubbiesX - 1.8, cubbiesZ - 5.1, 2.4, 1.02);
  addCollider(colliders, cubbiesX + 3.2, cubbiesZ - 5.1, 2.4, 1.02);
  addCollider(colliders, cubbiesX + 8.0, cubbiesZ - 5.1, 2.4, 1.02);
  addCollider(colliders, cubbiesX - 1.8, cubbiesZ + 5.1, 2.4, 1.02);
  addCollider(colliders, cubbiesX + 3.2, cubbiesZ + 5.1, 2.4, 1.02);
  addCollider(colliders, cubbiesX + 8.0, cubbiesZ + 5.1, 2.4, 1.02);

  const rockingHorse = createRockingHorse(checkInX - 0.25, checkInZ + 1.15, -Math.PI / 2);
  root.add(rockingHorse.root);
  seats.push(rockingHorse.seat);
  rockingAnimators.push(rockingHorse.animator);
  addCollider(colliders, checkInX - 0.25, checkInZ + 1.15, 1.18, 0.82);

  const leftShelfA = createStuffyShelf(checkInX - 2.7, checkInZ - 8.7, 0, [
    {
      shelfIndex: 0,
      side: 'left',
      scale: 0.62,
      furHex: 0xd4a785,
      accentHex: 0xf5ebdc,
      animal: 'bear',
      rotationY: 0.18,
    },
    {
      shelfIndex: 1,
      side: 'right',
      scale: 0.58,
      furHex: 0x99b7d8,
      accentHex: 0xf2ead8,
      animal: 'cat',
      rotationY: -0.24,
    },
  ]);
  const leftShelfB = createStuffyShelf(checkInX + 2.7, checkInZ - 8.7, 0, [
    {
      shelfIndex: 1,
      side: 'left',
      scale: 0.6,
      furHex: 0xe0b16b,
      accentHex: 0xf5ebdc,
      animal: 'bunny',
      rotationY: 0.12,
    },
  ]);

  const floorStuffyA = createStuffyToy(0.76, 0xa7bfd8, 0xf5ebdc, 'dog');
  floorStuffyA.position.set(checkInX - 6.2, 0, checkInZ + 3.9);
  floorStuffyA.rotation.y = -0.54;
  const floorStuffyB = createStuffyToy(0.72, 0xd4a785, 0xf2ead8, 'elephant');
  floorStuffyB.position.set(checkInX - 2.7, 0.04, checkInZ + 4.5);
  floorStuffyB.rotation.set(0.22, 0.28, 0.88);
  const floorStuffyC = createStuffyToy(0.7, 0xcaa4d7, 0xf0e7d7, 'cat');
  floorStuffyC.position.set(checkInX + 1.2, 0, checkInZ + 3.85);
  floorStuffyC.rotation.y = -0.22;
  const floorStuffyD = createStuffyToy(0.82, 0xb9c98d, 0xf6ebdc, 'bunny');
  floorStuffyD.position.set(checkInX + 4.6, 0.06, checkInZ + 4.6);
  floorStuffyD.rotation.set(-0.16, 0.42, -1.04);
  const floorStuffyE = createStuffyToy(0.68, 0xd9b6a2, 0xf3e7d9, 'bear');
  floorStuffyE.position.set(checkInX + 6.5, 0.03, checkInZ + 3.6);
  floorStuffyE.rotation.set(0.1, -0.36, 0.56);

  root.add(
    leftShelfA,
    leftShelfB,
    floorStuffyA,
    floorStuffyB,
    floorStuffyC,
    floorStuffyD,
    floorStuffyE,
    createToyCarScatter(checkInX - 0.15, checkInZ + 4.1),
  );

  const trainSet = createToyTrainSet(cubbiesX + 5.8, cubbiesZ - 2.8);
  root.add(trainSet.root);
  trainAnimators.push(trainSet.animator);
  addCollider(colliders, cubbiesX + 7.9, cubbiesZ, 1.45, 1.15);
  addCollider(colliders, cubbiesX + 8.2, cubbiesZ - 5.0, 0.76, 0.62);

  const rightRoomPosterZ = cubbiesZ - 9.72;
  const portraitA = createKidPortraitPoster('Lucy', 0xe38b74, 0xf0cf73, 0);
  portraitA.position.set(cubbiesX - 1.8, 2.12, rightRoomPosterZ);
  const portraitB = createKidPortraitPoster('Jacob', 0x77a5dd, 0xdd9bbf, 1);
  portraitB.position.set(cubbiesX + 3.2, 2.12, rightRoomPosterZ);
  const portraitC = createKidPortraitPoster('Carl', 0x8fbf7d, 0x8dcad4, 2);
  portraitC.position.set(cubbiesX + 8.0, 2.12, rightRoomPosterZ);
  const abcPosterPlacements: Array<[number, number, number, number]> = [
    [cubbiesX - 7.0, 2.24, cubbiesZ - 9.72, 0],
    [readingX + 14.25, 2.28, readingZ + 1.4, -Math.PI / 2],
    [quietX + 1.8, 2.28, quietZ - 12.1, 0],
    [napX - 1.8, 2.28, napZ + 12.1, Math.PI],
    [musicX + 12.25, 2.28, musicZ + 0.8, -Math.PI / 2],
    [storyX - 1.8, 2.28, storyZ - 12.1, 0],
    [craftX - 14.25, 2.28, craftZ + 1.4, Math.PI / 2],
  ];
  const abcPosters = abcPosterPlacements.map(([x, y, z, rotationY]) => {
    return placeWallPoster(createAlphabetPoster(), x, y, z, rotationY);
  });
  root.add(portraitA, portraitB, portraitC, ...abcPosters);

  root.add(
    createBlockScatter(checkInX + 1.9, checkInZ + 4.45),
    createToyTub(cubbiesX + 7.9, cubbiesZ, 0, 0xd98dc4, 1.95, 12),
    createToyTub(cubbiesX + 8.2, cubbiesZ - 5.0, 0, 0xf3d57b, 0.95, 6),
    createLegoScatter(cubbiesX + 1.7, cubbiesZ - 0.2, 10, 2.2, 0.9),
    createLegoScatter(cubbiesX + 0.4, cubbiesZ + 3.1, 8, 2.6, 0.9),
    createLegoScatter(cubbiesX + 6.2, cubbiesZ + 1.95, 4, 0.9, 0.45),
    createLegoScatter(cubbiesX + 4.75, cubbiesZ - 4.1, 5, 1.05, 0.55),
  );

  return {
    root,
    colliders,
    seats,
    readables,
    coffeeMachine: {
      position: new Vector3(coffeeDeskX + 0.1, 1.8, coffeeDeskZ - 0.02),
      interactPosition: new Vector3(coffeeDeskX, 1.04, coffeeDeskZ + 1.08),
    },
    rockingAnimators,
    trainAnimators,
    aquariumAnimators,
    lobbyTankRoot: lobbyTank.root,
    lobbyTankCrashedRoot: lobbyTank.crashedRoot,
  };
}

function createRedWingFurniture(): RedWingFurnitureResult {
  const root = new Group();
  const colliders: CollisionBox[] = [];
  const seats: ChapterTwoSeat[] = [];
  const rockingAnimators: RockingAnimator[] = [];
  const trainAnimators: TrainAnimator[] = [];

  const [quietX, quietZ] = getRoomCenter(QUIET_NOOK);
  const [artX, artZ] = getRoomCenter(ART_ROOM);
  const [lobbyX, lobbyZ] = getRoomCenter(LOBBY);
  const [checkInX, checkInZ] = getRoomCenter(CHECK_IN_ROOM);
  const [cubbiesX, cubbiesZ] = getRoomCenter(CUBBY_ROOM);
  const [readingX, readingZ] = getRoomCenter(READING_ROOM);
  const [westHallX, westHallZ] = cellToWorld(29, 10);
  const [eastHallX, eastHallZ] = cellToWorld(29, 32);
  const [midWestHallX, midWestHallZ] = cellToWorld(20, 10);
  const [midEastHallX, midEastHallZ] = cellToWorld(20, 32);
  const [upperMainHallX, upperMainHallZ] = cellToWorld(11, 21);
  const [upperWestHallX, upperWestHallZ] = cellToWorld(11, 10);
  const [upperEastHallX, upperEastHallZ] = cellToWorld(11, 32);
  const artBounds = getRoomBounds(ART_ROOM);

  const addFloorStuffy = (
    x: number,
    z: number,
    scale: number,
    furHex: number,
    accentHex: number,
    animal: StuffyAnimal,
    rotationY: number,
    liftY = 0,
    tiltX = 0,
    tiltZ = 0,
  ): void => {
    const stuffy = createStuffyToy(scale, furHex, accentHex, animal);
    stuffy.position.set(x, liftY, z);
    stuffy.rotation.set(tiltX, rotationY, tiltZ);
    root.add(stuffy);
  };

  const quietNorthCouchA = createCouch('quiet-north-couch-a', quietX - 2.3, quietZ - 5.1, 0, 0xc8b4da);
  const quietNorthCouchB = createCouch('quiet-north-couch-b', quietX + 2.5, quietZ - 5.1, 0, 0xd8bc96);
  const quietSouthCouchA = createCouch('quiet-south-couch-a', quietX - 2.3, quietZ + 5.1, Math.PI, 0xb6c98f);
  const quietSouthCouchB = createCouch('quiet-south-couch-b', quietX + 2.5, quietZ + 5.1, Math.PI, 0xcad79e);
  root.add(quietNorthCouchA.root, quietNorthCouchB.root, quietSouthCouchA.root, quietSouthCouchB.root);
  seats.push(quietNorthCouchA.seat, quietNorthCouchB.seat, quietSouthCouchA.seat, quietSouthCouchB.seat);
  addCollider(colliders, quietX - 2.3, quietZ - 5.1, 2.4, 1.02);
  addCollider(colliders, quietX + 2.5, quietZ - 5.1, 2.4, 1.02);
  addCollider(colliders, quietX - 2.3, quietZ + 5.1, 2.4, 1.02);
  addCollider(colliders, quietX + 2.5, quietZ + 5.1, 2.4, 1.02);

  const quietShelfA = createStuffyShelf(quietX - 4.8, quietZ - 8.85, 0, [
    {
      shelfIndex: 0,
      side: 'left',
      scale: 0.58,
      furHex: 0xd5a77f,
      accentHex: 0xf4ecdd,
      animal: 'bear',
      rotationY: 0.18,
    },
    {
      shelfIndex: 1,
      side: 'right',
      scale: 0.56,
      furHex: 0xa5bdd9,
      accentHex: 0xf1e9da,
      animal: 'dog',
      rotationY: -0.24,
    },
  ]);
  const quietShelfB = createStuffyShelf(quietX + 0.7, quietZ - 8.85, 0, [
    {
      shelfIndex: 0,
      side: 'right',
      scale: 0.6,
      furHex: 0xc8a7d7,
      accentHex: 0xf4eadc,
      animal: 'bunny',
      rotationY: 0.12,
    },
    {
      shelfIndex: 1,
      side: 'left',
      scale: 0.54,
      furHex: 0xb8c994,
      accentHex: 0xf2ead8,
      animal: 'cat',
      rotationY: -0.16,
    },
  ]);
  root.add(quietShelfA, quietShelfB);
  addCollider(colliders, quietX - 4.8, quietZ - 5.85, 1.85, 0.34);
  addCollider(colliders, quietX + 0.7, quietZ - 5.85, 1.85, 0.34);

  const hallTubWest = createToyTub(westHallX - 0.88, westHallZ + 1.1, Math.PI / 2, 0xb2c76a, 0.98, 6);
  const hallTubEast = createToyTub(eastHallX + 0.88, eastHallZ + 1.1, -Math.PI / 2, 0xe39d78, 0.98, 6);
  root.add(
    hallTubWest,
    hallTubEast,
    createBlockScatter(midWestHallX + 0.1, midWestHallZ - 0.45),
    createLegoScatter(midEastHallX - 0.2, midEastHallZ + 0.35, 7, 1.3, 0.5),
    createToyCarScatter(westHallX + 0.1, westHallZ - 1.7),
    createBlockScatter(eastHallX - 0.2, eastHallZ - 1.9),
    createBlockScatter(quietX + 4.8, quietZ + 3.8),
    createToyCarScatter(quietX + 5.1, quietZ - 1.6),
    createLegoScatter(quietX - 0.4, quietZ + 3.9, 7, 2.3, 0.8),
    createBlockScatter(upperMainHallX + 0.1, upperMainHallZ - 0.4),
    createToyCarScatter(upperWestHallX + 0.15, upperWestHallZ - 0.6),
    createBlockScatter(upperEastHallX - 0.15, upperEastHallZ + 0.25),
    createLegoScatter(upperMainHallX - 0.55, upperMainHallZ + 0.55, 6, 1.0, 0.42),
    createToyCarScatter(midWestHallX - 0.2, midWestHallZ + 0.55),
  );
  addFloorStuffy(quietX - 4.6, quietZ + 3.9, 0.72, 0xcfa2b9, 0xf0e7d7, 'bear', -0.28);
  addFloorStuffy(upperMainHallX + 0.35, upperMainHallZ - 0.15, 0.74, 0xd5a77f, 0xf4ecdd, 'dog', -0.36, 0.03, -0.1, -0.58);
  addFloorStuffy(midEastHallX + 0.52, midEastHallZ - 0.18, 0.66, 0xd4a785, 0xf5ebdc, 'bear', 0.46, 0.02, 0.12, 0.52);
  addFloorStuffy(midEastHallX + 1.02, midEastHallZ + 0.26, 0.62, 0x9fbad8, 0xf1e8d8, 'cat', -0.22, 0.02, -0.08, -0.4);
  addCollider(colliders, westHallX - 0.88, westHallZ + 1.1, 0.82, 0.68);
  addCollider(colliders, eastHallX + 0.88, eastHallZ + 1.1, 0.82, 0.68);

  const leftRoseTree = createFakeRoseTree(artBounds.minX + 2.35, artBounds.minZ + 2.55, 1.16);
  const rightRoseTree = createFakeRoseTree(artBounds.maxX - 3.05, artBounds.minZ + 2.85, 1.1);
  const centerRoseTree = createFakeRoseTree(artBounds.maxX - 4.8, artBounds.maxZ - 4.4, 1.14);
  const backRoseTree = createFakeRoseTree(artX + 3.2, artZ - 2.35, 1.12);
  const swingSet = createSwingSet(artBounds.minX + 4.2, artZ + 3.2, Math.PI / 2, 1.24);
  const playgroundX = artX - 0.4;
  const playgroundZ = artZ - 4.6;
  const playgroundScale = 1.22;
  const playground = createMiniPlayground(playgroundX, playgroundZ, 0, playgroundScale);
  root.add(leftRoseTree, rightRoseTree, centerRoseTree, backRoseTree, swingSet.root, playground.root);
  seats.push(swingSet.seat);
  rockingAnimators.push(swingSet.animator);
  addCollider(colliders, artBounds.minX + 2.35, artBounds.minZ + 2.55, 1.86, 1.86);
  addCollider(colliders, artBounds.maxX - 3.05, artBounds.minZ + 2.85, 1.8, 1.8);
  addCollider(colliders, artBounds.maxX - 4.8, artBounds.maxZ - 4.4, 1.9, 1.9);
  addCollider(colliders, artX + 3.2, artZ - 2.35, 1.84, 1.84);
  addCollider(colliders, artBounds.minX + 4.2, artZ + 3.2, 2.85, 2.1);
  const playgroundPlatformWidth = 2.9 * playgroundScale;
  const playgroundPlatformDepth = 2.3 * playgroundScale;
  const playgroundSideX = playgroundPlatformWidth * 0.5 - 0.04 * playgroundScale;
  const playgroundBackZ = -playgroundPlatformDepth * 0.5 + 0.06 * playgroundScale;
  const playgroundFrontZ = playgroundPlatformDepth * 0.5 - 0.04 * playgroundScale;
  addCollider(colliders, playgroundX, playgroundZ + playgroundBackZ, playgroundPlatformWidth - 0.16 * playgroundScale, 0.24);
  addCollider(colliders, playgroundX + playgroundSideX, playgroundZ, 0.24, playgroundPlatformDepth - 0.18 * playgroundScale);
  addCollider(colliders, playgroundX - playgroundSideX, playgroundZ - 0.66 * playgroundScale, 0.24, 0.86 * playgroundScale);
  addCollider(colliders, playgroundX - playgroundSideX, playgroundZ + 0.76 * playgroundScale, 0.24, 0.74 * playgroundScale);
  addCollider(colliders, playgroundX - 0.9 * playgroundScale, playgroundZ + playgroundFrontZ, 0.78 * playgroundScale, 0.24);
  addCollider(colliders, playgroundX + 0.9 * playgroundScale, playgroundZ + playgroundFrontZ, 0.78 * playgroundScale, 0.24);
  addCollider(colliders, playgroundX + 0.12, playgroundZ + 3.52, 1.36, 1.92);

  const dodoPuzzle = createDodoPuzzle(artX + 7.1, artZ + 1.85, -Math.PI / 2, CHAPTER_TWO_BLUE_EGG_TOTAL);
  root.add(dodoPuzzle.root);
  const dodoCollider: CollisionBox = {
    centerX: dodoPuzzle.position.x,
    centerZ: dodoPuzzle.position.z,
    halfWidth: 1.1,
    halfDepth: 0.95,
  };
  colliders.push(dodoCollider);

  const eggDefinitions: EggDefinition[] = [
    { id: 0, x: artX + 4.55, y: 0.16, z: artZ + 1.48, rotationY: -0.22 },
    { id: 1, x: playgroundX + 0.18, y: 1.62, z: playgroundZ + 0.34, rotationY: 0.42 },
    { id: 2, x: artBounds.minX + 3.72, y: 1.22, z: artZ + 3.22, rotationY: 0.28 },
    { id: 3, x: checkInX - 6.15, y: 0.16, z: checkInZ + 3.65, rotationY: -0.24 },
    { id: 4, x: cubbiesX + 6.25, y: 0.16, z: cubbiesZ + 3.15, rotationY: 0.18 },
    { id: 5, x: quietX + 5.05, y: 0.16, z: quietZ - 1.55, rotationY: 0.42 },
    { id: 6, x: readingX + 3.95, y: 0.16, z: readingZ - 1.1, rotationY: -0.18 },
    { id: 7, x: lobbyX - 7.05, y: 3.56, z: lobbyZ - 9.35, rotationY: 0.16 },
  ];
  const eggPickups = eggDefinitions.map((definition) => createEggPickup(definition));
  eggPickups.forEach((egg) => root.add(egg.root));

  return {
    root,
    colliders,
    seats,
    eggPickups,
    dodoPuzzle,
    dodoCollider,
    playgroundSlide: playground.slide,
    rockingAnimators,
    trainAnimators,
    swingSeat: swingSet.seat,
    swingSeatAnchor: swingSet.seatAnchor,
    swingLookAnchor: swingSet.lookAnchor,
    swingBasePosition: {
      x: artBounds.minX + 4.2,
      z: artZ + 3.2,
      rotationY: Math.PI / 2,
    },
  };
}

function createPuzzlePieceMesh(
  colorHex: number,
  scale = 1,
  variant = 0,
  style: 'solid' | 'slot' = 'solid',
): Group {
  const root = new Group();
  const profile = ENTRY_PUZZLE_PROFILES[variant % ENTRY_PUZZLE_PROFILES.length];
  const pieceMaterial = new MeshStandardMaterial(
    style === 'slot'
      ? {
          color: 0xc8b9a6,
          roughness: 0.9,
          metalness: 0.02,
          transparent: true,
          opacity: 0.42,
        }
      : {
          color: colorHex,
          emissive: colorHex,
          emissiveIntensity: 0.22,
          roughness: 0.42,
          metalness: 0.1,
        },
  );
  const edgeMaterial = new MeshStandardMaterial(
    style === 'slot'
      ? {
          color: 0xe8decc,
          roughness: 0.78,
          metalness: 0.02,
          transparent: true,
          opacity: 0.56,
        }
      : {
          color: 0xf6efe4,
          roughness: 0.52,
          metalness: 0.04,
        },
  );

  const base = new Mesh(
    new BoxGeometry(0.16 * scale, 0.022 * scale, 0.16 * scale),
    pieceMaterial,
  );
  const makeTab = (x: number, z: number, horizontal: boolean): Mesh => {
    const tab = new Mesh(
      new CylinderGeometry(0.034 * scale, 0.034 * scale, 0.022 * scale, 14),
      pieceMaterial,
    );
    if (horizontal) {
      tab.rotation.x = Math.PI / 2;
    } else {
      tab.rotation.z = Math.PI / 2;
    }
    tab.position.set(x, 0, z);
    return tab;
  };

  const accent = new Mesh(
    new BoxGeometry(profile.accentWidth * scale, 0.024 * scale, 0.026 * scale),
    edgeMaterial,
  );
  accent.position.set(profile.accentX * scale, 0.004 * scale, profile.accentZ * scale);

  if (profile.top === 'tab') {
    root.add(makeTab(0, 0.09 * scale, true));
  }
  if (profile.bottom === 'tab') {
    root.add(makeTab(0, -0.09 * scale, true));
  }
  if (profile.left === 'tab') {
    root.add(makeTab(-0.09 * scale, 0, false));
  }
  if (profile.right === 'tab') {
    root.add(makeTab(0.09 * scale, 0, false));
  }

  root.add(base, accent);
  return root;
}

function createEntryPuzzlePiece(definition: PuzzlePieceDefinition): ChapterTwoPuzzlePiece {
  const [x, z] = getRoomCenter(definition.room, definition.offsetX, definition.offsetZ);
  const root = createPuzzlePieceMesh(KEYCARD_COLORS.red, 1, definition.id);
  root.position.set(x, definition.y, z);
  root.rotation.set(0, definition.rotationY, 0);

  return {
    id: definition.id,
    position: new Vector3(x, definition.y + 0.06, z),
    root,
    collected: false,
    baseY: definition.y,
    baseRotationY: definition.rotationY,
    phase: Math.random() * Math.PI * 2,
  };
}

function createEntryPuzzleBoard(): ChapterTwoPuzzleBoard {
  const root = new Group();
  root.position.copy(ENTRY_PUZZLE_BOARD_POSITION);
  root.rotation.y = Math.PI / 2;

  const tableLegMaterial = new MeshStandardMaterial({
    color: 0xcaa170,
    roughness: 0.78,
    metalness: 0.06,
  });
  const tableTopMaterial = new MeshStandardMaterial({
    color: 0xe3c18f,
    roughness: 0.76,
    metalness: 0.04,
  });
  const trayMaterial = new MeshStandardMaterial({
    color: 0xc59a6e,
    roughness: 0.8,
    metalness: 0.05,
  });
  const panelMaterial = new MeshStandardMaterial({
    color: 0xf0eadc,
    roughness: 0.92,
    metalness: 0.02,
  });
  const guideMaterial = new MeshStandardMaterial({
    color: 0xae3d3d,
    emissive: KEYCARD_COLORS.red,
    emissiveIntensity: 0.08,
    roughness: 0.6,
    metalness: 0.08,
    transparent: true,
    opacity: 0.38,
  });

  const tableTopY = 0.74;
  const tableTop = new Mesh(new BoxGeometry(1.88, 0.12, 1.22), tableTopMaterial);
  tableTop.position.y = tableTopY;
  const legOffsets: Array<[number, number]> = [
    [-0.76, -0.44],
    [0.76, -0.44],
    [-0.76, 0.44],
    [0.76, 0.44],
  ];
  legOffsets.forEach(([x, z]) => {
    const leg = new Mesh(new BoxGeometry(0.1, tableTopY, 0.1), tableLegMaterial);
    leg.position.set(x, tableTopY / 2, z);
    root.add(leg);
  });

  const tray = new Mesh(new BoxGeometry(1.46, 0.08, 1.02), trayMaterial);
  tray.position.y = tableTopY + 0.05;
  const panel = new Mesh(new BoxGeometry(1.3, 0.03, 0.86), panelMaterial);
  panel.position.y = tableTopY + 0.09;
  const cardGuide = new Mesh(new BoxGeometry(1.14, 0.016, 0.82), guideMaterial);
  cardGuide.position.y = tableTopY + 0.108;

  const assemblyRoot = new Group();
  assemblyRoot.position.set(0, tableTopY + 0.108, 0);

  const slotPieces: Group[] = [];
  ENTRY_PUZZLE_PROFILES.forEach((profile, index) => {
    const slotPiece = createPuzzlePieceMesh(0xb29a84, 1.22, index, 'slot');
    slotPiece.position.set(profile.slotX, 0.008, profile.slotZ);
    slotPieces.push(slotPiece);
    assemblyRoot.add(slotPiece);
  });

  const assembledPieces: Group[] = [];
  ENTRY_PUZZLE_PROFILES.forEach((profile, index) => {
    const piece = createPuzzlePieceMesh(KEYCARD_COLORS.red, 1.22, index);
    piece.position.set(profile.slotX, 0.014, profile.slotZ);
    piece.rotation.set(profile.loosePitch, profile.looseYaw, (index % 2 === 0 ? -0.04 : 0.04));
    piece.visible = false;
    assembledPieces.push(piece);
    assemblyRoot.add(piece);
  });

  const rewardCard = new Group();
  rewardCard.visible = false;
  rewardCard.position.set(0, tableTopY + 0.13, 0);

  const rewardBody = new Mesh(
    new BoxGeometry(0.52, 0.035, 0.78),
    new MeshStandardMaterial({
      color: KEYCARD_COLORS.red,
      emissive: KEYCARD_COLORS.red,
      emissiveIntensity: 0.58,
      roughness: 0.34,
      metalness: 0.16,
    }),
  );
  const rewardStripe = new Mesh(
    new BoxGeometry(0.18, 0.042, 0.18),
    new MeshStandardMaterial({
      color: 0xf5f0e4,
      roughness: 0.5,
      metalness: 0.04,
    }),
  );
  rewardStripe.position.set(0.12, 0.006, -0.18);
  rewardCard.add(rewardBody, rewardStripe);
  rewardCard.scale.setScalar(0.35);

  root.add(tableTop, tray, panel, cardGuide, assemblyRoot, rewardCard);

  return {
    position: ENTRY_PUZZLE_BOARD_POSITION.clone(),
    interactPosition: new Vector3(
      ENTRY_PUZZLE_BOARD_POSITION.x + 1.35,
      1.04,
      ENTRY_PUZZLE_BOARD_POSITION.z,
    ),
    root,
    assemblyRoot,
    assembledPieces,
    slotPieces,
    rewardCard,
    solved: false,
    solveProgress: 0,
  };
}

function createKeycardPickup(definition: KeycardDefinition): ChapterTwoKeycardPickup {
  const [x, z] = getRoomCenter(definition.room, definition.offsetX ?? 0, definition.offsetZ ?? 0);
  const colorHex = KEYCARD_COLORS[definition.color];
  const root = new Group();
  const baseY = 0.18;
  const startsHidden = definition.startsHidden ?? false;

  root.position.set(x, baseY, z);
  root.visible = !startsHidden;

  const stand = new Mesh(
    new CylinderGeometry(0.42, 0.5, 0.16, 18),
    new MeshStandardMaterial({
      color: 0xb8bec6,
      roughness: 0.74,
      metalness: 0.18,
    }),
  );
  stand.position.y = 0.08;

  const card = new Mesh(
    new BoxGeometry(0.54, 0.04, 0.82),
    new MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.42,
      roughness: 0.34,
      metalness: 0.16,
    }),
  );
  card.position.y = 0.72;
  card.rotation.x = -0.12;

  const stripe = new Mesh(
    new BoxGeometry(0.18, 0.05, 0.2),
    new MeshStandardMaterial({
      color: 0xf5f3ea,
      roughness: 0.56,
      metalness: 0.04,
    }),
  );
  stripe.position.set(0.12, 0.75, -0.18);
  stripe.rotation.x = -0.12;

  root.add(stand, card, stripe);

  return {
    color: definition.color,
    label: CHAPTER_TWO_KEYCARD_LABELS[definition.color],
    position: new Vector3(x, 0.92, z),
    root,
    collected: false,
    startsHidden,
    baseY,
    phase: Math.random() * Math.PI * 2,
  };
}

function createSecurityDoor(definition: DoorDefinition): ChapterTwoSecurityDoor {
  const [x, z] = cellToWorld(
    definition.row,
    definition.column,
    definition.offsetX ?? 0,
    definition.offsetZ ?? 0,
  );
  const colorHex = KEYCARD_COLORS[definition.color];
  const root = new Group();
  root.position.set(x, 0, z);

  const frameMaterial = new MeshStandardMaterial({
    color: 0xb9c1ca,
    roughness: 0.48,
    metalness: 0.62,
  });
  const slabMaterial = new MeshStandardMaterial({
    color: 0x2b313a,
    emissive: colorHex,
    emissiveIntensity: 0.18,
    roughness: 0.42,
    metalness: 0.22,
  });
  const readerMaterial = new MeshStandardMaterial({
    color: 0x1a2027,
    emissive: colorHex,
    emissiveIntensity: 0.96,
    roughness: 0.38,
    metalness: 0.16,
  });

  const longX = definition.orientation === 'northSouth';
  const slab = new Mesh(
    new BoxGeometry(longX ? CELL_SIZE + 0.22 : 0.38, 3.3, longX ? 0.34 : CELL_SIZE + 0.22),
    slabMaterial,
  );

  const closedY = 1.65;
  const openY = 6.9;
  slab.position.y = closedY;

  const leftPost = new Mesh(
    new BoxGeometry(longX ? 0.26 : 0.34, 3.7, longX ? 0.34 : 0.26),
    frameMaterial,
  );
  const rightPost = leftPost.clone();
  const lintel = new Mesh(
    new BoxGeometry(longX ? CELL_SIZE + 0.7 : 0.44, 0.3, longX ? 0.44 : CELL_SIZE + 0.7),
    frameMaterial,
  );

  if (longX) {
    leftPost.position.set(-(CELL_SIZE / 2 + 0.24), 1.85, 0);
    rightPost.position.set(CELL_SIZE / 2 + 0.24, 1.85, 0);
  } else {
    leftPost.position.set(0, 1.85, -(CELL_SIZE / 2 + 0.24));
    rightPost.position.set(0, 1.85, CELL_SIZE / 2 + 0.24);
  }
  lintel.position.set(0, 3.56, 0);

  const reader = new Mesh(
    new BoxGeometry(longX ? 0.22 : 0.6, 0.78, longX ? 0.6 : 0.22),
    readerMaterial,
  );
  const slot = new Mesh(
    new BoxGeometry(longX ? 0.1 : 0.3, 0.08, longX ? 0.32 : 0.1),
    new MeshStandardMaterial({
      color: 0xf2f0e8,
      roughness: 0.24,
      metalness: 0.04,
    }),
  );

  if (longX) {
    reader.position.set(definition.readerSide * (CELL_SIZE / 2 + 0.48), 1.15, 0);
    slot.position.set(definition.readerSide * (CELL_SIZE / 2 + 0.44), 1.24, 0);
  } else {
    reader.position.set(0, 1.15, definition.readerSide * (CELL_SIZE / 2 + 0.48));
    slot.position.set(0, 1.24, definition.readerSide * (CELL_SIZE / 2 + 0.44));
  }

  root.add(leftPost, rightPost, lintel, slab, reader, slot);

  const interactPosition = longX
    ? new Vector3(x + definition.readerSide * 1.2, 1.1, z)
    : new Vector3(x, 1.1, z + definition.readerSide * 1.2);

  return {
    id: definition.id,
    color: definition.color,
    label: `${CHAPTER_TWO_KEYCARD_LABELS[definition.color]} Door`,
    position: new Vector3(x, 1.1, z),
    interactPosition,
    root,
    collider: {
      centerX: x,
      centerZ: z,
      halfWidth: longX ? (CELL_SIZE + 0.22) / 2 : 0.2,
      halfDepth: longX ? 0.2 : (CELL_SIZE + 0.22) / 2,
      enabled: true,
    },
    slab,
    slabMaterial,
    readerMaterial,
    open: false,
    openAmount: 0,
    targetOpenAmount: 0,
    closedY,
    openY,
  };
}

function createChapterTwoUtilityCloset(
  x: number,
  z: number,
  rotationY: number,
): ChapterTwoUtilityCloset {
  const root = new Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotationY;

  const frameMaterial = new MeshStandardMaterial({
    color: 0xb8c1ca,
    roughness: 0.42,
    metalness: 0.38,
  });
  const doorMaterial = new MeshStandardMaterial({
    color: 0x96a2ad,
    emissive: 0x44505a,
    emissiveIntensity: 0.12,
    roughness: 0.36,
    metalness: 0.3,
  });
  const interiorMaterial = new MeshStandardMaterial({
    color: 0x232a31,
    roughness: 0.72,
    metalness: 0.08,
  });
  const boxMaterial = new MeshStandardMaterial({
    color: 0xcfd5db,
    roughness: 0.3,
    metalness: 0.32,
  });
  const breakerMaterial = new MeshStandardMaterial({
    color: 0x8e99a3,
    roughness: 0.5,
    metalness: 0.18,
  });

  const recessBack = new Mesh(new BoxGeometry(2.46, 3.48, 0.1), interiorMaterial);
  recessBack.position.set(0, 1.74, -0.18);
  const recessShell = new Mesh(new CylinderGeometry(1.12, 1.12, 0.22, 30), interiorMaterial);
  recessShell.rotation.x = Math.PI / 2;
  recessShell.position.set(0, 1.72, 0.04);
  const outerRing = new Mesh(new TorusGeometry(1.18, 0.12, 16, 36), frameMaterial);
  outerRing.position.set(0, 1.72, 0.18);
  const innerRing = new Mesh(new TorusGeometry(0.98, 0.06, 14, 34), boxMaterial);
  innerRing.position.set(0, 1.72, 0.22);
  const ringBraceTop = new Mesh(new BoxGeometry(0.22, 0.64, 0.12), frameMaterial);
  ringBraceTop.position.set(0, 2.88, 0.18);
  const ringBraceBottom = new Mesh(new BoxGeometry(0.22, 0.64, 0.12), frameMaterial);
  ringBraceBottom.position.set(0, 0.56, 0.18);
  const ringBraceLeft = new Mesh(new BoxGeometry(0.64, 0.22, 0.12), frameMaterial);
  ringBraceLeft.position.set(-1.16, 1.72, 0.18);
  const ringBraceRight = new Mesh(new BoxGeometry(0.64, 0.22, 0.12), frameMaterial);
  ringBraceRight.position.set(1.16, 1.72, 0.18);

  const powerBoxBack = new Mesh(new BoxGeometry(1.18, 1.56, 0.08), frameMaterial);
  powerBoxBack.position.set(0.04, 1.74, 0.03);
  const powerBoxBody = new Mesh(new BoxGeometry(1.02, 1.34, 0.18), boxMaterial);
  powerBoxBody.position.set(0.04, 1.74, 0.13);
  const breakerColumn = new Mesh(new BoxGeometry(0.12, 0.98, 0.08), breakerMaterial);
  breakerColumn.position.set(-0.24, 1.76, 0.22);
  const breakerTop = new Mesh(new BoxGeometry(0.22, 0.14, 0.08), breakerMaterial);
  breakerTop.position.set(0.28, 1.42, 0.22);
  const breakerMid = breakerTop.clone();
  breakerMid.position.set(0.28, 1.76, 0.22);
  const breakerLow = breakerTop.clone();
  breakerLow.position.set(0.28, 2.08, 0.22);

  const powerDrawer = new Group();
  powerDrawer.position.set(-0.52, 1.74, 0.34);
  const drawerPanel = new Mesh(new BoxGeometry(0.94, 1.16, 0.06), doorMaterial);
  drawerPanel.position.set(0.47, 0, 0);
  const drawerHandle = new Mesh(new BoxGeometry(0.46, 0.08, 0.08), frameMaterial);
  drawerHandle.position.set(0.74, 0, 0.06);
  powerDrawer.add(drawerPanel, drawerHandle);

  const tornWireRoot = new Group();
  tornWireRoot.visible = false;
  const tornRedWireMaterial = new MeshStandardMaterial({
    color: 0xd44949,
    emissive: 0xd44949,
    emissiveIntensity: 0.22,
    roughness: 0.5,
    metalness: 0.02,
  });
  const tornBlueWireMaterial = new MeshStandardMaterial({
    color: 0x4b86e6,
    emissive: 0x4b86e6,
    emissiveIntensity: 0.22,
    roughness: 0.5,
    metalness: 0.02,
  });
  const tornBlackWireMaterial = new MeshStandardMaterial({
    color: 0x15181c,
    roughness: 0.62,
    metalness: 0.02,
  });
  const tornWireSegments: Array<[Vector3, Vector3, MeshStandardMaterial]> = [
    [new Vector3(-0.3, 1.38, 0.34), new Vector3(-0.52, 1.18, 0.52), tornRedWireMaterial],
    [new Vector3(0.08, 1.98, 0.34), new Vector3(-0.06, 1.64, 0.54), tornBlueWireMaterial],
    [new Vector3(0.28, 1.52, 0.34), new Vector3(0.44, 1.22, 0.52), tornBlackWireMaterial],
    [new Vector3(-0.18, 0.09, 0.72), new Vector3(-0.92, 0.07, 1.22), tornRedWireMaterial],
    [new Vector3(-0.92, 0.07, 1.22), new Vector3(-0.42, 0.06, 1.74), tornRedWireMaterial],
    [new Vector3(0.06, 0.08, 0.66), new Vector3(0.66, 0.06, 1.18), tornBlueWireMaterial],
    [new Vector3(0.66, 0.06, 1.18), new Vector3(0.12, 0.05, 1.86), tornBlueWireMaterial],
    [new Vector3(0.3, 0.08, 0.76), new Vector3(0.94, 0.06, 1.58), tornBlackWireMaterial],
    [new Vector3(-0.08, 0.07, 0.92), new Vector3(0.36, 0.06, 1.38), tornBlackWireMaterial],
  ];
  tornWireSegments.forEach(([start, end, material]) => {
    tornWireRoot.add(createWireSegment(start, end, material));
  });
  const sparkLight = new PointLight(0x8fc6ff, 0, 4.8, 2.2);
  sparkLight.position.set(0.02, 1.58, 0.56);

  [
    { color: 0xd44949, x: -0.1, y: 1.26, rotation: 0.38, length: 0.72 },
    { color: 0x4b86e6, x: 0.16, y: 1.92, rotation: -0.28, length: 0.84 },
    { color: 0xd44949, x: 0.2, y: 1.46, rotation: -0.56, length: 0.54 },
    { color: 0x4b86e6, x: -0.12, y: 2.16, rotation: 0.24, length: 0.46 },
  ].forEach((wire) => {
    const wireMaterial = new MeshStandardMaterial({
      color: wire.color,
      emissive: wire.color,
      emissiveIntensity: 0.12,
      roughness: 0.54,
      metalness: 0.02,
    });
    const wireMesh = new Mesh(new CylinderGeometry(0.022, 0.022, wire.length, 12), wireMaterial);
    wireMesh.position.set(wire.x, wire.y, 0.24);
    wireMesh.rotation.z = wire.rotation;
    root.add(wireMesh);
  });

  const doorPivot = new Group();
  doorPivot.position.set(-1.12, 1.72, 0.22);
  const roundDoor = new Mesh(new CylinderGeometry(1.08, 1.08, 0.08, 32), doorMaterial);
  roundDoor.rotation.x = Math.PI / 2;
  roundDoor.position.set(1.12, 0, 0);
  const roundDoorInset = new Mesh(new CylinderGeometry(0.86, 0.86, 0.03, 28), boxMaterial);
  roundDoorInset.rotation.x = Math.PI / 2;
  roundDoorInset.position.set(1.12, 0, 0.055);
  const centerHub = new Mesh(new CylinderGeometry(0.13, 0.13, 0.1, 18), frameMaterial);
  centerHub.rotation.x = Math.PI / 2;
  centerHub.position.set(1.12, 0, 0.08);
  const wheelBarA = new Mesh(new BoxGeometry(0.54, 0.06, 0.06), frameMaterial);
  wheelBarA.position.set(1.12, 0, 0.11);
  const wheelBarB = new Mesh(new BoxGeometry(0.06, 0.54, 0.06), frameMaterial);
  wheelBarB.position.set(1.12, 0, 0.11);
  doorPivot.add(roundDoor, roundDoorInset, centerHub, wheelBarA, wheelBarB);

  root.add(
    recessBack,
    recessShell,
    outerRing,
    innerRing,
    ringBraceTop,
    ringBraceBottom,
    ringBraceLeft,
    ringBraceRight,
    powerBoxBack,
    powerBoxBody,
    breakerColumn,
    breakerTop,
    breakerMid,
    breakerLow,
    tornWireRoot,
    sparkLight,
    powerDrawer,
    doorPivot,
  );

  return {
    label: 'Right Hall Round Closet',
    position: offsetPosition(x, z, rotationY, 0, 1.06).setY(1.72),
    interactPosition: offsetPosition(x, z, rotationY, 0, 1.32).setY(1.14),
    root,
    doorPivot,
    powerDrawer,
    tornWireRoot,
    sparkLight,
    open: false,
    openAmount: 0,
    targetOpenAmount: 0,
  };
}

function createAftermathGuideLight(): ChapterTwoGuideLight {
  const root = new Group();
  root.visible = false;

  const orbMaterial = new MeshStandardMaterial({
    color: 0xf7fbff,
    emissive: 0xffffff,
    emissiveIntensity: 3.8,
    roughness: 0.2,
    metalness: 0,
  });
  const haloMaterial = new MeshStandardMaterial({
    color: 0xe7f3ff,
    emissive: 0xf8fbff,
    emissiveIntensity: 2.2,
    roughness: 0.35,
    metalness: 0,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });

  const orb = new Mesh(new SphereGeometry(0.18, 16, 16), orbMaterial);
  const halo = new Mesh(new SphereGeometry(0.38, 16, 16), haloMaterial);
  halo.scale.set(1.12, 0.82, 1.12);
  const light = new PointLight(0xf8fbff, 2.4, 11, 2.1);

  root.add(orb, halo, light);
  return { root, orb, halo, light };
}

export function createChapterTwoLevel(): ChapterTwoLevelData {
  const materials = createMaterials();
  const root = new Group();
  const colliders: CollisionBox[] = [];

  const floorDefinition: FloorDefinition = {
    width: DAYCARE_WIDTH * CELL_SIZE,
    depth: DAYCARE_HEIGHT * CELL_SIZE,
    center: [DAYCARE_CENTER_X, DAYCARE_CENTER_Z],
    ceilingHeight: WALL_HEIGHT,
  };

  root.add(createFloor(floorDefinition, materials));

  const walls = createWalls(buildWalls(), materials);
  root.add(walls.root);
  colliders.push(...walls.colliders);

  root.add(createDodoRoomStyling());

  const entryFurniture = createEntryFurniture();
  root.add(entryFurniture.root);
  colliders.push(...entryFurniture.colliders);

  const redWingFurniture = createRedWingFurniture();
  root.add(redWingFurniture.root);
  colliders.push(...redWingFurniture.colliders);

  const ambientRoomFurniture = createAmbientRoomFurniture();
  root.add(ambientRoomFurniture.root);
  colliders.push(...ambientRoomFurniture.colliders);

  const ambientPlantDecor = createAmbientPlantDecor();
  root.add(ambientPlantDecor.root);
  colliders.push(...ambientPlantDecor.colliders);

  const aftermathGuide = createAftermathGuideLight();
  root.add(aftermathGuide.root);

  const puzzleRoot = new Group();
  const puzzlePieces = ENTRY_PUZZLE_PIECES.map((definition) => createEntryPuzzlePiece(definition));
  puzzlePieces.forEach((piece) => puzzleRoot.add(piece.root));

  const puzzleBoard = createEntryPuzzleBoard();
  puzzleRoot.add(puzzleBoard.root);
  colliders.push({
    centerX: ENTRY_PUZZLE_BOARD_POSITION.x,
    centerZ: ENTRY_PUZZLE_BOARD_POSITION.z,
    halfWidth: 0.62,
    halfDepth: 0.94,
  });

  const keycardRoot = new Group();
  const keycards = KEYCARD_DEFINITIONS.map((definition) => createKeycardPickup(definition));
  keycards.forEach((keycard) => keycardRoot.add(keycard.root));
  const blueKeycard = keycards.find((keycard) => keycard.color === 'blue') ?? null;

  const [checkInX, checkInZ] = getRoomCenter(CHECK_IN_ROOM);
  const [cubbiesX, cubbiesZ] = getRoomCenter(CUBBY_ROOM);
  const [readingX, readingZ] = getRoomCenter(READING_ROOM);
  const [quietX, quietZ] = getRoomCenter(QUIET_NOOK);
  const [blockX, blockZ] = getRoomCenter(BLOCK_ROOM);
  const blueBearRoot = new Group();
  const blueBearDefinitions: BlueBearDefinition[] = [
    { id: 0, x: checkInX - 3.08, y: 1.37, z: checkInZ - 8.72, rotationY: 0.18, scale: 0.64 },
    { id: 1, x: checkInX + 5.1, y: 0.02, z: checkInZ + 2.95, rotationY: -0.36, tiltZ: 0.08, scale: 0.76 },
    { id: 2, x: cubbiesX - 1.45, y: 0.02, z: cubbiesZ + 4.15, rotationY: 0.22, tiltZ: -0.06, scale: 0.74 },
    { id: 3, x: cubbiesX + 8.05, y: 0.98, z: cubbiesZ - 4.98, rotationY: -0.18, scale: 0.62 },
    { id: 4, x: lobbyCenterX - 8.65, y: 0.02, z: lobbyCenterZ + 5.45, rotationY: 0.34, tiltZ: 0.06, scale: 0.7 },
    { id: 5, x: readingX + 5.35, y: 0.02, z: readingZ - 1.85, rotationY: -0.28, tiltZ: -0.08, scale: 0.74 },
    { id: 6, x: quietX - 4.1, y: 1.37, z: quietZ - 8.62, rotationY: 0.12, scale: 0.62 },
    { id: 7, x: blockX + 3.8, y: 0.02, z: blockZ + 2.95, rotationY: 0.42, tiltZ: 0.12, scale: 0.72 },
  ];
  const blueBearPickups = blueBearDefinitions.map((definition) => createBlueBearPickup(definition));
  blueBearPickups.forEach((bear) => blueBearRoot.add(bear.root));

  const doorRoot = new Group();
  const securityDoors = DOOR_DEFINITIONS.map((definition) => createSecurityDoor(definition));
  securityDoors.forEach((door) => {
    doorRoot.add(door.root);
    colliders.push(door.collider);
  });
  const [utilityClosetCellX, utilityClosetCellZ] = cellToWorld(30, 24);
  const utilityClosetRotationY = Math.PI;
  const chapterTwoUtilityCloset = createChapterTwoUtilityCloset(
    utilityClosetCellX,
    utilityClosetCellZ + HALF_CELL - 0.18,
    utilityClosetRotationY,
  );
  root.add(chapterTwoUtilityCloset.root);

  const dodoOriginalRootPosition = redWingFurniture.dodoPuzzle.root.position.clone();
  const dodoOriginalPosition = redWingFurniture.dodoPuzzle.position.clone();
  const dodoOriginalInteractPosition = redWingFurniture.dodoPuzzle.interactPosition.clone();
  const dodoOriginalRotationY = redWingFurniture.dodoPuzzle.root.rotation.y;
  const dodoNightDirection = new Vector3();
  const dodoNightExitPosition = new Vector3();
  const dodoNightAttackPosition = new Vector3();
  const dodoClosetRotationY = 0;
  const dodoClosetRootPosition = new Vector3(
    utilityClosetCellX,
    0,
    utilityClosetCellZ + HALF_CELL - 1.28,
  );
  const dodoClosetPosition = dodoClosetRootPosition.clone().setY(dodoOriginalPosition.y);
  const dodoClosetInteractPosition = offsetPosition(
    dodoClosetRootPosition.x,
    dodoClosetRootPosition.z,
    dodoClosetRotationY,
    0,
    -1.35,
  ).setY(1.08);
  const syncDodoCollider = (): void => {
    redWingFurniture.dodoCollider.centerX = redWingFurniture.dodoPuzzle.position.x;
    redWingFurniture.dodoCollider.centerZ = redWingFurniture.dodoPuzzle.position.z;
  };

  const dodoTrailRoot = new Group();
  dodoTrailRoot.visible = false;
  const dodoTrailWaypoints = [
    new Vector3(
      redWingFurniture.dodoPuzzle.root.position.x - 0.1,
      0.02,
      redWingFurniture.dodoPuzzle.root.position.z + 1.9,
    ),
  ];
  const dodoTrailCells = findDaycarePath(
    findNearestWalkableDaycareCell(
      redWingFurniture.dodoPuzzle.root.position.x,
      redWingFurniture.dodoPuzzle.root.position.z + 1.9,
    ),
    findNearestWalkableDaycareCell(dodoClosetRootPosition.x, dodoClosetRootPosition.z),
  );
  dodoTrailCells.forEach((cell) => {
    const [x, z] = cellToWorld(cell.row, cell.column);
    const previous = dodoTrailWaypoints[dodoTrailWaypoints.length - 1];
    if (!previous || previous.distanceToSquared(new Vector3(x, 0.02, z)) > 0.35) {
      dodoTrailWaypoints.push(new Vector3(x, 0.02, z));
    }
  });
  dodoTrailWaypoints.push(new Vector3(dodoClosetRootPosition.x, 0.02, dodoClosetRootPosition.z + 0.22));

  let footprintIndex = 0;
  const trailForward = new Vector3();
  const trailRight = new Vector3();
  const trailPoint = new Vector3();
  for (let index = 0; index < dodoTrailWaypoints.length - 1; index += 1) {
    const start = dodoTrailWaypoints[index];
    const end = dodoTrailWaypoints[index + 1];
    trailForward.set(end.x - start.x, 0, end.z - start.z);
    const segmentLength = trailForward.length();
    if (segmentLength < 0.2) {
      continue;
    }

    trailForward.normalize();
    trailRight.set(trailForward.z, 0, -trailForward.x);

    for (let distance = index === 0 ? 0.38 : 0.66; distance < segmentLength; distance += 0.88) {
      trailPoint.copy(start).addScaledVector(trailForward, distance);
      trailPoint.addScaledVector(trailRight, footprintIndex % 2 === 0 ? -0.2 : 0.2);
      const footprint = createBirdFootprint(footprintIndex % 2 === 0 ? 'left' : 'right');
      footprint.position.set(trailPoint.x, 0.02, trailPoint.z);
      footprint.rotation.y = Math.atan2(trailForward.x, trailForward.z);
      dodoTrailRoot.add(footprint);
      footprintIndex += 1;
    }
  }

  root.add(dodoTrailRoot);

  const lobbyNorthDoor = securityDoors.find((door) => door.id === 'lobby-north') ?? null;
  const middleMainDoor = securityDoors.find((door) => door.id === 'middle-main') ?? null;
  const lobbyAftermathBear = (() => {
    if (!lobbyNorthDoor) {
      return null;
    }

    const bearX = lobbyCenterX - 4.1;
    const bearZ = lobbyCenterZ - 7.1;
    return createRedDoorPeekFigure(
      bearX,
      bearZ,
      Math.atan2(
        lobbyNorthDoor.position.x - bearX,
        lobbyNorthDoor.position.z - bearZ,
      ) + 0.08,
    );
  })();
  const redDoorPeek = (() => {
    if (!lobbyNorthDoor || !middleMainDoor) {
      return null;
    }

    const peekX = middleMainDoor.position.x;
    const peekZ = middleMainDoor.position.z + CELL_SIZE * 0.72;
    return createRedDoorPeekFigure(
      peekX,
      peekZ,
      Math.atan2(
        lobbyNorthDoor.position.x - peekX,
        lobbyNorthDoor.position.z - peekZ,
      ) + 0.12,
    );
  })();
  if (redDoorPeek) {
    root.add(redDoorPeek.root);
  }
  if (lobbyAftermathBear) {
    root.add(lobbyAftermathBear.root);
  }

  const redDoorPeekChargePath = redDoorPeek && lobbyNorthDoor && middleMainDoor
    ? [
        redDoorPeek.homePosition.clone(),
        new Vector3(
          middleMainDoor.position.x,
          0,
          MathUtils.lerp(middleMainDoor.position.z, lobbyNorthDoor.position.z, 0.45),
        ),
        new Vector3(
          lobbyNorthDoor.position.x,
          0,
          lobbyNorthDoor.position.z + CELL_SIZE * 0.85,
        ),
      ]
    : [];
  let redDoorPeekChargeIndex = 0;
  const redDoorPeekLiveTarget = new Vector3();
  const lobbyAftermathChargeDirection = new Vector3();
  const lobbyAftermathChargeTarget = new Vector3();
  let lobbyAftermathBearRefusalProgress = 0;
  const lobbyGuideTarget = new Vector3(
    entryFurniture.lobbyTankCrashedRoot.position.x + 0.84,
    1.78,
    entryFurniture.lobbyTankCrashedRoot.position.z + 1.92,
  );
  const guidePathCells = findDaycarePath(
    findNearestWalkableDaycareCell(
      redWingFurniture.dodoPuzzle.position.x - 1.6,
      redWingFurniture.dodoPuzzle.position.z,
    ),
    findNearestWalkableDaycareCell(lobbyGuideTarget.x, lobbyGuideTarget.z),
  );
  const guideWaypoints: Vector3[] = [];
  const pushGuideWaypoint = (x: number, z: number): void => {
    const point = new Vector3(x, 1.78, z);
    const previous = guideWaypoints[guideWaypoints.length - 1];
    if (!previous || previous.distanceToSquared(point) > 0.36) {
      guideWaypoints.push(point);
    }
  };
  pushGuideWaypoint(
    redWingFurniture.dodoPuzzle.position.x - 1.18,
    redWingFurniture.dodoPuzzle.position.z + 0.18,
  );
  guidePathCells.forEach((cell) => {
    const [x, z] = cellToWorld(cell.row, cell.column);
    pushGuideWaypoint(x, z);
  });
  pushGuideWaypoint(lobbyGuideTarget.x, lobbyGuideTarget.z);
  let guideActive = false;
  let guideTargetIndex = guideWaypoints.length > 1 ? 1 : 0;
  const guideTravel = new Vector3();
  const guideFollowDistance = 5.6;
  const guideArrivalDistance = 0.34;

  root.add(puzzleRoot, keycardRoot, blueBearRoot, doorRoot);

  let elapsed = 0;
  let occupiedSeatId: string | null = null;
  let swingInput = 0;
  let lobbyAftermathActive = false;
  let dodoPowerRipActive = false;
  let dodoPowerRipElapsed = 0;
  let dodoPowerRipDone = false;

  const setEntryPuzzleState = (collectedCount: number, solved: boolean): void => {
    puzzleBoard.solved = solved;
    if (!solved) {
      puzzleBoard.solveProgress = 0;
      puzzleBoard.rewardCard.visible = false;
      puzzleBoard.rewardCard.scale.setScalar(0.35);
      puzzleBoard.rewardCard.rotation.set(0, 0, 0);
      puzzleBoard.assemblyRoot.rotation.set(0, 0, 0);
    }

    puzzleBoard.assembledPieces.forEach((piece, index) => {
      piece.visible = index < collectedCount;
    });
  };

  const setDodoPuzzleState = (depositedCount: number, solved: boolean): void => {
    lobbyAftermathBearRefusalProgress = 0;
    redWingFurniture.dodoPuzzle.depositedEggs = depositedCount;
    redWingFurniture.dodoPuzzle.solved = solved;
    redWingFurniture.dodoPuzzle.mouthEggs.forEach((egg, index) => {
      egg.visible = index < depositedCount;
    });
    lobbyAftermathActive = solved;
    entryFurniture.lobbyTankRoot.visible = !solved;
    entryFurniture.lobbyTankCrashedRoot.visible = solved;
    entryFurniture.aquariumAnimators.forEach((animator) => {
      animator.active = !solved;
    });

    if (blueKeycard && !blueKeycard.collected) {
      blueKeycard.root.visible = solved;
    }

    if (redDoorPeek) {
      redDoorPeek.active = false;
      redDoorPeek.phase = 'watching';
      redDoorPeek.exhausted = solved;
      redDoorPeekChargeIndex = 0;
      redDoorPeek.visibility = 0;
      redDoorPeek.stareRemaining = RED_DOOR_PEEK_STARE_TIME;
      redDoorPeek.vanishRemaining = 0;
      redDoorPeek.root.visible = false;
      redDoorPeek.root.position.copy(redDoorPeek.homePosition);
      redDoorPeek.root.rotation.y = redDoorPeek.homeRotationY;
      redDoorPeek.rig.visible = true;
      redDoorPeek.rig.position.set(0.08, 0, 0.04);
      redDoorPeek.rig.rotation.set(0, 0, 0);
      redDoorPeek.head.rotation.set(0.08, 0.02, -0.18);
      redDoorPeek.torso.rotation.set(0.28, 0.01, -0.16);
      redDoorPeek.leftArmPivot.rotation.set(0, 0, 0);
      redDoorPeek.rightArmPivot.rotation.set(0, 0, 0);
      redDoorPeek.leftLegPivot.rotation.set(0, 0, 0);
      redDoorPeek.rightLegPivot.rotation.set(0, 0, 0);
      redDoorPeek.revealLight.intensity = 11.2;
      redDoorPeek.lipGlow.intensity = 6.2;
      redDoorPeek.smokeRoot.visible = false;
      redDoorPeek.smokePuffs.forEach((puff) => {
        puff.mesh.position.copy(puff.startPosition);
        puff.mesh.scale.setScalar(puff.baseScale);
        puff.material.opacity = 0;
      });
    }

    if (lobbyAftermathBear) {
      lobbyAftermathBear.root.visible = solved;
      lobbyAftermathBear.rig.visible = solved;
      lobbyAftermathBear.smokeRoot.visible = false;
      lobbyAftermathBear.active = false;
      lobbyAftermathBear.phase = 'watching';
      lobbyAftermathBear.root.position.copy(lobbyAftermathBear.homePosition);
      lobbyAftermathBear.root.rotation.y = lobbyAftermathBear.homeRotationY;
      lobbyAftermathBear.revealLight.intensity = solved ? 12.6 : 11.2;
      lobbyAftermathBear.lipGlow.intensity = solved ? 7.2 : 6.2;
    }

    guideActive = solved;
    guideTargetIndex = guideWaypoints.length > 1 ? 1 : 0;
    aftermathGuide.root.visible = solved;
    aftermathGuide.root.position.copy(guideWaypoints[0] ?? lobbyGuideTarget);
    aftermathGuide.root.position.y = 1.78;
    aftermathGuide.orb.scale.setScalar(1);
    aftermathGuide.halo.scale.set(1.12, 0.82, 1.12);
    aftermathGuide.light.intensity = solved ? 3.4 : 0;
  };

  const setDodoTrailState = (active: boolean): void => {
    dodoTrailRoot.visible = active;
    if (active) {
      redWingFurniture.dodoPuzzle.root.position.copy(dodoClosetRootPosition);
      redWingFurniture.dodoPuzzle.root.rotation.y = dodoClosetRotationY;
      redWingFurniture.dodoPuzzle.position.copy(dodoClosetPosition);
      redWingFurniture.dodoPuzzle.interactPosition.copy(dodoClosetInteractPosition);
      syncDodoCollider();
      return;
    }

    redWingFurniture.dodoPuzzle.root.position.copy(dodoOriginalRootPosition);
    redWingFurniture.dodoPuzzle.root.rotation.y = dodoOriginalRotationY;
    redWingFurniture.dodoPuzzle.position.copy(dodoOriginalPosition);
    redWingFurniture.dodoPuzzle.interactPosition.copy(dodoOriginalInteractPosition);
    syncDodoCollider();
  };

  const setDodoIdlePose = (): void => {
    const dodo = redWingFurniture.dodoPuzzle;
    dodo.root.rotation.x = 0;
    dodo.root.rotation.z = 0;
    dodo.leftWing.position.set(-0.6, 0.94, 0.02);
    dodo.leftWing.rotation.set(0, 0, -0.76);
    dodo.rightWing.position.set(0.62, 0.9, 0.02);
    dodo.rightWing.rotation.set(0, 0, 0.76);
    dodo.headPivot.position.set(0.66, 2.5, 0.29);
    dodo.headPivot.rotation.set(0, 0, -0.2);
  };

  const setDodoNightAttackState = (progress: number, playerPosition: Vector3): void => {
    const dodo = redWingFurniture.dodoPuzzle;
    const clampedProgress = MathUtils.clamp(progress, 0, 1);

    dodoTrailRoot.visible = false;
    dodo.root.visible = true;
    dodoNightDirection.set(
      playerPosition.x - dodoOriginalRootPosition.x,
      0,
      playerPosition.z - dodoOriginalRootPosition.z,
    );
    if (dodoNightDirection.lengthSq() < 0.0001) {
      dodoNightDirection.set(0, 0, 1);
    } else {
      dodoNightDirection.normalize();
    }

    dodoNightExitPosition.copy(dodoOriginalRootPosition).addScaledVector(dodoNightDirection, 1.65);
    dodoNightAttackPosition.set(playerPosition.x, 0, playerPosition.z).addScaledVector(dodoNightDirection, -1.05);

    const headTurnProgress = MathUtils.smootherstep(
      MathUtils.clamp(clampedProgress / 0.18, 0, 1),
      0,
      1,
    );
    const bodyTurnProgress = MathUtils.smootherstep(
      MathUtils.clamp((clampedProgress - 0.16) / 0.24, 0, 1),
      0,
      1,
    );
    const hopProgress = MathUtils.smootherstep(
      MathUtils.clamp((clampedProgress - 0.2) / 0.26, 0, 1),
      0,
      1,
    );
    const runProgress = MathUtils.smootherstep(
      MathUtils.clamp((clampedProgress - 0.56) / 0.44, 0, 1),
      0,
      1,
    );

    if (clampedProgress < 0.56) {
      dodo.root.position.lerpVectors(dodoOriginalRootPosition, dodoNightExitPosition, hopProgress);
      dodo.root.position.y = Math.sin(hopProgress * Math.PI) * 0.62;
    } else {
      dodo.root.position.lerpVectors(dodoNightExitPosition, dodoNightAttackPosition, runProgress);
      dodo.root.position.y = Math.abs(Math.sin(runProgress * Math.PI * 7.2)) * 0.22 * (1 - runProgress * 0.35);
    }

    const facingX = playerPosition.x - dodo.root.position.x;
    const facingZ = playerPosition.z - dodo.root.position.z;
    const targetYaw = Math.hypot(facingX, facingZ) > 0.001
      ? Math.atan2(facingX, facingZ)
      : dodoOriginalRotationY;
    const yawDelta = Math.atan2(
      Math.sin(targetYaw - dodoOriginalRotationY),
      Math.cos(targetYaw - dodoOriginalRotationY),
    );
    dodo.root.rotation.y = dodoOriginalRotationY + yawDelta * bodyTurnProgress;

    const flapPhase = elapsed * (clampedProgress < 0.56 ? 12.5 : 23);
    const hopFlap = Math.sin(flapPhase);
    const charge = MathUtils.smoothstep(clampedProgress, 0.56, 1);
    const hopLift = Math.sin(Math.min(hopProgress, 1) * Math.PI);
    const headTurnYaw = MathUtils.clamp(yawDelta, -0.78, 0.78)
      * headTurnProgress
      * (1 - bodyTurnProgress);
    const waddle = Math.sin(runProgress * Math.PI * 8.5);
    dodo.root.rotation.x = -0.08 * charge + hopLift * 0.08;
    dodo.root.rotation.z = Math.sin(flapPhase * 0.42) * (0.08 + charge * 0.08) + waddle * charge * 0.08;
    dodo.leftWing.position.set(-0.6, 0.94 + hopLift * 0.08, 0.02 + charge * 0.16);
    dodo.leftWing.rotation.set(-0.28 * charge + hopFlap * 0.26, 0.08 * charge, -0.96 + hopFlap * 0.3);
    dodo.rightWing.position.set(0.62, 0.9 + hopLift * 0.08, 0.02 + charge * 0.16);
    dodo.rightWing.rotation.set(-0.28 * charge - hopFlap * 0.26, -0.08 * charge, 0.96 + hopFlap * 0.3);
    dodo.headPivot.position.set(0.66, 2.5 + hopLift * 0.06, 0.29 + charge * 0.16);
    dodo.headPivot.rotation.set(
      -0.12 * charge + Math.sin(flapPhase * 0.6) * 0.035,
      headTurnYaw,
      -0.2 + waddle * charge * 0.05,
    );
    dodo.position.copy(dodo.root.position).setY(dodoOriginalPosition.y);
    dodo.interactPosition.copy(dodo.position).setY(dodoOriginalInteractPosition.y);
    syncDodoCollider();
  };

  const resetDodoPowerRipVisuals = (): void => {
    dodoPowerRipActive = false;
    dodoPowerRipElapsed = 0;
    dodoPowerRipDone = false;
    chapterTwoUtilityCloset.powerDrawer.rotation.y = 0;
    chapterTwoUtilityCloset.tornWireRoot.visible = false;
    chapterTwoUtilityCloset.sparkLight.intensity = 0;
    setDodoIdlePose();
  };

  const startDodoPowerRipAnimation = (): void => {
    if (dodoPowerRipActive || dodoPowerRipDone) {
      return;
    }

    dodoPowerRipActive = true;
    dodoPowerRipElapsed = 0;
    chapterTwoUtilityCloset.open = true;
    chapterTwoUtilityCloset.targetOpenAmount = 1;
    chapterTwoUtilityCloset.tornWireRoot.visible = false;
    chapterTwoUtilityCloset.sparkLight.intensity = 0;
    setDodoIdlePose();
  };

  const update = (deltaSeconds: number, playerPosition: Vector3): void => {
    elapsed += deltaSeconds;

    const solveBlend = 1 - Math.exp(-4.8 * deltaSeconds);
    puzzleBoard.solveProgress += ((puzzleBoard.solved ? 1 : 0) - puzzleBoard.solveProgress) * solveBlend;
    const formBlend = Math.min(1, puzzleBoard.solveProgress / 0.65);
    const cardReveal = Math.max(0, Math.min(1, (puzzleBoard.solveProgress - 0.48) / 0.52));
    puzzleBoard.assemblyRoot.rotation.x = -0.09 * formBlend;
    puzzleBoard.assemblyRoot.rotation.y = formBlend * Math.PI * 0.45;

    puzzleBoard.assembledPieces.forEach((piece, index) => {
      if (!piece.visible) {
        return;
      }

      const profile = ENTRY_PUZZLE_PROFILES[index];
      piece.position.set(
        MathUtils.lerp(profile.slotX, profile.cardX, formBlend),
        0.014 + formBlend * 0.012,
        MathUtils.lerp(profile.slotZ, profile.cardZ, formBlend),
      );
      piece.rotation.set(
        MathUtils.lerp(profile.loosePitch, 0, formBlend),
        MathUtils.lerp(profile.looseYaw, 0, formBlend),
        MathUtils.lerp(index % 2 === 0 ? -0.04 : 0.04, 0, formBlend),
      );
    });

    puzzleBoard.rewardCard.visible = cardReveal > 0.01;
    puzzleBoard.rewardCard.position.y = 0.88 + cardReveal * 0.2 + Math.sin(elapsed * 2.2) * 0.02 * cardReveal;
    puzzleBoard.rewardCard.rotation.set(
      -0.14 * cardReveal,
      cardReveal * Math.PI * 1.6 + Math.sin(elapsed * 1.4) * 0.08 * cardReveal,
      0.06 * cardReveal,
    );
    puzzleBoard.rewardCard.scale.setScalar(0.35 + cardReveal * 0.65);

    entryFurniture.rockingAnimators.forEach((animator, index) => {
      const active = occupiedSeatId === animator.seatId;
      const target = active
        ? Math.sin(elapsed * 3.2 + index * 0.6) * 0.22
        : Math.sin(elapsed * 0.9 + index * 0.6) * 0.03;
      const current = animator.axis === 'x' ? animator.root.rotation.x : animator.root.rotation.z;
      const next = current + (target - current) * (1 - Math.exp(-7 * deltaSeconds));
      if (animator.axis === 'x') {
        animator.root.rotation.x = next;
      } else {
        animator.root.rotation.z = next;
      }
    });

    redWingFurniture.rockingAnimators.forEach((animator, index) => {
      if (animator.mode === 'manual-swing') {
        const active = occupiedSeatId === animator.seatId;
        const powerRiseRate = animator.powerRiseRate ?? 1.8;
        const powerDecayRate = animator.powerDecayRate ?? 1.1;
        const baseFrequency = animator.baseFrequency ?? 3.2;
        const frequencyBoost = animator.frequencyBoost ?? 2.1;
        const response = animator.response ?? 7.4;
        const maxAngle = animator.maxAngle ?? 0.4;
        const currentAngle = animator.angle ?? 0;
        const currentPower = animator.swingPower ?? 0;
        const currentPhase = animator.swingPhase ?? 0;
        const holdingForward = active ? Math.max(0, MathUtils.clamp(swingInput, -1, 1)) : 0;
        const targetPower = holdingForward > 0 ? 1 : 0;
        const powerRate = targetPower > currentPower ? powerRiseRate : powerDecayRate;
        const nextPower = currentPower
          + (targetPower - currentPower) * (1 - Math.exp(-powerRate * deltaSeconds));
        const nextPhase = currentPhase + (baseFrequency + nextPower * frequencyBoost) * deltaSeconds;
        const targetAngle = Math.sin(nextPhase) * maxAngle * nextPower;
        let nextAngle = currentAngle + (targetAngle - currentAngle) * (1 - Math.exp(-response * deltaSeconds));
        if (Math.abs(nextAngle) < 0.0015 && nextPower < 0.0015) {
          nextAngle = 0;
        }
        animator.angle = nextAngle;
        animator.swingPhase = nextPhase;
        animator.swingPower = nextPower;
        animator.root.rotation.x = nextAngle;
        return;
      }

      const active = occupiedSeatId === animator.seatId;
      const target = active
        ? Math.sin(elapsed * 2.9 + index * 0.8) * 0.34
        : Math.sin(elapsed * 0.78 + index * 0.5) * 0.05;
      const current = animator.axis === 'x' ? animator.root.rotation.x : animator.root.rotation.z;
      const next = current + (target - current) * (1 - Math.exp(-6.2 * deltaSeconds));
      if (animator.axis === 'x') {
        animator.root.rotation.x = next;
      } else {
        animator.root.rotation.z = next;
      }
    });

    redWingFurniture.swingSeat.sitPosition.copy(
      redWingFurniture.swingSeatAnchor.getWorldPosition(new Vector3()),
    );
    redWingFurniture.swingSeat.lookTarget.copy(
      redWingFurniture.swingLookAnchor.getWorldPosition(new Vector3()),
    );
    redWingFurniture.swingSeat.exitPosition.copy(
      offsetPosition(
        redWingFurniture.swingBasePosition.x,
        redWingFurniture.swingBasePosition.z,
        redWingFurniture.swingBasePosition.rotationY,
        0,
        2.25,
      ).setY(1.72),
    );

    entryFurniture.trainAnimators.forEach((animator) => {
      const phase = elapsed * animator.speed + animator.phase;
      const trainX = animator.centerX + Math.cos(phase) * animator.radiusX;
      const trainZ = animator.centerZ + Math.sin(phase) * animator.radiusZ;
      animator.root.position.set(trainX, 0.12, trainZ);
      animator.root.rotation.y = -phase + Math.PI / 2;
    });

    redWingFurniture.trainAnimators.forEach((animator) => {
      const phase = elapsed * animator.speed + animator.phase;
      const trainX = animator.centerX + Math.cos(phase) * animator.radiusX;
      const trainZ = animator.centerZ + Math.sin(phase) * animator.radiusZ;
      animator.root.position.set(trainX, 0.12, trainZ);
      animator.root.rotation.y = -phase + Math.PI / 2;
    });

    entryFurniture.aquariumAnimators.forEach((animator) => {
      if (!animator.active) {
        return;
      }

      animator.fishRoots.forEach((fishRoot, index) => {
        const phase = elapsed * animator.speeds[index] + animator.phases[index];
        const localX = animator.baseOffsets[index].x + Math.sin(phase) * animator.swimWidths[index];
        const localY = animator.baseOffsets[index].y + Math.sin(phase * 1.6) * animator.verticalAmplitudes[index];
        const localZ = animator.baseOffsets[index].z + Math.cos(phase * 1.24) * animator.swimDepths[index];
        fishRoot.position.set(localX, localY, localZ);
        fishRoot.rotation.y = Math.sin(phase) >= 0 ? Math.PI : 0;
        fishRoot.rotation.z = Math.sin(phase * 2.1) * 0.08;
      });
    });

    if (guideActive && guideWaypoints.length > 0) {
      if (guideWaypoints.length > 1 && aftermathGuide.root.visible && guideTargetIndex < guideWaypoints.length) {
        const target = guideWaypoints[guideTargetIndex];
        const playerDistanceToGuide = Math.hypot(
          playerPosition.x - aftermathGuide.root.position.x,
          playerPosition.z - aftermathGuide.root.position.z,
        );
        guideTravel.set(
          target.x - aftermathGuide.root.position.x,
          0,
          target.z - aftermathGuide.root.position.z,
        );
        const distance = Math.hypot(guideTravel.x, guideTravel.z);
        if (playerDistanceToGuide <= guideFollowDistance) {
          const moveAmount = 4.9 * deltaSeconds;
          if (distance <= moveAmount) {
            aftermathGuide.root.position.x = target.x;
            aftermathGuide.root.position.z = target.z;

            if (guideTargetIndex >= guideWaypoints.length - 1) {
              guideActive = false;
              aftermathGuide.root.visible = false;
              aftermathGuide.light.intensity = 0;
            } else {
              guideTargetIndex += 1;
            }
          } else if (distance > 0.0001) {
            aftermathGuide.root.position.x += (guideTravel.x / distance) * moveAmount;
            aftermathGuide.root.position.z += (guideTravel.z / distance) * moveAmount;
          }
        } else if (distance <= guideArrivalDistance && guideTargetIndex >= guideWaypoints.length - 1) {
          guideActive = false;
          aftermathGuide.root.visible = false;
          aftermathGuide.light.intensity = 0;
        }
      }

      if (aftermathGuide.root.visible) {
        const hover = Math.sin(elapsed * 4.1) * 0.16;
        aftermathGuide.root.position.y = 1.78 + hover;
        aftermathGuide.root.rotation.y += deltaSeconds * 1.1;
        const pulse = 1 + Math.sin(elapsed * 7.4) * 0.12;
        aftermathGuide.orb.scale.setScalar(pulse);
        aftermathGuide.halo.scale.set(1.12 * pulse, 0.82 * pulse, 1.12 * pulse);
        aftermathGuide.light.intensity = 3.1 + Math.sin(elapsed * 6.1) * 0.42;
      }
    }

    if (lobbyAftermathActive && lobbyAftermathBear) {
      lobbyAftermathBear.root.visible = true;
      lobbyAftermathBear.rig.visible = true;
      lobbyAftermathBear.smokeRoot.visible = false;
      if (lobbyAftermathBearRefusalProgress > 0.001) {
        const lungeProgress = MathUtils.smootherstep(
          Math.min(lobbyAftermathBearRefusalProgress / 0.34, 1),
          0,
          1,
        );
        lobbyAftermathChargeDirection.set(
          playerPosition.x - lobbyAftermathBear.homePosition.x,
          0,
          playerPosition.z - lobbyAftermathBear.homePosition.z,
        );
        if (lobbyAftermathChargeDirection.lengthSq() < 0.0001) {
          lobbyAftermathChargeDirection.set(0, 0, 1);
        } else {
          lobbyAftermathChargeDirection.normalize();
        }
        lobbyAftermathChargeTarget.copy(playerPosition).addScaledVector(
          lobbyAftermathChargeDirection,
          -0.55,
        );
        lobbyAftermathChargeTarget.y = 0;
        lobbyAftermathBear.root.position.lerpVectors(
          lobbyAftermathBear.homePosition,
          lobbyAftermathChargeTarget,
          lungeProgress,
        );
        const targetYaw = Math.atan2(
          playerPosition.x - lobbyAftermathBear.root.position.x,
          playerPosition.z - lobbyAftermathBear.root.position.z,
        ) + 0.08;
        lobbyAftermathBear.root.rotation.y = targetYaw;
        const shake = Math.sin(elapsed * 38) * 0.038 * (0.4 + lobbyAftermathBearRefusalProgress * 0.6);
        const slamLift = Math.sin(
          Math.min(lobbyAftermathBearRefusalProgress, 0.46) / 0.46 * Math.PI,
        ) * 0.2;
        lobbyAftermathBear.rig.position.set(
          0.03,
          0.08 + slamLift + shake * 0.22,
          0.18 + lungeProgress * 0.36,
        );
        lobbyAftermathBear.torso.rotation.set(
          0.72 + Math.sin(elapsed * 24) * 0.035,
          0.02,
          -0.04 + Math.sin(elapsed * 18) * 0.04,
        );
        lobbyAftermathBear.leftArmPivot.rotation.set(-1.08, 0.08, 0.42);
        lobbyAftermathBear.rightArmPivot.rotation.set(-1.14, -0.08, -0.4);
        lobbyAftermathBear.leftLegPivot.rotation.set(0.44, 0, -0.08);
        lobbyAftermathBear.rightLegPivot.rotation.set(0.48, 0, 0.08);
        lobbyAftermathBear.head.rotation.set(
          -0.16 + Math.sin(elapsed * 29) * 0.12,
          0.02,
          -0.08 + Math.sin(elapsed * 22) * 0.08,
        );
        lobbyAftermathBear.revealLight.intensity = 14.8 + lungeProgress * 18.5 + Math.abs(shake) * 18;
        lobbyAftermathBear.lipGlow.intensity = 8.4 + lungeProgress * 7.8 + Math.abs(shake) * 6;
      } else {
        lobbyAftermathBear.root.position.copy(lobbyAftermathBear.homePosition);
        const facingX = playerPosition.x - lobbyAftermathBear.root.position.x;
        const facingZ = playerPosition.z - lobbyAftermathBear.root.position.z;
        const targetYaw = Math.atan2(facingX, facingZ) + 0.08;
        lobbyAftermathBear.root.rotation.y += (targetYaw - lobbyAftermathBear.root.rotation.y)
          * (1 - Math.exp(-4.8 * deltaSeconds));
        const sway = Math.sin(elapsed * 0.9) * 0.006;
        lobbyAftermathBear.rig.position.set(0.05, sway, 0.06);
        lobbyAftermathBear.torso.rotation.set(
          0.34 + Math.sin(elapsed * 1.1) * 0.01,
          0.04,
          -0.26 + Math.sin(elapsed * 1.2) * 0.012,
        );
        lobbyAftermathBear.leftArmPivot.rotation.set(-0.42, 0, 0.14);
        lobbyAftermathBear.rightArmPivot.rotation.set(-0.52, 0, -0.16);
        lobbyAftermathBear.leftLegPivot.rotation.set(0.1, 0, -0.03);
        lobbyAftermathBear.rightLegPivot.rotation.set(0.12, 0, 0.03);
        lobbyAftermathBear.head.rotation.set(
          0.14 + Math.sin(elapsed * 2.1) * 0.016,
          0.03,
          -0.34 + Math.sin(elapsed * 1.5) * 0.024,
        );
        lobbyAftermathBear.revealLight.intensity = 11.4 + Math.sin(elapsed * 2.3) * 0.5;
        lobbyAftermathBear.lipGlow.intensity = 6.2 + Math.sin(elapsed * 2.8) * 0.4;
      }
    }

    keycards.forEach((keycard) => {
      if (keycard.collected || !keycard.root.visible) {
        return;
      }

      keycard.root.position.y = keycard.baseY
        + Math.sin(elapsed * KEYCARD_BOB_SPEED + keycard.phase) * KEYCARD_BOB_HEIGHT;
      keycard.root.rotation.y = elapsed * 0.95 + keycard.phase;
    });

    if (dodoPowerRipActive) {
      dodoPowerRipElapsed = Math.min(DODO_POWER_RIP_DURATION, dodoPowerRipElapsed + deltaSeconds);
      chapterTwoUtilityCloset.open = true;
      chapterTwoUtilityCloset.targetOpenAmount = 1;

      const drawerProgress = MathUtils.smootherstep(
        MathUtils.clamp((dodoPowerRipElapsed - 0.48) / 0.82, 0, 1),
        0,
        1,
      );
      const reachProgress = MathUtils.smootherstep(
        MathUtils.clamp((dodoPowerRipElapsed - 1.05) / 0.78, 0, 1),
        0,
        1,
      );
      const yankProgress = MathUtils.smootherstep(
        MathUtils.clamp((dodoPowerRipElapsed - 2.0) / 0.24, 0, 1),
        0,
        1,
      );
      const settleProgress = MathUtils.smootherstep(
        MathUtils.clamp((dodoPowerRipElapsed - 2.42) / 0.58, 0, 1),
        0,
        1,
      );
      const reachHold = Math.max(reachProgress * (1 - settleProgress * 0.55), yankProgress * (1 - settleProgress * 0.25));
      const yankShake = Math.sin(elapsed * 46) * yankProgress * (1 - settleProgress);
      const dodo = redWingFurniture.dodoPuzzle;

      chapterTwoUtilityCloset.powerDrawer.rotation.y = -drawerProgress * Math.PI * 0.72;
      dodo.root.rotation.x = -0.08 * reachHold + yankShake * 0.018;
      dodo.root.rotation.z = yankShake * 0.012;
      dodo.leftWing.position.set(-0.6, 0.94 + reachHold * 0.06, 0.02 + reachHold * 0.18);
      dodo.leftWing.rotation.set(-0.36 * reachHold, 0.18 * reachHold, -0.76 + reachHold * 0.34);
      dodo.rightWing.position.set(0.62, 0.9 + reachHold * 0.2, 0.02 + reachHold * 0.58);
      dodo.rightWing.rotation.set(-1.22 * reachHold + yankShake * 0.08, -0.24 * reachHold, 0.76 - reachHold * 0.62);
      dodo.headPivot.position.set(0.66, 2.5 - reachHold * 0.08, 0.29 + reachHold * 0.18);
      dodo.headPivot.rotation.set(-0.18 * reachHold + yankShake * 0.025, 0.08 * reachHold, -0.2);

      if (dodoPowerRipElapsed >= 2.05) {
        chapterTwoUtilityCloset.tornWireRoot.visible = true;
      }
      chapterTwoUtilityCloset.sparkLight.intensity = dodoPowerRipElapsed >= 1.92 && dodoPowerRipElapsed <= 2.7
        ? 2.8 + Math.abs(Math.sin(elapsed * 38)) * 4.6
        : 0;

      if (dodoPowerRipElapsed >= DODO_POWER_RIP_DURATION) {
        dodoPowerRipActive = false;
        dodoPowerRipDone = true;
        chapterTwoUtilityCloset.powerDrawer.rotation.y = -Math.PI * 0.72;
        chapterTwoUtilityCloset.tornWireRoot.visible = true;
        chapterTwoUtilityCloset.sparkLight.intensity = 0;
      }
    }

    const closetBlend = 1 - Math.exp(-CLOSET_OPEN_SPEED * deltaSeconds);
    chapterTwoUtilityCloset.openAmount += (
      chapterTwoUtilityCloset.targetOpenAmount - chapterTwoUtilityCloset.openAmount
    ) * closetBlend;
    if (Math.abs(chapterTwoUtilityCloset.targetOpenAmount - chapterTwoUtilityCloset.openAmount) < 0.001) {
      chapterTwoUtilityCloset.openAmount = chapterTwoUtilityCloset.targetOpenAmount;
    }
    chapterTwoUtilityCloset.doorPivot.rotation.y = -chapterTwoUtilityCloset.openAmount * Math.PI * 0.82;
    chapterTwoUtilityCloset.open = chapterTwoUtilityCloset.targetOpenAmount > 0.5;

    const blend = 1 - Math.exp(-DOOR_MOVE_SPEED * deltaSeconds);

    securityDoors.forEach((door) => {
      door.openAmount += (door.targetOpenAmount - door.openAmount) * blend;

      if (Math.abs(door.targetOpenAmount - door.openAmount) < 0.001) {
        door.openAmount = door.targetOpenAmount;
      }

      door.slab.position.y = MathUtils.lerp(door.closedY, door.openY, door.openAmount);
      door.collider.enabled = door.openAmount < 0.08;
      door.slabMaterial.emissiveIntensity = 0.18 + door.openAmount * 0.1;
      door.readerMaterial.emissiveIntensity = door.open ? 2.2 : 0.96;
    });

    if (redDoorPeek) {
      if (redDoorPeek.active) {
        redDoorPeek.root.visible = true;
        redDoorPeek.visibility = 1;
        if (redDoorPeek.phase === 'watching') {
          redDoorPeek.rig.visible = true;
          redDoorPeek.smokeRoot.visible = false;
          redDoorPeek.revealLight.intensity = 11.2 + Math.sin(elapsed * 3.6) * 0.9;
          redDoorPeek.lipGlow.intensity = 6 + Math.sin(elapsed * 4.2) * 0.6;
          redDoorPeek.stareRemaining = Math.max(0, redDoorPeek.stareRemaining - deltaSeconds);
          const facingX = playerPosition.x - redDoorPeek.root.position.x;
          const facingZ = playerPosition.z - redDoorPeek.root.position.z;
          const targetYaw = Math.atan2(facingX, facingZ) + 0.08;
          redDoorPeek.root.rotation.y += (targetYaw - redDoorPeek.root.rotation.y)
            * (1 - Math.exp(-6.4 * deltaSeconds));

          const sway = Math.sin(elapsed * 1.05) * 0.008;
          redDoorPeek.rig.position.set(0.1, sway, 0.06 + Math.sin(elapsed * 0.8) * 0.012);
          redDoorPeek.torso.rotation.set(
            0.34 + Math.sin(elapsed * 2.2) * 0.022,
            0.01 + Math.sin(elapsed * 1.1) * 0.012,
            -0.28 + Math.sin(elapsed * 2.6) * 0.02,
          );
          redDoorPeek.leftArmPivot.rotation.set(-0.5, 0, 0.16);
          redDoorPeek.rightArmPivot.rotation.set(-0.4, 0, -0.16);
          redDoorPeek.leftLegPivot.rotation.set(0.18, 0, -0.05);
          redDoorPeek.rightLegPivot.rotation.set(0.16, 0, 0.05);
          redDoorPeek.head.rotation.set(
            0.14 + Math.sin(elapsed * 4.0) * 0.024,
            0.03 + Math.sin(elapsed * 2.0) * 0.02,
            -0.72 + Math.sin(elapsed * 2.8) * 0.05,
          );
          redDoorPeek.rig.rotation.z = Math.sin(elapsed * 2.8) * 0.022;

          if (redDoorPeek.stareRemaining <= 0) {
            redDoorPeek.phase = 'charging';
          }
        } else if (redDoorPeek.phase === 'charging') {
          redDoorPeek.rig.visible = true;
          redDoorPeek.smokeRoot.visible = false;
          redDoorPeek.revealLight.intensity = 12.2 + Math.sin(elapsed * 7.4) * 1;
          redDoorPeek.lipGlow.intensity = 6.8 + Math.sin(elapsed * 8.2) * 0.7;
          const lastChargeIndex = Math.max(redDoorPeekChargePath.length - 1, 0);
          const usingMapChase = redDoorPeekChargeIndex >= lastChargeIndex;
          const currentChargeTarget = usingMapChase
            ? (() => {
                const chasePath = findDaycarePath(
                  findNearestWalkableDaycareCell(redDoorPeek.root.position.x, redDoorPeek.root.position.z),
                  findNearestWalkableDaycareCell(playerPosition.x, playerPosition.z),
                );
                const nextPathCell = chasePath[Math.min(
                  chasePath.length - 1,
                  chasePath.length > 1 ? 1 : 0,
                )];
                if (!nextPathCell) {
                  return redDoorPeekLiveTarget.copy(playerPosition).setY(0);
                }

                const [targetX, targetZ] = cellToWorld(nextPathCell.row, nextPathCell.column);
                return redDoorPeekLiveTarget.set(targetX, 0, targetZ);
              })()
            : redDoorPeekChargePath[
              Math.min(redDoorPeekChargeIndex, lastChargeIndex)
            ] ?? redDoorPeek.homePosition;
          const targetX = currentChargeTarget.x - redDoorPeek.root.position.x;
          const targetZ = currentChargeTarget.z - redDoorPeek.root.position.z;
          const distance = Math.hypot(targetX, targetZ);

          if (distance <= 0.48 && redDoorPeekChargeIndex < lastChargeIndex) {
            redDoorPeekChargeIndex += 1;
          }

          const moveTarget = redDoorPeekChargeIndex >= lastChargeIndex
            ? (() => {
                const chasePath = findDaycarePath(
                  findNearestWalkableDaycareCell(redDoorPeek.root.position.x, redDoorPeek.root.position.z),
                  findNearestWalkableDaycareCell(playerPosition.x, playerPosition.z),
                );
                let targetIndex = 1;
                while (targetIndex < chasePath.length - 1) {
                  const [cellX, cellZ] = cellToWorld(chasePath[targetIndex].row, chasePath[targetIndex].column);
                  if (Math.hypot(cellX - redDoorPeek.root.position.x, cellZ - redDoorPeek.root.position.z) > 0.48) {
                    break;
                  }
                  targetIndex += 1;
                }

                const nextCell = chasePath[Math.min(chasePath.length - 1, targetIndex)];
                if (!nextCell) {
                  return redDoorPeekLiveTarget.copy(playerPosition).setY(0);
                }

                const [targetX, targetZ] = cellToWorld(nextCell.row, nextCell.column);
                return redDoorPeekLiveTarget.set(targetX, 0, targetZ);
              })()
            : redDoorPeekChargePath[
              Math.min(redDoorPeekChargeIndex, lastChargeIndex)
            ] ?? currentChargeTarget;
          const moveX = moveTarget.x - redDoorPeek.root.position.x;
          const moveZ = moveTarget.z - redDoorPeek.root.position.z;
          const moveDistance = Math.hypot(moveX, moveZ);
          const playerDistance = Math.hypot(
            playerPosition.x - redDoorPeek.root.position.x,
            playerPosition.z - redDoorPeek.root.position.z,
          );
          if (moveDistance > 0.001) {
            const targetYaw = Math.atan2(moveX, moveZ) + 0.08;
            redDoorPeek.root.rotation.y += (targetYaw - redDoorPeek.root.rotation.y)
              * (1 - Math.exp(-10.4 * deltaSeconds));

            const speed = 10.2;
            const step = Math.min(speed * deltaSeconds, moveDistance);
            redDoorPeek.root.position.x += (moveX / moveDistance) * step;
            redDoorPeek.root.position.z += (moveZ / moveDistance) * step;
          }

          const gaitPhase = elapsed * 10.4;
          const bob = Math.abs(Math.sin(gaitPhase)) * 0.16;
          const stride = 0.92;
          const armSwing = 0.84;
          redDoorPeek.rig.position.set(0.1, bob, 0.08 + Math.sin(gaitPhase * 0.5) * 0.022);
          redDoorPeek.torso.rotation.set(
            0.36 + bob * 0.58,
            0.12 + Math.sin(gaitPhase * 0.32) * 0.05,
            -0.32 + Math.sin(gaitPhase * 0.4) * 0.11,
          );
          redDoorPeek.leftArmPivot.rotation.set(-0.82 + Math.sin(gaitPhase) * armSwing, 0, 0.28);
          redDoorPeek.rightArmPivot.rotation.set(-0.56 - Math.sin(gaitPhase) * armSwing, 0, -0.24);
          redDoorPeek.leftLegPivot.rotation.set(0.22 - Math.sin(gaitPhase) * stride, 0, -0.08);
          redDoorPeek.rightLegPivot.rotation.set(0.22 + Math.sin(gaitPhase) * stride, 0, 0.08);
          redDoorPeek.head.rotation.set(
            0.12 + bob * 0.24,
            0.12 + Math.sin(gaitPhase * 0.25) * 0.05 + Math.sin(elapsed * 1.8) * 0.02,
            -0.4 + Math.sin(gaitPhase * 0.42) * 0.09,
          );
          redDoorPeek.rig.rotation.z = Math.sin(gaitPhase * 0.5) * 0.06;

          if (
            redDoorPeekChargeIndex >= lastChargeIndex
            && (playerDistance <= 2.35 || moveDistance <= 0.38)
          ) {
            redDoorPeek.phase = 'vanishing';
            redDoorPeek.vanishRemaining = 0.9;
            redDoorPeek.rig.visible = false;
            redDoorPeek.smokeRoot.visible = true;
            redDoorPeek.smokePuffs.forEach((puff) => {
              puff.mesh.position.copy(puff.startPosition);
              puff.mesh.scale.setScalar(puff.baseScale);
              puff.material.opacity = 0.9;
            });
          }
        } else {
          redDoorPeek.vanishRemaining = Math.max(0, redDoorPeek.vanishRemaining - deltaSeconds);
          const vanishProgress = 1 - redDoorPeek.vanishRemaining / 0.9;
          redDoorPeek.revealLight.intensity = 11.2 * (1 - vanishProgress);
          redDoorPeek.lipGlow.intensity = 6.2 * (1 - vanishProgress);
          redDoorPeek.smokeRoot.visible = true;
          redDoorPeek.smokePuffs.forEach((puff, index) => {
            puff.mesh.position.copy(puff.startPosition).addScaledVector(puff.drift, vanishProgress);
            const pulse = 1 + vanishProgress * 2.4 + Math.sin(elapsed * (4 + index * 0.3)) * 0.08;
            puff.mesh.scale.setScalar(puff.baseScale * pulse);
            puff.material.opacity = Math.max(0, 0.9 - vanishProgress * 1.08);
          });

          if (redDoorPeek.vanishRemaining <= 0) {
            redDoorPeek.active = false;
            redDoorPeek.exhausted = true;
            redDoorPeek.root.visible = false;
          }
        }
      } else {
        redDoorPeek.visibility = 0;
        redDoorPeek.root.visible = false;
      }
    }
  };

  const reset = (): void => {
    elapsed = 0;
    occupiedSeatId = null;
    swingInput = 0;
    lobbyAftermathBearRefusalProgress = 0;

    entryFurniture.rockingAnimators.forEach((animator) => {
      if (animator.mode !== 'manual-swing') {
        return;
      }
      animator.angle = 0;
      animator.swingPhase = 0;
      animator.swingPower = 0;
      animator.root.rotation.x = 0;
    });
    redWingFurniture.rockingAnimators.forEach((animator) => {
      if (animator.mode !== 'manual-swing') {
        return;
      }
      animator.angle = 0;
      animator.swingPhase = 0;
      animator.swingPower = 0;
      animator.root.rotation.x = 0;
    });

    puzzlePieces.forEach((piece) => {
      piece.collected = false;
      piece.root.visible = true;
      piece.root.position.y = piece.baseY;
      piece.root.rotation.set(0, piece.baseRotationY, 0);
    });
    setEntryPuzzleState(0, false);

    keycards.forEach((keycard) => {
      keycard.collected = false;
      keycard.root.visible = !keycard.startsHidden;
      keycard.root.position.y = keycard.baseY;
      keycard.root.rotation.set(0, keycard.phase, 0);
    });

    redWingFurniture.eggPickups.forEach((egg) => {
      egg.collected = false;
      egg.root.visible = false;
    });
    blueBearPickups.forEach((bear) => {
      bear.collected = false;
      bear.root.visible = false;
    });
    setDodoPuzzleState(0, false);
    setDodoTrailState(false);

    securityDoors.forEach((door) => {
      door.open = false;
      door.openAmount = 0;
      door.targetOpenAmount = 0;
      door.slab.position.y = door.closedY;
      door.collider.enabled = true;
      door.slabMaterial.emissiveIntensity = 0.18;
      door.readerMaterial.emissiveIntensity = 0.96;
    });
    chapterTwoUtilityCloset.open = false;
    chapterTwoUtilityCloset.openAmount = 0;
    chapterTwoUtilityCloset.targetOpenAmount = 0;
    chapterTwoUtilityCloset.doorPivot.rotation.y = 0;
    resetDodoPowerRipVisuals();

    if (redDoorPeek) {
      redDoorPeek.active = false;
      redDoorPeek.phase = 'watching';
      redDoorPeek.triggered = false;
      redDoorPeek.exhausted = false;
      redDoorPeekChargeIndex = 0;
      redDoorPeek.visibility = 0;
      redDoorPeek.stareRemaining = RED_DOOR_PEEK_STARE_TIME;
      redDoorPeek.vanishRemaining = 0;
      redDoorPeek.root.visible = false;
      redDoorPeek.root.position.copy(redDoorPeek.homePosition);
      redDoorPeek.root.rotation.y = redDoorPeek.homeRotationY;
      redDoorPeek.rig.visible = true;
      redDoorPeek.rig.position.set(0.08, 0, 0.04);
      redDoorPeek.rig.rotation.set(0, 0, 0);
      redDoorPeek.head.rotation.set(0.08, 0.02, -0.18);
      redDoorPeek.torso.rotation.set(0.28, 0.01, -0.16);
      redDoorPeek.leftArmPivot.rotation.set(0, 0, 0);
      redDoorPeek.rightArmPivot.rotation.set(0, 0, 0);
      redDoorPeek.leftLegPivot.rotation.set(0, 0, 0);
      redDoorPeek.rightLegPivot.rotation.set(0, 0, 0);
      redDoorPeek.revealLight.intensity = 11.2;
      redDoorPeek.lipGlow.intensity = 6.2;
      redDoorPeek.smokeRoot.visible = false;
      redDoorPeek.smokePuffs.forEach((puff) => {
        puff.mesh.position.copy(puff.startPosition);
        puff.mesh.scale.setScalar(puff.baseScale);
        puff.material.opacity = 0;
      });
    }

    lobbyAftermathActive = false;
    entryFurniture.lobbyTankRoot.visible = true;
    entryFurniture.lobbyTankCrashedRoot.visible = false;
    entryFurniture.aquariumAnimators.forEach((animator) => {
      animator.active = true;
    });
    if (lobbyAftermathBear) {
      lobbyAftermathBear.root.visible = false;
      lobbyAftermathBear.rig.visible = true;
      lobbyAftermathBear.smokeRoot.visible = false;
      lobbyAftermathBear.root.position.copy(lobbyAftermathBear.homePosition);
      lobbyAftermathBear.root.rotation.y = lobbyAftermathBear.homeRotationY;
      lobbyAftermathBear.rig.position.set(0.08, 0, 0.04);
      lobbyAftermathBear.rig.rotation.set(0, 0, 0);
      lobbyAftermathBear.head.rotation.set(0.08, 0.02, -0.18);
      lobbyAftermathBear.torso.rotation.set(0.28, 0.01, -0.16);
      lobbyAftermathBear.leftArmPivot.rotation.set(0, 0, 0);
      lobbyAftermathBear.rightArmPivot.rotation.set(0, 0, 0);
      lobbyAftermathBear.leftLegPivot.rotation.set(0, 0, 0);
      lobbyAftermathBear.rightLegPivot.rotation.set(0, 0, 0);
      lobbyAftermathBear.revealLight.intensity = 11.2;
      lobbyAftermathBear.lipGlow.intensity = 6.2;
    }

    guideActive = false;
    guideTargetIndex = guideWaypoints.length > 1 ? 1 : 0;
    aftermathGuide.root.visible = false;
    aftermathGuide.root.position.copy(guideWaypoints[0] ?? lobbyGuideTarget);
    aftermathGuide.root.position.y = 1.78;
    aftermathGuide.orb.scale.setScalar(1);
    aftermathGuide.halo.scale.set(1.12, 0.82, 1.12);
    aftermathGuide.light.intensity = 0;
  };

  reset();

  return {
    root,
    colliders,
    spawn: DAYCARE_SPAWN.clone(),
    redDoorPeekLookTarget: redDoorPeek
      ? new Vector3(redDoorPeek.homePosition.x, 1.9, redDoorPeek.homePosition.z)
      : null,
    aftermathBearTalkPosition: lobbyAftermathBear
      ? lobbyAftermathBear.homePosition.clone()
      : null,
    keycards,
    eggPickups: redWingFurniture.eggPickups,
    blueBearPickups,
    puzzlePieces,
    puzzleBoard,
    dodoPuzzle: redWingFurniture.dodoPuzzle,
    playgroundSlide: redWingFurniture.playgroundSlide,
    seats: [...entryFurniture.seats, ...redWingFurniture.seats, ...ambientRoomFurniture.seats],
    readables: entryFurniture.readables,
    coffeeMachine: entryFurniture.coffeeMachine,
    utilityCloset: chapterTwoUtilityCloset,
    securityDoors,
    setOccupiedSeat(seatId: string | null): void {
      occupiedSeatId = seatId;
      if (seatId !== 'dodo-room-swing') {
        swingInput = 0;
      }
    },
    setSwingInput(input: number): void {
      swingInput = MathUtils.clamp(input, -1, 1);
    },
    setEntryPuzzleState,
    setDodoPuzzleState,
    setDodoTrailState,
    startDodoPowerRipAnimation,
    isDodoPowerRipAnimationComplete: () => dodoPowerRipDone,
    setDodoNightAttackState,
    getDodoNightAttackViewPosition(target: Vector3): Vector3 | null {
      const viewPosition = offsetPosition(
        dodoOriginalRootPosition.x,
        dodoOriginalRootPosition.z,
        dodoOriginalRotationY,
        0,
        5.15,
      ).setY(GAME_CONFIG.player.height);

      return target.copy(viewPosition);
    },
    getDodoNightAttackWakePosition(target: Vector3): Vector3 | null {
      const [wakeX, wakeZ] = getRoomCenter(NAP_ROOM, -0.8, 2.4);
      return target.set(wakeX, GAME_CONFIG.player.height, wakeZ);
    },
    getDodoNightAttackFocusPosition(target: Vector3): Vector3 | null {
      return redWingFurniture.dodoPuzzle.headPivot.getWorldPosition(target);
    },
    setAftermathBearRefusalScare(progress: number): void {
      lobbyAftermathBearRefusalProgress = MathUtils.clamp(progress, 0, 1);
    },
    getAftermathBearFocusPosition(target: Vector3): Vector3 | null {
      if (!lobbyAftermathBear || !lobbyAftermathBear.root.visible) {
        return null;
      }

      return lobbyAftermathBear.head.getWorldPosition(target);
    },
    triggerRedDoorPeek(playerPosition?: Vector3): boolean {
      if (!redDoorPeek || redDoorPeek.active || lobbyAftermathActive) {
        return false;
      }

      redDoorPeek.triggered = true;
      redDoorPeek.active = true;
      redDoorPeek.phase = 'watching';
      redDoorPeek.exhausted = false;
      redDoorPeekChargeIndex = 0;
      redDoorPeek.stareRemaining = RED_DOOR_PEEK_STARE_TIME;
      redDoorPeek.vanishRemaining = 0;
      redDoorPeek.visibility = 1;
      redDoorPeek.root.visible = true;
      redDoorPeek.root.position.copy(redDoorPeek.homePosition);
      const initialFacingX = (playerPosition?.x ?? redDoorPeek.homePosition.x) - redDoorPeek.homePosition.x;
      const initialFacingZ = (playerPosition?.z ?? redDoorPeek.homePosition.z) - redDoorPeek.homePosition.z;
      redDoorPeek.root.rotation.y = Math.hypot(initialFacingX, initialFacingZ) > 0.001
        ? Math.atan2(initialFacingX, initialFacingZ) + 0.08
        : redDoorPeek.homeRotationY;
      redDoorPeek.rig.visible = true;
      redDoorPeek.rig.position.set(0.08, 0, 0.04);
      redDoorPeek.rig.rotation.set(0, 0, 0);
      redDoorPeek.head.rotation.set(0.08, 0.02, -0.18);
      redDoorPeek.torso.rotation.set(0.28, 0.01, -0.16);
      redDoorPeek.leftArmPivot.rotation.set(0, 0, 0);
      redDoorPeek.rightArmPivot.rotation.set(0, 0, 0);
      redDoorPeek.leftLegPivot.rotation.set(0, 0, 0);
      redDoorPeek.rightLegPivot.rotation.set(0, 0, 0);
      redDoorPeek.smokeRoot.visible = false;
      redDoorPeek.revealLight.intensity = 11.2;
      redDoorPeek.lipGlow.intensity = 6.2;
      redDoorPeek.smokePuffs.forEach((puff) => {
        puff.mesh.position.copy(puff.startPosition);
        puff.mesh.scale.setScalar(puff.baseScale);
        puff.material.opacity = 0;
      });
      return true;
    },
    update,
    reset,
  };
}
