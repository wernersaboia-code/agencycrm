// types/contact.ts

import { Contact, Company, User } from "@prisma/client"

export type ContactWithRelations = Contact & {
    company?: Company | null
    assignedTo?: User | null
    createdBy?: User | null
}

export type ContactFormData = {
    firstName: string
    lastName: string
    email?: string
    phone?: string
    mobile?: string
    position?: string
    department?: string
    status: "ACTIVE" | "INACTIVE" | "LEAD" | "CUSTOMER" | "CHURNED"
    source?: string
    notes?: string
    companyId?: string
}