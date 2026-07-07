import { useCallback, useEffect, useRef, useState } from "react"
import type HlsType from "hls.js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@twelvelabs-io/react"
import { fmtTime } from "../lib/econ"
import { useApp } from "../state"
import type { Video } from "../lib/types"

// Lazy-load hls.js (~150 KB) only when a broadcast actually needs MSE playback,
// keeping it out of the initial bundle.
let _hlsPromise: Promise<typeof import("hls.js")["default"]> | null = null
function loadHls() {
  if (!_hlsPromise) _hlsPromise = import("hls.js").then((m) => m.default)
  return _hlsPromise
}

/**
 * Sticky broadcast player. Owns the <video> element + hls.js instance and
 * exposes a seek/loadAsset handle via the app's playerRef so any panel can
 * jump the player to a moment. Hidden until the store has a ready video.
 */
export function Player() {
  const { readyVideos, playerRef } = useApp()
  const videoEl = useRef<HTMLVideoElement | null>(null)
  const hls = useRef<HlsType | null>(null)
  const [currentAsset, setCurrentAsset] = useState<string | null>(null)
  const [caption, setCaption] = useState("")

  const resolveAssetByFilename = useCallback(
    (filename?: string): string | null => {
      if (!filename) return null
      const exact = readyVideos.find((v) => v.video_filename === filename)
      if (exact) return exact.asset_id
      const fn = filename.toLowerCase()
      const fuzzy = readyVideos.find(
        (v) =>
          (v.video_filename || "").toLowerCase().includes(fn) ||
          fn.includes((v.video_filename || "").toLowerCase()),
      )
      return fuzzy ? fuzzy.asset_id : null
    },
    [readyVideos],
  )

  const loadAsset = useCallback(
    (assetId: string, then?: () => void) => {
      const v = videoEl.current
      const entry = readyVideos.find((x) => x.asset_id === assetId)
      if (!v || !entry) return
      if (currentAsset === assetId && (v.src || v.currentSrc)) {
        then?.()
        return
      }
      setCurrentAsset(assetId)

      if (then) {
        const onReady = () => {
          v.removeEventListener("loadedmetadata", onReady)
          then()
        }
        v.addEventListener("loadedmetadata", onReady)
      }

      if (hls.current) {
        hls.current.destroy()
        hls.current = null
      }

      if (entry.hls_url) {
        const url = entry.hls_url
        if (v.canPlayType("application/vnd.apple.mpegurl")) {
          v.src = url // native HLS (Safari/iOS) — no hls.js needed
        } else {
          loadHls().then((Hls) => {
            // Guard against a newer source having been requested meanwhile.
            if (videoEl.current !== v) return
            if (Hls.isSupported()) {
              const h = new Hls()
              h.loadSource(url)
              h.attachMedia(v)
              hls.current = h
            } else {
              v.src = url
            }
          })
        }
      } else {
        setCaption("no preview stream available yet for this video")
      }
    },
    [readyVideos, currentAsset],
  )

  const seekTo = useCallback(
    (sec: number, videoFilename?: string) => {
      const v = videoEl.current
      if (!v) return
      const targetAsset = videoFilename ? resolveAssetByFilename(videoFilename) : currentAsset
      const doSeek = () => {
        v.currentTime = Math.max(0, Number(sec) || 0)
        v.play()?.catch(() => {})
        setCaption(`seeked → ${fmtTime(sec)}${videoFilename ? " · " + videoFilename : ""}`)
        document.getElementById("player-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      if (targetAsset && targetAsset !== currentAsset) loadAsset(targetAsset, doSeek)
      else if (v.src || v.currentSrc) doSeek()
    },
    [resolveAssetByFilename, currentAsset, loadAsset],
  )

  // Play an arbitrary MP4 (a highlight reel) directly in the sticky player,
  // bypassing the HLS/roster path. currentAsset is cleared so the reel isn't
  // mistaken for a roster broadcast; seeking a moment afterwards reloads its HLS.
  const playUrl = useCallback((url: string, label?: string) => {
    const v = videoEl.current
    if (!v) return
    if (hls.current) {
      hls.current.destroy()
      hls.current = null
    }
    setCurrentAsset(null)
    v.src = url
    v.load()
    v.play()?.catch(() => {})
    setCaption(label ? `▶ ${label}` : "▶ highlight reel")
    document.getElementById("player-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  // Register the imperative handle for panels.
  useEffect(() => {
    playerRef.current = { seekTo, loadAsset: (id) => loadAsset(id), playUrl }
  }, [playerRef, seekTo, loadAsset, playUrl])

  // Keep a valid asset loaded as the roster changes.
  useEffect(() => {
    if (readyVideos.length === 0) {
      if (hls.current) {
        hls.current.destroy()
        hls.current = null
      }
      const v = videoEl.current
      if (v) {
        v.removeAttribute("src")
        v.load()
      }
      setCurrentAsset(null)
      return
    }
    if (!currentAsset || !readyVideos.find((v) => v.asset_id === currentAsset)) {
      loadAsset(readyVideos[readyVideos.length - 1].asset_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyVideos])

  useEffect(() => {
    return () => {
      hls.current?.destroy()
    }
  }, [])

  if (readyVideos.length === 0) return null

  return (
    <section
      id="player-section"
      className="rounded-dialog border border-border-secondary bg-surface-white/95 p-4 backdrop-blur"
    >
      {readyVideos.length > 1 && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-foreground-subtle">Playing</span>
          <Select value={currentAsset ?? undefined} onValueChange={(v) => loadAsset(v)}>
            <SelectTrigger size="small" className="min-w-[16rem]">
              <SelectValue placeholder="Select a broadcast" />
            </SelectTrigger>
            <SelectContent>
              {readyVideos.map((v: Video) => (
                <SelectItem key={v.asset_id} value={v.asset_id}>
                  {v.video_filename || v.asset_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <video
        ref={videoEl}
        controls
        preload="metadata"
        playsInline
        className="max-h-[42vh] w-full rounded-tlds-3 bg-black"
      />
      <div className="mt-1 font-tl-mono text-xs text-foreground-subtle">{caption}</div>
    </section>
  )
}
