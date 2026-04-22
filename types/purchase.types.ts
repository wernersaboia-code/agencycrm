// types/purchase.types.ts
export interface PurchaseAccessTokenData {
    token: string
    userId: string
    purchaseId?: string
    expiresAt: Date
}

export interface MagicLinkEmailData {
    to: string
    userName: string
    purchaseId: string
    purchaseDate: Date
    total: number
    currency: string
    items: Array<{
        name: string
        leadsCount: number
        price: number
    }>
    accessUrl: string
}

export interface ImportToCRMData {
    purchaseItemId: string
    workspaceId: string
    listId: string
}

export interface ImportResult {
    success: boolean
    imported: number
    skipped: number
    errors: string[]
    workspaceId: string
}