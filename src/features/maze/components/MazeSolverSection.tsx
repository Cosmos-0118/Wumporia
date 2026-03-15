import { useEffect, useMemo, useRef, useState } from 'react'

import { createMazeWorkerBridge } from '@/features/maze/workers'
import { defaultMazeBlueprint, randomizeMaze, updateMazeCell } from '@/features/maze/engine/grid'
import { algorithmList } from '@/features/maze/engine/solver'
import type {
  MazeAlgorithm,
  MazeBlueprint,
  MazeFrameSnapshot,
  MazeSolveResult,
  MazeTool,
} from '@/features/maze/types/maze'
import { isSameMazePosition, toMazeKey } from '@/features/maze/utils/position'

const editorTools: MazeTool[] = ['wall', 'erase', 'start', 'goal']
const comparisonDefaults: [MazeAlgorithm, MazeAlgorithm] = ['BFS', 'A*']

export function MazeSolverSection() {
  const [maze, setMaze] = useState<MazeBlueprint>(defaultMazeBlueprint)
  const [tool, setTool] = useState<MazeTool>('wall')
  const [primaryAlgorithm, setPrimaryAlgorithm] = useState<MazeAlgorithm>('BFS')
  const [secondaryAlgorithm, setSecondaryAlgorithm] = useState<MazeAlgorithm>('A*')
  const [comparisonMode, setComparisonMode] = useState(true)
  const [primaryResult, setPrimaryResult] = useState<MazeSolveResult | null>(null)
  const [secondaryResult, setSecondaryResult] = useState<MazeSolveResult | null>(null)
  const [primaryStep, setPrimaryStep] = useState(0)
  const [secondaryStep, setSecondaryStep] = useState(0)
  const [isSolving, setIsSolving] = useState(true)

  const primaryWorkerRef = useRef<ReturnType<typeof createMazeWorkerBridge> | null>(null)
  const secondaryWorkerRef = useRef<ReturnType<typeof createMazeWorkerBridge> | null>(null)
  const requestIdRef = useRef(0)
  const wallKeys = useMemo(() => new Set(maze.walls.map(toMazeKey)), [maze.walls])

  useEffect(() => {
    primaryWorkerRef.current = createMazeWorkerBridge()
    secondaryWorkerRef.current = createMazeWorkerBridge()

    return () => {
      primaryWorkerRef.current?.dispose()
      secondaryWorkerRef.current?.dispose()
      primaryWorkerRef.current = null
      secondaryWorkerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (primaryWorkerRef.current === null) {
      return
    }

    let cancelled = false
    const requestId = ++requestIdRef.current

    async function run(): Promise<void> {
      setIsSolving(true)

      await primaryWorkerRef.current?.api.initialize({ maze, algorithm: primaryAlgorithm })
      const nextPrimaryResult = await primaryWorkerRef.current!.api.start()
      if (cancelled || requestId !== requestIdRef.current) {
        return
      }

      setPrimaryResult(nextPrimaryResult)
      setPrimaryStep(Math.max(0, nextPrimaryResult.steps.length - 1))

      if (!comparisonMode || secondaryWorkerRef.current === null) {
        setSecondaryResult(null)
        setSecondaryStep(0)
        setIsSolving(false)
        return
      }

      await secondaryWorkerRef.current.api.initialize({ maze, algorithm: secondaryAlgorithm })
      const nextSecondaryResult = await secondaryWorkerRef.current.api.start()
      if (cancelled || requestId !== requestIdRef.current) {
        return
      }

      setSecondaryResult(nextSecondaryResult)
      setSecondaryStep(Math.max(0, nextSecondaryResult.steps.length - 1))
      setIsSolving(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [maze, primaryAlgorithm, secondaryAlgorithm, comparisonMode])

  const handleGridClick = (row: number, col: number) => {
    setMaze((currentMaze) => updateMazeCell(currentMaze, { row, col }, tool))
  }

  const handleRandomize = () => {
    setMaze((currentMaze) => randomizeMaze(currentMaze))
  }

  const handleReset = () => {
    setMaze(defaultMazeBlueprint)
    setPrimaryAlgorithm(comparisonDefaults[0])
    setSecondaryAlgorithm(comparisonDefaults[1])
    setComparisonMode(true)
    setPrimaryStep(0)
    setSecondaryStep(0)
  }

  const primaryFrame = primaryResult?.steps[primaryStep] ?? null
  const secondaryFrame = comparisonMode ? secondaryResult?.steps[secondaryStep] ?? null : null

  return (
    <section className="maze-lab" id="maze-search" aria-label="Maze search lab">
      <div className="maze-lab__header">
        <div>
          <p className="eyebrow">Search Algorithms</p>
          <h2>Maze Solver</h2>
          <p>
            Edit walls, reposition start and goal, run classical search algorithms, and compare how
            frontier and explored sets evolve on the same maze.
          </p>
        </div>
        <div className="maze-summary-chips">
          <span>{maze.rows}x{maze.cols} grid</span>
          <span>{maze.walls.length} walls</span>
          <span>{comparisonMode ? 'Comparison on' : 'Comparison off'}</span>
          {isSolving ? <span>Solving in worker...</span> : null}
        </div>
      </div>

      <div className="maze-editor-card">
        <div className="maze-toolbar">
          <div className="maze-toolbar__group">
            {editorTools.map((editorTool) => (
              <button
                key={editorTool}
                type="button"
                className={tool === editorTool ? 'maze-tool maze-tool--active' : 'maze-tool'}
                onClick={() => setTool(editorTool)}
              >
                {editorTool}
              </button>
            ))}
          </div>
          <div className="maze-toolbar__group">
            <button type="button" onClick={handleRandomize}>Random Maze</button>
            <button type="button" onClick={handleReset}>Reset Maze</button>
          </div>
        </div>

        <div className="maze-board" style={{ gridTemplateColumns: `repeat(${maze.cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: maze.rows * maze.cols }, (_, index) => {
            const row = Math.floor(index / maze.cols)
            const col = index % maze.cols
            const position = { row, col }
            const key = toMazeKey(position)
            const isWall = wallKeys.has(key)
            const isStart = isSameMazePosition(maze.start, position)
            const isGoal = isSameMazePosition(maze.goal, position)

            return (
              <button
                key={key}
                type="button"
                className={[
                  'maze-cell',
                  isWall ? 'maze-cell--wall' : '',
                  isStart ? 'maze-cell--start' : '',
                  isGoal ? 'maze-cell--goal' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleGridClick(row, col)}
                aria-label={`Maze cell ${row}, ${col}`}
              >
                <span>{isStart ? 'S' : isGoal ? 'G' : isWall ? '■' : ''}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="maze-config-row">
        <label className="maze-select-wrap">
          Primary Algorithm
          <select value={primaryAlgorithm} onChange={(event) => setPrimaryAlgorithm(event.target.value as MazeAlgorithm)}>
            {algorithmList.map((algorithm) => (
              <option key={algorithm} value={algorithm}>
                {algorithm}
              </option>
            ))}
          </select>
        </label>

        <label className="maze-checkbox">
          <input
            type="checkbox"
            checked={comparisonMode}
            onChange={(event) => setComparisonMode(event.target.checked)}
          />
          Enable comparison mode
        </label>

        <label className="maze-select-wrap">
          Comparison Algorithm
          <select
            value={secondaryAlgorithm}
            onChange={(event) => setSecondaryAlgorithm(event.target.value as MazeAlgorithm)}
            disabled={!comparisonMode}
          >
            {algorithmList.map((algorithm) => (
              <option key={algorithm} value={algorithm}>
                {algorithm}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={comparisonMode ? 'maze-panels maze-panels--compare' : 'maze-panels'}>
        <MazeVisualizationPane
          title={primaryAlgorithm}
          result={primaryResult}
          step={primaryStep}
          onStepChange={setPrimaryStep}
          maze={maze}
          frame={primaryFrame?.state.current?.state ?? null}
          loading={isSolving && primaryResult === null}
        />

        {comparisonMode ? (
          <MazeVisualizationPane
            title={secondaryAlgorithm}
            result={secondaryResult}
            step={secondaryStep}
            onStepChange={setSecondaryStep}
            maze={maze}
            frame={secondaryFrame?.state.current?.state ?? null}
            loading={isSolving && secondaryResult === null}
          />
        ) : null}
      </div>
    </section>
  )
}

interface MazeVisualizationPaneProps {
  title: string
  result: MazeSolveResult | null
  step: number
  onStepChange: (value: number) => void
  maze: MazeBlueprint
  frame: MazeFrameSnapshot | null
  loading: boolean
}

function MazeVisualizationPane({
  title,
  result,
  step,
  onStepChange,
  maze,
  frame,
  loading,
}: MazeVisualizationPaneProps) {
  const frontierKeys = useMemo(() => new Set(frame?.frontierKeys ?? []), [frame])
  const exploredKeys = useMemo(() => new Set(frame?.exploredKeys ?? []), [frame])
  const pathKeys = useMemo(() => new Set(frame?.pathKeys ?? []), [frame])
  const currentKey = frame?.current === null || frame?.current === undefined ? null : toMazeKey(frame.current)
  const wallKeys = useMemo(() => new Set(maze.walls.map(toMazeKey)), [maze.walls])

  return (
    <section className="maze-panel-card">
      <div className="maze-panel-card__header">
        <div>
          <h3>{title}</h3>
          <p>
            {loading
              ? 'Solving in worker...'
              : result?.status === 'completed'
                ? `Solved in ${result.steps.at(step)?.state.meta.pathCost ?? 0} moves.`
                : result?.failureReason ?? 'No path found.'}
          </p>
        </div>
        <div className="maze-stats">
          <span>Explored: {result?.exploredCount ?? 0}</span>
          <span>Frontier: {result?.frontierCount ?? 0}</span>
          <span>Time: {result?.metrics.elapsedMs ?? 0}ms</span>
        </div>
      </div>

      <div className="maze-visual-board" style={{ gridTemplateColumns: `repeat(${maze.cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: maze.rows * maze.cols }, (_, index) => {
          const row = Math.floor(index / maze.cols)
          const col = index % maze.cols
          const position = { row, col }
          const key = toMazeKey(position)
          const isWall = wallKeys.has(key)
          const isStart = isSameMazePosition(maze.start, position)
          const isGoal = isSameMazePosition(maze.goal, position)

          return (
            <div
              key={key}
              className={[
                'maze-visual-cell',
                isWall ? 'maze-visual-cell--wall' : '',
                frontierKeys.has(key) ? 'maze-visual-cell--frontier' : '',
                exploredKeys.has(key) ? 'maze-visual-cell--explored' : '',
                pathKeys.has(key) ? 'maze-visual-cell--path' : '',
                currentKey === key ? 'maze-visual-cell--current' : '',
                isStart ? 'maze-visual-cell--start' : '',
                isGoal ? 'maze-visual-cell--goal' : '',
              ].filter(Boolean).join(' ')}
            >
              <span>{isStart ? 'S' : isGoal ? 'G' : currentKey === key ? '•' : ''}</span>
            </div>
          )
        })}
      </div>

      <label className="maze-stepper">
        Step {Math.min(step + 1, Math.max(result?.steps.length ?? 1, 1))} / {Math.max(result?.steps.length ?? 1, 1)}
        <input
          type="range"
          min={0}
          max={Math.max((result?.steps.length ?? 1) - 1, 0)}
          step={1}
          value={Math.min(step, Math.max((result?.steps.length ?? 1) - 1, 0))}
          onChange={(event) => onStepChange(Number(event.target.value))}
          disabled={(result?.steps.length ?? 0) === 0}
        />
      </label>

      <div className="maze-legend">
        <span className="maze-legend__item maze-legend__item--frontier">Frontier</span>
        <span className="maze-legend__item maze-legend__item--explored">Explored</span>
        <span className="maze-legend__item maze-legend__item--path">Final Path</span>
      </div>
    </section>
  )
}
