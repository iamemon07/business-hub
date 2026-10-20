import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { tenantPlugin } from "./plugins/tenant";

const AdminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["owner", "staff"], default: "staff" },
    active: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

AdminSchema.plugin(tenantPlugin);
AdminSchema.index({ tenant: 1, email: 1 }, { unique: true });

export type AdminDoc = InferSchemaType<typeof AdminSchema>;
export const Admin = (models.Admin as Model<AdminDoc>) || model("Admin", AdminSchema);
