export interface MovementState {
  forward: number;
  strafe: number;
  sprint: boolean;
}

export interface MovementStateOptions {
  ignoreBackward?: boolean;
}

export type WeaponSelectId = 'pistol' | 'shotgun';

interface TouchLookDelta {
  x: number;
  y: number;
}

type TouchControlKind = 'move' | 'look';
type TouchActionKind = 'interact' | 'jump' | 'fire' | 'cycle';

export class InputController {
  private readonly pressed = new Set<string>();
  private flashlightToggleQueued = false;
  private interactQueued = false;
  private dropQueued = false;
  private useItemQueued = false;
  private pickupQueued = false;
  private jumpQueued = false;
  private spacePressedAt = 0;
  private chapterMenuToggleQueued = false;
  private updateToggleQueued = false;
  private officeJumpscareMenuToggleQueued = false;
  private officeModeMenuToggleQueued = false;
  private hudHelpToggleQueued = false;
  private placementToolToggleQueued = false;
  private placementMarkerDeleteQueued = false;
  private paintbrushModeToggleQueued = false;
  private fireQueued = false;
  private secondaryFireQueued = false;
  private fireHeld = false;
  private choiceYesQueued = false;
  private choiceNoQueued = false;
  private hotbarSlotQueued: number | null = null;
  private weaponSelectQueued: WeaponSelectId | null = null;
  private itemCycleQueued = 0;
  private touchMovePointerId: number | null = null;
  private touchLookPointerId: number | null = null;
  private touchInteractPointerId: number | null = null;
  private touchJumpPointerId: number | null = null;
  private touchFirePointerId: number | null = null;
  private touchMovePad: HTMLElement | null = null;
  private touchLookPad: HTMLElement | null = null;
  private touchLookLastX = 0;
  private touchLookLastY = 0;
  private touchMoveForward = 0;
  private touchMoveStrafe = 0;
  private touchLookDeltaX = 0;
  private touchLookDeltaY = 0;
  private readonly touchMoveRadius = 38;
  private readonly touchLookRadius = 42;

  constructor(private readonly target: Window = window) {
    this.target.addEventListener('keydown', this.handleKeyDown);
    this.target.addEventListener('keyup', this.handleKeyUp);
    this.target.addEventListener('mousedown', this.handleMouseDown);
    this.target.addEventListener('mouseup', this.handleMouseUp);
    this.target.addEventListener('wheel', this.handleWheel, { passive: false });
    this.target.addEventListener('blur', this.handleBlur);
    this.target.addEventListener('contextmenu', this.handleContextMenu);
    this.target.document.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    this.target.document.addEventListener('pointermove', this.handlePointerMove, { passive: false });
    this.target.document.addEventListener('pointerup', this.handlePointerUp, { passive: false });
    this.target.document.addEventListener('pointercancel', this.handlePointerUp, { passive: false });
  }

  getMovementState(options: MovementStateOptions = {}): MovementState {
    const keyboardForward = Number(this.pressed.has('KeyW')) - Number(!options.ignoreBackward && this.pressed.has('KeyS'));
    const keyboardStrafe = Number(this.pressed.has('KeyD')) - Number(this.pressed.has('KeyA'));
    const touchForward = options.ignoreBackward ? Math.max(0, this.touchMoveForward) : this.touchMoveForward;
    const touchStrength = Math.hypot(this.touchMoveForward, this.touchMoveStrafe);

    return {
      forward: InputController.clamp(keyboardForward + touchForward, -1, 1),
      strafe: InputController.clamp(keyboardStrafe + this.touchMoveStrafe, -1, 1),
      sprint: this.pressed.has('ShiftLeft') || this.pressed.has('ShiftRight') || touchStrength > 0.88,
    };
  }

  isSpaceHeld(): boolean {
    return this.pressed.has('Space');
  }

  getSpaceHeldMilliseconds(): number {
    return this.pressed.has('Space') ? performance.now() - this.spacePressedAt : 0;
  }

  isInteractHeld(): boolean {
    return this.pressed.has('KeyE');
  }

  consumeFlashlightToggle(): boolean {
    const value = this.flashlightToggleQueued;
    this.flashlightToggleQueued = false;
    return value;
  }

  consumeInteract(): boolean {
    const value = this.interactQueued;
    this.interactQueued = false;
    return value;
  }

  consumeDrop(): boolean {
    const value = this.dropQueued;
    this.dropQueued = false;
    return value;
  }

  consumeUseItem(): boolean {
    const value = this.useItemQueued;
    this.useItemQueued = false;
    return value;
  }

  consumePickup(): boolean {
    const value = this.pickupQueued;
    this.pickupQueued = false;
    return value;
  }

