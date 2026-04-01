import { describe, expect, it } from 'vitest'

import {
  EMPTY_BOARD,
  applyMove,
  checkWin,
  getLegalMoves,
  isDraw,
  isTerminal,
  opponent,
} from '@/features/tictactoe/engine/board'
import { computeAIMove } from '@/features/tictactoe/engine/minimax'
import { applyAutoMove, applyHumanMove, createGame } from '@/features/tictactoe/engine/game'
import type { TTTBoard } from '@/features/tictactoe/types/tictactoe'

// ---------------------------------------------------------------------------
// Board engine
// ---------------------------------------------------------------------------

describe('TicTacToe Board', () => {
  it('detects no winner on empty board', () => {
    expect(checkWin(EMPTY_BOARD)).toBeNull()
  })

  it('detects a row win for X', () => {
    const board: TTTBoard = ['X', 'X', 'X', null, null, null, null, null, null]
    const result = checkWin(board)
    expect(result).not.toBeNull()
    expect(result?.winner).toBe('X')
    expect(result?.line).toEqual([0, 1, 2])
  })

  it('detects a diagonal win for O', () => {
    const board: TTTBoard = ['O', null, null, null, 'O', null, null, null, 'O']
    const result = checkWin(board)
    expect(result?.winner).toBe('O')
    expect(result?.line).toEqual([0, 4, 8])
  })

  it('isDraw returns true when board full with no winner', () => {
    // X O X / O X O / O X O  — no three in a row
    const board: TTTBoard = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O']
    expect(isDraw(board)).toBe(true)
    expect(checkWin(board)).toBeNull()
  })

  it('getLegalMoves returns all 9 on empty board', () => {
    expect(getLegalMoves(EMPTY_BOARD)).toHaveLength(9)
  })

  it('getLegalMoves excludes occupied cells', () => {
    const board = applyMove(EMPTY_BOARD, 4, 'X')
    const moves = getLegalMoves(board)
    expect(moves).toHaveLength(8)
    expect(moves).not.toContain(4)
  })

  it('isTerminal is true when winner exists', () => {
    const board: TTTBoard = ['X', 'X', 'X', null, null, null, null, null, null]
    expect(isTerminal(board)).toBe(true)
  })

  it('opponent returns the other player', () => {
    expect(opponent('X')).toBe('O')
    expect(opponent('O')).toBe('X')
  })
})

// ---------------------------------------------------------------------------
// Minimax AI
// ---------------------------------------------------------------------------

describe('Minimax AI (hard difficulty)', () => {
  it('blocks an immediate human win', () => {
    // Human (X) is about to win at index 2 if AI does not block
    // X X _ / O O _ / _ _ _
    const board: TTTBoard = ['X', 'X', null, 'O', 'O', null, null, null, null]
    const analysis = computeAIMove(board, 'O', 'hard')
    expect(analysis).not.toBeNull()
    // AI must play index 5 to win, or index 2 to block — prefer winning (index 5)
    expect([2, 5]).toContain(analysis?.chosen)
  })

  it('takes a winning move when available', () => {
    // O O _ / X X _ / _ _ _  — AI (O) can win at index 2
    const board: TTTBoard = ['O', 'O', null, 'X', 'X', null, null, null, null]
    const analysis = computeAIMove(board, 'O', 'hard')
    expect(analysis?.chosen).toBe(2)
  })

  it('returns a move analysis with candidates for every legal move', () => {
    const board: TTTBoard = ['X', null, null, null, null, null, null, null, null]
    const analysis = computeAIMove(board, 'O', 'hard')
    expect(analysis).not.toBeNull()
    expect(analysis?.candidates.length).toBe(getLegalMoves(board).length)
  })

  it('returns null on a full board', () => {
    const full: TTTBoard = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O']
    const analysis = computeAIMove(full, 'O', 'hard')
    expect(analysis).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Game engine
// ---------------------------------------------------------------------------

describe('TicTacToe Game Engine', () => {
  it('creates a game in playing state', () => {
    const game = createGame('X', 'hard')
    expect(game.status).toBe('playing')
    expect(game.board).toEqual(EMPTY_BOARD)
    expect(game.currentPlayer).toBe('X')
  })

  it('human move changes the board and triggers AI response', () => {
    const game = createGame('X', 'hard')
    const next = applyHumanMove(game, 4) // center
    // Board should now have at least 2 moves (human + AI)
    const filledCells = next.board.filter((c) => c !== null).length
    expect(filledCells).toBeGreaterThanOrEqual(2)
  })

  it('ignores a move on an occupied cell', () => {
    const game = createGame('X', 'hard')
    const after1 = applyHumanMove(game, 0)
    // Try clicking index 0 again (now occupied by X or AI)
    const after2 = applyHumanMove(after1, 0)
    expect(after1.board).toEqual(after2.board)
  })

  it('ignores moves when game is over', () => {
    // Build a won state manually
    const game = createGame('X', 'easy')
    const won = { ...game, status: 'won' as const }
    const after = applyHumanMove(won, 5)
    expect(after.status).toBe('won')
  })

  it('records move history', () => {
    const game = createGame('X', 'hard')
    const next = applyHumanMove(game, 4)
    // Human's move (4) must be first in history
    expect(next.moveHistory[0]).toBe(4)
  })

  it('can apply auto moves for both players', () => {
    const game = createGame('X', 'hard')
    const afterX = applyAutoMove(game)
    const afterO = applyAutoMove(afterX)

    const filledAfterX = afterX.board.filter((cell) => cell !== null).length
    const filledAfterO = afterO.board.filter((cell) => cell !== null).length

    expect(filledAfterX).toBe(1)
    expect(filledAfterO).toBe(2)
    expect(afterO.currentPlayer).toBe('X')
  })
})
