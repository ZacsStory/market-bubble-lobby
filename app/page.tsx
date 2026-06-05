"use client";

import { useEffect, useMemo, useState } from "react";

type Message = {
  source: string;
  user: string;
  text: string;
};

type StreamPlatform = "Twitch" | "Kick" | "Demo";

const incomingMessages: Message[] = [
  { source: "Twitch", user: "banksfan22", text: "Banks stream with every platform in one chat is crazy" },
  { source: "Kick", user: "clipboss", text: "CLIP IT CLIP IT CLIP IT" },
  { source: "X", user: "viralwatch", text: "This moment is going viral on X 🔥" },
  { source: "Twitch", user: "chatlord", text: "NO WAY he just said that" },
  { source: "Kick", user: "user91", text: "HYPE just different 👀" },
  { source: "X", user: "trendwatch", text: "Everyone is talking about this stream rn" },
  { source: "Twitch", user: "subking", text: "chat is moving crazy" },
  { source: "Kick", user: "greenroom", text: "Kick chat finally visible with everyone else" },
  { source: "X", user: "cliphunter", text: "CLIP IT. This moment is going viral." },
  { source: "Twitch", user: "modking", text: "this would be insane for big streamers" },
  { source: "Kick", user: "replaygang", text: "This feels like the future of live streams" },
  { source: "X", user: "fypwatch", text: "The Lobby is actually solving split audiences" },
];

const streamUrls: Record<StreamPlatform, string | null> = {
  Twitch: "https://player.twitch.tv/?channel=fazebanks&parent=localhost&muted=true",
  Kick: "https://player.kick.com/xqc",
  Demo: null,
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(incomingMessages.slice(0, 8));
  const [nextIndex, setNextIndex] = useState(8);
  const [selectedSource, setSelectedSource] = useState("All");
  const [selectedStream, setSelectedStream] = useState<StreamPlatform>("Twitch");

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
        return text.includes("no way") || text.includes("hype") || text.includes("viral") || text.includes("crazy");
      }).length,
    [messages]
  );

  const momentConfidence = Math.min(99, 62 + clipMentions * 8 + hypeMentions * 3);

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
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/35">
            Audience Operating System
          </p>
          <h1 className="text-3xl font-black md:text-4xl">The Lobby</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60 md:block">
            Twitch + Kick + X
          </div>

          <div className="flex items-center gap-2 rounded-full border border-green-400/40 bg-green-400/10 px-4 py-2 text-sm font-bold text-green-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-300" />
            LIVE
          </div>
        </div>
      </header>

      <section className="grid min-h-[calc(100vh-73px)] lg:grid-cols-[1fr_430px]">
        <div className="flex flex-col">
          <div className="border-b border-white/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-white/40">Now Watching</p>
                <h2 className="text-2xl font-black">FaZe Banks Live</h2>
              </div>

              <div className="flex gap-2">
                {(["Twitch", "Kick", "Demo"] as StreamPlatform[]).map((platform) => (
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
          </div>

          <div className="relative flex aspect-video min-h-[420px] items-center justify-center overflow-hidden bg-black">
            {streamUrls[selectedStream] ? (
              <iframe
                key={selectedStream}
                src={streamUrls[selectedStream] as string}
                className="absolute inset-0 h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(124,58,237,0.35),_transparent_45%)]">
                <div className="text-center">
                  <div className="mb-4 text-8xl">▶</div>
                  <h2 className="text-5xl font-black">FaZe Banks Live</h2>
                  <p className="mt-3 text-lg text-white/50">
                    Demo stream fallback when embeds are unavailable
                  </p>
                </div>
              </div>
            )}

            <div className="pointer-events-none absolute left-6 top-6 flex items-center gap-3">
              <div className="rounded-full bg-red-600 px-4 py-2 text-xs font-black">
                LIVE STREAM
              </div>
              <div className="rounded-full bg-black/70 px-4 py-2 text-sm text-white/80">
                8,062 watching
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-white/10 p-6 xl:grid-cols-4">
            <Stat label="Total Viewers" value="8,062" />
            <Stat label="Messages" value="1,284" />
            <Stat label="Platforms" value="3" />
            <Stat label="Velocity" value="+18/min" />
          </div>

          <div className="grid gap-6 p-6 xl:grid-cols-3">
            <Panel title="Audience Pulse">
              <Pulse label="Twitch" value="58%" width="58%" color="bg-purple-500" />
              <Pulse label="Kick" value="34%" width="34%" color="bg-green-500" />
              <Pulse label="X" value="8%" width="8%" color="bg-white" />
            </Panel>

            <Panel title="🔥 AI Moments">
              <Moment phrase="CLIP IT" count={`${clipMentions * 6} mentions detected`} hot />
              <Moment phrase="NO WAY / HYPE" count={`${hypeMentions * 5} emotion spike`} />
              <Moment phrase="Clip Probability" count={`${momentConfidence}% likely viral moment`} />
            </Panel>

            <Panel title="Creator Actions">
              <Action title="Generate Clip" subtitle="Create highlight from last 30 sec" />
              <Action title="Pin Topic" subtitle="Banks moment is trending" />
              <Action title="Ask Poll" subtitle="Send poll across all platforms" />
            </Panel>
          </div>
        </div>

        <aside className="border-l border-white/10 bg-[#08080d]">
          <div className="border-b border-white/10 p-5">
            <div className="mb-4">
              <h2 className="text-2xl font-black">Unified Chat</h2>
              <p className="text-sm text-white/40">
                Live messages across Twitch, Kick, and X
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {["All", "Twitch", "Kick", "X"].map((source) => (
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

          <div className="h-[calc(100vh-190px)] space-y-3 overflow-y-auto p-5">
            {visibleMessages.map((message, index) => (
              <div
                key={`${message.user}-${message.text}-${index}`}
                className="rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:border-white/25 hover:bg-white/[0.06]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${platformStyle(message.source)}`}>
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

function platformStyle(source: string) {
  if (source === "Kick") return "border-green-400/40 bg-green-400/10 text-green-300";
  if (source === "Twitch") return "border-purple-400/40 bg-purple-400/10 text-purple-300";
  return "border-white/20 bg-white/10 text-white";
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm text-white/40">{label}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
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

function Pulse({ label, value, width, color }: { label: string; value: string; width: string; color: string }) {
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

function Moment({ phrase, count, hot }: { phrase: string; count: string; hot?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${hot ? "border-orange-400/40 bg-orange-400/15" : "border-orange-400/20 bg-orange-400/10"}`}>
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