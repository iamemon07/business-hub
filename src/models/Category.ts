import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { tenantPlugin } from "./plugins/tenant";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    showOnHome: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

CategorySchema.plugin(tenantPlugin);
CategorySchema.index({ tenant: 1, slug: 1 }, { unique: true });

export type CategoryDoc = InferSchemaType<typeof CategorySchema>;
export const Category = (models.Category as Model<CategoryDoc>) || model("Category", CategorySchema);
