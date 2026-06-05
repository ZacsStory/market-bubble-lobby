"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
      role?: "creator" | "viewer";
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
      user: mode === "Creator Dashboard" ? "creator" : "you",
      role: mode === "Creator Dashboard" ? "creator" : "viewer",
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
    <main className="min-h-screen bg-[#0e0a07] text-[#f7efe4]">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(213,159,92,0.22),transparent_32%),linear-gradient(180deg,#15100c_0%,#0e0a07_45%,#090604_100%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(rgba(255,244,223,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,244,223,0.6)_1px,transparent_1px)] [background-size:42px_42px]" />

      <header className="flex items-center justify-between border-b border-[#d8ad75]/25 bg-[#17100b]/95 px-5 py-3 shadow-[0_16px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.42em] text-[#d8ad75]">
            MarketBubble.com Native Experience
          </p>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-[#fff7ea] md:text-4xl">
            Market Bubble Lobby
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {(["Creator Dashboard", "Viewer Mode"] as Mode[]).map((item) => (
            <button
              key={item}
              onClick={() => setMode(item)}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                mode === item
                  ? "border-[#f3dfc1] bg-[#f3dfc1] text-[#160f09] shadow-[0_0_30px_rgba(216,173,117,0.25)]"
                  : "border-[#d8ad75]/25 bg-[#25190f] text-[#e8d1b0]/75 hover:border-[#d8ad75]/60 hover:text-[#fff7ea]"
              }`}
            >
              {item}
            </button>
          ))}

          <div className="flex items-center gap-2 rounded-full border border-[#9ccc8f]/40 bg-[#1e321b] px-4 py-2 text-sm font-bold text-[#b7e4a8]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#b7e4a8]" />
            LIVE
          </div>
        </div>
      </header>

      <section className="grid min-h-[calc(100vh-65px)] lg:grid-cols-[1fr_430px]">
        <div className="flex flex-col gap-4 p-4">
          <section className="overflow-hidden rounded-[2rem] border border-[#d8ad75]/25 bg-[#17100b]/90 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
            <div className="border-b border-[#d8ad75]/20 bg-[#1f160f] px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#e8d1b0]/60">Now Watching</p>
                  <h2 className="text-2xl font-black tracking-[-0.03em] text-[#fff7ea]">
                    FaZe Banks Live
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["Twitch", "Kick", "X", "YouTube"] as StreamPlatform[]).map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setSelectedStream(platform)}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
                        selectedStream === platform
                          ? "border-[#f3dfc1] bg-[#f3dfc1] text-[#160f09]"
                          : "border-[#d8ad75]/25 bg-[#100b07] text-[#e8d1b0]/75 hover:border-[#d8ad75]/60 hover:text-[#fff7ea]"
                      }`}
                    >
                      <PlatformLogo source={platform} />
                      {platform}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative flex h-[360px] items-center justify-center overflow-hidden bg-[#080604] lg:h-[390px] xl:h-[410px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,173,117,0.12),transparent_45%),linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(14,10,7,0.62)_100%)]" />

              {streamUrls[selectedStream] ? (
                <iframe
                  key={selectedStream}
                  src={streamUrls[selectedStream] as string}
                  className="absolute inset-0 h-full w-full opacity-[0.9] saturate-[0.86]"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <WaitingStream platform={selectedStream} />
              )}

              <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-3">
                <div className="rounded-full bg-[#b22b21] px-4 py-2 text-xs font-black text-[#fff5e8] shadow-[0_0_24px_rgba(178,43,33,0.28)]">
                  LIVE STREAM
                </div>
                <div className="rounded-full border border-[#f3dfc1]/20 bg-[#100b07]/85 px-4 py-2 text-sm text-[#f3dfc1] backdrop-blur">
                  {totalViewers.toLocaleString()} combined viewers
                </div>
              </div>
            </div>
          </section>

          {mode === "Viewer Mode" ? (
            <>
              <section className="rounded-[2rem] border border-[#d8ad75]/25 bg-[#17100b]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.26)]">
                <SectionHeader
                  eyebrow="Viewer Experience"
                  title="One stream. One chat. Every platform."
                  description="A clean watch page for the audience with combined viewers, source-labeled chat, and shared moments."
                />

                <div className="mt-5 grid gap-4 xl:grid-cols-[240px_1fr]">
                  <StatCard label="Watching Together" value={totalViewers.toLocaleString()} sub="combined viewers live right now" />
                  <div className="rounded-3xl border border-[#d8ad75]/22 bg-[#21170f] p-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-[#d8ad75]">
                      Viewer Mode
                    </p>
                    <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#fff7ea]">
                      Built for the audience.
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-[#e8d1b0]/68">
                      The viewer sees the stream, joins the native Market Bubble room, and can follow the same live moment across every source.
                    </p>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 xl:grid-cols-3">
                <Panel title="Live Sources">
                  <SourceStatus label="Twitch" status="Live" viewers="4,812" />
                  <SourceStatus label="Kick" status="Live" viewers="2,101" />
                  <SourceStatus label="X" status="Live" viewers="1,149" />
                  <SourceStatus label="YouTube" status="Waiting" viewers="0" />
                </Panel>

                <Panel title="Shared Moments">
                  <Timeline time="Now" title="CLIP IT spike" subtitle={`${clipMentions * 6} combined mentions`} />
                  <Timeline time="Live" title="Viewer surge" subtitle="+312 viewers joined the room" />
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
              <section className="rounded-[2rem] border border-[#d8ad75]/25 bg-[#17100b]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.26)]">
                <SectionHeader
                  eyebrow="Live Audience Intelligence"
                  title={`${totalViewers.toLocaleString()} Total Viewers`}
                  description="Click a platform to see where viewers are coming from, how active they are, and who is driving the conversation."
                />

                <div className="mt-5 grid gap-4 xl:grid-cols-4">
                  {audienceSources.map((item) => (
                    <button
                      key={item.source}
                      onClick={() => setSelectedAudience(item.source)}
                      className={`rounded-3xl border p-4 text-left transition ${
                        selectedAudience === item.source
                          ? "border-[#f3dfc1] bg-[#f3dfc1] text-[#160f09] shadow-[0_20px_70px_rgba(216,173,117,0.20)]"
                          : "border-[#d8ad75]/22 bg-[#21170f] text-[#fff7ea] hover:border-[#d8ad75]/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <SourcePill source={item.source} selected={selectedAudience === item.source} />
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            item.status === "Live"
                              ? selectedAudience === item.source
                                ? "bg-[#355b35]/15 text-[#355b35]"
                                : "bg-[#20351f] text-[#b7e4a8]"
                              : selectedAudience === item.source
                              ? "bg-[#160f09]/10 text-[#160f09]/55"
                              : "bg-[#f3dfc1]/10 text-[#e8d1b0]/60"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="mt-4 text-4xl font-black tracking-[-0.05em]">
                        {item.viewers.toLocaleString()}
                      </p>
                      <p className={selectedAudience === item.source ? "text-[#160f09]/55" : "text-[#e8d1b0]/58"}>
                        viewers
                      </p>

                      <div className="mt-4 rounded-2xl border border-current/10 p-3">
                        <p className="text-sm opacity-70">Messages / min</p>
                        <p className="mt-1 text-2xl font-black">{item.messagesPerMinute}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-5 rounded-3xl border border-[#d8ad75]/22 bg-[#21170f] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[#d8ad75]">
                        Selected Source
                      </p>
                      <h3 className="mt-1 flex items-center gap-3 text-3xl font-black tracking-[-0.04em] text-[#fff7ea]">
                        <PlatformLogo source={selectedAudienceData.source} size="lg" />
                        {selectedAudienceData.source} Details
                      </h3>
                    </div>

                    <div className="rounded-2xl border border-[#d8ad75]/22 bg-[#100b07] px-5 py-4">
                      <p className="text-sm text-[#e8d1b0]/50">Growth</p>
                      <p className="text-2xl font-black text-[#c7e6a8]">{selectedAudienceData.growth}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <MiniMetric label="Viewers" value={selectedAudienceData.viewers.toLocaleString()} />
                    <MiniMetric label="Messages/min" value={String(selectedAudienceData.messagesPerMinute)} />
                    <MiniMetric label="Source" value={selectedAudienceData.source} source={selectedAudienceData.source} />
                  </div>

                  <div className="mt-4">
                    <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-[#d8ad75]">
                      Top Chatters
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAudienceData.topChatters.map((chatter) => (
                        <span
                          key={chatter}
                          className="rounded-full border border-[#d8ad75]/22 bg-[#100b07] px-4 py-2 text-sm font-bold text-[#e8d1b0]/76"
                        >
                          {chatter}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_1fr]">
                <Panel title="Audience Pulse">
                  <Pulse label="Twitch" value="60%" width="60%" color="bg-[#8d74bb]" source="Twitch" />
                  <Pulse label="Kick" value="26%" width="26%" color="bg-[#85b86f]" source="Kick" />
                  <Pulse label="X" value="14%" width="14%" color="bg-[#d8c7af]" source="X" />
                  <Pulse label="YouTube" value="0%" width="0%" color="bg-[#b76d63]" source="YouTube" />
                </Panel>

                <Panel title="AI Moment Timeline">
                  <Timeline time="12:04" title="CLIP IT spike" subtitle={`${clipMentions * 6} mentions • ${momentConfidence}% confidence`} />
                  <Timeline time="12:06" title="NO WAY surge" subtitle={`${hypeMentions * 5} reactions`} />
                  <Timeline time="12:09" title="Viewer surge" subtitle="+312 viewers" />
                  <Timeline time="12:11" title="Clip cooldown" subtitle={clipCooldown > 0 ? `Next auto-clip in ${clipCooldown}s` : "Ready for next moment"} />
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

        <aside className="sticky top-0 flex h-screen flex-col border-l border-[#d8ad75]/25 bg-[#17100b]/95 shadow-[-20px_0_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="border-b border-[#d8ad75]/25 bg-[#1f160f] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[#d8ad75]">
              {mode === "Viewer Mode" ? "Live Viewer Chat" : "Native Market Bubble Chat"}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#fff7ea]">Combined Chat</h2>
            <p className="text-sm text-[#e8d1b0]/62">
              {mode === "Viewer Mode"
                ? "Watch and chat with the full Market Bubble audience in one room."
                : "Specific source labels show exactly where every message came from."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {(["All", "Twitch", "Kick", "X", "YouTube"] as const).map((source) => (
                <button
                  key={source}
                  onClick={() => setSelectedSource(source)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
                    selectedSource === source
                      ? "border-[#f3dfc1] bg-[#f3dfc1] text-[#160f09]"
                      : "border-[#d8ad75]/25 bg-[#100b07] text-[#e8d1b0]/72 hover:border-[#d8ad75]/60 hover:text-[#fff7ea]"
                  }`}
                >
                  {source !== "All" && <PlatformLogo source={source} />}
                  {source}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="mt-4">
              <div className="rounded-3xl border border-[#d8ad75]/25 bg-[#100b07] p-3">
                <p className="mb-2 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#d8ad75]">
                  Send to
                  <PlatformLogo source="Twitch" />
                  Twitch +
                  <PlatformLogo source="Kick" />
                  Kick +
                  <PlatformLogo source="X" />
                  X +
                  <PlatformLogo source="YouTube" />
                  YouTube
                </p>

                <div className="flex gap-2">
                  <input
                    value={chatText}
                    onChange={(event) => setChatText(event.target.value)}
                    placeholder={
                      mode === "Viewer Mode"
                        ? "Chat with the whole room..."
                        : "Broadcast a highlighted creator message..."
                    }
                    className="min-w-0 flex-1 rounded-2xl border border-[#d8ad75]/25 bg-[#21170f] px-4 py-3 text-sm text-[#fff7ea] outline-none placeholder:text-[#e8d1b0]/38 focus:border-[#f3dfc1]/70"
                  />

                  <button
                    type="submit"
                    disabled={!chatText.trim()}
                    className="rounded-2xl bg-[#f3dfc1] px-4 py-3 text-sm font-black text-[#160f09] transition hover:bg-[#fff4df] disabled:cursor-not-allowed disabled:bg-[#e8d1b0]/20 disabled:text-[#e8d1b0]/40"
                  >
                    Send
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#0f0a07] p-4">
            {visibleFeedItems.map((item) => {
              if (item.type === "moment") {
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[#d8904f]/55 bg-[#2b190e] p-4 shadow-[0_0_35px_rgba(216,144,79,0.12)]"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="rounded-full border border-[#e8b77d]/45 bg-[#d8904f]/16 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-[#f7c993]">
                        AI Moment
                      </span>
                      <span className="text-xs text-[#f7c993]/65">
                        Cooldown protected
                      </span>
                    </div>

                    <p className="text-lg font-black text-[#fff7ea]">“{item.phrase}” spike detected</p>
                    <p className="mt-2 text-sm leading-6 text-[#f7c993]/78">
                      {item.mentions} mentions across{" "}
                      <InlineSourceList sources={item.sources} /> • {item.confidence}% confidence
                    </p>

                    <button className="mt-4 w-full rounded-xl border border-[#e8b77d]/25 bg-[#100b07] px-4 py-3 text-left text-sm font-bold text-[#f7c993] transition hover:bg-[#3a2112]">
                      {mode === "Viewer Mode" ? "Save Moment" : "Generate Clip from last 30 seconds"}
                    </button>
                  </div>
                );
              }

              const isCreatorMessage = item.role === "creator";

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 transition ${
                    isCreatorMessage
                      ? "border-[#f0cf96]/65 bg-[#3b2a19] shadow-[0_0_36px_rgba(240,207,150,0.13)]"
                      : "border-[#d8ad75]/18 bg-[#1b120c] hover:border-[#d8ad75]/40 hover:bg-[#21170f]"
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <SourcePill source={item.source} />

                    {isCreatorMessage && (
                      <span className="rounded-full border border-[#f0cf96]/55 bg-[#f0cf96]/18 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#f3dfc1]">
                        Creator
                      </span>
                    )}

                    <span className={isCreatorMessage ? "text-sm font-black text-[#f3dfc1]" : "text-sm font-semibold text-[#e8d1b0]/58"}>
                      @{item.user}
                    </span>
                  </div>

                  <p className={isCreatorMessage ? "text-base font-bold leading-6 text-[#fff7ea]" : "text-base leading-6 text-[#f7efe4]"}>
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </aside>
      </section>
    </main>
  );
}

function PlatformLogo({
  source,
  size = "sm",
}: {
  source: Source;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-7 w-7" : size === "md" ? "h-5 w-5" : "h-4 w-4";

  const logos: Record<Source, { src: string; bg: string; label: string }> = {
    Twitch: {
      src: "https://cdn.simpleicons.org/twitch/FFFFFF",
      bg: "bg-[#9146ff]",
      label: "Twitch",
    },
    Kick: {
      src: "https://cdn.simpleicons.org/kick/000000",
      bg: "bg-[#53fc18]",
      label: "Kick",
    },
    X: {
      src: "https://cdn.simpleicons.org/x/000000",
      bg: "bg-[#f3dfc1]",
      label: "X",
    },
    YouTube: {
      src: "https://cdn.simpleicons.org/youtube/FFFFFF",
      bg: "bg-[#ff0033]",
      label: "YouTube",
    },
  };

  const logo = logos[source];

  return (
    <span
      className={`${sizeClass} ${logo.bg} inline-flex shrink-0 items-center justify-center rounded-md p-[3px]`}
      aria-label={`${logo.label} logo`}
    >
      <img src={logo.src} alt="" className="h-full w-full object-contain" />
    </span>
  );
}

function SourcePill({
  source,
  selected = false,
}: {
  source: ChatSource;
  selected?: boolean;
}) {
  if (source === "All Platforms") {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${
          selected
            ? "border-[#160f09]/10 bg-[#160f09]/10 text-[#160f09]"
            : platformStyle(source)
        }`}
      >
        All
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${
        selected
          ? "border-[#160f09]/10 bg-[#160f09]/10 text-[#160f09]"
          : platformStyle(source)
      }`}
    >
      <PlatformLogo source={source} />
      {source}
    </span>
  );
}

function InlineSourceList({ sources }: { sources: Source[] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1 align-middle">
      {sources.map((source, index) => (
        <span key={source} className="inline-flex items-center gap-1">
          <PlatformLogo source={source} />
          <span>{source}</span>
          {index < sources.length - 1 ? <span>,</span> : null}
        </span>
      ))}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#d8ad75]/18 pb-4">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[#d8ad75]">{eyebrow}</p>
        <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#fff7ea]">{title}</h2>
      </div>
      <p className="max-w-xl text-sm leading-6 text-[#e8d1b0]/62">{description}</p>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-3xl border border-[#d8ad75]/22 bg-[#21170f] p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-[#d8ad75]">{label}</p>
      <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#fff7ea]">{value}</h2>
      <p className="mt-2 text-sm text-[#e8d1b0]/60">{sub}</p>
    </div>
  );
}

function WaitingStream({ platform }: { platform: StreamPlatform }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(216,173,117,0.22),transparent_42%),linear-gradient(145deg,#0e0a07,#24180f)]">
      <div className="rounded-[2rem] border border-[#d8ad75]/25 bg-[#100b07]/86 p-10 text-center shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur">
        <p className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.35em] text-[#d8ad75]">
          <PlatformLogo source={platform} />
          {platform} Source
        </p>
        <h2 className="mt-3 text-5xl font-black tracking-[-0.06em] text-[#fff7ea]">Waiting for Stream</h2>
        <p className="mt-3 max-w-md text-[#e8d1b0]/62">
          This slot is ready for the {platform} live player once Market Bubble connects the official stream.
        </p>
      </div>
    </div>
  );
}

function platformStyle(source: ChatSource) {
  if (source === "All Platforms") return "border-[#f0cf96]/50 bg-[#f0cf96]/14 text-[#f3dfc1]";
  if (source === "Kick") return "border-[#86b36b]/45 bg-[#86b36b]/12 text-[#b7e4a8]";
  if (source === "Twitch") return "border-[#9c84c7]/45 bg-[#9c84c7]/12 text-[#d0c0ee]";
  if (source === "YouTube") return "border-[#c9786d]/45 bg-[#c9786d]/12 text-[#e9aaa2]";
  return "border-[#d8c7af]/32 bg-[#d8c7af]/12 text-[#e7d8c6]";
}

function MiniMetric({
  label,
  value,
  source,
}: {
  label: string;
  value: string;
  source?: Source;
}) {
  return (
    <div className="rounded-2xl border border-[#d8ad75]/18 bg-[#100b07] p-4">
      <p className="text-sm text-[#e8d1b0]/50">{label}</p>
      <p className="mt-1 flex items-center gap-2 text-2xl font-black text-[#fff7ea]">
        {source && <PlatformLogo source={source} size="md" />}
        {value}
      </p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-[#d8ad75]/25 bg-[#17100b]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.25)]">
      <h3 className="mb-4 border-b border-[#d8ad75]/18 pb-3 text-xl font-black tracking-[-0.03em] text-[#fff7ea]">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Pulse({
  label,
  value,
  width,
  color,
  source,
}: {
  label: string;
  value: string;
  width: string;
  color: string;
  source: Source;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="flex items-center gap-2 text-[#e8d1b0]/78">
          <PlatformLogo source={source} />
          {label}
        </span>
        <span className="text-[#e8d1b0]/55">{value}</span>
      </div>
      <div className="h-3 rounded-full bg-[#100b07]">
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
    <div className="rounded-2xl border border-[#d8904f]/34 bg-[#2b190e] p-4">
      <p className="text-xs text-[#f7c993]/62">{time}</p>
      <p className="mt-1 font-black text-[#fff7ea]">{title}</p>
      <p className="mt-1 text-sm text-[#f7c993]/70">{subtitle}</p>
    </div>
  );
}

function Action({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <button className="w-full rounded-2xl border border-[#d8ad75]/20 bg-[#100b07] p-4 text-left transition hover:border-[#d8ad75]/50 hover:bg-[#21170f]">
      <p className="font-black text-[#fff7ea]">{title}</p>
      <p className="mt-1 text-sm text-[#e8d1b0]/58">{subtitle}</p>
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
    <div className="rounded-2xl border border-[#d8ad75]/20 bg-[#100b07] p-4">
      <div className="flex items-center justify-between gap-3">
        <SourcePill source={label} />
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            status === "Live" ? "bg-[#20351f] text-[#b7e4a8]" : "bg-[#f3dfc1]/10 text-[#e8d1b0]/60"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="mt-3 text-2xl font-black text-[#fff7ea]">{viewers}</p>
      <p className="text-sm text-[#e8d1b0]/50">viewers</p>
    </div>
  );
}

function ProofLine({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-[#d8ad75]/20 bg-[#100b07] px-4 py-3 text-sm font-bold text-[#e8d1b0]/80">
      ✓ {text}
    </div>
  );
}