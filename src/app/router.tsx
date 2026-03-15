import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { GamesPage } from '@/pages/GamesPage'
import { HomePage } from '@/pages/HomePage'
import { MazePage } from '@/pages/MazePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PathfindingPage } from '@/pages/PathfindingPage'
import { Puzzle8Page } from '@/pages/Puzzle8Page'
import { TicTacToePage } from '@/pages/TicTacToePage'
import { VacuumPage } from '@/pages/VacuumPage'
import { WumpusPage } from '@/pages/WumpusPage'

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'games',
        element: <GamesPage />,
      },
      {
        path: 'games/wumpus',
        element: <WumpusPage />,
      },
      {
        path: 'games/maze',
        element: <MazePage />,
      },
      {
        path: 'games/puzzle8',
        element: <Puzzle8Page />,
      },
      {
        path: 'games/tictactoe',
        element: <TicTacToePage />,
      },
      {
        path: 'games/vacuum',
        element: <VacuumPage />,
      },
      {
        path: 'games/pathfinding',
        element: <PathfindingPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
