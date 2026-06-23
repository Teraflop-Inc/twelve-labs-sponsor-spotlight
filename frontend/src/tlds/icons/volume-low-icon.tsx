import * as React from "react"

import { cn } from "@/lib/utils"

function VolumeLowIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M2 6.31257C2 5.76029 2.44772 5.31257 3 5.31257H4.48405L6.18504 2.92055C6.4372 2.56596 6.88969 2.41511 7.30417 2.54745C7.71866 2.6798 8 3.06497 8 3.50007V12.5001C8 12.9352 7.71866 13.3203 7.30417 13.4527C6.88969 13.585 6.4372 13.4342 6.18504 13.0796L4.48405 10.6876H3C2.44772 10.6876 2 10.2399 2 9.68757V6.31257ZM5 9.68757L7 12.5001V3.50007L5 6.31257H3V9.68757H5Z"
      />
    </svg>
  )
}

export { VolumeLowIcon }
