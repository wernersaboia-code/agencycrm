import type { LegalDocument } from "./types"

const privacyEs: LegalDocument = {
    title: "Política de Privacidad",
    lastUpdated: "2026-07-29",
    sections: [
        {
            id: "responsavel",
            heading: "1. Quién es el responsable",
            blocks: [
                { kind: "paragrafo", texto: "Easy Prospect es operado por Werner Wild Saboia Carvalho Marinho, persona física, con domicilio en Fortaleza, Ceará, Brasil, responsable de las decisiones sobre el tratamiento de los datos descritos en esta política." },
                { kind: "paragrafo", texto: "Para cualquier asunto relativo a datos personales, incluido el ejercicio de los derechos descritos más abajo, escriba a contato@easyprospect.com.br." },
            ],
        },
        {
            id: "dados",
            heading: "2. Datos que tratamos",
            blocks: [
                { kind: "paragrafo", texto: "Tratamos la información necesaria para operar el servicio:" },
                { kind: "lista", itens: [
                    "Datos de cuenta: nombre, correo electrónico y avatar, facilitados por usted en el registro y gestionados por Supabase Auth.",
                    "Datos de compra: artículos adquiridos, importe, moneda e historial de descargas.",
                    "Datos de pago: identificadores de la transacción en el proveedor de pago. No recibimos ni almacenamos números de tarjeta.",
                    "Datos de uso del sitio: páginas visitadas y eventos de navegación, solo cuando usted acepta las cookies de medición.",
                    "Datos introducidos por usted en el CRM: contactos, empresas y registros de actividad que importa o crea.",
                    "Datos de contacto profesional de terceros: las empresas y personas de contacto que componen las listas del catálogo. Véase la sección específica más abajo.",
                ] },
            ],
        },
        {
            id: "baseLegal",
            heading: "3. Base jurídica de cada tratamiento",
            blocks: [
                { kind: "lista", itens: [
                    "Crear y mantener su cuenta, procesar la compra y entregar el estudio adquirido: ejecución del contrato entre nosotros.",
                    "Enviar mensajes sobre su compra, como la confirmación y la habilitación de la descarga: ejecución del contrato.",
                    "Conservar registros de venta durante los plazos exigidos: cumplimiento de una obligación legal.",
                    "Medir el uso del sitio: consentimiento, que usted puede rechazar o retirar en cualquier momento en el banner de cookies.",
                ] },
            ],
        },
        {
            id: "uso",
            heading: "4. Cómo usamos los datos",
            blocks: [
                { kind: "lista", itens: [
                    "Operar el catálogo, el pago y la entrega de los estudios adquiridos.",
                    "Dar acceso permanente a sus compras en el área Mis compras.",
                    "Enviar notificaciones transaccionales relacionadas con su cuenta y sus compras.",
                    "Operar el CRM para los datos que usted mismo crea o importa.",
                ] },
                { kind: "paragrafo", texto: "No vendemos datos personales de usuarios y no usamos sus datos de cuenta para entrenar modelos." },
            ],
        },
        {
            id: "compartilhamento",
            heading: "5. Con quién compartimos",
            blocks: [
                { kind: "paragrafo", texto: "Utilizamos prestadores de servicios para operaciones concretas, cada uno con acceso solo a lo necesario:" },
                { kind: "lista", itens: [
                    "Supabase — base de datos, autenticación y almacenamiento de archivos.",
                    "Mercado Pago — procesamiento de pagos.",
                    "Vercel — alojamiento de la aplicación y medición de rendimiento.",
                    "Zoho — buzón de la dirección de contacto.",
                ] },
            ],
        },
        {
            id: "transferencias",
            heading: "6. Transferencias internacionales",
            blocks: [
                { kind: "paragrafo", texto: "La base de datos está alojada en Brasil. Los demás prestadores enumerados arriba operan infraestructura en varios países, incluidos Estados Unidos y la Unión Europea." },
                { kind: "paragrafo", texto: "Si usted se encuentra en la Unión Europea, esto significa que sus datos pueden ser tratados fuera del Espacio Económico Europeo. Brasil no cuenta, en esta fecha, con una decisión de adecuación de la Comisión Europea." },
            ],
        },
        {
            id: "listas",
            heading: "7. Datos de contacto en los estudios del catálogo",
            blocks: [
                { kind: "paragrafo", texto: "Los estudios vendidos en el catálogo reúnen datos de contacto profesional de empresas: nombre de la empresa, país, sector, sitio web, correos y teléfonos institucionales. Algunos estudios citan además el nombre y el cargo de responsables, tal como constan en registros mercantiles públicos — sin correo personal y sin teléfono directo." },
                { kind: "paragrafo", texto: "Estos datos se obtienen de fuentes públicas — sitios web corporativos, registros mercantiles y otra información de acceso público — y no se recogen de la propia persona." },
                { kind: "paragrafo", texto: "Si ha identificado datos suyos en uno de nuestros estudios y quiere acceder a ellos, rectificarlos, oponerse al tratamiento o solicitar su supresión, escriba a contato@easyprospect.com.br. Las solicitudes de este tipo se atienden." },
            ],
        },
        {
            id: "direitos",
            heading: "8. Sus derechos",
            blocks: [
                { kind: "paragrafo", texto: "Usted puede solicitar en cualquier momento:" },
                { kind: "lista", itens: [
                    "Acceso a los datos que tratamos sobre usted.",
                    "Rectificación de datos incompletos o desactualizados.",
                    "Supresión de sus datos, salvo las obligaciones legales de conservación.",
                    "Portabilidad de los datos que nos ha facilitado.",
                    "Oposición a un tratamiento y retirada del consentimiento, cuando esa sea la base.",
                ] },
                { kind: "paragrafo", texto: "Basta con escribir a contato@easyprospect.com.br. También tiene derecho a presentar una reclamación ante una autoridad de protección de datos — la ANPD, en Brasil, o la autoridad de control de su país, en la Unión Europea." },
            ],
        },
        {
            id: "cookies",
            heading: "9. Cookies y medición",
            blocks: [
                { kind: "paragrafo", texto: "Usamos cookies esenciales para la autenticación y para recordar sus preferencias, como el idioma. Son necesarias para que el sitio funcione y no dependen del consentimiento." },
                { kind: "paragrafo", texto: "Las cookies de medición de uso solo se cargan después de que usted las acepte en el banner mostrado en la primera visita. Rechazarlas no limita ninguna funcionalidad." },
            ],
        },
        {
            id: "retencao",
            heading: "10. Cuánto tiempo conservamos los datos",
            blocks: [
                { kind: "paragrafo", texto: "Mantenemos sus datos de cuenta mientras esta exista. Tras la eliminación de la cuenta, los datos personales se suprimen o se anonimizan en un plazo de 90 días." },
                { kind: "paragrafo", texto: "Los registros de compra se conservan durante los plazos exigidos por la legislación fiscal, incluso después de eliminar la cuenta." },
            ],
        },
        {
            id: "alteracoes",
            heading: "11. Modificaciones y contacto",
            blocks: [
                { kind: "paragrafo", texto: "Esta política puede actualizarse. La fecha que figura arriba indica la última revisión, y los cambios relevantes se anuncian en el sitio." },
                { kind: "paragrafo", texto: "Dudas sobre esta política: contato@easyprospect.com.br." },
            ],
        },
    ],
}

export default privacyEs
