import { useCallback, useEffect, useState } from 'react'

export const PLAYBACK_SPEEDS = [1, 2, 4, 8] as const

/**
 * Drives a replay over `total` frames. `cursor` is -1 before the first frame is shown.
 */
export function usePlayback(total: number, baseMs = 700) {
  const [cursor, setCursor] = useState(-1)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState<number>(2)

  const last = total - 1
  const position = Math.min(cursor, last)
  const playing = running && position < last

  useEffect(() => {
    if (!playing) return
    const id = setInterval(
      () => {
        setCursor((c) => Math.min(c + 1, last))
      },
      Math.max(40, baseMs / speed),
    )
    return () => {
      clearInterval(id)
    }
  }, [playing, speed, last, baseMs])

  const play = useCallback(() => {
    setCursor((c) => (c >= last ? 0 : c + 1))
    setRunning(true)
  }, [last])

  const pause = useCallback(() => {
    setRunning(false)
  }, [])

  const step = useCallback(
    (delta: number) => {
      setRunning(false)
      setCursor((c) => Math.max(-1, Math.min(c + delta, last)))
    },
    [last],
  )

  const reset = useCallback(() => {
    setRunning(false)
    setCursor(-1)
  }, [])

  return {
    cursor: position,
    playing,
    speed,
    setSpeed,
    play,
    pause,
    step,
    reset,
    total,
    finished: total > 0 && position >= last,
  }
}

export type Playback = ReturnType<typeof usePlayback>
