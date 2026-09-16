"use client";

import Link from "next/link";
import { ChangeEvent, useState } from "react";
import { RichTextEditor } from "../../components/rich-text-editor";
import { useDemo } from "../../components/demo-provider";

type Upload = { id: string; name: string; type: string; size: string };
type Note = { id: string; title: string; content: string };
type BlueprintBlock = { id: number; title: string; type: string; content: string };

const sourceSeed: Upload[] = [
  { id: "transcript", name: "MCP: Client–Server Architecture", type: "TRANSCRIPT", size: "04:20" },
  { id: "slide", name: "Tool safety & permission boundaries", type: "SLIDE", size: "p.08–11" },
];
const notesSeed: Note[] = [
  { id: "core", title: "Ý chính", content: "<p><strong>MCP là bộ điều phối chuẩn hoá.</strong> AI chỉ đi qua những cổng công cụ được khai báo và cho phép.</p>" },
  { id: "analogy", title: "Ẩn dụ", content: "<p>Như một lễ tân chỉ chuyển yêu cầu tới đúng bộ phận được phép.</p>" },
  { id: "evidence", title: "Bằng chứng / citation", content: "<p>[T1] Architecture · 04:20<br>[S2] Permission boundaries · p.08</p>" },
  { id: "coach", title: "Ghi chú lab coach", content: "<p>Nhấn mạnh: khả năng gọi tool không đồng nghĩa với toàn quyền.</p>" },
];
const blueprintSeed: BlueprintBlock[] = [
  { id: 1, title: "Mental model", type: "text + image", content: "<p>Đặt khung tư duy trung tâm trước khi đi vào chi tiết.</p>" },
  { id: 2, title: "Luồng MCP", type: "sequence diagram", content: "<p>Client kết nối server, khám phá tool rồi gọi đúng phạm vi.</p>" },
  { id: 3, title: "Ví dụ: xem lịch", type: "text", content: "<p>Một yêu cầu lịch đi qua tool <code>calendar.read</code>.</p>" },
  { id: 4, title: "Mô phỏng", type: "interactive diagram", content: "<p>Hiện dần message của sequence diagram theo từng nút bấm.</p>" },
  { id: 5, title: "Checkpoint", type: "question", content: "<p>Kiểm tra nguyên tắc quyền tối thiểu.</p>" },
];
const articleSeed = "<h2>MCP là bộ điều phối có cổng kiểm soát.</h2><p>MCP chuẩn hoá cách ứng dụng AI khám phá năng lực được công bố, gửi yêu cầu đúng phạm vi và nhận lại kết quả có thể kiểm tra.</p><h2>Nguyên tắc sử dụng</h2><ul><li>Chỉ dùng tool đã được công bố.</li><li>Xin xác nhận trước hành động có tác động.</li><li>Giữ lại nguồn truy vết được.</li></ul>";

