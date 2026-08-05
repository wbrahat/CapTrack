import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import {
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  GitBranch,
  Link,
  MessageSquare,
  Presentation,
  Search,
  UploadCloud,
  XCircle,
} from "lucide-react";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers["x-auth-token"] = token;
  }

  return config;
});

type SubmissionStat = {
  label: string;
  value: string;
  subtext: string;
  icon?: ReactNode;
};

type SubmissionRow = {
  id: string;
  task: string;
  submittedBy: string;
  type: string;
  date: string;
  version: string;
  status: string;
  feedback: string;
  link: string;
};

const statIcons: Record<string, ReactNode> = {
  "Total Submissions": <UploadCloud size={20} />,
  Approved: <CheckCircle2 size={20} />,
  "Revision Needed": <XCircle size={20} />,
  "Pending Review": <Clock size={20} />,
};

const defaultStats: SubmissionStat[] = [
  {
    label: "Total Submissions",
    value: "0",
    subtext: "Across all milestones",
  },
  {
    label: "Approved",
    value: "0",
    subtext: "Accepted by supervisor",
  },
  {
    label: "Revision Needed",
    value: "0",
    subtext: "Requires update",
  },
  {
    label: "Pending Review",
    value: "0",
    subtext: "Waiting for feedback",
  },
];

const statusStyles: Record<string, string> = {
  Approved: "bg-emerald-50 text-emerald-700",
  "Revision Needed": "bg-amber-50 text-amber-700",
  "Pending Review": "bg-blue-50 text-blue-700",
  Submitted: "bg-cyan-50 text-cyan-700",
};

const typeIcons: Record<string, ReactNode> = {
  Document: <FileText size={16} />,
  Presentation: <Presentation size={16} />,
  Repository: <GitBranch size={16} />,
  Other: <UploadCloud size={16} />,
};

export function SubmissionsPage() {
  const [stats, setStats] = useState<SubmissionStat[]>(defaultStats);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [recentReview, setRecentReview] = useState<SubmissionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await API.get("/submissions/student");

      setStats(response.data.stats || defaultStats);
      setSubmissions(response.data.submissions || []);
      setRecentReview(response.data.recentReview || null);
    } catch (err) {
      console.error("Student submissions fetch error:", err);
      setError("Failed to load submissions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleUploadSubmission = async () => {
    const title = window.prompt("Enter submission title, for example: Sprint 2 Slides");

    if (!title || !title.trim()) {
      return;
    }

    const fileLink =
      window.prompt("Enter file name or link, for example: sprint_2_slides.pptx or GitHub URL") || "";

    try {
      await API.post("/submissions/student", {
        title,
        fileLink,
        type: fileLink.toLowerCase().includes("github")
          ? "code"
          : fileLink.toLowerCase().includes(".ppt")
            ? "slides"
            : "document",
      });

      await loadSubmissions();
    } catch (err) {
      console.error("Student submission upload error:", err);
      alert("Submission upload failed. Please make sure the backend server is running and try again.");
    }
  };

  return (
    <section className="min-h-screen bg-[#f3f6fa] px-8 py-8">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <div
            className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            CapTrack · Student
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Submissions
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Manage uploaded documents, repository links, presentation files,
            version records, and supervisor review status.
          </p>
        </div>

        <button
          onClick={handleUploadSubmission}
          className="flex items-center gap-2 rounded-full bg-[#0f5f8f] px-5 py-3 text-sm font-semibold text-white shadow-sm"
        >
          <UploadCloud size={17} />
          Upload Submission
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              {item.icon || statIcons[item.label]}
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
              placeholder="Search by task, submitter, file, or repository..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            All Status
            <Filter size={16} />
          </button>

          <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            All Types
            <Filter size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-950">
              Submission History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Track every file, link, version, and review status in one place.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Task</th>
                  <th className="px-6 py-4 font-medium">Submitted By</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Version</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-6 py-8 text-center text-slate-500" colSpan={7}>
                      Loading submissions...
                    </td>
                  </tr>
                ) : submissions.length === 0 ? (
                  <tr>
                    <td className="px-6 py-8 text-center text-slate-500" colSpan={7}>
                      No submissions found yet.
                    </td>
                  </tr>
                ) : (
                  submissions.map((submission) => (
                    <tr
                      key={submission.id}
                      className="border-t border-slate-100"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-950">
                          {submission.task}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Link size={12} />
                          {submission.link}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {submission.submittedBy}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="text-cyan-700">
                            {typeIcons[submission.type] || typeIcons.Other}
                          </span>
                          {submission.type}
                        </div>
                      </td>

                      <td
                        className="px-6 py-4 text-slate-600"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        {submission.date}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {submission.version}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[submission.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {submission.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button className="font-medium text-cyan-700 hover:text-cyan-800">
                          {submission.feedback}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">
              Submission Requirements
            </h3>
            <p className="mt-2 leading-7 text-slate-600">
              Each task submission should include a clear deliverable file or
              valid link and must follow supervisor instructions.
            </p>

            <div className="mt-5 space-y-3">
              <RequirementItem text="Use PDF for reports and documentation" />
              <RequirementItem text="Attach repository links for source code" />
              <RequirementItem text="Mention version number clearly" />
              <RequirementItem text="Submit before the deadline" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-cyan-700" />
              <h3 className="text-lg font-semibold text-slate-950">
                Recent Review
              </h3>
            </div>

            {recentReview ? (
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  {recentReview.task}
                </p>
                <p className="mt-2 leading-6 text-sm text-amber-700">
                  {recentReview.feedback || `${recentReview.status} · ${recentReview.date}`}
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">
                  No review feedback yet
                </p>
                <p className="mt-2 leading-6 text-sm text-emerald-700">
                  Your submitted work will show supervisor feedback here.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function RequirementItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <div className="h-2 w-2 rounded-full bg-cyan-600" />
      {text}
    </div>
  );
}
