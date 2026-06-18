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
  private chapterSevenAmbientMode: 'day' | 'night' | null = null;
  private chapterSevenAmbientSources: AudioScheduledSourceNode[] = [];
  private chapterSevenAmbientGain?: GainNode;
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
    this.stopChapterSevenAmbient();
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

  playBlueStomp(): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const now = this.context.currentTime + 0.006;
    this.playMetalThud(now, 0.16, 58);

    const boomGain = this.context.createGain();
    boomGain.gain.setValueAtTime(0.0001, now);
    boomGain.gain.exponentialRampToValueAtTime(0.14, now + 0.018);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    boomGain.connect(this.masterGain);

    const boom = this.context.createOscillator();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(72 + Math.random() * 8, now);
    boom.frequency.exponentialRampToValueAtTime(32, now + 0.28);
    boom.connect(boomGain);
    this.startSource(boom, now, now + 0.36);

    const dustGain = this.context.createGain();
    dustGain.gain.setValueAtTime(0.0001, now);
    dustGain.gain.exponentialRampToValueAtTime(0.055, now + 0.025);
    dustGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    dustGain.connect(this.masterGain);

    const dust = this.context.createBufferSource();
    dust.buffer = this.noiseBuffer;
    dust.playbackRate.value = 0.48 + Math.random() * 0.08;
    const lowpass = this.context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 310 + Math.random() * 90;
    dust.connect(lowpass);
    lowpass.connect(dustGain);
    this.startSource(dust, now, now + 0.24);
  }

  playGoldenBoriBoom(): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const now = this.context.currentTime + 0.006;
    this.playMetalThud(now, 0.22, 46);

    const boomGain = this.context.createGain();
    boomGain.gain.setValueAtTime(0.0001, now);
    boomGain.gain.exponentialRampToValueAtTime(0.2, now + 0.016);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
    boomGain.connect(this.masterGain);

    const boom = this.context.createOscillator();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(54 + Math.random() * 6, now);
    boom.frequency.exponentialRampToValueAtTime(23, now + 0.38);
    boom.connect(boomGain);
    this.startSource(boom, now, now + 0.48);

    const gritGain = this.context.createGain();
    gritGain.gain.setValueAtTime(0.0001, now);
    gritGain.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
    gritGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    gritGain.connect(this.masterGain);

    const grit = this.context.createBufferSource();
    grit.buffer = this.noiseBuffer;
    grit.playbackRate.value = 0.34 + Math.random() * 0.05;
    const lowpass = this.context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 240 + Math.random() * 60;
    grit.connect(lowpass);
    lowpass.connect(gritGain);
    this.startSource(grit, now, now + 0.3);
  }

  playGrandfatherClockChime(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime + 0.012;
    const bellHits = [
      { frequency: 155.56, delay: 0, gain: 0.28 },
      { frequency: 154.2, delay: 0.72, gain: 0.3 },
      { frequency: 156.4, delay: 1.44, gain: 0.29 },
      { frequency: 153.6, delay: 2.16, gain: 0.32 },
    ];
    bellHits.forEach(({ frequency, delay, gain: peakGain }) => {
      const start = now + delay;
      const duration = 1.95;

      const strikeGain = this.context!.createGain();
      strikeGain.gain.setValueAtTime(0.0001, start);
      strikeGain.gain.exponentialRampToValueAtTime(peakGain * 0.16, start + 0.003);
      strikeGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.045);
      strikeGain.connect(this.masterGain!);

      const strike = this.context!.createOscillator();
      strike.type = 'triangle';
      strike.frequency.setValueAtTime(frequency * 7.4, start);
      strike.frequency.exponentialRampToValueAtTime(frequency * 3.8, start + 0.04);
      strike.connect(strikeGain);
      this.startSource(strike, start, start + 0.05);

      [
        { ratio: 1, level: 1, decay: 1 },
        { ratio: 2.01, level: 0.42, decay: 0.74 },
        { ratio: 2.87, level: 0.28, decay: 0.56 },
        { ratio: 4.18, level: 0.15, decay: 0.36 },
      ].forEach((partial) => {
        const partialGain = this.context!.createGain();
        partialGain.gain.setValueAtTime(0.0001, start);
        partialGain.gain.exponentialRampToValueAtTime(peakGain * partial.level, start + 0.018);
        partialGain.gain.exponentialRampToValueAtTime(peakGain * partial.level * 0.16, start + 0.34);
        partialGain.gain.exponentialRampToValueAtTime(0.0001, start + duration * partial.decay);
        partialGain.connect(this.masterGain!);

        const partialTone = this.context!.createOscillator();
        partialTone.type = 'sine';
        partialTone.frequency.setValueAtTime(frequency * partial.ratio, start);
        partialTone.frequency.exponentialRampToValueAtTime(frequency * partial.ratio * 0.996, start + duration * partial.decay);
        partialTone.connect(partialGain);
        this.startSource(partialTone, start, start + duration * partial.decay);
      });
    });
  }

  playGreenSqueak(): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const now = this.context.currentTime + 0.006;
    [0, 0.14, 0.26].forEach((offset, index) => {
      const start = now + offset;
      const gain = this.context!.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.038 + index * 0.004, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.155);
      gain.connect(this.masterGain!);

      const squeak = this.context!.createOscillator();
      squeak.type = 'sawtooth';
      squeak.frequency.setValueAtTime(540 + Math.random() * 70, start);
      squeak.frequency.linearRampToValueAtTime(1120 + Math.random() * 120, start + 0.055);
      squeak.frequency.exponentialRampToValueAtTime(470 + Math.random() * 80, start + 0.155);

      const reed = this.context!.createBiquadFilter();
      reed.type = 'bandpass';
      reed.frequency.setValueAtTime(980 + Math.random() * 220, start);
      reed.Q.value = 8.4;
      squeak.connect(reed);
      reed.connect(gain);
      this.startSource(squeak, start, start + 0.17);
    });

    const airGain = this.context.createGain();
    airGain.gain.setValueAtTime(0.0001, now);
    airGain.gain.exponentialRampToValueAtTime(0.01, now + 0.02);
    airGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
    airGain.connect(this.masterGain);

    const air = this.context.createBufferSource();
    air.buffer = this.noiseBuffer;
    air.playbackRate.value = 1.35 + Math.random() * 0.2;
    const highpass = this.context.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 760;
    const band = this.context.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1380 + Math.random() * 240;
    band.Q.value = 7.5;
    air.connect(highpass);
    highpass.connect(band);
    band.connect(airGain);
    this.startSource(air, now, now + 0.36);
  }

  playPossumSqueak(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime + 0.006;
    [0, 0.075].forEach((offset, index) => {
      const start = now + offset;
      const gain = this.context!.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.085 - index * 0.018, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
      gain.connect(this.masterGain!);

      const squeak = this.context!.createOscillator();
      squeak.type = 'sine';
      squeak.frequency.setValueAtTime(920 + Math.random() * 90, start);
      squeak.frequency.linearRampToValueAtTime(1320 + Math.random() * 120, start + 0.036);
      squeak.frequency.exponentialRampToValueAtTime(760 + Math.random() * 70, start + 0.11);
      squeak.connect(gain);
      this.startSource(squeak, start, start + 0.12);
    });
  }

  playSpaceshipAlarm(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime + 0.012;
    for (let index = 0; index < 6; index += 1) {
      const start = now + index * 0.46;
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.035);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.22);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.36);
      gain.connect(this.masterGain);

      const alarm = this.context.createOscillator();
      alarm.type = 'sawtooth';
      alarm.frequency.setValueAtTime(620, start);
      alarm.frequency.linearRampToValueAtTime(380, start + 0.34);
      alarm.connect(gain);
      this.startSource(alarm, start, start + 0.38);
    }
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

  playSecurityDoorCrash(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime + 0.5;
    this.playMetalThud(now, 0.24, 72);
    this.playMetalThud(now + 0.16, 0.12, 92);
    this.playMetalThud(now + 0.32, 0.07, 118);
  }

  playForcedSecurityDoorScreech(): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const now = this.context.currentTime + 0.012;
    const length = 1.85;
    const screechGain = this.context.createGain();
    screechGain.gain.setValueAtTime(0.0001, now);
    screechGain.gain.exponentialRampToValueAtTime(0.32, now + 0.035);
    screechGain.gain.linearRampToValueAtTime(0.22, now + 1.05);
    screechGain.gain.exponentialRampToValueAtTime(0.0001, now + length);
    screechGain.connect(this.masterGain);

    const screech = this.context.createOscillator();
    screech.type = 'sawtooth';
    screech.frequency.setValueAtTime(1860, now);
    screech.frequency.exponentialRampToValueAtTime(620, now + length);

    const scrapeBand = this.context.createBiquadFilter();
    scrapeBand.type = 'bandpass';
    scrapeBand.frequency.setValueAtTime(2480, now);
    scrapeBand.frequency.linearRampToValueAtTime(960, now + length);
    scrapeBand.Q.value = 5.8;
    screech.connect(scrapeBand);
    scrapeBand.connect(screechGain);
    this.startSource(screech, now, now + length);

    const grindGain = this.context.createGain();
    grindGain.gain.setValueAtTime(0.0001, now);
    grindGain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    grindGain.gain.linearRampToValueAtTime(0.15, now + 1.2);
    grindGain.gain.exponentialRampToValueAtTime(0.0001, now + length);
    grindGain.connect(this.masterGain);

    const grind = this.context.createBufferSource();
    grind.buffer = this.noiseBuffer;
    grind.playbackRate.value = 1.35;
    const grindFilter = this.context.createBiquadFilter();
    grindFilter.type = 'highpass';
    grindFilter.frequency.setValueAtTime(1320, now);
    grindFilter.frequency.linearRampToValueAtTime(3600, now + 0.42);
    grindFilter.frequency.linearRampToValueAtTime(920, now + length);
    grind.connect(grindFilter);
    grindFilter.connect(grindGain);
    this.startSource(grind, now, now + length);

    this.playMetalThud(now + 0.08, 0.16, 96);
    this.playMetalThud(now + 0.72, 0.11, 132);
    this.playMetalThud(now + 1.34, 0.08, 168);
  }

  playAnimatronicDoorLaugh(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime + 0.02;
    [0, 0.24, 0.48].forEach((offset, index) => {
      const start = now + offset;
      const gain = this.context!.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.11 - index * 0.018, start + 0.04);
      gain.gain.linearRampToValueAtTime(0.07 - index * 0.012, start + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.38);
      gain.connect(this.masterGain!);

      const voice = this.context!.createOscillator();
      voice.type = 'sawtooth';
      voice.frequency.setValueAtTime(156 - index * 12, start);
      voice.frequency.exponentialRampToValueAtTime(92 - index * 6, start + 0.34);

      const throat = this.context!.createBiquadFilter();
      throat.type = 'bandpass';
      throat.frequency.setValueAtTime(520 + index * 80, start);
      throat.Q.value = 3.6;
      voice.connect(throat);
      throat.connect(gain);
      this.startSource(voice, start, start + 0.4);
    });
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

  playPrinterPrint(): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const now = this.context.currentTime + 0.012;
    const whirrEnd = now + 1.0;
    const paperStart = now + 0.42;
    const paperEnd = now + 1.54;

    const whirrGain = this.context.createGain();
    whirrGain.gain.setValueAtTime(0.0001, now);
    whirrGain.gain.exponentialRampToValueAtTime(0.075, now + 0.08);
    whirrGain.gain.linearRampToValueAtTime(0.062, whirrEnd - 0.12);
    whirrGain.gain.exponentialRampToValueAtTime(0.0001, whirrEnd);
    whirrGain.connect(this.masterGain);

    const motor = this.context.createOscillator();
    motor.type = 'sawtooth';
    motor.frequency.setValueAtTime(94, now);
    motor.frequency.linearRampToValueAtTime(128, whirrEnd);
    motor.connect(whirrGain);
    this.startSource(motor, now, whirrEnd + 0.03);

    const paper = this.context.createBufferSource();
    paper.buffer = this.noiseBuffer;
    paper.loop = true;
    paper.playbackRate.value = 1.35;

    const paperFilter = this.context.createBiquadFilter();
    paperFilter.type = 'bandpass';
    paperFilter.frequency.setValueAtTime(1150, paperStart);
    paperFilter.frequency.linearRampToValueAtTime(1860, paperEnd);
    paperFilter.Q.value = 1.15;

    const paperGain = this.context.createGain();
    paperGain.gain.setValueAtTime(0.0001, paperStart);
    paperGain.gain.exponentialRampToValueAtTime(0.052, paperStart + 0.06);
    paperGain.gain.linearRampToValueAtTime(0.046, paperEnd - 0.12);
    paperGain.gain.exponentialRampToValueAtTime(0.0001, paperEnd);

    paper.connect(paperFilter);
    paperFilter.connect(paperGain);
    paperGain.connect(this.masterGain);
    this.startSource(paper, paperStart, paperEnd + 0.04);

    [0.56, 0.78, 1.02, 1.28].forEach((offset, index) => {
      this.playMetalThud(now + offset, 0.022 + index * 0.004, 260 + index * 42);
    });
  }

  playRunningWater(duration = 0.82): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const now = this.context.currentTime + 0.006;
    const length = Math.max(0.18, duration);
    const waterGain = this.context.createGain();
    waterGain.gain.setValueAtTime(0.0001, now);
    waterGain.gain.exponentialRampToValueAtTime(0.055, now + 0.035);
    waterGain.gain.linearRampToValueAtTime(0.046, now + length * 0.72);
    waterGain.gain.exponentialRampToValueAtTime(0.0001, now + length);
    waterGain.connect(this.masterGain);

    const water = this.context.createBufferSource();
    water.buffer = this.noiseBuffer;
    water.loop = true;
    water.playbackRate.value = 1.55 + Math.random() * 0.08;

    const highpass = this.context.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 520;
    const band = this.context.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1450 + Math.random() * 160;
    band.Q.value = 1.1;
    const lowpass = this.context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3600;

    water.connect(highpass);
    highpass.connect(band);
    band.connect(lowpass);
    lowpass.connect(waterGain);
    this.startSource(water, now, now + length);
  }

  setChapterSevenAmbient(mode: 'day' | 'night' | null): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }
    if (this.chapterSevenAmbientMode === mode) {
      return;
    }

    this.stopChapterSevenAmbient();
    if (!mode) {
      return;
    }

    const now = this.context.currentTime + 0.012;
    const ambientGain = this.context.createGain();
    ambientGain.gain.setValueAtTime(0.0001, now);
    ambientGain.gain.exponentialRampToValueAtTime(mode === 'day' ? 0.16 : 0.058, now + 0.38);
    ambientGain.connect(this.masterGain);
    this.chapterSevenAmbientGain = ambientGain;
    this.chapterSevenAmbientMode = mode;

    if (mode === 'day') {
      this.startChapterSevenDayMusic(now, ambientGain);
    } else {
      this.startChapterSevenNightBed(now, ambientGain);
    }
  }

  stopChapterSevenAmbient(): void {
    if (!this.context) {
      this.chapterSevenAmbientMode = null;
      this.chapterSevenAmbientSources.length = 0;
      this.chapterSevenAmbientGain = undefined;
      return;
    }

    const now = this.context.currentTime;
    if (this.chapterSevenAmbientGain) {
      this.chapterSevenAmbientGain.gain.cancelScheduledValues(now);
      this.chapterSevenAmbientGain.gain.setTargetAtTime(0.0001, now, 0.18);
    }
    this.chapterSevenAmbientSources.forEach((source) => {
      try {
        source.stop(now + 0.55);
      } catch {
        // Ignore sources already stopped by the browser.
      }
      this.activeSources.delete(source);
    });
    this.chapterSevenAmbientSources.length = 0;
    this.chapterSevenAmbientGain = undefined;
    this.chapterSevenAmbientMode = null;
  }

  playChapterSevenCricketChirp(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime + 0.008;
    const chirpCount = 4 + Math.floor(Math.random() * 4);
    for (let index = 0; index < chirpCount; index += 1) {
      const start = now + index * (0.052 + Math.random() * 0.018);
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.027 + Math.random() * 0.014, start + 0.007);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.066);
      gain.connect(this.masterGain);

      const chirp = this.context.createOscillator();
      chirp.type = 'sine';
      chirp.frequency.setValueAtTime(4400 + Math.random() * 560, start);
      chirp.frequency.exponentialRampToValueAtTime(3250 + Math.random() * 420, start + 0.058);
      chirp.connect(gain);
      this.startSource(chirp, start, start + 0.072);
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

  playToySqueak(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime + 0.006;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.13);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    gain.connect(this.masterGain);

    const squeak = this.context.createOscillator();
    squeak.type = 'square';
    squeak.frequency.setValueAtTime(620, now);
    squeak.frequency.exponentialRampToValueAtTime(1180, now + 0.08);
    squeak.frequency.exponentialRampToValueAtTime(540, now + 0.28);
    squeak.connect(gain);
    this.startSource(squeak, now, now + 0.36);
  }

  playStuffiePeep(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime + 0.006;
    [0, 0.055].forEach((offset, index) => {
      const start = now + offset;
      const gain = this.context!.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.15 - index * 0.035, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
      gain.connect(this.masterGain!);

      const peep = this.context!.createOscillator();
      peep.type = 'sine';
      peep.frequency.setValueAtTime(1040 + Math.random() * 90, start);
      peep.frequency.linearRampToValueAtTime(1560 + Math.random() * 120, start + 0.038);
      peep.frequency.exponentialRampToValueAtTime(900 + Math.random() * 80, start + 0.13);
      peep.connect(gain);
      this.startSource(peep, start, start + 0.15);
    });
  }

  playFoxyClank(intensity: number): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const clampedIntensity = Math.max(0, Math.min(1.35, intensity));
    const now = this.context.currentTime + 0.006;
    const clankGain = this.context.createGain();
    clankGain.gain.setValueAtTime(0.0001, now);
    clankGain.gain.exponentialRampToValueAtTime(0.07 + clampedIntensity * 0.34, now + 0.008);
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

    this.playMetalThud(now + 0.01, 0.08 + clampedIntensity * 0.18, 96 + clampedIntensity * 72);
  }

  playFreddyPowerOutMelody(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime + 0.08;
    const melody = [
      { frequency: 196.0, offset: 0 },
      { frequency: 185.0, offset: 0.54 },
      { frequency: 164.81, offset: 1.08 },
      { frequency: 146.83, offset: 1.74 },
      { frequency: 123.47, offset: 2.55 },
      { frequency: 98.0, offset: 3.24 },
      { frequency: 196.0, offset: 4.42 },
      { frequency: 185.0, offset: 5.02 },
      { frequency: 164.81, offset: 5.62 },
      { frequency: 146.83, offset: 6.36 },
      { frequency: 123.47, offset: 7.22 },
      { frequency: 98.0, offset: 7.94 },
      { frequency: 164.81, offset: 9.04 },
      { frequency: 146.83, offset: 9.66 },
      { frequency: 123.47, offset: 10.42 },
      { frequency: 82.41, offset: 11.15 },
    ];

    const reverbBus = this.context.createGain();
    reverbBus.gain.value = 0.56;
    reverbBus.connect(this.masterGain);

    melody.forEach((note, index) => {
      const start = now + note.offset;
      const length = index === melody.length - 1 ? 1.42 : 0.86;
      const noteGain = this.context!.createGain();
      noteGain.gain.setValueAtTime(0.0001, start);
      noteGain.gain.exponentialRampToValueAtTime(0.18, start + 0.012);
      noteGain.gain.exponentialRampToValueAtTime(0.044, start + length * 0.58);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, start + length);
      noteGain.connect(reverbBus);

      const tone = this.context!.createOscillator();
      tone.type = 'triangle';
      tone.frequency.setValueAtTime(note.frequency, start);
      tone.frequency.exponentialRampToValueAtTime(note.frequency * 0.992, start + length);
      tone.connect(noteGain);
      this.startSource(tone, start, start + length);

      const overtoneGain = this.context!.createGain();
      overtoneGain.gain.setValueAtTime(0.0001, start);
      overtoneGain.gain.exponentialRampToValueAtTime(0.052, start + 0.006);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, start + length * 0.42);
      overtoneGain.connect(reverbBus);

      const overtone = this.context!.createOscillator();
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(note.frequency * 2.01, start);
      overtone.connect(overtoneGain);
      this.startSource(overtone, start, start + length * 0.5);
    });

    const humGain = this.context.createGain();
    humGain.gain.setValueAtTime(0.0001, now);
    humGain.gain.exponentialRampToValueAtTime(0.064, now + 0.18);
    humGain.gain.linearRampToValueAtTime(0.044, now + 9.4);
    humGain.gain.exponentialRampToValueAtTime(0.0001, now + 12.4);
    humGain.connect(this.masterGain);

    const hum = this.context.createOscillator();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(49, now);
    hum.frequency.exponentialRampToValueAtTime(34, now + 12.4);
    hum.connect(humGain);
    this.startSource(hum, now, now + 12.4);
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

  private startChapterSevenDayMusic(startTime: number, destination: GainNode): void {
    if (!this.context) {
      return;
    }

    const melodyBus = this.context.createGain();
    melodyBus.gain.value = 1.24;
    melodyBus.connect(destination);
    const echo = this.context.createDelay(0.6);
    echo.delayTime.value = 0.14;
    const echoGain = this.context.createGain();
    echoGain.gain.value = 0.16;
    melodyBus.connect(echo);
    echo.connect(echoGain);
    echoGain.connect(destination);

    const notes = [
      { frequency: 392, offset: 0, length: 0.22 },
      { frequency: 523.25, offset: 0.26, length: 0.2 },
      { frequency: 659.25, offset: 0.52, length: 0.22 },
      { frequency: 783.99, offset: 0.78, length: 0.28 },
      { frequency: 698.46, offset: 1.16, length: 0.2 },
      { frequency: 659.25, offset: 1.42, length: 0.2 },
      { frequency: 587.33, offset: 1.68, length: 0.22 },
      { frequency: 659.25, offset: 1.94, length: 0.34 },
      { frequency: 523.25, offset: 2.42, length: 0.2 },
      { frequency: 659.25, offset: 2.68, length: 0.2 },
      { frequency: 783.99, offset: 2.94, length: 0.22 },
      { frequency: 880, offset: 3.2, length: 0.3 },
      { frequency: 783.99, offset: 3.62, length: 0.2 },
      { frequency: 698.46, offset: 3.88, length: 0.2 },
      { frequency: 659.25, offset: 4.14, length: 0.22 },
      { frequency: 783.99, offset: 4.4, length: 0.42 },
    ];
    const loopLength = 5.18;
    for (let loop = 0; loop < 18; loop += 1) {
      const loopStart = startTime + loop * loopLength;
      [0, 1.28, 2.56, 3.84].forEach((beatOffset) => {
        const beatStart = loopStart + beatOffset;
        const beatGain = this.context!.createGain();
        beatGain.gain.setValueAtTime(0.0001, beatStart);
        beatGain.gain.exponentialRampToValueAtTime(0.042, beatStart + 0.01);
        beatGain.gain.exponentialRampToValueAtTime(0.0001, beatStart + 0.16);
        beatGain.connect(melodyBus);

        const beat = this.context!.createOscillator();
        beat.type = 'triangle';
        beat.frequency.setValueAtTime(130.81, beatStart);
        beat.frequency.exponentialRampToValueAtTime(82.41, beatStart + 0.14);
        beat.connect(beatGain);
        this.trackChapterSevenAmbientSource(beat, beatStart, beatStart + 0.17);
      });
      notes.forEach((note) => {
        const noteStart = loopStart + note.offset;
        const noteGain = this.context!.createGain();
        noteGain.gain.setValueAtTime(0.0001, noteStart);
        noteGain.gain.exponentialRampToValueAtTime(0.108, noteStart + 0.014);
        noteGain.gain.linearRampToValueAtTime(0.06, noteStart + note.length * 0.68);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + note.length);
        noteGain.connect(melodyBus);

        const tone = this.context!.createOscillator();
        tone.type = loop % 2 === 0 ? 'triangle' : 'sine';
        tone.frequency.setValueAtTime(note.frequency, noteStart);
        tone.connect(noteGain);
        this.trackChapterSevenAmbientSource(tone, noteStart, noteStart + note.length);
      });
    }

    const padGain = this.context.createGain();
    padGain.gain.setValueAtTime(0.0001, startTime);
    padGain.gain.exponentialRampToValueAtTime(0.038, startTime + 0.8);
    padGain.connect(destination);
    [164.81, 246.94, 329.63].forEach((frequency) => {
      const pad = this.context!.createOscillator();
      pad.type = 'sine';
      pad.frequency.setValueAtTime(frequency, startTime);
      pad.connect(padGain);
      this.trackChapterSevenAmbientSource(pad, startTime, startTime + 90);
    });
  }

  private startChapterSevenNightBed(startTime: number, destination: GainNode): void {
    if (!this.context || !this.noiseBuffer) {
      return;
    }

    const nightGain = this.context.createGain();
    nightGain.gain.setValueAtTime(0.0001, startTime);
    nightGain.gain.exponentialRampToValueAtTime(0.032, startTime + 1.0);
    nightGain.connect(destination);

    const insects = this.context.createBufferSource();
    insects.buffer = this.noiseBuffer;
    insects.loop = true;
    insects.playbackRate.value = 0.42;

    const highpass = this.context.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 1800;
    const band = this.context.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 3600;
    band.Q.value = 2.2;

    insects.connect(highpass);
    highpass.connect(band);
    band.connect(nightGain);
    this.trackChapterSevenAmbientSource(insects, startTime, startTime + 90);
  }

  private trackChapterSevenAmbientSource(
    source: AudioScheduledSourceNode,
    startTime: number,
    stopTime: number,
  ): void {
    this.chapterSevenAmbientSources.push(source);
    this.activeSources.add(source);
    source.addEventListener('ended', () => {
      this.activeSources.delete(source);
      const index = this.chapterSevenAmbientSources.indexOf(source);
      if (index >= 0) {
        this.chapterSevenAmbientSources.splice(index, 1);
      }
    });
    source.start(startTime);
    source.stop(stopTime);
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
