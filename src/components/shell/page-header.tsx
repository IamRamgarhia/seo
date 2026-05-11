import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Crumb = { href?: string; label: string };

type Accent = "violet" | "cyan" | "amber" | "rose" | "emerald" | "fuchsia";

const accentText: Record<Accent, string> = {
  violet: "text-violet-300",
  cyan: "text-cyan-300",
  amber: "text-amber-300",
  rose: "text-rose-300",
  emerald: "text-emerald-300",
  fuchsia: "text-fuchsia-300",
};

type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  accent?: Accent;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
  meta?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  icon: Icon,
  accent = "violet",
  crumbs,
  actions,
  meta,
}: PageHeaderProps) {
  return (
    <section className="border-b border-border pb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          {crumbs && crumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-[12px] text-muted-foreground">
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && (
                    <ChevronRight className="size-3 text-muted-foreground/50" />
                  )}
                  {c.href ? (
                    <Link
                      href={c.href}
                      className="rounded px-0.5 transition-colors hover:text-foreground"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-foreground">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {Icon && (
              <Icon className={cn("size-4 shrink-0", accentText[accent])} />
            )}
            <h1 className="pro-mode-marker text-[18px] font-semibold leading-tight tracking-tight text-foreground">
              {title}
            </h1>
          </div>

          {description && (
            <p className="pro-hide-help max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}

          {meta && <div className="pt-1">{meta}</div>}
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </section>
  );
}
