import * as React from "react"

import { cn } from "@/lib/utils"

function IndexesFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M1 4C1 2.89543 1.89543 2 3 2H4.87727C5.3845 2 5.87277 2.19272 6.24326 2.53915L6.25674 2.55176C6.62723 2.89819 7.1155 3.09091 7.62273 3.09091H13C14.1046 3.09091 15 3.98634 15 5.09091V12C15 13.1046 14.1046 14 13 14H3C1.89543 14 1 13.1046 1 12V4Z" />
    </svg>
  )
}

export { IndexesFilledIcon }
