import { Schema, Types, type Query, type Aggregate, type Document } from "mongoose";
import { resolveScope } from "@/lib/tenant-context";

/**
 * Multi-tenancy guard. Adds a required `tenant` field and transparently:
 *  - filters every query / aggregate by the current business,
 *  - stamps the business on every new document,
 *  - prevents moving a document to another business via updates.
 *
 * In platform scope (super admin reporting) nothing is filtered, so that code must
 * filter or group by `tenant` itself.
 */
const QUERY_HOOKS = [
  "find",
  "findOne",
  "findOneAndUpdate",
  "findOneAndDelete",
  "findOneAndReplace",
  "countDocuments",
  "updateOne",
  "updateMany",
  "deleteOne",
  "deleteMany",
  "replaceOne",
  "distinct",
] as const;

function stripTenantFromUpdate(update: unknown) {
  if (!update || typeof update !== "object" || Array.isArray(update)) return;
  const u = update as Record<string, unknown>;
  delete u.tenant;
  for (const op of ["$set", "$setOnInsert", "$unset", "$rename"]) {
    const part = u[op] as Record<string, unknown> | undefined;
    if (part && typeof part === "object") delete part.tenant;
  }
}

export function tenantPlugin(schema: Schema) {
  schema.add({ tenant: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true, immutable: true } });

  schema.pre(new RegExp(`^(${QUERY_HOOKS.join("|")})$`), { document: false, query: true }, async function (this: Query<unknown, unknown>) {
    if (typeof this.where !== "function") return; // document-level hook (e.g. doc.deleteOne()) — the doc was loaded scoped
    const scope = await resolveScope(this.model.modelName);
    if (scope.platform) return;
    this.where({ tenant: new Types.ObjectId(scope.tenantId) });
    stripTenantFromUpdate(this.getUpdate());
  });

  schema.pre("estimatedDocumentCount", async function (this: Query<unknown, unknown>) {
    const scope = await resolveScope(this.model.modelName);
    if (!scope.platform) throw new Error("estimatedDocumentCount cannot be scoped to a business; use countDocuments");
  });

  schema.pre("aggregate", async function (this: Aggregate<unknown>) {
    const modelName = (this as unknown as { _model?: { modelName: string } })._model?.modelName ?? "aggregate";
    const scope = await resolveScope(modelName);
    if (scope.platform) return;
    this.pipeline().unshift({ $match: { tenant: new Types.ObjectId(scope.tenantId) } });
  });

  // Stamp before validation (validation runs before pre("save") and `tenant` is required)…
  schema.pre("validate", async function (this: Document & { tenant?: Types.ObjectId }) {
    const scope = await resolveScope((this.constructor as { modelName?: string }).modelName ?? "document");
    if (scope.platform) {
      if (!this.tenant) throw new Error("Platform code must set `tenant` explicitly when creating business data");
      return;
    }
    if (this.isNew && !this.tenant) this.tenant = new Types.ObjectId(scope.tenantId);
  });

  // …and re-check on save (covers save({ validateBeforeSave: false })).
  schema.pre("save", async function (this: Document & { tenant?: Types.ObjectId }) {
    const scope = await resolveScope((this.constructor as { modelName?: string }).modelName ?? "document");
    if (scope.platform) return;
    if (!this.tenant && this.isNew) this.tenant = new Types.ObjectId(scope.tenantId);
    if (String(this.tenant) !== scope.tenantId) throw new Error("Cross-business write blocked");
  });

  schema.pre("insertMany", function (this: { modelName: string }, next: (err?: Error) => void, docs: unknown) {
    resolveScope(this.modelName)
      .then((scope) => {
        const list = (Array.isArray(docs) ? docs : [docs]) as { tenant?: unknown }[];
        for (const d of list) {
          if (scope.platform) {
            if (!d.tenant) throw new Error("Platform code must set `tenant` explicitly when creating business data");
          } else {
            if (d.tenant && String(d.tenant) !== scope.tenantId) throw new Error("Cross-business write blocked");
            d.tenant = new Types.ObjectId(scope.tenantId);
          }
        }
        next();
      })
      .catch((err: Error) => next(err));
  });
}
