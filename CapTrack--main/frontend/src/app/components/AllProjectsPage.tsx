import { useEffect, useMemo, useState, type ReactNode } from "react";
import axios from "axios";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Search,
  Users,
} from "lucide-react";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["x-auth-token"] = token;
  return config;
});

type DashboardResponse = {
  stats?: Array<{ label: string; value: string; color?: string }>;
  groupStatus?: {
    active: number;
    pendingSupervisor: number;
    submittedFinal: number;
    needsReview: number;
  };
  supervisorWorkload?: Array<{ name: string; email?: string; groups: number; max: number }>;
  recentActivity?: Array<{ time: string; actor: string; action: string; type: string }>;
  alerts?: Array<{ label: string; severity: string }>;
  groupProgress?: Array<{ group: string; progress: number }>;
  weeklySubmissions?: Array<{ week: string; submissions: number }>;
};

type AdminSubmissionItem = {
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
  feedback: string;
};

type ProjectCard = {
  group: string;
  title: string;
  domain: string;
  supervisor: string;
  members: string;
  progress: number;
  status: string;
  attention: string;
  lastUpdate: string;
  submissions: AdminSubmissionItem[];
  uniqueContributors: number;
};

const statusStyles: Record<string, string> = {
  Active: "bg-blue-50 text-blue-700",
  "Needs Review": "bg-amber-50 text-amber-700",
  "Submitted Final": "bg-emerald-50 text-emerald-700",
  "At Risk": "bg-red-50 text-red-700",
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
        {icon}
      </div>

      <div
        className="mb-2 text-xs uppercase tracking-wide text-slate-500"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        {label}
      </div>

      <div className="text-2xl font-semibold text-slate-950">{value}</div>
      <p className="mt-1 text-sm text-slate-500">{subtext}</p>
    </div>
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

function DistributionItem({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-800">{name}</span>
      <span className="text-xs font-semibold text-cyan-700">{value}</span>
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

function getDomain(title: string) {
  const value = title.toLowerCase();
  if (value.includes("ai") || value.includes("machine learning") || value.includes("prediction")) return "Artificial Intelligence";
  if (value.includes("iot") || value.includes("energy")) return "IoT";
  if (value.includes("hospital") || value.includes("medical")) return "Database Systems";
  if (value.includes("library")) return "Software Engineering";
  if (value.includes("dashboard") || value.includes("analytics") || value.includes("bi")) return "Data Analytics";
  return "Capstone Project";
}

function formatCountLabel(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function AllProjectsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [projects, setProjects] = useState<AdminSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [supervisorFilter, setSupervisorFilter] = useState("All Supervisors");
  const [domainFilter, setDomainFilter] = useState("All Domains");

  useEffect(() => {
    const loadAllProjects = async () => {
      try {
        setLoading(true);
        const [dashboardResponse, submissionsResponse] = await Promise.all([
          API.get("/admin/dashboard"),
          API.get("/submissions/admin"),
        ]);

        setDashboardData(dashboardResponse.data || {});
        setProjects(submissionsResponse.data?.submissions || []);
      } catch (err) {
        console.error("All Projects fetch error:", err);
        setError("Failed to load admin project overview.");
      } finally {
        setLoading(false);
      }
    };

    loadAllProjects();
  }, []);

  const groupedProjects = useMemo<ProjectCard[]>(() => {
    const progressMap = new Map(
      (dashboardData?.groupProgress || []).map((item) => [item.group, item.progress])
    );

    const groups = new Map<string, {
      group: string;
      title: string;
      supervisor: string;
      submissions: AdminSubmissionItem[];
      contributors: Set<string>;
    }>();

    projects.forEach((item) => {
      const key = item.group || item.project || item.title;
      const existing = groups.get(key);

      if (existing) {
        existing.submissions.push(item);
        existing.contributors.add(item.submittedBy);
        if (item.supervisor) existing.supervisor = item.supervisor;
        if (item.project) existing.title = item.project;
        return;
      }

      groups.set(key, {
        group: item.group,
        title: item.project || item.title,
        supervisor: item.supervisor,
        submissions: [item],
        contributors: new Set([item.submittedBy]),
      });
    });

    return Array.from(groups.values())
      .map((groupItem) => {
        const sortedSubmissions = [...groupItem.submissions].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });

        const latest = sortedSubmissions[0];
        const approvedCount = sortedSubmissions.filter((item) => item.status === "Approved").length;
        const revisionCount = sortedSubmissions.filter((item) => item.status === "Revision Needed").length;
        const pendingCount = sortedSubmissions.filter((item) => item.status === "Pending Review").length;
        const progress = progressMap.get(groupItem.group) ?? 0;
        const status = revisionCount > 0
          ? "Needs Review"
          : pendingCount > 0
            ? "Active"
            : approvedCount > 0
              ? "Submitted Final"
              : "Active";

        const attention = revisionCount > 0
          ? `${revisionCount} revision request${revisionCount === 1 ? "" : "s"}`
          : pendingCount > 0
            ? `${pendingCount} submission${pendingCount === 1 ? "" : "s"} pending review`
            : "On track";

        return {
          group: groupItem.group,
          title: groupItem.title || "Untitled Project",
          domain: getDomain(groupItem.title || latest?.project || ""),
          supervisor: groupItem.supervisor || "Not Assigned Yet",
          members: formatCountLabel(groupItem.contributors.size, "member", "members"),
          progress,
          status,
          attention,
          lastUpdate: latest ? `Latest update: ${latest.date}` : "No update yet",
          submissions: sortedSubmissions,
          uniqueContributors: groupItem.contributors.size,
        };
      })
      .sort((a, b) => b.progress - a.progress || a.group.localeCompare(b.group));
  }, [dashboardData?.groupProgress, projects]);

  const supervisors = useMemo(() => {
    const unique = new Map<string, string>();
    groupedProjects.forEach((project) => {
      if (!project.supervisor || project.supervisor === "Not Assigned Yet") return;
      unique.set(project.supervisor, project.supervisor);
    });
    return ["All Supervisors", ...Array.from(unique.keys()).sort()];
  }, [groupedProjects]);

  const domains = useMemo(() => {
    const unique = new Set(groupedProjects.map((project) => project.domain));
    return ["All Domains", ...Array.from(unique).sort()];
  }, [groupedProjects]);

  const filteredProjects = useMemo(() => {
    return groupedProjects.filter((project) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        [project.group, project.title, project.domain, project.supervisor, project.attention, project.lastUpdate]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus = statusFilter === "All Status" || project.status === statusFilter;
      const matchesSupervisor = supervisorFilter === "All Supervisors" || project.supervisor === supervisorFilter;
      const matchesDomain = domainFilter === "All Domains" || project.domain === domainFilter;

      return matchesSearch && matchesStatus && matchesSupervisor && matchesDomain;
    });
  }, [domainFilter, groupedProjects, search, statusFilter, supervisorFilter]);

  const totalProjects = groupedProjects.length;
  const activeProjects = groupedProjects.filter((project) => project.status === "Active").length;
  const completedProjects = groupedProjects.filter((project) => project.status === "Submitted Final").length;
  const needsAttention = groupedProjects.filter((project) => project.status === "Needs Review" || project.attention !== "On track").length;

  const statsFromDashboard = dashboardData?.stats || [];
  const alertList = dashboardData?.alerts || [];
  const workload = dashboardData?.supervisorWorkload || [];
  const recentActivity = dashboardData?.recentActivity || [];

  if (loading) {
    return (
      <section className="min-h-screen bg-[#f3f6fa] px-8 py-8 text-sm text-slate-500">
        Loading admin project overview...
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen bg-[#f3f6fa] px-8 py-8 text-sm text-red-600">
        {error}
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#f3f6fa] px-8 py-8">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <div
            className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            CapTrack - Admin
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            All Projects
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            Monitor all capstone groups, project progress, supervisor assignment, submission status, and attention-required items.
          </p>
        </div>

        <button className="flex items-center gap-2 rounded-full bg-[#0f5f8f] px-5 py-3 text-sm font-semibold text-white shadow-sm">
          <BarChart3 size={17} />
          Generate Report
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<BarChart3 size={20} />}
          label="Total Projects"
          value={String(totalProjects || Number(statsFromDashboard.find((item) => item.label === "Total Groups")?.value || 0))}
          subtext="Summer 2026 capstone"
        />
        <SummaryCard
          icon={<Clock size={20} />}
          label="Active Projects"
          value={String(activeProjects)}
          subtext={`${groupedProjects.filter((project) => project.progress < 100).length} still in progress`}
        />
        <SummaryCard
          icon={<CheckCircle2 size={20} />}
          label="Completed"
          value={String(completedProjects)}
          subtext="Final submitted"
        />
        <SummaryCard
          icon={<AlertCircle size={20} />}
          label="Needs Attention"
          value={String(needsAttention)}
          subtext="Pending or overdue"
        />
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by group, project title, supervisor, or domain..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full bg-transparent outline-none">
              <option>All Status</option>
              <option>Active</option>
              <option>Needs Review</option>
              <option>Submitted Final</option>
              <option>At Risk</option>
            </select>
            <Filter size={16} />
          </button>

          <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <select value={supervisorFilter} onChange={(event) => setSupervisorFilter(event.target.value)} className="w-full bg-transparent outline-none">
              {supervisors.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <Filter size={16} />
          </button>

          <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)} className="w-full bg-transparent outline-none">
              {domains.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <Filter size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              No projects match your filters.
            </div>
          ) : (
            filteredProjects.map((project) => {
              const statusClass = statusStyles[project.status] || "bg-slate-50 text-slate-700";

              return (
                <article
                  key={project.group}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
                          {project.status}
                        </span>

                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                          {project.domain}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {project.group}
                        </span>
                      </div>

                      <h2 className="text-xl font-semibold text-slate-950">
                        {project.title}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {project.lastUpdate}
                      </p>
                    </div>

                    <button className="flex items-center gap-2 rounded-xl bg-[#0f5f8f] px-4 py-2 text-sm font-semibold text-white">
                      <Eye size={16} />
                      View Details
                    </button>
                  </div>

                  <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-4">
                    <InfoItem label="Supervisor" value={project.supervisor} />
                    <InfoItem label="Members" value={project.members} />
                    <InfoItem label="Progress" value={`${project.progress}%`} />
                    <InfoItem label="Attention" value={project.attention} />
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600">
                        Project Progress
                      </span>

                      <span className="font-semibold text-cyan-700">
                        {project.progress}%
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-cyan-600"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div
                        className="mb-1 text-xs uppercase tracking-wide text-slate-500"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        Status Summary
                      </div>
                      <div className="text-sm font-medium text-slate-800">
                        {project.submissions.length} submissions tracked
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div
                        className="mb-1 text-xs uppercase tracking-wide text-slate-500"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        Latest File
                      </div>
                      <div className="truncate text-sm font-medium text-slate-800">
                        {project.submissions[0]?.file || "No file recorded"}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div
                        className="mb-1 text-xs uppercase tracking-wide text-slate-500"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        Contributors
                      </div>
                      <div className="text-sm font-medium text-slate-800">
                        {project.members}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-950">
                Admin Attention
              </h3>
            </div>

            {alertList.length === 0 ? (
              <p className="leading-7 text-slate-600">
                No urgent admin alerts right now.
              </p>
            ) : (
              <div className="space-y-3">
                {alertList.map((alert) => (
                  <div key={alert.label} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {alert.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Users size={18} className="text-cyan-700" />
              <h3 className="text-lg font-semibold text-slate-950">
                Supervisor Distribution
              </h3>
            </div>

            <div className="space-y-3">
              {workload.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No supervisors available.
                </div>
              ) : (
                workload.map((item) => (
                  <DistributionItem key={item.name} name={item.name} value={`${item.groups} groups`} />
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">
              Admin Checklist
            </h3>

            <div className="mt-5 space-y-3">
              {alertList.length > 0 ? (
                alertList.map((alert) => <ChecklistItem key={alert.label} text={alert.label} />)
              ) : (
                <ChecklistItem text="No urgent checklist items right now" />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Clock size={18} className="text-cyan-700" />
              <h3 className="text-lg font-semibold text-slate-950">
                Recent Activity
              </h3>
            </div>

            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No recent activity recorded.
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={`${activity.actor}-${activity.time}`} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <div className="font-medium text-slate-900">{activity.actor}</div>
                    <div>{activity.action}</div>
                    <div className="mt-1 text-xs text-slate-500">{activity.time}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
