// app/super-admin/marketplace/lists/[id]/leads/page.tsx.bak
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    Download,
    CheckCircle,
    XCircle,
    Building2,
    Globe,
    Mail,
    Users,
    Briefcase
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

    // Calcular estatísticas a partir dos leads
    const countries = [...new Set(list.leads.map(l => l.country))]
    const sectors = [...new Set(list.leads.map(l => l.sector).filter(Boolean))]
    const verifiedCount = list.leads.filter(l => l.emailVerified).length
    const verifiedPercentage = list._count.leads > 0
        ? Math.round((verifiedCount / list._count.leads) * 100)
        : 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/super-admin/marketplace/lists"
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

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{list._count.leads.toLocaleString()}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Países</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{countries.length}</p>
                        <p className="text-xs text-muted-foreground truncate">
                            {countries.slice(0, 3).join(", ")}
                            {countries.length > 3 && ` +${countries.length - 3}`}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Setores</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{sectors.length}</p>
                        <p className="text-xs text-muted-foreground truncate">
                            {sectors.slice(0, 2).join(", ")}
                            {sectors.length > 2 && ` +${sectors.length - 2}`}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Emails Verificados</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{verifiedPercentage}%</p>
                        <p className="text-xs text-muted-foreground">
                            {verifiedCount} de {list._count.leads}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabela de Leads */}
            <Card>
                <CardHeader>
                    <CardTitle>Leads</CardTitle>
                </CardHeader>
                <CardContent>
                    {list.leads.length === 0 ? (
                        <div className="text-center py-12">
                            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">Nenhum lead nesta lista</h3>
                            <p className="text-muted-foreground mb-4">
                                Comece importando leads de um arquivo CSV
                            </p>
                            <LeadsUploadModal listId={list.id} listName={list.name} />
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Empresa</TableHead>
                                        <TableHead>País</TableHead>
                                        <TableHead>Setor</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Contato</TableHead>
                                        <TableHead className="text-center w-[80px]">Verificado</TableHead>
                                        <TableHead className="text-right w-[80px]">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {list.leads.map((lead) => (
                                        <TableRow key={lead.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{lead.companyName}</p>
                                                    {lead.website && (
                                                        <a
                                                            href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 hover:underline"
                                                        >
                                                            {lead.website}
                                                        </a>
                                                    )}
                                                    {lead.companyType && (
                                                        <p className="text-xs text-muted-foreground">{lead.companyType}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{lead.country}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{lead.sector || "-"}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-0.5">
                                                    <p className="text-sm">{lead.emailGeneral}</p>
                                                    {lead.emailPurchasing && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {lead.emailPurchasing}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-0.5">
                                                    <p className="text-sm">
                                                        {lead.purchasingPerson || lead.manager || "-"}
                                                    </p>
                                                    {(lead.purchasingPerson || lead.manager) && lead.phoneGeneral && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {lead.phoneGeneral}
                                                        </p>
                                                    )}
                                                </div>
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
                                    ))}
                                </TableBody>
                            </Table>

                            {list._count.leads > 100 && (
                                <p className="text-sm text-muted-foreground text-center mt-4">
                                    Mostrando 100 de {list._count.leads.toLocaleString()} leads
                                </p>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}