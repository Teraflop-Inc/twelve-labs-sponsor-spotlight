import * as React from "react"

import { cn } from "@/lib/utils"

function PlusIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(3 3)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.525 5.5V10H5.525V5.5H10V4.5H5.525V0H4.525V4.5H0V5.5H4.525Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { PlusIcon }
