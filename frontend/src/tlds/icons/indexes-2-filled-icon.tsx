import * as React from "react"

import { cn } from "@/lib/utils"

function Indexes2FilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M4.87695 2C5.38413 2 5.87269 2.19269 6.24316 2.53906L6.25684 2.55176C6.62732 2.89816 7.11585 3.09082 7.62305 3.09082H13C14.1045 3.09082 15 3.98629 15 5.09082V12C15 13.1046 14.1046 14 13 14H3C1.89543 14 1 13.1046 1 12V4C1 2.89543 1.89543 2 3 2H4.87695ZM8.35352 5C6.69666 5 5.35352 6.34315 5.35352 8C5.35352 8.64756 5.56029 9.24607 5.90918 9.73633L4.5 11.1465L5.20703 11.8535L6.61621 10.4434C7.10668 10.7927 7.70546 11 8.35352 11C10.0104 11 11.3535 9.65685 11.3535 8C11.3535 6.34315 10.0104 5 8.35352 5ZM8.35352 6C9.45809 6 10.3535 6.89543 10.3535 8C10.3535 9.10457 9.45809 10 8.35352 10C7.24895 10 6.35352 9.10457 6.35352 8C6.35352 6.89543 7.24895 6 8.35352 6Z" />
    </svg>
  )
}

export { Indexes2FilledIcon }
