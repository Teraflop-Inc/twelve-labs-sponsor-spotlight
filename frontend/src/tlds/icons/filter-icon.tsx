import * as React from "react"

import { cn } from "@/lib/utils"

function FilterIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(2 3)">
        <path
          d="M11.4 4.76837e-07C11.7314 4.91322e-07 12 0.26863 12 0.600001V1.4C12 1.73137 11.7314 2 11.4 2L0.6 2C0.268629 2 -1.44864e-08 1.73137 0 1.4L3.49683e-08 0.6C4.94547e-08 0.268629 0.268629 -1.44846e-08 0.6 0L11.4 4.76837e-07Z"
          fill="currentColor"
        />
        <path
          d="M9.4 4.00039C9.73137 4.00039 10 4.26902 10 4.60039V5.40039C10 5.73176 9.73137 6.00039 9.4 6.00039H2.6C2.26863 6.00039 2 5.73176 2 5.40039V4.60039C2 4.26902 2.26863 4.00039 2.6 4.00039H9.4Z"
          fill="currentColor"
        />
        <path
          d="M7.4 8C7.73137 8 8 8.26863 8 8.6V9.4C8 9.73137 7.73137 10 7.4 10H4.6C4.26863 10 4 9.73137 4 9.4V8.6C4 8.26863 4.26863 8 4.6 8H7.4Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { FilterIcon }
