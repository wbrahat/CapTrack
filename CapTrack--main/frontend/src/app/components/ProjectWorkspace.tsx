import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Flag,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Upload,
  User,
  Users,
  XCircle,
} from "lucide-react";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["x-auth-token"] = token;
  return config;
});

type WorkspaceTask = {
  id: string;
  title: string;
  assignee: string;
  priority: "high" | "medium" | "low";
  status: "done" | "in-progress" | "pending" | "overdue";
  due: string;
  submissions: number;
};

type WorkspaceMilestone = {
  id: string;
  title: string;
  due: string;
  status: "approved" | "active" | "upcoming";
  tasks: WorkspaceTask[];
};

type WorkspaceFeedback = {
  author: string;
  time: string;
  text: string;
};

type SubmissionHistoryItem = {
  task: string;
  submittedBy: string;
  date: string;
  status: string;
  feedback: string;
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; bg: string; color: string }> = {
  done: { label: "Done", icon: <CheckCircle2 size={12} />, bg: "#d1fae5", color: "#065f46" },
  "in-progress": { label: "In Progress", icon: <Clock size={12} />, bg: "#dbeafe", color: "#1d4ed8" },
  pending: { label: "Pending", icon: <AlertCircle size={12} />, bg: "#fef3c7", color: "#b45309" },
  overdue: { label: "Revision Needed", icon: <XCircle size={12} />, bg: "#fee2e2", color: "#b91c1c" },
};

const milestoneStatusConfig: Record<string, { dot: string; label: string }> = {
  approved: { dot: "#10b981", label: "Approved" },
  active: { dot: "#0891b2", label: "Active" },
  upcoming: { dot: "#94a3b8", label: "Upcoming" },
};

const priorityColors: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

function SummaryCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#e0f2fe", color: "#0891b2" }}>
          {icon}
        </div>
      </div>
      <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
        {label}
      </div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{subtext}</div>
    </div>
  );
}

