import * as React from "react"

import { cn } from "@/lib/utils"

function IdeaFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(3.8336 1.8336)">
        <path
          d="M4.16667 0C6.46785 0 8.33333 1.86548 8.33333 4.16667C8.33333 5.73929 7.46191 7.1081 6.17577 7.81741C6.16997 7.8206 6.16667 7.82672 6.16667 7.83333V9.16667C6.16667 9.71895 5.71895 10.1667 5.16667 10.1667H3.16667C2.61438 10.1667 2.16667 9.71895 2.16667 9.16667V7.83333C2.16667 7.82672 2.1632 7.8206 2.15741 7.81741C0.87133 7.10808 0 5.73924 0 4.16667C0 1.86548 1.86548 0 4.16667 0Z"
          fill="currentColor"
        />
        <path
          d="M2.16667 11.6667C2.16667 11.3905 2.39052 11.1667 2.66667 11.1667H5.66667C5.94281 11.1667 6.16667 11.3905 6.16667 11.6667C6.16667 11.9428 5.94281 12.1667 5.66667 12.1667H2.66667C2.39052 12.1667 2.16667 11.9428 2.16667 11.6667Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { IdeaFilledIcon }
