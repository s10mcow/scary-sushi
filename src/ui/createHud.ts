import type { MonsterVariant } from '../systems/monster/MonsterController';

export type HudChapterId = 'chapter-1' | 'chapter-2' | 'chapter-3' | 'zombie-fps' | 'doom-fps';
export type HudJumpScareVariant = MonsterVariant | 'bear' | 'quacky' | 'fluffle' | 'bori' | 'foxy';
export type OfficeModeMenuStep = 'mode' | 'difficulty';
export type OfficeModeMenuMode = 'creator' | 'night' | 'game';
export type OfficeModeMenuDifficulty = 'easy' | 'normal' | 'hard';
export type OfficeCameraPuppetHudPhase = 'camera-face' | 'room-watch' | 'jumpscare';

export interface HotbarSlotView {
  label: string;
  count: number;
  filled: boolean;
}

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

export interface HudController {
  onEngage(handler: () => void): void;
  onChapterSelect(handler: (chapterId: HudChapterId) => void): void;
  onOfficeJumpscareSelect(handler: (jumpscareId: string) => void): void;
  onOfficeModeSelect(handler: (selectionId: string) => void): void;
  setTheme(theme: 'default' | 'doom'): void;
  setCrosshairMode(mode: 'default' | 'firearm'): void;
  setThreatEye(intensity: number): void;
  setFlashlight(enabled: boolean): void;
  setLocked(locked: boolean): void;
  setObjective(text: string): void;
  setStoryNotice(text: string, active: boolean, label?: string): void;
  setChapterCard(active: boolean, title: string, body: string): void;
  setChapterLabel(text: string): void;
  setChapterMenu(active: boolean, currentChapter: HudChapterId): void;
  setOfficeJumpscareMenu(active: boolean, options: OfficeJumpscareOptionView[]): void;
  setOfficeModeMenu(
    active: boolean,
    step: OfficeModeMenuStep,
    pendingMode: OfficeModeMenuMode | null,
    activeMode: OfficeModeMenuMode,
    activeDifficulty: OfficeModeMenuDifficulty,
  ): void;
  setPlacementTool(active: boolean, body: string, copyText?: string): void;
  setStatus(text: string): void;
  setInventory(text: string): void;
  setOfficePower(active: boolean, powerRatio: number, powerOut: boolean, nightText?: string, timeText?: string): void;
  setPrompt(text: string): void;
  setActionPrompt(text: string): void;
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
  setHealth(ratio: number): void;
  setHealthLabel(text: string): void;
  setStamina(ratio: number): void;
  setStaminaLabel(text: string): void;
  setHotbar(slots: HotbarSlotView[]): void;
  setJumpscare(variant: HudJumpScareVariant | null, intensity: number): void;
  destroy(): void;
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

  meterPanel.append(healthMeter.root, staminaMeter.root);

  const objectivePanel = document.createElement('section');
  objectivePanel.className = 'hud__panel hud__panel--left';

  const objectiveLabel = document.createElement('p');
  objectiveLabel.className = 'hud__label';
  objectiveLabel.textContent = 'Challenge Board';

  const objectiveText = document.createElement('p');
  objectiveText.className = 'hud__value';
  objectiveText.textContent =
    'Submit both sushi rolls.\n\nSalmon Roll: 0/3 ready\nTuna Roll: 0/3 ready';

