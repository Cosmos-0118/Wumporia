# AI Playground Web App Roadmap (Client-Side, Modern, Maintainable)

## 1. Product Goal

Build one polished website that hosts all AI mini-games from your idea list, with:

- Premium UI and animation quality
- Full client-side algorithm execution
- Strong maintainability for future expansion
- Clear educational value (play + visualize + explain)

Core games in v1:

1. Wumpus World
2. Maze Search Visualizer
3. 8 Puzzle Solver
4. Tic Tac Toe (Minimax + Alpha-Beta)
5. Vacuum World
6. Pathfinding Robot (A\*/BFS/Dijkstra)

---

## 2. Recommended Tech Stack (Best-In-Class)

### Frontend Core

- Runtime: React 19 + TypeScript
- Build tool: Vite 7
- Routing: React Router 7
- Styling: Tailwind CSS 4 + CSS Variables
- UI Primitives: Radix UI
- Component system: shadcn/ui-style architecture (local components)

### State and Data

- App state: Zustand + Immer
- Runtime validation: Zod

### Animations and Motion

- Primary motion system: Framer Motion
- Advanced timeline/hero motion: GSAP
- Illustration animation support: Lottie (lottie-react)

### Visual/Game Rendering

- 2D board rendering: react-konva + konva
- Utility math: d3-scale

### Loading and Transitions

- Route/page loading bar: nprogress
- Loading overlays/spinners: react-spinners
- Skeleton states: react-loading-skeleton

### Client-Side Compute

- Background algorithm compute: Web Workers + Comlink

### Quality Tooling

- ESLint + typescript-eslint
- Prettier
- Vitest + Testing Library
- Playwright
- Husky + lint-staged + commitlint

---

## 3. Project Structure (Maintainable Long-Term)

```txt
Wumporia/
├─ public/
│  ├─ icons/
│  ├─ lottie/
│  └─ images/
├─ src/
│  ├─ app/
│  │  ├─ router.tsx
│  │  ├─ providers.tsx
│  │  └─ main.tsx
│  ├─ pages/
│  │  ├─ HomePage.tsx
│  │  ├─ GamesPage.tsx
│  │  └─ NotFoundPage.tsx
│  ├─ components/
│  │  ├─ layout/
│  │  ├─ navigation/
│  │  ├─ motion/
│  │  ├─ feedback/
│  │  └─ ui/
│  ├─ features/
│  │  ├─ wumpus/
│  │  │  ├─ components/
│  │  │  ├─ engine/
│  │  │  ├─ workers/
│  │  │  ├─ hooks/
│  │  │  ├─ store/
│  │  │  ├─ types/
│  │  │  ├─ utils/
│  │  │  └─ index.ts
│  │  ├─ maze/
│  │  ├─ puzzle8/
│  │  ├─ tictactoe/
│  │  ├─ vacuum/
│  │  └─ pathfinding/
│  ├─ shared/
│  │  ├─ algorithms/
│  │  │  ├─ search/
│  │  │  ├─ heuristics/
│  │  │  └─ graph/
│  │  ├─ workers/
│  │  ├─ hooks/
│  │  ├─ lib/
│  │  ├─ constants/
│  │  ├─ types/
│  │  └─ utils/
│  ├─ styles/
│  │  ├─ globals.css
│  │  ├─ tokens.css
│  │  └─ animations.css
│  └─ test/
│     ├─ unit/
│     ├─ integration/
│     └─ e2e/
├─ docs/
│  ├─ ROADMAP_AI_PLAYGROUND.md
│  ├─ ARCHITECTURE.md
│  ├─ ALGORITHM_SPEC.md
│  └─ UI_SYSTEM.md
├─ .github/
│  └─ workflows/
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ eslint.config.js
└─ README.md
```

---

## 4. Design Direction

- Bold typography and strong contrast
- CSS token-driven theme in `src/styles/tokens.css`
- Layered background visuals
- Meaningful animations (not noisy)
- Mobile-first behavior

---

## 5. Detailed Implementation Roadmap (Checklist)

### Foundation

- [x] Step 1. Initialize React + TypeScript app using Vite.
- [x] Step 2. Install baseline dependencies (router, state, UI, animation, worker, testing, linting).
- [x] Step 3. Set up strict TypeScript config and path aliases.
- [x] Step 4. Configure ESLint + Prettier + Husky + lint-staged.
- [x] Step 5. Create base folder structure exactly as defined above.
- [x] Step 6. Add global style tokens (`tokens.css`) and base theme system.

