import * as React from "react"

import { cn } from "@/lib/utils"

function ShareFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
          d="M11 0C11.5523 0 12 0.447715 12 1V2C12 2.55228 11.5523 3 11 3H10C9.58322 3 9.2254 2.74528 9.0752 2.38281L3 5.63281V6.3584L9.07812 9.60938C9.23017 9.25099 9.58617 9 10 9H11C11.5523 9 12 9.44771 12 10V11C12 11.5523 11.5523 12 11 12H10C9.44771 12 9 11.5523 9 11V10.7178L2.60254 7.2959C2.43479 7.42309 2.22675 7.5 2 7.5H1C0.447715 7.5 1.61065e-08 7.05228 0 6.5V5.5C0 4.94772 0.447715 4.5 1 4.5H2C2.22956 4.5 2.44059 4.57795 2.60938 4.70801L9 1.29004V1C9 0.447715 9.44771 1.61064e-08 10 0H11Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { ShareFilledIcon }
