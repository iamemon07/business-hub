import "server-only";
import { isValidObjectId, type Model } from "mongoose";
import type { ZodTypeAny } from "zod";
import { adminRoute, ApiError, ok, readJson } from "./api";
import { revalidateTenant, type TagName } from "@/services/settings";

type CrudOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>;
  schema: ZodTypeAny;
  tags?: TagName[];
  sort?: Record<string, 1 | -1>;
  /** Normalise validated data before persisting (e.g. derive slug). */
  transform?: (data: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>;
  /** Guard before deletion (e.g. block deleting a category with products). */
  beforeDelete?: (id: string) => Promise<void>;
  ownerOnly?: boolean;
};

function revalidate(tenantId: string, tags?: TagName[]) {
  if (tags?.length) revalidateTenant(tenantId, ...tags);
}

/** GET (list) + POST (create) for a collection. */
export function collectionHandlers(opts: CrudOptions) {
  return {
    GET: adminRoute(async () => {
      const docs = await opts.model.find().sort(opts.sort ?? { createdAt: -1 }).limit(1000).lean();
      return ok(docs);
    }, { ownerOnly: opts.ownerOnly }),
    POST: adminRoute(async (req, { tenant }) => {
      let data = opts.schema.parse(await readJson(req));
      if (opts.transform) data = await opts.transform(data);
      const doc = await opts.model.create(data);
      revalidate(tenant.id, opts.tags);
      return ok(doc.toObject(), { status: 201 });
    }, { ownerOnly: opts.ownerOnly }),
  };
}

/** GET / PUT / DELETE for a single document. */
export function itemHandlers(opts: CrudOptions) {
  const getId = async (params: Promise<{ id: string }>) => {
    const { id } = await params;
    if (!isValidObjectId(id)) throw new ApiError(400, "Invalid id");
    return id;
  };
  return {
    GET: adminRoute<{ id: string }>(async (_req, { params }) => {
      const doc = await opts.model.findById(await getId(params)).lean();
      if (!doc) throw new ApiError(404, "Not found");
      return ok(doc);
    }, { ownerOnly: opts.ownerOnly }),
    PUT: adminRoute<{ id: string }>(async (req, { params, tenant }) => {
      const id = await getId(params);
      let data = opts.schema.parse(await readJson(req));
      if (opts.transform) data = await opts.transform(data);
      const doc = await opts.model.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
      if (!doc) throw new ApiError(404, "Not found");
      revalidate(tenant.id, opts.tags);
      return ok(doc);
    }, { ownerOnly: opts.ownerOnly }),
    DELETE: adminRoute<{ id: string }>(async (_req, { params, tenant }) => {
      const id = await getId(params);
      if (opts.beforeDelete) await opts.beforeDelete(id);
      const doc = await opts.model.findByIdAndDelete(id).lean();
      if (!doc) throw new ApiError(404, "Not found");
      revalidate(tenant.id, opts.tags);
      return ok({ id });
    }, { ownerOnly: opts.ownerOnly }),
  };
}
