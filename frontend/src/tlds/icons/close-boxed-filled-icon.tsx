import * as React from "react"

import { cn } from "@/lib/utils"

function CloseBoxedFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(2 2)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0 3.6C0 1.61178 1.61178 0 3.6 0H8.4C10.3882 0 12 1.61178 12 3.6V8.4C12 10.3882 10.3882 12 8.4 12H3.6C1.61178 12 0 10.3882 0 8.4V3.6ZM3.05367 2.34649L6.02057 5.3134L8.96685 2.36712L9.67395 3.07422L6.72768 6.0205L9.65333 8.94616L8.94622 9.65326L6.02057 6.72761L3.07429 9.67389L2.36718 8.96678L5.31346 6.0205L2.34656 3.0536L3.05367 2.34649Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { CloseBoxedFilledIcon }
