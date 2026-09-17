"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

export type Upload = { id: string; name: string; type: string; size: string };
export type BlueprintBlock = { id: number; title: string; type: string; content: string; x?: number; y?: number };
type LoadingStep = "mental" | "blueprint" | "lesson" | null;
export type MentalJobStatus = "IDLE" | "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
export type MentalConnection = "LIVE" | "RECONNECTING";
type DemoState = { mentalGenerated: boolean; mentalApproved: boolean; mentalRunId: string | null; mentalStatus: MentalJobStatus; mentalProgress: number; mentalTotal: number; mentalStage: string; mentalError: string | null; mentalPollingError: string | null; mentalConnection: MentalConnection; mentalStartedAt: string | null; mentalLastSeenAt: string | null; blueprintGenerated: boolean; blueprintApproved: boolean; lessonGenerated: boolean; articleEdited: boolean; published: boolean };
type PersistedState = DemoState & { uploads: Upload[]; topicInstruction: string; mentalModel: string; blueprint: BlueprintBlock[]; article: string };
type DemoContextValue = PersistedState & {
  hydrated: boolean; loading: LoadingStep; generate: (step: Exclude<LoadingStep, null>) => void;
  approveMental: () => void; approveBlueprint: () => void; markArticleEdited: () => void; publish: () => void; reset: () => void;
  addFiles: (files: File[]) => void; removeUpload: (id: string) => void; startMentalModel: () => Promise<void>;
  setUploads: Dispatch<SetStateAction<Upload[]>>; setTopicInstruction: Dispatch<SetStateAction<string>>; setMentalModel: Dispatch<SetStateAction<string>>;
  setBlueprint: Dispatch<SetStateAction<BlueprintBlock[]>>; setArticle: Dispatch<SetStateAction<string>>;
};

const STORAGE_KEY = "studypulse:lesson-workflow";
const BACKEND_URL = process.env.NEXT_PUBLIC_BE_URL ?? "http://localhost:8080";
const articleSeed = "<h2>MCP là bộ điều phối có cổng kiểm soát.</h2><p>Khi một AI cần truy cập lịch, tài liệu hay hệ thống nội bộ, rủi ro không nằm ở việc AI có thể gọi tool hay không. Rủi ro nằm ở việc ai định nghĩa tool đó, AI được phép gọi đến đâu và người dùng có nhìn thấy điều gì đang diễn ra hay không.</p><p><strong>Model Context Protocol (MCP)</strong> tạo một giao thức chung để ứng dụng AI kết nối với những năng lực được công bố một cách có cấu trúc.</p><h2>1. Bốn vai trò trong một request</h2><p><strong>Học viên/người dùng</strong> nêu mục tiêu. <strong>AI client</strong> hiểu yêu cầu và quyết định có cần tool hay không. <strong>MCP server</strong> công bố các tool, resource hoặc prompt mà nó hỗ trợ.</p><h2>2. Ví dụ: tìm lịch trống</h2><p>AI client không nên đoán lịch. Client hỏi MCP server những tool đang có, nhận lại mô tả <code>calendar.read</code>, rồi gọi tool này với khoảng thời gian cần đọc.</p><h2>Tóm tắt</h2><p>MCP là cách chuẩn hoá để AI sử dụng đúng năng lực, trong đúng phạm vi và với đường đi có thể kiểm tra.</p>";

