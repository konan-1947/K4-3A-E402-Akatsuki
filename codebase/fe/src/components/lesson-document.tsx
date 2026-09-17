"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LessonAsset, LessonDraft } from "./demo-provider";
import { RichTextEditor } from "./rich-text-editor";

export function LessonDocument({ lesson, editable = false, onBlockChange }: { lesson: LessonDraft; editable?: boolean; onBlockChange?: (blockId: string, html: string) => void }) {
  return <>
    <header className="lesson-hero"><p className="eyebrow">BÀI HỌC · {lesson.estimated_minutes} PHÚT</p><h1>{lesson.title}</h1><p className="lesson-subtitle">{lesson.subtitle}</p><div className="lesson-meta"><span>Lab coach approved blueprint</span><span>·</span><span>{lesson.blocks.length} learning blocks</span></div></header>
    {lesson.blocks.map((block, index) => <section className="lesson-section" key={block.blueprint_block_id}>
      <p className="section-number">{String(index + 1).padStart(2, "0")} — LEARNING BLOCK</p><h2>{block.heading}</h2>
      {editable ? <LessonBlockEditor value={block.body_html} onChange={(html) => onBlockChange?.(block.blueprint_block_id, html)} /> : <div className="lesson-prose" dangerouslySetInnerHTML={{ __html: block.body_html }} />}
      {block.assets.map((asset, assetIndex) => <LessonAssetView asset={asset} key={`${asset.kind}-${assetIndex}`} />)}
    </section>)}
  </>;
}

function LessonBlockEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <RichTextEditor content={value} onChange={onChange} compact />;
}

export function LessonAssetView({ asset }: { asset: LessonAsset }) {
  if (asset.kind === "image_placeholder") return <figure className="image-placeholder gray-band"><span>IMAGE PLACEHOLDER</span><strong>{asset.description || "Hình minh hoạ đang được chuẩn bị."}</strong>{asset.caption && <figcaption>{asset.caption}</figcaption>}</figure>;
  if (asset.kind === "diagram") return <GeneratedDiagram asset={asset} />;
  return <Simulation asset={asset} />;
}

function Simulation({ asset }: { asset: Extract<LessonAsset, { kind: "simulation_html" }> }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(560);
  const srcDoc = useMemo(() => withResizeBridge(asset.html), [asset.html]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow || !isSimulationHeight(event.data)) return;
      // A sensible floor avoids a layout jump; the reported document size prevents an inner scrollbar.
      setHeight(Math.max(560, Math.min(event.data.height + 2, 2400)));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return <section className="simulation-wrap"><div className="asset-label">MÔ PHỎNG TƯƠNG TÁC</div><h3>{asset.title}</h3><iframe ref={frameRef} title={asset.title} className="simulation-frame" sandbox="allow-scripts" scrolling="no" style={{ height }} srcDoc={srcDoc} /></section>;
}

function isSimulationHeight(value: unknown): value is { type: "studypulse:simulation-height"; height: number } {
  return !!value && typeof value === "object" && (value as { type?: unknown }).type === "studypulse:simulation-height" && typeof (value as { height?: unknown }).height === "number";
}

function withResizeBridge(html: string) {
  const bridge = `<script>\n(() => {\n  const report = () => parent.postMessage({ type: "studypulse:simulation-height", height: Math.ceil(Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)) }, "*");\n  addEventListener("load", report);\n  new ResizeObserver(report).observe(document.documentElement);\n  setTimeout(report, 0);\n})();\n<\\/script>`;
  return html.includes("</body>") ? html.replace("</body>", `${bridge}</body>`) : `${html}${bridge}`;
}

