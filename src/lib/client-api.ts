"use client";

/** Small fetch wrapper for the admin panel: JSON in/out, throws on API errors. */
export async function api<T = unknown>(url: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: opts.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    body: opts.body instanceof FormData ? opts.body : opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  if (res.status === 401 && typeof window !== "undefined") {
    const login = window.location.pathname.startsWith("/console") ? "/console/login" : "/admin/login";
    window.location.href = `${login}?next=${encodeURIComponent(window.location.pathname)}`;
  }
  const json = await res.json().catch(() => ({ success: false, error: "Unexpected server response" }));
  if (!json.success) throw new Error(json.error || "Request failed");
  return json.data as T;
}
