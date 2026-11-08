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
  clonePathfindingMap,
  defaultPathfindingBlueprint,
  getTerrainCost,
  randomizePathfindingMap,
  updatePathfindingCell,
} from '@/features/pathfinding/engine/grid'
import {
  benchmarkPathfinding,
  pathfindingAlgorithms,
  solvePathfinding,
} from '@/features/pathfinding/engine/solver'
import type {
  PathfindingAlgorithm,
  PathfindingBlueprint,
  PathfindingTool,
} from '@/features/pathfinding/types/pathfinding'
import { toPathKey } from '@/features/pathfinding/utils/position'
import { cn } from '@/lib/cn'
import { usePlayback } from '@/lib/usePlayback'

const TOOLS: Array<{ value: PathfindingTool; label: string }> = [
  { value: 'obstacle', label: 'Wall' },
  { value: 'weight', label: 'Mud' },
  { value: 'erase', label: 'Erase' },
  { value: 'start', label: 'Start' },
  { value: 'goal', label: 'Goal' },
]

export default function PathfindingGame() {
  const [map, setMap] = useState<PathfindingBlueprint>(defaultPathfindingBlueprint)
  const [algorithm, setAlgorithm] = useState<PathfindingAlgorithm>('A*')
  const [tool, setTool] = useState<PathfindingTool>('obstacle')

  const result = useMemo(() => solvePathfinding(map, algorithm), [map, algorithm])
  const benchmark = useMemo(() => benchmarkPathfinding(map), [map])
  const playback = usePlayback(result.steps.length, 450)

  const activeFrame = playback.cursor >= 0 ? result.steps[playback.cursor] : undefined
  const snapshot = activeFrame?.state.current?.state ?? null
  const open = useMemo(() => new Set(snapshot?.openKeys), [snapshot])
  const closed = useMemo(() => new Set(snapshot?.closedKeys), [snapshot])
  const path = useMemo(() => new Set(snapshot?.pathKeys), [snapshot])
  const walls = useMemo(() => new Set(map.obstacles.map(toPathKey)), [map])
  const currentKey =
    snapshot?.current === null || snapshot === null ? null : toPathKey(snapshot.current)

  const edit = (next: PathfindingBlueprint) => {
    setMap(next)
    playback.reset()
  }

  const pathCost = result.steps.at(-1)?.state.meta.pathCost ?? 0
  const solved = result.status === 'completed'

  return (
    <GameLayout
      stage={
        <div className="flex w-full flex-col items-center gap-5">
          <PaintGrid
            label="Terrain"
            rows={map.rows}
            cols={map.cols}
            onPaint={(row, col) => {
              edit(updatePathfindingCell(map, { row, col }, tool))
            }}
            renderCell={(row, col) => {
              const position = { row, col }
              const key = toPathKey(position)
              const isStart = row === map.start.row && col === map.start.col
              const isGoal = row === map.goal.row && col === map.goal.col
              const cost = getTerrainCost(map, position)
              const isMud = cost > 1
              return {
                label: isStart ? 'Start' : isGoal ? 'Goal' : walls.has(key) ? 'Wall' : undefined,
                className: cn(
                  'bg-surface-2',
                  isMud && 'bg-warn/20 text-warn',
                  closed.has(key) && 'bg-game/15',
                  open.has(key) && 'border-game/70 bg-game/30',
                  path.has(key) && 'bg-game text-white',
                  currentKey === key && 'ring-2 ring-fg',
                  walls.has(key) && 'bg-border-strong',
                ),
                content: isStart ? (
                  <Robot className="size-full p-0.5" />
                ) : isGoal ? (
                  <Flag className="size-full p-0.5" />
                ) : isMud ? (
                  <span className="font-mono">{cost}</span>
                ) : null,
              }
            }}
          />
          <p className="h-5 text-center font-mono text-xs text-muted">
            {activeFrame?.message ?? 'Paint walls and mud, then press Run.'}
          </p>
        </div>
      }
      controls={
        <>
          <Field label="Algorithm">
            <Select
              label="Algorithm"
              value={algorithm}
              options={pathfindingAlgorithms}
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
                edit(randomizePathfindingMap(map))
              }}
            >
              <Dices /> Random
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                edit({ ...clonePathfindingMap(map), obstacles: [], weightedTiles: [] })
              }}
            >
              <Eraser /> Clear
            </Button>
            <Button
              size="icon"
              aria-label="Restore default map"
              onClick={() => {
                edit(defaultPathfindingBlueprint)
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
              { label: 'Open', className: 'border-game/70 bg-game/30' },
              { label: 'Closed', className: 'border-transparent bg-game/15' },
              { label: 'Mud', className: 'border-transparent bg-warn/20' },
              { label: 'Path', className: 'border-transparent bg-game' },
            ]}
          />
        </>
      }
      insightsLabel="Benchmark"
      insights={
        <>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Explored" value={result.exploredCount} />
            <Stat
              label="Path cost"
              value={solved ? pathCost : '—'}
              tone={solved ? undefined : 'bad'}
            />
          </div>
          {!solved && <Callout>The goal is walled off. Clear a path.</Callout>}
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
                {benchmark.map((row) => (
                  <tr
                    key={row.algorithm}
                    className={cn(row.algorithm === algorithm && 'bg-game/10')}
                  >
                    <td className="px-3 py-2">{row.algorithm}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      {row.exploredCount}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      {row.success ? row.pathCost : <Badge tone="bad">none</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Callout>BFS ignores terrain cost. Dijkstra and A* route around mud.</Callout>
        </>
      }
    />
  )
}
