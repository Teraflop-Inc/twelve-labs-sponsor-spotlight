import * as React from "react"

import { cn } from "@/lib/utils"

function IndexesIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M1 12V4C1 2.96435 1.78722 2.113 2.7959 2.01074L3 2H4.87695C5.38413 2 5.87269 2.19269 6.24316 2.53906L6.25684 2.55176C6.58101 2.85486 6.99529 3.04041 7.43359 3.08203L7.62305 3.09082H13C14.1045 3.09082 15 3.98629 15 5.09082V12L14.9893 12.2041C14.8938 13.1457 14.1457 13.8938 13.2041 13.9893L13 14V13C13.5523 13 14 12.5523 14 12V5.09082C14 4.53858 13.5523 4.09082 13 4.09082H7.62305C6.86234 4.09082 6.12992 3.80171 5.57422 3.28223L5.56055 3.26953C5.3753 3.09632 5.13056 3 4.87695 3H3C2.44772 3 2 3.44772 2 4V12C2 12.5523 2.44772 13 3 13V14L2.7959 13.9893C1.78722 13.887 1 13.0357 1 12ZM13 13V14H3V13H13Z" />
    </svg>
  )
}

export { IndexesIcon }
