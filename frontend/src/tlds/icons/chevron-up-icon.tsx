import * as React from "react"

import { cn } from "@/lib/utils"

function ChevronUpIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M7.17509 6.05335L3.64648 9.58196L4.35359 10.2891L7.88219 6.76046C7.94728 6.69538 8.0528 6.69538 8.11788 6.76046L11.6465 10.2891L12.3536 9.58196L8.82499 6.05335C8.36938 5.59774 7.6307 5.59774 7.17509 6.05335Z"
      />
    </svg>
  )
}

export { ChevronUpIcon }
