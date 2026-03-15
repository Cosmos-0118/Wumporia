export { Puzzle8Section } from '@/features/puzzle8/components/Puzzle8Section'
export { getBlankIndex, getLegalMoves, isGoal, GOAL_BOARD } from '@/features/puzzle8/engine/board'
export { solvePuzzle8, puzzle8AlgorithmList } from '@/features/puzzle8/engine/solver'
export { isSolvable, shuffleBoard } from '@/features/puzzle8/engine/solvability'
export type {
  Puzzle8Algorithm,
  Puzzle8Board,
  Puzzle8Snapshot,
  Puzzle8SolverMeta,
  Puzzle8SolveResult,
  Puzzle8StepFrame,
} from '@/features/puzzle8/types/puzzle8'
