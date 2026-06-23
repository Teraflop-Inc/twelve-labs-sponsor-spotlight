import * as React from "react"

import { cn } from "@/lib/utils"

function AddVideoIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(2 0.6672)">
        <path
          d="M10.9824 2.33333V3.5H11.9824V2.33333H13.2324V1.33333H11.9824V0H10.9824V1.33333H9.73242V2.33333H10.9824Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3.83203 5.08382C3.83203 4.48023 4.4972 4.11336 5.00772 4.43538L8.57454 6.68522C9.05141 6.98601 9.05141 7.68132 8.57454 7.98211L5.00772 10.232C4.4972 10.554 3.83203 10.1871 3.83203 9.58351V5.08382ZM4.83203 9.16046L7.72816 7.33366L4.83203 5.50687V9.16046Z"
          fill="currentColor"
        />
        <path
          d="M3.86111 1.3335C1.72868 1.3335 0 3.06218 0 5.19461V9.47239C0 11.6048 1.72868 13.3335 3.86111 13.3335H8.13889C10.2713 13.3335 12 11.6048 12 9.47239V4.3335H11V9.47239C11 11.0525 9.71904 12.3335 8.13889 12.3335H3.86111C2.28096 12.3335 1 11.0525 1 9.47239V5.19461C1 3.61446 2.28096 2.3335 3.86111 2.3335H8.66667V1.3335H3.86111Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { AddVideoIcon }
