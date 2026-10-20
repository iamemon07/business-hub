import { isValidObjectId } from "mongoose";
import { ApiError, ok, platformRoute, readJson } from "@/lib/api";
import { leadUpdateSchema } from "@/lib/platform-validators";
import { Lead } from "@/models/platform";

async function id(params: Promise<{ id: string }>) {
  const { id } = await params;
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid id");
  return id;
}

export const PUT = platformRoute<{ id: string }>(async (req, { params }) => {
  const doc = await Lead.findByIdAndUpdate(await id(params), leadUpdateSchema.parse(await readJson(req)), { new: true }).lean();
  if (!doc) throw new ApiError(404, "Lead not found");
  return ok(doc);
});

export const DELETE = platformRoute<{ id: string }>(async (_req, { params }) => {
  const leadId = await id(params);
  await Lead.deleteOne({ _id: leadId });
  return ok({ id: leadId });
});
