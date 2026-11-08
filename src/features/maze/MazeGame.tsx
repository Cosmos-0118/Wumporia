import { Dices, Eraser, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Flag, Robot } from '@/components/art/sprites'
import { GameLayout } from '@/components/layout/GameLayout'
import { Button } from '@/components/ui/button'
import { Badge, Callout, Field, Legend, Stat } from '@/components/ui/misc'
import { PaintGrid } from '@/components/ui/paint-grid'
import { PlaybackBar } from '@/components/ui/playback'
import { Segmented } from '@/components/ui/segmented'
import { Select } from '@/components/ui/select'
import {
  cloneMaze,
  defaultMazeBlueprint,
  randomizeMaze,
  updateMazeCell,
} from '@/features/maze/engine/grid'
import { algorithmList, solveMaze } from '@/features/maze/engine/solver'
import type { MazeAlgorithm, MazeBlueprint, MazeTool } from '@/features/maze/types/maze'
import { toMazeKey } from '@/features/maze/utils/position'
import { cn } from '@/lib/cn'
import { usePlayback } from '@/lib/usePlayback'

const TOOLS: Array<{ value: MazeTool; label: string }> = [
  { value: 'wall', label: 'Wall' },
  { value: 'erase', label: 'Erase' },
  { value: 'start', label: 'Start' },
  { value: 'goal', label: 'Goal' },
]

export default function MazeGame() {
  const [maze, setMaze] = useState<MazeBlueprint>(defaultMazeBlueprint)
  const [algorithm, setAlgorithm] = useState<MazeAlgorithm>('A*')
  const [tool, setTool] = useState<MazeTool>('wall')

  const result = useMemo(() => solveMaze(maze, algorithm), [maze, algorithm])
  const playback = usePlayback(result.steps.length, 500)

  const comparison = useMemo(
    () =>
      algorithmList.map((name) => {
        const run = solveMaze(maze, name)
        return {
          name,
          explored: run.exploredCount,
          cost: run.steps.at(-1)?.state.meta.pathCost ?? 0,
          found: run.status === 'completed',
        }
      }),
    [maze],
  )

  const activeFrame = playback.cursor >= 0 ? result.steps[playback.cursor] : undefined
  const snapshot = activeFrame?.state.current?.state ?? null
  const frontier = useMemo(() => new Set(snapshot?.frontierKeys), [snapshot])
  const explored = useMemo(() => new Set(snapshot?.exploredKeys), [snapshot])
  const path = useMemo(() => new Set(snapshot?.pathKeys), [snapshot])
  const wallKeys = useMemo(() => new Set(maze.walls.map(toMazeKey)), [maze])
  const currentKey =
    snapshot?.current === null || snapshot === null ? null : toMazeKey(snapshot.current)

  const edit = (next: MazeBlueprint) => {
    setMaze(next)
    playback.reset()
  }

  const finalMeta = result.steps.at(-1)?.state.meta

  return (
    <GameLayout
      stage={
        <div className="flex w-full flex-col items-center gap-5">
          <PaintGrid
            label="Maze"
            rows={maze.rows}
            cols={maze.cols}
            onPaint={(row, col) => {
              edit(updateMazeCell(maze, { row, col }, tool))
            }}
            renderCell={(row, col) => {
              const key = toMazeKey({ row, col })
              const isStart = row === maze.start.row && col === maze.start.col
              const isGoal = row === maze.goal.row && col === maze.goal.col
              const isWall = wallKeys.has(key)
              return {
                label: isStart ? 'Start' : isGoal ? 'Goal' : isWall ? 'Wall' : undefined,
                className: cn(
                  'bg-surface-2',
                  explored.has(key) && 'bg-game/15',
                  frontier.has(key) && 'border-game/70 bg-game/30',
                  path.has(key) && 'bg-game text-white',
                  currentKey === key && 'ring-2 ring-fg',
                  isWall && 'bg-border-strong',
                ),
                content: isStart ? (
                  <Robot className="size-full p-0.5" />
                ) : isGoal ? (
                  <Flag className="size-full p-0.5" />
                ) : null,
              }
            }}
          />
          <p className="h-5 text-center font-mono text-xs text-muted">
            {activeFrame?.message ?? 'Draw walls, then press Run.'}
          </p>
        </div>
      }
      controls={
        <>
          <Field label="Algorithm">
            <Select
              label="Algorithm"
              value={algorithm}
              options={algorithmList}
              onChange={(next) => {
                setAlgorithm(next)
                playback.reset()
              }}
            />
          </Field>
          <Field label="Draw">
            <Segmented label="Draw tool" value={tool} options={TOOLS} onChange={setTool} />
          </Field>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                edit(randomizeMaze(maze))
              }}
            >
              <Dices /> Random
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                edit({ ...cloneMaze(maze), walls: [] })
              }}
            >
              <Eraser /> Clear
            </Button>
            <Button
              size="icon"
              aria-label="Restore default maze"
              onClick={() => {
                edit(defaultMazeBlueprint)
              }}
            >
              <RotateCcw />
            </Button>
          </div>
          <div className="border-t pt-5">
            <PlaybackBar playback={playback} />
          </div>
          <Legend
            items={[
              { label: 'Frontier', className: 'border-game/70 bg-game/30' },
              { label: 'Explored', className: 'border-transparent bg-game/15' },
              { label: 'Path', className: 'border-transparent bg-game' },
            ]}
          />
        </>
      }
      insightsLabel="Compare"
      insights={
        <>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Explored" value={result.exploredCount} />
            <Stat
              label="Path cost"
              value={result.status === 'completed' ? (finalMeta?.pathCost ?? 0) : '—'}
              tone={result.status === 'completed' ? undefined : 'bad'}
            />
          </div>
          {result.status !== 'completed' && <Callout>No route exists. Remove a wall.</Callout>}
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2/60 text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Algorithm</th>
                  <th className="px-3 py-2 text-right font-medium">Explored</th>
                  <th className="px-3 py-2 text-right font-medium">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {comparison.map((row) => (
                  <tr key={row.name} className={cn(row.name === algorithm && 'bg-game/10')}>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{row.explored}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      {row.found ? row.cost : <Badge tone="bad">none</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      }
    />
  )
}
