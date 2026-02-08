// app/(dashboard)/workspaces/[id]/page.tsx

import { redirect } from "next/navigation"

// Por enquanto, redireciona para a lista
// Depois implementamos a página de detalhes
export default function WorkspaceDetailPage() {
    redirect("/workspaces")
}