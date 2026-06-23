import * as React from "react"

import { cn } from "@/lib/utils"

function CreateIndexFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M5.39551 2.6665C5.79022 2.66658 6.17646 2.78349 6.50488 3.00244L7.49707 3.66357C7.8256 3.88259 8.2116 3.99951 8.60645 3.99951H12.667C13.7715 3.99951 14.6668 4.89509 14.667 5.99951V11.3335C14.6668 12.4379 13.7715 13.3335 12.667 13.3335H3.33398C2.22952 13.3335 1.33416 12.4379 1.33398 11.3335V4.6665C1.33398 3.56193 2.22941 2.6665 3.33398 2.6665H5.39551ZM7.5 6.50049V8.00049H6V9.00049H7.5V10.5005H8.5V9.00049H10V8.00049H8.5V6.50049H7.5Z"
      />
    </svg>
  )
}

export { CreateIndexFilledIcon }
