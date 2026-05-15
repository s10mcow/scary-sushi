interface PartyShowAudioCtor {
  new (): AudioContext;
}

const QUACKY_WALK_CYCLE_RATE = 8.6;
const QUACKY_STEP_INTERVAL = Math.PI / QUACKY_WALK_CYCLE_RATE;
const QUACKY_FIRST_STEP_TIME = QUACKY_STEP_INTERVAL * 0.5;
const PARTY_SHOW_MASTER_GAIN = 0.28;
const BORI_DRUM_BEAT_INTERVAL = 0.18;

export class PartyShowAudio {
  private readonly context?: AudioContext;
  private readonly masterGain?: GainNode;
  private readonly noiseBuffer?: AudioBuffer;
  private readonly activeSources = new Set<AudioScheduledSourceNode>();
  private active = false;
  private nextGuitarTime = 0;
  private nextDrumTime = 0;
  private lastQuackyStepIndex = -1;
  private chordIndex = 0;
  private drumBeatIndex = 0;

  constructor() {
    const AudioContextCtor = (
      window.AudioContext
      || (window as Window & { webkitAudioContext?: PartyShowAudioCtor }).webkitAudioContext
    );

    if (!AudioContextCtor) {
      return;
    }

    this.context = new AudioContextCtor();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = PARTY_SHOW_MASTER_GAIN;
    this.masterGain.connect(this.context.destination);
    this.noiseBuffer = createNoiseBuffer(this.context, 1.6);
  }

  resume(): void {
    if (!this.context || this.context.state !== 'suspended') {
      return;
    }

    void this.context.resume();
  }

  destroy(): void {
    this.stop();

    if (!this.context || this.context.state === 'closed') {
      return;
    }

    void this.context.close();
  }

  start(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    this.resume();
    if (this.active) {
      return;
    }

    const now = this.context.currentTime + 0.02;
    this.active = true;
    this.nextGuitarTime = now;
    this.nextDrumTime = now;
    this.lastQuackyStepIndex = -1;
    this.drumBeatIndex = 0;
  }

  stop(): void {
    this.active = false;
    this.stopAllSources();
  }

  update(_: number, shouldPlay: boolean, partyShowTime = 0): void {
    if (!shouldPlay) {
      if (this.active) {
        this.stop();
      }
      return;
    }

    if (!this.active) {
      this.start();
    }

    if (!this.context || !this.masterGain || !this.active) {
      return;
    }

    this.masterGain.gain.setTargetAtTime(PARTY_SHOW_MASTER_GAIN, this.context.currentTime, 0.045);

    const horizon = this.context.currentTime + 0.38;
    while (this.nextGuitarTime < horizon) {
      this.scheduleGuitarHit(this.nextGuitarTime);
      this.nextGuitarTime += 0.36;
    }
    while (this.nextDrumTime < horizon) {
      this.scheduleDrumBeat(this.nextDrumTime, this.drumBeatIndex);
      this.nextDrumTime += BORI_DRUM_BEAT_INTERVAL;
      this.drumBeatIndex += 1;
    }

    if (partyShowTime >= QUACKY_FIRST_STEP_TIME) {
      const stepIndex = Math.floor((partyShowTime - QUACKY_FIRST_STEP_TIME) / QUACKY_STEP_INTERVAL);
      if (stepIndex > this.lastQuackyStepIndex) {
        this.lastQuackyStepIndex = stepIndex;
        this.scheduleStageStep(this.context.currentTime + 0.01, stepIndex);
      }
    }
  }

  private scheduleGuitarHit(startTime: number): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const chords = [
      [196, 247, 294],
      [220, 277, 330],
      [174, 220, 262],
      [196, 247, 349],
    ];
    const chord = chords[this.chordIndex % chords.length];
    this.chordIndex += 1;

