const messages = [
  { source: "Kick", user: "user91", text: "HYPE just different 👀", color: "emerald" },
  { source: "X", user: "user1337", text: "this stream is everywhere right now 🔥", color: "zinc" },
  { source: "Twitch", user: "user67", text: "chat is moving crazy", color: "purple" },
  { source: "Kick", user: "marketmax", text: "The Lobby is actually needed", color: "emerald" },
  { source: "X", user: "cliphunter", text: "best moments are coming from all platforms", color: "zinc" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/40">Unified Live Feed</p>
            <h1 className="mt-3 text-5xl font-black tracking-tight md:text-7xl">
              The Lobby
            </h1>
            <p className="mt-3 text-lg text-white/60">One audience. One room.</p>
          </div>

          <div className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
            LIVE
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Real-time Conversation</h2>
              <p className="text-sm text-white/40">Twitch + X + Kick</p>
            </div>

            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className="group grid grid-cols-[110px_1fr] gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 transition hover:border-white/25 hover:bg-white/[0.06]"
                >
                  <div
                    className={`flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-bold ${
                      message.source === "Kick"
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                        : message.source === "Twitch"
                        ? "border-purple-400/40 bg-purple-400/10 text-purple-300"
                        : "border-white/20 bg-white/10 text-white"
                    }`}
                  >
                    {message.source}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white/50">@{message.user}</p>
                    <p className="mt-1 text-lg">{message.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-xl font-bold">Audience Pulse</h2>
              <div className="mt-5 space-y-4">
                <Pulse label="Twitch" value="54%" width="54%" />
                <Pulse label="Kick" value="32%" width="32%" />
                <Pulse label="X" value="14%" width="14%" />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-xl font-bold">Trending Now</h2>
              <div className="mt-4 space-y-3 text-sm">
                <Trend title="Market Bubble" count="82 messages" />
                <Trend title="Live clips" count="41 messages" />
                <Trend title="Kick vs Twitch" count="29 messages" />
              </div>
            </div>

            <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-200/70">Demo Angle</p>
              <p className="mt-3 text-lg font-semibold text-amber-100">
                Not just a chat feed — audience intelligence across every platform.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Pulse({
  label,
  value,
  width,
}: {
  label: string;
  value: string;
  width: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="text-white/40">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white" style={{ width }} />
      </div>
    </div>
  );
}

function Trend({ title, count }: { title: string; count: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="font-semibold">🔥 {title}</p>
      <p className="mt-1 text-white/40">{count}</p>
    </div>
  );
}