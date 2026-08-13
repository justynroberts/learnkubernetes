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
import { GlossaryPanel } from "./components/GlossaryPanel";
import { Tour, type TourStep } from "./components/Tour";

const TOUR_SEEN_KEY = "lk-tour-seen-v1";

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="brand"]',
    title: "A quick tour of the buttons",
    body: "Thirty seconds, then you're on your own. 17 lessons, every check run against your real cluster.",
  },
  {
    selector: '[data-tour="sidebar"]',
    title: "Your lessons",
    body: "Work down the list. Your progress is saved automatically, and a tick means the check passed on your cluster.",
  },
  {
    selector: '[data-tour="cluster-map"]',
    title: "Where things live",
    body: "Every lesson opens with this map, lit up on the part you're about to work on.",
  },
  {
    selector: '[data-tour="terminal-toggle"]',
    title: "Terminal",
    body: "Opens a real terminal on your machine. Click \"Run\" on any lesson command to send it straight here — or type your own.",
  },
  {
    selector: '[data-tour="manifest-editor-toggle"]',
    title: "YAML Editor",
    body: "Write or tweak any manifest and apply it to your k8s-academy namespace. Lessons that need YAML open this for you.",
  },
  {
    selector: '[data-tour="glossary-toggle"]',
    title: "Glossary",
    body: "Every term in the course, defined in plain words, with a link to the lesson that covers it. Open it mid-exercise.",
  },
  {
    selector: '[data-tour="reset"]',
    title: "Reset course",
    body: "Wipes everything you've built and starts you over. Nothing outside the k8s-academy namespace is touched.",
  },
  {
    selector: '[data-tour="help"]',
    title: "That's it",
    body: "Click here any time to replay this tour. Press Esc to close it.",
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
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);

  const { isStepDone, markStep, lessonProgress, reset } = useProgress();
  const termRef = useRef<TerminalHandle>(null);
  const autoOfferedLessons = useRef(new Set<string>());
  const tourOffered = useRef(false);

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

  // Wait for the first lesson to actually render before starting the tour —
  // on a slow first load its steps would otherwise point at elements that
  // don't exist yet.
  useEffect(() => {
    if (tourOffered.current) return;
    if (localStorage.getItem(TOUR_SEEN_KEY)) return;
    if (!activeLesson) return;
    tourOffered.current = true;
    const t = setTimeout(() => setTourActive(true), 400);
    return () => clearTimeout(t);
  }, [activeLesson]);

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
  // something else. Steps are revealed one at a time, so this only fires when
  // the YAML step is the one actually unlocked — otherwise it would hand over
  // a task the learner isn't meant to see yet.
  useEffect(() => {
    if (!activeLesson) return;
    if (autoOfferedLessons.current.has(activeLesson.id)) return;
    const nextStep = activeLesson.steps.find((s) => !isStepDone(activeLesson.id, s.id));
    autoOfferedLessons.current.add(activeLesson.id);
    if (!nextStep || nextStep.kind !== "manifest" || manifestEditorOpen) return;
    openManifestEditorForStep(nextStep.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLesson?.id]);

  function goToLessonByOrder(order: number) {
    const target = lessons.find((l) => l.order === order);
    if (target) setActiveId(target.id);
  }

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
        glossaryOpen={glossaryOpen}
        onToggleGlossary={() => setGlossaryOpen((v) => !v)}
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
                onGoToLesson={goToLessonByOrder}
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

      <GlossaryPanel
        open={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
        onGoToLesson={goToLessonByOrder}
      />

      {tourActive && <Tour steps={TOUR_STEPS} onFinish={finishTour} />}
    </div>
  );
}
