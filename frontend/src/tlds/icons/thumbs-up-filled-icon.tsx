import * as React from "react"

import { cn } from "@/lib/utils"

function ThumbsUpFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(2 2)">
        <path
          d="M2.41183 3.82763C2.15308 4.01581 2 4.31643 2 4.63636V11C2 11.5523 2.44772 12 3 12H8C8.33372 12 8.64546 11.8335 8.83107 11.5562L11.8311 7.07342C11.9412 6.90884 12 6.71527 12 6.51724V4.63636C12 4.08408 11.5523 3.63636 11 3.63636H8.31212L8.9642 1.26516C9.07687 0.855474 8.91834 0.419328 8.56891 0.177602C8.21948 -0.064124 7.75545 -0.0586451 7.41183 0.191264L2.41183 3.82763Z"
          fill="currentColor"
        />
        <path
          d="M1 11.5V5.5C1 5.22386 0.776142 5 0.5 5C0.223858 5 0 5.22386 0 5.5V11.5C0 11.7761 0.223858 12 0.5 12C0.776142 12 1 11.7761 1 11.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { ThumbsUpFilledIcon }
