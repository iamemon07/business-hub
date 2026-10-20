"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="heading-display text-4xl">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        We couldn&apos;t load this page. If you just set up the site, make sure your database credentials in <code>.env.local</code> are correct.
      </p>
      <button onClick={reset} className="btn-primary mt-8">Try Again</button>
    </div>
  );
}
