// actions/crm/signup.ts
"use server"

import { prisma } from "@/lib/prisma"
import { addDays } from "date-fns"

export async function createTrialWorkspace(userId: string, workspaceName: string) {
    const trialEndsAt = addDays(new Date(), 14)

    const workspace = await prisma.workspace.create({
        data: {
            name: workspaceName,
            userId,
            plan: "TRIAL",
            trialEndsAt,
            maxLeads: 50000, // Generoso durante trial
            maxUsers: 3,
            maxEmailsPerDay: 1000,
        }
    })

    return workspace
}