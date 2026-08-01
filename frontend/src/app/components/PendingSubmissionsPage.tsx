import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import API from "../lib/api";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  MessageSquare,
  Search,
  UserCheck,
  XCircle,
} from "lucide-react";

type ReviewStat = {
  label: string;
  value: string;
  subtext: string;
  icon?: ReactNode;
};

type SupervisorSubmission = {
  id: string;
  title: string;
  group: string;
  project: string;
  submittedBy: string;
  milestone: string;
  file: string;
  submittedDate: string;
  type: string;
  status: string;
  priority: string;
  feedback?: string;
};

const defaultReviewStats: ReviewStat[] = [
  {
    label: "Pending Review",
    value: "0",
    subtext: "Waiting for supervisor decision",
  },
  {
    label: "Revision Needed",
    value: "0",
    subtext: "Returned to students",
  },
  {
    label: "Approved",
    value: "0",
    subtext: "Accepted this semester",
  },
  {
    label: "Overdue",
    value: "0",
    subtext: "Needs immediate attention",
  },
];

const statIcons: Record<string, ReactNode> = {
  "Pending Review": <Clock size={20} />,
  "Revision Needed": <AlertCircle size={20} />,
  Approved: <CheckCircle2 size={20} />,
  Overdue: <XCircle size={20} />,
};

const statusStyles: Record<string, string> = {
  "Pending Review": "bg-blue-50 text-blue-700",
  "Revision Needed": "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Overdue: "bg-red-50 text-red-700",
};

const priorityStyles: Record<string, string> = {
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-700",
};

