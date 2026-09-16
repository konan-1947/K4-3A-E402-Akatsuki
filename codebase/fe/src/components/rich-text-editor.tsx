"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";

type RichTextEditorProps = { content: string; onChange: (html: string) => void; label?: string; compact?: boolean };
type Align = "left" | "center" | "right" | "justify";
const symbols = ["×", "÷", "±", "√", "≈", "≠", "≤", "≥", "°", "∞", "α", "β", "γ", "Δ", "Ω", "→", "←", "↔"];

function ToolButton({ label, active = false, disabled = false, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className={`tiptap-tool${active ? " is-active" : ""}`} type="button" title={label} aria-label={label} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={onClick}>{children}</button>;
}

function Toolbar({ editor, compact }: { editor: Editor; compact: boolean }) {
  const [menu, setMenu] = useState<"table" | "symbols" | null>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const highlightRef = useRef<HTMLInputElement>(null);
  const state = useEditorState({ editor, selector: ({ editor: current }) => ({
    heading: current?.isActive("heading", { level: 1 }) ? 1 : current?.isActive("heading", { level: 2 }) ? 2 : current?.isActive("heading", { level: 3 }) ? 3 : 0,
    bold: current?.isActive("bold") ?? false, italic: current?.isActive("italic") ?? false, underline: current?.isActive("underline") ?? false, strike: current?.isActive("strike") ?? false,
    bullet: current?.isActive("bulletList") ?? false, ordered: current?.isActive("orderedList") ?? false, quote: current?.isActive("blockquote") ?? false,
    sub: current?.isActive("subscript") ?? false, sup: current?.isActive("superscript") ?? false, align: (current?.getAttributes("paragraph").textAlign as Align | undefined) ?? "left",
    undo: current?.can().undo() ?? false, redo: current?.can().redo() ?? false,
  }) });
  const chain = () => editor.chain().focus();
  const setLink = () => { const previous = editor.getAttributes("link").href as string | undefined; const url = window.prompt("Đường dẫn liên kết", previous ?? "https://"); if (url === null) return; if (!url) chain().extendMarkRange("link").unsetLink().run(); else chain().extendMarkRange("link").setLink({ href: url }).run(); };
  const setImage = () => { const url = window.prompt("URL ảnh"); if (url) chain().setImage({ src: url }).run(); };
  const setAlign = (value: Align) => chain().setTextAlign(value).run();
  return <div className="tiptap-toolbar">
    <div className="tiptap-toolbar-row">
      <ToolButton label="Hoàn tác" disabled={!state.undo} onClick={() => chain().undo().run()}>↶</ToolButton><ToolButton label="Làm lại" disabled={!state.redo} onClick={() => chain().redo().run()}>↷</ToolButton><i />
      <select className="tiptap-select" aria-label="Kiểu văn bản" value={state.heading ? `h${state.heading}` : "p"} onChange={(event) => { const value = event.target.value; if (value === "p") chain().setParagraph().run(); else chain().setHeading({ level: Number(value[1]) as 1 | 2 | 3 }).run(); }}><option value="p">Văn bản thường</option><option value="h1">Tiêu đề lớn</option><option value="h2">Tiêu đề</option><option value="h3">Tiêu đề phụ</option></select>
      {!compact && <><select className="tiptap-select tiptap-font" aria-label="Phông chữ" defaultValue="" onChange={(event) => { if (event.target.value) chain().setFontFamily(event.target.value).run(); }}><option value="">Phông chữ</option><option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="Times New Roman">Times New Roman</option></select><select className="tiptap-select tiptap-size" aria-label="Cỡ chữ" defaultValue="" onChange={(event) => { if (event.target.value) chain().setFontSize(`${event.target.value}px`).run(); }}><option value="">Cỡ</option>{[12, 14, 16, 18, 24, 32].map((size) => <option key={size} value={size}>{size}</option>)}</select></>}
      <i /><ToolButton label="Đậm" active={state.bold} onClick={() => chain().toggleBold().run()}><b>B</b></ToolButton><ToolButton label="Nghiêng" active={state.italic} onClick={() => chain().toggleItalic().run()}><em>I</em></ToolButton><ToolButton label="Gạch chân" active={state.underline} onClick={() => chain().toggleUnderline().run()}><u>U</u></ToolButton>
      {!compact && <><ToolButton label="Gạch ngang" active={state.strike} onClick={() => chain().toggleStrike().run()}><s>S</s></ToolButton><ToolButton label="Màu chữ" onClick={() => colorRef.current?.click()}>A</ToolButton><input ref={colorRef} className="tiptap-color" type="color" aria-label="Màu chữ" onChange={(event) => chain().setColor(event.target.value).run()} /><ToolButton label="Tô sáng" onClick={() => highlightRef.current?.click()}>▰</ToolButton><input ref={highlightRef} className="tiptap-color" type="color" aria-label="Màu tô sáng" onChange={(event) => chain().setHighlight({ color: event.target.value }).run()} /></>}
    </div>
    {!compact && <div className="tiptap-toolbar-row tiptap-toolbar-row-secondary">
      <ToolButton label="Danh sách dấu đầu dòng" active={state.bullet} onClick={() => chain().toggleBulletList().run()}>•≡</ToolButton><ToolButton label="Danh sách đánh số" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}>1≡</ToolButton><ToolButton label="Trích dẫn" active={state.quote} onClick={() => chain().toggleBlockquote().run()}>❝</ToolButton><i />
      {([ ["left", "≡"], ["center", "≡"], ["right", "≡"], ["justify", "☷"] ] as [Align, string][]).map(([value, icon]) => <ToolButton key={value} label={`Căn ${value}`} active={state.align === value} onClick={() => setAlign(value)}><span className={`align-${value}`}>{icon}</span></ToolButton>)}<i />
      <ToolButton label="Chỉ số trên" active={state.sup} onClick={() => chain().toggleSuperscript().run()}>x²</ToolButton><ToolButton label="Chỉ số dưới" active={state.sub} onClick={() => chain().toggleSubscript().run()}>x₂</ToolButton><ToolButton label="Chèn liên kết" onClick={setLink}>⌁</ToolButton><ToolButton label="Chèn ảnh từ URL" onClick={setImage}>▧</ToolButton>
      <span className="tiptap-menu-wrap"><ToolButton label="Chèn bảng" onClick={() => setMenu(menu === "table" ? null : "table")}>▦</ToolButton>{menu === "table" && <span className="tiptap-popup"><button type="button" onClick={() => { chain().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run(); setMenu(null); }}>2 × 2</button><button type="button" onClick={() => { chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setMenu(null); }}>3 × 3</button><button type="button" onClick={() => { chain().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run(); setMenu(null); }}>4 × 4</button></span>}</span>
      <span className="tiptap-menu-wrap"><ToolButton label="Ký hiệu" onClick={() => setMenu(menu === "symbols" ? null : "symbols")}>Ω</ToolButton>{menu === "symbols" && <span className="tiptap-popup tiptap-symbols">{symbols.map((symbol) => <button key={symbol} type="button" onClick={() => chain().insertContent(symbol).run()}>{symbol}</button>)}</span>}</span><ToolButton label="Xoá định dạng" onClick={() => chain().unsetAllMarks().clearNodes().run()}>Tx</ToolButton>
    </div>}
  </div>;
}

export function RichTextEditor({ content, onChange, label, compact = false }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false, autolink: true } }), TextStyleKit, Highlight.configure({ multicolor: true }), TextAlign.configure({ types: ["heading", "paragraph"] }), Subscript.extend({ excludes: "superscript" }), Superscript.extend({ excludes: "subscript" }), TableKit.configure({ table: { resizable: true } }), Image.configure({ HTMLAttributes: { loading: "lazy" } })],
    content, immediatelyRender: false, editorProps: { attributes: { class: `tiptap-content lesson-document-editor${compact ? " compact-editor" : ""}` } }, onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });
  useEffect(() => { if (editor && editor.getHTML() !== content) editor.commands.setContent(content, { emitUpdate: false }); }, [content, editor]);
  if (!editor) return null;
  return <div className={`rich-editor${compact ? " rich-editor-compact" : ""}`}>{label && <p className="field-label">{label}</p>}<Toolbar editor={editor} compact={compact} /><EditorContent editor={editor} /></div>;
}
