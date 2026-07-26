import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, FileText, Lock, Pencil, Sparkles,
  ShieldCheck, X,
} from "lucide-react";
import {
  labelFor, loadAnswers, saveAnswers,
  type Answers, type WizardQuestion,
} from "@/lib/applicant-profile";
import {
  minutesSaved, newApplicationId, recordApplication, SMART_FIELDS,
} from "@/lib/smart-profile";
import type { SavedApplication } from "@/lib/smart-profile";
import { openApplicationPdf } from "@/lib/application-pdf";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

type Program = { id: string; name: string; estimate?: string };

type Stage = "confirm" | "review-saved" | "intro" | "questions" | "processing" | "preview" | "success";

type Review = {
  eligibility?: "likely" | "possible" | "unlikely";
  eligibilityNote?: string;
  monthlyBenefit?: string;
  benefitNote?: string;
  sections?: Array<{ title: string; fields: Array<{ id: string; label: string; value: string }> }>;
  nextSteps?: string[];
};

type SavedDoc = { id: string; item: string; created_at: string };

const PROCESSING_STEPS = [
  "Preparing your application...",
  "Filling in your personal information...",
  "Checking eligibility rules...",
  "Reviewing your answers...",
  "Finalizing your application...",
];

function daysAgoLabel(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
}

