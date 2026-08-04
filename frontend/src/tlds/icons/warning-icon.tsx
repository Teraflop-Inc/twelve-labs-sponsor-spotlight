import * as React from "react"

import { cn } from "@/lib/utils"

function WarningIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M8.50016 12H7.50016V11H8.50016V12Z" />
      <path d="M8.50016 10.5H7.50016V7H8.50016V10.5Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.16129 3.5C7.53392 2.83333 8.4664 2.83333 8.83903 3.5L13.8693 12.5C14.2418 13.1666 13.7756 14 13.0304 14H2.96989C2.22468 14 1.75852 13.1666 2.13102 12.5L7.16129 3.5ZM3.00407 12.9883C3.00163 12.9927 3.00016 12.9961 3.00016 12.9961V13H13.0002V12.9961C13.0002 12.9961 12.9987 12.9927 12.9963 12.9883L8.00016 4.0498L3.00407 12.9883Z"
      />
    </svg>
  )
}

export { WarningIcon }
