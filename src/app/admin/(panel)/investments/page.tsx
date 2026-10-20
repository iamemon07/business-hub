"use client";

import { useState } from "react";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { Badge, StatCard } from "@/components/admin/ui";
import { formatDate, formatPrice } from "@/lib/utils";

type Investment = { _id: string; date: string; source: string; amount: number; type: "capital" | "withdrawal"; note: string };

export default function InvestmentsPage() {
  const [rows, setRows] = useState<Investment[]>([]);
  const capital = rows.filter((r) => r.type === "capital").reduce((s, r) => s + r.amount, 0);
  const withdrawn = rows.filter((r) => r.type === "withdrawal").reduce((s, r) => s + r.amount, 0);

  return (
    <ResourceManager<Investment>
      title="Investments"
      singular="Entry"
      description="Record the capital you put into the business and any owner withdrawals. This powers your ROI calculation."
      endpoint="/api/admin/investments"
      onChange={setRows}
      headerExtra={() => (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Capital Invested" value={formatPrice(capital)} />
          <StatCard label="Owner Withdrawals" value={formatPrice(withdrawn)} />
          <StatCard label="Net Capital in Business" value={formatPrice(capital - withdrawn)} />
        </div>
      )}
      defaults={{ date: new Date().toISOString().slice(0, 10), source: "Owner capital", amount: "", type: "capital", note: "" }}
      fields={[
        { name: "date", label: "Date", type: "date", required: true },
        { name: "type", label: "Type", type: "select", options: [{ value: "capital", label: "Capital invested" }, { value: "withdrawal", label: "Owner withdrawal" }] },
        { name: "source", label: "Source / Person", type: "text", required: true },
        { name: "amount", label: "Amount", type: "number", required: true },
        { name: "note", label: "Note", type: "textarea", rows: 2 },
      ]}
      columns={[
        { header: "Date", cell: (r) => formatDate(r.date) },
        { header: "Source", cell: (r) => <div><p className="font-medium">{r.source}</p>{r.note && <p className="text-xs text-muted">{r.note}</p>}</div> },
        { header: "Type", cell: (r) => <Badge tone={r.type === "capital" ? "green" : "amber"}>{r.type}</Badge> },
        { header: "Amount", cell: (r) => <span className="font-semibold">{r.type === "withdrawal" ? "−" : ""}{formatPrice(r.amount)}</span>, className: "text-right" },
      ]}
    />
  );
}
