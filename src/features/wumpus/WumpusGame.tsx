import confetti from 'canvas-confetti'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Dices, Hand } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Breeze, Explorer, Glitter, Gold, Pit, Stench, Wumpus } from '@/components/art/sprites'
import { GameLayout } from '@/components/layout/GameLayout'
import { Button } from '@/components/ui/button'
import { Badge, Field, Legend, Stat } from '@/components/ui/misc'
import { PaintGrid } from '@/components/ui/paint-grid'
import { PlaybackBar } from '@/components/ui/playback'
import { Segmented } from '@/components/ui/segmented'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { solveWumpusWorld } from '@/features/wumpus/engine/solver'
import {
  createWumpusWorld,
  defaultWumpusBlueprint,
  generateRandomWumpusBlueprint,
  getPercepts,
  grabGold,
  moveAgent,
} from '@/features/wumpus/engine/world'
import type {
  WumpusAgentState,
  WumpusBlueprint,
  WumpusDirection,
  WumpusKnowledge,
  WumpusStatus,
} from '@/features/wumpus/types/wumpus'
import { isSamePosition, toPositionKey } from '@/features/wumpus/utils/position'
import { cn } from '@/lib/cn'
import { usePlayback } from '@/lib/usePlayback'

type Mode = 'play' | 'ai'

const KEY_TO_DIRECTION: Record<string, WumpusDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

const STATUS_COPY: Record<WumpusStatus, { label: string; tone: 'neutral' | 'good' | 'bad' }> = {
  exploring: { label: 'Exploring', tone: 'neutral' },
  won: { label: 'Gold secured', tone: 'good' },
  lost: { label: 'Agent died', tone: 'bad' },
}

