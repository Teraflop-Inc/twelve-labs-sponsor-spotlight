import * as React from "react"

import { cn } from "@/lib/utils"

function ExpandFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M2.26758 5.6C2.26758 3.61178 3.87935 2 5.86758 2H6.60091V14H5.86758C3.87935 14 2.26758 12.3882 2.26758 10.4V5.6Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.16667 3V13H10.4C11.8359 13 13 11.8359 13 10.4V5.6C13 4.16406 11.8359 3 10.4 3H7.16667ZM6.16667 3V13H5.6C4.16406 13 3 11.8359 3 10.4V5.6C3 4.16406 4.16406 3 5.6 3H6.16667ZM5.6 2C3.61178 2 2 3.61178 2 5.6V10.4C2 12.3882 3.61178 14 5.6 14H10.4C12.3882 14 14 12.3882 14 10.4V5.6C14 3.61177 12.3882 2 10.4 2H5.6Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.6798 7.17504L9.15122 5.64645L8.44411 6.35355L9.97271 7.88215C10.0378 7.94724 10.0378 8.05276 9.97271 8.11785L8.44411 9.64645L9.15122 10.3536L10.6798 8.82496C11.1354 8.36935 11.1354 7.63065 10.6798 7.17504Z"
      />
    </svg>
  )
}

export { ExpandFilledIcon }
