import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Compass,
  Download,
  ExternalLink,
  FileText,
  FlaskConical,
  GraduationCap,
  Home,
  KeyRound,
  Lock,
  Printer,
  Save,
  Settings2,
  User,
  Users,
} from "lucide-react";
import {
  externalLearningResources,
  type ChapterIndex,
  type LessonBlock,
  type SubjectKey,
} from "./curriculum";
import { generatedCourseData } from "./generated/courseData";
import "./styles.css";

type ViewMode = "home" | "student" | "parent" | "worksheet";
type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type LessonResponse = { blockId: string; value: string; correct?: boolean; completedAt: string };
type WorksheetAttempt = { chapter: number; answers: Record<string, string>; completedAt?: string };
type EvidenceRecord = {
  id: string;
  subject: SubjectKey;
  chapter: number;
  title: string;
  sourceBlockId?: string;
  createdAt: string;
};
type CourseProgress = {
  currentChapter: number;
  activeBlockId: string;
  lessonResponses: Record<string, LessonResponse>;
  worksheetAttempts: Record<string, WorksheetAttempt>;
  evidence: EvidenceRecord[];
};
type AppState = {
  studentName: string;
  grade: string;
  activeSubject: SubjectKey;
  courses: Record<SubjectKey, CourseProgress>;
  skippedDates: Record<SubjectKey, string[]>;
  subjectDays: Record<SubjectKey, Weekday>;
};

const todayIso = "2026-08-13";
const storageKey = "liam-school-full-course-v1";
const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const generatedSubjects = generatedCourseData.subjects as any;
const generationReport = generatedCourseData.generationReport as any;
const courseCatalog: Record<SubjectKey, { name: string; chapters: ChapterIndex[]; icon: React.ReactNode }> = {
  biology: { name: "Biology", chapters: generatedSubjects.biology.chapters as ChapterIndex[], icon: <FlaskConical size={18} /> },
  geography: { name: "World Geography", chapters: generatedSubjects.geography.chapters as ChapterIndex[], icon: <Compass size={18} /> },
};

const initialState: AppState = {
  studentName: "Liam",
  grade: "9",
  activeSubject: "biology",
  courses: {
    biology: {
      currentChapter: 1,
      activeBlockId: courseCatalog.biology.chapters[0].lessonBlocks[0].id,
      lessonResponses: {},
      worksheetAttempts: {},
      evidence: [],
    },
    geography: {
      currentChapter: 1,
      activeBlockId: courseCatalog.geography.chapters[0].lessonBlocks[0].id,
      lessonResponses: {},
      worksheetAttempts: {},
      evidence: [],
    },
  },
  skippedDates: { biology: [], geography: [] },
  subjectDays: { biology: 2, geography: 4 },
};

function loadState(): AppState {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) || "null") as Partial<AppState> | null;
    if (!saved) return initialState;
    return {
      ...initialState,
      ...saved,
      courses: {
        biology: { ...initialState.courses.biology, ...(saved.courses?.biology ?? {}) },
        geography: { ...initialState.courses.geography, ...(saved.courses?.geography ?? {}) },
      },
      skippedDates: { ...initialState.skippedDates, ...(saved.skippedDates ?? {}) },
      subjectDays: { ...initialState.subjectDays, ...(saved.subjectDays ?? {}) },
    };
  } catch {
    return initialState;
  }
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function chapterKey(subject: SubjectKey, chapter: number) {
  return `${subject}-${chapter}`;
}

