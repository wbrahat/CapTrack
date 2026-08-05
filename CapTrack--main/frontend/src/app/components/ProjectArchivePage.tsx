import {
  Archive,
  BookOpen,
  CalendarDays,
  ExternalLink,
  FileText,
  Filter,
  Github,
  Search,
  Tags,
  Users,
} from "lucide-react";

const archiveStats = [
  {
    label: "Archived Projects",
    value: "48",
    subtext: "Across all semesters",
    icon: <Archive size={20} />,
  },
  {
    label: "Active Domains",
    value: "12",
    subtext: "AI, Web, Database, IoT",
    icon: <Tags size={20} />,
  },
  {
    label: "Supervisors",
    value: "18",
    subtext: "Faculty supervision history",
    icon: <Users size={20} />,
  },
  {
    label: "Reports Stored",
    value: "42",
    subtext: "Final reports available",
    icon: <FileText size={20} />,
  },
];

const archivedProjects = [
  {
    title: "CapTrack: Capstone Project Lifecycle Management",
    semester: "Spring 2026",
    domain: "Software Engineering",
    supervisor: "Ahmed Adnan",
    group: "Group 5",
    teamSize: "6 members",
    status: "Ongoing",
    abstract:
      "A web-based capstone project lifecycle management system that supports student profile management, supervisor matching, collaboration feed, task tracking, submission review, and institutional project archiving.",
    report: "View Proposal",
    repository: "GitHub Repo",
  },
  {
    title: "AI-Based Student Performance Prediction",
    semester: "Spring 2025",
    domain: "Artificial Intelligence",
    supervisor: "Dr. Farhana Rahman",
    group: "Group 2",
    teamSize: "5 members",
    status: "Archived",
    abstract:
      "A machine learning system that predicts student academic performance using historical grades, attendance patterns, assessment scores, and course engagement indicators.",
    report: "View Report",
    repository: "GitHub Repo",
  },
  {
    title: "Smart Library Resource Scheduler",
    semester: "Fall 2025",
    domain: "Software Engineering",
    supervisor: "Md. Mahbub Hasan",
    group: "Group 8",
    teamSize: "4 members",
    status: "Archived",
    abstract:
      "A scheduling and resource allocation platform for university libraries, designed to manage study rooms, borrowing queues, digital resources, and seat availability.",
    report: "View Report",
    repository: "GitHub Repo",
  },
  {
    title: "Hospital Resource Management System",
    semester: "Summer 2025",
    domain: "Database",
    supervisor: "Dr. Nusrat Jahan",
    group: "Group 12",
    teamSize: "5 members",
    status: "Archived",
    abstract:
      "A hospital resource management system for tracking doctors, rooms, emergency resources, patient records, appointment schedules, and resource utilization.",
    report: "View Report",
    repository: "GitHub Repo",
  },
  {
    title: "InsightHub: Real-Time BI Dashboard for SMEs",
    semester: "Spring 2026",
    domain: "Data Analytics",
    supervisor: "Ahmed Adnan",
    group: "Group 11",
    teamSize: "5 members",
    status: "Ongoing",
    abstract:
      "A real-time business intelligence dashboard that helps small and medium enterprises monitor sales, inventory, customer trends, and financial performance.",
    report: "View Proposal",
    repository: "GitHub Repo",
  },
];

const domainStats = [
  ["Software Engineering", "16 projects"],
  ["Artificial Intelligence", "10 projects"],
  ["Database Systems", "8 projects"],
  ["Data Analytics", "7 projects"],
  ["IoT", "4 projects"],
];

const statusStyles: Record<string, string> = {
  Archived: "bg-emerald-50 text-emerald-700",
  Ongoing: "bg-blue-50 text-blue-700",
};

export function ProjectArchivePage() {
  return (
    <section className="min-h-screen bg-[#f3f6fa] px-8 py-8">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <div
            className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            CapTrack · Repository
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Project Archive
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            Explore previous capstone projects, project abstracts, supervisor
            history, semester records, reports, and repository references.
          </p>
        </div>

        <button className="flex items-center gap-2 rounded-full bg-[#0f5f8f] px-5 py-3 text-sm font-semibold text-white shadow-sm">
          <Archive size={17} />
          Add Archive Entry
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {archiveStats.map((item) => (
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
              placeholder="Search by project title, domain, supervisor, group, or semester..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            All Semesters
            <Filter size={16} />
          </button>

          <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            All Domains
            <Filter size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {archivedProjects.map((project) => (
            <article
              key={`${project.title}-${project.semester}`}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[project.status]
                      }`}
                    >
                      {project.status}
                    </span>

                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                      {project.domain}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {project.semester}
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold text-slate-950">
                    {project.title}
                  </h2>

                  <p className="mt-2 leading-7 text-slate-600">
                    {project.abstract}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                    <BookOpen size={16} />
                    {project.report}
                  </button>

                  <button className="flex items-center gap-2 rounded-xl bg-[#0f5f8f] px-4 py-2 text-sm font-semibold text-white">
                    <Github size={16} />
                    {project.repository}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-4">
                <InfoItem label="Supervisor" value={project.supervisor} />
                <InfoItem label="Group" value={project.group} />
                <InfoItem label="Team Size" value={project.teamSize} />
                <InfoItem label="Semester" value={project.semester} />
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Archive size={18} className="text-cyan-700" />
              <h3 className="text-lg font-semibold text-slate-950">
                Archive Purpose
              </h3>
            </div>

            <p className="leading-7 text-slate-600">
              The archive helps students explore previous work, helps
              supervisors review project history, and helps the department
              preserve institutional knowledge.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Tags size={18} className="text-cyan-700" />
              <h3 className="text-lg font-semibold text-slate-950">
                Popular Domains
              </h3>
            </div>

            <div className="space-y-3">
              {domainStats.map(([domain, count]) => (
                <div
                  key={domain}
                  className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-800">
                    {domain}
                  </span>

                  <span className="text-xs font-semibold text-cyan-700">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays size={18} className="text-cyan-700" />
              <h3 className="text-lg font-semibold text-slate-950">
                Recent Semesters
              </h3>
            </div>

            <div className="space-y-3">
              <SemesterItem semester="Spring 2026" count="8 projects" />
              <SemesterItem semester="Fall 2025" count="13 projects" />
              <SemesterItem semester="Summer 2025" count="9 projects" />
              <SemesterItem semester="Spring 2025" count="18 projects" />
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

function SemesterItem({
  semester,
  count,
}: {
  semester: string;
  count: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-800">{semester}</span>
      <span className="text-xs font-semibold text-slate-500">{count}</span>
    </div>
  );
}