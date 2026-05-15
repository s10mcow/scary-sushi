interface PowerEventAudioCtor {
  new (): AudioContext;
}

export class PowerEventAudio {
  private readonly context?: AudioContext;
  private readonly masterGain?: GainNode;
  private readonly noiseBuffer?: AudioBuffer;
  private readonly activeSources = new Set<AudioScheduledSourceNode>();

  constructor() {
    const AudioContextCtor = (
      window.AudioContext
      || (window as Window & { webkitAudioContext?: PowerEventAudioCtor }).webkitAudioContext
    );

    if (!AudioContextCtor) {
      return;
    }

    this.context = new AudioContextCtor();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.24;
    this.masterGain.connect(this.context.destination);
    this.noiseBuffer = createNoiseBuffer(this.context, 2.2);
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

  playZap(): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const now = this.context.currentTime + 0.01;
    const crackGain = this.context.createGain();
    crackGain.gain.setValueAtTime(0.0001, now);
    crackGain.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
    crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    crackGain.connect(this.masterGain);

    const crackSource = this.context.createBufferSource();
    crackSource.buffer = this.noiseBuffer;
    const crackHighpass = this.context.createBiquadFilter();
    crackHighpass.type = 'highpass';
    crackHighpass.frequency.value = 1850;
    crackSource.connect(crackHighpass);
    crackHighpass.connect(crackGain);
    this.startSource(crackSource, now, now + 0.24);

    const zapTone = this.context.createOscillator();
    zapTone.type = 'sawtooth';
    zapTone.frequency.setValueAtTime(980, now);
    zapTone.frequency.exponentialRampToValueAtTime(320, now + 0.18);
    zapTone.connect(crackGain);
    this.startSource(zapTone, now, now + 0.2);
  }

  playOutage(): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    this.stopAllSources();

    const now = this.context.currentTime + 0.01;

    const slamGain = this.context.createGain();
    slamGain.gain.setValueAtTime(0.0001, now);
    slamGain.gain.exponentialRampToValueAtTime(0.32, now + 0.016);
    slamGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    slamGain.connect(this.masterGain);

    const slamLow = this.context.createOscillator();
    slamLow.type = 'triangle';
    slamLow.frequency.setValueAtTime(128, now);
    slamLow.frequency.exponentialRampToValueAtTime(46, now + 0.92);
    slamLow.connect(slamGain);
    this.startSource(slamLow, now, now + 1.25);

    const crackleSource = this.context.createBufferSource();
    crackleSource.buffer = this.noiseBuffer;
    const crackleBand = this.context.createBiquadFilter();
    crackleBand.type = 'bandpass';
    crackleBand.frequency.setValueAtTime(2800, now);
    crackleBand.frequency.linearRampToValueAtTime(1800, now + 0.55);
    crackleBand.Q.value = 1.1;
    const crackleGain = this.context.createGain();
    crackleGain.gain.setValueAtTime(0.0001, now);
    crackleGain.gain.exponentialRampToValueAtTime(0.28, now + 0.03);
    crackleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    crackleSource.connect(crackleBand);
    crackleBand.connect(crackleGain);
    crackleGain.connect(this.masterGain);
    this.startSource(crackleSource, now, now + 0.82);

    const humGain = this.context.createGain();
    humGain.gain.setValueAtTime(0.0001, now + 0.06);
    humGain.gain.exponentialRampToValueAtTime(0.09, now + 0.14);
    humGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
    humGain.connect(this.masterGain);

    const hum = this.context.createOscillator();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(132, now + 0.06);
    hum.frequency.exponentialRampToValueAtTime(38, now + 1.1);
    hum.connect(humGain);
    this.startSource(hum, now + 0.06, now + 1.52);
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
    channel[index] = (Math.random() * 2 - 1) * (0.72 + Math.random() * 0.28);
  }

  return buffer;
}