  consumeJump(): boolean {
    const value = this.jumpQueued;
    this.jumpQueued = false;
    return value;
  }

  consumeChapterMenuToggle(): boolean {
    const value = this.chapterMenuToggleQueued;
    this.chapterMenuToggleQueued = false;
    return value;
  }

  consumeUpdateToggle(): boolean {
    const value = this.updateToggleQueued;
    this.updateToggleQueued = false;
    return value;
  }

  consumeOfficeJumpscareMenuToggle(): boolean {
    const value = this.officeJumpscareMenuToggleQueued;
    this.officeJumpscareMenuToggleQueued = false;
    return value;
  }

  consumeOfficeModeMenuToggle(): boolean {
    const value = this.officeModeMenuToggleQueued;
    this.officeModeMenuToggleQueued = false;
    return value;
  }

  consumeHudHelpToggle(): boolean {
    const value = this.hudHelpToggleQueued;
    this.hudHelpToggleQueued = false;
    return value;
  }

  consumePlacementToolToggle(): boolean {
    const value = this.placementToolToggleQueued;
    this.placementToolToggleQueued = false;
    return value;
  }

  consumePlacementMarkerDelete(): boolean {
    const value = this.placementMarkerDeleteQueued;
    this.placementMarkerDeleteQueued = false;
    return value;
  }

  consumePaintbrushModeToggle(): boolean {
    const value = this.paintbrushModeToggleQueued;
    this.paintbrushModeToggleQueued = false;
    return value;
  }

  consumeFire(): boolean {
    const value = this.fireQueued;
    this.fireQueued = false;
    return value;
  }

  consumeSecondaryFire(): boolean {
    const value = this.secondaryFireQueued;
    this.secondaryFireQueued = false;
    return value;
  }

  isFireHeld(): boolean {
    return (this.fireHeld && Boolean(this.target.document.pointerLockElement)) || this.touchFirePointerId !== null;
  }

  consumeChoiceYes(): boolean {
    const value = this.choiceYesQueued;
    this.choiceYesQueued = false;
    return value;
  }

  consumeChoiceNo(): boolean {
    const value = this.choiceNoQueued;
    this.choiceNoQueued = false;
    return value;
  }

  consumeWeaponSelect(): WeaponSelectId | null {
    const value = this.weaponSelectQueued;
    this.weaponSelectQueued = null;
    return value;
  }

  consumeHotbarSlot(): number | null {
    const value = this.hotbarSlotQueued;
    this.hotbarSlotQueued = null;
    return value;
  }

  consumeItemCycle(): number {
    const value = Math.sign(this.itemCycleQueued);
    this.itemCycleQueued = 0;
    return value;
  }

  consumeTouchLookDelta(target: TouchLookDelta = { x: 0, y: 0 }): TouchLookDelta {
    target.x = this.touchLookDeltaX;
    target.y = this.touchLookDeltaY;
    this.touchLookDeltaX = 0;
    this.touchLookDeltaY = 0;
    return target;
  }

  hasActiveTouchControls(): boolean {
    return this.touchMovePointerId !== null
      || this.touchLookPointerId !== null
      || this.touchInteractPointerId !== null
      || this.touchJumpPointerId !== null
      || this.touchFirePointerId !== null;
  }

