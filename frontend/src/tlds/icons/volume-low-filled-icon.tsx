import * as React from "react"

import { cn } from "@/lib/utils"

function VolumeLowFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M3 5.31257C2.44772 5.31257 2 5.76029 2 6.31257V9.68757C2 10.2399 2.44772 10.6876 3 10.6876H4.48405L6.18504 13.0796C6.4372 13.4342 6.88969 13.585 7.30417 13.4527C7.71866 13.3203 8 12.9352 8 12.5001V3.50007C8 3.06497 7.71866 2.6798 7.30417 2.54745C6.88969 2.41511 6.4372 2.56596 6.18504 2.92055L4.48405 5.31257H3Z"
      />
    </svg>
  )
}

export { VolumeLowFilledIcon }
