interface GameplaySfxAudioCtor {
  new (): AudioContext;
}

export type OfficeJumpscareCue =
  | 'stomp-roar'
  | 'beak-clack'
  | 'wing-slam'
  | 'guitar-screech'
  | 'broken-crawl'
  | 'ear-snap'
  | 'drum-slam'
  | 'hat-blackout'
  | 'bear-grab'
  | 'hook-scrape'
  | 'curtain-snap'
  | 'pirate-spin';

export class GameplaySfxAudio {
  private readonly context?: AudioContext;
  private readonly masterGain?: GainNode;
  private readonly noiseBuffer?: AudioBuffer;
  private readonly activeSources = new Set<AudioScheduledSourceNode>();
  private footstepCooldown = 0;
  private footstepSide = 0;
  private ballPitRustleCooldown = 0;

  constructor() {
    const AudioContextCtor = (
      window.AudioContext
      || (window as Window & { webkitAudioContext?: GameplaySfxAudioCtor }).webkitAudioContext
    );

    if (!AudioContextCtor) {
      return;
    }

    this.context = new AudioContextCtor();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.2;
    this.masterGain.connect(this.context.destination);
    this.noiseBuffer = createNoiseBuffer(this.context, 2.4);
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

  updateFootsteps(deltaSeconds: number, moving: boolean, sprinting: boolean): void {
    if (!moving) {
      this.footstepCooldown = 0;
      return;
    }

    this.footstepCooldown -= deltaSeconds;
    if (this.footstepCooldown > 0) {
      return;
    }

    this.playFootstep(sprinting);
    this.footstepCooldown = sprinting ? 0.31 : 0.44;
  }

  updateBallPitRustle(deltaSeconds: number, active: boolean): void {
    if (!active) {
      this.ballPitRustleCooldown = 0;
      return;
    }

    this.ballPitRustleCooldown -= deltaSeconds;
    if (this.ballPitRustleCooldown > 0) {
      return;
    }

    this.playBallPitRustle(false);
    this.ballPitRustleCooldown = 0.16 + Math.random() * 0.1;
  }

  playBallPitDive(): void {
    this.playBallPitRustle(true);
  }

  playSecurityDoor(open: boolean): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const now = this.context.currentTime + 0.01;
    const duration = open ? 0.92 : 0.76;
    const hissGain = this.context.createGain();
    hissGain.gain.setValueAtTime(0.0001, now);
    hissGain.gain.exponentialRampToValueAtTime(0.16, now + 0.04);
    hissGain.gain.linearRampToValueAtTime(0.1, now + duration * 0.74);
    hissGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    hissGain.connect(this.masterGain);

    const hiss = this.context.createBufferSource();
    hiss.buffer = this.noiseBuffer;
    hiss.playbackRate.value = open ? 0.82 : 0.96;

    const airBand = this.context.createBiquadFilter();
    airBand.type = 'bandpass';
    airBand.frequency.setValueAtTime(open ? 760 : 980, now);
    airBand.frequency.linearRampToValueAtTime(open ? 1280 : 640, now + duration);
    airBand.Q.value = 0.9;

    hiss.connect(airBand);
    airBand.connect(hissGain);
    this.startSource(hiss, now, now + duration);

    const motorGain = this.context.createGain();
    motorGain.gain.setValueAtTime(0.0001, now);
    motorGain.gain.exponentialRampToValueAtTime(0.055, now + 0.06);
    motorGain.gain.linearRampToValueAtTime(0.042, now + duration * 0.68);
    motorGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    motorGain.connect(this.masterGain);

    const motor = this.context.createOscillator();
    motor.type = 'sawtooth';
    motor.frequency.setValueAtTime(open ? 86 : 118, now);
    motor.frequency.exponentialRampToValueAtTime(open ? 132 : 68, now + duration);
    motor.connect(motorGain);
    this.startSource(motor, now, now + duration);

    this.playMetalThud(now + duration - 0.04, open ? 0.09 : 0.14, open ? 145 : 96);
  }

  playClosetDoor(open: boolean): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const now = this.context.currentTime + 0.01;
    const duration = open ? 0.54 : 0.38;
    const creakGain = this.context.createGain();
    creakGain.gain.setValueAtTime(0.0001, now);
    creakGain.gain.exponentialRampToValueAtTime(open ? 0.08 : 0.065, now + 0.035);
    creakGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    creakGain.connect(this.masterGain);

    const scrape = this.context.createBufferSource();
    scrape.buffer = this.noiseBuffer;
    scrape.playbackRate.value = open ? 0.58 : 0.72;

    const scrapeBand = this.context.createBiquadFilter();
    scrapeBand.type = 'bandpass';
    scrapeBand.frequency.setValueAtTime(open ? 410 : 620, now);
    scrapeBand.frequency.linearRampToValueAtTime(open ? 860 : 340, now + duration);
    scrapeBand.Q.value = 1.4;

    scrape.connect(scrapeBand);
    scrapeBand.connect(creakGain);
    this.startSource(scrape, now, now + duration);

    const hingeGain = this.context.createGain();
    hingeGain.gain.setValueAtTime(0.0001, now + 0.03);
    hingeGain.gain.exponentialRampToValueAtTime(0.028, now + 0.09);
    hingeGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    hingeGain.connect(this.masterGain);

    const hinge = this.context.createOscillator();
    hinge.type = 'sine';
    hinge.frequency.setValueAtTime(open ? 230 : 330, now + 0.03);
    hinge.frequency.linearRampToValueAtTime(open ? 390 : 190, now + duration);
    hinge.connect(hingeGain);
    this.startSource(hinge, now + 0.03, now + duration);

