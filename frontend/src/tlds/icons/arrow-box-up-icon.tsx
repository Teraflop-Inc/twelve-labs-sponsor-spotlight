import * as React from "react"

import { cn } from "@/lib/utils"

function ArrowBoxUpIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M5.6 14C3.61178 14 2 12.3882 2 10.4V5.6C2 3.61178 3.61178 2 5.6 2H10.4C12.3882 2 14 3.61178 14 5.6V10.4C14 12.3882 12.3882 14 10.4 14H5.6ZM10.4 13H5.6C4.16406 13 3 11.83594 3 10.4V5.6C3 4.16406 4.16406 3 5.6 3H10.4C11.83594 3 13 4.16406 13 5.6V10.4C13 11.83594 11.83594 13 10.4 13Z"
      />
      <path d="M7.5 5.70718L5.52513 7.68206L4.81802 6.97495L6.93934 4.85363C7.52513 4.26784 8.47487 4.26784 9.06066 4.85363L11.18198 6.97495L10.47487 7.68206L8.5 5.70718V11.50001H7.5V5.70718Z" />
    </svg>
  )
}

export { ArrowBoxUpIcon }
