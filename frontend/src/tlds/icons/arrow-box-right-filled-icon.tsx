import * as React from "react"

import { cn } from "@/lib/utils"

function ArrowBoxRightFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M5.6 2C3.61178 2 2 3.61178 2 5.6V10.4C2 12.3882 3.61178 14 5.6 14H10.4C12.3882 14 14 12.3882 14 10.4V5.6C14 3.61178 12.3882 2 10.4 2H5.6ZM8.31793 5.52513L10.2928 7.5H4.49997V8.5H10.2928L8.31793 10.4749L9.02503 11.182L11.1464 9.06066C11.7321 8.47488 11.7321 7.52513 11.1464 6.93934L9.02503 4.81802L8.31793 5.52513Z"
      />
    </svg>
  )
}

export { ArrowBoxRightFilledIcon }
