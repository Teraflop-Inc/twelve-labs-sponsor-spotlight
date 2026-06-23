import * as React from "react"

import { cn } from "@/lib/utils"

function ListIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M4 10.5C4.55228 10.5 5 10.9477 5 11.5V12.5C5 13.0523 4.55228 13.5 4 13.5H3L2.89746 13.4951C2.39333 13.4438 2 13.0177 2 12.5V11.5C2 10.9477 2.44772 10.5 3 10.5H4ZM3 12.5H4V11.5H3V12.5Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13 10.5C13.5523 10.5 14 10.9477 14 11.5V12.5C14 13.0523 13.5523 13.5 13 13.5H7C6.44772 13.5 6 13.0523 6 12.5V11.5C6 10.9477 6.44772 10.5 7 10.5H13ZM7 12.5H13V11.5H7V12.5Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 6.5C4.55228 6.5 5 6.94772 5 7.5V8.5C5 9.05228 4.55228 9.5 4 9.5H3L2.89746 9.49512C2.39333 9.44379 2 9.01768 2 8.5V7.5C2 6.94772 2.44772 6.5 3 6.5H4ZM3 8.5H4V7.5H3V8.5Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13 6.5C13.5523 6.5 14 6.94772 14 7.5V8.5C14 9.05228 13.5523 9.5 13 9.5H7C6.44772 9.5 6 9.05228 6 8.5V7.5C6 6.94772 6.44772 6.5 7 6.5H13ZM7 8.5H13V7.5H7V8.5Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 2.5C4.55228 2.5 5 2.94772 5 3.5V4.5C5 5.05228 4.55228 5.5 4 5.5H3L2.89746 5.49512C2.39333 5.44379 2 5.01768 2 4.5V3.5C2 2.94772 2.44772 2.5 3 2.5H4ZM3 4.5H4V3.5H3V4.5Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13 2.5C13.5523 2.5 14 2.94772 14 3.5V4.5C14 5.05228 13.5523 5.5 13 5.5H7C6.44772 5.5 6 5.05228 6 4.5V3.5C6 2.94772 6.44772 2.5 7 2.5H13ZM7 4.5H13V3.5H7V4.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

export { ListIcon }
