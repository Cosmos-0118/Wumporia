import { Dices } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Dirt, VacuumBot } from '@/components/art/sprites'
import { GameLayout } from '@/components/layout/GameLayout'
import { Button } from '@/components/ui/button'
import { Badge, Field } from '@/components/ui/misc'
import { PaintGrid } from '@/components/ui/paint-grid'
import { PlaybackBar } from '@/components/ui/playback'
import { Slider } from '@/components/ui/slider'
import { runVacuumComparison } from '@/features/vacuum/engine/agents'
import { createVacuumWorld, defaultVacuumBlueprint } from '@/features/vacuum/engine/world'
import type { VacuumRunResult } from '@/features/vacuum/types/vacuum'
import { cn } from '@/lib/cn'
import { usePlayback } from '@/lib/usePlayback'

function Room({ title, run, step }: { title: string; run: VacuumRunResult; step: number }) {
  const snapshot = run.history[Math.min(step, run.history.length - 1)]
  const dirty = new Set(snapshot?.dirtyKeys)
  const rows = defaultVacuumBlueprint.rows
  const cols = defaultVacuumBlueprint.cols

  return (
    <div className="w-full min-w-[260px] flex-1 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <Badge tone={dirty.size === 0 ? 'good' : 'neutral'}>
          {dirty.size === 0 ? 'Clean' : `${String(dirty.size)} dirty`}
        </Badge>
      </div>
      <PaintGrid
        label={title}
        rows={rows}
        cols={cols}
        renderCell={(row, col) => {
          const here = snapshot?.agent.row === row && snapshot.agent.col === col
          return {
            className: cn('bg-surface-2/70', here && 'bg-game/10'),
            content: here ? (
              <VacuumBot className="size-full" />
            ) : dirty.has(`${String(row)},${String(col)}`) ? (
              <Dirt className="size-full" />
            ) : null,
          }
        }}
      />
      <div className="h-4 font-mono text-xs text-muted">
        {snapshot !== undefined && snapshot.step > 0 ? snapshot.action : 'start'}
      </div>
    </div>
  )
}

export default function VacuumGame() {
  const [dirtProbability, setDirtProbability] = useState(defaultVacuumBlueprint.dirtProbability)
  const [world, setWorld] = useState(() => createVacuumWorld())

  const runs = useMemo(() => runVacuumComparison(world), [world])
  const total = Math.max(runs.reflex.history.length, runs.modelBased.history.length)
  const playback = usePlayback(total, 450)
  const step = Math.max(playback.cursor, 0)

  const regenerate = (probability: number) => {
    setWorld(createVacuumWorld({ ...defaultVacuumBlueprint, dirtProbability: probability }))
    playback.reset()
  }

  const rows: Array<{ label: string; reflex: number; model: number; lowerIsBetter: boolean }> = [
    {
      label: 'Moves',
      reflex: runs.reflex.metrics.moves,
      model: runs.modelBased.metrics.moves,
      lowerIsBetter: true,
    },
    {
      label: 'Energy used',
      reflex: runs.reflex.metrics.energyUsed,
      model: runs.modelBased.metrics.energyUsed,
      lowerIsBetter: true,
    },
    {
      label: 'Tiles cleaned',
      reflex: runs.reflex.metrics.cleanedTiles,
      model: runs.modelBased.metrics.cleanedTiles,
      lowerIsBetter: false,
    },
    {
      label: 'Still dirty',
      reflex: runs.reflex.metrics.remainingDirty,
      model: runs.modelBased.metrics.remainingDirty,
      lowerIsBetter: true,
    },
    {
      label: 'Steps',
      reflex: runs.reflex.metrics.steps,
      model: runs.modelBased.metrics.steps,
      lowerIsBetter: true,
    },
  ]

  return (
    <GameLayout
      stage={
        <div className="flex w-full flex-wrap items-start justify-center gap-8 [&>*]:basis-[300px]">
          <Room title="Reflex agent" run={runs.reflex} step={step} />
          <Room title="Model-based agent" run={runs.modelBased} step={step} />
        </div>
      }
      controls={
        <>
          <Field label={`Dirt density · ${String(Math.round(dirtProbability * 100))}%`}>
            <Slider
              label="Dirt density"
              min={0.1}
              max={0.7}
              step={0.05}
              value={dirtProbability}
              onChange={(value) => {
                setDirtProbability(value)
                regenerate(value)
              }}
            />
          </Field>
          <Button
            className="w-full"
            onClick={() => {
              regenerate(dirtProbability)
            }}
          >
            <Dices /> New room
          </Button>
          <div className="border-t pt-5">
            <PlaybackBar playback={playback} />
          </div>
        </>
      }
      insightsLabel="Results"
      insights={
        <>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2/60 text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium" />
                  <th className="px-3 py-2 text-right font-medium">Reflex</th>
                  <th className="px-3 py-2 text-right font-medium">Model</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => {
                  const better =
                    row.reflex === row.model
                      ? null
                      : row.reflex < row.model === row.lowerIsBetter
                        ? 'reflex'
                        : 'model'
                  return (
                    <tr key={row.label}>
                      <td className="px-3 py-2 text-muted">{row.label}</td>
                      <td
                        className={cn(
                          'px-3 py-2 text-right font-mono tabular-nums',
                          better === 'reflex' && 'text-good',
                        )}
                      >
                        {row.reflex}
                      </td>
                      <td
                        className={cn(
                          'px-3 py-2 text-right font-mono tabular-nums',
                          better === 'model' && 'text-good',
                        )}
                      >
                        {row.model}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted">
            The reflex agent patrols a fixed route. The model-based agent remembers the room and
            heads for dirt.
          </p>
        </>
      }
    />
  )
}
