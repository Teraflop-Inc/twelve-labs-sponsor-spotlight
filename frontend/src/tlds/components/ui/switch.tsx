"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

// Pointer movement required before we count the gesture as a drag (and the
// thumb starts to move). Avoids treating taps as drags.
const DRAG_THRESHOLD_PX = 5
// Damping ratio applied after the threshold. < 1 makes the thumb lag behind
// the pointer (resistance), so the user has to commit to the gesture.
const DRAG_RATIO = 0.4
const THUMB_VIEWBOX_SIZE = 20
const THUMB_RADIUS = 6

function interpolateDrag(dx: number) {
  const abs = Math.abs(dx)
  if (abs < DRAG_THRESHOLD_PX) return 0
  return Math.sign(dx) * (abs - DRAG_THRESHOLD_PX) * DRAG_RATIO
}

type SwitchSize = "sm" | "md" | "lg"

const SIZE_CONFIG: Record<
  SwitchSize,
  { trackW: number; trackH: number; thumb: number; inset: number; radius: number }
> = {
  sm: { trackW: 30, trackH: 16, thumb: 12, inset: 2, radius: 5 },
  md: { trackW: 34, trackH: 20, thumb: 16, inset: 2, radius: 6 },
  lg: { trackW: 44, trackH: 24, thumb: 20, inset: 2, radius: 8 },
}

function Switch({
  className,
  size = "md",
  checked: controlledChecked,
  defaultChecked,
  onCheckedChange,
  disabled,
  ...props
}: Omit<React.ComponentProps<typeof SwitchPrimitive.Root>, "children"> & {
  size?: SwitchSize
}) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultChecked ?? false)
  const isControlled = controlledChecked !== undefined
  const checked = isControlled ? controlledChecked : uncontrolled

  // Unique id so multiple <Switch> instances don't share the same <mask>.
  const maskId = React.useId()

  const config = SIZE_CONFIG[size]
  const restThumbWidth = config.thumb
  const expandedThumbWidth = Math.round(config.thumb * 1.25)
  const innerWidth = config.trackW - 2 * config.inset
  const restMaxTravel = innerWidth - restThumbWidth
  const expandedMaxTravel = innerWidth - expandedThumbWidth

  const [pressed, setPressed] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const [dragX, setDragX] = React.useState(0)

  const startXRef = React.useRef(0)
  const startCheckedRef = React.useRef(false)
  const draggedRef = React.useRef(false)
  const dragResetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  // Active-gesture flag as a ref so handlers don't read stale React state.
  const activeRef = React.useRef(false)

  const commitChecked = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolled(next)
      if (next !== checked) onCheckedChange?.(next)
    },
    [checked, isControlled, onCheckedChange],
  )

  const resetGesture = React.useCallback(() => {
    activeRef.current = false
    setPressed(false)
    setDragging(false)
    setDragX(0)
  }, [])

  const clearPendingDragReset = React.useCallback(() => {
    if (dragResetTimerRef.current === null) return
    clearTimeout(dragResetTimerRef.current)
    dragResetTimerRef.current = null
  }, [])

  const clearDraggedRefAfterTrailingClick = React.useCallback(() => {
    clearPendingDragReset()
    dragResetTimerRef.current = setTimeout(() => {
      draggedRef.current = false
      dragResetTimerRef.current = null
    }, 0)
  }, [clearPendingDragReset])

  React.useEffect(() => clearPendingDragReset, [clearPendingDragReset])

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || disabled) return
    clearPendingDragReset()
    startXRef.current = e.clientX
    startCheckedRef.current = checked
    draggedRef.current = false
    activeRef.current = true
    setPressed(true)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Some browsers may throw if capture can't be set; the gesture still
      // works because the element's own events keep firing.
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!activeRef.current) return
    const dx = e.clientX - startXRef.current
    if (!draggedRef.current && Math.abs(dx) > DRAG_THRESHOLD_PX) {
      draggedRef.current = true
      setDragging(true)
    }
    if (!draggedRef.current) return

    const effectiveDx = interpolateDrag(dx)
    setDragX(effectiveDx)

    // Live toggle: as soon as the thumb crosses the midpoint, commit the new
    // checked state — no need to wait for pointerup. Dragging back across the
    // midpoint flips it again.
    const startPos = startCheckedRef.current ? expandedMaxTravel : 0
    const newPos = Math.max(0, Math.min(expandedMaxTravel, startPos + effectiveDx))
    const wantsChecked = newPos > expandedMaxTravel / 2
    if (wantsChecked !== checked) commitChecked(wantsChecked)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!activeRef.current) return
    const wasDragged = draggedRef.current
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    // No final commit needed: pointermove already toggled live when the
    // midpoint was crossed.
    resetGesture()
    if (wasDragged) clearDraggedRefAfterTrailingClick()
  }

  // pointercancel fires when the OS interrupts the gesture (touch scroll,
  // alert, etc.); lostpointercapture is a final safety net if capture is
  // released for any reason. Both reset visual state without toggling.
  const handlePointerCancel = () => {
    if (!activeRef.current) return
    const wasDragged = draggedRef.current
    resetGesture()
    if (wasDragged) clearDraggedRefAfterTrailingClick()
  }

  const handleLostPointerCapture = () => {
    if (!activeRef.current) return
    const wasDragged = draggedRef.current
    resetGesture()
    if (wasDragged) clearDraggedRefAfterTrailingClick()
  }

  // Radix Switch fires onCheckedChange on click. After a drag, the trailing
  // click would re-toggle. Keep the drag flag through that click, then clear
  // it on the next task in case the browser doesn't emit a click/change.
  const handleRadixCheckedChange = (next: boolean) => {
    if (draggedRef.current) {
      clearPendingDragReset()
      draggedRef.current = false
      return
    }
    commitChecked(next)
  }

  // Compute thumb position
  let translateX: number
  if (dragging) {
    const startPos = startCheckedRef.current ? expandedMaxTravel : 0
    translateX = Math.max(0, Math.min(expandedMaxTravel, startPos + dragX))
  } else if (pressed) {
    translateX = checked ? expandedMaxTravel : 0
  } else {
    translateX = checked ? restMaxTravel : 0
  }

  const thumbWidth = pressed ? expandedThumbWidth : restThumbWidth
  const thumbRadius = (THUMB_RADIUS / THUMB_VIEWBOX_SIZE) * restThumbWidth

  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={handleRadixCheckedChange}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handleLostPointerCapture}
      data-slot="switch"
      data-size={size}
      data-pressed={pressed || undefined}
      data-dragging={dragging || undefined}
      className={cn(
        "relative inline-flex shrink-0 cursor-default touch-none items-center border border-foreground-subtle bg-transparent outline-none transition-colors duration-200 ease-out",
        "data-[state=checked]:border-foreground-body",
        "focus-visible:ring-2 focus-visible:ring-misc-ring/50 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={{
        width: config.trackW,
        height: config.trackH,
        borderRadius: config.radius,
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none absolute overflow-hidden text-foreground-subtle",
          "data-[state=checked]:text-foreground-body",
          dragging ? "" : "transition-[transform,width,color] duration-200 ease-out",
        )}
        style={{
          // Position is relative to the track's padding box (inside the 1px
          // border), so subtract the border width to get a symmetric inset
          // from the visible outer edge.
          left: config.inset - 1,
          top: config.inset - 1,
          height: restThumbWidth,
          width: thumbWidth,
          borderRadius: thumbRadius,
          transform: `translateX(${translateX}px)`,
        }}
      >
        {/* The thumb element owns the fixed corner radius; this SVG only fills
            it and cuts out the icon shapes so the radius doesn't stretch while
            the width expands. */}
        <SwitchThumbBackground
          checked={checked}
          maskId={maskId}
          pressed={pressed}
          dragging={dragging}
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}

