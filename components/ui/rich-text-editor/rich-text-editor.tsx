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
                                   placeholder = "Escreva o conteúdo do email...",
                                   className,
                                   disabled = false,
                               }: RichTextEditorProps) {
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
        content,
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
                    "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
                ),
            },
        },
    })

    // Atualiza o conteúdo quando prop muda (ex: ao editar template existente)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content)
        }
    }, [content, editor])

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