import type { MonsterVariant } from '../systems/monster/MonsterController';

export type HudChapterId =
  | 'chapter-1'
  | 'chapter-2'
  | 'chapter-3'
  | 'chapter-3-copy'
  | 'chapter-4'
  | 'chapter-5'
  | 'chapter-6'
  | 'chapter-7'
  | 'chapter-8'
  | 'chapter-9'
  | 'chapter-10'
  | 'chapter-11'
  | 'chapter-11-two'
  | 'chapter-12'
  | 'zombie-fps'
  | 'doom-fps';
export type HudJumpScareVariant = MonsterVariant | 'bear' | 'quacky' | 'fluffle' | 'bori' | 'foxy' | 'purple' | 'blue' | 'green';
export type OfficeModeMenuStep = 'mode' | 'difficulty';
export type OfficeModeMenuMode = 'creator' | 'night' | 'game';
export type OfficeModeMenuDifficulty = 'easy' | 'normal' | 'hard';
export type OfficeCameraPuppetHudPhase = 'camera-face' | 'room-watch' | 'jumpscare';
export type OfficeDeathNoticePhase = 'died' | 'fired';

export interface HotbarSlotView {
  label: string;
  count: number;
  filled: boolean;
  type?: string | null;
  selected?: boolean;
  imageUrl?: string | null;
}

export type MinecraftInventorySlotKind = 'hotbar' | 'inventory' | 'craft';

export interface MinecraftInventorySlotView {
  label: string;
  count: number;
  filled: boolean;
  type?: string | null;
  selected?: boolean;
}

export interface MinecraftInventoryView {
  hotbar: MinecraftInventorySlotView[];
  inventory: MinecraftInventorySlotView[];
  craft: MinecraftInventorySlotView[];
  result: MinecraftInventorySlotView;
  cursor: MinecraftInventorySlotView;
}

export type MinecraftInventoryAction =
  | { target: 'slot'; kind: MinecraftInventorySlotKind; index: number; button: 0 | 2 }
  | { target: 'result'; button: 0 | 2 };

export interface TabletCameraSlotView {
  key: string;
  label: string;
  active: boolean;
}

export interface OfficeJumpscareOptionView {
  id: string;
  label: string;
  body: string;
}

export interface HudChapterFiveMonitorState {
  lightSpeed: number;
  engineOn: boolean;
  autopilot: boolean;
  navigationMode: 'cruise' | 'autopilot';
  orbiting: boolean;
  landingSequence: boolean;
  landed: boolean;
  arrivalAlarmActive: boolean;
  radarActive: boolean;
  destinationActive: boolean;
  destinationSelectionActive: boolean;
  destinationLabel: string;
  planets: Array<{
    label: string;
    miles: number;
    destination: boolean;
  }>;
}

export interface HudController {
  onEngage(handler: () => void): void;
  onChapterSelect(handler: (chapterId: HudChapterId) => void): void;
  onOfficeJumpscareSelect(handler: (jumpscareId: string) => void): void;
  onOfficeModeSelect(handler: (selectionId: string) => void): void;
  onMicrophoneToggle(handler: () => void): void;
  onMinecraftInventoryAction(handler: (action: MinecraftInventoryAction) => void): void;
  onChapterFiveMonitorAction(handler: (action: HudChapterFiveMonitorAction) => void): void;
  onChapterSevenCookieTargetSelect(handler: (target: number) => void): void;
  onChapterSevenGrandpaTrade(handler: (tradeId: ChapterSevenGrandpaTradeId) => void): void;
  onChapterElevenSeedPurchase(handler: (seedId: ChapterElevenSeedId) => void): void;
  onChapterElevenTraderPetEggPurchase(handler: () => void): void;
  onChapterElevenEquipmentPurchase(handler: (equipmentId: ChapterElevenEquipmentId) => void): void;
  onChapterElevenSellAction(handler: (action: ChapterElevenSellAction) => void): void;
  onChapterElevenChestAction(handler: (cropId: string) => void): void;
  onCuratorSave(handler: (slotLabel: string, summary: string) => void): void;
  setTheme(theme: 'default' | 'doom'): void;
  setCrosshairMode(mode: 'default' | 'firearm' | 'minecraft'): void;
  setThreatEye(intensity: number): void;
  setFlashlight(enabled: boolean): void;
  setLocked(locked: boolean): void;
  setIntro(eyebrow: string, title: string, summary: string, buttonText: string): void;
  setObjective(text: string): void;
  setStoryNotice(text: string, active: boolean, label?: string): void;
  setChapterCard(active: boolean, title: string, body: string): void;
  setChapterLabel(text: string): void;
  setChapterSevenDayCounter(active: boolean, day: number): void;
  setChapterSevenCookieCounter(active: boolean, cookies: number, target: number): void;
  setChapterSevenCookiePicker(active: boolean, currentTarget: number): void;
  setChapterSevenTrading(active: boolean, cookies: number, trades: ChapterSevenGrandpaTradeView[]): void;
  setChapterElevenSeedShop(active: boolean, money: number, items: ChapterElevenSeedShopItemView[]): void;
  setChapterElevenEquipmentShop(active: boolean, money: number, items: ChapterElevenEquipmentShopItemView[]): void;
  setChapterElevenSellMenu(active: boolean, money: number, items: ChapterElevenSellItemView[], choosing: boolean, selectedIds: string[]): void;
  setChapterElevenAutoHarvestChest(active: boolean, chestItems: ChapterElevenChestItemView[], inventorySlots: HotbarSlotView[]): void;
  setChapterElevenSeedHotbar(active: boolean, slots: HotbarSlotView[]): void;
  setMoney(value: number): void;
  setChapterSevenPhaseTimer(active: boolean, phase: 'day' | 'night', secondsLeft: number, urgent: boolean): void;
  setChapterMenu(active: boolean, currentChapter: HudChapterId): void;
  setCompass(active: boolean, headingDegrees: number): void;
  setChapterFiveMonitor(active: boolean, state: HudChapterFiveMonitorState): void;
  setOfficeJumpscareMenu(active: boolean, options: OfficeJumpscareOptionView[]): void;
  setCuratorTool(active: boolean): void;
  setOfficeModeMenu(
    active: boolean,
    step: OfficeModeMenuStep,
    pendingMode: OfficeModeMenuMode | null,
    activeMode: OfficeModeMenuMode,
    activeDifficulty: OfficeModeMenuDifficulty,
  ): void;
  setPlacementTool(active: boolean, body: string, copyText?: string): void;
  toggleHelperPanels(): void;
  setStatus(text: string): void;
  setInventory(text: string): void;
  setMinecraftInventory(active: boolean, state: MinecraftInventoryView): void;
  setOfficePower(active: boolean, powerRatio: number, powerOut: boolean, nightText?: string, timeText?: string, powerState?: 'normal' | 'reboot' | 'out'): void;
  setMicrophone(active: boolean, enabled: boolean, listening: boolean, blocked: boolean, level: number): void;
  setMicrophoneTool(active: boolean, body: string): void;
  setCameraTool(active: boolean, body: string): void;
  setCameraToolPreview(active: boolean, video?: HTMLVideoElement | null): void;
  setPhotoCameraPreview(active: boolean, imageUrl: string | null, label: string, flash: boolean): void;
  setPrompt(text: string): void;
  setActionPrompt(text: string): void;
  setCrouchInstructions(active: boolean, crouched: boolean, text?: string, title?: string): void;
  setTabletCameras(active: boolean, activeLabel: string, cameras: TabletCameraSlotView[]): void;
  setBallPitHidden(active: boolean): void;
  setNightModeAttack(active: boolean, armProgress: number, blackout: number): void;
  setOfficeHardVignette(active: boolean, intensity: number): void;
  setOfficeCameraPuppet(
    active: boolean,
    phase: OfficeCameraPuppetHudPhase,
    progress: number,
    secondsRemaining?: number,
  ): void;
  setOfficeCutscene(active: boolean, title: string, progress: number): void;
  setOfficeDeathNotice(active: boolean, phase: OfficeDeathNoticePhase, progress: number): void;
  setHealth(ratio: number): void;
  setHealthLabel(text: string): void;
  setStamina(ratio: number): void;
  setStaminaLabel(text: string): void;
  setToxicity(active: boolean, ratio: number, valueText?: string): void;
  setHotbar(slots: HotbarSlotView[]): void;
  setJumpscare(variant: HudJumpScareVariant | null, intensity: number): void;
  destroy(): void;
}

export type ChapterSevenGrandpaTradeId = 'bird-cage-key' | 'longer-night-watch';
export type ChapterElevenSeedId =
  | 'carrot-seeds'
  | 'mushroom'
  | 'strawberry'
  | 'blackberry-bush'
  | 'pumpkin-seeds'
  | 'watermelon-seeds'
  | 'nut-seeds'
  | 'blueberry-seeds'
  | 'raspberry-seeds'
  | 'peach-seeds'
  | 'pineapple-seeds'
  | 'apple-tree-seeds'
  | 'tomato-seeds'
  | 'pepper-seeds'
  | 'dragon-fruit-seeds'
  | 'vine-seeds'
  | 'cactus-seeds'
  | 'corn-seeds'
  | 'desert-sage-seeds'
  | 'sunset-melon-seeds';

export type ChapterElevenEquipmentId =
  | 'vine-stick'
  | 'hoe'
  | 'water-bucket'
  | 'sprinkler'
  | 'fertilizer'
  | 'cheap-auto-harvester'
  | 'auto-harvester';

export interface ChapterSevenGrandpaTradeView {
  id: ChapterSevenGrandpaTradeId;
  label: string;
  cost: number;
  description: string;
  ownedLabel?: string;
  enabled: boolean;
}

export type ChapterElevenSeedShopItemView = ChapterElevenSeedShopSeedItemView | ChapterElevenSeedShopEggItemView;

export interface ChapterElevenSeedShopSeedItemView {
  kind?: 'seed';
  id: ChapterElevenSeedId;
  label: string;
  cost: number;
  section: 'cheap' | 'expensive';
  enabled: boolean;
  stock?: number;
  restockSeconds?: number;
}

export interface ChapterElevenSeedShopEggItemView {
  kind: 'egg';
  id: 'random-pet-egg';
  label: string;
  cost: number;
  section: 'eggs';
  enabled: boolean;
  stock?: number;
  restockSeconds?: number;
}

export interface ChapterElevenEquipmentShopItemView {
  id: ChapterElevenEquipmentId;
  label: string;
  cost: number;
  description: string;
  enabled: boolean;
  stock?: number;
  restockSeconds?: number;
}

export type ChapterElevenSellAction =
  | { type: 'exit' }
  | { type: 'sell-all' }
  | { type: 'choose-plants' }
  | { type: 'toggle-crop'; cropId: string }
  | { type: 'sell-selected' };

export interface ChapterElevenSellItemView {
  id: string;
  label: string;
  count: number;
  value: number;
}

export interface ChapterElevenChestItemView {
  id: string;
  label: string;
  count: number;
}

export type HudChapterFiveMonitorAction =
  | { type: 'select-planet'; index: number }
  | { type: 'set-light-speed'; value: number }
  | { type: 'set-mode'; mode: 'cruise' | 'autopilot' }
  | { type: 'toggle-autopilot' }
  | { type: 'set-coordinates' }
  | { type: 'toggle-engine' }
  | { type: 'toggle-radar' }
  | { type: 'landing-sequence' }
  | { type: 'escape-orbit' }
  | { type: 'launch-sequence' };

type CuratorKind = 'monster' | 'npc' | 'object';
type CuratorPartId = 'head' | 'torso' | 'left-arm' | 'right-arm' | 'leg' | 'left-leg' | 'right-leg' | 'mouth';
type CuratorEditTargetId = Exclude<CuratorPartId, 'leg'>;

interface CuratorPartDefinition {
  id: CuratorPartId;
  label: string;
}

interface CuratorPartOption {
  id: string;
  label: string;
  body: string;
}

interface CuratorDesignState {
  kind: CuratorKind;
  palette: string;
  parts: Record<CuratorPartId, string>;
  shapes: Record<CuratorEditTargetId, CuratorShapeState>;
  rotation: CuratorRotationState;
  transform: CuratorTransformState;
}

interface CuratorShapeState {
  width: number;
  height: number;
  depth: number;
  bump: number;
  offsetX: number;
  offsetY: number;
}

interface CuratorRotationState {
  x: number;
  y: number;
  z: number;
}

interface CuratorTransformState {
  lift: number;
}

interface SavedCuratorCharacter {
  id: number;
  label: string;
  savedAt: string;
  design: CuratorDesignState;
  summary: string;
}

const CURATOR_STORAGE_KEY = 'scary-sushi.curator.characters';
const CURATOR_LAST_DESIGN_KEY = 'scary-sushi.curator.last-design';

const CURATOR_PARTS: CuratorPartDefinition[] = [
  { id: 'head', label: 'Head' },
  { id: 'torso', label: 'Torso' },
  { id: 'left-arm', label: 'Left Arm' },
  { id: 'right-arm', label: 'Right Arm' },
  { id: 'leg', label: 'Leg' },
  { id: 'left-leg', label: 'Left Leg' },
  { id: 'right-leg', label: 'Right Leg' },
  { id: 'mouth', label: 'Mouth' },
];

const CURATOR_EDIT_TARGETS: Array<{ id: CuratorEditTargetId; label: string }> = [
  { id: 'head', label: 'Head' },
  { id: 'torso', label: 'Torso' },
  { id: 'left-arm', label: 'Left Arm' },
  { id: 'right-arm', label: 'Right Arm' },
  { id: 'left-leg', label: 'Left Leg' },
  { id: 'right-leg', label: 'Right Leg' },
  { id: 'mouth', label: 'Mouth' },
];

const CURATOR_KIND_OPTIONS: Array<{ id: CuratorKind; label: string }> = [
  { id: 'monster', label: 'Monster' },
  { id: 'npc', label: 'NPC' },
  { id: 'object', label: 'Object' },
];

const CURATOR_PALETTE_OPTIONS = [
  { id: 'forest', label: 'Forest' },
  { id: 'shadow', label: 'Shadow' },
  { id: 'warning', label: 'Warning' },
  { id: 'toy', label: 'Toy' },
] as const;

const CURATOR_PART_OPTIONS: Record<CuratorPartId, CuratorPartOption[]> = {
  head: [
    { id: 'round-mask', label: 'Round Mask', body: 'Large face, simple eyes, soft outline.' },
    { id: 'block-head', label: 'Block Head', body: 'Square head with a toy-like shape.' },
    { id: 'long-snout', label: 'Long Snout', body: 'Forward jaw and stretched face.' },
    { id: 'horned', label: 'Horned', body: 'Tall head with two pointed horns.' },
  ],
  torso: [
    { id: 'thin', label: 'Thin', body: 'Narrow body for a fast creature.' },
    { id: 'heavy', label: 'Heavy', body: 'Wide body with a stronger silhouette.' },
    { id: 'robotic', label: 'Robotic', body: 'Panel chest and machine shape.' },
    { id: 'ragged', label: 'Ragged', body: 'Uneven, scary, broken-looking body.' },
  ],
  'left-arm': [
    { id: 'normal', label: 'Normal', body: 'Regular upper and lower arm.' },
    { id: 'claw', label: 'Claw', body: 'Long hand with sharp fingers.' },
    { id: 'tube', label: 'Tube', body: 'Smooth noodle-like arm.' },
    { id: 'hook', label: 'Hook', body: 'Curved hook hand.' },
  ],
  'right-arm': [
    { id: 'normal', label: 'Normal', body: 'Regular upper and lower arm.' },
    { id: 'claw', label: 'Claw', body: 'Long hand with sharp fingers.' },
    { id: 'tube', label: 'Tube', body: 'Smooth noodle-like arm.' },
    { id: 'hook', label: 'Hook', body: 'Curved hook hand.' },
  ],
  leg: [
    { id: 'straight', label: 'Straight', body: 'Balanced normal leg stance.' },
    { id: 'bent', label: 'Bent', body: 'Creepy bent-knee stance.' },
    { id: 'digitigrade', label: 'Digitigrade', body: 'Raised heel monster stance.' },
    { id: 'stubby', label: 'Stubby', body: 'Short wide legs.' },
  ],
  'left-leg': [
    { id: 'normal', label: 'Normal', body: 'Regular left leg.' },
    { id: 'boot', label: 'Boot', body: 'Large heavy foot.' },
    { id: 'clawed', label: 'Clawed', body: 'Sharp toe silhouette.' },
    { id: 'thin', label: 'Thin', body: 'Skinny fast-looking leg.' },
  ],
  'right-leg': [
    { id: 'normal', label: 'Normal', body: 'Regular right leg.' },
    { id: 'boot', label: 'Boot', body: 'Large heavy foot.' },
    { id: 'clawed', label: 'Clawed', body: 'Sharp toe silhouette.' },
    { id: 'thin', label: 'Thin', body: 'Skinny fast-looking leg.' },
  ],
  mouth: [
    { id: 'smile', label: 'Smile', body: 'Simple dark smile that can be resized.' },
    { id: 'scream', label: 'Scream Mouth', body: 'Tall open mouth for a scared face.' },
    { id: 'frown', label: 'Frown', body: 'Small worried mouth.' },
    { id: 'jagged', label: 'Jagged Maw', body: 'Sharp uneven monster mouth.' },
  ],
};

function createDefaultCuratorShape(): CuratorShapeState {
  return {
    width: 1,
    height: 1,
    depth: 0.5,
    bump: 0,
    offsetX: 0,
    offsetY: 0,
  };
}

function createDefaultCuratorShapes(): Record<CuratorEditTargetId, CuratorShapeState> {
  return CURATOR_EDIT_TARGETS.reduce((shapes, target) => {
    shapes[target.id] = createDefaultCuratorShape();
    return shapes;
  }, {} as Record<CuratorEditTargetId, CuratorShapeState>);
}

function createDefaultCuratorDesign(): CuratorDesignState {
  return {
    kind: 'monster',
    palette: 'forest',
    parts: {
      head: 'round-mask',
      torso: 'thin',
      'left-arm': 'normal',
      'right-arm': 'claw',
      leg: 'straight',
      'left-leg': 'normal',
      'right-leg': 'normal',
      mouth: 'smile',
    },
    shapes: createDefaultCuratorShapes(),
    rotation: { x: 0, y: 0, z: 0 },
    transform: { lift: 0 },
  };
}

