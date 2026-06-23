import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-tlds-2 border border-border-secondary bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-foreground-muted focus-visible:border-misc-ring focus-visible:ring-[3px] focus-visible:ring-misc-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-border-destructive aria-invalid:ring-border-destructive/20 md:text-sm",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
