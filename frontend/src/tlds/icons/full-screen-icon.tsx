import * as React from "react"

import { cn } from "@/lib/utils"

function FullScreenIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(2.4992 2.5008) scale(1 0.9999)">
        <path
          d="M6.5 1L9.29282 1L6.14641 4.14641L6.85352 4.85352L10 1.70703V4.5L11 4.5V1.16667C11 0.522335 10.4777 0 9.83333 0H6.5V1Z"
          fill="currentColor"
        />
        <path
          d="M1.70718 10L4.5 10L4.5 11L1.16667 11C0.522334 11 0 10.4777 0 9.83333V6.5H1L1 9.29297L4.14648 6.14648L4.85359 6.85359L1.70718 10Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { FullScreenIcon }
