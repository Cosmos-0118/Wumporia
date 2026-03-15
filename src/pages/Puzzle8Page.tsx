import { Puzzle8Section } from '@/features/puzzle8'
import { GamePageShell } from '@/pages/GamePageShell'

export function Puzzle8Page() {
  return (
    <GamePageShell
      eyebrow="Search Algorithms"
      title="8 Puzzle Solver"
      description="Explore state-space complexity with BFS, Greedy, and A* while replaying the final move sequence with metrics."
      module={<Puzzle8Section />}
    />
  )
}
