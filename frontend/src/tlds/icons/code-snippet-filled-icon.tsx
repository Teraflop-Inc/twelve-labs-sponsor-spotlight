import * as React from "react"

import { cn } from "@/lib/utils"

function CodeSnippetFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
          d="M8.40039 0C10.3883 0.000211285 11.9998 1.61169 12 3.59961V8.40039C11.9998 10.3883 10.3883 11.9998 8.40039 12H3.59961C1.61169 11.9998 0.000211285 10.3883 0 8.40039V3.59961C0.000211156 1.61169 1.61169 0.000211157 3.59961 0H8.40039ZM2.7832 5.1748C2.32762 5.63042 2.3276 6.36959 2.7832 6.8252L4.31152 8.35352L5.01855 7.64648L3.49023 6.11816C3.42516 6.05309 3.42518 5.94693 3.49023 5.88184L5.01855 4.35352L4.31152 3.64648L2.7832 5.1748ZM6.97949 4.35352L8.50781 5.88184C8.57287 5.94693 8.57289 6.05309 8.50781 6.11816L6.97949 7.64648L7.68652 8.35352L9.21484 6.8252C9.67045 6.36959 9.67042 5.63042 9.21484 5.1748L7.68652 3.64648L6.97949 4.35352Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { CodeSnippetFilledIcon }
