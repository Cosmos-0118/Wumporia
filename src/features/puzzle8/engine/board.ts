import type { Puzzle8Board } from '@/features/puzzle8/types/puzzle8'

/** Goal state: tiles 1–8 followed by the blank (0) */
export const GOAL_BOARD: Puzzle8Board = [1, 2, 3, 4, 5, 6, 7, 8, 0]

export const GOAL_KEY: string = GOAL_BOARD.join(',')

export function boardKey(board: Puzzle8Board): string {
  return board.join(',')
}

export function getBlankIndex(board: Puzzle8Board): number {
  const idx = board.indexOf(0)
  return idx === -1 ? 8 : idx
}

function applySwap(board: Puzzle8Board, indexA: number, indexB: number): Puzzle8Board {
  const next = [...board]
  const a = next[indexA]
  const b = next[indexB]
  if (a === undefined || b === undefined) return board
  next[indexA] = b
  next[indexB] = a
  return next
}

export interface LegalMove {
  /** Board state after this move */
  board: Puzzle8Board
  /** The tile value that was slid into the blank's position */
  movedTile: number
  /** Index where the blank ends up (i.e. the tile's original position) */
  blankTo: number
}

/** Returns all legal next boards by sliding a tile into the blank */
export function getLegalMoves(board: Puzzle8Board): LegalMove[] {
  const blankIdx = getBlankIndex(board)
  const row = Math.floor(blankIdx / 3)
  const col = blankIdx % 3
  const moves: LegalMove[] = []

  // Slide tile down into blank (blank moves up)
  if (row > 0) {
    const swapIdx = blankIdx - 3
    const tile = board[swapIdx]
    if (tile !== undefined) {
      moves.push({ board: applySwap(board, blankIdx, swapIdx), movedTile: tile, blankTo: swapIdx })
    }
  }

  // Slide tile up into blank (blank moves down)
  if (row < 2) {
    const swapIdx = blankIdx + 3
    const tile = board[swapIdx]
    if (tile !== undefined) {
      moves.push({ board: applySwap(board, blankIdx, swapIdx), movedTile: tile, blankTo: swapIdx })
    }
  }

  // Slide tile right into blank (blank moves left)
  if (col > 0) {
    const swapIdx = blankIdx - 1
    const tile = board[swapIdx]
    if (tile !== undefined) {
      moves.push({ board: applySwap(board, blankIdx, swapIdx), movedTile: tile, blankTo: swapIdx })
    }
  }

  // Slide tile left into blank (blank moves right)
  if (col < 2) {
    const swapIdx = blankIdx + 1
    const tile = board[swapIdx]
    if (tile !== undefined) {
      moves.push({ board: applySwap(board, blankIdx, swapIdx), movedTile: tile, blankTo: swapIdx })
    }
  }

  return moves
}

export function isGoal(board: Puzzle8Board): boolean {
  return boardKey(board) === GOAL_KEY
}
