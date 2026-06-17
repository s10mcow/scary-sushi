interface FoxyPlayAudioCtor {
  new (): AudioContext;
}

export type FoxyPlaySpeaker = 'foxy' | 'parrot';

export const FOXY_PLAY_FOXY_LINE = 'Hey there, kids.';
export const FOXY_PLAY_FOXY_SOON_LINE = "Don't worry, kids. The play will be starting soon.";
export const FOXY_PLAY_PARROT_LINE = 'Aye aye, captain.';
export const FOXY_PLAY_STORY_LINES = [
  'Once upon a time, there was a sailor sailing slowly through the water.',
  'Many, many pirates chased him, because he knew where the treasure was hidden.',
  'One day, a pirate crew dragged him onto their ship and forced the secret out of him.',
  'They sailed away to get the treasure for themselves.',
  'Then I, Pirate Foxy, came along and beat all the bad pirates up.',
  'After that, Pirate Foxy and the sailor went to get the treasure together.',
  'They became super rich, wealthy, and kind, donating lots of money to poor places. The end.',
] as const;
export const FOXY_PLAY_STORY_NARRATION = FOXY_PLAY_STORY_LINES.join(' ');

const FOXY_PLAY_STORY_FALLBACK_DURATIONS = [6.2, 7.2, 7.8, 5.6, 6.6, 5.6, 8.6] as const;

interface FoxyStoryNarrationOptions {
  onSceneChange?: (sceneIndex: number) => void;
  onComplete?: () => void;
}

export class FoxyPlayAudio {
  private readonly context?: AudioContext;
  private readonly activeSources = new Set<AudioScheduledSourceNode>();
  private activeSpeech: SpeechSynthesisUtterance | null = null;
  private storySequenceId = 0;

  constructor() {
    const AudioContextCtor = (
      window.AudioContext
      || (window as Window & { webkitAudioContext?: FoxyPlayAudioCtor }).webkitAudioContext
    );

    if (!AudioContextCtor) {
      return;
    }

    this.context = new AudioContextCtor();
  }

  resume(): void {
    if (!this.context || this.context.state !== 'suspended') {
      return;
    }

    void this.context.resume();
  }

  play(speaker: FoxyPlaySpeaker, line?: string): void {
    this.stopMusic();
    this.resume();
    this.playSpeech(speaker, line);
    if (speaker === 'parrot') {
      this.playParrotChirp();
    }
  }

  playStoryNarration(options: FoxyStoryNarrationOptions = {}): void {
    this.stopMusic();
    this.resume();
    this.playStorySpeechSequence(options);
  }

  playStoryFightEffects(delaySeconds = 0): void {
    if (!this.context) {
      return;
    }

    this.resume();
    const startTime = this.context.currentTime + delaySeconds;
    [0, 1.58, 3.3].forEach((offset, index) => {
      this.schedulePuppetPunch(startTime + offset, index === 1 ? 0.16 : 0.22);
      this.schedulePirateArr(startTime + offset + 0.18, 118 - index * 9);
    });
  }

  destroy(): void {
    this.stopSpeech();
    this.stopMusic();

    if (!this.context || this.context.state === 'closed') {
      return;
    }

    void this.context.close();
  }

  private playSpeech(speaker: FoxyPlaySpeaker, line?: string): void {
    this.storySequenceId += 1;
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      return;
    }

