import type { SolverResult, StepFrame } from '@/shared/types'

export type MazeAlgorithm = 'BFS' | 'DFS' | 'Uniform Cost' | 'Greedy Best First' | 'A*'
export type MazeTool = 'wall' | 'erase' | 'start' | 'goal'

export interface MazePosition {
  row: number
  col: number
}

export interface MazeBlueprint {
  rows: number
  cols: number
  start: MazePosition
  goal: MazePosition
  walls: MazePosition[]
}

export interface MazeFrameSnapshot {
  current: MazePosition | null
  frontierKeys: string[]
  exploredKeys: string[]
  pathKeys: string[]
}

export interface MazeSolverMeta {
  algorithm: MazeAlgorithm
  found: boolean
  pathCost: number
}

export type MazeStepFrame = StepFrame<MazeFrameSnapshot, MazeSolverMeta>
export type MazeSolveResult = SolverResult<MazeFrameSnapshot, MazeSolverMeta>
