"use client"

import * as React from "react"

// Tracks whether the most recent user input was the Tab key. Listeners are
// attached once and ref-counted across every trigger that opts in.
let lastInputWasTab = false
let subscribers = 0

function handleKeyDown(event: KeyboardEvent) {
  lastInputWasTab = event.key === "Tab"
}

function handlePointerDown() {
  lastInputWasTab = false
}

function subscribe() {
  if (subscribers++ === 0) {
    document.addEventListener("keydown", handleKeyDown, true)
    document.addEventListener("pointerdown", handlePointerDown, true)
  }
  return () => {
    if (--subscribers === 0) {
      document.removeEventListener("keydown", handleKeyDown, true)
      document.removeEventListener("pointerdown", handlePointerDown, true)
    }
  }
}

/**
 * Callback ref for a Menu/Select trigger that toggles a `data-no-focus-ring`
 * attribute so the focus ring only appears when focus arrives via the Tab key.
 *
 * Radix restores focus to the trigger when a dropdown closes (after a click or
 * Enter on an item). That programmatic focus keeps the browser's keyboard
 * modality, so `:focus-visible` matches and the trigger lights up even though
 * the user never tabbed to it — distracting. We keep focus on the trigger (for
 * accessibility) but suppress the ring for every focus except a genuine Tab.
 */
export function useTabOnlyFocusRing<T extends HTMLElement>(): React.RefCallback<T> {
  return React.useCallback((node: T | null) => {
    if (node == null) return
    const unsubscribe = subscribe()
    const handleFocus = () => {
      if (lastInputWasTab) node.removeAttribute("data-no-focus-ring")
      else node.setAttribute("data-no-focus-ring", "")
    }
    node.addEventListener("focus", handleFocus)
    return () => {
      node.removeEventListener("focus", handleFocus)
      unsubscribe()
    }
  }, [])
}

/** Merges multiple refs (callback or object) into one callback ref. */
export function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node)
      else if (ref != null) (ref as React.RefObject<T | null>).current = node
    }
  }
}
