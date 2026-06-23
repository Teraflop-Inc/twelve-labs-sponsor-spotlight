import * as React from "react"

import { cn } from "@/lib/utils"

function SpinnerIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4V5C9.65685 5 11 6.34315 11 8C11 9.65685 9.65685 11 8 11V12Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14ZM8 13C10.7614 13 13 10.7614 13 8C13 5.23858 10.7614 3 8 3C5.23858 3 3 5.23858 3 8C3 10.7614 5.23858 13 8 13Z"
      />
    </svg>
  )
}

export { SpinnerIcon }