    chord.forEach((frequency, index) => {
      const osc = this.context!.createOscillator();
      osc.type = index === 1 ? 'square' : 'sawtooth';
      osc.frequency.setValueAtTime(frequency, startTime);
      osc.detune.setValueAtTime(index * 7 - 5, startTime);

      const filter = this.context!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800 - index * 240, startTime);
      filter.Q.value = 1.8;

      const gain = this.context!.createGain();
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.062, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.26);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      this.startSource(osc, startTime, startTime + 0.28);
    });
  }

  private scheduleDrumBeat(startTime: number, beatIndex: number): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    if (beatIndex % 4 === 0) {
      const kickGain = this.context.createGain();
      kickGain.gain.setValueAtTime(0.0001, startTime);
      kickGain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.012);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);
      kickGain.connect(this.masterGain);

      const kick = this.context.createOscillator();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(118, startTime);
      kick.frequency.exponentialRampToValueAtTime(42, startTime + 0.18);
      kick.connect(kickGain);
      this.startSource(kick, startTime, startTime + 0.24);
    }

    if (beatIndex % 4 === 2) {
      const snareGain = this.context.createGain();
      snareGain.gain.setValueAtTime(0.0001, startTime);
      snareGain.gain.exponentialRampToValueAtTime(0.19, startTime + 0.012);
      snareGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.16);
      snareGain.connect(this.masterGain);

      const snare = this.context.createBufferSource();
      snare.buffer = this.noiseBuffer;
      snare.playbackRate.value = 1.25 + Math.random() * 0.12;
      const snareFilter = this.context.createBiquadFilter();
      snareFilter.type = 'bandpass';
      snareFilter.frequency.value = 1700;
      snareFilter.Q.value = 0.9;
      snare.connect(snareFilter);
      snareFilter.connect(snareGain);
      this.startSource(snare, startTime, startTime + 0.17);
    }

    const hatGain = this.context.createGain();
    hatGain.gain.setValueAtTime(0.0001, startTime + 0.006);
    hatGain.gain.exponentialRampToValueAtTime(beatIndex % 2 === 0 ? 0.055 : 0.038, startTime + 0.014);
    hatGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.08);
    hatGain.connect(this.masterGain);

    const hat = this.context.createBufferSource();
    hat.buffer = this.noiseBuffer;
    hat.playbackRate.value = 2.6 + Math.random() * 0.4;
    const hatFilter = this.context.createBiquadFilter();
    hatFilter.type = 'highpass';
    hatFilter.frequency.value = 5200;
    hat.connect(hatFilter);
    hatFilter.connect(hatGain);
    this.startSource(hat, startTime + 0.006, startTime + 0.09);
  }

  private scheduleStageStep(startTime: number, stepIndex: number): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const thumpGain = this.context.createGain();
    const stepLevel = stepIndex % 2 === 0 ? 0.12 : 0.1;
    thumpGain.gain.setValueAtTime(0.0001, startTime);
    thumpGain.gain.exponentialRampToValueAtTime(stepLevel, startTime + 0.01);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.2);
    thumpGain.connect(this.masterGain);

    const thump = this.context.createOscillator();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(92, startTime);
    thump.frequency.exponentialRampToValueAtTime(42, startTime + 0.16);
    thump.connect(thumpGain);
    this.startSource(thump, startTime, startTime + 0.21);

    const scrapeGain = this.context.createGain();
    scrapeGain.gain.setValueAtTime(0.0001, startTime + 0.018);
    scrapeGain.gain.exponentialRampToValueAtTime(0.04, startTime + 0.035);
    scrapeGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);
    scrapeGain.connect(this.masterGain);

    const scrape = this.context.createBufferSource();
    scrape.buffer = this.noiseBuffer;
    scrape.playbackRate.value = (stepIndex % 2 === 0 ? 0.78 : 0.86) + Math.random() * 0.08;
    const lowpass = this.context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 520;
    scrape.connect(lowpass);
    lowpass.connect(scrapeGain);
    this.startSource(scrape, startTime + 0.018, startTime + 0.19);
  }

  private startSource(source: AudioScheduledSourceNode, startTime: number, stopTime: number): void {
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
        // Source already ended.
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
    channel[index] = (Math.random() * 2 - 1) * (0.5 + Math.random() * 0.5);
  }

  return buffer;
}
