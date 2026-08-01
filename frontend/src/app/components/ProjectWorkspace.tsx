import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import API from "../lib/api";
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

type SupervisorGroup = {
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

type SupervisorSubmission = {
  id: string;
  group: string;
  task: string;
  submittedBy: string;
  time: string;
  type: string;
};

type SupervisorFeedback = {
  id: string;
  group: string;
  student: string;
  item: string;
  age: string;
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

function SupervisorWorkspaceContent() {
  const [groups, setGroups] = useState<SupervisorGroup[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<SupervisorSubmission[]>([]);
  const [feedbackQueue, setFeedbackQueue] = useState<SupervisorFeedback[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSupervisorWorkspace = async () => {
      try {
        setLoading(true);
        setError("");
        try {
          const response = await API.get("/submissions/supervisor/dashboard");
          const loadedGroups: SupervisorGroup[] = response.data.groups || [];
          setGroups(loadedGroups);
          setPendingSubmissions(response.data.pendingSubmissions || []);
          setFeedbackQueue(response.data.feedbackQueue || []);
          setSelectedGroupId(loadedGroups[0]?.id || "");
        } catch (dashboardError) {
          console.warn("Supervisor dashboard workspace fallback:", dashboardError);

          const response = await API.get("/projects/workspace");
          const project = response.data.project || {};
          const stats = response.data.stats || {};
          const fallbackGroup: SupervisorGroup = {
            id: project.id || "assigned-group",
            name: project.groupName || "Assigned Group",
            topic: project.title || "Capstone Project",
            progress: project.progress || 0,
            members: project.members || 1,
            lastActivity: "recently",
            milestones: {
              done: stats.completedTasks || 0,
              total: stats.totalTasks || 0,
            },
            tasks: {
              overdue: stats.overdueTasks || 0,
              pending: stats.inProgressTasks || 0,
              done: stats.completedTasks || 0,
            },
            pendingSubmission: Boolean(stats.inProgressTasks),
          };

          setGroups([fallbackGroup]);
          setPendingSubmissions([]);
          setFeedbackQueue([]);
          setSelectedGroupId(fallbackGroup.id);
        }
      } catch (err) {
        console.error("Supervisor workspace fetch error:", err);
        setGroups([]);
        setPendingSubmissions([]);
        setFeedbackQueue([]);
        setError("");
      } finally {
        setLoading(false);
      }
    };

    loadSupervisorWorkspace();
  }, []);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) || groups[0];
  const groupSubmissions = selectedGroup
    ? pendingSubmissions.filter((submission) => submission.group === selectedGroup.name)
    : [];
  const groupFeedback = selectedGroup
    ? feedbackQueue.filter((item) => item.group === selectedGroup.name)
    : [];

  if (loading) {
    return <div className="mx-auto max-w-7xl p-6 text-sm text-muted-foreground">Loading supervisor workspace...</div>;
  }

  if (error) {
    return <div className="mx-auto max-w-7xl p-6 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
            Supervisor Portal · Workspace
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Group Workspaces</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Manage each assigned capstone group separately, similar to a classroom workspace.
          </p>
        </div>

        <div className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
          {groups.length} assigned group{groups.length !== 1 ? "s" : ""}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">No assigned groups yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Student supervision requests will appear on your dashboard first. Accepted groups will show here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => {
              const active = selectedGroup?.id === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  className="rounded-2xl border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  style={{
                    borderColor: active ? "#0891b2" : "var(--border)",
                  }}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-foreground">{group.name}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{group.topic}</p>
                    </div>
                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
                      {group.progress}%
                    </span>
                  </div>

                  <div className="mb-4 h-2 rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-cyan-600" style={{ width: `${group.progress}%` }} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <div className="text-lg font-semibold text-foreground">{group.members}</div>
                      <div className="text-xs text-muted-foreground">Members</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <div className="text-lg font-semibold text-foreground">{group.milestones.done}/{group.milestones.total}</div>
                      <div className="text-xs text-muted-foreground">Milestones</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <div className="text-lg font-semibold text-foreground">{group.tasks.pending}</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedGroup && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
              <div className="space-y-5">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground">{selectedGroup.name} Workspace</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedGroup.topic}</p>
                    </div>
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
                      Active {selectedGroup.lastActivity}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <SummaryCard icon={<Users size={20} />} label="Members" value={String(selectedGroup.members)} subtext="Students in this group" />
                    <SummaryCard icon={<BarChart3 size={20} />} label="Progress" value={`${selectedGroup.progress}%`} subtext="Overall completion" />
                    <SummaryCard icon={<CheckCircle2 size={20} />} label="Milestones" value={`${selectedGroup.milestones.done}/${selectedGroup.milestones.total}`} subtext="Completed milestones" />
                    <SummaryCard icon={<Clock size={20} />} label="Pending Tasks" value={String(selectedGroup.tasks.pending)} subtext="Need supervisor action" />
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Group Submissions</h3>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      {groupSubmissions.length} pending
                    </span>
                  </div>

                  <div className="space-y-3">
                    {groupSubmissions.length === 0 ? (
                      <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-muted-foreground">
                        No pending submissions for this group.
                      </div>
                    ) : (
                      groupSubmissions.map((submission) => (
                        <div key={submission.id} className="flex items-center gap-4 rounded-xl border border-border p-4">
                          <FileText size={18} className="text-cyan-700" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-foreground">{submission.task}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Submitted by {submission.submittedBy} · {submission.time} · {submission.type}
                            </div>
                          </div>
                          <button className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-semibold text-white">
                            Review
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <aside className="space-y-5">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">Feedback Queue</h3>
                  <div className="space-y-3">
                    {groupFeedback.length === 0 ? (
                      <div className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-muted-foreground">
                        No feedback waiting for this group.
                      </div>
                    ) : (
                      groupFeedback.map((item) => (
                        <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                          <div className="font-medium text-foreground">{item.item}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {item.student} · {item.age} waiting
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">Workspace Tools</h3>
                  <div className="space-y-3">
                    <button className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-foreground">
                      Create milestone <Plus size={15} />
                    </button>
                    <button className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-foreground">
                      Send group message <MessageSquare size={15} />
                    </button>
                    <button className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-foreground">
                      View group files <Paperclip size={15} />
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function ProjectWorkspace({ viewerRole = "student", isProjectGroupAssigned = true }: { viewerRole?: string; isProjectGroupAssigned?: boolean }) {
  if (viewerRole === "supervisor") {
    return <SupervisorWorkspaceContent />;
  }

  if (!isProjectGroupAssigned) {
    return <ProjectAccessGate />;
  }

  return <ProjectWorkspaceContent viewerRole={viewerRole} />;
}
