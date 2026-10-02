"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  HelpCircle,
  KeyRound,
  ListChecks,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Tags,
  Trash2,
  Type,
} from "lucide-react";

import {
  createAdminQuestion,
  deleteAdminQuestion,
  getAdminCategories,
  getAdminCategoryQuestions,
  previewAdminCategoryQuestions,
  reorderAdminQuestions,
  setAdminQuestionActive,
  updateAdminQuestion,
  type AdminCategory,
  type QuoteQuestion,
  type QuestionInput,
  type QuoteQuestionType,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

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

const QUESTION_TYPES: QuoteQuestionType[] = ["text", "number", "select", "date"];

const TYPE_LABELS: Record<QuoteQuestionType, string> = {
  text: "Text",
  number: "Number",
  select: "Select",
  date: "Date",
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

function keyFromLabel(label: string): string {
  const key = label
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 32);
  return key;
}

function QuestionDialog({
  open,
  editing,
  saving,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  editing: QuoteQuestion | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: QuestionInput) => void;
}) {
  const [form, setForm] = useState<QuestionForm>(EMPTY_FORM);
  const keyTouched = useRef(false);

  useEffect(() => {
    if (open) {
      keyTouched.current = false;
      setForm(editing ? fromQuestion(editing) : EMPTY_FORM);
    }
  }, [open, editing]);

  const update = (patch: Partial<QuestionForm>) => setForm((f) => ({ ...f, ...patch }));

  const keyValid = /^[a-zA-Z0-9_]{1,64}$/.test(form.key.trim());
  const valid =
    form.label.trim().length > 0 &&
    keyValid &&
    (form.type !== "select" || form.options.split("\n").map((o) => o.trim()).filter(Boolean).length > 0);

  const numeric = form.type === "number" || form.type === "date";
  const textual = form.type === "text";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl sm:rounded-2xl">
        <DialogHeader>
          <span
            className={cn(
              "grid h-11 w-11 place-items-center rounded-2xl",
              editing ? "bg-primary/10 text-primary" : "bg-success/10 text-success",
            )}
          >
            {editing ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </span>
          <DialogTitle className="pt-2">
            {editing ? "Edit question" : "New question"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update this default question. Insurer products in this category inherit your changes."
              : "Add a default question every product in this category will ask customers."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="q-label">Label</Label>
            <Input
              id="q-label"
              value={form.label}
              placeholder="e.g. Year of manufacture"
              onChange={(e) => {
                const label = e.target.value;
                update(
                  editing || keyTouched.current
                    ? { label }
                    : { label, key: keyFromLabel(label) },
                );
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="q-key">Key</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="q-key"
                  value={form.key}
                  className="pl-9"
                  placeholder="e.g. year"
                  onChange={(e) => {
                    keyTouched.current = true;
                    update({ key: e.target.value });
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Stable identifier stored with the customer&apos;s answers. Letters, digits,
                underscores.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(value) => update({ type: value as QuoteQuestionType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.type === "select" && (
            <div className="space-y-1.5">
              <Label htmlFor="q-options">Options (one per line)</Label>
              <Textarea
                id="q-options"
                rows={4}
                value={form.options}
                placeholder={"Private\nBusiness\nCommercial / hire"}
                onChange={(e) => update({ options: e.target.value })}
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="q-placeholder">Placeholder</Label>
              <Input
                id="q-placeholder"
                value={form.placeholder}
                placeholder="e.g. 18000000"
                onChange={(e) => update({ placeholder: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q-help">Help text</Label>
              <Input
                id="q-help"
                value={form.help}
                placeholder="Short hint shown under the question"
                onChange={(e) => update({ help: e.target.value })}
              />
            </div>
          </div>

          {numeric && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="q-min">Minimum{form.type === "date" ? " (YYYY-MM-DD)" : ""}</Label>
                <Input
                  id="q-min"
                  value={form.min}
                  placeholder={form.type === "date" ? "2026-01-01" : "e.g. 0"}
                  onChange={(e) => update({ min: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-max">Maximum</Label>
                <Input
                  id="q-max"
                  value={form.max}
                  placeholder={form.type === "date" ? "2030-12-31" : "e.g. 100000000"}
                  onChange={(e) => update({ max: e.target.value })}
                />
              </div>
            </div>
          )}

          {textual && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="q-minlen">Min length</Label>
                  <Input
                    id="q-minlen"
                    type="number"
                    min={0}
                    value={form.minLength}
                    onChange={(e) => update({ minLength: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="q-maxlen">Max length</Label>
                  <Input
                    id="q-maxlen"
                    type="number"
                    min={0}
                    value={form.maxLength}
                    onChange={(e) => update({ maxLength: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-pattern">Format pattern (regex)</Label>
                <Input
                  id="q-pattern"
                  value={form.pattern}
                  placeholder="e.g. ^[A-Z]{3} \d{3}[A-Z]$"
                  onChange={(e) => update({ pattern: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Required</p>
              <p className="text-xs text-muted-foreground">
                Customers must answer this before submitting a quote.
              </p>
            </div>
            <Switch
              checked={form.required}
              onCheckedChange={(checked) => update({ required: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSave(toInput(form))}
            disabled={!valid || saving}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Add question"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  question,
  busy,
  onOpenChange,
  onConfirm,
}: {
  question: QuoteQuestion | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={question !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md sm:rounded-2xl">
        <DialogHeader>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <Trash2 className="h-5 w-5" />
          </span>
          <DialogTitle className="pt-2">Delete this question?</DialogTitle>
          <DialogDescription>
            “{question?.label}” will be removed from the default questionnaire for every product
            in this category. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete question
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewDialog({
  slug,
  open,
  onOpenChange,
}: {
  slug: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [questions, setQuestions] = useState<QuoteQuestion[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open || !slug) return;
    setQuestions(null);
    setError(false);
    previewAdminCategoryQuestions(slug)
      .then(setQuestions)
      .catch(() => setError(true));
  }, [open, slug]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg sm:rounded-2xl">
        <DialogHeader>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Eye className="h-5 w-5" />
          </span>
          <DialogTitle className="pt-2">Customer preview</DialogTitle>
          <DialogDescription>
            The active questions below are what customers answer in this category&apos;s Get Quote
            flow. Product-specific questions are added by insurers on top of these.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {questions === null && !error ? (
            <div className="space-y-3 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-11 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Could not load the preview. Try again.
            </p>
          ) : !questions || questions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No active questions yet — add some first.
            </p>
          ) : (
            questions.map((q, i) => (
              <div key={q.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">
                    <span className="mr-1.5 text-muted-foreground">{i + 1}.</span>
                    {q.label}
                  </p>
                  <Badge variant="outline">{TYPE_LABELS[q.type]}</Badge>
                </div>
                {q.required && (
                  <p className="mt-0.5 text-xs text-success">Required</p>
                )}
                {q.type === "select" && q.options.length > 0 && (
                  <p className="mt-2 flex flex-wrap gap-1">
                    {q.options.map((option) => (
                      <span
                        key={option}
                        className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {option}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CategoryQuestionsPanel({
  category,
}: {
  category: { slug: string; name: string };
}) {
  const { slug } = category;
  const [questions, setQuestions] = useState<QuoteQuestion[] | null>(null);
  const [categoryName, setCategoryName] = useState(category.name);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<QuoteQuestion | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<QuoteQuestion | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadQuestions = useCallback((s: string) => {
    setQuestions(null);
    getAdminCategoryQuestions(s)
      .then((data) => {
        setQuestions(data.questions);
        setCategoryName(data.category.name);
      })
      .catch(() => setQuestions([]));
  }, []);

  useEffect(() => {
    loadQuestions(slug);
  }, [slug, loadQuestions]);

  const activeCount = useMemo(() => questions?.filter((q) => q.active).length ?? 0, [questions]);

  const move = useCallback(
    async (index: number, direction: -1 | 1) => {
      if (!questions) return;
      const target = index + direction;
      if (target < 0 || target >= questions.length) return;
      const next = [...questions];
      [next[index], next[target]] = [next[target], next[index]];
      setQuestions(next);
      try {
        await reorderAdminQuestions(
          slug,
          next.map((q) => q.id),
        );
      } catch {
        loadQuestions(slug);
      }
    },
    [slug, questions, loadQuestions],
  );

  const handleSave = useCallback(
    async (input: QuestionInput) => {
      setSaving(true);
      try {
        if (editing) {
          const updated = await updateAdminQuestion(slug, editing.id, input);
          setQuestions((prev) => prev?.map((q) => (q.id === updated.id ? updated : q)) ?? prev);
        } else {
          const created = await createAdminQuestion(slug, input);
          setQuestions((prev) => (prev ? [...prev, created] : [created]));
        }
        setFormOpen(false);
        setEditing(null);
      } catch {
        // leave the dialog open so the admin can retry
      } finally {
        setSaving(false);
      }
    },
    [slug, editing],
  );

  const toggleActive = useCallback(
    async (question: QuoteQuestion) => {
      if (question.system) return;
      setBusyKey(question.id);
      try {
        const updated = await setAdminQuestionActive(slug, question.id, !question.active);
        setQuestions((prev) => prev?.map((q) => (q.id === updated.id ? updated : q)) ?? prev);
      } catch {
        // keep the previous state
      } finally {
        setBusyKey(null);
      }
    },
    [slug],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleting(true);
    try {
      await deleteAdminQuestion(slug, target.id);
      setQuestions((prev) => prev?.filter((q) => q.id !== target.id) ?? prev);
      setDeleteTarget(null);
    } catch {
      // leave the dialog open so the admin can retry
    } finally {
      setDeleting(false);
    }
  }, [slug, deleteTarget]);

  return (
    <>
      <QuestionDialog
        key={formOpen ? (editing ? `edit-${editing.id}` : "new") : "closed"}
        open={formOpen}
        editing={editing}
        saving={saving}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSave={handleSave}
      />

      <DeleteDialog
        question={deleteTarget}
        busy={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />

      <PreviewDialog
        slug={slug}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="surface flex items-start gap-3 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted">
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Questions</p>
            <p className="mt-0.5 text-2xl font-bold">{questions ? questions.length : "—"}</p>
          </div>
        </div>
        <div className="surface flex items-start gap-3 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted">
            <Eye className="h-4 w-4 text-muted-foreground" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Active (asked)</p>
            <p className="mt-0.5 text-2xl font-bold text-success">{questions ? activeCount : "—"}</p>
          </div>
        </div>
        <div className="surface flex items-start gap-3 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Protected</p>
            <p className="mt-0.5 text-2xl font-bold">
              {questions ? questions.filter((q) => q.system).length : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Question list */}
      <div className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">{categoryName} — questions</h2>
            <p className="text-sm text-muted-foreground">
              Ordered top-to-bottom; insurers can add product-specific extras below these.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={questions === null}>
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New question
            </Button>
          </div>
        </div>

        <div className="p-5">
          {questions === null ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
) : !questions || questions.length === 0 ? (
            <div className="py-14 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted">
                <Type className="h-5 w-5 text-muted-foreground" />
              </span>
              <p className="mt-4 font-semibold">No questions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a default question — customers will answer it on every product in this
                category.
              </p>
            </div>
          ) : (
            <ol className="space-y-2">
              {questions.map((q, index) => {
                const busy = busyKey === q.id;
                const first = index === 0;
                const last = index === questions.length - 1;
                return (
                  <li
                    key={q.id}
                    className={cn(
                      "flex items-start justify-between gap-4 rounded-xl border border-border p-4",
                      !q.active && "opacity-60",
                    )}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold">{q.label}</p>
                          <Badge variant="outline">{TYPE_LABELS[q.type]}</Badge>
                          {q.required && (
                            <Badge className="border-transparent bg-success/15 text-success hover:bg-success/15">
                              Required
                            </Badge>
                          )}
                          {q.system && (
                            <Badge variant="outline" className="gap-1">
                              <Lock className="h-3 w-3" />
                              Protected
                            </Badge>
                          )}
                          {!q.active && (
                            <Badge variant="outline" className="border-destructive/30 text-destructive">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <code className="mr-2 rounded bg-muted px-1.5 py-0.5">{q.key}</code>
                          {q.type === "select" && q.options.length > 0
                            ? q.options.slice(0, 3).join(" · ") + (q.options.length > 3 ? " · …" : "")
                            : q.placeholder && <span>e.g. {q.placeholder}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        disabled={first}
                        onClick={() => move(index, -1)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                        aria-label="Move up"
                        title="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        disabled={last}
                        onClick={() => move(index, 1)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                        aria-label="Move down"
                        title="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditing(q);
                          setFormOpen(true);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        aria-label={`Edit ${q.label}`}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        disabled={busy || q.system}
                        onClick={() => toggleActive(q)}
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-40",
                          q.active
                            ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            : "text-muted-foreground hover:bg-success/10 hover:text-success",
                        )}
                        aria-label={q.active ? `Deactivate ${q.label}` : `Activate ${q.label}`}
                        title={q.system ? "Protected" : q.active ? "Deactivate" : "Activate"}
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        disabled={q.system}
                        onClick={() => setDeleteTarget(q)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
                        aria-label={`Delete ${q.label}`}
                        title={q.system ? "Protected" : "Delete"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      {/* Inherited note */}
      <div className="surface flex items-start gap-3 p-4 text-sm">
        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-muted-foreground">
          Insurers inherit these questions on every product in this category and can add
          product-specific extras. Deactivating or deleting a question here affects every
          product that inherits it. Protected questions ensure foundational fields (for example
          the start date) are always asked.
        </p>
      </div>
    </>
  );
}

export default function AdminQuestions() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const loadCategories = useCallback(() => {
    getAdminCategories()
      .then((list) => {
        setCategories(list);
        const active = list.find((c) => c.active);
        setSelectedSlug((prev) =>
          prev && list.some((c) => c.slug === prev) ? prev : (active?.slug ?? list[0]?.slug ?? null),
        );
      })
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  if (loadError) {
    return (
      <div className="surface p-10 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <ListChecks className="h-5 w-5" />
        </span>
        <p className="mt-4 font-semibold">Could not load categories</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Check that the backend is running and try again.
        </p>
        <Button
          className="mt-4"
          onClick={() => {
            setLoadError(false);
            loadCategories();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  const selectedName =
    categories?.find((c) => c.slug === selectedSlug)?.name ?? "";

  return (
    <div className="space-y-5">
      {/* Category picker */}
      <div className="surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Category questionnaire</h2>
            <p className="text-sm text-muted-foreground">
              Default questions asked for every product in a category
            </p>
          </div>
          {categories && categories.length > 1 && (
            <Select value={selectedSlug ?? ""} onValueChange={(value) => setSelectedSlug(value)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug} disabled={!c.active}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {categories && categories.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.slug}
                disabled={!c.active}
                onClick={() => setSelectedSlug(c.slug)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40",
                  selectedSlug === c.slug
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-input text-muted-foreground hover:bg-accent",
                )}
              >
                <Tags className="h-3.5 w-3.5" />
                {c.name}
                {!c.active && <Badge variant="outline">hidden</Badge>}
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedSlug ? (
        <div className="surface py-16 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted">
            <ListChecks className="h-5 w-5 text-muted-foreground" />
          </span>
          <p className="mt-4 font-semibold">No category selected</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a category from the list to manage its questions.
          </p>
        </div>
      ) : (
        <CategoryQuestionsPanel
          key={selectedSlug}
          category={{ slug: selectedSlug, name: selectedName }}
        />
      )}
    </div>
  );
}