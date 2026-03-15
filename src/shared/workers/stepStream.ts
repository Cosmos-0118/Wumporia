import type { StepFrame } from '@/shared/types/solver'

export type StreamMode = 'idle' | 'playing' | 'paused' | 'completed'

export interface StepStreamSnapshot {
  mode: StreamMode
  speed: number
  index: number
  total: number
}

interface StepStreamOptions<TState, TMeta> {
  frames: StepFrame<TState, TMeta>[]
  defaultSpeed?: number
  onFrame: (frame: StepFrame<TState, TMeta>) => void
  onComplete?: () => void
}

export class StepStreamController<TState, TMeta = Record<string, unknown>> {
  private readonly frames: StepFrame<TState, TMeta>[]
  private readonly onFrame: (frame: StepFrame<TState, TMeta>) => void
  private readonly onComplete: () => void

  private speed: number
  private index = 0
  private mode: StreamMode = 'idle'
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(options: StepStreamOptions<TState, TMeta>) {
    this.frames = options.frames
    this.onFrame = options.onFrame
    this.onComplete = options.onComplete ?? (() => undefined)
    this.speed = options.defaultSpeed ?? 1
  }

  play(): void {
    if (this.mode === 'completed') {
      return
    }

    this.mode = 'playing'
    this.startTimer()
  }

  pause(): void {
    if (this.mode !== 'playing') {
      return
    }

    this.mode = 'paused'
    this.stopTimer()
  }

  next(): StepFrame<TState, TMeta> | null {
    if (this.index >= this.frames.length) {
      this.mode = 'completed'
      this.stopTimer()
      this.onComplete()
      return null
    }

    const frame = this.frames[this.index]
    if (frame === undefined) {
      this.mode = 'completed'
      this.stopTimer()
      this.onComplete()
      return null
    }

    this.onFrame(frame)
    this.index += 1

    if (this.index >= this.frames.length) {
      this.mode = 'completed'
      this.stopTimer()
      this.onComplete()
    }

    return frame
  }

  reset(): void {
    this.stopTimer()
    this.index = 0
    this.mode = 'idle'
  }

  setSpeed(nextSpeed: number): void {
    this.speed = Math.max(1, nextSpeed)

    if (this.mode === 'playing') {
      this.startTimer()
    }
  }

  getSnapshot(): StepStreamSnapshot {
    return {
      mode: this.mode,
      speed: this.speed,
      index: this.index,
      total: this.frames.length,
    }
  }

  private getTickMs(): number {
    const baseTickMs = 800
    return Math.max(80, Math.floor(baseTickMs / this.speed))
  }

  private startTimer(): void {
    this.stopTimer()
    this.timer = setInterval(() => {
      this.next()
    }, this.getTickMs())
  }

  private stopTimer(): void {
    if (this.timer === null) {
      return
    }

    clearInterval(this.timer)
    this.timer = null
  }
}
