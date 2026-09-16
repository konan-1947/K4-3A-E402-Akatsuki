"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { BlueprintBlock } from "./demo-provider";

type Point = { x: number; y: number };
type CanvasPan = { x: number; y: number };
type Selected = number | "start" | "end" | null;
type NodeDrag = { target: Selected; offsetX: number; offsetY: number };
type PanDrag = { startX: number; startY: number; startPan: CanvasPan };
const documentSize = { width: 1160, height: 510 };
const card = { width: 166, height: 106 };

// Ported from the reference state-diagram editor: screen coordinates are always
// converted through the current pan/zoom transform before a node is moved.
function canvasPoint(canvas: HTMLDivElement, clientX: number, clientY: number, zoom: number, pan: CanvasPan) {
  const rect = canvas.getBoundingClientRect();
  return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom };
}
function defaultPosition(block: BlueprintBlock, index: number): Point { return { x: block.x ?? 150 + index * 195, y: block.y ?? (index % 2 ? 286 : 90) }; }
function edgeAnchor(from: Point, to: Point, terminal = false): Point {
  const halfW = terminal ? 22 : card.width / 2; const halfH = terminal ? 22 : card.height / 2;
  const dx = to.x - from.x; const dy = to.y - from.y;
  return Math.abs(dx) > Math.abs(dy) ? { x: from.x + (dx > 0 ? halfW : -halfW), y: from.y } : { x: from.x, y: from.y + (dy > 0 ? halfH : -halfH) };
}
function edge(from: Point, to: Point, fromTerminal = false, toTerminal = false) {
  return { start: edgeAnchor(from, to, fromTerminal), end: edgeAnchor(to, from, toTerminal) };
}

