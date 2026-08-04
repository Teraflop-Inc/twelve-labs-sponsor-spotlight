import * as React from "react"

import { cn } from "@/lib/utils"

function ProfileIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M8.00065 6.99984C8.92113 6.99984 9.66732 6.25365 9.66732 5.33317C9.66732 4.4127 8.92113 3.6665 8.00065 3.6665C7.08018 3.6665 6.33398 4.4127 6.33398 5.33317C6.33398 6.25365 7.08018 6.99984 8.00065 6.99984ZM8.00065 7.99984C9.47341 7.99984 10.6673 6.80593 10.6673 5.33317C10.6673 3.86041 9.47341 2.6665 8.00065 2.6665C6.52789 2.6665 5.33398 3.86041 5.33398 5.33317C5.33398 6.80593 6.52789 7.99984 8.00065 7.99984Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.5 11.9998C1.5 10.2509 2.91777 8.83315 4.66667 8.83315H11.3333C13.0822 8.83315 14.5 10.2509 14.5 11.9998V13.9998H13.5V11.9998C13.5 10.8032 12.53 9.83315 11.3333 9.83315H4.66667C3.47005 9.83315 2.5 10.8032 2.5 11.9998V13.9998H1.5V11.9998Z"
      />
    </svg>
  )
}

export { ProfileIcon }
