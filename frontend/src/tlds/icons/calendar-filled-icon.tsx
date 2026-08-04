import * as React from "react"

import { cn } from "@/lib/utils"

function CalendarFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M5.5 3H10.5V2H11.5V3.04102C12.9189 3.27902 14 4.51348 14 6V11C14 12.6569 12.6569 14 11 14H5C3.34315 14 2 12.6569 2 11V6C2 4.51348 3.08111 3.27902 4.5 3.04102V2H5.5V3ZM3 11C3 12.1046 3.89543 13 5 13H11C12.1046 13 13 12.1046 13 11V6.5H3V11Z"
      />
    </svg>
  )
}

export { CalendarFilledIcon }
