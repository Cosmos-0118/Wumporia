import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { solveWumpusWorld } from '@/features/wumpus/engine/solver'
import {
  createWumpusWorld,
  generateRandomWumpusBlueprint,
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

import './WumpusWorldSection.css'

type WumpusFrame = StepFrame<WumpusSolverSnapshot, WumpusSolverMeta>
type ThoughtTone = 'calm' | 'alert' | 'positive' | 'critical'
type WumpusCellToken = 'A' | 'G' | 'P' | 'W'

const TOKEN_LABELS: Record<WumpusCellToken, string> = {
  A: 'Agent',
  G: 'Gold',
  P: 'Pit',
  W: 'Wumpus',
}

const movementButtons: Array<{
  symbol: string
  direction: WumpusDirection
  slot: 'up' | 'left' | 'right' | 'down'
}> = [
  { symbol: '↑', direction: 'up', slot: 'up' },
  { symbol: '←', direction: 'left', slot: 'left' },
  { symbol: '→', direction: 'right', slot: 'right' },
  { symbol: '↓', direction: 'down', slot: 'down' },
]

function createScenario(size = 6): WumpusWorldState['blueprint'] {
  const basePitCount = Math.max(2, Math.floor(size * 0.65))
  let bestScenario = generateRandomWumpusBlueprint({ size, pitCount: basePitCount })
  let bestScore = Number.NEGATIVE_INFINITY

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const candidate = generateRandomWumpusBlueprint({
      size,
      pitCount: Math.max(2, basePitCount + ((attempt % 3) - 1)),
    })
    const result = solveWumpusWorld(createWumpusWorld(candidate))

    if (result.status === 'completed') {
      return candidate
    }

    const score =
      (result.exploredCount * 2) +
      result.solutionPath.length -
      (result.failureReason?.includes('guaranteed safe') === true ? 4 : 0)

    if (score > bestScore) {
      bestScore = score
      bestScenario = candidate
    }
  }

  return bestScenario
}

function getThoughtTone(message: string | null): ThoughtTone {
  if (message === null) {
    return 'calm'
  }

  const text = message.toLowerCase()
  if (text.includes('wins') || text.includes('grab') || text.includes('safe')) {
    return 'positive'
  }
  if (text.includes('lost') || text.includes('pit') || text.includes('wumpus')) {
    return 'critical'
  }
  if (text.includes('breeze') || text.includes('smell') || text.includes('risk')) {
    return 'alert'
  }
  return 'calm'
}

function isNearBottom(container: HTMLElement, threshold = 56): boolean {
  const distanceFromBottom =
    container.scrollHeight - (container.scrollTop + container.clientHeight)

  return distanceFromBottom <= threshold
}

