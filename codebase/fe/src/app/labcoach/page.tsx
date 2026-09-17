"use client";

import { type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "../../components/demo-provider";
import { Guide, WorkflowScreen } from "../../components/studio-workflow";

export default function LabCoachPage() {
  const router = useRouter();
  const demo = useDemo();
  const selectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    demo.addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };
  const continueToMentalModel = () => { void demo.startMentalModel(); router.push("/labcoach/mental"); };

  return <WorkflowScreen step={1} title="Chọn nguồn">
    <section className="wizard-intro"><p className="eyebrow">BƯỚC 01 · NGUỒN TÀI LIỆU</p><h2>Chọn nguồn cho lesson trước khi AI bắt đầu phân tích.</h2><p>Bước này chỉ để tập hợp và kiểm tra tài liệu. Mental model được tạo ở bước kế tiếp.</p></section>
    <section className="studio-section single-step"><div className="section-kicker"><span>01</span><p>Chọn nguồn</p><i className={demo.uploads.length ? "status status-active" : "status"}>{demo.uploads.length ? "ĐÃ CHỌN" : "CHƯA CHỌN"}</i></div>
      <div className="stage-layout"><div className="stage-main"><div className="upload-zone"><div><p className="field-label">NGUỒN ĐÃ CHỌN · {demo.uploads.length}</p><h3>Thêm tài liệu nguồn</h3></div><label className="upload-button">+ Chọn file<input type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.md,.txt" onChange={selectFiles} /></label></div><div className="upload-list">{demo.uploads.map((file) => <div className="upload-row" key={file.id}><span>↗</span><b>{file.name}</b><em>{file.type} · {file.size}</em><button onClick={() => demo.removeUpload(file.id)} aria-label={`Xoá ${file.name}`}>×</button></div>)}</div>
        <label className="topic-instruction"><span className="field-label">MÔ TẢ PHỤ · TUỲ CHỌN</span><strong>Văn phong và định hướng bài viết</strong><textarea value={demo.topicInstruction} onChange={(event) => demo.setTopicInstruction(event.target.value)} placeholder="Ví dụ: Viết ngắn gọn, thân thiện với sinh viên năm nhất; ưu tiên ví dụ thực tế. Để trống để dùng mặc định." rows={3} /></label>
        <div className="step-actions"><span>{demo.uploads.length ? "Nguồn đã sẵn sàng để AI phân tích ở bước mental model." : "Thêm ít nhất một tài liệu để tiếp tục."}</span><button className="primary-button" disabled={!demo.uploads.length} onClick={continueToMentalModel}>Tiếp tục đến mental model →</button></div></div><Guide steps={["Chọn hoặc thêm file nguồn.", "Kiểm tra các nguồn đã chọn.", "Tiếp tục để tạo mental model ở bước 02."]} /></div>
    </section>
  </WorkflowScreen>;
}
