"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type RadioGroupContextValue = {
  name: string
  value: string | undefined
  setValue: (value: string) => void
  disabled?: boolean
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null)

type RadioGroupProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> & {
  name?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

function RadioGroup({
  className,
  name,
  value,
  defaultValue,
  onValueChange,
  disabled,
  ...props
}: RadioGroupProps) {
  const reactId = React.useId()
  const groupName = name ?? `radiogroup-${reactId}`

  const [uncontrolledValue, setUncontrolledValue] = React.useState<string | undefined>(defaultValue)
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : uncontrolledValue

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolledValue(next)
      onValueChange?.(next)
    },
    [isControlled, onValueChange]
  )

  return (
    <RadioGroupContext.Provider value={{ name: groupName, value: currentValue, setValue, disabled }}>
      <div
        role="radiogroup"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </RadioGroupContext.Provider>
  )
}

type RadioGroupItemProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & {
  value: string
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, disabled, ...props }, ref) => {
    const ctx = React.useContext(RadioGroupContext)
    if (!ctx) {
      throw new Error("RadioGroupItem must be used within a RadioGroup")
    }

    const isDisabled = ctx.disabled || disabled
    const checked = ctx.value === value

    return (
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        <input
          ref={ref}
          type="radio"
          name={ctx.name}
          value={value}
          checked={checked}
          disabled={isDisabled}
          onChange={() => ctx.setValue(value)}
          className={cn("peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed", className)}
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-flex h-4 w-4 items-center justify-center rounded-full border border-input bg-background text-foreground shadow-sm peer-focus-visible:outline-none peer-focus-visible:ring-1 peer-focus-visible:ring-ring peer-disabled:opacity-50",
            checked && "border-primary"
          )}
        >
          {checked ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
        </span>
      </span>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }

