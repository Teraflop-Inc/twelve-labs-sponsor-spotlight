"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { composeRefs } from "@/lib/use-tab-only-focus-ring"
import { useUntransformedRect } from "@/lib/use-untransformed-rect"
import { cn } from "@/lib/utils"

type TooltipPressContextValue = {
  clearPressCloseSuppression: () => void
  suppressPressClose: () => void
}

const TooltipPressContext = React.createContext<TooltipPressContextValue | null>(null)

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  defaultOpen = false,
  onOpenChange,
  open: openProp,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen
  const pressCloseSuppressedRef = React.useRef(false)
  const suppressionTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (suppressionTimerRef.current) clearTimeout(suppressionTimerRef.current)
    }
  }, [])

  const clearPressCloseSuppression = React.useCallback(() => {
    if (suppressionTimerRef.current) clearTimeout(suppressionTimerRef.current)
    suppressionTimerRef.current = null
    pressCloseSuppressedRef.current = false
  }, [])

  const suppressPressClose = React.useCallback(() => {
    if (suppressionTimerRef.current) clearTimeout(suppressionTimerRef.current)
    pressCloseSuppressedRef.current = true
    suppressionTimerRef.current = setTimeout(() => {
      pressCloseSuppressedRef.current = false
      suppressionTimerRef.current = null
    }, 350)
  }, [])

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && pressCloseSuppressedRef.current) return

      if (!isControlled) setUncontrolledOpen(nextOpen)
      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange],
  )

  const pressContext = React.useMemo(
    () => ({
      clearPressCloseSuppression,
      suppressPressClose,
    }),
    [clearPressCloseSuppression, suppressPressClose],
  )

  return (
    <TooltipPressContext.Provider value={pressContext}>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        open={open}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </TooltipPressContext.Provider>
  )
}

type TooltipTriggerProps = React.ComponentProps<typeof TooltipPrimitive.Trigger> & {
  /**
   * Keep the tooltip visible when the trigger is pressed.
   *
   * Useful for copy buttons where the tooltip content changes from "Copy" to
   * "Copied" after activation.
   */
  keepOpenOnPress?: boolean
}

function TooltipTrigger({
  ref,
  keepOpenOnPress = false,
  onClick,
  onBlur,
  onPointerDown,
  onPointerLeave,
  ...props
}: TooltipTriggerProps) {
  // Anchor the tooltip to the trigger's resting box so a Button press scale
  // can't drag the open tooltip around.
  const restingRectRef = useUntransformedRect<HTMLButtonElement>()
  const pressContext = React.useContext(TooltipPressContext)
  return (
    <TooltipPrimitive.Trigger
      ref={composeRefs(ref, restingRectRef)}
      data-slot="tooltip-trigger"
      onBlur={(event) => {
        onBlur?.(event)
        if (keepOpenOnPress) pressContext?.clearPressCloseSuppression()
      }}
      onClick={(event) => {
        onClick?.(event)
        if (keepOpenOnPress) pressContext?.suppressPressClose()
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (keepOpenOnPress) pressContext?.suppressPressClose()
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        if (keepOpenOnPress) pressContext?.clearPressCloseSuppression()
      }}
      {...props}
    />
  )
}

function TooltipContent({
  className,
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-tooltip bg-tl-gray-600/85 px-2 py-1.25 text-xs text-balance text-surface-body backdrop-blur-[1px] data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[state=delayed-open]:data-[side=bottom]:slide-in-from-top-2 data-[state=delayed-open]:data-[side=left]:slide-in-from-right-2 data-[state=delayed-open]:data-[side=right]:slide-in-from-left-2 data-[state=delayed-open]:data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          className,
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
