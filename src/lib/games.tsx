import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

import {
  MazeThumb,
  PathfindingThumb,
  PuzzleThumb,
  TicTacToeThumb,
  VacuumThumb,
  WumpusThumb,
} from '@/components/art/thumbs'

export type GameCategory = 'Logic' | 'Search' | 'Adversarial' | 'Agents'

export interface GameMeta {
  id: string
  title: string
  category: GameCategory
  summary: string
  tags: string[]
  accent: string
  Thumb: ComponentType
  Component: LazyExoticComponent<ComponentType>
}

export const games: GameMeta[] = [
  {
    id: 'wumpus',
    title: 'Wumpus World',
    category: 'Logic',
    summary: 'Find the gold without falling in a pit. Reason from breeze and stench.',
    tags: ['Inference', 'Knowledge base'],
    accent: '#8b5cf6',
    Thumb: WumpusThumb,
    Component: lazy(() => import('@/features/wumpus/WumpusGame')),
  },
  {
    id: 'maze',
    title: 'Maze Solver',
    category: 'Search',
    summary: 'Draw a maze and watch search algorithms explore it.',
    tags: ['BFS', 'DFS', 'A*'],
    accent: '#14b8a6',
    Thumb: MazeThumb,
    Component: lazy(() => import('@/features/maze/MazeGame')),
  },
  {
    id: 'puzzle8',
    title: '8 Puzzle',
    category: 'Search',
    summary: 'Slide the tiles into order, or let a heuristic do it.',
    tags: ['A*', 'Greedy', 'BFS'],
    accent: '#f59e0b',
    Thumb: PuzzleThumb,
    Component: lazy(() => import('@/features/puzzle8/Puzzle8Game')),
  },
  {
    id: 'tictactoe',
    title: 'Tic Tac Toe',
    category: 'Adversarial',
    summary: 'Play against minimax, or watch two AIs play each other.',
    tags: ['Minimax', 'Alpha-beta'],
    accent: '#f43f5e',
    Thumb: TicTacToeThumb,
    Component: lazy(() => import('@/features/tictactoe/TicTacToeGame')),
  },
  {
    id: 'vacuum',
    title: 'Vacuum World',
    category: 'Agents',
    summary: 'Compare a reflex agent and a model-based agent on the same room.',
    tags: ['Reflex', 'Model-based'],
    accent: '#38bdf8',
    Thumb: VacuumThumb,
    Component: lazy(() => import('@/features/vacuum/VacuumGame')),
  },
  {
    id: 'pathfinding',
    title: 'Pathfinding',
    category: 'Search',
    summary: 'Route a robot across weighted terrain and benchmark the planners.',
    tags: ['Dijkstra', 'A*'],
    accent: '#22c55e',
    Thumb: PathfindingThumb,
    Component: lazy(() => import('@/features/pathfinding/PathfindingGame')),
  },
]

export function getGame(id: string | undefined): GameMeta | undefined {
  return games.find((game) => game.id === id)
}
