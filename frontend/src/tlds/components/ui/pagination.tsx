"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { ArrowBoxLeftIcon, ArrowBoxRightIcon } from "@/icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

// TLDS 2.0 page-number token. These are the *deltas* layered on top of a
// ghosted `Button` (so pages share its radius, press + focus behavior):
// grow past the square 24px for double-digit pages, use body text, and
// lighten the hover to `surface-card`. Selected / open fills
// `surface-secondary`.
const paginationItemVariants = cva(
  "h-6 w-auto min-w-6 px-1 text-xs leading-4 text-foreground-body hover:bg-surface-card",
  {
    variants: {
      isActive: {
        true: "bg-surface-secondary hover:bg-surface-secondary",
        false: "",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  },
)

type PaginationLinkProps = {
  isActive?: boolean
} & VariantProps<typeof paginationItemVariants> &
  React.ComponentProps<"a">

function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
  return (
    <Button
      variant="ghosted"
      size="sm"
      asChild
      className={cn(paginationItemVariants({ isActive }), className)}
    >
      <a
        aria-current={isActive ? "page" : undefined}
        data-slot="pagination-link"
        data-active={isActive}
        {...props}
      />
    </Button>
  )
}

// Prev/next are icon-only arrow controls — an `IconButton` (ghosted, `sm` to
// match the 24px page pills) wrapping an `<a>` so navigation keeps an href.
function PaginationPrevious({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <IconButton variant="ghosted" size="sm" asChild className={cn("cursor-pointer", className)}>
      <a aria-label="Go to previous page" {...props}>
        <ArrowBoxLeftIcon />
      </a>
    </IconButton>
  )
}

function PaginationNext({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <IconButton variant="ghosted" size="sm" asChild className={cn("cursor-pointer", className)}>
      <a aria-label="Go to next page" {...props}>
        <ArrowBoxRightIcon />
      </a>
    </IconButton>
  )
}

// The overflow "…" token is a real button: pressing it opens a Menu of the
// pages it collapses. Pass those pages as `children` (`PaginationMenuItem`s);
// with no children it stays a styled, non-interactive ellipsis.
function PaginationEllipsis({
  className,
  children,
  contentProps,
  ...props
}: React.ComponentProps<"button"> & {
  contentProps?: React.ComponentProps<typeof MenuContent>
}) {
  if (children == null) {
    return (
      <span
        aria-hidden
        data-slot="pagination-ellipsis"
        className={cn(
          "inline-flex h-6 min-w-6 items-center justify-center rounded-tlds-3 px-1 text-xs leading-4 text-foreground-body",
          className,
        )}
        {...(props as React.ComponentProps<"span">)}
      >
        …<span className="sr-only">More pages</span>
      </span>
    )
  }

  return (
    <Menu>
      <MenuTrigger asChild>
        <Button
          variant="ghosted"
          size="sm"
          asChild
          className={cn(
            paginationItemVariants(),
            "data-[state=open]:bg-surface-secondary",
            className,
          )}
        >
          <button type="button" aria-label="More pages" data-slot="pagination-ellipsis" {...props}>
            …
          </button>
        </Button>
      </MenuTrigger>
      <MenuContent
        align="center"
        {...contentProps}
        className={cn("min-w-(--radix-dropdown-menu-trigger-width)", contentProps?.className)}
      >
        {children}
      </MenuContent>
    </Menu>
  )
}

// Convenience re-export so a page inside the overflow menu can be authored as
// `<PaginationMenuItem>6</PaginationMenuItem>` without reaching into `menu`.
function PaginationMenuItem({ className, ...props }: React.ComponentProps<typeof MenuItem>) {
  return (
    <MenuItem
      data-slot="pagination-menu-item"
      className={cn("justify-center", className)}
      {...props}
    />
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  PaginationMenuItem,
  paginationItemVariants,
}
