import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { CloseIcon } from "@/icons"
import { cn } from "@/lib/utils"

// A removable image token: a thumbnail inset in a dark pill, followed by a
// close (X) button. The border and the surface share one color, so the dark
// frame around the image is simply the border (2px on md, 1px on sm).
const imageChipVariants = cva(
  "inline-flex shrink-0 items-center overflow-clip border-solid border-border-primary bg-surface-primary",
  {
    variants: {
      size: {
        // Only the right side is padded (for the X). The image radius below is
        // sized to nest concentrically inside the rounded container (outer − border).
        md: "h-10 gap-1 rounded-[8px] border-2 pr-1",
        sm: "h-6 gap-0.5 rounded-[4px] border pr-0.5",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  },
)

function ImageChip({
  className,
  size = "sm",
  src,
  alt = "",
  onRemove,
  removeLabel = "Remove",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof imageChipVariants> & {
    src: string
    alt?: string
    onRemove?: React.MouseEventHandler<HTMLButtonElement>
    removeLabel?: string
  }) {
  const isSmall = size === "sm"

  return (
    <div
      data-slot="image-chip"
      data-size={size}
      className={cn(imageChipVariants({ size }), className)}
      {...props}
    >
      <img
        src={src}
        alt={alt}
        className={cn(
          // `self-stretch` fills the height inside the border; the left radius
          // nests concentrically inside the container's rounded corner.
          "pointer-events-none shrink-0 self-stretch object-cover",
          isSmall ? "w-10.5 rounded-l-[3px]" : "w-16 rounded-l-[6px]",
        )}
      />
      <button
        type="button"
        aria-label={removeLabel}
        onClick={onRemove}
        className={cn(
          "grid shrink-0 cursor-default place-items-center text-foreground-primary outline-none transition-all duration-150 hover:text-foreground-primary/70 motion-safe:active:scale-90 focus-visible:ring-2 focus-visible:ring-foreground-primary/60",
          isSmall ? "size-3" : "size-4",
        )}
      >
        <CloseIcon className={isSmall ? "size-3" : "size-4"} />
      </button>
    </div>
  )
}

export { ImageChip, imageChipVariants }
