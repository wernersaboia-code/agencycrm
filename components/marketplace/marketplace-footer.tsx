import Link from "next/link"

export function MarketplaceFooter() {
    return (
        <footer className="border-t bg-muted/30">
            <div className="container mx-auto px-4 py-10">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="mb-4 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600">
                                <span className="text-lg font-bold text-white">L</span>
                            </div>
                            <span className="text-xl font-bold">LeadStore</span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            Leads qualificados de comércio exterior para expandir seus negócios.
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">Produto</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/catalog" className="hover:text-foreground">Catálogo</Link></li>
                            <li><Link href="/#como-funciona" className="hover:text-foreground">Como funciona</Link></li>
                            <li><Link href="/pricing" className="hover:text-foreground">Planos CRM</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">Conta</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/my-purchases" className="hover:text-foreground">Minhas compras</Link></li>
                            <li><Link href="/dashboard" className="hover:text-foreground">Acessar CRM</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-foreground">Termos de uso</Link></li>
                            <li><Link href="#" className="hover:text-foreground">Privacidade</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} LeadStore. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    )
}
