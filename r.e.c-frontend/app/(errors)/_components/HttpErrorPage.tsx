import Link from "next/link";
import type { ReactNode } from "react";
import ReloadButton from "./ReloadButton";

type CtaLink = { href: string; label: string };

type Props = {
  code: string;
  title: string;
  description: string;
  icon: ReactNode;
  iconTone?: "primary" | "accent";
  primaryCta: CtaLink;
  secondaryCtas?: CtaLink[];
  showReload?: boolean;
};

export default function HttpErrorPage({
  code,
  title,
  description,
  icon,
  iconTone = "primary",
  primaryCta,
  secondaryCtas,
  showReload,
}: Props) {
  return (
    <main className="rec-auth-shell flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--rec-soft)] bg-rec-bg-elevated p-8 text-center shadow-lg">
        <div
          className={[
            "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full",
            iconTone === "accent" ? "bg-[color:var(--rec-accent-10)]" : "bg-[color:var(--rec-primary-12)]",
          ].join(" ")}
        >
          {icon}
        </div>
        <p className="text-6xl font-black text-[color:var(--rec-primary)]">{code}</p>
        <h1 className="mt-4 text-xl font-bold text-rec-text-primary">{title}</h1>
        <p className="mt-2 text-sm text-rec-text-muted">{description}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={primaryCta.href}
            className="rounded-xl bg-[color:var(--rec-primary)] px-6 py-3 text-sm font-semibold text-rec-text-on-media transition hover:bg-[color:var(--rec-primary-strong)]"
          >
            {primaryCta.label}
          </Link>

          {showReload && (
            <ReloadButton className="rounded-xl border border-rec-border-strong px-6 py-3 text-sm font-semibold text-rec-text-secondary transition hover:bg-rec-bg-base">
              Reintentar
            </ReloadButton>
          )}

          {secondaryCtas?.map((cta) => (
            <Link
              key={`${cta.href}-${cta.label}`}
              href={cta.href}
              className="rounded-xl border border-rec-border-strong px-6 py-3 text-sm font-semibold text-rec-text-secondary transition hover:bg-rec-bg-base"
            >
              {cta.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

