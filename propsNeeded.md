# Wumporia Asset And Props Requirements

This file defines exactly what art, props, icons, and motion assets are needed to make the website feel premium, consistent, and easy to maintain.

## 1. General Asset Rules

Use these rules for every asset unless a section says otherwise.

- Preferred formats:
  - `SVG` for icons, symbols, badges, UI marks, diagrams, arrows, tiles, and simple props.
  - `WebP` for illustrated backgrounds and textured scene images.
  - `PNG` only when transparency is required and SVG is not practical.
  - `Lottie JSON` for lightweight looping animations and loading/ambient motion.
- Avoid:
  - low-resolution JPGs
  - clipart-looking assets
  - inconsistent color styles across games
  - assets with watermarks or visible compression artifacts
- Background treatment:
  - transparent background for character/object props
  - full-bleed background only for hero or scene art
- Target visual style:
  - clean semi-editorial illustration
  - slightly cinematic lighting
  - modern educational game feel
  - not cartoon-cheap, not overly childish
- Naming:
  - lowercase only
  - use hyphens, no spaces
  - keep names descriptive and stable

Example:

- `public/images/wumpus/cave-tile-stone.webp`
- `public/images/pathfinding/robot-idle.png`
- `public/lottie/site/loading-grid-pulse.json`

---

## 2. Folder Structure You Should Use

Put downloaded files exactly in these folders.

```txt
public/
├─ images/
│  ├─ site/
│  ├─ shared/
│  ├─ wumpus/
│  ├─ maze/
│  ├─ puzzle8/
│  ├─ tictactoe/
│  ├─ vacuum/
│  └─ pathfinding/
├─ lottie/
│  ├─ site/
│  ├─ shared/
│  ├─ wumpus/
│  ├─ maze/
│  ├─ vacuum/
│  └─ pathfinding/
└─ icons/
   ├─ site/
   ├─ games/
   └─ ui/
```

---

## 3. Site-Wide Assets

These are needed for the homepage, loading overlay, transitions, and premium polish.

### Required

- `public/images/site/hero-ai-playground-bg.webp`
  - Wide background illustration for homepage hero.
  - Style: abstract AI-lab environment, subtle grid, layered light.
  - Target: around `2200x1400`.
- `public/images/site/section-noise-overlay.png`
  - Very subtle grain/noise texture.
  - Transparent PNG.
  - Target: tileable.
- `public/lottie/site/loading-grid-pulse.json`
  - Elegant loading animation.
  - Style: nodes, lines, pulses, no mascot.
- `public/lottie/site/route-transition-orb.json`
  - Optional transition accent animation.
  - Style: soft geometric motion.
- `public/icons/site/brand-mark.svg`
  - Clean logo mark for Wumporia.
- `public/icons/ui/filter.svg`
- `public/icons/ui/play.svg`
- `public/icons/ui/pause.svg`
- `public/icons/ui/reset.svg`
- `public/icons/ui/step-forward.svg`
- `public/icons/ui/compare.svg`
- `public/icons/ui/randomize.svg`
- `public/icons/ui/info.svg`

### Nice To Have

- `public/images/site/footer-gradient-band.webp`
- `public/images/shared/card-glow-mask.png`
- `public/icons/site/brand-monogram.svg`

---

## 4. Wumpus World Assets

This game should feel like an ancient underground logic cave, not a generic flat grid.

### Required Core Props

- `public/images/wumpus/cave-floor-tile.webp`
  - Base traversable tile.
  - Stone texture, readable, not too dark.
- `public/images/wumpus/cave-wall-tile.webp`
  - Optional decorative boundary tile.
- `public/images/wumpus/agent-explorer-idle.png`
  - Small top-down or slightly angled explorer character.
  - Transparent background.
- `public/images/wumpus/wumpus-creature-idle.png`
  - Creature prop for reveal states.
  - Slightly menacing but not horror.
- `public/images/wumpus/gold-pile.png`
  - Gold reward object.
  - Transparent background.
- `public/images/wumpus/pit-hole.png`
  - Pit tile prop.
  - Transparent or masked shadow.

### Percept And Reasoning Visuals

- `public/icons/games/wumpus-breeze.svg`
- `public/icons/games/wumpus-smell.svg`
- `public/icons/games/wumpus-glitter.svg`
- `public/icons/games/wumpus-safe.svg`
- `public/icons/games/wumpus-danger.svg`
- `public/lottie/wumpus/breeze-loop.json`
  - Optional ambient breeze loop.
- `public/lottie/wumpus/glitter-loop.json`
  - Optional gold sparkle effect.

### Nice To Have

- `public/images/wumpus/cave-fog-overlay.png`
- `public/images/wumpus/ancient-runes-panel.webp`
- `public/images/wumpus/torch-glow.png`

---

## 5. Maze Solver Assets

This one should feel computational and clean, with strong contrast between frontier, visited, and final path.

### Required Core Props

- `public/images/maze/grid-cell-base.webp`
  - Neutral board tile.
- `public/images/maze/grid-cell-wall.webp`
  - Wall tile.
- `public/images/maze/start-marker.png`
  - Start icon or beacon.
