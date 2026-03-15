import { useMemo, useState } from 'react'

import { runVacuumComparison } from '@/features/vacuum/engine/agents'
import { createVacuumWorld, defaultVacuumBlueprint } from '@/features/vacuum/engine/world'
import type {
  VacuumAgentType,
  VacuumMetrics,
  VacuumRunResult,
  VacuumSnapshot,
  VacuumWorld,
} from '@/features/vacuum/types/vacuum'
import { toVacuumKey } from '@/features/vacuum/utils/position'

interface VacuumPaneProps {
  title: string
  world: VacuumWorld
  result: VacuumRunResult
  step: number
  onStepChange: (step: number) => void
}

function MetricsCard({ metrics, agentType }: { metrics: VacuumMetrics; agentType: VacuumAgentType }) {
  return (
    <div className="vacuum-metrics-card">
      <div className="vacuum-metrics-card__title-row">
        <h4>{agentType === 'model-based' ? 'Model-Based Agent' : 'Reflex Agent'}</h4>
        <span className={agentType === 'model-based' ? 'vacuum-chip vacuum-chip--model' : 'vacuum-chip vacuum-chip--reflex'}>
          {agentType}
        </span>
      </div>
      <div className="vacuum-metrics-grid">
        <div>
          <p>Moves</p>
          <strong>{metrics.moves}</strong>
        </div>
        <div>
          <p>Energy</p>
          <strong>{metrics.energyUsed}</strong>
        </div>
        <div>
          <p>Cleaned</p>
          <strong>{metrics.cleanedTiles}</strong>
        </div>
        <div>
          <p>Remaining Dirt</p>
          <strong>{metrics.remainingDirty}</strong>
        </div>
        <div>
          <p>Cleanliness</p>
          <strong>{metrics.cleanlinessScore}%</strong>
        </div>
        <div>
          <p>Steps</p>
          <strong>{metrics.steps}</strong>
        </div>
      </div>
    </div>
  )
}

function VacuumGrid({ world, snapshot }: { world: VacuumWorld; snapshot: VacuumSnapshot }) {
  const dirtySet = new Set(snapshot.dirtyKeys)
  const agentKey = toVacuumKey(snapshot.agent)

  return (
    <div className="vacuum-grid" style={{ gridTemplateColumns: `repeat(${String(world.cols)}, minmax(0, 1fr))` }}>
      {Array.from({ length: world.rows * world.cols }).map((_, idx) => {
        const row = Math.floor(idx / world.cols)
        const col = idx % world.cols
        const key = `${String(row)},${String(col)}`
        const isAgent = key === agentKey
        const isDirty = dirtySet.has(key)

        const cls = [
          'vacuum-cell',
          isDirty ? 'vacuum-cell--dirty' : 'vacuum-cell--clean',
          isAgent ? 'vacuum-cell--agent' : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <div className={cls} key={key}>
            {isDirty && <span className="vacuum-cell__dust">•</span>}
            {isAgent && <span className="vacuum-cell__bot">◉</span>}
          </div>
        )
      })}
    </div>
  )
}

function VacuumPane({ title, world, result, step, onStepChange }: VacuumPaneProps) {
  const frame = result.history[step] ?? result.history[result.history.length - 1]
  if (frame === undefined) {
    return null
  }

  return (
    <article className="vacuum-pane">
      <div className="vacuum-pane__header">
        <h3>{title}</h3>
        <p>
          Step {frame.step} · Action: <strong>{frame.action}</strong>
        </p>
      </div>

      <input
        type="range"
        className="vacuum-scrubber"
        min={0}
        max={Math.max(0, result.history.length - 1)}
        value={step}
        onChange={(event) => onStepChange(Number(event.target.value))}
      />

      <div className="vacuum-pane__legend">
        <span><i className="vacuum-dot vacuum-dot--agent" /> Agent</span>
        <span><i className="vacuum-dot vacuum-dot--dirty" /> Dirt</span>
        <span><i className="vacuum-dot vacuum-dot--clean" /> Clean</span>
      </div>

      <VacuumGrid world={world} snapshot={frame} />
    </article>
  )
}

export function VacuumWorldSection() {
  const [world, setWorld] = useState<VacuumWorld>(() => createVacuumWorld(defaultVacuumBlueprint))
  const [reflexStep, setReflexStep] = useState(0)
  const [modelStep, setModelStep] = useState(0)

  const comparison = useMemo(() => runVacuumComparison(world, 120), [world])

  const regenerate = () => {
    const next = createVacuumWorld(defaultVacuumBlueprint)
    setWorld(next)
    setReflexStep(0)
    setModelStep(0)
  }

  return (
    <section className="vacuum-lab" id="vacuum-world" aria-label="Vacuum world simulation">
      <div className="vacuum-lab__header">
        <div>
          <p className="eyebrow">Intelligent Agents</p>
          <h2>Vacuum World</h2>
          <p>
            Compare a local reflex policy versus a model-based policy on the same dirt map, and
            track cleaning performance with moves, energy usage, and cleanliness score.
          </p>
        </div>
        <div className="vacuum-summary-chips">
          <span>{world.rows}x{world.cols} grid</span>
          <span>{world.dirtKeys.length} dirty tiles</span>
          <button type="button" onClick={regenerate}>Regenerate Dirt</button>
        </div>
      </div>

      <div className="vacuum-metrics-row">
        <MetricsCard metrics={comparison.reflex.metrics} agentType="reflex" />
        <MetricsCard metrics={comparison.modelBased.metrics} agentType="model-based" />
      </div>

      <div className="vacuum-panels">
        <VacuumPane
          title="Reflex Agent Run"
          world={world}
          result={comparison.reflex}
          step={reflexStep}
          onStepChange={setReflexStep}
        />
        <VacuumPane
          title="Model-Based Agent Run"
          world={world}
          result={comparison.modelBased}
          step={modelStep}
          onStepChange={setModelStep}
        />
      </div>
    </section>
  )
}
