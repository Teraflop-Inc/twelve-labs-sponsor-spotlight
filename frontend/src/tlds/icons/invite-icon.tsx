import * as React from "react"

import { cn } from "@/lib/utils"

function InviteIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(1.5008 2.6656) scale(0.9999 1)">
        <path
          d="M8.5 7.16699H3.16699C1.97043 7.16699 1.00009 8.13744 1 9.33398V11.334H0V9.33398C8.78731e-05 7.58516 1.41814 6.16797 3.16699 6.16797H8.5V7.16699Z"
          fill="currentColor"
        />
        <path
          d="M12 7.83398H14V8.83398H12V10.834H11V8.83398H9V7.83398H11V5.83398H12V7.83398Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.50098 0C7.97353 0.000175828 9.1669 1.19442 9.16699 2.66699C9.16699 4.13964 7.97359 5.33381 6.50098 5.33398C5.02822 5.33398 3.83398 4.13975 3.83398 2.66699C3.83407 1.19431 5.02827 0 6.50098 0ZM6.50098 1.00098C5.58056 1.00098 4.83407 1.74659 4.83398 2.66699C4.83398 3.58747 5.5805 4.33398 6.50098 4.33398C7.4213 4.33381 8.16699 3.58736 8.16699 2.66699C8.1669 1.7467 7.42125 1.00115 6.50098 1.00098Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { InviteIcon }
