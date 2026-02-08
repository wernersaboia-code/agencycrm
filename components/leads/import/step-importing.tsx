// components/leads/import/step-importing.tsx

"use client"

import { useEffect, useState, useRef } from "react"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

import { importLeads } from "@/actions/leads"
import type { ProcessedLead } from "@/lib/csv-parser"

// ============================================================
// TIPOS
// ============================================================

interface StepImportingProps {
    workspaceId: string
    leads: ProcessedLead[]
    onComplete: (result: {
        imported: number
        duplicates: number
        errors: number
    }) => void
}

// ============================================================
// COMPONENTE
// ============================================================

export function StepImporting({
                                  workspaceId,
                                  leads,
                                  onComplete
                              }: StepImportingProps) {
    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState<'importing' | 'success' | 'error'>('importing')
    const [message, setMessage] = useState('Preparando importação...')
    const hasStarted = useRef(false)

    useEffect(() => {
        if (hasStarted.current) return
        hasStarted.current = true

        async function doImport() {
            try {
                setProgress(10)
                setMessage('Enviando dados para o servidor...')

                // Prepara os dados
                const leadsToImport = leads.map(lead => ({
                    firstName: lead.data.firstName as string,
                    lastName: lead.data.lastName as string | undefined,
                    email: lead.data.email as string,
                    phone: lead.data.phone as string | undefined,
                    mobile: lead.data.mobile as string | undefined,
                    company: lead.data.company as string | undefined,
                    jobTitle: lead.data.jobTitle as string | undefined,
                    website: lead.data.website as string | undefined,
                    taxId: lead.data.taxId as string | undefined,
                    industry: lead.data.industry as string | undefined,
                    companySize: lead.data.companySize as string | undefined,
                    address: lead.data.address as string | undefined,
                    city: lead.data.city as string | undefined,
                    state: lead.data.state as string | undefined,
                    postalCode: lead.data.postalCode as string | undefined,
                    country: lead.data.country as string | undefined,
                    notes: lead.data.notes as string | undefined,
                }))

                setProgress(30)
                setMessage('Processando leads...')

                // Chama a action
                const result = await importLeads(workspaceId, leadsToImport)

                if (result.success && result.data) {
                    setProgress(100)
                    setStatus('success')
                    setMessage('Importação concluída!')

                    onComplete({
                        imported: result.data.imported,
                        duplicates: result.data.duplicates,
                        errors: result.data.errors,
                    })
                } else {
                    throw new Error(result.error || 'Erro desconhecido')
                }
            } catch (error) {
                console.error('Erro na importação:', error)
                setStatus('error')
                setMessage(error instanceof Error ? error.message : 'Erro ao importar leads')
            }
        }

        doImport()
    }, [workspaceId, leads, onComplete])

    // Simula progresso enquanto processa
    useEffect(() => {
        if (status !== 'importing') return

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev
                return prev + Math.random() * 10
            })
        }, 500)

        return () => clearInterval(interval)
    }, [status])

    return (
        <Card>
            <CardContent className="py-12">
                <div className="flex flex-col items-center text-center max-w-md mx-auto">
                    {/* Ícone */}
                    <div className={`
            w-20 h-20 rounded-full flex items-center justify-center mb-6
            ${status === 'importing' ? 'bg-primary/10' :
                        status === 'success' ? 'bg-green-100 dark:bg-green-900' :
                            'bg-red-100 dark:bg-red-900'}
          `}>
                        {status === 'importing' && (
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        )}
                        {status === 'success' && (
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        )}
                        {status === 'error' && (
                            <AlertCircle className="h-10 w-10 text-red-600" />
                        )}
                    </div>

                    {/* Título */}
                    <h3 className="text-xl font-semibold mb-2">
                        {status === 'importing' && 'Importando leads...'}
                        {status === 'success' && 'Importação concluída!'}
                        {status === 'error' && 'Erro na importação'}
                    </h3>

                    {/* Mensagem */}
                    <p className="text-muted-foreground mb-6">
                        {message}
                    </p>

                    {/* Barra de progresso */}
                    {status === 'importing' && (
                        <div className="w-full space-y-2">
                            <Progress value={progress} className="h-3" />
                            <p className="text-sm text-muted-foreground">
                                {Math.round(progress)}%
                            </p>
                        </div>
                    )}

                    {/* Info */}
                    {status === 'importing' && (
                        <p className="text-sm text-muted-foreground mt-6">
                            Importando {leads.length} leads. Por favor, não feche esta página.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}