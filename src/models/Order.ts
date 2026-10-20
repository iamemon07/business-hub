import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { tenantPlugin } from "./plugins/tenant";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;
export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export const PAYMENT_METHODS = ["cod", "bkash", "nagad", "rocket", "bank"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    name: String,
    slug: String,
    image: String,
    size: String,
    color: String,
    quantity: { type: Number, min: 1 },
    unitPrice: Number,
    /** Snapshot of cost at time of sale so historical P&L stays accurate. */
    unitCost: { type: Number, default: 0 },
    lineTotal: Number,
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true, index: true },
      email: { type: String, default: "", lowercase: true },
    },
    shipping: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      area: { type: String, default: "" },
      zone: { type: String, enum: ["inside", "outside"], default: "inside" },
      note: { type: String, default: "" },
    },
    items: { type: [OrderItemSchema], required: true },

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, required: true },

    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: "cod" },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "pending" },
    transactionId: { type: String, default: "" },
    senderNumber: { type: String, default: "" },

    status: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },
    statusHistory: {
      type: [{ status: String, note: String, at: { type: Date, default: Date.now }, _id: false }],
      default: [],
    },
    estimatedDelivery: { from: Date, to: Date },
    /** Actual courier cost you paid — feeds P&L. */
    courierCost: { type: Number, default: 0 },
    trackingCode: { type: String, default: "" },
    adminNote: { type: String, default: "" },
    invoiceSentAt: Date,
    deliveredAt: Date,
  },
  { timestamps: true },
);

OrderSchema.plugin(tenantPlugin);
OrderSchema.index({ tenant: 1, orderNumber: 1 }, { unique: true });
OrderSchema.index({ tenant: 1, createdAt: -1 });
OrderSchema.index({ tenant: 1, status: 1 });

export type OrderDoc = InferSchemaType<typeof OrderSchema>;
export const Order = (models.Order as Model<OrderDoc>) || model("Order", OrderSchema);
