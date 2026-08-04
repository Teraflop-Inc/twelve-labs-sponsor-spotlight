import * as React from "react"

import { cn } from "@/lib/utils"

function MagnigyingGlassIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(1.6464 1.5008) scale(1 0.9999)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.35352 0C10.6672 0 13.3535 2.68629 13.3535 6C13.3535 9.31371 10.6672 12 7.35352 12C5.87644 12 4.5249 11.4652 3.47949 10.5801L0.707031 13.3535L0 12.6465L2.77246 9.87305C1.88785 8.82778 1.35352 7.47658 1.35352 6C1.35352 2.68629 4.03981 0 7.35352 0ZM7.35352 1C4.59209 1 2.35352 3.23858 2.35352 6C2.35352 8.76142 4.59209 11 7.35352 11C10.1149 11 12.3535 8.76142 12.3535 6C12.3535 3.23858 10.1149 1 7.35352 1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { MagnigyingGlassIcon }
