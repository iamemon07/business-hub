import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { tenantPlugin } from "./plugins/tenant";

const PageSchema = new Schema(
  {
    slug: { type: String, required: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    /** Plain text — blank lines become paragraphs, lines starting with "## " become headings. */
    content: { type: String, default: "" },
    showInFooter: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

PageSchema.plugin(tenantPlugin);
PageSchema.index({ tenant: 1, slug: 1 }, { unique: true });

export type PageDoc = InferSchemaType<typeof PageSchema>;
export const Page = (models.Page as Model<PageDoc>) || model("Page", PageSchema);
