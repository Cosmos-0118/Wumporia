import confetti from 'canvas-confetti'
import { Shuffle, Wand2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'

import { GameLayout } from '@/components/layout/GameLayout'
import { Button } from '@/components/ui/button'
import { Badge, Callout, Field, Stat } from '@/components/ui/misc'
import { PlaybackBar } from '@/components/ui/playback'
import { Select } from '@/components/ui/select'
import { GOAL_BOARD, getLegalMoves, isGoal } from '@/features/puzzle8/engine/board'
import { shuffleBoard } from '@/features/puzzle8/engine/solvability'
import { puzzle8AlgorithmList, solvePuzzle8 } from '@/features/puzzle8/engine/solver'
import type {
  Puzzle8Algorithm,
  Puzzle8Board,
  Puzzle8SolveResult,
} from '@/features/puzzle8/types/puzzle8'
import { cn } from '@/lib/cn'
import { usePlayback } from '@/lib/usePlayback'

export default function Puzzle8Game() {
  const [board, setBoard] = useState<Puzzle8Board>(() => shuffleBoard())
  const [algorithm, setAlgorithm] = useState<Puzzle8Algorithm>('A*')
  const [solution, setSolution] = useState<Puzzle8SolveResult | null>(null)
  const [moves, setMoves] = useState(0)

  const playback = usePlayback(solution?.steps.length ?? 0, 600)

  const replayBoard =
    solution !== null && playback.cursor >= 0
      ? solution.steps[playback.cursor]?.state.current?.state.board
      : undefined
  const shown = replayBoard ?? board
  const solved = isGoal(shown)

  const slide = (tile: number) => {
    if (solution !== null) return
    const move = getLegalMoves(board).find((candidate) => candidate.movedTile === tile)
    if (move === undefined) return
    setBoard(move.board)
    setMoves((count) => count + 1)
    if (isGoal(move.board)) {
      void confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } })
    }
  }

  const shuffle = () => {
    setBoard(shuffleBoard())
    setSolution(null)
    setMoves(0)
    playback.reset()
  }

  const solve = () => {
    setSolution(solvePuzzle8(board, algorithm))
    playback.reset()
    playback.play()
  }

  const meta = solution?.steps[0]?.state.meta
  const tiles = shown.map((tile, index) => ({ tile, index })).filter((item) => item.tile !== 0)

  return (
    <GameLayout
      stage={
        <div className="flex w-full flex-col items-center gap-6">
          <div className="@container relative grid aspect-square w-[min(100%,max(240px,calc(100vh-23rem)))] grid-cols-3 grid-rows-3 gap-[3cqw]">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="rounded-xl bg-surface-2/60" />
            ))}
            {tiles.map(({ tile, index }) => (
              <motion.button
                key={tile}
                type="button"
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                onClick={() => {
                  slide(tile)
                }}
                aria-label={`Tile ${String(tile)}`}
                style={{ gridRow: Math.floor(index / 3) + 1, gridColumn: (index % 3) + 1 }}
                className={cn(
                  'z-10 flex items-center justify-center rounded-xl border border-border-strong bg-surface font-mono text-[12cqw] font-medium shadow-sm transition-colors hover:border-game',
                  tile === GOAL_BOARD[index] && 'border-game/60 bg-game/15 text-game',
                )}
              >
                {tile}
              </motion.button>
            ))}
          </div>
          <div className="h-6">
            {solved ? (
              <Badge tone="good">Solved</Badge>
            ) : (
              <span className="font-mono text-xs text-muted">
                {solution === null
                  ? 'Click a tile next to the gap.'
                  : (solution.steps[playback.cursor]?.message ?? '')}
              </span>
            )}
          </div>
        </div>
      }
      controls={
        <>
          <Field label="Solver">
            <Select
              label="Algorithm"
              value={algorithm}
              options={puzzle8AlgorithmList}
              onChange={(next) => {
                setAlgorithm(next)
                setSolution(null)
                playback.reset()
              }}
            />
          </Field>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={shuffle}>
              <Shuffle /> Shuffle
            </Button>
            <Button variant="primary" className="flex-1" disabled={isGoal(board)} onClick={solve}>
              <Wand2 /> Solve
            </Button>
          </div>
          {solution !== null && (
            <div className="border-t pt-5">
              <PlaybackBar playback={playback} />
            </div>
          )}
        </>
      }
      insightsLabel="Stats"
      insights={
        solution === null ? (
          <>
            <Stat label="Your moves" value={moves} />
            <Callout>Press Solve to see how many states each algorithm has to explore.</Callout>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="States explored" value={meta?.nodesExpanded ?? solution.exploredCount} />
              <Stat
                label="Solution length"
                value={solution.status === 'completed' ? (meta?.pathLength ?? 0) : '—'}
              />
              <Stat label="Time" value={`${String(solution.metrics.elapsedMs)} ms`} />
              <Stat label="Your moves" value={moves} />
            </div>
            <Callout>
              A* uses Manhattan distance to explore far fewer states than BFS. Try each solver on
              the same shuffle.
            </Callout>
          </>
        )
      }
    />
  )
}
