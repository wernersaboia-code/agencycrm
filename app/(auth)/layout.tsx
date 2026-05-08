// app/(auth)/layout.tsx

export default function AuthLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50">
            <div className="w-full max-w-4xl p-6">
                {children}
            </div>
        </div>
    )
}
