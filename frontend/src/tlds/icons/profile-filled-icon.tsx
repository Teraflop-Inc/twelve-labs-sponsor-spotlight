import * as React from "react"

import { cn } from "@/lib/utils"

function ProfileFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M4.66699 9.8335H11.333C12.5295 9.8335 13.4998 10.803 13.5 11.9995V13.4995H2.5V11.9995C2.50016 10.803 3.47048 9.8335 4.66699 9.8335ZM8.00098 3.1665C9.19744 3.16668 10.167 4.13699 10.167 5.3335C10.1668 6.52986 9.19734 7.49934 8.00098 7.49951C6.80447 7.49951 5.83416 6.52996 5.83398 5.3335C5.83398 4.13688 6.80436 3.1665 8.00098 3.1665Z" />
    </svg>
  )
}

export { ProfileFilledIcon }
