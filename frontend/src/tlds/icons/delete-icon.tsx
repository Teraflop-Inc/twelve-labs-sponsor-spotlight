import * as React from "react"

import { cn } from "@/lib/utils"

function DeleteIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(3 2)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3 2V1C3 0.447715 3.44772 0 4 0H6C6.55228 0 7 0.447715 7 1V2H10V3H9V10C9 11.1046 8.10457 12 7 12H3C1.89543 12 1 11.1046 1 10V3H0V2H3ZM4 1H6V2H4V1ZM2 3V10C2 10.5523 2.44772 11 3 11H7C7.55228 11 8 10.5523 8 10V3H2Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { DeleteIcon }
