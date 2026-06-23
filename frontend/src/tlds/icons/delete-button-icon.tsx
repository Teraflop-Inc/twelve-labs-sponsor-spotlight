import * as React from "react"

import { cn } from "@/lib/utils"

function DeleteButtonIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
          opacity="0.7"
          d="M8 0C10.2091 0 12 1.79086 12 4V8C12 10.2091 10.2091 12 8 12H4C1.79086 12 6.44266e-08 10.2091 0 8V4C0 1.79086 1.79086 6.44256e-08 4 0H8ZM3.15234 3.86133L5.49023 6.19824L3.16602 8.52246L3.87305 9.22949L6.19727 6.90527L8.50781 9.21582L9.21484 8.50879L6.9043 6.19824L9.22754 3.875L8.52051 3.16797L6.19727 5.49121L3.85938 3.1543L3.15234 3.86133Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { DeleteButtonIcon }
