"use client";

import { useEffect, useMemo, useState } from "react";

type Source = "Twitch" | "Kick" | "X";
type StreamPlatform = "Twitch" | "Kick" | "YouTube";
type Mode = "Creator Dashboard" | "Viewer Mode";

type Message = {
  source: Source;
  user: string;
  text: string;
};

const incomingMessages: Message[] = [
  { source: "Twitch", user: "banksfan22", text: "Banks stream with one native chat is the move" },
  { source: "X", user: "viralwatch", text: "Market Bubble Lobby actually solves split audiences 🔥" },
  { source: "Kick", user: "greenroom", text: "Kick chat showing next to Twitch and X is clean" },
  { source: "Twitch", user: "clipboss", text: "CLIP IT CLIP IT CLIP IT" },
  { source: "X", user: "trendwatch", text: "Twitter stream chat needs to live here too" },
  { source: "Kick", user: "user91", text: "combined viewer count is huge" },
  { source: "Twitch", user: "chatlord", text: "NO WAY this is all one room" },
  { source: "X", user: "fypwatch", text: "Native Market Bubble chat is the vision" },
  { source: "Kick", user: "marketmax", text: "Waiting for Kick stream but chat still unified" },
  { source: "Twitch", user: "modking", text: "specific labels make this easy to moderate" },
  { source: "X", user: "cliphunter", text: "CLIP IT. This moment is going viral." },
  { source: "Kick", user: "replaygang", text: "This feels like the future of creator dashboards" },
];

const viewerBreakdown = {
  Twitch: 4812,
  Kick: 2101,
  X: 1149,
};

const totalViewers =
  viewerBreakdown.Twitch + viewerBreakdown.Kick + viewerBreakdown.X;

