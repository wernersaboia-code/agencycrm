// components/marketplace/marketplace-footer.tsx
import Link from "next/link"

export function MarketplaceFooter() {
    return (
        <footer className="border-t bg-muted/30">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Logo & Description */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">L</span>
                            </div>
                            <span className="font-bold text-xl">LeadStore</span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            Leads qualificados de comércio exterior para expandir seus negócios.
                        </p>
                    </div>

                    {/* Produto */}
                    <div>
                        <h4 className="font-semibold mb-4">Produto</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/catalog" className="hover:text-foreground">Catálogo</Link></li>
                            <li><Link href="/#como-funciona" className="hover:text-foreground">Como Funciona</Link></li>
                        </ul>
                    </div>

                    {/* Suporte */}
                    <div>
                        <h4 className="font-semibold mb-4">Suporte</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-foreground">FAQ</Link></li>
                            <li><Link href="#" className="hover:text-foreground">Contato</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-foreground">Termos de Uso</Link></li>
                            <li><Link href="#" className="hover:text-foreground">Privacidade</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} LeadStore. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    )
}