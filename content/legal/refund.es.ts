import type { LegalDocument } from "./types"

const refundEs: LegalDocument = {
    title: "Política de Reembolso",
    lastUpdated: "2026-08-23",
    sections: [
        {
            id: "escopo",
            heading: "1. Qué cubre esta política",
            blocks: [
                { kind: "paragrafo", texto: "Esta política se aplica a todos los estudios de entrada en mercado vendidos en el catálogo de Easy Prospect." },
            ],
        },
        {
            id: "direito",
            heading: "2. Derecho al reembolso",
            blocks: [
                { kind: "paragrafo", texto: "Puede solicitar el reembolso íntegro en un plazo de 14 días naturales desde la compra, por cualquier motivo." },
                { kind: "paragrafo", texto: "No es necesario justificar la solicitud, y el derecho se mantiene aunque ya haya descargado el estudio." },
            ],
        },
        {
            id: "comoPedir",
            heading: "3. Cómo solicitarlo",
            blocks: [
                { kind: "paragrafo", texto: "Escriba a contato@easyprospect.com.br desde el correo de la cuenta que realizó la compra, indicando el número de pedido. No hay formulario ni paso adicional." },
            ],
        },
        {
            id: "prazo",
            heading: "4. Plazo y forma de devolución",
            blocks: [
                { kind: "paragrafo", texto: "El reembolso se procesa en un plazo de 10 días hábiles desde la solicitud y se devuelve por el mismo medio de pago utilizado en la compra." },
                { kind: "paragrafo", texto: "El tiempo hasta que el importe aparezca en su extracto depende de su banco o de la entidad emisora de la tarjeta." },
            ],
        },
        {
            id: "apos",
            heading: "5. Después del reembolso",
            blocks: [
                { kind: "paragrafo", texto: "Una vez completado el reembolso, el acceso al estudio finaliza en Mis compras y el archivo deja de estar disponible para descargar." },
            ],
        },
    ],
}

export default refundEs