function cloneCuratorDesign(design: CuratorDesignState): CuratorDesignState {
  const defaults = createDefaultCuratorDesign();
  return {
    kind: design.kind,
    palette: design.palette,
    parts: { ...defaults.parts, ...design.parts },
    shapes: CURATOR_EDIT_TARGETS.reduce((shapes, target) => {
      shapes[target.id] = {
        ...defaults.shapes[target.id],
        ...(design.shapes?.[target.id] ?? {}),
      };
      return shapes;
    }, {} as Record<CuratorEditTargetId, CuratorShapeState>),
    rotation: {
      ...defaults.rotation,
      ...(design.rotation ?? {}),
    },
    transform: {
      ...defaults.transform,
      ...(design.transform ?? {}),
    },
  };
}

function formatCuratorSlotLabel(slot: number): string {
  return `Character ${String(slot).padStart(2, '0')}`;
}

function getCuratorOptionLabel(partId: CuratorPartId, optionId: string): string {
  return CURATOR_PART_OPTIONS[partId].find((option) => option.id === optionId)?.label ?? optionId;
}

function formatCuratorDesignSummary(label: string, design: CuratorDesignState): string {
  const parts = CURATOR_PARTS
    .map((part) => `${part.label}: ${getCuratorOptionLabel(part.id, design.parts[part.id])}`)
    .join(', ');
  const editedTargets = CURATOR_EDIT_TARGETS
    .map((target) => {
      const shape = design.shapes[target.id];
      if (!shape || (
        Math.abs(shape.width - 1) < 0.01
        && Math.abs(shape.height - 1) < 0.01
        && Math.abs(shape.depth - 0.5) < 0.01
        && shape.bump < 0.01
        && Math.abs(shape.offsetX) < 0.01
        && Math.abs(shape.offsetY) < 0.01
      )) {
        return '';
      }

      return `${target.label} shape ${shape.width.toFixed(2)}x${shape.height.toFixed(2)} depth ${shape.depth.toFixed(2)} bump ${shape.bump.toFixed(2)}`;
    })
    .filter((entry) => entry.length > 0)
    .join('; ');
  const rotation = `Rotation X:${Math.round(design.rotation.x)} Y:${Math.round(design.rotation.y)} Z:${Math.round(design.rotation.z)}`;
  const transform = `Lift:${design.transform.lift.toFixed(2)}`;
  return `${label} / ${design.kind.toUpperCase()} / Palette: ${design.palette} / ${parts} / ${rotation} / ${transform}${editedTargets ? ` / Edits: ${editedTargets}` : ''}`;
}

function isCuratorDesignState(value: unknown): value is CuratorDesignState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<CuratorDesignState>;
  if (candidate.kind !== 'monster' && candidate.kind !== 'npc' && candidate.kind !== 'object') {
    return false;
  }

  if (typeof candidate.palette !== 'string' || !candidate.parts || typeof candidate.parts !== 'object') {
    return false;
  }

  return CURATOR_PARTS
    .filter((part) => part.id !== 'mouth')
    .every((part) => typeof candidate.parts?.[part.id] === 'string');
}

function loadCuratorCharacters(): SavedCuratorCharacter[] {
  try {
    const raw = window.localStorage.getItem(CURATOR_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is SavedCuratorCharacter => {
      if (!entry || typeof entry !== 'object') {
        return false;
      }

      const candidate = entry as Partial<SavedCuratorCharacter>;
      return typeof candidate.id === 'number'
        && Number.isFinite(candidate.id)
        && typeof candidate.label === 'string'
        && typeof candidate.savedAt === 'string'
        && typeof candidate.summary === 'string'
        && isCuratorDesignState(candidate.design);
    });
  } catch {
    return [];
  }
}

function saveCuratorCharacters(characters: SavedCuratorCharacter[]): void {
  try {
    window.localStorage.setItem(CURATOR_STORAGE_KEY, JSON.stringify(characters));
  } catch {
    // The tool still works during the current session if local storage is blocked.
  }
}

function clampCuratorNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getCuratorTargetLabel(targetId: CuratorEditTargetId): string {
  return CURATOR_EDIT_TARGETS.find((target) => target.id === targetId)?.label ?? targetId;
}

function createCuratorRangeControl(
  label: string,
  min: number,
  max: number,
  step: number,
): { root: HTMLLabelElement; input: HTMLInputElement; value: HTMLSpanElement } {
  const root = document.createElement('label');
  root.className = 'hud__curator-range';
  const title = document.createElement('span');
  title.textContent = label;
  const value = document.createElement('span');
  value.className = 'hud__curator-range-value';
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  root.append(title, value, input);
  return { root, input, value };
}

