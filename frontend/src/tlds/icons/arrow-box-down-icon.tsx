import * as React from "react"

import { cn } from "@/lib/utils"

function ArrowBoxDownIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M5.6 2C3.61178 2 2 3.61178 2 5.6V10.4C2 12.3882 3.61178 14 5.6 14H10.4C12.3882 14 14 12.3882 14 10.4V5.6C14 3.61178 12.3882 2 10.4 2H5.6ZM10.4 3H5.6C4.16406 3 3 4.16406 3 5.6V10.4C3 11.8359 4.16406 13 5.6 13H10.4C11.8359 13 13 11.8359 13 10.4V5.6C13 4.16406 11.8359 3 10.4 3Z"
      />
      <path d="M7.5 10.2928L5.52513 8.31794L4.81802 9.02505L6.93934 11.1464C7.52513 11.7322 8.47487 11.7322 9.06066 11.1464L11.182 9.02505L10.4749 8.31794L8.5 10.2928V4.49999H7.5V10.2928Z" />
    </svg>
  )
}

export { ArrowBoxDownIcon }
