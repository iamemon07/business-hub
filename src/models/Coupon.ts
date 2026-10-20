import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { tenantPlugin } from "./plugins/tenant";

const CouponSchema = new Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["percent", "fixed"], default: "percent" },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 }, // 0 = no cap
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    startsAt: Date,
    expiresAt: Date,
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

CouponSchema.plugin(tenantPlugin);
CouponSchema.index({ tenant: 1, code: 1 }, { unique: true });

export type CouponDoc = InferSchemaType<typeof CouponSchema>;
export const Coupon = (models.Coupon as Model<CouponDoc>) || model("Coupon", CouponSchema);
