import * as React from "react"

import { cn } from "@/lib/utils"

function ChevronDownIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M8.82491 9.94736L12.3535 6.41875L11.6464 5.71165L8.1178 9.24025C8.05272 9.30533 7.9472 9.30533 7.88212 9.24025L4.35351 5.71165L3.64641 6.41875L7.17501 9.94736C7.63062 10.403 8.3693 10.403 8.82491 9.94736Z"
      />
    </svg>
  )
}

export { ChevronDownIcon }
