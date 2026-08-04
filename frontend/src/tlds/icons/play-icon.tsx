import * as React from "react"

import { cn } from "@/lib/utils"

function PlayIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M4.53927 3.53269V12.4673L11.4166 8L4.53927 3.53269ZM3.5 3.42898C3.5 2.68227 4.38635 2.24174 5.0376 2.66478L12.0745 7.2358C12.6418 7.60429 12.6418 8.39571 12.0745 8.7642L5.0376 13.3352C4.38635 13.7583 3.5 13.3177 3.5 12.571V3.42898Z"
      />
    </svg>
  )
}

export { PlayIcon }
