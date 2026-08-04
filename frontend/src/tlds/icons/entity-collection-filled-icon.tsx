import * as React from "react"

import { cn } from "@/lib/utils"

function EntityCollectionFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M4.87695 2C5.38413 2 5.87269 2.19269 6.24316 2.53906L6.25684 2.55176C6.62732 2.89816 7.11585 3.09082 7.62305 3.09082H13C14.1045 3.09082 15 3.98629 15 5.09082V12C15 13.1046 14.1046 14 13 14H3C1.89543 14 1 13.1046 1 12V4C1 2.89543 1.89543 2 3 2H4.87695ZM8 10C5.2 10 4.16667 12 4 13H12C11.8333 12 10.8 10 8 10ZM8 5C6.89543 5 6 5.89543 6 7C6 8.10457 6.89543 9 8 9C9.10457 9 10 8.10457 10 7C10 5.89543 9.10457 5 8 5Z" />
    </svg>
  )
}

export { EntityCollectionFilledIcon }
