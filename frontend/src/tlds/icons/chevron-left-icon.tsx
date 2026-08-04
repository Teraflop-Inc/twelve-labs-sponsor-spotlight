import * as React from "react"

import { cn } from "@/lib/utils"

function ChevronLeftIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M6.05264 8.82491L9.58125 12.3535L10.2884 11.6464L6.75975 8.11781C6.69467 8.05272 6.69467 7.9472 6.75975 7.88212L10.2884 4.35351L9.58125 3.64641L6.05264 7.17501C5.59704 7.63062 5.59704 8.3693 6.05264 8.82491Z"
      />
    </svg>
  )
}

export { ChevronLeftIcon }
