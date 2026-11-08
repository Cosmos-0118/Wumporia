# Wumporia

Interactive playgrounds for classic AI problems: Wumpus World, maze search, 8 puzzle,
tic-tac-toe (minimax), vacuum agents, and weighted pathfinding.

**Stack:** React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI, Motion, Lucide, Geist.

```sh
npm install
npm run dev
```

Checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

## Layout

- `src/features/<game>/` holds each game: `engine/` (pure algorithms, unit tested), `types/`, and the `<Game>.tsx` UI.
- `src/components/ui/` has the shared primitives; `src/components/art/` has the SVG characters.
- `src/lib/games.tsx` is the game registry that drives the home page, routing, and nav.
