"use client";

import Link from "next/link";
import { ChangeEvent, useState } from "react";
import { RichTextEditor } from "../../components/rich-text-editor";
import { useDemo } from "../../components/demo-provider";

type Upload = { id: string; name: string; type: string; size: string };
type BlueprintBlock = { id: number; title: string; type: string; content: string };

const sourceSeed: Upload[] = [
  { id: "transcript", name: "MCP: Client–Server Architecture", type: "TRANSCRIPT", size: "04:20" },
  { id: "slide", name: "Tool safety & permission boundaries", type: "SLIDE", size: "p.08–11" },
];
const mentalModelSeed = "<p><strong>MCP là bộ điều phối chuẩn hoá.</strong> AI chỉ đi qua những cổng công cụ được khai báo và cho phép.</p><p>Như một lễ tân chỉ chuyển yêu cầu tới đúng bộ phận được phép, kèm theo quy tắc kiểm tra rõ ràng.</p><p>[T1] Architecture · 04:20<br>[S2] Permission boundaries · p.08</p>";
const blueprintSeed: BlueprintBlock[] = [
  { id: 1, title: "Mental model", type: "text + image", content: "<p>Đặt khung tư duy trung tâm trước khi đi vào chi tiết.</p>" },
  { id: 2, title: "Luồng MCP", type: "sequence diagram", content: "<p>Client kết nối server, khám phá tool rồi gọi đúng phạm vi.</p>" },
  { id: 3, title: "Ví dụ: xem lịch", type: "text", content: "<p>Một yêu cầu lịch đi qua tool <code>calendar.read</code>.</p>" },
  { id: 4, title: "Mô phỏng", type: "interactive diagram", content: "<p>Hiện dần message của sequence diagram theo từng nút bấm.</p>" },
  { id: 5, title: "Checkpoint", type: "question", content: "<p>Kiểm tra nguyên tắc quyền tối thiểu.</p>" },
];
const articleSeed = "<h2>MCP là bộ điều phối có cổng kiểm soát.</h2><p>Khi một AI cần truy cập lịch, tài liệu hay hệ thống nội bộ, rủi ro không nằm ở việc AI có thể gọi tool hay không. Rủi ro nằm ở việc ai định nghĩa tool đó, AI được phép gọi đến đâu và người dùng có nhìn thấy điều gì đang diễn ra hay không.</p><p><strong>Model Context Protocol (MCP)</strong> tạo một giao thức chung để ứng dụng AI kết nối với những năng lực được công bố một cách có cấu trúc. Mental model hữu ích nhất là: MCP giống một bộ điều phối có cổng kiểm soát; AI không tự mở mọi cánh cửa, mà chỉ gửi yêu cầu qua những cổng đã được khai báo.</p><h2>1. Bốn vai trò trong một request</h2><p><strong>Học viên/người dùng</strong> nêu mục tiêu. <strong>AI client</strong> hiểu yêu cầu và quyết định có cần tool hay không. <strong>MCP server</strong> công bố các tool, resource hoặc prompt mà nó hỗ trợ. Cuối cùng, <strong>tool</strong> thực hiện đúng thao tác trong phạm vi được cấp quyền.</p><blockquote><p>Client không cần biết tool được triển khai thế nào; client cần biết tool tên gì, nhận input gì và trả output gì.</p></blockquote><h2>2. Ví dụ: tìm lịch trống</h2><p>Giả sử người dùng hỏi: “Tôi rảnh lúc nào vào chiều mai?”. AI client không nên đoán lịch. Client hỏi MCP server những tool đang có, nhận lại mô tả <code>calendar.read</code>, rồi gọi tool này với khoảng thời gian cần đọc. Calendar tool trả về các khoảng rảnh và AI diễn đạt kết quả cho người dùng.</p><p>Điểm quan trọng: <code>calendar.read</code> chỉ có quyền đọc. Nó không cho phép gửi email, tạo lịch mới hay xoá cuộc hẹn. Tên tool và schema input là một phần của boundary an toàn.</p><h2>3. Nguyên tắc sử dụng MCP</h2><ul><li><strong>Quyền tối thiểu:</strong> chỉ công bố đúng tool và tham số thực sự cần.</li><li><strong>Ý định rõ ràng:</strong> với hành động có tác động, phải xin xác nhận người dùng trước khi gọi tool.</li><li><strong>Input có cấu trúc:</strong> validate tham số trước khi gửi sang hệ thống bên ngoài.</li><li><strong>Output có căn cứ:</strong> AI nên nêu rõ kết quả đến từ tool nào thay vì khẳng định vượt ngoài response.</li><li><strong>Truy vết được:</strong> lưu dấu vết tool, input và response để có thể kiểm tra sau này.</li></ul><h2>4. Tự kiểm tra mental model</h2><p>Nếu MCP server chỉ công bố <code>calendar.read</code>, AI có thể đọc lịch để đề xuất khung giờ. AI không thể tự gửi email xác nhận hoặc xoá lịch cũ. Khả năng kết nối không đồng nghĩa với toàn quyền hành động.</p><h2>Tóm tắt</h2><p>Hãy nhớ MCP không phải “AI có thêm tool”. MCP là cách chuẩn hoá để AI sử dụng đúng năng lực, trong đúng phạm vi và với đường đi có thể kiểm tra.</p>";

