import * as RadixSwitch from '@radix-ui/react-switch'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
      <span className="text-fg">{label}</span>
      <RadixSwitch.Root
        checked={checked}
        onCheckedChange={onChange}
        className="relative h-5 w-9 rounded-full bg-border-strong transition-colors data-[state=checked]:bg-fg"
      >
        <RadixSwitch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-bg shadow transition-transform data-[state=checked]:translate-x-[18px] data-[state=unchecked]:bg-fg" />
      </RadixSwitch.Root>
    </label>
  )
}
