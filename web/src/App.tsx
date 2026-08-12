import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./lib/api";
import type { ClusterStatus, LessonDetail, LessonSummary } from "./types";
import { useProgress } from "./hooks/useProgress";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { LessonView } from "./components/LessonView";
import type { TerminalHandle } from "./components/Terminal";
import { TerminalPanel } from "./components/TerminalPanel";
import { ManifestEditorPanel, type LinkedStep } from "./components/ManifestEditorPanel";
import { Tour, type TourStep } from "./components/Tour";

const TOUR_SEEN_KEY = "lk-tour-seen-v1";

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="brand"]',
    title: "Welcome to PagerDuty Kubernetes Academy",
    body: "17 hands-on lessons, from cluster basics to deploying a real Runbook Automation runner. Every check runs against your actual cluster.",
  },
  {
    selector: '[data-tour="sidebar"]',
    title: "Your lessons",
    body: "Work through these in order, or jump around. Progress is saved automatically in your browser.",
  },
  {
    selector: '[data-tour="cluster-map"]',
    title: "Where things live",
    body: "The same cluster map appears on every lesson, with the part you're about to work on lit up. Lesson 2 walks through the whole thing.",
  },
  {
    selector: '[data-tour="terminal-toggle"]',
    title: "Your real terminal",
    body: "This opens a real terminal wired to your local shell and cluster. Click \"Run\" on any command in a lesson to send it straight here.",
  },
  {
    selector: '[data-tour="manifest-editor-toggle"]',
    title: "Free-form YAML editing",
    body: "Need to write or tweak a Deployment, Service, or other manifest outside a lesson? Open this any time — it applies straight to your k8s-academy namespace.",
  },
  {
    selector: '[data-tour="help"]',
    title: "Need this again?",
    body: "Click here any time to replay this tour.",
  },
];

export default function App() {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [detailCache, setDetailCache] = useState<Record<string, LessonDetail>>({});
  const [status, setStatus] = useState<ClusterStatus | null>(null);
  const [terminalCollapsed, setTerminalCollapsed] = useState(true);
  const [manifestEditorOpen, setManifestEditorOpen] = useState(false);
  const [manifestEditorLink, setManifestEditorLink] = useState<LinkedStep | null>(null);
  const [tourActive, setTourActive] = useState(false);

  const { isStepDone, markStep, lessonProgress, reset } = useProgress();
  const termRef = useRef<TerminalHandle>(null);
  const autoOfferedLessons = useRef(new Set<string>());

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
    if (localStorage.getItem(TOUR_SEEN_KEY)) return;
    const t = setTimeout(() => setTourActive(true), 600);
    return () => clearTimeout(t);
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

  function openManifestEditorForStep(stepId: string) {
    if (!activeLesson) return;
    const step = activeLesson.steps.find((s) => s.id === stepId);
    if (!step || step.kind !== "manifest") return;
    setManifestEditorLink({
      lessonId: activeLesson.id,
      stepId: step.id,
      lessonTitle: activeLesson.title,
      stepTitle: step.title,
      template: step.template,
      hint: step.hint,
    });
    setManifestEditorOpen(true);
  }

  // The first time a lesson with an incomplete YAML step is opened, surface
  // the editor automatically instead of leaving it as a small inline box —
  // long manifests need real editing room. Only offers once per lesson per
  // session, and never yanks the panel away if it's already open for
  // something else.
  useEffect(() => {
    if (!activeLesson) return;
    if (autoOfferedLessons.current.has(activeLesson.id)) return;
    const target = activeLesson.steps.find((s) => s.kind === "manifest" && !isStepDone(activeLesson.id, s.id));
    autoOfferedLessons.current.add(activeLesson.id);
    if (!target || manifestEditorOpen) return;
    openManifestEditorForStep(target.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLesson?.id]);

  function toggleManifestEditor() {
    if (manifestEditorOpen) {
      setManifestEditorOpen(false);
    } else {
      setManifestEditorLink(null);
      setManifestEditorOpen(true);
    }
  }

  async function handleReset() {
    if (!window.confirm("This deletes and recreates the k8s-academy namespace on your cluster, and clears your local progress. Continue?")) {
      return;
    }
    await api.reset();
    reset();
    setDetailCache({});
    window.location.reload();
  }

  function finishTour() {
    setTourActive(false);
    localStorage.setItem(TOUR_SEEN_KEY, "1");
  }

  return (
    <div className="flex h-screen flex-col bg-grid">
      <Header
        status={status}
        percent={overallPercent}
        terminalCollapsed={terminalCollapsed}
        onToggleTerminal={() => setTerminalCollapsed((c) => !c)}
        manifestEditorOpen={manifestEditorOpen}
        onToggleManifestEditor={toggleManifestEditor}
        onOpenTour={() => setTourActive(true)}
        onReset={handleReset}
      />
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
                status={status}
                isStepDone={isStepDone}
                markStep={markStep}
                onRunInTerminal={(cmd) => {
                  setTerminalCollapsed(false);
                  termRef.current?.runCommand(cmd);
                }}
                onOpenManifestEditor={openManifestEditorForStep}
                onNextLesson={() => nextLesson && setActiveId(nextLesson.id)}
                hasNext={!!nextLesson}
                allDone={activeLessonProgress.complete}
              />
            ) : (
              <div className="p-10 text-slate-500">Loading lessons…</div>
            )}
          </div>

          <TerminalPanel
            terminalRef={termRef}
            collapsed={terminalCollapsed}
            onToggleCollapsed={() => setTerminalCollapsed((c) => !c)}
          />
        </div>
      </div>

      <ManifestEditorPanel
        open={manifestEditorOpen}
        onClose={() => setManifestEditorOpen(false)}
        linkedStep={manifestEditorLink}
        onGoFreeform={() => setManifestEditorLink(null)}
        onStepResult={(lessonId, stepId, pass) => markStep(lessonId, stepId, pass)}
      />

      {tourActive && <Tour steps={TOUR_STEPS} onFinish={finishTour} />}
    </div>
  );
}