function subjectLabel(subject: SubjectKey) {
  return courseCatalog[subject].name;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function getCurrentChapter(state: AppState, subject: SubjectKey) {
  const progress = state.courses[subject];
  return courseCatalog[subject].chapters.find((chapter) => chapter.chapter === progress.currentChapter) ?? courseCatalog[subject].chapters[0];
}

function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [view, setView] = useState<ViewMode>("home");
  const [saved, setSaved] = useState(false);
  const activeSubject = state.activeSubject;
  const currentChapter = getCurrentChapter(state, activeSubject);
  const progress = state.courses[activeSubject];
  const activeBlock = currentChapter.lessonBlocks.find((block) => block.id === progress.activeBlockId) ?? currentChapter.lessonBlocks[0];
  const activeBlockIndex = currentChapter.lessonBlocks.findIndex((block) => block.id === activeBlock.id);
  const worksheetAttempt = progress.worksheetAttempts[chapterKey(activeSubject, currentChapter.chapter)] ?? {
    chapter: currentChapter.chapter,
    answers: {},
  };

  function updateState(updater: (current: AppState) => AppState) {
    setState((current) => {
      const next = updater(current);
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  function saveState() {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  }

  function setActiveSubject(subject: SubjectKey, nextView = view) {
    updateState((current) => ({ ...current, activeSubject: subject }));
    setView(nextView);
  }

  function setActiveBlock(blockId: string) {
    updateState((current) => ({
      ...current,
      courses: {
        ...current.courses,
        [activeSubject]: { ...current.courses[activeSubject], activeBlockId: blockId },
      },
    }));
  }

  function setCurrentChapter(subject: SubjectKey, chapterNumber: number, nextView = view) {
    const chapter = courseCatalog[subject].chapters.find((item) => item.chapter === chapterNumber);
    if (!chapter) return;
    updateState((current) => ({
      ...current,
      activeSubject: subject,
      courses: {
        ...current.courses,
        [subject]: {
          ...current.courses[subject],
          currentChapter: chapter.chapter,
          activeBlockId: chapter.lessonBlocks[0]?.id ?? current.courses[subject].activeBlockId,
        },
      },
    }));
    setView(nextView);
  }

  function saveLessonResponse(block: LessonBlock, value: string) {
    const correct = block.correctAnswer ? value === block.correctAnswer : undefined;
    updateState((current) => {
      const chapter = getCurrentChapter(current, activeSubject);
      const course = current.courses[activeSubject];
      const shouldCreateEvidence = block.kind === "evidence" && value.trim().length > 20;
      const alreadyEvidence = course.evidence.some((item) => item.sourceBlockId === block.id);
      const response: LessonResponse = { blockId: block.id, value, correct, completedAt: todayIso };
      return {
        ...current,
        courses: {
          ...current.courses,
          [activeSubject]: {
            ...course,
            lessonResponses: { ...course.lessonResponses, [block.id]: response },
            evidence:
              shouldCreateEvidence && !alreadyEvidence
                ? [
                    ...course.evidence,
                    {
                      id: makeId("evidence"),
                      subject: activeSubject,
                      chapter: chapter.chapter,
                      title: `${chapter.title}: ${block.title}`,
                      sourceBlockId: block.id,
                      createdAt: todayIso,
                    },
                  ]
                : course.evidence,
          },
        },
      };
    });
  }

  function saveWorksheetAnswer(questionId: string, value: string) {
    updateState((current) => {
      const chapter = getCurrentChapter(current, activeSubject);
      const course = current.courses[activeSubject];
      const key = chapterKey(activeSubject, chapter.chapter);
      const attempt = course.worksheetAttempts[key] ?? { chapter: chapter.chapter, answers: {} };
      return {
        ...current,
        courses: {
          ...current.courses,
          [activeSubject]: {
            ...course,
            worksheetAttempts: {
              ...course.worksheetAttempts,
              [key]: { ...attempt, answers: { ...attempt.answers, [questionId]: value } },
            },
          },
        },
      };
    });
  }

  function completeWorksheet() {
    updateState((current) => {
      const chapter = getCurrentChapter(current, activeSubject);
      const course = current.courses[activeSubject];
      const key = chapterKey(activeSubject, chapter.chapter);
      const attempt = course.worksheetAttempts[key] ?? { chapter: chapter.chapter, answers: {} };
      const evidenceId = `worksheet-${key}`;
      const alreadyEvidence = course.evidence.some((item) => item.id === evidenceId);
      return {
        ...current,
        courses: {
          ...current.courses,
          [activeSubject]: {
            ...course,
            worksheetAttempts: {
              ...course.worksheetAttempts,
              [key]: { ...attempt, completedAt: todayIso },
            },
            evidence: alreadyEvidence
              ? course.evidence
              : [
                  ...course.evidence,
                  {
                    id: evidenceId,
                    subject: activeSubject,
                    chapter: chapter.chapter,
                    title: `${chapter.title}: Core Chapter Worksheet`,
                    createdAt: todayIso,
                  },
                ],
          },
        },
      };
    });
  }

  function exportWorksheet(chapter: ChapterIndex, includeAnswers = false, blank = false) {
    const course = state.courses[chapter.subject];
    const attempt = blank
      ? { chapter: chapter.chapter, answers: {} }
      : course.worksheetAttempts[chapterKey(chapter.subject, chapter.chapter)] ?? { chapter: chapter.chapter, answers: {} };
    const pdf = renderWorksheetPdf(chapter, state, attempt, includeAnswers);
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.studentName}_${subjectLabel(chapter.subject).replace(/\s+/g, "_")}_Chapter_${String(chapter.chapter).padStart(2, "0")}_${includeAnswers ? "Answer_Key" : "Worksheet"}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="identity">
          <div className="mark" aria-hidden="true"><GraduationCap size={28} /></div>
          <div>
            <h1>{state.studentName}'s School App</h1>
            <p>Two courses. Textbooks feed the app behind the scenes.</p>
          </div>
        </div>
        <nav className="top-actions" aria-label="Main navigation">
          <button className={view === "home" ? "active" : ""} onClick={() => setView("home")} type="button"><Home size={17} /> Home</button>
          <button className={view === "student" ? "active" : ""} onClick={() => setView("student")} type="button"><User size={17} /> Student</button>
          <button className={view === "parent" ? "active" : ""} onClick={() => setView("parent")} type="button"><Users size={17} /> Parent</button>
          <button className="save-button" onClick={saveState} type="button"><Save size={17} /> {saved ? "Saved" : "Save"}</button>
        </nav>
      </header>

      <SubjectSwitcher activeSubject={activeSubject} onSelect={(subject) => setActiveSubject(subject, view)} />

      {view === "home" ? <HomeView onParent={() => setView("parent")} onStart={(subject) => setActiveSubject(subject, "student")} state={state} /> : null}
      {view === "student" ? (
        <StudentView
          activeBlock={activeBlock}
          activeBlockIndex={activeBlockIndex}
          chapter={currentChapter}
          onBlockChange={setActiveBlock}
          onSaveLessonResponse={saveLessonResponse}
          onChapterChange={(chapterNumber) => setCurrentChapter(activeSubject, chapterNumber, "student")}
          onExportWorksheet={() => exportWorksheet(currentChapter, false, true)}
          onShowWorksheet={() => setView("worksheet")}
          progress={progress}
          response={progress.lessonResponses[activeBlock.id]}
          state={state}
          worksheetAttempt={worksheetAttempt}
        />
      ) : null}
      {view === "parent" ? (
        <ParentView
          onChapterOpen={(chapter) => {
            setCurrentChapter(chapter.subject, chapter.chapter, "student");
          }}
          onDayChange={(subject, day) => updateState((current) => ({ ...current, subjectDays: { ...current.subjectDays, [subject]: day } }))}
          onExportAnswerKey={(chapter) => exportWorksheet(chapter, true)}
          onExportWorksheet={(chapter) => exportWorksheet(chapter, false, true)}
          state={state}
        />
      ) : null}
      {view === "worksheet" ? (
        <WorksheetView
          attempt={worksheetAttempt}
          chapter={currentChapter}
          onAnswer={saveWorksheetAnswer}
          onBack={() => setView("student")}
          onComplete={completeWorksheet}
          onExportBlank={() => exportWorksheet(currentChapter, false, true)}
          onExportCompleted={() => exportWorksheet(currentChapter)}
          onPrint={() => window.print()}
          state={state}
        />
      ) : null}
    </main>
  );
}

function SubjectSwitcher({ activeSubject, onSelect }: { activeSubject: SubjectKey; onSelect: (subject: SubjectKey) => void }) {
  return (
    <nav className="subject-switcher" aria-label="Subjects">
      {(Object.keys(courseCatalog) as SubjectKey[]).map((subject) => (
        <button className={subject === activeSubject ? "active" : ""} key={subject} onClick={() => onSelect(subject)} type="button">
          {courseCatalog[subject].icon}
          {subjectLabel(subject)}
        </button>
      ))}
    </nav>
  );
}

function HomeView({ onParent, onStart, state }: { state: AppState; onStart: (subject: SubjectKey) => void; onParent: () => void }) {
  const todaySubject: SubjectKey = "geography";
  return (
    <>
      <section className="today-hero">
        <div className="today-copy">
          <span className="eyebrow">TODAY'S SUBJECT</span>
          <h2>{subjectLabel(todaySubject)}</h2>
          <p>{getCurrentChapter(state, todaySubject).bigIdea}</p>
          <div className="hero-actions">
            <button onClick={() => onStart(todaySubject)} type="button">Start {subjectLabel(todaySubject)} <ChevronRight size={18} /></button>
            <button className="secondary" onClick={onParent} type="button"><Settings2 size={18} /> Parent curriculum</button>
          </div>
        </div>
        <div className="today-card">
          <span>Other course</span>
          <strong>Biology</strong>
          <p>Chapter {getCurrentChapter(state, "biology").chapter}: {getCurrentChapter(state, "biology").title}</p>
        </div>
      </section>
      <section className="course-home-grid">
        {(Object.keys(courseCatalog) as SubjectKey[]).map((subject) => {
          const chapter = getCurrentChapter(state, subject);
          const evidence = state.courses[subject].evidence.filter((item) => item.chapter === chapter.chapter).length;
          return (
            <article className={subject === todaySubject ? "course-home-card today" : "course-home-card"} key={subject}>
              <span>{subject === todaySubject ? "Today's subject" : "Course"}</span>
              <h2>{subjectLabel(subject)}</h2>
              <p>Current: Chapter {chapter.chapter} - {chapter.title}</p>
              <p>{chapter.lessonBlocks.length} lesson blocks · {chapter.worksheet.questions.length} worksheet items · {evidence} evidence records</p>
              <button onClick={() => onStart(subject)} type="button">Continue {subjectLabel(subject)}</button>
            </article>
          );
        })}
      </section>
    </>
  );
}

function StudentView({
  activeBlock,
  activeBlockIndex,
  chapter,
  onBlockChange,
  onChapterChange,
  onExportWorksheet,
  onSaveLessonResponse,
  onShowWorksheet,
  progress,
  response,
  state,
  worksheetAttempt,
}: {
  chapter: ChapterIndex;
  activeBlock: LessonBlock;
  activeBlockIndex: number;
  response?: LessonResponse;
  progress: CourseProgress;
  state: AppState;
  worksheetAttempt: WorksheetAttempt;
  onBlockChange: (blockId: string) => void;
  onChapterChange: (chapterNumber: number) => void;
  onSaveLessonResponse: (block: LessonBlock, value: string) => void;
  onShowWorksheet: () => void;
  onExportWorksheet: () => void;
}) {
  const [draft, setDraft] = useState(response?.value ?? "");
  const previous = chapter.lessonBlocks[activeBlockIndex - 1];
  const next = chapter.lessonBlocks[activeBlockIndex + 1];
  const allChapters = courseCatalog[chapter.subject].chapters;
  const chapterIndex = allChapters.findIndex((item) => item.chapter === chapter.chapter);
  const previousChapter = allChapters[chapterIndex - 1];
  const nextChapter = allChapters[chapterIndex + 1];
  const resources = externalLearningResources.filter(
    (resource) => resource.subject === chapter.subject && resource.chapterIds.includes(chapter.chapter) && resource.studentVisible,
  );

  return (
    <section className="workspace single">
      <div className="column main-column">
        <Panel title={`${subjectLabel(chapter.subject)} Chapter ${chapter.chapter}`} icon={courseCatalog[chapter.subject].icon}>
          <div className="chapter-page">
            <div className="chapter-orientation">
              <span className="eyebrow">CURRENT CHAPTER</span>
              <div className="chapter-heading-row">
                <h2>{chapter.title}</h2>
                <label>
                  Chapter
                  <select value={chapter.chapter} onChange={(event) => onChapterChange(Number(event.target.value))}>
                    {allChapters.map((item) => (
                      <option key={item.chapter} value={item.chapter}>
                        {item.chapter}. {item.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p>{chapter.bigIdea}</p>
            </div>
            <details className="chapter-browser">
              <summary>Browse all {subjectLabel(chapter.subject)} chapters</summary>
              <div>
                {allChapters.map((item) => (
                  <button className={item.chapter === chapter.chapter ? "active" : ""} key={item.chapter} onClick={() => onChapterChange(item.chapter)} type="button">
                    Chapter {item.chapter}: {item.title}
                  </button>
                ))}
              </div>
            </details>
            <div className="chapter-material-tabs">
              {chapter.lessonBlocks.map((block, index) => (
                <button
                  className={block.id === activeBlock.id ? "active" : ""}
                  key={block.id}
                  onClick={() => {
                    onBlockChange(block.id);
                    setDraft(progress.lessonResponses[block.id]?.value ?? "");
                  }}
                  type="button"
                >
                  {index + 1}. {block.title}
                </button>
              ))}
            </div>
            <article className={`lesson-card lesson-${activeBlock.kind}`}>
              <header>
                <span className="eyebrow">{activeBlock.kind.toUpperCase()} · BLOCK {activeBlockIndex + 1} OF {chapter.lessonBlocks.length}</span>
                <h3>{activeBlock.title}</h3>
                <p>About {activeBlock.estimatedMinutes} minutes</p>
              </header>
              {activeBlock.learnText ? (
                <div className="learn-text">
                  {activeBlock.learnText.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {activeBlock.keyIdea ? <strong>Key idea: {activeBlock.keyIdea}</strong> : null}
                </div>
              ) : null}
              {activeBlock.visual ? <VisualModel visual={activeBlock.visual} /> : null}
              {activeBlock.prompt ? <ResponseArea block={activeBlock} draft={draft} response={response} setDraft={setDraft} onSave={onSaveLessonResponse} /> : null}
              {resources.length ? <VideoResources resources={resources} /> : null}
            </article>
            <div className="student-controls">
              <button disabled={!previous} onClick={() => previous && onBlockChange(previous.id)} type="button"><ArrowLeft size={18} /> Back</button>
              <button disabled={!next} onClick={() => next && onBlockChange(next.id)} type="button">Next <ChevronRight size={18} /></button>
              <button onClick={onShowWorksheet} type="button"><FileText size={18} /> Chapter worksheet</button>
              <button onClick={onExportWorksheet} type="button"><Download size={18} /> Export worksheet</button>
            </div>
            <div className="chapter-nav">
              <button disabled={!previousChapter} onClick={() => previousChapter && onChapterChange(previousChapter.chapter)} type="button">
                <ArrowLeft size={18} /> Previous Chapter
              </button>
              <span>Chapter {chapterIndex + 1} of {allChapters.length}</span>
              <button disabled={!nextChapter} onClick={() => nextChapter && onChapterChange(nextChapter.chapter)} type="button">
                Next Chapter <ChevronRight size={18} />
              </button>
              {nextChapter ? <p>Next: Chapter {nextChapter.chapter} - {nextChapter.title}</p> : <p>End of available course chapters.</p>}
            </div>
            <ChapterMaterials chapter={chapter} />
            <ChapterGoal chapter={chapter} progress={progress} state={state} worksheetAttempt={worksheetAttempt} />
          </div>
        </Panel>
      </div>
    </section>
  );
}

function ChapterMaterials({ chapter }: { chapter: ChapterIndex & { glossary?: any[]; knowledgeCheck?: any[]; studyGuide?: any } }) {
  return (
    <div className="materials-grid">
      <section>
        <h3>Important words</h3>
        <div className="term-list">
          {(chapter.glossary ?? []).slice(0, 14).map((term) => (
            <details key={term.term}>
              <summary>{term.term}</summary>
              <p>{term.shortDefinition}</p>
              <p>{term.example}</p>
            </details>
          ))}
        </div>
      </section>
      <section>
        <h3>Study guide</h3>
        <div className="study-list">
          <strong>Know this</strong>
          <p>{(chapter.studyGuide?.knowThis ?? chapter.vocabulary ?? []).slice(0, 8).join(", ")}</p>
          <strong>Understand this</strong>
          <p>{(chapter.studyGuide?.understandThis ?? chapter.objectives ?? []).slice(0, 4).join(" ")}</p>
          <strong>Apply this</strong>
          <p>{(chapter.studyGuide?.applyThis ?? []).slice(0, 2).join(" ")}</p>
        </div>
      </section>
      <section>
        <h3>Knowledge check</h3>
        <div className="knowledge-list">
          {(chapter.knowledgeCheck ?? []).slice(0, 6).map((item) => (
            <details key={item.id}>
              <summary>{item.prompt}</summary>
              <p>{item.feedback}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function VideoResources({ resources }: { resources: typeof externalLearningResources }) {
  return (
    <div className="resource-list">
      <h4>Supplemental video</h4>
      {resources.map((resource) => (
        <article key={resource.id}>
          <span>{resource.provider} · {resource.recommended}</span>
          <h5>{resource.title}</h5>
          <p>{resource.description}</p>
          <a href={resource.url} target="_blank" rel="noreferrer">Open lesson <ExternalLink size={14} /></a>
        </article>
      ))}
    </div>
  );
}

function VisualModel({ visual }: { visual: NonNullable<LessonBlock["visual"]> }) {
  return <div className="visual-model"><h4>{visual.title}</h4><div className="visual-grid">{visual.items.map((item) => <span key={item}>{item}</span>)}</div></div>;
}

function ResponseArea({ block, draft, onSave, response, setDraft }: {
  block: LessonBlock;
  draft: string;
  response?: LessonResponse;
  setDraft: (value: string) => void;
  onSave: (block: LessonBlock, value: string) => void;
}) {
  return (
    <div className="response-area">
      <h4>{block.choices ? "Try this" : "Your response"}</h4>
      <p>{block.prompt}</p>
      {block.choices ? (
        <div className="choice-list">{block.choices.map((choice) => <button className={draft === choice ? "selected" : ""} key={choice} onClick={() => setDraft(choice)} type="button">{choice}</button>)}</div>
      ) : <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type Liam's answer here." />}
      <button className="primary-action" disabled={!draft.trim()} onClick={() => onSave(block, draft)} type="button">Save response</button>
      {response ? <p className={response.correct === false ? "feedback warning" : "feedback"}>{response.correct === false ? "Not quite. Try again using the chapter idea." : block.feedback ?? "Response saved."}</p> : null}
    </div>
  );
}

function ChapterGoal({ chapter, progress, worksheetAttempt }: { chapter: ChapterIndex; state: AppState; progress: CourseProgress; worksheetAttempt: WorksheetAttempt }) {
  const actualEvidence = progress.evidence.filter((item) => item.chapter === chapter.chapter);
  const complete = isChapterComplete(chapter, progress);
  return (
    <div className={complete ? "completion-preview complete" : "completion-preview"}>
      <h3>{complete ? `Chapter ${chapter.chapter} complete` : "Today's goal"}</h3>
      <p>{complete ? "Evidence created:" : "By the end of this chapter path, Liam should understand:"}</p>
      <ul>{complete ? actualEvidence.map((item) => <li key={item.id}>{item.title}</li>) : chapter.objectives.slice(0, 4).map((objective) => <li key={objective}>{objective}</li>)}</ul>
      {!complete ? <p>Evidence created so far: {actualEvidence.length} · Worksheet completed: {worksheetAttempt.completedAt ? "Yes" : "Not yet"}</p> : null}
    </div>
  );
}

function ParentView({ onChapterOpen, onDayChange, onExportAnswerKey, onExportWorksheet, state }: {
  state: AppState;
  onDayChange: (subject: SubjectKey, day: Weekday) => void;
  onChapterOpen: (chapter: ChapterIndex) => void;
  onExportAnswerKey: (chapter: ChapterIndex) => void;
  onExportWorksheet: (chapter: ChapterIndex) => void;
}) {
  return (
    <section className="workspace">
      <div className="column main-column">
        <Panel title="Course Setup Status" icon={<Settings2 size={20} />}>
          <div className="setup-grid">
            <StatusLine label="Biology chapters discovered" value={`${generationReport.biology.chaptersDiscovered}`} ok />
            <StatusLine label="Biology chapters ready" value={`${generationReport.biology.chaptersReady}/${generationReport.biology.chaptersProcessed}`} ok={!generationReport.biology.failures.length} />
            <StatusLine label="World Geography chapters discovered" value={`${generationReport.geography.chaptersDiscovered}`} ok />
            <StatusLine label="World Geography chapters ready" value={`${generationReport.geography.chaptersReady}/${generationReport.geography.chaptersProcessed}`} ok={!generationReport.geography.failures.length} />
            <StatusLine label="Known warnings" value={[...generationReport.biology.warnings, ...generationReport.geography.warnings].join("; ") || "None"} ok={!generationReport.biology.warnings.length && !generationReport.geography.warnings.length} />
          </div>
        </Panel>
        {(Object.keys(courseCatalog) as SubjectKey[]).map((subject) => (
          <Panel title={`${subjectLabel(subject)} Course Map`} icon={courseCatalog[subject].icon} key={subject}>
            <div className="course-map">
              {courseCatalog[subject].chapters.map((chapter) => {
                const progress = state.courses[subject];
                const locked = chapter.chapter > progress.currentChapter && !isPreviousComplete(chapter, progress);
                const complete = isChapterComplete(chapter, progress);
                return (
                  <article className={chapter.chapter === progress.currentChapter ? "chapter-row current" : "chapter-row"} key={`${subject}-${chapter.chapter}`}>
                    <div>
                      <span>{complete ? "Complete" : locked ? "Locked" : chapter.chapter === progress.currentChapter ? "Current" : "Upcoming"}</span>
                      <h3>Chapter {chapter.chapter}: {chapter.title}</h3>
                      <p>{chapter.pdf} · {chapter.pageCount} pages · {chapter.sourceStatus}</p>
                    </div>
                    <div className="course-actions">
                      <button onClick={() => onChapterOpen(chapter)} type="button">{locked ? "Inspect / Open" : "Open"}</button>
                      <button onClick={() => onExportWorksheet(chapter)} type="button">Worksheet</button>
                      <button onClick={() => onExportAnswerKey(chapter)} type="button"><KeyRound size={15} /> Key</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </Panel>
        ))}
      </div>
      <div className="column side-column">
        <Panel title="Chapter Inspector" icon={<BookOpen size={20} />}>
          <ChapterInspector chapter={getCurrentChapter(state, state.activeSubject)} />
        </Panel>
        <Panel title="Answer Key" icon={<KeyRound size={20} />}>
          <AnswerKey chapter={getCurrentChapter(state, state.activeSubject)} />
        </Panel>
        <Panel title="Parent Settings" icon={<CalendarDays size={20} />}>
          <div className="rule-list">
            {(Object.keys(courseCatalog) as SubjectKey[]).map((subject) => (
              <label key={subject}>{subjectLabel(subject)} day
                <select value={state.subjectDays[subject]} onChange={(event) => onDayChange(subject, Number(event.target.value) as Weekday)}>
                  {weekdayNames.slice(1, 6).map((day, index) => <option key={day} value={index + 1}>{day}</option>)}
                </select>
              </label>
            ))}
            <p>Study.com resources are supplemental links only. They never replace in-app lessons.</p>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function AnswerKey({ chapter }: { chapter: ChapterIndex }) {
  return <div className="answer-key">{chapter.worksheet.questions.map((question, index) => <article key={question.id}><h3>{index + 1}. {question.prompt}</h3><p>{question.answerKey}</p><span>Source: {question.source.pdf}, page(s) {question.source.pages.join(", ")}</span></article>)}</div>;
}

function StatusLine({ label, ok, value }: { label: string; value: string; ok: boolean }) {
  return <p className={ok ? "status-line ok" : "status-line issue"}><strong>{label}</strong><span>{value}</span></p>;
}

function ChapterInspector({ chapter }: { chapter: ChapterIndex }) {
  return (
    <div className="inspector-list">
      <p><strong>Subject:</strong> {subjectLabel(chapter.subject)}</p>
      <p><strong>PDF:</strong> {chapter.pdf}</p>
      <p><strong>Title:</strong> {chapter.title}</p>
      <p><strong>Pages:</strong> {chapter.pageCount}</p>
      <p><strong>Sections:</strong> {chapter.sections.map((section) => `${section.id} ${section.title}`).join("; ")}</p>
      <p><strong>Objectives:</strong> {chapter.objectives.join("; ")}</p>
      <p><strong>Major concepts:</strong> {chapter.concepts.join("; ")}</p>
      <p><strong>Vocabulary:</strong> {chapter.vocabulary.join(", ")}</p>
      <p><strong>Detected diagrams:</strong> {chapter.diagrams.join("; ")}</p>
      <p><strong>Worksheet status:</strong> {chapter.worksheet.questions.length ? "Core worksheet generated" : "Not generated"}</p>
      <p><strong>Lesson status:</strong> {chapter.lessonBlocks.length ? "Self-contained app lesson generated" : "Not generated"}</p>
    </div>
  );
}

function WorksheetView({ attempt, chapter, onAnswer, onBack, onComplete, onExportBlank, onExportCompleted, onPrint, state }: {
  chapter: ChapterIndex;
  state: AppState;
  attempt: WorksheetAttempt;
  onAnswer: (questionId: string, value: string) => void;
  onBack: () => void;
  onComplete: () => void;
  onExportBlank: () => void;
  onExportCompleted: () => void;
  onPrint: () => void;
}) {
  return (
    <section className="worksheet-page">
      <button className="back-button no-print" onClick={onBack} type="button"><ArrowLeft size={18} /> Back to lesson</button>
      <article className="worksheet-sheet">
        <header>
          <h2>{subjectLabel(chapter.subject)} Chapter {chapter.chapter} Worksheet</h2>
          <div className="worksheet-meta">
            <span>Student: {state.studentName}</span><span>Date: {formatDate(todayIso)}</span><span>Subject: {subjectLabel(chapter.subject)}</span><span>Grade: {state.grade}</span><span>Chapter: {chapter.chapter}</span><span>Chapter Title: {chapter.title}</span>
          </div>
        </header>
        {chapter.worksheet.questions.map((question, index) => <section className="worksheet-prompt" key={question.id}><h3>{index + 1}. {question.prompt}</h3><textarea value={attempt.answers[question.id] ?? ""} onChange={(event) => onAnswer(question.id, event.target.value)} /></section>)}
        <div className="student-controls no-print">
          <button onClick={onComplete} type="button"><CheckCircle2 size={18} /> Mark worksheet complete</button>
          <button onClick={onExportBlank} type="button"><Download size={18} /> Export blank PDF</button>
          <button onClick={onExportCompleted} type="button"><Download size={18} /> Export completed PDF</button>
          <button onClick={onPrint} type="button"><Printer size={18} /> Print</button>
        </div>
      </article>
    </section>
  );
}

function isChapterComplete(chapter: ChapterIndex, progress: CourseProgress) {
  const requiredBlocks = chapter.lessonBlocks.filter((block) => block.requiresResponse);
  const requiredComplete = requiredBlocks.every((block) => {
    const response = progress.lessonResponses[block.id];
    return response && response.value.trim().length > 0 && response.correct !== false;
  });
  const worksheetComplete = Boolean(progress.worksheetAttempts[chapterKey(chapter.subject, chapter.chapter)]?.completedAt);
  return requiredComplete && worksheetComplete;
}

function isPreviousComplete(chapter: ChapterIndex, progress: CourseProgress) {
  const previous = courseCatalog[chapter.subject].chapters.find((item) => item.chapter === chapter.chapter - 1);
  return !previous || isChapterComplete(previous, progress);
}

function renderWorksheetPdf(chapter: ChapterIndex, state: AppState, attempt: WorksheetAttempt, includeAnswers: boolean) {
  const title = `${subjectLabel(chapter.subject)} Chapter ${chapter.chapter} ${includeAnswers ? "Answer Key" : "Worksheet"}`;
  const lines: string[] = [
    title,
    `Student: ${state.studentName}`,
    `Grade: ${state.grade}`,
    `Course: ${subjectLabel(chapter.subject)}`,
    `Chapter: ${chapter.chapter}`,
    `Chapter Title: ${chapter.title}`,
    `Date: ${formatDate(todayIso)}`,
    "",
    chapter.worksheet.title,
    "",
  ];

  chapter.worksheet.questions.forEach((question, index) => {
    lines.push(`${index + 1}. ${question.prompt}`);
    const savedAnswer = attempt.answers[question.id]?.trim();
    if (savedAnswer && !includeAnswers) {
      lines.push(`Answer: ${savedAnswer}`);
    } else if (!includeAnswers) {
      lines.push("Answer:");
      lines.push("____________________________________________________________");
      lines.push("____________________________________________________________");
    }
    if (includeAnswers) {
      lines.push(`Answer key: ${question.answerKey}`);
    }
    lines.push("");
  });

  return makePdf(lines);
}

function makePdf(rawLines: string[]) {
  const pages: string[][] = [[]];
  rawLines.flatMap((line) => wrapPdfLine(cleanPdfText(line), 88)).forEach((line) => {
    const current = pages[pages.length - 1];
    if (current.length >= 48) {
      pages.push([]);
    }
    pages[pages.length - 1].push(line);
  });

  const objects: string[] = [];
  const pageObjectNumbers: number[] = [];
  const fontObjectNumber = 3 + pages.length * 2;

  objects[0] = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  objects[1] = "";

  pages.forEach((pageLines, pageIndex) => {
    const pageObjectNumber = 3 + pageIndex * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    pageObjectNumbers.push(pageObjectNumber);
    const stream = [
      "BT",
      "/F1 11 Tf",
      "50 760 Td",
      "15 TL",
      ...pageLines.map((line) => `(${escapePdfString(line)}) Tj T*`),
      "ET",
    ].join("\n");
    objects[pageObjectNumber - 1] = `${pageObjectNumber} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>\nendobj\n`;
    objects[contentObjectNumber - 1] = `${contentObjectNumber} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`;
  });

  objects[1] = `2 0 obj\n<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj\n`;
  objects[fontObjectNumber - 1] = `${fontObjectNumber} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  let body = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(body.length);
    body += object;
  });
  const xrefOffset = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(body);
}

function cleanPdfText(value: string) {
  return value.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "'").replace(/\s+/g, " ").trim();
}

function escapePdfString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapPdfLine(value: string, maxLength: number) {
  if (!value) return [""];
  const words = value.split(" ");
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <article className="metric"><div>{icon}</div><span>{label}</span><strong>{value}</strong></article>;
}

function Panel({ children, icon, title }: { children: React.ReactNode; icon: React.ReactNode; title: string }) {
  return <section className="panel"><header><div>{icon}<h2>{title}</h2></div></header>{children}</section>;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
