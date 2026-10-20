"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api } from "@/lib/client-api";
import { EmptyState, Field, ImageInput, Modal, PageHeader, Toggle } from "./ui";

export type FieldDef =
  | { name: string; label: string; type: "text" | "number" | "date" | "datetime" | "password" | "email"; placeholder?: string; hint?: string; required?: boolean; full?: boolean }
  | { name: string; label: string; type: "textarea"; rows?: number; placeholder?: string; hint?: string; full?: boolean }
  | { name: string; label: string; type: "select"; options: { value: string; label: string }[]; hint?: string; full?: boolean }
  | { name: string; label: string; type: "toggle"; description?: string; full?: boolean }
  | { name: string; label: string; type: "image"; hint?: string; full?: boolean };

export type Column<T> = { header: string; cell: (row: T) => React.ReactNode; className?: string };

type Props<T extends { _id: string }> = {
  title: string;
  description?: string;
  endpoint: string;
  singular: string;
  fields: FieldDef[];
  columns: Column<T>[];
  defaults: Record<string, unknown>;
  /** Convert a stored row into form values (e.g. Date → yyyy-mm-dd). */
  toForm?: (row: T) => Record<string, unknown>;
  searchKeys?: (keyof T)[];
  onChange?: (rows: T[]) => void;
  headerExtra?: (rows: T[]) => React.ReactNode;
  emptyText?: string;
};

const toDateInput = (v: unknown) => (v ? new Date(v as string).toISOString().slice(0, 10) : "");

export function ResourceManager<T extends { _id: string }>(props: Props<T>) {
  const { endpoint, fields, defaults, singular } = props;
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>(defaults);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api<T[]>(endpoint);
      setRows(data);
      props.onChange?.(data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  const startCreate = () => {
    setEditing(null);
    setForm({ ...defaults });
    setOpen(true);
  };

  const startEdit = (row: T) => {
    setEditing(row);
    const base = props.toForm ? props.toForm(row) : (row as unknown as Record<string, unknown>);
    const values: Record<string, unknown> = { ...defaults };
    for (const f of fields) {
      const v = base[f.name];
      values[f.name] = f.type === "date" ? toDateInput(v) : v ?? defaults[f.name];
    }
    setForm(values);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = { ...form };
      for (const f of fields) {
        if ((f.type === "date" || f.type === "datetime") && !body[f.name]) body[f.name] = null;
      }
      if (editing) await api(`${endpoint}/${editing._id}`, { method: "PUT", body });
      else await api(endpoint, { method: "POST", body });
      toast.success(`${singular} ${editing ? "updated" : "created"}`);
      setOpen(false);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: T) => {
    if (!confirm(`Delete this ${singular.toLowerCase()}? This cannot be undone.`)) return;
    try {
      await api(`${endpoint}/${row._id}`, { method: "DELETE" });
      toast.success(`${singular} deleted`);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const filtered = useMemo(() => {
    if (!q || !props.searchKeys) return rows;
    const needle = q.toLowerCase();
    return rows.filter((r) => props.searchKeys!.some((k) => String(r[k] ?? "").toLowerCase().includes(needle)));
  }, [rows, q, props.searchKeys]);

  const set = (name: string, v: unknown) => setForm((f) => ({ ...f, [name]: v }));

  return (
    <div>
      <PageHeader
        title={props.title}
        description={props.description}
        actions={
          <button onClick={startCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Add {singular}
          </button>
        }
      />

      {props.headerExtra?.(rows)}

      {props.searchKeys && rows.length > 0 && (
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="input bg-white pl-10" />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-rose" /></div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={`No ${props.title.toLowerCase()} yet`}
          text={props.emptyText}
          action={<button onClick={startCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add {singular}</button>}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line bg-blush-50/60 text-left text-[11px] uppercase tracking-wider text-muted">
              <tr>
                {props.columns.map((c) => (
                  <th key={c.header} className={`px-4 py-3 font-medium ${c.className ?? ""}`}>{c.header}</th>
                ))}
                <th className="w-24 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((row) => (
                <tr key={row._id} className="transition hover:bg-blush-50/40">
                  {props.columns.map((c) => (
                    <td key={c.header} className={`px-4 py-3 ${c.className ?? ""}`}>{c.cell(row)}</td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(row)} className="rounded-lg p-2 text-muted hover:bg-blush-100 hover:text-cocoa" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(row)} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Edit" : "New"} ${singular}`} wide={fields.length > 6}>
        <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
          {fields.map((f) => {
            const full = f.full || f.type === "textarea" || f.type === "image";
            const cls = full ? "sm:col-span-2" : "";
            if (f.type === "toggle")
              return (
                <div key={f.name} className={cls}>
                  <Toggle checked={Boolean(form[f.name])} onChange={(v) => set(f.name, v)} label={f.label} description={f.description} />
                </div>
              );
            return (
              <Field key={f.name} label={f.label} hint={"hint" in f ? f.hint : undefined} className={cls}>
                {f.type === "textarea" ? (
                  <textarea value={String(form[f.name] ?? "")} onChange={(e) => set(f.name, e.target.value)} rows={f.rows ?? 4} placeholder={f.placeholder} className="input" />
                ) : f.type === "select" ? (
                  <select value={String(form[f.name] ?? "")} onChange={(e) => set(f.name, e.target.value)} className="input">
                    {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === "image" ? (
                  <ImageInput value={String(form[f.name] ?? "")} onChange={(v) => set(f.name, v)} />
                ) : (
                  <input
                    type={f.type === "datetime" ? "datetime-local" : f.type}
                    value={String(form[f.name] ?? "")}
                    onChange={(e) => set(f.name, f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
                    placeholder={f.placeholder}
                    required={f.required}
                    step={f.type === "number" ? "any" : undefined}
                    className="input"
                  />
                )}
              </Field>
            );
          })}
          <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-soft">Cancel</button>
            <button disabled={saving} className="btn-primary">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
