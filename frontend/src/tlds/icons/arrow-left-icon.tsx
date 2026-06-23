import * as React from "react"

import { cn } from "@/lib/utils"

function ArrowLeftIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M6.42564 13.0199L2.23038 8.82467C1.77477 8.36906 1.77477 7.63036 2.23038 7.17475L6.42564 2.97949L7.13275 3.6866L3.31944 7.49991L14.1133 7.49991V8.49991L3.31984 8.49991L7.13275 12.3128L6.42564 13.0199Z" />
    </svg>
  )
}

export { ArrowLeftIcon }
