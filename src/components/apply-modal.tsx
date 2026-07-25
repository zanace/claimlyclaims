import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Clock, Lock, ShieldCheck, Sparkles, X } from "lucide-react";

type Program = { id: string; name: string; estimate?: string };

type Stage = "review" | "processing" | "preview" | "success";

const STEPS = [
  "Preparing your application...",
  "Filling personal information...",
  "Matching eligibility...",
  "Reviewing answers...",
  "Finalizing...",
];

const INFO_KEY = "claimly.applyInfo";

type Info = {
  fullName: string;
  zip: string;
  householdSize: string;
  incomeRange: string;
};

const DEFAULT_INFO: Info = {
  fullName: "",
  zip: "",
  householdSize: "1",
  incomeRange: "$0 - $20,000",
};

const INCOME_RANGES = [
  "$0 - $20,000",
  "$20,000 - $35,000",
  "$35,000 - $50,000",
  "$50,000 - $75,000",
  "$75,000+",
];

export function ApplyModal({
  program,
  open,
  onClose,
}: {
  program: Program | null;
  open: boolean;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<Stage>("review");
  const [stepIdx, setStepIdx] = useState(0);
  const [info, setInfo] = useState<Info>(DEFAULT_INFO);

  useEffect(() => {
    if (!open) return;
    setStage("review");
    setStepIdx(0);
    try {
      const raw = localStorage.getItem(INFO_KEY);
      if (raw) setInfo({ ...DEFAULT_INFO, ...JSON.parse(raw) });
    } catch {}
  }, [open]);

  useEffect(() => {
    if (stage !== "processing") return;
    setStepIdx(0);
    const t = setInterval(() => {
      setStepIdx((i) => {
        if (i >= STEPS.length - 1) {
          clearInterval(t);
          setTimeout(() => setStage("preview"), 500);
          return i;
        }
        return i + 1;
      });
    }, 750);
    return () => clearInterval(t);
  }, [stage]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !program || typeof document === "undefined") return null;

  const save = (next: Info) => {
    setInfo(next);
    try {
      localStorage.setItem(INFO_KEY, JSON.stringify(next));
    } catch {}
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-overlay-in"
        onClick={stage === "processing" ? undefined : onClose}
      />
      <div
        key={stage}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-border/70 bg-background shadow-[0_40px_100px_-20px_rgba(0,0,0,0.35)] animate-modal-in"
      >
        {stage !== "processing" && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        )}

        {stage === "review" && (
          <ReviewStage
            program={program}
            info={info}
            onContinue={() => setStage("processing")}
          />
        )}
        {stage === "processing" && (
          <ProcessingStage stepIdx={stepIdx} />
        )}
        {stage === "preview" && (
          <PreviewStage
            program={program}
            info={info}
            onChange={save}
            onSubmit={() => setStage("success")}
          />
        )}
        {stage === "success" && <SuccessStage onDone={onClose} />}
      </div>
    </div>,
    document.body,
  );
}

function ReviewStage({
  program,
  info,
  onContinue,
}: {
  program: Program;
  info: Info;
  onContinue: () => void;
}) {
  const rows: Array<[string, string]> = [
    ["Full name", info.fullName || "Not provided yet"],
    ["ZIP code", info.zip || "Not provided yet"],
    ["Household size", info.householdSize || "1"],
    ["Income range", info.incomeRange],
  ];
  return (
    <div className="p-7">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        <Sparkles className="size-3.5" /> Apply with Claimly
      </div>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        {program.name}
      </h2>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="size-3.5" /> Estimated time: {program.estimate ?? "3-5 minutes"}
      </p>

      <div className="mt-5 rounded-2xl border border-border/70 bg-secondary/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Information we'll reuse
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/80">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          No SSN or bank information is required for this demo. Claimly never
          transmits your data to any agency without your explicit review and consent.
        </p>
      </div>

      <button
        onClick={onContinue}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
      >
        Continue
      </button>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        <Lock className="mr-1 inline size-3" /> Private by default. Always free.
      </p>
    </div>
  );
}

function ProcessingStage({ stepIdx }: { stepIdx: number }) {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto mb-6 size-14 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      <p className="text-base font-medium text-foreground transition-opacity duration-300">
        {STEPS[stepIdx]}
      </p>
      <div className="mx-auto mt-6 flex max-w-xs justify-center gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
              i <= stepIdx ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Please don't close this window.
      </p>
    </div>
  );
}

function PreviewStage({
  program,
  info,
  onChange,
  onSubmit,
}: {
  program: Program;
  info: Info;
  onChange: (i: Info) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="max-h-[85vh] overflow-y-auto p-7">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        <Sparkles className="size-3.5" /> Application preview
      </div>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        {program.name}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Review the details Claimly prepared. Edit anything before submitting.
      </p>

      <div className="mt-6 grid gap-3">
        <Field
          label="Full name"
          value={info.fullName}
          placeholder="e.g. Jordan Rivera"
          onChange={(v) => onChange({ ...info, fullName: v })}
        />
        <Field
          label="ZIP code"
          value={info.zip}
          placeholder="00000"
          onChange={(v) => onChange({ ...info, zip: v.replace(/\D/g, "").slice(0, 5) })}
          inputMode="numeric"
        />
        <Field
          label="Household size"
          value={info.householdSize}
          placeholder="1"
          onChange={(v) => onChange({ ...info, householdSize: v.replace(/\D/g, "").slice(0, 2) })}
          inputMode="numeric"
        />
        <div>
          <label className="text-xs font-medium text-muted-foreground">Income range</label>
          <select
            value={info.incomeRange}
            onChange={(e) => onChange({ ...info, incomeRange: e.target.value })}
            className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none"
          >
            {INCOME_RANGES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={onSubmit}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
      >
        Submit Demo
      </button>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Demo only. Nothing is sent to any agency.
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
      />
    </div>
  );
}

function SuccessStage({ onDone }: { onDone: () => void }) {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/10 animate-check-pop">
        <svg
          viewBox="0 0 24 24"
          className="size-10 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12.5l5 5L20 6.5" className="animate-check-draw" />
        </svg>
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
        Application prepared
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Your application has been prepared. In a production version of Claimly,
        this step would securely submit the application after your review and
        explicit consent.
      </p>
      <button
        onClick={onDone}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90"
      >
        <Check className="size-4" /> Done
      </button>
    </div>
  );
}