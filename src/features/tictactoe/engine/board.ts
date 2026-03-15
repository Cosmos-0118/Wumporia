import type { TTTBoard, TTTCell, TTTPlayer, TTTWinInfo } from '@/features/tictactoe/types/tictactoe'

/** All possible winning lines (rows, cols, diagonals) */
export const WIN_LINES: Array<[number, number, number]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

export const EMPTY_BOARD: TTTBoard = [null, null, null, null, null, null, null, null, null]

export function checkWin(board: TTTBoard): TTTWinInfo | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line
    const va = board[a]
    const vb = board[b]
    const vc = board[c]
    if (va !== null && va === vb && va === vc) {
      return { winner: va, line }
    }
  }
  return null
}

export function isDraw(board: TTTBoard): boolean {
  return board.every((cell) => cell !== null) && checkWin(board) === null
}

export function isTerminal(board: TTTBoard): boolean {
  return checkWin(board) !== null || isDraw(board)
}

export function getLegalMoves(board: TTTBoard): number[] {
  return board.reduce<number[]>((acc, cell, idx) => {
    if (cell === null) acc.push(idx)
    return acc
  }, [])
}

export function applyMove(board: TTTBoard, index: number, player: TTTPlayer): TTTBoard {
  const next = [...board] as TTTCell[]
  next[index] = player
  return next
}

export function opponent(player: TTTPlayer): TTTPlayer {
  return player === 'X' ? 'O' : 'X'
}
