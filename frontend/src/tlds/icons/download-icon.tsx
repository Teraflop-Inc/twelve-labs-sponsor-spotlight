import * as React from "react"

import { cn } from "@/lib/utils"

function DownloadIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M8.49805 9.41374L11.1734 7.12056L11.8242 7.87981L8.97501 10.322C8.41328 10.8035 7.58437 10.8035 7.02264 10.322L4.17343 7.87981L4.82422 7.12055L7.49805 9.41241L7.49805 2.5L8.49805 2.5L8.49805 9.41374Z" />
    </svg>
  )
}

export { DownloadIcon }
