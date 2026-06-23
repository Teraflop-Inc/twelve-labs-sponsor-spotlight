import * as React from "react"

import { cn } from "@/lib/utils"

function ArrowDiagonalIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M10.1543 4.89453C10.7984 4.89479 11.3203 5.41736 11.3203 6.06152V9.75488H10.3203V6.60156L5.56836 11.3535L4.86133 10.6465L9.61328 5.89453H6.46094V4.89453H10.1543Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.4004 2C12.3883 2.00021 13.9998 3.61169 14 5.59961V10.4004C13.9998 12.3883 12.3883 13.9998 10.4004 14H5.59961C3.61169 13.9998 2.00021 12.3883 2 10.4004V5.59961C2.00021 3.61169 3.61169 2.00021 5.59961 2H10.4004ZM5.59961 3C4.16398 3.00021 3.00021 4.16398 3 5.59961V10.4004C3.00021 11.836 4.16398 12.9998 5.59961 13H10.4004C11.836 12.9998 12.9998 11.836 13 10.4004V5.59961C12.9998 4.16398 11.836 3.00021 10.4004 3H5.59961Z"
      />
    </svg>
  )
}

export { ArrowDiagonalIcon }
