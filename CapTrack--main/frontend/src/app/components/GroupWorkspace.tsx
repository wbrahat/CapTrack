import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Paperclip, Send, Users, Wifi } from "lucide-react";

type ChatMessage = {
  id: string;
  author: string;
  role: string;
  text: string;
  time: string;
  mine?: boolean;
};

const seedMessages: ChatMessage[] = [
  {
    id: "m1",
    author: "Ahmed Adnan",
    role: "Supervisor",
    text: "Please post progress updates here so the whole group can keep track of blockers and next steps.",
    time: "09:10",
  },
  {
    id: "m2",
    author: "Samira",
    role: "Member",
    text: "I finished the wireframes and shared them in the task board.",
    time: "09:18",
    mine: false,
  },
  {
    id: "m3",
    author: "You",
    role: "Student",
    text: "I am reviewing the submission feedback now and will update the report today.",
    time: "09:22",
    mine: true,
  },
];

const teammates = [
  { name: "Ahmed Adnan", status: "Online" },
  { name: "Samira", status: "Typing" },
  { name: "Fahim", status: "Online" },
  { name: "Nila", status: "Away" },
];

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ProjectAccessGate() {
  return (
    <div className="mx-auto flex min-h-full max-w-4xl items-center justify-center p-6">
      <div className="w-full rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600">
          <span className="text-xl font-semibold">!</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Project Workspace Locked</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Project group is not assigned yet. You will be able to access this workspace once a project group is assigned.
        </p>
      </div>
    </div>
  );
}

export function GroupWorkspace({
  viewerRole = "student",
  isProjectGroupAssigned = true,
}: {
  viewerRole?: string;
  isProjectGroupAssigned?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
  const [draft, setDraft] = useState("");
  const [activeThread, setActiveThread] = useState("Project General");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const activeCount = useMemo(
    () => teammates.filter((member) => member.status === "Online" || member.status === "Typing").length,
    []
  );

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!sending) return;

    const timeoutId = window.setTimeout(() => {
      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: `auto-${Date.now()}`,
          author: "Samira",
          role: "Member",
          text: "Seen. I will sync this with the milestone update shortly.",
          time: timeNow(),
        },
      ]);
      setSending(false);
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [sending]);

  if (!isProjectGroupAssigned) {
    return <ProjectAccessGate />;
  }

  const sendMessage = () => {
    const nextMessage = draft.trim();
    if (!nextMessage || sending) return;

    setMessages((previousMessages) => [
      ...previousMessages,
      {
        id: `msg-${Date.now()}`,
        author: "You",
        role: viewerRole === "supervisor" ? "Supervisor" : "Student",
        text: nextMessage,
        time: timeNow(),
        mine: true,
      },
    ]);
    setDraft("");
    setSending(true);
  };

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col gap-6 p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
            <Wifi size={12} className="text-cyan-500" /> Live project chat
          </div>
          <h1 className="text-3xl font-semibold text-foreground">Group Chat</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Keep your project discussion, quick updates, and supervisor feedback in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border px-3 py-1">Thread: {activeThread}</span>
          <span className="rounded-full border border-border px-3 py-1">{activeCount} active</span>
          <span className="rounded-full border border-border px-3 py-1">Role: {viewerRole}</span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Users size={16} className="text-cyan-600" /> Team Members
          </div>

          <div className="space-y-3">
            {teammates.map((member) => (
              <div key={member.name} className="flex items-center gap-3 rounded-2xl border border-border px-3 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-semibold text-cyan-700">
                  {member.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{member.name}</div>
                  <div className="text-xs text-muted-foreground">{member.status}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-cyan-500/30 bg-cyan-500/5 p-4 text-sm text-muted-foreground">
            Use this space for quick coordination, file links, and live updates during the project.
          </div>
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <div className="text-sm font-semibold text-foreground">Project General</div>
              <div className="text-xs text-muted-foreground">Messenger-style team discussion</div>
            </div>
            <button
              type="button"
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
              onClick={() => setActiveThread("Project General")}
            >
              Reset thread
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-3xl px-4 py-3 shadow-sm ${message.mine ? "bg-cyan-600 text-white" : "border border-border bg-secondary text-foreground"}`}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.24em] opacity-80" style={{ fontFamily: "'DM Mono', monospace" }}>
                    <span>{message.author}</span>
                    <span>{message.time}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <div className={`mt-2 text-[11px] ${message.mine ? "text-cyan-100" : "text-muted-foreground"}`}>
                    {message.role}
                  </div>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          <div className="border-t border-border p-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/50 p-3 sm:flex-row sm:items-end">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary"
              >
                <Paperclip size={16} />
              </button>

              <div className="flex-1">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  Message
                </label>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  rows={2}
                  placeholder="Write a message to your team..."
                  className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan-500"
                />
              </div>

              <button
                type="button"
                onClick={sendMessage}
                disabled={!draft.trim() || sending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={15} />
                {sending ? "Sending" : "Send"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
