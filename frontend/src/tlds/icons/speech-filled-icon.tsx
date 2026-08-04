import * as React from "react"

import { cn } from "@/lib/utils"

function SpeechFilledIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <path d="M10.7998 1.6665C12.5671 1.6665 14 3.09939 14 4.8667V7.80029C13.9998 9.5674 12.567 10.9995 10.7998 10.9995H10.0752C10.0285 10.9996 9.98498 11.0249 9.96094 11.0649L8.57129 13.3804C8.37707 13.7039 7.97692 13.7853 7.67969 13.6235C7.63007 13.5965 7.58345 13.5625 7.54102 13.522C7.49871 13.4816 7.46103 13.4342 7.42871 13.3804L6.03906 11.0649C6.02104 11.0349 5.99198 11.0132 5.95898 11.0044L5.9248 10.9995H5.2002C3.43304 10.9995 2.00025 9.56739 2 7.80029V4.8667C2 3.09939 3.43288 1.6665 5.2002 1.6665H10.7998Z" />
    </svg>
  )
}

export { SpeechFilledIcon }
