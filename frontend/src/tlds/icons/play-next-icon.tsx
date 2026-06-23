import * as React from "react"

import { cn } from "@/lib/utils"

function PlayNextIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M5.0376 2.66478C4.38635 2.24174 3.5 2.68227 3.5 3.42898V12.571C3.5 13.3177 4.38635 13.7583 5.0376 13.3352L11.5 9.13741V12.625C11.5 12.8321 11.6679 13 11.875 13H12.125C12.3321 13 12.5 12.8321 12.5 12.625V3.375C12.5 3.16789 12.3321 3 12.125 3H11.875C11.6679 3 11.5 3.16789 11.5 3.375V6.86259L5.0376 2.66478ZM11.4166 8L4.53927 12.4673V3.53269L11.4166 8Z"
      />
    </svg>
  )
}

export { PlayNextIcon }
