import * as React from "react"

import { cn } from "@/lib/utils"

function CheckIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(2 3) rotate(-90 6 5)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0.738846 2.69001L6.08074 0L6.65407 0.990085L1.31217 3.68009C1.16892 3.75223 1.17217 3.94492 1.31779 4.01282L12 8.99357L11.4604 10L0.778172 5.01925C-0.24121 4.54394 -0.263986 3.195 0.738846 2.69001Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { CheckIcon }
