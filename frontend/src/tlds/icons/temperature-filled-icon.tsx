import * as React from "react"

import { cn } from "@/lib/utils"

function TemperatureFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M5 4C5 2.34315 6.34315 1 8 1C9.65685 1 11 2.34315 11 4V8.35418C11.6224 9.05931 12 9.98555 12 11C12 13.2091 10.2091 15 8 15C5.79086 15 4 13.2091 4 11C4 9.98555 4.37764 9.05931 5 8.35418V4ZM8.5 5V9.06301C9.36261 9.28503 10 10.0681 10 11C10 12.1046 9.10457 13 8 13C6.89543 13 6 12.1046 6 11C6 10.0681 6.63739 9.28503 7.5 9.06301V5H8.5Z"
      />
    </svg>
  )
}

export { TemperatureFilledIcon }
