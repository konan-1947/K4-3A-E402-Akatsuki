"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LearningGraph } from "../../../components/learning-graph";
import { RichTextEditor } from "../../../components/rich-text-editor";
import { useDemo, type BlueprintBlock, type BlueprintContentBrief } from "../../../components/demo-provider";
import { AutoGenerateCard, GuardStep, Guide, WorkflowScreen } from "../../../components/studio-workflow";

const emptyBrief = (): BlueprintContentBrief => ({ overview: "<p></p>", writing_outline: [], learner_action: "", evidence_of_learning: "", checkpoint: "", transition: "" });

export default function OutlinePage() {
  const router = useRouter();
  const demo = useDemo();
  useEffect(() => { if (demo.hydrated && demo.mentalApproved && !demo.blueprintGenerated && demo.loading === null) void demo.startBlueprint(); }, [demo]);
  const updateBlock = (id: number | string, changes: Partial<BlueprintBlock>) => demo.setBlueprint((current) => current.map((block) => block.id === id ? { ...block, ...changes } : block));
  const moveBlock = (index: number, direction: -1 | 1) => demo.setBlueprint((current) => { const target = index + direction; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  const addBlock = () => demo.setBlueprint((current) => [...current, { id: Date.now(), title: "Learning block mới", type: "explanation", content: "<p>Mô tả rõ nội dung sẽ viết trong phần này.</p>", content_brief: { ...emptyBrief(), overview: "<p>Mô tả rõ nội dung sẽ viết trong phần này.</p>" }, asset_plan: [] }]);
  const approve = async () => { if (await demo.approveBlueprint()) router.push("/labcoach/lesson"); };
  const viewBlock = (id: number | string) => document.getElementById(`learning-block-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return <WorkflowScreen step={3} title="Cấu trúc lesson"><GuardStep allowed={demo.mentalApproved} fallback="/labcoach/mental">
    <section className="wizard-intro"><p className="eyebrow">BƯỚC 03 · LEARNING FLOW</p><h2>Biến mental model đã duyệt thành các nhịp học rõ ràng.</h2><p>AI dựng learning graph từ điểm bắt đầu đến điểm kết thúc. Lab coach có thể sửa từng block và thứ tự trước khi sinh bài viết.</p></section>
    <section className="studio-section single-step"><div className="section-kicker"><span>03</span><p>Cấu trúc lesson</p><i className={demo.blueprintApproved ? "status status-active" : "status"}>{demo.blueprintApproved ? "ĐÃ DUYỆT" : "CẦN DUYỆT"}</i></div>
      <div className="stage-layout"><div className="stage-main">{!demo.blueprintGenerated ? <>{<AutoGenerateCard title="Đang tạo learning graph" />}{demo.mentalError && !demo.loading && <div className="ai-connection-note"><strong>Không thể tạo blueprint.</strong><span>{demo.mentalError}</span><button className="secondary-button" onClick={() => void demo.startBlueprint()}>Thử lại</button></div>}</> : <>
        <LearningGraph blocks={demo.blueprint} edges={demo.blueprintEdges} onUpdateBlock={updateBlock} onViewBlock={viewBlock} />
        <div className="blueprint-editor">{demo.blueprint.map((block, index) => { const brief = block.content_brief ?? { ...emptyBrief(), overview: block.content }; return <article className="learning-block-detail" id={`learning-block-${block.id}`} key={block.id}><header><div className="learning-block-actions"><span>{String(index + 1).padStart(2, "0")}</span><button disabled={index === 0} onClick={() => moveBlock(index, -1)} aria-label="Đưa block lên">↑</button><button disabled={index === demo.blueprint.length - 1} onClick={() => moveBlock(index, 1)} aria-label="Đưa block xuống">↓</button><button onClick={() => demo.setBlueprint((current) => current.filter((item) => item.id !== block.id))} aria-label="Xóa block">×</button></div><input className="learning-block-title" value={block.title} onChange={(event) => updateBlock(block.id, { title: event.target.value })} /><select className="learning-block-type" value={block.type} onChange={(event) => updateBlock(block.id, { type: event.target.value })}><option value="orientation">orientation</option><option value="explanation">explanation</option><option value="diagram">diagram</option><option value="sequence">sequence</option><option value="worked_example">worked example</option><option value="simulation">simulation</option><option value="guided_practice">guided practice</option><option value="checkpoint">checkpoint</option><option value="summary">summary</option></select></header><div className="blueprint-writing-brief"><p className="field-label">MÔ TẢ CHI TIẾT PHẦN NÀY SẼ ĐƯỢC VIẾT/GHI HÌNH/GHI LUỒNG RA SAO</p><RichTextEditor content={block.content} onChange={(content) => updateBlock(block.id, { content, content_brief: { ...brief, overview: content } })} /></div></article>; })}<button className="secondary-button" onClick={addBlock}>+ Thêm learning block</button></div>
        {demo.blueprintError && <div className="blueprint-validation-note"><strong>Blueprint chưa thể duyệt.</strong><span>{demo.blueprintError}</span></div>}<div className="step-actions"><span>Kiểm tra đường đi từ Bắt đầu đến Kết thúc và nội dung từng learning block trước khi sinh bài viết.</span><button className="secondary-button" onClick={() => void demo.saveBlueprint()}>Lưu draft</button><button className="primary-button" disabled={demo.blueprintApproved} onClick={approve}>{demo.blueprintApproved ? "✓ Đã duyệt" : "Duyệt & tiếp tục →"}</button></div>
      </>}</div><Guide steps={["Đọc đường đi từ Bắt đầu đến Kết thúc.", "Sửa từng learning block hoặc đổi thứ tự.", "Duyệt để tự sinh bài viết."]} /></div>
    </section>
  </GuardStep></WorkflowScreen>;
}
