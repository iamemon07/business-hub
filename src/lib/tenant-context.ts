import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Which business the current code path is acting for.
 *
 * Every tenant-scoped Mongoose model reads this (see models/plugins/tenant.ts) and adds
 * `{ tenant }` to all reads and writes. When no scope is set, queries fail instead of
 * leaking data across businesses.
 *
 * - `{ tenantId }`   → normal storefront / store-admin requests and per-business scripts
 * - `{ platform }`   → super-admin code that deliberately reads across all businesses
 */
export type TenantScope = { tenantId: string; platform?: false } | { platform: true; tenantId?: undefined };

/**
 * Process-wide singletons. Next can load this module more than once (separate route bundles),
 * while Mongoose models — and therefore the tenant plugin — are registered only once globally.
 * Keeping the storage on globalThis guarantees every copy reads and writes the same context.
 */
const g = globalThis as unknown as {
  __tenantScope?: AsyncLocalStorage<TenantScope>;
  __tenantRequestResolver?: (() => Promise<string | null>) | null;
};
const storage = (g.__tenantScope ??= new AsyncLocalStorage<TenantScope>());

/**
 * Runs `fn` for one business. The result is awaited *inside* the scope on purpose: Mongoose
 * queries are lazy thenables, so `runWithTenant(id, () => Model.find())` would otherwise run the
 * query after the scope has ended — i.e. with the caller's scope (possibly unfiltered).
 */
export function runWithTenant<T>(tenantId: string, fn: () => T): Promise<Awaited<T>> {
  return storage.run({ tenantId: String(tenantId) }, async (): Promise<Awaited<T>> => await fn());
}

/** Runs `fn` with tenant filtering disabled. Only for platform-wide (super admin) reporting. */
export function runAsPlatform<T>(fn: () => T): Promise<Awaited<T>> {
  return storage.run({ platform: true }, async (): Promise<Awaited<T>> => await fn());
}

export function getTenantScope(): TenantScope | undefined {
  return storage.getStore();
}

/**
 * Fallback for Server Components, where nothing wraps the render in `runWithTenant`:
 * lib/tenant.ts registers a resolver that maps the request's Host header to a business.
 * Kept as a registry so models never import next/headers (scripts load models too).
 */
export function setRequestTenantResolver(fn: () => Promise<string | null>) {
  g.__tenantRequestResolver = fn;
}

export class TenantScopeError extends Error {
  constructor(model: string) {
    super(`No business context for a query on "${model}". Wrap the code in runWithTenant() or call it during a store request.`);
  }
}

/** Resolves the scope for a query: explicit scope first, then the current request's host. */
export async function resolveScope(model: string): Promise<TenantScope> {
  const scope = storage.getStore();
  if (scope) return scope;
  const fromRequest = await g.__tenantRequestResolver?.().catch(() => null);
  if (fromRequest) return { tenantId: fromRequest };
  throw new TenantScopeError(model);
}
