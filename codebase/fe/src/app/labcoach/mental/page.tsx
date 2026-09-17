"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "../../../components/rich-text-editor";
import { useDemo, type MentalJobStatus } from "../../../components/demo-provider";
import { GuardStep, Guide, WorkflowScreen } from "../../../components/studio-workflow";
import { useEffect, useState } from "react";

const runStages = [
  { key: "EXTRACTING_FACTS", label: "Đọc từng đoạn nguồn", detail: "Trích xuất facts và giữ lại nguồn dẫn chứng." },
  { key: "NORMALIZING", label: "Chuẩn hóa facts", detail: "Gộp tên gọi và chuẩn hóa các khái niệm tương đương." },
  { key: "SYNTHESIZING_DOMAINS", label: "Ghép các domain", detail: "Tạo các domain model từ những facts liên quan." },
  { key: "SYNTHESIZING_MENTAL_MODEL", label: "Tạo mental model", detail: "Kết nối các domain thành một bản đồ kiến thức." },
];

function stageIndex(stage: string) {
  return runStages.findIndex((item) => item.key === stage);
}

function elapsedLabel(startedAt: string | null, now: number) {
  if (!startedAt) return "Đang chuẩn bị";
  const seconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s đã chạy`;
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s đã chạy`;
}

function stageProgressLabel(status: MentalJobStatus, stage: string, progress: number, total: number) {
  if (status === "QUEUED") return "Đã nhận yêu cầu, đang chờ worker bắt đầu";
  if (stage === "EXTRACTING_FACTS") return `${progress}/${total} đoạn nguồn đã phân tích`;
  if (stage === "NORMALIZING") return "Đang chuẩn hóa các bộ facts";
  if (stage === "SYNTHESIZING_DOMAINS") return "Đang tạo domain model";
  if (stage === "SYNTHESIZING_MENTAL_MODEL") return "Đang kết nối mental model cuối";
  return "Đang xử lý";
}

function previewFromCanonical(value: string) {
  try {
    const model = JSON.parse(value) as Record<string, unknown>;
    const text = (key: string) => typeof model[key] === "string" ? model[key] : "";
    return `<h2>${text("title") || "Mental model"}</h2><p><strong>Ý tưởng cốt lõi:</strong> ${text("core_idea") || text("oneSentence")}</p><h3>Phạm vi</h3><p>${text("scope")}</p><h3>Mục đích</h3><p>${text("purpose")}</p><h3>Giải thích</h3><p>${text("explanation")}</p>`;
  } catch { return "<p>Không thể khôi phục bản nháp. Hãy chạy lại mental model.</p>"; }
}

function RunProgressCard() {
  const demo = useDemo();
  const [now, setNow] = useState(() => Date.now());
  const active = demo.mentalStatus === "QUEUED" || demo.mentalStatus === "RUNNING";
  const currentIndex = stageIndex(demo.mentalStage);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  const currentProgress = demo.mentalStage === "EXTRACTING_FACTS" && demo.mentalTotal > 0
    ? Math.round((demo.mentalProgress / demo.mentalTotal) * 100)
    : 8;

  return <div className="ai-run-card" role="region" aria-label="Tiến độ tạo mental model">
    <div className="ai-run-header">
      <div><p className="field-label">AI RUN · {demo.mentalRunId?.slice(-8)}</p><h3>{demo.mentalStatus === "QUEUED" ? "Đã nhận nguồn, đang xếp hàng" : "AI đang phân tích nguồn"}</h3></div>
      <span className={`ai-connection ${demo.mentalConnection === "RECONNECTING" ? "is-reconnecting" : ""}`}><i />{demo.mentalConnection === "RECONNECTING" ? "Đang kết nối lại" : "Đang theo dõi"}</span>
    </div>
    <div className="ai-run-summary" aria-live="polite"><div className="ai-run-orb" aria-hidden="true"><span /></div><div><strong>{stageProgressLabel(demo.mentalStatus, demo.mentalStage, demo.mentalProgress, demo.mentalTotal)}</strong><p>{demo.mentalStage === "EXTRACTING_FACTS" ? "Các đoạn nguồn được xử lý lần lượt; trang này sẽ cập nhật sau mỗi đoạn hoàn tất." : "Các bước tổng hợp có thể mất thêm thời gian vì AI đang kết nối nhiều lớp kiến thức."}</p></div></div>
    <div className="ai-progress-meta"><span>{demo.mentalStage === "EXTRACTING_FACTS" && demo.mentalTotal > 0 ? `${demo.mentalProgress}/${demo.mentalTotal} chunks` : "Đang xử lý theo stage"}</span><span>{elapsedLabel(demo.mentalStartedAt, now)}</span></div>
    <div className="ai-progress-track" role="progressbar" aria-label="Tiến độ AI" aria-valuemin={0} aria-valuemax={100} aria-valuenow={currentProgress}><span style={{ width: `${currentProgress}%` }} /></div>
    <ol className="ai-stage-list">
      {runStages.map((item, index) => {
        const done = demo.mentalStatus === "SUCCEEDED" || (currentIndex >= 0 && index < currentIndex);
        const current = !done && (demo.mentalStage === item.key || (demo.mentalStatus === "QUEUED" && index === 0));
        return <li className={done ? "is-done" : current ? "is-current" : ""} key={item.key}><span className="ai-stage-mark">{done ? "✓" : String(index + 1).padStart(2, "0")}</span><div><strong>{item.label}</strong><small>{current ? item.detail : done ? "Đã hoàn tất" : "Sắp thực hiện"}</small></div></li>;
      })}
    </ol>
    {demo.mentalPollingError && <div className="ai-connection-note"><strong>Chưa lấy được cập nhật mới.</strong><span>{demo.mentalPollingError} Hệ thống vẫn giữ job và sẽ tự thử lại.</span></div>}
    <div className="ai-run-footer"><span>Bạn có thể chuyển sang bước khác; tiến trình được giữ trong phiên làm việc này.</span><span>{demo.mentalLastSeenAt ? "Vừa cập nhật" : "Đang chờ cập nhật đầu tiên"}</span></div>
  </div>;
}

