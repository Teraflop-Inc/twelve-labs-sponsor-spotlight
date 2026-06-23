import * as React from "react"

import { cn } from "@/lib/utils"

function PlayBoxedIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
          d="M5.39625 4.79058V7.20942L7.10929 6L5.39625 4.79058ZM4.34407 4.315C4.34407 3.65679 5.07869 3.27103 5.61333 3.64849L8 5.33348C8.4588 5.65737 8.4588 6.34263 8 6.66652L5.61333 8.3515C5.07869 8.729 4.34407 8.3432 4.34407 7.685V4.315Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8.40039 0C10.3883 0.000211285 11.9998 1.61169 12 3.59961V8.40039C11.9998 10.3883 10.3883 11.9998 8.40039 12H3.59961C1.61169 11.9998 0.000211285 10.3883 0 8.40039V3.59961C0.000211156 1.61169 1.61169 0.000211157 3.59961 0H8.40039ZM3.59961 1C2.16398 1.00021 1.00021 2.16398 1 3.59961V8.40039C1.00021 9.83602 2.16398 10.9998 3.59961 11H8.40039C9.83602 10.9998 10.9998 9.83602 11 8.40039V3.59961C10.9998 2.16398 9.83602 1.00021 8.40039 1H3.59961Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { PlayBoxedIcon }