  objectivePanel.append(objectiveLabel, objectiveText);

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
  placementCopyButton.textContent = 'Copy Coordinates';
  placementCopyButton.addEventListener('click', async (event) => {
    event.stopPropagation();
    if (!placementToolCopyText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(placementToolCopyText);
      placementCopyButton.textContent = 'Copied';
      window.setTimeout(() => {
        placementCopyButton.textContent = 'Copy Coordinates';
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
      placementCopyButton.textContent = 'Copied';
      window.setTimeout(() => {
        placementCopyButton.textContent = 'Copy Coordinates';
      }, 1200);
    }
  });

  placementTool.append(placementToolLabel, placementToolText, placementCopyButton);

  const tabletCameraPanel = document.createElement('section');
  tabletCameraPanel.className = 'hud__tablet-cameras';
  tabletCameraPanel.dataset.active = 'false';

  const tabletCameraLabel = document.createElement('p');
  tabletCameraLabel.className = 'hud__label';
  tabletCameraLabel.textContent = 'Tablet Cameras';

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

  const statusPanel = document.createElement('section');
  statusPanel.className = 'hud__panel hud__panel--right';

  const statusText = document.createElement('p');
  statusText.className = 'hud__value';
  statusText.textContent = 'Click the button to lock the pointer and begin.';

  const inventoryText = document.createElement('p');
  inventoryText.className = 'hud__value';
  inventoryText.textContent = 'Inventory: empty';

  const chapterText = document.createElement('p');
  chapterText.className = 'hud__value';
  chapterText.textContent = 'Chapter: 2 / press P';

  const promptText = document.createElement('p');
  promptText.className = 'hud__value hud__value--accent';
  promptText.textContent = 'Push through the kitchen doors, find the raw ingredients in the maze, and bring them back to the station.';

  const flashlightText = document.createElement('p');
  flashlightText.className = 'hud__value';
  flashlightText.textContent = 'Flashlight: off / toggle with F';

  const controlsText = document.createElement('p');
  controlsText.className = 'hud__hint';
  controlsText.textContent = 'WASD move, Space jump, Shift sprint, E interact, M opens the Chapter 3 mode menu or equips the Coordinate Tool elsewhere, left click fires in the FPS modes or places a marker with the tool, right click deletes the latest coordinate marker, 1/2 swap weapons there, C drinks coffee in chapter two, D drops a carried dish on the judges belt, P opens chapter menu, Esc releases pointer, click play space to re-enter.';

  statusPanel.append(statusText, inventoryText, chapterText, promptText, flashlightText, controlsText);

  const hotbar = document.createElement('section');
  hotbar.className = 'hud__hotbar';

  const hotbarLabel = document.createElement('p');
  hotbarLabel.className = 'hud__label hud__label--hotbar';
  hotbarLabel.textContent = 'Inventory';

  const hotbarSlots = Array.from({ length: 9 }, (_, index) => {
    const slot = document.createElement('div');
    slot.className = 'hud__slot';
    slot.dataset.filled = 'false';

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

  hotbar.append(hotbarLabel, ...hotbarSlots.map((slot) => slot.root));

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
      label: 'Chapter 1',
      body: 'Kitchen challenge and pantry maze.',
    },
    {
      id: 'chapter-2' as const,
      label: 'Chapter 2',
      body: 'Locked daycare hallways and key-card routes.',
    },
    {
      id: 'chapter-3' as const,
      label: 'Chapter 3',
      body: 'A quiet office room with furniture and big side doors.',
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

    const optionLabel = document.createElement('span');
    optionLabel.className = 'hud__chapter-option-title';
    optionLabel.textContent = entry.label;

    const optionBody = document.createElement('span');
    optionBody.className = 'hud__chapter-option-body';
    optionBody.textContent = entry.body;

    button.append(optionLabel, optionBody);
    return { ...entry, button };
  });

  chapterMenu.append(
    chapterMenuEyebrow,
    chapterMenuTitle,
    chapterMenuSummary,
    ...chapterButtons.map((entry) => entry.button),
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

  root.append(
    backdrop,
    grain,
    tabletStatic,
    officeHardVignette,
    ballPitHide,
    officeCutscene,
    officeCameraPuppet,
    officePower,
    jumpscare,
    intro,
    meterPanel,
    objectivePanel,
    storyNotice,
    actionPrompt,
    placementTool,
    tabletCameraPanel,
    tabletCameraTitle,
    nightModeAttack,
    statusPanel,
    hotbar,
    crosshair,
    threatEye,
    chapterCard,
    chapterMenu,
    officeJumpscareMenu,
    officeModeMenu,
  );
  host.replaceChildren(root);

  let officeJumpscareSelectHandler: ((jumpscareId: string) => void) | null = null;
  let officeModeSelectHandler: ((selectionId: string) => void) | null = null;
  let officeJumpscareOptionKey = '';

  return {
    onEngage(handler): void {
      button.addEventListener('click', handler);
    },
    onChapterSelect(handler): void {
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
    setObjective(text): void {
      objectiveText.textContent = text;
    },
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
    setChapterMenu(active, currentChapter): void {
      chapterMenu.dataset.active = String(active);
      chapterButtons.forEach((entry) => {
        entry.button.dataset.active = String(entry.id === currentChapter);
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
      placementCopyButton.textContent = copyText.length > 0 ? 'Copy Coordinates' : 'No Marker To Copy';
    },
    setStatus(text): void {
      statusText.textContent = text;
    },
    setInventory(text): void {
      inventoryText.textContent = text;
    },
    setOfficePower(active, powerRatio, powerOut, nightText = '', timeText = ''): void {
      const clampedRatio = Math.max(0, Math.min(1, powerRatio));
      officePower.dataset.active = String(active);
      officePower.dataset.level = powerOut || clampedRatio <= 0.1
        ? 'red'
        : clampedRatio <= 0.5
          ? 'orange'
          : 'green';
      officePower.style.setProperty('--office-power-ratio', clampedRatio.toFixed(3));
      officePowerValue.textContent = powerOut
        ? 'OUT'
        : `${Math.ceil(clampedRatio * 100)}%`;
      officePowerNight.textContent = nightText;
      officePowerTime.textContent = timeText;
    },
    setPrompt(text): void {
      promptText.textContent = text;
    },
    setActionPrompt(text): void {
      actionPrompt.dataset.active = String(text.length > 0);
      actionPrompt.textContent = text;
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
          ? `Raise the camera again. ${Math.max(0, secondsRemaining).toFixed(1)}s`
          : '';
    },
    setOfficeCutscene(active, title, progress): void {
      const clampedProgress = Math.max(0, Math.min(1, progress));
      officeCutscene.dataset.active = String(active);
      officeCutsceneTitle.textContent = title;
      officeCutscene.style.setProperty('--office-cutscene-progress', clampedProgress.toFixed(3));
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
    setHotbar(slots): void {
      hotbarSlots.forEach((slot, index) => {
        const value = slots[index];
        slot.root.dataset.filled = String(Boolean(value?.filled));
        slot.valueText.textContent = value?.filled ? value.label : 'Empty';
        slot.countText.textContent = value?.filled ? `x${value.count}` : 'x0';
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