export default function MentalModelPage() {
  const router = useRouter();
  const demo = useDemo();
  const approve = async () => { if (await demo.approveMental()) router.push("/labcoach/outline"); };
  return <WorkflowScreen step={2} title="Mental model"><GuardStep allowed={demo.uploads.length > 0} fallback="/labcoach">
    <section className="wizard-intro"><p className="eyebrow">BƯỚC 02 · AI ANALYSIS</p><h2>Tạo một cách hiểu chung từ các nguồn đã chọn.</h2><p>AI dựng bản nháp mental model. Lab coach xem, chỉnh sửa và duyệt bản này trước khi bắt đầu thiết kế cấu trúc lesson.</p></section>
    <section className="studio-section single-step"><div className="section-kicker"><span>02</span><p>Mental model</p><i className={demo.mentalApproved ? "status status-active" : "status"}>{demo.mentalApproved ? "ĐÃ DUYỆT" : demo.mentalGenerated ? "BẢN NHÁP" : demo.mentalStatus}</i></div>
      <div className="stage-layout"><div className="stage-main" aria-busy={demo.loading === "upload" || demo.loading === "mentalApproval"}><div className="source-summary"><p className="field-label">NGUỒN ĐANG PHÂN TÍCH · {demo.uploads.length}</p><div>{demo.uploads.map((file) => <span key={file.id}>{file.name}</span>)}</div><Link href="/labcoach" className="text-button">← Chỉnh nguồn</Link></div>
        {demo.mentalStatus === "FAILED" ? <div className="generate-card failure-card"><span>!</span><div><h3>Không thể tạo mental model</h3><p>{demo.mentalError}</p><div className="failure-actions"><button className="secondary-button" disabled={demo.loading !== null} onClick={() => void demo.startMentalModel()}>{demo.loading === "upload" ? "Đang gửi nguồn…" : "Thử lại"}</button><Link className="primary-button inline-button" href="/labcoach">Chọn lại nguồn →</Link></div></div></div> : !demo.mentalGenerated ? <RunProgressCard /> : <div className="editor-stack"><RichTextEditor label="MENTAL MODEL" content={demo.mentalModelHtml || previewFromCanonical(demo.mentalModel)} onChange={demo.setMentalModelHtml} /><div className="step-actions"><span>{demo.loading === "mentalApproval" ? "Đang lưu và duyệt mental model…" : "Chỉnh bản nháp trong một editor; JSON canonical được giữ ở hậu trường để sinh blueprint."}</span><button className="primary-button" disabled={demo.mentalApproved || demo.loading !== null} onClick={approve}>{demo.mentalApproved ? "✓ Đã duyệt" : demo.loading === "mentalApproval" ? "Đang duyệt…" : "Duyệt & tiếp tục →"}</button></div></div>}</div><Guide steps={["Đọc các nguồn AI đang dùng.", "Chỉnh mental model trong editor.", "Duyệt khi bản đồ kiến thức đã đúng."]} /></div>
    </section>
  </GuardStep></WorkflowScreen>;
}
