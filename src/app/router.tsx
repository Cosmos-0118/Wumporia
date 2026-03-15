import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { routeModules } from '@/app/routeModules'

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        lazy: async () => {
          const module = await routeModules.home()
          return { Component: module.HomePage }
        },
      },
      {
        path: 'games',
        lazy: async () => {
          const module = await routeModules.games()
          return { Component: module.GamesPage }
        },
      },
      {
        path: 'games/wumpus',
        lazy: async () => {
          const module = await routeModules.wumpus()
          return { Component: module.WumpusPage }
        },
      },
      {
        path: 'games/maze',
        lazy: async () => {
          const module = await routeModules.maze()
          return { Component: module.MazePage }
        },
      },
      {
        path: 'games/puzzle8',
        lazy: async () => {
          const module = await routeModules.puzzle8()
          return { Component: module.Puzzle8Page }
        },
      },
      {
        path: 'games/tictactoe',
        lazy: async () => {
          const module = await routeModules.tictactoe()
          return { Component: module.TicTacToePage }
        },
      },
      {
        path: 'games/vacuum',
        lazy: async () => {
          const module = await routeModules.vacuum()
          return { Component: module.VacuumPage }
        },
      },
      {
        path: 'games/pathfinding',
        lazy: async () => {
          const module = await routeModules.pathfinding()
          return { Component: module.PathfindingPage }
        },
      },
      {
        path: '*',
        lazy: async () => {
          const module = await routeModules.notFound()
          return { Component: module.NotFoundPage }
        },
      },
    ],
  },
])
