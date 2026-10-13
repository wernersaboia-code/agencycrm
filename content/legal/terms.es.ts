import type { LegalDocument } from "./types"

const termsEs: LegalDocument = {
    title: "Términos de Uso",
    lastUpdated: "2026-10-13",
    sections: [
        {
            id: "aceitacao",
            heading: "1. Aceptación de los términos",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect es operado por Werner Wild Saboia Carvalho Marinho, persona física. Al acceder al servicio o utilizarlo, usted acepta estos términos. Si no está de acuerdo, no utilice el servicio." },
            ],
        },
        {
            id: "servico",
            heading: "2. El servicio",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect vende estudios de entrada en mercados, entregados en PDF. Una vez confirmado el pago, el estudio queda disponible para descargar en Mis compras." },
                { kind: "paragrafo", texto: "Los precios se muestran en el catálogo en la moneda elegida, y el cobro lo realiza el proveedor de pago indicado al finalizar la compra." },
                { kind: "paragrafo", texto: "Los estudios se elaboran a partir de fuentes públicas y reflejan la situación en la fecha de revisión indicada en la página de cada estudio. Las empresas cambian de contactos, estructura y estrategia: compruebe la información antes de tomar decisiones comerciales." },
            ],
        },
        {
            id: "conta",
            heading: "3. Registro y cuenta",
            blocks: [
                { kind: "paragrafo", texto: "Usted es responsable de mantener la confidencialidad de sus credenciales. Avísenos de inmediato si detecta un uso no autorizado de su cuenta." },
            ],
        },
        {
            id: "usoAceitavel",
            heading: "4. Uso aceptable",
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
            heading: "5. Propiedad intelectual",
            blocks: [
                { kind: "paragrafo", texto: "Los estudios adquiridos están destinados al uso de su empresa. No se permite revenderlos, redistribuirlos ni publicarlos." },
                { kind: "paragrafo", texto: "Los datos que usted importa o registra en el CRM siguen bajo su responsabilidad. No reivindicamos su propiedad, salvo en lo necesario para operar el servicio." },
            ],
        },
        {
            id: "pagamentos",
            heading: "6. Pagos y reembolsos",
            blocks: [
                { kind: "paragrafo", texto: "Las compras del catálogo se procesan a través de un proveedor de pago certificado. El reembolso es íntegro e incondicional en un plazo de 14 días desde la compra, conforme a la Política de Reembolso." },
            ],
        },
        {
            id: "responsabilidade",
            heading: "7. Limitación de responsabilidad",
            blocks: [
                { kind: "paragrafo", texto: "El servicio se presta tal cual. No garantizamos una disponibilidad ininterrumpida ni un resultado comercial concreto: el retorno de un proyecto de exportación depende de factores ajenos a nuestro control." },
                { kind: "paragrafo", texto: "Nuestra responsabilidad se limita al importe que usted haya pagado por el servicio en los últimos 12 meses." },
            ],
        },
        {
            id: "rescisao",
            heading: "8. Rescisión",
            blocks: [
                { kind: "paragrafo", texto: "Podemos suspender o cerrar las cuentas que incumplan estos términos. Usted puede solicitar el cierre de la suya en cualquier momento escribiendo a contato@easyprospect.com.br; mientras la cuenta exista, se mantiene el acceso a las compras ya realizadas." },
            ],
        },
        {
            id: "alteracoes",
            heading: "9. Modificaciones",
            blocks: [
                { kind: "paragrafo", texto: "Estos términos pueden actualizarse. La fecha que figura al principio indica la última revisión, y los cambios relevantes se anuncian con antelación. El uso continuado tras la modificación constituye su aceptación." },
            ],
        },
        {
            id: "idade",
            heading: "10. Edad mínima",
            blocks: [
                { kind: "paragrafo", texto: "El servicio está destinado a mayores de 18 años y a un uso profesional." },
            ],
        },
        {
            id: "foroLei",
            heading: "11. Ley aplicable y jurisdicción",
            blocks: [
                { kind: "paragrafo", texto: "Estos términos se rigen por las leyes de la República Federativa de Brasil. Para resolver cualquier controversia relacionada con ellos, son competentes los tribunales de Fortaleza, Ceará, Brasil." },
                { kind: "paragrafo", texto: "Si usted contrata como consumidor, esta elección no le priva de los derechos que le otorgan las normas imperativas de protección al consumidor, incluido el de acudir a los tribunales del lugar donde reside." },
            ],
        },
    ],
}

export default termsEs
