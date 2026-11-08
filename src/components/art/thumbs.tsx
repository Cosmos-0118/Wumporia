import type { ReactNode } from 'react'

import { Explorer, Gold, Pit, Robot, VacuumBot, Wumpus } from '@/components/art/sprites'

/** Small illustrated previews used on the home page cards. */

function Frame({ children }: { children: ReactNode }) {
  return <div className="absolute inset-0 flex items-center justify-center">{children}</div>
}

export function WumpusThumb() {
  return (
    <Frame>
      <div className="grid grid-cols-4 gap-1.5">
        <Explorer className="size-12" />
        <div className="size-12 rounded-lg bg-surface-2" />
        <Gold className="size-12" />
        <div className="size-12 rounded-lg bg-surface-2" />
        <div className="size-12 rounded-lg bg-surface-2" />
        <Pit className="size-12" />
        <div className="size-12 rounded-lg bg-surface-2" />
        <Wumpus className="size-12" />
      </div>
    </Frame>
  )
}

export function MazeThumb() {
  const walls = new Set([1, 5, 6, 9, 13, 16, 18, 22, 23])
  return (
    <Frame>
      <div className="grid grid-cols-6 gap-1">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className={
              walls.has(i)
                ? 'size-6 rounded-[5px] bg-border-strong'
                : i === 0
                  ? 'size-6 rounded-[5px] bg-game'
                  : i === 29
                    ? 'size-6 rounded-[5px] bg-bad'
                    : [2, 3, 4, 10, 11, 17, 24, 25, 26, 27, 28].includes(i)
                      ? 'size-6 rounded-[5px] bg-game/40'
                      : 'size-6 rounded-[5px] bg-surface-2'
            }
          />
        ))}
      </div>
    </Frame>
  )
}

export function PuzzleThumb() {
  return (
    <Frame>
      <div className="grid grid-cols-3 gap-1.5">
        {[2, 8, 3, 1, 6, 4, 7, 0, 5].map((n) =>
          n === 0 ? (
            <div key={n} className="size-12" />
          ) : (
            <div
              key={n}
              className="flex size-12 items-center justify-center rounded-lg border border-border-strong bg-surface-2 font-mono text-lg font-medium"
            >
              {n}
            </div>
          ),
        )}
      </div>
    </Frame>
  )
}

export function TicTacToeThumb() {
  const marks = ['X', 'O', '', '', 'X', 'O', 'O', '', 'X']
  return (
    <Frame>
      <div className="grid grid-cols-3 gap-1.5">
        {marks.map((m, i) => (
          <div
            key={i}
            className={`flex size-12 items-center justify-center rounded-lg bg-surface-2 text-xl font-semibold ${m === 'X' ? 'text-game' : 'text-fg'}`}
          >
            {m}
          </div>
        ))}
      </div>
    </Frame>
  )
}

export function VacuumThumb() {
  return (
    <Frame>
      <div className="flex items-center gap-3">
        <div className="size-3 rounded-full bg-warn/60" />
        <VacuumBot className="size-16" />
        <div className="size-3 rounded-full bg-warn/60" />
        <div className="size-2 rounded-full bg-warn/60" />
      </div>
    </Frame>
  )
}

export function PathfindingThumb() {
  return (
    <Frame>
      <div className="relative">
        <svg viewBox="0 0 200 100" className="h-24 w-48" fill="none" aria-hidden>
          <path
            d="M14 80C50 80 40 20 80 20s30 60 66 60 32-40 40-50"
            stroke="currentColor"
            className="text-game"
            strokeWidth="3"
            strokeDasharray="2 8"
            strokeLinecap="round"
          />
          <circle cx="14" cy="80" r="6" className="fill-game" />
          <circle cx="186" cy="30" r="6" className="fill-bad" />
        </svg>
        <Robot className="absolute -top-2 left-2 size-10" />
      </div>
    </Frame>
  )
}
