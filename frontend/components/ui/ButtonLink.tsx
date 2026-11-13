import Link from "next/link";

type Variant = "primary" | "secondary" | "dark" | "ghost";
type Size = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/70 active:translate-y-px";

const VARIANTS: Record<Variant, string> = {
  primary: "border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 text-slate-900 shadow-sm hover:brightness-95",
  secondary: "border-2 border-sky-300 bg-white text-sky-900 shadow-sm hover:border-sky-400 hover:bg-sky-50",
  dark: "border-2 border-sky-900 bg-sky-950 text-white shadow-sm hover:bg-sky-900",
  ghost: "border-2 border-transparent text-sky-900 hover:bg-sky-50",
};

const SIZES: Record<Size, string> = {
  md: "min-h-11 px-4 py-2 text-sm",
  lg: "min-h-12 px-6 py-3 text-base",
};

/** Stil unic pentru CTA-uri (link-uri), ca butoanele sa arate la fel pe toate paginile publice. */
export function buttonClass(variant: Variant = "primary", size: Size = "md") {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]}`;
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  return (
    <Link href={href} className={`${buttonClass(variant, size)} ${className}`}>
      {children}
    </Link>
  );
}
