interface FoxyPlayAudioCtor {
  new (): AudioContext;
}

export type FoxyPlaySpeaker = 'foxy' | 'parrot';

export const FOXY_PLAY_FOXY_LINE = 'Hey there, kids.';
export const FOXY_PLAY_FOXY_SOON_LINE = "Don't worry, kids. The play will be starting soon.";
export const FOXY_PLAY_PARROT_LINE = 'Aye aye, captain.';
export const FOXY_PLAY_STORY_NARRATION = [
  'Once upon a time, there was a sailor sailing slowly through the water.',
  'Many, many pirates chased him, because he knew where the treasure was hidden.',
  'One day, a pirate crew dragged him onto their ship and forced the secret out of him.',
  'They sailed away to get the treasure for themselves.',
  'Then I, Pirate Foxy, came along and beat all the bad pirates up.',
  'After that, Pirate Foxy and the sailor went to get the treasure together.',
  'They became super rich, wealthy, and kind, donating lots of money to poor places. The end.',
].join(' ');

export class FoxyPlayAudio {
  private readonly context?: AudioContext;
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

  playStoryNarration(): void {
    this.stopMusic();
    this.resume();
    this.playSpeech('foxy', FOXY_PLAY_STORY_NARRATION);
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
    utterance.rate = storyFoxy ? 0.92 : enthusiasticFoxy ? 1.02 : speaker === 'foxy' ? 0.86 : 1.28;
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

  private stopSpeech(): void {
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
