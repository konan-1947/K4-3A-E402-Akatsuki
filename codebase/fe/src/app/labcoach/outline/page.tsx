"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LearningGraph } from "../../../components/learning-graph";
import { RichTextEditor } from "../../../components/rich-text-editor";
import { useDemo, type BlueprintBlock } from "../../../components/demo-provider";
import { AutoGenerateCard, GuardStep, Guide, WorkflowScreen } from "../../../components/studio-workflow";

export default function OutlinePage() {
  const router = useRouter();
  const demo = useDemo();
  useEffect(() => { if (demo.hydrated && demo.mentalApproved && !demo.blueprintGenerated && demo.loading === null) demo.generate("blueprint"); }, [demo]);
  const updateBlock = (id: number, changes: Partial<BlueprintBlock>) => demo.setBlueprint((current) => current.map((block) => block.id === id ? { ...block, ...changes } : block));
  const moveBlock = (index: number, direction: -1 | 1) => demo.setBlueprint((current) => { const target = index + direction; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  const addBlock = () => demo.setBlueprint((current) => [...current, { id: Date.now(), title: "Learning block mới", type: "text", content: "<p>Nội dung block.</p>" }]);
  const approve = () => { demo.approveBlueprint(); router.push("/labcoach/lesson"); };
  const viewBlock = (id: number) => document.getElementById(`learning-block-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return <WorkflowScreen step={3} title="Cấu trúc lesson"><GuardStep allowed={demo.mentalApproved} fallback="/labcoach/mental">
    <section className="wizard-intro"><p className="eyebrow">BƯỚC 03 · LEARNING FLOW</p><h2>Biến mental model đã duyệt thành các nhịp học rõ ràng.</h2><p>AI dựng learning graph từ điểm bắt đầu đến điểm kết thúc. Lab coach có thể sửa từng block và thứ tự trước khi sinh bài viết.</p></section>
    <section className="studio-section single-step"><div className="section-kicker"><span>03</span><p>Cấu trúc lesson</p><i className={demo.blueprintApproved ? "status status-active" : "status"}>{demo.blueprintApproved ? "ĐÃ DUYỆT" : "CẦN DUYỆT"}</i></div>
      <div className="stage-layout"><div className="stage-main">{!demo.blueprintGenerated ? <AutoGenerateCard title="Đang tạo learning graph" /> : <>
        <LearningGraph blocks={demo.blueprint} onUpdateBlock={updateBlock} onViewBlock={viewBlock} />
        <div className="blueprint-editor">{demo.blueprint.map((block, index) => <article className="learning-block-detail" id={`learning-block-${block.id}`} key={block.id}><header><div className="learning-block-actions"><span>{String(index + 1).padStart(2, "0")}</span><button disabled={index === 0} onClick={() => moveBlock(index, -1)} aria-label="Đưa block lên">↑</button><button disabled={index === demo.blueprint.length - 1} onClick={() => moveBlock(index, 1)} aria-label="Đưa block xuống">↓</button><button onClick={() => demo.setBlueprint((current) => current.filter((item) => item.id !== block.id))} aria-label="Xóa block">×</button></div><input className="learning-block-title" value={block.title} onChange={(event) => updateBlock(block.id, { title: event.target.value })} /><input className="learning-block-type" value={block.type} onChange={(event) => updateBlock(block.id, { type: event.target.value })} /></header><RichTextEditor label="NỘI DUNG LEARNING BLOCK" content={block.content} onChange={(content) => updateBlock(block.id, { content })} /></article>)}<button className="secondary-button" onClick={addBlock}>+ Thêm learning block</button></div>
        <div className="step-actions"><span>Kiểm tra đường đi từ Bắt đầu đến Kết thúc và nội dung từng learning block trước khi sinh bài viết.</span><button className="primary-button" disabled={demo.blueprintApproved} onClick={approve}>{demo.blueprintApproved ? "✓ Đã duyệt" : "Duyệt & tiếp tục →"}</button></div>
      </>}</div><Guide steps={["Đọc đường đi từ Bắt đầu đến Kết thúc.", "Sửa từng learning block hoặc đổi thứ tự.", "Duyệt để tự sinh bài viết."]} /></div>
    </section>
  </GuardStep></WorkflowScreen>;
}
