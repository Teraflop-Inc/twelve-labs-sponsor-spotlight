import * as React from "react"

import { cn } from "@/lib/utils"

function IntegrationFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(0 2.6672) scale(1 0.9999)">
        <path
          d="M12.9 4.02667C12.4467 1.72667 10.4267 0 8 0C6.07333 0 4.4 1.09333 3.56667 2.69333C1.56 2.90667 0 4.60667 0 6.66667C0 8.87333 1.79333 10.6667 4 10.6667H12.6667C14.5067 10.6667 16 9.17333 16 7.33333C16 5.57333 14.6333 4.14667 12.9 4.02667Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { IntegrationFilledIcon }
