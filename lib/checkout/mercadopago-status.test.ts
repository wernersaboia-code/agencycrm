import { describe, it, expect } from "vitest"
import { mapPaymentStatus } from "./mercadopago-status"

describe("mapPaymentStatus", () => {
    it("approved efetiva a compra", () => {
        expect(mapPaymentStatus("approved")).toBe("fulfill")
    })

    it("estados intermediários não fazem nada", () => {
        // Pix nasce pending: o comprador ainda está no app do banco. O Mercado
        // Pago reenvia o evento quando aprovar.
        expect(mapPaymentStatus("pending")).toBe("ignore")
        expect(mapPaymentStatus("in_process")).toBe("ignore")
        expect(mapPaymentStatus("authorized")).toBe("ignore")
        expect(mapPaymentStatus("in_mediation")).toBe("ignore")
    })

    it("recusa e cancelamento marcam falha", () => {
        expect(mapPaymentStatus("rejected")).toBe("fail")
        expect(mapPaymentStatus("cancelled")).toBe("fail")
    })

    it("estorno e chargeback ficam fora deste fluxo", () => {
        // Reembolso não é escopo deste trabalho: marcar failed apagaria o
        // registro de uma compra que foi paga de verdade.
        expect(mapPaymentStatus("refunded")).toBe("ignore")
        expect(mapPaymentStatus("charged_back")).toBe("ignore")
    })

    it("status desconhecido não faz nada", () => {
        expect(mapPaymentStatus("status_que_o_mp_inventou")).toBe("ignore")
    })
})
