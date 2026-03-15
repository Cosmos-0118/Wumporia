export const routeModules = {
  home: () => import('@/pages/HomePage'),
  games: () => import('@/pages/GamesPage'),
  wumpus: () => import('@/pages/WumpusPage'),
  maze: () => import('@/pages/MazePage'),
  puzzle8: () => import('@/pages/Puzzle8Page'),
  tictactoe: () => import('@/pages/TicTacToePage'),
  vacuum: () => import('@/pages/VacuumPage'),
  pathfinding: () => import('@/pages/PathfindingPage'),
  notFound: () => import('@/pages/NotFoundPage'),
} as const

const routeImportersByPath: Record<string, () => Promise<unknown>> = {
  '/': routeModules.home,
  '/games': routeModules.games,
  '/games/wumpus': routeModules.wumpus,
  '/games/maze': routeModules.maze,
  '/games/puzzle8': routeModules.puzzle8,
  '/games/tictactoe': routeModules.tictactoe,
  '/games/vacuum': routeModules.vacuum,
  '/games/pathfinding': routeModules.pathfinding,
}

const prefetched = new Set<string>()

export function prefetchRoute(path: string): void {
  const importer = routeImportersByPath[path]
  if (importer === undefined || prefetched.has(path)) {
    return
  }

  prefetched.add(path)
  void importer()
}
