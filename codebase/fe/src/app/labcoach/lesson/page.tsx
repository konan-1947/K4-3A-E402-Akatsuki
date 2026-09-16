"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RichTextEditor } from "../../../components/rich-text-editor";
import { useDemo } from "../../../components/demo-provider";
import { AutoGenerateCard, GuardStep, Guide, WorkflowScreen } from "../../../components/studio-workflow";

export default function LessonPage() {
  const demo = useDemo();
  const [editing, setEditing] = useState(false);
  useEffect(() => { if (demo.hydrated && demo.blueprintApproved && !demo.lessonGenerated && demo.loading === null) demo.generate("lesson"); }, [demo]);
  return <WorkflowScreen step={4} title="Bài viết lesson"><GuardStep allowed={demo.blueprintApproved} fallback="/labcoach/outline">
    <section className="wizard-intro"><p className="eyebrow">BƯỚC 04 · LESSON DRAFT</p><h2>Sinh bài viết, chỉnh sửa và xuất bản khi bạn đã tin tưởng nội dung.</h2><p>Bài viết chỉ được gửi sang learner preview sau khi lab coach chủ động duyệt và xuất bản.</p></section>
    <section className="studio-section single-step"><div className="section-kicker"><span>04</span><p>Bài viết</p><i className={demo.published ? "status status-active" : "status"}>{demo.published ? "ĐÃ XUẤT BẢN" : demo.articleEdited ? "SẴN SÀNG DUYỆT" : "CẦN CHỈNH"}</i></div>
      <div className="stage-layout"><div className="stage-main">{!demo.lessonGenerated ? <AutoGenerateCard title="Đang tạo bài viết lesson" /> : editing ? <div className="article-editor article-editor-focus"><div className="editor-mode-header"><div><p className="field-label">EDITOR TOÀN BÀI</p><h2>MCP và nguyên tắc sử dụng</h2></div><button className="text-button" onClick={() => setEditing(false)}>← Quay lại preview</button></div><RichTextEditor content={demo.article} onChange={demo.setArticle} /><div className="editor-savebar"><span>Chỉnh sửa trực tiếp nội dung, heading, danh sách và quote.</span><button className="primary-button" onClick={() => { demo.markArticleEdited(); setEditing(false); }}>Lưu thay đổi →</button></div></div> : <><div className="article-preview"><div className="preview-label">BẢN XEM TRƯỚC · {demo.articleEdited ? "ĐÃ CHỈNH SỬA" : "BẢN NHÁP"}</div><h2>MCP và nguyên tắc sử dụng</h2><div dangerouslySetInnerHTML={{ __html: demo.article }} /></div><div className="step-actions article-actions"><button className="secondary-button" onClick={() => setEditing(true)}>Mở editor toàn bài →</button><Link className="secondary-button" href="/user">Mở lesson</Link><button className="primary-button" disabled={!demo.articleEdited || demo.published} onClick={demo.publish}>{demo.published ? "✓ Đã xuất bản" : "Duyệt & xuất bản →"}</button></div></>}</div><Guide steps={["Đọc bản nháp đầy đủ.", "Mở editor và lưu chỉnh sửa.", "Duyệt & xuất bản để learner xem lesson."]} /></div>
    </section>
  </GuardStep></WorkflowScreen>;
}
