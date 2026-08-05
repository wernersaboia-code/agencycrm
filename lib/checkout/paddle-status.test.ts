import { describe, it, expect } from "vitest"
import { mapPaddleEvent } from "./paddle-status"

describe("mapPaddleEvent", () => {
    it("transaction.completed efetiva a compra", () => {
        expect(mapPaddleEvent("transaction.completed")).toBe("fulfill")
    })

    it("estados intermediários não fazem nada", () => {
        expect(mapPaddleEvent("transaction.created")).toBe("ignore")
        expect(mapPaddleEvent("transaction.ready")).toBe("ignore")
        expect(mapPaddleEvent("transaction.updated")).toBe("ignore")
    })

    it("tentativa de pagamento recusada não mata o pedido", () => {
        // No overlay o comprador retenta com outro cartão na MESMA transação.
        // Marcar failed aqui recriaria o bug corrigido no Mercado Pago em
        // 64c82d7: recusa encerra a tentativa, não o pedido.
        expect(mapPaddleEvent("transaction.payment_failed")).toBe("ignore")
    })

    it("estorno fica fora deste fluxo", () => {
        expect(mapPaddleEvent("adjustment.created")).toBe("ignore")
    })

    it("evento desconhecido não faz nada", () => {
        expect(mapPaddleEvent("evento.que.o.paddle.inventou")).toBe("ignore")
    })
})
