import * as React from "react"

import { cn } from "@/lib/utils"

function MinusIcon({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      data-slot="icon"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      <rect x="3" y="7.5" width="10" height="1" />
    </svg>
  )
}

export { MinusIcon }
