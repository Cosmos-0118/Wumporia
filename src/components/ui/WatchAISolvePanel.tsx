interface WatchAISolvePanelProps {
  gameTitle: string
  speed: number
  onSpeedChange: (value: number) => void
  onStart: () => void
  onPause: () => void
  onStep: () => void
  onReset: () => void
  running: boolean
  disabled?: boolean
}

export function WatchAISolvePanel({
  gameTitle,
  speed,
  onSpeedChange,
  onStart,
  onPause,
  onStep,
  onReset,
  running,
  disabled = false,
}: WatchAISolvePanelProps) {
  return (
    <section className="ai-panel" aria-label={`Watch AI Solve It for ${gameTitle}`}>
      <div className="ai-panel__head">
        <h2>Watch AI Solve It</h2>
        <p>{gameTitle}</p>
      </div>

      <label className="ai-panel__speed" htmlFor="speed-range">
        Playback Speed: {speed}x
      </label>
      <input
        id="speed-range"
        className="ai-panel__slider"
        type="range"
        min={1}
        max={5}
        step={1}
        value={speed}
        onChange={(event) => onSpeedChange(Number(event.target.value))}
        disabled={disabled}
      />

      <div className="ai-panel__actions">
        <button type="button" onClick={onStart} disabled={disabled || running}>
          Start
        </button>
        <button type="button" onClick={onPause} disabled={disabled || !running}>
          Pause
        </button>
        <button type="button" onClick={onStep} disabled={disabled}>
          Next Step
        </button>
        <button type="button" onClick={onReset} disabled={disabled}>
          Reset
        </button>
      </div>
    </section>
  )
}
