import * as React from "react"

import { cn } from "@/lib/utils"

function RefreshIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M9.4 3H5.6C4.16406 3 3 4.16406 3 5.6V10.4C3 11.8359 4.16406 13 5.6 13H9.4C10.8359 13 12 11.8359 12 10.4V10H13V10.4C13 12.3882 11.3882 14 9.4 14H5.6C3.61177 14 2 12.3882 2 10.4V5.6C2 3.61178 3.61177 2 5.6 2H9.4C11.3882 2 13 3.61177 13 5.6V7.29294L14.1465 6.14648L14.8536 6.85359L13.3839 8.32326C12.8957 8.81142 12.1043 8.81142 11.6161 8.32326L10.1465 6.85359L10.8536 6.14648L12 7.29292V5.6C12 4.16406 10.8359 3 9.4 3Z" />
    </svg>
  )
}

export { RefreshIcon }
