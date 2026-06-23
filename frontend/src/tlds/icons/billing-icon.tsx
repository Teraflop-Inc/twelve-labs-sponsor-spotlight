import * as React from "react"

import { cn } from "@/lib/utils"

function BillingIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M13.334 3.6665H2.66732C2.48322 3.6665 2.33398 3.81574 2.33398 3.99984V11.9998C2.33398 12.1839 2.48322 12.3332 2.66732 12.3332H13.334C13.5181 12.3332 13.6673 12.1839 13.6673 11.9998V3.99984C13.6673 3.81574 13.5181 3.6665 13.334 3.6665ZM2.66732 2.6665C1.93094 2.6665 1.33398 3.26346 1.33398 3.99984V11.9998C1.33398 12.7362 1.93094 13.3332 2.66732 13.3332H13.334C14.0704 13.3332 14.6673 12.7362 14.6673 11.9998V3.99984C14.6673 3.26346 14.0704 2.6665 13.334 2.6665H2.66732Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.666 6.49982H1.66602V5.49982H14.666V6.49982Z"
      />
    </svg>
  )
}

export { BillingIcon }
