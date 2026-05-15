const MAX_FRAME_DELTA_SECONDS = 1 / 30;

export class GameLoop {
  private frameId: number | null = null;
  private previousTime = 0;

  constructor(private readonly update: (deltaSeconds: number) => void) {}

  start(): void {
    if (this.frameId !== null) {
      return;
    }

    this.previousTime = performance.now();
    this.frameId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (this.frameId === null) {
      return;
    }

    cancelAnimationFrame(this.frameId);
    this.frameId = null;
  }

  private readonly tick = (time: number): void => {
    const deltaSeconds = Math.min((time - this.previousTime) / 1000, MAX_FRAME_DELTA_SECONDS);
    this.previousTime = time;

    this.update(deltaSeconds);
    this.frameId = requestAnimationFrame(this.tick);
  };
}
