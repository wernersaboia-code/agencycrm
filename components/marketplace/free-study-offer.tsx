// components/marketplace/free-study-offer.tsx
import { getAmostraAtiva } from "@/lib/free-sample/amostra-ativa"
import { FreeStudyBanner, type FreeStudyLayout } from "./free-study-banner"

/**
 * A faixa do estudo gratuito, só quando há amostra ativa no super-admin.
 * Desligar a amostra no admin tira a oferta do site inteiro, sem deploy.
 */
export async function FreeStudyOffer({
    className,
    layout,
}: {
    className?: string
    layout?: FreeStudyLayout
}) {
    const amostra = await getAmostraAtiva()
    if (!amostra) return null

    return <FreeStudyBanner className={className} layout={layout} />
}
