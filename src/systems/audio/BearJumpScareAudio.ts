interface BearJumpScareAudioCtor {
  new (): AudioContext;
}

export class BearJumpScareAudio {
  private readonly context?: AudioContext;
  private readonly masterGain?: GainNode;
  private readonly noiseBuffer?: AudioBuffer;
  private readonly activeSources = new Set<AudioScheduledSourceNode>();

  constructor() {
    const AudioContextCtor = (
      window.AudioContext
      || (window as Window & { webkitAudioContext?: BearJumpScareAudioCtor }).webkitAudioContext
    );

    if (!AudioContextCtor) {
      return;
    }

    this.context = new AudioContextCtor();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.22;
    this.masterGain.connect(this.context.destination);
    this.noiseBuffer = createNoiseBuffer(this.context, 2);
  }

  resume(): void {
    if (!this.context || this.context.state !== 'suspended') {
      return;
    }

    void this.context.resume();
  }

  destroy(): void {
    this.stopAllSources();

    if (!this.context || this.context.state === 'closed') {
      return;
    }

    void this.context.close();
  }

  playScream(): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    this.stopAllSources();

    const now = this.context.currentTime + 0.01;
    const masterGain = this.masterGain;

    const impactGain = this.context.createGain();
    impactGain.gain.setValueAtTime(0.0001, now);
    impactGain.gain.exponentialRampToValueAtTime(0.46, now + 0.016);
    impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    impactGain.connect(masterGain);

    const impactLow = this.context.createOscillator();
    impactLow.type = 'triangle';
    impactLow.frequency.setValueAtTime(144, now);
    impactLow.frequency.exponentialRampToValueAtTime(64, now + 0.28);
    impactLow.connect(impactGain);
    this.startSource(impactLow, now, now + 0.36);

    const shriekGain = this.context.createGain();
    shriekGain.gain.setValueAtTime(0.0001, now + 0.02);
    shriekGain.gain.exponentialRampToValueAtTime(0.22, now + 0.08);
    shriekGain.gain.linearRampToValueAtTime(0.18, now + 0.44);
    shriekGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.16);
    shriekGain.connect(masterGain);

    const shriekA = this.context.createOscillator();
    shriekA.type = 'sawtooth';
    shriekA.frequency.setValueAtTime(712, now + 0.02);
    shriekA.frequency.linearRampToValueAtTime(1060, now + 0.3);
    shriekA.frequency.linearRampToValueAtTime(804, now + 0.92);
    shriekA.connect(shriekGain);

    const shriekB = this.context.createOscillator();
    shriekB.type = 'triangle';
    shriekB.frequency.setValueAtTime(980, now + 0.03);
    shriekB.frequency.linearRampToValueAtTime(1360, now + 0.26);
    shriekB.frequency.linearRampToValueAtTime(920, now + 0.86);
    shriekB.connect(shriekGain);

    this.startSource(shriekA, now + 0.02, now + 1.18);
    this.startSource(shriekB, now + 0.03, now + 1.12);

    const raspSource = this.context.createBufferSource();
    raspSource.buffer = this.noiseBuffer;
    const raspHighpass = this.context.createBiquadFilter();
    raspHighpass.type = 'highpass';
    raspHighpass.frequency.value = 1240;
    const raspBand = this.context.createBiquadFilter();
    raspBand.type = 'bandpass';
    raspBand.frequency.setValueAtTime(2860, now + 0.02);
    raspBand.frequency.linearRampToValueAtTime(2140, now + 0.76);
    raspBand.Q.value = 1.3;
    const raspGain = this.context.createGain();
    raspGain.gain.setValueAtTime(0.0001, now + 0.01);
    raspGain.gain.exponentialRampToValueAtTime(0.24, now + 0.05);
    raspGain.gain.linearRampToValueAtTime(0.14, now + 0.42);
    raspGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.06);
    raspSource.connect(raspHighpass);
    raspHighpass.connect(raspBand);
    raspBand.connect(raspGain);
    raspGain.connect(masterGain);
    this.startSource(raspSource, now + 0.01, now + 1.1);

    const chatterGain = this.context.createGain();
    chatterGain.gain.setValueAtTime(0.0001, now + 0.12);
    chatterGain.gain.exponentialRampToValueAtTime(0.1, now + 0.18);
    chatterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.68);
    chatterGain.connect(masterGain);

    const chatter = this.context.createOscillator();
    chatter.type = 'square';
    chatter.frequency.setValueAtTime(18, now + 0.12);
    chatter.frequency.linearRampToValueAtTime(30, now + 0.52);
    chatter.connect(chatterGain);
    this.startSource(chatter, now + 0.12, now + 0.72);
  }

  private startSource(
    source: AudioScheduledSourceNode,
    startTime: number,
    stopTime: number,
  ): void {
    this.activeSources.add(source);
    source.addEventListener('ended', () => {
      this.activeSources.delete(source);
    });
    source.start(startTime);
    source.stop(stopTime);
  }

  private stopAllSources(): void {
    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Ignore sources that already ended.
      }
    });
    this.activeSources.clear();
  }
}

function createNoiseBuffer(context: AudioContext, durationSeconds: number): AudioBuffer {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < frameCount; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * (0.74 + Math.random() * 0.26);
  }

  return buffer;
}
