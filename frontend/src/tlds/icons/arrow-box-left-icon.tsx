import * as React from "react"

import { cn } from "@/lib/utils"

function ArrowBoxLeftIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M14 10.4C14 12.3882 12.3882 14 10.4 14H5.6C3.61178 14 2 12.3882 2 10.4V5.6C2 3.61178 3.61178 2 5.6 2H10.4C12.3882 2 14 3.61178 14 5.6V10.4ZM13 5.6V10.4C13 11.8359 11.8359 13 10.4 13H5.6C4.16406 13 3 11.8359 3 10.4V5.6C3 4.16406 4.16406 3 5.6 3H10.4C11.8359 3 13 4.16406 13 5.6Z"
      />
      <path d="M5.70718 8.5L7.68206 10.4749L6.97495 11.182L4.85363 9.06066C4.26784 8.47487 4.26784 7.52513 4.85363 6.93934L6.97495 4.81802L7.68206 5.52513L5.70718 7.5H11.5V8.5H5.70718Z" />
    </svg>
  )
}

export { ArrowBoxLeftIcon }
