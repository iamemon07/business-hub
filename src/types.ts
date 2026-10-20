/** Plain, serialisable shapes shared between server and client components. */

export type CategoryDTO = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
  showOnHome: boolean;
  active: boolean;
};

export type ProductDTO = {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  category?: { _id: string; name: string; slug: string } | null;
  images: string[];
  price: number;
  discountPercent: number;
  salePrice: number;
  costPrice?: number;
  variants: { size: string; stock: number }[];
  colors: string[];
  specs: { key: string; value: string }[];
  care: string;
  tags: string[];
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  active: boolean;
  soldCount: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
};

export type BannerDTO = {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  mobileImage: string;
  link: string;
  ctaText: string;
  placement: "hero" | "promo";
  showOverlayText: boolean;
  sortOrder: number;
  active: boolean;
};

export type ThemeDTO = { primary: string; accent: string; background: string; font: "elegant" | "modern" };

export type CatalogDTO = {
  variantLabel: string;
  variantPresets: { name: string; options: string[] }[];
  specFields: string[];
  filterSpec: string;
  filterValues: string[];
  itemNoun: string;
  itemNounPlural: string;
  cartLabel: string;
  careTabLabel: string;
  defaultCare: string;
  imageAspect: "3/4" | "4/5" | "1/1";
};

export type WalletDTO = { enabled: boolean; number: string; accountType: string; instructions: string };

export type SettingsDTO = {
  storeName: string;
  tagline: string;
  logo: string;
  currencySymbol: string;
  wordmark: { main: string; sub: string };
  scriptLines: { header: string; footer: string };
  theme: ThemeDTO;
  catalog: CatalogDTO;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  social: { facebook: string; instagram: string; tiktok: string; youtube: string };
  announcement: { enabled: boolean; text: string; link: string };
  home: {
    categoriesTitle: string;
    newArrivalsTitle: string;
    newArrivalsSubtitle: string;
    bestSellersTitle: string;
    bestSellersSubtitle: string;
    storyTitle: string;
    storyText: string;
    storyImage: string;
    features: { title: string; text: string }[];
  };
  shipping: {
    insideCityLabel: string;
    outsideCityLabel: string;
    insideFee: number;
    outsideFee: number;
    freeShippingThreshold: number;
    minDays: number;
    maxDays: number;
    weekendDays: number[];
  };
  payments: {
    cod: { enabled: boolean; instructions: string };
    bkash: WalletDTO;
    nagad: WalletDTO;
    rocket: WalletDTO;
    bank: { enabled: boolean; details: string };
  };
  orders: { prefix: string; notifyEmail: string; timezone: string };
  invoice: { footerNote: string };
  seo: { title: string; description: string };
  footerAbout: string;
};

export type OrderItemDTO = {
  product: string;
  name: string;
  slug: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  lineTotal: number;
};

export type OrderDTO = {
  _id: string;
  orderNumber: string;
  customer: { name: string; phone: string; email: string };
  shipping: { address: string; city: string; area: string; zone: "inside" | "outside"; note: string };
  items: OrderItemDTO[];
  subtotal: number;
  discount: number;
  couponCode: string;
  shippingFee: number;
  total: number;
  paymentMethod: "cod" | "bkash" | "nagad" | "rocket" | "bank";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  transactionId: string;
  senderNumber: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
  statusHistory: { status: string; note: string; at: string }[];
  estimatedDelivery: { from: string; to: string };
  courierCost: number;
  trackingCode: string;
  adminNote: string;
  invoiceSentAt?: string;
  createdAt: string;
};

export type PageDTO = {
  _id: string;
  slug: string;
  title: string;
  content: string;
  showInFooter: boolean;
  active: boolean;
};

export const PAYMENT_LABELS: Record<OrderDTO["paymentMethod"], string> = {
  cod: "Cash on Delivery",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  bank: "Bank Transfer",
};

export const STATUS_LABELS: Record<OrderDTO["status"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

/** A business on the platform, as seen by its own storefront/admin. */
export type TenantInfo = {
  id: string;
  name: string;
  slug: string;
  status: "trial" | "active" | "suspended" | "cancelled";
  template: string;
  url: string;
  trialEndsAt?: string;
  paidUntil?: string;
  plan?: { name: string; limits: { products: number; staff: number; customDomain: boolean } } | null;
};
