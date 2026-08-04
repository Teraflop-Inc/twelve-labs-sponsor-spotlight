import * as React from "react"

import { cn } from "@/lib/utils"

function RadioCheckFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2ZM7.65137 9.95215C7.58908 10.0643 7.42928 10.067 7.36328 9.95703L5.95703 7.61426L5.09961 8.12793L6.50586 10.4717C6.96783 11.2416 8.09029 11.2234 8.52637 10.4385L11.2988 5.44727L10.4248 4.96191L7.65137 9.95215Z"
      />
    </svg>
  )
}

export { RadioCheckFilledIcon }
