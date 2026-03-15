import { useMemo, useState } from 'react'

import {
  clonePathfindingMap,
  defaultPathfindingBlueprint,
  getTerrainCost,
  randomizePathfindingMap,
  updatePathfindingCell,
} from '@/features/pathfinding/engine/grid'
import { benchmarkPathfinding, pathfindingAlgorithms, solvePathfinding } from '@/features/pathfinding/engine/solver'
import type {
  PathfindingAlgorithm,
  PathfindingBlueprint,
  PathfindingSolveResult,
  PathfindingTool,
} from '@/features/pathfinding/types/pathfinding'
import { isSamePathPosition, toPathKey } from '@/features/pathfinding/utils/position'

const editorTools: PathfindingTool[] = ['obstacle', 'weight', 'erase', 'start', 'goal']

export function PathfindingRobotSection() {
  const [map, setMap] = useState<PathfindingBlueprint>(defaultPathfindingBlueprint)
  const [tool, setTool] = useState<PathfindingTool>('obstacle')
  const [algorithm, setAlgorithm] = useState<PathfindingAlgorithm>('A*')
  const [result, setResult] = useState<PathfindingSolveResult>(() => solvePathfinding(defaultPathfindingBlueprint, 'A*'))
  const [step, setStep] = useState<number>(() => Math.max(0, solvePathfinding(defaultPathfindingBlueprint, 'A*').steps.length - 1))

  const benchmarks = useMemo(() => benchmarkPathfinding(map), [map])
  const frame = result.steps[step]?.state.current?.state ?? null

  const rerun = (nextMap: PathfindingBlueprint, nextAlgorithm = algorithm) => {
    const nextResult = solvePathfinding(nextMap, nextAlgorithm)
    setResult(nextResult)
    setStep(Math.max(0, nextResult.steps.length - 1))
  }

  const handleGridClick = (row: number, col: number) => {
    const nextMap = updatePathfindingCell(map, { row, col }, tool)
    setMap(nextMap)
    rerun(nextMap)
  }

  const handleRandomize = () => {
    const nextMap = randomizePathfindingMap(map)
    setMap(nextMap)
    rerun(nextMap)
  }

  const handleReset = () => {
    const nextMap = clonePathfindingMap(defaultPathfindingBlueprint)
    setMap(nextMap)
    setAlgorithm('A*')
    const nextResult = solvePathfinding(nextMap, 'A*')
    setResult(nextResult)
    setStep(Math.max(0, nextResult.steps.length - 1))
  }

  const handleAlgorithmChange = (nextAlgorithm: PathfindingAlgorithm) => {
    setAlgorithm(nextAlgorithm)
    rerun(map, nextAlgorithm)
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
              const isObstacle = map.obstacles.some((cell) => isSamePathPosition(cell, position))
              const isStart = isSamePathPosition(map.start, position)
              const isGoal = isSamePathPosition(map.goal, position)
              const isWeighted = map.weightedTiles.some((tile) => isSamePathPosition(tile, position))
              const isOpen = frame?.openKeys.includes(key) ?? false
              const isClosed = frame?.closedKeys.includes(key) ?? false
              const isPath = frame?.pathKeys.includes(key) ?? false
              const isCurrent = frame?.current !== null && frame?.current !== undefined ? toPathKey(frame.current) === key : false
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
                    {isStart ? 'S' : isGoal ? 'G' : isObstacle ? '■' : isWeighted ? String(getTerrainCost(map, position)) : ''}
                  </span>
                  {!isObstacle && !isStart && !isGoal && heuristic !== undefined ? (
                    <span className="pathfinding-cell__meta">h:{heuristic} g:{cost}</span>
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
              <select value={algorithm} onChange={(event) => handleAlgorithmChange(event.target.value as PathfindingAlgorithm)}>
                {pathfindingAlgorithms.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="pathfinding-select-wrap">
              Step Replay
              <input
                type="range"
                min={0}
                max={Math.max(0, result.steps.length - 1)}
                value={step}
                onChange={(event) => setStep(Number(event.target.value))}
              />
            </label>
            <div className="pathfinding-metrics-inline">
              <span>Status: {result.status}</span>
              <span>Expanded: {result.exploredCount}</span>
              <span>Time: {result.metrics.elapsedMs}ms</span>
            </div>
            <p className="pathfinding-step-message">{result.steps[step]?.message ?? result.failureReason ?? 'No steps available.'}</p>
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
