"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppShell } from "./app-shell";
import { useDemo } from "./demo-provider";

export function WorkflowScreen({ step, title, children }: { step: 1 | 2 | 3 | 4; title: string; children: ReactNode }) {
  const demo = useDemo();
  return <AppShell active="studio" eyebrow={`LESSON STUDIO · BƯỚC 0${step}`} title={title}>
    <div className="studio-shell wizard-shell">
      <div className="studio-toolbar"><div><b>Lesson draft</b><span> · MCP fundamentals</span></div><button className="text-button" onClick={demo.reset}>↻ Reset workflow</button></div>
      <WorkflowStepper current={step} />
      {children}
    </div>
  </AppShell>;
}

function WorkflowStepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  const demo = useDemo();
  const steps = [
    { n: 1 as const, label: "Chọn nguồn", href: "/labcoach", available: true },
    { n: 2 as const, label: "Mental model", href: "/labcoach/mental", available: demo.uploads.length > 0 },
    { n: 3 as const, label: "Cấu trúc lesson", href: "/labcoach/outline", available: demo.mentalApproved },
    { n: 4 as const, label: "Bài viết", href: "/labcoach/lesson", available: demo.blueprintApproved },
  ];
  return <nav className="stepper" aria-label="Tiến độ lesson">
    {steps.map((item) => item.available ? <Link key={item.n} href={item.href} className={item.n === current ? "step step-current" : "step step-available"}><b>{String(item.n).padStart(2, "0")}</b><span>{item.label}</span>{item.n < current && <i>✓</i>}</Link> : <span className="step" key={item.n}><b>{String(item.n).padStart(2, "0")}</b><span>{item.label}</span></span>)}
  </nav>;
}

export function GuardStep({ allowed, fallback, children }: { allowed: boolean; fallback: string; children: ReactNode }) {
  const router = useRouter();
  const demo = useDemo();
  useEffect(() => { if (demo.hydrated && !allowed) router.replace(fallback); }, [allowed, demo.hydrated, fallback, router]);
  if (!demo.hydrated) return <div className="wizard-loading">Đang khôi phục phiên làm việc…</div>;
  if (!allowed) return <div className="wizard-loading">Đang chuyển về bước phù hợp…</div>;
  return <>{children}</>;
}

export function Guide({ steps }: { steps: string[] }) { return <aside className="guide-panel"><p className="field-label">USER GUIDE</p><ol>{steps.map((item) => <li key={item}>{item}</li>)}</ol></aside>; }

export function GenerateCard({ title, action, loading, onClick }: { title: string; action: string; loading: boolean; onClick: () => void }) { return <div className="generate-card"><span>✦</span><h3>{title}</h3><button className="primary-button" disabled={loading} onClick={onClick}>{loading ? "Đang tạo..." : `${action} →`}</button></div>; }
export function AutoGenerateCard({ title }: { title: string }) { return <div className="generate-card"><span>✦</span><h3>{title}</h3><em className="auto-generating">AI đang tạo bản nháp…</em></div>; }

export function JobProgressCard({ title, status, stage, stages, error, onRetry }: { title: string; status: string; stage: string; stages: { key: string; label: string; detail: string }[]; error?: string | null; onRetry: () => void }) {
  const currentIndex = Math.max(0, stages.findIndex((item) => stage === item.key || stage.startsWith(`${item.key}_`)));
  const activeIndex = status === "QUEUED" ? 0 : currentIndex;
  const percent = status === "SUCCEEDED" ? 100 : Math.max(8, Math.round(((activeIndex + .5) / stages.length) * 100));
  if (status === "FAILED") return <div className="generate-card failure-card" role="alert"><span>!</span><div><h3>{title} chưa hoàn tất</h3><p>{error || "Đã có lỗi khi xử lý. Bạn có thể thử lại."}</p><div className="failure-actions"><button className="secondary-button" onClick={onRetry}>Thử lại</button></div></div></div>;
  return <div className="ai-run-card" role="status" aria-live="polite" aria-label={`Tiến độ ${title}`}>
    <div className="ai-run-header"><div><p className="field-label">AI WORKFLOW</p><h3>{status === "QUEUED" ? "Đã nhận yêu cầu, đang xếp hàng" : title}</h3></div><span className="ai-connection"><i />Đang theo dõi</span></div>
    <div className="ai-run-summary"><div className="ai-run-orb" aria-hidden="true"><span /></div><div><strong>{stages[activeIndex]?.label ?? "Đang chuẩn bị"}</strong><p>{stages[activeIndex]?.detail ?? "Hệ thống đang chuẩn bị tác vụ."}</p></div></div>
    <div className="ai-progress-meta"><span>{activeIndex + 1}/{stages.length} giai đoạn</span><span>{stage === "QUEUED" ? "Đang chờ worker" : "Đang cập nhật"}</span></div>
    <div className="ai-progress-track" role="progressbar" aria-label={`Tiến độ ${title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>
    <ol className="ai-stage-list">{stages.map((item, index) => { const done = status === "SUCCEEDED" || index < activeIndex; const current = !done && index === activeIndex; return <li className={done ? "is-done" : current ? "is-current" : ""} key={item.key}><span className="ai-stage-mark">{done ? "✓" : String(index + 1).padStart(2, "0")}</span><div><strong>{item.label}</strong><small>{current ? item.detail : done ? "Đã hoàn tất" : "Sắp thực hiện"}</small></div></li>; })}</ol>
  </div>;
}
