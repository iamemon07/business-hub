/**
 * Niche templates: the starting point for a new business. A template only pre-fills data —
 * the storefront code is identical for every niche, and owners can change every value later
 * in Admin → Site Settings. Add a niche by adding an entry to TEMPLATES.
 */
import type { CatalogDTO, ThemeDTO } from "@/types";

type Page = { slug: string; title: string; content: string };
type Category = { name: string; slug: string; description: string };

export type BusinessTemplate = {
  key: string;
  name: string;
  description: string;
  /** Short example list shown on the picker. */
  examples: string;
  theme: ThemeDTO;
  catalog: CatalogDTO;
  tagline: string;
  scriptLines: { header: string; footer: string };
  announcement: string;
  home: {
    newArrivalsSubtitle: string;
    bestSellersSubtitle: string;
    storyTitle: string;
    storyText: string;
    features: { title: string; text: string }[];
  };
  footerAbout: string;
  invoiceNote: string;
  categories: Category[];
  pages: Page[];
};

const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const cats = (list: [string, string][]): Category[] => list.map(([name, description]) => ({ name, slug: slug(name), description }));

/* ───────────── Pages every store gets (business name filled in at creation) ───────────── */
export function commonPages(storeName: string): Page[] {
  return [
    {
      slug: "about",
      title: "About Us",
      content: `## Welcome to ${storeName}

We started ${storeName} with a simple goal — to bring you products we truly love, at honest prices, with service you can count on.

## Our Promise
- Carefully selected, quality products
- Honest pricing
- Fast, reliable delivery
- Friendly support, before and after your order`,
    },
    {
      slug: "shipping-policy",
      title: "Shipping & Delivery",
      content: `## Delivery Time
Orders are usually delivered within a few working days of confirmation. Weekends and public holidays are not counted.

## Delivery Charges
Delivery charges depend on your location and are shown at checkout before you place the order.

## Order Confirmation
After you place an order, our team will contact you to confirm it before dispatch.`,
    },
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      content: `We collect only the information needed to process and deliver your order — your name, phone number, email and address.

We never sell or share your personal information with third parties, except delivery partners who need your address and phone number to deliver your parcel.

For any privacy questions, please contact us.`,
    },
    {
      slug: "terms",
      title: "Terms & Conditions",
      content: `By placing an order on our website you agree to these terms.

## Pricing
All prices include applicable taxes and may change without prior notice.

## Orders
We may cancel orders in case of stock unavailability, pricing errors or suspected fraud. You will be notified and refunded where applicable.

## Product Images
Actual colors may vary slightly from images due to screen settings and lighting.`,
    },
  ];
}

const returnsPage = (body: string): Page => ({ slug: "return-policy", title: "Returns & Exchanges", content: body });

