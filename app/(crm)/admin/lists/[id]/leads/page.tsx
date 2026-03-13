// app/(crm)/admin/lists/[id]/leads/page.tsx
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    ArrowLeft,
    Upload,
    Download,
    Trash2,
    CheckCircle,
    XCircle,
    Building2
} from "lucide-react"
import { LeadsUploadModal } from "@/components/admin/leads-upload-modal"
import { DeleteLeadButton } from "@/components/admin/delete-lead-button"

interface ListLeadsPageProps {
    params: Promise<{ id: string }>
}

export default async function ListLeadsPage({ params }: ListLeadsPageProps) {
    const { id } = await params

    const list = await prisma.leadList.findUnique({
        where: { id },
        include: {
            leads: {
                orderBy: { createdAt: "desc" },
                take: 100,
            },
            _count: {
                select: { leads: true }
            }
        },
    })

    if (!list) {
        notFound()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/admin/lists"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Voltar para listas
                    </Link>
                    <h1 className="text-3xl font-bold">{list.name}</h1>
                    <p className="text-muted-foreground">
                        {list._count.leads.toLocaleString()} leads nesta lista
                    </p>
                </div>
                <div className="flex gap-2">
                    <LeadsUploadModal listId={list.id} listName={list.name} />
                    <Button variant="outline" disabled>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">Total de Leads</div>
                    <div className="text-2xl font-bold">{list._count.leads}</div>
                </div>
                <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">Emails Verificados</div>
                    <div className="text-2xl font-bold">
                        {list.leads.filter(l => l.emailVerified).length}
                    </div>
                </div>
                <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">Países</div>
                    <div className="text-2xl font-bold">{list.countries.join(", ")}</div>
                </div>
                <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">Setores</div>
                    <div className="text-2xl font-bold">{list.industries.length || "-"}</div>
                </div>
            </div>

            {/* Tabela de Leads */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>País</TableHead>
                            <TableHead>Setor</TableHead>
                            <TableHead className="text-center">Verificado</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {list.leads.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12">
                                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground mb-4">
                                        Nenhum lead nesta lista ainda.
                                    </p>
                                    <LeadsUploadModal listId={list.id} listName={list.name} />
                                </TableCell>
                            </TableRow>
                        ) : (
                            list.leads.map((lead) => (
                                <TableRow key={lead.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{lead.company}</p>
                                            {lead.website && (
                                                <p className="text-xs text-muted-foreground">{lead.website}</p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p>{lead.contactName || "-"}</p>
                                            {lead.jobTitle && (
                                                <p className="text-xs text-muted-foreground">{lead.jobTitle}</p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-sm">{lead.email}</code>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{lead.country}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {lead.industry || "-"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {lead.emailVerified ? (
                                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DeleteLeadButton leadId={lead.id} listId={list.id} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {list._count.leads > 100 && (
                <p className="text-sm text-muted-foreground text-center">
                    Mostrando 100 de {list._count.leads} leads
                </p>
            )}
        </div>
    )
}