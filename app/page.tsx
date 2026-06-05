"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Source = "Twitch" | "Kick" | "X" | "YouTube";
type ChatSource = Source | "All Platforms";
type StreamPlatform = "Twitch" | "Kick" | "X" | "YouTube";
type Mode = "Creator Dashboard" | "Viewer Mode";

type Message = {
  source: Source;
  user: string;
  text: string;
};

type ChatFeedItem =
  | {
      type: "message";
      id: string;
      source: ChatSource;
      user: string;
      text: string;
    }
  | {
      type: "moment";
      id: string;
      phrase: string;
      mentions: number;
      confidence: number;
      sources: Source[];
      timestamp: string;
    };

type AudienceSource = {
  source: Source;
  viewers: number;
  messagesPerMinute: number;
  growth: string;
  topChatters: string[];
  status: "Live" | "Waiting";
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
  { source: "YouTube", user: "ytwaiting", text: "YouTube source ready when the official stream connects" },
];

const audienceSources: AudienceSource[] = [
  {
    source: "Twitch",
    viewers: 4812,
    messagesPerMinute: 132,
    growth: "+4.2%",
    topChatters: ["@banksfan22", "@modking", "@clipboss"],
    status: "Live",
  },
  {
    source: "Kick",
    viewers: 2101,
    messagesPerMinute: 54,
    growth: "+8.7%",
    topChatters: ["@greenroom", "@marketmax", "@user91"],
    status: "Live",
  },
  {
    source: "X",
    viewers: 1149,
    messagesPerMinute: 27,
    growth: "+12.4%",
    topChatters: ["@viralwatch", "@trendwatch", "@cliphunter"],
    status: "Live",
  },
  {
    source: "YouTube",
    viewers: 0,
    messagesPerMinute: 0,
    growth: "Waiting",
    topChatters: ["No YouTube stream connected yet"],
    status: "Waiting",
  },
];

const totalViewers = audienceSources.reduce((sum, item) => sum + item.viewers, 0);

const streamUrls: Record<StreamPlatform, string | null> = {
  Twitch: "https://player.twitch.tv/?channel=fazebanks&parent=localhost&muted=true",
  Kick: null,
  X: null,
  YouTube: null,
};

function createMessageItem(message: Message, index: number): ChatFeedItem {
  return {
    type: "message",
    id: `message-${index}-${message.source}-${message.user}`,
    source: message.source,
    user: message.user,
    text: message.text,
  };
}

function createMomentItem(id: string, mentions: number, confidence: number): ChatFeedItem {
  return {
    type: "moment",
    id,
    phrase: "CLIP IT",
    mentions,
    confidence,
    sources: ["Twitch", "Kick", "X"],
    timestamp: "now",
  };
}

function countKeyword(messages: Message[], keyword: string) {
  return messages.filter((message) => message.text.toLowerCase().includes(keyword)).length;
}

const initialFeedItems: ChatFeedItem[] = [
  createMomentItem("moment-initial-clip", 24, 92),
  ...incomingMessages.slice(0, 8).map((message, index) => createMessageItem(message, index)),
];

