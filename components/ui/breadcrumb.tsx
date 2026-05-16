import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface BreadcrumbItem {
    label: string
    href?: string
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
    return (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            {items.map((item, i) => (
                <span key={i} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="h-4 w-4" />}
                    {item.href ? (
                        <Link href={item.href} className="hover:text-foreground">
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-foreground font-medium">{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    )
}
