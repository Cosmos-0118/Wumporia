import type { Puzzle8Board } from '@/features/puzzle8/types/puzzle8'
import { GOAL_BOARD, getLegalMoves } from '@/features/puzzle8/engine/board'

/**
 * A 3×3 8-puzzle configuration is solvable iff the number of inversions is even.
 * An inversion is any pair (i, j) with i < j where board[i] > board[j],
 * counting only non-blank tiles.
 */
export function isSolvable(board: Puzzle8Board): boolean {
  const tiles = board.filter((t) => t !== 0)
  let inversions = 0
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      const a = tiles[i] ?? 0
      const b = tiles[j] ?? 0
      if (a > b) inversions++
    }
  }
  return inversions % 2 === 0
}

/**
 * Generates a scrambled solvable board by taking `steps` random legal moves
 * from the goal state. Solvability is guaranteed by construction.
 */
export function shuffleBoard(steps = 80): Puzzle8Board {
  let board: Puzzle8Board = [...GOAL_BOARD]
  for (let i = 0; i < steps; i++) {
    const moves = getLegalMoves(board)
    const idx = Math.floor(Math.random() * moves.length)
    const move = moves[idx]
    if (move !== undefined) {
      board = move.board
    }
  }
  return board
}
