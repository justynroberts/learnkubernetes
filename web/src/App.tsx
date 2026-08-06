import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./lib/api";
import type { ClusterStatus, LessonDetail, LessonSummary } from "./types";
import { useProgress } from "./hooks/useProgress";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { LessonView } from "./components/LessonView";
import { Terminal, type TerminalHandle } from "./components/Terminal";

export default function App() {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [detailCache, setDetailCache] = useState<Record<string, LessonDetail>>({});
  const [status, setStatus] = useState<ClusterStatus | null>(null);
  const [termHeight, setTermHeight] = useState(280);

  const { isStepDone, markStep, lessonProgress, reset } = useProgress();
  const termRef = useRef<TerminalHandle>(null);

  useEffect(() => {
    api.lessons().then((ls) => {
      setLessons(ls);
      setActiveId(ls[0]?.id);
    });
    api.status().then(setStatus);
    const poll = setInterval(() => api.status().then(setStatus), 15000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    if (!activeId || detailCache[activeId]) return;
    api.lesson(activeId).then((d) => setDetailCache((prev) => ({ ...prev, [activeId]: d })));
  }, [activeId, detailCache]);

  const stepCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of lessons) counts[l.id] = detailCache[l.id]?.steps.length ?? 0;
    return counts;
  }, [lessons, detailCache]);

  const overallPercent = useMemo(() => {
    const totals = lessons.map((l) => lessonProgress(l.id, stepCounts[l.id] ?? 0));
    const done = totals.reduce((n, t) => n + t.done, 0);
    const total = totals.reduce((n, t) => n + t.total, 0);
    return total === 0 ? 0 : Math.round((done / total) * 100);
  }, [lessons, stepCounts, lessonProgress]);

  const activeLesson = activeId ? detailCache[activeId] : undefined;
  const activeIndex = lessons.findIndex((l) => l.id === activeId);
  const nextLesson = lessons[activeIndex + 1];
  const activeLessonProgress = activeLesson
    ? lessonProgress(activeLesson.id, activeLesson.steps.length)
    : { done: 0, total: 0, complete: false };

  async function handleReset() {
    if (!window.confirm("This deletes and recreates the k8s-academy namespace on your cluster, and clears your local progress. Continue?")) {
      return;
    }
    await api.reset();
    reset();
    setDetailCache({});
    window.location.reload();
  }

  return (
    <div className="flex h-screen flex-col bg-grid">
      <Header status={status} percent={overallPercent} onReset={handleReset} />
      <div className="flex min-h-0 flex-1">
        <div className="w-64 shrink-0">
          <Sidebar
            lessons={lessons}
            activeId={activeId}
            onSelect={setActiveId}
            progressFor={lessonProgress}
            stepCounts={stepCounts}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {activeLesson ? (
              <LessonView
                lesson={activeLesson}
                isStepDone={isStepDone}
                markStep={markStep}
                onRunInTerminal={(cmd) => termRef.current?.runCommand(cmd)}
                onNextLesson={() => nextLesson && setActiveId(nextLesson.id)}
                hasNext={!!nextLesson}
                allDone={activeLessonProgress.complete}
              />
            ) : (
              <div className="p-10 text-slate-500">Loading lessons…</div>
            )}
          </div>

          <div
            className="shrink-0 border-t border-slate-800 bg-[#0b0e14]"
            style={{ height: termHeight }}
          >
            <div className="flex h-7 items-center justify-between border-b border-slate-800 px-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                terminal · your local shell, real cluster
              </div>
              <div className="flex gap-1 text-xs text-slate-600">
                <button onClick={() => setTermHeight((h) => Math.max(160, h - 80))} className="px-1.5 hover:text-slate-300">
                  −
                </button>
                <button onClick={() => setTermHeight((h) => Math.min(560, h + 80))} className="px-1.5 hover:text-slate-300">
                  +
                </button>
              </div>
            </div>
            <div style={{ height: termHeight - 28 }}>
              <Terminal ref={termRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
