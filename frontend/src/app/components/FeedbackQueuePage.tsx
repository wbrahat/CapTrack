import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  MessageSquare,
  Search,
  Send,
  UserCheck,
} from "lucide-react";

const API = axios.create({
  baseURL: "https://captrack-backend.onrender.com/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["x-auth-token"] = token;
  }
  return config;
});

type FeedbackQueueItem = {
  id: string;
  group: string;
  student: string;
  item: string;
  age: string;
};

type DashboardResponse = {
  feedbackQueue?: FeedbackQueueItem[];
  pendingSubmissions?: FeedbackQueueItem[];
  submissions?: FeedbackQueueItem[];
};

type ReviewStatus = "Revision Requested" | "Approved";

function normalizeQueueItem(item: any): FeedbackQueueItem {
  return {
    id: String(item.id || item._id || ""),
    group: item.group || item.groupName || "Group",
    student: item.student || item.submittedBy || "Student",
    item: item.item || item.title || item.task || "Submission Review",
    age: item.age || item.submittedDate || item.date || "Waiting",
  };
}

export function FeedbackQueuePage() {
  const [items, setItems] = useState<FeedbackQueueItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const sources = [
          "/submissions/supervisor/dashboard",
          "/submissions/supervisor",
        ];

        for (const endpoint of sources) {
          try {
            const response = await API.get(endpoint);
            const data: DashboardResponse = response.data;
            const nextItems =
              data.feedbackQueue || data.pendingSubmissions || data.submissions || [];

            setItems(nextItems.map(normalizeQueueItem).filter((item) => item.id));
            return;
          } catch (requestError) {
            console.warn(
              `Feedback queue request failed for ${endpoint}:`,
              requestError,
            );
          }
        }

        setItems([]);
      } catch (err) {
        console.error("Feedback queue fetch error:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateDraft = (itemId: string, value: string) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [itemId]: value,
    }));
  };

  const reviewItem = async (item: FeedbackQueueItem, status: ReviewStatus) => {
    const feedbackText = drafts[item.id]?.trim();
    const feedback =
      feedbackText ||
      (status === "Approved"
        ? "Submission approved. Good work."
        : "Please revise this submission and resubmit it for review.");

    try {
      setSavingId(item.id);
      setStatusMessage("");

      await API.patch(`/submissions/supervisor/${item.id}/review`, {
        status,
        feedback,
      });

      setDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[item.id];
        return nextDrafts;
      });

      if (status === "Approved") {
        setItems((currentItems) =>
          currentItems.filter((currentItem) => currentItem.id !== item.id),
        );
        setStatusMessage(`${item.item} approved and removed from the queue.`);
      } else {
        setItems((currentItems) =>
          currentItems.map((currentItem) =>
            currentItem.id === item.id
              ? { ...currentItem, age: "just now" }
              : currentItem,
          ),
        );
        setStatusMessage(`Feedback sent to ${item.student}.`);
      }
    } catch (reviewError) {
      console.error("Feedback review update error:", reviewError);
      setStatusMessage("Could not send feedback. Please check the backend and try again.");
    } finally {
      setSavingId("");
    }
  };

  const queueStats = [
    {
      label: "Feedback Queue",
      value: String(items.length),
      subtext: "Items waiting for review",
      icon: <MessageSquare size={20} />,
    },
    {
      label: "Urgent Feedback",
      value: String(items.length),
      subtext: "Waiting on supervisor response",
      icon: <AlertCircle size={20} />,
    },
    {
      label: "Sent Feedback",
      value: String(items.length),
      subtext: "This semester",
      icon: <Send size={20} />,
    },
    {
      label: "Resolved",
      value: "0",
      subtext: "Closed review items",
      icon: <CheckCircle2 size={20} />,
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Loading feedback queue...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <section className="min-h-screen bg-[#f3f6fa] px-8 py-8">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <div
            className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            CapTrack · Supervisor
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Feedback Queue
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            Manage pending feedback, review student submissions, send revision
            comments, and resolve supervisor evaluation items.
          </p>
        </div>

        <button
          disabled={items.length === 0}
          className="flex items-center gap-2 rounded-full bg-[#0f5f8f] px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={17} />
          Send Feedback
        </button>
      </div>

      {statusMessage && (
        <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-medium text-cyan-800">
          {statusMessage}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {queueStats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              {item.icon}
            </div>

            <div
              className="mb-2 text-xs uppercase tracking-wide text-slate-500"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {item.label}
            </div>

            <div className="text-2xl font-semibold text-slate-950">
              {item.value}
            </div>

            <p className="mt-1 text-sm text-slate-500">{item.subtext}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              placeholder="Search by group, task, student, or feedback status..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            All Groups
            <Filter size={16} />
          </button>

          <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            All Status
            <Filter size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {items.length === 0 ? (
            <EmptyState text="No feedback queue items." />
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        Pending Feedback
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {item.group}
                      </span>
                    </div>

                    <h2 className="text-xl font-semibold text-slate-950">
                      {item.item}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Supervisor review waiting for {item.student}
                    </p>
                  </div>

                  <button className="flex items-center gap-2 rounded-xl bg-[#0f5f8f] px-5 py-3 text-sm font-semibold text-white">
                    <MessageSquare size={17} />
                    Write Feedback
                  </button>
                </div>

                <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-4">
                  <InfoItem label="Submitted By" value={item.student} />
                  <InfoItem label="Group" value={item.group} />
                  <InfoItem label="Submitted Date" value={item.age} />
                  <InfoItem label="File / Link" value="Pending review item" />
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                  {item.student} has a submission or feedback item waiting for supervisor response.
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
                  <textarea
                    value={drafts[item.id] || ""}
                    onChange={(event) => updateDraft(item.id, event.target.value)}
                    placeholder="Write supervisor feedback here..."
                    className="h-28 resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none"
                  />

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => reviewItem(item, "Revision Requested")}
                      disabled={savingId === item.id}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#0f5f8f] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send size={17} />
                      {savingId === item.id ? "Sending..." : "Send"}
                    </button>

                    <button
                      onClick={() => reviewItem(item, "Approved")}
                      disabled={savingId === item.id}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle2 size={17} />
                      {savingId === item.id ? "Saving..." : "Resolve"}
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-950">
                Priority Review
              </h3>
            </div>

            <p className="leading-7 text-slate-600">
              Review the newest feedback items first and keep the response clear
              for each group.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <UserCheck size={18} className="text-cyan-700" />
              <h3 className="text-lg font-semibold text-slate-950">
                Feedback Guidelines
              </h3>
            </div>

            <div className="space-y-3">
              <ChecklistItem text="Mention the exact issue clearly" />
              <ChecklistItem text="Reference the submitted file or milestone" />
              <ChecklistItem text="Give actionable revision instructions" />
              <ChecklistItem text="Set expectation for resubmission" />
              <ChecklistItem text="Mark resolved after student update" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Clock size={18} className="text-cyan-700" />
              <h3 className="text-lg font-semibold text-slate-950">
                Recent Feedback Sent
              </h3>
            </div>

            <div className="space-y-3">
              <RecentItem title="Project Proposal" group="Group 5" status="Approved" />
              <RecentItem title="Literature Review" group="Group 11" status="Approved" />
              <RecentItem title="Requirement Analysis" group="Group 19" status="Revision Needed" />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="mb-1 text-xs uppercase tracking-wide text-slate-500"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        {label}
      </div>
      <div className="font-medium text-slate-800">{value}</div>
    </div>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <div className="h-2 w-2 rounded-full bg-cyan-600" />
      {text}
    </div>
  );
}

function RecentItem({
  title,
  group,
  status,
}: {
  title: string;
  group: string;
  status: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <FileText size={15} className="text-cyan-700" />
        {title}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{group}</span>
        <span>{status}</span>
      </div>
    </div>
  );
}
