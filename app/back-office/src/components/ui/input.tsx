import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full bg-surface-container-high border-transparent rounded-xl py-3.5 px-5 text-sm font-medium focus:ring-2 focus:ring-primary-container transition-all placeholder:text-on-surface-variant/40 text-on-surface outline-none",
        className
      )}
      {...props}
    />
  )
}

export { Input }
