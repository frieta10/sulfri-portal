import * as React from "react"
import { cn } from "@/lib/utils"

interface NeonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glow" | "bordered"
  header?: React.ReactNode
  footer?: React.ReactNode
  noPadding?: boolean
}

const NeonCard = React.forwardRef<HTMLDivElement, NeonCardProps>(
  ({ className, variant = "default", header, footer, noPadding = false, children, ...props }, ref) => {
    const variants = {
      default: "bg-slate-900/50 border-green-500/20",
      glow: "bg-slate-900/80 border-green-400/40 shadow-[0_0_30px_rgba(34,197,94,0.15)]",
      bordered: "bg-slate-900/30 border-green-500/30",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border backdrop-blur-sm overflow-hidden transition-all duration-300",
          variants[variant],
          "hover:border-green-500/40 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)]",
          className
        )}
        {...props}
      >
        {/* Top glow line */}
        <div className="h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
        
        {header && (
          <div className="px-6 py-4 border-b border-green-500/10 bg-green-500/5">
            {header}
          </div>
        )}
        
        <div className={cn(noPadding ? "" : "p-6")}>
          {children}
        </div>
        
        {footer && (
          <div className="px-6 py-4 border-t border-green-500/10 bg-green-500/5">
            {footer}
          </div>
        )}
        
        {/* Bottom subtle glow */}
        <div className="h-px bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10" />
      </div>
    )
  }
)
NeonCard.displayName = "NeonCard"

interface NeonCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  action?: React.ReactNode
}

const NeonCardHeader = React.forwardRef<HTMLDivElement, NeonCardHeaderProps>(
  ({ className, title, description, action, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-start justify-between mb-4", className)} {...props}>
      <div className="flex-1">
        {title && (
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {title}
            <div className="h-1 w-1 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
          </h3>
        )}
        {description && (
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        )}
        {children}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  )
)
NeonCardHeader.displayName = "NeonCardHeader"

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  glow?: boolean
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant = "primary", size = "md", glow = false, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:pointer-events-none"
    
    const variants = {
      primary: cn(
        "bg-gradient-to-r from-green-600 to-green-500 text-white",
        "hover:from-green-500 hover:to-green-400",
        "shadow-[0_0_20px_rgba(34,197,94,0.3)]",
        "hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]",
        "active:translate-y-0.5 active:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
      ),
      secondary: cn(
        "bg-slate-800 text-slate-200 border border-green-500/20",
        "hover:bg-slate-700 hover:border-green-500/40",
        "hover:text-green-400"
      ),
      outline: cn(
        "border border-green-500/50 text-green-400 bg-transparent",
        "hover:bg-green-500/10 hover:border-green-400",
        "hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]"
      ),
      ghost: cn(
        "text-slate-400 hover:text-green-400 hover:bg-green-500/10"
      ),
      danger: cn(
        "bg-gradient-to-r from-red-600 to-red-500 text-white",
        "hover:from-red-500 hover:to-red-400",
        "shadow-[0_0_20px_rgba(239,68,68,0.3)]"
      ),
    }

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          glow && "animate-neon-pulse",
          className
        )}
        {...props}
      />
    )
  }
)
NeonButton.displayName = "NeonButton"

interface NeonBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info"
}

const NeonBadge = React.forwardRef<HTMLSpanElement, NeonBadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]",
      success: "bg-green-500/20 border-green-400/50 text-green-300 shadow-[0_0_15px_rgba(74,222,128,0.2)]",
      warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.1)]",
      error: "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
      info: "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.1)]",
    }

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
NeonBadge.displayName = "NeonBadge"

interface NeonInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const NeonInput = React.forwardRef<HTMLInputElement, NeonInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex w-full rounded-lg border bg-slate-900/80 px-3 py-2 text-sm",
          "border-green-500/30 text-slate-200 placeholder:text-slate-500",
          "shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
          "focus:border-green-400 focus:ring-1 focus:ring-green-400/50",
          "focus:shadow-[0_0_20px_rgba(34,197,94,0.15),inset_0_2px_4px_rgba(0,0,0,0.3)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)
NeonInput.displayName = "NeonInput"

export { NeonCard, NeonCardHeader, NeonButton, NeonBadge, NeonInput }
