import * as React from "react"

import { cn } from "@/lib/utils"

function VolumeMidFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M9 10.6406C9 10.9971 9.34545 11.2518 9.65914 11.0826C10.7552 10.4914 11.5 9.33269 11.5 8.00003C11.5 6.66737 10.7552 5.50868 9.65914 4.9175C9.34545 4.7483 9 5.00301 9 5.35942C9 5.57119 9.12836 5.75851 9.3087 5.86952C10.0235 6.30951 10.5 7.09912 10.5 8.00003C10.5 8.90094 10.0235 9.69055 9.3087 10.1305C9.12836 10.2416 9 10.4289 9 10.6406Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 5.31257C2.44772 5.31257 2 5.76029 2 6.31257V9.68757C2 10.2399 2.44772 10.6876 3 10.6876H4.48405L6.18504 13.0796C6.4372 13.4342 6.88969 13.585 7.30417 13.4527C7.71866 13.3203 8 12.9352 8 12.5001V3.50007C8 3.06497 7.71866 2.6798 7.30417 2.54745C6.88969 2.41511 6.4372 2.56596 6.18504 2.92055L4.48405 5.31257H3Z"
      />
    </svg>
  )
}

export { VolumeMidFilledIcon }
