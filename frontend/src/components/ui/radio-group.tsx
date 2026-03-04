"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      className={cn("grid gap-2", className)}
      ref={ref}
      role="radiogroup"
      {...props}
    />
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string;
    checked?: boolean;
  }
>(({ className, value, checked, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {checked && (
        <span className="flex items-center justify-center">
          <span className="h-2 w-2 rounded-full bg-primary" />
        </span>
      )}
    </button>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
