import * as React from "react"

import { cn } from "@/lib/utils"

function ArrowBoxUpFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M2 10.4C2 12.3882 3.61178 14 5.6 14H10.4C12.3882 14 14 12.3882 14 10.4V5.6C14 3.61178 12.3882 2 10.4 2H5.6C3.61178 2 2 3.61178 2 5.6V10.4ZM5.52513 7.68207L7.5 5.7072V11.50003H8.5V5.7072L10.47488 7.68207L11.18198 6.97497L9.06066 4.85365C8.47488 4.26786 7.52513 4.26786 6.93934 4.85365L4.81802 6.97497L5.52513 7.68207Z"
      />
    </svg>
  )
}

export { ArrowBoxUpFilledIcon }
