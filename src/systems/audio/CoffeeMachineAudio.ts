interface CoffeeAudioCtor {
  new (): AudioContext;
}

export class CoffeeMachineAudio {
  private readonly context?: AudioContext;
  private readonly masterGain?: GainNode;
  private readonly noiseBuffer?: AudioBuffer;
  private readonly activeSources = new Set<AudioScheduledSourceNode>();

  constructor() {
    const AudioContextCtor = (
      window.AudioContext
      || (window as Window & { webkitAudioContext?: CoffeeAudioCtor }).webkitAudioContext
    );

    if (!AudioContextCtor) {
      return;
    }

    this.context = new AudioContextCtor();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.18;
    this.masterGain.connect(this.context.destination);
    this.noiseBuffer = createNoiseBuffer(this.context, 2.6);
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

  playBrewCycle(durationSeconds = 2.6): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const now = this.context.currentTime + 0.02;
    const whirrEnd = now + Math.max(0.9, durationSeconds * 0.58);
    const sloshStart = now + Math.max(0.6, durationSeconds * 0.42);
    const sloshEnd = now + Math.max(1.35, durationSeconds * 0.9);

    const whirrGain = this.context.createGain();
    whirrGain.gain.setValueAtTime(0.0001, now);
    whirrGain.gain.exponentialRampToValueAtTime(0.08, now + 0.09);
    whirrGain.gain.linearRampToValueAtTime(0.065, whirrEnd - 0.14);
    whirrGain.gain.exponentialRampToValueAtTime(0.0001, whirrEnd + 0.06);

    const whirrLow = this.context.createOscillator();
    whirrLow.type = 'sawtooth';
    whirrLow.frequency.setValueAtTime(92, now);
    whirrLow.frequency.linearRampToValueAtTime(116, whirrEnd);

    const whirrHigh = this.context.createOscillator();
    whirrHigh.type = 'triangle';
    whirrHigh.frequency.setValueAtTime(186, now);
    whirrHigh.frequency.linearRampToValueAtTime(228, whirrEnd);

    const whirrFilter = this.context.createBiquadFilter();
    whirrFilter.type = 'lowpass';
    whirrFilter.frequency.value = 1100;
    whirrFilter.Q.value = 0.7;

    whirrLow.connect(whirrFilter);
    whirrHigh.connect(whirrFilter);
    whirrFilter.connect(whirrGain);
    whirrGain.connect(this.masterGain);

    this.startSource(whirrLow, now, whirrEnd + 0.08);
    this.startSource(whirrHigh, now, whirrEnd + 0.08);

    const sloshSource = this.context.createBufferSource();
    sloshSource.buffer = this.noiseBuffer;

    const sloshLowpass = this.context.createBiquadFilter();
    sloshLowpass.type = 'lowpass';
    sloshLowpass.frequency.value = 720;
    sloshLowpass.Q.value = 0.8;

    const sloshBandpass = this.context.createBiquadFilter();
    sloshBandpass.type = 'bandpass';
    sloshBandpass.frequency.value = 360;
    sloshBandpass.Q.value = 0.9;

    const sloshGain = this.context.createGain();
    sloshGain.gain.setValueAtTime(0.0001, sloshStart);
    sloshGain.gain.exponentialRampToValueAtTime(0.12, sloshStart + 0.18);
    sloshGain.gain.linearRampToValueAtTime(0.09, sloshEnd - 0.12);
    sloshGain.gain.exponentialRampToValueAtTime(0.0001, sloshEnd + 0.06);

    const bubble = this.context.createOscillator();
    bubble.type = 'sine';
    bubble.frequency.setValueAtTime(142, sloshStart);
    bubble.frequency.linearRampToValueAtTime(178, sloshEnd);

    const bubbleGain = this.context.createGain();
    bubbleGain.gain.setValueAtTime(0.0001, sloshStart);
    bubbleGain.gain.exponentialRampToValueAtTime(0.025, sloshStart + 0.16);
    bubbleGain.gain.exponentialRampToValueAtTime(0.0001, sloshEnd + 0.04);

    sloshSource.connect(sloshLowpass);
    sloshLowpass.connect(sloshBandpass);
    sloshBandpass.connect(sloshGain);
    sloshGain.connect(this.masterGain);

    bubble.connect(bubbleGain);
    bubbleGain.connect(this.masterGain);

    this.startSource(sloshSource, sloshStart, sloshEnd + 0.08);
    this.startSource(bubble, sloshStart, sloshEnd + 0.08);
  }

  playReadyDing(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime + 0.01;
    const endTime = now + 1.8;
    const dingGain = this.context.createGain();
    dingGain.gain.setValueAtTime(0.0001, now);
    dingGain.gain.exponentialRampToValueAtTime(0.32, now + 0.012);
    dingGain.gain.exponentialRampToValueAtTime(0.0001, endTime);
    dingGain.connect(this.masterGain);

    const mainTone = this.context.createOscillator();
    mainTone.type = 'sine';
    mainTone.frequency.setValueAtTime(1568, now);
    mainTone.frequency.exponentialRampToValueAtTime(1320, endTime);

    const overtone = this.context.createOscillator();
    overtone.type = 'triangle';
    overtone.frequency.setValueAtTime(2350, now);
    overtone.frequency.exponentialRampToValueAtTime(1980, endTime);

    const lowTone = this.context.createOscillator();
    lowTone.type = 'sine';
    lowTone.frequency.setValueAtTime(988, now);
    lowTone.frequency.exponentialRampToValueAtTime(784, endTime);

    mainTone.connect(dingGain);
    overtone.connect(dingGain);
    lowTone.connect(dingGain);

    this.startSource(mainTone, now, endTime);
    this.startSource(overtone, now, endTime);
    this.startSource(lowTone, now, endTime);
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
    channel[index] = (Math.random() * 2 - 1) * (0.7 + Math.random() * 0.3);
  }

  return buffer;
}
