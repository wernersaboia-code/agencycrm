import type { LegalDocument } from "./types"

const termsEs: LegalDocument = {
    title: "Términos de Uso",
    lastUpdated: "2026-07-29",
    sections: [
        {
            id: "aceitacao",
            heading: "1. Aceptación de los términos",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect es operado por Werner Wild Saboia Carvalho Marinho, persona física. Al acceder al servicio o utilizarlo, usted acepta estos términos. Si no está de acuerdo, no utilice el servicio." },
            ],
        },
        {
            id: "conta",
            heading: "2. Registro y cuenta",
            blocks: [
                { kind: "paragrafo", texto: "Usted es responsable de mantener la confidencialidad de sus credenciales. Avísenos de inmediato si detecta un uso no autorizado de su cuenta." },
            ],
        },
        {
            id: "usoAceitavel",
            heading: "3. Uso aceptable",
            blocks: [
                { kind: "paragrafo", texto: "Usted se compromete a no utilizar el servicio para:" },
                { kind: "lista", itens: [
                    "Enviar spam, phishing o contenido malicioso.",
                    "Tratar datos de contactos sin una base legal adecuada.",
                    "Intentar acceder a datos de otros usuarios o a otros espacios de trabajo.",
                    "Realizar ingeniería inversa o explotar vulnerabilidades.",
                ] },
            ],
        },
        {
            id: "propriedade",
            heading: "4. Propiedad intelectual",
            blocks: [
                { kind: "paragrafo", texto: "Los estudios y las listas adquiridos están destinados al uso de su empresa. No se permite revenderlos, redistribuirlos ni publicarlos." },
                { kind: "paragrafo", texto: "Los datos que usted importa o registra en el CRM siguen bajo su responsabilidad. No reivindicamos su propiedad, salvo en lo necesario para operar el servicio." },
            ],
        },
        {
            id: "pagamentos",
            heading: "5. Pagos y reembolsos",
            blocks: [
                { kind: "paragrafo", texto: "Las compras del catálogo se procesan a través de Stripe. Los reembolsos se evalúan caso por caso y pueden solicitarse en un plazo de 7 días desde la compra, siempre que el archivo no se haya descargado." },
            ],
        },
        {
            id: "responsabilidade",
            heading: "6. Limitación de responsabilidad",
            blocks: [
                { kind: "paragrafo", texto: "El servicio se presta tal cual. No garantizamos una disponibilidad ininterrumpida ni un resultado comercial concreto: el retorno de un proyecto de exportación depende de factores ajenos a nuestro control." },
                { kind: "paragrafo", texto: "Nuestra responsabilidad se limita al importe que usted haya pagado por el servicio en los últimos 12 meses." },
            ],
        },
        {
            id: "rescisao",
            heading: "7. Rescisión",
            blocks: [
                { kind: "paragrafo", texto: "Podemos suspender o cerrar las cuentas que incumplan estos términos. Usted puede cerrar la suya en cualquier momento desde la configuración de la cuenta; el acceso a las compras ya realizadas se mantiene mientras exista la cuenta." },
            ],
        },
        {
            id: "alteracoes",
            heading: "8. Modificaciones",
            blocks: [
                { kind: "paragrafo", texto: "Estos términos pueden actualizarse. La fecha que figura al principio indica la última revisión, y los cambios relevantes se anuncian con antelación. El uso continuado tras la modificación constituye su aceptación." },
            ],
        },
        {
            id: "idade",
            heading: "9. Edad mínima",
            blocks: [
                { kind: "paragrafo", texto: "El servicio está destinado a mayores de 18 años y a un uso profesional." },
            ],
        },
    ],
}

export default termsEs
