// Bespoke Web Audio Synthesizer for tactile desktop soundscapes
// Zero external asset dependencies; works 100% reliably and completely offline

export type TypingSoundType = 'none' | 'thock' | 'typewriter' | 'paper'

class SoundEffects {
  private ctx: AudioContext | null = null
  private noiseBuffer: AudioBuffer | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer
    const bufferSize = ctx.sampleRate * 0.5
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    this.noiseBuffer = buffer
    return buffer
  }

  /**
   * Acoustic keyboard typing synthesis with micro-pitch jitter
   */
  public playKeySound(type: TypingSoundType, key: string = ''): void {
    if (type === 'none') return
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const isEnter = key === 'Enter'
    const isSpace = key === ' ' || key === 'Space'
    const isBackspace = key === 'Backspace'

    if (type === 'thock') {
      // 1. Lubricated mechanical switch "Thock" (Deep resonant cavity)
      const baseFreq = isSpace ? 75 : isEnter ? 85 : isBackspace ? 135 : 105 + (Math.random() * 20 - 10)
      const volume = isSpace ? 0.22 : isEnter ? 0.24 : 0.17

      // Resonant body oscillator
      const osc = ctx.createOscillator()
      const oscGain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(baseFreq * 1.5, now)
      osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.035)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(480, now)
      filter.Q.setValueAtTime(3.5, now)

      oscGain.gain.setValueAtTime(volume, now)
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + (isSpace ? 0.07 : 0.05))

      osc.connect(filter)
      filter.connect(oscGain)
      oscGain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.08)

      // Initial tactile tactile snap
      const noise = ctx.createBufferSource()
      noise.buffer = this.getNoiseBuffer(ctx)
      const noiseFilter = ctx.createBiquadFilter()
      const noiseGain = ctx.createGain()

      noiseFilter.type = 'bandpass'
      noiseFilter.frequency.setValueAtTime(650, now)
      noiseFilter.Q.setValueAtTime(2.0, now)

      noiseGain.gain.setValueAtTime(volume * 0.45, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02)

      noise.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(ctx.destination)

      noise.start(now)
      noise.stop(now + 0.025)
    } else if (type === 'typewriter') {
      // 2. Vintage Mechanical Typewriter (Crisp metallic impact & return bell)
      const noise = ctx.createBufferSource()
      noise.buffer = this.getNoiseBuffer(ctx)
      const noiseFilter = ctx.createBiquadFilter()
      const noiseGain = ctx.createGain()

      noiseFilter.type = 'bandpass'
      noiseFilter.frequency.setValueAtTime(isSpace ? 900 : 1600 + (Math.random() * 400 - 200), now)
      noiseFilter.Q.setValueAtTime(4.0, now)

      const vol = isSpace ? 0.18 : 0.14
      noiseGain.gain.setValueAtTime(vol, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035)

      noise.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(ctx.destination)

      noise.start(now)
      noise.stop(now + 0.04)

      // Enter triggers classic brass carriage bell!
      if (isEnter) {
        const bell = ctx.createOscillator()
        const bellGain = ctx.createGain()
        bell.type = 'sine'
        bell.frequency.setValueAtTime(2093, now + 0.02) // C7 brass chime

        bellGain.gain.setValueAtTime(0, now)
        bellGain.gain.setValueAtTime(0.18, now + 0.02)
        bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

        bell.connect(bellGain)
        bellGain.connect(ctx.destination)

        bell.start(now + 0.02)
        bell.stop(now + 0.46)
      }
    } else if (type === 'paper') {
      // 3. Subtle Fountain Pen on Textured Cotton Paper stroke
      const noise = ctx.createBufferSource()
      noise.buffer = this.getNoiseBuffer(ctx)
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()

      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(2400 + (Math.random() * 300 - 150), now)
      filter.Q.setValueAtTime(1.2, now)

      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      noise.start(now)
      noise.stop(now + 0.05)
    }
  }

  /**
   * Pleasant acoustic marimba / bell chime for desktop reminders and alerts
   */
  public playReminderChime(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6 (Bright ascending arpeggio)

    notes.forEach((freq, index) => {
      const startTime = now + index * 0.08
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + 0.8)
    })
  }

  /**
   * Soft tactile click for checklist toggles or button presses
   */
  public playChecklistBounce(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.06)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.08)
  }

  /**
   * Subtle alert note for notifications or warnings
   */
  public playAlertSound(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = 'sine'
    osc2.type = 'sine'

    osc1.frequency.setValueAtTime(587.33, now) // D5
    osc2.frequency.setValueAtTime(880, now + 0.1) // A5

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc1.stop(now + 0.1)

    osc2.start(now + 0.1)
    osc2.stop(now + 0.5)
  }
}

export const soundEffects = new SoundEffects()