  destroy(): void {
    this.target.removeEventListener('keydown', this.handleKeyDown);
    this.target.removeEventListener('keyup', this.handleKeyUp);
    this.target.removeEventListener('mousedown', this.handleMouseDown);
    this.target.removeEventListener('mouseup', this.handleMouseUp);
    this.target.removeEventListener('wheel', this.handleWheel);
    this.target.removeEventListener('blur', this.handleBlur);
    this.target.removeEventListener('contextmenu', this.handleContextMenu);
    this.target.document.removeEventListener('pointerdown', this.handlePointerDown);
    this.target.document.removeEventListener('pointermove', this.handlePointerMove);
    this.target.document.removeEventListener('pointerup', this.handlePointerUp);
    this.target.document.removeEventListener('pointercancel', this.handlePointerUp);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.pressed.add(event.code);
    if (event.code === 'Space' && !event.repeat) {
      this.spacePressedAt = performance.now();
    }

    if (event.code === 'KeyF' && !event.repeat) {
      this.flashlightToggleQueued = true;
    }

    if (event.code === 'KeyE' && !event.repeat) {
      this.interactQueued = true;
    }

    if (event.code === 'KeyD' && !event.repeat) {
      this.dropQueued = true;
    }

    if (event.code === 'KeyQ' && !event.repeat) {
      this.paintbrushModeToggleQueued = true;
    }

    if (event.code === 'KeyC' && !event.repeat) {
      this.useItemQueued = true;
    }

    if (event.code === 'KeyR' && !event.repeat) {
      this.pickupQueued = true;
    }

    if (event.code === 'KeyJ' && !event.repeat) {
      this.officeJumpscareMenuToggleQueued = true;
    }

    if (event.code === 'KeyP' && !event.repeat) {
      this.chapterMenuToggleQueued = true;
    }

    if (event.code === 'KeyU' && !event.repeat) {
      this.updateToggleQueued = true;
    }

    if (event.code === 'KeyV' && !event.repeat) {
      this.hudHelpToggleQueued = true;
    }

    if (event.code === 'KeyM' && !event.repeat) {
      this.officeModeMenuToggleQueued = true;
    }

    if (event.code === 'KeyZ' && !event.repeat) {
      this.placementToolToggleQueued = true;
      event.preventDefault();
    }

    if (event.code === 'KeyY' && !event.repeat) {
      this.choiceYesQueued = true;
    }

    if (event.code === 'KeyN' && !event.repeat) {
      this.choiceNoQueued = true;
    }

    if (event.code === 'Digit1' && !event.repeat) {
      this.hotbarSlotQueued = 1;
      this.weaponSelectQueued = 'pistol';
    }

    if (event.code === 'Digit2' && !event.repeat) {
      this.hotbarSlotQueued = 2;
      this.weaponSelectQueued = 'shotgun';
    }

    if (event.code === 'Digit3' && !event.repeat) this.hotbarSlotQueued = 3;
    if (event.code === 'Digit4' && !event.repeat) this.hotbarSlotQueued = 4;
    if (event.code === 'Digit5' && !event.repeat) this.hotbarSlotQueued = 5;
    if (event.code === 'Digit6' && !event.repeat) this.hotbarSlotQueued = 6;
    if (event.code === 'Digit7' && !event.repeat) this.hotbarSlotQueued = 7;
    if (event.code === 'Digit8' && !event.repeat) this.hotbarSlotQueued = 8;
    if (event.code === 'Digit9' && !event.repeat) this.hotbarSlotQueued = 9;
    if (event.code === 'Digit0' && !event.repeat) this.hotbarSlotQueued = 10;

    if (event.code === 'Space' && !event.repeat) {
      this.jumpQueued = true;
      event.preventDefault();
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (event.code === 'Space') {
      event.preventDefault();
    }
    this.pressed.delete(event.code);
  };

  private readonly handleMouseDown = (event: MouseEvent): void => {
    if (!this.target.document.pointerLockElement) {
      return;
    }

    if (event.button === 2) {
      this.placementMarkerDeleteQueued = true;
      this.secondaryFireQueued = true;
      event.preventDefault();
      return;
    }

    if (event.button === 0) {
      this.fireHeld = true;
      this.fireQueued = true;
    }
  };

  private readonly handleMouseUp = (event: MouseEvent): void => {
    if (event.button === 0) {
      this.fireHeld = false;
    }
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    const targetElement = event.target instanceof Element ? event.target : null;
    const overGameSurface = Boolean(targetElement?.closest('#viewport, canvas'));
    if ((!this.target.document.pointerLockElement && !overGameSurface) || event.deltaY === 0) {
      return;
    }

    this.itemCycleQueued += event.deltaY > 0 ? 1 : -1;
    event.preventDefault();
  };

  private readonly handleBlur = (): void => {
    this.fireHeld = false;
    this.spacePressedAt = 0;
    this.pressed.clear();
    this.resetTouchMove();
    this.resetTouchLook();
    this.resetTouchActions();
  };

  private readonly handleContextMenu = (event: MouseEvent): void => {
    if (this.target.document.pointerLockElement) {
      event.preventDefault();
    }
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    const targetElement = event.target instanceof Element ? event.target : null;
    const actionButton = targetElement?.closest<HTMLElement>('[data-touch-action]');
    const action = actionButton?.dataset.touchAction as TouchActionKind | undefined;
    if (actionButton && action) {
      this.handleTouchActionDown(event, actionButton, action);
      return;
    }

    const pad = targetElement?.closest<HTMLElement>('[data-touch-control]');
    const control = pad?.dataset.touchControl as TouchControlKind | undefined;
    if (!pad || (control !== 'move' && control !== 'look')) {
      return;
    }

    event.preventDefault();
    try {
      pad.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture can fail if the browser already cancelled this pointer.
    }

    if (control === 'move') {
      if (this.touchMovePointerId !== null) {
        return;
      }
      this.touchMovePointerId = event.pointerId;
      this.touchMovePad = pad;
      pad.dataset.active = 'true';
      this.updateTouchMove(event, pad);
      return;
    }

    if (this.touchLookPointerId !== null) {
      return;
    }
    this.touchLookPointerId = event.pointerId;
    this.touchLookPad = pad;
    this.touchLookLastX = event.clientX;
    this.touchLookLastY = event.clientY;
    pad.dataset.active = 'true';
    this.updateTouchKnob(pad, 0, 0);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId === this.touchMovePointerId && this.touchMovePad) {
      event.preventDefault();
      this.updateTouchMove(event, this.touchMovePad);
      return;
    }

    if (event.pointerId === this.touchLookPointerId && this.touchLookPad) {
      event.preventDefault();
      this.touchLookDeltaX += event.clientX - this.touchLookLastX;
      this.touchLookDeltaY += event.clientY - this.touchLookLastY;
      this.touchLookLastX = event.clientX;
      this.touchLookLastY = event.clientY;
      const lookOffset = this.getTouchPadOffset(event, this.touchLookPad, this.touchLookRadius);
      this.updateTouchKnob(this.touchLookPad, lookOffset.x, lookOffset.y);
    }
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId === this.touchInteractPointerId) {
      this.touchInteractPointerId = null;
      this.pressed.delete('KeyE');
    }

