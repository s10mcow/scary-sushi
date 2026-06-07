interface VoiceAudioContextCtor {
  new (): AudioContext;
}

export class VoiceInputController {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private samples: Uint8Array<ArrayBuffer> | null = null;
  private starting = false;
  private started = false;
  private blocked = false;
  private smoothedLevel = 0;

  async start(): Promise<boolean> {
    if (this.started || this.starting || this.blocked) {
      return this.started;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      this.blocked = true;
      return false;
    }

    this.starting = true;
    try {
      const AudioContextCtor = (
        window.AudioContext
        || (window as Window & { webkitAudioContext?: VoiceAudioContextCtor }).webkitAudioContext
      );
      if (!AudioContextCtor) {
        this.blocked = true;
        return false;
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.context = new AudioContextCtor();
      const source = this.context.createMediaStreamSource(this.stream);
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.36;
      this.samples = new Uint8Array(this.analyser.fftSize);
      source.connect(this.analyser);
      this.started = true;
      return true;
    } catch {
      this.blocked = true;
      this.stop();
      return false;
    } finally {
      this.starting = false;
    }
  }

  getLevel(): number {
    if (!this.analyser || !this.samples) {
      this.smoothedLevel *= 0.9;
      return this.smoothedLevel;
    }

    this.analyser.getByteTimeDomainData(this.samples);
    let sum = 0;
    for (let index = 0; index < this.samples.length; index += 1) {
      const centered = (this.samples[index] - 128) / 128;
      sum += centered * centered;
    }

    const rms = Math.sqrt(sum / this.samples.length);
    const normalized = Math.max(0, Math.min(1, (rms - 0.018) / 0.18));
    this.smoothedLevel = Math.max(normalized, this.smoothedLevel * 0.84);
    return this.smoothedLevel;
  }

  isActive(): boolean {
    return this.started && this.analyser !== null && this.samples !== null;
  }

  isBlocked(): boolean {
    return this.blocked;
  }

  destroy(): void {
    this.stop();
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.analyser = null;
    this.samples = null;
    this.started = false;
    this.smoothedLevel = 0;
    if (this.context && this.context.state !== 'closed') {
      void this.context.close();
    }
    this.context = null;
  }
}
