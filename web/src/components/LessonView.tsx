import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ClusterStatus, LessonDetail } from "../types";
import { StepCard } from "./StepCard";
import { QuizCard } from "./QuizCard";
import { ManifestCard } from "./ManifestCard";
import { ClusterDiagram } from "./ClusterDiagram";

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

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

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

  function toggleMap() {
    setMapOpen((open) => {
      localStorage.setItem(MAP_OPEN_KEY, open ? "0" : "1");
      return !open;
    });
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

      {/* The map is denser than the prose, so it breaks out of the reading
          column once there's room for it. */}
      <div className="mb-6 xl:-mx-20" data-tour="cluster-map">
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

      <div className="prose-lesson mb-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.intro}</ReactMarkdown>
      </div>

      <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-4">
        {(() => {
          let taskIndex = -1;
          return lesson.steps.map((step) => {
            if (step.kind === "quiz") {
              return (
                <motion.div key={step.id} variants={itemVariants}>
                  <QuizCard
                    lessonId={lesson.id}
                    step={step}
                    done={isStepDone(lesson.id, step.id)}
                    onDone={(pass) => markStep(lesson.id, step.id, pass)}
                  />
                </motion.div>
              );
            }
            taskIndex += 1;
            if (step.kind === "manifest") {
              return (
                <motion.div key={step.id} variants={itemVariants}>
                  <ManifestCard
                    index={taskIndex}
                    step={step}
                    done={isStepDone(lesson.id, step.id)}
                    onOpenEditor={() => onOpenManifestEditor(step.id)}
                  />
                </motion.div>
              );
            }
            return (
              <motion.div key={step.id} variants={itemVariants}>
                <StepCard
                  lessonId={lesson.id}
                  index={taskIndex}
                  step={step}
                  done={isStepDone(lesson.id, step.id)}
                  onDone={(pass) => markStep(lesson.id, step.id, pass)}
                  onRunInTerminal={onRunInTerminal}
                />
              </motion.div>
            );
          });
        })()}
      </motion.div>

      {allDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="mt-8 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-5"
        >
          <div>
            <div className="text-lg font-semibold text-emerald-300">Lesson complete 🎉</div>
            <div className="text-sm text-emerald-400/80">Nice work — every check on this page passed on your real cluster.</div>
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