export function WumpusWorldSection() {
  const [mapSize, setMapSize] = useState(6)
  const [scenario, setScenario] = useState(() => createScenario(6))
  const [world, setWorld] = useState<WumpusWorldState>(() => createWumpusWorld(scenario))
  const [speed, setSpeed] = useState(1)
  const [running, setRunning] = useState(false)
  const [activeFrame, setActiveFrame] = useState<WumpusFrame | null>(null)

  const solverResult = useMemo(() => solveWumpusWorld(createWumpusWorld(scenario)), [scenario])
  const streamRef = useRef<StepStreamController<WumpusSolverSnapshot, WumpusSolverMeta> | null>(null)
  const reasoningListRef = useRef<HTMLUListElement | null>(null)
  const logListRef = useRef<HTMLOListElement | null>(null)
  const safeKnowledgeRef = useRef<HTMLUListElement | null>(null)
  const pitKnowledgeRef = useRef<HTMLUListElement | null>(null)
  const wumpusKnowledgeRef = useRef<HTMLUListElement | null>(null)
  const followReasoningRef = useRef(true)
  const followLogRef = useRef(true)
  const followSafeRef = useRef(true)
  const followPitRef = useRef(true)
  const followWumpusRef = useRef(true)

  useEffect(() => {
    streamRef.current = new StepStreamController({
      frames: solverResult.steps,
      defaultSpeed: 1,
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
          ...createWumpusWorld(scenario),
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
  const visibleLogs = displayedWorld.logs
  const safeCells = displayedWorld.knowledge.safeCells
  const pitCells = displayedWorld.knowledge.suspectedPitCells
  const wumpusCells = displayedWorld.knowledge.suspectedWumpusCells
  const boardCellDensityClass =
    displayedWorld.size >= 8
      ? 'wumpusx-cell--dense'
      : displayedWorld.size >= 7
        ? 'wumpusx-cell--compact'
        : ''
  const canManualControl = displayedWorld.status === 'exploring' && activeFrame === null
  const isAutoViewing = activeFrame !== null || running
  const activeThought =
    running || activeFrame !== null
      ? (activeFrame?.message ?? 'Agent is evaluating safe moves from current percepts...')
      : null
  const thoughtTone = getThoughtTone(activeThought)

  useEffect(() => {
    const reasoningElement = reasoningListRef.current
    if (reasoningElement === null) {
      return
    }

    if (followReasoningRef.current) {
      reasoningElement.scrollTop = reasoningElement.scrollHeight
    }
  }, [activeReasoning.length])

  useEffect(() => {
    const logElement = logListRef.current
    if (logElement === null) {
      return
    }

    if (followLogRef.current) {
      logElement.scrollTop = logElement.scrollHeight
    }
  }, [displayedWorld.logs.length])

  useEffect(() => {
    const panel = safeKnowledgeRef.current
    if (panel !== null && followSafeRef.current) {
      panel.scrollTop = panel.scrollHeight
    }
  }, [safeCells.length])

  useEffect(() => {
    const panel = pitKnowledgeRef.current
    if (panel !== null && followPitRef.current) {
      panel.scrollTop = panel.scrollHeight
    }
  }, [pitCells.length])

  useEffect(() => {
    const panel = wumpusKnowledgeRef.current
    if (panel !== null && followWumpusRef.current) {
      panel.scrollTop = panel.scrollHeight
    }
  }, [wumpusCells.length])

  const handleReasoningScroll = () => {
    const panel = reasoningListRef.current
    if (panel === null) {
      return
    }
    followReasoningRef.current = isNearBottom(panel)
  }

  const handleLogScroll = () => {
    const panel = logListRef.current
    if (panel === null) {
      return
    }
    followLogRef.current = isNearBottom(panel)
  }

  const handleSafeScroll = () => {
    const panel = safeKnowledgeRef.current
    if (panel === null) {
      return
    }
    followSafeRef.current = isNearBottom(panel)
  }

  const handlePitScroll = () => {
    const panel = pitKnowledgeRef.current
    if (panel === null) {
      return
    }
    followPitRef.current = isNearBottom(panel)
  }

  const handleWumpusScroll = () => {
    const panel = wumpusKnowledgeRef.current
    if (panel === null) {
      return
    }
    followWumpusRef.current = isNearBottom(panel)
  }

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

  const handleRetryMap = () => {
    streamRef.current?.reset()
    setRunning(false)
    setActiveFrame(null)
    setWorld(createWumpusWorld(scenario))
  }

  const handleGenerateMap = () => {
    streamRef.current?.reset()
    setRunning(false)
    setActiveFrame(null)

    const nextScenario = createScenario(mapSize)
    setScenario(nextScenario)
    setWorld(createWumpusWorld(nextScenario))
  }

  const handleAutoStart = () => {
    streamRef.current?.reset()
    setActiveFrame(null)
    setRunning(true)
    setWorld(createWumpusWorld(scenario))
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

  const thoughtPopup =
    activeThought === null || typeof document === 'undefined'
      ? null
      : createPortal(
          <div
            className={`wumpusx-thought wumpusx-thought--${thoughtTone}`}
            role="status"
            aria-live="polite"
          >
            <span className="wumpusx-thought__label">Agent Thinking</span>
            <p>{activeThought}</p>
          </div>,
          document.body,
        )

  return (
    <>
      <section className="wumpusx" id="wumpus-world" aria-label="Wumpus World lab">
      <header className="wumpusx__header">
        <div className="wumpusx__title-wrap">
          <p className="eyebrow">Inference Playground</p>
          <h2>Wumpus World Control Deck</h2>
          <p>
            Read percepts, infer danger, and control a slower explainable agent on a larger,
            freshly generated cave each run.
          </p>
        </div>
        <div className="wumpusx__status-strip">
          <span className="wumpusx__status-pill">State: {displayedWorld.status.toUpperCase()}</span>
          <span className="wumpusx__status-pill">Steps: {displayedWorld.agent.stepsTaken}</span>
          <span className="wumpusx__status-pill">Map: {scenario.size}x{scenario.size}</span>
          <span className="wumpusx__status-pill">
            {displayedWorld.agent.hasGold ? 'Gold secured' : 'Gold not secured'}
          </span>
        </div>
      </header>

      <div className="wumpusx__layout">
        <div className="wumpusx__top-row">
          <section className="wumpusx__board-card">
            <div
              className="wumpusx__board"
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
                const cellLabels: WumpusCellToken[] = []

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
                  'wumpusx-cell',
                  boardCellDensityClass,
                  isCurrent ? 'wumpusx-cell--current' : '',
                  isVisited ? 'wumpusx-cell--visited' : '',
                  isSafe ? 'wumpusx-cell--safe' : '',
                  suspectPit ? 'wumpusx-cell--pit-risk' : '',
                  suspectWumpus ? 'wumpusx-cell--wumpus-risk' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <div className={cellClassName} key={key}>
                    <span className="wumpusx-cell__coord">{row},{col}</span>
                    <div className="wumpusx-cell__tokens">
                      {cellLabels.map((label) => (
                        <span
                          key={label}
                          className={`wumpusx-token wumpusx-token--${label.toLowerCase()}`}
                          aria-label={TOKEN_LABELS[label]}
                          title={TOKEN_LABELS[label]}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <aside className="wumpusx__controls" aria-label="Wumpus controls">
            <div className="wumpusx__controls-col">
              <h3>Manual Controls</h3>
              <div className="wumpusx-dpad" aria-label="Move agent">
              {movementButtons.map((button) => (
                <button
                  className={`wumpusx-btn wumpusx-btn--icon wumpusx-dpad__${button.slot}`}
                  key={button.direction}
                  type="button"
                  onClick={() => handleMove(button.direction)}
                  aria-label={`Move ${button.direction}`}
                  disabled={!canManualControl}
                >
                  {button.symbol}
                </button>
              ))}
              </div>
              <div className="wumpusx__action-row">
                <button type="button" className="wumpusx-btn" onClick={handleGrab} disabled={!canManualControl}>
                  Grab Gold
                </button>
                <button type="button" className="wumpusx-btn wumpusx-btn--ghost" onClick={handleRetryMap}>
                  Retry Map
                </button>
              </div>
            </div>

            <div className="wumpusx__controls-col">
              <h3>AI Playback</h3>
              <label className="wumpusx-slider" htmlFor="wumpus-speed">
                Agent Pace: {speed}x
              </label>
              <input
                id="wumpus-speed"
                className="wumpusx-range"
                type="range"
                min={1}
                max={3}
                step={1}
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              />
              <div className="wumpusx__action-row">
                <button
                  type="button"
                  className="wumpusx-btn"
                  onClick={handleAutoStart}
                  disabled={running}
                >
                  Start AI
                </button>
                <button
                  type="button"
                  className="wumpusx-btn wumpusx-btn--ghost"
                  onClick={handleAutoPause}
                  disabled={!running}
                >
                  Pause
                </button>
                <button type="button" className="wumpusx-btn wumpusx-btn--ghost" onClick={handleAutoStep}>
                  Next
                </button>
              </div>
            </div>

            <div className="wumpusx__controls-col">
              <h3>Scenario</h3>
              <label className="wumpusx-slider" htmlFor="wumpus-size">
                Cave Size: {mapSize}x{mapSize}
              </label>
              <input
                id="wumpus-size"
                className="wumpusx-range"
                type="range"
                min={5}
                max={8}
                step={1}
                value={mapSize}
                onChange={(event) => setMapSize(Number(event.target.value))}
              />
              <button type="button" className="wumpusx-btn" onClick={handleGenerateMap}>
                Generate New Cave
              </button>
            </div>
          </aside>
        </div>

        <section className="wumpusx__info-stack">
          <div className="wumpusx__panel-card">
            <h3>Percepts</h3>
            <div className="wumpusx__percepts">
              <span className={displayedWorld.knowledge.currentPercepts.breeze ? 'wumpusx-chip wumpusx-chip--active' : 'wumpusx-chip'}>
                  <img src="/icons/games/breeze.svg" alt="" aria-hidden="true" className="wumpusx-chip__icon" />
                Breeze
              </span>
              <span className={displayedWorld.knowledge.currentPercepts.smell ? 'wumpusx-chip wumpusx-chip--active' : 'wumpusx-chip'}>
                  <img src="/icons/games/smell.svg" alt="" aria-hidden="true" className="wumpusx-chip__icon" />
                Smell
              </span>
              <span className={displayedWorld.knowledge.currentPercepts.glitter ? 'wumpusx-chip wumpusx-chip--active' : 'wumpusx-chip'}>
                  <img src="/icons/games/glitter.svg" alt="" aria-hidden="true" className="wumpusx-chip__icon" />
                Glitter
              </span>
            </div>
          </div>

          <div className="wumpusx__panel-card">
            <h3>Rule Derivation</h3>
            <ul
              className="wumpusx__reasoning-list wumpusx__scroll-panel"
              ref={reasoningListRef}
              onScroll={handleReasoningScroll}
            >
              {activeReasoning.map((reason, index) => (
                <li
                  key={`${reason}-${index}`}
                  className={
                    index === activeReasoning.length - 1
                      ? 'wumpusx__reasoning-item wumpusx__reasoning-item--active'
                      : 'wumpusx__reasoning-item'
                  }
                >
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <div className="wumpusx__panel-card">
            <h3>Knowledge Map</h3>
            <div className="wumpusx__knowledge-columns">
              <div className="wumpusx-knowledge-card wumpusx-knowledge-card--safe">
                <strong>Safe</strong>
                <ul className="wumpusx__scroll-panel" ref={safeKnowledgeRef} onScroll={handleSafeScroll}>
                  {safeCells.map((key, index) => (
                    <li
                      key={key}
                      className={
                        index === safeCells.length - 1
                          ? 'wumpusx-knowledge-item wumpusx-knowledge-item--active'
                          : 'wumpusx-knowledge-item'
                      }
                    >
                      {key}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="wumpusx-knowledge-card wumpusx-knowledge-card--pit">
                <strong>Suspected Pits</strong>
                <ul className="wumpusx__scroll-panel" ref={pitKnowledgeRef} onScroll={handlePitScroll}>
                  {pitCells.map((key, index) => (
                    <li
                      key={key}
                      className={
                        index === pitCells.length - 1
                          ? 'wumpusx-knowledge-item wumpusx-knowledge-item--active'
                          : 'wumpusx-knowledge-item'
                      }
                    >
                      {key}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="wumpusx-knowledge-card wumpusx-knowledge-card--wumpus">
                <strong>Suspected Wumpus</strong>
                <ul className="wumpusx__scroll-panel" ref={wumpusKnowledgeRef} onScroll={handleWumpusScroll}>
                  {wumpusCells.map((key, index) => (
                    <li
                      key={key}
                      className={
                        index === wumpusCells.length - 1
                          ? 'wumpusx-knowledge-item wumpusx-knowledge-item--active'
                          : 'wumpusx-knowledge-item'
                      }
                    >
                      {key}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="wumpusx__feed-wrap">
        <section className="wumpusx__panel-card">
          <h3>{isAutoViewing ? 'AI Activity Feed' : 'Action Log'}</h3>
          <ol className="wumpusx__log wumpusx__scroll-panel" ref={logListRef} onScroll={handleLogScroll}>
            {visibleLogs.map((entry, index) => (
              <li
                key={`${entry.turn}-${entry.message}`}
                className={
                  index === visibleLogs.length - 1
                    ? 'wumpusx__log-item wumpusx__log-item--active'
                    : 'wumpusx__log-item'
                }
              >
                <strong>T{entry.turn}</strong>
                <span>{entry.message}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      </section>
      {thoughtPopup}
    </>
  )
}
