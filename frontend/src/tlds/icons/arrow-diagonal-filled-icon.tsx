import * as React from "react"

import { cn } from "@/lib/utils"

function ArrowDiagonalFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M10.4004 2C12.3883 2.00021 13.9998 3.61169 14 5.59961V10.4004C13.9998 12.3883 12.3883 13.9998 10.4004 14H5.59961C3.61169 13.9998 2.00021 12.3883 2 10.4004V5.59961C2.00021 3.61169 3.61169 2.00021 5.59961 2H10.4004ZM6.46094 5.89453H9.61328L4.86133 10.6465L5.56836 11.3535L10.3203 6.60156V9.75488H11.3203V6.06152C11.3203 5.41738 10.7984 4.89479 10.1543 4.89453H6.46094V5.89453Z"
      />
    </svg>
  )
}

export { ArrowDiagonalFilledIcon }
