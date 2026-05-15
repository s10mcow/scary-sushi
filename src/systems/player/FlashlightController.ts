import type { SpotLight } from 'three';

export class FlashlightController {
  private enabled = true;

  constructor(private readonly light: SpotLight) {}

  isEnabled(): boolean {
    return this.enabled;
  }

  toggle(): void {
    this.setEnabled(!this.enabled);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.light.visible = enabled;
  }
}
