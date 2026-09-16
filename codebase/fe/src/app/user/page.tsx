"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemo } from "../../components/demo-provider";

const messages = [
  { from: 0, to: 1, label: "“Lịch trống chiều mai?”" },
  { from: 1, to: 2, label: "tools/list" },
  { from: 2, to: 1, label: "calendar.read" },
  { from: 1, to: 2, label: "tools/call(calendar.read)" },
  { from: 2, to: 3, label: "read availability" },
  { from: 3, to: 1, label: "available slots" },
];
const lanes = ["Học viên", "AI Client", "MCP Server", "Calendar Tool"];

export default function UserPage() {
  const demo = useDemo();
  const [step, setStep] = useState(-1);
  const [answer, setAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const correct = answer === "B";
  if (!demo.published) return <main className="unpublished"><Link className="brand" href="/">StudyPulse<span>·</span>learn</Link><div><p className="eyebrow">LESSON CHƯA XUẤT BẢN</p><h1>Lesson đang được lab coach hoàn thiện.</h1><Link className="primary-button inline-button" href="/labcoach">Tới workspace →</Link></div></main>;
  return <main className="lesson-shell"><header className="topbar gray-band"><Link className="brand" href="/">StudyPulse<span>·</span>learn</Link><nav><Link href="/labcoach">Studio ↗</Link><button className="text-button" onClick={demo.reset}>Reset</button></nav></header><article className="lesson">
    <header className="lesson-hero"><p className="eyebrow">MCP FUNDAMENTALS · 12 PHÚT</p><h1>MCP và nguyên tắc sử dụng</h1><div className="lesson-meta"><span>Lab coach approved</span><span>·</span><span>2 sources</span></div></header>
    <section className="lesson-section"><p className="section-number">01 — MENTAL MODEL</p><h2>MCP là bộ điều phối có cổng kiểm soát.</h2><p>MCP chuẩn hoá cách ứng dụng AI khám phá năng lực được công bố, gửi yêu cầu đúng phạm vi và nhận lại kết quả có thể kiểm tra.</p><div className="image-placeholder gray-band"><span>IMAGE PLACEHOLDER</span><strong>AI đứng trước các cổng công cụ, mỗi cổng có nhãn quyền truy cập.</strong></div></section>
    <section className="lesson-section"><p className="section-number">02 — MCP SEQUENCE</p><h2>Xem một request đi qua hệ thống.</h2><div className="guide-inline gray-band"><b>Cách dùng</b><span>Nhấn từng bước để hiện message mới trên sequence diagram.</span></div><SequenceDiagram step={step} /><div className="diagram-controls"><button className="secondary-button" disabled={step < 0} onClick={() => setStep((value) => value - 1)}>← Quay lại</button><button className="secondary-button" onClick={() => setStep(-1)}>Reset</button><button className="primary-button" disabled={step === messages.length - 1} onClick={() => setStep((value) => value + 1)}>{step < 0 ? "Bắt đầu" : "Bước tiếp →"}</button></div></section>
    <section className="lesson-section"><p className="section-number">03 — NGUYÊN TẮC</p><h2>Chỉ dùng đúng năng lực được cho phép.</h2><div className="principle-grid"><div><b>01</b><h3>Quyền tối thiểu</h3><p>Chỉ công bố đúng tool và tham số cần thiết.</p></div><div><b>02</b><h3>Ý định rõ ràng</h3><p>Xin xác nhận trước hành động có tác động.</p></div><div><b>03</b><h3>Truy vết được</h3><p>Giữ lại nguồn của câu trả lời.</p></div></div></section>
    <section className="lesson-section checkpoint"><p className="section-number">04 — CHECKPOINT</p><h2>Chọn hành động phù hợp.</h2><p>MCP server chỉ công bố <code>calendar.read</code>.</p><div className="options">{[["A", "AI tự gửi email xác nhận cuộc họp."], ["B", "Đọc lịch rồi đề xuất khung giờ trống."], ["C", "AI xoá lịch cũ để tạo chỗ trống."]].map(([key, label]) => <label className={answer === key ? "option selected" : "option"} key={key}><input type="radio" name="checkpoint" checked={answer === key} onChange={() => { setAnswer(key); setSubmitted(false); }} /><span>{key}</span>{label}</label>)}</div><button className="primary-button" disabled={!answer} onClick={() => setSubmitted(true)}>Kiểm tra →</button>{submitted && <div className={correct ? "feedback correct" : "feedback incorrect"}><b>{correct ? "Đúng rồi." : "Chưa đúng."}</b><p>{correct ? "calendar.read chỉ đọc dữ liệu trong phạm vi đã công bố." : "Quyền tối thiểu nghĩa là chỉ gọi đúng tool và hành động được cho phép."}</p></div>}</section>
    <footer className="lesson-footer"><p>StudyPulse lesson</p><Link href="/labcoach">Quay lại studio ↗</Link></footer>
  </article></main>;
}

function SequenceDiagram({ step }: { step: number }) {
  const width = 720; const positions = [90, 270, 450, 630];
  return <div className="sequence-wrap"><svg className="sequence-diagram" viewBox={`0 0 ${width} 505`} role="img" aria-label="MCP sequence diagram">
    <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="currentColor" /></marker></defs>
    {lanes.map((lane, index) => <g key={lane}><rect x={positions[index] - 64} y="16" width="128" height="36" rx="3" className="lane-box" /><text x={positions[index]} y="39" textAnchor="middle" className="lane-label">{lane}</text><line x1={positions[index]} y1="52" x2={positions[index]} y2="492" className="lifeline" /></g>)}
    {messages.slice(0, step + 1).map((message, index) => { const y = 96 + index * 60; const from = positions[message.from]; const to = positions[message.to]; const isBack = to < from; return <g className="sequence-message" key={message.label}><line x1={from} y1={y} x2={to} y2={y} markerEnd="url(#arrow)" className={isBack ? "return-line" : "message-line"} /><text x={(from + to) / 2} y={y - 9} textAnchor="middle">{message.label}</text></g>; })}
    {step < 0 && <text x={width / 2} y="275" textAnchor="middle" className="diagram-empty">Nhấn Bắt đầu để xem luồng MCP.</text>}
  </svg></div>;
}