// Checkmark and X paths in the SVG mask (0-20 viewBox). Black = hole.
const CHECKMARK_PATH =
  "M9.71191 13.5684C9.59695 13.7605 9.30062 13.7655 9.17871 13.5771L6.58301 9.55957L5 10.4414L7.5957 14.459C8.44863 15.7788 10.5211 15.7468 11.3262 14.4014L16.4443 5.84473L14.8311 5.0127L9.71191 13.5684Z"
const CROSS_PATH =
  "M5.08945 3.91082L10.0343 8.85566L14.9447 3.94519L16.1233 5.12371L11.2128 10.0342L16.0889 14.9103L14.9104 16.0888L10.0343 11.2127L5.12382 16.1231L3.94531 14.9446L8.85577 10.0342L3.91093 5.08933L5.08945 3.91082Z"

// Half of the total swap duration; one icon fades out in this window, the
// other fades in (with the same delay) so they don't overlap.
const ICON_FADE_MS = 100

// When the thumb expands (pressed/dragging), the outer SVG stretches by 1.25×
// in x because of preserveAspectRatio="none". scaleX(1/1.25) on the icon
// group exactly cancels that, so the marks render at their native aspect
// regardless of thumb width. (1/1.25 = 0.8 for every size.)
const ICON_COMPENSATE_SCALE_X = 1 / 1.25

function SwitchThumbBackground({
  checked,
  maskId,
  pressed,
  dragging,
}: {
  checked: boolean
  maskId: string
  pressed: boolean
  dragging: boolean
}) {
  // The outgoing icon fades to opacity 0 with no delay; the incoming icon
  // fades to opacity 1 after a delay equal to the fade-out duration. Setting
  // the delay based on the *target* state (checked) means whichever direction
  // we toggle, the new state's icon is the one that waits.
  const checkmarkStyle: React.CSSProperties = {
    opacity: checked ? 1 : 0,
    transition: `opacity ${ICON_FADE_MS}ms ease-out ${checked ? ICON_FADE_MS : 0}ms`,
  }
  const crossStyle: React.CSSProperties = {
    opacity: checked ? 0 : 1,
    transition: `opacity ${ICON_FADE_MS}ms ease-out ${checked ? 0 : ICON_FADE_MS}ms`,
  }
  const iconGroupStyle: React.CSSProperties = {
    transformOrigin: "10px 10px",
    transform: `scaleX(${pressed ? ICON_COMPENSATE_SCALE_X : 1})`,
    // Match the thumb's width transition so the compensation stays in sync
    // while the bg stretches; during drag both are disabled so they track
    // the pointer instantly.
    transition: dragging ? "none" : "transform 200ms ease-out",
  }
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${THUMB_VIEWBOX_SIZE} ${THUMB_VIEWBOX_SIZE}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          {/* White backdrop covers the entire (stretched) mask area. */}
          <rect width={THUMB_VIEWBOX_SIZE} height={THUMB_VIEWBOX_SIZE} fill="white" />
          {/* Icon group is counter-scaled in x to cancel the parent SVG's
              non-uniform stretching, so the checkmark / X marks render at
              their native 1:1 aspect ratio at all thumb widths. */}
          <g style={iconGroupStyle}>
            <path d={CHECKMARK_PATH} fill="black" style={checkmarkStyle} />
            <path d={CROSS_PATH} fill="black" style={crossStyle} />
          </g>
        </mask>
      </defs>
      <rect
        width={THUMB_VIEWBOX_SIZE}
        height={THUMB_VIEWBOX_SIZE}
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
    </svg>
  )
}

export { Switch }
