import { MazeSolverSection } from '@/features/maze'
import { GamePageShell } from '@/pages/GamePageShell'

export function MazePage() {
  return (
    <GamePageShell
      eyebrow="Search Algorithms"
      title="Maze Search Visualizer"
      description="Design mazes, compare algorithm behavior, and inspect frontier/explored/path evolution step by step."
      module={<MazeSolverSection />}
    />
  )
}
