import * as React from "react"

const Button = React.forwardRef(({ className, ...props }, ref) => (
  <button
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${className || ""}`}
    ref={ref}
    {...props}
  />
))
Button.displayName = "Button"

export { Button }
