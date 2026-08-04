import * as React from "react"

import { cn } from "@/lib/utils"

function IndeterminateFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M10.3994 2C12.3875 2 13.9998 3.61157 14 5.59961V10.3994C14 12.3876 12.3876 14 10.3994 14H5.59961L5.41504 13.9951C3.51277 13.8989 2 12.3256 2 10.3994V5.59961C2.00018 3.61168 3.61168 2.00018 5.59961 2H10.3994ZM5 7.5V8.5H11V7.5H5Z"
      />
    </svg>
  )
}

export { IndeterminateFilledIcon }
