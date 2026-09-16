import Link from "next/link";

export default function Home() {
  return <main className="home-shell">
    <header className="home-top"><span className="brand">StudyPulse<span>·</span></span><span className="top-note">AI20K · PRODUCT DEMO</span></header>
    <section className="role-hero"><p className="eyebrow">MENTAL MODEL STUDIO</p><h1>Biến tài liệu rời rạc<br />thành một cách hiểu rõ ràng.</h1><p>StudyPulse giúp lab coach duyệt mental model trước khi tạo lesson đa phương tiện cho học viên.</p><div className="role-grid"><Link href="/labcoach" className="role-card"><span>01</span><h2>Tôi là<br />Lab coach</h2><p>Tạo, duyệt và xuất bản lesson từ tài liệu nguồn.</p><b>Vào studio →</b></Link><Link href="/user" className="role-card"><span>02</span><h2>Tôi là<br />Học viên</h2><p>Học một concept qua mental model và mô phỏng.</p><b>Mở lesson →</b></Link></div></section>
    <footer className="home-footer"><span>Prototype · mock interaction only</span><span>© StudyPulse</span></footer>
  </main>;
}
