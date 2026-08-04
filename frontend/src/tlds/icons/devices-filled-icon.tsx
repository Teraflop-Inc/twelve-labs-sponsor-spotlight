import * as React from "react"

import { cn } from "@/lib/utils"

function DevicesFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M5.1 4H14V3H5.1C3.9402 3 3 3.9402 3 5.1V11H2V12H9.01659C9.00568 11.935 9 11.8681 9 11.8V11H4V5.1C4 4.49249 4.49249 4 5.1 4Z"
        fill="currentColor"
      />
      <path
        d="M11.2002 5.5H12.7998C13.1864 5.5 13.5 5.8136 13.5 6.2002V10.7998C13.5 11.1864 13.1864 11.5 12.7998 11.5H11.2002C10.8136 11.5 10.5 11.1864 10.5 10.7998V6.2002C10.5 5.8136 10.8136 5.5 11.2002 5.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

export { DevicesFilledIcon }
