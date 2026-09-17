"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useDemo } from "../../../components/demo-provider";
import { LessonDocument } from "../../../components/lesson-document";
import { RichTextEditor } from "../../../components/rich-text-editor";
import { GuardStep, Guide, JobProgressCard, WorkflowScreen } from "../../../components/studio-workflow";

const lessonStages = [
  { key: "READING_BLUEPRINT", label: "Đọc blueprint đã duyệt", detail: "Đang nạp mục tiêu và cấu trúc bài học." },
  { key: "WRITING_LESSON_METADATA", label: "Soạn metadata lesson", detail: "Đang tạo tiêu đề, mô tả và thời lượng." },
  { key: "WRITING_BLOCK", label: "Viết learning block", detail: "Đang soạn prose cho từng phần của bài học." },
  { key: "GENERATING_DIAGRAM", label: "Tạo diagram", detail: "Đang tạo sơ đồ bám theo blueprint." },
  { key: "GENERATING_SIMULATION", label: "Tạo mô phỏng", detail: "Đang tạo mô phỏng tương tác cho lesson." },
  { key: "VALIDATING_ASSETS", label: "Kiểm tra asset", detail: "Đang xác nhận nội dung và asset có thể hiển thị." },
];

export default function LessonPage() {
  const demo = useDemo();
  const { hydrated, blueprintApproved, lesson, loading, lessonError, startLesson } = demo;
  useEffect(() => { if (hydrated && blueprintApproved && !lesson && loading === null && !lessonError) void startLesson(); }, [hydrated, blueprintApproved, lesson, loading, lessonError, startLesson]);
  const loadingDocument = useMemo(() => `<h1>Đang soạn bài học</h1>${demo.blueprint.map((block, index) => `<h2>${String(index + 1).padStart(2, "0")}. ${escapeHtml(block.title)}</h2><blockquote><strong>Đang soạn nội dung…</strong><br/>AI đang viết phần này từ blueprint đã duyệt.</blockquote>`).join("")}`, [demo.blueprint]);
  const updateBlock = (id: string, body_html: string) => demo.setLesson((current) => current ? { ...current, blocks: current.blocks.map((block) => block.blueprint_block_id === id ? { ...block, body_html } : block) } : current);
  return <WorkflowScreen step={4} title="Bài viết lesson"><GuardStep allowed={demo.blueprintApproved} fallback="/labcoach/outline">
    <section className="wizard-intro"><p className="eyebrow">BƯỚC 04 · LESSON EDITOR</p><h2>Soạn bài ngay trong editor.</h2><p>Khung bài viết hiện trước; từng phần được điền từ blueprint, diagram và mô phỏng được tạo theo block tương ứng.</p></section>
    <section className="studio-section single-step"><div className="section-kicker"><span>04</span><p>Bài viết</p><i className={demo.published ? "status status-active" : "status"}>{demo.published ? "ĐÃ XUẤT BẢN" : demo.articleEdited ? "SẴN SÀNG DUYỆT" : "ĐANG SOẠN"}</i></div>
      <div className="stage-layout"><div className="stage-main" aria-busy={demo.loading === "lesson" || demo.loading === "publish"}>{!demo.lesson ? <>{demo.lessonStatus === "FAILED" ? <JobProgressCard title="Tạo bài viết lesson" status={demo.lessonStatus} stage={demo.lessonStage} stages={lessonStages} error={demo.lessonError} onRetry={() => void demo.startLesson()} /> : <><JobProgressCard title="Đang soạn bài viết lesson" status={demo.lessonStatus} stage={demo.lessonStage} stages={lessonStages} error={demo.lessonError} onRetry={() => void demo.startLesson()} /><div className="lesson-loading-editor"><RichTextEditor content={loadingDocument} onChange={() => undefined} editable={false} label="EDITOR BÀI VIẾT · ĐANG SOẠN" /></div></>}</> : <div className="article-editor article-editor-focus"><div className="editor-mode-header"><div><p className="field-label">EDITOR BÀI VIẾT</p><h2>{demo.lesson.title}</h2></div><button className="text-button" onClick={() => void demo.startLesson()} disabled={demo.loading !== null}>{demo.loading === "lesson" ? "Đang tạo lại…" : "↻ Tạo lại bài viết"}</button></div><LessonDocument lesson={demo.lesson} editable onBlockChange={updateBlock} /><div className="editor-savebar"><span>{demo.loading === "publish" ? "Đang xuất bản lesson cho learner…" : "Chỉnh prose từng learning block; diagram, mô phỏng và placeholder vẫn giữ đúng blueprint."}</span><div><Link className="secondary-button" href="/user">Mở lesson</Link><button className="primary-button" disabled={demo.published || demo.loading !== null} onClick={async () => { demo.markArticleEdited(); await demo.publish(); }}>{demo.published ? "✓ Đã xuất bản" : demo.loading === "publish" ? "Đang xuất bản…" : "Lưu & xuất bản →"}</button></div></div></div>}</div><Guide steps={["Editor hiện khung ngay khi bắt đầu sinh.", "Đọc, sửa prose và thử các asset được tạo.", "Lưu & xuất bản để learner xem lesson."]} /></div>
    </section>
  </GuardStep></WorkflowScreen>;
}

function escapeHtml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
