"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

export type Upload = { id: string; name: string; type: string; size: string };
export type BlueprintContentBrief = { overview: string; writing_outline: string[]; learner_action: string; evidence_of_learning: string; checkpoint: string; transition: string; needs_input?: boolean; open_question?: string };
export type BlueprintAssetPlan = { kind: "image" | "diagram" | "simulation_html"; purpose?: string; prompt?: string; composition?: string; required_elements?: string; caption?: string; alt_text?: string; diagram_type?: string; participants?: string; flow?: string; required_labels?: string; initial_state?: string; interface?: string; interactions?: string; feedback?: string; completion_criteria?: string };
export type BlueprintBlock = { id: number | string; title: string; type: string; content: string; content_brief?: BlueprintContentBrief; asset_plan?: BlueprintAssetPlan[]; concept_ids?: string[]; resource_plan?: { type: string; chunk_id?: string; brief?: string; reason?: string }[]; x?: number; y?: number };
export type LessonAsset = { kind: "image_placeholder"; description: string; caption: string } | { kind: "diagram"; title: string; nodes: { id: string; label: string }[]; edges: { from: string; to: string; label: string; style: "solid" | "dashed" }[] } | { kind: "simulation_html"; title: string; html: string };
export type LessonBlock = { blueprint_block_id: string; heading: string; body_html: string; assets: LessonAsset[] };
export type LessonDraft = { title: string; subtitle: string; estimated_minutes: number; blocks: LessonBlock[]; generated_at?: string };
export type LoadingStep = "files" | "upload" | "mental" | "mentalApproval" | "blueprint" | "blueprintSave" | "blueprintApproval" | "lesson" | "publish" | null;
export type MentalJobStatus = "IDLE" | "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
export type MentalConnection = "LIVE" | "RECONNECTING";
type DemoState = { mentalGenerated: boolean; mentalApproved: boolean; mentalRunId: string | null; mentalStatus: MentalJobStatus; mentalProgress: number; mentalTotal: number; mentalStage: string; mentalError: string | null; mentalPollingError: string | null; mentalConnection: MentalConnection; mentalStartedAt: string | null; mentalLastSeenAt: string | null; blueprintGenerated: boolean; blueprintApproved: boolean; blueprintStatus: MentalJobStatus; blueprintStage: string; blueprintError: string | null; lessonGenerated: boolean; lessonStatus: MentalJobStatus; lessonStage: string; lessonError: string | null; articleEdited: boolean; published: boolean };
type PersistedState = DemoState & { uploads: Upload[]; topicInstruction: string; mentalModel: string; mentalModelHtml: string; blueprint: BlueprintBlock[]; blueprintRaw: Record<string, unknown> | null; blueprintEdges: { from: string; to: string; type: string; rationale?: string }[]; article: string; lesson: LessonDraft | null };
type DemoContextValue = PersistedState & {
  hydrated: boolean; loading: LoadingStep; generate: (step: "mental" | "blueprint" | "lesson") => void;
  approveMental: () => Promise<boolean>; approveBlueprint: () => Promise<boolean>; markArticleEdited: () => void; publish: () => Promise<void>; reset: () => void;
  addFiles: (files: File[]) => Promise<void>; removeUpload: (id: string) => void; startMentalModel: () => Promise<boolean>;
  setUploads: Dispatch<SetStateAction<Upload[]>>; setTopicInstruction: Dispatch<SetStateAction<string>>; setMentalModel: Dispatch<SetStateAction<string>>; setMentalModelHtml: Dispatch<SetStateAction<string>>;
  setBlueprint: Dispatch<SetStateAction<BlueprintBlock[]>>; setArticle: Dispatch<SetStateAction<string>>; setLesson: Dispatch<SetStateAction<LessonDraft | null>>; startBlueprint: () => Promise<void>; saveBlueprint: () => Promise<boolean>; startLesson: () => Promise<void>;
};