/* ───────────── Templates ───────────── */
export const TEMPLATES: BusinessTemplate[] = [
  {
    key: "fashion",
    name: "Fashion & Clothing",
    description: "Elegant storefront for apparel with sizes, fabric details and a size guide.",
    examples: "Kurtis, sarees, abayas, menswear, kidswear",
    theme: { primary: "#4a1f17", accent: "#b87a64", background: "#fbf6f1", font: "elegant" },
    catalog: {
      variantLabel: "Size",
      variantPresets: [
        { name: "S–XL", options: ["S", "M", "L", "XL"] },
        { name: "XS–XXL", options: ["XS", "S", "M", "L", "XL", "XXL"] },
        { name: "Free Size", options: ["Free Size"] },
        { name: "Numeric 36–44", options: ["36", "38", "40", "42", "44"] },
      ],
      specFields: ["Fabric", "Fit", "Length"],
      filterSpec: "Fabric",
      filterValues: ["Cotton", "Linen", "Georgette", "Silk", "Viscose", "Chiffon"],
      itemNoun: "piece",
      itemNounPlural: "pieces",
      cartLabel: "Bag",
      careTabLabel: "Fabric & Care",
      defaultCare: "Gentle hand wash in cold water. Dry in shade. Iron on low heat.",
      imageAspect: "3/4",
    },
    tagline: "Style That Feels Like You",
    scriptLines: { header: "Style that feels like you", footer: "Fashion for every version of you" },
    announcement: "Free delivery on orders over ৳3,000 · Easy size exchange",
    home: {
      newArrivalsSubtitle: "Fresh silhouettes, crafted for every version of you",
      bestSellersSubtitle: "Loved by our community",
      storyTitle: "Modern Styles, Timeless Elegance",
      storyText:
        "Every piece is chosen with care — breathable fabrics, graceful cuts and delicate details designed to make you feel effortlessly you.",
      features: [
        { title: "Premium Fabrics", text: "Soft, breathable & made to last" },
        { title: "Fast Delivery", text: "2–4 working days nationwide" },
        { title: "Cash on Delivery", text: "Pay when you receive" },
        { title: "Easy Exchange", text: "Hassle-free size exchange" },
      ],
    },
    footerAbout: "Modern styles, timeless elegance — thoughtfully curated clothing for every version of you.",
    invoiceNote: "Thank you for shopping with us! For size exchanges, contact us within 3 days of delivery.",
    categories: cats([
      ["Kurtis", "Graceful everyday & festive kurtis."],
      ["Three Pieces", "Complete sets with kameez, salwar & dupatta."],
      ["Modest Wear", "Elegant abayas, hijabs and modest essentials."],
      ["Co-ord Sets", "Effortlessly matched, endlessly chic."],
    ]),
    pages: [
      returnsPage(`## Easy Exchange
If the size doesn't fit, you can request an exchange within 3 days of receiving your parcel.

## Conditions
- Items must be unused, unwashed and with original tags
- Sale items are eligible for size exchange only`),
      {
        slug: "size-guide",
        title: "Size Guide",
        content: `## How to Measure
- Bust: around the fullest part of your bust
- Waist: around your natural waistline
- Hip: around the fullest part of your hips

## Standard Sizes (inches)
- S: Bust 36 · Waist 30 · Hip 38
- M: Bust 38 · Waist 32 · Hip 40
- L: Bust 40 · Waist 34 · Hip 42
- XL: Bust 42 · Waist 36 · Hip 44`,
      },
    ],
  },
  {
    key: "home-decor",
    name: "Home Decor",
    description: "Warm, earthy storefront for decor with materials, dimensions and damage protection.",
    examples: "Vases, wall art, lighting, cushions, mirrors",
    theme: { primary: "#2e3b32", accent: "#a8693f", background: "#f7f4ee", font: "elegant" },
    catalog: {
      variantLabel: "Option",
      variantPresets: [
        { name: "Small / Medium / Large", options: ["Small", "Medium", "Large"] },
        { name: "Single / Set of 2 / Set of 3", options: ["Single", "Set of 2", "Set of 3"] },
        { name: 'Cushion 16" / 18" / 20"', options: ['16" × 16"', '18" × 18"', '20" × 20"'] },
        { name: "Frame A4 / A3 / A2", options: ["A4", "A3", "A2"] },
      ],
      specFields: ["Material", "Dimensions"],
      filterSpec: "Material",
      filterValues: ["Ceramic", "Wood", "Metal", "Glass", "Rattan", "Cotton", "Marble", "Resin"],
      itemNoun: "piece",
      itemNounPlural: "pieces",
      cartLabel: "Bag",
      careTabLabel: "Material & Care",
      defaultCare: "Wipe gently with a soft, dry cloth. Keep away from direct sunlight and moisture. Avoid harsh chemicals.",
      imageAspect: "4/5",
    },
    tagline: "Where Every Corner Feels Like Home",
    scriptLines: { header: "Where every corner feels like home", footer: "Curated for the home you love" },
    announcement: "Free delivery on orders over ৳5,000 · Every piece safely packed",
    home: {
      newArrivalsSubtitle: "Fresh finds to refresh every room",
      bestSellersSubtitle: "The pieces our customers keep coming back for",
      storyTitle: "Spaces That Tell Your Story",
      storyText:
        "Every vase, lamp, cushion and frame is handpicked for its craft, texture and warmth — so you can create spaces that are calm, beautiful and truly lived-in.",
      features: [
        { title: "Handpicked Pieces", text: "Curated for quality & craft" },
        { title: "Safe Delivery", text: "Carefully packed, 2–5 working days" },
        { title: "Cash on Delivery", text: "Pay when you receive" },
        { title: "Damage Protection", text: "Free replacement if it arrives broken" },
      ],
    },
    footerAbout: "Handpicked home decor to make every corner feel like home — carefully packed and delivered to your door.",
    invoiceNote: "Thank you for your order! If anything arrives damaged, message us within 48 hours with your unboxing video.",
    categories: cats([
      ["Vases & Planters", "Ceramic vases, planters and pots to bring life to every shelf."],
      ["Wall Decor", "Frames, wall art and hangings that turn blank walls into stories."],
      ["Lighting", "Table lamps, lanterns and warm-glow pieces for cosy evenings."],
      ["Cushions & Throws", "Soft textures and color for sofas and beds."],
      ["Tableware", "Plates, mugs and serveware for everyday hosting."],
      ["Decor Accents", "Sculptures, trays, bookends and finishing touches."],
    ]),
    pages: [
      returnsPage(`## Arrived Damaged?
If any item arrives broken or damaged, message us within 48 hours of delivery with photos and an unboxing video, and we will send a free replacement or a full refund.

## Change of Mind
Unused items in original packaging can be returned within 3 days of delivery. Delivery charges for change-of-mind returns are paid by the customer.`),
      {
        slug: "care-guide",
        title: "Care Guide",
        content: `## Ceramics & Glass
- Wipe with a soft, damp cloth; avoid abrasive cleaners

## Wood & Rattan
- Dust regularly; keep away from direct sunlight and damp walls

## Cushions & Throws
- Wash covers gently in cold water; dry in shade`,
      },
    ],
  },
  {
    key: "electronics",
    name: "Electronics & Gadgets",
    description: "Clean, modern storefront with storage/model options, brand and warranty specs.",
    examples: "Phones, accessories, smart watches, audio",
    theme: { primary: "#111827", accent: "#2563eb", background: "#f8fafc", font: "modern" },
    catalog: {
      variantLabel: "Variant",
      variantPresets: [
        { name: "Storage 64/128/256 GB", options: ["64 GB", "128 GB", "256 GB"] },
        { name: "RAM + Storage", options: ["4/64 GB", "6/128 GB", "8/256 GB"] },
        { name: "Pack size", options: ["Single", "Pack of 2"] },
      ],
      specFields: ["Brand", "Model", "Warranty", "Connectivity"],
      filterSpec: "Brand",
      filterValues: ["Apple", "Samsung", "Xiaomi", "Anker", "Baseus", "JBL"],
      itemNoun: "product",
      itemNounPlural: "products",
      cartLabel: "Cart",
      careTabLabel: "Warranty & Support",
      defaultCare: "Covered by the official brand warranty listed above. Keep your invoice for warranty claims. Physical or liquid damage is not covered.",
      imageAspect: "1/1",
    },
    tagline: "Genuine Gadgets, Honest Prices",
    scriptLines: { header: "", footer: "" },
    announcement: "100% genuine products · Official warranty · Cash on delivery",
    home: {
      newArrivalsSubtitle: "The latest tech, just landed",
      bestSellersSubtitle: "Most popular with our customers",
      storyTitle: "Tech You Can Trust",
      storyText: "We source only genuine products with official warranty, test before dispatch and support you after the sale.",
      features: [
        { title: "100% Genuine", text: "Official & authentic products" },
        { title: "Warranty", text: "Brand warranty on every item" },
        { title: "Cash on Delivery", text: "Pay when you receive" },
        { title: "Fast Delivery", text: "Nationwide, 1–3 working days" },
      ],
    },
    footerAbout: "Genuine gadgets and accessories with official warranty, honest prices and real after-sales support.",
    invoiceNote: "Thank you for your purchase! Keep this invoice for warranty claims.",
    categories: cats([
      ["Smartphones", "Latest phones from top brands."],
      ["Audio", "Earbuds, headphones and speakers."],
      ["Wearables", "Smart watches and fitness bands."],
      ["Accessories", "Chargers, cables, cases and power banks."],
    ]),
    pages: [
      returnsPage(`## 7-Day Replacement
If your product has a manufacturing defect, report it within 7 days of delivery for a replacement.

## Conditions
- Product, box and accessories must be complete and undamaged
- Physical or liquid damage is not covered`),
      {
        slug: "warranty",
        title: "Warranty Policy",
        content: `## Brand Warranty
Warranty periods are listed on each product page and are provided by the official brand or distributor.

## How to Claim
Contact us with your order number and a short description or video of the issue. Keep your invoice.`,
      },
    ],
  },
  {
    key: "beauty",
    name: "Beauty & Cosmetics",
    description: "Soft, premium storefront for skincare and makeup with shades and skin-type specs.",
    examples: "Skincare, makeup, haircare, fragrance",
    theme: { primary: "#3b1d2e", accent: "#d9467a", background: "#fff7f9", font: "elegant" },
    catalog: {
      variantLabel: "Size",
      variantPresets: [
        { name: "30 / 50 / 100 ml", options: ["30 ml", "50 ml", "100 ml"] },
        { name: "Shades", options: ["Light", "Medium", "Tan", "Deep"] },
        { name: "Mini / Full size", options: ["Mini", "Full Size"] },
      ],
      specFields: ["Brand", "Skin Type", "Key Ingredients", "Origin"],
      filterSpec: "Skin Type",
      filterValues: ["All", "Oily", "Dry", "Combination", "Sensitive"],
      itemNoun: "product",
      itemNounPlural: "products",
      cartLabel: "Bag",
      careTabLabel: "How to Use",
      defaultCare: "Patch test before first use. Store in a cool, dry place away from direct sunlight. For external use only.",
      imageAspect: "4/5",
    },
    tagline: "Glow, Naturally",
    scriptLines: { header: "Glow, naturally", footer: "Beauty that feels like you" },
    announcement: "100% authentic beauty · Free delivery over ৳2,500",
    home: {
      newArrivalsSubtitle: "Fresh drops for your routine",
      bestSellersSubtitle: "Cult favourites our customers swear by",
      storyTitle: "Authentic Beauty, Delivered",
      storyText: "We bring you authentic skincare and cosmetics, sourced directly and stored right — so you get exactly what you paid for.",
      features: [
        { title: "100% Authentic", text: "Sourced directly from brands" },
        { title: "Fast Delivery", text: "Nationwide delivery" },
        { title: "Cash on Delivery", text: "Pay when you receive" },
        { title: "Expert Advice", text: "Ask us about your routine" },
      ],
    },
    footerAbout: "Authentic skincare, makeup and haircare — carefully sourced and delivered to your door.",
    invoiceNote: "Thank you for shopping with us! Please patch test new products before use.",
    categories: cats([
      ["Skincare", "Cleansers, serums, moisturisers and sunscreen."],
      ["Makeup", "Face, eyes and lips."],
      ["Haircare", "Shampoos, oils and treatments."],
      ["Fragrance", "Perfumes and body mists."],
    ]),
    pages: [
      returnsPage(`## Hygiene Policy
For hygiene reasons, opened or used beauty products cannot be returned.

## Damaged or Wrong Item
If you receive a damaged or incorrect item, contact us within 48 hours with photos and we'll replace it free of charge.`),
    ],
  },
  {
    key: "grocery",
    name: "Grocery & Food",
    description: "Fresh, friendly storefront with weight/pack options and origin details.",
    examples: "Organic food, honey, spices, snacks, dry goods",
    theme: { primary: "#14532d", accent: "#ea580c", background: "#fbfaf4", font: "modern" },
    catalog: {
      variantLabel: "Weight",
      variantPresets: [
        { name: "250 g / 500 g / 1 kg", options: ["250 g", "500 g", "1 kg"] },
        { name: "500 ml / 1 L", options: ["500 ml", "1 L"] },
        { name: "Pack of 1 / 3 / 6", options: ["Pack of 1", "Pack of 3", "Pack of 6"] },
      ],
      specFields: ["Origin", "Shelf Life", "Ingredients"],
      filterSpec: "Origin",
      filterValues: ["Local", "Imported", "Organic"],
      itemNoun: "item",
      itemNounPlural: "items",
      cartLabel: "Basket",
      careTabLabel: "Storage",
      defaultCare: "Store in a cool, dry place. Keep airtight after opening.",
      imageAspect: "1/1",
    },
    tagline: "Fresh & Pure, Delivered",
    scriptLines: { header: "", footer: "" },
    announcement: "Fresh stock every week · Cash on delivery",
    home: {
      newArrivalsSubtitle: "Fresh in this week",
      bestSellersSubtitle: "Our customers' pantry favourites",
      storyTitle: "Pure Food, Honestly Sourced",
      storyText: "We work directly with farmers and trusted producers to bring pure, quality food to your kitchen.",
      features: [
        { title: "Pure & Fresh", text: "Directly sourced, quality checked" },
        { title: "Fast Delivery", text: "Nationwide delivery" },
        { title: "Cash on Delivery", text: "Pay when you receive" },
        { title: "Satisfaction Promise", text: "Not happy? We'll make it right" },
      ],
    },
    footerAbout: "Pure, fresh and honestly sourced food — delivered to your kitchen.",
    invoiceNote: "Thank you for your order! Please check items on delivery and contact us right away about any issue.",
    categories: cats([
      ["Pantry Staples", "Rice, lentils, oils and flour."],
      ["Honey & Spreads", "Pure honey, ghee and spreads."],
      ["Spices", "Whole and ground spices."],
      ["Snacks", "Healthy snacks and dry fruits."],
    ]),
    pages: [
      returnsPage(`## Quality Promise
Please check your items when they are delivered. If anything is damaged, spoiled or incorrect, tell the delivery person or contact us within 24 hours for a replacement or refund.`),
    ],
  },
  {
    key: "general",
    name: "General Store",
    description: "Neutral, flexible storefront that works for any kind of product.",
    examples: "Gifts, toys, books, handicrafts, anything",
    theme: { primary: "#2b2b33", accent: "#c2410c", background: "#faf8f5", font: "elegant" },
    catalog: {
      variantLabel: "Option",
      variantPresets: [
        { name: "Small / Medium / Large", options: ["Small", "Medium", "Large"] },
        { name: "Pack of 1 / 2 / 3", options: ["Pack of 1", "Pack of 2", "Pack of 3"] },
      ],
      specFields: ["Material", "Dimensions"],
      filterSpec: "",
      filterValues: [],
      itemNoun: "item",
      itemNounPlural: "items",
      cartLabel: "Cart",
      careTabLabel: "Details & Care",
      defaultCare: "",
      imageAspect: "4/5",
    },
    tagline: "Quality You Can Trust",
    scriptLines: { header: "", footer: "" },
    announcement: "Cash on delivery available nationwide",
    home: {
      newArrivalsSubtitle: "The latest additions to our store",
      bestSellersSubtitle: "Loved by our customers",
      storyTitle: "Our Story",
      storyText: "We started with a simple idea — great products, honest prices and service you can rely on.",
      features: [
        { title: "Quality Products", text: "Carefully selected for you" },
        { title: "Fast Delivery", text: "Nationwide delivery" },
        { title: "Cash on Delivery", text: "Pay when you receive" },
        { title: "Friendly Support", text: "We're here to help" },
      ],
    },
    footerAbout: "Great products, honest prices and service you can rely on.",
    invoiceNote: "Thank you for shopping with us!",
    categories: cats([
      ["New In", "The latest additions."],
      ["Popular", "Customer favourites."],
      ["Gifts", "Thoughtful gift ideas."],
    ]),
    pages: [
      returnsPage(`## Returns
If something isn't right, contact us within 3 days of delivery and we'll help with an exchange or refund.`),
    ],
  },
];

export function getTemplate(key: string) {
  return TEMPLATES.find((t) => t.key === key) ?? TEMPLATES.find((t) => t.key === "general")!;
}

/** Lightweight list for pickers (safe to send to the browser). */
export function templateSummaries() {
  return TEMPLATES.map((t) => ({ key: t.key, name: t.name, description: t.description, examples: t.examples, theme: t.theme }));
}
