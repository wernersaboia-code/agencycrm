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
                    <AccordionContent className="leading-7 text-muted-foreground">
                        {item.answer || "—"}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
}
