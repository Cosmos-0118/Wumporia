import { createSolverWorkerBridge } from '@/shared/workers'
import type {
  Puzzle8Algorithm,
  Puzzle8Board,
  Puzzle8SolverMeta,
  Puzzle8Snapshot,
} from '@/features/puzzle8/types/puzzle8'

export interface Puzzle8WorkerInput {
  board: Puzzle8Board
  algorithm: Puzzle8Algorithm
}

export function createPuzzle8WorkerBridge() {
  return createSolverWorkerBridge<Puzzle8WorkerInput, Puzzle8Snapshot, Puzzle8SolverMeta>(
    () => new Worker(new URL('./puzzle8Solver.worker.ts', import.meta.url), { type: 'module' }),
  )
}