export function ApplyWizard({
  program,
  open,
  onClose,
}: {
  program: Program | null;
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>("intro");
  const [answers, setAnswers] = useState<Answers>({});
  const [profileSnapshot, setProfileSnapshot] = useState<Answers>({});
  const [submitted, setSubmitted] = useState<SavedApplication | null>(null);
  const [persistToProfile, setPersistToProfile] = useState(true);
  const [changedIds, setChangedIds] = useState<string[]>([]);
  const [questions, setQuestions] = useState<WizardQuestion[]>([]);
  const [intro, setIntro] = useState("");
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [draft, setDraft] = useState("");
  const [stepIdx, setStepIdx] = useState(0);
  const [review, setReview] = useState<Review | null>(null);
  const [docs, setDocs] = useState<SavedDoc[]>([]);
  const [docsReused, setDocsReused] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const known = useMemo(
    () => Object.entries(answers).filter(([, v]) => String(v ?? "").trim()),
    [answers],
  );
  const autoFilled = useMemo(
    () => SMART_FIELDS.filter((f) => String(answers[f.id] ?? "").trim()).length,
    [answers],
  );

  // Load remembered answers + ask the AI which questions still need asking.
  useEffect(() => {
    if (!open || !program) return;
    setQIdx(0);
    setDraft("");
    setReview(null);
    setChangedIds([]);
    setDocsReused(0);
    setPersistToProfile(true);
    const saved = loadAnswers();
    setProfileSnapshot(saved);
    setAnswers(saved);
    const hasSaved = Object.values(saved).some((v) => String(v ?? "").trim());
    setStage(hasSaved ? "confirm" : "intro");
    setLoadingPlan(true);
    fetch("/api/apply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "plan", program, answers: saved }),
    })
      .then((r) => r.json())
      .then((d) => {
        setQuestions(Array.isArray(d.questions) ? d.questions : []);
        setIntro(typeof d.intro === "string" ? d.intro : "");
      })
      .catch(() => setQuestions([]))
      .finally(() => setLoadingPlan(false));
  }, [open, program]);

  // Documents already in the library, so we can offer to reuse them.
  useEffect(() => {
    if (!open || !user?.id) return;
    void supabase
      .from("document_uploads")
      .select("id, item, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setDocs((data as SavedDoc[]) ?? []));
  }, [open, user?.id]);

  useEffect(() => {
    if (stage !== "questions") return;
    const q = questions[qIdx];
    setDraft(q ? (answers[q.id] ?? "") : "");
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, qIdx, questions]);

  const runReview = useCallback(
    (finalAnswers: Answers) => {
      setStage("processing");
      setStepIdx(0);
      fetch("/api/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "review", program, answers: finalAnswers }),
      })
        .then((r) => r.json())
        .then((d) => setReview(d))
        .catch(() => setReview(null));
    },
    [program],
  );

  useEffect(() => {
    if (stage !== "processing") return;
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      if (i < PROCESSING_STEPS.length) setStepIdx(i);
    }, 900);
    return () => clearInterval(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== "processing") return;
    if (!review) return;
    const minimum = setTimeout(() => setStage("preview"), 900 * PROCESSING_STEPS.length);
    return () => clearTimeout(minimum);
  }, [stage, review]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stage !== "processing") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, stage]);

  if (!open || !program || typeof document === "undefined") return null;

  const commit = (next: Answers, persist = true) => {
    setAnswers(next);
    if (persist) saveAnswers(next);
    return next;
  };

  const answerCurrent = (value: string) => {
    const q = questions[qIdx];
    if (!q) return;
    const next = commit({ ...answers, [q.id]: value }, persistToProfile);
    if (qIdx + 1 < questions.length) setQIdx(qIdx + 1);
    else runReview(next);
  };

  const total = questions.length;
  const progress = total ? Math.round((qIdx / total) * 100) : 0;
  const requiredTotal = autoFilled + total;
  const completion = Math.round((autoFilled / SMART_FIELDS.length) * 100);
  const saved = minutesSaved(autoFilled);

  const submit = () => {
    const record: SavedApplication = {
      id: newApplicationId(),
      programId: program.id,
      programName: program.name,
      submittedAt: new Date().toISOString(),
      status: "Submitted",
      estimate: review?.monthlyBenefit,
      answers,
      autoFilled,
      asked: total,
      documentsReused: docsReused,
    };
    recordApplication(record);
    setSubmitted(record);
    setStage("success");
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-overlay-in"
        onClick={stage === "processing" ? undefined : onClose}
      />
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col overflow-hidden border-border/70 bg-background shadow-[0_40px_100px_-20px_rgba(0,0,0,0.35)] sm:h-auto sm:max-h-[92vh] sm:rounded-3xl sm:border animate-modal-in">
        {stage !== "processing" && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        )}

        {stage === "questions" && total > 0 && (
          <div className="h-1 w-full bg-border">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {stage === "confirm" && (
            <ConfirmStage
              knownCount={autoFilled}
              minutes={saved}
              onUse={() => setStage("intro")}
              onReview={() => setStage("review-saved")}
              onFresh={() => {
                setAnswers({});
                setPersistToProfile(false);
                setStage("intro");
              }}
            />
          )}

          {stage === "review-saved" && (
            <ReviewSavedStage
              answers={answers}
              onEdit={(id, value) => commit({ ...answers, [id]: value }, persistToProfile)}
              onDone={() => setStage("intro")}
            />
          )}

          {stage === "intro" && (
            <IntroStage
              program={program}
              intro={intro}
              known={known}
              loading={loadingPlan}
              remaining={total}
              autoFilled={autoFilled}
              requiredTotal={requiredTotal}
              completion={completion}
              minutes={saved}
              docs={docs}
              docsReused={docsReused}
              onReuseDoc={() => setDocsReused((n) => n + 1)}
              onStart={() => (total ? setStage("questions") : runReview(answers))}
            />
          )}

          {stage === "questions" && (
            <QuestionStage
              question={questions[qIdx]}
              index={qIdx}
              total={total}
              draft={draft}
              setDraft={setDraft}
              inputRef={inputRef}
              onBack={() => (qIdx === 0 ? setStage("intro") : setQIdx(qIdx - 1))}
              onAnswer={answerCurrent}
            />
          )}

          {stage === "processing" && <ProcessingStage stepIdx={stepIdx} />}

          {stage === "preview" && (
            <PreviewStage
              program={program}
              review={review}
              answers={answers}
              changedIds={changedIds}
              onEdit={(id, value) => {
                setAnswers((a) => ({ ...a, [id]: value }));
                setChangedIds((ids) =>
                  String(profileSnapshot[id] ?? "") !== value && !ids.includes(id) ? [...ids, id] : ids,
                );
              }}
              onUpdateProfile={() => {
                saveAnswers({ ...loadAnswers(), ...answers });
                setProfileSnapshot({ ...loadAnswers(), ...answers });
                setChangedIds([]);
              }}
              onKeepLocal={() => setChangedIds([])}
              onSubmit={submit}
            />
          )}

          {stage === "success" && (
            <SuccessStage
              program={program}
              review={review}
              autoFilled={autoFilled}
              minutes={saved}
              record={submitted}
              onDone={onClose}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ConfirmStage({
  knownCount, minutes, onUse, onReview, onFresh,
}: {
  knownCount: number;
  minutes: number;
  onUse: () => void;
  onReview: () => void;
  onFresh: () => void;
}) {
  return (
    <div className="p-7 sm:p-9 animate-fade-in">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="size-6" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        We found information from your previous applications.
      </h2>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        Claimly remembers {knownCount} detail{knownCount === 1 ? "" : "s"} you've already given us.
        Reusing them saves about {minutes} minute{minutes === 1 ? "" : "s"} on this application.
      </p>
      <div className="mt-7 grid gap-3">
        <button
          onClick={onUse}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-primary-foreground transition hover:brightness-110"
        >
          Use saved information <ArrowRight className="size-5" />
        </button>
        <button
          onClick={onReview}
          className="w-full rounded-2xl border border-border px-5 py-4 text-base font-medium text-foreground transition hover:bg-secondary"
        >
          Review saved information
        </button>
        <button
          onClick={onFresh}
          className="w-full rounded-2xl px-5 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          Start fresh
        </button>
      </div>
      <SecurityNote />
    </div>
  );
}

function SecurityNote() {
  return (
    <div className="mt-6 flex items-start gap-2 rounded-2xl border border-border/70 bg-secondary/40 p-4 text-sm text-foreground/80">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
      <p>
        Your information is encrypted and stored securely. Claimly only reuses it with your
        permission, and you can edit or delete it at any time.
      </p>
    </div>
  );
}

function ReviewSavedStage({
  answers, onEdit, onDone,
}: {
  answers: Answers;
  onEdit: (id: string, value: string) => void;
  onDone: () => void;
}) {
  const entries = SMART_FIELDS.filter((f) => String(answers[f.id] ?? "").trim());
  return (
    <div className="p-7 sm:p-9 animate-fade-in">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Smart Profile</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">Your saved information</h2>
      <p className="mt-2 text-base text-muted-foreground">Change anything that's out of date. Edits save to your profile.</p>
      <div className="mt-6 grid gap-3">
        {entries.map((f) => (
          <div key={f.id}>
            <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
            <input
              value={answers[f.id] ?? ""}
              onChange={(e) => onEdit(f.id, e.target.value)}
              className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
        ))}
      </div>
      <button
        onClick={onDone}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-primary-foreground transition hover:brightness-110"
      >
        Looks right, continue <ArrowRight className="size-5" />
      </button>
    </div>
  );
}

function IntroStage({
  program, intro, known, loading, remaining, autoFilled, requiredTotal, completion, minutes,
  docs, docsReused, onReuseDoc, onStart,
}: {
  program: Program;
  intro: string;
  known: Array<[string, string]>;
  loading: boolean;
  remaining: number;
  autoFilled: number;
  requiredTotal: number;
  completion: number;
  minutes: number;
  docs: SavedDoc[];
  docsReused: number;
  onReuseDoc: () => void;
  onStart: () => void;
}) {
  const suggestion = docs[0];
  return (
    <div className="p-7 sm:p-9">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Apply with Claimly</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{program.name}</h2>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
        {intro || "We'll ask a few simple questions, one at a time, and fill out the rest for you."}
      </p>
      <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="size-4" /> About {program.estimate ?? "3-5 minutes"}
      </p>

      {autoFilled > 0 && (
        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-base font-semibold text-foreground">
            We've already completed {autoFilled} of {requiredTotal} required fields using your saved
            profile.
          </p>
          <div className="mt-4 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Profile completion</span>
            <span className="text-primary">{completion}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Estimated time saved: <span className="font-semibold text-foreground">{minutes} minutes</span>
          </p>
        </div>
      )}

      {known.length > 0 && (
        <div className="mt-5 rounded-2xl border border-border/70 bg-secondary/30 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
            <CheckCircle2 className="size-4" /> Already filled in for you
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {known.slice(0, 8).map(([id, value]) => (
              <div key={id}>
                <dt className="text-xs text-muted-foreground">{labelFor(id)}</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">You won't be asked these again.</p>
        </div>
      )}

      {suggestion && (
        <div className="mt-5 rounded-2xl border border-border/70 bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <FileText className="size-4 text-primary" />
            We found a {suggestion.item.toLowerCase()} uploaded {daysAgoLabel(suggestion.created_at)}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={onReuseDoc}
              className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
            >
              {docsReused ? "Using existing document" : "Use existing document"}
            </button>
            <a
              href="/vault"
              className="rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
            >
              Upload new version
            </a>
          </div>
        </div>
      )}

      <SecurityNote />

      <button
        onClick={onStart}
        disabled={loading}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? "Getting your application ready..." : (<>Start my application <ArrowRight className="size-5" /></>)}
      </button>
      {!loading && remaining > 0 && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Just {remaining} question{remaining === 1 ? "" : "s"} left to answer.
        </p>
      )}
      <p className="mt-2 text-center text-xs text-muted-foreground">
        <Lock className="mr-1 inline size-3" /> Private by default. Always free.
      </p>
    </div>
  );
}

function QuestionStage({
  question, index, total, draft, setDraft, inputRef, onBack, onAnswer,
}: {
  question?: WizardQuestion;
  index: number;
  total: number;
  draft: string;
  setDraft: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onBack: () => void;
  onAnswer: (value: string) => void;
}) {
  if (!question) return null;
  const isChoice = question.type === "choice" || question.type === "yesno";
  const choices = question.type === "yesno" ? ["Yes", "No"] : (question.choices ?? []);

  return (
    <div key={question.id} className="flex min-h-[420px] flex-col p-7 sm:p-9 animate-fade-in">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Question {index + 1} of {total}
      </p>
      <h2 className="mt-4 text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
        {question.label}
      </h2>
      {question.help && <p className="mt-2 text-base text-muted-foreground">{question.help}</p>}

      <div className="mt-7 flex-1">
        {isChoice ? (
          <div className="grid gap-3">
            {choices.map((c) => (
              <button
                key={c}
                onClick={() => onAnswer(c)}
                className="w-full rounded-2xl border border-border bg-background px-5 py-4 text-left text-base font-medium text-foreground transition hover:border-primary/50 hover:bg-primary/5"
              >
                {c}
              </button>
            ))}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim() || question.optional) onAnswer(draft.trim());
            }}
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) =>
                setDraft(
                  question.type === "zip"
                    ? e.target.value.replace(/\D/g, "").slice(0, 5)
                    : e.target.value,
                )
              }
              inputMode={question.type === "number" || question.type === "zip" || question.type === "money" ? "numeric" : "text"}
              placeholder={question.type === "money" ? "e.g. 2,400" : "Type your answer"}
              className="w-full rounded-2xl border border-border bg-background px-5 py-4 text-lg text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim() && !question.optional}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              Continue <ArrowRight className="size-5" />
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        {question.optional && (
          <button
            onClick={() => onAnswer("")}
            className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Skip this
          </button>
        )}
      </div>
    </div>
  );
}

function ProcessingStage({ stepIdx }: { stepIdx: number }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center p-10 text-center">
      <div className="mb-7 size-16 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      <p key={stepIdx} className="text-lg font-medium text-foreground animate-fade-in">
        {PROCESSING_STEPS[stepIdx]}
      </p>
      <div className="mt-7 flex w-full max-w-xs justify-center gap-1.5">
        {PROCESSING_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= stepIdx ? "bg-primary" : "bg-border"}`}
          />
        ))}
      </div>
      <p className="mt-7 text-sm text-muted-foreground">Please don't close this window.</p>
    </div>
  );
}

const ELIGIBILITY_COPY: Record<string, { label: string; tone: string }> = {
  likely: { label: "Likely eligible", tone: "text-primary" },
  possible: { label: "Possibly eligible", tone: "text-primary" },
  unlikely: { label: "May not qualify", tone: "text-muted-foreground" },
};

function PreviewStage({
  program, review, answers, changedIds, onEdit, onUpdateProfile, onKeepLocal, onSubmit,
}: {
  program: Program;
  review: Review | null;
  answers: Answers;
  changedIds: string[];
  onEdit: (id: string, value: string) => void;
  onUpdateProfile: () => void;
  onKeepLocal: () => void;
  onSubmit: () => void;
}) {
  const sections =
    review?.sections?.length
      ? review.sections
      : [{
          title: "Your application",
          fields: Object.entries(answers).map(([id, value]) => ({ id, label: labelFor(id), value })),
        }];
  const elig = ELIGIBILITY_COPY[review?.eligibility ?? "possible"];

  return (
    <div className="p-7 sm:p-9">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Your application</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{program.name}</h2>
      <p className="mt-2 text-base text-muted-foreground">
        Claimly filled everything in for you. Look it over and change anything that isn't right.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Eligibility estimate</p>
          <p className={`mt-1 text-xl font-semibold ${elig.tone}`}>{elig.label}</p>
          {review?.eligibilityNote && (
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">{review.eligibilityNote}</p>
          )}
        </div>
        <div className="rounded-2xl border border-border/70 bg-secondary/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Estimated benefit</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {review?.monthlyBenefit || "Varies by household"}
          </p>
          {review?.benefitNote && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.benefitNote}</p>
          )}
        </div>
      </div>

      {changedIds.length > 0 && (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 animate-fade-in">
          <p className="text-sm font-medium text-foreground">
            You changed {changedIds.map(labelFor).join(", ")}. Would you like to update your saved
            profile with this new information?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={onUpdateProfile}
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Update profile
            </button>
            <button
              onClick={onKeepLocal}
              className="rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
            >
              Only for this application
            </button>
          </div>
        </div>
      )}

      {sections.map((s) => (
        <div key={s.title} className="mt-6">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Pencil className="size-3.5 text-muted-foreground" /> {s.title}
          </p>
          <div className="mt-3 grid gap-3">
            {s.fields.map((f) => (
              <div key={f.id}>
                <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                <input
                  value={answers[f.id] ?? f.value ?? ""}
                  onChange={(e) => onEdit(f.id, e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground focus:border-primary/60 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {review?.nextSteps?.length ? (
        <div className="mt-6 rounded-2xl border border-border/70 bg-secondary/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">What happens next</p>
          <ul className="mt-3 space-y-2">
            {review.nextSteps.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm text-foreground/85">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {s}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        onClick={onSubmit}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-5 text-lg font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
      >
        Finish my application
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Claimly builds your completed application and shows you exactly how to hand it in. Estimates are approximate.
      </p>
    </div>
  );
}

function SuccessStage({
  program, review, autoFilled, minutes, record, onDone,
}: {
  program: Program;
  review: Review | null;
  autoFilled: number;
  minutes: number;
  record: SavedApplication | null;
  onDone: () => void;
}) {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/10 animate-check-pop">
        <svg viewBox="0 0 24 24" className="size-10 text-primary" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12.5l5 5L20 6.5" className="animate-check-draw" />
        </svg>
      </div>
      <h3 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
        Your {program.name} application is ready
      </h3>
      {review?.monthlyBenefit && (
        <p className="mt-2 text-base font-medium text-primary">
          Estimated benefit: {review.monthlyBenefit}
        </p>
      )}
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
        Your answers are filled into a completed application. Download it, then use the
        step-by-step instructions for your state to hand it in to the agency that runs this
        program.
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        Claimly auto-filled {autoFilled} fields and saved you about {minutes} minutes. Your next
        application will be even faster - find it under My Applications.
      </p>
      <div className="mt-7 flex flex-col items-center gap-3">
        {record && (
          <button
            onClick={() => {
              const ok = openApplicationPdf(record);
              if (!ok) toast.error("Allow pop-ups to download your PDF.");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition hover:brightness-110"
          >
            <FileText className="size-4" /> Download application PDF
          </button>
        )}
        <p className="max-w-sm text-xs text-muted-foreground">
          Opens a print-ready copy. Choose "Save as PDF" to keep it or hand it in.
        </p>
        <button
          onClick={() => setShowGuide(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border px-7 py-3.5 text-base font-semibold transition hover:border-primary"
        >
          <ListChecks className="size-4" /> How to submit it in my state
        </button>
        <button
          onClick={onDone}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-7 py-3.5 text-base font-semibold text-background transition hover:opacity-90"
        >
          <Check className="size-4" /> Done
        </button>
      </div>
      <OfficialGuide
        program={{ id: program.id, name: program.name }}
        open={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </div>
  );
}
