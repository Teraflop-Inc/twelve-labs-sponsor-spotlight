import * as React from "react"

import { cn } from "@/lib/utils"

function GridFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(2 2)">
        <path
          d="M4 7C4.55228 7 5 7.44772 5 8V11C5 11.5523 4.55228 12 4 12H1C0.447715 12 8.05325e-09 11.5523 0 11V8C0 7.44772 0.447715 7 1 7H4Z"
          fill="currentColor"
        />
        <path
          d="M11 7C11.5523 7 12 7.44772 12 8V11C12 11.5523 11.5523 12 11 12H8C7.44772 12 7 11.5523 7 11V8C7 7.44772 7.44772 7 8 7H11Z"
          fill="currentColor"
        />
        <path
          d="M4 0C4.55228 0 5 0.447715 5 1V4C5 4.55228 4.55228 5 4 5H1C0.447715 5 8.05325e-09 4.55228 0 4V1C0 0.447715 0.447715 8.05319e-09 1 0H4Z"
          fill="currentColor"
        />
        <path
          d="M11 0C11.5523 0 12 0.447715 12 1V4C12 4.55228 11.5523 5 11 5H8C7.44772 5 7 4.55228 7 4V1C7 0.447715 7.44772 8.05319e-09 8 0H11Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { GridFilledIcon }
