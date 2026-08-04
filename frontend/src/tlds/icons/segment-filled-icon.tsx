import * as React from "react"

import { cn } from "@/lib/utils"

function SegmentFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(2 2.5008) scale(1 0.9999)">
        <path
          d="M2 8C2.55228 8 3 8.44772 3 9V10C3 10.5523 2.55228 11 2 11H1C0.447715 11 1.61065e-08 10.5523 0 10V9C0 8.44772 0.447715 8 1 8H2ZM11 8C11.5523 8 12 8.44772 12 9V10C12 10.5523 11.5523 11 11 11H4.5C3.94772 11 3.5 10.5523 3.5 10V9C3.5 8.44772 3.94772 8 4.5 8H11ZM4 4C4.55228 4 5 4.44772 5 5V6C5 6.55228 4.55228 7 4 7H1C0.447715 7 1.61065e-08 6.55228 0 6V5C0 4.44772 0.447715 4 1 4H4ZM11 4C11.5523 4 12 4.44772 12 5V6C12 6.55228 11.5523 7 11 7H6.5C5.94772 7 5.5 6.55228 5.5 6V5C5.5 4.44772 5.94772 4 6.5 4H11ZM7.5 0C8.05228 0 8.5 0.447715 8.5 1V2C8.5 2.55228 8.05228 3 7.5 3H1C0.447715 3 1.61065e-08 2.55228 0 2V1C0 0.447715 0.447715 2.0133e-09 1 0H7.5ZM11 0C11.5523 0 12 0.447715 12 1V2C12 2.55228 11.5523 3 11 3H10C9.44772 3 9 2.55228 9 2V1C9 0.447715 9.44772 1.61064e-08 10 0H11Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { SegmentFilledIcon }
