import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { OrganizationIcon } from "@/icons"
import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center px-1 text-center text-sm leading-5 text-foreground-body uppercase select-none",
  {
    variants: {
      color: {
        peach: "bg-tl-master-brand-light-peach",
        pink: "bg-tl-search-light-purple",
        yellow: "bg-tl-analyze-light-orange",
        blue: "bg-tl-embed-light-blue",
        green: "bg-tl-embed-light-green",
        purple: "bg-tl-search-light-lavender",
      },
      size: {
        sm: "h-6 w-11 rounded-tlds-2",
        default: "h-7 w-11 rounded-tlds-2",
        lg: "h-11 w-20 rounded-tlds-3",
      },
    },
    defaultVariants: {
      color: "peach",
      size: "default",
    },
  },
)

type AvatarColor = NonNullable<VariantProps<typeof avatarVariants>["color"]>

function Avatar({
  className,
  color,
  size,
  organization = false,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof avatarVariants> & {
    /** Renders the organization badge in the bottom-right corner. */
    organization?: boolean
  }) {
  return (
    <div
      data-slot="avatar"
      data-size={size ?? "default"}
      className={cn(avatarVariants({ color, size }), className)}
      {...props}
    >
      {children}
      {organization && <AvatarBadge />}
    </div>
  )
}

function AvatarBadge({ className, children, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute -right-1 -bottom-1 inline-flex items-center justify-center rounded-tlds-1 bg-surface-body p-0.5 text-foreground-body [&_svg]:size-3",
        className,
      )}
      {...props}
    >
      {children ?? <OrganizationIcon />}
    </span>
  )
}

export { Avatar, AvatarBadge, avatarVariants }
export type { AvatarColor }