    const speechSynth = window.speechSynthesis;
    speechSynth.cancel();
    speechSynth.resume();
    const spokenLine = line ?? (speaker === 'foxy' ? FOXY_PLAY_FOXY_LINE : FOXY_PLAY_PARROT_LINE);
    const utterance = new SpeechSynthesisUtterance(spokenLine);
    const voice = selectPirateVoice(speechSynth.getVoices());
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'en-GB';
    }
    const enthusiasticFoxy = speaker === 'foxy' && spokenLine === FOXY_PLAY_FOXY_SOON_LINE;
    const storyFoxy = speaker === 'foxy' && spokenLine === FOXY_PLAY_STORY_NARRATION;
    utterance.volume = speaker === 'foxy' ? 0.92 : 0.82;
    utterance.rate = storyFoxy ? 0.98 : enthusiasticFoxy ? 1.02 : speaker === 'foxy' ? 0.86 : 1.28;
    utterance.pitch = storyFoxy ? 0.82 : enthusiasticFoxy ? 0.94 : speaker === 'foxy' ? 0.72 : 1.82;
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

  private playStorySpeechSequence(options: FoxyStoryNarrationOptions): void {
    const sequenceId = this.storySequenceId + 1;
    this.storySequenceId = sequenceId;

    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      this.playStoryFallbackTiming(sequenceId, options);
      return;
    }

    const speechSynth = window.speechSynthesis;
    speechSynth.cancel();
    speechSynth.resume();
    let sceneIndex = 0;

    const speakScene = (): void => {
      if (this.storySequenceId !== sequenceId) {
        return;
      }
      if (sceneIndex >= FOXY_PLAY_STORY_LINES.length) {
        this.activeSpeech = null;
        options.onComplete?.();
        return;
      }

      options.onSceneChange?.(sceneIndex);
      const utterance = new SpeechSynthesisUtterance(FOXY_PLAY_STORY_LINES[sceneIndex]);
      const voice = selectPirateVoice(speechSynth.getVoices());
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = 'en-GB';
      }
      utterance.volume = 0.92;
      utterance.rate = 0.98;
      utterance.pitch = 0.82;
      utterance.onend = (): void => {
        if (this.storySequenceId !== sequenceId || this.activeSpeech !== utterance) {
          return;
        }
        sceneIndex += 1;
        speakScene();
      };
      utterance.onerror = (): void => {
        if (this.storySequenceId !== sequenceId || this.activeSpeech !== utterance) {
          return;
        }
        sceneIndex += 1;
        speakScene();
      };
      this.activeSpeech = utterance;
      speechSynth.speak(utterance);
    };

    speakScene();
  }

  private playStoryFallbackTiming(sequenceId: number, options: FoxyStoryNarrationOptions): void {
    let elapsedSeconds = 0;
    FOXY_PLAY_STORY_FALLBACK_DURATIONS.forEach((duration, index) => {
      window.setTimeout(() => {
        if (this.storySequenceId === sequenceId) {
          options.onSceneChange?.(index);
        }
      }, elapsedSeconds * 1000);
      elapsedSeconds += duration;
    });
    window.setTimeout(() => {
      if (this.storySequenceId === sequenceId) {
        options.onComplete?.();
      }
    }, elapsedSeconds * 1000);
  }

  private playParrotChirp(): void {
    if (!this.context) {
      return;
    }

    const startTime = this.context.currentTime + 0.02;
    [0, 0.08, 0.16].forEach((offset, index) => {
      const chirp = this.context!.createOscillator();
      const gain = this.context!.createGain();
      chirp.type = 'triangle';
      chirp.frequency.setValueAtTime(1220 + index * 160, startTime + offset);
      chirp.frequency.exponentialRampToValueAtTime(1780 + index * 120, startTime + offset + 0.055);
      gain.gain.setValueAtTime(0.0001, startTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.1, startTime + offset + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + offset + 0.075);
      chirp.connect(gain);
      gain.connect(this.context!.destination);
      chirp.start(startTime + offset);
      chirp.stop(startTime + offset + 0.08);
      this.activeSources.add(chirp);
      chirp.onended = (): void => {
        this.activeSources.delete(chirp);
        chirp.disconnect();
        gain.disconnect();
      };
    });
  }

  private schedulePuppetPunch(startTime: number, volume: number): void {
    if (!this.context) {
      return;
    }

    const low = this.context.createOscillator();
    const lowGain = this.context.createGain();
    low.type = 'triangle';
    low.frequency.setValueAtTime(142, startTime);
    low.frequency.exponentialRampToValueAtTime(54, startTime + 0.16);
    lowGain.gain.setValueAtTime(0.0001, startTime);
    lowGain.gain.exponentialRampToValueAtTime(volume, startTime + 0.012);
    lowGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);
    low.connect(lowGain);
    lowGain.connect(this.context.destination);
    this.startSource(low, startTime, startTime + 0.2);

    const knock = this.context.createOscillator();
    const knockGain = this.context.createGain();
    knock.type = 'square';
    knock.frequency.setValueAtTime(560, startTime + 0.012);
    knock.frequency.exponentialRampToValueAtTime(210, startTime + 0.08);
    knockGain.gain.setValueAtTime(0.0001, startTime + 0.012);
    knockGain.gain.exponentialRampToValueAtTime(volume * 0.42, startTime + 0.02);
    knockGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.1);
    knock.connect(knockGain);
    knockGain.connect(this.context.destination);
    this.startSource(knock, startTime + 0.012, startTime + 0.11);
  }

  private schedulePirateArr(startTime: number, baseFrequency: number): void {
    if (!this.context) {
      return;
    }

    const growl = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    growl.type = 'sawtooth';
    growl.frequency.setValueAtTime(baseFrequency, startTime);
    growl.frequency.exponentialRampToValueAtTime(baseFrequency * 0.58, startTime + 0.34);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(620, startTime);
    filter.Q.value = 5.5;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.075, startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.44);
    growl.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);
    this.startSource(growl, startTime, startTime + 0.48);
  }

  private startSource(source: AudioScheduledSourceNode, startTime: number, stopTime: number): void {
    this.activeSources.add(source);
    source.addEventListener('ended', () => {
      this.activeSources.delete(source);
    });
    source.start(startTime);
    source.stop(stopTime);
  }

  private stopSpeech(): void {
    this.storySequenceId += 1;
    if (!this.activeSpeech || !('speechSynthesis' in window)) {
      this.activeSpeech = null;
      return;
    }

    window.speechSynthesis.cancel();
    this.activeSpeech = null;
  }

  private stopMusic(): void {
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
