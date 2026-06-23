import * as React from "react"

import { cn } from "@/lib/utils"

function ArrowBoxRightIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M2 5.6C2 3.61178 3.61178 2 5.6 2H10.4C12.3882 2 14 3.61178 14 5.6V10.4C14 12.3882 12.3882 14 10.4 14H5.6C3.61178 14 2 12.3882 2 10.4V5.6ZM3 10.4V5.6C3 4.16406 4.16406 3 5.6 3H10.4C11.8359 3 13 4.16406 13 5.6V10.4C13 11.8359 11.8359 13 10.4 13H5.6C4.16406 13 3 11.8359 3 10.4Z"
      />
      <path d="M10.2928 7.5L8.31794 5.52513L9.02505 4.81802L11.1464 6.93934C11.7322 7.52513 11.7322 8.47487 11.1464 9.06066L9.02505 11.182L8.31794 10.4749L10.2928 8.5H4.49999V7.5H10.2928Z" />
    </svg>
  )
}

export { ArrowBoxRightIcon }
