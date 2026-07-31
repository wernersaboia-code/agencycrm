import type { AboutDocument } from "./types"

// Transcrição literal de "Por qué EasyProspect ESP.docx".
// Não reescrever: o sócio pediu o texto dele palavra por palavra. Mudança aqui
// só a partir de uma versão nova do documento.
//
// Exceção registrada: os dois últimos parágrafos de "Origen de nuestros datos" não estão
// no documento deste idioma — são a tradução do trecho sobre disparo em massa
// que só o documento alemão traz, incluído nos 7 a pedido do Werner.
const aboutEs: AboutDocument = {
    eyebrow: "¿Por qué EasyProspect?",
    title: "Su socio para una entrada exitosa en mercados internacionales",
    intro: [
        { kind: "paragrafo", texto: "Los nuevos mercados de exportación ofrecen enormes oportunidades de crecimiento. Al mismo tiempo, la búsqueda de importadores, distribuidores e información de mercado fiables suele llevar semanas o incluso meses." },
        { kind: "paragrafo", texto: "EasyProspect se desarrolló para hacer este proceso significativamente más fácil." },
        { kind: "paragrafo", texto: "Apoyamos a fabricantes, empresas de marca y exportadores a abrir nuevos mercados de venta más rápidamente, con estudios profesionales de entrada al mercado y directorios cuidadosamente investigados de importadores y distribuidores." },
        { kind: "paragrafo", texto: "Nuestros estudios combinan muchos años de experiencia en ventas internacionales con una metodología de investigación moderna. Se utilizan tanto métodos de análisis respaldados por IA como una verificación final de calidad manual." },
        { kind: "paragrafo", texto: "El resultado es información estructurada y práctica que le ayuda a tomar decisiones informadas e identificar los socios de distribución adecuados para sus productos." },
    ],
    sections: [
        {
            id: "metodologia",
            heading: "Nuestra Metodología",
            sub: "Investigación cuidadosa en lugar de listas de direcciones confusas",
            blocks: [
                { kind: "paragrafo", texto: "En EasyProspect, el enfoque no está en la cantidad de datos, sino en su relevancia práctica." },
                { kind: "paragrafo", texto: "Para cada estudio de entrada al mercado, se evalúan sistemáticamente numerosas fuentes de información de acceso público. Las tecnologías modernas de IA apoyan la investigación, el análisis y la estructuración de grandes volúmenes de datos. Todos los resultados son luego revisados por nosotros y evaluados en cuanto a su plausibilidad y utilidad para la exportación." },
                { kind: "paragrafo", texto: "Nuestro objetivo no es listar tantas empresas como sea posible, sino identificar aquellas que realmente podrían ser de interés para su proyecto de exportación." },
            ],
        },
        {
            id: "fontes",
            heading: "Origen de nuestros datos",
            blocks: [
                { kind: "paragrafo", texto: "Toda la información proviene exclusivamente de fuentes de acceso público." },
                { kind: "paragrafo", texto: "Estas incluyen, entre otras:" },
                { kind: "lista", itens: [
                    "Sitios web de empresas",
                    "Cámaras de comercio",
                    "Asociaciones industriales",
                    "Catálogos de ferias comerciales",
                    "Directorios de empresas",
                    "Portales especializados",
                    "Otra información comercial de libre acceso",
                ] },
                { kind: "paragrafo", texto: "Antes de su publicación, los datos se verifican en cuanto a su plausibilidad, completitud y utilidad práctica." },
                { kind: "paragrafo", texto: "Dado que las personas de contacto y las estructuras de las empresas pueden cambiar regularmente, nuestros estudios se actualizan a intervalos regulares." },
                { kind: "paragrafo", texto: "Nuestros directorios de importadores no están destinados a envíos masivos e impersonales." },
                { kind: "paragrafo", texto: "Sirven más bien como base fundamentada para un acercamiento individual y cuidadosamente preparado a potenciales socios comerciales, porque en el comercio internacional las relaciones comerciales exitosas nacen ante todo de la confianza y del contacto personal." },
            ],
        },
        {
            id: "verificacao",
            heading: "Revisión de empresas",
            blocks: [
                { kind: "paragrafo", texto: "Cada empresa se revisa sobre la base de información disponible públicamente antes de ser incluida en uno de nuestros directorios." },
                { kind: "paragrafo", texto: "En particular, verificamos" },
                { kind: "lista", itens: [
                    "si la empresa opera en el sector relevante,",
                    "si se pueden identificar actividades de importación o distribución,",
                    "si existe una presencia profesional de la empresa,",
                    "si hay datos de contacto actuales disponibles,",
                    "y si la empresa podría considerarse en general como un potencial socio de distribución.",
                ] },
                { kind: "paragrafo", texto: "Esta revisión no sustituye la cualificación individual de ventas, pero aumenta la probabilidad de que las empresas listadas sean relevantes para su proyecto de exportación." },
            ],
        },
        {
            id: "atualizacao",
            heading: "Actualizaciones regulares",
            blocks: [
                { kind: "paragrafo", texto: "Los mercados internacionales están en constante cambio." },
                { kind: "paragrafo", texto: "Por eso revisamos y actualizamos regularmente nuestros estudios de entrada al mercado y directorios de empresas, para que usted tenga acceso a la información más actual y prácticamente relevante posible." },
            ],
        },
        {
            id: "entrega",
            heading: "Lo que usted recibe",
            blocks: [
                { kind: "paragrafo", texto: "Cada estudio de entrada al mercado le proporciona significativamente más que una lista de direcciones clásica." },
                { kind: "paragrafo", texto: "Usted recibe una base compacta y orientada a la práctica para la toma de decisiones de su entrada al mercado." },
                { kind: "paragrafo", texto: "Dependiendo del sector, un estudio incluye, entre otras cosas:" },
                { kind: "lista", itens: [
                    "Visión general del mercado objetivo",
                    "Análisis de la situación del sector",
                    "Potencial de mercado y tendencias actuales",
                    "Requisitos de acceso al mercado",
                    "Estructuras de ventas y distribución",
                    "Directorio de importadores y distribuidores relevantes",
                    "Consejos para abordar con éxito a posibles socios comerciales",
                    "Recomendaciones para preparar su entrada al mercado",
                ] },
                { kind: "paragrafo", texto: "Nuestro objetivo es quitarle de encima gran parte de la investigación que consume tiempo, para que usted pueda concentrarse en construir nuevas relaciones comerciales." },
            ],
        },
        {
            id: "limites",
            heading: "Lo que no podemos prometer",
            blocks: [
                { kind: "paragrafo", texto: "El éxito de un proyecto de exportación depende de muchos factores." },
                { kind: "paragrafo", texto: "Por lo tanto, no podemos garantizar que todas las empresas respondan a un contacto o que se establezca inmediatamente una relación comercial." },
                { kind: "paragrafo", texto: "Los factores decisivos incluyen, entre otros:" },
                { kind: "lista", itens: [
                    "la competitividad de su producto,",
                    "la demanda en el mercado objetivo,",
                    "su política de precios,",
                    "su capacidad de entrega,",
                    "su estrategia de marketing y ventas,",
                    "el momento del contacto,",
                    "así como las decisiones de compra individuales de los respectivos importadores.",
                ] },
                { kind: "paragrafo", texto: "Lo que sí podemos ofrecerle, sin embargo, es una base sólida para su planificación de exportación y un significativo ahorro de tiempo en la identificación de socios de distribución adecuados." },
            ],
        },
        {
            id: "confianca",
            heading: "Por qué las empresas confían en EasyProspect",
            blocks: [
                { kind: "cartoes", cartoes: [
                    { titulo: "Orientado a la práctica", texto: "Nuestros estudios se crean específicamente para fabricantes, exportadores y responsables de ventas internacionales." },
                    { titulo: "Más que simples listas de direcciones", texto: "Usted recibe información de mercado estructurada, recomendaciones concretas de acción y directorios de importadores y distribuidores cuidadosamente investigados." },
                    { titulo: "Cuidadosamente investigado", texto: "Nuestra investigación se basa en una metodología sistemática y se somete a una verificación de calidad manual antes de su publicación." },
                    { titulo: "Ahorre tiempo", texto: "En lugar de pasar semanas investigando empresas adecuadas, puede empezar inmediatamente a contactar con potenciales socios de distribución." },
                    { titulo: "Actualizado regularmente", texto: "Nuestros estudios se revisan continuamente y se revisan o complementan según sea necesario." },
                    { titulo: "Desarrollado para el éxito de su exportación", texto: "Nuestro objetivo no es vender la mayor cantidad de datos posible, sino proporcionar una base de trabajo sólida con la que usted pueda abrir nuevos mercados de forma eficiente y profesional." },
                ] },
            ],
        },
        {
            id: "cta",
            heading: "¿Ya ha encontrado el mercado objetivo adecuado?",
            blocks: [
                { kind: "paragrafo", texto: "Descubra nuestros estudios de entrada al mercado y directorios de importadores para numerosos países e industrias." },
                { kind: "paragrafo", texto: "Con EasyProspect, usted recibe información de mercado sólida y potenciales socios de distribución cuidadosamente investigados, para que pueda tomar las decisiones correctas más rápidamente y abrir con éxito nuevos mercados de exportación." },
                { kind: "paragrafo", texto: "Seleccione ahora el estudio de entrada al mercado adecuado." },
            ],
        },
    ],
}

export default aboutEs
