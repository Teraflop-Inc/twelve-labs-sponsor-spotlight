import * as React from "react"

import { cn } from "@/lib/utils"

function PlayFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M5.0376 2.66478C4.38635 2.24174 3.5 2.68227 3.5 3.42898V12.571C3.5 13.3177 4.38635 13.7583 5.0376 13.3352L12.0745 8.7642C12.6418 8.39571 12.6418 7.60429 12.0745 7.2358L5.0376 2.66478Z" />
    </svg>
  )
}

export { PlayFilledIcon }
