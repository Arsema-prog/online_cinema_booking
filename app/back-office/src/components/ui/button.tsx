import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-xl text-sm font-bold whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_span.material-symbols-outlined]:text-[1.25em]",
  {
    variants: {
      variant: {
        default: "bg-primary-container text-on-primary-container hover:brightness-110 shadow-lg hover:shadow-primary-container/20",
        destructive: "bg-error-container text-on-error-container hover:brightness-110",
        outline: "border-2 border-outline-variant bg-transparent text-on-surface hover:bg-surface-container-high",
        secondary: "bg-surface-container-highest text-on-surface hover:bg-surface-bright",
        ghost: "hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface",
        link: "text-primary hover:underline underline-offset-4",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 rounded-lg",
        lg: "h-14 px-8 py-4 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
