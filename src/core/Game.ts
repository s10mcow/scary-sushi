import {
  ACESFilmicToneMapping,
  BoxGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
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
  PointLight,
  Quaternion,
  Raycaster,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Texture,
  TorusGeometry,
  Vector3,
  VideoTexture,
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
import { createChapterFour, type ChapterFourData } from '../scene/createChapterFour';
import { createChapterFive, type ChapterFiveData } from '../scene/createChapterFive';
import { createChapterSix, type ChapterSixData, type ChapterSixItemType } from '../scene/createChapterSix';
import { createChapterSeven, type ChapterSevenData } from '../scene/createChapterSeven';
import { createChapterEight, type ChapterEightData } from '../scene/createChapterEight';
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
import { InputController, type MovementState, type WeaponSelectId } from '../systems/input/InputController';
import { VoiceInputController } from '../systems/input/VoiceInputController';
import { BearJumpScareAudio } from '../systems/audio/BearJumpScareAudio';
import { CoffeeMachineAudio } from '../systems/audio/CoffeeMachineAudio';
import { GameplaySfxAudio, type OfficeJumpscareCue } from '../systems/audio/GameplaySfxAudio';
import { FOXY_PLAY_LINE, FoxyPlayAudio } from '../systems/audio/FoxyPlayAudio';
import { LobbyCrashAudio } from '../systems/audio/LobbyCrashAudio';
import { PartyShowAudio } from '../systems/audio/PartyShowAudio';
import { PowerEventAudio } from '../systems/audio/PowerEventAudio';
import { DoomEnemyController, type DoomEnemyVariant } from '../systems/doom/DoomEnemyController';
import { FlashlightController } from '../systems/player/FlashlightController';
import { PlayerController, type PlayerMovementOptions } from '../systems/player/PlayerController';
import { ZombieController } from '../systems/zombie/ZombieController';
import {
  createHud,
  type HudChapterId,
  type HudChapterFiveMonitorAction,
  type HudJumpScareVariant,
  type MinecraftInventoryAction,
  type OfficeCameraPuppetHudPhase,
  type OfficeDeathNoticePhase,
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
const START_IN_CHAPTER_THREE = false;
const START_IN_CHAPTER_FOUR = false;
const START_IN_CHAPTER_FIVE = false;
const START_IN_CHAPTER_SIX = false;
const START_IN_CHAPTER_SEVEN = true;
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
const OFFICE_DELETED_CAMERA_SANDBOX_STORAGE_KEY = 'scary-sushi.chapter3-copy.deleted-cameras';
const OFFICE_CHAPTER_COPY_OFFSET_X = 108;
const OFFICE_CHAPTER_COPY_OFFSET_Z = 0;

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
type OfficeFuseWireColor = 'green' | 'blue' | 'red';
type OfficeGameModeDifficulty = OfficeModeMenuDifficulty;
type OfficeCameraPuppetPhase = 'idle' | OfficeCameraPuppetHudPhase;

interface OfficeSpeechRecognitionResultEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface OfficeSpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: OfficeSpeechRecognitionResultEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

type OfficeSpeechRecognitionConstructor = new () => OfficeSpeechRecognitionLike;

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

interface ActiveOfficeEmployeeElevatorRide {
  elapsed: number;
  duration: number;
  startPosition: Vector3;
  endPosition: Vector3;
  lookTarget: Vector3;
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
  gameModeDeath: boolean;
  cameraCaptureVideoElement: HTMLVideoElement | null;
  cameraCaptureTexture: Texture | VideoTexture | null;
  cameraCaptureMaterial: MeshBasicMaterial | null;
  materialStates: OfficeCutsceneMaterialState[];
}

interface OfficeCutsceneMaterialState {
  material: MeshBasicMaterial | MeshStandardMaterial;
  color: Color;
  emissive?: Color;
  emissiveIntensity?: number;
  eye: boolean;
}

type OfficePrizeItemId = 'glass' | 'tiny-bear' | 'lollipop' | 'duck-toy' | 'stuffie';
type OfficeThrowableKind = 'glass' | 'tiny-bear';

interface ActiveOfficeGlassThrow {
  root: Group;
  velocity: Vector3;
  elapsed: number;
  crashElapsed: number;
  crashed: boolean;
  kind: OfficeThrowableKind;
}

interface MicrophoneSoundRecording {
  id: string;
  dataUrl: string;
  createdAt: number;
}

type CameraToolCaptureKind = 'picture' | 'video';

interface CameraToolCapture {
  id: string;
  kind: CameraToolCaptureKind;
  dataUrl: string;
  createdAt: number;
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
  state: 'stage' | 'wander' | 'chase' | 'rush' | 'creep' | 'door' | 'door-breach' | 'retreat' | 'distracted' | 'distracted-watch' | 'calm-watch' | 'off-balance' | 'foxy-leap' | 'vent-chase';
  waitTimer: number;
  offBalanceTimer: number;
  jukeCount: number;
  foxyLeapTimer: number;
  foxyLeapStartPosition: Vector3;
  foxyLeapTargetPosition: Vector3;
  doorBreachTimer: number;
  doorBreachDoorId: 'left' | 'right' | null;
  doorLingerSoundPlayed: boolean;
  doorLingerLaughPlayed: boolean;
  attackCooldown: number;
  lostSightTimer: number;
  stuckTimer: number;
  progressStallTimer: number;
  detourTarget: Vector3 | null;
  detourTimer: number;
  distractionTarget: Vector3 | null;
  lastKnownPlayerPosition: Vector3;
  chaseCommitTarget: Vector3;
  chaseCommitTimer: number;
  chaseCommitCooldown: number;
  chaseGiveUpTimer: number;
  calmProximityTimer: number;
  quackyMouthScareTimer: number;
  insultStareTimer: number;
  insultChargeTimer: number;
  insultCooldown: number;
  cameraStareTimer: number;
  cameraStareCooldown: number;
  cameraStareCameraId: number | null;
  senseTimer: number;
  walkCyclePhase: number;
  walkCycleSpeedMultiplier: number;
  walkCycleStrideMultiplier: number;
  walkCycleArmMultiplier: number;
  walkCycleSideMultiplier: number;
  walkCycleBounceMultiplier: number;
  cachedCanSeePlayer: boolean;
  cachedNoiseResponse: OfficeGameModeNoiseResponse;
  cachedBlockedDoorId: 'left' | 'right' | null;
}

interface ActiveOfficeDoorSpark {
  mesh: Mesh;
  velocity: Vector3;
  elapsed: number;
  duration: number;
}

type OfficeGameModeNoiseResponse = 'none' | 'investigate' | 'rush';

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
    attackRange: 0.28,
  },
  normal: {
    label: 'Normal',
    powerMultiplier: 1,
    detectionRange: 6.2,
    lostSightSeconds: 5,
    walkSpeed: 1.05,
    chaseSpeed: 5.65,
    attackRange: 0.3,
  },
  hard: {
    label: 'Hard',
    powerMultiplier: 1.36,
    detectionRange: 9.4,
    lostSightSeconds: 5,
    walkSpeed: 1.24,
    chaseSpeed: 6.05,
    attackRange: 0.32,
  },
};

const OFFICE_GAME_MODE_CAMERA_DRAIN_PER_SECOND = 0.42;
const OFFICE_GAME_MODE_CLOSED_DOOR_DRAIN_PER_SECOND = 0.265;
const OFFICE_GAME_MODE_IDLE_DRAIN_PER_SECOND = 0.025;
const OFFICE_GAME_MODE_TOTAL_NIGHTS = 5;
const OFFICE_GAME_MODE_NIGHT_SECONDS = 5 * 60;
const OFFICE_GAME_MODE_DAY_SECONDS = 3 * 60;
const OFFICE_FUSE_WIRE_COLORS: OfficeFuseWireColor[] = ['green', 'blue', 'red'];
const OFFICE_VENT_BOY_STARE_LIMIT_SECONDS = 2.65;
const OFFICE_VENT_BOY_SPEED = 0.82;
const OFFICE_GAME_MODE_CHASE_MATCH_SPEED = GAME_CONFIG.player.sprintSpeed * 1.06;
const OFFICE_FOXY_RUSH_SPEED = GAME_CONFIG.player.sprintSpeed * 1.1;
const OFFICE_PLAYER_SPRINT_SPEED_MULTIPLIER = 1.22;
const OFFICE_PLAYER_STRAFE_SPEED_MULTIPLIER = 1.18;
const OFFICE_PLAYER_SPRINT_DODGE_STRAFE_MULTIPLIER = 1.72;
const OFFICE_PLAYER_CLOSE_DODGE_STRAFE_MULTIPLIER = 2.28;
const OFFICE_PLAYER_CLOSE_DODGE_RANGE = 6.1;
const OFFICE_CAMERA_PUPPET_CAMERA_FAIL_SECONDS = 2.25;
const OFFICE_CAMERA_PUPPET_REOPEN_SECONDS = 2;
const OFFICE_CAMERA_PUPPET_JUMPSCARE_SECONDS = 1.35;
const OFFICE_FREDDY_POWER_OUT_ATTACK_DELAY = 12.4;
const OFFICE_NOISE_INVESTIGATE_THRESHOLD = 0.18;
const OFFICE_NOISE_RUSH_THRESHOLD = 0.68;
const OFFICE_VOICE_HEAR_MIN_LEVEL = 0.04;
const OFFICE_VOICE_NOISE_MULTIPLIER = 2.05;
const OFFICE_VOICE_RANGE_MIN_MULTIPLIER = 1.45;
const OFFICE_VOICE_RANGE_MAX_MULTIPLIER = 2.45;
const OFFICE_VOICE_YELL_RANGE_MULTIPLIER = 2.35;
const OFFICE_VOICE_INVESTIGATE_THRESHOLD = 0.09;
const OFFICE_VOICE_RUSH_THRESHOLD = 0.46;
const OFFICE_STAGE_YELL_LEVEL = 0.48;
const OFFICE_YELL_ATTRACT_RANGE = 34;
const OFFICE_STAGE_VOICE_RELEASE_COOLDOWN = 2.4;
const OFFICE_STAGE_YELL_RELEASE_CHANCE = 0.25;
const OFFICE_CHARACTER_SPEECH_RANGE = 9.5;
const OFFICE_CHASE_GIVE_UP_SECONDS = 14;
const OFFICE_CALM_WATCH_CHANCE_PER_SECOND = 0.24;
const OFFICE_CALM_WATCH_MIN_SECONDS = 2.1;
const OFFICE_CALM_WATCH_MAX_SECONDS = 4.2;
const OFFICE_CALM_WATCH_MAX_VOICE_LEVEL = 0.08;
const OFFICE_CALM_WATCH_MAX_NOISE_LEVEL = 0.18;
const OFFICE_CALM_PROXIMITY_CHASE_SECONDS = 60;
const OFFICE_CALM_PROXIMITY_RANGE = 5.8;
const OFFICE_INSULT_STARE_SECONDS = 1.65;
const OFFICE_INSULT_CHARGE_SECONDS = 10;
const OFFICE_INSULT_COOLDOWN_SECONDS = 12;
const OFFICE_INSULT_PHRASES = [
  "you're slow",
  'you are slow',
  'your slow',
  "you're ugly",
  'you are ugly',
  'your ugly',
  "you're stupid",
  'you are stupid',
  'your stupid',
  "you're dumb",
  'you are dumb',
  'your dumb',
  "you're weird",
  'you are weird',
  'your weird',
  "you're creepy",
  'you are creepy',
  'your creepy',
  "you're annoying",
  'you are annoying',
  'your annoying',
  'shut up',
  'i hate you',
  'hate you',
  'go away',
  'get lost',
  'idiot',
  'loser',
  'trash',
  'garbage',
  'stupid duck',
  'stupid bunny',
  'stupid bear',
  'bad robot',
  'dumb robot',
  'kill you',
  'destroy you',
  'freaky',
  'get freaky',
  'getting freaky',
  'bout to get freaky',
  'about to get freaky',
  'creep on you',
  'touch you',
  'touching you',
  'kiss you',
  'sexy',
  'nasty',
  'sus',
  'damn',
  'crap',
  'hell',
  'foxy woxy',
  'quacky wacky',
  'bori boring',
  'fluffle fluff',
] as const;
const OFFICE_FOXY_PIRATE_APPROVAL_PHRASES = [
  'ahoy',
  'matey',
  'captain',
  'sir',
  'captain foxy',
  'mister foxy',
  'mr foxy',
  'pirate',
  'yar',
  'yarr',
  'arr',
  'arrr',
  'treasure',
  'ship',
  'sail',
  'sea',
  'crew',
  'hello foxy',
  'hi foxy',
  'hey foxy',
  'please',
  'thank you',
  'nice',
  'cool',
] as const;
const OFFICE_FOXY_ADDRESSING_PHRASES = [
  'foxy',
  'fox',
  'pirate',
  'you',
  "you're",
  'your',
  'hey',
  'hi',
  'hello',
] as const;
const OFFICE_DOOR_BREACH_CHANCE = 0.5;
const OFFICE_DOOR_BREACH_SECONDS = 4.75;
const OFFICE_DOOR_LINGER_SECONDS = 2.8;
const OFFICE_DOOR_LINGER_LAUGH_DELAY = 0.95;
const OFFICE_DOOR_LINGER_STEP_IN_CHANCE = 0.82;
const OFFICE_ANIMATRONIC_JUKE_STUMBLE_SECONDS = 1.08;
const OFFICE_ANIMATRONIC_JUKE_RANGE = 2.35;
const OFFICE_ANIMATRONIC_JUKE_GIVE_UP_THRESHOLD = 5;
const OFFICE_ANIMATRONIC_JUKE_GIVE_UP_RECORDING_ID = '007';
const OFFICE_FOXY_LEAP_SECONDS = 1.18;
const OFFICE_FOXY_LEAP_CHANCE = 0.5;
const OFFICE_VENT_CHASE_CHANCE = 0.5;
const OFFICE_VENT_CHASE_DELAY_SECONDS = 5;
const OFFICE_VENT_CHASE_SPEED = 1.32;
const OFFICE_ANIMATRONIC_DOOR_LAUGH_RECORDING_ID = '003';
const OFFICE_DEATH_DIED_NOTICE_SECONDS = 1.45;
const OFFICE_DEATH_FIRED_NOTICE_SECONDS = 4.8;
const MICROPHONE_SOUND_RECORDINGS_STORAGE_KEY = 'scary-sushi:microphone-sound-tool:recordings';
const MICROPHONE_SOUND_NEXT_INDEX_STORAGE_KEY = 'scary-sushi:microphone-sound-tool:next-index';
const MICROPHONE_SOUND_LEGACY_STORAGE_KEY = 'scary-sushi:microphone-sound-tool:latest';
const MICROPHONE_SOUND_MAX_RECORDINGS = 999;
const MICROPHONE_JUMPSCARE_RECORDING_ID: string | null = '010';
const OFFICE_THROW_SOUND_RECORDING_ID = '006';
const OFFICE_STUFFIE_SOUND_RECORDING_ID = '004';
const OFFICE_DOOR_OPEN_SOUND_RECORDING_ID = '012';
const OFFICE_DOOR_CLOSE_SOUND_RECORDING_ID = '013';
const CAMERA_TOOL_CAPTURES_STORAGE_KEY = 'scary-sushi:camera-tool:captures';
const CAMERA_TOOL_NEXT_PICTURE_INDEX_STORAGE_KEY = 'scary-sushi:camera-tool:next-picture-index';
const CAMERA_TOOL_NEXT_VIDEO_INDEX_STORAGE_KEY = 'scary-sushi:camera-tool:next-video-index';
const CAMERA_TOOL_MAX_CAPTURES = 24;
const OFFICE_JUMPSCARE_CAMERA_CAPTURE_ASSIGNMENTS: Partial<Record<OfficeJumpscareAnimatronic, {
  kind: CameraToolCaptureKind;
  id: string;
}>> = {
};
const OFFICE_JUMPSCARE_VIDEO_ASSET_ASSIGNMENTS: Partial<Record<OfficeJumpscareAnimatronic, {
  src: string;
  label: string;
}>> = {
};
const OFFICE_BORI_STAGE_WANDER_CHANCE = 0.1;
const OFFICE_DISTRACTION_RANGE = 38;
const OFFICE_DISTRACTION_LOOK_SECONDS = 1.25;
const OFFICE_GLASS_SHARD_VISIBLE_SECONDS = 5;
const OFFICE_TINY_BEAR_VISIBLE_SECONDS = 4.2;
const OFFICE_LOLLIPOP_BOOST_SECONDS = 10;
const OFFICE_LOLLIPOP_SPEED_MULTIPLIER = 2;
const OFFICE_PRIZE_ITEM_LABELS: Record<OfficePrizeItemId, string> = {
  glass: 'Glass Cup',
  'tiny-bear': 'Tiny Bear',
  lollipop: 'Lollipop',
  'duck-toy': 'Duck Toy',
  stuffie: 'Stuffie',
};
const OFFICE_PRIZE_HOTBAR_SLOTS: Array<{ slot: number; item: OfficePrizeItemId }> = [
  { slot: 5, item: 'glass' },
  { slot: 6, item: 'tiny-bear' },
  { slot: 7, item: 'lollipop' },
  { slot: 8, item: 'duck-toy' },
  { slot: 9, item: 'stuffie' },
];
const OFFICE_GAME_MODE_OFFICE_CENTER = new Vector3(-240, GAME_CONFIG.player.height, 184);
const OFFICE_GAME_MODE_OFFICE_SPAWN = new Vector3(-240, GAME_CONFIG.player.height, 186.2);
const OFFICE_GAME_MODE_OFFICE_LOOK_TARGET = new Vector3(-240, GAME_CONFIG.player.height, 181.2);
const OFFICE_GAME_MODE_LEFT_DOOR_WATCH = new Vector3(-248.5, GAME_CONFIG.player.height, 184.9);
const OFFICE_GAME_MODE_RIGHT_DOOR_WATCH = new Vector3(-231.5, GAME_CONFIG.player.height, 184.9);
const OFFICE_GAME_MODE_BALL_PIT_CENTER = new Vector3(-216.7, GAME_CONFIG.player.height, 141.2);
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
    OFFICE_GAME_MODE_RIGHT_DOOR_WATCH.clone(),
  ],
  fluffle: [
    new Vector3(-240, GAME_CONFIG.player.height, 160.4),
    new Vector3(-229.2, GAME_CONFIG.player.height, 159.2),
    new Vector3(-224.4, GAME_CONFIG.player.height, 149.2),
    OFFICE_GAME_MODE_BALL_PIT_CENTER.clone(),
    new Vector3(-223.3, GAME_CONFIG.player.height, 145.2),
    new Vector3(-212.1, GAME_CONFIG.player.height, 149.2),
    new Vector3(-203.8, GAME_CONFIG.player.height, 159.2),
    OFFICE_GAME_MODE_RIGHT_DOOR_WATCH.clone(),
    OFFICE_GAME_MODE_LEFT_DOOR_WATCH.clone(),
    new Vector3(-237.8, GAME_CONFIG.player.height, 160.4),
  ],
  bori: [
    new Vector3(-235.4, GAME_CONFIG.player.height, 160.9),
    new Vector3(-239.5, GAME_CONFIG.player.height, 166.5),
    new Vector3(-235.2, GAME_CONFIG.player.height, 161),
    new Vector3(-247.8, GAME_CONFIG.player.height, 171.2),
    new Vector3(-254.9, GAME_CONFIG.player.height, 171),
    OFFICE_GAME_MODE_LEFT_DOOR_WATCH.clone(),
    new Vector3(-231.7, GAME_CONFIG.player.height, 176.8),
    OFFICE_GAME_MODE_RIGHT_DOOR_WATCH.clone(),
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
const OFFICE_GAME_MODE_SEPARATION_RADIUS = 1.22;
const OFFICE_GAME_MODE_SEPARATION_STRENGTH = 0.82;
const OFFICE_GAME_MODE_STAGE_LIFT = 0.07;
const OFFICE_GAME_MODE_LINE_SAMPLE_DISTANCE = 0.55;
const OFFICE_GAME_MODE_PATH_SAMPLE_DISTANCE = 0.52;
const OFFICE_GAME_MODE_STAGE_SENSE_INTERVAL = 0.38;
const OFFICE_GAME_MODE_WANDER_SENSE_INTERVAL = 0.24;
const OFFICE_GAME_MODE_CHASE_SENSE_INTERVAL = 1.05;
const OFFICE_GAME_MODE_CHASE_COMMIT_RANGE = 6.4;
const OFFICE_GAME_MODE_CHASE_COMMIT_SECONDS = 1.75;
const OFFICE_GAME_MODE_CHASE_COMMIT_DISTANCE = 16.5;
const OFFICE_GAME_MODE_CHASE_COMMIT_COOLDOWN = 0.42;
const OFFICE_GAME_MODE_CAMERA_STARE_RANGE = 18.5;
const OFFICE_GAME_MODE_CAMERA_STARE_VIEW_DOT = 0.32;
const OFFICE_GAME_MODE_CAMERA_STARE_CHANCE_PER_SECOND = 0.62;
const OFFICE_GAME_MODE_CAMERA_STARE_MIN_SECONDS = 2.2;
const OFFICE_GAME_MODE_CAMERA_STARE_MAX_SECONDS = 4.4;
const OFFICE_GAME_MODE_CAMERA_STARE_COOLDOWN_MIN_SECONDS = 10;
const OFFICE_GAME_MODE_CAMERA_STARE_COOLDOWN_MAX_SECONDS = 18;
const OFFICE_GAME_MODE_DIRECT_LOOKAHEAD = OFFICE_GAME_MODE_COLLISION_RADIUS * 1.35;
const OFFICE_GAME_MODE_MOVE_ANGLES = [0.42, -0.42, 0.82, -0.82, Math.PI / 2, -Math.PI / 2, Math.PI] as const;
const OFFICE_GAME_MODE_DETOUR_SIDES = [-1, 1] as const;
const OFFICE_GAME_MODE_DETOUR_FORWARD_DISTANCES = [0.75, 1.25, 1.85] as const;
const OFFICE_GAME_MODE_DETOUR_SIDE_DISTANCES = [0.9, 1.45, 2.1, 2.85] as const;
const OFFICE_GAME_MODE_DETOUR_ANGLES = [0.62, -0.62, 1.05, -1.05] as const;
const OFFICE_GAME_MODE_DETOUR_DISTANCES = [1.25, 2, 2.8] as const;
const OFFICE_GAME_MODE_OPEN_SPOT_RADII = [0.45, 0.75, 1.15, 1.65, 2.25, 3] as const;
const CHAPTER_THREE_RENDER_SCALE = 0.68;
const CHAPTER_THREE_CAMERA_RENDER_SCALE = 0.38;
const CHAPTER_THREE_NIGHT_RENDER_SCALE = 0.62;
const CHAPTER_FOUR_RENDER_SCALE = 0.82;
const CHAPTER_FOUR_BOX_CAMERA_DISTANCE = 4.1;
const CHAPTER_FOUR_BOX_CAMERA_HEIGHT = 2.35;
const CHAPTER_FOUR_BOX_CAMERA_RADIUS = 0.22;
const CHAPTER_FOUR_CROUCH_DROP = 0.52;
const CHAPTER_SEVEN_CRAWL_DROP = 1.18;
const CHAPTER_SEVEN_CRAWL_SPEED_MULTIPLIER = 0.42;
const CHAPTER_SEVEN_CRAWL_HOLD_MS = 2000;
const CHAPTER_FOUR_PURPLE_JUMPSCARE_DURATION = 2.35;
const CHAPTER_FOUR_PURPLE_JUMPSCARE_COOLDOWN = 1.8;
const CHAPTER_FOUR_BLUE_JUMPSCARE_DURATION = 2.6;
const CHAPTER_FOUR_BLUE_JUMPSCARE_COOLDOWN = 1.35;
const CHAPTER_FOUR_GREEN_JUMPSCARE_DURATION = 2.45;
const CHAPTER_FOUR_GREEN_JUMPSCARE_COOLDOWN = 1.25;
const DEFAULT_RENDER_PIXEL_RATIO = 1.1;
const PERFORMANCE_RENDER_PIXEL_RATIO = 1;
const OFFICE_VENT_GRATE_DROP_RADIUS = 0.34;
const OFFICE_VENT_GRATE_DROP_OPEN_AMOUNT = 0.86;
const OFFICE_VENT_DROP_DURATION = 0.82;
const OFFICE_EMPLOYEE_ELEVATOR_RIDE_DURATION = 5.2;
const CHAPTER_THREE_HUD_SYNC_INTERVAL = 1 / 8;

type ChapterSevenInteractable =
  | { kind: 'cupboard'; item: ChapterSevenData['houseUpperCupboards'][number]; score: number }
  | { kind: 'drawer'; item: ChapterSevenData['houseDrawers'][number]; score: number }
  | { kind: 'fridge'; item: ChapterSevenData['houseFridge']; score: number }
  | { kind: 'old-wooden-closet'; item: ChapterSevenData['oldWoodenClosets'][number]; score: number }
  | { kind: 'cardboard-box'; item: ChapterSevenData['cardboardBox']; score: number }
  | { kind: 'kitchen-sink'; item: ChapterSevenData['kitchenSink']; score: number }
  | { kind: 'rear-fixture'; item: ChapterSevenData['rearFixtures'][number]; score: number }
  | { kind: 'swing'; item: ChapterSevenData['swingSet']; score: number }
  | { kind: 'oven'; item: ChapterSevenData['houseOven']; score: number };

type ChapterEightHeldItem = 'coordinate-tool' | 'military-knife' | 'torch' | 'empty';

const CHAPTER_EIGHT_HELD_ITEM_ORDER: ChapterEightHeldItem[] = [
  'coordinate-tool',
  'military-knife',
  'torch',
  'empty',
];
const CHAPTER_EIGHT_KNIFE_ATTACK_SECONDS = 0.38;

export class Game {
  private readonly scene;
  private readonly camera;
  private readonly renderer;
  private readonly level;
  private readonly chapterTwo: ChapterTwoLevelData;
  private readonly mainOfficeChapter: OfficeChapterData;
  private readonly officeSandboxChapter: OfficeChapterData;
  private officeChapter: OfficeChapterData;
  private readonly chapterFour: ChapterFourData;
  private readonly chapterFive: ChapterFiveData;
  private readonly chapterSix: ChapterSixData;
  private readonly chapterSeven: ChapterSevenData;
  private readonly chapterEight: ChapterEightData;
  private readonly zombieMode: ZombieModeData;
  private readonly doomMode: DoomModeData;
  private readonly lighting;
  private readonly input;
  private readonly player;
  private readonly flashlight;
  private readonly bearJumpScareAudio = new BearJumpScareAudio();
  private readonly coffeeMachineAudio = new CoffeeMachineAudio();
  private readonly gameplaySfxAudio = new GameplaySfxAudio();
  private readonly voiceInput = new VoiceInputController();
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
  private readonly officePrizeItemAnchor = new Group();
  private readonly officePrizeItemModels = new Map<OfficePrizeItemId, Group>();
  private readonly officeTabletAnchor = new Group();
  private readonly chapterFourBoxHeldAnchor = new Group();
  private readonly chapterFourBoxHideAnchor = new Group();
  private readonly chapterFourBoxWideAnchor = new Group();
  private readonly chapterSevenBoxHideAnchor = new Group();
  private readonly chapterSevenOvenHideAnchor = new Group();
  private readonly chapterSevenOvenDoorOverlay = new Group();
  private readonly chapterFourBlueJumpscareAnchor = new Group();
  private readonly chapterFourBlueJumpscareHead = new Group();
  private readonly chapterFourBlueJumpscareMaw = new Group();
  private readonly chapterFourBlueJumpscareLeftArm = new Group();
  private readonly chapterFourBlueJumpscareRightArm = new Group();
  private readonly chapterFourGreenJumpscareAnchor = new Group();
  private readonly chapterFourGreenJumpscareBody = new Group();
  private readonly chapterFourGreenJumpscareMaw = new Group();
  private readonly chapterFourGreenJumpscareLeftArm = new Group();
  private readonly chapterFourGreenJumpscareRightArm = new Group();
  private readonly chapterFourBoxWideCamera = new PerspectiveCamera(64, 1, 0.05, 120);
  private readonly officeTabletViewCamera = new PerspectiveCamera(58, 1, 0.05, 120);
  private readonly officeTabletViewPosition = new Vector3();
  private readonly officeTabletViewQuaternion = new Quaternion();
  private readonly chapterFourBoxWorldAnchor = new Group();
  private readonly chapterFourBoxCameraForward = new Vector3();
  private readonly chapterFourBoxCameraFocus = new Vector3();
  private readonly chapterFourBoxCameraDesired = new Vector3();
  private readonly chapterFourBoxCameraSafe = new Vector3();
  private readonly chapterFourBoxCameraSample = new Vector3();
  private readonly zombieWeaponAnchor = new Group();
  private readonly chapterSixHeldItemAnchor = new Group();
  private readonly chapterSixPettingArmAnchor = new Group();
  private readonly chapterEightHeldItemAnchor = new Group();
  private readonly placementToolAnchor = new Group();
  private readonly microphoneSoundToolAnchor = new Group();
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
  private readonly chapterFiveAimDirection = new Vector3(0, 0, -1);
  private readonly chapterFiveCameraPosition = new Vector3();
  private readonly chapterFiveFlightLookTarget = new Vector3();
  private readonly chapterFiveLookDelta = { x: 0, y: 0 };
  private chapterFiveAlarmWasActive = false;
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
  private chapterSixHeldItemModel: Group | null = null;
  private chapterSixHeldItemType: ChapterSixItemType | null = null;
  private chapterSixPossumPickupTimer = 0;
  private chapterEightHeldItem: ChapterEightHeldItem = 'coordinate-tool';
  private chapterEightHeldItemModel: Group | null = null;
  private chapterEightHeldItemModelType: ChapterEightHeldItem | null = null;
  private chapterEightKnifeAttackMode: 'slash' | 'stab' | null = null;
  private chapterEightKnifeAttackTimer = 0;
  private holdingPlate = false;
  private plateRecipeId: string | null = null;
  private platedRecipeId: string | null = null;
  private chapterExitUnlocked = false;
  private chapterTwoActive = false;
  private officeChapterActive = false;
  private officeSandboxChapterActive = false;
  private chapterFourActive = false;
  private chapterFiveActive = false;
  private chapterSixActive = false;
  private chapterSevenActive = false;
  private chapterEightActive = false;
  private zombieModeActive = false;
  private doomModeActive = false;
  private chapterMenuOpen = false;
  private curatorToolOpen = false;
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
  private officeHeldPrizeItem: OfficePrizeItemId | null = null;
  private readonly officePrizeInventory = new Map<OfficePrizeItemId, number>();
  private officePrizeBonusMultiplier = 1;
  private officeLollipopBoostRemaining = 0;
  private officeLollipopUseTimer = 0;
  private readonly officeGlassThrows: ActiveOfficeGlassThrow[] = [];
  private officePrizeWheelLastTickIndex = 0;
  private officePrizeWheelWasSpinning = false;
  private officeBallPitHidden = false;
  private officeBallPitSlide: ActiveOfficeBallPitSlide | null = null;
  private officeVentActive = false;
  private officeVentDrop: ActiveOfficeVentDrop | null = null;
  private officeEmployeeElevatorRide: ActiveOfficeEmployeeElevatorRide | null = null;
  private officeEmployeeElevatorBasementActive = false;
  private officeVentChasePendingTimer = 0;
  private officeVentChasePendingAnimatronic: OfficeGameModeAnimatronicState | null = null;
  private officeJumpscareMenuOpen = false;
  private officeModeMenuOpen = false;
  private officeModeMenuStep: OfficeModeMenuStep = 'mode';
  private officeModeMenuPendingMode: OfficeModeMenuMode | null = null;
  private activeOfficeJumpscare: ActiveOfficeJumpscare | null = null;
  private officeDeathNoticePhase: OfficeDeathNoticePhase | null = null;
  private officeDeathNoticeTimer = 0;
  private officeTabletHeld = false;
  private officeTabletCameraFeedActive = false;
  private officeTabletCameraIndex = 0;
  private chapterFourBoxHeld = false;
  private chapterFourBoxActive = false;
  private chapterFourBoxViewMode: 'normal' | 'wide' = 'normal';
  private chapterFourBoxWideCameraReady = false;
  private chapterFourLockerId: string | null = null;
  private chapterFourCrouching = false;
  private chapterSevenCrawling = false;
  private chapterSevenForcedCrawl = false;
  private chapterSevenBoxHidden = false;
  private chapterSevenOvenHidden = false;
  private chapterSevenSwingSeated = false;
  private chapterFourPurpleJumpscareTimer = 0;
  private chapterFourPurpleJumpscareCooldown = 0;
  private chapterFourBlueJumpscareTimer = 0;
  private chapterFourBlueJumpscareCooldown = 0;
  private chapterFourGreenJumpscareTimer = 0;
  private chapterFourGreenJumpscareCooldown = 0;
  private officeCameraPuppetPhase: OfficeCameraPuppetPhase = 'idle';
  private officeCameraPuppetTimer = 0;
  private officeMode: OfficeModeMenuMode = 'creator';
  private officeGameModeActive = false;
  private officeGameModeDifficulty: OfficeGameModeDifficulty = 'normal';
  private officeGameModePower = 100;
  private officeGameModePowerOut = false;
  private officePowerRebootRequired = false;
  private readonly officeFuseWireConnected: Record<OfficeFuseWireColor, boolean> = {
    green: false,
    blue: false,
    red: false,
  };
  private officeFreddyPowerOutTimer = 0;
  private officePowerOutBoriDoor: 'left' | 'right' | null = null;
  private officeGameModeNightPhase = false;
  private officeGameModePhaseTime = 0;
  private officeGameModeNight = 1;
  private readonly officeGameModeAnimatronics: OfficeGameModeAnimatronicState[] = [];
  private officeStageVoiceReleaseCooldown = 0;
  private officeStageYellReleaseAllowed: boolean | null = null;
  private officeFoxyCameraWatchTime = 0;
  private officeFoxyRushCooldown = 0;
  private officeFoxyClankCooldown = 0;
  private officeFoxyRushDoor: 'left' | 'right' | null = null;
  private officePlayerNoiseLevel = 0;
  private officePlayerVoiceLevel = 0;
  private readonly officePlayerNoisePosition = new Vector3();
  private readonly officeGameModeAnimatronicPosition = new Vector3();
  private officeMicrophoneEnabled = false;
  private officeMicrophoneManualOff = false;
  private officeMicrophoneStartPending = false;
  private officeMicrophoneAutoStatusShown = false;
  private officeMicrophoneStartToken = 0;
  private officeSpeechRecognition: OfficeSpeechRecognitionLike | null = null;
  private officeSpeechRecognitionRunning = false;
  private officeInsultHeardTimer = 0;
  private microphoneSoundToolActive = false;
  private microphoneSoundRecorder: MediaRecorder | null = null;
  private microphoneSoundStream: MediaStream | null = null;
  private microphoneSoundChunks: Blob[] = [];
  private microphoneSoundPreviewUrl: string | null = null;
  private microphoneSoundPreviewRecordingId: string | null = null;
  private microphoneSoundPlayback: HTMLAudioElement | null = null;
  private officeDoorSoundPlayback: HTMLAudioElement | null = null;
  private officeDoorSoundTarget: { doorId: 'left' | 'right'; open: boolean } | null = null;
  private readonly activeOfficeDoorSparks: ActiveOfficeDoorSpark[] = [];
  private microphoneSoundRecording = false;
  private microphoneSoundDiscardStop = false;
  private microphoneSoundSaved = false;
  private microphoneSoundMessage = 'No custom sound recorded yet.';
  private microphoneSoundLibraryLoaded = false;
  private readonly microphoneSoundRecordings: MicrophoneSoundRecording[] = [];
  private microphoneSoundJumpscareRecordingId: string | null = null;
  private cameraToolActive = false;
  private cameraToolStream: MediaStream | null = null;
  private cameraToolVideo: HTMLVideoElement | null = null;
  private cameraToolRecorder: MediaRecorder | null = null;
  private cameraToolChunks: Blob[] = [];
  private cameraToolRecording = false;
  private cameraToolDiscardStop = false;
  private cameraToolPreviewUrl: string | null = null;
  private cameraToolPreviewKind: CameraToolCaptureKind | null = null;
  private cameraToolPreviewCaptureId: string | null = null;
  private cameraToolSaved = false;
  private cameraToolMessage = 'No picture or video captured yet.';
  private cameraToolLibraryLoaded = false;
  private readonly cameraToolCaptures: CameraToolCapture[] = [];
  private officeVentBoy: OfficeVentBoyState | null = null;
  private hudSyncTimer = 0;
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
  private readonly deletedOfficeSandboxSecurityCameraIds = new Set<number>();
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
    this.mainOfficeChapter = createOfficeChapter();
    this.officeSandboxChapter = createOfficeChapter({ abandonedStraightHalls: true });
    this.translateOfficeChapterCopy(this.officeSandboxChapter, OFFICE_CHAPTER_COPY_OFFSET_X, OFFICE_CHAPTER_COPY_OFFSET_Z);
    this.officeChapter = this.mainOfficeChapter;
    this.loadDeletedOfficeSecurityCameras(OFFICE_DELETED_CAMERA_STORAGE_KEY, this.deletedOfficeSecurityCameraIds);
    this.loadDeletedOfficeSecurityCameras(OFFICE_DELETED_CAMERA_SANDBOX_STORAGE_KEY, this.deletedOfficeSandboxSecurityCameraIds);
    this.applyDeletedOfficeSecurityCameras(this.mainOfficeChapter, this.deletedOfficeSecurityCameraIds);
    this.applyDeletedOfficeSecurityCameras(this.officeSandboxChapter, this.deletedOfficeSandboxSecurityCameraIds);
    this.officeChapter.root.visible = false;
    this.officeSandboxChapter.root.visible = false;
    this.chapterFour = createChapterFour();
    this.chapterFour.root.visible = false;
    this.chapterFive = createChapterFive();
    this.chapterFive.root.visible = false;
    this.chapterFive.screenShip.visible = false;
    this.chapterSix = createChapterSix();
    this.chapterSix.root.visible = false;
    this.chapterSeven = createChapterSeven();
    this.chapterSeven.root.visible = false;
    this.chapterEight = createChapterEight();
    this.chapterEight.root.visible = false;
    this.zombieMode = createZombieMode();
    this.zombieMode.root.visible = false;
    this.doomMode = createDoomMode();
    this.doomMode.root.visible = false;
    this.lighting = createLighting(this.camera);
    this.input = new InputController();
    this.player = new PlayerController(
      this.camera,
      this.renderer.domElement,
      [
        ...this.level.colliders,
        ...this.chapterTwo.colliders,
        ...this.mainOfficeChapter.colliders,
        ...this.officeSandboxChapter.colliders,
        ...this.chapterFour.colliders,
        ...this.chapterFive.colliders,
        ...this.chapterSix.colliders,
        ...this.chapterSeven.colliders,
        ...this.chapterEight.colliders,
        ...this.zombieMode.colliders,
        ...this.doomMode.colliders,
      ],
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
    this.scene.add(this.mainOfficeChapter.root);
    this.scene.add(this.officeSandboxChapter.root);
    this.scene.add(this.chapterFour.root);
    this.scene.add(this.chapterFive.root);
    this.scene.add(this.chapterSix.root);
    this.scene.add(this.chapterSeven.root);
    this.scene.add(this.chapterEight.root);
    this.scene.add(this.zombieMode.root);
    this.scene.add(this.doomMode.root);
    this.scene.add(this.camera);
    this.camera.add(this.chapterFive.screenShip);
    this.camera.add(this.chapterFive.repairWrench);
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
    this.camera.add(this.officePrizeItemAnchor);
    this.officePrizeItemAnchor.position.set(0.34, -0.46, -0.62);
    this.officePrizeItemAnchor.rotation.set(0.1, -0.24, 0.06);
    this.officePrizeItemAnchor.visible = false;
    this.createOfficePrizeItemModels();
    this.camera.add(this.officeTabletAnchor);
    this.officeTabletAnchor.position.set(0.34, -0.36, -0.72);
    this.officeTabletAnchor.rotation.set(-0.1, -0.18, 0.04);
    this.officeTabletAnchor.visible = false;
    this.createOfficeTabletModel();
    this.camera.add(this.chapterFourBoxHeldAnchor);
    this.chapterFourBoxHeldAnchor.position.set(0.36, -0.46, -0.64);
    this.chapterFourBoxHeldAnchor.rotation.set(0.08, -0.22, 0.06);
    this.chapterFourBoxHeldAnchor.visible = false;
    this.camera.add(this.chapterFourBoxHideAnchor);
    this.chapterFourBoxHideAnchor.position.set(0, -0.18, -0.34);
    this.chapterFourBoxHideAnchor.visible = false;
    this.camera.add(this.chapterFourBoxWideAnchor);
    this.chapterFourBoxWideAnchor.position.set(0, -0.08, -0.38);
    this.chapterFourBoxWideAnchor.visible = false;
    this.createChapterFourBoxModels();
    this.camera.add(this.chapterSevenBoxHideAnchor);
    this.chapterSevenBoxHideAnchor.position.set(0, -0.14, -0.34);
    this.chapterSevenBoxHideAnchor.visible = false;
    this.createChapterSevenBoxHideModel();
    this.camera.add(this.chapterSevenOvenHideAnchor);
    this.chapterSevenOvenHideAnchor.position.set(0, -0.08, -0.34);
    this.chapterSevenOvenHideAnchor.visible = false;
    this.chapterSevenOvenDoorOverlay.visible = false;
    this.camera.add(this.chapterFourBlueJumpscareAnchor);
    this.createChapterFourBlueJumpscareModel();
    this.camera.add(this.chapterFourGreenJumpscareAnchor);
    this.createChapterFourGreenJumpscareModel();
    this.scene.add(this.chapterFourBoxWorldAnchor);
    this.chapterFourBoxWorldAnchor.visible = false;
    this.camera.add(this.zombieWeaponAnchor);
    this.zombieWeaponAnchor.position.set(0.46, -0.36, -0.58);
    this.zombieWeaponAnchor.visible = false;
    this.camera.add(this.chapterSixHeldItemAnchor);
    this.chapterSixHeldItemAnchor.position.set(0.46, -0.34, -0.72);
    this.chapterSixHeldItemAnchor.rotation.set(-0.18, -0.42, 0.16);
    this.chapterSixHeldItemAnchor.visible = false;
    this.camera.add(this.chapterSixPettingArmAnchor);
    this.chapterSixPettingArmAnchor.visible = false;
    this.createChapterSixPettingArmModel();
    this.camera.add(this.chapterEightHeldItemAnchor);
    this.chapterEightHeldItemAnchor.position.set(0.42, -0.38, -0.66);
    this.chapterEightHeldItemAnchor.rotation.set(-0.12, -0.28, 0.08);
    this.chapterEightHeldItemAnchor.visible = false;
    this.camera.add(this.placementToolAnchor);
    this.placementToolAnchor.position.set(0.42, -0.38, -0.62);
    this.placementToolAnchor.rotation.set(-0.12, -0.28, 0.08);
    this.placementToolAnchor.visible = false;
    this.createPlacementToolModel();
    this.camera.add(this.microphoneSoundToolAnchor);
    this.microphoneSoundToolAnchor.position.set(0.4, -0.36, -0.58);
    this.microphoneSoundToolAnchor.rotation.set(-0.08, -0.2, 0.08);
    this.microphoneSoundToolAnchor.visible = false;
    this.createMicrophoneSoundToolModel();
    this.loadSavedMicrophoneSounds();
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
    this.hud.onMicrophoneToggle(this.handleMicrophoneToggle);
    this.hud.onMinecraftInventoryAction(this.handleMinecraftInventoryAction);
    this.hud.onChapterFiveMonitorAction(this.handleChapterFiveMonitorAction);
    this.hud.onCuratorSave(this.handleCuratorSave);
    this.player.controls.addEventListener('lock', this.handleLockChange);
    this.player.controls.addEventListener('unlock', this.handleLockChange);
    window.addEventListener('keydown', this.handleGlobalKeyDown, { capture: true });
    this.shell.root.addEventListener('click', this.handlePlayAreaClick);

    this.resizeObserver.observe(this.shell.viewport);
    this.resize();

    if (START_IN_CHAPTER_SEVEN) {
      this.beginChapterSeven();
    } else if (START_IN_CHAPTER_SIX) {
      this.beginChapterSix();
    } else if (START_IN_CHAPTER_FIVE) {
      this.beginChapterFive();
    } else if (START_IN_CHAPTER_FOUR) {
      this.beginChapterFour();
    } else if (START_IN_CHAPTER_THREE) {
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
    window.removeEventListener('keydown', this.handleGlobalKeyDown, { capture: true });
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
    this.voiceInput.destroy();
    this.stopOfficeSpeechRecognition();
    this.stopMicrophoneSoundRecording(true);
    this.releaseMicrophoneSoundStream();
    this.revokeMicrophoneSoundPreviewUrl();
    this.hud.destroy();
    this.renderer.dispose();
    this.shell.viewport.replaceChildren();
  }

  private readonly resize = (): void => {
    const width = Math.max(this.shell.viewport.clientWidth, 1);
    const height = Math.max(this.shell.viewport.clientHeight, 1);
    const officeRenderScale = this.officeTabletCameraFeedActive
      ? CHAPTER_THREE_CAMERA_RENDER_SCALE
      : this.getOfficeNightBlend() > 0.01
        ? CHAPTER_THREE_NIGHT_RENDER_SCALE
        : CHAPTER_THREE_RENDER_SCALE;
    const renderScale = this.doomModeActive
      ? 0.22
      : this.officeChapterActive
        ? officeRenderScale
        : this.chapterFourActive
          ? CHAPTER_FOUR_RENDER_SCALE
          : this.chapterFiveActive
            ? 0.92
            : this.chapterSixActive
              ? 0.9
              : this.chapterSevenActive
                ? 0.9
                : this.chapterEightActive
                  ? 0.9
                : 1;
    const renderWidth = Math.max(1, Math.round(width * renderScale));
    const renderHeight = Math.max(1, Math.round(height * renderScale));

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.chapterFourBoxWideCamera.aspect = width / height;
    this.chapterFourBoxWideCamera.updateProjectionMatrix();
    this.officeTabletViewCamera.aspect = width / height;
    this.officeTabletViewCamera.updateProjectionMatrix();
    this.renderer.toneMapping = this.doomModeActive ? NoToneMapping : ACESFilmicToneMapping;
    this.renderer.setPixelRatio(
      this.doomModeActive || this.officeChapterActive || this.chapterFourActive
        || this.chapterFiveActive || this.chapterSixActive || this.chapterSevenActive || this.chapterEightActive
        ? PERFORMANCE_RENDER_PIXEL_RATIO
        : Math.min(window.devicePixelRatio, DEFAULT_RENDER_PIXEL_RATIO),
    );
    this.renderer.setSize(renderWidth, renderHeight, false);
    this.renderer.domElement.style.width = `${width}px`;
    this.renderer.domElement.style.height = `${height}px`;
    this.renderer.domElement.dataset.renderStyle = this.officeTabletCameraFeedActive ? 'camera-feed' : this.doomModeActive ? 'doom' : 'default';
  };

  private readonly handleLockChange = (): void => {
    this.hud.setLocked(this.player.isLocked());
    this.syncHud();
  };

  private readonly handleGlobalKeyDown = (event: KeyboardEvent): void => {
    if ((event.code !== 'KeyB' && event.code !== 'KeyJ' && event.code !== 'KeyK' && event.code !== 'KeyZ' && event.code !== 'KeyX' && event.code !== 'KeyT' && event.code !== 'KeyE') || event.repeat) {
      return;
    }

    if (event.code === 'KeyE') {
      const chapterFiveMonitor = this.chapterFiveActive ? this.chapterFive.getMonitorState() : null;
      if (
        this.chapterFiveActive
        && this.chapterFive.isInteriorMode()
        && chapterFiveMonitor?.active
        && chapterFiveMonitor.landed
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.stepOutToChapterFiveSurface();
      } else if (this.chapterFiveActive && chapterFiveMonitor?.active) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.chapterFive.setMonitorActive(false);
        this.pushStatus('Cockpit computer closed.', 1.8);
        this.player.lock();
        this.syncHud();
      }
      return;
    }

    if (event.code === 'KeyT') {
      if (!this.chapterFiveActive) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      this.toggleChapterFiveInteriorMode();
      return;
    }

    if (this.chapterFourActive && this.chapterFourBoxActive && (event.code === 'KeyZ' || event.code === 'KeyX')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.setChapterFourBoxViewMode(event.code === 'KeyZ' ? 'wide' : 'normal');
      this.syncHud();
      return;
    }

    if (event.code === 'KeyZ' || event.code === 'KeyX') {
      return;
    }

    if (event.code === 'KeyK' && !event.repeat) {
      if (
        this.activeOfficeJumpscare
        || this.officeCameraPuppetPhase === 'jumpscare'
        || this.activeJumpscare
        || this.chapterFourPurpleJumpscareTimer > 0
        || this.chapterFourBlueJumpscareTimer > 0
        || this.chapterFourGreenJumpscareTimer > 0
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      this.setCuratorToolOpen(!this.curatorToolOpen);
      return;
    }

    if (event.code === 'KeyJ') {
      if (
        !this.officeChapterActive
        || this.activeOfficeJumpscare
        || this.officeCameraPuppetPhase === 'jumpscare'
        || this.activeJumpscare
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      if (this.officeJumpscareMenuOpen) {
        this.setOfficeJumpscareMenuOpen(false);
      } else {
        this.openOfficeJumpscareMenu();
      }
      return;
    }

    if (event.code === 'KeyB' && this.chapterFourActive && (this.chapterFourBoxHeld || this.chapterFourBoxActive)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.setChapterFourBoxHeld(false);
      this.syncHud();
      return;
    }

  };

  private readonly handlePlayAreaClick = (event: MouseEvent): void => {
    if (this.player.isLocked()) {
      return;
    }

    const clickedMenu = event.target instanceof Element
      && event.target.closest('.hud__chapter-menu, .hud__curator-tool, .hud__office-jumpscare-menu, .hud__office-mode-menu, .hud__chapter-five-monitor, .hud__minecraft-inventory');
    if (this.chapterMenuOpen || this.curatorToolOpen || this.officeJumpscareMenuOpen || this.officeModeMenuOpen) {
      if (clickedMenu) {
        return;
      }

      this.chapterMenuOpen = false;
      this.curatorToolOpen = false;
      this.officeJumpscareMenuOpen = false;
      this.officeModeMenuOpen = false;
      this.syncHud();
    }

    if (event.target instanceof Element && event.target.closest('.hud__intro, .hud__microphone, .hud__chapter-menu, .hud__curator-tool, .hud__office-jumpscare-menu, .hud__office-mode-menu, .hud__chapter-five-monitor, .hud__minecraft-inventory')) {
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
    this.requestOfficeMicrophoneStart('auto');
  };

  private translateOfficeChapterCopy(chapter: OfficeChapterData, offsetX: number, offsetZ: number): void {
    chapter.root.position.x += offsetX;
    chapter.root.position.z += offsetZ;

    const visited = new WeakSet<object>();
    const translateValue = (value: unknown): void => {
      if (!value || typeof value !== 'object') {
        return;
      }

      if (value instanceof Vector3) {
        value.x += offsetX;
        value.z += offsetZ;
        return;
      }

      if (value instanceof Object3D) {
        return;
      }

      if (visited.has(value)) {
        return;
      }
      visited.add(value);

      const maybeCollider = value as { centerX?: unknown; centerZ?: unknown; halfWidth?: unknown; halfDepth?: unknown };
      if (
        typeof maybeCollider.centerX === 'number'
        && typeof maybeCollider.centerZ === 'number'
        && typeof maybeCollider.halfWidth === 'number'
        && typeof maybeCollider.halfDepth === 'number'
      ) {
        maybeCollider.centerX += offsetX;
        maybeCollider.centerZ += offsetZ;
      }

      if (Array.isArray(value)) {
        value.forEach(translateValue);
        return;
      }

      Object.values(value).forEach(translateValue);
    };

    translateValue(chapter);
  }

  private readonly handleChapterSelection = (chapterId: HudChapterId): void => {
    if (chapterId === 'chapter-1') {
      this.beginChapterOne();
    } else if (chapterId === 'chapter-2') {
      this.beginChapterTwo();
    } else if (chapterId === 'chapter-3') {
      this.beginOfficeChapter();
    } else if (chapterId === 'chapter-3-copy') {
      this.beginOfficeChapter(true);
    } else if (chapterId === 'chapter-4') {
      this.beginChapterFour();
    } else if (chapterId === 'chapter-5') {
      this.beginChapterFive();
    } else if (chapterId === 'chapter-6') {
      this.beginChapterSix();
    } else if (chapterId === 'chapter-7') {
      this.beginChapterSeven();
    } else if (chapterId === 'chapter-8') {
      this.beginChapterEight();
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

    this.startOfficeJumpscare(definition, true);
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

  private readonly handleMicrophoneToggle = (): void => {
    if (!this.officeChapterActive) {
      return;
    }

    if (!this.officeMicrophoneEnabled) {
      this.officeMicrophoneManualOff = false;
      this.requestOfficeMicrophoneStart('manual');
      return;
    }

    if (this.officeMicrophoneStartPending) {
      this.officeMicrophoneManualOff = true;
      this.officeMicrophoneEnabled = false;
      this.officeMicrophoneStartPending = false;
      this.officeMicrophoneStartToken += 1;
      this.stopOfficeSpeechRecognition();
      this.officePlayerVoiceLevel = 0;
      this.officePlayerNoiseLevel = 0;
      this.officeStageYellReleaseAllowed = null;
      this.pushStatus('Microphone start cancelled.', 1.8);
    } else {
      this.officeMicrophoneManualOff = true;
      this.voiceInput.stop();
      this.stopOfficeSpeechRecognition();
      this.officeMicrophoneEnabled = false;
      this.officeMicrophoneStartToken += 1;
      this.officePlayerVoiceLevel = 0;
      this.officePlayerNoiseLevel = 0;
      this.officeStageYellReleaseAllowed = null;
      this.pushStatus('Microphone off. Animatronics cannot hear your voice.', 2.4);
    }
    this.syncHud();
  };

  private readonly handleMinecraftInventoryAction = (action: MinecraftInventoryAction): void => {
    if (!this.chapterSixActive || !this.chapterSix.isInventoryOpen()) {
      return;
    }

    this.chapterSix.handleInventoryAction(action);
    this.syncHud();
  };

  private requestOfficeMicrophoneStart(mode: 'manual' | 'auto'): void {
    if (
      !this.officeChapterActive
      || this.voiceInput.isActive()
      || this.officeMicrophoneStartPending
      || (mode === 'auto' && (!this.officeGameModeActive || this.officeMicrophoneManualOff || this.voiceInput.isBlocked()))
    ) {
      return;
    }

    this.officeMicrophoneEnabled = true;
    this.officeMicrophoneStartPending = true;
    const startToken = ++this.officeMicrophoneStartToken;
    if (mode === 'manual') {
      this.pushStatus('Microphone turning on. Allow browser permission if asked.', 2.4);
    } else if (!this.officeMicrophoneAutoStatusShown) {
      this.officeMicrophoneAutoStatusShown = true;
      this.pushStatus('Chapter 3 voice listening is turning on. Talking can attract wandering animatronics.', 3);
    }
    this.syncHud();

    void this.voiceInput.start().then((started) => {
      if (startToken !== this.officeMicrophoneStartToken) {
        if (started) {
          this.voiceInput.stop();
        }
        this.stopOfficeSpeechRecognition();
        return;
      }

      this.officeMicrophoneStartPending = false;
      if (!started) {
        this.officeMicrophoneEnabled = false;
        this.stopOfficeSpeechRecognition();
        this.officePlayerVoiceLevel = 0;
        this.officePlayerNoiseLevel = 0;
        this.officeStageYellReleaseAllowed = null;
        if (mode === 'manual') {
          this.pushStatus('Microphone stayed off. Allow microphone permission in the browser to use voice noise.', 3.2);
        } else if (!this.voiceInput.isBlocked()) {
          this.officeMicrophoneAutoStatusShown = false;
        }
        this.syncHud();
        return;
      }

      this.officeMicrophoneEnabled = true;
      this.startOfficeSpeechRecognition();
      this.pushStatus(
        mode === 'manual'
          ? 'Microphone on. Animatronics can hear your voice in Night Mode and Game Mode.'
          : 'Microphone on. Wandering animatronics can hear you talk from farther away.',
        2.8,
      );
      this.syncHud();
    });
  }

  private startOfficeSpeechRecognition(): void {
    if (this.officeSpeechRecognitionRunning || this.officeSpeechRecognition) {
      return;
    }

    const recognitionConstructor = (
      (window as Window & {
        SpeechRecognition?: OfficeSpeechRecognitionConstructor;
        webkitSpeechRecognition?: OfficeSpeechRecognitionConstructor;
      }).SpeechRecognition
      ?? (window as Window & {
        SpeechRecognition?: OfficeSpeechRecognitionConstructor;
        webkitSpeechRecognition?: OfficeSpeechRecognitionConstructor;
      }).webkitSpeechRecognition
    );
    if (!recognitionConstructor) {
      return;
    }

    const recognition = new recognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript ?? '';
        this.handleOfficeRecognizedSpeech(transcript);
      }
    };
    recognition.onerror = () => {
      this.officeSpeechRecognitionRunning = false;
    };
    recognition.onend = () => {
      this.officeSpeechRecognitionRunning = false;
      if (this.officeSpeechRecognition === recognition) {
        this.officeSpeechRecognition = null;
      }
      if (this.officeMicrophoneEnabled && this.officeChapterActive && this.officeGameModeActive) {
        window.setTimeout(() => this.startOfficeSpeechRecognition(), 220);
      }
    };

    this.officeSpeechRecognition = recognition;
    try {
      recognition.start();
      this.officeSpeechRecognitionRunning = true;
    } catch {
      this.officeSpeechRecognition = null;
      this.officeSpeechRecognitionRunning = false;
    }
  }

  private stopOfficeSpeechRecognition(): void {
    const recognition = this.officeSpeechRecognition;
    this.officeSpeechRecognition = null;
    this.officeSpeechRecognitionRunning = false;
    if (!recognition) {
      return;
    }

    recognition.onend = null;
    recognition.onerror = null;
    recognition.onresult = null;
    try {
      recognition.stop();
    } catch {
      // Speech recognition may already be stopped by the browser.
    }
  }

  private normalizeOfficeSpeechTranscript(transcript: string): string {
    return transcript
      .toLowerCase()
      .replace(/[^a-z'\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isOfficeInsultNormalized(normalized: string): boolean {
    return OFFICE_INSULT_PHRASES.some((phrase) => {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`).test(normalized);
    });
  }

  private officeSpeechIncludesAny(normalized: string, phrases: readonly string[]): boolean {
    return phrases.some((phrase) => {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`).test(normalized);
    });
  }

  private getOfficeSpeechAnimatronicPosition(animatronic: OfficeGameModeAnimatronicState): Vector3 {
    return animatronic.state === 'stage'
      ? animatronic.route[0] ?? animatronic.model.root.position
      : animatronic.model.root.position;
  }

  private getOfficeSpeechMentionedAnimatronic(normalized: string): OfficeJumpscareAnimatronic | null {
    if (/\b(quacky|duck)\b/.test(normalized)) {
      return 'quacky';
    }
    if (/\b(fluffle|bunny|rabbit)\b/.test(normalized)) {
      return 'fluffle';
    }
    if (/\b(bori|boris|bear)\b/.test(normalized)) {
      return 'bori';
    }
    if (/\b(foxy|fox|pirate)\b/.test(normalized)) {
      return 'foxy';
    }
    return null;
  }

  private getOfficeSpeechTarget(normalized: string): OfficeGameModeAnimatronicState | null {
    const playerPosition = this.player.getPosition();
    const mentioned = this.getOfficeSpeechMentionedAnimatronic(normalized);
    const candidates = this.officeGameModeAnimatronics
      .filter((animatronic) => (
        animatronic.state !== 'door-breach'
        && animatronic.state !== 'foxy-leap'
        && animatronic.state !== 'vent-chase'
        && animatronic.state !== 'off-balance'
      ))
      .map((animatronic) => ({
        animatronic,
        distance: this.getOfficeSpeechAnimatronicPosition(animatronic).distanceTo(playerPosition),
      }))
      .filter(({ distance }) => distance <= OFFICE_CHARACTER_SPEECH_RANGE)
      .sort((a, b) => a.distance - b.distance);

    if (mentioned) {
      return candidates.find(({ animatronic }) => animatronic.animatronic === mentioned)?.animatronic ?? null;
    }

    return candidates[0]?.animatronic ?? null;
  }

  private getOfficeSpeechDislikeReason(
    target: OfficeGameModeAnimatronicState,
    normalized: string,
    insulted: boolean,
  ): string | null {
    if (insulted) {
      return 'that sounded rude';
    }

    if (target.animatronic !== 'foxy') {
      return null;
    }

    const addressedFoxy = this.officeSpeechIncludesAny(normalized, OFFICE_FOXY_ADDRESSING_PHRASES);
    if (!addressedFoxy) {
      return null;
    }

    const pirateApproved = this.officeSpeechIncludesAny(normalized, OFFICE_FOXY_PIRATE_APPROVAL_PHRASES);
    if (pirateApproved) {
      return null;
    }

    return 'Foxy wanted pirate talk or respectful words';
  }

  private handleOfficeRecognizedSpeech(transcript: string): void {
    const normalized = this.normalizeOfficeSpeechTranscript(transcript);
    if (!normalized) {
      return;
    }

    const insulted = this.isOfficeInsultNormalized(normalized);
    const target = this.getOfficeSpeechTarget(normalized);
    const dislikeReason = target ? this.getOfficeSpeechDislikeReason(target, normalized, insulted) : null;
    if (!insulted && !dislikeReason) {
      return;
    }

    this.handleOfficeProvocativeSpeech(transcript, target, dislikeReason ?? 'that sounded wrong');
  }

  private handleOfficeProvocativeSpeech(
    transcript: string,
    forcedTarget: OfficeGameModeAnimatronicState | null = null,
    reason = 'that sounded rude',
  ): void {
    if (!this.officeChapterActive || !this.officeGameModeActive || this.officeGameModePowerOut) {
      return;
    }

    this.officeInsultHeardTimer = 2.2;
    const playerPosition = this.player.getPosition();
    this.officePlayerNoisePosition.copy(playerPosition);
    this.officePlayerVoiceLevel = Math.max(this.officePlayerVoiceLevel, OFFICE_STAGE_YELL_LEVEL);
    this.officePlayerNoiseLevel = Math.max(this.officePlayerNoiseLevel, 0.92);

    this.ensureOfficeGameModeAnimatronics();
    const available = this.officeGameModeAnimatronics.filter((animatronic) => (
      animatronic.model.root.visible
      && animatronic.state !== 'door-breach'
      && animatronic.state !== 'foxy-leap'
      && animatronic.state !== 'vent-chase'
      && animatronic.state !== 'off-balance'
    ));
    const stageFallback = this.officeGameModeAnimatronics.find((animatronic) => animatronic.state === 'stage') ?? null;
    const target = forcedTarget ?? available
      .sort((a, b) => a.model.root.position.distanceTo(playerPosition) - b.model.root.position.distanceTo(playerPosition))[0]
      ?? stageFallback;
    if (!target) {
      return;
    }

    if (target.state === 'stage') {
      this.sendOfficeGameModeAnimatronicOffStage(target);
    }
    target.insultCooldown = 0;
    target.senseTimer = 0;
    this.startOfficeInsultRevenge(target);
    const cleaned = transcript.trim();
    this.pushStatus(
      cleaned
        ? `${target.label} heard "${cleaned}" (${reason}) and turns toward you.`
        : `${target.label} heard ${reason} and turns toward you.`,
      2.8,
    );
  }

  private readonly handleChapterFiveMonitorAction = (action: HudChapterFiveMonitorAction): void => {
    if (!this.chapterFiveActive || !this.chapterFive.isInteriorMode()) {
      return;
    }

    this.pushStatus(this.chapterFive.applyMonitorAction(action), 2.4);
    this.syncHud();
  };

  private readonly handleCuratorSave = (slotLabel: string, summary: string): void => {
    console.info(`[Character Creator] ${summary}`);
    this.pushStatus(`${slotLabel} saved in the Character Creator. Tell Codex "${slotLabel}" when you want this design used.`, 4.2);
    this.syncHud();
  };

  private updateChapterFiveAlarmAudio(): void {
    const alarmActive = this.chapterFiveActive && this.chapterFive.getMonitorState().arrivalAlarmActive;
    if (alarmActive && !this.chapterFiveAlarmWasActive) {
      this.gameplaySfxAudio.playSpaceshipAlarm();
    }
    this.chapterFiveAlarmWasActive = alarmActive;
  }

  private setChapterMenuOpen(open: boolean): void {
    if (this.chapterMenuOpen === open) {
      this.syncHud();
      return;
    }

    this.chapterMenuOpen = open;
    if (open) {
      this.curatorToolOpen = false;
      this.officeJumpscareMenuOpen = false;
      this.officeModeMenuOpen = false;
    }

    if (open && this.player.isLocked()) {
      this.syncHud();
      this.player.controls.unlock();
      return;
    }

    this.syncHud();
  }

  private setCuratorToolOpen(open: boolean): void {
    if (this.curatorToolOpen === open) {
      this.syncHud();
      return;
    }

    this.curatorToolOpen = open;
    if (open) {
      this.chapterMenuOpen = false;
      this.officeJumpscareMenuOpen = false;
      this.officeModeMenuOpen = false;
      this.officeModeMenuStep = 'mode';
      this.officeModeMenuPendingMode = null;
    }

    if (open && this.player.isLocked()) {
      this.syncHud();
      this.player.controls.unlock();
      return;
    }

    this.syncHud();
  }

  private openOfficeJumpscareMenu(): void {
    if (!this.officeChapterActive) {
      return;
    }

    this.chapterMenuOpen = false;
    this.curatorToolOpen = false;
    this.officeModeMenuOpen = false;
    this.officeModeMenuStep = 'mode';
    this.officeModeMenuPendingMode = null;
    this.officeJumpscareMenuOpen = true;
    this.syncHud();
    if (this.player.isLocked()) {
      this.player.controls.unlock();
    }
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
      this.curatorToolOpen = false;
      this.officeModeMenuOpen = false;
    }

    if (open && this.player.isLocked()) {
      this.syncHud();
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
      this.curatorToolOpen = false;
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
    const chapterFourPurpleWasJumpscaring = this.chapterFourPurpleJumpscareTimer > 0;
    const chapterFourBlueWasJumpscaring = this.chapterFourBlueJumpscareTimer > 0;
    const chapterFourGreenWasJumpscaring = this.chapterFourGreenJumpscareTimer > 0;
    this.chapterFourPurpleJumpscareTimer = Math.max(0, this.chapterFourPurpleJumpscareTimer - deltaSeconds);
    this.chapterFourPurpleJumpscareCooldown = Math.max(0, this.chapterFourPurpleJumpscareCooldown - deltaSeconds);
    this.chapterFourBlueJumpscareTimer = Math.max(0, this.chapterFourBlueJumpscareTimer - deltaSeconds);
    this.chapterFourBlueJumpscareCooldown = Math.max(0, this.chapterFourBlueJumpscareCooldown - deltaSeconds);
    this.chapterFourGreenJumpscareTimer = Math.max(0, this.chapterFourGreenJumpscareTimer - deltaSeconds);
    this.chapterFourGreenJumpscareCooldown = Math.max(0, this.chapterFourGreenJumpscareCooldown - deltaSeconds);
    if (chapterFourPurpleWasJumpscaring && this.chapterFourPurpleJumpscareTimer <= 0 && this.chapterFourActive) {
      this.chapterFourCrouching = false;
      this.player.teleport(this.chapterFour.spawn);
      this.player.lookToward(this.chapterFour.lookTarget, 1);
      this.pushStatus('Purple chomps. You wake back up at the Chapter 4 spawn area.', 3);
      this.syncHud();
      return;
    }
    if (chapterFourBlueWasJumpscaring && this.chapterFourBlueJumpscareTimer <= 0 && this.chapterFourActive) {
      this.beginChapterFour();
      this.pushStatus('Blue finishes the jumpscare. Chapter 4 restarts, and Blue moves somewhere else.', 3.2);
      return;
    }
    if (chapterFourGreenWasJumpscaring && this.chapterFourGreenJumpscareTimer <= 0 && this.chapterFourActive) {
      this.beginChapterFour();
      this.pushStatus('Green finishes the jumpscare. Chapter 4 restarts, and Green wanders somewhere else.', 3.2);
      return;
    }
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

    this.updateOfficeDeathNotice(deltaSeconds);
    const officeDeathNoticeActive = this.officeDeathNoticePhase !== null;
    const officeJumpscareActive = this.activeOfficeJumpscare !== null || this.officeCameraPuppetPhase === 'jumpscare';
    const jumpscareLocked = this.activeJumpscare !== null
      || officeDeathNoticeActive
      || officeJumpscareActive
      || this.chapterFourPurpleJumpscareTimer > 0
      || this.chapterFourBlueJumpscareTimer > 0
      || this.chapterFourGreenJumpscareTimer > 0;
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
    const officeEmployeeElevatorRiding = this.officeChapterActive && this.officeEmployeeElevatorRide !== null;
    const officeScriptedMoving = officeVentDropping || officeEmployeeElevatorRiding;
    const chapterFourBoxHiding = this.chapterFourActive && this.chapterFourBoxActive;
    const chapterFourLockerHiding = this.chapterFourActive && this.chapterFourLockerId !== null;
    this.zombieFireCooldown = Math.max(0, this.zombieFireCooldown - deltaSeconds);
    this.zombieWeaponKick = Math.max(0, this.zombieWeaponKick - deltaSeconds * 6.8);

    const chapterMenuToggle = this.input.consumeChapterMenuToggle();
    if (chapterMenuToggle) {
      if (this.chapterMenuOpen) {
        this.setChapterMenuOpen(false);
      } else if (!jumpscareLocked && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitSliding && !officeScriptedMoving && !chapterFourLockerHiding) {
        this.setChapterMenuOpen(true);
      }
    }

    const officeJumpscareMenuToggle = this.input.consumeOfficeJumpscareMenuToggle();
    if (!jumpscareLocked && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitSliding && !officeScriptedMoving && this.officeChapterActive && !this.officeModeMenuOpen && officeJumpscareMenuToggle) {
      if (this.officeJumpscareMenuOpen) {
        this.setOfficeJumpscareMenuOpen(false);
      } else {
        this.openOfficeJumpscareMenu();
      }
    }

    if (this.input.consumeHudHelpToggle()) {
      this.hud.toggleHelperPanels();
    }

    const modeOrToolToggle = this.input.consumePlacementToolToggle();
    if (!jumpscareLocked && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitSliding && !officeScriptedMoving && !chapterFourLockerHiding && modeOrToolToggle) {
      if (this.officeChapterActive) {
        this.setOfficeModeMenuOpen(!this.officeModeMenuOpen);
      } else if (this.chapterEightActive && !this.chapterMenuOpen) {
        this.selectChapterEightHeldItem(this.chapterEightHeldItem === 'coordinate-tool' ? 'empty' : 'coordinate-tool');
      } else if (!this.chapterMenuOpen) {
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
    if (!jumpscareLocked && !chapterTwoDodoNightAttacking && !officeBallPitSliding && !officeScriptedMoving && !chapterFourLockerHiding && !this.chapterMenuOpen && !this.officeJumpscareMenuOpen && !this.officeModeMenuOpen && (this.officeChapterActive || this.chapterFourActive || this.chapterSixActive || this.chapterEightActive) && hotbarSlot) {
      if (this.officeChapterActive && this.officeTabletCameraFeedActive) {
        this.selectOfficeTabletCameraBySlot(hotbarSlot);
      } else if (this.microphoneSoundToolActive) {
        this.previewMicrophoneSoundBySlot(hotbarSlot);
      } else if (this.chapterFourActive) {
        this.handleChapterFourHotbarSlot(hotbarSlot);
      } else if (this.chapterSixActive) {
        this.chapterSix.selectHotbarSlot(hotbarSlot);
        this.syncHud();
      } else if (this.chapterEightActive) {
        this.selectChapterEightHotbarSlot(hotbarSlot);
      } else {
        this.handleOfficeHotbarSlot(hotbarSlot);
      }
    }

    const itemCycle = this.input.consumeItemCycle();
    if (!jumpscareLocked && !chapterTwoDodoNightAttacking && !officeBallPitSliding && !officeScriptedMoving && !chapterFourLockerHiding && !this.chapterMenuOpen && !this.officeJumpscareMenuOpen && !this.officeModeMenuOpen && itemCycle !== 0) {
      if (this.officeChapterActive) {
        if (this.officeTabletCameraFeedActive) {
          this.cycleOfficeTabletCamera(itemCycle);
        } else {
          this.cycleOfficeHotbarItem(itemCycle);
        }
      } else if (this.chapterFourActive) {
        this.cycleChapterFourHotbarItem(itemCycle);
      } else if (this.chapterSixActive && !this.chapterSix.isInventoryOpen()) {
        this.chapterSix.cycleHotbarSlot(itemCycle);
        this.syncHud();
      } else if (this.chapterEightActive) {
        this.cycleChapterEightHeldItem(itemCycle);
      } else if (this.zombieModeActive) {
        this.cycleZombieWeapon(itemCycle);
      } else if (this.doomModeActive) {
        this.cycleDoomWeapon(itemCycle);
      }
    }

    const weaponSelect = this.input.consumeWeaponSelect();
    if (this.zombieModeActive && weaponSelect) {
      this.selectZombieWeapon(weaponSelect);
    } else if (this.doomModeActive && weaponSelect) {
      this.selectDoomWeapon(weaponSelect);
    }

    const flashlightToggle = this.input.consumeFlashlightToggle();
    if (!chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !chapterFourLockerHiding && flashlightToggle) {
      this.flashlight.toggle();
    }

    const chapterSevenSpaceCrawlHeld = this.chapterSevenActive
      && this.input.isSpaceHeld()
      && this.input.getSpaceHeldMilliseconds() >= CHAPTER_SEVEN_CRAWL_HOLD_MS;
    const movementState = this.input.getMovementState();
    this.chapterFourCrouching = this.chapterFourActive
      && this.player.isLocked()
      && !jumpscareLocked
      && !this.chapterMenuOpen
      && !this.officeJumpscareMenuOpen
      && !this.officeModeMenuOpen
      && !chapterFourBoxHiding
      && !chapterFourLockerHiding
      && this.input.isSpaceHeld();
    const chapterSevenUnderBed = this.chapterSevenActive
      && this.chapterSeven.isPlayerUnderBed(this.player.getPosition());
    const chapterSevenInsideOven = this.chapterSevenActive
      && this.chapterSeven.isPlayerInsideOven(this.player.getPosition());
    const chapterSevenInForcedCrawlSpace = this.chapterSevenActive
      && this.chapterSeven.isPlayerInForcedCrawlSpace(this.player.getPosition());
    if (!this.chapterSevenActive || this.chapterSevenBoxHidden || this.chapterSevenSwingSeated) {
      this.chapterSevenForcedCrawl = false;
    } else if (chapterSevenInForcedCrawlSpace) {
      this.chapterSevenForcedCrawl = true;
    } else if (!chapterSevenSpaceCrawlHeld && !this.chapterSevenOvenHidden) {
      this.chapterSevenForcedCrawl = false;
    }
    this.chapterSevenCrawling = this.chapterSevenActive
      && this.player.isLocked()
      && !jumpscareLocked
      && !this.chapterMenuOpen
      && !this.officeJumpscareMenuOpen
      && !this.officeModeMenuOpen
      && !this.chapterSevenBoxHidden
      && !this.chapterSevenSwingSeated
      && (chapterSevenSpaceCrawlHeld || chapterSevenUnderBed || chapterSevenInsideOven || this.chapterSevenForcedCrawl || this.chapterSevenOvenHidden);
    let jumpRequested = !this.doomModeActive
      && !this.chapterFourActive
      && !this.chapterFiveActive
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
      && !officeScriptedMoving
      && !chapterFourBoxHiding
      && !chapterFourLockerHiding
      && !this.chapterSevenBoxHidden
      && !this.chapterSevenOvenHidden
      && !this.chapterSevenSwingSeated
      && this.input.consumeJump();
    const isTryingToMove = movementState.forward !== 0 || movementState.strafe !== 0;
    const hasSprintStamina = this.officeChapterActive || this.stamina > 0.5;
    const sprinting = this.doomModeActive
      ? this.player.isLocked() && !jumpscareLocked && !chapterTwoSeated && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeSeated && !officeTabletViewing && !officeBallPitHiding && !officeVentActive && !officeScriptedMoving && isTryingToMove
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
        && !officeScriptedMoving
        && !chapterFourBoxHiding
        && !chapterFourLockerHiding
        && !this.chapterFourCrouching
        && !this.chapterSevenCrawling
        && !this.chapterSevenBoxHidden
        && !this.chapterSevenSwingSeated
        && isTryingToMove
        && movementState.sprint
        && hasSprintStamina;

    let effectiveMovement = jumpscareLocked
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
      : officeScriptedMoving
        ? { forward: 0, strafe: 0, sprint: false }
      : officeVentActive
        ? { ...movementState, sprint: false }
      : chapterFourBoxHiding
        ? { ...movementState, sprint: false }
      : chapterFourLockerHiding
        ? { forward: 0, strafe: 0, sprint: false }
      : this.chapterFourCrouching
        ? { ...movementState, sprint: false }
      : this.chapterSevenBoxHidden
        ? { forward: 0, strafe: 0, sprint: false }
      : this.chapterSevenOvenHidden
        ? { forward: 0, strafe: 0, sprint: false }
      : this.chapterSevenSwingSeated
        ? { forward: 0, strafe: 0, sprint: false }
      : this.chapterSevenCrawling
        ? { ...movementState, sprint: false }
      : this.chapterFiveActive && !this.chapterFive.isInteriorMode() && !this.chapterFive.isSurfaceMode()
        ? {
          forward: movementState.forward,
          strafe: 0,
          sprint: isTryingToMove && movementState.sprint,
        }
      : this.doomModeActive
        ? { forward: movementState.forward, strafe: movementState.strafe, sprint: isTryingToMove }
      : sprinting
        ? movementState
        : { ...movementState, sprint: false };

    if (!jumpscareLocked && !chapterTwoBearRefusing && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitHiding && !officeBallPitSliding && !officeScriptedMoving && !chapterFourLockerHiding && this.input.consumeDrop()) {
      if (this.microphoneSoundToolActive) {
        void this.saveMicrophoneSound();
      } else if (this.cameraToolActive) {
        void this.saveCameraToolCapture();
      } else {
        this.handleDrop();
      }
    }

    if (!jumpscareLocked && !chapterTwoBearRefusing && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitSliding && !officeScriptedMoving && !chapterFourLockerHiding && this.input.consumeUseItem()) {
      if (this.chapterFourActive && this.player.isLocked() && !this.activeJumpscare) {
        this.toggleChapterFourBox();
      } else {
        this.handleUseItem();
      }
    }

    if (!jumpscareLocked && !chapterTwoBearRefusing && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitHiding && !officeBallPitSliding && !officeScriptedMoving && !chapterFourLockerHiding && this.input.consumePlacementMarkerDelete() && (this.placementToolActive || this.microphoneSoundToolActive || this.cameraToolActive)) {
      if (this.microphoneSoundToolActive) {
        this.deleteMicrophoneSound();
      } else if (this.cameraToolActive) {
        this.deleteCameraToolCapture();
      } else {
        this.handlePlacementToolRightClick();
      }
    }

    const chapterSixPickupRequested = this.input.consumePickup();
    if (!jumpscareLocked && !chapterTwoBearRefusing && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitSliding && !officeScriptedMoving && !chapterFourLockerHiding && chapterSixPickupRequested && this.chapterSixActive && this.player.isLocked() && !this.chapterSix.isInventoryOpen() && !this.placementToolActive) {
      if (this.chapterSix.pickUpLookedAtPossum()) {
        this.startChapterSixPossumPickupAnimation();
        this.pushStatus('You pick up the possum. It is now in the selected hotbar slot.', 2.4);
        this.syncHud();
      } else {
        this.pushStatus('Look closely at the possum and press R to pick it up.', 1.8);
      }
    }

    const secondaryFireRequested = this.input.consumeSecondaryFire();
    if (!jumpscareLocked && !chapterTwoBearRefusing && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitSliding && !officeScriptedMoving && !chapterFourLockerHiding && secondaryFireRequested && this.chapterEightActive && this.player.isLocked() && !this.placementToolActive) {
      this.handleChapterEightSecondaryFire();
    } else if (!jumpscareLocked && !chapterTwoBearRefusing && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitSliding && !officeScriptedMoving && !chapterFourLockerHiding && secondaryFireRequested && this.chapterSixActive && this.player.isLocked() && !this.chapterSix.isInventoryOpen() && !this.placementToolActive) {
      if (this.chapterSix.petLookedAtPossum()) {
        this.pushStatus('You lean down and pet the possum. It flips over for belly rubs.', 2.8);
        this.syncHud();
        return;
      }

      const placed = this.chapterSix.placeSelectedBlock(this.player.getPosition());
      this.pushStatus(
        placed
          ? 'Block placed from the selected hotbar slot.'
          : 'No placeable block is selected, or that block face is blocked.',
        1.6,
      );
      this.syncHud();
    }

    if (!jumpscareLocked && !chapterTwoBearRefusing && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitHiding && !officeBallPitSliding && !officeScriptedMoving && !chapterFourLockerHiding && this.input.consumeFire()) {
      if (this.officeChapterActive && this.officeTabletCameraFeedActive) {
        this.toggleOfficeTabletCameraFeed();
      } else if (this.microphoneSoundToolActive) {
        this.previewMicrophoneSound();
      } else if (this.cameraToolActive) {
        void this.captureCameraToolPicture();
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
    this.chapterSeven.setSwingInput(
      this.chapterSevenActive && this.chapterSevenSwingSeated
        ? Math.max(0, movementState.forward)
        : 0,
    );
    this.player.setSupportedFloor(this.getSupportedFloorHeight());
    this.player.setMovementConstraint(
      this.chapterSixActive
        ? (nextX, nextZ, currentPosition) => this.chapterSix.canPlayerOccupy(currentPosition, nextX, nextZ)
        : null,
    );
    const playerPositionBeforeMove = this.player.getPosition().clone();
    this.updateOfficePrizeTimers(deltaSeconds);
    const officePrizeSpeedScale = this.officeChapterActive && this.officeLollipopBoostRemaining > 0
      ? OFFICE_LOLLIPOP_SPEED_MULTIPLIER
      : 1;
    const movementSpeedScale = (officeVentActive ? 0.42 : 1)
      * officePrizeSpeedScale
      * (this.chapterSevenCrawling ? CHAPTER_SEVEN_CRAWL_SPEED_MULTIPLIER : 1);
    const playerMovementOptions = this.getOfficePlayerMovementOptions(effectiveMovement);
    if (this.chapterFiveActive && !this.chapterFive.isInteriorMode() && !this.chapterFive.isSurfaceMode()) {
      this.player.update(
        deltaSeconds,
        { forward: 0, strafe: 0, sprint: false },
        false,
        false,
        0,
        false,
      );
      this.camera.getWorldDirection(this.chapterFiveAimDirection).normalize();
      this.camera.getWorldPosition(this.chapterFiveCameraPosition);
      const chapterFiveCanSteer = this.player.isLocked() && !this.chapterMenuOpen && !jumpscareLocked;
      const chapterFiveLookDelta = chapterFiveCanSteer
        ? this.player.consumeLookDelta(this.chapterFiveLookDelta)
        : { x: 0, y: 0 };
      this.chapterFive.update(
        deltaSeconds,
        chapterFiveCanSteer
          ? {
            forward: effectiveMovement.forward,
            strafe: effectiveMovement.strafe,
            sprint: effectiveMovement.sprint,
            lookDeltaX: chapterFiveLookDelta.x,
            lookDeltaY: chapterFiveLookDelta.y,
            aimDirection: this.chapterFiveAimDirection,
            cameraPosition: this.chapterFiveCameraPosition,
            repairing: this.input.isInteractHeld(),
          }
          : {
            forward: 0,
            strafe: 0,
            sprint: false,
            lookDeltaX: 0,
            lookDeltaY: 0,
            aimDirection: this.chapterFiveAimDirection,
            cameraPosition: this.chapterFiveCameraPosition,
            repairing: false,
          },
      );
      if (chapterFiveCanSteer) {
        this.chapterFive.getFlightLookTarget(this.chapterFiveCameraPosition, this.chapterFiveFlightLookTarget);
        this.player.lookToward(this.chapterFiveFlightLookTarget, 1);
      }
    } else {
      this.player.update(
        deltaSeconds,
        effectiveMovement,
        jumpRequested,
        !officeVentActive && !officeScriptedMoving,
        movementSpeedScale,
        true,
        this.chapterSixActive ? 1.34 : 1,
        playerMovementOptions,
      );
    }
    if (this.chapterFiveActive && (this.chapterFive.isInteriorMode() || this.chapterFive.isSurfaceMode())) {
      this.camera.getWorldDirection(this.chapterFiveAimDirection).normalize();
      this.camera.getWorldPosition(this.chapterFiveCameraPosition);
      this.chapterFive.update(deltaSeconds, {
        forward: 0,
        strafe: 0,
        sprint: false,
        lookDeltaX: 0,
        lookDeltaY: 0,
        aimDirection: this.chapterFiveAimDirection,
        cameraPosition: this.chapterFiveCameraPosition,
        repairing: this.input.isInteractHeld() && this.player.isLocked(),
      });
    }
    this.updateChapterFiveAlarmAudio();
    if (chapterFourLockerHiding) {
      this.lockPlayerInChapterFourLocker();
    }
    if (officeVentActive) {
      this.constrainOfficeVentPosition();
    }
    if (this.officeEmployeeElevatorBasementActive) {
      this.constrainOfficeEmployeeElevatorBasementPosition();
    }
    if (officeVentDropping) {
      this.updateOfficeVentDropAnimation(deltaSeconds);
    }
    if (officeEmployeeElevatorRiding) {
      this.updateOfficeEmployeeElevatorRide(deltaSeconds);
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
    this.updateOfficePlayerNoise(
      deltaSeconds,
      horizontalMoveDistance,
      effectiveMovement.sprint,
      playerInOfficeBallPit,
      playerPositionAfterMove,
    );
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
        && !this.chapterFiveActive
        && !playerInOfficeBallPit
        && horizontalMoveDistance > 0.001,
      effectiveMovement.sprint,
    );
    this.updateStamina(deltaSeconds, sprinting && !this.chapterFiveActive && !this.officeChapterActive);
    this.updateChapterTwoClimb(deltaSeconds);
    this.updateChapterTwoSlide(deltaSeconds);

    if (this.zombieModeActive) {
      this.updateZombieMode(deltaSeconds);
    } else if (this.doomModeActive) {
      this.updateDoomMode(deltaSeconds);
    } else if (this.chapterTwoActive || this.officeChapterActive || this.chapterFourActive || this.chapterFiveActive || this.chapterSixActive || this.chapterSevenActive || this.chapterEightActive) {
      this.monsterState = this.unlockedMonsterState;
      this.touchingMonster = null;
    } else {
      this.updateMonster(deltaSeconds);
    }
    this.updateHealth(deltaSeconds);
    this.updateAtmosphere();
    if (!this.chapterTwoActive && !this.officeChapterActive && !this.chapterFourActive && !this.chapterFiveActive && !this.chapterSixActive && !this.chapterSevenActive && !this.chapterEightActive && !this.zombieModeActive && !this.doomModeActive) {
      this.updateVenueLights();
    }
    this.updateOfficeGlassThrows(deltaSeconds);
    this.updateOfficeJumpscare(deltaSeconds);
    this.updateJumpScareLens(deltaSeconds);
    if (!this.chapterTwoActive && !this.officeChapterActive && !this.chapterFourActive && !this.chapterFiveActive && !this.chapterSixActive && !this.chapterSevenActive && !this.chapterEightActive && !this.zombieModeActive && !this.doomModeActive) {
      this.updateMachineJobs(deltaSeconds);
    }

    if (!jumpscareLocked && !chapterTwoBearRefusing && !chapterTwoClimbing && !chapterTwoSliding && !chapterTwoDodoNightAttacking && !officeBallPitHiding && !officeBallPitSliding && !officeScriptedMoving && this.input.consumeInteract()) {
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
      this.updateOfficeDoorSoundPlayback();
      this.updateOfficeDoorSparks(deltaSeconds);
      this.updateOfficePrizeWheelAudio();
      this.updateOfficeVentDrop();
      this.updateOfficeModeCycle(deltaSeconds);
      this.updateOfficeGameMode(deltaSeconds);
      this.updateOfficeCameraPuppetThreat();
    } else if (this.chapterFourActive) {
      const chapterFourMoving = horizontalMoveDistance > 0.006;
      const chapterFourPlayerState = {
        position: this.player.getPosition(),
        crouching: this.chapterFourCrouching,
        boxActive: this.chapterFourBoxActive,
        lockerActive: this.chapterFourLockerId !== null,
        moving: chapterFourMoving,
        sprinting: effectiveMovement.sprint,
        noiseLevel: chapterFourMoving
          ? effectiveMovement.sprint
            ? 1
            : this.chapterFourCrouching
              ? 0.18
              : this.chapterFourBoxActive
                ? 0.58
                : 0.46
          : 0,
      };
      this.chapterFour.update(deltaSeconds, chapterFourPlayerState);
      if (this.chapterFour.consumeBlueRoar()) {
        this.gameplaySfxAudio.playOfficeJumpscareCue('stomp-roar');
        this.pushStatus('Blue roars and reaches both arms out.', 2.2);
      }
      if (this.chapterFour.consumeBlueStomp()) {
        this.gameplaySfxAudio.playBlueStomp();
      }
      if (this.chapterFour.consumeGreenSense()) {
        this.pushStatus('Green sweeps his long arms through the hallway. Stay out of his hands.', 2.6);
      }
      if (this.chapterFour.consumeGreenSqueak()) {
        this.gameplaySfxAudio.playGreenSqueak();
      }
      const greenBoxGrabbed = this.chapterFour.consumeGreenBoxGrab();
      const greenTouchedPlayer = this.chapterFour.consumeGreenTouch();
      if (
        !jumpscareLocked
        && this.chapterFourGreenJumpscareCooldown <= 0
        && (greenBoxGrabbed || greenTouchedPlayer)
      ) {
        this.triggerChapterFourGreenJumpscare(greenBoxGrabbed);
      }
      if (
        !jumpscareLocked
        && this.chapterFourBlueJumpscareCooldown <= 0
        && this.chapterFour.isBlueCatching(chapterFourPlayerState)
      ) {
        this.triggerChapterFourBlueJumpscare();
      }
      if (
        !jumpscareLocked
        && this.chapterFourPurpleJumpscareCooldown <= 0
        && this.chapterFour.isMistHandsCatching(this.player.getPosition(), this.chapterFourCrouching)
      ) {
        this.triggerChapterFourPurpleJumpscare();
      }
    } else if (this.chapterSevenActive) {
      this.chapterSeven.update(deltaSeconds, this.player.getPosition());
      if (this.chapterSevenSwingSeated) {
        this.player.teleport(this.chapterSeven.swingSet.sitPosition);
        this.player.lookToward(this.chapterSeven.swingSet.lookTarget, 1);
      }
    } else if (this.chapterEightActive) {
      this.chapterEight.update(deltaSeconds, this.player.getPosition());
      this.handleChapterEightMonsterEvents();
    } else if (!this.chapterTwoActive && !this.officeChapterActive && !this.chapterFourActive && !this.chapterFiveActive && !this.chapterSixActive && !this.chapterSevenActive && !this.chapterEightActive) {
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
    this.chapterSix.update(
      deltaSeconds,
      this.camera,
      this.player.getPosition(),
      this.chapterSixActive && this.player.isLocked() && !this.chapterMenuOpen && !this.chapterSix.isInventoryOpen(),
      this.input.isFireHeld(),
    );
    if (this.chapterSixActive && this.chapterSix.consumePossumSqueak()) {
      this.gameplaySfxAudio.playPossumSqueak();
    }
    this.updateChapterSixHeldItemDisplay(deltaSeconds);
    this.updateChapterSixPettingArmDisplay(deltaSeconds);
    this.updateChapterEightHeldItemDisplay(deltaSeconds);
    this.updateMicrophoneSoundToolDisplay();
    this.updateOfficeTabletDisplay();
    this.updateChapterFourBoxDisplay();
    this.updateChapterSevenBoxDisplay();
    this.updateChapterFourBlueJumpscareModel();
    this.updateChapterFourGreenJumpscareModel();
    this.updateOfficeGlassDisplay();
    this.updateOfficePrizeItemDisplay();
    if (!this.chapterTwoActive && !this.officeChapterActive && !this.chapterFourActive && !this.chapterFiveActive && !this.chapterSixActive && !this.chapterSevenActive && !this.chapterEightActive && !this.zombieModeActive && !this.doomModeActive) {
      this.updateStoveLight();
    }
    if (this.shouldSyncHudThisFrame(deltaSeconds, jumpscareLocked)) {
      this.syncHud();
    }
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

    if (this.chapterFourActive && this.chapterFourBoxActive && this.chapterFourBoxViewMode === 'wide') {
      this.updateChapterFourBoxWideCamera();
      this.renderer.render(this.scene, this.chapterFourBoxWideCamera);
      return;
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

  private updateChapterFourBoxWideCamera(): void {
    const playerPosition = this.player.getPosition();
    this.camera.getWorldDirection(this.chapterFourBoxCameraForward);
    this.chapterFourBoxCameraForward.y = 0;
    if (this.chapterFourBoxCameraForward.lengthSq() < 0.0001) {
      this.chapterFourBoxCameraForward.set(0, 0, -1);
    }
    this.chapterFourBoxCameraForward.normalize();

    const floorY = playerPosition.y - GAME_CONFIG.player.height;
    this.chapterFourBoxCameraFocus.set(playerPosition.x, floorY + 0.88, playerPosition.z);
    this.chapterFourBoxCameraDesired.copy(this.chapterFourBoxCameraFocus);
    this.chapterFourBoxCameraDesired.addScaledVector(this.chapterFourBoxCameraForward, -CHAPTER_FOUR_BOX_CAMERA_DISTANCE);
    this.chapterFourBoxCameraDesired.y = floorY + CHAPTER_FOUR_BOX_CAMERA_HEIGHT;
    this.chapterFourBoxCameraSafe.copy(this.chapterFourBoxCameraFocus);
    this.chapterFourBoxCameraSafe.y = floorY + 1.35;

    const isCameraCandidateClear = (candidate: Vector3): boolean => {
      if (isBlocked(candidate.x, candidate.z, this.chapterFour.colliders, CHAPTER_FOUR_BOX_CAMERA_RADIUS)) {
        return false;
      }

      const lineSamples = 7;
      for (let index = 1; index < lineSamples; index += 1) {
        this.chapterFourBoxCameraSample.lerpVectors(this.chapterFourBoxCameraFocus, candidate, index / lineSamples);
        if (isBlocked(
          this.chapterFourBoxCameraSample.x,
          this.chapterFourBoxCameraSample.z,
          this.chapterFour.colliders,
          CHAPTER_FOUR_BOX_CAMERA_RADIUS * 0.72,
        )) {
          return false;
        }
      }

      return true;
    };

    const samples = 12;
    let safeDistance = 0;
    for (let index = 1; index <= samples; index += 1) {
      this.chapterFourBoxCameraSample.lerpVectors(
        this.chapterFourBoxCameraFocus,
        this.chapterFourBoxCameraDesired,
        index / samples,
      );
      if (isBlocked(
        this.chapterFourBoxCameraSample.x,
        this.chapterFourBoxCameraSample.z,
        this.chapterFour.colliders,
        CHAPTER_FOUR_BOX_CAMERA_RADIUS,
      )) {
        break;
      }

      this.chapterFourBoxCameraSafe.copy(this.chapterFourBoxCameraSample);
      safeDistance = this.chapterFourBoxCameraSafe.distanceTo(this.chapterFourBoxCameraFocus);
    }

    if (safeDistance < 1.25) {
      let foundFallback = false;
      if (
        this.chapterFourBoxWideCameraReady
        && this.chapterFourBoxWideCamera.position.distanceTo(this.chapterFourBoxCameraFocus) > 1.1
        && isCameraCandidateClear(this.chapterFourBoxWideCamera.position)
      ) {
        this.chapterFourBoxCameraSafe.copy(this.chapterFourBoxWideCamera.position);
        foundFallback = true;
      }

      if (!foundFallback) {
        const fallbackDistance = 1.65;
        const desiredAngle = Math.atan2(
          this.chapterFourBoxCameraDesired.z - this.chapterFourBoxCameraFocus.z,
          this.chapterFourBoxCameraDesired.x - this.chapterFourBoxCameraFocus.x,
        );
        const fallbackOffsets = [0.55, -0.55, 1.05, -1.05, 1.65, -1.65, Math.PI] as const;
        for (const offset of fallbackOffsets) {
          this.chapterFourBoxCameraSafe.set(
            this.chapterFourBoxCameraFocus.x + Math.cos(desiredAngle + offset) * fallbackDistance,
            floorY + CHAPTER_FOUR_BOX_CAMERA_HEIGHT,
            this.chapterFourBoxCameraFocus.z + Math.sin(desiredAngle + offset) * fallbackDistance,
          );
          if (!isCameraCandidateClear(this.chapterFourBoxCameraSafe)) {
            continue;
          }

          foundFallback = true;
          break;
        }
      }

      if (!foundFallback) {
        this.chapterFourBoxCameraSafe.set(
          this.chapterFourBoxCameraFocus.x,
          floorY + CHAPTER_FOUR_BOX_CAMERA_HEIGHT + 0.35,
          this.chapterFourBoxCameraFocus.z,
        );
      }
    }

    if (
      !this.chapterFourBoxWideCameraReady
      || this.chapterFourBoxWideCamera.position.distanceToSquared(this.chapterFourBoxCameraSafe) > 144
    ) {
      this.chapterFourBoxWideCamera.position.copy(this.chapterFourBoxCameraSafe);
      this.chapterFourBoxWideCameraReady = true;
    } else {
      this.chapterFourBoxWideCamera.position.lerp(this.chapterFourBoxCameraSafe, 0.28);
    }
    this.chapterFourBoxWideCamera.lookAt(this.chapterFourBoxCameraFocus);
  }

  private updateStamina(deltaSeconds: number, sprinting: boolean): void {
    if (this.doomModeActive || this.officeChapterActive) {
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

  private updateOfficePrizeTimers(deltaSeconds: number): void {
    if (!this.officeChapterActive) {
      this.officeLollipopBoostRemaining = 0;
      this.officeLollipopUseTimer = 0;
      return;
    }

    this.officeLollipopBoostRemaining = Math.max(0, this.officeLollipopBoostRemaining - deltaSeconds);
    this.officeLollipopUseTimer = Math.max(0, this.officeLollipopUseTimer - deltaSeconds);
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

  private createOfficePrizeHandModel(): Group {
    const root = new Group();
    const handMaterial = new MeshStandardMaterial({
      color: 0xc88c65,
      roughness: 0.7,
      metalness: 0.02,
    });

    const palm = new Mesh(new BoxGeometry(0.22, 0.14, 0.16), handMaterial);
    palm.position.set(0.02, -0.1, 0.08);
    palm.rotation.set(0.08, -0.28, 0.04);
    const thumb = new Mesh(new CylinderGeometry(0.028, 0.035, 0.22, 10), handMaterial);
    thumb.position.set(-0.1, -0.015, -0.005);
    thumb.rotation.set(0.7, 0.16, -0.74);
    const finger = new Mesh(new CylinderGeometry(0.026, 0.031, 0.22, 10), handMaterial);
    finger.position.set(0.1, -0.01, -0.02);
    finger.rotation.set(0.66, -0.16, 0.56);
    root.add(palm, thumb, finger);
    return root;
  }

  private createOfficeTinyBearToyModel(includeHand = false): Group {
    const root = new Group();
    const furMaterial = new MeshStandardMaterial({
      color: 0x9b5f36,
      emissive: 0x160804,
      emissiveIntensity: 0.08,
      roughness: 0.76,
      metalness: 0.02,
    });
    const muzzleMaterial = new MeshStandardMaterial({
      color: 0xd6ad82,
      roughness: 0.72,
      metalness: 0.02,
    });
    const darkMaterial = new MeshStandardMaterial({
      color: 0x16100c,
      emissive: 0x030100,
      emissiveIntensity: 0.12,
      roughness: 0.5,
      metalness: 0.02,
    });

    if (includeHand) {
      root.add(this.createOfficePrizeHandModel());
    }

    const toy = new Group();
    toy.position.set(0, 0.07, -0.13);
    const body = new Mesh(new SphereGeometry(0.09, 14, 10), furMaterial);
    body.scale.set(0.88, 1.02, 0.72);
    const head = new Mesh(new SphereGeometry(0.07, 14, 10), furMaterial);
    head.position.y = 0.115;
    const muzzle = new Mesh(new SphereGeometry(0.032, 10, 8), muzzleMaterial);
    muzzle.position.set(0, 0.104, -0.058);
    muzzle.scale.set(1.25, 0.72, 0.62);
    const nose = new Mesh(new SphereGeometry(0.01, 8, 6), darkMaterial);
    nose.position.set(0, 0.112, -0.082);
    [-0.038, 0.038].forEach((x) => {
      const ear = new Mesh(new SphereGeometry(0.025, 10, 8), furMaterial);
      ear.position.set(x, 0.17, -0.004);
      toy.add(ear);
      const eye = new Mesh(new SphereGeometry(0.007, 8, 6), darkMaterial);
      eye.position.set(x * 0.52, 0.126, -0.066);
      toy.add(eye);
    });
    [-0.055, 0.055].forEach((x) => {
      const arm = new Mesh(new SphereGeometry(0.025, 10, 8), furMaterial);
      arm.position.set(x, 0.02, -0.026);
      arm.scale.set(0.72, 1.1, 0.62);
      const leg = new Mesh(new SphereGeometry(0.026, 10, 8), furMaterial);
      leg.position.set(x * 0.7, -0.068, -0.016);
      leg.scale.set(0.9, 0.58, 0.72);
      toy.add(arm, leg);
    });
    toy.add(body, head, muzzle, nose);
    root.add(toy);
    return root;
  }

  private createOfficeLollipopModel(includeHand = false): Group {
    const root = new Group();
    const candyMaterial = new MeshStandardMaterial({
      color: 0xff4f95,
      emissive: 0x66122f,
      emissiveIntensity: 0.18,
      roughness: 0.32,
      metalness: 0.04,
    });
    const stripeMaterial = new MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x44223a,
      emissiveIntensity: 0.08,
      roughness: 0.36,
      metalness: 0.02,
    });
    const stickMaterial = new MeshStandardMaterial({
      color: 0xf8e5bf,
      roughness: 0.58,
      metalness: 0.02,
    });

    if (includeHand) {
      root.add(this.createOfficePrizeHandModel());
    }

    const candy = new Group();
    candy.position.set(0, 0.09, -0.14);
    candy.rotation.z = -0.18;
    const stick = new Mesh(new CylinderGeometry(0.01, 0.012, 0.32, 10), stickMaterial);
    stick.position.y = -0.1;
    stick.rotation.z = 0.08;
    const head = new Mesh(new SphereGeometry(0.075, 18, 12), candyMaterial);
    head.position.y = 0.09;
    head.scale.set(1.05, 1.05, 0.32);
    for (let index = 0; index < 3; index += 1) {
      const stripe = new Mesh(new TorusGeometry(0.04 + index * 0.014, 0.0035, 6, 20), stripeMaterial);
      stripe.position.set(0, 0.09, -0.003 + index * 0.002);
      stripe.rotation.z = index * 0.6;
      stripe.scale.y = 0.62;
      head.add(stripe);
    }
    candy.add(stick, head);
    root.add(candy);
    return root;
  }

  private createOfficeDuckToyModel(includeHand = false): Group {
    const root = new Group();
    const duckMaterial = new MeshStandardMaterial({
      color: 0xf5c747,
      emissive: 0x4c2a00,
      emissiveIntensity: 0.16,
      roughness: 0.58,
      metalness: 0.02,
    });
    const beakMaterial = new MeshStandardMaterial({
      color: 0xf07b22,
      emissive: 0x4e1604,
      emissiveIntensity: 0.14,
      roughness: 0.42,
      metalness: 0.02,
    });
    const bibMaterial = new MeshStandardMaterial({
      color: 0x4aa6d8,
      emissive: 0x062c44,
      emissiveIntensity: 0.12,
      roughness: 0.5,
      metalness: 0.03,
    });
    const darkMaterial = new MeshStandardMaterial({
      color: 0x101010,
      roughness: 0.5,
      metalness: 0.02,
    });

    if (includeHand) {
      root.add(this.createOfficePrizeHandModel());
    }

    const duck = new Group();
    duck.position.set(0, 0.075, -0.13);
    const body = new Mesh(new SphereGeometry(0.105, 16, 12), duckMaterial);
    body.scale.set(1.18, 0.9, 0.78);
    const head = new Mesh(new SphereGeometry(0.07, 14, 10), duckMaterial);
    head.position.set(0, 0.12, -0.03);
    const beak = new Mesh(new BoxGeometry(0.07, 0.026, 0.06), beakMaterial);
    beak.position.set(0, 0.116, -0.09);
    beak.scale.z = 0.7;
    const bib = new Mesh(new BoxGeometry(0.1, 0.052, 0.014), bibMaterial);
    bib.position.set(0, 0.026, -0.085);
    bib.rotation.x = -0.25;
    [-0.026, 0.026].forEach((x) => {
      const eye = new Mesh(new SphereGeometry(0.008, 8, 6), darkMaterial);
      eye.position.set(x, 0.136, -0.088);
      duck.add(eye);
    });
    duck.add(body, head, beak, bib);
    root.add(duck);
    return root;
  }

  private createOfficeStuffieModel(includeHand = false): Group {
    const root = new Group();
    const plushMaterial = new MeshStandardMaterial({
      color: 0xb884d2,
      emissive: 0x2a0c3a,
      emissiveIntensity: 0.12,
      roughness: 0.86,
      metalness: 0.01,
    });
    const muzzleMaterial = new MeshStandardMaterial({
      color: 0xf0c7e8,
      roughness: 0.78,
      metalness: 0.01,
    });
    const darkMaterial = new MeshStandardMaterial({
      color: 0x120816,
      roughness: 0.42,
      metalness: 0.02,
    });

    if (includeHand) {
      root.add(this.createOfficePrizeHandModel());
    }

    const plush = new Group();
    plush.position.set(0, 0.06, -0.13);
    const body = new Mesh(new SphereGeometry(0.125, 16, 12), plushMaterial);
    body.scale.set(0.92, 1.12, 0.72);
    const head = new Mesh(new SphereGeometry(0.088, 16, 12), plushMaterial);
    head.position.y = 0.16;
    const muzzle = new Mesh(new SphereGeometry(0.036, 10, 8), muzzleMaterial);
    muzzle.position.set(0, 0.148, -0.072);
    muzzle.scale.set(1.3, 0.7, 0.58);
    [-0.054, 0.054].forEach((x) => {
      const ear = new Mesh(new SphereGeometry(0.03, 10, 8), plushMaterial);
      ear.position.set(x, 0.235, -0.006);
      const eye = new Mesh(new SphereGeometry(0.008, 8, 6), darkMaterial);
      eye.position.set(x * 0.46, 0.172, -0.078);
      const paw = new Mesh(new SphereGeometry(0.032, 10, 8), plushMaterial);
      paw.position.set(x, -0.055, -0.018);
      paw.scale.set(0.86, 0.62, 0.7);
      plush.add(ear, eye, paw);
    });
    plush.add(body, head, muzzle);
    root.add(plush);
    return root;
  }

  private createOfficePrizeItemModels(): void {
    const models: Array<[OfficePrizeItemId, Group]> = [
      ['tiny-bear', this.createOfficeTinyBearToyModel(true)],
      ['lollipop', this.createOfficeLollipopModel(true)],
      ['duck-toy', this.createOfficeDuckToyModel(true)],
      ['stuffie', this.createOfficeStuffieModel(true)],
    ];

    models.forEach(([item, model]) => {
      model.visible = false;
      this.officePrizeItemModels.set(item, model);
      this.officePrizeItemAnchor.add(model);
    });
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

  private prepareChapterFourJumpscareLayer(root: Group, backdrop: Mesh): void {
    root.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        material.depthTest = false;
        material.depthWrite = false;
        material.needsUpdate = true;
      });
      object.renderOrder = object === backdrop ? 46 : 48;
    });
  }

  private createChapterFourBlueJumpscareModel(): void {
    const skinMaterial = new MeshStandardMaterial({
      color: 0x1f62d7,
      emissive: 0x061940,
      emissiveIntensity: 0.18,
      roughness: 0.78,
      metalness: 0.02,
    });
    const eyeMaterial = new MeshStandardMaterial({
      color: 0xff2525,
      emissive: 0xff0000,
      emissiveIntensity: 1.15,
      roughness: 0.32,
      metalness: 0.02,
    });
    const buttonMaterial = new MeshStandardMaterial({
      color: 0x111823,
      emissive: 0x010309,
      emissiveIntensity: 0.28,
      roughness: 0.48,
      metalness: 0.16,
    });
    const buttonHoleMaterial = new MeshStandardMaterial({
      color: 0xc8e8ff,
      emissive: 0x4aa4ff,
      emissiveIntensity: 0.46,
      roughness: 0.35,
      metalness: 0.04,
    });
    const crownMaterial = new MeshStandardMaterial({
      color: 0xd7a83d,
      emissive: 0x5c3a00,
      emissiveIntensity: 0.38,
      roughness: 0.36,
      metalness: 0.36,
    });
    const mouthMaterial = new MeshBasicMaterial({
      color: 0x00030b,
    });
    const backdropMaterial = new MeshBasicMaterial({
      color: 0x000000,
      depthWrite: false,
    });
    const droolMaterial = new MeshStandardMaterial({
      color: 0xaeefff,
      emissive: 0x2a9cc4,
      emissiveIntensity: 0.32,
      roughness: 0.18,
      metalness: 0.02,
      transparent: true,
      opacity: 0.68,
    });

    const root = this.chapterFourBlueJumpscareAnchor;
    root.clear();
    root.visible = false;

    const body = new Mesh(new SphereGeometry(0.82, 24, 16), skinMaterial);
    body.position.set(0, 0.62, 0);
    body.scale.set(0.74, 1.15, 0.52);
    body.rotation.x = -0.18;

    const neck = new Mesh(new CylinderGeometry(0.16, 0.2, 0.54, 14), skinMaterial);
    neck.position.set(0, 1.38, 0.08);
    neck.rotation.x = -0.32;

    const head = this.chapterFourBlueJumpscareHead;
    head.clear();
    head.position.set(0, 1.82, 0.18);

    const headShell = new Mesh(new SphereGeometry(0.5, 24, 18), skinMaterial);
    headShell.scale.set(1.0, 1.08, 0.9);
    head.add(headShell);

    const lowerFace = new Mesh(new SphereGeometry(0.32, 18, 12), skinMaterial);
    lowerFace.position.set(0, -0.16, 0.38);
    lowerFace.scale.set(1.15, 0.56, 0.34);
    head.add(lowerFace);

    const crown = new Group();
    crown.position.set(0, 0.58, 0.03);
    head.add(crown);
    const crownBand = new Mesh(new BoxGeometry(0.74, 0.14, 0.18), crownMaterial);
    crownBand.position.set(0, 0, 0);
    crown.add(crownBand);
    [-0.27, 0, 0.27].forEach((offsetX, index) => {
      const point = new Mesh(new CylinderGeometry(0.025, 0.09, 0.36 + (index === 1 ? 0.1 : 0), 4), crownMaterial);
      point.position.set(offsetX, 0.2, 0);
      point.rotation.z = index === 0 ? 0.18 : index === 2 ? -0.18 : 0;
      crown.add(point);
    });

    const goodEye = new Mesh(new SphereGeometry(0.095, 16, 10), eyeMaterial);
    goodEye.position.set(-0.17, 0.08, 0.43);
    goodEye.scale.set(1.1, 1.2, 0.34);
    head.add(goodEye);

    const buttonEye = new Mesh(new CylinderGeometry(0.11, 0.11, 0.03, 22), buttonMaterial);
    buttonEye.position.set(0.18, 0.08, 0.445);
    buttonEye.rotation.x = Math.PI / 2;
    head.add(buttonEye);
    [-0.035, 0.035].forEach((offset) => {
      const horizontalHole = new Mesh(new BoxGeometry(0.018, 0.018, 0.012), buttonHoleMaterial);
      horizontalHole.position.set(0.18 + offset, 0.082, 0.468);
      head.add(horizontalHole);
      const verticalHole = new Mesh(new BoxGeometry(0.018, 0.018, 0.012), buttonHoleMaterial);
      verticalHole.position.set(0.18, 0.082 + offset, 0.468);
      head.add(verticalHole);
    });

    const maw = this.chapterFourBlueJumpscareMaw;
    maw.clear();
    maw.position.set(0, -0.18, 0.45);
    const mouth = new Mesh(new SphereGeometry(0.22, 18, 12), mouthMaterial);
    mouth.scale.set(1.35, 1.8, 0.22);
    maw.add(mouth);
    head.add(maw);

    const drool = new Mesh(new CylinderGeometry(0.02, 0.01, 0.45, 8), droolMaterial);
    drool.position.set(0.11, -0.42, 0.47);
    drool.rotation.z = -0.08;
    head.add(drool);

    const makeArm = (side: -1 | 1, arm: Group): void => {
      arm.clear();
      arm.position.set(side * 0.62, 1.12, 0.08);
      const upper = new Mesh(new CylinderGeometry(0.085, 0.105, 0.72, 14), skinMaterial);
      upper.position.set(side * 0.02, -0.08, 0.28);
      upper.rotation.x = Math.PI / 2;
      upper.rotation.z = side * 0.22;
      const forearm = new Mesh(new CylinderGeometry(0.07, 0.085, 0.76, 14), skinMaterial);
      forearm.position.set(side * 0.04, -0.16, 0.74);
      forearm.rotation.x = Math.PI / 2;
      forearm.rotation.z = side * 0.1;
      const hand = new Mesh(new SphereGeometry(0.16, 16, 10), skinMaterial);
      hand.position.set(side * 0.06, -0.17, 1.18);
      hand.scale.set(0.86, 0.58, 0.68);
      arm.add(upper, forearm, hand);
    };

    makeArm(-1, this.chapterFourBlueJumpscareLeftArm);
    makeArm(1, this.chapterFourBlueJumpscareRightArm);
    const backdrop = new Mesh(new PlaneGeometry(9, 5.6), backdropMaterial);
    backdrop.position.set(0, 1.34, -1.08);
    root.add(backdrop, body, neck, head, this.chapterFourBlueJumpscareLeftArm, this.chapterFourBlueJumpscareRightArm);
    this.prepareChapterFourJumpscareLayer(root, backdrop);
  }

  private createChapterFourGreenJumpscareModel(): void {
    const skinMaterial = new MeshStandardMaterial({
      color: 0x1ca64f,
      emissive: 0x062a14,
      emissiveIntensity: 0.22,
      roughness: 0.82,
      metalness: 0.02,
    });
    const eyeMaterial = new MeshStandardMaterial({
      color: 0xf4fff0,
      emissive: 0x9eff8d,
      emissiveIntensity: 0.22,
      roughness: 0.34,
      metalness: 0.02,
    });
    const pupilMaterial = new MeshBasicMaterial({
      color: 0x050806,
    });
    const mouthMaterial = new MeshBasicMaterial({
      color: 0x030405,
    });
    const toothMaterial = new MeshStandardMaterial({
      color: 0xf0ead2,
      roughness: 0.58,
      metalness: 0.01,
    });
    const tongueMaterial = new MeshStandardMaterial({
      color: 0xc93535,
      emissive: 0x3d0505,
      emissiveIntensity: 0.18,
      roughness: 0.52,
      metalness: 0.02,
    });
    const backdropMaterial = new MeshBasicMaterial({
      color: 0x000000,
      depthWrite: false,
    });

    const root = this.chapterFourGreenJumpscareAnchor;
    root.clear();
    root.visible = false;

    const body = this.chapterFourGreenJumpscareBody;
    body.clear();
    body.position.set(0, 0.9, 0);

    const torso = new Mesh(new CylinderGeometry(0.22, 0.3, 2.25, 18), skinMaterial);
    torso.position.set(0, 0.05, 0);
    torso.scale.set(0.72, 1, 0.58);
    body.add(torso);

    const headCap = new Mesh(new SphereGeometry(0.4, 20, 14), skinMaterial);
    headCap.position.set(0, 1.22, 0.12);
    headCap.scale.set(0.84, 0.72, 0.62);
    body.add(headCap);

    const faceBulge = new Mesh(new SphereGeometry(0.46, 20, 14), skinMaterial);
    faceBulge.position.set(0, 1.0, 0.38);
    faceBulge.scale.set(0.82, 0.74, 0.5);
    body.add(faceBulge);

    [-0.18, 0.18].forEach((offsetX, index) => {
      const eye = new Mesh(new SphereGeometry(0.15, 16, 10), eyeMaterial);
      eye.position.set(offsetX, 1.32 + (index === 0 ? 0.03 : -0.02), 0.56);
      eye.scale.set(1.1, 1.2, 0.52);
      body.add(eye);
      const pupil = new Mesh(new SphereGeometry(0.048, 10, 8), pupilMaterial);
      pupil.position.set(offsetX + (index === 0 ? 0.035 : -0.02), 1.31 + (index === 0 ? -0.015 : 0.02), 0.64);
      pupil.scale.set(1, 1, 0.45);
      body.add(pupil);
    });

    const maw = this.chapterFourGreenJumpscareMaw;
    maw.clear();
    maw.position.set(0, 0.82, 0.66);
    const mouth = new Mesh(new SphereGeometry(0.3, 18, 12), mouthMaterial);
    mouth.scale.set(1.24, 1.28, 0.22);
    maw.add(mouth);
    [-0.23, -0.12, 0, 0.12, 0.23].forEach((offsetX, index) => {
      const upperTooth = new Mesh(new CylinderGeometry(0, 0.034, 0.24 + (index % 2) * 0.04, 4), toothMaterial);
      upperTooth.position.set(offsetX, 0.14, 0.09);
      upperTooth.rotation.x = Math.PI * 0.5;
      upperTooth.rotation.z = (index - 2) * 0.12;
      maw.add(upperTooth);
      const lowerTooth = new Mesh(new CylinderGeometry(0, 0.03, 0.22 + ((index + 1) % 2) * 0.035, 4), toothMaterial);
      lowerTooth.position.set(offsetX * 0.92, -0.15, 0.09);
      lowerTooth.rotation.x = -Math.PI * 0.5;
      lowerTooth.rotation.z = (2 - index) * 0.1;
      maw.add(lowerTooth);
    });
    const tongue = new Mesh(new CylinderGeometry(0.038, 0.052, 0.54, 10), tongueMaterial);
    tongue.position.set(0.04, -0.24, 0.1);
    tongue.rotation.set(Math.PI / 2, 0.04, -0.12);
    maw.add(tongue);
    body.add(maw);

    const makeArm = (side: -1 | 1, arm: Group): void => {
      arm.clear();
      arm.position.set(side * 0.34, 1.22, 0.06);
      const upper = new Mesh(new CylinderGeometry(0.05, 0.07, 0.92, 14), skinMaterial);
      upper.position.set(side * 0.24, -0.18, 0.36);
      upper.rotation.set(Math.PI / 2, 0, side * 0.2);
      const elbow = new Mesh(new SphereGeometry(0.1, 12, 8), skinMaterial);
      elbow.position.set(side * 0.38, -0.3, 0.78);
      const forearm = new Mesh(new CylinderGeometry(0.04, 0.06, 1.15, 14), skinMaterial);
      forearm.position.set(side * 0.48, -0.3, 1.28);
      forearm.rotation.set(Math.PI / 2, 0, side * 0.1);
      const hand = new Mesh(new SphereGeometry(0.15, 14, 10), skinMaterial);
      hand.position.set(side * 0.56, -0.3, 1.92);
      hand.scale.set(0.9, 0.48, 0.76);
      arm.add(upper, elbow, forearm, hand);
      [-0.1, -0.03, 0.04, 0.11].forEach((offset, index) => {
        const finger = new Mesh(new CylinderGeometry(0.012, 0.018, 0.34 - index * 0.025, 8), skinMaterial);
        finger.position.set(side * (0.58 + Math.abs(offset) * 0.14), -0.31, 2.16 + offset);
        finger.rotation.x = Math.PI / 2 + 0.1;
        finger.rotation.z = side * (0.18 + index * 0.04);
        arm.add(finger);
      });
    };

    makeArm(-1, this.chapterFourGreenJumpscareLeftArm);
    makeArm(1, this.chapterFourGreenJumpscareRightArm);
    const backdrop = new Mesh(new PlaneGeometry(9, 5.6), backdropMaterial);
    backdrop.position.set(0, 1.24, -1.05);
    root.add(backdrop, body, this.chapterFourGreenJumpscareLeftArm, this.chapterFourGreenJumpscareRightArm);
    this.prepareChapterFourJumpscareLayer(root, backdrop);
  }

  private createChapterFourBoxModels(): void {
    const cardboardMaterial = new MeshStandardMaterial({
      color: 0xa97745,
      emissive: 0x261205,
      emissiveIntensity: 0.08,
      roughness: 0.92,
      metalness: 0.01,
    });
    const edgeMaterial = new MeshStandardMaterial({
      color: 0x5b321a,
      emissive: 0x120603,
      emissiveIntensity: 0.06,
      roughness: 0.86,
      metalness: 0.02,
    });
    const tapeMaterial = new MeshStandardMaterial({
      color: 0xc09256,
      emissive: 0x2a1605,
      emissiveIntensity: 0.05,
      roughness: 0.82,
      metalness: 0.01,
    });
    const creaseMaterial = new MeshStandardMaterial({
      color: 0x4b2914,
      emissive: 0x0b0301,
      emissiveIntensity: 0.04,
      roughness: 0.94,
      metalness: 0.01,
    });
    const handMaterial = new MeshStandardMaterial({
      color: 0xc88c65,
      roughness: 0.7,
      metalness: 0.02,
    });
    const insideMaterial = new MeshBasicMaterial({
      color: 0x7d4d2c,
      transparent: true,
      opacity: 0.98,
      depthWrite: false,
      side: DoubleSide,
    });
    const peepholeEdgeMaterial = new MeshBasicMaterial({
      color: 0x7b4d2b,
      transparent: true,
      opacity: 0.98,
      depthWrite: false,
      side: DoubleSide,
    });
    const insideCreaseMaterial = new MeshBasicMaterial({
      color: 0x9a6338,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      side: DoubleSide,
    });

    const heldBox = new Mesh(new BoxGeometry(0.48, 0.32, 0.38), cardboardMaterial);
    heldBox.position.set(0, 0.02, -0.08);
    const heldFrontEdge = new Mesh(new BoxGeometry(0.52, 0.035, 0.045), edgeMaterial);
    heldFrontEdge.position.set(0, 0.2, -0.29);
    const heldBackEdge = new Mesh(new BoxGeometry(0.5, 0.032, 0.04), edgeMaterial);
    heldBackEdge.position.set(0, 0.19, 0.11);
    const heldLeftEdge = new Mesh(new BoxGeometry(0.04, 0.035, 0.38), edgeMaterial);
    heldLeftEdge.position.set(-0.27, 0.2, -0.08);
    const heldRightEdge = new Mesh(new BoxGeometry(0.04, 0.035, 0.38), edgeMaterial);
    heldRightEdge.position.set(0.27, 0.2, -0.08);
    const heldLeftFlap = new Mesh(new BoxGeometry(0.24, 0.035, 0.31), cardboardMaterial);
    heldLeftFlap.position.set(-0.16, 0.27, -0.1);
    heldLeftFlap.rotation.set(0.22, 0, 0.28);
    const heldRightFlap = new Mesh(new BoxGeometry(0.24, 0.035, 0.31), cardboardMaterial);
    heldRightFlap.position.set(0.16, 0.27, -0.1);
    heldRightFlap.rotation.set(0.18, 0, -0.28);
    const heldBackFlap = new Mesh(new BoxGeometry(0.44, 0.032, 0.18), cardboardMaterial);
    heldBackFlap.position.set(0, 0.255, 0.09);
    heldBackFlap.rotation.x = -0.34;
    const heldTape = new Mesh(new BoxGeometry(0.055, 0.012, 0.41), tapeMaterial);
    heldTape.position.set(0, 0.191, -0.08);
    const heldFrontTape = new Mesh(new BoxGeometry(0.38, 0.014, 0.035), tapeMaterial);
    heldFrontTape.position.set(0, 0.045, -0.286);
    const heldLeftCrease = new Mesh(new BoxGeometry(0.015, 0.29, 0.012), creaseMaterial);
    heldLeftCrease.position.set(-0.13, 0.02, -0.277);
    const heldRightCrease = heldLeftCrease.clone();
    heldRightCrease.position.x = 0.13;
    const heldHand = new Mesh(new BoxGeometry(0.24, 0.14, 0.18), handMaterial);
    heldHand.position.set(-0.18, -0.15, 0.02);
    heldHand.rotation.set(0.1, -0.24, 0.14);
    const heldSecondHand = new Mesh(new BoxGeometry(0.2, 0.12, 0.16), handMaterial);
    heldSecondHand.position.set(0.22, -0.13, -0.01);
    heldSecondHand.rotation.set(0.04, 0.22, -0.1);
    this.chapterFourBoxHeldAnchor.add(
      heldHand,
      heldSecondHand,
      heldBox,
      heldFrontEdge,
      heldBackEdge,
      heldLeftEdge,
      heldRightEdge,
      heldLeftFlap,
      heldRightFlap,
      heldBackFlap,
      heldTape,
      heldFrontTape,
      heldLeftCrease,
      heldRightCrease,
    );

    const leftPanel = new Mesh(new BoxGeometry(0.58, 1.34, 0.06), insideMaterial);
    leftPanel.position.set(-0.51, 0, 0);
    const rightPanel = new Mesh(new BoxGeometry(0.58, 1.34, 0.06), insideMaterial);
    rightPanel.position.set(0.51, 0, 0);
    const topPanel = new Mesh(new BoxGeometry(1.34, 0.48, 0.06), insideMaterial);
    topPanel.position.set(0, 0.46, 0);
    const bottomPanel = new Mesh(new BoxGeometry(1.34, 0.48, 0.06), insideMaterial);
    bottomPanel.position.set(0, -0.46, 0);
    const peepholeTop = new Mesh(new BoxGeometry(0.5, 0.08, 0.07), peepholeEdgeMaterial);
    peepholeTop.position.set(0, 0.25, -0.02);
    const peepholeBottom = new Mesh(new BoxGeometry(0.5, 0.08, 0.07), peepholeEdgeMaterial);
    peepholeBottom.position.set(0, -0.25, -0.02);
    const peepholeLeft = new Mesh(new BoxGeometry(0.08, 0.5, 0.07), peepholeEdgeMaterial);
    peepholeLeft.position.set(-0.25, 0, -0.02);
    const peepholeRight = new Mesh(new BoxGeometry(0.08, 0.5, 0.07), peepholeEdgeMaterial);
    peepholeRight.position.set(0.25, 0, -0.02);
    const leftVerticalCrease = new Mesh(new BoxGeometry(0.026, 1.18, 0.074), insideCreaseMaterial);
    leftVerticalCrease.position.set(-0.51, 0, 0.018);
    const rightVerticalCrease = leftVerticalCrease.clone();
    rightVerticalCrease.position.x = 0.51;
    const topCrease = new Mesh(new BoxGeometry(1.16, 0.024, 0.074), insideCreaseMaterial);
    topCrease.position.set(0, 0.42, 0.018);
    const bottomCrease = topCrease.clone();
    bottomCrease.position.y = -0.42;
    this.chapterFourBoxHideAnchor.add(
      leftPanel,
      rightPanel,
      topPanel,
      bottomPanel,
      peepholeTop,
      peepholeBottom,
      peepholeLeft,
      peepholeRight,
      leftVerticalCrease,
      rightVerticalCrease,
      topCrease,
      bottomCrease,
    );

    const wideInsideMaterial = new MeshBasicMaterial({
      color: 0x7a4928,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      side: DoubleSide,
    });
    const wideEdgeMaterial = new MeshBasicMaterial({
      color: 0x3c210f,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      side: DoubleSide,
    });
    const wideTopPanel = new Mesh(new BoxGeometry(1.68, 0.18, 0.07), wideInsideMaterial);
    wideTopPanel.position.set(0, 0.58, 0);
    wideTopPanel.rotation.x = 0.18;
    const wideBottomLip = new Mesh(new BoxGeometry(1.42, 0.16, 0.07), wideInsideMaterial);
    wideBottomLip.position.set(0, -0.62, 0);
    wideBottomLip.rotation.x = -0.12;
    const wideLeftWall = new Mesh(new BoxGeometry(0.18, 1.22, 0.07), wideInsideMaterial);
    wideLeftWall.position.set(-0.86, -0.02, 0);
    wideLeftWall.rotation.z = -0.08;
    const wideRightWall = new Mesh(new BoxGeometry(0.18, 1.22, 0.07), wideInsideMaterial);
    wideRightWall.position.set(0.86, -0.02, 0);
    wideRightWall.rotation.z = 0.08;
    const wideCeilingFlap = new Mesh(new BoxGeometry(1.04, 0.16, 0.06), wideInsideMaterial);
    wideCeilingFlap.position.set(0, 0.38, -0.08);
    wideCeilingFlap.rotation.x = 0.45;
    const wideLeftTape = new Mesh(new BoxGeometry(0.04, 1.1, 0.078), wideEdgeMaterial);
    wideLeftTape.position.set(-0.68, -0.02, 0.024);
    const wideRightTape = wideLeftTape.clone();
    wideRightTape.position.x = 0.68;
    const wideTopCrease = new Mesh(new BoxGeometry(1.32, 0.026, 0.08), wideEdgeMaterial);
    wideTopCrease.position.set(0, 0.48, 0.026);
    const wideBottomCrease = wideTopCrease.clone();
    wideBottomCrease.position.y = -0.52;
    this.chapterFourBoxWideAnchor.add(
      wideTopPanel,
      wideBottomLip,
      wideLeftWall,
      wideRightWall,
      wideCeilingFlap,
      wideLeftTape,
      wideRightTape,
      wideTopCrease,
      wideBottomCrease,
    );

    const worldBoxRoot = new Group();
    const worldBoxShell = new Mesh(new BoxGeometry(0.92, 0.82, 0.92), cardboardMaterial);
    worldBoxShell.position.set(0, 0.54, 0);
    const worldFrontEdge = new Mesh(new BoxGeometry(0.98, 0.08, 0.08), edgeMaterial);
    worldFrontEdge.position.set(0, 0.98, -0.5);
    const worldBackEdge = new Mesh(new BoxGeometry(0.98, 0.08, 0.08), edgeMaterial);
    worldBackEdge.position.set(0, 0.98, 0.5);
    const worldLeftEdge = new Mesh(new BoxGeometry(0.08, 0.08, 1.0), edgeMaterial);
    worldLeftEdge.position.set(-0.5, 0.98, 0);
    const worldRightEdge = new Mesh(new BoxGeometry(0.08, 0.08, 1.0), edgeMaterial);
    worldRightEdge.position.set(0.5, 0.98, 0);
    const worldTopFlap = new Mesh(new BoxGeometry(0.44, 0.04, 0.62), cardboardMaterial);
    worldTopFlap.position.set(-0.24, 1.12, 0);
    worldTopFlap.rotation.z = 0.22;
    const worldTopFlapRight = new Mesh(new BoxGeometry(0.44, 0.04, 0.62), cardboardMaterial);
    worldTopFlapRight.position.set(0.24, 1.12, 0);
    worldTopFlapRight.rotation.z = -0.22;
    const worldTape = new Mesh(new BoxGeometry(0.08, 0.018, 0.92), tapeMaterial);
    worldTape.position.set(0, 0.965, 0);
    worldBoxRoot.add(
      worldBoxShell,
      worldFrontEdge,
      worldBackEdge,
      worldLeftEdge,
      worldRightEdge,
      worldTopFlap,
      worldTopFlapRight,
      worldTape,
    );
    this.chapterFourBoxWorldAnchor.add(worldBoxRoot);
  }

  private createChapterSevenBoxHideModel(): void {
    const cardboardInside = new MeshBasicMaterial({
      color: 0xb8783f,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
      side: DoubleSide,
    });
    const creaseMaterial = new MeshBasicMaterial({
      color: 0x5a3319,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      side: DoubleSide,
    });

    const leftWall = new Mesh(new BoxGeometry(0.15, 1.35, 0.08), cardboardInside);
    leftWall.position.set(-0.52, -0.03, 0);
    const rightWall = leftWall.clone();
    rightWall.position.x = 0.52;
    const topWall = new Mesh(new BoxGeometry(1.16, 0.18, 0.08), cardboardInside);
    topWall.position.set(0, 0.5, 0);
    const bottomWall = new Mesh(new BoxGeometry(1.16, 0.18, 0.08), cardboardInside);
    bottomWall.position.set(0, -0.54, 0);
    const frontPanel = new Mesh(new BoxGeometry(0.78, 0.62, 0.075), cardboardInside);
    frontPanel.position.set(0, 0, -0.08);
    const centerCrease = new Mesh(new BoxGeometry(0.034, 1.08, 0.09), creaseMaterial);
    centerCrease.position.set(0, -0.03, -0.035);
    const topCrease = new Mesh(new BoxGeometry(1.02, 0.03, 0.09), creaseMaterial);
    topCrease.position.set(0, 0.4, -0.035);
    const bottomCrease = topCrease.clone();
    bottomCrease.position.y = -0.44;

    this.chapterSevenBoxHideAnchor.add(
      leftWall,
      rightWall,
      topWall,
      bottomWall,
      frontPanel,
      centerCrease,
      topCrease,
      bottomCrease,
    );
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

  private createMicrophoneSoundToolModel(): void {
    const handleMaterial = new MeshStandardMaterial({
      color: 0x24202a,
      roughness: 0.7,
      metalness: 0.2,
    });
    const grilleMaterial = new MeshStandardMaterial({
      color: 0x343b48,
      emissive: 0x080a10,
      emissiveIntensity: 0.15,
      roughness: 0.38,
      metalness: 0.55,
    });
    const lightMaterial = new MeshStandardMaterial({
      color: 0xff3f98,
      emissive: 0xff2b8e,
      emissiveIntensity: 0.75,
      roughness: 0.26,
      metalness: 0.04,
    });
    const handMaterial = new MeshStandardMaterial({
      color: 0xf0b88b,
      roughness: 0.62,
      metalness: 0.02,
    });

    const handPalm = new Mesh(new BoxGeometry(0.24, 0.16, 0.18), handMaterial);
    handPalm.position.set(0.01, -0.08, 0.02);
    handPalm.rotation.set(0.12, -0.18, 0.1);

    const micHandle = new Mesh(new CylinderGeometry(0.055, 0.07, 0.62, 16), handleMaterial);
    micHandle.position.set(0.05, 0.03, -0.22);
    micHandle.rotation.set(0.85, -0.08, -0.08);

    const micHead = new Mesh(new SphereGeometry(0.14, 18, 12), grilleMaterial);
    micHead.position.set(0.09, 0.3, -0.48);
    micHead.scale.set(1, 0.82, 1);

    const grilleBand = new Mesh(new CylinderGeometry(0.145, 0.145, 0.06, 18), handleMaterial);
    grilleBand.position.copy(micHead.position);
    grilleBand.rotation.x = Math.PI / 2;

    const recordLight = new Mesh(new SphereGeometry(0.032, 10, 8), lightMaterial);
    recordLight.position.set(0.14, 0.17, -0.36);

    this.microphoneSoundToolAnchor.add(handPalm, micHandle, micHead, grilleBand, recordLight);
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
      this.microphoneSoundToolActive = false;
      this.microphoneSoundToolAnchor.visible = false;
      if (this.microphoneSoundRecording) {
        this.stopMicrophoneSoundRecording();
      }
      this.clearCameraToolState();
      this.officeTabletHeld = false;
      this.officeTabletCameraFeedActive = false;
      this.officeTabletAnchor.visible = false;
      this.officeGlassHeld = false;
      this.officeGlassAnchor.visible = false;
      this.clearOfficeHeldPrizeItem();
      this.chapterFourBoxHeld = false;
      this.chapterFourBoxActive = false;
      this.chapterFourBoxViewMode = 'normal';
      this.chapterFourBoxWideCameraReady = false;
      this.chapterFourBoxHeldAnchor.visible = false;
      this.chapterFourBoxHideAnchor.visible = false;
      this.chapterFourBoxWideAnchor.visible = false;
      this.chapterFourBoxWorldAnchor.visible = false;
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

  private setMicrophoneSoundToolActive(active: boolean): void {
    if (this.microphoneSoundToolActive === active) {
      return;
    }

    this.microphoneSoundToolActive = active;
    if (active) {
      this.setPlacementToolActive(false);
      this.clearCameraToolState();
      this.officeTabletHeld = false;
      this.officeTabletCameraFeedActive = false;
      this.officeTabletAnchor.visible = false;
      this.officeGlassHeld = false;
      this.officeGlassAnchor.visible = false;
      this.clearOfficeHeldPrizeItem();
      this.chapterFourBoxHeld = false;
      this.chapterFourBoxActive = false;
      this.chapterFourBoxViewMode = 'normal';
      this.chapterFourBoxWideCameraReady = false;
      this.chapterFourBoxHeldAnchor.visible = false;
      this.chapterFourBoxHideAnchor.visible = false;
      this.chapterFourBoxWideAnchor.visible = false;
      this.chapterFourBoxWorldAnchor.visible = false;
    } else {
      this.microphoneSoundToolAnchor.visible = false;
      if (this.microphoneSoundRecording) {
        this.stopMicrophoneSoundRecording();
      }
    }

    this.pushStatus(
      active
        ? 'Microphone Sound Tool equipped. Press E to record, left click to preview, D saves the next sound number: sound 009, sound 010, sound 011, then sound 100 and beyond.'
        : 'Microphone Sound Tool put away.',
      active ? 3.8 : 1.6,
    );
  }

  private clearMicrophoneSoundToolState(): void {
    this.microphoneSoundToolActive = false;
    this.microphoneSoundToolAnchor.visible = false;
    if (this.microphoneSoundRecording) {
      this.stopMicrophoneSoundRecording(true);
    }
  }

  private setCameraToolActive(active: boolean): void {
    if (this.cameraToolActive === active) {
      return;
    }

    this.cameraToolActive = active;
    if (active) {
      this.setPlacementToolActive(false);
      this.setMicrophoneSoundToolActive(false);
      this.officeTabletHeld = false;
      this.officeTabletCameraFeedActive = false;
      this.officeTabletAnchor.visible = false;
      this.officeGlassHeld = false;
      this.officeGlassAnchor.visible = false;
      this.clearOfficeHeldPrizeItem();
      this.chapterFourBoxHeld = false;
      this.chapterFourBoxActive = false;
      this.chapterFourBoxViewMode = 'normal';
      this.chapterFourBoxWideCameraReady = false;
      this.chapterFourBoxHeldAnchor.visible = false;
      this.chapterFourBoxHideAnchor.visible = false;
      this.chapterFourBoxWideAnchor.visible = false;
      this.chapterFourBoxWorldAnchor.visible = false;
      this.loadCameraToolCaptures();
    } else if (this.cameraToolRecording) {
      this.stopCameraToolVideoRecording(true);
    }
    if (!active) {
      this.releaseCameraToolStream();
    }

    this.pushStatus(
      active
        ? 'Camera Tool equipped. Allow camera and microphone permission, then left click takes a picture and E records video with audio.'
        : 'Camera Tool put away.',
      active ? 4.2 : 1.6,
    );
    if (active) {
      void this.ensureCameraToolStream();
    }
  }

  private clearCameraToolState(): void {
    this.cameraToolActive = false;
    if (this.cameraToolRecording) {
      this.stopCameraToolVideoRecording(true);
    }
    this.releaseCameraToolStream();
  }

  private async startMicrophoneSoundRecording(): Promise<void> {
    if (this.microphoneSoundRecording) {
      return;
    }

    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.microphoneSoundMessage = 'This browser cannot record microphone audio.';
      this.pushStatus(this.microphoneSoundMessage, 3);
      this.syncHud();
      return;
    }

    try {
      this.releaseMicrophoneSoundStream();
      this.microphoneSoundStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.microphoneSoundChunks = [];
      this.microphoneSoundDiscardStop = false;
      this.microphoneSoundRecorder = new MediaRecorder(this.microphoneSoundStream);
      this.microphoneSoundRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.microphoneSoundChunks.push(event.data);
        }
      });
      this.microphoneSoundRecorder.addEventListener('stop', () => {
        this.handleMicrophoneSoundRecordingStopped();
      });
      this.microphoneSoundRecorder.start();
      this.microphoneSoundRecording = true;
      this.microphoneSoundSaved = false;
      this.microphoneSoundMessage = 'Recording now. Make the sound effect, then press E again to stop.';
      this.pushStatus('Recording custom sound effect. Press E again to stop.', 3);
      this.syncHud();
    } catch {
      this.releaseMicrophoneSoundStream();
      this.microphoneSoundRecording = false;
      this.microphoneSoundMessage = 'Microphone permission was blocked. Allow microphone access and try again.';
      this.pushStatus(this.microphoneSoundMessage, 3.4);
      this.syncHud();
    }
  }

  private stopMicrophoneSoundRecording(discard = false): void {
    this.microphoneSoundDiscardStop = discard;
    if (this.microphoneSoundRecorder && this.microphoneSoundRecorder.state !== 'inactive') {
      this.microphoneSoundRecorder.stop();
      return;
    }

    this.microphoneSoundRecording = false;
    this.microphoneSoundRecorder = null;
    this.releaseMicrophoneSoundStream();
  }

  private handleMicrophoneSoundRecordingStopped(): void {
    const discard = this.microphoneSoundDiscardStop;
    this.microphoneSoundDiscardStop = false;
    this.microphoneSoundRecording = false;
    this.microphoneSoundRecorder = null;
    this.releaseMicrophoneSoundStream();

    if (discard) {
      this.microphoneSoundChunks = [];
      return;
    }

    if (this.microphoneSoundChunks.length === 0) {
      this.microphoneSoundMessage = 'No sound was captured. Press E and try recording again.';
      this.pushStatus(this.microphoneSoundMessage, 2.8);
      this.syncHud();
      return;
    }

    const blob = new Blob(this.microphoneSoundChunks, {
      type: this.microphoneSoundChunks[0]?.type || 'audio/webm',
    });
    this.microphoneSoundChunks = [];
    this.revokeMicrophoneSoundPreviewUrl();
    this.microphoneSoundPreviewUrl = URL.createObjectURL(blob);
    this.microphoneSoundPreviewRecordingId = null;
    this.microphoneSoundSaved = false;
    this.microphoneSoundMessage = 'Recording ready. Left click previews it. Press D to save it as the next sound number.';
    this.pushStatus('Recording ready. Left click previews it, D saves it as the next sound number.', 3.2);
    this.syncHud();
  }

  private previewMicrophoneSound(): void {
    if (!this.microphoneSoundPreviewUrl) {
      this.loadSavedMicrophoneSounds();
      const latestRecording = this.getLatestMicrophoneSoundRecording();
      if (latestRecording) {
        this.setMicrophoneSoundPreviewFromRecording(latestRecording);
      }
    }

    if (!this.microphoneSoundPreviewUrl) {
      this.microphoneSoundMessage = 'No custom sound recorded yet. Press E to record one.';
      this.pushStatus(this.microphoneSoundMessage, 2.4);
      return;
    }

    this.microphoneSoundPlayback?.pause();
    this.microphoneSoundPlayback = new Audio(this.microphoneSoundPreviewUrl);
    this.microphoneSoundPlayback.volume = 0.9;
    void this.microphoneSoundPlayback.play().catch(() => {
      this.pushStatus('Click the play space once, then preview the sound again.', 2.6);
    });
  }

  private previewMicrophoneSoundBySlot(slot: number): void {
    this.loadSavedMicrophoneSounds();
    const recording = this.microphoneSoundRecordings[slot - 1] ?? null;
    if (!recording) {
      this.microphoneSoundMessage = `No saved sound effect in slot ${slot}.`;
      this.pushStatus(this.microphoneSoundMessage, 2.2);
      this.syncHud();
      return;
    }

    this.setMicrophoneSoundPreviewFromRecording(recording);
    this.microphoneSoundMessage = `${this.formatMicrophoneSoundLabel(recording.id)} selected from Sound effects.`;
    this.previewMicrophoneSound();
    this.pushStatus(`Playing ${this.formatMicrophoneSoundLabel(recording.id)}.`, 2.1);
    this.syncHud();
  }


  private async saveMicrophoneSound(): Promise<void> {
    if (!this.microphoneSoundPreviewUrl) {
      this.microphoneSoundMessage = 'Record a sound before saving.';
      this.pushStatus(this.microphoneSoundMessage, 2.4);
      this.syncHud();
      return;
    }

    if (this.microphoneSoundSaved && this.microphoneSoundPreviewRecordingId) {
      this.microphoneSoundMessage = `${this.formatMicrophoneSoundLabel(this.microphoneSoundPreviewRecordingId)} is already saved.`;
      this.pushStatus(this.microphoneSoundMessage, 2.4);
      this.syncHud();
      return;
    }

    try {
      this.loadSavedMicrophoneSounds();
      const response = await fetch(this.microphoneSoundPreviewUrl);
      const blob = await response.blob();
      const dataUrl = await this.blobToDataUrl(blob);
      const id = this.getNextMicrophoneSoundRecordingId();
      const recording: MicrophoneSoundRecording = {
        id,
        dataUrl,
        createdAt: Date.now(),
      };
      this.microphoneSoundRecordings.push(recording);
      while (this.microphoneSoundRecordings.length > MICROPHONE_SOUND_MAX_RECORDINGS) {
        const removed = this.microphoneSoundRecordings.shift();
        if (removed && this.microphoneSoundJumpscareRecordingId === removed.id) {
          this.microphoneSoundJumpscareRecordingId = null;
        }
      }
      this.saveMicrophoneSoundLibrary();
      this.revokeMicrophoneSoundPreviewUrl();
      this.microphoneSoundPreviewUrl = dataUrl;
      this.microphoneSoundPreviewRecordingId = id;
      this.microphoneSoundSaved = true;
      this.microphoneSoundMessage = `Saved as ${this.formatMicrophoneSoundLabel(id)}. Tell Codex: I want ${this.formatMicrophoneSoundLabel(id)} only.`;
      this.pushStatus(`Saved as ${this.formatMicrophoneSoundLabel(id)}.`, 2.8);
      this.syncHud();
    } catch {
      this.microphoneSoundMessage = 'Could not save this sound effect. Try recording a shorter sound.';
      this.pushStatus(this.microphoneSoundMessage, 3);
      this.syncHud();
    }
  }

  private deleteMicrophoneSound(): void {
    this.stopMicrophoneSoundRecording(true);
    this.microphoneSoundPlayback?.pause();
    this.microphoneSoundPlayback = null;
    this.loadSavedMicrophoneSounds();
    if (!this.microphoneSoundPreviewRecordingId && !this.microphoneSoundPreviewUrl) {
      const latestRecording = this.getLatestMicrophoneSoundRecording();
      if (latestRecording) {
        this.setMicrophoneSoundPreviewFromRecording(latestRecording);
      }
    }

    const recordingId = this.microphoneSoundPreviewRecordingId;
    if (recordingId) {
      const recordingIndex = this.microphoneSoundRecordings.findIndex((recording) => recording.id === recordingId);
      if (recordingIndex >= 0) {
        this.microphoneSoundRecordings.splice(recordingIndex, 1);
        if (this.microphoneSoundJumpscareRecordingId === recordingId) {
          this.microphoneSoundJumpscareRecordingId = null;
        }
        this.saveMicrophoneSoundLibrary();
      }
    }

    this.revokeMicrophoneSoundPreviewUrl();
    this.microphoneSoundPreviewRecordingId = null;
    this.microphoneSoundSaved = false;
    this.microphoneSoundMessage = recordingId
      ? `Deleted ${this.formatMicrophoneSoundLabel(recordingId)}.`
      : 'Deleted the unsaved preview sound. Press E to record a new one.';
    this.pushStatus(this.microphoneSoundMessage, 2.2);
    this.syncHud();
  }

  private loadSavedMicrophoneSounds(): void {
    if (this.microphoneSoundLibraryLoaded) {
      return;
    }

    this.microphoneSoundLibraryLoaded = true;
    try {
      const rawRecordings = window.localStorage.getItem(MICROPHONE_SOUND_RECORDINGS_STORAGE_KEY);
      if (rawRecordings) {
        const parsedRecordings = JSON.parse(rawRecordings) as MicrophoneSoundRecording[];
        let migratedIds = false;
        const usedIds = new Set<string>();
        parsedRecordings.forEach((recording, index) => {
          if (
            recording
            && typeof recording.id === 'string'
            && typeof recording.dataUrl === 'string'
            && typeof recording.createdAt === 'number'
          ) {
            let id = this.normalizeMicrophoneSoundRecordingId(recording.id);
            while (usedIds.has(id)) {
              id = String(Number.parseInt(id, 10) + 1).padStart(3, '0');
            }
            usedIds.add(id);
            migratedIds = migratedIds || id !== recording.id;
            this.microphoneSoundRecordings.push({
              ...recording,
              id,
              createdAt: recording.createdAt + index * 0.001,
            });
          }
        });
        if (migratedIds) {
          this.saveMicrophoneSoundLibrary();
        }
      }

      const legacyDataUrl = window.localStorage.getItem(MICROPHONE_SOUND_LEGACY_STORAGE_KEY);
      if (legacyDataUrl && this.microphoneSoundRecordings.length === 0) {
        this.microphoneSoundRecordings.push({
          id: '001',
          dataUrl: legacyDataUrl,
          createdAt: Date.now(),
        });
        window.localStorage.setItem(MICROPHONE_SOUND_NEXT_INDEX_STORAGE_KEY, '2');
        this.saveMicrophoneSoundLibrary();
      }

      if (this.microphoneSoundRecordings.length > 0 && !this.microphoneSoundPreviewUrl) {
        const latestRecording = this.getLatestMicrophoneSoundRecording();
        if (latestRecording) {
          this.setMicrophoneSoundPreviewFromRecording(latestRecording);
          this.microphoneSoundMessage = `${this.formatMicrophoneSoundLabel(latestRecording.id)} loaded. Left click previews it.`;
        }
      }
    } catch {
      // Local storage is optional for this tool.
    }
  }

  private saveMicrophoneSoundLibrary(): void {
    try {
      window.localStorage.setItem(MICROPHONE_SOUND_RECORDINGS_STORAGE_KEY, JSON.stringify(this.microphoneSoundRecordings));
      if (this.microphoneSoundJumpscareRecordingId) {
        window.localStorage.setItem(`${MICROPHONE_SOUND_RECORDINGS_STORAGE_KEY}:jumpscare`, this.microphoneSoundJumpscareRecordingId);
      } else {
        window.localStorage.removeItem(`${MICROPHONE_SOUND_RECORDINGS_STORAGE_KEY}:jumpscare`);
      }
    } catch {
      // Local storage may be unavailable or full.
    }
  }

  private getNextMicrophoneSoundRecordingId(): string {
    let nextIndex = this.microphoneSoundRecordings.length + 1;
    try {
      const savedNextIndex = Number.parseInt(window.localStorage.getItem(MICROPHONE_SOUND_NEXT_INDEX_STORAGE_KEY) ?? '', 10);
      if (Number.isFinite(savedNextIndex) && savedNextIndex > 0) {
        nextIndex = Math.max(nextIndex, savedNextIndex);
      }
    } catch {
      // Use the in-memory fallback.
    }

    const maxExistingIndex = this.microphoneSoundRecordings.reduce((maxIndex, recording) => {
      const numericId = Number.parseInt(recording.id, 10);
      return Number.isFinite(numericId) ? Math.max(maxIndex, numericId) : maxIndex;
    }, 0);
    nextIndex = Math.max(nextIndex, maxExistingIndex + 1);
    try {
      window.localStorage.setItem(MICROPHONE_SOUND_NEXT_INDEX_STORAGE_KEY, String(nextIndex + 1));
    } catch {
      // Local storage is optional.
    }

    return String(nextIndex).padStart(3, '0');
  }

  private normalizeMicrophoneSoundRecordingId(recordingId: string): string {
    const trimmed = recordingId.trim();
    const numericId = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return trimmed || '001';
    }

    return String(numericId).padStart(3, '0');
  }

  private formatMicrophoneSoundLabel(recordingId: string): string {
    return `sound ${this.normalizeMicrophoneSoundRecordingId(recordingId)}`;
  }

  private getLatestMicrophoneSoundRecording(): MicrophoneSoundRecording | null {
    this.loadSavedMicrophoneSounds();
    return this.microphoneSoundRecordings[this.microphoneSoundRecordings.length - 1] ?? null;
  }

  private setMicrophoneSoundPreviewFromRecording(recording: MicrophoneSoundRecording): void {
    this.revokeMicrophoneSoundPreviewUrl();
    this.microphoneSoundPreviewUrl = recording.dataUrl;
    this.microphoneSoundPreviewRecordingId = recording.id;
    this.microphoneSoundSaved = true;
  }

  private getMicrophoneSoundRecordingById(recordingId: string): MicrophoneSoundRecording | null {
    this.loadSavedMicrophoneSounds();
    const normalizedId = this.normalizeMicrophoneSoundRecordingId(recordingId);
    return this.microphoneSoundRecordings.find((recording) => recording.id === normalizedId) ?? null;
  }

  private getMicrophoneJumpscareRecordingId(): string | null {
    if (MICROPHONE_JUMPSCARE_RECORDING_ID) {
      return MICROPHONE_JUMPSCARE_RECORDING_ID;
    }

    this.loadSavedMicrophoneSounds();
    if (this.microphoneSoundJumpscareRecordingId) {
      return this.microphoneSoundJumpscareRecordingId;
    }

    try {
      const savedId = window.localStorage.getItem(`${MICROPHONE_SOUND_RECORDINGS_STORAGE_KEY}:jumpscare`);
      this.microphoneSoundJumpscareRecordingId = savedId ? this.normalizeMicrophoneSoundRecordingId(savedId) : null;
      return this.microphoneSoundJumpscareRecordingId;
    } catch {
      return null;
    }
  }

  private playMicrophoneSoundEffect(fallback?: () => void, recordingId?: string): boolean {
    const recording = recordingId ? this.getMicrophoneSoundRecordingById(recordingId) : null;
    if (recording) {
      this.microphoneSoundPlayback?.pause();
      this.microphoneSoundPlayback = new Audio(recording.dataUrl);
      this.microphoneSoundPlayback.volume = 1;
      void this.microphoneSoundPlayback.play().catch(() => {
        fallback?.();
      });
      return true;
    }

    if (!this.microphoneSoundPreviewUrl) {
      this.loadSavedMicrophoneSounds();
    }

    if (!this.microphoneSoundPreviewUrl) {
      return false;
    }

    this.microphoneSoundPlayback?.pause();
    this.microphoneSoundPlayback = new Audio(this.microphoneSoundPreviewUrl);
    this.microphoneSoundPlayback.volume = 1;
    void this.microphoneSoundPlayback.play().catch(() => {
      fallback?.();
    });
    return true;
  }

  private playOfficeJumpscareSound(cue: OfficeJumpscareCue = 'stomp-roar'): void {
    this.gameplaySfxAudio.playOfficeJumpscareCue(cue);
  }

  private playCustomJumpscareSound(fallbackCue: OfficeJumpscareCue): void {
    const recordingId = this.getMicrophoneJumpscareRecordingId();
    if (recordingId && this.playMicrophoneSoundEffect(() => this.gameplaySfxAudio.playOfficeJumpscareCue(fallbackCue), recordingId)) {
      return;
    }

    this.gameplaySfxAudio.playOfficeJumpscareCue(fallbackCue);
  }

  private playPurpleJumpscareSound(): void {
    this.playCustomJumpscareSound('bear-grab');
  }

  private playOfficeDoorToggleSound(doorId: 'left' | 'right', open: boolean): void {
    const recordingId = open ? OFFICE_DOOR_OPEN_SOUND_RECORDING_ID : OFFICE_DOOR_CLOSE_SOUND_RECORDING_ID;
    const recording = this.getMicrophoneSoundRecordingById(recordingId);
    this.stopOfficeDoorSound();

    if (!recording) {
      this.gameplaySfxAudio.playSecurityDoor(open);
      return;
    }

    const audio = new Audio(recording.dataUrl);
    audio.volume = 1;
    audio.loop = true;
    this.officeDoorSoundPlayback = audio;
    this.officeDoorSoundTarget = { doorId, open };
    void audio.play().catch(() => {
      if (this.officeDoorSoundPlayback === audio) {
        this.stopOfficeDoorSound();
      }
      this.gameplaySfxAudio.playSecurityDoor(open);
    });
  }

  private updateOfficeDoorSoundPlayback(): void {
    if (!this.officeDoorSoundPlayback || !this.officeDoorSoundTarget) {
      return;
    }

    const door = this.getOfficeDoorById(this.officeDoorSoundTarget.doorId);
    if (!door) {
      this.stopOfficeDoorSound();
      return;
    }

    const fullyOpen = this.officeDoorSoundTarget.open
      && door.targetOpenAmount >= 0.999
      && door.openAmount >= 0.999;
    const fullyClosed = !this.officeDoorSoundTarget.open
      && door.targetOpenAmount <= 0.001
      && door.openAmount <= 0.001;
    if (fullyOpen || fullyClosed) {
      this.stopOfficeDoorSound();
    }
  }

  private stopOfficeDoorSound(): void {
    this.officeDoorSoundPlayback?.pause();
    this.officeDoorSoundPlayback = null;
    this.officeDoorSoundTarget = null;
  }

  private playOfficeAnimatronicDoorLaugh(): void {
    const recording = this.getMicrophoneSoundRecordingById(OFFICE_ANIMATRONIC_DOOR_LAUGH_RECORDING_ID);
    if (!recording) {
      this.gameplaySfxAudio.playAnimatronicDoorLaugh();
      return;
    }

    this.microphoneSoundPlayback?.pause();
    this.microphoneSoundPlayback = new Audio(recording.dataUrl);
    this.microphoneSoundPlayback.volume = 1;
    void this.microphoneSoundPlayback.play().catch(() => {
      this.gameplaySfxAudio.playAnimatronicDoorLaugh();
    });
  }

  private spawnOfficeDoorSparks(doorId: 'left' | 'right', liftAmount: number): void {
    const door = this.getOfficeDoorById(doorId);
    if (!door) {
      return;
    }

    const sparkCount = 3 + Math.floor(Math.random() * 3);
    for (let index = 0; index < sparkCount; index += 1) {
      const material = new MeshBasicMaterial({
        color: Math.random() > 0.36 ? 0xffd86b : 0xff7a2d,
        transparent: true,
        opacity: 0.95,
      });
      const spark = new Mesh(new BoxGeometry(0.035, 0.018, 0.018), material);
      const railSide = Math.random() > 0.5 ? 1 : -1;
      const sparkHeight = Math.random() > 0.28
        ? MathUtils.lerp(0.64, 3.08, liftAmount) + (Math.random() - 0.5) * 0.34
        : 3.48 + Math.random() * 0.26;
      const localPosition = new Vector3(
        railSide * (1.92 + Math.random() * 0.26),
        sparkHeight,
        0.28 + Math.random() * 0.08,
      );
      spark.position.copy(door.root.localToWorld(localPosition));
      spark.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.officeChapter.root.add(spark);

      const outwardVelocity = new Vector3(0, 0, 0.6 + Math.random() * 0.6).applyQuaternion(door.root.quaternion);
      const railVelocity = new Vector3(railSide * (0.16 + Math.random() * 0.42), 0, 0).applyQuaternion(door.root.quaternion);
      const velocity = outwardVelocity.add(railVelocity);
      velocity.y = 0.58 + Math.random() * 0.8;
      this.activeOfficeDoorSparks.push({
        mesh: spark,
        velocity,
        elapsed: 0,
        duration: 0.22 + Math.random() * 0.22,
      });
    }
  }

  private updateOfficeDoorSparks(deltaSeconds: number): void {
    for (let index = this.activeOfficeDoorSparks.length - 1; index >= 0; index -= 1) {
      const spark = this.activeOfficeDoorSparks[index];
      spark.elapsed += deltaSeconds;
      spark.velocity.y -= deltaSeconds * 2.3;
      spark.mesh.position.x += spark.velocity.x * deltaSeconds;
      spark.mesh.position.y += spark.velocity.y * deltaSeconds;
      spark.mesh.position.z += spark.velocity.z * deltaSeconds;
      spark.mesh.rotation.x += deltaSeconds * 18;
      spark.mesh.rotation.z += deltaSeconds * 24;
      const material = spark.mesh.material;
      if (material instanceof MeshBasicMaterial) {
        material.opacity = Math.max(0, 1 - spark.elapsed / spark.duration);
      }
      if (spark.elapsed < spark.duration) {
        continue;
      }

      spark.mesh.parent?.remove(spark.mesh);
      spark.mesh.geometry.dispose();
      if (spark.mesh.material instanceof MeshBasicMaterial) {
        spark.mesh.material.dispose();
      }
      this.activeOfficeDoorSparks.splice(index, 1);
    }
  }

  private clearOfficeDoorSparks(): void {
    while (this.activeOfficeDoorSparks.length > 0) {
      const spark = this.activeOfficeDoorSparks.pop()!;
      spark.mesh.parent?.remove(spark.mesh);
      spark.mesh.geometry.dispose();
      if (spark.mesh.material instanceof MeshBasicMaterial) {
        spark.mesh.material.dispose();
      }
    }
  }

  private releaseMicrophoneSoundStream(): void {
    this.microphoneSoundStream?.getTracks().forEach((track) => track.stop());
    this.microphoneSoundStream = null;
  }

  private revokeMicrophoneSoundPreviewUrl(): void {
    if (this.microphoneSoundPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.microphoneSoundPreviewUrl);
    }
    this.microphoneSoundPreviewUrl = null;
    this.microphoneSoundPreviewRecordingId = null;
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Could not read microphone recording.'));
        }
      });
      reader.addEventListener('error', () => reject(reader.error ?? new Error('Could not read microphone recording.')));
      reader.readAsDataURL(blob);
    });
  }

  private async ensureCameraToolStream(): Promise<MediaStream | null> {
    if (this.cameraToolStream) {
      return this.cameraToolStream;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      this.cameraToolMessage = 'This browser cannot use the camera or microphone.';
      this.pushStatus(this.cameraToolMessage, 3);
      this.syncHud();
      return null;
    }

    try {
      this.cameraToolStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 960 },
          height: { ideal: 540 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.cameraToolVideo = document.createElement('video');
      this.cameraToolVideo.muted = true;
      this.cameraToolVideo.playsInline = true;
      this.cameraToolVideo.srcObject = this.cameraToolStream;
      await this.cameraToolVideo.play();
      this.cameraToolMessage = 'Camera and microphone ready. Left click takes a picture; E records video with your voice.';
      this.syncHud();
      return this.cameraToolStream;
    } catch {
      this.releaseCameraToolStream();
      this.cameraToolMessage = 'Camera or microphone permission was blocked. Allow both permissions and try again.';
      this.pushStatus(this.cameraToolMessage, 3.4);
      this.syncHud();
      return null;
    }
  }

  private async captureCameraToolPicture(): Promise<void> {
    const stream = await this.ensureCameraToolStream();
    if (!stream || !this.cameraToolVideo) {
      return;
    }

    await this.waitForCameraToolVideoReady();
    const width = this.cameraToolVideo.videoWidth || 960;
    const height = this.cameraToolVideo.videoHeight || 540;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      this.cameraToolMessage = 'Could not capture a picture from the camera.';
      this.pushStatus(this.cameraToolMessage, 2.8);
      this.syncHud();
      return;
    }

    context.drawImage(this.cameraToolVideo, 0, 0, width, height);
    this.revokeCameraToolPreviewUrl();
    this.cameraToolPreviewUrl = canvas.toDataURL('image/png');
    this.cameraToolPreviewKind = 'picture';
    this.cameraToolPreviewCaptureId = null;
    this.cameraToolSaved = false;
    this.cameraToolMessage = 'Picture captured. Press D to save it as the next picture number.';
    this.pushStatus('Picture captured. Press D to save it.', 2.6);
    this.syncHud();
  }

  private async toggleCameraToolVideoRecording(): Promise<void> {
    if (this.cameraToolRecording) {
      this.stopCameraToolVideoRecording();
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      this.cameraToolMessage = 'This browser cannot record camera video.';
      this.pushStatus(this.cameraToolMessage, 3);
      this.syncHud();
      return;
    }

    const stream = await this.ensureCameraToolStream();
    if (!stream) {
      return;
    }

    this.cameraToolChunks = [];
    this.cameraToolDiscardStop = false;
    this.cameraToolRecorder = new MediaRecorder(stream);
    this.cameraToolRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        this.cameraToolChunks.push(event.data);
      }
    });
    this.cameraToolRecorder.addEventListener('stop', () => {
      this.handleCameraToolVideoRecordingStopped();
    });
    this.cameraToolRecorder.start();
    this.cameraToolRecording = true;
    this.cameraToolSaved = false;
    this.cameraToolMessage = 'Recording video and microphone audio. Press E again to stop, then D to save.';
    this.pushStatus('Camera video and microphone audio recording. Press E again to stop.', 3);
    this.syncHud();
  }

  private stopCameraToolVideoRecording(discard = false): void {
    this.cameraToolDiscardStop = discard;
    if (this.cameraToolRecorder && this.cameraToolRecorder.state !== 'inactive') {
      this.cameraToolRecorder.stop();
      return;
    }

    this.cameraToolRecording = false;
    this.cameraToolRecorder = null;
  }

  private handleCameraToolVideoRecordingStopped(): void {
    const discard = this.cameraToolDiscardStop;
    this.cameraToolDiscardStop = false;
    this.cameraToolRecording = false;
    this.cameraToolRecorder = null;
    if (discard) {
      this.cameraToolChunks = [];
      return;
    }

    if (this.cameraToolChunks.length === 0) {
      this.cameraToolMessage = 'No video was captured. Press E and try recording again.';
      this.pushStatus(this.cameraToolMessage, 2.8);
      this.syncHud();
      return;
    }

    const blob = new Blob(this.cameraToolChunks, {
      type: this.cameraToolChunks[0]?.type || 'video/webm',
    });
    this.cameraToolChunks = [];
    this.revokeCameraToolPreviewUrl();
    this.cameraToolPreviewUrl = URL.createObjectURL(blob);
    this.cameraToolPreviewKind = 'video';
    this.cameraToolPreviewCaptureId = null;
    this.cameraToolSaved = false;
    this.cameraToolMessage = 'Video captured. Press D to save it as the next video number.';
    this.pushStatus('Video captured. Press D to save it.', 2.8);
    this.syncHud();
  }

  private async saveCameraToolCapture(): Promise<void> {
    if (!this.cameraToolPreviewUrl || !this.cameraToolPreviewKind) {
      this.cameraToolMessage = 'Take a picture or record a video before saving.';
      this.pushStatus(this.cameraToolMessage, 2.6);
      this.syncHud();
      return;
    }

    if (this.cameraToolSaved && this.cameraToolPreviewCaptureId) {
      this.cameraToolMessage = `${this.formatCameraToolCaptureLabel(this.cameraToolPreviewKind, this.cameraToolPreviewCaptureId)} is already saved.`;
      this.pushStatus(this.cameraToolMessage, 2.4);
      this.syncHud();
      return;
    }

    try {
      this.loadCameraToolCaptures();
      const response = await fetch(this.cameraToolPreviewUrl);
      const blob = await response.blob();
      const dataUrl = await this.blobToDataUrl(blob);
      const kind = this.cameraToolPreviewKind;
      const id = this.getNextCameraToolCaptureId(kind);
      const capture: CameraToolCapture = {
        id,
        kind,
        dataUrl,
        createdAt: Date.now(),
      };
      this.cameraToolCaptures.push(capture);
      while (this.cameraToolCaptures.length > CAMERA_TOOL_MAX_CAPTURES) {
        this.cameraToolCaptures.shift();
      }
      this.saveCameraToolCaptureLibrary();
      this.revokeCameraToolPreviewUrl();
      this.cameraToolPreviewUrl = dataUrl;
      this.cameraToolPreviewKind = kind;
      this.cameraToolPreviewCaptureId = id;
      this.cameraToolSaved = true;
      this.cameraToolMessage = `Saved as ${this.formatCameraToolCaptureLabel(kind, id)}.`;
      this.pushStatus(this.cameraToolMessage, 2.8);
      this.syncHud();
    } catch {
      this.cameraToolMessage = 'Could not save this camera capture. Try a shorter video.';
      this.pushStatus(this.cameraToolMessage, 3);
      this.syncHud();
    }
  }

  private deleteCameraToolCapture(): void {
    if (this.cameraToolRecording) {
      this.stopCameraToolVideoRecording(true);
    }

    this.loadCameraToolCaptures();
    const captureId = this.cameraToolPreviewCaptureId;
    if (captureId && this.cameraToolPreviewKind) {
      const captureIndex = this.cameraToolCaptures.findIndex((capture) => (
        capture.id === captureId && capture.kind === this.cameraToolPreviewKind
      ));
      if (captureIndex >= 0) {
        this.cameraToolCaptures.splice(captureIndex, 1);
        this.saveCameraToolCaptureLibrary();
      }
    }

    this.revokeCameraToolPreviewUrl();
    this.cameraToolPreviewKind = null;
    this.cameraToolPreviewCaptureId = null;
    this.cameraToolSaved = false;
    this.cameraToolMessage = captureId
      ? `Deleted camera capture ${captureId}.`
      : 'Deleted the unsaved camera preview.';
    this.pushStatus(this.cameraToolMessage, 2.2);
    this.syncHud();
  }

  private loadCameraToolCaptures(): void {
    if (this.cameraToolLibraryLoaded) {
      return;
    }

    this.cameraToolLibraryLoaded = true;
    try {
      const rawCaptures = window.localStorage.getItem(CAMERA_TOOL_CAPTURES_STORAGE_KEY);
      if (!rawCaptures) {
        return;
      }

      const parsedCaptures = JSON.parse(rawCaptures) as CameraToolCapture[];
      parsedCaptures.forEach((capture) => {
        if (
          capture
          && (capture.kind === 'picture' || capture.kind === 'video')
          && typeof capture.id === 'string'
          && typeof capture.dataUrl === 'string'
          && typeof capture.createdAt === 'number'
        ) {
          this.cameraToolCaptures.push(capture);
        }
      });
    } catch {
      // Local storage is optional for this tool.
    }
  }

  private saveCameraToolCaptureLibrary(): void {
    try {
      window.localStorage.setItem(CAMERA_TOOL_CAPTURES_STORAGE_KEY, JSON.stringify(this.cameraToolCaptures));
    } catch {
      // Local storage may be unavailable or full.
    }
  }

  private getNextCameraToolCaptureId(kind: CameraToolCaptureKind): string {
    const storageKey = kind === 'picture'
      ? CAMERA_TOOL_NEXT_PICTURE_INDEX_STORAGE_KEY
      : CAMERA_TOOL_NEXT_VIDEO_INDEX_STORAGE_KEY;
    let nextIndex = this.cameraToolCaptures.filter((capture) => capture.kind === kind).length + 1;
    try {
      const savedNextIndex = Number.parseInt(window.localStorage.getItem(storageKey) ?? '', 10);
      if (Number.isFinite(savedNextIndex) && savedNextIndex > 0) {
        nextIndex = Math.max(nextIndex, savedNextIndex);
      }
    } catch {
      // Use the in-memory fallback.
    }

    const maxExistingIndex = this.cameraToolCaptures.reduce((maxIndex, capture) => {
      if (capture.kind !== kind) {
        return maxIndex;
      }
      const numericId = Number.parseInt(capture.id, 10);
      return Number.isFinite(numericId) ? Math.max(maxIndex, numericId) : maxIndex;
    }, 0);
    nextIndex = Math.max(nextIndex, maxExistingIndex + 1);
    try {
      window.localStorage.setItem(storageKey, String(nextIndex + 1));
    } catch {
      // Local storage is optional.
    }

    return String(nextIndex).padStart(3, '0');
  }

  private formatCameraToolCaptureLabel(kind: CameraToolCaptureKind, id: string): string {
    return `${kind} ${id}`;
  }

  private getCameraToolCaptureById(kind: CameraToolCaptureKind, id: string): CameraToolCapture | null {
    this.loadCameraToolCaptures();
    const normalizedId = id.padStart(3, '0');
    return this.cameraToolCaptures.find((capture) => capture.kind === kind && capture.id === normalizedId) ?? null;
  }

  private getLatestCameraToolCapture(kind: CameraToolCaptureKind): CameraToolCapture | null {
    this.loadCameraToolCaptures();
    return this.cameraToolCaptures
      .filter((capture) => capture.kind === kind)
      .reduce<CameraToolCapture | null>((latestCapture, capture) => {
        if (!latestCapture || capture.createdAt > latestCapture.createdAt) {
          return capture;
        }
        return latestCapture;
      }, null);
  }

  private waitForCameraToolVideoReady(): Promise<void> {
    if (!this.cameraToolVideo || this.cameraToolVideo.videoWidth > 0) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const video = this.cameraToolVideo;
      if (!video) {
        resolve();
        return;
      }
      const timeout = window.setTimeout(resolve, 900);
      video.addEventListener('loadedmetadata', () => {
        window.clearTimeout(timeout);
        resolve();
      }, { once: true });
    });
  }

  private releaseCameraToolStream(): void {
    this.cameraToolStream?.getTracks().forEach((track) => track.stop());
    this.cameraToolStream = null;
    if (this.cameraToolVideo) {
      this.cameraToolVideo.srcObject = null;
    }
    this.cameraToolVideo = null;
  }

  private revokeCameraToolPreviewUrl(): void {
    if (this.cameraToolPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.cameraToolPreviewUrl);
    }
    this.cameraToolPreviewUrl = null;
    this.cameraToolPreviewCaptureId = null;
  }

  private getOfficePrizeItemCount(item: OfficePrizeItemId): number {
    return this.officePrizeInventory.get(item) ?? 0;
  }

  private addOfficePrizeItem(item: OfficePrizeItemId, count: number): void {
    this.officePrizeInventory.set(item, this.getOfficePrizeItemCount(item) + count);
  }

  private consumeOfficePrizeItem(item: OfficePrizeItemId, count = 1): boolean {
    const current = this.getOfficePrizeItemCount(item);
    if (current < count) {
      return false;
    }

    const next = current - count;
    if (next > 0) {
      this.officePrizeInventory.set(item, next);
    } else {
      this.officePrizeInventory.delete(item);
      if (this.officeHeldPrizeItem === item) {
        this.clearOfficeHeldPrizeItem();
      }
    }
    return true;
  }

  private clearOfficeHeldPrizeItem(): void {
    this.officeHeldPrizeItem = null;
    this.officeGlassHeld = false;
    this.officeGlassAnchor.visible = false;
    this.officePrizeItemAnchor.visible = false;
    this.officePrizeItemModels.forEach((model) => {
      model.visible = false;
    });
  }

  private resetOfficePrizeInventory(): void {
    this.officePrizeInventory.clear();
    this.officePrizeBonusMultiplier = 1;
    this.officeLollipopBoostRemaining = 0;
    this.officeLollipopUseTimer = 0;
    this.clearOfficeHeldPrizeItem();
  }

  private setOfficeHeldPrizeItem(item: OfficePrizeItemId, showStatus = true): void {
    if (this.getOfficePrizeItemCount(item) <= 0) {
      this.pushStatus(`${OFFICE_PRIZE_ITEM_LABELS[item]} is not in your hotbar yet.`, 1.8);
      return;
    }

    this.setPlacementToolActive(false);
    this.setMicrophoneSoundToolActive(false);
    this.setCameraToolActive(false);
    this.officeTabletHeld = false;
    this.officeTabletCameraFeedActive = false;
    this.officeTabletAnchor.visible = false;
    this.officeBasketballHeld = false;
    this.officeBasketballAnchor.visible = false;
    this.officeChapter.setBasketballHeld(false);
    this.chapterFourBoxHeld = false;
    this.chapterFourBoxActive = false;
    this.chapterFourBoxViewMode = 'normal';
    this.chapterFourBoxWideCameraReady = false;
    this.chapterFourBoxHeldAnchor.visible = false;
    this.chapterFourBoxHideAnchor.visible = false;
    this.chapterFourBoxWideAnchor.visible = false;
    this.chapterFourBoxWorldAnchor.visible = false;

    this.officeHeldPrizeItem = item;
    this.officeGlassHeld = item === 'glass';
    this.officeGlassAnchor.visible = this.officeGlassHeld;
    if (!this.officeGlassHeld) {
      this.officeGlassAnchor.visible = false;
    }

    if (showStatus) {
      const action = item === 'glass'
        ? 'Left click to throw it and shatter it.'
        : item === 'tiny-bear'
          ? 'Left click to throw it and squeak it as a distraction.'
          : item === 'lollipop'
            ? 'Left click to eat it for a 10 second speed boost.'
            : item === 'stuffie'
              ? 'Left click to play the saved stuffie sound.'
              : 'It looks like a tiny Quacky toy in your hand.';
      this.pushStatus(`${OFFICE_PRIZE_ITEM_LABELS[item]} equipped. ${action}`, 2.6);
    }
  }

  private handleOfficeHotbarSlot(slot: number): void {
    if (slot === 1) {
      this.setPlacementToolActive(true);
      return;
    }

    if (slot === 3) {
      this.setMicrophoneSoundToolActive(true);
      return;
    }

    if (slot === 4) {
      this.setCameraToolActive(true);
      return;
    }

    const prizeSlot = OFFICE_PRIZE_HOTBAR_SLOTS.find((entry) => entry.slot === slot);
    if (prizeSlot) {
      this.setOfficeHeldPrizeItem(prizeSlot.item);
    }
  }

  private getCurrentOfficeHotbarSlot(): number {
    if (this.placementToolActive) {
      return 1;
    }

    if (this.microphoneSoundToolActive) {
      return 3;
    }

    if (this.cameraToolActive) {
      return 4;
    }

    const heldPrizeSlot = OFFICE_PRIZE_HOTBAR_SLOTS.find((entry) => entry.item === this.officeHeldPrizeItem);
    return heldPrizeSlot?.slot ?? 0;
  }

  private clearOfficeCycleHeldItem(): void {
    this.placementToolActive = false;
    this.placementToolAnchor.visible = false;
    this.placementPreview.visible = false;
    this.clearMicrophoneSoundToolState();
    this.clearCameraToolState();
    this.officeTabletHeld = false;
    this.officeTabletCameraFeedActive = false;
    this.officeTabletAnchor.visible = false;
    this.officeBasketballHeld = false;
    this.officeBasketballAnchor.visible = false;
    this.officeChapter.setBasketballHeld(false);
    this.clearOfficeHeldPrizeItem();
    this.pushStatus('Hands empty. Spin the mouse wheel or press a hotbar number to hold an item.', 1.7);
    this.syncHud();
  }

  private cycleOfficeHotbarItem(direction: number): void {
    const prizeSlots = OFFICE_PRIZE_HOTBAR_SLOTS
      .filter((entry) => this.getOfficePrizeItemCount(entry.item) > 0)
      .map((entry) => entry.slot);
    const slots = [0, 1, 3, 4, ...prizeSlots];
    const currentSlot = this.getCurrentOfficeHotbarSlot();
    const currentIndex = Math.max(0, slots.indexOf(currentSlot));
    const nextIndex = (currentIndex + Math.sign(direction) + slots.length) % slots.length;
    const nextSlot = slots[nextIndex] ?? 0;
    if (nextSlot === 0) {
      this.clearOfficeCycleHeldItem();
      return;
    }

    this.handleOfficeHotbarSlot(nextSlot);
  }

  private cycleOfficeTabletCamera(direction: number): void {
    const cameras = this.officeChapter.securityCameras;
    if (cameras.length === 0) {
      return;
    }

    this.officeTabletCameraIndex = (this.officeTabletCameraIndex + Math.sign(direction) + cameras.length) % cameras.length;
    const camera = this.getActiveOfficeTabletCamera();
    this.pushStatus(`${camera?.label ?? 'Camera'} selected.`, 1.2);
  }

  private handleChapterFourHotbarSlot(slot: number): void {
    if (slot === 1) {
      this.setPlacementToolActive(true);
      return;
    }

    if (slot === 2) {
      this.setChapterFourBoxHeld(true);
      return;
    }

    if (slot === 3) {
      this.setMicrophoneSoundToolActive(true);
    }
  }

  private getCurrentChapterFourHotbarSlot(): number {
    if (this.placementToolActive) {
      return 1;
    }

    if (this.chapterFourBoxHeld || this.chapterFourBoxActive) {
      return 2;
    }

    if (this.microphoneSoundToolActive) {
      return 3;
    }

    return 0;
  }

  private clearChapterFourCycleHeldItem(): void {
    this.placementToolActive = false;
    this.placementToolAnchor.visible = false;
    this.placementPreview.visible = false;
    this.clearMicrophoneSoundToolState();
    this.clearCameraToolState();
    this.setChapterFourBoxHeld(false, false);
    this.pushStatus('Hands empty. Spin the mouse wheel or press a hotbar number to hold a Chapter 4 item.', 1.7);
    this.syncHud();
  }

  private cycleChapterFourHotbarItem(direction: number): void {
    const slots = [0, 1, 2, 3];
    const currentIndex = Math.max(0, slots.indexOf(this.getCurrentChapterFourHotbarSlot()));
    const nextIndex = (currentIndex + Math.sign(direction) + slots.length) % slots.length;
    const nextSlot = slots[nextIndex] ?? 0;
    if (nextSlot === 0) {
      this.clearChapterFourCycleHeldItem();
      return;
    }

    this.handleChapterFourHotbarSlot(nextSlot);
  }

  private selectChapterEightHotbarSlot(slot: number): void {
    const item: ChapterEightHeldItem = slot === 1
      ? 'coordinate-tool'
      : slot === 2
        ? 'military-knife'
        : slot === 3
          ? 'torch'
          : 'empty';

    this.selectChapterEightHeldItem(this.chapterEightHeldItem === item ? 'empty' : item);
  }

  private cycleChapterEightHeldItem(direction: number): void {
    const currentIndex = Math.max(0, CHAPTER_EIGHT_HELD_ITEM_ORDER.indexOf(this.chapterEightHeldItem));
    const nextIndex = (currentIndex + Math.sign(direction) + CHAPTER_EIGHT_HELD_ITEM_ORDER.length)
      % CHAPTER_EIGHT_HELD_ITEM_ORDER.length;
    this.selectChapterEightHeldItem(CHAPTER_EIGHT_HELD_ITEM_ORDER[nextIndex]);
  }

  private selectChapterEightHeldItem(item: ChapterEightHeldItem): void {
    if (this.chapterEightHeldItem === item && (item !== 'coordinate-tool' || this.placementToolActive)) {
      return;
    }

    this.chapterEightHeldItem = item;
    if (item === 'torch' && !this.chapterEight.hasTorch()) {
      this.chapterEightHeldItem = 'empty';
      this.chapterEightHeldItemAnchor.visible = false;
      this.pushStatus('Make a torch at the burning fireplace before you can hold one.', 2.3);
      this.syncHud();
      return;
    }

    if (item === 'coordinate-tool') {
      this.chapterEightHeldItemAnchor.visible = false;
      this.setPlacementToolActive(true);
      this.syncHud();
      return;
    }

    if (this.placementToolActive) {
      this.placementToolActive = false;
      this.placementToolAnchor.visible = false;
      this.placementPreview.visible = false;
    }

    if (item === 'empty') {
      this.chapterEightHeldItemAnchor.visible = false;
      this.pushStatus('Hands empty. Spin the mouse wheel or press 1 or 2 to hold gear.', 1.9);
    } else {
      this.pushStatus(`${this.getChapterEightHeldItemLabel(item)} equipped. Spin the mouse wheel to switch items.`, 2.2);
    }
    this.syncHud();
  }

  private getChapterEightHeldItemLabel(item: ChapterEightHeldItem): string {
    switch (item) {
      case 'coordinate-tool':
        return 'Coordinate Tool';
      case 'military-knife':
        return 'Military Knife';
      case 'torch':
        return 'Torch';
      case 'empty':
        return 'Empty hands';
    }
  }

  private setChapterFourBoxHeld(held: boolean, showStatus = true): void {
    if (this.chapterFourBoxHeld === held && (!held || !this.chapterFourBoxActive)) {
      return;
    }

    this.chapterFourBoxHeld = held;
    if (held) {
      this.setPlacementToolActive(false);
      this.setMicrophoneSoundToolActive(false);
      this.setCameraToolActive(false);
      this.officeTabletHeld = false;
      this.officeTabletCameraFeedActive = false;
      this.officeTabletAnchor.visible = false;
      this.officeGlassHeld = false;
      this.officeGlassAnchor.visible = false;
      this.clearOfficeHeldPrizeItem();
      this.chapterFourBoxActive = false;
      this.chapterFourBoxViewMode = 'normal';
      this.chapterFourBoxWideCameraReady = false;
    } else {
      this.chapterFourBoxActive = false;
      this.chapterFourBoxViewMode = 'normal';
      this.chapterFourBoxWideCameraReady = false;
      this.chapterFourBoxHeldAnchor.visible = false;
      this.chapterFourBoxHideAnchor.visible = false;
      this.chapterFourBoxWideAnchor.visible = false;
      this.chapterFourBoxWorldAnchor.visible = false;
    }

    if (showStatus) {
      this.pushStatus(
        held
          ? 'Cardboard Box equipped. Press C to crawl inside it.'
          : 'Cardboard Box put away.',
        held ? 2.8 : 1.4,
      );
    }
  }

  private toggleChapterFourBox(): void {
    if (!this.chapterFourActive) {
      return;
    }
    if (!this.chapterFourBoxHeld && !this.chapterFourBoxActive) {
      this.setChapterFourBoxHeld(true, false);
    }

    this.chapterFourBoxActive = !this.chapterFourBoxActive;
    if (this.chapterFourBoxActive) {
      this.chapterFourBoxViewMode = 'normal';
      this.chapterFourBoxWideCameraReady = false;
    } else {
      this.chapterFourBoxViewMode = 'normal';
      this.chapterFourBoxWideCameraReady = false;
      this.chapterFourBoxWideAnchor.visible = false;
      this.chapterFourBoxWorldAnchor.visible = false;
    }
    this.pushStatus(
      this.chapterFourBoxActive
        ? 'You crawl inside the cardboard box. Press C to get out, Z for wide box view, or X for normal slit view.'
        : 'You crawl out of the cardboard box.',
      2.4,
    );
  }

  private setChapterFourBoxViewMode(mode: 'normal' | 'wide'): void {
    if (!this.chapterFourActive || !this.chapterFourBoxActive) {
      return;
    }

    this.chapterFourBoxViewMode = mode;
    if (mode === 'wide') {
      this.chapterFourBoxWideCameraReady = false;
    }
    this.pushStatus(
      mode === 'wide'
        ? 'Cardboard Box wide view. The box stays over you while you can see around.'
        : 'Cardboard Box normal view. You are looking through the front slit.',
      1.8,
    );
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
    this.officeEmployeeElevatorRide = null;
    this.officeEmployeeElevatorBasementActive = false;
    this.clearOfficePendingVentChase();
    this.officeJumpscareMenuOpen = false;
    this.stopOfficeJumpscare();
    this.officeGlassHeld = false;
    this.officeGlassAnchor.visible = false;
    this.clearOfficeHeldPrizeItem();
    this.chapterFourBoxHeld = false;
    this.chapterFourBoxActive = false;
    this.chapterFourBoxViewMode = 'normal';
    this.chapterFourBoxWideCameraReady = false;
    this.chapterFourBoxHeldAnchor.visible = false;
    this.chapterFourBoxHideAnchor.visible = false;
    this.chapterFourBoxWideAnchor.visible = false;
    this.chapterFourBoxWorldAnchor.visible = false;
    this.clearOfficeGlassThrows();
  }

  private clearOfficeCameraPuppetThreat(): void {
    this.officeCameraPuppetPhase = 'idle';
    this.officeCameraPuppetTimer = 0;
  }

  private maybeStartOfficeCameraPuppetThreat(): void {
    this.clearOfficeCameraPuppetThreat();
  }

  private handleOfficeCameraPuppetFeedClosed(): void {
    this.clearOfficeCameraPuppetThreat();
  }

  private handleOfficeCameraPuppetFeedOpened(): boolean {
    this.clearOfficeCameraPuppetThreat();
    return false;
  }

  private updateOfficeCameraPuppetThreat(): void {
    this.clearOfficeCameraPuppetThreat();
  }

  private toggleOfficeTabletCameraFeed(): void {
    if (!this.officeChapterActive || !this.player.isLocked() || this.chapterMenuOpen || this.officeJumpscareMenuOpen || this.officeModeMenuOpen) {
      return;
    }

    if (!this.officeGameModeHasPower()) {
      this.officeTabletCameraFeedActive = false;
      this.pushStatus('The desk camera iPad is dead. The office power is out.', 2.4);
      return;
    }

    if (!this.officeTabletCameraFeedActive && !this.getNearestOfficeCameraMonitors()) {
      this.pushStatus('Use the camera iPad on the office desk to open the camera feed.', 2.2);
      return;
    }

    if (!this.officeTabletCameraFeedActive && this.officeChapter.securityCameras.length === 0) {
      this.pushStatus('No desk cameras are installed. Mark a spot with the Coordinate Tool and tell Codex where to add one.', 3);
      return;
    }

    const wasViewingCameraFeed = this.officeTabletCameraFeedActive;
    this.officeTabletCameraFeedActive = !this.officeTabletCameraFeedActive;
    this.officeTabletHeld = false;
    this.placementToolActive = false;
    this.placementPreview.visible = false;
    this.officeGlassHeld = false;
    this.officeGlassAnchor.visible = false;
    this.clearOfficeHeldPrizeItem();
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
        ? 'The puppet vanishes behind the iPad static.'
      : this.officeCameraPuppetPhase !== 'idle'
        ? this.officeCameraPuppetPhase === 'camera-face'
          ? 'A crying puppet face fills the camera. Close the desk iPad now.'
          : this.officeCameraPuppetPhase === 'room-watch'
            ? 'The puppet is staring at you. Put the camera back up within two seconds.'
            : 'The puppet reaches you.'
      : this.officeTabletCameraFeedActive
        ? `Viewing ${camera?.label ?? 'desk camera'} on the desk iPad. Press number keys to switch, or left click again to return.`
        : 'Camera iPad view closed.',
      clearedPuppetThreat || this.officeCameraPuppetPhase !== 'idle' ? 2.4 : this.officeTabletCameraFeedActive ? 2.6 : 1.4,
    );
  }

  private officeGameModeHasPower(): boolean {
    return !this.officeGameModeActive || (!this.officeGameModePowerOut && !this.officePowerRebootRequired && this.officeGameModePower > 0);
  }

  private updateOfficePlayerNoise(
    deltaSeconds: number,
    horizontalMoveDistance: number,
    sprinting: boolean,
    playerInOfficeBallPit: boolean,
    playerPosition: Vector3,
  ): void {
    if (!this.officeChapterActive || !this.officeGameModeActive) {
      this.officePlayerNoiseLevel = Math.max(0, this.officePlayerNoiseLevel - deltaSeconds * 0.8);
      this.officePlayerVoiceLevel = 0;
      return;
    }

    const speed = deltaSeconds > 0 ? horizontalMoveDistance / deltaSeconds : 0;
    const moving = this.player.isLocked()
      && !this.chapterMenuOpen
      && horizontalMoveDistance > 0.0015;
    const movementNoise = moving
      ? MathUtils.clamp(speed / GAME_CONFIG.player.sprintSpeed, 0, 1.15)
        * (sprinting ? 0.68 : playerInOfficeBallPit ? 0.36 : this.officeVentActive ? 0.16 : 0.28)
      : 0;
    const voiceLevel = this.officeMicrophoneEnabled ? this.voiceInput.getLevel() : 0;
    const voiceNoise = MathUtils.clamp(voiceLevel * OFFICE_VOICE_NOISE_MULTIPLIER, 0, 1);
    const targetNoise = Math.max(movementNoise, voiceNoise);

    this.officePlayerVoiceLevel = voiceLevel;
    if (voiceLevel < OFFICE_STAGE_YELL_LEVEL * 0.62) {
      this.officeStageYellReleaseAllowed = null;
    }
    if (targetNoise > 0.02) {
      this.officePlayerNoisePosition.copy(playerPosition);
      this.officePlayerNoiseLevel = targetNoise > this.officePlayerNoiseLevel
        ? MathUtils.lerp(this.officePlayerNoiseLevel, targetNoise, 0.62)
        : Math.max(0, this.officePlayerNoiseLevel - deltaSeconds * 0.62);
      return;
    }

    this.officePlayerNoiseLevel = Math.max(0, this.officePlayerNoiseLevel - deltaSeconds * 0.78);
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
      this.scene.add(model.root);
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
        route: OFFICE_GAME_MODE_ROUTES[animatronic].map((point) => this.getOfficeGameModePoint(point)),
        routeIndex: 0,
        state: 'stage',
        waitTimer: 0,
        offBalanceTimer: 0,
        jukeCount: 0,
        foxyLeapTimer: 0,
        foxyLeapStartPosition: this.getOfficeGameModeOfficeCenter(),
        foxyLeapTargetPosition: this.getOfficeGameModeOfficeCenter(),
        doorBreachTimer: 0,
        doorBreachDoorId: null,
        doorLingerSoundPlayed: false,
        doorLingerLaughPlayed: false,
        attackCooldown: 0,
        lostSightTimer: 0,
        stuckTimer: 0,
        progressStallTimer: 0,
        detourTarget: null,
        detourTimer: 0,
        distractionTarget: null,
        lastKnownPlayerPosition: this.getOfficeGameModeOfficeCenter(),
        chaseCommitTarget: this.getOfficeGameModeOfficeCenter(),
        chaseCommitTimer: 0,
        chaseCommitCooldown: 0,
        chaseGiveUpTimer: 0,
        calmProximityTimer: 0,
        quackyMouthScareTimer: 0,
        insultStareTimer: 0,
        insultChargeTimer: 0,
        insultCooldown: 0,
        cameraStareTimer: 0,
        cameraStareCooldown: 0,
        cameraStareCameraId: null,
        senseTimer: 0,
        walkCyclePhase: Math.random() * Math.PI * 2,
        walkCycleSpeedMultiplier: 1,
        walkCycleStrideMultiplier: 1,
        walkCycleArmMultiplier: 1,
        walkCycleSideMultiplier: 1,
        walkCycleBounceMultiplier: 1,
        cachedCanSeePlayer: false,
        cachedNoiseResponse: 'none',
        cachedBlockedDoorId: null,
      });
      this.randomizeOfficeAnimatronicWalkCycle(this.officeGameModeAnimatronics[this.officeGameModeAnimatronics.length - 1]);
    });
  }

  private randomizeOfficeAnimatronicWalkCycle(animatronic: OfficeGameModeAnimatronicState): void {
    const animalSpeedBias = animatronic.animatronic === 'foxy'
      ? 1.12
      : animatronic.animatronic === 'bori'
        ? 0.9
        : animatronic.animatronic === 'fluffle'
          ? 1.06
          : 1;
    animatronic.walkCyclePhase = Math.random() * Math.PI * 2;
    animatronic.walkCycleSpeedMultiplier = MathUtils.lerp(0.82, 1.22, Math.random()) * animalSpeedBias;
    animatronic.walkCycleStrideMultiplier = MathUtils.lerp(0.82, 1.26, Math.random());
    animatronic.walkCycleArmMultiplier = MathUtils.lerp(0.76, 1.34, Math.random());
    animatronic.walkCycleSideMultiplier = MathUtils.lerp(0.82, 1.2, Math.random());
    animatronic.walkCycleBounceMultiplier = MathUtils.lerp(0.55, 1.35, Math.random());
  }

  private getOfficeGameModeOffsetVector(): Vector3 {
    return this.officeSandboxChapterActive
      ? new Vector3(OFFICE_CHAPTER_COPY_OFFSET_X, 0, OFFICE_CHAPTER_COPY_OFFSET_Z)
      : new Vector3();
  }

  private getOfficeGameModePoint(point: Vector3): Vector3 {
    return point.clone().add(this.getOfficeGameModeOffsetVector());
  }

  private getOfficeGameModeDoorWatchPoint(doorId: 'left' | 'right'): Vector3 {
    return this.getOfficeGameModePoint(doorId === 'left' ? OFFICE_GAME_MODE_LEFT_DOOR_WATCH : OFFICE_GAME_MODE_RIGHT_DOOR_WATCH);
  }

  private getOfficeGameModeOfficeCenter(): Vector3 {
    return this.getOfficeGameModePoint(OFFICE_GAME_MODE_OFFICE_CENTER);
  }

  private clearOfficeGameModeAnimatronics(): void {
    this.officeGameModeAnimatronics.forEach((animatronic) => {
      this.restoreOfficePowerOutBoriEyeFlicker(animatronic.model.root);
      animatronic.model.root.removeFromParent();
    });
    this.officeGameModeAnimatronics.length = 0;
  }

  private clearOfficeVentBoy(): void {
    if (!this.officeVentBoy) {
      return;
    }

    this.officeVentBoy.root.removeFromParent();
    this.officeVentBoy = null;
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

  private restoreOfficePowerOutBoriEyeFlicker(root: Group): void {
    root.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (
          !(material instanceof MeshStandardMaterial)
          || typeof material.userData.officePowerOutBaseEmissiveIntensity !== 'number'
        ) {
          return;
        }

        material.emissiveIntensity = material.userData.officePowerOutBaseEmissiveIntensity;
        delete material.userData.officePowerOutBaseEmissiveIntensity;
      });
    });
  }

  private resetOfficeGameModeAnimatronics(): void {
    this.ensureOfficeGameModeAnimatronics();
    this.officeGameModeAnimatronics.forEach((animatronic, index) => {
      this.restoreOfficePowerOutBoriEyeFlicker(animatronic.model.root);
      const start = animatronic.route[0] ?? this.getOfficeGameModeOfficeCenter();
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
      animatronic.offBalanceTimer = 0;
      animatronic.jukeCount = 0;
      animatronic.foxyLeapTimer = 0;
      animatronic.foxyLeapStartPosition.copy(this.getOfficeGameModeOfficeCenter());
      animatronic.foxyLeapTargetPosition.copy(this.getOfficeGameModeOfficeCenter());
      animatronic.doorBreachTimer = 0;
      animatronic.doorBreachDoorId = null;
      animatronic.doorLingerSoundPlayed = false;
      animatronic.doorLingerLaughPlayed = false;
      animatronic.attackCooldown = 1.5;
      animatronic.lostSightTimer = 0;
      animatronic.stuckTimer = 0;
      animatronic.progressStallTimer = 0;
      animatronic.detourTarget = null;
      animatronic.detourTimer = 0;
      animatronic.distractionTarget = null;
      animatronic.lastKnownPlayerPosition.copy(this.getOfficeGameModeOfficeCenter());
      animatronic.chaseCommitTarget.copy(this.getOfficeGameModeOfficeCenter());
      animatronic.chaseCommitTimer = 0;
      animatronic.chaseCommitCooldown = 0;
      animatronic.calmProximityTimer = 0;
      this.clearOfficeAnimatronicChaseTimers(animatronic, true);
      animatronic.cameraStareTimer = 0;
      animatronic.cameraStareCooldown = 0;
      animatronic.cameraStareCameraId = null;
      animatronic.senseTimer = 0;
      animatronic.cachedCanSeePlayer = false;
      animatronic.cachedNoiseResponse = 'none';
      animatronic.cachedBlockedDoorId = null;
      this.randomizeOfficeAnimatronicWalkCycle(animatronic);
      animatronic.model.leftArm.rotation.set(0, 0, 0);
      animatronic.model.rightArm.rotation.set(0, 0, 0);
      animatronic.model.leftArmJoint.rotation.set(0, 0, 0);
      animatronic.model.rightArmJoint.rotation.set(0, 0, 0);
      animatronic.model.leftLeg.rotation.set(0, 0, 0);
      animatronic.model.rightLeg.rotation.set(0, 0, 0);
      animatronic.model.leftLegJoint.rotation.set(0, 0, 0);
      animatronic.model.rightLegJoint.rotation.set(0, 0, 0);
      animatronic.model.root.scale.setScalar(OFFICE_GAME_MODE_ANIMATRONIC_SCALE[animatronic.animatronic]);
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

  private getOfficeGameModePowerLabel(): string {
    const suffix = this.officeGameModePowerOut
      ? ' / OUT'
      : '';
    return `${Math.ceil(this.officeGameModePower)}%${suffix}`;
  }

  private getOfficeGameModePhaseTimeRemaining(): number {
    const phaseDuration = this.officeGameModeNightPhase
      ? OFFICE_GAME_MODE_NIGHT_SECONDS
      : OFFICE_GAME_MODE_DAY_SECONDS;
    return Math.max(0, phaseDuration - this.officeGameModePhaseTime);
  }

  private resetOfficeFuseBoxPuzzle(resetDoor = false): void {
    OFFICE_FUSE_WIRE_COLORS.forEach((color) => {
      this.officeFuseWireConnected[color] = false;
    });
    const fuseBox = this.officeChapter.storageFuseBox;
    fuseBox.targetLeverAmount = 0;
    fuseBox.leverPulled = false;
    if (resetDoor) {
      fuseBox.targetOpenAmount = 0;
      fuseBox.open = false;
    }
    this.syncOfficeFuseBoxVisuals();
  }

  private syncOfficeFuseBoxVisuals(): void {
    const fuseBox = this.officeChapter.storageFuseBox;
    OFFICE_FUSE_WIRE_COLORS.forEach((color) => {
      const connected = this.officeFuseWireConnected[color];
      const wire = fuseBox.wires[color];
      wire.loose.visible = !connected;
      wire.connected.visible = connected;
      wire.outletMaterial.emissiveIntensity = connected ? 0.58 : 0.12;
    });

    const allWiresConnected = OFFICE_FUSE_WIRE_COLORS.every((color) => this.officeFuseWireConnected[color]);
    if (this.officePowerRebootRequired) {
      fuseBox.statusLightMaterial.color.setHex(allWiresConnected ? 0xffd95a : 0xff3a2e);
      fuseBox.statusLightMaterial.emissive.setHex(allWiresConnected ? 0xffb72e : 0xff2a1f);
      fuseBox.statusLightMaterial.emissiveIntensity = allWiresConnected ? 0.9 : 0.72;
      return;
    }

    fuseBox.statusLightMaterial.color.setHex(0x5cff89);
    fuseBox.statusLightMaterial.emissive.setHex(0x2fff65);
    fuseBox.statusLightMaterial.emissiveIntensity = 0.68;
  }

  private completeOfficePowerReboot(): void {
    this.officePowerRebootRequired = false;
    this.officeChapter.storageFuseBox.targetLeverAmount = 1;
    this.officeChapter.storageFuseBox.leverPulled = true;
    this.syncOfficeFuseBoxVisuals();
    this.powerEventAudio.resume();
    this.powerEventAudio.playZap();
    this.pushStatus('Power rebooted from the ball pit fuse box. Office controls are live again until the next 10 to 20 percent of power is used.', 4.6);
  }

  private resetOfficeGameModeNightState(): void {
    this.officeGameModePower = 100;
    this.officeGameModePowerOut = false;
    this.officePowerRebootRequired = false;
    this.resetOfficeFuseBoxPuzzle(true);
    this.officeFreddyPowerOutTimer = 0;
    this.officePowerOutBoriDoor = null;
    this.officeMicrophoneManualOff = false;
    this.officeMicrophoneAutoStatusShown = false;
    this.officePlayerNoiseLevel = 0;
    this.officePlayerVoiceLevel = 0;
    this.officeStageYellReleaseAllowed = null;
    this.resetOfficeFoxyCameraPressure();
    this.officeFoxyRushCooldown = 8;
    this.officeFoxyClankCooldown = 0;
    this.officeFoxyRushDoor = null;
    this.clearOfficePendingVentChase();
    this.clearOfficeCameraPuppetThreat();
    this.officeChapter.doors.forEach((door) => {
      door.targetOpenAmount = 1;
      door.open = true;
      door.closeBounceTimer = 0;
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
    this.officeDeathNoticePhase = null;
    this.officeDeathNoticeTimer = 0;
    this.officeGameModeDifficulty = difficulty;
    this.officeGameModePower = 100;
    this.officeGameModePowerOut = false;
    this.officePowerRebootRequired = false;
    this.resetOfficeFuseBoxPuzzle(true);
    this.officeFreddyPowerOutTimer = 0;
    this.officePowerOutBoriDoor = null;
    this.officePlayerNoiseLevel = 0;
    this.officePlayerVoiceLevel = 0;
    this.officeStageVoiceReleaseCooldown = 0;
    this.officeStageYellReleaseAllowed = null;
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
    this.officeEmployeeElevatorRide = null;
    this.officeEmployeeElevatorBasementActive = false;
    this.clearOfficePendingVentChase();
    this.officeTabletCameraFeedActive = false;
    this.officeTabletHeld = false;
    this.officeTabletAnchor.visible = false;
    this.clearOfficeCameraPuppetThreat();
    this.officeGlassHeld = false;
    this.officeGlassAnchor.visible = false;
    this.clearOfficeHeldPrizeItem();
    this.officeBasketballHeld = false;
    this.officeBasketballAnchor.visible = false;
    this.officeChapter.setBasketballHeld(false);
    this.officeChapter.doors.forEach((door) => {
      door.targetOpenAmount = 1;
      door.open = true;
      door.closeBounceTimer = 0;
    });
    this.officeChapter.storageClosetDoor.targetOpenAmount = 1;
    this.officeChapter.storageClosetDoor.open = true;
    this.player.teleport(this.getOfficeGameModePoint(OFFICE_GAME_MODE_OFFICE_SPAWN));
    this.player.lookToward(this.getOfficeGameModePoint(OFFICE_GAME_MODE_OFFICE_LOOK_TARGET), 1);
    this.flashlight.setEnabled(false);
    this.requestOfficeMicrophoneStart('auto');
    this.resetOfficeGameModeAnimatronics();
    if (difficulty === 'hard') {
      this.ensureOfficeVentBoy();
      this.resetOfficeVentBoy();
    }
    this.resize();
    this.pushStatus(
      `${this.getOfficeModeLabel(mode)} started on ${this.getOfficeGameModeConfig().label}. Survive five nights. Each night runs 12 AM to 6 AM in five minutes.`,
      4.6,
    );
  }

  private stopOfficeGameMode(): void {
    this.officeGameModeActive = false;
    this.officeDeathNoticePhase = null;
    this.officeDeathNoticeTimer = 0;
    this.officeMode = 'creator';
    this.officeModeMenuOpen = false;
    this.officeModeMenuStep = 'mode';
    this.officeModeMenuPendingMode = null;
    this.officeGameModePowerOut = false;
    this.officePowerRebootRequired = false;
    this.resetOfficeFuseBoxPuzzle(true);
    this.officeFreddyPowerOutTimer = 0;
    this.officePowerOutBoriDoor = null;
    this.officeGameModePower = 100;
    this.officePlayerNoiseLevel = 0;
    this.officePlayerVoiceLevel = 0;
    this.officeStageVoiceReleaseCooldown = 0;
    this.officeStageYellReleaseAllowed = null;
    this.officeGameModeNightPhase = false;
    this.officeGameModePhaseTime = 0;
    this.officeGameModeNight = 1;
    this.resetOfficeFoxyCameraPressure();
    this.officeFoxyRushCooldown = 0;
    this.officeFoxyClankCooldown = 0;
    this.officeFoxyRushDoor = null;
    this.clearOfficeCameraPuppetThreat();
    this.stopOfficeDoorSound();
    this.voiceInput.stop();
    this.stopOfficeSpeechRecognition();
    this.officeMicrophoneEnabled = false;
    this.officeMicrophoneManualOff = false;
    this.officeMicrophoneStartPending = false;
    this.officeMicrophoneAutoStatusShown = false;
    this.officeMicrophoneStartToken += 1;
    this.officeBallPitSlide = null;
    this.officeVentActive = false;
    this.officeVentDrop = null;
    this.officeEmployeeElevatorRide = null;
    this.officeEmployeeElevatorBasementActive = false;
    this.clearOfficePendingVentChase();
    this.clearOfficeDoorSparks();
    this.officeGameModeAnimatronics.forEach((animatronic) => {
      animatronic.model.root.visible = false;
      animatronic.state = 'stage';
      animatronic.offBalanceTimer = 0;
      animatronic.jukeCount = 0;
      animatronic.foxyLeapTimer = 0;
      animatronic.distractionTarget = null;
      this.officeChapter.setStageAnimatronicPresent(animatronic.animatronic, true);
    });
    if (this.officeVentBoy) {
      this.officeVentBoy.root.visible = false;
    }
    this.resize();
  }

  private isPlayerInsideOfficeRoom(position = this.player.getPosition()): boolean {
    const center = this.getOfficeGameModeOfficeCenter();
    return Math.abs(position.x - center.x) <= 6.2 && Math.abs(position.z - center.z) <= 5.25;
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
    const leftWatch = this.getOfficeGameModeDoorWatchPoint('left');
    const rightWatch = this.getOfficeGameModeDoorWatchPoint('right');
    if (leftClosed && animatronicPosition.x < leftWatch.x + 2.3 && Math.abs(animatronicPosition.z - leftWatch.z) < 6.2) {
      return 'left';
    }

    return rightClosed && animatronicPosition.x > rightWatch.x - 2.3 && Math.abs(animatronicPosition.z - rightWatch.z) < 6.2
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

    const doorWatch = this.getOfficeGameModeDoorWatchPoint(doorId);
    this.officeGameModeAnimatronics.forEach((animatronic) => {
      const position = animatronic.model.root.position;
      const distance = Math.hypot(position.x - doorWatch.x, position.z - doorWatch.z);
      if (distance > 7.2) {
        return;
      }

      animatronic.state = 'retreat';
      animatronic.offBalanceTimer = 0;
      animatronic.foxyLeapTimer = 0;
      animatronic.doorBreachTimer = 0;
      animatronic.doorBreachDoorId = null;
      animatronic.doorLingerSoundPlayed = false;
      animatronic.doorLingerLaughPlayed = false;
      animatronic.routeIndex = 0;
      animatronic.waitTimer = 0.25;
      animatronic.lostSightTimer = 0;
      animatronic.progressStallTimer = 0;
      animatronic.detourTarget = null;
      animatronic.detourTimer = 0;
      animatronic.distractionTarget = null;
      this.pushStatus(`${animatronic.label} backs away from the ${doorId} door light.`, 2.1);
    });
  }

  private startOfficeGameModeDoorBreach(
    animatronic: OfficeGameModeAnimatronicState,
    doorId: 'left' | 'right',
  ): void {
    if (!this.canOfficeGameModeAnimatronicForceOfficeDoor(animatronic)) {
      this.startOfficeGameModeDoorBlockedWait(animatronic, doorId);
      return;
    }

    animatronic.state = 'door-breach';
    animatronic.offBalanceTimer = 0;
    animatronic.foxyLeapTimer = 0;
    animatronic.doorBreachTimer = 0;
    animatronic.doorBreachDoorId = doorId;
    animatronic.doorLingerSoundPlayed = false;
    animatronic.doorLingerLaughPlayed = false;
    animatronic.waitTimer = 0;
    animatronic.lostSightTimer = 0;
    animatronic.stuckTimer = 0;
    animatronic.progressStallTimer = 0;
    animatronic.detourTarget = null;
    animatronic.detourTimer = 0;
    animatronic.distractionTarget = null;
    animatronic.chaseCommitTimer = 0;
    animatronic.chaseCommitCooldown = OFFICE_GAME_MODE_CHASE_COMMIT_COOLDOWN;
    this.clearOfficeAnimatronicChaseTimers(animatronic);
    animatronic.senseTimer = 0;
    animatronic.cachedCanSeePlayer = false;
    animatronic.cachedNoiseResponse = 'none';
    animatronic.cachedBlockedDoorId = doorId;
    this.pushStatus(`${animatronic.label} crouches and starts forcing the ${doorId} door up.`, 2.8);
  }

  private startOfficeGameModeDoorBlockedWait(
    animatronic: OfficeGameModeAnimatronicState,
    doorId: 'left' | 'right',
  ): void {
    animatronic.state = 'door';
    animatronic.offBalanceTimer = 0;
    animatronic.foxyLeapTimer = 0;
    animatronic.doorBreachTimer = 0;
    animatronic.doorBreachDoorId = null;
    animatronic.doorLingerSoundPlayed = false;
    animatronic.doorLingerLaughPlayed = false;
    animatronic.waitTimer = OFFICE_DOOR_LINGER_SECONDS;
    animatronic.lostSightTimer = 0;
    animatronic.progressStallTimer = 0;
    animatronic.stuckTimer = 0;
    animatronic.detourTarget = null;
    animatronic.detourTimer = 0;
    animatronic.distractionTarget = null;
    animatronic.chaseCommitTimer = 0;
    animatronic.chaseCommitCooldown = OFFICE_GAME_MODE_CHASE_COMMIT_COOLDOWN;
    animatronic.senseTimer = 0;
    animatronic.cachedCanSeePlayer = false;
    animatronic.cachedNoiseResponse = 'none';
    animatronic.cachedBlockedDoorId = doorId;
    this.clearOfficeAnimatronicChaseTimers(animatronic);
  }

  private tryOfficeDoorCloseHallwayBreach(doorId: 'left' | 'right'): void {
    if (!this.officeGameModeActive || this.officeDeathNoticePhase || this.activeOfficeJumpscare) {
      return;
    }

    const candidate = this.getOfficeDoorCloseHallwayBreachCandidate(doorId);
    if (!candidate) {
      return;
    }

    if (Math.random() < OFFICE_DOOR_BREACH_CHANCE) {
      this.startOfficeGameModeDoorBreach(candidate, doorId);
      return;
    }

    this.startOfficeGameModeDoorBlockedWait(candidate, doorId);
  }

  private getOfficeDoorCloseHallwayBreachCandidate(
    doorId: 'left' | 'right',
  ): OfficeGameModeAnimatronicState | null {
    const doorWatch = this.getOfficeGameModeDoorWatchPoint(doorId);
    let closest: OfficeGameModeAnimatronicState | null = null;
    let closestDistance = Infinity;

    for (const animatronic of this.officeGameModeAnimatronics) {
      if (!this.canOfficeGameModeAnimatronicForceOfficeDoor(animatronic)) {
        continue;
      }

      if (
        animatronic.state !== 'chase'
        && animatronic.state !== 'rush'
        && animatronic.state !== 'door'
      ) {
        continue;
      }

      const position = animatronic.model.root.position;
      const inSideHallway = doorId === 'left'
        ? position.x < doorWatch.x + 4.3
        : position.x > doorWatch.x - 4.3;
      if (!inSideHallway || Math.abs(position.z - doorWatch.z) > 8.6) {
        continue;
      }

      const distance = Math.hypot(position.x - doorWatch.x, position.z - doorWatch.z);
      if (distance > 10.5 || distance >= closestDistance) {
        continue;
      }

      closest = animatronic;
      closestDistance = distance;
    }

    return closest;
  }

  private updateOfficeGameModeDoorBreach(
    animatronic: OfficeGameModeAnimatronicState,
    deltaSeconds: number,
    playerPosition: Vector3,
  ): void {
    const doorId = animatronic.doorBreachDoorId ?? animatronic.cachedBlockedDoorId;
    const door = doorId ? this.getOfficeDoorById(doorId) : null;
    if (!doorId || !door) {
      animatronic.state = 'rush';
      animatronic.doorBreachTimer = 0;
      animatronic.doorBreachDoorId = null;
      animatronic.doorLingerSoundPlayed = false;
      animatronic.doorLingerLaughPlayed = false;
      animatronic.lastKnownPlayerPosition.copy(playerPosition);
      animatronic.chaseGiveUpTimer = 0;
      return;
    }

    const previousTimer = animatronic.doorBreachTimer;
    animatronic.doorBreachTimer = Math.min(
      OFFICE_DOOR_BREACH_SECONDS,
      animatronic.doorBreachTimer + deltaSeconds,
    );
    const progress = MathUtils.clamp(animatronic.doorBreachTimer / OFFICE_DOOR_BREACH_SECONDS, 0, 1);
    const root = animatronic.model.root;
    const doorWatch = this.getOfficeGameModeDoorWatchPoint(doorId);
    const doorSide = doorId === 'left' ? -1 : 1;
    const floorY = this.getOfficeGameModeAnimatronicFloorY(animatronic.animatronic, doorWatch.x, doorWatch.z);
    const crouchDown = MathUtils.smoothstep(progress, 0.05, 0.24);
    const crouchUp = MathUtils.smoothstep(progress, 0.58, 0.9);
    const crouch = crouchDown * (1 - crouchUp * 0.84);
    const reachUnder = MathUtils.smoothstep(progress, 0.16, 0.34) * (1 - MathUtils.smoothstep(progress, 0.48, 0.7));
    const grab = MathUtils.smoothstep(progress, 0.3, 0.48);
    const lift = MathUtils.smoothstep(progress, 0.38, 0.96);
    const doorLift = MathUtils.smoothstep(progress, 0.42, 0.995);
    const oneArmShove = MathUtils.smoothstep(progress, 0.52, 0.92);
    const brace = MathUtils.smoothstep(progress, 0.34, 0.52) * (1 - MathUtils.smoothstep(progress, 0.92, 1));
    const jump = Math.sin(MathUtils.smoothstep(progress, 0.76, 0.98) * Math.PI) * 0.08;
    const shake = brace * Math.sin(this.elapsed * 52);
    const baseScale = OFFICE_GAME_MODE_ANIMATRONIC_SCALE[animatronic.animatronic];

    root.visible = true;
    root.position.x = MathUtils.lerp(root.position.x, doorWatch.x, 0.45);
    root.position.z = MathUtils.lerp(root.position.z, doorWatch.z, 0.45);
    root.position.y = floorY - crouch * 0.24 + jump;
    root.scale.set(baseScale, baseScale * (1 - crouch * 0.24 + lift * 0.03), baseScale);

    const faceX = playerPosition.x - root.position.x;
    const faceZ = playerPosition.z - root.position.z;
    if (Math.hypot(faceX, faceZ) > 0.01) {
      root.rotation.y = Math.atan2(faceX, faceZ);
    }
    root.rotation.x = MathUtils.lerp(root.rotation.x, crouch * 0.46 - oneArmShove * 0.08, 0.38);
    root.rotation.z = shake * 0.045 + doorSide * oneArmShove * 0.035;

    animatronic.model.head.rotation.x = MathUtils.lerp(animatronic.model.head.rotation.x, crouch * 0.42 - oneArmShove * 0.16, 0.36);
    animatronic.model.head.rotation.y = shake * 0.08;
    animatronic.model.leftLeg.rotation.x = MathUtils.lerp(animatronic.model.leftLeg.rotation.x, -crouch * 0.72, 0.42);
    animatronic.model.rightLeg.rotation.x = MathUtils.lerp(animatronic.model.rightLeg.rotation.x, -crouch * 0.72, 0.42);
    animatronic.model.leftLegJoint.rotation.x = MathUtils.lerp(animatronic.model.leftLegJoint.rotation.x, crouch * 1.05, 0.42);
    animatronic.model.rightLegJoint.rotation.x = MathUtils.lerp(animatronic.model.rightLegJoint.rotation.x, crouch * 1.05, 0.42);
    const leftShove = doorId === 'right' ? oneArmShove : oneArmShove * 0.35;
    const rightShove = doorId === 'left' ? oneArmShove : oneArmShove * 0.35;
    const armBase = MathUtils.lerp(-1.18, -2.38, grab);
    animatronic.model.leftArm.rotation.x = MathUtils.lerp(
      animatronic.model.leftArm.rotation.x,
      armBase - leftShove * 0.72 + reachUnder * 0.5 + shake * 0.08,
      0.48,
    );
    animatronic.model.rightArm.rotation.x = MathUtils.lerp(
      animatronic.model.rightArm.rotation.x,
      armBase - rightShove * 0.72 + reachUnder * 0.5 - shake * 0.08,
      0.48,
    );
    animatronic.model.leftArm.rotation.z = MathUtils.lerp(
      animatronic.model.leftArm.rotation.z,
      -0.28 - lift * 0.38 - leftShove * 0.34,
      0.44,
    );
    animatronic.model.rightArm.rotation.z = MathUtils.lerp(
      animatronic.model.rightArm.rotation.z,
      0.28 + lift * 0.38 + rightShove * 0.34,
      0.44,
    );
    animatronic.model.leftArmJoint.rotation.x = MathUtils.lerp(animatronic.model.leftArmJoint.rotation.x, -0.22 - leftShove * 0.54, 0.42);
    animatronic.model.rightArmJoint.rotation.x = MathUtils.lerp(animatronic.model.rightArmJoint.rotation.x, -0.22 - rightShove * 0.54, 0.42);

    if (previousTimer < OFFICE_DOOR_BREACH_SECONDS * 0.18 && animatronic.doorBreachTimer >= OFFICE_DOOR_BREACH_SECONDS * 0.18) {
      this.gameplaySfxAudio.playSecurityDoorCrash();
    }

    if (previousTimer < OFFICE_DOOR_BREACH_SECONDS * 0.38 && animatronic.doorBreachTimer >= OFFICE_DOOR_BREACH_SECONDS * 0.38) {
      this.playOfficeDoorToggleSound(doorId, true);
      this.gameplaySfxAudio.playForcedSecurityDoorScreech();
      this.gameplaySfxAudio.playSecurityDoorCrash();
      this.spawnOfficeDoorSparks(doorId, doorLift);
      this.spawnOfficeDoorSparks(doorId, doorLift);
    }

    if (progress >= 0.34) {
      door.targetOpenAmount = Math.max(door.targetOpenAmount, doorLift);
      door.open = true;
      door.openAmount = Math.max(door.openAmount, doorLift);
      door.closeBounceTimer = 0;
    }

    if (progress >= 0.34 && progress < 0.995) {
      const sparkBursts = Math.floor(animatronic.doorBreachTimer / 0.11) - Math.floor(previousTimer / 0.11);
      for (let index = 0; index < sparkBursts; index += 1) {
        this.spawnOfficeDoorSparks(doorId, doorLift);
      }
    }

    if (progress < 1) {
      return;
    }

    root.scale.setScalar(baseScale);
    root.rotation.x = 0;
    root.rotation.z = 0;
    door.targetOpenAmount = 1;
    door.openAmount = 1;
    door.open = true;
    animatronic.state = 'rush';
    animatronic.doorBreachTimer = 0;
    animatronic.doorBreachDoorId = null;
    animatronic.doorLingerSoundPlayed = false;
    animatronic.doorLingerLaughPlayed = false;
    animatronic.lastKnownPlayerPosition.copy(playerPosition);
    animatronic.chaseGiveUpTimer = 0;
    animatronic.waitTimer = 0;
    animatronic.attackCooldown = Math.max(animatronic.attackCooldown, 0.35);
    animatronic.lostSightTimer = 0;
    animatronic.stuckTimer = 0;
    animatronic.progressStallTimer = 0;
    animatronic.detourTarget = null;
    animatronic.detourTimer = 0;
    animatronic.senseTimer = 0;
    animatronic.cachedCanSeePlayer = true;
    animatronic.cachedNoiseResponse = 'rush';
    animatronic.cachedBlockedDoorId = null;
    this.pushStatus(`${animatronic.label} rips the ${doorId} door up and charges through.`, 2.6);
  }

  private updateOfficeGameModeDoorLinger(
    animatronic: OfficeGameModeAnimatronicState,
    deltaSeconds: number,
    playerPosition: Vector3,
  ): boolean {
    if (animatronic.state !== 'door') {
      return false;
    }

    const doorId = animatronic.cachedBlockedDoorId
      ?? (animatronic.model.root.position.x < this.getOfficeGameModeOfficeCenter().x ? 'left' : 'right');
    const door = this.getOfficeDoorById(doorId);
    const doorWatch = this.getOfficeGameModeDoorWatchPoint(doorId);
    const root = animatronic.model.root;
    const floorY = this.getOfficeGameModeAnimatronicFloorY(animatronic.animatronic, doorWatch.x, doorWatch.z);
    const elapsed = OFFICE_DOOR_LINGER_SECONDS - animatronic.waitTimer;
    const listenLean = Math.sin(this.elapsed * 2.2) * 0.035;
    const handTap = Math.max(0, Math.sin(this.elapsed * 5.6));

    root.visible = true;
    root.position.x = MathUtils.lerp(root.position.x, doorWatch.x, 0.28);
    root.position.z = MathUtils.lerp(root.position.z, doorWatch.z, 0.28);
    root.position.y = floorY;
    root.scale.setScalar(OFFICE_GAME_MODE_ANIMATRONIC_SCALE[animatronic.animatronic]);
    const dx = playerPosition.x - root.position.x;
    const dz = playerPosition.z - root.position.z;
    if (Math.hypot(dx, dz) > 0.01) {
      root.rotation.y = Math.atan2(dx, dz);
    }
    root.rotation.x = MathUtils.lerp(root.rotation.x, 0.05 + listenLean, 0.24);
    root.rotation.z = listenLean;

    animatronic.model.head.rotation.x = MathUtils.lerp(animatronic.model.head.rotation.x, 0.08, 0.2);
    animatronic.model.head.rotation.y = Math.sin(this.elapsed * 3.4) * 0.08;
    animatronic.model.leftArm.rotation.x = MathUtils.lerp(animatronic.model.leftArm.rotation.x, -0.72 - handTap * 0.12, 0.28);
    animatronic.model.rightArm.rotation.x = MathUtils.lerp(animatronic.model.rightArm.rotation.x, -0.78 - (1 - handTap) * 0.12, 0.28);
    animatronic.model.leftArm.rotation.z = MathUtils.lerp(animatronic.model.leftArm.rotation.z, -0.56, 0.28);
    animatronic.model.rightArm.rotation.z = MathUtils.lerp(animatronic.model.rightArm.rotation.z, 0.56, 0.28);

    if (!animatronic.doorLingerSoundPlayed) {
      animatronic.doorLingerSoundPlayed = true;
      this.gameplaySfxAudio.playSecurityDoorCrash();
    }

    if (!animatronic.doorLingerLaughPlayed && elapsed >= OFFICE_DOOR_LINGER_LAUGH_DELAY) {
      animatronic.doorLingerLaughPlayed = true;
      this.playOfficeAnimatronicDoorLaugh();
    }

    animatronic.waitTimer = Math.max(0, animatronic.waitTimer - deltaSeconds);
    if (animatronic.waitTimer > 0) {
      return true;
    }

    const doorClosed = Boolean(door && door.targetOpenAmount < 0.5);
    if (doorClosed) {
      if (
        this.canOfficeGameModeAnimatronicForceOfficeDoor(animatronic)
        && Math.random() < OFFICE_DOOR_BREACH_CHANCE
      ) {
        this.startOfficeGameModeDoorBreach(animatronic, doorId);
      } else {
        animatronic.waitTimer = 0.8 + Math.random() * 0.9;
        animatronic.doorLingerSoundPlayed = false;
        animatronic.doorLingerLaughPlayed = true;
      }
      return true;
    }

    if (Math.random() < OFFICE_DOOR_LINGER_STEP_IN_CHANCE) {
      animatronic.state = 'creep';
      animatronic.lastKnownPlayerPosition.copy(playerPosition);
      animatronic.waitTimer = 0;
      animatronic.attackCooldown = Math.max(animatronic.attackCooldown, 0.45);
      animatronic.cachedBlockedDoorId = null;
      animatronic.doorLingerSoundPlayed = false;
      animatronic.doorLingerLaughPlayed = false;
      this.pushStatus(`${animatronic.label} laughs at the door and starts stepping into the office.`, 2.6);
      return false;
    }

    this.makeOfficeGameModeAnimatronicGiveUp(animatronic);
    return true;
  }

  private resetOfficeFoxyCameraPressure(): void {
    this.officeFoxyCameraWatchTime = 0;
  }

  private getOfficeFoxyRushDoorTarget(): Vector3 {
    if (this.officeFoxyRushDoor === 'left') {
      return this.getOfficeGameModeDoorWatchPoint('left');
    }

    if (this.officeFoxyRushDoor === 'right') {
      return this.getOfficeGameModeDoorWatchPoint('right');
    }

    return this.player.getPosition().x < this.getOfficeGameModeOfficeCenter().x
      ? this.getOfficeGameModeDoorWatchPoint('left')
      : this.getOfficeGameModeDoorWatchPoint('right');
  }

  private updateOfficeFoxyCameraPressure(deltaSeconds: number): void {
    this.officeFoxyRushCooldown = Math.max(0, this.officeFoxyRushCooldown - deltaSeconds);
    if (this.officeFoxyCameraWatchTime > 0 || this.officeTabletCameraFeedActive) {
      this.resetOfficeFoxyCameraPressure();
    }
  }

  private updateOfficeFoxyRushAudio(deltaSeconds: number): void {
    this.officeFoxyClankCooldown = Math.max(0, this.officeFoxyClankCooldown - deltaSeconds);
  }

  private getOfficeGameModeStageDwellSeconds(animatronic: OfficeJumpscareAnimatronic): number {
    const activityPressure = this.getOfficeGameModeNightPressure() * 0.72 + this.getOfficeGameModeNightPhaseProgress() * 0.58;
    if (animatronic === 'bori') {
      const difficultyShift = this.officeGameModeDifficulty === 'hard'
        ? -20
        : this.officeGameModeDifficulty === 'easy'
          ? 6
          : 0;
      return Math.max(
        7,
        34
          + Math.abs(Math.sin(this.elapsed * 0.17 + 4.4)) * 16
          + difficultyShift
          - activityPressure * 26,
      );
    }

    const nightBase = [14, 11, 8, 5, 3.2][MathUtils.clamp(this.officeGameModeNight - 1, 0, 4)] ?? 8;
    const animalShift = animatronic === 'foxy'
      ? 5
      : animatronic === 'quacky'
        ? -2.5
        : animatronic === 'fluffle'
          ? -3
          : 0;
    const difficultyShift = this.officeGameModeDifficulty === 'hard'
      ? -3
      : this.officeGameModeDifficulty === 'easy'
        ? 2.5
        : 0;
    const offset = animatronic === 'quacky' ? 0.8 : animatronic === 'fluffle' ? 2.1 : 4.8;
    const randomHold = Math.abs(Math.sin(this.elapsed * 0.23 + offset)) * (this.officeGameModeNight >= 5 ? 2.4 : 4.5);
    return Math.max(2.4, nightBase + animalShift + difficultyShift - activityPressure * 7 + randomHold);
  }

  private getOfficeGameModeWaypointDwellSeconds(animatronic: OfficeJumpscareAnimatronic, routeIndex: number): number {
    const doorRoute = this.isOfficeGameModeDoorRoutePoint(animatronic, routeIndex);
    if (doorRoute) {
      return 1.3 + Math.random() * 1.8;
    }

    if (animatronic === 'quacky' && routeIndex >= 2 && routeIndex <= 4) {
      return 2.2 + Math.abs(Math.sin(this.elapsed * 0.41 + routeIndex)) * 2.4;
    }

    if (animatronic === 'foxy' && routeIndex === 5) {
      return 3.2 + Math.abs(Math.sin(this.elapsed * 0.37)) * 3.2;
    }

    if (animatronic === 'fluffle' && (routeIndex === 2 || routeIndex === 3)) {
      return 1.8 + Math.abs(Math.sin(this.elapsed * 0.5 + routeIndex)) * 2.1;
    }

    if (animatronic === 'bori' && routeIndex >= 4 && routeIndex <= 5) {
      return 1.8 + Math.abs(Math.sin(this.elapsed * 0.44 + routeIndex)) * 2.2;
    }

    return 0.7 + Math.abs(Math.sin(this.elapsed * 0.58 + routeIndex)) * 1.4;
  }

  private isOfficeGameModeDoorRoutePoint(animatronic: OfficeJumpscareAnimatronic, routeIndex: number): boolean {
    const point = OFFICE_GAME_MODE_ROUTES[animatronic][routeIndex];
    if (!point) {
      return false;
    }

    return point.distanceTo(OFFICE_GAME_MODE_LEFT_DOOR_WATCH) < 0.2
      || point.distanceTo(OFFICE_GAME_MODE_RIGHT_DOOR_WATCH) < 0.2;
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

      return Math.min(6, routeLength - 1);
    }

    return (reachedRouteIndex + 1) % routeLength;
  }

  private getOfficeGameModeMaxOffstage(): number {
    if (this.officePlayerVoiceLevel >= OFFICE_STAGE_YELL_LEVEL) {
      return 4;
    }

    const base = this.officeGameModeDifficulty === 'easy' ? 2 : 3;
    const nightBonus = this.officeGameModeNight >= 3 ? 1 : 0;
    const pressureBonus = this.getOfficeGameModeNightPhaseProgress() > 0.42 ? 1 : 0;
    return MathUtils.clamp(base + nightBonus + pressureBonus, 2, 4);
  }

  private shouldOfficeGameModeAnimatronicLeaveStage(animatronic: OfficeGameModeAnimatronicState, canSeePlayer: boolean): boolean {
    if (animatronic.animatronic === 'bori') {
      const nightPressure = this.getOfficeGameModeNightPressure();
      const difficultyBonus = this.officeGameModeDifficulty === 'hard'
        ? 0.12
        : this.officeGameModeDifficulty === 'easy'
          ? -0.03
          : 0;
      const chance = MathUtils.clamp(
        0.34 + OFFICE_BORI_STAGE_WANDER_CHANCE + nightPressure * 0.26 + this.getOfficeGameModeNightPhaseProgress() * 0.2 + difficultyBonus,
        0.18,
        0.9,
      );
      return Math.random() < chance;
    }

    const nightChance = [0.58, 0.68, 0.78, 0.88, 0.96][MathUtils.clamp(this.officeGameModeNight - 1, 0, 4)] ?? 0.78;
    const nightClockBonus = this.getOfficeGameModeNightPhaseProgress() * 0.16;
    const difficultyChance = this.officeGameModeDifficulty === 'hard'
      ? 0.08
      : this.officeGameModeDifficulty === 'easy'
        ? -0.12
        : 0;
    const animalChance = animatronic.animatronic === 'foxy'
      ? -0.18
      : animatronic.animatronic === 'quacky'
        ? 0.08
        : animatronic.animatronic === 'fluffle'
          ? 0.1
        : 0;
    const playerSeenBonus = canSeePlayer && this.officeGameModeNight >= 3 ? 0.12 : 0;
    const chance = MathUtils.clamp(difficultyChance + nightChance + nightClockBonus + animalChance + playerSeenBonus, 0, 0.98);
    return Math.random() < chance;
  }

  private getOfficeGameModeNightPhaseProgress(): number {
    if (!this.officeGameModeActive || !this.officeGameModeNightPhase) {
      return 0;
    }

    return MathUtils.clamp(this.officeGameModePhaseTime / OFFICE_GAME_MODE_NIGHT_SECONDS, 0, 1);
  }

  private getOfficeGameModeNightPressure(): number {
    return MathUtils.clamp((this.officeGameModeNight - 1) / Math.max(1, OFFICE_GAME_MODE_TOTAL_NIGHTS - 1), 0, 1);
  }

  private getOfficeGameModeDetectionRange(config: OfficeGameModeConfig): number {
    const nightMultiplier = [0.48, 0.72, 1, 1.28, 1.62][MathUtils.clamp(this.officeGameModeNight - 1, 0, 4)] ?? 1;
    const nightClockMultiplier = 1 + this.getOfficeGameModeNightPhaseProgress() * 0.36;
    const powerOutMultiplier = this.officeGameModePowerOut ? 1.18 : 1;
    return config.detectionRange * nightMultiplier * nightClockMultiplier * powerOutMultiplier;
  }

  private getOfficeGameModeNoiseRange(): number {
    const nightPressure = this.getOfficeGameModeNightPressure();
    const clockPressure = this.getOfficeGameModeNightPhaseProgress();
    const difficultyBonus = this.officeGameModeDifficulty === 'hard'
      ? 3.2
      : this.officeGameModeDifficulty === 'easy'
        ? -1.6
        : 0;
    return MathUtils.lerp(7.2, 18.5, nightPressure * 0.62 + clockPressure * 0.38) + difficultyBonus;
  }

  private getOfficeGameModeVoiceNoiseRange(baseRange: number): number {
    if (this.officePlayerVoiceLevel < OFFICE_VOICE_HEAR_MIN_LEVEL) {
      return baseRange;
    }

    const voiceStrength = MathUtils.clamp(this.officePlayerVoiceLevel / 0.62, 0, 1);
    return baseRange * MathUtils.lerp(
      OFFICE_VOICE_RANGE_MIN_MULTIPLIER,
      OFFICE_VOICE_RANGE_MAX_MULTIPLIER,
      voiceStrength,
    );
  }

  private needsOfficeStageVoiceRelease(animatronic: OfficeJumpscareAnimatronic): boolean {
    return animatronic === 'quacky' || animatronic === 'fluffle';
  }

  private shouldOfficeStageNoiseRelease(animatronic: OfficeGameModeAnimatronicState, noiseResponse: OfficeGameModeNoiseResponse): boolean {
    if (this.officePlayerVoiceLevel >= OFFICE_STAGE_YELL_LEVEL && noiseResponse === 'rush') {
      if (this.officeStageYellReleaseAllowed === null) {
        this.officeStageYellReleaseAllowed = Math.random() < OFFICE_STAGE_YELL_RELEASE_CHANCE;
      }

      if (!this.officeStageYellReleaseAllowed) {
        return false;
      }

      if (this.officeStageVoiceReleaseCooldown > 0) {
        return false;
      }

      return true;
    }

    return !this.needsOfficeStageVoiceRelease(animatronic.animatronic);
  }

  private isOfficeVoiceYellHeardAt(animatronicPosition: Vector3): boolean {
    if (this.officePlayerVoiceLevel < OFFICE_STAGE_YELL_LEVEL) {
      return false;
    }

    return animatronicPosition.distanceTo(this.officePlayerNoisePosition) <= OFFICE_YELL_ATTRACT_RANGE;
  }

  private markOfficeStageVoiceRelease(animatronic: OfficeJumpscareAnimatronic): void {
    if (this.needsOfficeStageVoiceRelease(animatronic)) {
      this.officeStageVoiceReleaseCooldown = OFFICE_STAGE_VOICE_RELEASE_COOLDOWN;
    }
    if (this.officePlayerVoiceLevel >= OFFICE_STAGE_YELL_LEVEL) {
      this.officeStageYellReleaseAllowed = false;
    }
  }

  private clearOfficeAnimatronicChaseTimers(animatronic: OfficeGameModeAnimatronicState, clearInsultCharge = false): void {
    animatronic.chaseGiveUpTimer = 0;
    animatronic.insultStareTimer = 0;
    if (clearInsultCharge) {
      animatronic.insultChargeTimer = 0;
      animatronic.insultCooldown = 0;
    }
  }

  private startOfficeGameModeAnimatronicChase(
    animatronic: OfficeGameModeAnimatronicState,
    target: Vector3,
    state: 'chase' | 'rush' = 'chase',
  ): void {
    animatronic.state = state;
    animatronic.offBalanceTimer = 0;
    animatronic.foxyLeapTimer = 0;
    animatronic.lastKnownPlayerPosition.copy(target);
    animatronic.waitTimer = 0;
    animatronic.lostSightTimer = 0;
    animatronic.progressStallTimer = 0;
    animatronic.stuckTimer = 0;
    animatronic.detourTarget = null;
    animatronic.detourTimer = 0;
    animatronic.distractionTarget = null;
    animatronic.chaseCommitTimer = 0;
    animatronic.chaseCommitCooldown = OFFICE_GAME_MODE_CHASE_COMMIT_COOLDOWN;
    animatronic.senseTimer = 0;
    animatronic.cachedCanSeePlayer = false;
    animatronic.cachedNoiseResponse = state === 'rush' ? 'rush' : 'investigate';
    animatronic.cachedBlockedDoorId = null;
    animatronic.chaseGiveUpTimer = 0;
    animatronic.calmProximityTimer = 0;
  }

  private makeOfficeGameModeAnimatronicGiveUp(animatronic: OfficeGameModeAnimatronicState): void {
    animatronic.state = 'retreat';
    animatronic.offBalanceTimer = 0;
    animatronic.foxyLeapTimer = 0;
    animatronic.routeIndex = 0;
    animatronic.waitTimer = 0.18;
    animatronic.lostSightTimer = 0;
    animatronic.stuckTimer = 0;
    animatronic.progressStallTimer = 0;
    animatronic.detourTarget = null;
    animatronic.detourTimer = 0;
    animatronic.distractionTarget = null;
    animatronic.chaseCommitTimer = 0;
    animatronic.chaseCommitCooldown = OFFICE_GAME_MODE_CHASE_COMMIT_COOLDOWN;
    animatronic.senseTimer = 0;
    animatronic.cachedCanSeePlayer = false;
    animatronic.cachedNoiseResponse = 'none';
    animatronic.cachedBlockedDoorId = null;
    animatronic.chaseGiveUpTimer = 0;
    animatronic.calmProximityTimer = 0;
    this.pushStatus(`${animatronic.label} gives up the chase and walks away.`, 2.2);
  }

  private canOfficeGameModeAnimatronicForceOfficeDoor(animatronic: OfficeGameModeAnimatronicState): boolean {
    return animatronic.animatronic === 'bori';
  }

  private updateOfficeGameModeCalmProximity(
    animatronic: OfficeGameModeAnimatronicState,
    deltaSeconds: number,
    playerPosition: Vector3,
    canSeePlayer: boolean,
  ): boolean {
    const canChillNearby = animatronic.state === 'stage' || animatronic.state === 'wander' || animatronic.state === 'calm-watch';
    const tooLoud = this.officePlayerVoiceLevel >= OFFICE_STAGE_YELL_LEVEL || this.officeInsultHeardTimer > 0;
    const distance = Math.hypot(
      animatronic.model.root.position.x - playerPosition.x,
      animatronic.model.root.position.z - playerPosition.z,
    );
    const nearby = distance <= OFFICE_CALM_PROXIMITY_RANGE || (canSeePlayer && distance <= OFFICE_CALM_PROXIMITY_RANGE + 1.4);
    if (!canChillNearby || tooLoud || !nearby) {
      animatronic.calmProximityTimer = 0;
      return false;
    }

    animatronic.calmProximityTimer += deltaSeconds;
    if (animatronic.calmProximityTimer < OFFICE_CALM_PROXIMITY_CHASE_SECONDS) {
      return false;
    }

    animatronic.calmProximityTimer = 0;
    const wasOnStage = animatronic.state === 'stage';
    if (wasOnStage) {
      this.sendOfficeGameModeAnimatronicOffStage(animatronic);
    }
    this.startOfficeGameModeAnimatronicChase(animatronic, playerPosition, 'chase');
    this.pushStatus(`${animatronic.label} tolerated you standing nearby for a while, then finally starts chasing.`, 2.8);
    return wasOnStage;
  }

  private canOfficeGameModeAnimatronicCalmWatch(
    animatronic: OfficeGameModeAnimatronicState,
    canSeePlayer: boolean,
    deltaSeconds: number,
    distanceToPlayer: number,
  ): boolean {
    if (
      !canSeePlayer
      || animatronic.state !== 'wander'
      || animatronic.attackCooldown > 0
      || this.officeInsultHeardTimer > 0
      || this.officePlayerVoiceLevel > OFFICE_CALM_WATCH_MAX_VOICE_LEVEL
      || this.officePlayerNoiseLevel > OFFICE_CALM_WATCH_MAX_NOISE_LEVEL
      || distanceToPlayer > this.getOfficeGameModeDetectionRange(this.getOfficeGameModeConfig()) * 0.72
    ) {
      return false;
    }

    return Math.random() < OFFICE_CALM_WATCH_CHANCE_PER_SECOND * deltaSeconds;
  }

  private startOfficeGameModeAnimatronicCalmWatch(animatronic: OfficeGameModeAnimatronicState): void {
    animatronic.state = 'calm-watch';
    animatronic.waitTimer = MathUtils.lerp(OFFICE_CALM_WATCH_MIN_SECONDS, OFFICE_CALM_WATCH_MAX_SECONDS, Math.random());
    animatronic.attackCooldown = Math.max(animatronic.attackCooldown, animatronic.waitTimer + 0.45);
    animatronic.lostSightTimer = 0;
    animatronic.progressStallTimer = 0;
    animatronic.stuckTimer = 0;
    animatronic.detourTarget = null;
    animatronic.detourTimer = 0;
    animatronic.distractionTarget = null;
    animatronic.chaseCommitTimer = 0;
    animatronic.chaseCommitCooldown = OFFICE_GAME_MODE_CHASE_COMMIT_COOLDOWN;
    animatronic.senseTimer = 0.25;
    animatronic.cachedNoiseResponse = 'none';
    this.pushStatus(`${animatronic.label} notices you, but just watches for now. Stay quiet.`, 2.4);
  }

  private updateOfficeGameModeAnimatronicCalmWatch(
    animatronic: OfficeGameModeAnimatronicState,
    deltaSeconds: number,
    playerPosition: Vector3,
  ): void {
    const root = animatronic.model.root;
    const dx = playerPosition.x - root.position.x;
    const dz = playerPosition.z - root.position.z;
    if (Math.hypot(dx, dz) > 0.01) {
      root.rotation.y = MathUtils.lerp(root.rotation.y, Math.atan2(dx, dz), 0.22);
    }

    const startled = this.officeInsultHeardTimer > 0 || this.officePlayerVoiceLevel >= OFFICE_STAGE_YELL_LEVEL;
    if (startled) {
      this.startOfficeGameModeAnimatronicChase(animatronic, playerPosition, 'rush');
      this.pushStatus(`${animatronic.label} stops watching and charges at the noise.`, 2.2);
      return;
    }

    animatronic.waitTimer = Math.max(0, animatronic.waitTimer - deltaSeconds);
    root.position.y = this.getOfficeGameModeAnimatronicFloorY(animatronic.animatronic, root.position.x, root.position.z);
    root.rotation.x = MathUtils.lerp(root.rotation.x, 0.02, 0.24);
    root.rotation.z = MathUtils.lerp(root.rotation.z, Math.sin(this.elapsed * 2.4 + animatronic.walkCyclePhase) * 0.018, 0.2);
    animatronic.model.head.rotation.x = MathUtils.lerp(animatronic.model.head.rotation.x, 0.1, 0.2);
    animatronic.model.head.rotation.y = Math.sin(this.elapsed * 2.8 + animatronic.walkCyclePhase) * 0.08;
    animatronic.model.leftArm.rotation.x = MathUtils.lerp(animatronic.model.leftArm.rotation.x, -0.16, 0.18);
    animatronic.model.rightArm.rotation.x = MathUtils.lerp(animatronic.model.rightArm.rotation.x, -0.16, 0.18);
    animatronic.model.leftArm.rotation.z = MathUtils.lerp(animatronic.model.leftArm.rotation.z, -0.36, 0.18);
    animatronic.model.rightArm.rotation.z = MathUtils.lerp(animatronic.model.rightArm.rotation.z, 0.36, 0.18);
    if (animatronic.waitTimer > 0) {
      return;
    }

    animatronic.state = 'wander';
    animatronic.waitTimer = 0.8;
    animatronic.cachedCanSeePlayer = false;
    animatronic.cachedNoiseResponse = 'none';
    animatronic.senseTimer = OFFICE_GAME_MODE_WANDER_SENSE_INTERVAL;
  }

  private startOfficeGameModeAnimatronicOffBalance(
    animatronic: OfficeGameModeAnimatronicState,
    playerPosition: Vector3,
  ): void {
    animatronic.jukeCount += 1;
    if (animatronic.jukeCount > OFFICE_ANIMATRONIC_JUKE_GIVE_UP_THRESHOLD) {
      if (!this.playMicrophoneSoundEffect(() => this.gameplaySfxAudio.playOfficeJumpscareCue('ear-snap'), OFFICE_ANIMATRONIC_JUKE_GIVE_UP_RECORDING_ID)) {
        this.gameplaySfxAudio.playOfficeJumpscareCue('ear-snap');
      }
      this.makeOfficeGameModeAnimatronicGiveUp(animatronic);
      this.pushStatus(`${animatronic.label} got duped too many times and walks away.`, 2.4);
      return;
    }

    animatronic.state = 'off-balance';
    animatronic.offBalanceTimer = OFFICE_ANIMATRONIC_JUKE_STUMBLE_SECONDS;
    animatronic.waitTimer = 0;
    animatronic.attackCooldown = Math.max(animatronic.attackCooldown, OFFICE_ANIMATRONIC_JUKE_STUMBLE_SECONDS + 0.25);
    animatronic.lastKnownPlayerPosition.copy(playerPosition);
    animatronic.chaseCommitTimer = 0;
    animatronic.chaseCommitCooldown = OFFICE_GAME_MODE_CHASE_COMMIT_COOLDOWN;
    animatronic.lostSightTimer = 0;
    animatronic.progressStallTimer = 0;
    animatronic.stuckTimer = 0;
    animatronic.detourTarget = null;
    animatronic.detourTimer = 0;
    animatronic.distractionTarget = null;
    animatronic.senseTimer = 0;
    animatronic.cachedCanSeePlayer = false;
    animatronic.cachedNoiseResponse = 'none';
    this.pushStatus(`${animatronic.label} stumbles off balance after the last-second dodge.`, 1.9);
  }

  private updateOfficeGameModeAnimatronicOffBalance(
    animatronic: OfficeGameModeAnimatronicState,
    deltaSeconds: number,
    playerPosition: Vector3,
  ): void {
    animatronic.offBalanceTimer = Math.max(0, animatronic.offBalanceTimer - deltaSeconds);
    const root = animatronic.model.root;
    const wobble = this.elapsed * 18 + animatronic.walkCyclePhase;
    const remainingRatio = MathUtils.clamp(animatronic.offBalanceTimer / OFFICE_ANIMATRONIC_JUKE_STUMBLE_SECONDS, 0, 1);
    const flail = MathUtils.smoothstep(remainingRatio, 0, 1);
    const dx = playerPosition.x - root.position.x;
    const dz = playerPosition.z - root.position.z;

    if (Math.hypot(dx, dz) > 0.01) {
      root.rotation.y = MathUtils.lerp(root.rotation.y, Math.atan2(dx, dz), 0.18);
    }
    root.position.y = this.getOfficeGameModeAnimatronicFloorY(animatronic.animatronic, root.position.x, root.position.z);
    root.rotation.x = MathUtils.lerp(root.rotation.x, -0.12 + Math.sin(wobble * 0.6) * 0.09 * flail, 0.36);
    root.rotation.z = MathUtils.lerp(root.rotation.z, Math.sin(wobble * 0.74) * 0.32 * flail, 0.42);
    animatronic.model.head.rotation.x = Math.sin(wobble * 0.8) * 0.2 * flail;
    animatronic.model.head.rotation.y = Math.cos(wobble * 0.65) * 0.28 * flail;
    animatronic.model.leftArm.rotation.x = Math.sin(wobble) * 1.05 * flail - 0.28;
    animatronic.model.rightArm.rotation.x = Math.cos(wobble * 1.08) * 1.05 * flail - 0.28;
    animatronic.model.leftArm.rotation.z = -1.18 - Math.cos(wobble * 1.25) * 0.62 * flail;
    animatronic.model.rightArm.rotation.z = 1.18 + Math.sin(wobble * 1.2) * 0.62 * flail;
    animatronic.model.leftArmJoint.rotation.x = -0.42 - Math.sin(wobble * 1.3) * 0.45 * flail;
    animatronic.model.rightArmJoint.rotation.x = -0.42 + Math.cos(wobble * 1.35) * 0.45 * flail;
    animatronic.model.leftLeg.rotation.x = MathUtils.lerp(animatronic.model.leftLeg.rotation.x, -0.28, 0.32);
    animatronic.model.rightLeg.rotation.x = MathUtils.lerp(animatronic.model.rightLeg.rotation.x, 0.22, 0.32);
    animatronic.model.leftLegJoint.rotation.x = MathUtils.lerp(animatronic.model.leftLegJoint.rotation.x, 0.34, 0.32);
    animatronic.model.rightLegJoint.rotation.x = MathUtils.lerp(animatronic.model.rightLegJoint.rotation.x, 0.24, 0.32);

    if (animatronic.offBalanceTimer > 0) {
      return;
    }

    this.startOfficeGameModeAnimatronicChase(animatronic, playerPosition, 'chase');
    animatronic.attackCooldown = Math.max(animatronic.attackCooldown, 0.45);
  }

  private startOfficeFoxyLeapAttack(
    animatronic: OfficeGameModeAnimatronicState,
    playerPosition: Vector3,
  ): void {
    const root = animatronic.model.root;
    const dx = playerPosition.x - root.position.x;
    const dz = playerPosition.z - root.position.z;
    const distance = Math.max(0.001, Math.hypot(dx, dz));
    const leapDistance = Math.min(distance + 0.7, 5.2);
    const targetX = root.position.x + (dx / distance) * leapDistance;
    const targetZ = root.position.z + (dz / distance) * leapDistance;

    animatronic.state = 'foxy-leap';
    animatronic.foxyLeapTimer = 0;
    animatronic.foxyLeapStartPosition.copy(root.position);
    animatronic.foxyLeapTargetPosition.set(
      targetX,
      this.getOfficeGameModeAnimatronicFloorY('foxy', targetX, targetZ),
      targetZ,
    );
    animatronic.lastKnownPlayerPosition.copy(playerPosition);
    animatronic.waitTimer = 0;
    animatronic.attackCooldown = OFFICE_FOXY_LEAP_SECONDS + 0.9;
    animatronic.chaseCommitTimer = 0;
    animatronic.chaseCommitCooldown = OFFICE_GAME_MODE_CHASE_COMMIT_COOLDOWN;
    animatronic.lostSightTimer = 0;
    animatronic.progressStallTimer = 0;
    animatronic.stuckTimer = 0;
    animatronic.detourTarget = null;
    animatronic.detourTimer = 0;
    animatronic.distractionTarget = null;
    animatronic.senseTimer = 0;
    animatronic.cachedCanSeePlayer = false;
    animatronic.cachedNoiseResponse = 'none';
    this.pushStatus('Foxy launches forward and crashes down before pushing himself back up.', 2.2);
  }

  private updateOfficeFoxyLeapAttack(
    animatronic: OfficeGameModeAnimatronicState,
    deltaSeconds: number,
    playerPosition: Vector3,
  ): void {
    animatronic.foxyLeapTimer = Math.min(OFFICE_FOXY_LEAP_SECONDS, animatronic.foxyLeapTimer + deltaSeconds);
    const progress = MathUtils.clamp(animatronic.foxyLeapTimer / OFFICE_FOXY_LEAP_SECONDS, 0, 1);
    const flight = MathUtils.smoothstep(progress, 0, 0.46);
    const impact = MathUtils.smoothstep(progress, 0.38, 0.58);
    const pushUp = MathUtils.smoothstep(progress, 0.66, 1);
    const root = animatronic.model.root;
    const leapX = MathUtils.lerp(animatronic.foxyLeapStartPosition.x, animatronic.foxyLeapTargetPosition.x, flight);
    const leapZ = MathUtils.lerp(animatronic.foxyLeapStartPosition.z, animatronic.foxyLeapTargetPosition.z, flight);
    const floorY = this.getOfficeGameModeAnimatronicFloorY('foxy', leapX, leapZ);
    const arc = Math.sin(flight * Math.PI) * 0.72 * (1 - impact * 0.35);

    root.visible = true;
    root.position.set(leapX, floorY + arc, leapZ);
    const faceX = playerPosition.x - root.position.x;
    const faceZ = playerPosition.z - root.position.z;
    if (Math.hypot(faceX, faceZ) > 0.01) {
      root.rotation.y = Math.atan2(faceX, faceZ);
    }
    root.rotation.x = MathUtils.lerp(0.34, -1.3, impact) + pushUp * 1.18;
    root.rotation.z = Math.sin(this.elapsed * 19) * 0.045 * (1 - pushUp);
    animatronic.model.head.rotation.x = MathUtils.lerp(-0.15, 0.72, impact) - pushUp * 0.5;
    animatronic.model.head.rotation.y = Math.sin(this.elapsed * 12) * 0.08 * (1 - pushUp);
    animatronic.model.leftArm.rotation.x = MathUtils.lerp(-1.55, -1.82, impact) + pushUp * 0.38;
    animatronic.model.rightArm.rotation.x = MathUtils.lerp(-1.55, -1.82, impact) + pushUp * 0.38;
    animatronic.model.leftArm.rotation.z = MathUtils.lerp(0.92, 0.22, impact) + pushUp * 0.52;
    animatronic.model.rightArm.rotation.z = MathUtils.lerp(-0.92, -0.22, impact) - pushUp * 0.52;
    animatronic.model.leftArmJoint.rotation.x = MathUtils.lerp(-0.2, -0.78, impact) + pushUp * 0.44;
    animatronic.model.rightArmJoint.rotation.x = MathUtils.lerp(-0.2, -0.78, impact) + pushUp * 0.44;
    animatronic.model.leftLeg.rotation.x = MathUtils.lerp(0.54, -0.32, impact) + pushUp * 0.2;
    animatronic.model.rightLeg.rotation.x = MathUtils.lerp(0.54, -0.28, impact) + pushUp * 0.2;
    animatronic.model.leftLegJoint.rotation.x = MathUtils.lerp(0.2, 0.52, impact) - pushUp * 0.24;
    animatronic.model.rightLegJoint.rotation.x = MathUtils.lerp(0.2, 0.52, impact) - pushUp * 0.24;

    if (progress < 1) {
      return;
    }

    root.rotation.x = 0;
    root.rotation.z = 0;
    animatronic.foxyLeapTimer = 0;
    this.startOfficeGameModeAnimatronicChase(animatronic, playerPosition, 'chase');
    animatronic.attackCooldown = Math.max(animatronic.attackCooldown, 0.65);
  }

  private startOfficeInsultRevenge(animatronic: OfficeGameModeAnimatronicState): void {
    if (animatronic.insultCooldown > 0 || animatronic.insultChargeTimer > 0 || animatronic.insultStareTimer > 0) {
      return;
    }

    animatronic.state = 'chase';
    animatronic.lastKnownPlayerPosition.copy(this.player.getPosition());
    animatronic.waitTimer = 0;
    animatronic.lostSightTimer = 0;
    animatronic.progressStallTimer = 0;
    animatronic.stuckTimer = 0;
    animatronic.detourTarget = null;
    animatronic.detourTimer = 0;
    animatronic.distractionTarget = null;
    animatronic.chaseCommitTimer = 0;
    animatronic.chaseCommitCooldown = OFFICE_GAME_MODE_CHASE_COMMIT_COOLDOWN;
    animatronic.insultStareTimer = OFFICE_INSULT_STARE_SECONDS;
    animatronic.insultChargeTimer = 0;
    animatronic.insultCooldown = OFFICE_INSULT_COOLDOWN_SECONDS;
    this.pushStatus(`${animatronic.label} heard that. Their eyes flicker, and they turn back toward you.`, 3);
  }

  private updateOfficeInsultEyeFlicker(animatronic: OfficeGameModeAnimatronicState): void {
    const flickering = animatronic.insultStareTimer > 0;
    const eyeColor = new Color(0xff2118);
    animatronic.model.root.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (!(material instanceof MeshBasicMaterial || material instanceof MeshStandardMaterial) || !material.userData.officeCutsceneEye) {
          return;
        }

        if (material.userData.officeInsultBaseColor === undefined) {
          material.userData.officeInsultBaseColor = material.color.getHex();
        }
        if (material instanceof MeshStandardMaterial && material.userData.officeInsultBaseEmissive === undefined) {
          material.userData.officeInsultBaseEmissive = material.emissive.getHex();
          material.userData.officeInsultBaseEmissiveIntensity = material.emissiveIntensity;
        }

        if (flickering) {
          const pulse = Math.sin(this.elapsed * 34) > 0 ? 1 : 0.2;
          material.color.copy(eyeColor);
          if (material instanceof MeshStandardMaterial) {
            material.emissive.copy(eyeColor);
            material.emissiveIntensity = 0.34 + pulse * 1.8;
          }
          return;
        }

        if (typeof material.userData.officeInsultBaseColor === 'number') {
          material.color.setHex(material.userData.officeInsultBaseColor);
          delete material.userData.officeInsultBaseColor;
        }
        if (
          material instanceof MeshStandardMaterial
          && typeof material.userData.officeInsultBaseEmissive === 'number'
          && typeof material.userData.officeInsultBaseEmissiveIntensity === 'number'
        ) {
          material.emissive.setHex(material.userData.officeInsultBaseEmissive);
          material.emissiveIntensity = material.userData.officeInsultBaseEmissiveIntensity;
          delete material.userData.officeInsultBaseEmissive;
          delete material.userData.officeInsultBaseEmissiveIntensity;
        }
      });
    });
  }

  private getOfficeGameModeNoiseResponse(
    animatronic: OfficeGameModeAnimatronicState,
    animatronicPosition: Vector3,
  ): OfficeGameModeNoiseResponse {
    const voiceActive = this.officePlayerVoiceLevel >= OFFICE_VOICE_HEAR_MIN_LEVEL;
    if (
      !this.officeGameModeActive
      || this.officeGameModePowerOut
      || (!voiceActive && this.officePlayerNoiseLevel < 0.03)
    ) {
      return 'none';
    }

    const range = this.getOfficeGameModeNoiseRange();
    const voiceRange = this.getOfficeGameModeVoiceNoiseRange(range);
    const yellingByVolume = this.officePlayerVoiceLevel >= OFFICE_STAGE_YELL_LEVEL;
    const effectiveRange = voiceActive
      ? Math.max(range, voiceRange, yellingByVolume ? OFFICE_YELL_ATTRACT_RANGE : 0)
      : range;
    const distance = animatronicPosition.distanceTo(this.officePlayerNoisePosition);
    if (distance > effectiveRange) {
      return 'none';
    }

    if (this.isOfficeVoiceYellHeardAt(animatronicPosition)) {
      return animatronic.state === 'stage' || Math.random() < OFFICE_STAGE_YELL_RELEASE_CHANCE
        ? 'rush'
        : 'investigate';
    }

    if (animatronic.animatronic === 'bori') {
      return 'none';
    }

    const distanceFalloff = MathUtils.clamp(1 - distance / Math.max(0.1, range), 0, 1);
    const voiceDistanceFalloff = MathUtils.clamp(1 - distance / Math.max(0.1, voiceRange), 0, 1);
    const movementHeardLevel = this.officePlayerNoiseLevel * (0.48 + distanceFalloff * 0.82);
    const voiceHeardLevel = voiceActive
      ? MathUtils.clamp(this.officePlayerVoiceLevel * OFFICE_VOICE_NOISE_MULTIPLIER, 0, 1)
        * (0.34 + voiceDistanceFalloff * 0.92)
      : 0;
    const heardLevel = Math.max(movementHeardLevel, voiceHeardLevel);
    const yelling = yellingByVolume && distance <= range * OFFICE_VOICE_YELL_RANGE_MULTIPLIER;
    if (yelling || heardLevel >= (voiceActive ? OFFICE_VOICE_RUSH_THRESHOLD : OFFICE_NOISE_RUSH_THRESHOLD)) {
      return 'rush';
    }

    return heardLevel >= (voiceActive ? OFFICE_VOICE_INVESTIGATE_THRESHOLD : OFFICE_NOISE_INVESTIGATE_THRESHOLD)
      ? 'investigate'
      : 'none';
  }

  private applyOfficeGameModeSeparation(
    animatronic: OfficeGameModeAnimatronicState,
    desiredTarget: Vector3,
  ): Vector3 {
    if (animatronic.state !== 'chase' && animatronic.state !== 'rush' && animatronic.state !== 'creep' && animatronic.state !== 'distracted') {
      return desiredTarget;
    }

    const root = animatronic.model.root;
    let separationX = 0;
    let separationZ = 0;
    for (const other of this.officeGameModeAnimatronics) {
      if (
        other === animatronic
        || (other.state !== 'chase' && other.state !== 'rush' && other.state !== 'creep' && other.state !== 'distracted')
        || !other.model.root.visible
      ) {
        continue;
      }

      const dx = root.position.x - other.model.root.position.x;
      const dz = root.position.z - other.model.root.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance <= 0.001 || distance >= OFFICE_GAME_MODE_SEPARATION_RADIUS) {
        continue;
      }

      const strength = (1 - distance / OFFICE_GAME_MODE_SEPARATION_RADIUS) * OFFICE_GAME_MODE_SEPARATION_STRENGTH;
      separationX += dx / distance * strength;
      separationZ += dz / distance * strength;
    }

    if (separationX === 0 && separationZ === 0) {
      return desiredTarget;
    }

    return new Vector3(
      desiredTarget.x + separationX,
      desiredTarget.y,
      desiredTarget.z + separationZ,
    );
  }

  private getOfficeGameModeSpeedMultiplier(): number {
    return 1 + this.getOfficeGameModeNightPressure() * 0.18 + this.getOfficeGameModeNightPhaseProgress() * 0.08;
  }

  private getNearestOfficeVentPoint(position: Vector3): Vector3 {
    const ventSystem = this.officeChapter.ventSystem;
    let bestX = ventSystem.ladderEntryPosition.x;
    let bestZ = ventSystem.ladderEntryPosition.z;
    let bestDistance = Infinity;

    for (const segment of ventSystem.segments) {
      const minX = segment.center.x - segment.halfWidth + OFFICE_GAME_MODE_COLLISION_RADIUS * 0.2;
      const maxX = segment.center.x + segment.halfWidth - OFFICE_GAME_MODE_COLLISION_RADIUS * 0.2;
      const minZ = segment.center.z - segment.halfDepth + OFFICE_GAME_MODE_COLLISION_RADIUS * 0.2;
      const maxZ = segment.center.z + segment.halfDepth - OFFICE_GAME_MODE_COLLISION_RADIUS * 0.2;
      const clampedX = MathUtils.clamp(position.x, minX, maxX);
      const clampedZ = MathUtils.clamp(position.z, minZ, maxZ);
      const distance = Math.hypot(position.x - clampedX, position.z - clampedZ);
      if (distance >= bestDistance) {
        continue;
      }

      bestDistance = distance;
      bestX = clampedX;
      bestZ = clampedZ;
    }

    return new Vector3(bestX, ventSystem.floorY, bestZ);
  }

  private clearOfficePendingVentChase(): void {
    this.officeVentChasePendingTimer = 0;
    this.officeVentChasePendingAnimatronic = null;
  }

  private scheduleOfficeAnimatronicVentChase(): void {
    this.clearOfficePendingVentChase();
    if (!this.officeGameModeActive || Math.random() >= OFFICE_VENT_CHASE_CHANCE) {
      return;
    }

    const playerPosition = this.player.getPosition();
    const candidates = this.officeGameModeAnimatronics
      .filter((animatronic) => (
        animatronic.model.root.visible
        && (animatronic.state === 'chase' || animatronic.state === 'rush' || animatronic.state === 'creep')
      ))
      .sort((a, b) => (
        a.model.root.position.distanceTo(playerPosition) - b.model.root.position.distanceTo(playerPosition)
      ));
    const animatronic = candidates[0];
    if (!animatronic) {
      return;
    }

    this.officeVentChasePendingTimer = OFFICE_VENT_CHASE_DELAY_SECONDS;
    this.officeVentChasePendingAnimatronic = animatronic;
    this.pushStatus('You hear metal climbing below the ladder. You have five seconds before something reaches the vent.', 3.2);
  }

  private updateOfficePendingVentChase(deltaSeconds: number): void {
    if (this.officeVentChasePendingTimer <= 0) {
      return;
    }

    if (!this.officeVentActive || this.officeVentDrop || !this.officeGameModeActive || this.activeOfficeJumpscare) {
      this.clearOfficePendingVentChase();
      return;
    }

    this.officeVentChasePendingTimer = Math.max(0, this.officeVentChasePendingTimer - deltaSeconds);
    if (this.officeVentChasePendingTimer > 0) {
      return;
    }

    const animatronic = this.officeVentChasePendingAnimatronic;
    this.officeVentChasePendingAnimatronic = null;
    if (!animatronic || !animatronic.model.root.visible || animatronic.state === 'stage' || animatronic.state === 'vent-chase') {
      return;
    }

    this.startOfficeAnimatronicVentChase(animatronic);
  }

  private startOfficeAnimatronicVentChase(animatronic: OfficeGameModeAnimatronicState): void {
    const entry = this.getNearestOfficeVentPoint(this.officeChapter.ventSystem.ladderEntryPosition);
    animatronic.state = 'vent-chase';
    animatronic.model.root.visible = true;
    animatronic.model.root.position.copy(entry);
    animatronic.model.root.scale.setScalar(OFFICE_GAME_MODE_ANIMATRONIC_SCALE[animatronic.animatronic] * 0.72);
    animatronic.routeIndex = 0;
    animatronic.waitTimer = 0;
    animatronic.offBalanceTimer = 0;
    animatronic.foxyLeapTimer = 0;
    animatronic.doorBreachTimer = 0;
    animatronic.doorBreachDoorId = null;
    animatronic.doorLingerSoundPlayed = false;
    animatronic.doorLingerLaughPlayed = false;
    animatronic.lostSightTimer = 0;
    animatronic.progressStallTimer = 0;
    animatronic.stuckTimer = 0;
    animatronic.detourTarget = null;
    animatronic.detourTimer = 0;
    animatronic.distractionTarget = null;
    animatronic.chaseCommitTimer = 0;
    animatronic.chaseCommitCooldown = OFFICE_GAME_MODE_CHASE_COMMIT_COOLDOWN;
    animatronic.cachedCanSeePlayer = false;
    animatronic.cachedNoiseResponse = 'none';
    animatronic.cachedBlockedDoorId = null;
    this.officeChapter.setStageAnimatronicPresent(animatronic.animatronic, false);
    this.pushStatus(`${animatronic.label} climbs through the ladder hatch and crawls after you.`, 2.4);
  }

  private updateOfficeGameModeVentChase(
    animatronic: OfficeGameModeAnimatronicState,
    deltaSeconds: number,
    playerPosition: Vector3,
  ): void {
    if (!this.officeVentActive || this.officeVentDrop) {
      animatronic.model.root.scale.setScalar(OFFICE_GAME_MODE_ANIMATRONIC_SCALE[animatronic.animatronic]);
      this.startOfficeGameModeAnimatronicChase(animatronic, playerPosition, 'chase');
      return;
    }

    const root = animatronic.model.root;
    const target = this.getNearestOfficeVentPoint(playerPosition);
    const dx = target.x - root.position.x;
    const dz = target.z - root.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 0.48) {
      const definition = this.getRandomOfficeJumpscareDefinition(animatronic.animatronic);
      if (definition && !this.activeOfficeJumpscare) {
        animatronic.attackCooldown = 5.2;
        this.startOfficeJumpscare(definition);
      }
      return;
    }

    const step = Math.min(distance, OFFICE_VENT_CHASE_SPEED * this.getOfficeGameModeSpeedMultiplier() * deltaSeconds);
    const directionX = dx / Math.max(0.001, distance);
    const directionZ = dz / Math.max(0.001, distance);
    root.position.x += directionX * step;
    root.position.z += directionZ * step;
    root.position.copy(this.getNearestOfficeVentPoint(root.position));
    root.scale.setScalar(OFFICE_GAME_MODE_ANIMATRONIC_SCALE[animatronic.animatronic] * 0.72);
    root.rotation.y = Math.atan2(directionX, directionZ);
    root.rotation.x = MathUtils.lerp(root.rotation.x, 1.22, 0.34);
    root.rotation.z = Math.sin(this.elapsed * 8.4 + animatronic.walkCyclePhase) * 0.08;

    const pullCycle = this.elapsed * 10.8 + animatronic.walkCyclePhase;
    const leftPull = Math.max(0, Math.sin(pullCycle));
    const rightPull = Math.max(0, Math.sin(pullCycle + Math.PI));
    animatronic.model.head.rotation.x = MathUtils.lerp(animatronic.model.head.rotation.x, -0.18 + Math.sin(pullCycle * 0.5) * 0.08, 0.3);
    animatronic.model.leftArm.rotation.set(-1.48 - leftPull * 0.42, 0.22, 0.92 - leftPull * 0.38);
    animatronic.model.rightArm.rotation.set(-1.48 - rightPull * 0.42, -0.22, -0.92 + rightPull * 0.38);
    animatronic.model.leftArmJoint.rotation.x = -0.34 - leftPull * 0.62;
    animatronic.model.rightArmJoint.rotation.x = -0.34 - rightPull * 0.62;
    animatronic.model.leftLeg.rotation.set(1.08 + rightPull * 0.18, -0.08, 0.42);
    animatronic.model.rightLeg.rotation.set(1.08 + leftPull * 0.18, 0.08, -0.42);
    animatronic.model.leftLegJoint.rotation.x = -0.92 + leftPull * 0.2;
    animatronic.model.rightLegJoint.rotation.x = -0.92 + rightPull * 0.2;
  }

  private updateOfficeQuackySeenJaw(animatronic: OfficeGameModeAnimatronicState, seesPlayer: boolean, deltaSeconds: number): void {
    if (animatronic.animatronic !== 'quacky') {
      return;
    }

    const scareActive = seesPlayer && (animatronic.state === 'chase' || animatronic.state === 'rush' || animatronic.state === 'creep');
    animatronic.quackyMouthScareTimer = scareActive
      ? Math.min(animatronic.quackyMouthScareTimer + deltaSeconds, 2)
      : Math.max(0, animatronic.quackyMouthScareTimer - deltaSeconds * 2.4);
    const beakOpen = MathUtils.smoothstep(animatronic.quackyMouthScareTimer, 0.02, 0.34);
    const innerOpen = MathUtils.smoothstep(animatronic.quackyMouthScareTimer, 0.24, 0.62);
    const snap = innerOpen * Math.max(0, Math.sin(this.elapsed * 13.5 + animatronic.walkCyclePhase));
    const jawTarget = -1.34 * beakOpen + snap * 0.08;
    animatronic.model.jaw.rotation.x = MathUtils.lerp(animatronic.model.jaw.rotation.x, jawTarget, scareActive ? 0.34 : 0.18);
    this.updateOfficeQuackyNestedJaws(animatronic.model.head, innerOpen, snap, 0.32);

    const innerJaw = animatronic.model.head.getObjectByName('quacky-inner-jaw');
    if (innerJaw) {
      innerJaw.rotation.x = MathUtils.lerp(
        innerJaw.rotation.x,
        Math.sin(this.elapsed * 9.5 + animatronic.walkCyclePhase) * 0.2 * innerOpen,
        0.32,
      );
      innerJaw.scale.setScalar(MathUtils.lerp(innerJaw.scale.x, 1 + innerOpen * 0.12, 0.22));
    }

    const tinyMetalJaw = animatronic.model.head.getObjectByName('quacky-tiny-metal-jaw');
    if (tinyMetalJaw) {
      tinyMetalJaw.rotation.x = MathUtils.lerp(tinyMetalJaw.rotation.x, (0.16 + snap * 0.42) * innerOpen, 0.38);
      tinyMetalJaw.position.y = MathUtils.lerp(tinyMetalJaw.position.y, -0.012 + snap * 0.018 * innerOpen, 0.32);
    }
  }

  private updateOfficeQuackyNestedJaws(head: Object3D, openAmount: number, snap: number, blend: number): void {
    const innerUpper = head.getObjectByName('quacky-inner-upper-jaw');
    const innerLower = head.getObjectByName('quacky-inner-lower-jaw');
    if (innerUpper) {
      innerUpper.rotation.x = MathUtils.lerp(innerUpper.rotation.x, -0.42 * openAmount, blend);
    }
    if (innerLower) {
      innerLower.rotation.x = MathUtils.lerp(innerLower.rotation.x, (0.48 + snap * 0.18) * openAmount, blend);
    }

    const metalUpper = head.getObjectByName('quacky-metal-upper-jaw');
    const metalLower = head.getObjectByName('quacky-metal-lower-jaw');
    if (metalUpper) {
      metalUpper.rotation.x = MathUtils.lerp(metalUpper.rotation.x, -0.28 * openAmount, blend);
    }
    if (metalLower) {
      metalLower.rotation.x = MathUtils.lerp(metalLower.rotation.x, (0.34 + snap * 0.34) * openAmount, blend);
    }
  }

  private updateOfficeAnimatronicMouthMotion(animatronic: OfficeGameModeAnimatronicState, seesPlayer: boolean): void {
    if (animatronic.animatronic === 'quacky' && seesPlayer) {
      return;
    }

    const activeChase = animatronic.state === 'chase' || animatronic.state === 'rush' || animatronic.state === 'creep';
    const idlePulse = Math.max(0, Math.sin(this.elapsed * 0.82 + animatronic.walkCyclePhase));
    const chatterPulse = Math.max(0, Math.sin(this.elapsed * (activeChase ? 8.5 : 4.2) + animatronic.walkCyclePhase * 1.7));
    const occasionalOpen = idlePulse > 0.82 ? MathUtils.smoothstep(idlePulse, 0.82, 1) : 0;
    const chaseOpen = activeChase ? chatterPulse * 0.42 : 0;
    const openAmount = Math.max(occasionalOpen, chaseOpen);
    const target = animatronic.animatronic === 'quacky'
      ? -0.55 * openAmount
      : 0.62 * openAmount;
    animatronic.model.jaw.rotation.x = MathUtils.lerp(animatronic.model.jaw.rotation.x, target, 0.16);
  }

  private isOfficePlayerNearDodgeThreat(): boolean {
    if (!this.officeChapterActive || !this.officeGameModeActive || this.officeGameModePowerOut) {
      return false;
    }

    const playerPosition = this.player.getPosition();
    return this.officeGameModeAnimatronics.some((animatronic) => {
      if (
        !animatronic.model.root.visible
        || (animatronic.state !== 'chase' && animatronic.state !== 'rush' && animatronic.state !== 'creep')
      ) {
        return false;
      }

      return Math.hypot(
        animatronic.model.root.position.x - playerPosition.x,
        animatronic.model.root.position.z - playerPosition.z,
      ) <= OFFICE_PLAYER_CLOSE_DODGE_RANGE;
    });
  }

  private getOfficePlayerMovementOptions(input: MovementState): PlayerMovementOptions {
    if (!this.officeChapterActive) {
      return {};
    }

    let strafeMultiplier = 1;
    if (input.strafe !== 0) {
      strafeMultiplier = input.sprint
        ? OFFICE_PLAYER_SPRINT_DODGE_STRAFE_MULTIPLIER
        : OFFICE_PLAYER_STRAFE_SPEED_MULTIPLIER;
      if (this.isOfficePlayerNearDodgeThreat()) {
        strafeMultiplier = OFFICE_PLAYER_CLOSE_DODGE_STRAFE_MULTIPLIER;
      }
    }

    return {
      sprintMultiplier: OFFICE_PLAYER_SPRINT_SPEED_MULTIPLIER,
      strafeMultiplier,
    };
  }

  private putOfficeGameModeAnimatronicOnStage(animatronic: OfficeGameModeAnimatronicState): void {
    this.restoreOfficePowerOutBoriEyeFlicker(animatronic.model.root);
    const start = animatronic.route[0] ?? this.getOfficeGameModeOfficeCenter();
    animatronic.model.root.position.set(
      start.x,
      this.getOfficeGameModeAnimatronicFloorY(animatronic.animatronic, start.x, start.z),
      start.z,
    );
    animatronic.model.root.visible = false;
    animatronic.model.root.scale.setScalar(OFFICE_GAME_MODE_ANIMATRONIC_SCALE[animatronic.animatronic]);
    this.officeChapter.setStageAnimatronicPresent(animatronic.animatronic, true);
    animatronic.state = 'stage';
    animatronic.offBalanceTimer = 0;
    animatronic.jukeCount = 0;
    animatronic.foxyLeapTimer = 0;
    animatronic.routeIndex = 1 % animatronic.route.length;
    animatronic.waitTimer = this.getOfficeGameModeStageDwellSeconds(animatronic.animatronic);
    animatronic.doorBreachTimer = 0;
    animatronic.doorBreachDoorId = null;
    animatronic.doorLingerSoundPlayed = false;
    animatronic.doorLingerLaughPlayed = false;
    animatronic.lostSightTimer = 0;
    animatronic.stuckTimer = 0;
    animatronic.progressStallTimer = 0;
    animatronic.detourTarget = null;
    animatronic.detourTimer = 0;
    animatronic.distractionTarget = null;
    animatronic.chaseCommitTimer = 0;
    animatronic.chaseCommitCooldown = 0;
    animatronic.calmProximityTimer = 0;
    this.clearOfficeAnimatronicChaseTimers(animatronic, true);
    animatronic.cameraStareTimer = 0;
    animatronic.cameraStareCooldown = 0;
    animatronic.cameraStareCameraId = null;
    animatronic.senseTimer = 0;
    animatronic.cachedCanSeePlayer = false;
    animatronic.cachedNoiseResponse = 'none';
    animatronic.cachedBlockedDoorId = null;
    animatronic.quackyMouthScareTimer = 0;
    animatronic.model.head.rotation.set(0, 0, 0);
    animatronic.model.jaw.rotation.set(0, 0, 0);
    const innerJaw = animatronic.model.head.getObjectByName('quacky-inner-jaw');
    if (innerJaw) {
      innerJaw.rotation.set(0, 0, 0);
      innerJaw.scale.set(1, 1, 1);
    }
    this.updateOfficeQuackyNestedJaws(animatronic.model.head, 0, 0, 1);
    const tinyMetalJaw = animatronic.model.head.getObjectByName('quacky-tiny-metal-jaw');
    if (tinyMetalJaw) {
      tinyMetalJaw.rotation.set(0, 0, 0);
      tinyMetalJaw.position.y = -0.012;
    }
    animatronic.model.leftArm.rotation.set(0, 0, 0);
    animatronic.model.rightArm.rotation.set(0, 0, 0);
    animatronic.model.leftArmJoint.rotation.set(0, 0, 0);
    animatronic.model.rightArmJoint.rotation.set(0, 0, 0);
    animatronic.model.leftLeg.rotation.set(0, 0, 0);
    animatronic.model.rightLeg.rotation.set(0, 0, 0);
    animatronic.model.leftLegJoint.rotation.set(0, 0, 0);
    animatronic.model.rightLegJoint.rotation.set(0, 0, 0);
    animatronic.model.root.scale.setScalar(OFFICE_GAME_MODE_ANIMATRONIC_SCALE[animatronic.animatronic]);
  }

  private sendOfficeGameModeAnimatronicOffStage(animatronic: OfficeGameModeAnimatronicState): void {
    const start = animatronic.route[0] ?? this.getOfficeGameModeOfficeCenter();
    animatronic.model.root.position.set(
      start.x,
      this.getOfficeGameModeAnimatronicFloorY(animatronic.animatronic, start.x, start.z),
      start.z,
    );
    animatronic.model.root.visible = true;
    animatronic.model.root.scale.setScalar(OFFICE_GAME_MODE_ANIMATRONIC_SCALE[animatronic.animatronic]);
    this.officeChapter.setStageAnimatronicPresent(animatronic.animatronic, false);
    animatronic.state = 'wander';
    animatronic.offBalanceTimer = 0;
    animatronic.foxyLeapTimer = 0;
    animatronic.routeIndex = 1 % animatronic.route.length;
    animatronic.waitTimer = 0.2;
    animatronic.doorBreachTimer = 0;
    animatronic.doorBreachDoorId = null;
    animatronic.doorLingerSoundPlayed = false;
    animatronic.doorLingerLaughPlayed = false;
    animatronic.lostSightTimer = 0;
    animatronic.stuckTimer = 0;
    animatronic.progressStallTimer = 0;
    animatronic.detourTarget = null;
    animatronic.detourTimer = 0;
    animatronic.distractionTarget = null;
    animatronic.chaseCommitTimer = 0;
    animatronic.chaseCommitCooldown = 0;
    animatronic.calmProximityTimer = 0;
    this.clearOfficeAnimatronicChaseTimers(animatronic, true);
    animatronic.cameraStareTimer = 0;
    animatronic.cameraStareCooldown = MathUtils.lerp(
      OFFICE_GAME_MODE_CAMERA_STARE_COOLDOWN_MIN_SECONDS,
      OFFICE_GAME_MODE_CAMERA_STARE_COOLDOWN_MAX_SECONDS,
      Math.random(),
    );
    animatronic.cameraStareCameraId = null;
    animatronic.senseTimer = 0;
    animatronic.cachedCanSeePlayer = false;
    animatronic.cachedNoiseResponse = 'none';
    animatronic.cachedBlockedDoorId = null;
    this.randomizeOfficeAnimatronicWalkCycle(animatronic);
  }

  private getOfficeGameModeCameraStareTarget(
    animatronic: OfficeGameModeAnimatronicState,
  ): OfficeChapterData['securityCameras'][number] | null {
    if (
      !this.officeTabletCameraFeedActive
      || !this.officeGameModeActive
      || this.officeGameModePowerOut
      || animatronic.state !== 'wander'
    ) {
      return null;
    }

    const securityCamera = this.getActiveOfficeTabletCamera();
    if (!securityCamera) {
      return null;
    }

    const cameraPosition = securityCamera.viewAnchor.getWorldPosition(new Vector3());
    const toAnimatronic = animatronic.model.root.position.clone().sub(cameraPosition);
    toAnimatronic.y = 0;
    const distance = toAnimatronic.length();
    if (distance <= 0.001 || distance > OFFICE_GAME_MODE_CAMERA_STARE_RANGE) {
      return null;
    }

    const cameraForward = new Vector3(0, 0, -1).applyQuaternion(
      securityCamera.viewAnchor.getWorldQuaternion(new Quaternion()),
    );
    cameraForward.y = 0;
    if (cameraForward.lengthSq() <= 0.001) {
      return securityCamera;
    }

    const viewDot = cameraForward.normalize().dot(toAnimatronic.normalize());
    return viewDot >= OFFICE_GAME_MODE_CAMERA_STARE_VIEW_DOT ? securityCamera : null;
  }

  private updateOfficeGameModeCameraStare(
    animatronic: OfficeGameModeAnimatronicState,
    deltaSeconds: number,
  ): boolean {
    animatronic.cameraStareCooldown = Math.max(0, animatronic.cameraStareCooldown - deltaSeconds);
    if (animatronic.cameraStareTimer > 0) {
      animatronic.cameraStareTimer = Math.max(0, animatronic.cameraStareTimer - deltaSeconds);
    }

    const securityCamera = this.getOfficeGameModeCameraStareTarget(animatronic);
    if (!securityCamera) {
      animatronic.cameraStareTimer = 0;
      animatronic.cameraStareCameraId = null;
      return false;
    }

    if (
      animatronic.cameraStareTimer <= 0
      && animatronic.cameraStareCooldown <= 0
      && Math.random() < OFFICE_GAME_MODE_CAMERA_STARE_CHANCE_PER_SECOND * deltaSeconds
    ) {
      animatronic.cameraStareTimer = MathUtils.lerp(
        OFFICE_GAME_MODE_CAMERA_STARE_MIN_SECONDS,
        OFFICE_GAME_MODE_CAMERA_STARE_MAX_SECONDS,
        Math.random(),
      );
      animatronic.cameraStareCooldown = MathUtils.lerp(
        OFFICE_GAME_MODE_CAMERA_STARE_COOLDOWN_MIN_SECONDS,
        OFFICE_GAME_MODE_CAMERA_STARE_COOLDOWN_MAX_SECONDS,
        Math.random(),
      );
      animatronic.cameraStareCameraId = securityCamera.id;
      animatronic.detourTarget = null;
      animatronic.detourTimer = 0;
      animatronic.progressStallTimer = 0;
      animatronic.waitTimer = 0;
    }

    if (animatronic.cameraStareTimer <= 0 || animatronic.cameraStareCameraId !== securityCamera.id) {
      return false;
    }

    const cameraPosition = securityCamera.viewAnchor.getWorldPosition(new Vector3());
    const dx = cameraPosition.x - animatronic.model.root.position.x;
    const dz = cameraPosition.z - animatronic.model.root.position.z;
    if (Math.hypot(dx, dz) > 0.001) {
      animatronic.model.root.rotation.y = Math.atan2(dx, dz);
    }
    animatronic.model.root.rotation.x = MathUtils.lerp(animatronic.model.root.rotation.x, 0, 0.32);
    animatronic.model.root.rotation.z = Math.sin(this.elapsed * 2.1) * 0.025;
    animatronic.model.head.rotation.y = Math.sin(this.elapsed * 4.8) * 0.045;
    animatronic.model.head.rotation.x = Math.sin(this.elapsed * 3.2) * 0.03;
    animatronic.model.leftArm.rotation.x = MathUtils.lerp(animatronic.model.leftArm.rotation.x, -0.12, 0.2);
    animatronic.model.rightArm.rotation.x = MathUtils.lerp(animatronic.model.rightArm.rotation.x, -0.12, 0.2);
    return true;
  }

  private startOfficeGameModeChaseCommit(
    animatronic: OfficeGameModeAnimatronicState,
    playerPosition: Vector3,
  ): void {
    const root = animatronic.model.root;
    const dx = playerPosition.x - root.position.x;
    const dz = playerPosition.z - root.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 0.001) {
      return;
    }

    const directionX = dx / distance;
    const directionZ = dz / distance;
    const commitDistance = Math.max(OFFICE_GAME_MODE_CHASE_COMMIT_DISTANCE, distance + 9.2);
    animatronic.chaseCommitTarget.set(
      root.position.x + directionX * commitDistance,
      GAME_CONFIG.player.height,
      root.position.z + directionZ * commitDistance,
    );
    animatronic.chaseCommitTimer = OFFICE_GAME_MODE_CHASE_COMMIT_SECONDS;
    animatronic.chaseCommitCooldown = OFFICE_GAME_MODE_CHASE_COMMIT_COOLDOWN;
    animatronic.detourTarget = null;
    animatronic.detourTimer = 0;
    animatronic.progressStallTimer = 0;
  }

  private canOfficeGameModeChargeHitPlayer(
    animatronic: OfficeGameModeAnimatronicState,
    playerPosition: Vector3,
    attackRange: number,
  ): boolean {
    const root = animatronic.model.root;
    const toPlayerX = playerPosition.x - root.position.x;
    const toPlayerZ = playerPosition.z - root.position.z;
    const forwardX = Math.sin(root.rotation.y);
    const forwardZ = Math.cos(root.rotation.y);
    const along = toPlayerX * forwardX + toPlayerZ * forwardZ;
    if (along < 0 || along > attackRange * 0.72) {
      return false;
    }

    const lateral = Math.abs(toPlayerX * forwardZ - toPlayerZ * forwardX);
    return lateral <= attackRange * 0.16;
  }

  private hasOfficeGameModeLineOfSight(from: Vector3, to: Vector3): boolean {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 0.1) {
      return true;
    }

    const steps = Math.max(3, Math.ceil(distance / OFFICE_GAME_MODE_LINE_SAMPLE_DISTANCE));
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

    const steps = Math.max(2, Math.ceil(distance / OFFICE_GAME_MODE_PATH_SAMPLE_DISTANCE));
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

    OFFICE_GAME_MODE_DETOUR_SIDES.forEach((side) => {
      OFFICE_GAME_MODE_DETOUR_FORWARD_DISTANCES.forEach((forwardDistance, forwardIndex) => {
        OFFICE_GAME_MODE_DETOUR_SIDE_DISTANCES.forEach((sideDistance, sideIndex) => {
          considerDetour(
            root.position.x + directionX * forwardDistance + perpX * side * sideDistance,
            root.position.z + directionZ * forwardDistance + perpZ * side * sideDistance,
            0.22 * forwardIndex + 0.18 * sideIndex,
          );
        });
      });
    });

    OFFICE_GAME_MODE_DETOUR_ANGLES.forEach((angle) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rotatedX = directionX * cos - directionZ * sin;
      const rotatedZ = directionX * sin + directionZ * cos;
      OFFICE_GAME_MODE_DETOUR_DISTANCES.forEach((detourDistance, index) => {
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
      animatronic.detourTimer = animatronic.state === 'chase' || animatronic.state === 'rush' || animatronic.state === 'creep' || animatronic.state === 'distracted'
        ? 1.35
        : 2.25;
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

    OFFICE_GAME_MODE_OPEN_SPOT_RADII.forEach((radius, radiusIndex) => {
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

  private openOfficeGameModeDoorsNearAnimatronic(
    animatronic: OfficeGameModeAnimatronicState,
    lookAheadX: number,
    lookAheadZ: number,
  ): void {
    const root = animatronic.model.root;
    const shouldOpenDoor = (
      door: { label: string; interactPosition: Vector3; open: boolean; targetOpenAmount: number; collider: { centerX: number; centerZ: number; enabled?: boolean } },
      sound: 'closet' | 'panel' = 'closet',
    ): void => {
      if (door.open || door.targetOpenAmount > 0.5 || door.collider.enabled === false) {
        return;
      }

      const distanceToCollider = Math.hypot(root.position.x - door.collider.centerX, root.position.z - door.collider.centerZ);
      const lookAheadDistance = Math.hypot(lookAheadX - door.collider.centerX, lookAheadZ - door.collider.centerZ);
      const distanceToInteract = Math.hypot(root.position.x - door.interactPosition.x, root.position.z - door.interactPosition.z);
      if (Math.min(distanceToCollider, lookAheadDistance, distanceToInteract) > 1.85) {
        return;
      }

      door.targetOpenAmount = 1;
      door.open = true;
      if (sound === 'panel') {
        this.gameplaySfxAudio.playSmallPanel(true);
      } else {
        this.gameplaySfxAudio.playClosetDoor(true);
      }
    };

    shouldOpenDoor(this.officeChapter.kitchenEntranceDoor);
    shouldOpenDoor(this.officeChapter.backstageStorageDoor);
    shouldOpenDoor(this.officeChapter.storageClosetDoor);
    shouldOpenDoor(this.officeChapter.bathroomEntranceDoor);
    this.officeChapter.bathroomRoomDoors.forEach((door) => shouldOpenDoor(door));
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

    const directMoveX = root.position.x + directionX * step;
    const directMoveZ = root.position.z + directionZ * step;
    const directLookAheadX = directMoveX + directionX * OFFICE_GAME_MODE_DIRECT_LOOKAHEAD;
    const directLookAheadZ = directMoveZ + directionZ * OFFICE_GAME_MODE_DIRECT_LOOKAHEAD;
    this.openOfficeGameModeDoorsNearAnimatronic(animatronic, directLookAheadX, directLookAheadZ);
    if (
      this.canOfficeGameModeAnimatronicStandAt(directMoveX, directMoveZ)
      && this.canOfficeGameModeAnimatronicStandAt(
        directLookAheadX,
        directLookAheadZ,
        OFFICE_GAME_MODE_COLLISION_RADIUS * 0.82,
      )
      && this.isOfficeGameModePathClear(root.position.x, root.position.z, directMoveX, directMoveZ)
    ) {
      root.position.x = directMoveX;
      root.position.z = directMoveZ;
      root.rotation.y = Math.atan2(directionX, directionZ);
      root.position.y = this.getOfficeGameModeAnimatronicFloorY(
        animatronic.animatronic,
        root.position.x,
        root.position.z,
      );
      return true;
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

    OFFICE_GAME_MODE_MOVE_ANGLES.forEach((angle) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rotatedX = directionX * cos - directionZ * sin;
      const rotatedZ = directionX * sin + directionZ * cos;
      const angledStep = step * 0.86;
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
    OFFICE_GAME_MODE_DETOUR_SIDES.forEach((side) => {
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
    ].map((point) => this.getOfficeGameModePoint(point));
    this.scene.add(root);
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
    let closedDoors = 0;
    for (const door of this.officeChapter.doors) {
      if (door.targetOpenAmount < 0.5) {
        closedDoors += 1;
      }
    }
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
    this.officeFreddyPowerOutTimer = OFFICE_FREDDY_POWER_OUT_ATTACK_DELAY;
    this.officeTabletCameraFeedActive = false;
    this.officeTabletHeld = false;
    this.officeTabletAnchor.visible = false;
    this.clearOfficeCameraPuppetThreat();
    this.officeChapter.doors.forEach((door) => {
      door.targetOpenAmount = 1;
      door.open = true;
    });
    this.officePowerOutBoriDoor = Math.sin(this.elapsed * 1.37) > 0 ? 'left' : 'right';
    this.officeGameModeAnimatronics.forEach((animatronic) => {
      this.putOfficeGameModeAnimatronicOnStage(animatronic);
    });
    this.powerEventAudio.resume();
    this.powerEventAudio.playOutage();
    this.gameplaySfxAudio.resume();
    this.gameplaySfxAudio.playFreddyPowerOutMelody();
    this.pushStatus(
      `${this.getOfficeModeLabel()} power is out. Bori's song is pretty long. Watch the ${this.officePowerOutBoriDoor} door.`,
      5.2,
    );
  }

  private updateOfficePowerOutBoriDoor(): void {
    if (!this.officePowerOutBoriDoor) {
      return;
    }

    const bori = this.officeGameModeAnimatronics.find((entry) => entry.animatronic === 'bori');
    if (!bori) {
      return;
    }

    const watch = this.getOfficeGameModeDoorWatchPoint(this.officePowerOutBoriDoor);
    const side = this.officePowerOutBoriDoor === 'left' ? -1 : 1;
    const playerPosition = this.player.getPosition();
    const reveal = MathUtils.smoothstep(
      1 - this.officeFreddyPowerOutTimer / OFFICE_FREDDY_POWER_OUT_ATTACK_DELAY,
      0.08,
      0.28,
    );
    const doorwayX = watch.x + side * MathUtils.lerp(0.2, 0.52, reveal);
    const doorwayZ = watch.z - MathUtils.lerp(2.15, 1.08, reveal);

    bori.model.root.visible = true;
    bori.model.root.position.set(
      doorwayX,
      this.getOfficeGameModeAnimatronicFloorY('bori', doorwayX, doorwayZ),
      doorwayZ,
    );
    bori.model.root.scale.setScalar(OFFICE_GAME_MODE_ANIMATRONIC_SCALE.bori);
    bori.model.root.rotation.set(0, 0, 0);
    bori.model.root.rotation.y = Math.atan2(
      playerPosition.x - bori.model.root.position.x,
      playerPosition.z - bori.model.root.position.z,
    );
    bori.model.root.rotation.z = Math.sin(this.elapsed * 1.85) * 0.085 * reveal;
    bori.model.root.rotation.x = Math.sin(this.elapsed * 1.2) * 0.035 * reveal;
    bori.model.head.rotation.set(
      Math.sin(this.elapsed * 1.45) * 0.08 * reveal,
      Math.sin(this.elapsed * 2.15) * 0.18 * reveal,
      Math.cos(this.elapsed * 1.7) * 0.08 * reveal,
    );
    bori.model.leftArm.rotation.x = MathUtils.lerp(0, -0.72 + Math.sin(this.elapsed * 1.9) * 0.1, reveal);
    bori.model.rightArm.rotation.x = MathUtils.lerp(0, -0.74 - Math.sin(this.elapsed * 1.9) * 0.1, reveal);
    bori.state = 'door';
    bori.waitTimer = 0;
    bori.lostSightTimer = 0;
    bori.detourTarget = null;
    bori.detourTimer = 0;
    bori.distractionTarget = null;
    bori.cachedCanSeePlayer = false;
    bori.cachedNoiseResponse = 'none';
    bori.cachedBlockedDoorId = null;
    this.officeChapter.setStageAnimatronicPresent('bori', false);

    const flicker = Math.floor(this.elapsed * 7.4) % 2 === 0 ? 1 : 0.08;
    bori.model.root.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (!(material instanceof MeshStandardMaterial) || !material.userData.officeCutsceneEye) {
          return;
        }

        const baseIntensity = typeof material.userData.officePowerOutBaseEmissiveIntensity === 'number'
          ? material.userData.officePowerOutBaseEmissiveIntensity
          : material.emissiveIntensity;
        material.userData.officePowerOutBaseEmissiveIntensity = baseIntensity;
        material.emissiveIntensity = Math.max(baseIntensity, 0.7) * (0.18 + flicker * 2.45);
      });
    });
  }

  private updateOfficeFreddyPowerOutAttack(deltaSeconds: number): void {
    if (!this.officeGameModeActive || !this.officeGameModePowerOut || this.officeFreddyPowerOutTimer <= 0) {
      return;
    }

    if (this.activeOfficeJumpscare) {
      return;
    }

    this.officeFreddyPowerOutTimer = Math.max(0, this.officeFreddyPowerOutTimer - deltaSeconds);
    this.updateOfficePowerOutBoriDoor();
    if (this.officeFreddyPowerOutTimer > 0) {
      return;
    }

    const definition = this.getRandomOfficeJumpscareDefinition('bori')
      ?? OFFICE_JUMPSCARE_DEFINITIONS.find((entry) => entry.id === 'bori-3');
    if (definition) {
      this.officePowerOutBoriDoor = null;
      this.startOfficeJumpscare(definition);
    }
  }

  private updateOfficeModeCycle(deltaSeconds: number): void {
    if (!this.officeChapterActive || !this.officeGameModeActive) {
      return;
    }

    if (this.officeDeathNoticePhase) {
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
        ambient: 0.16,
        hemisphere: 0.2,
        flashlightIntensity: GAME_CONFIG.flashlight.intensity * 2.35,
        flashlightDistance: 25,
        flashlightAngle: GAME_CONFIG.flashlight.angle,
        flashlightPenumbra: GAME_CONFIG.flashlight.penumbra,
        fogNear: 12,
        fogFar: 62,
        fogBlend: 1,
      };
    }

    switch (this.officeGameModeDifficulty) {
      case 'easy':
        return {
          ambient: 0.17,
          hemisphere: 0.22,
          flashlightIntensity: GAME_CONFIG.flashlight.intensity * 3.32,
          flashlightDistance: 43,
          flashlightAngle: Math.PI / 8.2,
          flashlightPenumbra: 0.34,
          fogNear: 12,
          fogFar: 60,
          fogBlend: 1,
        };
      case 'hard':
        return {
          ambient: 0.045,
          hemisphere: 0.07,
          flashlightIntensity: GAME_CONFIG.flashlight.intensity * 2.75,
          flashlightDistance: 34,
          flashlightAngle: Math.PI / 9.4,
          flashlightPenumbra: 0.22,
          fogNear: 4,
          fogFar: 30,
          fogBlend: 1,
        };
      case 'normal':
      default:
        return {
          ambient: 0.14,
          hemisphere: 0.19,
          flashlightIntensity: GAME_CONFIG.flashlight.intensity * 3.25,
          flashlightDistance: 41,
          flashlightAngle: Math.PI / 8.4,
          flashlightPenumbra: 0.31,
          fogNear: 10,
          fogFar: 54,
          fogBlend: 1,
        };
    }
  }

  private distractOfficeGameModeAnimatronics(position: Vector3, kind: OfficeThrowableKind): void {
    if (!this.officeChapterActive || !this.officeGameModeActive || this.officeGameModePowerOut) {
      return;
    }

    let distractedCount = 0;
    this.officeGameModeAnimatronics.forEach((animatronic) => {
      if (
        !animatronic.model.root.visible
        || animatronic.animatronic === 'bori'
        || (animatronic.state !== 'chase' && animatronic.state !== 'rush' && animatronic.state !== 'creep')
      ) {
        return;
      }

      const distance = Math.hypot(
        animatronic.model.root.position.x - position.x,
        animatronic.model.root.position.z - position.z,
      );
      if (distance > OFFICE_DISTRACTION_RANGE) {
        return;
      }

      const target = new Vector3(
        position.x,
        this.getOfficeGameModeAnimatronicFloorY(animatronic.animatronic, position.x, position.z),
        position.z,
      );
      animatronic.state = 'distracted';
      animatronic.distractionTarget = target;
      animatronic.lastKnownPlayerPosition.copy(target);
      animatronic.waitTimer = 0;
      animatronic.attackCooldown = Math.max(animatronic.attackCooldown, 0.45);
      animatronic.lostSightTimer = 0;
      animatronic.stuckTimer = 0;
      animatronic.progressStallTimer = 0;
      animatronic.detourTarget = null;
      animatronic.detourTimer = 0;
      animatronic.chaseCommitTimer = 0;
      animatronic.chaseCommitCooldown = OFFICE_GAME_MODE_CHASE_COMMIT_COOLDOWN;
      animatronic.senseTimer = OFFICE_DISTRACTION_LOOK_SECONDS;
      animatronic.cachedCanSeePlayer = false;
      animatronic.cachedNoiseResponse = 'none';
      animatronic.cachedBlockedDoorId = null;
      distractedCount += 1;
    });

    if (distractedCount > 0) {
      this.pushStatus(
        kind === 'glass'
          ? 'The glass shatters. The chasing animatronic breaks focus and runs to the shards.'
          : 'The tiny bear squeaks. The chasing animatronic breaks focus and runs to the toy.',
        2.8,
      );
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
    const animatronicPosition = this.officeGameModeAnimatronicPosition.set(
      root.position.x,
      GAME_CONFIG.player.height,
      root.position.z,
    );
    const distanceToPlayer = Math.hypot(root.position.x - playerPosition.x, root.position.z - playerPosition.z);
    animatronic.attackCooldown = Math.max(0, animatronic.attackCooldown - deltaSeconds);
    animatronic.senseTimer = Math.max(0, animatronic.senseTimer - deltaSeconds);
    const distractionActive = animatronic.state === 'distracted' || animatronic.state === 'distracted-watch';
    const wasChaseCommitting = animatronic.chaseCommitTimer > 0;
    animatronic.chaseCommitTimer = Math.max(0, animatronic.chaseCommitTimer - deltaSeconds);
    if (wasChaseCommitting && animatronic.chaseCommitTimer <= 0) {
      animatronic.chaseCommitCooldown = OFFICE_GAME_MODE_CHASE_COMMIT_COOLDOWN;
      animatronic.detourTarget = null;
      animatronic.detourTimer = 0;
      animatronic.senseTimer = 0;
    } else if (!wasChaseCommitting) {
      animatronic.chaseCommitCooldown = Math.max(0, animatronic.chaseCommitCooldown - deltaSeconds);
    }

    let blockedDoorId = animatronic.cachedBlockedDoorId;
    let doorBlocked = blockedDoorId !== null;
    let canSeePlayer = animatronic.cachedCanSeePlayer;
    let noiseResponse = animatronic.cachedNoiseResponse;
    const closeAttackRefresh = distanceToPlayer <= config.attackRange * 0.9;
    animatronic.insultCooldown = Math.max(0, animatronic.insultCooldown - deltaSeconds);
    if (animatronic.insultChargeTimer > 0) {
      animatronic.insultChargeTimer = Math.max(0, animatronic.insultChargeTimer - deltaSeconds);
    }
    const refreshSense = animatronic.chaseCommitTimer <= 0
      && !distractionActive
      && animatronic.state !== 'door-breach'
      && animatronic.state !== 'off-balance'
      && animatronic.state !== 'foxy-leap'
      && animatronic.state !== 'vent-chase'
      && (
        animatronic.senseTimer <= 0
        || animatronic.state === 'rush'
        || animatronic.state === 'door'
        || (animatronic.state !== 'chase' && closeAttackRefresh)
      );

    if (distractionActive) {
      blockedDoorId = null;
      doorBlocked = false;
      canSeePlayer = false;
      noiseResponse = 'none';
      animatronic.cachedBlockedDoorId = null;
      animatronic.cachedCanSeePlayer = false;
      animatronic.cachedNoiseResponse = 'none';
    }

    if (refreshSense) {
      blockedDoorId = this.getOfficeGameModeBlockedDoorId(animatronicPosition, playerPosition);
      doorBlocked = blockedDoorId !== null;
      const inDetectionRange = distanceToPlayer <= this.getOfficeGameModeDetectionRange(config);
      canSeePlayer = !doorBlocked
        && !this.officeVentActive
        && !this.officeVentDrop
        && !this.officeChapterSeated
        && !this.officeBallPitHidden
        && inDetectionRange
        && this.hasOfficeGameModeLineOfSight(animatronicPosition, playerPosition);
      noiseResponse = this.getOfficeGameModeNoiseResponse(animatronic, animatronicPosition);
      animatronic.cachedBlockedDoorId = blockedDoorId;
      animatronic.cachedCanSeePlayer = canSeePlayer;
      animatronic.cachedNoiseResponse = noiseResponse;
      animatronic.senseTimer = animatronic.state === 'stage'
        ? OFFICE_GAME_MODE_STAGE_SENSE_INTERVAL
        : animatronic.state === 'chase' || animatronic.state === 'rush' || animatronic.state === 'creep'
          ? OFFICE_GAME_MODE_CHASE_SENSE_INTERVAL
          : OFFICE_GAME_MODE_WANDER_SENSE_INTERVAL;
    }
    this.updateOfficeQuackySeenJaw(animatronic, canSeePlayer, deltaSeconds);
    this.updateOfficeAnimatronicMouthMotion(animatronic, canSeePlayer);
    if (this.updateOfficeGameModeCalmProximity(animatronic, deltaSeconds, playerPosition, canSeePlayer)) {
      return true;
    }

    if (animatronic.state === 'stage') {
      this.officeChapter.setStageAnimatronicPresent(animatronic.animatronic, true);
      animatronic.model.root.visible = false;
      const forceStageChase = noiseResponse === 'rush' && this.officePlayerVoiceLevel >= OFFICE_STAGE_YELL_LEVEL;
      if (
        noiseResponse !== 'none'
        && (canLeaveStage || forceStageChase)
        && this.shouldOfficeStageNoiseRelease(animatronic, noiseResponse)
      ) {
        this.sendOfficeGameModeAnimatronicOffStage(animatronic);
        this.markOfficeStageVoiceRelease(animatronic.animatronic);
        this.startOfficeGameModeAnimatronicChase(
          animatronic,
          this.officePlayerNoisePosition,
          noiseResponse === 'rush' ? 'rush' : 'chase',
        );
        return true;
      }

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

    if (
      this.officeInsultHeardTimer > 0
      && (animatronic.state === 'retreat' || animatronic.state === 'wander')
      && animatronic.insultCooldown <= 0
      && distanceToPlayer <= OFFICE_YELL_ATTRACT_RANGE
    ) {
      this.startOfficeInsultRevenge(animatronic);
    }

    if (animatronic.insultStareTimer > 0) {
      animatronic.insultStareTimer = Math.max(0, animatronic.insultStareTimer - deltaSeconds);
      this.updateOfficeInsultEyeFlicker(animatronic);
      const dx = playerPosition.x - root.position.x;
      const dz = playerPosition.z - root.position.z;
      if (Math.hypot(dx, dz) > 0.01) {
        root.rotation.y = Math.atan2(dx, dz);
      }
      animatronic.model.head.rotation.y = Math.sin(this.elapsed * 18) * 0.06;
      animatronic.model.leftArm.rotation.x = MathUtils.lerp(animatronic.model.leftArm.rotation.x, -0.28, 0.28);
      animatronic.model.rightArm.rotation.x = MathUtils.lerp(animatronic.model.rightArm.rotation.x, -0.28, 0.28);
      if (animatronic.insultStareTimer <= 0) {
        this.updateOfficeInsultEyeFlicker(animatronic);
        animatronic.insultChargeTimer = OFFICE_INSULT_CHARGE_SECONDS;
        this.startOfficeGameModeAnimatronicChase(animatronic, playerPosition, 'chase');
        animatronic.insultChargeTimer = OFFICE_INSULT_CHARGE_SECONDS;
        animatronic.insultCooldown = OFFICE_INSULT_COOLDOWN_SECONDS;
        this.pushStatus(`${animatronic.label}'s eyes stop flickering. They sprint at you twice as fast.`, 2.8);
      }
      return false;
    }
    this.updateOfficeInsultEyeFlicker(animatronic);

    if (animatronic.state === 'door-breach') {
      this.updateOfficeGameModeDoorBreach(animatronic, deltaSeconds, playerPosition);
      return false;
    }

    if (this.updateOfficeGameModeDoorLinger(animatronic, deltaSeconds, playerPosition)) {
      return false;
    }

    if (animatronic.state === 'foxy-leap') {
      this.updateOfficeFoxyLeapAttack(animatronic, deltaSeconds, playerPosition);
      return false;
    }

    if (animatronic.state === 'vent-chase') {
      this.updateOfficeGameModeVentChase(animatronic, deltaSeconds, playerPosition);
      return false;
    }

    if (animatronic.state === 'off-balance') {
      this.updateOfficeGameModeAnimatronicOffBalance(animatronic, deltaSeconds, playerPosition);
      return false;
    }

    if (animatronic.state === 'distracted-watch') {
      animatronic.waitTimer = Math.max(0, animatronic.waitTimer - deltaSeconds);
      const lookTarget = animatronic.distractionTarget ?? animatronic.model.root.position;
      const dx = lookTarget.x - root.position.x;
      const dz = lookTarget.z - root.position.z;
      if (Math.hypot(dx, dz) > 0.01) {
        root.rotation.y = Math.atan2(dx, dz);
      }
      root.rotation.x = MathUtils.lerp(root.rotation.x, 0.16, 0.28);
      root.rotation.z = Math.sin(this.elapsed * 8.5) * 0.025;
      animatronic.model.head.rotation.x = MathUtils.lerp(animatronic.model.head.rotation.x, 0.42, 0.24);
      animatronic.model.head.rotation.y = Math.sin(this.elapsed * 4.2) * 0.07;
      animatronic.model.leftArm.rotation.x = MathUtils.lerp(animatronic.model.leftArm.rotation.x, -0.34, 0.2);
      animatronic.model.rightArm.rotation.x = MathUtils.lerp(animatronic.model.rightArm.rotation.x, -0.34, 0.2);
      if (animatronic.waitTimer <= 0) {
        animatronic.distractionTarget = null;
        this.startOfficeGameModeAnimatronicChase(animatronic, playerPosition, 'chase');
        this.pushStatus(`${animatronic.label} turns away from the distraction and comes running back.`, 2.2);
      }
      return false;
    }

    if (animatronic.state === 'calm-watch') {
      this.updateOfficeGameModeAnimatronicCalmWatch(animatronic, deltaSeconds, playerPosition);
      return false;
    }

    if (animatronic.state === 'chase' || animatronic.state === 'rush') {
      if (animatronic.insultChargeTimer <= 0) {
        animatronic.chaseGiveUpTimer += deltaSeconds;
        if (animatronic.chaseGiveUpTimer >= OFFICE_CHASE_GIVE_UP_SECONDS) {
          this.makeOfficeGameModeAnimatronicGiveUp(animatronic);
          return false;
        }
      }
    } else {
      animatronic.chaseGiveUpTimer = 0;
    }

    if (
      animatronic.animatronic === 'foxy'
      && canSeePlayer
      && (animatronic.state === 'wander' || animatronic.state === 'chase')
      && animatronic.attackCooldown <= 0
      && animatronic.chaseCommitTimer <= 0
    ) {
      if (Math.random() < OFFICE_FOXY_LEAP_CHANCE) {
        this.startOfficeFoxyLeapAttack(animatronic, playerPosition);
        return false;
      }

      animatronic.attackCooldown = 2.2;
    }

    if (this.canOfficeGameModeAnimatronicCalmWatch(animatronic, canSeePlayer, deltaSeconds, distanceToPlayer)) {
      this.startOfficeGameModeAnimatronicCalmWatch(animatronic);
      this.updateOfficeGameModeAnimatronicCalmWatch(animatronic, deltaSeconds, playerPosition);
      return false;
    }

    if (canSeePlayer && animatronic.chaseCommitTimer <= 0) {
      animatronic.lastKnownPlayerPosition.copy(playerPosition);
      animatronic.lostSightTimer = 0;
    } else if (canSeePlayer) {
      animatronic.lostSightTimer = 0;
    } else if (noiseResponse !== 'none' && animatronic.state !== 'door' && animatronic.state !== 'retreat') {
      if (noiseResponse === 'rush') {
        this.startOfficeGameModeAnimatronicChase(animatronic, this.officePlayerNoisePosition, 'rush');
      } else if (animatronic.state === 'wander') {
        this.startOfficeGameModeAnimatronicChase(animatronic, this.officePlayerNoisePosition, 'chase');
      }
    }

    if (this.officeBallPitHidden && (animatronic.state === 'chase' || animatronic.state === 'rush' || animatronic.state === 'creep')) {
      animatronic.state = 'wander';
      animatronic.lostSightTimer = 0;
      animatronic.waitTimer = 1.2;
      animatronic.progressStallTimer = 0;
      animatronic.detourTarget = null;
      animatronic.detourTimer = 0;
      animatronic.chaseCommitTimer = 0;
      animatronic.chaseCommitCooldown = OFFICE_GAME_MODE_CHASE_COMMIT_COOLDOWN;
      this.clearOfficeAnimatronicChaseTimers(animatronic);
    } else if (doorBlocked && (animatronic.state === 'chase' || animatronic.state === 'rush' || animatronic.state === 'creep') && blockedDoorId) {
      if (
        this.canOfficeGameModeAnimatronicForceOfficeDoor(animatronic)
        && Math.random() < OFFICE_DOOR_BREACH_CHANCE
      ) {
        this.startOfficeGameModeDoorBreach(animatronic, blockedDoorId);
        this.updateOfficeGameModeDoorBreach(animatronic, deltaSeconds, playerPosition);
        return false;
      }

      this.startOfficeGameModeDoorBlockedWait(animatronic, blockedDoorId);
    } else if (canSeePlayer && animatronic.attackCooldown <= 0 && animatronic.state !== 'retreat' && animatronic.state !== 'rush' && animatronic.state !== 'creep') {
      this.startOfficeGameModeAnimatronicChase(animatronic, playerPosition, 'chase');
    } else if ((animatronic.state === 'chase' || animatronic.state === 'rush') && !canSeePlayer) {
      animatronic.lostSightTimer += deltaSeconds;
      if (animatronic.lostSightTimer >= config.lostSightSeconds) {
        animatronic.state = 'wander';
        animatronic.waitTimer = 1.6;
        animatronic.lostSightTimer = 0;
        animatronic.progressStallTimer = 0;
        animatronic.detourTarget = null;
        animatronic.detourTimer = 0;
        animatronic.chaseCommitTimer = 0;
        animatronic.chaseCommitCooldown = OFFICE_GAME_MODE_CHASE_COMMIT_COOLDOWN;
        this.clearOfficeAnimatronicChaseTimers(animatronic);
      }
    }

    if (
      animatronic.state === 'chase'
      && canSeePlayer
      && animatronic.chaseCommitTimer <= 0
      && animatronic.chaseCommitCooldown <= 0
      && distanceToPlayer <= OFFICE_GAME_MODE_CHASE_COMMIT_RANGE
      && distanceToPlayer > config.attackRange * 0.72
    ) {
      this.startOfficeGameModeChaseCommit(animatronic, playerPosition);
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
          this.startOfficeGameModeDoorBlockedWait(animatronic, this.officeFoxyRushDoor);
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

    const playerInAttackRange = animatronic.chaseCommitTimer > 0
      ? this.canOfficeGameModeChargeHitPlayer(animatronic, playerPosition, config.attackRange)
      : distanceToPlayer <= config.attackRange;
    if (
      animatronic.state === 'chase'
      && animatronic.chaseCommitTimer > 0
      && distanceToPlayer <= OFFICE_ANIMATRONIC_JUKE_RANGE
      && !playerInAttackRange
    ) {
      this.startOfficeGameModeAnimatronicOffBalance(animatronic, playerPosition);
      return false;
    }

    if ((canSeePlayer || animatronic.state === 'creep' || animatronic.insultChargeTimer > 0) && playerInAttackRange && animatronic.attackCooldown <= 0) {
      const definition = this.getRandomOfficeJumpscareDefinition(animatronic.animatronic);
      if (definition && !this.activeOfficeJumpscare) {
        animatronic.attackCooldown = 5.2;
        this.startOfficeJumpscare(definition);
      }
      return false;
    }

    if (this.updateOfficeGameModeCameraStare(animatronic, deltaSeconds)) {
      return false;
    }

    if (animatronic.waitTimer > 0) {
      animatronic.waitTimer = Math.max(0, animatronic.waitTimer - deltaSeconds);
      return false;
    }

    if (animatronic.insultChargeTimer > 0) {
      animatronic.lastKnownPlayerPosition.copy(playerPosition);
    }

    const rawDesiredTarget = animatronic.insultChargeTimer > 0
      ? playerPosition
      : animatronic.state === 'rush' && animatronic.animatronic === 'foxy'
      ? this.getOfficeFoxyRushDoorTarget()
      : animatronic.state === 'rush'
      ? this.player.getPosition()
      : animatronic.state === 'creep'
      ? playerPosition
      : animatronic.state === 'distracted' && animatronic.distractionTarget
      ? animatronic.distractionTarget
      : animatronic.state === 'chase' && animatronic.chaseCommitTimer > 0
      ? animatronic.chaseCommitTarget
      : animatronic.state === 'chase'
      ? animatronic.lastKnownPlayerPosition
      : animatronic.state === 'door' && blockedDoorId
        ? this.getOfficeGameModeDoorWatchPoint(blockedDoorId)
        : animatronic.route[animatronic.routeIndex] ?? animatronic.route[0] ?? this.getOfficeGameModeOfficeCenter();
    const desiredTarget = this.applyOfficeGameModeSeparation(
      animatronic,
      this.getOfficeGameModeSafeTarget(animatronic, rawDesiredTarget),
    );
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
        animatronic.detourTimer = animatronic.state === 'chase' || animatronic.state === 'rush' || animatronic.state === 'creep' || animatronic.state === 'distracted'
          ? 1.15
          : 1.85;
      }
    }

    const target = animatronic.detourTarget ?? desiredTarget;
    const movingToDetour = animatronic.detourTarget !== null;
    const dx = target.x - root.position.x;
    const dz = target.z - root.position.z;
    const distance = Math.hypot(dx, dz);
    const nightSpeedMultiplier = this.getOfficeGameModeSpeedMultiplier();
    const baseSpeed = animatronic.state === 'rush'
      ? OFFICE_FOXY_RUSH_SPEED
      : animatronic.state === 'creep'
      ? config.walkSpeed * nightSpeedMultiplier * 0.62
      : animatronic.state === 'chase' || animatronic.state === 'distracted'
      ? OFFICE_GAME_MODE_CHASE_MATCH_SPEED
      : animatronic.state === 'retreat'
        ? config.walkSpeed * nightSpeedMultiplier * 1.08
        : config.walkSpeed * nightSpeedMultiplier;
    const foxyWanderBurst = animatronic.animatronic === 'foxy'
      && animatronic.state === 'wander'
      && Math.sin(this.elapsed * 0.31 + animatronic.walkCyclePhase) > 0.15;
    const speed = baseSpeed * (foxyWanderBurst ? 1.5 : 1) * (animatronic.insultChargeTimer > 0 ? 2 : 1);

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

      if (animatronic.state === 'distracted') {
        animatronic.state = 'distracted-watch';
        animatronic.waitTimer = OFFICE_DISTRACTION_LOOK_SECONDS;
        animatronic.detourTarget = null;
        animatronic.detourTimer = 0;
        animatronic.progressStallTimer = 0;
        return false;
      }

      if (animatronic.state === 'chase' && animatronic.chaseCommitTimer > 0) {
        animatronic.chaseCommitTimer = 0;
        animatronic.chaseCommitCooldown = OFFICE_GAME_MODE_CHASE_COMMIT_COOLDOWN;
        animatronic.senseTimer = 0;
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
      } else if (!moved && !animatronic.detourTarget && (animatronic.state === 'chase' || animatronic.state === 'rush' || animatronic.state === 'creep' || animatronic.state === 'distracted') && animatronic.stuckTimer > 1.15) {
        if (animatronic.state === 'distracted') {
          animatronic.state = 'distracted-watch';
          animatronic.waitTimer = OFFICE_DISTRACTION_LOOK_SECONDS * 0.7;
          animatronic.stuckTimer = 0;
          return false;
        }
        animatronic.state = 'wander';
        animatronic.lostSightTimer = 0;
        animatronic.progressStallTimer = 0;
        animatronic.waitTimer = 0.35;
        animatronic.chaseCommitTimer = 0;
        animatronic.chaseCommitCooldown = OFFICE_GAME_MODE_CHASE_COMMIT_COOLDOWN;
      }
    }

    const running = animatronic.state === 'chase' || animatronic.state === 'rush' || animatronic.state === 'distracted';
    const gaitSpeed = (running ? 17.5 : 7.4) * animatronic.walkCycleSpeedMultiplier;
    const motionStrength = (running ? 1.55 : 0.62) * animatronic.walkCycleStrideMultiplier;
    const stepCycle = this.elapsed * gaitSpeed + animatronic.walkCyclePhase;
    const leftStep = Math.sin(stepCycle);
    const rightStep = Math.sin(stepCycle + Math.PI);
    const bodyBob = Math.abs(Math.sin(stepCycle)) * (running ? 0.035 : 0.018) * animatronic.walkCycleBounceMultiplier;
    const animationFloorY = this.getOfficeGameModeAnimatronicFloorY(animatronic.animatronic, animatronic.model.root.position.x, animatronic.model.root.position.z);
    animatronic.model.root.rotation.x = MathUtils.lerp(animatronic.model.root.rotation.x, running ? 0.13 : 0, 0.35);
    animatronic.model.root.rotation.z = MathUtils.lerp(
      animatronic.model.root.rotation.z,
      running ? Math.sin(stepCycle) * 0.035 * animatronic.walkCycleBounceMultiplier : Math.sin(stepCycle) * 0.012 * animatronic.walkCycleBounceMultiplier,
      0.35,
    );
    animatronic.model.root.position.y = animationFloorY + bodyBob;
    animatronic.model.leftLeg.rotation.x = leftStep * (running ? 0.58 : 0.42) * motionStrength;
    animatronic.model.rightLeg.rotation.x = rightStep * (running ? 0.58 : 0.42) * motionStrength;
    animatronic.model.leftLegJoint.rotation.x = Math.max(0, -leftStep) * (running ? 0.74 : 0.48) * motionStrength;
    animatronic.model.rightLegJoint.rotation.x = Math.max(0, -rightStep) * (running ? 0.74 : 0.48) * motionStrength;
    const leftArmStride = rightStep;
    const rightArmStride = leftStep;
    const armSwing = (running ? 0.32 : 0.24) * animatronic.walkCycleArmMultiplier;
    const armSide = (running ? 0.78 : 0.58) * animatronic.walkCycleSideMultiplier;
    const armLean = running ? 0.1 : 0.02;
    const elbowBend = (running ? 0.38 : 0.24) * animatronic.walkCycleArmMultiplier;
    animatronic.model.leftArm.rotation.x = leftArmStride * armSwing * motionStrength - armLean;
    animatronic.model.rightArm.rotation.x = rightArmStride * armSwing * motionStrength - armLean;
    animatronic.model.leftArm.rotation.y = MathUtils.lerp(
      animatronic.model.leftArm.rotation.y,
      -0.18 - Math.max(0, leftArmStride) * 0.12,
      0.32,
    );
    animatronic.model.rightArm.rotation.y = MathUtils.lerp(
      animatronic.model.rightArm.rotation.y,
      0.18 + Math.max(0, rightArmStride) * 0.12,
      0.32,
    );
    animatronic.model.leftArm.rotation.z = MathUtils.lerp(
      animatronic.model.leftArm.rotation.z,
      -armSide - Math.max(0, -leftArmStride) * 0.12,
      0.38,
    );
    animatronic.model.rightArm.rotation.z = MathUtils.lerp(
      animatronic.model.rightArm.rotation.z,
      armSide + Math.max(0, -rightArmStride) * 0.12,
      0.38,
    );
    animatronic.model.leftArmJoint.rotation.x = MathUtils.lerp(
      animatronic.model.leftArmJoint.rotation.x,
      -elbowBend - Math.max(0, leftArmStride) * 0.22,
      0.36,
    );
    animatronic.model.rightArmJoint.rotation.x = MathUtils.lerp(
      animatronic.model.rightArmJoint.rotation.x,
      -elbowBend - Math.max(0, rightArmStride) * 0.22,
      0.36,
    );
    animatronic.model.leftArmJoint.rotation.z = MathUtils.lerp(
      animatronic.model.leftArmJoint.rotation.z,
      -0.12 - Math.max(0, -leftArmStride) * 0.1,
      0.36,
    );
    animatronic.model.rightArmJoint.rotation.z = MathUtils.lerp(
      animatronic.model.rightArmJoint.rotation.z,
      0.12 + Math.max(0, -rightArmStride) * 0.1,
      0.36,
    );
    animatronic.model.head.rotation.y = Math.sin(this.elapsed * (running ? 9.4 : 5.6) * animatronic.walkCycleSpeedMultiplier + animatronic.walkCyclePhase * 0.6)
      * 0.08
      * (running ? 1.25 : 0.45)
      * animatronic.walkCycleBounceMultiplier;
    return false;
  }

  private updateOfficeGameMode(deltaSeconds: number): void {
    if (!this.officeGameModeActive) {
      return;
    }

    if (this.officeDeathNoticePhase) {
      return;
    }

    this.ensureOfficeGameModeAnimatronics();
    if (this.officeMode === 'game' && !this.officeGameModeNightPhase) {
      return;
    }

    this.updateOfficeGameModePower(deltaSeconds);
    this.updateOfficeFreddyPowerOutAttack(deltaSeconds);
    if (this.officeGameModePowerOut) {
      return;
    }

    this.updateOfficeFoxyCameraPressure(deltaSeconds);
    this.updateOfficeFoxyRushAudio(deltaSeconds);
    if (this.activeOfficeJumpscare || this.chapterMenuOpen || this.officeJumpscareMenuOpen || this.officeModeMenuOpen) {
      return;
    }

    this.officeInsultHeardTimer = Math.max(0, this.officeInsultHeardTimer - deltaSeconds);
    this.officeStageVoiceReleaseCooldown = Math.max(0, this.officeStageVoiceReleaseCooldown - deltaSeconds);
    this.updateOfficePendingVentChase(deltaSeconds);
    const maxOffstage = this.getOfficeGameModeMaxOffstage();
    let offStageCount = 0;
    for (const animatronic of this.officeGameModeAnimatronics) {
      if (animatronic.state !== 'stage') {
        offStageCount += 1;
      }
    }
    for (const animatronic of this.officeGameModeAnimatronics) {
      const leftStage = this.updateOfficeGameModeAnimatronic(
        animatronic,
        deltaSeconds,
        offStageCount < maxOffstage,
      );
      if (leftStage) {
        offStageCount += 1;
      }
    }
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
        ? 'Press M to open the Chapter 3 mode menu. Use the desk iPad for cameras.'
        : 'Press M to put the Coordinate Tool away.',
      lastMarkerText,
    ].join('\n');
  }

  private getMicrophoneSoundToolHudText(): string {
    this.loadSavedMicrophoneSounds();
    const soundEffectLines = this.microphoneSoundRecordings.map((recording, index) => (
      `${index + 1}. ${this.formatMicrophoneSoundLabel(recording.id)}`
    ));
    const selectedText = this.microphoneSoundPreviewRecordingId
      ? `Selected sound effect: ${this.formatMicrophoneSoundLabel(this.microphoneSoundPreviewRecordingId)}.`
      : this.microphoneSoundPreviewUrl
        ? 'Selected sound effect: unsaved preview.'
        : 'Selected sound effect: none.';
    const savedRecordingsText = soundEffectLines.length > 0
      ? ['Sound effects:', ...soundEffectLines].join('\n')
      : 'Sound effects: none yet.';
    const jumpscareRecordingId = this.getMicrophoneJumpscareRecordingId();
    const jumpscareText = jumpscareRecordingId
      ? `Jumpscare sound effect: ${this.formatMicrophoneSoundLabel(jumpscareRecordingId)}.`
      : 'Jumpscare sound effect: default scare sound.';
    const savedState = this.microphoneSoundSaved
      ? `Saved sound: ${this.microphoneSoundPreviewRecordingId ? this.formatMicrophoneSoundLabel(this.microphoneSoundPreviewRecordingId) : 'ready'}.`
      : this.microphoneSoundPreviewUrl
        ? 'Recorded sound: preview ready, not saved yet.'
        : 'Recorded sound: none yet.';
    return [
      'Microphone Sound Tool',
      '1. Press E to start recording.',
      '2. Make the sound effect into the microphone.',
      '3. Press E again to stop.',
      '4. Left click previews the selected sound.',
      '5. Press D to save as the next sound number: sound 009, sound 010, sound 011, sound 100, and beyond.',
      '6. Press number keys to play saved sound effects from the list.',
      '',
      'Tell Codex: I want sound 001 only.',
      'Right click deletes the selected sound effect or unsaved preview.',
      '',
      savedRecordingsText,
      '',
      this.microphoneSoundRecording ? 'Status: recording now.' : `Status: ${this.microphoneSoundMessage}`,
      selectedText,
      jumpscareText,
      savedState,
    ].join('\n');
  }

  private getCameraToolHudText(): string {
    this.loadCameraToolCaptures();
    const pictureIds = this.cameraToolCaptures
      .filter((capture) => capture.kind === 'picture')
      .map((capture) => capture.id);
    const videoIds = this.cameraToolCaptures
      .filter((capture) => capture.kind === 'video')
      .map((capture) => capture.id);
    const selectedText = this.cameraToolPreviewKind && this.cameraToolPreviewCaptureId
      ? `Selected: ${this.formatCameraToolCaptureLabel(this.cameraToolPreviewKind, this.cameraToolPreviewCaptureId)}.`
      : this.cameraToolPreviewKind
        ? `Selected: unsaved ${this.cameraToolPreviewKind}.`
        : 'Selected: none.';
    const savedText = [
      pictureIds.length > 0 ? `Pictures: ${pictureIds.join(', ')}.` : 'Pictures: none yet.',
      videoIds.length > 0 ? `Videos: ${videoIds.join(', ')}.` : 'Videos: none yet.',
    ].join(' ');

    return [
      '1. Press 4 to equip the Camera Tool.',
      '2. Allow browser camera and microphone permission when it asks.',
      '3. Left click takes a picture preview.',
      '4. Press E to start video with microphone audio, then E again to stop.',
      '5. Press D to save the preview as picture 001 or video 001.',
      '',
      'Right click deletes the selected saved capture or unsaved preview.',
      this.cameraToolRecording ? 'Status: recording video now.' : `Status: ${this.cameraToolMessage}`,
      selectedText,
      savedText,
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

    if (this.chapterFourActive) {
      return [this.chapterFour.root];
    }

    if (this.chapterFiveActive) {
      return [this.chapterFive.root];
    }

    if (this.chapterSixActive) {
      return [this.chapterSix.root];
    }

    if (this.chapterSevenActive) {
      return [this.chapterSeven.root];
    }

    if (this.chapterEightActive) {
      return [this.chapterEight.root];
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

    const deletedCameraIds = this.officeSandboxChapterActive
      ? this.deletedOfficeSandboxSecurityCameraIds
      : this.deletedOfficeSecurityCameraIds;
    deletedCameraIds.add(securityCamera.id);
    this.saveDeletedOfficeSecurityCameras(
      this.officeSandboxChapterActive ? OFFICE_DELETED_CAMERA_SANDBOX_STORAGE_KEY : OFFICE_DELETED_CAMERA_STORAGE_KEY,
      deletedCameraIds,
    );
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
      this.pushStatus(`${securityCamera.label} deleted. No desk cameras are installed now.`, 2.8);
    } else {
      this.pushStatus(`${securityCamera.label} deleted from the desk camera system.`, 2.4);
    }
    this.gameplaySfxAudio.playSmallPanel(false);
    return true;
  }

  private loadDeletedOfficeSecurityCameras(storageKey: string, deletedCameraIds: Set<number>): void {
    try {
      const rawCameraIds = window.localStorage.getItem(storageKey);
      if (!rawCameraIds) {
        return;
      }

      const parsedCameraIds: unknown = JSON.parse(rawCameraIds);
      if (!Array.isArray(parsedCameraIds)) {
        return;
      }

      parsedCameraIds.forEach((cameraId) => {
        if (typeof cameraId === 'number' && Number.isFinite(cameraId)) {
          deletedCameraIds.add(cameraId);
        }
      });
    } catch {
      deletedCameraIds.clear();
    }
  }

  private saveDeletedOfficeSecurityCameras(storageKey: string, deletedCameraIds: Set<number>): void {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify([...deletedCameraIds]),
      );
    } catch {
      // Camera deletion still works for the current session if local storage is unavailable.
    }
  }

  private applyDeletedOfficeSecurityCameras(chapter: OfficeChapterData, deletedCameraIds: Set<number>): void {
    if (deletedCameraIds.size === 0) {
      return;
    }

    for (let index = chapter.securityCameras.length - 1; index >= 0; index -= 1) {
      const securityCamera = chapter.securityCameras[index];
      if (!deletedCameraIds.has(securityCamera.id)) {
        continue;
      }

      securityCamera.root.removeFromParent();
      chapter.securityCameras.splice(index, 1);
    }

    if (chapter === this.officeChapter) {
      this.officeTabletCameraIndex = Math.min(
        this.officeTabletCameraIndex,
        Math.max(0, chapter.securityCameras.length - 1),
      );
    }
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
    const toolVisible = this.placementToolActive && this.player.isLocked() && !this.chapterMenuOpen && !this.officeJumpscareMenuOpen && !this.officeModeMenuOpen && !tabletActive && !this.microphoneSoundToolActive;
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

  private updateChapterFourBoxDisplay(): void {
    const boxVisible = this.chapterFourActive
      && this.player.isLocked()
      && !this.chapterMenuOpen
      && !this.officeJumpscareMenuOpen
      && !this.officeModeMenuOpen
      && !this.officeTabletHeld
      && !this.officeTabletCameraFeedActive
      && !this.placementToolActive;

    this.chapterFourBoxHeldAnchor.visible = boxVisible && this.chapterFourBoxHeld && !this.chapterFourBoxActive;
    this.chapterFourBoxHideAnchor.visible = boxVisible && this.chapterFourBoxActive && this.chapterFourBoxViewMode === 'normal';
    this.chapterFourBoxWideAnchor.visible = false;
    this.chapterFourBoxWorldAnchor.visible = boxVisible && this.chapterFourBoxActive && this.chapterFourBoxViewMode === 'wide';
    if (this.chapterFourBoxWorldAnchor.visible) {
      const playerPosition = this.player.getPosition();
      this.camera.getWorldDirection(this.chapterFourBoxCameraForward);
      this.chapterFourBoxCameraForward.y = 0;
      if (this.chapterFourBoxCameraForward.lengthSq() < 0.0001) {
        this.chapterFourBoxCameraForward.set(0, 0, -1);
      }
      this.chapterFourBoxCameraForward.normalize();
      this.chapterFourBoxWorldAnchor.position.set(
        playerPosition.x,
        playerPosition.y - GAME_CONFIG.player.height,
        playerPosition.z,
      );
      this.chapterFourBoxWorldAnchor.rotation.y = Math.atan2(this.chapterFourBoxCameraForward.x, this.chapterFourBoxCameraForward.z);
    }
  }

  private updateChapterSevenBoxDisplay(): void {
    this.chapterSevenBoxHideAnchor.visible = false;
    this.chapterSevenOvenHideAnchor.visible = false;
    this.chapterSevenOvenDoorOverlay.visible = false;
  }

  private updateChapterFourBlueJumpscareModel(): void {
    if (this.chapterFourBlueJumpscareTimer <= 0) {
      this.chapterFourBlueJumpscareAnchor.visible = false;
      return;
    }

    const progress = MathUtils.clamp(
      1 - this.chapterFourBlueJumpscareTimer / CHAPTER_FOUR_BLUE_JUMPSCARE_DURATION,
      0,
      1,
    );

    this.chapterFourBlueJumpscareAnchor.visible = false;
    this.chapterFour.updateBlueJumpscareView(progress);
  }

  private updateChapterFourGreenJumpscareModel(): void {
    if (this.chapterFourGreenJumpscareTimer <= 0) {
      this.chapterFourGreenJumpscareAnchor.visible = false;
      return;
    }

    const progress = MathUtils.clamp(
      1 - this.chapterFourGreenJumpscareTimer / CHAPTER_FOUR_GREEN_JUMPSCARE_DURATION,
      0,
      1,
    );

    this.chapterFourGreenJumpscareAnchor.visible = false;
    this.chapterFour.updateGreenJumpscareView(progress);
  }

  private updateMicrophoneSoundToolDisplay(): void {
    const tabletActive = this.officeChapterActive && (this.officeTabletHeld || this.officeTabletCameraFeedActive);
    this.microphoneSoundToolAnchor.visible = this.microphoneSoundToolActive
      && this.player.isLocked()
      && !this.chapterMenuOpen
      && !this.officeJumpscareMenuOpen
      && !this.officeModeMenuOpen
      && !tabletActive
      && !this.placementToolActive
      && !(this.chapterFourActive && this.chapterFourBoxActive);
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

  private updateOfficePrizeItemDisplay(): void {
    const lollipopUseVisible = this.officeLollipopUseTimer > 0;
    const displayItem = lollipopUseVisible
      ? 'lollipop'
      : this.officeHeldPrizeItem !== 'glass'
        ? this.officeHeldPrizeItem
        : null;
    const visible = this.officeChapterActive
      && displayItem !== null
      && this.player.isLocked()
      && !this.chapterMenuOpen
      && !this.officeJumpscareMenuOpen
      && !this.officeModeMenuOpen
      && !this.officeTabletCameraFeedActive
      && !this.placementToolActive
      && !this.microphoneSoundToolActive;

    this.officePrizeItemAnchor.visible = visible;
    this.officePrizeItemModels.forEach((model, item) => {
      model.visible = visible && item === displayItem;
    });

    const raiseProgress = lollipopUseVisible
      ? Math.sin(MathUtils.clamp(1 - this.officeLollipopUseTimer / 0.72, 0, 1) * Math.PI)
      : 0;
    this.officePrizeItemAnchor.position.set(
      0.34,
      -0.46 + raiseProgress * 0.24,
      -0.62 - raiseProgress * 0.22,
    );
    this.officePrizeItemAnchor.rotation.set(
      0.1 - raiseProgress * 0.22,
      -0.24,
      0.06 + raiseProgress * 0.08,
    );
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
        return 'Chapter 1: scary-sushi';
      case 'chapter-2':
        return 'Chapter 2: daycare horror';
      case 'chapter-3':
        return "Chapter 3: five nights at Bori's";
      case 'chapter-3-copy':
        return "Chapter 3 Copy: Bori's map sandbox";
      case 'chapter-4':
        return 'Chapter 4: rainbow friends';
      case 'chapter-5':
        return 'Chapter 5: space adventure/horror';
      case 'chapter-6':
        return 'Chapter 6: Minecraft';
      case 'chapter-7':
        return 'Chapter 7: The House';
      case 'chapter-8':
        return 'Chapter 8: The Woods';
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
    const targetCameraFar = this.chapterFiveActive || this.chapterSixActive || this.chapterSevenActive || this.chapterEightActive ? 980 : GAME_CONFIG.camera.far;
    if (Math.abs(this.camera.far - targetCameraFar) > 0.01) {
      this.camera.far = targetCameraFar;
      this.camera.updateProjectionMatrix();
    }

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
      this.lighting.ambient.intensity = MathUtils.lerp(0.76, nightLighting.ambient, nightBlend);
      this.lighting.hemisphere.intensity = MathUtils.lerp(0.98, nightLighting.hemisphere, nightBlend);
      this.lighting.flashlight.intensity = MathUtils.lerp(
        GAME_CONFIG.flashlight.intensity * 0.48,
        nightLighting.flashlightIntensity,
        nightBlend,
      );
      this.lighting.flashlight.distance = MathUtils.lerp(17, nightLighting.flashlightDistance, nightBlend);
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

    if (this.chapterFourActive) {
      this.lighting.ambient.intensity = 0.74;
      this.lighting.hemisphere.intensity = 0.9;
      this.lighting.flashlight.intensity = GAME_CONFIG.flashlight.intensity * 0.34;
      this.lighting.flashlight.distance = 13;

      if (this.scene.background instanceof Color) {
        this.scene.background.copy(this.officeChapterFogColor);
      }

      if (this.scene.fog instanceof Fog) {
        this.scene.fog.color.copy(this.officeChapterFogColor);
        this.scene.fog.near = 42;
        this.scene.fog.far = 150;
      }

      return;
    }

    if (this.chapterFiveActive) {
      this.lighting.ambient.intensity = 0.26;
      this.lighting.hemisphere.intensity = 0.22;
      this.lighting.flashlight.intensity = GAME_CONFIG.flashlight.intensity * 0.42;
      this.lighting.flashlight.distance = 10;

      if (this.scene.background instanceof Color) {
        this.scene.background.setHex(0x112c3f);
      }

      if (this.scene.fog instanceof Fog) {
        this.scene.fog.color.setHex(0x18364a);
        this.scene.fog.near = 620;
        this.scene.fog.far = 1280;
      }

      return;
    }

    if (this.chapterSixActive) {
      this.lighting.ambient.intensity = 0.76;
      this.lighting.hemisphere.intensity = 0.9;
      this.lighting.flashlight.intensity = GAME_CONFIG.flashlight.intensity * 0.3;
      this.lighting.flashlight.distance = 12;

      if (this.scene.background instanceof Color) {
        this.scene.background.setHex(0x8ccfff);
      }

      if (this.scene.fog instanceof Fog) {
        this.scene.fog.color.setHex(0x9bd7ff);
        this.scene.fog.near = 128;
        this.scene.fog.far = 360;
      }

      return;
    }

    if (this.chapterSevenActive) {
      this.lighting.ambient.intensity = 0.78;
      this.lighting.hemisphere.intensity = 1.12;
      this.lighting.flashlight.intensity = GAME_CONFIG.flashlight.intensity * 0.28;
      this.lighting.flashlight.distance = 18;

      if (this.scene.background instanceof Color) {
        this.scene.background.setHex(0x8fd7ff);
      }

      if (this.scene.fog instanceof Fog) {
        this.scene.fog.color.setHex(0xaadfff);
        this.scene.fog.near = 150;
        this.scene.fog.far = 620;
      }

      return;
    }

    if (this.chapterEightActive) {
      const nightBlend = this.chapterEight.getNightBlend();
      this.lighting.ambient.intensity = MathUtils.lerp(0.64, 0.035, nightBlend);
      this.lighting.hemisphere.intensity = MathUtils.lerp(0.86, 0.09, nightBlend);
      this.lighting.flashlight.intensity = MathUtils.lerp(GAME_CONFIG.flashlight.intensity * 0.34, GAME_CONFIG.flashlight.intensity * 1.35, nightBlend);
      this.lighting.flashlight.distance = MathUtils.lerp(16, 24, nightBlend);

      if (this.scene.background instanceof Color) {
        this.scene.background.setHex(0x8db8c3);
        this.scene.background.lerp(new Color(0x06080d), nightBlend);
      }

      if (this.scene.fog instanceof Fog) {
        this.scene.fog.color.setHex(0x9fb9af);
        this.scene.fog.color.lerp(new Color(0x07090d), nightBlend);
        this.scene.fog.near = MathUtils.lerp(72, 10, nightBlend);
        this.scene.fog.far = MathUtils.lerp(330, 84, nightBlend);
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
    const blend = this.activeJumpscare
      || this.activeOfficeJumpscare
      || this.chapterTwoBearRefusalTimer > 0
      || this.chapterFourPurpleJumpscareTimer > 0
      || this.chapterFourBlueJumpscareTimer > 0
      || this.chapterFourGreenJumpscareTimer > 0
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
      return this.officeSandboxChapterActive ? 'chapter-3-copy' : 'chapter-3';
    }

    if (this.chapterFourActive) {
      return 'chapter-4';
    }

    if (this.chapterFiveActive) {
      return 'chapter-5';
    }

    if (this.chapterSixActive) {
      return 'chapter-6';
    }

    if (this.chapterSevenActive) {
      return 'chapter-7';
    }

    if (this.chapterEightActive) {
      return 'chapter-8';
    }

    return this.chapterTwoActive ? 'chapter-2' : 'chapter-1';
  }

  private shouldSyncHudThisFrame(deltaSeconds: number, jumpscareLocked: boolean): boolean {
    const needsRealtimeHud = jumpscareLocked
      || this.chapterMenuOpen
      || this.officeJumpscareMenuOpen
      || this.officeModeMenuOpen
      || (this.chapterSixActive && this.chapterSix.isInventoryOpen())
      || this.placementToolActive
      || this.officeTabletCameraFeedActive
      || this.officeCameraPuppetPhase !== 'idle'
      || this.officeBallPitSlide !== null
      || this.officeVentDrop !== null
      || this.chapterTwoClimb !== null
      || this.chapterTwoSlide !== null
      || this.chapterTwoDodoNightAttack !== null;

    if (needsRealtimeHud) {
      this.hudSyncTimer = 0;
      return true;
    }

    this.hudSyncTimer = Math.max(0, this.hudSyncTimer - deltaSeconds);
    if (this.hudSyncTimer > 0) {
      return false;
    }

    this.hudSyncTimer = this.officeChapterActive
      ? CHAPTER_THREE_HUD_SYNC_INTERVAL
      : 1 / 20;
    return true;
  }

  private getIntroHudState(): { eyebrow: string; title: string; summary: string; buttonText: string } {
    if (this.chapterEightActive) {
      return {
        eyebrow: 'Chapter Eight',
        title: 'The Woods',
        summary: 'Walk through a dense horror forest and find a small cabin with a fireplace, bed, and iron stove.',
        buttonText: 'Enter The Woods',
      };
    }

    if (this.chapterSevenActive) {
      return {
        eyebrow: 'Chapter Seven',
        title: 'The House',
        summary: 'Start inside the house with the smaller fridge, counter cabinet, oven, longer cupboards, bookshelf, and table drawers.',
        buttonText: 'Walk Into The House',
      };
    }

    return {
      eyebrow: 'Studio Kitchen / Round 1',
      title: 'Scary Sushi',
      summary:
        'The challenge is live. Search the maze for raw ingredients, run them through the labeled machines, build the salmon and tuna rolls, and send them down the judges belt.',
      buttonText: 'Step Onto The Set',
    };
  }

  private syncHud(): void {
    const locked = this.player.isLocked();
    const currentChapter = this.getCurrentHudChapterId();

    this.hud.setTheme(this.doomModeActive ? 'doom' : 'default');
    this.hud.setCrosshairMode(
      this.chapterSixActive
        ? 'minecraft'
        : this.zombieModeActive || this.doomModeActive || this.officeChapterActive || this.chapterFourActive || this.chapterFiveActive
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
    const intro = this.getIntroHudState();
    this.hud.setIntro(intro.eyebrow, intro.title, intro.summary, intro.buttonText);
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
        ? 'Chapter: Zombie FPS'
        : this.doomModeActive
          ? 'Mode: Doom Run'
          : this.officeChapterActive
            ? "Chapter: five nights at Bori's"
            : this.chapterFourActive
              ? 'Chapter: rainbow friends'
              : this.chapterFiveActive
                ? 'Chapter: space adventure/horror'
                : this.chapterSixActive
                  ? 'Chapter: Minecraft'
                  : this.chapterSevenActive
                    ? 'Chapter: Chapter 7: The House'
                    : this.chapterEightActive
                      ? 'Chapter: Chapter 8: The Woods'
                      : this.chapterTwoActive
                    ? 'Chapter: daycare horror'
                    : 'Chapter: scary-sushi',
    );
    this.hud.setChapterMenu(this.chapterMenuOpen, currentChapter);
    this.hud.setCuratorTool(this.curatorToolOpen);
    this.hud.setCompass(
      this.chapterFiveActive && !this.chapterFive.isInteriorMode(),
      this.chapterFive.getCompassHeadingDegrees(),
    );
    const chapterFiveMonitor = this.chapterFive.getMonitorState();
    this.hud.setChapterFiveMonitor(
      this.chapterFiveActive && this.chapterFive.isInteriorMode() && chapterFiveMonitor.active,
      chapterFiveMonitor,
    );
    this.hud.setOfficeJumpscareMenu(
      this.officeJumpscareMenuOpen,
      this.officeJumpscareMenuOpen ? this.getOfficeJumpscareOptions() : [],
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
      this.placementToolActive ? this.getPlacementToolHudText() : '',
      this.placementToolActive ? this.getPlacementMarkerCopyText() : '',
    );
    this.hud.setMicrophoneTool(
      this.microphoneSoundToolActive,
      this.microphoneSoundToolActive ? this.getMicrophoneSoundToolHudText() : '',
    );
    this.hud.setCameraTool(
      this.cameraToolActive,
      this.cameraToolActive ? this.getCameraToolHudText() : '',
    );
    const tabletCameraHudActive = this.officeChapterActive && this.officeTabletCameraFeedActive;
    this.hud.setTabletCameras(
      tabletCameraHudActive,
      tabletCameraHudActive ? this.getActiveOfficeTabletCamera()?.label ?? 'No Camera Installed' : '',
      tabletCameraHudActive ? this.getOfficeTabletCameraSlots() : [],
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
      this.officeGameModePowerOut ? 'out' : 'normal',
    );
    const microphoneListening = this.voiceInput.isActive();
    this.hud.setMicrophone(
      this.officeChapterActive,
      this.officeMicrophoneEnabled,
      microphoneListening,
      this.voiceInput.isBlocked(),
      this.officeMicrophoneEnabled && microphoneListening ? Math.max(this.officePlayerVoiceLevel, this.voiceInput.getLevel()) : 0,
    );
    const hideChapterFourInventory = this.chapterFourActive && this.chapterFourBoxActive;
    this.hud.setInventory(hideChapterFourInventory ? '' : this.getInventoryText());
    this.hud.setMinecraftInventory(
      this.chapterSixActive && this.chapterSix.isInventoryOpen(),
      this.chapterSix.getInventoryView(),
    );
    const promptText = this.getPromptText(locked);
    this.hud.setPrompt(promptText);
    this.hud.setActionPrompt(this.getActionPromptText(locked, promptText));
    this.hud.setHealth(this.health / GAME_CONFIG.player.healthMax);
    this.hud.setStamina(
      this.doomModeActive
        ? this.doomArmor / 100
        : this.stamina / GAME_CONFIG.player.staminaMax,
    );
    this.hud.setHotbar(hideChapterFourInventory ? [] : this.getHotbarSlots());
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
    const officeDeathNoticeDuration = this.officeDeathNoticePhase === 'died'
      ? OFFICE_DEATH_DIED_NOTICE_SECONDS
      : OFFICE_DEATH_FIRED_NOTICE_SECONDS;
    this.hud.setOfficeDeathNotice(
      this.officeDeathNoticePhase !== null,
      this.officeDeathNoticePhase ?? 'died',
      this.officeDeathNoticePhase
        ? 1 - this.officeDeathNoticeTimer / officeDeathNoticeDuration
        : 0,
    );
    this.hud.setBallPitHidden(this.officeChapterActive && this.officeBallPitHidden);
    const chapterFourCrouchInstructionsActive = this.chapterFourActive
      && locked
      && !this.chapterMenuOpen
      && !this.officeJumpscareMenuOpen
      && !this.officeModeMenuOpen
      && !this.chapterFourBoxActive
      && this.chapterFourPurpleJumpscareTimer <= 0
      && this.chapterFourBlueJumpscareTimer <= 0
      && this.chapterFourGreenJumpscareTimer <= 0
      && this.chapterFourLockerId === null;
    const chapterSevenCrawlInstructionsActive = this.chapterSevenActive
      && !this.chapterMenuOpen
      && !this.officeJumpscareMenuOpen
      && !this.officeModeMenuOpen;
    this.hud.setCrouchInstructions(
      chapterFourCrouchInstructionsActive || chapterSevenCrawlInstructionsActive,
      this.chapterSevenActive ? this.chapterSevenCrawling : this.chapterFourCrouching,
      chapterSevenCrawlInstructionsActive ? 'Hold Spacebar for 2 seconds to crawl.' : undefined,
      chapterSevenCrawlInstructionsActive ? 'Crawl' : undefined,
    );
    this.level.stationAnimator.setPlateState({
      holdingPlate: this.holdingPlate,
      recipeId: this.plateRecipeId,
      stagedIngredients: this.plateIngredients,
      platedRecipeId: this.platedRecipeId,
    });

    if (this.chapterMenuOpen) {
      this.hud.setStatus('Chapter menu open. Choose a chapter or mode with the mouse.');
      return;
    }

    if (this.curatorToolOpen) {
      this.hud.setStatus('Character Creator open. Build a design, save a character slot, or press K again to close it.');
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
              : this.chapterFourActive
                ? 'Pointer unlocked. Click the play space to keep exploring Chapter 4.'
                : this.chapterFiveActive
                  ? this.chapterFive.isInteriorMode()
                    ? 'Pointer unlocked. Click the play space to keep walking inside the Chapter 5 spaceship.'
                    : 'Pointer unlocked. Click the play space to keep flying through Chapter 5.'
                  : this.chapterSevenActive
                    ? 'Pointer unlocked. Click the play space to keep walking around Chapter 7: The House.'
                    : this.chapterEightActive
                      ? 'Pointer unlocked. Click the play space to keep walking around Chapter 8: The Woods.'
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

    if (this.microphoneSoundToolActive) {
      if (this.microphoneSoundRecording) {
        this.stopMicrophoneSoundRecording();
      } else {
        void this.startMicrophoneSoundRecording();
      }
      return;
    }

    if (this.cameraToolActive) {
      void this.toggleCameraToolVideoRecording();
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

    if (this.chapterFourActive) {
      this.handleChapterFourInteract();
      return;
    }

    if (this.chapterFiveActive) {
      const monitor = this.chapterFive.getMonitorState();
      if (this.chapterFive.isInteriorMode() && monitor.landed && !monitor.active) {
        this.stepOutToChapterFiveSurface();
        return;
      }

      if (this.chapterFive.isSurfaceMode()) {
        this.pushStatus('You are outside on the planet surface. Walk around the landed ship, hills, and abandoned structures.', 2.6);
        return;
      }

      const message = this.chapterFive.interactCockpitControl(this.player.getPosition());
      if (this.chapterFive.getMonitorState().active) {
        this.syncHud();
        this.player.controls.unlock();
      }
      this.pushStatus(message ?? 'Nothing on the spaceship console is close enough to use.', 2.6);
      return;
    }

    if (this.chapterSixActive) {
      const nextOpen = !this.chapterSix.isInventoryOpen();
      this.chapterSix.setInventoryOpen(nextOpen);
      if (nextOpen) {
        this.player.controls.unlock();
        this.pushStatus('Inventory open. Left click moves stacks, right click moves one item, and E closes it.', 2.8);
      } else {
        this.player.lock();
        this.pushStatus('Inventory closed. Select a hotbar block and right click a block face to place it.', 2.4);
      }
      this.syncHud();
      return;
    }

    if (this.chapterSevenActive) {
      if (this.chapterSevenSwingSeated) {
        this.leaveChapterSevenSwing();
        return;
      }

      if (this.chapterSevenBoxHidden) {
        this.openChapterSevenCardboardBoxFromInside();
        return;
      }

      if (this.chapterSevenOvenHidden) {
        this.openChapterSevenOvenFromInside();
        return;
      }

      if (
        this.chapterSeven.cardboardBox.open
        && this.chapterSevenCrawling
        && this.isPlayerInsideChapterSevenCardboardBox()
      ) {
        this.hideInsideChapterSevenCardboardBox();
        return;
      }

      if (
        this.chapterSeven.houseOven.open
        && this.chapterSevenCrawling
        && this.isPlayerInsideChapterSevenOven()
      ) {
        this.hideInsideChapterSevenOven();
        return;
      }

      const interactable = this.getLookedAtChapterSevenInteractable();
      const nearestSwing = interactable?.kind === 'swing'
        ? interactable.item
        : this.getNearestChapterSevenSwing();
      if (!interactable && nearestSwing) {
        this.enterChapterSevenSwing();
        return;
      }

      const nearestBathtubFaucet = interactable?.kind === 'rear-fixture' && interactable.item.kind === 'bathtub'
        ? interactable.item
        : this.getNearestChapterSevenBathtubFaucet();
      if (!interactable && nearestBathtubFaucet) {
        this.toggleChapterSevenBathtubFaucet(nearestBathtubFaucet);
        return;
      }

      const manualDoor = this.getNearestChapterSevenManualDoor();
      if (manualDoor && !interactable) {
        manualDoor.targetOpenAmount = manualDoor.targetOpenAmount > 0.5 ? 0 : 1;
        manualDoor.open = manualDoor.targetOpenAmount > 0.5;
        this.gameplaySfxAudio.playClosetDoor(manualDoor.open);
        this.pushStatus(
          manualDoor.open
            ? `${manualDoor.label} slides open.`
            : `${manualDoor.label} slides closed.`,
          2.4,
        );
        return;
      }

      if (interactable?.kind === 'cupboard') {
        const cupboard = interactable.item;
        cupboard.targetOpenAmount = cupboard.targetOpenAmount > 0.5 ? 0 : 1;
        cupboard.open = cupboard.targetOpenAmount > 0.5;
        this.gameplaySfxAudio.playClosetDoor(cupboard.open);
        this.pushStatus(
          cupboard.open
            ? `${cupboard.label} swing open.`
            : `${cupboard.label} swing closed.`,
          2.4,
        );
        return;
      }

      if (interactable?.kind === 'fridge') {
        const fridge = interactable.item;
        fridge.targetOpenAmount = fridge.targetOpenAmount > 0.5 ? 0 : 1;
        fridge.open = fridge.targetOpenAmount > 0.5;
        this.gameplaySfxAudio.playClosetDoor(fridge.open);
        this.pushStatus(
          fridge.open
            ? 'The fridge opens. There is milk, fruit, and cookies inside.'
            : 'The fridge closes.',
          2.4,
        );
        return;
      }

      if (interactable?.kind === 'kitchen-sink') {
        this.handleChapterSevenFaucetToggle();
        return;
      }

      if (interactable?.kind === 'drawer') {
        const drawer = interactable.item;
        drawer.targetOpenAmount = drawer.targetOpenAmount > 0.5 ? 0 : 1;
        drawer.open = drawer.targetOpenAmount > 0.5;
        this.gameplaySfxAudio.playClosetDoor(drawer.open);
        const cookieLine = drawer.cookieCount === 0
          ? ' It is empty.'
          : drawer.cookieCount === 1
            ? ' There is one cookie inside.'
            : ` There are ${drawer.cookieCount} cookies inside.`;
        this.pushStatus(
          drawer.open
            ? `${drawer.label} slides open.${cookieLine}`
            : `${drawer.label} slides closed.`,
          2.4,
        );
        return;
      }

      if (interactable?.kind === 'cardboard-box') {
        const cardboardBox = interactable.item;
        if (cardboardBox.open && this.chapterSevenCrawling && this.isPlayerInsideChapterSevenCardboardBox()) {
          this.hideInsideChapterSevenCardboardBox();
          return;
        }

        cardboardBox.targetOpenAmount = cardboardBox.targetOpenAmount > 0.5 ? 0 : 1;
        cardboardBox.open = cardboardBox.targetOpenAmount > 0.5;
        this.gameplaySfxAudio.playClosetDoor(cardboardBox.open);
        this.pushStatus(
          cardboardBox.open
            ? 'The cardboard box flaps fold open. Press Space to jump, or hold Space for 2 seconds to crawl.'
            : 'The cardboard box flaps fold shut.',
          2.4,
        );
        return;
      }

      if (interactable?.kind === 'old-wooden-closet') {
        const closet = interactable.item;
        closet.targetOpenAmount = closet.targetOpenAmount > 0.5 ? 0 : 1;
        closet.open = closet.targetOpenAmount > 0.5;
        this.gameplaySfxAudio.playClosetDoor(closet.open);
        this.pushStatus(
          closet.open
            ? 'The old wooden closet doors swing open. It is empty inside.'
            : 'The old wooden closet doors close around the empty space.',
          2.4,
        );
        return;
      }

      if (interactable?.kind === 'rear-fixture') {
        const fixture = interactable.item;
        if (fixture.kind === 'bathtub') {
          this.toggleChapterSevenBathtubFaucet(fixture);
          return;
        }

        fixture.targetOpenAmount = fixture.targetOpenAmount > 0.5 ? 0 : 1;
        fixture.open = fixture.targetOpenAmount > 0.5;
        if (fixture.kind === 'bathroom-sink') {
          this.gameplaySfxAudio.playSmallPanel(fixture.open);
          this.pushStatus(
            fixture.open
              ? 'You turn on the bathroom sink. Water pours into the bowl.'
              : 'You turn off the bathroom sink.',
            2.2,
          );
        } else if (fixture.kind === 'trash-can') {
          this.gameplaySfxAudio.playClosetDoor(fixture.open);
          this.pushStatus(
            fixture.open
              ? 'You flip open the trash can lid.'
              : 'You close the trash can lid.',
            2.2,
          );
        } else {
          this.gameplaySfxAudio.playClosetDoor(fixture.open);
          this.pushStatus(
            fixture.open
              ? `${fixture.label} opens.`
              : `${fixture.label} closes.`,
            2.2,
          );
        }
        return;
      }

      if (interactable?.kind === 'swing') {
        this.enterChapterSevenSwing();
        return;
      }

      if (interactable?.kind === 'oven') {
        const oven = interactable.item;
        if (oven.open && this.chapterSevenCrawling && this.isPlayerInsideChapterSevenOven()) {
          this.hideInsideChapterSevenOven();
          return;
        }

        oven.targetOpenAmount = oven.targetOpenAmount > 0.5 ? 0 : 1;
        oven.open = oven.targetOpenAmount > 0.5;
        this.gameplaySfxAudio.playClosetDoor(oven.open);
        this.pushStatus(
          oven.open
            ? 'The oven door folds open.'
            : 'The oven door closes.',
          2.4,
        );
        return;
      }

      this.pushStatus('Look directly at the fridge, oven, cupboard, drawer, cardboard box, wooden closet, swing set, or rear-room fixture you want, then press E.', 2.6);
      return;
    }

    if (this.chapterEightActive) {
      this.handleChapterEightInteract();
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
    this.clearOfficeHeldPrizeItem();
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
    return null;
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
      if (this.getNearestOfficeCameraMonitors()) {
        this.toggleOfficeTabletCameraFeed();
        return;
      }

      const officeButton = this.getNearestOfficeButton();
      if (officeButton && this.handleOfficeButtonInteraction(officeButton)) {
        return;
      }

      if (this.officeHeldPrizeItem && this.handleOfficePrizeFire()) {
        return;
      }

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

    if (this.chapterEightActive) {
      this.handleChapterEightFire();
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

  private handleChapterEightFire(): void {
    if (!this.player.isLocked() || this.chapterMenuOpen) {
      return;
    }

    if (this.chapterEightHeldItem === 'military-knife') {
      this.startChapterEightKnifeAttack('slash');
      return;
    }

    this.pushStatus('Hold the Military Knife to slash or stab.', 1.6);
  }

  private handleChapterEightSecondaryFire(): void {
    if (!this.player.isLocked() || this.chapterMenuOpen) {
      return;
    }

    if (this.chapterEightHeldItem === 'military-knife') {
      this.startChapterEightKnifeAttack('stab');
      return;
    }
  }

  private startChapterEightKnifeAttack(mode: 'slash' | 'stab'): void {
    this.chapterEightKnifeAttackMode = mode;
    this.chapterEightKnifeAttackTimer = CHAPTER_EIGHT_KNIFE_ATTACK_SECONDS;
    this.pushStatus(mode === 'slash' ? 'You slash the Military Knife through the air.' : 'You thrust the Military Knife forward.', 0.9);
  }

  private handleChapterEightInteract(): void {
    if (this.isNearChapterEightDoorLock()) {
      const changed = this.chapterEight.toggleDoorLock();
      this.pushStatus(
        changed
          ? this.chapterEight.door.locked
            ? 'You slide the cabin door lock into place. Nothing outside can open it.'
            : 'You unclip the cabin door lock.'
          : 'Close the cabin door before locking it.',
        2.4,
      );
      return;
    }

    if (this.isNearChapterEightDoor()) {
      const changed = this.chapterEight.toggleDoor();
      this.pushStatus(
        changed
          ? this.chapterEight.door.open
            ? 'You open the cabin door.'
            : 'You close the cabin door.'
          : 'The cabin door is locked from the inside.',
        1.9,
      );
      return;
    }

    if (this.isNearChapterEightSleepSpot()) {
      const slept = this.chapterEight.sleepUntilMorning();
      this.pushStatus(
        slept
          ? 'You sleep through the night. Morning comes back to the woods.'
          : this.chapterEight.isNight()
            ? 'You already slept this day. Wait until the next day before sleeping again.'
            : 'You can only sleep through the night.',
        2.6,
      );
      return;
    }

    if (this.isNearChapterEightFireplace() && !this.chapterEight.hasTorch()) {
      const crafted = this.chapterEight.craftTorch();
      if (crafted) {
        this.selectChapterEightHeldItem('torch');
        this.pushStatus('You make a torch from the fire. It lights the woods around you when held.', 2.8);
      } else {
        this.pushStatus('The fireplace needs to be burning before you can make a torch.', 2.2);
      }
      return;
    }

    if (this.isNearChapterEightStove()) {
      this.chapterEight.stove.open = !this.chapterEight.stove.open;
      this.pushStatus(
        this.chapterEight.stove.open
          ? 'You open the cast iron stove and see the brown firebox inside.'
          : 'You close the cast iron stove.',
        2.0,
      );
      return;
    }

    if (this.isNearChapterEightWaterPump()) {
      this.chapterEight.activateWaterPump();
      this.pushStatus('You pump the handle. Water starts pouring from the spout.', 2.2);
      return;
    }

    this.pushStatus('Nothing here needs pumping or opening.', 1.8);
  }

  private isNearChapterEightWaterPump(): boolean {
    return this.player.getPosition().distanceTo(this.chapterEight.waterPump.interactPosition) <= GAME_CONFIG.player.interactionRange + 0.8;
  }

  private isNearChapterEightStove(): boolean {
    return this.player.getPosition().distanceTo(this.chapterEight.stove.interactPosition) <= GAME_CONFIG.player.interactionRange + 0.55;
  }

  private isNearChapterEightDoor(): boolean {
    const playerPosition = this.player.getPosition();
    return Math.abs(playerPosition.x - this.chapterEight.door.interactPosition.x) <= 1.85
      && Math.abs(playerPosition.z - this.chapterEight.door.interactPosition.z) <= GAME_CONFIG.player.interactionRange + 0.95;
  }

  private isNearChapterEightDoorLock(): boolean {
    const playerPosition = this.player.getPosition();
    const standingAtInsideBolt = playerPosition.x > this.chapterEight.door.interactPosition.x + 0.62
      && Math.abs(playerPosition.x - this.chapterEight.door.lockPosition.x) <= 0.72
      && Math.abs(playerPosition.z - this.chapterEight.door.lockPosition.z) <= 0.9;
    return playerPosition.z < this.chapterEight.door.interactPosition.z
      && standingAtInsideBolt;
  }

  private isNearChapterEightSleepSpot(): boolean {
    return this.player.getPosition().distanceTo(this.chapterEight.sleepSpot.interactPosition) <= GAME_CONFIG.player.interactionRange + 0.9;
  }

  private isNearChapterEightFireplace(): boolean {
    return this.player.getPosition().distanceTo(this.chapterEight.fireplacePosition) <= GAME_CONFIG.player.interactionRange + 1.0;
  }

  private handleChapterEightMonsterEvents(): void {
    let event = this.chapterEight.consumeMonsterEvent();
    while (event) {
      switch (event) {
        case 'night-start':
          this.gameplaySfxAudio.playOfficeJumpscareCue('hook-scrape');
          this.pushStatus('Night falls over the woods. Something starts moving between the trees.', 3.0);
          break;
        case 'day-start':
          this.pushStatus('Daylight returns, and the red-eyed figure disappears.', 2.5);
          break;
        case 'stalk':
          this.gameplaySfxAudio.playOfficeJumpscareCue('hook-scrape');
          this.pushStatus('A creepy scrape echoes nearby. Look around and you might see red eyes watching.', 2.8);
          break;
        case 'chase':
          this.gameplaySfxAudio.playOfficeJumpscareCue('broken-crawl');
          this.pushStatus('The black figure drops low and crawls straight toward you. Get inside, close the door, and lock it.', 3.1);
          break;
        case 'blocked':
          this.gameplaySfxAudio.playOfficeJumpscareCue('bear-grab');
          this.pushStatus('The locked cabin door rattles hard, but the monster cannot get in.', 2.8);
          break;
        case 'caught':
          this.gameplaySfxAudio.playOfficeJumpscareCue('bear-grab');
          this.health = Math.max(0, this.health - 45);
          this.pushStatus('The red-eyed figure lunges into your face before vanishing back into the trees.', 3.0);
          break;
      }
      event = this.chapterEight.consumeMonsterEvent();
    }
  }

  private handleOfficePrizeFire(): boolean {
    switch (this.officeHeldPrizeItem) {
      case 'glass':
        this.throwOfficeGlass();
        return true;
      case 'tiny-bear':
        this.throwOfficeTinyBear();
        return true;
      case 'lollipop':
        this.useOfficeLollipop();
        return true;
      case 'stuffie':
        this.playOfficePrizeToySound();
        this.pushStatus('The stuffie peeps when you squish it.', 1.8);
        return true;
      case 'duck-toy':
        this.pushStatus('The tiny duck toy looks like Quacky in your hand.', 1.8);
        return true;
      default:
        return false;
    }
  }

  private playOfficePrizeToySound(): void {
    this.gameplaySfxAudio.resume();
    if (!this.playMicrophoneSoundEffect(() => this.gameplaySfxAudio.playStuffiePeep(), OFFICE_STUFFIE_SOUND_RECORDING_ID)) {
      this.gameplaySfxAudio.playStuffiePeep();
    }
  }

  private useOfficeLollipop(): void {
    if (!this.consumeOfficePrizeItem('lollipop')) {
      this.pushStatus('No lollipop is left in your hotbar.', 1.6);
      return;
    }

    this.officeLollipopUseTimer = 0.72;
    this.officeLollipopBoostRemaining = OFFICE_LOLLIPOP_BOOST_SECONDS;
    this.officeHeldPrizeItem = null;
    this.officeGlassHeld = false;
    this.officeGlassAnchor.visible = false;
    this.gameplaySfxAudio.playSmallPanel(false);
    this.pushStatus('You eat the lollipop. For 10 seconds, you run twice as fast while the animatronics stay the same speed.', 3.2);
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
    if (this.getOfficePrizeItemCount('glass') <= 0) {
      this.clearOfficeHeldPrizeItem();
      this.pushStatus('No glass cup is left in your hotbar.', 1.6);
      return;
    }

    const throwStart = this.officeGlassAnchor.getWorldPosition(new Vector3());
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const root = this.createOfficeGlassModel();
    root.position.copy(throwStart);
    root.quaternion.copy(this.camera.quaternion);
    root.scale.setScalar(0.9);
    this.scene.add(root);

    this.consumeOfficePrizeItem('glass');
    this.officeHeldPrizeItem = null;
    this.officeGlassHeld = false;
    this.officeGlassAnchor.visible = false;
    this.officeGlassThrows.push({
      root,
      velocity: forward.multiplyScalar(11.5).add(new Vector3(0, 1.9, 0)),
      elapsed: 0,
      crashElapsed: 0,
      crashed: false,
      kind: 'glass',
    });
    this.gameplaySfxAudio.playSmallPanel(false);
    this.pushStatus('You throw the glass. It is about to shatter.', 1.4);
  }

  private throwOfficeTinyBear(): void {
    if (this.getOfficePrizeItemCount('tiny-bear') <= 0) {
      this.clearOfficeHeldPrizeItem();
      this.pushStatus('No tiny bear is left in your hotbar.', 1.6);
      return;
    }

    const throwStart = this.officePrizeItemAnchor.getWorldPosition(new Vector3());
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const root = this.createOfficeTinyBearToyModel(false);
    root.position.copy(throwStart);
    root.quaternion.copy(this.camera.quaternion);
    root.scale.setScalar(1.05);
    this.scene.add(root);

    this.consumeOfficePrizeItem('tiny-bear');
    this.officeHeldPrizeItem = null;
    this.officePrizeItemAnchor.visible = false;
    this.officeGlassThrows.push({
      root,
      velocity: forward.multiplyScalar(10.2).add(new Vector3(0, 1.55, 0)),
      elapsed: 0,
      crashElapsed: 0,
      crashed: false,
      kind: 'tiny-bear',
    });
    this.pushStatus('You throw the tiny bear. It will squeak when it hits the floor.', 1.8);
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
      } else {
        thrown.crashElapsed += deltaSeconds;
      }

      const visibleSeconds = thrown.kind === 'glass'
        ? OFFICE_GLASS_SHARD_VISIBLE_SECONDS
        : OFFICE_TINY_BEAR_VISIBLE_SECONDS;
      if (thrown.crashed && thrown.crashElapsed > visibleSeconds) {
        thrown.root.parent?.remove(thrown.root);
        this.officeGlassThrows.splice(index, 1);
      }
    }
  }

  private crashOfficeGlassThrow(thrown: ActiveOfficeGlassThrow): void {
    thrown.crashed = true;
    thrown.crashElapsed = 0;
    thrown.root.rotation.set(0, 0, 0);
    thrown.root.position.y = 0.04;

    if (thrown.kind === 'tiny-bear') {
      if (!this.playMicrophoneSoundEffect(() => this.gameplaySfxAudio.playToySqueak(), OFFICE_THROW_SOUND_RECORDING_ID)) {
        this.gameplaySfxAudio.playToySqueak();
      }
      this.distractOfficeGameModeAnimatronics(thrown.root.position, 'tiny-bear');
      return;
    }

    thrown.root.clear();
    if (!this.playMicrophoneSoundEffect(() => this.gameplaySfxAudio.playGlassCrash(), OFFICE_THROW_SOUND_RECORDING_ID)) {
      this.gameplaySfxAudio.playGlassCrash();
    }
    this.distractOfficeGameModeAnimatronics(thrown.root.position, 'glass');

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

  private createOfficeJumpscareVideoPlane(
    definition: OfficeJumpscareDefinition,
    src: string,
    sourceLabel: string,
  ): {
    mesh: Mesh;
    video: HTMLVideoElement;
    texture: VideoTexture;
    material: MeshBasicMaterial;
  } {
    const video = document.createElement('video');
    video.src = src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.currentTime = 0;
    const texture = new VideoTexture(video);
    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      depthTest: false,
    });
    const mesh = new Mesh(new PlaneGeometry(8.6, 5.2), material);
    mesh.position.set(0, 0, -3.7);
    mesh.renderOrder = 38;

    void video.play().catch(() => {
      this.pushStatus(`Click the play space once if ${definition.label} ${sourceLabel} does not start automatically.`, 2.4);
    });

    return { mesh, video, texture, material };
  }

  private createOfficeJumpscareCameraCapture(
    definition: OfficeJumpscareDefinition,
  ): {
    mesh: Mesh;
    video: HTMLVideoElement | null;
    texture: Texture | VideoTexture;
    material: MeshBasicMaterial;
  } | null {
    const assignment = OFFICE_JUMPSCARE_CAMERA_CAPTURE_ASSIGNMENTS[definition.animatronic];
    if (assignment) {
      const exactCapture = this.getCameraToolCaptureById(assignment.kind, assignment.id);
      const capture = exactCapture ?? this.getLatestCameraToolCapture(assignment.kind);
      if (!capture) {
        this.pushStatus(
          `${definition.label} is set to ${this.formatCameraToolCaptureLabel(assignment.kind, assignment.id)}, but no saved ${assignment.kind}s are in this browser.`,
          3.8,
        );
        return null;
      }

      if (!exactCapture) {
        this.pushStatus(
          `${this.formatCameraToolCaptureLabel(assignment.kind, assignment.id)} is not saved here, so ${definition.label} is using ${this.formatCameraToolCaptureLabel(capture.kind, capture.id)} instead.`,
          4.2,
        );
      }

      if (capture.kind === 'video') {
        return this.createOfficeJumpscareVideoPlane(
          definition,
          capture.dataUrl,
          this.formatCameraToolCaptureLabel(capture.kind, capture.id),
        );
      }

      const image = new Image();
      image.src = capture.dataUrl;
      const texture = new Texture(image);
      image.addEventListener('load', () => {
        texture.needsUpdate = true;
      }, { once: true });
      const material = new MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        depthTest: false,
      });
      const mesh = new Mesh(new PlaneGeometry(8.6, 5.2), material);
      mesh.position.set(0, 0, -3.7);
      mesh.renderOrder = 38;

      return { mesh, video: null, texture, material };
    }

    const videoAssetAssignment = OFFICE_JUMPSCARE_VIDEO_ASSET_ASSIGNMENTS[definition.animatronic];
    if (videoAssetAssignment) {
      return this.createOfficeJumpscareVideoPlane(definition, videoAssetAssignment.src, videoAssetAssignment.label);
    }

    return null;
  }

  private startOfficeJumpscare(definition: OfficeJumpscareDefinition, keepMenuOpen = false): void {
    this.stopOfficeJumpscare();
    this.officeJumpscareMenuOpen = false;
    this.placementToolActive = false;
    this.placementPreview.visible = false;
    this.clearCameraToolState();
    this.officeTabletHeld = false;
    this.officeTabletCameraFeedActive = false;
    this.officeTabletAnchor.visible = false;
    this.officeBasketballHeld = false;
    this.officeBasketballAnchor.visible = false;
    this.officeChapter.setBasketballHeld(false);
    this.officeGlassHeld = false;
    this.officeGlassAnchor.visible = false;
    this.clearOfficeHeldPrizeItem();
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

    const cameraCapture = this.createOfficeJumpscareCameraCapture(definition);
    if (cameraCapture) {
      cutsceneRoot.add(cameraCapture.mesh);
    }

    const model = this.createOfficeJumpscareCutsceneModel(definition.animatronic);
    model.root.position.set(0, -0.35, -3.55);
    model.root.visible = !cameraCapture;
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
      gameModeDeath: this.officeGameModeActive && !keepMenuOpen,
      cameraCaptureVideoElement: cameraCapture?.video ?? null,
      cameraCaptureTexture: cameraCapture?.texture ?? null,
      cameraCaptureMaterial: cameraCapture?.material ?? null,
      materialStates,
    };
    this.gameplaySfxAudio.resume();
    this.playOfficeJumpscareSound(definition.cue);
    this.transientStatusTime = 0;
  }

  private stopOfficeJumpscare(): void {
    if (!this.activeOfficeJumpscare) {
      return;
    }

    this.activeOfficeJumpscare.cameraCaptureVideoElement?.pause();
    if (this.activeOfficeJumpscare.cameraCaptureVideoElement) {
      this.activeOfficeJumpscare.cameraCaptureVideoElement.removeAttribute('src');
      this.activeOfficeJumpscare.cameraCaptureVideoElement.load();
    }
    this.activeOfficeJumpscare.cameraCaptureTexture?.dispose();
    this.activeOfficeJumpscare.cameraCaptureMaterial?.dispose();
    this.activeOfficeJumpscare.root.parent?.remove(this.activeOfficeJumpscare.root);
    this.activeOfficeJumpscare = null;
  }

  private startOfficeDeathNotice(): void {
    this.officeDeathNoticePhase = 'died';
    this.officeDeathNoticeTimer = OFFICE_DEATH_DIED_NOTICE_SECONDS;
    this.officeTabletCameraFeedActive = false;
    this.officeTabletHeld = false;
    this.officeTabletAnchor.visible = false;
    this.officeJumpscareMenuOpen = false;
    this.officeModeMenuOpen = false;
    this.placementToolActive = false;
    this.placementPreview.visible = false;
    this.clearOfficeHeldPrizeItem();
    this.pushStatus('You died.', OFFICE_DEATH_DIED_NOTICE_SECONDS);
    this.syncHud();
  }

  private updateOfficeDeathNotice(deltaSeconds: number): void {
    if (!this.officeDeathNoticePhase) {
      return;
    }

    this.officeDeathNoticeTimer = Math.max(0, this.officeDeathNoticeTimer - deltaSeconds);
    if (this.officeDeathNoticeTimer > 0) {
      return;
    }

    if (this.officeDeathNoticePhase === 'died') {
      this.officeDeathNoticePhase = 'fired';
      this.officeDeathNoticeTimer = OFFICE_DEATH_FIRED_NOTICE_SECONDS;
      this.pushStatus("Bori's Pizzeria fired you for meddling with the animatronics.", 3.6);
      this.syncHud();
      return;
    }

    this.officeDeathNoticePhase = null;
    this.officeDeathNoticeTimer = 0;
    this.resetOfficeGameModeAfterDeath();
    this.syncHud();
  }

  private resetOfficeGameModeAfterDeath(): void {
    this.officeGameModeNight = 1;
    this.officeGameModePhaseTime = 0;
    this.officeGameModeNightPhase = true;
    this.resetOfficeGameModeNightState();
    this.returnToOfficeAfterGameModeJumpscare();
    this.pushStatus("You're back at Night 1, 12 AM. The old hours and days reset.", 4);
  }

  private returnToOfficeAfterGameModeJumpscare(): void {
    this.officeVentActive = false;
    this.officeVentDrop = null;
    this.officeEmployeeElevatorRide = null;
    this.officeEmployeeElevatorBasementActive = false;
    this.officeBallPitHidden = false;
    this.officeBallPitSlide = null;
    this.officeChapterSeated = false;
    this.officeTabletCameraFeedActive = false;
    this.officeTabletHeld = false;
    this.officeTabletAnchor.visible = false;
    this.officePowerOutBoriDoor = null;
    this.officeBasketballHeld = false;
    this.officeBasketballAnchor.visible = false;
    this.officeChapter.setBasketballHeld(false);
    this.officeGlassHeld = false;
    this.officeGlassAnchor.visible = false;
    this.clearOfficeHeldPrizeItem();
    this.clearOfficeGlassThrows();
    this.player.teleport(this.getOfficeGameModePoint(OFFICE_GAME_MODE_OFFICE_SPAWN));
    this.player.lookToward(this.getOfficeGameModePoint(OFFICE_GAME_MODE_OFFICE_LOOK_TARGET), 1);
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
      const smileCenter = new Mesh(new BoxGeometry(0.3, 0.028, 0.024), mouthMaterial);
      smileCenter.position.set(0, -0.105, 0.506);
      const smileLeft = new Mesh(new BoxGeometry(0.13, 0.026, 0.024), mouthMaterial);
      smileLeft.position.set(-0.17, -0.085, 0.506);
      smileLeft.rotation.z = 0.56;
      const smileRight = new Mesh(new BoxGeometry(0.13, 0.026, 0.024), mouthMaterial);
      smileRight.position.set(0.17, -0.085, 0.506);
      smileRight.rotation.z = -0.56;
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
        return { y: -1.48, z: -0.22, scale: 3.54 };
      case 'bori':
        return {
          y: cutscene.definition.id === 'bori-2' ? -1.56 : -1.6,
          z: cutscene.definition.id === 'bori-3' ? -0.22 : -0.23,
          scale: cutscene.definition.id === 'bori-3' ? 3.72 : 3.62,
        };
      case 'fluffle':
        return {
          y: cutscene.definition.id === 'fluffle-2' ? -1.46 : -1.42,
          z: cutscene.definition.id === 'fluffle-2' ? -0.22 : -0.24,
          scale: cutscene.definition.id === 'fluffle-2' ? 3.42 : 3.36,
        };
      case 'quacky':
      default:
        return { y: -1.44, z: -0.24, scale: 3.36 };
    }
  }

  private centerOfficeJumpscareFaceInView(cutscene: ActiveOfficeJumpscare, strength: number): void {
    const clampedStrength = MathUtils.clamp(strength, 0, 1);
    if (clampedStrength <= 0.001) {
      return;
    }

    cutscene.root.updateMatrixWorld(true);
    const headPosition = cutscene.head.getWorldPosition(new Vector3());
    cutscene.root.worldToLocal(headPosition);
    const targetX = 0;
    const targetY = cutscene.definition.animatronic === 'foxy' ? 0.03 : 0.02;
    cutscene.modelRoot.position.x += (targetX - headPosition.x) * 0.9 * clampedStrength;
    cutscene.modelRoot.position.y += (targetY - headPosition.y) * 0.9 * clampedStrength;
  }

  private getOfficeJumpscareAlreadyPresentPose(cutscene: ActiveOfficeJumpscare): {
    y: number;
    z: number;
    scale: number;
  } {
    switch (cutscene.definition.animatronic) {
      case 'foxy':
        return { y: -0.82, z: -0.5, scale: 2.32 };
      case 'bori':
        return {
          y: -0.96,
          z: -0.52,
          scale: 2.42,
        };
      case 'fluffle':
        return { y: -0.88, z: -0.52, scale: 2.28 };
      case 'quacky':
      default:
        return { y: -0.94, z: -0.52, scale: 2.3 };
    }
  }

  private applyOfficeJumpscareAlreadyPresentScream(cutscene: ActiveOfficeJumpscare, progress: number): void {
    const model = cutscene.modelRoot;
    const pose = this.getOfficeJumpscareAlreadyPresentPose(cutscene);
    const hold = 1 - MathUtils.smoothstep(progress, 0.58, 0.78);
    const visibleScream = 0.74 + Math.sin(cutscene.elapsed * 32) * 0.08;
    model.visible = true;

    if (hold > 0.001) {
      model.position.y = MathUtils.lerp(model.position.y, pose.y, hold * 0.42);
      model.position.z = MathUtils.lerp(model.position.z, Math.max(model.position.z, pose.z), hold * 0.94);
      model.scale.setScalar(MathUtils.lerp(model.scale.x, Math.max(model.scale.x, pose.scale), hold * 0.88));
    }

    if (cutscene.definition.animatronic === 'quacky') {
      cutscene.jaw.rotation.x = Math.min(cutscene.jaw.rotation.x, -1.58 * visibleScream);
      const innerJaw = cutscene.head.getObjectByName('quacky-inner-jaw');
      const tinyMetalJaw = cutscene.head.getObjectByName('quacky-tiny-metal-jaw');
      this.updateOfficeQuackyNestedJaws(cutscene.head, visibleScream, Math.max(0, Math.sin(cutscene.elapsed * 13.5)), 0.72);
      if (innerJaw) {
        innerJaw.rotation.x = Math.sin(cutscene.elapsed * 9.5) * 0.18 * visibleScream;
      }
      if (tinyMetalJaw) {
        tinyMetalJaw.rotation.x = (0.16 + Math.max(0, Math.sin(cutscene.elapsed * 13.5)) * 0.38) * visibleScream;
      }
    } else {
      cutscene.jaw.rotation.x = Math.max(cutscene.jaw.rotation.x, 1.02 * visibleScream);
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
    if (cutscene.cameraCaptureTexture) {
      model.visible = false;
      model.scale.setScalar(1);
      cutscene.blackoutMaterial.opacity = MathUtils.smoothstep(progress, 0.94, 1);
      if (cutscene.cameraCaptureMaterial) {
        const videoPulse = Math.max(0, Math.sin(progress * Math.PI * 18)) * 0.14;
        cutscene.cameraCaptureMaterial.opacity = MathUtils.clamp(0.9 + videoPulse, 0.9, 1);
      }

      if (progress >= 1) {
        const gameModeDeath = cutscene.gameModeDeath;
        const reopenJumpscareMenu = cutscene.reopenJumpscareMenu;
        this.stopOfficeJumpscare();
        if (gameModeDeath) {
          this.startOfficeDeathNotice();
        } else if (reopenJumpscareMenu) {
          this.officeJumpscareMenuOpen = true;
          this.pushStatus('Jumpscare menu reopened. Choose another Chapter 3 cutscene, or press J to close it.', 1.4);
        } else {
          this.pushStatus('The jumpscare cutscene ends.', 1.4);
        }
      }
      return;
    }
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
    if (cutscene.cameraCaptureMaterial) {
      const videoPulse = Math.max(0, Math.sin(progress * Math.PI * 18)) * 0.18;
      cutscene.cameraCaptureMaterial.opacity = MathUtils.clamp(0.42 + progress * 0.42 + videoPulse, 0.42, 0.95);
    }
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
        cutscene.jaw.rotation.x = -1.82 * scream;
        const innerJaw = cutscene.head.getObjectByName('quacky-inner-jaw');
        const tinyMetalJaw = cutscene.head.getObjectByName('quacky-tiny-metal-jaw');
        this.updateOfficeQuackyNestedJaws(cutscene.head, scream, Math.max(0, Math.sin(cutscene.elapsed * 13.5)), 0.62);
        if (innerJaw) {
          innerJaw.rotation.x = Math.sin(cutscene.elapsed * 9.5) * 0.22 * scream;
          innerJaw.scale.setScalar(1 + scream * 0.14);
        }
        if (tinyMetalJaw) {
          const snap = Math.max(0, Math.sin(cutscene.elapsed * 13.5));
          tinyMetalJaw.rotation.x = (0.18 + snap * 0.42) * scream;
          tinyMetalJaw.position.y = -0.012 + snap * 0.018 * scream;
        }
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

    this.applyOfficeJumpscareAlreadyPresentScream(cutscene, progress);

    const isBoriCutscene = cutscene.definition.animatronic === 'bori';
    const isBrokenCrawl = cutscene.definition.id === 'fluffle-2';
    const faceCloseTarget = this.getOfficeJumpscareFaceCloseTarget(cutscene);
    const closeHold = MathUtils.smoothstep(progress, isBoriCutscene ? 0.68 : 0.66, isBoriCutscene ? 0.9 : 0.88);
    if (closeHold > 0) {
      if (!cutscene.closeCuePlayed && progress >= 0.68) {
        cutscene.closeCuePlayed = true;
        this.playOfficeJumpscareSound(cutscene.definition.cue);
      }
      if (!(cutscene.definition.id === 'bori-3' && progress > 0.998)) {
        model.visible = true;
      }
      const boriBiteOpen = cutscene.definition.id === 'bori-3' ? MathUtils.smoothstep(progress, 0.64, 0.78) : 0;
      const boriBiteClose = cutscene.definition.id === 'bori-3' ? MathUtils.smoothstep(progress, 0.82, 0.96) : 0;
      const boriBiteJaw = MathUtils.lerp(1.68, 0.16, boriBiteClose) * boriBiteOpen;
      const boriRoarJaw = isBoriCutscene && cutscene.definition.id !== 'bori-3' ? 1.24 * closeHold : 0;
      const faceLock = MathUtils.smoothstep(progress, 0.72, 0.9);
      const mouthTerror = MathUtils.smoothstep(progress, 0.7, 0.86);
      const violentHeadShake = Math.sin(cutscene.elapsed * 72) * 0.16 * faceLock;
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
      cutscene.head.rotation.y += headTwitch + violentHeadShake;
      cutscene.head.rotation.z += Math.cos(cutscene.elapsed * 39) * 0.075 * closeHold + Math.cos(cutscene.elapsed * 64) * 0.1 * faceLock;
      if (isBoriCutscene) {
        cutscene.head.rotation.y += cutscene.definition.id === 'bori-2' ? Math.sin(progress * Math.PI * 9) * 0.08 * closeHold : 0;
        cutscene.jaw.rotation.x = Math.max(cutscene.jaw.rotation.x, boriBiteJaw, boriRoarJaw, 1.72 * mouthTerror, 1.46 * screamHold);
        if (cutscene.definition.id === 'bori-3') {
          const biteSnap = boriBiteOpen * boriBiteClose;
          model.position.z = MathUtils.lerp(model.position.z, -0.34, biteSnap * 0.75);
          cutscene.head.rotation.x -= 0.22 * biteSnap;
        }
      } else {
        cutscene.jaw.rotation.x = cutscene.definition.animatronic === 'quacky'
          ? Math.min(cutscene.jaw.rotation.x, -1.72 * mouthTerror, -1.34 * screamHold)
          : Math.max(cutscene.jaw.rotation.x, 1.72 * mouthTerror, 1.34 * screamHold);
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
      this.centerOfficeJumpscareFaceInView(cutscene, faceLock);
    }

    if (progress >= 1) {
      const gameModeDeath = cutscene.gameModeDeath;
      const reopenJumpscareMenu = cutscene.reopenJumpscareMenu;
      this.stopOfficeJumpscare();
      if (gameModeDeath) {
        this.startOfficeDeathNotice();
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

  private cycleZombieWeapon(direction: number): void {
    const weapons: WeaponSelectId[] = ['pistol', 'shotgun'];
    const currentIndex = Math.max(0, weapons.indexOf(this.zombieWeapon));
    const nextIndex = (currentIndex + Math.sign(direction) + weapons.length) % weapons.length;
    this.selectZombieWeapon(weapons[nextIndex] ?? 'pistol');
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

  private cycleDoomWeapon(direction: number): void {
    const allWeapons: WeaponSelectId[] = ['pistol', 'shotgun'];
    const weapons = allWeapons.filter((weapon) => this.doomWeaponsOwned.has(weapon));
    if (weapons.length === 0) {
      return;
    }

    const currentIndex = Math.max(0, weapons.indexOf(this.doomWeapon));
    const nextIndex = (currentIndex + Math.sign(direction) + weapons.length) % weapons.length;
    this.selectDoomWeapon(weapons[nextIndex] ?? 'pistol');
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
          `Power: ${this.getOfficeGameModePowerLabel()}`,
          `Closed doors draining power: ${closedDoors}`,
          'Use the desk camera iPad and door controls carefully. Closed doors block animatronics, but they drain power.',
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

    if (this.chapterFourActive) {
      return [
        'Chapter Four: Five Nights Prototype',
        '',
        'The left and right hallways now branch into different old rooms, including closer front rooms beside the first halls.',
        'Walk into the brown room doors to push them open.',
        'Press 1 for the Coordinate Tool, C for the Cardboard Box, or 3 for the Mic Sound Tool.',
      ].join('\n');
    }

    if (this.chapterFiveActive) {
      if (this.chapterFive.isSurfaceMode()) {
        return [
          'Chapter Five: Planet Surface',
          '',
          'You are outside after landing.',
          'The spaceship is resting in a wide open area with visible hills and abandoned structures.',
          'Walk around the surface with WASD.',
        ].join('\n');
      }

      if (this.chapterFive.isInteriorMode()) {
        return [
          'Chapter Five: Inside The Spaceship',
          '',
          'You are walking through the small ship interior.',
          'The cockpit is up front, with a tiny bedroom and fuel room off the central walkway.',
          'Look through the side windows to watch the stars drift past.',
          'After landing, press E at the cockpit to step outside onto the planet.',
          'Press T to return to the outside flight view.',
        ].join('\n');
      }

      return [
        'Chapter Five: Spaceship',
        '',
        'You are flying a small semi-realistic ship through outer space in a chase view.',
        'Mouse look aims the ship. W speeds up and S slows down; A and D do not move the ship in this chapter.',
        'Hold Shift while moving to boost. The thruster flames grow as the ship pushes harder.',
        'Press T to step inside the ship.',
      ].join('\n');
    }

    if (this.chapterSixActive) {
      return [
        'Chapter Six: Minecraft',
        '',
        'A block world made of pixel-textured cubes.',
        'Walk over stepped grass hills, dirt layers, exposed stone, and blocky trees.',
        'This chapter is a terrain prototype for now.',
      ].join('\n');
    }

    if (this.chapterSevenActive) {
      return [
        'Chapter 7: The House',
        '',
        'You spawn inside the big house in the forest clearing.',
        'The trees use the same round-canopy style as the Zombie First Person Shooter forest.',
        'The open area between the left rooms has a table with much smaller chairs.',
        'The end of the gap between the rooms has a bookshelf with varied books and a small empty drawer beside it.',
        'The back-wall kitchen has a smaller fridge, a counter cabinet between the fridge and oven, a smaller oven, and cupboards running toward the right corner.',
        'Look at the fridge and press E to open it. It has milk, fruit, and cookies inside.',
        'Look at a drawer, cupboard, or oven and press E to open exactly that piece.',
        'Walk into any closed house door to push it open.',
      ].join('\n');
    }

    if (this.chapterEightActive) {
      return [
        'Chapter 8: The Woods',
        '',
        'You are in a semi-realistic horror forest.',
        'A small cabin sits in the clearing with a front door, two front windows, and one big side window.',
        'Starting gear: Coordinate Tool and Military Knife.',
        'Inside the cabin are a stone fireplace with a chimney, a wall-side bed, and an iron stove with its own pipe.',
        'Use the Coordinate Tool if you want to mark more spots in the woods.',
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
      const prizeItems = OFFICE_PRIZE_HOTBAR_SLOTS
        .map(({ item }) => `${OFFICE_PRIZE_ITEM_LABELS[item]} x${this.getOfficePrizeItemCount(item)}`)
        .join(', ');
      return [
        'Inventory: Coordinate Tool, Mic Sound Tool, Camera Tool, prize hotbar',
        this.getCoordinateToolInventoryLine(),
        this.getOfficeTabletInventoryLine(),
        this.getMicrophoneSoundToolInventoryLine(),
        this.getCameraToolInventoryLine(),
        `Tickets: ${this.officeChapterTickets}`,
        `Prizes: ${prizeItems}`,
        this.officePrizeBonusMultiplier > 1 ? 'Prize Wheel Bonus: next real prize is doubled' : 'Prize Wheel Bonus: none',
        this.officeLollipopBoostRemaining > 0 ? `Lollipop Boost: ${Math.ceil(this.officeLollipopBoostRemaining)}s` : 'Lollipop Boost: none',
        this.officeGameModeActive
          ? `${this.getOfficeModeLabel()}: ${this.getOfficeGameModeConfig().label} / Night ${this.officeGameModeNight}/${OFFICE_GAME_MODE_TOTAL_NIGHTS} / ${this.getOfficeGameModeClockLabel()} / Power ${this.getOfficeGameModePowerLabel()}`
          : 'Mode: Creator / Day',
        'Press 1 for the Coordinate Tool. Use the desk iPad for cameras. Press 3 for the Mic Sound Tool. Press 4 for the Camera Tool. Press M for the mode menu. Press J for jumpscares.',
      ].join('\n');
    }

    if (this.chapterFourActive) {
      return [
        'Inventory: Coordinate Tool, Cardboard Box, Mic Sound Tool',
        this.getCoordinateToolInventoryLine(),
        `Cardboard Box: ${this.chapterFourBoxActive ? 'inside / C gets out / B puts away' : this.chapterFourBoxHeld ? 'held / C crawls in / B puts away' : 'press C'}`,
        this.getMicrophoneSoundToolInventoryLine(),
        'Chapter 4: office, first-hall rooms, wider hallway branches, and side rooms with push doors.',
        'Blue and Purple are active prototypes in this chapter.',
      ].join('\n');
    }

    if (this.chapterFiveActive) {
      return [
        'Inventory: Coordinate Tool',
        this.getCoordinateToolInventoryLine(),
        this.chapterFive.isInteriorMode()
          ? 'Ship Mode: interior / T returns outside'
          : 'Ship Mode: outside flight / T enters ship',
        this.chapterFive.isInteriorMode()
          ? 'Interior Rooms: cockpit, bedroom, fuel room'
          : 'Thrusters: W/S and Shift control flame output',
        'Use the chapter menu button to change chapters.',
      ].join('\n');
    }

    if (this.chapterSixActive) {
      const stacks = this.chapterSix.getInventoryStacks();
      const inventoryLine = stacks.length > 0
        ? `Inventory: ${stacks.map((stack) => `${stack.label} x${stack.count}`).join(', ')}`
        : 'Inventory: empty';
      return [
        inventoryLine,
        'Chapter 6: Minecraft block world',
        'E opens inventory and the 2x2 crafting grid.',
        'Hold left click to mine. Number keys select hotbar slots. Right click pets the possum or places the selected block.',
        'Recipes: log -> planks, two vertical planks -> sticks, four logs -> crafting table, planks over sticks -> wooden pickaxe.',
      ].join('\n');
    }

    if (this.chapterSevenActive) {
      return [
        'Inventory: Coordinate Tool',
        this.getCoordinateToolInventoryLine(),
        'Chapter 7: The House',
        'Inside spawn: smaller fridge, counter cabinet, oven, extended upper cupboards, bookshelf, and table drawers.',
        'Use the chapter menu button to change chapters.',
      ].join('\n');
    }

    if (this.chapterEightActive) {
      return [
        'Inventory: Coordinate Tool, Military Knife',
        `Held: ${this.getChapterEightHeldItemLabel(this.chapterEightHeldItem)}`,
        this.getCoordinateToolInventoryLine(),
        'Chapter 8: The Woods',
        'Starting Gear: Coordinate Tool, Military Knife',
        'Spin the mouse wheel to switch Coordinate Tool, Military Knife, and empty hands. Left click slashes; right click stabs.',
        'Cabin props: front door, front windows, big side window, stone fireplace, bed, iron stove, and outdoor hand pump.',
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
    const keyHint = this.officeChapterActive || this.chapterFourActive || this.chapterEightActive ? 'press 1' : 'press M';
    return `Coordinate Tool: ${this.placementToolActive ? 'equipped' : 'in inventory'} / ${keyHint} / markers here: ${markerCount}`;
  }

  private getOfficeTabletInventoryLine(): string {
    const state = this.officeTabletCameraFeedActive
      ? `viewing ${this.getActiveOfficeTabletCamera()?.label ?? 'no camera'}`
      : 'idle';
    return `Desk iPad: ${state} / stand at the desk and press E or left click`;
  }

  private getMicrophoneSoundToolInventoryLine(): string {
    this.loadSavedMicrophoneSounds();
    const state = this.microphoneSoundRecording
      ? 'recording'
      : this.microphoneSoundToolActive
        ? 'equipped'
        : 'in inventory';
    const saved = this.microphoneSoundSaved
      ? `selected ${this.microphoneSoundPreviewRecordingId ? this.formatMicrophoneSoundLabel(this.microphoneSoundPreviewRecordingId) : 'saved sound'}`
      : this.microphoneSoundPreviewUrl
        ? 'preview ready, not saved'
        : this.microphoneSoundRecordings.length > 0
          ? `${this.microphoneSoundRecordings.length} sound effects`
          : 'no sound effect';
    return `Mic Sound Tool: ${state} / press 3 / ${saved}`;
  }

  private getCameraToolInventoryLine(): string {
    this.loadCameraToolCaptures();
    const state = this.cameraToolRecording
      ? 'recording video'
      : this.cameraToolActive
        ? 'equipped'
        : 'in inventory';
    const saved = this.cameraToolPreviewKind && this.cameraToolPreviewCaptureId
      ? `selected ${this.formatCameraToolCaptureLabel(this.cameraToolPreviewKind, this.cameraToolPreviewCaptureId)}`
      : this.cameraToolPreviewKind
        ? `preview ${this.cameraToolPreviewKind}, not saved`
        : `${this.cameraToolCaptures.length} saved captures`;
    return `Camera Tool: ${state} / press 4 / ${saved}`;
  }

  private getOfficeHeldPrizeActionText(): string | null {
    switch (this.officeHeldPrizeItem) {
      case 'glass':
        return 'Glass Cup equipped. Left click to throw it and make it shatter.';
      case 'tiny-bear':
        return 'Tiny Bear equipped. Left click to throw it and squeak-distract the animatronic.';
      case 'lollipop':
        return 'Lollipop equipped. Left click to eat it for a 10 second double-speed boost.';
      case 'duck-toy':
        return 'Duck Toy equipped. It looks like a tiny Quacky in your hand.';
      case 'stuffie':
        return 'Stuffie equipped. Left click to play the saved custom sound.';
      default:
        return null;
    }
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
      active: this.chapterExitUnlocked && !this.chapterTwoActive && !this.officeChapterActive && !this.chapterFourActive && !this.chapterFiveActive && !this.chapterSixActive && !this.chapterSevenActive && !this.chapterEightActive && !this.zombieModeActive && !this.doomModeActive,
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

    if (this.chapterFourActive) {
      return [
        coordinateToolSlot,
        this.getChapterFourBoxHotbarSlot(),
        this.getMicrophoneSoundToolHotbarSlot(3),
        ...Array.from({ length: 6 }, () => ({
          label: 'Empty',
          count: 0,
          filled: false,
        })),
      ].slice(0, 9);
    }

    if (this.officeChapterActive) {
      const officePrizeSlots = OFFICE_PRIZE_HOTBAR_SLOTS.map(({ item }) => {
        const held = this.officeHeldPrizeItem === item || (item === 'lollipop' && this.officeLollipopUseTimer > 0);
        return {
          label: `${OFFICE_PRIZE_ITEM_LABELS[item]} ${held ? '[Held]' : ''}`.trim(),
          count: this.getOfficePrizeItemCount(item),
          filled: this.getOfficePrizeItemCount(item) > 0 || held,
        };
      });
      return [
        coordinateToolSlot,
        { label: 'Empty', count: 0, filled: false },
        this.getMicrophoneSoundToolHotbarSlot(3),
        this.getCameraToolHotbarSlot(),
        ...officePrizeSlots,
      ];
    }

    if (this.chapterSixActive) {
      return this.chapterSix.getHotbarStacks().map((stack) => ({
        label: stack.label,
        count: stack.count,
        filled: stack.filled,
        type: stack.type,
        selected: stack.selected,
      }));
    }

    if (this.chapterSevenActive) {
      return [
        coordinateToolSlot,
        ...Array.from({ length: 8 }, () => ({
          label: 'Empty',
          count: 0,
          filled: false,
        })),
      ];
    }

    if (this.chapterEightActive) {
      const emptySlotSelected = this.chapterEightHeldItem === 'empty';
      return [
        {
          ...coordinateToolSlot,
          selected: this.chapterEightHeldItem === 'coordinate-tool',
        },
        {
          label: `Military Knife ${this.chapterEightHeldItem === 'military-knife' ? '[Held]' : '[2]'}`,
          count: 1,
          filled: true,
          selected: this.chapterEightHeldItem === 'military-knife',
        },
        {
          label: this.chapterEight.hasTorch()
            ? `Torch ${this.chapterEightHeldItem === 'torch' ? '[Held]' : '[3]'}`
            : 'Torch',
          count: this.chapterEight.hasTorch() ? 1 : 0,
          filled: this.chapterEight.hasTorch(),
          selected: this.chapterEightHeldItem === 'torch',
        },
        {
          label: this.chapterEight.getPhaseLabel(),
          count: Math.max(1, Math.ceil(this.chapterEight.getPhaseRemaining())),
          filled: true,
        },
        {
          label: this.chapterEight.door.locked ? 'Door Locked' : this.chapterEight.door.open ? 'Door Open' : 'Door Shut',
          count: this.chapterEight.door.locked ? 1 : 0,
          filled: this.chapterEight.door.locked,
        },
        ...Array.from({ length: 4 }, (_, index) => ({
          label: 'Empty',
          count: 0,
          filled: false,
          selected: emptySlotSelected && index === 0,
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
      label: `Coordinate Tool ${this.placementToolActive ? '[Held]' : this.officeChapterActive || this.chapterFourActive ? '[1]' : '[M]'}`,
      count: this.placementMarkers.filter((marker) => marker.chapter === this.getCurrentHudChapterId()).length,
      filled: true,
    };
  }

  private getMicrophoneSoundToolHotbarSlot(slot: number) {
    this.loadSavedMicrophoneSounds();
    const state = this.microphoneSoundRecording
      ? '[Rec]'
      : this.microphoneSoundToolActive
        ? '[Held]'
        : `[${slot}]`;
    return {
      label: `Mic Sound ${state}`,
      count: this.microphoneSoundRecordings.length + (this.microphoneSoundPreviewUrl && !this.microphoneSoundSaved ? 1 : 0),
      filled: true,
    };
  }

  private getCameraToolHotbarSlot() {
    this.loadCameraToolCaptures();
    const state = this.cameraToolRecording
      ? '[Rec]'
      : this.cameraToolActive
        ? '[Held]'
        : '[4]';
    return {
      label: `Camera Tool ${state}`,
      count: this.cameraToolCaptures.length + (this.cameraToolPreviewUrl && !this.cameraToolSaved ? 1 : 0),
      filled: true,
    };
  }

  private getChapterFourBoxHotbarSlot() {
    const state = this.chapterFourBoxActive
      ? this.chapterFourBoxViewMode === 'wide'
        ? '[Wide]'
        : '[Inside]'
      : this.chapterFourBoxHeld
        ? '[Held]'
        : '[2]';
    return {
      label: `Cardboard Box ${state}`,
      count: 1,
      filled: true,
    };
  }

  private getPromptText(locked: boolean): string {
    if (this.activeOfficeJumpscare) {
      return `${this.activeOfficeJumpscare.definition.label} jumpscare cutscene is playing.`;
    }

    if (this.microphoneSoundToolActive) {
      if (this.microphoneSoundRecording) {
        return 'Microphone Sound Tool recording. Make the sound, then press E to stop.';
      }

      return this.microphoneSoundPreviewUrl
        ? 'Mic Sound Tool active. E records again, left click previews, D saves the next sound number, number keys play saved sound effects.'
        : 'Mic Sound Tool active. Press E to start recording a custom sound effect.';
    }

    if (this.cameraToolActive) {
      if (this.cameraToolRecording) {
        return 'Camera Tool recording video and microphone audio. Press E to stop, then D to save it as the next video number.';
      }

      return this.cameraToolPreviewUrl
        ? 'Camera Tool active. Left click takes a picture, E records video with audio, D saves preview, right click deletes selected.'
        : 'Camera Tool active. Left click takes a picture; E starts a video recording with microphone audio.';
    }

    if (this.placementToolActive) {
      return locked
        ? 'Coordinate Tool active. Left click drops a marker, right click deletes the latest marker, M puts the tool away.'
        : 'Click the play space to re-enter first person, then use the Coordinate Tool.';
    }

    if (this.chapterFourActive && this.chapterFourLockerId) {
      return 'Inside the locker. Look through the metal slits, or press E to step out.';
    }

    if (this.chapterFourActive && this.chapterFourBoxActive) {
      return this.chapterFourBoxViewMode === 'wide'
        ? 'You are under the Cardboard Box with a wide view. Press X for normal slit view or C to crawl out.'
        : 'You are inside the Cardboard Box. Press Z for wide view, X for normal view, or C to crawl out.';
    }

    if (this.chapterFourActive && this.chapterFourBoxHeld) {
      return 'Cardboard Box held. Press C to crawl inside.';
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
        return 'WASD moves, Space jumps, Shift runs, left click fires, 1/2 swap weapons, E works doors and the exit switch, and F toggles the flashlight.';
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
        return 'WASD moves, Space jumps, Shift sprints, left click fires, 1/2 swap weapons, E upgrades or repairs barricades, and F toggles the flashlight.';
      }

      if (this.zombieNightActive) {
        return 'Left click fires. Keep the zombies off the barricades and survive until dawn.';
      }

      return 'Daylight prep window. Walk the barricades, spend scrap with E, and get ready before night falls.';
    }

    if (this.chapterFourActive) {
      if (this.chapterFourBoxActive) {
        return this.chapterFourBoxViewMode === 'wide'
          ? 'Cardboard Box wide view. Press X for normal slit view, or C to crawl out.'
          : 'Inside the Cardboard Box. Press Z for wide box view, X for normal slit view, or C to crawl out.';
      }

      if (this.chapterFourBoxHeld) {
        return 'Cardboard Box equipped. Press C to crawl inside it.';
      }

      const locker = this.getNearestChapterFourLocker();
      if (locker) {
        return `Press E to hide in the ${locker.label.toLowerCase()}.`;
      }

      const door = this.getNearestChapterFourDoor();
      if (door) {
        return door.open
          ? `Press E to close the ${door.label.toLowerCase()}.`
          : `Press E to open the ${door.label.toLowerCase()}.`;
      }

      if (!locked) {
        return 'WASD moves, Space jumps, Shift sprints, F toggles the flashlight, 1 equips the Coordinate Tool, C uses the Cardboard Box, and 3 equips the Mic Sound Tool.';
      }

      return 'Chapter 4: walk into doors to push them open. Press C for the Cardboard Box, 3 for the Mic Sound Tool, and B to put the box away while held.';
    }

    if (this.chapterFiveActive) {
      if (this.chapterFive.isSurfaceMode()) {
        return locked
          ? 'Planet surface: walk around the landed ship, hills, and abandoned structures.'
          : 'Click the play space to keep walking on the planet surface.';
      }

      if (this.chapterFive.isInteriorMode()) {
        const monitor = this.chapterFive.getMonitorState();
        if (monitor.landed && locked && !monitor.active) {
          return 'Landing complete. Press E to step outside onto the planet surface.';
        }

        const control = this.chapterFive.getNearestCockpitControl(this.player.getPosition());
        if (control && locked) {
          return control.prompt;
        }

        if (monitor.active && monitor.landed && locked) {
          return 'Landing complete. Press E to step outside onto the planet surface.';
        }

        if (monitor.active && locked) {
          return 'Cockpit computer online. Click a planet or junk row to save/cancel it, then use Autopilot, Engines, or Radar. Press E to close.';
        }

        if (!locked) {
          return 'Click the play space to keep walking inside the spaceship. Press T to return outside.';
        }

        return 'Inside the spaceship. WASD walks through the cockpit, bedroom, and fuel room. Press T to return outside.';
      }

      if (!locked) {
        return 'Click the play space to fly. Mouse look aims the ship, W speeds up, S slows down, Shift boosts, and T steps inside.';
      }

      return 'Chase-view spaceship prototype. Mouse look points the ship, W speeds up, S slows down, Shift boosts the thrusters, and T steps inside.';
    }

    if (this.chapterSixActive) {
      if (this.chapterSix.isInventoryOpen()) {
        return 'Inventory open. Left click moves a stack, right click moves one item into a slot, click the result to craft, and press E to close.';
      }

      return locked
        ? 'Chapter 6 Minecraft: hold left click to mine, E opens inventory/crafting, number keys select hotbar, and right click pets the possum or places a block.'
        : 'Click the play space to walk around the Minecraft block world.';
    }

    if (this.chapterSevenActive) {
      if (this.chapterSevenBoxHidden) {
        return 'Inside the cardboard box. Press E to open it again, then press Space to jump out or hold Space for 2 seconds to crawl.';
      }
      if (this.chapterSevenOvenHidden) {
        return 'Inside the oven. Look out through the glass, or press E to open the door again.';
      }

      const interactable = this.getLookedAtChapterSevenInteractable();
      if (interactable && locked) {
        if (interactable.kind === 'cupboard') {
          return interactable.item.open
            ? `Press E to close ${interactable.item.label}.`
            : `Press E to open ${interactable.item.label}.`;
        }

        if (interactable.kind === 'fridge') {
          return interactable.item.open
            ? 'Press E to close the fridge.'
            : 'Press E to open the fridge.';
        }

        if (interactable.kind === 'drawer') {
          return interactable.item.open
            ? `Press E to close ${interactable.item.label}.`
            : `Press E to open ${interactable.item.label}.`;
        }

        if (interactable.kind === 'cardboard-box') {
          return interactable.item.open
            ? 'Hold Space for 2 seconds to crawl, then press Space to jump inside the open box. Press E inside it to close the flaps.'
            : 'Press E to open the cardboard box.';
        }

        if (interactable.kind === 'kitchen-sink') {
          return interactable.item.open
            ? 'Press E to turn off the faucet.'
            : 'Press E to turn on the faucet.';
        }

        if (interactable.kind === 'old-wooden-closet') {
          return interactable.item.open
            ? 'Press E to close the old wooden closet.'
            : 'Press E to open the old wooden closet.';
        }

        if (interactable.kind === 'rear-fixture') {
          if (interactable.item.kind === 'bathroom-sink') {
            return interactable.item.open
              ? 'Press E to turn off the bathroom sink.'
              : 'Press E to turn on the bathroom sink.';
          }
          if (interactable.item.kind === 'bathtub') {
            return interactable.item.open
              ? 'Press E to turn off the bathtub faucet.'
              : 'Press E to turn on the bathtub faucet.';
          }
          if (interactable.item.kind === 'trash-can') {
            return interactable.item.open
              ? 'Press E to close the trash can.'
              : 'Press E to open the trash can.';
          }

          return interactable.item.open
            ? `Press E to close ${interactable.item.label}.`
            : `Press E to open ${interactable.item.label}.`;
        }

        if (interactable.kind === 'swing') {
          return 'Press E to swing on the swing set.';
        }

        if (interactable.item.open && this.chapterSevenCrawling && this.isPlayerInsideChapterSevenOven()) {
          return 'Press E to close the oven door around yourself.';
        }

        return interactable.item.open
          ? 'Press E to close the oven, or crawl inside it first.'
          : 'Press E to open the oven.';
      }

      const manualDoor = this.getNearestChapterSevenManualDoor();
      if (manualDoor && locked) {
        return manualDoor.open
          ? `Press E to close ${manualDoor.label}.`
          : `Press E to open ${manualDoor.label}.`;
      }

      return locked
        ? 'Chapter 7: The House controls: WASD moves, press Space to jump, hold Space for 2 seconds to crawl, walk into push doors, and press E for furniture, the sliding glass door, or the sink faucet.'
        : 'Click the play space to walk around Chapter 7: The House.';
    }

    if (this.chapterEightActive) {
      if (locked && this.isNearChapterEightDoorLock()) {
        if (this.chapterEight.door.open) {
          return 'Close the cabin door before clipping the lock.';
        }
        return this.chapterEight.door.locked
          ? 'Press E to unlock the cabin door.'
          : 'Press E to lock the cabin door.';
      }

      if (locked && this.isNearChapterEightDoor()) {
        return this.chapterEight.door.locked
          ? 'The cabin door is locked. Use the inside lock to unclip it.'
          : this.chapterEight.door.open
            ? 'Press E to close the cabin door.'
            : 'Press E to open the cabin door.';
      }

      if (locked && this.isNearChapterEightSleepSpot()) {
        return this.chapterEight.isNight()
          ? 'Press E to sleep until morning.'
          : 'You can sleep here once night starts.';
      }

      if (locked && this.isNearChapterEightFireplace() && !this.chapterEight.hasTorch()) {
        return 'Press E by the fire to make a torch.';
      }

      if (locked && this.isNearChapterEightStove()) {
        return this.chapterEight.stove.open
          ? 'Press E to close the cast iron stove.'
          : 'Press E to open the cast iron stove.';
      }

      if (locked && this.isNearChapterEightWaterPump()) {
        return this.chapterEight.waterPump.pumping
          ? 'The pump handle is moving and water is pouring from the spout.'
          : 'Press E to pump water.';
      }

      return locked
        ? 'Chapter 8: The Woods controls: E uses the door, lock, bed, fire, stove, and pump. Mouse wheel switches gear; left/right click attack with the knife.'
        : 'Click the play space to walk around Chapter 8: The Woods.';
    }

    if (this.officeChapterActive) {
      if (this.officeBallPitHidden) {
        return 'Ball pit: press C to come up.';
      }

      const ventExit = this.getNearestOfficeVentExit();
      const ventLadder = this.getNearestOfficeVentLadder();
      const openVentCoverBelow = this.getNearestOpenOfficeVentCoverFromBelow();
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

      if (this.getNearestOfficeCameraMonitors()) {
        return locked
          ? 'Desk camera iPad is in reach. Press E or left click to view the cameras.'
          : 'Click the play space to re-enter first person, then use the desk iPad for cameras.';
      }

      const heldPrizeText = this.getOfficeHeldPrizeActionText();
      if (heldPrizeText) {
        return heldPrizeText;
      }

      const utility = this.getNearestOfficeUtilityInteractable();
      const ballPitSlide = this.getNearestOfficeBallPitSlide();
      const kitchenEntranceDoor = this.getNearestOfficeKitchenEntranceDoor();
      const kitchenGlassShelf = this.getNearestOfficeKitchenGlassShelf();
      const backstageStorageDoor = this.getNearestOfficeBackstageStorageDoor();
      const employeeOnlyDoor = this.getNearestOfficeEmployeeOnlyDoor();
      const employeeElevator = this.getNearestOfficeEmployeeElevator();
      const storageFuseBox = this.getNearestOfficeStorageFuseBox();
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

      if (openVentCoverBelow) {
        return this.canReachOpenOfficeVentCoverFromBelow()
          ? `Press E to close ${openVentCoverBelow.label.toLowerCase()}.`
          : `Jump under ${openVentCoverBelow.label.toLowerCase()} and press E to close it.`;
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
        return this.officeHeldPrizeItem === 'glass'
          ? 'Glass Cup is already in your hand. Left click to throw it.'
          : 'Press E to add a glass cup to your hotbar from the kitchen shelf.';
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

      if (employeeOnlyDoor) {
        return employeeOnlyDoor.open
          ? 'Press E to close the employees-only danger door.'
          : 'Press E to open the employees-only danger door.';
      }

      if (employeeElevator) {
        return 'Press E to press the red elevator button.';
      }

      if (storageFuseBox) {
        if (!storageFuseBox.open) {
          return 'Press E to open the ball pit fuse box.';
        }

        if (!this.officePowerRebootRequired) {
          return 'Fuse box ready. No reboot needed yet.';
        }

        const nextWireColor = OFFICE_FUSE_WIRE_COLORS.find((color) => !this.officeFuseWireConnected[color]);
        return nextWireColor
          ? `Press E to connect the ${nextWireColor} wire.`
          : 'Press E to pull the fuse-box lever.';
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
          ? `Press E or left click the red button to ${this.getOfficeDoorById(button.doorId)?.open ? 'lower' : 'raise'} the ${button.doorId} office door.`
          : `Press E or left click the white button to flash the hall light outside the ${button.doorId} office door.`;
      }

      if (door) {
        return `${door.label} is here. Use the nearby red button to move it and the white button to flash the hall outside.`;
      }

      if (!locked) {
      return this.officeGameModeActive
        ? `${this.getOfficeModeLabel()} ${this.getOfficeGameModeConfig().label}: Night ${this.officeGameModeNight}/${OFFICE_GAME_MODE_TOTAL_NIGHTS}, ${this.getOfficeGameModeClockLabel()}, power ${this.getOfficeGameModePowerLabel()}. M opens the mode menu, use the desk iPad for cameras, 3 equips the Mic Sound Tool, 4 equips the Camera Tool, F toggles the flashlight.`
        : 'WASD moves, Space jumps, Shift sprints, E uses objects, 1 equips the Coordinate Tool, use the desk iPad for cameras, 3 equips the Mic Sound Tool, 4 equips the Camera Tool, M opens the mode menu, and F toggles the flashlight.';
      }

      return 'The office is quiet for now. Use the desk iPad to view the security cameras.';
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
    if (!locked || this.chapterMenuOpen) {
      return '';
    }

    if (this.chapterFiveActive && this.chapterFive.isInteriorMode()) {
      return this.chapterFive.getNearestCockpitControl(this.player.getPosition()) ? promptText : '';
    }

    if (this.chapterSevenActive) {
      return this.getLookedAtChapterSevenInteractable()
        ? promptText
        : '';
    }

    if (this.chapterEightActive) {
      return '';
    }

    if (!this.chapterTwoActive) {
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
      return `Desk camera feed active. ${this.getActiveOfficeTabletCamera()?.label ?? 'No camera installed'}. Press a camera number to switch, or left click to return.`;
    }

    if (this.chapterFourActive && this.chapterFourBoxActive) {
      return this.chapterFourBoxViewMode === 'wide'
        ? 'Cardboard Box wide view active. Press X for normal view or C to crawl out.'
        : 'You are inside the Cardboard Box. Press Z for wide view or C to crawl out.';
    }

    if (this.chapterFourActive && this.chapterFourLockerId) {
      return 'Inside the locker. You can only look through the slits. Press E to step out.';
    }

    if (this.chapterFourActive && this.chapterFourBoxHeld) {
      return 'Cardboard Box equipped. Press C to crawl inside it.';
    }

    if (this.officeChapterActive) {
      const heldPrizeText = this.getOfficeHeldPrizeActionText();
      if (heldPrizeText) {
        return heldPrizeText;
      }
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

    if (this.chapterFourActive) {
      const locker = this.getNearestChapterFourLocker();
      if (locker) {
        return `${locker.label} is open enough to hide in. Press E to step inside.`;
      }

      const door = this.getNearestChapterFourDoor();
      if (door) {
        return door.open
          ? `${door.label} is open. Press E to close it.`
          : `${door.label} is taped over but usable. Press E to open it.`;
      }

      return 'Chapter four loaded. The office and side-room doors are push doors. Press C to use the Cardboard Box.';
    }

    if (this.chapterFiveActive) {
      if (this.chapterFive.isInteriorMode()) {
        const control = this.chapterFive.getNearestCockpitControl(this.player.getPosition());
        if (control) {
          return `${control.label} is in reach. ${control.prompt}`;
        }

        const monitor = this.chapterFive.getMonitorState();
        if (monitor.active) {
          return `Cockpit computer online. Light speed ${monitor.lightSpeed}/10, engines ${monitor.engineOn ? 'on' : 'off'}, destination ${monitor.destinationLabel}.`;
        }

        return 'Inside the spaceship. The curved cockpit monitor, bedroom, and fuel room are small, and stars drift by the side windows.';
      }

      return 'Chapter five loaded. The ship stays centered while mouse look aims its course; W speeds up, S slows down, Shift boosts, and T steps inside.';
    }

    if (this.chapterSevenActive) {
      if (this.chapterSevenSwingSeated) {
        return 'Hold W to swing, and press E to get off the swing set.';
      }

      if (this.chapterSevenBoxHidden) {
        return 'Inside the cardboard box. You cannot move while hidden. Press E to open it again.';
      }
      if (this.chapterSevenOvenHidden) {
        return 'Inside the oven. You cannot move while hidden, but you can look through the glass. Press E to open it again.';
      }

      if (this.chapterSevenCrawling && this.chapterSeven.isPlayerUnderBed(this.player.getPosition())) {
        return 'Hidden under raised furniture. Crawl back out from under the frame to stand up again.';
      }

      if (this.chapterSevenCrawling && this.isPlayerInsideChapterSevenOven()) {
        return this.chapterSeven.houseOven.open
          ? 'Inside the open oven. Press E to close the door, or crawl back out.'
          : 'Inside the oven. Press E to open the door again.';
      }

      if (this.chapterSevenCrawling) {
        return 'Crawling. Movement is slower; jump into the open cardboard box, then press E to close it around you.';
      }

      const interactable = this.getLookedAtChapterSevenInteractable();
      if (interactable) {
        if (interactable.kind === 'cupboard') {
          return interactable.item.open
            ? `${interactable.item.label} are open. Press E to close them.`
            : `${interactable.item.label} are closed. Press E to open them.`;
        }

        if (interactable.kind === 'fridge') {
          return interactable.item.open
            ? 'The fridge is open. Press E to close it. Inside are milk, fruit, and cookies.'
            : 'The fridge is closed. Press E to open it.';
        }

        if (interactable.kind === 'drawer') {
          return interactable.item.open
            ? `${interactable.item.label} is open. Press E to close it.${interactable.item.cookieCount === 0
              ? ' It is empty.'
              : interactable.item.cookieCount === 1
                ? ' There is one cookie inside.'
                : ` There are ${interactable.item.cookieCount} cookies inside.`}`
            : `${interactable.item.label} is closed. Press E to open it.`;
        }

        if (interactable.kind === 'cardboard-box') {
          return interactable.item.open
            ? 'The cardboard box top is open. You can jump inside it, or press E to close the flaps.'
            : 'A cardboard box sits here. Press E to open the top flaps.';
        }

        if (interactable.kind === 'kitchen-sink') {
          return interactable.item.open
            ? 'The kitchen faucet is running. Press E to turn it off.'
            : 'The kitchen faucet is off. Press E to turn it on.';
        }

        if (interactable.kind === 'old-wooden-closet') {
          return interactable.item.open
            ? 'The old wooden closet is open. You can walk inside, or press E to close it.'
            : 'The old wooden closet is closed. Press E to open it.';
        }

        if (interactable.kind === 'rear-fixture') {
          if (interactable.item.kind === 'bathroom-sink') {
            return interactable.item.open
              ? 'The bathroom sink is running. Press E to turn it off.'
              : 'The bathroom sink is off. Press E to turn it on.';
          }
          if (interactable.item.kind === 'bathtub') {
            return interactable.item.open
              ? 'The bathtub faucet is running and filling the tub. Press E to turn it off.'
              : 'The bathtub faucet is off. Press E to turn it on.';
          }
          if (interactable.item.kind === 'trash-can') {
            return interactable.item.open
              ? 'The trash can is open. Press E to close it.'
              : 'The trash can is closed. Press E to open it.';
          }

          return interactable.item.open
            ? `${interactable.item.label} is open. Press E to close it.`
            : `${interactable.item.label} is closed. Press E to open it.`;
        }

        if (interactable.kind === 'swing') {
          return 'Press E to swing on the swing set.';
        }

        if (interactable.item.open && this.chapterSevenCrawling) {
          return 'The oven is open. Crawl inside it, then press E to close the door.';
        }

        return interactable.item.open
          ? 'The oven is open. Press E to close it.'
          : 'The oven is closed. Press E to open it.';
      }

      if (this.getNearestChapterSevenSwing()) {
        return 'Press E to swing on the swing set.';
      }

      const door = this.getNearestChapterSevenHouseDoor();
      if (door) {
        if (door.interactionMode === 'manual') {
          return door.open
            ? `${door.label} is open. Press E to close it.`
            : `${door.label} is closed. Press E to slide it open.`;
        }

        return door.open
          ? `${door.label} is open.`
          : `${door.label} opens when you walk into it.`;
      }

      return 'Chapter 7: The House starts inside on the front bedroom bed. Press Space to jump, hold Space for 2 seconds to crawl, and press E for drawers, cupboards, the cardboard box, old closet, sliding glass door, or sink faucet.';
    }

    if (this.chapterEightActive) {
      const fireplaceState = this.chapterEight.isFireLit() ? 'lit' : 'unlit';
      return `Chapter 8: The Woods loaded. Holding: ${this.getChapterEightHeldItemLabel(this.chapterEightHeldItem)}. The cabin fireplace is ${fireplaceState}.`;
    }

    if (this.officeChapterActive) {
      const ventExit = this.getNearestOfficeVentExit();
      const ventLadder = this.getNearestOfficeVentLadder();
      const openVentCoverBelow = this.getNearestOpenOfficeVentCoverFromBelow();
      const ballPitSlide = this.getNearestOfficeBallPitSlide();
      const utility = this.getNearestOfficeUtilityInteractable();
      const kitchenEntranceDoor = this.getNearestOfficeKitchenEntranceDoor();
      const kitchenGlassShelf = this.getNearestOfficeKitchenGlassShelf();
      const backstageStorageDoor = this.getNearestOfficeBackstageStorageDoor();
      const employeeOnlyDoor = this.getNearestOfficeEmployeeOnlyDoor();
      const employeeElevator = this.getNearestOfficeEmployeeElevator();
      const storageFuseBox = this.getNearestOfficeStorageFuseBox();
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
      const cameraMonitors = this.getNearestOfficeCameraMonitors();
      const button = this.getNearestOfficeButton();
      const door = this.getNearestOfficeDoor();
      if (this.officeChapterSeated) {
        return 'You are sitting at the office chair beside the desk. Left click the desk iPad to view cameras, or press E to stand up.';
      }

      if (this.officeBallPitSlide) {
        return 'You are sliding down the half-pipe into the ball pit.';
      }

      if (cameraMonitors) {
        return 'The desk camera iPad is in reach. Press E or left click to view the cameras.';
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

      if (openVentCoverBelow) {
        return this.canReachOpenOfficeVentCoverFromBelow()
          ? `${openVentCoverBelow.label} is open above you. Press E to close it.`
          : `${openVentCoverBelow.label} is open above you. Jump and press E to pull it shut.`;
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
        return this.officeHeldPrizeItem === 'glass'
          ? 'A glass cup is in your hand. Left click to throw it and shatter it.'
          : `${kitchenGlassShelf.label} has cups and glasses. Press E to add one to your hotbar.`;
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

      if (employeeOnlyDoor) {
        return employeeOnlyDoor.open
          ? 'The employees-only danger door is open. Press E to close it.'
          : 'The employees-only danger door is closed. Press E to open it.';
      }

      if (employeeElevator) {
        return 'The red elevator button waits beside the gray cable platform. Press E to lower it.';
      }

      if (storageFuseBox) {
        if (!storageFuseBox.open) {
          return 'The ball pit fuse box is shut. Press E to open it.';
        }

        if (!this.officePowerRebootRequired) {
          return 'The ball pit fuse box is open, but the power does not need rebooting yet.';
        }

        const nextWireColor = OFFICE_FUSE_WIRE_COLORS.find((color) => !this.officeFuseWireConnected[color]);
        if (nextWireColor) {
          return `Power needs rebooting. Press E to connect the ${nextWireColor} wire to the ${nextWireColor} post.`;
        }

        return 'All fuse wires are matched. Press E to pull the lever and reboot power.';
      }

      if (storageClosetDoor) {
        return storageClosetDoor.open
          ? 'The cleaning storage closet is open. Pipes drip over supplies inside.'
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
          ? `${this.getOfficeDoorById(button.doorId)?.label ?? 'The office door'} will move when you press E or left click the red button.`
          : `Press E or left click the white button to flash the hall outside the ${button.doorId} office door.`;
      }

      if (door) {
        return door.open
          ? `${door.label} is raised up out of the way.`
          : `${door.label} is shut and ready to lift straight up.`;
      }

      return this.officeGameModeActive
        ? `Game Mode is live. Power ${this.getOfficeGameModePowerLabel()}. Closed doors and cameras drain power.`
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
    this.flashlight.setEnabled(false);
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

    if (this.chapterFourActive) {
      const chapterFourFloorY = this.chapterFour.getSupportedFloorY(this.player.getPosition());
      if (this.chapterFourCrouching) {
        return (chapterFourFloorY ?? GAME_CONFIG.player.height) - CHAPTER_FOUR_CROUCH_DROP;
      }
      return chapterFourFloorY;
    }

    if (this.chapterFiveActive) {
      return this.chapterFive.getSupportedFloorY(this.player.getPosition());
    }

    if (this.chapterSixActive) {
      return this.chapterSix.getSupportedFloorY(this.player.getPosition());
    }

    if (this.chapterSevenActive) {
      const chapterSevenFloorY = this.chapterSeven.getSupportedFloorY(
        this.player.getPosition(),
        this.chapterSevenCrawling || this.chapterSevenBoxHidden || this.chapterSevenOvenHidden,
      );
      if (this.chapterSevenCrawling || this.chapterSevenBoxHidden || this.chapterSevenOvenHidden) {
        return (chapterSevenFloorY ?? GAME_CONFIG.player.height) - CHAPTER_SEVEN_CRAWL_DROP;
      }
      return chapterSevenFloorY;
    }

    if (this.chapterEightActive) {
      return this.chapterEight.getSupportedFloorY(this.player.getPosition());
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

    if (this.officeEmployeeElevatorRide) {
      return null;
    }

    if (this.isPlayerInOfficeEmployeeElevatorBasement()) {
      return this.officeChapter.employeeElevator.lowerPosition.y;
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

  private getNearestOfficeCameraMonitors(): OfficeChapterData['cameraMonitors'] | null {
    if (!this.officeChapterActive) {
      return null;
    }

    const monitors = this.officeChapter.cameraMonitors;
    const playerPosition = this.player.getPosition();
    const toMonitor = monitors.interactPosition.clone().sub(playerPosition);
    const flatDistance = Math.hypot(toMonitor.x, toMonitor.z);
    if (flatDistance > GAME_CONFIG.player.interactionRange + 0.85) {
      return null;
    }

    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const along = toMonitor.dot(forward);
    if (along <= -0.18) {
      return null;
    }

    const lateral = toMonitor.sub(forward.multiplyScalar(Math.max(0, along))).length();
    return lateral <= 1.35 ? monitors : null;
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

  private handleOfficeButtonInteraction(button: OfficeChapterData['buttons'][number]): boolean {
    if (this.officeGameModeActive && this.officeGameModePowerOut) {
      this.pushStatus(
        'The office controls are dead. The power is out.',
        2.4,
      );
      return true;
    }

    if (button.buttonType === 'flash') {
      this.officeChapter.flashHallLight(button.doorId);
      this.repelOfficeGameModeAnimatronicsAtDoor(button.doorId);
      this.pushStatus(
        `The white button kicks a hard flash into the hall outside the ${button.doorId} office door.`,
        2.2,
      );
      return true;
    }

    const door = this.getOfficeDoorById(button.doorId);
    if (!door) {
      return false;
    }

    door.targetOpenAmount = door.targetOpenAmount > 0.5 ? 0 : 1;
    door.open = door.targetOpenAmount > 0.5;
    this.playOfficeDoorToggleSound(button.doorId, door.open);
    if (!door.open) {
      door.closeBounceTimer = door.closeBounceDuration;
      this.gameplaySfxAudio.playSecurityDoorCrash();
    } else {
      door.closeBounceTimer = 0;
    }
    this.pushStatus(
      door.open
        ? `${door.label} grinds upward into the ceiling track.`
        : `${door.label} drops back down and seals the opening.`,
      2.8,
    );
    if (!door.open) {
      this.tryOfficeDoorCloseHallwayBreach(button.doorId);
    }
    return true;
  }

  private handleOfficeStorageFuseBoxInteract(): boolean {
    const fuseBox = this.getNearestOfficeStorageFuseBox();
    if (!fuseBox) {
      return false;
    }

    if (!fuseBox.open) {
      fuseBox.targetOpenAmount = 1;
      fuseBox.open = true;
      this.gameplaySfxAudio.playSmallPanel(true);
      this.pushStatus('The ball pit fuse box opens. Match green, blue, and red wires to their colored posts. The lever is beside the box.', 3.2);
      return true;
    }

    if (!this.officePowerRebootRequired) {
      this.syncOfficeFuseBoxVisuals();
      this.pushStatus('The fuse box is ready, but the power does not need rebooting yet.', 2.4);
      return true;
    }

    const nextWireColor = OFFICE_FUSE_WIRE_COLORS.find((color) => !this.officeFuseWireConnected[color]);
    if (nextWireColor) {
      this.officeFuseWireConnected[nextWireColor] = true;
      this.syncOfficeFuseBoxVisuals();
      this.gameplaySfxAudio.playSmallPanel(true);
      this.pushStatus(
        `You connect the ${nextWireColor} wire to the ${nextWireColor} post.`,
        2.4,
      );
      return true;
    }

    if (fuseBox.targetLeverAmount < 0.5) {
      this.completeOfficePowerReboot();
      this.gameplaySfxAudio.playSmallPanel(true);
      return true;
    }

    this.pushStatus('The lever is already pulled and the power is rebooted.', 2);
    return true;
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
    const targetPrizeRotation = prizeIndex * segmentAngle + segmentAngle * 0.5;
    wheel.selectedPrize = wheel.prizes[prizeIndex] ?? 'Prize';
    wheel.spinTime = 0;
    wheel.spinDuration = 3.6 + Math.random() * 0.65;
    wheel.spinStartRotation = wheel.wheel.rotation.z;
    wheel.spinTargetRotation = targetPrizeRotation
      + Math.ceil((wheel.spinStartRotation - targetPrizeRotation) / (Math.PI * 2)) * Math.PI * 2
      + fullTurns * Math.PI * 2;
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
    wheel.selectedPrize = this.getOfficePrizeWheelLandedPrize();
    this.awardOfficePrizeWheelPrize(wheel.selectedPrize);
  }

  private getOfficePrizeWheelLandedPrize(): string {
    const wheel = this.officeChapter.prizeWheel;
    const prizeCount = wheel.prizes.length;
    if (prizeCount === 0) {
      return 'Prize';
    }

    const segmentAngle = Math.PI * 2 / prizeCount;
    const normalizedRotation = ((wheel.wheel.rotation.z % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const landedIndex = Math.floor(normalizedRotation / segmentAngle) % prizeCount;
    return wheel.prizes[landedIndex] ?? 'Prize';
  }

  private awardOfficePrizeWheelPrize(prize: string): void {
    if (prize === 'Try Again') {
      this.pushStatus('The prize wheel lands on Try Again. Spin it again.', 2.6);
      return;
    }

    if (prize === 'Bonus') {
      this.officePrizeBonusMultiplier = 2;
      this.pushStatus('Bonus active. The next real prize you win gives you twice as much.', 3);
      return;
    }

    const count = Math.max(1, this.officePrizeBonusMultiplier);
    this.officePrizeBonusMultiplier = 1;

    if (prize === 'Ticket') {
      this.officeChapterTickets += count;
      this.pushStatus(`The prize wheel gives you ${count === 1 ? 'a ticket' : `${count} tickets`}. Tickets: ${this.officeChapterTickets}.`, 2.8);
      return;
    }

    const item = prize === 'Glass Cup'
      ? 'glass'
      : prize === 'Tiny Bear'
        ? 'tiny-bear'
        : prize === 'Lollipop'
          ? 'lollipop'
          : prize === 'Duck Toy'
            ? 'duck-toy'
            : prize === 'Stuffie'
              ? 'stuffie'
              : null;
    if (!item) {
      this.pushStatus(`The prize wheel stops on ${prize}.`, 2.4);
      return;
    }

    this.addOfficePrizeItem(item, count);
    this.setOfficeHeldPrizeItem(item, false);
    this.pushStatus(
      `The prize wheel gives you ${count === 1 ? 'one' : String(count)} ${OFFICE_PRIZE_ITEM_LABELS[item]}${count === 1 ? '' : 's'}. It is in your hotbar.`,
      3,
    );
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

  private getNearestOpenOfficeVentCoverFromBelow(): OfficeChapterData['ventSystem']['openings'][number] | null {
    if (this.officeVentActive || this.officeVentDrop) {
      return null;
    }

    const playerPosition = this.player.getPosition();
    let closest: OfficeChapterData['ventSystem']['openings'][number] | null = null;
    let closestDistance = Infinity;

    for (const opening of this.officeChapter.ventSystem.openings) {
      if (!opening.coverPivot || !opening.roomCoverPivot || !opening.exitPosition) {
        continue;
      }

      const openAmount = Math.max(opening.openAmount ?? 0, opening.targetOpenAmount ?? 0);
      if (openAmount < 0.45) {
        continue;
      }

      const horizontalDistance = Math.hypot(
        playerPosition.x - opening.exitPosition.x,
        playerPosition.z - opening.exitPosition.z,
      );
      if (horizontalDistance > 1.18 || horizontalDistance >= closestDistance) {
        continue;
      }

      closest = opening;
      closestDistance = horizontalDistance;
    }

    return closest;
  }

  private canReachOpenOfficeVentCoverFromBelow(): boolean {
    const playerPosition = this.player.getPosition();
    const lookDirection = this.camera.getWorldDirection(new Vector3());
    return playerPosition.y > GAME_CONFIG.player.height + 0.12 || lookDirection.y > 0.48;
  }

  private closeOpenOfficeVentCoverFromBelow(opening: OfficeChapterData['ventSystem']['openings'][number]): void {
    opening.targetOpenAmount = 0;
    opening.open = false;
    this.gameplaySfxAudio.playSmallPanel(false);
    this.pushStatus(`${opening.label} clanks shut above you.`, 1.9);
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

  private isPlayerInOfficeEmployeeElevatorBasement(playerPosition = this.player.getPosition()): boolean {
    const elevator = this.officeChapter.employeeElevator;
    return this.officeEmployeeElevatorBasementActive
      && playerPosition.y < GAME_CONFIG.player.height - 1.2
      && Math.abs(playerPosition.x - elevator.lowerPosition.x) <= elevator.lowerHalfWidth + GAME_CONFIG.player.radius
      && Math.abs(playerPosition.z - elevator.lowerPosition.z) <= elevator.lowerHalfDepth + GAME_CONFIG.player.radius;
  }

  private constrainOfficeEmployeeElevatorBasementPosition(): void {
    const playerPosition = this.player.getPosition();
    const elevator = this.officeChapter.employeeElevator;
    playerPosition.x = MathUtils.clamp(
      playerPosition.x,
      elevator.lowerPosition.x - elevator.lowerHalfWidth,
      elevator.lowerPosition.x + elevator.lowerHalfWidth,
    );
    playerPosition.z = MathUtils.clamp(
      playerPosition.z,
      elevator.lowerPosition.z - elevator.lowerHalfDepth,
      elevator.lowerPosition.z + elevator.lowerHalfDepth,
    );
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
    this.clearOfficePendingVentChase();
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

  private getNearestOfficeEmployeeElevator(): OfficeChapterData['employeeElevator'] | null {
    const elevator = this.officeChapter.employeeElevator;
    if (!elevator.root.visible) {
      return null;
    }

    const playerPosition = this.player.getPosition();
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const buttonPosition = this.isPlayerInOfficeEmployeeElevatorBasement(playerPosition)
      ? elevator.lowerInteractPosition
      : elevator.interactPosition;
    const toButton = buttonPosition.clone().sub(playerPosition);
    const along = toButton.dot(forward);
    if (along <= 0 || along > GAME_CONFIG.player.interactionRange + 1.1) {
      return null;
    }

    const projected = forward.clone().multiplyScalar(along);
    const lateral = toButton.sub(projected).length();
    return lateral <= 1.15 ? elevator : null;
  }

  private startOfficeEmployeeElevatorRide(): void {
    const elevator = this.officeChapter.employeeElevator;
    if (this.officeEmployeeElevatorRide || !elevator.root.visible) {
      return;
    }

    this.resetOfficeTabletState();
    this.officeVentActive = false;
    this.officeVentDrop = null;
    this.clearOfficePendingVentChase();
    this.officeBallPitHidden = false;
    const ridingUp = this.isPlayerInOfficeEmployeeElevatorBasement();
    const startPosition = ridingUp ? elevator.lowerPosition.clone() : elevator.topPosition.clone();
    const endPosition = ridingUp ? elevator.topPosition.clone() : elevator.lowerPosition.clone();
    this.officeEmployeeElevatorBasementActive = false;
    this.officeEmployeeElevatorRide = {
      elapsed: 0,
      duration: OFFICE_EMPLOYEE_ELEVATOR_RIDE_DURATION,
      startPosition,
      endPosition,
      lookTarget: ridingUp
        ? elevator.topPosition.clone().add(new Vector3(0, 0, 4))
        : elevator.lowerLookTarget.clone(),
    };
    const startPlatformDrop = elevator.topPosition.y - startPosition.y;
    elevator.platform.position.y = elevator.platformHomeY - startPlatformDrop;
    elevator.button.position.x = ridingUp ? elevator.buttonRestX : elevator.buttonRestX - 0.04;
    elevator.lowerButton.position.x = ridingUp ? elevator.lowerButtonRestX - 0.04 : elevator.lowerButtonRestX;
    elevator.cables.forEach((cable) => {
      const cableLength = elevator.cableBaseLength + startPlatformDrop;
      cable.scale.y = cableLength;
      cable.position.y = elevator.cableTopY - cableLength / 2;
    });
    elevator.shaftWalls.forEach((wall) => {
      wall.visible = true;
      wall.scale.y = 1;
      wall.position.y = elevator.shaftWallTopY - elevator.shaftWallHeight / 2;
    });
    this.player.teleport(startPosition);
    this.player.lookToward(startPosition.clone().add(new Vector3(0, 0, 4)), 0.8);
    this.gameplaySfxAudio.playSmallPanel(true);
    this.pushStatus(
      ridingUp
        ? 'The employees-only elevator rises back toward the upper room.'
        : 'The employees-only elevator lowers into the hidden shaft.',
      3.2,
    );
  }

  private updateOfficeEmployeeElevatorRide(deltaSeconds: number): void {
    if (!this.officeEmployeeElevatorRide) {
      return;
    }

    const ride = this.officeEmployeeElevatorRide;
    const elevator = this.officeChapter.employeeElevator;
    ride.elapsed = Math.min(ride.elapsed + deltaSeconds, ride.duration);
    const rawProgress = MathUtils.clamp(ride.elapsed / ride.duration, 0, 1);
    const loweredProgress = MathUtils.smootherstep(rawProgress, 0, 1);
    const ridePosition = ride.startPosition.clone().lerp(ride.endPosition, loweredProgress);
    const platformDrop = elevator.topPosition.y - ridePosition.y;
    elevator.platform.position.y = elevator.platformHomeY - platformDrop;
    const ridingUp = ride.endPosition.y > ride.startPosition.y;
    elevator.button.position.x = ridingUp ? elevator.buttonRestX : elevator.buttonRestX - Math.max(0, 1 - rawProgress * 5) * 0.04;
    elevator.lowerButton.position.x = ridingUp
      ? elevator.lowerButtonRestX - Math.max(0, 1 - rawProgress * 5) * 0.04
      : elevator.lowerButtonRestX;
    elevator.cables.forEach((cable) => {
      const cableLength = elevator.cableBaseLength + platformDrop;
      cable.scale.y = cableLength;
      cable.position.y = elevator.cableTopY - cableLength / 2;
    });
    elevator.shaftWalls.forEach((wall) => {
      wall.visible = true;
      wall.scale.y = 1;
      wall.position.y = elevator.shaftWallTopY - elevator.shaftWallHeight / 2;
    });

    this.player.teleport(ridePosition);
    this.player.lookToward(ridePosition.clone().add(new Vector3(0, 0, 4)), 0.035);

    if (rawProgress < 1) {
      return;
    }

    this.officeEmployeeElevatorRide = null;
    this.officeEmployeeElevatorBasementActive = ride.endPosition.y < elevator.topPosition.y - 0.5;
    elevator.button.position.x = elevator.buttonRestX;
    elevator.lowerButton.position.x = elevator.lowerButtonRestX;
    elevator.shaftWalls.forEach((wall) => {
      wall.visible = true;
      wall.scale.y = 1;
      wall.position.y = elevator.shaftWallTopY - elevator.shaftWallHeight / 2;
    });
    this.player.lookToward(ride.lookTarget, 0.75);
    this.pushStatus(
      this.officeEmployeeElevatorBasementActive
        ? 'The elevator settles onto the basement floor below the employees-only area.'
        : 'The elevator returns to the employees-only room.',
      2.8,
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

  private getNearestOfficeEmployeeOnlyDoor(): OfficeChapterData['employeeOnlyDoor'] | null {
    const playerPosition = this.player.getPosition();
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const toDoor = this.officeChapter.employeeOnlyDoor.interactPosition.clone().sub(playerPosition);
    const along = toDoor.dot(forward);
    if (along <= 0 || along > GAME_CONFIG.player.interactionRange + 1.05) {
      return null;
    }

    const projected = forward.clone().multiplyScalar(along);
    const lateral = toDoor.sub(projected).length();
    return lateral <= 1.05 ? this.officeChapter.employeeOnlyDoor : null;
  }

  private getNearestOfficeStorageFuseBox(): OfficeChapterData['storageFuseBox'] | null {
    return null;
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
    this.officeEmployeeElevatorRide = null;
    this.officeEmployeeElevatorBasementActive = false;
    this.officeBallPitHidden = false;
    this.player.teleport(this.officeChapter.ventSystem.ladderEntryPosition);
    this.player.lookToward(
      this.officeChapter.ventSystem.ladderEntryPosition.clone().add(new Vector3(0, 0, 4)),
      1,
    );
    this.scheduleOfficeAnimatronicVentChase();
    this.pushStatus('You climb into the ceiling vent. Move slowly with WASD and look around normally.', 3.2);
  }

  private exitOfficeVentSystem(exitPosition: Vector3, openingLabel = ''): void {
    this.officeVentActive = false;
    this.officeVentDrop = null;
    this.officeEmployeeElevatorRide = null;
    this.officeEmployeeElevatorBasementActive = false;
    this.clearOfficePendingVentChase();
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

    if (this.getNearestOfficeCameraMonitors()) {
      this.toggleOfficeTabletCameraFeed();
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

    const openVentCoverBelow = this.getNearestOpenOfficeVentCoverFromBelow();
    if (openVentCoverBelow) {
      if (this.canReachOpenOfficeVentCoverFromBelow()) {
        this.closeOpenOfficeVentCoverFromBelow(openVentCoverBelow);
      } else {
        this.pushStatus(`Jump under ${openVentCoverBelow.label.toLowerCase()} and press E to close it.`, 2.2);
      }
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

      this.addOfficePrizeItem('glass', 1);
      this.setOfficeHeldPrizeItem('glass', false);
      this.gameplaySfxAudio.playSmallPanel(false);
      this.pushStatus(`You pick up a glass from ${kitchenGlassShelf.label}. It is in your hotbar, and left click throws it.`, 2.8);
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

    const employeeOnlyDoor = this.getNearestOfficeEmployeeOnlyDoor();
    if (employeeOnlyDoor) {
      employeeOnlyDoor.targetOpenAmount = employeeOnlyDoor.targetOpenAmount > 0.5 ? 0 : 1;
      employeeOnlyDoor.open = employeeOnlyDoor.targetOpenAmount > 0.5;
      this.gameplaySfxAudio.playClosetDoor(employeeOnlyDoor.open);
      this.pushStatus(
        employeeOnlyDoor.open
          ? 'The employees-only danger door swings open.'
          : 'The employees-only danger door swings shut.',
        2.4,
      );
      return;
    }

    if (this.getNearestOfficeEmployeeElevator()) {
      this.startOfficeEmployeeElevatorRide();
      return;
    }

    if (this.handleOfficeStorageFuseBoxInteract()) {
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
      this.clearOfficeHeldPrizeItem();
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

    this.handleOfficeButtonInteraction(button);
  }

  private getNearestChapterFourDoor(): ChapterFourData['doors'][number] | null {
    if (!this.chapterFourActive) {
      return null;
    }

    const playerPosition = this.player.getPosition();
    let closest: ChapterFourData['doors'][number] | null = null;
    let closestDistance = Infinity;
    for (const door of this.chapterFour.doors) {
      if (door.mode !== 'interact') {
        continue;
      }
      const distance = Math.hypot(
        playerPosition.x - door.interactPosition.x,
        playerPosition.z - door.interactPosition.z,
      );
      if (distance > GAME_CONFIG.player.interactionRange + 0.55 || distance >= closestDistance) {
        continue;
      }

      closest = door;
      closestDistance = distance;
    }

    return closest;
  }

  private getNearestChapterSevenHouseDoor(): ChapterSevenData['houseDoor'] | null {
    if (!this.chapterSevenActive) {
      return null;
    }

    const playerPosition = this.player.getPosition();
    let closestDoor: ChapterSevenData['houseDoor'] | null = null;
    let closestDistance = Infinity;
    for (const door of this.chapterSeven.houseDoors) {
      const distance = Math.hypot(
        playerPosition.x - door.interactPosition.x,
        playerPosition.z - door.interactPosition.z,
      );
      if (distance > GAME_CONFIG.player.interactionRange + 1.2 || distance >= closestDistance) {
        continue;
      }

      closestDoor = door;
      closestDistance = distance;
    }

    return closestDoor;
  }

  private getNearestChapterSevenManualDoor(): ChapterSevenData['houseDoor'] | null {
    if (!this.chapterSevenActive) {
      return null;
    }

    const playerPosition = this.player.getPosition();
    let closestDoor: ChapterSevenData['houseDoor'] | null = null;
    let closestDistance = Infinity;
    for (const door of this.chapterSeven.houseDoors) {
      if (door.interactionMode !== 'manual') {
        continue;
      }

      const distance = Math.hypot(
        playerPosition.x - door.interactPosition.x,
        playerPosition.z - door.interactPosition.z,
      );
      if (distance > GAME_CONFIG.player.interactionRange + 3.0 || distance >= closestDistance) {
        continue;
      }

      closestDoor = door;
      closestDistance = distance;
    }

    return closestDoor;
  }

  private getNearestChapterSevenBathtubFaucet(): ChapterSevenData['rearFixtures'][number] | null {
    if (!this.chapterSevenActive) {
      return null;
    }

    const playerPosition = this.player.getPosition();
    let closestFixture: ChapterSevenData['rearFixtures'][number] | null = null;
    let closestDistance = Infinity;
    for (const fixture of this.chapterSeven.rearFixtures) {
      if (fixture.kind !== 'bathtub') {
        continue;
      }

      const interactDistance = Math.hypot(
        playerPosition.x - fixture.interactPosition.x,
        playerPosition.z - fixture.interactPosition.z,
      );
      const tubDistance = fixture.tubBounds
        ? Math.hypot(playerPosition.x - fixture.tubBounds.centerX, playerPosition.z - fixture.tubBounds.centerZ)
        : interactDistance;
      const distance = Math.min(interactDistance, tubDistance);
      if (distance > GAME_CONFIG.player.interactionRange + 2.15 || distance >= closestDistance) {
        continue;
      }

      closestFixture = fixture;
      closestDistance = distance;
    }

    return closestFixture;
  }

  private isPlayerInsideChapterSevenCardboardBox(): boolean {
    if (!this.chapterSevenActive) {
      return false;
    }

    const box = this.chapterSeven.cardboardBox;
    const position = this.player.getPosition();
    return Math.abs(position.x - box.centerX) <= box.halfWidth + 0.18
      && Math.abs(position.z - box.centerZ) <= box.halfDepth + 0.18;
  }

  private hideInsideChapterSevenCardboardBox(): void {
    const box = this.chapterSeven.cardboardBox;
    this.chapterSevenBoxHidden = true;
    this.chapterSevenCrawling = false;
    this.chapterSevenForcedCrawl = false;
    box.root.visible = true;
    box.targetOpenAmount = 0;
    box.open = false;
    this.gameplaySfxAudio.playClosetDoor(false);
    this.chapterSevenBoxHideAnchor.visible = false;
    this.chapterSevenOvenHideAnchor.visible = false;
    this.chapterSevenOvenDoorOverlay.visible = false;
    this.pushStatus('You close the Amazon cardboard box around yourself. Press E to open it again.', 2.6);
  }

  private openChapterSevenCardboardBoxFromInside(): void {
    const box = this.chapterSeven.cardboardBox;
    this.chapterSevenBoxHidden = false;
    box.root.visible = true;
    box.targetOpenAmount = 1;
    box.open = true;
    this.gameplaySfxAudio.playClosetDoor(true);
    this.chapterSevenBoxHideAnchor.visible = false;
    this.chapterSevenOvenHideAnchor.visible = false;
    this.chapterSevenOvenDoorOverlay.visible = false;
    this.pushStatus('The cardboard box opens. Press Space to jump out, or hold Space for 2 seconds to crawl.', 2.6);
  }

  private isPlayerInsideChapterSevenOven(): boolean {
    if (!this.chapterSevenActive) {
      return false;
    }

    return this.chapterSeven.isPlayerInsideOven(this.player.getPosition());
  }

  private hideInsideChapterSevenOven(): void {
    const oven = this.chapterSeven.houseOven;
    this.chapterSevenOvenHidden = true;
    this.chapterSevenCrawling = true;
    oven.targetOpenAmount = 0;
    oven.open = false;
    oven.collider.enabled = false;
    this.chapterSevenOvenHideAnchor.visible = false;
    this.chapterSevenOvenDoorOverlay.visible = false;
    this.gameplaySfxAudio.playClosetDoor(false);
    this.pushStatus('You pull the oven door closed. You can look out through the glass. Press E to open it again.', 2.8);
  }

  private openChapterSevenOvenFromInside(): void {
    const oven = this.chapterSeven.houseOven;
    this.chapterSevenOvenHidden = false;
    oven.targetOpenAmount = 1;
    oven.open = true;
    oven.collider.enabled = false;
    this.chapterSevenOvenHideAnchor.visible = false;
    this.chapterSevenOvenDoorOverlay.visible = false;
    this.gameplaySfxAudio.playClosetDoor(true);
    this.pushStatus('The oven door folds open. Hold Space for 2 seconds to crawl back out.', 2.6);
  }

  private toggleChapterSevenBathtubFaucet(fixture: ChapterSevenData['rearFixtures'][number]): void {
    fixture.targetOpenAmount = fixture.targetOpenAmount > 0.5 ? 0 : 1;
    fixture.open = fixture.targetOpenAmount > 0.5;
    this.gameplaySfxAudio.playSmallPanel(fixture.open);
    this.pushStatus(
      fixture.open
        ? 'You turn on the bathtub faucet. Water flows into the tub.'
        : 'You turn off the bathtub faucet. The tub water slowly drains.',
      2.4,
    );
  }

  private handleChapterSevenFaucetToggle(): void {
    if (!this.chapterSevenActive || !this.player.isLocked() || this.chapterSevenBoxHidden || this.chapterSevenOvenHidden) {
      return;
    }

    const interactable = this.getLookedAtChapterSevenInteractable();
    if (interactable?.kind !== 'kitchen-sink') {
      return;
    }

    const sink = interactable.item;
    sink.targetOpenAmount = sink.targetOpenAmount > 0.5 ? 0 : 1;
    sink.open = sink.targetOpenAmount > 0.5;
    this.gameplaySfxAudio.playSmallPanel(sink.open);
    this.pushStatus(
      sink.open
        ? 'You turn the faucet handle. Water starts pouring into the sink.'
        : 'You turn the faucet handle back. The water stops.',
      2.4,
    );
  }

  private getChapterSevenLookScore(
    target: { interactPosition: Vector3; aimPosition: Vector3 },
    aimRadius: number,
    rangePadding: number,
  ): number | null {
    if (!this.chapterSevenActive) {
      return null;
    }

    const playerPosition = this.player.getPosition();
    const distance = Math.hypot(
      playerPosition.x - target.interactPosition.x,
      playerPosition.z - target.interactPosition.z,
    );

    if (distance > GAME_CONFIG.player.interactionRange + rangePadding) {
      return null;
    }

    const cameraPosition = this.camera.getWorldPosition(new Vector3());
    const forward = this.camera.getWorldDirection(new Vector3()).normalize();
    const toTarget = target.aimPosition.clone().sub(cameraPosition);
    const targetDistance = toTarget.length();
    if (targetDistance <= 0.001) {
      return null;
    }

    const along = toTarget.dot(forward);
    if (along <= 0.2) {
      return null;
    }

    const lateral = Math.sqrt(Math.max(0, targetDistance * targetDistance - along * along));
    if (lateral > aimRadius) {
      return null;
    }

    return lateral + along * 0.025;
  }

  private getLookedAtChapterSevenInteractable(): ChapterSevenInteractable | null {
    if (!this.chapterSevenActive) {
      return null;
    }

    let best: ChapterSevenInteractable | null = null;
    const keepBest = (candidate: ChapterSevenInteractable): void => {
      if (!best || candidate.score < best.score) {
        best = candidate;
      }
    };

    const fridgeScore = this.getChapterSevenLookScore(this.chapterSeven.houseFridge, 0.62, 0.95);
    if (fridgeScore !== null) {
      keepBest({ kind: 'fridge', item: this.chapterSeven.houseFridge, score: fridgeScore });
    }

    const ovenScore = this.getChapterSevenLookScore(this.chapterSeven.houseOven, 0.5, 0.95);
    if (ovenScore !== null) {
      keepBest({ kind: 'oven', item: this.chapterSeven.houseOven, score: ovenScore });
    }

    const sinkScore = this.getChapterSevenLookScore(this.chapterSeven.kitchenSink, 0.55, 1.0);
    if (sinkScore !== null) {
      keepBest({ kind: 'kitchen-sink', item: this.chapterSeven.kitchenSink, score: sinkScore });
    }

    this.chapterSeven.rearFixtures.forEach((fixture) => {
      const fixtureScore = fixture.kind === 'bathtub'
        ? this.getChapterSevenLookScore(fixture, 1.25, 2.15)
        : this.getChapterSevenLookScore(fixture, 0.62, 1.15);
      if (fixtureScore !== null) {
        keepBest({ kind: 'rear-fixture', item: fixture, score: fixtureScore });
      }
    });

    this.chapterSeven.houseDrawers.forEach((drawer) => {
      const drawerScore = this.getChapterSevenLookScore(drawer, 0.23, 0.85);
      if (drawerScore !== null) {
        keepBest({ kind: 'drawer', item: drawer, score: drawerScore });
      }
    });

    this.chapterSeven.houseUpperCupboards.forEach((cupboard) => {
      const cupboardScore = this.getChapterSevenLookScore(cupboard, 0.58, 0.8);
      if (cupboardScore !== null) {
        keepBest({ kind: 'cupboard', item: cupboard, score: cupboardScore });
      }
    });

    this.chapterSeven.houseBaseCabinets.forEach((cabinet) => {
      const cabinetScore = this.getChapterSevenLookScore(cabinet, 0.52, 0.85);
      if (cabinetScore !== null) {
        keepBest({ kind: 'cupboard', item: cabinet, score: cabinetScore });
      }
    });

    const cardboardBoxScore = this.getChapterSevenLookScore(this.chapterSeven.cardboardBox, 0.55, 1.05);
    if (cardboardBoxScore !== null) {
      keepBest({ kind: 'cardboard-box', item: this.chapterSeven.cardboardBox, score: cardboardBoxScore });
    }

    this.chapterSeven.oldWoodenClosets.forEach((closet) => {
      const oldWoodenClosetScore = this.getChapterSevenLookScore(closet, 1.2, 1.6);
      if (oldWoodenClosetScore !== null) {
        keepBest({ kind: 'old-wooden-closet', item: closet, score: oldWoodenClosetScore });
      }
    });

    const swingScore = this.getChapterSevenLookScore(this.chapterSeven.swingSet, 1.0, 1.25);
    if (swingScore !== null) {
      keepBest({ kind: 'swing', item: this.chapterSeven.swingSet, score: swingScore });
    }

    return best;
  }

  private getNearestChapterSevenSwing(): ChapterSevenData['swingSet'] | null {
    if (!this.chapterSevenActive || this.chapterSevenBoxHidden || this.chapterSevenOvenHidden || this.chapterSevenCrawling) {
      return null;
    }

    const playerPosition = this.player.getPosition();
    const swing = this.chapterSeven.swingSet;
    const distance = Math.hypot(
      playerPosition.x - swing.interactPosition.x,
      playerPosition.z - swing.interactPosition.z,
    );
    return distance <= GAME_CONFIG.player.interactionRange + 0.9 ? swing : null;
  }

  private getNearestChapterFourLocker(): ChapterFourData['lockers'][number] | null {
    if (!this.chapterFourActive || this.chapterFourLockerId !== null) {
      return null;
    }

    const playerPosition = this.player.getPosition();
    let closest: ChapterFourData['lockers'][number] | null = null;
    let closestDistance = Infinity;
    for (const locker of this.chapterFour.lockers) {
      const distance = Math.hypot(
        playerPosition.x - locker.interactPosition.x,
        playerPosition.z - locker.interactPosition.z,
      );
      if (distance > GAME_CONFIG.player.interactionRange + 0.6 || distance >= closestDistance) {
        continue;
      }

      closest = locker;
      closestDistance = distance;
    }

    return closest;
  }

  private getActiveChapterFourLocker(): ChapterFourData['lockers'][number] | null {
    if (!this.chapterFourLockerId) {
      return null;
    }

    return this.chapterFour.lockers.find((locker) => locker.id === this.chapterFourLockerId) ?? null;
  }

  private enterChapterFourLocker(locker: ChapterFourData['lockers'][number]): void {
    this.chapterFourLockerId = locker.id;
    this.setPlacementToolActive(false);
    this.chapterFourBoxHeld = false;
    this.chapterFourBoxActive = false;
    this.chapterFourBoxViewMode = 'normal';
    this.chapterFourBoxWideCameraReady = false;
    this.chapterFourBoxHeldAnchor.visible = false;
    this.chapterFourBoxHideAnchor.visible = false;
    this.chapterFourBoxWideAnchor.visible = false;
    this.chapterFourBoxWorldAnchor.visible = false;
    this.player.teleport(locker.insidePosition);
    this.player.lookToward(locker.lookTarget, 1);
    this.gameplaySfxAudio.playClosetDoor(true);
    this.pushStatus(`You step inside the ${locker.label.toLowerCase()}. You can look through the slits, but you cannot move. Press E to get out.`, 3);
  }

  private exitChapterFourLocker(): void {
    const locker = this.getActiveChapterFourLocker();
    this.chapterFourLockerId = null;
    if (locker) {
      this.player.teleport(locker.exitPosition);
      this.player.lookToward(locker.lookTarget, 0.45);
    }
    this.gameplaySfxAudio.playClosetDoor(false);
    this.pushStatus('You step out of the locker.', 1.8);
  }

  private lockPlayerInChapterFourLocker(): void {
    const locker = this.getActiveChapterFourLocker();
    if (!locker) {
      this.chapterFourLockerId = null;
      return;
    }

    this.player.getPosition().copy(locker.insidePosition);
  }

  private handleChapterFourInteract(): void {
    if (this.chapterFourLockerId) {
      this.exitChapterFourLocker();
      return;
    }

    if (this.chapterFourBoxHeld || this.chapterFourBoxActive) {
      this.toggleChapterFourBox();
      return;
    }

    const locker = this.getNearestChapterFourLocker();
    if (locker) {
      this.enterChapterFourLocker(locker);
      return;
    }

    const door = this.getNearestChapterFourDoor();
    if (!door) {
      this.pushStatus('Nothing here needs interaction yet. Use 1 for the Coordinate Tool or C for the Cardboard Box. B puts the box away.', 2.4);
      return;
    }

    door.targetOpenAmount = door.targetOpenAmount > 0.5 ? 0 : 1;
    door.open = door.targetOpenAmount > 0.5;
    this.gameplaySfxAudio.playClosetDoor(door.open);
    if (door.id === 'tiny-tree-shed-door') {
      this.pushStatus(
        door.open
          ? 'The tiny shed door creaks open. You can hide beside the tree.'
          : 'The tiny shed door shuts.',
        2.4,
      );
      return;
    }
    this.pushStatus(
      door.open
        ? `${door.label} swings open.`
        : `${door.label} swings shut.`,
      2.2,
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

  private createChapterSixHeldItemModel(type: ChapterSixItemType): Group {
    const root = new Group();
    const material = new MeshStandardMaterial({
      color: this.getChapterSixHeldItemColor(type),
      roughness: 0.88,
      metalness: 0.02,
    });

    if (type === 'possum') {
      const bodyMaterial = new MeshStandardMaterial({ color: 0x1f1814, roughness: 0.94 });
      const headMaterial = new MeshStandardMaterial({ color: 0xf1eee6, roughness: 0.88 });
      const pinkMaterial = new MeshStandardMaterial({ color: 0xf0a0ad, roughness: 0.82 });
      const darkMaterial = new MeshStandardMaterial({ color: 0x17110f, roughness: 0.9 });
      const body = new Mesh(new BoxGeometry(0.42, 0.24, 0.52), bodyMaterial);
      body.position.set(0, -0.02, 0.02);
      const head = new Mesh(new BoxGeometry(0.3, 0.24, 0.25), headMaterial);
      head.position.set(0, 0.04, -0.35);
      const nose = new Mesh(new BoxGeometry(0.08, 0.06, 0.05), pinkMaterial);
      nose.position.set(0, 0.03, -0.5);
      const tail = new Mesh(new BoxGeometry(0.07, 0.07, 0.42), pinkMaterial);
      tail.position.set(0, -0.03, 0.38);
      tail.rotation.x = -0.24;
      const leftEar = new Mesh(new BoxGeometry(0.09, 0.12, 0.05), darkMaterial);
      leftEar.position.set(-0.11, 0.22, -0.34);
      const rightEar = leftEar.clone();
      rightEar.position.x = 0.11;
      const createLeg = (x: number, z: number): Mesh => {
        const leg = new Mesh(new BoxGeometry(0.07, 0.14, 0.08), darkMaterial);
        leg.position.set(x, -0.19, z);
        return leg;
      };
      root.add(
        body,
        head,
        nose,
        tail,
        leftEar,
        rightEar,
        createLeg(-0.14, -0.14),
        createLeg(0.14, -0.14),
        createLeg(-0.14, 0.18),
        createLeg(0.14, 0.18),
      );
      root.rotation.set(0.18, 0.38, -0.08);
      root.scale.setScalar(1.15);
      return root;
    }

    if (type === 'sticks') {
      const stickMaterial = new MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
      [-0.055, 0.055].forEach((offset) => {
        const stick = new Mesh(new BoxGeometry(0.055, 0.46, 0.055), stickMaterial);
        stick.position.x = offset;
        stick.rotation.z = offset < 0 ? 0.22 : -0.18;
        root.add(stick);
      });
      root.scale.setScalar(1.2);
      return root;
    }

    if (type === 'wooden-pickaxe') {
      const handleMaterial = new MeshStandardMaterial({ color: 0x7c4f2c, roughness: 0.9 });
      const headMaterial = new MeshStandardMaterial({ color: 0xc08a4e, roughness: 0.86 });
      const handle = new Mesh(new BoxGeometry(0.055, 0.62, 0.055), handleMaterial);
      handle.rotation.z = -0.42;
      handle.position.set(0.02, -0.04, 0);
      const head = new Mesh(new BoxGeometry(0.46, 0.075, 0.08), headMaterial);
      head.rotation.z = -0.42;
      head.position.set(-0.1, 0.22, 0);
      root.add(handle, head);
      root.scale.setScalar(1.1);
      return root;
    }

    if (type === 'wood') {
      const barkMaterial = new MeshStandardMaterial({ color: 0x6a452a, roughness: 0.92 });
      const ringMaterial = new MeshStandardMaterial({ color: 0xd0a36c, roughness: 0.88 });
      const log = new Mesh(new CylinderGeometry(0.18, 0.18, 0.42, 12), barkMaterial);
      log.rotation.set(Math.PI / 2, 0.28, 0.18);
      const leftRing = new Mesh(new CylinderGeometry(0.185, 0.185, 0.018, 12), ringMaterial);
      leftRing.rotation.copy(log.rotation);
      leftRing.position.z = -0.21;
      const rightRing = leftRing.clone();
      rightRing.position.z = 0.21;
      root.add(log, leftRing, rightRing);
      return root;
    }

    const block = new Mesh(new BoxGeometry(0.34, 0.34, 0.34), material);
    block.rotation.set(0.32, 0.58, 0.08);
    root.add(block);

    if (type === 'grass') {
      const grassTop = new Mesh(new BoxGeometry(0.35, 0.025, 0.35), new MeshStandardMaterial({ color: 0x62b44b, roughness: 0.9 }));
      grassTop.position.y = 0.18;
      grassTop.rotation.copy(block.rotation);
      root.add(grassTop);
    }

    if (type === 'planks' || type === 'crafting-table') {
      const grooveMaterial = new MeshStandardMaterial({ color: 0x6b3f22, roughness: 0.92 });
      [-0.08, 0.08].forEach((offset) => {
        const groove = new Mesh(new BoxGeometry(0.355, 0.012, 0.018), grooveMaterial);
        groove.position.set(0, 0.178, offset);
        groove.rotation.copy(block.rotation);
        root.add(groove);
      });
    }

    if (type === 'crafting-table') {
      const top = new Mesh(new BoxGeometry(0.36, 0.018, 0.36), new MeshStandardMaterial({ color: 0x4f2e18, roughness: 0.9 }));
      top.position.y = 0.18;
      top.rotation.copy(block.rotation);
      const toolMaterial = new MeshStandardMaterial({ color: 0x50565a, roughness: 0.72, metalness: 0.16 });
      const leftTool = new Mesh(new BoxGeometry(0.04, 0.22, 0.035), toolMaterial);
      leftTool.position.set(-0.21, -0.02, 0.02);
      leftTool.rotation.set(0.1, 0, -0.42);
      const rightTool = new Mesh(new BoxGeometry(0.035, 0.2, 0.035), new MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.86 }));
      rightTool.position.set(0.21, -0.02, -0.02);
      rightTool.rotation.set(0.1, 0, 0.36);
      root.add(top, leftTool, rightTool);
    }

    return root;
  }

  private getChapterSixHeldItemColor(type: ChapterSixItemType): number {
    switch (type) {
      case 'grass':
        return 0x4f9e3d;
      case 'dirt':
        return 0x7a4b2d;
      case 'stone':
        return 0x777d82;
      case 'wood':
        return 0x6a452a;
      case 'leaves':
        return 0x2f7d38;
      case 'planks':
        return 0xb9854e;
      case 'crafting-table':
        return 0x9b6338;
      case 'sticks':
      case 'wooden-pickaxe':
        return 0x8b5a2b;
      case 'possum':
        return 0x1f1814;
    }
  }

  private startChapterSixPossumPickupAnimation(): void {
    this.chapterSixPossumPickupTimer = 1.1;
  }

  private updateChapterSixHeldItemDisplay(deltaSeconds: number): void {
    if (
      !this.chapterSixActive
      || !this.player.isLocked()
      || this.chapterSix.isInventoryOpen()
      || this.chapterSix.isPettingPossum()
      || this.chapterMenuOpen
    ) {
      this.chapterSixHeldItemAnchor.visible = false;
      return;
    }

    const selectedStack = this.chapterSix.getSelectedHotbarStack();
    if (!selectedStack.type || selectedStack.count <= 0) {
      this.chapterSixHeldItemAnchor.visible = false;
      return;
    }

    if (this.chapterSixHeldItemType !== selectedStack.type || !this.chapterSixHeldItemModel) {
      if (this.chapterSixHeldItemModel) {
        this.chapterSixHeldItemAnchor.remove(this.chapterSixHeldItemModel);
      }
      this.chapterSixHeldItemType = selectedStack.type;
      this.chapterSixHeldItemModel = this.createChapterSixHeldItemModel(selectedStack.type);
      this.chapterSixHeldItemAnchor.add(this.chapterSixHeldItemModel);
    }

    const bob = Math.sin((this.elapsed + deltaSeconds) * 7.5) * 0.018;
    const pickup = MathUtils.clamp(this.chapterSixPossumPickupTimer / 1.1, 0, 1);
    const holdingPossum = selectedStack.type === 'possum';
    this.chapterSixHeldItemAnchor.visible = true;
    this.chapterSixHeldItemAnchor.position.set(
      holdingPossum ? MathUtils.lerp(0.12, 0.42, 1 - pickup) : 0.46,
      holdingPossum ? MathUtils.lerp(-0.58, -0.36 + bob, 1 - pickup) : -0.34 + bob,
      holdingPossum ? MathUtils.lerp(-0.86, -0.72, 1 - pickup) : -0.72,
    );
    this.chapterSixHeldItemAnchor.rotation.set(
      holdingPossum ? MathUtils.lerp(-0.48, -0.12 + bob * 0.7, 1 - pickup) : -0.18 + bob * 0.7,
      holdingPossum ? MathUtils.lerp(-0.02, -0.34, 1 - pickup) : -0.42,
      holdingPossum ? MathUtils.lerp(0.02, 0.12, 1 - pickup) : 0.16,
    );
  }

  private createChapterEightHeldItemModel(type: ChapterEightHeldItem): Group {
    const root = new Group();
    const skinMaterial = new MeshStandardMaterial({ color: 0xd49b73, roughness: 0.84 });
    const sleeveMaterial = new MeshStandardMaterial({ color: 0x2c3b2b, roughness: 0.9 });
    const hand = new Mesh(new BoxGeometry(0.18, 0.13, 0.22), skinMaterial);
    hand.position.set(0.12, -0.24, 0.06);
    const sleeve = new Mesh(new BoxGeometry(0.16, 0.34, 0.18), sleeveMaterial);
    sleeve.position.set(0.2, -0.44, 0.1);
    root.add(hand, sleeve);

    if (type === 'military-knife') {
      const handleMaterial = new MeshStandardMaterial({ color: 0x26221b, roughness: 0.88, metalness: 0.05 });
      const gripMaterial = new MeshStandardMaterial({ color: 0x14120f, roughness: 0.92, metalness: 0.02 });
      const metalMaterial = new MeshStandardMaterial({ color: 0x9ea7a8, roughness: 0.34, metalness: 0.68 });
      const edgeMaterial = new MeshStandardMaterial({ color: 0xd7dee0, roughness: 0.24, metalness: 0.72, side: DoubleSide });
      const guardMaterial = new MeshStandardMaterial({ color: 0x5b6261, roughness: 0.44, metalness: 0.52 });

      const knife = new Group();
      knife.position.set(0.02, -0.03, -0.04);
      knife.rotation.set(0.08, -0.05, -0.26);

      const handle = new Mesh(new CylinderGeometry(0.055, 0.06, 0.42, 14), handleMaterial);
      handle.position.y = -0.19;
      const pommel = new Mesh(new CylinderGeometry(0.066, 0.066, 0.045, 14), guardMaterial);
      pommel.position.y = -0.43;
      const guard = new Mesh(new BoxGeometry(0.3, 0.04, 0.075), guardMaterial);
      guard.position.y = 0.035;

      [-0.31, -0.19, -0.07].forEach((gripY) => {
        const gripRing = new Mesh(new CylinderGeometry(0.064, 0.067, 0.028, 14), gripMaterial);
        gripRing.position.y = gripY;
        knife.add(gripRing);
      });

      const bladeShape = new Shape();
      bladeShape.moveTo(-0.04, 0.04);
      bladeShape.lineTo(-0.04, 0.58);
      bladeShape.lineTo(0.0, 0.7);
      bladeShape.quadraticCurveTo(0.105, 0.48, 0.082, 0.06);
      bladeShape.lineTo(-0.04, 0.04);
      const blade = new Mesh(new ShapeGeometry(bladeShape, 18), metalMaterial);
      blade.position.set(0, 0.02, -0.018);
      const sharpenedEdgeShape = new Shape();
      sharpenedEdgeShape.moveTo(0.022, 0.08);
      sharpenedEdgeShape.quadraticCurveTo(0.078, 0.42, 0.0, 0.66);
      sharpenedEdgeShape.quadraticCurveTo(0.052, 0.42, 0.046, 0.1);
      sharpenedEdgeShape.lineTo(0.022, 0.08);
      const edge = new Mesh(new ShapeGeometry(sharpenedEdgeShape, 12), edgeMaterial);
      edge.position.set(0, 0.022, -0.021);
      const flatSpine = new Mesh(new BoxGeometry(0.018, 0.56, 0.018), guardMaterial);
      flatSpine.position.set(-0.044, 0.34, -0.012);

      knife.add(handle, pommel, guard, blade, edge, flatSpine);
      root.add(knife);
      root.rotation.set(0.14, 0.22, -0.02);
      root.scale.setScalar(1.16);
    } else if (type === 'torch') {
      const woodMaterial = new MeshStandardMaterial({ color: 0x5b351d, roughness: 0.92, metalness: 0.01 });
      const wrapMaterial = new MeshStandardMaterial({ color: 0x1a1510, roughness: 0.86, metalness: 0.02 });
      const flameOuterMaterial = new MeshStandardMaterial({
        color: 0xff6a21,
        emissive: 0xff3d0c,
        emissiveIntensity: 3.8,
        roughness: 0.42,
        transparent: true,
        opacity: 0.76,
      });
      const flameInnerMaterial = new MeshStandardMaterial({
        color: 0xffdf77,
        emissive: 0xffa52a,
        emissiveIntensity: 5.2,
        roughness: 0.34,
        transparent: true,
        opacity: 0.9,
      });
      const torch = new Group();
      torch.position.set(0.08, -0.08, -0.04);
      torch.rotation.set(-0.24, -0.16, -0.28);
      const handle = new Mesh(new CylinderGeometry(0.055, 0.08, 0.92, 10), woodMaterial);
      handle.position.y = -0.18;
      const wrap = new Mesh(new CylinderGeometry(0.1, 0.11, 0.22, 10), wrapMaterial);
      wrap.position.y = 0.36;
      const flameOuter = new Mesh(new ConeGeometry(0.18, 0.5, 9), flameOuterMaterial);
      flameOuter.position.y = 0.78;
      const flameInner = new Mesh(new ConeGeometry(0.1, 0.36, 8), flameInnerMaterial);
      flameInner.position.y = 0.72;
      const torchLight = new PointLight(0xffad56, 10.5, 58, 1.18);
      torchLight.position.set(0, 0.64, -0.18);
      torch.add(handle, wrap, flameOuter, flameInner, torchLight);
      root.add(torch);
      root.rotation.set(0.18, 0.08, 0.12);
    }

    return root;
  }

  private updateChapterEightHeldItemDisplay(deltaSeconds: number): void {
    this.chapterEightKnifeAttackTimer = Math.max(0, this.chapterEightKnifeAttackTimer - deltaSeconds);
    if (this.chapterEightKnifeAttackTimer <= 0) {
      this.chapterEightKnifeAttackMode = null;
    }

    if (
      !this.chapterEightActive
      || !this.player.isLocked()
      || this.chapterMenuOpen
      || this.placementToolActive
      || (this.chapterEightHeldItem !== 'military-knife' && this.chapterEightHeldItem !== 'torch')
      || (this.chapterEightHeldItem === 'torch' && !this.chapterEight.hasTorch())
    ) {
      this.chapterEightHeldItemAnchor.visible = false;
      return;
    }

    if (this.chapterEightHeldItemModelType !== this.chapterEightHeldItem || !this.chapterEightHeldItemModel) {
      if (this.chapterEightHeldItemModel) {
        this.chapterEightHeldItemAnchor.remove(this.chapterEightHeldItemModel);
      }
      this.chapterEightHeldItemModelType = this.chapterEightHeldItem;
      this.chapterEightHeldItemModel = this.createChapterEightHeldItemModel(this.chapterEightHeldItem);
      this.chapterEightHeldItemAnchor.add(this.chapterEightHeldItemModel);
    }

    const bob = Math.sin((this.elapsed + deltaSeconds) * 6.8) * 0.014;
    const attackProgress = this.chapterEightHeldItem === 'military-knife' && this.chapterEightKnifeAttackMode
      ? 1 - this.chapterEightKnifeAttackTimer / CHAPTER_EIGHT_KNIFE_ATTACK_SECONDS
      : 0;
    const clampedAttackProgress = MathUtils.clamp(attackProgress, 0, 1);
    const attackArc = Math.sin(clampedAttackProgress * Math.PI);
    const slashWindup = this.chapterEightKnifeAttackMode === 'slash'
      ? 1 - MathUtils.smoothstep(clampedAttackProgress, 0, 0.28)
      : 0;
    const slashCut = this.chapterEightKnifeAttackMode === 'slash'
      ? MathUtils.smoothstep(clampedAttackProgress, 0.16, 0.74)
      : 0;
    const stabThrust = this.chapterEightKnifeAttackMode === 'stab'
      ? MathUtils.smoothstep(clampedAttackProgress, 0.08, 0.52) * (1 - MathUtils.smoothstep(clampedAttackProgress, 0.62, 1))
      : 0;

    const slashX = slashWindup * 0.22 - slashCut * 0.52;
    const slashY = slashWindup * 0.19 - slashCut * 0.24;
    const slashTilt = slashWindup * -0.85 + slashCut * 1.15;

    this.chapterEightHeldItemAnchor.visible = true;
    this.chapterEightHeldItemAnchor.position.set(
      0.42 + slashX,
      (this.chapterEightHeldItem === 'torch' ? -0.44 : -0.39) + bob + slashY,
      -0.68 - stabThrust * 0.48,
    );
    this.chapterEightHeldItemAnchor.rotation.set(
      -0.18 + bob * 0.45 + attackArc * 0.12 - stabThrust * 0.82,
      -0.42 + slashTilt - stabThrust * 0.08,
      0.08 - slashWindup * 0.7 + slashCut * 1.18 + stabThrust * 0.18,
    );
  }

  private createChapterSixPettingArmModel(): void {
    this.chapterSixPettingArmAnchor.clear();
    const skinMaterial = new MeshStandardMaterial({ color: 0xd49b73, roughness: 0.86 });
    const sleeveMaterial = new MeshStandardMaterial({ color: 0x4f7ec7, roughness: 0.82 });
    const sleeve = new Mesh(new BoxGeometry(0.18, 0.34, 0.18), sleeveMaterial);
    sleeve.position.set(0, -0.2, 0.12);
    const forearm = new Mesh(new BoxGeometry(0.16, 0.66, 0.16), skinMaterial);
    forearm.position.set(0, 0.16, -0.14);
    const hand = new Mesh(new BoxGeometry(0.2, 0.12, 0.22), skinMaterial);
    hand.position.set(0, 0.54, -0.32);
    this.chapterSixPettingArmAnchor.add(sleeve, forearm, hand);
  }

  private updateChapterSixPettingArmDisplay(deltaSeconds: number): void {
    this.chapterSixPossumPickupTimer = Math.max(0, this.chapterSixPossumPickupTimer - deltaSeconds);
    const pickupActive = this.chapterSixPossumPickupTimer > 0;
    const visible = this.chapterSixActive
      && this.player.isLocked()
      && (this.chapterSix.isPettingPossum() || pickupActive)
      && !this.chapterMenuOpen;
    this.chapterSixPettingArmAnchor.visible = visible;
    if (!visible) {
      return;
    }

    if (pickupActive) {
      const progress = 1 - this.chapterSixPossumPickupTimer / 1.1;
      const wrap = MathUtils.smoothstep(progress, 0.08, 0.72);
      this.chapterSixPettingArmAnchor.position.set(
        MathUtils.lerp(0.48, 0.18, wrap),
        MathUtils.lerp(-0.72, -0.48, wrap),
        MathUtils.lerp(-0.58, -0.9, wrap),
      );
      this.chapterSixPettingArmAnchor.rotation.set(
        MathUtils.lerp(-0.4, -1.12, wrap),
        MathUtils.lerp(-0.58, -0.12, wrap),
        MathUtils.lerp(0.4, 0.02, wrap),
      );
      return;
    }

    const time = this.elapsed + deltaSeconds;
    const stroke = (Math.sin(time * 8.4) + 1) * 0.5;
    this.chapterSixPettingArmAnchor.position.set(
      MathUtils.lerp(0.22, 0.08, stroke),
      MathUtils.lerp(-0.62, -0.44, stroke),
      MathUtils.lerp(-0.72, -1.02, stroke),
    );
    this.chapterSixPettingArmAnchor.rotation.set(
      MathUtils.lerp(-0.72, -1.05, stroke),
      MathUtils.lerp(-0.28, -0.08, stroke),
      MathUtils.lerp(0.22, 0.08, stroke),
    );
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

  private enterChapterSevenSwing(): void {
    this.chapterSevenSwingSeated = true;
    this.chapterSevenCrawling = false;
    this.chapterSevenForcedCrawl = false;
    this.chapterSeven.setSwingOccupied(true);
    this.player.teleport(this.chapterSeven.swingSet.sitPosition);
    this.player.lookToward(this.chapterSeven.swingSet.lookTarget, 1);
    this.pushStatus('You climb onto the swing set. Hold W to swing, and press E to get back off.', 2.4);
  }

  private leaveChapterSevenSwing(): void {
    this.chapterSevenSwingSeated = false;
    this.chapterSeven.setSwingOccupied(false);
    this.player.teleport(this.chapterSeven.swingSet.exitPosition);
    this.player.lookToward(this.chapterSeven.swingSet.lookTarget, 1);
    this.pushStatus('You step off the swing set.', 1.8);
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

  private getChapterFourPurpleJumpscareIntensity(): number {
    if (this.chapterFourPurpleJumpscareTimer <= 0) {
      return 0;
    }

    const progress = MathUtils.clamp(
      1 - this.chapterFourPurpleJumpscareTimer / CHAPTER_FOUR_PURPLE_JUMPSCARE_DURATION,
      0,
      1,
    );
    const faceCreep = MathUtils.smoothstep(progress, 0.02, 0.62) * 0.72;
    const smile = MathUtils.smoothstep(progress, 0.42, 0.78) * 0.28;
    const chomp = MathUtils.smoothstep(progress, 0.78, 0.94);
    const twitch = Math.max(0, Math.sin(progress * Math.PI * 18)) * Math.pow(1 - progress, 0.36) * 0.12;

    return MathUtils.clamp(Math.max(faceCreep + smile, chomp) + twitch, 0, 1);
  }

  private getChapterFourBlueJumpscareIntensity(): number {
    if (this.chapterFourBlueJumpscareTimer <= 0) {
      return 0;
    }

    const progress = MathUtils.clamp(
      1 - this.chapterFourBlueJumpscareTimer / CHAPTER_FOUR_BLUE_JUMPSCARE_DURATION,
      0,
      1,
    );
    const laughLean = MathUtils.smoothstep(progress, 0.04, 0.38) * 0.48;
    const grab = MathUtils.smoothstep(progress, 0.36, 0.68) * 0.34;
    const scream = MathUtils.smoothstep(progress, 0.62, 0.9);
    const shake = Math.max(0, Math.sin(progress * Math.PI * 16)) * Math.pow(1 - progress, 0.42) * 0.12;

    return MathUtils.clamp(Math.max(laughLean + grab, scream) + shake, 0, 1);
  }

  private getChapterFourGreenJumpscareIntensity(): number {
    if (this.chapterFourGreenJumpscareTimer <= 0) {
      return 0;
    }

    const progress = MathUtils.clamp(
      1 - this.chapterFourGreenJumpscareTimer / CHAPTER_FOUR_GREEN_JUMPSCARE_DURATION,
      0,
      1,
    );
    const grab = MathUtils.smoothstep(progress, 0.02, 0.34) * 0.42;
    const rip = MathUtils.smoothstep(progress, 0.28, 0.54) * 0.24;
    const scream = MathUtils.smoothstep(progress, 0.5, 0.88);
    const shake = Math.max(0, Math.sin(progress * Math.PI * 24)) * Math.pow(1 - progress, 0.38) * 0.14;

    return MathUtils.clamp(Math.max(grab + rip, scream) + shake, 0, 1);
  }

  private getCombinedJumpScareIntensity(): number {
    return Math.max(
      this.getJumpScareIntensity(),
      this.getChapterTwoBearRefusalIntensity(),
      this.getOfficeJumpscareIntensity(),
      this.getChapterFourPurpleJumpscareIntensity(),
      this.getChapterFourBlueJumpscareIntensity(),
      this.getChapterFourGreenJumpscareIntensity(),
    );
  }

  private getHudJumpScareIntensity(): number {
    return Math.max(
      this.getJumpScareIntensity(),
      this.getChapterTwoBearRefusalIntensity(),
      this.getChapterFourPurpleJumpscareIntensity(),
      this.getChapterFourBlueJumpscareIntensity(),
      this.getChapterFourGreenJumpscareIntensity(),
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
    if (this.chapterFourBlueJumpscareTimer > 0) {
      return null;
    }

    if (this.chapterFourGreenJumpscareTimer > 0) {
      return null;
    }

    if (this.chapterFourPurpleJumpscareTimer > 0) {
      return 'purple';
    }

    if (this.activeJumpscare) {
      return this.activeJumpscare.variant;
    }

    if (this.chapterTwoActive && this.chapterTwoBearRefusalTimer > 0) {
      return 'bear';
    }

    return null;
  }

  private triggerChapterFourPurpleJumpscare(): void {
    this.chapterFourPurpleJumpscareTimer = CHAPTER_FOUR_PURPLE_JUMPSCARE_DURATION;
    this.chapterFourPurpleJumpscareCooldown = CHAPTER_FOUR_PURPLE_JUMPSCARE_COOLDOWN;
    this.chapterFourCrouching = false;
    this.playPurpleJumpscareSound();
    this.pushStatus('Purple is already in your face. The smile starts to open.', 2.2);
    this.syncHud();
  }

  private triggerChapterFourBlueJumpscare(): void {
    this.chapterFourBlueJumpscareTimer = CHAPTER_FOUR_BLUE_JUMPSCARE_DURATION;
    this.chapterFourBlueJumpscareCooldown = CHAPTER_FOUR_BLUE_JUMPSCARE_COOLDOWN;
    this.chapterFourCrouching = false;
    this.chapterFourBoxActive = false;
    this.chapterFourGreenJumpscareAnchor.visible = false;
    this.chapterFourBlueJumpscareAnchor.visible = false;
    this.chapterFour.endGreenJumpscareView();
    this.chapterFour.beginBlueJumpscareView(this.camera);
    this.gameplaySfxAudio.playOfficeJumpscareCue('stomp-roar');
    this.pushStatus('Blue grabs you, opens his mouth wide, and screams in your face.', 2.4);
    this.syncHud();
  }

  private triggerChapterFourGreenJumpscare(rippedBox: boolean): void {
    this.chapterFourGreenJumpscareTimer = CHAPTER_FOUR_GREEN_JUMPSCARE_DURATION;
    this.chapterFourGreenJumpscareCooldown = CHAPTER_FOUR_GREEN_JUMPSCARE_COOLDOWN;
    this.chapterFourCrouching = false;
    this.chapterFourBoxActive = false;
    this.chapterFourBoxHeld = false;
    this.chapterFourBoxViewMode = 'normal';
    this.chapterFourBlueJumpscareAnchor.visible = false;
    this.chapterFourGreenJumpscareAnchor.visible = false;
    this.chapterFour.endBlueJumpscareView();
    this.chapterFour.beginGreenJumpscareView(this.camera);
    this.gameplaySfxAudio.playOfficeJumpscareCue('broken-crawl');
    this.pushStatus(
      rippedBox
        ? 'Green feels the box, rips it off, and grabs you with his long arms.'
        : 'Green catches you with one sweeping hand and grabs you.',
      2.4,
    );
    this.syncHud();
  }

  private resetChapterFourPurpleJumpscare(): void {
    this.chapterFourPurpleJumpscareTimer = 0;
    this.chapterFourPurpleJumpscareCooldown = 0;
    this.resetChapterFourBlueJumpscare();
    this.resetChapterFourGreenJumpscare();
  }

  private resetChapterFourBlueJumpscare(): void {
    this.chapterFourBlueJumpscareTimer = 0;
    this.chapterFourBlueJumpscareCooldown = 0;
    this.chapterFourBlueJumpscareAnchor.visible = false;
    this.chapterFour.endBlueJumpscareView();
  }

  private resetChapterFourGreenJumpscare(): void {
    this.chapterFourGreenJumpscareTimer = 0;
    this.chapterFourGreenJumpscareCooldown = 0;
    this.chapterFourGreenJumpscareAnchor.visible = false;
    this.chapterFour.endGreenJumpscareView();
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
    this.chapterFourActive = false;
    this.chapterFiveActive = false;
    this.chapterSixActive = false;
    this.chapterSevenActive = false;
    this.chapterEightActive = false;
    this.zombieModeActive = false;
    this.doomModeActive = false;
    this.chapterMenuOpen = false;
    this.chapterTwoCardTime = 0;
    this.chapterCardTitle = 'Chapter One: scary-sushi';
    this.chapterCardBody = 'The kitchen challenge is live. Search the maze for raw ingredients, process them through the labeled machines, plate both rolls, and send them to the judges.';
    this.activeJumpscare = null;
    this.resetChapterFourPurpleJumpscare();
    this.clearMicrophoneSoundToolState();
    this.clearCameraToolState();
    this.placementToolActive = false;
    this.placementToolAnchor.visible = false;
    this.placementPreview.visible = false;
    this.touchingMonster = null;
    this.monsterState = this.unlockedMonsterState;
    this.transientStatusTime = 0;
    this.chapterTwo.root.visible = false;
    this.officeChapter.root.visible = false;
    this.chapterFour.root.visible = false;
    this.chapterFive.root.visible = false;
    this.chapterFive.screenShip.visible = false;
    this.chapterSix.root.visible = false;
    this.chapterSeven.root.visible = false;
    this.chapterEight.root.visible = false;
    this.zombieMode.root.visible = false;
    this.chapterTwo.reset();
    this.officeChapter.reset();
    this.chapterFour.reset();
    this.chapterFive.reset();
    this.chapterSix.reset();
    this.chapterSeven.reset();
    this.chapterEight.reset();
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
    this.chapterFourLockerId = null;
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

    if (this.chapterTwoActive || this.officeChapterActive || this.chapterFourActive || this.chapterFiveActive || this.chapterSixActive || this.chapterSevenActive || this.chapterEightActive || this.zombieModeActive || this.doomModeActive) {
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
    this.chapterFourActive = false;
    this.chapterFiveActive = false;
    this.chapterSixActive = false;
    this.chapterSevenActive = false;
    this.chapterEightActive = false;
    this.zombieModeActive = false;
    this.doomModeActive = false;
    this.chapterMenuOpen = false;
    this.chapterTwoCardTime = 3.6;
    this.chapterCardTitle = 'Chapter Two: daycare horror';
    this.chapterCardBody =
      CHAPTER_TWO_STARTS_WITH_ALL_DODO_EGGS && CHAPTER_TWO_STARTS_WITH_ALL_BLUE_BEARS
        ? 'The daycare lobby is still set up for families. Red access is live, every dodo egg is already in your hands, and every missing blue teddy bear is already with you too.'
        : CHAPTER_TWO_STARTS_WITH_ALL_DODO_EGGS
          ? 'The daycare lobby is still set up for families. Red access is live, and every dodo egg is already in your hands. Find the strange dodo and feed it every egg to reveal the blue key card.'
        : 'The daycare lobby is still set up for families. Red access is live now, but the egg hunt does not begin until you visit the strange dodo.';
    this.activeJumpscare = null;
    this.resetChapterFourPurpleJumpscare();
    this.clearMicrophoneSoundToolState();
    this.clearCameraToolState();
    this.touchingMonster = null;
    this.monsterState = this.unlockedMonsterState;
    this.transientStatusTime = 0;
    this.level.root.visible = false;
    this.officeChapter.root.visible = false;
    this.chapterFour.root.visible = false;
    this.chapterFive.root.visible = false;
    this.chapterFive.screenShip.visible = false;
    this.chapterSix.root.visible = false;
    this.chapterSeven.root.visible = false;
    this.chapterEight.root.visible = false;
    this.zombieMode.root.visible = false;
    this.doomMode.root.visible = false;
    this.chapterTwo.reset();
    this.officeChapter.reset();
    this.chapterFour.reset();
    this.chapterFive.reset();
    this.chapterSix.reset();
    this.chapterSeven.reset();
    this.chapterEight.reset();
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
    this.chapterFourActive = false;
    this.chapterFiveActive = false;
    this.chapterSixActive = false;
    this.chapterSevenActive = false;
    this.chapterEightActive = false;
    this.zombieModeActive = true;
    this.doomModeActive = false;
    this.chapterMenuOpen = false;
    this.chapterTwoCardTime = ZOMBIE_CARD_DURATION;
    this.chapterCardTitle = 'Zombie First Person Shooter';
    this.chapterCardBody =
      'The forest goes dark every night. Use the daylight to upgrade the four barricades, then hold the clearing with the pistol and shotgun when the zombies come in.';
    this.activeJumpscare = null;
    this.resetChapterFourPurpleJumpscare();
    this.clearMicrophoneSoundToolState();
    this.clearCameraToolState();
    this.touchingMonster = null;
    this.monsterState = this.unlockedMonsterState;
    this.transientStatusTime = 0;
    this.level.root.visible = false;
    this.chapterTwo.root.visible = false;
    this.officeChapter.root.visible = false;
    this.chapterFour.root.visible = false;
    this.chapterFive.root.visible = false;
    this.chapterFive.screenShip.visible = false;
    this.chapterSix.root.visible = false;
    this.chapterSeven.root.visible = false;
    this.chapterEight.root.visible = false;
    this.doomMode.root.visible = false;
    this.zombieMode.root.visible = true;
    this.chapterTwo.reset();
    this.officeChapter.reset();
    this.chapterFour.reset();
    this.chapterFive.reset();
    this.chapterSix.reset();
    this.chapterSeven.reset();
    this.chapterEight.reset();
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
    this.chapterFourActive = false;
    this.chapterFiveActive = false;
    this.chapterSixActive = false;
    this.chapterSevenActive = false;
    this.chapterEightActive = false;
    this.zombieModeActive = false;
    this.doomModeActive = true;
    this.chapterMenuOpen = false;
    this.chapterTwoCardTime = DOOM_CARD_DURATION;
    this.chapterCardTitle = 'Doom Run';
    this.chapterCardBody =
      'A retro techbase run. Move fast, rip through the demons, grab the red, yellow, and blue key cards, and hit the exit switch.';
    this.activeJumpscare = null;
    this.resetChapterFourPurpleJumpscare();
    this.clearMicrophoneSoundToolState();
    this.clearCameraToolState();
    this.touchingMonster = null;
    this.monsterState = this.unlockedMonsterState;
    this.transientStatusTime = 0;
    this.level.root.visible = false;
    this.chapterTwo.root.visible = false;
    this.officeChapter.root.visible = false;
    this.chapterFour.root.visible = false;
    this.chapterFive.root.visible = false;
    this.chapterFive.screenShip.visible = false;
    this.chapterSix.root.visible = false;
    this.chapterSeven.root.visible = false;
    this.chapterEight.root.visible = false;
    this.zombieMode.root.visible = false;
    this.doomMode.root.visible = true;
    this.chapterTwo.reset();
    this.officeChapter.reset();
    this.chapterFour.reset();
    this.chapterFive.reset();
    this.chapterSix.reset();
    this.chapterSeven.reset();
    this.chapterEight.reset();
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

  private beginChapterFour(): void {
    this.stopOfficeGameMode();
    this.chapterTwoActive = false;
    this.officeChapterActive = false;
    this.chapterFourActive = true;
    this.chapterFiveActive = false;
    this.chapterSixActive = false;
    this.chapterSevenActive = false;
    this.chapterEightActive = false;
    this.zombieModeActive = false;
    this.doomModeActive = false;
    this.chapterMenuOpen = false;
    this.chapterTwoCardTime = 3.6;
    this.chapterCardTitle = 'Chapter Four: rainbow friends';
    this.chapterCardBody =
      'A new Five Nights prototype map with an office, two different hallway routes, side rooms with push-open doors, and a cardboard box inventory item.';
    this.activeJumpscare = null;
    this.resetChapterFourPurpleJumpscare();
    this.touchingMonster = null;
    this.monsterState = this.unlockedMonsterState;
    this.transientStatusTime = 0;
    this.level.root.visible = false;
    this.chapterTwo.root.visible = false;
    this.officeChapter.root.visible = false;
    this.chapterFour.reset();
    this.chapterFour.root.visible = true;
    this.chapterFive.root.visible = false;
    this.chapterFive.screenShip.visible = false;
    this.chapterSix.root.visible = false;
    this.chapterSeven.root.visible = false;
    this.chapterEight.root.visible = false;
    this.zombieMode.root.visible = false;
    this.doomMode.root.visible = false;
    this.chapterTwo.reset();
    this.officeChapter.reset();
    this.chapterFive.reset();
    this.chapterSix.reset();
    this.chapterSeven.reset();
    this.chapterEight.reset();
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
    this.player.teleport(this.chapterFour.spawn);
    this.player.lookToward(this.chapterFour.lookTarget, 1);
    this.pushStatus(
      'Chapter four loaded. Walk into doors to push them open, press C to crawl inside the Cardboard Box, and press B to put it away.',
      3.2,
    );
    this.resize();
  }

  private toggleChapterFiveInteriorMode(): void {
    if (!this.chapterFiveActive) {
      return;
    }

    if (this.chapterFive.isSurfaceMode()) {
      this.pushStatus('You are already outside on the planet surface. The landed ship is behind you.', 2.4);
      return;
    }

    if (this.chapterFive.isInteriorMode()) {
      this.chapterFive.setInteriorMode(false);
      this.chapterFive.screenShip.visible = true;
      this.player.teleport(this.chapterFive.spawn);
      this.player.lookToward(this.chapterFive.lookTarget, 1);
      this.pushStatus('You return to the outside spaceship view. Press T to step back inside.', 2.4);
    } else {
      this.chapterFive.setInteriorMode(true);
      this.chapterFive.screenShip.visible = false;
      this.player.teleport(this.chapterFive.interiorSpawn);
      this.player.lookToward(this.chapterFive.interiorLookTarget, 1);
      this.flashlight.setEnabled(false);
      this.pushStatus('You step inside the spaceship. Small rooms branch from the central walkway, and the side windows show stars drifting past.', 3.2);
    }

    this.syncHud();
  }

  private stepOutToChapterFiveSurface(): void {
    if (!this.chapterFiveActive || !this.chapterFive.getMonitorState().landed) {
      return;
    }

    this.chapterFive.setMonitorActive(false);
    this.chapterFive.setSurfaceMode(true);
    this.chapterFive.screenShip.visible = false;
    this.player.teleport(this.chapterFive.surfaceSpawn);
    this.player.lookToward(this.chapterFive.surfaceLookTarget, 1);
    this.player.lock();
    this.flashlight.setEnabled(false);
    this.pushStatus('You step out onto the planet surface. The ship is lying in the open landing area, with hills and abandoned structures around it.', 3.2);
    this.syncHud();
  }

  private beginChapterFive(): void {
    this.stopOfficeGameMode();
    this.chapterTwoActive = false;
    this.officeChapterActive = false;
    this.chapterFourActive = false;
    this.chapterFiveActive = true;
    this.chapterSixActive = false;
    this.chapterSevenActive = false;
    this.chapterEightActive = false;
    this.zombieModeActive = false;
    this.doomModeActive = false;
    this.chapterMenuOpen = false;
    this.officeJumpscareMenuOpen = false;
    this.officeModeMenuOpen = false;
    this.chapterTwoCardTime = 3.6;
    this.chapterCardTitle = 'Chapter Five: space adventure/horror';
    this.chapterCardBody =
      'A chase-view spaceship prototype: outer space, a semi-realistic ship, thrusters that burn harder when you move faster, and a small T-key interior.';
    this.activeJumpscare = null;
    this.resetChapterFourPurpleJumpscare();
    this.clearMicrophoneSoundToolState();
    this.clearCameraToolState();
    this.touchingMonster = null;
    this.monsterState = this.unlockedMonsterState;
    this.transientStatusTime = 0;
    this.level.root.visible = false;
    this.chapterTwo.root.visible = false;
    this.officeChapter.root.visible = false;
    this.chapterFour.root.visible = false;
    this.chapterFive.reset();
    this.chapterFiveAlarmWasActive = false;
    this.chapterFive.root.visible = true;
    this.chapterFive.screenShip.visible = true;
    this.chapterSix.root.visible = false;
    this.chapterSeven.root.visible = false;
    this.chapterEight.root.visible = false;
    this.zombieMode.root.visible = false;
    this.doomMode.root.visible = false;
    this.chapterTwo.reset();
    this.officeChapter.reset();
    this.chapterFour.reset();
    this.chapterSix.reset();
    this.chapterSeven.reset();
    this.chapterEight.reset();
    this.zombieMode.reset();
    this.doomMode.reset();
    this.chapterTwoSeatId = null;
    this.chapterTwoClimb = null;
    this.chapterTwoSlide = null;
    this.chapterTwo.setOccupiedSeat(null);
    this.officeChapterSeated = false;
    this.chapterFourBoxHeld = false;
    this.chapterFourBoxActive = false;
    this.chapterFourBoxViewMode = 'normal';
    this.chapterFourLockerId = null;
    this.chapterFourCrouching = false;
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
    this.player.teleport(this.chapterFive.spawn);
    this.player.lookToward(this.chapterFive.lookTarget, 1);
    this.pushStatus(
      'Chapter five loaded. Mouse look aims the spaceship, W speeds up, S slows down, Shift makes the thrusters flare harder, and T steps inside.',
      3.2,
    );
    this.resize();
  }

  private beginChapterSix(): void {
    this.stopOfficeGameMode();
    this.chapterTwoActive = false;
    this.officeChapterActive = false;
    this.chapterFourActive = false;
    this.chapterFiveActive = false;
    this.chapterSixActive = true;
    this.chapterSevenActive = false;
    this.chapterEightActive = false;
    this.zombieModeActive = false;
    this.doomModeActive = false;
    this.chapterMenuOpen = false;
    this.officeJumpscareMenuOpen = false;
    this.officeModeMenuOpen = false;
    this.chapterTwoCardTime = 3.6;
    this.chapterCardTitle = 'Chapter Six: Minecraft';
    this.chapterCardBody =
      'A bright block world made from pixel-textured grass, dirt, stone, hills, and blocky trees.';
    this.activeJumpscare = null;
    this.resetChapterFourPurpleJumpscare();
    this.clearMicrophoneSoundToolState();
    this.clearCameraToolState();
    this.placementToolActive = false;
    this.placementToolAnchor.visible = false;
    this.placementPreview.visible = false;
    this.touchingMonster = null;
    this.monsterState = this.unlockedMonsterState;
    this.transientStatusTime = 0;
    this.level.root.visible = false;
    this.chapterTwo.root.visible = false;
    this.officeChapter.root.visible = false;
    this.chapterFour.root.visible = false;
    this.chapterFive.root.visible = false;
    this.chapterFive.screenShip.visible = false;
    this.chapterSix.reset();
    this.chapterSix.root.visible = true;
    this.chapterSeven.root.visible = false;
    this.chapterEight.root.visible = false;
    this.zombieMode.root.visible = false;
    this.doomMode.root.visible = false;
    this.chapterTwo.reset();
    this.officeChapter.reset();
    this.chapterFour.reset();
    this.chapterFive.reset();
    this.chapterSeven.reset();
    this.chapterEight.reset();
    this.zombieMode.reset();
    this.doomMode.reset();
    this.chapterTwoSeatId = null;
    this.chapterTwoClimb = null;
    this.chapterTwoSlide = null;
    this.chapterTwo.setOccupiedSeat(null);
    this.officeChapterSeated = false;
    this.chapterFourBoxHeld = false;
    this.chapterFourBoxActive = false;
    this.chapterFourBoxViewMode = 'normal';
    this.chapterFourLockerId = null;
    this.chapterFourCrouching = false;
    this.chapterSevenCrawling = false;
    this.chapterSevenForcedCrawl = false;
    this.chapterSevenBoxHidden = false;
    this.chapterSevenOvenHidden = false;
    this.chapterSevenSwingSeated = false;
    this.chapterSeven.setSwingOccupied(false);
    this.chapterFourBoxHeldAnchor.visible = false;
    this.chapterFourBoxHideAnchor.visible = false;
    this.chapterFourBoxWideAnchor.visible = false;
    this.chapterFourBoxWorldAnchor.visible = false;
    this.chapterSevenBoxHideAnchor.visible = false;
    this.chapterSevenOvenHideAnchor.visible = false;
    this.chapterSevenOvenDoorOverlay.visible = false;
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
    this.player.teleport(this.chapterSix.spawn);
    this.player.lookToward(this.chapterSix.lookTarget, 1);
    this.pushStatus(
      'Chapter six loaded. Walk the pixel grass hills, block trees, dirt layers, and exposed stone cubes.',
      3.2,
    );
    this.resize();
  }

  private beginChapterSeven(): void {
    this.stopOfficeGameMode();
    this.chapterTwoActive = false;
    this.officeChapterActive = false;
    this.chapterFourActive = false;
    this.chapterFiveActive = false;
    this.chapterSixActive = false;
    this.chapterSevenActive = true;
    this.chapterEightActive = false;
    this.zombieModeActive = false;
    this.doomModeActive = false;
    this.chapterMenuOpen = false;
    this.officeJumpscareMenuOpen = false;
    this.officeModeMenuOpen = false;
    this.chapterTwoCardTime = 3.6;
    this.chapterCardTitle = 'Chapter 7: The House';
    this.chapterCardBody =
      'Start on the front bedroom bed inside the forest clearing house, with raised beds, kitchen fixtures, cupboards, a bookcase, and table drawers.';
    this.activeJumpscare = null;
    this.resetChapterFourPurpleJumpscare();
    this.clearMicrophoneSoundToolState();
    this.clearCameraToolState();
    this.placementToolActive = false;
    this.placementToolAnchor.visible = false;
    this.placementPreview.visible = false;
    this.touchingMonster = null;
    this.monsterState = this.unlockedMonsterState;
    this.transientStatusTime = 0;
    this.level.root.visible = false;
    this.chapterTwo.root.visible = false;
    this.officeChapter.root.visible = false;
    this.chapterFour.root.visible = false;
    this.chapterFive.root.visible = false;
    this.chapterFive.screenShip.visible = false;
    this.chapterSix.root.visible = false;
    this.chapterSeven.reset();
    this.chapterSeven.root.visible = true;
    this.chapterEight.root.visible = false;
    this.zombieMode.root.visible = false;
    this.doomMode.root.visible = false;
    this.chapterTwo.reset();
    this.officeChapter.reset();
    this.chapterFour.reset();
    this.chapterFive.reset();
    this.chapterSix.reset();
    this.chapterEight.reset();
    this.zombieMode.reset();
    this.doomMode.reset();
    this.chapterTwoSeatId = null;
    this.chapterTwoClimb = null;
    this.chapterTwoSlide = null;
    this.chapterTwo.setOccupiedSeat(null);
    this.officeChapterSeated = false;
    this.chapterFourBoxHeld = false;
    this.chapterFourBoxActive = false;
    this.chapterFourBoxViewMode = 'normal';
    this.chapterFourLockerId = null;
    this.chapterFourCrouching = false;
    this.chapterFourBoxHeldAnchor.visible = false;
    this.chapterFourBoxHideAnchor.visible = false;
    this.chapterFourBoxWideAnchor.visible = false;
    this.chapterFourBoxWorldAnchor.visible = false;
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
    this.player.teleport(this.chapterSeven.spawn);
    this.player.lookToward(this.chapterSeven.lookTarget, 1);
    this.pushStatus(
      'Chapter 7: The House loaded. You spawn on the front bedroom bed. Press Space to jump, hold Space for 2 seconds to crawl, and press E to use furniture or the sink faucet.',
      3.2,
    );
    this.resize();
  }

  private beginChapterEight(): void {
    this.stopOfficeGameMode();
    this.chapterTwoActive = false;
    this.officeChapterActive = false;
    this.chapterFourActive = false;
    this.chapterFiveActive = false;
    this.chapterSixActive = false;
    this.chapterSevenActive = false;
    this.chapterEightActive = true;
    this.zombieModeActive = false;
    this.doomModeActive = false;
    this.chapterMenuOpen = false;
    this.officeJumpscareMenuOpen = false;
    this.officeModeMenuOpen = false;
    this.chapterTwoCardTime = 3.6;
    this.chapterCardTitle = 'Chapter 8: The Woods';
    this.chapterCardBody =
      'A separate woods chapter with dense semi-realistic trees and a small cabin with a fireplace, bed, and iron stove.';
    this.activeJumpscare = null;
    this.resetChapterFourPurpleJumpscare();
    this.clearMicrophoneSoundToolState();
    this.clearCameraToolState();
    this.placementToolActive = false;
    this.placementToolAnchor.visible = false;
    this.placementPreview.visible = false;
    this.touchingMonster = null;
    this.monsterState = this.unlockedMonsterState;
    this.transientStatusTime = 0;
    this.level.root.visible = false;
    this.chapterTwo.root.visible = false;
    this.officeChapter.root.visible = false;
    this.chapterFour.root.visible = false;
    this.chapterFive.root.visible = false;
    this.chapterFive.screenShip.visible = false;
    this.chapterSix.root.visible = false;
    this.chapterSeven.root.visible = false;
    this.chapterEight.reset();
    this.chapterEight.root.visible = true;
    this.zombieMode.root.visible = false;
    this.doomMode.root.visible = false;
    this.chapterTwo.reset();
    this.officeChapter.reset();
    this.chapterFour.reset();
    this.chapterFive.reset();
    this.chapterSix.reset();
    this.chapterSeven.reset();
    this.zombieMode.reset();
    this.doomMode.reset();
    this.chapterTwoSeatId = null;
    this.chapterTwoClimb = null;
    this.chapterTwoSlide = null;
    this.chapterTwo.setOccupiedSeat(null);
    this.officeChapterSeated = false;
    this.chapterFourBoxHeld = false;
    this.chapterFourBoxActive = false;
    this.chapterFourBoxViewMode = 'normal';
    this.chapterFourLockerId = null;
    this.chapterFourCrouching = false;
    this.chapterSevenCrawling = false;
    this.chapterSevenForcedCrawl = false;
    this.chapterSevenBoxHidden = false;
    this.chapterSevenOvenHidden = false;
    this.chapterSevenSwingSeated = false;
    this.chapterSeven.setSwingOccupied(false);
    this.chapterFourBoxHeldAnchor.visible = false;
    this.chapterFourBoxHideAnchor.visible = false;
    this.chapterFourBoxWideAnchor.visible = false;
    this.chapterFourBoxWorldAnchor.visible = false;
    this.chapterSevenBoxHideAnchor.visible = false;
    this.chapterSevenOvenHideAnchor.visible = false;
    this.chapterSevenOvenDoorOverlay.visible = false;
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
    this.chapterEightHeldItem = 'coordinate-tool';
    this.chapterEightHeldItemAnchor.visible = false;
    this.chapterEightKnifeAttackMode = null;
    this.chapterEightKnifeAttackTimer = 0;
    this.setPlacementToolActive(true);
    this.player.teleport(this.chapterEight.spawn);
    this.player.lookToward(this.chapterEight.lookTarget, 1);
    this.pushStatus(
      'Chapter 8: The Woods loaded. You start with the Coordinate Tool and Military Knife. Left click slashes; right click stabs. The cabin fireplace is burning.',
      3.2,
    );
    this.resize();
  }

  private beginOfficeChapter(sandboxCopy = false): void {
    this.stopOfficeGameMode();
    this.officeSandboxChapterActive = sandboxCopy;
    this.officeChapter = sandboxCopy ? this.officeSandboxChapter : this.mainOfficeChapter;
    this.clearOfficeGameModeAnimatronics();
    this.clearOfficeVentBoy();
    const inactiveOfficeChapter = sandboxCopy ? this.mainOfficeChapter : this.officeSandboxChapter;
    inactiveOfficeChapter.root.visible = false;
    inactiveOfficeChapter.reset();
    this.chapterTwoActive = false;
    this.officeChapterActive = true;
    this.chapterFourActive = false;
    this.chapterFiveActive = false;
    this.chapterSixActive = false;
    this.chapterSevenActive = false;
    this.chapterEightActive = false;
    this.zombieModeActive = false;
    this.doomModeActive = false;
    this.chapterMenuOpen = false;
    this.chapterTwoCardTime = 3.6;
    this.chapterCardTitle = sandboxCopy
      ? "Chapter Three Copy: Bori's map sandbox"
      : "Chapter Three: five nights at Bori's";
    this.chapterCardBody = sandboxCopy
      ? 'This is a separate copy of the Five Nights at Bori\'s map for reconfiguring and testing without changing the full game chapter.'
      : 'The office doors now lead through side hallways into one wide party room, plus a new top-right hall to a second party room with a pirate fox stage and a ticket basketball game.';
    this.activeJumpscare = null;
    this.resetChapterFourPurpleJumpscare();
    this.touchingMonster = null;
    this.monsterState = this.unlockedMonsterState;
    this.transientStatusTime = 0;
    this.level.root.visible = false;
    this.chapterTwo.root.visible = false;
    this.officeChapter.root.visible = true;
    this.chapterFour.root.visible = false;
    this.chapterFive.root.visible = false;
    this.chapterFive.screenShip.visible = false;
    this.chapterSix.root.visible = false;
    this.chapterSeven.root.visible = false;
    this.chapterEight.root.visible = false;
    this.zombieMode.root.visible = false;
    this.doomMode.root.visible = false;
    this.chapterTwo.reset();
    this.officeChapter.reset();
    this.chapterFour.reset();
    this.chapterFive.reset();
    this.chapterSix.reset();
    this.chapterSeven.reset();
    this.chapterEight.reset();
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
    this.resetOfficePrizeInventory();
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
      sandboxCopy
        ? 'Chapter three copy loaded. Reconfigure this sandbox map without changing the full Five Nights at Bori\'s chapter.'
        : 'Chapter three loaded. The top-right corner of the party room now opens into a second party room with a pirate fox stage, hidden tickets, and basketball.',
      3.2,
    );
    this.resize();
  }
}
