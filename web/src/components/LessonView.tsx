import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";
import type { ClusterStatus, LessonDetail, StepDetail } from "../types";
import { StepCard } from "./StepCard";
import { QuizCard } from "./QuizCard";
import { ManifestCard } from "./ManifestCard";
import { ExamCard } from "./ExamCard";
import { ClusterDiagram } from "./ClusterDiagram";
import { focusCaption } from "../lib/clusterFocus";

const MAP_OPEN_KEY = "lk-map-open-v1";

interface Props {
  lesson: LessonDetail;
  status: ClusterStatus | null;
  isStepDone: (lessonId: string, stepId: string) => boolean;
  markStep: (lessonId: string, stepId: string, done: boolean) => void;
  onRunInTerminal: (command: string) => void;
  onOpenManifestEditor: (stepId: string) => void;
  onNextLesson?: () => void;
  hasNext: boolean;
  allDone: boolean;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

/** What to call a step in the "next up" line, without giving its content away. */
function stepKindLabel(step: StepDetail): string {
  if (step.kind === "quiz") return "Quiz";
  if (step.kind === "exam") return "Final exam";
  if (step.kind === "manifest") return "Write a manifest";
  return "Exercise";
}

export function LessonView({
  lesson,
  status,
  isStepDone,
  markStep,
  onRunInTerminal,
  onOpenManifestEditor,
  onNextLesson,
  hasNext,
  allDone,
}: Props) {
  const [mapOpen, setMapOpen] = useState(() => localStorage.getItem(MAP_OPEN_KEY) !== "0");
  const [mapOffscreen, setMapOffscreen] = useState(false);
  /** Completed steps collapse to a line; these are the ones re-opened by hand. */
  const [reopened, setReopened] = useState<Set<string>>(new Set());
  /** Steps finished during this visit stay open — collapsing one the instant it
      passes would snatch away the result message it just showed. */
  const [completedHere, setCompletedHere] = useState<Set<string>>(new Set());

  const mapRef = useRef<HTMLDivElement>(null);
  const activeStepRef = useRef<HTMLDivElement>(null);
  const lastActive = useRef<{ lesson: string; index: number }>({ lesson: "", index: -1 });

  // The first unfinished step is the only one whose content is shown; everything
  // after it stays sealed until it's done.
  const activeIndex = useMemo(() => {
    const i = lesson.steps.findIndex((s) => !isStepDone(lesson.id, s.id));
    return i === -1 ? lesson.steps.length : i;
  }, [lesson, isStepDone]);

  const activeStep = lesson.steps[activeIndex];

  useEffect(() => {
    setReopened(new Set());
    setCompletedHere(new Set());
  }, [lesson.id]);

  function handleMark(stepId: string, done: boolean) {
    markStep(lesson.id, stepId, done);
    if (done) setCompletedHere((prev) => new Set(prev).add(stepId));
  }

  // Keep the map's "you are here" line reachable once the diagram scrolls away.
  useEffect(() => {
    const el = mapRef.current;
    if (!el || !mapOpen) {
      setMapOffscreen(false);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setMapOffscreen(!entry.isIntersecting), {
      threshold: 0.12,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [lesson.id, mapOpen]);

  // When finishing a step unlocks the next one, bring it into view — but never
  // on first opening a lesson, which would scroll straight past the map.
  useEffect(() => {
    const prev = lastActive.current;
    const advanced = prev.lesson === lesson.id && activeIndex > prev.index;
    lastActive.current = { lesson: lesson.id, index: activeIndex };
    if (advanced) {
      activeStepRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [lesson.id, activeIndex]);

  function toggleMap() {
    setMapOpen((open) => {
      localStorage.setItem(MAP_OPEN_KEY, open ? "0" : "1");
      return !open;
    });
  }

  const scrollToActiveStep = useCallback(() => {
    activeStepRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  function scrollToMap() {
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function reopen(stepId: string) {
    setReopened((prev) => new Set(prev).add(stepId));
  }

  /** `index` is the step's position in the lesson, so card numbering matches
      the locked rows and the "step N of M" line. */
  function renderStep(step: StepDetail, index: number) {
    const done = isStepDone(lesson.id, step.id);
    switch (step.kind) {
      case "quiz":
        return (
          <QuizCard
            lessonId={lesson.id}
            step={step}
            done={done}
            onDone={(pass) => handleMark(step.id, pass)}
          />
        );
      case "exam":
        return (
          <ExamCard
            lessonId={lesson.id}
            step={step}
            done={done}
            onDone={(pass) => handleMark(step.id, pass)}
          />
        );
      case "manifest":
        return (
          <ManifestCard
            index={index}
            step={step}
            done={done}
            onOpenEditor={() => onOpenManifestEditor(step.id)}
          />
        );
      default:
        return (
          <StepCard
            lessonId={lesson.id}
            index={index}
            step={step}
            done={done}
            onDone={(pass) => handleMark(step.id, pass)}
            onRunInTerminal={onRunInTerminal}
          />
        );
    }
  }

  return (
    <motion.div
      key={lesson.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-3xl px-8 py-10"
    >
      <div className="mb-1 text-xs font-semibold tracking-widest text-pd-green uppercase">
        Lesson {lesson.order} · {lesson.concept}
      </div>
      <h1 className="mb-4 text-3xl font-bold text-slate-50">{lesson.title}</h1>

      {/* Zero-height sticky rail: the map's caption follows you down the page
          without reserving any layout space of its own. */}
      <div className="sticky top-0 z-20 h-0">
        <AnimatePresence>
          {mapOffscreen && (
            <motion.button
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              onClick={scrollToMap}
              title="Back to the cluster map"
              className="flex w-full items-center gap-2 rounded-b-lg border border-t-0 border-slate-700/60 bg-panel/95 px-3 py-1.5 text-left backdrop-blur"
              style={{ background: "color-mix(in srgb, var(--color-panel) 92%, transparent)" }}
            >
              <span className="shrink-0 text-[10px] font-semibold tracking-widest text-pd-green uppercase">
                You are here
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-slate-400">
                {focusCaption(lesson.focus)}
              </span>
              <span aria-hidden className="shrink-0 text-xs text-slate-600">
                ↑ map
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* The map is denser than the prose, so it breaks out of the reading
          column once there's room for it. */}
      <div className="mb-6 xl:-mx-20" data-tour="cluster-map" ref={mapRef}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
            Where this lives
          </span>
          <button
            onClick={toggleMap}
            aria-expanded={mapOpen}
            aria-label={mapOpen ? "Hide the cluster map" : "Show the cluster map"}
            title={mapOpen ? "Hide the cluster map" : "Show the cluster map"}
            className="btn-pop flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 text-slate-500 hover:border-pd-green/50 hover:text-pd-green-light"
          >
            <motion.svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              animate={{ rotate: mapOpen ? 0 : 180 }}
              transition={{ duration: 0.2 }}
              aria-hidden
            >
              <polyline
                points="2.5,7.5 6,4 9.5,7.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          </button>
        </div>
        <AnimatePresence initial={false}>
          {mapOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <ClusterDiagram focus={lesson.focus} status={status} interactive={lesson.focus === "all"} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Says what's waiting below the fold, and jumps to it. */}
      {activeStep && (
        <motion.button
          onClick={scrollToActiveStep}
          whileHover={{ y: 1 }}
          className="group mb-6 flex w-full items-center gap-3 rounded-lg border border-slate-700/60 px-4 py-2.5 text-left transition-colors hover:border-pd-green/50"
          style={{ background: "var(--color-panel)" }}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pd-green/15 text-[11px] font-bold text-pd-green-light">
            {activeIndex + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
              Next up · step {activeIndex + 1} of {lesson.steps.length}
            </span>
            <span className="block truncate text-sm text-slate-300">
              {stepKindLabel(activeStep)}
              {activeStep.kind !== "quiz" && <span className="text-slate-500"> · {activeStep.title}</span>}
            </span>
          </span>
          <motion.span
            aria-hidden
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="shrink-0 text-slate-500 group-hover:text-pd-green-light"
          >
            ↓
          </motion.span>
        </motion.button>
      )}

      <div className="prose-lesson mb-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.intro}</ReactMarkdown>
      </div>

      <div className="space-y-4">
        {(() => {
          return lesson.steps.map((step, i) => {
            const done = isStepDone(lesson.id, step.id);
            const isActive = i === activeIndex;
            const locked = i > activeIndex;

            if (locked) {
              return (
                <div
                  key={step.id}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-slate-800 px-5 py-3.5"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800/80 text-[11px] font-bold text-slate-600">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-600">
                    {stepKindLabel(step)} — unlocks when you finish step {i}
                  </span>
                  <span aria-hidden className="ml-auto text-slate-700">
                    🔒
                  </span>
                </div>
              );
            }

            // Finished steps fold down to a single line, so the page stays
            // short and the thing you're actually doing stays on screen.
            if (done && !isActive && !reopened.has(step.id) && !completedHere.has(step.id)) {
              return (
                <button
                  key={step.id}
                  onClick={() => reopen(step.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.03] px-5 py-3 text-left transition-colors hover:border-emerald-500/50"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-slate-900">
                    ✓
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-400">{step.title}</span>
                  <span className="shrink-0 text-xs text-slate-600">Show</span>
                </button>
              );
            }

            return (
              <motion.div
                key={step.id}
                ref={isActive ? activeStepRef : undefined}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                className="scroll-mt-6"
              >
                {renderStep(step, i)}
              </motion.div>
            );
          });
        })()}
      </div>

      {allDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={clsx(
            "mt-8 flex items-center justify-between rounded-xl border px-6 py-5",
            "border-emerald-500/30 bg-emerald-500/10",
          )}
        >
          <div>
            <div className="text-lg font-semibold text-emerald-300">Lesson complete 🎉</div>
            <div className="text-sm text-emerald-400/80">
              Nice work — every check on this page passed on your real cluster.
            </div>
          </div>
          {hasNext && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={onNextLesson}
              className="shrink-0 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400"
            >
              Next lesson →
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