### App Shell and Navigation

- [x] Step 7. Build app shell (header, nav, footer, container system).
- [x] Step 8. Build home page with game cards and category filters.
- [x] Step 9. Add route transitions using Framer Motion.
- [x] Step 10. Add loading UX: global overlay, skeletons, and route progress bar.
- [x] Step 11. Add a reusable "Watch AI Solve It" control panel component.

### Algorithm Core and Worker System

- [x] Step 12. Define shared algorithm interfaces (`SearchState`, `StepFrame`, `SolverResult`).
- [x] Step 13. Build worker bridge with Comlink.
- [x] Step 14. Implement shared search utilities (queue, priority queue, visited sets).
- [x] Step 15. Implement reusable heuristics module (Manhattan, Euclidean, custom weighted).
- [x] Step 16. Add step-stream protocol (play/pause/next/reset/auto-run speed).

### Game 1: Wumpus World

- [x] Step 17. Create cave grid engine (hazards, gold, agent state).
- [x] Step 18. Add percept system (breeze, smell, glitter) and rule derivation panel.
- [x] Step 19. Build user play controls + action logs.
- [x] Step 20. Add AI auto-solve mode with explainable inference timeline.
- [x] Step 21. Add edge-case tests for invalid world states.

### Game 2: Maze Solver

- [x] Step 22. Create maze editor (walls, start, goal, random generator).
- [x] Step 23. Implement BFS, DFS, Uniform Cost, Greedy Best First, A\*.
- [x] Step 24. Visualize explored nodes, frontier, and final path.
- [x] Step 25. Add algorithm comparison mode (two side-by-side runs).

### Game 3: 8 Puzzle

- [x] Step 26. Implement board state model and legal move generation.
- [x] Step 27. Implement BFS, Greedy, A\* with Manhattan heuristic.
- [x] Step 28. Add solvability checker and shuffle constraints.
- [x] Step 29. Add move replay + complexity metrics panel.

### Game 4: Tic Tac Toe AI

- [ ] Step 30. Build game engine and board UI with polished interactions.
- [ ] Step 31. Implement Minimax + Alpha-Beta pruning.
- [ ] Step 32. Add difficulty presets (depth limits + scoring tweaks).
- [ ] Step 33. Show AI decision breakdown (best move score + branch preview).

### Game 5: Vacuum World

- [ ] Step 34. Build environment model and dirt distribution generator.
- [ ] Step 35. Implement reflex agent and optional model-based agent.
- [ ] Step 36. Show performance metrics (moves, energy, cleanliness score).

### Game 6: Pathfinding Robot

- [ ] Step 37. Create obstacle map editor and weighted terrain option.
- [ ] Step 38. Implement BFS, Dijkstra, A\*.
- [ ] Step 39. Visualize visited sets, open/closed lists, and heuristic values.
- [ ] Step 40. Add benchmark panel for node expansions and runtime.

### Educational Layer

- [ ] Step 41. Add explanation panels for each algorithm in plain language.
- [ ] Step 42. Add pseudocode viewer synced to current step.
- [ ] Step 43. Add "Try this scenario" guided exercises per game.

### Performance and Stability

- [ ] Step 44. Move all expensive solving to workers.
- [ ] Step 45. Add memoization for derived UI states.
- [ ] Step 46. Add code splitting by route and prefetch next likely game page.
- [ ] Step 47. Add performance budget checks (bundle size + interaction latency).

### Testing and Quality Gate

- [ ] Step 48. Add unit tests for each algorithm and heuristic.
- [ ] Step 49. Add integration tests for step-by-step visualizers.
- [ ] Step 50. Add Playwright smoke tests for all game routes.
- [ ] Step 51. Enforce CI checks: lint, typecheck, tests, build.

### Docs and Delivery

- [ ] Step 52. Write architecture and contribution docs.
- [ ] Step 53. Add per-game technical notes and known limitations.
- [ ] Step 54. Add polished README with screenshots and feature matrix.
- [ ] Step 55. Deploy static build and verify mobile + desktop behavior.

---

## 9. Next Action

Proceed with Step 30 through Step 33 (Tic Tac Toe game engine, Minimax + Alpha-Beta pruning, difficulty presets, and AI decision breakdown).