const STORAGE_KEY = "studypulse:lesson-workflow";
// This value is embedded in the browser bundle at build time. Set
// NEXT_PUBLIC_BE_URL in the deployment environment, not only at runtime.
const BACKEND_URL = (process.env.NEXT_PUBLIC_BE_URL?.trim() || "http://localhost:8080").replace(/\/+$/, "");
const articleSeed = "<h2>MCP là bộ điều phối có cổng kiểm soát.</h2><p>Khi một AI cần truy cập lịch, tài liệu hay hệ thống nội bộ, rủi ro không nằm ở việc AI có thể gọi tool hay không. Rủi ro nằm ở việc ai định nghĩa tool đó, AI được phép gọi đến đâu và người dùng có nhìn thấy điều gì đang diễn ra hay không.</p><p><strong>Model Context Protocol (MCP)</strong> tạo một giao thức chung để ứng dụng AI kết nối với những năng lực được công bố một cách có cấu trúc.</p><h2>1. Bốn vai trò trong một request</h2><p><strong>Học viên/người dùng</strong> nêu mục tiêu. <strong>AI client</strong> hiểu yêu cầu và quyết định có cần tool hay không. <strong>MCP server</strong> công bố các tool, resource hoặc prompt mà nó hỗ trợ.</p><h2>2. Ví dụ: tìm lịch trống</h2><p>AI client không nên đoán lịch. Client hỏi MCP server những tool đang có, nhận lại mô tả <code>calendar.read</code>, rồi gọi tool này với khoảng thời gian cần đọc.</p><h2>Tóm tắt</h2><p>MCP là cách chuẩn hoá để AI sử dụng đúng năng lực, trong đúng phạm vi và với đường đi có thể kiểm tra.</p>";

const text = (value: unknown) => typeof value === "string" ? value : "";
const asHtml = (value: string) => value.includes("<") ? value : value ? `<p>${value}</p>` : "<p></p>";
function contentBrief(block: Record<string, unknown>): BlueprintContentBrief {
  const value = block.content_brief as Record<string, unknown> | undefined;
  return { overview: asHtml(text(value?.overview) || text(block.purpose) || text(block.objective)), writing_outline: Array.isArray(value?.writing_outline) ? value.writing_outline.map(text).filter(Boolean) : [], learner_action: text(value?.learner_action) || text(block.learner_action), evidence_of_learning: text(value?.evidence_of_learning) || text(block.evidence_of_learning), checkpoint: text(value?.checkpoint) || text(block.checkpoint), transition: text(value?.transition) || text(block.transition), needs_input: value?.needs_input === true, open_question: text(value?.open_question) };
}
function assetPlan(block: Record<string, unknown>): BlueprintAssetPlan[] { return Array.isArray(block.asset_plan) ? block.asset_plan.filter((item): item is BlueprintAssetPlan => !!item && typeof item === "object" && ["image", "diagram", "simulation_html"].includes(text((item as Record<string, unknown>).kind))).map((item) => item as BlueprintAssetPlan) : []; }

