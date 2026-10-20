"use client";

import { useState } from "react";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { Badge, StatCard } from "@/components/admin/ui";
import { formatDate, formatPrice } from "@/lib/utils";

// Mirrors EXPENSE_CATEGORIES in models/Finance.ts (kept here to avoid bundling mongoose on the client).
const CATEGORIES = [
  { value: "inventory", label: "Inventory / Stock Purchase" },
  { value: "marketing", label: "Marketing & Ads" },
  { value: "packaging", label: "Packaging" },
  { value: "delivery", label: "Delivery / Courier" },
  { value: "salary", label: "Salary & Wages" },
  { value: "rent", label: "Rent" },
  { value: "utilities", label: "Utilities & Internet" },
  { value: "software", label: "Software & Hosting" },
  { value: "photography", label: "Photography & Content" },
  { value: "transaction", label: "Payment / Bank Fees" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" },
];
const label = (v: string) => CATEGORIES.find((c) => c.value === v)?.label ?? v;

type Expense = { _id: string; date: string; category: string; title: string; amount: number; note: string };

export default function ExpensesPage() {
  const [rows, setRows] = useState<Expense[]>([]);
  const now = new Date();
  const thisMonth = rows.filter((r) => {
    const d = new Date(r.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const sum = (list: Expense[]) => list.reduce((s, r) => s + r.amount, 0);

  return (
    <ResourceManager<Expense>
      title="Expenses"
      singular="Expense"
      description="Log every business cost. “Inventory” purchases count toward cash flow; product cost in P&L comes from each product's cost price."
      endpoint="/api/admin/expenses"
      searchKeys={["title", "category", "note"]}
      onChange={setRows}
      headerExtra={() => (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="This Month" value={formatPrice(sum(thisMonth))} sub={`${thisMonth.length} entries`} />
          <StatCard label="This Month (excl. stock)" value={formatPrice(sum(thisMonth.filter((r) => r.category !== "inventory")))} sub="Operating expenses" />
          <StatCard label="All Time" value={formatPrice(sum(rows))} sub={`${rows.length} entries`} />
        </div>
      )}
      defaults={{ date: new Date().toISOString().slice(0, 10), category: "marketing", title: "", amount: "", note: "" }}
      fields={[
        { name: "date", label: "Date", type: "date", required: true },
        { name: "category", label: "Category", type: "select", options: CATEGORIES },
        { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Facebook ads – Eid campaign" },
        { name: "amount", label: "Amount", type: "number", required: true },
        { name: "note", label: "Note", type: "textarea", rows: 2 },
      ]}
      columns={[
        { header: "Date", cell: (r) => formatDate(r.date) },
        { header: "Title", cell: (r) => <div><p className="font-medium">{r.title}</p>{r.note && <p className="text-xs text-muted">{r.note}</p>}</div> },
        { header: "Category", cell: (r) => <Badge tone={r.category === "inventory" ? "blue" : "neutral"}>{label(r.category)}</Badge> },
        { header: "Amount", cell: (r) => <span className="font-semibold">{formatPrice(r.amount)}</span>, className: "text-right" },
      ]}
    />
  );
}
