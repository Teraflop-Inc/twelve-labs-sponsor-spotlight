import * as React from "react"

import { cn } from "@/lib/utils"

function IndeterminateIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M11 8.5H5V7.5H11V8.5Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.3994 2C12.3875 2 13.9998 3.61157 14 5.59961V10.3994C14 12.3876 12.3876 14 10.3994 14H5.59961C3.61157 13.9998 2 12.3875 2 10.3994V5.59961C2.00018 3.61168 3.61168 2.00018 5.59961 2H10.3994ZM5.59961 3C4.16396 3.00018 3.00018 4.16396 3 5.59961V10.3994C3 11.8352 4.16385 12.9998 5.59961 13H10.3994C11.8353 13 13 11.8353 13 10.3994V5.59961C12.9998 4.16385 11.8352 3 10.3994 3H5.59961Z"
      />
    </svg>
  )
}

export { IndeterminateIcon }