export const initialWorkflow: PersistedState = {
  mentalGenerated: false, mentalApproved: false, mentalRunId: null, mentalStatus: "IDLE", mentalProgress: 0, mentalTotal: 0, mentalStage: "IDLE", mentalError: null, mentalPollingError: null, mentalConnection: "LIVE", mentalStartedAt: null, mentalLastSeenAt: null, blueprintGenerated: false, blueprintApproved: false, blueprintStatus: "IDLE", blueprintStage: "IDLE", blueprintError: null, lessonGenerated: false, lessonStatus: "IDLE", lessonStage: "IDLE", lessonError: null, articleEdited: false, published: false,
  uploads: [],
  topicInstruction: "",
  mentalModel: "",
  mentalModelHtml: "",
  blueprint: [
    { id: 1, title: "Mental model", type: "text + image", content: "<p>Đặt khung tư duy trung tâm trước khi đi vào chi tiết.</p>" },
    { id: 2, title: "Luồng MCP", type: "sequence diagram", content: "<p>Client kết nối server, khám phá tool rồi gọi đúng phạm vi.</p>" },
    { id: 3, title: "Ví dụ: xem lịch", type: "text", content: "<p>Một yêu cầu lịch đi qua tool <code>calendar.read</code>.</p>" },
    { id: 4, title: "Mô phỏng", type: "interactive diagram", content: "<p>Hiện dần message của sequence diagram theo từng nút bấm.</p>" },
    { id: 5, title: "Checkpoint", type: "question", content: "<p>Kiểm tra nguyên tắc quyền tối thiểu.</p>" },
  ],
  blueprintRaw: null, blueprintEdges: [],
  article: articleSeed,
  lesson: null,
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
          const result = await resultResponse.json() as { renderedHtml: string; mentalModel: unknown };
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
              // Canonical input is JSON; keep it editable/persisted, HTML is only a fallback preview.
              mentalModel: JSON.stringify(result.mentalModel ?? { explanation: result.renderedHtml }, null, 2),
              mentalModelHtml: result.renderedHtml,
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

  const generate = useCallback((step: "mental" | "blueprint" | "lesson") => { if (generationRef.current) return; generationRef.current = step; setLoading(step); window.setTimeout(() => { setState((current) => step === "mental" ? { ...current, mentalGenerated: true } : step === "blueprint" ? { ...current, blueprintGenerated: true } : { ...current, lessonGenerated: true }); generationRef.current = null; setLoading(null); }, 650); }, []);
  const addFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setLoading("files");
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    filesRef.current = [...filesRef.current, ...files];
    const picked = files.map((file) => ({ id: `${file.name}-${file.lastModified}-${file.size}`, name: file.name, type: file.name.split(".").pop()?.toUpperCase() || "FILE", size: `${Math.max(1, Math.round(file.size / 1024))} KB` }));
    setState((current) => ({ ...current, uploads: [...current.uploads, ...picked], mentalGenerated: false, mentalApproved: false, mentalRunId: null, mentalStatus: "IDLE", mentalProgress: 0, mentalTotal: 0, mentalStage: "IDLE", mentalError: null, mentalPollingError: null, mentalConnection: "LIVE", mentalStartedAt: null, mentalLastSeenAt: null }));
    setLoading(null);
  }, []);
  const removeUpload = useCallback((id: string) => {
    filesRef.current = filesRef.current.filter((file) => `${file.name}-${file.lastModified}-${file.size}` !== id);
    setState((current) => ({ ...current, uploads: current.uploads.filter((item) => item.id !== id), mentalRunId: null, mentalStatus: "IDLE", mentalGenerated: false, mentalApproved: false, mentalPollingError: null, mentalStartedAt: null, mentalLastSeenAt: null }));
  }, []);
  const startMentalModel = useCallback(async () => {
    if (!filesRef.current.length) {
      setState((current) => ({ ...current, mentalStatus: "FAILED", mentalStage: "FAILED", mentalError: "Chưa có file thật để upload" }));
      return false;
    }
    const body = new FormData();
    filesRef.current.forEach((file) => body.append("files", file, file.name));
    body.append("topicInstruction", state.topicInstruction);
    setLoading("upload");
    setState((current) => ({ ...current, mentalRunId: null, mentalStatus: "QUEUED", mentalStage: "QUEUED", mentalError: null, mentalPollingError: null, mentalConnection: "LIVE", mentalStartedAt: new Date().toISOString(), mentalLastSeenAt: null, mentalGenerated: false, mentalApproved: false }));
    try {
      const response = await fetch(`${BACKEND_URL}/api/mental-model/runs`, { method: "POST", body });
      if (!response.ok) throw new Error(`Upload thất bại, HTTP ${response.status}`);
      const created = await response.json() as { runId: string; status: MentalJobStatus };
      setState((current) => ({ ...current, mentalRunId: created.runId, mentalStatus: created.status, mentalStage: created.status === "QUEUED" ? "QUEUED" : current.mentalStage, mentalLastSeenAt: new Date().toISOString() }));
      return true;
    } catch (error) {
      setState((current) => ({ ...current, mentalStatus: "FAILED", mentalStage: "FAILED", mentalError: error instanceof Error ? error.message : "Không thể upload file", mentalConnection: "LIVE" }));
      return false;
    } finally { setLoading(null); }
  }, [state.topicInstruction]);
  const startBlueprint = useCallback(async () => {
    if (!state.mentalRunId) return;
    setLoading("blueprint");
    setState((current) => ({ ...current, blueprintApproved: false, blueprintStatus: "QUEUED", blueprintStage: "QUEUED", blueprintError: null, lessonGenerated: false, lesson: null, articleEdited: false, published: false }));
    try {
      const response = await fetch(`${BACKEND_URL}/api/mental-model/runs/${state.mentalRunId}/blueprint`, { method: "POST" });
      // A second mount/navigation can encounter the same active job. Resume it.
      let status: { status: MentalJobStatus; stage?: string; error?: string | null };
      if (response.status === 409) {
        const current = await fetch(`${BACKEND_URL}/api/mental-model/runs/${state.mentalRunId}/blueprint`, { cache: "no-store" });
        if (!current.ok) throw new Error("Blueprint job đang chạy nhưng không thể khôi phục tiến độ.");
        status = await current.json() as { status: MentalJobStatus; stage?: string; error?: string | null };
      } else {
        if (!response.ok) throw new Error(`Không thể tạo blueprint, HTTP ${response.status}`);
        status = await response.json() as { status: MentalJobStatus; stage?: string; error?: string | null };
      }
      setState((current) => ({ ...current, blueprintStatus: status.status, blueprintStage: status.stage ?? status.status, blueprintError: status.error ?? null }));
      for (let tries = 0; status.status === "QUEUED" || status.status === "RUNNING"; tries += 1) {
        if (tries > 90) throw new Error("Tạo blueprint quá thời gian chờ");
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
        const poll = await fetch(`${BACKEND_URL}/api/mental-model/runs/${state.mentalRunId}/blueprint`, { cache: "no-store" });
        if (!poll.ok) throw new Error(`Không lấy được tiến độ blueprint, HTTP ${poll.status}`);
        status = await poll.json() as { status: MentalJobStatus; stage?: string; error?: string | null };
        setState((current) => ({ ...current, blueprintStatus: status.status, blueprintStage: status.stage ?? status.status, blueprintError: status.error ?? null }));
      }
      if (status.status !== "SUCCEEDED") throw new Error(status.error || "Không thể tạo blueprint");
      const draftResponse = await fetch(`${BACKEND_URL}/api/mental-model/runs/${state.mentalRunId}/blueprint/draft`, { cache: "no-store" });
      if (!draftResponse.ok) throw new Error("Không lấy được blueprint draft");
      const raw = await draftResponse.json() as { blocks?: Record<string, unknown>[]; edges?: { from: string; to: string; type: string; rationale?: string }[] };
      const blocks = (raw.blocks ?? []).map((block, index) => { const brief = contentBrief(block); return { ...block, id: String(block.id ?? index + 1), title: String(block.title ?? "Learning block"), type: String(block.type ?? "explanation"), content: brief.overview, content_brief: brief, asset_plan: assetPlan(block), concept_ids: Array.isArray(block.concept_ids) ? block.concept_ids.map(String) : [], resource_plan: Array.isArray(block.resource_plan) ? block.resource_plan as BlueprintBlock["resource_plan"] : [] }; }) as BlueprintBlock[];
      setState((current) => ({ ...current, blueprintGenerated: true, blueprintStatus: "SUCCEEDED", blueprintStage: "DONE", blueprintError: null, blueprint: blocks, blueprintRaw: raw, blueprintEdges: raw.edges ?? [] }));
    } catch (error) { setState((current) => ({ ...current, blueprintStatus: "FAILED", blueprintStage: "FAILED", blueprintError: error instanceof Error ? error.message : "Không thể tạo blueprint" })); }
    finally { setLoading(null); }
  }, [state.mentalRunId]);
  const saveBlueprint = useCallback(async () => {
    if (!state.mentalRunId || !state.blueprintRaw) return false;
    setLoading("blueprintSave");
    const raw = { ...state.blueprintRaw, blocks: state.blueprint.map(({ content, content_brief, ...block }) => ({ ...block, purpose: content, content_brief: { writing_outline: [], learner_action: "", evidence_of_learning: "", checkpoint: "", transition: "", ...content_brief, overview: content } })), edges: state.blueprintEdges };
    try {
      const response = await fetch(`${BACKEND_URL}/api/mental-model/runs/${state.mentalRunId}/blueprint/draft`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(raw) });
      if (!response.ok) { setState((current) => ({ ...current, blueprintError: "Không thể lưu blueprint." })); return false; }
      const report = await response.json() as { valid?: boolean; errors?: string[] };
      const blueprintError = report.valid ? null : (report.errors ?? ["Blueprint chưa đủ dữ liệu để duyệt."]).join(" · ");
      setState((current) => ({ ...current, blueprintError }));
      return true;
    } catch { setState((current) => ({ ...current, blueprintError: "Không thể lưu blueprint." })); return false; }
    finally { setLoading(null); }
  }, [state.mentalRunId, state.blueprintRaw, state.blueprint, state.blueprintEdges]);
  const startLesson = useCallback(async () => {
    if (!state.mentalRunId) return;
    setLoading("lesson");
    setState((current) => ({ ...current, lesson: null, lessonGenerated: false, lessonStatus: "QUEUED", lessonStage: "QUEUED", lessonError: null, articleEdited: false, published: false }));
    try {
      const response = await fetch(`${BACKEND_URL}/api/mental-model/runs/${state.mentalRunId}/blueprint/lesson`, { method: "POST" });
      let status: { status: MentalJobStatus; stage?: string; error?: string | null };
      if (response.status === 409) {
        const current = await fetch(`${BACKEND_URL}/api/mental-model/runs/${state.mentalRunId}/blueprint/lesson`, { cache: "no-store" });
        if (!current.ok) throw new Error("Lesson job đang chạy nhưng không thể khôi phục tiến độ.");
        status = await current.json() as { status: MentalJobStatus; stage?: string; error?: string | null };
      } else {
        if (!response.ok) throw new Error(`Không thể tạo bài viết, HTTP ${response.status}`);
        status = await response.json() as { status: MentalJobStatus; stage?: string; error?: string | null };
      }
      setState((current) => ({ ...current, lessonStatus: status.status, lessonStage: status.stage ?? status.status, lessonError: status.error ?? null }));
      for (let tries = 0; status.status === "QUEUED" || status.status === "RUNNING"; tries += 1) {
        if (tries > 120) throw new Error("Tạo bài viết quá thời gian chờ");
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
        const poll = await fetch(`${BACKEND_URL}/api/mental-model/runs/${state.mentalRunId}/blueprint/lesson`, { cache: "no-store" });
        if (!poll.ok) throw new Error(`Không lấy được tiến độ bài viết, HTTP ${poll.status}`);
        status = await poll.json() as { status: MentalJobStatus; stage?: string; error?: string | null };
        setState((current) => ({ ...current, lessonStatus: status.status, lessonStage: status.stage ?? status.status, lessonError: status.error ?? null }));
      }
      if (status.status !== "SUCCEEDED") throw new Error(status.error || "Không thể tạo bài viết");
      const draftResponse = await fetch(`${BACKEND_URL}/api/mental-model/runs/${state.mentalRunId}/blueprint/lesson/draft`, { cache: "no-store" });
      if (!draftResponse.ok) throw new Error("Không lấy được lesson draft");
      const lesson = await draftResponse.json() as LessonDraft;
      setState((current) => ({ ...current, lesson, lessonGenerated: true, lessonStatus: "SUCCEEDED", lessonStage: "DONE", lessonError: null, articleEdited: false }));
    } catch (error) { setState((current) => ({ ...current, lessonStatus: "FAILED", lessonStage: "FAILED", lessonError: error instanceof Error ? error.message : "Không thể tạo bài viết" })); }
    finally { setLoading(null); }
  }, [state.mentalRunId]);
  const value = useMemo<DemoContextValue>(() => ({
    ...state, hydrated, loading, generate,
    approveMental: async () => { if (!state.mentalRunId) return false; setLoading("mentalApproval"); try { const response = await fetch(`${BACKEND_URL}/api/mental-model/runs/${state.mentalRunId}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: state.mentalModel }); if (!response.ok) throw new Error("Mental model không hợp lệ"); setState((current) => ({ ...current, mentalApproved: true })); return true; } catch (error) { setState((current) => ({ ...current, mentalError: error instanceof Error ? error.message : "Không thể duyệt mental model" })); return false; } finally { setLoading(null); } },
    approveBlueprint: async () => { if (!await saveBlueprint() || !state.mentalRunId) return false; setLoading("blueprintApproval"); try { const response = await fetch(`${BACKEND_URL}/api/mental-model/runs/${state.mentalRunId}/blueprint/approve`, { method: "POST" }); if (response.ok) { setState((current) => ({ ...current, blueprintApproved: true, blueprintError: null })); return true; } const message = await response.text(); setState((current) => ({ ...current, blueprintError: message || "Blueprint chưa đủ dữ liệu để duyệt." })); return false; } catch { setState((current) => ({ ...current, blueprintError: "Không thể duyệt blueprint." })); return false; } finally { setLoading(null); } },
    markArticleEdited: () => setState((current) => ({ ...current, articleEdited: true })),
    publish: async () => { setLoading("publish"); await new Promise<void>((resolve) => window.setTimeout(resolve, 300)); setState((current) => ({ ...current, published: true })); setLoading(null); },
    reset: () => { sessionStorage.removeItem(STORAGE_KEY); generationRef.current = null; filesRef.current = []; setLoading(null); setState(initialWorkflow); },
    addFiles, removeUpload, startMentalModel,
    setUploads: (update) => setState((current) => ({ ...current, uploads: typeof update === "function" ? update(current.uploads) : update })),
    setTopicInstruction: (update) => setState((current) => ({ ...current, topicInstruction: typeof update === "function" ? update(current.topicInstruction) : update })),
    setMentalModel: (update) => setState((current) => ({ ...current, mentalModel: typeof update === "function" ? update(current.mentalModel) : update })),
    setMentalModelHtml: (update) => setState((current) => ({ ...current, mentalModelHtml: typeof update === "function" ? update(current.mentalModelHtml) : update })),
    setBlueprint: (update) => setState((current) => ({ ...current, blueprint: typeof update === "function" ? update(current.blueprint) : update })),
    setArticle: (update) => setState((current) => ({ ...current, article: typeof update === "function" ? update(current.article) : update })),
    setLesson: (update) => setState((current) => ({ ...current, lesson: typeof update === "function" ? update(current.lesson) : update })), startBlueprint, saveBlueprint, startLesson,
  }), [state, hydrated, loading, generate, addFiles, removeUpload, startMentalModel, startBlueprint, saveBlueprint, startLesson]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() { const context = useContext(DemoContext); if (!context) throw new Error("useDemo must be used within DemoProvider"); return context; }
