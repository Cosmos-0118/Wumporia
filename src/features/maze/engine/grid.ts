import type { MazeBlueprint, MazePosition, MazeTool } from '@/features/maze/types/maze'
import { isSameMazePosition, toMazeKey } from '@/features/maze/utils/position'

export const defaultMazeBlueprint: MazeBlueprint = {
  rows: 8,
  cols: 10,
  start: { row: 0, col: 0 },
  goal: { row: 7, col: 9 },
  walls: [
    { row: 0, col: 4 },
    { row: 1, col: 1 },
    { row: 1, col: 2 },
    { row: 1, col: 4 },
    { row: 1, col: 6 },
    { row: 2, col: 4 },
    { row: 2, col: 6 },
    { row: 2, col: 7 },
    { row: 3, col: 2 },
    { row: 3, col: 4 },
    { row: 3, col: 7 },
    { row: 4, col: 2 },
    { row: 4, col: 7 },
    { row: 5, col: 0 },
    { row: 5, col: 1 },
    { row: 5, col: 5 },
    { row: 5, col: 7 },
    { row: 6, col: 5 },
    { row: 6, col: 7 },
  ],
}

export function cloneMaze(maze: MazeBlueprint): MazeBlueprint {
  return {
    ...maze,
    start: { ...maze.start },
    goal: { ...maze.goal },
    walls: maze.walls.map((wall) => ({ ...wall })),
  }
}

export function getMazeNeighbors(position: MazePosition, maze: MazeBlueprint): MazePosition[] {
  const candidates = [
    { row: position.row - 1, col: position.col },
    { row: position.row + 1, col: position.col },
    { row: position.row, col: position.col - 1 },
    { row: position.row, col: position.col + 1 },
  ]

  const wallKeys = new Set(maze.walls.map(toMazeKey))
  return candidates.filter(
    (candidate) =>
      candidate.row >= 0 &&
      candidate.row < maze.rows &&
      candidate.col >= 0 &&
      candidate.col < maze.cols &&
      !wallKeys.has(toMazeKey(candidate)),
  )
}

export function updateMazeCell(
  maze: MazeBlueprint,
  position: MazePosition,
  tool: MazeTool,
): MazeBlueprint {
  const nextMaze = cloneMaze(maze)
  const wallKeys = new Set(nextMaze.walls.map(toMazeKey))
  const key = toMazeKey(position)

  if (tool === 'start') {
    if (isSameMazePosition(position, nextMaze.goal)) {
      return nextMaze
    }
    nextMaze.start = position
    nextMaze.walls = nextMaze.walls.filter((wall) => !isSameMazePosition(wall, position))
    return nextMaze
  }

  if (tool === 'goal') {
    if (isSameMazePosition(position, nextMaze.start)) {
      return nextMaze
    }
    nextMaze.goal = position
    nextMaze.walls = nextMaze.walls.filter((wall) => !isSameMazePosition(wall, position))
    return nextMaze
  }

  if (tool === 'erase') {
    nextMaze.walls = nextMaze.walls.filter((wall) => !isSameMazePosition(wall, position))
    return nextMaze
  }

  if (
    !isSameMazePosition(position, nextMaze.start) &&
    !isSameMazePosition(position, nextMaze.goal)
  ) {
    if (wallKeys.has(key)) {
      nextMaze.walls = nextMaze.walls.filter((wall) => !isSameMazePosition(wall, position))
    } else {
      nextMaze.walls = [...nextMaze.walls, position]
    }
  }

  return nextMaze
}

export function randomizeMaze(maze: MazeBlueprint, density = 0.26): MazeBlueprint {
  const nextMaze = cloneMaze(maze)
  const walls: MazePosition[] = []

  for (let row = 0; row < maze.rows; row += 1) {
    for (let col = 0; col < maze.cols; col += 1) {
      const position = { row, col }
      if (isSameMazePosition(position, maze.start) || isSameMazePosition(position, maze.goal)) {
        continue
      }

      if (Math.random() < density) {
        walls.push(position)
      }
    }
  }

  nextMaze.walls = walls
  return nextMaze
}
