import * as RadixSlider from '@radix-ui/react-slider'

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  label: string
}

export function Slider({ value, onChange, min, max, step = 1, label }: SliderProps) {
  return (
    <RadixSlider.Root
      value={[value]}
      min={min}
      max={max}
      step={step}
      aria-label={label}
      onValueChange={([next]) => {
        if (next !== undefined) onChange(next)
      }}
      className="relative flex h-5 w-full touch-none items-center select-none"
    >
      <RadixSlider.Track className="relative h-1 grow rounded-full bg-border-strong">
        <RadixSlider.Range className="absolute h-full rounded-full bg-fg" />
      </RadixSlider.Track>
      <RadixSlider.Thumb className="block size-4 rounded-full border border-border-strong bg-fg shadow transition-transform hover:scale-110 focus-visible:outline-2" />
    </RadixSlider.Root>
  )
}
