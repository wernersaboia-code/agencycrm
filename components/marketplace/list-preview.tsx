// components/marketplace/list-preview.tsx
import { getTranslations } from "next-intl/server"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface ListPreviewProps {
    previewData: unknown
    locale: string
}

/**
 * Formato gravado por generatePreviewData (actions/admin/lists.ts): os nomes de
 * campo têm de casar exatamente com o que é persistido em LeadList.previewData,
 * senão a tabela renderiza colunas vazias.
 *
 * `email` continua sendo gravado no previewData, mas NÃO é lido aqui de
 * propósito. A amostra existe para mostrar QUE empresas o diretório cobre, não
 * para entregar contato antes da compra — anunciar e-mail na vitrine é o que
 * fazia a página ser lida como venda de base de contatos.
 */
interface PreviewRow {
    companyName: string
    country: string
    sector: string
}

export function toRows(previewData: unknown): PreviewRow[] {
    if (!Array.isArray(previewData)) return []

    return previewData
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
            companyName: typeof item.companyName === "string" ? item.companyName : "",
            country: typeof item.country === "string" ? item.country : "",
            sector: typeof item.sector === "string" ? item.sector : "",
        }))
        .filter((row) => row.companyName.trim() !== "")
}

export async function ListPreview({ previewData, locale }: ListPreviewProps) {
    const t = await getTranslations({ locale, namespace: "listing" })

    // Nunca inventar registros: antes daqui havia um mock com varejistas alemães
    // reais (Metro, Edeka, REWE…) exibido como se fosse a amostra da lista. Sem
    // dado real de preview, a página diz que não há amostra.
    const rows = toRows(previewData)

    if (rows.length === 0) {
        return null
    }

    return (
        <div className="border rounded-lg overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t("previewColCompany")}</TableHead>
                        <TableHead>{t("previewColCountry")}</TableHead>
                        <TableHead>{t("previewColSector")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{item.companyName}</TableCell>
                            <TableCell>{item.country}</TableCell>
                            <TableCell>{item.sector}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
