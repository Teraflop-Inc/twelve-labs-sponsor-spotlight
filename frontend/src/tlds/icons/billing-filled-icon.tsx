import * as React from "react"

import { cn } from "@/lib/utils"

function BillingFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M14.167 7.1665V11.3335C14.1668 12.1618 13.4953 12.8335 12.667 12.8335H3.33398C2.50567 12.8335 1.83416 12.1618 1.83398 11.3335V7.1665H14.167ZM3.33398 3.1665H12.667C13.4954 3.1665 14.167 3.83808 14.167 4.6665V5.49951H1.83398V4.6665C1.83398 3.83808 2.50556 3.1665 3.33398 3.1665Z" />
    </svg>
  )
}

export { BillingFilledIcon }