    if (event.pointerId === this.touchJumpPointerId) {
      this.touchJumpPointerId = null;
      this.pressed.delete('Space');
    }

    if (event.pointerId === this.touchFirePointerId) {
      this.touchFirePointerId = null;
      this.fireHeld = false;
    }

    if (event.pointerId === this.touchMovePointerId) {
      this.resetTouchMove();
    }

    if (event.pointerId === this.touchLookPointerId) {
      this.resetTouchLook();
    }
  };

  private handleTouchActionDown(event: PointerEvent, button: HTMLElement, action: TouchActionKind): void {
    event.preventDefault();
    try {
      button.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture can fail if the browser already cancelled this pointer.
    }

    if (action === 'interact') {
      this.touchInteractPointerId = event.pointerId;
      this.pressed.add('KeyE');
      this.interactQueued = true;
      return;
    }

    if (action === 'jump') {
      this.touchJumpPointerId = event.pointerId;
      this.pressed.add('Space');
      this.spacePressedAt = performance.now();
      this.jumpQueued = true;
      return;
    }

    if (action === 'fire') {
      this.touchFirePointerId = event.pointerId;
      this.fireHeld = true;
      this.fireQueued = true;
      return;
    }

    this.itemCycleQueued += 1;
  }

  private updateTouchMove(event: PointerEvent, pad: HTMLElement): void {
    const offset = this.getTouchPadOffset(event, pad, this.touchMoveRadius);
    this.updateTouchKnob(pad, offset.x, offset.y);
    this.touchMoveStrafe = InputController.clamp(offset.x / this.touchMoveRadius, -1, 1);
    this.touchMoveForward = InputController.clamp(-offset.y / this.touchMoveRadius, -1, 1);
  }

  private getTouchPadOffset(event: PointerEvent, pad: HTMLElement, radius: number): { x: number; y: number } {
    const rect = pad.getBoundingClientRect();
    const rawX = event.clientX - (rect.left + rect.width / 2);
    const rawY = event.clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(rawX, rawY);
    if (distance <= radius || distance === 0) {
      return { x: rawX, y: rawY };
    }

    const scale = radius / distance;
    return {
      x: rawX * scale,
      y: rawY * scale,
    };
  }

  private updateTouchKnob(pad: HTMLElement, x: number, y: number): void {
    pad.style.setProperty('--touch-x', `${x.toFixed(2)}px`);
    pad.style.setProperty('--touch-y', `${y.toFixed(2)}px`);
  }

  private resetTouchMove(): void {
    this.touchMoveForward = 0;
    this.touchMoveStrafe = 0;
    this.touchMovePointerId = null;
    if (this.touchMovePad) {
      this.touchMovePad.dataset.active = 'false';
      this.updateTouchKnob(this.touchMovePad, 0, 0);
      this.touchMovePad = null;
    }
  }

  private resetTouchLook(): void {
    this.touchLookPointerId = null;
    this.touchLookLastX = 0;
    this.touchLookLastY = 0;
    if (this.touchLookPad) {
      this.touchLookPad.dataset.active = 'false';
      this.updateTouchKnob(this.touchLookPad, 0, 0);
      this.touchLookPad = null;
    }
  }

  private resetTouchActions(): void {
    this.touchInteractPointerId = null;
    this.touchJumpPointerId = null;
    this.touchFirePointerId = null;
    this.fireHeld = false;
    this.pressed.delete('KeyE');
    this.pressed.delete('Space');
  }

  private static clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
