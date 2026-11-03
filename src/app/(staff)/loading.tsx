// Shown instantly while a staff page loads, so taps feel immediate.
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true">
      <div className="h-9 w-48 rounded-lg bg-slate-200" />
      <div className="h-12 rounded-xl bg-slate-200/80" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="h-5 w-2/3 rounded bg-slate-200" />
          <div className="h-4 w-1/3 rounded bg-slate-100" />
          <div className="h-8 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
