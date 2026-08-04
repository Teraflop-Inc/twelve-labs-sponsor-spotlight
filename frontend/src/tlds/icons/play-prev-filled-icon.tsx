import * as React from "react"

import { cn } from "@/lib/utils"

function PlayPrevFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M10.9624 2.66478C11.6137 2.24174 12.5 2.68227 12.5 3.42898V12.571C12.5 13.3177 11.6137 13.7583 10.9624 13.3352L4.5 9.13741V12.625C4.5 12.8321 4.33211 13 4.125 13H3.875C3.66789 13 3.5 12.8321 3.5 12.625V3.375C3.5 3.16789 3.66789 3 3.875 3H4.125C4.33211 3 4.5 3.16789 4.5 3.375V6.86259L10.9624 2.66478Z" />
    </svg>
  )
}

export { PlayPrevFilledIcon }
