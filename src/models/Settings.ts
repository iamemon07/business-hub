import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { tenantPlugin } from "./plugins/tenant";

const WalletSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    number: { type: String, default: "" },
    accountType: { type: String, default: "Personal" },
    instructions: { type: String, default: "" },
  },
  { _id: false },
);

const PresetSchema = new Schema({ name: String, options: [String] }, { _id: false });

/**
 * One document per business (key = "site") holding all editable content, look & feel and
 * business configuration. Defaults are deliberately neutral — niche templates
 * (src/templates) fill in sensible values when a business is created.
 */
const SettingsSchema = new Schema(
  {
    key: { type: String, default: "site" },

    // Brand
    storeName: { type: String, default: "My Store" },
    tagline: { type: String, default: "" },
    logo: { type: String, default: "" },
    currencySymbol: { type: String, default: "৳" },
    /** Big/small lines of the text logo in the header & footer. */
    wordmark: {
      main: { type: String, default: "" },
      sub: { type: String, default: "" },
    },
    /** Handwritten-style accent lines in the mobile menu and footer. */
    scriptLines: {
      header: { type: String, default: "" },
      footer: { type: String, default: "" },
    },

    // Look & feel
    theme: {
      primary: { type: String, default: "#2b2b33" },
      accent: { type: String, default: "#c2410c" },
      background: { type: String, default: "#faf8f5" },
      /** elegant = serif headings, modern = clean sans-serif everywhere */
      font: { type: String, enum: ["elegant", "modern"], default: "elegant" },
    },

    // Catalog vocabulary — makes the same storefront work for any niche
    catalog: {
      variantLabel: { type: String, default: "Option" },
      variantPresets: { type: [PresetSchema], default: [{ name: "Single item", options: ["Standard"] }] },
      /** Spec fields offered on the product form, e.g. ["Material", "Dimensions"]. */
      specFields: { type: [String], default: [] },
      /** Which spec powers the shop filter, and the values to offer. */
      filterSpec: { type: String, default: "" },
      filterValues: { type: [String], default: [] },
      itemNoun: { type: String, default: "item" },
      itemNounPlural: { type: String, default: "items" },
      cartLabel: { type: String, default: "Cart" },
      careTabLabel: { type: String, default: "Details & Care" },
      defaultCare: { type: String, default: "" },
      imageAspect: { type: String, enum: ["3/4", "4/5", "1/1"], default: "4/5" },
    },

    // Contact
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    address: { type: String, default: "" },
    social: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      tiktok: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },

    // Announcement bar
    announcement: {
      enabled: { type: Boolean, default: false },
      text: { type: String, default: "" },
      link: { type: String, default: "/shop" },
    },

    // Homepage content
    home: {
      categoriesTitle: { type: String, default: "Shop by Category" },
      newArrivalsTitle: { type: String, default: "New Arrivals" },
      newArrivalsSubtitle: { type: String, default: "" },
      bestSellersTitle: { type: String, default: "Best Sellers" },
      bestSellersSubtitle: { type: String, default: "Loved by our customers" },
      storyTitle: { type: String, default: "Our Story" },
      storyText: { type: String, default: "" },
      storyImage: { type: String, default: "" },
      features: {
        type: [{ title: String, text: String, _id: false }],
        default: [
          { title: "Quality Products", text: "Carefully selected for you" },
          { title: "Fast Delivery", text: "Nationwide delivery" },
          { title: "Cash on Delivery", text: "Pay when you receive" },
          { title: "Friendly Support", text: "We're here to help" },
        ],
      },
    },

    // Shipping
    shipping: {
      insideCityLabel: { type: String, default: "Inside Dhaka" },
      outsideCityLabel: { type: String, default: "Outside Dhaka" },
      insideFee: { type: Number, default: 70 },
      outsideFee: { type: Number, default: 130 },
      freeShippingThreshold: { type: Number, default: 0 }, // 0 = disabled
      minDays: { type: Number, default: 2 },
      maxDays: { type: Number, default: 4 },
      weekendDays: { type: [Number], default: [5] }, // Friday
    },

    // Payments
    payments: {
      cod: { enabled: { type: Boolean, default: true }, instructions: { type: String, default: "Pay in cash when your parcel arrives." } },
      bkash: { type: WalletSchema, default: () => ({ enabled: false, accountType: "Personal", instructions: "Send Money to the number above, then enter your bKash number and Transaction ID." }) },
      nagad: { type: WalletSchema, default: () => ({ enabled: false, accountType: "Personal" }) },
      rocket: { type: WalletSchema, default: () => ({ enabled: false, accountType: "Personal" }) },
      bank: {
        enabled: { type: Boolean, default: false },
        details: { type: String, default: "" },
      },
    },

    // Orders & notifications
    orders: {
      /** Prefix for order numbers, e.g. "NV" → NV10001. */
      prefix: { type: String, default: "OR" },
      /** Where new-order alerts go (empty = no alert). */
      notifyEmail: { type: String, default: "" },
      timezone: { type: String, default: "Asia/Dhaka" },
    },

    // Invoice
    invoice: {
      footerNote: { type: String, default: "Thank you for shopping with us!" },
    },

    // SEO
    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
    },
    footerAbout: { type: String, default: "" },
  },
  { timestamps: true, minimize: false },
);
SettingsSchema.plugin(tenantPlugin);
SettingsSchema.index({ tenant: 1, key: 1 }, { unique: true });

export type SettingsDoc = InferSchemaType<typeof SettingsSchema>;
export const Settings = (models.Settings as Model<SettingsDoc>) || model("Settings", SettingsSchema);
