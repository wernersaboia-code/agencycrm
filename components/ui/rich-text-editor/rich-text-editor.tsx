// components/ui/rich-text-editor/rich-text-editor.tsx
"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { RichTextToolbar } from "./rich-text-toolbar"
import { renderTemplateVariablesForEditor } from "@/lib/constants/template.constants"

interface RichTextEditorProps {
    content: string
    onChange: (html: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function RichTextEditor({
                                   content,
                                   onChange,
    placeholder = "Escreva a mensagem como ela deve chegar ao lead...",
                                   className,
                                   disabled = false,
                               }: RichTextEditorProps) {
    const editorContent = renderTemplateVariablesForEditor(content)

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
        ],
        content: editorContent,
        editable: !disabled,
        immediatelyRender: false, // ← ADICIONADO: Evita erro de SSR/hydration
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
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
            <RichTextToolbar editor={editor} disabled={disabled} />
            <EditorContent editor={editor} />
        </div>
    )
}
