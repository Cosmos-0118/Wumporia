import { useEffect, useMemo, useRef, useState } from 'react'

import {
  clonePathfindingMap,
  defaultPathfindingBlueprint,
  getTerrainCost,
  randomizePathfindingMap,
  updatePathfindingCell,
} from '@/features/pathfinding/engine/grid'
import { pathfindingAlgorithms } from '@/features/pathfinding/engine/solver'
import type {
  PathfindingAlgorithm,
  PathfindingBlueprint,
  PathfindingSolveResult,
  PathfindingTool,
} from '@/features/pathfinding/types/pathfinding'
import { createPathfindingWorkerApi } from '@/features/pathfinding/workers'
import type { PathfindingBenchmarkRow } from '@/features/pathfinding/workers'
import { isSamePathPosition, toPathKey } from '@/features/pathfinding/utils/position'

const editorTools: PathfindingTool[] = ['obstacle', 'weight', 'erase', 'start', 'goal']
const PATHFINDING_AUTOPLAY_MS = 420

export function PathfindingRobotSection() {
  const [map, setMap] = useState<PathfindingBlueprint>(defaultPathfindingBlueprint)
  const [tool, setTool] = useState<PathfindingTool>('obstacle')
  const [algorithm, setAlgorithm] = useState<PathfindingAlgorithm>('A*')
  const [result, setResult] = useState<PathfindingSolveResult | null>(null)
  const [benchmarks, setBenchmarks] = useState<PathfindingBenchmarkRow[]>([])
  const [step, setStep] = useState(0)
  const [isSolving, setIsSolving] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)

  const workerRef = useRef<ReturnType<typeof createPathfindingWorkerApi> | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    workerRef.current = createPathfindingWorkerApi()

    return () => {
      workerRef.current?.dispose()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (workerRef.current === null) {
      return
    }

    let cancelled = false
    const requestId = ++requestIdRef.current

    async function run(): Promise<void> {
      setIsSolving(true)
      const [nextResult, nextBenchmarks] = await Promise.all([
        workerRef.current!.api.solve({ map, algorithm }),
        workerRef.current!.api.benchmark(map),
      ])

      if (cancelled || requestId !== requestIdRef.current) {
        return
      }

      setResult(nextResult)
      setBenchmarks(nextBenchmarks)
      setStep(Math.max(0, nextResult.steps.length - 1))
      setIsSolving(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [map, algorithm])

  const maxStep = Math.max(0, (result?.steps.length ?? 1) - 1)
  const hasReplaySteps = (result?.steps.length ?? 0) > 1
  const isAutoPlaying = isPlaying && hasReplaySteps && step < maxStep

  useEffect(() => {
    if (!isAutoPlaying) {
      return
    }

    const timer = window.setTimeout(() => {
      setStep((currentStep) => Math.min(currentStep + 1, maxStep))
    }, PATHFINDING_AUTOPLAY_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [isAutoPlaying, maxStep, step])

  const frame = result?.steps[step]?.state.current?.state ?? null
  const obstacleKeys = useMemo(() => new Set(map.obstacles.map(toPathKey)), [map.obstacles])
  const weightedCostByKey = useMemo(
    () =>
      map.weightedTiles.reduce<Record<string, number>>((accumulator, tile) => {
        accumulator[toPathKey(tile)] = tile.cost
        return accumulator
      }, {}),
    [map.weightedTiles],
  )
  const openKeys = useMemo(() => new Set(frame?.openKeys ?? []), [frame])
  const closedKeys = useMemo(() => new Set(frame?.closedKeys ?? []), [frame])
  const pathKeys = useMemo(() => new Set(frame?.pathKeys ?? []), [frame])
  const currentKey = frame?.current === null || frame?.current === undefined ? null : toPathKey(frame.current)

  const handleGridClick = (row: number, col: number) => {
    setIsPlaying(false)
    setMap((currentMap) => updatePathfindingCell(currentMap, { row, col }, tool))
  }

  const handleRandomize = () => {
    setIsPlaying(false)
    setMap((currentMap) => randomizePathfindingMap(currentMap))
  }

  const handleReset = () => {
    setIsPlaying(false)
    setMap(clonePathfindingMap(defaultPathfindingBlueprint))
    setAlgorithm('A*')
    setStep(0)
  }

  const handleStartAi = () => {
    if (!hasReplaySteps) {
      return
    }

    if (step >= maxStep) {
      setStep(0)
    }

    setIsPlaying(true)
  }

  const handlePauseAi = () => {
    setIsPlaying(false)
  }

  const handleResetReplay = () => {
    setIsPlaying(false)
    setStep(0)
  }

  const handleStepChange = (nextStep: number) => {
    setIsPlaying(false)
    setStep(nextStep)
  }

  return (
    <section className="pathfinding-lab" id="pathfinding-robot" aria-label="Pathfinding robot lab">
      <div className="pathfinding-lab__header">
        <div>
          <p className="eyebrow">Search Algorithms</p>
          <h2>Pathfinding Robot</h2>
          <p>
            Edit obstacles and weighted terrain, then compare how BFS, Dijkstra, and A* traverse the
            same map through open/closed sets, heuristic overlays, and benchmark metrics.
          </p>
        </div>
        <div className="pathfinding-summary-chips">
          <span>{map.rows}x{map.cols} grid</span>
          <span>{map.obstacles.length} obstacles</span>
          <span>{map.weightedTiles.length} weighted tiles</span>
          {isSolving ? <span>Solving in worker...</span> : null}
        </div>
      </div>

      <div className="pathfinding-workspace">
        <div className="pathfinding-editor-card">
          <div className="pathfinding-toolbar">
            <div className="pathfinding-toolbar__group">
              {editorTools.map((editorTool) => (
                <button
                  key={editorTool}
                  type="button"
                  className={tool === editorTool ? 'pathfinding-tool pathfinding-tool--active' : 'pathfinding-tool'}
                  onClick={() => setTool(editorTool)}
                >
                  {editorTool}
                </button>
              ))}
            </div>
            <div className="pathfinding-toolbar__group">
              <button type="button" onClick={handleRandomize}>Random Map</button>
              <button type="button" onClick={handleReset}>Reset</button>
            </div>
          </div>

          <div className="pathfinding-board" style={{ gridTemplateColumns: `repeat(${map.cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: map.rows * map.cols }, (_, index) => {
              const row = Math.floor(index / map.cols)
              const col = index % map.cols
              const position = { row, col }
              const key = toPathKey(position)
              const isObstacle = obstacleKeys.has(key)
              const isStart = isSamePathPosition(map.start, position)
              const isGoal = isSamePathPosition(map.goal, position)
              const weightedCost = weightedCostByKey[key]
              const isWeighted = weightedCost !== undefined
              const isOpen = openKeys.has(key)
              const isClosed = closedKeys.has(key)
              const isPath = pathKeys.has(key)
              const isCurrent = currentKey === key
              const heuristic = frame?.heuristicByKey[key]
              const cost = frame?.costByKey[key] ?? getTerrainCost(map, position)

              return (
                <button
                  key={key}
                  type="button"
                  className={[
                    'pathfinding-cell',
                    isObstacle ? 'pathfinding-cell--obstacle' : '',
                    isWeighted ? 'pathfinding-cell--weighted' : '',
                    isStart ? 'pathfinding-cell--start' : '',
                    isGoal ? 'pathfinding-cell--goal' : '',
                    isOpen ? 'pathfinding-cell--open' : '',
                    isClosed ? 'pathfinding-cell--closed' : '',
                    isPath ? 'pathfinding-cell--path' : '',
                    isCurrent ? 'pathfinding-cell--current' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleGridClick(row, col)}
                  aria-label={`Pathfinding cell ${row}, ${col}`}
                >
                  <span className="pathfinding-cell__marker">
                    {isStart ? 'S' : isGoal ? 'G' : isObstacle ? '■' : isWeighted ? String(weightedCost) : ''}
                  </span>
                  {!isObstacle && !isStart && !isGoal && heuristic !== undefined ? (
                    <span className="pathfinding-cell__meta">
                      <span className="pathfinding-cell__meta-line">h:{heuristic}</span>
                      <span className="pathfinding-cell__meta-line">g:{cost}</span>
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        <div className="pathfinding-sidepanel">
          <div className="pathfinding-config-card">
            <label className="pathfinding-select-wrap">
              Algorithm
              <select
                value={algorithm}
                onChange={(event) => {
                  setIsPlaying(false)
                  setAlgorithm(event.target.value as PathfindingAlgorithm)
                }}
              >
                {pathfindingAlgorithms.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <div className="pathfinding-replay-controls" aria-label="Pathfinding AI replay controls">
              <button
                type="button"
                className="pathfinding-replay-controls__button"
                onClick={handleStartAi}
                disabled={isSolving || !hasReplaySteps || isAutoPlaying}
              >
                Start AI
              </button>
              <button
                type="button"
                className="pathfinding-replay-controls__button pathfinding-replay-controls__button--ghost"
                onClick={handlePauseAi}
                disabled={!isAutoPlaying}
              >
                Pause
              </button>
              <button
                type="button"
                className="pathfinding-replay-controls__button pathfinding-replay-controls__button--ghost"
                onClick={handleResetReplay}
                disabled={isSolving || step === 0}
              >
                Reset
              </button>
            </div>

            <label className="pathfinding-select-wrap">
              Step Replay
              <input
                type="range"
                min={0}
                max={maxStep}
                value={Math.min(step, maxStep)}
                onChange={(event) => handleStepChange(Number(event.target.value))}
              />
            </label>
            <div className="pathfinding-metrics-inline">
              <span>Status: {result?.status ?? 'running'}</span>
              <span>Expanded: {result?.exploredCount ?? 0}</span>
              <span>Time: {result?.metrics.elapsedMs ?? 0}ms</span>
            </div>
            <p className="pathfinding-step-message">
              {isSolving
                ? 'Solving and benchmarking in worker...'
                : result?.steps[step]?.message ?? result?.failureReason ?? 'No steps available.'}
            </p>
          </div>

          <div className="pathfinding-benchmark-card">
            <div className="pathfinding-benchmark-card__header">
              <h3>Benchmark Panel</h3>
              <p>Node expansions, runtime, and path cost on the current map.</p>
            </div>
            <div className="pathfinding-benchmark-list">
              {benchmarks.map((benchmark) => (
                <div key={benchmark.algorithm} className="pathfinding-benchmark-row">
                  <strong>{benchmark.algorithm}</strong>
                  <span>{benchmark.success ? 'Solved' : 'Failed'}</span>
                  <span>{benchmark.exploredCount} expanded</span>
                  <span>{benchmark.pathCost} cost</span>
                  <span>{benchmark.elapsedMs}ms</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pathfinding-legend-card">
            <h3>Legend</h3>
            <div className="pathfinding-legend-grid">
              <span><i className="pathfinding-dot pathfinding-dot--open" /> Open list</span>
              <span><i className="pathfinding-dot pathfinding-dot--closed" /> Closed list</span>
              <span><i className="pathfinding-dot pathfinding-dot--path" /> Final path</span>
              <span><i className="pathfinding-dot pathfinding-dot--weighted" /> Weighted tile</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
