import "server-only";
import { connectDB } from "@/lib/db";
import { EXPENSE_CATEGORIES, Expense, Investment } from "@/models/Finance";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";

const ACTIVE_ORDER = { status: { $nin: ["cancelled", "returned"] } };

type Range = { from: Date; to: Date };

async function orderTotals(range?: Range) {
  const match: Record<string, unknown> = { ...ACTIVE_ORDER };
  if (range) match.createdAt = { $gte: range.from, $lte: range.to };
  const [row] = await Order.aggregate([
    { $match: match },
    {
      $project: {
        subtotal: 1,
        discount: 1,
        shippingFee: 1,
        total: 1,
        courierCost: 1,
        status: 1,
        paymentStatus: 1,
        cogs: { $sum: { $map: { input: "$items", as: "i", in: { $multiply: ["$$i.unitCost", "$$i.quantity"] } } } },
        units: { $sum: "$items.quantity" },
      },
    },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        units: { $sum: "$units" },
        grossSales: { $sum: "$subtotal" },
        discounts: { $sum: "$discount" },
        shippingIncome: { $sum: "$shippingFee" },
        revenue: { $sum: "$total" },
        cogs: { $sum: "$cogs" },
        courierCost: { $sum: "$courierCost" },
        deliveredRevenue: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, "$total", 0] } },
        collected: {
          $sum: { $cond: [{ $or: [{ $eq: ["$paymentStatus", "paid"] }, { $eq: ["$status", "delivered"] }] }, "$total", 0] },
        },
      },
    },
  ]);
  return {
    orders: row?.orders ?? 0,
    units: row?.units ?? 0,
    grossSales: row?.grossSales ?? 0,
    discounts: row?.discounts ?? 0,
    shippingIncome: row?.shippingIncome ?? 0,
    revenue: row?.revenue ?? 0,
    cogs: row?.cogs ?? 0,
    courierCost: row?.courierCost ?? 0,
    deliveredRevenue: row?.deliveredRevenue ?? 0,
    collected: row?.collected ?? 0,
  };
}

async function expenseTotals(range?: Range) {
  const match: Record<string, unknown> = {};
  if (range) match.date = { $gte: range.from, $lte: range.to };
  const rows: { _id: string; total: number }[] = await Expense.aggregate([
    { $match: match },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
  ]);
  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    category: c.value,
    label: c.label,
    total: rows.find((r) => r._id === c.value)?.total ?? 0,
  })).filter((c) => c.total > 0);
  const all = rows.reduce((s, r) => s + r.total, 0);
  const inventory = rows.find((r) => r._id === "inventory")?.total ?? 0;
  return { byCategory, all, inventory, operating: all - inventory };
}

function computePL(o: Awaited<ReturnType<typeof orderTotals>>, e: Awaited<ReturnType<typeof expenseTotals>>) {
  const netSales = o.grossSales - o.discounts;
  const grossProfit = netSales - o.cogs;
  const operatingExpenses = e.operating + o.courierCost;
  const netProfit = grossProfit + o.shippingIncome - operatingExpenses;
  return {
    netSales,
    grossProfit,
    grossMargin: netSales > 0 ? (grossProfit / netSales) * 100 : 0,
    operatingExpenses,
    netProfit,
    netMargin: o.revenue > 0 ? (netProfit / o.revenue) * 100 : 0,
    aov: o.orders > 0 ? o.revenue / o.orders : 0,
  };
}

export async function getFinanceReport(range: Range, timezone = "Asia/Dhaka") {
  await connectDB();
  const [o, e, allO, allE, capitalRows, inventoryRow, monthly, topProducts] = await Promise.all([
    orderTotals(range),
    expenseTotals(range),
    orderTotals(),
    expenseTotals(),
    Investment.aggregate([{ $group: { _id: "$type", total: { $sum: "$amount" } } }]),
    Product.aggregate([
      { $unwind: { path: "$variants", preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: null,
          units: { $sum: "$variants.stock" },
          atCost: { $sum: { $multiply: ["$variants.stock", "$costPrice"] } },
          atRetail: { $sum: { $multiply: ["$variants.stock", "$salePrice"] } },
        },
      },
    ]),
    monthlySeries(range, timezone),
    topProductsIn(range),
  ]);

  const period = { ...o, expenses: e, ...computePL(o, e) };
  const lifetime = { ...allO, expenses: allE, ...computePL(allO, allE) };

  const capitalIn = capitalRows.find((r: { _id: string }) => r._id === "capital")?.total ?? 0;
  const withdrawals = capitalRows.find((r: { _id: string }) => r._id === "withdrawal")?.total ?? 0;
  const netInvestment = capitalIn - withdrawals;
  const inventory = {
    units: inventoryRow[0]?.units ?? 0,
    atCost: inventoryRow[0]?.atCost ?? 0,
    atRetail: inventoryRow[0]?.atRetail ?? 0,
  };

  // Cash position = money in from customers + capital − all cash out (incl. stock purchases & courier) − withdrawals.
  const cashIn = allO.collected;
  const cashOut = allE.all + allO.courierCost;
  const cashBalance = capitalIn + cashIn - cashOut - withdrawals;

  return {
    range: { from: range.from.toISOString(), to: range.to.toISOString() },
    period,
    lifetime,
    investment: {
      capitalIn,
      withdrawals,
      netInvestment,
      roi: capitalIn > 0 ? (lifetime.netProfit / capitalIn) * 100 : 0,
      periodRoi: capitalIn > 0 ? (period.netProfit / capitalIn) * 100 : 0,
      paybackRemaining: Math.max(0, capitalIn - lifetime.netProfit),
      paybackProgress: capitalIn > 0 ? Math.min(100, Math.max(0, (lifetime.netProfit / capitalIn) * 100)) : 0,
    },
    cash: { cashIn, cashOut, cashBalance },
    inventory,
    monthly,
    topProducts,
  };
}

