interface FoxyPlayAudioCtor {
  new (): AudioContext;
}

export const FOXY_PLAY_LINE = "Arr, hearties! I hope you're having a good time at Fredbear's Pizzeria. Make sure to have lots of fun.";

const FOXY_PLAY_MUSIC_DURATION = 10;
const FOXY_PLAY_MASTER_GAIN = 0.42;
const FOXY_PLAY_BEAT_SECONDS = 0.34;

export class FoxyPlayAudio {
  private readonly context?: AudioContext;
  private readonly masterGain?: GainNode;
  private readonly noiseBuffer?: AudioBuffer;
  private readonly activeSources = new Set<AudioScheduledSourceNode>();
  private activeSpeech: SpeechSynthesisUtterance | null = null;

  constructor() {
    const AudioContextCtor = (
      window.AudioContext
      || (window as Window & { webkitAudioContext?: FoxyPlayAudioCtor }).webkitAudioContext
    );

    if (!AudioContextCtor) {
      return;
    }

    this.context = new AudioContextCtor();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.0001;
    this.masterGain.connect(this.context.destination);
    this.noiseBuffer = createNoiseBuffer(this.context, 1.2);
  }

  resume(): void {
    if (!this.context || this.context.state !== 'suspended') {
      return;
    }

    void this.context.resume();
  }

  play(): void {
    this.stopMusic();
    this.resume();
    this.playSpeech();
    this.playPirateMusic();
  }

  destroy(): void {
    this.stopSpeech();
    this.stopMusic();

    if (!this.context || this.context.state === 'closed') {
      return;
    }

    void this.context.close();
  }

  private playSpeech(): void {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      return;
    }

