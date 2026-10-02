"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  ListChecks,
  Loader2,
  Package,
  Pencil,
  Plus,
  ScrollText,
  Tags,
  Trash2,
} from "lucide-react";

import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  setAdminCategoryStatus,
  updateAdminCategory,
  type AdminCategory,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CategoryQuestionsPanel } from "@/components/dashboard/admin-questions";
import { RowActionsMenu } from "@/components/dashboard/row-actions-menu";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CategoryForm = {
  slug: string;
  name: string;
  blurb: string;
  from: string;
};

const emptyForm: CategoryForm = { slug: "", name: "", blurb: "", from: "" };

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function CategoryDialog({
  open,
  editing,
  saving,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  editing: AdminCategory | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (form: CategoryForm) => void;
}) {
  const [form, setForm] = useState<CategoryForm>(() =>
    editing
      ? {
          slug: editing.slug,
          name: editing.name,
          blurb: editing.blurb,
          from: editing.from,
        }
      : emptyForm,
  );

  const update = (patch: Partial<CategoryForm>) => setForm((f) => ({ ...f, ...patch }));

  const valid = form.name.trim().length > 0 && (!!editing || slugify(form.slug).length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md sm:rounded-2xl">
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
            {editing ? `Edit ${editing.name}` : "New category"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update this category's details. Changes re-index marketplace search shortly."
              : "Add a category so carriers can publish and organise their products."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={form.name}
              placeholder="e.g. Cargo"
              onChange={(e) => {
                const name = e.target.value;
                update({ name, slug: editing ? form.slug : slugify(name) });
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={form.slug}
              disabled={!!editing}
              placeholder="e.g. cargo"
              onChange={(e) => update({ slug: slugify(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Used in URLs and product lookups. Cannot be changed after creation.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-blurb">Blurb</Label>
            <Input
              id="cat-blurb"
              value={form.blurb}
              placeholder="Short description shown to customers"
              onChange={(e) => update({ blurb: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-from">Display price</Label>
            <Input
              id="cat-from"
              value={form.from}
              placeholder='e.g. "RWF 12,000/mo" or "Quote"'
              onChange={(e) => update({ from: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="rounded-full border border-input px-5 py-2 text-sm font-semibold transition-colors hover:bg-accent disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={!valid || saving}
            onClick={() =>
              onSave({
                slug: slugify(form.slug),
                name: form.name.trim(),
                blurb: form.blurb.trim(),
                from: form.from.trim(),
              })
            }
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-brand transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Create category"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HideDialog({
  category,
  busy,
  onOpenChange,
  onConfirm,
}: {
  category: AdminCategory | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  // If the category is currently active, confirming this modal will hide it (hide = true).
  // If it is currently inactive, confirming this modal will show it (hide = false).
  const hide = category ? category.active : false;
  return (
    <Dialog open={category !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md sm:rounded-2xl">
        <DialogHeader>
          <span
            className={cn(
              "grid h-11 w-11 place-items-center rounded-2xl",
              hide ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
            )}
          >
            {hide ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </span>
          <DialogTitle className="pt-2">
            {hide ? `Hide ${category?.name}?` : `Show ${category?.name}?`}
          </DialogTitle>
          <DialogDescription>
            {hide ? (
              <>
                Products in this category will be hidden from marketplace listings and new quotes
                until you show it again.
              </>
            ) : (
              <>
                Products in this category will become visible again in marketplace listings and
                quotable by carriers.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="rounded-full border border-input px-5 py-2 text-sm font-semibold transition-colors hover:bg-accent disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold shadow-brand transition-opacity hover:opacity-90 disabled:opacity-50",
              hide
                ? "bg-destructive text-destructive-foreground"
                : "bg-success text-success-foreground",
            )}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {hide ? "Hide category" : "Show category"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  category,
  busy,
  onOpenChange,
  onConfirm,
}: {
  category: AdminCategory | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={category !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md sm:rounded-2xl">
        <DialogHeader>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <Trash2 className="h-5 w-5" />
          </span>
          <DialogTitle className="pt-2">Delete {category?.name}?</DialogTitle>
          <DialogDescription>
            This permanently removes the {category?.name} category. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="rounded-full border border-input px-5 py-2 text-sm font-semibold transition-colors hover:bg-accent disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-destructive px-5 py-2 text-sm font-semibold text-destructive-foreground shadow-brand transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete category
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [hideTarget, setHideTarget] = useState<AdminCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [questionsFor, setQuestionsFor] = useState<AdminCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [busySlug, setBusySlug] = useState<string | null>(null);

  const load = useCallback(() => {
    getAdminCategories()
      .then(setCategories)
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = useCallback(
    async (form: CategoryForm) => {
      setSaving(true);
      try {
        if (editing) {
          const updated = await updateAdminCategory(editing.slug, {
            name: form.name,
            blurb: form.blurb,
            from: form.from,
          });
          setCategories((prev) =>
            prev?.map((c) => (c.slug === updated.slug ? updated : c)) ?? null,
          );
        } else {
          const created = await createAdminCategory(form);
          setCategories((prev) => (prev ? [created, ...prev] : [created]));
        }
        setFormOpen(false);
        setEditing(null);
      } catch {
        // leave the dialog open so the admin can retry
      } finally {
        setSaving(false);
      }
    },
    [editing],
  );

  const confirmHide = useCallback(async () => {
    if (!hideTarget) return;
    const target = hideTarget;
    const nextActive = !target.active;
    setBusySlug(target.slug);
    try {
      const updated = await setAdminCategoryStatus(target.slug, nextActive);
      setCategories((prev) =>
        prev?.map((c) => (c.slug === updated.slug ? updated : c)) ?? null,
      );
      setHideTarget(null);
    } catch {
      // leave the dialog open so the admin can retry
    } finally {
      setBusySlug(null);
    }
  }, [hideTarget]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setBusySlug(target.slug);
    try {
      await deleteAdminCategory(target.slug);
      setCategories((prev) => prev?.filter((c) => c.slug !== target.slug) ?? null);
      setDeleteTarget(null);
    } catch {
      // leave the dialog open so the admin can retry
    } finally {
      setBusySlug(null);
    }
  }, [deleteTarget]);

  if (error) {
    return (
      <div className="surface p-10 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <Tags className="h-5 w-5" />
        </span>
        <p className="mt-4 font-semibold">No results found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          No categories match this search.
        </p>
        <button
          onClick={() => {
            setError(false);
            load();
          }}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand"
        >
          Try again
        </button>
      </div>
    );
  }

  const live = categories?.filter((c) => c.active) ?? [];
  const hidden = categories?.filter((c) => !c.active) ?? [];
  const productCount = categories?.reduce((a, c) => a + c.productCount, 0) ?? 0;
  const policyCount = categories?.reduce((a, c) => a + c.policyCount, 0) ?? 0;

  return (
    <div className="space-y-5">
      <CategoryDialog
        key={formOpen ? (editing ? `edit-${editing.slug}` : "new") : "closed"}
        open={formOpen}
        editing={editing}
        saving={saving}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSave={handleSave}
      />

      <HideDialog
        category={hideTarget}
        busy={busySlug === hideTarget?.slug}
        onOpenChange={(open) => {
          if (!open) setHideTarget(null);
        }}
        onConfirm={confirmHide}
      />

      <DeleteDialog
        category={deleteTarget}
        busy={busySlug === deleteTarget?.slug}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />

      <Dialog
        open={questionsFor !== null}
        onOpenChange={(open) => {
          if (!open) setQuestionsFor(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl sm:rounded-2xl">
          <DialogHeader>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ListChecks className="h-5 w-5" />
            </span>
            <DialogTitle className="pt-2">Quote Questions</DialogTitle>
            <DialogDescription>
              Manage the default questions customers answer for every product in{" "}
              {questionsFor?.name ?? "this category"}.
            </DialogDescription>
          </DialogHeader>
          {questionsFor && (
            <CategoryQuestionsPanel
              key={questionsFor.slug}
              category={{ slug: questionsFor.slug, name: questionsFor.name }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Live Categories", value: live.length, cls: "text-success", icon: Tags },
          { label: "Hidden", value: hidden.length, cls: "text-muted-foreground", icon: EyeOff },
          { label: "Products", value: productCount, cls: "text-primary", icon: Package },
          { label: "Policies on Book", value: policyCount, cls: "text-primary", icon: ScrollText },
        ].map(({ label, value, cls, icon: Icon }) => (
          <div key={label} className="surface flex items-start gap-3 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn("mt-0.5 text-2xl font-bold", cls)}>{categories ? value : "—"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar + table */}
      <div className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Marketplace Categories</h2>
            <p className="text-sm text-muted-foreground">
              The taxonomy every product and search filter is built on
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New category
          </button>
        </div>

        <div className="overflow-x-auto p-5">
          {categories === null ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="py-16 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted">
                <Tags className="h-5 w-5 text-muted-foreground" />
              </span>
              <p className="mt-4 font-semibold">No categories defined</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a category before carriers can publish products.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="px-4">Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Products</TableHead>
                  <TableHead className="text-center">Policies</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => {
                  const busy = busySlug === c.slug;
                  return (
                    <TableRow key={c.slug} className={cn("group", !c.active && "opacity-60")}>
                      <TableCell className="px-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                            <Tags className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{c.name}</p>
                            {c.blurb && (
                              <p className="truncate text-xs text-muted-foreground">{c.blurb}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground">{c.slug}</code>
                      </TableCell>
                      <TableCell className="text-center font-medium">{c.productCount}</TableCell>
                      <TableCell className="text-center font-medium">{c.policyCount}</TableCell>
                      <TableCell>
                        {c.active ? (
                          <Badge className="border-transparent bg-success/15 text-success hover:bg-success/15">
                            Live
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-destructive/30 text-destructive">
                            Hidden
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="pr-4">
                        <RowActionsMenu
                          actions={["Questions", "Edit", c.active ? "Hide" : "Show", "Delete"]}
                          disabled={(action) => busy || (action === "Delete" && c.productCount > 0)}
                          onSelect={(action) => {
                            if (action === "Questions") setQuestionsFor(c);
                            if (action === "Edit") {
                              setEditing(c);
                              setFormOpen(true);
                            }
                            if (action === "Hide" || action === "Show") setHideTarget(c);
                            if (action === "Delete") setDeleteTarget(c);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
