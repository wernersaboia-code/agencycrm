"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { addDays } from "date-fns"

export async function createTrialWorkspace(userId: string, workspaceName: string) {
    const user = await requireAuth()

    if (user.id !== userId) {
        throw new Error("Voce nao pode criar workspace para outro usuario")
    }

    const trialEndsAt = addDays(new Date(), 14)

    const workspace = await prisma.workspace.create({
        data: {
            name: workspaceName,
            userId,
            plan: "TRIAL",
            trialEndsAt,
            maxLeads: 50000,
            maxUsers: 3,
            maxEmailsPerDay: 1000,
        }
    })

    return workspace
}