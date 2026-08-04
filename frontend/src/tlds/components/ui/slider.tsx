"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

// Rubber-band feel when dragging past a limit: the thumb gives a little (damped,
// asymptoting to RUBBER px) and stretches along the drag axis like real elastic,
// then springs back to the edge with a slight bounce.
const RUBBER = 8
const STRETCH = 0.13 // max extra length along the drag axis (fraction)
// How much the track thins (across its thickness) as the thumb is dragged past a
// limit — it gets pulled taut like a line being drawn thin by the thumb, then
// springs back with the overshoot on release. Asymptotes to this fraction.
const TRACK_THIN = 0.5
// How far the track itself is dragged along behind the thumb past a limit, as a
// fraction of the thumb's rubber-band overshoot — the whole line gives a little,
// so it reads as one elastic piece rather than a thumb sliding over a fixed bar.
const TRACK_FOLLOW = 0.45
const BOUNCE_MS = 260
const BOUNCE_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)"
// The thumb's resting transitions (must match the className): kept alongside the
// spring-back so the press scale / hover radius / focus ring still animate while a
// drag is springing back, instead of snapping.
const SETTLE_TRANSITION =
  "scale 150ms ease-out, background-color 150ms ease-out, backdrop-filter 150ms ease-out, box-shadow 150ms ease-out, border-radius 150ms ease-out"

// Position glide when the value steps without a live drag (keyboard, controlled
// change, or a track tap). Disabled mid-drag so the thumb tracks the pointer
// directly and the glue math reads true, untransitioned positions.
const STEP_MS = 150
const STEP_EASE = "cubic-bezier(0.32, 0.72, 0, 1)"
const STEP_TRANSITION = (["left", "right", "top", "bottom"] as const)
  .map((edge) => `${edge} ${STEP_MS}ms ${STEP_EASE}`)
  .join(", ")

// Diminishing-returns curve, 0 → asymptotes to 1 as the overshoot grows.
function resist(excess: number) {
  return 1 - 1 / (excess / RUBBER + 1)
}

// Proximity snap. The thumb follows the pointer but is magnetically pulled onto
// the nearest step: `magnetize` maps the raw pointer position to a position that
// sticks to a step when near it (slope 0 → snapped) and eases to following the
// pointer at the midpoint between steps (slope 1, continuous with the next step's
// zone). The curve is 2x³ − x⁵ on the normalized distance to the nearest step —
// gentle enough that the thumb still tracks the pointer, firming up only near a
// step. Raise the exponents for a stickier magnet, lower for looser.
function magnetize(raw: number, lower: number, stepPx: number, stepCount: number) {
  if (stepPx <= 0) return raw
  const nearest = Math.min(stepCount, Math.max(0, Math.round((raw - lower) / stepPx)))
  const stepPos = lower + nearest * stepPx
  const half = stepPx / 2
  const x = Math.max(-1, Math.min(1, (raw - stepPos) / half))
  return stepPos + half * (2 * x ** 3 - x ** 5)
}

// Per-step tick marks. The one nearest the cursor grows along the track on hover
// to preview where a click would land. Skipped past MAX_TICKS to avoid a wall of
// overlapping marks (and the perf cost) when the step is very fine.
const TICK = 6 // px — resting size of a tick (6×6, matches the design)
const TICK_ACTIVE = 16 // px — length the hovered tick grows to
// Half the thumb's length along the travel axis (w-7 / h-7 = 28px). Radix insets
// the thumb by this much at the extremes (so it sits flush inside the track), so
// the ticks are laid out over that same inset range to stay centered under it.
const THUMB_HALF = 14