    const speechSynth = window.speechSynthesis;
    speechSynth.cancel();
    speechSynth.resume();
    const utterance = new SpeechSynthesisUtterance(FOXY_PLAY_LINE);
    const voice = selectPirateVoice(speechSynth.getVoices());
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'en-GB';
    }
    utterance.volume = 0.9;
    utterance.rate = 0.86;
    utterance.pitch = 0.72;
    utterance.onend = (): void => {
      if (this.activeSpeech === utterance) {
        this.activeSpeech = null;
      }
    };
    utterance.onerror = (): void => {
      if (this.activeSpeech === utterance) {
        this.activeSpeech = null;
      }
    };
    this.activeSpeech = utterance;
    speechSynth.speak(utterance);
  }

  private stopSpeech(): void {
    if (!this.activeSpeech || !('speechSynthesis' in window)) {
      this.activeSpeech = null;
      return;
    }

    window.speechSynthesis.cancel();
    this.activeSpeech = null;
  }

  private playPirateMusic(): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const startTime = this.context.currentTime + 0.03;
    const endTime = startTime + FOXY_PLAY_MUSIC_DURATION;
    this.masterGain.gain.cancelScheduledValues(startTime);
    this.masterGain.gain.setValueAtTime(0.0001, startTime);
    this.masterGain.gain.linearRampToValueAtTime(FOXY_PLAY_MASTER_GAIN, startTime + 0.12);
    this.masterGain.gain.setValueAtTime(FOXY_PLAY_MASTER_GAIN, endTime - 0.55);
    this.masterGain.gain.linearRampToValueAtTime(0.0001, endTime);

    this.scheduleSeaShantyMelody(startTime, endTime);
    this.scheduleAccordionChords(startTime, endTime);
    this.schedulePirateBass(startTime, endTime);
    this.scheduleDeckDrums(startTime, endTime);
  }

  private scheduleSeaShantyMelody(startTime: number, endTime: number): void {
    const melody = [
      293.66,
      349.23,
      392,
      440,
      392,
      349.23,
      293.66,
      261.63,
      293.66,
      349.23,
      392,
      523.25,
      493.88,
      440,
      392,
      349.23,
    ];
    let noteIndex = 0;

    for (let time = startTime; time < endTime - 0.12; time += FOXY_PLAY_BEAT_SECONDS) {
      const frequency = melody[noteIndex % melody.length];
      const longNote = noteIndex % 8 === 3 || noteIndex % 8 === 7;
      this.scheduleOscNote(
        time,
        longNote ? FOXY_PLAY_BEAT_SECONDS * 0.92 : FOXY_PLAY_BEAT_SECONDS * 0.72,
        frequency,
        noteIndex % 4 === 0 ? 'triangle' : 'square',
        longNote ? 0.13 : 0.105,
        1700,
        -5 + (noteIndex % 3) * 5,
      );
      noteIndex += 1;
    }
  }

  private scheduleAccordionChords(startTime: number, endTime: number): void {
    const chords = [
      [146.83, 174.61, 220],
      [130.81, 164.81, 196],
      [116.54, 146.83, 174.61],
      [130.81, 164.81, 220],
    ];
    let chordIndex = 0;

    for (let time = startTime; time < endTime - 0.22; time += FOXY_PLAY_BEAT_SECONDS * 2) {
      const chord = chords[chordIndex % chords.length];
      chord.forEach((frequency, index) => {
        this.scheduleOscNote(
          time + index * 0.012,
          FOXY_PLAY_BEAT_SECONDS * 1.6,
          frequency,
          index === 1 ? 'triangle' : 'sawtooth',
          0.055,
          1050 - index * 120,
          index * 8 - 7,
        );
      });
      chordIndex += 1;
    }
  }

  private schedulePirateBass(startTime: number, endTime: number): void {
    const bassLine = [73.42, 73.42, 65.41, 58.27, 65.41, 73.42];
    let beatIndex = 0;

    for (let time = startTime; time < endTime - 0.18; time += FOXY_PLAY_BEAT_SECONDS) {
      const frequency = bassLine[beatIndex % bassLine.length];
      this.scheduleOscNote(
        time,
        FOXY_PLAY_BEAT_SECONDS * 0.78,
        frequency,
        'sawtooth',
        beatIndex % 3 === 0 ? 0.13 : 0.09,
        420,
      );
      beatIndex += 1;
    }
  }

  private scheduleDeckDrums(startTime: number, endTime: number): void {
    let beatIndex = 0;

    for (let time = startTime; time < endTime - 0.08; time += FOXY_PLAY_BEAT_SECONDS) {
      if (beatIndex % 6 === 0 || beatIndex % 6 === 3) {
        this.scheduleLowDrum(time, beatIndex % 6 === 0 ? 0.34 : 0.24);
      }
      if (beatIndex % 6 === 2 || beatIndex % 6 === 5) {
        this.scheduleWoodHit(time + 0.015, 0.16);
      }
      this.scheduleShaker(time + 0.03, beatIndex % 2 === 0 ? 0.04 : 0.032);
      beatIndex += 1;
    }
  }

  private scheduleOscNote(
    startTime: number,
    duration: number,
    frequency: number,
    type: OscillatorType,
    volume: number,
    filterFrequency: number,
    detune = 0,
  ): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const osc = this.context.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);
    osc.detune.setValueAtTime(detune, startTime);

    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFrequency, startTime);
    filter.Q.value = 1.2;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.max(0.05, duration));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    this.startSource(osc, startTime, startTime + duration + 0.04);
  }

  private scheduleLowDrum(startTime: number, volume: number): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28);
    gain.connect(this.masterGain);

    const drum = this.context.createOscillator();
    drum.type = 'triangle';
    drum.frequency.setValueAtTime(118, startTime);
    drum.frequency.exponentialRampToValueAtTime(42, startTime + 0.24);
    drum.connect(gain);
    this.startSource(drum, startTime, startTime + 0.3);
  }

  private scheduleWoodHit(startTime: number, volume: number): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.1);
    gain.connect(this.masterGain);

    const noise = this.context.createBufferSource();
    noise.buffer = this.noiseBuffer;
    noise.playbackRate.value = 1.7;
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1250;
    filter.Q.value = 4.2;
    noise.connect(filter);
    filter.connect(gain);
    this.startSource(noise, startTime, startTime + 0.12);
  }

  private scheduleShaker(startTime: number, volume: number): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.07);
    gain.connect(this.masterGain);

    const shaker = this.context.createBufferSource();
    shaker.buffer = this.noiseBuffer;
    shaker.playbackRate.value = 2.8 + Math.random() * 0.35;
    const filter = this.context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 4600;
    shaker.connect(filter);
    filter.connect(gain);
    this.startSource(shaker, startTime, startTime + 0.08);
  }

  private startSource(source: AudioScheduledSourceNode, startTime: number, stopTime: number): void {
    this.activeSources.add(source);
    source.addEventListener('ended', () => {
      this.activeSources.delete(source);
    });
    source.start(startTime);
    source.stop(stopTime);
  }

  private stopMusic(): void {
    this.masterGain?.gain.cancelScheduledValues(0);
    if (this.context && this.masterGain) {
      this.masterGain.gain.setValueAtTime(0.0001, this.context.currentTime);
    }

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

function selectPirateVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  let bestVoice: SpeechSynthesisVoice | undefined;
  let bestScore = Number.NEGATIVE_INFINITY;

  voices.forEach((voice) => {
    if (!/^en/i.test(voice.lang)) {
      return;
    }

    const name = voice.name.toLowerCase();
    const lang = voice.lang.toLowerCase();
    let score = 0;
    if (lang.startsWith('en-gb')) {
      score += 80;
    }
    if (/daniel|google uk english male|uk english male|george|arthur|oliver|ryan|thomas|male|fred|bruce|ralph/.test(name)) {
      score += 35;
    }
    if (/female|samantha|victoria|karen|zira|hazel|serena/.test(name)) {
      score -= 18;
    }
    if (voice.default) {
      score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  });

  return bestVoice;
}