export function createHud(host: HTMLElement): HudController {
  const root = document.createElement('div');
  root.className = 'hud';
  root.dataset.locked = 'false';
  root.dataset.scared = 'false';
  root.dataset.theme = 'default';
  root.dataset.crosshair = 'default';
  root.style.setProperty('--scare-intensity', '0');
  root.style.setProperty('--threat-eye-intensity', '0');
  let chapterSevenCookieTargetSelectHandler: ((target: number) => void) | null = null;
  let chapterSevenGrandpaTradeHandler: ((tradeId: ChapterSevenGrandpaTradeId) => void) | null = null;
  let chapterElevenSeedPurchaseHandler: ((seedId: ChapterElevenSeedId) => void) | null = null;
  let chapterElevenTraderPetEggPurchaseHandler: (() => void) | null = null;
  let chapterElevenEquipmentPurchaseHandler: ((equipmentId: ChapterElevenEquipmentId) => void) | null = null;
  let chapterElevenSellActionHandler: ((action: ChapterElevenSellAction) => void) | null = null;
  let chapterElevenChestActionHandler: ((cropId: string) => void) | null = null;

  const backdrop = document.createElement('div');
  backdrop.className = 'hud__backdrop';

  const grain = document.createElement('div');
  grain.className = 'hud__grain';

  const tabletStatic = document.createElement('div');
  tabletStatic.className = 'hud__tablet-static';
  tabletStatic.dataset.active = 'false';

  const officeHardVignette = document.createElement('div');
  officeHardVignette.className = 'hud__office-hard-vignette';
  officeHardVignette.dataset.active = 'false';
  officeHardVignette.style.setProperty('--office-hard-vignette', '0');

  const officeCameraPuppet = document.createElement('section');
  officeCameraPuppet.className = 'hud__camera-puppet';
  officeCameraPuppet.dataset.active = 'false';
  officeCameraPuppet.dataset.phase = 'camera-face';
  officeCameraPuppet.style.setProperty('--camera-puppet-progress', '0');

  const officeCameraPuppetBody = document.createElement('div');
  officeCameraPuppetBody.className = 'hud__camera-puppet-body';

  const officeCameraPuppetHead = document.createElement('div');
  officeCameraPuppetHead.className = 'hud__camera-puppet-head';

  const officeCameraPuppetEyes = document.createElement('div');
  officeCameraPuppetEyes.className = 'hud__camera-puppet-eyes';
  officeCameraPuppetEyes.append(document.createElement('span'), document.createElement('span'));

  const officeCameraPuppetMouth = document.createElement('div');
  officeCameraPuppetMouth.className = 'hud__camera-puppet-mouth';
  officeCameraPuppetHead.append(officeCameraPuppetEyes, officeCameraPuppetMouth);

  const officeCameraPuppetTorso = document.createElement('div');
  officeCameraPuppetTorso.className = 'hud__camera-puppet-torso';

  const officeCameraPuppetLegs = document.createElement('div');
  officeCameraPuppetLegs.className = 'hud__camera-puppet-legs';
  officeCameraPuppetLegs.append(document.createElement('span'), document.createElement('span'));

  const officeCameraPuppetArms = document.createElement('div');
  officeCameraPuppetArms.className = 'hud__camera-puppet-arms';
  officeCameraPuppetArms.append(document.createElement('span'), document.createElement('span'));

  officeCameraPuppetBody.append(
    officeCameraPuppetArms,
    officeCameraPuppetHead,
    officeCameraPuppetTorso,
    officeCameraPuppetLegs,
  );

  const officeCameraPuppetPrompt = document.createElement('p');
  officeCameraPuppetPrompt.className = 'hud__camera-puppet-prompt';
  officeCameraPuppetPrompt.textContent = '';

  officeCameraPuppet.append(officeCameraPuppetBody, officeCameraPuppetPrompt);

  const ballPitHide = document.createElement('div');
  ballPitHide.className = 'hud__ball-pit-hide';
  ballPitHide.dataset.active = 'false';

  const officeCutscene = document.createElement('div');
  officeCutscene.className = 'hud__office-cutscene';
  officeCutscene.dataset.active = 'false';
  officeCutscene.style.setProperty('--office-cutscene-progress', '0');

  const officeCutsceneTitle = document.createElement('p');
  officeCutsceneTitle.className = 'hud__office-cutscene-title';
  officeCutsceneTitle.textContent = '';
  officeCutscene.append(officeCutsceneTitle);

  const officeDeathNotice = document.createElement('div');
  officeDeathNotice.className = 'hud__office-death-notice';
  officeDeathNotice.dataset.active = 'false';
  officeDeathNotice.dataset.phase = 'died';
  officeDeathNotice.style.setProperty('--office-death-progress', '0');

  const officeDeathText = document.createElement('p');
  officeDeathText.className = 'hud__office-death-text';
  officeDeathText.textContent = 'YOU DIED';

  const officeFiredPaper = document.createElement('section');
  officeFiredPaper.className = 'hud__office-fired-paper';

  const officeFiredEyebrow = document.createElement('p');
  officeFiredEyebrow.className = 'hud__office-fired-eyebrow';
  officeFiredEyebrow.textContent = "Bori's Pizzeria";

  const officeFiredTitle = document.createElement('h2');
  officeFiredTitle.className = 'hud__office-fired-title';
  officeFiredTitle.textContent = "You're fired";

  const officeFiredBody = document.createElement('p');
  officeFiredBody.className = 'hud__office-fired-body';
  officeFiredBody.textContent = "You're fired for meddling with the animatronics.";

  officeFiredPaper.append(officeFiredEyebrow, officeFiredTitle, officeFiredBody);
  officeDeathNotice.append(officeDeathText, officeFiredPaper);

  const officePower = document.createElement('section');
  officePower.className = 'hud__office-power';
  officePower.dataset.active = 'false';
  officePower.dataset.level = 'green';
  officePower.style.setProperty('--office-power-ratio', '1');

  const officePowerHeader = document.createElement('div');
  officePowerHeader.className = 'hud__office-power-header';

  const officePowerLabel = document.createElement('span');
  officePowerLabel.textContent = 'Power';

  const officePowerValue = document.createElement('span');
  officePowerValue.textContent = '100%';

  const officePowerTrack = document.createElement('div');
  officePowerTrack.className = 'hud__office-power-track';

  const officePowerFill = document.createElement('div');
  officePowerFill.className = 'hud__office-power-fill';

  const officePowerMeta = document.createElement('div');
  officePowerMeta.className = 'hud__office-power-meta';

  const officePowerNight = document.createElement('span');
  officePowerNight.textContent = 'Night 1/5';

  const officePowerTime = document.createElement('span');
  officePowerTime.textContent = '12 AM';

  officePowerHeader.append(officePowerLabel, officePowerValue);
  officePowerTrack.append(officePowerFill);
  officePowerMeta.append(officePowerNight, officePowerTime);
  officePower.append(officePowerHeader, officePowerTrack, officePowerMeta);

  const microphonePanel = document.createElement('section');
  microphonePanel.className = 'hud__microphone';
  microphonePanel.dataset.active = 'false';
  microphonePanel.dataset.listening = 'false';
  microphonePanel.dataset.blocked = 'false';
  microphonePanel.style.setProperty('--microphone-level', '0');

  const microphoneLabel = document.createElement('p');
  microphoneLabel.className = 'hud__microphone-label';
  microphoneLabel.textContent = 'Microphone Off';

  const microphoneTrack = document.createElement('div');
  microphoneTrack.className = 'hud__microphone-track';

  const microphoneFill = document.createElement('div');
  microphoneFill.className = 'hud__microphone-fill';

  const microphoneToggle = document.createElement('button');
  microphoneToggle.className = 'hud__microphone-toggle';
  microphoneToggle.type = 'button';
  microphoneToggle.textContent = 'Turn On';
  microphoneToggle.setAttribute('aria-pressed', 'false');

  microphoneTrack.append(microphoneFill);
  microphonePanel.append(microphoneLabel, microphoneTrack, microphoneToggle);

  const jumpscare = document.createElement('div');
  jumpscare.className = 'hud__jumpscare';
  jumpscare.dataset.active = 'false';
  jumpscare.dataset.variant = 'seaweed';
  jumpscare.style.setProperty('--jumpscare-intensity', '0');
  jumpscare.style.setProperty('--jumpscare-jitter-x', '0rem');
  jumpscare.style.setProperty('--jumpscare-jitter-y', '0rem');

  const jumpscareBloom = document.createElement('div');
  jumpscareBloom.className = 'hud__jumpscare-bloom';

  const jumpscareFace = document.createElement('div');
  jumpscareFace.className = 'hud__jumpscare-face';

  const jumpscareLabel = document.createElement('p');
  jumpscareLabel.className = 'hud__jumpscare-label';
  jumpscareLabel.textContent = 'Seaweed Horror';

  const jumpscareEyes = document.createElement('div');
  jumpscareEyes.className = 'hud__jumpscare-eyes';

  const jumpscareEyeLeft = document.createElement('span');
  const jumpscareEyeRight = document.createElement('span');
  jumpscareEyes.append(jumpscareEyeLeft, jumpscareEyeRight);

  const jumpscareMaw = document.createElement('div');
  jumpscareMaw.className = 'hud__jumpscare-maw';

  const jumpscareFringe = document.createElement('div');
  jumpscareFringe.className = 'hud__jumpscare-fringe';

  jumpscareFace.append(jumpscareLabel, jumpscareEyes, jumpscareMaw, jumpscareFringe);
  jumpscare.append(jumpscareBloom, jumpscareFace);

  const intro = document.createElement('section');
  intro.className = 'hud__intro';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'hud__eyebrow';
  eyebrow.textContent = 'Studio Kitchen / Round 1';

  const title = document.createElement('h1');
  title.className = 'hud__title';
  title.textContent = 'Scary Sushi';

  const summary = document.createElement('p');
  summary.className = 'hud__summary';
  summary.textContent =
    'The challenge is live. Search the maze for raw ingredients, run them through the labeled machines, build the salmon and tuna rolls, and send them down the judges belt.';

  const button = document.createElement('button');
  button.className = 'hud__button';
  button.type = 'button';
  button.textContent = 'Step Onto The Set';

  intro.append(eyebrow, title, summary, button);

  const meterPanel = document.createElement('section');
  meterPanel.className = 'hud__panel hud__panel--meters';

  const healthMeter = createMeter('Health', 'hud__fill--health');
  const staminaMeter = createMeter('Stamina', 'hud__fill--stamina');
  const toxicityMeter = createMeter('Toxicity', 'hud__fill--toxicity');
  toxicityMeter.root.hidden = true;

  meterPanel.append(healthMeter.root, staminaMeter.root, toxicityMeter.root);

  const moneyPanel = document.createElement('section');
  moneyPanel.className = 'hud__money';

  const moneyIcon = document.createElement('span');
  moneyIcon.className = 'hud__money-icon';
  moneyIcon.textContent = '$';

  const moneyText = document.createElement('div');
  moneyText.className = 'hud__money-text';

  const moneyLabel = document.createElement('p');
  moneyLabel.className = 'hud__label';
  moneyLabel.textContent = 'Money';

  const moneyValue = document.createElement('p');
  moneyValue.className = 'hud__money-value';
  moneyValue.textContent = '$200';

  moneyText.append(moneyLabel, moneyValue);
  moneyPanel.append(moneyIcon, moneyText);

  const storyNotice = document.createElement('section');
  storyNotice.className = 'hud__story';
  storyNotice.dataset.active = 'false';

  const storyNoticeLabel = document.createElement('p');
  storyNoticeLabel.className = 'hud__eyebrow';
  storyNoticeLabel.textContent = 'Chapter Shift';

  const storyNoticeText = document.createElement('p');
  storyNoticeText.className = 'hud__story-text';
  storyNoticeText.textContent = '';

  storyNotice.append(storyNoticeLabel, storyNoticeText);

  const actionPrompt = document.createElement('section');
  actionPrompt.className = 'hud__action-prompt';
  actionPrompt.dataset.active = 'false';
  actionPrompt.textContent = '';

  const placementTool = document.createElement('section');
  placementTool.className = 'hud__placement-tool';
  placementTool.dataset.active = 'false';

  const placementToolLabel = document.createElement('p');
  placementToolLabel.className = 'hud__label';
  placementToolLabel.textContent = 'Coordinate Tool';

  const placementToolText = document.createElement('p');
  placementToolText.className = 'hud__value';
  placementToolText.textContent = '';

  let placementToolCopyText = '';
  const placementCopyButton = document.createElement('button');
  placementCopyButton.className = 'hud__placement-copy';
  placementCopyButton.type = 'button';
  placementCopyButton.disabled = true;
  placementCopyButton.textContent = 'No Coordinate To Save';
  placementCopyButton.addEventListener('click', async (event) => {
    event.stopPropagation();
    if (!placementToolCopyText) {
      return;
    }

    try {
      window.localStorage.setItem('scary-sushi:last-coordinate-marker', placementToolCopyText);
    } catch {
      // Saving to clipboard still works if local storage is unavailable.
    }

    try {
      await navigator.clipboard.writeText(placementToolCopyText);
      placementCopyButton.textContent = 'Saved';
      window.setTimeout(() => {
        placementCopyButton.textContent = 'Save Coordinates';
      }, 1200);
    } catch {
      const fallback = document.createElement('textarea');
      fallback.value = placementToolCopyText;
      fallback.style.position = 'fixed';
      fallback.style.left = '-9999px';
      document.body.append(fallback);
      fallback.select();
      document.execCommand('copy');
      fallback.remove();
      placementCopyButton.textContent = 'Saved';
      window.setTimeout(() => {
        placementCopyButton.textContent = 'Save Coordinates';
      }, 1200);
    }
  });

  placementTool.append(placementToolLabel, placementToolText, placementCopyButton);

  const microphoneTool = document.createElement('section');
  microphoneTool.className = 'hud__microphone-tool';
  microphoneTool.dataset.active = 'false';

  const microphoneToolLabel = document.createElement('p');
  microphoneToolLabel.className = 'hud__label';
  microphoneToolLabel.textContent = 'Microphone Sound Tool';

  const microphoneToolText = document.createElement('p');
  microphoneToolText.className = 'hud__value';
  microphoneToolText.textContent = '';

  microphoneTool.append(microphoneToolLabel, microphoneToolText);

  const cameraTool = document.createElement('section');
  cameraTool.className = 'hud__camera-tool';
  cameraTool.dataset.active = 'false';

  const cameraToolLabel = document.createElement('p');
  cameraToolLabel.className = 'hud__label';
  cameraToolLabel.textContent = 'Camera Tool';

  const cameraToolText = document.createElement('p');
  cameraToolText.className = 'hud__value';
  cameraToolText.textContent = '';

  const cameraToolPreview = document.createElement('div');
  cameraToolPreview.className = 'hud__camera-tool-preview';
  cameraToolPreview.dataset.live = 'false';

  const cameraToolPreviewLabel = document.createElement('span');
  cameraToolPreviewLabel.className = 'hud__camera-tool-preview-label';
  cameraToolPreviewLabel.textContent = 'Waiting for camera';

  cameraToolPreview.append(cameraToolPreviewLabel);
  cameraTool.append(cameraToolLabel, cameraToolPreview, cameraToolText);

  const photoCameraPreview = document.createElement('section');
  photoCameraPreview.className = 'hud__photo-camera-preview';
  photoCameraPreview.dataset.active = 'false';
  photoCameraPreview.dataset.flash = 'false';

  const photoCameraPreviewImage = document.createElement('img');
  photoCameraPreviewImage.className = 'hud__photo-camera-preview-image';
  photoCameraPreviewImage.alt = 'Photo camera preview';

  const photoCameraPreviewLabel = document.createElement('p');
  photoCameraPreviewLabel.className = 'hud__photo-camera-preview-label';
  photoCameraPreviewLabel.textContent = '';

  const photoCameraFlash = document.createElement('div');
  photoCameraFlash.className = 'hud__photo-camera-flash';
  photoCameraFlash.dataset.active = 'false';

  photoCameraPreview.append(photoCameraPreviewImage, photoCameraPreviewLabel);

  const tabletCameraPanel = document.createElement('section');
  tabletCameraPanel.className = 'hud__tablet-cameras';
  tabletCameraPanel.dataset.active = 'false';

  const tabletCameraLabel = document.createElement('p');
  tabletCameraLabel.className = 'hud__label';
  tabletCameraLabel.textContent = 'Desk iPad Cameras';

  const tabletCameraList = document.createElement('div');
  tabletCameraList.className = 'hud__tablet-camera-list';

  tabletCameraPanel.append(tabletCameraLabel, tabletCameraList);

  const tabletCameraTitle = document.createElement('section');
  tabletCameraTitle.className = 'hud__tablet-camera-title';
  tabletCameraTitle.dataset.active = 'false';
  tabletCameraTitle.textContent = '';

  const nightModeAttack = document.createElement('div');
  nightModeAttack.className = 'hud__night-mode-attack';
  nightModeAttack.dataset.active = 'false';
  nightModeAttack.style.setProperty('--arm-progress', '0');
  nightModeAttack.style.setProperty('--blackout', '0');

  const nightModeArm = document.createElement('div');
  nightModeArm.className = 'hud__night-mode-arm';
  nightModeAttack.append(nightModeArm);

  const compass = document.createElement('section');
  compass.className = 'hud__compass';
  compass.dataset.active = 'false';
  compass.style.setProperty('--compass-heading', '0deg');

  const compassDial = document.createElement('div');
  compassDial.className = 'hud__compass-dial';

  const compassMarks = document.createElement('div');
  compassMarks.className = 'hud__compass-marks';

  const compassNorth = document.createElement('span');
  compassNorth.className = 'hud__compass-mark hud__compass-mark--north';
  compassNorth.textContent = 'N';

  const compassEast = document.createElement('span');
  compassEast.className = 'hud__compass-mark hud__compass-mark--east';
  compassEast.textContent = 'E';

  const compassSouth = document.createElement('span');
  compassSouth.className = 'hud__compass-mark hud__compass-mark--south';
  compassSouth.textContent = 'S';

  const compassWest = document.createElement('span');
  compassWest.className = 'hud__compass-mark hud__compass-mark--west';
  compassWest.textContent = 'W';

  compassMarks.append(compassNorth, compassEast, compassSouth, compassWest);

  const compassNeedle = document.createElement('div');
  compassNeedle.className = 'hud__compass-needle';

  const compassHeading = document.createElement('p');
  compassHeading.className = 'hud__compass-heading';
  compassHeading.textContent = 'N 000°';

  compassDial.append(compassMarks, compassNeedle);
  compass.append(compassDial, compassHeading);

  const chapterFiveMonitor = document.createElement('section');
  chapterFiveMonitor.className = 'hud__chapter-five-monitor';
  chapterFiveMonitor.dataset.active = 'false';

  const chapterFiveMonitorTitle = document.createElement('p');
  chapterFiveMonitorTitle.className = 'hud__label';
  chapterFiveMonitorTitle.textContent = 'Spaceship Computer';

  const chapterFiveMonitorStatus = document.createElement('p');
  chapterFiveMonitorStatus.className = 'hud__chapter-five-monitor-status';
  chapterFiveMonitorStatus.textContent = '';

  const chapterFiveMonitorLayout = document.createElement('div');
  chapterFiveMonitorLayout.className = 'hud__chapter-five-monitor-layout';

  const chapterFiveMonitorPlanets = document.createElement('div');
  chapterFiveMonitorPlanets.className = 'hud__chapter-five-monitor-planets';

  const chapterFiveMonitorControls = document.createElement('div');
  chapterFiveMonitorControls.className = 'hud__chapter-five-monitor-controls';

  const chapterFiveAutopilotButton = document.createElement('button');
  chapterFiveAutopilotButton.className = 'hud__chapter-five-monitor-button';
  chapterFiveAutopilotButton.type = 'button';
  chapterFiveAutopilotButton.textContent = 'Autopilot';

  const chapterFiveEngineButton = document.createElement('button');
  chapterFiveEngineButton.className = 'hud__chapter-five-monitor-button';
  chapterFiveEngineButton.type = 'button';
  chapterFiveEngineButton.textContent = 'Engines On';

  const chapterFiveRadarButton = document.createElement('button');
  chapterFiveRadarButton.className = 'hud__chapter-five-monitor-button hud__chapter-five-monitor-button--radar';
  chapterFiveRadarButton.type = 'button';
  chapterFiveRadarButton.textContent = 'Radar';

  const chapterFiveLandingButton = document.createElement('button');
  chapterFiveLandingButton.className = 'hud__chapter-five-monitor-button hud__chapter-five-monitor-button--landing';
  chapterFiveLandingButton.type = 'button';
  chapterFiveLandingButton.textContent = 'Landing Sequence';
  chapterFiveLandingButton.hidden = true;

  const chapterFiveEscapeOrbitButton = document.createElement('button');
  chapterFiveEscapeOrbitButton.className = 'hud__chapter-five-monitor-button';
  chapterFiveEscapeOrbitButton.type = 'button';
  chapterFiveEscapeOrbitButton.textContent = 'Escape Orbit';
  chapterFiveEscapeOrbitButton.hidden = true;

  const chapterFiveLaunchButton = document.createElement('button');
  chapterFiveLaunchButton.className = 'hud__chapter-five-monitor-button hud__chapter-five-monitor-button--landing';
  chapterFiveLaunchButton.type = 'button';
  chapterFiveLaunchButton.textContent = 'Launch Sequence';
  chapterFiveLaunchButton.hidden = true;

  const chapterFiveLightSpeedLabel = document.createElement('label');
  chapterFiveLightSpeedLabel.className = 'hud__chapter-five-light-speed';
  chapterFiveLightSpeedLabel.textContent = 'Light Speed';

  const chapterFiveLightSpeedValue = document.createElement('span');
  chapterFiveLightSpeedValue.textContent = '1/10';

  const chapterFiveLightSpeedDial = document.createElement('input');
  chapterFiveLightSpeedDial.className = 'hud__chapter-five-light-speed-dial';
  chapterFiveLightSpeedDial.type = 'range';
  chapterFiveLightSpeedDial.min = '1';
  chapterFiveLightSpeedDial.max = '10';
  chapterFiveLightSpeedDial.step = '1';
  chapterFiveLightSpeedDial.value = '1';

  chapterFiveLightSpeedLabel.append(chapterFiveLightSpeedValue, chapterFiveLightSpeedDial);
  chapterFiveMonitorControls.append(
    chapterFiveAutopilotButton,
    chapterFiveEngineButton,
    chapterFiveRadarButton,
    chapterFiveLandingButton,
    chapterFiveEscapeOrbitButton,
    chapterFiveLaunchButton,
    chapterFiveLightSpeedLabel,
  );
  chapterFiveMonitorLayout.append(chapterFiveMonitorPlanets, chapterFiveMonitorControls);

  const chapterFiveMonitorHint = document.createElement('p');
  chapterFiveMonitorHint.className = 'hud__hint';
  chapterFiveMonitorHint.textContent = 'Click a planet or junk field row to save it. Click that same row again to cancel. Press E to close.';

  chapterFiveMonitor.append(
    chapterFiveMonitorTitle,
    chapterFiveMonitorStatus,
    chapterFiveMonitorLayout,
    chapterFiveMonitorHint,
  );

  const chapterSevenDayCounter = document.createElement('section');
  chapterSevenDayCounter.className = 'hud__chapter-seven-day';
  chapterSevenDayCounter.dataset.active = 'false';

  const chapterSevenDayLabel = document.createElement('p');
  chapterSevenDayLabel.className = 'hud__label';
  chapterSevenDayLabel.textContent = 'Days';

  const chapterSevenDayValue = document.createElement('p');
  chapterSevenDayValue.className = 'hud__chapter-seven-day-value';
  chapterSevenDayValue.textContent = 'Day 1';

  chapterSevenDayCounter.append(chapterSevenDayLabel, chapterSevenDayValue);

  const chapterSevenCookieCounter = document.createElement('section');
  chapterSevenCookieCounter.className = 'hud__chapter-seven-cookies';
  chapterSevenCookieCounter.dataset.active = 'false';

  const chapterSevenCookieLabel = document.createElement('p');
  chapterSevenCookieLabel.className = 'hud__label';
  chapterSevenCookieLabel.textContent = 'Cookies';

  const chapterSevenCookieValue = document.createElement('p');
  chapterSevenCookieValue.className = 'hud__chapter-seven-cookie-value';
  chapterSevenCookieValue.textContent = '0';

  chapterSevenCookieCounter.append(chapterSevenCookieLabel, chapterSevenCookieValue);

  const chapterSevenPhaseTimer = document.createElement('section');
  chapterSevenPhaseTimer.className = 'hud__chapter-seven-timer';
  chapterSevenPhaseTimer.dataset.active = 'false';
  chapterSevenPhaseTimer.dataset.phase = 'night';
  chapterSevenPhaseTimer.dataset.urgent = 'false';

  const chapterSevenPhaseLabel = document.createElement('p');
  chapterSevenPhaseLabel.className = 'hud__label';
  chapterSevenPhaseLabel.textContent = 'Night';

  const chapterSevenPhaseValue = document.createElement('p');
  chapterSevenPhaseValue.className = 'hud__chapter-seven-timer-value';
  chapterSevenPhaseValue.textContent = '1:30';

  chapterSevenPhaseTimer.append(chapterSevenPhaseLabel, chapterSevenPhaseValue);

  const chapterSevenCookiePicker = document.createElement('section');
  chapterSevenCookiePicker.className = 'hud__chapter-seven-cookie-picker';
  chapterSevenCookiePicker.dataset.active = 'false';

  const chapterSevenCookiePickerTitle = document.createElement('h2');
  chapterSevenCookiePickerTitle.className = 'hud__chapter-seven-cookie-picker-title';
  chapterSevenCookiePickerTitle.textContent = 'How many cookies you want to pick?';

  const chapterSevenCookiePickerOptions = document.createElement('div');
  chapterSevenCookiePickerOptions.className = 'hud__chapter-seven-cookie-picker-options';

  const chapterSevenCookieTargetButtons = [25, 50, 80].map((target) => {
    const button = document.createElement('button');
    button.className = 'hud__chapter-seven-cookie-target';
    button.type = 'button';
    button.dataset.target = `${target}`;
    button.textContent = `${target}`;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      chapterSevenCookieTargetSelectHandler?.(target);
    });
    return button;
  });

  chapterSevenCookiePickerOptions.append(...chapterSevenCookieTargetButtons);
  chapterSevenCookiePicker.append(chapterSevenCookiePickerTitle, chapterSevenCookiePickerOptions);

  const chapterSevenTrading = document.createElement('section');
  chapterSevenTrading.className = 'hud__chapter-seven-trading';
  chapterSevenTrading.dataset.active = 'false';

  const chapterSevenTradingTitle = document.createElement('h2');
  chapterSevenTradingTitle.className = 'hud__chapter-seven-cookie-picker-title';
  chapterSevenTradingTitle.textContent = 'Trading';

  const chapterSevenTradingCookies = document.createElement('p');
  chapterSevenTradingCookies.className = 'hud__chapter-seven-trading-cookies';
  chapterSevenTradingCookies.textContent = 'Cookies: 0';

  const chapterSevenTradingOptions = document.createElement('div');
  chapterSevenTradingOptions.className = 'hud__chapter-seven-trading-options';

  chapterSevenTrading.append(chapterSevenTradingTitle, chapterSevenTradingCookies, chapterSevenTradingOptions);

  const chapterElevenSeedShop = document.createElement('section');
  chapterElevenSeedShop.className = 'hud__chapter-eleven-seed-shop';
  chapterElevenSeedShop.dataset.active = 'false';

  const chapterElevenSeedShopTitle = document.createElement('h2');
  chapterElevenSeedShopTitle.className = 'hud__chapter-seven-cookie-picker-title';
  chapterElevenSeedShopTitle.textContent = 'Buy Seeds';

  const chapterElevenSeedShopMoney = document.createElement('p');
  chapterElevenSeedShopMoney.className = 'hud__chapter-seven-trading-cookies';
  chapterElevenSeedShopMoney.textContent = 'Money: $200';

  const chapterElevenSeedShopOptions = document.createElement('div');
  chapterElevenSeedShopOptions.className = 'hud__chapter-seven-trading-options';

  chapterElevenSeedShop.append(chapterElevenSeedShopTitle, chapterElevenSeedShopMoney, chapterElevenSeedShopOptions);

  const chapterElevenEquipmentShop = document.createElement('section');
  chapterElevenEquipmentShop.className = 'hud__chapter-eleven-equipment-shop';
  chapterElevenEquipmentShop.dataset.active = 'false';

  const chapterElevenEquipmentShopTitle = document.createElement('h2');
  chapterElevenEquipmentShopTitle.className = 'hud__chapter-seven-cookie-picker-title';
  chapterElevenEquipmentShopTitle.textContent = 'Equipment';

  const chapterElevenEquipmentShopMoney = document.createElement('p');
  chapterElevenEquipmentShopMoney.className = 'hud__chapter-seven-trading-cookies';
  chapterElevenEquipmentShopMoney.textContent = 'Money: $50';

  const chapterElevenEquipmentShopOptions = document.createElement('div');
  chapterElevenEquipmentShopOptions.className = 'hud__chapter-seven-trading-options';

  chapterElevenEquipmentShop.append(chapterElevenEquipmentShopTitle, chapterElevenEquipmentShopMoney, chapterElevenEquipmentShopOptions);

  const chapterElevenSellMenu = document.createElement('section');
  chapterElevenSellMenu.className = 'hud__chapter-eleven-sell-menu';
  chapterElevenSellMenu.dataset.active = 'false';

  const chapterElevenSellTitle = document.createElement('h2');
  chapterElevenSellTitle.className = 'hud__chapter-seven-cookie-picker-title';
  chapterElevenSellTitle.textContent = 'Sell Plants';

  const chapterElevenSellMoney = document.createElement('p');
  chapterElevenSellMoney.className = 'hud__chapter-seven-trading-cookies';
  chapterElevenSellMoney.textContent = 'Money: $50';

  const chapterElevenSellOptions = document.createElement('div');
  chapterElevenSellOptions.className = 'hud__chapter-seven-trading-options';

  chapterElevenSellMenu.append(chapterElevenSellTitle, chapterElevenSellMoney, chapterElevenSellOptions);

  const chapterElevenAutoHarvestChest = document.createElement('section');
  chapterElevenAutoHarvestChest.className = 'hud__chapter-eleven-chest';
  chapterElevenAutoHarvestChest.dataset.active = 'false';

  const chapterElevenAutoHarvestChestTitle = document.createElement('h2');
  chapterElevenAutoHarvestChestTitle.className = 'hud__chapter-seven-cookie-picker-title';
  chapterElevenAutoHarvestChestTitle.textContent = 'Auto Harvester Chest';

  const chapterElevenAutoHarvestChestHint = document.createElement('p');
  chapterElevenAutoHarvestChestHint.className = 'hud__chapter-seven-trading-cookies';
  chapterElevenAutoHarvestChestHint.textContent = 'Click a chest item to move it into your inventory.';

  const chapterElevenAutoHarvestChestOptions = document.createElement('div');
  chapterElevenAutoHarvestChestOptions.className = 'hud__chapter-seven-trading-options hud__chapter-eleven-chest-options';

  const chapterElevenAutoHarvestInventoryTitle = document.createElement('p');
  chapterElevenAutoHarvestInventoryTitle.className = 'hud__chapter-eleven-seed-section';
  chapterElevenAutoHarvestInventoryTitle.textContent = 'Extra Inventory';

  const chapterElevenAutoHarvestInventoryGrid = document.createElement('div');
  chapterElevenAutoHarvestInventoryGrid.className = 'hud__chapter-eleven-chest-grid';

  const chapterElevenAutoHarvestInventorySlots = Array.from({ length: 27 }, (_, index) => {
    const slot = document.createElement('div');
    slot.className = 'hud__slot hud__chapter-eleven-chest-slot';
    slot.dataset.filled = 'false';
    slot.dataset.selected = 'false';

    const indexText = document.createElement('span');
    indexText.className = 'hud__slot-index';
    indexText.textContent = String(index + 1);

    const valueText = document.createElement('span');
    valueText.className = 'hud__slot-value';
    valueText.textContent = 'Empty';

    const countText = document.createElement('span');
    countText.className = 'hud__slot-count';
    countText.textContent = 'x0';

    slot.append(indexText, valueText, countText);
    chapterElevenAutoHarvestInventoryGrid.append(slot);
    return { root: slot, valueText, countText };
  });

  chapterElevenAutoHarvestChest.append(
    chapterElevenAutoHarvestChestTitle,
    chapterElevenAutoHarvestChestHint,
    chapterElevenAutoHarvestChestOptions,
    chapterElevenAutoHarvestInventoryTitle,
    chapterElevenAutoHarvestInventoryGrid,
  );

  const statusPanel = document.createElement('section');
  statusPanel.className = 'hud__panel hud__panel--right';

  const statusBar = document.createElement('section');
  statusBar.className = 'hud__info-bar hud__info-bar--status';
  statusBar.dataset.expanded = 'false';

  const statusLabel = document.createElement('button');
  statusLabel.className = 'hud__label hud__info-bar-title hud__info-toggle';
  statusLabel.type = 'button';
  statusLabel.textContent = 'Status';
  statusLabel.addEventListener('click', (event) => {
    event.stopPropagation();
    const expanded = statusBar.dataset.expanded !== 'true';
    statusBar.dataset.expanded = String(expanded);
    statusLabel.setAttribute('aria-expanded', String(expanded));
  });

  const statusContent = document.createElement('div');
  statusContent.className = 'hud__info-bar-body';

  const statusText = document.createElement('p');
  statusText.className = 'hud__value';
  statusText.textContent = 'Click the button to lock the pointer and begin.';

  const inventoryText = document.createElement('p');
  inventoryText.className = 'hud__value';
  inventoryText.textContent = 'Inventory: empty';

  const chapterText = document.createElement('p');
  chapterText.className = 'hud__value';
  chapterText.textContent = 'Chapter: 2';

  const promptText = document.createElement('p');
  promptText.className = 'hud__value hud__value--accent';
  promptText.textContent = 'Push through the kitchen doors, find the raw ingredients in the maze, and bring them back to the station.';

  const flashlightText = document.createElement('p');
  flashlightText.className = 'hud__value';
  flashlightText.textContent = 'Flashlight: off / toggle with F';

  statusContent.append(statusText, inventoryText, chapterText, promptText, flashlightText);
  statusBar.append(statusLabel, statusContent);

  const howToPlayBar = document.createElement('section');
  howToPlayBar.className = 'hud__info-bar hud__info-bar--play';
  howToPlayBar.dataset.expanded = 'false';

  const howToPlayLabel = document.createElement('button');
  howToPlayLabel.className = 'hud__label hud__info-bar-title hud__info-toggle';
  howToPlayLabel.type = 'button';
  howToPlayLabel.textContent = 'How to play';
  howToPlayLabel.addEventListener('click', (event) => {
    event.stopPropagation();
    const expanded = howToPlayBar.dataset.expanded !== 'true';
    howToPlayBar.dataset.expanded = String(expanded);
    howToPlayLabel.setAttribute('aria-expanded', String(expanded));
  });

  const controlsText = document.createElement('p');
  controlsText.className = 'hud__hint hud__info-bar-body';
  controlsText.textContent = 'WASD move / Space jump / E interact / 1 Tool / 3 Mic / 4 Camera / K Creator / M Mode / J Jumpscares / F Light / V Hide panels / Esc Pointer';

  howToPlayBar.append(howToPlayLabel, controlsText);

  statusPanel.append(statusBar, howToPlayBar);

  const crouchInstructions = document.createElement('section');
  crouchInstructions.className = 'hud__crouch-instructions';
  crouchInstructions.dataset.active = 'false';
  crouchInstructions.dataset.crouched = 'false';

  const crouchTitle = document.createElement('p');
  crouchTitle.className = 'hud__label';
  crouchTitle.textContent = 'Crouch Instructions';

  const crouchText = document.createElement('p');
  crouchText.className = 'hud__value';
  crouchText.textContent = 'Hold Spacebar';

  crouchInstructions.append(crouchTitle, crouchText);

  let helperPanelsHidden = false;
  const setHelperPanelsHidden = (hidden: boolean): void => {
    helperPanelsHidden = hidden;
    howToPlayBar.dataset.hidden = String(hidden);
    howToPlayBar.style.display = hidden ? 'none' : '';
  };

  const hotbar = document.createElement('section');
  hotbar.className = 'hud__hotbar';

  const hotbarLabel = document.createElement('p');
  hotbarLabel.className = 'hud__label hud__label--hotbar';
  hotbarLabel.textContent = 'Inventory';

  const hotbarSlots = Array.from({ length: 10 }, (_, index) => {
    const slot = document.createElement('div');
    slot.className = 'hud__slot';
    slot.dataset.filled = 'false';
    slot.dataset.selected = 'false';

    const indexText = document.createElement('span');
    indexText.className = 'hud__slot-index';
    indexText.textContent = String(index + 1);

    const valueText = document.createElement('span');
    valueText.className = 'hud__slot-value';
    valueText.textContent = 'Empty';

    const image = document.createElement('img');
    image.className = 'hud__slot-image';
    image.alt = '';
    image.hidden = true;

    const countText = document.createElement('span');
    countText.className = 'hud__slot-count';
    countText.textContent = 'x0';

    slot.append(indexText, image, valueText, countText);

    return { root: slot, image, valueText, countText };
  });

  hotbar.append(hotbarLabel, ...hotbarSlots.map((slot) => slot.root));

  const chapterElevenSeedHotbar = document.createElement('section');
  chapterElevenSeedHotbar.className = 'hud__chapter-eleven-hotbar';
  chapterElevenSeedHotbar.dataset.active = 'false';

  const chapterElevenSeedHotbarLabel = document.createElement('p');
  chapterElevenSeedHotbarLabel.className = 'hud__label hud__label--hotbar';
  chapterElevenSeedHotbarLabel.textContent = 'Seed Hotbar';

  const chapterElevenSeedHotbarSlots = Array.from({ length: 10 }, (_, index) => {
    const slot = document.createElement('div');
    slot.className = 'hud__slot hud__chapter-eleven-hotbar-slot';
    slot.dataset.filled = 'false';
    slot.dataset.selected = 'false';

    const indexText = document.createElement('span');
    indexText.className = 'hud__slot-index';
    indexText.textContent = String(index + 1);

    const valueText = document.createElement('span');
    valueText.className = 'hud__slot-value';
    valueText.textContent = 'Empty';

    const countText = document.createElement('span');
    countText.className = 'hud__slot-count';
    countText.textContent = 'x0';

    slot.append(indexText, valueText, countText);
    return { root: slot, valueText, countText };
  });

  chapterElevenSeedHotbar.append(chapterElevenSeedHotbarLabel, ...chapterElevenSeedHotbarSlots.map((slot) => slot.root));

  let minecraftInventoryActionHandler: ((action: MinecraftInventoryAction) => void) | null = null;
  const minecraftInventory = document.createElement('section');
  minecraftInventory.className = 'hud__minecraft-inventory';
  minecraftInventory.dataset.active = 'false';

  const minecraftInventoryTitle = document.createElement('p');
  minecraftInventoryTitle.className = 'hud__label';
  minecraftInventoryTitle.textContent = 'Inventory';

  const minecraftInventoryHint = document.createElement('p');
  minecraftInventoryHint.className = 'hud__hint';
  minecraftInventoryHint.textContent = 'Left click moves a stack. Right click moves one item. E closes.';

  const createMinecraftSlotButton = (
    kind: MinecraftInventorySlotKind,
    index: number,
  ): HTMLButtonElement => {
    const slot = document.createElement('button');
    slot.className = 'hud__minecraft-slot';
    slot.type = 'button';
    slot.dataset.filled = 'false';
    slot.dataset.selected = 'false';
    slot.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      minecraftInventoryActionHandler?.({ target: 'slot', kind, index, button: 0 });
    });
    slot.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
      minecraftInventoryActionHandler?.({ target: 'slot', kind, index, button: 2 });
    });
    return slot;
  };

  const minecraftInventorySlots = Array.from({ length: 27 }, (_, index) => createMinecraftSlotButton('inventory', index));
  const minecraftHotbarSlots = Array.from({ length: 9 }, (_, index) => createMinecraftSlotButton('hotbar', index));
  const minecraftCraftSlots = Array.from({ length: 4 }, (_, index) => createMinecraftSlotButton('craft', index));
  const minecraftResultSlot = document.createElement('button');
  minecraftResultSlot.className = 'hud__minecraft-slot hud__minecraft-slot--result';
  minecraftResultSlot.type = 'button';
  minecraftResultSlot.dataset.filled = 'false';
  minecraftResultSlot.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    minecraftInventoryActionHandler?.({ target: 'result', button: 0 });
  });
  minecraftResultSlot.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    event.stopPropagation();
    minecraftInventoryActionHandler?.({ target: 'result', button: 2 });
  });

  const minecraftInventoryGrid = document.createElement('div');
  minecraftInventoryGrid.className = 'hud__minecraft-grid hud__minecraft-grid--inventory';
  minecraftInventoryGrid.append(...minecraftInventorySlots);

  const minecraftHotbarGrid = document.createElement('div');
  minecraftHotbarGrid.className = 'hud__minecraft-grid hud__minecraft-grid--hotbar';
  minecraftHotbarGrid.append(...minecraftHotbarSlots);

  const minecraftCraftGrid = document.createElement('div');
  minecraftCraftGrid.className = 'hud__minecraft-grid hud__minecraft-grid--craft';
  minecraftCraftGrid.append(...minecraftCraftSlots);

  const minecraftCraftPanel = document.createElement('div');
  minecraftCraftPanel.className = 'hud__minecraft-craft-panel';

  const minecraftCraftLabel = document.createElement('p');
  minecraftCraftLabel.className = 'hud__label';
  minecraftCraftLabel.textContent = 'Crafting';

  const minecraftResultWrap = document.createElement('div');
  minecraftResultWrap.className = 'hud__minecraft-result';

  const minecraftResultArrow = document.createElement('span');
  minecraftResultArrow.className = 'hud__minecraft-result-arrow';
  minecraftResultArrow.textContent = '>';

  minecraftResultWrap.append(minecraftResultArrow, minecraftResultSlot);
  minecraftCraftPanel.append(minecraftCraftLabel, minecraftCraftGrid, minecraftResultWrap);

  const minecraftCursor = document.createElement('p');
  minecraftCursor.className = 'hud__minecraft-cursor';
  minecraftCursor.textContent = 'Cursor: empty';

  minecraftInventory.append(
    minecraftInventoryTitle,
    minecraftInventoryHint,
    minecraftCraftPanel,
    minecraftInventoryGrid,
    minecraftHotbarGrid,
    minecraftCursor,
  );

  const crosshair = document.createElement('div');
  crosshair.className = 'hud__crosshair';

  const threatEye = document.createElement('div');
  threatEye.className = 'hud__threat-eye';
  threatEye.dataset.active = 'false';

  const threatEyeIris = document.createElement('span');
  threatEyeIris.className = 'hud__threat-eye-iris';

  const threatEyePupil = document.createElement('span');
  threatEyePupil.className = 'hud__threat-eye-pupil';

  threatEye.append(threatEyeIris, threatEyePupil);

  const chapterCard = document.createElement('section');
  chapterCard.className = 'hud__chapter-card';
  chapterCard.dataset.active = 'false';

  const chapterLabel = document.createElement('p');
  chapterLabel.className = 'hud__eyebrow';
  chapterLabel.textContent = 'Next Chapter';

  const chapterTitle = document.createElement('h2');
  chapterTitle.className = 'hud__chapter-title';
  chapterTitle.textContent = 'Chapter Two';

  const chapterBody = document.createElement('p');
  chapterBody.className = 'hud__chapter-body';
  chapterBody.textContent = 'The next chapter begins beyond the seaweed door.';

  chapterCard.append(chapterLabel, chapterTitle, chapterBody);

  const chapterMenu = document.createElement('section');
  chapterMenu.className = 'hud__chapter-menu';
  chapterMenu.dataset.active = 'false';

  const chapterMenuEyebrow = document.createElement('p');
  chapterMenuEyebrow.className = 'hud__eyebrow';
  chapterMenuEyebrow.textContent = 'Chapter Select';

  const chapterMenuTitle = document.createElement('h2');
  chapterMenuTitle.className = 'hud__chapter-menu-title';
  chapterMenuTitle.textContent = 'Choose A Chapter';

  const chapterMenuSummary = document.createElement('p');
  chapterMenuSummary.className = 'hud__chapter-menu-summary';
  chapterMenuSummary.textContent = 'Pick a chapter or mode to load. The game will reset into it and wait for you to click back into first person.';

  const chapterButtons = [
    {
      id: 'chapter-1' as const,
      label: 'Chapter 1: scary-sushi',
      body: 'Kitchen challenge and pantry maze.',
    },
    {
      id: 'chapter-2' as const,
      label: 'Chapter 2: daycare horror',
      body: 'Locked daycare hallways and key-card routes.',
    },
    {
      id: 'chapter-3' as const,
      label: "Chapter 3: five nights at Bori's",
      body: 'A quiet office room with furniture and big side doors.',
    },
    {
      id: 'chapter-3-copy' as const,
      label: "Chapter 3 Copy: Bori's map sandbox",
      body: 'A separate copy for reconfiguring the map without changing the full game.',
    },
    {
      id: 'chapter-4' as const,
      label: 'Chapter 4: rainbow friends',
      body: 'Five Nights prototype office with left and right halls only.',
    },
    {
      id: 'chapter-5' as const,
      label: 'Chapter 5: space adventure/horror',
      body: 'Outer-space chase-view spaceship prototype with live thrusters.',
    },
    {
      id: 'chapter-6' as const,
      label: 'Chapter 6: Minecraft',
      body: 'A block world with pixelated terrain, hills, trees, and detailed cubes.',
    },
    {
      id: 'chapter-7' as const,
      label: 'Chapter 7: The House',
      body: 'Spawn inside the house with a smaller fridge, counter cabinet, oven, longer cupboards, books, and table drawers.',
    },
    {
      id: 'chapter-8' as const,
      label: 'Chapter 8: The Woods',
      body: 'A semi-realistic forest camp with a fire pit, stone ring, crafting bench, and grinding bench.',
    },
    {
      id: 'chapter-9' as const,
      label: "Chapter 9: Freddy's Pizza Complex",
      body: 'A huge abandoned brick pizza complex with FNAF animatronics, vents, filming evidence, puzzles, and locked night survival.',
    },
    {
      id: 'chapter-10' as const,
      label: 'Chapter 10: House Shell',
      body: 'A small grass map with a simple house shell, doorway, porch step, roof, and exposed wall framing.',
    },
    {
      id: 'chapter-11' as const,
      label: 'Chapter 11: Grow a garden',
      body: 'Walk, plant your seeds in your garden.',
    },
    {
      id: 'chapter-11-two' as const,
      label: 'Grow-a-Garden Two',
      body: 'A copied Grow-a-Garden workspace for the next garden changes.',
    },
    {
      id: 'chapter-12' as const,
      label: 'Chapter 12: The Truck Game',
      body: 'A big forest mud field with truck trails, jumps, and a drivable Ford F250 Super Duty.',
    },
    {
      id: 'zombie-fps' as const,
      label: 'Zombie First Person Shooter',
      body: 'Forest survival with weapons, barricades, and zombie nights.',
    },
    {
      id: 'doom-fps' as const,
      label: 'Doom Run',
      body: 'Retro techbase corridors, key-card doors, demons, and an exit switch.',
    },
  ].map((entry) => {
    const button = document.createElement('button');
    button.className = 'hud__chapter-option';
    button.type = 'button';
    button.dataset.active = 'false';
    button.dataset.chapter = entry.id;

    const optionLabel = document.createElement('span');
    optionLabel.className = 'hud__chapter-option-title';
    optionLabel.textContent = entry.label;

    const optionBody = document.createElement('span');
    optionBody.className = 'hud__chapter-option-body';
    optionBody.textContent = entry.body;

    button.append(optionLabel, optionBody);
    return { ...entry, button };
  });

  const featuredChapterButton = document.createElement('button');
  featuredChapterButton.className = 'hud__chapter-feature';
  featuredChapterButton.type = 'button';
  featuredChapterButton.dataset.chapter = 'chapter-8';

  const featuredChapterLabel = document.createElement('span');
  featuredChapterLabel.className = 'hud__chapter-feature-title';
  featuredChapterLabel.textContent = 'Chapter 8: The Woods';

  const featuredChapterBody = document.createElement('span');
  featuredChapterBody.className = 'hud__chapter-feature-body';
  featuredChapterBody.textContent = 'Enter the semi-realistic forest camp with the fire pit, lighter clearing grass, crafting bench, and grinding bench.';

  featuredChapterButton.append(featuredChapterLabel, featuredChapterBody);

  const chapterOptions = document.createElement('div');
  chapterOptions.className = 'hud__chapter-options';
  chapterOptions.append(...chapterButtons.map((entry) => entry.button));

  chapterMenu.append(
    chapterMenuEyebrow,
    chapterMenuTitle,
    chapterMenuSummary,
    featuredChapterButton,
    chapterOptions,
  );

  const officeJumpscareMenu = document.createElement('section');
  officeJumpscareMenu.className = 'hud__office-jumpscare-menu';
  officeJumpscareMenu.dataset.active = 'false';

  const officeJumpscareEyebrow = document.createElement('p');
  officeJumpscareEyebrow.className = 'hud__eyebrow';
  officeJumpscareEyebrow.textContent = 'Chapter 3 / J Menu';

  const officeJumpscareTitle = document.createElement('h2');
  officeJumpscareTitle.className = 'hud__chapter-menu-title';
  officeJumpscareTitle.textContent = 'Choose A Jumpscare';

  const officeJumpscareSummary = document.createElement('p');
  officeJumpscareSummary.className = 'hud__chapter-menu-summary';
  officeJumpscareSummary.textContent = 'Pick an animatronic cutscene. Press J again to close this menu.';

  const officeJumpscareList = document.createElement('div');
  officeJumpscareList.className = 'hud__office-jumpscare-list';

  officeJumpscareMenu.append(
    officeJumpscareEyebrow,
    officeJumpscareTitle,
    officeJumpscareSummary,
    officeJumpscareList,
  );

  const officeModeMenu = document.createElement('section');
  officeModeMenu.className = 'hud__office-mode-menu';
  officeModeMenu.dataset.active = 'false';
  officeModeMenu.dataset.step = 'mode';

  const officeModeEyebrow = document.createElement('p');
  officeModeEyebrow.className = 'hud__eyebrow';
  officeModeEyebrow.textContent = 'Chapter 3 / M Menu';

  const officeModeTitle = document.createElement('h2');
  officeModeTitle.className = 'hud__chapter-menu-title';
  officeModeTitle.textContent = 'Choose A Mode';

  const officeModeSummary = document.createElement('p');
  officeModeSummary.className = 'hud__chapter-menu-summary';
  officeModeSummary.textContent = 'Pick a Chapter 3 lighting and animatronic mode. Night and Game modes ask for difficulty next.';

  const officeModeActiveLine = document.createElement('p');
  officeModeActiveLine.className = 'hud__chapter-option-body';
  officeModeActiveLine.textContent = '';

  const officeModeList = document.createElement('div');
  officeModeList.className = 'hud__office-mode-list';
  const officeDifficultyList = document.createElement('div');
  officeDifficultyList.className = 'hud__office-mode-list hud__office-mode-list--difficulty';

  const officeModeButtons = [
    {
      id: 'mode:night',
      mode: 'night' as const,
      label: 'Night Mode',
      body: 'Five nights. Each night lasts 5 minutes from 12 AM to 6 AM.',
    },
    {
      id: 'mode:game',
      mode: 'game' as const,
      label: 'Game Mode',
      body: 'Five nights with 5-minute night shifts and 3-minute day breaks.',
    },
    {
      id: 'mode:creator',
      mode: 'creator' as const,
      label: 'Day Mode',
      body: 'Creator Mode: always day. No difficulty selection and no night hunt.',
    },
  ].map((entry) => {
    const option = document.createElement('button');
    option.className = 'hud__office-mode-option';
    option.type = 'button';
    option.dataset.mode = entry.mode;
    option.dataset.active = 'false';
    const label = document.createElement('span');
    label.className = 'hud__chapter-option-title';
    label.textContent = entry.label;
    const body = document.createElement('span');
    body.className = 'hud__chapter-option-body';
    body.textContent = entry.body;
    option.append(label, body);
    officeModeList.append(option);
    return { ...entry, button: option };
  });

  const officeDifficultyButtons = [
    {
      id: 'difficulty:easy',
      difficulty: 'easy' as const,
      label: 'Easy',
      body: 'Short sight range, slower animatronics, and a lighter night.',
    },
    {
      id: 'difficulty:normal',
      difficulty: 'normal' as const,
      label: 'Normal',
      body: 'Balanced power drain, sight range, and speed.',
    },
    {
      id: 'difficulty:hard',
      difficulty: 'hard' as const,
      label: 'Hard',
      body: 'Longer sight range, faster pressure, super dark nights, and the vent-crawling boy robot.',
    },
  ].map((entry) => {
    const option = document.createElement('button');
    option.className = 'hud__office-mode-option';
    option.type = 'button';
    option.dataset.difficulty = entry.difficulty;
    option.dataset.active = 'false';
    const label = document.createElement('span');
    label.className = 'hud__chapter-option-title';
    label.textContent = entry.label;
    const body = document.createElement('span');
    body.className = 'hud__chapter-option-body';
    body.textContent = entry.body;
    option.append(label, body);
    officeDifficultyList.append(option);
    return { ...entry, button: option };
  });

  officeModeMenu.append(
    officeModeEyebrow,
    officeModeTitle,
    officeModeSummary,
    officeModeActiveLine,
    officeModeList,
    officeDifficultyList,
  );

  const curatorTool = document.createElement('section');
  curatorTool.className = 'hud__curator-tool';
  curatorTool.dataset.active = 'false';

  const curatorEyebrow = document.createElement('p');
  curatorEyebrow.className = 'hud__eyebrow';
  curatorEyebrow.textContent = 'Character Creator';

  const curatorTitle = document.createElement('h2');
  curatorTitle.className = 'hud__chapter-menu-title';
  curatorTitle.textContent = 'Character Creator';

  const curatorInstructions = document.createElement('ol');
  curatorInstructions.className = 'hud__curator-instructions';
  [
    'Pick Monster, NPC, or Object.',
    'Use the part buttons to choose Head, Torso, Arms, Legs, or Mouth. It stays on that part.',
    'Click a design card, drag the center to move it, or drag handles to resize the selected feature.',
    'Drag the circle under the feet to lift or twist the whole character. Drag empty preview space to spin it.',
    'Press Save Character, then tell Codex the saved slot name, like Character 02.',
  ].forEach((instruction) => {
    const item = document.createElement('li');
    item.textContent = instruction;
    curatorInstructions.append(item);
  });

  const curatorKindControls = document.createElement('div');
  curatorKindControls.className = 'hud__curator-kind-controls';

  const curatorKindButtons = CURATOR_KIND_OPTIONS.map((kind) => {
    const buttonElement = document.createElement('button');
    buttonElement.className = 'hud__curator-pill';
    buttonElement.type = 'button';
    buttonElement.dataset.kind = kind.id;
    buttonElement.textContent = kind.label;
    curatorKindControls.append(buttonElement);
    return { ...kind, button: buttonElement };
  });

  const curatorPaletteControls = document.createElement('div');
  curatorPaletteControls.className = 'hud__curator-palette-controls';

  const curatorPaletteButtons = CURATOR_PALETTE_OPTIONS.map((palette) => {
    const buttonElement = document.createElement('button');
    buttonElement.className = 'hud__curator-swatch';
    buttonElement.type = 'button';
    buttonElement.dataset.palette = palette.id;
    buttonElement.setAttribute('aria-label', palette.label);
    buttonElement.title = palette.label;
    curatorPaletteControls.append(buttonElement);
    return { ...palette, button: buttonElement };
  });

  const curatorPartTabs = document.createElement('div');
  curatorPartTabs.className = 'hud__curator-part-tabs';

  const curatorPartButtons = CURATOR_PARTS.map((part) => {
    const buttonElement = document.createElement('button');
    buttonElement.className = 'hud__curator-part-tab';
    buttonElement.type = 'button';
    buttonElement.dataset.part = part.id;
    buttonElement.textContent = part.label;
    curatorPartTabs.append(buttonElement);
    return { ...part, button: buttonElement };
  });

  const curatorLayout = document.createElement('div');
  curatorLayout.className = 'hud__curator-layout';

  const curatorPreviewPanel = document.createElement('div');
  curatorPreviewPanel.className = 'hud__curator-preview-panel';

  const curatorPreview = document.createElement('div');
  curatorPreview.className = 'hud__curator-preview';
  curatorPreview.dataset.kind = 'monster';
  curatorPreview.dataset.palette = 'forest';
  curatorPreview.dataset.leg = 'straight';

  const curatorPreviewCharacter = document.createElement('div');
  curatorPreviewCharacter.className = 'hud__curator-character';

  const curatorPreviewStage = document.createElement('div');
  curatorPreviewStage.className = 'hud__curator-stage';

  const curatorControlRing = document.createElement('div');
  curatorControlRing.className = 'hud__curator-control-ring';
  curatorControlRing.dataset.active = 'false';
  curatorControlRing.title = 'Move whole character';
  curatorControlRing.setAttribute('aria-label', 'Move whole character');

  const curatorControlRingCore = document.createElement('span');
  curatorControlRingCore.className = 'hud__curator-control-ring-core';
  curatorControlRing.append(curatorControlRingCore);

  const curatorPreviewHead = document.createElement('div');
  curatorPreviewHead.className = 'hud__curator-part hud__curator-part--head hud__curator-editable';
  curatorPreviewHead.dataset.target = 'head';

  const curatorPreviewMouth = document.createElement('div');
  curatorPreviewMouth.className = 'hud__curator-feature hud__curator-feature--mouth hud__curator-editable';
  curatorPreviewMouth.dataset.target = 'mouth';
  curatorPreviewHead.append(curatorPreviewMouth);

  const curatorPreviewTorso = document.createElement('div');
  curatorPreviewTorso.className = 'hud__curator-part hud__curator-part--torso hud__curator-editable';
  curatorPreviewTorso.dataset.target = 'torso';

  const curatorPreviewLeftArm = document.createElement('div');
  curatorPreviewLeftArm.className = 'hud__curator-part hud__curator-part--arm hud__curator-part--left-arm hud__curator-editable';
  curatorPreviewLeftArm.dataset.target = 'left-arm';

  const curatorPreviewRightArm = document.createElement('div');
  curatorPreviewRightArm.className = 'hud__curator-part hud__curator-part--arm hud__curator-part--right-arm hud__curator-editable';
  curatorPreviewRightArm.dataset.target = 'right-arm';

  const curatorPreviewLeftLeg = document.createElement('div');
  curatorPreviewLeftLeg.className = 'hud__curator-part hud__curator-part--leg hud__curator-part--left-leg hud__curator-editable';
  curatorPreviewLeftLeg.dataset.target = 'left-leg';

  const curatorPreviewRightLeg = document.createElement('div');
  curatorPreviewRightLeg.className = 'hud__curator-part hud__curator-part--leg hud__curator-part--right-leg hud__curator-editable';
  curatorPreviewRightLeg.dataset.target = 'right-leg';

  const curatorPreviewParts: Record<CuratorEditTargetId, HTMLDivElement> = {
    head: curatorPreviewHead,
    torso: curatorPreviewTorso,
    'left-arm': curatorPreviewLeftArm,
    'right-arm': curatorPreviewRightArm,
    'left-leg': curatorPreviewLeftLeg,
    'right-leg': curatorPreviewRightLeg,
    mouth: curatorPreviewMouth,
  };

  CURATOR_EDIT_TARGETS.forEach((target) => {
    const targetElement = curatorPreviewParts[target.id];
    const depthFace = document.createElement('span');
    depthFace.className = 'hud__curator-depth-face';
    targetElement.prepend(depthFace);

    if (target.id !== 'mouth') {
      ['right', 'left', 'top', 'bottom'].forEach((side) => {
        const sideFace = document.createElement('span');
        sideFace.className = `hud__curator-depth-side hud__curator-depth-side--${side}`;
        targetElement.append(sideFace);
      });

      const surface = document.createElement('span');
      surface.className = 'hud__curator-surface';
      targetElement.append(surface);

      const sideRim = document.createElement('span');
      sideRim.className = 'hud__curator-side-rim';
      targetElement.append(sideRim);
    }

    if (target.id === 'torso') {
      const chestPanel = document.createElement('span');
      chestPanel.className = 'hud__curator-chest-panel';
      targetElement.append(chestPanel);
    }

    if (target.id.includes('arm') || target.id.includes('leg')) {
      ['top', 'middle', 'bottom'].forEach((joint) => {
        const jointBand = document.createElement('span');
        jointBand.className = `hud__curator-joint hud__curator-joint--${joint}`;
        targetElement.append(jointBand);
      });
    }

    const bump = document.createElement('span');
    bump.className = 'hud__curator-bump';
    targetElement.append(bump);
    ['left', 'right', 'top', 'bottom', 'bump'].forEach((handle) => {
      const editHandle = document.createElement('span');
      editHandle.className = `hud__curator-edit-handle hud__curator-edit-handle--${handle}`;
      editHandle.dataset.handle = handle;
      editHandle.dataset.target = target.id;
      targetElement.append(editHandle);
    });
  });

  curatorPreviewCharacter.append(
    curatorPreviewLeftArm,
    curatorPreviewRightArm,
    curatorPreviewHead,
    curatorPreviewTorso,
    curatorPreviewLeftLeg,
    curatorPreviewRightLeg,
  );
  curatorPreviewStage.append(curatorControlRing, curatorPreviewCharacter);
  curatorPreview.append(curatorPreviewStage);

  const curatorCurrentSummary = document.createElement('p');
  curatorCurrentSummary.className = 'hud__curator-current-summary';
  curatorCurrentSummary.textContent = '';

  const curatorEditPanel = document.createElement('div');
  curatorEditPanel.className = 'hud__curator-edit-panel';

  const curatorSelectedTarget = document.createElement('p');
  curatorSelectedTarget.className = 'hud__curator-selected-target';
  curatorSelectedTarget.textContent = 'Editing: Head';

  const curatorWidthControl = createCuratorRangeControl('Width', 0.45, 2.05, 0.01);
  const curatorHeightControl = createCuratorRangeControl('Height', 0.45, 2.05, 0.01);
  const curatorDepthControl = createCuratorRangeControl('Depth', 0, 1, 0.01);
  const curatorBumpControl = createCuratorRangeControl('Bump', 0, 1, 0.01);

  const curatorResetShapeButton = document.createElement('button');
  curatorResetShapeButton.className = 'hud__curator-secondary hud__curator-reset-shape';
  curatorResetShapeButton.type = 'button';
  curatorResetShapeButton.textContent = 'Reset Part';

  const curatorRotateXControl = createCuratorRangeControl('Tilt X', -180, 180, 1);
  const curatorRotateYControl = createCuratorRangeControl('Spin Y', -180, 180, 1);
  const curatorRotateZControl = createCuratorRangeControl('Upside Down', -180, 180, 1);

  const curatorResetRotationButton = document.createElement('button');
  curatorResetRotationButton.className = 'hud__curator-secondary hud__curator-reset-rotation';
  curatorResetRotationButton.type = 'button';
  curatorResetRotationButton.textContent = 'Reset Rotation';

  const curatorShapeControls = document.createElement('div');
  curatorShapeControls.className = 'hud__curator-shape-controls';
  curatorShapeControls.append(
    curatorWidthControl.root,
    curatorHeightControl.root,
    curatorDepthControl.root,
    curatorBumpControl.root,
    curatorResetShapeButton,
  );

  const curatorRotationControls = document.createElement('div');
  curatorRotationControls.className = 'hud__curator-rotation-controls';
  curatorRotationControls.append(
    curatorRotateXControl.root,
    curatorRotateYControl.root,
    curatorRotateZControl.root,
    curatorResetRotationButton,
  );

  curatorEditPanel.append(curatorSelectedTarget, curatorShapeControls, curatorRotationControls);

  const curatorActions = document.createElement('div');
  curatorActions.className = 'hud__curator-actions';

  const curatorSaveButton = document.createElement('button');
  curatorSaveButton.className = 'hud__curator-primary';
  curatorSaveButton.type = 'button';
  curatorSaveButton.textContent = 'Save Character';

  const curatorCopyButton = document.createElement('button');
  curatorCopyButton.className = 'hud__curator-secondary';
  curatorCopyButton.type = 'button';
  curatorCopyButton.textContent = 'Copy Design Text';

  curatorActions.append(curatorSaveButton, curatorCopyButton);
  curatorPreviewPanel.append(curatorPreview, curatorCurrentSummary, curatorEditPanel, curatorActions);

  const curatorOptionsPanel = document.createElement('div');
  curatorOptionsPanel.className = 'hud__curator-options-panel';

  const curatorOptionsTitle = document.createElement('p');
  curatorOptionsTitle.className = 'hud__label';
  curatorOptionsTitle.textContent = 'Head Designs';

  const curatorOptions = document.createElement('div');
  curatorOptions.className = 'hud__curator-options';

  curatorOptionsPanel.append(curatorOptionsTitle, curatorOptions);

  const curatorSavedPanel = document.createElement('div');
  curatorSavedPanel.className = 'hud__curator-saved-panel';

  const curatorSavedTitle = document.createElement('p');
  curatorSavedTitle.className = 'hud__label';
  curatorSavedTitle.textContent = 'Saved Characters';

  const curatorSavedStatus = document.createElement('p');
  curatorSavedStatus.className = 'hud__curator-saved-status';
  curatorSavedStatus.textContent = 'No saved characters yet.';

  const curatorSavedList = document.createElement('div');
  curatorSavedList.className = 'hud__curator-saved-list';

  curatorSavedPanel.append(curatorSavedTitle, curatorSavedStatus, curatorSavedList);
  curatorLayout.append(curatorPreviewPanel, curatorOptionsPanel, curatorSavedPanel);

  curatorTool.append(
    curatorEyebrow,
    curatorTitle,
    curatorInstructions,
    curatorKindControls,
    curatorPaletteControls,
    curatorPartTabs,
    curatorLayout,
  );

  root.append(
    intro,
    jumpscare,
    officeDeathNotice,
    officePower,
    microphonePanel,
    compass,
    chapterFiveMonitor,
    chapterSevenDayCounter,
    chapterSevenCookieCounter,
    chapterSevenPhaseTimer,
    chapterSevenCookiePicker,
    chapterSevenTrading,
    chapterElevenSeedShop,
    chapterElevenEquipmentShop,
    chapterElevenSellMenu,
    chapterElevenAutoHarvestChest,
    crosshair,
    moneyPanel,
    meterPanel,
    statusPanel,
    crouchInstructions,
    hotbar,
    chapterElevenSeedHotbar,
    minecraftInventory,
    placementTool,
    microphoneTool,
    cameraTool,
    photoCameraPreview,
    photoCameraFlash,
    chapterMenu,
    curatorTool,
    officeJumpscareMenu,
    officeModeMenu,
  );
  host.replaceChildren(root);

  let officeJumpscareSelectHandler: ((jumpscareId: string) => void) | null = null;
  let officeModeSelectHandler: ((selectionId: string) => void) | null = null;
  let microphoneToggleHandler: (() => void) | null = null;
  let chapterFiveMonitorActionHandler: ((action: HudChapterFiveMonitorAction) => void) | null = null;
  let curatorSaveHandler: ((slotLabel: string, summary: string) => void) | null = null;
  let officeJumpscareOptionKey = '';
  let chapterFiveMonitorPlanetKey = '';
  let chapterFiveMonitorRows: Array<{ row: HTMLButtonElement; label: HTMLSpanElement; distance: HTMLSpanElement }> = [];
  let curatorActivePart: CuratorPartId = 'head';
  let curatorActiveEditTarget: CuratorEditTargetId = 'head';
  let curatorDesign = createDefaultCuratorDesign();
  let curatorSavedCharacters = loadCuratorCharacters();
  let curatorActiveSavedId: number | null = null;
  let curatorDragState: {
    mode: 'rotate' | 'resize' | 'ring' | 'move';
    pointerId: number;
    target: CuratorEditTargetId;
    handle: string;
    startX: number;
    startY: number;
    startShape: CuratorShapeState;
    startRotation: CuratorRotationState;
    startLift: number;
  } | null = null;

  const getCuratorShapeState = (target: CuratorEditTargetId): CuratorShapeState => ({
    ...createDefaultCuratorShape(),
    ...(curatorDesign.shapes[target] ?? {}),
  });

  const updateCuratorShapeState = (target: CuratorEditTargetId, shape: CuratorShapeState): void => {
    curatorDesign = {
      ...curatorDesign,
      shapes: {
        ...curatorDesign.shapes,
        [target]: shape,
      },
    };
    curatorActiveSavedId = null;
  };

  const setCuratorActiveEditTarget = (target: CuratorEditTargetId): void => {
    curatorActiveEditTarget = target;
    curatorActivePart = target;
  };

  const setCuratorActivePart = (part: CuratorPartId): void => {
    curatorActivePart = part;
    curatorActiveEditTarget = part === 'leg' ? 'left-leg' : part;
  };

  const setCuratorRotation = (rotation: CuratorRotationState): void => {
    curatorDesign = {
      ...curatorDesign,
      rotation: {
        x: clampCuratorNumber(rotation.x, -180, 180),
        y: clampCuratorNumber(rotation.y, -180, 180),
        z: clampCuratorNumber(rotation.z, -180, 180),
      },
    };
    curatorActiveSavedId = null;
  };

  const setCuratorLift = (lift: number): void => {
    curatorDesign = {
      ...curatorDesign,
      transform: {
        ...createDefaultCuratorDesign().transform,
        ...(curatorDesign.transform ?? {}),
        lift: clampCuratorNumber(lift, -1.6, 2.7),
      },
    };
    curatorActiveSavedId = null;
  };

  const applyCuratorShapeToElement = (target: CuratorEditTargetId, element: HTMLDivElement): void => {
    const shape = getCuratorShapeState(target);
    element.dataset.selected = String(target === curatorActiveEditTarget);
    element.style.setProperty('--edit-scale-x', shape.width.toFixed(3));
    element.style.setProperty('--edit-scale-y', shape.height.toFixed(3));
    element.style.setProperty('--edit-depth', shape.depth.toFixed(3));
    element.style.setProperty('--edit-bump', shape.bump.toFixed(3));
    element.style.setProperty('--edit-offset-x', `${shape.offsetX.toFixed(2)}rem`);
    element.style.setProperty('--edit-offset-y', `${shape.offsetY.toFixed(2)}rem`);
  };

  const updateCuratorRangeControl = (
    control: { input: HTMLInputElement; value: HTMLSpanElement },
    value: number,
    suffix = '',
  ): void => {
    control.input.value = String(value);
    control.value.textContent = `${Number(value).toFixed(suffix === 'deg' ? 0 : 2)}${suffix}`;
  };

  const updateCuratorEditControls = (): void => {
    const shape = getCuratorShapeState(curatorActiveEditTarget);
    curatorSelectedTarget.textContent = `Editing: ${getCuratorTargetLabel(curatorActiveEditTarget)}`;
    updateCuratorRangeControl(curatorWidthControl, shape.width);
    updateCuratorRangeControl(curatorHeightControl, shape.height);
    updateCuratorRangeControl(curatorDepthControl, shape.depth);
    updateCuratorRangeControl(curatorBumpControl, shape.bump);
    updateCuratorRangeControl(curatorRotateXControl, curatorDesign.rotation.x, 'deg');
    updateCuratorRangeControl(curatorRotateYControl, curatorDesign.rotation.y, 'deg');
    updateCuratorRangeControl(curatorRotateZControl, curatorDesign.rotation.z, 'deg');
  };

  const renderCuratorOptions = (): void => {
    const activePartDefinition = CURATOR_PARTS.find((part) => part.id === curatorActivePart) ?? CURATOR_PARTS[0];
    curatorOptionsTitle.textContent = `${activePartDefinition.label} Designs`;
    curatorPartButtons.forEach((part) => {
      part.button.dataset.active = String(part.id === curatorActivePart);
    });
    curatorOptions.replaceChildren(
      ...CURATOR_PART_OPTIONS[curatorActivePart].map((option) => {
        const optionButton = document.createElement('button');
        optionButton.className = 'hud__curator-option';
        optionButton.type = 'button';
        optionButton.dataset.active = String(curatorDesign.parts[curatorActivePart] === option.id);

        const optionTitle = document.createElement('span');
        optionTitle.className = 'hud__chapter-option-title';
        optionTitle.textContent = option.label;

        const optionBody = document.createElement('span');
        optionBody.className = 'hud__chapter-option-body';
        optionBody.textContent = option.body;

        optionButton.append(optionTitle, optionBody);
        optionButton.addEventListener('click', (event) => {
          event.stopPropagation();
          setCuratorActivePart(curatorActivePart);
          curatorDesign = {
            ...curatorDesign,
            parts: {
              ...curatorDesign.parts,
              [curatorActivePart]: option.id,
            },
          };
          curatorActiveSavedId = null;
          renderCurator();
        });
        return optionButton;
      }),
    );
  };

  const renderCuratorSavedList = (): void => {
    curatorSavedStatus.textContent = curatorSavedCharacters.length === 0
      ? 'No saved characters yet.'
      : `${curatorSavedCharacters.length} saved. Click one to reload its design.`;
    curatorSavedList.replaceChildren(
      ...curatorSavedCharacters.map((character) => {
        const savedButton = document.createElement('button');
        savedButton.className = 'hud__curator-saved-character';
        savedButton.type = 'button';
        savedButton.dataset.active = String(character.id === curatorActiveSavedId);

        const savedTitle = document.createElement('span');
        savedTitle.className = 'hud__chapter-option-title';
        savedTitle.textContent = character.label;

        const savedBody = document.createElement('span');
        savedBody.className = 'hud__chapter-option-body';
        savedBody.textContent = character.summary;

        savedButton.append(savedTitle, savedBody);
        savedButton.addEventListener('click', (event) => {
          event.stopPropagation();
          curatorDesign = cloneCuratorDesign(character.design);
          curatorActiveSavedId = character.id;
          renderCurator();
        });
        return savedButton;
      }),
    );
  };

  const renderCuratorPreview = (): void => {
    curatorPreview.dataset.kind = curatorDesign.kind;
    curatorPreview.dataset.palette = curatorDesign.palette;
    curatorPreview.dataset.leg = curatorDesign.parts.leg;
    curatorPreview.dataset.editing = curatorActiveEditTarget;
    const headShape = getCuratorShapeState('head');
    curatorPreviewHead.style.setProperty('--head-scale-x', headShape.width.toFixed(3));
    curatorPreviewHead.style.setProperty('--head-scale-y', headShape.height.toFixed(3));
    curatorPreviewStage.style.setProperty('--curator-lift', `${curatorDesign.transform.lift.toFixed(2)}rem`);
    curatorControlRing.style.setProperty('--curator-ring-lift', `${(curatorDesign.transform.lift * 0.18).toFixed(2)}rem`);
    curatorPreviewCharacter.style.setProperty('--curator-rotate-x', `${curatorDesign.rotation.x.toFixed(1)}deg`);
    curatorPreviewCharacter.style.setProperty('--curator-rotate-y', `${curatorDesign.rotation.y.toFixed(1)}deg`);
    curatorPreviewCharacter.style.setProperty('--curator-rotate-z', `${curatorDesign.rotation.z.toFixed(1)}deg`);
    curatorKindButtons.forEach((kind) => {
      kind.button.dataset.active = String(kind.id === curatorDesign.kind);
    });
    curatorPaletteButtons.forEach((palette) => {
      palette.button.dataset.active = String(palette.id === curatorDesign.palette);
    });
    CURATOR_PARTS.forEach((part) => {
      if (part.id === 'leg') {
        return;
      }
      curatorPreviewParts[part.id].dataset.design = curatorDesign.parts[part.id];
    });
    CURATOR_EDIT_TARGETS.forEach((target) => {
      applyCuratorShapeToElement(target.id, curatorPreviewParts[target.id]);
    });
    curatorCurrentSummary.textContent = formatCuratorDesignSummary('Current Design', curatorDesign);
    updateCuratorEditControls();
  };

  const renderCurator = (): void => {
    renderCuratorPreview();
    renderCuratorOptions();
    renderCuratorSavedList();
  };

  const copyCuratorDesignText = async (text: string): Promise<void> => {
    try {
      window.localStorage.setItem(CURATOR_LAST_DESIGN_KEY, text);
    } catch {
      // Clipboard copy can still work if local storage is unavailable.
    }

    try {
      await navigator.clipboard.writeText(text);
      curatorCopyButton.textContent = 'Copied';
      window.setTimeout(() => {
        curatorCopyButton.textContent = 'Copy Design Text';
      }, 1200);
    } catch {
      const fallback = document.createElement('textarea');
      fallback.value = text;
      fallback.style.position = 'fixed';
      fallback.style.left = '-9999px';
      document.body.append(fallback);
      fallback.select();
      document.execCommand('copy');
      fallback.remove();
      curatorCopyButton.textContent = 'Copied';
      window.setTimeout(() => {
        curatorCopyButton.textContent = 'Copy Design Text';
      }, 1200);
    }
  };

  const bindCuratorShapeControl = (
    control: { input: HTMLInputElement },
    key: keyof CuratorShapeState,
    min: number,
    max: number,
  ): void => {
    control.input.addEventListener('input', (event) => {
      event.stopPropagation();
      const shape = getCuratorShapeState(curatorActiveEditTarget);
      updateCuratorShapeState(curatorActiveEditTarget, {
        ...shape,
        [key]: clampCuratorNumber(Number(control.input.value), min, max),
      });
      renderCuratorPreview();
    });
  };

  bindCuratorShapeControl(curatorWidthControl, 'width', 0.45, 2.05);
  bindCuratorShapeControl(curatorHeightControl, 'height', 0.45, 2.05);
  bindCuratorShapeControl(curatorDepthControl, 'depth', 0, 1);
  bindCuratorShapeControl(curatorBumpControl, 'bump', 0, 1);

  const bindCuratorRotationControl = (
    control: { input: HTMLInputElement },
    key: keyof CuratorRotationState,
  ): void => {
    control.input.addEventListener('input', (event) => {
      event.stopPropagation();
      setCuratorRotation({
        ...curatorDesign.rotation,
        [key]: Number(control.input.value),
      });
      renderCuratorPreview();
    });
  };

  bindCuratorRotationControl(curatorRotateXControl, 'x');
  bindCuratorRotationControl(curatorRotateYControl, 'y');
  bindCuratorRotationControl(curatorRotateZControl, 'z');

  curatorResetShapeButton.addEventListener('click', (event) => {
    event.stopPropagation();
    updateCuratorShapeState(curatorActiveEditTarget, createDefaultCuratorShape());
    renderCuratorPreview();
  });

  curatorResetRotationButton.addEventListener('click', (event) => {
    event.stopPropagation();
    setCuratorRotation({ x: 0, y: 0, z: 0 });
    renderCuratorPreview();
  });

  const getCuratorTargetFromElement = (element: Element | null): CuratorEditTargetId | null => {
    const target = element?.closest<HTMLElement>('.hud__curator-editable')?.dataset.target;
    if (!target) {
      return null;
    }
    return CURATOR_EDIT_TARGETS.some((entry) => entry.id === target)
      ? target as CuratorEditTargetId
      : null;
  };

  curatorPreview.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) {
      return;
    }

    const targetElement = event.target instanceof Element ? event.target : null;
    const ringElement = targetElement?.closest<HTMLElement>('.hud__curator-control-ring');
    if (ringElement) {
      event.preventDefault();
      event.stopPropagation();
      curatorDragState = {
        mode: 'ring',
        pointerId: event.pointerId,
        target: curatorActiveEditTarget,
        handle: 'ring',
        startX: event.clientX,
        startY: event.clientY,
        startShape: getCuratorShapeState(curatorActiveEditTarget),
        startRotation: { ...curatorDesign.rotation },
        startLift: curatorDesign.transform.lift,
      };
      curatorControlRing.dataset.active = 'true';
      curatorPreview.setPointerCapture(event.pointerId);
      return;
    }

    const handleElement = targetElement?.closest<HTMLElement>('.hud__curator-edit-handle');
    if (handleElement) {
      const target = handleElement.dataset.target as CuratorEditTargetId | undefined;
      if (!target || !CURATOR_EDIT_TARGETS.some((entry) => entry.id === target)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setCuratorActiveEditTarget(target);
      curatorDragState = {
        mode: 'resize',
        pointerId: event.pointerId,
        target,
        handle: handleElement.dataset.handle ?? 'right',
        startX: event.clientX,
        startY: event.clientY,
        startShape: getCuratorShapeState(target),
        startRotation: { ...curatorDesign.rotation },
        startLift: curatorDesign.transform.lift,
      };
      curatorPreview.setPointerCapture(event.pointerId);
      renderCurator();
      return;
    }

    const selectedTarget = getCuratorTargetFromElement(targetElement);
    if (selectedTarget) {
      event.preventDefault();
      event.stopPropagation();
      setCuratorActiveEditTarget(selectedTarget);
      curatorDragState = {
        mode: 'move',
        pointerId: event.pointerId,
        target: selectedTarget,
        handle: 'move',
        startX: event.clientX,
        startY: event.clientY,
        startShape: getCuratorShapeState(selectedTarget),
        startRotation: { ...curatorDesign.rotation },
        startLift: curatorDesign.transform.lift,
      };
      curatorPreview.setPointerCapture(event.pointerId);
      renderCurator();
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    curatorDragState = {
      mode: 'rotate',
      pointerId: event.pointerId,
      target: curatorActiveEditTarget,
      handle: '',
      startX: event.clientX,
      startY: event.clientY,
      startShape: getCuratorShapeState(curatorActiveEditTarget),
      startRotation: { ...curatorDesign.rotation },
      startLift: curatorDesign.transform.lift,
    };
    curatorPreview.setPointerCapture(event.pointerId);
  });

  curatorPreview.addEventListener('pointermove', (event) => {
    if (!curatorDragState || curatorDragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const dx = event.clientX - curatorDragState.startX;
    const dy = event.clientY - curatorDragState.startY;
    if (curatorDragState.mode === 'rotate') {
      setCuratorRotation({
        x: curatorDragState.startRotation.x - dy * 0.45,
        y: curatorDragState.startRotation.y + dx * 0.45,
        z: curatorDragState.startRotation.z + (event.shiftKey ? dx * 0.35 : 0),
      });
      renderCuratorPreview();
      return;
    }

    if (curatorDragState.mode === 'ring') {
      setCuratorLift(curatorDragState.startLift - dy * 0.025);
      setCuratorRotation({
        ...curatorDragState.startRotation,
        y: curatorDragState.startRotation.y + dx * 0.62,
      });
      renderCuratorPreview();
      return;
    }

    if (curatorDragState.mode === 'move') {
      const startShape = curatorDragState.startShape;
      const offsetLimit = curatorDragState.target === 'mouth' ? 1.65 : 2.4;
      updateCuratorShapeState(curatorDragState.target, {
        ...startShape,
        offsetX: clampCuratorNumber(startShape.offsetX + dx * 0.012, -offsetLimit, offsetLimit),
        offsetY: clampCuratorNumber(startShape.offsetY + dy * 0.012, -offsetLimit, offsetLimit),
      });
      renderCuratorPreview();
      return;
    }

    const startShape = curatorDragState.startShape;
    const nextShape = { ...startShape };
    if (curatorDragState.handle === 'left') {
      nextShape.width = clampCuratorNumber(startShape.width - dx * 0.015, 0.45, 2.05);
      nextShape.offsetX = clampCuratorNumber(startShape.offsetX + dx * 0.012, -1.2, 1.2);
    } else if (curatorDragState.handle === 'right') {
      nextShape.width = clampCuratorNumber(startShape.width + dx * 0.015, 0.45, 2.05);
      nextShape.offsetX = clampCuratorNumber(startShape.offsetX + dx * 0.012, -1.2, 1.2);
    } else if (curatorDragState.handle === 'top') {
      nextShape.height = clampCuratorNumber(startShape.height - dy * 0.015, 0.45, 2.05);
      nextShape.offsetY = clampCuratorNumber(startShape.offsetY + dy * 0.012, -1.2, 1.2);
    } else if (curatorDragState.handle === 'bottom') {
      nextShape.height = clampCuratorNumber(startShape.height + dy * 0.015, 0.45, 2.05);
      nextShape.offsetY = clampCuratorNumber(startShape.offsetY + dy * 0.012, -1.2, 1.2);
    } else if (curatorDragState.handle === 'bump') {
      nextShape.bump = clampCuratorNumber(startShape.bump - dy * 0.018 + Math.abs(dx) * 0.004, 0, 1);
      nextShape.depth = clampCuratorNumber(startShape.depth - dy * 0.01, 0, 1);
    }

    updateCuratorShapeState(curatorDragState.target, nextShape);
    renderCuratorPreview();
  });

  const stopCuratorDrag = (event: PointerEvent): void => {
    if (!curatorDragState || curatorDragState.pointerId !== event.pointerId) {
      return;
    }

    curatorPreview.releasePointerCapture(event.pointerId);
    curatorControlRing.dataset.active = 'false';
    curatorDragState = null;
  };

  curatorPreview.addEventListener('pointerup', stopCuratorDrag);
  curatorPreview.addEventListener('pointercancel', stopCuratorDrag);

  curatorKindButtons.forEach((kind) => {
    kind.button.addEventListener('click', (event) => {
      event.stopPropagation();
      curatorDesign = { ...curatorDesign, kind: kind.id };
      curatorActiveSavedId = null;
      renderCurator();
    });
  });

  curatorPaletteButtons.forEach((palette) => {
    palette.button.addEventListener('click', (event) => {
      event.stopPropagation();
      curatorDesign = { ...curatorDesign, palette: palette.id };
      curatorActiveSavedId = null;
      renderCurator();
    });
  });

  curatorPartButtons.forEach((part) => {
    part.button.addEventListener('click', (event) => {
      event.stopPropagation();
      setCuratorActivePart(part.id);
      renderCurator();
    });
  });

  curatorSaveButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const nextId = curatorSavedCharacters.reduce((highest, character) => Math.max(highest, character.id), 0) + 1;
    const label = formatCuratorSlotLabel(nextId);
    const design = cloneCuratorDesign(curatorDesign);
    const summary = formatCuratorDesignSummary(label, design);
    const savedCharacter: SavedCuratorCharacter = {
      id: nextId,
      label,
      savedAt: new Date().toISOString(),
      design,
      summary,
    };
    curatorSavedCharacters = [...curatorSavedCharacters, savedCharacter];
    curatorActiveSavedId = nextId;
    saveCuratorCharacters(curatorSavedCharacters);
    void copyCuratorDesignText(summary);
    curatorSaveHandler?.(label, summary);
    renderCurator();
    curatorSavedStatus.textContent = `${label} saved. Tell Codex this slot name when you want it used.`;
  });

  curatorCopyButton.addEventListener('click', (event) => {
    event.stopPropagation();
    void copyCuratorDesignText(formatCuratorDesignSummary('Current Design', curatorDesign));
  });

  renderCurator();

  const applyMinecraftSlotView = (slot: HTMLElement, value: MinecraftInventorySlotView | undefined): void => {
    slot.dataset.filled = String(Boolean(value?.filled));
    slot.dataset.selected = String(Boolean(value?.selected));
    slot.dataset.item = value?.filled && value.type ? value.type : '';
    slot.textContent = value?.filled
      ? `${value.label}${value.count > 1 ? ` x${value.count}` : ''}`
      : '';
  };

  return {
    onEngage(handler): void {
      button.addEventListener('click', handler);
    },
    onChapterSelect(handler): void {
      featuredChapterButton.addEventListener('click', () => handler('chapter-8'));
      chapterButtons.forEach((entry) => {
        entry.button.addEventListener('click', () => handler(entry.id));
      });
    },
    onOfficeJumpscareSelect(handler): void {
      officeJumpscareSelectHandler = handler;
    },
    onOfficeModeSelect(handler): void {
      officeModeSelectHandler = handler;
      officeModeButtons.forEach((entry) => {
        entry.button.addEventListener('click', (event) => {
          event.stopPropagation();
          officeModeSelectHandler?.(entry.id);
        });
      });
      officeDifficultyButtons.forEach((entry) => {
        entry.button.addEventListener('click', (event) => {
          event.stopPropagation();
          officeModeSelectHandler?.(entry.id);
        });
      });
    },
    onMicrophoneToggle(handler): void {
      microphoneToggleHandler = handler;
      microphoneToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        microphoneToggleHandler?.();
      });
    },
    onMinecraftInventoryAction(handler): void {
      minecraftInventoryActionHandler = handler;
    },
    onChapterFiveMonitorAction(handler): void {
      chapterFiveMonitorActionHandler = handler;
      chapterFiveAutopilotButton.addEventListener('click', (event) => {
        event.stopPropagation();
        chapterFiveMonitorActionHandler?.({ type: 'toggle-autopilot' });
      });
      chapterFiveEngineButton.addEventListener('click', (event) => {
        event.stopPropagation();
        chapterFiveMonitorActionHandler?.({ type: 'toggle-engine' });
      });
      chapterFiveRadarButton.addEventListener('click', (event) => {
        event.stopPropagation();
        chapterFiveMonitorActionHandler?.({ type: 'toggle-radar' });
      });
      chapterFiveLandingButton.addEventListener('click', (event) => {
        event.stopPropagation();
        chapterFiveMonitorActionHandler?.({ type: 'landing-sequence' });
      });
      chapterFiveEscapeOrbitButton.addEventListener('click', (event) => {
        event.stopPropagation();
        chapterFiveMonitorActionHandler?.({ type: 'escape-orbit' });
      });
      chapterFiveLaunchButton.addEventListener('click', (event) => {
        event.stopPropagation();
        chapterFiveMonitorActionHandler?.({ type: 'launch-sequence' });
      });
      chapterFiveLightSpeedDial.addEventListener('input', (event) => {
        event.stopPropagation();
        chapterFiveMonitorActionHandler?.({
          type: 'set-light-speed',
          value: Number(chapterFiveLightSpeedDial.value),
        });
      });
    },
    onChapterSevenCookieTargetSelect(handler): void {
      chapterSevenCookieTargetSelectHandler = handler;
    },
    onChapterSevenGrandpaTrade(handler): void {
      chapterSevenGrandpaTradeHandler = handler;
    },
    onChapterElevenSeedPurchase(handler): void {
      chapterElevenSeedPurchaseHandler = handler;
    },
    onChapterElevenTraderPetEggPurchase(handler): void {
      chapterElevenTraderPetEggPurchaseHandler = handler;
    },
    onChapterElevenEquipmentPurchase(handler): void {
      chapterElevenEquipmentPurchaseHandler = handler;
    },
    onChapterElevenSellAction(handler): void {
      chapterElevenSellActionHandler = handler;
    },
    onChapterElevenChestAction(handler): void {
      chapterElevenChestActionHandler = handler;
    },
    onCuratorSave(handler): void {
      curatorSaveHandler = handler;
    },
    setTheme(theme): void {
      root.dataset.theme = theme;
    },
    setCrosshairMode(mode): void {
      root.dataset.crosshair = mode;
    },
    setThreatEye(intensity): void {
      const clampedIntensity = Math.max(0, Math.min(1, intensity));
      threatEye.dataset.active = String(clampedIntensity > 0.02);
      root.style.setProperty('--threat-eye-intensity', clampedIntensity.toFixed(3));
    },
    setFlashlight(enabled): void {
      flashlightText.textContent = `Flashlight: ${enabled ? 'on' : 'off'} / toggle with F`;
    },
    setLocked(locked): void {
      root.dataset.locked = String(locked);

      if (!locked) {
        statusText.textContent = 'Pointer unlocked. Click anywhere on the play space to jump back in.';
      }
    },
    setIntro(nextEyebrow, nextTitle, nextSummary, nextButtonText): void {
      eyebrow.textContent = nextEyebrow;
      title.textContent = nextTitle;
      summary.textContent = nextSummary;
      button.textContent = nextButtonText;
    },
    setObjective(): void {},
    setStoryNotice(text, active, label = 'Chapter Shift'): void {
      storyNotice.dataset.active = String(active && text.length > 0);
      storyNoticeLabel.textContent = label;
      storyNoticeText.textContent = text;
    },
    setChapterCard(active, title, body): void {
      chapterCard.dataset.active = String(active);
      chapterTitle.textContent = title;
      chapterBody.textContent = body;
    },
    setChapterLabel(text): void {
      chapterText.textContent = text;
    },
    setChapterSevenDayCounter(active, day): void {
      chapterSevenDayCounter.dataset.active = String(active);
      chapterSevenDayValue.textContent = `Day ${Math.max(1, Math.floor(day))}`;
    },
    setChapterSevenCookieCounter(active, cookies, target): void {
      chapterSevenCookieCounter.dataset.active = String(active);
      chapterSevenCookieValue.textContent = `${Math.max(0, Math.floor(cookies))} / ${Math.max(1, Math.floor(target))}`;
    },
    setChapterSevenCookiePicker(active, currentTarget): void {
      chapterSevenCookiePicker.dataset.active = String(active);
      chapterSevenCookieTargetButtons.forEach((button) => {
        button.dataset.selected = String(Number(button.dataset.target) === Math.floor(currentTarget));
      });
    },
    setChapterSevenTrading(active, cookies, trades): void {
      chapterSevenTrading.dataset.active = String(active);
      const safeCookies = Math.max(0, Math.floor(cookies));
      chapterSevenTradingCookies.textContent = `Cookies: ${safeCookies}`;
      chapterSevenTradingOptions.replaceChildren(...trades.map((trade) => {
        const button = document.createElement('button');
        button.className = 'hud__chapter-seven-trade';
        button.type = 'button';
        button.disabled = !trade.enabled;
        button.dataset.trade = trade.id;
        const title = document.createElement('span');
        title.className = 'hud__chapter-seven-trade-title';
        title.textContent = `${trade.cost} cookies for ${trade.label}`;
        const description = document.createElement('span');
        description.className = 'hud__chapter-seven-trade-description';
        const missingCookies = Math.max(0, trade.cost - safeCookies);
        description.textContent = trade.ownedLabel
          ?? (trade.enabled
            ? `Available - ${trade.description}`
            : `Need ${missingCookies} more ${missingCookies === 1 ? 'cookie' : 'cookies'} - ${trade.description}`);
        button.append(title, description);
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          chapterSevenGrandpaTradeHandler?.(trade.id);
        });
        return button;
      }));
    },
    setChapterElevenSeedShop(active, money, items): void {
      chapterElevenSeedShop.dataset.active = String(active);
      const safeMoney = Math.max(0, Math.floor(money));
      chapterElevenSeedShopMoney.textContent = `Money: $${safeMoney}`;
      const rows: HTMLElement[] = [];
      let currentSection: ChapterElevenSeedShopItemView['section'] | null = null;
      const sectionLabels: Record<ChapterElevenSeedShopItemView['section'], string> = {
        cheap: 'Cheap seeds',
        expensive: 'Expensive seeds',
        eggs: 'Pet eggs',
      };
      items.forEach((item) => {
        if (item.section !== currentSection) {
          currentSection = item.section;
          const heading = document.createElement('p');
          heading.className = 'hud__chapter-eleven-seed-section';
          heading.textContent = sectionLabels[item.section];
          rows.push(heading);
        }

        const button = document.createElement('button');
        button.className = 'hud__chapter-seven-trade';
        button.type = 'button';
        button.disabled = !item.enabled;
        if (item.kind === 'egg') {
          button.dataset.petEgg = item.id;
        } else {
          button.dataset.seed = item.id;
        }
        const title = document.createElement('span');
        title.className = 'hud__chapter-seven-trade-title';
        title.textContent = `${item.label} $${item.cost}`;
        const description = document.createElement('span');
        description.className = 'hud__chapter-seven-trade-description';
        const stockText = typeof item.stock === 'number' ? `Stock: ${item.stock}` : 'Available';
        const restockText = typeof item.restockSeconds === 'number' && item.restockSeconds > 0
          ? ` / restocks in ${Math.ceil(item.restockSeconds)}s`
          : '';
        description.textContent = item.enabled
          ? `${stockText}${restockText}`
          : typeof item.stock === 'number' && item.stock <= 0
            ? `Sold out${restockText}`
            : `Need $${Math.max(0, item.cost - safeMoney)} more${restockText}`;
        button.append(title, description);
        let purchaseHandled = false;
        const handlePurchasePointer = (event: Event): void => {
          event.preventDefault();
          event.stopPropagation();
          if (purchaseHandled || button.disabled) {
            return;
          }

          purchaseHandled = true;
          if (item.kind === 'egg') {
            chapterElevenTraderPetEggPurchaseHandler?.();
          } else {
            chapterElevenSeedPurchaseHandler?.(item.id);
          }
        };
        button.addEventListener('pointerdown', handlePurchasePointer);
        button.addEventListener('mousedown', handlePurchasePointer);
        button.addEventListener('touchstart', handlePurchasePointer, { passive: false });
        button.addEventListener('click', handlePurchasePointer);
        rows.push(button);
      });
      chapterElevenSeedShopOptions.replaceChildren(...rows);
    },
    setChapterElevenEquipmentShop(active, money, items): void {
      chapterElevenEquipmentShop.dataset.active = String(active);
      const safeMoney = Math.max(0, Math.floor(money));
      chapterElevenEquipmentShopMoney.textContent = `Money: $${safeMoney}`;
      const rows = items.map((item) => {
        const button = document.createElement('button');
        button.className = 'hud__chapter-seven-trade';
        button.type = 'button';
        button.disabled = !item.enabled;
        button.dataset.equipment = item.id;
        const title = document.createElement('span');
        title.className = 'hud__chapter-seven-trade-title';
        title.textContent = `${item.label} $${item.cost}`;
        const description = document.createElement('span');
        description.className = 'hud__chapter-seven-trade-description';
        const stockText = typeof item.stock === 'number' ? `Stock: ${item.stock}` : 'Available';
        const restockText = typeof item.restockSeconds === 'number' && item.restockSeconds > 0
          ? ` / restocks in ${Math.ceil(item.restockSeconds)}s`
          : '';
        description.textContent = item.enabled
          ? `${stockText}${restockText} / ${item.description}`
          : typeof item.stock === 'number' && item.stock <= 0
            ? `Sold out${restockText} / ${item.description}`
            : `Need $${Math.max(0, item.cost - safeMoney)} more${restockText} / ${item.description}`;
        button.append(title, description);
        let purchaseHandled = false;
        const handlePurchasePointer = (event: Event): void => {
          event.preventDefault();
          event.stopPropagation();
          if (purchaseHandled || button.disabled) {
            return;
          }

          purchaseHandled = true;
          chapterElevenEquipmentPurchaseHandler?.(item.id);
        };
        button.addEventListener('pointerdown', handlePurchasePointer);
        button.addEventListener('mousedown', handlePurchasePointer);
        button.addEventListener('touchstart', handlePurchasePointer, { passive: false });
        button.addEventListener('click', handlePurchasePointer);
        return button;
      });
      chapterElevenEquipmentShopOptions.replaceChildren(...rows);
    },
    setChapterElevenSellMenu(active, money, items, choosing, selectedIds): void {
      chapterElevenSellMenu.dataset.active = String(active);
      const safeMoney = Math.max(0, Math.floor(money));
      const selectedSet = new Set(selectedIds);
      const selectedTotal = items.reduce((sum, item) => (
        selectedSet.has(item.id) ? sum + item.value * item.count : sum
      ), 0);
      chapterElevenSellMoney.textContent = `Money: $${safeMoney}${selectedTotal > 0 ? ` / Selected: $${selectedTotal}` : ''}`;

      const makeActionButton = (label: string, description: string, action: ChapterElevenSellAction, disabled = false): HTMLButtonElement => {
        const button = document.createElement('button');
        button.className = 'hud__chapter-seven-trade';
        button.type = 'button';
        button.disabled = disabled;
        const title = document.createElement('span');
        title.className = 'hud__chapter-seven-trade-title';
        title.textContent = label;
        const body = document.createElement('span');
        body.className = 'hud__chapter-seven-trade-description';
        body.textContent = description;
        button.append(title, body);
        let actionHandled = false;
        const handleActionPointer = (event: Event): void => {
          event.preventDefault();
          event.stopPropagation();
          if (actionHandled || button.disabled) {
            return;
          }

          actionHandled = true;
          chapterElevenSellActionHandler?.(action);
        };
        button.addEventListener('pointerdown', handleActionPointer);
        button.addEventListener('mousedown', handleActionPointer);
        button.addEventListener('touchstart', handleActionPointer, { passive: false });
        button.addEventListener('click', handleActionPointer);
        return button;
      };

      const rows: HTMLElement[] = [
        makeActionButton('Sell all', 'Sell every harvested fruit, vegetable, and grown plant in your inventory.', { type: 'sell-all' }, items.length === 0),
        makeActionButton('Choose plants', 'Pick certain plants from your inventory before selling.', { type: 'choose-plants' }, items.length === 0),
      ];

      if (choosing) {
        const heading = document.createElement('p');
        heading.className = 'hud__chapter-eleven-seed-section';
        heading.textContent = 'Pick plants';
        rows.push(heading);

        if (items.length === 0) {
          const empty = document.createElement('p');
          empty.className = 'hud__chapter-seven-trade-description';
          empty.textContent = 'No harvested plants are in your inventory yet.';
          rows.push(empty);
        } else {
          items.forEach((item) => {
            const selected = selectedSet.has(item.id);
            const button = makeActionButton(
              `${item.label} x${item.count}`,
              `$${item.value} each / ${selected ? 'Selected' : 'Click to select'}`,
              { type: 'toggle-crop', cropId: item.id },
            );
            button.dataset.selected = String(selected);
            rows.push(button);
          });
        }

        rows.push(makeActionButton('Sell', 'Sell only the green selected plants.', { type: 'sell-selected' }, selectedTotal <= 0));
      }

      chapterElevenSellOptions.replaceChildren(...rows);
    },
    setChapterElevenAutoHarvestChest(active, chestItems, inventorySlots): void {
      chapterElevenAutoHarvestChest.dataset.active = String(active);
      chapterElevenAutoHarvestChestHint.textContent = chestItems.length > 0
        ? 'Click a chest item to move it into your inventory.'
        : 'The chest is empty. Auto Harvesters will drop crops here.';
      const rows: HTMLElement[] = chestItems.length > 0
        ? chestItems.map((item) => {
          const button = document.createElement('button');
          button.className = 'hud__chapter-seven-trade';
          button.type = 'button';
          button.dataset.crop = item.id;
          const title = document.createElement('span');
          title.className = 'hud__chapter-seven-trade-title';
          title.textContent = `${item.label} x${item.count}`;
          const description = document.createElement('span');
          description.className = 'hud__chapter-seven-trade-description';
          description.textContent = 'Click to move this stack to inventory.';
          button.append(title, description);
          let handled = false;
          const handleTransfer = (event: Event): void => {
            event.preventDefault();
            event.stopPropagation();
            if (handled) {
              return;
            }

            handled = true;
            chapterElevenChestActionHandler?.(item.id);
          };
          button.addEventListener('pointerdown', handleTransfer);
          button.addEventListener('mousedown', handleTransfer);
          button.addEventListener('touchstart', handleTransfer, { passive: false });
          button.addEventListener('click', handleTransfer);
          return button;
        })
        : [(() => {
          const empty = document.createElement('p');
          empty.className = 'hud__chapter-seven-trade-description hud__chapter-eleven-chest-empty';
          empty.textContent = 'No crops stored yet.';
          return empty;
        })()];
      chapterElevenAutoHarvestChestOptions.replaceChildren(...rows);
      chapterElevenAutoHarvestInventorySlots.forEach((slot, index) => {
        const value = inventorySlots[index];
        slot.root.dataset.filled = String(Boolean(value?.filled));
        slot.root.dataset.selected = String(Boolean(value?.selected));
        slot.root.dataset.item = value?.filled && value.type ? value.type : '';
        slot.valueText.textContent = value?.label ?? 'Empty';
        slot.countText.textContent = `x${value?.filled ? value.count : 0}`;
      });
    },
    setMoney(value): void {
      moneyValue.textContent = `$${Math.max(0, Math.floor(value))}`;
    },
    setChapterSevenPhaseTimer(active, phase, secondsLeft, urgent): void {
      const safeSeconds = Math.max(0, Math.ceil(secondsLeft));
      const minutes = Math.floor(safeSeconds / 60);
      const seconds = safeSeconds % 60;
      chapterSevenPhaseTimer.dataset.active = String(active);
      chapterSevenPhaseTimer.dataset.phase = phase;
      chapterSevenPhaseTimer.dataset.urgent = String(urgent);
      chapterSevenPhaseLabel.textContent = phase === 'day' ? 'Day' : 'Night';
      chapterSevenPhaseValue.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
    setChapterMenu(active, currentChapter): void {
      chapterMenu.dataset.active = String(active);
      chapterButtons.forEach((entry) => {
        entry.button.dataset.active = String(entry.id === currentChapter);
      });
      featuredChapterButton.dataset.active = String(currentChapter === 'chapter-8');
      if (active) {
        chapterMenu.scrollTop = 0;
      }
    },
    setCompass(active, headingDegrees): void {
      const normalizedHeading = ((headingDegrees % 360) + 360) % 360;
      compass.dataset.active = String(active);
      compass.style.setProperty('--compass-heading', `${(-normalizedHeading).toFixed(1)}deg`);
      compassHeading.textContent = `${getCompassDirection(normalizedHeading)} ${Math.round(normalizedHeading).toString().padStart(3, '0')}°`;
    },
    setChapterFiveMonitor(active, state): void {
      chapterFiveMonitor.dataset.active = String(active);
      chapterFiveMonitor.dataset.alarm = String(state.arrivalAlarmActive);
      chapterFiveMonitorStatus.textContent = [
        `Light speed: ${state.lightSpeed}/10`,
        `Engines: ${state.engineOn ? 'ON' : 'OFF'}`,
        `Mode: ${state.navigationMode === 'autopilot' ? 'AUTOPILOT' : 'CRUISE'}`,
        `Radar: ${state.radarActive ? 'ONLINE' : 'OFFLINE'}`,
        `Destination: ${state.destinationActive ? state.destinationLabel : 'NONE'}`,
        state.arrivalAlarmActive
          ? 'ARRIVAL ALARM'
          : state.landed
            ? 'Landed'
          : state.landingSequence
            ? 'Landing sequence active'
            : state.orbiting
              ? 'Orbit established'
              : 'Navigation ready',
      ].join(' | ');
      chapterFiveAutopilotButton.dataset.active = String(state.navigationMode === 'autopilot');
      chapterFiveAutopilotButton.textContent = state.navigationMode === 'autopilot' ? 'Autopilot On' : 'Autopilot Off';
      chapterFiveEngineButton.dataset.active = String(state.engineOn);
      chapterFiveEngineButton.textContent = state.engineOn ? 'Engines On' : 'Engines Off';
      chapterFiveRadarButton.dataset.active = String(state.radarActive);
      chapterFiveRadarButton.textContent = state.radarActive ? 'Radar On' : 'Radar Off';
      chapterFiveLandingButton.hidden = !state.orbiting || state.landed || state.landingSequence;
      chapterFiveLandingButton.dataset.active = String(state.landingSequence);
      chapterFiveLandingButton.textContent = state.landingSequence ? 'Landing Active' : 'Landing Sequence';
      chapterFiveEscapeOrbitButton.hidden = !state.orbiting || state.landed || state.landingSequence;
      chapterFiveLaunchButton.hidden = !state.landed;
      chapterFiveLightSpeedDial.value = String(state.lightSpeed);
      chapterFiveLightSpeedValue.textContent = `${state.lightSpeed}/10`;

      const nextPlanetKey = state.planets.map((planet) => planet.label).join('|');
      if (nextPlanetKey !== chapterFiveMonitorPlanetKey) {
        chapterFiveMonitorPlanetKey = nextPlanetKey;
        chapterFiveMonitorRows = state.planets.map((_planet, index) => {
          const row = document.createElement('button');
          row.className = 'hud__chapter-five-monitor-row';
          row.type = 'button';
          row.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            chapterFiveMonitorActionHandler?.({ type: 'select-planet', index });
          });

          const label = document.createElement('span');
          const distance = document.createElement('span');
          row.append(label, distance);
          return { row, label, distance };
        });
        chapterFiveMonitorPlanets.replaceChildren(...chapterFiveMonitorRows.map((entry) => entry.row));
      }

      state.planets.forEach((planet, index) => {
        const entry = chapterFiveMonitorRows[index];
        if (!entry) {
          return;
        }
        entry.row.dataset.destination = String(planet.destination);
        entry.label.textContent = planet.destination ? `> ${planet.label}` : planet.label;
        entry.distance.textContent = `${planet.miles.toLocaleString()} miles`;
      });
    },
    setOfficeJumpscareMenu(active, options): void {
      officeJumpscareMenu.dataset.active = String(active);
      const nextOptionKey = options.map((option) => `${option.id}:${option.label}:${option.body}`).join('|');
      if (officeJumpscareOptionKey !== nextOptionKey) {
        officeJumpscareOptionKey = nextOptionKey;
        officeJumpscareList.replaceChildren(
          ...options.map((option) => {
            const button = document.createElement('button');
            button.className = 'hud__office-jumpscare-option';
            button.type = 'button';

            const label = document.createElement('span');
            label.className = 'hud__chapter-option-title';
            label.textContent = option.label;

            const body = document.createElement('span');
            body.className = 'hud__chapter-option-body';
            body.textContent = option.body;

            button.append(label, body);
            button.addEventListener('click', (event) => {
              event.stopPropagation();
              officeJumpscareSelectHandler?.(option.id);
            });
            return button;
          }),
        );
      }
    },
    setCuratorTool(active): void {
      const wasActive = curatorTool.dataset.active === 'true';
      curatorTool.dataset.active = String(active);
      if (active && !wasActive) {
        curatorTool.scrollTop = 0;
        renderCurator();
      }
    },
    setOfficeModeMenu(active, step, pendingMode, activeMode, activeDifficulty): void {
      officeModeMenu.dataset.active = String(active);
      officeModeMenu.dataset.step = step;
      officeModeTitle.textContent = step === 'mode'
        ? 'Choose A Mode'
        : `Choose ${getOfficeModeLabel(pendingMode ?? activeMode)} Difficulty`;
      officeModeSummary.textContent = step === 'mode'
        ? 'Pick a Chapter 3 lighting and animatronic mode. Night and Game modes ask for difficulty next.'
        : 'Easy, Normal, or Hard changes animatronic sight, speed, power drain, and hard-mode vent danger.';
      officeModeActiveLine.textContent = `Current: ${getOfficeModeLabel(activeMode)} / ${activeMode === 'creator' ? 'No difficulty' : getOfficeDifficultyLabel(activeDifficulty)}`;
      officeModeButtons.forEach((entry) => {
        entry.button.dataset.active = String(entry.mode === activeMode);
      });
      officeDifficultyButtons.forEach((entry) => {
        entry.button.dataset.active = String(entry.difficulty === activeDifficulty);
      });
    },
    setPlacementTool(active, body, copyText = ''): void {
      placementTool.dataset.active = String(active);
      placementToolText.textContent = body;
      placementToolCopyText = copyText;
      placementCopyButton.disabled = copyText.length === 0;
      placementCopyButton.textContent = copyText.length > 0 ? 'Save Coordinates' : 'No Coordinate To Save';
    },
    toggleHelperPanels(): void {
      setHelperPanelsHidden(!helperPanelsHidden);
    },
    setStatus(text): void {
      statusText.textContent = text;
    },
    setInventory(text): void {
      inventoryText.hidden = text.length === 0;
      inventoryText.textContent = text;
    },
    setMinecraftInventory(active, state): void {
      minecraftInventory.dataset.active = String(active);
      minecraftInventorySlots.forEach((slot, index) => applyMinecraftSlotView(slot, state.inventory[index]));
      minecraftHotbarSlots.forEach((slot, index) => applyMinecraftSlotView(slot, state.hotbar[index]));
      minecraftCraftSlots.forEach((slot, index) => applyMinecraftSlotView(slot, state.craft[index]));
      applyMinecraftSlotView(minecraftResultSlot, state.result);
      minecraftCursor.textContent = state.cursor.filled
        ? `Cursor: ${state.cursor.label}${state.cursor.count > 1 ? ` x${state.cursor.count}` : ''}`
        : 'Cursor: empty';
    },
    setOfficePower(active, powerRatio, powerOut, nightText = '', timeText = '', powerState = 'normal'): void {
      const clampedRatio = Math.max(0, Math.min(1, powerRatio));
      const needsReboot = powerState === 'reboot';
      officePower.dataset.active = String(active);
      officePower.dataset.level = powerOut || needsReboot || clampedRatio <= 0.1
        ? 'red'
        : clampedRatio <= 0.5
          ? 'orange'
          : 'green';
      officePower.style.setProperty('--office-power-ratio', clampedRatio.toFixed(3));
      officePowerValue.textContent = powerOut
        ? 'OUT'
        : needsReboot
          ? 'REBOOT'
        : `${Math.ceil(clampedRatio * 100)}%`;
      officePowerNight.textContent = nightText;
      officePowerTime.textContent = timeText;
    },
    setMicrophone(active, enabled, listening, blocked, level): void {
      const clampedLevel = Math.max(0, Math.min(1, level));
      microphonePanel.dataset.active = String(active);
      microphonePanel.dataset.enabled = String(enabled);
      microphonePanel.dataset.listening = String(listening);
      microphonePanel.dataset.blocked = String(blocked);
      microphonePanel.style.setProperty('--microphone-level', clampedLevel.toFixed(3));
      microphoneLabel.textContent = enabled && listening ? 'Microphone On' : 'Microphone Off';
      microphoneToggle.textContent = enabled ? 'Turn Off' : 'Turn On';
      microphoneToggle.setAttribute('aria-pressed', String(enabled));
    },
    setMicrophoneTool(active, body): void {
      microphoneTool.dataset.active = String(active);
      microphoneToolText.textContent = body;
    },
    setCameraTool(active, body): void {
      cameraTool.dataset.active = String(active);
      cameraToolText.textContent = body;
      if (!active) {
        cameraToolPreview.dataset.live = 'false';
        cameraToolPreview.replaceChildren(cameraToolPreviewLabel);
      }
    },
    setPhotoCameraPreview(active, imageUrl, label, flash): void {
      photoCameraPreview.dataset.active = String(active && Boolean(imageUrl));
      photoCameraPreview.dataset.flash = String(flash);
      photoCameraFlash.dataset.active = String(flash);
      photoCameraPreviewImage.src = imageUrl ?? '';
      photoCameraPreviewLabel.textContent = label;
    },
    setCameraToolPreview(active, video = null): void {
      cameraToolPreview.hidden = !active;
      if (!active || !video) {
        cameraToolPreview.dataset.live = 'false';
        cameraToolPreviewLabel.textContent = active ? 'Waiting for camera' : 'Camera hidden';
        cameraToolPreview.replaceChildren(cameraToolPreviewLabel);
        return;
      }

      cameraToolPreview.dataset.live = 'true';
      video.classList.add('hud__camera-tool-video');
      video.muted = true;
      video.playsInline = true;
      if (video.parentElement !== cameraToolPreview) {
        cameraToolPreview.replaceChildren(video);
      }
    },
    setPrompt(text): void {
      promptText.textContent = text;
    },
    setActionPrompt(text): void {
      actionPrompt.dataset.active = String(text.length > 0);
      actionPrompt.textContent = text;
    },
    setCrouchInstructions(active, crouched, text, title = 'Crouch Instructions'): void {
      crouchInstructions.dataset.active = String(active);
      crouchInstructions.dataset.crouched = String(crouched);
      crouchTitle.textContent = title;
      crouchText.textContent = text ?? (crouched
        ? 'Crouching: purple hands cannot get you in the mist.'
        : 'Hold Spacebar');
    },
    setTabletCameras(active, activeLabel, cameras): void {
      tabletCameraPanel.dataset.active = String(active);
      tabletCameraTitle.dataset.active = String(active && activeLabel.length > 0);
      tabletStatic.dataset.active = String(active);
      tabletCameraTitle.textContent = activeLabel;
      tabletCameraList.replaceChildren(
        ...cameras.map((camera) => {
          const row = document.createElement('div');
          row.className = 'hud__tablet-camera-row';
          row.dataset.active = String(camera.active);

          const key = document.createElement('span');
          key.className = 'hud__tablet-camera-key';
          key.textContent = camera.key;

          const label = document.createElement('span');
          label.className = 'hud__tablet-camera-name';
          label.textContent = camera.label;

          row.append(key, label);
          return row;
        }),
      );
    },
    setBallPitHidden(active): void {
      ballPitHide.dataset.active = String(active);
    },
    setNightModeAttack(active, armProgress, blackout): void {
      const clampedArmProgress = Math.max(0, Math.min(1, armProgress));
      const clampedBlackout = Math.max(0, Math.min(1, blackout));
      nightModeAttack.dataset.active = String(active || clampedArmProgress > 0.01 || clampedBlackout > 0.01);
      nightModeAttack.style.setProperty('--arm-progress', clampedArmProgress.toFixed(3));
      nightModeAttack.style.setProperty('--blackout', clampedBlackout.toFixed(3));
    },
    setOfficeHardVignette(active, intensity): void {
      const clampedIntensity = Math.max(0, Math.min(1, intensity));
      officeHardVignette.dataset.active = String(active && clampedIntensity > 0.01);
      officeHardVignette.style.setProperty('--office-hard-vignette', clampedIntensity.toFixed(3));
    },
    setOfficeCameraPuppet(active, phase, progress, secondsRemaining = 0): void {
      const clampedProgress = Math.max(0, Math.min(1, progress));
      officeCameraPuppet.dataset.active = String(active);
      officeCameraPuppet.dataset.phase = phase;
      officeCameraPuppet.style.setProperty('--camera-puppet-progress', clampedProgress.toFixed(3));
      officeCameraPuppetPrompt.textContent = phase === 'camera-face'
        ? 'Drop the camera. Left click now.'
        : phase === 'room-watch'
          ? `It is staring at you. Camera up in ${Math.max(0, secondsRemaining).toFixed(1)}s`
          : '';
    },
    setOfficeCutscene(active, title, progress): void {
      const clampedProgress = Math.max(0, Math.min(1, progress));
      officeCutscene.dataset.active = String(active);
      officeCutsceneTitle.textContent = title;
      officeCutscene.style.setProperty('--office-cutscene-progress', clampedProgress.toFixed(3));
    },
    setOfficeDeathNotice(active, phase, progress): void {
      const clampedProgress = Math.max(0, Math.min(1, progress));
      officeDeathNotice.dataset.active = String(active);
      officeDeathNotice.dataset.phase = phase;
      officeDeathNotice.style.setProperty('--office-death-progress', clampedProgress.toFixed(3));
    },
    setHealth(ratio): void {
      healthMeter.fill.style.setProperty('--fill-ratio', `${Math.max(0, Math.min(1, ratio))}`);
      healthMeter.value.textContent = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`;
    },
    setHealthLabel(text): void {
      healthMeter.label.textContent = text;
    },
    setStamina(ratio): void {
      staminaMeter.fill.style.setProperty('--fill-ratio', `${Math.max(0, Math.min(1, ratio))}`);
      staminaMeter.value.textContent = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`;
    },
    setStaminaLabel(text): void {
      staminaMeter.label.textContent = text;
    },
    setToxicity(active, ratio, valueText): void {
      const clampedRatio = Math.max(0, Math.min(1, ratio));
      toxicityMeter.root.hidden = !active;
      toxicityMeter.root.dataset.danger = String(clampedRatio >= 1);
      toxicityMeter.fill.style.setProperty('--fill-ratio', `${clampedRatio}`);
      toxicityMeter.value.textContent = valueText ?? `${Math.round(clampedRatio * 100)}%`;
    },
    setHotbar(slots): void {
      hotbar.hidden = slots.length === 0;
      hotbarSlots.forEach((slot, index) => {
        const value = slots[index];
        slot.root.dataset.filled = String(Boolean(value?.filled));
        slot.root.dataset.selected = String(Boolean(value?.selected));
        slot.root.dataset.item = value?.filled && value.type ? value.type : '';
        const imageUrl = value?.filled ? value.imageUrl : null;
        slot.root.dataset.image = String(Boolean(imageUrl));
        slot.image.hidden = !imageUrl;
        slot.image.src = imageUrl ?? '';
        slot.valueText.textContent = value?.label ?? 'Empty';
        slot.countText.textContent = `x${value?.filled ? value.count : 0}`;
      });
    },
    setChapterElevenSeedHotbar(active, slots): void {
      chapterElevenSeedHotbar.dataset.active = String(active);
      chapterElevenSeedHotbarSlots.forEach((slot, index) => {
        const value = slots[index];
        slot.root.dataset.filled = String(Boolean(value?.filled));
        slot.root.dataset.selected = String(Boolean(value?.selected));
        slot.root.dataset.item = value?.filled && value.type ? value.type : '';
        slot.valueText.textContent = value?.label ?? 'Empty';
        slot.countText.textContent = `x${value?.filled ? value.count : 0}`;
      });
    },
    setJumpscare(variant, intensity): void {
      const clampedIntensity = Math.max(0, Math.min(1, intensity));
      const time = typeof performance !== 'undefined' ? performance.now() : Date.now();
      jumpscare.dataset.active = String(Boolean(variant) && clampedIntensity > 0.02);
      jumpscare.dataset.variant = variant ?? 'seaweed';
      root.dataset.scared = String(clampedIntensity > 0.02);
      root.style.setProperty('--scare-intensity', clampedIntensity.toFixed(3));
      jumpscare.style.setProperty('--jumpscare-intensity', clampedIntensity.toFixed(3));
      jumpscare.style.setProperty('--jumpscare-jitter-x', `${Math.sin(time * 0.043 + clampedIntensity * 29) * clampedIntensity * 3.8}rem`);
      jumpscare.style.setProperty('--jumpscare-jitter-y', `${Math.cos(time * 0.051 + clampedIntensity * 23) * clampedIntensity * 2.4}rem`);
      jumpscareLabel.textContent = getMonsterLabel(variant);
    },
    destroy(): void {
      host.replaceChildren();
    },
  };
}

