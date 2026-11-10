// components/ui/rich-text-editor/rich-text-editor.tsx
"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Image from "@tiptap/extension-image"
import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { RichTextToolbar } from "./rich-text-toolbar"
import { renderTemplateVariablesForEditor } from "@/lib/constants/template.constants"
import { ehColagemInterna, limparHtmlDeColagem } from "@/lib/blog/paste-cleanup"
import { rebaixarTitulosDoCorpo } from "@/lib/blog/heading-levels"

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
    // No artigo, o h1 é o título do post: o corpo só tem h2 e h3. Post antigo
    // com h1 no corpo é rebaixado ao abrir — sem isso o editor, que não
    // conhece h1 neste preset, transformaria os títulos em parágrafo.
    const editorContent = ehArtigo ? rebaixarTitulosDoCorpo(content) : renderTemplateVariablesForEditor(content)

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: ehArtigo ? [2, 3] : [1, 2, 3],
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
                ? [
                    TextAlign.configure({ types: ["heading", "paragraph"] }),
                    // Sem HTMLAttributes: `class` não sobrevive a nenhum sanitizador
                    // (paste-cleanup nem html-sanitizer preservam `class`) — prometer
                    // "rounded-lg" aqui e entregar imagem quadrada no post publicado
                    // é pior do que não prometer nada.
                    Image,
                ]
                : []),
        ],
        content: editorContent,
        editable: !disabled,
        immediatelyRender: false, // ← ADICIONADO: Evita erro de SSR/hydration
        // No Tiptap 3 o padrão é false: a barra não re-renderiza quando o
        // cursor anda e nenhum botão acende para mostrar o que está ativo.
        shouldRerenderOnTransaction: true,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            // Colar num artigo limpa na hora: o autor vê o resultado real, não
            // uma versão bonita que muda ao salvar. No preset de e-mail nada
            // muda — os chips de variável dependem do HTML colado como veio.
            ...(ehArtigo
                ? {
                      // Recortar/colar dentro do próprio editor (Ctrl+X / Ctrl+V para
                      // mover um parágrafo) também passa por transformPastedHTML — mas
                      // esse conteúdo já saiu limpo e já passou pelos gates de
                      // acessibilidade da primeira vez. Limpar de novo com
                      // descartarImagens: true apagaria a imagem que o autor só está
                      // movendo. ehColagemInterna reconhece o marcador que o
                      // ProseMirror grava no HTML que ele mesmo põe na área de
                      // transferência (data-pm-slice) e devolve o HTML como veio.
                      transformPastedHTML: (html: string) =>
                          ehColagemInterna(html)
                              ? html
                              : limparHtmlDeColagem(html, { descartarImagens: true }),
                  }
                : {}),
            attributes: {
                class: cn(
                    "prose max-w-none focus:outline-none dark:prose-invert",
                    // O artigo é escrito no tamanho e no ritmo em que será lido;
                    // o e-mail continua compacto.
                    ehArtigo
                        ? "min-h-[60vh] px-6 py-5 prose-headings:tracking-tight prose-img:rounded-lg"
                        : "prose-sm min-h-[200px] p-4 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0",
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
                // overflow-clip, e não hidden: hidden cria um contêiner de rolagem e
                // a barra fixa (sticky) do artigo deixaria de acompanhar a página.
                "border rounded-md overflow-clip",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
        >
            <RichTextToolbar editor={editor} disabled={disabled} preset={preset} />
            <EditorContent editor={editor} />
        </div>
    )
}
