import * as React from "react"

import { cn } from "@/lib/utils"

function PlayBoxedFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8.4004 0C10.3883 0.00021 11.9998 1.61169 12 3.59961V8.4004C11.9998 10.3883 10.3883 11.9998 8.4004 12H3.59961C1.61169 11.9998 0.00021 10.3883 0 8.4004V3.59961C0.00021 1.61169 1.61169 0.00021 3.59961 0H8.4004ZM5.61328 3.64844C5.07864 3.27098 4.34375 3.65722 4.34375 4.31543V7.68457C4.34375 8.3428 5.07864 8.729 5.61328 8.3516L8 6.66699C8.4588 6.3431 8.4588 5.6569 8 5.33301L5.61328 3.64844Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { PlayBoxedFilledIcon }