- `public/images/maze/goal-marker.png`
  - Goal icon or target beacon.
- `public/icons/games/maze-frontier.svg`
- `public/icons/games/maze-explored.svg`
- `public/icons/games/maze-path.svg`
- `public/icons/games/maze-wall.svg`

### Nice To Have

- `public/lottie/maze/frontier-wave.json`
  - Expanding search pulse.
- `public/lottie/maze/path-trace.json`
  - Final path reveal animation.
- `public/images/maze/grid-overlay-lines.png`

---

## 6. 8 Puzzle Assets

This should feel tactile and premium, like physical intelligent tiles.

### Required Core Props

- `public/images/puzzle8/tile-surface-light.webp`
- `public/images/puzzle8/tile-surface-dark.webp`
- `public/images/puzzle8/board-frame.webp`
- `public/icons/games/puzzle-empty-slot.svg`

### Recommended Style

- Tiles should have depth and light shadow.
- Numbers can be rendered in CSS, so artwork should mainly support board and tile surfaces.

### Nice To Have

- `public/lottie/shared/board-swap-flash.json`
- `public/images/puzzle8/board-highlight.png`

---

## 7. Tic Tac Toe Assets

This should feel minimal but premium, not childish.

### Required Core Props

- `public/images/tictactoe/board-surface.webp`
- `public/icons/games/tictactoe-x.svg`
- `public/icons/games/tictactoe-o.svg`
- `public/icons/games/tictactoe-winning-line.svg`

### Nice To Have

- `public/lottie/shared/win-burst-soft.json`
- `public/images/tictactoe/move-hover-glow.png`

---

## 8. Vacuum World Assets

This should feel clean, modular, and slightly playful.

### Required Core Props

- `public/images/vacuum/room-tile-clean.webp`
- `public/images/vacuum/room-tile-dirty.webp`
- `public/images/vacuum/vacuum-robot-idle.png`
- `public/images/vacuum/dust-cluster.png`
- `public/icons/games/vacuum-clean.svg`
- `public/icons/games/vacuum-dirty.svg`
- `public/icons/games/vacuum-energy.svg`

### Nice To Have

- `public/lottie/vacuum/clean-sweep.json`
- `public/lottie/vacuum/dust-burst.json`

---

## 9. Pathfinding Robot Assets

This should feel like a polished robotics lab visualization.

### Required Core Props

- `public/images/pathfinding/robot-idle.png`
- `public/images/pathfinding/robot-move-1.png`
- `public/images/pathfinding/robot-move-2.png`
- `public/images/pathfinding/grid-floor.webp`
- `public/images/pathfinding/obstacle-block.webp`
- `public/images/pathfinding/weighted-cell.webp`
- `public/images/pathfinding/goal-dock.png`
- `public/icons/games/path-open-set.svg`
- `public/icons/games/path-closed-set.svg`
- `public/icons/games/path-heuristic.svg`

### Nice To Have

- `public/lottie/pathfinding/robot-scan.json`
- `public/lottie/pathfinding/path-pulse.json`
- `public/images/pathfinding/sensor-ring.png`

---

## 10. Shared FX And Utility Assets

These assets can be reused across multiple games.

### Recommended

- `public/images/shared/soft-shadow-blob.png`
- `public/images/shared/glow-ring-cyan.png`
- `public/images/shared/glow-ring-amber.png`
- `public/images/shared/panel-reflection.png`
- `public/lottie/shared/success-check.json`
- `public/lottie/shared/attention-pulse.json`
- `public/lottie/shared/ambient-node-network.json`

---

## 11. Minimum Download Priority

Download in this order first so I can use them immediately.

### Priority 1

- `public/images/site/hero-ai-playground-bg.webp`
- `public/lottie/site/loading-grid-pulse.json`
- `public/icons/site/brand-mark.svg`
- `public/images/wumpus/cave-floor-tile.webp`
- `public/images/wumpus/agent-explorer-idle.png`
- `public/images/wumpus/wumpus-creature-idle.png`
- `public/images/wumpus/gold-pile.png`
- `public/images/wumpus/pit-hole.png`
- `public/images/maze/grid-cell-base.webp`
- `public/images/maze/grid-cell-wall.webp`
- `public/images/maze/start-marker.png`
- `public/images/maze/goal-marker.png`
- `public/images/pathfinding/robot-idle.png`
- `public/images/vacuum/vacuum-robot-idle.png`

### Priority 2

- all game-specific icons
- all loading/ambient Lottie files
- shared glow and overlay assets

### Priority 3

- optional decorative scene art and ambient overlays

---

## 12. File Quality Checklist

Before placing a file in the project, verify:

- width and height are large enough for retina screens
- transparent assets truly have transparent backgrounds
- styles match across games
- icon stroke thickness is visually consistent
- no random white edges around PNG cutouts
- filenames exactly match the names listed above

---

## 13. What I Will Do After You Download Them

Once you place the files in the folders above, I can:

- integrate them into the homepage hero and section cards
- replace flat cells with rich scene props in Wumpus and Maze
- animate idle objects and loading overlays
- upgrade each mini-game to a much more premium visual language
- build a more cinematic, animated presentation across the full site
