import * as React from "react"

import { cn } from "@/lib/utils"

function SpeechIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M5.2 2.6665H10.8C12.015 2.6665 13 3.65148 13 4.8665V7.79984C13 9.01486 12.015 9.99984 10.8 9.99984H10.0755C9.67739 9.99984 9.30849 10.2087 9.10367 10.5501L8 12.3895L6.89633 10.5501C6.69151 10.2087 6.3226 9.99984 5.92451 9.99984H5.2C3.98497 9.99984 3 9.01486 3 7.79984V4.8665C3 3.65148 3.98497 2.6665 5.2 2.6665ZM10.8 1.6665C12.5673 1.6665 14 3.09919 14 4.8665V7.79984C14 9.56715 12.5673 10.9998 10.8 10.9998H10.0755C10.0287 10.9998 9.98526 11.0244 9.96116 11.0646L8.57166 13.3804C8.31273 13.812 7.68727 13.812 7.42834 13.3804L6.03884 11.0646C6.01474 11.0244 5.97134 10.9998 5.92451 10.9998H5.2C3.43269 10.9998 2 9.56715 2 7.79984V4.8665C2 3.09919 3.43269 1.6665 5.2 1.6665H10.8Z"
      />
    </svg>
  )
}

export { SpeechIcon }
