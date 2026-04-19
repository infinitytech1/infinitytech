import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/* ─── Button variants ──────────────────────────────────────── */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizes = {
    sm: "text-xs px-3 py-1.5 h-8",
    md: "text-sm px-4 py-2.5 h-10",
    lg: "text-base px-6 py-3 h-12",
  };

  const variants = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 btn-glow btn-shimmer shadow-md shadow-primary/15",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border hover:border-primary/20",
    ghost:
      "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent hover:border-border",
    outline:
      "border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/50 btn-ghost-glow",
    danger:
      "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive hover:text-white hover:border-transparent",
  };

  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
      {iconRight && !loading && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}

/* ─── Card ─────────────────────────────────────────────────── */
interface CardProps {
  className?: string;
  children: ReactNode;
  glass?: boolean;
  hoverable?: boolean;
  gradient?: boolean;
}

export function Card({ className, children, glass, hoverable, gradient }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-card-border overflow-hidden",
        glass ? "glass-card" : "bg-card",
        hoverable && "hover-card-anim cursor-pointer",
        gradient && "gradient-border",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─── Badge ─────────────────────────────────────────────────── */
interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "muted";
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = "default", className, dot }: BadgeProps) {
  const variants = {
    default: "bg-secondary/60 text-secondary-foreground border-border/60",
    primary: "bg-primary/10 text-primary border-primary/25",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    danger:  "bg-red-500/10 text-red-400 border-red-500/25",
    muted:   "bg-muted/60 text-muted-foreground border-transparent",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border leading-none",
        variants[variant],
        className
      )}
    >
      {dot && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full",
          {
            default: "bg-muted-foreground",
            primary: "bg-primary",
            success: "bg-emerald-400",
            warning: "bg-amber-400",
            danger:  "bg-red-400",
            muted:   "bg-muted-foreground",
          }[variant]
        )} />
      )}
      {children}
    </span>
  );
}

/* ─── Divider ───────────────────────────────────────────────── */
export function Divider({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-px bg-gradient-to-r from-transparent via-border to-transparent", className)}
    />
  );
}

/* ─── Section Heading ───────────────────────────────────────── */
interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  badge?: string;
  className?: string;
}

export function SectionHeading({ title, subtitle, badge, className }: SectionHeadingProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {badge && <Badge variant="primary" dot>{badge}</Badge>}
      <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">{title}</h2>
      {subtitle && <p className="text-muted-foreground max-w-2xl leading-relaxed">{subtitle}</p>}
    </div>
  );
}

/* ─── Stat Card ─────────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; label?: string };
  className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("p-5 metric-shimmer", className)} hoverable>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-display font-bold text-foreground">{value}</p>
          {trend && (
            <p className={cn(
              "text-xs font-medium flex items-center gap-1",
              trend.value >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
              {trend.label && <span className="text-muted-foreground font-normal">{trend.label}</span>}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ─── Animated page wrapper ─────────────────────────────────── */
export function PageFade({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Input ─────────────────────────────────────────────────── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        <input
          className={cn(
            "w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground",
            "placeholder:text-muted-foreground/50",
            "focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40",
            "transition-all duration-200",
            icon && "pl-9",
            error && "border-destructive/50 focus:ring-destructive/20",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
