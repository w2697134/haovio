export default function RedeemSuccessLoading() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-10">
      <div className="card w-full space-y-4 p-8 text-center">
        <div className="mx-auto h-14 w-14 animate-pulse rounded-full bg-[var(--surface-2)]" />
        <div className="space-y-2">
          <div className="h-7 rounded-lg bg-[var(--surface-2)]" />
          <div className="mx-auto h-4 w-48 rounded-lg bg-[var(--surface-2)]" />
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
          <div className="mx-auto h-4 w-16 rounded bg-white/70" />
          <div className="mx-auto mt-3 h-6 w-56 rounded bg-white/70" />
          <div className="mx-auto mt-2 h-4 w-40 rounded bg-white/70" />
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <div className="mx-auto h-4 w-16 rounded bg-[var(--surface-2)]" />
          <div className="mx-auto mt-3 h-8 w-40 rounded bg-[var(--surface-2)]" />
          <div className="mx-auto mt-3 h-4 w-52 rounded bg-[var(--surface-2)]" />
        </div>
      </div>
    </div>
  );
}
