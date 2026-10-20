"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Link2, Loader2, Upload, X, ArrowLeft, ArrowRight } from "lucide-react";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="font-display text-4xl text-cocoa">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(74,31,23,0.04)] sm:p-6", className)}>
      {(title || actions) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-xl text-cocoa">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label?: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-rose" : "bg-blush-200")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </button>
      {(label || description) && (
        <span>
          {label && <span className="block text-sm font-medium text-cocoa">{label}</span>}
          {description && <span className="block text-xs text-muted">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "amber" | "red" | "blue" | "rose" | "purple" }) {
  const tones = {
    neutral: "bg-blush-100 text-cocoa-light",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    blue: "bg-sky-50 text-sky-700 ring-sky-200",
    rose: "bg-rose/10 text-rose-dark ring-rose/20",
    purple: "bg-violet-50 text-violet-700 ring-violet-200",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ring-1 ring-transparent", tones[tone])}>{children}</span>;
}

export { STATUS_TONES } from "./tones";

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade-in bg-cocoa/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cn("relative max-h-[92vh] w-full animate-fade-up overflow-y-auto rounded-t-3xl bg-cream p-6 shadow-2xl sm:rounded-3xl sm:p-8", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-blush-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatCard({ label, value, sub, icon, tone = "default" }: { label: string; value: string; sub?: React.ReactNode; icon?: React.ReactNode; tone?: "default" | "positive" | "negative" }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(74,31,23,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
        {icon && <div className="rounded-xl bg-blush-100 p-2 text-rose">{icon}</div>}
      </div>
      <p className={cn("mt-2 font-display text-3xl", tone === "positive" && "text-emerald-700", tone === "negative" && "text-red-700")}>{value}</p>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-blush-300 bg-white/60 px-6 py-16 text-center">
      <p className="font-display text-2xl">{title}</p>
      {text && <p className="mt-2 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ───────────────────────── Image input (URL or upload) ───────────────────────── */

let uploadEnabledCache: boolean | null = null;

function useUploadEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(uploadEnabledCache);
  useEffect(() => {
    if (uploadEnabledCache !== null) return;
    api<{ enabled: boolean }>("/api/admin/upload")
      .then((r) => {
        uploadEnabledCache = r.enabled;
        setEnabled(r.enabled);
      })
      .catch(() => setEnabled(false));
  }, []);
  return enabled;
}

async function uploadFile(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await api<{ url: string }>("/api/admin/upload", { method: "POST", body: fd });
  return res.url;
}

/** Single image: paste a URL or upload to Cloudinary. */
export function ImageInput({ value, onChange, aspect = "aspect-video" }: { value: string; onChange: (url: string) => void; aspect?: string }) {
  const enabled = useUploadEnabled();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadFile(file));
      toast.success("Image uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className={cn("relative w-full max-w-sm overflow-hidden rounded-xl border border-line bg-blush-50", aspect)}>
          <Image src={value} alt="" fill sizes="384px" className="object-cover" unoptimized={!value.startsWith("/")} />
          <button type="button" onClick={() => onChange("")} className="absolute right-2 top-2 rounded-full bg-white/90 p-1 shadow" aria-label="Remove image">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={value} onChange={(e) => onChange(e.target.value.trim())} placeholder="https://… image URL" className="input pl-9" />
        </div>
        {enabled && (
          <>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="btn-soft shrink-0 px-4">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span className="hidden sm:inline">Upload</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Multiple images with reordering; first image is the cover. */
export function MultiImageInput({ value, onChange, max = 12 }: { value: string[]; onChange: (urls: string[]) => void; max?: number }) {
  const enabled = useUploadEnabled();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const addUrl = () => {
    const parts = url.split(/[\s,]+/).map((s) => s.trim()).filter((s) => /^https?:\/\/|^\//.test(s));
    if (!parts.length) return toast.error("Paste a valid image URL (https://…)");
    onChange([...value, ...parts].slice(0, max));
    setUrl("");
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const uploaded: string[] = [];
    for (const f of Array.from(files).slice(0, max - value.length)) {
      try {
        uploaded.push(await uploadFile(f));
      } catch (e) {
        toast.error(`${f.name}: ${(e as Error).message}`);
      }
    }
    if (uploaded.length) {
      onChange([...value, ...uploaded]);
      toast.success(`${uploaded.length} image(s) uploaded`);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {value.map((src, i) => (
            <div key={src + i} className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-line bg-blush-50">
              <Image src={src} alt="" fill sizes="140px" className="object-cover" unoptimized={!src.startsWith("/")} />
              {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-cocoa px-2 py-0.5 text-[9px] uppercase tracking-wider text-ivory">Cover</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                <button type="button" onClick={() => move(i, -1)} className="rounded-full bg-white/90 p-1" aria-label="Move left"><ArrowLeft className="h-3 w-3" /></button>
                <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="rounded-full bg-white/90 p-1 text-red-600" aria-label="Remove"><X className="h-3 w-3" /></button>
                <button type="button" onClick={() => move(i, 1)} className="rounded-full bg-white/90 p-1" aria-label="Move right"><ArrowRight className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <ImagePlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="Paste image URL(s) and press Enter"
            className="input pl-9"
          />
        </div>
        <button type="button" onClick={addUrl} className="btn-soft px-4">Add URL</button>
        {enabled && (
          <>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="btn-primary px-4">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
            </button>
          </>
        )}
      </div>
      {enabled === false && (
        <p className="text-xs text-muted">Tip: add free Cloudinary keys in <code>.env.local</code> to enable direct uploads.</p>
      )}
    </div>
  );
}
