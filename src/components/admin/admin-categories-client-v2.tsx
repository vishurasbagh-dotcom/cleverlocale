"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { createCategory, deleteCategory, updateCategory, type CategoryFormState } from "@/actions/admin-category";
import { flattenCategoryPicker, type CategoryTreeNode } from "@/lib/category-tree";

function filterTree(nodes: CategoryTreeNode[], query: string): CategoryTreeNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;
  const walk = (list: CategoryTreeNode[]): CategoryTreeNode[] =>
    list
      .map((n) => ({ ...n, children: walk(n.children) }))
      .filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.slug.toLowerCase().includes(q) ||
          (n.description ?? "").toLowerCase().includes(q) ||
          n.children.length > 0,
      );
  return walk(nodes);
}

function countNodes(nodes: CategoryTreeNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countNodes(n.children), 0);
}

function EditInline({
  node,
  locked,
}: {
  node: CategoryTreeNode;
  locked: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateCategory, {} as CategoryFormState);
  return (
    <div>
      <button
        type="button"
        disabled={locked}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
      >
        {open ? "Close" : "Edit"}
      </button>
      {open ? (
        <form action={action} className="mt-2 space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-900">
          <input type="hidden" name="categoryId" value={node.id} />
          <input
            name="name"
            required
            defaultValue={node.name}
            className="w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
          <textarea
            name="description"
            rows={2}
            defaultValue={node.description ?? ""}
            placeholder="Description (optional)"
            className="w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            type="submit"
            disabled={pending || locked}
            className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save"}
          </button>
          {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
          {state.success ? <p className="text-xs text-emerald-600">{state.success}</p> : null}
        </form>
      ) : null}
    </div>
  );
}

function DeleteAction({
  categoryId,
  locked,
}: {
  categoryId: string;
  locked: boolean;
}) {
  const [state, action, pending] = useActionState(deleteCategory, {} as CategoryFormState);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (locked) {
          e.preventDefault();
          return;
        }
        if (!window.confirm("Delete this category and all subcategories? Products will become uncategorized.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="categoryId" value={categoryId} />
      <button
        type="submit"
        disabled={pending || locked}
        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 disabled:opacity-40 dark:border-red-900/50 dark:text-red-400"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>
      {state.error ? <p className="mt-1 text-xs text-red-600">{state.error}</p> : null}
      {state.success ? <p className="mt-1 text-xs text-emerald-600">{state.success}</p> : null}
    </form>
  );
}

function NodeRow({
  node,
  path,
  productCountById,
  manageLocked,
  onAddChildQuick,
}: {
  node: CategoryTreeNode;
  path: string;
  productCountById: Record<string, number>;
  manageLocked: boolean;
  onAddChildQuick: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">{node.name}</p>
            <span
              className={`rounded px-2 py-0.5 text-[11px] ${
                node.children.length === 0
                  ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              }`}
            >
              {node.children.length === 0 ? "Subcategory" : "Category"}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{path}</p>
          <p className="mt-1 font-mono text-xs text-zinc-500">/{node.slug}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {node.children.length} children · {productCountById[node.id] ?? 0} products
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <button
            type="button"
            onClick={() => onAddChildQuick(node.id)}
            className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          >
            Add child
          </button>
          <EditInline node={node} locked={manageLocked} />
          <DeleteAction categoryId={node.id} locked={manageLocked} />
        </div>
      </div>
    </div>
  );
}

function NestedNodes({
  nodes,
  pathPrefix,
  productCountById,
  manageLocked,
  onAddChildQuick,
}: {
  nodes: CategoryTreeNode[];
  pathPrefix: string;
  productCountById: Record<string, number>;
  manageLocked: boolean;
  onAddChildQuick: (id: string) => void;
}) {
  if (nodes.length === 0) return null;
  return (
    <ul className="mt-2 space-y-2 border-l border-zinc-200 pl-3 dark:border-zinc-700">
      {nodes.map((child) => {
        const childPath = `${pathPrefix} > ${child.name}`;
        return (
          <li key={child.id}>
            <NodeRow
              node={child}
              path={childPath}
              productCountById={productCountById}
              manageLocked={manageLocked}
              onAddChildQuick={onAddChildQuick}
            />
            <NestedNodes
              nodes={child.children}
              pathPrefix={childPath}
              productCountById={productCountById}
              manageLocked={manageLocked}
              onAddChildQuick={onAddChildQuick}
            />
          </li>
        );
      })}
    </ul>
  );
}

export function AdminCategoriesClientV2({
  tree,
  productCountById,
}: {
  tree: CategoryTreeNode[];
  productCountById: Record<string, number>;
}) {
  const [createState, createAction, createPending] = useActionState(createCategory, {} as CategoryFormState);
  const [showCreate, setShowCreate] = useState(true);
  const [categoryType, setCategoryType] = useState<"PRIMARY" | "CHILD">("PRIMARY");
  const [parentId, setParentId] = useState("");
  const [search, setSearch] = useState("");
  const [manageLocked, setManageLocked] = useState(true);
  const [expandedRoots, setExpandedRoots] = useState<Set<string>>(() => new Set(tree.map((t) => t.id)));

  const parentOptions = useMemo(() => flattenCategoryPicker(tree), [tree]);
  const filteredTree = useMemo(() => filterTree(tree, search), [tree, search]);
  const visibleCount = useMemo(() => countNodes(filteredTree), [filteredTree]);
  const totalCount = useMemo(() => countNodes(tree), [tree]);

  function onAddChildQuick(categoryId: string) {
    setShowCreate(true);
    setCategoryType("CHILD");
    setParentId(categoryId);
    document.getElementById("category-name-input")?.focus();
  }

  function toggleRoot(id: string) {
    setExpandedRoots((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Category management</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              {showCreate ? "Hide add form" : "Add category"}
            </button>
            <button
              type="button"
              onClick={() => setManageLocked((v) => !v)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                manageLocked
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
              }`}
            >
              Edit/Delete: {manageLocked ? "Locked" : "Unlocked"}
            </button>
          </div>
        </div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Child categories are always shown nested under their parent categories.
        </p>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, path, slug"
          className="mt-3 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <p className="mt-2 text-xs text-zinc-500">
          Showing {visibleCount} of {totalCount} categories
        </p>
      </section>

      {showCreate ? (
        <section className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Add category</h3>
          {createState.error ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{createState.error}</p>
          ) : null}
          {createState.success ? (
            <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{createState.success}</p>
          ) : null}
          <form action={createAction} className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium">Category type</span>
              <select
                name="categoryType"
                value={categoryType}
                onChange={(e) => {
                  const next = e.target.value as "PRIMARY" | "CHILD";
                  setCategoryType(next);
                  if (next === "PRIMARY") setParentId("");
                }}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="PRIMARY">Primary / Parent</option>
                <option value="CHILD">Child</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium">Name</span>
              <input
                id="category-name-input"
                name="name"
                required
                placeholder={categoryType === "PRIMARY" ? "e.g. Groceries" : "e.g. Cereals and Pulses"}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Parent {categoryType === "CHILD" ? "(required)" : "(not needed)"}</span>
              <select
                name="parentId"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                disabled={categoryType === "PRIMARY"}
                required={categoryType === "CHILD"}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">{categoryType === "PRIMARY" ? "- Not required -" : "- Choose parent -"}</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="font-medium">Description (optional)</span>
              <textarea
                name="description"
                rows={2}
                placeholder="Short internal note"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={createPending}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {createPending ? "Adding..." : "Add category"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <ul className="space-y-3">
        {filteredTree.map((root) => {
          const expanded = expandedRoots.has(root.id);
          return (
            <li key={root.id} className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleRoot(root.id)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-zinc-200 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                    title={expanded ? "Collapse" : "Expand"}
                  >
                    {expanded ? "-" : "+"}
                  </button>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{root.name}</p>
                </div>
                <span className="text-xs text-zinc-500">{root.children.length} direct children</span>
              </div>

              {expanded ? (
                <div className="mt-2 space-y-2">
                  <NodeRow
                    node={root}
                    path={root.name}
                    productCountById={productCountById}
                    manageLocked={manageLocked}
                    onAddChildQuick={onAddChildQuick}
                  />
                  <NestedNodes
                    nodes={root.children}
                    pathPrefix={root.name}
                    productCountById={productCountById}
                    manageLocked={manageLocked}
                    onAddChildQuick={onAddChildQuick}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
