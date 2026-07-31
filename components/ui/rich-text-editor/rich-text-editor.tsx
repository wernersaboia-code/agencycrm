// components/ui/rich-text-editor/rich-text-editor.tsx
"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { RichTextToolbar } from "./rich-text-toolbar"
import { renderTemplateVariablesForEditor } from "@/lib/constants/template.constants"
import { limparHtmlDeColagem } from "@/lib/blog/paste-cleanup"

/**
 * `email` é o comportamento histórico: chips de variável ({{nome}}) e nada
 * mais. `article` serve o blog — alinhamento, mais níveis de título e limpeza
 * do que for colado de Word/Google Docs/IA.
 *
 * Os dois convivem no mesmo componente de propósito: o editor de template e o
 * editor de post compartilham quase tudo, e duas cópias divergiriam.
 */
export type RichTextPreset = "email" | "article"

interface RichTextEditorProps {
    content: string
    onChange: (html: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    preset?: RichTextPreset
}

export function RichTextEditor({
                                   content,
                                   onChange,
    placeholder = "Escreva a mensagem como ela deve chegar ao lead...",
                                   className,
                                   disabled = false,
                                   preset = "email",
                               }: RichTextEditorProps) {
    const ehArtigo = preset === "article"
    // Chip de variável só existe no mundo do cold mail.
    const editorContent = ehArtigo ? content : renderTemplateVariablesForEditor(content)

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-primary underline",
                },
            }),
            Underline,
            Placeholder.configure({
                placeholder,
            }),
            // Grava style="text-align: …", que o sanitizador do servidor preserva.
            ...(ehArtigo
                ? [TextAlign.configure({ types: ["heading", "paragraph"] })]
                : []),
        ],
        content: editorContent,
        editable: !disabled,
        immediatelyRender: false, // ← ADICIONADO: Evita erro de SSR/hydration
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            // Colar num artigo limpa na hora: o autor vê o resultado real, não
            // uma versão bonita que muda ao salvar. No preset de e-mail nada
            // muda — os chips de variável dependem do HTML colado como veio.
            ...(ehArtigo
                ? { transformPastedHTML: (html: string) => limparHtmlDeColagem(html) }
                : {}),
            attributes: {
                class: cn(
                    "prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none",
                    "prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0",
                    "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
                    "[&_span[data-template-variable]]:inline-flex [&_span[data-template-variable]]:rounded",
                    "[&_span[data-template-variable]]:bg-primary/10 [&_span[data-template-variable]]:px-1.5",
                    "[&_span[data-template-variable]]:py-0.5 [&_span[data-template-variable]]:text-primary"
                ),
            },
        },
    })

    // Atualiza o conteúdo quando prop muda (ex: ao editar template existente)
    useEffect(() => {
        if (editor && editorContent !== editor.getHTML()) {
            editor.commands.setContent(editorContent)
        }
    }, [editorContent, editor])

    if (!editor) {
        return (
            <div className={cn("border rounded-md", className)}>
                <div className="h-10 border-b bg-muted/50 animate-pulse" />
                <div className="min-h-[200px] p-4 animate-pulse" />
            </div>
        )
    }

    return (
        <div
            className={cn(
                "border rounded-md overflow-hidden",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
        >
            <RichTextToolbar editor={editor} disabled={disabled} preset={preset} />
            <EditorContent editor={editor} />
        </div>
    )
}
