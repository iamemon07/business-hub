import { Schema, model, models, type Model } from "mongoose";
import { tenantPlugin } from "./plugins/tenant";

type CounterDoc = { name: string; seq: number };

const CounterSchema = new Schema<CounterDoc>({
  name: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
CounterSchema.plugin(tenantPlugin);
CounterSchema.index({ tenant: 1, name: 1 }, { unique: true });

export const Counter = (models.Counter as Model<CounterDoc>) || model<CounterDoc>("Counter", CounterSchema);

/** Atomic, gap-tolerant per-business sequence — safe under concurrent checkouts. */
export async function nextSequence(name: string) {
  const doc = await Counter.findOneAndUpdate({ name }, { $inc: { seq: 1 } }, { new: true, upsert: true }).lean();
  return doc!.seq;
}
