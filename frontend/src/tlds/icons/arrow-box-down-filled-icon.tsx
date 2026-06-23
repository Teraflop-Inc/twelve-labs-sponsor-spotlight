import * as React from "react"

import { cn } from "@/lib/utils"

function ArrowBoxDownFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M2 5.6C2 3.61178 3.61178 2 5.6 2H10.4C12.3882 2 14 3.61178 14 5.6V10.4C14 12.3882 12.3882 14 10.4 14H5.6C3.61178 14 2 12.3882 2 10.4V5.6ZM5.52513 8.31793L7.5 10.2928V4.49997H8.5V10.2928L10.4749 8.31793L11.182 9.02503L9.06066 11.1464C8.47488 11.7321 7.52513 11.7321 6.93934 11.1464L4.81802 9.02503L5.52513 8.31793Z"
      />
    </svg>
  )
}

export { ArrowBoxDownFilledIcon }