export const initialWorkflow: PersistedState = {
  mentalGenerated: false, mentalApproved: false, mentalRunId: null, mentalStatus: "IDLE", mentalProgress: 0, mentalTotal: 0, mentalStage: "IDLE", mentalError: null, mentalPollingError: null, mentalConnection: "LIVE", mentalStartedAt: null, mentalLastSeenAt: null, blueprintGenerated: false, blueprintApproved: false, lessonGenerated: false, articleEdited: false, published: false,
  uploads: [],
  topicInstruction: "",
  mentalModel: "",
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
  const filesRef = useRef<File[]>([]);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      try { const saved = sessionStorage.getItem(STORAGE_KEY); if (saved) setState({ ...initialWorkflow, ...JSON.parse(saved) }); } catch { /* Start fresh when storage is invalid. */ }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);
  useEffect(() => { if (hydrated) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [hydrated, state]);

  useEffect(() => {
    const runId = state.mentalRunId;
    if (!runId || state.mentalGenerated || state.mentalStatus === "FAILED") return;
    let cancelled = false;
    let retryCount = 0;
    let timer: number | undefined;
    let inFlight = false;

    const schedule = (delay: number) => {
      if (!cancelled) timer = window.setTimeout(() => void poll(), delay);
    };

    const poll = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(`${BACKEND_URL}/api/mental-model/runs/${runId}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (response.status === 404) {
          if (!cancelled) setState((current) => ({ ...current, mentalStatus: "FAILED", mentalStage: "FAILED", mentalError: "Job không còn tồn tại trên backend. Bạn có thể chạy lại từ nguồn đã chọn.", mentalPollingError: null, mentalConnection: "LIVE" }));
          return;
        }
        if (!response.ok) throw new Error(`Backend trả về HTTP ${response.status}`);
        const status = await response.json() as { status: MentalJobStatus; completed: number; total: number; stage: string; error: string | null; updatedAt?: string };
        retryCount = 0;
        if (status.status === "SUCCEEDED") {
          const resultResponse = await fetch(`${BACKEND_URL}/api/mental-model/runs/${runId}/result`, { signal: controller.signal, cache: "no-store" });
          if (!resultResponse.ok) throw new Error(`Không lấy được kết quả, HTTP ${resultResponse.status}`);
          const result = await resultResponse.json() as { renderedHtml: string };
          if (!cancelled) {
            setState((current) => ({
              ...current,
              mentalStatus: status.status,
              mentalProgress: status.completed,
              mentalTotal: status.total,
              mentalStage: status.stage,
              mentalError: status.error,
              mentalPollingError: null,
              mentalConnection: "LIVE",
              mentalLastSeenAt: new Date().toISOString(),
              mentalGenerated: true,
              mentalModel: result.renderedHtml,
            }));
          }
          return;
        }
        if (!cancelled) {
          setState((current) => ({ ...current, mentalStatus: status.status, mentalProgress: status.completed, mentalTotal: status.total, mentalStage: status.stage, mentalError: status.error, mentalPollingError: null, mentalConnection: "LIVE", mentalLastSeenAt: new Date().toISOString() }));
        }
        if (status.status !== "FAILED") schedule(1000);
      } catch (error) {
        if (!cancelled) {
          retryCount += 1;
          const message = error instanceof Error && error.name === "AbortError"
            ? "Backend phản hồi chậm hơn dự kiến."
            : error instanceof Error ? error.message : "Không thể kết nối backend.";
          setState((current) => ({ ...current, mentalPollingError: message, mentalConnection: "RECONNECTING" }));
          schedule(Math.min(8000, 1000 * 2 ** Math.min(retryCount - 1, 3)));
        }
      } finally {
        window.clearTimeout(timeout);
        inFlight = false;
      }
    };

    void poll();
    return () => { cancelled = true; if (timer !== undefined) window.clearTimeout(timer); };
  }, [state.mentalRunId, state.mentalGenerated, state.mentalStatus]);

  const generate = useCallback((step: Exclude<LoadingStep, null>) => { if (generationRef.current) return; generationRef.current = step; setLoading(step); window.setTimeout(() => { setState((current) => step === "mental" ? { ...current, mentalGenerated: true } : step === "blueprint" ? { ...current, blueprintGenerated: true } : { ...current, lessonGenerated: true }); generationRef.current = null; setLoading(null); }, 650); }, []);
  const addFiles = useCallback((files: File[]) => {
    filesRef.current = [...filesRef.current, ...files];
    const picked = files.map((file) => ({ id: `${file.name}-${file.lastModified}-${file.size}`, name: file.name, type: file.name.split(".").pop()?.toUpperCase() || "FILE", size: `${Math.max(1, Math.round(file.size / 1024))} KB` }));
    setState((current) => ({ ...current, uploads: [...current.uploads, ...picked], mentalGenerated: false, mentalApproved: false, mentalRunId: null, mentalStatus: "IDLE", mentalProgress: 0, mentalTotal: 0, mentalStage: "IDLE", mentalError: null, mentalPollingError: null, mentalConnection: "LIVE", mentalStartedAt: null, mentalLastSeenAt: null }));
  }, []);
  const removeUpload = useCallback((id: string) => {
    filesRef.current = filesRef.current.filter((file) => `${file.name}-${file.lastModified}-${file.size}` !== id);
    setState((current) => ({ ...current, uploads: current.uploads.filter((item) => item.id !== id), mentalRunId: null, mentalStatus: "IDLE", mentalGenerated: false, mentalApproved: false, mentalPollingError: null, mentalStartedAt: null, mentalLastSeenAt: null }));
  }, []);
  const startMentalModel = useCallback(async () => {
    if (!filesRef.current.length) {
      setState((current) => ({ ...current, mentalStatus: "FAILED", mentalStage: "FAILED", mentalError: "Chưa có file thật để upload" }));
      return;
    }
    const body = new FormData();
    filesRef.current.forEach((file) => body.append("files", file, file.name));
    body.append("topicInstruction", state.topicInstruction);
    setState((current) => ({ ...current, mentalRunId: null, mentalStatus: "QUEUED", mentalStage: "QUEUED", mentalError: null, mentalPollingError: null, mentalConnection: "LIVE", mentalStartedAt: new Date().toISOString(), mentalLastSeenAt: null, mentalGenerated: false, mentalApproved: false }));
    try {
      const response = await fetch(`${BACKEND_URL}/api/mental-model/runs`, { method: "POST", body });
      if (!response.ok) throw new Error(`Upload thất bại, HTTP ${response.status}`);
      const created = await response.json() as { runId: string; status: MentalJobStatus };
      setState((current) => ({ ...current, mentalRunId: created.runId, mentalStatus: created.status, mentalStage: created.status === "QUEUED" ? "QUEUED" : current.mentalStage, mentalLastSeenAt: new Date().toISOString() }));
    } catch (error) {
      setState((current) => ({ ...current, mentalStatus: "FAILED", mentalStage: "FAILED", mentalError: error instanceof Error ? error.message : "Không thể upload file", mentalConnection: "LIVE" }));
    }
  }, [state.topicInstruction]);
  const value = useMemo<DemoContextValue>(() => ({
    ...state, hydrated, loading, generate,
    approveMental: () => setState((current) => ({ ...current, mentalApproved: true })),
    approveBlueprint: () => setState((current) => ({ ...current, blueprintApproved: true })),
    markArticleEdited: () => setState((current) => ({ ...current, articleEdited: true })),
    publish: () => setState((current) => ({ ...current, published: true })),
    reset: () => { sessionStorage.removeItem(STORAGE_KEY); generationRef.current = null; filesRef.current = []; setLoading(null); setState(initialWorkflow); },
    addFiles, removeUpload, startMentalModel,
    setUploads: (update) => setState((current) => ({ ...current, uploads: typeof update === "function" ? update(current.uploads) : update })),
    setTopicInstruction: (update) => setState((current) => ({ ...current, topicInstruction: typeof update === "function" ? update(current.topicInstruction) : update })),
    setMentalModel: (update) => setState((current) => ({ ...current, mentalModel: typeof update === "function" ? update(current.mentalModel) : update })),
    setBlueprint: (update) => setState((current) => ({ ...current, blueprint: typeof update === "function" ? update(current.blueprint) : update })),
    setArticle: (update) => setState((current) => ({ ...current, article: typeof update === "function" ? update(current.article) : update })),
  }), [state, hydrated, loading, generate, addFiles, removeUpload, startMentalModel]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() { const context = useContext(DemoContext); if (!context) throw new Error("useDemo must be used within DemoProvider"); return context; }
