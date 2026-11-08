import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tip } from '@/components/ui/tooltip'
import { PLAYBACK_SPEEDS, type Playback } from '@/lib/usePlayback'
import { cn } from '@/lib/cn'

export function PlaybackBar({ playback, disabled }: { playback: Playback; disabled?: boolean }) {
  const { cursor, total, playing, finished } = playback
  const progress = total <= 1 ? (cursor >= 0 ? 100 : 0) : ((cursor + 1) / total) * 100

  return (
    <div className="space-y-3">
      <div className="h-1 overflow-hidden rounded-full bg-border-strong">
        <div
          className="h-full rounded-full bg-game transition-[width] duration-200"
          style={{ width: `${String(progress)}%` }}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Tip label="Back one step">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back one step"
            disabled={disabled === true || cursor < 0}
            onClick={() => {
              playback.step(-1)
            }}
          >
            <SkipBack />
          </Button>
        </Tip>
        <Button
          variant="primary"
          size="sm"
          className="min-w-[68px]"
          disabled={disabled === true || total === 0}
          onClick={playing ? playback.pause : playback.play}
        >
          {playing ? <Pause /> : <Play />}
          {playing ? 'Pause' : finished ? 'Replay' : 'Run'}
        </Button>
        <Tip label="Forward one step">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Forward one step"
            disabled={disabled === true || finished}
            onClick={() => {
              playback.step(1)
            }}
          >
            <SkipForward />
          </Button>
        </Tip>
        <Tip label="Reset">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Reset"
            disabled={disabled === true || cursor < 0}
            onClick={playback.reset}
          >
            <RotateCcw />
          </Button>
        </Tip>
        <div className="ml-auto flex items-center gap-0.5 rounded-md border bg-surface-2 p-0.5">
          {PLAYBACK_SPEEDS.map((speed) => (
            <button
              key={speed}
              type="button"
              aria-label={`${String(speed)}x speed`}
              onClick={() => {
                playback.setSpeed(speed)
              }}
              className={cn(
                'h-6 rounded px-1 font-mono text-xs text-muted transition-colors hover:text-fg',
                playback.speed === speed && 'bg-surface text-fg ring-1 ring-border-strong',
              )}
            >
              {speed}×
            </button>
          ))}
        </div>
      </div>
      <div className="font-mono text-xs text-subtle tabular-nums">
        {total === 0 ? 'No steps' : `Step ${String(Math.max(cursor + 1, 0))} / ${String(total)}`}
      </div>
    </div>
  )
}
