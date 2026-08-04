import * as React from "react"

import { cn } from "@/lib/utils"

function ChevronRightIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M9.94665 7.17509L6.41804 3.64648L5.71094 4.35359L9.23954 7.88219C9.30462 7.94728 9.30462 8.0528 9.23954 8.11788L5.71094 11.6465L6.41804 12.3536L9.94665 8.82499C10.4023 8.36938 10.4023 7.6307 9.94665 7.17509Z"
      />
    </svg>
  )
}

export { ChevronRightIcon }
