import * as React from "react"

import { cn } from "@/lib/utils"

function CloseIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M7.26006 8.01746L4.10334 11.1742L4.86095 11.9318L8.01768 8.77507L11.1567 11.9141L11.9143 11.1565L8.77529 8.01746L11.932 4.86073L11.1744 4.10312L8.01768 7.25984L4.84327 4.08544L4.08566 4.84305L7.26006 8.01746Z"
      />
    </svg>
  )
}

export { CloseIcon }
