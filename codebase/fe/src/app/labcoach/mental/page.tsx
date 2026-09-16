"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "../../../components/rich-text-editor";
import { useDemo } from "../../../components/demo-provider";
import { AutoGenerateCard, GuardStep, Guide, WorkflowScreen } from "../../../components/studio-workflow";

export default function MentalModelPage() {
  const router = useRouter();
  const demo = useDemo();
  const approve = () => { demo.approveMental(); router.push("/labcoach/outline"); };
  useEffect(() => { if (demo.hydrated && !demo.mentalGenerated && demo.loading === null) demo.generate("mental"); }, [demo]);
  return <WorkflowScreen step={2} title="Mental model"><GuardStep allowed={demo.uploads.length > 0} fallback="/labcoach">
    <section className="wizard-intro"><p className="eyebrow">BƯỚC 02 · AI ANALYSIS</p><h2>Tạo một cách hiểu chung từ các nguồn đã chọn.</h2><p>AI dựng bản nháp mental model. Lab coach xem, chỉnh sửa và duyệt bản này trước khi bắt đầu thiết kế cấu trúc lesson.</p></section>
    <section className="studio-section single-step"><div className="section-kicker"><span>02</span><p>Mental model</p><i className={demo.mentalApproved ? "status status-active" : "status"}>{demo.mentalApproved ? "ĐÃ DUYỆT" : demo.mentalGenerated ? "BẢN NHÁP" : "CHƯA TẠO"}</i></div>
      <div className="stage-layout"><div className="stage-main"><div className="source-summary"><p className="field-label">NGUỒN ĐANG PHÂN TÍCH · {demo.uploads.length}</p><div>{demo.uploads.map((file) => <span key={file.id}>{file.name}</span>)}</div><Link href="/labcoach" className="text-button">← Chỉnh nguồn</Link></div>
        {!demo.mentalGenerated ? <AutoGenerateCard title="Đang tạo mental model" /> : <div className="editor-stack"><RichTextEditor label="MENTAL MODEL" content={demo.mentalModel} onChange={demo.setMentalModel} /><div className="step-actions"><span>Kiểm tra khái niệm trung tâm, liên hệ và bằng chứng nguồn trước khi duyệt.</span><button className="primary-button" disabled={demo.mentalApproved} onClick={approve}>{demo.mentalApproved ? "✓ Đã duyệt" : "Duyệt & tiếp tục →"}</button></div></div>}</div><Guide steps={["Đọc các nguồn AI đang dùng.", "Tạo và chỉnh mental model.", "Duyệt để mở cấu trúc lesson."]} /></div>
    </section>
  </GuardStep></WorkflowScreen>;
}