export default function LabCoachPage() {
  const demo = useDemo();
  const [uploads, setUploads] = useState<Upload[]>(sourceSeed);
  const [mentalModel, setMentalModel] = useState(mentalModelSeed);
  const [blueprint, setBlueprint] = useState<BlueprintBlock[]>(blueprintSeed);
  const [article, setArticle] = useState(articleSeed);
  const [editingArticle, setEditingArticle] = useState(false);

  const selectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []).map((file) => ({ id: `${file.name}-${file.lastModified}`, name: file.name, type: file.name.split(".").pop()?.toUpperCase() || "FILE", size: `${Math.max(1, Math.round(file.size / 1024))} KB` }));
    setUploads((current) => [...current, ...picked]);
    event.target.value = "";
  };
  const updateBlock = (id: number, changes: Partial<BlueprintBlock>) => setBlueprint((current) => current.map((block) => block.id === id ? { ...block, ...changes } : block));
  const moveBlock = (index: number, direction: -1 | 1) => setBlueprint((current) => { const target = index + direction; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });

  return <main className="studio-shell">
    <header className="topbar gray-band"><Link className="brand" href="/">StudyPulse<span>·</span>studio</Link><nav><Link href="/user">Lesson ↗</Link><button className="text-button" onClick={demo.reset}>Reset</button></nav></header>
    <div className="studio-title"><p className="eyebrow">LAB COACH</p><h1>Lesson workspace</h1></div>
    <div className="stepper gray-band"><Step number="1" label="Mental model" current /><Step number="2" label="Cấu trúc" current={demo.mentalApproved} /><Step number="3" label="Bài viết" current={demo.blueprintApproved} /></div>

    <section className="studio-section"><SectionHeader number="01" title="Mental model" status={demo.mentalApproved ? "ĐÃ DUYỆT" : "BẢN NHÁP"} active={demo.mentalApproved} />
      <div className="stage-layout"><div className="stage-main"><div className="upload-zone"><div><p className="field-label">NGUỒN ĐÃ CHỌN · {uploads.length}</p><h3>Thêm tài liệu nguồn</h3></div><label className="upload-button">+ Chọn file<input type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.md,.txt" onChange={selectFiles} /></label></div><div className="upload-list">{uploads.map((file) => <div className="upload-row" key={file.id}><span>↗</span><b>{file.name}</b><em>{file.type} · {file.size}</em><button onClick={() => setUploads((current) => current.filter((item) => item.id !== file.id))} aria-label={`Xoá ${file.name}`}>×</button></div>)}</div>
        {!demo.mentalGenerated ? <GenerateCard title="Tạo mental model" action="Tạo bản nháp" loading={demo.loading === "mental"} onClick={() => demo.generate("mental")} /> : <div className="editor-stack"><RichTextEditor label="MENTAL MODEL" content={mentalModel} onChange={setMentalModel} /><button className="primary-button" disabled={demo.mentalApproved} onClick={demo.approveMental}>{demo.mentalApproved ? "✓ Đã duyệt" : "Duyệt mental model →"}</button></div>}</div><Guide steps={["Chọn hoặc thêm file nguồn.", "Tạo và chỉnh mental model trong một ô.", "Duyệt khi mental model đã rõ."]} /></div>
    </section>

    <section className={demo.mentalApproved ? "studio-section" : "studio-section is-locked"}><SectionHeader number="02" title="Cấu trúc lesson" status={demo.blueprintApproved ? "ĐÃ DUYỆT" : "CHỜ DUYỆT"} active={demo.blueprintApproved} />
      {!demo.mentalApproved ? <Locked text="Duyệt mental model để mở bước này." /> : <div className="stage-layout"><div className="stage-main">{!demo.blueprintGenerated ? <GenerateCard title="Tạo cấu trúc lesson" action="Tạo cấu trúc" loading={demo.loading === "blueprint"} onClick={() => demo.generate("blueprint")} /> : <><div className="flow-graph gray-band"><p className="field-label">LEARNING FLOW</p><div className="graph-nodes">{blueprint.map((block, index) => <div className="graph-item" key={block.id}><span>{index + 1}</span><b>{block.title}</b>{index < blueprint.length - 1 && <i>→</i>}</div>)}</div></div><div className="blueprint-editor">{blueprint.map((block, index) => <article className="blueprint-block" key={block.id}><div className="block-actions"><span>{String(index + 1).padStart(2, "0")}</span><button disabled={index === 0} onClick={() => moveBlock(index, -1)}>↑</button><button disabled={index === blueprint.length - 1} onClick={() => moveBlock(index, 1)}>↓</button><button onClick={() => setBlueprint((current) => current.filter((item) => item.id !== block.id))}>×</button></div><input className="block-title" value={block.title} onChange={(event) => updateBlock(block.id, { title: event.target.value })} /><input className="block-type" value={block.type} onChange={(event) => updateBlock(block.id, { type: event.target.value })} /><RichTextEditor content={block.content} onChange={(content) => updateBlock(block.id, { content })} compact /></article>)}<button className="secondary-button" onClick={() => setBlueprint((current) => [...current, { id: Date.now(), title: "Block mới", type: "text", content: "<p>Nội dung block.</p>" }])}>+ Thêm block</button></div><button className="primary-button" disabled={demo.blueprintApproved} onClick={demo.approveBlueprint}>{demo.blueprintApproved ? "✓ Đã duyệt cấu trúc" : "Duyệt cấu trúc →"}</button></>}</div><Guide steps={["Sửa nội dung từng block.", "Đổi thứ tự bằng mũi tên; graph cập nhật ngay.", "Duyệt cấu trúc trước khi sinh bài viết."]} /></div>}
    </section>

    <section className={demo.blueprintApproved ? "studio-section" : "studio-section is-locked"}><SectionHeader number="03" title="Bài viết" status={demo.published ? "ĐÃ XUẤT BẢN" : demo.articleEdited ? "SẴN SÀNG DUYỆT" : "CẦN CHỈNH SỬA"} active={demo.published} />
        {!demo.blueprintApproved ? <Locked text="Duyệt cấu trúc lesson để mở bước này." /> : <div className="stage-layout"><div className="stage-main">{!demo.lessonGenerated ? <GenerateCard title="Sinh bài viết mock" action="Sinh bài viết" loading={demo.loading === "lesson"} onClick={() => demo.generate("lesson")} /> : <>{editingArticle ? <div className="article-editor article-editor-focus"><div className="editor-mode-header"><div><p className="field-label">EDITOR TOÀN BÀI</p><h2>MCP và nguyên tắc sử dụng</h2></div><button className="text-button" onClick={() => setEditingArticle(false)}>← Quay lại preview</button></div><RichTextEditor content={article} onChange={setArticle} /><div className="editor-savebar"><span>Chỉnh sửa trực tiếp nội dung, heading, danh sách và quote.</span><button className="primary-button" onClick={() => { demo.markArticleEdited(); setEditingArticle(false); }}>Lưu thay đổi & xem trước →</button></div></div> : <><div className="article-preview"><div className="preview-label">BẢN XEM TRƯỚC · {demo.articleEdited ? "ĐÃ CHỈNH SỬA" : "BẢN NHÁP"}</div><h2>MCP và nguyên tắc sử dụng</h2><div dangerouslySetInnerHTML={{ __html: article }} /></div><div className="article-actions"><button className="secondary-button" onClick={() => setEditingArticle(true)}>Mở editor toàn bài →</button><Link className="secondary-button" href="/user">Mở lesson</Link><button className="primary-button" disabled={!demo.articleEdited || demo.published} onClick={demo.publish}>{demo.published ? "✓ Đã xuất bản" : "Duyệt & xuất bản →"}</button></div></>}</>}</div><Guide steps={["Đọc toàn bộ bản xem trước.", "Mở editor toàn bài, chỉnh và lưu.", "Duyệt & xuất bản sau khi đã lưu."]} /></div>}
    </section>
  </main>;
}

function Step({ number, label, current }: { number: string; label: string; current: boolean }) { return <div className={current ? "step step-current" : "step"}><b>{number}</b><span>{label}</span></div>; }
function SectionHeader({ number, title, status, active }: { number: string; title: string; status: string; active: boolean }) { return <div className="section-kicker"><span>{number}</span><p>{title}</p><i className={active ? "status status-active" : "status"}>{status}</i></div>; }
function Guide({ steps }: { steps: string[] }) { return <aside className="guide-panel gray-band"><p className="field-label">USER GUIDE</p><ol>{steps.map((step) => <li key={step}>{step}</li>)}</ol></aside>; }
function GenerateCard({ title, action, loading, onClick }: { title: string; action: string; loading: boolean; onClick: () => void }) { return <div className="generate-card gray-band"><span>✦</span><h3>{title}</h3><button className="primary-button" disabled={loading} onClick={onClick}>{loading ? "Đang tạo..." : `${action} →`}</button></div>; }
function Locked({ text }: { text: string }) { return <div className="locked-state gray-band"><span>⊘</span><p>{text}</p></div>; }
