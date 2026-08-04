import * as React from "react"

import { cn } from "@/lib/utils"

function UploadIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M14 14H2V13H14V14Z" />
      <path d="M7.5 3.76937L4.82462 6.06255L4.17383 5.30329L7.02304 2.86112C7.58477 2.37963 8.41368 2.37963 8.97541 2.86112L11.8246 5.30329L11.1738 6.06255L8.5 3.7707V10.6831H7.5V3.76937Z" />
    </svg>
  )
}

export { UploadIcon }
