"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  FormEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";

type Source = "Twitch" | "Kick" | "X" | "YouTube";
type ChatSource = Source | "All Platforms";
type Mode = "Command Center" | "Live Preview";
type TapeFilter = "all" | "mentions" | "tickers" | "creators" | "hot";

type FeedMessage = {
  id: string;
  source: ChatSource;
  channel: string;
  user: string;
  text: string;
  time: string;
  role?: "creator" | "host" | "mod" | "viewer";
  heat?: "normal" | "hot" | "viral";
};

type SourceConnection = {
  id: string;
  source: Source;
  channel: string;
  viewers: number;
  messagesPerMinute: number;
  status: "Live" | "Ready" | "Replay";
  detail: string;
  growth: string;
};

type MarketPulse = {
  symbol: string;
  price: string;
  change: string;
  points: number[];
  type: "crypto" | "stock";
  mentions: number;
};

type AudienceMember = {
  id: string;
  name: string;
  source: Source;
  channel: string;
  messages: number;
  status: "Active" | "Watching" | "Typing" | "Hot";
};

type AiSignal = {
  id: string;
  title: string;
  subtitle: string;
};

const baseSourceConnections: SourceConnection[] = [
  {
    id: "twitch-marketbubble",
    source: "Twitch",
    channel: "marketbubble",
    viewers: 4812,
    messagesPerMinute: 93,
    status: "Live",
    detail: "Twitch live player + IRC-style chat feed",
    growth: "+4.2%",
  },
  {
    id: "kick-marketbubble",
    source: "Kick",
    channel: "marketbubble",
    viewers: 2101,
    messagesPerMinute: 74,
    status: "Live",
    detail: "Kick live socket feed",
    growth: "+7.8%",
  },
  {
    id: "x-marketbubble",
    source: "X",
    channel: "marketbubble",
    viewers: 1149,
    messagesPerMinute: 46,
    status: "Replay",
    detail: "X public social stream",
    growth: "+2.1%",
  },
  {
    id: "youtube-marketbubble",
    source: "YouTube",
    channel: "marketbubble",
    viewers: 867,
    messagesPerMinute: 21,
    status: "Live",
    detail: "YouTube live chat demo source",
    growth: "+1.6%",
  },
];

const marketPulses: MarketPulse[] = [
  { symbol: "PEPE", price: "$0.00000265", change: "-8.5%", points: [68, 64, 66, 59, 61, 55, 51, 49], type: "crypto", mentions: 28 },
  { symbol: "DOGE", price: "$0.0808", change: "-6.3%", points: [72, 70, 66, 65, 60, 58, 56, 52], type: "crypto", mentions: 18 },
  { symbol: "SOL", price: "$62.96", change: "-6.6%", points: [80, 76, 73, 75, 68, 64, 60, 56], type: "crypto", mentions: 42 },
  { symbol: "BTC", price: "$60,686", change: "-3.1%", points: [74, 73, 70, 71, 67, 66, 64, 62], type: "crypto", mentions: 35 },
  { symbol: "ETH", price: "$1,564", change: "-9.6%", points: [82, 76, 72, 70, 65, 60, 54, 48], type: "crypto", mentions: 31 },
  { symbol: "WIF", price: "$0.149", change: "-7.2%", points: [69, 68, 64, 59, 60, 53, 50, 46], type: "crypto", mentions: 21 },
  { symbol: "BONK", price: "$0.00000423", change: "-8.9%", points: [79, 72, 70, 65, 63, 56, 51, 47], type: "crypto", mentions: 19 },
  { symbol: "TSLA", price: "$178.20", change: "+2.4%", points: [42, 45, 44, 49, 52, 55, 58, 61], type: "stock", mentions: 16 },
  { symbol: "NVDA", price: "$1,207.40", change: "+4.8%", points: [50, 52, 57, 55, 61, 66, 70, 76], type: "stock", mentions: 23 },
  { symbol: "AAPL", price: "$193.14", change: "+1.1%", points: [44, 45, 47, 48, 47, 50, 51, 53], type: "stock", mentions: 12 },
];

const seedMessages: FeedMessage[] = [
  { id: "seed-1", source: "Kick", channel: "marketbubble", user: "rugpull_radar", text: "watching from 3 platforms at once now haha", time: "10:54" },
  { id: "seed-2", source: "X", channel: "marketbubble", user: "csuite_stan", text: "kick chat is wild today", time: "10:54" },
  { id: "seed-3", source: "YouTube", channel: "marketbubble", user: "ytbull", text: "YouTube chat is live too, this is clean", time: "10:54" },
  { id: "seed-4", source: "X", channel: "marketbubble", user: "copytrader", text: "the source labels are so useful", time: "10:54" },
  { id: "seed-5", source: "Twitch", channel: "marketbubble", user: "chad_thundercock", text: "LFG 🚀", time: "10:55", heat: "hot" },
  { id: "seed-6", source: "Kick", channel: "marketbubble", user: "sol_sniper76", text: "ratio 🫡 $SOL", time: "10:55" },
  { id: "seed-7", source: "Twitch", channel: "marketbubble", user: "scalp_king29", text: "ser this is a wendys $MOG", time: "10:55" },
  { id: "seed-8", source: "YouTube", channel: "marketbubble", user: "livestreammax", text: "finally one chat for every app", time: "10:55" },
  { id: "seed-9", source: "Kick", channel: "marketbubble", user: "bubblewatcher", text: "bullish on $TSLA and the team", time: "10:56" },
  { id: "seed-10", source: "Twitch", channel: "marketbubble", user: "degenmike86", text: "market bubble c-suite assemble $ETH", time: "10:56" },
  { id: "seed-11", source: "X", channel: "marketbubble", user: "jackcrypto", text: "the source labels are so useful $WIF", time: "10:56" },
];

const liveMessagePool = [
  "down bad rn $WIF",
  "chat is this real",
  "kick chat is wild today",
  "vibe code challenge winner right here",
  "market bubble c-suite assemble $PUMP",
  "@MarketBubble this actually solves split audiences",
  "send this to Banks",
  "CLIP IT CLIP IT CLIP IT",
  "YouTube chat showing up too is crazy",
  "$NVDA moving like chat velocity",
  "one creator message going to every platform is wild",
  "this feels like a Bloomberg terminal for stream chats",
  "Twitch chat and Kick chat finally in one place",
  "chat is moving too fast lol",
  "someone clip that",
  "source labels make moderation easier",
  "$SOL holders waking up",
  "viewer map is actually useful",
  "this should be native on every stream",
  "wait you can add channels too?",
];

const liveUsers = [
  "diamondhandz",
  "wagmi_andy",
  "degenmike",
  "csuite_stan",
  "satoshis_cousin",
  "candle_god12",
  "greenmarket",
  "bullishmaxi",
  "clipboss",
  "ytwaiting",
  "nvda_bull",
  "rugpull_radar",
  "modking",
  "pumpfriend",
  "chartwizard",
  "based_dev",
  "fomo_frank",
  "bubblewatcher",
  "marketmax",
  "streamrat",
];

const audienceMembers: AudienceMember[] = [
  { id: "1", name: "rugpull_radar", source: "Kick", channel: "marketbubble", messages: 18, status: "Hot" },
  { id: "2", name: "copytrader", source: "X", channel: "marketbubble", messages: 11, status: "Active" },
  { id: "3", name: "chad_thundercock", source: "Twitch", channel: "marketbubble", messages: 14, status: "Typing" },
  { id: "4", name: "sol_sniper76", source: "Kick", channel: "marketbubble", messages: 9, status: "Watching" },
  { id: "5", name: "scalp_king29", source: "Twitch", channel: "marketbubble", messages: 16, status: "Hot" },
  { id: "6", name: "funding_rate", source: "X", channel: "marketbubble", messages: 7, status: "Active" },
  { id: "7", name: "bubblewatcher", source: "Kick", channel: "marketbubble", messages: 13, status: "Typing" },
  { id: "8", name: "degenmike86", source: "Twitch", channel: "marketbubble", messages: 15, status: "Active" },
  { id: "9", name: "ytbull", source: "YouTube", channel: "marketbubble", messages: 8, status: "Active" },
  { id: "10", name: "livestreammax", source: "YouTube", channel: "marketbubble", messages: 7, status: "Watching" },
  { id: "11", name: "jackcrypto", source: "X", channel: "marketbubble", messages: 6, status: "Watching" },
  { id: "12", name: "based_dev", source: "Kick", channel: "marketbubble", messages: 12, status: "Active" },
  { id: "13", name: "memecoin_mae", source: "Kick", channel: "marketbubble", messages: 17, status: "Hot" },
  { id: "14", name: "topblast", source: "X", channel: "marketbubble", messages: 5, status: "Watching" },
  { id: "15", name: "diamondhandz", source: "Twitch", channel: "marketbubble", messages: 13, status: "Active" },
  { id: "16", name: "wagmi_andy", source: "Kick", channel: "marketbubble", messages: 10, status: "Typing" },
  { id: "17", name: "csuite_stan", source: "Twitch", channel: "marketbubble", messages: 21, status: "Hot" },
  { id: "18", name: "greenmarket", source: "X", channel: "marketbubble", messages: 9, status: "Active" },
  { id: "19", name: "bullishmaxi", source: "Kick", channel: "marketbubble", messages: 14, status: "Hot" },
  { id: "20", name: "clipboss", source: "Twitch", channel: "marketbubble", messages: 19, status: "Typing" },
  { id: "21", name: "ytwaiting", source: "YouTube", channel: "marketbubble", messages: 5, status: "Watching" },
  { id: "22", name: "satoshis_cousin", source: "Twitch", channel: "marketbubble", messages: 8, status: "Active" },
  { id: "23", name: "candle_god", source: "Kick", channel: "marketbubble", messages: 11, status: "Active" },
  { id: "24", name: "apeorbid", source: "X", channel: "marketbubble", messages: 4, status: "Watching" },
];

