"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import * as SelectPrimitive from "@radix-ui/react-select"

import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@/icons"
import { composeRefs, useTabOnlyFocusRing } from "@/lib/use-tab-only-focus-ring"
import { useUntransformedRect } from "@/lib/use-untransformed-rect"
import { cn } from "@/lib/utils"

import { type MenuSize, menuItemVariants, menuSurfaceClassName } from "./menu"

type SelectSize = "mini" | "small" | "regular" | "medium" | "large" | "xlarge"

// The dropdown reuses the Menu's row sizing (medium/small/mini, default small)
// so the content looks identical to a `Menu`. Items inherit the size set on
// `SelectContent`, and can override per item.
const SelectContentSizeContext = React.createContext<MenuSize>("small")

function useSelectItemSize(size?: MenuSize) {
  const inherited = React.useContext(SelectContentSizeContext)
  return size ?? inherited
}

// Trigger geometry/type ramp per the TLDS 2.0 Select spec. Resting border is
// `secondary`; it goes `primary` on focus/open, `destructive` on `aria-invalid`,
// and the whole control turns into the disabled token set when disabled. The
// chevron and value inherit the trigger's text color via `currentColor`.
const selectTriggerVariants = cva(
  cn(
    "group flex w-full items-center justify-between border border-solid border-border-secondary bg-transparent whitespace-nowrap text-foreground-body outline-none transition-colors",
    "data-placeholder:text-foreground-muted",
    // Focus/open promote the border to `primary`, but only while valid — the
    // error state below keeps its red border on focus/open too.
    "not-aria-invalid:focus-visible:border-border-primary not-aria-invalid:data-[state=open]:border-border-primary",
    // Suppress the focus-visible border when focus was restored to the trigger
    // by a closing dropdown (see useTabOnlyFocusRing) rather than a Tab.
    "not-aria-invalid:data-no-focus-ring:focus-visible:border-border-secondary",
    // Error and disabled also win for the placeholder (the compound variant
    // outranks `data-placeholder:`), so the value text and the inherited
    // chevron color follow the state too.
    "aria-invalid:border-border-destructive aria-invalid:text-foreground-status-error aria-invalid:data-placeholder:text-foreground-status-error",
    "disabled:cursor-default disabled:border-border-disabled disabled:bg-surface-card disabled:text-foreground-disabled disabled:data-placeholder:text-foreground-disabled",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2",
  ),
  {
    variants: {
      size: {
        mini: "h-5 gap-1 rounded-tlds-1-half px-1 text-[10px] leading-3.5 [&_svg]:size-3",
        small: "h-6 gap-2 rounded-tlds-2 px-2 text-[12px] leading-4 [&_svg]:size-3",
        regular: "h-7 gap-2 rounded-tlds-2 px-2 text-[12px] leading-4 [&_svg]:size-4",
        medium: "h-8 gap-2 rounded-tlds-2 px-2 text-sm leading-5 [&_svg]:size-4",
        large: "h-10 gap-2 rounded-tlds-3 px-4 text-sm leading-5 [&_svg]:size-4",
        xlarge: "h-12 gap-2 rounded-tlds-3 px-4 text-base leading-6 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      size: "large",
    },
  },
)

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

// Error message type ramp keyed off the trigger size, mirroring TextField.
const SELECT_MESSAGE_STYLES: Record<NonNullable<SelectSize>, string> = {
  mini: "text-[10px] leading-[14px]",
  small: "text-[10px] leading-[14px]",
  regular: "text-[12px] leading-4",
  medium: "text-[12px] leading-4",
  large: "text-[12px] leading-4",
  xlarge: "text-[12px] leading-4",
}

function SelectTrigger({
  className,
  size = "large",
  children,
  ref,
  error,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> &
  VariantProps<typeof selectTriggerVariants> & {
    /**
     * Error state. Pass `true` for error styling only, or a string/node to
     * also render a message below the control. `aria-invalid` enables it too.
     */
    error?: boolean | React.ReactNode
  }) {
  const focusRingRef = useTabOnlyFocusRing<HTMLButtonElement>()
  // Anchor the dropdown to the trigger's resting box (consistent with Menu /
  // Popover / Tooltip) so a Button press scale can't drag the open list around.
  const restingRectRef = useUntransformedRect<HTMLButtonElement>()
  const reactId = React.useId()
  const triggerId = id ?? reactId
  const messageId = `${triggerId}-message`

  const errorMessage = typeof error === "boolean" ? undefined : error
  const hasError =
    error === true || errorMessage != null || ariaInvalid === true || ariaInvalid === "true"

  const trigger = (
    <SelectPrimitive.Trigger
      ref={composeRefs(ref, focusRingRef, restingRectRef)}
      id={triggerId}
      data-slot="select-trigger"
      data-size={size}
      aria-invalid={hasError || undefined}
      aria-describedby={cn(ariaDescribedBy, errorMessage != null && messageId) || undefined}
      className={cn(selectTriggerVariants({ size }), className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )

  // No message → return the bare trigger so width/layout stay untouched.
  if (errorMessage == null) return trigger

  return (
    <div data-slot="select-field" className="flex flex-col gap-1">
      {trigger}
      <p
        id={messageId}
        data-slot="select-error-message"
        className={cn("text-foreground-status-error", SELECT_MESSAGE_STYLES[size ?? "large"])}
      >
        {errorMessage}
      </p>
    </div>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "start",
  sideOffset = 4,
  size = "small",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & {
  size?: MenuSize
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-size={size}
        className={cn(
          // Same card as the Menu, plus Select's own transform-origin /
          // available-height vars.
          menuSurfaceClassName,
          "relative max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin)",
          // Default the dropdown to the trigger's width (popper only). An
          // explicit `w-*` in `className` overrides this via tailwind-merge.
          position === "popper" && "w-(--radix-select-trigger-width)",
          className,
        )}
        position={position}
        align={align}
        sideOffset={sideOffset}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          // Padding comes from `menuSurfaceClassName` on the content (matching
          // MenuContent), so the viewport adds none of its own.
          className={cn(
            position === "popper" && "h-(--radix-select-trigger-height) w-full scroll-my-1",
          )}
        >
          <SelectContentSizeContext.Provider value={size}>
            {children}
          </SelectContentSizeContext.Provider>
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  size,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item> & {
  size?: MenuSize
}) {
  const resolvedSize = useSelectItemSize(size)
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        menuItemVariants({ size: resolvedSize }),
        "w-full pr-8 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span
        data-slot="select-item-indicator"
        className="absolute right-3 flex size-3.5 items-center justify-center"
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  selectTriggerVariants,
  SelectValue,
}
export type { SelectSize }
