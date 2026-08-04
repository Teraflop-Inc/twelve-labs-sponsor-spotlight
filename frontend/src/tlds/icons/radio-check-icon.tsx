import * as React from "react"

import { cn } from "@/lib/utils"

function RadioCheckIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M11.2988 5.44727L8.52637 10.4385C8.0903 11.2234 6.96784 11.2416 6.50586 10.4717L5.09961 8.12793L5.95703 7.61426L7.36328 9.95703C7.42928 10.067 7.58908 10.0643 7.65137 9.95215L10.4248 4.96191L11.2988 5.44727Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2ZM8 3C5.23858 3 3 5.23858 3 8C3 10.7614 5.23858 13 8 13C10.7614 13 13 10.7614 13 8C13 5.23858 10.7614 3 8 3Z"
      />
    </svg>
  )
}

export { RadioCheckIcon }
