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

const queueStats = [
  {
    label: "Feedback Queue",
    value: "6",
    subtext: "Items waiting for review",
    icon: <MessageSquare size={20} />,
  },
  {
    label: "Urgent Feedback",
    value: "2",
    subtext: "Overdue or revision needed",
    icon: <AlertCircle size={20} />,
  },
  {
    label: "Sent Feedback",
    value: "12",
    subtext: "This semester",
    icon: <Send size={20} />,
  },
  {
    label: "Resolved",
    value: "8",
    subtext: "Closed review items",
    icon: <CheckCircle2 size={20} />,
  },
];

const feedbackQueue = [
  {
    group: "Group 5",
    project: "CapTrack: Capstone Project Lifecycle Management",
    task: "Sprint 1 Presentation Slides",
    submittedBy: "Nila Ashma Sara",
    file: "sprint_1_slides.pptx",
    submittedDate: "Jun 18, 2026",
    status: "Revision Needed",
    priority: "High",
    message:
      "Slides need updated workflow diagram, clearer task distribution, and improved demo screenshots before final Sprint 1 review.",
  },
  {
    group: "Group 5",
    project: "CapTrack: Capstone Project Lifecycle Management",
    task: "Frontend Dashboard API Integration",
    submittedBy: "Md. Sabik Hossen",
    file: "github.com/group5/captrack-frontend",
    submittedDate: "Jun 29, 2026",
    status: "Pending Feedback",
    priority: "High",
    message:
      "Review frontend dashboard integration, API connection plan, and deployment readiness for the next milestone.",
  },
  {
    group: "Group 5",
    project: "CapTrack: Capstone Project Lifecycle Management",
    task: "SRS Documentation Revised Copy",
    submittedBy: "Samira Akter",
    file: "srs_documentation_revised.pdf",
    submittedDate: "Jun 21, 2026",
    status: "Pending Feedback",
    priority: "Medium",
    message:
      "Check if system architecture diagram and database schema have been properly added in the revised SRS.",
  },
  {
    group: "Group 11",
    project: "InsightHub: Real-Time BI Dashboard for SMEs",
    task: "Prototype Demo",
    submittedBy: "Tanvir Rahman",
    file: "insighthub_demo_link.txt",
    submittedDate: "Jun 22, 2026",
    status: "Draft Feedback",
    priority: "Medium",
    message:
      "Prototype is functional, but the dashboard layout and chart labels need improvement before approval.",
  },
];

const statusStyles: Record<string, string> = {
  "Revision Needed": "bg-amber-50 text-amber-700",
  "Pending Feedback": "bg-blue-50 text-blue-700",
  "Draft Feedback": "bg-cyan-50 text-cyan-700",
  Resolved: "bg-emerald-50 text-emerald-700",
};

const priorityStyles: Record<string, string> = {
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-700",
};

export function FeedbackQueuePage() {
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

        <button className="flex items-center gap-2 rounded-full bg-[#0f5f8f] px-5 py-3 text-sm font-semibold text-white shadow-sm">
          <Send size={17} />
          Send Feedback
        </button>
      </div>

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
              placeholder="Search by group, task, student, file, or feedback status..."
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
          {feedbackQueue.map((item) => (
            <article
              key={`${item.group}-${item.task}`}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[item.status]
                      }`}
                    >
                      {item.status}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        priorityStyles[item.priority]
                      }`}
                    >
                      {item.priority} Priority
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {item.group}
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold text-slate-950">
                    {item.task}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {item.project}
                  </p>
                </div>

                <button className="flex items-center gap-2 rounded-xl bg-[#0f5f8f] px-5 py-3 text-sm font-semibold text-white">
                  <MessageSquare size={17} />
                  Write Feedback
                </button>
              </div>

              <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-4">
                <InfoItem label="Submitted By" value={item.submittedBy} />
                <InfoItem label="Group" value={item.group} />
                <InfoItem label="Submitted Date" value={item.submittedDate} />
                <InfoItem label="File / Link" value={item.file} />
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                {item.message}
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
                <textarea
                  placeholder="Write supervisor feedback here..."
                  className="h-28 resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none"
                />

                <div className="flex flex-col gap-3">
                  <button className="flex items-center justify-center gap-2 rounded-xl bg-[#0f5f8f] px-5 py-3 text-sm font-semibold text-white">
                    <Send size={17} />
                    Send
                  </button>

                  <button className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white">
                    <CheckCircle2 size={17} />
                    Resolve
                  </button>
                </div>
              </div>
            </article>
          ))}
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
              Group 5 has two high-priority feedback items. Review Sprint 1
              slides and frontend API integration before the next supervisor
              meeting.
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
              <RecentItem
                title="Project Proposal"
                group="Group 5"
                status="Approved"
              />
              <RecentItem
                title="Literature Review"
                group="Group 11"
                status="Approved"
              />
              <RecentItem
                title="Requirement Analysis"
                group="Group 19"
                status="Revision Needed"
              />
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