import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 text-center">
      <p className="eyebrow">404</p>
      <h1 className="heading-display mt-2 text-5xl">Page not found</h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        The page you&apos;re looking for doesn&apos;t exist, or this store address isn&apos;t set up yet.
      </p>
      <Link href="/" className="btn-primary mt-8">Back to Home</Link>
    </div>
  );
}
