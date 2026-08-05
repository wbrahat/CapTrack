import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Search,
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

const statIcons: Record<string, React.ReactNode> = {
  "Total Feedback": <MessageSquare size={20} />,
  "Revision Needed": <AlertCircle size={20} />,
  Approved: <CheckCircle2 size={20} />,
  "Pending Response": <Clock size={20} />,
};

const statusStyles: Record<string, string> = {
  Approved: "bg-emerald-50 text-emerald-700",
  "Revision Needed": "bg-amber-50 text-amber-700",
  "Pending Review": "bg-blue-50 text-blue-700",
};

type FeedbackItem = {
  id: string;
  task: string;
  supervisor: string;
  date: string;
  status: string;
  relatedSubmission: string;
  message: string;
  action: string;
};

export function FeedbackPage() {
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const response = await API.get("/submissions/student/feedback");
        setFeedbackData(response.data);
      } catch (err) {
        console.error("Feedback fetch error:", err);
        setError("Failed to load feedback data.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  const stats = feedbackData?.stats || [];
  const feedbackItems: FeedbackItem[] = feedbackData?.feedbackItems || [];
  const project = feedbackData?.project || { group: "Group 1", supervisor: "Adnan" };
  const latestNote = feedbackData?.latestNote || null;
  const revisionChecklist: string[] = feedbackData?.revisionChecklist || [];

  const filteredItems = useMemo(() => {
    return feedbackItems.filter((item) => {
      const matchesSearch = [item.task, item.supervisor, item.relatedSubmission, item.message]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "All Status" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [feedbackItems, searchTerm, statusFilter]);

  if (loading) {
    return (
      <section className="min-h-screen bg-[#f3f6fa] px-8 py-8">
        <p className="text-sm text-slate-600">Loading feedback...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen bg-[#f3f6fa] px-8 py-8">
        <p className="text-sm text-red-600">{error}</p>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#f3f6fa] px-8 py-8">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <div
            className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            CapTrack - Student
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Feedback
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            View supervisor comments, revision requests, approvals, and review notes for {project.group} submissions.
          </p>
        </div>

        <button className="rounded-full bg-cyan-100 px-4 py-2 text-sm font-medium text-cyan-700">
          Supervisor: {project.supervisor}
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item: any) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              {statIcons[item.label] || <MessageSquare size={20} />}
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
        <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search feedback by task, supervisor, or submission..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
          >
            <option>All Status</option>
            <option>Approved</option>
            <option>Revision Needed</option>
            <option>Pending Review</option>
          </select>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              No feedback records found.
            </div>
          ) : (
            filteredItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[item.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.status}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {item.date}
                      </span>
                    </div>

                    <h2 className="text-xl font-semibold text-slate-950">
                      {item.task}
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-2">
                        <UserCheck size={15} />
                        {item.supervisor}
                      </span>

                      <span className="flex items-center gap-2">
                        <FileText size={15} />
                        {item.relatedSubmission}
                      </span>
                    </div>
                  </div>

                  <button className="rounded-xl bg-[#0f5f8f] px-4 py-2 text-sm font-semibold text-white">
                    {item.action}
                  </button>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="leading-7 text-slate-700">{item.message}</p>
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-cyan-700" />
              <h3 className="text-lg font-semibold text-slate-950">
                Latest Supervisor Note
              </h3>
            </div>

            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">
                {latestNote?.task || "No feedback yet"}
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-700">
                {latestNote?.message || "Supervisor feedback will appear here after review."}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">
              Revision Checklist
            </h3>

            <div className="mt-5 space-y-3">
              {revisionChecklist.map((item) => (
                <ChecklistItem key={item} text={item} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
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
