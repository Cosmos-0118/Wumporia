import { useEffect, useRef, useState } from 'react'

import {
  puzzle8AlgorithmList,
  solvePuzzle8,
} from '@/features/puzzle8/engine/solver'
import { isSolvable, shuffleBoard } from '@/features/puzzle8/engine/solvability'
import { getLegalMoves, getBlankIndex, isGoal } from '@/features/puzzle8/engine/board'
import type {
  Puzzle8Algorithm,
  Puzzle8Board,
  Puzzle8SolveResult,
  Puzzle8SolverMeta,
  Puzzle8StepFrame,
  Puzzle8Snapshot,
} from '@/features/puzzle8/types/puzzle8'
import { StepStreamController } from '@/shared/workers'
import type { StreamMode } from '@/shared/workers/stepStream'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INITIAL_BOARD: Puzzle8Board = shuffleBoard(60)

const TILE_LABEL: Record<number, string> = {
  0: '',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
}

// ---------------------------------------------------------------------------
// Sub-component: Board display
// ---------------------------------------------------------------------------

interface Puzzle8BoardProps {
  board: Puzzle8Board
  lastMovedTile: number | null
  onTileClick: (index: number) => void
  interactive: boolean
}

function Puzzle8BoardDisplay({ board, lastMovedTile, onTileClick, interactive }: Puzzle8BoardProps) {
  const blankIdx = getBlankIndex(board)

  return (
    <div className="puzzle8-board" aria-label="8-puzzle board">
      {board.map((tile, index) => {
        const isBlank = tile === 0
        const isAdjacentToBlank = (() => {
          const tileRow = Math.floor(index / 3)
          const tileCol = index % 3
          const blankRow = Math.floor(blankIdx / 3)
          const blankCol = blankIdx % 3
          return Math.abs(tileRow - blankRow) + Math.abs(tileCol - blankCol) === 1
        })()
        const isJustMoved = tile !== 0 && tile === lastMovedTile

        const cls = [
          'puzzle8-tile',
          isBlank ? 'puzzle8-tile--blank' : `puzzle8-tile--n${String(tile)}`,
          isJustMoved ? 'puzzle8-tile--moved' : '',
          interactive && isAdjacentToBlank && !isBlank ? 'puzzle8-tile--slidable' : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button
            key={index}
            type="button"
            className={cls}
            onClick={() => onTileClick(index)}
            disabled={isBlank || !interactive}
            aria-label={isBlank ? 'blank' : `tile ${String(tile)}`}
          >
            {TILE_LABEL[tile] ?? ''}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: Metrics card
// ---------------------------------------------------------------------------

interface MetricsProps {
  result: Puzzle8SolveResult
  algorithm: Puzzle8Algorithm
}

function MetricsCard({ result, algorithm }: MetricsProps) {
  const meta = result.steps[0]?.state.meta as Puzzle8SolverMeta | undefined
  const nodesExpanded = meta?.nodesExpanded ?? result.exploredCount
  const pathLength = meta?.pathLength ?? result.solutionPath.length - 1

  return (
    <div className="puzzle8-metrics">
      <div className="puzzle8-metrics__row">
        <span className="puzzle8-metrics__label">Algorithm</span>
        <span className="puzzle8-metrics__value puzzle8-metrics__value--algo">{algorithm}</span>
      </div>
      <div className="puzzle8-metrics__row">
        <span className="puzzle8-metrics__label">Status</span>
        <span
          className={`puzzle8-metrics__value ${result.status === 'completed' ? 'puzzle8-metrics__value--ok' : 'puzzle8-metrics__value--err'}`}
        >
          {result.status}
        </span>
      </div>
      <div className="puzzle8-metrics__row">
        <span className="puzzle8-metrics__label">Nodes expanded</span>
        <span className="puzzle8-metrics__value">{nodesExpanded.toLocaleString()}</span>
      </div>
      <div className="puzzle8-metrics__row">
        <span className="puzzle8-metrics__label">Solution moves</span>
        <span className="puzzle8-metrics__value">{pathLength}</span>
      </div>
      <div className="puzzle8-metrics__row">
        <span className="puzzle8-metrics__label">Solve time</span>
        <span className="puzzle8-metrics__value">{result.metrics.elapsedMs} ms</span>
      </div>
      {result.failureReason !== undefined && (
        <div className="puzzle8-metrics__row puzzle8-metrics__row--error">
          <span className="puzzle8-metrics__label">Failure</span>
          <span className="puzzle8-metrics__value puzzle8-metrics__value--err">
            {result.failureReason}
          </span>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Puzzle8Section() {
  const [board, setBoard] = useState<Puzzle8Board>(INITIAL_BOARD)
  const [algorithm, setAlgorithm] = useState<Puzzle8Algorithm>('A*')
  const [solveResult, setSolveResult] = useState<Puzzle8SolveResult | null>(null)
  const [activeFrame, setActiveFrame] = useState<Puzzle8StepFrame | null>(null)
  const [streamMode, setStreamMode] = useState<StreamMode>('idle')
  const [currentStep, setCurrentStep] = useState(0)
  const [speed, setSpeed] = useState(2)

  const streamRef = useRef<StepStreamController<Puzzle8Snapshot, Puzzle8SolverMeta> | null>(null)

  // Displayed board comes from the active replay frame, or from the live board state
  const displayedSnapshot = activeFrame?.state.current?.state
  const displayedBoard = displayedSnapshot?.board ?? board
  const lastMovedTile = displayedSnapshot?.movedTile ?? null

  // Whether user can manually slide tiles (only when not replaying)
  const interactive = streamMode === 'idle' || streamMode === 'paused'

  // ---------------------------------------------------------------------------
  // Stream lifecycle
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (solveResult === null) return

    const controller = new StepStreamController<Puzzle8Snapshot, Puzzle8SolverMeta>({
      frames: solveResult.steps,
      defaultSpeed: speed,
      onFrame: (frame) => {
        setActiveFrame(frame)
        setCurrentStep(frame.stepIndex)
      },
      onComplete: () => {
        setStreamMode('completed')
      },
    })
    streamRef.current = controller

    return () => {
      controller.reset()
      streamRef.current = null
    }
    // Intentionally exclude speed — handled via setSpeed below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solveResult])

  useEffect(() => {
    streamRef.current?.setSpeed(speed)
  }, [speed])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleTileClick(index: number) {
    if (!interactive) return
    // Find the legal move where the blank ends up at `index`
    const move = getLegalMoves(board).find((m) => m.blankTo === index)
    if (move === undefined) return
    const nextBoard = move.board
    setBoard(nextBoard)
    // Clear any existing solve result when user moves tiles manually
    setSolveResult(null)
    setActiveFrame(null)
    setStreamMode('idle')
    setCurrentStep(0)
  }

  function handleShuffle() {
    const next = shuffleBoard(80)
    setBoard(next)
    setSolveResult(null)
    setActiveFrame(null)
    setStreamMode('idle')
    setCurrentStep(0)
    streamRef.current?.reset()
    streamRef.current = null
  }

  function handleSolve() {
    streamRef.current?.reset()
    const result = solvePuzzle8(board, algorithm)
    setSolveResult(result)
    setActiveFrame(null)
    setStreamMode('idle')
    setCurrentStep(0)
  }

  function handlePlay() {
    if (streamMode === 'completed') {
      streamRef.current?.reset()
      setCurrentStep(0)
      setActiveFrame(null)
      setStreamMode('idle')
      // Play on next tick after reset
      setTimeout(() => {
        streamRef.current?.play()
        setStreamMode('playing')
      }, 0)
      return
    }
    streamRef.current?.play()
    setStreamMode('playing')
  }

  function handlePause() {
    streamRef.current?.pause()
    setStreamMode('paused')
  }

  function handleNext() {
    streamRef.current?.next()
  }

  function handleReset() {
    streamRef.current?.reset()
    setActiveFrame(null)
    setCurrentStep(0)
    setStreamMode('idle')
  }

  function handleStepSlider(step: number) {
    if (solveResult === null) return
    streamRef.current?.pause()
    // Manually jump to step by replaying until that index
    const frame = solveResult.steps[step]
    if (frame !== undefined) {
      setActiveFrame(frame)
      setCurrentStep(step)
      setStreamMode('paused')
    }
  }

  const totalSteps = solveResult?.steps.length ?? 0
  const solved = isGoal(displayedBoard)
  const solvable = isSolvable(board)

  return (
    <section className="puzzle8-lab" id="puzzle8" aria-label="8-Puzzle solver lab">
      {/* Header */}
      <div className="puzzle8-lab__header">
        <div>
          <p className="eyebrow">Heuristic Search</p>
          <h2>8 Puzzle Solver</h2>
          <p>
            Slide tiles into the correct order. Let the AI solve it with BFS, Greedy Best-First, or
            A* — then replay every move with complexity metrics.
          </p>
        </div>
        <div className="puzzle8-summary-chips">
          {!solvable && (
            <span className="puzzle8-chip puzzle8-chip--warn">Unsolvable config</span>
          )}
          {solved && <span className="puzzle8-chip puzzle8-chip--ok">Solved!</span>}
          {solveResult !== null && solveResult.status === 'failed' && (
            <span className="puzzle8-chip puzzle8-chip--err">No solution found</span>
          )}
        </div>
      </div>

      <div className="puzzle8-workspace">
        {/* Left: Board + controls */}
        <div className="puzzle8-board-col">
          <Puzzle8BoardDisplay
            board={displayedBoard}
            lastMovedTile={lastMovedTile}
            onTileClick={handleTileClick}
            interactive={interactive}
          />

          {/* Algorithm selector */}
          <div className="puzzle8-algo-bar">
            {puzzle8AlgorithmList.map((alg) => (
              <button
                key={alg}
                type="button"
                className={algorithm === alg ? 'puzzle8-algo-btn puzzle8-algo-btn--active' : 'puzzle8-algo-btn'}
                onClick={() => setAlgorithm(alg)}
              >
                {alg}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="puzzle8-action-bar">
            <button type="button" className="puzzle8-btn puzzle8-btn--secondary" onClick={handleShuffle}>
              Shuffle
            </button>
            <button
              type="button"
              className="puzzle8-btn puzzle8-btn--primary"
              onClick={handleSolve}
              disabled={!solvable || solved}
            >
              Solve with {algorithm}
            </button>
          </div>
        </div>

        {/* Right: Replay controls + metrics */}
        <div className="puzzle8-panel-col">
          {/* Replay controls */}
          {solveResult !== null && (
            <div className="puzzle8-replay-card">
              <div className="puzzle8-replay-header">
                <span className="puzzle8-replay-label">
                  Step {currentStep} / {Math.max(0, totalSteps - 1)}
                </span>
                <div className="puzzle8-speed-group">
                  <label htmlFor="p8-speed">Speed</label>
                  <select
                    id="p8-speed"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                  >
                    <option value={1}>1×</option>
                    <option value={2}>2×</option>
                    <option value={4}>4×</option>
                    <option value={8}>8×</option>
                  </select>
                </div>
              </div>

              {/* Step slider */}
              <input
                type="range"
                className="puzzle8-scrubber"
                min={0}
                max={Math.max(0, totalSteps - 1)}
                value={currentStep}
                onChange={(e) => handleStepSlider(Number(e.target.value))}
                aria-label="Solution step"
              />

              {/* Playback buttons */}
              <div className="puzzle8-playback">
                <button type="button" className="puzzle8-ctrl-btn" onClick={handleReset} title="Reset">
                  ⏮
                </button>
                <button type="button" className="puzzle8-ctrl-btn" onClick={handleNext} title="Step forward">
                  ⏭
                </button>
                {streamMode === 'playing' ? (
                  <button
                    type="button"
                    className="puzzle8-ctrl-btn puzzle8-ctrl-btn--primary"
                    onClick={handlePause}
                  >
                    ⏸ Pause
                  </button>
                ) : (
                  <button
                    type="button"
                    className="puzzle8-ctrl-btn puzzle8-ctrl-btn--primary"
                    onClick={handlePlay}
                  >
                    ▶ {streamMode === 'completed' ? 'Replay' : 'Play'}
                  </button>
                )}
              </div>

              {/* Step message */}
              {activeFrame !== null && (
                <p className="puzzle8-step-msg">{activeFrame.message}</p>
              )}
            </div>
          )}

          {/* Metrics */}
          {solveResult !== null && (
            <MetricsCard result={solveResult} algorithm={algorithm} />
          )}

          {/* Goal state reference */}
          <div className="puzzle8-goal-preview">
            <h4>Goal state</h4>
            <div className="puzzle8-goal-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 0].map((tile, i) => (
                <div
                  key={i}
                  className={`puzzle8-goal-cell ${tile === 0 ? 'puzzle8-goal-cell--blank' : ''}`}
                >
                  {tile !== 0 ? String(tile) : ''}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