export default function LabCoachPage() {
  const demo = useDemo();
  const [uploads, setUploads] = useState<Upload[]>(sourceSeed);
  const [notes, setNotes] = useState<Note[]>(notesSeed);
  const [blueprint, setBlueprint] = useState<BlueprintBlock[]>(blueprintSeed);
  const [article, setArticle] = useState(articleSeed);
  const [editingArticle, setEditingArticle] = useState(false);

  const selectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []).map((file) => ({ id: `${file.name}-${file.lastModified}`, name: file.name, type: file.name.split(".").pop()?.toUpperCase() || "FILE", size: `${Math.max(1, Math.round(file.size / 1024))} KB` }));
    setUploads((current) => [...current, ...picked]);
    event.target.value = "";
  };
  const updateNote = (id: string, content: string) => setNotes((current) => current.map((note) => note.id === id ? { ...note, content } : note));
  const updateBlock = (id: number, changes: Partial<BlueprintBlock>) => setBlueprint((current) => current.map((block) => block.id === id ? { ...block, ...changes } : block));
  const moveBlock = (index: number, direction: -1 | 1) => setBlueprint((current) => { const target = index + direction; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });

  return <main className="studio-shell">
    <header className="topbar gray-band"><Link className="brand" href="/">StudyPulse<span>·</span>studio</Link><nav><Link href="/user">Lesson ↗</Link><button className="text-button" onClick={demo.reset}>Reset</button></nav></header>
    <div className="studio-title"><p className="eyebrow">LAB COACH</p><h1>Lesson workspace</h1></div>
    <div className="stepper gray-band"><Step number="1" label="Mental model" current /><Step number="2" label="Cấu trúc" current={demo.mentalApproved} /><Step number="3" label="Bài viết" current={demo.blueprintApproved} /></div>

    <section className="studio-section"><SectionHeader number="01" title="Mental model" status={demo.mentalApproved ? "ĐÃ DUYỆT" : "BẢN NHÁP"} active={demo.mentalApproved} />
      <div className="stage-layout"><div className="stage-main"><div className="upload-zone"><div><p className="field-label">NGUỒN ĐÃ CHỌN · {uploads.length}</p><h3>Thêm tài liệu nguồn</h3></div><label className="upload-button">+ Chọn file<input type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.md,.txt" onChange={selectFiles} /></label></div><div className="upload-list">{uploads.map((file) => <div className="upload-row" key={file.id}><span>↗</span><b>{file.name}</b><em>{file.type} · {file.size}</em><button onClick={() => setUploads((current) => current.filter((item) => item.id !== file.id))} aria-label={`Xoá ${file.name}`}>×</button></div>)}</div>
        {!demo.mentalGenerated ? <GenerateCard title="Tạo mental model" action="Tạo bản nháp" loading={demo.loading === "mental"} onClick={() => demo.generate("mental")} /> : <div className="editor-stack">{notes.map((note) => <div className="note-block" key={note.id}><div className="note-heading"><input value={note.title} onChange={(event) => setNotes((current) => current.map((item) => item.id === note.id ? { ...item, title: event.target.value } : item))} /><button onClick={() => setNotes((current) => current.filter((item) => item.id !== note.id))}>×</button></div><RichTextEditor content={note.content} onChange={(content) => updateNote(note.id, content)} compact /></div>)}<button className="secondary-button" onClick={() => setNotes((current) => [...current, { id: `note-${Date.now()}`, title: "Ghi chú mới", content: "<p>Viết ghi chú tại đây.</p>" }])}>+ Thêm note block</button><button className="primary-button" disabled={demo.mentalApproved} onClick={demo.approveMental}>{demo.mentalApproved ? "✓ Đã duyệt" : "Duyệt mental model →"}</button></div>}</div><Guide steps={["Chọn hoặc thêm file nguồn.", "Tạo bản nháp và ghi chú theo block.", "Duyệt khi mental model đã rõ."]} /></div>
    </section>

    <section className={demo.mentalApproved ? "studio-section" : "studio-section is-locked"}><SectionHeader number="02" title="Cấu trúc lesson" status={demo.blueprintApproved ? "ĐÃ DUYỆT" : "CHỜ DUYỆT"} active={demo.blueprintApproved} />
      {!demo.mentalApproved ? <Locked text="Duyệt mental model để mở bước này." /> : <div className="stage-layout"><div className="stage-main">{!demo.blueprintGenerated ? <GenerateCard title="Tạo cấu trúc lesson" action="Tạo cấu trúc" loading={demo.loading === "blueprint"} onClick={() => demo.generate("blueprint")} /> : <><div className="flow-graph gray-band"><p className="field-label">LEARNING FLOW</p><div className="graph-nodes">{blueprint.map((block, index) => <div className="graph-item" key={block.id}><span>{index + 1}</span><b>{block.title}</b>{index < blueprint.length - 1 && <i>→</i>}</div>)}</div></div><div className="blueprint-editor">{blueprint.map((block, index) => <article className="blueprint-block" key={block.id}><div className="block-actions"><span>{String(index + 1).padStart(2, "0")}</span><button disabled={index === 0} onClick={() => moveBlock(index, -1)}>↑</button><button disabled={index === blueprint.length - 1} onClick={() => moveBlock(index, 1)}>↓</button><button onClick={() => setBlueprint((current) => current.filter((item) => item.id !== block.id))}>×</button></div><input className="block-title" value={block.title} onChange={(event) => updateBlock(block.id, { title: event.target.value })} /><input className="block-type" value={block.type} onChange={(event) => updateBlock(block.id, { type: event.target.value })} /><RichTextEditor content={block.content} onChange={(content) => updateBlock(block.id, { content })} compact /></article>)}<button className="secondary-button" onClick={() => setBlueprint((current) => [...current, { id: Date.now(), title: "Block mới", type: "text", content: "<p>Nội dung block.</p>" }])}>+ Thêm block</button></div><button className="primary-button" disabled={demo.blueprintApproved} onClick={demo.approveBlueprint}>{demo.blueprintApproved ? "✓ Đã duyệt cấu trúc" : "Duyệt cấu trúc →"}</button></>}</div><Guide steps={["Sửa nội dung từng block.", "Đổi thứ tự bằng mũi tên; graph cập nhật ngay.", "Duyệt cấu trúc trước khi sinh bài viết."]} /></div>}
    </section>

    <section className={demo.blueprintApproved ? "studio-section" : "studio-section is-locked"}><SectionHeader number="03" title="Bài viết" status={demo.published ? "ĐÃ XUẤT BẢN" : demo.articleEdited ? "SẴN SÀNG DUYỆT" : "CẦN CHỈNH SỬA"} active={demo.published} />
      {!demo.blueprintApproved ? <Locked text="Duyệt cấu trúc lesson để mở bước này." /> : <div className="stage-layout"><div className="stage-main">{!demo.lessonGenerated ? <GenerateCard title="Sinh bài viết mock" action="Sinh bài viết" loading={demo.loading === "lesson"} onClick={() => demo.generate("lesson")} /> : <><div className="article-preview"><div className="preview-label">BẢN XEM TRƯỚC</div><h2>MCP và nguyên tắc sử dụng</h2><div dangerouslySetInnerHTML={{ __html: article }} /></div>{editingArticle ? <div className="article-editor"><RichTextEditor label="CHỈNH SỬA BÀI VIẾT" content={article} onChange={setArticle} /><button className="primary-button" onClick={() => { demo.markArticleEdited(); setEditingArticle(false); }}>Lưu thay đổi & xem trước →</button></div> : <div className="article-actions"><button className="secondary-button" onClick={() => setEditingArticle(true)}>Chỉnh sửa bài viết</button><Link className="secondary-button" href="/user">Mở lesson</Link><button className="primary-button" disabled={!demo.articleEdited || demo.published} onClick={demo.publish}>{demo.published ? "✓ Đã xuất bản" : "Duyệt & xuất bản →"}</button></div>}</>}</div><Guide steps={["Xem bài viết ở chế độ đọc.", "Mở editor, chỉnh và lưu thay đổi.", "Duyệt & xuất bản sau khi đã lưu."]} /></div>}
    </section>
  </main>;
}

function Step({ number, label, current }: { number: string; label: string; current: boolean }) { return <div className={current ? "step step-current" : "step"}><b>{number}</b><span>{label}</span></div>; }
function SectionHeader({ number, title, status, active }: { number: string; title: string; status: string; active: boolean }) { return <div className="section-kicker"><span>{number}</span><p>{title}</p><i className={active ? "status status-active" : "status"}>{status}</i></div>; }
function Guide({ steps }: { steps: string[] }) { return <aside className="guide-panel gray-band"><p className="field-label">USER GUIDE</p><ol>{steps.map((step) => <li key={step}>{step}</li>)}</ol></aside>; }
function GenerateCard({ title, action, loading, onClick }: { title: string; action: string; loading: boolean; onClick: () => void }) { return <div className="generate-card gray-band"><span>✦</span><h3>{title}</h3><button className="primary-button" disabled={loading} onClick={onClick}>{loading ? "Đang tạo..." : `${action} →`}</button></div>; }
function Locked({ text }: { text: string }) { return <div className="locked-state gray-band"><span>⊘</span><p>{text}</p></div>; }
