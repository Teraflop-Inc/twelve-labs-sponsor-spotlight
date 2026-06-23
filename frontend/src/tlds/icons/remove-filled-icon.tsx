import * as React from "react"

import { cn } from "@/lib/utils"

function RemoveFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(1 1)">
        <path
          d="M7 0C10.866 0 14 3.13401 14 7C14 10.866 10.866 14 7 14C3.13401 14 0 10.866 0 7C0 3.13401 3.13401 0 7 0ZM4.15234 4.86133L6.49023 7.19824L4.16602 9.52246L4.87305 10.2295L7.19727 7.90527L9.50781 10.2158L10.2148 9.50879L7.9043 7.19824L10.2275 4.875L9.52051 4.16797L7.19727 6.49121L4.85938 4.1543L4.15234 4.86133Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { RemoveFilledIcon }