function GeneratedDiagram({ asset }: { asset: Extract<LessonAsset, { kind: "diagram" }> }) {
  if (asset.nodes.length > 5 || asset.edges.length > 5) return <VerticalFlowDiagram asset={asset} />;
  const count = Math.max(asset.nodes.length, 1); const width = Math.max(720, count * 240); const nodeWidth = 180;
  const nodeLines = Object.fromEntries(asset.nodes.map((node) => [node.id, wrapLabel(node.label, 22, 4)]));
  const nodeHeight = Math.max(64, ...Object.values(nodeLines).map((lines) => lines.length * 15 + 25)); const height = 300;
  const positions = Object.fromEntries(asset.nodes.map((node, index) => [node.id, { x: 120 + index * ((width - 240) / Math.max(count - 1, 1)), y: 170 }]));
  return <figure className="generated-diagram"><figcaption><span>DIAGRAM</span><strong>{asset.title}</strong></figcaption><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={asset.title}>
    <defs><marker id={`arrow-${asset.title.replace(/[^a-z0-9]/gi, "")}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" /></marker></defs>
    {asset.edges.map((edge, index) => { const from = positions[edge.from]; const to = positions[edge.to]; if (!from || !to) return null; const marker = `url(#arrow-${asset.title.replace(/[^a-z0-9]/gi, "")})`; const lines = wrapLabel(edge.label, 20, 2); return <g key={`${edge.from}-${edge.to}-${index}`}><line x1={from.x + nodeWidth / 2} y1={from.y} x2={to.x - nodeWidth / 2} y2={to.y} className={edge.style === "dashed" ? "generated-edge dashed" : "generated-edge"} markerEnd={marker} /><text className="generated-edge-label" x={(from.x + to.x) / 2} y={from.y - nodeHeight / 2 - 24 - (lines.length - 1) * 6} textAnchor="middle">{lines.map((line, lineIndex) => <tspan key={lineIndex} x={(from.x + to.x) / 2} dy={lineIndex ? 12 : 0}>{line}</tspan>)}</text></g>; })}
    {asset.nodes.map((node) => { const point = positions[node.id]; const lines = nodeLines[node.id]; return <g key={node.id}><rect x={point.x - nodeWidth / 2} y={point.y - nodeHeight / 2} width={nodeWidth} height={nodeHeight} rx="8" className="generated-node" /><text x={point.x} y={point.y - (lines.length - 1) * 7 + 4} textAnchor="middle" className="generated-node-label">{lines.map((line, lineIndex) => <tspan key={lineIndex} x={point.x} dy={lineIndex ? 15 : 0}>{line}</tspan>)}</text></g>; })}
  </svg></figure>;
}

function VerticalFlowDiagram({ asset }: { asset: Extract<LessonAsset, { kind: "diagram" }> }) {
  const names = Object.fromEntries(asset.nodes.map((node) => [node.id, node.label]));
  const steps = asset.edges.length ? asset.edges.map((edge, index) => ({
    id: `${edge.from}-${edge.to}-${index}`,
    title: edge.label || `Chuyển từ ${names[edge.from] ?? edge.from} sang ${names[edge.to] ?? edge.to}`,
    route: `${names[edge.from] ?? edge.from} → ${names[edge.to] ?? edge.to}`,
    dashed: edge.style === "dashed",
  })) : asset.nodes.map((node, index) => ({ id: node.id, title: node.label, route: index ? "Tiếp tục luồng" : "Bắt đầu", dashed: false }));
  return <figure className="vertical-flow"><figcaption><span>LUỒNG THEO TỪNG BƯỚC</span><strong>{asset.title}</strong><p>Đọc từ trên xuống dưới để theo dõi toàn bộ trình tự.</p></figcaption><ol>{steps.map((step, index) => <li key={step.id}><div className="flow-step-number">{String(index + 1).padStart(2, "0")}</div><div className={step.dashed ? "flow-step-card flow-step-return" : "flow-step-card"}><b>{step.title}</b><small>{step.route}</small></div></li>)}</ol></figure>;
}

function wrapLabel(value: string, maxChars: number, maxLines: number) {
  const words = value.trim().split(/\s+/).filter(Boolean); const lines: string[] = []; let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars || !current) current = next;
    else { lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines.length ? lines : ["Không có nhãn"];
  return [...lines.slice(0, maxLines - 1), `${lines.slice(maxLines - 1).join(" ").slice(0, maxChars - 1)}…`];
}
