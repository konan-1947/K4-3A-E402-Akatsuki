"use client";

import Link from "next/link";
import { useDemo } from "../../components/demo-provider";
import { AppShell } from "../../components/app-shell";
import { LessonDocument } from "../../components/lesson-document";

export default function UserPage() {
  const demo = useDemo();
  if (!demo.published || !demo.lesson) return <AppShell active="lesson" eyebrow="LEARNER VIEW" title="Lesson preview"><main className="unpublished"><div><p className="eyebrow">LESSON CHƯA XUẤT BẢN</p><h2>Lesson đang được lab coach hoàn thiện.</h2><p>Bản học sẽ xuất hiện ở đây sau khi người duyệt hoàn tất nội dung.</p><Link className="primary-button inline-button" href="/labcoach">Tới workspace →</Link></div></main></AppShell>;
  return <AppShell active="lesson" eyebrow="LEARNER VIEW" title={demo.lesson.title}><main className="lesson-shell"><article className="lesson"><LessonDocument lesson={demo.lesson} /><footer className="lesson-footer"><p>StudyPulse lesson</p><Link href="/labcoach">Quay lại studio ↗</Link></footer></article></main></AppShell>;
}
