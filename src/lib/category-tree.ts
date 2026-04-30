export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  children: CategoryTreeNode[];
};

export type CategoryRow = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
};

export function buildCategoryTree(rows: CategoryRow[]): CategoryTreeNode[] {
  const byParent = new Map<string | null, CategoryRow[]>();
  for (const r of rows) {
    const k = r.parentId;
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k)!.push(r);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }
  function walk(parentId: string | null): CategoryTreeNode[] {
    return (byParent.get(parentId) ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      children: walk(r.id),
    }));
  }
  return walk(null);
}

export type CatalogOption = { slug: string; label: string };

/** Every category appears once, depth-first, with a breadcrumb-style label for the storefront search. */
export function flattenCategoryOptions(nodes: CategoryTreeNode[], prefix = ""): CatalogOption[] {
  const out: CatalogOption[] = [];
  for (const n of nodes) {
    const label = prefix ? `${prefix} › ${n.name}` : n.name;
    out.push({ slug: n.slug, label });
    out.push(...flattenCategoryOptions(n.children, label));
  }
  return out;
}

/** Parent picker for admin forms — same ordering as the storefront list. */
export function flattenCategoryPicker(nodes: CategoryTreeNode[], prefix = ""): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const n of nodes) {
    const label = prefix ? `${prefix} › ${n.name}` : n.name;
    out.push({ id: n.id, label });
    out.push(...flattenCategoryPicker(n.children, label));
  }
  return out;
}

/** Leaf categories only — vendors assign products to the shelf (most specific) category. */
export function flattenLeafCategoryOptions(
  nodes: CategoryTreeNode[],
  prefix = "",
): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const n of nodes) {
    const label = prefix ? `${prefix} › ${n.name}` : n.name;
    if (n.children.length === 0) {
      out.push({ id: n.id, label });
    } else {
      out.push(...flattenLeafCategoryOptions(n.children, label));
    }
  }
  return out;
}
