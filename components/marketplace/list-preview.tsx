// components/marketplace/list-preview.tsx
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
}

export function ListPreview({ previewData }: ListPreviewProps) {
    // Preview mockado por enquanto
    const mockPreview = [
        { company: "Metro AG", city: "Düsseldorf", email: "con****@metro.de" },
        { company: "Edeka Group", city: "Hamburg", email: "imp****@edeka.de" },
        { company: "REWE Group", city: "Köln", email: "pur****@rewe.de" },
        { company: "Aldi Süd", city: "Essen", email: "buy****@aldi.de" },
        { company: "Lidl Stiftung", city: "Heilbronn", email: "sou****@lidl.de" },
    ]

    const preview = (previewData as typeof mockPreview) || mockPreview

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead>Email</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {preview.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{item.company}</TableCell>
                            <TableCell>{item.city}</TableCell>
                            <TableCell className="font-mono text-sm">{item.email}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
