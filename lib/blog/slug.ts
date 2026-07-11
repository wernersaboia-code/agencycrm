export function slugify(input: string, fallback = "post"): string {
    const base = input
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "") // remove diacríticos
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")

    return base.length > 0 ? base : fallback
}
