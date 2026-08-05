import { useEffect, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Inbox,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

type StatCard = {
  label: string;
  value: string;
  color: string;
};

type AssignedGroup = {
  id: string;
  name: string;
  topic: string;
  progress: number;
  members: number;
  lastActivity: string;
  milestones: { done: number; total: number };
  tasks: { overdue: number; pending: number; done: number };
  pendingSubmission: boolean;
};

type PendingSubmission = {
  id: string;
  group: string;
  task: string;
  submittedBy: string;
  time: string;
  type: string;
};

type MilestoneApproval = {
  id: string;
  group: string;
  milestone: string;
  status: "awaiting" | "revision_sent";
  due: string;
};

type FeedbackItem = {
  id: string;
  group: string;
  student: string;
  item: string;
  age: string;
};

type ActivityItem = {
  time: string;
  actor: string;
  action: string;
  type: string;
};

type SupervisionRequest = {
  id: string;
  studentName: string;
  studentEmail: string;
  projectTitle: string;
  groupName: string;
  progress: number;
  members: number;
  requestedAt: string;
  message: string;
};

const defaultStats: StatCard[] = [
  { label: "Assigned Groups", value: "0", color: "#1e3a5f" },
  { label: "Pending Submissions", value: "0", color: "#f59e0b" },
  { label: "Milestone Approvals", value: "0", color: "#0891b2" },
  { label: "Feedback Needed", value: "0", color: "#ef4444" },
  { label: "Slots Available", value: "5 / 5", color: "#10b981" },
];

const activityDot: Record<string, string> = {
  upload: "#0891b2",
  task: "#10b981",
  comment: "#8b5cf6",
  alert: "#ef4444",
};

interface SupervisorDashboardProps {
  onNavigate?: (page: "feedback") => void;
}

export function SupervisorDashboard({ onNavigate }: SupervisorDashboardProps) {
  const [tab, setTab] = useState<"groups" | "submissions" | "milestones" | "requests">("groups");
  const [stats, setStats] = useState<StatCard[]>(defaultStats);
  const [assignedGroups, setAssignedGroups] = useState<AssignedGroup[]>([]);
  const [groupProgressBar, setGroupProgressBar] = useState<{ name: string; v: number }[]>([]);
  const [averageProgress, setAverageProgress] = useState(0);
  const [slots, setSlots] = useState({ taken: 0, limit: 5, remaining: 5 });
  const [supervisionRequests, setSupervisionRequests] = useState<SupervisionRequest[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [milestoneApprovals, setMilestoneApprovals] = useState<MilestoneApproval[]>([]);
  const [feedbackQueue, setFeedbackQueue] = useState<FeedbackItem[]>([]);
  const [recentStudentActivity, setRecentStudentActivity] = useState<ActivityItem[]>([]);
  const [error, setError] = useState("");

  const supervisorName = localStorage.getItem("userName") || "Supervisor";

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setError("");

        const response = await API.get("/submissions/supervisor/dashboard");

        setStats(response.data.stats || defaultStats);
        setAssignedGroups(response.data.groups || []);
        setGroupProgressBar(response.data.groupProgressBar || []);
        setAverageProgress(response.data.averageProgress || 0);
        setSlots(response.data.slots || { taken: 0, limit: 5, remaining: 5 });
        setSupervisionRequests(response.data.supervisionRequests || []);
        setPendingSubmissions(response.data.pendingSubmissions || []);
        setMilestoneApprovals(response.data.milestoneApprovals || []);
        setFeedbackQueue(response.data.feedbackQueue || []);
        setRecentStudentActivity(response.data.recentStudentActivity || []);
      } catch (err) {
        console.error("Supervisor dashboard fetch error:", err);
        setError("Failed to load supervisor dashboard data.");
      }
    };

    loadDashboard();
  }, []);

  const progressData = [{ name: "avg", value: averageProgress, fill: "#0891b2" }];

  const handleRequestDecision = async (requestId: string, decision: "Accepted" | "Rejected") => {
    try {
      await API.put(`/projects/supervision-requests/${requestId}`, { status: decision });
      const response = await API.get("/submissions/supervisor/dashboard");
      setStats(response.data.stats || defaultStats);
      setAssignedGroups(response.data.groups || []);
      setGroupProgressBar(response.data.groupProgressBar || []);
      setAverageProgress(response.data.averageProgress || 0);
      setSlots(response.data.slots || { taken: 0, limit: 5, remaining: 5 });
      setSupervisionRequests(response.data.supervisionRequests || []);
      setPendingSubmissions(response.data.pendingSubmissions || []);
      setMilestoneApprovals(response.data.milestoneApprovals || []);
      setFeedbackQueue(response.data.feedbackQueue || []);
      setRecentStudentActivity(response.data.recentStudentActivity || []);
    } catch (err) {
      console.error("Supervisor request update error:", err);
      setError("Failed to update supervision request.");
    }
  };

  return (
    <div
      className="mx-auto max-w-screen-xl space-y-6 p-6"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Supervisor Portal · CSE
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {supervisorName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lecturer · Department of CSE · East West University
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-3">
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
            style={{ background: "rgba(16,185,129,0.1)", color: "#065f46" }}
          >
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Accepting Students
          </div>
          <div className="relative">
            <Bell size={18} className="cursor-pointer text-muted-foreground" />
            <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {pendingSubmissions.length + supervisionRequests.length}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div
              className="mb-1 text-2xl font-bold tracking-tight"
              style={{ color: card.color, fontFamily: "'DM Sans', sans-serif" }}
            >
              {card.value}
            </div>
            <div className="text-xs text-muted-foreground">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Assigned Group Progress</h3>
            <TrendingUp size={14} className="text-muted-foreground" />
          </div>

          {groupProgressBar.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-muted-foreground">
              No assigned groups found.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={groupProgressBar} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#5a7190" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#0f1e35" }} width={70} />
                <Tooltip formatter={(value) => [`${value}%`, "Progress"]} contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #dde6f0" }} />
                <Bar dataKey="v" radius={[0, 6, 6, 0]}>
                  {groupProgressBar.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.v >= 75 ? "#10b981" : entry.v >= 50 ? "#0891b2" : "#f59e0b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {assignedGroups.map((group) => (
              <div key={group.id} className="relative overflow-hidden rounded-xl border border-border p-3">
                <div
                  className="absolute left-0 top-0 h-1 w-full"
                  style={{ background: group.progress >= 75 ? "#10b981" : group.progress >= 50 ? "#0891b2" : "#f59e0b" }}
                />
                <div className="mt-1">
                  <div className="text-sm font-semibold text-foreground">{group.name}</div>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {group.topic}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Users size={10} />
                    {group.members} members
                    <span className="ml-auto text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {group.progress}%
                    </span>
                  </div>
                  {group.pendingSubmission && (
                    <div
                      className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                      style={{ background: "#fef3c7", color: "#b45309" }}
                    >
                      <Inbox size={9} /> Submission pending
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 self-start font-semibold text-foreground">Avg. Progress</h3>
            <div className="relative h-32 w-32">
              <RadialBarChart width={128} height={128} cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" data={progressData} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "#e8eef5" }} />
              </RadialBarChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{averageProgress}%</span>
                <span className="text-xs text-muted-foreground">avg</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 font-semibold text-foreground">Supervision Slots</h3>
            <div className="mb-3 space-y-1">
              {Array.from({ length: slots.limit }).map((_, index) => (
                <div
                  key={index}
                  className="h-2.5 rounded-full"
                  style={{ background: index < slots.taken ? "#0891b2" : "#e8eef5" }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {slots.taken} taken · {slots.remaining} remaining
            </p>
            <button
              className="mt-3 w-full rounded-xl py-2 text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#1e3a5f,#2d5a8e)" }}
            >
              Update Availability
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex gap-1 border-b border-border pb-4">
          {(["groups", "requests", "submissions", "milestones"] as const).map((currentTab) => (
            <button
              key={currentTab}
              onClick={() => setTab(currentTab)}
              className="rounded-xl px-4 py-2 text-sm font-medium capitalize transition-all"
              style={{
                background: tab === currentTab ? "#1e3a5f" : "transparent",
                color: tab === currentTab ? "#fff" : "#5a7190",
              }}
            >
              {currentTab === "groups"
                ? "Groups"
                : currentTab === "requests"
                  ? `Requests (${supervisionRequests.length})`
                  : currentTab === "submissions"
                  ? `Submissions (${pendingSubmissions.length})`
                  : `Milestone Approvals (${milestoneApprovals.length})`}
            </button>
          ))}
        </div>

        {tab === "requests" && (
          <div className="space-y-3">
            {supervisionRequests.length === 0 ? (
              <EmptyState text="No pending supervision requests right now." />
            ) : (
              supervisionRequests.map((request) => (
                <div key={request.id} className="rounded-xl border border-border p-4 transition-colors hover:bg-secondary/60">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-medium text-foreground">{request.studentName}</div>
                        <span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">
                          {request.groupName}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{request.studentEmail}</div>
                      <div className="mt-2 text-sm text-foreground">{request.projectTitle}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {request.members} members · {request.progress}% progress · Requested {request.requestedAt}
                      </div>
                      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-muted-foreground">
                        {request.message}
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 gap-2">
                      <button
                        onClick={() => handleRequestDecision(request.id, "Accepted")}
                        className="rounded-lg px-3 py-2 text-xs font-semibold text-white"
                        style={{ background: "linear-gradient(135deg,#10b981,#0f766e)" }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRequestDecision(request.id, "Rejected")}
                        className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-card"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "submissions" && (
          <div className="space-y-3">
            {pendingSubmissions.length === 0 ? (
              <EmptyState text="No pending submissions right now." />
            ) : (
              pendingSubmissions.map((submission) => (
                <SubmissionRow key={submission.id} submission={submission} />
              ))
            )}
          </div>
        )}

        {tab === "milestones" && (
          <div className="space-y-3">
            {milestoneApprovals.length === 0 ? (
              <EmptyState text="No milestone approvals right now." />
            ) : (
              milestoneApprovals.map((milestone) => (
                <div key={milestone.id} className="flex items-center gap-4 rounded-xl border border-border p-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{milestone.milestone}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <Users size={10} />
                      {milestone.group}
                      <Calendar size={10} />
                      Due {milestone.due}
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2 py-1 text-xs font-semibold"
                    style={{
                      background: milestone.status === "awaiting" ? "#fef3c7" : "#dbeafe",
                      color: milestone.status === "awaiting" ? "#b45309" : "#1d4ed8",
                    }}
                  >
                    {milestone.status === "awaiting" ? "Awaiting Approval" : "Revision Sent"}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "groups" && (
          <div className="space-y-3">
            {assignedGroups.length === 0 ? (
              <EmptyState text="No assigned groups found." />
            ) : (
              assignedGroups.map((group) => (
                <div key={group.id} className="flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-secondary">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                    style={{ background: "rgba(30,58,95,0.08)", color: "#1e3a5f" }}
                  >
                    {group.name.replace("Group ", "G")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{group.topic}</div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users size={10} />
                        {group.members} members
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        Active {group.lastActivity}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={10} className="text-emerald-500" />
                        {group.milestones.done}/{group.milestones.total} milestones
                      </span>
                      {group.tasks.pending > 0 && (
                        <span className="flex items-center gap-1" style={{ color: "#f59e0b" }}>
                          <AlertCircle size={10} />
                          {group.tasks.pending} pending
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">{group.progress}%</div>
                      <div className="mt-1 h-1.5 w-20 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${group.progress}%`, background: group.progress >= 75 ? "#10b981" : "#0891b2" }}
                        />
                      </div>
                    </div>
                    <button className="rounded-lg border border-border p-2 transition-colors hover:bg-card">
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Feedback Queue</h3>
            <span className="rounded-full px-2 py-1 text-xs font-semibold" style={{ background: "#fee2e2", color: "#b91c1c" }}>
              {feedbackQueue.length} awaiting
            </span>
          </div>
          <div className="space-y-3">
            {feedbackQueue.length === 0 ? (
              <EmptyState text="No feedback queue items." />
            ) : (
              feedbackQueue.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-xl p-3" style={{ background: "#f8fafc" }}>
                  <MessageSquare size={16} className="mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{item.item}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {item.group} · {item.student} · {item.age} waiting
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate?.("feedback")}
                    className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ background: "#1e3a5f" }}
                  >
                    Respond
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Recent Student Activity</h3>
            <button className="flex items-center gap-1 text-xs text-accent hover:opacity-80">
              View all <ArrowRight size={11} />
            </button>
          </div>
          <div className="space-y-3.5">
            {recentStudentActivity.length === 0 ? (
              <EmptyState text="No recent student activity." />
            ) : (
              recentStudentActivity.map((activity, index) => (
                <div key={`${activity.actor}-${activity.time}-${index}`} className="flex items-start gap-3">
                  <div
                    className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ background: activityDot[activity.type] || "#94a3b8" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed text-foreground">
                      <span className="font-semibold">{activity.actor}</span> {activity.action}
                    </p>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {activity.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmissionRow({ submission }: { submission: PendingSubmission }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-secondary">
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: "rgba(8,145,178,0.1)" }}
      >
        <FileText size={18} style={{ color: "#0891b2" }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{submission.task}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {submission.group} · Submitted by {submission.submittedBy} · {submission.time}
        </div>
      </div>
      <div className="flex flex-shrink-0 gap-2">
        <button className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "#10b981" }}>
          Review
        </button>
        <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-card">
          View
        </button>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
