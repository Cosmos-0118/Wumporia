import { WumpusWorldSection } from '@/features/wumpus'
import { GamePageShell } from '@/pages/GamePageShell'

export function WumpusPage() {
  return (
    <GamePageShell
      eyebrow="Logic"
      title="Wumpus World"
      description="Reason under uncertainty with percept-driven inference, safe-cell deduction, and an explainable solver timeline."
      module={<WumpusWorldSection />}
    />
  )
}
