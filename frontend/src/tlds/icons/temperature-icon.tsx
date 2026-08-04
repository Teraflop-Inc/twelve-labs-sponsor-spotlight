import * as React from "react"

import { cn } from "@/lib/utils"

function TemperatureIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M5 4C5 2.34315 6.34315 1 8 1C9.65685 1 11 2.34315 11 4V8.35418C11.6224 9.05931 12 9.98555 12 11C12 13.2091 10.2091 15 8 15C5.79086 15 4 13.2091 4 11C4 9.98555 4.37764 9.05931 5 8.35418V4ZM6 8.73237L5.74974 9.01591C5.28243 9.54536 5 10.2385 5 11C5 12.6569 6.34315 14 8 14C9.65685 14 11 12.6569 11 11C11 10.2385 10.7176 9.54536 10.2503 9.01591L10 8.73237V4C10 2.89543 9.10457 2 8 2C6.89543 2 6 2.89543 6 4V8.73237Z"
      />
      <path d="M8.5 9.06297V4.99996H7.5V9.06297C6.63739 9.28499 6 10.068 6 11C6 12.1045 6.89543 13 8 13C9.10457 13 10 12.1045 10 11C10 10.068 9.36261 9.28499 8.5 9.06297Z" />
    </svg>
  )
}

export { TemperatureIcon }
