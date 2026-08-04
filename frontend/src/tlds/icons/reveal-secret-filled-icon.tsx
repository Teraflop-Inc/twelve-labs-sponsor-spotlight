import * as React from "react"

import { cn } from "@/lib/utils"

function RevealSecretFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M9.5 1.5C11.1569 1.5 12.5 2.84315 12.5 4.5V6C13.3284 6 14 6.67157 14 7.5V12.5C14 13.3284 13.3284 14 12.5 14H3.5C2.67157 14 2 13.3284 2 12.5V7.5C2 6.67157 2.67157 6 3.5 6H11.5V4.5C11.5 3.39543 10.6046 2.5 9.5 2.5H6.5C5.39543 2.5 4.5 3.39543 4.5 4.5H3.5C3.5 2.84315 4.84315 1.5 6.5 1.5H9.5ZM7.59961 9C7.26855 9.00021 7.00021 9.26855 7 9.59961V10.4004C7.00021 10.7315 7.26855 10.9998 7.59961 11H8.40039C8.73145 10.9998 8.99979 10.7315 9 10.4004V9.59961C8.99979 9.26855 8.73145 9.00021 8.40039 9H7.59961Z" />
    </svg>
  )
}

export { RevealSecretFilledIcon }