const streamUrls: Record<StreamPlatform, string | null> = {
  Twitch: "https://player.twitch.tv/?channel=fazebanks&parent=localhost&muted=true",
  Kick: null,
  YouTube: null,
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(incomingMessages.slice(0, 8));
  const [nextIndex, setNextIndex] = useState(8);
  const [selectedSource, setSelectedSource] = useState<Source | "All">("All");
  const [selectedStream, setSelectedStream] = useState<StreamPlatform>("Twitch");
  const [mode, setMode] = useState<Mode>("Creator Dashboard");

  const visibleMessages =
    selectedSource === "All"
      ? messages
      : messages.filter((message) => message.source === selectedSource);

  const clipMentions = useMemo(
    () => messages.filter((message) => message.text.toLowerCase().includes("clip")).length,
    [messages]
  );

  const hypeMentions = useMemo(
    () =>
      messages.filter((message) => {
        const text = message.text.toLowerCase();
        return text.includes("no way") || text.includes("viral") || text.includes("huge");
      }).length,
    [messages]
  );

  const momentConfidence = Math.min(99, 64 + clipMentions * 8 + hypeMentions * 4);
  const showViralAlert = clipMentions >= 2 || hypeMentions >= 3;

  useEffect(() => {
    const timer = setInterval(() => {
      setMessages((current) => {
        const nextMessage = incomingMessages[nextIndex % incomingMessages.length];
        return [nextMessage, ...current].slice(0, 18);
      });

      setNextIndex((current) => current + 1);
    }, 1200);

    return () => clearInterval(timer);
  }, [nextIndex]);

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/35">
              MarketBubble.com Native Experience
            </p>
            <h1 className="mt-1 text-3xl font-black md:text-5xl">
              Market Bubble Lobby
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Watch the stream, see every viewer, and read one combined chat from Twitch, Kick, and X.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(["Creator Dashboard", "Viewer Mode"] as Mode[]).map((item) => (
              <button
                key={item}
                onClick={() => setMode(item)}
                className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                  mode === item
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-white/[0.04] text-white/60 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}

            <div className="flex items-center gap-2 rounded-full border border-green-400/40 bg-green-400/10 px-4 py-2 text-sm font-bold text-green-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-300" />
              LIVE
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1600px] gap-0 lg:grid-cols-[1fr_440px]">
        <div className="min-w-0">
          <section className="grid gap-4 border-b border-white/10 p-6 xl:grid-cols-[1.4fr_1fr]">
            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-white/35">
                Combined Audience
              </p>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-6xl font-black md:text-7xl">
                    {totalViewers.toLocaleString()}
                  </p>
                  <p className="mt-2 text-white/50">viewers across all sources</p>
                </div>

                <div className="rounded-3xl border border-orange-400/30 bg-orange-400/10 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-orange-200/70">
                    Native Chat
                  </p>
                  <p className="mt-1 text-xl font-black">MarketBubble.com</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <ViewerSource label="Twitch" value={viewerBreakdown.Twitch} />
                <ViewerSource label="Kick" value={viewerBreakdown.Kick} />
                <ViewerSource label="X" value={viewerBreakdown.X} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-white/35">
                Active Mode
              </p>
              <h2 className="mt-3 text-3xl font-black">{mode}</h2>
              <p className="mt-3 leading-7 text-white/55">
                {mode === "Creator Dashboard"
                  ? "Built for Banks and Z to monitor the entire audience, combined viewers, viral spikes, and source-labeled chat from one control room."
                  : "Built for viewers who want to watch the stream and participate in the combined Market Bubble chat without opening every platform."}
              </p>
            </div>
          </section>

          <section className="border-b border-white/10 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-white/40">Now Watching</p>
                <h2 className="text-2xl font-black">FaZe Banks Live</h2>
              </div>

              <div className="flex gap-2">
                {(["Twitch", "Kick", "YouTube"] as StreamPlatform[]).map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setSelectedStream(platform)}
                    className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                      selectedStream === platform
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-white/[0.04] text-white/60 hover:text-white"
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex aspect-video min-h-[420px] items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-black">
              {streamUrls[selectedStream] ? (
                <iframe
                  key={selectedStream}
                  src={streamUrls[selectedStream] as string}
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <WaitingStream platform={selectedStream} />
              )}

              <div className="pointer-events-none absolute left-6 top-6 flex items-center gap-3">
                <div className="rounded-full bg-red-600 px-4 py-2 text-xs font-black">
                  LIVE STREAM
                </div>
                <div className="rounded-full bg-black/70 px-4 py-2 text-sm text-white/80">
                  {totalViewers.toLocaleString()} combined viewers
                </div>
              </div>

              {showViralAlert && (
                <div className="absolute bottom-6 left-6 right-6 rounded-3xl border border-orange-400/40 bg-orange-500/20 p-5 shadow-2xl backdrop-blur-md">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-200">
                        🔥 Viral Moment Detected
                      </p>
                      <h3 className="mt-2 text-3xl font-black">“CLIP IT” is spiking</h3>
                      <p className="mt-1 text-sm text-orange-100/70">
                        {clipMentions * 6} mentions across Twitch, Kick, and X in the last 30 seconds.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-orange-300/30 bg-black/35 px-5 py-4 text-center">
                      <p className="text-sm text-orange-100/60">Confidence</p>
                      <p className="text-3xl font-black">{momentConfidence}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-6 p-6 xl:grid-cols-3">
            <Panel title="Audience Pulse">
              <Pulse label="Twitch" value="58%" width="58%" color="bg-purple-500" />
              <Pulse label="Kick" value="34%" width="34%" color="bg-green-500" />
              <Pulse label="X" value="8%" width="8%" color="bg-white" />
            </Panel>

            <Panel title="🔥 AI Moments">
              <Moment phrase="CLIP IT" count={`${clipMentions * 6} mentions detected`} hot />
              <Moment phrase="NO WAY / VIRAL" count={`${hypeMentions * 5} emotion spike`} />
              <Moment phrase="Clip Probability" count={`${momentConfidence}% likely viral moment`} />
            </Panel>

            <Panel title="Creator Actions">
              <Action title="Generate Clip" subtitle="Create highlight from last 30 sec" />
              <Action title="Pin Topic" subtitle="Banks moment is trending" />
              <Action title="Ask Poll" subtitle="Send poll across all platforms" />
            </Panel>
          </section>
        </div>

        <aside className="border-l border-white/10 bg-[#08080d]">
          <div className="border-b border-white/10 p-5">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                Native Market Bubble Chat
              </p>
              <h2 className="mt-1 text-2xl font-black">Combined Chat</h2>
              <p className="text-sm text-white/40">
                Specific source labels show exactly where every message came from.
              </p>
            </div>

            {showViralAlert && (
              <div className="mb-4 rounded-2xl border border-orange-400/30 bg-orange-400/10 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-200">
                  Viral Alert
                </p>
                <p className="mt-1 font-black">“CLIP IT” spike detected</p>
                <p className="mt-1 text-sm text-orange-100/60">
                  {momentConfidence}% confidence
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {(["All", "Twitch", "Kick", "X"] as const).map((source) => (
                <button
                  key={source}
                  onClick={() => setSelectedSource(source)}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                    selectedSource === source
                      ? "border-white bg-white text-black"
                      : "border-white/10 bg-white/[0.04] text-white/60 hover:text-white"
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[calc(100vh-270px)] space-y-3 overflow-y-auto p-5">
            {visibleMessages.map((message, index) => (
              <div
                key={`${message.user}-${message.text}-${index}`}
                className="rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:border-white/25 hover:bg-white/[0.06]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-black ${platformStyle(
                      message.source
                    )}`}
                  >
                    {message.source}
                  </span>
                  <span className="text-sm font-semibold text-white/45">
                    @{message.user}
                  </span>
                </div>
                <p className="text-base leading-6">{message.text}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

function WaitingStream({ platform }: { platform: StreamPlatform }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(124,58,237,0.35),_transparent_45%)]">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-white/35">
          {platform} Source
        </p>
        <h2 className="mt-3 text-5xl font-black">Waiting for Stream</h2>
        <p className="mt-3 max-w-md text-white/50">
          This slot is ready for the {platform} live player once Market Bubble connects the official stream.
        </p>
      </div>
    </div>
  );
}

function platformStyle(source: Source) {
  if (source === "Kick") return "border-green-400/40 bg-green-400/10 text-green-300";
  if (source === "Twitch") return "border-purple-400/40 bg-purple-400/10 text-purple-300";
  return "border-white/20 bg-white/10 text-white";
}

function ViewerSource({ label, value }: { label: Source; value: number }) {
  return (
    <div className={`rounded-3xl border p-4 ${platformStyle(label)}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-black">{value.toLocaleString()}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="mb-4 text-xl font-black">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Pulse({
  label,
  value,
  width,
  color,
}: {
  label: string;
  value: string;
  width: string;
  color: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="text-white/40">{value}</span>
      </div>
      <div className="h-3 rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width }} />
      </div>
    </div>
  );
}

function Moment({
  phrase,
  count,
  hot,
}: {
  phrase: string;
  count: string;
  hot?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        hot
          ? "border-orange-400/40 bg-orange-400/15"
          : "border-orange-400/20 bg-orange-400/10"
      }`}
    >
      <p className="font-black">“{phrase}”</p>
      <p className="mt-1 text-sm text-orange-100/60">{count}</p>
    </div>
  );
}

function Action({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <button className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-left transition hover:border-white/30 hover:bg-white/[0.06]">
      <p className="font-black">{title}</p>
      <p className="mt-1 text-sm text-white/40">{subtitle}</p>
    </button>
  );
}