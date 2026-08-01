import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Filter,
  Flag,
  Search,
  User,
  XCircle,
} from "lucide-react";

const taskStats = [
  {
    label: "Total Tasks",
    value: "14",
    subtext: "Across all milestones",
    icon: <ClipboardCheck size={20} />,
  },
  {
    label: "Completed",
    value: "6",
    subtext: "Approved or done",
    icon: <CheckCircle2 size={20} />,
  },
  {
    label: "In Progress",
    value: "2",
    subtext: "Currently active",
    icon: <Clock size={20} />,
  },
  {
    label: "Overdue",
    value: "1",
    subtext: "Needs attention",
    icon: <XCircle size={20} />,
  },
];

const tasks = [
  {
    title: "Integrate frontend dashboard with backend API",
    assignee: "Md. Sabik Hossen",
    milestone: "Sprint 1 Review",
    due: "Jun 29, 2026",
    priority: "High",
    status: "In Progress",
    description:
      "Connect dashboard data cards, task list, submission records, and feedback panel with backend API endpoints.",
  },
  {
    title: "Deploy staging environment on Vercel",
    assignee: "Md. Sabik Hossen",
    milestone: "Sprint 1 Review",
    due: "Jun 27, 2026",
    priority: "Medium",
    status: "Pending",
    description:
      "Prepare a public staging deployment so the supervisor can review the latest frontend build.",
  },
  {
    title: "Upload Sprint 1 presentation slides",
    assignee: "Nila Ashma Sara",
    milestone: "Sprint 1 Review",
    due: "Jun 18, 2026",
    priority: "High",
    status: "Overdue",
    description:
      "Upload the Sprint 1 presentation file with updated screenshots, workflow, and progress summary.",
  },
  {
    title: "Implement supervisor search filter logic",
    assignee: "Md Fahim Hassan Samir",
    milestone: "Sprint 1 Review",
    due: "Jun 22, 2026",
    priority: "Medium",
    status: "Pending",
    description:
      "Add filtering by research domain, availability, semester, and supervision capacity.",
  },
  {
    title: "Write unit tests for profile module",
    assignee: "Nafiz Ibna Mahobub",
    milestone: "Sprint 1 Review",
    due: "Jun 25, 2026",
    priority: "Low",
    status: "Pending",
    description:
      "Write tests for profile creation, skill filtering, and teammate recommendation logic.",
  },
  {
    title: "Complete SRS Module 3 — User Authentication",
    assignee: "Wasimul Bari Rahat",
    milestone: "SRS Documentation",
    due: "Jun 19, 2026",
    priority: "High",
    status: "In Progress",
    description:
      "Complete authentication flow, role-based access explanation, and session management details.",
  },
];

const statusStyles: Record<string, string> = {
  "In Progress": "bg-blue-50 text-blue-700",
  Pending: "bg-amber-50 text-amber-700",
  Overdue: "bg-red-50 text-red-700",
  Done: "bg-emerald-50 text-emerald-700",
};

const priorityStyles: Record<string, string> = {
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-emerald-50 text-emerald-700",
};

export function TasksPage() {
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
            Tasks & Milestones
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Track assigned work, milestone deadlines, task status, priority, and
            individual accountability for Group 5.
          </p>
        </div>

        <button className="rounded-full bg-cyan-100 px-4 py-2 text-sm font-medium text-cyan-700">
          Sprint 1 Active
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {taskStats.map((item) => (
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
              placeholder="Search by task title, assignee, or milestone..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            All Status
            <Filter size={16} />
          </button>

          <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            All Priority
            <Filter size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {tasks.map((task) => (
            <article
              key={task.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        statusStyles[task.status]
                      }`}
                    >
                      {task.status}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        priorityStyles[task.priority]
                      }`}
                    >
                      {task.priority} Priority
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold text-slate-950">
                    {task.title}
                  </h2>

                  <p className="mt-2 max-w-3xl leading-7 text-slate-600">
                    {task.description}
                  </p>
                </div>

                {task.assignee === "Md. Sabik Hossen" && (
                  <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                    My Task
                  </span>
                )}
              </div>

              <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-3">
                <TaskMeta
                  icon={<User size={15} />}
                  label="Assigned To"
                  value={task.assignee}
                />
                <TaskMeta
                  icon={<Calendar size={15} />}
                  label="Due Date"
                  value={task.due}
                />
                <TaskMeta
                  icon={<Flag size={15} />}
                  label="Milestone"
                  value={task.milestone}
                />
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">
              My Responsibility
            </h3>
            <p className="mt-2 leading-7 text-slate-600">
              Md. Sabik Hossen is responsible for full-stack integration,
              deployment preparation, and connecting frontend dashboard modules
              with backend APIs.
            </p>

            <div className="mt-5 space-y-3">
              <ResponsibilityItem text="Frontend-dashboard API integration" />
              <ResponsibilityItem text="Vercel staging deployment" />
              <ResponsibilityItem text="Authentication module support" />
              <ResponsibilityItem text="Sprint review technical demo" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">
              Status Guide
            </h3>

            <div className="mt-4 space-y-3">
              <GuideItem icon={<Clock size={15} />} label="In Progress" />
              <GuideItem icon={<AlertCircle size={15} />} label="Pending" />
              <GuideItem icon={<XCircle size={15} />} label="Overdue" />
              <GuideItem icon={<CheckCircle2 size={15} />} label="Done" />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function TaskMeta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
      <div className="text-cyan-700">{icon}</div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function ResponsibilityItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-800">
      <div className="h-2 w-2 rounded-full bg-cyan-600" />
      {text}
    </div>
  );
}

function GuideItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <div className="text-cyan-700">{icon}</div>
      {label}
    </div>
  );
}