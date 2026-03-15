import { useState } from 'react'

import { defaultMazeBlueprint, randomizeMaze, updateMazeCell } from '@/features/maze/engine/grid'
import { algorithmList, solveMaze } from '@/features/maze/engine/solver'
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
  const [primaryResult, setPrimaryResult] = useState<MazeSolveResult>(() => solveMaze(defaultMazeBlueprint, 'BFS'))
  const [secondaryResult, setSecondaryResult] = useState<MazeSolveResult>(() => solveMaze(defaultMazeBlueprint, 'A*'))
  const [primaryStep, setPrimaryStep] = useState(0)
  const [secondaryStep, setSecondaryStep] = useState(0)

  const runAlgorithms = (nextMaze: MazeBlueprint, primary: MazeAlgorithm, secondary: MazeAlgorithm, nextComparisonMode: boolean) => {
    const nextPrimaryResult = solveMaze(nextMaze, primary)
    setPrimaryResult(nextPrimaryResult)
    setPrimaryStep(Math.max(0, nextPrimaryResult.steps.length - 1))

    if (nextComparisonMode) {
      const nextSecondaryResult = solveMaze(nextMaze, secondary)
      setSecondaryResult(nextSecondaryResult)
      setSecondaryStep(Math.max(0, nextSecondaryResult.steps.length - 1))
    }
  }

  const handleGridClick = (row: number, col: number) => {
    const nextMaze = updateMazeCell(maze, { row, col }, tool)
    setMaze(nextMaze)
    runAlgorithms(nextMaze, primaryAlgorithm, secondaryAlgorithm, comparisonMode)
  }

  const handleRandomize = () => {
    const nextMaze = randomizeMaze(maze)
    setMaze(nextMaze)
    runAlgorithms(nextMaze, primaryAlgorithm, secondaryAlgorithm, comparisonMode)
  }

  const handleReset = () => {
    setMaze(defaultMazeBlueprint)
    setPrimaryAlgorithm(comparisonDefaults[0])
    setSecondaryAlgorithm(comparisonDefaults[1])
    setComparisonMode(true)
    const nextPrimary = solveMaze(defaultMazeBlueprint, comparisonDefaults[0])
    const nextSecondary = solveMaze(defaultMazeBlueprint, comparisonDefaults[1])
    setPrimaryResult(nextPrimary)
    setSecondaryResult(nextSecondary)
    setPrimaryStep(Math.max(0, nextPrimary.steps.length - 1))
    setSecondaryStep(Math.max(0, nextSecondary.steps.length - 1))
  }

  const handlePrimaryAlgorithm = (algorithm: MazeAlgorithm) => {
    setPrimaryAlgorithm(algorithm)
    runAlgorithms(maze, algorithm, secondaryAlgorithm, comparisonMode)
  }

  const handleSecondaryAlgorithm = (algorithm: MazeAlgorithm) => {
    setSecondaryAlgorithm(algorithm)
    runAlgorithms(maze, primaryAlgorithm, algorithm, comparisonMode)
  }

  const handleComparisonToggle = (enabled: boolean) => {
    setComparisonMode(enabled)
    runAlgorithms(maze, primaryAlgorithm, secondaryAlgorithm, enabled)
  }

  const primaryFrame = primaryResult.steps[primaryStep] ?? null
  const secondaryFrame = comparisonMode ? secondaryResult.steps[secondaryStep] ?? null : null

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

        <div
          className="maze-board"
          style={{ gridTemplateColumns: `repeat(${maze.cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: maze.rows * maze.cols }, (_, index) => {
            const row = Math.floor(index / maze.cols)
            const col = index % maze.cols
            const position = { row, col }
            const key = toMazeKey(position)
            const isWall = maze.walls.some((wall) => isSameMazePosition(wall, position))
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
          <select value={primaryAlgorithm} onChange={(event) => handlePrimaryAlgorithm(event.target.value as MazeAlgorithm)}>
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
            onChange={(event) => handleComparisonToggle(event.target.checked)}
          />
          Enable comparison mode
        </label>

        <label className="maze-select-wrap">
          Comparison Algorithm
          <select
            value={secondaryAlgorithm}
            onChange={(event) => handleSecondaryAlgorithm(event.target.value as MazeAlgorithm)}
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
          status={primaryResult.status}
        />

        {comparisonMode ? (
          <MazeVisualizationPane
            title={secondaryAlgorithm}
            result={secondaryResult}
            step={secondaryStep}
            onStepChange={setSecondaryStep}
            maze={maze}
            frame={secondaryFrame?.state.current?.state ?? null}
            status={secondaryResult.status}
          />
        ) : null}
      </div>
    </section>
  )
}

interface MazeVisualizationPaneProps {
  title: string
  result: MazeSolveResult
  step: number
  onStepChange: (value: number) => void
  maze: MazeBlueprint
  frame: MazeFrameSnapshot | null
  status: MazeSolveResult['status']
}

function MazeVisualizationPane({
  title,
  result,
  step,
  onStepChange,
  maze,
  frame,
  status,
}: MazeVisualizationPaneProps) {
  const frontierKeys = new Set(frame?.frontierKeys ?? [])
  const exploredKeys = new Set(frame?.exploredKeys ?? [])
  const pathKeys = new Set(frame?.pathKeys ?? [])
  const currentKey = frame?.current === null || frame?.current === undefined ? null : toMazeKey(frame.current)

  return (
    <section className="maze-panel-card">
      <div className="maze-panel-card__header">
        <div>
          <h3>{title}</h3>
          <p>
            {status === 'completed'
              ? `Solved in ${result.steps.at(step)?.state.meta.pathCost ?? 0} moves.`
              : result.failureReason ?? 'No path found.'}
          </p>
        </div>
        <div className="maze-stats">
          <span>Explored: {result.exploredCount}</span>
          <span>Frontier: {result.frontierCount}</span>
          <span>Time: {result.metrics.elapsedMs}ms</span>
        </div>
      </div>

      <div
        className="maze-visual-board"
        style={{ gridTemplateColumns: `repeat(${maze.cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: maze.rows * maze.cols }, (_, index) => {
          const row = Math.floor(index / maze.cols)
          const col = index % maze.cols
          const position = { row, col }
          const key = toMazeKey(position)
          const isWall = maze.walls.some((wall) => isSameMazePosition(wall, position))
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
        Step {Math.min(step + 1, Math.max(result.steps.length, 1))} / {Math.max(result.steps.length, 1)}
        <input
          type="range"
          min={0}
          max={Math.max(result.steps.length - 1, 0)}
          step={1}
          value={Math.min(step, Math.max(result.steps.length - 1, 0))}
          onChange={(event) => onStepChange(Number(event.target.value))}
          disabled={result.steps.length === 0}
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
