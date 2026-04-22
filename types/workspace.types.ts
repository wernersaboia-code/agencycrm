// types/workspace.types.ts
export type WorkspacePlan = 'FREE' | 'TRIAL' | 'STARTER' | 'PRO' | 'ENTERPRISE'

export interface WorkspaceLimits {
    maxLeads: number        // 0 = ilimitado
    maxUsers: number
    maxEmailsPerDay: number // 0 = ilimitado
}

export const PLAN_LIMITS: Record<WorkspacePlan, WorkspaceLimits> = {
    FREE: {
        maxLeads: 0,          // Ilimitado para legado
        maxUsers: 1,
        maxEmailsPerDay: 0,   // Ilimitado para legado
    },
    TRIAL: {
        maxLeads: 50000,      // Generoso durante trial
        maxUsers: 3,
        maxEmailsPerDay: 1000,
    },
    STARTER: {
        maxLeads: 5000,
        maxUsers: 1,
        maxEmailsPerDay: 500,
    },
    PRO: {
        maxLeads: 50000,
        maxUsers: 3,
        maxEmailsPerDay: 5000,
    },
    ENTERPRISE: {
        maxLeads: 0,          // Ilimitado
        maxUsers: 10,
        maxEmailsPerDay: 0,   // Ilimitado
    },
}

export interface Workspace {
    plan: WorkspacePlan
    trialEndsAt?: Date | null
    subscriptionId?: string | null
    subscriptionStatus?: string | null
    stripeCustomerId?: string | null
    maxLeads: number
    maxUsers: number
    maxEmailsPerDay: number
}