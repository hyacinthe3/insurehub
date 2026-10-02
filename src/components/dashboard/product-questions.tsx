"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  createInsurerQuestion,
  deleteInsurerQuestion,
  getInsurerProductQuestions,
  reorderInsurerQuestions,
  updateInsurerQuestion,
  type ProductQuestionSet,
  type QuestionInput,
  type QuoteQuestion,
  type QuoteQuestionType,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<QuoteQuestionType, string> = {
  text: "Text",
  number: "Number",
  select: "Select",
  date: "Date",
};

type QuestionForm = {
  key: string;
  label: string;
  type: QuoteQuestionType;
  options: string;
  required: boolean;
  help: string;
  placeholder: string;
  min: string;
  max: string;
  minLength: string;
  maxLength: string;
  pattern: string;
};

const EMPTY_FORM: QuestionForm = {
  key: "",
  label: "",
  type: "text",
  options: "",
  required: true,
  help: "",
  placeholder: "",
  min: "",
  max: "",
  minLength: "",
  maxLength: "",
  pattern: "",
};

function fromQuestion(q: QuoteQuestion): QuestionForm {
  return {
    key: q.key,
    label: q.label,
    type: q.type,
    options: q.options.join("\n"),
    required: q.required,
    help: q.help ?? "",
    placeholder: q.placeholder ?? "",
    min: q.validation?.min != null ? String(q.validation.min) : "",
    max: q.validation?.max != null ? String(q.validation.max) : "",
    minLength: q.validation?.minLength != null ? String(q.validation.minLength) : "",
    maxLength: q.validation?.maxLength != null ? String(q.validation.maxLength) : "",
    pattern: q.validation?.pattern ?? "",
  };
}

function keyFromLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 32);
}

function toInput(form: QuestionForm): QuestionInput {
  const input: QuestionInput = {
    key: form.key.trim(),
    label: form.label.trim(),
    type: form.type,
    required: form.required,
  };
  if (form.type === "select") {
    input.options = form.options
      .split("\n")
      .map((o) => o.trim())
      .filter(Boolean);
  }
  if (form.help.trim()) input.help = form.help.trim();
  if (form.placeholder.trim()) input.placeholder = form.placeholder.trim();

  const validation: QuestionInput["validation"] = {};
  if (form.type === "number" || form.type === "date") {
    if (form.min.trim() !== "") validation.min = Number(form.min);
    if (form.max.trim() !== "") validation.max = Number(form.max);
  } else if (form.type === "text") {
    if (form.minLength.trim() !== "") validation.minLength = Number(form.minLength);
    if (form.maxLength.trim() !== "") validation.maxLength = Number(form.maxLength);
    if (form.pattern.trim() !== "") validation.pattern = form.pattern.trim();
  }
  if (Object.keys(validation).length > 0) input.validation = validation;
  return input;
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-card shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card px-6 py-4">
          <div>
            <h3 className="text-base font-bold">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "primary" | "muted" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tone === "primary" && "border-primary/30 bg-primary/10 text-primary",
        tone === "muted" && "border-border text-muted-foreground",
        tone === "default" && "border-primary/20 bg-primary/5 text-primary",
      )}
    >
      {children}
    </span>
  );
}

