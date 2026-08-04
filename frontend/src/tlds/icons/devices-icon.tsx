import * as React from "react"

import { cn } from "@/lib/utils"

function DevicesIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M5.1 4H14V3H5.1C3.9402 3 3 3.9402 3 5.1V11H2V12H9.01659C9.00568 11.935 9 11.8681 9 11.8V11H4V5.1C4 4.49249 4.49249 4 5.1 4Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 6.2C10 5.53726 10.5373 5 11.2 5H12.8C13.4627 5 14 5.53726 14 6.2V10.8C14 11.4627 13.4627 12 12.8 12H11.2C10.5373 12 10 11.4627 10 10.8V6.2ZM11.2 6H12.8C12.9105 6 13 6.08954 13 6.2V10.8C13 10.9105 12.9105 11 12.8 11H11.2C11.0895 11 11 10.9105 11 10.8V6.2C11 6.08954 11.0895 6 11.2 6Z"
      />
    </svg>
  )
}

export { DevicesIcon }
