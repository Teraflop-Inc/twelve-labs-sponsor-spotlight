import * as React from "react"

import { cn } from "@/lib/utils"

function EditIcon({ className, ...props }: React.ComponentProps<"svg">) {
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
      <g transform="translate(1.5008 1.6032)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10.8498 5.7537L3.70711 12.8964H1.1C0.492487 12.8964 0 12.404 0 11.7964V9.18934L8.96967 0.21967C9.26256 -0.0732244 9.73744 -0.0732222 10.0303 0.21967L12.6768 2.86612C12.9697 3.15901 12.9697 3.63388 12.6768 3.92678L10.8572 5.74633L10.8536 5.75004L10.8498 5.7537ZM8.20709 2.39647L9.5 1.10355L11.7929 3.39645L10.5 4.68936L8.20709 2.39647ZM7.49998 3.10357L1 9.60355V11.7964C1 11.8517 1.04477 11.8964 1.1 11.8964H3.29289L9.79287 5.39647L7.49998 3.10357Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export { EditIcon }