export function ProductQuestionsModal({
  product,
  onClose,
}: {
  product: { id: string; name: string };
  onClose: () => void;
}) {
  const [data, setData] = useState<ProductQuestionSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<QuoteQuestion | null>(null);
  const [form, setForm] = useState<QuestionForm>(EMPTY_FORM);
  const [keyTouched, setKeyTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    getInsurerProductQuestions(product.id)
      .then((set) => {
        setData(set);
        setLoadError(false);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [product.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = useCallback(
    (message: string, tone: "success" | "error" = "success") => setToast({ message, tone }),
    [],
  );

  const startNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setKeyTouched(false);
    setFormOpen(true);
  };

  const startEdit = (q: QuoteQuestion) => {
    setEditing(q);
    setForm(fromQuestion(q));
    setKeyTouched(true);
    setFormOpen(true);
  };

  const custom = data?.custom ?? [];
  const effective = data?.effective ?? [];

  const submitForm = useCallback(async () => {
    if (!data) return;
    const input = toInput(form);
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateInsurerQuestion(product.id, editing.id, input);
        const rows = data.custom.map((q) => (q.id === updated.id ? updated : q));
        setData((prev) => (prev ? { ...prev, custom: rows } : prev));
        notify("Question updated");
      } else {
        const created = await createInsurerQuestion(product.id, input);
        setData((prev) =>
          prev ? { ...prev, custom: [...prev.custom, created] } : prev,
        );
        notify("Question added");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "";
      notify(detail ? `Save failed — ${detail}` : "Save failed — please try again", "error");
    } finally {
      setSaving(false);
    }
  }, [data, form, editing, product.id, notify]);

  const remove = useCallback(
    async (q: QuoteQuestion) => {
      setBusyId(q.id);
      try {
        await deleteInsurerQuestion(product.id, q.id);
        setData((prev) =>
          prev ? { ...prev, custom: prev.custom.filter((x) => x.id !== q.id) } : prev,
        );
        notify("Question removed");
      } catch (err) {
        const detail = err instanceof Error ? err.message : "";
        notify(detail ? `Delete failed — ${detail}` : "Delete failed — please try again", "error");
      } finally {
        setBusyId(null);
      }
    },
    [product.id, notify],
  );

  const move = useCallback(
    async (index: number, direction: -1 | 1) => {
      if (!data) return;
      const next = [...data.custom];
      const target = index + direction;
      if (target < 0 || target >= next.length) return;
      [next[index], next[target]] = [next[target], next[index]];
      setData((prev) => (prev ? { ...prev, custom: next } : prev));
      try {
        await reorderInsurerQuestions(
          product.id,
          next.map((q) => q.id),
        );
      } catch (err) {
        const detail = err instanceof Error ? err.message : "";
        notify(detail ? `Reorder failed — ${detail}` : "Reorder failed", "error");
        reload();
      }
    },
    [data, product.id, reload, notify],
  );

  const formValid =
    form.label.trim().length > 0 &&
    /^[a-zA-Z0-9_]{1,64}$/.test(form.key.trim()) &&
    (form.type !== "select" ||
      form.options.split("\n").map((o) => o.trim()).filter(Boolean).length > 0);

  const inputCls =
    "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";
  const labelCls = "text-xs font-medium text-muted-foreground";

  return (
    <ModalShell
      title={`Questions — ${product.name}`}
      subtitle="Product-specific questions are asked after the category defaults your customers already answer."
      onClose={onClose}
    >
      {toast && (
        <div
          className={cn(
            "mb-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium",
            toast.tone === "success"
              ? "border border-success/30 bg-success/10 text-success"
              : "border border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          <span className="flex items-center gap-2">
            {toast.tone === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {toast.message}
          </span>
          <button type="button" onClick={() => setToast(null)} className="text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3 py-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : loadError || !data ? (
        <div className="py-14 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </span>
          <p className="mt-4 font-semibold">Could not load questions</p>
          <p className="mt-1 text-sm text-muted-foreground">Check the backend and try again.</p>
          <button
            type="button"
            onClick={reload}
            className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Customer-facing preview */}
          <div className="rounded-xl border border-border p-4">
            <div className="mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Preview — what customers answer</p>
            </div>
            {effective.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No active questions yet. Add some below.
              </p>
            ) : (
              <ol className="space-y-2">
                {effective.map((q, i) => {
                  const inherited = !q.productId;
                  return (
                    <li key={q.id} className="flex items-start gap-3 rounded-lg bg-muted/40 p-3">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{q.label}</p>
                          <Badge tone="muted">{TYPE_LABELS[q.type]}</Badge>
                          {q.required && <Badge tone="primary">Required</Badge>}
                          {inherited && <Badge tone="default">Inherited</Badge>}
                        </div>
                        {q.type === "select" && q.options.length > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {q.options.join(" · ")}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              {data.inherited.length > 0
                ? "Inherited from the category defaults (managed by InsureHub admins). You cannot edit these."
                : "This category has no admin-managed default questions yet — these are the only questions customers see."}
            </p>
          </div>

          {/* Add / edit form */}
          {formOpen && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="mb-3 text-sm font-semibold">
                {editing ? "Edit question" : "Add a product-specific question"}
              </p>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className={labelCls} htmlFor="pq-label">Label</label>
                    <input
                      id="pq-label"
                      className={inputCls}
                      value={form.label}
                      placeholder="e.g. Annual mileage"
                      onChange={(e) => {
                        const label = e.target.value;
                        setForm((f) =>
                          editing || keyTouched
                            ? { ...f, label }
                            : { ...f, label, key: keyFromLabel(label) },
                        );
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls} htmlFor="pq-key">Key</label>
                    <input
                      id="pq-key"
                      className={inputCls}
                      value={form.key}
                      placeholder="e.g. annual_mileage"
                      onChange={(e) => {
                        setKeyTouched(true);
                        setForm((f) => ({ ...f, key: e.target.value }));
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className={labelCls} htmlFor="pq-type">Type</label>
                    <select
                      id="pq-type"
                      className={inputCls}
                      value={form.type}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, type: e.target.value as QuoteQuestionType }))
                      }
                    >
                      {(["text", "number", "select", "date"] as QuoteQuestionType[]).map(
                        (t) => (
                          <option key={t} value={t}>
                            {TYPE_LABELS[t]}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls} htmlFor="pq-placeholder">Placeholder</label>
                    <input
                      id="pq-placeholder"
                      className={inputCls}
                      value={form.placeholder}
                      onChange={(e) => setForm((f) => ({ ...f, placeholder: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls} htmlFor="pq-help">Help</label>
                    <input
                      id="pq-help"
                      className={inputCls}
                      value={form.help}
                      onChange={(e) => setForm((f) => ({ ...f, help: e.target.value }))}
                    />
                  </div>
                </div>

                {form.type === "select" && (
                  <div className="space-y-1.5">
                    <label className={labelCls} htmlFor="pq-options">Options (one per line)</label>
                    <textarea
                      id="pq-options"
                      rows={3}
                      className={inputCls}
                      value={form.options}
                      placeholder={"0–10,000 km\n10,001–20,000 km\n20,001+ km"}
                      onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
                    />
                  </div>
                )}

                {(form.type === "number" || form.type === "date") && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className={labelCls} htmlFor="pq-min">Minimum</label>
                      <input
                        id="pq-min"
                        className={inputCls}
                        value={form.min}
                        onChange={(e) => setForm((f) => ({ ...f, min: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls} htmlFor="pq-max">Maximum</label>
                      <input
                        id="pq-max"
                        className={inputCls}
                        value={form.max}
                        onChange={(e) => setForm((f) => ({ ...f, max: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {form.type === "text" && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className={labelCls} htmlFor="pq-minlen">Min length</label>
                      <input
                        id="pq-minlen"
                        type="number"
                        min={0}
                        className={inputCls}
                        value={form.minLength}
                        onChange={(e) => setForm((f) => ({ ...f, minLength: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls} htmlFor="pq-maxlen">Max length</label>
                      <input
                        id="pq-maxlen"
                        type="number"
                        min={0}
                        className={inputCls}
                        value={form.maxLength}
                        onChange={(e) => setForm((f) => ({ ...f, maxLength: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelCls} htmlFor="pq-pattern">Pattern (regex)</label>
                      <input
                        id="pq-pattern"
                        className={inputCls}
                        value={form.pattern}
                        onChange={(e) => setForm((f) => ({ ...f, pattern: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold">Required</span>
                    <span className="block text-xs text-muted-foreground">
                      Customers must answer this before submitting a quote.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={form.required}
                    onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))}
                  />
                </label>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormOpen(false);
                      setEditing(null);
                    }}
                    disabled={saving}
                    className="rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-accent disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!formValid || saving}
                    onClick={submitForm}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editing ? "Save changes" : "Add question"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom questions list */}
          <div className="rounded-xl border border-border">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Your product-specific questions</p>
              </div>
              <button
                type="button"
                onClick={startNew}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Add question
              </button>
            </div>

            {custom.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No product-specific questions yet. Customers only see the category defaults above.
              </p>
            ) : (
              <ol className="divide-y divide-border">
                {custom.map((q, index) => {
                  const first = index === 0;
                  const last = index === custom.length - 1;
                  const busy = busyId === q.id;
                  return (
                    <li key={q.id} className="flex items-start justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{q.label}</p>
                          <Badge tone="muted">{TYPE_LABELS[q.type]}</Badge>
                          {!q.active && (
                            <span className="text-[11px] font-medium text-destructive">Inactive</span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          <code className="mr-2 rounded bg-muted px-1.5 py-0.5">{q.key}</code>
                          {q.type === "select" && q.options.length > 0
                            ? q.options.join(" · ")
                            : q.placeholder && <span>e.g. {q.placeholder}</span>}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          disabled={first}
                          onClick={() => move(index, -1)}
                          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={last}
                          onClick={() => move(index, 1)}
                          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                          aria-label="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(q)}
                          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          aria-label={`Edit ${q.label}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => remove(q)}
                          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
                          aria-label={`Delete ${q.label}`}
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      )}
    </ModalShell>
  );
}