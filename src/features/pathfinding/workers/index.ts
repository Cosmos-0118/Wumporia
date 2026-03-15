import { wrap } from 'comlink'

import type {
  PathfindingAlgorithm,
  PathfindingBlueprint,
  PathfindingSolveResult,
} from '@/features/pathfinding/types/pathfinding'

export interface PathfindingBenchmarkRow {
  algorithm: PathfindingAlgorithm
  exploredCount: number
  elapsedMs: number
  pathCost: number
  success: boolean
}

interface PathfindingWorkerApi {
  solve(input: {
    map: PathfindingBlueprint
    algorithm: PathfindingAlgorithm
  }): Promise<PathfindingSolveResult>
  benchmark(map: PathfindingBlueprint): Promise<PathfindingBenchmarkRow[]>
}

export function createPathfindingWorkerApi() {
  const worker = new Worker(new URL('./pathfinding.worker.ts', import.meta.url), { type: 'module' })
  const api = wrap<PathfindingWorkerApi>(worker)

  return {
    api,
    dispose: () => {
      worker.terminate()
    },
  }
}
