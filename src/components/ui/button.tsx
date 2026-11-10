import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "lg" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-[var(--shadow-press-brand)] hover:bg-brand-strong active:translate-y-[2px] active:shadow-none",
  secondary: "bg-surface text-ink border-[1.5px] border-line hover:border-brand",
  ghost: "text-brand hover:bg-brand-soft",
};

const SIZES: Record<Size, string> = {
  lg: "min-h-[52px] px-6 text-[17px]",
  md: "min-h-11 px-4 text-[15px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "lg", block, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold transition-[background-color,border-color,transform,box-shadow] duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className,
      )}
      {...props}
    />
  );
});
