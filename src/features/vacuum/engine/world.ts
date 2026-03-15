import type { VacuumBlueprint, VacuumPosition, VacuumWorld } from '@/features/vacuum/types/vacuum'
import { toVacuumKey } from '@/features/vacuum/utils/position'

export const defaultVacuumBlueprint: VacuumBlueprint = {
  rows: 5,
  cols: 7,
  start: { row: 2, col: 3 },
  dirtProbability: 0.35,
}

export function cloneVacuumWorld(world: VacuumWorld): VacuumWorld {
  return {
    ...world,
    start: { ...world.start },
    dirtKeys: [...world.dirtKeys],
  }
}

function isInBounds(position: VacuumPosition, rows: number, cols: number): boolean {
  return position.row >= 0 && position.row < rows && position.col >= 0 && position.col < cols
}

export function generateDirtKeys(
  blueprint: VacuumBlueprint,
  rng: () => number = Math.random,
): string[] {
  const dirtKeys: string[] = []
  const startKey = toVacuumKey(blueprint.start)

  for (let row = 0; row < blueprint.rows; row++) {
    for (let col = 0; col < blueprint.cols; col++) {
      const key = `${String(row)},${String(col)}`
      if (key === startKey) {
        continue
      }
      if (rng() < blueprint.dirtProbability) {
        dirtKeys.push(key)
      }
    }
  }

  // Keep at least one dirty tile for meaningful runs.
  if (dirtKeys.length === 0) {
    const fallback: VacuumPosition = {
      row: Math.max(0, Math.min(blueprint.rows - 1, blueprint.start.row)),
      col: Math.max(0, Math.min(blueprint.cols - 1, blueprint.start.col + 1)),
    }
    dirtKeys.push(toVacuumKey(fallback))
  }

  return dirtKeys
}

export function createVacuumWorld(
  blueprint: VacuumBlueprint = defaultVacuumBlueprint,
  rng: () => number = Math.random,
): VacuumWorld {
  const safeStart: VacuumPosition = isInBounds(blueprint.start, blueprint.rows, blueprint.cols)
    ? blueprint.start
    : { row: 0, col: 0 }

  return {
    rows: blueprint.rows,
    cols: blueprint.cols,
    start: { ...safeStart },
    dirtKeys: generateDirtKeys({ ...blueprint, start: safeStart }, rng),
  }
}

export function dirtCount(world: VacuumWorld): number {
  return world.dirtKeys.length
}
