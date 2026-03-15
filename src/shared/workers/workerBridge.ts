import { releaseProxy, wrap } from 'comlink'
import type { Remote } from 'comlink'

import type { SearchState, SolverResult, StepFrame } from '@/shared/types/solver'

export interface SolverWorkerApi<TInput, TState, TMeta = Record<string, unknown>> {
  initialize(input: TInput): Promise<void>
  start(): Promise<SolverResult<TState, TMeta>>
  next(): Promise<StepFrame<TState, TMeta> | null>
  pause(): Promise<void>
  resume(): Promise<void>
  reset(): Promise<void>
  setSpeed(speed: number): Promise<void>
  getState(): Promise<SearchState<TState, TMeta>>
  [releaseProxy]?: () => void
}

export interface WorkerBridge<TInput, TState, TMeta = Record<string, unknown>> {
  api: Remote<SolverWorkerApi<TInput, TState, TMeta>>
  dispose: () => void
}

export function createSolverWorkerBridge<TInput, TState, TMeta = Record<string, unknown>>(
  workerFactory: () => Worker,
): WorkerBridge<TInput, TState, TMeta> {
  const worker = workerFactory()
  const api = wrap<SolverWorkerApi<TInput, TState, TMeta>>(worker)

  return {
    api,
    dispose: () => {
      api[releaseProxy]?.()
      worker.terminate()
    },
  }
}