const baseAiSignals: AiSignal[] = [
  { id: "ai-1", title: "CLIP IT spike", subtitle: "24 mentions across Twitch + Kick + X + YouTube" },
  { id: "ai-2", title: "$SOL heat rising", subtitle: "Cash tag velocity up 34%" },
  { id: "ai-3", title: "Kick viewer rush", subtitle: "+312 joined the floor in 60 sec" },
];

function currentTime() {
  return new Date()
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    .replace(/\s?(AM|PM)$/i, "");
}

function cleanChannelName(value: string) {
  return value.trim().replace("@", "").replace("#", "").replace(/\s+/g, "").toLowerCase();
}

function normalizeTicker(value: string) {
  return value.replace("$", "").toUpperCase();
}

function getTickerData(ticker: string) {
  const normalized = normalizeTicker(ticker);

  return (
    marketPulses.find((item) => item.symbol.toUpperCase() === normalized) ?? {
      symbol: normalized,
      price: "$0.042",
      change: "+3.7%",
      points: [40, 42, 41, 45, 49, 47, 53, 58],
      type: "crypto" as const,
      mentions: 9,
    }
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("Command Center");
  const [sourceList, setSourceList] = useState<SourceConnection[]>(baseSourceConnections);
  const [feedMessages, setFeedMessages] = useState<FeedMessage[]>(seedMessages);
  const [aiSignals, setAiSignals] = useState<AiSignal[]>(baseAiSignals);
  const [selectedSource, setSelectedSource] = useState<Source | "All">("All");
  const [selectedChannelId, setSelectedChannelId] = useState("twitch-marketbubble");
  const [selectedAnalyticsId, setSelectedAnalyticsId] = useState("twitch-marketbubble");
  const [searchQuery, setSearchQuery] = useState("");
  const [tapeFilter, setTapeFilter] = useState<TapeFilter>("all");
  const [broadcastText, setBroadcastText] = useState("");
  const [viewerChatText, setViewerChatText] = useState("");
  const [feedPaused, setFeedPaused] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [temporaryBroadcast, setTemporaryBroadcast] = useState<FeedMessage | null>(null);
  const [pinnedBroadcast, setPinnedBroadcast] = useState<FeedMessage | null>(null);

  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("Which platform is carrying the room?");
  const [pollOptions, setPollOptions] = useState(["Twitch", "Kick", "X", "YouTube"]);
  const [pollTargets, setPollTargets] = useState<Source[]>(["Twitch", "Kick", "X", "YouTube"]);

  const nextMessageIndex = useRef(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const selectedChannel =
    sourceList.find((item) => item.id === selectedChannelId) ?? sourceList[0];

  const selectedAnalytics =
    sourceList.find((item) => item.id === selectedAnalyticsId) ?? selectedChannel;

  const totalViewers = sourceList.reduce((sum, item) => sum + item.viewers, 0);

  const messagesPerMinute = sourceList.reduce(
    (sum, item) => sum + item.messagesPerMinute,
    0
  );

  const activeFeeds = sourceList.filter((item) => item.status !== "Ready").length;

  const liveActivity =
    messagesPerMinute >= 180 && activeFeeds >= 3
      ? "High"
      : messagesPerMinute >= 85
      ? "Medium"
      : "Low";

  const filteredMessages = useMemo(() => {
    return feedMessages.filter((message) => {
      const sourceMatch =
        selectedSource === "All" ||
        message.source === selectedSource ||
        message.source === "All Platforms";

      const lowerQuery = searchQuery.toLowerCase();

      const searchMatch =
        !searchQuery.trim() ||
        message.user.toLowerCase().includes(lowerQuery) ||
        message.text.toLowerCase().includes(lowerQuery) ||
        message.channel.toLowerCase().includes(lowerQuery);

      const filterMatch =
        tapeFilter === "all" ||
        (tapeFilter === "mentions" && message.text.includes("@")) ||
        (tapeFilter === "tickers" && /\$[A-Za-z]{2,10}/.test(message.text)) ||
        (tapeFilter === "creators" && message.role === "creator") ||
        (tapeFilter === "hot" && (message.heat === "hot" || message.heat === "viral"));

      return sourceMatch && searchMatch && filterMatch;
    });
  }, [feedMessages, selectedSource, searchQuery, tapeFilter]);

  const sourceFlow = useMemo(() => {
    const totals: Record<Source, number> = {
      Twitch: 0,
      Kick: 0,
      X: 0,
      YouTube: 0,
    };

    sourceList.forEach((item) => {
      totals[item.source] += item.messagesPerMinute;
    });

    const total = Object.values(totals).reduce((sum, value) => sum + value, 0) || 1;

    return (Object.keys(totals) as Source[]).map((source) => ({
      source,
      messagesPerMinute: totals[source],
      percent: Math.round((totals[source] / total) * 100),
    }));
  }, [sourceList]);

  const viewerBreakdown = useMemo(() => {
    const totals: Record<Source, number> = {
      Twitch: 0,
      Kick: 0,
      X: 0,
      YouTube: 0,
    };

    sourceList.forEach((item) => {
      totals[item.source] += item.viewers;
    });

    const total = Object.values(totals).reduce((sum, value) => sum + value, 0) || 1;

    return (Object.keys(totals) as Source[]).map((source) => ({
      source,
      viewers: totals[source],
      percent: Math.round((totals[source] / total) * 100),
    }));
  }, [sourceList]);

  const visibleBroadcast = pinnedBroadcast ?? temporaryBroadcast;

  useEffect(() => {
    if (!autoScroll) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [filteredMessages.length, autoScroll]);

  function pushCreatorBroadcast(text: string, temporaryMs = 12000) {
    const message: FeedMessage = {
      id: `creator-${Date.now()}`,
      source: "All Platforms",
      channel: "marketbubble",
      user: "Market Bubble",
      text,
      time: currentTime(),
      role: "creator",
      heat: "viral",
    };

    setFeedMessages((current) => [...current, message].slice(-110));
    setTemporaryBroadcast(message);

    setTimeout(() => {
      setTemporaryBroadcast((current) => (current?.id === message.id ? null : current));
    }, temporaryMs);

    return message;
  }

  function handleBroadcast(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = broadcastText.trim();

    if (!trimmedMessage) {
      return;
    }

    pushCreatorBroadcast(trimmedMessage, 14000);
    setBroadcastText("");
  }

  function handleViewerChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = viewerChatText.trim();

    if (!trimmedMessage) {
      return;
    }

    const activeSource =
      selectedSource !== "All"
        ? selectedSource
        : selectedChannel?.source ?? "Twitch";

    const targetChannel =
      selectedChannel?.source === activeSource
        ? selectedChannel.channel
        : sourceList.find((item) => item.source === activeSource)?.channel ?? "marketbubble";

    const viewerMessage: FeedMessage = {
      id: `viewer-${Date.now()}`,
      source: activeSource,
      channel: targetChannel,
      user: "you",
      text: trimmedMessage,
      time: currentTime(),
      role: "viewer",
      heat: /\$[A-Za-z]{2,10}/.test(trimmedMessage) ? "hot" : "normal",
    };

    setFeedMessages((current) => [...current, viewerMessage].slice(-110));
    setViewerChatText("");
  }

  function clearFeed() {
    setFeedMessages((current) => current.filter((message) => message.role === "creator"));
  }

  function pinMessage(message: FeedMessage) {
    setPinnedBroadcast(message);
    setTemporaryBroadcast(null);
  }

  function unpinMessage() {
    setPinnedBroadcast(null);
  }

  function pinLatestBroadcast() {
    const latest = [...feedMessages].reverse().find((message) => message.role === "creator");

    if (!latest) {
      setAiSignals((current) => [
        {
          id: `pin-${Date.now()}`,
          title: "No broadcast to pin yet",
          subtitle: "Send a creator broadcast first, then pin it to the top.",
        },
        ...current,
      ].slice(0, 6));

      return;
    }

    pinMessage(latest);
  }

  function addLiveChannel(channelName: string, source: Source) {
    const channel = cleanChannelName(channelName);

    if (!channel) {
      return;
    }

    const duplicate = sourceList.some(
      (item) =>
        item.source === source && item.channel.toLowerCase() === channel.toLowerCase()
    );

    if (duplicate) {
      setAiSignals((current) => [
        {
          id: `duplicate-${Date.now()}`,
          title: "Duplicate source blocked",
          subtitle: `${source} / ${channel} is already on the Command Center.`,
        },
        ...current,
      ].slice(0, 6));

      return;
    }

    const id = `${source.toLowerCase()}-${channel}-${Date.now()}`;

    const newSource: SourceConnection = {
      id,
      source,
      channel,
      viewers: Math.floor(180 + Math.random() * 1800),
      messagesPerMinute: Math.floor(12 + Math.random() * 70),
      status: source === "X" ? "Replay" : "Live",
      detail:
        source === "Twitch"
          ? "New Twitch live player + chat feed"
          : source === "Kick"
          ? "New Kick socket feed"
          : source === "X"
          ? "New X public social stream"
          : "New YouTube live chat source",
      growth: `+${(1 + Math.random() * 8).toFixed(1)}%`,
    };

    setSourceList((current) => [newSource, ...current].slice(0, 10));
    setSelectedChannelId(id);
    setSelectedAnalyticsId(id);

    setAiSignals((current) => [
      {
        id: `added-${Date.now()}`,
        title: "Channel added",
        subtitle: `${source} / ${channel} is now connected to the Command Center.`,
      },
      ...current,
    ].slice(0, 6));
  }

  function removeChannel(id: string) {
    if (sourceList.length <= 1) {
      setAiSignals((current) => [
        {
          id: `keep-${Date.now()}`,
          title: "Keep one source connected",
          subtitle: "The floor needs at least one source to stay live.",
        },
        ...current,
      ].slice(0, 6));

      return;
    }

    const removed = sourceList.find((item) => item.id === id);
    const nextList = sourceList.filter((item) => item.id !== id);
    const fallback = nextList[0];

    setSourceList(nextList);

    if (selectedChannelId === id && fallback) {
      setSelectedChannelId(fallback.id);
    }

    if (selectedAnalyticsId === id && fallback) {
      setSelectedAnalyticsId(fallback.id);
    }

    if (removed) {
      setAiSignals((current) => [
        {
          id: `removed-${Date.now()}`,
          title: "Channel removed",
          subtitle: `${removed.source} / ${removed.channel} was removed from the floor.`,
        },
        ...current,
      ].slice(0, 6));
    }
  }

  function handleClip() {
    const signal: AiSignal = {
      id: `ai-${Date.now()}`,
      title: "Clip queued",
      subtitle: "Last 30 seconds marked for review across all connected feeds.",
    };

    setAiSignals((current) => [signal, ...current].slice(0, 6));
  }

  function openPollBuilder() {
    setShowPollBuilder(true);
  }

  function togglePollTarget(source: Source) {
    setPollTargets((current) =>
      current.includes(source)
        ? current.filter((item) => item !== source)
        : [...current, source]
    );
  }

  function updatePollOption(index: number, value: string) {
    setPollOptions((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item))
    );
  }

  function launchPoll() {
    const cleanQuestion = pollQuestion.trim();
    const cleanOptions = pollOptions.map((option) => option.trim()).filter(Boolean);

    if (!cleanQuestion || cleanOptions.length < 2 || pollTargets.length === 0) {
      setAiSignals((current) => [
        {
          id: `poll-error-${Date.now()}`,
          title: "Poll needs more info",
          subtitle: "Add a question, at least 2 options, and choose at least 1 platform.",
        },
        ...current,
      ].slice(0, 6));

      return;
    }

    const pollText = `POLL: ${cleanQuestion} — ${cleanOptions.join(" / ")} — sent to ${pollTargets.join(", ")}`;

    pushCreatorBroadcast(pollText, 16000);

    setAiSignals((current) => [
      {
        id: `poll-${Date.now()}`,
        title: "Poll launched",
        subtitle: `Sent to ${pollTargets.length} platform${pollTargets.length === 1 ? "" : "s"} with ${cleanOptions.length} options.`,
      },
      ...current,
    ].slice(0, 6));

    setShowPollBuilder(false);
  }

  function simulateViralSpike() {
    const activeSources = sourceList.filter((item) => item.status !== "Ready");

    const newMessages: FeedMessage[] = Array.from({ length: 14 }).map((_, index) => {
      const connection = activeSources[index % activeSources.length] ?? sourceList[0];
      const text = liveMessagePool[(nextMessageIndex.current + index) % liveMessagePool.length];
      const user = liveUsers[(nextMessageIndex.current + index) % liveUsers.length];

      return {
        id: `spike-${Date.now()}-${index}`,
        source: connection.source,
        channel: connection.channel,
        user,
        text,
        time: currentTime(),
        heat: index % 4 === 0 ? "viral" : index % 2 === 0 ? "hot" : "normal",
      };
    });

    setFeedMessages((current) => [...current.slice(-80), ...newMessages]);
    setAiSignals((current) => [
      {
        id: `viral-${Date.now()}`,
        title: "Viral spike simulated",
        subtitle: "14 new messages entered the chat across connected channels.",
      },
      ...current,
    ].slice(0, 6));

    nextMessageIndex.current += 14;
  }

  useEffect(() => {
    if (feedPaused) {
      return;
    }

    const timer = setInterval(() => {
      const activeSources = sourceList.filter((item) => item.status !== "Ready");
      const connection = activeSources[nextMessageIndex.current % activeSources.length] ?? sourceList[0];
      const text = liveMessagePool[nextMessageIndex.current % liveMessagePool.length];
      const user = liveUsers[nextMessageIndex.current % liveUsers.length];

      setFeedMessages((current) => [
        ...current.slice(-108),
        {
          id: `live-${Date.now()}-${nextMessageIndex.current}`,
          source: connection.source,
          channel: connection.channel,
          user,
          text,
          time: currentTime(),
          heat:
            text.includes("CLIP") || text.includes("winner")
              ? "viral"
              : text.includes("$") || text.includes("crazy")
              ? "hot"
              : "normal",
        },
      ]);

      nextMessageIndex.current += 1;
    }, 1550);

    return () => clearInterval(timer);
  }, [feedPaused, sourceList]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#070604] text-[#fff7ea]">
      <style>{`
        @keyframes market-crawl {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .market-crawl-track {
          animation: market-crawl 34s linear infinite;
        }

        .market-crawl-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_0%,rgba(216,173,117,0.18),transparent_32%),radial-gradient(circle_at_80%_15%,rgba(124,58,237,0.18),transparent_26%),linear-gradient(180deg,#110d08_0%,#070604_55%,#040303_100%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.05] [background-image:linear-gradient(rgba(255,244,223,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,244,223,0.7)_1px,transparent_1px)] [background-size:44px_44px]" />

      {showPollBuilder && (
        <PollBuilderModal
          question={pollQuestion}
          options={pollOptions}
          targets={pollTargets}
          setQuestion={setPollQuestion}
          updateOption={updatePollOption}
          toggleTarget={togglePollTarget}
          launchPoll={launchPoll}
          close={() => setShowPollBuilder(false)}
        />
      )}

      <header className="flex h-[58px] items-center justify-between border-b border-[#d8ad75]/20 bg-[#120d08]/95 px-4 shadow-[0_16px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_35%_25%,#f3dfc1,#d8ad75_42%,#7c3aed_72%,#100b07)] shadow-[0_0_34px_rgba(216,173,117,0.38)]">
            <span className="h-3 w-3 rounded-full bg-[#fff7ea]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black leading-none text-[#fff7ea]">
                Market Bubble
              </h1>
              <span className="rounded-md border border-[#d8ad75]/25 bg-[#d8ad75]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#d8ad75]">
                Command Center
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#e8d1b0]/45">
              Live chat for every platform.
            </p>
          </div>

          <div className="ml-5 hidden items-center gap-5 lg:flex">
            <TopMetric label="Live" value="ON" tone="green" />
            <TopMetric label="Audience" value={totalViewers.toLocaleString()} tone="gold" />
            <TopMetric label="Feeds" value={String(activeFeeds)} tone="purple" />
            <TopMetric label="Msgs / Min" value={String(messagesPerMinute)} tone="blue" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(["Command Center", "Live Preview"] as Mode[]).map((item) => (
            <button
              key={item}
              onClick={() => setMode(item)}
              className={`rounded-full border px-4 py-2 text-xs font-black transition ${
                mode === item
                  ? "border-[#f3dfc1] bg-[#f3dfc1] text-[#160f09] shadow-[0_0_30px_rgba(216,173,117,0.24)]"
                  : "border-[#d8ad75]/20 bg-[#100b07] text-[#e8d1b0]/58 hover:border-[#d8ad75]/45 hover:text-[#fff7ea]"
              }`}
            >
              {item}
            </button>
          ))}

          <div className="rounded-full border border-[#22c55e]/25 bg-[#22c55e]/10 px-4 py-2 text-xs font-black text-[#86efac]">
            ● LIVE
          </div>
        </div>
      </header>

      <MarketPulseRibbon />

      {mode === "Command Center" ? (
        <section className="grid h-[calc(100vh-98px)] grid-cols-1 gap-3 overflow-visible p-3 xl:grid-cols-[345px_minmax(0,1fr)_390px]">
          <LeftFloorColumn
            selectedChannel={selectedChannel}
            selectedChannelId={selectedChannelId}
            setSelectedChannelId={setSelectedChannelId}
            setSelectedAnalyticsId={setSelectedAnalyticsId}
            sourceList={sourceList}
            addLiveChannel={addLiveChannel}
            removeChannel={removeChannel}
          />

          <section className="flex min-h-0 flex-col overflow-hidden rounded-[1.65rem] border border-[#d8ad75]/18 bg-[#120d08]/88 shadow-[0_24px_90px_rgba(0,0,0,0.36)]">
            <div className="border-b border-[#d8ad75]/18 bg-[#1a120b] p-3">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#d8ad75]">
                    Live Chat
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <SourceIconRow includeYouTube />
                  <button
                    onClick={() => setAutoScroll((current) => !current)}
                    className={`rounded-xl border px-3 py-2 text-xs font-black ${
                      autoScroll
                        ? "border-[#22c55e]/35 bg-[#22c55e]/12 text-[#86efac]"
                        : "border-[#d8ad75]/18 bg-[#100b07] text-[#e8d1b0]/45"
                    }`}
                  >
                    Auto-scroll {autoScroll ? "ON" : "OFF"}
                  </button>
                  <button
                    onClick={() => setFeedPaused((current) => !current)}
                    className="rounded-lg border border-[#d8ad75]/18 bg-[#100b07] px-2.5 py-1.5 text-xs font-black text-[#e8d1b0]/65 hover:text-[#fff7ea]"
                  >
                    {feedPaused ? "Resume" : "Pause"}
                  </button>
                  <button
                    onClick={clearFeed}
                    className="rounded-lg border border-[#d8ad75]/18 bg-[#100b07] px-2.5 py-1.5 text-xs font-black text-[#e8d1b0]/65 hover:text-[#fff7ea]"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {visibleBroadcast && (
                <CreatorBroadcastBanner
                  message={visibleBroadcast}
                  pinned={!!pinnedBroadcast}
                  onPin={() => pinMessage(visibleBroadcast)}
                  onUnpin={unpinMessage}
                />
              )}

              <div className="relative mt-2">
                <div className="flex items-center gap-2 rounded-xl border border-[#d8ad75]/18 bg-[#080604] px-3 py-2">
                  <span className="text-[#d8ad75]/60">⌕</span>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onFocus={() => setShowFilterMenu(true)}
                    placeholder="Search live chat: users, @mentions, $tickers, or phrases..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-[#fff7ea] outline-none placeholder:text-[#e8d1b0]/30"
                  />
                  <button
                    onClick={() => setShowFilterMenu((current) => !current)}
                    className="rounded-lg border border-[#d8ad75]/18 bg-[#d8ad75]/10 px-2 py-1 text-[11px] font-black text-[#d8ad75]"
                  >
                    ⌘K
                  </button>
                </div>

                {showFilterMenu && (
                  <div className="absolute left-8 top-12 z-40 w-[430px] overflow-hidden rounded-2xl border border-[#d8ad75]/28 bg-[#15100b]/98 p-2 shadow-[0_30px_100px_rgba(0,0,0,0.72)] backdrop-blur-xl">
                    <FilterOption label="Show all messages" active={tapeFilter === "all"} onClick={() => { setTapeFilter("all"); setShowFilterMenu(false); }} />
                    <FilterOption label="Only @mentions" active={tapeFilter === "mentions"} onClick={() => { setTapeFilter("mentions"); setShowFilterMenu(false); }} />
                    <FilterOption label="Only $cash tags" active={tapeFilter === "tickers"} onClick={() => { setTapeFilter("tickers"); setShowFilterMenu(false); }} />
                    <FilterOption label="Only Market Bubble creator messages" active={tapeFilter === "creators"} onClick={() => { setTapeFilter("creators"); setShowFilterMenu(false); }} />
                    <FilterOption label="Only hot / viral messages" active={tapeFilter === "hot"} onClick={() => { setTapeFilter("hot"); setShowFilterMenu(false); }} />

                    <div className="mt-2 rounded-xl border border-[#d8ad75]/24 bg-[#d8ad75]/10 px-3 py-2 text-xs font-black text-[#f3dfc1]">
                      ⌘K · Filter the chat without losing the live stream.
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {(["All", "Twitch", "Kick", "X", "YouTube"] as const).map((source) => (
                  <button
                    key={source}
                    onClick={() => setSelectedSource(source)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-black transition ${
                      selectedSource === source
                        ? "border-[#f3dfc1] bg-[#f3dfc1] text-[#160f09]"
                        : "border-[#d8ad75]/18 bg-[#100b07] text-[#e8d1b0]/55 hover:border-[#d8ad75]/45 hover:text-[#fff7ea]"
                    }`}
                  >
                    {source !== "All" && <PlatformLogo source={source} />}
                    {source}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2 pb-3">
              <div className="space-y-1.5">
                {filteredMessages.map((message) => (
                  <TapeRow key={message.id} message={message} onPin={() => pinMessage(message)} />
                ))}

                <div ref={chatEndRef} />
              </div>
            </div>

            <form onSubmit={handleBroadcast} className="border-t border-[#d8ad75]/18 bg-[#100b07] p-2">
              <div className="mb-1.5 flex flex-wrap gap-1.5">
                <CreatorToolButton label="Clip last 30 sec" onClick={handleClip} />
                <CreatorToolButton label="Start poll" onClick={openPollBuilder} />
                <CreatorToolButton label={pinnedBroadcast ? "Unpin broadcast" : "Pin latest broadcast"} onClick={pinnedBroadcast ? unpinMessage : pinLatestBroadcast} />
                <CreatorToolButton label="Simulate viral spike" onClick={simulateViralSpike} />
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[#d8ad75]/28 bg-[#080604] px-3 py-1.5 shadow-[0_0_34px_rgba(216,173,117,0.08)]">
                <SourceIconRow includeYouTube />
                <input
                  value={broadcastText}
                  onChange={(event) => setBroadcastText(event.target.value)}
                  placeholder="Type once. Broadcast everywhere."
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#fff7ea] outline-none placeholder:text-[#e8d1b0]/30"
                />
                <button
                  type="submit"
                  disabled={!broadcastText.trim()}
                  className="rounded-lg bg-[#f3dfc1] px-3 py-1.5 text-xs font-black text-[#160f09] transition hover:bg-[#fff7ea] disabled:cursor-not-allowed disabled:bg-[#e8d1b0]/15 disabled:text-[#e8d1b0]/35"
                >
                  Send to all
                </button>
              </div>
            </form>
          </section>

          <RightFloorColumn
            totalViewers={totalViewers}
            filteredCount={filteredMessages.length}
            messagesPerMinute={messagesPerMinute}
            activeFeeds={activeFeeds}
            sourceFlow={sourceFlow}
            viewerBreakdown={viewerBreakdown}
            liveActivity={liveActivity}
            aiSignals={aiSignals}
            sourceList={sourceList}
            selectedAnalytics={selectedAnalytics}
            selectedAnalyticsId={selectedAnalyticsId}
            setSelectedAnalyticsId={setSelectedAnalyticsId}
            setSelectedChannelId={setSelectedChannelId}
            handleClip={handleClip}
            openPollBuilder={openPollBuilder}
            pinLatestBroadcast={pinLatestBroadcast}
          />
        </section>
      ) : (
        <ViewerRoom
          selectedChannel={selectedChannel}
          setSelectedChannelId={setSelectedChannelId}
          sourceList={sourceList}
          filteredMessages={filteredMessages}
          selectedSource={selectedSource}
          setSelectedSource={setSelectedSource}
          viewerChatText={viewerChatText}
          setViewerChatText={setViewerChatText}
          handleViewerChat={handleViewerChat}
        />
      )}
    </main>
  );
}

