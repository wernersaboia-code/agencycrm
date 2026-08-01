"use client"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export interface FaqEntry {
    question: string
    answer: string
}

export function FaqAccordion({ items }: { items: FaqEntry[] }) {
    return (
        <Accordion type="single" collapsible className="w-full">
            {items.map((item, index) => (
                <AccordionItem key={item.question} value={`item-${index}`}>
                    <AccordionTrigger className="text-base font-semibold text-foreground">
                        {item.question}
                    </AccordionTrigger>
                    {/* whitespace-pre-line: as respostas em messages/*.json usam
                        \n para separar parágrafos e itens de lista. Sem isso a
                        lista de "o que vem em cada estudo" vira parágrafo corrido. */}
                    <AccordionContent className="whitespace-pre-line leading-7 text-muted-foreground">
                        {item.answer || "—"}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
}