    this.playMetalThud(now + duration - 0.02, open ? 0.035 : 0.075, open ? 210 : 150);
  }

  playSmallPanel(open: boolean): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const now = this.context.currentTime + 0.01;
    const clickGain = this.context.createGain();
    clickGain.gain.setValueAtTime(0.0001, now);
    clickGain.gain.exponentialRampToValueAtTime(open ? 0.065 : 0.09, now + 0.006);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    clickGain.connect(this.masterGain);

    const click = this.context.createBufferSource();
    click.buffer = this.noiseBuffer;
    click.playbackRate.value = 1.8;

    const clickFilter = this.context.createBiquadFilter();
    clickFilter.type = 'highpass';
    clickFilter.frequency.value = 1100;

    click.connect(clickFilter);
    clickFilter.connect(clickGain);
    this.startSource(click, now, now + 0.1);

    if (!open) {
      this.playMetalThud(now + 0.05, 0.05, 180);
    }
  }

  playPrizeWheelClick(intensity = 1): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const clampedIntensity = Math.max(0, Math.min(1, intensity));
    const now = this.context.currentTime + 0.006;
    const clickGain = this.context.createGain();
    clickGain.gain.setValueAtTime(0.0001, now);
    clickGain.gain.exponentialRampToValueAtTime(0.035 + clampedIntensity * 0.075, now + 0.004);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    clickGain.connect(this.masterGain);

    const click = this.context.createBufferSource();
    click.buffer = this.noiseBuffer;
    click.playbackRate.value = 2.35 + clampedIntensity * 0.75;

    const clickFilter = this.context.createBiquadFilter();
    clickFilter.type = 'bandpass';
    clickFilter.frequency.value = 1450 + clampedIntensity * 900;
    clickFilter.Q.value = 3.2;

    click.connect(clickFilter);
    clickFilter.connect(clickGain);
    this.startSource(click, now, now + 0.08);

    const tickTone = this.context.createOscillator();
    const tickToneGain = this.context.createGain();
    tickTone.type = 'square';
    tickTone.frequency.setValueAtTime(620 + clampedIntensity * 260, now);
    tickToneGain.gain.setValueAtTime(0.0001, now);
    tickToneGain.gain.exponentialRampToValueAtTime(0.012 + clampedIntensity * 0.018, now + 0.004);
    tickToneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    tickTone.connect(tickToneGain);
    tickToneGain.connect(this.masterGain);
    this.startSource(tickTone, now, now + 0.05);
  }

  playGlassCrash(): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const now = this.context.currentTime + 0.01;
    const masterGain = this.masterGain;
    const crashGain = this.context.createGain();
    crashGain.gain.setValueAtTime(0.0001, now);
    crashGain.gain.exponentialRampToValueAtTime(0.34, now + 0.012);
    crashGain.gain.linearRampToValueAtTime(0.18, now + 0.18);
    crashGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.74);
    crashGain.connect(this.masterGain);

    const shatter = this.context.createBufferSource();
    shatter.buffer = this.noiseBuffer;
    shatter.playbackRate.value = 1.9;
    const highpass = this.context.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 1800;
    const sparkle = this.context.createBiquadFilter();
    sparkle.type = 'bandpass';
    sparkle.frequency.value = 4200;
    sparkle.Q.value = 2.4;
    shatter.connect(highpass);
    highpass.connect(sparkle);
    sparkle.connect(crashGain);
    this.startSource(shatter, now, now + 0.78);

    [2450, 3120, 3860, 4680, 5520].forEach((frequency, index) => {
      const shardGain = this.context?.createGain();
      const shard = this.context?.createOscillator();
      if (!shardGain || !shard) {
        return;
      }

      const start = now + index * 0.018;
      shardGain.gain.setValueAtTime(0.0001, start);
      shardGain.gain.exponentialRampToValueAtTime(0.045, start + 0.006);
      shardGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22 + index * 0.035);
      shardGain.connect(masterGain);
      shard.type = 'triangle';
      shard.frequency.setValueAtTime(frequency, start);
      shard.frequency.exponentialRampToValueAtTime(frequency * 0.72, start + 0.2);
      shard.connect(shardGain);
      this.startSource(shard, start, start + 0.28 + index * 0.035);
    });
  }

  playFoxyClank(intensity: number): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const clampedIntensity = Math.max(0, Math.min(1, intensity));
    const now = this.context.currentTime + 0.006;
    const clankGain = this.context.createGain();
    clankGain.gain.setValueAtTime(0.0001, now);
    clankGain.gain.exponentialRampToValueAtTime(0.045 + clampedIntensity * 0.24, now + 0.008);
    clankGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    clankGain.connect(this.masterGain);

    const clank = this.context.createBufferSource();
    clank.buffer = this.noiseBuffer;
    clank.playbackRate.value = 0.82 + clampedIntensity * 0.95;

    const metalFilter = this.context.createBiquadFilter();
    metalFilter.type = 'bandpass';
    metalFilter.frequency.setValueAtTime(620 + clampedIntensity * 1420, now);
    metalFilter.Q.value = 2.8;
    clank.connect(metalFilter);
    metalFilter.connect(clankGain);
    this.startSource(clank, now, now + 0.2);

    this.playMetalThud(now + 0.01, 0.05 + clampedIntensity * 0.12, 96 + clampedIntensity * 72);
  }

  playOfficeJumpscareCue(cue: OfficeJumpscareCue): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const now = this.context.currentTime + 0.01;
    const masterGain = this.masterGain;
    const cueSettings: Record<OfficeJumpscareCue, {
      low: number;
      high: number;
      length: number;
      noise: number;
      hits: number[];
      scrape?: boolean;
      stutter?: boolean;
    }> = {
      'stomp-roar': { low: 58, high: 134, length: 1.35, noise: 0.25, hits: [0.02, 0.36, 0.82] },
      'beak-clack': { low: 340, high: 920, length: 0.86, noise: 0.16, hits: [0.02, 0.16, 0.31, 0.58] },
      'wing-slam': { low: 92, high: 280, length: 1.05, noise: 0.28, hits: [0.1, 0.5, 0.74] },
      'guitar-screech': { low: 420, high: 1480, length: 1.28, noise: 0.2, hits: [0.22, 0.66] },
      'broken-crawl': { low: 76, high: 420, length: 1.55, noise: 0.24, hits: [0.05, 0.29, 0.53, 0.77, 1.0], stutter: true },
      'ear-snap': { low: 210, high: 1180, length: 0.98, noise: 0.18, hits: [0.12, 0.52, 0.7] },
      'drum-slam': { low: 48, high: 120, length: 1.42, noise: 0.22, hits: [0.02, 0.28, 0.54, 0.83] },
      'hat-blackout': { low: 62, high: 760, length: 1.25, noise: 0.2, hits: [0.16, 0.64, 0.78], stutter: true },
      'bear-grab': { low: 52, high: 180, length: 1.22, noise: 0.27, hits: [0.14, 0.46, 0.72] },
      'hook-scrape': { low: 180, high: 1320, length: 1.1, noise: 0.26, hits: [0.4, 0.72], scrape: true },
      'curtain-snap': { low: 118, high: 860, length: 1.05, noise: 0.22, hits: [0.08, 0.42, 0.69] },
      'pirate-spin': { low: 160, high: 980, length: 1.34, noise: 0.18, hits: [0.18, 0.48, 0.88] },
    };
    const settings = cueSettings[cue];

    const roarGain = this.context.createGain();
    roarGain.gain.setValueAtTime(0.0001, now);
    roarGain.gain.exponentialRampToValueAtTime(0.18 + settings.noise * 0.34, now + 0.045);
    roarGain.gain.linearRampToValueAtTime(0.12, now + settings.length * 0.68);
    roarGain.gain.exponentialRampToValueAtTime(0.0001, now + settings.length);
    roarGain.connect(masterGain);

    const roar = this.context.createOscillator();
    roar.type = cue === 'guitar-screech' || cue === 'beak-clack' ? 'sawtooth' : 'triangle';
    roar.frequency.setValueAtTime(settings.high, now);
    roar.frequency.exponentialRampToValueAtTime(settings.low, now + settings.length);
    roar.connect(roarGain);
    this.startSource(roar, now, now + settings.length);

    const noise = this.context.createBufferSource();
    noise.buffer = this.noiseBuffer;
    noise.playbackRate.value = settings.scrape ? 0.82 : settings.stutter ? 1.45 : 1.08;
    const filter = this.context.createBiquadFilter();
    filter.type = settings.scrape ? 'highpass' : 'bandpass';
    filter.frequency.setValueAtTime(settings.scrape ? 880 : settings.high * 1.65, now);
    filter.frequency.linearRampToValueAtTime(settings.scrape ? 3200 : settings.low * 5.2, now + settings.length);
    filter.Q.value = settings.scrape ? 0.65 : 1.2;
    const noiseGain = this.context.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(settings.noise, now + 0.025);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + settings.length);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);
    this.startSource(noise, now, now + settings.length);

    settings.hits.forEach((offset, index) => {
      this.playMetalThud(now + offset, index === settings.hits.length - 1 ? 0.13 : 0.08, settings.low + index * 24);
    });

    if (cue === 'guitar-screech' || cue === 'pirate-spin') {
      const trillGain = this.context.createGain();
      trillGain.gain.setValueAtTime(0.0001, now + 0.1);
      trillGain.gain.exponentialRampToValueAtTime(0.09, now + 0.18);
      trillGain.gain.exponentialRampToValueAtTime(0.0001, now + settings.length);
      trillGain.connect(masterGain);

      const trill = this.context.createOscillator();
      trill.type = 'square';
      trill.frequency.setValueAtTime(cue === 'guitar-screech' ? 9 : 6, now + 0.1);
      trill.frequency.linearRampToValueAtTime(cue === 'guitar-screech' ? 22 : 13, now + settings.length);
      trill.connect(trillGain);
      this.startSource(trill, now + 0.1, now + settings.length);
    }
  }

  private playFootstep(sprinting: boolean): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const now = this.context.currentTime + 0.006;
    const length = sprinting ? 0.16 : 0.2;
    const stepGain = this.context.createGain();
    const sideLevel = this.footstepSide === 0 ? 1 : 0.92;
    this.footstepSide = 1 - this.footstepSide;
    stepGain.gain.setValueAtTime(0.0001, now);
    stepGain.gain.exponentialRampToValueAtTime((sprinting ? 0.18 : 0.135) * sideLevel, now + 0.012);
    stepGain.gain.exponentialRampToValueAtTime(0.0001, now + length);
    stepGain.connect(this.masterGain);

    const scrape = this.context.createBufferSource();
    scrape.buffer = this.noiseBuffer;
    scrape.playbackRate.value = 1.15 + Math.random() * 0.35 + (sprinting ? 0.1 : 0);

    const highpass = this.context.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 110;

    const lowpass = this.context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 840 + Math.random() * 180;
    lowpass.Q.value = 0.7;

    scrape.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(stepGain);
    this.startSource(scrape, now, now + length);

    const thumpGain = this.context.createGain();
    thumpGain.gain.setValueAtTime(0.0001, now);
    thumpGain.gain.exponentialRampToValueAtTime(sprinting ? 0.048 : 0.034, now + 0.01);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    thumpGain.connect(this.masterGain);

    const thump = this.context.createOscillator();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(95 + Math.random() * 20, now);
    thump.frequency.exponentialRampToValueAtTime(58, now + 0.1);
    thump.connect(thumpGain);
    this.startSource(thump, now, now + 0.12);
  }

  private playBallPitRustle(strong: boolean): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const now = this.context.currentTime + 0.006;
    const duration = strong ? 0.72 : 0.28;
    const rustleGain = this.context.createGain();
    rustleGain.gain.setValueAtTime(0.0001, now);
    rustleGain.gain.exponentialRampToValueAtTime(strong ? 0.24 : 0.13, now + 0.018);
    rustleGain.gain.linearRampToValueAtTime(strong ? 0.16 : 0.075, now + duration * 0.72);
    rustleGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    rustleGain.connect(this.masterGain);

    const scrape = this.context.createBufferSource();
    scrape.buffer = this.noiseBuffer;
    scrape.playbackRate.value = strong ? 0.54 : 0.72 + Math.random() * 0.16;

    const band = this.context.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(260 + Math.random() * 80, now);
    band.frequency.linearRampToValueAtTime(780 + Math.random() * 240, now + duration);
    band.Q.value = 0.9;

    scrape.connect(band);
    band.connect(rustleGain);
    this.startSource(scrape, now, now + duration);

    const wobbleGain = this.context.createGain();
    wobbleGain.gain.setValueAtTime(0.0001, now);
    wobbleGain.gain.exponentialRampToValueAtTime(strong ? 0.06 : 0.028, now + 0.025);
    wobbleGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    wobbleGain.connect(this.masterGain);

    const wobble = this.context.createOscillator();
    wobble.type = 'triangle';
    wobble.frequency.setValueAtTime(85 + Math.random() * 32, now);
    wobble.frequency.linearRampToValueAtTime(132 + Math.random() * 46, now + duration * 0.55);
    wobble.frequency.linearRampToValueAtTime(70 + Math.random() * 20, now + duration);
    wobble.connect(wobbleGain);
    this.startSource(wobble, now, now + duration);
  }

  private playMetalThud(startTime: number, level: number, frequency: number): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const thudGain = this.context.createGain();
    thudGain.gain.setValueAtTime(0.0001, startTime);
    thudGain.gain.exponentialRampToValueAtTime(level, startTime + 0.006);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.16);
    thudGain.connect(this.masterGain);

    const thud = this.context.createOscillator();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(frequency, startTime);
    thud.frequency.exponentialRampToValueAtTime(42, startTime + 0.14);
    thud.connect(thudGain);
    this.startSource(thud, startTime, startTime + 0.17);
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
    channel[index] = (Math.random() * 2 - 1) * (0.62 + Math.random() * 0.38);
  }

  return buffer;
}
