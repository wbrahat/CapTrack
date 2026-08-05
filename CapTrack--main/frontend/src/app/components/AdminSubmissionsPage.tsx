import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Search,
  UploadCloud,
  Users,
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

type AdminSubmission = {
  id: string;
  title: string;
  group: string;
  project: string;
  supervisor: string;
  submittedBy: string;
  type: string;
  date: string;
  status: string;
  attention: string;
  file: string;
  feedback?: string;
};

type ReviewLoad = {
  name: string;
  value: string;
};

const defaultStats: SubmissionStat[] = [
  {
    label: "Total Submissions",
    value: "0",
    subtext: "Across all groups",
  },
  {
    label: "Approved",
    value: "0",
    subtext: "Accepted by supervisors",
  },
  {
    label: "Pending Review",
    value: "0",
    subtext: "Waiting for supervisor review",
  },
  {
    label: "Needs Attention",
    value: "0",
    subtext: "Revision or pending review",
  },
];

const statIcons: Record<string, ReactNode> = {
  "Total Submissions": <UploadCloud size={20} />,
  Approved: <CheckCircle2 size={20} />,
  "Pending Review": <Clock size={20} />,
  "Needs Attention": <AlertCircle size={20} />,
};

const statusStyles: Record<string, string> = {
  Approved: "bg-emerald-50 text-emerald-700",
  "Pending Review": "bg-blue-50 text-blue-700",
  "Revision Needed": "bg-amber-50 text-amber-700",
  Overdue: "bg-red-50 text-red-700",
};

const attentionStyles: Record<string, string> = {
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-700",
};

export function AdminSubmissionsPage() {
  const [stats, setStats] = useState<SubmissionStat[]>(defaultStats);
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [reviewLoad, setReviewLoad] = useState<ReviewLoad[]>([]);
  const [attentionMessage, setAttentionMessage] = useState("All submissions are currently in good standing.");
  const [health, setHealth] = useState<string[]>([
    "0 approved submissions",
    "0 waiting for review",
    "0 require attention",
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAdminSubmissions = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await API.get("/submissions/admin");

      setStats(response.data.stats || defaultStats);
      setSubmissions(response.data.submissions || []);
      setReviewLoad(response.data.reviewLoad || []);
      setAttentionMessage(response.data.attentionMessage || "All submissions are currently in good standing.");
      setHealth(response.data.health || []);
    } catch (err) {
      console.error("Admin submissions fetch error:", err);
      setError("Failed to load department submissions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminSubmissions();
  }, []);

  const handleOpenFile = (file: string) => {
    if (file.startsWith("http://") || file.startsWith("https://")) {
      window.open(file, "_blank");
      return;
    }

    alert(`File/link: ${file}`);
  };

  const handleExportReport = () => {
    const rows = submissions.map((submission) =>
      [
        submission.group,
        submission.title,
        submission.project,
        submission.supervisor,
        submission.submittedBy,
        submission.type,
        submission.status,
        submission.date,
        submission.file,
      ].join(",")
    );

    const report = [
      "Group,Title,Project,Supervisor,Submitted By,Type,Status,Date,File",
      ...rows,
    ].join("\n");

    const blob = new Blob([report], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "captrack-submissions-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="min-h-screen bg-[#f3f6fa] px-8 py-8">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <div
            className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            CapTrack · Admin
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Department Submissions
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            Monitor all group submissions, supervisor review status, revision
            requests, overdue deliverables, and department-level submission
            progress.
          </p>
        </div>

        <button
          onClick={handleExportReport}
          className="flex items-center gap-2 rounded-full bg-[#0f5f8f] px-5 py-3 text-sm font-semibold text-white shadow-sm"
        >
          <Download size={17} />
          Export Report
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
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              placeholder="Search by group, submission, supervisor, student, or project..."
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

          <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            All Supervisors
            <Filter size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-950">
              Submission Monitoring
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Department-level overview of all capstone submission records.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">
                Loading department submissions...
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No submissions found yet.
              </div>
            ) : (
              submissions.map((submission) => (
                <article key={submission.id} className="p-6">
                  <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[submission.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {submission.status}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            attentionStyles[submission.attention] || attentionStyles.Low
                          }`}
                        >
                          {submission.attention} Attention
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {submission.group}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-slate-950">
                        {submission.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {submission.project}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleOpenFile(submission.file)}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                      >
                        <Eye size={16} />
                        View
                      </button>

                      <button
                        onClick={handleExportReport}
                        className="flex items-center gap-2 rounded-xl bg-[#0f5f8f] px-4 py-2 text-sm font-semibold text-white"
                      >
                        <Download size={16} />
                        Export
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-4">
                    <InfoItem label="Supervisor" value={submission.supervisor} />
                    <InfoItem label="Submitted By" value={submission.submittedBy} />
                    <InfoItem label="Type" value={submission.type} />
                    <InfoItem label="Date" value={submission.date} />
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    <FileText size={16} className="text-cyan-700" />
                    {submission.file}
                  </div>

                  {submission.feedback && (
                    <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <span className="font-semibold">Feedback:</span> {submission.feedback}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-950">
                Admin Attention
              </h3>
            </div>

            <p className="leading-7 text-slate-600">{attentionMessage}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Users size={18} className="text-cyan-700" />
              <h3 className="text-lg font-semibold text-slate-950">
                Review Load
              </h3>
            </div>

            <div className="space-y-3">
              {reviewLoad.length === 0 ? (
                <LoadItem name="No pending review load" value="0 pending" />
              ) : (
                reviewLoad.map((item) => (
                  <LoadItem key={item.name} name={item.name} value={item.value} />
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">
              Submission Health
            </h3>

            <div className="mt-5 space-y-3">
              {health.map((item) => (
                <HealthItem
                  key={item}
                  icon={item.includes("approved") ? <CheckCircle2 size={16} /> : item.includes("waiting") ? <Clock size={16} /> : <XCircle size={16} />}
                  text={item}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
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

function LoadItem({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-800">{name}</span>
      <span className="text-xs font-semibold text-cyan-700">{value}</span>
    </div>
  );
}

function HealthItem({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
      <span className="text-cyan-700">{icon}</span>
      {text}
    </div>
  );
}
