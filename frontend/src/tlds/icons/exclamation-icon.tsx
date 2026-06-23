import * as React from "react"

import { cn } from "@/lib/utils"

function ExclamationIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M8.66699 4.66699H7.33398V8.66699H8.66699V4.66699Z" />
      <path d="M8.66699 10H7.33398V11.333H8.66699V10Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.4004 14C12.3883 13.9998 13.9998 12.3883 14 10.4004V5.59961C13.9998 3.61169 12.3883 2.00021 10.4004 2H5.59961C3.61169 2.00021 2.00021 3.61169 2 5.59961V10.4004C2.00021 12.3883 3.61169 13.9998 5.59961 14H10.4004ZM5.59961 13C4.16398 12.9998 3.00021 11.836 3 10.4004V5.59961C3.00021 4.16398 4.16398 3.00021 5.59961 3H10.4004C11.836 3.00021 12.9998 4.16398 13 5.59961V10.4004C12.9998 11.836 11.836 12.9998 10.4004 13H5.59961Z"
      />
    </svg>
  )
}

export { ExclamationIcon }
