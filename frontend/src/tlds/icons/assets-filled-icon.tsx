import * as React from "react"

import { cn } from "@/lib/utils"

function AssetsFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(2 1)">
        <path
          d="M12 3V10C12 11.6569 10.6569 13 9 13H3C1.34315 13 0 11.6569 0 10V3C0 1.34315 1.34315 0 3 0H9L12 3ZM5.5 5.00195L5.50391 6.5H4V7.5H5.50684L5.51172 9.01172L6.51172 9.00879L6.50684 7.5H8V6.5H6.50391L6.5 4.99902L5.5 5.00195ZM7.5 0.5V3C7.5 3.55228 7.94772 4 8.5 4H11.5V3.5L8.5 0.5H7.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { AssetsFilledIcon }