export default function WumpusGame() {
  const [mode, setMode] = useState<Mode>('play')
  const [size, setSize] = useState(4)
  const [reveal, setReveal] = useState(false)
  const [blueprint, setBlueprint] = useState<WumpusBlueprint>(defaultWumpusBlueprint)
  const [world, setWorld] = useState(() => createWumpusWorld(defaultWumpusBlueprint))

  const solution = useMemo(() => solveWumpusWorld(createWumpusWorld(blueprint)), [blueprint])
  const playback = usePlayback(solution.steps.length, 800)

  const frame = mode === 'ai' && playback.cursor >= 0 ? solution.steps[playback.cursor] : undefined
  const frameSnapshot = frame?.state.current?.state

  const view: {
    agent: WumpusAgentState
    knowledge: WumpusKnowledge
    status: WumpusStatus
    notes: string[]
  } =
    mode === 'ai' && frameSnapshot !== undefined && frame !== undefined
      ? {
          agent: frameSnapshot.agent,
          knowledge: frameSnapshot.knowledge,
          status: frame.state.meta.status,
          notes: frame.state.meta.reasoning,
        }
      : mode === 'ai'
        ? {
            ...createWumpusWorld(blueprint),
            notes: [],
          }
        : {
            agent: world.agent,
            knowledge: world.knowledge,
            status: world.status,
            notes: world.logs.map((entry) => entry.message),
          }

  const visited = useMemo(() => new Set(view.knowledge.visitedCells), [view.knowledge])
  const safe = useMemo(() => new Set(view.knowledge.safeCells), [view.knowledge])
  const suspectedPits = useMemo(() => new Set(view.knowledge.suspectedPitCells), [view.knowledge])
  const suspectedWumpus = useMemo(
    () => new Set(view.knowledge.suspectedWumpusCells),
    [view.knowledge],
  )

  const showHazards = reveal || view.status !== 'exploring'
  const percepts = view.knowledge.currentPercepts

  const newCave = (nextSize: number) => {
    const next =
      nextSize === 4 && size === 4 && blueprint !== defaultWumpusBlueprint
        ? generateRandomWumpusBlueprint({ size: 4, pitCount: 2 })
        : generateRandomWumpusBlueprint({ size: nextSize })
    setBlueprint(next)
    setWorld(createWumpusWorld(next))
    playback.reset()
  }

  const move = useCallback((direction: WumpusDirection) => {
    setWorld((current) => moveAgent(current, direction))
  }, [])

  const grab = useCallback(() => {
    const next = grabGold(world)
    setWorld(next)
    if (next.status === 'won') {
      void confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } })
    }
  }, [world])

  useEffect(() => {
    if (mode !== 'play') return
    const onKey = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key]
      if (direction !== undefined) {
        event.preventDefault()
        move(direction)
      } else if (event.key === ' ' || event.key === 'g') {
        event.preventDefault()
        grab()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [mode, move, grab])

  const status = STATUS_COPY[view.status]

  return (
    <GameLayout
      stage={
        <div className="flex w-full flex-col items-center gap-5">
          <PaintGrid
            label="Cave"
            rows={blueprint.size}
            cols={blueprint.size}
            renderCell={(row, col) => {
              const position = { row, col }
              const key = toPositionKey(position)
              const here = isSamePosition(view.agent.position, position)
              const isPit = blueprint.pits.some((pit) => isSamePosition(pit, position))
              const isWumpus = isSamePosition(blueprint.wumpus, position)
              const isGold = isSamePosition(blueprint.gold, position)
              const isVisited = visited.has(key)
              const cellPercepts = isVisited ? getPercepts(blueprint, position) : null

              let content = null
              if (here && view.agent.alive) {
                content = <Explorer className="size-4/5" />
              } else if (showHazards && isPit) {
                content = <Pit className="size-4/5" />
              } else if (showHazards && isWumpus) {
                content = <Wumpus className="size-4/5" />
              } else if (showHazards && isGold && !view.agent.hasGold) {
                content = <Gold className="size-4/5" />
              } else if (!isVisited && suspectedPits.has(key)) {
                content = <Pit className="size-1/2 opacity-40 grayscale" />
              } else if (!isVisited && suspectedWumpus.has(key)) {
                content = <Wumpus className="size-1/2 opacity-40 grayscale" />
              }

              return {
                label: `Cell ${String(row + 1)}, ${String(col + 1)}`,
                className: cn(
                  'rounded-xl bg-surface-2/40',
                  safe.has(key) && !isVisited && 'border-good/30 bg-good/10',
                  isVisited && 'border-border-strong bg-surface-2',
                  here && 'border-game bg-game/10 ring-1 ring-game',
                  here && !view.agent.alive && 'border-bad bg-bad/10 ring-bad',
                ),
                content: (
                  <>
                    {content}
                    {cellPercepts !== null && (
                      <span className="absolute right-1.5 bottom-1.5 flex gap-1">
                        {cellPercepts.breeze && <Breeze className="size-7" />}
                        {cellPercepts.smell && <Stench className="size-7" />}
                        {cellPercepts.glitter && <Glitter className="size-6" />}
                      </span>
                    )}
                  </>
                ),
              }
            }}
          />
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
      }
      controls={
        <>
          <Field label="Mode">
            <Segmented
              label="Mode"
              value={mode}
              options={[
                { value: 'play', label: 'Play' },
                { value: 'ai', label: 'Watch AI' },
              ]}
              onChange={(next) => {
                setMode(next)
                setWorld(createWumpusWorld(blueprint))
                playback.reset()
              }}
            />
          </Field>

          {mode === 'play' ? (
            <Field label="Move">
              <div className="flex items-center gap-4">
                <div className="grid grid-cols-3 gap-1">
                  <span />
                  <Button
                    size="icon"
                    aria-label="Up"
                    onClick={() => {
                      move('up')
                    }}
                  >
                    <ArrowUp />
                  </Button>
                  <span />
                  <Button
                    size="icon"
                    aria-label="Left"
                    onClick={() => {
                      move('left')
                    }}
                  >
                    <ArrowLeft />
                  </Button>
                  <Button
                    size="icon"
                    aria-label="Down"
                    onClick={() => {
                      move('down')
                    }}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    size="icon"
                    aria-label="Right"
                    onClick={() => {
                      move('right')
                    }}
                  >
                    <ArrowRight />
                  </Button>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!percepts.glitter || view.status !== 'exploring'}
                  onClick={grab}
                >
                  <Hand /> Grab gold
                </Button>
              </div>
              <p className="pt-1 text-xs text-subtle">Arrow keys or WASD also work.</p>
            </Field>
          ) : (
            <PlaybackBar playback={playback} />
          )}

          <div className="space-y-4 border-t pt-5">
            <Field label={`Cave size · ${String(size)}×${String(size)}`}>
              <Slider
                label="Cave size"
                min={4}
                max={8}
                value={size}
                onChange={(value) => {
                  setSize(value)
                  newCave(value)
                }}
              />
            </Field>
            <Switch checked={reveal} onChange={setReveal} label="Reveal hazards" />
            <Button
              className="w-full"
              onClick={() => {
                newCave(size)
              }}
            >
              <Dices /> New cave
            </Button>
          </div>
        </>
      }
      insightsLabel="Reasoning"
      insights={
        <>
          <Field label="Sensing here">
            <div className="flex flex-wrap gap-1.5">
              {!percepts.breeze && !percepts.smell && !percepts.glitter && <Badge>Nothing</Badge>}
              {percepts.breeze && <Badge tone="neutral">Breeze</Badge>}
              {percepts.smell && <Badge tone="warn">Stench</Badge>}
              {percepts.glitter && <Badge tone="warn">Glitter</Badge>}
            </div>
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Steps" value={view.agent.stepsTaken} />
            <Stat label="Visited" value={view.knowledge.visitedCells.length} />
            <Stat label="Safe" value={view.knowledge.safeCells.length} />
          </div>
          <Field label={mode === 'ai' ? 'Agent reasoning' : 'Log'}>
            {view.notes.length === 0 ? (
              <p className="text-sm text-muted">Nothing yet. Run the agent to see it think.</p>
            ) : (
              <ol className="space-y-1.5 text-sm text-muted">
                {view.notes.slice(-6).map((note, index) => (
                  <li key={`${String(index)}-${note}`} className="flex gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-border-strong" />
                    <span>{note}</span>
                  </li>
                ))}
              </ol>
            )}
          </Field>
          <Legend
            items={[
              { label: 'Visited', className: 'border-border-strong bg-surface-2' },
              { label: 'Known safe', className: 'border-good/30 bg-good/10' },
              { label: 'You', className: 'border-game bg-game/10' },
            ]}
          />
        </>
      }
    />
  )
}
