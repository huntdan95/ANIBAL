import type { Messages } from "@/i18n/messages";
import { COVERAGE_LINES, type PrivateDetails } from "@/lib/leads/private";
import { controlClass } from "./form";
import { SubmitButton } from "./SubmitButton";
import { Fold, Notice } from "./ui";

/**
 * Danny-only: coverage lines, estimated premium, commission, private notes.
 * Folded by default; the folded row says what's saved. Opens again right after a save.
 */
export function PrivateDetailsCard({
  priv,
  t,
  save,
  status,
}: {
  priv: PrivateDetails | null;
  t: Messages;
  save: (fd: FormData) => Promise<void>;
  status: "saved" | "error" | null;
}) {
  const p = t.priv;
  const lines = priv?.coverage_lines ?? [];
  const saved = [
    lines.length > 0 && p.parts.lines(lines.length),
    priv?.est_premium != null && p.parts.premium,
    priv?.commission != null && p.parts.commission,
    priv?.notes && p.parts.notes,
  ].filter((x): x is string => Boolean(x));
  return (
    <Fold
      id="solo-usted"
      variant="dashed"
      open={status !== null}
      title={
        <>
          <span aria-hidden>🔒</span> {p.title}
        </>
      }
      hint={saved.length ? p.savedParts(saved) : p.subtitle}
    >
      {status && (
        <div className="mb-3">
          <Notice kind={status === "saved" ? "success" : "error"}>
            {status === "saved" ? p.saved : t.form.failed}
          </Notice>
        </div>
      )}

      <form action={save} className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-base font-semibold text-slate-800">{p.coverage}</legend>
          <div className="flex flex-wrap gap-2">
            {COVERAGE_LINES.map((c) => (
              <label
                key={c}
                className="cursor-pointer rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-white"
              >
                <input
                  type="checkbox"
                  name="coverage"
                  value={c}
                  defaultChecked={lines.includes(c)}
                  className="sr-only"
                />
                {p.lines[c]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <Money name="est_premium" label={p.premium} value={priv?.est_premium} />
          <Money name="commission" label={p.commission} value={priv?.commission} />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-base font-semibold text-slate-800">{p.notes}</span>
          <textarea
            name="notes"
            rows={3}
            maxLength={5000}
            defaultValue={priv?.notes ?? ""}
            className={`${controlClass} border-slate-300 py-2.5`}
          />
        </label>
        <SubmitButton pendingLabel={t.form.saving} variant="secondary" className="w-full">
          {p.save}
        </SubmitButton>
      </form>
    </Fold>
  );
}

function Money({ name, label, value }: { name: string; label: string; value: number | null | undefined }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-base font-semibold text-slate-800">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-500">$</span>
        <input
          name={name}
          inputMode="decimal"
          defaultValue={value != null ? String(value) : ""}
          className={`${controlClass} h-12 border-slate-300 pl-7`}
        />
      </span>
    </label>
  );
}
