export function HomeSupportCard() {
  return (
    <div className="relative h-full min-h-[210px] w-full overflow-hidden rounded-2xl border border-indigo-200/70 bg-[radial-gradient(circle_at_25%_20%,rgba(99,102,241,0.28),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(6,182,212,0.22),transparent_34%),linear-gradient(135deg,#ffffff,#f7f8ff)] p-6 shadow-sm">
      <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute -bottom-14 -right-10 h-36 w-36 rounded-full bg-cyan-400/25 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.7),transparent)] opacity-60" />

      <div className="relative flex h-full items-center justify-center">
        <div className="relative">
          <div className="absolute -inset-5 rounded-full bg-indigo-500/20 blur-2xl" />
          <div className="relative rounded-3xl border border-white/70 bg-white/55 px-10 py-7 shadow-[0_20px_60px_rgba(79,70,229,0.18)] backdrop-blur">
            <div className="bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-5xl font-black tracking-tight text-transparent">
              好维AI
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