export function PendingSubmissionsPage() {
  const [reviewStats, setReviewStats] = useState<ReviewStat[]>(defaultReviewStats);
  const [submissions, setSubmissions] = useState<SupervisorSubmission[]>([]);
  const [reviewFocus, setReviewFocus] = useState("No submissions are waiting for review right now.");
  const [quickFeedback, setQuickFeedback] = useState("");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await API.get("/submissions/supervisor");

      setReviewStats(response.data.stats || defaultReviewStats);
      setSubmissions(response.data.submissions || []);
      setReviewFocus(response.data.reviewFocus || "No submissions are waiting for review right now.");
    } catch (err) {
      console.error("Supervisor submissions fetch error:", err);
      setError("Failed to load supervisor submissions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const updateSubmissionStatus = async (
    submissionId: string,
    status: "Approved" | "Revision Requested",
    feedback = ""
  ) => {
    try {
      await API.patch(`/submissions/supervisor/${submissionId}/review`, {
        status,
        feedback,
      });

      await loadSubmissions();
      setSuccessMessage(
        status === "Approved"
          ? "Submission approved successfully."
          : "Revision feedback sent successfully."
      );
    } catch (err) {
      console.error("Supervisor review update error:", err);
      alert("Review update failed. Please make sure the backend server is running and try again.");
    }
  };

  const handleApproveSubmission = async (submission: SupervisorSubmission) => {
    const feedback = window.prompt(
      "Write an approval note for the student:",
      submission.feedback || "Good work. This submission is approved."
    );

    if (feedback === null) return;

    await updateSubmissionStatus(
      submission.id,
      "Approved",
      feedback.trim() || "Good work. This submission is approved."
    );
  };

  const handleRequestRevision = async (submission: SupervisorSubmission) => {
    const feedback = window.prompt(
      "Write clear revision feedback for the student:",
      submission.feedback || ""
    );

    if (feedback === null) return;

    if (!feedback.trim()) {
      alert("Please write revision feedback before requesting changes.");
      return;
    }

    await updateSubmissionStatus(submission.id, "Revision Requested", feedback.trim());
  };

  const handleQuickFeedback = async () => {
    if (!selectedSubmissionId) {
      alert("Please select a submission first.");
      return;
    }

    if (!quickFeedback.trim()) {
      alert("Please write feedback before sending.");
      return;
    }

    await updateSubmissionStatus(selectedSubmissionId, "Revision Requested", quickFeedback.trim());
    setQuickFeedback("");
    setSelectedSubmissionId("");
  };

  const handleOpenFile = (file: string) => {
    if (file.startsWith("http://") || file.startsWith("https://")) {
      window.open(file, "_blank");
      return;
    }

    alert(`File/link: ${file}`);
  };

  return (
    <section className="min-h-screen bg-[#f3f6fa] px-8 py-8">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <div
            className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            CapTrack - Supervisor
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Pending Submissions
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            Review student deliverables, approve completed work, request
            revisions, and track group-wise submission status.
          </p>
        </div>

        <button
          onClick={handleQuickFeedback}
          className="flex items-center gap-2 rounded-full bg-[#0f5f8f] px-5 py-3 text-sm font-semibold text-white shadow-sm"
        >
          <MessageSquare size={17} />
          Write Feedback
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="text-emerald-800">
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reviewStats.map((item) => (
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
              placeholder="Search by group, project, student, milestone, or file..."
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
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              Loading submissions...
            </div>
          ) : submissions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              No submissions found for your assigned projects.
            </div>
          ) : (
            submissions.map((submission) => (
              <article
                key={submission.id}
                onClick={() => setSelectedSubmissionId(submission.id)}
                className={`cursor-pointer rounded-2xl border bg-white p-6 shadow-sm ${
                  selectedSubmissionId === submission.id
                    ? "border-cyan-500 ring-2 ring-cyan-100"
                    : "border-slate-200"
                }`}
              >
                <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
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
                          priorityStyles[submission.priority] || priorityStyles.Low
                        }`}
                      >
                        {submission.priority} Priority
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {submission.type}
                      </span>
                    </div>

                    <h2 className="text-xl font-semibold text-slate-950">
                      {submission.title}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {submission.project}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenFile(submission.file);
                      }}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                    >
                      <Eye size={16} />
                      View
                    </button>

                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenFile(submission.file);
                      }}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-4">
                  <InfoItem label="Group" value={submission.group} />
                  <InfoItem label="Submitted By" value={submission.submittedBy} />
                  <InfoItem label="Milestone" value={submission.milestone} />
                  <InfoItem label="Submitted Date" value={submission.submittedDate} />
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

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleApproveSubmission(submission);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
                  >
                    <CheckCircle2 size={17} />
                    Approve
                  </button>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRequestRevision(submission);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white"
                  >
                    <AlertCircle size={17} />
                    Request Revision
                  </button>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedSubmissionId(submission.id);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-[#0f5f8f] px-5 py-3 text-sm font-semibold text-white"
                  >
                    <MessageSquare size={17} />
                    Add Feedback
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <UserCheck size={18} className="text-cyan-700" />
              <h3 className="text-lg font-semibold text-slate-950">
                Review Focus
              </h3>
            </div>

            <p className="leading-7 text-slate-600">{reviewFocus}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">
              Review Checklist
            </h3>

            <div className="mt-5 space-y-3">
              <ChecklistItem text="Check file or repository link" />
              <ChecklistItem text="Verify milestone requirement" />
              <ChecklistItem text="Review task ownership" />
              <ChecklistItem text="Approve or request revision" />
              <ChecklistItem text="Write clear feedback comment" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">
              Quick Feedback
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Select a submission card, write feedback, then send it as a revision request.
            </p>

            <textarea
              value={quickFeedback}
              onChange={(event) => setQuickFeedback(event.target.value)}
              placeholder="Write feedback for selected submission..."
              className="mt-4 h-32 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none"
            />

            <button
              onClick={handleQuickFeedback}
              className="mt-4 w-full rounded-xl bg-[#0f5f8f] px-4 py-3 text-sm font-semibold text-white"
            >
              Send Feedback
            </button>
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

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <div className="h-2 w-2 rounded-full bg-cyan-600" />
      {text}
    </div>
  );
}

