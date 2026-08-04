import * as React from "react"

import { cn } from "@/lib/utils"

function ArrowRightIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M9.57436 13.0199L13.76962 8.82467C14.22523 8.36906 14.22523 7.63036 13.76962 7.17475L9.57436 2.97949L8.86725 3.6866L12.68056 7.49991L1.8867 7.49991V8.49991L12.68016 8.49991L8.86725 12.3128L9.57436 13.0199Z" />
    </svg>
  )
}

export { ArrowRightIcon }