function MarketPulseRibbon() {
  const tickerItems = [...marketPulses, ...marketPulses];

  return (
    <div className="flex h-10 items-center gap-4 overflow-hidden border-b border-[#d8ad75]/18 bg-[#0b0805] px-4">
      <div className="z-10 flex shrink-0 items-center gap-2 bg-[#0b0805] pr-4">
        <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d8ad75]">
          Market Pulse
        </span>
      </div>

      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="market-crawl-track flex w-max items-center gap-8">
          {tickerItems.map((item, index) => (
            <div key={`${item.symbol}-${index}`} className="flex shrink-0 items-center gap-2">
              <span className="text-[11px] font-black text-[#fff7ea]">{item.symbol}</span>
              <span className="text-[11px] text-[#e8d1b0]/55">{item.price}</span>
              <span className={`text-[11px] font-black ${item.change.startsWith("+") ? "text-[#86efac]" : "text-[#fb7185]"}`}>
                {item.change}
              </span>
              <Sparkline points={item.points} positive={item.change.startsWith("+")} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PollBuilderModal({
  question,
  options,
  targets,
  setQuestion,
  updateOption,
  toggleTarget,
  launchPoll,
  close,
}: {
  question: string;
  options: string[];
  targets: Source[];
  setQuestion: (value: string) => void;
  updateOption: (index: number, value: string) => void;
  toggleTarget: (source: Source) => void;
  launchPoll: () => void;
  close: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[1.5rem] border border-[#d8ad75]/25 bg-[#120d08] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.72)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#d8ad75]">
              Creator Poll Builder
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#fff7ea]">
              Build a poll for every platform
            </h2>
          </div>

          <button
            onClick={close}
            className="rounded-xl border border-[#d8ad75]/18 bg-[#080604] px-3 py-2 text-xs font-black text-[#e8d1b0]/60 hover:text-[#fff7ea]"
          >
            Close
          </button>
        </div>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-[#e8d1b0]/45">
            Poll question
          </span>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#d8ad75]/18 bg-[#080604] px-4 py-3 text-sm font-bold text-[#fff7ea] outline-none placeholder:text-[#e8d1b0]/28"
            placeholder="Ask the audience something..."
          />
        </label>

        <div className="mt-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e8d1b0]/45">
            Options
          </p>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {options.map((option, index) => (
              <input
                key={index}
                value={option}
                onChange={(event) => updateOption(index, event.target.value)}
                className="rounded-2xl border border-[#d8ad75]/18 bg-[#080604] px-4 py-3 text-sm font-bold text-[#fff7ea] outline-none placeholder:text-[#e8d1b0]/28"
                placeholder={`Option ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e8d1b0]/45">
            Send to
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {(["Twitch", "Kick", "X", "YouTube"] as Source[]).map((source) => (
              <button
                key={source}
                type="button"
                onClick={() => toggleTarget(source)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black ${
                  targets.includes(source)
                    ? "border-[#f3dfc1] bg-[#f3dfc1] text-[#160f09]"
                    : "border-[#d8ad75]/18 bg-[#080604] text-[#e8d1b0]/55"
                }`}
              >
                <PlatformLogo source={source} />
                {source}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={launchPoll}
          className="mt-5 w-full rounded-2xl bg-[#f3dfc1] px-4 py-3 text-sm font-black text-[#160f09] hover:bg-[#fff7ea]"
        >
          Launch Poll Across Selected Platforms
        </button>
      </div>
    </div>
  );
}

function LeftFloorColumn({
  selectedChannel,
  selectedChannelId,
  setSelectedChannelId,
  setSelectedAnalyticsId,
  sourceList,
  addLiveChannel,
  removeChannel,
}: {
  selectedChannel: SourceConnection;
  selectedChannelId: string;
  setSelectedChannelId: (id: string) => void;
  setSelectedAnalyticsId: (id: string) => void;
  sourceList: SourceConnection[];
  addLiveChannel: (channelName: string, source: Source) => void;
  removeChannel: (id: string) => void;
}) {
  const [newChannel, setNewChannel] = useState("");
  const [newSource, setNewSource] = useState<Source>("Twitch");

  function handleAddChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addLiveChannel(newChannel, newSource);
    setNewChannel("");
  }

  function focusSource(id: string) {
    setSelectedChannelId(id);
    setSelectedAnalyticsId(id);
  }

  return (
    <aside className="hidden min-h-0 flex-col gap-3 xl:flex">
      <Panel className="min-h-[300px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d8ad75]">
              Stream Preview
            </p>
            <h2 className="mt-1 text-lg font-black text-[#fff7ea]">Stream Floor</h2>
          </div>

          <span className="rounded-full border border-[#22c55e]/25 bg-[#22c55e]/10 px-3 py-1 text-[11px] font-black text-[#86efac]">
            {selectedChannel.status}
          </span>
        </div>

        <StreamWindow connection={selectedChannel} />

        <p className="mb-2 mt-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#d8ad75]">
          Preview channel
        </p>

        <div className="grid max-h-[86px] grid-cols-1 gap-2 overflow-y-auto pr-1">
          {sourceList.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => focusSource(item.id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-black ${
                selectedChannelId === item.id
                  ? "border-[#f3dfc1] bg-[#f3dfc1] text-[#160f09]"
                  : "border-[#d8ad75]/18 bg-[#100b07] text-[#e8d1b0]/60"
              }`}
            >
              <PlatformLogo source={item.source} />
              <span className="min-w-0 flex-1 truncate">
                {item.source} / {item.channel}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="min-h-0 flex-1 overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-black text-[#fff7ea]">Connected Sources</h2>
          <span className="rounded-lg border border-[#d8ad75]/18 bg-[#100b07] px-2 py-1 text-[11px] font-black text-[#e8d1b0]/45">
            {sourceList.length}
          </span>
        </div>

        <div className="space-y-1.5">
          {sourceList.map((item) => (
            <SourceConnectionCard
              key={item.id}
              item={item}
              selected={selectedChannelId === item.id}
              onFocus={() => focusSource(item.id)}
              onRemove={() => removeChannel(item.id)}
            />
          ))}
        </div>

        <form onSubmit={handleAddChannel} className="mt-4 rounded-2xl border border-[#d8ad75]/18 bg-[#080604] p-3">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d8ad75]">
            Add Live Channel
          </p>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {(["Twitch", "Kick", "X", "YouTube"] as Source[]).map((source) => (
              <button
                key={source}
                type="button"
                onClick={() => setNewSource(source)}
                className={`flex items-center justify-center rounded-lg border px-2 py-2 ${
                  newSource === source
                    ? "border-[#f3dfc1] bg-[#f3dfc1] text-[#160f09]"
                    : "border-[#d8ad75]/14 bg-[#100b07]"
                }`}
              >
                <PlatformLogo source={source} />
              </button>
            ))}
          </div>

          <div className="mt-3 flex rounded-xl border border-[#d8ad75]/18 bg-[#120d08]">
            <input
              value={newChannel}
              onChange={(event) => setNewChannel(event.target.value)}
              placeholder="@creator or #channel"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-[#fff7ea] outline-none placeholder:text-[#e8d1b0]/28"
            />
            <button type="submit" className="border-l border-[#d8ad75]/18 px-3 text-[#d8ad75]">
              +
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {["kaicenat", "xqc", "adinross", "jynxzi"].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => addLiveChannel(name, newSource)}
                className="rounded-lg border border-[#d8ad75]/14 bg-[#100b07] px-2 py-2 text-left text-[11px] font-bold text-[#e8d1b0]/45 hover:text-[#fff7ea]"
              >
                + {name}
              </button>
            ))}
          </div>
        </form>
      </Panel>
    </aside>
  );
}

function RightFloorColumn({
  totalViewers,
  filteredCount,
  messagesPerMinute,
  activeFeeds,
  sourceFlow: _sourceFlow,
  viewerBreakdown,
  liveActivity: _liveActivity,
  aiSignals,
  sourceList,
  selectedAnalytics,
  selectedAnalyticsId,
  setSelectedAnalyticsId,
  setSelectedChannelId,
  handleClip,
  openPollBuilder,
  pinLatestBroadcast,
}: {
  totalViewers: number;
  filteredCount: number;
  messagesPerMinute: number;
  activeFeeds: number;
  sourceFlow: { source: Source; messagesPerMinute: number; percent: number }[];
  viewerBreakdown: { source: Source; viewers: number; percent: number }[];
  liveActivity: "High" | "Medium" | "Low";
  aiSignals: AiSignal[];
  sourceList: SourceConnection[];
  selectedAnalytics: SourceConnection;
  selectedAnalyticsId: string;
  setSelectedAnalyticsId: (id: string) => void;
  setSelectedChannelId: (id: string) => void;
  handleClip: () => void;
  openPollBuilder: () => void;
  pinLatestBroadcast: () => void;
}) {
  function selectAnalytics(id: string) {
    setSelectedAnalyticsId(id);
    setSelectedChannelId(id);
  }

  return (
    <aside className="hidden min-h-0 overflow-hidden xl:flex">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        <Panel>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d8ad75]">
            Total Live Audience
          </p>

          <h2 className="mt-1 text-6xl font-black tracking-[-0.08em] text-[#fff7ea]">
            {totalViewers.toLocaleString()}
          </h2>

          <p className="mt-2 text-xs text-[#e8d1b0]/45">
            Combined viewers across every connected source.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <SmallStat label="Messages" value={String(filteredCount)} />
            <SmallStat label="Msgs/min" value={String(messagesPerMinute)} tone="green" />
            <SmallStat label="Feeds" value={String(activeFeeds)} />
          </div>
        </Panel>

        <Panel>
          <div className="mb-3">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d8ad75]">
              Viewer Breakdown
            </p>
            <h2 className="mt-1 text-lg font-black text-[#fff7ea]">
              Audience by platform
            </h2>
          </div>

          <div className="flex h-7 overflow-hidden rounded-full border border-[#d8ad75]/12 bg-[#100b07] shadow-[inset_0_0_18px_rgba(0,0,0,0.35)]">
            {viewerBreakdown.map((item) => (
              <div
                key={item.source}
                className={`${sourceBarClass(item.source)} flex min-w-[48px] items-center justify-center`}
                style={{ width: `${item.percent}%` }}
                title={`${item.source}: ${item.percent}% · ${item.viewers.toLocaleString()} viewers`}
              >
                <span className={`text-[11px] font-black ${sourceBarLabelClass(item.source)}`}>
                  {item.percent}%
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {viewerBreakdown.map((item) => (
              <div
                key={item.source}
                className="rounded-2xl border border-[#d8ad75]/12 bg-[#100b07] p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <PlatformLogo source={item.source} size="md" />
                    <p className={`truncate text-sm font-black ${sourceTextClass(item.source)}`}>
                      {item.source}
                    </p>
                  </div>

                  <span className={`rounded-full px-2 py-1 text-[11px] font-black ${sourcePercentBadgeClass(item.source)}`}>
                    {item.percent}%
                  </span>
                </div>

                <p className="text-2xl font-black leading-none tracking-[-0.04em] text-[#fff7ea]">
                  {item.viewers.toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#e8d1b0]/42">
                  viewers
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="mb-3">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d8ad75]">
              Live Audience Intelligence
            </p>
            <h2 className="mt-1 text-xl font-black text-[#fff7ea]">
              Platform Analytics
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {sourceList.slice(0, 8).map((item) => (
              <button
                key={item.id}
                onClick={() => selectAnalytics(item.id)}
                className={`rounded-2xl border p-4 text-left ${
                  selectedAnalyticsId === item.id
                    ? "border-[#f3dfc1] bg-[#f3dfc1] text-[#160f09]"
                    : "border-[#d8ad75]/14 bg-[#100b07] text-[#fff7ea]"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <SourcePill source={item.source} compact />
                  <span className="text-[10px] font-black">{item.status}</span>
                </div>

                <p className="truncate text-sm font-black">{item.channel}</p>
                <p className="mt-2 text-3xl font-black tracking-[-0.05em]">
                  {item.viewers.toLocaleString()}
                </p>
                <p className="text-xs opacity-60">{item.messagesPerMinute} msg/min</p>
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-2xl border border-[#d8ad75]/18 bg-[#080604]/70 p-4">
            <div className="mb-3 flex items-center gap-2">
              <PlatformLogo source={selectedAnalytics.source} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-black text-[#fff7ea]">
                  {selectedAnalytics.source} / {selectedAnalytics.channel}
                </p>
                <p className="text-xs text-[#e8d1b0]/45">{selectedAnalytics.detail}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <SmallStat label="Viewers" value={selectedAnalytics.viewers.toLocaleString()} />
              <SmallStat label="Msgs/min" value={String(selectedAnalytics.messagesPerMinute)} tone="green" />
              <SmallStat label="Growth" value={selectedAnalytics.growth} />
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#d8ad75]">
                Top chatters
              </p>

              <div className="flex flex-wrap gap-2">
                {audienceMembers
                  .filter((member) => member.source === selectedAnalytics.source)
                  .slice(0, 6)
                  .map((member) => (
                    <span
                      key={member.id}
                      className="rounded-full border border-[#d8ad75]/14 bg-[#100b07] px-3 py-1.5 text-xs font-black text-[#e8d1b0]/65"
                    >
                      @{member.name}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d8ad75]">
                Audience Map
              </p>
              <h2 className="mt-1 text-xl font-black text-[#fff7ea]">
                Hover any viewer
              </h2>
            </div>

            <span className="rounded-full border border-[#d8ad75]/20 bg-[#100b07] px-3 py-1 text-[11px] font-black text-[#e8d1b0]/55">
              {audienceMembers.length} active
            </span>
          </div>

          <div className="rounded-2xl border border-[#d8ad75]/14 bg-[#080604]/65 p-4">
            <div className="grid grid-cols-8 gap-2">
              {audienceMembers.map((member) => (
                <AudienceBubble key={member.id} member={member} />
              ))}
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px] font-black">
              <PlatformCount source="Twitch" count={8} />
              <PlatformCount source="Kick" count={7} />
              <PlatformCount source="X" count={7} />
              <PlatformCount source="YouTube" count={2} />
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="mb-3">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d8ad75]">
              Creator Action Queue
            </p>
            <h2 className="mt-1 text-xl font-black text-[#fff7ea]">
              Suggested next moves
            </h2>
          </div>

          <div className="space-y-3">
            <ActionQueueCard
              title="Clip Suggested"
              subtitle="“CLIP IT” is spiking across multiple platforms. Capture the last 30 seconds before the moment disappears."
              button="Clip last 30 sec"
              onClick={handleClip}
            />
            <ActionQueueCard
              title="Poll Suggested"
              subtitle="Audience is split across Twitch, Kick, X, and YouTube. Ask one question and send it everywhere."
              button="Start poll"
              onClick={openPollBuilder}
            />
            <ActionQueueCard
              title="Pin Suggested"
              subtitle="Creator messages are driving engagement. Keep the most important broadcast visible at the top."
              button="Pin broadcast"
              onClick={pinLatestBroadcast}
            />
          </div>
        </Panel>

        <Panel>
          <div className="mb-3">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d8ad75]">
              AI Floor Signals
            </p>
            <h2 className="mt-1 text-xl font-black text-[#fff7ea]">
              What the system is detecting
            </h2>
          </div>

          <div className="space-y-3">
            {aiSignals.map((signal) => (
              <AiSignalCard key={signal.id} title={signal.title} subtitle={signal.subtitle} />
            ))}
          </div>
        </Panel>
      </div>
    </aside>
  );
}

function ActionQueueCard({
  title,
  subtitle,
  button,
  onClick,
}: {
  title: string;
  subtitle: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#d8ad75]/18 bg-[#100b07] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#f59e0b]/25 bg-[#f59e0b]/12 text-lg">
          🔥
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base font-black text-[#fff7ea]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[#e8d1b0]/58">{subtitle}</p>

          <button
            onClick={onClick}
            className="mt-3 rounded-xl border border-[#d8ad75]/25 bg-[#d8ad75]/10 px-3 py-2 text-xs font-black text-[#f3dfc1] hover:bg-[#d8ad75]/18"
          >
            {button}
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewerRoom({
  selectedChannel,
  setSelectedChannelId,
  sourceList,
  filteredMessages,
  selectedSource,
  setSelectedSource,
  viewerChatText,
  setViewerChatText,
  handleViewerChat,
}: {
  selectedChannel: SourceConnection;
  setSelectedChannelId: (id: string) => void;
  sourceList: SourceConnection[];
  filteredMessages: FeedMessage[];
  selectedSource: Source | "All";
  setSelectedSource: (source: Source | "All") => void;
  viewerChatText: string;
  setViewerChatText: (value: string) => void;
  handleViewerChat: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const totalViewers = sourceList.reduce((sum, item) => sum + item.viewers, 0);

  return (
    <section className="grid h-[calc(100vh-98px)] grid-cols-1 gap-3 p-3 xl:grid-cols-[1fr_430px]">
      <div className="min-h-0 overflow-y-auto rounded-[1.65rem] border border-[#d8ad75]/18 bg-[#120d08]/88">
        <div className="border-b border-[#d8ad75]/18 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#d8ad75]">
                Live Preview
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#fff7ea]">
                {totalViewers.toLocaleString()} viewers. One chat. Every platform.
              </h2>
            </div>

            <div className="flex max-w-[520px] flex-wrap justify-end gap-2">
              {sourceList.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedChannelId(item.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black ${
                    selectedChannel.id === item.id
                      ? "border-[#f3dfc1] bg-[#f3dfc1] text-[#160f09]"
                      : "border-[#d8ad75]/18 bg-[#100b07] text-[#e8d1b0]/50"
                  }`}
                >
                  <PlatformLogo source={item.source} />
                  {item.channel}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4">
          <StreamWindow connection={selectedChannel} large />

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {sourceList.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#d8ad75]/18 bg-[#100b07] p-4">
                <div className="flex items-center justify-between">
                  <SourcePill source={item.source} />
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black ${
                    item.status === "Live"
                      ? "bg-[#22c55e]/10 text-[#86efac]"
                      : item.status === "Replay"
                      ? "bg-[#f59e0b]/10 text-[#fcd34d]"
                      : "bg-[#e8d1b0]/10 text-[#e8d1b0]/45"
                  }`}>
                    {item.status}
                  </span>
                </div>

                <p className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#fff7ea]">
                  {item.viewers.toLocaleString()}
                </p>
                <p className="text-sm text-[#e8d1b0]/45">viewers</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="flex min-h-0 flex-col overflow-hidden rounded-[1.65rem] border border-[#d8ad75]/18 bg-[#120d08]/88">
        <div className="border-b border-[#d8ad75]/18 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#d8ad75]">
            Native Viewer Chat
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#fff7ea]">Combined Chat</h2>
          <p className="text-sm text-[#e8d1b0]/48">
            Watch and chat with the full Market Bubble audience in one room.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {(["All", "Twitch", "Kick", "X", "YouTube"] as const).map((source) => (
              <button
                key={source}
                onClick={() => setSelectedSource(source)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black ${
                  selectedSource === source
                    ? "border-[#f3dfc1] bg-[#f3dfc1] text-[#160f09]"
                    : "border-[#d8ad75]/18 bg-[#100b07] text-[#e8d1b0]/50"
                }`}
              >
                {source !== "All" && <PlatformLogo source={source} />}
                {source}
              </button>
            ))}
          </div>

          <form onSubmit={handleViewerChat} className="mt-4">
            <div className="flex gap-2 rounded-2xl border border-[#d8ad75]/18 bg-[#080604] p-2">
              <input
                value={viewerChatText}
                onChange={(event) => setViewerChatText(event.target.value)}
                placeholder="Chat as a viewer in the selected stream..."
                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[#fff7ea] outline-none placeholder:text-[#e8d1b0]/28"
              />
              <button
                type="submit"
                disabled={!viewerChatText.trim()}
                className="rounded-xl bg-[#f3dfc1] px-3 py-2 text-xs font-black text-[#160f09] disabled:bg-[#e8d1b0]/15 disabled:text-[#e8d1b0]/35"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {filteredMessages
            .slice()
            .reverse()
            .slice(0, 20)
            .map((message) => (
              <ChatCard key={message.id} message={message} />
            ))}
        </div>
      </aside>
    </section>
  );
}

function StreamWindow({
  connection,
  large = false,
}: {
  connection: SourceConnection;
  large?: boolean;
}) {
  const isTwitch = connection.source === "Twitch";
  const twitchChannel = cleanChannelName(connection.channel) || "marketbubble";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#d8ad75]/18 bg-[#050403] ${
        large ? "h-[420px]" : "h-[165px]"
      }`}
    >
      {isTwitch ? (
        <iframe
          title={`${connection.channel} Twitch stream`}
          src={`https://player.twitch.tv/?channel=${twitchChannel}&parent=localhost&muted=true`}
          allowFullScreen
          className="h-full w-full"
        />
      ) : (
        <MockStreamVisual source={connection.source} channel={connection.channel} />
      )}

      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-xl border border-[#d8ad75]/18 bg-black/55 px-3 py-2 backdrop-blur">
        <PlatformLogo source={connection.source} />
        <span className="text-xs font-black text-[#fff7ea]">{connection.channel}</span>
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-[#d8ad75]/18 bg-black/55 px-3 py-1 text-[11px] font-black text-[#e8d1b0]/70 backdrop-blur">
        {isTwitch ? "Real Twitch embed" : `${connection.source} demo preview`}
      </div>
    </div>
  );
}

function MockStreamVisual({ source, channel }: { source: Source; channel: string }) {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(216,173,117,0.38),transparent_14%),radial-gradient(circle_at_54%_42%,rgba(124,58,237,0.3),transparent_28%),linear-gradient(180deg,#1b120b,#050403)]" />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle,rgba(255,247,234,0.22)_1px,transparent_1px)] [background-size:26px_26px]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="h-14 w-14 rounded-full bg-[radial-gradient(circle_at_35%_25%,#fff7ea,#d8ad75_42%,#7c3aed_72%,#111827)] shadow-[0_0_55px_rgba(216,173,117,0.38)]" />
        <p className="mt-3 text-sm font-black text-[#fff7ea]">{channel}</p>
        <p className="mt-1 flex items-center justify-center gap-2 text-xs text-[#e8d1b0]/50">
          <PlatformLogo source={source} />
          streaming on {source}
        </p>
      </div>
    </>
  );
}

function CreatorBroadcastBanner({
  message,
  pinned,
  onPin,
  onUnpin,
}: {
  message: FeedMessage;
  pinned: boolean;
  onPin: () => void;
  onUnpin: () => void;
}) {
  return (
    <div className="rounded-xl border border-[#38bdf8]/42 bg-[linear-gradient(90deg,rgba(14,165,233,0.18),rgba(124,58,237,0.12),rgba(216,173,117,0.06))] px-3 py-1.5 shadow-[0_0_34px_rgba(14,165,233,0.14)]">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <div className="rounded-lg border border-[#38bdf8]/30 bg-[#080604]/60 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#7dd3fc]">
          {pinned ? "Pinned" : "Creator"}
        </div>

        <p className="min-w-0 truncate text-sm font-black text-[#fff7ea]">
          <span className="mr-2 text-[#7dd3fc]">Market Bubble → All:</span>
          <RichMessageText text={message.text} />
        </p>

        <button
          type="button"
          onClick={pinned ? onUnpin : onPin}
          className="rounded-lg border border-[#38bdf8]/25 bg-[#0ea5e9]/10 px-2.5 py-1.5 text-xs font-black text-[#7dd3fc] hover:bg-[#0ea5e9]/18"
        >
          {pinned ? "Unpin" : "Pin"}
        </button>
      </div>
    </div>
  );
}

function TapeRow({
  message,
  onPin,
}: {
  message: FeedMessage;
  onPin: () => void;
}) {
  const isCreator = message.role === "creator";

  return (
    <div
      className={`grid grid-cols-[118px_minmax(92px,128px)_minmax(0,1fr)_54px] items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[13px] leading-5 transition ${
        isCreator
          ? "border-[#38bdf8]/45 bg-[#0ea5e9]/14 shadow-[0_0_44px_rgba(14,165,233,0.16)]"
          : message.heat === "viral"
          ? "border-[#f59e0b]/35 bg-[#f59e0b]/10"
          : message.heat === "hot"
          ? "border-[#d8ad75]/20 bg-[#d8ad75]/6"
          : "border-transparent hover:border-[#d8ad75]/15 hover:bg-[#fff7ea]/[0.025]"
      }`}
    >
      <SourceChannelPill source={message.source} channel={message.channel} />
      <div className="truncate font-black text-[#f3dfc1]">@{message.user}</div>

      <div className="min-w-0 truncate text-[#fff7ea]/82">
        {isCreator && (
          <span className="mr-2 rounded-md border border-[#38bdf8]/35 bg-[#0ea5e9]/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#7dd3fc]">
            Creator → All
          </span>
        )}
        {message.heat === "viral" && !isCreator && (
          <span className="mr-2 rounded-md border border-[#f59e0b]/30 bg-[#f59e0b]/12 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#fcd34d]">
            Hot
          </span>
        )}
        <RichMessageText text={message.text} />
      </div>

      <div className="flex items-center justify-end gap-2">
        {isCreator && (
          <button
            type="button"
            onClick={onPin}
            className="rounded-md border border-[#38bdf8]/25 bg-[#0ea5e9]/10 px-1.5 py-1 text-[10px] font-black text-[#7dd3fc]"
          >
            Pin
          </button>
        )}
        <span className="text-right text-[11px] text-[#e8d1b0]/32">{message.time}</span>
      </div>
    </div>
  );
}

function RichMessageText({ text }: { text: string }) {
  const parts = text.split(/(\$[A-Za-z]{2,10})/g);

  return (
    <>
      {parts.map((part, index) => {
        if (/^\$[A-Za-z]{2,10}$/.test(part)) {
          return <TickerTag key={`${part}-${index}`} ticker={part} />;
        }

        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
}

function TickerTag({ ticker }: { ticker: string }) {
  const data = getTickerData(ticker);
  const positive = data.change.startsWith("+");
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  function handleEnter(event: ReactMouseEvent<HTMLSpanElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const left = Math.min(window.innerWidth - 280, Math.max(12, rect.left - 100));
    const top = Math.max(80, rect.top - 150);
    setPosition({ top, left });
  }

  return (
    <>
      <span
        onMouseEnter={handleEnter}
        onMouseLeave={() => setPosition(null)}
        className="mx-1 inline-flex cursor-default items-center rounded-md border border-[#38bdf8]/35 bg-[#0ea5e9]/15 px-1.5 py-0.5 text-xs font-black text-[#7dd3fc] shadow-[0_0_18px_rgba(14,165,233,0.12)]"
      >
        ${data.symbol}
      </span>

      {position && (
        <span
          style={{ top: position.top, left: position.left }}
          className="fixed z-[9999] w-64 rounded-2xl border border-[#38bdf8]/25 bg-[#071018]/98 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.75)]"
        >
          <span className="mb-2 flex items-center justify-between">
            <span>
              <span className="block text-sm font-black text-[#e0f2fe]">${data.symbol}</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7dd3fc]/70">
                {data.type} · {data.mentions} mentions
              </span>
            </span>

            <span className={positive ? "text-sm font-black text-[#86efac]" : "text-sm font-black text-[#fb7185]"}>
              {data.change}
            </span>
          </span>

          <span className="flex items-center justify-between gap-3">
            <span className="text-xl font-black text-[#fff7ea]">{data.price}</span>
            <Sparkline points={data.points} positive={positive} />
          </span>

          <span className="mt-2 block text-[11px] text-[#bfdbfe]/60">
            Demo quote card. Connect market data API for live pricing.
          </span>
        </span>
      )}
    </>
  );
}

function ChatCard({ message }: { message: FeedMessage }) {
  const isCreator = message.role === "creator";

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isCreator
          ? "border-[#38bdf8]/35 bg-[#0ea5e9]/12"
          : "border-[#d8ad75]/14 bg-[#100b07]"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <SourceChannelPill source={message.source} channel={message.channel} />
        {isCreator && (
          <span className="rounded-full border border-[#38bdf8]/35 bg-[#0ea5e9]/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#7dd3fc]">
            Creator
          </span>
        )}
        <span className="text-sm font-black text-[#e8d1b0]/55">@{message.user}</span>
        <span className="ml-auto text-xs text-[#e8d1b0]/28">{message.time}</span>
      </div>

      <p className="text-sm leading-6 text-[#fff7ea]/82">
        <RichMessageText text={message.text} />
      </p>
    </div>
  );
}

function AudienceBubble({ member }: { member: AudienceMember }) {
  const initials = member.name
    .split("_")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  function handleEnter(event: ReactMouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const left = Math.min(window.innerWidth - 280, Math.max(12, rect.right - 250));
    const top = Math.min(window.innerHeight - 160, rect.bottom + 8);
    setPosition({ top, left });
  }

  return (
    <>
      <button
        onMouseEnter={handleEnter}
        onMouseLeave={() => setPosition(null)}
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-black transition hover:scale-110 ${
          member.source === "Twitch"
            ? "border-[#9146ff]/55 bg-[#9146ff]/12 text-[#c4b5fd]"
            : member.source === "Kick"
            ? "border-[#53fc18]/55 bg-[#53fc18]/12 text-[#86efac]"
            : member.source === "YouTube"
            ? "border-[#ff0033]/55 bg-[#ff0033]/12 text-[#fca5a5]"
            : "border-[#f3dfc1]/40 bg-[#f3dfc1]/10 text-[#f3dfc1]"
        }`}
      >
        {initials}
      </button>

      {position && (
        <div
          style={{ top: position.top, left: position.left }}
          className="fixed z-[9999] w-64 rounded-2xl border border-[#d8ad75]/28 bg-[#15100b]/98 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.75)]"
        >
          <div className="mb-2 flex items-center gap-2">
            <PlatformLogo source={member.source} />
            <p className="truncate text-sm font-black text-[#fff7ea]">@{member.name}</p>
          </div>

          <div className="space-y-1 text-xs text-[#e8d1b0]/60">
            <p><span className="font-black text-[#d8ad75]">Platform:</span> {member.source}</p>
            <p><span className="font-black text-[#d8ad75]">Watching:</span> {member.channel}</p>
            <p><span className="font-black text-[#d8ad75]">Messages:</span> {member.messages}</p>
            <p><span className="font-black text-[#d8ad75]">Status:</span> {member.status}</p>
          </div>
        </div>
      )}
    </>
  );
}

function SourceConnectionCard({
  item,
  selected,
  onFocus,
  onRemove,
}: {
  item: SourceConnection;
  selected: boolean;
  onFocus: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        selected ? "border-[#f3dfc1] bg-[#f3dfc1]/10" : "border-[#d8ad75]/14 bg-[#100b07]"
      }`}
    >
      <div className="flex items-center gap-3">
        <button onClick={onFocus} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <PlatformLogo source={item.source} size="md" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-[#fff7ea]">{item.channel}</p>
            <div className="mt-1 flex items-center gap-2 text-[11px]">
              <span
                className={
                  item.status === "Live"
                    ? "text-[#86efac]"
                    : item.status === "Replay"
                    ? "text-[#fcd34d]"
                    : "text-[#e8d1b0]/35"
                }
              >
                ● {item.status}
              </span>
              <span className="text-[#e8d1b0]/35">{item.messagesPerMinute} msg/min</span>
            </div>
          </div>
        </button>

        <button
          onClick={onRemove}
          className="rounded-lg border border-[#d8ad75]/14 bg-[#080604] px-2 py-1 text-xs font-black text-[#e8d1b0]/45 hover:border-[#fb7185]/35 hover:text-[#fb7185]"
          title="Remove channel"
        >
          ×
        </button>
      </div>

      <p className="mt-2 text-[11px] text-[#e8d1b0]/38">{item.detail}</p>
    </div>
  );
}

function Sparkline({ points, positive = false }: { points: number[]; positive?: boolean }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const polyline = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 64;
      const y = 24 - ((point - min) / range) * 20;
      return `${x},${y}`;
    })
    .join(" ");

  const lastY = polyline.split(" ").at(-1)?.split(",")[1] || "14";

  return (
    <svg viewBox="0 0 68 28" className={`h-7 w-[68px] ${positive ? "text-[#86efac]" : "text-[#fb7185]"}`}>
      <polyline points={polyline} fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="64" cy={lastY} r="2.4" fill="currentColor" />
    </svg>
  );
}

function PlatformLogo({ source, size = "sm" }: { source: Source; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-7 w-7" : size === "md" ? "h-5 w-5" : "h-4 w-4";

  const logos: Record<Source, { src: string; bg: string; label: string }> = {
    Twitch: { src: "https://cdn.simpleicons.org/twitch/FFFFFF", bg: "bg-[#9146ff]", label: "Twitch" },
    Kick: { src: "https://cdn.simpleicons.org/kick/000000", bg: "bg-[#53fc18]", label: "Kick" },
    X: { src: "https://cdn.simpleicons.org/x/000000", bg: "bg-[#f3dfc1]", label: "X" },
    YouTube: { src: "https://cdn.simpleicons.org/youtube/FFFFFF", bg: "bg-[#ff0033]", label: "YouTube" },
  };

  const logo = logos[source];

  return (
    <span className={`${sizeClass} ${logo.bg} inline-flex shrink-0 items-center justify-center rounded-md p-[3px]`} aria-label={`${logo.label} logo`}>
      <img src={logo.src} alt="" className="h-full w-full object-contain" />
    </span>
  );
}

function SourcePill({ source, compact = false }: { source: Source; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-xl border font-black ${sourcePillClass(source)} ${compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs"}`}>
      <PlatformLogo source={source} />
      {source}
    </span>
  );
}

function SourceChannelPill({ source, channel }: { source: ChatSource; channel: string }) {
  if (source === "All Platforms") {
    return (
      <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-[#38bdf8]/35 bg-[#0ea5e9]/12 px-2 py-1 text-[10px] font-black text-[#7dd3fc]">
        ◈ <span className="truncate">All / {channel}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex min-w-0 items-center gap-2 rounded-lg border px-2 py-0.5 text-[10px] font-black ${sourcePillClass(source)}`}>
      <PlatformLogo source={source} />
      <span className="truncate">{source} / {channel}</span>
    </span>
  );
}

function sourcePillClass(source: Source) {
  if (source === "Twitch") return "border-[#9146ff]/35 bg-[#9146ff]/12 text-[#c4b5fd]";
  if (source === "Kick") return "border-[#53fc18]/35 bg-[#53fc18]/12 text-[#86efac]";
  if (source === "YouTube") return "border-[#ff0033]/35 bg-[#ff0033]/12 text-[#fca5a5]";
  return "border-[#f3dfc1]/25 bg-[#f3dfc1]/10 text-[#f3dfc1]";
}

function sourceTextClass(source: Source) {
  if (source === "Twitch") return "text-[#c4b5fd]";
  if (source === "Kick") return "text-[#86efac]";
  if (source === "YouTube") return "text-[#fca5a5]";
  return "text-[#f3dfc1]";
}

function sourceBarClass(source: Source) {
  if (source === "Twitch") return "bg-[#9146ff]";
  if (source === "Kick") return "bg-[#53fc18]";
  if (source === "YouTube") return "bg-[#ff0033]";
  return "bg-[#f3dfc1]";
}

function sourceBarLabelClass(source: Source) {
  if (source === "Kick" || source === "X") return "text-[#080604]";
  return "text-white";
}

function sourcePercentBadgeClass(source: Source) {
  if (source === "Twitch") return "bg-[#9146ff]/14 text-[#c4b5fd]";
  if (source === "Kick") return "bg-[#53fc18]/14 text-[#86efac]";
  if (source === "YouTube") return "bg-[#ff0033]/14 text-[#fca5a5]";
  return "bg-[#f3dfc1]/12 text-[#f3dfc1]";
}

function SourceIconRow({ includeYouTube = false }: { includeYouTube?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <PlatformLogo source="Twitch" />
      <PlatformLogo source="Kick" />
      <PlatformLogo source="X" />
      {includeYouTube && <PlatformLogo source="YouTube" />}
    </div>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[1.65rem] border border-[#d8ad75]/18 bg-[#120d08]/88 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.34)] ${className}`}>
      {children}
    </div>
  );
}

function TopMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green" | "gold" | "purple" | "blue";
}) {
  const dotClass =
    tone === "green"
      ? "bg-[#22c55e] shadow-[0_0_14px_rgba(34,197,94,0.55)]"
      : tone === "gold"
      ? "bg-[#d8ad75] shadow-[0_0_14px_rgba(216,173,117,0.45)]"
      : tone === "purple"
      ? "bg-[#9146ff] shadow-[0_0_14px_rgba(145,70,255,0.55)]"
      : tone === "blue"
      ? "bg-[#38bdf8] shadow-[0_0_14px_rgba(56,189,248,0.55)]"
      : "bg-[#e8d1b0]/35";

  const valueClass =
    tone === "green"
      ? "text-[#86efac]"
      : tone === "gold"
      ? "text-[#f3dfc1]"
      : tone === "purple"
      ? "text-[#c4b5fd]"
      : tone === "blue"
      ? "text-[#7dd3fc]"
      : "text-[#fff7ea]";

  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#e8d1b0]/35">{label}</p>
        <p className={`text-sm font-black ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

function SmallStat({ label, value, tone }: { label: string; value: string; tone?: "green" }) {
  return (
    <div className="rounded-2xl border border-[#d8ad75]/14 bg-[#100b07] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#e8d1b0]/38">{label}</p>
      <p className={`mt-1 text-2xl font-black ${tone === "green" ? "text-[#86efac]" : "text-[#fff7ea]"}`}>{value}</p>
    </div>
  );
}

function FilterOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-bold ${active ? "bg-[#d8ad75]/14 text-[#fff7ea]" : "text-[#e8d1b0]/52 hover:bg-[#fff7ea]/[0.035] hover:text-[#fff7ea]"}`}>
      <span>{label}</span>
      {active && <span className="text-[#d8ad75]">✓</span>}
    </button>
  );
}

function AiSignalCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-[#f59e0b]/24 bg-[#f59e0b]/10 p-3">
      <p className="text-sm font-black text-[#fcd34d]">🔥 {title}</p>
      <p className="mt-1 text-xs leading-5 text-[#fef3c7]/62">{subtitle}</p>
    </div>
  );
}

function PlatformCount({ source, count }: { source: Source; count: number }) {
  return (
    <div className="rounded-xl border border-[#d8ad75]/14 bg-[#100b07] p-2">
      <div className="flex justify-center">
        <PlatformLogo source={source} />
      </div>
      <p className="mt-1 text-[#fff7ea]">{count}</p>
    </div>
  );
}

function CreatorToolButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-[#d8ad75]/18 bg-[#080604] px-2.5 py-1 text-[10px] font-black text-[#e8d1b0]/55 hover:border-[#d8ad75]/35 hover:text-[#fff7ea]"
    >
      {label}
    </button>
  );
}
