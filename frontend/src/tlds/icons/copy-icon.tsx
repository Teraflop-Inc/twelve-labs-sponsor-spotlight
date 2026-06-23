import * as React from "react"

import { cn } from "@/lib/utils"

function CopyIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M11.1543 4.00391C12.7394 4.08421 14 5.39489 14 7V11L13.9961 11.1543C13.9184 12.6883 12.6883 13.9184 11.1543 13.9961L11 14H7C5.39489 14 4.08421 12.7394 4.00391 11.1543L4 11V7C4 5.34315 5.34315 4 7 4H11L11.1543 4.00391ZM7 5C5.89543 5 5 5.89543 5 7V11C5 12.1046 5.89543 13 7 13H11C12.1046 13 13 12.1046 13 11V7C13 5.89543 12.1046 5 11 5H7ZM9.5 3H5.5C4.11929 3 3 4.11929 3 5.5V11H2V5.5C2 3.567 3.567 2 5.5 2H9.5V3Z" />
    </svg>
  )
}

export { CopyIcon }
