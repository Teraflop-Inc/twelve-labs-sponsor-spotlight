"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { CloseIcon } from "@/icons"
import { composeRefs } from "@/lib/use-tab-only-focus-ring"
import { useUntransformedRect } from "@/lib/use-untransformed-rect"
import { cn } from "@/lib/utils"

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ref, ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  // Anchor the popover to the trigger's resting box so a Button press scale
  // can't drag the open popover around.
  const restingRectRef = useUntransformedRect<HTMLButtonElement>()
  return (
    <PopoverPrimitive.Trigger
      ref={composeRefs(ref, restingRectRef)}
      data-slot="popover-trigger"
      {...props}
    />
  )
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  // Keeps the arrow off the 20px (rounded-tlds-5) corners so it stays flush with
  // the surface edge when aligned to start/end.
  arrowPadding = 24,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  /** Render an X dismiss button pinned to the top-right corner. */
  showCloseButton?: boolean
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        arrowPadding={arrowPadding}
        className={cn(
          "relative z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-tlds-5 bg-foreground-body p-5 text-foreground-primary shadow-[0px_20px_12px_0px_rgba(29,28,27,0.2)] outline-hidden",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <PopoverPrimitive.Close
            data-slot="popover-close-button"
            aria-label="Close"
            className="absolute top-3 right-3 inline-flex size-4 items-center justify-center rounded-tlds-1 text-foreground-primary opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-misc-ring/50 disabled:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
          >
            <CloseIcon />
          </PopoverPrimitive.Close>
        )}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
}

// Pointer that visually tethers the popover to its trigger. Place inside
// <PopoverContent>. Fill matches the popover surface (foreground-body).
function PopoverArrow({
  className,
  width = 16,
  height = 8,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Arrow>) {
  return (
    <PopoverPrimitive.Arrow
      data-slot="popover-arrow"
      width={width}
      height={height}
      className={cn("fill-foreground-body", className)}
      {...props}
    />
  )
}

// Closes the popover when clicked. Unstyled by design — use `asChild` to wrap
// an action button (e.g. "Okay" / "Skip"), or use <PopoverContent
// showCloseButton> for the top-right X.
function PopoverClose({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Close>) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-1 text-sm leading-5", className)}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <div
      data-slot="popover-title"
      className={cn("text-sm leading-5 font-medium", className)}
      {...props}
    />
  )
}

function PopoverDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="popover-description"
      className={cn("text-sm leading-5 text-foreground-primary/80", className)}
      {...props}
    />
  )
}

function PopoverFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-footer"
      className={cn("flex items-center justify-between gap-2", className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverClose,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverFooter,
}
