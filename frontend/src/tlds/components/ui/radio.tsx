"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"

import { RadioGroupItem, type RadioGroupItemProps } from "./radio-group"

type RadioProps = Pick<
  RadioGroupItemProps,
  "size" | "error" | "label" | "errorMessage" | "className" | "id"
> & {
  /** Internal value used to back the radio; rarely needs overriding. */
  value?: string
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  required?: boolean
  name?: string
}

// A standalone radio reusing the exact styles of `RadioGroupItem`. Radio
// primitives need a group root for context, so this wraps a single item in its
// own root and exposes a boolean `checked` API like `Checkbox`.
function Radio({
  value = "on",
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  required,
  name,
  ...item
}: RadioProps) {
  const isControlled = checked !== undefined

  return (
    <RadioGroupPrimitive.Root
      data-slot="radio"
      name={name}
      required={required}
      disabled={disabled}
      value={isControlled ? (checked ? value : "") : undefined}
      defaultValue={defaultChecked ? value : undefined}
      onValueChange={(next) => onCheckedChange?.(next === value)}
    >
      <RadioGroupItem value={value} {...item} />
    </RadioGroupPrimitive.Root>
  )
}

export { Radio }
export type { RadioProps }
