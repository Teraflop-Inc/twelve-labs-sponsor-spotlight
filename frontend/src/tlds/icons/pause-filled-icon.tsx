import * as React from "react"

import { cn } from "@/lib/utils"

function PauseFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M4.2 2.5C3.53726 2.5 3 3.03726 3 3.7V12.3C3 12.9627 3.53726 13.5 4.2 13.5H5.8C6.46274 13.5 7 12.9627 7 12.3V3.7C7 3.03726 6.46274 2.5 5.8 2.5H4.2Z" />
      <path d="M10.2 2.5C9.53726 2.5 9 3.03726 9 3.7V12.3C9 12.9627 9.53726 13.5 10.2 13.5H11.8C12.4627 13.5 13 12.9627 13 12.3V3.7C13 3.03726 12.4627 2.5 11.8 2.5H10.2Z" />
    </svg>
  )
}

export { PauseFilledIcon }
