import * as React from "react"

import { cn } from "@/lib/utils"

function MenuIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(3 4.5008) scale(1 0.9998)">
        <path d="M10 7H0V6H10V7ZM10 4H0V3H10V4ZM10 1H0V0H10V1Z" fill="currentColor" />
      </g>
    </svg>
  )
}

export { MenuIcon }
