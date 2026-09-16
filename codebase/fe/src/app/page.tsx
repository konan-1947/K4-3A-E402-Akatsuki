import Link from "next/link";
import { AppShell } from "../components/app-shell";

export default function Home() {
  return <AppShell active="home" eyebrow="STUDYPULSE · AI20K" title="Mental model workspace">
    <section className="dashboard-hero">
      <div><p className="eyebrow">CHỌN VAI TRÒ</p><h2>Biến tài liệu rời rạc thành một cách hiểu rõ ràng.</h2><p>StudyPulse giúp lab coach duyệt mental model trước khi tạo lesson đa phương tiện cho học viên.</p></div>
      <div className="hero-pulse"><span>✦</span><small>REVIEW · STRUCTURE · TEACH</small></div>
    </section>
    <section className="role-dashboard" aria-label="Chọn không gian làm việc">
      <Link href="/labcoach" className="dashboard-card role-card"><span className="card-icon">✦</span><p className="card-kicker">01 · CONTENT REVIEW</p><h3>Lesson Studio</h3><p>Tạo, duyệt và xuất bản lesson từ tài liệu nguồn.</p><b>Mở workspace <i>→</i></b></Link>
      <Link href="/user" className="dashboard-card role-card"><span className="card-icon">▤</span><p className="card-kicker">02 · LEARNING VIEW</p><h3>Lesson preview</h3><p>Học một concept qua mental model và mô phỏng.</p><b>Mở lesson <i>→</i></b></Link>
    </section>
    <section className="dashboard-note"><span>●</span><p><b>Prototype có kiểm soát.</b> AI tạo bản nháp; lab coach duyệt trước khi người học thấy nội dung.</p></section>
  </AppShell>;
}
