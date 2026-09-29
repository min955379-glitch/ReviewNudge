"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-muted",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 transition-all",
            pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-amber-500" : "bg-primary"
          )}
          style={{ transform: `translateX(-${100 - pct}%)` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
