import { getSiteTexts } from "@/actions/admin/site-content"
import { SiteContentEditor } from "@/components/admin/site-content-editor"
import { editableLocales, type EditableLocale } from "@/lib/site-content/config"
import { getAdminLocale, getAdminTranslations } from "@/lib/i18n/admin-locale"

// Esta rota exige sessão de administrador e consulta o banco; tentar coletá-la
// durante o build do Vercel faz o Next executar a action sem uma sessão.
export const dynamic = "force-dynamic"

const localeNames: Record<EditableLocale, string> = {
    pt: "Português", en: "English", de: "Deutsch", es: "Español", fr: "Français", it: "Italiano", nl: "Nederlands",
}

const isEditableLocale = (value: string | undefined): value is EditableLocale =>
    editableLocales.includes(value as EditableLocale)

export default async function SiteContentPage({ searchParams }: { searchParams: Promise<{ locale?: string }> }) {
    const [params, adminLocale, t] = await Promise.all([
        searchParams,
        getAdminLocale(),
        getAdminTranslations("admin.content"),
    ])
    // Sem idioma na URL, abre no idioma em que a pessoa usa o painel: quem
    // administra em alemão quase sempre quer revisar o site alemão.
    const locale = isEditableLocale(params.locale) ? params.locale : isEditableLocale(adminLocale) ? adminLocale : "pt"
    const fields = await getSiteTexts(locale)

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-admin">{t("eyebrow")}</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
                {editableLocales.map((item) => <a key={item} href={`/super-admin/content?locale=${item}`} className={`rounded-md border px-3 py-1.5 text-sm ${item === locale ? "border-admin bg-admin text-white" : "bg-background hover:bg-muted"}`}>{localeNames[item]}</a>)}
            </div>
            <SiteContentEditor key={locale} locale={locale} fields={fields} />
        </div>
    )
}
