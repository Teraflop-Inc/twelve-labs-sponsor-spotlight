import * as React from "react"

import { cn } from "@/lib/utils"

function EllipsisIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(6.5008 2.5008) scale(0.9995 0.9999)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1.5 3C2.32843 3 3 2.32843 3 1.5C3 0.671573 2.32843 0 1.5 0C0.671573 0 0 0.671573 0 1.5C0 2.32843 0.671573 3 1.5 3ZM1.5 2C1.77614 2 2 1.77614 2 1.5C2 1.22386 1.77614 1 1.5 1C1.22386 1 1 1.22386 1 1.5C1 1.77614 1.22386 2 1.5 2Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1.5 7C2.32843 7 3 6.32843 3 5.5C3 4.67157 2.32843 4 1.5 4C0.671573 4 0 4.67157 0 5.5C0 6.32843 0.671573 7 1.5 7ZM1.5 6C1.77614 6 2 5.77614 2 5.5C2 5.22386 1.77614 5 1.5 5C1.22386 5 1 5.22386 1 5.5C1 5.77614 1.22386 6 1.5 6Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3 9.5C3 10.3284 2.32843 11 1.5 11C0.671573 11 0 10.3284 0 9.5C0 8.67157 0.671573 8 1.5 8C2.32843 8 3 8.67157 3 9.5ZM2 9.5C2 9.77614 1.77614 10 1.5 10C1.22386 10 1 9.77614 1 9.5C1 9.22386 1.22386 9 1.5 9C1.77614 9 2 9.22386 2 9.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { EllipsisIcon }
