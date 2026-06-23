"use client"

import * as React from "react"

// Patched at most once per node; entries are GC'd with their elements. Ref
// callbacks can re-run (e.g. an unmemoized composed ref), so guard re-patching.
const patched = new WeakSet<HTMLElement>()

/**
 * Callback ref for a floating-surface trigger whose own CSS transform — e.g.
 * Button's `:active` press scale — would otherwise drag the surface around.
 *
 * Radix anchors menus/popovers/etc. to the trigger via its
 * `getBoundingClientRect`, which reflects transforms, and re-positions on every
 * layout shift (a `layoutShift` IntersectionObserver in floating-ui's
 * `autoUpdate`). So when the trigger scales down on press, floating-ui follows
 * the shrinking box and the open surface visibly jiggles. We patch the
 * element's `getBoundingClientRect` to report its *resting* (untransformed)
 * layout box, so positioning is based on where the trigger sits at rest — the
 * observer still fires, but each re-position resolves to the same spot.
 *
 * `offsetWidth`/`offsetHeight` are the layout border-box size and ignore
 * transforms outright, so we take the size from them. (We can't use
 * `offsetLeft`/`offsetTop` for position — they're relative to the offsetParent,
 * not the viewport floating-ui positions in.) For position we reuse the live
 * center from `getBoundingClientRect`, which a center-origin scale — the press
 * haptic — leaves fixed, and rebuild the corners from that stable center.
 */
export function useUntransformedRect<T extends HTMLElement>(): React.RefCallback<T> {
  return React.useCallback((node: T | null) => {
    if (node == null || patched.has(node)) return
    patched.add(node)

    const native = node.getBoundingClientRect.bind(node)
    node.getBoundingClientRect = () => {
      const rect = native()
      const { offsetWidth: width, offsetHeight: height } = node
      return new DOMRect(
        rect.left + (rect.width - width) / 2,
        rect.top + (rect.height - height) / 2,
        width,
        height,
      )
    }
  }, [])
}
