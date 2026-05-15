interface LobbyCrashAudioCtor {
  new (): AudioContext;
}

export class LobbyCrashAudio {
  private readonly context?: AudioContext;
  private readonly masterGain?: GainNode;
  private readonly noiseBuffer?: AudioBuffer;
  private readonly activeSources = new Set<AudioScheduledSourceNode>();

  constructor() {
    const AudioContextCtor = (
      window.AudioContext
      || (window as Window & { webkitAudioContext?: LobbyCrashAudioCtor }).webkitAudioContext
    );

    if (!AudioContextCtor) {
      return;
    }

    this.context = new AudioContextCtor();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.29;
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

  playCrash(): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    this.stopAllSources();

    const now = this.context.currentTime + 0.01;
    const crashEnd = now + 3.5;
    const context = this.context;
    const masterGain = this.masterGain;
    const noiseBuffer = this.noiseBuffer;

    const boomGain = context.createGain();
    boomGain.gain.setValueAtTime(0.0001, now);
    boomGain.gain.exponentialRampToValueAtTime(0.34, now + 0.014);
    boomGain.gain.exponentialRampToValueAtTime(0.085, now + 0.42);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
    boomGain.connect(masterGain);

    const subBoom = context.createOscillator();
    subBoom.type = 'sine';
    subBoom.frequency.setValueAtTime(62, now);
    subBoom.frequency.exponentialRampToValueAtTime(31, now + 1.95);
    subBoom.connect(boomGain);

    const bodyBoom = context.createOscillator();
    bodyBoom.type = 'triangle';
    bodyBoom.frequency.setValueAtTime(118, now);
    bodyBoom.frequency.exponentialRampToValueAtTime(52, now + 1.36);
    bodyBoom.connect(boomGain);

    this.startSource(subBoom, now, now + 2.55);
    this.startSource(bodyBoom, now, now + 2.35);

    const impactSnap = context.createBufferSource();
    impactSnap.buffer = noiseBuffer;
    const impactSnapHighpass = context.createBiquadFilter();
    impactSnapHighpass.type = 'highpass';
    impactSnapHighpass.frequency.value = 2400;
    const impactSnapGain = context.createGain();
    impactSnapGain.gain.setValueAtTime(0.0001, now);
    impactSnapGain.gain.exponentialRampToValueAtTime(0.22, now + 0.004);
    impactSnapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    impactSnap.connect(impactSnapHighpass);
    impactSnapHighpass.connect(impactSnapGain);
    impactSnapGain.connect(masterGain);
    this.startSource(impactSnap, now, now + 0.12);

    const rumbleSource = context.createBufferSource();
    rumbleSource.buffer = noiseBuffer;
    const rumbleFilter = context.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(170, now);
    rumbleFilter.frequency.linearRampToValueAtTime(78, now + 2.2);
    const rumbleGain = context.createGain();
    rumbleGain.gain.setValueAtTime(0.0001, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.26, now + 0.022);
    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.7);
    rumbleSource.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(masterGain);
    this.startSource(rumbleSource, now, now + 2.74);

