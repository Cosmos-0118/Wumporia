import { createSolverWorkerBridge } from '@/shared/workers'
import type {
  MazeAlgorithm,
  MazeBlueprint,
  MazeFrameSnapshot,
  MazeSolverMeta,
} from '@/features/maze/types/maze'

export interface MazeWorkerInput {
  maze: MazeBlueprint
  algorithm: MazeAlgorithm
}

export function createMazeWorkerBridge() {
  return createSolverWorkerBridge<MazeWorkerInput, MazeFrameSnapshot, MazeSolverMeta>(
    () => new Worker(new URL('./mazeSolver.worker.ts', import.meta.url), { type: 'module' }),
  )
}
