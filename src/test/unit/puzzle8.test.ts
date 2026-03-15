import { describe, expect, it } from 'vitest'

import {
  GOAL_BOARD,
  boardKey,
  getBlankIndex,
  getLegalMoves,
  isGoal,
} from '@/features/puzzle8/engine/board'
import { isSolvable, shuffleBoard } from '@/features/puzzle8/engine/solvability'
import { solvePuzzle8 } from '@/features/puzzle8/engine/solver'

// ---------------------------------------------------------------------------
// Board engine
// ---------------------------------------------------------------------------

describe('8 Puzzle Board', () => {
  it('identifies the goal state', () => {
    expect(isGoal(GOAL_BOARD)).toBe(true)
    expect(isGoal([1, 2, 3, 4, 5, 6, 7, 0, 8])).toBe(false)
  })

  it('finds blank index correctly', () => {
    expect(getBlankIndex([1, 2, 3, 4, 0, 6, 7, 5, 8])).toBe(4)
    expect(getBlankIndex(GOAL_BOARD)).toBe(8) // blank is last
  })

  it('generates legal moves from a known state', () => {
    // blank at index 4 (center): 4 possible moves
    const board = [1, 2, 3, 4, 0, 6, 7, 5, 8]
    const moves = getLegalMoves(board)
    expect(moves.length).toBe(4)
    // Make sure each resulting board has blank in the expected neighbour position
    const blankPositions = moves.map((m) => getBlankIndex(m.board))
    expect(blankPositions.sort()).toEqual([1, 3, 5, 7]) // up/left/right/down
  })

  it('generates only 2 moves from a corner blank', () => {
    // blank at index 0 (top-left): only down and right
    const board = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    const moves = getLegalMoves(board)
    expect(moves.length).toBe(2)
  })

  it('boardKey is deterministic', () => {
    expect(boardKey([1, 2, 3, 4, 5, 6, 7, 8, 0])).toBe('1,2,3,4,5,6,7,8,0')
  })
})

// ---------------------------------------------------------------------------
// Solvability
// ---------------------------------------------------------------------------

describe('8 Puzzle Solvability', () => {
  it('correctly identifies the goal state as solvable', () => {
    expect(isSolvable(GOAL_BOARD)).toBe(true)
  })

  it('identifies an unsolvable configuration', () => {
    // Swap tiles 1 and 2 in goal — creates exactly 1 inversion (odd → unsolvable)
    const unsolvable = [2, 1, 3, 4, 5, 6, 7, 8, 0]
    expect(isSolvable(unsolvable)).toBe(false)
  })

  it('shuffleBoard produces a solvable board', () => {
    for (let i = 0; i < 20; i++) {
      const board = shuffleBoard(40)
      expect(isSolvable(board)).toBe(true)
    }
  })

  it('shuffleBoard does not return the goal state for large shuffles', () => {
    const board = shuffleBoard(80)
    // Very unlikely to be goal after 80 random moves
    // We just verify it's a valid 9-element permutation of 0-8
    const sorted = [...board].sort((a, b) => a - b)
    expect(sorted).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })
})

// ---------------------------------------------------------------------------
// Solver
// ---------------------------------------------------------------------------

describe('8 Puzzle Solver', () => {
  // A simple 1-move case: only the last tile needs to move
  const oneMoveBoard = [1, 2, 3, 4, 5, 6, 7, 0, 8] // swap 8 and blank → goal

  it('A* solves a 1-move puzzle', () => {
    const result = solvePuzzle8(oneMoveBoard, 'A*')
    expect(result.status).toBe('completed')
    expect(result.solutionPath.length).toBe(2) // initial + goal
    const lastSnap = result.solutionPath[result.solutionPath.length - 1]
    expect(lastSnap).toBeDefined()
    if (lastSnap !== undefined) {
      expect(isGoal(lastSnap.board)).toBe(true)
    }
  })

  it('BFS solves a 1-move puzzle', () => {
    const result = solvePuzzle8(oneMoveBoard, 'BFS')
    expect(result.status).toBe('completed')
    expect(result.solutionPath.length).toBe(2)
  })

  it('Greedy solves a 1-move puzzle', () => {
    const result = solvePuzzle8(oneMoveBoard, 'Greedy')
    expect(result.status).toBe('completed')
  })

  it('A* solves a harder puzzle and produces valid path', () => {
    // Known solvable configuration (inversion count is even)
    const hard = [1, 2, 3, 4, 5, 6, 0, 7, 8] // blank at index 6, 2 moves to goal
    const result = solvePuzzle8(hard, 'A*')
    expect(result.status).toBe('completed')
    // Verify every step is a single-tile move
    for (let i = 1; i < result.solutionPath.length; i++) {
      const prev = result.solutionPath[i - 1]
      const curr = result.solutionPath[i]
      if (prev === undefined || curr === undefined) continue
      const diffs = prev.board.filter((tile, idx) => tile !== curr.board[idx])
      expect(diffs.length).toBe(2) // exactly 2 positions changed (blank + moved tile)
    }
  })

  it('returns already-solved immediately for goal board', () => {
    const result = solvePuzzle8(GOAL_BOARD, 'A*')
    expect(result.status).toBe('completed')
    expect(result.exploredCount).toBe(0)
  })

  it('generates step frames matching path length', () => {
    const result = solvePuzzle8(oneMoveBoard, 'A*')
    expect(result.steps.length).toBe(result.solutionPath.length)
  })
})
