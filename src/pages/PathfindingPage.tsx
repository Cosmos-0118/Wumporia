import { PathfindingRobotSection } from '@/features/pathfinding'
import { GamePageShell } from '@/pages/GamePageShell'

export function PathfindingPage() {
  return (
    <GamePageShell
      eyebrow="Search Algorithms"
      title="Pathfinding Robot"
      description="Edit obstacle fields and weighted terrain, then benchmark BFS, Dijkstra, and A* with open/closed set inspection and heuristic overlays."
      module={<PathfindingRobotSection />}
    />
  )
}
