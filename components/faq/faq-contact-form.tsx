"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react"
import { submitFaqQuestion } from "@/actions/faq"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export interface FaqFormLabels {
    title: string
    subtitle: string
    name: string
    company: string
    email: string
    subject: string
    message: string
    consent: string
    submit: string
    submitting: string
    success: string
    error: string
    rateLimited: string
    errors: {
        name: string
        email: string
        subject: string
        message: string
        consent: string
    }
}

interface FaqContactFormProps {
    locale: "pt" | "de"
    labels: FaqFormLabels
}

type Status = "idle" | "success" | "error" | "rate_limited"

export function FaqContactForm({ locale, labels }: FaqContactFormProps) {
    const [status, setStatus] = useState<Status>("idle")

    const schema = useMemo(
        () =>
            z.object({
                name: z.string().min(2, labels.errors.name),
                company: z.string().optional().or(z.literal("")),
                email: z.string().email(labels.errors.email),
                subject: z.string().min(3, labels.errors.subject),
                message: z.string().min(10, labels.errors.message),
                consent: z.boolean().refine((value) => value === true, labels.errors.consent),
                website: z.string().optional().or(z.literal("")),
            }),
        [labels]
    )

    type FormValues = z.infer<typeof schema>

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            company: "",
            email: "",
            subject: "",
            message: "",
            consent: false,
            website: "",
        },
    })

    const { errors, isSubmitting } = form.formState

    // O texto do consentimento vem do locale com marcação <link>…</link>
    // apontando para a política de privacidade.
    const [consentBefore, consentLink, consentAfter] = useMemo(() => {
        const parts = labels.consent.split(/<link>|<\/link>/)
        return [parts[0] ?? "", parts[1] ?? "", parts[2] ?? ""]
    }, [labels.consent])

    const onSubmit = async (values: FormValues) => {
        setStatus("idle")

        const result = await submitFaqQuestion({ ...values, consent: true as const, locale })

        if (result.success) {
            setStatus("success")
            form.reset()
        } else if (result.error === "rate_limited") {
            setStatus("rate_limited")
        } else {
            setStatus("error")
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="faq-name">{labels.name}</Label>
                    <Input id="faq-name" autoComplete="name" {...form.register("name")} />
                    {errors.name && (
                        <p className="text-sm text-red-600">{errors.name.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="faq-company">{labels.company}</Label>
                    <Input id="faq-company" autoComplete="organization" {...form.register("company")} />
                </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="faq-email">{labels.email}</Label>
                    <Input id="faq-email" type="email" autoComplete="email" {...form.register("email")} />
                    {errors.email && (
                        <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="faq-subject">{labels.subject}</Label>
                    <Input id="faq-subject" {...form.register("subject")} />
                    {errors.subject && (
                        <p className="text-sm text-red-600">{errors.subject.message}</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="faq-message">{labels.message}</Label>
                <Textarea id="faq-message" rows={5} {...form.register("message")} />
                {errors.message && (
                    <p className="text-sm text-red-600">{errors.message.message}</p>
                )}
            </div>

            {/* Honeypot: invisível para humanos, ignorado por leitores de tela. */}
            <div className="hidden" aria-hidden="true">
                <label htmlFor="faq-website">Website</label>
                <input
                    id="faq-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    {...form.register("website")}
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-start gap-3">
                    <Checkbox
                        id="faq-consent"
                        checked={form.watch("consent")}
                        onCheckedChange={(checked) =>
                            form.setValue("consent", checked === true, { shouldValidate: true })
                        }
                    />
                    <Label htmlFor="faq-consent" className="text-sm font-normal leading-6 text-gray-600">
                        <span>
                            {consentBefore}
                            <Link href="/privacy" className="underline hover:text-gray-900" target="_blank">
                                {consentLink}
                            </Link>
                            {consentAfter}
                        </span>
                    </Label>
                </div>
                {errors.consent && (
                    <p className="text-sm text-red-600">{errors.consent.message}</p>
                )}
            </div>

            <div aria-live="polite">
                {status === "success" && (
                    <p className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        {labels.success}
                    </p>
                )}
                {status === "error" && (
                    <p className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        <TriangleAlert className="h-4 w-4 shrink-0" />
                        {labels.error}
                    </p>
                )}
                {status === "rate_limited" && (
                    <p className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        <TriangleAlert className="h-4 w-4 shrink-0" />
                        {labels.rateLimited}
                    </p>
                )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white hover:bg-indigo-700">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? labels.submitting : labels.submit}
            </Button>
        </form>
    )
}
