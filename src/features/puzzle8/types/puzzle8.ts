import type { SolverResult, StepFrame } from '@/shared/types'

export type Puzzle8Algorithm = 'BFS' | 'Greedy' | 'A*'

/** 9-element row-major array; value 0 = blank tile */
export type Puzzle8Board = readonly number[]

export interface Puzzle8Snapshot {
  board: Puzzle8Board
  blankIndex: number
  movedTile: number | null
}

export interface Puzzle8SolverMeta {
  algorithm: Puzzle8Algorithm
  nodesExpanded: number
  pathLength: number
}

export type Puzzle8StepFrame = StepFrame<Puzzle8Snapshot, Puzzle8SolverMeta>
export type Puzzle8SolveResult = SolverResult<Puzzle8Snapshot, Puzzle8SolverMeta>
