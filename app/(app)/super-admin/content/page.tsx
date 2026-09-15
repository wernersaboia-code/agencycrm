import { editableLocales, getSiteTexts } from "@/actions/admin/site-content"
import { SiteContentEditor } from "@/components/admin/site-content-editor"

const localeNames: Record<(typeof editableLocales)[number], string> = {
    pt: "Português", en: "English", de: "Deutsch", es: "Español", fr: "Français", it: "Italiano", nl: "Nederlands",
}

export default async function SiteContentPage({ searchParams }: { searchParams: Promise<{ locale?: string }> }) {
    const params = await searchParams
    const locale = editableLocales.includes(params.locale as (typeof editableLocales)[number]) ? params.locale as (typeof editableLocales)[number] : "pt"
    const fields = await getSiteTexts(locale)

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-admin">Conteúdo</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">Textos do site</h1>
                <p className="mt-2 text-muted-foreground">Edite os textos públicos sem alterar o design ou o código.</p>
            </div>
            <div className="flex flex-wrap gap-2">
                {editableLocales.map((item) => <a key={item} href={`/super-admin/content?locale=${item}`} className={`rounded-md border px-3 py-1.5 text-sm ${item === locale ? "border-admin bg-admin text-white" : "bg-background hover:bg-muted"}`}>{localeNames[item]}</a>)}
            </div>
            <SiteContentEditor locale={locale} fields={fields} />
        </div>
    )
}
