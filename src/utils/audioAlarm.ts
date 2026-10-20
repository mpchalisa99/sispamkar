class MilitaryAlarmSystem {
  private audioCtx: AudioContext | null = null;
  private isAlarmPlaying: boolean = false;
  private timerId: number | null = null;
  private currentOscillator: OscillatorNode | null = null;
  private currentGain: GainNode | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.isAlarmPlaying) {
      this.stopAlarm();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsPlaying(): boolean {
    return this.isAlarmPlaying;
  }

  /**
   * Starts a continuous tactical warble siren for critical fire threats
   */
  public startAlarm() {
    if (this.isMuted || this.isAlarmPlaying) return;
    this.initContext();
    if (!this.audioCtx) return;

    this.isAlarmPlaying = true;
    let high = true;

    const playTone = () => {
      if (!this.isAlarmPlaying || !this.audioCtx) return;

      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        // Alternating tactical alarm frequencies (880Hz / 660Hz)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(high ? 880 : 660, this.audioCtx.currentTime);

        // Low volume to avoid deafening user
        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.38);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.4);

        high = !high;
        this.timerId = window.setTimeout(playTone, 420);
      } catch (e) {
        console.warn('Audio alarm playback error:', e);
      }
    };

    playTone();
  }

  /**
   * Stops the continuous alarm
   */
  public stopAlarm() {
    this.isAlarmPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.currentOscillator) {
      try {
        this.currentOscillator.stop();
        this.currentOscillator.disconnect();
      } catch {
        // ignore
      }
      this.currentOscillator = null;
    }
  }

  /**
   * Plays a single brief confirmation beep / radar ping
   */
  public playTestPing() {
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, this.audioCtx.currentTime); // B5 note
      osc.frequency.exponentialRampToValueAtTime(1318.51, this.audioCtx.currentTime + 0.15); // E6

      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.25);
    } catch (e) {
      console.warn('Test ping error:', e);
    }
  }

  /**
   * Plays a 2-second siren test
   */
  public playAlarmTest(durationMs: number = 2000) {
    const wasMuted = this.isMuted;
    this.isMuted = false;
    this.startAlarm();
    setTimeout(() => {
      this.stopAlarm();
      this.isMuted = wasMuted;
    }, durationMs);
  }
}

export const alarmAudio = new MilitaryAlarmSystem();
