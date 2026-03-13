// components/admin/leads-upload-modal.tsx
"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react"
import { uploadLeadsToList } from "@/actions/admin/lists"
import Papa from "papaparse"

interface LeadsUploadModalProps {
    listId: string
    listName: string
}

interface ParsedLead {
    company: string
    email: string
    country: string
    city?: string
    industry?: string
    companySize?: string
    website?: string
    taxId?: string
    contactName?: string
    jobTitle?: string
    phone?: string
}

export function LeadsUploadModal({ listId, listName }: LeadsUploadModalProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<ParsedLead[]>([])
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        setError(null)
        setPreview([])

        if (!selectedFile) {
            setFile(null)
            return
        }

        if (!selectedFile.name.endsWith(".csv")) {
            setError("Por favor, selecione um arquivo CSV")
            setFile(null)
            return
        }

        setFile(selectedFile)

        // Parse preview
        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            preview: 5,
            complete: (results) => {
                const leads = results.data as ParsedLead[]

                // Validar campos obrigatórios
                const isValid = leads.every(lead =>
                    lead.company && lead.email && lead.country
                )

                if (!isValid) {
                    setError("O CSV deve conter as colunas: company, email, country")
                    setPreview([])
                    return
                }

                setPreview(leads)
            },
            error: (err) => {
                setError(`Erro ao ler arquivo: ${err.message}`)
            }
        })
    }, [])

    const handleUpload = async () => {
        if (!file) return

        setIsLoading(true)
        setError(null)

        try {
            const text = await file.text()

            const result = await new Promise<Papa.ParseResult<ParsedLead>>((resolve) => {
                Papa.parse(text, {
                    header: true,
                    skipEmptyLines: true,
                    complete: resolve,
                })
            })

            const leads = result.data.filter(lead =>
                lead.company && lead.email && lead.country
            )

            if (leads.length === 0) {
                setError("Nenhum lead válido encontrado no arquivo")
                return
            }

            await uploadLeadsToList(listId, leads)

            toast.success(`${leads.length} leads importados com sucesso!`)
            setOpen(false)
            setFile(null)
            setPreview([])
            router.refresh()
        } catch (err) {
            console.error(err)
            setError("Erro ao importar leads")
            toast.error("Erro ao importar leads")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Leads
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Importar Leads</DialogTitle>
                    <DialogDescription>
                        Importe leads para a lista "{listName}" via arquivo CSV
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Instruções */}
                    <div className="bg-muted p-4 rounded-lg text-sm">
                        <p className="font-medium mb-2">Formato do CSV:</p>
                        <p className="text-muted-foreground mb-2">
                            O arquivo deve conter as colunas obrigatórias: <code>company</code>, <code>email</code>, <code>country</code>
                        </p>
                        <p className="text-muted-foreground">
                            Colunas opcionais: <code>city</code>, <code>industry</code>, <code>companySize</code>, <code>website</code>, <code>taxId</code>, <code>contactName</code>, <code>jobTitle</code>, <code>phone</code>
                        </p>
                    </div>

                    {/* Input de arquivo */}
                    <div className="space-y-2">
                        <Label htmlFor="file">Arquivo CSV</Label>
                        <Input
                            id="file"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Erro */}
                    {error && (
                        <div className="flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    {/* Preview */}
                    {preview.length > 0 && (
                        <div className="space-y-2">
                            <Label>Preview (primeiros 5 leads)</Label>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                    <tr>
                                        <th className="text-left p-2">Empresa</th>
                                        <th className="text-left p-2">Email</th>
                                        <th className="text-left p-2">País</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {preview.map((lead, i) => (
                                        <tr key={i} className="border-t">
                                            <td className="p-2">{lead.company}</td>
                                            <td className="p-2">{lead.email}</td>
                                            <td className="p-2">{lead.country}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Ações */}
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!file || preview.length === 0 || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Importando...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Importar
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}