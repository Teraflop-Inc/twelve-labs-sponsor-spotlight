import * as React from "react"

import { cn } from "@/lib/utils"

function WarningFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M7.16129 3.5C7.53392 2.83333 8.4664 2.83333 8.83903 3.5L13.8693 12.5C14.2418 13.1666 13.7756 14 13.0304 14H2.96989C2.22468 14 1.75852 13.1666 2.13102 12.5L7.16129 3.5ZM7.50016 12H8.50016V11H7.50016V12ZM7.50016 7V10.5H8.50016V7H7.50016Z"
      />
    </svg>
  )
}

export { WarningFilledIcon }
