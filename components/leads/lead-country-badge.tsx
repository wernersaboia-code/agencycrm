// components/leads/lead-country-badge.tsx

import { cn } from "@/lib/utils"
import { getCountryByCode } from "@/lib/utils/lead.utils"

interface LeadCountryBadgeProps {
    countryCode: string | null | undefined
    showName?: boolean
    className?: string
}

export function LeadCountryBadge({
                                     countryCode,
                                     showName = false,
                                     className
                                 }: LeadCountryBadgeProps) {
    const country = getCountryByCode(countryCode)

    if (!country) {
        if (!countryCode) return null
        return (
            <span className={cn("text-xs text-muted-foreground", className)}>
        {countryCode}
      </span>
        )
    }

    return (
        <div className={cn("flex items-center gap-1", className)}>
      <span className="text-base" title={country.name}>
        {country.flag}
      </span>
            {showName && (
                <span className="text-xs text-muted-foreground">
          {country.name}
        </span>
            )}
        </div>
    )
}