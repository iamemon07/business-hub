import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { tenantPlugin } from "./plugins/tenant";

const VariantSchema = new Schema(
  {
    size: { type: String, required: true, trim: true },
    stock: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const SpecSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    sku: { type: String, trim: true, default: "" },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: Schema.Types.ObjectId, ref: "Category", index: true },
    images: { type: [String], default: [] },

    /** Regular selling price. */
    price: { type: Number, required: true, min: 0 },
    /** Product-level discount, 0–95%. */
    discountPercent: { type: Number, default: 0, min: 0, max: 95 },
    /** Denormalised final price (price after discount) — used for sorting/filtering. */
    salePrice: { type: Number, default: 0, min: 0, index: true },
    /** Your purchase/production cost per unit — powers profit & ROI reports. Never exposed publicly. */
    costPrice: { type: Number, default: 0, min: 0 },

    /**
     * Purchasable options. The business names them in Settings → catalog.variantLabel
     * (Size, Option, Storage, Weight…). Stored under `size` for historical reasons.
     */
    variants: { type: [VariantSchema], default: [] },
    colors: { type: [String], default: [] },
    /** Free-form attributes; the business picks which keys to use (Material, Fabric, Warranty…). */
    specs: { type: [SpecSchema], default: [] },
    care: { type: String, default: "" },
    tags: { type: [String], default: [] },

    isNewArrival: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },

    soldCount: { type: Number, default: 0 },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
  },
  { timestamps: true },
);

ProductSchema.plugin(tenantPlugin);
ProductSchema.index({ tenant: 1, slug: 1 }, { unique: true });
ProductSchema.index({ tenant: 1, active: 1, createdAt: -1 });
ProductSchema.index({ tenant: 1, active: 1, soldCount: -1 });

ProductSchema.pre("save", function (next) {
  const pct = Math.min(this.discountPercent || 0, 95);
  this.salePrice = pct > 0 ? Math.round(this.price * (1 - pct / 100)) : this.price;
  next();
});

export type ProductDoc = InferSchemaType<typeof ProductSchema>;
export const Product = (models.Product as Model<ProductDoc>) || model("Product", ProductSchema);
