import * as React from "react"

import { cn } from "@/lib/utils"

function ListFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M4 10.5C4.55228 10.5 5 10.9477 5 11.5V12.5C5 13.0523 4.55228 13.5 4 13.5H3C2.44772 13.5 2 13.0523 2 12.5V11.5C2 10.9477 2.44772 10.5 3 10.5H4Z"
        fill="currentColor"
      />
      <path
        d="M13 10.5C13.5523 10.5 14 10.9477 14 11.5V12.5C14 13.0523 13.5523 13.5 13 13.5H7C6.44772 13.5 6 13.0523 6 12.5V11.5C6 10.9477 6.44772 10.5 7 10.5H13Z"
        fill="currentColor"
      />
      <path
        d="M4 6.5C4.55228 6.5 5 6.94772 5 7.5V8.5C5 9.05228 4.55228 9.5 4 9.5H3C2.44772 9.5 2 9.05228 2 8.5V7.5C2 6.94772 2.44772 6.5 3 6.5H4Z"
        fill="currentColor"
      />
      <path
        d="M13 6.5C13.5523 6.5 14 6.94772 14 7.5V8.5C14 9.05228 13.5523 9.5 13 9.5H7C6.44772 9.5 6 9.05228 6 8.5V7.5C6 6.94772 6.44772 6.5 7 6.5H13Z"
        fill="currentColor"
      />
      <path
        d="M4 2.5C4.55228 2.5 5 2.94772 5 3.5V4.5C5 5.05228 4.55228 5.5 4 5.5H3C2.44772 5.5 2 5.05228 2 4.5V3.5C2 2.94772 2.44772 2.5 3 2.5H4Z"
        fill="currentColor"
      />
      <path
        d="M13 2.5C13.5523 2.5 14 2.94772 14 3.5V4.5C14 5.05228 13.5523 5.5 13 5.5H7C6.44772 5.5 6 5.05228 6 4.5V3.5C6 2.94772 6.44772 2.5 7 2.5H13Z"
        fill="currentColor"
      />
    </svg>
  )
}

export { ListFilledIcon }
