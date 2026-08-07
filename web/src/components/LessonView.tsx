import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { LessonDetail } from "../types";
import { StepCard } from "./StepCard";
import { QuizCard } from "./QuizCard";
import { ManifestCard } from "./ManifestCard";

interface Props {
  lesson: LessonDetail;
  isStepDone: (lessonId: string, stepId: string) => boolean;
  markStep: (lessonId: string, stepId: string, done: boolean) => void;
  onRunInTerminal: (command: string) => void;
  onNextLesson?: () => void;
  hasNext: boolean;
  allDone: boolean;
}

export function LessonView({ lesson, isStepDone, markStep, onRunInTerminal, onNextLesson, hasNext, allDone }: Props) {
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
      <h1 className="mb-5 text-3xl font-bold text-slate-50">{lesson.title}</h1>

      <div className="prose-lesson mb-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.intro}</ReactMarkdown>
      </div>

      <div className="space-y-4">
        {(() => {
          let taskIndex = -1;
          return lesson.steps.map((step) => {
            if (step.kind === "quiz") {
              return (
                <QuizCard
                  key={step.id}
                  lessonId={lesson.id}
                  step={step}
                  done={isStepDone(lesson.id, step.id)}
                  onDone={(pass) => markStep(lesson.id, step.id, pass)}
                />
              );
            }
            taskIndex += 1;
            if (step.kind === "manifest") {
              return (
                <ManifestCard
                  key={step.id}
                  lessonId={lesson.id}
                  index={taskIndex}
                  step={step}
                  done={isStepDone(lesson.id, step.id)}
                  onDone={(pass) => markStep(lesson.id, step.id, pass)}
                />
              );
            }
            return (
              <StepCard
                key={step.id}
                lessonId={lesson.id}
                index={taskIndex}
                step={step}
                done={isStepDone(lesson.id, step.id)}
                onDone={(pass) => markStep(lesson.id, step.id, pass)}
                onRunInTerminal={onRunInTerminal}
              />
            );
          });
        })()}
      </div>

      {allDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-5"
        >
          <div>
            <div className="text-lg font-semibold text-emerald-300">Lesson complete 🎉</div>
            <div className="text-sm text-emerald-400/80">Nice work — every check on this page passed on your real cluster.</div>
          </div>
          {hasNext && (
            <button
              onClick={onNextLesson}
              className="shrink-0 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400"
            >
              Next lesson →
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
