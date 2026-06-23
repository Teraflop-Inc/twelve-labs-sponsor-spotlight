import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { SpinnerIcon } from "@/icons"
import { cn } from "@/lib/utils"

const spinnerVariants = cva("inline-flex shrink-0 items-center justify-center", {
  variants: {
    size: {
      xl: "size-12 p-3 [&_svg]:size-6",
      lg: "size-10 p-2.5 [&_svg]:size-5",
      md: "size-8 p-2 [&_svg]:size-4",
      regular: "size-7 p-1.5 [&_svg]:size-4",
      sm: "size-6 p-1 [&_svg]:size-4",
      mini: "size-5 p-1 [&_svg]:size-3",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

function Spinner({
  className,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof spinnerVariants>) {
  return (
    <div
      role="status"
      aria-label="Loading"
      data-slot="spinner"
      data-size={size}
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    >
      <SpinnerIcon className="animate-spin" />
    </div>
  )
}

export { Spinner, spinnerVariants }
