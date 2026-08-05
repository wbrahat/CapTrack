import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Filter,
  MessageSquare,
  Search,
  Users,
} from "lucide-react";

const milestoneStats = [
  {
    label: "Total Milestones",
    value: "9",
    subtext: "Across assigned groups",
    icon: <ClipboardCheck size={20} />,
  },
  {
    label: "Completed",
    value: "4",
    subtext: "Approved milestones",
    icon: <CheckCircle2 size={20} />,
  },
  {
    label: "In Progress",
    value: "3",
    subtext: "Currently active",
    icon: <Clock size={20} />,
  },
  {
    label: "Needs Attention",
    value: "2",
    subtext: "Overdue or blocked",
    icon: <AlertCircle size={20} />,
  },
];

const milestoneTasks = [
  {
    group: "Group 5",
    project: "CapTrack: Capstone Project Lifecycle Management",
    milestone: "Sprint 1 Review",
    task: "Frontend Dashboard API Integration",
    assignedTo: "Md. Sabik Hossen",
    dueDate: "Jun 29, 2026",
    status: "In Progress",
    priority: "High",
    progress: "70%",
    note: "Frontend dashboard integration with backend APIs is currently active.",
  },
  {
    group: "Group 5",
    project: "CapTrack: Capstone Project Lifecycle Management",
    milestone: "Sprint 1 Review",
    task: "Upload Sprint 1 Presentation Slides",
    assignedTo: "Nila Ashma Sara",
    dueDate: "Jun 18, 2026",
    status: "Overdue",
    priority: "High",
    progress: "40%",
    note: "Slides need updated workflow diagram and improved demo screenshots.",
  },
  {
    group: "Group 5",
    project: "CapTrack: Capstone Project Lifecycle Management",
    milestone: "SRS Documentation",
    task: "Add Database Schema",
    assignedTo: "Samira Akter",
    dueDate: "Jun 24, 2026",
    status: "Pending Review",
    priority: "Medium",
    progress: "85%",
    note: "Revised SRS is submitted and waiting for supervisor review.",
  },
  {
    group: "Group 11",
    project: "InsightHub: Real-Time BI Dashboard for SMEs",
    milestone: "Prototype Demo",
    task: "Prepare BI Dashboard Demo",
    assignedTo: "Tanvir Rahman",
    dueDate: "Jun 26, 2026",
    status: "In Progress",
    priority: "Medium",
    progress: "65%",
    note: "Dashboard prototype is progressing, but data visualization needs polish.",
  },
  {
    group: "Group 19",
    project: "MediSync: Hospital Resource Scheduler",
    milestone: "Requirement Review",
    task: "Finalize Requirement Analysis",
    assignedTo: "Group 19 Team",
    dueDate: "Jun 20, 2026",
    status: "Revision Needed",
    priority: "Medium",
    progress: "45%",
    note: "Requirement scope is unclear. Needs revision before approval.",
  },
];

const statusStyles: Record<string, string> = {
  "In Progress": "bg-blue-50 text-blue-700",
  "Pending Review": "bg-cyan-50 text-cyan-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Overdue: "bg-red-50 text-red-700",
  "Revision Needed": "bg-amber-50 text-amber-700",
};

const priorityStyles: Record<string, string> = {
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-700",
};

export function MilestoneTasksPage() {
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
            Milestone Tasks
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            Monitor group-wise milestone tasks, review task progress, identify
            overdue work, and provide supervisor feedback.
          </p>
        </div>

        <button className="flex items-center gap-2 rounded-full bg-[#0f5f8f] px-5 py-3 text-sm font-semibold text-white shadow-sm">
          <ClipboardCheck size={17} />
          Create Milestone
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {milestoneStats.map((item) => (
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
              placeholder="Search by group, task, assignee, milestone, or project..."
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
          {milestoneTasks.map((task) => (
            <article
              key={`${task.group}-${task.task}`}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[task.status]
                      }`}
                    >
                      {task.status}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        priorityStyles[task.priority]
                      }`}
                    >
                      {task.priority} Priority
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {task.group}
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold text-slate-950">
                    {task.task}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {task.project}
                  </p>
                </div>

                <div className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
                  {task.progress} Progress
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-4">
                <InfoItem label="Milestone" value={task.milestone} />
                <InfoItem label="Assigned To" value={task.assignedTo} />
                <InfoItem label="Due Date" value={task.dueDate} />
                <InfoItem label="Group" value={task.group} />
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                {task.note}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button className="flex items-center gap-2 rounded-xl bg-[#0f5f8f] px-5 py-3 text-sm font-semibold text-white">
                  <MessageSquare size={17} />
                  Add Feedback
                </button>

                <button className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white">
                  <CheckCircle2 size={17} />
                  Approve
                </button>

                <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
                  <CalendarDays size={17} />
                  Extend Deadline
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-950">
                Attention Needed
              </h3>
            </div>

            <p className="leading-7 text-slate-600">
              Group 5 has one overdue task in Sprint 1 Review. Prioritize slide
              revision and frontend API integration review before the next
              meeting.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Users size={18} className="text-cyan-700" />
              <h3 className="text-lg font-semibold text-slate-950">
                Group Summary
              </h3>
            </div>

            <div className="space-y-3">
              <GroupProgress group="Group 5" project="CapTrack" progress="68%" />
              <GroupProgress group="Group 11" project="InsightHub" progress="82%" />
              <GroupProgress group="Group 19" project="MediSync" progress="45%" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">
              Supervisor Checklist
            </h3>

            <div className="mt-5 space-y-3">
              <ChecklistItem text="Review overdue Sprint 1 slide task" />
              <ChecklistItem text="Check CapTrack API integration progress" />
              <ChecklistItem text="Approve completed SRS revision" />
              <ChecklistItem text="Send clear feedback to each group" />
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

function GroupProgress({
  group,
  project,
  progress,
}: {
  group: string;
  project: string;
  progress: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-900">{group}</div>
          <div className="text-sm text-slate-500">{project}</div>
        </div>

        <div className="text-sm font-semibold text-cyan-700">{progress}</div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-cyan-600"
          style={{ width: progress }}
        />
      </div>
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