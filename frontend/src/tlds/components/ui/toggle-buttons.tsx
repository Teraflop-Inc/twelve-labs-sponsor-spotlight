"use client"

import * as React from "react"
import * as ToggleButtonsPrimitive from "@radix-ui/react-toggle-group"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

type ToggleButtonsSize = "lg" | "md" | "regular" | "sm" | "mini"

const ToggleButtonsContext = React.createContext<{ size: ToggleButtonsSize; gap: boolean }>({
  size: "md",
  gap: false,
})

type ToggleButtonsProps = Omit<
  Extract<React.ComponentProps<typeof ToggleButtonsPrimitive.Root>, { type: "single" }>,
  "type"
> & {
  size?: ToggleButtonsSize
  /** Separate each button with a gap (and fully round every item) instead of joining them. */
  gap?: boolean
}

function ToggleButtons({
  className,
  size = "md",
  gap = false,
  value: valueProp,
  defaultValue,
  onValueChange,
  children,
  ...props
}: ToggleButtonsProps) {
  const isControlled = valueProp !== undefined
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const value = isControlled ? valueProp : internalValue

  const handleValueChange = (next: string) => {
    // Ignore deselection so at least one item always stays selected.
    if (!next) return
    if (!isControlled) setInternalValue(next)
    onValueChange?.(next)
  }

  return (
    <ToggleButtonsContext.Provider value={{ size, gap }}>
      <ToggleButtonsPrimitive.Root
        type="single"
        data-slot="toggle-buttons"
        data-size={size}
        value={value}
        onValueChange={handleValueChange}
        className={cn("inline-flex w-fit items-stretch", gap && "gap-1", className)}
        {...props}
      >
        {children}
      </ToggleButtonsPrimitive.Root>
    </ToggleButtonsContext.Provider>
  )
}

const toggleButtonVariants = cva(
  cn(
    "relative inline-flex shrink-0 cursor-default items-center justify-center gap-1 whitespace-nowrap border font-tl-sans font-normal outline-none transition-all duration-150",
    "motion-safe:active:scale-[0.97] focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-misc-ring/50",
    "disabled:pointer-events-none disabled:active:scale-100",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    // Inactive (data-state=off) — outlined-black look
    "data-[state=off]:border-border-primary data-[state=off]:bg-transparent data-[state=off]:text-foreground-secondary",
    "data-[state=off]:hover:bg-surface-secondary data-[state=off]:active:bg-surface-secondary",
    "data-[state=off]:disabled:border-border-disabled data-[state=off]:disabled:bg-transparent data-[state=off]:disabled:text-foreground-disabled",
    // Active (data-state=on) — primary filled
    "data-[state=on]:z-10 data-[state=on]:border-transparent data-[state=on]:bg-surface-primary data-[state=on]:text-foreground-primary",
    "data-[state=on]:hover:bg-surface-primary-hover data-[state=on]:active:bg-surface-primary-hover",
    "data-[state=on]:disabled:bg-surface-disabled data-[state=on]:disabled:text-foreground-disabled",
    // Bring hovered items above neighbours so borders/radii don't clip
    "hover:z-10",
  ),
  {
    variants: {
      size: {
        lg: "h-10 px-4 text-sm leading-6 [&_svg:not([class*='size-'])]:size-5",
        md: "h-8 px-2 text-sm leading-5 [&_svg:not([class*='size-'])]:size-4",
        regular: "h-7 px-2 text-xs leading-5 [&_svg:not([class*='size-'])]:size-4",
        sm: "h-6 px-2 text-xs leading-4 [&_svg:not([class*='size-'])]:size-4",
        mini: "h-5.5 px-2 text-[10px] leading-3.5 [&_svg:not([class*='size-'])]:size-3",
      },
      // Joined (false): collapse adjacent borders and round only the end corners.
      // Gapped (true): every item fully rounded, no overlap.
      gap: {
        true: "",
        false: "rounded-none not-first:-ml-px",
      },
    },
    compoundVariants: [
      // Joined — end corners rounded on first/last items.
      {
        size: "lg",
        gap: false,
        class:
          "first:rounded-l-button-large last:rounded-r-button-large data-[state=off]:first:hover:rounded-l-button-large-hover data-[state=off]:last:hover:rounded-r-button-large-hover",
      },
      {
        size: "md",
        gap: false,
        class:
          "first:rounded-l-button-medium last:rounded-r-button-medium data-[state=off]:first:hover:rounded-l-button-medium-hover data-[state=off]:last:hover:rounded-r-button-medium-hover",
      },
      {
        size: "regular",
        gap: false,
        class:
          "first:rounded-l-button-regular last:rounded-r-button-regular data-[state=off]:first:hover:rounded-l-button-regular-hover data-[state=off]:last:hover:rounded-r-button-regular-hover",
      },
      {
        size: "sm",
        gap: false,
        class:
          "first:rounded-l-button-small last:rounded-r-button-small data-[state=off]:first:hover:rounded-l-button-small-hover data-[state=off]:last:hover:rounded-r-button-small-hover",
      },
      {
        size: "mini",
        gap: false,
        class:
          "first:rounded-l-button-mini last:rounded-r-button-mini data-[state=off]:first:hover:rounded-l-button-mini-hover data-[state=off]:last:hover:rounded-r-button-mini-hover",
      },
      // Gapped — fully rounded per item.
      {
        size: "lg",
        gap: true,
        class: "rounded-button-large data-[state=off]:hover:rounded-button-large-hover",
      },
      {
        size: "md",
        gap: true,
        class: "rounded-button-medium data-[state=off]:hover:rounded-button-medium-hover",
      },
      {
        size: "regular",
        gap: true,
        class: "rounded-button-regular data-[state=off]:hover:rounded-button-regular-hover",
      },
      {
        size: "sm",
        gap: true,
        class: "rounded-button-small data-[state=off]:hover:rounded-button-small-hover",
      },
      {
        size: "mini",
        gap: true,
        class: "rounded-button-mini data-[state=off]:hover:rounded-button-mini-hover",
      },
    ],
    defaultVariants: {
      size: "md",
      gap: false,
    },
  },
)

function ToggleButton({
  className,
  size: sizeProp,
  leftIcon,
  rightIcon,
  children,
  ...props
}: React.ComponentProps<typeof ToggleButtonsPrimitive.Item> &
  VariantProps<typeof toggleButtonVariants> & {
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
  }) {
  const context = React.useContext(ToggleButtonsContext)
  const size = sizeProp ?? context.size

  // Icon-only (a single element child, no label or side icons) renders square:
  // drop the horizontal padding so width tracks the fixed height.
  const onlyChild = React.Children.toArray(children)[0]
  const isIconOnly =
    leftIcon == null &&
    rightIcon == null &&
    React.Children.count(children) === 1 &&
    React.isValidElement(onlyChild)

  return (
    <ToggleButtonsPrimitive.Item
      data-slot="toggle-button"
      data-size={size}
      className={cn(
        toggleButtonVariants({ size, gap: context.gap }),
        isIconOnly && "aspect-square px-0",
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </ToggleButtonsPrimitive.Item>
  )
}

export { ToggleButtons, ToggleButton, toggleButtonVariants }
