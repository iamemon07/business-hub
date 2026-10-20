import Link from "next/link";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  href,
  linkText = "View All",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="mb-10 flex flex-col items-center text-center">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="heading-display text-4xl sm:text-5xl">{title}</h2>
      <div className="mt-4 flex items-center gap-3 text-rose" aria-hidden>
        <span className="h-px w-10 bg-blush-300" />
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M12 3c1.5 3 1.5 6 0 9-1.5-3-1.5-6 0-9zm-6 5c3 .5 5 2.5 6 5-3-.5-5-2.5-6-5zm12 0c-1 2.5-3 4.5-6 5 1-2.5 3-4.5 6-5z" />
        </svg>
        <span className="h-px w-10 bg-blush-300" />
      </div>
      {subtitle && <p className="mt-4 max-w-xl text-sm text-muted">{subtitle}</p>}
      {href && (
        <Link href={href} className="mt-4 text-xs uppercase tracking-[0.25em] text-rose underline-offset-8 hover:underline">
          {linkText}
        </Link>
      )}
    </div>
  );
}
