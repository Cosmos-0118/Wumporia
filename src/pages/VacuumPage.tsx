import { VacuumWorldSection } from '@/features/vacuum'
import { GamePageShell } from '@/pages/GamePageShell'

export function VacuumPage() {
  return (
    <GamePageShell
      eyebrow="Intelligent Agents"
      title="Vacuum World"
      description="Compare reflex and model-based agents on the same environment with performance metrics and step playback."
      module={<VacuumWorldSection />}
    />
  )
}
