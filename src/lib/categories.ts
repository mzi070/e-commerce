/** Turn a category slug into a display label. */
export function formatCategoryLabel(category: string): string {
  return category
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** URL-safe category slug. */
export function categoryToSlug(category: string): string {
  return category.trim().toLowerCase().replace(/\s+/g, "-");
}

/** Resolve a slug back to the stored category string. */
export function slugToCategory(slug: string): string {
  return slug.trim().toLowerCase();
}
