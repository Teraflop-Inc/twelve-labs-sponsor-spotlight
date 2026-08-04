"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import * as MenuPrimitive from "@radix-ui/react-dropdown-menu"

import { composeRefs, useTabOnlyFocusRing } from "@/lib/use-tab-only-focus-ring"
import { useUntransformedRect } from "@/lib/use-untransformed-rect"
import { cn } from "@/lib/utils"

import { Separator } from "./separator"

type MenuSize = "medium" | "small" | "mini"

// Rows inherit their size from the nearest `MenuContent`/`MenuSubContent`
// (default `small`); any row can still override with its own `size` prop.
const MenuSizeContext = React.createContext<MenuSize>("small")

function useMenuSize(size?: MenuSize) {
  const inherited = React.useContext(MenuSizeContext)
  return size ?? inherited
}

// TLDS 2.0 Menu. The surface styling is shared (and exported) so other
// floating lists — e.g. the Select dropdown — render the exact same card: a
// soft 12px-radius white card with a 4px-blur shadow, holding 8px-radius rows
// that highlight on `surface-card`. The transform-origin / available-height
// vars are primitive-specific, so each consumer appends its own.
const menuSurfaceClassName = cn(
  "z-50 overflow-x-hidden overflow-y-auto rounded-tlds-3 bg-surface-white p-1 text-foreground-body shadow-[0px_0px_4px_0px_rgba(34,34,34,0.2)]",
  "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
)

const menuContentClassName = cn(
  menuSurfaceClassName,
  "min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin)",
)

type MenuContentVariant = "default" | "comfortable" | "spacious" | "floating"

// TLDS 2.0 content-card variants. They scale the card's padding and corner
// radius together — `default` (4px / 12px) is the standard menu; `comfortable`
// (8px / 12px) and `spacious` (24px / 32px) loosen it. `floating` matches
// `spacious` but trades the soft surface shadow for a heavier drop shadow so
// the card reads as detached. `menuContentClassName` already encodes `default`,
// so each variant only layers the deltas — twMerge (via `cn`) resolves the
// conflicting padding/radius/shadow utilities, keeping the variant's.
const menuContentVariants = cva(menuContentClassName, {
  variants: {
    variant: {
      default: "",
      comfortable: "p-2",
      spacious: "p-6 rounded-tlds-32",
      floating: "p-6 rounded-tlds-32 shadow-[0px_32px_24px_0px_rgba(29,28,27,0.2)]",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const menuItemVariants = cva(
  cn(
    "relative flex cursor-default items-center gap-2 rounded-tlds-2 text-foreground-body outline-hidden select-none",
    // Haptic press, matching Button. Transition only `transform` so the
    // highlight still toggles instantly (no hover flicker).
    "transition-transform duration-150 motion-safe:active:scale-[0.97] data-[disabled]:active:scale-100",
    "focus:bg-surface-card",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ),
  {
    variants: {
      size: {
        // `min-w` matches each row's height so a row with tiny content stays at
        // least square: medium 44px (12px pad ×2 + 20px line), small 36px
        // (8px ×2 + 20px), mini 22px (4px ×2 + 14px).
        medium: "min-w-11 p-3 text-base leading-5 [&_svg:not([class*='size-'])]:size-4",
        small: "min-w-9 px-3 py-2 text-sm leading-5 [&_svg:not([class*='size-'])]:size-4",
        mini: "min-w-5.5 px-2 py-1 text-[10px] leading-3.5 [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      size: "small",
    },
  },
)

function Menu({ ...props }: React.ComponentProps<typeof MenuPrimitive.Root>) {
  return <MenuPrimitive.Root data-slot="menu" {...props} />
}

function MenuPortal({ ...props }: React.ComponentProps<typeof MenuPrimitive.Portal>) {
  return <MenuPrimitive.Portal data-slot="menu-portal" {...props} />
}

function MenuTrigger({ ref, ...props }: React.ComponentProps<typeof MenuPrimitive.Trigger>) {
  const focusRingRef = useTabOnlyFocusRing<HTMLButtonElement>()
  // Anchor the menu to the trigger's resting box so the Button press scale
  // can't drag the open menu around.
  const restingRectRef = useUntransformedRect<HTMLButtonElement>()
  return (
    <MenuPrimitive.Trigger
      ref={composeRefs(ref, focusRingRef, restingRectRef)}
      data-slot="menu-trigger"
      {...props}
    />
  )
}

function MenuContent({
  className,
  sideOffset = 4,
  size = "small",
  variant = "default",
  children,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Content> & {
  size?: MenuSize
  variant?: MenuContentVariant
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        data-slot="menu-content"
        data-size={size}
        data-variant={variant}
        sideOffset={sideOffset}
        className={cn(
          menuContentVariants({ variant }),
          "max-h-(--radix-dropdown-menu-content-available-height)",
          className,
        )}
        {...props}
      >
        <MenuSizeContext.Provider value={size}>{children}</MenuSizeContext.Provider>
      </MenuPrimitive.Content>
    </MenuPrimitive.Portal>
  )
}

function MenuGroup({ ...props }: React.ComponentProps<typeof MenuPrimitive.Group>) {
  return <MenuPrimitive.Group data-slot="menu-group" {...props} />
}

// Reuse the shared `Separator` so the divider's color/thickness stay identical
// everywhere; `MenuPrimitive.Separator` (via `asChild`) adds the menu's
// `role="separator"` semantics on top. `my-1` separates adjacent rows; the line
// stays inside the content padding so it lines up with the rows' width across
// every content variant.
function MenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator asChild {...props}>
      <Separator data-slot="menu-separator" className={cn("my-1", className)} />
    </MenuPrimitive.Separator>
  )
}

function MenuItem({
  className,
  inset,
  variant = "default",
  size,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
  size?: MenuSize
}) {
  const resolvedSize = useMenuSize(size)
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        menuItemVariants({ size: resolvedSize }),
        "data-[inset]:pl-8",
        "data-[variant=destructive]:text-foreground-status-error data-[variant=destructive]:focus:bg-surface-destructive/10 data-[variant=destructive]:focus:text-foreground-status-error data-[variant=destructive]:*:[svg]:text-foreground-status-error!",
        className,
      )}
      {...props}
    />
  )
}

export {
  Menu,
  MenuPortal,
  MenuTrigger,
  MenuContent,
  MenuGroup,
  MenuSeparator,
  MenuItem,
  menuItemVariants,
  menuContentVariants,
  menuSurfaceClassName,
}
export type { MenuSize, MenuContentVariant }
