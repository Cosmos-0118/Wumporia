import type { SolverResult, StepFrame } from '@/shared/types'

export type PathfindingAlgorithm = 'BFS' | 'Dijkstra' | 'A*'
export type PathfindingTool = 'obstacle' | 'weight' | 'erase' | 'start' | 'goal'

export interface PathNodePosition {
  row: number
  col: number
}

export interface WeightedTerrain {
  row: number
  col: number
  cost: number
}

export interface PathfindingBlueprint {
  rows: number
  cols: number
  start: PathNodePosition
  goal: PathNodePosition
  obstacles: PathNodePosition[]
  weightedTiles: WeightedTerrain[]
}

export interface PathfindingFrameSnapshot {
  current: PathNodePosition | null
  openKeys: string[]
  closedKeys: string[]
  pathKeys: string[]
  heuristicByKey: Record<string, number>
  costByKey: Record<string, number>
}

export interface PathfindingSolverMeta {
  algorithm: PathfindingAlgorithm
  found: boolean
  pathCost: number
}

export type PathfindingStepFrame = StepFrame<PathfindingFrameSnapshot, PathfindingSolverMeta>
export type PathfindingSolveResult = SolverResult<PathfindingFrameSnapshot, PathfindingSolverMeta>
