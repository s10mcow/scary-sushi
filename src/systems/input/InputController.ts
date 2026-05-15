export interface MovementState {
  forward: number;
  strafe: number;
  sprint: boolean;
}

export type WeaponSelectId = 'pistol' | 'shotgun';

export class InputController {
  private readonly pressed = new Set<string>();
  private flashlightToggleQueued = false;
  private interactQueued = false;
  private dropQueued = false;
  private useItemQueued = false;
  private jumpQueued = false;
  private chapterMenuToggleQueued = false;
  private officeJumpscareMenuToggleQueued = false;
  private hudHelpToggleQueued = false;
  private placementToolToggleQueued = false;
  private placementMarkerDeleteQueued = false;
  private fireQueued = false;
  private choiceYesQueued = false;
  private choiceNoQueued = false;
  private hotbarSlotQueued: number | null = null;
  private weaponSelectQueued: WeaponSelectId | null = null;

  constructor(private readonly target: Window = window) {
    this.target.addEventListener('keydown', this.handleKeyDown);
    this.target.addEventListener('keyup', this.handleKeyUp);
    this.target.addEventListener('mousedown', this.handleMouseDown);
    this.target.addEventListener('contextmenu', this.handleContextMenu);
  }

  getMovementState(): MovementState {
    return {
      forward: Number(this.pressed.has('KeyW')) - Number(this.pressed.has('KeyS')),
      strafe: Number(this.pressed.has('KeyD')) - Number(this.pressed.has('KeyA')),
      sprint: this.pressed.has('ShiftLeft') || this.pressed.has('ShiftRight'),
    };
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

  consumeOfficeJumpscareMenuToggle(): boolean {
    const value = this.officeJumpscareMenuToggleQueued;
    this.officeJumpscareMenuToggleQueued = false;
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

  consumeFire(): boolean {
    const value = this.fireQueued;
    this.fireQueued = false;
    return value;
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

  destroy(): void {
    this.target.removeEventListener('keydown', this.handleKeyDown);
    this.target.removeEventListener('keyup', this.handleKeyUp);
    this.target.removeEventListener('mousedown', this.handleMouseDown);
    this.target.removeEventListener('contextmenu', this.handleContextMenu);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.pressed.add(event.code);

    if (event.code === 'KeyF' && !event.repeat) {
      this.flashlightToggleQueued = true;
    }

    if (event.code === 'KeyE' && !event.repeat) {
      this.interactQueued = true;
    }

    if (event.code === 'KeyD' && !event.repeat) {
      this.dropQueued = true;
    }

    if ((event.code === 'KeyC' || event.code === 'KeyQ') && !event.repeat) {
      this.useItemQueued = true;
    }

    if (event.code === 'KeyP' && !event.repeat) {
      this.chapterMenuToggleQueued = true;
    }

    if (event.code === 'KeyJ' && !event.repeat) {
      this.officeJumpscareMenuToggleQueued = true;
    }

    if (event.code === 'KeyV' && !event.repeat) {
      this.hudHelpToggleQueued = true;
    }

    if (event.code === 'KeyM' && !event.repeat) {
      this.placementToolToggleQueued = true;
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
      event.preventDefault();
      return;
    }

    if (event.button === 0) {
      this.fireQueued = true;
    }
  };

  private readonly handleContextMenu = (event: MouseEvent): void => {
    if (this.target.document.pointerLockElement) {
      event.preventDefault();
    }
  };
}
