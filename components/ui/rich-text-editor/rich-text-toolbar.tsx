// components/ui/rich-text-editor/rich-text-toolbar.tsx
"use client"

import { Editor } from "@tiptap/react"
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    List,
    ListOrdered,
    Link,
    Unlink,
    Heading1,
    Heading2,
    Undo,
    Redo,
} from "lucide-react"
import { Toggle } from "@/components/ui/toggle"
import { Separator } from "@/components/ui/separator"
import { VariableDropdown } from "./variable-dropdown"
import { useState } from "react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RichTextToolbarProps {
    editor: Editor
    disabled?: boolean
}

export function RichTextToolbar({ editor, disabled }: RichTextToolbarProps) {
    const [linkUrl, setLinkUrl] = useState("")
    const [linkPopoverOpen, setLinkPopoverOpen] = useState(false)

    const addLink = () => {
        if (linkUrl) {
            editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: linkUrl })
                .run()
            setLinkUrl("")
            setLinkPopoverOpen(false)
        }
    }

    const removeLink = () => {
        editor.chain().focus().unsetLink().run()
    }

    const insertVariable = (variable: string) => {
        editor.chain().focus().insertContent(`{{${variable}}}`).run()
    }

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
            {/* Undo/Redo */}
            <Toggle
                size="sm"
                pressed={false}
                onPressedChange={() => editor.chain().focus().undo().run()}
                disabled={disabled || !editor.can().undo()}
                title="Desfazer"
            >
                <Undo className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={false}
                onPressedChange={() => editor.chain().focus().redo().run()}
                disabled={disabled || !editor.can().redo()}
                title="Refazer"
            >
                <Redo className="h-4 w-4" />
            </Toggle>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Headings */}
            <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 1 })}
                onPressedChange={() =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                disabled={disabled}
                title="Título 1"
            >
                <Heading1 className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 2 })}
                onPressedChange={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                disabled={disabled}
                title="Título 2"
            >
                <Heading2 className="h-4 w-4" />
            </Toggle>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Text formatting */}
            <Toggle
                size="sm"
                pressed={editor.isActive("bold")}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
                disabled={disabled}
                title="Negrito (Ctrl+B)"
            >
                <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive("italic")}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                disabled={disabled}
                title="Itálico (Ctrl+I)"
            >
                <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive("underline")}
                onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                disabled={disabled}
                title="Sublinhado (Ctrl+U)"
            >
                <Underline className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive("strike")}
                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                disabled={disabled}
                title="Riscado"
            >
                <Strikethrough className="h-4 w-4" />
            </Toggle>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Lists */}
            <Toggle
                size="sm"
                pressed={editor.isActive("bulletList")}
                onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                disabled={disabled}
                title="Lista com marcadores"
            >
                <List className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive("orderedList")}
                onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                disabled={disabled}
                title="Lista numerada"
            >
                <ListOrdered className="h-4 w-4" />
            </Toggle>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Link */}
            <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
                <PopoverTrigger asChild>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive("link")}
                        disabled={disabled}
                        title="Inserir link"
                    >
                        <Link className="h-4 w-4" />
                    </Toggle>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                    <div className="space-y-3">
                        <Label htmlFor="link-url">URL do link</Label>
                        <Input
                            id="link-url"
                            placeholder="https://exemplo.com"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addLink()}
                        />
                        <div className="flex gap-2">
                            <Button size="sm" onClick={addLink} disabled={!linkUrl}>
                                Inserir
                            </Button>
                            {editor.isActive("link") && (
                                <Button size="sm" variant="outline" onClick={removeLink}>
                                    Remover link
                                </Button>
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {editor.isActive("link") && (
                <Toggle
                    size="sm"
                    pressed={false}
                    onPressedChange={removeLink}
                    disabled={disabled}
                    title="Remover link"
                >
                    <Unlink className="h-4 w-4" />
                </Toggle>
            )}

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Variables */}
            <VariableDropdown onSelect={insertVariable} disabled={disabled} />
        </div>
    )
}