async function monthlySeries(range: Range, timezone: string) {
  const [orders, expenses] = await Promise.all([
    Order.aggregate([
      { $match: { ...ACTIVE_ORDER, createdAt: { $gte: range.from, $lte: range.to } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone } },
          revenue: { $sum: "$total" },
          netSales: { $sum: { $subtract: ["$subtotal", "$discount"] } },
          shipping: { $sum: "$shippingFee" },
          courier: { $sum: "$courierCost" },
          cogs: {
            $sum: { $sum: { $map: { input: "$items", as: "i", in: { $multiply: ["$$i.unitCost", "$$i.quantity"] } } } },
          },
          orders: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: range.from, $lte: range.to }, category: { $ne: "inventory" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date", timezone } },
          total: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const months: string[] = [];
  const cursor = new Date(range.from.getFullYear(), range.from.getMonth(), 1);
  while (cursor <= range.to && months.length < 36) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months.map((m) => {
    const o = orders.find((x) => x._id === m);
    const ex = expenses.find((x) => x._id === m)?.total ?? 0;
    const revenue = o?.revenue ?? 0;
    const cogs = o?.cogs ?? 0;
    const opex = ex + (o?.courier ?? 0);
    const netProfit = (o?.netSales ?? 0) - cogs + (o?.shipping ?? 0) - opex;
    const label = new Date(`${m}-01T00:00:00`).toLocaleString("en-US", { month: "short", year: "2-digit" });
    return { month: label, revenue, cogs, expenses: opex, netProfit, orders: o?.orders ?? 0 };
  });
}

async function topProductsIn(range: Range) {
  return Order.aggregate([
    { $match: { ...ACTIVE_ORDER, createdAt: { $gte: range.from, $lte: range.to } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.name" },
        image: { $first: "$items.image" },
        units: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.lineTotal" },
        cost: { $sum: { $multiply: ["$items.unitCost", "$items.quantity"] } },
      },
    },
    { $addFields: { profit: { $subtract: ["$revenue", "$cost"] } } },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ]);
}

export async function getDashboardStats(timezone = "Asia/Dhaka") {
  await connectDB();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(startOfDay);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const [today, month, statusCounts, recent, daily, lowStock, productCount] = await Promise.all([
    orderTotals({ from: startOfDay, to: now }),
    orderTotals({ from: startOfMonth, to: now }),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.find().sort({ createdAt: -1 }).limit(8).select("orderNumber customer.name total status paymentStatus createdAt").lean(),
    Order.aggregate([
      { $match: { ...ACTIVE_ORDER, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
    ]),
    Product.aggregate([
      { $match: { active: true } },
      { $unwind: "$variants" },
      { $match: { "variants.stock": { $lte: 3 } } },
      { $project: { name: 1, slug: 1, size: "$variants.size", stock: "$variants.stock" } },
      { $sort: { stock: 1 } },
      { $limit: 10 },
    ]),
    Product.countDocuments({ active: true }),
  ]);
  const monthExpenses = await expenseTotals({ from: startOfMonth, to: now });
  const monthPL = computePL(month, monthExpenses);

  const series = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const row = daily.find((x) => x._id === key);
    return { date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 };
  });

  const counts = Object.fromEntries(statusCounts.map((s: { _id: string; count: number }) => [s._id, s.count]));

  return JSON.parse(
    JSON.stringify({ today, month, monthNetProfit: monthPL.netProfit, counts, recent, series, lowStock, productCount }),
  ) as {
    today: typeof today;
    month: typeof month;
    monthNetProfit: number;
    counts: Record<string, number>;
    recent: { _id: string; orderNumber: string; customer: { name: string }; total: number; status: string; paymentStatus: string; createdAt: string }[];
    series: { date: string; revenue: number; orders: number }[];
    lowStock: { _id: string; name: string; slug: string; size: string; stock: number }[];
    productCount: number;
  };
}

export type FinanceReport = Awaited<ReturnType<typeof getFinanceReport>>;