// Track input modality so the focus ring shows only for keyboard focus. Radix
// programmatically focuses the thumb on click / value change, which can wrongly
// trip native :focus-visible — so we drive the ring ourselves from this flag.
let lastInputKeyboard = false
let modalityBound = false
function trackInputModality() {
  if (modalityBound || typeof document === "undefined") return
  modalityBound = true
  document.addEventListener("keydown", () => (lastInputKeyboard = true), true)
  document.addEventListener("pointerdown", () => (lastInputKeyboard = false), true)
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  step = 1,
  orientation = "horizontal",
  onValueChange,
  translucentOnPress = false,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  /** When pressed, the thumb turns translucent with a slight backdrop blur so the
   * track underneath shows through. Off by default (solid thumb). */
  translucentOnPress?: boolean
}) {
  const rootRef = React.useRef<HTMLSpanElement>(null)
  const isVertical = orientation === "vertical"

  // Force a re-render on every value change (even when uncontrolled) so each
  // thumb's layout effect re-glues its translate in the *same commit* as Radix's
  // step move — otherwise the thumb can flash a step ahead for a frame.
  const [, bumpTick] = React.useState(0)
  const handleValueChange = React.useCallback(
    (next: number[]) => {
      bumpTick((t) => t + 1)
      onValueChange?.(next)
    },
    [onValueChange],
  )

  // Number of step boundaries (ticks = stepCount + 1, indexed 0…stepCount).
  const stepCount = React.useMemo(() => {
    if (!(step > 0) || max <= min) return 0
    return Math.floor((max - min) / step)
  }, [min, max, step])

  // Index of the tick the cursor is hovering (the step a click would snap to).
  const [hovered, setHovered] = React.useState<number | null>(null)

  // Measure the track so we can render inner ticks only when their spacing exceeds
  // the thumb width (else they'd crowd). The min/max ticks always render.
  const trackRef = React.useRef<HTMLSpanElement>(null)
  const [trackPx, setTrackPx] = React.useState(0)
  React.useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () => {
      const rect = track.getBoundingClientRect()
      setTrackPx(isVertical ? rect.height : rect.width)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    return () => observer.disconnect()
  }, [isVertical])

  const showInnerTicks =
    stepCount > 1 && trackPx > 0 && (trackPx - 2 * THUMB_HALF) / stepCount > 2 * THUMB_HALF

  const tickIndices = React.useMemo(() => {
    if (stepCount < 1) return []
    if (!showInnerTicks) return [0, stepCount]
    return Array.from({ length: stepCount + 1 }, (_, i) => i)
  }, [stepCount, showInnerTicks])

  const _values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max],
  )

  // Animate the thumb between steps for value changes that aren't a live drag
  // (keyboard, controlled change, track tap) by transitioning the position on
  // Radix's thumb wrapper. Turned off for an actual drag, where the thumb tracks
  // the pointer via translate instead. Also previews, on hover, the step a click
  // would land on.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const setTransition = (transition: string) => {
      root.querySelectorAll<HTMLElement>('[data-slot="slider-thumb"]').forEach((thumb) => {
        if (thumb.parentElement) thumb.parentElement.style.transition = transition
      })
    }
    const enable = () => setTransition(STEP_TRANSITION)
    const disable = () => setTransition("none")
    // Start with the position transition off so the thumb appears at its initial
    // value instead of sliding into place on load — Radix nudges the position
    // once it has measured the thumb, and an enabled transition would animate
    // that nudge. Re-enable after two frames, when layout has settled, so
    // keyboard moves, track taps, and controlled value changes still glide.
    disable()
    let settleRaf = requestAnimationFrame(() => {
      settleRaf = requestAnimationFrame(enable)
    })

    const DRAG_THRESHOLD = 4
    let startX = 0
    let startY = 0
    let down = false
    let dragging = false

    // Which step the cursor is nearest to. Mapped over the thumb's *inset* travel
    // range (matching the ticks and the drag snap) so every tick's hover catchment
    // is centered on it — otherwise the highlight is biased off-center toward the
    // track ends.
    const stepIndexAt = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      const span = (isVertical ? rect.height : rect.width) - 2 * THUMB_HALF
      if (span <= 0) return null
      const pos = (isVertical ? event.clientY - rect.top : event.clientX - rect.left) - THUMB_HALF
      const ratio = Math.min(1, Math.max(0, pos / span))
      // Vertical sliders run bottom→top, so the top edge is the max.
      return Math.round((isVertical ? 1 - ratio : ratio) * stepCount)
    }

    // While a track press is active, map Radix's value over the thumb's inset
    // travel range (not the full width) so a click lands on the same step the hover
    // preview highlighted. (Thumb drags get their own patch in SliderThumb.)
    let restoreTrackRect: (() => void) | null = null
    const patchTrackRect = () => {
      const getRect = root.getBoundingClientRect.bind(root)
      root.getBoundingClientRect = () => {
        const r = getRect()
        return new DOMRect(
          isVertical ? r.x : r.x + THUMB_HALF,
          isVertical ? r.y + THUMB_HALF : r.y,
          isVertical ? r.width : r.width - 2 * THUMB_HALF,
          isVertical ? r.height - 2 * THUMB_HALF : r.height,
        )
      }
      restoreTrackRect = () => {
        delete (root as Partial<Pick<HTMLSpanElement, "getBoundingClientRect">>)
          .getBoundingClientRect
        restoreTrackRect = null
      }
    }

    const onDown = (event: PointerEvent) => {
      down = true
      dragging = false
      startX = event.clientX
      startY = event.clientY
      setHovered(null)
      // Grabbing the thumb is always a drag → instant. A track press keeps the
      // transition so the jump-to-position animates, and gets the inset value map.
      if (event.target instanceof Element && event.target.closest('[data-slot="slider-thumb"]')) {
        dragging = true
        disable()
      } else {
        patchTrackRect()
      }
    }
    const onMove = (event: PointerEvent) => {
      if (down) {
        if (
          !dragging &&
          (Math.abs(event.clientX - startX) > DRAG_THRESHOLD ||
            Math.abs(event.clientY - startY) > DRAG_THRESHOLD)
        ) {
          dragging = true
          disable()
        }
        return
      }
      // Hovering (no button down): preview the step a click would land on.
      if (stepCount > 0) {
        const idx = stepIndexAt(event)
        setHovered((prev) => (prev === idx ? prev : idx))
      }
    }
    const onUp = () => {
      down = false
      dragging = false
      enable()
      restoreTrackRect?.()
    }
    const onLeave = () => setHovered(null)

    root.addEventListener("pointerdown", onDown)
    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerup", onUp)
    root.addEventListener("pointercancel", onUp)
    root.addEventListener("lostpointercapture", onUp)
    root.addEventListener("pointerleave", onLeave)
    return () => {
      cancelAnimationFrame(settleRaf)
      restoreTrackRect?.()
      root.removeEventListener("pointerdown", onDown)
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerup", onUp)
      root.removeEventListener("pointercancel", onUp)
      root.removeEventListener("lostpointercapture", onUp)
      root.removeEventListener("pointerleave", onLeave)
    }
  }, [_values.length, min, max, step, isVertical, stepCount])

  return (
    <SliderPrimitive.Root
      ref={rootRef}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      step={step}
      orientation={orientation}
      onValueChange={handleValueChange}
      className={cn(
        // Cross-axis padding enlarges the pointer hit box (thumbs are abs-positioned,
        // so otherwise the only in-flow child is the thin track). The track and thumb
        // stay centered, so the visual design is unchanged.
        "relative flex w-full touch-none items-center select-none data-[orientation=horizontal]:py-2 data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col data-[orientation=vertical]:px-2",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        ref={trackRef}
        data-slot="slider-track"
        className={cn(
          "relative grow overflow-hidden rounded-[1.2px] bg-tl-gray-300 data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute bg-transparent data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
          )}
        />
        {tickIndices.map((index) => {
          const isMin = index === 0
          const isMax = index === stepCount
          const isEnd = isMin || isMax
          const pct = (index / stepCount) * 100
          const active = hovered === index
          const length = active ? TICK_ACTIVE : TICK
          // Inner ticks sit at the thumb's center for their step (the inset offset
          // matches Radix's thumbInBoundsOffset); min/max are flush at the ends.
          const offset = THUMB_HALF * (1 - pct / 50)
          const place = isVertical
            ? isMin
              ? { bottom: 0 }
              : isMax
                ? { top: 0 }
                : { bottom: `calc(${pct}% + ${offset}px)` }
            : isMin
              ? { left: 0 }
              : isMax
                ? { right: 0 }
                : { left: `calc(${pct}% + ${offset}px)` }
          const style: React.CSSProperties = isVertical
            ? { height: length, ...place }
            : { width: length, ...place }
          return (
            <span
              key={index}
              data-slot="slider-tick"
              data-active={active || undefined}
              style={style}
              className={cn(
                "pointer-events-none absolute rounded-[1.2px] bg-tl-gray-500 duration-200 ease-out",
                isVertical
                  ? "left-1/2 w-1.5 -translate-x-1/2 transition-[height]"
                  : "top-1/2 h-1.5 -translate-y-1/2 transition-[width]",
                // Center inner ticks on their step; ends grow inward from flush.
                !isEnd && (isVertical ? "translate-y-1/2" : "-translate-x-1/2"),
              )}
            />
          )
        })}
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderThumb
          key={index}
          rootRef={rootRef}
          stepCount={stepCount}
          translucentOnPress={translucentOnPress}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

/**
 * Radix derives the value from the cursor's absolute position and parks the
 * thumb's center on the nearest step. With a wide thumb that means grabbing
 * off-center makes the value jump, and the thumb can't move between steps.
 *
 * On drag we:
 *   1. Shift the slider root's reported rect by the grab offset, so Radix selects
 *      the step under the *grabbed point* (no value jump when you grab off-center).
 *   2. Slide the inner thumb (via the standalone `translate` property, kept out of
 *      the transition for instant tracking) to a *magnetized* position: it follows
 *      the pointer but is pulled onto a step when near one (see `magnetize`). Past
 *      a limit it instead rubber-bands and stretches, then springs back on release.
 *
 * `translate`/`transform` are kept separate from `scale` so the (instant) tracking
 * never collides with the (animated) haptic press squish.
 */
function SliderThumb({
  rootRef,
  stepCount,
  translucentOnPress,
}: {
  rootRef: React.RefObject<HTMLSpanElement | null>
  stepCount: number
  translucentOnPress: boolean
}) {
  const thumbRef = React.useRef<HTMLSpanElement>(null)
  const dragRef = React.useRef<{
    offset: number
    vertical: boolean
    client: number
    lower: number
    upper: number
    stepPx: number
  } | null>(null)

  // Show the focus ring only when focus arrived via keyboard, not after a click.
  const [keyboardFocus, setKeyboardFocus] = React.useState(false)
  React.useEffect(trackInputModality, [])

  // Press state drives the grow + translucent effects. Driven by pointer events
  // rather than CSS :active, which doesn't fire reliably on touch.
  const [pressed, setPressed] = React.useState(false)

  const applyShift = React.useCallback(() => {
    const drag = dragRef.current
    const thumb = thumbRef.current
    const wrapper = thumb?.parentElement
    if (!drag || !thumb || !wrapper) return
    const rect = wrapper.getBoundingClientRect()
    const stepCenter = drag.vertical ? rect.top + rect.height / 2 : rect.left + rect.width / 2
    const raw = drag.client - drag.offset

    // How far (and which way) the cursor is past a limit.
    const over = raw < drag.lower ? raw - drag.lower : raw > drag.upper ? raw - drag.upper : 0
    const past = Math.abs(over)

    // Within range: follow the pointer, magnetized to the nearest step. Past a
    // limit: damped rubber-band overshoot.
    const target =
      past > 0
        ? (over < 0 ? drag.lower : drag.upper) + Math.sign(over) * RUBBER * resist(past)
        : magnetize(raw, drag.lower, drag.stepPx, stepCount)
    const shift = target - stepCenter
    thumb.style.translate = drag.vertical ? `0 ${shift}px` : `${shift}px 0`

    // Elastic stretch along the drag axis, anchored on the track side so the thumb
    // visibly elongates toward the cursor (and thins slightly across, like rubber).
    // The track thins across its thickness in step, as if the thumb is drawing the
    // line taut as it pulls past the edge.
    const track = rootRef.current?.querySelector<HTMLElement>('[data-slot="slider-track"]')
    if (past > 0) {
      const stretch = STRETCH * resist(past)
      const grow = 1 + stretch
      const thin = 1 - stretch * 0.5
      if (drag.vertical) {
        thumb.style.transformOrigin = over > 0 ? "center top" : "center bottom"
        thumb.style.transform = `scaleX(${thin}) scaleY(${grow})`
      } else {
        thumb.style.transformOrigin = over > 0 ? "left center" : "right center"
        thumb.style.transform = `scaleX(${grow}) scaleY(${thin})`
      }
      if (track) {
        const trackThin = 1 - TRACK_THIN * resist(past)
        // The track drags a little way along behind the thumb, in the overshoot
        // direction, so the whole line reads as one elastic piece being pulled.
        const trackShift = Math.sign(over) * RUBBER * resist(past) * TRACK_FOLLOW
        track.style.transform = drag.vertical
          ? `translateY(${trackShift}px) scaleX(${trackThin})`
          : `translateX(${trackShift}px) scaleY(${trackThin})`
      }
    } else {
      thumb.style.transform = ""
      if (track) track.style.transform = ""
    }
  }, [rootRef, stepCount])

  // Radix moves the wrapper to the new step on every value change; the Slider root
  // forces this component to re-render alongside it, so this layout effect re-glues
  // the translate in the *same commit*, before paint — no step-flash.
  React.useLayoutEffect(() => {
    applyShift()
  })

  const stopDrag = React.useCallback(() => {
    setPressed(false)
    const root = rootRef.current
    if (root && dragRef.current) {
      delete (root as Partial<Pick<HTMLSpanElement, "getBoundingClientRect">>).getBoundingClientRect
    }
    dragRef.current = null
    const thumb = thumbRef.current
    if (thumb) {
      // Spring the overshoot and the elastic stretch back to rest with a slight
      // bounce. The transition is added just for this and cleared after, so drag
      // tracking stays instant.
      thumb.style.transition = `translate ${BOUNCE_MS}ms ${BOUNCE_EASE}, transform ${BOUNCE_MS}ms ${BOUNCE_EASE}, ${SETTLE_TRANSITION}`
      thumb.style.translate = "0px 0px"
      thumb.style.transform = ""
      window.setTimeout(() => {
        thumb.style.transition = ""
        thumb.style.translate = ""
        thumb.style.transformOrigin = ""
      }, BOUNCE_MS)
    }
    // Let the thinned track fill back out with the same bounce.
    const track = root?.querySelector<HTMLElement>('[data-slot="slider-track"]')
    if (track) {
      track.style.transition = `transform ${BOUNCE_MS}ms ${BOUNCE_EASE}`
      track.style.transform = ""
      window.setTimeout(() => {
        track.style.transition = ""
      }, BOUNCE_MS)
    }
  }, [rootRef])

  // Safety net: revert if the thumb unmounts mid-drag.
  React.useEffect(() => stopDrag, [stopDrag])

  const handlePointerDown = (event: React.PointerEvent<HTMLSpanElement>) => {
    const root = rootRef.current
    const thumb = thumbRef.current
    if (!root || !thumb) return

    setPressed(true)
    // Cancel any in-flight spring-back so this grab tracks instantly.
    thumb.style.transition = ""
    root
      .querySelector<HTMLElement>('[data-slot="slider-track"]')
      ?.style.removeProperty("transition")

    const vertical = root.getAttribute("data-orientation") === "vertical"
    const rect = thumb.getBoundingClientRect()
    const client = vertical ? event.clientY : event.clientX
    const offset = client - (vertical ? rect.top + rect.height / 2 : rect.left + rect.width / 2)

    // Travel range of the thumb's center, from the *unpatched* root rect. Radix
    // insets the thumb by half its size at the extremes, so these match where it
    // parks the thumb at min and max. The per-step pixel pitch falls out of it.
    const half = (vertical ? rect.height : rect.width) / 2
    const bounds = root.getBoundingClientRect()
    const lower = (vertical ? bounds.top : bounds.left) + half
    const upper = (vertical ? bounds.bottom : bounds.right) - half
    const stepPx = stepCount > 0 ? (upper - lower) / stepCount : 0

    // Patch the rect Radix reads so its value derives from (a) the grabbed point,
    // not the thumb center, and (b) the thumb's *inset* travel range, not the full
    // track width. Without (b) Radix's step boundaries are mapped over the full
    // width while the thumb snaps over the inset range, so the selected step drifts
    // off the visual snap as you move away from center (the left/right bias).
    const getRect = root.getBoundingClientRect.bind(root)
    root.getBoundingClientRect = () => {
      const r = getRect()
      return new DOMRect(
        vertical ? r.x : r.x + half + offset,
        vertical ? r.y + half + offset : r.y,
        vertical ? r.width : r.width - 2 * half,
        vertical ? r.height - 2 * half : r.height,
      )
    }

    dragRef.current = { offset, vertical, client, lower, upper, stepPx }
    applyShift()
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLSpanElement>) => {
    const drag = dragRef.current
    if (!drag) return
    drag.client = drag.vertical ? event.clientY : event.clientX
    // Glide immediately for moves within the current step (no value change → no
    // re-render). Step-crossing moves trigger a re-render whose layout effect
    // re-glues against the new wrapper position in the same commit.
    applyShift()
  }

  return (
    <SliderPrimitive.Thumb
      ref={thumbRef}
      data-slot="slider-thumb"
      data-focus-visible={keyboardFocus || undefined}
      data-pressed={pressed || undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      onLostPointerCapture={stopDrag}
      onFocus={() => setKeyboardFocus(lastInputKeyboard)}
      onBlur={() => setKeyboardFocus(false)}
      className={cn(
        "block h-4 w-7 shrink-0 cursor-default rounded-slider-thumb border border-border-secondary bg-surface-primary shadow-sm outline-none ring-misc-ring/50 [scale:var(--tl-thumb-scale,1)] transition-[scale,background-color,backdrop-filter,box-shadow,border-radius] duration-150 ease-out hover:rounded-slider-thumb-hover motion-safe:data-[pressed]:[--tl-thumb-scale:1.15] data-[focus-visible]:ring-2 data-[focus-visible]:ring-offset-2 data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[orientation=vertical]:h-7 data-[orientation=vertical]:w-4",
        // Opt-in: show the track through the thumb while pressed. The blur is kept
        // constant (hidden behind the opaque fill until pressed) so only the
        // background fades — transitioning backdrop-filter itself flickers on first
        // press as the browser promotes the backdrop layer.
        translucentOnPress && "backdrop-blur-[0.5px] data-[pressed]:bg-transparent",
      )}
    />
  )
}

export { Slider }
