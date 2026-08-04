import * as React from "react"

import { cn } from "@/lib/utils"

function PauseIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 3.7C3 3.03726 3.53726 2.5 4.2 2.5H5.8C6.46274 2.5 7 3.03726 7 3.7V12.3C7 12.9627 6.46274 13.5 5.8 13.5H4.2C3.53726 13.5 3 12.9627 3 12.3V3.7ZM4.2 3.5H5.8C5.91046 3.5 6 3.58954 6 3.7V12.3C6 12.4105 5.91046 12.5 5.8 12.5H4.2C4.08954 12.5 4 12.4105 4 12.3V3.7C4 3.58954 4.08954 3.5 4.2 3.5Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 3.7C9 3.03726 9.53726 2.5 10.2 2.5H11.8C12.4627 2.5 13 3.03726 13 3.7V12.3C13 12.9627 12.4627 13.5 11.8 13.5H10.2C9.53726 13.5 9 12.9627 9 12.3V3.7ZM10.2 3.5H11.8C11.9105 3.5 12 3.58954 12 3.7V12.3C12 12.4105 11.9105 12.5 11.8 12.5H10.2C10.0895 12.5 10 12.4105 10 12.3V3.7C10 3.58954 10.0895 3.5 10.2 3.5Z"
      />
    </svg>
  )
}

export { PauseIcon }