function getCompassDirection(headingDegrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
  return directions[Math.round(headingDegrees / 45) % directions.length];
}

function getMonsterLabel(variant: HudJumpScareVariant | null): string {
  switch (variant) {
    case 'spider':
      return 'Widow Maw';
    case 'duck':
      return 'Carrion Raptor';
    case 'seaweed':
      return 'Drowned Kelp Wretch';
    case 'bear':
      return 'Teddy Bear Monster';
    case 'quacky':
      return 'Quacky The Duck';
    case 'fluffle':
      return 'Fluffle The Bunny';
    case 'bori':
      return 'Bori The Bear';
    case 'foxy':
      return 'Foxy The Pirate Fox';
    case 'purple':
      return 'Purple';
    case 'blue':
      return 'Blue';
    case 'green':
      return 'Green';
    default:
      return 'Pantry Creature';
  }
}

function getOfficeModeLabel(mode: OfficeModeMenuMode): string {
  switch (mode) {
    case 'creator':
      return 'Creator Mode';
    case 'night':
      return 'Night Mode';
    case 'game':
      return 'Game Mode';
  }
}

function getOfficeDifficultyLabel(difficulty: OfficeModeMenuDifficulty): string {
  switch (difficulty) {
    case 'easy':
      return 'Easy';
    case 'normal':
      return 'Normal';
    case 'hard':
      return 'Hard';
  }
}

function createMeter(labelText: string, fillClassName: string) {
  const root = document.createElement('div');
  root.className = 'hud__meter';

  const header = document.createElement('div');
  header.className = 'hud__meter-header';

  const label = document.createElement('p');
  label.className = 'hud__label';
  label.textContent = labelText;

  const value = document.createElement('p');
  value.className = 'hud__hint';
  value.textContent = '100%';

  header.append(label, value);

  const track = document.createElement('div');
  track.className = 'hud__track';

  const fill = document.createElement('div');
  fill.className = `hud__fill ${fillClassName}`;
  fill.style.setProperty('--fill-ratio', '1');

  track.append(fill);
  root.append(header, track);

  return { root, label, fill, value };
}
