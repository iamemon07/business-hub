import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { tenantPlugin } from "./plugins/tenant";

const BannerSchema = new Schema(
  {
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    image: { type: String, required: true },
    mobileImage: { type: String, default: "" },
    link: { type: String, default: "/shop" },
    ctaText: { type: String, default: "Shop Now" },
    /** hero = homepage slider, promo = mid-page promotional banners */
    placement: { type: String, enum: ["hero", "promo"], default: "hero" },
    /** When the banner image already contains text (like the brand banner), hide the overlay. */
    showOverlayText: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

BannerSchema.plugin(tenantPlugin);

export type BannerDoc = InferSchemaType<typeof BannerSchema>;
export const Banner = (models.Banner as Model<BannerDoc>) || model("Banner", BannerSchema);