function getSubmissionStatusStyle(status: string) {
  if (status === "Approved") return { background: "#d1fae5", color: "#065f46" };
  if (status === "Revision Needed") return { background: "#fef3c7", color: "#b45309" };
  return { background: "#e0f2fe", color: "#0369a1" };
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

function ProjectWorkspaceContent({ viewerRole = "student" }: { viewerRole?: string }) {
  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [feedbackInput, setFeedbackInput] = useState("");
  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        setLoading(true);
        const response = await API.get("/projects/workspace");
        setWorkspaceData(response.data);
        const firstActiveMilestone = response.data.milestones?.find((item: WorkspaceMilestone) => item.status === "active");
        setExpandedMilestones(new Set([firstActiveMilestone?.id || response.data.milestones?.[0]?.id].filter(Boolean)));
      } catch (err) {
        console.error("Project workspace fetch error:", err);
        setError("Failed to load project workspace.");
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  }, []);

  const project = workspaceData?.project || {};
  const milestones: WorkspaceMilestone[] = workspaceData?.milestones || [];
  const feedback: WorkspaceFeedback[] = workspaceData?.feedback || [];
  const submissionHistory: SubmissionHistoryItem[] = workspaceData?.submissionHistory || [];
  const taskStats = workspaceData?.stats || { totalTasks: 0, completedTasks: 0, inProgressTasks: 0, overdueTasks: 0, nextDeadline: "No upcoming deadline", nextDeadlineTitle: "No milestone" };

  const toggleMilestone = (id: string) => {
    setExpandedMilestones((previousMilestones) => {
      const nextMilestones = new Set(previousMilestones);
      if (nextMilestones.has(id)) nextMilestones.delete(id);
      else nextMilestones.add(id);
      return nextMilestones;
    });
  };

  if (loading) {
    return <div className="mx-auto max-w-7xl p-6 text-sm text-muted-foreground">Loading project workspace...</div>;
  }

  if (error) {
    // Show a user-friendly message when the workspace fails to load. The ProjectAccessGate check is handled at the parent level.
    return <div className="mx-auto max-w-7xl p-6 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>Project Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.title || "CapTrack"} - {project.groupName || "Group"} - Supervisor: {project.supervisor || "Not Assigned Yet"} - {project.sprint || "Active Sprint"}
          </p>
        </div>

        {viewerRole === "supervisor" && (
          <button className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "#1e3a5f" }}>
            <Plus size={15} /> Add Milestone
          </button>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard icon={<BarChart3 size={20} />} label="Overall Progress" value={`${project.progress || 0}%`} subtext={`${project.status || "Pending"} project`} />
        <SummaryCard icon={<CheckCircle2 size={20} />} label="Tasks Completed" value={`${taskStats.completedTasks} / ${taskStats.totalTasks}`} subtext={`${taskStats.overdueTasks} need revision`} />
        <SummaryCard icon={<Calendar size={20} />} label="Next Deadline" value={taskStats.nextDeadline} subtext={taskStats.nextDeadlineTitle} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {milestones.map((milestone) => {
            const expanded = expandedMilestones.has(milestone.id);
            const milestoneStatus = milestoneStatusConfig[milestone.status] || milestoneStatusConfig.upcoming;
            const doneCount = milestone.tasks.filter((task) => task.status === "done").length;
            const taskCount = milestone.tasks.length;
            const progressWidth = taskCount > 0 ? `${(doneCount / taskCount) * 100}%` : "0%";

            return (
              <div key={milestone.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <button onClick={() => toggleMilestone(milestone.id)} className="flex w-full items-center gap-3 px-5 py-4 transition-colors hover:bg-secondary">
                  <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: milestoneStatus.dot }} />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-foreground">{milestone.title}</div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar size={10} />Due {milestone.due}</span>
                      <span>{doneCount}/{taskCount} tasks done</span>
                    </div>
                  </div>
                  <span className="mr-2 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: `${milestoneStatus.dot}20`, color: milestoneStatus.dot }}>
                    {milestoneStatus.label}
                  </span>
                  <div className="mr-2 h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: progressWidth, background: milestoneStatus.dot }} />
                  </div>
                  {expanded ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
                </button>

                {expanded && (
                  <div className="border-t border-border">
                    {milestone.tasks.length === 0 ? (
                      <div className="px-5 py-4 text-sm text-muted-foreground">No submission has been linked to this milestone yet.</div>
                    ) : (
                      milestone.tasks.map((task) => {
                        const taskStatus = statusConfig[task.status] || statusConfig.pending;
                        const isActive = activeTask === task.id;

                        return (
                          <div key={task.id} className="border-b border-border last:border-b-0">
                            <div className="flex cursor-pointer items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary" onClick={() => setActiveTask(isActive ? null : task.id)}>
                              <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: priorityColors[task.priority] }} />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm text-foreground">{task.title}</div>
                                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><User size={10} />{task.assignee}</span>
                                  <span className="flex items-center gap-1"><Calendar size={10} />{task.due}</span>
                                  <span className="flex items-center gap-1"><Paperclip size={10} />{task.submissions} submission{task.submissions !== 1 ? "s" : ""}</span>
                                </div>
                              </div>
                              <span className="flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: taskStatus.bg, color: taskStatus.color }}>
                                {taskStatus.icon}{taskStatus.label}
                              </span>
                              <span className="rounded px-1.5 py-0.5 text-xs" style={{ background: `${priorityColors[task.priority]}18`, color: priorityColors[task.priority] }}><Flag size={10} /></span>
                            </div>

                            {isActive && (
                              <div className="border-t border-border bg-secondary px-5 py-4">
                                {viewerRole === "student" && task.status !== "done" && (
                                  <div>
                                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Submit Deliverable</div>
                                    <div className="flex gap-2">
                                      <input placeholder="Use the Submissions page to upload or paste a link." disabled className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground outline-none" />
                                      <button className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white" style={{ background: "#0891b2" }}><Upload size={13} /> Submit</button>
                                    </div>
                                  </div>
                                )}
                                {viewerRole === "supervisor" && (
                                  <div className="flex gap-2">
                                    <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-white" style={{ background: "#10b981" }}>Approve</button>
                                    <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-white" style={{ background: "#f59e0b" }}>Request Revision</button>
                                    <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-card">Assign Score</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}

                    {viewerRole === "supervisor" && (
                      <div className="px-5 py-3">
                        {showAddTask === milestone.id ? (
                          <div className="flex gap-2">
                            <input placeholder="New task title..." className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none" />
                            <button className="rounded-lg px-3 py-2 text-xs text-white" style={{ background: "#1e3a5f" }}>Add</button>
                            <button onClick={() => setShowAddTask(null)} className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setShowAddTask(milestone.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-accent"><Plus size={12} /> Add task</button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <FileText size={16} className="text-accent" />
              <h3 className="text-foreground">Submission History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-secondary text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Task</th>
                    <th className="px-5 py-3 font-medium">Submitted By</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {submissionHistory.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-4 text-muted-foreground">No submissions yet.</td></tr>
                  ) : (
                    submissionHistory.map((item) => {
                      const statusStyle = getSubmissionStatusStyle(item.status);
                      return (
                        <tr key={`${item.task}-${item.date}`} className="border-t border-border">
                          <td className="px-5 py-3 text-foreground">{item.task}</td>
                          <td className="px-5 py-3 text-muted-foreground">{item.submittedBy}</td>
                          <td className="px-5 py-3 text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{item.date}</td>
                          <td className="px-5 py-3"><span className="rounded-full px-2.5 py-1 text-xs font-medium" style={statusStyle}>{item.status}</span></td>
                          <td className="px-5 py-3"><button className="text-sm font-medium text-cyan-700 hover:text-cyan-800">{item.feedback}</button></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2"><MessageSquare size={16} className="text-accent" /><h3 className="text-foreground">Supervisor Feedback</h3></div>
            <div className="mb-4 space-y-3">
              {feedback.length === 0 ? (
                <div className="rounded-lg p-3 text-sm text-muted-foreground" style={{ background: "#f0f4f8" }}>No supervisor feedback yet.</div>
              ) : (
                feedback.map((feedbackItem) => (
                  <div key={`${feedbackItem.author}-${feedbackItem.time}-${feedbackItem.text}`} className="rounded-lg p-3" style={{ background: "#f0f4f8" }}>
                    <div className="mb-1.5 flex justify-between text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                      <span className="font-medium text-foreground">{feedbackItem.author}</span>
                      <span>{feedbackItem.time}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground">{feedbackItem.text}</p>
                  </div>
                ))
              )}
            </div>
            {viewerRole === "supervisor" && (
              <div className="space-y-2">
                <textarea value={feedbackInput} onChange={(event) => setFeedbackInput(event.target.value)} placeholder="Write feedback for the group..." rows={3} className="w-full resize-none rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none" />
                <button className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-white" style={{ background: "#1e3a5f" }}><Send size={13} /> Send Feedback</button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2"><Users size={16} className="text-accent" /><h3 className="text-foreground">Sprint Summary</h3></div>
            <div className="space-y-3">
              {[
                { label: "Total Tasks", value: taskStats.totalTasks, color: "#1e3a5f" },
                { label: "Completed", value: taskStats.completedTasks, color: "#10b981" },
                { label: "In Progress", value: taskStats.inProgressTasks, color: "#0891b2" },
                { label: "Needs Revision", value: taskStats.overdueTasks, color: "#ef4444" },
              ].map((summaryItem) => (
                <div key={summaryItem.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{summaryItem.label}</span>
                  <span className="font-semibold" style={{ color: summaryItem.color, fontFamily: "'DM Mono', monospace" }}>{summaryItem.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectWorkspace({ viewerRole = "student", isProjectGroupAssigned = true }: { viewerRole?: string; isProjectGroupAssigned?: boolean }) {
  if (!isProjectGroupAssigned) {
    return <ProjectAccessGate />;
  }

  return <ProjectWorkspaceContent viewerRole={viewerRole} />;
}
