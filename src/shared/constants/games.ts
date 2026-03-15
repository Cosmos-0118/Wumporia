export type GameCategory = 'Search Algorithms' | 'Game Playing' | 'Intelligent Agents' | 'Logic'

export interface GameCard {
  id: string
  title: string
  category: GameCategory
  route: string
  tagline: string
  algorithms: string[]
  accent: string
}

export const gameCards: GameCard[] = [
  {
    id: 'wumpus',
    title: 'Wumpus World',
    category: 'Logic',
    route: '/games#wumpus-world',
    tagline: 'Reason under uncertainty using percepts and inferred danger zones.',
    algorithms: ['Rule Inference', 'Knowledge Representation'],
    accent: '#1d4ed8',
  },
  {
    id: 'maze',
    title: 'Maze Search Visualizer',
    category: 'Search Algorithms',
    route: '/games#maze-search',
    tagline: 'Watch frontier expansion and compare informed vs uninformed search.',
    algorithms: ['BFS', 'DFS', 'Uniform Cost', 'A*', 'Greedy'],
    accent: '#0f766e',
  },
  {
    id: 'puzzle8',
    title: '8 Puzzle Solver',
    category: 'Search Algorithms',
    route: '/games#8-puzzle',
    tagline: 'Explore state-space explosion and heuristic-guided solving.',
    algorithms: ['BFS', 'A*', 'Greedy', 'Manhattan'],
    accent: '#b45309',
  },
  {
    id: 'tictactoe',
    title: 'Tic Tac Toe AI',
    category: 'Game Playing',
    route: '/games#tic-tac-toe',
    tagline: 'Understand adversarial search and pruning with move-tree previews.',
    algorithms: ['Minimax', 'Alpha-Beta'],
    accent: '#be123c',
  },
  {
    id: 'vacuum',
    title: 'Vacuum World',
    category: 'Intelligent Agents',
    route: '/games#vacuum-world',
    tagline: 'Model environment transitions and evaluate reflex behavior.',
    algorithms: ['Reflex Agent', 'Model-Based Agent'],
    accent: '#4338ca',
  },
  {
    id: 'pathfinding',
    title: 'Pathfinding Robot',
    category: 'Search Algorithms',
    route: '/games#pathfinding-robot',
    tagline: 'Benchmark path quality and expansion cost on weighted maps.',
    algorithms: ['BFS', 'Dijkstra', 'A*'],
    accent: '#0369a1',
  },
]

export const gameCategories: Array<GameCategory | 'All'> = [
  'All',
  'Search Algorithms',
  'Game Playing',
  'Intelligent Agents',
  'Logic',
]