export function LearningGraph({ blocks, onUpdateBlock, onViewBlock }: {
  blocks: BlueprintBlock[];
  onUpdateBlock: (id: number, changes: Partial<BlueprintBlock>) => void;
  onViewBlock: (id: number) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Selected>(null);
  const [nodeDrag, setNodeDrag] = useState<NodeDrag | null>(null);
  const [panDrag, setPanDrag] = useState<PanDrag | null>(null);
  const [pan, setPan] = useState<CanvasPan>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [start, setStart] = useState<Point>({ x: 56, y: 255 });
  const [end, setEnd] = useState<Point>({ x: 1104, y: 255 });
  const nodes = useMemo(() => blocks.map((block, index) => { const origin = defaultPosition(block, index); return { block, origin, center: { x: origin.x + card.width / 2, y: origin.y + card.height / 2 } }; }), [blocks]);

  // React's wheel listener may be passive on some touchpad/browser combinations.
  // Use a native non-passive listener so pinch never escapes to page/browser zoom.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const lockWheel = (event: WheelEvent) => {
      event.preventDefault(); event.stopPropagation();
      if (event.ctrlKey) setZoom((value) => Math.max(.5, Math.min(1.6, value * (event.deltaY < 0 ? 1.1 : .9))));
    };
    const lockGesture = (event: Event) => { event.preventDefault(); event.stopPropagation(); };
    viewport.addEventListener("wheel", lockWheel, { passive: false });
    viewport.addEventListener("gesturestart", lockGesture, { passive: false });
    viewport.addEventListener("gesturechange", lockGesture, { passive: false });
    return () => { viewport.removeEventListener("wheel", lockWheel); viewport.removeEventListener("gesturestart", lockGesture); viewport.removeEventListener("gesturechange", lockGesture); };
  }, []);

  useEffect(() => {
    if (!panDrag) return;
    const move = (event: globalThis.PointerEvent) => setPan({ x: panDrag.startPan.x + event.clientX - panDrag.startX, y: panDrag.startPan.y + event.clientY - panDrag.startY });
    const stop = () => setPanDrag(null);
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", stop);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); };
  }, [panDrag]);
  useEffect(() => {
    if (!nodeDrag) return;
    const move = (event: globalThis.PointerEvent) => {
      const viewport = viewportRef.current; if (!viewport) return;
      const point = canvasPoint(viewport, event.clientX, event.clientY, zoom, pan);
      const x = point.x - nodeDrag.offsetX; const y = point.y - nodeDrag.offsetY;
      if (nodeDrag.target === "start") setStart({ x, y });
      else if (nodeDrag.target === "end") setEnd({ x, y });
      else if (typeof nodeDrag.target === "number") onUpdateBlock(nodeDrag.target, { x, y });
    };
    const stop = () => setNodeDrag(null);
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", stop);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); };
  }, [nodeDrag, onUpdateBlock, pan, zoom]);

  const startDrag = (event: PointerEvent<HTMLElement>, target: Selected, origin: Point) => {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    const viewport = viewportRef.current; if (!viewport) return;
    const point = canvasPoint(viewport, event.clientX, event.clientY, zoom, pan);
    setSelected(target); setNodeDrag({ target, offsetX: point.x - origin.x, offsetY: point.y - origin.y });
  };
  const canvasDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button === 2 || event.button === 1) { event.preventDefault(); setPanDrag({ startX: event.clientX, startY: event.clientY, startPan: pan }); return; }
    if (event.button === 0) setSelected(null);
  };
  const resetView = () => { setPan({ x: 0, y: 0 }); setZoom(1); };

  return <section className="learning-editor" aria-label="Learning graph editor">
    <header className="learning-editor-bar"><div><p className="field-label">LEARNING GRAPH EDITOR</p><strong>Drag node · chuột phải hoặc cuộn giữa để pan · Ctrl + lăn chuột để zoom</strong></div><div><button type="button" className="zoom-control" onClick={() => setZoom((value) => Math.max(.5, value - .1))}>−</button><button type="button" className="zoom-readout" onClick={resetView}>{Math.round(zoom * 100)}%</button><button type="button" className="zoom-control" onClick={() => setZoom((value) => Math.min(1.6, value + .1))}>+</button></div></header>
    <div className="learning-workspace"><div className={`learning-canvas-viewport${panDrag ? " is-panning" : ""}`} ref={viewportRef} onPointerDown={canvasDown} onContextMenu={(event) => event.preventDefault()}>
      <div className="learning-canvas learning-canvas-editable" style={{ width: documentSize.width, height: documentSize.height, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
        <svg className="learning-edges" viewBox={`0 0 ${documentSize.width} ${documentSize.height}`} aria-hidden="true"><defs><marker id="learning-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8 z" /></marker></defs>{nodes.length > 0 && (() => { const line = edge(start, nodes[0].center, true); return <line x1={line.start.x} y1={line.start.y} x2={line.end.x} y2={line.end.y} markerEnd="url(#learning-arrow)" />; })()}{nodes.slice(0, -1).map((node, index) => { const line = edge(node.center, nodes[index + 1].center); return <line key={`${node.block.id}-${nodes[index + 1].block.id}`} x1={line.start.x} y1={line.start.y} x2={line.end.x} y2={line.end.y} markerEnd="url(#learning-arrow)" />; })}{nodes.length > 0 && (() => { const line = edge(nodes.at(-1)!.center, end, false, true); return <line x1={line.start.x} y1={line.start.y} x2={line.end.x} y2={line.end.y} markerEnd="url(#learning-arrow)" />; })()}</svg>
        <button type="button" className={`learning-terminal learning-start${selected === "start" ? " is-selected" : ""}`} style={{ left: start.x - 22, top: start.y - 22 }} onPointerDown={(event) => startDrag(event, "start", start)}><i /><span>Bắt đầu</span></button>
        {nodes.map(({ block, origin }, index) => <div className={`learning-node${selected === block.id ? " is-selected" : ""}`} key={block.id} style={{ left: origin.x, top: origin.y }} onPointerDown={(event) => startDrag(event, block.id, origin)}><span>{String(index + 1).padStart(2, "0")}</span><b>{block.title || "Learning block"}</b><small>{block.type || "text"}</small><button className="learning-node-view" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => onViewBlock(block.id)}>Xem ↓</button><i className="node-connector" aria-hidden="true" /></div>)}
        <button type="button" className={`learning-terminal learning-end${selected === "end" ? " is-selected" : ""}`} style={{ left: end.x - 22, top: end.y - 22 }} onPointerDown={(event) => startDrag(event, "end", end)}><i /><span>Kết thúc</span></button>
      </div>
    </div></div>
  </section>;
}
