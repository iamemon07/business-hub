/**
 * Copies an existing single-store database (built with the original Nivorea/Emoline app) into
 * the hub as a new business. The source database is only READ — it is never modified.
 *
 *   npm run import:store -- --from emoline --slug emoline --template home-decor \
 *        [--name "Emoline Home Decor"] [--logo /stores/emoline/logo.png] [--banner /stores/emoline/banner.png]
 *        [--plan growth] [--status active]
 *
 * --from is a database name on the same cluster as MONGODB_URI.
 */
import mongoose, { Types } from "mongoose";
import { runAsPlatform } from "../src/lib/tenant-context";
import { Plan, Tenant } from "../src/models/platform";
import { getTemplate } from "../src/templates";

type Doc = Record<string, unknown> & { _id: Types.ObjectId };

function args() {
  const out: Record<string, string> = {};
  const list = process.argv.slice(2);
  for (let i = 0; i < list.length; i++) {
    if (list[i].startsWith("--")) out[list[i].slice(2)] = list[i + 1] && !list[i + 1].startsWith("--") ? list[++i] : "true";
  }
  return out;
}

/** Legacy fixed fields → generic specs. */
function toSpecs(p: Record<string, unknown>) {
  const specs: { key: string; value: string }[] = [];
  const add = (key: string, v: unknown) => typeof v === "string" && v.trim() && specs.push({ key, value: v.trim() });
  add("Fabric", p.fabric);
  add("Material", p.material);
  add("Dimensions", p.dimensions);
  return specs;
}

/** Local /brand/* paths belonged to the old single-store app; swap for the given files or drop them. */
function remap(path: unknown, replacements: Record<string, string | undefined>) {
  if (typeof path !== "string") return path;
  if (path.startsWith("/brand/logo")) return replacements.logo ?? "";
  if (path.startsWith("/brand/banner")) return replacements.banner ?? "";
  return path;
}

async function main() {
  const a = args();
  if (!a.from || !a.slug) throw new Error("Usage: npm run import:store -- --from <sourceDb> --slug <subdomain> [--template key] [--name ...]");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri);
  const hub = mongoose.connection.db!;
  const src = mongoose.connection.getClient().db(a.from);
  if (a.from === mongoose.connection.name) throw new Error("--from must be a different database than the hub's own");
  console.log(`✓ Connected — importing "${a.from}" into "${mongoose.connection.name}" as "${a.slug}"`);

  const read = (name: string) => src.collection(name).find().toArray() as Promise<Doc[]>;
  const [settingsDocs, admins, products, categories, banners, pages, coupons, orders, expenses, investments, counters] = await Promise.all(
    ["settings", "admins", "products", "categories", "banners", "pages", "coupons", "orders", "expenses", "investments", "counters"].map(read),
  );
  const legacy = settingsDocs[0] ?? {};
  if (!admins.length && !products.length) throw new Error(`Database "${a.from}" has no admins or products — is the name right?`);

  const tpl = getTemplate(a.template ?? "general");
  const name = a.name ?? (legacy.storeName as string) ?? a.slug;
  const owner = admins.find((x) => x.role === "owner") ?? admins[0];
  const files = { logo: a.logo, banner: a.banner };

  const tenant = await runAsPlatform(async () => {
    if (await Tenant.exists({ slug: a.slug })) throw new Error(`A business with address "${a.slug}" already exists`);
    const plan = a.plan ? await Plan.findOne({ key: a.plan }).lean() : null;
    return Tenant.create({
      name,
      slug: a.slug,
      template: tpl.key,
      status: a.status ?? "active",
      plan: plan?._id,
      owner: { name: (owner?.name as string) ?? "", email: (owner?.email as string) ?? "", phone: (legacy.phone as string) ?? "" },
      notes: `Imported from database "${a.from}" on ${new Date().toISOString().slice(0, 10)}.`,
    });
  });
  const tenantId = tenant._id;
  const stamp = <T extends Doc>(docs: T[], fn: (d: T) => Record<string, unknown> = (d) => d) =>
    docs.map((d) => {
      const { __v: _v, ...rest } = fn(d) as Doc;
      return { ...rest, tenant: tenantId };
    });

  try {
    // Settings: keep everything the business configured, add the new generic sections from the template.
    const { _id: _sid, key: _key, __v: _v, ...settings } = legacy as Doc;
    await hub.collection("settings").insertOne({
      ...settings,
      key: "site",
      tenant: tenantId,
      storeName: name,
      logo: remap(settings.logo, files),
      wordmark: { main: "", sub: "" },
      scriptLines: tpl.scriptLines,
      theme: tpl.theme,
      catalog: tpl.catalog,
      home: { ...(settings.home as object), storyImage: remap((settings.home as Doc | undefined)?.storyImage, files) },
      orders: {
        prefix: (orders[0]?.orderNumber as string | undefined)?.match(/^[A-Z]+/)?.[0] ?? "OR",
        notifyEmail: process.env.ADMIN_NOTIFY_EMAIL ?? (owner?.email as string) ?? "",
        timezone: "Asia/Dhaka",
      },
    });

    const insert = async (name: string, docs: Record<string, unknown>[]) => {
      if (docs.length) await hub.collection(name).insertMany(docs);
      console.log(`  ✓ ${name}: ${docs.length}`);
    };
    await insert("admins", stamp(admins));
    await insert("categories", stamp(categories));
    await insert("products", stamp(products, ({ fabric: _f, material: _m, dimensions: _d, ...p }) => ({ ...p, specs: toSpecs({ fabric: _f, material: _m, dimensions: _d }) })));
    await insert("banners", stamp(banners, (b) => ({ ...b, image: remap(b.image, files), mobileImage: remap(b.mobileImage, files) })));
    await insert("pages", stamp(pages));
    await insert("coupons", stamp(coupons));
    await insert("orders", stamp(orders));
    await insert("expenses", stamp(expenses));
    await insert("investments", stamp(investments));
    // Legacy counters used _id = "order"; the hub stores { name, seq } per business.
    await insert("counters", counters.map((c) => ({ name: String(c._id), seq: c.seq, tenant: tenantId })));
  } catch (err) {
    console.error("✗ Import failed — rolling back");
    for (const c of ["settings", "admins", "categories", "products", "banners", "pages", "coupons", "orders", "expenses", "investments", "counters"]) {
      await hub.collection(c).deleteMany({ tenant: tenantId });
    }
    await hub.collection("tenants").deleteOne({ _id: tenantId });
    throw err;
  }

  console.log(`\n✓ Imported "${name}". Admins keep their existing passwords.`);
  console.log(`  Store: http://${a.slug}.${process.env.PLATFORM_DOMAIN || "localhost:3000"}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("✗", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
