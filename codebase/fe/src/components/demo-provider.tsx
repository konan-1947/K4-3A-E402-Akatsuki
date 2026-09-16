"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

export type Upload = { id: string; name: string; type: string; size: string };
export type BlueprintBlock = { id: number; title: string; type: string; content: string; x?: number; y?: number };
type LoadingStep = "mental" | "blueprint" | "lesson" | null;
type DemoState = { mentalGenerated: boolean; mentalApproved: boolean; blueprintGenerated: boolean; blueprintApproved: boolean; lessonGenerated: boolean; articleEdited: boolean; published: boolean };
type PersistedState = DemoState & { uploads: Upload[]; topicInstruction: string; mentalModel: string; blueprint: BlueprintBlock[]; article: string };
type DemoContextValue = PersistedState & {
  hydrated: boolean; loading: LoadingStep; generate: (step: Exclude<LoadingStep, null>) => void;
  approveMental: () => void; approveBlueprint: () => void; markArticleEdited: () => void; publish: () => void; reset: () => void;
  setUploads: Dispatch<SetStateAction<Upload[]>>; setTopicInstruction: Dispatch<SetStateAction<string>>; setMentalModel: Dispatch<SetStateAction<string>>;
  setBlueprint: Dispatch<SetStateAction<BlueprintBlock[]>>; setArticle: Dispatch<SetStateAction<string>>;
};

const STORAGE_KEY = "studypulse:lesson-workflow";
const mentalModelSeed = "<p><strong>MCP là bộ điều phối chuẩn hoá.</strong> AI chỉ đi qua những cổng công cụ được khai báo và cho phép.</p><p>Như một lễ tân chỉ chuyển yêu cầu tới đúng bộ phận được phép, kèm theo quy tắc kiểm tra rõ ràng.</p><p>[T1] Architecture · 04:20<br>[S2] Permission boundaries · p.08</p>";
const articleSeed = "<h2>MCP là bộ điều phối có cổng kiểm soát.</h2><p>Khi một AI cần truy cập lịch, tài liệu hay hệ thống nội bộ, rủi ro không nằm ở việc AI có thể gọi tool hay không. Rủi ro nằm ở việc ai định nghĩa tool đó, AI được phép gọi đến đâu và người dùng có nhìn thấy điều gì đang diễn ra hay không.</p><p><strong>Model Context Protocol (MCP)</strong> tạo một giao thức chung để ứng dụng AI kết nối với những năng lực được công bố một cách có cấu trúc.</p><h2>1. Bốn vai trò trong một request</h2><p><strong>Học viên/người dùng</strong> nêu mục tiêu. <strong>AI client</strong> hiểu yêu cầu và quyết định có cần tool hay không. <strong>MCP server</strong> công bố các tool, resource hoặc prompt mà nó hỗ trợ.</p><h2>2. Ví dụ: tìm lịch trống</h2><p>AI client không nên đoán lịch. Client hỏi MCP server những tool đang có, nhận lại mô tả <code>calendar.read</code>, rồi gọi tool này với khoảng thời gian cần đọc.</p><h2>Tóm tắt</h2><p>MCP là cách chuẩn hoá để AI sử dụng đúng năng lực, trong đúng phạm vi và với đường đi có thể kiểm tra.</p>";

export const initialWorkflow: PersistedState = {
  mentalGenerated: false, mentalApproved: false, blueprintGenerated: false, blueprintApproved: false, lessonGenerated: false, articleEdited: false, published: false,
  uploads: [{ id: "transcript", name: "MCP: Client–Server Architecture", type: "TRANSCRIPT", size: "04:20" }, { id: "slide", name: "Tool safety & permission boundaries", type: "SLIDE", size: "p.08–11" }],
  topicInstruction: "",
  mentalModel: mentalModelSeed,
  blueprint: [
    { id: 1, title: "Mental model", type: "text + image", content: "<p>Đặt khung tư duy trung tâm trước khi đi vào chi tiết.</p>" },
    { id: 2, title: "Luồng MCP", type: "sequence diagram", content: "<p>Client kết nối server, khám phá tool rồi gọi đúng phạm vi.</p>" },
    { id: 3, title: "Ví dụ: xem lịch", type: "text", content: "<p>Một yêu cầu lịch đi qua tool <code>calendar.read</code>.</p>" },
    { id: 4, title: "Mô phỏng", type: "interactive diagram", content: "<p>Hiện dần message của sequence diagram theo từng nút bấm.</p>" },
    { id: 5, title: "Checkpoint", type: "question", content: "<p>Kiểm tra nguyên tắc quyền tối thiểu.</p>" },
  ],
  article: articleSeed,
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(initialWorkflow);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState<LoadingStep>(null);
  const generationRef = useRef<LoadingStep>(null);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      try { const saved = sessionStorage.getItem(STORAGE_KEY); if (saved) setState({ ...initialWorkflow, ...JSON.parse(saved) }); } catch { /* Start fresh when storage is invalid. */ }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);
  useEffect(() => { if (hydrated) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [hydrated, state]);

  const generate = useCallback((step: Exclude<LoadingStep, null>) => { if (generationRef.current) return; generationRef.current = step; setLoading(step); window.setTimeout(() => { setState((current) => step === "mental" ? { ...current, mentalGenerated: true } : step === "blueprint" ? { ...current, blueprintGenerated: true } : { ...current, lessonGenerated: true }); generationRef.current = null; setLoading(null); }, 650); }, []);
  const value = useMemo<DemoContextValue>(() => ({
    ...state, hydrated, loading, generate,
    approveMental: () => setState((current) => ({ ...current, mentalApproved: true })),
    approveBlueprint: () => setState((current) => ({ ...current, blueprintApproved: true })),
    markArticleEdited: () => setState((current) => ({ ...current, articleEdited: true })),
    publish: () => setState((current) => ({ ...current, published: true })),
    reset: () => { sessionStorage.removeItem(STORAGE_KEY); generationRef.current = null; setLoading(null); setState(initialWorkflow); },
    setUploads: (update) => setState((current) => ({ ...current, uploads: typeof update === "function" ? update(current.uploads) : update })),
    setTopicInstruction: (update) => setState((current) => ({ ...current, topicInstruction: typeof update === "function" ? update(current.topicInstruction) : update })),
    setMentalModel: (update) => setState((current) => ({ ...current, mentalModel: typeof update === "function" ? update(current.mentalModel) : update })),
    setBlueprint: (update) => setState((current) => ({ ...current, blueprint: typeof update === "function" ? update(current.blueprint) : update })),
    setArticle: (update) => setState((current) => ({ ...current, article: typeof update === "function" ? update(current.article) : update })),
  }), [state, hydrated, loading, generate]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() { const context = useContext(DemoContext); if (!context) throw new Error("useDemo must be used within DemoProvider"); return context; }
