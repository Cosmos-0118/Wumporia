import { useEffect, useMemo, useRef, useState } from 'react'

import { WatchAISolvePanel } from '@/components/ui/WatchAISolvePanel'
import { solveWumpusWorld } from '@/features/wumpus/engine/solver'
import {
  createWumpusWorld,
  defaultWumpusBlueprint,
  grabGold,
  moveAgent,
} from '@/features/wumpus/engine/world'
import type {
  WumpusDirection,
  WumpusSolverMeta,
  WumpusSolverSnapshot,
  WumpusWorldState,
} from '@/features/wumpus/types/wumpus'
import { isSamePosition, toPositionKey } from '@/features/wumpus/utils/position'
import { StepStreamController } from '@/shared/workers'
import type { StepFrame } from '@/shared/types/solver'

type WumpusFrame = StepFrame<WumpusSolverSnapshot, WumpusSolverMeta>

const movementButtons: Array<{ label: string; direction: WumpusDirection }> = [
  { label: 'Up', direction: 'up' },
  { label: 'Left', direction: 'left' },
  { label: 'Right', direction: 'right' },
  { label: 'Down', direction: 'down' },
]

function makeFreshWorld() {
  return createWumpusWorld(defaultWumpusBlueprint)
}

export function WumpusWorldSection() {
  const [world, setWorld] = useState<WumpusWorldState>(() => makeFreshWorld())
  const [speed, setSpeed] = useState(2)
  const [running, setRunning] = useState(false)
  const [activeFrame, setActiveFrame] = useState<WumpusFrame | null>(null)

  const solverResult = useMemo(() => solveWumpusWorld(makeFreshWorld()), [])
  const streamRef = useRef<StepStreamController<WumpusSolverSnapshot, WumpusSolverMeta> | null>(null)

  useEffect(() => {
    streamRef.current = new StepStreamController({
      frames: solverResult.steps,
      defaultSpeed: 2,
      onFrame: (frame) => {
        setActiveFrame(frame)
      },
      onComplete: () => {
        setRunning(false)
      },
    })

    return () => {
      streamRef.current?.reset()
      streamRef.current = null
    }
  }, [solverResult.steps])

  useEffect(() => {
    streamRef.current?.setSpeed(speed)
  }, [speed])

  const aiWorld =
    activeFrame?.state.current === undefined
      ? null
      : {
          ...makeFreshWorld(),
          agent: activeFrame.state.current.state.agent,
          knowledge: activeFrame.state.current.state.knowledge,
          status: activeFrame.state.meta.status,
          logs: solverResult.steps.slice(0, activeFrame.stepIndex + 1).map((step, index) => ({
            turn: index + 1,
            message: step.message,
          })),
        }

  const displayedWorld = aiWorld ?? world
  const activeReasoning = activeFrame?.state.meta.reasoning ?? displayedWorld.knowledge.reasoning
  const visibleLogs = displayedWorld.logs.slice().reverse()

  const handleMove = (direction: WumpusDirection) => {
    streamRef.current?.pause()
    setRunning(false)
    setActiveFrame(null)
    setWorld((currentWorld) => moveAgent(currentWorld, direction))
  }

  const handleGrab = () => {
    streamRef.current?.pause()
    setRunning(false)
    setActiveFrame(null)
    setWorld((currentWorld) => grabGold(currentWorld))
  }

  const handleReset = () => {
    streamRef.current?.reset()
    setRunning(false)
    setActiveFrame(null)
    setSpeed(2)
    setWorld(makeFreshWorld())
  }

  const handleAutoStart = () => {
    streamRef.current?.reset()
    setActiveFrame(null)
    setRunning(true)
    setWorld(makeFreshWorld())
    streamRef.current?.play()
  }

  const handleAutoPause = () => {
    streamRef.current?.pause()
    setRunning(false)
  }

  const handleAutoStep = () => {
    streamRef.current?.pause()
    setRunning(false)
    if (activeFrame === null && streamRef.current?.getSnapshot().mode === 'completed') {
      streamRef.current?.reset()
    }
    streamRef.current?.next()
  }

  return (
    <section className="wumpus-lab" id="wumpus-world" aria-label="Wumpus World lab">
      <div className="wumpus-lab__header">
        <div>
          <p className="eyebrow">Logic + Inference</p>
          <h2>Wumpus World</h2>
          <p>
            Navigate the cave, read breeze and smell percepts, infer safe cells, and compare your
            playthrough with the explainable AI solver.
          </p>
        </div>
        <div className="wumpus-status">
          <span>{displayedWorld.status.toUpperCase()}</span>
          <span>Steps: {displayedWorld.agent.stepsTaken}</span>
          <span>{displayedWorld.agent.hasGold ? 'Gold secured' : 'Gold not secured'}</span>
        </div>
      </div>

      <div className="wumpus-lab__grid">
        <section className="wumpus-board-panel">
          <div
            className="wumpus-board"
            style={{ gridTemplateColumns: `repeat(${displayedWorld.size}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: displayedWorld.size * displayedWorld.size }, (_, index) => {
              const row = Math.floor(index / displayedWorld.size)
              const col = index % displayedWorld.size
              const position = { row, col }
              const key = toPositionKey(position)
              const isCurrent = isSamePosition(position, displayedWorld.agent.position)
              const isVisited = displayedWorld.knowledge.visitedCells.includes(key)
              const isSafe = displayedWorld.knowledge.safeCells.includes(key)
              const suspectPit = displayedWorld.knowledge.suspectedPitCells.includes(key)
              const suspectWumpus = displayedWorld.knowledge.suspectedWumpusCells.includes(key)
              const revealTruth = displayedWorld.status !== 'exploring' || isVisited
              const cellLabels: string[] = []

              if (isCurrent) {
                cellLabels.push('A')
              }
              if (revealTruth && isSamePosition(position, displayedWorld.blueprint.gold) && !displayedWorld.agent.hasGold) {
                cellLabels.push('G')
              }
              if (revealTruth && displayedWorld.blueprint.pits.some((pit) => isSamePosition(pit, position))) {
                cellLabels.push('P')
              }
              if (revealTruth && isSamePosition(position, displayedWorld.blueprint.wumpus)) {
                cellLabels.push('W')
              }

              const cellClassName = [
                'wumpus-cell',
                isCurrent ? 'wumpus-cell--current' : '',
                isVisited ? 'wumpus-cell--visited' : '',
                isSafe ? 'wumpus-cell--safe' : '',
                suspectPit ? 'wumpus-cell--pit-risk' : '',
                suspectWumpus ? 'wumpus-cell--wumpus-risk' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <div className={cellClassName} key={key}>
                  <span className="wumpus-cell__coord">{row},{col}</span>
                  <div className="wumpus-cell__tokens">
                    {cellLabels.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="wumpus-controls">
            <div className="wumpus-controls__movement">
              {movementButtons.map((button) => (
                <button
                  key={button.direction}
                  type="button"
                  onClick={() => handleMove(button.direction)}
                  disabled={displayedWorld.status !== 'exploring' || activeFrame !== null}
                >
                  {button.label}
                </button>
              ))}
            </div>
            <div className="wumpus-controls__actions">
              <button type="button" onClick={handleGrab} disabled={displayedWorld.status !== 'exploring' || activeFrame !== null}>
                Grab Gold
              </button>
              <button type="button" onClick={handleReset}>
                Reset Scenario
              </button>
            </div>
          </div>
        </section>

        <section className="wumpus-side-panel">
          <div className="wumpus-panel-card">
            <h3>Percepts</h3>
            <div className="wumpus-percepts">
              <span className={displayedWorld.knowledge.currentPercepts.breeze ? 'wumpus-chip wumpus-chip--active' : 'wumpus-chip'}>
                Breeze
              </span>
              <span className={displayedWorld.knowledge.currentPercepts.smell ? 'wumpus-chip wumpus-chip--active' : 'wumpus-chip'}>
                Smell
              </span>
              <span className={displayedWorld.knowledge.currentPercepts.glitter ? 'wumpus-chip wumpus-chip--active' : 'wumpus-chip'}>
                Glitter
              </span>
            </div>
          </div>

          <div className="wumpus-panel-card">
            <h3>Rule Derivation</h3>
            <ul className="wumpus-reasoning-list">
              {activeReasoning.map((reason, index) => (
                <li key={`${reason}-${index}`}>{reason}</li>
              ))}
            </ul>
          </div>

          <div className="wumpus-panel-card">
            <h3>Knowledge Map</h3>
            <div className="wumpus-knowledge-columns">
              <div>
                <strong>Safe</strong>
                <ul>
                  {displayedWorld.knowledge.safeCells.map((key) => (
                    <li key={key}>{key}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Suspected Pits</strong>
                <ul>
                  {displayedWorld.knowledge.suspectedPitCells.map((key) => (
                    <li key={key}>{key}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Suspected Wumpus</strong>
                <ul>
                  {displayedWorld.knowledge.suspectedWumpusCells.map((key) => (
                    <li key={key}>{key}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>

      <WatchAISolvePanel
        gameTitle="Wumpus World"
        speed={speed}
        running={running}
        onSpeedChange={setSpeed}
        onStart={handleAutoStart}
        onPause={handleAutoPause}
        onStep={handleAutoStep}
        onReset={handleReset}
      />

      <div className="wumpus-lab__timeline-grid">
        <section className="wumpus-panel-card">
          <h3>AI Inference Timeline</h3>
          <ol className="wumpus-timeline">
            {solverResult.steps.map((step) => (
              <li
                key={step.stepIndex}
                className={activeFrame?.stepIndex === step.stepIndex ? 'wumpus-timeline__item wumpus-timeline__item--active' : 'wumpus-timeline__item'}
              >
                <strong>Step {step.stepIndex + 1}</strong>
                <span>{step.message}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="wumpus-panel-card">
          <h3>Action Log</h3>
          <ol className="wumpus-log">
            {visibleLogs.map((entry) => (
              <li key={`${entry.turn}-${entry.message}`}>
                <strong>T{entry.turn}</strong>
                <span>{entry.message}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  )
}
