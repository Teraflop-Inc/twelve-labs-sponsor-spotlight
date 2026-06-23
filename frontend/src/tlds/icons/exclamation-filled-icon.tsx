import * as React from "react"

import { cn } from "@/lib/utils"

function ExclamationFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M10.4004 14C12.3883 13.9998 13.9998 12.3883 14 10.4004V5.59961C13.9998 3.61169 12.3883 2.00021 10.4004 2H5.59961C3.61169 2.00021 2.00021 3.61169 2 5.59961V10.4004C2.00021 12.3883 3.61169 13.9998 5.59961 14H10.4004ZM7.33398 8.66699V4.66699H8.66699V8.66699H7.33398ZM7.33398 11.333V10H8.66699V11.333H7.33398Z"
      />
    </svg>
  )
}

export { ExclamationFilledIcon }