export default function Home() {
  const [feedItems, setFeedItems] = useState<ChatFeedItem[]>(initialFeedItems);
  const [selectedSource, setSelectedSource] = useState<Source | "All">("All");
  const [selectedStream, setSelectedStream] = useState<StreamPlatform>("Twitch");
  const [mode, setMode] = useState<Mode>("Creator Dashboard");
  const [selectedAudience, setSelectedAudience] = useState<Source>("Twitch");
  const [clipCooldown, setClipCooldown] = useState(25);
  const [chatText, setChatText] = useState("");

  const nextIndexRef = useRef(8);
  const momentCountRef = useRef(1);

  const selectedAudienceData =
    audienceSources.find((item) => item.source === selectedAudience) || audienceSources[0];

  const messages = useMemo(
    () =>
      feedItems
        .filter((item): item is Extract<ChatFeedItem, { type: "message" }> => item.type === "message")
        .map((item) => ({
          source: item.source === "All Platforms" ? "Twitch" : item.source,
          user: item.user,
          text: item.text,
        })),
    [feedItems]
  );

  const visibleFeedItems =
    selectedSource === "All"
      ? feedItems
      : feedItems.filter((item) => {
          if (item.type === "message") {
            return item.source === selectedSource || item.source === "All Platforms";
          }

          return item.sources.includes(selectedSource);
        });

  const clipMentions = useMemo(() => countKeyword(messages, "clip"), [messages]);

  const hypeMentions = useMemo(
    () =>
      messages.filter((message) => {
        const text = message.text.toLowerCase();
        return (
          text.includes("no way") ||
          text.includes("viral") ||
          text.includes("huge") ||
          text.includes("crazy")
        );
      }).length,
    [messages]
  );

  const momentConfidence = Math.min(99, 64 + clipMentions * 8 + hypeMentions * 4);

  function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = chatText.trim();

    if (!trimmedMessage) {
      return;
    }

    const sentMessage: ChatFeedItem = {
      type: "message",
      id: `sent-message-${Date.now()}`,
      source: "All Platforms",
      user: "you",
      text: trimmedMessage,
    };

    setFeedItems((current) => [sentMessage, ...current].slice(0, 28));
    setChatText("");
  }

  useEffect(() => {
    const messageTimer = setInterval(() => {
      const index = nextIndexRef.current;
      const nextMessage = incomingMessages[index % incomingMessages.length];
      const nextMessageItem = createMessageItem(nextMessage, index);

      setFeedItems((current) => {
        return [nextMessageItem, ...current].slice(0, 28);
      });

      nextIndexRef.current = index + 1;
    }, 1200);

    return () => clearInterval(messageTimer);
  }, []);

  useEffect(() => {
    const momentTimer = setInterval(() => {
      momentCountRef.current += 1;

      const newMoment = createMomentItem(
        `moment-clip-${Date.now()}`,
        18 + momentCountRef.current * 6,
        Math.min(99, 88 + momentCountRef.current)
      );

      setFeedItems((current) => {
        const recentDuplicate = current
          .slice(0, 5)
          .some((item) => item.type === "moment" && item.phrase === "CLIP IT");

        if (recentDuplicate) {
          return current;
        }

        return [newMoment, ...current].slice(0, 28);
      });

      setClipCooldown(25);
    }, 25000);

    return () => clearInterval(momentTimer);
  }, []);

  useEffect(() => {
    if (clipCooldown <= 0) return;

    const cooldownTimer = setTimeout(() => {
      setClipCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(cooldownTimer);
  }, [clipCooldown]);

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/35">
            MarketBubble.com Native Experience
          </p>
          <h1 className="text-3xl font-black md:text-4xl">Market Bubble Lobby</h1>
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
      </header>

      <section className="grid min-h-[calc(100vh-65px)] lg:grid-cols-[1fr_420px]">
        <div className="flex flex-col">
          <div className="border-b border-white/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-white/40">Now Watching</p>
                <h2 className="text-2xl font-black">FaZe Banks Live</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {(["Twitch", "Kick", "X", "YouTube"] as StreamPlatform[]).map((platform) => (
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

          <div className="relative flex h-[390px] items-center justify-center overflow-hidden bg-black lg:h-[420px] xl:h-[445px]">
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

            <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-3">
              <div className="rounded-full bg-red-600 px-4 py-2 text-xs font-black">
                LIVE STREAM
              </div>
              <div className="rounded-full bg-black/70 px-4 py-2 text-sm text-white/80">
                {totalViewers.toLocaleString()} combined viewers
              </div>
            </div>
          </div>

          {mode === "Viewer Mode" ? (
            <>
              <section className="border-b border-white/10 p-4">
                <div className="grid gap-4 xl:grid-cols-[240px_1fr]">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                      Watching Together
                    </p>
                    <h2 className="mt-3 text-4xl font-black">
                      {totalViewers.toLocaleString()}
                    </h2>
                    <p className="mt-2 text-sm text-white/45">combined viewers live right now</p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                      Viewer Mode
                    </p>
                    <h2 className="mt-3 text-3xl font-black">One stream. One chat. Every platform.</h2>
                    <p className="mt-3 text-sm leading-6 text-white/50">
                      A cleaner watch page for the audience: stream player, combined viewer count,
                      source-labeled chat, and shared moments without the heavy creator controls.
                    </p>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 p-4 xl:grid-cols-3">
                <Panel title="Live Sources">
                  <SourceStatus label="Twitch" status="Live" viewers="4,812" />
                  <SourceStatus label="Kick" status="Live" viewers="2,101" />
                  <SourceStatus label="X" status="Live" viewers="1,149" />
                  <SourceStatus label="YouTube" status="Waiting" viewers="0" />
                </Panel>

                <Panel title="🔥 Shared Moments">
                  <Timeline
                    time="Now"
                    title="CLIP IT spike"
                    subtitle={`${clipMentions * 6} combined mentions`}
                  />
                  <Timeline
                    time="Live"
                    title="Viewer surge"
                    subtitle="+312 viewers joined the room"
                  />
                </Panel>

                <Panel title="Join The Room">
                  <Action title="Open Native Chat" subtitle="Chat with viewers across every source" />
                  <Action title="Save Moment" subtitle="Mark the current highlight" />
                  <Action title="Switch Source" subtitle="Change the stream source above" />
                </Panel>
              </section>
            </>
          ) : (
            <>
              <section className="border-b border-white/10 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/35">
                      Live Audience Intelligence
                    </p>
                    <h2 className="mt-1 text-3xl font-black">
                      {totalViewers.toLocaleString()} Total Viewers
                    </h2>
                  </div>
                  <p className="max-w-xl text-sm leading-6 text-white/45">
                    Click a platform to see where viewers are coming from, how active they are,
                    and who is driving the conversation.
                  </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-4">
                  {audienceSources.map((item) => (
                    <button
                      key={item.source}
                      onClick={() => setSelectedAudience(item.source)}
                      className={`rounded-3xl border p-4 text-left transition hover:border-white/30 ${
                        selectedAudience === item.source
                          ? "border-white bg-white text-black"
                          : "border-white/10 bg-white/[0.03] text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${
                            selectedAudience === item.source
                              ? "border-black/10 bg-black/10 text-black"
                              : platformStyle(item.source)
                          }`}
                        >
                          {item.source}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            item.status === "Live"
                              ? selectedAudience === item.source
                                ? "bg-green-500/20 text-green-700"
                                : "bg-green-400/10 text-green-300"
                              : selectedAudience === item.source
                              ? "bg-black/10 text-black/50"
                              : "bg-white/10 text-white/40"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="mt-4 text-4xl font-black">{item.viewers.toLocaleString()}</p>
                      <p className={selectedAudience === item.source ? "text-black/55" : "text-white/45"}>
                        viewers
                      </p>

                      <div className="mt-4 rounded-2xl border border-current/10 p-3">
                        <p className="text-sm opacity-70">Messages / min</p>
                        <p className="mt-1 text-2xl font-black">{item.messagesPerMinute}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                        Selected Source
                      </p>
                      <h3 className="mt-1 text-3xl font-black">{selectedAudienceData.source} Details</h3>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
                      <p className="text-sm text-white/40">Growth</p>
                      <p className="text-2xl font-black text-green-300">{selectedAudienceData.growth}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <MiniMetric label="Viewers" value={selectedAudienceData.viewers.toLocaleString()} />
                    <MiniMetric label="Messages/min" value={String(selectedAudienceData.messagesPerMinute)} />
                    <MiniMetric label="Source" value={selectedAudienceData.source} />
                  </div>

                  <div className="mt-4">
                    <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-white/35">
                      Top Chatters
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAudienceData.topChatters.map((chatter) => (
                        <span
                          key={chatter}
                          className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm font-bold text-white/70"
                        >
                          {chatter}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 p-4 xl:grid-cols-[1fr_1fr_1fr_1fr]">
                <Panel title="Audience Pulse">
                  <Pulse label="Twitch" value="60%" width="60%" color="bg-purple-500" />
                  <Pulse label="Kick" value="26%" width="26%" color="bg-green-500" />
                  <Pulse label="X" value="14%" width="14%" color="bg-white" />
                  <Pulse label="YouTube" value="0%" width="0%" color="bg-red-500" />
                </Panel>

                <Panel title="🔥 AI Moment Timeline">
                  <Timeline
                    time="12:04"
                    title="CLIP IT spike"
                    subtitle={`${clipMentions * 6} mentions • ${momentConfidence}% confidence`}
                  />
                  <Timeline
                    time="12:06"
                    title="NO WAY surge"
                    subtitle={`${hypeMentions * 5} reactions`}
                  />
                  <Timeline
                    time="12:09"
                    title="Viewer surge"
                    subtitle="+312 viewers"
                  />
                  <Timeline
                    time="12:11"
                    title="Clip cooldown"
                    subtitle={clipCooldown > 0 ? `Next auto-clip in ${clipCooldown}s` : "Ready for next moment"}
                  />
                </Panel>

                <Panel title="Creator Actions">
                  <Action title="Generate Clip" subtitle="Create highlight from last 30 sec" />
                  <Action title="Create Poll" subtitle="Ask Twitch, Kick, and X at once" />
                  <Action title="Pin Topic" subtitle="Banks moment is trending" />
                </Panel>

                <Panel title="What This Proves">
                  <ProofLine text="One combined chat across platforms" />
                  <ProofLine text="One combined viewer count" />
                  <ProofLine text="Source-labeled messages" />
                  <ProofLine text="Creator dashboard + viewer mode" />
                  <ProofLine text="AI moments inside the chat feed" />
                </Panel>
              </section>
            </>
          )}
        </div>

        <aside className="sticky top-0 flex h-screen flex-col border-l border-white/10 bg-[#08080d]">
          <div className="border-b border-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/35">
              {mode === "Viewer Mode" ? "Live Viewer Chat" : "Native Market Bubble Chat"}
            </p>
            <h2 className="mt-1 text-2xl font-black">Combined Chat</h2>
            <p className="text-sm text-white/40">
              {mode === "Viewer Mode"
                ? "Watch and chat with the full Market Bubble audience in one room."
                : "Specific source labels show exactly where every message came from."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {(["All", "Twitch", "Kick", "X", "YouTube"] as const).map((source) => (
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

            <form onSubmit={handleSendMessage} className="mt-4">
              <div className="rounded-3xl border border-white/10 bg-black/35 p-3">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-white/35">
                  Send to Twitch + Kick + X + YouTube
                </p>

                <div className="flex gap-2">
                  <input
                    value={chatText}
                    onChange={(event) => setChatText(event.target.value)}
                    placeholder={
                      mode === "Viewer Mode"
                        ? "Chat with the whole room..."
                        : "Broadcast a message to all platforms..."
                    }
                    className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
                  />

                  <button
                    type="submit"
                    disabled={!chatText.trim()}
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/30"
                  >
                    Send
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {visibleFeedItems.map((item) => {
              if (item.type === "moment") {
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-orange-400/40 bg-orange-400/10 p-4 shadow-lg"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="rounded-full border border-orange-300/30 bg-orange-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-orange-200">
                        AI Moment
                      </span>
                      <span className="text-xs text-orange-100/50">
                        Cooldown protected
                      </span>
                    </div>

                    <p className="text-lg font-black">🔥 “{item.phrase}” spike detected</p>
                    <p className="mt-2 text-sm leading-6 text-orange-100/70">
                      {item.mentions} mentions across {item.sources.join(", ")} • {item.confidence}% confidence
                    </p>

                    <button className="mt-4 w-full rounded-xl border border-orange-200/20 bg-black/25 px-4 py-3 text-left text-sm font-bold text-orange-100 transition hover:bg-orange-200/10">
                      {mode === "Viewer Mode" ? "Save Moment" : "Generate Clip from last 30 seconds"}
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:border-white/25 hover:bg-white/[0.06]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${platformStyle(
                        item.source
                      )}`}
                    >
                      {item.source === "All Platforms" ? "All" : item.source}
                    </span>
                    <span className="text-sm font-semibold text-white/45">
                      @{item.user}
                    </span>
                  </div>
                  <p className="text-base leading-6">{item.text}</p>
                </div>
              );
            })}
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

function platformStyle(source: ChatSource) {
  if (source === "All Platforms") return "border-blue-400/40 bg-blue-400/10 text-blue-200";
  if (source === "Kick") return "border-green-400/40 bg-green-400/10 text-green-300";
  if (source === "Twitch") return "border-purple-400/40 bg-purple-400/10 text-purple-300";
  if (source === "YouTube") return "border-red-400/40 bg-red-400/10 text-red-300";
  return "border-white/20 bg-white/10 text-white";
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-sm text-white/40">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
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

function Timeline({
  time,
  title,
  subtitle,
}: {
  time: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-orange-400/20 bg-orange-400/10 p-4">
      <p className="text-xs text-orange-100/50">{time}</p>
      <p className="mt-1 font-black">{title}</p>
      <p className="mt-1 text-sm text-orange-100/60">{subtitle}</p>
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

function SourceStatus({
  label,
  status,
  viewers,
}: {
  label: Source;
  status: "Live" | "Waiting";
  viewers: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${platformStyle(label)}`}>
          {label}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            status === "Live" ? "bg-green-400/10 text-green-300" : "bg-white/10 text-white/40"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="mt-3 text-2xl font-black">{viewers}</p>
      <p className="text-sm text-white/40">viewers</p>
    </div>
  );
}

function ProofLine({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white/70">
      ✓ {text}
    </div>
  );
}