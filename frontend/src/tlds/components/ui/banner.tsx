"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import * as Slot from "@radix-ui/react-slot"

import { CloseIcon, CodeSnippetIcon, InfoIcon, PegasusIcon, WarningIcon } from "@/icons"
import { cn } from "@/lib/utils"

import { linkVariants } from "./link"

// Promotion / Pegasus variants use multi-stop gradients that don't map cleanly
// to a single token, so they're applied as inline background images.
// The gray fade sits on top (first layer) so it covers the left and reveals the
// colorful gradient underneath as it fades to transparent toward the right.
const PROMOTION_GRADIENT =
  "linear-gradient(90deg, #e9e8e7 28.81%, rgba(233, 232, 231, 0) 103.14%), linear-gradient(270deg, #f6afff -2.97%, #ffb592 4.37%, #fab920 11.2%, #84db1a 16.7%)"

const PEGASUS_GRADIENT =
  "linear-gradient(90deg, #f4f3f3 43.7%, #ffd3be 64.42%, #f6ae8a 79.52%, #f4a680 91.35%, #faba17 99.89%)"

const bannerVariants = cva(
  // Horizontal spacing between children is handled with explicit margins (the
  // gaps differ: icon→content 8px, content→actions 20px, →close 20px). gap-y-2
  // only governs the row gap when actions wrap to their own line ("below").
  "relative flex w-full flex-wrap items-center gap-y-2 text-sm leading-5 text-foreground-body",
  {
    variants: {
      variant: {
        info: "rounded-tlds-3 bg-surface-status-success px-3 py-2",
        warning: "rounded-tlds-3 bg-surface-status-warning px-3 py-2",
        // bg-clip-padding keeps the gradient inside the border so it doesn't
        // bleed a 1px saturated fringe through the translucent border at edges.
        promotion: "rounded-tlds-3 border border-black/10 bg-clip-padding px-3 py-2",
        pegasus: "rounded-tlds-4 border border-border-secondary bg-clip-padding px-4 py-3",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
)

const GRADIENTS: Partial<Record<NonNullable<BannerVariant>, string>> = {
  promotion: PROMOTION_GRADIENT,
  pegasus: PEGASUS_GRADIENT,
}

type BannerVariant = VariantProps<typeof bannerVariants>["variant"]

// Default leading icon per variant, rendered by <BannerIcon /> when no custom
// icon is passed as children.
const DEFAULT_ICONS: Record<NonNullable<BannerVariant>, React.ReactNode> = {
  info: <InfoIcon />,
  warning: <WarningIcon />,
  promotion: <CodeSnippetIcon />,
  pegasus: <PegasusIcon />,
}

const BannerContext = React.createContext<BannerVariant>("info")

function Banner({
  className,
  variant = "info",
  style,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof bannerVariants>) {
  const gradient = variant ? GRADIENTS[variant] : undefined

  return (
    <BannerContext.Provider value={variant}>
      <div
        data-slot="banner"
        data-variant={variant}
        role="status"
        className={cn(bannerVariants({ variant }), className)}
        style={gradient ? { backgroundImage: gradient, ...style } : style}
        {...props}
      />
    </BannerContext.Provider>
  )
}

const BANNER_ICON_ALIGN: Record<"start" | "center" | "end", string> = {
  start: "self-start",
  center: "self-center",
  end: "self-end",
}

function BannerIcon({
  className,
  align = "center",
  children,
  ...props
}: React.ComponentProps<"span"> & {
  align?: "start" | "center" | "end"
}) {
  const variant = React.useContext(BannerContext)
  // Fall back to the variant's default icon when none is provided.
  const icon = children ?? (variant ? DEFAULT_ICONS[variant] : null)

  return (
    <span
      data-slot="banner-icon"
      aria-hidden="true"
      className={cn(
        "peer mr-2 flex shrink-0 items-center justify-center [&_svg]:size-5",
        BANNER_ICON_ALIGN[align],
        className,
      )}
      {...props}
    >
      {icon}
    </span>
  )
}

function BannerContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="banner-content"
      className={cn("min-w-0 flex-1 [text-wrap:pretty]", className)}
      {...props}
    />
  )
}

function BannerTitle({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="banner-title" className={cn("font-semibold", className)} {...props} />
}

function BannerActions({
  className,
  position = "end",
  ...props
}: React.ComponentProps<"div"> & {
  position?: "end" | "below"
}) {
  return (
    <div
      data-slot="banner-actions"
      data-position={position}
      className={cn(
        // 8px between individual actions.
        "flex shrink-0 items-center gap-2",
        // "end": sits inline after the content with a 20px gap.
        position === "end" && "ml-5",
        // "below" forces the actions onto their own line beneath the content
        // (the root is flex-wrap, so a full-width basis wraps them down). The
        // peer-based padding indents them to line up with the content text
        // when an icon is present (icon width 20px + margin 8px = 28px = pl-7),
        // and stays flush left when there's no icon.
        position === "below" && "w-full basis-full peer-data-[slot=banner-icon]:pl-7",
        className,
      )}
      {...props}
    />
  )
}

function BannerAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "button"

  // Reuses the shared Link styling so banner actions match the Link component.
  return <Comp data-slot="banner-action" className={cn(linkVariants(), className)} {...props} />
}

function BannerClose({
  className,
  children,
  "aria-label": ariaLabel = "Dismiss",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="banner-close"
      aria-label={ariaLabel}
      className={cn(
        // 20px from whatever precedes it (the actions or the content).
        "ml-5 inline-flex shrink-0 cursor-default items-center justify-center rounded-tlds-1 text-current opacity-70 outline-none transition-[opacity,transform] hover:opacity-100 focus-visible:ring-2 focus-visible:ring-misc-ring/50 focus-visible:ring-offset-2 motion-safe:active:scale-[0.97] [&_svg]:size-4",
        className,
      )}
      {...props}
    >
      {children ?? <CloseIcon />}
    </button>
  )
}

export {
  Banner,
  BannerIcon,
  BannerContent,
  BannerTitle,
  BannerActions,
  BannerAction,
  BannerClose,
  bannerVariants,
}
export type { BannerVariant }
