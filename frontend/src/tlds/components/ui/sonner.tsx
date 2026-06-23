"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

import {
  CheckmarkFilledIcon,
  CloseBoxedFilledIcon,
  InfoFilledIcon,
  SpinnerIcon,
  WarningFilledIcon,
} from "@/icons"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CheckmarkFilledIcon className="size-4" />,
        info: <InfoFilledIcon className="size-4" />,
        warning: <WarningFilledIcon className="size-4" />,
        error: <CloseBoxedFilledIcon className="size-4" />,
        loading: <SpinnerIcon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--tl-surface-white)",
          "--normal-text": "var(--tl-foreground-body)",
          "--normal-border": "var(--tl-border-secondary)",
          "--border-radius": "var(--tl-radius-2)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
