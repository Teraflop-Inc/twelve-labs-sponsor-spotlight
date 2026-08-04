import * as React from "react"

import { cn } from "@/lib/utils"

function ArrowBoxLeftFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M10.4 14C12.3882 14 14 12.3882 14 10.4V5.6C14 3.61178 12.3882 2 10.4 2H5.6C3.61178 2 2 3.61178 2 5.6V10.4C2 12.3882 3.61178 14 5.6 14H10.4ZM7.68207 10.4749L5.7072 8.5H11.5V7.5H5.7072L7.68207 5.52512L6.97497 4.81802L4.85365 6.93934C4.26786 7.52512 4.26786 8.47487 4.85365 9.06066L6.97497 11.182L7.68207 10.4749Z"
      />
    </svg>
  )
}

export { ArrowBoxLeftFilledIcon }