    const tankSlapGain = context.createGain();
    tankSlapGain.gain.setValueAtTime(0.0001, now + 0.028);
    tankSlapGain.gain.exponentialRampToValueAtTime(0.16, now + 0.045);
    tankSlapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.68);
    tankSlapGain.connect(masterGain);

    const tankSlapTone = context.createOscillator();
    tankSlapTone.type = 'triangle';
    tankSlapTone.frequency.setValueAtTime(164, now + 0.028);
    tankSlapTone.frequency.exponentialRampToValueAtTime(72, now + 0.62);
    tankSlapTone.connect(tankSlapGain);
    this.startSource(tankSlapTone, now + 0.028, now + 0.7);

    const tankBodySource = context.createBufferSource();
    tankBodySource.buffer = noiseBuffer;
    const tankBodyBand = context.createBiquadFilter();
    tankBodyBand.type = 'bandpass';
    tankBodyBand.frequency.setValueAtTime(210, now);
    tankBodyBand.frequency.linearRampToValueAtTime(145, now + 0.92);
    tankBodyBand.Q.value = 0.82;
    const tankBodyGain = context.createGain();
    tankBodyGain.gain.setValueAtTime(0.0001, now + 0.012);
    tankBodyGain.gain.exponentialRampToValueAtTime(0.24, now + 0.045);
    tankBodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.18);
    tankBodySource.connect(tankBodyBand);
    tankBodyBand.connect(tankBodyGain);
    tankBodyGain.connect(masterGain);
    this.startSource(tankBodySource, now + 0.012, now + 1.22);

    const shatterSource = context.createBufferSource();
    shatterSource.buffer = noiseBuffer;
    const shatterHighpass = context.createBiquadFilter();
    shatterHighpass.type = 'highpass';
    shatterHighpass.frequency.value = 1160;
    const shatterBand = context.createBiquadFilter();
    shatterBand.type = 'bandpass';
    shatterBand.frequency.value = 3420;
    shatterBand.Q.value = 0.85;
    const shatterGain = context.createGain();
    shatterGain.gain.setValueAtTime(0.0001, now);
    shatterGain.gain.exponentialRampToValueAtTime(0.44, now + 0.024);
    shatterGain.gain.exponentialRampToValueAtTime(0.12, now + 0.38);
    shatterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.36);
    shatterSource.connect(shatterHighpass);
    shatterHighpass.connect(shatterBand);
    shatterBand.connect(shatterGain);
    shatterGain.connect(masterGain);
    this.startSource(shatterSource, now + 0.016, now + 1.4);

    const shardSpraySource = context.createBufferSource();
    shardSpraySource.buffer = noiseBuffer;
    const shardSprayHighpass = context.createBiquadFilter();
    shardSprayHighpass.type = 'highpass';
    shardSprayHighpass.frequency.value = 2050;
    const shardSprayBand = context.createBiquadFilter();
    shardSprayBand.type = 'bandpass';
    shardSprayBand.frequency.setValueAtTime(4700, now + 0.05);
    shardSprayBand.frequency.linearRampToValueAtTime(2700, now + 0.56);
    shardSprayBand.Q.value = 2.1;
    const shardSprayGain = context.createGain();
    shardSprayGain.gain.setValueAtTime(0.0001, now + 0.04);
    shardSprayGain.gain.exponentialRampToValueAtTime(0.24, now + 0.08);
    shardSprayGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    shardSpraySource.connect(shardSprayHighpass);
    shardSprayHighpass.connect(shardSprayBand);
    shardSprayBand.connect(shardSprayGain);
    shardSprayGain.connect(masterGain);
    this.startSource(shardSpraySource, now + 0.04, now + 0.72);

    const waterBurstSource = context.createBufferSource();
    waterBurstSource.buffer = noiseBuffer;
    const waterBurstLowpass = context.createBiquadFilter();
    waterBurstLowpass.type = 'lowpass';
    waterBurstLowpass.frequency.setValueAtTime(980, now + 0.1);
    waterBurstLowpass.frequency.linearRampToValueAtTime(440, now + 1.65);
    const waterBurstGain = context.createGain();
    waterBurstGain.gain.setValueAtTime(0.0001, now + 0.1);
    waterBurstGain.gain.exponentialRampToValueAtTime(0.32, now + 0.24);
    waterBurstGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
    waterBurstSource.connect(waterBurstLowpass);
    waterBurstLowpass.connect(waterBurstGain);
    waterBurstGain.connect(masterGain);
    this.startSource(waterBurstSource, now + 0.1, now + 2.04);

    const splashSource = context.createBufferSource();
    splashSource.buffer = noiseBuffer;
    const splashLowpass = context.createBiquadFilter();
    splashLowpass.type = 'lowpass';
    splashLowpass.frequency.setValueAtTime(720, now + 0.14);
    splashLowpass.frequency.linearRampToValueAtTime(300, now + 1.42);
    const splashBand = context.createBiquadFilter();
    splashBand.type = 'bandpass';
    splashBand.frequency.value = 260;
    splashBand.Q.value = 0.58;
    const splashGain = context.createGain();
    splashGain.gain.setValueAtTime(0.0001, now + 0.15);
    splashGain.gain.exponentialRampToValueAtTime(0.3, now + 0.28);
    splashGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.86);
    splashSource.connect(splashLowpass);
    splashLowpass.connect(splashBand);
    splashBand.connect(splashGain);
    splashGain.connect(masterGain);
    this.startSource(splashSource, now + 0.15, now + 1.92);

    const sloshTone = context.createOscillator();
    sloshTone.type = 'sine';
    sloshTone.frequency.setValueAtTime(172, now + 0.2);
    sloshTone.frequency.exponentialRampToValueAtTime(94, now + 1.46);
    const sloshToneGain = context.createGain();
    sloshToneGain.gain.setValueAtTime(0.0001, now + 0.2);
    sloshToneGain.gain.exponentialRampToValueAtTime(0.04, now + 0.34);
    sloshToneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.58);
    sloshTone.connect(sloshToneGain);
    sloshToneGain.connect(masterGain);
    this.startSource(sloshTone, now + 0.2, now + 1.62);

    [
      [0.06, 1980, 1360, 0.052],
      [0.11, 2520, 1720, 0.044],
      [0.18, 1760, 1180, 0.046],
      [0.25, 2940, 2010, 0.036],
      [0.34, 2260, 1540, 0.036],
      [0.47, 1820, 1240, 0.03],
      [0.62, 1440, 960, 0.022],
      [0.84, 1180, 820, 0.018],
    ].forEach(([offset, startFreq, endFreq, peakGain], index) => {
      const startTime = now + offset;
      const clink = context.createOscillator();
      clink.type = index % 2 === 0 ? 'triangle' : 'sine';
      clink.frequency.setValueAtTime(startFreq, startTime);
      clink.frequency.exponentialRampToValueAtTime(endFreq, startTime + 0.24);

      const clinkGain = context.createGain();
      clinkGain.gain.setValueAtTime(0.0001, startTime);
      clinkGain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.006);
      clinkGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.26);
      clink.connect(clinkGain);
      clinkGain.connect(masterGain);
      this.startSource(clink, startTime, startTime + 0.28);

      const tickNoise = context.createBufferSource();
      tickNoise.buffer = noiseBuffer;
      const tickBand = context.createBiquadFilter();
      tickBand.type = 'bandpass';
      tickBand.frequency.value = startFreq * 1.35;
      tickBand.Q.value = 3.1;
      const tickGain = context.createGain();
      tickGain.gain.setValueAtTime(0.0001, startTime);
      tickGain.gain.exponentialRampToValueAtTime(peakGain * 0.58, startTime + 0.004);
      tickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);
      tickNoise.connect(tickBand);
      tickBand.connect(tickGain);
      tickGain.connect(masterGain);
      this.startSource(tickNoise, startTime, startTime + 0.16);
    });

    const tailNoise = context.createBufferSource();
    tailNoise.buffer = noiseBuffer;
    const tailHighpass = context.createBiquadFilter();
    tailHighpass.type = 'highpass';
    tailHighpass.frequency.value = 520;
    const tailGain = context.createGain();
    tailGain.gain.setValueAtTime(0.0001, now + 0.62);
    tailGain.gain.exponentialRampToValueAtTime(0.058, now + 0.74);
    tailGain.gain.exponentialRampToValueAtTime(0.0001, crashEnd);
    tailNoise.connect(tailHighpass);
    tailHighpass.connect(tailGain);
    tailGain.connect(masterGain);
    this.startSource(tailNoise, now + 0.62, crashEnd);
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
