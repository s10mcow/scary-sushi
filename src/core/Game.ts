import {
  ACESFilmicToneMapping,
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Fog,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NoToneMapping,
  Object3D,
  PlaneGeometry,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';

import type { AppShell } from './AppShell';
import { GameLoop } from './GameLoop';
import { INGREDIENT_LABELS, RECIPES, type RecipeDefinition } from '../config/recipes';
import { GAME_CONFIG } from '../config/gameConfig';
import { createCamera } from '../scene/createCamera';
import {
  CHAPTER_TWO_BLUE_BEAR_TOTAL,
  type ChapterTwoCoffeeMachine,
  CHAPTER_TWO_KEYCARD_LABELS,
  CHAPTER_TWO_KEYCARD_ORDER,
  ENTRY_PUZZLE_PIECE_TOTAL,
  createChapterTwoLevel,
  type ChapterTwoKeycardColor,
  type ChapterTwoKeycardPickup,
  type ChapterTwoLevelData,
  type ChapterTwoReadable,
  type ChapterTwoSeat,
  type ChapterTwoSlideInteractable,
  type ChapterTwoSecurityDoor,
} from '../scene/createChapterTwoLevel';
import {
  createOfficeChapter,
  createOfficeJumpscareStageModel,
  type OfficeChapterData,
  type OfficeJumpscareStageModel,
} from '../scene/createOfficeChapter';
import {
  createZombieMode,
  type ZombieDefenseId,
  type ZombieDefensePoint,
  type ZombieModeData,
  type ZombieWeaponId,
} from '../scene/createZombieMode';
import {
  createDoomMode,
  type DoomDoor,
  type DoomKeyColor,
  type DoomLootContainer,
  type DoomModeData,
  type DoomPickup,
  type DoomWeaponId,
} from '../scene/createDoomMode';
import { createCarriedCoffeeModel, createCarriedPlateModel } from '../scene/createKitchenStation';
import {
  createHeldZombieWeapon,
  createZombieBulletTracer,
  type HeldZombieWeaponVisual,
  type ZombieBulletTracerVisual,
} from '../scene/createZombieWeapons';
import { createDoomBulletTracer, createHeldDoomWeapon } from '../scene/createDoomWeapons';
import { createLevel } from '../scene/createLevel';
import { createLighting } from '../scene/createLighting';
import { createRenderer } from '../scene/createRenderer';
import { createScene } from '../scene/createScene';
import type {
  IngredientId,
  IngredientPickup,
  ProcessingStationId,
  StationInteractable,
  StationInteractableId,
} from '../types/world';
import {
  MonsterController,
  type MonsterUpdateState,
  type MonsterVariant,
} from '../systems/monster/MonsterController';
import { InputController, type WeaponSelectId } from '../systems/input/InputController';
import { BearJumpScareAudio } from '../systems/audio/BearJumpScareAudio';
import { CoffeeMachineAudio } from '../systems/audio/CoffeeMachineAudio';
import { GameplaySfxAudio, type OfficeJumpscareCue } from '../systems/audio/GameplaySfxAudio';
import { FOXY_PLAY_LINE, FoxyPlayAudio } from '../systems/audio/FoxyPlayAudio';
import { LobbyCrashAudio } from '../systems/audio/LobbyCrashAudio';
import { PartyShowAudio } from '../systems/audio/PartyShowAudio';
import { PowerEventAudio } from '../systems/audio/PowerEventAudio';
import { DoomEnemyController, type DoomEnemyVariant } from '../systems/doom/DoomEnemyController';
import { FlashlightController } from '../systems/player/FlashlightController';
import { PlayerController } from '../systems/player/PlayerController';
import { ZombieController } from '../systems/zombie/ZombieController';
import {
  createHud,
  type HudChapterId,
  type HudJumpScareVariant,
  type OfficeCameraPuppetHudPhase,
  type OfficeModeMenuDifficulty,
  type OfficeModeMenuMode,
  type OfficeModeMenuStep,
  type OfficeJumpscareOptionView,
  type TabletCameraSlotView,
} from '../ui/createHud';
import { isBlocked } from '../systems/collision/isBlocked';

const HOTBAR_ORDER: IngredientId[] = [
  'rice-stalk',
  'raw-rice',
  'cooked-rice',
  'seaweed',
  'dried-seaweed',
  'sliced-seaweed',
  'salmon-fish',
  'salmon',
  'tuna-fish',
  'tuna',
  'coffee',
];

const MACHINE_JOB_DURATIONS: Record<ProcessingStationId, number> = {
  grainer: 2.2,
  boiler: 3.1,
  skinner: 2.1,
  dryer: 2.3,
  slicer: 1.7,
};

const CHAPTER_ONE_MACHINE_IDS: ProcessingStationId[] = [
  'grainer',
  'boiler',
  'skinner',
  'dryer',
  'slicer',
];

const SEAWEED_MONSTER_Y = 1.28;
const SPIDER_MONSTER_Y = 0.06;
const DUCK_MONSTER_Y = 0.28;
const SEAWEED_MONSTER_HOME = new Vector3(0, SEAWEED_MONSTER_Y, -52.2);
const SPIDER_MONSTER_HOME = new Vector3(-44, SPIDER_MONSTER_Y, -28);
const DUCK_MONSTER_HOME = new Vector3(44, DUCK_MONSTER_Y, -10);
const CHAPTER_EXIT_MESSAGE =
  'You finally notice the door near the seaweed in the maze.\nI could leave there.';
const CHAPTER_EXIT_TYPE_SPEED = 32;
const CHAPTER_TWO_COFFEE_BREW_DURATION = 2.8;
const CHAPTER_TWO_COFFEE_DRINK_DURATION = 1.2;
const CHAPTER_TWO_COFFEE_BOOST_DURATION = 5;
const CHAPTER_TWO_BEAR_REFUSAL_DURATION = 1.55;
const CHAPTER_TWO_DODO_TRAIL_NOTICE_DURATION = 5.4;
const CHAPTER_TWO_POWER_OUTAGE_NOTICE_DURATION = 2.4;
const CHAPTER_TWO_DODO_NIGHT_ATTACK_DURATION = 6.25;
const CHAPTER_TWO_DODO_NIGHT_ATTACK_ARM_START = 4.85;
const CHAPTER_TWO_DODO_NIGHT_ATTACK_BLACKOUT_START = 5.34;
const CHAPTER_TWO_BEAR_TALK_RANGE_BONUS = 2.35;
const CHAPTER_TWO_AFTERMATH_BEAR_DIALOGUE = [
  'Sorry for scaring you earlier. I just wanted a hug.',
  'Wait... I lost eight teddy bears.',
  "Can you find them for me? I'll give you the yellow key card in return.",
  'Thanks.',
] as const;
const START_IN_CHAPTER_TWO = false;
const START_IN_CHAPTER_THREE = true;
const CHAPTER_TWO_STARTS_WITH_RED_KEYCARD = true;
const CHAPTER_TWO_STARTS_WITH_ALL_DODO_EGGS = true;
const CHAPTER_TWO_STARTS_WITH_ALL_BLUE_BEARS = true;
const ZOMBIE_DAY_DURATION = 36;
const ZOMBIE_NIGHT_DURATION = 42;
const ZOMBIE_FIRE_COOLDOWN: Record<ZombieWeaponId, number> = {
  pistol: 0.24,
  shotgun: 0.82,
};
const ZOMBIE_DEFENSE_HEALTH_BY_LEVEL = [0, 90, 165, 250] as const;
const ZOMBIE_DEFENSE_UPGRADE_COST = [20, 36, 54] as const;
const ZOMBIE_DEFENSE_REPAIR_COST = 16;
const ZOMBIE_STARTING_AMMO: Record<ZombieWeaponId, number> = {
  pistol: 42,
  shotgun: 14,
};
const ZOMBIE_DAWN_AMMO: Record<ZombieWeaponId, number> = {
  pistol: 18,
  shotgun: 4,
};
const ZOMBIE_DEFENSE_IDS: ZombieDefenseId[] = ['north', 'south', 'east', 'west'];
const ZOMBIE_HITSCAN_RADIUS = 1.05;
const ZOMBIE_CARD_DURATION = 3.6;
const DOOM_FIRE_COOLDOWN: Record<DoomWeaponId, number> = {
  pistol: 0.22,
  shotgun: 0.85,
};
const DOOM_STARTING_AMMO: Record<DoomWeaponId, number> = {
  pistol: 50,
  shotgun: 0,
};
const DOOM_CARD_DURATION = 3.6;
const DOOM_PISTOL_RANGE = 34;
const DOOM_SHOTGUN_RANGE = 18;
const DOOM_SHOTGUN_PELLETS = 7;
const OFFICE_DELETED_CAMERA_STORAGE_KEY = 'scary-sushi.chapter3.deleted-cameras';

interface MachineJob {
  id: ProcessingStationId;
  input: IngredientId;
  output: IngredientId;
  duration: number;
  remaining: number;
  startText: string;
  finishText: string;
}

interface ActiveJumpScare {
  monster: MonsterController;
  variant: MonsterVariant;
  elapsed: number;
  knockout: boolean;
}

interface ChapterTwoCoffeeJob {
  duration: number;
  remaining: number;
}

interface ActiveCoffeeDrink {
  elapsed: number;
  duration: number;
}

interface ActiveChapterTwoSlide {
  elapsed: number;
  duration: number;
  startPosition: Vector3;
  endPosition: Vector3;
  lookTarget: Vector3;
}

interface ActiveChapterTwoClimb {
  elapsed: number;
  duration: number;
  startPosition: Vector3;
  endPosition: Vector3;
  lookTarget: Vector3;
}

interface ActiveChapterTwoDodoNightAttack {
  elapsed: number;
  movedToNestView: boolean;
}

interface ZombieSightTarget {
  zombie: ZombieController;
  point: Vector3;
  distance: number;
}

interface ActiveZombieBulletTracer {
  visual: ZombieBulletTracerVisual;
  start: Vector3;
  direction: Vector3;
  distance: number;
  elapsed: number;
}

interface DoomSightTarget {
  enemy: DoomEnemyController;
  point: Vector3;
  distance: number;
}

interface PlacementMarker {
  id: number;
  chapter: HudChapterId;
  position: Vector3;
  normal: Vector3;
  root: Group;
  label: Mesh;
}

type OfficeJumpscareAnimatronic = 'quacky' | 'fluffle' | 'bori' | 'foxy';
type OfficeGameModeDifficulty = OfficeModeMenuDifficulty;
type OfficeCameraPuppetPhase = 'idle' | OfficeCameraPuppetHudPhase;

interface OfficeVentBoyState {
  root: Group;
  head: Group;
  propeller: Group;
  leftArm: Group;
  rightArm: Group;
  leftLeg: Group;
  rightLeg: Group;
  route: Vector3[];
  routeIndex: number;
  waitTimer: number;
  stareTimer: number;
}

interface ActiveOfficeVentDrop {
  elapsed: number;
  duration: number;
  startPosition: Vector3;
  endPosition: Vector3;
  lookTarget: Vector3;
  openingLabel: string;
}

interface ActiveOfficeBallPitSlide {
  elapsed: number;
  duration: number;
  startPosition: Vector3;
  endPosition: Vector3;
  lookTarget: Vector3;
}

interface OfficeJumpscareDefinition {
  id: string;
  animatronic: OfficeJumpscareAnimatronic;
  variant: 1 | 2 | 3;
  label: string;
  body: string;
  cue: OfficeJumpscareCue;
  duration: number;
}

interface ActiveOfficeJumpscare {
  definition: OfficeJumpscareDefinition;
  elapsed: number;
  duration: number;
  root: Group;
  modelRoot: Group;
  head: Group;
  jaw: Group;
  smile: Group;
  leftArm: Group;
  rightArm: Group;
  leftLeg: Group;
  rightLeg: Group;
  leftLegJoint: Group;
  rightLegJoint: Group;
  blackoutMaterial: MeshBasicMaterial;
  closeCuePlayed: boolean;
  reopenJumpscareMenu: boolean;
  materialStates: OfficeCutsceneMaterialState[];
}

interface OfficeCutsceneMaterialState {
  material: MeshBasicMaterial | MeshStandardMaterial;
  color: Color;
  emissive?: Color;
  emissiveIntensity?: number;
  eye: boolean;
}

interface ActiveOfficeGlassThrow {
  root: Group;
  velocity: Vector3;
  elapsed: number;
  crashed: boolean;
}

interface OfficeGameModeConfig {
  label: string;
  powerMultiplier: number;
  detectionRange: number;
  lostSightSeconds: number;
  walkSpeed: number;
  chaseSpeed: number;
  attackRange: number;
}

interface OfficeGameModeAnimatronicState {
  animatronic: OfficeJumpscareAnimatronic;
  label: string;
  model: OfficeJumpscareStageModel;
  route: Vector3[];
  routeIndex: number;
  state: 'stage' | 'wander' | 'chase' | 'rush' | 'door' | 'retreat';
  waitTimer: number;
  attackCooldown: number;
  lostSightTimer: number;
  stuckTimer: number;
  progressStallTimer: number;
  detourTarget: Vector3 | null;
  detourTimer: number;
  lastKnownPlayerPosition: Vector3;
}

const OFFICE_JUMPSCARE_DEFINITIONS: OfficeJumpscareDefinition[] = [
  { id: 'quacky-1', animatronic: 'quacky', variant: 1, label: 'Quacky: Red-Eye Flicker', body: 'His red eyes flicker in the distance, then he appears in your face screaming.', cue: 'stomp-roar', duration: 2 },
  { id: 'quacky-2', animatronic: 'quacky', variant: 2, label: 'Quacky: Snap Scream', body: 'His red eyes flicker in the distance, then he appears in your face screaming.', cue: 'beak-clack', duration: 2 },
  { id: 'quacky-3', animatronic: 'quacky', variant: 3, label: 'Quacky: Dark Eyes', body: 'His red eyes flicker in the distance, then he appears in your face screaming.', cue: 'wing-slam', duration: 2 },
  { id: 'fluffle-1', animatronic: 'fluffle', variant: 1, label: 'Fluffle: Guitar Screech', body: 'A guitar shriek hits, then Fluffle spring-jumps sideways at you.', cue: 'guitar-screech', duration: 3.1 },
  { id: 'fluffle-2', animatronic: 'fluffle', variant: 2, label: 'Fluffle: Broken Crawl', body: 'Fluffle drops to hands and knees, twitches at you, then crawls fast into your face.', cue: 'broken-crawl', duration: 3.25 },
  { id: 'fluffle-3', animatronic: 'fluffle', variant: 3, label: 'Fluffle: Ear Snap', body: 'The ears snap down in silence before a sudden face bite.', cue: 'ear-snap', duration: 2.95 },
  { id: 'bori-1', animatronic: 'bori', variant: 1, label: 'Bori: Smile Lunge', body: 'His face curls into a huge smile before he lunges with both arms forward.', cue: 'stomp-roar', duration: 3.05 },
  { id: 'bori-2', animatronic: 'bori', variant: 2, label: 'Bori: Red-Eye Slash', body: 'Only his silhouette and red eyes show while he twitches forward, then he slashes and screams.', cue: 'hat-blackout', duration: 3.18 },
  { id: 'bori-3', animatronic: 'bori', variant: 3, label: 'Bori: Flicker Bite', body: 'He flickers closer and closer, opens his jaw, bites the screen, then blacks everything out.', cue: 'bear-grab', duration: 3.15 },
  { id: 'foxy-1', animatronic: 'foxy', variant: 1, label: 'Foxy: Hook Scrape', body: 'The hook scrapes across the camera, then Foxy slashes forward.', cue: 'hook-scrape', duration: 3.0 },
  { id: 'foxy-2', animatronic: 'foxy', variant: 2, label: 'Foxy: Curtain Snap', body: 'The curtains snap open and Foxy appears already too close.', cue: 'curtain-snap', duration: 2.95 },
  { id: 'foxy-3', animatronic: 'foxy', variant: 3, label: 'Foxy: Pirate Spin', body: 'Foxy spins like a pirate performer, then whips into a jump slash.', cue: 'pirate-spin', duration: 3.2 },
];

const OFFICE_GAME_MODE_CONFIGS: Record<OfficeGameModeDifficulty, OfficeGameModeConfig> = {
  easy: {
    label: 'Easy',
    powerMultiplier: 0.72,
    detectionRange: 3.2,
    lostSightSeconds: 5,
    walkSpeed: 0.85,
    chaseSpeed: 5.35,
    attackRange: 0.92,
  },
  normal: {
    label: 'Normal',
    powerMultiplier: 1,
    detectionRange: 6.2,
    lostSightSeconds: 6,
    walkSpeed: 1.05,
    chaseSpeed: 5.65,
    attackRange: 1.05,
  },
  hard: {
    label: 'Hard',
    powerMultiplier: 1.36,
    detectionRange: 9.4,
    lostSightSeconds: 7,
    walkSpeed: 1.24,
    chaseSpeed: 6.05,
    attackRange: 1.16,
  },
};

const OFFICE_GAME_MODE_CAMERA_DRAIN_PER_SECOND = 0.42;
const OFFICE_GAME_MODE_CLOSED_DOOR_DRAIN_PER_SECOND = 0.265;
const OFFICE_GAME_MODE_IDLE_DRAIN_PER_SECOND = 0.025;
const OFFICE_GAME_MODE_TOTAL_NIGHTS = 5;
const OFFICE_GAME_MODE_NIGHT_SECONDS = 5 * 60;
const OFFICE_GAME_MODE_DAY_SECONDS = 3 * 60;
const OFFICE_VENT_BOY_STARE_LIMIT_SECONDS = 2.65;
const OFFICE_VENT_BOY_SPEED = 0.82;
const OFFICE_FOXY_CAMERA_TRIGGER_MIN_SECONDS = 15;
const OFFICE_FOXY_CAMERA_TRIGGER_MAX_SECONDS = 20;
const OFFICE_FOXY_RUSH_SPEED = GAME_CONFIG.player.sprintSpeed * 2;
const OFFICE_CAMERA_PUPPET_CHANCE = 0.05;
const OFFICE_CAMERA_PUPPET_CAMERA_FAIL_SECONDS = 2.25;
const OFFICE_CAMERA_PUPPET_REOPEN_SECONDS = 3;
const OFFICE_CAMERA_PUPPET_JUMPSCARE_SECONDS = 1.35;
const OFFICE_GAME_MODE_OFFICE_CENTER = new Vector3(-240, GAME_CONFIG.player.height, 184);
const OFFICE_GAME_MODE_OFFICE_SPAWN = new Vector3(-240, GAME_CONFIG.player.height, 186.2);
const OFFICE_GAME_MODE_OFFICE_LOOK_TARGET = new Vector3(-240, GAME_CONFIG.player.height, 181.2);
const OFFICE_GAME_MODE_LEFT_DOOR_WATCH = new Vector3(-248.5, GAME_CONFIG.player.height, 184.9);
const OFFICE_GAME_MODE_RIGHT_DOOR_WATCH = new Vector3(-231.5, GAME_CONFIG.player.height, 184.9);
const OFFICE_GAME_MODE_BALL_PIT_CENTER = new Vector3(-216.7, GAME_CONFIG.player.height, 141.2);
const OFFICE_FOXY_STAGE_RUSH_START = new Vector3(-199.4, GAME_CONFIG.player.height, 156.8);
const OFFICE_FOXY_CLOSET_RUSH_START = new Vector3(-254.4, GAME_CONFIG.player.height, 153.1);
const OFFICE_GAME_MODE_ROUTES: Record<OfficeJumpscareAnimatronic, Vector3[]> = {
  quacky: [
    new Vector3(-244.6, GAME_CONFIG.player.height, 160.8),
    new Vector3(-250.4, GAME_CONFIG.player.height, 163.9),
    new Vector3(-257.2, GAME_CONFIG.player.height, 164.8),
    new Vector3(-263.1, GAME_CONFIG.player.height, 160.8),
    new Vector3(-263.4, GAME_CONFIG.player.height, 168.6),
    new Vector3(-250.2, GAME_CONFIG.player.height, 174.9),
    new Vector3(-240.2, GAME_CONFIG.player.height, 160.8),
    new Vector3(-229.2, GAME_CONFIG.player.height, 159.2),
    new Vector3(-218.8, GAME_CONFIG.player.height, 146.2),
    new Vector3(-204.2, GAME_CONFIG.player.height, 159.2),
    OFFICE_GAME_MODE_LEFT_DOOR_WATCH.clone(),
  ],
  fluffle: [
    new Vector3(-240, GAME_CONFIG.player.height, 160.4),
    new Vector3(-229.2, GAME_CONFIG.player.height, 159.2),
    new Vector3(-224.4, GAME_CONFIG.player.height, 149.2),
    OFFICE_GAME_MODE_BALL_PIT_CENTER.clone(),
    new Vector3(-223.3, GAME_CONFIG.player.height, 145.2),
    new Vector3(-212.1, GAME_CONFIG.player.height, 149.2),
    new Vector3(-203.8, GAME_CONFIG.player.height, 159.2),
    new Vector3(-237.8, GAME_CONFIG.player.height, 160.4),
  ],
  bori: [
    new Vector3(-235.4, GAME_CONFIG.player.height, 160.9),
    new Vector3(-239.5, GAME_CONFIG.player.height, 166.5),
    new Vector3(-231.7, GAME_CONFIG.player.height, 176.8),
    OFFICE_GAME_MODE_RIGHT_DOOR_WATCH.clone(),
    new Vector3(-247.8, GAME_CONFIG.player.height, 171.2),
    new Vector3(-254.9, GAME_CONFIG.player.height, 171),
    new Vector3(-235.2, GAME_CONFIG.player.height, 161),
  ],
  foxy: [
    new Vector3(-199.4, GAME_CONFIG.player.height, 156.8),
    new Vector3(-203.8, GAME_CONFIG.player.height, 159.2),
    new Vector3(-212.1, GAME_CONFIG.player.height, 159.2),
    new Vector3(-226.4, GAME_CONFIG.player.height, 159.2),
    new Vector3(-239.3, GAME_CONFIG.player.height, 159.2),
    new Vector3(-251.9, GAME_CONFIG.player.height, 153.1),
    new Vector3(-254.4, GAME_CONFIG.player.height, 153.1),
    new Vector3(-255.1, GAME_CONFIG.player.height, 171),
    new Vector3(-239.3, GAME_CONFIG.player.height, 159.2),
    new Vector3(-212.2, GAME_CONFIG.player.height, 149.6),
  ],
};
const OFFICE_GAME_MODE_ANIMATRONIC_SCALE: Record<OfficeJumpscareAnimatronic, number> = {
  quacky: 2,
  fluffle: 2,
  bori: 2,
  foxy: 2.27,
};
const OFFICE_GAME_MODE_ANIMATRONIC_FLOOR_Y: Record<OfficeJumpscareAnimatronic, number> = {
  quacky: 0.73,
  fluffle: 0.73,
  bori: 0.73,
  foxy: 1.17,
};
const OFFICE_GAME_MODE_COLLISION_RADIUS = 0.52;
const OFFICE_GAME_MODE_STAGE_LIFT = 0.07;
const OFFICE_VENT_GRATE_DROP_RADIUS = 0.34;
const OFFICE_VENT_GRATE_DROP_OPEN_AMOUNT = 0.86;
const OFFICE_VENT_DROP_DURATION = 0.82;

export class Game {
  private readonly scene;
  private readonly camera;
  private readonly renderer;
  private readonly level;
  private readonly chapterTwo: ChapterTwoLevelData;
  private readonly officeChapter: OfficeChapterData;
  private readonly zombieMode: ZombieModeData;
  private readonly doomMode: DoomModeData;
  private readonly lighting;
  private readonly input;
  private readonly player;
  private readonly flashlight;
  private readonly bearJumpScareAudio = new BearJumpScareAudio();
  private readonly coffeeMachineAudio = new CoffeeMachineAudio();
  private readonly gameplaySfxAudio = new GameplaySfxAudio();
  private readonly foxyPlayAudio = new FoxyPlayAudio();
  private readonly lobbyCrashAudio = new LobbyCrashAudio();
  private readonly partyShowAudio = new PartyShowAudio();
  private readonly powerEventAudio = new PowerEventAudio();
  private readonly monsters: MonsterController[];
  private readonly zombieControllers: ZombieController[];
  private readonly doomEnemies: DoomEnemyController[];
  private readonly chapterOneMonsterHomes: Vector3[];
  private readonly hud;
  private readonly loop;
  private readonly resizeObserver;
  private readonly unlockedMonsterState: MonsterUpdateState = {
    distance: Infinity,
    threat: 0,
    touching: false,
  };

  private elapsed = 0;
  private health: number = GAME_CONFIG.player.healthMax;
  private stamina: number = GAME_CONFIG.player.staminaMax;
  private readonly inventory = new Map<IngredientId, number>();
  private readonly chapterTwoKeycards = new Set<ChapterTwoKeycardColor>();
  private readonly machineJobs = new Map<ProcessingStationId, MachineJob>();
  private readonly monsterHitCooldowns = new Map<MonsterController, number>();
  private readonly plateIngredients: IngredientId[] = [];
  private readonly carriedPlateAnchor = new Group();
  private readonly carriedDrinkAnchor = new Group();
  private readonly officeBasketballAnchor = new Group();
  private readonly officeGlassAnchor = new Group();
  private readonly officeTabletAnchor = new Group();
  private readonly officeTabletViewCamera = new PerspectiveCamera(58, 1, 0.05, 120);
  private readonly officeTabletViewPosition = new Vector3();
  private readonly officeTabletViewQuaternion = new Quaternion();
  private readonly zombieWeaponAnchor = new Group();
  private readonly placementToolAnchor = new Group();
  private readonly placementMarkerRoot = new Group();
  private readonly placementPreview = new Group();
  private readonly placementRaycaster = new Raycaster();
  private readonly placementSurfaceUp = new Vector3(0, 1, 0);
  private readonly placementRayOrigin = new Vector3();
  private readonly placementRayDirection = new Vector3();
  private readonly placementSurfaceNormal = new Vector3(0, 1, 0);
  private readonly placementSurfaceQuaternion = new Quaternion();
  private readonly placementCameraWorldPosition = new Vector3();
  private readonly placementMarkers: PlacementMarker[] = [];
  private readonly kitchenFogColor = new Color(GAME_CONFIG.fog.color);
  private readonly mazeFogColor = new Color(0x050605);
  private readonly chapterTwoFogColor = new Color(0xdce7ee);
  private readonly officeChapterFogColor = new Color(0xd7dde3);
  private readonly officeNightFogColor = new Color(0x000000);
  private readonly zombieDayFogColor = new Color(0x8aa3b5);
  private readonly zombieNightFogColor = new Color(0x0d1520);
  private readonly jumpscareLookTarget = new Vector3();
  private readonly chapterTwoBearLookTarget = new Vector3();
  private readonly chapterTwoDodoAttackLookTarget = new Vector3();
  private readonly chapterTwoDodoAttackViewPosition = new Vector3();
  private readonly chapterTwoDodoAttackWakePosition = new Vector3();
  private readonly zombieAimPoint = new Vector3();
  private readonly zombieForward = new Vector3();
  private readonly zombieRayPoint = new Vector3();
  private readonly zombieWeaponMuzzlePoint = new Vector3();
  private readonly zombieShotEndPoint = new Vector3();
  private readonly zombieShotRight = new Vector3();
  private readonly zombieTracerUnitZ = new Vector3(0, 0, 1);
  private readonly zombieTracerQuaternion = new Quaternion();
  private readonly submittedRecipes = new Set<string>();
  private readonly zombieDefenseLevels = new Map<ZombieDefenseId, number>();
  private readonly zombieDefenseHealth = new Map<ZombieDefenseId, number>();
  private readonly zombieBulletTracers: ActiveZombieBulletTracer[] = [];
  private monsterState: MonsterUpdateState = this.unlockedMonsterState;
  private touchingMonster: MonsterController | null = null;
  private activeJumpscare: ActiveJumpScare | null = null;
  private carriedPlateRecipeId: string | null = null;
  private carriedPlateModel: Group | null = null;
  private carriedDrinkModel: Group | null = null;
  private zombieWeaponVisual: HeldZombieWeaponVisual | null = null;
  private zombieWeaponVisualId: WeaponSelectId | null = null;
  private zombieWeaponVisualMode: 'zombie' | 'doom' | null = null;
  private holdingPlate = false;
  private plateRecipeId: string | null = null;
  private platedRecipeId: string | null = null;
  private chapterExitUnlocked = false;
  private chapterTwoActive = false;
  private officeChapterActive = false;
  private zombieModeActive = false;
  private doomModeActive = false;
  private chapterMenuOpen = false;
  private chapterTwoPuzzlePiecesCollected = 0;
  private chapterTwoRedPuzzleSolved = false;
  private chapterTwoEggsHeld = 0;
  private chapterTwoEggsDeposited = 0;
  private chapterTwoEggQuestStarted = false;
  private chapterTwoEggQuestNoticeTime = 0;
  private chapterTwoBlueBearsHeld = 0;
  private chapterTwoBlueBearsReturned = 0;
  private chapterTwoSeatId: string | null = null;
  private chapterTwoClimb: ActiveChapterTwoClimb | null = null;
  private chapterTwoSlide: ActiveChapterTwoSlide | null = null;
  private chapterTwoBearDialogueIndex: number | null = null;
  private chapterTwoBearDialogueComplete = false;
  private chapterTwoBearChoicePending = false;
  private chapterTwoBearQuestAccepted = false;
  private chapterTwoBearRefusalTimer = 0;
  private chapterTwoDodoTrailActive = false;
  private chapterTwoDodoTrailNoticeTime = 0;
  private chapterTwoPowerOutageTriggered = false;
  private chapterTwoPowerOutageNoticeTime = 0;
  private chapterTwoDodoPowerRipSoundPlayed = false;
  private chapterTwoDodoNightAttack: ActiveChapterTwoDodoNightAttack | null = null;
  private officeChapterSeated = false;
  private officeChapterTickets = 0;
  private officeBasketballHeld = false;
  private officeGlassHeld = false;
  private readonly officeGlassThrows: ActiveOfficeGlassThrow[] = [];
  private officePrizeWheelLastTickIndex = 0;
  private officePrizeWheelWasSpinning = false;
  private officeBallPitHidden = false;
  private officeBallPitSlide: ActiveOfficeBallPitSlide | null = null;
  private officeVentActive = false;
  private officeVentDrop: ActiveOfficeVentDrop | null = null;
  private officeJumpscareMenuOpen = false;
  private officeModeMenuOpen = false;
  private officeModeMenuStep: OfficeModeMenuStep = 'mode';
  private officeModeMenuPendingMode: OfficeModeMenuMode | null = null;
  private activeOfficeJumpscare: ActiveOfficeJumpscare | null = null;
  private officeTabletHeld = false;
  private officeTabletCameraFeedActive = false;
  private officeTabletCameraIndex = 0;
  private officeCameraPuppetPhase: OfficeCameraPuppetPhase = 'idle';
  private officeCameraPuppetTimer = 0;
  private officeMode: OfficeModeMenuMode = 'creator';
  private officeGameModeActive = false;
  private officeGameModeDifficulty: OfficeGameModeDifficulty = 'normal';
  private officeGameModePower = 100;
  private officeGameModePowerOut = false;
  private officeGameModeNightPhase = false;
  private officeGameModePhaseTime = 0;
  private officeGameModeNight = 1;
  private readonly officeGameModeAnimatronics: OfficeGameModeAnimatronicState[] = [];
  private officeFoxyCameraWatchTime = 0;
  private officeFoxyCameraTriggerSeconds = OFFICE_FOXY_CAMERA_TRIGGER_MIN_SECONDS;
  private officeFoxyRushCooldown = 0;
  private officeFoxyClankCooldown = 0;
  private officeFoxyRushDoor: 'left' | 'right' | null = null;
  private officeVentBoy: OfficeVentBoyState | null = null;
  private chapterTwoCardTime = 0;
  private chapterTwoCoffeeJob: ChapterTwoCoffeeJob | null = null;
  private activeCoffeeDrink: ActiveCoffeeDrink | null = null;
  private coffeeBoostRemaining = 0;
  private chapterExitMessageElapsed = 0;
  private chapterCardTitle = 'Chapter Two';
  private chapterCardBody =
    'The daycare lobby is still set up for families. Red access is live, but the blue wing stays locked until you gather the hidden eggs in the first red section and feed them to the strange dodo.';
  private zombieDay = 1;
  private zombieNightActive = false;
  private zombiePhaseRemaining = ZOMBIE_DAY_DURATION;
  private zombieNightSpawnRemaining = 0;
  private zombieSpawnCooldown = 0;
  private zombieKills = 0;
  private zombieScrap = 0;
  private zombieWeapon: ZombieWeaponId = 'pistol';
  private readonly zombieAmmo: Record<ZombieWeaponId, number> = { ...ZOMBIE_STARTING_AMMO };
  private doomWeapon: DoomWeaponId = 'pistol';
  private readonly doomAmmo: Record<DoomWeaponId, number> = { ...DOOM_STARTING_AMMO };
  private doomArmor = 0;
  private readonly doomKeys = new Set<DoomKeyColor>();
  private readonly doomWeaponsOwned = new Set<DoomWeaponId>(['pistol']);
  private doomThreatEyeIntensity = 0;
  private zombieFireCooldown = 0;
  private zombieWeaponKick = 0;
  private placementToolActive = false;
  private nextPlacementMarkerId = 1;
  private readonly deletedOfficeSecurityCameraIds = new Set<number>();
  private transientStatus =
    'The maze is live. Pull raw ingredients out of the pantry, process them through the station machines, then plate each roll.';
  private transientStatusTime = 0;

  constructor(private readonly shell: AppShell) {
    this.scene = createScene();
    this.camera = createCamera();
    this.renderer = createRenderer(this.shell.viewport);
    this.level = createLevel();
    this.chapterTwo = createChapterTwoLevel();
    this.chapterTwo.root.visible = false;
    this.officeChapter = createOfficeChapter();
    this.loadDeletedOfficeSecurityCameras();
    this.applyDeletedOfficeSecurityCameras();
    this.officeChapter.root.visible = false;
    this.zombieMode = createZombieMode();
    this.zombieMode.root.visible = false;
    this.doomMode = createDoomMode();
    this.doomMode.root.visible = false;
    this.lighting = createLighting(this.camera);
    this.input = new InputController();
    this.player = new PlayerController(
      this.camera,
      this.renderer.domElement,
      [...this.level.colliders, ...this.chapterTwo.colliders, ...this.officeChapter.colliders, ...this.zombieMode.colliders, ...this.doomMode.colliders],
      this.level.spawn,
    );
    this.flashlight = new FlashlightController(this.lighting.flashlight);
    this.flashlight.setEnabled(false);
    const seaweedHome = this.level.mazeNavigator.snap(SEAWEED_MONSTER_HOME.clone());
    seaweedHome.y = SEAWEED_MONSTER_Y;
    const spiderHome = this.level.mazeNavigator.snap(SPIDER_MONSTER_HOME.clone());
    spiderHome.y = SPIDER_MONSTER_Y;
    const duckHome = this.level.mazeNavigator.snap(DUCK_MONSTER_HOME.clone());
    duckHome.y = DUCK_MONSTER_Y;
    this.chapterOneMonsterHomes = [seaweedHome.clone(), spiderHome.clone(), duckHome.clone()];
    this.monsters = [
      new MonsterController(seaweedHome, this.level.colliders, this.level.mazeNavigator, {
        variant: 'seaweed',
        audioEnabled: true,
      }),
      new MonsterController(spiderHome, this.level.colliders, this.level.mazeNavigator, {
        variant: 'spider',
        audioEnabled: false,
      }),
      new MonsterController(duckHome, this.level.colliders, this.level.mazeNavigator, {
        variant: 'duck',
        audioEnabled: false,
      }),
    ];
    this.zombieControllers = Array.from({ length: 18 }, () => new ZombieController(this.zombieMode.colliders));
    this.doomEnemies = Array.from({ length: 10 }, () => new DoomEnemyController(this.doomMode.colliders));
    this.hud = createHud(this.shell.overlay);
    this.loop = new GameLoop(this.update);
    this.resizeObserver = new ResizeObserver(this.resize);

    this.scene.add(this.level.root);
    this.scene.add(this.chapterTwo.root);
    this.scene.add(this.officeChapter.root);
    this.scene.add(this.zombieMode.root);
    this.scene.add(this.doomMode.root);
    this.scene.add(this.camera);
    this.monsters.forEach((monster) => this.scene.add(monster.root));
    this.zombieControllers.forEach((zombie) => this.scene.add(zombie.root));
    this.doomEnemies.forEach((enemy) => this.scene.add(enemy.root));
    this.scene.add(this.lighting.ambient, this.lighting.hemisphere);
    this.camera.add(this.carriedPlateAnchor);
    this.carriedPlateAnchor.position.set(0.56, -0.48, -0.98);
    this.carriedPlateAnchor.rotation.set(-0.08, -0.34, -0.14);
    this.carriedPlateAnchor.visible = false;
    this.camera.add(this.carriedDrinkAnchor);
    this.carriedDrinkAnchor.position.set(0.38, -0.62, -0.7);
    this.carriedDrinkAnchor.rotation.set(0.08, -0.32, 0.06);
    this.carriedDrinkAnchor.visible = false;
    this.camera.add(this.officeBasketballAnchor);
    this.officeBasketballAnchor.position.set(0.34, -0.42, -0.68);
    this.officeBasketballAnchor.rotation.set(0.08, -0.2, 0.08);
    this.officeBasketballAnchor.visible = false;
    this.officeBasketballAnchor.add(new Mesh(
      new SphereGeometry(0.15, 18, 14),
      new MeshStandardMaterial({
        color: 0xd76522,
        emissive: 0x2a0900,
        emissiveIntensity: 0.1,
        roughness: 0.54,
        metalness: 0.02,
      }),
    ));
    this.camera.add(this.officeGlassAnchor);
    this.officeGlassAnchor.position.set(0.36, -0.5, -0.58);
    this.officeGlassAnchor.rotation.set(0.16, -0.28, -0.08);
    this.officeGlassAnchor.visible = false;
    this.officeGlassAnchor.add(this.createOfficeGlassModel());
    this.camera.add(this.officeTabletAnchor);
    this.officeTabletAnchor.position.set(0.34, -0.36, -0.72);
    this.officeTabletAnchor.rotation.set(-0.1, -0.18, 0.04);
    this.officeTabletAnchor.visible = false;
    this.createOfficeTabletModel();
    this.camera.add(this.zombieWeaponAnchor);
    this.zombieWeaponAnchor.position.set(0.46, -0.36, -0.58);
    this.zombieWeaponAnchor.visible = false;
    this.camera.add(this.placementToolAnchor);
    this.placementToolAnchor.position.set(0.42, -0.38, -0.62);
    this.placementToolAnchor.rotation.set(-0.12, -0.28, 0.08);
    this.placementToolAnchor.visible = false;
    this.createPlacementToolModel();
    this.createPlacementPreviewModel();
    this.scene.add(this.placementMarkerRoot, this.placementPreview);
    this.placementPreview.visible = false;

    this.player.mount();

    this.hud.onEngage(() => {
      this.monsters.forEach((monster) => monster.resumeAudio());
      this.bearJumpScareAudio.resume();
      this.coffeeMachineAudio.resume();
      this.gameplaySfxAudio.resume();
      this.foxyPlayAudio.resume();
      this.lobbyCrashAudio.resume();
      this.partyShowAudio.resume();
      this.powerEventAudio.resume();
      this.player.lock();
    });
    this.hud.onChapterSelect(this.handleChapterSelection);
    this.hud.onOfficeJumpscareSelect(this.handleOfficeJumpscareSelection);
    this.hud.onOfficeModeSelect(this.handleOfficeModeSelection);
    this.player.controls.addEventListener('lock', this.handleLockChange);
    this.player.controls.addEventListener('unlock', this.handleLockChange);
    this.shell.root.addEventListener('click', this.handlePlayAreaClick);

    this.resizeObserver.observe(this.shell.viewport);
    this.resize();

    if (START_IN_CHAPTER_THREE) {
      this.beginOfficeChapter();
    } else if (START_IN_CHAPTER_TWO) {
      this.beginChapterTwo();
    } else {
      this.beginChapterOne();
    }

    this.syncHud();
  }

  start(): void {
    this.loop.start();
  }

  destroy(): void {
    this.loop.stop();
    this.resizeObserver.disconnect();
    this.player.controls.removeEventListener('lock', this.handleLockChange);
    this.player.controls.removeEventListener('unlock', this.handleLockChange);
    this.shell.root.removeEventListener('click', this.handlePlayAreaClick);
    this.input.destroy();
    this.player.destroy();
    this.monsters.forEach((monster) => monster.destroy());
    this.clearZombieBulletTracers();
    this.bearJumpScareAudio.destroy();
    this.coffeeMachineAudio.destroy();
    this.gameplaySfxAudio.destroy();
    this.foxyPlayAudio.destroy();
    this.lobbyCrashAudio.destroy();
    this.partyShowAudio.destroy();
    this.powerEventAudio.destroy();
    this.hud.destroy();
    this.renderer.dispose();
    this.shell.viewport.replaceChildren();
  }

  private readonly resize = (): void => {
    const width = Math.max(this.shell.viewport.clientWidth, 1);
    const height = Math.max(this.shell.viewport.clientHeight, 1);
    const renderScale = this.doomModeActive ? 0.22 : this.officeTabletCameraFeedActive ? 0.48 : 1;
    const renderWidth = Math.max(1, Math.round(width * renderScale));
    const renderHeight = Math.max(1, Math.round(height * renderScale));

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.officeTabletViewCamera.aspect = width / height;
    this.officeTabletViewCamera.updateProjectionMatrix();
    this.renderer.toneMapping = this.doomModeActive ? NoToneMapping : ACESFilmicToneMapping;
    this.renderer.setPixelRatio(this.doomModeActive ? 1 : Math.min(window.devicePixelRatio, 1.25));
    this.renderer.setSize(renderWidth, renderHeight, false);
    this.renderer.domElement.style.width = `${width}px`;
    this.renderer.domElement.style.height = `${height}px`;
    this.renderer.domElement.dataset.renderStyle = this.officeTabletCameraFeedActive ? 'camera-feed' : this.doomModeActive ? 'doom' : 'default';
  };

  private readonly handleLockChange = (): void => {
    this.hud.setLocked(this.player.isLocked());
    this.syncHud();
  };

  private readonly handlePlayAreaClick = (event: MouseEvent): void => {
    if (this.player.isLocked()) {
      return;
    }

    if (this.chapterMenuOpen || this.officeJumpscareMenuOpen || this.officeModeMenuOpen) {
      return;
    }

    if (event.target instanceof Element && event.target.closest('.hud__intro, .hud__chapter-menu, .hud__office-jumpscare-menu, .hud__office-mode-menu')) {
      return;
    }

    this.monsters.forEach((monster) => monster.resumeAudio());
    this.bearJumpScareAudio.resume();
    this.coffeeMachineAudio.resume();
    this.gameplaySfxAudio.resume();
    this.foxyPlayAudio.resume();
    this.lobbyCrashAudio.resume();
    this.partyShowAudio.resume();
    this.powerEventAudio.resume();
    this.player.lock();
  };

  private readonly handleChapterSelection = (chapterId: HudChapterId): void => {
    if (chapterId === 'chapter-1') {
      this.beginChapterOne();
    } else if (chapterId === 'chapter-2') {
      this.beginChapterTwo();
    } else if (chapterId === 'chapter-3') {
      this.beginOfficeChapter();
    } else if (chapterId === 'doom-fps') {
      this.beginDoomMode();
    } else {
      this.beginZombieMode();
    }

    this.setChapterMenuOpen(false);
    this.syncHud();
  };

  private readonly handleOfficeJumpscareSelection = (jumpscareId: string): void => {
    const definition = OFFICE_JUMPSCARE_DEFINITIONS.find((entry) => entry.id === jumpscareId);
    if (!definition || !this.officeChapterActive) {
      return;
    }

    this.startOfficeJumpscare(definition, this.officeJumpscareMenuOpen);
    this.syncHud();
  };

  private readonly handleOfficeModeSelection = (selectionId: string): void => {
    if (!this.officeChapterActive) {
      return;
    }

    if (selectionId === 'mode:creator') {
      this.applyOfficeMode('creator');
      this.setOfficeModeMenuOpen(false);
      return;
    }

    if (selectionId === 'mode:night' || selectionId === 'mode:game') {
      this.officeModeMenuPendingMode = selectionId === 'mode:night' ? 'night' : 'game';
      this.officeModeMenuStep = 'difficulty';
      this.syncHud();
      return;
    }

    if (!selectionId.startsWith('difficulty:') || !this.officeModeMenuPendingMode) {
      return;
    }

    const difficulty = selectionId.slice('difficulty:'.length) as OfficeGameModeDifficulty;
    if (difficulty !== 'easy' && difficulty !== 'normal' && difficulty !== 'hard') {
      return;
    }

    this.applyOfficeMode(this.officeModeMenuPendingMode, difficulty);
    this.setOfficeModeMenuOpen(false);
  };

  private setChapterMenuOpen(open: boolean): void {
    if (this.chapterMenuOpen === open) {
      this.syncHud();
      return;
    }

    this.chapterMenuOpen = open;
    if (open) {
      this.officeJumpscareMenuOpen = false;
      this.officeModeMenuOpen = false;
    }

    if (open && this.player.isLocked()) {
      this.player.controls.unlock();
      return;
    }

    this.syncHud();
  }

  private setOfficeJumpscareMenuOpen(open: boolean): void {
    if (!this.officeChapterActive) {
      open = false;
    }

    if (this.officeJumpscareMenuOpen === open) {
      this.syncHud();
      return;
    }

    this.officeJumpscareMenuOpen = open;
    if (open) {
      this.setChapterMenuOpen(false);
      this.officeModeMenuOpen = false;
    }

    if (open && this.player.isLocked()) {
      this.player.controls.unlock();
      return;
    }

    this.syncHud();
  }

  private setOfficeModeMenuOpen(open: boolean): void {
    if (!this.officeChapterActive) {
      open = false;
    }

    if (this.officeModeMenuOpen === open) {
      this.syncHud();
      return;
    }

    this.officeModeMenuOpen = open;
    if (open) {
      this.setChapterMenuOpen(false);
      this.officeJumpscareMenuOpen = false;
      this.officeModeMenuStep = 'mode';
      this.officeModeMenuPendingMode = null;
    } else {
      this.officeModeMenuStep = 'mode';
      this.officeModeMenuPendingMode = null;
    }

    if (open && this.player.isLocked()) {
      this.player.controls.unlock();
      return;
    }

    this.syncHud();
  }

  private readonly update = (deltaSeconds: number): void => {
    this.elapsed += deltaSeconds;
    this.transientStatusTime = Math.max(this.transientStatusTime - deltaSeconds, 0);
    this.chapterTwoCardTime = Math.max(this.chapterTwoCardTime - deltaSeconds, 0);
    this.chapterTwoEggQuestNoticeTime = Math.max(this.chapterTwoEggQuestNoticeTime - deltaSeconds, 0);
    this.chapterTwoDodoTrailNoticeTime = Math.max(this.chapterTwoDodoTrailNoticeTime - deltaSeconds, 0);
    this.chapterTwoPowerOutageNoticeTime = Math.max(this.chapterTwoPowerOutageNoticeTime - deltaSeconds, 0);
    this.updateChapterExit(deltaSeconds);
    this.updateChapterTwoCoffee(deltaSeconds);
    this.updateCoffeeBoost(deltaSeconds);
    if (this.chapterTwoActive && this.chapterTwoBearRefusalTimer > 0) {
      this.chapterTwoBearRefusalTimer = Math.max(0, this.chapterTwoBearRefusalTimer - deltaSeconds);
      if (this.chapterTwoBearRefusalTimer <= 0) {
        this.chapterTwo.setAftermathBearRefusalScare(0);
        this.beginChapterTwo();
        this.pushStatus('The teddy bear monster lunges at you. Chapter two resets.', 3.2);
        return;
      }
    }

    const officeJumpscareActive = this.activeOfficeJumpscare !== null || this.officeCameraPuppetPhase === 'jumpscare';
    const jumpscareLocked = this.activeJumpscare !== null || officeJumpscareActive;
    const chapterTwoSeated = this.chapterTwoActive && this.chapterTwoSeatId !== null;
    const chapterTwoClimbing = this.chapterTwoActive && this.chapterTwoClimb !== null;
    const chapterTwoSliding = this.chapterTwoActive && this.chapterTwoSlide !== null;
    const chapterTwoBearRefusing = this.chapterTwoActive && this.chapterTwoBearRefusalTimer > 0;
    const chapterTwoDodoNightAttacking = this.chapterTwoActive && this.chapterTwoDodoNightAttack !== null;
    const officeSeated = this.officeChapterActive && this.officeChapterSeated;
    const officeTabletViewing = this.officeChapterActive && this.officeTabletCameraFeedActive;
    const officeBallPitHiding = this.officeChapterActive && this.officeBallPitHidden;
    const officeBallPitSliding = this.officeChapterActive && this.officeBallPitSlide !== null;
    const officeVentActive = this.officeChapterActive && this.officeVentActive;
    const officeVentDropping = this.officeChapterActive && this.officeVentDrop !== null;
    this.zombieFireCooldown = Math.max(0, this.zombieFireCooldown - deltaSeconds);
    this.zombieWeaponKick = Math.max(0, this.zombieWeaponKick - deltaSeconds * 6.8);

    if (!jumpscareLocked && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitSliding && !officeVentDropping && this.input.consumeChapterMenuToggle()) {
      this.setChapterMenuOpen(!this.chapterMenuOpen);
    }

    const officeJumpscareMenuToggle = this.input.consumeOfficeJumpscareMenuToggle();
    if (!jumpscareLocked && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitSliding && !officeVentDropping && this.officeChapterActive && !this.officeModeMenuOpen && officeJumpscareMenuToggle) {
      this.setOfficeJumpscareMenuOpen(!this.officeJumpscareMenuOpen);
    }

    const modeOrToolToggle = this.input.consumePlacementToolToggle();
    if (!jumpscareLocked && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitSliding && !officeVentDropping && !this.chapterMenuOpen && !this.officeJumpscareMenuOpen && modeOrToolToggle) {
      if (this.officeChapterActive) {
        this.setOfficeModeMenuOpen(!this.officeModeMenuOpen);
      } else {
        this.setPlacementToolActive(!this.placementToolActive);
      }
    }

    if (!jumpscareLocked && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoBearRefusing && !chapterTwoDodoNightAttacking && this.chapterTwoActive && this.chapterTwoBearChoicePending && !this.chapterMenuOpen) {
      if (this.input.consumeChoiceYes()) {
        this.acceptChapterTwoBearQuest();
      } else if (this.input.consumeChoiceNo()) {
        this.refuseChapterTwoBearQuest();
      }
    }

    const hotbarSlot = this.input.consumeHotbarSlot();
    if (!jumpscareLocked && !chapterTwoDodoNightAttacking && !officeBallPitSliding && !officeVentDropping && !this.chapterMenuOpen && !this.officeJumpscareMenuOpen && !this.officeModeMenuOpen && this.officeChapterActive && hotbarSlot) {
      if (this.officeTabletCameraFeedActive) {
        this.selectOfficeTabletCameraBySlot(hotbarSlot);
      } else {
        this.handleOfficeHotbarSlot(hotbarSlot);
      }
    }

    const weaponSelect = this.input.consumeWeaponSelect();
    if (this.zombieModeActive && weaponSelect) {
      this.selectZombieWeapon(weaponSelect);
    } else if (this.doomModeActive && weaponSelect) {
      this.selectDoomWeapon(weaponSelect);
    }

    if (!chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && this.input.consumeFlashlightToggle()) {
      this.flashlight.toggle();
    }

    const movementState = this.input.getMovementState();
    const jumpRequested = !this.doomModeActive
      && !jumpscareLocked
      && !chapterTwoBearRefusing
      && !chapterTwoSeated
      && !chapterTwoClimbing
      && !chapterTwoSliding
      && !chapterTwoDodoNightAttacking
      && !officeSeated
      && !officeTabletViewing
      && !officeBallPitHiding
      && !officeBallPitSliding
      && !officeVentActive
      && !officeVentDropping
      && this.input.consumeJump();
    const isTryingToMove = movementState.forward !== 0 || movementState.strafe !== 0;
    const sprinting = this.doomModeActive
      ? this.player.isLocked() && !jumpscareLocked && !chapterTwoSeated && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeSeated && !officeTabletViewing && !officeBallPitHiding && !officeVentActive && !officeVentDropping && isTryingToMove
      : this.player.isLocked()
        && !jumpscareLocked
        && !chapterTwoBearRefusing
        && !chapterTwoSeated
        && !chapterTwoClimbing
        && !chapterTwoSliding
        && !chapterTwoDodoNightAttacking
        && !officeSeated
        && !officeTabletViewing
        && !officeBallPitHiding
        && !officeBallPitSliding
        && !officeVentActive
        && !officeVentDropping
        && isTryingToMove
        && movementState.sprint
        && this.stamina > 0.5;

    const effectiveMovement = jumpscareLocked
      ? { forward: 0, strafe: 0, sprint: false }
      : chapterTwoDodoNightAttacking
        ? { forward: 0, strafe: 0, sprint: false }
      : chapterTwoSeated
        ? { forward: 0, strafe: 0, sprint: false }
      : chapterTwoBearRefusing
        ? { forward: 0, strafe: 0, sprint: false }
      : chapterTwoClimbing
        ? { forward: 0, strafe: 0, sprint: false }
      : chapterTwoSliding
        ? { forward: 0, strafe: 0, sprint: false }
      : officeSeated
        ? { forward: 0, strafe: 0, sprint: false }
      : officeTabletViewing
        ? { forward: 0, strafe: 0, sprint: false }
      : officeBallPitHiding
        ? { forward: 0, strafe: 0, sprint: false }
      : officeBallPitSliding
        ? { forward: 0, strafe: 0, sprint: false }
      : officeVentDropping
        ? { forward: 0, strafe: 0, sprint: false }
      : officeVentActive
        ? { ...movementState, sprint: false }
      : this.doomModeActive
        ? { forward: movementState.forward, strafe: movementState.strafe, sprint: isTryingToMove }
      : sprinting
        ? movementState
        : { ...movementState, sprint: false };

    if (!jumpscareLocked && !chapterTwoBearRefusing && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitHiding && !officeBallPitSliding && !officeVentDropping && this.input.consumeDrop()) {
      this.handleDrop();
    }

    if (!jumpscareLocked && !chapterTwoBearRefusing && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitSliding && !officeVentDropping && this.input.consumeUseItem()) {
      this.handleUseItem();
    }

    if (!jumpscareLocked && !chapterTwoBearRefusing && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitHiding && !officeBallPitSliding && !officeVentDropping && this.input.consumePlacementMarkerDelete() && this.placementToolActive) {
      this.handlePlacementToolRightClick();
    }

    if (!jumpscareLocked && !chapterTwoBearRefusing && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitHiding && !officeBallPitSliding && !officeVentDropping && this.input.consumeFire()) {
      if (this.officeChapterActive && (this.officeTabletHeld || this.officeTabletCameraFeedActive)) {
        this.toggleOfficeTabletCameraFeed();
      } else if (this.placementToolActive) {
        this.placePlacementMarker();
      } else {
        this.handleFire();
      }
    }

    this.chapterTwo.setSwingInput(
      this.chapterTwoActive && !chapterTwoDodoNightAttacking && this.chapterTwoSeatId === 'dodo-room-swing'
        ? Math.max(0, movementState.forward)
        : 0,
    );
    this.player.setSupportedFloor(this.getSupportedFloorHeight());
    const playerPositionBeforeMove = this.player.getPosition().clone();
    this.player.update(
      deltaSeconds,
      effectiveMovement,
      jumpRequested,
      !officeVentActive && !officeVentDropping,
      officeVentActive ? 0.42 : 1,
    );
    if (officeVentActive) {
      this.constrainOfficeVentPosition();
    }
    if (officeVentDropping) {
      this.updateOfficeVentDropAnimation(deltaSeconds);
    }
    if (officeBallPitSliding) {
      this.updateOfficeBallPitSlideAnimation(deltaSeconds);
    }
    const playerPositionAfterMove = this.player.getPosition();
    const horizontalMoveDistance = Math.hypot(
      playerPositionAfterMove.x - playerPositionBeforeMove.x,
      playerPositionAfterMove.z - playerPositionBeforeMove.z,
    );
    const playerInOfficeBallPit = this.isPlayerInOfficeBallPit(playerPositionAfterMove);
    if (this.officeBallPitHidden && !playerInOfficeBallPit) {
      this.officeBallPitHidden = false;
    }
    this.gameplaySfxAudio.updateBallPitRustle(
      deltaSeconds,
      this.player.isLocked()
        && !this.chapterMenuOpen
        && this.officeChapterActive
        && playerInOfficeBallPit
        && !this.officeBallPitHidden
        && horizontalMoveDistance > 0.001,
    );
    this.gameplaySfxAudio.updateFootsteps(
      deltaSeconds,
      this.player.isLocked()
        && !this.chapterMenuOpen
        && !playerInOfficeBallPit
        && horizontalMoveDistance > 0.001,
      effectiveMovement.sprint,
    );
    this.updateStamina(deltaSeconds, sprinting);
    this.updateChapterTwoClimb(deltaSeconds);
    this.updateChapterTwoSlide(deltaSeconds);

    if (this.zombieModeActive) {
      this.updateZombieMode(deltaSeconds);
    } else if (this.doomModeActive) {
      this.updateDoomMode(deltaSeconds);
    } else if (this.chapterTwoActive || this.officeChapterActive) {
      this.monsterState = this.unlockedMonsterState;
      this.touchingMonster = null;
    } else {
      this.updateMonster(deltaSeconds);
    }
    this.updateHealth(deltaSeconds);
    this.updateAtmosphere();
    if (!this.chapterTwoActive && !this.officeChapterActive && !this.zombieModeActive && !this.doomModeActive) {
      this.updateVenueLights();
    }
    this.updateOfficeGlassThrows(deltaSeconds);
    this.updateOfficeJumpscare(deltaSeconds);
    this.updateJumpScareLens(deltaSeconds);
    if (!this.chapterTwoActive && !this.officeChapterActive && !this.zombieModeActive && !this.doomModeActive) {
      this.updateMachineJobs(deltaSeconds);
    }

    if (!jumpscareLocked && !chapterTwoBearRefusing && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitHiding && !officeBallPitSliding && !officeVentDropping && this.input.consumeInteract()) {
      this.handleInteract();
    }

    if (this.chapterTwoActive) {
      const refusalProgress = this.chapterTwoBearRefusalTimer > 0
        ? MathUtils.clamp(
          1 - this.chapterTwoBearRefusalTimer / CHAPTER_TWO_BEAR_REFUSAL_DURATION,
          0,
          1,
        )
        : 0;
      this.chapterTwo.setAftermathBearRefusalScare(refusalProgress);
    }

    if (this.zombieModeActive) {
      this.zombieMode.update(deltaSeconds, this.getZombieNightBlend());
    } else if (this.doomModeActive) {
      this.doomMode.update(deltaSeconds);
    } else if (this.officeChapterActive) {
      this.officeChapter.update(deltaSeconds, this.player.getPosition());
      this.updateOfficePrizeWheelAudio();
      this.updateOfficeVentDrop();
      this.updateOfficeModeCycle(deltaSeconds);
      this.updateOfficeGameMode(deltaSeconds);
      this.updateOfficeCameraPuppetThreat(deltaSeconds);
    } else if (!this.chapterTwoActive && !this.officeChapterActive) {
      this.level.stationAnimator.update(deltaSeconds);
    } else if (this.chapterTwoActive) {
      this.chapterTwo.update(deltaSeconds, this.player.getPosition());
      if (this.chapterTwoDodoNightAttack) {
        if (this.updateChapterTwoDodoNightAttack(deltaSeconds)) {
          this.syncHud();
          this.renderScene();
          return;
        }
      }
      if (this.chapterTwoBearRefusalTimer > 0) {
        const focus = this.chapterTwo.getAftermathBearFocusPosition(this.chapterTwoBearLookTarget);
        if (focus) {
          this.player.lookToward(
            focus,
            0.84 + this.getChapterTwoBearRefusalIntensity() * 0.14,
          );
        }
      }
      if (!this.chapterTwoDodoNightAttack && this.chapterTwoDodoTrailActive && !this.chapterTwoPowerOutageTriggered) {
        if (
          this.player.getPosition().distanceTo(this.chapterTwo.dodoPuzzle.position)
            <= GAME_CONFIG.player.interactionRange + 1.1
        ) {
          if (!this.chapterTwoDodoPowerRipSoundPlayed) {
            this.gameplaySfxAudio.playClosetDoor(true);
            this.gameplaySfxAudio.playSmallPanel(true);
            this.chapterTwoDodoPowerRipSoundPlayed = true;
          }
          this.chapterTwo.startDodoPowerRipAnimation();
        }

        if (this.chapterTwo.isDodoPowerRipAnimationComplete()) {
          this.triggerChapterTwoPowerOutage();
        }
      }
    }
    this.partyShowAudio.update(
      deltaSeconds,
      this.officeChapterActive && this.officeChapter.isPartyShowMusicActive(),
      this.officeChapter.getPartyShowMusicTime(),
    );
    if (this.chapterTwoActive && this.chapterTwoSeatId) {
      const occupiedSeat = this.getChapterTwoSeatById(this.chapterTwoSeatId);
      if (occupiedSeat?.kind === 'swing') {
        this.player.teleport(occupiedSeat.sitPosition);
      }
    }
    if (!this.zombieModeActive && !this.doomModeActive) {
      this.updateCarriedPlateDisplay(isTryingToMove && !jumpscareLocked && !chapterTwoDodoNightAttacking);
    }
    this.updateCarriedDrinkDisplay(deltaSeconds);
    this.updateZombieWeaponDisplay(deltaSeconds, isTryingToMove && !jumpscareLocked, sprinting);
    this.updateZombieBulletTracers(deltaSeconds);
    this.updatePlacementToolDisplay();
    this.updateOfficeTabletDisplay();
    this.updateOfficeGlassDisplay();
    if (!this.chapterTwoActive && !this.officeChapterActive && !this.zombieModeActive && !this.doomModeActive) {
      this.updateStoveLight();
    }
    this.syncHud();
    this.renderScene();
  };

  private renderScene(): void {
    if (this.officeChapterActive && this.officeTabletCameraFeedActive) {
      const camera = this.getActiveOfficeTabletCamera();
      if (camera) {
        this.updateOfficeTabletViewCamera(camera);
        this.renderer.render(this.scene, this.officeTabletViewCamera);
        return;
      }

      this.officeTabletCameraFeedActive = false;
      this.resize();
    }

    this.renderer.render(this.scene, this.camera);
  }

  private updateOfficeTabletViewCamera(securityCamera: OfficeChapterData['securityCameras'][number]): void {
    const viewAnchor = securityCamera.viewAnchor;
    viewAnchor.getWorldPosition(this.officeTabletViewPosition);
    viewAnchor.getWorldQuaternion(this.officeTabletViewQuaternion);
    this.officeTabletViewCamera.position.copy(this.officeTabletViewPosition);
    this.officeTabletViewCamera.quaternion.copy(this.officeTabletViewQuaternion);
  }

  private updateStamina(deltaSeconds: number, sprinting: boolean): void {
    if (this.doomModeActive) {
      this.stamina = GAME_CONFIG.player.staminaMax;
      return;
    }

    if (this.coffeeBoostRemaining > 0) {
      this.stamina = GAME_CONFIG.player.staminaMax;
      return;
    }

    if (sprinting) {
      this.stamina = Math.max(
        0,
        this.stamina - GAME_CONFIG.player.staminaDrainPerSecond * deltaSeconds,
      );
      return;
    }

    this.stamina = Math.min(
      GAME_CONFIG.player.staminaMax,
      this.stamina + GAME_CONFIG.player.staminaRecoverPerSecond * deltaSeconds,
    );
  }

  private updateCoffeeBoost(deltaSeconds: number): void {
    this.coffeeBoostRemaining = Math.max(0, this.coffeeBoostRemaining - deltaSeconds);
  }

  private createOfficeGlassModel(): Group {
    const root = new Group();
    const glassMaterial = new MeshStandardMaterial({
      color: 0xcfefff,
      emissive: 0x2c8090,
      emissiveIntensity: 0.18,
      roughness: 0.05,
      metalness: 0.02,
      transparent: true,
      opacity: 0.42,
    });
    const rimMaterial = new MeshStandardMaterial({
      color: 0xf2ffff,
      emissive: 0x4fc6d8,
      emissiveIntensity: 0.2,
      roughness: 0.12,
      metalness: 0.08,
      transparent: true,
      opacity: 0.64,
    });
    const handMaterial = new MeshStandardMaterial({
      color: 0xc88c65,
      roughness: 0.7,
      metalness: 0.02,
    });

    const hand = new Mesh(new BoxGeometry(0.22, 0.14, 0.16), handMaterial);
    hand.position.set(0.02, -0.08, 0.08);
    hand.rotation.set(0.08, -0.28, 0.04);

    const thumb = new Mesh(new CylinderGeometry(0.028, 0.035, 0.24, 10), handMaterial);
    thumb.position.set(-0.1, 0.005, -0.01);
    thumb.rotation.set(0.7, 0.16, -0.74);

    const finger = new Mesh(new CylinderGeometry(0.026, 0.031, 0.24, 10), handMaterial);
    finger.position.set(0.1, 0.012, -0.02);
    finger.rotation.set(0.66, -0.16, 0.56);

    const glass = new Mesh(new CylinderGeometry(0.082, 0.065, 0.28, 22, 1, true), glassMaterial);
    glass.position.set(0, 0.08, -0.12);
    glass.rotation.x = 0.1;

    const rim = new Mesh(new TorusGeometry(0.082, 0.006, 8, 22), rimMaterial);
    rim.position.set(0, 0.223, -0.12);
    rim.rotation.x = Math.PI / 2 + 0.1;

    const base = new Mesh(new CylinderGeometry(0.058, 0.058, 0.012, 20), rimMaterial);
    base.position.set(0, -0.062, -0.12);
    base.rotation.x = 0.1;

    root.add(hand, thumb, finger, glass, rim, base);
    return root;
  }

  private createOfficeTabletModel(): void {
    const frameMaterial = new MeshStandardMaterial({
      color: 0x111820,
      emissive: 0x010508,
      emissiveIntensity: 0.18,
      roughness: 0.34,
      metalness: 0.24,
    });
    const screenMaterial = new MeshStandardMaterial({
      color: 0x07131b,
      emissive: 0x1f7fa0,
      emissiveIntensity: 0.42,
      roughness: 0.18,
      metalness: 0.08,
    });
    const buttonMaterial = new MeshStandardMaterial({
      color: 0xd7e8ef,
      emissive: 0x205b6a,
      emissiveIntensity: 0.24,
      roughness: 0.34,
      metalness: 0.18,
    });
    const handMaterial = new MeshStandardMaterial({
      color: 0xc88c65,
      roughness: 0.7,
      metalness: 0.02,
    });

    const tablet = new Mesh(new BoxGeometry(0.56, 0.36, 0.05), frameMaterial);
    tablet.rotation.z = -0.035;

    const screen = new Mesh(new BoxGeometry(0.46, 0.26, 0.014), screenMaterial);
    screen.position.set(0, 0.018, 0.033);
    screen.rotation.z = tablet.rotation.z;

    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 216;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#07131b';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = '#45d7ff';
      context.lineWidth = 8;
      context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
      context.fillStyle = '#bdf6ff';
      context.font = '700 36px Trebuchet MS, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('CAM 06', canvas.width / 2, 82);
      context.font = '600 22px Trebuchet MS, sans-serif';
      context.fillText('LEFT CLICK TO VIEW', canvas.width / 2, 132);
      context.fillStyle = '#ff3131';
      context.beginPath();
      context.arc(62, 62, 12, 0, Math.PI * 2);
      context.fill();
    }

    const screenLabel = new Mesh(
      new PlaneGeometry(0.43, 0.24),
      new MeshBasicMaterial({
        map: new CanvasTexture(canvas),
        transparent: true,
        side: DoubleSide,
      }),
    );
    screenLabel.position.set(0, 0.018, 0.042);
    screenLabel.rotation.z = tablet.rotation.z;

    const homeButton = new Mesh(new CylinderGeometry(0.022, 0.022, 0.012, 18), buttonMaterial);
    homeButton.rotation.x = Math.PI / 2;
    homeButton.position.set(0, -0.157, 0.044);

    const leftHand = new Mesh(new BoxGeometry(0.16, 0.1, 0.12), handMaterial);
    leftHand.position.set(-0.25, -0.13, -0.01);
    leftHand.rotation.set(0.08, -0.28, 0.22);

    const rightHand = new Mesh(new BoxGeometry(0.16, 0.1, 0.12), handMaterial);
    rightHand.position.set(0.25, -0.13, -0.01);
    rightHand.rotation.set(0.08, 0.28, -0.22);

    this.officeTabletAnchor.add(tablet, screen, screenLabel, homeButton, leftHand, rightHand);
  }

  private createPlacementToolModel(): void {
    const pencilMaterial = new MeshStandardMaterial({
      color: 0xf1bc35,
      emissive: 0x2a1700,
      emissiveIntensity: 0.12,
      roughness: 0.5,
      metalness: 0.04,
    });
    const woodMaterial = new MeshStandardMaterial({
      color: 0xd6a26f,
      roughness: 0.68,
      metalness: 0.02,
    });
    const graphiteMaterial = new MeshStandardMaterial({
      color: 0x1a1f22,
      emissive: 0x030506,
      emissiveIntensity: 0.1,
      roughness: 0.46,
      metalness: 0.18,
    });
    const ferruleMaterial = new MeshStandardMaterial({
      color: 0xc8ced0,
      roughness: 0.28,
      metalness: 0.74,
    });
    const eraserMaterial = new MeshStandardMaterial({
      color: 0xeb717b,
      roughness: 0.62,
      metalness: 0.02,
    });
    const handMaterial = new MeshStandardMaterial({
      color: 0xc88c65,
      roughness: 0.7,
      metalness: 0.02,
    });
    const laserCoreMaterial = new MeshBasicMaterial({
      color: 0xff1c1c,
      transparent: true,
      opacity: 0.92,
    });
    const laserGlowMaterial = new MeshBasicMaterial({
      color: 0xff3a2e,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    });

    const pencilBody = new Mesh(new CylinderGeometry(0.046, 0.046, 0.74, 6), pencilMaterial);
    pencilBody.rotation.x = Math.PI / 2;
    pencilBody.position.set(0, 0.06, -0.17);
    pencilBody.rotation.z = Math.PI / 6;

    const woodTip = new Mesh(new CylinderGeometry(0.012, 0.054, 0.17, 14), woodMaterial);
    woodTip.rotation.x = Math.PI / 2;
    woodTip.position.set(0, 0.06, -0.62);

    const graphiteTip = new Mesh(new CylinderGeometry(0.004, 0.017, 0.08, 10), graphiteMaterial);
    graphiteTip.rotation.x = Math.PI / 2;
    graphiteTip.position.set(0, 0.06, -0.74);

    const ferrule = new Mesh(new CylinderGeometry(0.05, 0.05, 0.11, 16), ferruleMaterial);
    ferrule.rotation.x = Math.PI / 2;
    ferrule.position.set(0, 0.06, 0.25);

    const eraser = new Mesh(new CylinderGeometry(0.047, 0.047, 0.13, 16), eraserMaterial);
    eraser.rotation.x = Math.PI / 2;
    eraser.position.set(0, 0.06, 0.37);

    const handPalm = new Mesh(new BoxGeometry(0.24, 0.16, 0.18), handMaterial);
    handPalm.position.set(0.01, -0.08, 0.02);
    handPalm.rotation.set(0.12, -0.18, 0.1);

    const thumb = new Mesh(new CylinderGeometry(0.035, 0.04, 0.22, 10), handMaterial);
    thumb.position.set(-0.1, 0, -0.04);
    thumb.rotation.set(0.74, 0.2, -0.66);

    const finger = new Mesh(new CylinderGeometry(0.028, 0.034, 0.26, 10), handMaterial);
    finger.position.set(0.11, 0, -0.05);
    finger.rotation.set(0.68, -0.18, 0.52);

    const laserGlow = new Mesh(new CylinderGeometry(0.024, 0.034, 2.65, 14), laserGlowMaterial);
    laserGlow.rotation.x = Math.PI / 2;
    laserGlow.position.set(0, 0.06, -2.13);

    const laserCore = new Mesh(new CylinderGeometry(0.006, 0.01, 2.65, 10), laserCoreMaterial);
    laserCore.rotation.x = Math.PI / 2;
    laserCore.position.set(0, 0.06, -2.13);

    this.placementToolAnchor.add(
      handPalm,
      thumb,
      finger,
      pencilBody,
      woodTip,
      graphiteTip,
      ferrule,
      eraser,
      laserGlow,
      laserCore,
    );
  }

  private createPlacementPreviewModel(): void {
    this.placementPreview.name = 'Placement Marker Preview';
    this.placementPreview.userData.placementToolIgnore = true;
    this.addPlacementMarkerGeometry(this.placementPreview, 0x45eadf, 0.52);
  }

  private addPlacementMarkerGeometry(root: Group, color: number, opacity: number): void {
    const transparent = opacity < 1;
    const markerMaterial = new MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.28,
      roughness: 0.36,
      metalness: 0.08,
      transparent,
      opacity,
    });
    const darkMaterial = new MeshStandardMaterial({
      color: 0x123136,
      emissive: 0x061517,
      emissiveIntensity: 0.16,
      roughness: 0.5,
      metalness: 0.18,
      transparent,
      opacity: transparent ? Math.min(1, opacity + 0.24) : 1,
    });

    const ring = new Mesh(new TorusGeometry(0.34, 0.024, 8, 36), markerMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.018;

    const center = new Mesh(new CylinderGeometry(0.075, 0.075, 0.025, 18), markerMaterial);
    center.position.y = 0.02;

    const pin = new Mesh(new CylinderGeometry(0.025, 0.025, 0.42, 10), darkMaterial);
    pin.position.y = 0.23;

    const cap = new Mesh(new SphereGeometry(0.085, 14, 10), markerMaterial);
    cap.position.y = 0.46;

    root.add(ring, center, pin, cap);
  }

  private createPlacementMarkerLabel(markerId: number): Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 96;
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = 'rgba(10, 36, 40, 0.88)';
      context.strokeStyle = 'rgba(82, 244, 229, 0.95)';
      context.lineWidth = 5;
      context.roundRect(8, 10, 176, 76, 18);
      context.fill();
      context.stroke();
      context.fillStyle = '#eafffb';
      context.font = '700 44px Trebuchet MS, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(`#${markerId}`, 96, 49);
    }

    const texture = new CanvasTexture(canvas);
    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: DoubleSide,
    });
    const label = new Mesh(new PlaneGeometry(0.72, 0.36), material);
    label.position.y = 0.72;
    label.userData.placementToolIgnore = true;
    return label;
  }

  private setPlacementToolActive(active: boolean): void {
    if (this.placementToolActive === active) {
      return;
    }

    this.placementToolActive = active;
    if (active) {
      this.officeTabletHeld = false;
      this.officeTabletCameraFeedActive = false;
      this.officeTabletAnchor.visible = false;
      this.officeGlassHeld = false;
      this.officeGlassAnchor.visible = false;
    }
    if (!active) {
      this.placementPreview.visible = false;
    }

    this.pushStatus(
      active
        ? 'Coordinate Tool equipped. Look at a surface and left click to drop a marker.'
        : 'Coordinate Tool put away.',
      active ? 3.4 : 1.6,
    );
  }

  private handleOfficeHotbarSlot(slot: number): void {
    if (slot === 1) {
      this.setPlacementToolActive(true);
      return;
    }

    if (slot === 2) {
      if (this.officeTabletCameraFeedActive) {
        this.officeTabletCameraFeedActive = false;
      }
      this.setOfficeTabletHeld(true);
    }
  }

  private getActiveOfficeTabletCamera(): OfficeChapterData['securityCameras'][number] | null {
    const cameras = this.officeChapter.securityCameras;
    if (cameras.length === 0) {
      return null;
    }

    this.officeTabletCameraIndex = MathUtils.clamp(
      this.officeTabletCameraIndex,
      0,
      cameras.length - 1,
    );
    return cameras[this.officeTabletCameraIndex] ?? null;
  }

  private getOfficeTabletCameraSlots(): TabletCameraSlotView[] {
    this.getActiveOfficeTabletCamera();
    return this.officeChapter.securityCameras.map((camera, index) => ({
      key: index === 9 ? '0' : String(index + 1),
      label: camera.label,
      active: index === this.officeTabletCameraIndex,
    }));
  }

  private getOfficeJumpscareOptions(): OfficeJumpscareOptionView[] {
    return OFFICE_JUMPSCARE_DEFINITIONS.map((definition) => ({
      id: definition.id,
      label: definition.label,
      body: definition.body,
    }));
  }

  private getRandomOfficeJumpscareDefinition(animatronic: OfficeJumpscareAnimatronic): OfficeJumpscareDefinition | null {
    const definitions = OFFICE_JUMPSCARE_DEFINITIONS.filter((definition) => definition.animatronic === animatronic);
    if (definitions.length === 0) {
      return null;
    }

    return definitions[Math.floor(Math.random() * definitions.length)] ?? definitions[0] ?? null;
  }

  private selectOfficeTabletCameraBySlot(slot: number): void {
    const cameras = this.officeChapter.securityCameras;
    if (slot < 1 || slot > cameras.length) {
      this.pushStatus(`No Camera ${slot} is installed yet.`, 1.6);
      return;
    }

    this.officeTabletCameraIndex = slot - 1;
    const camera = this.getActiveOfficeTabletCamera();
    this.pushStatus(`${camera?.label ?? `Camera ${slot}`} selected.`, 1.4);
  }

  private setOfficeTabletHeld(held: boolean): void {
    if (this.officeTabletHeld === held && (!held || !this.officeTabletCameraFeedActive)) {
      return;
    }

    this.officeTabletHeld = held;
    if (held) {
      this.setPlacementToolActive(false);
      this.officeTabletCameraFeedActive = false;
      this.officeGlassHeld = false;
      this.officeGlassAnchor.visible = false;
    } else {
      this.officeTabletCameraFeedActive = false;
      this.officeTabletAnchor.visible = false;
    }

    this.pushStatus(
      held
        ? 'Tablet equipped. Left click to open the camera list.'
        : 'Tablet put away.',
      held ? 2.8 : 1.4,
    );
  }

  private resetOfficeTabletState(): void {
    this.officeTabletHeld = false;
    this.officeTabletCameraFeedActive = false;
    this.officeTabletCameraIndex = 0;
    this.officeTabletAnchor.visible = false;
    this.clearOfficeCameraPuppetThreat();
    this.officeBallPitHidden = false;
    this.officeBallPitSlide = null;
    this.officeVentActive = false;
    this.officeVentDrop = null;
    this.officeJumpscareMenuOpen = false;
    this.stopOfficeJumpscare();
    this.officeGlassHeld = false;
    this.officeGlassAnchor.visible = false;
    this.clearOfficeGlassThrows();
  }

  private canOfficeCameraPuppetThreatRun(): boolean {
    return this.officeChapterActive
      && this.officeGameModeActive
      && this.officeGameModeDifficulty === 'hard'
      && (this.officeMode === 'night' || this.officeMode === 'game')
      && !this.officeGameModePowerOut
      && this.officeGameModePower > 0
      && this.activeOfficeJumpscare === null;
  }

  private clearOfficeCameraPuppetThreat(): void {
    this.officeCameraPuppetPhase = 'idle';
    this.officeCameraPuppetTimer = 0;
  }

  private maybeStartOfficeCameraPuppetThreat(): void {
    if (
      this.officeCameraPuppetPhase !== 'idle'
      || !this.officeTabletCameraFeedActive
      || !this.canOfficeCameraPuppetThreatRun()
      || Math.random() >= OFFICE_CAMERA_PUPPET_CHANCE
    ) {
      return;
    }

    this.officeCameraPuppetPhase = 'camera-face';
    this.officeCameraPuppetTimer = OFFICE_CAMERA_PUPPET_CAMERA_FAIL_SECONDS;
    this.gameplaySfxAudio.resume();
    this.gameplaySfxAudio.playOfficeJumpscareCue('curtain-snap');
    this.pushStatus('A crying puppet face fills the camera. Drop the tablet now.', 2.2);
  }

  private handleOfficeCameraPuppetFeedClosed(): void {
    if (this.officeCameraPuppetPhase !== 'camera-face') {
      return;
    }

    this.officeCameraPuppetPhase = 'room-watch';
    this.officeCameraPuppetTimer = OFFICE_CAMERA_PUPPET_REOPEN_SECONDS;
    this.gameplaySfxAudio.resume();
    this.gameplaySfxAudio.playOfficeJumpscareCue('hat-blackout');
    this.pushStatus('The puppet is in the room. Put the camera back up within three seconds.', 3);
  }

  private handleOfficeCameraPuppetFeedOpened(): boolean {
    if (this.officeCameraPuppetPhase !== 'room-watch') {
      return false;
    }

    this.clearOfficeCameraPuppetThreat();
    this.gameplaySfxAudio.resume();
    this.gameplaySfxAudio.playSmallPanel(true);
    this.pushStatus('The puppet vanishes behind the tablet static.', 2);
    return true;
  }

  private triggerOfficeCameraPuppetJumpscare(): void {
    if (this.officeCameraPuppetPhase === 'jumpscare') {
      return;
    }

    this.officeCameraPuppetPhase = 'jumpscare';
    this.officeCameraPuppetTimer = OFFICE_CAMERA_PUPPET_JUMPSCARE_SECONDS;
    this.officeTabletCameraFeedActive = false;
    this.officeTabletHeld = false;
    this.officeTabletAnchor.visible = false;
    this.placementToolActive = false;
    this.placementPreview.visible = false;
    this.officeGlassHeld = false;
    this.officeGlassAnchor.visible = false;
    this.gameplaySfxAudio.resume();
    this.gameplaySfxAudio.playOfficeJumpscareCue('bear-grab');
    this.resize();
    this.pushStatus('The puppet reaches you.', 1.4);
  }

  private updateOfficeCameraPuppetThreat(deltaSeconds: number): void {
    if (this.officeCameraPuppetPhase === 'idle') {
      return;
    }

    if (this.officeCameraPuppetPhase !== 'jumpscare' && !this.canOfficeCameraPuppetThreatRun()) {
      this.clearOfficeCameraPuppetThreat();
      return;
    }

    this.officeCameraPuppetTimer = Math.max(0, this.officeCameraPuppetTimer - deltaSeconds);

    if (this.officeCameraPuppetPhase === 'camera-face') {
      if (!this.officeTabletCameraFeedActive) {
        this.handleOfficeCameraPuppetFeedClosed();
        return;
      }

      if (this.officeCameraPuppetTimer <= 0) {
        this.triggerOfficeCameraPuppetJumpscare();
      }
      return;
    }

    if (this.officeCameraPuppetPhase === 'room-watch') {
      if (this.officeTabletCameraFeedActive) {
        this.handleOfficeCameraPuppetFeedOpened();
        return;
      }

      if (this.officeCameraPuppetTimer <= 0) {
        this.triggerOfficeCameraPuppetJumpscare();
      }
      return;
    }

    if (this.officeCameraPuppetTimer > 0) {
      return;
    }

    this.clearOfficeCameraPuppetThreat();
    if (this.officeGameModeActive) {
      this.returnToOfficeAfterGameModeJumpscare();
    } else {
      this.pushStatus('The puppet jumpscare fades.', 1.4);
    }
  }

  private toggleOfficeTabletCameraFeed(): void {
    if (!this.officeChapterActive || !this.player.isLocked() || this.chapterMenuOpen || this.officeJumpscareMenuOpen || this.officeModeMenuOpen) {
      return;
    }

    if (!this.officeGameModeHasPower()) {
      this.officeTabletCameraFeedActive = false;
      this.pushStatus('The tablet cameras are dead. The office power is out.', 2.4);
      return;
    }

    if (!this.officeTabletHeld && !this.officeTabletCameraFeedActive) {
      return;
    }

    if (!this.officeTabletCameraFeedActive && this.officeChapter.securityCameras.length === 0) {
      this.pushStatus('No tablet cameras are installed. Mark a spot with the Coordinate Tool and tell Codex where to add one.', 3);
      return;
    }

    const wasViewingCameraFeed = this.officeTabletCameraFeedActive;
    this.officeTabletCameraFeedActive = !this.officeTabletCameraFeedActive;
    this.officeTabletHeld = true;
    this.placementToolActive = false;
    this.placementPreview.visible = false;
    this.officeGlassHeld = false;
    this.officeGlassAnchor.visible = false;
    const camera = this.getActiveOfficeTabletCamera();
    let clearedPuppetThreat = false;
    if (this.officeTabletCameraFeedActive) {
      clearedPuppetThreat = this.handleOfficeCameraPuppetFeedOpened();
      if (!clearedPuppetThreat) {
        this.maybeStartOfficeCameraPuppetThreat();
      }
    } else if (wasViewingCameraFeed) {
      this.handleOfficeCameraPuppetFeedClosed();
    }
    this.resize();
    this.pushStatus(
      clearedPuppetThreat
        ? 'The puppet vanishes behind the tablet static.'
      : this.officeCameraPuppetPhase !== 'idle'
        ? this.officeCameraPuppetPhase === 'camera-face'
          ? 'A crying puppet face fills the camera. Drop the tablet now.'
          : this.officeCameraPuppetPhase === 'room-watch'
            ? 'The puppet is in the room. Put the camera back up within three seconds.'
            : 'The puppet reaches you.'
      : this.officeTabletCameraFeedActive
        ? `Viewing ${camera?.label ?? 'tablet camera'} through the tablet. Press number keys to switch, or left click again to return.`
        : 'Tablet view closed.',
      clearedPuppetThreat || this.officeCameraPuppetPhase !== 'idle' ? 2.4 : this.officeTabletCameraFeedActive ? 2.6 : 1.4,
    );
  }

  private officeGameModeHasPower(): boolean {
    return !this.officeGameModeActive || (!this.officeGameModePowerOut && this.officeGameModePower > 0);
  }

  private getOfficeGameModeConfig(): OfficeGameModeConfig {
    return OFFICE_GAME_MODE_CONFIGS[this.officeGameModeDifficulty];
  }

  private ensureOfficeGameModeAnimatronics(): void {
    if (this.officeGameModeAnimatronics.length > 0) {
      return;
    }

    (['quacky', 'fluffle', 'bori', 'foxy'] as const).forEach((animatronic) => {
      const model = createOfficeJumpscareStageModel(animatronic);
      model.root.visible = false;
      model.root.scale.setScalar(OFFICE_GAME_MODE_ANIMATRONIC_SCALE[animatronic]);
      this.officeChapter.root.add(model.root);
      this.officeGameModeAnimatronics.push({
        animatronic,
        label: animatronic === 'quacky'
          ? 'Quacky'
          : animatronic === 'fluffle'
            ? 'Fluffle'
            : animatronic === 'bori'
              ? 'Bori'
              : 'Foxy',
        model,
        route: OFFICE_GAME_MODE_ROUTES[animatronic].map((point) => point.clone()),
        routeIndex: 0,
        state: 'stage',
        waitTimer: 0,
        attackCooldown: 0,
        lostSightTimer: 0,
        stuckTimer: 0,
        progressStallTimer: 0,
        detourTarget: null,
        detourTimer: 0,
        lastKnownPlayerPosition: OFFICE_GAME_MODE_OFFICE_CENTER.clone(),
      });
    });
  }

  private getOfficeGameModeAnimatronicFloorY(
    animatronic: OfficeJumpscareAnimatronic,
    x: number,
    z: number,
  ): number {
    let floorY = OFFICE_GAME_MODE_ANIMATRONIC_FLOOR_Y[animatronic];
    for (const stage of this.officeChapter.stageFloors) {
      const onStage = Math.abs(x - stage.center.x) <= stage.halfWidth
        && Math.abs(z - stage.center.z) <= stage.halfDepth;
      if (!onStage) {
        continue;
      }

      floorY = Math.max(
        floorY,
        OFFICE_GAME_MODE_ANIMATRONIC_FLOOR_Y[animatronic]
          + Math.max(0, stage.floorY - GAME_CONFIG.player.height)
          + OFFICE_GAME_MODE_STAGE_LIFT,
      );
    }

    return floorY;
  }

  private resetOfficeGameModeAnimatronics(): void {
    this.ensureOfficeGameModeAnimatronics();
    this.officeGameModeAnimatronics.forEach((animatronic, index) => {
      const start = animatronic.route[0] ?? OFFICE_GAME_MODE_OFFICE_CENTER;
      animatronic.model.root.position.set(
        start.x,
        this.getOfficeGameModeAnimatronicFloorY(animatronic.animatronic, start.x, start.z),
        start.z,
      );
      animatronic.model.root.rotation.set(0, Math.PI + index * 0.2, 0);
      animatronic.model.root.visible = this.officeGameModeActive;
      animatronic.routeIndex = 1 % animatronic.route.length;
      animatronic.state = 'stage';
      animatronic.model.root.visible = false;
      this.officeChapter.setStageAnimatronicPresent(animatronic.animatronic, true);
      animatronic.waitTimer = this.getOfficeGameModeStageDwellSeconds(animatronic.animatronic) + index * 5.8;
      animatronic.attackCooldown = 1.5;
      animatronic.lostSightTimer = 0;
      animatronic.stuckTimer = 0;
      animatronic.progressStallTimer = 0;
      animatronic.detourTarget = null;
      animatronic.detourTimer = 0;
      animatronic.lastKnownPlayerPosition.copy(OFFICE_GAME_MODE_OFFICE_CENTER);
      animatronic.model.leftArm.rotation.set(0, 0, 0);
      animatronic.model.rightArm.rotation.set(0, 0, 0);
      animatronic.model.leftLeg.rotation.set(0, 0, 0);
      animatronic.model.rightLeg.rotation.set(0, 0, 0);
      animatronic.model.leftLegJoint.rotation.set(0, 0, 0);
      animatronic.model.rightLegJoint.rotation.set(0, 0, 0);
    });
  }

  private getOfficeModeLabel(mode = this.officeMode): string {
    switch (mode) {
      case 'creator':
        return 'Creator Mode';
      case 'night':
        return 'Night Mode';
      case 'game':
        return 'Game Mode';
    }
  }

  private getOfficeGameModeClockLabel(): string {
    if (!this.officeGameModeNightPhase) {
      const dayHours = ['6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM'];
      const dayIndex = MathUtils.clamp(
        Math.floor((this.officeGameModePhaseTime / OFFICE_GAME_MODE_DAY_SECONDS) * (dayHours.length - 1)),
        0,
        dayHours.length - 1,
      );
      return dayHours[dayIndex] ?? '6 AM';
    }

    const nightHours = ['1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM'];
    const nightIndex = MathUtils.clamp(
      Math.floor((this.officeGameModePhaseTime / OFFICE_GAME_MODE_NIGHT_SECONDS) * nightHours.length),
      0,
      nightHours.length - 1,
    );
    return nightHours[nightIndex] ?? '1 AM';
  }

  private getOfficeGameModeNightHudLabel(): string {
    return this.officeGameModeNightPhase
      ? `Night ${this.officeGameModeNight}/${OFFICE_GAME_MODE_TOTAL_NIGHTS}`
      : `Day Before Night ${this.officeGameModeNight}/${OFFICE_GAME_MODE_TOTAL_NIGHTS}`;
  }

  private getOfficeGameModeTimeHudLabel(): string {
    const minutesLeft = Math.ceil(this.getOfficeGameModePhaseTimeRemaining() / 60);
    return this.officeGameModeNightPhase
      ? `${this.getOfficeGameModeClockLabel()} to 6 AM (${minutesLeft}m)`
      : `${this.getOfficeGameModeClockLabel()} to 12 PM (${minutesLeft}m)`;
  }

  private getOfficeGameModePhaseTimeRemaining(): number {
    const phaseDuration = this.officeGameModeNightPhase
      ? OFFICE_GAME_MODE_NIGHT_SECONDS
      : OFFICE_GAME_MODE_DAY_SECONDS;
    return Math.max(0, phaseDuration - this.officeGameModePhaseTime);
  }

  private resetOfficeGameModeNightState(): void {
    this.officeGameModePower = 100;
    this.officeGameModePowerOut = false;
    this.resetOfficeFoxyCameraPressure();
    this.officeFoxyRushCooldown = 8;
    this.officeFoxyClankCooldown = 0;
    this.officeFoxyRushDoor = null;
    this.clearOfficeCameraPuppetThreat();
    this.officeChapter.doors.forEach((door) => {
      door.targetOpenAmount = 1;
      door.open = true;
    });
    this.resetOfficeGameModeAnimatronics();
    if (this.officeGameModeDifficulty === 'hard') {
      this.ensureOfficeVentBoy();
      this.resetOfficeVentBoy();
    } else if (this.officeVentBoy) {
      this.officeVentBoy.root.visible = false;
    }
  }

  private completeOfficeGameModeNight(): void {
    if (this.officeGameModeNight >= OFFICE_GAME_MODE_TOTAL_NIGHTS) {
      const completedMode = this.getOfficeModeLabel();
      this.stopOfficeGameMode();
      this.pushStatus(`${completedMode} cleared. You survived all five nights.`, 5);
      return;
    }

    this.officeGameModeNight += 1;
    this.officeGameModePhaseTime = 0;
    this.resetOfficeGameModeNightState();

    if (this.officeMode === 'game') {
      this.officeGameModeNightPhase = false;
      this.pushStatus(
        `6 AM. Night ${this.officeGameModeNight - 1} survived. Day break starts before Night ${this.officeGameModeNight}.`,
        4.4,
      );
      return;
    }

    this.officeGameModeNightPhase = true;
    this.pushStatus(`6 AM. Night ${this.officeGameModeNight - 1} survived. Night ${this.officeGameModeNight} begins.`, 4.4);
  }

  private applyOfficeMode(mode: OfficeModeMenuMode, difficulty: OfficeGameModeDifficulty = this.officeGameModeDifficulty): void {
    if (mode === 'creator') {
      this.stopOfficeGameMode();
      this.officeMode = 'creator';
      this.officeGameModeNightPhase = false;
      this.officeGameModePhaseTime = 0;
      this.officeGameModeNight = 1;
      this.pushStatus('Creator Mode selected. Chapter 3 stays in daylight and animatronics stay on stage.', 3.4);
      return;
    }

    this.startOfficeGameMode(mode, difficulty);
  }

  private startOfficeGameMode(mode: Exclude<OfficeModeMenuMode, 'creator'>, difficulty: OfficeGameModeDifficulty): void {
    this.officeMode = mode;
    this.officeGameModeActive = true;
    this.officeGameModeDifficulty = difficulty;
    this.officeGameModePower = 100;
    this.officeGameModePowerOut = false;
    this.officeGameModeNightPhase = true;
    this.officeGameModePhaseTime = 0;
    this.officeGameModeNight = 1;
    this.resetOfficeFoxyCameraPressure();
    this.officeFoxyRushCooldown = 0;
    this.officeFoxyClankCooldown = 0;
    this.officeFoxyRushDoor = null;
    this.setPlacementToolActive(false);
    this.officeChapterSeated = false;
    this.officeBallPitHidden = false;
    this.officeBallPitSlide = null;
    this.officeVentActive = false;
    this.officeVentDrop = null;
    this.officeTabletCameraFeedActive = false;
    this.officeTabletHeld = false;
    this.officeTabletAnchor.visible = false;
    this.clearOfficeCameraPuppetThreat();
    this.officeGlassHeld = false;
    this.officeGlassAnchor.visible = false;
    this.officeBasketballHeld = false;
    this.officeBasketballAnchor.visible = false;
    this.officeChapter.setBasketballHeld(false);
    this.officeChapter.doors.forEach((door) => {
      door.targetOpenAmount = 1;
      door.open = true;
    });
    this.officeChapter.storageClosetDoor.targetOpenAmount = 1;
    this.officeChapter.storageClosetDoor.open = true;
    this.player.teleport(OFFICE_GAME_MODE_OFFICE_SPAWN);
    this.player.lookToward(OFFICE_GAME_MODE_OFFICE_LOOK_TARGET, 1);
    this.flashlight.setEnabled(true);
    this.resetOfficeGameModeAnimatronics();
    if (difficulty === 'hard') {
      this.ensureOfficeVentBoy();
      this.resetOfficeVentBoy();
    }
    this.pushStatus(
      `${this.getOfficeModeLabel(mode)} started on ${this.getOfficeGameModeConfig().label}. Survive five nights. Each night runs 12 AM to 6 AM in five minutes.`,
      4.6,
    );
  }

  private stopOfficeGameMode(): void {
    this.officeGameModeActive = false;
    this.officeMode = 'creator';
    this.officeModeMenuOpen = false;
    this.officeModeMenuStep = 'mode';
    this.officeModeMenuPendingMode = null;
    this.officeGameModePowerOut = false;
    this.officeGameModePower = 100;
    this.officeGameModeNightPhase = false;
    this.officeGameModePhaseTime = 0;
    this.officeGameModeNight = 1;
    this.resetOfficeFoxyCameraPressure();
    this.officeFoxyRushCooldown = 0;
    this.officeFoxyClankCooldown = 0;
    this.officeFoxyRushDoor = null;
    this.clearOfficeCameraPuppetThreat();
    this.officeBallPitSlide = null;
    this.officeGameModeAnimatronics.forEach((animatronic) => {
      animatronic.model.root.visible = false;
      animatronic.state = 'stage';
      this.officeChapter.setStageAnimatronicPresent(animatronic.animatronic, true);
    });
    if (this.officeVentBoy) {
      this.officeVentBoy.root.visible = false;
    }
  }

  private isPlayerInsideOfficeRoom(position = this.player.getPosition()): boolean {
    return Math.abs(position.x + 240) <= 6.2 && Math.abs(position.z - 184) <= 5.25;
  }

  private getOfficeGameModeBlockedDoorId(
    animatronicPosition: Vector3,
    playerPosition: Vector3,
  ): 'left' | 'right' | null {
    if (!this.isPlayerInsideOfficeRoom(playerPosition)) {
      return null;
    }

    const leftDoor = this.getOfficeDoorById('left');
    const rightDoor = this.getOfficeDoorById('right');
    const leftClosed = Boolean(leftDoor && leftDoor.targetOpenAmount < 0.5);
    const rightClosed = Boolean(rightDoor && rightDoor.targetOpenAmount < 0.5);
    if (leftClosed && animatronicPosition.x < -246.2 && Math.abs(animatronicPosition.z - 184.9) < 6.2) {
      return 'left';
    }

    return rightClosed && animatronicPosition.x > -233.8 && Math.abs(animatronicPosition.z - 184.9) < 6.2
      ? 'right'
      : null;
  }

  private repelOfficeGameModeAnimatronicsAtDoor(doorId: 'left' | 'right'): void {
    if (!this.officeGameModeActive) {
      return;
    }

    const door = this.getOfficeDoorById(doorId);
    if (!door || door.targetOpenAmount >= 0.5) {
      return;
    }

    const doorWatch = doorId === 'left' ? OFFICE_GAME_MODE_LEFT_DOOR_WATCH : OFFICE_GAME_MODE_RIGHT_DOOR_WATCH;
    this.officeGameModeAnimatronics.forEach((animatronic) => {
      const position = animatronic.model.root.position;
      const distance = Math.hypot(position.x - doorWatch.x, position.z - doorWatch.z);
      if (distance > 7.2) {
        return;
      }

      animatronic.state = 'retreat';
      animatronic.routeIndex = 0;
      animatronic.waitTimer = 0.25;
      animatronic.lostSightTimer = 0;
      animatronic.progressStallTimer = 0;
      animatronic.detourTarget = null;
      animatronic.detourTimer = 0;
      this.pushStatus(`${animatronic.label} backs away from the ${doorId} door light.`, 2.1);
    });
  }

  private getOfficeGameModeFoxy(): OfficeGameModeAnimatronicState | null {
    return this.officeGameModeAnimatronics.find((animatronic) => animatronic.animatronic === 'foxy') ?? null;
  }

  private rollOfficeFoxyCameraTriggerSeconds(): number {
    return MathUtils.lerp(
      OFFICE_FOXY_CAMERA_TRIGGER_MIN_SECONDS,
      OFFICE_FOXY_CAMERA_TRIGGER_MAX_SECONDS,
      Math.random(),
    );
  }

  private resetOfficeFoxyCameraPressure(): void {
    this.officeFoxyCameraWatchTime = 0;
    this.officeFoxyCameraTriggerSeconds = this.rollOfficeFoxyCameraTriggerSeconds();
  }

  private getOfficeFoxyRushDoorTarget(): Vector3 {
    if (this.officeFoxyRushDoor === 'left') {
      return OFFICE_GAME_MODE_LEFT_DOOR_WATCH;
    }

    if (this.officeFoxyRushDoor === 'right') {
      return OFFICE_GAME_MODE_RIGHT_DOOR_WATCH;
    }

    return this.player.getPosition().x < OFFICE_GAME_MODE_OFFICE_CENTER.x
      ? OFFICE_GAME_MODE_LEFT_DOOR_WATCH
      : OFFICE_GAME_MODE_RIGHT_DOOR_WATCH;
  }

  private triggerOfficeFoxyRush(source: 'stage' | 'closet'): void {
    const foxy = this.getOfficeGameModeFoxy();
    if (!foxy || foxy.state === 'rush' || foxy.state === 'chase' || this.officeFoxyRushCooldown > 0) {
      return;
    }

    const start = source === 'closet'
      ? OFFICE_FOXY_CLOSET_RUSH_START
      : OFFICE_FOXY_STAGE_RUSH_START;
    const doorId = source === 'closet' ? 'left' : 'right';
    foxy.model.root.position.set(
      start.x,
      this.getOfficeGameModeAnimatronicFloorY('foxy', start.x, start.z),
      start.z,
    );
    foxy.model.root.visible = true;
    this.officeChapter.setStageAnimatronicPresent('foxy', false);
    foxy.state = 'rush';
    foxy.routeIndex = 0;
    foxy.waitTimer = 0;
    foxy.attackCooldown = 0;
    foxy.lostSightTimer = 0;
    foxy.stuckTimer = 0;
    foxy.progressStallTimer = 0;
    foxy.detourTarget = null;
    foxy.detourTimer = 0;
    this.officeFoxyRushDoor = doorId;
    foxy.lastKnownPlayerPosition.copy(this.getOfficeFoxyRushDoorTarget());
    this.officeFoxyRushCooldown = 22;
    this.resetOfficeFoxyCameraPressure();
    this.officeFoxyClankCooldown = 0;
    this.gameplaySfxAudio.resume();
    this.gameplaySfxAudio.playFoxyClank(0.22);
    this.pushStatus(
      source === 'closet'
        ? `A metal clank echoes from the closet. Foxy is sprinting for the ${doorId} door.`
        : `A metal clank snaps from Foxy's stage. He is sprinting for the ${doorId} door.`,
      3.2,
    );
  }

  private updateOfficeFoxyCameraPressure(deltaSeconds: number): void {
    this.officeFoxyRushCooldown = Math.max(0, this.officeFoxyRushCooldown - deltaSeconds);
    if (
      !this.officeGameModeActive
      || this.officeGameModeNight <= 1
      || this.officeGameModePowerOut
      || this.activeOfficeJumpscare
    ) {
      if (this.officeFoxyCameraWatchTime > 0) {
        this.resetOfficeFoxyCameraPressure();
      }
      return;
    }

    const foxy = this.getOfficeGameModeFoxy();
    if (!foxy || foxy.state === 'rush' || foxy.state === 'chase') {
      if (this.officeFoxyCameraWatchTime > 0) {
        this.resetOfficeFoxyCameraPressure();
      }
      return;
    }

    if (this.officeTabletCameraFeedActive) {
      this.officeFoxyCameraWatchTime += deltaSeconds;
    } else if (this.officeFoxyCameraWatchTime > 0) {
      this.resetOfficeFoxyCameraPressure();
    }

    if (this.officeFoxyCameraWatchTime < this.officeFoxyCameraTriggerSeconds || this.officeFoxyRushCooldown > 0) {
      return;
    }

    const closeToCloset = foxy.state !== 'stage'
      && foxy.model.root.position.distanceTo(OFFICE_FOXY_CLOSET_RUSH_START) < 7.5;
    const source = closeToCloset || Math.sin(this.elapsed * 0.73) > -0.25 ? 'closet' : 'stage';
    this.triggerOfficeFoxyRush(source);
  }

  private updateOfficeFoxyRushAudio(deltaSeconds: number): void {
    this.officeFoxyClankCooldown = Math.max(0, this.officeFoxyClankCooldown - deltaSeconds);
    const foxy = this.getOfficeGameModeFoxy();
    if (!foxy || foxy.state !== 'rush') {
      return;
    }

    const doorTarget = this.getOfficeFoxyRushDoorTarget();
    const distance = foxy.model.root.position.distanceTo(doorTarget);
    const closeness = MathUtils.clamp(1 - distance / 34, 0, 1);
    if (this.officeFoxyClankCooldown > 0) {
      return;
    }

    this.gameplaySfxAudio.playFoxyClank(MathUtils.lerp(0.28, 1, closeness));
    this.officeFoxyClankCooldown = MathUtils.lerp(0.52, 0.13, closeness);
  }

  private getOfficeGameModeStageDwellSeconds(animatronic: OfficeJumpscareAnimatronic): number {
    const nightBase = [95, 54, 39, 24, 10][MathUtils.clamp(this.officeGameModeNight - 1, 0, 4)] ?? 39;
    const animalShift = animatronic === 'foxy'
      ? 12
      : animatronic === 'quacky'
        ? 5
        : animatronic === 'bori'
          ? 7
          : 0;
    const difficultyShift = this.officeGameModeDifficulty === 'hard'
      ? -5
      : this.officeGameModeDifficulty === 'easy'
        ? 10
        : 0;
    const offset = animatronic === 'quacky' ? 0.8 : animatronic === 'fluffle' ? 2.1 : animatronic === 'bori' ? 3.4 : 4.8;
    const randomHold = Math.abs(Math.sin(this.elapsed * 0.23 + offset)) * (this.officeGameModeNight >= 5 ? 8 : 18);
    return Math.max(5, nightBase + animalShift + difficultyShift + randomHold);
  }

  private getOfficeGameModeWaypointDwellSeconds(animatronic: OfficeJumpscareAnimatronic, routeIndex: number): number {
    if (animatronic === 'quacky' && routeIndex >= 2 && routeIndex <= 4) {
      return 8.5 + Math.abs(Math.sin(this.elapsed * 0.41 + routeIndex)) * 6;
    }

    if (animatronic === 'foxy' && routeIndex === 5) {
      return 12 + Math.abs(Math.sin(this.elapsed * 0.37)) * 8;
    }

    if (animatronic === 'fluffle' && (routeIndex === 2 || routeIndex === 3)) {
      return 5.5 + Math.abs(Math.sin(this.elapsed * 0.5 + routeIndex)) * 4.5;
    }

    if (animatronic === 'bori' && routeIndex >= 4 && routeIndex <= 5) {
      return 5 + Math.abs(Math.sin(this.elapsed * 0.44 + routeIndex)) * 4;
    }

    return 1.8 + Math.abs(Math.sin(this.elapsed * 0.58 + routeIndex)) * 2.7;
  }

  private getNextOfficeGameModeRouteIndex(animatronic: OfficeGameModeAnimatronicState, reachedRouteIndex: number): number {
    const routeLength = animatronic.route.length;
    if (routeLength === 0) {
      return 0;
    }

    if (animatronic.animatronic === 'quacky' && reachedRouteIndex === 1) {
      const roll = Math.random();
      if (roll < 0.22) {
        return 2;
      }

      if (roll < 0.82) {
        return Math.min(5, routeLength - 1);
      }

      return routeLength - 1;
    }

    return (reachedRouteIndex + 1) % routeLength;
  }

  private getOfficeGameModeMaxOffstage(): number {
    switch (this.officeGameModeNight) {
      case 1:
        return 0;
      case 2:
      case 3:
        return 1;
      case 4:
        return this.officeGameModeDifficulty === 'easy' ? 1 : 2;
      case 5:
      default:
        return this.officeGameModeDifficulty === 'easy' ? 2 : 4;
    }
  }

  private shouldOfficeGameModeAnimatronicLeaveStage(animatronic: OfficeGameModeAnimatronicState, canSeePlayer: boolean): boolean {
    const nightChance = [0, 0.2, 0.34, 0.62, 0.94][MathUtils.clamp(this.officeGameModeNight - 1, 0, 4)] ?? 0.34;
    const difficultyChance = this.officeGameModeDifficulty === 'hard'
      ? 0.08
      : this.officeGameModeDifficulty === 'easy'
        ? -0.08
        : 0;
    const animalChance = animatronic.animatronic === 'foxy'
      ? -0.08
      : animatronic.animatronic === 'quacky'
        ? -0.04
        : 0;
    const playerSeenBonus = canSeePlayer && this.officeGameModeNight >= 3 ? 0.12 : 0;
    const chance = MathUtils.clamp(difficultyChance + nightChance + animalChance + playerSeenBonus, 0, 0.98);
    return Math.random() < chance;
  }

  private getOfficeGameModeNightPressure(): number {
    return MathUtils.clamp((this.officeGameModeNight - 1) / Math.max(1, OFFICE_GAME_MODE_TOTAL_NIGHTS - 1), 0, 1);
  }

  private getOfficeGameModeDetectionRange(config: OfficeGameModeConfig): number {
    const nightMultiplier = [0.48, 0.72, 1, 1.28, 1.62][MathUtils.clamp(this.officeGameModeNight - 1, 0, 4)] ?? 1;
    const powerOutMultiplier = this.officeGameModePowerOut ? 1.18 : 1;
    return config.detectionRange * nightMultiplier * powerOutMultiplier;
  }

  private getOfficeGameModeSpeedMultiplier(): number {
    return 1 + this.getOfficeGameModeNightPressure() * 0.18;
  }

  private putOfficeGameModeAnimatronicOnStage(animatronic: OfficeGameModeAnimatronicState): void {
    const start = animatronic.route[0] ?? OFFICE_GAME_MODE_OFFICE_CENTER;
    animatronic.model.root.position.set(
      start.x,
      this.getOfficeGameModeAnimatronicFloorY(animatronic.animatronic, start.x, start.z),
      start.z,
    );
    animatronic.model.root.visible = false;
    this.officeChapter.setStageAnimatronicPresent(animatronic.animatronic, true);
    animatronic.state = 'stage';
    animatronic.routeIndex = 1 % animatronic.route.length;
    animatronic.waitTimer = this.getOfficeGameModeStageDwellSeconds(animatronic.animatronic);
    animatronic.lostSightTimer = 0;
    animatronic.stuckTimer = 0;
    animatronic.progressStallTimer = 0;
    animatronic.detourTarget = null;
    animatronic.detourTimer = 0;
    animatronic.model.head.rotation.set(0, 0, 0);
    animatronic.model.leftArm.rotation.set(0, 0, 0);
    animatronic.model.rightArm.rotation.set(0, 0, 0);
    animatronic.model.leftLeg.rotation.set(0, 0, 0);
    animatronic.model.rightLeg.rotation.set(0, 0, 0);
    animatronic.model.leftLegJoint.rotation.set(0, 0, 0);
    animatronic.model.rightLegJoint.rotation.set(0, 0, 0);
  }

  private sendOfficeGameModeAnimatronicOffStage(animatronic: OfficeGameModeAnimatronicState): void {
    const start = animatronic.route[0] ?? OFFICE_GAME_MODE_OFFICE_CENTER;
    animatronic.model.root.position.set(
      start.x,
      this.getOfficeGameModeAnimatronicFloorY(animatronic.animatronic, start.x, start.z),
      start.z,
    );
    animatronic.model.root.visible = true;
    this.officeChapter.setStageAnimatronicPresent(animatronic.animatronic, false);
    animatronic.state = 'wander';
    animatronic.routeIndex = 1 % animatronic.route.length;
    animatronic.waitTimer = 0.2;
    animatronic.lostSightTimer = 0;
    animatronic.stuckTimer = 0;
    animatronic.progressStallTimer = 0;
    animatronic.detourTarget = null;
    animatronic.detourTimer = 0;
  }

  private hasOfficeGameModeLineOfSight(from: Vector3, to: Vector3): boolean {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 0.1) {
      return true;
    }

    const steps = Math.max(3, Math.ceil(distance / 0.18));
    for (let index = 1; index < steps; index += 1) {
      const progress = index / steps;
      const sampleX = from.x + dx * progress;
      const sampleZ = from.z + dz * progress;
      if (isBlocked(sampleX, sampleZ, this.officeChapter.colliders, 0.03)) {
        return false;
      }
    }

    return true;
  }

  private canOfficeGameModeAnimatronicStandAt(
    x: number,
    z: number,
    radius = OFFICE_GAME_MODE_COLLISION_RADIUS,
  ): boolean {
    return !isBlocked(x, z, this.officeChapter.colliders, radius);
  }

  private isOfficeGameModePathClear(
    fromX: number,
    fromZ: number,
    toX: number,
    toZ: number,
    radius = OFFICE_GAME_MODE_COLLISION_RADIUS * 0.78,
  ): boolean {
    const dx = toX - fromX;
    const dz = toZ - fromZ;
    const distance = Math.hypot(dx, dz);
    if (distance <= 0.05) {
      return this.canOfficeGameModeAnimatronicStandAt(toX, toZ, radius);
    }

    const steps = Math.max(2, Math.ceil(distance / 0.22));
    for (let index = 1; index <= steps; index += 1) {
      const progress = index / steps;
      const sampleX = fromX + dx * progress;
      const sampleZ = fromZ + dz * progress;
      if (!this.canOfficeGameModeAnimatronicStandAt(sampleX, sampleZ, radius)) {
        return false;
      }
    }

    return true;
  }

  private findOfficeGameModeDetour(
    animatronic: OfficeGameModeAnimatronicState,
    desiredTarget: Vector3,
  ): Vector3 | null {
    const root = animatronic.model.root;
    const dx = desiredTarget.x - root.position.x;
    const dz = desiredTarget.z - root.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 0.25) {
      return null;
    }

    const directionX = dx / distance;
    const directionZ = dz / distance;
    const perpX = -directionZ;
    const perpZ = directionX;
    let bestDetour: { x: number; z: number; score: number } | null = null;

    const considerDetour = (candidateX: number, candidateZ: number, penalty: number): void => {
      if (!this.canOfficeGameModeAnimatronicStandAt(candidateX, candidateZ)) {
        return;
      }

      if (!this.isOfficeGameModePathClear(root.position.x, root.position.z, candidateX, candidateZ)) {
        return;
      }

      const distanceFromTarget = Math.hypot(desiredTarget.x - candidateX, desiredTarget.z - candidateZ);
      const progressPenalty = Math.max(0, distanceFromTarget - distance) * 0.45;
      const targetPathBonus = this.isOfficeGameModePathClear(
        candidateX,
        candidateZ,
        desiredTarget.x,
        desiredTarget.z,
        OFFICE_GAME_MODE_COLLISION_RADIUS * 0.62,
      )
        ? -1.1
        : 0;
      const score = distanceFromTarget + progressPenalty + penalty + targetPathBonus;
      if (bestDetour && score >= bestDetour.score) {
        return;
      }

      bestDetour = { x: candidateX, z: candidateZ, score };
    };

    ([-1, 1] as const).forEach((side) => {
      [0.75, 1.25, 1.85].forEach((forwardDistance, forwardIndex) => {
        [0.9, 1.45, 2.1, 2.85].forEach((sideDistance, sideIndex) => {
          considerDetour(
            root.position.x + directionX * forwardDistance + perpX * side * sideDistance,
            root.position.z + directionZ * forwardDistance + perpZ * side * sideDistance,
            0.22 * forwardIndex + 0.18 * sideIndex,
          );
        });
      });
    });

    [0.62, -0.62, 1.05, -1.05].forEach((angle) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rotatedX = directionX * cos - directionZ * sin;
      const rotatedZ = directionX * sin + directionZ * cos;
      [1.25, 2, 2.8].forEach((detourDistance, index) => {
        considerDetour(
          root.position.x + rotatedX * detourDistance,
          root.position.z + rotatedZ * detourDistance,
          0.36 + index * 0.2,
        );
      });
    });

    animatronic.route.forEach((routePoint, index) => {
      const routeX = routePoint.x;
      const routeZ = routePoint.z;
      if (!this.canOfficeGameModeAnimatronicStandAt(routeX, routeZ, OFFICE_GAME_MODE_COLLISION_RADIUS * 0.82)) {
        return;
      }

      considerDetour(routeX, routeZ, 0.9 + index * 0.035);
    });

    const selectedDetour = bestDetour as { x: number; z: number; score: number } | null;
    return selectedDetour
      ? new Vector3(
        selectedDetour.x,
        this.getOfficeGameModeAnimatronicFloorY(animatronic.animatronic, selectedDetour.x, selectedDetour.z),
        selectedDetour.z,
      )
      : null;
  }

  private getOfficeGameModeSafeTarget(
    animatronic: OfficeGameModeAnimatronicState,
    target: Vector3,
  ): Vector3 {
    if (this.canOfficeGameModeAnimatronicStandAt(target.x, target.z, OFFICE_GAME_MODE_COLLISION_RADIUS * 0.76)) {
      return target;
    }

    const root = animatronic.model.root;
    return this.findOfficeGameModeOpenStandSpot(animatronic, target.x, target.z, root.position.x, root.position.z)
      ?? target;
  }

  private getClosestOfficeGameModeRouteIndex(animatronic: OfficeGameModeAnimatronicState): number {
    const root = animatronic.model.root;
    let bestIndex = animatronic.routeIndex;
    let bestScore = Infinity;
    animatronic.route.forEach((routePoint, index) => {
      const safeTarget = this.getOfficeGameModeSafeTarget(animatronic, routePoint);
      const distance = Math.hypot(safeTarget.x - root.position.x, safeTarget.z - root.position.z);
      const pathPenalty = this.isOfficeGameModePathClear(
        root.position.x,
        root.position.z,
        safeTarget.x,
        safeTarget.z,
        OFFICE_GAME_MODE_COLLISION_RADIUS * 0.62,
      )
        ? 0
        : 8;
      const score = distance + pathPenalty;
      if (score >= bestScore) {
        return;
      }

      bestScore = score;
      bestIndex = index;
    });

    return bestIndex;
  }

  private recoverOfficeGameModeAnimatronic(
    animatronic: OfficeGameModeAnimatronicState,
    desiredTarget: Vector3,
  ): boolean {
    const root = animatronic.model.root;
    const detour = this.findOfficeGameModeDetour(animatronic, desiredTarget);
    if (detour) {
      animatronic.detourTarget = detour;
      animatronic.detourTimer = animatronic.state === 'chase' || animatronic.state === 'rush' ? 1.35 : 2.25;
      animatronic.stuckTimer = 0;
      animatronic.progressStallTimer = 0;
      return true;
    }

    const openSpot = this.findOfficeGameModeOpenStandSpot(animatronic, root.position.x, root.position.z, desiredTarget.x, desiredTarget.z);
    if (openSpot) {
      root.position.copy(openSpot);
      root.rotation.y = Math.atan2(desiredTarget.x - root.position.x, desiredTarget.z - root.position.z);
      animatronic.detourTarget = null;
      animatronic.detourTimer = 0;
      animatronic.stuckTimer = 0;
      animatronic.progressStallTimer = 0;
      return true;
    }

    if (animatronic.state === 'wander') {
      animatronic.routeIndex = this.getClosestOfficeGameModeRouteIndex(animatronic);
      animatronic.waitTimer = 0.25;
      animatronic.stuckTimer = 0;
      animatronic.progressStallTimer = 0;
      return true;
    }

    return false;
  }

  private findOfficeGameModeOpenStandSpot(
    animatronic: OfficeGameModeAnimatronicState,
    x: number,
    z: number,
    preferredX: number,
    preferredZ: number,
  ): Vector3 | null {
    let bestSpot: { x: number; z: number; score: number } | null = null;

    [0.45, 0.75, 1.15, 1.65, 2.25, 3].forEach((radius, radiusIndex) => {
      const samples = 10 + radiusIndex * 2;
      for (let index = 0; index < samples; index += 1) {
        const angle = (index / samples) * Math.PI * 2;
        const candidateX = x + Math.cos(angle) * radius;
        const candidateZ = z + Math.sin(angle) * radius;
        if (!this.canOfficeGameModeAnimatronicStandAt(candidateX, candidateZ)) {
          continue;
        }

        const score = Math.hypot(preferredX - candidateX, preferredZ - candidateZ) + radius * 0.24;
        if (bestSpot && score >= bestSpot.score) {
          continue;
        }

        bestSpot = { x: candidateX, z: candidateZ, score };
      }
    });

    const selectedSpot = bestSpot as { x: number; z: number; score: number } | null;
    return selectedSpot
      ? new Vector3(
        selectedSpot.x,
        this.getOfficeGameModeAnimatronicFloorY(animatronic.animatronic, selectedSpot.x, selectedSpot.z),
        selectedSpot.z,
      )
      : null;
  }

  private moveOfficeGameModeAnimatronic(
    animatronic: OfficeGameModeAnimatronicState,
    dx: number,
    dz: number,
    distance: number,
    speed: number,
    deltaSeconds: number,
  ): boolean {
    if (distance <= 0.001) {
      return false;
    }

    const root = animatronic.model.root;
    const step = Math.min(distance, speed * deltaSeconds);
    const directionX = dx / distance;
    const directionZ = dz / distance;
    const targetX = root.position.x + dx;
    const targetZ = root.position.z + dz;

    if (!this.canOfficeGameModeAnimatronicStandAt(
      root.position.x,
      root.position.z,
      OFFICE_GAME_MODE_COLLISION_RADIUS * 0.72,
    )) {
      const openSpot = this.findOfficeGameModeOpenStandSpot(animatronic, root.position.x, root.position.z, targetX, targetZ);
      if (openSpot) {
        root.position.copy(openSpot);
        root.rotation.y = Math.atan2(targetX - root.position.x, targetZ - root.position.z);
        return true;
      }
    }

    let bestMove: { x: number; z: number; faceX: number; faceZ: number; score: number } | null = null;
    const considerMove = (moveX: number, moveZ: number, faceX: number, faceZ: number, anglePenalty: number): void => {
      const faceLength = Math.hypot(faceX, faceZ);
      if (faceLength <= 0.001) {
        return;
      }

      const normalizedFaceX = faceX / faceLength;
      const normalizedFaceZ = faceZ / faceLength;
      const lookAheadX = moveX + normalizedFaceX * OFFICE_GAME_MODE_COLLISION_RADIUS * 1.45;
      const lookAheadZ = moveZ + normalizedFaceZ * OFFICE_GAME_MODE_COLLISION_RADIUS * 1.45;

      if (!this.canOfficeGameModeAnimatronicStandAt(moveX, moveZ)) {
        return;
      }

      if (!this.isOfficeGameModePathClear(root.position.x, root.position.z, moveX, moveZ)) {
        return;
      }

      if (!this.canOfficeGameModeAnimatronicStandAt(
        lookAheadX,
        lookAheadZ,
        OFFICE_GAME_MODE_COLLISION_RADIUS * 0.82,
      )) {
        return;
      }

      const score = Math.hypot(targetX - moveX, targetZ - moveZ) + anglePenalty;
      if (bestMove && score >= bestMove.score) {
        return;
      }

      bestMove = { x: moveX, z: moveZ, faceX: normalizedFaceX, faceZ: normalizedFaceZ, score };
    };

    const angleCandidates = [0, 0.42, -0.42, 0.82, -0.82, Math.PI / 2, -Math.PI / 2, Math.PI];
    angleCandidates.forEach((angle, index) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rotatedX = directionX * cos - directionZ * sin;
      const rotatedZ = directionX * sin + directionZ * cos;
      const angledStep = step * (index === 0 ? 1 : 0.86);
      considerMove(
        root.position.x + rotatedX * angledStep,
        root.position.z + rotatedZ * angledStep,
        rotatedX,
        rotatedZ,
        Math.abs(angle) * 0.18,
      );
    });

    considerMove(root.position.x + directionX * step, root.position.z, directionX, 0, 0.22);
    considerMove(root.position.x, root.position.z + directionZ * step, 0, directionZ, 0.22);

    const perpX = -directionZ;
    const perpZ = directionX;
    ([-1, 1] as const).forEach((side) => {
      considerMove(
        root.position.x + (directionX * 0.25 + perpX * side) * step,
        root.position.z + (directionZ * 0.25 + perpZ * side) * step,
        directionX * 0.2 + perpX * side,
        directionZ * 0.2 + perpZ * side,
        0.58,
      );
    });

    const selectedMove = bestMove as { x: number; z: number; faceX: number; faceZ: number; score: number } | null;
    if (!selectedMove) {
      return false;
    }

    root.position.x = selectedMove.x;
    root.position.z = selectedMove.z;
    root.rotation.y = Math.atan2(selectedMove.faceX, selectedMove.faceZ);
    root.position.y = this.getOfficeGameModeAnimatronicFloorY(
      animatronic.animatronic,
      root.position.x,
      root.position.z,
    );
    return true;
  }

  private isOfficeVentBoyActive(): boolean {
    return this.officeChapterActive
      && this.officeGameModeActive
      && this.officeGameModeDifficulty === 'hard'
      && (this.officeMode === 'night' || this.officeMode === 'game');
  }

  private ensureOfficeVentBoy(): OfficeVentBoyState {
    if (this.officeVentBoy) {
      return this.officeVentBoy;
    }

    const root = new Group();
    root.visible = false;
    root.scale.setScalar(0.92);

    const metalMaterial = new MeshStandardMaterial({
      color: 0x9aa6ad,
      emissive: 0x0a1014,
      emissiveIntensity: 0.12,
      roughness: 0.42,
      metalness: 0.54,
    });
    const faceMaterial = new MeshStandardMaterial({
      color: 0xd8c1a4,
      emissive: 0x1b0d08,
      emissiveIntensity: 0.1,
      roughness: 0.62,
      metalness: 0.08,
    });
    const darkMaterial = new MeshStandardMaterial({
      color: 0x07080a,
      emissive: 0x020203,
      emissiveIntensity: 0.2,
      roughness: 0.5,
      metalness: 0.28,
    });
    const redEyeMaterial = new MeshStandardMaterial({
      color: 0xfff0e0,
      emissive: 0xff1d12,
      emissiveIntensity: 0.9,
      roughness: 0.26,
      metalness: 0.12,
    });

    const torso = new Mesh(new BoxGeometry(0.42, 0.22, 0.58), metalMaterial);
    torso.position.set(0, 0.24, 0);
    const head = new Group();
    head.position.set(0, 0.48, -0.18);
    const headMesh = new Mesh(new SphereGeometry(0.22, 18, 14), faceMaterial);
    headMesh.scale.set(0.92, 1.04, 0.86);
    const leftEye = new Mesh(new SphereGeometry(0.026, 10, 8), redEyeMaterial);
    leftEye.position.set(-0.07, 0.03, -0.18);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.07;
    const smile = new Mesh(new TorusGeometry(0.09, 0.008, 6, 18, Math.PI), darkMaterial);
    smile.position.set(0, -0.055, -0.19);
    smile.rotation.set(0, 0, Math.PI);
    head.add(headMesh, leftEye, rightEye, smile);

    const propeller = new Group();
    propeller.position.set(0, 0.75, -0.18);
    const hatStem = new Mesh(new CylinderGeometry(0.018, 0.018, 0.12, 10), darkMaterial);
    hatStem.position.y = -0.04;
    const bladeA = new Mesh(new BoxGeometry(0.5, 0.018, 0.055), metalMaterial);
    const bladeB = new Mesh(new BoxGeometry(0.055, 0.018, 0.5), metalMaterial);
    propeller.add(hatStem, bladeA, bladeB);

    const makeLimb = (x: number, z: number): Group => {
      const limb = new Group();
      limb.position.set(x, 0.2, z);
      const upper = new Mesh(new CylinderGeometry(0.028, 0.034, 0.32, 10), metalMaterial);
      upper.position.y = -0.12;
      upper.rotation.z = x < 0 ? -0.62 : 0.62;
      const hand = new Mesh(new SphereGeometry(0.045, 10, 8), darkMaterial);
      hand.position.set(x < 0 ? -0.13 : 0.13, -0.27, 0.03);
      limb.add(upper, hand);
      return limb;
    };
    const leftArm = makeLimb(-0.25, -0.17);
    const rightArm = makeLimb(0.25, -0.17);
    const leftLeg = makeLimb(-0.22, 0.22);
    const rightLeg = makeLimb(0.22, 0.22);
    root.add(torso, head, propeller, leftArm, rightArm, leftLeg, rightLeg);

    const floorY = this.officeChapter.ventSystem.floorY;
    const route = [
      new Vector3(-239.29, floorY, 149.23),
      new Vector3(-239.3, floorY, 159.2),
      new Vector3(-260.1, floorY, 159.2),
      new Vector3(-260.1, floorY, 164.8),
      new Vector3(-239.3, floorY, 171.6),
      new Vector3(-239.3, floorY, 184.2),
      new Vector3(-226.4, floorY, 159.2),
      new Vector3(-212.1, floorY, 159.2),
      new Vector3(-203.8, floorY, 159.2),
      new Vector3(-212.1, floorY, 149.2),
      new Vector3(-226.4, floorY, 141.2),
      new Vector3(-218.8, floorY, 132.3),
      new Vector3(-236.5, floorY, 148.35),
    ];
    this.officeChapter.root.add(root);
    this.officeVentBoy = {
      root,
      head,
      propeller,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      route,
      routeIndex: 1,
      waitTimer: 0,
      stareTimer: 0,
    };
    this.resetOfficeVentBoy();
    return this.officeVentBoy;
  }

  private resetOfficeVentBoy(): void {
    if (!this.officeVentBoy) {
      return;
    }

    const home = this.officeVentBoy.route[0];
    this.officeVentBoy.root.position.copy(home);
    this.officeVentBoy.root.rotation.set(0, 0, 0);
    this.officeVentBoy.root.visible = this.isOfficeVentBoyActive();
    this.officeVentBoy.routeIndex = 1;
    this.officeVentBoy.waitTimer = 1.4;
    this.officeVentBoy.stareTimer = 0;
  }

  private isPlayerWatchingOfficeVentBoy(ventBoy: OfficeVentBoyState): boolean {
    if (!this.officeVentActive) {
      return false;
    }

    const cameraPosition = this.camera.getWorldPosition(new Vector3());
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const toBoy = ventBoy.root.position.clone().add(new Vector3(0, 0.45, 0)).sub(cameraPosition);
    const distance = toBoy.length();
    if (distance > 12 || distance <= 0.1) {
      return false;
    }

    toBoy.normalize();
    return forward.dot(toBoy) > 0.72;
  }

  private updateOfficeVentBoy(deltaSeconds: number): void {
    if (!this.isOfficeVentBoyActive()) {
      if (this.officeVentBoy) {
        this.officeVentBoy.root.visible = false;
      }
      return;
    }

    const ventBoy = this.ensureOfficeVentBoy();
    ventBoy.root.visible = true;
    const watched = this.isPlayerWatchingOfficeVentBoy(ventBoy);
    ventBoy.stareTimer = watched
      ? ventBoy.stareTimer + deltaSeconds
      : 0;
    const forcedMove = ventBoy.stareTimer >= OFFICE_VENT_BOY_STARE_LIMIT_SECONDS;
    const canMove = !watched || forcedMove;

    const crawlCycle = this.elapsed * 8.2;
    ventBoy.propeller.rotation.y += deltaSeconds * (forcedMove ? 28 : 13);
    ventBoy.head.rotation.y = Math.sin(this.elapsed * 4.2) * 0.16;
    ventBoy.leftArm.rotation.x = Math.sin(crawlCycle) * 0.42;
    ventBoy.rightArm.rotation.x = Math.sin(crawlCycle + Math.PI) * 0.42;
    ventBoy.leftLeg.rotation.x = Math.sin(crawlCycle + Math.PI) * 0.36;
    ventBoy.rightLeg.rotation.x = Math.sin(crawlCycle) * 0.36;

    if (ventBoy.waitTimer > 0) {
      ventBoy.waitTimer = Math.max(0, ventBoy.waitTimer - deltaSeconds);
      return;
    }

    if (!canMove) {
      return;
    }

    const target = this.officeVentActive
      ? this.player.getPosition()
      : ventBoy.route[ventBoy.routeIndex] ?? ventBoy.route[0];
    const dx = target.x - ventBoy.root.position.x;
    const dz = target.z - ventBoy.root.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 0.18) {
      if (!this.officeVentActive) {
        ventBoy.routeIndex = (ventBoy.routeIndex + 1) % ventBoy.route.length;
      }
      ventBoy.waitTimer = forcedMove ? 0.08 : 0.45;
      return;
    }

    const step = Math.min(distance, OFFICE_VENT_BOY_SPEED * (forcedMove ? 1.65 : 1) * deltaSeconds);
    ventBoy.root.position.x += (dx / distance) * step;
    ventBoy.root.position.z += (dz / distance) * step;
    ventBoy.root.position.y = this.officeChapter.ventSystem.floorY;
    ventBoy.root.rotation.y = Math.atan2(dx, dz);
  }

  private updateOfficeGameModePower(deltaSeconds: number): void {
    if (!this.officeGameModeActive || this.officeGameModePowerOut) {
      return;
    }

    const config = this.getOfficeGameModeConfig();
    const closedDoors = this.officeChapter.doors.filter((door) => door.targetOpenAmount < 0.5).length;
    const drain = (
      OFFICE_GAME_MODE_IDLE_DRAIN_PER_SECOND
      + (this.officeTabletCameraFeedActive ? OFFICE_GAME_MODE_CAMERA_DRAIN_PER_SECOND : 0)
      + closedDoors * OFFICE_GAME_MODE_CLOSED_DOOR_DRAIN_PER_SECOND
    ) * config.powerMultiplier;

    this.officeGameModePower = Math.max(0, this.officeGameModePower - drain * deltaSeconds);
    if (this.officeGameModePower > 0) {
      return;
    }

    this.officeGameModePowerOut = true;
    this.officeTabletCameraFeedActive = false;
    this.officeTabletHeld = false;
    this.officeTabletAnchor.visible = false;
    this.clearOfficeCameraPuppetThreat();
    this.officeChapter.doors.forEach((door) => {
      door.targetOpenAmount = 1;
      door.open = true;
    });
    this.powerEventAudio.resume();
    this.powerEventAudio.playOutage();
    this.pushStatus('Game Mode power is out. The cameras die and the office doors grind open.', 4.2);
  }

  private updateOfficeModeCycle(deltaSeconds: number): void {
    if (!this.officeChapterActive || !this.officeGameModeActive) {
      return;
    }

    if (this.officeMode === 'night') {
      this.officeGameModeNightPhase = true;
      this.officeGameModePhaseTime += deltaSeconds;
      if (this.officeGameModePhaseTime >= OFFICE_GAME_MODE_NIGHT_SECONDS) {
        this.completeOfficeGameModeNight();
      }
      return;
    }

    if (this.officeMode !== 'game') {
      this.officeGameModeNightPhase = false;
      this.officeGameModePhaseTime = 0;
      return;
    }

    this.officeGameModePhaseTime += deltaSeconds;
    const phaseDuration = this.officeGameModeNightPhase
      ? OFFICE_GAME_MODE_NIGHT_SECONDS
      : OFFICE_GAME_MODE_DAY_SECONDS;
    if (this.officeGameModePhaseTime < phaseDuration) {
      return;
    }

    this.officeGameModePhaseTime = 0;
    if (this.officeGameModeNightPhase) {
      this.completeOfficeGameModeNight();
      return;
    }

    this.officeGameModeNightPhase = !this.officeGameModeNightPhase;
    this.pushStatus(
      `Game Mode shifts into Night ${this.officeGameModeNight}. Survive until 6 AM.`,
      3.4,
    );
  }

  private getOfficeNightBlend(): number {
    if (!this.officeChapterActive) {
      return 0;
    }

    if (this.officeMode === 'night') {
      return 1;
    }

    if (this.officeMode === 'game' && this.officeGameModeNightPhase) {
      return 1;
    }

    return 0;
  }

  private getOfficeNightLightingSettings(): {
    ambient: number;
    hemisphere: number;
    flashlightIntensity: number;
    flashlightDistance: number;
    flashlightAngle: number;
    flashlightPenumbra: number;
    fogNear: number;
    fogFar: number;
    fogBlend: number;
  } {
    if (!this.officeGameModeActive) {
      return {
        ambient: 0.035,
        hemisphere: 0.045,
        flashlightIntensity: GAME_CONFIG.flashlight.intensity * 2.35,
        flashlightDistance: 25,
        flashlightAngle: GAME_CONFIG.flashlight.angle,
        flashlightPenumbra: GAME_CONFIG.flashlight.penumbra,
        fogNear: 6,
        fogFar: 42,
        fogBlend: 1,
      };
    }

    switch (this.officeGameModeDifficulty) {
      case 'easy':
        return {
          ambient: 0.038,
          hemisphere: 0.064,
          flashlightIntensity: GAME_CONFIG.flashlight.intensity * 2.95,
          flashlightDistance: 42,
          flashlightAngle: Math.PI / 8.2,
          flashlightPenumbra: 0.34,
          fogNear: 7.5,
          fogFar: 42,
          fogBlend: 1,
        };
      case 'hard':
        return {
          ambient: 0,
          hemisphere: 0.001,
          flashlightIntensity: GAME_CONFIG.flashlight.intensity * 3.55,
          flashlightDistance: 40,
          flashlightAngle: Math.PI / 8.8,
          flashlightPenumbra: 0.28,
          fogNear: 1.4,
          fogFar: 18,
          fogBlend: 1,
        };
      case 'normal':
      default:
        return {
          ambient: 0.008,
          hemisphere: 0.014,
          flashlightIntensity: GAME_CONFIG.flashlight.intensity * 3.25,
          flashlightDistance: 41,
          flashlightAngle: Math.PI / 8.4,
          flashlightPenumbra: 0.31,
          fogNear: 3.8,
          fogFar: 28,
          fogBlend: 1,
        };
    }
  }

  private updateOfficeGameModeAnimatronic(
    animatronic: OfficeGameModeAnimatronicState,
    deltaSeconds: number,
    canLeaveStage: boolean,
  ): boolean {
    const config = this.getOfficeGameModeConfig();
    const root = animatronic.model.root;
    const playerPosition = this.player.getPosition();
    const animatronicPosition = new Vector3(root.position.x, GAME_CONFIG.player.height, root.position.z);
    const distanceToPlayer = animatronicPosition.distanceTo(playerPosition);
    animatronic.attackCooldown = Math.max(0, animatronic.attackCooldown - deltaSeconds);

    const blockedDoorId = this.getOfficeGameModeBlockedDoorId(animatronicPosition, playerPosition);
    const doorBlocked = blockedDoorId !== null;
    const inDetectionRange = distanceToPlayer <= this.getOfficeGameModeDetectionRange(config);
    const canSeePlayer = !doorBlocked
      && !this.officeVentActive
      && !this.officeVentDrop
      && !this.officeChapterSeated
      && !this.officeBallPitHidden
      && inDetectionRange
      && this.hasOfficeGameModeLineOfSight(animatronicPosition, playerPosition);

    if (animatronic.state === 'stage') {
      this.officeChapter.setStageAnimatronicPresent(animatronic.animatronic, true);
      animatronic.model.root.visible = false;
      animatronic.waitTimer = Math.max(0, animatronic.waitTimer - deltaSeconds);
      if (animatronic.waitTimer <= 0 && canLeaveStage) {
        if (this.shouldOfficeGameModeAnimatronicLeaveStage(animatronic, canSeePlayer)) {
          this.sendOfficeGameModeAnimatronicOffStage(animatronic);
          return true;
        }

        animatronic.waitTimer = this.getOfficeGameModeStageDwellSeconds(animatronic.animatronic) * 0.55;
      }
      return false;
    }

    animatronic.model.root.visible = true;
    this.officeChapter.setStageAnimatronicPresent(animatronic.animatronic, false);

    if (canSeePlayer) {
      animatronic.lastKnownPlayerPosition.copy(playerPosition);
      animatronic.lostSightTimer = 0;
    }

    if (this.officeBallPitHidden && (animatronic.state === 'chase' || animatronic.state === 'rush')) {
      animatronic.state = 'wander';
      animatronic.lostSightTimer = 0;
      animatronic.waitTimer = 1.2;
      animatronic.progressStallTimer = 0;
      animatronic.detourTarget = null;
      animatronic.detourTimer = 0;
    } else if (doorBlocked && (animatronic.state === 'chase' || animatronic.state === 'rush') && blockedDoorId) {
      animatronic.state = 'door';
      animatronic.waitTimer = 0;
      animatronic.lostSightTimer = 0;
      animatronic.progressStallTimer = 0;
      animatronic.detourTarget = null;
      animatronic.detourTimer = 0;
    } else if (canSeePlayer && animatronic.attackCooldown <= 0 && animatronic.state !== 'retreat' && animatronic.state !== 'rush') {
      animatronic.state = 'chase';
    } else if (animatronic.state === 'chase' && !canSeePlayer) {
      animatronic.lostSightTimer += deltaSeconds;
      if (animatronic.lostSightTimer >= config.lostSightSeconds) {
        animatronic.state = 'wander';
        animatronic.waitTimer = 1.6;
        animatronic.lostSightTimer = 0;
        animatronic.progressStallTimer = 0;
        animatronic.detourTarget = null;
        animatronic.detourTimer = 0;
      }
    } else if (animatronic.state === 'door' && !doorBlocked) {
      animatronic.state = canSeePlayer ? 'chase' : 'retreat';
      animatronic.routeIndex = 0;
      animatronic.waitTimer = 0.2;
      animatronic.progressStallTimer = 0;
      animatronic.detourTarget = null;
      animatronic.detourTimer = 0;
    }

    if (animatronic.state === 'rush' && animatronic.animatronic === 'foxy' && this.officeFoxyRushDoor) {
      const door = this.getOfficeDoorById(this.officeFoxyRushDoor);
      const doorClosed = Boolean(door && door.targetOpenAmount < 0.5);
      const doorTarget = this.getOfficeFoxyRushDoorTarget();
      const distanceToRushDoor = Math.hypot(
        animatronicPosition.x - doorTarget.x,
        animatronicPosition.z - doorTarget.z,
      );
      if (this.isPlayerInsideOfficeRoom(playerPosition) && distanceToRushDoor <= 1.1) {
        if (doorClosed) {
          animatronic.state = 'door';
          animatronic.waitTimer = 0.3;
          animatronic.progressStallTimer = 0;
          animatronic.detourTarget = null;
          animatronic.detourTimer = 0;
          return false;
        }

        const definition = this.getRandomOfficeJumpscareDefinition('foxy');
        if (definition && animatronic.attackCooldown <= 0 && !this.activeOfficeJumpscare) {
          animatronic.attackCooldown = 5.2;
          this.startOfficeJumpscare(definition);
          return false;
        }
      }
    }

    if (canSeePlayer && distanceToPlayer <= config.attackRange && animatronic.attackCooldown <= 0) {
      const definition = this.getRandomOfficeJumpscareDefinition(animatronic.animatronic);
      if (definition && !this.activeOfficeJumpscare) {
        animatronic.attackCooldown = 5.2;
        this.startOfficeJumpscare(definition);
      }
      return false;
    }

    if (animatronic.waitTimer > 0) {
      animatronic.waitTimer = Math.max(0, animatronic.waitTimer - deltaSeconds);
      return false;
    }

    const rawDesiredTarget = animatronic.state === 'rush' && animatronic.animatronic === 'foxy'
      ? this.getOfficeFoxyRushDoorTarget()
      : animatronic.state === 'rush'
      ? this.player.getPosition()
      : animatronic.state === 'chase'
      ? animatronic.lastKnownPlayerPosition
      : animatronic.state === 'door' && blockedDoorId
        ? (blockedDoorId === 'left' ? OFFICE_GAME_MODE_LEFT_DOOR_WATCH : OFFICE_GAME_MODE_RIGHT_DOOR_WATCH)
        : animatronic.route[animatronic.routeIndex] ?? animatronic.route[0] ?? OFFICE_GAME_MODE_OFFICE_CENTER;
    const desiredTarget = this.getOfficeGameModeSafeTarget(animatronic, rawDesiredTarget);
    animatronic.detourTimer = Math.max(0, animatronic.detourTimer - deltaSeconds);
    if (animatronic.detourTarget) {
      const distanceToDetour = Math.hypot(
        animatronic.detourTarget.x - root.position.x,
        animatronic.detourTarget.z - root.position.z,
      );
      const directPathAvailable = this.isOfficeGameModePathClear(
        root.position.x,
        root.position.z,
        desiredTarget.x,
        desiredTarget.z,
        OFFICE_GAME_MODE_COLLISION_RADIUS * 0.62,
      );
      if (distanceToDetour <= 0.24 || animatronic.detourTimer <= 0 || directPathAvailable) {
        animatronic.detourTarget = null;
        animatronic.detourTimer = 0;
      }
    }

    if (
      !animatronic.detourTarget
      && Math.hypot(desiredTarget.x - root.position.x, desiredTarget.z - root.position.z) > 0.5
      && !this.isOfficeGameModePathClear(
        root.position.x,
        root.position.z,
        desiredTarget.x,
        desiredTarget.z,
        OFFICE_GAME_MODE_COLLISION_RADIUS * 0.62,
      )
    ) {
      const detour = this.findOfficeGameModeDetour(animatronic, desiredTarget);
      if (detour) {
        animatronic.detourTarget = detour;
        animatronic.detourTimer = animatronic.state === 'chase' || animatronic.state === 'rush' ? 1.15 : 1.85;
      }
    }

    const target = animatronic.detourTarget ?? desiredTarget;
    const movingToDetour = animatronic.detourTarget !== null;
    const dx = target.x - root.position.x;
    const dz = target.z - root.position.z;
    const distance = Math.hypot(dx, dz);
    const nightSpeedMultiplier = this.getOfficeGameModeSpeedMultiplier();
    const speed = animatronic.state === 'rush'
      ? OFFICE_FOXY_RUSH_SPEED * (this.officeGameModePowerOut ? 1.08 : 1)
      : animatronic.state === 'chase'
      ? config.chaseSpeed * nightSpeedMultiplier * (this.officeGameModePowerOut ? 1.18 : 1)
      : animatronic.state === 'retreat'
        ? config.walkSpeed * nightSpeedMultiplier * 1.08
        : config.walkSpeed * nightSpeedMultiplier;

    if (distance <= 0.16) {
      if (movingToDetour) {
        animatronic.detourTarget = null;
        animatronic.detourTimer = 0;
        return false;
      }

      if (animatronic.state === 'rush') {
        animatronic.waitTimer = 0.15;
        return false;
      }

      if (animatronic.state === 'retreat' || (animatronic.state === 'wander' && animatronic.routeIndex === 0)) {
        this.putOfficeGameModeAnimatronicOnStage(animatronic);
        return false;
      }

      if (animatronic.state === 'door') {
        animatronic.waitTimer = 0.45;
        return false;
      }

      if (animatronic.state === 'wander') {
        const reachedRouteIndex = animatronic.routeIndex;
        animatronic.routeIndex = this.getNextOfficeGameModeRouteIndex(animatronic, reachedRouteIndex);
        animatronic.waitTimer = this.getOfficeGameModeWaypointDwellSeconds(animatronic.animatronic, reachedRouteIndex);
        animatronic.stuckTimer = 0;
      }
    } else {
      const moved = this.moveOfficeGameModeAnimatronic(animatronic, dx, dz, distance, speed, deltaSeconds);
      if (moved) {
        const remainingDistance = Math.hypot(target.x - root.position.x, target.z - root.position.z);
        const expectedProgress = Math.max(0.018, speed * deltaSeconds * 0.16);
        if (remainingDistance >= distance - expectedProgress) {
          animatronic.progressStallTimer += deltaSeconds;
        } else {
          animatronic.progressStallTimer = 0;
        }

        if (animatronic.progressStallTimer > 0.85) {
          this.recoverOfficeGameModeAnimatronic(animatronic, desiredTarget);
        } else {
          animatronic.stuckTimer = 0;
        }
      } else {
        if (!this.recoverOfficeGameModeAnimatronic(animatronic, desiredTarget)) {
          animatronic.stuckTimer += deltaSeconds;
        }
      }

      if (!moved && !animatronic.detourTarget && animatronic.state === 'wander') {
        animatronic.routeIndex = this.getNextOfficeGameModeRouteIndex(animatronic, animatronic.routeIndex);
        animatronic.waitTimer = 0.65;
      } else if (!moved && !animatronic.detourTarget && (animatronic.state === 'chase' || animatronic.state === 'rush') && animatronic.stuckTimer > 1.15) {
        animatronic.state = 'wander';
        animatronic.lostSightTimer = 0;
        animatronic.progressStallTimer = 0;
        animatronic.waitTimer = 0.35;
      }
    }

    const running = animatronic.state === 'chase' || animatronic.state === 'rush';
    const motionStrength = running ? 1.55 : 0.62;
    const stepCycle = this.elapsed * (running ? 17.5 : 7.4);
    const leftStep = Math.sin(stepCycle);
    const rightStep = Math.sin(stepCycle + Math.PI);
    animatronic.model.root.rotation.x = MathUtils.lerp(animatronic.model.root.rotation.x, running ? 0.13 : 0, 0.35);
    animatronic.model.root.rotation.z = MathUtils.lerp(animatronic.model.root.rotation.z, running ? Math.sin(stepCycle) * 0.035 : 0, 0.35);
    animatronic.model.leftLeg.rotation.x = leftStep * (running ? 0.58 : 0.42) * motionStrength;
    animatronic.model.rightLeg.rotation.x = rightStep * (running ? 0.58 : 0.42) * motionStrength;
    animatronic.model.leftLegJoint.rotation.x = Math.max(0, -leftStep) * (running ? 0.74 : 0.48) * motionStrength;
    animatronic.model.rightLegJoint.rotation.x = Math.max(0, -rightStep) * (running ? 0.74 : 0.48) * motionStrength;
    animatronic.model.leftArm.rotation.x = rightStep * (running ? 0.54 : 0.28) * motionStrength - (running ? 0.18 : 0);
    animatronic.model.rightArm.rotation.x = leftStep * (running ? 0.54 : 0.28) * motionStrength - (running ? 0.18 : 0);
    animatronic.model.head.rotation.y = Math.sin(this.elapsed * (running ? 9.4 : 5.6)) * 0.08 * (running ? 1.25 : 0.45);
    return false;
  }

  private updateOfficeGameMode(deltaSeconds: number): void {
    if (!this.officeGameModeActive) {
      return;
    }

    this.ensureOfficeGameModeAnimatronics();
    if (this.officeMode === 'game' && !this.officeGameModeNightPhase) {
      return;
    }

    this.updateOfficeGameModePower(deltaSeconds);
    this.updateOfficeFoxyCameraPressure(deltaSeconds);
    this.updateOfficeFoxyRushAudio(deltaSeconds);
    if (this.activeOfficeJumpscare || this.chapterMenuOpen || this.officeJumpscareMenuOpen || this.officeModeMenuOpen) {
      return;
    }

    const maxOffstage = this.getOfficeGameModeMaxOffstage();
    let offStageCount = this.officeGameModeAnimatronics.filter((animatronic) => animatronic.state !== 'stage').length;
    this.officeGameModeAnimatronics.forEach((animatronic) => {
      const leftStage = this.updateOfficeGameModeAnimatronic(
        animatronic,
        deltaSeconds,
        offStageCount < maxOffstage,
      );
      if (leftStage) {
        offStageCount += 1;
      }
    });
    this.updateOfficeVentBoy(deltaSeconds);
  }

  private getPlacementToolHudText(): string {
    const copyText = this.getPlacementMarkerCopyText();
    const lastMarkerText = copyText
      ? `Last marker: ${copyText}`
      : 'Last marker: none yet.';

    return [
      '1. Look at the floor, wall, or object where you want to mark the spot.',
      '2. Left click to place a numbered marker there.',
      '3. Tell Codex the marker number and what object should go there.',
      '',
      'Right click deletes a camera you are aiming at, otherwise it deletes your most recent marker in this area.',
      this.officeChapterActive
        ? 'Press M to open the Chapter 3 mode menu, or press 2 to switch to the tablet.'
        : 'Press M to put the Coordinate Tool away.',
      lastMarkerText,
    ].join('\n');
  }

  private getLatestPlacementMarkerInCurrentArea(): PlacementMarker | undefined {
    const currentChapter = this.getCurrentHudChapterId();
    for (let index = this.placementMarkers.length - 1; index >= 0; index -= 1) {
      const marker = this.placementMarkers[index];
      if (marker.chapter === currentChapter) {
        return marker;
      }
    }

    return undefined;
  }

  private getPlacementMarkerCopyText(): string {
    const marker = this.getLatestPlacementMarkerInCurrentArea();
    return marker
      ? `Marker #${marker.id} / ${this.getChapterLabel(marker.chapter)} / position ${this.formatPlacementVector(marker.position)} / normal ${this.formatPlacementVector(marker.normal)}`
      : '';
  }

  private getPlacementTarget(): { point: Vector3; normal: Vector3 } | null {
    this.camera.getWorldPosition(this.placementRayOrigin);
    this.camera.getWorldDirection(this.placementRayDirection).normalize();
    this.placementRaycaster.near = 0.18;
    this.placementRaycaster.far = 28;
    this.placementRaycaster.set(this.placementRayOrigin, this.placementRayDirection);

    const intersections = this.placementRaycaster.intersectObjects(this.getPlacementRaycastRoots(), true);
    const intersection = intersections.find((hit) => !this.isPlacementToolIgnored(hit.object));
    if (intersection) {
      const normal = intersection.face?.normal.clone() ?? new Vector3(0, 1, 0);
      normal.transformDirection(intersection.object.matrixWorld).normalize();
      return {
        point: intersection.point.clone(),
        normal,
      };
    }

    if (this.placementRayDirection.y < -0.025) {
      const distanceToFloor = (0.02 - this.placementRayOrigin.y) / this.placementRayDirection.y;
      if (distanceToFloor > 0.2 && distanceToFloor <= this.placementRaycaster.far) {
        return {
          point: this.placementRayOrigin.clone().addScaledVector(this.placementRayDirection, distanceToFloor),
          normal: new Vector3(0, 1, 0),
        };
      }
    }

    return null;
  }

  private getPlacementRaycastRoots(): Object3D[] {
    if (this.officeChapterActive) {
      return [this.officeChapter.root];
    }

    if (this.chapterTwoActive) {
      return [this.chapterTwo.root];
    }

    if (this.zombieModeActive) {
      return [this.zombieMode.root];
    }

    if (this.doomModeActive) {
      return [this.doomMode.root];
    }

    return [this.level.root];
  }

  private isPlacementToolIgnored(object: Object3D): boolean {
    let current: Object3D | null = object;
    while (current) {
      if (current.userData.placementToolIgnore) {
        return true;
      }
      current = current.parent;
    }

    return false;
  }

  private placePlacementMarker(): void {
    if (!this.player.isLocked() || this.chapterMenuOpen) {
      return;
    }

    const target = this.getPlacementTarget();
    if (!target) {
      this.pushStatus('No surface is under the placement crosshair. Look at the floor, a wall, or a prop and click again.', 2.4);
      return;
    }

    const markerId = this.nextPlacementMarkerId;
    this.nextPlacementMarkerId += 1;

    const markerRoot = new Group();
    markerRoot.name = `Placement Marker ${markerId}`;
    markerRoot.userData.placementToolIgnore = true;
    this.addPlacementMarkerGeometry(markerRoot, 0x33d6c8, 0.92);
    const label = this.createPlacementMarkerLabel(markerId);
    markerRoot.add(label);
    this.alignPlacementMarker(markerRoot, target.point, target.normal);
    this.placementMarkerRoot.add(markerRoot);

    const marker: PlacementMarker = {
      id: markerId,
      chapter: this.getCurrentHudChapterId(),
      position: target.point.clone(),
      normal: target.normal.clone(),
      root: markerRoot,
      label,
    };
    this.placementMarkers.push(marker);
    this.updatePlacementMarkerVisibility();
    this.gameplaySfxAudio.playSmallPanel(true);
    this.pushStatus(
      `Marker #${marker.id} placed in ${this.getChapterLabel(marker.chapter)} at ${this.formatPlacementVector(marker.position)}.`,
      4.8,
    );
    console.info(
      `[Placement Marker #${marker.id}] chapter=${this.getChapterLabel(marker.chapter)} position=${this.formatPlacementVector(marker.position)} normal=${this.formatPlacementVector(marker.normal)}`,
    );
  }

  private deleteLastPlacementMarker(): void {
    const currentChapter = this.getCurrentHudChapterId();
    for (let index = this.placementMarkers.length - 1; index >= 0; index -= 1) {
      const marker = this.placementMarkers[index];
      if (marker.chapter !== currentChapter) {
        continue;
      }

      marker.root.removeFromParent();
      this.placementMarkers.splice(index, 1);
      this.updatePlacementMarkerVisibility();
      this.gameplaySfxAudio.playSmallPanel(false);
      this.pushStatus(`Marker #${marker.id} deleted from ${this.getChapterLabel(marker.chapter)}.`, 2.2);
      return;
    }

    this.pushStatus('No coordinate markers in this area to delete.', 2);
  }

  private handlePlacementToolRightClick(): void {
    if (this.deleteTargetedOfficeSecurityCamera()) {
      return;
    }

    this.deleteLastPlacementMarker();
  }

  private deleteTargetedOfficeSecurityCamera(): boolean {
    const securityCamera = this.getTargetedOfficeSecurityCamera();
    if (!securityCamera) {
      return false;
    }

    this.deletedOfficeSecurityCameraIds.add(securityCamera.id);
    this.saveDeletedOfficeSecurityCameras();
    const cameras = this.officeChapter.securityCameras;
    const deletedIndex = cameras.indexOf(securityCamera);
    securityCamera.root.removeFromParent();
    if (deletedIndex >= 0) {
      cameras.splice(deletedIndex, 1);
    }

    if (this.officeTabletCameraIndex >= cameras.length) {
      this.officeTabletCameraIndex = Math.max(0, cameras.length - 1);
    }

    if (cameras.length === 0) {
      this.officeTabletCameraFeedActive = false;
      this.resize();
      this.pushStatus(`${securityCamera.label} deleted. No tablet cameras are installed now.`, 2.8);
    } else {
      this.pushStatus(`${securityCamera.label} deleted from the tablet camera system.`, 2.4);
    }
    this.gameplaySfxAudio.playSmallPanel(false);
    return true;
  }

  private loadDeletedOfficeSecurityCameras(): void {
    try {
      const rawCameraIds = window.localStorage.getItem(OFFICE_DELETED_CAMERA_STORAGE_KEY);
      if (!rawCameraIds) {
        return;
      }

      const parsedCameraIds: unknown = JSON.parse(rawCameraIds);
      if (!Array.isArray(parsedCameraIds)) {
        return;
      }

      parsedCameraIds.forEach((cameraId) => {
        if (typeof cameraId === 'number' && Number.isFinite(cameraId)) {
          this.deletedOfficeSecurityCameraIds.add(cameraId);
        }
      });
    } catch {
      this.deletedOfficeSecurityCameraIds.clear();
    }
  }

  private saveDeletedOfficeSecurityCameras(): void {
    try {
      window.localStorage.setItem(
        OFFICE_DELETED_CAMERA_STORAGE_KEY,
        JSON.stringify([...this.deletedOfficeSecurityCameraIds]),
      );
    } catch {
      // Camera deletion still works for the current session if local storage is unavailable.
    }
  }

  private applyDeletedOfficeSecurityCameras(): void {
    if (this.deletedOfficeSecurityCameraIds.size === 0) {
      return;
    }

    for (let index = this.officeChapter.securityCameras.length - 1; index >= 0; index -= 1) {
      const securityCamera = this.officeChapter.securityCameras[index];
      if (!this.deletedOfficeSecurityCameraIds.has(securityCamera.id)) {
        continue;
      }

      securityCamera.root.removeFromParent();
      this.officeChapter.securityCameras.splice(index, 1);
    }

    this.officeTabletCameraIndex = Math.min(
      this.officeTabletCameraIndex,
      Math.max(0, this.officeChapter.securityCameras.length - 1),
    );
  }

  private getTargetedOfficeSecurityCamera(): OfficeChapterData['securityCameras'][number] | null {
    if (!this.officeChapterActive || this.officeChapter.securityCameras.length === 0) {
      return null;
    }

    this.camera.getWorldPosition(this.placementRayOrigin);
    this.camera.getWorldDirection(this.placementRayDirection).normalize();
    this.placementRaycaster.near = 0.18;
    this.placementRaycaster.far = 28;
    this.placementRaycaster.set(this.placementRayOrigin, this.placementRayDirection);

    const intersections = this.placementRaycaster.intersectObjects(
      this.officeChapter.securityCameras.map((securityCamera) => securityCamera.root),
      true,
    );
    for (const hit of intersections) {
      const securityCamera = this.getOfficeSecurityCameraFromObject(hit.object);
      if (securityCamera) {
        return securityCamera;
      }
    }

    return null;
  }

  private getOfficeSecurityCameraFromObject(object: Object3D): OfficeChapterData['securityCameras'][number] | null {
    let current: Object3D | null = object;
    while (current) {
      const securityCamera = this.officeChapter.securityCameras.find((camera) => camera.root === current);
      if (securityCamera) {
        return securityCamera;
      }
      current = current.parent;
    }

    return null;
  }

  private updatePlacementToolDisplay(): void {
    const tabletActive = this.officeChapterActive && (this.officeTabletHeld || this.officeTabletCameraFeedActive);
    const toolVisible = this.placementToolActive && this.player.isLocked() && !this.chapterMenuOpen && !this.officeJumpscareMenuOpen && !this.officeModeMenuOpen && !tabletActive;
    this.placementToolAnchor.visible = toolVisible;

    if (this.officeChapterActive) {
      this.officeBasketballAnchor.visible = this.officeBasketballHeld && this.player.isLocked() && !this.officeJumpscareMenuOpen && !this.officeModeMenuOpen && !toolVisible && !tabletActive && !this.officeGlassHeld;
    }
    if (toolVisible && (this.zombieModeActive || this.doomModeActive)) {
      this.zombieWeaponAnchor.visible = false;
    }

    if (toolVisible) {
      const target = this.getPlacementTarget();
      if (target) {
        this.alignPlacementMarker(this.placementPreview, target.point, target.normal);
        this.placementPreview.visible = true;
      } else {
        this.placementPreview.visible = false;
      }
    } else {
      this.placementPreview.visible = false;
    }

    this.updatePlacementMarkerVisibility();
    this.placementMarkerRoot.visible = true;
    this.camera.getWorldPosition(this.placementCameraWorldPosition);
    this.placementMarkers.forEach((marker) => {
      if (marker.root.visible) {
        marker.label.lookAt(this.placementCameraWorldPosition);
      }
    });
  }

  private updateOfficeTabletDisplay(): void {
    const tabletVisible = this.officeChapterActive
      && this.officeTabletHeld
      && this.player.isLocked()
      && !this.chapterMenuOpen
      && !this.officeJumpscareMenuOpen
      && !this.officeModeMenuOpen
      && !this.officeTabletCameraFeedActive;
    this.officeTabletAnchor.visible = tabletVisible;
  }

  private updateOfficeGlassDisplay(): void {
    this.officeGlassAnchor.visible = this.officeChapterActive
      && this.officeGlassHeld
      && this.player.isLocked()
      && !this.chapterMenuOpen
      && !this.officeJumpscareMenuOpen
      && !this.officeModeMenuOpen
      && !this.officeTabletCameraFeedActive
      && !this.placementToolActive;
  }

  private updatePlacementMarkerVisibility(): void {
    const currentChapter = this.getCurrentHudChapterId();
    this.placementMarkers.forEach((marker) => {
      marker.root.visible = marker.chapter === currentChapter;
    });
  }

  private alignPlacementMarker(root: Group, point: Vector3, normal: Vector3): void {
    this.placementSurfaceNormal.copy(normal).normalize();
    this.placementSurfaceQuaternion.setFromUnitVectors(this.placementSurfaceUp, this.placementSurfaceNormal);
    root.position.copy(point).addScaledVector(this.placementSurfaceNormal, 0.035);
    root.quaternion.copy(this.placementSurfaceQuaternion);
  }

  private formatPlacementVector(vector: Vector3): string {
    return `x:${vector.x.toFixed(2)} y:${vector.y.toFixed(2)} z:${vector.z.toFixed(2)}`;
  }

  private getChapterLabel(chapter: HudChapterId): string {
    switch (chapter) {
      case 'chapter-1':
        return 'Chapter 1';
      case 'chapter-2':
        return 'Chapter 2';
      case 'chapter-3':
        return 'Chapter 3';
      case 'zombie-fps':
        return 'Zombie FPS';
      case 'doom-fps':
        return 'Doom Run';
    }
  }

  private updateMonster(deltaSeconds: number): void {
    if (this.chapterTwoActive) {
      this.touchingMonster = null;
      this.monsterState = this.unlockedMonsterState;
      return;
    }

    let closestDistance = Infinity;
    let highestThreat = 0;
    let touching = false;
    let touchingMonster: MonsterController | null = null;
    let touchingDistance = Infinity;

    this.monsters.forEach((monster) => {
      const state = monster.update(
        deltaSeconds,
        this.player.getPosition(),
        this.isPlayerSafe(),
      );

      closestDistance = Math.min(closestDistance, state.distance);
      highestThreat = Math.max(highestThreat, state.threat);
      touching = touching || state.touching;

      if (
        state.touching
        && (this.monsterHitCooldowns.get(monster) ?? 0) <= 0
        && state.distance < touchingDistance
      ) {
        touchingDistance = state.distance;
        touchingMonster = monster;
      }
    });

    this.touchingMonster = touchingMonster;
    this.monsterState = {
      distance: closestDistance,
      threat: highestThreat,
      touching,
    };
  }

  private updateHealth(deltaSeconds: number): void {
    if (this.zombieModeActive || this.doomModeActive) {
      return;
    }

    this.monsterHitCooldowns.forEach((remaining, monster) => {
      const next = Math.max(remaining - deltaSeconds, 0);
      if (next === 0) {
        this.monsterHitCooldowns.delete(monster);
        return;
      }

      this.monsterHitCooldowns.set(monster, next);
    });

    if (this.activeJumpscare) {
      this.activeJumpscare.elapsed = Math.min(
        this.activeJumpscare.elapsed + deltaSeconds,
        GAME_CONFIG.monster.jumpScareDuration,
      );

      this.player.lookToward(
        this.activeJumpscare.monster.getFocusPosition(this.jumpscareLookTarget),
        0.72 + this.getJumpScareIntensity() * 0.26,
      );

      if (this.activeJumpscare.elapsed >= GAME_CONFIG.monster.jumpScareDuration) {
        const jumpscare = this.activeJumpscare;
        this.activeJumpscare = null;

        if (jumpscare.knockout) {
          this.resetAfterMonsterHit();
          return;
        }
      }

      return;
    }

    if (this.touchingMonster && !this.isPlayerSafe()) {
      const cooldown = this.monsterHitCooldowns.get(this.touchingMonster) ?? 0;

      if (cooldown <= 0) {
        this.triggerJumpScare(this.touchingMonster);
        return;
      }
    }

    if (this.isPlayerSafe()) {
      this.health = Math.min(
        GAME_CONFIG.player.healthMax,
        this.health + GAME_CONFIG.player.healthRecoverPerSecond * deltaSeconds,
      );
    }
  }

  private updateAtmosphere(): void {
    this.lighting.flashlight.angle = GAME_CONFIG.flashlight.angle;
    this.lighting.flashlight.penumbra = GAME_CONFIG.flashlight.penumbra;

    if (this.zombieModeActive) {
      const nightBlend = this.getZombieNightBlend();
      this.lighting.ambient.intensity = MathUtils.lerp(0.68, 0.12, nightBlend);
      this.lighting.hemisphere.intensity = MathUtils.lerp(0.94, 0.26, nightBlend);
      this.lighting.flashlight.intensity = MathUtils.lerp(GAME_CONFIG.flashlight.intensity, 2.8, nightBlend);
      this.lighting.flashlight.distance = MathUtils.lerp(18, 28, nightBlend);

      if (this.scene.background instanceof Color) {
        this.scene.background.copy(this.zombieDayFogColor).lerp(this.zombieNightFogColor, nightBlend);
      }

      if (this.scene.fog instanceof Fog) {
        this.scene.fog.color.copy(this.zombieDayFogColor).lerp(this.zombieNightFogColor, nightBlend);
        this.scene.fog.near = MathUtils.lerp(55, 16, nightBlend);
        this.scene.fog.far = MathUtils.lerp(198, 72, nightBlend);
      }

      return;
    }

    if (this.doomModeActive) {
      this.lighting.ambient.intensity = 0.42;
      this.lighting.hemisphere.intensity = 0.16;
      this.lighting.flashlight.intensity = 0;
      this.lighting.flashlight.distance = 0;

      if (this.scene.background instanceof Color) {
        this.scene.background.setHex(0x1b0a08);
      }

      if (this.scene.fog instanceof Fog) {
        this.scene.fog.color.setHex(0x1b0a08);
        this.scene.fog.near = 38;
        this.scene.fog.far = 132;
      }

      return;
    }

    if (this.chapterTwoActive) {
      const powerOutBlend = this.chapterTwoPowerOutageTriggered ? 1 : 0;
      this.lighting.ambient.intensity = MathUtils.lerp(0.52, 0.06, powerOutBlend);
      this.lighting.hemisphere.intensity = MathUtils.lerp(0.78, 0.08, powerOutBlend);
      this.lighting.flashlight.intensity = MathUtils.lerp(
        GAME_CONFIG.flashlight.intensity,
        3.4,
        powerOutBlend,
      );
      this.lighting.flashlight.distance = MathUtils.lerp(22, 30, powerOutBlend);

      if (this.scene.background instanceof Color) {
        this.scene.background.copy(this.chapterTwoFogColor).lerp(this.mazeFogColor, powerOutBlend * 0.88);
      }

      if (this.scene.fog instanceof Fog) {
        this.scene.fog.color.copy(this.chapterTwoFogColor).lerp(this.mazeFogColor, powerOutBlend * 0.88);
        this.scene.fog.near = MathUtils.lerp(52, 14, powerOutBlend);
        this.scene.fog.far = MathUtils.lerp(215, 68, powerOutBlend);
      }

      return;
    }

    if (this.officeChapterActive) {
      const nightBlend = this.getOfficeNightBlend();
      const nightLighting = this.getOfficeNightLightingSettings();
      this.lighting.ambient.intensity = MathUtils.lerp(0.62, nightLighting.ambient, nightBlend);
      this.lighting.hemisphere.intensity = MathUtils.lerp(0.82, nightLighting.hemisphere, nightBlend);
      this.lighting.flashlight.intensity = MathUtils.lerp(
        GAME_CONFIG.flashlight.intensity * 0.34,
        nightLighting.flashlightIntensity,
        nightBlend,
      );
      this.lighting.flashlight.distance = MathUtils.lerp(13, nightLighting.flashlightDistance, nightBlend);
      this.lighting.flashlight.angle = MathUtils.lerp(GAME_CONFIG.flashlight.angle, nightLighting.flashlightAngle, nightBlend);
      this.lighting.flashlight.penumbra = MathUtils.lerp(GAME_CONFIG.flashlight.penumbra, nightLighting.flashlightPenumbra, nightBlend);

      if (this.scene.background instanceof Color) {
        this.scene.background.copy(this.officeChapterFogColor).lerp(this.officeNightFogColor, nightBlend * nightLighting.fogBlend);
      }

      if (this.scene.fog instanceof Fog) {
        this.scene.fog.color.copy(this.officeChapterFogColor).lerp(this.officeNightFogColor, nightBlend * nightLighting.fogBlend);
        this.scene.fog.near = MathUtils.lerp(42, nightLighting.fogNear, nightBlend);
        this.scene.fog.far = MathUtils.lerp(150, nightLighting.fogFar, nightBlend);
      }

      return;
    }

    const playerZ = this.player.getPosition().z;
    const threshold = this.level.pantryEntrancePosition.z + 10;
    const mazeBlend = MathUtils.clamp((threshold - playerZ) / 18, 0, 1);
    const fearBlend = MathUtils.clamp(mazeBlend + this.monsterState.threat * 0.22, 0, 1);

    this.lighting.ambient.intensity = MathUtils.lerp(0.62, 0.018, fearBlend);
    this.lighting.hemisphere.intensity = MathUtils.lerp(0.92, 0.048, fearBlend);
    this.lighting.flashlight.intensity = MathUtils.lerp(
      GAME_CONFIG.flashlight.intensity,
      3.7,
      mazeBlend,
    );
    this.lighting.flashlight.distance = MathUtils.lerp(
      GAME_CONFIG.flashlight.distance,
      32,
      mazeBlend,
    );

    if (this.scene.background instanceof Color) {
      this.scene.background.copy(this.kitchenFogColor).lerp(this.mazeFogColor, fearBlend);
    }

    if (this.scene.fog instanceof Fog) {
      this.scene.fog.color.copy(this.kitchenFogColor).lerp(this.mazeFogColor, fearBlend);
      this.scene.fog.near = MathUtils.lerp(GAME_CONFIG.fog.near, 8, mazeBlend);
      this.scene.fog.far = MathUtils.lerp(GAME_CONFIG.fog.far, 56, mazeBlend);
    }
  }

  private updateStoveLight(): void {
    const flicker =
      0.92
      + Math.abs(Math.sin(this.elapsed * 7.3)) * 0.26
      + Math.random() * 0.05;

    const readyBoost = this.getAssemblableRecipe() ? 0.26 : 0;
    const platedBoost = this.platedRecipeId ? 0.2 : 0;
    const threatBoost = this.monsterState.threat * 0.22;

    this.level.stoveLight.intensity = (1.18 + readyBoost + platedBoost + threatBoost) * flicker;
  }

  private updateVenueLights(): void {
    this.level.flickerFixtures.forEach((fixture) => {
      const instability = fixture.instability;
      const mazeFixture = fixture.zone === 'maze';

      if (mazeFixture) {
        const burstTime = this.elapsed * (0.26 + instability * 0.11) + fixture.phase * 2.4;
        const burstCarrier =
          Math.sin(burstTime)
          + Math.sin(burstTime * 0.56 + fixture.phase * 2.2) * 0.78
          + Math.sin(burstTime * 1.34 + fixture.phase * 0.9) * 0.24;
        const burstWindow = MathUtils.smoothstep(burstCarrier, 0.84, 1.36);
        const warmup = MathUtils.smoothstep(burstWindow, 0.08, 0.92);
        const sputter = Math.max(
          0,
          Math.sin(this.elapsed * (15.6 + instability * 10.4) + fixture.phase * 3.6),
        );
        const filament =
          0.78
          + Math.sin(this.elapsed * (10.4 + instability * 7.6) + fixture.phase * 1.8) * 0.18
          + Math.sin(this.elapsed * (27.8 + instability * 11.8) + fixture.phase * 4.1) * 0.1;
        const flutter = Math.max(
          0.06,
          filament - sputter * (0.28 + instability * 0.26),
        );
        const threatPulse = this.monsterState.threat * 0.08 * burstWindow;
        const factor = Math.max(
          0.002,
          burstWindow * (0.16 + warmup * 0.82) * flutter + threatPulse,
        );

        if (fixture.light) {
          fixture.light.intensity = fixture.baseIntensity * factor * 0.82;
        }
        fixture.material.emissiveIntensity = fixture.baseEmissiveIntensity * Math.max(
          0.012,
          factor * 0.5,
        );
        return;
      }

      const baseWave =
        0.92
        + Math.sin(this.elapsed * (2.1 + instability * 1.4) + fixture.phase) * 0.08
        + Math.sin(this.elapsed * (7.3 + instability * 5.8) + fixture.phase * 1.8) * 0.05;
      const sputter = Math.max(
        0,
        Math.sin(this.elapsed * (11.5 + instability * 13.2) + fixture.phase * 3.1),
      );
      const brownout = Math.max(
        0,
        Math.sin(this.elapsed * (21.2 + instability * 22.4) + fixture.phase * 4.6),
      );
      const drop =
        1
        - sputter * instability * 0.22
        - brownout * instability * 0.16;
      const factor = Math.max(
        0.36,
        baseWave * drop - instability * 0.05,
      );

      if (fixture.light) {
        fixture.light.intensity = fixture.baseIntensity * factor;
      }
      fixture.material.emissiveIntensity = fixture.baseEmissiveIntensity * Math.max(
        0.34,
        factor * 0.94,
      );
    });
  }

  private updateJumpScareLens(deltaSeconds: number): void {
    const intensity = this.getCombinedJumpScareIntensity();
    const targetFov = GAME_CONFIG.camera.fov + intensity * 20;
    const blend = this.activeJumpscare || this.activeOfficeJumpscare || this.chapterTwoBearRefusalTimer > 0
      ? Math.min(1, deltaSeconds * 24)
      : Math.min(1, deltaSeconds * 12);
    const nextFov = MathUtils.lerp(this.camera.fov, targetFov, blend);

    if (Math.abs(nextFov - this.camera.fov) < 0.05) {
      return;
    }

    this.camera.fov = nextFov;
    this.camera.updateProjectionMatrix();
  }

  private updateMachineJobs(deltaSeconds: number): void {
    this.machineJobs.forEach((job, stationId) => {
      job.remaining = Math.max(job.remaining - deltaSeconds, 0);
      const progress = 1 - job.remaining / job.duration;

      this.level.stationAnimator.setMachineState(stationId, {
        input: job.input,
        output: job.output,
        progress,
      });

      if (job.remaining > 0) {
        return;
      }

      this.addItem(job.output);
      this.machineJobs.delete(stationId);
      this.level.stationAnimator.setMachineState(stationId, null);
      this.pushStatus(job.finishText);
    });
  }

  private getCurrentHudChapterId(): HudChapterId {
    if (this.zombieModeActive) {
      return 'zombie-fps';
    }

    if (this.doomModeActive) {
      return 'doom-fps';
    }

    if (this.officeChapterActive) {
      return 'chapter-3';
    }

    return this.chapterTwoActive ? 'chapter-2' : 'chapter-1';
  }

  private syncHud(): void {
    const locked = this.player.isLocked();
    const currentChapter = this.getCurrentHudChapterId();

    this.hud.setTheme(this.doomModeActive ? 'doom' : 'default');
    this.hud.setCrosshairMode(
      this.zombieModeActive || this.doomModeActive || this.officeChapterActive
        ? 'firearm'
        : 'default',
    );
    this.hud.setThreatEye(
      this.doomModeActive && locked && !this.chapterMenuOpen
        ? this.doomThreatEyeIntensity
        : 0,
    );
    this.hud.setFlashlight(this.flashlight.isEnabled());
    this.hud.setHealthLabel('Health');
    this.hud.setStaminaLabel(this.doomModeActive ? 'Armor' : 'Stamina');
    this.hud.setObjective(this.getObjectiveText());
    const storyNotice = this.getStoryNoticeState();
    this.hud.setStoryNotice(storyNotice.text, storyNotice.active, storyNotice.label);
    this.hud.setChapterCard(
      this.chapterTwoCardTime > 0,
      this.chapterCardTitle,
      this.chapterCardBody,
    );
    this.hud.setChapterLabel(
      this.zombieModeActive
        ? 'Chapter: Zombie FPS / press P'
        : this.doomModeActive
          ? 'Mode: Doom Run / press P'
        : this.officeChapterActive
          ? 'Chapter: 3 / press P'
        : this.chapterTwoActive
          ? 'Chapter: 2 / press P'
          : 'Chapter: 1 / press P',
    );
    this.hud.setChapterMenu(this.chapterMenuOpen, currentChapter);
    this.hud.setOfficeJumpscareMenu(
      this.officeJumpscareMenuOpen,
      this.getOfficeJumpscareOptions(),
    );
    this.hud.setOfficeModeMenu(
      this.officeModeMenuOpen,
      this.officeModeMenuStep,
      this.officeModeMenuPendingMode,
      this.officeMode,
      this.officeGameModeDifficulty,
    );
    this.hud.setPlacementTool(
      this.placementToolActive,
      this.getPlacementToolHudText(),
      this.getPlacementMarkerCopyText(),
    );
    this.hud.setTabletCameras(
      this.officeChapterActive && this.officeTabletCameraFeedActive,
      this.getActiveOfficeTabletCamera()?.label ?? 'No Camera Installed',
      this.getOfficeTabletCameraSlots(),
    );
    this.hud.setOfficeHardVignette(
      this.officeChapterActive
        && this.officeGameModeActive
        && this.officeGameModeDifficulty === 'hard'
        && this.getOfficeNightBlend() > 0.01,
      MathUtils.clamp(this.getOfficeNightBlend(), 0, 1),
    );
    this.hud.setOfficePower(
      this.officeChapterActive && this.officeGameModeActive,
      this.officeGameModePower / 100,
      this.officeGameModePowerOut,
      this.officeGameModeActive ? this.getOfficeGameModeNightHudLabel() : '',
      this.officeGameModeActive ? this.getOfficeGameModeTimeHudLabel() : '',
    );
    this.hud.setInventory(this.getInventoryText());
    const promptText = this.getPromptText(locked);
    this.hud.setPrompt(promptText);
    this.hud.setActionPrompt(this.getActionPromptText(locked, promptText));
    this.hud.setHealth(this.health / GAME_CONFIG.player.healthMax);
    this.hud.setStamina(
      this.doomModeActive
        ? this.doomArmor / 100
        : this.stamina / GAME_CONFIG.player.staminaMax,
    );
    this.hud.setHotbar(this.getHotbarSlots());
    this.hud.setJumpscare(this.getHudJumpScareVariant(), this.getHudJumpScareIntensity());
    const nightModeAttack = this.getNightModeAttackHudState();
    this.hud.setNightModeAttack(
      nightModeAttack.active,
      nightModeAttack.armProgress,
      nightModeAttack.blackout,
    );
    const puppetProgress = this.officeCameraPuppetPhase === 'camera-face'
      ? 1 - this.officeCameraPuppetTimer / OFFICE_CAMERA_PUPPET_CAMERA_FAIL_SECONDS
      : this.officeCameraPuppetPhase === 'room-watch'
        ? 1 - this.officeCameraPuppetTimer / OFFICE_CAMERA_PUPPET_REOPEN_SECONDS
        : this.officeCameraPuppetPhase === 'jumpscare'
          ? 1 - this.officeCameraPuppetTimer / OFFICE_CAMERA_PUPPET_JUMPSCARE_SECONDS
          : 0;
    this.hud.setOfficeCameraPuppet(
      this.officeCameraPuppetPhase !== 'idle',
      this.officeCameraPuppetPhase === 'idle' ? 'camera-face' : this.officeCameraPuppetPhase,
      puppetProgress,
      this.officeCameraPuppetPhase === 'room-watch' ? this.officeCameraPuppetTimer : 0,
    );
    this.hud.setOfficeCutscene(
      this.activeOfficeJumpscare !== null,
      this.activeOfficeJumpscare?.definition.label ?? '',
      this.activeOfficeJumpscare
        ? this.activeOfficeJumpscare.elapsed / this.activeOfficeJumpscare.duration
        : 0,
    );
    this.hud.setBallPitHidden(this.officeChapterActive && this.officeBallPitHidden);
    this.level.stationAnimator.setPlateState({
      holdingPlate: this.holdingPlate,
      recipeId: this.plateRecipeId,
      stagedIngredients: this.plateIngredients,
      platedRecipeId: this.platedRecipeId,
    });

    if (this.chapterMenuOpen) {
      this.hud.setStatus('Chapter menu open. Choose a chapter or mode with the mouse, or press P again to close it.');
      return;
    }

    if (this.officeJumpscareMenuOpen) {
      this.hud.setStatus('Jumpscare menu open. Choose a Chapter 3 animatronic cutscene, or press J again to close it.');
      return;
    }

    if (this.officeModeMenuOpen) {
      this.hud.setStatus('Chapter 3 mode menu open. Pick Night, Game, or Creator Mode, or press M again to close it.');
      return;
    }

    if (!locked) {
      this.hud.setStatus(
        this.zombieModeActive
          ? 'Pointer unlocked. Click the play space to jump back into the zombie run.'
          : this.doomModeActive
            ? 'Pointer unlocked. Click the play space to jump back into the techbase run.'
          : this.officeChapterActive
            ? 'Pointer unlocked. Click the play space to keep exploring the office chapter.'
          : this.chapterTwoActive
          ? 'Pointer unlocked. Click the play space to keep exploring the locked daycare wing.'
          : 'Pointer unlocked. Click anywhere on the play space to jump back into first person.',
      );
      return;
    }

    this.hud.setStatus(this.getStatusText());
  }

  private handleInteract(): void {
    if (!this.player.isLocked() || this.activeJumpscare) {
      return;
    }

    if (this.zombieModeActive) {
      this.handleZombieModeInteract();
      return;
    }

    if (this.doomModeActive) {
      this.handleDoomModeInteract();
      return;
    }

    if (this.officeChapterActive) {
      if (this.officeTabletCameraFeedActive) {
        return;
      }

      this.handleOfficeChapterInteract();
      return;
    }

    if (this.chapterTwoActive) {
      this.handleChapterTwoInteract();
      return;
    }

    if (this.tryUseChapterExit()) {
      return;
    }

    const assemblyStation = this.getNearbyStationById('assembly');
    if (this.platedRecipeId && !this.holdingPlate && assemblyStation) {
      this.handleStationInteract(assemblyStation);
      return;
    }

    const submissionStation = this.getNearbyStationById('submission');
    if (this.holdingPlate && this.platedRecipeId && submissionStation) {
      this.handleStationInteract(submissionStation);
      return;
    }

    const ingredient = this.getNearestIngredient();
    if (ingredient) {
      this.collectIngredient(ingredient);
      return;
    }

    const station = this.getNearestStation();
    if (station) {
      this.handleStationInteract(station);
      return;
    }
    this.pushStatus('Nothing here needs your attention.');
  }

  private handleUseItem(): void {
    if (!this.player.isLocked() || this.activeJumpscare) {
      return;
    }

    if (this.zombieModeActive) {
      return;
    }

    if (this.doomModeActive) {
      return;
    }

    if (this.officeChapterActive) {
      this.handleOfficeUseItem();
      return;
    }

    if (!this.chapterTwoActive) {
      return;
    }

    if (this.chapterTwoSeatId) {
      this.pushStatus('Stand up before you drink the coffee.');
      return;
    }

    if (this.activeCoffeeDrink) {
      return;
    }

    if (!this.hasItem('coffee')) {
      this.pushStatus('You do not have any coffee in your inventory.');
      return;
    }

    this.removeItem('coffee');
    this.activeCoffeeDrink = {
      elapsed: 0,
      duration: CHAPTER_TWO_COFFEE_DRINK_DURATION,
    };
    this.ensureCarriedDrinkModel();
    this.carriedDrinkAnchor.visible = true;
    this.pushStatus('You lift the coffee cup into view and start drinking.', 1.6);
  }

  private handleOfficeUseItem(): void {
    if (this.officeTabletCameraFeedActive) {
      return;
    }

    if (this.officeBallPitHidden) {
      this.officeBallPitHidden = false;
      this.gameplaySfxAudio.playBallPitDive();
      this.pushStatus('You lift your head above the balls.', 1.4);
      return;
    }

    if (!this.isPlayerInOfficeBallPit()) {
      return;
    }

    this.officeBallPitHidden = true;
    this.placementToolActive = false;
    this.placementPreview.visible = false;
    this.officeTabletHeld = false;
    this.officeTabletAnchor.visible = false;
    this.officeGlassHeld = false;
    this.officeGlassAnchor.visible = false;
    this.gameplaySfxAudio.playBallPitDive();
    this.pushStatus('You crouch under the balls.', 1.4);
  }

  private isPlayerInOfficeBallPit(position = this.player.getPosition()): boolean {
    if (!this.officeChapterActive) {
      return false;
    }

    const ballPit = this.officeChapter.ballPit;
    return Math.abs(position.x - ballPit.center.x) <= ballPit.halfWidth
      && Math.abs(position.z - ballPit.center.z) <= ballPit.halfDepth;
  }

  private getNearestOfficeBallPitSlide(): OfficeChapterData['ballPitSlide'] | null {
    if (!this.officeChapterActive || this.officeBallPitSlide) {
      return null;
    }

    const playerPosition = this.player.getPosition();
    const slide = this.officeChapter.ballPitSlide;
    const distance = Math.hypot(
      playerPosition.x - slide.interactPosition.x,
      playerPosition.z - slide.interactPosition.z,
    );
    return distance <= GAME_CONFIG.player.interactionRange + 0.9 ? slide : null;
  }

  private startOfficeBallPitSlide(): void {
    const slide = this.officeChapter.ballPitSlide;
    this.resetOfficeTabletState();
    this.officeBallPitHidden = false;
    this.officeBallPitSlide = {
      elapsed: 0,
      duration: 1.35,
      startPosition: slide.startPosition.clone(),
      endPosition: slide.endPosition.clone(),
      lookTarget: slide.lookTarget.clone(),
    };
    this.player.teleport(slide.startPosition);
    this.player.lookToward(slide.lookTarget, 1);
    this.gameplaySfxAudio.playBallPitDive();
    this.pushStatus('You climb onto the half-pipe slide and start sliding into the ball pit.', 2);
  }

  private updateOfficeBallPitSlideAnimation(deltaSeconds: number): void {
    if (!this.officeBallPitSlide) {
      return;
    }

    const slide = this.officeBallPitSlide;
    slide.elapsed = Math.min(slide.elapsed + deltaSeconds, slide.duration);
    const progress = MathUtils.clamp(slide.elapsed / slide.duration, 0, 1);
    const slideProgress = MathUtils.smootherstep(progress, 0, 1);
    const slidePosition = slide.startPosition.clone().lerp(slide.endPosition, slideProgress);
    slidePosition.y += Math.sin(progress * Math.PI) * 0.18;
    this.player.teleport(slidePosition);
    this.player.lookToward(slide.lookTarget, 0.055);
    this.gameplaySfxAudio.updateBallPitRustle(deltaSeconds, progress > 0.72);

    if (progress < 1) {
      return;
    }

    this.officeBallPitSlide = null;
    this.officeBallPitHidden = false;
    this.player.teleport(slide.endPosition);
    this.player.lookToward(slide.lookTarget, 0.28);
    this.pushStatus('You splash into the ball pit at the bottom of the slide.', 1.8);
  }

  private handleFire(): void {
    if (!this.player.isLocked()) {
      return;
    }

    if (this.officeChapterActive) {
      if (this.officeGlassHeld) {
        this.throwOfficeGlass();
        return;
      }

      this.handleOfficeBasketballFire();
      return;
    }

    if (this.doomModeActive) {
      this.handleDoomFire();
      return;
    }

    if (!this.zombieModeActive) {
      return;
    }

    if (this.zombieFireCooldown > 0) {
      return;
    }

    if (this.zombieAmmo[this.zombieWeapon] <= 0) {
      this.pushStatus(
        this.zombieWeapon === 'pistol'
          ? 'The pistol clicks empty.'
          : 'The shotgun is dry.',
        1.4,
      );
      return;
    }

    this.zombieAmmo[this.zombieWeapon] -= 1;
    this.zombieFireCooldown = ZOMBIE_FIRE_COOLDOWN[this.zombieWeapon];
    this.zombieWeaponKick = 1;
    const kills = this.fireZombieWeapon(this.zombieWeapon);

    if (kills > 0) {
      this.pushStatus(
        kills === 1
          ? 'A zombie drops into the dirt.'
          : `${kills} zombies collapse into the clearing.`,
        1.4,
      );
    }
  }

  private handleOfficeBasketballFire(): void {
    if (!this.officeBasketballHeld) {
      return;
    }

    if (this.officeChapter.isBasketballThrowActive()) {
      this.pushStatus('The basketball is still coming back.', 1.4);
      return;
    }

    const result = this.getOfficeBasketballAimResult();
    const throwStart = this.officeBasketballAnchor.getWorldPosition(new Vector3());
    this.officeBasketballHeld = false;
    this.officeBasketballAnchor.visible = false;
    this.officeChapter.setBasketballHeld(false);
    this.officeChapter.startBasketballThrow(result.scored, result.targetHoop, throwStart);
    this.gameplaySfxAudio.playSmallPanel(false);

    if (result.scored) {
      this.officeChapterTickets += 1;
      this.pushStatus(`Swish. You made the shot and earned a ticket. Tickets: ${this.officeChapterTickets}.`, 2.8);
      return;
    }

    this.pushStatus('The basketball misses the hoop and rolls back to the table.', 2.4);
  }

  private throwOfficeGlass(): void {
    const throwStart = this.officeGlassAnchor.getWorldPosition(new Vector3());
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const root = this.createOfficeGlassModel();
    root.position.copy(throwStart);
    root.quaternion.copy(this.camera.quaternion);
    root.scale.setScalar(0.9);
    this.scene.add(root);

    this.officeGlassHeld = false;
    this.officeGlassAnchor.visible = false;
    this.officeGlassThrows.push({
      root,
      velocity: forward.multiplyScalar(11.5).add(new Vector3(0, 1.9, 0)),
      elapsed: 0,
      crashed: false,
    });
    this.gameplaySfxAudio.playSmallPanel(false);
    this.pushStatus('You throw the glass. It is about to shatter.', 1.4);
  }

  private updateOfficeGlassThrows(deltaSeconds: number): void {
    for (let index = this.officeGlassThrows.length - 1; index >= 0; index -= 1) {
      const thrown = this.officeGlassThrows[index];
      thrown.elapsed += deltaSeconds;

      if (!thrown.crashed) {
        thrown.velocity.y -= 8.8 * deltaSeconds;
        thrown.root.position.addScaledVector(thrown.velocity, deltaSeconds);
        thrown.root.rotation.x += deltaSeconds * 9.2;
        thrown.root.rotation.z += deltaSeconds * 6.4;

        if (thrown.elapsed > 0.7 || thrown.root.position.y <= 0.28) {
          this.crashOfficeGlassThrow(thrown);
        }
      }

      if (thrown.crashed && thrown.elapsed > 1.2) {
        thrown.root.parent?.remove(thrown.root);
        this.officeGlassThrows.splice(index, 1);
      }
    }
  }

  private crashOfficeGlassThrow(thrown: ActiveOfficeGlassThrow): void {
    thrown.crashed = true;
    thrown.root.clear();
    thrown.root.rotation.set(0, 0, 0);
    this.gameplaySfxAudio.playGlassCrash();

    const shardMaterial = new MeshStandardMaterial({
      color: 0xdfffff,
      emissive: 0x55c9d8,
      emissiveIntensity: 0.2,
      roughness: 0.16,
      metalness: 0.04,
      transparent: true,
      opacity: 0.56,
    });

    for (let shardIndex = 0; shardIndex < 12; shardIndex += 1) {
      const shard = new Mesh(new BoxGeometry(0.035, 0.006, 0.09), shardMaterial);
      const angle = shardIndex / 12 * Math.PI * 2;
      const radius = 0.08 + Math.random() * 0.24;
      shard.position.set(
        Math.cos(angle) * radius,
        Math.max(0.03, 0.16 - thrown.root.position.y),
        Math.sin(angle) * radius,
      );
      shard.rotation.set(Math.random() * Math.PI, angle, Math.random() * Math.PI);
      thrown.root.add(shard);
    }
  }

  private clearOfficeGlassThrows(): void {
    this.officeGlassThrows.forEach((thrown) => {
      thrown.root.parent?.remove(thrown.root);
    });
    this.officeGlassThrows.length = 0;
  }

  private startOfficeJumpscare(definition: OfficeJumpscareDefinition, keepMenuOpen = false): void {
    this.stopOfficeJumpscare();
    this.officeJumpscareMenuOpen = false;
    this.placementToolActive = false;
    this.placementPreview.visible = false;
    this.officeTabletHeld = false;
    this.officeTabletCameraFeedActive = false;
    this.officeTabletAnchor.visible = false;
    this.officeBasketballHeld = false;
    this.officeBasketballAnchor.visible = false;
    this.officeChapter.setBasketballHeld(false);
    this.officeGlassHeld = false;
    this.officeGlassAnchor.visible = false;
    this.resize();

    const cutsceneRoot = new Group();
    const backdrop = new Mesh(
      new PlaneGeometry(32, 20),
      new MeshBasicMaterial({
        color: 0x000000,
        depthWrite: false,
        depthTest: false,
      }),
    );
    backdrop.position.set(0, 0, -4.2);
    backdrop.renderOrder = 18;
    cutsceneRoot.add(backdrop);
    const blackoutMaterial = new MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    });
    const blackout = new Mesh(new PlaneGeometry(32, 20), blackoutMaterial);
    blackout.position.set(0, 0, -3.95);
    blackout.renderOrder = 42;
    cutsceneRoot.add(blackout);

    const model = this.createOfficeJumpscareCutsceneModel(definition.animatronic);
    model.root.position.set(0, -0.35, -3.55);
    model.root.visible = true;
    model.root.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        material.depthTest = false;
        material.depthWrite = false;
      });
      object.renderOrder = 30;
    });
    cutsceneRoot.add(model.root);
    this.camera.add(cutsceneRoot);
    const materialStates = this.captureOfficeCutsceneMaterials(model.root);
    this.activeOfficeJumpscare = {
      definition,
      elapsed: 0,
      duration: definition.duration,
      root: cutsceneRoot,
      modelRoot: model.root,
      head: model.head,
      jaw: model.jaw,
      smile: model.smile,
      leftArm: model.leftArm,
      rightArm: model.rightArm,
      leftLeg: model.leftLeg,
      rightLeg: model.rightLeg,
      leftLegJoint: model.leftLegJoint,
      rightLegJoint: model.rightLegJoint,
      blackoutMaterial,
      closeCuePlayed: false,
      reopenJumpscareMenu: keepMenuOpen,
      materialStates,
    };
    this.gameplaySfxAudio.resume();
    this.gameplaySfxAudio.playOfficeJumpscareCue(definition.cue);
    this.transientStatusTime = 0;
  }

  private stopOfficeJumpscare(): void {
    if (!this.activeOfficeJumpscare) {
      return;
    }

    this.activeOfficeJumpscare.root.parent?.remove(this.activeOfficeJumpscare.root);
    this.activeOfficeJumpscare = null;
  }

  private returnToOfficeAfterGameModeJumpscare(): void {
    this.officeVentActive = false;
    this.officeVentDrop = null;
    this.officeBallPitHidden = false;
    this.officeBallPitSlide = null;
    this.officeChapterSeated = false;
    this.officeTabletCameraFeedActive = false;
    this.officeTabletHeld = false;
    this.officeTabletAnchor.visible = false;
    this.officeBasketballHeld = false;
    this.officeBasketballAnchor.visible = false;
    this.officeChapter.setBasketballHeld(false);
    this.officeGlassHeld = false;
    this.officeGlassAnchor.visible = false;
    this.clearOfficeGlassThrows();
    this.player.teleport(OFFICE_GAME_MODE_OFFICE_SPAWN);
    this.player.lookToward(OFFICE_GAME_MODE_OFFICE_LOOK_TARGET, 1);
    this.resetOfficeGameModeAnimatronics();
    this.pushStatus('The jumpscare ends and you snap back into the office.', 2.8);
  }

  private createOfficeJumpscareCutsceneModel(animatronic: OfficeJumpscareAnimatronic): {
    root: Group;
    head: Group;
    jaw: Group;
    smile: Group;
    leftArm: Group;
    rightArm: Group;
    leftLeg: Group;
    rightLeg: Group;
    leftLegJoint: Group;
    rightLegJoint: Group;
  } {
    if (String(animatronic).length > 0) {
      return createOfficeJumpscareStageModel(animatronic);
    }

    const palette = {
      quacky: { body: 0xd3a423, accent: 0xf7771f, secondary: 0x7f6022, eye: 0xf7fbff, iris: 0x2f76bd },
      fluffle: { body: 0x8b7da8, accent: 0xead7e7, secondary: 0x5f4f7a, eye: 0xf7fbff, iris: 0x5d4f84 },
      bori: { body: 0x6e4a35, accent: 0x3c2f28, secondary: 0xb0825a, eye: 0xff2118, iris: 0xff5b28 },
      foxy: { body: 0xb95628, accent: 0x111016, secondary: 0xd89654, eye: 0xf7fbff, iris: 0xe6b75d },
    }[animatronic];
    const bodyMaterial = new MeshStandardMaterial({
      color: palette.body,
      emissive: palette.body,
      emissiveIntensity: 0.08,
      roughness: 0.58,
      metalness: 0.16,
    });
    const accentMaterial = new MeshStandardMaterial({
      color: palette.accent,
      emissive: palette.accent,
      emissiveIntensity: 0.1,
      roughness: 0.48,
      metalness: 0.12,
    });
    const secondaryMaterial = new MeshStandardMaterial({
      color: palette.secondary,
      emissive: palette.secondary,
      emissiveIntensity: 0.08,
      roughness: 0.56,
      metalness: 0.12,
    });
    if (animatronic === 'bori') {
      bodyMaterial.emissive.setHex(0x100808);
      bodyMaterial.emissiveIntensity = 0.05;
      bodyMaterial.roughness = 0.9;
      bodyMaterial.metalness = 0.04;
      accentMaterial.emissive.setHex(0x0b0806);
      accentMaterial.emissiveIntensity = 0.12;
      accentMaterial.roughness = 0.42;
      accentMaterial.metalness = 0.28;
      secondaryMaterial.emissive.setHex(0x000000);
      secondaryMaterial.emissiveIntensity = 0;
      secondaryMaterial.roughness = 0.86;
      secondaryMaterial.metalness = 0.03;
    }
    const boriMuzzleMaterial = new MeshStandardMaterial({
      color: 0xc9b493,
      emissive: 0x120d08,
      emissiveIntensity: 0.06,
      roughness: 0.74,
      metalness: 0.04,
    });
    const eyeMaterial = animatronic === 'bori'
      ? new MeshStandardMaterial({
        color: 0x151010,
        emissive: 0xe33d2f,
        emissiveIntensity: 0.9,
        roughness: 0.32,
        metalness: 0.12,
      })
      : new MeshBasicMaterial({
        color: palette.eye,
      });
    eyeMaterial.userData.officeCutsceneEye = true;
    const irisMaterial = new MeshBasicMaterial({
      color: palette.iris,
    });
    irisMaterial.userData.officeCutsceneEye = true;
    const pupilMaterial = new MeshBasicMaterial({ color: 0x050505 });
    const mouthMaterial = new MeshBasicMaterial({ color: 0x050000 });
    const metalMaterial = new MeshStandardMaterial({
      color: 0xb9c5c9,
      emissive: 0x2e3c40,
      emissiveIntensity: 0.12,
      roughness: 0.25,
      metalness: 0.76,
    });
    const jointMaterial = animatronic === 'bori' ? accentMaterial : metalMaterial;

    const root = new Group();
    const body = new Mesh(new SphereGeometry(0.45, 24, 18), bodyMaterial);
    body.scale.set(0.86, 1.18, 0.62);
    body.position.set(0, -0.23, 0);
    if (animatronic === 'bori') {
      body.scale.set(1.02, 1.2, 0.72);
    }
    root.add(body);

    const belly = new Mesh(new SphereGeometry(0.28, 18, 12), secondaryMaterial);
    belly.scale.set(0.9, 0.72, 0.18);
    belly.position.set(0, -0.22, 0.36);
    if (animatronic === 'bori') {
      belly.scale.set(1.04, 0.86, 0.22);
      belly.position.set(0, -0.25, 0.44);
    }
    root.add(belly);

    const neck = new Mesh(new CylinderGeometry(0.17, 0.2, 0.22, 16), jointMaterial);
    neck.position.set(0, 0.31, 0.02);
    root.add(neck);

    const head = new Group();
    head.position.set(0, 0.67, 0.02);
    root.add(head);

    const skull = new Mesh(new SphereGeometry(0.36, 26, 18), bodyMaterial);
    skull.scale.set(1, 0.92, animatronic === 'foxy' ? 0.82 : 0.74);
    if (animatronic === 'bori') {
      skull.scale.set(0.96, 0.9, 0.92);
    }
    head.add(skull);

    const eyeRadius = animatronic === 'bori' ? 0.045 : 0.058;
    const eyeY = animatronic === 'bori' ? 0.06 : 0.05;
    const eyeZ = animatronic === 'bori' ? 0.32 : 0.29;
    const leftEye = new Mesh(new SphereGeometry(eyeRadius, 12, 8), eyeMaterial);
    leftEye.position.set(-0.13, eyeY, eyeZ);
    const rightEye = new Mesh(new SphereGeometry(eyeRadius, 12, 8), eyeMaterial);
    rightEye.position.set(0.13, eyeY, eyeZ);
    const leftIris = new Mesh(new SphereGeometry(0.035, 10, 7), irisMaterial);
    leftIris.position.set(-0.13, 0.043, 0.338);
    const rightIris = new Mesh(new SphereGeometry(0.035, 10, 7), irisMaterial);
    rightIris.position.set(0.13, 0.043, 0.338);
    const leftPupil = new Mesh(new SphereGeometry(0.015, 8, 6), pupilMaterial);
    leftPupil.position.set(-0.13, 0.041, 0.366);
    const rightPupil = new Mesh(new SphereGeometry(0.015, 8, 6), pupilMaterial);
    rightPupil.position.set(0.13, 0.041, 0.366);
    head.add(leftEye, rightEye);
    if (animatronic !== 'bori') {
      head.add(leftIris, rightIris, leftPupil, rightPupil);
    }

    const mouth = new Mesh(new BoxGeometry(0.32, 0.06, 0.035), mouthMaterial);
    mouth.position.set(0, -0.14, 0.31);
    head.add(mouth);
    const smile = new Group();
    smile.visible = false;
    head.add(smile);

    const jaw = new Group();
    jaw.position.set(0, -0.18, 0.32);
    const lowerJaw = new Mesh(
      animatronic === 'bori'
        ? new BoxGeometry(0.26, 0.07, 0.062)
        : new BoxGeometry(0.34, 0.08, 0.09),
      animatronic === 'bori' ? boriMuzzleMaterial : accentMaterial,
    );
    lowerJaw.position.set(0, animatronic === 'bori' ? -0.01 : -0.035, animatronic === 'bori' ? 0.035 : 0.02);
    jaw.add(lowerJaw);
    head.add(jaw);

    if (animatronic === 'quacky') {
      const bibCanvas = document.createElement('canvas');
      bibCanvas.width = 256;
      bibCanvas.height = 160;
      const bibContext = bibCanvas.getContext('2d');
      if (bibContext) {
        bibContext.fillStyle = '#fff4df';
        bibContext.beginPath();
        bibContext.roundRect(24, 18, 208, 124, 28);
        bibContext.fill();
        bibContext.strokeStyle = '#f0a536';
        bibContext.lineWidth = 9;
        bibContext.stroke();
        bibContext.fillStyle = '#e26022';
        bibContext.font = '900 34px Trebuchet MS, sans-serif';
        bibContext.textAlign = 'center';
        bibContext.textBaseline = 'middle';
        bibContext.fillText("LET'S", 128, 68);
        bibContext.fillText('PARTY', 128, 106);
      }
      const bib = new Mesh(
        new PlaneGeometry(0.5, 0.31),
        new MeshBasicMaterial({
          map: new CanvasTexture(bibCanvas),
          transparent: true,
          side: DoubleSide,
        }),
      );
      bib.position.set(0, -0.28, 0.49);
      bib.rotation.x = -0.14;
      const strap = new Mesh(new TorusGeometry(0.22, 0.012, 8, 28), accentMaterial);
      strap.position.set(0, 0.16, 0.34);
      strap.rotation.x = Math.PI / 2.5;
      strap.scale.z = 0.34;
      root.add(strap, bib);
      const upperBeak = new Mesh(new BoxGeometry(0.44, 0.08, 0.25), accentMaterial);
      upperBeak.position.set(0, -0.08, 0.43);
      const lowerBeak = new Mesh(new BoxGeometry(0.38, 0.05, 0.2), accentMaterial);
      lowerBeak.position.set(0, -0.065, 0.16);
      const feather = new Mesh(new BoxGeometry(0.08, 0.24, 0.06), bodyMaterial);
      feather.position.set(0, 0.34, 0.02);
      feather.rotation.x = -0.24;
      jaw.add(lowerBeak);
      head.add(upperBeak, feather);
    } else if (animatronic === 'fluffle') {
      const leftEar = new Mesh(new BoxGeometry(0.12, 0.72, 0.08), bodyMaterial);
      leftEar.position.set(-0.16, 0.53, 0);
      leftEar.rotation.z = -0.12;
      const rightEar = new Mesh(new BoxGeometry(0.12, 0.62, 0.08), bodyMaterial);
      rightEar.position.set(0.18, 0.44, 0.02);
      rightEar.rotation.z = 0.68;
      const earJointLeft = new Mesh(new SphereGeometry(0.07, 12, 8), metalMaterial);
      earJointLeft.position.set(-0.16, 0.2, 0.02);
      const earJointRight = new Mesh(new SphereGeometry(0.07, 12, 8), metalMaterial);
      earJointRight.position.set(0.14, 0.17, 0.02);
      head.add(leftEar, rightEar, earJointLeft, earJointRight);
    } else if (animatronic === 'bori') {
      const hatMaterial = new MeshStandardMaterial({
        color: 0x111216,
        emissive: 0x020202,
        emissiveIntensity: 0.16,
        roughness: 0.34,
        metalness: 0.22,
      });
      const hatBandMaterial = new MeshStandardMaterial({
        color: 0xb12d2a,
        emissive: 0x3b0505,
        emissiveIntensity: 0.18,
        roughness: 0.5,
        metalness: 0.08,
      });
      const hatBrim = new Mesh(new CylinderGeometry(0.3, 0.34, 0.055, 24), hatMaterial);
      hatBrim.position.set(0, 0.3, 0);
      const hatTop = new Mesh(new CylinderGeometry(0.2, 0.23, 0.34, 20), hatMaterial);
      hatTop.position.set(0, 0.49, 0);
      const hatBand = new Mesh(new CylinderGeometry(0.205, 0.232, 0.052, 20), hatBandMaterial);
      hatBand.position.set(0, 0.39, 0);
      const leftEar = new Mesh(new SphereGeometry(0.12, 14, 10), bodyMaterial);
      leftEar.scale.set(1, 1.08, 0.52);
      leftEar.position.set(-0.26, 0.3, 0.04);
      const rightEar = new Mesh(new SphereGeometry(0.12, 14, 10), bodyMaterial);
      rightEar.scale.set(1, 1.08, 0.52);
      rightEar.position.set(0.26, 0.3, 0.04);
      const snout = new Mesh(new SphereGeometry(0.17, 16, 10), boriMuzzleMaterial);
      snout.scale.set(1.28, 0.74, 0.62);
      snout.position.set(0, -0.08, 0.36);
      const nose = new Mesh(new SphereGeometry(0.055, 12, 8), accentMaterial);
      nose.scale.set(1.2, 0.72, 0.72);
      nose.position.set(0, -0.055, 0.48);
      const mouthCavity = new Mesh(new BoxGeometry(0.25, 0.055, 0.026), mouthMaterial);
      mouthCavity.position.set(0, -0.17, 0.435);
      const toothMaterial = new MeshStandardMaterial({
        color: 0xe8dcc3,
        emissive: 0x1c1308,
        emissiveIntensity: 0.08,
        roughness: 0.5,
        metalness: 0.03,
      });
      [-0.15, -0.075, 0, 0.075, 0.15].forEach((toothX) => {
        const upperTooth = new Mesh(new CylinderGeometry(0.012, 0.028, 0.09, 8), toothMaterial);
        upperTooth.position.set(toothX, -0.205, 0.475);
        upperTooth.rotation.x = Math.PI;
        const lowerTooth = new Mesh(new CylinderGeometry(0.011, 0.025, 0.075, 8), toothMaterial);
        lowerTooth.position.set(toothX, 0.02, 0.12);
        lowerTooth.rotation.x = 0.08;
        head.add(upperTooth);
        jaw.add(lowerTooth);
      });
      const smileCenter = new Mesh(new BoxGeometry(0.3, 0.028, 0.024), mouthMaterial);
      smileCenter.position.set(0, -0.105, 0.506);
      const smileLeft = new Mesh(new BoxGeometry(0.13, 0.026, 0.024), mouthMaterial);
      smileLeft.position.set(-0.17, -0.085, 0.506);
      smileLeft.rotation.z = 0.56;
      const smileRight = new Mesh(new BoxGeometry(0.13, 0.026, 0.024), mouthMaterial);
      smileRight.position.set(0.17, -0.085, 0.506);
      smileRight.rotation.z = -0.56;
      [-0.11, -0.055, 0, 0.055, 0.11].forEach((toothX) => {
        const grinTooth = new Mesh(new BoxGeometry(0.026, 0.045, 0.018), toothMaterial);
        grinTooth.position.set(toothX, -0.128, 0.522);
        smile.add(grinTooth);
      });
      smile.add(smileCenter, smileLeft, smileRight);
      const bow = new Mesh(new BoxGeometry(0.34, 0.1, 0.08), boriMuzzleMaterial);
      bow.position.set(0, 0.18, 0.47);
      const leftStick = new Mesh(new CylinderGeometry(0.015, 0.018, 0.56, 8), boriMuzzleMaterial);
      leftStick.position.set(-0.42, -0.08, 0.45);
      leftStick.rotation.set(1.18, -0.18, -0.62);
      const rightStick = new Mesh(new CylinderGeometry(0.015, 0.018, 0.56, 8), boriMuzzleMaterial);
      rightStick.position.set(0.42, -0.08, 0.45);
      rightStick.rotation.set(1.18, 0.18, 0.62);
      root.add(bow, leftStick, rightStick);
      head.add(hatBrim, hatTop, hatBand, leftEar, rightEar, snout, nose, mouthCavity);
    } else {
      const snout = new Mesh(new BoxGeometry(0.28, 0.13, 0.25), secondaryMaterial);
      snout.position.set(0, -0.07, 0.39);
      const eyepatch = new Mesh(new BoxGeometry(0.17, 0.11, 0.018), accentMaterial);
      eyepatch.position.set(0.13, 0.06, 0.345);
      const leftEar = new Mesh(new BoxGeometry(0.13, 0.34, 0.08), bodyMaterial);
      leftEar.position.set(-0.18, 0.3, 0);
      leftEar.rotation.z = -0.34;
      const rightEar = new Mesh(new BoxGeometry(0.13, 0.34, 0.08), bodyMaterial);
      rightEar.position.set(0.18, 0.3, 0);
      rightEar.rotation.z = 0.34;
      head.add(snout, eyepatch, leftEar, rightEar);
    }

    const armOffset = animatronic === 'bori' ? 0.5 : 0.42;
    const armHeight = animatronic === 'bori' ? 0.16 : 0.12;
    const leftArm = this.createOfficeJumpscareLimb(-armOffset, armHeight, bodyMaterial, jointMaterial, false);
    const rightArm = this.createOfficeJumpscareLimb(armOffset, armHeight, bodyMaterial, jointMaterial, animatronic === 'foxy');
    root.add(leftArm, rightArm);

    const legOffset = animatronic === 'bori' ? 0.24 : 0.18;
    const leftLeg = this.createOfficeJumpscareLimb(-legOffset, -0.76, bodyMaterial, jointMaterial, false);
    leftLeg.scale.setScalar(animatronic === 'bori' ? 0.86 : 0.78);
    const rightLeg = this.createOfficeJumpscareLimb(legOffset, -0.76, bodyMaterial, jointMaterial, false);
    rightLeg.scale.setScalar(animatronic === 'bori' ? 0.86 : 0.78);
    root.add(leftLeg, rightLeg);

    return createOfficeJumpscareStageModel(animatronic);
  }

  private createOfficeJumpscareLimb(
    x: number,
    y: number,
    bodyMaterial: MeshStandardMaterial,
    jointMaterial: MeshStandardMaterial,
    hookHand: boolean,
  ): Group {
    const limb = new Group();
    limb.position.set(x, y, 0.02);

    const joint = new Mesh(new SphereGeometry(0.09, 14, 10), jointMaterial);
    limb.add(joint);

    const upper = new Mesh(new CylinderGeometry(0.055, 0.07, 0.34, 12), bodyMaterial);
    upper.position.y = -0.19;
    const elbow = new Mesh(new SphereGeometry(0.07, 12, 8), jointMaterial);
    elbow.position.y = -0.38;
    const forearm = new Mesh(new CylinderGeometry(0.048, 0.058, 0.32, 12), bodyMaterial);
    forearm.position.y = -0.56;
    if (hookHand) {
      const hand = new Mesh(new TorusGeometry(0.08, 0.018, 8, 18, Math.PI * 1.18), jointMaterial);
      hand.position.y = -0.74;
      hand.position.z = 0.03;
      hand.rotation.x = Math.PI / 2;
      limb.add(upper, elbow, forearm, hand);
      return limb;
    }

    const side = x < 0 ? -1 : 1;
    const hand = new Group();
    hand.position.set(0, -0.74, 0);
    const palm = new Mesh(new SphereGeometry(0.09, 14, 10), bodyMaterial);
    palm.scale.set(1.14, 0.76, 0.9);
    hand.add(palm);
    [-0.062, 0, 0.062].forEach((fingerX) => {
      const knuckle = new Mesh(new SphereGeometry(0.024, 8, 6), jointMaterial);
      knuckle.position.set(fingerX, -0.045, -0.055);
      const fingerA = new Mesh(new CylinderGeometry(0.014, 0.017, 0.11, 8), bodyMaterial);
      fingerA.position.set(fingerX + side * 0.008, -0.1, -0.08);
      fingerA.rotation.set(0.45, 0, side * 0.08);
      const fingerB = new Mesh(new CylinderGeometry(0.011, 0.014, 0.09, 8), bodyMaterial);
      fingerB.position.set(fingerX + side * 0.018, -0.165, -0.11);
      fingerB.rotation.set(0.66, 0, side * 0.1);
      hand.add(knuckle, fingerA, fingerB);
    });
    const thumb = new Mesh(new CylinderGeometry(0.016, 0.021, 0.13, 8), bodyMaterial);
    thumb.position.set(-side * 0.09, -0.035, -0.015);
    thumb.rotation.set(0.44, 0.18 * side, -0.72 * side);
    hand.add(thumb);

    limb.add(upper, elbow, forearm, hand);
    return limb;
  }

  private captureOfficeCutsceneMaterials(root: Group): OfficeCutsceneMaterialState[] {
    const states: OfficeCutsceneMaterialState[] = [];
    const seen = new Set<MeshBasicMaterial | MeshStandardMaterial>();
    root.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (!(material instanceof MeshBasicMaterial || material instanceof MeshStandardMaterial) || seen.has(material)) {
          return;
        }

        seen.add(material);
        states.push({
          material,
          color: material.color.clone(),
          emissive: material instanceof MeshStandardMaterial ? material.emissive.clone() : undefined,
          emissiveIntensity: material instanceof MeshStandardMaterial ? material.emissiveIntensity : undefined,
          eye: Boolean(material.userData.officeCutsceneEye)
            || (
              material instanceof MeshStandardMaterial
              && material.emissive.r > 0.45
              && material.emissive.g < 0.35
              && material.emissive.b < 0.35
            ),
        });
      });
    });
    return states;
  }

  private updateOfficeCutsceneMaterialReveal(cutscene: ActiveOfficeJumpscare, progress: number): void {
    if (cutscene.definition.animatronic === 'quacky') {
      const reveal = MathUtils.smoothstep(progress, 0.52, 0.68);
      const eyeFlicker = progress < 0.56
        ? (Math.floor(progress * 34) % 2 === 0 ? 1 : 0.08)
        : 1;
      const shadowColor = new Color(0x020101);
      const eyeColor = new Color(0xff1b12);
      cutscene.materialStates.forEach((state) => {
        if (state.eye) {
          state.material.color.copy(eyeColor);
          if (state.material instanceof MeshStandardMaterial) {
            state.material.emissive.copy(eyeColor);
            state.material.emissiveIntensity = 0.16 + eyeFlicker * (1.65 + Math.sin(this.elapsed * 30) * 0.22);
          }
          return;
        }

        state.material.color.copy(shadowColor).lerp(state.color, reveal);
        if (state.material instanceof MeshStandardMaterial) {
          state.material.emissive.copy(state.emissive ?? shadowColor).multiplyScalar(0.08 + reveal * 0.92);
          state.material.emissiveIntensity = (state.emissiveIntensity ?? 0) * (0.06 + reveal * 0.94);
        }
      });
      return;
    }

    if (cutscene.definition.animatronic !== 'bori') {
      return;
    }

    const reveal = cutscene.definition.id === 'bori-1'
      ? MathUtils.smoothstep(progress, 0.08, 0.34)
      : cutscene.definition.id === 'bori-2'
        ? MathUtils.smoothstep(progress, 0.62, 0.88) * 0.18
        : cutscene.definition.id === 'bori-3'
          ? MathUtils.smoothstep(progress, 0.26, 0.72)
          : MathUtils.smoothstep(progress, 0.44, 0.74);
    const shadowColor = new Color(0x030202);
    const eyeColor = new Color(0xff1b12);
    cutscene.materialStates.forEach((state) => {
      if (state.eye) {
        state.material.color.copy(eyeColor);
        if (state.material instanceof MeshStandardMaterial) {
          state.material.emissive.copy(eyeColor);
          state.material.emissiveIntensity = 1.1 + Math.sin(this.elapsed * 18) * 0.16;
        }
        return;
      }

      state.material.color.copy(shadowColor).lerp(state.color, reveal);
      if (state.material instanceof MeshStandardMaterial) {
        state.material.emissive.copy(state.emissive ?? shadowColor).multiplyScalar(0.16 + reveal * 0.84);
        state.material.emissiveIntensity = (state.emissiveIntensity ?? 0) * (0.14 + reveal * 0.86);
      }
    });
  }

  private applyOfficeJumpscareLegStride(
    cutscene: ActiveOfficeJumpscare,
    strength: number,
    speed = 14,
    kneeBend = 0.68,
  ): void {
    const clampedStrength = MathUtils.clamp(strength, 0, 1);
    if (clampedStrength <= 0.001) {
      return;
    }

    const stride = Math.sin(cutscene.elapsed * speed);
    const oppositeStride = Math.sin(cutscene.elapsed * speed + Math.PI);
    cutscene.leftLeg.rotation.x += stride * 0.72 * clampedStrength;
    cutscene.rightLeg.rotation.x += oppositeStride * 0.72 * clampedStrength;
    cutscene.leftLeg.rotation.z += 0.08 * clampedStrength;
    cutscene.rightLeg.rotation.z -= 0.08 * clampedStrength;
    cutscene.leftLegJoint.rotation.x += (0.12 + Math.max(0, -stride) * kneeBend) * clampedStrength;
    cutscene.rightLegJoint.rotation.x += (0.12 + Math.max(0, -oppositeStride) * kneeBend) * clampedStrength;
  }

  private getOfficeJumpscareFaceCloseTarget(cutscene: ActiveOfficeJumpscare): {
    y: number;
    z: number;
    scale: number;
  } {
    switch (cutscene.definition.animatronic) {
      case 'foxy':
        return { y: -0.4, z: -0.4, scale: 2.34 };
      case 'bori':
        return {
          y: cutscene.definition.id === 'bori-2' ? -0.66 : -0.62,
          z: cutscene.definition.id === 'bori-3' ? -0.38 : -0.42,
          scale: cutscene.definition.id === 'bori-3' ? 2.44 : 2.36,
        };
      case 'fluffle':
        return {
          y: cutscene.definition.id === 'fluffle-2' ? -0.66 : -0.6,
          z: cutscene.definition.id === 'fluffle-2' ? -0.38 : -0.42,
          scale: cutscene.definition.id === 'fluffle-2' ? 2.34 : 2.28,
        };
      case 'quacky':
      default:
        return { y: -0.6, z: -0.42, scale: 2.26 };
    }
  }

  private updateOfficeJumpscare(deltaSeconds: number): void {
    if (!this.activeOfficeJumpscare) {
      return;
    }

    const cutscene = this.activeOfficeJumpscare;
    cutscene.elapsed += deltaSeconds;
    const progress = MathUtils.clamp(cutscene.elapsed / cutscene.duration, 0, 1);
    const model = cutscene.modelRoot;
    const twitch = Math.sin(cutscene.elapsed * 38) * Math.max(0, 1 - progress);
    const pulse = Math.max(0, Math.sin(progress * Math.PI * 8)) * Math.max(0, 1 - progress * 0.7);

    model.visible = true;
    model.scale.setScalar(1);
    model.rotation.set(0, 0, 0);
    cutscene.head.rotation.set(0, 0, 0);
    cutscene.jaw.rotation.set(0, 0, 0);
    cutscene.jaw.scale.set(1, 1, 1);
    cutscene.smile.visible = false;
    cutscene.smile.position.set(0, 0, 0);
    cutscene.smile.scale.set(1, 1, 1);
    cutscene.smile.rotation.set(0, 0, 0);
    cutscene.blackoutMaterial.opacity = 0;
    cutscene.leftArm.rotation.set(0, 0, 0);
    cutscene.rightArm.rotation.set(0, 0, 0);
    cutscene.leftLeg.rotation.set(0, 0, 0);
    cutscene.rightLeg.rotation.set(0, 0, 0);
    cutscene.leftLegJoint.rotation.set(0, 0, 0);
    cutscene.rightLegJoint.rotation.set(0, 0, 0);
    this.updateOfficeCutsceneMaterialReveal(cutscene, progress);

    switch (cutscene.definition.id) {
      case 'quacky-1':
      case 'quacky-2':
      case 'quacky-3': {
        const distantFlicker = progress < 0.52 ? (Math.floor(progress * 34) % 2 === 0 ? 1 : 0) : 1;
        const appear = MathUtils.smoothstep(progress, 0.52, 0.66);
        const scream = MathUtils.smoothstep(progress, 0.62, 0.82);
        const faceShake = Math.sin(cutscene.elapsed * 58) * 0.018 * scream;
        model.visible = progress >= 0.52 || distantFlicker > 0;
        model.position.set(
          faceShake,
          MathUtils.lerp(-0.92, -0.58, appear),
          MathUtils.lerp(-3.45, -0.42, appear),
        );
        model.rotation.set(0.05 + scream * 0.2, faceShake * 2.8, Math.sin(cutscene.elapsed * 46) * 0.026 * scream);
        cutscene.head.rotation.set(0.16 + scream * 0.32, Math.sin(cutscene.elapsed * 42) * 0.08 * scream, faceShake * 4.2);
        cutscene.jaw.rotation.x = -1.42 * scream;
        cutscene.leftArm.rotation.set(MathUtils.lerp(-0.08, -1.36, scream), 0.12, MathUtils.lerp(0.74, 1.34, scream));
        cutscene.rightArm.rotation.set(MathUtils.lerp(-0.08, -1.36, scream), -0.12, MathUtils.lerp(-0.74, -1.34, scream));
        cutscene.leftLeg.rotation.x = Math.sin(cutscene.elapsed * 18) * 0.08 * appear;
        cutscene.rightLeg.rotation.x = Math.sin(cutscene.elapsed * 18 + Math.PI) * 0.08 * appear;
        cutscene.leftLegJoint.rotation.x = Math.max(0, -Math.sin(cutscene.elapsed * 18)) * 0.12 * appear;
        cutscene.rightLegJoint.rotation.x = Math.max(0, Math.sin(cutscene.elapsed * 18)) * 0.12 * appear;
        model.scale.setScalar(MathUtils.lerp(0.62, 2.18, appear));
        break;
      }
      case 'fluffle-1': {
        const spring = MathUtils.smoothstep(progress, 0.32, 0.72);
        model.position.set(
          MathUtils.lerp(-1.15, 0.04, spring) + Math.sin(progress * Math.PI * 10) * 0.04,
          MathUtils.lerp(-0.72, -0.04, spring) + Math.sin(progress * Math.PI) * 0.35,
          MathUtils.lerp(-2.65, -0.36, spring),
        );
        model.rotation.set(-0.15 + spring * 0.38, MathUtils.lerp(-0.7, 0.08, spring), Math.sin(progress * Math.PI * 5) * 0.18);
        cutscene.head.rotation.z = Math.sin(progress * Math.PI * 12) * 0.16;
        cutscene.jaw.rotation.x = 0.14 + spring * 0.78;
        cutscene.leftArm.rotation.set(-0.9, 0.1, 1.18 - spring * 0.4);
        cutscene.rightArm.rotation.set(-0.85, -0.12, -1.18 + spring * 0.4);
        this.applyOfficeJumpscareLegStride(cutscene, spring, 16, 0.78);
        model.scale.setScalar(MathUtils.lerp(0.88, 1.42, spring));
        break;
      }
      case 'fluffle-2': {
        const crawlStage = Math.floor(progress * 12);
        const crawlPose = MathUtils.smoothstep(progress, 0.04, 0.2);
        const crawlRush = MathUtils.smoothstep(progress, 0.34, 0.78);
        const crawlCycle = cutscene.elapsed * 17;
        const leftCrawl = Math.sin(crawlCycle);
        const rightCrawl = Math.sin(crawlCycle + Math.PI);
        const crawlTwitch = Math.sin(cutscene.elapsed * 54) * (1 - progress * 0.55);
        model.position.set(
          (crawlStage % 2 === 0 ? -0.1 : 0.1) * crawlPose + crawlTwitch * 0.035,
          MathUtils.lerp(-1.18, -0.82, crawlRush) + Math.abs(Math.sin(crawlCycle)) * 0.025 * crawlRush,
          MathUtils.lerp(-2.92, -0.48, crawlRush),
        );
        model.rotation.set(
          -1.02 + crawlRush * 0.16 + crawlTwitch * 0.018,
          crawlTwitch * 0.04,
          (crawlStage % 2 === 0 ? -0.16 : 0.16) * crawlPose,
        );
        cutscene.head.rotation.set(0.72 + crawlTwitch * 0.08, crawlTwitch * 0.1, Math.sin(cutscene.elapsed * 31) * 0.08);
        cutscene.jaw.rotation.x = 0.16 + pulse * 0.44 + crawlRush * 0.48;
        cutscene.leftArm.rotation.set(-1.48 + leftCrawl * 0.26, 0.3, 0.92 - Math.max(0, rightCrawl) * 0.28);
        cutscene.rightArm.rotation.set(-1.48 + rightCrawl * 0.26, -0.3, -0.92 + Math.max(0, leftCrawl) * 0.28);
        cutscene.leftLeg.rotation.set(1.06 + rightCrawl * 0.22, -0.08, 0.42);
        cutscene.rightLeg.rotation.set(1.06 + leftCrawl * 0.22, 0.08, -0.42);
        cutscene.leftLegJoint.rotation.x = -1.08 + Math.max(0, leftCrawl) * 0.34;
        cutscene.rightLegJoint.rotation.x = -1.08 + Math.max(0, rightCrawl) * 0.34;
        model.scale.setScalar(MathUtils.lerp(0.82, 1.42, crawlRush));
        break;
      }
      case 'fluffle-3': {
        const snap = progress > 0.58 ? MathUtils.smoothstep(progress, 0.58, 0.68) : 0;
        model.visible = progress < 0.2 || progress > 0.28;
        model.position.set(
          twitch * 0.025,
          MathUtils.lerp(-0.1, -0.02, snap),
          MathUtils.lerp(-1.35, -0.27, snap),
        );
        model.rotation.set(0, twitch * 0.06, snap * -0.18);
        cutscene.head.rotation.set(-0.12 + snap * 0.5, 0, progress < 0.58 ? -0.2 : 0.28);
        cutscene.jaw.rotation.x = 0.06 + snap * 1.0;
        cutscene.leftArm.rotation.set(-0.28 + snap * -0.8, 0, 0.5 + snap * 0.82);
        cutscene.rightArm.rotation.set(-0.28 + snap * -0.8, 0, -0.5 - snap * 0.82);
        this.applyOfficeJumpscareLegStride(cutscene, snap, 17.5, 0.8);
        model.scale.setScalar(MathUtils.lerp(0.92, 1.5, snap));
        break;
      }
      case 'bori-1': {
        const smileCurl = MathUtils.smoothstep(progress, 0.08, 0.36);
        const lunge = MathUtils.smoothstep(progress, 0.48, 0.78);
        const armReach = MathUtils.smoothstep(progress, 0.38, 0.72);
        const faceTwitch = Math.sin(progress * Math.PI * 26) * 0.018 * smileCurl * (1 - lunge * 0.45);
        cutscene.smile.visible = smileCurl > 0.02;
        cutscene.smile.scale.set(
          MathUtils.lerp(0.2, 1.42, smileCurl),
          MathUtils.lerp(0.35, 1.22, smileCurl),
          1,
        );
        cutscene.smile.position.y = MathUtils.lerp(0.025, -0.006, smileCurl);
        model.position.set(
          faceTwitch,
          MathUtils.lerp(-0.42, -0.18, lunge) + Math.sin(progress * Math.PI * 2) * 0.035 * (1 - lunge),
          MathUtils.lerp(-3.12, -0.72, lunge),
        );
        model.rotation.set(MathUtils.lerp(-0.02, 0.18, lunge), twitch * 0.025, faceTwitch);
        cutscene.head.rotation.x = MathUtils.lerp(-0.12, 0.3, lunge) - smileCurl * 0.08;
        cutscene.head.rotation.z = faceTwitch * 2.2;
        cutscene.jaw.rotation.x = 0.05 + smileCurl * 0.18 + lunge * 0.72;
        cutscene.leftArm.rotation.set(MathUtils.lerp(-0.2, -1.36, armReach), 0.24, MathUtils.lerp(0.84, 0.18, armReach));
        cutscene.rightArm.rotation.set(MathUtils.lerp(-0.2, -1.36, armReach), -0.24, MathUtils.lerp(-0.84, -0.18, armReach));
        this.applyOfficeJumpscareLegStride(cutscene, lunge, 12.8, 0.7);
        model.scale.setScalar(MathUtils.lerp(1.04, 1.7, lunge));
        break;
      }
      case 'bori-2': {
        const stepIn = MathUtils.smoothstep(progress, 0.08, 0.62);
        const slashWindup = MathUtils.smoothstep(progress, 0.48, 0.68);
        const slash = MathUtils.smoothstep(progress, 0.68, 0.86);
        const stepBob = Math.max(
          Math.exp(-Math.pow((progress - 0.2) / 0.055, 2)),
          Math.exp(-Math.pow((progress - 0.39) / 0.055, 2)),
          Math.exp(-Math.pow((progress - 0.57) / 0.055, 2)),
        );
        model.position.set(
          Math.sin(progress * Math.PI * 17) * 0.035 * (1 - slash * 0.4),
          -0.46 + stepBob * 0.09 + slash * 0.1,
          MathUtils.lerp(-3.18, -0.92, stepIn),
        );
        model.rotation.set(twitch * 0.08 + slash * 0.18, MathUtils.lerp(-0.18, 0.24, slash), Math.sin(progress * Math.PI * 12) * 0.04);
        cutscene.head.rotation.x = -0.02 + slash * 0.3;
        cutscene.head.rotation.y = Math.sin(progress * Math.PI * 20) * 0.08 * (1 - slash * 0.35);
        cutscene.jaw.rotation.x = 0.06 + slash * 1.12;
        cutscene.leftArm.rotation.set(-0.26 - slashWindup * 0.55, 0.38, 1.02 - slash * 0.34);
        cutscene.rightArm.rotation.set(
          MathUtils.lerp(-0.3, -1.62, slash),
          MathUtils.lerp(-0.56, 0.48, slash),
          MathUtils.lerp(-1.28, 0.5, slash),
        );
        this.applyOfficeJumpscareLegStride(cutscene, stepIn * (1 - slash * 0.45), 10.6, 0.66);
        model.scale.setScalar(MathUtils.lerp(1.05, 1.66, stepIn));
        break;
      }
      case 'bori-3': {
        const flickerOne = progress > 0.1 ? 1 : 0;
        const flickerTwo = progress > 0.28 ? 1 : 0;
        const flickerThree = progress > 0.46 ? 1 : 0;
        const biteOpen = MathUtils.smoothstep(progress, 0.58, 0.78);
        const biteClose = MathUtils.smoothstep(progress, 0.82, 0.96);
        const flickerStep = Math.max(flickerOne * 0.3, flickerTwo * 0.62, flickerThree);
        model.visible = progress > 0.08 && (progress > 0.54 || Math.floor(progress * 28) % 2 === 0);
        model.position.set(
          MathUtils.lerp(-0.28, 0.02, flickerStep) + Math.sin(progress * Math.PI * 11) * 0.018,
          MathUtils.lerp(-0.56, -0.08, biteOpen),
          MathUtils.lerp(-3.2, -0.72, flickerStep),
        );
        model.rotation.set(0.04 + biteOpen * 0.26, twitch * 0.05, Math.sin(progress * Math.PI * 8) * 0.055);
        cutscene.head.rotation.x = MathUtils.lerp(-0.08, 0.32, biteOpen) - biteClose * 0.2;
        cutscene.jaw.rotation.x = MathUtils.lerp(0.08, 1.72, biteOpen) * (1 - biteClose * 0.88);
        cutscene.jaw.scale.set(
          MathUtils.lerp(1, 1.56, biteOpen),
          MathUtils.lerp(1, 1.34, biteOpen),
          MathUtils.lerp(1, 1.28, biteOpen),
        );
        cutscene.leftArm.rotation.set(MathUtils.lerp(0.08, -1.42, biteOpen), 0.42, MathUtils.lerp(1.56, 0.12, biteOpen));
        cutscene.rightArm.rotation.set(MathUtils.lerp(0.08, -1.42, biteOpen), -0.42, MathUtils.lerp(-1.56, -0.12, biteOpen));
        this.applyOfficeJumpscareLegStride(cutscene, flickerStep * (1 - biteClose * 0.55), 11.8, 0.68);
        model.scale.setScalar(MathUtils.lerp(1.02, 1.78, biteOpen));
        cutscene.blackoutMaterial.opacity = MathUtils.smoothstep(progress, 0.985, 0.998);
        if (progress > 0.998) {
          model.visible = false;
        }
        break;
      }
      case 'foxy-1': {
        const scrape = MathUtils.smoothstep(progress, 0.12, 0.5);
        const slash = MathUtils.smoothstep(progress, 0.55, 0.78);
        model.position.set(
          MathUtils.lerp(0.92, 0.02, slash),
          MathUtils.lerp(-0.42, -0.06, slash),
          MathUtils.lerp(-1.85, -0.3, slash),
        );
        model.rotation.set(-0.04, MathUtils.lerp(0.66, 0.02, slash), MathUtils.lerp(0.12, -0.18, slash));
        cutscene.head.rotation.y = MathUtils.lerp(-0.24, 0.18, slash);
        cutscene.jaw.rotation.x = 0.1 + slash * 0.88;
        cutscene.rightArm.rotation.set(MathUtils.lerp(-0.4, -1.55, scrape), 0.75, MathUtils.lerp(-1.5, 1.0, scrape));
        cutscene.leftArm.rotation.set(-0.25, 0, 0.62);
        this.applyOfficeJumpscareLegStride(cutscene, slash, 17, 0.76);
        model.scale.setScalar(MathUtils.lerp(0.96, 1.48, slash));
        break;
      }
      case 'foxy-2': {
        const reveal = MathUtils.smoothstep(progress, 0.22, 0.45);
        const close = MathUtils.smoothstep(progress, 0.48, 0.72);
        model.visible = progress > 0.12;
        model.position.set(
          MathUtils.lerp(-0.42, 0, reveal),
          MathUtils.lerp(-0.18, -0.03, close),
          MathUtils.lerp(-1.4, -0.24, close),
        );
        model.rotation.set(close * 0.2, MathUtils.lerp(-0.38, 0.08, reveal), Math.sin(progress * Math.PI * 3) * 0.08);
        cutscene.head.rotation.x = close * 0.28;
        cutscene.jaw.rotation.x = 0.1 + close * 0.9;
        cutscene.leftArm.rotation.set(MathUtils.lerp(0.35, -0.95, reveal), 0, MathUtils.lerp(1.3, 0.4, reveal));
        cutscene.rightArm.rotation.set(MathUtils.lerp(0.35, -1.25, reveal), 0.3, MathUtils.lerp(-1.3, -0.15, reveal));
        this.applyOfficeJumpscareLegStride(cutscene, close, 16.2, 0.74);
        model.scale.setScalar(MathUtils.lerp(0.94, 1.58, close));
        break;
      }
      case 'foxy-3':
      default: {
        const spin = MathUtils.smoothstep(progress, 0.18, 0.62);
        const leap = MathUtils.smoothstep(progress, 0.62, 0.86);
        model.position.set(
          Math.sin(progress * Math.PI * 2) * (0.42 * (1 - leap)),
          MathUtils.lerp(-0.5, -0.04, leap) + Math.sin(progress * Math.PI * 3) * 0.12 * (1 - leap),
          MathUtils.lerp(-2.45, -0.3, leap),
        );
        model.rotation.set(leap * 0.28, spin * Math.PI * 2.2, Math.sin(progress * Math.PI * 4) * 0.2);
        cutscene.head.rotation.x = leap * 0.38;
        cutscene.jaw.rotation.x = 0.12 + leap * 0.9;
        cutscene.leftArm.rotation.set(-0.65 - spin * 0.25, 0, 1.2 - leap * 0.5);
        cutscene.rightArm.rotation.set(-0.65 - spin * 0.6, 0.42, -1.2 + leap * 0.25);
        this.applyOfficeJumpscareLegStride(cutscene, Math.max(spin * 0.55, leap), 18.5, 0.82);
        model.scale.setScalar(MathUtils.lerp(0.92, 1.5, leap));
        break;
      }
    }

    const isBoriCutscene = cutscene.definition.animatronic === 'bori';
    const isBrokenCrawl = cutscene.definition.id === 'fluffle-2';
    const faceCloseTarget = this.getOfficeJumpscareFaceCloseTarget(cutscene);
    const closeHold = MathUtils.smoothstep(progress, isBoriCutscene ? 0.68 : 0.66, isBoriCutscene ? 0.9 : 0.88);
    if (closeHold > 0) {
      if (!cutscene.closeCuePlayed && progress >= 0.68) {
        cutscene.closeCuePlayed = true;
        this.gameplaySfxAudio.playOfficeJumpscareCue(cutscene.definition.cue);
      }
      if (!(cutscene.definition.id === 'bori-3' && progress > 0.998)) {
        model.visible = true;
      }
      const boriBiteOpen = cutscene.definition.id === 'bori-3' ? MathUtils.smoothstep(progress, 0.64, 0.78) : 0;
      const boriBiteClose = cutscene.definition.id === 'bori-3' ? MathUtils.smoothstep(progress, 0.82, 0.96) : 0;
      const boriBiteJaw = MathUtils.lerp(1.68, 0.16, boriBiteClose) * boriBiteOpen;
      const boriRoarJaw = isBoriCutscene && cutscene.definition.id !== 'bori-3' ? 1.24 * closeHold : 0;
      model.position.x = MathUtils.lerp(model.position.x, 0, closeHold * 0.82);
      model.position.y = MathUtils.lerp(
        model.position.y,
        faceCloseTarget.y,
        closeHold * (isBoriCutscene ? 0.96 : 0.88),
      );
      model.position.z = MathUtils.lerp(model.position.z, faceCloseTarget.z, closeHold);
      model.scale.setScalar(MathUtils.lerp(model.scale.x, faceCloseTarget.scale, closeHold));
      model.rotation.x += Math.sin(progress * Math.PI * 28) * 0.025 * closeHold;
      model.rotation.y *= 1 - closeHold * 0.7;
      model.rotation.z *= 1 - closeHold * 0.7;
      cutscene.head.rotation.x += (isBoriCutscene ? 0.05 : isBrokenCrawl ? 0.03 : 0.18) * closeHold;
      const screamHold = MathUtils.smoothstep(progress, 0.76, 0.96);
      const headTwitch = Math.sin(cutscene.elapsed * 46) * 0.1 * closeHold;
      cutscene.head.rotation.y += headTwitch;
      cutscene.head.rotation.z += Math.cos(cutscene.elapsed * 39) * 0.075 * closeHold;
      if (isBoriCutscene) {
        cutscene.head.rotation.y += cutscene.definition.id === 'bori-2' ? Math.sin(progress * Math.PI * 9) * 0.08 * closeHold : 0;
        cutscene.jaw.rotation.x = Math.max(cutscene.jaw.rotation.x, boriBiteJaw, boriRoarJaw, 1.46 * screamHold);
        if (cutscene.definition.id === 'bori-3') {
          const biteSnap = boriBiteOpen * boriBiteClose;
          model.position.z = MathUtils.lerp(model.position.z, -0.34, biteSnap * 0.75);
          cutscene.head.rotation.x -= 0.22 * biteSnap;
        }
      } else {
        cutscene.jaw.rotation.x = cutscene.definition.animatronic === 'quacky'
          ? Math.min(cutscene.jaw.rotation.x, -1.34 * screamHold)
          : Math.max(cutscene.jaw.rotation.x, 1.34 * screamHold);
      }
      if (isBoriCutscene) {
        if (cutscene.definition.id === 'bori-1') {
          cutscene.leftArm.rotation.x = MathUtils.lerp(cutscene.leftArm.rotation.x, -1.62, closeHold);
          cutscene.rightArm.rotation.x = MathUtils.lerp(cutscene.rightArm.rotation.x, -1.62, closeHold);
          cutscene.leftArm.rotation.y = MathUtils.lerp(cutscene.leftArm.rotation.y, 0.22, closeHold);
          cutscene.rightArm.rotation.y = MathUtils.lerp(cutscene.rightArm.rotation.y, -0.22, closeHold);
          cutscene.leftArm.rotation.z = MathUtils.lerp(cutscene.leftArm.rotation.z, 0.1, closeHold);
          cutscene.rightArm.rotation.z = MathUtils.lerp(cutscene.rightArm.rotation.z, -0.1, closeHold);
        } else if (cutscene.definition.id === 'bori-2') {
          cutscene.leftArm.rotation.x = MathUtils.lerp(cutscene.leftArm.rotation.x, -0.96, closeHold);
          cutscene.leftArm.rotation.y = MathUtils.lerp(cutscene.leftArm.rotation.y, 0.48, closeHold);
          cutscene.leftArm.rotation.z = MathUtils.lerp(cutscene.leftArm.rotation.z, 0.84, closeHold);
          cutscene.rightArm.rotation.x = MathUtils.lerp(cutscene.rightArm.rotation.x, -1.7, closeHold);
          cutscene.rightArm.rotation.y = MathUtils.lerp(cutscene.rightArm.rotation.y, 0.56, closeHold);
          cutscene.rightArm.rotation.z = MathUtils.lerp(cutscene.rightArm.rotation.z, 0.54, closeHold);
        } else {
          cutscene.leftArm.rotation.x = MathUtils.lerp(cutscene.leftArm.rotation.x, -1.48, closeHold);
          cutscene.rightArm.rotation.x = MathUtils.lerp(cutscene.rightArm.rotation.x, -1.48, closeHold);
          cutscene.leftArm.rotation.z = MathUtils.lerp(cutscene.leftArm.rotation.z, 0.06, closeHold);
          cutscene.rightArm.rotation.z = MathUtils.lerp(cutscene.rightArm.rotation.z, -0.06, closeHold);
        }
      } else if (isBrokenCrawl) {
        const pawTwitch = Math.sin(cutscene.elapsed * 28) * 0.08;
        cutscene.leftArm.rotation.x = MathUtils.lerp(cutscene.leftArm.rotation.x, -1.62 + pawTwitch, closeHold * 0.34);
        cutscene.rightArm.rotation.x = MathUtils.lerp(cutscene.rightArm.rotation.x, -1.62 - pawTwitch, closeHold * 0.34);
        cutscene.leftArm.rotation.z = MathUtils.lerp(cutscene.leftArm.rotation.z, 0.72, closeHold * 0.28);
        cutscene.rightArm.rotation.z = MathUtils.lerp(cutscene.rightArm.rotation.z, -0.72, closeHold * 0.28);
      } else {
        cutscene.leftArm.rotation.x = MathUtils.lerp(cutscene.leftArm.rotation.x, -1.52, closeHold);
        cutscene.rightArm.rotation.x = MathUtils.lerp(cutscene.rightArm.rotation.x, -1.52, closeHold);
        cutscene.leftArm.rotation.z = MathUtils.lerp(cutscene.leftArm.rotation.z, 1.42, closeHold);
        cutscene.rightArm.rotation.z = MathUtils.lerp(cutscene.rightArm.rotation.z, -1.42, closeHold);
      }
    }

    if (progress >= 1) {
      const returnToOffice = this.officeGameModeActive;
      const reopenJumpscareMenu = cutscene.reopenJumpscareMenu;
      this.stopOfficeJumpscare();
      if (returnToOffice) {
        this.returnToOfficeAfterGameModeJumpscare();
      } else if (reopenJumpscareMenu) {
        this.officeJumpscareMenuOpen = true;
        this.pushStatus('Jumpscare menu reopened. Choose another Chapter 3 cutscene, or press J to close it.', 1.4);
      } else {
        this.pushStatus('The jumpscare cutscene ends.', 1.4);
      }
    }
  }

  private getOfficeBasketballAimResult(): { scored: boolean; targetHoop: 'left' | 'right' } {
    const game = this.officeChapter.basketballGame;
    const cameraPosition = this.camera.getWorldPosition(new Vector3());
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const hoops: Array<{ id: 'left' | 'right'; target: Vector3 }> = [
      { id: 'left', target: game.root.localToWorld(game.leftHoopTarget.clone()) },
      { id: 'right', target: game.root.localToWorld(game.rightHoopTarget.clone()) },
    ];
    let bestHoop: 'left' | 'right' = 'left';
    let bestAimDistance = Infinity;
    let bestAlong = 0;

    hoops.forEach((hoop) => {
      const toHoop = hoop.target.clone().sub(cameraPosition);
      const along = toHoop.dot(forward);
      if (along <= 0) {
        return;
      }

      const closestPoint = cameraPosition.clone().addScaledVector(forward, along);
      const aimDistance = closestPoint.distanceTo(hoop.target);
      if (aimDistance < bestAimDistance) {
        bestAimDistance = aimDistance;
        bestAlong = along;
        bestHoop = hoop.id;
      }
    });

    return {
      scored: bestAlong > 1.2 && bestAimDistance <= 0.58,
      targetHoop: bestHoop,
    };
  }

  private fireZombieWeapon(weapon: ZombieWeaponId): number {
    let kills = 0;
    const muzzlePoint = this.getZombieWeaponMuzzlePosition(this.zombieWeaponMuzzlePoint);
    const direction = this.player.getForwardVector(this.zombieForward);

    if (weapon === 'pistol') {
      const target = this.findClosestZombieInSight(36, ZOMBIE_HITSCAN_RADIUS);
      if (!target) {
        this.zombieShotEndPoint.copy(muzzlePoint).addScaledVector(direction, 36);
        this.spawnZombieBulletTracer(muzzlePoint, this.zombieShotEndPoint, weapon);
        return 0;
      }

      this.spawnZombieBulletTracer(muzzlePoint, target.point, weapon);
      if (target.zombie.applyDamage(42)) {
        this.registerZombieKill();
        kills += 1;
      }
      return kills;
    }

    const shotgunFocus = this.findClosestZombieInSight(20, 2.3);
    this.spawnShotgunTracers(muzzlePoint, direction, shotgunFocus?.point ?? null);
    const origin = this.player.getPosition();
    this.zombieControllers.forEach((zombie) => {
      if (!zombie.isActive()) {
        return;
      }

      const aimPoint = zombie.getAimPoint(this.zombieAimPoint);
      const toTarget = aimPoint.sub(origin);
      const distance = toTarget.length();
      if (distance > 18 || distance < 0.001) {
        return;
      }

      toTarget.normalize();
      const alignment = direction.dot(toTarget);
      if (alignment < 0.82) {
        return;
      }

      const damage = Math.round(14 + alignment * 20 - distance * 0.45);
      if (damage <= 0) {
        return;
      }

      if (zombie.applyDamage(damage)) {
        this.registerZombieKill();
        kills += 1;
      }
    });

    return kills;
  }

  private findClosestZombieInSight(maxDistance: number, hitRadius: number): ZombieSightTarget | null {
    const origin = this.player.getPosition();
    const direction = this.player.getForwardVector(this.zombieForward);
    let closest: ZombieSightTarget | null = null;
    let closestDistance = Infinity;

    this.zombieControllers.forEach((zombie) => {
      if (!zombie.isActive()) {
        return;
      }

      const aimPoint = zombie.getAimPoint(this.zombieAimPoint);
      this.zombieRayPoint.copy(aimPoint).sub(origin);
      const along = this.zombieRayPoint.dot(direction);
      if (along < 0 || along > maxDistance || along >= closestDistance) {
        return;
      }

      this.zombieRayPoint.copy(direction).multiplyScalar(along).add(origin);
      if (this.zombieRayPoint.distanceToSquared(aimPoint) > hitRadius * hitRadius) {
        return;
      }

      closest = {
        zombie,
        point: aimPoint.clone(),
        distance: along,
      };
      closestDistance = along;
    });

    return closest;
  }

  private registerZombieKill(): void {
    this.zombieKills += 1;
    this.zombieScrap += 8;
  }

  private selectZombieWeapon(weapon: WeaponSelectId): void {
    if (!this.zombieModeActive || this.zombieWeapon === weapon) {
      return;
    }

    this.zombieWeapon = weapon;
    this.ensureZombieWeaponVisual();
    this.pushStatus(weapon === 'pistol' ? 'Pistol up.' : 'Shotgun up.', 1.2);
  }

  private handleZombieModeInteract(): void {
    const defense = this.getNearestZombieDefense();
    if (!defense) {
      this.pushStatus('Nothing here can be reinforced.');
      return;
    }

    if (this.zombieNightActive) {
      this.pushStatus('The dead are already moving. You cannot reinforce the barricades until daylight.');
      return;
    }

    const level = this.zombieDefenseLevels.get(defense.id) ?? 0;
    const health = this.zombieDefenseHealth.get(defense.id) ?? 0;
    const maxHealth = ZOMBIE_DEFENSE_HEALTH_BY_LEVEL[level];

    if (level < 3) {
      const cost = ZOMBIE_DEFENSE_UPGRADE_COST[level];
      if (this.zombieScrap < cost) {
        this.pushStatus(`${defense.label} needs ${cost} scrap for the next upgrade.`);
        return;
      }

      this.zombieScrap -= cost;
      const nextLevel = level + 1;
      const nextHealth = ZOMBIE_DEFENSE_HEALTH_BY_LEVEL[nextLevel];
      this.zombieDefenseLevels.set(defense.id, nextLevel);
      this.zombieDefenseHealth.set(defense.id, nextHealth);
      this.zombieMode.setDefenseState(defense.id, nextLevel, 1);
      this.pushStatus(`${defense.label} is now level ${nextLevel}.`, 1.8);
      return;
    }

    if (health < maxHealth) {
      if (this.zombieScrap < ZOMBIE_DEFENSE_REPAIR_COST) {
        this.pushStatus(`${defense.label} needs ${ZOMBIE_DEFENSE_REPAIR_COST} scrap for repairs.`);
        return;
      }

      this.zombieScrap -= ZOMBIE_DEFENSE_REPAIR_COST;
      this.zombieDefenseHealth.set(defense.id, maxHealth);
      this.zombieMode.setDefenseState(defense.id, level, 1);
      this.pushStatus(`${defense.label} is patched back together.`, 1.8);
      return;
    }

    this.pushStatus(`${defense.label} is already fully reinforced.`);
  }

  private getNearestZombieDefense(): ZombieDefensePoint | null {
    const playerPosition = this.player.getPosition();
    let closest: ZombieDefensePoint | null = null;
    let closestDistance = Infinity;

    for (const defense of this.zombieMode.defensePoints) {
      const distance = playerPosition.distanceTo(defense.interactPosition);
      if (distance > GAME_CONFIG.player.interactionRange + 0.85 || distance >= closestDistance) {
        continue;
      }

      closest = defense;
      closestDistance = distance;
    }

    return closest;
  }

  private getZombieDefenseTarget(id: ZombieDefenseId) {
    const health = this.zombieDefenseHealth.get(id) ?? 0;
    const level = this.zombieDefenseLevels.get(id) ?? 0;
    if (level <= 0 || health <= 0) {
      return null;
    }

    const defense = this.zombieMode.defensePoints.find((candidate) => candidate.id === id);
    if (!defense) {
      return null;
    }

    return {
      id,
      position: defense.position,
      attackPosition: defense.attackPosition,
      health,
    };
  }

  private updateZombieMode(deltaSeconds: number): void {
    const playerPosition = this.player.getPosition();
    this.monsterState = this.unlockedMonsterState;
    this.touchingMonster = null;

    if (this.zombieNightActive) {
      this.zombieSpawnCooldown = Math.max(0, this.zombieSpawnCooldown - deltaSeconds);
      if (this.zombieNightSpawnRemaining > 0 && this.zombieSpawnCooldown <= 0) {
        if (this.spawnZombie()) {
          this.zombieNightSpawnRemaining -= 1;
        }
        this.zombieSpawnCooldown = Math.max(0.42, 1.18 - this.zombieDay * 0.06);
      }
    }

    let damageToPlayer = 0;
    this.zombieControllers.forEach((zombie) => {
      const result = zombie.update(deltaSeconds, playerPosition, this.getZombieDefenseTarget(zombie.getLane()));
      damageToPlayer += result.damageToPlayer;
      if (result.damageToDefense) {
        this.applyZombieDefenseDamage(result.damageToDefense.id, result.damageToDefense.amount);
      }
    });

    if (damageToPlayer > 0) {
      this.health = Math.max(0, this.health - damageToPlayer);
    } else if (!this.zombieNightActive) {
      this.health = Math.min(GAME_CONFIG.player.healthMax, this.health + deltaSeconds * 6);
    }

    if (this.health <= 0) {
      this.beginZombieMode();
      this.pushStatus('The horde tears you down. The forest run resets at day one.', 3.2);
      return;
    }

    this.zombiePhaseRemaining = Math.max(0, this.zombiePhaseRemaining - deltaSeconds);
    if (!this.zombieNightActive && this.zombiePhaseRemaining <= 0) {
      this.startZombieNight();
    } else if (this.zombieNightActive) {
      const liveZombies = this.zombieControllers.some((zombie) => zombie.isActive());
      if (this.zombiePhaseRemaining <= 0 && this.zombieNightSpawnRemaining <= 0 && !liveZombies) {
        this.startZombieDay(this.zombieDay + 1);
      }
    }
  }

  private spawnZombie(): boolean {
    const zombie = this.zombieControllers.find((candidate) => !candidate.isActive());
    if (!zombie) {
      return false;
    }

    const lane = this.zombieMode.zombieSpawnLanes[
      Math.floor(Math.random() * this.zombieMode.zombieSpawnLanes.length)
    ];
    const defense = this.zombieMode.defensePoints.find((candidate) => candidate.id === lane.id);
    if (!defense) {
      return false;
    }

    const spawn = lane.position.clone();
    if (lane.id === 'north' || lane.id === 'south') {
      spawn.x += (Math.random() - 0.5) * 8;
    } else {
      spawn.z += (Math.random() - 0.5) * 8;
    }

    zombie.spawn(spawn, lane.id, this.zombieDay, lane.route, defense.breachPosition);
    return true;
  }

  private applyZombieDefenseDamage(id: ZombieDefenseId, amount: number): void {
    const level = this.zombieDefenseLevels.get(id) ?? 0;
    if (level <= 0) {
      return;
    }

    const maxHealth = ZOMBIE_DEFENSE_HEALTH_BY_LEVEL[level];
    const nextHealth = Math.max(0, (this.zombieDefenseHealth.get(id) ?? 0) - amount);
    this.zombieDefenseHealth.set(id, nextHealth);
    this.zombieMode.setDefenseState(id, level, maxHealth > 0 ? nextHealth / maxHealth : 0);

    if (nextHealth === 0) {
      this.pushStatus(`${id[0].toUpperCase()}${id.slice(1)} barricade is down!`, 1.8);
    }
  }

  private startZombieNight(): void {
    this.zombieNightActive = true;
    this.zombiePhaseRemaining = ZOMBIE_NIGHT_DURATION;
    this.zombieNightSpawnRemaining = 7 + this.zombieDay * 3;
    this.zombieSpawnCooldown = 0.4;
    this.pushStatus(`Night ${this.zombieDay} falls. The zombies are coming.`, 2.6);
  }

  private startZombieDay(day: number): void {
    this.zombieNightActive = false;
    this.zombieDay = day;
    this.zombiePhaseRemaining = ZOMBIE_DAY_DURATION;
    this.zombieNightSpawnRemaining = 0;
    this.zombieSpawnCooldown = 0;
    this.zombieAmmo.pistol += ZOMBIE_DAWN_AMMO.pistol;
    this.zombieAmmo.shotgun += ZOMBIE_DAWN_AMMO.shotgun;
    this.health = Math.min(GAME_CONFIG.player.healthMax, this.health + 24);
    this.pushStatus(`Dawn breaks on day ${day}. Rebuild the barricades before dusk.`, 2.8);
  }

  private handleDoomFire(): void {
    if (this.zombieFireCooldown > 0) {
      return;
    }

    if (this.doomWeapon === 'shotgun' && !this.doomWeaponsOwned.has('shotgun')) {
      this.pushStatus('You do not have the shotgun yet.', 1.4);
      return;
    }

    if (this.doomAmmo[this.doomWeapon] <= 0) {
      this.pushStatus(
        this.doomWeapon === 'pistol'
          ? 'The pistol clicks dry.'
          : 'The shotgun is out of shells.',
        1.4,
      );
      return;
    }

    this.doomAmmo[this.doomWeapon] -= 1;
    this.zombieFireCooldown = DOOM_FIRE_COOLDOWN[this.doomWeapon];
    this.zombieWeaponKick = 1;
    const kills = this.fireDoomWeapon(this.doomWeapon);

    if (kills > 0) {
      this.pushStatus(
        kills === 1
          ? 'A demon folds into the techbase floor.'
          : `${kills} demons drop in the corridor.`,
        1.4,
      );
    }
  }

  private fireDoomWeapon(weapon: DoomWeaponId): number {
    let kills = 0;
    const muzzlePoint = this.getZombieWeaponMuzzlePosition(this.zombieWeaponMuzzlePoint);
    const direction = this.player.getForwardVector(this.zombieForward);
    const origin = this.player.getPosition();

    if (weapon === 'pistol') {
      const target = this.findClosestDoomEnemyInSight(DOOM_PISTOL_RANGE, 1.2);
      if (!target) {
        this.zombieShotEndPoint.copy(muzzlePoint).addScaledVector(direction, DOOM_PISTOL_RANGE);
        this.spawnActiveBulletTracer(muzzlePoint, this.zombieShotEndPoint, weapon);
        return 0;
      }

      this.spawnActiveBulletTracer(muzzlePoint, target.point, weapon);
      if (target.enemy.applyDamage(5 * MathUtils.randInt(1, 3))) {
        kills += 1;
      }
      return kills;
    }

    this.zombieShotRight.crossVectors(new Vector3(0, 1, 0), direction).normalize();
    this.zombieAimPoint.copy(this.camera.up).normalize();

    for (let pellet = 0; pellet < DOOM_SHOTGUN_PELLETS; pellet += 1) {
      this.zombieShotEndPoint
        .copy(direction)
        .addScaledVector(this.zombieShotRight, MathUtils.randFloatSpread(0.16))
        .addScaledVector(this.zombieAimPoint, MathUtils.randFloatSpread(0.1))
        .normalize();

      const target = this.findClosestDoomEnemyOnRay(origin, this.zombieShotEndPoint, DOOM_SHOTGUN_RANGE, 1.12);
      if (target) {
        this.spawnActiveBulletTracer(muzzlePoint, target.point, weapon);
        if (target.enemy.applyDamage(5 * MathUtils.randInt(1, 3))) {
          kills += 1;
        }
        continue;
      }

      const missPoint = muzzlePoint.clone().addScaledVector(this.zombieShotEndPoint, DOOM_SHOTGUN_RANGE);
      this.spawnActiveBulletTracer(muzzlePoint, missPoint, weapon);
    }

    return kills;
  }

  private findClosestDoomEnemyInSight(maxDistance: number, hitRadius: number): DoomSightTarget | null {
    const direction = this.player.getForwardVector(this.zombieForward);
    return this.findClosestDoomEnemyOnRay(this.player.getPosition(), direction, maxDistance, hitRadius);
  }

  private findClosestDoomEnemyOnRay(
    origin: Vector3,
    direction: Vector3,
    maxDistance: number,
    hitRadius: number,
  ): DoomSightTarget | null {
    let closest: DoomSightTarget | null = null;
    let closestDistance = Infinity;

    this.doomEnemies.forEach((enemy) => {
      if (!enemy.isActive()) {
        return;
      }

      const aimPoint = enemy.getAimPoint(this.zombieAimPoint);
      this.zombieRayPoint.copy(aimPoint).sub(origin);
      const along = this.zombieRayPoint.dot(direction);
      if (along < 0 || along > maxDistance || along >= closestDistance) {
        return;
      }

      this.zombieRayPoint.copy(direction).multiplyScalar(along).add(origin);
      if (this.zombieRayPoint.distanceToSquared(aimPoint) > hitRadius * hitRadius) {
        return;
      }

      if (!this.hasClearDoomLine(origin, aimPoint, 0.18)) {
        return;
      }

      closest = {
        enemy,
        point: aimPoint.clone(),
        distance: along,
      };
      closestDistance = along;
    });

    return closest;
  }

  private hasClearDoomLine(from: Vector3, to: Vector3, radius = 0.18): boolean {
    this.zombieRayPoint.copy(to).sub(from);
    const distance = this.zombieRayPoint.length();
    if (distance < 0.001) {
      return true;
    }

    this.zombieRayPoint.normalize();
    const steps = Math.max(1, Math.floor(distance / 0.4));

    for (let step = 1; step < steps; step += 1) {
      const probeX = from.x + this.zombieRayPoint.x * step * 0.4;
      const probeZ = from.z + this.zombieRayPoint.z * step * 0.4;
      if (isBlocked(probeX, probeZ, this.doomMode.colliders, radius)) {
        return false;
      }
    }

    return true;
  }

  private selectDoomWeapon(weapon: WeaponSelectId): void {
    if (!this.doomModeActive || this.doomWeapon === weapon || !this.doomWeaponsOwned.has(weapon)) {
      return;
    }

    this.doomWeapon = weapon;
    this.ensureZombieWeaponVisual();
    this.pushStatus(weapon === 'pistol' ? 'Pistol up.' : 'Shotgun up.', 1.2);
  }

  private handleDoomModeInteract(): void {
    const exitSwitch = this.doomMode.exitSwitch;
    if (this.player.getPosition().distanceTo(exitSwitch.interactPosition) <= GAME_CONFIG.player.interactionRange + 0.45) {
      if (!this.hasAllDoomKeys()) {
        this.pushStatus('The exit switch is dead until the red, yellow, and blue key cards are all in hand.');
        return;
      }

      this.beginDoomMode();
      this.pushStatus('You slam the exit switch. The run resets like a classic level clear.', 3.2);
      return;
    }

    const container = this.getNearestDoomContainer();
    if (container) {
      if (container.lootClaimed) {
        container.targetOpenAmount = 1;
        container.closeTimer = 0.9;
        this.pushStatus(
          container.kind === 'ammo-crate'
            ? 'The ammo crate is empty now.'
            : `${container.label} is empty now.`,
          1.2,
        );
        return;
      }

      container.targetOpenAmount = 1;
      container.closeTimer = 1.55;
      container.lootDisplayTimer = 1.2;
      container.lootClaimed = true;
      this.collectDoomReward(container.rewardKind, container.rewardAmount, container.label);
      return;
    }

    const door = this.getNearestDoomDoor();
    if (door) {
      if (!this.doomKeys.has(door.color)) {
        this.pushStatus(`The ${this.getDoomKeyLabel(door.color)} is required for this door.`);
        return;
      }

      door.open = !door.open;
      door.targetOpenAmount = door.open ? 1 : 0;
      this.gameplaySfxAudio.playSecurityDoor(door.open);
      this.pushStatus(
        door.open
          ? `${door.label} rumbles upward.`
          : `${door.label} grinds back down.`,
        1.6,
      );
      return;
    }

    this.pushStatus('Nothing here responds.');
  }

  private updateDoomMode(deltaSeconds: number): void {
    this.monsterState = this.unlockedMonsterState;
    this.touchingMonster = null;
    this.updateDoomPickups();

    const playerPosition = this.player.getPosition();
    let damageToPlayer = 0;
    let threatEyeIntensity = 0;

    this.doomEnemies.forEach((enemy) => {
      const result = enemy.update(deltaSeconds, playerPosition, this.doomMode.navigator);
      damageToPlayer += result.damageToPlayer;
      threatEyeIntensity = Math.max(threatEyeIntensity, result.alertLevel);
    });
    this.doomThreatEyeIntensity = threatEyeIntensity;

    if (damageToPlayer > 0) {
      this.applyDoomDamage(damageToPlayer);
      if (this.health > 0) {
        this.pushStatus(`The techbase monsters hit you for ${Math.round(damageToPlayer)} damage.`, 1.1);
      }
    }

    if (this.health <= 0) {
      this.beginDoomMode();
      this.pushStatus('The demons tear you apart. The techbase run resets.', 3);
    }
  }

  private updateDoomPickups(): void {
    const playerPosition = this.player.getPosition();
    this.doomMode.pickups.forEach((pickup) => {
      if (pickup.collected) {
        return;
      }

      if (playerPosition.distanceTo(pickup.position) > 1.35) {
        return;
      }

      this.collectDoomPickup(pickup);
    });
  }

  private collectDoomPickup(pickup: DoomPickup): void {
    pickup.collected = true;
    pickup.root.visible = false;
    this.collectDoomReward(pickup.kind, pickup.amount);
  }

  private collectDoomReward(kind: DoomPickup['kind'], amount: number, sourceLabel?: string): void {
    switch (kind) {
      case 'red-key':
        this.doomKeys.add('red');
        this.pushStatus(
          sourceLabel ? `You crack open ${sourceLabel.toLowerCase()} and pull the red key card.` : 'Red key card picked up.',
          1.8,
        );
        return;
      case 'yellow-key':
        this.doomKeys.add('yellow');
        this.pushStatus(
          sourceLabel ? `You find the yellow key card inside ${sourceLabel.toLowerCase()}.` : 'Yellow key card picked up.',
          1.8,
        );
        return;
      case 'blue-key':
        this.doomKeys.add('blue');
        this.pushStatus(
          sourceLabel ? `The blue key card is hidden inside ${sourceLabel.toLowerCase()}.` : 'Blue key card picked up.',
          1.8,
        );
        return;
      case 'bullets':
        this.doomAmmo.pistol += amount;
        this.pushStatus(
          sourceLabel ? `${sourceLabel} snaps open. Bullets +${amount}.` : `Picked up bullets (+${amount}).`,
          1.2,
        );
        return;
      case 'shells':
        this.doomAmmo.shotgun += amount;
        this.pushStatus(
          sourceLabel ? `${sourceLabel} opens with a clack. Shells +${amount}.` : `Picked up shells (+${amount}).`,
          1.2,
        );
        return;
      case 'medkit':
        this.health = Math.min(GAME_CONFIG.player.healthMax, this.health + amount);
        this.pushStatus('Picked up a medkit.', 1.2);
        return;
      case 'armor':
        this.doomArmor = Math.min(100, this.doomArmor + amount);
        this.pushStatus('Armor boosted.', 1.2);
        return;
      case 'shotgun':
        this.doomWeaponsOwned.add('shotgun');
        this.doomAmmo.shotgun += 8;
        this.doomWeapon = 'shotgun';
        this.zombieWeaponKick = 0;
        this.ensureZombieWeaponVisual();
        this.pushStatus('You got the shotgun.', 1.6);
        return;
    }
  }

  private applyDoomDamage(amount: number): void {
    const armorAbsorb = Math.min(this.doomArmor, Math.round(amount * 0.6));
    this.doomArmor = Math.max(0, this.doomArmor - armorAbsorb);
    this.health = Math.max(0, this.health - (amount - armorAbsorb));
  }

  private getSafeDoomEnemySpawn(
    desired: Vector3,
    variant: DoomEnemyVariant,
    occupied: readonly Vector3[],
  ): Vector3 {
    const radius = variant === 'imp' ? 0.46 : 0.58;
    const spacing = variant === 'imp' ? 1.2 : 1.55;
    const offsets: Array<[number, number]> = [
      [0, 0],
      [1.4, 0],
      [-1.4, 0],
      [0, 1.4],
      [0, -1.4],
      [1.4, 1.4],
      [1.4, -1.4],
      [-1.4, 1.4],
      [-1.4, -1.4],
      [2.8, 0],
      [-2.8, 0],
      [0, 2.8],
      [0, -2.8],
    ];

    let best = this.doomMode.navigator.snap(desired, radius);
    let bestScore = -Infinity;

    for (const [offsetX, offsetZ] of offsets) {
      this.zombieRayPoint.copy(desired).add(this.zombieAimPoint.set(offsetX, 0, offsetZ));
      const snapped = this.doomMode.navigator.snap(this.zombieRayPoint, radius);
      const nearestOccupied = occupied.reduce((nearest, position) => {
        const distance = snapped.distanceTo(position);
        return Math.min(nearest, distance);
      }, Infinity);

      const clear = nearestOccupied >= spacing;
      const offsetPenalty = Math.hypot(offsetX, offsetZ) * 0.2;
      const score = (clear ? 1000 : nearestOccupied) - offsetPenalty;
      if (score <= bestScore) {
        continue;
      }

      best = snapped;
      bestScore = score;

      if (clear && offsetX === 0 && offsetZ === 0) {
        break;
      }
    }

    return best.clone().setY(0);
  }

  private getNearestDoomDoor(): DoomDoor | null {
    const playerPosition = this.player.getPosition();
    let closest: DoomDoor | null = null;
    let closestDistance = Infinity;

    for (const door of this.doomMode.doors) {
      const distance = playerPosition.distanceTo(door.interactPosition);
      if (distance > GAME_CONFIG.player.interactionRange + 0.6 || distance >= closestDistance) {
        continue;
      }

      closest = door;
      closestDistance = distance;
    }

    return closest;
  }

  private getNearestDoomContainer(): DoomLootContainer | null {
    const playerPosition = this.player.getPosition();
    let closest: DoomLootContainer | null = null;
    let closestDistance = Infinity;

    for (const container of this.doomMode.containers) {
      const distance = playerPosition.distanceTo(container.interactPosition);
      if (distance > GAME_CONFIG.player.interactionRange + 0.55 || distance >= closestDistance) {
        continue;
      }

      closest = container;
      closestDistance = distance;
    }

    return closest;
  }

  private hasAllDoomKeys(): boolean {
    return this.doomKeys.has('red') && this.doomKeys.has('yellow') && this.doomKeys.has('blue');
  }

  private getDoomKeyLabel(color: DoomKeyColor): string {
    switch (color) {
      case 'red':
        return 'red key card';
      case 'yellow':
        return 'yellow key card';
      case 'blue':
        return 'blue key card';
    }
  }

  private getZombieNightBlend(): number {
    if (this.zombieNightActive) {
      return 1;
    }

    if (this.zombiePhaseRemaining >= 8) {
      return 0;
    }

    return MathUtils.clamp(1 - this.zombiePhaseRemaining / 8, 0, 1);
  }

  private handleChapterTwoInteract(): void {
    if (this.chapterTwoSlide) {
      return;
    }

    if (this.chapterTwoBearDialogueIndex !== null) {
      this.advanceChapterTwoBearDialogue();
      return;
    }

    if (this.chapterTwoSeatId) {
      this.leaveChapterTwoSeat();
      return;
    }

    const aftermathBear = this.getNearestChapterTwoAftermathBear();
    if (aftermathBear) {
      if (!this.chapterTwoBearDialogueComplete) {
        this.advanceChapterTwoBearDialogue();
        return;
      }

      if (this.chapterTwoBearChoicePending) {
        this.pushStatus('Press Y to help the teddy bear monster or N to refuse.');
        return;
      }

      if (this.chapterTwoKeycards.has('yellow')) {
        this.pushStatus('The teddy bear monster already gave you the yellow key card.');
        return;
      }

      const blueBearsRemaining = CHAPTER_TWO_BLUE_BEAR_TOTAL - this.chapterTwoBlueBearsReturned;
      if (this.chapterTwoBlueBearsHeld <= 0) {
        this.pushStatus(`The teddy bear monster is still waiting for ${blueBearsRemaining} more blue teddy bears.`);
        return;
      }

      this.chapterTwoBlueBearsHeld -= 1;
      this.chapterTwoBlueBearsReturned = Math.min(
        CHAPTER_TWO_BLUE_BEAR_TOTAL,
        this.chapterTwoBlueBearsReturned + 1,
      );

      if (this.chapterTwoBlueBearsReturned >= CHAPTER_TWO_BLUE_BEAR_TOTAL) {
        this.chapterTwoKeycards.add('yellow');
        const yellowKeycard = this.chapterTwo.keycards.find((keycard) => keycard.color === 'yellow') ?? null;
        if (yellowKeycard) {
          yellowKeycard.collected = true;
          yellowKeycard.root.visible = false;
        }
        this.startChapterTwoDodoTrail();
        this.pushStatus(
          'You hand over the last blue teddy bear. The teddy bear monster gives you the yellow key card, a sharp zap snaps through the hall, and bird footprints trail out of the dodo room toward the power closet.',
          5.6,
        );
      } else {
        this.powerEventAudio.resume();
        this.powerEventAudio.playZap();
        this.pushStatus(
          `You give the teddy bear monster one of the blue teddy bears. ${this.chapterTwoBlueBearsReturned}/${CHAPTER_TWO_BLUE_BEAR_TOTAL} are back with him now.`,
        );
      }
      return;
    }

    const utilityCloset = this.getNearestChapterTwoUtilityCloset();
    if (utilityCloset) {
      utilityCloset.targetOpenAmount = utilityCloset.targetOpenAmount > 0.5 ? 0 : 1;
      utilityCloset.open = utilityCloset.targetOpenAmount > 0.5;
      this.gameplaySfxAudio.playClosetDoor(utilityCloset.open);
      this.pushStatus(
        utilityCloset.open
          ? 'The round wall closet swings open. A big gray power box packed with red and blue wires is inside it.'
          : 'The round wall closet swings shut over the power box.',
        3.1,
      );
      return;
    }

    const readable = this.getNearestChapterTwoReadable();
    if (readable) {
      this.pushStatus(readable.text, 11);
      return;
    }

    const blueBearPickup = this.getNearestChapterTwoBlueBear();
    if (blueBearPickup) {
      blueBearPickup.collected = true;
      blueBearPickup.root.visible = false;
      this.chapterTwoBlueBearsHeld = Math.min(
        CHAPTER_TWO_BLUE_BEAR_TOTAL,
        this.chapterTwoBlueBearsHeld + 1,
      );
      const blueBearsFound = this.getChapterTwoBlueBearsFoundTotal();
      this.pushStatus(
        blueBearsFound >= CHAPTER_TWO_BLUE_BEAR_TOTAL
          ? 'That was the last missing blue teddy bear. Bring them back to the teddy bear monster by the broken fish tank.'
          : `You found one of the missing blue teddy bears. ${blueBearsFound}/${CHAPTER_TWO_BLUE_BEAR_TOTAL} recovered.`,
      );
      return;
    }

    const eggPickup = this.getNearestChapterTwoEgg();
    if (eggPickup) {
      eggPickup.collected = true;
      eggPickup.root.visible = false;
      this.chapterTwoEggsHeld += 1;
      const eggsFound = this.chapterTwoEggsHeld + this.chapterTwoEggsDeposited;
      this.pushStatus(
        eggsFound >= this.chapterTwo.dodoPuzzle.totalEggs
          ? 'That is the last egg. Get everything to the weird dodo with its beak hanging open.'
          : `You find a hidden egg. ${eggsFound}/${this.chapterTwo.dodoPuzzle.totalEggs} eggs recovered.`,
      );
      return;
    }

    const puzzlePiece = this.getNearestChapterTwoPuzzlePiece();
    if (puzzlePiece) {
      puzzlePiece.collected = true;
      puzzlePiece.root.visible = false;
      this.chapterTwoPuzzlePiecesCollected = Math.min(
        ENTRY_PUZZLE_PIECE_TOTAL,
        this.chapterTwoPuzzlePiecesCollected + 1,
      );
      this.chapterTwo.setEntryPuzzleState(
        this.chapterTwoPuzzlePiecesCollected,
        this.chapterTwoRedPuzzleSolved,
      );
      this.pushStatus(
        this.chapterTwoPuzzlePiecesCollected === ENTRY_PUZZLE_PIECE_TOTAL
          ? 'The last red puzzle piece clicks into place on your board. Get to the puzzle table in the right playroom to complete the red key card.'
          : `You find a red key-card puzzle piece. ${this.chapterTwoPuzzlePiecesCollected}/${ENTRY_PUZZLE_PIECE_TOTAL} pieces recovered.`,
      );
      return;
    }

    const slide = this.getNearestChapterTwoSlide();
    if (slide) {
      this.startChapterTwoSlide(slide);
      return;
    }

    const seat = this.getNearestChapterTwoSeat();
    if (seat) {
      this.enterChapterTwoSeat(seat);
      return;
    }

    if (this.isNearChapterTwoPuzzleBoard()) {
      if (this.chapterTwoRedPuzzleSolved) {
        this.pushStatus('The red key-card puzzle is already complete. Red access is live.');
        return;
      }

      if (this.chapterTwoPuzzlePiecesCollected < ENTRY_PUZZLE_PIECE_TOTAL) {
        this.pushStatus(
          `The puzzle board is waiting for ${ENTRY_PUZZLE_PIECE_TOTAL - this.chapterTwoPuzzlePiecesCollected} more red pieces.`,
        );
        return;
      }

      this.chapterTwoRedPuzzleSolved = true;
      this.chapterTwoKeycards.add('red');
      this.chapterTwo.setEntryPuzzleState(this.chapterTwoPuzzlePiecesCollected, true);
      this.pushStatus(
        'The red key-card image locks together across the table. Red access is now active on every matching door.',
      );
      return;
    }

    const keycard = this.getNearestChapterTwoKeycard();
    if (keycard) {
      keycard.collected = true;
      keycard.root.visible = false;
      this.chapterTwoKeycards.add(keycard.color);
      this.pushStatus(`${keycard.label} recovered. Its matching reader will respond now.`);
      return;
    }

    if (this.isNearChapterTwoDodoPuzzle()) {
      if (!this.chapterTwoEggQuestStarted && !CHAPTER_TWO_STARTS_WITH_ALL_DODO_EGGS) {
        this.startChapterTwoEggQuest();
        return;
      }

      const totalEggs = this.chapterTwo.dodoPuzzle.totalEggs;
      const remainingEggs = totalEggs - this.chapterTwoEggsDeposited;

      if (remainingEggs <= 0) {
        this.pushStatus(
          this.chapterTwoKeycards.has('blue')
            ? 'The dodo is stuffed and the blue key card is already yours.'
            : 'The dodo has swallowed every egg. The blue key card is lying beside it now.',
        );
        return;
      }

      if (this.chapterTwoEggsHeld <= 0) {
        this.pushStatus(`The dodo keeps staring at the ceiling. It still wants ${remainingEggs} more eggs.`);
        return;
      }

      this.chapterTwoEggsHeld -= 1;
      this.chapterTwoEggsDeposited = Math.min(totalEggs, this.chapterTwoEggsDeposited + 1);
      const solved = this.chapterTwoEggsDeposited >= totalEggs;
      this.chapterTwo.setDodoPuzzleState(this.chapterTwoEggsDeposited, solved);
      if (solved) {
        this.lobbyCrashAudio.resume();
        this.lobbyCrashAudio.playCrash();
      }
      this.pushStatus(
        solved
          ? 'The last egg drops past the beak. A blue key card clacks down beside the dodo, a huge crash slams out of the lobby, and a cold white light rises to lead you back toward the broken tank. Glass is everywhere.'
          : `You feed an egg into the dodo. ${this.chapterTwoEggsDeposited}/${totalEggs} eggs are in its mouth now.`,
      );
      return;
    }

    const coffeeMachine = this.getNearestChapterTwoCoffeeMachine();
    if (coffeeMachine) {
      if (this.chapterTwoCoffeeJob) {
        this.pushStatus('The coffee machine is already whirring. Give it a few seconds to finish the cup.');
        return;
      }

      this.startChapterTwoCoffeeBrew(coffeeMachine);
      return;
    }

    const door = this.getNearestChapterTwoDoor();
    if (door) {
      if (!this.chapterTwoKeycards.has(door.color)) {
        this.pushStatus(`${CHAPTER_TWO_KEYCARD_LABELS[door.color]} is required to move this door.`);
        return;
      }

      door.open = !door.open;
      door.targetOpenAmount = door.open ? 1 : 0;
      this.gameplaySfxAudio.playSecurityDoor(door.open);
      if (door.open && door.id === 'lobby-north') {
        if (this.chapterTwo.triggerRedDoorPeek(this.player.getPosition())) {
          door.openAmount = 1;
          door.targetOpenAmount = 1;
          door.slab.position.y = MathUtils.lerp(door.closedY, door.openY, door.openAmount);
          door.collider.enabled = false;
          if (this.chapterTwo.redDoorPeekLookTarget) {
            this.player.lookToward(this.chapterTwo.redDoorPeekLookTarget, 1);
          }
        }
      }
      this.pushStatus(
        door.open
          ? `You swipe the ${CHAPTER_TWO_KEYCARD_LABELS[door.color]}. The door rumbles upward into the ceiling.`
          : `You swipe the ${CHAPTER_TWO_KEYCARD_LABELS[door.color]} again. The door grinds back down.`,
      );
      return;
    }

    this.pushStatus('Nothing here responds. The locked doors need their matching key cards.');
  }

  private handleStationInteract(station: StationInteractable): void {
    switch (station.id) {
      case 'grainer':
        this.tryStartMachineJob({
          id: 'grainer',
          input: 'rice-stalk',
          output: 'raw-rice',
          startText: 'You feed a rice stalk into the grainer. It starts dropping through the top hopper.',
          finishText: 'The grainer spits out a tray of raw rice.',
          missingText: 'The grainer needs a rice stalk from the rice room.',
        });
        return;
      case 'boiler':
        this.tryStartMachineJob({
          id: 'boiler',
          input: 'raw-rice',
          output: 'cooked-rice',
          startText: 'You load the raw rice into the boiler and the pot starts working.',
          finishText: 'The pot finishes and the cooked rice is ready.',
          missingText: 'The boiler only works with raw rice from the grainer.',
        });
        return;
      case 'dryer':
        this.tryStartMachineJob({
          id: 'dryer',
          input: 'seaweed',
          output: 'dried-seaweed',
          startText: 'The dryer starts pulling the fresh seaweed through its hot chamber.',
          finishText: 'The dryer kicks out crisp dried seaweed.',
          missingText: 'Bring fresh seaweed back from the pantry first.',
        });
        return;
      case 'slicer':
        this.tryStartMachineJob({
          id: 'slicer',
          input: 'dried-seaweed',
          output: 'sliced-seaweed',
          startText: 'The slicer hums and starts trimming the dried seaweed into strips.',
          finishText: 'The slicer finishes a neat stack of seaweed strips.',
          missingText: 'Dry the seaweed first, then run it through the slicer.',
        });
        return;
      case 'skinner': {
        if (this.isMachineBusy('skinner')) {
          this.pushStatus(this.getBusyMachineText('skinner'));
          return;
        }

        const fishToProcess = this.getPreferredFishInput();

        if (!fishToProcess) {
          this.pushStatus('The skinner needs a salmon fish or tuna fish from the aquarium room.');
          return;
        }

        const output = fishToProcess === 'salmon-fish' ? 'salmon' : 'tuna';
        this.startMachineJob({
          id: 'skinner',
          input: fishToProcess,
          output,
          duration: MACHINE_JOB_DURATIONS.skinner,
          startText:
          fishToProcess === 'salmon-fish'
            ? 'You feed the salmon into the skinner and the blade drum starts stripping it down.'
            : 'You feed the tuna into the skinner and the blade drum starts stripping it down.',
          finishText:
            fishToProcess === 'salmon-fish'
              ? 'The skinner finishes clean salmon cuts for the roll.'
              : 'The skinner finishes clean tuna cuts for the roll.',
        });
        return;
      }
      case 'plate':
        this.pushStatus('Fresh clean plates feed into the plating section automatically. Build the dish there, then pick up the finished plate.');
        return;
      case 'assembly': {
        if (this.holdingPlate && this.platedRecipeId) {
          const recipe = this.getCurrentPlateRecipe();
          this.pushStatus(`${recipe?.label ?? 'This dish'} is in your hands. Carry it to the judges belt and press D to drop it.`);
          return;
        }

        if (this.platedRecipeId) {
          const recipe = this.getCurrentPlateRecipe();
          this.holdingPlate = true;
          this.pushStatus(`${recipe?.label ?? 'This dish'} comes off the plating bench. Carry it to the judges belt and press D to drop it.`);
          return;
        }

        const recipe = this.getPlateTargetRecipe();
        if (!recipe) {
          const nextRecipe = this.getNextRecipe();

          if (!nextRecipe) {
            this.pushStatus('Every dish is already assembled and delivered.');
            return;
          }

          this.pushStatus(
            `You still need ${this.formatIngredientList(this.getMissingIngredients(nextRecipe))} for ${nextRecipe.label}.`,
          );
          return;
        }

        this.plateRecipeId = recipe.id;
        const addedIngredients: IngredientId[] = [];

        recipe.ingredients.forEach((ingredientId) => {
          if (this.plateIngredients.includes(ingredientId) || !this.hasItem(ingredientId)) {
            return;
          }

          this.removeItem(ingredientId);
          this.plateIngredients.push(ingredientId);
          addedIngredients.push(ingredientId);
        });

        if (addedIngredients.length === 0) {
          const missing = recipe.ingredients.filter((ingredientId) => !this.plateIngredients.includes(ingredientId));
          this.pushStatus(
            this.plateIngredients.length > 0
              ? `${recipe.label} is started on the plating bench. You still need ${this.formatIngredientList(missing)}.`
              : `You still need ${this.formatIngredientList(this.getMissingIngredients(recipe))} for ${recipe.label}.`,
          );
          return;
        }

        if (this.plateIngredients.length === recipe.ingredients.length) {
          this.platedRecipeId = recipe.id;
          this.pushStatus(
            `${recipe.label} forms on the plating station. Press E to pick up the finished plate, then carry it to the judges belt.`,
          );
          return;
        }

        const remaining = recipe.ingredients.filter((ingredientId) => !this.plateIngredients.includes(ingredientId));
        this.pushStatus(
          `You set ${this.formatIngredientList(addedIngredients)} onto the plating bench. ${recipe.label} still needs ${this.formatIngredientList(remaining)}.`,
        );
        return;
      }
      case 'submission': {
        if (!this.holdingPlate || !this.platedRecipeId) {
          this.pushStatus('Pick up the finished plate from the plating section first, then bring it here.');
          return;
        }

        this.pushStatus('Press D to drop the plated dish onto the judges belt.');
        return;
      }
    }
  }

  private handleDrop(): void {
    if (this.chapterTwoActive) {
      const slide = this.getNearestChapterTwoStairs();
      if (slide) {
        this.startChapterTwoClimb(slide);
        return;
      }
    }

    if (!this.holdingPlate || !this.platedRecipeId) {
      return;
    }

    const station = this.getNearestStation();
    if (station?.id !== 'submission') {
      const recipe = this.getCurrentPlateRecipe();
      this.pushStatus(`${recipe?.label ?? 'The dish'} is still in your hands. Bring it to the judges belt before you drop it.`);
      return;
    }

    this.submittedRecipes.add(this.platedRecipeId);
    const recipe = this.getCurrentPlateRecipe();
    this.plateIngredients.length = 0;
    this.plateRecipeId = null;
    this.platedRecipeId = null;
    this.holdingPlate = false;
    this.pushStatus(`${recipe?.label ?? 'The dish'} lands on the conveyor and rolls down to the judges. A fresh plate slides into the plating section.`);
  }

  private getObjectiveText(): string {
    if (this.doomModeActive) {
      const enemiesLeft = this.doomEnemies.filter((enemy) => enemy.isActive()).length;
      const unopenedContainers = this.doomMode.containers.filter((container) => !container.lootClaimed).length;
      const keyLine = (['red', 'yellow', 'blue'] as const)
        .map((color) => `${this.doomKeys.has(color) ? '[x]' : '[ ]'} ${this.getDoomKeyLabel(color)}`)
        .join('\n');

      return [
        'Doom Run',
        '',
        'Push through the larger techbase, crack open hidden key chests, raid ammo crates, and hit the exit switch.',
        `Weapon: ${this.doomWeapon === 'pistol' ? 'Pistol' : 'Shotgun'}`,
        `Enemies left: ${enemiesLeft}`,
        `Unopened caches: ${unopenedContainers}`,
        '',
        keyLine,
      ].join('\n');
    }

    if (this.zombieModeActive) {
      const defenseLines = ZOMBIE_DEFENSE_IDS.map((id) => {
        const level = this.zombieDefenseLevels.get(id) ?? 0;
        const health = this.zombieDefenseHealth.get(id) ?? 0;
        const maxHealth = ZOMBIE_DEFENSE_HEALTH_BY_LEVEL[level];
        return `[${level > 0 ? 'x' : ' '}] ${id[0].toUpperCase()}${id.slice(1)}: lvl ${level} / ${Math.max(0, Math.ceil(health))}${maxHealth > 0 ? `/${maxHealth}` : ''}`;
      });

      return [
        'Zombie First Person Shooter',
        '',
        `Day ${this.zombieDay} / ${this.zombieNightActive ? 'Night Assault' : 'Daylight Prep'}`,
        `Kills: ${this.zombieKills}`,
        `Scrap: ${this.zombieScrap}`,
        this.zombieNightActive
          ? `Hold the line. ${this.zombieNightSpawnRemaining} zombies still have to break out of the treeline.`
          : 'Use daylight to repair and upgrade the four barricades before the next night hits.',
        '',
        ...defenseLines,
      ].join('\n');
    }

    if (this.officeChapterActive) {
      if (this.officeGameModeActive) {
        const config = this.getOfficeGameModeConfig();
        const closedDoors = this.officeChapter.doors.filter((door) => door.targetOpenAmount < 0.5).length;
        const phaseLine = this.officeGameModeNightPhase
          ? `Night ${this.officeGameModeNight}/${OFFICE_GAME_MODE_TOTAL_NIGHTS}: ${this.getOfficeGameModeClockLabel()} / ${Math.ceil(this.getOfficeGameModePhaseTimeRemaining() / 60)} min to 6 AM`
          : `Day break before Night ${this.officeGameModeNight}/${OFFICE_GAME_MODE_TOTAL_NIGHTS}: ${Math.ceil(this.getOfficeGameModePhaseTimeRemaining() / 60)} min left`;
        return [
          `Chapter Three: ${this.getOfficeModeLabel()}`,
          '',
          `Difficulty: ${config.label}`,
          phaseLine,
          `Power: ${Math.ceil(this.officeGameModePower)}%${this.officeGameModePowerOut ? ' / OUT' : ''}`,
          `Closed doors draining power: ${closedDoors}`,
          'Use the tablet cameras and door controls carefully. Closed doors block animatronics, but they drain power.',
          'M opens the mode menu. J opens the jumpscare test screen.',
        ].join('\n');
      }

      return [
        'Chapter Three: Office',
        '',
        'The side hallways now run into the same wide party room.',
        'Open either office door, follow the hall, and check the far stage with Quacky the Duck, Fluffle the Bunny, and Bori the Bear.',
        'Press M to choose Night, Game, or Creator Mode.',
      ].join('\n');
    }

    if (this.chapterTwoActive) {
      const recovered = this.chapterTwoKeycards.size;
      const raised = this.chapterTwo.securityDoors.filter((door) => door.open).length;
      const eggTotal = this.chapterTwo.dodoPuzzle.totalEggs;
      const eggsFound = this.getChapterTwoEggsFoundTotal();
      const blueUnlocked = this.chapterTwoEggsDeposited >= eggTotal;
      const keycardLines = CHAPTER_TWO_KEYCARD_ORDER.map((color) => {
        const label = CHAPTER_TWO_KEYCARD_LABELS[color].replace(' Key Card', '');
        const hasCard = this.chapterTwoKeycards.has(color);
        const matchingDoors = this.chapterTwo.securityDoors.filter((candidate) => candidate.color === color);
        const raisedCount = matchingDoors.filter((door) => door.open).length;
        const doorState = matchingDoors.length > 0
          ? `${raisedCount}/${matchingDoors.length} doors raised`
          : 'bear reward';

        if (color === 'red' && !this.chapterTwoRedPuzzleSolved) {
          return `[ ] ${label}: puzzle ${this.chapterTwoPuzzlePiecesCollected}/${ENTRY_PUZZLE_PIECE_TOTAL} pieces / ${doorState}`;
        }

        if (color === 'yellow' && !hasCard) {
          return this.chapterTwoBearDialogueComplete
            ? this.chapterTwoBearQuestAccepted
              ? `[ ] ${label}: blue bears ${this.chapterTwoBlueBearsReturned}/${CHAPTER_TWO_BLUE_BEAR_TOTAL} returned (${this.getChapterTwoBlueBearsFoundTotal()}/${CHAPTER_TWO_BLUE_BEAR_TOTAL} found) / ${doorState}`
              : this.chapterTwoBearChoicePending
                ? `[ ] ${label}: answer the teddy bear monster / ${doorState}`
                : `[ ] ${label}: talk to the teddy bear by the broken tank / ${doorState}`
            : `[ ] ${label}: talk to the teddy bear by the broken tank / ${doorState}`;
        }

        if (color === 'blue' && !hasCard) {
          return this.chapterTwoEggQuestStarted || CHAPTER_TWO_STARTS_WITH_ALL_DODO_EGGS
            ? `[ ] ${label}: dodo eggs ${this.chapterTwoEggsDeposited}/${eggTotal} fed (${eggsFound}/${eggTotal} found) / ${doorState}`
            : `[ ] ${label}: visit the dodo to begin the egg hunt / ${doorState}`;
        }

        return `${hasCard ? '[x]' : '[ ]'} ${label}: ${hasCard ? 'card recovered' : 'card missing'} / ${doorState}`;
      });

      const chapterTwoPrimaryObjective = this.chapterTwoPowerOutageTriggered
        ? 'The daycare power is out. Use your flashlight and push deeper into the chained daycare wings.'
        : this.chapterTwoDodoTrailActive
          ? 'The yellow key card is yours. Bird footprints lead out of the dodo room toward the power closet.'
          : CHAPTER_TWO_STARTS_WITH_RED_KEYCARD
            ? blueUnlocked
              ? this.chapterTwoBearDialogueComplete
                ? this.chapterTwoKeycards.has('yellow')
                  ? 'Red, blue, and yellow access are live. Push deeper into the chained daycare wings.'
                  : CHAPTER_TWO_STARTS_WITH_ALL_BLUE_BEARS
                    ? 'Red and blue access are live. You already have all eight blue teddy bears, but the teddy bear monster still wants them handed back before it gives up the yellow key card.'
                    : 'Red and blue access are live. The teddy bear monster wants eight missing blue teddy bears before it gives up the yellow key card.'
                : 'Red and blue access are live. Something is waiting by the broken fish tank in the lobby.'
              : this.chapterTwoEggQuestStarted || CHAPTER_TWO_STARTS_WITH_ALL_DODO_EGGS
                ? 'Red access is already live. Search the red wing between the red and blue doors, collect the hidden eggs, and feed them to the dodo to reveal the blue card.'
                : 'Red access is already live. Find the dodo first to begin the egg hunt.'
            : 'Search the spawn section for the hidden red puzzle pieces and rebuild the first key card at the puzzle table.';
      const chapterTwoSecondaryObjective = this.chapterTwoPowerOutageTriggered
        ? 'The dodo made it to the power closet before the lights died. The later color wings are still deeper ahead.'
        : this.chapterTwoDodoTrailActive
          ? 'The dodo is no longer in its room. Follow the prints through the halls and see what it is doing by the closet.'
          : CHAPTER_TWO_STARTS_WITH_RED_KEYCARD
            ? blueUnlocked
              ? this.chapterTwoKeycards.has('yellow')
                ? 'Green, purple, pink, and gold still chain deeper behind the later locked sections.'
                : this.chapterTwoBearQuestAccepted
                  ? 'The yellow key card is tied to the teddy bear monster, not the dodo. Find every missing blue teddy bear and bring them back.'
                  : 'The yellow key card is tied to the teddy bear monster. Answer him first, then decide whether to help.'
              : this.chapterTwoEggQuestStarted || CHAPTER_TWO_STARTS_WITH_ALL_DODO_EGGS
                ? 'Every door up to the blue wing now answers to red access, but the blue card only appears after the dodo gets every egg.'
                : 'The eggs are not visible yet. Wake up the egg hunt by visiting the dodo.'
            : 'After red access opens, later colors sit deeper behind earlier locked sections and some colors control multiple doors.';

      return [
        'Chapter Two: Security Wing',
        '',
        chapterTwoPrimaryObjective,
        chapterTwoSecondaryObjective,
        this.chapterTwoEggQuestStarted || CHAPTER_TWO_STARTS_WITH_ALL_DODO_EGGS
          ? `Eggs found: ${eggsFound}/${eggTotal}`
          : 'Egg hunt: visit the dodo to begin',
        `Blue Teddy Bears: found ${this.getChapterTwoBlueBearsFoundTotal()}/${CHAPTER_TWO_BLUE_BEAR_TOTAL} / returned ${this.chapterTwoBlueBearsReturned}/${CHAPTER_TWO_BLUE_BEAR_TOTAL}`,
        `Key cards recovered: ${recovered}/${CHAPTER_TWO_KEYCARD_ORDER.length}`,
        `Security doors raised: ${raised}/${this.chapterTwo.securityDoors.length}`,
        '',
        ...keycardLines,
      ].join('\n');
    }

    const remaining = RECIPES.length - this.submittedRecipes.size;
    const intro =
      remaining === RECIPES.length && this.hasAllStartingDishSupplies()
          ? 'You already have the ingredients for both rolls. Plate them and send them to the judges chute.'
        : remaining === 0
          ? 'Challenge cleared. Both plated dishes are through the judges chute. Get to the seaweed-side door.'
        : remaining === RECIPES.length
          ? 'Find the raw ingredients in the maze, process them with the station machines, then plate and submit each roll.'
          : `Send ${remaining} more ${remaining === 1 ? 'dish' : 'dishes'} to the judges chute.`;

    const recipeLines = RECIPES.map((recipe) => {
      if (this.submittedRecipes.has(recipe.id)) {
        return `${recipe.label}: submitted`;
      }

      if (this.platedRecipeId === recipe.id) {
        return this.holdingPlate
          ? `${recipe.label}: carried to judges`
          : `${recipe.label}: ready on plating bench`;
      }

      if (this.plateRecipeId === recipe.id && this.plateIngredients.length > 0) {
        return `${recipe.label}: ${this.plateIngredients.length}/${recipe.ingredients.length} on plate (${this.formatIngredientList(recipe.ingredients)})`;
      }

      const readyCount = recipe.ingredients.filter((ingredientId) => this.hasItem(ingredientId)).length;
      return `${recipe.label}: ${readyCount}/${recipe.ingredients.length} ready (${this.formatIngredientList(recipe.ingredients)})`;
    });

    return [intro, '', ...recipeLines].join('\n');
  }

  private getInventoryText(): string {
    if (this.doomModeActive) {
      const keys = (['red', 'yellow', 'blue'] as const)
        .filter((color) => this.doomKeys.has(color))
        .map((color) => this.getDoomKeyLabel(color));
      return [
        this.getCoordinateToolInventoryLine(),
        `Weapon: ${this.doomWeapon === 'pistol' ? 'Pistol' : 'Shotgun'}`,
        `Bullets: ${this.doomAmmo.pistol}`,
        `Shells: ${this.doomAmmo.shotgun}`,
        `Armor: ${this.doomArmor}`,
        `Caches Opened: ${this.doomMode.containers.filter((container) => container.lootClaimed).length}/${this.doomMode.containers.length}`,
        `Keys: ${keys.length > 0 ? keys.join(', ') : 'none'}`,
      ].join('\n');
    }

    if (this.zombieModeActive) {
      return [
        this.getCoordinateToolInventoryLine(),
        `Weapon: ${this.zombieWeapon === 'pistol' ? 'Pistol' : 'Shotgun'}`,
        `Pistol Ammo: ${this.zombieAmmo.pistol}`,
        `Shotgun Ammo: ${this.zombieAmmo.shotgun}`,
        `Scrap: ${this.zombieScrap}`,
      ].join('\n');
    }

    if (this.officeChapterActive) {
      return [
        'Inventory: Coordinate Tool, Tablet',
        this.getCoordinateToolInventoryLine(),
        this.getOfficeTabletInventoryLine(),
        `Glass: ${this.officeGlassHeld ? 'held' : 'none'}`,
        this.officeGameModeActive
          ? `${this.getOfficeModeLabel()}: ${this.getOfficeGameModeConfig().label} / Night ${this.officeGameModeNight}/${OFFICE_GAME_MODE_TOTAL_NIGHTS} / ${this.getOfficeGameModeClockLabel()} / Power ${Math.ceil(this.officeGameModePower)}%${this.officeGameModePowerOut ? ' / OUT' : ''}`
          : 'Mode: Creator / Day',
        'Press 1 for the Coordinate Tool. Press 2 for the tablet. Press M for the mode menu. Press J for jumpscares.',
      ].join('\n');
    }

    if (this.chapterTwoActive) {
      const cards = CHAPTER_TWO_KEYCARD_ORDER
        .filter((color) => this.chapterTwoKeycards.has(color))
        .map((color) => CHAPTER_TWO_KEYCARD_LABELS[color]);
      const coffeeCount = this.countItem('coffee');
      const eggTotal = this.chapterTwo.dodoPuzzle.totalEggs;
      const cardLine = cards.length === 0
        ? 'Key Cards: none'
        : `Key Cards: ${cards.join(', ')}`;
      const coffeeLine = this.activeCoffeeDrink
        ? 'Coffee: drinking now'
        : this.chapterTwoCoffeeJob
          ? `Coffee: brewing (${Math.max(1, Math.ceil(this.chapterTwoCoffeeJob.remaining))}s)`
          : this.coffeeBoostRemaining > 0
            ? `Coffee: rush active (${Math.max(1, Math.ceil(this.coffeeBoostRemaining))}s)`
            : `Coffee: ${coffeeCount > 0 ? `x${coffeeCount}` : 'none'}`;

      return [
        this.getCoordinateToolInventoryLine(),
        CHAPTER_TWO_STARTS_WITH_RED_KEYCARD
          ? 'Red Access: live'
          : `Red Puzzle Pieces: ${this.chapterTwoPuzzlePiecesCollected}/${ENTRY_PUZZLE_PIECE_TOTAL}`,
        this.chapterTwoEggQuestStarted || CHAPTER_TWO_STARTS_WITH_ALL_DODO_EGGS
          ? `Eggs: holding ${this.chapterTwoEggsHeld} / fed ${this.chapterTwoEggsDeposited}/${eggTotal}`
          : 'Eggs: visit the dodo to begin',
        this.chapterTwoBearQuestAccepted
          ? `Blue Bears: holding ${this.chapterTwoBlueBearsHeld} / returned ${this.chapterTwoBlueBearsReturned}/${CHAPTER_TWO_BLUE_BEAR_TOTAL}`
          : this.chapterTwoBearChoicePending
            ? 'Blue Bears: waiting on your answer'
            : 'Blue Bears: quest not accepted',
        cardLine,
        coffeeLine,
      ].join('\n');
    }

    const items = HOTBAR_ORDER
      .filter((ingredientId) => this.hasItem(ingredientId))
      .map((ingredientId) => `${this.toTitleCase(INGREDIENT_LABELS[ingredientId])} x${this.countItem(ingredientId)}`);

    const inventoryText = items.length === 0
      ? 'Inventory: Coordinate Tool'
      : `Inventory: Coordinate Tool, ${items.join(', ')}`;

    const plateText = !this.holdingPlate
      ? this.platedRecipeId
        ? `Plating Bench: ${this.getCurrentPlateRecipe()?.label ?? 'Finished Dish'} ready to carry`
        : this.plateIngredients.length > 0
          ? `Plating Bench: ${this.getActivePlateRecipe()?.label ?? 'In Progress'} (${this.formatIngredientList(this.plateIngredients)})`
          : 'Plating Bench: clean plate ready'
      : `Hands: ${this.getCurrentPlateRecipe()?.label ?? 'Finished Dish'} plate`;

    return `${inventoryText}\n${this.getCoordinateToolInventoryLine()}\n${plateText}`;
  }

  private getCoordinateToolInventoryLine(): string {
    const markerCount = this.placementMarkers.filter((marker) => marker.chapter === this.getCurrentHudChapterId()).length;
    const keyHint = this.officeChapterActive ? 'press 1' : 'press M';
    return `Coordinate Tool: ${this.placementToolActive ? 'equipped' : 'in inventory'} / ${keyHint} / markers here: ${markerCount}`;
  }

  private getOfficeTabletInventoryLine(): string {
    const state = this.officeTabletCameraFeedActive
      ? `viewing ${this.getActiveOfficeTabletCamera()?.label ?? 'no camera'}`
      : this.officeTabletHeld
        ? 'equipped'
        : 'in inventory';
    return `Tablet: ${state} / press 2 / left click opens cameras`;
  }

  private getStoryNoticeState(): { text: string; active: boolean; label: string } {
    if (this.chapterTwoActive) {
      if (this.chapterTwoDodoNightAttack) {
        return {
          text: this.chapterTwoDodoNightAttack.elapsed <= CHAPTER_TWO_POWER_OUTAGE_NOTICE_DURATION
            ? 'The power has gone out.\n\nAnimatronics have had their night mode engaged.'
            : '',
          active: this.chapterTwoDodoNightAttack.elapsed <= CHAPTER_TWO_POWER_OUTAGE_NOTICE_DURATION,
          label: 'Night Mode',
        };
      }

      if (this.chapterTwoBearRefusalTimer > 0) {
        return {
          text: 'How dare you not help me.',
          active: true,
          label: 'Teddy Bear Monster',
        };
      }

      if (this.chapterTwoBearDialogueIndex !== null) {
        return {
          text: CHAPTER_TWO_AFTERMATH_BEAR_DIALOGUE[this.chapterTwoBearDialogueIndex] ?? '',
          active: true,
          label: 'Teddy Bear Monster',
        };
      }

      if (this.chapterTwoBearChoicePending) {
        return {
          text: 'Will you help me find my eight blue teddy bears?\n\nPress Y for yes or N for no.',
          active: true,
          label: 'Teddy Bear Monster',
        };
      }

      if (this.chapterTwoPowerOutageNoticeTime > 0) {
        return {
          text: 'The power has gone out.\n\nAnimatronics have had their night mode engaged.',
          active: true,
          label: 'Night Mode',
        };
      }

      if (this.chapterTwoDodoTrailNoticeTime > 0) {
        return {
          text: 'Bird footprints lead out of the dodo room and down the hall to the power closet.',
          active: true,
          label: 'Dodo Bird',
        };
      }

      if (this.chapterTwoEggQuestNoticeTime > 0) {
        return {
          text: `Find ${this.chapterTwo.dodoPuzzle.totalEggs} dodo bird eggs.`,
          active: true,
          label: 'Dodo Bird',
        };
      }
    }

    return {
      text: this.getChapterExitNoticeText(),
      active: this.chapterExitUnlocked && !this.chapterTwoActive && !this.officeChapterActive && !this.zombieModeActive && !this.doomModeActive,
      label: 'Chapter Shift',
    };
  }

  private getHotbarSlots() {
    const coordinateToolSlot = this.getCoordinateToolHotbarSlot();

    if (this.doomModeActive) {
      return [
        coordinateToolSlot,
        {
          label: `Pistol ${this.doomWeapon === 'pistol' ? '[Active]' : ''}`.trim(),
          count: this.doomAmmo.pistol,
          filled: true,
        },
        {
          label: `Shotgun ${this.doomWeapon === 'shotgun' ? '[Active]' : ''}`.trim(),
          count: this.doomAmmo.shotgun,
          filled: this.doomWeaponsOwned.has('shotgun'),
        },
        {
          label: 'Armor',
          count: this.doomArmor,
          filled: this.doomArmor > 0,
        },
        {
          label: 'Red Key',
          count: this.doomKeys.has('red') ? 1 : 0,
          filled: this.doomKeys.has('red'),
        },
        {
          label: 'Yellow Key',
          count: this.doomKeys.has('yellow') ? 1 : 0,
          filled: this.doomKeys.has('yellow'),
        },
        {
          label: 'Blue Key',
          count: this.doomKeys.has('blue') ? 1 : 0,
          filled: this.doomKeys.has('blue'),
        },
        {
          label: 'Demons',
          count: this.doomEnemies.filter((enemy) => enemy.isActive()).length,
          filled: true,
        },
        {
          label: 'Exit',
          count: this.hasAllDoomKeys() ? 1 : 0,
          filled: this.hasAllDoomKeys(),
        },
      ].slice(0, 9);
    }

    if (this.zombieModeActive) {
      return [
        coordinateToolSlot,
        {
          label: `Pistol ${this.zombieWeapon === 'pistol' ? '[Active]' : ''}`.trim(),
          count: this.zombieAmmo.pistol,
          filled: true,
        },
        {
          label: `Shotgun ${this.zombieWeapon === 'shotgun' ? '[Active]' : ''}`.trim(),
          count: this.zombieAmmo.shotgun,
          filled: true,
        },
        {
          label: 'Scrap',
          count: this.zombieScrap,
          filled: this.zombieScrap > 0,
        },
        {
          label: this.zombieNightActive ? 'Night' : 'Day',
          count: Math.max(1, Math.ceil(this.zombiePhaseRemaining)),
          filled: true,
        },
        ...Array.from({ length: 4 }, (_, index) => {
          const id = ZOMBIE_DEFENSE_IDS[index];
          return {
            label: `${id[0].toUpperCase()}${id.slice(1)} L${this.zombieDefenseLevels.get(id) ?? 0}`,
            count: Math.max(0, Math.ceil(this.zombieDefenseHealth.get(id) ?? 0)),
            filled: (this.zombieDefenseLevels.get(id) ?? 0) > 0,
          };
        }),
      ].slice(0, 9);
    }

    if (this.chapterTwoActive) {
      return [
        coordinateToolSlot,
        {
          label: 'Eggs',
          count: this.chapterTwoEggsHeld,
          filled: this.chapterTwoEggsHeld > 0 || this.chapterTwoEggsDeposited > 0,
        },
        ...CHAPTER_TWO_KEYCARD_ORDER.map((color) => ({
          label: CHAPTER_TWO_KEYCARD_LABELS[color].replace(' Key Card', ''),
          count: this.chapterTwoKeycards.has(color) ? 1 : 0,
          filled: this.chapterTwoKeycards.has(color),
        })),
      ];
    }

    if (this.officeChapterActive) {
      return [
        coordinateToolSlot,
        this.getOfficeTabletHotbarSlot(),
        {
          label: 'Tickets',
          count: this.officeChapterTickets,
          filled: this.officeChapterTickets > 0,
        },
        ...Array.from({ length: 6 }, () => ({
          label: 'Empty',
          count: 0,
          filled: false,
        })),
      ];
    }

    const filledSlots = HOTBAR_ORDER
      .filter((ingredientId) => this.hasItem(ingredientId))
      .map((ingredientId) => ({
        label: this.toTitleCase(INGREDIENT_LABELS[ingredientId]),
        count: this.countItem(ingredientId),
        filled: true,
      }));

    const emptySlots = Array.from({ length: Math.max(0, 8 - filledSlots.length) }, () => ({
      label: 'Empty',
      count: 0,
      filled: false,
    }));

    return [coordinateToolSlot, ...filledSlots, ...emptySlots].slice(0, 9);
  }

  private getCoordinateToolHotbarSlot() {
    return {
      label: `Coordinate Tool ${this.placementToolActive ? '[Held]' : '[M]'}`,
      count: this.placementMarkers.filter((marker) => marker.chapter === this.getCurrentHudChapterId()).length,
      filled: true,
    };
  }

  private getOfficeTabletHotbarSlot() {
    const state = this.officeTabletCameraFeedActive
      ? '[Feed]'
      : this.officeTabletHeld
        ? '[Held]'
        : '[2]';
    return {
      label: `Tablet ${state}`,
      count: 1,
      filled: true,
    };
  }

  private getPromptText(locked: boolean): string {
    if (this.activeOfficeJumpscare) {
      return `${this.activeOfficeJumpscare.definition.label} jumpscare cutscene is playing.`;
    }

    if (this.placementToolActive) {
      return locked
        ? 'Coordinate Tool active. Left click drops a marker, right click deletes the latest marker, M puts the tool away.'
        : 'Click the play space to re-enter first person, then use the Coordinate Tool.';
    }

    if (this.doomModeActive) {
      const exitDistance = this.player.getPosition().distanceTo(this.doomMode.exitSwitch.interactPosition);
      if (exitDistance <= GAME_CONFIG.player.interactionRange + 0.45) {
        return this.hasAllDoomKeys()
          ? 'Press E to hit the exit switch and clear the techbase.'
          : 'The exit switch is dead until you find the red, yellow, and blue key cards.';
      }

      const container = this.getNearestDoomContainer();
      if (container) {
        if (container.lootClaimed) {
          return container.kind === 'ammo-crate'
            ? 'This ammo crate is already stripped clean.'
            : 'This key chest is already empty.';
        }

        return container.kind === 'ammo-crate'
          ? 'Press E to crack open the ammo crate and take the rounds inside.'
          : `Press E to open ${container.label.toLowerCase()}.`;
      }

      const door = this.getNearestDoomDoor();
      if (door) {
        return this.doomKeys.has(door.color)
          ? `Press E to move the ${door.label.toLowerCase()}.`
          : `The ${door.label.toLowerCase()} still needs the ${this.getDoomKeyLabel(door.color)}.`;
      }

      if (!locked) {
        return 'WASD moves, Space jumps, Shift runs, left click fires, 1/2 swap weapons, E works doors and the exit switch, F toggles the flashlight, and P opens the chapter menu.';
      }

      return this.hasAllDoomKeys()
        ? 'All key cards are in hand. Push to the blue wing and hit the exit switch.'
        : 'Search side rooms for hidden key chests and ammo crates, clear the corridors, and keep pushing deeper through the techbase.';
    }

    if (this.zombieModeActive) {
      const defense = this.getNearestZombieDefense();
      if (defense) {
        const level = this.zombieDefenseLevels.get(defense.id) ?? 0;
        const health = this.zombieDefenseHealth.get(defense.id) ?? 0;
        const maxHealth = ZOMBIE_DEFENSE_HEALTH_BY_LEVEL[level];
        if (this.zombieNightActive) {
          return `${defense.label} is locked for repairs until daylight. Hold the line.`;
        }

        if (level < 3) {
          return `Press E to upgrade ${defense.label} for ${ZOMBIE_DEFENSE_UPGRADE_COST[level]} scrap.`;
        }

        if (health < maxHealth) {
          return `Press E to repair ${defense.label} for ${ZOMBIE_DEFENSE_REPAIR_COST} scrap.`;
        }

        return `${defense.label} is fully upgraded.`;
      }

      if (!locked) {
        return 'WASD moves, Space jumps, Shift sprints, left click fires, 1/2 swap weapons, E upgrades or repairs barricades, F toggles the flashlight, and P opens the chapter menu.';
      }

      if (this.zombieNightActive) {
        return 'Left click fires. Keep the zombies off the barricades and survive until dawn.';
      }

      return 'Daylight prep window. Walk the barricades, spend scrap with E, and get ready before night falls.';
    }

    if (this.officeChapterActive) {
      if (this.officeBallPitHidden) {
        return 'Ball pit: press C to come up.';
      }

      const ventExit = this.getNearestOfficeVentExit();
      const ventLadder = this.getNearestOfficeVentLadder();
      if (this.officeVentActive) {
        return ventExit
          ? ventExit.coverPivot
            ? (ventExit.targetOpenAmount ?? 0) > 0.5
              ? `Press E to close ${ventExit.label.toLowerCase()}, or step into the open grate to drop down.`
              : `Press E to open ${ventExit.label.toLowerCase()}. Step into it after it opens to drop down.`
            : 'Press E to climb down from the ceiling vent.'
          : 'Ceiling vents: move slowly with WASD through the gray duct branches.';
      }

      if (this.officeBallPitSlide) {
        return 'Sliding into the ball pit.';
      }

      if (this.officeTabletCameraFeedActive) {
        return `${this.getActiveOfficeTabletCamera()?.label ?? 'No camera installed'}. Press a camera number to switch cameras, or left click to return to your normal view.`;
      }

      if (this.officeTabletHeld) {
        return locked
          ? 'Tablet held. Left click to open the camera feed.'
          : 'Click the play space to re-enter first person, then left click with the tablet to open the camera feed.';
      }

      const utility = this.getNearestOfficeUtilityInteractable();
      const ballPitSlide = this.getNearestOfficeBallPitSlide();
      const kitchenEntranceDoor = this.getNearestOfficeKitchenEntranceDoor();
      const kitchenGlassShelf = this.getNearestOfficeKitchenGlassShelf();
      const backstageStorageDoor = this.getNearestOfficeBackstageStorageDoor();
      const storageClosetDoor = this.getNearestOfficeStorageClosetDoor();
      const bathroomEntranceDoor = this.getNearestOfficeBathroomEntranceDoor();
      const bathroomRoomDoor = this.getNearestOfficeBathroomRoomDoor();
      const bathroomSink = this.getNearestOfficeBathroomSink();
      const bathroomStall = this.getNearestOfficeBathroomStall();
      const ticket = this.getNearestOfficeTicketPickup();
      const basketballGame = this.getNearestOfficeBasketballGame();
      const prizeWheel = this.getNearestOfficePrizeWheel();
      const foxyPlay = this.getNearestOfficeFoxyPlayButton();
      const partyPlay = this.getNearestOfficePartyPlayMachine();
      const button = this.getNearestOfficeButton();
      const door = this.getNearestOfficeDoor();

      if (ventLadder) {
        return 'Press E to climb the ladder into the ceiling vent.';
      }

      if (ballPitSlide) {
        return 'Press E to climb onto the half-pipe slide into the ball pit.';
      }

      if (this.isPlayerInOfficeBallPit()) {
        return 'Ball pit: press C to crouch under.';
      }

      if (this.officeChapterSeated) {
        return 'Press E to stand up from the office chair.';
      }

      if (this.isNearOfficeSeat()) {
        return 'Press E to sit in the office chair beside the desk.';
      }

      if (kitchenEntranceDoor) {
        return kitchenEntranceDoor.open
          ? 'Press E to close the kitchen double doors.'
          : 'Press E to open the kitchen double doors.';
      }

      if (kitchenGlassShelf) {
        return this.officeGlassHeld
          ? 'Glass already in your hand. Left click to throw it.'
          : 'Press E to pick up a glass from the kitchen shelf.';
      }

      if (utility) {
        if (utility.kind === 'power-box') {
          return this.officeChapter.utilityCloset.powerBoxOpen
            ? 'Press E to close the power box.'
            : 'Press E to open the power box and look at the wires.';
        }

        return this.officeChapter.utilityCloset.open
          ? 'Press E to close the hallway utility closet.'
          : 'Press E to open the hallway utility closet.';
      }

      if (backstageStorageDoor) {
        return backstageStorageDoor.open
          ? 'Press E to close the backstage suit storage door.'
          : 'Press E to open the backstage suit storage door.';
      }

      if (storageClosetDoor) {
        return storageClosetDoor.open
          ? 'Press E to close the cleaning storage closet.'
          : 'Press E to open the cleaning storage closet.';
      }

      if (bathroomEntranceDoor) {
        return bathroomEntranceDoor.open
          ? 'Press E to close the bathroom entrance doors.'
          : 'Press E to open the bathroom entrance doors.';
      }

      if (bathroomRoomDoor) {
        return bathroomRoomDoor.open
          ? `Press E to close the ${bathroomRoomDoor.label.toLowerCase()}.`
          : `Press E to open the ${bathroomRoomDoor.label.toLowerCase()}.`;
      }

      if (bathroomSink) {
        return bathroomSink.waterOn
          ? `Press E to turn off the water at ${bathroomSink.label.toLowerCase()}.`
          : `Press E to run the water at ${bathroomSink.label.toLowerCase()}.`;
      }

      if (bathroomStall) {
        return bathroomStall.doorOpen
          ? `Press E to close ${bathroomStall.label.toLowerCase()}.`
          : `Press E to open ${bathroomStall.label.toLowerCase()}.`;
      }

      if (ticket) {
        return 'Press E to pick up the party ticket.';
      }

      if (basketballGame) {
        if (this.officeBasketballHeld) {
          return 'Aim at either hoop and left click to shoot the basketball.';
        }

        if (this.officeChapter.isBasketballThrowActive()) {
          return 'The basketball is already bouncing back. Wait for it to return.';
        }

        return 'Press E to pick up the basketball from the party table.';
      }

      if (prizeWheel) {
        return prizeWheel.spinning
          ? `The prize wheel is clicking past prizes. It is aiming for ${prizeWheel.selectedPrize}.`
          : 'Press E to spin the prize wheel.';
      }

      if (foxyPlay) {
        return this.officeChapter.isFoxyPlayActive()
          ? 'Foxy is speaking and gesturing on his stage.'
          : "Press E on Foxy's Play to start Foxy's stage speech.";
      }

      if (partyPlay) {
        return this.officeChapter.isPartyShowActive()
          ? 'Party Play is running. The stage animatronics are performing.'
          : "Press E on the Let's Party wall button to start the stage show.";
      }

      if (button) {
        return button.buttonType === 'door'
          ? `Press E on the red button to ${this.getOfficeDoorById(button.doorId)?.open ? 'lower' : 'raise'} the ${button.doorId} office door.`
          : `Press E on the white button to flash the hall light outside the ${button.doorId} office door.`;
      }

      if (door) {
        return `${door.label} is here. Use the nearby red button to move it and the white button to flash the hall outside.`;
      }

      if (!locked) {
      return this.officeGameModeActive
        ? `${this.getOfficeModeLabel()} ${this.getOfficeGameModeConfig().label}: Night ${this.officeGameModeNight}/${OFFICE_GAME_MODE_TOTAL_NIGHTS}, ${this.getOfficeGameModeClockLabel()}, power ${Math.ceil(this.officeGameModePower)}%. M opens the mode menu, 2 equips the tablet, F toggles the flashlight.`
        : 'WASD moves, Space jumps, Shift sprints, E uses objects, 1 equips the Coordinate Tool, 2 equips the tablet, M opens the mode menu, F toggles the flashlight, and P opens the chapter menu.';
      }

      return 'The office is quiet for now. Press 2 to hold the tablet, then left click to view the security cameras.';
    }

    if (this.chapterTwoActive) {
      if (this.chapterTwoClimb) {
        return 'You are climbing up the little playground stairs.';
      }

      if (this.chapterTwoSlide) {
        return 'You are sliding down the little playground slide.';
      }

      if (this.chapterTwoBearDialogueIndex !== null) {
        return this.chapterTwoBearDialogueIndex >= CHAPTER_TWO_AFTERMATH_BEAR_DIALOGUE.length - 1
          ? 'Press E to finish talking.'
          : 'Press E to continue talking.';
      }

      if (this.chapterTwoBearChoicePending) {
        return 'Press Y to help the teddy bear monster or N to refuse.';
      }

      const occupiedSeat = this.getChapterTwoSeatById(this.chapterTwoSeatId);
      if (occupiedSeat) {
        return occupiedSeat.kind === 'rocker'
          ? 'Press E to get off the rocking horse.'
          : occupiedSeat.kind === 'swing'
            ? 'Hold W to swing, and press E to get off the swing set.'
          : occupiedSeat.kind === 'couch'
            ? 'Press E to stand up from the couch.'
            : 'Press E to stand up from the waiting chair.';
      }

      if (this.getNearestChapterTwoAftermathBear()) {
        if (!this.chapterTwoBearDialogueComplete) {
          return 'E to talk to teddy bear monster';
        }

        if (this.chapterTwoKeycards.has('yellow')) {
          return 'The teddy bear monster already gave you the yellow key card.';
        }

        return this.chapterTwoBlueBearsHeld > 0
          ? 'Press E to give a teddy bear'
          : `The teddy bear monster still needs ${CHAPTER_TWO_BLUE_BEAR_TOTAL - this.chapterTwoBlueBearsReturned} more blue teddy bears.`;
      }

      const readable = this.getNearestChapterTwoReadable();
      if (readable) {
        return `Press E to read the ${readable.label.toLowerCase()}.`;
      }

      const blueBear = this.getNearestChapterTwoBlueBear();
      if (blueBear) {
        return 'Press E to pick up the blue teddy bear.';
      }

      const utilityCloset = this.getNearestChapterTwoUtilityCloset();
      if (utilityCloset) {
        return utilityCloset.open
          ? 'Press E to close the round wall closet over the power box.'
          : 'Press E to open the round wall closet built into the hallway wall.';
      }

      const egg = this.getNearestChapterTwoEgg();
      if (egg) {
        return 'Press E to pick up the hidden egg.';
      }

      const puzzlePiece = this.getNearestChapterTwoPuzzlePiece();
      if (puzzlePiece) {
        return 'Press E to pick up the small red puzzle piece.';
      }

      const stairs = this.getNearestChapterTwoStairs();
      if (stairs) {
        return 'Press D to climb the little playground stairs.';
      }

      const slide = this.getNearestChapterTwoSlide();
      if (slide) {
        return 'Press E to slide down the little playground slide.';
      }

      const seat = this.getNearestChapterTwoSeat();
      if (seat) {
        return seat.kind === 'rocker'
          ? 'Press E to climb onto the rocking horse.'
          : seat.kind === 'swing'
            ? 'Press E to swing on the swing set.'
            : seat.kind === 'couch'
              ? 'Press E to sit on the couch.'
              : 'Press E to sit in the waiting chair.';
      }

      if (this.isNearChapterTwoPuzzleBoard()) {
        if (this.chapterTwoRedPuzzleSolved) {
          return 'The red puzzle is complete. The matching red doors will respond now.';
        }

        return this.chapterTwoPuzzlePiecesCollected < ENTRY_PUZZLE_PIECE_TOTAL
          ? `The puzzle table still needs ${ENTRY_PUZZLE_PIECE_TOTAL - this.chapterTwoPuzzlePiecesCollected} more red pieces.`
          : 'Press E at the puzzle table to complete the red key card.';
      }

      const keycard = this.getNearestChapterTwoKeycard();
      if (keycard) {
        return `Press E to take the ${keycard.label}.`;
      }

      if (this.isNearChapterTwoDodoPuzzle()) {
        const eggTotal = this.chapterTwo.dodoPuzzle.totalEggs;
        if (!this.chapterTwoEggQuestStarted && !CHAPTER_TWO_STARTS_WITH_ALL_DODO_EGGS) {
          return 'Press E to start the dodo egg hunt.';
        }

        if (this.chapterTwoEggsDeposited >= eggTotal) {
          return this.chapterTwoKeycards.has('blue')
            ? 'The dodo is full and the blue card is already yours.'
            : 'The dodo is full. The blue key card has dropped beside it.';
        }

        return this.chapterTwoEggsHeld > 0
          ? 'Press E to feed an egg to the dodo bird.'
          : `The dodo still needs ${eggTotal - this.chapterTwoEggsDeposited} more eggs.`;
      }

      const coffeeMachine = this.getNearestChapterTwoCoffeeMachine();
      if (coffeeMachine) {
        return this.chapterTwoCoffeeJob
          ? 'The coffee machine is brewing. Give it a few seconds to finish the cup.'
          : 'Press E to brew a coffee from the lobby machine.';
      }

      const door = this.getNearestChapterTwoDoor();
      if (door) {
        if (!this.chapterTwoKeycards.has(door.color)) {
          return `${CHAPTER_TWO_KEYCARD_LABELS[door.color]} is required to move this door.`;
        }

        return door.open
          ? `Press E to swipe the ${CHAPTER_TWO_KEYCARD_LABELS[door.color]} again and lower the door.`
          : `Press E to swipe the ${CHAPTER_TWO_KEYCARD_LABELS[door.color]} and raise the door.`;
      }

      if (this.activeCoffeeDrink) {
        return 'The coffee cup is up. Finish the drink.';
      }

      if (this.hasItem('coffee')) {
        return this.coffeeBoostRemaining > 0
          ? `Coffee rush is active for ${Math.max(1, Math.ceil(this.coffeeBoostRemaining))} more seconds.`
          : 'Press C to drink the coffee in your inventory.';
      }

      return locked
        ? this.chapterTwoPowerOutageTriggered
          ? 'The lights are out. Use your flashlight and keep moving through the daycare.'
          : this.chapterTwoDodoTrailActive
            ? 'Bird footprints lead from the dodo room to the power closet. Follow them.'
            : CHAPTER_TWO_STARTS_WITH_RED_KEYCARD
          ? this.chapterTwoKeycards.has('blue')
            ? this.chapterTwoBearDialogueComplete
              ? this.chapterTwoKeycards.has('yellow')
                ? 'Red, blue, and yellow access are live. Keep pushing into the deeper chained color wings.'
                : this.chapterTwoBearChoicePending
                  ? 'Blue access is live. Decide whether you will help the teddy bear monster.'
                  : CHAPTER_TWO_STARTS_WITH_ALL_BLUE_BEARS
                    ? 'Blue access is live. You already have all eight blue teddy bears. Bring them back to the teddy bear monster for the yellow key card.'
                    : 'Blue access is live. Find the eight missing blue teddy bears, then bring them back to the teddy bear monster for the yellow key card.'
              : 'Blue access is live. Go back to the broken fish tank and talk to the teddy bear monster.'
            : this.chapterTwoEggQuestStarted || CHAPTER_TWO_STARTS_WITH_ALL_DODO_EGGS
              ? 'Red access is already live. Search the red wing, find the hidden eggs, and feed them to the dodo to reveal the blue key card.'
              : 'Red access is already live. Find the dodo first to start the egg hunt.'
            : 'Search the opening rooms for red puzzle pieces first. Once the red card is rebuilt, push deeper for the later colors.'
        : 'Click the play space to keep exploring the locked daycare wing in first person.';
    }

    if (!locked) {
      return 'WASD moves, Space jumps, Shift sprints, E grabs ingredients and works the machines, D drops a carried dish on the judges belt, F toggles the flashlight, and clicking the play space drops you straight back into first person.';
    }

    if (this.activeJumpscare) {
      return 'A creature slams into view. Hold steady until the hit clears, then move before its cooldown ends.';
    }

    if (this.monsterState.threat > 0.55 && !this.isPlayerSafe()) {
      return 'Static is spiking. Break line of sight and get back through the kitchen doors if you need cover.';
    }

    if (this.submittedRecipes.size === 0 && this.hasAllStartingDishSupplies()) {
      return 'You are already stocked for both rolls. Press E at the plating bench to start building them.';
    }

    if (this.submittedRecipes.size === RECIPES.length) {
      return this.isNearChapterExit()
        ? 'Press E at the seaweed-side door to leave this chapter.'
        : 'Everything is submitted. The exit is near the seaweed room in the maze.';
    }

    if (this.holdingPlate && this.platedRecipeId) {
      const recipe = this.getCurrentPlateRecipe();
      const station = this.getNearestStation();
      return station?.id === 'submission'
        ? `Press D to drop ${recipe?.label ?? 'the plated dish'} onto the judges belt.`
        : `Carry ${recipe?.label ?? 'the plated dish'} to the judges belt and press D to drop it.`;
    }

    if (this.platedRecipeId && !this.holdingPlate) {
      return `Press E at the plating bench to pick up ${this.getCurrentPlateRecipe()?.label ?? 'the finished dish'}.`;
    }

    const ingredient = this.getNearestIngredient();
    if (ingredient) {
      return this.getIngredientPrompt(ingredient);
    }

    const station = this.getNearestStation();
    if (station) {
      return this.getStationPrompt(station.id);
    }

    if (this.plateIngredients.length > 0 && !this.platedRecipeId) {
      const recipe = this.getActivePlateRecipe();
      const remaining = recipe
        ? recipe.ingredients.filter((ingredientId) => !this.plateIngredients.includes(ingredientId))
        : [];
      return remaining.length > 0
        ? `${recipe?.label ?? 'The dish'} is building on the plating bench. You still need ${this.formatIngredientList(remaining)}.`
        : 'Everything is on the plating bench. The meal will finish automatically when the last ingredient lands.';
    }

    return 'The maze hides raw ingredients. Bring them back to the station and run them through the marked machines.';
  }

  private getActionPromptText(locked: boolean, promptText: string): string {
    if (!locked || this.chapterMenuOpen || !this.chapterTwoActive) {
      return '';
    }

    const chapterTwoPopupPrompts = [
      'E to talk to teddy bear monster',
      'Press E to continue talking.',
      'Press E to finish talking.',
      'Press E to give a teddy bear',
      'Press E to start the dodo egg hunt.',
      'Press E to feed an egg to the dodo bird.',
    ];

    return chapterTwoPopupPrompts.includes(promptText) ? promptText : '';
  }

  private getStatusText(): string {
    if (this.chapterTwoClimb) {
      return 'You are climbing the little playground stairs.';
    }

    if (this.chapterTwoSlide) {
      return 'You are sliding down the little playground slide.';
    }

    if (this.chapterTwoActive && this.chapterTwoBearRefusalTimer > 0) {
      return 'The teddy bear monster lunges at you for refusing.';
    }

    if (this.chapterTwoActive && this.chapterTwoBearChoicePending) {
      return 'The teddy bear monster is waiting for your answer. Press Y to help or N to refuse.';
    }

    if (this.chapterTwoActive && this.chapterTwoBearDialogueIndex !== null) {
      return CHAPTER_TWO_AFTERMATH_BEAR_DIALOGUE[this.chapterTwoBearDialogueIndex] ?? '';
    }

    if (this.activeOfficeJumpscare) {
      return `${this.activeOfficeJumpscare.definition.label} is playing as a full jumpscare cutscene.`;
    }

    if (this.officeChapterActive && this.officeBallPitHidden) {
      return 'Under the ball pit. Press C to come up.';
    }

    if (this.officeChapterActive && this.officeTabletCameraFeedActive) {
      return `Tablet camera feed active. ${this.getActiveOfficeTabletCamera()?.label ?? 'No camera installed'}. Press a camera number to switch, or left click to return.`;
    }

    if (this.officeChapterActive && this.officeTabletHeld) {
      return 'Tablet equipped. Left click to open the Chapter 3 camera list.';
    }

    if (this.officeChapterActive && this.officeGlassHeld) {
      return 'Glass equipped. Left click to throw it and make it crash.';
    }

    if (this.transientStatusTime > 0) {
      return this.transientStatus;
    }

    if (this.placementToolActive) {
      const markerCount = this.placementMarkers.filter((marker) => marker.chapter === this.getCurrentHudChapterId()).length;
      return `Coordinate Tool equipped. Markers in this area: ${markerCount}. Aim at a surface and left click to place the next marker.`;
    }

    if (this.officeChapterActive && this.isPlayerInOfficeBallPit()) {
      return 'Ball pit. Press C to crouch under the balls.';
    }

    if (this.doomModeActive) {
      const enemiesLeft = this.doomEnemies.filter((enemy) => enemy.isActive()).length;
      const container = this.getNearestDoomContainer();
      if (container) {
        return container.lootClaimed
          ? `${container.label} stands open and empty.`
          : container.kind === 'ammo-crate'
            ? `${container.label} looks sealed. There should be rounds inside.`
            : `${container.label} is shut tight. The key card might be inside.`;
      }

      const door = this.getNearestDoomDoor();
      if (door) {
        return this.doomKeys.has(door.color)
          ? `${door.label} is ready to move.`
          : `${door.label} is locked. You still need the ${this.getDoomKeyLabel(door.color)}.`;
      }

      if (this.player.getPosition().distanceTo(this.doomMode.exitSwitch.interactPosition) <= GAME_CONFIG.player.interactionRange + 0.45) {
        return this.hasAllDoomKeys()
          ? 'The exit switch is live. Hit it and clear the run.'
          : 'The switch is here, but it will not power up until every key card is in your hands.';
      }

      return enemiesLeft > 0
        ? `${enemiesLeft} demons are still active in the techbase.`
        : this.hasAllDoomKeys()
          ? 'The halls are clear and every key card is in hand. Get to the exit switch.'
          : 'The base is quiet for a second. Keep pushing for the next key chest.';
    }

    if (this.zombieModeActive) {
      if (this.zombieNightActive) {
        const liveZombies = this.zombieControllers.filter((zombie) => zombie.isActive()).length;
        return liveZombies > 0
          ? `${liveZombies} zombies are in the clearing. ${this.zombieNightSpawnRemaining} more are still coming out of the forest.`
          : 'The tree line is quiet for a second, but the night is not over yet.';
      }

      return 'Daylight holds for now. Spend scrap on the barricades before the next wave starts.';
    }

    if (this.officeChapterActive) {
      const ventExit = this.getNearestOfficeVentExit();
      const ventLadder = this.getNearestOfficeVentLadder();
      const ballPitSlide = this.getNearestOfficeBallPitSlide();
      const utility = this.getNearestOfficeUtilityInteractable();
      const kitchenEntranceDoor = this.getNearestOfficeKitchenEntranceDoor();
      const kitchenGlassShelf = this.getNearestOfficeKitchenGlassShelf();
      const backstageStorageDoor = this.getNearestOfficeBackstageStorageDoor();
      const storageClosetDoor = this.getNearestOfficeStorageClosetDoor();
      const bathroomEntranceDoor = this.getNearestOfficeBathroomEntranceDoor();
      const bathroomRoomDoor = this.getNearestOfficeBathroomRoomDoor();
      const bathroomSink = this.getNearestOfficeBathroomSink();
      const bathroomStall = this.getNearestOfficeBathroomStall();
      const ticket = this.getNearestOfficeTicketPickup();
      const basketballGame = this.getNearestOfficeBasketballGame();
      const prizeWheel = this.getNearestOfficePrizeWheel();
      const foxyPlay = this.getNearestOfficeFoxyPlayButton();
      const partyPlay = this.getNearestOfficePartyPlayMachine();
      const button = this.getNearestOfficeButton();
      const door = this.getNearestOfficeDoor();
      if (this.officeChapterSeated) {
        return 'You are sitting at the office chair beside the desk.';
      }

      if (this.officeBallPitSlide) {
        return 'You are sliding down the half-pipe into the ball pit.';
      }

      if (this.isNearOfficeSeat()) {
        return 'The office chair is right here beside the desk.';
      }

      if (this.officeVentActive) {
        return ventExit
          ? ventExit.coverPivot
            ? (ventExit.targetOpenAmount ?? 0) > 0.5
              ? `${ventExit.label} is open. Press E to close it, or step onto the opening to drop down.`
              : `${ventExit.label} is closed. Press E to open it first.`
            : 'The ladder hatch is under you. Press E to climb back down.'
          : 'You are inside the ceiling vents. The branches link at gray junctions instead of crossing over each other.';
      }

      if (ventLadder) {
        return 'A ladder leads up to a ceiling vent. Press E to climb into it.';
      }

      if (ballPitSlide) {
        return 'A short staircase leads up to a half-pipe slide into the ball pit. Press E to slide down.';
      }

      if (kitchenEntranceDoor) {
        return kitchenEntranceDoor.open
          ? 'The kitchen double doors are open. Steam rolls out from the kitchen.'
          : 'The kitchen double doors are closed. Press E to push into the steamed-up kitchen.';
      }

      if (kitchenGlassShelf) {
        return this.officeGlassHeld
          ? 'A glass is in your hand. Left click to throw it and shatter it.'
          : `${kitchenGlassShelf.label} has cups and glasses. Press E to pick one up.`;
      }

      if (utility) {
        return utility.kind === 'power-box'
          ? this.officeChapter.utilityCloset.powerBoxOpen
            ? 'The power box is open. Wires and breakers are exposed inside.'
            : 'The power box is shut inside the open utility closet.'
          : this.officeChapter.utilityCloset.open
            ? 'The hallway utility closet is open. The power box is mounted inside it.'
            : 'The hallway utility closet is shut against the wall.';
      }

      if (backstageStorageDoor) {
        return backstageStorageDoor.open
          ? 'The backstage suit storage door is open. Press E to close it.'
          : 'The backstage suit storage door is closed. Press E to open it.';
      }

      if (storageClosetDoor) {
        return storageClosetDoor.open
          ? 'The cleaning storage closet is open. Pipes are dripping over the supplies inside.'
          : 'The cleaning storage closet is closed. Press E to open it.';
      }

      if (bathroomEntranceDoor) {
        return bathroomEntranceDoor.open
          ? 'The wide bathroom entrance doors are open. Press E to close them.'
          : 'The wide bathroom entrance doors are closed. Press E to open them.';
      }

      if (bathroomRoomDoor) {
        return bathroomRoomDoor.open
          ? `${bathroomRoomDoor.label} is open. Press E to close it.`
          : `${bathroomRoomDoor.label} is closed. Press E to open it.`;
      }

      if (bathroomSink) {
        return bathroomSink.waterOn
          ? `Water is running at ${bathroomSink.label.toLowerCase()}. Press E to shut it off.`
          : `${bathroomSink.label} are ready. Press E to turn on the water.`;
      }

      if (bathroomStall) {
        return bathroomStall.doorOpen
          ? `${bathroomStall.label} is open. Press E to swing the stall door closed.`
          : `${bathroomStall.label} is closed. Press E to swing the stall door open.`;
      }

      if (ticket) {
        return 'A little party ticket is hidden here. It can pay for the basketball game.';
      }

      if (basketballGame) {
        return this.officeBasketballHeld
          ? 'You have the basketball in your hand. Aim at a hoop and left click to shoot.'
          : 'The basketball is sitting on the Fox room party table. A made shot earns a ticket.';
      }

      if (prizeWheel) {
        return prizeWheel.spinning
          ? `The Spin For A Prize wheel is slowing down toward ${prizeWheel.selectedPrize}.`
          : 'A Spin For A Prize wheel is mounted above the prize desk. Press E to spin it.';
      }

      if (foxyPlay) {
        return this.officeChapter.isFoxyPlayActive()
          ? 'The Foxy stage curtains are open while Foxy gives his pirate greeting.'
          : "Foxy's Play is a red wall button for the pirate fox stage.";
      }

      if (partyPlay) {
        return this.officeChapter.isPartyShowActive()
          ? "The Let's Party wall button is lit while Quacky, Fluffle, and Bori perform on the stage."
          : "The Let's Party red button is mounted on the wall.";
      }

      if (button) {
        return button.buttonType === 'door'
          ? `${this.getOfficeDoorById(button.doorId)?.label ?? 'The office door'} will move on the red button.`
          : `The white button will flash the hall outside the ${button.doorId} office door.`;
      }

      if (door) {
        return door.open
          ? `${door.label} is raised up out of the way.`
          : `${door.label} is shut and ready to lift straight up.`;
      }

      return this.officeGameModeActive
        ? `Game Mode is live. Power ${Math.ceil(this.officeGameModePower)}%. Closed doors and cameras drain power; lights can scare animatronics away from the door windows.`
        : 'The office is set up: a compact room, twin monitors on the desk, side windows into the halls, red and white control buttons beside each heavy door, and a party room beyond the hallways. Press M to choose a Chapter 3 mode.';
    }

    if (this.activeJumpscare) {
      return `${this.getMonsterLabel(this.activeJumpscare.variant)} tears into you. It cannot trigger another jumpscare for three seconds, but it is still in the maze with you.`;
    }

    if (this.monsterState.threat > 0.72 && !this.isPlayerSafe()) {
      return 'Red light is circling in the pantry. Static and wet seaweed dragging are right on top of you.';
    }

    if (this.monsterState.threat > 0.35 && !this.isPlayerSafe()) {
      return 'Something is closing through the maze lanes. The kitchen side of the double doors is still safe.';
    }

    if (this.submittedRecipes.size === 0 && this.hasAllStartingDishSupplies()) {
      return 'All of the dish ingredients are already in your inventory. The plating bench is ready when you are.';
    }

    if (this.chapterTwoActive) {
      const occupiedSeat = this.getChapterTwoSeatById(this.chapterTwoSeatId);
      if (occupiedSeat) {
        return occupiedSeat.kind === 'rocker'
          ? 'The rocking horse creaks under your weight. Press E to climb back off.'
          : occupiedSeat.kind === 'swing'
            ? 'The swing set sways under you. Hold W to build the swing, and press E to climb back off.'
          : occupiedSeat.kind === 'couch'
            ? 'You are sitting on the couch. Press E to stand back up.'
            : 'You are sitting in the daycare waiting area. Press E to stand back up.';
      }

      if (this.getNearestChapterTwoAftermathBear()) {
        return this.chapterTwoBearDialogueComplete
          ? this.chapterTwoKeycards.has('yellow')
            ? 'The teddy bear monster stays by the broken fish tank. You found every blue teddy bear, and the yellow key card is yours now.'
            : this.chapterTwoBearChoicePending
              ? 'The teddy bear monster is still by the broken fish tank, waiting to hear yes or no.'
              : `The teddy bear monster waits by the broken fish tank for its missing blue teddy bears. ${this.chapterTwoBlueBearsReturned}/${CHAPTER_TWO_BLUE_BEAR_TOTAL} are back so far, and ${this.chapterTwoBlueBearsHeld} are still in your hands.`
          : 'The teddy bear monster is still by the broken fish tank, staring at you.';
      }

      const readable = this.getNearestChapterTwoReadable();
      if (readable) {
        return `${readable.label} is spread across the sign-in desk.`;
      }

      const blueBear = this.getNearestChapterTwoBlueBear();
      if (blueBear) {
        return 'One of the missing blue teddy bears is hidden here.';
      }

      const utilityCloset = this.getNearestChapterTwoUtilityCloset();
      if (utilityCloset) {
        return utilityCloset.open
          ? 'The round wall closet is open. A big gray power box and its red and blue wires are exposed inside.'
          : 'A round closet is built into the hallway wall here.';
      }

      const egg = this.getNearestChapterTwoEgg();
      if (egg) {
        return 'One of the hidden eggs is tucked in here.';
      }

      const puzzlePiece = this.getNearestChapterTwoPuzzlePiece();
      if (puzzlePiece) {
        return 'A small red puzzle piece is tucked away here.';
      }

      const stairs = this.getNearestChapterTwoStairs();
      if (stairs) {
        return 'The little playground stairs are right here.';
      }

      const slide = this.getNearestChapterTwoSlide();
      if (slide) {
        return 'You are at the top of the little playground slide.';
      }

      const seat = this.getNearestChapterTwoSeat();
      if (seat) {
        return seat.kind === 'rocker'
          ? 'The rocking horse is still and waiting.'
          : seat.kind === 'swing'
            ? 'The swing set is right here.'
          : seat.kind === 'couch'
            ? 'One of the couches is open here.'
            : 'One of the waiting chairs is open here.';
      }

      if (this.isNearChapterTwoPuzzleBoard()) {
        if (this.chapterTwoRedPuzzleSolved) {
          return 'The right playroom puzzle table is complete. Red access is unlocked.';
        }

        return this.chapterTwoPuzzlePiecesCollected < ENTRY_PUZZLE_PIECE_TOTAL
          ? `The puzzle table is assembling the red key card. ${this.chapterTwoPuzzlePiecesCollected}/${ENTRY_PUZZLE_PIECE_TOTAL} pieces are in place.`
          : 'Every red puzzle piece is here. Use the table to complete the red key card.';
      }

      const keycard = this.getNearestChapterTwoKeycard();
      if (keycard) {
        return `${keycard.label} is here. Pick it up and keep moving.`;
      }

      if (this.isNearChapterTwoDodoPuzzle()) {
        const eggTotal = this.chapterTwo.dodoPuzzle.totalEggs;
        if (!this.chapterTwoEggQuestStarted && !CHAPTER_TWO_STARTS_WITH_ALL_DODO_EGGS) {
          return 'The dodo keeps staring upward. Press E and it will start the egg hunt.';
        }

        if (this.chapterTwoEggsDeposited >= eggTotal) {
          return this.chapterTwoKeycards.has('blue')
            ? 'The dodo is stuffed and the blue key card is already in your inventory.'
            : 'The dodo has swallowed every egg. The blue key card is right beside it now.';
        }

        return this.chapterTwoEggsHeld > 0
          ? `The dodo is waiting with its mouth open. You can still feed it ${this.chapterTwoEggsHeld} egg${this.chapterTwoEggsHeld === 1 ? '' : 's'}.`
          : `The dodo keeps craning at the ceiling. It still wants ${eggTotal - this.chapterTwoEggsDeposited} more eggs.`;
      }

      const coffeeMachine = this.getNearestChapterTwoCoffeeMachine();
      if (coffeeMachine) {
        return this.chapterTwoCoffeeJob
          ? 'The coffee machine is whirring and water is filling the cup now.'
          : 'The lobby coffee machine is stocked and ready.';
      }

      if (this.activeCoffeeDrink) {
        return 'You are drinking the coffee now.';
      }

      if (this.coffeeBoostRemaining > 0) {
        return `The caffeine rush keeps your stamina maxed for ${Math.max(1, Math.ceil(this.coffeeBoostRemaining))} more seconds.`;
      }

      if (this.hasItem('coffee')) {
        return 'There is a fresh coffee in your inventory. Press C to drink it.';
      }

      const door = this.getNearestChapterTwoDoor();
      if (door) {
        if (!this.chapterTwoKeycards.has(door.color)) {
          return `${door.label} is down. You still need the ${CHAPTER_TWO_KEYCARD_LABELS[door.color]}.`;
        }

        return door.open
          ? `${door.label} is raised. Swipe the reader again if you want it to come back down.`
          : `${door.label} is waiting for the ${CHAPTER_TWO_KEYCARD_LABELS[door.color]}.`;
      }

      return this.chapterTwoKeycards.has('blue')
        ? this.chapterTwoPowerOutageTriggered
          ? 'The power is dead. The daycare is dark now, and the flashlight is the only clean way to keep going.'
          : this.chapterTwoDodoTrailActive
            ? 'Bird footprints leave the dodo room and head for the power closet. The dodo is not where it used to be.'
            : this.chapterTwoBearDialogueComplete
          ? this.chapterTwoKeycards.has('yellow')
            ? 'The bear has its blue teddy bears back, and the yellow key card is in your hands. Keep pushing deeper into the daycare.'
            : CHAPTER_TWO_STARTS_WITH_ALL_BLUE_BEARS
              ? 'Blue access is live. You already have the blue teddy bears. Bring them back to the teddy bear monster for the yellow key card.'
              : 'Blue access is live. Eight missing blue teddy bears are hidden around the daycare, and the teddy bear monster wants them back for the yellow key card.'
          : 'Blue access is live. The broken fish tank and the teddy bear monster are back in the lobby now.'
        : this.chapterTwoRedPuzzleSolved
          ? 'The red wing is full of toys and hidden eggs. Feed every egg to the dodo to make the blue key card appear.'
        : 'The opening rooms hide the red key-card puzzle pieces. Rebuild that first card before the deeper halls open.';
    }

    if (this.submittedRecipes.size === RECIPES.length) {
      return this.isNearChapterExit()
        ? 'The seaweed-side door is right here. Press E to leave and move into chapter two.'
        : 'The last plate is gone. Somewhere near the seaweed room, a way out is waiting.';
    }

    if (this.holdingPlate && this.platedRecipeId) {
      return `${this.getCurrentPlateRecipe()?.label ?? 'The dish'} is in your hands. Take it to the judges belt and press D to drop it.`;
    }

    if (this.platedRecipeId && !this.holdingPlate) {
      return `${this.getCurrentPlateRecipe()?.label ?? 'The dish'} is finished on the plating bench. Pick it up and carry it to the judges belt.`;
    }

    if (this.plateIngredients.length > 0 && !this.platedRecipeId) {
      const recipe = this.getActivePlateRecipe();
      const remaining = recipe
        ? recipe.ingredients.filter((ingredientId) => !this.plateIngredients.includes(ingredientId))
        : [];
      return remaining.length > 0
        ? `${recipe?.label ?? 'The dish'} is building on the plating bench. It still needs ${this.formatIngredientList(remaining)}.`
        : 'Everything is on the plating bench. The dish is about to resolve into its final plate.';
    }

    const station = this.getNearestStation();
    if (station) {
      return this.getStationStatus(station.id);
    }

    const ingredient = this.getNearestIngredient();
    if (ingredient) {
      return this.getIngredientNearbyText(ingredient);
    }

    const position = this.player.getPosition();
    if (position.z > this.level.pantryEntrancePosition.z + 0.8) {
      return 'You are back in the kitchen. The pantry creatures break off and leave you alone on this side of the doors.';
    }

    return 'Search the maze rooms for raw ingredients, then bring everything back to the machine line.';
  }

  private getNearestIngredient(): IngredientPickup | null {
    const playerPosition = this.player.getPosition();
    let closest: IngredientPickup | null = null;
    let closestDistance = Infinity;

    for (const ingredient of this.level.ingredients) {
      if (ingredient.collected) {
        continue;
      }

      const distance = playerPosition.distanceTo(ingredient.position);
      if (distance > GAME_CONFIG.player.interactionRange || distance >= closestDistance) {
        continue;
      }

      closest = ingredient;
      closestDistance = distance;
    }

    return closest;
  }

  private getNearestChapterTwoKeycard(): ChapterTwoKeycardPickup | null {
    const playerPosition = this.player.getPosition();
    let closest: ChapterTwoKeycardPickup | null = null;
    let closestDistance = Infinity;

    for (const keycard of this.chapterTwo.keycards) {
      if (keycard.collected || !keycard.root.visible) {
        continue;
      }

      const distance = playerPosition.distanceTo(keycard.position);
      if (distance > GAME_CONFIG.player.interactionRange + 0.3 || distance >= closestDistance) {
        continue;
      }

      closest = keycard;
      closestDistance = distance;
    }

    return closest;
  }

  private getChapterTwoEggsFoundTotal(): number {
    return this.chapterTwoEggsHeld + this.chapterTwoEggsDeposited;
  }

  private startChapterTwoEggQuest(): void {
    if (this.chapterTwoEggQuestStarted) {
      return;
    }

    this.chapterTwoEggQuestStarted = true;
    this.chapterTwoEggQuestNoticeTime = 4.2;
    this.chapterTwo.eggPickups.forEach((egg) => {
      if (!egg.collected) {
        egg.root.visible = true;
      }
    });
    this.pushStatus(
      `Find ${this.chapterTwo.dodoPuzzle.totalEggs} dodo bird eggs.`,
      4.2,
    );
  }

  private getChapterTwoBlueBearsFoundTotal(): number {
    return this.chapterTwoBlueBearsHeld + this.chapterTwoBlueBearsReturned;
  }

  private startChapterTwoDodoTrail(): void {
    if (this.chapterTwoDodoTrailActive) {
      return;
    }

    this.chapterTwoDodoTrailActive = true;
    this.chapterTwoDodoTrailNoticeTime = CHAPTER_TWO_DODO_TRAIL_NOTICE_DURATION;
    this.chapterTwo.setDodoTrailState(true);
    this.powerEventAudio.resume();
    this.powerEventAudio.playZap();
  }

  private triggerChapterTwoPowerOutage(): void {
    if (this.chapterTwoPowerOutageTriggered) {
      return;
    }

    this.chapterTwoPowerOutageTriggered = true;
    this.chapterTwoPowerOutageNoticeTime = CHAPTER_TWO_POWER_OUTAGE_NOTICE_DURATION;
    this.chapterTwoDodoNightAttack = { elapsed: 0, movedToNestView: false };
    this.chapterTwo.setDodoNightAttackState(0, this.player.getPosition());
    this.powerEventAudio.resume();
    this.powerEventAudio.playOutage();
    this.flashlight.setEnabled(false);
    this.pushStatus(
      'The power has gone out. Animatronics have had their night mode engaged.',
      CHAPTER_TWO_DODO_NIGHT_ATTACK_DURATION,
    );
  }

  private updateChapterTwoDodoNightAttack(deltaSeconds: number): boolean {
    if (!this.chapterTwoDodoNightAttack) {
      return false;
    }

    this.chapterTwoDodoNightAttack.elapsed = Math.min(
      CHAPTER_TWO_DODO_NIGHT_ATTACK_DURATION,
      this.chapterTwoDodoNightAttack.elapsed + deltaSeconds,
    );

    const attackProgress = MathUtils.clamp(
      (this.chapterTwoDodoNightAttack.elapsed - CHAPTER_TWO_POWER_OUTAGE_NOTICE_DURATION)
        / (CHAPTER_TWO_DODO_NIGHT_ATTACK_DURATION - CHAPTER_TWO_POWER_OUTAGE_NOTICE_DURATION),
      0,
      1,
    );
    if (
      !this.chapterTwoDodoNightAttack.movedToNestView
      && this.chapterTwoDodoNightAttack.elapsed >= CHAPTER_TWO_POWER_OUTAGE_NOTICE_DURATION
    ) {
      const viewPosition = this.chapterTwo.getDodoNightAttackViewPosition(this.chapterTwoDodoAttackViewPosition);
      if (viewPosition) {
        this.player.teleport(viewPosition);
      }
      this.chapterTwoDodoNightAttack.movedToNestView = true;
    }

    this.chapterTwo.setDodoNightAttackState(attackProgress, this.player.getPosition());

    const focus = this.chapterTwo.getDodoNightAttackFocusPosition(this.chapterTwoDodoAttackLookTarget);
    if (focus && this.chapterTwoDodoNightAttack.elapsed >= CHAPTER_TWO_POWER_OUTAGE_NOTICE_DURATION * 0.62) {
      const lookBlend = MathUtils.lerp(
        0.1,
        0.72,
        MathUtils.smoothstep(
          this.chapterTwoDodoNightAttack.elapsed,
          CHAPTER_TWO_POWER_OUTAGE_NOTICE_DURATION,
          CHAPTER_TWO_DODO_NIGHT_ATTACK_BLACKOUT_START,
        ),
      );
      this.player.lookToward(focus, lookBlend);
    }

    if (this.chapterTwoDodoNightAttack.elapsed < CHAPTER_TWO_DODO_NIGHT_ATTACK_DURATION) {
      return false;
    }

    this.finishChapterTwoDodoNightAttack();
    return true;
  }

  private finishChapterTwoDodoNightAttack(): void {
    this.chapterTwoDodoNightAttack = null;
    this.hud.setNightModeAttack(false, 0, 0);
    const wakePosition = this.chapterTwo.getDodoNightAttackWakePosition(this.chapterTwoDodoAttackWakePosition)
      ?? this.chapterTwo.spawn;
    this.chapterTwoSeatId = null;
    this.chapterTwoClimb = null;
    this.chapterTwoSlide = null;
    this.chapterTwo.setOccupiedSeat(null);
    this.player.teleport(wakePosition);
    this.player.lookToward(this.chapterTwo.spawn, 1);
    this.flashlight.setEnabled(true);
    this.pushStatus(
      'You wake up somewhere else in the dark daycare. The dodo is gone, but the night mode is still on.',
      5.2,
    );
  }

  private acceptChapterTwoBearQuest(): void {
    this.chapterTwoBearChoicePending = false;
    this.chapterTwoBearQuestAccepted = true;
    this.chapterTwo.blueBearPickups.forEach((bear) => {
      if (!bear.collected) {
        bear.root.visible = true;
      }
    });
    this.pushStatus(
      CHAPTER_TWO_STARTS_WITH_ALL_BLUE_BEARS
        ? 'The teddy bear monster nods. You already have all eight blue teddy bears with you.'
        : 'The teddy bear monster nods. Eight missing blue teddy bears are hidden around the daycare now.',
      4.8,
    );
  }

  private refuseChapterTwoBearQuest(): void {
    this.chapterTwoBearChoicePending = false;
    this.chapterTwoBearQuestAccepted = false;
    this.chapterTwoBearRefusalTimer = CHAPTER_TWO_BEAR_REFUSAL_DURATION;
    this.bearJumpScareAudio.resume();
    this.bearJumpScareAudio.playScream();
    if (this.chapterTwo.aftermathBearTalkPosition) {
      this.player.lookToward(this.chapterTwo.aftermathBearTalkPosition, 1);
    }
    this.pushStatus('How dare you not help me.', CHAPTER_TWO_BEAR_REFUSAL_DURATION);
  }

  private getNearestChapterTwoCoffeeMachine(): ChapterTwoCoffeeMachine | null {
    const distance = this.player.getPosition().distanceTo(this.chapterTwo.coffeeMachine.interactPosition);
    return distance <= GAME_CONFIG.player.interactionRange + 0.5
      ? this.chapterTwo.coffeeMachine
      : null;
  }

  private getNearestChapterTwoAftermathBear(): Vector3 | null {
    if (!this.chapterTwo.dodoPuzzle.solved || !this.chapterTwo.aftermathBearTalkPosition) {
      return null;
    }

    const distance = this.player.getPosition().distanceTo(this.chapterTwo.aftermathBearTalkPosition);
    return distance <= GAME_CONFIG.player.interactionRange + CHAPTER_TWO_BEAR_TALK_RANGE_BONUS
      ? this.chapterTwo.aftermathBearTalkPosition
      : null;
  }

  private getNearestChapterTwoUtilityCloset(): ChapterTwoLevelData['utilityCloset'] | null {
    const closet = this.chapterTwo.utilityCloset;
    const distance = this.player.getPosition().distanceTo(closet.interactPosition);
    return distance <= GAME_CONFIG.player.interactionRange + 0.6
      ? closet
      : null;
  }

  private getNearestChapterTwoSeat(): ChapterTwoSeat | null {
    const playerPosition = this.player.getPosition();
    let closest: ChapterTwoSeat | null = null;
    let closestDistance = Infinity;

    for (const seat of this.chapterTwo.seats) {
      const distance = playerPosition.distanceTo(seat.position);
      if (distance > GAME_CONFIG.player.interactionRange + 0.45 || distance >= closestDistance) {
        continue;
      }

      closest = seat;
      closestDistance = distance;
    }

    return closest;
  }

  private getNearestChapterTwoStairs(): ChapterTwoSlideInteractable | null {
    const distance = this.player.getPosition().distanceTo(this.chapterTwo.playgroundSlide.stairInteractPosition);
    return distance <= GAME_CONFIG.player.interactionRange + 0.6
      ? this.chapterTwo.playgroundSlide
      : null;
  }

  private getNearestChapterTwoSlide(): ChapterTwoSlideInteractable | null {
    const distance = this.player.getPosition().distanceTo(this.chapterTwo.playgroundSlide.topInteractPosition);
    return distance <= GAME_CONFIG.player.interactionRange + 0.55
      ? this.chapterTwo.playgroundSlide
      : null;
  }

  private getSupportedFloorHeight(): number | null {
    if (this.chapterTwoActive) {
      return this.getChapterTwoSupportedFloorHeight();
    }

    if (this.officeChapterActive) {
      return this.getOfficeChapterSupportedFloorHeight();
    }

    return null;
  }

  private getChapterTwoSupportedFloorHeight(): number | null {
    if (!this.chapterTwoActive || this.chapterTwoSeatId || this.chapterTwoClimb || this.chapterTwoSlide) {
      return null;
    }

    const playerPosition = this.player.getPosition();
    const playground = this.chapterTwo.playgroundSlide;
    if (playerPosition.y < playground.platformFloorY - 0.85) {
      return null;
    }

    const offsetX = Math.abs(playerPosition.x - playground.platformCenter.x);
    const offsetZ = Math.abs(playerPosition.z - playground.platformCenter.z);
    if (offsetX > playground.platformHalfWidth || offsetZ > playground.platformHalfDepth) {
      const slideVector = playground.slideFloorEnd.clone().sub(playground.slideFloorStart);
      const slideLengthSquared = slideVector.x * slideVector.x + slideVector.z * slideVector.z;
      if (slideLengthSquared <= 0.0001) {
        return null;
      }

      const playerOffset = playerPosition.clone().sub(playground.slideFloorStart);
      const slideProgress = MathUtils.clamp(
        (playerOffset.x * slideVector.x + playerOffset.z * slideVector.z) / slideLengthSquared,
        0,
        1,
      );
      const closestX = playground.slideFloorStart.x + slideVector.x * slideProgress;
      const closestZ = playground.slideFloorStart.z + slideVector.z * slideProgress;
      const distanceToSlide = Math.hypot(playerPosition.x - closestX, playerPosition.z - closestZ);
      if (distanceToSlide > playground.slideHalfWidth) {
        return null;
      }

      const slideFloorY = MathUtils.lerp(
        playground.slideFloorStart.y,
        playground.slideFloorEnd.y,
        slideProgress,
      );
      return playerPosition.y >= slideFloorY - 0.9
        ? slideFloorY
        : null;
    }

    return playground.platformFloorY;
  }

  private getOfficeChapterSupportedFloorHeight(): number | null {
    if (!this.officeChapterActive || this.officeChapterSeated) {
      return null;
    }

    if (this.officeVentDrop) {
      return null;
    }

    if (this.officeVentActive) {
      return this.officeChapter.ventSystem.floorY;
    }

    const playerPosition = this.player.getPosition();
    if (this.isPlayerInOfficeBallPit(playerPosition)) {
      return this.officeBallPitHidden
        ? this.officeChapter.ballPit.hiddenEyeY
        : this.officeChapter.ballPit.peekEyeY;
    }

    for (const stage of this.officeChapter.stageFloors) {
      if (playerPosition.y < stage.floorY - 0.9) {
        continue;
      }

      const offsetX = Math.abs(playerPosition.x - stage.center.x);
      const offsetZ = Math.abs(playerPosition.z - stage.center.z);
      if (offsetX <= stage.halfWidth && offsetZ <= stage.halfDepth) {
        return stage.floorY;
      }
    }

    return null;
  }

  private getChapterTwoSeatById(seatId: string | null): ChapterTwoSeat | null {
    if (!seatId) {
      return null;
    }

    return this.chapterTwo.seats.find((seat) => seat.id === seatId) ?? null;
  }

  private advanceChapterTwoBearDialogue(): void {
    if (this.chapterTwoBearDialogueIndex === null) {
      this.chapterTwoBearDialogueIndex = 0;
      return;
    }

    if (this.chapterTwoBearDialogueIndex >= CHAPTER_TWO_AFTERMATH_BEAR_DIALOGUE.length - 1) {
      this.chapterTwoBearDialogueIndex = null;
      this.chapterTwoBearDialogueComplete = true;
      this.chapterTwoBearChoicePending = true;
      this.pushStatus(
        'The teddy bear monster waits for your answer. Press Y to help or N to refuse.',
        5.4,
      );
      return;
    }

    this.chapterTwoBearDialogueIndex += 1;
  }

  private getNearestChapterTwoReadable(): ChapterTwoReadable | null {
    const playerPosition = this.player.getPosition();
    let closest: ChapterTwoReadable | null = null;
    let closestDistance = Infinity;

    for (const readable of this.chapterTwo.readables) {
      const distance = playerPosition.distanceTo(readable.position);
      if (distance > GAME_CONFIG.player.interactionRange + 0.25 || distance >= closestDistance) {
        continue;
      }

      closest = readable;
      closestDistance = distance;
    }

    return closest;
  }

  private getNearestChapterTwoBlueBear() {
    if (!this.chapterTwoBearQuestAccepted) {
      return null;
    }

    const playerPosition = this.player.getPosition();
    let closest: (typeof this.chapterTwo.blueBearPickups)[number] | null = null;
    let closestDistance = Infinity;

    for (const bear of this.chapterTwo.blueBearPickups) {
      if (bear.collected || !bear.root.visible) {
        continue;
      }

      const distance = playerPosition.distanceTo(bear.position);
      if (distance > GAME_CONFIG.player.interactionRange + 0.25 || distance >= closestDistance) {
        continue;
      }

      closest = bear;
      closestDistance = distance;
    }

    return closest;
  }

  private getNearestChapterTwoPuzzlePiece() {
    const playerPosition = this.player.getPosition();
    let closest: (typeof this.chapterTwo.puzzlePieces)[number] | null = null;
    let closestDistance = Infinity;

    for (const piece of this.chapterTwo.puzzlePieces) {
      if (piece.collected) {
        continue;
      }

      const distance = playerPosition.distanceTo(piece.position);
      if (distance > GAME_CONFIG.player.interactionRange + 0.2 || distance >= closestDistance) {
        continue;
      }

      closest = piece;
      closestDistance = distance;
    }

    return closest;
  }

  private getNearestChapterTwoEgg() {
    const playerPosition = this.player.getPosition();
    let closest: (typeof this.chapterTwo.eggPickups)[number] | null = null;
    let closestDistance = Infinity;

    for (const egg of this.chapterTwo.eggPickups) {
      if (egg.collected || !egg.root.visible) {
        continue;
      }

      const distance = playerPosition.distanceTo(egg.position);
      if (distance > GAME_CONFIG.player.interactionRange + 0.2 || distance >= closestDistance) {
        continue;
      }

      closest = egg;
      closestDistance = distance;
    }

    return closest;
  }

  private isNearChapterTwoPuzzleBoard(): boolean {
    return this.player.getPosition().distanceTo(this.chapterTwo.puzzleBoard.interactPosition)
      <= GAME_CONFIG.player.interactionRange + 0.45;
  }

  private isNearChapterTwoDodoPuzzle(): boolean {
    return this.player.getPosition().distanceTo(this.chapterTwo.dodoPuzzle.interactPosition)
      <= GAME_CONFIG.player.interactionRange + 0.55;
  }

  private getNearestChapterTwoDoor(): ChapterTwoSecurityDoor | null {
    const playerPosition = this.player.getPosition();
    let closest: ChapterTwoSecurityDoor | null = null;
    let closestDistance = Infinity;

    for (const door of this.chapterTwo.securityDoors) {
      const distance = playerPosition.distanceTo(door.interactPosition);
      if (distance > GAME_CONFIG.player.interactionRange + 0.55 || distance >= closestDistance) {
        continue;
      }

      closest = door;
      closestDistance = distance;
    }

    return closest;
  }

  private isNearOfficeSeat(): boolean {
    return this.player.getPosition().distanceTo(this.officeChapter.seat.position)
      <= GAME_CONFIG.player.interactionRange + 0.35;
  }

  private getNearestOfficeDoor(): OfficeChapterData['doors'][number] | null {
    const playerPosition = this.player.getPosition();
    let closest: OfficeChapterData['doors'][number] | null = null;
    let closestDistance = Infinity;

    for (const door of this.officeChapter.doors) {
      const distance = playerPosition.distanceTo(door.interactPosition);
      if (distance > GAME_CONFIG.player.interactionRange + 0.45 || distance >= closestDistance) {
        continue;
      }

      closest = door;
      closestDistance = distance;
    }

    return closest;
  }

  private getOfficeDoorById(doorId: 'left' | 'right'): OfficeChapterData['doors'][number] | null {
    return this.officeChapter.doors.find((door) => door.id === doorId) ?? null;
  }

  private getNearestOfficeButton(): OfficeChapterData['buttons'][number] | null {
    const playerPosition = this.player.getPosition();
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    let closest: OfficeChapterData['buttons'][number] | null = null;
    let bestLateral = Infinity;
    let bestAlong = Infinity;

    for (const button of this.officeChapter.buttons) {
      const toButton = button.interactPosition.clone().sub(playerPosition);
      const along = toButton.dot(forward);
      if (along <= 0 || along > GAME_CONFIG.player.interactionRange + 0.9) {
        continue;
      }

      const projected = forward.clone().multiplyScalar(along);
      const lateral = toButton.sub(projected).length();
      if (lateral > 0.28) {
        continue;
      }

      if (lateral > bestLateral + 0.001) {
        continue;
      }

      if (Math.abs(lateral - bestLateral) <= 0.001 && along >= bestAlong) {
        continue;
      }

      closest = button;
      bestLateral = lateral;
      bestAlong = along;
    }

    return closest;
  }

  private getNearestOfficePartyPlayMachine(): OfficeChapterData['partyPlay'] | null {
    const playerPosition = this.player.getPosition();
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const toMachine = this.officeChapter.partyPlay.interactPosition.clone().sub(playerPosition);
    const along = toMachine.dot(forward);
    if (along <= 0 || along > GAME_CONFIG.player.interactionRange + 1.0) {
      return null;
    }

    const projected = forward.clone().multiplyScalar(along);
    const lateral = toMachine.sub(projected).length();
    return lateral <= 0.42 ? this.officeChapter.partyPlay : null;
  }

  private getNearestOfficeTicketPickup(): OfficeChapterData['ticketPickups'][number] | null {
    const playerPosition = this.player.getPosition();
    let closest: OfficeChapterData['ticketPickups'][number] | null = null;
    let closestDistance = Infinity;

    for (const ticket of this.officeChapter.ticketPickups) {
      if (ticket.collected) {
        continue;
      }

      const distance = playerPosition.distanceTo(ticket.position);
      if (distance > GAME_CONFIG.player.interactionRange + 0.45 || distance >= closestDistance) {
        continue;
      }

      closest = ticket;
      closestDistance = distance;
    }

    return closest;
  }

  private getNearestOfficeBasketballGame(): OfficeChapterData['basketballGame'] | null {
    const playerPosition = this.player.getPosition();
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const toGame = this.officeChapter.basketballGame.interactPosition.clone().sub(playerPosition);
    const along = toGame.dot(forward);
    if (along <= 0 || along > GAME_CONFIG.player.interactionRange + 1.3) {
      return null;
    }

    const projected = forward.clone().multiplyScalar(along);
    const lateral = toGame.sub(projected).length();
    return lateral <= 1.15 ? this.officeChapter.basketballGame : null;
  }

  private getNearestOfficePrizeWheel(): OfficeChapterData['prizeWheel'] | null {
    const playerPosition = this.player.getPosition();
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const toWheel = this.officeChapter.prizeWheel.interactPosition.clone().sub(playerPosition);
    const along = toWheel.dot(forward);
    if (along <= 0 || along > GAME_CONFIG.player.interactionRange + 1.25) {
      return null;
    }

    const projected = forward.clone().multiplyScalar(along);
    const lateral = toWheel.sub(projected).length();
    return lateral <= 0.82 ? this.officeChapter.prizeWheel : null;
  }

  private startOfficePrizeWheelSpin(): void {
    const wheel = this.officeChapter.prizeWheel;
    if (wheel.spinning) {
      this.pushStatus('The prize wheel is already spinning.', 1.6);
      return;
    }

    const prizeIndex = Math.floor(Math.random() * wheel.prizes.length);
    const segmentAngle = Math.PI * 2 / Math.max(1, wheel.prizes.length);
    const fullTurns = 5 + Math.floor(Math.random() * 3);
    wheel.selectedPrize = wheel.prizes[prizeIndex] ?? 'Prize';
    wheel.spinTime = 0;
    wheel.spinDuration = 3.6 + Math.random() * 0.65;
    wheel.spinStartRotation = wheel.wheel.rotation.z;
    wheel.spinTargetRotation = wheel.spinStartRotation
      + fullTurns * Math.PI * 2
      + prizeIndex * segmentAngle
      + segmentAngle * 0.5;
    wheel.spinning = true;
    wheel.tickIndex = Math.floor(Math.abs(wheel.wheel.rotation.z) / segmentAngle);
    this.officePrizeWheelLastTickIndex = wheel.tickIndex;
    this.officePrizeWheelWasSpinning = true;
    this.gameplaySfxAudio.resume();
    this.gameplaySfxAudio.playPrizeWheelClick(1);
    this.pushStatus('You yank the prize wheel handle. It starts clicking and spinning.', 2.5);
  }

  private updateOfficePrizeWheelAudio(): void {
    if (!this.officeChapterActive) {
      this.officePrizeWheelWasSpinning = false;
      return;
    }

    const wheel = this.officeChapter.prizeWheel;
    if (wheel.spinning) {
      if (wheel.tickIndex !== this.officePrizeWheelLastTickIndex) {
        const intensity = MathUtils.clamp(1 - wheel.spinTime / Math.max(0.001, wheel.spinDuration), 0.18, 1);
        this.gameplaySfxAudio.playPrizeWheelClick(intensity);
        this.officePrizeWheelLastTickIndex = wheel.tickIndex;
      }
      this.officePrizeWheelWasSpinning = true;
      return;
    }

    if (!this.officePrizeWheelWasSpinning) {
      return;
    }

    this.officePrizeWheelWasSpinning = false;
    this.gameplaySfxAudio.playSmallPanel(false);
    this.pushStatus(`The prize wheel slows to a stop on: ${wheel.selectedPrize}.`, 3.2);
  }

  private getNearestOfficeFoxyPlayButton(): OfficeChapterData['foxyPlay'] | null {
    const playerPosition = this.player.getPosition();
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const toButton = this.officeChapter.foxyPlay.interactPosition.clone().sub(playerPosition);
    const along = toButton.dot(forward);
    if (along <= 0 || along > GAME_CONFIG.player.interactionRange + 1.0) {
      return null;
    }

    const projected = forward.clone().multiplyScalar(along);
    const lateral = toButton.sub(projected).length();
    return lateral <= 0.46 ? this.officeChapter.foxyPlay : null;
  }

  private getNearestOfficeBackstageStorageDoor(): OfficeChapterData['backstageStorageDoor'] | null {
    const playerPosition = this.player.getPosition();
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const toDoor = this.officeChapter.backstageStorageDoor.interactPosition.clone().sub(playerPosition);
    const along = toDoor.dot(forward);
    if (along <= 0 || along > GAME_CONFIG.player.interactionRange + 1.05) {
      return null;
    }

    const projected = forward.clone().multiplyScalar(along);
    const lateral = toDoor.sub(projected).length();
    return lateral <= 1.05 ? this.officeChapter.backstageStorageDoor : null;
  }

  private getNearestOfficeKitchenEntranceDoor(): OfficeChapterData['kitchenEntranceDoor'] | null {
    const playerPosition = this.player.getPosition();
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const toDoor = this.officeChapter.kitchenEntranceDoor.interactPosition.clone().sub(playerPosition);
    const along = toDoor.dot(forward);
    if (along <= 0 || along > GAME_CONFIG.player.interactionRange + 1.15) {
      return null;
    }

    const projected = forward.clone().multiplyScalar(along);
    const lateral = toDoor.sub(projected).length();
    return lateral <= 1.28 ? this.officeChapter.kitchenEntranceDoor : null;
  }

  private getNearestOfficeKitchenGlassShelf(): OfficeChapterData['kitchenGlassShelves'][number] | null {
    const playerPosition = this.player.getPosition();
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    let closest: OfficeChapterData['kitchenGlassShelves'][number] | null = null;
    let bestAlong = Infinity;

    for (const shelf of this.officeChapter.kitchenGlassShelves) {
      const toShelf = shelf.position.clone().sub(playerPosition);
      const along = toShelf.dot(forward);
      if (along <= 0 || along > GAME_CONFIG.player.interactionRange + 1.05) {
        continue;
      }

      const projected = forward.clone().multiplyScalar(along);
      const lateral = toShelf.sub(projected).length();
      if (lateral > 1.15 || along >= bestAlong) {
        continue;
      }

      closest = shelf;
      bestAlong = along;
    }

    return closest;
  }

  private getNearestOfficeVentLadder(): OfficeChapterData['ventSystem'] | null {
    if (this.officeVentActive) {
      return null;
    }

    const playerPosition = this.player.getPosition();
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const toLadder = this.officeChapter.ventSystem.ladderInteractPosition.clone().sub(playerPosition);
    const along = toLadder.dot(forward);
    if (along <= 0 || along > GAME_CONFIG.player.interactionRange + 1.05) {
      return null;
    }

    const projected = forward.clone().multiplyScalar(along);
    const lateral = toLadder.sub(projected).length();
    return lateral <= 0.92 ? this.officeChapter.ventSystem : null;
  }

  private getNearestOfficeVentExit(): OfficeChapterData['ventSystem']['openings'][number] | null {
    if (!this.officeVentActive) {
      return null;
    }

    const playerPosition = this.player.getPosition();
    let closest: OfficeChapterData['ventSystem']['openings'][number] | null = null;
    let closestDistance = Infinity;

    for (const opening of this.officeChapter.ventSystem.openings) {
      if (!opening.exitPosition) {
        continue;
      }

      const horizontalDistance = Math.hypot(
        playerPosition.x - opening.position.x,
        playerPosition.z - opening.position.z,
      );
      if (horizontalDistance > 1.08 || horizontalDistance >= closestDistance) {
        continue;
      }

      closest = opening;
      closestDistance = horizontalDistance;
    }

    return closest;
  }

  private constrainOfficeVentPosition(): void {
    const playerPosition = this.player.getPosition();
    const ventSystem = this.officeChapter.ventSystem;
    playerPosition.y = ventSystem.floorY;

    for (const segment of ventSystem.segments) {
      if (
        Math.abs(playerPosition.x - segment.center.x) <= segment.halfWidth - GAME_CONFIG.player.radius * 0.25
        && Math.abs(playerPosition.z - segment.center.z) <= segment.halfDepth - GAME_CONFIG.player.radius * 0.25
      ) {
        return;
      }
    }

    let bestX = ventSystem.ladderEntryPosition.x;
    let bestZ = ventSystem.ladderEntryPosition.z;
    let bestDistance = Infinity;
    for (const segment of ventSystem.segments) {
      const minX = segment.center.x - segment.halfWidth + GAME_CONFIG.player.radius * 0.25;
      const maxX = segment.center.x + segment.halfWidth - GAME_CONFIG.player.radius * 0.25;
      const minZ = segment.center.z - segment.halfDepth + GAME_CONFIG.player.radius * 0.25;
      const maxZ = segment.center.z + segment.halfDepth - GAME_CONFIG.player.radius * 0.25;
      const clampedX = MathUtils.clamp(playerPosition.x, minX, maxX);
      const clampedZ = MathUtils.clamp(playerPosition.z, minZ, maxZ);
      const distance = Math.hypot(playerPosition.x - clampedX, playerPosition.z - clampedZ);
      if (distance >= bestDistance) {
        continue;
      }

      bestDistance = distance;
      bestX = clampedX;
      bestZ = clampedZ;
    }

    playerPosition.x = bestX;
    playerPosition.z = bestZ;
  }

  private updateOfficeVentDrop(): void {
    if (!this.officeChapterActive || !this.officeVentActive || this.officeVentDrop) {
      return;
    }

    const playerPosition = this.player.getPosition();
    for (const opening of this.officeChapter.ventSystem.openings) {
      if (
        !opening.coverPivot
        || !opening.exitPosition
        || !opening.open
        || (opening.openAmount ?? 0) < OFFICE_VENT_GRATE_DROP_OPEN_AMOUNT
      ) {
        continue;
      }

      const horizontalDistance = Math.hypot(
        playerPosition.x - opening.position.x,
        playerPosition.z - opening.position.z,
      );
      if (horizontalDistance > OFFICE_VENT_GRATE_DROP_RADIUS) {
        continue;
      }

      this.startOfficeVentDrop(opening);
      return;
    }
  }

  private startOfficeVentDrop(opening: OfficeChapterData['ventSystem']['openings'][number]): void {
    if (!opening.exitPosition) {
      return;
    }

    const cameraForward = this.camera.getWorldDirection(new Vector3());
    cameraForward.y = 0;
    if (cameraForward.lengthSq() < 0.0001) {
      cameraForward.set(0, 0, 1);
    }
    cameraForward.normalize();

    const currentPosition = this.player.getPosition();
    const startPosition = new Vector3(
      opening.position.x,
      Math.max(currentPosition.y, this.officeChapter.ventSystem.floorY),
      opening.position.z,
    );
    const endPosition = opening.exitPosition.clone();

    this.officeVentActive = false;
    this.officeBallPitHidden = false;
    this.officeVentDrop = {
      elapsed: 0,
      duration: OFFICE_VENT_DROP_DURATION,
      startPosition,
      endPosition,
      lookTarget: endPosition.clone().addScaledVector(cameraForward, 3.2).add(new Vector3(0, 0.25, 0)),
      openingLabel: opening.label,
    };
    this.player.teleport(startPosition);
    this.pushStatus(`You drop through ${opening.label.toLowerCase()}.`, 1.4);
  }

  private updateOfficeVentDropAnimation(deltaSeconds: number): void {
    if (!this.officeVentDrop) {
      return;
    }

    const drop = this.officeVentDrop;
    drop.elapsed = Math.min(drop.elapsed + deltaSeconds, drop.duration);
    const rawProgress = MathUtils.clamp(drop.elapsed / drop.duration, 0, 1);
    const horizontalProgress = MathUtils.smootherstep(rawProgress, 0, 1);
    const verticalProgress = 1 - ((1 - rawProgress) * (1 - rawProgress));
    const fallPosition = drop.startPosition.clone().lerp(drop.endPosition, horizontalProgress);
    fallPosition.y = MathUtils.lerp(drop.startPosition.y, drop.endPosition.y, verticalProgress);
    this.player.teleport(fallPosition);
    this.player.lookToward(drop.lookTarget, 0.035);

    if (rawProgress < 1) {
      return;
    }

    this.officeVentDrop = null;
    this.player.teleport(drop.endPosition);
    this.player.lookToward(drop.lookTarget, 0.28);
    this.pushStatus(
      drop.openingLabel.toLowerCase().includes('floor vent')
        ? `You land below ${drop.openingLabel.toLowerCase()}.`
        : 'You land below the ceiling vent.',
      1.9,
    );
  }

  private getNearestOfficeStorageClosetDoor(): OfficeChapterData['storageClosetDoor'] | null {
    const playerPosition = this.player.getPosition();
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const toDoor = this.officeChapter.storageClosetDoor.interactPosition.clone().sub(playerPosition);
    const along = toDoor.dot(forward);
    if (along <= 0 || along > GAME_CONFIG.player.interactionRange + 1.05) {
      return null;
    }

    const projected = forward.clone().multiplyScalar(along);
    const lateral = toDoor.sub(projected).length();
    return lateral <= 1.05 ? this.officeChapter.storageClosetDoor : null;
  }

  private getNearestOfficeBathroomEntranceDoor(): OfficeChapterData['bathroomEntranceDoor'] | null {
    const playerPosition = this.player.getPosition();
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const toDoor = this.officeChapter.bathroomEntranceDoor.interactPosition.clone().sub(playerPosition);
    const along = toDoor.dot(forward);
    if (along <= 0 || along > GAME_CONFIG.player.interactionRange + 1.25) {
      return null;
    }

    const projected = forward.clone().multiplyScalar(along);
    const lateral = toDoor.sub(projected).length();
    return lateral <= 1.45 ? this.officeChapter.bathroomEntranceDoor : null;
  }

  private getNearestOfficeBathroomRoomDoor(): OfficeChapterData['bathroomRoomDoors'][number] | null {
    const playerPosition = this.player.getPosition();
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    let closest: OfficeChapterData['bathroomRoomDoors'][number] | null = null;
    let bestAlong = Infinity;

    for (const door of this.officeChapter.bathroomRoomDoors) {
      const toDoor = door.interactPosition.clone().sub(playerPosition);
      const along = toDoor.dot(forward);
      if (along <= 0 || along > GAME_CONFIG.player.interactionRange + 1.05) {
        continue;
      }

      const projected = forward.clone().multiplyScalar(along);
      const lateral = toDoor.sub(projected).length();
      if (lateral > 1.05 || along >= bestAlong) {
        continue;
      }

      closest = door;
      bestAlong = along;
    }

    return closest;
  }

  private getNearestOfficeBathroomSink(): OfficeChapterData['bathroomSinks'][number] | null {
    const playerPosition = this.player.getPosition();
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    let closest: OfficeChapterData['bathroomSinks'][number] | null = null;
    let bestLateral = Infinity;
    let bestAlong = Infinity;

    for (const sink of this.officeChapter.bathroomSinks) {
      const toSink = sink.interactPosition.clone().sub(playerPosition);
      const along = toSink.dot(forward);
      if (along <= 0 || along > GAME_CONFIG.player.interactionRange + 1.0) {
        continue;
      }

      const projected = forward.clone().multiplyScalar(along);
      const lateral = toSink.sub(projected).length();
      if (lateral > 0.82) {
        continue;
      }

      if (lateral > bestLateral + 0.001) {
        continue;
      }

      if (Math.abs(lateral - bestLateral) <= 0.001 && along >= bestAlong) {
        continue;
      }

      closest = sink;
      bestLateral = lateral;
      bestAlong = along;
    }

    return closest;
  }

  private getNearestOfficeBathroomStall(): OfficeChapterData['bathroomStalls'][number] | null {
    const playerPosition = this.player.getPosition();
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    let closest: OfficeChapterData['bathroomStalls'][number] | null = null;
    let bestLateral = Infinity;
    let bestAlong = Infinity;

    for (const stall of this.officeChapter.bathroomStalls) {
      const toStall = stall.interactPosition.clone().sub(playerPosition);
      const along = toStall.dot(forward);
      if (along <= 0 || along > GAME_CONFIG.player.interactionRange + 0.9) {
        continue;
      }

      const projected = forward.clone().multiplyScalar(along);
      const lateral = toStall.sub(projected).length();
      if (lateral > 0.7) {
        continue;
      }

      if (lateral > bestLateral + 0.001) {
        continue;
      }

      if (Math.abs(lateral - bestLateral) <= 0.001 && along >= bestAlong) {
        continue;
      }

      closest = stall;
      bestLateral = lateral;
      bestAlong = along;
    }

    return closest;
  }

  private getNearestOfficeUtilityInteractable(): {
    kind: 'closet' | 'power-box';
    label: string;
  } | null {
    const playerPosition = this.player.getPosition();
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const candidates: Array<{
      kind: 'closet' | 'power-box';
      label: string;
      interactPosition: Vector3;
    }> = [];

    if (this.officeChapter.utilityCloset.open) {
      candidates.push({
        kind: 'power-box',
        label: 'Hall Power Box',
        interactPosition: this.officeChapter.utilityCloset.powerBoxInteractPosition,
      });
    }

    let closest: { kind: 'closet' | 'power-box'; label: string } | null = null;
    let bestLateral = Infinity;
    let bestAlong = Infinity;

    for (const candidate of candidates) {
      const toCandidate = candidate.interactPosition.clone().sub(playerPosition);
      const along = toCandidate.dot(forward);
      if (along <= 0 || along > GAME_CONFIG.player.interactionRange + 1.1) {
        continue;
      }

      const projected = forward.clone().multiplyScalar(along);
      const lateral = toCandidate.sub(projected).length();
      if (lateral > 0.42) {
        continue;
      }

      if (lateral > bestLateral + 0.001) {
        continue;
      }

      if (Math.abs(lateral - bestLateral) <= 0.001 && along >= bestAlong) {
        continue;
      }

      closest = {
        kind: candidate.kind,
        label: candidate.label,
      };
      bestLateral = lateral;
      bestAlong = along;
    }

    return closest;
  }

  private enterOfficeVentSystem(): void {
    this.resetOfficeTabletState();
    this.officeVentActive = true;
    this.officeVentDrop = null;
    this.officeBallPitHidden = false;
    this.player.teleport(this.officeChapter.ventSystem.ladderEntryPosition);
    this.player.lookToward(
      this.officeChapter.ventSystem.ladderEntryPosition.clone().add(new Vector3(0, 0, 4)),
      1,
    );
    this.pushStatus('You climb into the ceiling vent. Move slowly with WASD and look around normally.', 3.2);
  }

  private exitOfficeVentSystem(exitPosition: Vector3, openingLabel = ''): void {
    this.officeVentActive = false;
    this.officeVentDrop = null;
    this.player.teleport(exitPosition);
    this.player.lookToward(exitPosition.clone().add(new Vector3(0, 0, 3)), 1);
    this.pushStatus(
      openingLabel.toLowerCase().includes('floor vent')
        ? `You drop through ${openingLabel.toLowerCase()} into the room below.`
        : 'You climb back down from the ceiling vent.',
      2.4,
    );
  }

  private handleOfficeChapterInteract(): void {
    if (this.officeVentActive) {
      const ventExit = this.getNearestOfficeVentExit();
      if (ventExit?.exitPosition) {
        if (ventExit.coverPivot) {
          const opening = (ventExit.targetOpenAmount ?? 0) < 0.5;
          ventExit.targetOpenAmount = opening ? 1 : 0;
          ventExit.open = opening;
          this.gameplaySfxAudio.playSmallPanel(opening);
          this.pushStatus(
            opening
              ? `${ventExit.label} swings open. Step onto the opening to drop down, or press E again to close it.`
              : `${ventExit.label} clanks shut.`,
            opening ? 3.1 : 1.8,
          );
          return;
        }
        this.exitOfficeVentSystem(ventExit.exitPosition, ventExit.label);
        return;
      }

      this.pushStatus('You are inside the vents. Move over a hatch or air vent grate to climb or jump down.', 2.4);
      return;
    }

    if (this.officeChapterSeated) {
      this.leaveOfficeChapterSeat();
      return;
    }

    if (this.isNearOfficeSeat()) {
      this.enterOfficeChapterSeat();
      return;
    }

    if (this.getNearestOfficeVentLadder()) {
      this.enterOfficeVentSystem();
      return;
    }

    if (this.getNearestOfficeBallPitSlide()) {
      this.startOfficeBallPitSlide();
      return;
    }

    const kitchenEntranceDoor = this.getNearestOfficeKitchenEntranceDoor();
    if (kitchenEntranceDoor) {
      kitchenEntranceDoor.targetOpenAmount = kitchenEntranceDoor.targetOpenAmount > 0.5 ? 0 : 1;
      kitchenEntranceDoor.open = kitchenEntranceDoor.targetOpenAmount > 0.5;
      this.gameplaySfxAudio.playClosetDoor(kitchenEntranceDoor.open);
      this.pushStatus(
        kitchenEntranceDoor.open
          ? 'The kitchen double doors swing open and steam spills into the hall.'
          : 'The kitchen double doors swing shut.',
        2.6,
      );
      return;
    }

    const kitchenGlassShelf = this.getNearestOfficeKitchenGlassShelf();
    if (kitchenGlassShelf) {
      if (this.officeGlassHeld) {
        this.pushStatus('You already have a glass. Left click to throw it.', 1.8);
        return;
      }

      this.officeGlassHeld = true;
      this.officeGlassAnchor.visible = true;
      this.officeBasketballHeld = false;
      this.officeBasketballAnchor.visible = false;
      this.officeChapter.setBasketballHeld(false);
      this.officeTabletHeld = false;
      this.officeTabletCameraFeedActive = false;
      this.officeTabletAnchor.visible = false;
      this.setPlacementToolActive(false);
      this.gameplaySfxAudio.playSmallPanel(false);
      this.pushStatus(`You pick up a glass from ${kitchenGlassShelf.label}. Left click to throw it.`, 2.8);
      return;
    }

    const backstageStorageDoor = this.getNearestOfficeBackstageStorageDoor();
    if (backstageStorageDoor) {
      backstageStorageDoor.targetOpenAmount = backstageStorageDoor.targetOpenAmount > 0.5 ? 0 : 1;
      backstageStorageDoor.open = backstageStorageDoor.targetOpenAmount > 0.5;
      this.gameplaySfxAudio.playClosetDoor(backstageStorageDoor.open);
      this.pushStatus(
        backstageStorageDoor.open
          ? 'The backstage suit storage door swings open.'
          : 'The backstage suit storage door swings shut.',
        2.2,
      );
      return;
    }

    const storageClosetDoor = this.getNearestOfficeStorageClosetDoor();
    if (storageClosetDoor) {
      storageClosetDoor.targetOpenAmount = storageClosetDoor.targetOpenAmount > 0.5 ? 0 : 1;
      storageClosetDoor.open = storageClosetDoor.targetOpenAmount > 0.5;
      this.gameplaySfxAudio.playClosetDoor(storageClosetDoor.open);
      this.pushStatus(
        storageClosetDoor.open
          ? 'The cleaning storage closet swings open. Supplies and dripping pipes are inside.'
          : 'The cleaning storage closet swings shut.',
        2.4,
      );
      return;
    }

    const bathroomEntranceDoor = this.getNearestOfficeBathroomEntranceDoor();
    if (bathroomEntranceDoor) {
      bathroomEntranceDoor.targetOpenAmount = bathroomEntranceDoor.targetOpenAmount > 0.5 ? 0 : 1;
      bathroomEntranceDoor.open = bathroomEntranceDoor.targetOpenAmount > 0.5;
      this.gameplaySfxAudio.playClosetDoor(bathroomEntranceDoor.open);
      this.pushStatus(
        bathroomEntranceDoor.open
          ? 'The bathroom entrance doors swing open.'
          : 'The bathroom entrance doors swing shut.',
        2.2,
      );
      return;
    }

    const bathroomRoomDoor = this.getNearestOfficeBathroomRoomDoor();
    if (bathroomRoomDoor) {
      bathroomRoomDoor.targetOpenAmount = bathroomRoomDoor.targetOpenAmount > 0.5 ? 0 : 1;
      bathroomRoomDoor.open = bathroomRoomDoor.targetOpenAmount > 0.5;
      this.gameplaySfxAudio.playClosetDoor(bathroomRoomDoor.open);
      this.pushStatus(
        bathroomRoomDoor.open
          ? `${bathroomRoomDoor.label} swings open.`
          : `${bathroomRoomDoor.label} swings closed.`,
        2.1,
      );
      return;
    }

    const bathroomSink = this.getNearestOfficeBathroomSink();
    if (bathroomSink) {
      bathroomSink.waterOn = !bathroomSink.waterOn;
      this.gameplaySfxAudio.playSmallPanel(bathroomSink.waterOn);
      this.pushStatus(
        bathroomSink.waterOn
          ? `Water starts running at ${bathroomSink.label.toLowerCase()}.`
          : `You shut off ${bathroomSink.label.toLowerCase()}.`,
        2.1,
      );
      return;
    }

    const bathroomStall = this.getNearestOfficeBathroomStall();
    if (bathroomStall) {
      bathroomStall.doorTargetOpenAmount = bathroomStall.doorTargetOpenAmount > 0.5 ? 0 : 1;
      bathroomStall.doorOpen = bathroomStall.doorTargetOpenAmount > 0.5;
      this.gameplaySfxAudio.playClosetDoor(bathroomStall.doorOpen);
      this.pushStatus(
        bathroomStall.doorOpen
          ? `${bathroomStall.label} swings open.`
          : `${bathroomStall.label} swings closed.`,
        2.1,
      );
      return;
    }

    const ticket = this.getNearestOfficeTicketPickup();
    if (ticket) {
      ticket.collected = true;
      ticket.root.visible = false;
      this.officeChapterTickets += 1;
      this.pushStatus(`You found a party ticket. Tickets: ${this.officeChapterTickets}.`, 2.4);
      return;
    }

    const basketballGame = this.getNearestOfficeBasketballGame();
    if (basketballGame) {
      if (this.officeBasketballHeld) {
        this.pushStatus('You already have the basketball in your hand. Aim at a hoop and left click to shoot.', 2.2);
        return;
      }

      if (this.officeChapter.isBasketballThrowActive()) {
        this.pushStatus('The basketball is still rolling back to you.', 1.6);
        return;
      }

      this.officeBasketballHeld = true;
      this.officeBasketballAnchor.visible = true;
      this.officeGlassHeld = false;
      this.officeGlassAnchor.visible = false;
      this.officeTabletHeld = false;
      this.officeTabletCameraFeedActive = false;
      this.officeTabletAnchor.visible = false;
      this.officeChapter.setBasketballHeld(true);
      this.gameplaySfxAudio.playSmallPanel(false);
      this.pushStatus('You pick up the basketball. Aim at one of the hoops and left click to shoot.', 2.8);
      return;
    }

    const prizeWheel = this.getNearestOfficePrizeWheel();
    if (prizeWheel) {
      this.startOfficePrizeWheelSpin();
      return;
    }

    const foxyPlay = this.getNearestOfficeFoxyPlayButton();
    if (foxyPlay) {
      this.officeChapter.startFoxyPlay();
      this.foxyPlayAudio.play();
      this.gameplaySfxAudio.playSmallPanel(false);
      this.pushStatus(`Foxy starts a pirate dance and says: "${FOXY_PLAY_LINE}"`, 5.4);
      return;
    }

    const utility = this.getNearestOfficeUtilityInteractable();
    if (utility) {
      if (utility.kind === 'power-box') {
        const nextOpen = !this.officeChapter.utilityCloset.powerBoxOpen;
        this.officeChapter.utilityCloset.powerBoxTargetOpenAmount = nextOpen ? 1 : 0;
        this.officeChapter.utilityCloset.powerBoxOpen = nextOpen;
        this.gameplaySfxAudio.playSmallPanel(nextOpen);
        this.pushStatus(
          nextOpen
            ? 'The power box swings open. Wires and breakers fill the cabinet.'
            : 'The power box door clicks shut over the wires.',
          2.8,
        );
        return;
      }

      const nextOpen = !this.officeChapter.utilityCloset.open;
      this.officeChapter.utilityCloset.targetOpenAmount = nextOpen ? 1 : 0;
      if (!nextOpen) {
        this.officeChapter.utilityCloset.powerBoxTargetOpenAmount = 0;
        this.officeChapter.utilityCloset.powerBoxOpen = false;
      }
      this.officeChapter.utilityCloset.open = nextOpen;
      this.gameplaySfxAudio.playClosetDoor(nextOpen);
      this.pushStatus(
        nextOpen
          ? 'The hallway utility closet swings open. A power box is mounted inside it.'
          : 'The hallway utility closet swings shut.',
        2.8,
      );
      return;
    }

    const partyPlay = this.getNearestOfficePartyPlayMachine();
    if (partyPlay) {
      this.officeChapter.startPartyShow(this.player.getPosition());
      this.gameplaySfxAudio.playSmallPanel(false);
      this.partyShowAudio.start();
      this.pushStatus(
        "The Let's Party wall button clicks in. Quacky dances, Fluffle plays guitar, and Bori hammers the drums.",
        3.2,
      );
      return;
    }

    const button = this.getNearestOfficeButton();
    if (!button) {
      return;
    }

    if (this.officeGameModeActive && this.officeGameModePowerOut) {
      this.pushStatus('The office controls are dead. The power is out.', 2.4);
      return;
    }

    if (button.buttonType === 'flash') {
      this.officeChapter.flashHallLight(button.doorId);
      this.repelOfficeGameModeAnimatronicsAtDoor(button.doorId);
      this.pushStatus(
        `The white button kicks a hard flash into the hall outside the ${button.doorId} office door.`,
        2.2,
      );
      return;
    }

    const door = this.getOfficeDoorById(button.doorId);
    if (!door) {
      return;
    }

    door.targetOpenAmount = door.targetOpenAmount > 0.5 ? 0 : 1;
    door.open = door.targetOpenAmount > 0.5;
    this.gameplaySfxAudio.playSecurityDoor(door.open);
    this.pushStatus(
      door.open
        ? `${door.label} grinds upward into the ceiling track.`
        : `${door.label} drops back down and seals the opening.`,
      2.8,
    );
  }

  private startChapterTwoCoffeeBrew(coffeeMachine: ChapterTwoCoffeeMachine): void {
    this.chapterTwoCoffeeJob = {
      duration: CHAPTER_TWO_COFFEE_BREW_DURATION,
      remaining: CHAPTER_TWO_COFFEE_BREW_DURATION,
    };
    this.coffeeMachineAudio.playBrewCycle(CHAPTER_TWO_COFFEE_BREW_DURATION);
    this.pushStatus(
      this.player.getPosition().distanceTo(coffeeMachine.position) < 2.1
        ? 'The coffee machine kicks on with a hard whirr. Water starts sloshing into the cup.'
        : 'The coffee machine starts up and begins filling a cup.',
      3.2,
    );
  }

  private updateChapterTwoCoffee(deltaSeconds: number): void {
    if (!this.chapterTwoCoffeeJob) {
      return;
    }

    this.chapterTwoCoffeeJob.remaining = Math.max(0, this.chapterTwoCoffeeJob.remaining - deltaSeconds);

    if (this.chapterTwoCoffeeJob.remaining > 0) {
      return;
    }

    this.chapterTwoCoffeeJob = null;
    this.addItem('coffee');
    this.coffeeMachineAudio.playReadyDing();
    this.pushStatus('A loud ding snaps through the lobby. Fresh coffee drops into your inventory.', 3.4);
  }

  private ensureCarriedDrinkModel(): void {
    if (this.carriedDrinkModel) {
      return;
    }

    this.carriedDrinkModel = createCarriedCoffeeModel();
    this.carriedDrinkAnchor.add(this.carriedDrinkModel);
  }

  private updateCarriedDrinkDisplay(deltaSeconds: number): void {
    if (!this.activeCoffeeDrink) {
      this.carriedDrinkAnchor.visible = false;
      return;
    }

    this.ensureCarriedDrinkModel();

    this.activeCoffeeDrink.elapsed = Math.min(
      this.activeCoffeeDrink.duration,
      this.activeCoffeeDrink.elapsed + deltaSeconds,
    );

    const progress = this.activeCoffeeDrink.elapsed / this.activeCoffeeDrink.duration;
    const raise = Math.sin(Math.min(progress, 1) * Math.PI);

    this.carriedDrinkAnchor.visible = true;
    this.carriedDrinkAnchor.position.set(
      0.38 - raise * 0.14,
      -0.62 + raise * 0.32,
      -0.7 + raise * 0.28,
    );
    this.carriedDrinkAnchor.rotation.set(
      0.08 - raise * 0.34,
      -0.32 + raise * 0.42,
      0.06 - raise * 0.22,
    );

    if (progress < 1) {
      return;
    }

    this.activeCoffeeDrink = null;
    this.carriedDrinkAnchor.visible = false;
    this.coffeeBoostRemaining = CHAPTER_TWO_COFFEE_BOOST_DURATION;
    this.stamina = GAME_CONFIG.player.staminaMax;
    this.pushStatus('The coffee hits hard. Your stamina stays maxed for 5 seconds.', 2.8);
  }

  private ensureZombieWeaponVisual(): void {
    const activeWeapon = this.zombieModeActive
      ? this.zombieWeapon
      : this.doomModeActive
        ? this.doomWeapon
        : null;
    const activeMode = this.zombieModeActive
      ? 'zombie'
      : this.doomModeActive
        ? 'doom'
        : null;

    if (!activeWeapon || !activeMode) {
      this.zombieWeaponAnchor.visible = false;
      return;
    }

    if (
      this.zombieWeaponVisual
      && this.zombieWeaponVisualId === activeWeapon
      && this.zombieWeaponVisualMode === activeMode
    ) {
      return;
    }

    if (this.zombieWeaponVisual) {
      this.zombieWeaponAnchor.remove(this.zombieWeaponVisual.root);
      this.zombieWeaponVisual = null;
    }

    this.zombieWeaponVisual = activeMode === 'zombie'
      ? createHeldZombieWeapon(activeWeapon)
      : createHeldDoomWeapon(activeWeapon);
    this.zombieWeaponVisualId = activeWeapon;
    this.zombieWeaponVisualMode = activeMode;
    this.zombieWeaponAnchor.add(this.zombieWeaponVisual.root);
  }

  private updateZombieWeaponDisplay(
    deltaSeconds: number,
    moving: boolean,
    sprinting: boolean,
  ): void {
    if (!this.zombieModeActive && !this.doomModeActive) {
      this.zombieWeaponAnchor.visible = false;
      return;
    }

    this.ensureZombieWeaponVisual();

    if (!this.zombieWeaponVisual) {
      this.zombieWeaponAnchor.visible = false;
      return;
    }

    const visible = this.player.isLocked() && !this.chapterMenuOpen;
    this.zombieWeaponAnchor.visible = visible;
    if (!visible) {
      return;
    }

    const movementAmount = moving ? (sprinting ? 1 : 0.62) : 0.14;
    if (this.doomModeActive) {
      this.zombieWeaponAnchor.position.set(0, -0.54, -0.9);
    } else {
      this.zombieWeaponAnchor.position.set(0.46, -0.36, -0.58);
    }
    this.zombieWeaponVisual.update(this.elapsed + deltaSeconds, movementAmount, this.zombieWeaponKick);
  }

  private getZombieWeaponMuzzlePosition(target = new Vector3()): Vector3 {
    this.ensureZombieWeaponVisual();

    if (!this.zombieWeaponVisual) {
      return target.copy(this.player.getPosition()).add(this.player.getForwardVector(this.zombieForward));
    }

    this.camera.updateMatrixWorld(true);
    return this.zombieWeaponVisual.muzzle.getWorldPosition(target);
  }

  private spawnShotgunTracers(
    muzzlePoint: Vector3,
    forward: Vector3,
    focusPoint: Vector3 | null,
  ): void {
    this.zombieShotRight.crossVectors(new Vector3(0, 1, 0), forward).normalize();

    const spreads = [
      { lateral: 0, vertical: 0, distance: 18, focusBias: 1 },
      { lateral: -0.9, vertical: 0.16, distance: 16, focusBias: 0.42 },
      { lateral: 0.86, vertical: -0.12, distance: 16.8, focusBias: 0.42 },
    ];

    spreads.forEach((spread) => {
      this.zombieShotEndPoint.copy(muzzlePoint).addScaledVector(forward, spread.distance);
      this.zombieShotEndPoint.addScaledVector(this.zombieShotRight, spread.lateral);
      this.zombieShotEndPoint.y += spread.vertical;

      if (focusPoint) {
        this.zombieShotEndPoint.lerp(focusPoint, spread.focusBias);
      }

      this.spawnZombieBulletTracer(muzzlePoint, this.zombieShotEndPoint, 'shotgun');
    });
  }

  private spawnZombieBulletTracer(from: Vector3, to: Vector3, weapon: ZombieWeaponId): void {
    this.spawnActiveBulletTracer(from, to, weapon);
  }

  private spawnActiveBulletTracer(from: Vector3, to: Vector3, weapon: WeaponSelectId): void {
    const direction = to.clone().sub(from);
    const distance = direction.length();
    if (distance < 0.08) {
      return;
    }

    direction.normalize();
    const visual = this.doomModeActive
      ? createDoomBulletTracer(weapon)
      : createZombieBulletTracer(weapon);
    visual.root.quaternion.copy(
      this.zombieTracerQuaternion.setFromUnitVectors(this.zombieTracerUnitZ, direction),
    );
    this.scene.add(visual.root);

    const tracer: ActiveZombieBulletTracer = {
      visual,
      start: from.clone(),
      direction,
      distance,
      elapsed: 0,
    };
    this.zombieBulletTracers.push(tracer);
    this.updateZombieBulletTracer(tracer);
  }

  private updateZombieBulletTracers(deltaSeconds: number): void {
    for (let index = this.zombieBulletTracers.length - 1; index >= 0; index -= 1) {
      const tracer = this.zombieBulletTracers[index];
      tracer.elapsed += deltaSeconds;
      this.updateZombieBulletTracer(tracer);

      if (tracer.elapsed < tracer.visual.duration) {
        continue;
      }

      this.scene.remove(tracer.visual.root);
      this.zombieBulletTracers.splice(index, 1);
    }
  }

  private updateZombieBulletTracer(tracer: ActiveZombieBulletTracer): void {
    const progress = Math.min(1, tracer.elapsed / tracer.visual.duration);
    const easedProgress = 1 - Math.pow(1 - progress, 2);
    const leadDistance = tracer.distance * easedProgress;
    const tailDistance = Math.max(0, leadDistance - tracer.visual.trailLength);
    const visibleLength = Math.max(0.05, leadDistance - tailDistance);

    tracer.visual.root.position.copy(tracer.start).addScaledVector(tracer.direction, tailDistance);
    tracer.visual.trail.position.set(0, 0, visibleLength * 0.5);
    tracer.visual.trail.scale.set(1, 1, visibleLength);
    tracer.visual.projectile.position.set(0, 0, visibleLength);
  }

  private clearZombieBulletTracers(): void {
    this.zombieBulletTracers.forEach((tracer) => {
      this.scene.remove(tracer.visual.root);
    });
    this.zombieBulletTracers.length = 0;
  }

  private enterChapterTwoSeat(seat: ChapterTwoSeat): void {
    this.chapterTwoSeatId = seat.id;
    this.chapterTwo.setOccupiedSeat(seat.id);
    this.player.teleport(seat.sitPosition);
    this.player.lookToward(seat.lookTarget, 1);
      this.pushStatus(
        seat.kind === 'rocker'
          ? 'You climb onto the rocking horse. Press E to get back off.'
        : seat.kind === 'swing'
          ? 'You climb onto the swing set. Hold W to swing, and press E to get back off.'
        : seat.kind === 'couch'
          ? 'You sit down on the couch. Press E to stand up.'
          : 'You sit down in the waiting chair. Press E to stand up.',
    );
  }

  private startChapterTwoClimb(slide: ChapterTwoSlideInteractable): void {
    this.chapterTwoClimb = {
      elapsed: 0,
      duration: 0.92,
      startPosition: this.player.getPosition().clone(),
      endPosition: slide.topPosition.clone(),
      lookTarget: slide.lookTarget.clone(),
    };
    this.player.lookToward(slide.lookTarget, 1);
    this.pushStatus('You head up the little playground stairs.', 1.2);
  }

  private updateChapterTwoClimb(deltaSeconds: number): void {
    if (!this.chapterTwoClimb) {
      return;
    }

    this.chapterTwoClimb.elapsed = Math.min(
      this.chapterTwoClimb.elapsed + deltaSeconds,
      this.chapterTwoClimb.duration,
    );

    const progress = MathUtils.smootherstep(
      this.chapterTwoClimb.elapsed / this.chapterTwoClimb.duration,
      0,
      1,
    );
    const climbPosition = this.chapterTwoClimb.startPosition.clone().lerp(
      this.chapterTwoClimb.endPosition,
      progress,
    );
    this.player.teleport(climbPosition);
    this.player.lookToward(this.chapterTwoClimb.lookTarget, 1);

    if (progress >= 1) {
      this.chapterTwoClimb = null;
      this.pushStatus('You reach the top of the playground. Press E to slide down.', 1.8);
    }
  }

  private startChapterTwoSlide(slide: ChapterTwoSlideInteractable): void {
    this.chapterTwoSlide = {
      elapsed: 0,
      duration: 1.18,
      startPosition: slide.startPosition.clone(),
      endPosition: slide.endPosition.clone(),
      lookTarget: slide.lookTarget.clone(),
    };
    this.player.teleport(slide.startPosition);
    this.player.lookToward(slide.lookTarget, 1);
    this.pushStatus('You drop onto the little playground slide.', 1.2);
  }

  private updateChapterTwoSlide(deltaSeconds: number): void {
    if (!this.chapterTwoSlide) {
      return;
    }

    this.chapterTwoSlide.elapsed = Math.min(
      this.chapterTwoSlide.elapsed + deltaSeconds,
      this.chapterTwoSlide.duration,
    );

    const progress = MathUtils.smootherstep(
      this.chapterTwoSlide.elapsed / this.chapterTwoSlide.duration,
      0,
      1,
    );
    const slidePosition = this.chapterTwoSlide.startPosition.clone().lerp(
      this.chapterTwoSlide.endPosition,
      progress,
    );
    this.player.teleport(slidePosition);
    this.player.lookToward(this.chapterTwoSlide.lookTarget, 1);

    if (progress >= 1) {
      this.chapterTwoSlide = null;
      this.pushStatus('You slide down the little playground and step off at the bottom.', 1.8);
    }
  }

  private leaveChapterTwoSeat(): void {
    const seat = this.getChapterTwoSeatById(this.chapterTwoSeatId);
    this.chapterTwoSeatId = null;
    this.chapterTwo.setOccupiedSeat(null);

    if (seat) {
      this.player.teleport(seat.exitPosition);
      this.player.lookToward(seat.lookTarget, 1);
      this.pushStatus(
        seat.kind === 'rocker'
          ? 'You step off the rocking horse.'
          : seat.kind === 'swing'
            ? 'You step off the swing set.'
          : seat.kind === 'couch'
            ? 'You stand up from the couch.'
            : 'You stand up from the waiting chair.',
      );
      return;
    }

    this.pushStatus('You stand back up.');
  }

  private enterOfficeChapterSeat(): void {
    this.officeChapterSeated = true;
    this.player.teleport(this.officeChapter.seat.sitPosition);
    this.player.lookToward(this.officeChapter.seat.lookTarget, 1);
    this.pushStatus('You sit down in the office chair. Press E to stand back up.', 2.8);
  }

  private leaveOfficeChapterSeat(): void {
    this.officeChapterSeated = false;
    this.player.teleport(this.officeChapter.seat.exitPosition);
    this.player.lookToward(this.officeChapter.seat.lookTarget, 1);
    this.pushStatus('You stand up from the office chair.', 2.4);
  }

  private collectIngredient(ingredient: IngredientPickup): void {
    ingredient.collected = true;
    ingredient.root.visible = false;
    this.addItem(ingredient.id);
    this.pushStatus(this.getIngredientCollectedText(ingredient));
  }

  private getIngredientPrompt(ingredient: IngredientPickup): string {
    switch (ingredient.id) {
      case 'seaweed':
        return 'Press E to harvest the fresh seaweed.';
      case 'rice-stalk':
        return 'Press E to cut a rice stalk from the paddy.';
      case 'salmon-fish':
        return 'Press E to pull a salmon fish from the tank.';
      case 'tuna-fish':
        return 'Press E to pull a tuna fish from the tank.';
      default:
        return `Press E to grab the ${ingredient.label.toLowerCase()}.`;
    }
  }

  private getIngredientNearbyText(ingredient: IngredientPickup): string {
    switch (ingredient.id) {
      case 'seaweed':
        return 'Fresh seaweed can be harvested here.';
      case 'rice-stalk':
        return 'Rice stalks are ready to cut here.';
      case 'salmon-fish':
      case 'tuna-fish':
        return `${ingredient.label} is within reach in the tank.`;
      default:
        return `${ingredient.label} is within reach.`;
    }
  }

  private getIngredientCollectedText(ingredient: IngredientPickup): string {
    switch (ingredient.id) {
      case 'seaweed':
      case 'rice-stalk':
        return `${ingredient.label} harvested. Take it back to the station machines.`;
      case 'salmon-fish':
      case 'tuna-fish':
        return `${ingredient.label} pulled from the tank. Take it back to the station machines.`;
      default:
        return `${ingredient.label} added to the hotbar. Take it back to the station machines.`;
    }
  }

  private getNearestStation(): StationInteractable | null {
    const playerPosition = this.player.getPosition();
    let closest: StationInteractable | null = null;
    let closestDistance = Infinity;

    for (const station of this.level.stationInteractables) {
      const distance = playerPosition.distanceTo(station.position);
      if (distance > GAME_CONFIG.player.interactionRange + 0.55 || distance >= closestDistance) {
        continue;
      }

      closest = station;
      closestDistance = distance;
    }

    return closest;
  }

  private getNearbyStationById(id: StationInteractableId): StationInteractable | null {
    const station = this.level.stationInteractables.find((candidate) => candidate.id === id);

    if (!station) {
      return null;
    }

    return this.player.getPosition().distanceTo(station.position)
      <= GAME_CONFIG.player.interactionRange + 0.75
      ? station
      : null;
  }

  private isPlayerSafe(): boolean {
    return this.player.getPosition().z > this.level.pantryEntrancePosition.z + 0.9;
  }

  private isNearChapterExit(): boolean {
    return this.player.getPosition().distanceTo(this.level.chapterExitPosition)
      <= GAME_CONFIG.player.interactionRange + 0.55;
  }

  private tryUseChapterExit(): boolean {
    if (!this.chapterExitUnlocked && !this.chapterTwoActive) {
      return false;
    }

    if (!this.isNearChapterExit()) {
      return false;
    }

    this.beginChapterTwo();
    return true;
  }

  private getAssemblableRecipe(): RecipeDefinition | undefined {
    return RECIPES.find(
      (recipe) => !this.submittedRecipes.has(recipe.id)
        && recipe.ingredients.every((ingredientId) => this.hasItem(ingredientId)
          || (this.plateRecipeId === recipe.id && this.plateIngredients.includes(ingredientId))),
    );
  }

  private getActivePlateRecipe(): RecipeDefinition | undefined {
    const recipeId = this.platedRecipeId ?? this.plateRecipeId;
    return RECIPES.find((recipe) => recipe.id === recipeId);
  }

  private getCurrentPlateRecipe(): RecipeDefinition | undefined {
    return RECIPES.find((recipe) => recipe.id === this.platedRecipeId);
  }

  private getPlateTargetRecipe(): RecipeDefinition | undefined {
    if (this.plateRecipeId) {
      return this.getActivePlateRecipe();
    }

    const candidates = RECIPES.filter((recipe) => !this.submittedRecipes.has(recipe.id));
    if (candidates.length === 0) {
      return undefined;
    }

    let bestRecipe = candidates[0];
    let bestScore = -1;

    candidates.forEach((recipe) => {
      const availableCount = recipe.ingredients.filter((ingredientId) => this.hasItem(ingredientId)).length;
      const fishBonus = recipe.ingredients.some((ingredientId) => ingredientId === 'salmon')
        ? (this.hasItem('salmon') ? 2 : 0)
        : recipe.ingredients.some((ingredientId) => ingredientId === 'tuna')
          ? (this.hasItem('tuna') ? 2 : 0)
          : 0;
      const score = availableCount + fishBonus;

      if (score > bestScore) {
        bestScore = score;
        bestRecipe = recipe;
      }
    });

    return bestRecipe;
  }

  private getNextRecipe(): RecipeDefinition | undefined {
    return RECIPES.find(
      (recipe) => !this.submittedRecipes.has(recipe.id)
        && recipe.id !== this.platedRecipeId
        && recipe.id !== this.plateRecipeId,
    );
  }

  private getMissingIngredients(recipe: RecipeDefinition): IngredientId[] {
    return recipe.ingredients.filter(
      (ingredientId) => !this.hasItem(ingredientId)
        && !(this.plateRecipeId === recipe.id && this.plateIngredients.includes(ingredientId)),
    );
  }

  private getPreferredFishInput(): IngredientId | null {
    const salmonReady = this.hasItem('salmon-fish');
    const tunaReady = this.hasItem('tuna-fish');

    if (!salmonReady && !tunaReady) {
      return null;
    }

    const nextRecipe = this.getNextRecipe();
    if (nextRecipe?.ingredients.includes('salmon') && salmonReady) {
      return 'salmon-fish';
    }
    if (nextRecipe?.ingredients.includes('tuna') && tunaReady) {
      return 'tuna-fish';
    }

    if (salmonReady) {
      return 'salmon-fish';
    }

    return 'tuna-fish';
  }

  private getStationPrompt(stationId: StationInteractableId): string {
    const processingId = this.toProcessingStationId(stationId);
    if (processingId && this.isMachineBusy(processingId)) {
      return this.getBusyMachineText(processingId);
    }

    switch (stationId) {
      case 'grainer':
        return this.hasItem('rice-stalk')
          ? 'Press E to run a rice stalk through the grainer.'
          : 'Bring a rice stalk here for the grainer.';
      case 'boiler':
        return this.hasItem('raw-rice')
          ? 'Press E to boil the raw rice.'
          : 'Grain the stalk first, then bring the raw rice here.';
      case 'skinner':
        return this.hasItem('salmon-fish') || this.hasItem('tuna-fish')
          ? 'Press E to skin the fish into sushi cuts.'
          : 'Bring a salmon fish or tuna fish here.';
      case 'dryer':
        return this.hasItem('seaweed')
          ? 'Press E to dry the fresh seaweed.'
          : 'Bring fresh seaweed here first.';
      case 'slicer':
        return this.hasItem('dried-seaweed')
          ? 'Press E to slice the dried seaweed.'
          : 'Dry the seaweed before using the slicer.';
      case 'plate':
        return 'Fresh plates feed the plating bench automatically.';
      case 'assembly':
        if (this.holdingPlate && this.platedRecipeId) {
          return 'You are already carrying the finished plate. Bring it to the judges belt and press D.';
        }
        if (this.platedRecipeId) {
          return 'Press E to pick up the finished plate from the plating bench.';
        }
        if (this.plateIngredients.length > 0) {
          const recipe = this.getActivePlateRecipe();
          const remaining = recipe
            ? recipe.ingredients.filter((ingredientId) => !this.plateIngredients.includes(ingredientId))
            : [];
          return remaining.length > 0
            ? `Press E to add more ingredients to ${recipe?.label ?? 'the dish'} on the plating bench.`
            : 'The final ingredient will resolve the dish automatically.';
        }
        if (this.getAssemblableRecipe()) {
          return 'Press E to stack the ready ingredients onto the plating bench.';
        }
        return 'Process the raw ingredients first, then plate the dish here.';
      case 'submission':
        return this.holdingPlate && this.platedRecipeId
          ? 'Press D to drop the plated dish onto the judges belt.'
          : 'Bring a finished plate here from the plating bench.';
    }
  }

  private getStationStatus(stationId: StationInteractableId): string {
    const processingId = this.toProcessingStationId(stationId);
    if (processingId && this.isMachineBusy(processingId)) {
      return this.getBusyMachineText(processingId);
    }

    switch (stationId) {
      case 'grainer':
        return this.hasItem('rice-stalk')
          ? 'Rice stalk ready for the grainer.'
          : 'The grainer is waiting for a rice stalk.';
      case 'boiler':
        return this.hasItem('raw-rice')
          ? 'Raw rice is ready for the pot.'
          : 'The boiler needs raw rice from the grainer.';
      case 'skinner':
        return this.hasItem('salmon-fish') || this.hasItem('tuna-fish')
          ? 'A fresh fish is ready for the skinner.'
          : 'The skinner is idle.';
      case 'dryer':
        return this.hasItem('seaweed')
          ? 'Fresh seaweed is ready for drying.'
          : 'The dryer is waiting for seaweed.';
      case 'slicer':
        return this.hasItem('dried-seaweed')
          ? 'Dried seaweed is ready for slicing.'
          : 'The slicer only takes dried seaweed.';
      case 'plate':
        return 'Clean plates are stacked and feeding the plating bench.';
      case 'assembly':
        if (this.holdingPlate && this.platedRecipeId) {
          return `${this.getCurrentPlateRecipe()?.label ?? 'The dish'} is off the bench and in your hands.`;
        }
        if (this.platedRecipeId) {
          return `${this.getCurrentPlateRecipe()?.label ?? 'The dish'} is finished and waiting on the plating bench.`;
        }
        if (this.plateIngredients.length > 0) {
          const recipe = this.getActivePlateRecipe();
          const remaining = recipe
            ? recipe.ingredients.filter((ingredientId) => !this.plateIngredients.includes(ingredientId))
            : [];
          return remaining.length > 0
            ? `${recipe?.label ?? 'The dish'} needs ${this.formatIngredientList(remaining)} on the plating bench.`
            : `${recipe?.label ?? 'The dish'} is ready to resolve into the final plate.`;
        }
        if (this.getAssemblableRecipe()) {
          return 'Everything is ready to assemble on the plating bench.';
        }
        return 'This is where the finished ingredients become a dish.';
      case 'submission':
        return this.holdingPlate && this.platedRecipeId
          ? `${this.getCurrentPlateRecipe()?.label ?? 'The dish'} is ready to drop onto the judges belt.`
          : 'The conveyor only takes finished plated dishes carried from the plating bench.';
    }
  }

  private tryStartMachineJob({
    id,
    input,
    output,
    startText,
    finishText,
    missingText,
  }: {
    id: ProcessingStationId;
    input: IngredientId;
    output: IngredientId;
    startText: string;
    finishText: string;
    missingText: string;
  }): void {
    if (this.isMachineBusy(id)) {
      this.pushStatus(this.getBusyMachineText(id));
      return;
    }

    if (!this.hasItem(input)) {
      this.pushStatus(missingText);
      return;
    }

    this.startMachineJob({
      id,
      input,
      output,
      duration: MACHINE_JOB_DURATIONS[id],
      startText,
      finishText,
    });
  }

  private startMachineJob(job: Omit<MachineJob, 'remaining'>): void {
    this.removeItem(job.input);
    this.machineJobs.set(job.id, {
      ...job,
      remaining: job.duration,
    });
    this.level.stationAnimator.setMachineState(job.id, {
      input: job.input,
      output: job.output,
      progress: 0,
    });
    this.pushStatus(job.startText);
  }

  private getBusyMachineText(id: ProcessingStationId): string {
    const job = this.machineJobs.get(id);
    if (!job) {
      return 'That machine is idle.';
    }

    const percent = Math.round((1 - job.remaining / job.duration) * 100);
    return `${this.toTitleCase(job.id)} is running. ${percent}% complete.`;
  }

  private isMachineBusy(id: ProcessingStationId): boolean {
    return this.machineJobs.has(id);
  }

  private toProcessingStationId(id: StationInteractableId): ProcessingStationId | null {
    switch (id) {
      case 'grainer':
      case 'boiler':
      case 'skinner':
      case 'dryer':
      case 'slicer':
        return id;
      default:
        return null;
    }
  }

  private addItem(itemId: IngredientId): void {
    this.inventory.set(itemId, this.countItem(itemId) + 1);
  }

  private removeItem(itemId: IngredientId): void {
    const nextCount = this.countItem(itemId) - 1;
    if (nextCount <= 0) {
      this.inventory.delete(itemId);
      return;
    }

    this.inventory.set(itemId, nextCount);
  }

  private countItem(itemId: IngredientId): number {
    return this.inventory.get(itemId) ?? 0;
  }

  private hasItem(itemId: IngredientId): boolean {
    return this.countItem(itemId) > 0;
  }

  private formatIngredientList(ingredientIds: IngredientId[]): string {
    const labels = ingredientIds.map((ingredientId) => INGREDIENT_LABELS[ingredientId]);

    if (labels.length <= 1) {
      return labels[0] ?? '';
    }

    if (labels.length === 2) {
      return `${labels[0]} and ${labels[1]}`;
    }

    return `${labels.slice(0, -1).join(', ')}, and ${labels.at(-1)}`;
  }

  private toTitleCase(text: string): string {
    return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private getJumpScareIntensity(): number {
    if (!this.activeJumpscare) {
      return 0;
    }

    const progress = this.activeJumpscare.elapsed / GAME_CONFIG.monster.jumpScareDuration;
    const flash = progress < 0.06
      ? 1
      : Math.max(0, 1 - (progress - 0.06) / 0.78);
    const slam = Math.sin(Math.min(progress, 0.28) / 0.28 * Math.PI) * 0.58;
    const aftershock = Math.max(0, Math.sin(progress * Math.PI * 9.5)) * Math.pow(1 - progress, 0.7) * 0.24;

    return MathUtils.clamp(Math.max(flash, slam) + aftershock, 0, 1);
  }

  private getChapterTwoBearRefusalIntensity(): number {
    if (!this.chapterTwoActive || this.chapterTwoBearRefusalTimer <= 0) {
      return 0;
    }

    const progress = MathUtils.clamp(
      1 - this.chapterTwoBearRefusalTimer / CHAPTER_TWO_BEAR_REFUSAL_DURATION,
      0,
      1,
    );
    const flash = MathUtils.smoothstep(progress, 0.02, 0.18);
    const slam = progress < 0.46
      ? Math.sin(progress / 0.46 * Math.PI * 0.5)
      : 1;
    const chatter = Math.max(0, Math.sin(progress * Math.PI * 18))
      * 0.16
      * (0.45 + progress * 0.55);

    return MathUtils.clamp(Math.max(flash, slam * 0.96) + chatter, 0, 1);
  }

  private getOfficeJumpscareIntensity(): number {
    if (!this.activeOfficeJumpscare) {
      return 0;
    }

    const progress = MathUtils.clamp(
      this.activeOfficeJumpscare.elapsed / this.activeOfficeJumpscare.duration,
      0,
      1,
    );
    const flash = MathUtils.smoothstep(progress, 0.08, 0.2);
    const slam = Math.sin(MathUtils.clamp(progress, 0, 0.54) / 0.54 * Math.PI * 0.5);
    const chatter = Math.max(0, Math.sin(progress * Math.PI * 26))
      * Math.pow(1 - progress, 0.45)
      * 0.22;

    return MathUtils.clamp(Math.max(flash, slam) + chatter, 0, 1);
  }

  private getCombinedJumpScareIntensity(): number {
    return Math.max(
      this.getJumpScareIntensity(),
      this.getChapterTwoBearRefusalIntensity(),
      this.getOfficeJumpscareIntensity(),
    );
  }

  private getHudJumpScareIntensity(): number {
    return Math.max(
      this.getJumpScareIntensity(),
      this.getChapterTwoBearRefusalIntensity(),
    );
  }

  private getNightModeAttackHudState(): {
    active: boolean;
    armProgress: number;
    blackout: number;
  } {
    if (!this.chapterTwoDodoNightAttack) {
      return {
        active: false,
        armProgress: 0,
        blackout: 0,
      };
    }

    const elapsed = this.chapterTwoDodoNightAttack.elapsed;
    return {
      active: true,
      armProgress: MathUtils.smoothstep(
        elapsed,
        CHAPTER_TWO_DODO_NIGHT_ATTACK_ARM_START,
        CHAPTER_TWO_DODO_NIGHT_ATTACK_BLACKOUT_START,
      ),
      blackout: MathUtils.smoothstep(
        elapsed,
        CHAPTER_TWO_DODO_NIGHT_ATTACK_BLACKOUT_START,
        CHAPTER_TWO_DODO_NIGHT_ATTACK_DURATION - 0.08,
      ),
    };
  }

  private getHudJumpScareVariant(): HudJumpScareVariant | null {
    if (this.activeJumpscare) {
      return this.activeJumpscare.variant;
    }

    if (this.chapterTwoActive && this.chapterTwoBearRefusalTimer > 0) {
      return 'bear';
    }

    return null;
  }

  private triggerJumpScare(monster: MonsterController): void {
    monster.triggerJumpScare();
    this.monsterHitCooldowns.set(monster, GAME_CONFIG.monster.jumpScareCooldown);

    this.health = Math.max(0, this.health - GAME_CONFIG.monster.damagePerHit);
    this.activeJumpscare = {
      monster,
      variant: monster.getVariant(),
      elapsed: 0,
      knockout: this.health === 0,
    };

    if (this.health > 0) {
      this.pushStatus(
        `${this.getMonsterLabel(monster.getVariant())} hits you hard. Break away before its three-second attack cooldown ends.`,
      );
    }
  }

  private resetAfterMonsterHit(): void {
    this.player.teleport(this.level.spawn);
    this.health = GAME_CONFIG.player.healthMax;
    this.stamina = GAME_CONFIG.player.staminaMax * 0.45;
    this.activeCoffeeDrink = null;
    this.coffeeBoostRemaining = 0;
    this.carriedDrinkAnchor.visible = false;
    this.holdingPlate = false;
    this.plateRecipeId = null;
    this.plateIngredients.length = 0;
    this.platedRecipeId = null;
    this.touchingMonster = null;
    this.monsterState = this.unlockedMonsterState;
    this.pushStatus(
      'A pantry creature drags you down. You reset in the kitchen and lose the plate you were carrying.',
    );
  }

  private updateCarriedPlateDisplay(moving: boolean): void {
    const carriedRecipeId = this.holdingPlate ? this.platedRecipeId : null;

    if (carriedRecipeId !== this.carriedPlateRecipeId) {
      this.carriedPlateRecipeId = carriedRecipeId;

      if (this.carriedPlateModel) {
        this.carriedPlateAnchor.remove(this.carriedPlateModel);
        this.carriedPlateModel = null;
      }

      if (carriedRecipeId) {
        this.carriedPlateModel = createCarriedPlateModel(carriedRecipeId);
        this.carriedPlateAnchor.add(this.carriedPlateModel);
      }
    }

    this.carriedPlateAnchor.visible = Boolean(this.carriedPlateModel);
    if (!this.carriedPlateModel) {
      return;
    }

    const sway = moving ? 1 : 0.35;
    this.carriedPlateAnchor.position.set(
      0.56 + Math.sin(this.elapsed * 4.1) * 0.018 * sway,
      -0.48 + Math.abs(Math.sin(this.elapsed * 5.6)) * 0.012 * sway,
      -0.98,
    );
    this.carriedPlateAnchor.rotation.set(
      -0.08 + Math.sin(this.elapsed * 2.6) * 0.02 * sway,
      -0.34 + Math.cos(this.elapsed * 2.1) * 0.03 * sway,
      -0.14 + Math.sin(this.elapsed * 3.8) * 0.03 * sway,
    );
  }

  private getMonsterLabel(variant: MonsterVariant): string {
    switch (variant) {
      case 'seaweed':
        return 'The drowned kelp wretch';
      case 'spider':
        return 'The widow maw';
      case 'duck':
        return 'The carrion raptor';
    }
  }

  private pushStatus(message: string, duration = 2.8): void {
    this.transientStatus = message;
    this.transientStatusTime = duration;
  }

  private hasAllStartingDishSupplies(): boolean {
    return RECIPES.every((recipe) => recipe.ingredients.every((ingredientId) => this.hasItem(ingredientId)));
  }

  private resetKitchenStations(): void {
    this.machineJobs.clear();
    CHAPTER_ONE_MACHINE_IDS.forEach((stationId) => {
      this.level.stationAnimator.setMachineState(stationId, null);
    });
    this.level.stationAnimator.setPlateState({
      holdingPlate: false,
      recipeId: null,
      stagedIngredients: [],
      platedRecipeId: null,
    });
  }

  private resetChapterOneWorldState(): void {
    this.submittedRecipes.clear();
    this.chapterExitUnlocked = false;
    this.chapterExitMessageElapsed = 0;
    this.level.chapterExitDoor.visible = false;
    this.level.ingredients.forEach((ingredient) => {
      ingredient.collected = false;
      ingredient.root.visible = true;
    });
    this.resetKitchenStations();
  }

  private restoreChapterOneMonsters(): void {
    this.monsters.forEach((monster, index) => {
      monster.root.visible = true;
      monster.reposition(this.chapterOneMonsterHomes[index]);
    });
    this.monsters.forEach((monster) => {
      monster.update(0, this.player.getPosition(), this.isPlayerSafe());
    });
  }

  private beginChapterOne(): void {
    this.stopOfficeGameMode();
    this.chapterTwoActive = false;
    this.officeChapterActive = false;
    this.zombieModeActive = false;
    this.doomModeActive = false;
    this.chapterMenuOpen = false;
    this.chapterTwoCardTime = 0;
    this.chapterCardTitle = 'Chapter One';
    this.chapterCardBody = 'The kitchen challenge is live. Search the maze for raw ingredients, process them through the labeled machines, plate both rolls, and send them to the judges.';
    this.activeJumpscare = null;
    this.touchingMonster = null;
    this.monsterState = this.unlockedMonsterState;
    this.transientStatusTime = 0;
    this.chapterTwo.root.visible = false;
    this.officeChapter.root.visible = false;
    this.zombieMode.root.visible = false;
    this.chapterTwo.reset();
    this.officeChapter.reset();
    this.zombieMode.reset();
    this.doomMode.reset();
    this.chapterTwoSeatId = null;
    this.chapterTwoClimb = null;
    this.chapterTwoSlide = null;
    this.chapterTwo.setOccupiedSeat(null);
    this.officeChapterSeated = false;
    this.chapterTwoKeycards.clear();
    this.chapterTwoPuzzlePiecesCollected = 0;
    this.chapterTwoRedPuzzleSolved = false;
    this.chapterTwoEggsHeld = 0;
    this.chapterTwoEggsDeposited = 0;
    this.chapterTwoEggQuestStarted = false;
    this.chapterTwoEggQuestNoticeTime = 0;
    this.chapterTwoBlueBearsHeld = 0;
    this.chapterTwoBlueBearsReturned = 0;
    this.chapterTwoBearDialogueIndex = null;
    this.chapterTwoBearDialogueComplete = false;
    this.chapterTwoBearChoicePending = false;
    this.chapterTwoBearQuestAccepted = false;
    this.chapterTwoBearRefusalTimer = 0;
    this.chapterTwoDodoTrailActive = false;
    this.chapterTwoDodoTrailNoticeTime = 0;
    this.chapterTwoPowerOutageTriggered = false;
    this.chapterTwoPowerOutageNoticeTime = 0;
    this.chapterTwoDodoPowerRipSoundPlayed = false;
    this.chapterTwoDodoNightAttack = null;
    this.chapterTwoCoffeeJob = null;
    this.activeCoffeeDrink = null;
    this.coffeeBoostRemaining = 0;
    this.carriedDrinkAnchor.visible = false;
    this.officeBasketballHeld = false;
    this.officeBasketballAnchor.visible = false;
    this.officeChapter.setBasketballHeld(false);
    this.resetOfficeTabletState();
    this.zombieWeaponAnchor.visible = false;
    this.clearZombieBulletTracers();
    this.level.root.visible = true;
    this.doomMode.root.visible = false;
    this.inventory.clear();
    this.holdingPlate = false;
    this.plateRecipeId = null;
    this.platedRecipeId = null;
    this.plateIngredients.length = 0;
    this.health = GAME_CONFIG.player.healthMax;
    this.stamina = GAME_CONFIG.player.staminaMax;
    this.flashlight.setEnabled(false);
    this.zombieWeaponKick = 0;
    this.resetChapterOneWorldState();
    this.zombieControllers.forEach((zombie) => {
      zombie.applyDamage(9999);
      zombie.root.visible = false;
    });
    this.doomEnemies.forEach((enemy) => {
      enemy.applyDamage(9999);
      enemy.root.visible = false;
    });
    this.player.teleport(this.level.spawn);
    this.player.lookToward(this.level.pantryEntrancePosition, 1);
    this.restoreChapterOneMonsters();
    this.pushStatus(
      'Round one is live. The maze is stocked, not you. Pull raw ingredients out of the pantry, process them through the station machines, then plate the rolls and send them to the judges belt.',
    );
    this.resize();
  }

  private updateChapterExit(deltaSeconds: number): void {
    this.level.chapterExitDoor.visible = this.chapterExitUnlocked || this.chapterTwoActive;

    if (this.chapterTwoActive || this.officeChapterActive || this.zombieModeActive || this.doomModeActive) {
      return;
    }

    if (!this.chapterExitUnlocked && this.submittedRecipes.size === RECIPES.length) {
      this.chapterExitUnlocked = true;
      this.chapterExitMessageElapsed = 0;
      this.pushStatus('A thought cuts through the noise. There is a door near the seaweed in the maze.');
    }

    if (this.chapterExitUnlocked) {
      this.chapterExitMessageElapsed += deltaSeconds;
    }
  }

  private getChapterExitNoticeText(): string {
    if (!this.chapterExitUnlocked) {
      return '';
    }

    const visibleCharacters = Math.min(
      CHAPTER_EXIT_MESSAGE.length,
      Math.floor(this.chapterExitMessageElapsed * CHAPTER_EXIT_TYPE_SPEED),
    );

    return CHAPTER_EXIT_MESSAGE.slice(0, visibleCharacters);
  }

  private initializeChapterTwoStartingAccess(): void {
    this.chapterTwoKeycards.clear();
    this.chapterTwoPuzzlePiecesCollected = 0;
    this.chapterTwoRedPuzzleSolved = false;
    this.chapterTwoEggsHeld = 0;
    this.chapterTwoEggsDeposited = 0;
    this.chapterTwoEggQuestStarted = false;
    this.chapterTwoEggQuestNoticeTime = 0;
    this.chapterTwoBlueBearsHeld = 0;
    this.chapterTwoBlueBearsReturned = 0;
    this.chapterTwoBearDialogueIndex = null;
    this.chapterTwoBearDialogueComplete = false;
    this.chapterTwoBearChoicePending = false;
    this.chapterTwoBearQuestAccepted = false;
    this.chapterTwoBearRefusalTimer = 0;
    this.chapterTwoDodoTrailActive = false;
    this.chapterTwoDodoTrailNoticeTime = 0;
    this.chapterTwoPowerOutageTriggered = false;
    this.chapterTwoPowerOutageNoticeTime = 0;
    this.chapterTwoDodoPowerRipSoundPlayed = false;
    this.chapterTwoDodoNightAttack = null;

    if (CHAPTER_TWO_STARTS_WITH_RED_KEYCARD) {
      this.chapterTwoKeycards.add('red');
      this.chapterTwoPuzzlePiecesCollected = ENTRY_PUZZLE_PIECE_TOTAL;
      this.chapterTwoRedPuzzleSolved = true;
      this.chapterTwo.puzzlePieces.forEach((piece) => {
        piece.collected = true;
        piece.root.visible = false;
      });
    }

    this.chapterTwo.setEntryPuzzleState(
      this.chapterTwoPuzzlePiecesCollected,
      this.chapterTwoRedPuzzleSolved,
    );
    this.chapterTwo.setDodoPuzzleState(0, false);

    if (CHAPTER_TWO_STARTS_WITH_ALL_DODO_EGGS) {
      this.chapterTwoEggQuestStarted = true;
      this.chapterTwoEggsHeld = this.chapterTwo.dodoPuzzle.totalEggs;
      this.chapterTwo.eggPickups.forEach((egg) => {
        egg.collected = true;
        egg.root.visible = false;
      });
    }

    if (CHAPTER_TWO_STARTS_WITH_ALL_BLUE_BEARS) {
      this.chapterTwoBlueBearsHeld = CHAPTER_TWO_BLUE_BEAR_TOTAL;
      this.chapterTwoBearQuestAccepted = true;
      this.chapterTwo.blueBearPickups.forEach((bear) => {
        bear.collected = true;
        bear.root.visible = false;
      });
    }
  }

  private beginChapterTwo(): void {
    this.stopOfficeGameMode();
    this.chapterTwoActive = true;
    this.officeChapterActive = false;
    this.zombieModeActive = false;
    this.doomModeActive = false;
    this.chapterMenuOpen = false;
    this.chapterTwoCardTime = 3.6;
    this.chapterCardTitle = 'Chapter Two';
    this.chapterCardBody =
      CHAPTER_TWO_STARTS_WITH_ALL_DODO_EGGS && CHAPTER_TWO_STARTS_WITH_ALL_BLUE_BEARS
        ? 'The daycare lobby is still set up for families. Red access is live, every dodo egg is already in your hands, and every missing blue teddy bear is already with you too.'
        : CHAPTER_TWO_STARTS_WITH_ALL_DODO_EGGS
          ? 'The daycare lobby is still set up for families. Red access is live, and every dodo egg is already in your hands. Find the strange dodo and feed it every egg to reveal the blue key card.'
        : 'The daycare lobby is still set up for families. Red access is live now, but the egg hunt does not begin until you visit the strange dodo.';
    this.activeJumpscare = null;
    this.touchingMonster = null;
    this.monsterState = this.unlockedMonsterState;
    this.transientStatusTime = 0;
    this.level.root.visible = false;
    this.officeChapter.root.visible = false;
    this.zombieMode.root.visible = false;
    this.doomMode.root.visible = false;
    this.chapterTwo.reset();
    this.officeChapter.reset();
    this.zombieMode.reset();
    this.doomMode.reset();
    this.chapterTwoSeatId = null;
    this.chapterTwoClimb = null;
    this.chapterTwoSlide = null;
    this.chapterTwo.setOccupiedSeat(null);
    this.officeChapterSeated = false;
    this.officeBasketballHeld = false;
    this.officeBasketballAnchor.visible = false;
    this.officeChapter.setBasketballHeld(false);
    this.resetOfficeTabletState();
    this.initializeChapterTwoStartingAccess();
    this.chapterTwoCoffeeJob = null;
    this.activeCoffeeDrink = null;
    this.coffeeBoostRemaining = 0;
    this.carriedDrinkAnchor.visible = false;
    this.zombieWeaponAnchor.visible = false;
    this.clearZombieBulletTracers();
    this.chapterTwo.root.visible = true;
    this.inventory.clear();
    this.monsters.forEach((monster) => {
      monster.root.visible = false;
    });
    this.zombieControllers.forEach((zombie) => {
      zombie.applyDamage(9999);
      zombie.root.visible = false;
    });
    this.doomEnemies.forEach((enemy) => {
      enemy.applyDamage(9999);
      enemy.root.visible = false;
    });
    this.resetKitchenStations();
    this.holdingPlate = false;
    this.plateRecipeId = null;
    this.platedRecipeId = null;
    this.plateIngredients.length = 0;
    this.health = GAME_CONFIG.player.healthMax;
    this.stamina = GAME_CONFIG.player.staminaMax;
    this.flashlight.setEnabled(false);
    this.zombieWeaponKick = 0;
    this.player.teleport(this.chapterTwo.spawn);
    const chapterTwoEntryDoor = this.chapterTwo.securityDoors.find((door) => door.id === 'lobby-north');
    if (chapterTwoEntryDoor) {
      this.player.lookToward(chapterTwoEntryDoor.position, 1);
    }
    this.pushStatus(
      CHAPTER_TWO_STARTS_WITH_RED_KEYCARD
        ? CHAPTER_TWO_STARTS_WITH_ALL_DODO_EGGS && CHAPTER_TWO_STARTS_WITH_ALL_BLUE_BEARS
          ? 'Chapter two begins in the daycare lobby. The red key card is already in your inventory, every dodo egg is already with you, and every missing blue teddy bear is already in your hands too.'
          : CHAPTER_TWO_STARTS_WITH_ALL_DODO_EGGS
            ? 'Chapter two begins in the daycare lobby. The red key card is already in your inventory, and every dodo egg is already with you. Get to the dodo and feed it every egg for blue access.'
          : 'Chapter two begins in the daycare lobby. The red key card is already in your inventory, so red access is live. Find the dodo first to begin the egg hunt.'
        : 'Chapter two begins in the daycare lobby. Search the furnished opening rooms for the hidden red puzzle pieces and rebuild the first key card at the right playroom table.',
    );
    this.monsters.forEach((monster) => {
      monster.update(0, this.level.spawn, true);
    });
    this.resize();
  }

  private beginZombieMode(): void {
    this.stopOfficeGameMode();
    this.chapterTwoActive = false;
    this.officeChapterActive = false;
    this.zombieModeActive = true;
    this.doomModeActive = false;
    this.chapterMenuOpen = false;
    this.chapterTwoCardTime = ZOMBIE_CARD_DURATION;
    this.chapterCardTitle = 'Zombie First Person Shooter';
    this.chapterCardBody =
      'The forest goes dark every night. Use the daylight to upgrade the four barricades, then hold the clearing with the pistol and shotgun when the zombies come in.';
    this.activeJumpscare = null;
    this.touchingMonster = null;
    this.monsterState = this.unlockedMonsterState;
    this.transientStatusTime = 0;
    this.level.root.visible = false;
    this.chapterTwo.root.visible = false;
    this.officeChapter.root.visible = false;
    this.doomMode.root.visible = false;
    this.zombieMode.root.visible = true;
    this.chapterTwo.reset();
    this.officeChapter.reset();
    this.zombieMode.reset();
    this.doomMode.reset();
    this.chapterTwoSeatId = null;
    this.chapterTwoClimb = null;
    this.chapterTwoSlide = null;
    this.chapterTwo.setOccupiedSeat(null);
    this.officeChapterSeated = false;
    this.chapterTwoKeycards.clear();
    this.chapterTwoPuzzlePiecesCollected = 0;
    this.chapterTwoRedPuzzleSolved = false;
    this.chapterTwoEggsHeld = 0;
    this.chapterTwoEggsDeposited = 0;
    this.chapterTwoEggQuestStarted = false;
    this.chapterTwoEggQuestNoticeTime = 0;
    this.chapterTwoBlueBearsHeld = 0;
    this.chapterTwoBlueBearsReturned = 0;
    this.chapterTwoBearDialogueIndex = null;
    this.chapterTwoBearDialogueComplete = false;
    this.chapterTwoBearChoicePending = false;
    this.chapterTwoBearQuestAccepted = false;
    this.chapterTwoBearRefusalTimer = 0;
    this.chapterTwoCoffeeJob = null;
    this.activeCoffeeDrink = null;
    this.coffeeBoostRemaining = 0;
    this.carriedDrinkAnchor.visible = false;
    this.officeBasketballHeld = false;
    this.officeBasketballAnchor.visible = false;
    this.officeChapter.setBasketballHeld(false);
    this.resetOfficeTabletState();
    this.clearZombieBulletTracers();
    this.inventory.clear();
    this.monsters.forEach((monster) => {
      monster.root.visible = false;
    });
    this.doomEnemies.forEach((enemy) => {
      enemy.applyDamage(9999);
      enemy.root.visible = false;
    });
    this.zombieControllers.forEach((zombie) => {
      zombie.applyDamage(9999);
      zombie.root.visible = false;
    });
    this.resetKitchenStations();
    this.holdingPlate = false;
    this.plateRecipeId = null;
    this.platedRecipeId = null;
    this.plateIngredients.length = 0;
    this.health = GAME_CONFIG.player.healthMax;
    this.stamina = GAME_CONFIG.player.staminaMax;
    this.flashlight.setEnabled(false);
    this.zombieWeapon = 'pistol';
    this.zombieAmmo.pistol = ZOMBIE_STARTING_AMMO.pistol;
    this.zombieAmmo.shotgun = ZOMBIE_STARTING_AMMO.shotgun;
    this.zombieFireCooldown = 0;
    this.zombieWeaponKick = 0;
    this.zombieKills = 0;
    this.zombieScrap = 40;
    this.zombieDay = 1;
    this.zombieNightActive = false;
    this.zombiePhaseRemaining = ZOMBIE_DAY_DURATION;
    this.zombieNightSpawnRemaining = 0;
    this.zombieSpawnCooldown = 0;
    ZOMBIE_DEFENSE_IDS.forEach((id) => {
      this.zombieDefenseLevels.set(id, 1);
      this.zombieDefenseHealth.set(id, ZOMBIE_DEFENSE_HEALTH_BY_LEVEL[1]);
      this.zombieMode.setDefenseState(id, 1, 1);
    });
    this.player.teleport(this.zombieMode.spawn);
    this.player.lookToward(this.zombieMode.center, 1);
    this.ensureZombieWeaponVisual();
    this.zombieWeaponAnchor.visible = this.player.isLocked();
    this.pushStatus(
      'Day 1 in the forest. Left click fires, 1 and 2 swap weapons, and E upgrades the barricades before the first night hits.',
      3.6,
    );
    this.resize();
  }

  private beginDoomMode(): void {
    this.stopOfficeGameMode();
    this.chapterTwoActive = false;
    this.officeChapterActive = false;
    this.zombieModeActive = false;
    this.doomModeActive = true;
    this.chapterMenuOpen = false;
    this.chapterTwoCardTime = DOOM_CARD_DURATION;
    this.chapterCardTitle = 'Doom Run';
    this.chapterCardBody =
      'A retro techbase run. Move fast, rip through the demons, grab the red, yellow, and blue key cards, and hit the exit switch.';
    this.activeJumpscare = null;
    this.touchingMonster = null;
    this.monsterState = this.unlockedMonsterState;
    this.transientStatusTime = 0;
    this.level.root.visible = false;
    this.chapterTwo.root.visible = false;
    this.officeChapter.root.visible = false;
    this.zombieMode.root.visible = false;
    this.doomMode.root.visible = true;
    this.chapterTwo.reset();
    this.officeChapter.reset();
    this.zombieMode.reset();
    this.doomMode.reset();
    this.chapterTwoSeatId = null;
    this.chapterTwoClimb = null;
    this.chapterTwoSlide = null;
    this.chapterTwo.setOccupiedSeat(null);
    this.officeChapterSeated = false;
    this.chapterTwoKeycards.clear();
    this.chapterTwoPuzzlePiecesCollected = 0;
    this.chapterTwoRedPuzzleSolved = false;
    this.chapterTwoEggsHeld = 0;
    this.chapterTwoEggsDeposited = 0;
    this.chapterTwoEggQuestStarted = false;
    this.chapterTwoEggQuestNoticeTime = 0;
    this.chapterTwoBlueBearsHeld = 0;
    this.chapterTwoBlueBearsReturned = 0;
    this.chapterTwoBearDialogueIndex = null;
    this.chapterTwoBearDialogueComplete = false;
    this.chapterTwoBearChoicePending = false;
    this.chapterTwoBearQuestAccepted = false;
    this.chapterTwoBearRefusalTimer = 0;
    this.chapterTwoCoffeeJob = null;
    this.activeCoffeeDrink = null;
    this.coffeeBoostRemaining = 0;
    this.carriedDrinkAnchor.visible = false;
    this.officeBasketballHeld = false;
    this.officeBasketballAnchor.visible = false;
    this.officeChapter.setBasketballHeld(false);
    this.resetOfficeTabletState();
    this.inventory.clear();
    this.clearZombieBulletTracers();
    this.resetKitchenStations();
    this.holdingPlate = false;
    this.plateRecipeId = null;
    this.platedRecipeId = null;
    this.plateIngredients.length = 0;
    this.health = GAME_CONFIG.player.healthMax;
    this.stamina = GAME_CONFIG.player.staminaMax;
    this.doomArmor = 0;
    this.doomKeys.clear();
    this.doomWeaponsOwned.clear();
    this.doomWeaponsOwned.add('pistol');
    this.doomWeapon = 'pistol';
    this.doomAmmo.pistol = DOOM_STARTING_AMMO.pistol;
    this.doomAmmo.shotgun = DOOM_STARTING_AMMO.shotgun;
    this.doomThreatEyeIntensity = 0;
    this.flashlight.setEnabled(false);
    this.zombieFireCooldown = 0;
    this.zombieWeaponKick = 0;
    this.monsters.forEach((monster) => {
      monster.root.visible = false;
    });
    this.zombieControllers.forEach((zombie) => {
      zombie.applyDamage(9999);
      zombie.root.visible = false;
    });
    this.doomEnemies.forEach((enemy) => {
      enemy.applyDamage(9999);
      enemy.root.visible = false;
    });
    const occupiedDoomSpawns: Vector3[] = [];
    this.doomMode.enemySpawns.forEach((spawn, index) => {
      const enemy = this.doomEnemies[index];
      if (!enemy) {
        return;
      }
      const safeSpawn = this.getSafeDoomEnemySpawn(spawn.position, spawn.variant, occupiedDoomSpawns);
      occupiedDoomSpawns.push(safeSpawn.clone());
      enemy.spawn(safeSpawn, spawn.variant, 1);
    });
    this.player.teleport(this.doomMode.spawn);
    this.player.lookToward(this.doomMode.lookTarget, 1);
    this.ensureZombieWeaponVisual();
    this.zombieWeaponAnchor.visible = this.player.isLocked();
    this.pushStatus(
      'Techbase run live. Move fast, grab the shotgun, find the red, yellow, and blue keys, and hit the exit switch.',
      3.2,
    );
    this.resize();
  }

  private beginOfficeChapter(): void {
    this.stopOfficeGameMode();
    this.chapterTwoActive = false;
    this.officeChapterActive = true;
    this.zombieModeActive = false;
    this.doomModeActive = false;
    this.chapterMenuOpen = false;
    this.chapterTwoCardTime = 3.6;
    this.chapterCardTitle = 'Chapter Three';
    this.chapterCardBody =
      'The office doors now lead through side hallways into one wide party room, plus a new top-right hall to a second party room with a pirate fox stage and a ticket basketball game.';
    this.activeJumpscare = null;
    this.touchingMonster = null;
    this.monsterState = this.unlockedMonsterState;
    this.transientStatusTime = 0;
    this.level.root.visible = false;
    this.chapterTwo.root.visible = false;
    this.officeChapter.root.visible = true;
    this.zombieMode.root.visible = false;
    this.doomMode.root.visible = false;
    this.chapterTwo.reset();
    this.officeChapter.reset();
    this.zombieMode.reset();
    this.doomMode.reset();
    this.chapterTwoSeatId = null;
    this.chapterTwoClimb = null;
    this.chapterTwoSlide = null;
    this.chapterTwo.setOccupiedSeat(null);
    this.officeChapterSeated = false;
    this.chapterTwoKeycards.clear();
    this.chapterTwoPuzzlePiecesCollected = 0;
    this.chapterTwoRedPuzzleSolved = false;
    this.chapterTwoEggsHeld = 0;
    this.chapterTwoEggsDeposited = 0;
    this.chapterTwoEggQuestStarted = false;
    this.chapterTwoEggQuestNoticeTime = 0;
    this.chapterTwoBlueBearsHeld = 0;
    this.chapterTwoBlueBearsReturned = 0;
    this.chapterTwoBearDialogueIndex = null;
    this.chapterTwoBearDialogueComplete = false;
    this.chapterTwoBearChoicePending = false;
    this.chapterTwoBearQuestAccepted = false;
    this.chapterTwoBearRefusalTimer = 0;
    this.officeChapterTickets = 0;
    this.officeBasketballHeld = false;
    this.chapterTwoCoffeeJob = null;
    this.activeCoffeeDrink = null;
    this.coffeeBoostRemaining = 0;
    this.carriedDrinkAnchor.visible = false;
    this.officeBasketballAnchor.visible = false;
    this.officeChapter.setBasketballHeld(false);
    this.resetOfficeTabletState();
    this.zombieWeaponAnchor.visible = false;
    this.clearZombieBulletTracers();
    this.inventory.clear();
    this.resetKitchenStations();
    this.holdingPlate = false;
    this.plateRecipeId = null;
    this.platedRecipeId = null;
    this.plateIngredients.length = 0;
    this.health = GAME_CONFIG.player.healthMax;
    this.stamina = GAME_CONFIG.player.staminaMax;
    this.flashlight.setEnabled(false);
    this.zombieWeaponKick = 0;
    this.monsters.forEach((monster) => {
      monster.root.visible = false;
    });
    this.zombieControllers.forEach((zombie) => {
      zombie.applyDamage(9999);
      zombie.root.visible = false;
    });
    this.doomEnemies.forEach((enemy) => {
      enemy.applyDamage(9999);
      enemy.root.visible = false;
    });
    this.player.teleport(this.officeChapter.spawn);
    this.player.lookToward(this.officeChapter.lookTarget, 1);
    this.pushStatus(
      'Chapter three loaded. The top-right corner of the party room now opens into a second party room with a pirate fox stage, hidden tickets, and basketball.',
      3.2,
    );
    this.resize();
  }
}
