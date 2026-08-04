import * as React from "react"

import { cn } from "@/lib/utils"

function ApiKeysIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M8 9C8.55228 9 9 9.44772 9 10C9 10.5523 8.55228 11 8 11C7.44772 11 7 10.5523 7 10C7 9.44772 7.44772 9 8 9Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.5 1.5C11.1569 1.5 12.5 2.84315 12.5 4.5V6C13.3284 6 14 6.67157 14 7.5V12.5C14 13.3284 13.3284 14 12.5 14H3.5C2.67157 14 2 13.3284 2 12.5V7.5C2 6.67157 2.67157 6 3.5 6V4.5C3.5 2.84315 4.84315 1.5 6.5 1.5H9.5ZM3.5 7C3.22386 7 3 7.22386 3 7.5V12.5C3 12.7761 3.22386 13 3.5 13H12.5C12.7761 13 13 12.7761 13 12.5V7.5C13 7.22386 12.7761 7 12.5 7H3.5ZM6.5 2.5C5.39543 2.5 4.5 3.39543 4.5 4.5V6H11.5V4.5C11.5 3.39543 10.6046 2.5 9.5 2.5H6.5Z"
      />
    </svg>
  )
}

export { ApiKeysIcon }
