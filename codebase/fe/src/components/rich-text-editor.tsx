"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type RichTextEditorProps = {
  content: string;
  onChange: (html: string) => void;
  label?: string;
  compact?: boolean;
};

export function RichTextEditor({ content, onChange, label, compact = false }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
    editorProps: { attributes: { class: `tiptap-content${compact ? " compact-editor" : ""}` } },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  if (!editor) return null;
  const action = (name: string, run: () => void, active = false) => <button className={active ? "editor-action is-active" : "editor-action"} type="button" aria-label={name} onClick={run}>{name}</button>;

  return <div className="rich-editor">
    {label && <p className="field-label">{label}</p>}
    <div className="editor-toolbar">
      {action("H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
      {action("B", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
      {action("I", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
      {action("•", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
      {action("❝", () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
      <span className="toolbar-spacer" />
      {action("↶", () => editor.chain().focus().undo().run())}
      {action("↷", () => editor.chain().focus().redo().run())}
    </div>
    <EditorContent editor={editor} />
  </div>;
}
