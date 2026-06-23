import * as React from "react"

import { cn } from "@/lib/utils"

function CheckmarkFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
        d="M10.3994 2C12.3875 2 13.9998 3.61157 14 5.59961V10.3994C14 12.3876 12.3876 14 10.3994 14H5.59961L5.41504 13.9951C3.51277 13.8989 2 12.3256 2 10.3994V5.59961C2.00018 3.61168 3.61168 2.00018 5.59961 2H10.3994ZM7.45605 10.0811C7.39375 10.1932 7.23396 10.1959 7.16797 10.0859L5.76172 7.74219L4.9043 8.25684L6.31055 10.6006C6.77252 11.3704 7.89492 11.3521 8.33105 10.5674L11.1035 5.57617L10.2295 5.09082L7.45605 10.0811Z"
      />
    </svg>
  )
}

export { CheckmarkFilledIcon }
