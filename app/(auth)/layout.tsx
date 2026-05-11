// app/(auth)/layout.tsx

export default function AuthLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-4xl p-6">
                {children}
            </div>
        </div>
    )
}
