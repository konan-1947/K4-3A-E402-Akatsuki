"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

type ActivePage = "home" | "studio" | "lesson";

type AppShellProps = {
  active: ActivePage;
  eyebrow: string;
  title: string;
  children: ReactNode;
};

const navigation: Array<{ id: ActivePage; href: string; label: string; icon: string }> = [
  { id: "home", href: "/", label: "Tổng quan", icon: "grid" },
  { id: "studio", href: "/labcoach", label: "Lesson Studio", icon: "spark" },
  { id: "lesson", href: "/user", label: "Lesson preview", icon: "book" },
];

export function AppShell({ active, eyebrow, title, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return <div className="app-shell">
    {menuOpen && <button className="sidebar-backdrop" aria-label="Đóng menu" onClick={() => setMenuOpen(false)} />}
    <aside className={menuOpen ? "app-sidebar is-open" : "app-sidebar"}>
      <Link className="sidebar-brand" href="/" onClick={() => setMenuOpen(false)}><Mark /><span>StudyPulse</span></Link>
      <p className="sidebar-caption">WORKSPACE</p>
      <nav className="sidebar-nav" aria-label="Điều hướng chính">
        {navigation.map((item) => <Link key={item.id} href={item.href} onClick={() => setMenuOpen(false)} className={active === item.id ? "sidebar-link is-active" : "sidebar-link"}>
          <NavIcon name={item.icon} /><span>{item.label}</span>
        </Link>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-help"><span className="help-icon">?</span><div><b>StudyPulse demo</b><small>AI20K · Product Hackathon</small></div></div>
        <div className="sidebar-profile"><span>LC</span><div><b>Lab coach</b><small>Content reviewer</small></div></div>
      </div>
    </aside>
    <section className="app-main">
      <header className="app-header">
        <button className="menu-button" aria-label="Mở menu" onClick={() => setMenuOpen(true)}><i /><i /><i /></button>
        <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>
        <span className="header-status"><i /> Prototype mode</span>
      </header>
      <div className="app-page">{children}</div>
    </section>
  </div>;
}

function Mark() { return <span className="brand-mark" aria-hidden><i /><i /><i /></span>; }

function NavIcon({ name }: { name: string }) {
  if (name === "grid") return <svg viewBox="0 0 24 24" aria-hidden><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
  if (name === "book") return <svg viewBox="0 0 24 24" aria-hidden><path d="M5 4.5h9a3 3 0 0 1 3 3V20H8a3 3 0 0 0-3 1V4.5Z" /><path d="M8 8h6M8 11h6" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" /><path d="m18 16 .7 2.3L21 19l-2.3.7L18 22l-.7-2.3L15 19l2.3-.7L18 16Z" /></svg>;
}
